<script setup>
import { ref, computed, watch, reactive } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { loadSimulationModels, modelKey } from '../../../lib/simulation/loadSimulationModels.js'
import Icon from '../../../components/shell/Icon.vue'
import {
  BODY_RADIUS,
  SPHERE_MODEL_RADIUS,
  DEPTH,
  BODIES,
  ASTRO_BODIES,
  MODE_EQUAL,
  MODE_ASTRO,
  GUIDE_FOCUS_ASTRO_MODE,
  SCENE,
} from './uzaklik-ve-gorunen-boyut/config.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const mode = ref(MODE_EQUAL)
const depths = reactive({
  a: DEPTH.defaultA,
  b: DEPTH.defaultB,
  sun: ASTRO_BODIES[0].defaultDepth,
  earth: ASTRO_BODIES[1].defaultDepth,
  moon: ASTRO_BODIES[2].defaultDepth,
})

const isAstro = computed(() => mode.value === MODE_ASTRO)

const activeBodies = computed(() => (isAstro.value ? ASTRO_BODIES : BODIES))

const panelPulsing = computed(
  () =>
    props.guideFocus === 'sim-panel'
    || props.guideFocus === GUIDE_FOCUS_ASTRO_MODE
    || props.guideFocus === 'body-a'
    || props.guideFocus === 'body-b'
    || props.guideFocus === 'welcome',
)

const canvasPulsing = computed(
  () => props.guideFocus === 'camera' || props.guideFocus === 'welcome',
)

const hintText = computed(() => {
  if (isAstro.value) {
    return 'Ay yakın · Güneş uzak — gerçekte Güneş çok daha büyük!'
  }
  return 'Başlangıç: en uç · Geri → uzaklaşır ve küçülür'
})

/** Kameraya uzaklık → görünen boyut ölçütü (yarıçap / mesafe) */
const apparent = computed(() => {
  const camZ = SCENE.cameraZ
  const camY = SCENE.cameraHeight
  const size = (x, z, radius) => {
    const dx = x
    const dy = 0 - camY
    const dz = z - camZ
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    return radius / Math.max(dist, 0.01)
  }

  const entries = activeBodies.value.map((body) => {
    const ang = size(body.x, depths[body.id], body.radius)
    return { id: body.id, ang }
  })
  const max = Math.max(...entries.map((e) => e.ang), 0.0001)
  const pct = Object.fromEntries(
    entries.map((e) => [e.id, Math.round((e.ang / max) * 100)]),
  )
  const lead = entries.reduce((best, e) => (e.ang > best.ang ? e : best), entries[0])
  return { pct, leadId: lead?.id ?? null }
})

watch(
  depths,
  () => {
    emit('simulation-event', {
      type: 'depth-change',
      mode: mode.value,
      ...depths,
    })
  },
  { deep: true },
)

/** id → Group */
const meshMap = new Map()
let sphereTemplate = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let cameraState = null
let sceneRef = null

