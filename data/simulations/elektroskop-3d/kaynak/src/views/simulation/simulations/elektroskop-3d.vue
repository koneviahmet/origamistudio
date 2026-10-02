<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { loadSimulationModels, modelKey } from '../../../lib/simulation/loadSimulationModels.js'
import { useScoreStore } from '../../../stores/scoreStore.js'
import { CHARGE_OPTIONS, EXPERIMENT_MESSAGES, SCENE_COLORS } from './elektroskop-3d/constants.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const { award } = useScoreStore()

const bootError = ref(null)
const isGrounding = ref(false)

const selections = ref({
  elektroskop: null,
  cisim: null,
  temas: null,
})

const simState = ref({
  topuz: 'n',
  yaprak: 'n',
  yaprakdurumu: 0,
  cisim: 'n',
  cisimdurumu: false,
  topraklama: false,
})

const currentStep = computed(() => {
  if (selections.value.elektroskop == null) return 0
  if (selections.value.cisim == null) return 1
  if (selections.value.temas == null) return 2
  return 3
})

const experimentKey = computed(() => {
  const { elektroskop, cisim, temas } = selections.value
  if (elektroskop == null) return 'nnn'
  if (cisim == null) return `${elektroskop}nn`
  if (temas == null) return `${elektroskop}${cisim}n`
  return `${elektroskop}${cisim}${temas}`
})

const statusMessage = computed(() => {
  const { elektroskop, cisim, temas } = selections.value
  if (elektroskop == null) {
    return EXPERIMENT_MESSAGES.nnn
  }
  if (cisim == null) {
    return 'Cismin yük durumunu seçin.'
  }
  if (temas == null) {
    return 'Cismi yaklaştırın mı yoksa dokunduracak mısınız?'
  }
  return EXPERIMENT_MESSAGES[experimentKey.value] ?? 'Gözlemi tamamladınız — topraklama ile sıfırlayabilirsiniz.'
})

const panelPulsing = computed(
  () =>
    props.guideFocus === 'panel'
    || props.guideFocus === 'charge'
    || props.simulationTask?.action === 'select-charge',
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome',
)

const canGround = computed(
  () => currentStep.value === 3 && !isGrounding.value && !simState.value.topraklama,
)

// ── 3D sahne referansları ──
let sceneRoot = null
let elektroskopGroup = null
let yapraklarGroup = null
let leftLeaf = null
let rightLeaf = null
let topuzMesh = null
let cisimGroup = null
let cisimMesh = null
let groundLine = null
let activeCamera = null

let topuzCharges = []
let cisimCharges = []
let yaprakCharges = []

let targetLeftRotation = 0
let targetRightRotation = 0
let currentLeftRotation = 0
let currentRightRotation = 0

let cisimAnimating = false
let cisimAnimProgress = 0
let cisimAnimDuration = 30
let cisimStartX = 6
let cisimStartY = 3.5
let cisimTargetX = 6
let cisimTargetY = 3.5

let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }

function chargeColor(type) {
  if (type === '+') return SCENE_COLORS.positive
  if (type === '-') return SCENE_COLORS.negative
  return SCENE_COLORS.gold
}

function clearChargeList(list, parent = sceneRoot) {
  list.forEach((mesh) => parent?.remove(mesh))
  list.length = 0
}

function spawnCharges(count, type, target, list, parent = sceneRoot) {
  clearChargeList(list, parent === yapraklarGroup ? yapraklarGroup : sceneRoot)

  if (type === 'n' || count <= 0) return

  const color = chargeColor(type)
  const isLeaf = target === 'yaprak'

  for (let i = 0; i < count; i++) {
    const symbol = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color }),
    )

    if (isLeaf) {
      const leafSide = i % 2 === 0 ? 'left' : 'right'
      const randomX = (i % 2 === 0 ? -0.25 : 0.25) + (Math.random() - 0.5) * 0.15
      const randomY = -1.2 - Math.random() * 1.4
      symbol.position.set(randomX, randomY, (Math.random() - 0.5) * 0.08)
      symbol.userData.leaf = leafSide
      symbol.userData.basePosition = symbol.position.clone()
      yapraklarGroup.add(symbol)
    } else {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = target === 'topuz' ? 0.65 : 0.55
      const offset = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      )
      const base = target === 'topuz' ? topuzMesh.position : cisimGroup.position
      symbol.position.copy(base).add(offset)
      symbol.userData.baseOffset = offset.clone()
      sceneRoot.add(symbol)
    }

    list.push(symbol)
  }
}

