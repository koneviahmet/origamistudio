import { computed, onUnmounted, ref } from 'vue'
import {
  buildPhotoFilename,
  downloadPhotoBlob,
  downloadPhotos as downloadPhotoList,
} from '../lib/play/photoExport.js'

function createPhotoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function usePhotoAlbum() {
  const photos = ref([])
  const viewingId = ref(null)
  const capturing = ref(false)
  const flash = ref(false)

  const viewingPhoto = computed(
    () => photos.value.find((photo) => photo.id === viewingId.value) ?? null,
  )

  let flashTimer = null

  function triggerFlash() {
    flash.value = true
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => {
      flash.value = false
      flashTimer = null
    }, 220)
  }

  async function capturePhoto(blob, meta = {}) {
    if (!blob || capturing.value) return null

    capturing.value = true
    try {
      const photo = {
        id: createPhotoId(),
        blob,
        url: URL.createObjectURL(blob),
        capturedAt: Date.now(),
        orientation: meta.orientation ?? 'landscape',
        selfie: meta.selfie ?? false,
      }
      photos.value = [photo, ...photos.value]
      triggerFlash()
      return photo
    } catch (err) {
      console.warn('Fotoğraf kaydedilemedi:', err)
      return null
    } finally {
      capturing.value = false
    }
  }

  function deletePhoto(id) {
    const index = photos.value.findIndex((photo) => photo.id === id)
    if (index === -1) return

    const [removed] = photos.value.splice(index, 1)
    URL.revokeObjectURL(removed.url)
    if (viewingId.value === id) viewingId.value = null
  }

  function clearAll() {
    for (const photo of photos.value) {
      URL.revokeObjectURL(photo.url)
    }
    photos.value = []
    viewingId.value = null
  }

  function openViewer(id) {
    viewingId.value = id
  }

  function closeViewer() {
    viewingId.value = null
  }

  function downloadPhoto(id) {
    const photo = photos.value.find((item) => item.id === id)
    if (!photo) return
    downloadPhotoBlob(photo.blob, buildPhotoFilename(photo))
  }

  function downloadAllPhotos() {
    if (photos.value.length === 0) return
    downloadPhotoList(photos.value)
  }

  onUnmounted(() => {
    if (flashTimer) clearTimeout(flashTimer)
    clearAll()
  })

  return {
    photos,
    viewingPhoto,
    viewingId,
    capturing,
    flash,
    capturePhoto,
    deletePhoto,
    clearAll,
    openViewer,
    closeViewer,
    downloadPhoto,
    downloadAllPhotos,
  }
}
