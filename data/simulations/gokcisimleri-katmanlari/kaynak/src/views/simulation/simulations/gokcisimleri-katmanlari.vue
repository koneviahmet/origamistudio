<script setup>
import { ref, shallowRef, computed, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { useSimKontrol, VIDEO_MOD } from '../../../composables/useSimKontrol.js'
import {
  BODY_LAYERS,
  BODY_LAYOUT,
  TEXTURE_PATHS,
  TEXTURE_FALLBACKS,
} from './gokcisimleri-katmanlari/layers.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

/** Kesit açılınca kalan "kapalı" dilim (radyan) — görseldeki gibi dilim çıkar */
const CUT_GAP = Math.PI * 0.95

const speed = ref(props.config.defaultSpeed ?? 0.6)
const cutawayBodyId = ref(null)
const selectedLayerId = ref(null)
const selectedBody = shallowRef(null)
/** Kesit üzerindeki katman isim etiketleri */
const showLabels = ref(false)

const cutawayBody = computed(() =>
  cutawayBodyId.value ? BODY_LAYERS[cutawayBodyId.value] : null,
)

const selectedLayer = computed(() => {
  if (!cutawayBody.value || !selectedLayerId.value) return null
  return cutawayBody.value.layers.find((l) => l.id === selectedLayerId.value) ?? null
})

const panelPulsing = computed(
  () =>
    props.guideFocus === 'sim-panel'
    || props.guideFocus === 'cutaway'
    || props.guideFocus === 'bodies',
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome'
    || props.guideFocus === 'bodies',
)

watch(speed, (value) => {
  emit('simulation-event', { type: 'speed-change', speed: value })
})

watch(cutawayBodyId, (id) => {
  if (id) {
    emit('simulation-event', { type: 'cutaway-open', bodyId: id })
    selectedLayerId.value = BODY_LAYERS[id].layers[0]?.id ?? null
  } else {
    emit('simulation-event', { type: 'cutaway-close' })
    selectedLayerId.value = null
  }
})

let bodyGroups = new Map()
let intactMeshes = new Map()
let cutawayGroups = new Map()
let textures = { sun: null, earth: null, moon: null }
let activeCamera = null
let raycaster = null
let pointer = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let dragMoved = false
let lastClickTime = 0
let lastClickBodyId = null
/** Kesit açılmadan önceki kamera — kapanınca geri yüklenir */
let cameraBeforeCutaway = null
const _proj = new THREE.Vector3()

const labelPositions = shallowRef([])

const { canvasRef, ready, context } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  onInit({ renderer, scene, camera }) {
    renderer.setClearColor(0x02040a)
    renderer.localClippingEnabled = false
    activeCamera = camera

    camera.position.set(0, 4.5, 12)
    camera.lookAt(0, 0, 0)
    cameraState = {
      yaw: 0.35,
      pitch: 0.32,
      distance: 13,
      target: new THREE.Vector3(0, 0, 0),
    }

    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    const ambient = new THREE.AmbientLight(0x99aabb, 0.75)
    const key = new THREE.DirectionalLight(0xfff5e0, 1.35)
    key.position.set(6, 10, 8)
    const fill = new THREE.DirectionalLight(0x6688cc, 0.45)
    fill.position.set(-8, 4, -6)
    scene.add(ambient, key, fill)

    addStarfield(scene)
    createBodies(scene)
  },

  onFrame({ camera, delta }) {
    activeCamera = camera
    updateCamera(camera)
    animateBodies(delta)
    updateLabels(camera)
  },

  onDispose({ scene }) {
    bodyGroups.clear()
    intactMeshes.clear()
    cutawayGroups.clear()
    activeCamera = null
    for (const key of Object.keys(textures)) {
      textures[key]?.dispose?.()
      textures[key] = null
    }
    if (scene) {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => m.dispose?.())
        }
      })
    }
  },
})

let dokuCoz = () => {}
const dokuHazir = new Promise((r) => { dokuCoz = r })

watch(ready, async (isReady) => {
  if (!isReady || !context.value?.scene) return
  await loadTextures()
  applySurfaceTextures()
  dokuCoz()
}, { immediate: true })

