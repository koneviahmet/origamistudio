<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { useSimKontrol, VIDEO_MOD } from '../../../composables/useSimKontrol.js'
import Icon from '../../../components/shell/Icon.vue'
import {
  SUN_RADIUS,
  SUN_LAYERS,
  SUNSPOT_CLUSTER,
} from './gunes-yapisi/config.js'
import {
  addSimulationPhoto,
  clearSimulationPhotos,
  getSimulationPhotos,
  removeSimulationPhoto,
} from '../../../lib/play/simulationPhotoAlbum.js'

const SIM_PHOTO_KEY = 'gunes-yapisi'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const CUT_GAP = Math.PI * 0.95
const MAX_PHOTOS = 8

const speed = ref(props.config.defaultSpeed ?? 0.3)
const cutawayOpen = ref(false)
const selectedLayerId = ref(null)
const showLabels = ref(false)
const photos = ref([...getSimulationPhotos(SIM_PHOTO_KEY)])
const galleryOpen = ref(false)
const flashVisible = ref(false)
const capturing = ref(false)
/** Gömülü diyalogda ayarlar, unlock gelene kadar gizli */
const controlsUnlocked = ref(!props.embedded)
const showControlsPanel = computed(() => !props.embedded || controlsUnlocked.value)

const selectedLayer = computed(() =>
  SUN_LAYERS.find((l) => l.id === selectedLayerId.value) ?? null,
)

const panelPulsing = computed(
  () =>
    showControlsPanel.value && (
      props.guideFocus === 'sim-panel'
      || props.guideFocus === 'cutaway'
      || props.guideFocus === 'sun'
    ),
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome'
    || props.guideFocus === 'sun',
)

watch(speed, (value) => {
  emit('simulation-event', { type: 'speed-change', speed: value })
})

watch(cutawayOpen, (open) => {
  emit('simulation-event', { type: open ? 'cutaway-open' : 'cutaway-close' })
  if (open) selectedLayerId.value = SUN_LAYERS[0]?.id ?? null
  else selectedLayerId.value = null
})

watch(
  () => props.simulationTask?.cutaway,
  (wantOpen) => {
    if (wantOpen === true && !cutawayOpen.value) openCutaway()
    else if (wantOpen === false && cutawayOpen.value) closeCutaway()
  },
)

watch(
  () => props.simulationTask?.showControls,
  (show) => {
    if (show) controlsUnlocked.value = true
  },
  { immediate: true },
)

let sunRoot = null
let intactMesh = null
let cutawayGroup = null
let spotsGroup = null
let activeCamera = null
let raycaster = null
let pointer = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let dragMoved = false
let cameraBeforeCutaway = null
const labelPositions = ref([])
const _proj = new THREE.Vector3()

