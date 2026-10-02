import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { loadKenneyCharacterModel, alignToGround } from '../lib/three/characterLoader.js'
import { getStoredCharacterId } from '../data/kenneyCharacters.js'

const CHARACTER_SCALE = 0.36
const MODEL_HEIGHT_FILL = 0.78

/**
 * Başlangıç odası 3D karakter önizlemesi (kalibre edilmiş alan).
 */
export function useStartCharacterViewer(canvasRef, characterIdRef) {
  const loading = ref(true)

  let renderer = null
  let scene = null
  let camera = null
  let mixer = null
  let modelRoot = null
  let idleAction = null
  let rafId = null
  let resizeObserver = null
  const clock = new THREE.Clock()
  let bouncePhase = 0

  function frameModel(root) {
    if (!root || !camera) return

    root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(root)
    if (box.isEmpty()) return

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const feetY = box.min.y

    const vFov = (camera.fov * Math.PI) / 180
    const dist = (size.y / MODEL_HEIGHT_FILL) / (2 * Math.tan(vFov / 2)) * 1.02

    camera.position.set(center.x, feetY + size.y * 0.42, center.z + dist)
    camera.lookAt(center.x, feetY + size.y * 0.38, center.z)
  }

  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !renderer || !camera) return
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (modelRoot) frameModel(modelRoot)
  }

  function animate() {
    rafId = requestAnimationFrame(animate)
    const delta = clock.getDelta()
    mixer?.update(delta)

    if (modelRoot) {
      bouncePhase += delta * 2.2
      modelRoot.position.y = Math.sin(bouncePhase) * 0.03
      modelRoot.rotation.y = Math.sin(performance.now() * 0.00045) * 0.18
    }

    renderer?.render(scene, camera)
  }

  async function loadCharacter(characterId) {
    loading.value = true

    if (modelRoot && scene) {
      scene.remove(modelRoot)
      modelRoot.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => m.dispose?.())
        }
      })
      modelRoot = null
      mixer = null
      idleAction = null
    }

    if (!scene) {
      loading.value = false
      return
    }

    try {
      const loaded = await loadKenneyCharacterModel(characterId, CHARACTER_SCALE)
      modelRoot = loaded.model
      mixer = loaded.mixer
      idleAction = loaded.actions.idle ?? loaded.actions.Idle
      idleAction?.reset().fadeIn(0.3).play()

      alignToGround(modelRoot, 0)
      scene.add(modelRoot)
      frameModel(modelRoot)
    } catch {
      /* karakter yüklenemezse sessizce geç */
    } finally {
      loading.value = false
    }
  }

  function init() {
    const canvas = canvasRef.value
    if (!canvas) return

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50)

    const ambient = new THREE.AmbientLight(0xffffff, 0.82)
    const key = new THREE.DirectionalLight(0xfff4e0, 1.15)
    key.position.set(2, 5, 4)
    const fill = new THREE.DirectionalLight(0x7eb8ff, 0.5)
    fill.position.set(-3, 2, -1)
    const ground = new THREE.HemisphereLight(0xb8d4ff, 0x3d2e1a, 0.35)
    scene.add(ambient, key, fill, ground)

    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.parentElement ?? canvas)

    clock.start()
    animate()
    loadCharacter(characterIdRef?.value ?? getStoredCharacterId())
  }

  function dispose() {
    if (rafId != null) cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    renderer?.dispose()
    renderer = null
    scene = null
    camera = null
    mixer = null
    modelRoot = null
  }

  onMounted(async () => {
    await nextTick()
    init()
  })

  onUnmounted(dispose)

  if (characterIdRef) {
    watch(characterIdRef, (id) => {
      if (id) loadCharacter(id)
    })
  }

  return { loading }
}
