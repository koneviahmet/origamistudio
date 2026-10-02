import { reactive, readonly } from 'vue'

/**
 * Simülasyon içinde çekilen blob fotoğraflar.
 * Panel kapanınca da diyalogda gösterilebilsin diye object URL sahipliği burada kalır.
 */
const state = reactive({
  /** @type {Record<string, Array<{ id: string, url: string, blob: Blob, takenAt: number }>>} */
  bySimulation: {},
})

export const simulationPhotoAlbum = readonly(state)

export function getSimulationPhotos(simulationSlug) {
  if (!simulationSlug) return []
  return state.bySimulation[simulationSlug] ?? []
}

export function getLatestSimulationPhoto(simulationSlug) {
  const list = getSimulationPhotos(simulationSlug)
  return list.length ? list[list.length - 1] : null
}

/**
 * @param {string} simulationSlug
 * @param {{ id: string, url: string, blob: Blob, takenAt?: number }} photo
 * @param {{ max?: number }} [opts]
 */
export function addSimulationPhoto(simulationSlug, photo, opts = {}) {
  if (!simulationSlug || !photo?.url) return null
  const max = opts.max ?? 12
  const list = state.bySimulation[simulationSlug] ?? []
  const next = list.filter((item) => item.id !== photo.id)
  next.push({
    id: photo.id,
    url: photo.url,
    blob: photo.blob,
    takenAt: photo.takenAt ?? Date.now(),
  })

  while (next.length > max) {
    const removed = next.shift()
    if (removed?.url && removed.url !== photo.url) {
      URL.revokeObjectURL(removed.url)
    }
  }

  state.bySimulation[simulationSlug] = next
  return next[next.length - 1]
}

export function removeSimulationPhoto(simulationSlug, photoId) {
  if (!simulationSlug || !photoId) return
  const list = state.bySimulation[simulationSlug] ?? []
  const next = []
  for (const photo of list) {
    if (photo.id === photoId) {
      if (photo.url) URL.revokeObjectURL(photo.url)
    } else {
      next.push(photo)
    }
  }
  state.bySimulation[simulationSlug] = next
}

export function clearSimulationPhotos(simulationSlug) {
  if (!simulationSlug) return
  const list = state.bySimulation[simulationSlug] ?? []
  for (const photo of list) {
    if (photo?.url) URL.revokeObjectURL(photo.url)
  }
  state.bySimulation[simulationSlug] = []
}

export function clearAllSimulationPhotos() {
  for (const slug of Object.keys(state.bySimulation)) {
    clearSimulationPhotos(slug)
  }
}
