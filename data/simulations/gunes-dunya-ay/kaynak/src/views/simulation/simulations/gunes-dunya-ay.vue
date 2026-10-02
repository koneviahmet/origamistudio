<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
import * as THREE from 'three'
import { useSimulationScene } from '../../../composables/useSimulationScene.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const SHAPE_OPTIONS = [
  { id: 'sphere', label: 'Küre' },
  { id: 'cube', label: 'Küp' },
  { id: 'octahedron', label: 'Oktahedron' },
  { id: 'dodecahedron', label: 'Dodekahedron' },
  { id: 'icosahedron', label: 'İkosahedron' },
]

const CAMERA_OPTIONS = [
  { id: 'free', label: 'Serbest' },
  { id: 'sun', label: 'Güneş' },
  { id: 'earth', label: 'Dünya' },
  { id: 'moon', label: 'Ay' },
]

const BODIES = {
  sun: {
    id: 'sun',
    name: 'Güneş',
    color: 0xffcc33,
    radius: 1.5,
    info: 'Merkezdeki yıldız. Kendi ekseni etrafında döner.',
  },
  earth: {
    id: 'earth',
    name: 'Dünya',
    color: 0x3b82f6,
    radius: 0.55,
    orbit: 8,
    orbitSpeed: 0.35,
    spinSpeed: 1.8,
    info: 'Güneş etrafında dolanır ve kendi ekseni etrafında döner.',
  },
  moon: {
    id: 'moon',
    name: 'Ay',
    color: 0xc4c4c4,
    radius: 0.2,
    orbit: 1.6,
    orbitSpeed: 2.4,
    spinSpeed: 2.4,
    info: 'Dünya etrafında dolanır (gelgit kilidi: aynı yüzü gösterir).',
  },
}

const speed = ref(props.config.defaultSpeed ?? 1)
const cameraMode = ref('free')
const showOrbits = ref(false)
const showSpinAxes = ref(false)
/** Dünya ve Ay yüzey netliği / aydınlığı (1 = normal) */
const clarity = ref(1.4)
const shapeSun = ref('sphere')
const shapeEarth = ref('sphere')
const shapeMoon = ref('sphere')
const selectedBody = shallowRef(null)
/** Gömülü diyalogda ayarlar, unlock gelene kadar gizli */
const controlsUnlocked = ref(!props.embedded)

const showControlsPanel = computed(() => !props.embedded || controlsUnlocked.value)

const panelPulsing = computed(
  () =>
    showControlsPanel.value && (
      props.guideFocus === 'speed'
      || props.guideFocus === 'sim-panel'
      || props.guideFocus === 'orbits'
      || props.guideFocus === 'shapes'
      || props.guideFocus === 'panel'
    ),
)

const canvasPulsing = computed(
  () =>
    props.guideFocus === 'camera'
    || props.guideFocus === 'welcome'
    || props.guideFocus === 'orbits',
)

const cameraHint = computed(() => {
  switch (cameraMode.value) {
    case 'sun': return 'Güneş’ten Dünya’ya bakıyorsun'
    case 'earth': return 'Dünya’dan Güneş’e bakıyorsun'
    case 'moon': return 'Ay’dan Dünya’ya bakıyorsun'
    default: return 'Serbest kamera'
  }
})

let sunPivot = null
let earthPivot = null
let moonPivot = null
let sunMesh = null
let earthMesh = null
let moonMesh = null
let earthOrbitLine = null
let moonOrbitLine = null
let sunAxis = null
let earthAxis = null
let moonAxis = null
let sunLight = null
let ambientLight = null
let fillLight = null
let activeCamera = null
let raycaster = null
let pointer = null
let cameraState = null
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let dragMoved = false
let earthAngle = 0
let moonAngle = Math.PI // Güneş tarafında başla → Ay'dan bakınca Dünya aydınlık yüzü görünür
const _tmp = new THREE.Vector3()
const _look = new THREE.Vector3()
const _from = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()

/** Yüklenen yüzey dokuları — şekil değişince yeniden kullanılır */
const bodyTextures = {
  sun: null,
  earth: null,
  earthNormal: null,
  earthClouds: null,
  moon: null,
  moonBump: null,
}