function setLeafTargets(durum) {
  switch (durum) {
    case 1:
      targetLeftRotation = -Math.PI / 12
      targetRightRotation = Math.PI / 12
      break
    case 2:
      targetLeftRotation = -Math.PI / 6
      targetRightRotation = Math.PI / 6
      break
    case 3:
      targetLeftRotation = -Math.PI / 4
      targetRightRotation = Math.PI / 4
      break
    default:
      targetLeftRotation = 0
      targetRightRotation = 0
  }
}

function animateCisimTo(x, y) {
  cisimAnimating = true
  cisimStartX = cisimGroup.position.x
  cisimStartY = cisimGroup.position.y
  cisimTargetX = x
  cisimTargetY = y
  cisimAnimProgress = 0
}

function applySimStateToScene() {
  if (!elektroskopGroup) return

  const state = simState.value

  if (state.topraklama) {
    clearChargeList(topuzCharges)
    clearChargeList(cisimCharges)
    clearChargeList(yaprakCharges, yapraklarGroup)
    topuzMesh.material.color.setHex(SCENE_COLORS.gold)
    leftLeaf.material.color.setHex(SCENE_COLORS.gold)
    rightLeaf.material.color.setHex(SCENE_COLORS.gold)
    if (groundLine) groundLine.visible = true
    return
  }

  if (groundLine) groundLine.visible = false

  const topuzType = state.topuz
  topuzMesh.material.color.setHex(chargeColor(topuzType))
  spawnCharges(topuzType === 'n' ? 0 : 6, topuzType, 'topuz', topuzCharges)

  setLeafTargets(state.yaprakdurumu)
  const yaprakType = state.yaprak
  leftLeaf.material.color.setHex(chargeColor(yaprakType))
  rightLeaf.material.color.setHex(chargeColor(yaprakType))
  spawnCharges(yaprakType === 'n' ? 0 : 6, yaprakType, 'yaprak', yaprakCharges)

  const showCisim = state.cisimdurumu !== false
  const wasVisible = cisimGroup.visible
  cisimGroup.visible = showCisim

  if (showCisim) {
    if (!wasVisible) {
      cisimGroup.position.set(6, 3.5, 0)
    }

    if (state.cisimdurumu === 'd') {
      animateCisimTo(0.55, 3.35)
    } else {
      animateCisimTo(2.0, 3.35)
    }

    cisimGroup.lookAt(topuzMesh.position.x, topuzMesh.position.y, topuzMesh.position.z)
    cisimGroup.rotation.y += Math.PI

    const cisimType = state.cisim
    cisimMesh.material.color.setHex(
      cisimType === 'n' ? SCENE_COLORS.objectNeutral : chargeColor(cisimType),
    )
    spawnCharges(cisimType === 'n' ? 0 : 5, cisimType, 'cisim', cisimCharges)
  } else if (wasVisible) {
    animateCisimTo(6, 3.35)
    clearChargeList(cisimCharges)
  }
}

function applyPhysicsFromSelections() {
  const { elektroskop, cisim, temas } = selections.value
  if (elektroskop == null) return

  const key = experimentKey.value
  const next = {
    topuz: elektroskop,
    yaprak: elektroskop,
    yaprakdurumu: elektroskop !== 'n' ? 2 : 0,
    cisim: cisim ?? 'n',
    cisimdurumu: temas ?? false,
    topraklama: false,
  }

  if (temas == null) {
    simState.value = next
    applySimStateToScene()
    return
  }

  if (['nnd', 'nny'].includes(key)) {
    next.yaprakdurumu = 0
    next.topuz = 'n'
    next.yaprak = 'n'
  } else if (['n+d', 'n-d'].includes(key)) {
    next.yaprakdurumu = 2
    next.topuz = cisim
    next.yaprak = cisim
  } else if (['n+y', 'n-y'].includes(key)) {
    next.yaprakdurumu = 2
    next.topuz = cisim === '+' ? '-' : '+'
    next.yaprak = cisim
  } else if (['++d', '--d'].includes(key)) {
    next.yaprakdurumu = 2
    next.topuz = elektroskop
    next.yaprak = elektroskop
  } else if (['++y', '--y'].includes(key)) {
    next.yaprakdurumu = 3
    next.topuz = elektroskop
    next.yaprak = elektroskop
  } else if (['+-d', '-+d'].includes(key)) {
    next.yaprakdurumu = 0
    next.topuz = 'n'
    next.yaprak = 'n'
  } else if (['+-y', '-+y'].includes(key)) {
    next.yaprakdurumu = 1
    next.topuz = elektroskop
    next.yaprak = elektroskop
  } else if (['+nd', '-nd'].includes(key)) {
    next.yaprakdurumu = 1
    next.topuz = elektroskop
    next.yaprak = elektroskop
  } else if (['+ny', '-ny'].includes(key)) {
    next.yaprakdurumu = 2
    next.topuz = elektroskop
    next.yaprak = elektroskop
  }

  simState.value = next
  applySimStateToScene()

  emit('simulation-event', {
    type: 'experiment-run',
    key,
    elektroskop,
    cisim,
    temas,
  })

  if (props.embedded && temas) {
    award({
      points: 2,
      ruleId: 'elektroskop-experiment',
      label: 'Elektroskop deneyi +2',
      showCharacterBubble: true,
    })
  }
}

