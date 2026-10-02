import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import * as THREE from 'three'

const VIDEO = typeof window !== 'undefined' && !!window.__simVideo

/**
 * Simülasyonlar için hafif Three.js sahne yaşam döngüsü.
 * Şehir oyun motorundan bağımsızdır; yalnızca canvas + render döngüsü sağlar.
 */
export function useSimulationScene(options = {}) {
  const canvasRef = ref(null)
  const ready = ref(false)
  const context = shallowRef(null)

  let renderer = null
  let scene = null
  let camera = null
  let clock = null
  let rafId = null
  let resizeObserver = null
  let elapsedV = 0

  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !renderer || !camera) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return

    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function animate() {
    rafId = requestAnimationFrame(animate)
    if (!renderer || !scene || !camera || !clock) return

    const delta = clock.getDelta()
    const elapsed = clock.elapsedTime
    options.onFrame?.({ renderer, scene, camera, delta, elapsed })
    renderer.render(scene, camera)
  }

  function dispose() {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    resizeObserver?.disconnect()
    resizeObserver = null

    options.onDispose?.({ renderer, scene, camera })

    renderer?.dispose()
    // Tabletlerde WebGL bağlam limiti düşük; bağlamı hemen iade et
    renderer?.forceContextLoss?.()
    renderer = null
    scene = null
    camera = null
    clock = null
    context.value = null
    ready.value = false
  }

  function init() {
    const canvas = canvasRef.value
    if (!canvas) return

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: VIDEO, // video modunda şeffaf arka plan: gök cisimleri defter kâğıdının üstünde durur
        powerPreference: 'high-performance',
        preserveDrawingBuffer: VIDEO || options.preserveDrawingBuffer === true,
      })
    } catch (err) {
      // Bağlam oluşturulamazsa (ör. tablet bağlam limiti) uygulamayı çökertme
      console.warn('Simülasyon WebGL bağlamı oluşturulamadı:', err)
      renderer = null
      return
    }
    const maxDpr = options.maxPixelRatio ?? 2
    // Video modu: kare boyutu = tuval boyutu (devicePixelRatio yok)
    renderer.setPixelRatio(VIDEO ? 1 : Math.min(window.devicePixelRatio, maxDpr))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000)
    clock = new THREE.Clock()

    const ctx = { renderer, scene, camera, clock }
    context.value = ctx
    options.onInit?.(ctx)

    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.parentElement ?? canvas)

    ready.value = true
    if (VIDEO) {
      // Video modu: kendi rAF döngüsü yok; kareyi Origami Studio zaman çizelgesi adım adım sürer (deterministik)
      window.__simKontrol?.sahneBagla({
        canvas,
        adim(delta, ciz = true) {
          if (!renderer || !scene || !camera) return
          elapsedV += delta
          options.onFrame?.({ renderer, scene, camera, delta, elapsed: elapsedV })
          if (ciz) renderer.render(scene, camera)
        },
      })
      return
    }
    animate()
  }

  onMounted(() => {
    init()
  })

  onUnmounted(dispose)

  return {
    canvasRef,
    ready,
    context,
    resize,
    dispose,
  }
}