const TEXTURE_PATHS = {
  earth: '/assets/simulation-models/textures/earth.jpg',
  earthNormal: '/assets/simulation-models/textures/earth_normal.jpg',
  earthClouds: '/assets/simulation-models/textures/earth_clouds.jpg',
  moon: '/assets/simulation-models/textures/moon.jpg',
  moonBump: '/assets/simulation-models/textures/moon_bump.jpg',
}

const TEXTURE_FALLBACKS = {
  earth: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  earthNormal: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
  earthClouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  moon: 'https://threejs.org/examples/textures/planets/moon_1024.jpg',
  moonBump: 'https://threejs.org/examples/textures/planets/moon_bump.jpg',
}

watch(speed, (value) => {
  emit('simulation-event', { type: 'speed-change', speed: value })
})

watch(cameraMode, (value) => {
  emit('simulation-event', { type: 'camera-change', camera: value })
})

watch(showOrbits, (value) => {
  emit('simulation-event', { type: 'orbit-toggle', visible: value })
  applyOrbitVisibility()
})

watch(showSpinAxes, () => {
  applyAxisVisibility()
})

watch(shapeSun, (value) => {
  rebuildBodyMesh('sun', value)
  emit('simulation-event', { type: 'shape-change', bodyId: 'sun', shape: value })
})

watch(shapeEarth, (value) => {
  rebuildBodyMesh('earth', value)
  emit('simulation-event', { type: 'shape-change', bodyId: 'earth', shape: value })
})

watch(shapeMoon, (value) => {
  rebuildBodyMesh('moon', value)
  emit('simulation-event', { type: 'shape-change', bodyId: 'moon', shape: value })
})

watch(clarity, () => {
  applyClarity()
})

watch(
  () => props.simulationTask?.shapes,
  (shapes) => {
    if (!shapes || typeof shapes !== 'object') return
    if (shapes.sun && shapes.sun !== shapeSun.value) shapeSun.value = shapes.sun
    if (shapes.earth && shapes.earth !== shapeEarth.value) shapeEarth.value = shapes.earth
    if (shapes.moon && shapes.moon !== shapeMoon.value) shapeMoon.value = shapes.moon
  },
  { deep: true, immediate: true },
)

watch(
  () => props.simulationTask?.showControls,
  (show) => {
    if (show) controlsUnlocked.value = true
  },
  { immediate: true },
)

watch(
  () => props.guideFocus,
  (focus) => {
    if (focus === 'orbits') showOrbits.value = true
  },
  { immediate: true },
)