const { canvasRef, ready, context } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  preserveDrawingBuffer: true,
  onInit({ renderer, scene, camera }) {
    if (VIDEO_MOD) renderer.setClearColor(0x000000, 0)
    else renderer.setClearColor(0x02040a)
    activeCamera = camera

    // Yakınlaştırılmış Güneş görünümü
    camera.position.set(0, 1.2, 6.2)
    camera.lookAt(0, 0, 0)
    cameraState = {
      yaw: 0.15,
      pitch: 0.18,
      distance: 6.4,
      target: new THREE.Vector3(0, 0, 0),
    }

    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    const ambient = new THREE.AmbientLight(0xffe8c8, 0.55)
    const key = new THREE.DirectionalLight(0xfff5e0, 1.2)
    key.position.set(4, 5, 6)
    const fill = new THREE.DirectionalLight(0xffaa66, 0.35)
    fill.position.set(-5, 2, -3)
    scene.add(ambient, key, fill)

    if (!VIDEO_MOD) addStarfield(scene)
    buildSun(scene)
  },

  onFrame({ camera, delta }) {
    activeCamera = camera
    updateCamera(camera)
    if (!cutawayOpen.value) {
      animateSun(delta)
    }
    updateLabels(camera)
  },

  onDispose({ scene }) {
    sunRoot = intactMesh = cutawayGroup = spotsGroup = null
    activeCamera = null
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

watch(ready, () => {}, { immediate: true })

/* ───────── Video modu (JSON ile yönetim) ─────────
 * Parametreler (zaman çizelgesi anahtarları):
 *   speed     0..2   Güneş'in kendi ekseni etrafında dönüş hızı (birikir; saat yönünün tersine; kesit açıkken durur)
 *   cutaway   bool   katman kesitini aç / kapat                      layer  vurgulanan katman id (bkz. config.js SUN_LAYERS)
 *   labels    bool   kesitte katman isimleri (kareye çizilir)        labelSize  isim yazı boyu (kare yüksekliği oranı, 0.03)
 *   yaw / pitch / distance  kamera (varsayılan 0.15 / 0.18 / 6.4; kesitte otomatik) — cutaway değişince yeniden uygulanır
 */
const videoEtiket = { size: 0.03 }

useSimKontrol({
  canvas: () => canvasRef.value,
  sifirla() {
    if (cutawayOpen.value) closeCutaway()
    cameraBeforeCutaway = null
    if (intactMesh) intactMesh.rotation.y = 0
    selectedLayerId.value = null
    showLabels.value = false
    speed.value = props.config.defaultSpeed ?? 0.3
    if (cameraState) {
      cameraState.yaw = 0.15
      cameraState.pitch = 0.18
      cameraState.distance = 6.4
      cameraState.target.set(0, 0, 0)
    }
    videoEtiket.size = 0.03
  },
  uygula(d, tum) {
    if ('speed' in d) speed.value = d.speed
    if ('labels' in d) showLabels.value = !!d.labels
    if ('labelSize' in d) videoEtiket.size = d.labelSize
    if ('cutaway' in d) {
      if (d.cutaway && !cutawayOpen.value) openCutaway()
      else if (!d.cutaway && cutawayOpen.value) closeCutaway()
    }
    if ('layer' in d) selectedLayerId.value = d.layer || null
    if (cameraState) {
      const tazele = 'cutaway' in d
      if ('yaw' in d || (tazele && tum.yaw !== undefined)) cameraState.yaw = tum.yaw
      if ('pitch' in d || (tazele && tum.pitch !== undefined)) cameraState.pitch = tum.pitch
      if ('distance' in d || (tazele && tum.distance !== undefined)) cameraState.distance = tum.distance
    }
  },
  cizim(ctx, w, h) {
    if (!showLabels.value || !cutawayOpen.value || !labelPositions.value.length) return
    const fs = Math.round(h * videoEtiket.size)
    ctx.save()
    ctx.font = `700 ${fs}px "Baloo 2", "Segoe UI", sans-serif`
    ctx.textBaseline = 'middle'
    for (const l of labelPositions.value) {
      const x0 = l.x + fs * 0.7
      const tw = ctx.measureText(l.name).width
      const pad = fs * 0.45
      ctx.fillStyle = '#3d3a73'
      ctx.fillRect(x0, l.y - fs * 0.07, fs * 3, fs * 0.14)
      const bx = x0 + fs * 3 + fs * 0.4
      ctx.fillStyle = l.active ? '#fff0a6' : 'rgba(255,250,238,0.95)'
      ctx.strokeStyle = l.active ? '#ff7f6e' : '#3d3a73'
      ctx.lineWidth = Math.max(2, fs * 0.1)
      ctx.beginPath()
      ctx.roundRect(bx, l.y - fs * 0.85, tw + pad * 2 + fs * 0.25, fs * 1.7, fs * 0.4)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = l.color
      ctx.fillRect(bx + fs * 0.12, l.y - fs * 0.6, fs * 0.22, fs * 1.2)
      ctx.fillStyle = '#3d3a73'
      ctx.fillText(l.name, bx + fs * 0.25 + pad, l.y + fs * 0.04)
    }
    ctx.restore()
  },
})

function addStarfield(scene) {
  const count = 1200
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const r = 40 + Math.random() * 80
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
    size: 0.26,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  })))
}

function createSunTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(size * 0.5, size * 0.45, 18, size * 0.5, size * 0.5, size * 0.55)
  g.addColorStop(0, '#fff4b0')
  g.addColorStop(0.35, '#ffc938')
  g.addColorStop(0.7, '#ff8a1a')
  g.addColorStop(1, '#d94a00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 180; i += 1) {
    ctx.fillStyle = `rgba(255,${120 + (Math.random() * 90 | 0)},30,${0.07 + Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, 3 + Math.random() * 18, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function latLonToVector(latDeg, lonDeg, radius) {
  const lat = THREE.MathUtils.degToRad(latDeg)
  const lon = THREE.MathUtils.degToRad(lonDeg)
  const cosLat = Math.cos(lat)
  return new THREE.Vector3(
    radius * cosLat * Math.sin(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.cos(lon),
  )
}

function vectorToLatLon(v) {
  const n = v.clone().normalize()
  const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)))
  const lon = THREE.MathUtils.radToDeg(Math.atan2(n.x, n.z))
  return { lat, lon }
}

/** Eşkenar üçgen köşelerinde 3 leke konumu (yüzey teğet düzleminde) */
function buildEquilateralSunspots() {
  const { centerLat, centerLon, radiusDeg, startAngleDeg, spots } = SUNSPOT_CLUSTER
  const center = latLonToVector(centerLat, centerLon, 1).normalize()
  // Teğet baz: doğu / kuzey
  const east = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), center)
  if (east.lengthSq() < 1e-8) east.set(1, 0, 0)
  else east.normalize()
  const north = new THREE.Vector3().crossVectors(center, east).normalize()

  const arc = THREE.MathUtils.degToRad(radiusDeg)
  const result = []
  for (let i = 0; i < 3; i += 1) {
    const angle = THREE.MathUtils.degToRad(startAngleDeg + i * 120)
    const offset = east.clone().multiplyScalar(Math.cos(angle) * arc)
      .add(north.clone().multiplyScalar(Math.sin(angle) * arc))
    const pos = center.clone().add(offset).normalize()
    const { lat, lon } = vectorToLatLon(pos)
    result.push({
      id: spots[i].id,
      lat,
      lon,
      umbra: spots[i].umbra,
      penumbra: spots[i].penumbra,
    })
  }
  return result
}

/** Yüzeye gömülü düz leke — umbra + yumuşak penumbra */
function createSurfaceSpot(spot) {
  const normal = latLonToVector(spot.lat, spot.lon, 1).normalize()
  const group = new THREE.Group()
  group.position.copy(normal).multiplyScalar(SUN_RADIUS * 1.0008)
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  group.userData = {
    type: 'sunspot',
    id: spot.id,
    name: `Güneş lekesi ${spot.id.toUpperCase()}`,
    info: 'Güneş lekesi — dönüş yönünü izlemek için işaretçi.',
  }

  const sharedMatProps = {
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    transparent: true,
  }

  const penumbra = new THREE.Mesh(
    new THREE.CircleGeometry(spot.penumbra, 32),
    new THREE.MeshBasicMaterial({
      ...sharedMatProps,
      color: 0x8a5a22,
      opacity: 0.42,
    }),
  )
  const mid = new THREE.Mesh(
    new THREE.CircleGeometry(spot.umbra * 1.55, 28),
    new THREE.MeshBasicMaterial({
      ...sharedMatProps,
      color: 0x3d2814,
      opacity: 0.55,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
    }),
  )
  mid.position.z = 0.0004
  const umbra = new THREE.Mesh(
    new THREE.CircleGeometry(spot.umbra, 24),
    new THREE.MeshBasicMaterial({
      ...sharedMatProps,
      color: 0x1a100a,
      opacity: 0.85,
      polygonOffsetFactor: -8,
      polygonOffsetUnits: -8,
    }),
  )
  umbra.position.z = 0.0008
  group.add(penumbra, mid, umbra)
  return group
}

function buildSun(scene) {
  sunRoot = new THREE.Group()
  scene.add(sunRoot)

  const sunMap = createSunTexture()
  intactMesh = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 64, 64),
    new THREE.MeshStandardMaterial({
      map: sunMap ?? undefined,
      color: sunMap ? 0xffffff : 0xffcc33,
      roughness: 0.62,
      metalness: 0.04,
      emissive: 0xffaa22,
      emissiveIntensity: 0.38,
    }),
  )
  intactMesh.userData = { type: 'sun', name: 'Güneş' }
  sunRoot.add(intactMesh)

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS * 1.12, 40, 40),
    new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  intactMesh.add(glow)

  // Eşkenar üçgen düzeninde 3 leke
  spotsGroup = new THREE.Group()
  intactMesh.add(spotsGroup)
  for (const spot of buildEquilateralSunspots()) {
    spotsGroup.add(createSurfaceSpot(spot))
  }

  cutawayGroup = buildCutaway()
  cutawayGroup.visible = false
  sunRoot.add(cutawayGroup)
  if (props.simulationTask?.cutaway) openCutaway()
}

function buildCutaway() {
  const group = new THREE.Group()
  for (const layer of SUN_LAYERS) {
    const r = SUN_RADIUS * layer.radiusFrac
    const isCore = !!layer.solid
    let geometry
    if (isCore) {
      geometry = new THREE.SphereGeometry(r, 40, 32)
    } else {
      const gapCenter = Math.PI / 2
      const phiStart = gapCenter + CUT_GAP / 2
      geometry = new THREE.SphereGeometry(r, 48, 36, phiStart, Math.PI * 2 - CUT_GAP)
    }

    const material = new THREE.MeshStandardMaterial({
      color: layer.color,
      roughness: layer.surface ? 0.55 : 0.48,
      metalness: 0.06,
      side: THREE.DoubleSide,
      map: layer.surface ? (intactMesh?.material?.map ?? null) : null,
    })
    if (layer.surface && material.map) material.color.set(0xffffff)

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = {
      type: 'layer',
      layerId: layer.id,
      name: layer.name,
      info: layer.desc,
    }
    group.add(mesh)
  }
  return group
}

function openCutaway() {
  if (!cameraState) return
  if (!cutawayOpen.value) {
    cameraBeforeCutaway = {
      yaw: cameraState.yaw,
      pitch: cameraState.pitch,
      distance: cameraState.distance,
      target: cameraState.target.clone(),
    }
  }

  cutawayOpen.value = true
  if (intactMesh) intactMesh.visible = false
  if (cutawayGroup) {
    cutawayGroup.visible = true
    cutawayGroup.rotation.set(0.22, -0.12, 0)
  }

  cameraState.target.set(0, 0, 0)
  cameraState.distance = Math.max(5.8, SUN_RADIUS * 4.4)
  cameraState.yaw = 0.28
  cameraState.pitch = 0.5
}

function closeCutaway() {
  cutawayOpen.value = false
  if (intactMesh) intactMesh.visible = true
  if (cutawayGroup) {
    cutawayGroup.visible = false
    cutawayGroup.rotation.set(0, 0, 0)
  }
  labelPositions.value = []

  if (cameraState && cameraBeforeCutaway) {
    cameraState.yaw = cameraBeforeCutaway.yaw
    cameraState.pitch = cameraBeforeCutaway.pitch
    cameraState.distance = cameraBeforeCutaway.distance
    cameraState.target.copy(cameraBeforeCutaway.target)
    cameraBeforeCutaway = null
  } else if (cameraState) {
    cameraState.target.set(0, 0, 0)
    cameraState.distance = 6.4
    cameraState.yaw = 0.15
    cameraState.pitch = 0.18
  }
}

function toggleCutaway() {
  if (cutawayOpen.value) closeCutaway()
  else openCutaway()
}

function selectLayer(layerId) {
  selectedLayerId.value = layerId
  const layer = SUN_LAYERS.find((l) => l.id === layerId)
  if (layer) {
    emit('simulation-event', {
      type: 'layer-select',
      layerId: layer.id,
      name: layer.name,
    })
  }
}

function animateSun(delta) {
  if (!intactMesh) return
  const rate = speed.value
  // Güneş kendi ekseni etrafında (soldan sağa görünür hareket için +Y)
  intactMesh.rotation.y += delta * 0.45 * rate
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

function updateLabels(camera) {
  if (!showLabels.value || !cutawayOpen.value || !cutawayGroup || !canvasRef.value) {
    if (labelPositions.value.length) labelPositions.value = []
    return
  }

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const next = []

  for (const layer of SUN_LAYERS) {
    const r = SUN_RADIUS * layer.radiusFrac * 0.88
    _proj.set(r * 0.55, r * 0.2, r * 0.55)
    cutawayGroup.localToWorld(_proj)
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

  next.sort((a, b) => a.y - b.y)
  for (let i = 1; i < next.length; i += 1) {
    if (next[i].y - next[i - 1].y < 28) next[i].y = next[i - 1].y + 28
  }
  labelPositions.value = next
}

function pickHit(event) {
  const canvas = canvasRef.value
  if (!canvas || !raycaster || !pointer || !activeCamera) return null
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, activeCamera)

  const targets = []
  if (intactMesh?.visible) targets.push(intactMesh)
  if (cutawayGroup?.visible) targets.push(...cutawayGroup.children)
  const hits = raycaster.intersectObjects(targets, true)
  if (!hits.length) return null

  let obj = hits[0].object
  while (obj && !obj.userData?.type) obj = obj.parent
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
  cameraState.pitch = Math.max(-0.35, Math.min(1.15, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  const min = cutawayOpen.value ? 4.2 : 4.5
  const max = cutawayOpen.value ? 14 : 12
  cameraState.distance = Math.max(min, Math.min(max, cameraState.distance + event.deltaY * 0.03))
}

function onClick(event) {
  if (dragMoved) return
  const data = pickHit(event)

  if (data?.type === 'layer' && data.layerId) {
    selectLayer(data.layerId)
    return
  }

  if (data?.type === 'sun' || data?.type === 'sunspot') {
    toggleCutaway()
    return
  }

  // Boş alana tık — kesit açıksa kapat
  if (cutawayOpen.value) closeCutaway()
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Blob oluşturulamadı'))),
      'image/jpeg',
      0.92,
    )
  })
}

async function takePhoto() {
  if (capturing.value || !context.value?.renderer || !canvasRef.value) return
  capturing.value = true

  try {
    const { renderer, scene, camera } = context.value
    // Güncel kareyi çiz, sonra oku
    updateCamera(camera)
    renderer.render(scene, camera)

    const blob = await canvasToBlob(canvasRef.value)
    const url = URL.createObjectURL(blob)
    const photo = {
      id: `sun-${Date.now()}`,
      blob,
      url,
      takenAt: Date.now(),
    }

    addSimulationPhoto(SIM_PHOTO_KEY, photo, { max: MAX_PHOTOS })
    photos.value = [...getSimulationPhotos(SIM_PHOTO_KEY)]

    flashVisible.value = true
    window.setTimeout(() => {
      flashVisible.value = false
    }, 160)

    emit('simulation-event', {
      type: 'photo-capture',
      count: photos.value.length,
    })
  } catch {
    // sessizce yoksay — tarayıcı engeli vb.
  } finally {
    capturing.value = false
  }
}

function openGallery() {
  if (!photos.value.length) return
  galleryOpen.value = true
}

function closeGallery() {
  galleryOpen.value = false
}

function removePhoto(id) {
  removeSimulationPhoto(SIM_PHOTO_KEY, id)
  photos.value = [...getSimulationPhotos(SIM_PHOTO_KEY)]
  if (!photos.value.length) galleryOpen.value = false
}

function clearPhotos() {
  clearSimulationPhotos(SIM_PHOTO_KEY)
  photos.value = []
  galleryOpen.value = false
}
</script>

<template>
  <div
    class="gy-scene"
    :class="{ 'gy-scene--embedded': embedded }"
  >
    <canvas
      ref="canvasRef"
      class="gy-scene__canvas"
      :class="{ 'gy-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
      @click="onClick"
    />

    <div
      v-if="!VIDEO_MOD && showLabels && cutawayOpen && labelPositions.length"
      class="gy-scene__labels"
    >
      <button
        v-for="label in labelPositions"
        :key="label.id"
        type="button"
        class="gy-scene__label"
        :class="{ 'gy-scene__label--active': label.active }"
        :style="{ left: `${label.x}px`, top: `${label.y}px`, '--swatch': label.color }"
        @click.stop="selectLayer(label.id)"
      >
        <span class="gy-scene__label-line" />
        <span class="gy-scene__label-text">{{ label.name }}</span>
      </button>
    </div>

    <div
      v-if="flashVisible"
      class="gy-scene__flash"
      aria-hidden="true"
    />

    <!-- Sol alt: çekilen fotoğraf önizlemeleri -->
    <div
      v-if="photos.length"
      class="gy-scene__thumbs"
    >
      <button
        v-for="(photo, index) in photos"
        :key="photo.id"
        type="button"
        class="gy-scene__thumb"
        :title="`Fotoğraf ${index + 1}`"
        @click.stop="openGallery"
      >
        <img
          :src="photo.url"
          :alt="`Güneş fotoğrafı ${index + 1}`"
        >
        <span class="gy-scene__thumb-num">{{ index + 1 }}</span>
      </button>
      <button
        type="button"
        class="gy-scene__thumbs-clear"
        title="Tüm fotoğrafları sil"
        @click.stop="clearPhotos"
      >
        Temizle
      </button>
    </div>

    <!-- Alt orta: kamera butonu -->
    <button
      v-if="!VIDEO_MOD"
      type="button"
      class="gy-scene__camera-btn"
      :disabled="capturing"
      :aria-label="capturing ? 'Çekiliyor…' : 'Fotoğraf çek'"
      title="Güneşin o anki konumunu fotoğrafla"
      @click.stop="takePhoto"
    >
      <Icon
        name="camera"
        :size="22"
      />
      <span
        v-if="photos.length"
        class="gy-scene__camera-badge"
      >{{ photos.length }}</span>
    </button>

    <!-- Büyük galeri: fotoğraflar yan yana -->
    <div
      v-if="galleryOpen"
      class="gy-scene__gallery"
      role="dialog"
      aria-modal="true"
      aria-label="Güneş fotoğrafları karşılaştırması"
      @click.self="closeGallery"
    >
      <div class="gy-scene__gallery-panel">
        <header class="gy-scene__gallery-head">
          <button
            type="button"
            class="gy-scene__gallery-clear"
            @click="clearPhotos"
          >
            Temizle
          </button>
          <button
            type="button"
            class="gy-scene__gallery-close"
            @click="closeGallery"
          >
            Kapat
          </button>
        </header>
        <div class="gy-scene__gallery-row">
          <figure
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="gy-scene__gallery-item"
          >
            <img
              :src="photo.url"
              :alt="`Güneş fotoğrafı ${index + 1}`"
            >
            <figcaption>
              <span>#{{ index + 1 }}</span>
              <button
                type="button"
                class="gy-scene__gallery-del"
                @click="removePhoto(photo.id)"
              >
                Sil
              </button>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>

    <aside
      v-if="showControlsPanel && !VIDEO_MOD"
      class="gy-scene__panel"
      :class="{ 'gy-scene__target--pulse': panelPulsing }"
    >
      <p class="gy-scene__title">
        Güneş
      </p>
      <p class="gy-scene__hint">
        Tıkla → katmanlar · altta kamera ile lekeleri karşılaştır
      </p>

      <label class="gy-scene__control">
        <span>Dönüş</span>
        <input
          v-model.number="speed"
          type="range"
          min="0"
          max="2.5"
          step="0.1"
          :disabled="cutawayOpen"
        >
        <span class="gy-scene__val">{{ cutawayOpen ? 'durdu' : `${speed.toFixed(1)}×` }}</span>
      </label>

      <label class="gy-scene__check">
        <input
          v-model="showLabels"
          type="checkbox"
        >
        <span>Katman isimlerini göster</span>
      </label>

      <button
        type="button"
        class="gy-scene__action"
        :class="{ 'gy-scene__action--active': cutawayOpen }"
        @click="toggleCutaway"
      >
        {{ cutawayOpen ? 'Katmanları kapat' : 'Katmanları aç' }}
      </button>

      <template v-if="cutawayOpen">
        <ul class="gy-scene__layer-list">
          <li
            v-for="layer in SUN_LAYERS"
            :key="layer.id"
          >
            <button
              type="button"
              class="gy-scene__layer-btn"
              :class="{ 'gy-scene__layer-btn--active': selectedLayerId === layer.id }"
              @click="selectLayer(layer.id)"
            >
              <span
                class="gy-scene__swatch"
                :style="{ background: `#${layer.color.toString(16).padStart(6, '0')}` }"
              />
              {{ layer.name }}
            </button>
          </li>
        </ul>
        <div
          v-if="selectedLayer"
          class="gy-scene__info"
        >
          <strong>{{ selectedLayer.name }}</strong>
          <p>{{ selectedLayer.desc }}</p>
        </div>
      </template>

      <div
        v-else
        class="gy-scene__info"
      >
        <strong>Güneş lekeleri</strong>
        <p>
          Yüzeydeki 3 koyu nokta Güneş ile birlikte döner. Lekelerin hareketinden dönüş yönünü görebilirsin.
        </p>
      </div>

      <ul
        v-if="!embedded && config.hints?.length && !cutawayOpen"
        class="gy-scene__hints"
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
.gy-scene {
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

.gy-scene--embedded {
  --sim-panel-bg: rgba(8, 12, 22, 0.9);
  contain: strict;
  transform: translateZ(0);
}

.gy-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.gy-scene__canvas:active {
  cursor: grabbing;
}

.gy-scene__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.gy-scene__label {
  position: absolute;
  display: flex;
  align-items: center;
  transform: translate(8px, -50%);
  pointer-events: auto;
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--sim-text-primary);
}

.gy-scene__label-line {
  width: 36px;
  height: 2px;
  background: #0f172a;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.gy-scene__label-text {
  margin-left: 6px;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid var(--sim-border);
  border-left: 3px solid var(--swatch, #94a3b8);
  font-size: 0.75rem;
  white-space: nowrap;
}

.gy-scene__label--active .gy-scene__label-text {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
}

.gy-scene__panel {
  position: absolute;
  right: max(0.85rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  width: min(240px, calc(100% - 1.5rem));
  max-height: min(70vh, 520px);
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

.gy-scene--embedded .gy-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  max-height: 55vh;
  border-color: rgba(56, 189, 248, 0.28);
}

.gy-scene--embedded .gy-scene__thumbs {
  left: calc(min(200px, 100% - 1.25rem) + 1.1rem);
}

.gy-scene__title {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--sim-accent-warm);
}

.gy-scene__hint {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  color: var(--sim-text-muted);
  line-height: 1.4;
}

.gy-scene__control {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
  font-size: 0.85rem;
}

.gy-scene__control input[type='range'] {
  width: 100%;
  accent-color: var(--sim-accent-warm);
}

.gy-scene__control input:disabled {
  opacity: 0.45;
}

.gy-scene__val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
  color: var(--sim-accent-warm);
  min-width: 2.8rem;
}

.gy-scene__check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
  font-size: 0.8rem;
  color: var(--sim-text-secondary);
  cursor: pointer;
}