/* ───────── Video modu (JSON ile yönetim) ─────────
 * Parametreler (zaman çizelgesi anahtarları):
 *   speed     0..2   cisimlerin kendi etrafında dönüş hızı (kesit açıkken dönüş durur)
 *   cutaway   ''|'sun'|'earth'|'moon'   o cismin iç katman kesitini aç ('' = genel görünüm)
 *   layer     katman id (Güneş: corona·chromosphere·photosphere·core / Dünya: crust·mantle·outer-core·inner-core / Ay: bkz. layers.js)
 *   labels    bool   kesitte katman isimleri (kareye çizilir)        labelSize  isim yazı boyu (kare yüksekliği oranı, 0.03)
 *   yaw / pitch / distance   kamera (varsayılan genel: 0.35 / 0.32 / 13; kesitte cisme göre otomatik) — cutaway değişince yeniden uygulanır
 */
const videoEtiket = { size: 0.03 }

useSimKontrol({
  hazir: dokuHazir,
  canvas: () => canvasRef.value,
  sifirla() {
    setCutaway(null)
    cameraBeforeCutaway = null
    selectedLayerId.value = null
    selectedBody.value = null
    showLabels.value = false
    speed.value = props.config.defaultSpeed ?? 0.6
    for (const mesh of intactMeshes.values()) mesh.rotation.y = 0
    if (cameraState) {
      cameraState.yaw = 0.35
      cameraState.pitch = 0.32
      cameraState.distance = 13
      cameraState.target.set(0, 0, 0)
    }
    videoEtiket.size = 0.03
  },
  uygula(d, tum) {
    if ('speed' in d) speed.value = d.speed
    if ('labels' in d) showLabels.value = !!d.labels
    if ('labelSize' in d) videoEtiket.size = d.labelSize
    if ('cutaway' in d) setCutaway(d.cutaway || null)
    if ('layer' in d || 'cutaway' in d) {
      // cutawayBodyId izleyicisi ilk katmanı seçer; bizim seçimimiz ondan sonra gelmeli
      nextTick(() => {
        const kes = cutawayBodyId.value && BODY_LAYERS[cutawayBodyId.value]
        selectedLayerId.value = kes ? (tum.layer && kes.layers.some((l) => l.id === tum.layer) ? tum.layer : kes.layers[0]?.id) : null
      })
    }
    if (cameraState) {
      const tazele = 'cutaway' in d
      if ('yaw' in d || (tazele && tum.yaw !== undefined)) cameraState.yaw = tum.yaw
      if ('pitch' in d || (tazele && tum.pitch !== undefined)) cameraState.pitch = tum.pitch
      if ('distance' in d || (tazele && tum.distance !== undefined)) cameraState.distance = tum.distance
    }
  },
  cizim(ctx, w, h) {
    if (!showLabels.value || !cutawayBodyId.value || !labelPositions.value.length) return
    const fs = Math.round(h * videoEtiket.size)
    ctx.save()
    ctx.font = `700 ${fs}px "Baloo 2", "Segoe UI", sans-serif`
    ctx.textBaseline = 'middle'
    for (const l of labelPositions.value) {
      const x0 = l.x + fs * 0.7
      const tw = ctx.measureText(l.name).width
      const pad = fs * 0.45
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(x0, l.y - fs * 0.09, fs * 3, fs * 0.18)
      const bx = x0 + fs * 3 + fs * 0.4
      ctx.fillStyle = 'rgba(15,23,42,0.9)'
      ctx.beginPath()
      ctx.roundRect(bx, l.y - fs * 0.85, tw + pad * 2 + fs * 0.25, fs * 1.7, fs * 0.4)
      ctx.fill()
      ctx.fillStyle = l.color
      ctx.fillRect(bx, l.y - fs * 0.85, fs * 0.25, fs * 1.7)
      ctx.fillStyle = l.active ? '#fbbf24' : '#e2e8f0'
      ctx.fillText(l.name, bx + fs * 0.25 + pad, l.y + fs * 0.04)
    }
    ctx.restore()
  },
})

function loadOptionalTexture(loader, path) {
  return new Promise((resolve) => {
    loader.load(
      path,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        resolve(tex)
      },
      undefined,
      () => resolve(null),
    )
  })
}

