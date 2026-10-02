<script setup>
import { ref, computed, watch } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import {
  loadSimulationModels,
  modelKey,
} from '../../../lib/simulation/loadSimulationModels.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const ATOM_MODELS = [
  {
    id: 'dalton',
    name: 'Dalton Atom Modeli',
    scientist: 'John Dalton',
    year: 1803,
    description:
      'Atomlar küçük, bölünemez, sert küreler olarak tasarlanmıştır. Her elementin atomları kendine özgü kütle ve özelliklere sahiptir.',
  },
  {
    id: 'thomson',
    name: 'Thomson Atom Modeli (Üzümlü Kek)',
    scientist: 'J.J. Thomson',
    year: 1897,
    description:
      'Pozitif yüklü bir kütle içine gömülmüş negatif yüklü elektronlardan oluşan “üzümlü kek” modeli. Atom elektriksel olarak nötrdür.',
  },
  {
    id: 'rutherford',
    name: 'Rutherford Atom Modeli',
    scientist: 'Ernest Rutherford',
    year: 1911,
    description:
      'Altın folyo deneyi sonucunda merkezde yoğun pozitif çekirdek ve çevresinde dönen elektronlar. Atom çoğunlukla boş alandan oluşur.',
  },
  {
    id: 'bohr',
    name: 'Bohr Atom Modeli',
    scientist: 'Niels Bohr',
    year: 1913,
    description:
      'Elektronlar belirli enerji seviyelerinde (yörüngelerde) hareket eder. Yörüngeler arası geçişler spektrumları açıklar.',
  },
  {
    id: 'quantum',
    name: 'Modern Kuantum Atom Modeli',
    scientist: 'Schrödinger, Heisenberg vd.',
    year: 1926,
    description:
      'Elektronlar belirli yörüngelerde değil, olasılık bulutu (elektron bulutu) içinde bulunur. Modern atom teorisinin temelidir.',
  },
]

const bootLoading = ref(true)
const bootError = ref(null)
const selectedModelIndex = ref(0)
const autoRotate = ref(true)

const currentModel = computed(() => ATOM_MODELS[selectedModelIndex.value])

const panelPulsing = computed(
  () =>
    props.guideFocus === 'panel'
    || props.guideFocus === 'timeline'
    || props.guideFocus === 'model'
    || props.simulationTask?.action === 'select-model',
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome'
    || props.guideFocus === 'experiment',
)

const experimentPulsing = computed(
  () => props.guideFocus === 'experiment',
)

let atomGroup = null
let sceneRoot = null
let activeCamera = null
let raycaster = null
let pointer = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let alphaParticles = []

const { canvasRef, ready, context } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,

  onInit({ renderer, scene, camera }) {
    renderer.setClearColor(0x02040a)
    scene.fog = new THREE.FogExp2(0x02040a, 0.035)
    activeCamera = camera
    sceneRoot = scene

    camera.position.set(0, 1.2, 5.5)
    camera.lookAt(0, 0, 0)

    cameraState = {
      yaw: 0.4,
      pitch: 0.25,
      distance: 6,
      target: new THREE.Vector3(0, 0, 0),
    }

    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    const ambient = new THREE.AmbientLight(0x8899bb, 0.55)
    const key = new THREE.PointLight(0xfff0dd, 1.4, 30, 1)
    key.position.set(4, 6, 5)
    const fill = new THREE.DirectionalLight(0x6688cc, 0.35)
    fill.position.set(-5, 3, -4)
    scene.add(ambient, key, fill)

    rebuildAtomModel(currentModel.value.id)
  },

  onFrame({ camera, delta }) {
    activeCamera = camera
    updateCamera(camera)

    if (autoRotate.value && atomGroup) {
      atomGroup.rotation.y += delta * 0.35
    }

    animateThomsonElectrons()
    animateBohrElectrons(delta)
    animateRutherfordOrbits(delta)
    updateAlphaParticles()
  },

  onDispose({ scene }) {
    clearAlphaParticles()
    disposeObject(atomGroup)
    atomGroup = null
    sceneRoot = null
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

watch(selectedModelIndex, (index) => {
  const model = ATOM_MODELS[index]
  clearAlphaParticles()
  rebuildAtomModel(model.id)
  emit('simulation-event', {
    type: 'model-select',
    modelId: model.id,
    name: model.name,
    year: model.year,
  })
})

function disposeObject(object) {
  if (!object) return
  object.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m.dispose?.())
    }
  })
}

async function loadDecorations(scene) {
  const models = await loadSimulationModels(props.config.models ?? [])
  const template = models.get(modelKey('school-lab', 'atom-model'))
  if (!template) return

  const display = template.clone(true)
  display.scale.setScalar(0.22)
  display.position.set(-3.2, -1.2, -2.5)
  display.rotation.y = Math.PI / 6
  display.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone()
      child.material.transparent = true
      child.material.opacity = 0.35
    }
  })
  scene.add(display)
}

