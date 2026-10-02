import { reactive, readonly } from 'vue'

const effectsState = reactive({
  canvasFlash: null,
  hudTransitioning: false,
  modeTransition: null,
  soundEnabled: localStorage.getItem('city-ui-sound') !== '0',
})

let flashTimer = 0
let modeTimer = 0
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isGameSoundEnabled() {
  return effectsState.soundEnabled
}

export function useUiEffects() {
  function flashCanvas(type) {
    if (prefersReducedMotion()) return
    effectsState.canvasFlash = type
    clearTimeout(flashTimer)
    flashTimer = window.setTimeout(() => {
      effectsState.canvasFlash = null
    }, 280)
  }

  function triggerModeTransition(mode) {
    if (prefersReducedMotion()) return
    effectsState.modeTransition = mode
    effectsState.hudTransitioning = true
    clearTimeout(modeTimer)
    modeTimer = window.setTimeout(() => {
      effectsState.hudTransitioning = false
      effectsState.modeTransition = null
    }, 420)
  }

  function playSound(kind) {
    if (!effectsState.soundEnabled || prefersReducedMotion()) return

    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (kind === 'place') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(520, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
      } else if (kind === 'error') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.14)
      } else if (kind === 'toggle') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.07)
      }
    } catch {
      // Ses desteklenmiyorsa sessizce devam et
    }
  }

  function toggleSound() {
    effectsState.soundEnabled = !effectsState.soundEnabled
    localStorage.setItem('city-ui-sound', effectsState.soundEnabled ? '1' : '0')
    if (effectsState.soundEnabled) {
      playSound('toggle')
    }
    return effectsState.soundEnabled
  }

  function reportPlacement(result, { showSuccessToast = false } = {}) {
    if (result === 'success') {
      flashCanvas('success')
      playSound('place')
      if (showSuccessToast) {
        return { toast: 'Yerleştirildi', type: 'success', duration: 1800 }
      }
    } else if (result === 'error') {
      flashCanvas('error')
      playSound('error')
      return { toast: 'Buraya yerleştirilemez', type: 'error', duration: 2200 }
    }
    return null
  }

  return {
    effectsState: readonly(effectsState),
    flashCanvas,
    triggerModeTransition,
    playSound,
    toggleSound,
    reportPlacement,
  }
}