async function loadTextureWithFallback(loader, local, fallback) {
  const a = await loadOptionalTexture(loader, local)
  if (a) return a
  if (fallback) return loadOptionalTexture(loader, fallback)
  return null
}

function createSunTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(size * 0.5, size * 0.45, 20, size * 0.5, size * 0.5, size * 0.55)
  g.addColorStop(0, '#fff4b0')
  g.addColorStop(0.4, '#ffc938')
  g.addColorStop(0.75, '#ff8a1a')
  g.addColorStop(1, '#d94a00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 160; i += 1) {
    ctx.fillStyle = `rgba(255,${120 + (Math.random() * 90 | 0)},30,${0.07 + Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, 3 + Math.random() * 16, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

async function loadTextures() {
  const loader = new THREE.TextureLoader()
  textures.sun = createSunTexture()
  textures.earth = await loadTextureWithFallback(loader, TEXTURE_PATHS.earth, TEXTURE_FALLBACKS.earth)
  textures.moon = await loadTextureWithFallback(loader, TEXTURE_PATHS.moon, TEXTURE_FALLBACKS.moon)
}

function applySurfaceTextures() {
  for (const [id, mesh] of intactMeshes) {
    const map = textures[id]
    if (!map || !mesh.material) continue
    mesh.material.map = map
    mesh.material.color.set(0xffffff)
    mesh.material.needsUpdate = true
  }
  for (const [id, group] of cutawayGroups) {
    const outer = group.children.find((c) => c.userData?.isOuterShell)
    if (!outer?.material) continue
    const map = textures[id]
    if (!map) continue
    outer.material.map = map
    outer.material.color.set(0xffffff)
    outer.material.needsUpdate = true
  }
}

function addStarfield(scene) {
  const count = 1400
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const r = 50 + Math.random() * 90
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.28,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  })))
}

function createBodies(scene) {
  for (const layout of BODY_LAYOUT) {
    const def = BODY_LAYERS[layout.id]
    const group = new THREE.Group()
    group.position.set(layout.x, layout.y, layout.z)
    group.userData.bodyId = layout.id
    scene.add(group)
    bodyGroups.set(layout.id, group)

    const intact = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius, 48, 48),
      new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: layout.id === 'moon' ? 0.9 : 0.55,
        metalness: 0.05,
        emissive: layout.id === 'sun' ? 0xffaa22 : 0x111122,
        emissiveIntensity: layout.id === 'sun' ? 0.55 : 0.08,
      }),
    )
    intact.userData = {
      type: 'body',
      id: def.id,
      name: def.name,
      info: def.info,
    }
    group.add(intact)
    intactMeshes.set(layout.id, intact)

    if (layout.id === 'sun') {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius * 1.18, 32, 32),
        new THREE.MeshBasicMaterial({
          color: 0xff9900,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      )
      intact.add(glow)
    }

    const cutaway = buildCutawayGroup(def)
    cutaway.visible = false
    group.add(cutaway)
    cutawayGroups.set(layout.id, cutaway)
  }
}

function buildCutawayGroup(def) {
  const group = new THREE.Group()
  group.name = `cutaway-${def.id}`

  // Katmanlar dıştan içe — her kabukta dilim eksik; çekirdek tam küre
  for (const layer of def.layers) {
    const r = def.radius * layer.radiusFrac
    const isCore = layer.solid || layer === def.layers[def.layers.length - 1]

    let geometry
    if (isCore) {
      geometry = new THREE.SphereGeometry(r, 40, 32)
    } else {
      // Dilim açıklığı +Z'ye (kameraya) baksın
      const gapCenter = Math.PI / 2
      const phiStart = gapCenter + CUT_GAP / 2
      geometry = new THREE.SphereGeometry(r, 48, 36, phiStart, Math.PI * 2 - CUT_GAP)
    }

    const material = layer.surface
      ? new THREE.MeshStandardMaterial({
          color: layer.color,
          roughness: 0.55,
          metalness: 0.05,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          color: layer.color,
          roughness: 0.48,
          metalness: 0.08,
          side: THREE.DoubleSide,
        })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = {
      type: 'layer',
      bodyId: def.id,
      layerId: layer.id,
      name: layer.name,
      info: layer.desc,
      isOuterShell: !!layer.surface,
      labelRadius: r * 0.92,
    }
    group.add(mesh)
  }

  return group
}

function restoreOverviewLayout() {
  for (const layout of BODY_LAYOUT) {
    const group = bodyGroups.get(layout.id)
    if (!group) continue
    group.visible = true
    group.position.set(layout.x, layout.y, layout.z)

    const intact = intactMeshes.get(layout.id)
    const cut = cutawayGroups.get(layout.id)
    if (intact) intact.visible = true
    if (cut) {
      cut.visible = false
      cut.rotation.set(0, 0, 0)
    }
  }
}

function setCutaway(bodyId) {
  if (!bodyId) {
    restoreOverviewLayout()
    cutawayBodyId.value = null
    selectedBody.value = null
    labelPositions.value = []

    if (cameraState) {
      if (cameraBeforeCutaway) {
        cameraState.yaw = cameraBeforeCutaway.yaw
        cameraState.pitch = cameraBeforeCutaway.pitch
        cameraState.distance = cameraBeforeCutaway.distance
        cameraState.target.copy(cameraBeforeCutaway.target)
        cameraBeforeCutaway = null
      } else {
        cameraState.target.set(0, 0, 0)
        cameraState.distance = 13
        cameraState.yaw = 0.35
        cameraState.pitch = 0.32
      }
    }
    return
  }

  // Kamerayı kaydet (yalnızca kesite ilk girişte)
  if (!cutawayBodyId.value && cameraState) {
    cameraBeforeCutaway = {
      yaw: cameraState.yaw,
      pitch: cameraState.pitch,
      distance: cameraState.distance,
      target: cameraState.target.clone(),
    }
  }

  // Diğer cisimleri gizle; seçileni merkeze al
  for (const [id, group] of bodyGroups) {
    if (id === bodyId) {
      group.visible = true
      group.position.set(0, 0, 0)
    } else {
      group.visible = false
    }

    const intact = intactMeshes.get(id)
    const cut = cutawayGroups.get(id)
    if (id === bodyId) {
      if (intact) intact.visible = false
      if (cut) {
        cut.visible = true
        // Hafif eğim: katman kalınlıkları yukarıdan görünsün, dilim kameraya açık
        cut.rotation.set(0.22, -0.12, 0)
      }
    } else {
      if (intact) intact.visible = true
      if (cut) {
        cut.visible = false
        cut.rotation.set(0, 0, 0)
      }
    }
  }

  cutawayBodyId.value = bodyId
  const def = BODY_LAYERS[bodyId]
  selectedBody.value = { id: def.id, name: def.name, info: def.info }

  // Merkezdeki cismi katmanları net görecek açıdan bak
  if (cameraState) {
    cameraState.target.set(0, 0, 0)
    cameraState.distance = Math.max(5.5, def.radius * 4.8)
    cameraState.yaw = 0.28
    cameraState.pitch = 0.5
  }

  emit('simulation-event', {
    type: 'body-select',
    bodyId: def.id,
    name: def.name,
  })
}

function closeCutaway() {
  setCutaway(null)
}

function selectLayer(layerId) {
  selectedLayerId.value = layerId
  const layer = cutawayBody.value?.layers.find((l) => l.id === layerId)
  if (layer) {
    emit('simulation-event', {
      type: 'body-select',
      bodyId: cutawayBodyId.value,
      layerId: layer.id,
      name: layer.name,
    })
  }
}

function updateLabels(camera) {
  if (!showLabels.value || !cutawayBodyId.value || !canvasRef.value) {
    if (labelPositions.value.length) labelPositions.value = []
    return
  }

  const group = bodyGroups.get(cutawayBodyId.value)
  const cut = cutawayGroups.get(cutawayBodyId.value)
  const def = BODY_LAYERS[cutawayBodyId.value]
  if (!group || !cut || !def) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const next = []

  for (const layer of def.layers) {
    const r = def.radius * layer.radiusFrac * 0.88
    // Kesit açıklığının görünen kenarına yakın nokta (cutaway yerel uzayı)
    _proj.set(r * 0.55, r * 0.2, r * 0.55)
    cut.localToWorld(_proj)
    _proj.project(camera)

    const x = (_proj.x * 0.5 + 0.5) * rect.width
    const y = (-_proj.y * 0.5 + 0.5) * rect.height
    if (_proj.z > 1) continue

    next.push({
      id: layer.id,
      name: layer.name,
      color: `#${layer.color.toString(16).padStart(6, '0')}`,
      x,
      y,
      active: selectedLayerId.value === layer.id,
    })
  }

  // Y konumlarını ayır (çakışmasın)
  next.sort((a, b) => a.y - b.y)
  for (let i = 1; i < next.length; i += 1) {
    if (next[i].y - next[i - 1].y < 28) {
      next[i].y = next[i - 1].y + 28
    }
  }

  labelPositions.value = next
}

