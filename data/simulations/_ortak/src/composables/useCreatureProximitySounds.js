import {
  preloadCreatureSoundBuffers,
  unlockCreatureSoundContext,
  playCreatureSound,
} from '../lib/play/creatureSoundPlayer.js'
import { resolveCreatureSoundUrl } from '../lib/play/creatureSoundMap.js'

const PROXIMITY_RANGE = 7
const FULL_VOLUME_RANGE = 2.5
const MAX_VOLUME = 0.48
const ANIMAL_REPEAT_COOLDOWN = 3.4
const BIRD_REPEAT_COOLDOWN = 2.2

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function computeProximityVolume(distance) {
  if (distance >= PROXIMITY_RANGE) return 0
  const fadeSpan = Math.max(0.001, PROXIMITY_RANGE - FULL_VOLUME_RANGE)
  const t = 1 - Math.max(0, distance - FULL_VOLUME_RANGE) / fadeSpan
  return MAX_VOLUME * t * t
}

function isSourceAudible(source) {
  if (source.alwaysOn) return true
  return source.soundEnabled === true
}

export function createCreatureProximitySoundsController() {
  /** @type {{ typeKey: string, stop: () => void, alwaysOn: boolean } | null} */
  let active = null
  let repeatCooldown = 0
  let nearestTypeKey = null
  let preloadPromise = null
  let playToken = 0
  let unlocked = false

  async function unlock() {
    unlocked = await unlockCreatureSoundContext()
    return unlocked
  }

  async function preload() {
    if (preloadPromise) return preloadPromise
    preloadPromise = preloadCreatureSoundBuffers()
    return preloadPromise
  }

  function stopActive() {
    active?.stop?.()
    active = null
  }

  async function playNearest(typeKey, volume, alwaysOn) {
    const token = ++playToken
    stopActive()
    await unlock()
    if (!unlocked || token !== playToken) return

    const handle = await playCreatureSound(typeKey, { volume })
    if (!handle || token !== playToken) {
      handle?.stop?.()
      return
    }

    active = {
      typeKey,
      alwaysOn,
      stop: handle.stop,
    }

    window.setTimeout(() => {
      if (active?.typeKey === typeKey) {
        active = null
        repeatCooldown = alwaysOn ? BIRD_REPEAT_COOLDOWN : ANIMAL_REPEAT_COOLDOWN
      }
    }, Math.ceil(handle.duration * 1000) + 40)
  }

  function update(dt, playerPos, sources = []) {
    if (!playerPos || prefersReducedMotion()) {
      stopActive()
      nearestTypeKey = null
      repeatCooldown = 0
      return
    }

    repeatCooldown = Math.max(0, repeatCooldown - dt)

    let nearest = null
    let nearestDist = PROXIMITY_RANGE

    for (const source of sources) {
      if (!resolveCreatureSoundUrl(source.typeKey)) continue
      if (!isSourceAudible(source)) continue
      const dist = Math.hypot(playerPos.x - source.x, playerPos.z - source.z)
      if (dist < nearestDist) {
        nearest = source
        nearestDist = dist
      }
    }

    if (!nearest) {
      stopActive()
      nearestTypeKey = null
      return
    }

    const volume = computeProximityVolume(nearestDist)
    if (volume <= 0.01) {
      stopActive()
      nearestTypeKey = null
      return
    }

    if (active) {
      if (active.typeKey !== nearest.typeKey) {
        stopActive()
      } else {
        return
      }
    }

    if (nearest.typeKey === nearestTypeKey && repeatCooldown > 0) {
      return
    }

    nearestTypeKey = nearest.typeKey
    playNearest(nearest.typeKey, volume, nearest.alwaysOn === true)
  }

  function dispose() {
    playToken += 1
    stopActive()
    repeatCooldown = 0
    nearestTypeKey = null
    preloadPromise = null
    unlocked = false
  }

  return { preload, unlock, update, dispose }
}
