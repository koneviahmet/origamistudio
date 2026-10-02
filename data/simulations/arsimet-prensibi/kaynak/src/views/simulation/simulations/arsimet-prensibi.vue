<script setup>
import { ref, shallowRef, computed } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { useScoreStore } from '../../../stores/scoreStore.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const CM = 0.1
const CONTAINER_RADIUS = 1
const CONTAINER_HEIGHT = 4.5
const CONTAINER_AREA = 100
const INITIAL_WATER_CM = 15
const STONE_SIZE_CM = 5
const STONE_HALF_CM = STONE_SIZE_CM / 2
const STONE_VOLUME_CM3 = STONE_SIZE_CM ** 3 // 125 cm³
const WATER_DENSITY = 1 // g/cm³
const CONTAINER_FLOOR_Y = 0.08
const DROP_DURATION_MS = 1400
const SETTLE_PAUSE_MS = 900
const WATER_RISE_DURATION_MS = 1000

const STONES = [
  {
    id: 'stone-1',
    name: '1. Taş',
    density: 0.95,
    color: 0xff5733,
    centerAboveSurfaceCm: 1.5,
    info: 'Yoğunluğu sıvıdan küçük — taş yüzer; yalnızca batan kısım suyu yükseltir.',
  },
  {
    id: 'stone-2',
    name: '2. Taş',
    density: 1.8,
    color: 0x33a8ff,
    floatHeightCm: 6,
    info: 'Yoğunluğu sıvıdan büyük — taş tamamen suyun içinde kalır.',
  },
  {
    id: 'stone-3',
    name: '3. Taş',
    density: 2.5,
    color: 0x33ff57,
    sinksToBottom: true,
    info: 'Yoğunluğu sıvıdan çok büyük — taş dibe batar, yine de tamamen suyun içindedir.',
  },
]

/** Taşın su altında kalan yüksekliği (cm). */
function submergedHeightCm(stone) {
  if (stone.centerAboveSurfaceCm != null) {
    return Math.max(0, Math.min(STONE_SIZE_CM, STONE_HALF_CM - stone.centerAboveSurfaceCm))
  }
  if (stone.density < WATER_DENSITY) {
    return STONE_SIZE_CM * stone.density
  }
  return STONE_SIZE_CM
}

/** Yer değiştiren hacim = batmış kesit × taş tabanı (cm³). */
function displacedVolumeFor(stone) {
  return submergedHeightCm(stone) * STONE_SIZE_CM ** 2
}

function roundVolume(value) {
  return Math.round(value * 10) / 10
}

const bootError = ref(null)
const selectedStoneIndex = ref(null)
const waterLevelCm = ref(INITIAL_WATER_CM)
const calculatedVolume = ref(0)
const isAnimating = ref(false)
const statusMessage = shallowRef(null)

const { award } = useScoreStore()

const panelPulsing = computed(
  () =>
    props.guideFocus === 'panel'
    || props.guideFocus === 'stone'
    || props.simulationTask?.action === 'select-stone',
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome'
    || props.guideFocus === 'stone',
)

const selectedStone = computed(() =>
  selectedStoneIndex.value != null ? STONES[selectedStoneIndex.value] : null,
)

const initialWaterCm = INITIAL_WATER_CM
const finalWaterCm = computed(() =>
  calculatedVolume.value > 0
    ? initialWaterCm + calculatedVolume.value / CONTAINER_AREA
    : waterLevelCm.value,
)

let sceneRoot = null
let waterMesh = null
let stoneMesh = null
let initialMarker = null
let finalMarker = null
let activeCamera = null
let raycaster = null
let pointer = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }

let animState = null
let animTimer = null

function stopAnimTimer() {
  if (animTimer != null) {
    clearTimeout(animTimer)
    animTimer = null
  }
}

function scheduleAnimTick() {
  stopAnimTimer()
  updateAnimation()
  if (animState) {
    animTimer = setTimeout(scheduleAnimTick, 16)
  }
}