function selectElektroskop(charge) {
  selections.value = { elektroskop: charge, cisim: null, temas: null }
  emit('simulation-event', { type: 'charge-select', target: 'elektroskop', charge })
  applyPhysicsFromSelections()
}

function selectCisim(charge) {
  selections.value = { ...selections.value, cisim: charge, temas: null }
  emit('simulation-event', { type: 'charge-select', target: 'cisim', charge })
  applyPhysicsFromSelections()
}

function selectTemas(temas) {
  selections.value = { ...selections.value, temas }
  applyPhysicsFromSelections()
}

function resetExperiment() {
  isGrounding.value = false
  selections.value = { elektroskop: null, cisim: null, temas: null }
  simState.value = {
    topuz: 'n',
    yaprak: 'n',
    yaprakdurumu: 0,
    cisim: 'n',
    cisimdurumu: false,
    topraklama: false,
  }
  applySimStateToScene()
}

function groundElectroscope() {
  if (!canGround.value) return

  isGrounding.value = true
  simState.value = { ...simState.value, topraklama: true }
  applySimStateToScene()

  emit('simulation-event', { type: 'ground' })

  setTimeout(() => {
    resetExperiment()
  }, 1800)
}

function buildElektroskop() {
  elektroskopGroup = new THREE.Group()

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.35, 3.2),
    new THREE.MeshStandardMaterial({ color: SCENE_COLORS.platform, roughness: 0.75 }),
  )
  platform.position.y = -2.6
  platform.receiveShadow = true
  elektroskopGroup.add(platform)

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 4.6, 32, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: SCENE_COLORS.glass,
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      transmission: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  elektroskopGroup.add(glass)

  const capMat = new THREE.MeshStandardMaterial({ color: SCENE_COLORS.metal, metalness: 0.6, roughness: 0.35 })
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.15, 32), capMat)
  topCap.position.y = 2.38
  elektroskopGroup.add(topCap)

  const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.15, 32), capMat)
  bottomCap.position.y = -2.28
  elektroskopGroup.add(bottomCap)

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 3.6, 16),
    new THREE.MeshStandardMaterial({ color: SCENE_COLORS.metal, metalness: 0.7, roughness: 0.3 }),
  )
  rod.position.y = 0.6
  elektroskopGroup.add(rod)

  topuzMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 32, 32),
    new THREE.MeshStandardMaterial({ color: SCENE_COLORS.gold, metalness: 0.75, roughness: 0.2 }),
  )
  topuzMesh.position.y = 2.95
  elektroskopGroup.add(topuzMesh)

  yapraklarGroup = new THREE.Group()
  const leafMat = new THREE.MeshStandardMaterial({
    color: SCENE_COLORS.gold,
    side: THREE.DoubleSide,
    metalness: 0.45,
    roughness: 0.35,
  })

  const support = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: SCENE_COLORS.metal }),
  )
  support.position.y = -0.95
  yapraklarGroup.add(support)

  const leftGeo = new THREE.PlaneGeometry(0.28, 1.85)
  leftGeo.translate(0, -0.925, 0)
  leftLeaf = new THREE.Mesh(leftGeo, leafMat.clone())
  leftLeaf.position.set(-0.22, -0.95, 0)
  yapraklarGroup.add(leftLeaf)

  const rightGeo = new THREE.PlaneGeometry(0.28, 1.85)
  rightGeo.translate(0, -0.925, 0)
  rightLeaf = new THREE.Mesh(rightGeo, leafMat.clone())
  rightLeaf.position.set(0.22, -0.95, 0)
  yapraklarGroup.add(rightLeaf)

  elektroskopGroup.add(yapraklarGroup)
  sceneRoot.add(elektroskopGroup)
}

