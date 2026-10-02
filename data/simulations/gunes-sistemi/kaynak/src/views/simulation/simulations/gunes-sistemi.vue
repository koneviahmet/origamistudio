<script setup>
import { ref, shallowRef, watch, computed } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import {
  loadSimulationModels,
  modelKey,
} from '../../../lib/simulation/loadSimulationModels.js'
import { useScoreStore } from '../../../stores/scoreStore.js'
import { SCORE_RULES } from '../../../data/scoreRules.js'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  /** Klavuz adımı odak hedefi (panelGuide.steps[].focus) */
  guideFocus: {
    type: String,
    default: null,
  },
  /** Aktif quiz-simulation görevi (diyalogdan) */
  simulationTask: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['simulation-event'])

const bootLoading = ref(true)
const bootError = ref(null)
const speed = ref(props.config.defaultSpeed ?? 1)
const selectedPlanet = shallowRef(null)
const { award } = useScoreStore()

const panelPulsing = computed(
  () =>
    props.guideFocus === 'speed'
    || props.guideFocus === 'sim-panel'
    || props.simulationTask?.action === 'select-planet',
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'planet'
    || props.guideFocus === 'sun'
    || props.guideFocus === 'welcome'
    || props.simulationTask?.action === 'select-planet',
)

function reportPlanetSelect(planet) {
  if (!planet?.id) return

  selectedPlanet.value = {
    id: planet.id,
    name: planet.name,
    info: planet.info ?? '',
  }

  emit('simulation-event', {
    type: 'planet-select',
    planetId: planet.id,
    name: planet.name,
  })
}

function reportSunClick(userData) {
  if (props.embedded) {
    award({
      points: SCORE_RULES.GUNES_SISTEMI_SUN_CLICK.points,
      ruleId: SCORE_RULES.GUNES_SISTEMI_SUN_CLICK.id,
      label: SCORE_RULES.GUNES_SISTEMI_SUN_CLICK.label,
      showCharacterBubble: true,
    })
  }

  selectedPlanet.value = {
    id: 'sun',
    name: userData.name,
    info: userData.info ?? '',
  }

  emit('simulation-event', { type: 'sun-click' })
}

function reportBodyFromRaycast(userData) {
  if (userData.type === 'sun') {
    reportSunClick(userData)
    return
  }

  if (userData.type === 'planet' && userData.id) {
    reportPlanetSelect(userData)
    return
  }

  if (userData.name) {
    selectedPlanet.value = {
      name: userData.name,
      info: userData.info ?? '',
    }
  }
}

watch(speed, (value) => {
  emit('simulation-event', { type: 'speed-change', speed: value })
})

const PLANETS = [
  { id: 'mercury', name: 'Merkür', color: 0xb5b5b5, radius: 0.22, orbit: 4.5, speed: 4.15, info: 'Güneşe en yakın gezegen.' },
  { id: 'venus', name: 'Venüs', color: 0xe8cda0, radius: 0.32, orbit: 6.2, speed: 3.2, info: 'Kalın atmosferiyle sıcak bir dünya.' },
  { id: 'earth', name: 'Dünya', color: 0x4f8fd4, radius: 0.34, orbit: 8, speed: 2.6, info: 'Yaşam barındıran mavi gezegen.' },
  { id: 'mars', name: 'Mars', color: 0xc1442e, radius: 0.28, orbit: 10, speed: 2.1, info: 'Kızıl gezegen.' },
  { id: 'jupiter', name: 'Jüpiter', color: 0xd4a574, radius: 0.9, orbit: 14, speed: 1.3, info: 'Güneş sisteminin en büyük gezegeni.' },
  { id: 'saturn', name: 'Satürn', color: 0xe8d5a3, radius: 0.75, orbit: 18, speed: 0.95, info: 'Halkalı dev gezegen.', ring: true },
  { id: 'uranus', name: 'Uranüs', color: 0x9fd4e8, radius: 0.55, orbit: 22, speed: 0.68, info: 'Yan yatmış buz devi.' },
  { id: 'neptune', name: 'Neptün', color: 0x3b5bdb, radius: 0.52, orbit: 26, speed: 0.54, info: 'Uzak mavi dev.' },
]

