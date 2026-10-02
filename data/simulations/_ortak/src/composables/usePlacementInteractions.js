import { ref } from 'vue'
import {
  getPlacementFromPick,
  getGridPlacement,
  matchesPlacement,
  findNearbyDialogueTarget,
  findNearbyPickupTarget,
  findNearbyLibraryPickupTarget,
  findNearbySimulationTarget,
} from '../lib/play/interactionMatcher.js'
import { DEFAULT_SKY_PRESET_ID } from '../data/skyPresets.js'
import {
  HOVER_WEATHER_TYPES,
  weatherKeyFromInteraction,
} from '../lib/three/weather/weatherController.js'
import {
  filterInteractionsForQuest,
  getQuestInteractionGate,
  isInteractionQuestAllowed,
} from '../lib/quest/questInteractionGate.js'

/**
 * Oyun içi yerleştirme etkileşimleri (üzerine gelince yağmur, simülasyon vb.).
 * Hem fare imleci hem karakter konumu ile tetiklenir.
 */
export function usePlacementInteractions({
  getProject,
  getPicker,
  getEngine,
  getWeatherController,
  getSimulationController,
  getDialogueController,
  getScoreStore,
  getQuestStore,
  getInventoryStore,
  onPickupCollected,
  gameSlug = null,
  interactions = [],
  getAnimatedAgents = null,
}) {
  const activeHint = ref(null)
  const activeInteractionIds = ref([])

  let activePlacementId = null
  let standSimulationPlacementId = null
  let hoverWeatherPlacementId = null
  let mousePlacement = null
  let playerPlacement = null
  let nearbyDialogueTarget = null
  let nearbyPickupTarget = null
  let nearbySimulationTarget = null
  let baseSkyPreset = DEFAULT_SKY_PRESET_ID
  const completedDialogueKeys = new Set()

  function dialogueCompletionKey(interaction, placement) {
    if (!interaction?.id || !placement?.id) return null
    return `${interaction.id}:${placement.id}`
  }

  function isDialogueInteractionCompleted(interaction, placement) {
    if (!interaction?.completeOnce) return false
    const key = dialogueCompletionKey(interaction, placement)
    return key ? completedDialogueKeys.has(key) : false
  }

  function markDialogueInteractionCompleted(interaction, placement) {
    if (!interaction?.completeOnce) return
    const key = dialogueCompletionKey(interaction, placement)
    if (key) completedDialogueKeys.add(key)
  }

  function getQuestGatedInteractions() {
    return filterInteractionsForQuest(interactions, gameSlug, getQuestStore?.())
  }

  function enforceQuestInteractionGate() {
    const gate = getQuestInteractionGate(gameSlug, getQuestStore?.())
    const sim = getSimulationController?.()
    const dialogue = getDialogueController?.()

    const simInteractionId = sim?.activeInteraction?.value?.id
    if (sim?.isOpen?.value && simInteractionId && !isInteractionQuestAllowed(simInteractionId, gate)) {
      sim.close(false)
    }

    const dialogueInteractionId = dialogue?.activeInteraction?.value?.id
    if (
      dialogue?.isOpen?.value
      && dialogueInteractionId
      && !isInteractionQuestAllowed(dialogueInteractionId, gate)
    ) {
      dialogue.close(false)
    }
  }

  function findInteractionHandlers(placement) {
    if (!placement) return []

    return getQuestGatedInteractions().filter((interaction) => {
      if (interaction.match?.layer) {
        const layerKey = interaction.match.layer
        const items = getProject()?.layers?.[layerKey]
        if (!Array.isArray(items) || !items.some((item) => item.id === placement.id)) {
          return false
        }
      }
      return matchesPlacement(placement, interaction.match)
    })
  }

  function isPlacementCollected(placementId) {
    if (!gameSlug || !placementId) return false
    return getInventoryStore?.()?.isPickupCollected(gameSlug, placementId) ?? false
  }

  function collectPickup(target, screen = null) {
    if (!target?.placement || !target?.interaction) return false
    if (isPlacementCollected(target.placement.id)) return false

    const entry = getInventoryStore?.()?.tryCollect({
      gameSlug,
      placement: target.placement,
      interaction: target.interaction,
      screenX: screen?.x ?? null,
      screenY: screen?.y ?? null,
    })

    if (!entry) return false

    onPickupCollected?.(target.placement, entry, screen)
    emitQuestEvent({
      type: 'pickup-collect',
      interactionId: target.interaction.id,
      itemId: entry.itemId,
    })

    if (nearbyPickupTarget?.placement?.id === target.placement.id) {
      nearbyPickupTarget = null
    }

    return true
  }

  function updatePlayerPickupProximity(x, z) {
    const prevTarget = nearbyPickupTarget
    nearbyPickupTarget = findNearbyPickupTarget(
      getProject(),
      x,
      z,
      interactions,
      { isCollected: isPlacementCollected },
    ) ?? findNearbyLibraryPickupTarget(
      getProject(),
      x,
      z,
      getProject()?.settings,
      { isCollected: isPlacementCollected },
    )

    if (nearbyPickupTarget) {
      if (nearbyPickupTarget.placement.id !== prevTarget?.placement?.id) {
        activeHint.value =
          nearbyPickupTarget.interaction.hint
          ?? `${nearbyPickupTarget.interaction.label ?? nearbyPickupTarget.placement.name ?? 'Eşya'} — toplamak için yanına gel`
      }
      collectPickup(nearbyPickupTarget)
      return
    }

    if (prevTarget && !nearbyDialogueTarget) {
      activeHint.value = null
    }
  }

  function applyPickupClick(placement, screen = null) {
    const handlers = findInteractionHandlers(placement).filter(
      (i) => i.type === 'pickup-collect',
    )
    if (handlers.length && !isPlacementCollected(placement.id)) {
      return collectPickup({
        placement,
        interaction: handlers[0],
      }, screen)
    }

    if (placement?.pickable || placement?.inventoryEnabled) {
      if (isPlacementCollected(placement.id)) return false
      return collectPickup({
        placement,
        interaction: {
          id: `library-pickup:${placement.id}`,
          type: 'pickup-collect',
          label: placement.name ?? placement.asset,
        },
      }, screen)
    }

    return false
  }

  function isDialoguePickupCollected(interaction, placement) {
    if (!interaction?.pickupReward || !placement?.id) return false
    return isPlacementCollected(placement.id)
  }

  function emitQuestEvent(payload) {
    if (!gameSlug) return
    getQuestStore?.()?.handleEvent({ ...payload, gameSlug })
  }

  function applyHoverWeather(interaction, active) {
    const weather = getWeatherController()
    if (!weather) return

    const weatherKey = weatherKeyFromInteraction(interaction)
    if (!weatherKey) return

    if (active) {
      if (interaction.skyPreset) {
        getEngine()?.applySky(interaction.skyPreset)
      }
      weather.setActiveMode(weatherKey)
      activeHint.value = interaction.hint ?? placementHint(interaction)
      emitQuestEvent({
        type: 'interaction-active',
        interactionId: interaction.id,
      })
    } else {
      weather.setActiveMode(null)
      activeHint.value = null
    }
  }

  function placementHint(interaction) {
    if (interaction.hint) return interaction.hint
    if (interaction.type === 'click-dialogue' && interaction.match?.name) {
      const label = interaction.match.name
      if (interaction.autoOpen === false) {
        return `${label} — konuşmak için dokun veya E`
      }
      return `${label} — yakında, konuşma başlıyor`
    }
    if (interaction.type === 'pickup-collect') {
      const label = interaction.label ?? interaction.match?.name ?? 'Eşya'
      return interaction.hint ?? `${label} — toplamak için yanına gel veya dokun`
    }
    if (interaction.match?.name) {
      if (interaction.type === 'hover-snow') return `${interaction.match.name} — kar`
      if (interaction.type === 'hover-wind') return `${interaction.match.name} — rüzgar`
      return `${interaction.match.name} — yağmur`
    }
    return 'Etkileşim aktif'
  }

  function clearNearbyDialogue(prevTarget) {
    const ctrl = getDialogueController?.()
    if (prevTarget?.placement?.id) {
      ctrl?.closeFromProximity(prevTarget.placement)
      ctrl?.clearDismissForPlacement(prevTarget.placement.id)
    }
  }

  function applyNearbyDialogue(target) {
    const ctrl = getDialogueController?.()
    if (!target) return

    const enterRadius = target.interaction.approachRadius ?? 2.2
    const veryClose = target.distance <= enterRadius

    if (
      ctrl?.isOpen.value
      && ctrl.activePlacement.value?.id === target.placement?.id
      && !veryClose
    ) {
      ctrl.closeFromProximity(target.placement)
      activeHint.value = target.interaction.hint ?? placementHint(target.interaction)
      return
    }

    activeHint.value = target.interaction.hint ?? placementHint(target.interaction)

    const autoOpen = target.interaction.autoOpen !== false
    if (autoOpen && ctrl && veryClose && !ctrl.isOpen.value) {
      ctrl.open({
        interaction: target.interaction,
        placement: target.placement,
      })
    }
  }

  function getActiveDialoguePlacementId() {
    const ctrl = getDialogueController?.()
    return ctrl?.activePlacement?.value?.id ?? nearbyDialogueTarget?.placement?.id ?? null
  }

  function updatePlayerProximity(x, z) {
    const prevTarget = nearbyDialogueTarget
    nearbyDialogueTarget = findNearbyDialogueTarget(
      getProject(),
      x,
      z,
      getQuestGatedInteractions(),
      {
        activePlacementId: getActiveDialoguePlacementId(),
        resolveWorldPosition: (placement) =>
          getAnimatedAgents?.()?.getAgentWorldPosition?.(placement?.id) ?? null,
      },
    )

    if (
      nearbyDialogueTarget
      && isDialogueInteractionCompleted(
        nearbyDialogueTarget.interaction,
        nearbyDialogueTarget.placement,
      )
    ) {
      nearbyDialogueTarget = null
    }

    if (nearbyDialogueTarget && isDialoguePickupCollected(
      nearbyDialogueTarget.interaction,
      nearbyDialogueTarget.placement,
    )) {
      nearbyDialogueTarget = null
    }

    if (nearbyDialogueTarget?.placement?.id === prevTarget?.placement?.id) {
      if (nearbyDialogueTarget) applyNearbyDialogue(nearbyDialogueTarget)
      else if (prevTarget) clearNearbyDialogue(prevTarget)
    } else {
      if (prevTarget) clearNearbyDialogue(prevTarget)

      if (nearbyDialogueTarget) {
        applyNearbyDialogue(nearbyDialogueTarget)
      } else if (!mousePlacement && !nearbySimulationTarget) {
        activeHint.value = null
      }
    }

    nearbySimulationTarget = findNearbySimulationTarget(
      getProject(),
      x,
      z,
      getQuestGatedInteractions(),
      { activePlacementId: standSimulationPlacementId },
    )

    refreshActivePlacement()
  }

  function tryOpenNearbyDialogue() {
    if (!nearbyDialogueTarget) return false

    getDialogueController?.()?.open({
      interaction: nearbyDialogueTarget.interaction,
      placement: nearbyDialogueTarget.placement,
    })
    return true
  }

  function applyClickDialogueHint(interaction, active) {
    if (active) {
      activeHint.value = interaction.hint ?? placementHint(interaction)
    } else if (!getDialogueController?.()?.isOpen?.value && !nearbyDialogueTarget) {
      activeHint.value = null
    }
  }

  function handleClick(pick, screen = null) {
    const placement = getPlacementFromPick(getProject(), pick)
    if (!placement) return false

    if (applyPickupClick(placement, screen)) return true

    const handlers = findInteractionHandlers(placement).filter(
      (i) => i.type === 'click-dialogue',
    )
    if (!handlers.length) return false

    const interaction = handlers[0]
    if (isDialoguePickupCollected(interaction, placement)) return false

    getDialogueController?.()?.open({
      interaction,
      placement,
    })
    return true
  }

  function placementHasInteractionType(placement, type) {
    if (!placement) return false
    return findInteractionHandlers(placement).some((i) => i.type === type)
  }

  function placementHasHoverWeather(placement) {
    if (!placement) return false
    return findInteractionHandlers(placement).some((i) => HOVER_WEATHER_TYPES.includes(i.type))
  }

  function resolveStandSimulationPlacement() {
    if (placementHasInteractionType(playerPlacement, 'hover-simulation')) {
      return playerPlacement
    }
    if (placementHasInteractionType(mousePlacement, 'hover-simulation')) {
      return mousePlacement
    }
    return nearbySimulationTarget?.placement ?? null
  }

  function resolveHoverWeatherPlacement() {
    if (placementHasHoverWeather(playerPlacement)) {
      return playerPlacement
    }
    if (placementHasHoverWeather(mousePlacement)) {
      return mousePlacement
    }
    return null
  }

  function applyHoverSimulation(interaction, active, placement) {
    const ctrl = getSimulationController?.()
    if (!ctrl) return

    if (active) {
      ctrl.requestOpenFromInteraction(interaction, placement)
      activeHint.value = interaction.hint ?? placementHint(interaction)
    } else {
      ctrl.requestCloseFromInteraction(placement)
      if (ctrl.activePlacement.value?.id === placement?.id) {
        ctrl.close(false)
      }
      if (!ctrl.isOpen.value) {
        activeHint.value = null
      }
    }
  }

  function reconcileStandSimulation(placement) {
    const nextId = placement?.id ?? null
    if (nextId === standSimulationPlacementId) return

    if (standSimulationPlacementId) {
      const prev = findPlacementById(standSimulationPlacementId)
      for (const interaction of findInteractionHandlers(prev).filter(
        (i) => i.type === 'hover-simulation',
      )) {
        handleInteractionState(interaction, false, prev)
      }
    }

    standSimulationPlacementId = nextId

    if (!placement) return

    for (const interaction of findInteractionHandlers(placement).filter(
      (i) => i.type === 'hover-simulation',
    )) {
      handleInteractionState(interaction, true, placement)
    }
  }

  function reconcileHoverWeather(placement) {
    const nextId = placement?.id ?? null
    if (nextId === hoverWeatherPlacementId) return

    if (hoverWeatherPlacementId) {
      const prev = findPlacementById(hoverWeatherPlacementId)
      for (const interaction of findInteractionHandlers(prev).filter((i) =>
        HOVER_WEATHER_TYPES.includes(i.type),
      )) {
        handleInteractionState(interaction, false, prev)
      }
    }

    hoverWeatherPlacementId = nextId

    if (!placement) return

    for (const interaction of findInteractionHandlers(placement).filter((i) =>
      HOVER_WEATHER_TYPES.includes(i.type),
    )) {
      handleInteractionState(interaction, true, placement)
    }
  }

  function applyEnterScore(interaction, placement) {
    const score = getScoreStore?.()
    if (!score || !placement) return

    const points = interaction.points ?? 1
    const repeatable = interaction.scoreRepeat !== false

    score.award({
      points,
      ruleId: interaction.id,
      label: interaction.scoreLabel ?? `${placement.name ?? 'Alan'} — +${points} puan`,
      oncePerSession: !repeatable,
      dedupeKey: !repeatable ? `${interaction.id}:${placement.id}` : null,
    })

    emitQuestEvent({
      type: 'enter-score',
      interactionId: interaction.id,
    })
  }

  function handlePlayerScoreEnter(prevPlacement, nextPlacement) {
    if (!nextPlacement || nextPlacement.id === prevPlacement?.id) return

    const handlers = findInteractionHandlers(nextPlacement).filter(
      (i) => i.type === 'enter-score',
    )
    for (const interaction of handlers) {
      applyEnterScore(interaction, nextPlacement)
    }
  }

  function handleInteractionState(interaction, active, placement) {
    switch (interaction.type) {
      case 'hover-rain':
      case 'hover-snow':
      case 'hover-wind':
        applyHoverWeather(interaction, active)
        break
      case 'hover-simulation':
        applyHoverSimulation(interaction, active, placement)
        break
      case 'enter-score':
        break
      case 'click-dialogue':
        applyClickDialogueHint(interaction, active)
        break
      case 'pickup-collect':
        if (active && !isPlacementCollected(placement?.id)) {
          activeHint.value = interaction.hint ?? placementHint(interaction)
        }
        break
      default:
        break
    }
  }

  function setActivePlacement(placement) {
    const nextId = placement?.id ?? null
    if (nextId === activePlacementId) return

    if (activePlacementId) {
      const prevPlacement = findPlacementById(activePlacementId)
      const prevHandlers = findInteractionHandlers(prevPlacement)
      for (const interaction of prevHandlers) {
        handleInteractionState(interaction, false, prevPlacement)
      }
    }

    activePlacementId = nextId
    activeInteractionIds.value = []

    if (!placement) return

    const handlers = findInteractionHandlers(placement)
    activeInteractionIds.value = handlers.map((h) => h.id).filter(Boolean)

    for (const interaction of handlers) {
      handleInteractionState(interaction, true, placement)
    }
  }

  function refreshActivePlacement() {
    enforceQuestInteractionGate()
    reconcileStandSimulation(resolveStandSimulationPlacement())
    reconcileHoverWeather(resolveHoverWeatherPlacement())

    activePlacementId = playerPlacement?.id ?? hoverWeatherPlacementId ?? null

    if (nearbyDialogueTarget && !getDialogueController?.()?.isOpen?.value) {
      activeHint.value =
        nearbyDialogueTarget.interaction.hint
        ?? placementHint(nearbyDialogueTarget.interaction)
    } else if (
      standSimulationPlacementId
      && getSimulationController?.()?.isOpen?.value
    ) {
      const pl = findPlacementById(standSimulationPlacementId)
      const simHandler = findInteractionHandlers(pl).find((i) => i.type === 'hover-simulation')
      if (simHandler) {
        activeHint.value = simHandler.hint ?? placementHint(simHandler)
      }
    }
  }

  function findPlacementById(id) {
    const project = getProject()
    if (!project?.layers || !id) return null

    for (const items of Object.values(project.layers)) {
      if (!Array.isArray(items)) continue
      const found = items.find((item) => item.id === id)
      if (found) return found
    }
    return null
  }

  function onPointerMove(clientX, clientY) {
    const picker = getPicker()
    if (!picker) return

    const pick = picker(clientX, clientY)
    mousePlacement = getPlacementFromPick(getProject(), pick)
    refreshActivePlacement()
  }

  function updatePlayerStand(x, z, settings) {
    const prevPlayerPlacement = playerPlacement
    playerPlacement = getGridPlacement(getProject(), 'roads', x, z, settings)
    handlePlayerScoreEnter(prevPlayerPlacement, playerPlacement)
    updatePlayerProximity(x, z)
    updatePlayerPickupProximity(x, z)
  }

  function onPointerLeave() {
    mousePlacement = null
    refreshActivePlacement()
  }

  function setBaseSkyPreset(presetId) {
    baseSkyPreset = presetId ?? DEFAULT_SKY_PRESET_ID
    getWeatherController()?.setBaseSkyPreset(baseSkyPreset)
  }

  function dispose() {
    mousePlacement = null
    playerPlacement = null
    nearbyDialogueTarget = null
    nearbyPickupTarget = null
    nearbySimulationTarget = null
    standSimulationPlacementId = null
    hoverWeatherPlacementId = null
    setActivePlacement(null)
    activeInteractionIds.value = []
  }

  return {
    activeHint,
    activeInteractionIds,
    onPointerMove,
    updatePlayerStand,
    updatePlayerProximity,
    onPointerLeave,
    setBaseSkyPreset,
    handleClick,
    tryOpenNearbyDialogue,
    markDialogueInteractionCompleted,
    syncQuestGate: refreshActivePlacement,
    dispose,
  }
}
