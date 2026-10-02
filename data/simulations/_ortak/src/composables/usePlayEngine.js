import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { useCityStore } from '../stores/cityStore.js'
import { useExploreMode } from './useExploreMode.js'
import { usePlacementInteractions } from './usePlacementInteractions.js'
import { createEngine } from '../lib/three/engine.js'
import { createCityRenderer } from '../lib/three/cityRenderer.js'
import { createWeatherController } from '../lib/three/weather/weatherController.js'
import { preloadAssets } from '../lib/three/assetRegistry.js'
import { PRELOAD_ASSETS } from '../data/preloadAssets.js'
import { mergeAssetLists } from '../lib/three/preloadUtils.js'
import { createTouchCameraController } from '../lib/three/touchCamera.js'
import { pickWorldPoint } from '../lib/three/placement.js'
import { DEFAULT_SKY_PRESET_ID } from '../data/skyPresets.js'
import { collectProjectAssets } from '../lib/play/interactionMatcher.js'
import { useGlobalSettings } from '../lib/globalSettings.js'
import { resolveCharacterScale } from '../lib/characterScale.js'
import { createInGameSimulationController } from './useInGameSimulation.js'
import { createDialogueController } from './useDialogueController.js'
import { createDialogueBubbleAnchor } from './useDialogueBubbleAnchor.js'
import { useScoreStore } from '../stores/scoreStore.js'
import { useQuestStore } from '../stores/questStore.js'
import { useInventoryStore } from '../stores/inventoryStore.js'
import { useModelLibraryStore } from '../stores/modelLibraryStore.js'
import { createAnimatedPropAgentsController } from './useAnimatedPropAgents.js'
import { createFlyingBirdsController } from './useFlyingBirds.js'
import { createCreatureProximitySoundsController } from './useCreatureProximitySounds.js'
import { collectInactiveCharacterPlacementIds } from '../lib/quest/collectInactiveCharacterPlacements.js'