function updateCamera(camera) {
  if (!cameraState) return
  const { yaw, pitch, distance, target } = cameraState
  const cosPitch = Math.cos(pitch)
  camera.position.set(
    target.x + distance * cosPitch * Math.sin(yaw),
    target.y + distance * Math.sin(pitch),
    target.z + distance * cosPitch * Math.cos(yaw),
  )
  camera.lookAt(target)
}

function animateBodies(delta) {
  // Kesit açıkken dönüş durur — katmanlar sabit kalır
  if (cutawayBodyId.value) return

  const rate = speed.value
  for (const [id, mesh] of intactMeshes) {
    if (!mesh.visible) continue
    mesh.rotation.y += delta * (id === 'sun' ? 0.25 : id === 'earth' ? 0.55 : 0.4) * rate
  }
}

function pickBody(event) {
  const canvas = canvasRef.value
  if (!canvas || !raycaster || !pointer || !activeCamera) return null

  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, activeCamera)

  const targets = []
  for (const [id, intact] of intactMeshes) {
    if (intact.visible) targets.push(intact)
  }
  for (const [, cut] of cutawayGroups) {
    if (cut.visible) targets.push(...cut.children)
  }

  const hits = raycaster.intersectObjects(targets, true)
  if (!hits.length) return null

  let obj = hits[0].object
  while (obj && !obj.userData?.id && !obj.userData?.layerId && !obj.userData?.bodyId) {
    obj = obj.parent
  }
  return obj?.userData ?? null
}