let sunMesh = null
let planetMeshes = []
let asteroidGroup = null
let satelliteMesh = null
let activeCamera = null
let raycaster = null
let pointer = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }

const { canvasRef, ready, context } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  onInit({ renderer, scene, camera }) {
    renderer.setClearColor(0x02040a)
    scene.fog = new THREE.FogExp2(0x02040a, 0.002)
    activeCamera = camera

    camera.position.set(0, 22, 38)
    camera.lookAt(0, 0, 0)

    cameraState = {
      yaw: 0.6,
      pitch: 0.45,
      distance: 42,
      target: new THREE.Vector3(0, 0, 0),
    }

    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    const ambient = new THREE.AmbientLight(0x8899bb, 0.65)
    const sunLight = new THREE.PointLight(0xfff0cc, 2.8, 200, 1)
    sunLight.position.set(0, 0, 0)
    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.35)
    fillLight.position.set(-20, 30, 40)
    scene.add(ambient, sunLight, fillLight)

    addStarfield(scene)
    createSun(scene)
    createPlanets(scene)
    createOrbitLines(scene)
  },

  onFrame({ camera, delta, elapsed }) {
    activeCamera = camera
    updateCamera(camera)
    animatePlanets(elapsed, delta)
    animateAsteroids(elapsed)
    if (satelliteMesh) {
      satelliteMesh.rotation.y += delta * 0.8
    }
  },

  onDispose({ scene }) {
    planetMeshes = []
    sunMesh = null
    asteroidGroup = null
    satelliteMesh = null
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

watch(ready, async (isReady) => {
  if (!isReady || !context.value?.scene) return

  try {
    await loadDecorations(context.value.scene)
  } catch (err) {
    bootError.value = err.message ?? 'Modeller yüklenemedi.'
  } finally {
    bootLoading.value = false
  }
}, { immediate: true })

function addStarfield(scene) {
  const count = 1800
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const r = 80 + Math.random() * 120
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
    size: 0.35,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  })
  scene.add(new THREE.Points(geometry, material))
}

function createSun(scene) {
  const geometry = new THREE.SphereGeometry(1.6, 48, 48)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffcc33,
  })
  sunMesh = new THREE.Mesh(geometry, material)
  sunMesh.userData = { type: 'sun', name: 'Güneş', info: 'Güneş sisteminin merkezi yıldızı.' }
  scene.add(sunMesh)

  // Yumuşak hale — Sprite kare artefaktı verir; BackSide küre kullanılır
  const glowLayers = [
    { scale: 1.28, color: 0xffaa33, opacity: 0.28 },
    { scale: 1.55, color: 0xff8800, opacity: 0.12 },
  ]

  for (const layer of glowLayers) {
    const glowGeo = new THREE.SphereGeometry(1.6 * layer.scale, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: layer.opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    sunMesh.add(glow)
  }
}

function createPlanets(scene) {
  planetMeshes = PLANETS.map((planet) => {
    const geometry = new THREE.SphereGeometry(planet.radius, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      color: planet.color,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { type: 'planet', ...planet }
    mesh.position.x = planet.orbit
    scene.add(mesh)

    if (planet.ring) {
      const ringGeo = new THREE.RingGeometry(planet.radius * 1.35, planet.radius * 2.1, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xe8d8b0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2.2
      mesh.add(ring)
    }

    if (planet.id === 'earth') {
      const moonGeo = new THREE.SphereGeometry(0.1, 16, 16)
      const moonMat = new THREE.MeshBasicMaterial({ color: 0xdddddd })
      const moon = new THREE.Mesh(moonGeo, moonMat)
      moon.userData.isMoon = true
      moon.position.set(0.7, 0, 0)
      mesh.add(moon)
      mesh.userData.moon = moon
    }

    return { mesh, planet }
  })
}

function createOrbitLines(scene) {
  for (const planet of PLANETS) {
    const curve = new THREE.EllipseCurve(0, 0, planet.orbit, planet.orbit, 0, Math.PI * 2)
    const points = curve.getPoints(96).map((p) => new THREE.Vector3(p.x, 0, p.y))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.55,
    })
    scene.add(new THREE.LineLoop(geometry, material))
  }
}