.gy-scene__check input {
  accent-color: var(--sim-accent-cool);
}

.gy-scene__action {
  width: 100%;
  appearance: none;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.75);
  color: var(--sim-text-primary);
  font-size: 0.8rem;
  padding: 0.45rem 0.55rem;
  border-radius: 7px;
  cursor: pointer;
  margin-bottom: 0.55rem;
}

.gy-scene__action--active {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
  background: rgba(251, 191, 36, 0.12);
}

.gy-scene__layer-list {
  list-style: none;
  margin: 0 0 0.45rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.gy-scene__layer-btn {
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

.gy-scene__layer-btn--active {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
}

.gy-scene__swatch {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 3px;
  flex-shrink: 0;
}

.gy-scene__info {
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--sim-border);
}

.gy-scene__info strong {
  display: block;
  font-size: 0.88rem;
  color: var(--sim-accent-warm);
  margin-bottom: 0.2rem;
}

.gy-scene__info p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--sim-text-secondary);
  line-height: 1.45;
}

.gy-scene__hints {
  margin: 0.55rem 0 0;
  padding: 0 0 0 1rem;
  font-size: 0.72rem;
  color: var(--sim-text-muted);
  line-height: 1.45;
}

.gy-scene__target--pulse {
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

.gy-scene__flash {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.55);
  pointer-events: none;
  z-index: 8;
  animation: gy-flash 0.16s ease-out;
}

