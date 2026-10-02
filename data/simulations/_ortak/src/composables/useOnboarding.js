import { reactive, readonly, watch } from 'vue'
import { useCityStore } from '../stores/cityStore.js'
import { useCreateTools } from './useCreateTools.js'
import { isOnboardingDone, setOnboardingDone } from '../lib/city/onboardingStorage.js'

export const ONBOARDING_STEPS = [
  {
    id: 'road',
    target: 'road-tool',
    title: '1. Yol çiz',
    body: 'Yol aracı seçili. Haritaya tıkla veya sürükleyerek yol ağını oluştur. Shift ile düz çizgi çizebilirsin.',
    tool: 'road',
  },
  {
    id: 'build',
    target: 'asset-palette',
    title: '2. Bina ve dekor ekle',
    body: 'Sağdaki paletten bina veya dekor seç, haritaya yerleştir. R ile döndür, G ile ızgara hizalamasını aç/kapa.',
    tool: 'building',
  },
  {
    id: 'explore',
    target: 'explore-button',
    title: '3. Şehrini gez',
    body: 'Düzenlemeyi bitir ve gezinti moduna geç. WASD ile yürü, Shift ile koş. İstediğin zaman düzenlemeye dönebilirsin.',
    tool: null,
  },
]

const tourState = reactive({
  active: false,
  step: 0,
  showFirstClickHint: false,
})

let progressWatchStarted = false

function isCityEmpty(project) {
  const layers = project.layers
  return (
    layers.roads.length === 0 &&
    layers.buildings.length === 0 &&
    layers.props.length === 0
  )
}

function applyStepTool(stepIndex) {
  const step = ONBOARDING_STEPS[stepIndex]
  if (!step?.tool) return
  const { setTool } = useCreateTools()
  setTool(step.tool)
}

function startProgressWatch() {
  if (progressWatchStarted) return
  progressWatchStarted = true

  const { state } = useCityStore()

  watch(
    () => [
      state.project.layers.roads.length,
      state.project.layers.buildings.length,
      state.project.layers.props.length,
      tourState.active,
      tourState.step,
    ],
    () => {
      if (!tourState.active) return

      const { roads, buildings, props } = state.project.layers

      if (tourState.step === 0 && roads.length > 0) {
        nextStep()
        return
      }

      if (tourState.step === 1 && (buildings.length > 0 || props.length > 0)) {
        nextStep()
      }
    },
  )
}

export function useOnboarding() {
  const { state } = useCityStore()

  function startTour() {
    if (isOnboardingDone() || tourState.active) return
    if (!isCityEmpty(state.project)) {
      setOnboardingDone()
      return
    }
    tourState.active = true
    tourState.step = 0
    tourState.showFirstClickHint = isCityEmpty(state.project)
    applyStepTool(0)
    startProgressWatch()
  }

  function nextStep() {
    if (!tourState.active) return

    if (tourState.step >= ONBOARDING_STEPS.length - 1) {
      finishTour()
      return
    }

    tourState.step += 1
    tourState.showFirstClickHint =
      tourState.step === 0 && isCityEmpty(state.project)
    applyStepTool(tourState.step)
  }

  function finishTour(dismissForever = true) {
    tourState.active = false
    tourState.showFirstClickHint = false
    if (dismissForever) {
      setOnboardingDone()
    }
  }

  function dismissForever() {
    finishTour(true)
  }

  function dismissFirstClickHint() {
    tourState.showFirstClickHint = false
  }

  function maybeStartTourAfterLoad(loading) {
    if (loading || isOnboardingDone() || tourState.active) return
    if (state.mode !== 'create') return
    startTour()
  }

  return {
    tourState: readonly(tourState),
    startTour,
    nextStep,
    finishTour,
    dismissForever,
    dismissFirstClickHint,
    maybeStartTourAfterLoad,
    isCityEmpty: () => isCityEmpty(state.project),
  }
}