async function loadDecorations(scene) {
  const models = await loadSimulationModels(props.config.models ?? [])

  asteroidGroup = new THREE.Group()
  asteroidGroup.name = 'asteroid-belt'

  const meteorA = models.get(modelKey('space', 'meteor'))
  const meteorB = models.get(modelKey('space', 'meteor_detailed'))
  const beltRadius = 12

  for (let i = 0; i < 36; i += 1) {
    const template = i % 2 === 0 ? meteorA : meteorB
    if (!template) continue

    const asteroid = template.clone(true)
    const angle = (i / 36) * Math.PI * 2 + Math.random() * 0.2
    const radius = beltRadius + (Math.random() - 0.5) * 1.2
    asteroid.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 0.6,
      Math.sin(angle) * radius,
    )
    const scale = 0.08 + Math.random() * 0.12
    asteroid.scale.setScalar(scale)
    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    )
    asteroid.userData.beltAngle = angle
    asteroid.userData.beltRadius = radius
    asteroidGroup.add(asteroid)
  }

  scene.add(asteroidGroup)

  const satelliteTemplate = models.get(modelKey('space', 'craft_miner'))
  if (satelliteTemplate) {
    satelliteMesh = satelliteTemplate.clone(true)
    satelliteMesh.scale.setScalar(0.18)
    satelliteMesh.position.set(8.5, 0.4, 0)
    scene.add(satelliteMesh)
  }
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

function animatePlanets(elapsed, delta) {
  const rate = speed.value

  if (sunMesh) {
    sunMesh.rotation.y += delta * 0.15 * rate
  }

  for (const { mesh, planet } of planetMeshes) {
    const angle = elapsed * planet.speed * 0.12 * rate
    mesh.position.x = Math.cos(angle) * planet.orbit
    mesh.position.z = Math.sin(angle) * planet.orbit
    mesh.rotation.y += delta * 0.5 * rate

    if (mesh.userData.moon) {
      const moonAngle = elapsed * 3.5 * rate
      mesh.userData.moon.position.x = Math.cos(moonAngle) * 0.7
      mesh.userData.moon.position.z = Math.sin(moonAngle) * 0.7
    }
  }

  if (satelliteMesh) {
    const satAngle = elapsed * 1.8 * rate
    satelliteMesh.position.x = Math.cos(satAngle) * 8.5
    satelliteMesh.position.z = Math.sin(satAngle) * 8.5
  }
}

