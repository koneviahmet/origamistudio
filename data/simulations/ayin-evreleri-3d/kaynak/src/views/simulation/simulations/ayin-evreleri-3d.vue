<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { useScoreStore } from '../../../stores/scoreStore.js'
import {
  MOON_PHASES,
  MOON_PHASE_ANGLES,
  SCENE,
  TEXTURE_PATHS,
  TEXTURE_FALLBACKS,
} from './ayin-evreleri-3d/constants.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const { award } = useScoreStore()

const bootError = ref(null)
const isPlaying = ref(false)
const speed = ref(props.config.defaultSpeed ?? 0.5)
const currentPhase = ref(0)
const trackMoon = ref(false)

const activePhase = computed(() => MOON_PHASES[currentPhase.value])

const panelPulsing = computed(
  () =>
    props.guideFocus === 'panel'
    || props.guideFocus === 'speed'
    || props.guideFocus === 'phase'
    || props.guideFocus === 'play',
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome',
)

const playPulsing = computed(() => props.guideFocus === 'play')

// ── Three.js referansları ──
let sceneRoot = null
let sunMesh = null
let earthMesh = null
let moonMesh = null
let earthOrbit = null
let moonOrbit = null
let sunLight = null
let activeCamera = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }

let earthAngle = 0
let moonAngle = Math.PI
let lastReportedPhase = 0

function loadOptionalTexture(loader, path) {
  return new Promise((resolve) => {
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        resolve(texture)
      },
      undefined,
      () => resolve(null),
    )
  })
}

async function loadTextureWithFallback(loader, localPath, fallbackPath) {
  const local = await loadOptionalTexture(loader, localPath)
  if (local) return local
  if (fallbackPath) return loadOptionalTexture(loader, fallbackPath)
  return null
}

function createOrbitLine(radius, color = 0x334155) {
  const segments = 96
  const positions = new Float32Array((segments + 1) * 3)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    positions[i * 3] = radius * Math.cos(angle)
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = radius * Math.sin(angle)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })
  return new THREE.Line(geometry, material)
}

function addStarfield(parent) {
  const count = 1600
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 70 + Math.random() * 90
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.32,
    transparent: true,
    opacity: 0.82,
    sizeAttenuation: true,
  })
  parent.add(new THREE.Points(geometry, material))
}

function createAtmosphere(radius, color = 0x7dd3fc, opacity = 0.28) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 48, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  return mesh
}

function createBodyRim(radius, color = 0xffffff, opacity = 0.12) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.04, 48, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
}

function createSunGlow(radius) {
  const group = new THREE.Group()
  const layers = [
    { scale: 1.25, color: 0xffaa33, opacity: 0.3 },
    { scale: 1.55, color: 0xff7700, opacity: 0.12 },
  ]
  for (const layer of layers) {
    const geo = new THREE.SphereGeometry(radius * layer.scale, 32, 32)
    const mat = new THREE.MeshBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: layer.opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    group.add(new THREE.Mesh(geo, mat))
  }
  return group
}

