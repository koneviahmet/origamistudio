import { ref, computed, shallowRef } from 'vue'
import { getSimulationEntry } from '../views/simulation/simulations/registry.js'
import { createDialogueController } from './useDialogueController.js'

/**
 * Oyun içi simülasyon katmanı durumu.
 * usePlayEngine tarafından oluşturulur; PlayScene + InGameSimulationHost paylaşır.
 */
export function createInGameSimulationController({
  getScoreStore,
  onSimulationEvent,
  onSimulationClosed,
} = {}) {
  const isOpen = ref(false)
  const isLoading = ref(false)
  const loadError = ref(null)
  const activeSlug = ref(null)
  const activeConfig = shallowRef(null)
  const activeInteraction = shallowRef(null)
  const activePlacement = shallowRef(null)
  const SceneComponent = shallowRef(null)
  const dialogue = createDialogueController({ getScoreStore, showScoreBubble: true })

  let dismissedPlacementId = null
  let placementActive = false

  const title = computed(() => {
    const interaction = activeInteraction.value
    const config = activeConfig.value
    if (interaction?.panelTitle) return interaction.panelTitle
    if (config?.title) return config.title
    return 'Simülasyon'
  })

  const subtitle = computed(() => {
    const interaction = activeInteraction.value
    const placement = activePlacement.value
    if (interaction?.panelSubtitle) return interaction.panelSubtitle
    if (placement?.name) return placement.name
    return null
  })

  async function loadSceneComponent(slug) {
    const entry = getSimulationEntry(slug)
    if (!entry?.loadScene) {
      throw new Error(`Simülasyon sahnesi bulunamadı: ${slug}`)
    }
    const mod = await entry.loadScene()
    return mod.default
  }

  async function open({ slug, interaction = null, placement = null }) {
    if (!slug) return

    if (placement?.id && dismissedPlacementId === placement.id) return

    const entry = getSimulationEntry(slug)
    if (!entry) {
      loadError.value = `Simülasyon kayıtlı değil: ${slug}`
      return
    }

    if (isOpen.value && activeSlug.value === slug) {
      activeInteraction.value = interaction
      activePlacement.value = placement
      if (interaction?.dialogueId) {
        dialogue.open({ interaction, placement })
      } else {
        dialogue.close(false)
      }
      return
    }

    isOpen.value = true
    isLoading.value = true
    loadError.value = null
    activeSlug.value = slug
    activeConfig.value = entry.config
    activeInteraction.value = interaction
    activePlacement.value = placement
    SceneComponent.value = null

    try {
      SceneComponent.value = await loadSceneComponent(slug)
    } catch (err) {
      loadError.value = err.message ?? 'Simülasyon yüklenemedi.'
    } finally {
      isLoading.value = false
    }

    if (interaction?.dialogueId) {
      dialogue.open({ interaction, placement })
    }
  }

  function close(userInitiated = false) {
    const interaction = activeInteraction.value
    const wasOpen = isOpen.value

    dialogue.close(false)

    if (userInitiated && activePlacement.value?.id) {
      dismissedPlacementId = activePlacement.value.id
    }

    isOpen.value = false
    isLoading.value = false
    loadError.value = null
    activeSlug.value = null
    activeConfig.value = null
    activeInteraction.value = null
    activePlacement.value = null
    SceneComponent.value = null

    if (wasOpen && interaction?.id) {
      onSimulationClosed?.({
        interactionId: interaction.id,
        interaction,
        userInitiated,
      })
    }
  }

  function setPlacementActive(active, placement = null) {
    placementActive = active
    if (!active && placement?.id === dismissedPlacementId) {
      dismissedPlacementId = null
    }
    if (!active && !placementActive) {
      dismissedPlacementId = null
    }
  }

  function requestOpenFromInteraction(interaction, placement) {
    if (!interaction?.simulationSlug) return
    setPlacementActive(true, placement)
    open({
      slug: interaction.simulationSlug,
      interaction,
      placement,
    })
  }

  function requestCloseFromInteraction(placement) {
    setPlacementActive(false, placement)
    if (!placementActive) {
      dismissedPlacementId = null
    }
    // Panel kullanıcı (Esc / ×) kapatana kadar açık kalır;
    // fare paneline geçince yerleştirme hover'ı kaybolsa da simülasyon etkileşimi sürer.
  }

  function reportSimulationEvent(event) {
    onSimulationEvent?.(event)
    return dialogue.reportSimulationEvent(event)
  }

  return {
    isOpen,
    isLoading,
    loadError,
    activeSlug,
    activeConfig,
    activeInteraction,
    activePlacement,
    SceneComponent,
    dialogue,
    title,
    subtitle,
    open,
    close,
    setPlacementActive,
    requestOpenFromInteraction,
    requestCloseFromInteraction,
    reportSimulationEvent,
  }
}