function rebuildAtomModel(modelId) {
  if (!sceneRoot) return

  if (atomGroup) {
    sceneRoot.remove(atomGroup)
    disposeObject(atomGroup)
    atomGroup = null
  }

  atomGroup = new THREE.Group()
  atomGroup.userData = { type: 'atom-model', id: modelId }

  switch (modelId) {
    case 'dalton':
      buildDalton(atomGroup)
      break
    case 'thomson':
      buildThomson(atomGroup)
      break
    case 'rutherford':
      buildRutherford(atomGroup)
      break
    case 'bohr':
      buildBohr(atomGroup)
      break
    case 'quantum':
      buildQuantum(atomGroup)
      break
    default:
      break
  }

  sceneRoot.add(atomGroup)
}

function addAtomShell(group, radius, options = {}) {
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({
      color: options.color ?? 0x2196f3,
      transparent: true,
      opacity: options.opacity ?? 0.18,
      depthWrite: false,
    }),
  )
  shell.userData = { role: 'atom-shell' }
  group.add(shell)
}

function buildDalton(group) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 40),
    new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.65,
      metalness: 0.25,
    }),
  )
  mesh.userData = { role: 'nucleus' }
  group.add(mesh)
}

function buildThomson(group) {
  const cake = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 40, 40),
    new THREE.MeshStandardMaterial({
      color: 0xe57373,
      transparent: true,
      opacity: 0.72,
      roughness: 0.45,
    }),
  )
  group.add(cake)

  const electronGeo = new THREE.SphereGeometry(0.09, 12, 12)
  const electronMat = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.45,
  })

  for (let i = 0; i < 12; i += 1) {
    const electron = new THREE.Mesh(electronGeo, electronMat)
    const radius = 1.1 * Math.random()
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    electron.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    )
    electron.userData = { role: 'electron', maxRadius: 1.15 }
    group.add(electron)
  }
}

function buildRutherford(group) {
  addAtomShell(group, 1.55)

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff5722,
      emissive: 0xe64a19,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.6,
    }),
  )
  nucleus.userData = { role: 'nucleus' }
  group.add(nucleus)

  const electronGeo = new THREE.SphereGeometry(0.07, 12, 12)
  const electronMat = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.45,
  })

  for (let i = 0; i < 5; i += 1) {
    const orbit = new THREE.Group()
    orbit.rotation.x = Math.random() * Math.PI
    orbit.rotation.y = Math.random() * Math.PI
    const electron = new THREE.Mesh(electronGeo, electronMat)
    const radius = 0.9 + Math.random() * 0.55
    electron.position.x = radius
    electron.userData = { role: 'electron', orbitSpeed: 0.4 + Math.random() * 0.3 }
    orbit.add(electron)
    orbit.userData = { role: 'electron-orbit' }
    group.add(orbit)
  }
}

function buildBohr(group) {
  addAtomShell(group, 2.0)

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff5722,
      emissive: 0xe64a19,
      emissiveIntensity: 0.45,
      metalness: 0.55,
    }),
  )
  group.add(nucleus)

  const orbitalRadii = [0.75, 1.25, 1.85]
  const electronCounts = [2, 4, 4]
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.45,
  })
  const electronGeo = new THREE.SphereGeometry(0.07, 12, 12)
  const electronMat = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.45,
  })

  orbitalRadii.forEach((radius) => {
    const points = []
    for (let i = 0; i <= 64; i += 1) {
      const theta = (i / 64) * Math.PI * 2
      points.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0))
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      lineMat,
    )
    group.add(line)
  })

  orbitalRadii.forEach((radius, orbitIndex) => {
    const count = electronCounts[orbitIndex]
    for (let j = 0; j < count; j += 1) {
      const electron = new THREE.Mesh(electronGeo, electronMat)
      const angle = (j / count) * Math.PI * 2
      electron.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0)
      electron.userData = {
        role: 'bohr-electron',
        radius,
        angle,
      }
      group.add(electron)
    }
  })
}