async function buildCelestialBodies(parent) {
  const loader = new THREE.TextureLoader()
  const [earthMap, earthNormal, earthClouds, moonMap, moonBump] = await Promise.all([
    loadTextureWithFallback(loader, TEXTURE_PATHS.earth, TEXTURE_FALLBACKS.earth),
    loadTextureWithFallback(loader, TEXTURE_PATHS.earthNormal, TEXTURE_FALLBACKS.earthNormal),
    loadTextureWithFallback(loader, TEXTURE_PATHS.earthClouds, TEXTURE_FALLBACKS.earthClouds),
    loadTextureWithFallback(loader, TEXTURE_PATHS.moon, TEXTURE_FALLBACKS.moon),
    loadTextureWithFallback(loader, TEXTURE_PATHS.moonBump, TEXTURE_FALLBACKS.moonBump),
  ])

  earthOrbit = new THREE.Group()
  moonOrbit = new THREE.Group()
  parent.add(earthOrbit)
  earthOrbit.add(moonOrbit)

  sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(SCENE.sunRadius, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xffcc33 }),
  )
  sunMesh.add(createSunGlow(SCENE.sunRadius))
  parent.add(sunMesh)

  sunLight = new THREE.DirectionalLight(0xfff8ee, 3.4)
  sunLight.position.set(0, 0, 0)
  sunLight.target = earthOrbit
  parent.add(sunLight)

  const ambient = new THREE.AmbientLight(0x446688, 0.42)
  const hemi = new THREE.HemisphereLight(0x88bbee, 0x111122, 0.55)
  parent.add(ambient, hemi)

  // Dünya-Ay tarafında hafif dolgu ışığı — karanlık yüzü siluet olarak görünür kılar
  const fillLight = new THREE.DirectionalLight(0x8899cc, 0.55)
  fillLight.position.set(-18, 6, -12)
  parent.add(fillLight)

  const earthMaterial = earthMap
    ? new THREE.MeshStandardMaterial({
        map: earthMap,
        normalMap: earthNormal ?? undefined,
        roughness: 0.72,
        metalness: 0.08,
        emissive: 0x0a1a33,
        emissiveIntensity: 0.08,
      })
    : new THREE.MeshStandardMaterial({
        color: 0x5ba3e8,
        roughness: 0.75,
        metalness: 0.08,
        emissive: 0x1a4080,
        emissiveIntensity: 0.12,
      })

  earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(SCENE.earthRadius, 64, 64),
    earthMaterial,
  )
  earthMesh.position.set(SCENE.earthOrbit, 0, 0)
  earthOrbit.add(earthMesh)
  earthMesh.add(createAtmosphere(SCENE.earthRadius))
  earthMesh.add(createBodyRim(SCENE.earthRadius, 0x7dd3fc, 0.18))

  if (earthClouds) {
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(SCENE.earthRadius * 1.018, 64, 64),
      new THREE.MeshStandardMaterial({
        map: earthClouds,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    )
    earthMesh.add(clouds)
  }

  const moonMaterial = moonMap
    ? new THREE.MeshStandardMaterial({
        map: moonMap,
        bumpMap: moonBump ?? undefined,
        bumpScale: 0.06,
        roughness: 0.92,
        metalness: 0.02,
        emissive: 0x222233,
        emissiveIntensity: 0.18,
      })
    : new THREE.MeshStandardMaterial({
        color: 0xe2e2ee,
        roughness: 0.95,
        metalness: 0,
        emissive: 0x333344,
        emissiveIntensity: 0.22,
      })

  moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(SCENE.moonRadius, 64, 64),
    moonMaterial,
  )
  moonMesh.position.set(SCENE.moonOrbit, 0, 0)
  moonOrbit.position.copy(earthMesh.position)
  moonOrbit.add(moonMesh)
  moonMesh.add(createBodyRim(SCENE.moonRadius, 0xffffff, 0.15))

  parent.add(createOrbitLine(SCENE.earthOrbit, 0x64748b))
  moonOrbit.add(createOrbitLine(SCENE.moonOrbit, 0x94a3b8))

  moonOrbit.rotation.y = moonAngle
}

function updateCameraFromState() {
  if (!activeCamera || !cameraState) return

  if (trackMoon.value && earthMesh && moonMesh) {
    const earthPos = new THREE.Vector3()
    const moonPos = new THREE.Vector3()
    earthMesh.getWorldPosition(earthPos)
    moonMesh.getWorldPosition(moonPos)
    activeCamera.position.copy(earthPos).add(new THREE.Vector3(0, 0.6, 0.4))
    activeCamera.lookAt(moonPos)
    return
  }

  const { yaw, pitch, distance, target } = cameraState
  activeCamera.position.set(
    target.x + distance * Math.sin(yaw) * Math.cos(pitch),
    target.y + distance * Math.sin(pitch),
    target.z + distance * Math.cos(yaw) * Math.cos(pitch),
  )
  activeCamera.lookAt(target)
}