const { canvasRef, ready } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  onInit({ renderer, scene, camera }) {
    sceneRef = scene
    renderer.setClearColor(0x02040a)

    // Kamera uzak ucun gerisinde; kürelere mesafe korunur, koridora (+Z) bakar
    const lookTarget = new THREE.Vector3(0, BODY_RADIUS * 0.4, SCENE.lookAtZ)
    camera.position.set(0, SCENE.cameraHeight, SCENE.cameraZ)
    camera.lookAt(lookTarget)

    const startDist = camera.position.distanceTo(lookTarget)
    const elev = camera.position.y - lookTarget.y
    cameraState = {
      // yaw=π → kamera hedefın −Z tarafında (uzak ucun gerisi)
      yaw: Math.PI,
      pitch: Math.asin(Math.min(0.95, Math.max(-0.2, elev / startDist))),
      distance: startDist,
      target: lookTarget,
    }

    const ambient = new THREE.AmbientLight(0xc8d4e8, 0.55)
    const key = new THREE.DirectionalLight(0xfff5e0, 1.15)
    key.position.set(4, 8, SCENE.cameraZ)
    const fill = new THREE.DirectionalLight(0x88aacc, 0.35)
    fill.position.set(-6, 2, SCENE.farZ)
    scene.add(ambient, key, fill)

    addStarfield(scene)
    addGround(scene)
    updateCamera(camera)
  },

  onFrame({ camera, delta }) {
    updateCamera(camera)
    for (const [id, mesh] of meshMap) {
      if (id in depths) mesh.position.z = depths[id]
      mesh.rotation.y += delta * (id === 'moon' ? 0.35 : id === 'earth' ? 0.2 : 0.12)
    }
  },

  onDispose({ scene }) {
    clearBodies()
    sphereTemplate = null
    sceneRef = null
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

watch(ready, async (isReady) => {
  if (!isReady || !sceneRef) return
  const models = await loadSimulationModels(props.config.models ?? [])
  sphereTemplate = models.get(modelKey('primitives', 'sphere'))
  if (!sphereTemplate || !sceneRef) return
  rebuildBodies()
}, { immediate: true })

watch(
  () => props.guideFocus,
  (focus) => {
    if (focus === GUIDE_FOCUS_ASTRO_MODE) setMode(MODE_ASTRO)
  },
  { immediate: true },
)

function clearBodies() {
  for (const mesh of meshMap.values()) {
    sceneRef?.remove(mesh)
  }
  meshMap.clear()
}

function rebuildBodies() {
  if (!sceneRef || !sphereTemplate) return
  clearBodies()
  for (const body of activeBodies.value) {
    const mesh = createBody(body, body.x, depths[body.id], body.radius)
    meshMap.set(body.id, mesh)
    sceneRef.add(mesh)
  }
}

function setMode(nextMode) {
  if (mode.value === nextMode) return
  mode.value = nextMode
  resetDepths({ silent: true })
  rebuildBodies()
  emit('simulation-event', { type: 'mode-change', mode: mode.value })
}

function toggleMode() {
  setMode(isAstro.value ? MODE_EQUAL : MODE_ASTRO)
}

function addStarfield(scene) {
  const count = 900
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const r = 40 + Math.random() * 90
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
    opacity: 0.8,
    sizeAttenuation: true,
  })))
}

function addGround(scene) {
  // Toprak: kamera gerisinden koridorun iç ucuna kadar
  const groundMinZ = SCENE.cameraZ - 1
  const groundMaxZ = SCENE.nearZ
  const length = groundMaxZ - groundMinZ
  const midZ = (groundMaxZ + groundMinZ) / 2
  const groundY = -BODY_RADIUS - 0.05

  const soil = new THREE.Mesh(
    new THREE.PlaneGeometry(SCENE.groundWidth, length, 24, 48),
    new THREE.MeshStandardMaterial({
      color: 0x5c4030,
      roughness: 0.95,
      metalness: 0.02,
    }),
  )
  soil.rotation.x = -Math.PI / 2
  soil.position.set(0, groundY, midZ)
  scene.add(soil)

  const grid = new THREE.GridHelper(Math.max(SCENE.groundWidth, length), 32, 0x6b5344, 0x4a3728)
  grid.position.set(0, groundY + 0.02, midZ)
  grid.scale.set(
    SCENE.groundWidth / Math.max(SCENE.groundWidth, length),
    1,
    length / Math.max(SCENE.groundWidth, length),
  )
  scene.add(grid)

  // En uç çizgisi — topların başlangıç hattı
  const edgeZ = DEPTH.min
  const edgeGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-SCENE.groundWidth / 2, groundY + 0.04, edgeZ),
    new THREE.Vector3(SCENE.groundWidth / 2, groundY + 0.04, edgeZ),
  ])
  scene.add(new THREE.Line(
    edgeGeo,
    new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 }),
  ))

  const span = DEPTH.max - DEPTH.min
  const marks = [0.15, 0.35, 0.55, 0.75, 0.95].map((t) => DEPTH.min + span * t)
  for (const z of marks) {
    const mark = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.42, 24),
      new THREE.MeshBasicMaterial({
        color: 0x8b7355,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      }),
    )
    mark.rotation.x = -Math.PI / 2
    mark.position.set(0, groundY + 0.03, z)
    scene.add(mark)
  }
}

