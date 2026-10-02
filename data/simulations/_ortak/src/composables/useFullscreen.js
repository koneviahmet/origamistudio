import { ref, onMounted, onUnmounted } from 'vue'

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

function requestFullscreen(el) {
  if (el.requestFullscreen) return el.requestFullscreen()
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen()
  return Promise.reject(new Error('Tam ekran desteklenmiyor'))
}

function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen()
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen()
  return Promise.reject(new Error('Tam ekran desteklenmiyor'))
}

/**
 * @param {import('vue').Ref<HTMLElement | null>} [targetRef]
 */
export function useFullscreen(targetRef) {
  const isFullscreen = ref(false)

  function sync() {
    isFullscreen.value = !!getFullscreenElement()
  }

  async function enter() {
    const el = targetRef?.value ?? document.documentElement
    if (!el) return
    try {
      await requestFullscreen(el)
    } catch {
      // Kullanıcı reddetti veya tarayıcı desteklemiyor
    }
    sync()
  }

  async function exit() {
    if (!getFullscreenElement()) return
    try {
      await exitFullscreen()
    } catch {
      // yok say
    }
    sync()
  }

  async function toggle() {
    if (getFullscreenElement()) await exit()
    else await enter()
  }

  onMounted(() => {
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', sync)
    document.removeEventListener('webkitfullscreenchange', sync)
  })

  return {
    isFullscreen,
    enter,
    exit,
    toggle,
  }
}