function computePhaseIndex() {
  if (!earthMesh || !moonMesh || !sunMesh) return currentPhase.value

  const sunPos = new THREE.Vector3()
  const earthPos = new THREE.Vector3()
  const moonPos = new THREE.Vector3()
  sunMesh.getWorldPosition(sunPos)
  earthMesh.getWorldPosition(earthPos)
  moonMesh.getWorldPosition(moonPos)

  const earthToSun = new THREE.Vector3().subVectors(sunPos, earthPos).normalize()
  const earthToMoon = new THREE.Vector3().subVectors(moonPos, earthPos).normalize()
  const cross = new THREE.Vector3().crossVectors(earthToSun, earthToMoon)
  const sign = cross.y >= 0 ? 1 : -1
  const angle = earthToSun.angleTo(earthToMoon) * sign
  return Math.round(((angle + Math.PI * 2) / (Math.PI * 2)) * 8) % 8
}

function reportPhaseChange(phaseIndex) {
  if (phaseIndex === lastReportedPhase) return
  lastReportedPhase = phaseIndex
  currentPhase.value = phaseIndex
  emit('simulation-event', {
    type: 'phase-change',
    phaseId: phaseIndex,
    name: MOON_PHASES[phaseIndex].name,
  })
}

function animateSimulation(delta) {
  if (!isPlaying.value || !earthOrbit || !moonOrbit) return

  earthAngle += delta * 0.08 * speed.value
  moonAngle += delta * 0.35 * speed.value
  earthOrbit.rotation.y = earthAngle
  moonOrbit.rotation.y = moonAngle

  if (earthMesh) {
    earthMesh.rotation.y += delta * 0.15 * speed.value
  }

  reportPhaseChange(computePhaseIndex())
}

function selectPhase(index) {
  isPlaying.value = false
  currentPhase.value = index
  lastReportedPhase = index
  moonAngle = MOON_PHASE_ANGLES[index] ?? Math.PI
  if (moonOrbit) moonOrbit.rotation.y = moonAngle

  emit('simulation-event', {
    type: 'phase-select',
    phaseId: index,
    name: MOON_PHASES[index].name,
  })

  if (props.embedded) {
    award({
      points: +2,
      ruleId: 'moon-phase-select',
      label: `${MOON_PHASES[index].name} +2`,
      showCharacterBubble: true,
    })
  }
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  emit('simulation-event', { type: 'play-toggle', playing: isPlaying.value })
}

function setCameraPreset(preset) {
  trackMoon.value = false
  if (!cameraState) return

  switch (preset) {
    case 'top':
      cameraState.yaw = 0
      cameraState.pitch = Math.PI / 2 - 0.05
      cameraState.distance = 22
      break
    case 'side':
      cameraState.yaw = Math.PI / 2
      cameraState.pitch = 0.15
      cameraState.distance = 20
      break
    case 'front':
      cameraState.yaw = 0
      cameraState.pitch = 0.12
      cameraState.distance = 20
      break
    default:
      cameraState.yaw = 0.55
      cameraState.pitch = 0.42
      cameraState.distance = 17
  }
}

function resetSimulation() {
  isPlaying.value = false
  trackMoon.value = false
  speed.value = props.config.defaultSpeed ?? 0.5
  selectPhase(0)
  setCameraPreset('iso')
}

watch(speed, (value) => {
  emit('simulation-event', { type: 'speed-change', speed: value })
})

watch(trackMoon, (tracking) => {
  if (tracking) {
    isPlaying.value = true
  }
})

const { canvasRef } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  onInit({ scene, camera, renderer }) {
    renderer.setClearColor(0x02040a)
    scene.fog = new THREE.FogExp2(0x02040a, 0.002)
    activeCamera = camera

    cameraState = {
      yaw: 0.55,
      pitch: 0.42,
      distance: 17,
      target: new THREE.Vector3(SCENE.focusX, 0, 0),
    }
    updateCameraFromState()

    sceneRoot = new THREE.Group()
    scene.add(sceneRoot)
    addStarfield(sceneRoot)

    buildCelestialBodies(sceneRoot).catch((err) => {
      bootError.value = err?.message ?? 'Gök cisimleri oluşturulamadı.'
    })
  },
  onFrame({ delta }) {
    updateCameraFromState()
    animateSimulation(delta)
  },
  onDispose() {
    sceneRoot = null
    sunMesh = null
    earthMesh = null
    moonMesh = null
    earthOrbit = null
    moonOrbit = null
    activeCamera = null
    cameraState = null
  },
})