function cmToY(cm) {
  return cm * CM
}

function waterSurfaceY(waterCm = waterLevelCm.value) {
  return cmToY(waterCm)
}

/** Taşın dengedeki merkez yüksekliği (Three.js birimi). */
function restingStoneCenterY(stone) {
  if (stone.sinksToBottom) {
    return CONTAINER_FLOOR_Y + cmToY(STONE_HALF_CM)
  }

  if (stone.centerAboveSurfaceCm != null) {
    return cmToY(INITIAL_WATER_CM + stone.centerAboveSurfaceCm)
  }

  if (stone.density < WATER_DENSITY) {
    const submergedHeightCm = STONE_SIZE_CM * stone.density
    const bottomCm = INITIAL_WATER_CM - submergedHeightCm
    const centerCm = bottomCm + STONE_HALF_CM
    return cmToY(centerCm)
  }

  const surfaceY = cmToY(INITIAL_WATER_CM)
  return surfaceY - stone.floatHeightCm * CM
}

function resetWaterToInitial() {
  waterLevelCm.value = INITIAL_WATER_CM
  calculatedVolume.value = 0
  updateWaterMesh()
  updateMarkers()
}

function selectStone(index) {
  if (isAnimating.value) return

  stopAnimTimer()
  animState = null

  selectedStoneIndex.value = index
  resetWaterToInitial()
  statusMessage.value = STONES[index]

  emit('simulation-event', {
    type: 'stone-select',
    stoneId: STONES[index].id,
    name: STONES[index].name,
  })

  startDropAnimation(STONES[index])
}

function startDropAnimation(stone) {
  if (!sceneRoot || !stoneMesh) return

  isAnimating.value = true
  updateMarkers()

  const startY = CONTAINER_HEIGHT + 0.8
  const endY = restingStoneCenterY(stone)

  animState = {
    type: 'drop',
    stone,
    startY,
    endY,
    restingY: endY,
    startTime: performance.now(),
    durationMs: DROP_DURATION_MS,
  }

  stoneMesh.visible = true
  stoneMesh.position.set(0, startY, 0)
  applyStoneColor(stone.color)
  scheduleAnimTick()
}

function startSettlePause(stone) {
  const restingY = restingStoneCenterY(stone)
  stoneMesh.position.y = restingY

  animState = {
    type: 'hold',
    stone,
    restingY,
    endTime: performance.now() + SETTLE_PAUSE_MS,
  }
}

function startWaterAnimation(stone) {
  const displaced = roundVolume(displacedVolumeFor(stone))
  calculatedVolume.value = displaced
  const targetLevel = INITIAL_WATER_CM + displaced / CONTAINER_AREA

  animState = {
    type: 'water',
    stone,
    startLevel: waterLevelCm.value,
    targetLevel,
    restingY: restingStoneCenterY(stone),
    startTime: performance.now(),
    durationMs: WATER_RISE_DURATION_MS,
  }
}

function finishAnimation(stone) {
  stopAnimTimer()
  isAnimating.value = false
  animState = null

  emit('simulation-event', {
    type: 'simulation-complete',
    stoneId: stone.id,
    waterLevelCm: waterLevelCm.value,
    displacedVolume: roundVolume(displacedVolumeFor(stone)),
  })

  if (props.embedded) {
    award({
      points: 3,
      ruleId: 'arsimet-stone-observe',
      label: 'Arşimet — taş gözlemi +3',
      showCharacterBubble: true,
    })
  }
}

function applyStoneColor(color) {
  if (!stoneMesh?.material?.color) return
  stoneMesh.material.color.setHex(color)
}

function updateWaterMesh() {
  if (!waterMesh) return

  const height = cmToY(waterLevelCm.value)
  waterMesh.scale.y = height
  waterMesh.position.y = height / 2
}

