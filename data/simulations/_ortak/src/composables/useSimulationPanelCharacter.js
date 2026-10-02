import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { loadKenneyCharacterModel, alignToGround } from '../lib/three/characterLoader.js'
import { cloneAssetInstance } from '../lib/three/assetRegistry.js'

const DEFAULT_CHARACTER_SCALE = 0.24
const MODEL_HEIGHT_FILL = 0.72
const MODEL_WIDTH_FILL = 0.82
const MODEL_BOTTOM_INSET = 0.01

/**
 * Simülasyon paneli sağ tarafındaki 3D model önizlemesi.
 */
export function useSimulationPanelCharacter(canvasRef, modelSpec) {
  const loading = ref(true)
  const error = ref(null)
  /** Kafa balonu için viewport yüksekliğinin yüzdesi (0–100, alttan) */
  const headAnchorY = ref(null)

  let renderer = null
  let scene = null
  let camera = null
  let mixer = null
  let modelRoot = null
  let rafId = null
  let resizeObserver = null
  const clock = new THREE.Clock()

  function frameModel(root) {
    if (!root || !camera) return

    const canvas = canvasRef.value
    if (!canvas) return

    root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(root)
    if (box.isEmpty()) return

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const feetY = box.min.y
    const headY = box.max.y

    const vFov = (camera.fov * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)

    const distByHeight = (size.y / MODEL_HEIGHT_FILL) / (2 * Math.tan(vFov / 2))
    const distByWidth = (size.x / MODEL_WIDTH_FILL) / (2 * Math.tan(hFov / 2))
    const distance = Math.max(distByHeight, distByWidth) * 1.05

    const viewHeight = 2 * distance * Math.tan(vFov / 2)
    const lookY = feetY + viewHeight * (0.5 - MODEL_BOTTOM_INSET)

    camera.position.set(center.x, lookY + size.y * 0.05, center.z + distance)
    camera.lookAt(center.x, lookY, center.z)

    const viewBottom = lookY - viewHeight / 2
    const headRatio = (headY - viewBottom) / viewHeight
    headAnchorY.value = Math.min(88, Math.max(22, headRatio * 100))
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
    renderer?.render(scene, camera)
  }

  async function loadModel(spec) {
    loading.value = true
    error.value = null
    headAnchorY.value = null

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
    }

    if (!spec || !scene) {
      loading.value = false
      return
    }

    try {
      if (spec.type === 'character') {
        const scale = spec.scale ?? DEFAULT_CHARACTER_SCALE
        const loaded = await loadKenneyCharacterModel(spec.characterId, scale)
        modelRoot = loaded.model
        mixer = loaded.mixer
        const idle = loaded.actions.idle ?? loaded.actions.Idle
        idle?.play()
      } else if (spec.type === 'asset') {
        modelRoot = await cloneAssetInstance(spec.pack, spec.asset)
        modelRoot.scale.setScalar(spec.scale ?? 0.22)
      }

      if (modelRoot) {
        alignToGround(modelRoot, 0)
        scene.add(modelRoot)
        frameModel(modelRoot)
      }
    } catch (err) {
      error.value = err.message ?? 'Model yüklenemedi.'
    } finally {
      loading.value = false
    }
  }

  function init() {
    const canvas = canvasRef.value
    if (!canvas) return

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      })
    } catch (err) {
      console.warn('Panel karakteri WebGL bağlamı oluşturulamadı:', err)
      renderer = null
      error.value = 'Model gösterilemiyor.'
      loading.value = false
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.setClearAlpha(0)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)

    const ambient = new THREE.AmbientLight(0xffffff, 0.75)
    const key = new THREE.DirectionalLight(0xfff4e8, 1.2)
    key.position.set(2, 4, 3)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.45)
    fill.position.set(-2, 1, -1)
    scene.add(ambient, key, fill)

    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.parentElement ?? canvas)

    clock.start()
    animate()
  }

  function dispose() {
    if (rafId != null) cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    if (modelRoot && scene) {
      scene.remove(modelRoot)
    }
    renderer?.dispose()
    renderer?.forceContextLoss?.()
    renderer = null
    scene = null
    camera = null
    mixer = null
    modelRoot = null
  }

  onMounted(async () => {
    await nextTick()
    init()
    await loadModel(modelSpec.value)
  })

  onUnmounted(dispose)

  watch(modelSpec, (spec) => {
    loadModel(spec)
  })

  return { loading, error, headAnchorY }
}
