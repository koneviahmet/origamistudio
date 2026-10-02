/**
 * Mobil/tablet hayalet tıklarında modalın hemen kapanmasını önler.
 * Kapatma yalnızca backdrop üzerinde başlayıp biten bir pointer ile olur.
 */
export function createBackdropDismiss(onClose, { guardMs = 400 } = {}) {
  let openedAt = 0
  let downOnBackdrop = false

  function arm() {
    openedAt = performance.now()
    downOnBackdrop = false
  }

  function onPointerDown(event) {
    downOnBackdrop = event.target === event.currentTarget
  }

  function onPointerUp(event) {
    const shouldClose = downOnBackdrop && event.target === event.currentTarget
    downOnBackdrop = false
    if (!shouldClose) return
    if (performance.now() - openedAt < guardMs) return
    onClose()
  }

  function onPointerCancel() {
    downOnBackdrop = false
  }

  return {
    arm,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
  }
}