function updateMarkers() {
  if (!sceneRoot) return

  if (initialMarker) {
    initialMarker.position.y = cmToY(initialWaterCm)
    initialMarker.visible = true
  }

  if (finalMarker) {
    const showFinal = calculatedVolume.value > 0 || waterLevelCm.value > initialWaterCm + 0.05
    finalMarker.visible = showFinal
    if (showFinal) {
      finalMarker.position.y = cmToY(waterLevelCm.value)
    }
  }
}

function buildScene(scene) {
  sceneRoot = new THREE.Group()
  scene.add(sceneRoot)

  const floorGeo = new THREE.CircleGeometry(3.5, 48)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a2332,
    roughness: 0.85,
    metalness: 0.05,
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.02
  sceneRoot.add(floor)

  const tableGeo = new THREE.CylinderGeometry(1.8, 1.9, 0.15, 32)
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.1,
  })
  const table = new THREE.Mesh(tableGeo, tableMat)
  table.position.y = 0.075
  sceneRoot.add(table)

  const glassGeo = new THREE.CylinderGeometry(
    CONTAINER_RADIUS,
    CONTAINER_RADIUS * 0.92,
    CONTAINER_HEIGHT,
    48,
    1,
    true,
  )
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.22,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.55,
    thickness: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const glass = new THREE.Mesh(glassGeo, glassMat)
  glass.position.y = CONTAINER_HEIGHT / 2
  sceneRoot.add(glass)

  const bottomGeo = new THREE.CylinderGeometry(CONTAINER_RADIUS * 0.92, CONTAINER_RADIUS * 0.92, 0.08, 48)
  const bottomMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4,
    metalness: 0.2,
  })
  const bottom = new THREE.Mesh(bottomGeo, bottomMat)
  bottom.position.y = 0.04
  sceneRoot.add(bottom)

  const waterGeo = new THREE.CylinderGeometry(CONTAINER_RADIUS * 0.88, CONTAINER_RADIUS * 0.88, 1, 48)
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0,
    transmission: 0.35,
    depthWrite: false,
  })
  waterMesh = new THREE.Mesh(waterGeo, waterMat)
  waterMesh.position.y = cmToY(INITIAL_WATER_CM) / 2
  waterMesh.scale.y = cmToY(INITIAL_WATER_CM)
  sceneRoot.add(waterMesh)

  for (let i = 0; i <= 9; i += 1) {
    const y = (i / 9) * CONTAINER_HEIGHT
    const tickGeo = new THREE.BoxGeometry(0.12, 0.02, 0.04)
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.7,
    })
    const tick = new THREE.Mesh(tickGeo, tickMat)
    tick.position.set(-CONTAINER_RADIUS - 0.18, y, 0)
    sceneRoot.add(tick)

    if (i % 2 === 0) {
      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 64
      labelCanvas.height = 32
      const ctx = labelCanvas.getContext('2d')
      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(`${i * 5}`, 4, 22)
      const texture = new THREE.CanvasTexture(labelCanvas)
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.scale.set(0.35, 0.18, 1)
      sprite.position.set(-CONTAINER_RADIUS - 0.55, y, 0)
      sceneRoot.add(sprite)
    }
  }

  const markerGeo = new THREE.BoxGeometry(0.35, 0.04, 0.06)
  const initialMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  initialMarker = new THREE.Mesh(markerGeo, initialMat)
  initialMarker.position.set(CONTAINER_RADIUS + 0.25, cmToY(initialWaterCm), 0)
  sceneRoot.add(initialMarker)

  const finalMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 })
  finalMarker = new THREE.Mesh(markerGeo, finalMat)
  finalMarker.visible = false
  finalMarker.position.set(CONTAINER_RADIUS + 0.25, cmToY(initialWaterCm), 0)
  sceneRoot.add(finalMarker)

  stoneMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({
      color: 0xff5733,
      roughness: 0.65,
      metalness: 0.05,
    }),
  )
  stoneMesh.visible = false
  stoneMesh.castShadow = false
  sceneRoot.add(stoneMesh)
}

