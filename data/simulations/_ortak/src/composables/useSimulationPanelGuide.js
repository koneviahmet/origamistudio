import { ref, computed } from 'vue'

function normalizeGuideConfig(raw) {
  if (!raw) return { steps: [], skippable: true }
  if (Array.isArray(raw)) return { steps: raw, skippable: true }
  return {
    steps: raw.steps ?? [],
    skippable: raw.skippable !== false,
  }
}

/**
 * Oyun içi simülasyon panelinde adım adım klavuz durumu.
 * Adımlar etkileşim config'indeki `panelGuide` alanından okunur.
 */
export function useSimulationPanelGuide(guideSource) {
  const currentIndex = ref(0)
  const isActive = ref(false)
  const isComplete = ref(false)

  const normalized = computed(() => normalizeGuideConfig(guideSource.value))

  const steps = computed(() => normalized.value.steps)
  const skippable = computed(() => normalized.value.skippable)
  const totalSteps = computed(() => steps.value.length)
  const currentStep = computed(() => steps.value[currentIndex.value] ?? null)
  const focus = computed(() => currentStep.value?.focus ?? null)
  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value >= totalSteps.value - 1)

  function start() {
    if (!steps.value.length) {
      reset()
      return
    }
    currentIndex.value = 0
    isComplete.value = false
    isActive.value = true
  }

  function reset() {
    currentIndex.value = 0
    isActive.value = false
    isComplete.value = false
  }

  function next() {
    if (!isActive.value) return
    if (isLast.value) {
      complete()
      return
    }
    currentIndex.value += 1
  }

  function prev() {
    if (!isActive.value || isFirst.value) return
    currentIndex.value -= 1
  }

  function skip() {
    if (!isActive.value) return
    complete()
  }

  function complete() {
    isActive.value = false
    isComplete.value = true
  }

  return {
    currentIndex,
    isActive,
    isComplete,
    steps,
    skippable,
    totalSteps,
    currentStep,
    focus,
    isFirst,
    isLast,
    start,
    reset,
    next,
    prev,
    skip,
    complete,
  }
}
