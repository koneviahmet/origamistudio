import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { useCityStore } from '../stores/cityStore.js'
import { useCreateTools } from './useCreateTools.js'
import { useRoadBrush } from './useRoadBrush.js'
import { useTerrainBrush } from './useTerrainBrush.js'
import { useExploreMode } from './useExploreMode.js'
import { createEngine } from '../lib/three/engine.js'
import { createCityRenderer } from '../lib/three/cityRenderer.js'
import { createPlacementGhost } from '../lib/three/placementGhost.js'
import { pickPlacementPoint, pickGroundPlanePoint, pickWorldPoint, worldToScreen } from '../lib/three/placement.js'
import { preloadAssets, setActiveLoadSession } from '../lib/three/assetRegistry.js'
import { PRELOAD_ASSETS } from '../data/preloadAssets.js'
import { mergeAssetLists } from '../lib/three/preloadUtils.js'
import { collectProjectAssets } from '../lib/play/interactionMatcher.js'
import { createLoadSession, countProjectItems } from '../lib/debug/loadProfiler.js'
import { useUiShell } from './useUiShell.js'
import { useUiEffects } from './useUiEffects.js'
import { useToast } from './useToast.js'
import { loadCreateCamera, saveCreateCamera } from '../lib/three/cameraStorage.js'
import { createTouchCameraController } from '../lib/three/touchCamera.js'
import { useCameraControls } from './useCameraControls.js'
import {
  buildTerrainMap,
  sampleTerrainHeight,
  terrainHeightAtCell,
  MAX_TERRAIN_LEVEL,
} from '../lib/city/terrainUtils.js'
import { normalizeGridRect } from '../lib/city/gridLine.js'
import { gridRectToWorldBounds, gridToWorld, isInBounds, worldToGrid } from '../lib/city/gridUtils.js'
import { OFFSHORE_ITEM_Y, isOffshoreGridCell } from '../lib/city/offshoreGrid.js'
import { PROP_LIKE_TOOLS, PLACEMENT_TOOLS } from '../data/toolAssets.js'

const PLACEMENT_BRUSH_TOOLS = new Set(['building', 'prop', 'vehicle', 'figur', 'food'])

const ITEM_LAYER_TO_RENDER = {
  road: 'roads',
  building: 'buildings',
  prop: 'props',
}
import { useGlobalSettings } from '../lib/globalSettings.js'
import { DEFAULT_SKY_PRESET_ID } from '../data/skyPresets.js'