function updateAnimation() {
  if (!animState || !stoneMesh) return

  const elapsedSec = (performance.now() - animState.startTime) / 1000
  const t = Math.min(elapsedSec / (animState.durationMs / 1000), 1)
  const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2

  if (animState.type === 'drop') {
    stoneMesh.position.y = animState.startY + (animState.endY - animState.startY) * eased
    if (t >= 1) {
      startSettlePause(animState.stone)
    }
    return
  }

  if (animState.type === 'hold') {
    stoneMesh.position.y = animState.restingY
    if (performance.now() >= animState.endTime) {
      startWaterAnimation(animState.stone)
    }
    return
  }

  if (animState.type === 'water') {
    waterLevelCm.value =
      animState.startLevel + (animState.targetLevel - animState.startLevel) * eased
    updateWaterMesh()
    updateMarkers()

    // Taş konumu su yükselirken sabit kalır (legacy davranışı)
    stoneMesh.position.y = animState.restingY

    if (t >= 1) {
      finishAnimation(animState.stone)
    }
  }
}

const { canvasRef } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,

  onInit({ renderer, scene, camera }) {
    renderer.setClearColor(0x02040a)
    scene.fog = new THREE.FogExp2(0x02040a, 0.018)
    activeCamera = camera

    cameraState = {
      yaw: 0.85,
      pitch: 0.35,
      distance: 7.5,
      target: new THREE.Vector3(0, 2.2, 0),
    }

    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    const ambient = new THREE.AmbientLight(0x8899bb, 0.55)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
    keyLight.position.set(4, 8, 5)
    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.35)
    fillLight.position.set(-5, 3, -4)
    const rimLight = new THREE.PointLight(0x7dd3fc, 0.4, 20)
    rimLight.position.set(0, 5, -3)
    scene.add(ambient, keyLight, fillLight, rimLight)

    buildScene(scene)
    updateWaterMesh()
    updateMarkers()
  },

  onFrame({ camera }) {
    activeCamera = camera
    updateCamera(camera)
    updateAnimation()

    if (waterMesh?.material) {
      waterMesh.material.opacity = 0.55 + Math.sin(Date.now() * 0.001) * 0.05
    }
  },

  onDispose({ scene }) {
    stopAnimTimer()
    sceneRoot = null
    waterMesh = null
    stoneMesh = null
    initialMarker = null
    finalMarker = null
    activeCamera = null
    animState = null

    if (scene) {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => {
            m.map?.dispose?.()
            m.dispose?.()
          })
        }
      })
    }
  },
})

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
  cameraState.pitch = Math.max(0.05, Math.min(1.1, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  cameraState.distance = Math.max(4.5, Math.min(14, cameraState.distance + event.deltaY * 0.012))
}
</script>

<template>
  <div
    class="arsimet-scene"
    :class="{ 'arsimet-scene--embedded': embedded }"
  >
    <p
      v-if="bootError"
      class="arsimet-scene__error"
    >
      {{ bootError }}
    </p>

    <canvas
      ref="canvasRef"
      class="arsimet-scene__canvas"
      :class="{ 'arsimet-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
    />

    <aside
      class="arsimet-scene__panel"
      :class="{ 'arsimet-scene__target--pulse': panelPulsing }"
    >
      <div
        v-if="simulationTask?.action === 'select-stone'"
        class="arsimet-scene__task"
      >
        <p class="arsimet-scene__task-label">
          Taş seç
        </p>
      </div>

      <p class="arsimet-scene__panel-title">
        Taş seçin
      </p>

      <div class="arsimet-scene__stones">
        <button
          v-for="(stone, index) in STONES"
          :key="stone.id"
          type="button"
          class="arsimet-scene__stone-btn"
          :class="{ 'arsimet-scene__stone-btn--active': selectedStoneIndex === index }"
          :disabled="isAnimating"
          @click="selectStone(index)"
        >
          <span
            class="arsimet-scene__stone-swatch"
            :style="{ backgroundColor: `#${stone.color.toString(16).padStart(6, '0')}` }"
          />
          <span class="arsimet-scene__stone-label">{{ stone.name }}</span>
          <span class="arsimet-scene__stone-density">ρ {{ stone.density }}</span>
        </button>
      </div>

      <div
        v-if="statusMessage"
        class="arsimet-scene__info"
      >
        <strong>{{ statusMessage.name }}</strong>
        <p>{{ statusMessage.info }}</p>
        <dl class="arsimet-scene__stats">
          <div>
            <dt>İlk su</dt>
            <dd>{{ initialWaterCm.toFixed(1) }} cm</dd>
          </div>
          <div>
            <dt>Son su</dt>
            <dd>{{ finalWaterCm.toFixed(1) }} cm</dd>
          </div>
          <div>
            <dt>Yer değiştiren hacim</dt>
            <dd>{{ calculatedVolume ? `${calculatedVolume} cm³` : '—' }}</dd>
          </div>
        </dl>
      </div>

      <ul
        v-if="config.hints?.length"
        class="arsimet-scene__hints"
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
.arsimet-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.arsimet-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.arsimet-scene__canvas:active {
  cursor: grabbing;
}

.arsimet-scene__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 8, 20, 0.7);
  color: #94a3b8;
  z-index: 2;
}