function buildQuantum(group) {
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff5722,
      emissive: 0xe64a19,
      emissiveIntensity: 0.5,
    }),
  )
  group.add(nucleus)

  addAtomShell(group, 1.45)

  const count = 120
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const r = 1.45 * Math.pow(Math.random(), 0.33)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }

  const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
    new THREE.PointsMaterial({
      color: 0x4fc3f7,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  group.add(particles)
}

function animateThomsonElectrons() {
  if (!atomGroup || currentModel.value.id !== 'thomson') return

  atomGroup.children.forEach((child) => {
    if (child.userData?.role !== 'electron') return
    child.position.x += (Math.random() - 0.5) * 0.012
    child.position.y += (Math.random() - 0.5) * 0.012
    child.position.z += (Math.random() - 0.5) * 0.012
    const maxR = child.userData.maxRadius ?? 1.15
    if (child.position.length() > maxR) {
      child.position.normalize().multiplyScalar(maxR)
    }
  })
}

function animateBohrElectrons(delta) {
  if (!atomGroup || currentModel.value.id !== 'bohr') return

  atomGroup.children.forEach((child) => {
    if (child.userData?.role !== 'bohr-electron') return
    const { radius } = child.userData
    child.userData.angle = (child.userData.angle ?? 0) + (0.35 / Math.sqrt(radius)) * delta
    const angle = child.userData.angle
    child.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0)
  })
}

function animateRutherfordOrbits(delta) {
  if (!atomGroup || currentModel.value.id !== 'rutherford') return

  atomGroup.children.forEach((child) => {
    if (child.userData?.role !== 'electron-orbit') return
    child.rotation.z += delta * (child.children[0]?.userData?.orbitSpeed ?? 0.5)
  })
}

function clearAlphaParticles() {
  alphaParticles.forEach((particle) => {
    sceneRoot?.remove(particle)
    particle.geometry?.dispose()
    particle.material?.dispose()
  })
  alphaParticles = []
}

function startRutherfordExperiment() {
  if (currentModel.value.id !== 'rutherford' || !sceneRoot) return

  clearAlphaParticles()
  emit('simulation-event', { type: 'rutherford-experiment' })

  for (let i = 0; i < 12; i += 1) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
    )
    const range = 1.8
    particle.position.set(
      (Math.random() * 2 - 1) * range,
      (Math.random() * 2 - 1) * range,
      -3.5,
    )
    particle.userData = {
      velocity: new THREE.Vector3(0, 0, 0.06),
      deflected: false,
    }
    sceneRoot.add(particle)
    alphaParticles.push(particle)
  }
}

function updateAlphaParticles() {
  if (!alphaParticles.length) return

  alphaParticles = alphaParticles.filter((particle) => {
    particle.position.add(particle.userData.velocity)

    const dist = particle.position.length()
    if (dist < 0.45 && !particle.userData.deflected) {
      particle.userData.deflected = true
      const speed = particle.userData.velocity.length()
      const angle = Math.random() * Math.PI
      const azimuth = Math.random() * Math.PI * 2
      particle.userData.velocity.set(
        speed * Math.sin(angle) * Math.cos(azimuth),
        speed * Math.sin(angle) * Math.sin(azimuth),
        speed * Math.cos(angle),
      )
      particle.material.color.set(0xff4081)
    }

    if (
      Math.abs(particle.position.x) > 6
      || Math.abs(particle.position.y) > 6
      || Math.abs(particle.position.z) > 6
    ) {
      sceneRoot?.remove(particle)
      particle.geometry?.dispose()
      particle.material?.dispose()
      return false
    }
    return true
  })
}

function triggerElectronJump() {
  if (currentModel.value.id !== 'bohr' || !atomGroup) return

  const electrons = atomGroup.children.filter((c) => c.userData?.role === 'bohr-electron')
  if (!electrons.length) return

  const electron = electrons[Math.floor(Math.random() * electrons.length)]
  const currentRadius = electron.userData.radius
  const radii = [0.75, 1.25, 1.85]
  const currentIndex = radii.indexOf(currentRadius)
  let nextIndex = currentIndex

  if (currentIndex === -1) {
    nextIndex = Math.floor(Math.random() * radii.length)
  } else if (Math.random() > 0.5 && currentIndex < radii.length - 1) {
    nextIndex = currentIndex + 1
  } else if (currentIndex > 0) {
    nextIndex = currentIndex - 1
  }

  const newRadius = radii[nextIndex]
  electron.userData.radius = newRadius
  const angle = electron.userData.angle ?? 0
  electron.position.set(newRadius * Math.cos(angle), newRadius * Math.sin(angle), 0)

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 1,
    }),
  )
  flash.position.copy(electron.position)
  atomGroup.add(flash)

  let opacity = 1
  const fade = setInterval(() => {
    opacity -= 0.08
    flash.material.opacity = opacity
    if (opacity <= 0) {
      clearInterval(fade)
      atomGroup.remove(flash)
      flash.geometry.dispose()
      flash.material.dispose()
    }
  }, 40)

  emit('simulation-event', { type: 'electron-jump', fromRadius: currentRadius, toRadius: newRadius })
}

