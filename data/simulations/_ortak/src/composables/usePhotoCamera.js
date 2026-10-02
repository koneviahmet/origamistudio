import { computed, ref } from 'vue'
import {
  captureCanvasRegionBlob,
  computeViewfinderLayout,
  cssRectToCanvasRect,
  PHOTO_OUTPUT_SIZES,
} from '../lib/play/canvasCapture.js'

const SELFIE_DISTANCE = 3.4
const CAPTURE_MIME = 'image/jpeg'
const CAPTURE_QUALITY = 0.92

const PHOTO_MODES = [
  {
    id: 'landscape',
    orientation: 'landscape',
    selfie: false,
    label: 'Yatay',
    icon: 'rectangleHorizontal',
  },
  {
    id: 'portrait',
    orientation: 'portrait',
    selfie: false,
    label: 'Dikey',
    icon: 'rectangleVertical',
  },
  {
    id: 'selfie-landscape',
    orientation: 'landscape',
    selfie: true,
    label: 'Selfie Yatay',
    icon: 'switchCamera',
  },
  {
    id: 'selfie-portrait',
    orientation: 'portrait',
    selfie: true,
    label: 'Selfie Dikey',
    icon: 'smartphone',
  },
]

export function usePhotoCamera({
  getCanvas,
  renderFrame,
  setCameraMode,
  getCameraMode,
  setThirdPersonDistance,
  getThirdPersonDistance,
}) {
  const phase = ref('idle')
  const config = ref({ orientation: 'landscape', selfie: false })
  const previousCameraMode = ref(null)
  const previousDistance = ref(null)
  const shooting = ref(false)

  const isActive = computed(() => phase.value === 'aiming')
  const isAiming = computed(() => phase.value === 'aiming')

  const viewfinderLayout = computed(() => {
    const canvas = getCanvas?.()
    if (!canvas || !isAiming.value) return null
    return computeViewfinderLayout(
      canvas.clientWidth,
      canvas.clientHeight,
      config.value.orientation,
    )
  })

  const modeLabel = computed(() => {
    const mode = PHOTO_MODES.find(
      (item) =>
        item.orientation === config.value.orientation && item.selfie === config.value.selfie,
    )
    return mode?.label ?? 'Kamera'
  })

  function applyCameraForConfig({ orientation, selfie }) {
    config.value = { orientation, selfie }

    if (selfie) {
      setCameraMode?.('third-front')
      setThirdPersonDistance?.(SELFIE_DISTANCE)
      return
    }

    setCameraMode?.('first')
  }

  function selectMode(modeId) {
    const mode = PHOTO_MODES.find((item) => item.id === modeId)
    if (!mode) return

    if (phase.value === 'idle') {
      previousCameraMode.value = getCameraMode?.() ?? 'third-back'
      previousDistance.value = getThirdPersonDistance?.() ?? null
    }

    applyCameraForConfig(mode)
    phase.value = 'aiming'
  }

  function closeCamera() {
    if (!isActive.value) return

    if (previousCameraMode.value) {
      setCameraMode?.(previousCameraMode.value)
    }

    if (previousDistance.value != null) {
      setThirdPersonDistance?.(previousDistance.value)
    }

    phase.value = 'idle'
    previousCameraMode.value = null
    previousDistance.value = null
  }

  async function shoot(capturePhoto) {
    const canvas = getCanvas?.()
    const layout = viewfinderLayout.value
    if (!canvas || !layout || !capturePhoto || shooting.value) return null

    shooting.value = true

    try {
      renderFrame?.()
      await new Promise((resolve) => requestAnimationFrame(resolve))

      if (phase.value !== 'aiming') return null

      const region = cssRectToCanvasRect(canvas, layout)
      const outputSize = PHOTO_OUTPUT_SIZES[config.value.orientation]
      const blob = await captureCanvasRegionBlob(
        canvas,
        region,
        CAPTURE_MIME,
        CAPTURE_QUALITY,
        outputSize,
      )
      return capturePhoto(blob, {
        orientation: config.value.orientation,
        selfie: config.value.selfie,
      })
    } catch (err) {
      console.warn('Objektif fotoğrafı çekilemedi:', err)
      return null
    } finally {
      shooting.value = false
    }
  }

  return {
    phase,
    config,
    isActive,
    isAiming,
    viewfinderLayout,
    modeLabel,
    photoModes: PHOTO_MODES,
    shooting,
    closeCamera,
    selectMode,
    shoot,
  }
}