export function usePlayEngine(canvasRef, {
  interactions = [],
  gameSlug,
  gameTitle,
  photoCapture = true,
  getPhotoCameraActive,
  getUiBlocked,
  hideInactiveCharacters = true,
} = {}) {
  const { state, setMode, updateRoad, updateBuilding, updateProp } = useCityStore()
  const { state: libraryState } = useModelLibraryStore()
  const explore = useExploreMode()
  const { globalSettings } = useGlobalSettings()

  const loading = ref(true)
  const loadingProgress = ref(0)
  const loadingStage = ref('assets')
  const error = ref(null)
  const interactionsCtrlRef = ref(null)
  const scoreStore = useScoreStore()
  const questStore = useQuestStore()
  const inventoryStore = useInventoryStore()

  function emitQuestEvent(payload) {
    if (!gameSlug) return
    questStore.handleEvent({ ...payload, gameSlug })
    interactionsCtrlRef.value?.syncQuestGate?.()
  }

  const inGameSimulation = createInGameSimulationController({
    getScoreStore: () => scoreStore,
    onSimulationEvent: (event) => {
      const interactionId = inGameSimulation.activeInteraction.value?.id
      if (!interactionId) return
      emitQuestEvent({
        type: 'simulation-event',
        interactionId,
        eventType: event?.type,
      })
    },
    onSimulationClosed: ({ interactionId }) => {
      if (!interactionId) return
      emitQuestEvent({
        type: 'simulation-open',
        interactionId,
      })
    },
  })
  function handleDialoguePickupReward(interaction, placement) {
    if (!gameSlug) return

    const rewards = Array.isArray(interaction?.pickupRewards)
      ? interaction.pickupRewards
      : interaction?.pickupReward
        ? [interaction.pickupReward]
        : []
    if (!rewards.length) return

    for (const reward of rewards) {
      if (!reward?.itemId) continue

      const keepPlacement = reward.keepPlacement === true
      const virtualId = keepPlacement
        ? `${interaction.id}:reward:${reward.itemId}`
        : placement?.id
      if (!virtualId) continue
      if (inventoryStore.isPickupCollected(gameSlug, virtualId)) continue

      const catalog = inventoryStore.getItemMeta?.(reward.itemId)
        ?? null
      const virtualPlacement = keepPlacement
        ? {
            id: virtualId,
            x: placement?.x ?? 0,
            y: placement?.y ?? 0,
            z: placement?.z ?? 0,
            pack: catalog?.pack,
            asset: catalog?.asset,
            name: reward.label ?? catalog?.label,
          }
        : placement

      const entry = inventoryStore.tryCollect({
        gameSlug,
        placement: virtualPlacement,
        interaction: {
          ...interaction,
          itemId: reward.itemId,
          label: reward.label ?? interaction.panelTitle,
          emoji: reward.emoji,
        },
      })

      if (!entry) continue

      if (keepPlacement) {
        inventoryStore.showPickupToast({
          label: entry.label,
          emoji: entry.emoji,
          pack: entry.pack,
          asset: entry.asset,
          screenX: null,
          screenY: null,
        })
      } else {
        handlePickupCollected(placement, entry, null)
      }
    }
  }

  async function syncRendererAfterPlacementChange(placementId) {
    if (!renderer || !placementId) return
    const layer = findPlacementLayer(state.project, placementId)
    await renderer.sync(state.project, {
      roadHintIds: layer === 'roads' ? [placementId] : null,
    })
  }

  function getFreshPlacement(placement) {
    if (!placement?.id) return placement
    const layer = findPlacementLayer(state.project, placement.id)
    const items = state.project.layers?.[layer]
    return items?.find((item) => item.id === placement.id) ?? placement
  }

  function handleQuizCorrect({ interaction, placement }) {
    if (!interaction?.advanceModelSetOnCorrect || !placement?.id) return

    const current = getFreshPlacement(placement)
    const patch = computeNextStagePatch(current, libraryState.library)
    if (!patch) return

    const layer = interaction.match?.layer ?? findPlacementLayer(state.project, placement.id)
    try {
      if (layer === 'roads') updateRoad(placement.id, patch)
      else if (layer === 'buildings') updateBuilding(placement.id, patch)
      else updateProp(placement.id, patch)
      syncRendererAfterPlacementChange(placement.id)
    } catch (err) {
      console.warn('Set aşaması güncellenemedi:', err)
    }
  }

  const dialogue = createDialogueController({
    getScoreStore: () => scoreStore,
    getQuestStore: () => questStore,
    gameSlug,
    onQuizCorrect: handleQuizCorrect,
    onDialogueComplete: ({ interactionId, interaction, placement }) => {
      emitQuestEvent({ type: 'dialogue-complete', interactionId })
      handleDialoguePickupReward(interaction, placement)
      interactionsCtrlRef.value?.markDialogueInteractionCompleted?.(interaction, placement)
    },
  })
  const dialogueBubble = createDialogueBubbleAnchor({
    controller: dialogue,
    getCanvas: () => canvasRef.value,
    getEngine: () => engine,
    getProject: () => state.project,
    getRenderer: () => renderer,
    getAnimatedAgents: () => animatedAgents,
  })

  let engine = null
  let renderer = null
  let weatherController = null
  let touchCamera = null
  let interactionsCtrl = null
  const animatedAgents = createAnimatedPropAgentsController()
  const flyingBirds = createFlyingBirdsController()
  const creatureSounds = createCreatureProximitySoundsController()
  let raf = 0
  let initGeneration = 0
  const activeHint = computed(() => interactionsCtrlRef.value?.activeHint?.value ?? null)
  let panDragging = false
  let lastX = 0
  let lastY = 0
  let pointerDownX = 0
  let pointerDownY = 0
  let pointerDownAt = 0
  let activePointerId = null
  const CLICK_MAX_MOVE = 8
  const CLICK_MAX_MS = 500
  const clock = new THREE.Clock()

  function isTouchLikePointer(e) {
    return e?.pointerType === 'touch' || e?.pointerType === 'pen'
  }

  function pickWalkTarget(clientX, clientY) {
    const canvas = canvasRef.value
    if (!engine || !canvas) return null
    const targets = engine.getGroundPickTargets?.() ?? []
    const point = pickWorldPoint(clientX, clientY, canvas, engine.camera, targets)
    if (!point) return null
    return { x: point.x, z: point.z }
  }

  function projectWorldToScreen(x, y, z) {
    const canvas = canvasRef.value
    if (!engine || !canvas) return null

    const vector = new THREE.Vector3(x, y, z)
    vector.project(engine.camera)

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    return {
      x: rect.left + ((vector.x + 1) / 2) * rect.width,
      y: rect.top + ((-vector.y + 1) / 2) * rect.height,
    }
  }

  function hideCollectedPlacements() {
    if (!renderer || !gameSlug) return
    const ids = inventoryStore.getCollectedPlacementIdsForGame(gameSlug)
    renderer.setCollectedPlacementIds(ids)
  }

  function handlePickupCollected(placement, entry, screen) {
    if (!placement?.id || !renderer || !entry) return

    renderer.setPlacementCollected(placement.id, true)

    let screenX = screen?.x ?? null
    let screenY = screen?.y ?? null

    if (screenX == null || screenY == null) {
      const worldY = placement.y ?? 0
      const screenPos = projectWorldToScreen(placement.x, worldY + 0.35, placement.z)
      if (screenPos) {
        screenX = screenPos.x
        screenY = screenPos.y
      }
    }

    inventoryStore.showPickupToast({
      label: entry.label,
      emoji: entry.emoji,
      pack: entry.pack,
      asset: entry.asset,
      screenX,
      screenY,
    })
  }

  function getPicker() {
    const canvas = canvasRef.value
    if (!renderer || !engine || !canvas) return null
    return (clientX, clientY) =>
      renderer.pickItem(clientX, clientY, canvas, engine.camera)
  }

  function rebuildGroundMesh() {
    if (!engine) return
    engine.buildGround(state.project.settings, {
      terrainCells: state.project.layers.terrain ?? [],
      exploreStyle: true,
      roads: state.project.layers.roads ?? [],
    })
    engine.setGridVisible(false)
  }

  function onResize() {
    const canvas = canvasRef.value
    if (!canvas || !engine) return
    const parent = canvas.parentElement
    engine.resize(parent.clientWidth, parent.clientHeight)
  }

  function isModalOpen() {
    return inGameSimulation.isOpen.value || Boolean(getUiBlocked?.())
  }

  function onPointerDown(e) {
    if (isModalOpen()) return

    creatureSounds.unlock()
    weatherController?.unlock()

    pointerDownX = e.clientX
    pointerDownY = e.clientY
    pointerDownAt = performance.now()
    activePointerId = e.pointerId

    touchCamera?.pointerDown(e.pointerId, e.clientX, e.clientY)

    if (touchCamera?.isMultiTouch()) {
      panDragging = true
      explore.clearWalkTarget?.()
      return
    }

    const isFps = explore.cameraMode.value === 'first'
    if ((e.button === 0 && isFps) || e.button === 1 || e.button === 2) {
      e.preventDefault()
      panDragging = true
      lastX = e.clientX
      lastY = e.clientY
      explore.clearWalkTarget?.()
    }
  }

  function onPointerUp(e) {
    const wasPanDragging = panDragging
    const pointerId = e?.pointerId

    touchCamera?.pointerUp(pointerId)
    if (touchCamera?.pointerCount() === 0) {
      touchCamera?.reset()
    }
    panDragging = false
    if (activePointerId === pointerId) activePointerId = null

    if (isModalOpen() || wasPanDragging || e?.button !== 0) return

    const dx = (e?.clientX ?? 0) - pointerDownX
    const dy = (e?.clientY ?? 0) - pointerDownY
    const elapsed = performance.now() - pointerDownAt
    if (Math.hypot(dx, dy) > CLICK_MAX_MOVE || elapsed > CLICK_MAX_MS) return

    const picker = getPicker()
    if (!picker) return

    const pick = picker(e.clientX, e.clientY)
    if (interactionsCtrl?.handleClick(pick, { x: e.clientX, y: e.clientY })) {
      explore.clearWalkTarget?.()
      return
    }

    const walkPoint = pickWalkTarget(e.clientX, e.clientY)
    if (walkPoint) {
      explore.setWalkTarget?.(walkPoint.x, walkPoint.z)
    }
  }

  function onPointerMove(e) {
    if (!canvasRef.value || !engine) return

    if (isModalOpen()) return

    if (touchCamera?.pointerCount() > 0) {
      const handled = touchCamera.pointerMove(e.pointerId, e.clientX, e.clientY)
      if (handled) {
        explore.clearWalkTarget?.()
        return
      }
    }

    // Tablette tek parmak sürükleyince kamera dönsün (ekran tuşu yok)
    if (
      !panDragging &&
      activePointerId === e.pointerId &&
      isTouchLikePointer(e) &&
      (touchCamera?.pointerCount?.() ?? 0) <= 1
    ) {
      const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY)
      if (moved > CLICK_MAX_MOVE) {
        panDragging = true
        lastX = e.clientX
        lastY = e.clientY
        explore.clearWalkTarget?.()
      }
    }

    if (panDragging) {
      const isFps = explore.cameraMode.value === 'first'
      const yawSens = isFps ? 0.0032 : 0.005
      const pitchSens = isFps ? 0.0026 : 0.004
      const deltaYaw = -(e.clientX - lastX) * yawSens
      const deltaPitch = -(e.clientY - lastY) * pitchSens
      explore.rotateCamera(deltaYaw, deltaPitch)
      lastX = e.clientX
      lastY = e.clientY
      return
    }

    interactionsCtrl?.onPointerMove(e.clientX, e.clientY)
  }

  function onPointerLeave() {
    interactionsCtrl?.onPointerLeave()
  }

  function onWheel(e) {
    if (isModalOpen()) return
    e.preventDefault()
    explore.adjustZoom(e.deltaY * 0.004)
  }

  function onContextMenu(e) {
    e.preventDefault()
  }

  function onKeyDown(e) {
    if (isModalOpen()) return
    if (e.target.matches('input, textarea, select')) return

    if (e.code === 'F5') {
      e.preventDefault()
      if (getPhotoCameraActive?.()) return
      explore.cycleCameraMode()
      emitQuestEvent({ type: 'camera-change' })
      return
    }

    if (e.code === 'KeyE') {
      e.preventDefault()
      if (interactionsCtrl?.tryOpenNearbyDialogue()) return
    }

    if (
      ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
        e.code,
      )
    ) {
      creatureSounds.unlock()
    weatherController?.unlock()
      e.preventDefault()
    }
  }

  let exploreMoveReported = false
  let exploreRunReported = false

  function trackExploreQuests() {
    const movement = explore.peekMovement?.()
    if (!movement) return

    if (movement.moving && !exploreMoveReported) {
      exploreMoveReported = true
      emitQuestEvent({ type: 'explore-move' })
    }

    if (movement.running && !exploreRunReported) {
      exploreRunReported = true
      emitQuestEvent({ type: 'explore-run' })
    }

    questStore.tickExploreDuration(gameSlug, movement.moving)
  }

  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05)

    if (!isModalOpen()) {
      explore.update(dt)
      trackExploreQuests()
    }

    weatherController?.update(dt)

    const playerPos = explore.getPlayerPosition()
    const playerMoving = explore.peekMovement?.()?.moving ?? false
    animatedAgents.setDialogueLockedPlacement?.(
      dialogue.isOpen.value ? dialogue.activePlacement.value?.id ?? null : null,
      playerPos,
    )
    if (!isModalOpen()) {
      animatedAgents.update(dt, playerPos, state.project.settings)
      flyingBirds.update(dt, {
        playerPos,
        playerMoving,
        agentThreats: animatedAgents.getAgentThreats?.() ?? [],
      })
      creatureSounds.update(dt, playerPos, [
        ...(animatedAgents.getSoundSources?.() ?? []),
        ...(flyingBirds.getSoundSources?.() ?? []),
      ])
    }
    if (playerPos) {
      interactionsCtrl?.updatePlayerStand(
        playerPos.x,
        playerPos.z,
        state.project.settings,
      )
    }

    dialogueBubble.update()

    if (engine) {
      const target = engine.cameraState.target
      renderer?.updateCulling?.(
        target,
        state.project.settings,
        engine.cameraState.distance * 1.35 + 16,
      )
    }

    renderer?.updateRotatingProps?.(dt)

    engine?.render()
    raf = requestAnimationFrame(loop)
  }

  async function initScene() {
    const canvas = canvasRef.value
    if (!canvas) return

    const generation = ++initGeneration

    setMode('explore')

    loading.value = true
    loadingStage.value = 'assets'
    loadingProgress.value = 0

    const projectAssets = collectProjectAssets(state.project)
    const preloadList = mergeAssetLists(
      PRELOAD_ASSETS,
      projectAssets,
      flyingBirds.getPreloadAssets(),
    )

    try {
      await preloadAssets(preloadList, (ratio) => {
        loadingProgress.value = ratio * 0.65
      })
    } catch (err) {
      console.warn('Ön yükleme kısmen başarısız:', err)
    }

    if (generation !== initGeneration || canvasRef.value !== canvas) return

    engine = createEngine(canvas, { preserveDrawingBuffer: photoCapture })
    engine.setShadowPerformanceMode('explore')

    const skyPreset = state.project.settings.sky?.preset ?? DEFAULT_SKY_PRESET_ID
    await engine.applySky(skyPreset)

    renderer = createCityRenderer(engine.cityRoot)
    renderer.setSceneVisibilityMode('play')
    weatherController = createWeatherController(engine.scene, state.project.settings, {
      getEngine: () => engine,
    })

    interactionsCtrl = usePlacementInteractions({
      getProject: () => state.project,
      getPicker,
      getEngine: () => engine,
      getWeatherController: () => weatherController,
      getSimulationController: () => inGameSimulation,
      getDialogueController: () => dialogue,
      getScoreStore: () => scoreStore,
      getQuestStore: () => questStore,
      getInventoryStore: () => inventoryStore,
      onPickupCollected: handlePickupCollected,
      gameSlug,
      interactions,
      getAnimatedAgents: () => animatedAgents,
    })
    interactionsCtrl.setBaseSkyPreset(skyPreset)
    weatherController.setBaseSkyPreset(skyPreset)
    interactionsCtrlRef.value = interactionsCtrl

    touchCamera = createTouchCameraController({
      onZoom: (delta) => explore.adjustZoom(delta),
      onRotate: (delta) => explore.rotateCamera(delta),
    })

    rebuildGroundMesh()

    loadingStage.value = 'scene'
    loadingProgress.value = 0.72

    await renderer.sync(state.project)
    renderer.setPlayHiddenPlacementIds(
      collectInactiveCharacterPlacementIds(state.project, interactions, {
        enabled: hideInactiveCharacters,
      }),
    )
    hideCollectedPlacements()

    loadingProgress.value = 0.9
    await explore.enterExplore(engine, state.project, state.project.player.characterId)
    if (generation !== initGeneration || !engine) return

    explore.applyCharacterScale(resolveCharacterScale(state.project))

    await animatedAgents.init({
      scene: engine.cityRoot,
      project: state.project,
      renderer,
      interactions,
      hideInactiveCharacters,
    })
    if (generation !== initGeneration || !engine) return

    await flyingBirds.init({
      scene: engine.cityRoot,
      project: state.project,
    })
    if (generation !== initGeneration || !engine) return

    weatherController.preload().catch((err) => {
      console.warn('Hava sesleri ön yüklenemedi:', err)
    })

    creatureSounds.preload().catch((err) => {
      console.warn('Hayvan sesleri ön yüklenemedi:', err)
    })

    loadingProgress.value = 1
    loadingStage.value = 'done'
    loading.value = false

    scoreStore.startSession({ gameSlug, gameTitle })
    questStore.startDurationTracking(gameSlug)

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)

    onResize()
    clock.start()
    loop()
  }

  async function reloadCharacter() {
    if (!engine) return
    await explore.reloadCharacter(state.project.player.characterId, state.project)
  }

  onMounted(async () => {
    error.value = null
    try {
      await initScene()
    } catch (err) {
      error.value = err.message ?? 'Oyun başlatılamadı.'
      loading.value = false
      console.error(err)
    }
  })

  watch(
    () => globalSettings.character.scale,
    (scale) => {
      explore.applyCharacterScale(scale)
    },
  )

  watch(
    () => state.project.player?.characterScale,
    (scale) => {
      if (typeof scale === 'number') {
        explore.applyCharacterScale(scale)
      }
    },
  )

  onUnmounted(() => {
    initGeneration += 1
    cancelAnimationFrame(raf)
    const canvas = canvasRef.value
    canvas?.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointermove', onPointerMove)
    canvas?.removeEventListener('pointerleave', onPointerLeave)
    canvas?.removeEventListener('wheel', onWheel)
    canvas?.removeEventListener('contextmenu', onContextMenu)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('keydown', onKeyDown)

    interactionsCtrl?.dispose()
    interactionsCtrl = null
    interactionsCtrlRef.value = null
    animatedAgents.dispose()
    flyingBirds.dispose()
    creatureSounds.dispose()
    scoreStore.finalizeSession()
    explore.dispose()
    touchCamera?.reset()
    weatherController?.dispose()
    renderer?.dispose()
    engine?.dispose()

    weatherController = null
    renderer = null
    engine = null
    touchCamera = null
  })

  return {
    loading,
    loadingProgress,
    loadingStage,
    error,
    exploreLoading: explore.exploreLoading,
    exploreCameraModeLabel: explore.cameraModeLabel,
    activeHint,
    reloadCharacter,
    inGameSimulation,
    dialogue,
    dialogueBubbleAnchor: dialogueBubble.anchor,
    getEngine: () => engine,
    getProject: () => state.project,
    getPlayerPosition: () => explore.getPlayerPosition(),
    getCameraYaw: () => explore.getCameraYaw(),
    unlockCreatureSounds: () => creatureSounds.unlock(),
    renderFrame: () => engine?.render(),
    setCameraMode: (modeId) => explore.setCameraMode(modeId),
    getCameraMode: () => explore.cameraMode.value,
    setThirdPersonDistance: (distance) => explore.setThirdPersonDistance(distance),
    getThirdPersonDistance: () => explore.getThirdPersonDistance(),
    characterAnimations: explore.characterAnimations,
    activeCharacterAnimation: explore.activeCharacterAnimation,
    characterAnimationPaused: explore.characterAnimationPaused,
    playCharacterAnimation: (name) => explore.playCharacterAnimation(name),
    toggleCharacterAnimationPause: () => explore.toggleCharacterAnimationPause(),
  }
}