function onPointerDown(event) {
  isDragging = true
  dragMoved = false
  lastPointer = { x: event.clientX, y: event.clientY }
}

function onPointerUp() {
  isDragging = false
}

function onPointerMove(event) {
  if (!isDragging || !cameraState) return
  const dx = event.clientX - lastPointer.x
  const dy = event.clientY - lastPointer.y
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true
  lastPointer = { x: event.clientX, y: event.clientY }
  cameraState.yaw -= dx * 0.005
  cameraState.pitch = Math.max(-0.2, Math.min(1.2, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  const min = cutawayBodyId.value ? 2.8 : 6
  const max = cutawayBodyId.value ? 18 : 28
  cameraState.distance = Math.max(min, Math.min(max, cameraState.distance + event.deltaY * 0.035))
}

function onClick(event) {
  if (dragMoved) return

  const data = pickBody(event)
  const now = performance.now()
  const isDouble = now - lastClickTime < 380

  if (isDouble) {
    lastClickTime = 0

    // Kesit açıkken: herhangi bir yere çift tık → önceki genel görünüme dön
    if (cutawayBodyId.value) {
      closeCutaway()
      lastClickBodyId = null
      return
    }

    // Genel görünümde: gök cismine çift tık → merkeze al + katmanlar
    const bodyId = (data?.type === 'body' && data.id)
      || (lastClickBodyId && BODY_LAYERS[lastClickBodyId] ? lastClickBodyId : null)
    if (bodyId) {
      setCutaway(bodyId)
      lastClickBodyId = null
      return
    }

    lastClickBodyId = null
    return
  }

  lastClickTime = now
  lastClickBodyId = data?.type === 'body' ? data.id : null

  // Katman tıklaması (kesit açıkken)
  if (data?.type === 'layer' && data.layerId) {
    selectLayer(data.layerId)
    return
  }

  if (data?.type === 'body' && data.id) {
    selectedBody.value = {
      id: data.id,
      name: data.name,
      info: data.info,
    }
    emit('simulation-event', {
      type: 'body-select',
      bodyId: data.id,
      name: data.name,
    })
  }
}

function openCutawayFromPanel(bodyId) {
  if (cutawayBodyId.value === bodyId) closeCutaway()
  else setCutaway(bodyId)
}
</script>

<template>
  <div
    class="katman-scene"
    :class="{ 'katman-scene--embedded': embedded }"
  >
    <canvas
      ref="canvasRef"
      class="katman-scene__canvas"
      :class="{ 'katman-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
      @click="onClick"
      @dblclick.prevent
    />

    <!-- Kesit etiketleri (canvas üzerinde) -->
    <div
      v-if="!VIDEO_MOD && showLabels && cutawayBodyId && labelPositions.length"
      class="katman-scene__labels"
    >
      <button
        v-for="label in labelPositions"
        :key="label.id"
        type="button"
        class="katman-scene__label"
        :class="{ 'katman-scene__label--active': label.active }"
        :style="{
          left: `${label.x}px`,
          top: `${label.y}px`,
          '--swatch': label.color,
        }"
        @click.stop="selectLayer(label.id)"
      >
        <span class="katman-scene__label-line" />
        <span class="katman-scene__label-text">{{ label.name }}</span>
      </button>
    </div>

    <aside
      v-if="!VIDEO_MOD"
      class="katman-scene__panel"
      :class="{ 'katman-scene__target--pulse': panelPulsing }"
    >
      <p class="katman-scene__label-title">
        Cisimler
      </p>
      <div class="katman-scene__picks">
        <button
          v-for="id in ['sun', 'earth', 'moon']"
          :key="id"
          type="button"
          class="katman-scene__pick"
          :class="{
            'katman-scene__pick--active': cutawayBodyId === id || selectedBody?.id === id,
            'katman-scene__pick--cutaway': cutawayBodyId === id,
          }"
          @click="openCutawayFromPanel(id)"
        >
          {{ BODY_LAYERS[id].name }}
        </button>
      </div>
      <p class="katman-scene__hint-line">
        Çift tıkla → katmanlar · boş alana çift tıkla → geri
      </p>

      <label class="katman-scene__control">
        <span>Dönüş</span>
        <input
          v-model.number="speed"
          type="range"
          min="0"
          max="2"
          step="0.1"
        >
        <span class="katman-scene__val">{{ speed.toFixed(1) }}×</span>
      </label>

      <label class="katman-scene__check">
        <input
          v-model="showLabels"
          type="checkbox"
        >
        <span>Katman isimlerini göster</span>
      </label>

      <template v-if="cutawayBody">
        <div class="katman-scene__cutaway-head">
          <strong>{{ cutawayBody.name }} — katmanlar</strong>
          <button
            type="button"
            class="katman-scene__close"
            @click="closeCutaway"
          >
            Kapat
          </button>
        </div>
        <ul class="katman-scene__layer-list">
          <li
            v-for="layer in cutawayBody.layers"
            :key="layer.id"
          >
            <button
              type="button"
              class="katman-scene__layer-btn"
              :class="{ 'katman-scene__layer-btn--active': selectedLayerId === layer.id }"
              @click="selectLayer(layer.id)"
            >
              <span
                class="katman-scene__swatch"
                :style="{ background: `#${layer.color.toString(16).padStart(6, '0')}` }"
              />
              {{ layer.name }}
            </button>
          </li>
        </ul>
        <div
          v-if="selectedLayer"
          class="katman-scene__info"
        >
          <strong>{{ selectedLayer.name }}</strong>
          <p>{{ selectedLayer.desc }}</p>
        </div>
      </template>

      <div
        v-else-if="selectedBody"
        class="katman-scene__info"
      >
        <strong>{{ selectedBody.name }}</strong>
        <p>{{ selectedBody.info }}</p>
      </div>

      <ul
        v-if="!embedded && config.hints?.length && !cutawayBody"
        class="katman-scene__hints"
      >
        <li
          v-for="hint in config.hints"
          :key="hint"
        >
          {{ hint }}
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.katman-scene {
  --sim-border: rgba(148, 163, 184, 0.2);
  --sim-panel-bg: rgba(15, 23, 42, 0.9);
  --sim-text-primary: #cbd5e1;
  --sim-text-secondary: #94a3b8;
  --sim-text-muted: #64748b;
  --sim-accent-warm: #fbbf24;
  --sim-accent-cool: #7dd3fc;

  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.katman-scene--embedded {
  --sim-panel-bg: rgba(8, 12, 22, 0.9);
  contain: strict;
  transform: translateZ(0);
}

.katman-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.katman-scene__canvas:active {
  cursor: grabbing;
}

.katman-scene__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.katman-scene__label {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0;
  transform: translate(8px, -50%);
  pointer-events: auto;
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--sim-text-primary);
}