function animateAsteroids(elapsed) {
  if (!asteroidGroup) return
  const rate = speed.value

  asteroidGroup.children.forEach((asteroid) => {
    const angle = asteroid.userData.beltAngle + elapsed * 0.35 * rate
    const radius = asteroid.userData.beltRadius
    asteroid.position.x = Math.cos(angle) * radius
    asteroid.position.z = Math.sin(angle) * radius
    asteroid.rotation.y += 0.002 * rate
  })
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
  cameraState.pitch = Math.max(-0.2, Math.min(1.2, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  cameraState.distance = Math.max(12, Math.min(70, cameraState.distance + event.deltaY * 0.04))
}

function onClick(event) {
  const canvas = canvasRef.value
  if (!canvas || !raycaster || !pointer || !activeCamera) return

  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, activeCamera)
  const targets = [sunMesh, ...planetMeshes.map((p) => p.mesh)].filter(Boolean)
  const hits = raycaster.intersectObjects(targets, true)

  if (hits.length) {
    let obj = hits[0].object
    while (obj.parent && !obj.userData?.name) {
      obj = obj.parent
    }
    if (obj.userData?.name) {
      reportBodyFromRaycast(obj.userData)
      return
    }
  }

  selectedPlanet.value = null
}
</script>

<template>
  <div
    class="gunes-scene"
    :class="{ 'gunes-scene--embedded': embedded }"
  >
    <div
      v-if="bootLoading"
      class="gunes-scene__overlay"
    >
      Modeller yükleniyor…
    </div>

    <p
      v-if="bootError"
      class="gunes-scene__error"
    >
      {{ bootError }}
    </p>

    <canvas
      ref="canvasRef"
      class="gunes-scene__canvas"
      :class="{ 'gunes-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
      @click="onClick"
    />

    <aside
      class="gunes-scene__panel"
      :class="{ 'gunes-scene__target--pulse': panelPulsing }"
    >
      <div
        v-if="simulationTask?.action === 'select-planet'"
        class="gunes-scene__task"
      >
        <p class="gunes-scene__task-label">
          Gezegen seç
        </p>
        <div class="gunes-scene__planet-picks">
          <button
            v-for="planet in PLANETS"
            :key="planet.id"
            type="button"
            class="gunes-scene__planet-pick"
            :class="{ 'gunes-scene__planet-pick--active': selectedPlanet?.id === planet.id }"
            @click="reportPlanetSelect(planet)"
          >
            {{ planet.name }}
          </button>
        </div>
      </div>

      <label class="gunes-scene__control">
        <span>Hız</span>
        <input
          v-model.number="speed"
          type="range"
          min="0"
          max="4"
          step="0.1"
        >
        <span class="gunes-scene__speed-val">{{ speed.toFixed(1) }}×</span>
      </label>

      <ul
        v-if="config.hints?.length"
        class="gunes-scene__hints"
      >
        <li
          v-for="hint in config.hints"
          :key="hint"
        >
          {{ hint }}
        </li>
      </ul>

      <div
        v-if="selectedPlanet"
        class="gunes-scene__info"
      >
        <strong>{{ selectedPlanet.name }}</strong>
        <p>{{ selectedPlanet.info }}</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.gunes-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gunes-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.gunes-scene__canvas:active {
  cursor: grabbing;
}

.gunes-scene__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 8, 20, 0.7);
  color: #94a3b8;
  z-index: 2;
}

.gunes-scene__error {
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

.gunes-scene__panel {
  position: absolute;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  width: min(260px, calc(100% - 1.5rem));
  max-height: calc(100% - 5rem);
  overflow-y: auto;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  z-index: 2;
}

.gunes-scene--embedded {
  border-radius: inherit;
  overflow: hidden;
  contain: strict;
}

.gunes-scene--embedded .gunes-scene__canvas {
  transform: translateZ(0);
}

.gunes-scene--embedded .gunes-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-panel, 10px);
  border: 1px solid var(--border-accent, rgba(56, 189, 248, 0.28));
  background: rgba(8, 12, 22, 0.88);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-panel, 0 4px 24px rgba(0, 0, 0, 0.4));
}

.gunes-scene--embedded .gunes-scene__hints {
  display: none;
}

.gunes-scene--embedded .gunes-scene__info strong {
  font-size: 0.85rem;
}

.gunes-scene--embedded .gunes-scene__control {
  font-size: 0.78rem;
}

@media (max-width: 640px) {
  .gunes-scene__panel {
    right: max(0.5rem, env(safe-area-inset-right));
    left: max(0.5rem, env(safe-area-inset-left));
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    width: auto;
    max-height: 40vh;
  }

  .gunes-scene__hints {
    display: none;
  }
}

.gunes-scene__task {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.gunes-scene__task-label {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.gunes-scene__planet-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.gunes-scene__planet-pick {
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 0.72rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.gunes-scene__planet-pick:hover {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(56, 189, 248, 0.12);
}

.gunes-scene__planet-pick--active {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(251, 191, 36, 0.14);
  color: #fde68a;
}

.gunes-scene__control {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.gunes-scene__control input[type='range'] {
  width: 100%;
  accent-color: #fbbf24;
}

.gunes-scene__speed-val {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #fbbf24;
  min-width: 2.5rem;
  text-align: right;
}

.gunes-scene__hints {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
}

.gunes-scene__info {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.gunes-scene__info strong {
  display: block;
  font-size: 0.95rem;
  color: #fbbf24;
}

.gunes-scene__info p {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #94a3b8;
}

.gunes-scene__target--pulse {
  animation: gunes-guide-pulse 1.6s ease-in-out infinite;
}

@keyframes gunes-guide-pulse {
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

@media (prefers-reduced-motion: reduce) {
  .gunes-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}
</style>
