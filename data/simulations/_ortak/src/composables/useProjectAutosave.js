import { ref, watch } from 'vue'
import { useCityStore } from '../stores/cityStore.js'
import { useGameStore } from '../stores/gameStore.js'

export function formatSavedTime(date) {
  if (!date) return ''
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const AUTOSAVE_DELAY_MS = 4000

let lastSavedAt = ref(null)
let saveStatus = ref('idle')
let hasUnsavedChanges = ref(false)
let savedHideTimer = null
let autosaveTimer = null
let initialized = false
let persistNowFn = null
let dirtyTracking = true

function initAutosave() {
  if (initialized) return { persistNow: persistNowFn }
  initialized = true

  const { state, getLayersRevision } = useCityStore()
  const { state: gameState, persistCurrentGame } = useGameStore()

  const updated = state.project.meta?.updatedAt
  if (updated) {
    lastSavedAt.value = new Date(updated)
  }

  async function persistNow({ forceFull = false } = {}) {
    if (!gameState.currentGameId) {
      saveStatus.value = 'idle'
      return
    }

    saveStatus.value = 'pending'
    dirtyTracking = false
    try {
      await persistCurrentGame(state.project, { forceFull })
      lastSavedAt.value = new Date()
      hasUnsavedChanges.value = false
      saveStatus.value = 'saved'
      clearTimeout(savedHideTimer)
      savedHideTimer = setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle'
      }, 1800)
    } catch {
      saveStatus.value = 'error'
    } finally {
      dirtyTracking = true
    }
  }

  function scheduleAutosave() {
    if (!dirtyTracking || !gameState.currentGameId) return
    hasUnsavedChanges.value = true
    clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null
      persistNow()
    }, AUTOSAVE_DELAY_MS)
  }

  watch(
    () => getLayersRevision(),
    () => {
      scheduleAutosave()
    },
  )

  watch(
    () => state.project.meta?.updatedAt,
    () => {
      scheduleAutosave()
    },
  )

  watch(
    () => gameState.currentGameId,
    () => {
      hasUnsavedChanges.value = false
      saveStatus.value = 'idle'
      clearTimeout(autosaveTimer)
      const updatedAt = state.project.meta?.updatedAt
      lastSavedAt.value = updatedAt ? new Date(updatedAt) : null
    },
  )

  persistNowFn = persistNow
  return { persistNow }
}

export function useProjectAutosave() {
  const api = initAutosave()
  return {
    lastSavedAt,
    saveStatus,
    hasUnsavedChanges,
    formatSavedTime,
    persistNow: api.persistNow,
  }
}