function buildCisim() {
  cisimGroup = new THREE.Group()
  cisimMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 32, 32),
    new THREE.MeshStandardMaterial({ color: SCENE_COLORS.objectNeutral, metalness: 0.5, roughness: 0.35 }),
  )
  cisimGroup.add(cisimMesh)

  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.6, 12),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
  )
  stick.rotation.x = Math.PI / 2
  stick.position.z = 0.85
  cisimGroup.add(stick)

  cisimGroup.position.set(6, 3.35, 0)
  cisimGroup.rotation.z = -Math.PI / 8
  cisimGroup.visible = false
  sceneRoot.add(cisimGroup)
}

function buildGroundLine() {
  groundLine = new THREE.Group()
  const mat = new THREE.LineBasicMaterial({ color: 0x64748b })

  const segments = [
    [[-1.8, -2.35, 0.2], [0, -2.35, 0.2]],
    [[-1.8, -2.35, 0.2], [-1.8, -3.6, 0.2]],
    [[-2.2, -3.6, 0.2], [-1.4, -3.6, 0.2]],
    [[-2.05, -3.85, 0.2], [-1.55, -3.85, 0.2]],
    [[-1.95, -4.05, 0.2], [-1.65, -4.05, 0.2]],
  ]

  segments.forEach(([a, b]) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...a),
      new THREE.Vector3(...b),
    ])
    groundLine.add(new THREE.Line(geo, mat))
  })

  groundLine.visible = false
  sceneRoot.add(groundLine)
}

function buildLabDecor(scene) {
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.12, 4),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }),
  )
  bench.position.set(0, -2.85, 0)
  bench.receiveShadow = true
  sceneRoot.add(bench)
}

function updateCameraFromState() {
  if (!activeCamera || !cameraState) return
  const { yaw, pitch, distance } = cameraState
  const target = new THREE.Vector3(0, 0.5, 0)
  activeCamera.position.set(
    target.x + distance * Math.sin(yaw) * Math.cos(pitch),
    target.y + distance * Math.sin(pitch),
    target.z + distance * Math.cos(yaw) * Math.cos(pitch),
  )
  activeCamera.lookAt(target)
}

function updateSceneFrame() {
  if (leftLeaf && rightLeaf) {
    currentLeftRotation += (targetLeftRotation - currentLeftRotation) * 0.12
    currentRightRotation += (targetRightRotation - currentRightRotation) * 0.12
    leftLeaf.rotation.z = currentLeftRotation
    rightLeaf.rotation.z = currentRightRotation

    yaprakCharges.forEach((yuk) => {
      const isLeft = yuk.userData.leaf === 'left'
      const rotation = isLeft ? currentLeftRotation : currentRightRotation
      const base = yuk.userData.basePosition.clone()
      const rotMatrix = new THREE.Matrix4().makeRotationZ(rotation)
      base.applyMatrix4(rotMatrix)
      yuk.position.copy(base)
    })
  }

  if (cisimAnimating && cisimGroup) {
    cisimAnimProgress++
    const t = Math.min(1, cisimAnimProgress / cisimAnimDuration)
    const eased = 1 - (1 - t) ** 3
    cisimGroup.position.x = cisimStartX + (cisimTargetX - cisimStartX) * eased
    cisimGroup.position.y = cisimStartY + (cisimTargetY - cisimStartY) * eased

    cisimCharges.forEach((yuk) => {
      yuk.position.x = cisimGroup.position.x + yuk.userData.baseOffset.x
      yuk.position.y = cisimGroup.position.y + yuk.userData.baseOffset.y
      yuk.position.z = cisimGroup.position.z + yuk.userData.baseOffset.z
    })

    if (cisimAnimProgress >= cisimAnimDuration) cisimAnimating = false
  }

  if (topuzMesh) {
    topuzCharges.forEach((yuk) => {
      yuk.position.copy(topuzMesh.position).add(yuk.userData.baseOffset)
    })
  }
}