function selectModel(index) {
  selectedModelIndex.value = index
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
  cameraState.pitch = Math.max(-0.15, Math.min(1.05, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState) return
  event.preventDefault()
  cameraState.distance = Math.max(3.5, Math.min(12, cameraState.distance + event.deltaY * 0.012))
}
</script>

<template>
  <div
    class="atom-tarih-scene"
    :class="{ 'atom-tarih-scene--embedded': embedded }"
  >
    <div
      v-if="bootLoading"
      class="atom-tarih-scene__overlay"
    >
      Sahne hazırlanıyor…
    </div>

    <p
      v-if="bootError"
      class="atom-tarih-scene__error"
    >
      {{ bootError }}
    </p>

    <canvas
      ref="canvasRef"
      class="atom-tarih-scene__canvas"
      :class="{ 'atom-tarih-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
    />

    <aside
      class="atom-tarih-scene__panel"
      :class="{ 'atom-tarih-scene__target--pulse': panelPulsing }"
    >
      <p class="atom-tarih-scene__model-title">
        {{ currentModel.name }}
      </p>
      <p class="atom-tarih-scene__model-meta">
        {{ currentModel.scientist }}
      </p>

      <p class="atom-tarih-scene__timeline-label">
        Tarih seçin
      </p>
      <div
        class="atom-tarih-scene__model-picks"
        :class="{ 'atom-tarih-scene__target--pulse': guideFocus === 'timeline' || guideFocus === 'model' }"
      >
        <button
          v-for="(model, index) in ATOM_MODELS"
          :key="model.id"
          type="button"
          class="atom-tarih-scene__model-pick"
          :class="{ 'atom-tarih-scene__model-pick--active': selectedModelIndex === index }"
          @click="selectModel(index)"
        >
          {{ model.year }}
        </button>
      </div>

      <div class="atom-tarih-scene__actions">
        <button
          v-if="currentModel.id === 'rutherford'"
          type="button"
          class="atom-tarih-scene__btn"
          :class="{ 'atom-tarih-scene__target--pulse': experimentPulsing }"
          @click="startRutherfordExperiment"
        >
          Rutherford deneyi
        </button>

        <button
          v-if="currentModel.id === 'bohr'"
          type="button"
          class="atom-tarih-scene__btn"
          :class="{ 'atom-tarih-scene__target--pulse': experimentPulsing }"
          @click="triggerElectronJump"
        >
          Elektron sıçraması
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.atom-tarih-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.atom-tarih-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.atom-tarih-scene__canvas:active {
  cursor: grabbing;
}

.atom-tarih-scene__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 8, 20, 0.7);
  color: var(--sim-text-secondary, #94a3b8);
  z-index: 2;
}

.atom-tarih-scene__error {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(248, 113, 113, 0.15);
  color: var(--sim-accent-danger, #f87171);
  z-index: 3;
}

.atom-tarih-scene__panel {
  position: absolute;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  width: min(280px, calc(100% - 1.5rem));
  max-height: calc(100% - 5rem);
  overflow-y: auto;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--sim-border, rgba(148, 163, 184, 0.2));
  background: var(--sim-panel-bg, rgba(15, 23, 42, 0.88));
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  z-index: 2;
}

.atom-tarih-scene--embedded {
  border-radius: inherit;
  overflow: hidden;
  contain: strict;
}

.atom-tarih-scene--embedded .atom-tarih-scene__canvas {
  transform: translateZ(0);
}

.atom-tarih-scene--embedded .atom-tarih-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--sim-border-accent, rgba(56, 189, 248, 0.28));
  background: var(--sim-panel-bg-embedded, rgba(8, 12, 22, 0.88));
}

@media (max-width: 640px) {
  .atom-tarih-scene__panel {
    right: max(0.5rem, env(safe-area-inset-right));
    left: max(0.5rem, env(safe-area-inset-left));
    width: auto;
    max-height: 40vh;
  }
}

.atom-tarih-scene__timeline-label {
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  color: var(--sim-text-primary, #cbd5e1);
}

.atom-tarih-scene__model-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.atom-tarih-scene__model-pick {
  padding: 0.28rem 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: var(--sim-text-primary, #cbd5e1);
  font-size: 0.72rem;
  cursor: pointer;
}

.atom-tarih-scene__model-pick--active {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(251, 191, 36, 0.14);
  color: #fde68a;
}

.atom-tarih-scene__model-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--sim-accent-warm, #fbbf24);
  line-height: 1.35;
}

.atom-tarih-scene--embedded .atom-tarih-scene__model-title {
  font-size: 0.85rem;
}

.atom-tarih-scene__model-meta {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.78rem;
  color: var(--sim-text-secondary, #94a3b8);
}

.atom-tarih-scene__actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.atom-tarih-scene__btn {
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.7);
  color: var(--sim-text-primary, #cbd5e1);
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
}

.atom-tarih-scene__target--pulse {
  animation: atom-tarih-pulse 1.6s ease-in-out infinite;
}

@keyframes atom-tarih-pulse {
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
  .atom-tarih-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}
</style>