export function useCityEngine(canvasRef) {
  const {
    state,
    setMode,
    getTerrainLevelAt,
    getLayersRevision,
    consumeTerrainDirtyCells,
    consumeGroundFullRebuild,
    consumeRoadSyncHints,
  } = useCityStore()
  const createTools = useCreateTools()
  const roadBrush = useRoadBrush()
  const terrainBrush = useTerrainBrush()
  const explore = useExploreMode()
  const uiShell = useUiShell()
  const { globalSettings } = useGlobalSettings()
  const uiEffects = useUiEffects()
  const { showToast } = useToast()
  const cameraControls = useCameraControls()
  const loading = ref(true)
  const loadingProgress = ref(0)
  const loadingStage = ref('assets')
  const sceneSyncing = ref(false)
  const error = ref(null)
  const minimapCamera = ref({ x: 0, z: 0, distance: 42, yaw: 0 })
  const minimapPlayer = ref(null)

  let engine = null
  let syncTimer = null
  let renderer = null
  let ghost = null
  let raf = 0
  let dragging = false
  let panDragging = false
  let rotateDragging = false
  let moveDragging = false
  let areaSelectDragging = false
  let wanderZoneDragging = false
  let repositionDragStart = null
  const REPOSITION_CLICK_THRESHOLD = 8
  let spacePanActive = false
  let activePointerId = null
  let lastX = 0
  let lastY = 0
  let ghostToken = 0
  let cameraSaveTimer = null
  let touchCamera = null
  let pendingGroundRebuild = false
  let pendingSyncOpts = null
  let ghostRaf = 0
  const clock = new THREE.Clock()
  let loadSession = null

  function isBrushInteractionActive() {
    return (
      roadBrush.isBrushing() ||
      terrainBrush.isBrushing() ||
      createTools.isPlacementBrushing?.() ||
      moveDragging ||
      areaSelectDragging ||
      wanderZoneDragging
    )
  }

  function scheduleUpdateGhost() {
    if (ghostRaf) return
    ghostRaf = requestAnimationFrame(() => {
      ghostRaf = 0
      updateGhost()
    })
  }

  function flushPendingSceneSync({ immediate = false } = {}) {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }

    const terrainCells = consumeTerrainDirtyCells()
    const roadHintIds = consumeRoadSyncHints()
    const rebuildGround =
      pendingGroundRebuild ||
      consumeGroundFullRebuild() ||
      pendingSyncOpts?.rebuildGround ||
      terrainCells.length > 0

    pendingGroundRebuild = false
    pendingSyncOpts = null

    const run = () => {
      syncScene({
        rebuildGround,
        terrainCells: terrainCells.length ? terrainCells : undefined,
        roadHintIds: roadHintIds ?? undefined,
      })
    }

    if (immediate) {
      run()
    } else {
      syncTimer = setTimeout(() => {
        syncTimer = null
        run()
      }, 200)
    }
  }

  function scheduleLayerSync(opts = {}) {
    pendingSyncOpts = {
      rebuildGround: pendingSyncOpts?.rebuildGround || opts.rebuildGround,
    }
    if (isBrushInteractionActive()) return
    flushPendingSceneSync()
  }

  function cancelActiveDrags() {
    if (roadBrush.isBrushing()) roadBrush.handlePointerUp()
    if (terrainBrush.isBrushing()) terrainBrush.handlePointerUp()
    if (areaSelectDragging) {
      areaSelectDragging = false
      updateGhost()
    }
    if (wanderZoneDragging) {
      wanderZoneDragging = false
      createTools.endWanderPaintSession()
      updateGhost()
    }
    if (moveDragging) {
      createTools.cancelMoveDrag()
      moveDragging = false
      repositionDragStart = null
      updateGhost()
    }
    panDragging = false
    rotateDragging = false
    dragging = false
    activePointerId = null
  }

  function scheduleCameraSave() {
    if (cameraSaveTimer) clearTimeout(cameraSaveTimer)
    cameraSaveTimer = setTimeout(() => {
      cameraSaveTimer = null
      if (engine && state.mode === 'create') {
        saveCreateCamera(engine.getCameraSnapshot())
      }
    }, 300)
  }

  function persistCameraIfCreate() {
    if (engine && state.mode === 'create') {
      scheduleCameraSave()
    }
  }

  function getTerrainMap() {
    return buildTerrainMap(state.project.layers.terrain ?? [])
  }

  function projectWorldPoint(x, y, z) {
    const canvas = canvasRef.value
    if (!engine || !canvas) return null
    return worldToScreen(x, y, z, engine.camera, canvas)
  }

  function enrichPointHeight(point, tool) {
    if (!point) return null
    if (point.zone === 'offshore') {
      return { ...point, y: OFFSHORE_ITEM_Y }
    }
    const map = getTerrainMap()
    const isFreeProp = PROP_LIKE_TOOLS.includes(tool) && createTools.toolsState.propSnapMode === 'free'
    const y = isFreeProp
      ? sampleTerrainHeight(point.x, point.z, state.project.settings, map)
      : terrainHeightAtCell(map, point.gx, point.gz)
    return { ...point, y }
  }

  function areaRectTerrainY(rect) {
    const settings = state.project.settings
    const { gx0, gz0, gx1, gz1 } = normalizeGridRect(
      rect.gx0,
      rect.gz0,
      rect.gx1,
      rect.gz1,
    )
    const bounds = gridRectToWorldBounds(gx0, gz0, gx1, gz1, settings)
    return sampleTerrainHeight(bounds.x, bounds.z, settings, getTerrainMap())
  }

  function pickGridPoint(clientX, clientY, { allowOffshore = false } = {}) {
    const canvas = canvasRef.value
    if (!canvas || !engine?.camera) return null

    const settings = state.project.settings
    const intersects = engine?.getGroundPickTargets?.() ?? []
    let point =
      pickWorldPoint(clientX, clientY, canvas, engine.camera, intersects)
      ?? pickGroundPlanePoint(clientX, clientY, canvas, engine.camera)
    if (!point) return null

    const { gx, gz } = worldToGrid(point.x, point.z, settings)
    const offshore = isOffshoreGridCell(gx, gz, settings)
    if (!isInBounds(gx, gz, settings) && !(allowOffshore && offshore)) return null

    const cell = gridToWorld(gx, gz, settings)
    return {
      gx,
      gz,
      x: cell.x,
      z: cell.z,
      snapped: true,
      zone: offshore ? 'offshore' : 'land',
    }
  }

  function pickPoint(clientX, clientY) {
    const canvas = canvasRef.value
    if (!canvas || !engine?.camera) return null

    if (createTools.isWanderZoneEditing()) {
      const point = pickGridPoint(clientX, clientY, { allowOffshore: true })
      return enrichPointHeight(point, 'select')
    }

    const { activeTool, propSnapMode } = createTools.toolsState
    const isPropLike = PROP_LIKE_TOOLS.includes(activeTool)
    const snap = !isPropLike || propSnapMode !== 'free'
    const intersects = engine?.getGroundPickTargets?.() ?? []
    const point = pickPlacementPoint(
      clientX,
      clientY,
      canvas,
      engine.camera,
      state.project.settings,
      snap,
      isPropLike ? propSnapMode : 'center',
      intersects,
    )
    return enrichPointHeight(point, activeTool)
  }

  function rebuildGroundMesh() {
    if (!engine) return
    const isExplore = state.mode === 'explore'
    engine.buildGround(state.project.settings, {
      terrainCells: state.project.layers.terrain ?? [],
      exploreStyle: isExplore,
      roads: isExplore ? state.project.layers.roads : [],
    })
    if (isExplore) {
      engine.setGridVisible(false)
    } else {
      engine.clearGrassLayer()
      engine.setGridVisible(uiShell.uiState.gridVisible)
    }
    syncMirrorLine()
  }

  function applySkyFromSettings() {
    if (!engine) return
    const presetId = state.project.settings.sky?.preset ?? DEFAULT_SKY_PRESET_ID
    engine.applySky(presetId)
  }

  function onResize() {
    const canvas = canvasRef.value
    if (!canvas || !engine) return
    const parent = canvas.parentElement
    engine.resize(parent.clientWidth, parent.clientHeight)
  }

  function brushOptions() {
    const { toolsState } = createTools
    return {
      tool: toolsState.activeTool,
      manualPack: toolsState.selectedPack,
      manualAsset: toolsState.selectedAsset,
      manualRotY: toolsState.rotation,
      mirrorAxis: toolsState.mirrorAxis,
      settings: state.project.settings,
    }
  }

  function syncMirrorLine() {
    if (!engine) return
    engine.setMirrorAxis(createTools.toolsState.mirrorAxis, state.project.settings)
  }

  function handlePlacementFeedback(result) {
    if (result === 'success' && createTools.toolsState.activeTool === 'road') {
      return
    }
    const toastPayload = uiEffects.reportPlacement(result)
    if (toastPayload) {
      showToast(toastPayload.toast, toastPayload.type, toastPayload.duration)
    }
  }

  function onPointerDown(e) {
    const canvas = canvasRef.value
    touchCamera?.pointerDown(e.pointerId, e.clientX, e.clientY)

    if (touchCamera?.isMultiTouch()) {
      cancelActiveDrags()
      dragging = true
      return
    }

    if (state.mode === 'explore') {
      const isFps = explore.cameraMode.value === 'first'
      if ((e.button === 0 && isFps) || e.button === 1 || e.button === 2) {
        panDragging = true
        dragging = true
        lastX = e.clientX
        lastY = e.clientY
      }
      return
    }

    if (state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      const { toolsState } = createTools

      if (e.altKey && e.button === 0) {
        rotateDragging = true
        dragging = true
        lastX = e.clientX
        return
      }

      if (spacePanActive && (e.button === 0 || e.button === 1)) {
        panDragging = true
        dragging = true
        lastX = e.clientX
        lastY = e.clientY
        return
      }

      if (
        e.button === 0 &&
        point &&
        createTools.isRepositionPending() &&
        createTools.beginRepositionDrag(point)
      ) {
        moveDragging = true
        repositionDragStart = { clientX: e.clientX, clientY: e.clientY }
        activePointerId = e.pointerId
        canvas?.setPointerCapture(e.pointerId)
        updateGhost()
        return
      }

      if (e.button === 2 && createTools.selectItemContextAtPoint(point, e.clientX, e.clientY)) {
        updateGhost()
        return
      }

      if (
        e.button === 0 &&
        !e.shiftKey &&
        PLACEMENT_TOOLS.includes(toolsState.activeTool) &&
        createTools.selectExistingAtPoint(point, e.clientX, e.clientY)
      ) {
        updateGhost()
        return
      }

      const usesBrush =
        point &&
        (toolsState.activeTool === 'road' ||
          toolsState.activeTool === 'terrain' ||
          (toolsState.activeTool === 'erase' && e.button === 0))

      if (toolsState.activeTool === 'terrain' && e.button === 0 && point) {
        const result = terrainBrush.handlePointerDown(point, {
          ...brushOptions(),
          button: e.button,
          shiftKey: e.shiftKey,
        })
        if (result.handled) {
          createTools.clearSelection()
          activePointerId = e.pointerId
          canvas?.setPointerCapture(e.pointerId)
          updateGhost()
          return
        }
      }

      if (usesBrush || (toolsState.activeTool === 'road' && e.button === 2)) {
        const result = roadBrush.handlePointerDown(point, {
          ...brushOptions(),
          button: e.button,
          shiftKey: e.shiftKey,
        })
        if (result.handled) {
          if (result.kind !== 'line-anchor') {
            createTools.clearSelection()
          }
          activePointerId = e.pointerId
          canvas?.setPointerCapture(e.pointerId)
          updateGhost()
          return
        }
      }

      if (e.button === 0 && createTools.isWanderZoneEditing() && point) {
        wanderZoneDragging = true
        createTools.beginWanderPaintSession()
        createTools.setWanderShiftPreview(e.shiftKey)
        activePointerId = e.pointerId
        canvas?.setPointerCapture(e.pointerId)
        createTools.paintWanderCellAtPoint(point, e.shiftKey)
        createTools.setHoverPoint(point)
        updateGhost()
        return
      }

      if (e.button === 0 && point) {
        if (
          toolsState.activeTool === 'select' &&
          e.shiftKey &&
          !createTools.isMoveDragging()
        ) {
          areaSelectDragging = true
          activePointerId = e.pointerId
          canvas?.setPointerCapture(e.pointerId)
          createTools.startAreaSelect(point)
          updateGhost()
          return
        }

        if (toolsState.activeTool === 'select' && createTools.tryStartMoveDrag(point, e.clientX, e.clientY)) {
          moveDragging = true
          activePointerId = e.pointerId
          canvas?.setPointerCapture(e.pointerId)
          updateGhost()
          return
        }

        if (
          e.button === 0 &&
          !e.shiftKey &&
          point &&
          PLACEMENT_BRUSH_TOOLS.has(toolsState.activeTool) &&
          createTools.handlePlacementBrushDown(point)
        ) {
          activePointerId = e.pointerId
          canvas?.setPointerCapture(e.pointerId)
          updateGhost()
          return
        }

        if (
          !e.shiftKey &&
          [...PLACEMENT_TOOLS].includes(
            toolsState.activeTool,
          ) &&
          createTools.selectExistingAtPoint(point, e.clientX, e.clientY)
        ) {
          updateGhost()
          return
        }

        if (toolsState.activeTool === 'select') {
          createTools.selectAtPoint(point, e.clientX, e.clientY)
          updateGhost()
          return
        }

        if (!point) {
          updateGhost()
          return
        }

        const placementResult = createTools.applyAtPoint(point, {
          shiftKey: e.shiftKey,
          clientX: e.clientX,
          clientY: e.clientY,
        })
        handlePlacementFeedback(placementResult)
        updateGhost()
        return
      }
    }

    if (e.button !== 1 && e.button !== 2) return
    panDragging = true
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
  }

  function onPointerUp(e) {
    const canvas = canvasRef.value
    const remaining = touchCamera?.pointerUp(e.pointerId) ?? 0

    if (wanderZoneDragging) {
      wanderZoneDragging = false
      createTools.endWanderPaintSession()
      updateGhost()
    }
    if (areaSelectDragging) {
      areaSelectDragging = false
      updateGhost()
    }
    if (moveDragging) {
      const point = pickPoint(e.clientX, e.clientY)
      const wasReposition = createTools.isRepositionPending()
      if (point) {
        let moved = false
        if (wasReposition && repositionDragStart) {
          const dx = e.clientX - repositionDragStart.clientX
          const dy = e.clientY - repositionDragStart.clientY
          const isClick = Math.hypot(dx, dy) < REPOSITION_CLICK_THRESHOLD
          moved = isClick
            ? createTools.commitRepositionAtPoint(point)
            : createTools.commitMoveDrag(point)
        } else {
          moved = createTools.commitMoveDrag(point)
        }
        if (wasReposition) {
          if (moved) {
            showToast('Konum güncellendi', 'success', 1800)
          } else {
            showToast('Buraya taşınamaz', 'error', 2200)
          }
        }
      } else {
        createTools.cancelMoveDrag()
      }
      moveDragging = false
      repositionDragStart = null
      updateGhost()
    }
    if (activePointerId === e?.pointerId) {
      const roadEnded = roadBrush.handlePointerUp()
      const terrainEnded = terrainBrush.handlePointerUp()
      const placementEnded = createTools.handlePlacementBrushUp()
      if (roadEnded || terrainEnded.wasBrushing || placementEnded) {
        if (terrainEnded.wasBrushing) {
          engine?.finalizeGroundTerrainNormals?.()
        }
        flushPendingSceneSync({ immediate: true })
      }
      canvas?.releasePointerCapture(e.pointerId)
      activePointerId = null
    }
    panDragging = false
    rotateDragging = false
    dragging = false
    if (remaining === 0) {
      touchCamera?.reset()
    }
  }

  function onPointerMove(e) {
    if (!canvasRef.value || !engine) return

    if (touchCamera?.pointerCount() > 0) {
      const handled = touchCamera.pointerMove(e.pointerId, e.clientX, e.clientY)
      if (handled) {
        if (roadBrush.isBrushing() || terrainBrush.isBrushing()) {
          roadBrush.handlePointerUp()
          terrainBrush.handlePointerUp()
        }
        return
      }
    }

    if (terrainBrush.isBrushing() && state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      if (point) {
        const changedCells = terrainBrush.handlePointerMove(point)
        createTools.setHoverPoint(point)
        if (changedCells?.length && engine) {
          const status = engine.updateGroundTerrainVertices(
            state.project.layers.terrain ?? [],
            changedCells,
          )
          if (status === 'needs-rebuild') pendingGroundRebuild = true
        }
        scheduleUpdateGhost()
      } else {
        scheduleUpdateGhost()
      }
      return
    }

    if (roadBrush.isBrushing() && state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      if (point) {
        roadBrush.handlePointerMove(point, brushOptions())
        createTools.setHoverPoint(point)
        scheduleUpdateGhost()
      } else {
        scheduleUpdateGhost()
      }
      return
    }

    if (createTools.isPlacementBrushing() && state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      if (point) {
        createTools.handlePlacementBrushMove(point)
        createTools.setHoverPoint(point)
        scheduleUpdateGhost()
      } else {
        scheduleUpdateGhost()
      }
      return
    }

    if (wanderZoneDragging && state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      createTools.setWanderShiftPreview(e.shiftKey)
      if (point) {
        createTools.paintWanderCellAtPoint(point, e.shiftKey)
        createTools.setHoverPoint(point)
      }
      scheduleUpdateGhost()
      return
    }

    if (areaSelectDragging && state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      if (point) {
        createTools.updateAreaSelect(point)
        createTools.setHoverPoint(point)
      }
      scheduleUpdateGhost()
      return
    }

    if (moveDragging && state.mode === 'create') {
      const point = pickPoint(e.clientX, e.clientY)
      if (point) createTools.setHoverPoint(point)
      scheduleUpdateGhost()
      return
    }

    if (rotateDragging && engine && state.mode === 'create') {
      engine.rotateYaw(-(e.clientX - lastX) * 0.005)
      lastX = e.clientX
      persistCameraIfCreate()
      return
    }

    if (panDragging && engine) {
      if (state.mode === 'explore') {
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

      const dx = (e.clientX - lastX) * 0.03
      const dz = (e.clientY - lastY) * 0.03
      lastX = e.clientX
      lastY = e.clientY
      engine.pan(dx, dz)
      persistCameraIfCreate()
      return
    }

    if (state.mode !== 'create' || !engine) {
      createTools.clearHoverCell()
      scheduleUpdateGhost()
      return
    }

    const point = pickPoint(e.clientX, e.clientY)
    createTools.setTerrainLowerPreview(e.shiftKey)
    if (createTools.isWanderZoneEditing()) {
      createTools.setWanderShiftPreview(e.shiftKey)
    }
    createTools.setHoverPoint(point)
    scheduleUpdateGhost()
  }

  function onPointerLeave() {
    createTools.clearHoverCell()
    scheduleUpdateGhost()
  }

  function onWheel(e) {
    e.preventDefault()
    if (state.mode === 'create' && e.shiftKey) {
      engine?.adjustPitch(e.deltaY * 0.002)
      persistCameraIfCreate()
      return
    }
    if (state.mode === 'explore') {
      explore.adjustZoom(e.deltaY * 0.04)
      return
    }
    engine?.zoom(e.deltaY * 0.04)
    persistCameraIfCreate()
  }

  function onContextMenu(e) {
    e.preventDefault()
  }

  function onKeyDown(e) {
    if (e.target.matches('input, textarea, select')) return

    if (e.code === 'Escape') {
      if (state.mode === 'create' && createTools.isWanderZoneEditing()) {
        createTools.cancelWanderZoneEdit()
        updateGhost()
        return
      }
      if (state.mode === 'create' && createTools.isRepositionPending()) {
        createTools.cancelReposition()
        updateGhost()
        return
      }
      if (state.mode === 'create' && createTools.toolsState.selectedItem) {
        createTools.clearSelection()
        updateGhost()
        return
      }
      uiShell.closeOverlays()
      return
    }

    if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) {
      e.preventDefault()
      uiShell.toggleHelp()
      return
    }

    if (e.code === 'Space' && state.mode === 'create') {
      spacePanActive = true
      e.preventDefault()
    }

    if (state.mode === 'explore' && e.code === 'F5') {
      e.preventDefault()
      const next = explore.cycleCameraMode()
      showToast(`Kamera: ${next.label}`)
      return
    }

    if (
      state.mode === 'explore' &&
      ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
        e.code,
      )
    ) {
      e.preventDefault()
    }

    if (state.mode === 'create') {
      if (e.code === 'Home') {
        e.preventDefault()
        engine?.resetCamera(state.project.settings)
        persistCameraIfCreate()
        return
      }
      if (e.code === 'KeyF') {
        e.preventDefault()
        const hover = createTools.toolsState.hoverCell
        if (hover && engine) {
          engine.focusTarget(hover.x, 0, hover.z)
          persistCameraIfCreate()
        }
        return
      }
      if (e.code === 'KeyH') {
        e.preventDefault()
        const visible = uiShell.toggleGrid()
        engine?.setGridVisible(visible)
        return
      }
      if (e.code === 'KeyK') {
        e.preventDefault()
        uiShell.toggleCameraToolbar()
        return
      }
      if (e.code === 'KeyU') {
        e.preventDefault()
        uiShell.toggleCreateHud()
        return
      }

      createTools.handleKeyDown(e)
      if (
        e.code === 'KeyR' ||
        e.code === 'KeyG' ||
        e.code === 'KeyX' ||
        e.code === 'Delete' ||
        e.code === 'KeyV' ||
        e.code === 'KeyC'
      ) {
        updateGhost()
      }
      if (e.code === 'KeyX') {
        syncMirrorLine()
      }
    }
  }

  function onKeyUp(e) {
    if (e.code === 'Space') {
      spacePanActive = false
      if ((panDragging || rotateDragging || moveDragging) && !e.buttons) {
        panDragging = false
        rotateDragging = false
        moveDragging = false
        repositionDragStart = null
        dragging = false
        createTools.cancelMoveDrag()
      }
    }
  }

  function updateGhost() {
    if (!ghost || state.mode === 'explore') {
      if (ghost) {
        ghost.update({ visible: false, tool: 'road', pack: '', asset: '', x: 0, z: 0, settings: state.project.settings })
      }
      return
    }

    const wanderGhost = createTools.getWanderZoneGhostOptions(
      state.project.settings,
      createTools.toolsState.hoverCell,
    )
    if (wanderGhost) {
      const token = ++ghostToken
      ghost.update(wanderGhost)
      if (token !== ghostToken) return
      return
    }

    const areaRect = createTools.toolsState.areaSelectRect
    if (areaRect && createTools.toolsState.activeTool === 'select') {
      const token = ++ghostToken
      ghost.update({
        visible: false,
        tool: 'select-area',
        pack: '',
        asset: '',
        x: 0,
        z: 0,
        y: areaRectTerrainY(areaRect),
        settings: state.project.settings,
        areaRect,
      })
      if (token !== ghostToken) return
      return
    }

    const rectPreview = roadBrush.brushState.rectPreview
    if (rectPreview && createTools.toolsState.activeTool === 'erase') {
      const token = ++ghostToken
      ghost.update({
        visible: false,
        tool: 'erase',
        pack: '',
        asset: '',
        x: 0,
        z: 0,
        y: areaRectTerrainY(rectPreview),
        settings: state.project.settings,
        areaRect: rectPreview,
      })
      if (token !== ghostToken) return
      return
    }

    const hover = createTools.toolsState.hoverCell
    if (createTools.isRepositionPending() && hover) {
      const repositionGhost = createTools.getRepositionPreviewGhostOptions(
        state.project.settings,
        hover,
      )
      if (repositionGhost) {
        const token = ++ghostToken
        ghost.update(repositionGhost)
        if (token !== ghostToken) return
        return
      }
    }

    if (createTools.isMoveDragging() && hover) {
      const moveGhost = createTools.getMovePreviewGhostOptions(
        state.project.settings,
        hover,
      )
      if (moveGhost) {
        const token = ++ghostToken
        ghost.update(moveGhost)
        if (token !== ghostToken) return
        return
      }
    }

    const selectionGhost =
      !createTools.isRepositionPending() &&
      createTools.getSelectionGhostOptions(state.project.settings)
    if (selectionGhost && !createTools.isMoveDragging()) {
      const token = ++ghostToken
      ghost.update(selectionGhost)
      if (token !== ghostToken) return
      return
    }

    const token = ++ghostToken
    const { toolsState } = createTools
    const tool = toolsState.activeTool

    const showGhost =
      hover &&
      tool !== 'select' &&
      (PLACEMENT_TOOLS.includes(tool) || tool === 'erase' || tool === 'terrain')

    const mirror = hover ? createTools.getMirrorGhostOptions(hover) : null
    const nextTerrainLevel = hover
      ? Math.min(
          MAX_TERRAIN_LEVEL,
          Math.max(0, getTerrainLevelAt(hover.gx, hover.gz) + (terrainBrush.brushState.lowerMode || toolsState.terrainLowerPreview ? -1 : 1)),
        )
      : 0

    ghost.update({
      visible: showGhost,
      tool,
      pack: toolsState.selectedPack,
      asset: toolsState.selectedAsset,
      gx: hover?.gx,
      gz: hover?.gz,
      x: hover?.x,
      y: hover?.y ?? 0,
      z: hover?.z,
      rotY: toolsState.rotation,
      settings: state.project.settings,
      canPlace: hover ? createTools.canPlaceAtPoint(hover) : false,
      placementMode: PROP_LIKE_TOOLS.includes(tool) ? 'prop' : 'grid',
      placementScale: toolsState.placementScale,
      mirror,
      terrainLower: terrainBrush.brushState.lowerMode || toolsState.terrainLowerPreview,
      terrainLevel: nextTerrainLevel,
    })

    if (token !== ghostToken) return
  }

  async function enterExploreMode() {
    if (!engine) return
    try {
      await explore.enterExplore(engine, state.project, state.project.player.characterId)
    } catch (err) {
      error.value = err.message ?? 'Gezinti modu başlatılamadı.'
      setMode('create')
    }
  }

  function exitExploreMode() {
    explore.exitExplore()
    rebuildGroundMesh()
    const saved = loadCreateCamera()
    if (saved) engine?.applyCameraSnapshot(saved)
    updateGhost()
  }

  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05)
    if (state.mode === 'explore') {
      explore.update(dt)
    }

    if (engine) {
      const target = engine.cameraState.target
      minimapCamera.value = {
        x: target.x,
        z: target.z,
        distance: engine.cameraState.distance,
        yaw: engine.cameraState.yaw,
      }
      if (state.mode === 'create') {
        cameraControls.syncCameraState(engine.cameraState)
      }
      renderer?.updateCulling?.(target, state.project.settings, engine.cameraState.distance * 1.35 + 16)
    }

    renderer?.updateRotatingProps?.(dt)

    if (state.mode === 'explore') {
      minimapPlayer.value = explore.getPlayerPosition()
    } else {
      minimapPlayer.value = null
    }

    engine?.render()
    raf = requestAnimationFrame(loop)
  }

  async function syncScene({ initial = false, rebuildGround = false, terrainCells, roadHintIds } = {}) {
    if (!renderer) return
    error.value = null
    if (initial) {
      loading.value = true
      loadingStage.value = 'scene'
      loadingProgress.value = 0.58
    } else {
      sceneSyncing.value = true
    }
    const syncPhase = initial && loadSession
      ? loadSession.phase('Harita senkronizasyonu', countProjectItems(state.project))
      : null
    try {
      // İlk yüklemede zemin onMounted içinde zaten oluşturuluyor; tekrar çağırmak ~15s kaybettiriyordu.
      if (rebuildGround && !initial) {
        rebuildGroundMesh()
      }
      await renderer.sync(state.project, {
        terrainChangedCells: terrainCells?.length ? terrainCells : null,
        roadHintIds: roadHintIds?.length ? roadHintIds : null,
        onProgress: initial
          ? (ratio) => {
              loadingProgress.value = 0.58 + ratio * 0.42
            }
          : null,
        loadSession: initial ? loadSession : null,
      })
      await updateRepositionVisual()
      updateGhost()
      if (initial) {
        loadingProgress.value = 1
        loadingStage.value = 'done'
      }
      syncPhase?.end()
    } catch (err) {
      syncPhase?.end({ error: err.message })
      error.value = err.message ?? 'Sahne senkronizasyonu başarısız.'
      console.error(err)
    } finally {
      if (initial) {
        loading.value = false
      } else {
        sceneSyncing.value = false
      }
    }
  }

  function updateRepositionVisual() {
    if (!renderer?.setRepositionDim) return

    const { repositionPending, selectedItem } = createTools.toolsState
    if (!repositionPending || !selectedItem) {
      renderer.clearAllRepositionDim()
      return
    }

    const renderLayer = ITEM_LAYER_TO_RENDER[selectedItem.layer]
    const item = state.project.layers[renderLayer]?.find((entry) => entry.id === selectedItem.id)
    if (!item) {
      renderer.clearAllRepositionDim()
      return
    }

    renderer.setRepositionDim(
      selectedItem.id,
      item,
      renderLayer,
      state.project.settings,
      true,
    )
  }

  watch(
    () => createTools.toolsState.rotation,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => createTools.toolsState.selectedAsset,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => createTools.toolsState.placementScale,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => createTools.toolsState.activeTool,
    () => {
      roadBrush.clearLineAnchor()
      createTools.clearPlacementLineAnchor()
      scheduleUpdateGhost()
    },
  )

  watch(
    () => createTools.toolsState.propSnapMode,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => createTools.toolsState.mirrorAxis,
    () => {
      syncMirrorLine()
      scheduleUpdateGhost()
    },
  )

  watch(
    () => createTools.toolsState.wanderZoneEditing,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => createTools.toolsState.areaSelectRect,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => [
      createTools.toolsState.repositionPending,
      createTools.toolsState.selectedItem?.id,
      createTools.toolsState.selectedItem?.layer,
    ],
    () => {
      updateRepositionVisual()
    },
  )

  watch(
    () => createTools.toolsState.selectedItem,
    () => scheduleUpdateGhost(),
  )

  watch(
    () => uiShell.uiState.layerVisibility,
    (visibility) => {
      renderer?.setLayerVisibility(visibility)
    },
    { deep: true },
  )

  watch(
    () => uiShell.uiState.gridVisible,
    (visible) => {
      if (state.mode === 'explore') return
      engine?.setGridVisible(visible)
    },
  )

  watch(
    () => state.mode,
    async (mode, prev) => {
      if (prev && mode !== prev) {
        uiEffects.triggerModeTransition(mode)
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          engine?.pulseCameraZoom()
        }
      }

      if (mode === 'explore' && prev === 'create') {
        if (engine) saveCreateCamera(engine.getCameraSnapshot())
        engine?.setShadowPerformanceMode?.('explore')
        renderer?.setSceneVisibilityMode?.('play')
        rebuildGroundMesh()
        await enterExploreMode()
      } else if (mode === 'create' && prev === 'explore') {
        engine?.setShadowPerformanceMode?.('create')
        renderer?.setSceneVisibilityMode?.('edit')
        exitExploreMode()
      } else {
        updateGhost()
      }
    },
  )

  onMounted(async () => {
    const canvas = canvasRef.value
    if (!canvas) return

    const projectCounts = countProjectItems(state.project)
    loadSession = createLoadSession('CityEngine başlatma', {
      gameId: state.project?.meta?.title ?? 'bilinmiyor',
      ...projectCounts,
    })
    setActiveLoadSession(loadSession)
    loadSession.log(`Proje parça sayısı: ${projectCounts.total} (yol:${projectCounts.roads}, bina:${projectCounts.buildings}, dekor:${projectCounts.props})`)

    loading.value = true
    loadingStage.value = 'assets'
    loadingProgress.value = 0

    const mergedAssets = mergeAssetLists(
      PRELOAD_ASSETS,
      collectProjectAssets(state.project),
    )
    const preloadPhase = loadSession.phase('Ön yükleme modelleri', {
      defaultCount: PRELOAD_ASSETS.length,
      projectUnique: mergedAssets.length - PRELOAD_ASSETS.length,
      total: mergedAssets.length,
    })
    try {
      await preloadAssets(mergedAssets, (ratio) => {
        loadingProgress.value = ratio * 0.55
      })
      preloadPhase.end()
    } catch (err) {
      preloadPhase.end({ error: err.message })
      loadSession.warn('Ön yükleme kısmen başarısız', err)
      console.warn('Ön yükleme kısmen başarısız:', err)
    }

    const enginePhase = loadSession.phase('Three.js motoru')
    engine = createEngine(canvas)
    engine.setShadowPerformanceMode('create')
    engine.setGridVisible(uiShell.uiState.gridVisible)
    await engine.applySky(state.project.settings.sky?.preset ?? DEFAULT_SKY_PRESET_ID)
    syncMirrorLine()
    enginePhase.end()

    const rendererPhase = loadSession.phase('Renderer ve araçlar')
    renderer = createCityRenderer(engine.cityRoot)
    createTools.setScreenItemPicker((clientX, clientY) =>
      renderer.pickItem(clientX, clientY, canvas, engine.camera, state.project.settings),
    )
    ghost = createPlacementGhost(engine.cityRoot)
    rendererPhase.end()

    touchCamera = createTouchCameraController({
      onPan: (dx, dz) => {
        if (!engine) return
        if (state.mode === 'explore') return
        engine.pan(dx, dz)
        persistCameraIfCreate()
      },
      onZoom: (delta) => {
        if (!engine) return
        if (state.mode === 'explore') {
          explore.adjustZoom(delta)
          return
        }
        engine.zoom(delta)
        persistCameraIfCreate()
      },
      onRotate: (delta) => {
        if (!engine) return
        if (state.mode === 'create') {
          engine.rotateYaw(delta)
          persistCameraIfCreate()
        } else if (state.mode === 'explore') {
          explore.rotateCamera(delta)
        }
      },
    })

    const restoredCamera = loadCreateCamera()
    const cameraRestored = restoredCamera ? engine.applyCameraSnapshot(restoredCamera) : false

    cameraControls.registerCameraControls({
      pan: (dx, dz) => {
        engine.pan(dx, dz)
        persistCameraIfCreate()
      },
      zoom: (delta) => {
        engine.zoom(delta)
        persistCameraIfCreate()
      },
      rotateYaw: (delta) => {
        engine.rotateYaw(delta)
        persistCameraIfCreate()
      },
      adjustPitch: (delta) => {
        engine.adjustPitch(delta)
        persistCameraIfCreate()
      },
      setPitch: (value) => {
        engine.setPitch(value)
        persistCameraIfCreate()
      },
      setYaw: (value) => {
        engine.setYaw(value)
        persistCameraIfCreate()
      },
      resetCamera: () => {
        engine.resetCamera(state.project.settings)
        persistCameraIfCreate()
      },
      focusHover: () => {
        const hover = createTools.toolsState.hoverCell
        if (hover) {
          engine.focusTarget(hover.x, 0, hover.z, { smooth: true })
          persistCameraIfCreate()
        }
      },
    })

    const groundPhase = loadSession.phase('Zemin oluşturma', {
      width: state.project.settings.width,
      depth: state.project.settings.depth,
      terrainCells: state.project.layers.terrain?.length ?? 0,
    })
    engine.buildGround(state.project.settings, {
      resetCamera: !cameraRestored,
      terrainCells: state.project.layers.terrain ?? [],
    })
    engine.clearGrassLayer()
    engine.setGridVisible(uiShell.uiState.gridVisible)
    syncMirrorLine()
    groundPhase.end()

    const uiPhase = loadSession.phase('UI ve olay dinleyicileri')
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    onResize()
    clock.start()
    loop()
    uiPhase.end()

    await syncScene({ initial: true })
    loadSession.summary()
    setActiveLoadSession(null)
    loadSession = null
  })

  watch(
    () => getLayersRevision(),
    () => {
      scheduleLayerSync()
    },
  )

  watch(
    () => state.settingsRevision,
    () => {
      applySkyFromSettings()
      scheduleLayerSync({ rebuildGround: true })
    },
  )

  watch(
    () => globalSettings.character.scale,
    (scale) => {
      if (state.mode === 'explore') {
        explore.applyCharacterScale(scale)
      }
    },
  )

  function focusWorldPoint(x, z) {
    if (!engine || state.mode !== 'create') return
    engine.focusTarget(x, 0, z, { smooth: true })
    persistCameraIfCreate()
  }

  async function reloadExploreCharacter() {
    if (state.mode !== 'explore' || !engine) return
    await explore.reloadCharacter(state.project.player.characterId, state.project)
  }

  onUnmounted(() => {
    if (syncTimer) clearTimeout(syncTimer)
    if (cameraSaveTimer) clearTimeout(cameraSaveTimer)
    if (ghostRaf) cancelAnimationFrame(ghostRaf)
    cancelAnimationFrame(raf)
    const canvas = canvasRef.value
    canvas?.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    window.removeEventListener('pointermove', onPointerMove)
    canvas?.removeEventListener('pointerleave', onPointerLeave)
    canvas?.removeEventListener('wheel', onWheel)
    canvas?.removeEventListener('contextmenu', onContextMenu)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    explore.dispose()
    cameraControls.unregisterCameraControls()
    touchCamera?.reset()
    touchCamera = null
    ghost?.dispose()
    renderer?.dispose()
    engine?.dispose()
    ghost = null
    renderer = null
    engine = null
  })

  return {
    loading,
    loadingProgress,
    loadingStage,
    sceneSyncing,
    error,
    exploreLoading: explore.exploreLoading,
    exploreCameraModeLabel: explore.cameraModeLabel,
    reloadExploreCharacter,
    focusWorldPoint,
    projectWorldPoint,
    minimapCamera,
    minimapPlayer,
  }
}