const { canvasRef, ready } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  onInit({ scene, camera, renderer }) {
    scene.background = new THREE.Color(0x02040a)
    renderer.shadowMap.enabled = true

    activeCamera = camera
    cameraState = { yaw: 0.55, pitch: 0.42, distance: 11 }
    updateCameraFromState()

    sceneRoot = new THREE.Group()
    scene.add(sceneRoot)

    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(4, 9, 6)
    key.castShadow = true
    scene.add(key)

    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.25)
    rim.position.set(-5, 3, -4)
    scene.add(rim)

    buildLabDecor(scene)
    buildElektroskop()
    buildCisim()
    buildGroundLine()
    applySimStateToScene()
  },
  onFrame() {
    updateCameraFromState()
    updateSceneFrame()
  },
  onDispose() {
    sceneRoot = null
    activeCamera = null
    cameraState = null
  },
})

watch(ready, async (isReady) => {
  if (!isReady) return
  try {
    const models = await loadSimulationModels(props.config.models ?? [])
    const table = models.get(modelKey('school-lab', 'lab-table'))
    if (table) {
      table.scale.setScalar(0.015)
      table.position.set(0, -2.9, 0)
      sceneRoot?.add(table)
    }
  } catch (err) {
    bootError.value = err?.message ?? 'Dekor modelleri yüklenemedi.'
  }
}, { immediate: true })

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
  cameraState.pitch = Math.max(0.12, Math.min(1.05, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  cameraState.distance = Math.max(7, Math.min(16, cameraState.distance + event.deltaY * 0.012))
}
</script>

<template>
  <div
    class="elektroskop-scene"
    :class="{ 'elektroskop-scene--embedded': embedded }"
  >
    <p
      v-if="bootError"
      class="elektroskop-scene__error"
    >
      {{ bootError }}
    </p>

    <canvas
      ref="canvasRef"
      class="elektroskop-scene__canvas"
      :class="{ 'elektroskop-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
    />

    <aside
      class="elektroskop-scene__panel"
      :class="{ 'elektroskop-scene__target--pulse': panelPulsing }"
    >
      <div
        v-if="simulationTask?.action === 'select-charge'"
        class="elektroskop-scene__task"
      >
        <p class="elektroskop-scene__task-label">
          Yük seç
        </p>
      </div>

      <p class="elektroskop-scene__panel-title">
        Elektroskop deneyi
      </p>

      <ol class="elektroskop-scene__steps">
        <li :class="{ 'elektroskop-scene__step--active': currentStep === 0, 'elektroskop-scene__step--done': currentStep > 0 }">
          Elektroskop yükü
        </li>
        <li :class="{ 'elektroskop-scene__step--active': currentStep === 1, 'elektroskop-scene__step--done': currentStep > 1 }">
          Cisim yükü
        </li>
        <li :class="{ 'elektroskop-scene__step--active': currentStep === 2, 'elektroskop-scene__step--done': currentStep > 2 }">
          Temas türü
        </li>
      </ol>

      <div
        v-if="currentStep === 0"
        class="elektroskop-scene__choices"
      >
        <button
          v-for="opt in CHARGE_OPTIONS"
          :key="`e-${opt.id}`"
          type="button"
          class="elektroskop-scene__choice"
          :class="{ 'elektroskop-scene__choice--active': selections.elektroskop === opt.id }"
          @click="selectElektroskop(opt.id)"
        >
          <span
            class="elektroskop-scene__swatch"
            :style="{ backgroundColor: opt.color }"
          />
          {{ opt.label }}
        </button>
      </div>

      <div
        v-else-if="currentStep === 1"
        class="elektroskop-scene__choices"
      >
        <button
          v-for="opt in CHARGE_OPTIONS"
          :key="`c-${opt.id}`"
          type="button"
          class="elektroskop-scene__choice"
          :class="{ 'elektroskop-scene__choice--active': selections.cisim === opt.id }"
          @click="selectCisim(opt.id)"
        >
          <span
            class="elektroskop-scene__swatch"
            :style="{ backgroundColor: opt.color }"
          />
          {{ opt.label }}
        </button>
      </div>

      <div
        v-else-if="currentStep === 2"
        class="elektroskop-scene__choices"
      >
        <button
          type="button"
          class="elektroskop-scene__choice"
          :class="{ 'elektroskop-scene__choice--active': selections.temas === 'y' }"
          @click="selectTemas('y')"
        >
          Yaklaştır
        </button>
        <button
          type="button"
          class="elektroskop-scene__choice"
          :class="{ 'elektroskop-scene__choice--active': selections.temas === 'd' }"
          @click="selectTemas('d')"
        >
          Dokundur
        </button>
      </div>

      <div class="elektroskop-scene__info">
        <p>{{ statusMessage }}</p>
      </div>

      <div class="elektroskop-scene__legend">
        <span><i class="elektroskop-scene__dot elektroskop-scene__dot--pos" /> Pozitif (+)</span>
        <span><i class="elektroskop-scene__dot elektroskop-scene__dot--neg" /> Negatif (−)</span>
        <span><i class="elektroskop-scene__dot elektroskop-scene__dot--neu" /> Nötr (n)</span>
      </div>

      <div class="elektroskop-scene__actions">
        <button
          v-if="canGround"
          type="button"
          class="elektroskop-scene__btn elektroskop-scene__btn--ground"
          :class="{ 'elektroskop-scene__target--pulse': guideFocus === 'ground' }"
          @click="groundElectroscope"
        >
          Toprakla
        </button>
        <button
          type="button"
          class="elektroskop-scene__btn"
          @click="resetExperiment"
        >
          Sıfırla
        </button>
      </div>

      <ul
        v-if="config.hints?.length"
        class="elektroskop-scene__hints"
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
.elektroskop-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.elektroskop-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.elektroskop-scene__canvas:active {
  cursor: grabbing;
}

.elektroskop-scene__error {
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

.elektroskop-scene__panel {
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

.elektroskop-scene--embedded {
  border-radius: inherit;
  overflow: hidden;
  contain: strict;
}

.elektroskop-scene--embedded .elektroskop-scene__canvas {
  transform: translateZ(0);
}

.elektroskop-scene--embedded .elektroskop-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(220px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(8, 12, 22, 0.88);
}

.elektroskop-scene--embedded .elektroskop-scene__hints {
  display: none;
}

.elektroskop-scene__task {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.elektroskop-scene__task-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.elektroskop-scene__panel-title {
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fbbf24;
}

.elektroskop-scene__steps {
  margin: 0 0 0.75rem;
  padding-left: 1.1rem;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #64748b;
}

.elektroskop-scene__step--active {
  color: #7dd3fc;
  font-weight: 600;
}

.elektroskop-scene__step--done {
  color: #94a3b8;
}

.elektroskop-scene__choices {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.elektroskop-scene__choice {
  display: flex;
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

.elektroskop-scene__choice:hover {
  border-color: rgba(56, 189, 248, 0.45);
  background: rgba(56, 189, 248, 0.1);
}

.elektroskop-scene__choice--active {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(251, 191, 36, 0.12);
}

.elektroskop-scene__swatch {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.elektroskop-scene__info {
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  background: rgba(2, 4, 10, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.elektroskop-scene__info p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #94a3b8;
}

.elektroskop-scene__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.65rem;
  margin-bottom: 0.75rem;
  font-size: 0.72rem;
  color: #64748b;
}

.elektroskop-scene__dot {
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  margin-right: 0.25rem;
  vertical-align: middle;
}

.elektroskop-scene__dot--pos {
  background: #f87171;
}

.elektroskop-scene__dot--neg {
  background: #60a5fa;
}

.elektroskop-scene__dot--neu {
  background: #fbbf24;
}

.elektroskop-scene__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.elektroskop-scene__btn {
  flex: 1;
  min-width: 5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5e1;
  font-size: 0.78rem;
  cursor: pointer;
}

.elektroskop-scene__btn:hover {
  border-color: rgba(56, 189, 248, 0.45);
}

.elektroskop-scene__btn--ground {
  border-color: rgba(248, 113, 113, 0.45);
  color: #fca5a5;
}

.elektroskop-scene__hints {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
}

.elektroskop-scene__target--pulse {
  animation: elektroskop-guide-pulse 1.6s ease-in-out infinite;
}

@keyframes elektroskop-guide-pulse {
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
  .elektroskop-scene__panel {
    right: max(0.5rem, env(safe-area-inset-right));
    left: max(0.5rem, env(safe-area-inset-left));
    width: auto;
    max-height: 42vh;
  }

  .elektroskop-scene__hints {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .elektroskop-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}
</style>
