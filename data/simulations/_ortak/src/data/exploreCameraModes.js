export const EXPLORE_CAMERA_MODES = [
  {
    id: 'third-back',
    label: '3. şahıs (arkadan)',
    shortLabel: '3. şahıs',
    distance: 6.5,
    pitch: 0.42,
    yawOffset: 0,
    targetLift: 0.5,
    eyeHeight: 1.55,
    hideCharacter: false,
    allowZoom: true,
    allowPitchDrag: false,
  },
  {
    id: 'third-front',
    label: '3. şahıs (önden)',
    shortLabel: '3. şahıs ön',
    distance: 6.5,
    pitch: 0.42,
    yawOffset: Math.PI,
    targetLift: 0.5,
    eyeHeight: 1.55,
    hideCharacter: false,
    allowZoom: true,
    allowPitchDrag: false,
  },
  {
    id: 'first',
    label: 'Birinci şahıs (FPS)',
    shortLabel: 'FPS',
    distance: 0,
    pitch: 0,
    yawOffset: 0,
    targetLift: 0,
    eyeHeight: 0.95,
    hideCharacter: true,
    allowZoom: false,
    allowPitchDrag: true,
    minPitch: -1.35,
    maxPitch: 1.35,
  },
]

export const DEFAULT_EXPLORE_CAMERA_MODE = 'third-back'

const modeMap = new Map(EXPLORE_CAMERA_MODES.map((m) => [m.id, m]))

export function getExploreCameraMode(id) {
  return modeMap.get(id) ?? modeMap.get(DEFAULT_EXPLORE_CAMERA_MODE)
}

export function getNextExploreCameraMode(currentId) {
  const idx = EXPLORE_CAMERA_MODES.findIndex((m) => m.id === currentId)
  const next = idx < 0 ? 0 : (idx + 1) % EXPLORE_CAMERA_MODES.length
  return EXPLORE_CAMERA_MODES[next]
}

export const EXPLORE_CAMERA_STORAGE_KEY = 'city-explore-camera-mode'

export function loadStoredExploreCameraMode() {
  try {
    const stored = localStorage.getItem(EXPLORE_CAMERA_STORAGE_KEY)
    if (stored && modeMap.has(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_EXPLORE_CAMERA_MODE
}

export function storeExploreCameraMode(id) {
  try {
    localStorage.setItem(EXPLORE_CAMERA_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export { getExploreMovementAxes } from '../lib/three/exploreMovement.js'