.katman-scene__label-line {
  width: 36px;
  height: 2px;
  background: #0f172a;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
}

.katman-scene__label-text {
  margin-left: 6px;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid var(--sim-border);
  border-left: 3px solid var(--swatch, #94a3b8);
  font-size: 0.75rem;
  white-space: nowrap;
}

.katman-scene__label--active .katman-scene__label-text {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
}

.katman-scene__panel {
  position: absolute;
  right: max(0.85rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  width: min(250px, calc(100% - 1.5rem));
  max-height: min(72vh, 540px);
  overflow-y: auto;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--sim-border);
  background: var(--sim-panel-bg);
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  color: var(--sim-text-primary);
  z-index: 3;
}

.katman-scene--embedded .katman-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  max-height: 55vh;
  border-color: rgba(56, 189, 248, 0.28);
}

.katman-scene__label-title {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sim-accent-cool);
}

.katman-scene__picks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.katman-scene__pick {
  appearance: none;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.7);
  color: var(--sim-text-primary);
  font-size: 0.75rem;
  padding: 0.28rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.katman-scene__pick--active {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
}

.katman-scene__pick--cutaway {
  background: rgba(251, 191, 36, 0.14);
}

.katman-scene__hint-line {
  margin: 0.4rem 0 0.65rem;
  font-size: 0.72rem;
  color: var(--sim-text-muted);
}