function tintMesh(root, color, emissive, emissiveIntensity = 0.35) {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return
    const wasArray = Array.isArray(child.material)
    const mats = wasArray ? child.material : [child.material]
    const nextMats = mats.map((mat) => {
      const next = mat.clone()
      if (next.color) next.color.set(color)
      if (next.emissive) {
        next.emissive.set(emissive)
        next.emissiveIntensity = emissiveIntensity
      }
      next.roughness = 0.55
      next.metalness = 0.08
      return next
    })
    child.material = wasArray ? nextMats : nextMats[0]
  })
}

function createBody(def, x, z, radius = BODY_RADIUS) {
  const group = new THREE.Group()
  const groundY = -BODY_RADIUS - 0.05
  // Merkez yerden radius kadar yukarı — taban ortak zeminde
  group.position.set(x, groundY + radius, z)

  if (sphereTemplate) {
    const mesh = sphereTemplate.clone(true)
    const scale = radius / SPHERE_MODEL_RADIUS
    mesh.scale.setScalar(scale)
    // Katalog modeli tabanda y=0 → merkezi origin'e çek
    mesh.position.y = -radius
    tintMesh(mesh, def.color, def.emissive, def.id === 'sun' ? 0.55 : 0.35)
    mesh.userData.bodyId = def.id
    group.add(mesh)
  } else {
    const geo = new THREE.SphereGeometry(radius, 48, 36)
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.emissive,
      emissiveIntensity: def.id === 'sun' ? 0.55 : 0.35,
      roughness: 0.55,
      metalness: 0.08,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.userData.bodyId = def.id
    group.add(mesh)
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -radius + 0.02
  group.add(shadow)

  return group
}

function updateCamera(camera) {
  if (!cameraState) return
  const { yaw, pitch, distance, target } = cameraState
  const cy = Math.cos(pitch)
  camera.position.set(
    target.x + Math.sin(yaw) * cy * distance,
    target.y + Math.sin(pitch) * distance,
    target.z + Math.cos(yaw) * cy * distance,
  )
  camera.lookAt(target)
}

function nudge(bodyId, delta) {
  if (!(bodyId in depths)) return
  depths[bodyId] = Math.max(DEPTH.min, Math.min(DEPTH.max, +(depths[bodyId] + delta).toFixed(2)))
}

function resetDepths({ silent = false } = {}) {
  if (isAstro.value) {
    depths.sun = ASTRO_BODIES[0].defaultDepth
    depths.earth = ASTRO_BODIES[1].defaultDepth
    depths.moon = ASTRO_BODIES[2].defaultDepth
  } else {
    depths.a = DEPTH.defaultA
    depths.b = DEPTH.defaultB
  }
  if (!silent) emit('simulation-event', { type: 'reset', mode: mode.value })
}

function onPointerDown(event) {
  isDragging = true
  lastPointer = { x: event.clientX, y: event.clientY }
}

function onPointerUp() {
  isDragging = false
}

function onPointerMove(event) {
  if (!isDragging || !cameraState) return
  const dx = event.clientX - lastPointer.x
  const dy = event.clientY - lastPointer.y
  lastPointer = { x: event.clientX, y: event.clientY }
  cameraState.yaw -= dx * 0.005
  cameraState.pitch = Math.max(-0.2, Math.min(0.85, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  cameraState.distance = Math.max(6, Math.min(40, cameraState.distance + event.deltaY * 0.03))
}
</script>

<template>
  <div
    class="ug-scene"
    :class="{ 'ug-scene--embedded': embedded }"
  >
    <canvas
      ref="canvasRef"
      class="ug-scene__canvas"
      :class="{ 'ug-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
    />

    <aside
      class="ug-scene__panel"
      :class="{ 'ug-scene__target--pulse': panelPulsing }"
    >
      <p class="ug-scene__title">
        Uzaklık ve Görünen Boyut
      </p>
      <p class="ug-scene__hint">
        {{ hintText }}
      </p>

      <button
        type="button"
        class="ug-scene__action ug-scene__action--mode"
        :title="isAstro ? 'Eşit boyutlu iki küreye dön' : 'Güneş, Dünya ve Ay ölçekli küreleri yükle'"
        @click="toggleMode"
      >
        {{ isAstro ? 'Eşit kürelere dön' : 'Güneş · Dünya · Ay' }}
      </button>

      <div class="ug-scene__compare">
        <div
          v-for="body in activeBodies"
          :key="`bar-${body.id}`"
          class="ug-scene__bar-wrap"
          :class="{ 'ug-scene__bar-wrap--lead': apparent.leadId === body.id }"
        >
          <span
            class="ug-scene__bar-label"
            :class="`ug-scene__bar-label--${body.id}`"
          >{{ isAstro ? body.name[0] : body.name.slice(-1) }}</span>
          <div class="ug-scene__bar">
            <div
              class="ug-scene__bar-fill"
              :class="`ug-scene__bar-fill--${body.id}`"
              :style="{ width: `${apparent.pct[body.id] ?? 0}%` }"
            />
          </div>
          <span class="ug-scene__bar-pct">{{ apparent.pct[body.id] ?? 0 }}%</span>
        </div>
        <p class="ug-scene__compare-note">
          Göreli görünen boyut (büyük olan %100)
        </p>
      </div>

      <section
        v-for="body in activeBodies"
        :key="`ctrl-${body.id}`"
        class="ug-scene__body-ctrl"
        :class="{
          'ug-scene__body-ctrl--focus':
            guideFocus === `body-${body.id}`
            || (body.id === 'a' && guideFocus === 'body-a')
            || (body.id === 'b' && guideFocus === 'body-b'),
        }"
      >
        <header class="ug-scene__body-head">
          <span
            class="ug-scene__dot"
            :class="`ug-scene__dot--${body.id}`"
          />
          <strong>{{ body.name }}</strong>
        </header>
        <label class="ug-scene__control">
          <span>Derinlik</span>
          <input
            v-model.number="depths[body.id]"
            type="range"
            :min="DEPTH.min"
            :max="DEPTH.max"
            :step="DEPTH.step"
          >
        </label>
        <div class="ug-scene__move">
          <button
            type="button"
            class="ug-scene__move-btn"
            title="Uzaklaştır — koridorun içine (geri)"
            @click="nudge(body.id, DEPTH.step)"
          >
            <Icon
              name="arrowDown"
              :size="16"
            />
            Geri
          </button>
          <button
            type="button"
            class="ug-scene__move-btn"
            title="Yakınlaştır — kameraya doğru (ileri)"
            @click="nudge(body.id, -DEPTH.step)"
          >
            İleri
            <Icon
              name="arrowUp"
              :size="16"
            />
          </button>
        </div>
      </section>

      <button
        type="button"
        class="ug-scene__action"
        @click="resetDepths()"
      >
        Sıfırla
      </button>
    </aside>
  </div>
</template>

<style scoped>
.ug-scene {
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

.ug-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
}

.ug-scene__canvas:active {
  cursor: grabbing;
}

.ug-scene__panel {
  position: absolute;
  right: max(0.85rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  width: min(260px, calc(100% - 1.5rem));
  max-height: min(78vh, 580px);
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

.ug-scene--embedded .ug-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  width: min(220px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  max-height: 55vh;
  border-color: rgba(56, 189, 248, 0.28);
}

.ug-scene__title {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--sim-accent-warm);
}

.ug-scene__hint {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: var(--sim-text-secondary);
  line-height: 1.4;
}

.ug-scene__compare {
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.45);
}

.ug-scene__bar-wrap {
  display: grid;
  grid-template-columns: 1.2rem 1fr 2.4rem;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.ug-scene__bar-wrap--lead .ug-scene__bar-pct {
  color: var(--sim-accent-warm);
  font-weight: 700;
}

.ug-scene__bar-label {
  font-size: 0.72rem;
  font-weight: 700;
}

.ug-scene__bar-label--a { color: var(--sim-accent-warm); }
.ug-scene__bar-label--b { color: var(--sim-accent-cool); }
.ug-scene__bar-label--sun { color: #f59e0b; }
.ug-scene__bar-label--earth { color: #60a5fa; }
.ug-scene__bar-label--moon { color: #d1d5db; }

.ug-scene__bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.8);
  overflow: hidden;
}

.ug-scene__bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.15s ease;
}

.ug-scene__bar-fill--a { background: var(--sim-accent-warm); }
.ug-scene__bar-fill--b { background: var(--sim-accent-cool); }
.ug-scene__bar-fill--sun { background: #f59e0b; }
.ug-scene__bar-fill--earth { background: #3b82f6; }
.ug-scene__bar-fill--moon { background: #9ca3af; }

.ug-scene__bar-pct {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  color: var(--sim-text-secondary);
  text-align: right;
}

.ug-scene__compare-note {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: var(--sim-text-muted);
}

.ug-scene__body-ctrl {
  margin-bottom: 0.7rem;
  padding: 0.55rem 0.55rem 0.45rem;
  border-radius: 8px;
  border: 1px solid transparent;
  background: rgba(30, 41, 59, 0.4);
}

.ug-scene__body-ctrl--focus {
  border-color: rgba(56, 189, 248, 0.45);
}

.ug-scene__body-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
  font-size: 0.82rem;
}

.ug-scene__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.ug-scene__dot--a { background: var(--sim-accent-warm); }
.ug-scene__dot--b { background: var(--sim-accent-cool); }
.ug-scene__dot--sun { background: #f59e0b; }
.ug-scene__dot--earth { background: #3b82f6; }
.ug-scene__dot--moon { background: #d1d5db; }

.ug-scene__control {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  color: var(--sim-text-secondary);
}

.ug-scene__control input[type='range'] {
  width: 100%;
  accent-color: var(--sim-accent-cool);
}

.ug-scene__move {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}

.ug-scene__move-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 1px solid var(--sim-border);
  background: rgba(15, 23, 42, 0.75);
  color: var(--sim-text-primary);
  font-size: 0.75rem;
  padding: 0.4rem 0.35rem;
  border-radius: 7px;
  cursor: pointer;
}

.ug-scene__move-btn:hover {
  border-color: rgba(125, 211, 252, 0.45);
  color: var(--sim-accent-cool);
}

.ug-scene__action {
  width: 100%;
  appearance: none;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.75);
  color: var(--sim-text-primary);
  font-size: 0.8rem;
  padding: 0.45rem 0.55rem;
  border-radius: 7px;
  cursor: pointer;
}

.ug-scene__action:hover {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
}

.ug-scene__action--mode {
  margin-bottom: 0.75rem;
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
  font-weight: 600;
}

.ug-scene__action--mode:hover {
  border-color: #f59e0b;
  color: #fcd34d;
  background: rgba(245, 158, 11, 0.12);
}

.ug-scene__target--pulse {
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
  .ug-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }

  .ug-scene__bar-fill {
    transition: none;
  }
}

@media (max-width: 640px) {
  .ug-scene__panel {
    left: max(0.5rem, env(safe-area-inset-left));
    right: max(0.5rem, env(safe-area-inset-right));
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    width: auto;
    max-height: 42vh;
  }
}
</style>
