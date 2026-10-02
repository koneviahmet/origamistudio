import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { ROZET_SPRITE_URL, getRozetFrame } from '../data/rozetlerAtlas.js'
import atlasData from '../data/rozetler.json'

const SHEET_W = atlasData.meta.size.w
const SHEET_H = atlasData.meta.size.h

/**
 * Modal içinde dönen 3D rozet önizlemesi.
 */
export function useBadgeSpinViewer(canvasRef, frameIdRef) {
  const loading = ref(true)

  let renderer = null
  let scene = null
  let camera = null
  let badgeGroup = null
  let rafId = null
  let resizeObserver = null
  let texture = null

  function applyFrameToTexture(tex, frameId) {
    const frame = getRozetFrame(frameId)
    if (!frame || !tex) return

    tex.repeat.set(frame.w / SHEET_W, frame.h / SHEET_H)
    tex.offset.set(frame.x / SHEET_W, 1 - (frame.y + frame.h) / SHEET_H)
    tex.needsUpdate = true
  }

  function buildBadge(frameId) {
    if (!scene) return

    if (badgeGroup) {
      scene.remove(badgeGroup)
      badgeGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => {
            if (m.map && m.map !== texture) m.map.dispose()
            m.dispose?.()
          })
        }
      })
      badgeGroup = null
    }

    loading.value = true

    const loader = new THREE.TextureLoader()
    loader.load(
      ROZET_SPRITE_URL,
      (loadedTex) => {
        texture = loadedTex
        texture.colorSpace = THREE.SRGBColorSpace
        texture.magFilter = THREE.LinearFilter
        texture.minFilter = THREE.LinearMipmapLinearFilter
        applyFrameToTexture(texture, frameId)

        badgeGroup = new THREE.Group()

        const badgeMat = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.35,
          roughness: 0.45,
          emissive: new THREE.Color(0x2a2010),
          emissiveIntensity: 0.12,
          side: THREE.DoubleSide,
        })

        const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.14, 64), badgeMat)
        disc.rotation.x = Math.PI / 2
        badgeGroup.add(disc)

        const face = new THREE.Mesh(new THREE.CircleGeometry(0.98, 64), badgeMat.clone())
        face.position.z = 0.08
        badgeGroup.add(face)

        const back = new THREE.Mesh(new THREE.CircleGeometry(0.98, 64), badgeMat.clone())
        back.position.z = -0.08
        back.rotation.y = Math.PI
        badgeGroup.add(back)

        scene.add(badgeGroup)
        loading.value = false
      },
      undefined,
      () => {
        loading.value = false
      },
    )
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
  }

  function animate() {
    rafId = requestAnimationFrame(animate)
    if (badgeGroup) {
      badgeGroup.rotation.y += 0.012
      badgeGroup.rotation.x = Math.sin(performance.now() * 0.001) * 0.08
    }
    renderer?.render(scene, camera)
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
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)
    camera.position.set(0, 0.2, 3.4)
    camera.lookAt(0, 0, 0)

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const key = new THREE.DirectionalLight(0xfff0d0, 1.3)
    key.position.set(3, 4, 5)
    const fill = new THREE.DirectionalLight(0x88bbff, 0.55)
    fill.position.set(-4, 1, 2)
    const rim = new THREE.PointLight(0x38bdf8, 0.9, 12)
    rim.position.set(0, 2, -3)
    scene.add(ambient, key, fill, rim)

    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.parentElement ?? canvas)

    animate()
    buildBadge(frameIdRef.value)
  }

  function dispose() {
    if (rafId != null) cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    texture?.dispose()
    renderer?.dispose()
    renderer?.forceContextLoss?.()
    renderer = null
    scene = null
    camera = null
    badgeGroup = null
    texture = null
  }

  onMounted(async () => {
    await nextTick()
    init()
  })

  onUnmounted(dispose)

  watch(frameIdRef, (id) => {
    if (scene) buildBadge(id)
  })

  return { loading }
}