.katman-scene__control {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
  font-size: 0.85rem;
}

.katman-scene__control input[type='range'] {
  width: 100%;
  accent-color: var(--sim-accent-warm);
}

.katman-scene__check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
  font-size: 0.8rem;
  color: var(--sim-text-secondary);
  cursor: pointer;
}

.katman-scene__check input {
  accent-color: var(--sim-accent-cool);
}

.katman-scene__val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  color: var(--sim-accent-warm);
  min-width: 2.4rem;
}

.katman-scene__cutaway-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  font-size: 0.85rem;
  color: var(--sim-accent-warm);
}

.katman-scene__close {
  appearance: none;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.8);
  color: var(--sim-text-secondary);
  font-size: 0.72rem;
  padding: 0.2rem 0.45rem;
  border-radius: 5px;
  cursor: pointer;
}

.katman-scene__layer-list {
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.katman-scene__layer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  appearance: none;
  border: 1px solid transparent;
  background: rgba(30, 41, 59, 0.55);
  color: var(--sim-text-primary);
  font-size: 0.78rem;
  padding: 0.35rem 0.45rem;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
}

.katman-scene__layer-btn--active {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
}

.katman-scene__swatch {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 3px;
  flex-shrink: 0;
}

.katman-scene__info {
  margin-top: 0.35rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--sim-border);
}

.katman-scene__info strong {
  display: block;
  font-size: 0.9rem;
  color: var(--sim-accent-warm);
  margin-bottom: 0.2rem;
}

.katman-scene__info p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--sim-text-secondary);
  line-height: 1.45;
}

.katman-scene__hints {
  margin: 0.55rem 0 0;
  padding: 0 0 0 1rem;
  font-size: 0.72rem;
  color: var(--sim-text-muted);
  line-height: 1.45;
}

.katman-scene__target--pulse {
  animation: sim-guide-pulse 1.6s ease-in-out infinite;
}

@keyframes sim-guide-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
  50% {
    box-shadow:
      0 0 0 2px rgba(56, 189, 248, 0.55),
      0 0 20px rgba(56, 189, 248, 0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .katman-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}

@media (max-width: 640px) {
  .katman-scene__panel {
    left: max(0.5rem, env(safe-area-inset-left));
    right: max(0.5rem, env(safe-area-inset-right));
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    width: auto;
    max-height: 40vh;
  }

  .katman-scene__labels {
    display: none;
  }
}
</style>