function onPointerDown(event) {
  isDragging = true
  lastPointer = { x: event.clientX, y: event.clientY }
}

function onPointerUp() {
  isDragging = false
}

function onPointerMove(event) {
  if (!isDragging || !cameraState || trackMoon.value) return
  const dx = event.clientX - lastPointer.x
  const dy = event.clientY - lastPointer.y
  lastPointer = { x: event.clientX, y: event.clientY }
  cameraState.yaw -= dx * 0.005
  cameraState.pitch = Math.max(0.08, Math.min(1.2, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState || trackMoon.value) return
  event.preventDefault()
  cameraState.distance = Math.max(10, Math.min(32, cameraState.distance + event.deltaY * 0.015))
}
</script>

<template>
  <div
    class="ay-evre-scene"
    :class="{ 'ay-evre-scene--embedded': embedded }"
  >
    <p
      v-if="bootError"
      class="ay-evre-scene__error"
    >
      {{ bootError }}
    </p>

    <canvas
      ref="canvasRef"
      class="ay-evre-scene__canvas"
      :class="{ 'ay-evre-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
    />

    <div
      class="ay-evre-scene__phase-badge"
      aria-live="polite"
    >
      <span class="ay-evre-scene__phase-emoji">{{ activePhase.emoji }}</span>
      <span class="ay-evre-scene__phase-name">{{ activePhase.name }}</span>
    </div>

    <aside
      class="ay-evre-scene__panel"
      :class="{ 'ay-evre-scene__target--pulse': panelPulsing }"
    >
      <p class="ay-evre-scene__panel-title">
        Ay evreleri
      </p>

      <div class="ay-evre-scene__controls">
        <button
          type="button"
          class="ay-evre-scene__play-btn"
          :class="{ 'ay-evre-scene__target--pulse': playPulsing, 'ay-evre-scene__play-btn--active': isPlaying }"
          @click="togglePlay"
        >
          {{ isPlaying ? 'Durdur' : 'Oynat' }}
        </button>

        <label class="ay-evre-scene__speed">
          <span>Hız</span>
          <input
            v-model.number="speed"
            type="range"
            min="0.1"
            max="2"
            step="0.1"
          >
          <span class="ay-evre-scene__speed-val">{{ speed.toFixed(1) }}×</span>
        </label>
      </div>

      <div class="ay-evre-scene__camera-btns">
        <button
          type="button"
          class="ay-evre-scene__cam-btn"
          @click="setCameraPreset('iso')"
        >
          İzometrik
        </button>
        <button
          type="button"
          class="ay-evre-scene__cam-btn"
          @click="setCameraPreset('top')"
        >
          Üstten
        </button>
        <button
          type="button"
          class="ay-evre-scene__cam-btn"
          @click="setCameraPreset('side')"
        >
          Yandan
        </button>
        <button
          type="button"
          class="ay-evre-scene__cam-btn"
          :class="{ 'ay-evre-scene__cam-btn--active': trackMoon }"
          @click="trackMoon = !trackMoon"
        >
          {{ trackMoon ? 'Takibi bırak' : 'Ayı takip et' }}
        </button>
      </div>

      <p class="ay-evre-scene__section-label">
        Evre seç
      </p>
      <div class="ay-evre-scene__phases">
        <button
          v-for="phase in MOON_PHASES"
          :key="phase.id"
          type="button"
          class="ay-evre-scene__phase-btn"
          :class="{ 'ay-evre-scene__phase-btn--active': currentPhase === phase.id }"
          :title="phase.name"
          @click="selectPhase(phase.id)"
        >
          <span>{{ phase.emoji }}</span>
        </button>
      </div>

      <div class="ay-evre-scene__info">
        <strong>{{ activePhase.name }}</strong>
        <p>{{ activePhase.info }}</p>
      </div>

      <button
        type="button"
        class="ay-evre-scene__reset"
        @click="resetSimulation"
      >
        Sıfırla
      </button>

      <ul
        v-if="config.hints?.length"
        class="ay-evre-scene__hints"
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
.ay-evre-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.ay-evre-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.ay-evre-scene__canvas:active {
  cursor: grabbing;
}

.ay-evre-scene__phase-badge {
  position: absolute;
  top: max(0.75rem, env(safe-area-inset-top));
  left: max(0.75rem, env(safe-area-inset-left));
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(6px);
  z-index: 2;
  pointer-events: none;
}

.ay-evre-scene__phase-emoji {
  font-size: 1.6rem;
  line-height: 1;
}

.ay-evre-scene__phase-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
}

