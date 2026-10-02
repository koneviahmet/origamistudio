import { onMounted, onUnmounted } from 'vue'

export function useInput() {
  const keys = {}

  function onKeyDown(e) {
    keys[e.code] = true
  }

  function onKeyUp(e) {
    keys[e.code] = false
  }

  function isPressed(code) {
    return !!keys[code]
  }

  function getMovement() {
    let mx = 0
    let mz = 0
    if (keys.KeyW || keys.ArrowUp) mz -= 1
    if (keys.KeyS || keys.ArrowDown) mz += 1
    if (keys.KeyA || keys.ArrowLeft) mx -= 1
    if (keys.KeyD || keys.ArrowRight) mx += 1
    return { mx, mz, moving: mx !== 0 || mz !== 0, running: (keys.ShiftLeft || keys.ShiftRight) && (mx !== 0 || mz !== 0) }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  })

  return { isPressed, getMovement }
}

export function useCameraInput(rendererDom) {
  let camYaw = 0
  let camPitch = 0.18
  let mouseDown = false
  let lastMouseX = 0

  function onMouseDown(e) {
    mouseDown = true
    lastMouseX = e.clientX
  }

  function onMouseUp() {
    mouseDown = false
  }

  function onMouseMove(e) {
    if (!mouseDown) return
    camYaw -= (e.clientX - lastMouseX) * 0.005
    lastMouseX = e.clientX
  }

  function onWheel(e) {
    camPitch = Math.max(0.05, Math.min(0.55, camPitch + e.deltaY * 0.002))
  }

  function onContextMenu(e) {
    e.preventDefault()
  }

  function bind(dom) {
    dom.addEventListener('mousedown', onMouseDown)
    dom.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel)
  }

  function unbind(dom) {
    dom.removeEventListener('mousedown', onMouseDown)
    dom.removeEventListener('contextmenu', onContextMenu)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('wheel', onWheel)
  }

  return {
    getYaw: () => camYaw,
    getPitch: () => camPitch,
    bind,
    unbind,
  }
}
