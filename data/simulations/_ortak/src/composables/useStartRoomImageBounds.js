import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * object-fit: contain ile gösterilen arka plan görselinin ekrandaki gerçek sınırları.
 */
export function useStartRoomImageBounds(roomRef, imgRef) {
  const bounds = ref({ left: 0, top: 0, width: 0, height: 0 })

  function update() {
    const room = roomRef.value
    const img = imgRef.value
    if (!room || !img) return

    const roomRect = room.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()

    bounds.value = {
      left: imgRect.left - roomRect.left,
      top: imgRect.top - roomRect.top,
      width: imgRect.width,
      height: imgRect.height,
    }
  }

  const overlayStyle = computed(() => ({
    left: `${bounds.value.left}px`,
    top: `${bounds.value.top}px`,
    width: `${bounds.value.width}px`,
    height: `${bounds.value.height}px`,
  }))

  let resizeObserver = null

  onMounted(() => {
    update()
    resizeObserver = new ResizeObserver(update)
    if (roomRef.value) resizeObserver.observe(roomRef.value)
    if (imgRef.value) resizeObserver.observe(imgRef.value)
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', update)
  })

  return { bounds, overlayStyle, update }
}