.arsimet-scene__error {
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

.arsimet-scene__panel {
  position: absolute;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  width: min(280px, calc(100% - 1.5rem));
  max-height: calc(100% - 5rem);
  overflow-y: auto;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  z-index: 2;
}

.arsimet-scene--embedded {
  border-radius: inherit;
  overflow: hidden;
  contain: strict;
}

.arsimet-scene--embedded .arsimet-scene__canvas {
  transform: translateZ(0);
}

.arsimet-scene--embedded .arsimet-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(8, 12, 22, 0.88);
}

.arsimet-scene--embedded .arsimet-scene__hints {
  display: none;
}

@media (max-width: 640px) {
  .arsimet-scene__panel {
    right: max(0.5rem, env(safe-area-inset-right));
    left: max(0.5rem, env(safe-area-inset-left));
    width: auto;
    max-height: 40vh;
  }

  .arsimet-scene__hints {
    display: none;
  }
}

.arsimet-scene__task {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.arsimet-scene__task-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.arsimet-scene__panel-title {
  margin: 0 0 0.65rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
}

.arsimet-scene__stones {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.arsimet-scene__stone-btn {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.arsimet-scene__stone-btn:hover:not(:disabled) {
  border-color: rgba(56, 189, 248, 0.45);
  background: rgba(56, 189, 248, 0.1);
}

.arsimet-scene__stone-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.arsimet-scene__stone-btn--active {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(251, 191, 36, 0.12);
}

.arsimet-scene__stone-swatch {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.arsimet-scene__stone-label {
  font-weight: 500;
}

.arsimet-scene__stone-density {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  color: #64748b;
}

.arsimet-scene__info {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.arsimet-scene__info strong {
  display: block;
  font-size: 0.95rem;
  color: #fbbf24;
}

.arsimet-scene__info p {
  margin: 0.35rem 0 0.65rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #94a3b8;
}

.arsimet-scene__stats {
  display: grid;
  gap: 0.35rem;
  margin: 0;
}

.arsimet-scene__stats div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.78rem;
}

.arsimet-scene__stats dt {
  color: #64748b;
}

.arsimet-scene__stats dd {
  margin: 0;
  font-family: ui-monospace, monospace;
  color: #7dd3fc;
}

.arsimet-scene__hints {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
}

.arsimet-scene__target--pulse {
  animation: arsimet-guide-pulse 1.6s ease-in-out infinite;
}

@keyframes arsimet-guide-pulse {
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
  .arsimet-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}
</style>
