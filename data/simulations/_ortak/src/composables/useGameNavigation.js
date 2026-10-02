import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore.js'
import { useProjectAutosave } from './useProjectAutosave.js'
import { getGamePath } from '../router/index.js'

export function useGameNavigation() {
  const router = useRouter()
  const { clearCurrentGame } = useGameStore()
  const { persistNow, hasUnsavedChanges } = useProjectAutosave()

  function goToGame(gameId) {
    router.push(getGamePath(gameId))
  }

  async function confirmLeaveWithUnsavedChanges() {
    if (!hasUnsavedChanges.value) return true

    if (window.confirm('Kaydedilmemiş değişiklikler var. Kaydetmek ister misiniz?')) {
      try {
        await persistNow({ forceFull: true })
        return true
      } catch {
        return window.confirm('Kayıt başarısız. Yine de çıkılsın mı?')
      }
    }

    return window.confirm('Kaydedilmeden çıkılsın mı?')
  }

  async function goToLobby() {
    if (!(await confirmLeaveWithUnsavedChanges())) return
    clearCurrentGame()
    router.push('/oyunlar')
  }

  return { goToGame, goToLobby, confirmLeaveWithUnsavedChanges }
}