@keyframes gy-flash {
  from { opacity: 1; }
  to { opacity: 0; }
}

.gy-scene__thumbs {
  position: absolute;
  left: max(0.75rem, env(safe-area-inset-left));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-width: min(42vw, 280px);
  z-index: 4;
}

.gy-scene__thumb {
  position: relative;
  appearance: none;
  border: 1px solid rgba(251, 191, 36, 0.45);
  background: rgba(15, 23, 42, 0.85);
  padding: 0;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

.gy-scene__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gy-scene__thumb-num {
  position: absolute;
  left: 3px;
  top: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.15rem 0.28rem;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.75);
  color: var(--sim-accent-warm);
}

.gy-scene__camera-btn {
  position: absolute;
  left: 50%;
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  appearance: none;
  border: 1px solid rgba(251, 191, 36, 0.5);
  background: rgba(15, 23, 42, 0.88);
  color: var(--sim-accent-warm);
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
}

.gy-scene__camera-btn:hover:not(:disabled) {
  background: rgba(251, 191, 36, 0.16);
}

.gy-scene__camera-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

.gy-scene__camera-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: var(--sim-accent-warm);
  color: #0f172a;
  font-size: 0.65rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  line-height: 1;
}

.gy-scene__gallery {
  position: absolute;
  inset: 0;
  z-index: 12;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.gy-scene__gallery-panel {
  width: min(960px, 100%);
  max-height: min(88vh, 720px);
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--sim-border);
  background: rgba(15, 23, 42, 0.96);
  padding: 0.9rem 1rem 1rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.gy-scene__thumbs-clear {
  appearance: none;
  align-self: center;
  border: 1px solid rgba(248, 113, 113, 0.45);
  background: rgba(15, 23, 42, 0.88);
  color: #f87171;
  font-size: 0.7rem;
  padding: 0.35rem 0.5rem;
  border-radius: 7px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

.gy-scene__gallery-head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.gy-scene__gallery-clear,
.gy-scene__gallery-close {
  appearance: none;
  flex-shrink: 0;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.8);
  color: var(--sim-text-primary);
  font-size: 0.78rem;
  padding: 0.4rem 0.65rem;
  border-radius: 7px;
  cursor: pointer;
}

.gy-scene__gallery-clear {
  border-color: rgba(248, 113, 113, 0.45);
  color: #f87171;
}

.gy-scene__gallery-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.gy-scene__gallery-item {
  margin: 0;
  flex: 0 0 auto;
  width: min(280px, 72vw);
}

.gy-scene__gallery-item img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--sim-border);
  background: #020617;
}

.gy-scene__gallery-item figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.4rem;
  font-size: 0.78rem;
  color: var(--sim-text-secondary);
}

.gy-scene__gallery-del {
  appearance: none;
  border: none;
  background: transparent;
  color: #f87171;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.15rem 0.3rem;
}

@media (prefers-reduced-motion: reduce) {
  .gy-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }

  .gy-scene__flash {
    animation: none;
  }
}

@media (max-width: 640px) {
  .gy-scene__panel {
    left: max(0.5rem, env(safe-area-inset-left));
    right: max(0.5rem, env(safe-area-inset-right));
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    width: auto;
    max-height: 40vh;
  }

  .gy-scene__labels {
    display: none;
  }

  .gy-scene__camera-btn,
  .gy-scene__thumbs {
    bottom: calc(40vh + 0.75rem);
  }

  .gy-scene__thumbs {
    max-width: min(55vw, 200px);
  }

  .gy-scene__thumb {
    width: 44px;
    height: 44px;
  }
}
</style>