const { canvasRef, ready, context } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,
  onInit({ renderer, scene, camera }) {
    renderer.setClearColor(0x02040a)
    scene.fog = new THREE.FogExp2(0x02040a, 0.006)
    activeCamera = camera

    camera.position.set(0, 10, 18)
    camera.lookAt(0, 0, 0)

    cameraState = {
      yaw: 0.55,
      pitch: 0.42,
      distance: 20,
      target: new THREE.Vector3(0, 0, 0),
    }

    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()

    const ambient = new THREE.AmbientLight(0x8899bb, 0.55)
    ambientLight = ambient
    sunLight = new THREE.PointLight(0xfff0cc, 3.2, 80, 1.2)
    sunLight.position.set(0, 0, 0)
    const fill = new THREE.DirectionalLight(0x99aacc, 0.35)
    fill.position.set(-12, 18, 24)
    fillLight = fill
    scene.add(ambient, sunLight, fill)

    addStarfield(scene)
    buildSystem(scene)
    applyClarity()
  },

  onFrame({ camera, delta }) {
    activeCamera = camera
    animateSystem(delta)
    updateCamera(camera)
  },

  onDispose({ scene }) {
    sunPivot = earthPivot = moonPivot = null
    sunMesh = earthMesh = moonMesh = null
    earthOrbitLine = moonOrbitLine = null
    sunAxis = earthAxis = moonAxis = null
    sunLight = null
    ambientLight = null
    fillLight = null
    activeCamera = null

    for (const key of Object.keys(bodyTextures)) {
      bodyTextures[key]?.dispose?.()
      bodyTextures[key] = null
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

watch(ready, async (isReady) => {
  if (!isReady) return
  applyOrbitVisibility()
  try {
    await loadBodyTextures()
    // Dokular geldikten sonra mesh'leri yeniden kur
    rebuildBodyMesh('sun', shapeSun.value)
    rebuildBodyMesh('earth', shapeEarth.value)
    rebuildBodyMesh('moon', shapeMoon.value)
  } catch {
    // Doku yoksa düz renklerle devam
  }
}, { immediate: true })

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

/** Basit yanık/güneş yüzeyi — harici dosya gerektirmez */
function createSunTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.05, size * 0.5, size * 0.5, size * 0.55)
  gradient.addColorStop(0, '#fff7c2')
  gradient.addColorStop(0.35, '#ffd24a')
  gradient.addColorStop(0.7, '#ff9a1f')
  gradient.addColorStop(1, '#e85d00')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 140; i += 1) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 4 + Math.random() * 18
    ctx.fillStyle = `rgba(255, ${140 + Math.random() * 80 | 0}, 40, ${0.08 + Math.random() * 0.18})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

async function loadBodyTextures() {
  const loader = new THREE.TextureLoader()
  bodyTextures.sun = createSunTexture()
  const [earth, earthNormal, earthClouds, moon, moonBump] = await Promise.all([
    loadTextureWithFallback(loader, TEXTURE_PATHS.earth, TEXTURE_FALLBACKS.earth),
    loadTextureWithFallback(loader, TEXTURE_PATHS.earthNormal, TEXTURE_FALLBACKS.earthNormal),
    loadTextureWithFallback(loader, TEXTURE_PATHS.earthClouds, TEXTURE_FALLBACKS.earthClouds),
    loadTextureWithFallback(loader, TEXTURE_PATHS.moon, TEXTURE_FALLBACKS.moon),
    loadTextureWithFallback(loader, TEXTURE_PATHS.moonBump, TEXTURE_FALLBACKS.moonBump),
  ])
  bodyTextures.earth = earth
  bodyTextures.earthNormal = earthNormal
  bodyTextures.earthClouds = earthClouds
  bodyTextures.moon = moon
  bodyTextures.moonBump = moonBump
}

function addStarfield(scene) {
  const count = 1600
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const r = 60 + Math.random() * 100
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.32,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  })))
}

function createGeometry(shapeId, radius) {
  switch (shapeId) {
    case 'cube':
      return new THREE.BoxGeometry(radius * 1.7, radius * 1.7, radius * 1.7)
    case 'octahedron':
      return new THREE.OctahedronGeometry(radius * 1.15, 0)
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(radius * 1.05, 0)
    case 'icosahedron':
      return new THREE.IcosahedronGeometry(radius * 1.1, 0)
    case 'sphere':
    default:
      return new THREE.SphereGeometry(radius, 40, 40)
  }
}

function createOrbitLine(radius, color = 0x64748b) {
  const segments = 96
  const points = []
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
  })
  return new THREE.LineLoop(geometry, material)
}

function createSpinAxis(length, color = 0xfbbf24) {
  const group = new THREE.Group()
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -length, 0),
    new THREE.Vector3(0, length, 0),
  ])
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
  })
  group.add(new THREE.Line(geo, mat))
  return group
}

function buildBodyMesh(bodyId, shapeId) {
  const def = BODIES[bodyId]
  const geometry = createGeometry(shapeId, def.radius)
  const isSun = bodyId === 'sun'

  let material
  if (isSun) {
    material = new THREE.MeshBasicMaterial({
      map: bodyTextures.sun ?? undefined,
      color: bodyTextures.sun ? 0xffffff : def.color,
    })
  } else if (bodyId === 'earth') {
    material = bodyTextures.earth
      ? new THREE.MeshStandardMaterial({
          map: bodyTextures.earth,
          normalMap: bodyTextures.earthNormal ?? undefined,
          roughness: 0.65,
          metalness: 0.05,
          emissive: 0x1a3a66,
          emissiveIntensity: 0.15,
        })
      : new THREE.MeshStandardMaterial({
          color: def.color,
          roughness: 0.65,
          metalness: 0.05,
          emissive: def.color,
          emissiveIntensity: 0.15,
        })
  } else {
    material = bodyTextures.moon
      ? new THREE.MeshStandardMaterial({
          map: bodyTextures.moon,
          bumpMap: bodyTextures.moonBump ?? undefined,
          bumpScale: 0.05,
          roughness: 0.85,
          metalness: 0.02,
          emissive: 0x333344,
          emissiveIntensity: 0.2,
        })
      : new THREE.MeshStandardMaterial({
          color: def.color,
          roughness: 0.85,
          metalness: 0.05,
          emissive: def.color,
          emissiveIntensity: 0.15,
        })
  }

  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData = {
    type: bodyId === 'sun' ? 'sun' : 'planet',
    id: bodyId,
    name: def.name,
    info: def.info,
    baseEmissive: material.emissiveIntensity ?? 0,
    baseRoughness: material.roughness ?? 0.7,
  }

  if (isSun) {
    const glow = new THREE.Mesh(
      createGeometry(shapeId, def.radius * 1.22),
      new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: shapeId === 'sphere' ? 0.18 : 0.28,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    mesh.add(glow)
  }

  if (bodyId === 'earth' && shapeId === 'sphere' && bodyTextures.earthClouds) {
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius * 1.02, 48, 48),
      new THREE.MeshStandardMaterial({
        map: bodyTextures.earthClouds,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    )
    clouds.userData.isClouds = true
    mesh.add(clouds)
  }

  return mesh
}

function disposeObject3D(obj) {
  if (!obj) return
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((m) => m.dispose?.())
    }
  })
}

function rebuildBodyMesh(bodyId, shapeId) {
  const pivot = bodyId === 'sun' ? sunPivot : bodyId === 'earth' ? earthPivot : moonPivot
  if (!pivot) return

  const old = bodyId === 'sun' ? sunMesh : bodyId === 'earth' ? earthMesh : moonMesh
  if (old) {
    pivot.remove(old)
    disposeObject3D(old)
  }

  const mesh = buildBodyMesh(bodyId, shapeId)
  if (bodyId === 'earth') {
    mesh.rotation.z = THREE.MathUtils.degToRad(23.5)
  }
  pivot.add(mesh)

  if (bodyId === 'sun') sunMesh = mesh
  else if (bodyId === 'earth') earthMesh = mesh
  else moonMesh = mesh

  // Eksen çizgisi mesh üstünde kalsın
  const axis = bodyId === 'sun' ? sunAxis : bodyId === 'earth' ? earthAxis : moonAxis
  if (axis) pivot.add(axis)

  applyClarity()
}

function applyClarity() {
  const t = Math.max(0.4, Math.min(4, clarity.value))

  if (ambientLight) ambientLight.intensity = 0.3 + t * 0.4
  if (fillLight) fillLight.intensity = 0.15 + t * 0.45
  if (sunLight) sunLight.intensity = 2.2 + t * 1.1

  for (const mesh of [earthMesh, moonMesh]) {
    if (!mesh?.material || mesh.material.isMeshBasicMaterial) continue
    const baseE = mesh.userData.baseEmissive ?? 0.15
    const baseR = mesh.userData.baseRoughness ?? 0.7
    mesh.material.emissiveIntensity = baseE * (0.4 + t * 1.05)
    mesh.material.roughness = Math.max(0.25, baseR - (t - 1) * 0.2)
    mesh.material.needsUpdate = true

    const clouds = mesh.children.find((c) => c.userData?.isClouds)
    if (clouds?.material) {
      clouds.material.opacity = Math.max(0.08, 0.48 - (t - 1) * 0.12)
    }
  }
}

function buildSystem(scene) {
  sunPivot = new THREE.Group()
  sunPivot.position.set(0, 0, 0)
  scene.add(sunPivot)

  sunMesh = buildBodyMesh('sun', shapeSun.value)
  sunPivot.add(sunMesh)
  sunAxis = createSpinAxis(BODIES.sun.radius * 2.2, 0xfbbf24)
  sunPivot.add(sunAxis)

  earthOrbitLine = createOrbitLine(BODIES.earth.orbit, 0x38bdf8)
  scene.add(earthOrbitLine)

  earthPivot = new THREE.Group()
  earthPivot.position.set(BODIES.earth.orbit, 0, 0)
  scene.add(earthPivot)

  earthMesh = buildBodyMesh('earth', shapeEarth.value)
  // Dünya ekseni ~23.5° eğik
  earthMesh.rotation.z = THREE.MathUtils.degToRad(23.5)
  earthPivot.add(earthMesh)
  earthAxis = createSpinAxis(BODIES.earth.radius * 2.4, 0x38bdf8)
  earthAxis.rotation.z = THREE.MathUtils.degToRad(23.5)
  earthPivot.add(earthAxis)

  moonOrbitLine = createOrbitLine(BODIES.moon.orbit, 0x94a3b8)
  earthPivot.add(moonOrbitLine)

  moonPivot = new THREE.Group()
  moonPivot.position.set(BODIES.moon.orbit, 0, 0)
  earthPivot.add(moonPivot)

  moonMesh = buildBodyMesh('moon', shapeMoon.value)
  moonPivot.add(moonMesh)
  moonAxis = createSpinAxis(BODIES.moon.radius * 2.6, 0xcbd5e1)
  moonPivot.add(moonAxis)

  applyOrbitVisibility()
  applyAxisVisibility()
}

function applyOrbitVisibility() {
  syncViewpointVisibility(cameraMode.value)
}

function applyAxisVisibility() {
  syncViewpointVisibility(cameraMode.value)
}

function animateSystem(delta) {
  const rate = speed.value

  earthAngle += delta * BODIES.earth.orbitSpeed * rate
  moonAngle += delta * BODIES.moon.orbitSpeed * rate

  if (earthPivot) {
    earthPivot.position.set(
      Math.cos(earthAngle) * BODIES.earth.orbit,
      0,
      Math.sin(earthAngle) * BODIES.earth.orbit,
    )
  }

  if (moonPivot) {
    moonPivot.position.set(
      Math.cos(moonAngle) * BODIES.moon.orbit,
      0,
      Math.sin(moonAngle) * BODIES.moon.orbit,
    )
  }

  // Dönme (spin)
  if (sunMesh) sunMesh.rotation.y += delta * 0.4 * rate
  if (earthMesh) {
    earthMesh.rotation.y += delta * BODIES.earth.spinSpeed * rate
    const clouds = earthMesh.children.find((c) => c.userData?.isClouds)
    if (clouds) clouds.rotation.y += delta * 0.15 * rate
  }
  // Ay: gelgit kilidi — dolanma ile aynı hızda dönüş
  if (moonMesh) moonMesh.rotation.y = moonAngle + Math.PI

  if (sunLight && sunPivot) {
    sunPivot.getWorldPosition(_tmp)
    sunLight.position.copy(_tmp)
  }
}

/**
 * Cismin yüzeyinden hedefe bak — Güneş/Dünya/Ay "gözünden" görüş.
 * Kamerayı hedef tarafına koyar; hedefe gömülmeyi engeller.
 */
function setEyeViewpoint(camera, fromPos, lookPos, fromRadius, lookRadius = 0) {
  const dirX = lookPos.x - fromPos.x
  const dirY = lookPos.y - fromPos.y
  const dirZ = lookPos.z - fromPos.z
  const dist = Math.hypot(dirX, dirY, dirZ) || 1
  const nx = dirX / dist
  const ny = dirY / dist
  const nz = dirZ / dist

  const clearance = Math.max(lookRadius * 1.6, 0.6)
  const preferred = Math.max(fromRadius * 1.35, 0.45)
  const maxSafe = Math.max(dist - clearance, fromRadius * 1.05)
  const offset = Math.min(preferred, maxSafe)

  camera.position.set(
    fromPos.x + nx * offset,
    fromPos.y + ny * offset + fromRadius * 0.2,
    fromPos.z + nz * offset,
  )
  camera.lookAt(lookPos.x, lookPos.y, lookPos.z)
}

function syncViewpointVisibility(mode) {
  // Bakılan cismin mesh'ini gizle — kamerayı doldurmasın
  if (sunMesh) sunMesh.visible = mode !== 'sun'
  if (earthMesh) earthMesh.visible = mode !== 'earth'
  if (moonMesh) moonMesh.visible = mode !== 'moon'

  if (sunAxis) sunAxis.visible = showSpinAxes.value && mode !== 'sun'
  if (earthAxis) earthAxis.visible = showSpinAxes.value && mode !== 'earth'
  if (moonAxis) moonAxis.visible = showSpinAxes.value && mode !== 'moon'

  if (earthOrbitLine) {
    earthOrbitLine.visible = showOrbits.value && mode === 'free'
  }
  if (moonOrbitLine) {
    moonOrbitLine.visible = showOrbits.value && mode === 'free'
  }
}

function updateCamera(camera) {
  if (!cameraState) return

  const mode = cameraMode.value
  syncViewpointVisibility(mode)

  const wantFov = mode === 'free' ? 55 : 60
  if (Math.abs(camera.fov - wantFov) > 0.1) {
    camera.fov = wantFov
    camera.updateProjectionMatrix()
  }

  if (mode === 'free') {
    const { yaw, pitch, distance, target } = cameraState
    const cosPitch = Math.cos(pitch)
    camera.position.set(
      target.x + distance * cosPitch * Math.sin(yaw),
      target.y + distance * Math.sin(pitch),
      target.z + distance * cosPitch * Math.cos(yaw),
    )
    camera.lookAt(target)
    return
  }

  // Nested pivot dünya konumları taze olsun
  sunPivot?.updateWorldMatrix(true, true)
  earthPivot?.updateWorldMatrix(true, true)
  moonPivot?.updateWorldMatrix(true, true)

  if (mode === 'sun') {
    if (!sunPivot || !earthPivot) return
    sunPivot.getWorldPosition(_from)
    earthPivot.getWorldPosition(_lookTarget)
    setEyeViewpoint(camera, _from, _lookTarget, BODIES.sun.radius, BODIES.earth.radius)
    return
  }

  if (mode === 'earth') {
    // Dünya'nın gözünden Güneş'e bak (gökte Güneş)
    if (!earthPivot || !sunPivot) return
    earthPivot.getWorldPosition(_from)
    sunPivot.getWorldPosition(_lookTarget)
    setEyeViewpoint(camera, _from, _lookTarget, BODIES.earth.radius, BODIES.sun.radius)
    return
  }

  if (mode === 'moon') {
    // Ay'ın gözünden Dünya'ya bak — bakış noktasını aydınlık yarımküreye kaydır
    if (!moonPivot || !earthPivot || !sunPivot) return
    moonPivot.getWorldPosition(_from)
    earthPivot.getWorldPosition(_lookTarget)
    sunPivot.getWorldPosition(_tmp)
    const lx = _tmp.x - _lookTarget.x
    const ly = _tmp.y - _lookTarget.y
    const lz = _tmp.z - _lookTarget.z
    const llen = Math.hypot(lx, ly, lz) || 1
    _lookTarget.x += (lx / llen) * BODIES.earth.radius * 0.35
    _lookTarget.y += (ly / llen) * BODIES.earth.radius * 0.35
    _lookTarget.z += (lz / llen) * BODIES.earth.radius * 0.35
    setEyeViewpoint(camera, _from, _lookTarget, BODIES.moon.radius, BODIES.earth.radius)
  }
}

function setCameraMode(mode) {
  cameraMode.value = mode
  if (mode !== 'free' && cameraState) {
    // Serbest moda dönünce ortalanmış kalsın
    cameraState.target.set(0, 0, 0)
  }
}

function selectBody(bodyId) {
  const def = BODIES[bodyId]
  if (!def) return
  selectedBody.value = { id: def.id, name: def.name, info: def.info }
  emit('simulation-event', {
    type: 'body-select',
    bodyId: def.id,
    name: def.name,
  })
}

function onPointerDown(event) {
  if (cameraMode.value !== 'free') return
  isDragging = true
  dragMoved = false
  lastPointer = { x: event.clientX, y: event.clientY }
}

function onPointerUp() {
  isDragging = false
}

function onPointerMove(event) {
  if (!isDragging || !cameraState || cameraMode.value !== 'free') return

  const dx = event.clientX - lastPointer.x
  const dy = event.clientY - lastPointer.y
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true
  lastPointer = { x: event.clientX, y: event.clientY }

  cameraState.yaw -= dx * 0.005
  cameraState.pitch = Math.max(-0.15, Math.min(1.25, cameraState.pitch + dy * 0.005))
}

function onWheel(event) {
  if (!cameraState || cameraMode.value !== 'free') return
  event.preventDefault()
  cameraState.distance = Math.max(6, Math.min(45, cameraState.distance + event.deltaY * 0.035))
}

function onClick(event) {
  if (dragMoved) return
  const canvas = canvasRef.value
  if (!canvas || !raycaster || !pointer || !activeCamera) return

  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, activeCamera)
  const targets = [sunMesh, earthMesh, moonMesh].filter(Boolean)
  const hits = raycaster.intersectObjects(targets, true)

  if (hits.length) {
    let obj = hits[0].object
    while (obj.parent && !obj.userData?.id) obj = obj.parent
    if (obj.userData?.id) {
      selectBody(obj.userData.id)
      return
    }
  }

  selectedBody.value = null
}
</script>

<template>
  <div
    class="gda-scene"
    :class="{ 'gda-scene--embedded': embedded }"
  >
    <canvas
      ref="canvasRef"
      class="gda-scene__canvas"
      :class="{ 'gda-scene__target--pulse': canvasPulsing }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
      @click="onClick"
    />

    <aside
      v-if="showControlsPanel"
      class="gda-scene__panel"
      :class="{ 'gda-scene__target--pulse': panelPulsing }"
    >
      <div
        class="gda-scene__section"
        :class="{ 'gda-scene__target--pulse': cameraPulsing }"
      >
        <p class="gda-scene__label">
          Kamera
        </p>
        <div class="gda-scene__picks">
          <button
            v-for="opt in CAMERA_OPTIONS"
            :key="opt.id"
            type="button"
            class="gda-scene__pick"
            :class="{ 'gda-scene__pick--active': cameraMode === opt.id }"
            @click="setCameraMode(opt.id)"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="gda-scene__cam-hint">
          {{ cameraHint }}
        </p>
      </div>

      <label class="gda-scene__control">
        <span>Hız</span>
        <input
          v-model.number="speed"
          type="range"
          min="0"
          max="4"
          step="0.1"
        >
        <span class="gda-scene__speed-val">{{ speed.toFixed(1) }}×</span>
      </label>

      <label class="gda-scene__control">
        <span>Netlik</span>
        <input
          v-model.number="clarity"
          type="range"
          min="0.5"
          max="4"
          step="0.1"
        >
        <span class="gda-scene__speed-val">{{ clarity.toFixed(1) }}×</span>
      </label>

      <div
        class="gda-scene__section"
        :class="{ 'gda-scene__target--pulse': orbitPulsing }"
      >
        <p class="gda-scene__label">
          Rotalar
        </p>
        <label class="gda-scene__check">
          <input
            v-model="showOrbits"
            type="checkbox"
          >
          <span>Dolanma yörüngeleri</span>
        </label>
        <label class="gda-scene__check">
          <input
            v-model="showSpinAxes"
            type="checkbox"
          >
          <span>Dönme eksenleri</span>
        </label>
      </div>

      <div
        class="gda-scene__section"
        :class="{ 'gda-scene__target--pulse': shapePulsing }"
      >
        <p class="gda-scene__label">
          Şekiller
        </p>
        <label class="gda-scene__shape-row">
          <span>Güneş</span>
          <select v-model="shapeSun">
            <option
              v-for="s in SHAPE_OPTIONS"
              :key="s.id"
              :value="s.id"
            >
              {{ s.label }}
            </option>
          </select>
        </label>
        <label class="gda-scene__shape-row">
          <span>Dünya</span>
          <select v-model="shapeEarth">
            <option
              v-for="s in SHAPE_OPTIONS"
              :key="s.id"
              :value="s.id"
            >
              {{ s.label }}
            </option>
          </select>
        </label>
        <label class="gda-scene__shape-row">
          <span>Ay</span>
          <select v-model="shapeMoon">
            <option
              v-for="s in SHAPE_OPTIONS"
              :key="s.id"
              :value="s.id"
            >
              {{ s.label }}
            </option>
          </select>
        </label>
      </div>

      <div
        v-if="selectedBody"
        class="gda-scene__info"
      >
        <strong>{{ selectedBody.name }}</strong>
        <p>{{ selectedBody.info }}</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.gda-scene {
  --sim-border: rgba(148, 163, 184, 0.2);
  --sim-panel-bg: rgba(15, 23, 42, 0.88);
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

.gda-scene--embedded {
  --sim-panel-bg: rgba(8, 12, 22, 0.88);
  contain: strict;
  transform: translateZ(0);
}

.gda-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.gda-scene__canvas:active {
  cursor: grabbing;
}

.gda-scene__panel {
  position: absolute;
  right: max(0.85rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  width: min(260px, calc(100% - 1.5rem));
  max-height: min(70vh, 520px);
  overflow-y: auto;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--sim-border);
  background: var(--sim-panel-bg);
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  color: var(--sim-text-primary);
  z-index: 2;
}

.gda-scene--embedded .gda-scene__panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
  max-height: 55vh;
  border-color: rgba(56, 189, 248, 0.28);
}

.gda-scene__section {
  margin-bottom: 0.7rem;
}

.gda-scene__label {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sim-accent-cool);
}

.gda-scene__picks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.gda-scene__cam-hint {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: var(--sim-text-secondary);
  line-height: 1.35;
}

.gda-scene__pick {
  appearance: none;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.7);
  color: var(--sim-text-primary);
  font-size: 0.75rem;
  padding: 0.28rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.gda-scene__pick--active {
  border-color: var(--sim-accent-warm);
  color: var(--sim-accent-warm);
  background: rgba(251, 191, 36, 0.12);
}

.gda-scene__control {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.7rem;
  font-size: 0.85rem;
}

.gda-scene--embedded .gda-scene__control {
  font-size: 0.78rem;
}

.gda-scene__control input[type='range'] {
  width: 100%;
  accent-color: var(--sim-accent-warm);
}

.gda-scene__speed-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  color: var(--sim-accent-warm);
  min-width: 2.4rem;
}

.gda-scene__check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
  color: var(--sim-text-secondary);
  cursor: pointer;
}

.gda-scene__check input {
  accent-color: var(--sim-accent-cool);
}

.gda-scene__shape-row {
  display: grid;
  grid-template-columns: 3.2rem 1fr;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.3rem;
  font-size: 0.78rem;
  color: var(--sim-text-secondary);
}

.gda-scene__shape-row select {
  appearance: none;
  border: 1px solid var(--sim-border);
  background: rgba(30, 41, 59, 0.85);
  color: var(--sim-text-primary);
  border-radius: 6px;
  padding: 0.25rem 0.4rem;
  font-size: 0.75rem;
}

.gda-scene__info {
  margin-top: 0.65rem;
  padding-top: 0.55rem;
  border-top: 1px solid var(--sim-border);
}

.gda-scene__info strong {
  display: block;
  font-size: 0.95rem;
  color: var(--sim-accent-warm);
  margin-bottom: 0.2rem;
}

.gda-scene--embedded .gda-scene__info strong {
  font-size: 0.85rem;
}

.gda-scene__info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--sim-text-secondary);
  line-height: 1.45;
}

.gda-scene__target--pulse {
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
  .gda-scene__target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}

@media (max-width: 640px) {
  .gda-scene__panel {
    left: max(0.5rem, env(safe-area-inset-left));
    right: max(0.5rem, env(safe-area-inset-right));
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    width: auto;
    max-height: 40vh;
  }
}
</style>