.ay-evre-scene__error {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  z-index: 3;
}

.ay-evre-scene__panel {
  position: absolute;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  width: min(300px, calc(100% - 1.5rem));
  max-height: calc(100% - 5rem);
  overflow-y: auto;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  z-index: 2;
}

.ay-evre-scene--embedded {
  border-radius: inherit;
  overflow: hidden;
  contain: strict;
}

.ay-evre-scene--embedded .ay-evre-scene__canvas {
  transform: translateZ(0);
}

.ay-evre-scene--embedded .ay-evre-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(220px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(8, 12, 22, 0.88);
}

.ay-evre-scene--embedded .ay-evre-scene__hints,
.ay-evre-scene--embedded .ay-evre-scene__phase-badge {
  display: none;
}

.ay-evre-scene__panel-title {
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fbbf24;
}

.ay-evre-scene__controls {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
}

.ay-evre-scene__play-btn {
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.45);
  background: rgba(56, 189, 248, 0.12);
  color: #7dd3fc;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.ay-evre-scene__play-btn--active {
  border-color: rgba(251, 191, 36, 0.55);
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.ay-evre-scene__speed {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  color: #94a3b8;
}

.ay-evre-scene__speed input {
  width: 100%;
  accent-color: #7dd3fc;
}

.ay-evre-scene__speed-val {
  font-family: ui-monospace, monospace;
  color: #7dd3fc;
  min-width: 2.2rem;
  text-align: right;
}

.ay-evre-scene__camera-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.ay-evre-scene__cam-btn {
  padding: 0.35rem 0.45rem;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 0.72rem;
  cursor: pointer;
}

.ay-evre-scene__cam-btn--active {
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(129, 140, 248, 0.15);
  color: #a5b4fc;
}

.ay-evre-scene__section-label {
  margin: 0 0 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.ay-evre-scene__phases {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.ay-evre-scene__phase-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  font-size: 1.15rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.ay-evre-scene__phase-btn:hover {
  border-color: rgba(56, 189, 248, 0.45);
}

.ay-evre-scene__phase-btn--active {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(251, 191, 36, 0.12);
}

.ay-evre-scene__info {
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  background: rgba(2, 4, 10, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.ay-evre-scene__info strong {
  display: block;
  font-size: 0.88rem;
  color: #fbbf24;
}

.ay-evre-scene__info p {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #94a3b8;
}

.ay-evre-scene__reset {
  width: 100%;
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5e1;
  font-size: 0.78rem;
  cursor: pointer;
}

.ay-evre-scene__hints {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
}

.ay-evre-scene__target--pulse {
  animation: ay-evre-guide-pulse 1.6s ease-in-out infinite;
}

@keyframes ay-evre-guide-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(56, 189, 248, 0.55),
      0 0 20px rgba(56, 189, 248, 0.2);
  }
}

@media (max-width: 640px) {
  .ay-evre-scene__panel {
    right: max(0.5rem, env(safe-area-inset-right));
    left: max(0.5rem, env(safe-area-inset-left));
    width: auto;
    max-height: 44vh;
  }

  .ay-evre-scene__hints {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ay-evre-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}
</style>
