import { reactive, readonly, computed, ref, watch } from 'vue'
import { useCityStore } from '../stores/cityStore.js'
import { nextRotation, prevRotation, isWorldInBounds, isInBounds, gridToWorld, worldToGrid } from '../lib/city/gridUtils.js'
import { isOffshoreGridCell, OFFSHORE_ITEM_Y, isEditableGridCell, isPropWorldAllowed, resolvePropSurfaceY, isOffshoreWorldPoint } from '../lib/city/offshoreGrid.js'
import {
  getRotatedAnchor,
  getRotatedFootprint,
  resolveBuildingSpan,
} from '../lib/city/footprintUtils.js'
import {
  clampPlacementScale,
  stepPlacementScale as bumpPlacementScale,
  scaleToFootprint,
  footprintCellsFromScale,
  readItemScale,
  spanCellsToFootprint,
} from '../lib/city/placementSpan.js'
import { nextPropSnapMode, PROP_SNAP_LABELS } from '../lib/city/propSnap.js'
import { itemBlocksPlayer, itemCreatureSoundEnabled, itemHiddenInPlay, itemPickable, itemPlayerApproachEnabled } from '../lib/city/itemSettings.js'
import {
  extractRegion,
  buildPastePayload,
  snippetToJson,
  parseSnippetJson,
} from '../lib/city/regionSnippet.js'
import {
  mirrorGridCell,
  mirrorGridPoint,
  mirrorRotationY,
  mirrorWorldPoint,
  nextMirrorAxis,
  MIRROR_LABELS,
} from '../lib/city/mirrorUtils.js'
import {
  normalizeWanderCells,
  wanderCellKey,
  wanderCellsToGridList,
  worldToWanderCellKey,
} from '../lib/city/wanderZone.js'
import { isAnimatedAsset } from '../lib/modelLibrary/animatedAssets.js'
import { isTintableAsset } from '../lib/modelLibrary/tintableAssets.js'
import { buildTerrainMap, terrainHeightAtCell, sampleTerrainHeight } from '../lib/city/terrainUtils.js'
import { getAsset } from '../data/asset-catalog.js'
import {
  PLACEMENT_TOOLS,
  PROP_LIKE_TOOLS,
  getAssetsForTool,
  findAssetInTool,
  placementToolMatchesLayer,
  classifyAssetTool,
} from '../data/toolAssets.js'
import { filterModelsBySearch, getAssetDisplayLabel } from '../lib/modelLibrary/assetLabels.js'
import { modelKey } from '../lib/modelLibrary/modelKeys.js'
import { bresenhamCells, cellKey } from '../lib/city/gridLine.js'
import { pushRecent, resolveRecentAssets } from '../lib/city/assetPaletteStorage.js'
import { useModelLibraryStore } from '../stores/modelLibraryStore.js'
import {
  resolvePlacementDefaults,
  buildPlacementExtras,
  categoryAllowsPlacementOnRoad,
} from '../lib/modelLibrary/placementDefaults.js'
import {
  findModelSetForAsset,
  findAllSetsForAsset,
  getModelSetById,
  getStageAt,
  sortStages,
  MODEL_SET_MODE_ID,
} from '../lib/modelLibrary/modelSets.js'

const UTILITY_TOOLS = ['erase', 'select', 'terrain']

const toolsState = reactive({
  activeTool: 'prop',
  activeCategoryId: null,
  selectedPack: 'road-tiles',
  selectedAsset: 'roadTile_042',
  rotation: 0,
  hoverCell: null,
  propSnapMode: 'center',
  paletteSearch: '',
  paletteView: 'all',
  selectedItem: null,
  placementLineAnchor: null,
  moveDrag: null,
  repositionPending: false,
  areaSelectRect: null,
  wanderZoneEditing: false,
  wanderShiftPreview: false,
  mirrorAxis: 'off',
  terrainLowerPreview: false,
  placementScale: 1,
  activeStageIndex: 0,
  activeModelSetId: null,
})

const toolRotations = { road: 0, building: 0, prop: 0, vehicle: 0, figur: 0, food: 0 }
const toolPlacement = {
  road: { scale: 1 },
  building: { scale: 1 },
  prop: { scale: 1 },
  vehicle: { scale: 1 },
  figur: { scale: 1 },
  food: { scale: 1 },
}

let clipboard = null
let regionClipboard = null

const PLACEMENT_BRUSH_TOOLS = ['building', 'prop', 'vehicle', 'figur', 'food']

let placementBrushing = false
let lastPlacementCell = null
let paintedPlacementKeys = null
let lastWanderPaintKey = null

const favoritesVersion = ref(0)

let screenItemPicker = null

export function useCreateTools() {
  const {
    state,
    addRoad,
    updateRoad,
    addBuilding,
    updateBuilding,
    addProp,
    updateProp,
    removeRoad,
    removeBuilding,
    removeProp,
    findRoadAt,
    findBuildingAt,
    findPropNear,
    findItemById,
    canPlaceBuilding,
    canPlaceOffshoreBuilding,
    addOffshoreBuilding,
    updateOffshoreBuilding,
    findOffshoreBuildingAt,
    removeAtPoint,
    hasEraseTarget,
    undo,
    redo,
    canUndo,
    canRedo,
    beginHistoryBatch,
    endHistoryBatch,
    pasteRegionItems,
    addRoadsBatch,
  } = useCityStore()

  const {
    state: libraryState,
    isFavorite,
    toggleFavorite,
    resolveFavoriteAssets,
    isModelHidden,
    categories: modelCategories,
    getCategoryById,
    resolveCategoryAssets,
    getModelEntry,
    modelSets,
  } = useModelLibraryStore()

  const isModelSetMode = () => toolsState.activeCategoryId === MODEL_SET_MODE_ID

  const activeCategory = computed(() => {
    if (isModelSetMode()) return null
    return toolsState.activeCategoryId ? getCategoryById(toolsState.activeCategoryId) : null
  })

  const activeModelSet = computed(() => {
    void libraryState.library?.updatedAt
    if (!toolsState.activeModelSetId || !libraryState.library) return null
    return getModelSetById(libraryState.library, toolsState.activeModelSetId)
  })

  const categoriesById = computed(
    () => new Map(modelCategories.value.map((c) => [c.id, c])),
  )

  function inferPlacementTool(pack, assetId) {
    const entry = getModelEntry(pack, assetId)
    const categoryIds = entry?.categoryIds ?? []
    for (const categoryId of categoryIds) {
      const cat = getCategoryById(categoryId)
      if (cat?.placementType) return cat.placementType
    }
    const asset = getAsset(pack, assetId)
    if (!asset) return 'prop'
    return classifyAssetTool(asset) ?? 'prop'
  }

  function resolvePlacementAsset() {
    const library = libraryState.library
    const pack = toolsState.selectedPack
    const assetId = toolsState.selectedAsset

    if (toolsState.activeModelSetId && library) {
      const set = getModelSetById(library, toolsState.activeModelSetId)
      if (set) {
        const stage = getStageAt(set, toolsState.activeStageIndex)
        if (stage) {
          const stages = sortStages(set.stages)
          const stageIndex = stages.findIndex(
            (s) => s.pack === stage.pack && s.assetId === stage.assetId,
          )
          return {
            pack: stage.pack,
            asset: stage.assetId,
            modelSetId: set.id,
            stageIndex: stageIndex >= 0 ? stageIndex : toolsState.activeStageIndex,
          }
        }
      }
    }

    const match = library ? findModelSetForAsset(library, pack, assetId) : null

    if (!match) {
      return { pack, asset: assetId, modelSetId: null, stageIndex: null }
    }

    const stage = getStageAt(match.set, toolsState.activeStageIndex)
    if (!stage) {
      return {
        pack,
        asset: assetId,
        modelSetId: match.set.id,
        stageIndex: toolsState.activeStageIndex,
      }
    }

    const stages = sortStages(match.set.stages)
    const stageIndex = stages.findIndex(
      (s) => s.pack === stage.pack && s.assetId === stage.assetId,
    )

    return {
      pack: stage.pack,
      asset: stage.assetId,
      modelSetId: match.set.id,
      stageIndex: stageIndex >= 0 ? stageIndex : toolsState.activeStageIndex,
    }
  }

  function syncStageIndexForSelection(pack, assetId) {
    const library = libraryState.library
    if (!library) {
      toolsState.activeStageIndex = 0
      return
    }
    if (toolsState.activeModelSetId) {
      const set = getModelSetById(library, toolsState.activeModelSetId)
      if (set) {
        const stages = sortStages(set.stages)
        const stageIndex = stages.findIndex((s) => s.pack === pack && s.assetId === assetId)
        toolsState.activeStageIndex = stageIndex >= 0 ? stageIndex : set.defaultStageIndex ?? 0
        return
      }
    }
    const match = findModelSetForAsset(library, pack, assetId)
    toolsState.activeStageIndex = match ? match.stageIndex : 0
  }

  function placementAssetFields(extra = {}) {
    const resolved = resolvePlacementAsset()
    return {
      pack: resolved.pack,
      asset: resolved.asset,
      ...extra,
      ...placementExtras(),
    }
  }

  function getPlacementContext() {
    const resolved = resolvePlacementAsset()
    const category = activeCategory.value
    const modelEntry = getModelEntry(resolved.pack, resolved.asset)
    const defaults = resolvePlacementDefaults({
      category,
      modelEntry,
      categoryId: isModelSetMode() ? null : toolsState.activeCategoryId,
      library: libraryState.library,
      pack: resolved.pack,
      assetId: resolved.asset,
      stageIndex: resolved.stageIndex ?? toolsState.activeStageIndex,
      modelSetId: resolved.modelSetId ?? toolsState.activeModelSetId ?? undefined,
    })
    return {
      defaults,
      extras: buildPlacementExtras(defaults),
      category,
      resolved,
    }
  }

  function buildingPlacementOptions() {
    const { category } = getPlacementContext()
    return {
      allowOnRoad: categoryAllowsPlacementOnRoad(category),
      categoriesById: categoriesById.value,
    }
  }

  function canPlaceBuildingHere(gx, gz, asset, rotY, excludeId = null, span = null) {
    return canPlaceBuilding(gx, gz, asset, rotY, excludeId, span, buildingPlacementOptions())
  }

  function placementExtras() {
    return getPlacementContext().extras
  }

  function applyDefaultScaleForSelection() {
    const { defaults } = getPlacementContext()
    if (defaults.defaultScale && defaults.defaultScale !== 1) {
      applyPlacementScaleToState(defaults.defaultScale)
    }
  }

  const categoryAssets = computed(() => {
    void libraryState.library?.updatedAt
    void libraryState.library?.hiddenKeys
    if (isModelSetMode()) return []
    if (!toolsState.activeCategoryId) return []
    return resolveCategoryAssets(toolsState.activeCategoryId)
  })

  const displayedModelSets = computed(() => {
    void libraryState.library?.updatedAt
    const search = toolsState.paletteSearch.trim().toLowerCase()
    let sets = modelSets.value ?? []
    if (search) {
      sets = sets.filter((set) => {
        const name = (set.name ?? '').toLowerCase()
        const desc = (set.description ?? '').toLowerCase()
        return name.includes(search) || desc.includes(search)
      })
    }
    return sets
  })

  const allowedAssetKeysForTool = computed(() => {
    void libraryState.library?.hiddenKeys
    if (isModelSetMode() && toolsState.activeModelSetId) {
      const resolved = resolvePlacementAsset()
      return new Set([modelKey(resolved.pack, resolved.asset)])
    }
    if (toolsState.activeCategoryId && !isModelSetMode()) {
      return new Set(categoryAssets.value.map((asset) => modelKey(asset.pack, asset.id)))
    }
    return new Set(
      visibleAssetsForTool(toolsState.activeTool).map((asset) => modelKey(asset.pack, asset.id)),
    )
  })

  const isCreateMode = computed(() => state.mode === 'create')

  function visibleAssetsForTool(tool) {
    return getAssetsForTool(tool).filter((a) => !isModelHidden(a.pack, a.id))
  }

  const fullToolAssets = computed(() => {
    if (isModelSetMode()) return []
    if (toolsState.activeCategoryId) return categoryAssets.value
    return visibleAssetsForTool(toolsState.activeTool)
  })

  const categoryFilteredAssets = computed(() => fullToolAssets.value)

  function selectDefaultAssetForTool(tool) {
    const assets = visibleAssetsForTool(tool)
    const current = assets.find(
      (a) => a.pack === toolsState.selectedPack && a.id === toolsState.selectedAsset,
    )
    const pick = current ?? assets[0]
    if (pick) {
      toolsState.selectedPack = pick.pack
      toolsState.selectedAsset = pick.id
      syncStageIndexForSelection(pick.pack, pick.id)
      applyDefaultScaleForSelection()
    }
  }

  watch(
    () => libraryState.library?.hiddenKeys,
    () => {
      if (isModelHidden(toolsState.selectedPack, toolsState.selectedAsset)) {
        selectDefaultAssetForTool(toolsState.activeTool)
      }
    },
  )

  watch(modelCategories, (cats) => {
    if (!cats.length) return
    if (isModelSetMode()) return
    if (toolsState.activeCategoryId && !cats.some((c) => c.id === toolsState.activeCategoryId)) {
      setCategory(cats[0].id)
    } else if (!toolsState.activeCategoryId && !UTILITY_TOOLS.includes(toolsState.activeTool)) {
      setCategory(cats[0].id)
    }
  }, { immediate: true })

  const propSnapLabel = computed(() => PROP_SNAP_LABELS[toolsState.propSnapMode] ?? 'Merkez')
  const mirrorLabel = computed(() => MIRROR_LABELS[toolsState.mirrorAxis] ?? 'Kapalı')

  const rotatedPlacementFootprint = computed(() =>
    getRotatedFootprint(
      scaleToFootprint(toolsState.placementScale),
      toolsState.rotation,
    ),
  )

  function getPlacementScale() {
    return toolsState.placementScale
  }

  function applyPlacementScaleToState(scale) {
    toolsState.placementScale = clampPlacementScale(scale)
    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolPlacement[toolsState.activeTool] = { scale: toolsState.placementScale }
    }
  }

  function stepPlacementScale(direction) {
    applyPlacementScaleToState(bumpPlacementScale(toolsState.placementScale, direction))
  }

  function setPlacementScale(value) {
    applyPlacementScaleToState(value)
  }

  function restorePlacementForTool(tool) {
    const saved = toolPlacement[tool] ?? { scale: 1 }
    applyPlacementScaleToState(saved.scale)
  }

  function buildingPlacementSpan() {
    return scaleToFootprint(toolsState.placementScale)
  }

  function isOffshoreItemId(id) {
    return (state.project.layers.offshore ?? []).some((b) => b.id === id)
  }

  function gridCellZone(gx, gz) {
    return isOffshoreGridCell(gx, gz, state.project.settings) ? 'offshore' : 'land'
  }

  function canPlaceGridBuildingAt(gx, gz, asset, rotY, excludeId = null, span = null) {
    if (gridCellZone(gx, gz) === 'offshore') {
      return canPlaceOffshoreBuilding(gx, gz, asset, rotY, excludeId, span)
    }
    return canPlaceBuildingHere(gx, gz, asset, rotY, excludeId, span)
  }

  function canPlaceGridBuildingFromPoint(point, asset, rotY, excludeId = null, span = null) {
    if (!point) return false
    if (resolvePointZone(point) === 'offshore') {
      return canPlaceOffshoreBuilding(point.gx, point.gz, asset, rotY, excludeId, span)
    }
    return canPlaceBuildingHere(point.gx, point.gz, asset, rotY, excludeId, span)
  }

  function resolvePointZone(point) {
    if (!point) return 'land'
    if (point.zone) return point.zone
    return isOffshoreGridCell(point.gx, point.gz, state.project.settings) ? 'offshore' : 'land'
  }

  function isOffshoreStructureTool() {
    return toolsState.activeTool === 'building'
  }

  function normalizePickedItem(picked) {
    if (!picked) return null
    if (picked.layer === 'offshore') return { ...picked, layer: 'building' }
    return picked
  }

  function placeOffshoreStructureAt(point) {
    if (
      !canPlaceOffshoreBuilding(
        point.gx,
        point.gz,
        toolsState.selectedAsset,
        toolsState.rotation,
        null,
        buildingPlacementSpan(),
      )
    ) {
      return false
    }

    const payload = placementAssetFields({
      rotY: toolsState.rotation,
      ...buildingScalePayload(),
    })
    const existing = findOffshoreBuildingAt(point.gx, point.gz)
    if (existing) {
      updateOffshoreBuilding(existing.id, payload)
    } else {
      addOffshoreBuilding({ ...payload, gx: point.gx, gz: point.gz })
    }
    return true
  }

  function buildingScalePayload() {
    const scale = toolsState.placementScale
    const payload = {}
    if (scale !== 1) payload.scale = scale
    const cells = footprintCellsFromScale(scale)
    if (cells > 1) payload.spanCells = cells
    return payload
  }

  function propScalePayload() {
    return { scale: toolsState.placementScale }
  }

  function cycleMirrorAxis() {
    toolsState.mirrorAxis = nextMirrorAxis(toolsState.mirrorAxis)
  }

  function getMirrorPoint(point) {
    if (!point || toolsState.mirrorAxis === 'off') return null
    return mirrorGridPoint(point.gx, point.gz, state.project.settings, toolsState.mirrorAxis)
  }

  function withMirrorBatch(work) {
    beginHistoryBatch()
    try {
      work()
    } finally {
      endHistoryBatch()
    }
  }

  function placeMirroredRoad(gx, gz, payload) {
    const axis = toolsState.mirrorAxis
    if (axis === 'off') return
    const m = mirrorGridCell(gx, gz, state.project.settings, axis)
    if (m.gx === gx && m.gz === gz) return
    try {
      if (findRoadAt(m.gx, m.gz)) return
      const rotY = mirrorRotationY(payload.rotY ?? 0, axis)
      addRoad({ ...payload, gx: m.gx, gz: m.gz, rotY, manualOverride: true })
    } catch {
      // çakışma veya sınır
    }
  }

  function placeMirroredBuilding(gx, gz, payload) {
    const axis = toolsState.mirrorAxis
    if (axis === 'off') return
    const m = mirrorGridCell(gx, gz, state.project.settings, axis)
    if (m.gx === gx && m.gz === gz) return
    const rotY = mirrorRotationY(payload.rotY ?? 0, axis)
    try {
      if (canPlaceBuildingHere(m.gx, m.gz, payload.asset, rotY, null, buildingPlacementSpan())) {
        addBuilding({ ...payload, gx: m.gx, gz: m.gz, rotY })
      }
    } catch {
      // çakışma
    }
  }

  function placeMirroredProp(x, z, payload) {
    const axis = toolsState.mirrorAxis
    if (axis === 'off') return
    const w = mirrorWorldPoint(x, z, axis)
    if (!isWorldInBounds(w.x, w.z, state.project.settings)) return
    const rotY = mirrorRotationY(payload.rotY ?? 0, axis)
    try {
      addProp({ ...payload, x: w.x, z: w.z, rotY })
    } catch {
      // hata
    }
  }

  function clearAreaSelect() {
    toolsState.areaSelectRect = null
  }

  function canEditWanderZone() {
    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item) return false
    if (!isAnimatedAsset(item.pack, item.asset)) return false
    if (sel.layer === 'prop') return true
    if (sel.layer === 'building' && isOffshoreItemId(item.id)) return true
    return false
  }

  function isWanderZoneEditing() {
    return !!toolsState.wanderZoneEditing
  }

  function getSelectedWanderCellCount() {
    const item = selectedItemData.value
    if (!item) return 0
    return normalizeWanderCells(item.wanderCells).length
  }

  function persistSelectedWanderCells(cells) {
    const sel = toolsState.selectedItem
    if (!sel) return false
    const normalized = normalizeWanderCells(cells)
    const patch = { wanderCells: normalized.length ? normalized : [] }
    if (sel.layer === 'prop') {
      updateProp(sel.id, patch)
      return true
    }
    if (sel.layer === 'building' && isOffshoreItemId(sel.id)) {
      updateOffshoreBuilding(sel.id, patch)
      return true
    }
    return false
  }

  function ensureWanderCellsSeeded() {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || normalizeWanderCells(item.wanderCells).length) return

    let key = null
    if (sel?.layer === 'prop') {
      key = worldToWanderCellKey(item.x, item.z, state.project.settings)
    } else if (sel?.layer === 'building' && isOffshoreItemId(item.id)) {
      const { x, z } = gridToWorld(item.gx, item.gz, state.project.settings)
      key = worldToWanderCellKey(x, z, state.project.settings)
    }
    if (key) persistSelectedWanderCells([key])
  }

  function cancelWanderZoneEdit() {
    toolsState.wanderZoneEditing = false
    toolsState.wanderShiftPreview = false
    lastWanderPaintKey = null
  }

  function isSelectedWanderMapWide() {
    return selectedItemData.value?.wanderMapWide === true
  }

  function isSelectedInSea() {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || !sel) return false
    if (sel.layer === 'building' && isOffshoreItemId(item.id)) return true
    if (sel.layer === 'prop' && item.x != null && item.z != null) {
      return isOffshoreWorldPoint(item.x, item.z, state.project.settings)
    }
    return false
  }

  function setSelectedWanderMapWide(enabled) {
    const sel = toolsState.selectedItem
    if (!sel || !canEditWanderZone()) return false

    try {
      const patch = { wanderMapWide: !!enabled }
      if (sel.layer === 'prop') {
        updateProp(sel.id, patch)
      } else if (sel.layer === 'building' && isOffshoreItemId(sel.id)) {
        updateOffshoreBuilding(sel.id, patch)
      } else {
        return false
      }
      if (enabled) cancelWanderZoneEdit()
      return true
    } catch {
      return false
    }
  }

  function toggleSelectedWanderMapWide() {
    return setSelectedWanderMapWide(!isSelectedWanderMapWide())
  }

  function isSelectedCreatureSoundEnabled() {
    return itemCreatureSoundEnabled(selectedItemData.value)
  }

  function setSelectedCreatureSoundEnabled(enabled) {
    const sel = toolsState.selectedItem
    if (!sel || !canEditWanderZone()) return false
    const patch = { creatureSoundEnabled: !!enabled }
    try {
      if (sel.layer === 'prop') {
        updateProp(sel.id, patch)
      } else if (sel.layer === 'building' && isOffshoreItemId(sel.id)) {
        updateOffshoreBuilding(sel.id, patch)
      } else {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  function isSelectedPlayerApproachEnabled() {
    return itemPlayerApproachEnabled(selectedItemData.value)
  }

  function setSelectedPlayerApproachEnabled(enabled) {
    const sel = toolsState.selectedItem
    if (!sel || !canEditWanderZone()) return false
    const patch = { playerApproachEnabled: enabled === false ? false : true }
    try {
      if (sel.layer === 'prop') {
        updateProp(sel.id, patch)
      } else if (sel.layer === 'building' && isOffshoreItemId(sel.id)) {
        updateOffshoreBuilding(sel.id, patch)
      } else {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  function toggleSelectedPlayerApproachEnabled() {
    return setSelectedPlayerApproachEnabled(!isSelectedPlayerApproachEnabled())
  }

  function getSelectedViewerAsset() {
    const item = selectedItemData.value
    if (!item?.pack || !item?.asset) return null
    return getAsset(item.pack, item.asset)
  }

  function toggleWanderZoneEdit() {
    if (!canEditWanderZone()) return false
    if (isSelectedWanderMapWide()) return false
    if (toolsState.wanderZoneEditing) {
      cancelWanderZoneEdit()
      return true
    }
    cancelReposition()
    toolsState.wanderZoneEditing = true
    toolsState.wanderShiftPreview = false
    ensureWanderCellsSeeded()
    return true
  }

  function toggleWanderCell(gx, gz, remove = false) {
    const item = selectedItemData.value
    if (!item) return false
    if (!isEditableGridCell(gx, gz, state.project.settings)) return false
    const key = wanderCellKey(gx, gz)
    const current = normalizeWanderCells(item.wanderCells)
    const has = current.includes(key)
    if (remove) {
      if (!has) return false
      return persistSelectedWanderCells(current.filter((entry) => entry !== key))
    }
    if (has) return false
    return persistSelectedWanderCells([...current, key])
  }

  function setWanderShiftPreview(shiftKey) {
    toolsState.wanderShiftPreview = !!shiftKey
  }

  function beginWanderPaintSession() {
    lastWanderPaintKey = null
  }

  function endWanderPaintSession() {
    lastWanderPaintKey = null
  }

  function paintWanderCellAtPoint(point, remove = false) {
    if (!point || !toolsState.wanderZoneEditing) return false
    const paintKey = `${point.gx},${point.gz}:${remove ? 'r' : 'a'}`
    if (paintKey === lastWanderPaintKey) return false
    lastWanderPaintKey = paintKey
    return toggleWanderCell(point.gx, point.gz, remove)
  }

  function getWanderZoneGhostOptions(settings, hover) {
    if (!toolsState.wanderZoneEditing) return null
    const item = selectedItemData.value
    if (!item) return null

    const wanderCells = wanderCellsToGridList(item.wanderCells)
    const terrainMap = buildTerrainMap(state.project.layers?.terrain ?? [])

    function wanderCellY(gx, gz) {
      if (hover && hover.gx === gx && hover.gz === gz && Number.isFinite(hover.y)) {
        return hover.y
      }
      const { x, z } = gridToWorld(gx, gz, settings)
      return resolvePropSurfaceY(x, z, settings, terrainMap)
    }

    return {
      visible: false,
      tool: 'wander-zone',
      pack: '',
      asset: '',
      x: 0,
      z: 0,
      settings,
      wanderCells,
      wanderHover: hover ? { gx: hover.gx, gz: hover.gz } : null,
      wanderRemoveMode: toolsState.wanderShiftPreview,
      wanderCellY,
    }
  }

  function startAreaSelect(point) {
    if (!point) return
    toolsState.areaSelectRect = {
      gx0: point.gx,
      gz0: point.gz,
      gx1: point.gx,
      gz1: point.gz,
    }
  }

  function updateAreaSelect(point) {
    if (!point || !toolsState.areaSelectRect) return
    toolsState.areaSelectRect = {
      ...toolsState.areaSelectRect,
      gx1: point.gx,
      gz1: point.gz,
    }
  }

  function exportAreaRegion() {
    const rect = toolsState.areaSelectRect
    if (!rect) return false
    regionClipboard = extractRegion(
      state.project,
      rect.gx0,
      rect.gz0,
      rect.gx1,
      rect.gz1,
    )
    return true
  }

  async function copyAreaRegionToClipboard() {
    if (!exportAreaRegion()) return false
    try {
      await navigator.clipboard.writeText(snippetToJson(regionClipboard))
      return true
    } catch {
      return false
    }
  }

  function pasteRegionAtPoint(point) {
    if (!regionClipboard || !point) return 0
    beginHistoryBatch()
    try {
      const payload = buildPastePayload(
        regionClipboard,
        point.gx,
        point.gz,
        state.project.settings,
      )
      return pasteRegionItems(payload) ?? 0
    } catch {
      return 0
    } finally {
      endHistoryBatch()
    }
  }

  async function importRegionFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      regionClipboard = parseSnippetJson(text)
      return true
    } catch {
      return false
    }
  }

  const selectedItemData = computed(() => {
    const sel = toolsState.selectedItem
    if (!sel) return null
    return findItemById(sel.layer, sel.id)
  })

  const selectedItemLabel = computed(() => {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || !sel) return null

    const asset = getAsset(item.pack, item.asset)
    const defaultName = getAssetDisplayLabel(asset) || item.asset
    const displayName = item.name?.trim() || defaultName
    const layerLabel =
      sel.layer === 'road' ? 'Yol' : sel.layer === 'building' ? 'Bina' : 'Dekor'
    return `${layerLabel}: ${displayName} · ${item.rotY ?? 0}°`
  })

  function renameSelected(name) {
    const sel = toolsState.selectedItem
    if (!sel) return false

    try {
      const patch = { name: name ?? '' }
      if (sel.layer === 'road') updateRoad(sel.id, patch)
      else if (sel.layer === 'building') updateBuilding(sel.id, patch)
      else if (sel.layer === 'prop') updateProp(sel.id, patch)
      else return false
      return true
    } catch {
      return false
    }
  }

  function canEditModelSettings() {
    const sel = toolsState.selectedItem
    return !!sel && (sel.layer === 'building' || sel.layer === 'prop')
  }

  function canTintSelected() {
    const item = selectedItemData.value
    if (!item || toolsState.selectedItem?.layer !== 'prop') return false
    return isTintableAsset(item.pack, item.asset)
  }

  function setSelectedTintColor(color) {
    const sel = toolsState.selectedItem
    if (!sel || sel.layer !== 'prop' || !canTintSelected()) return false
    try {
      updateProp(sel.id, { color })
      return true
    } catch {
      return false
    }
  }

  function setSelectedBlocksPlayer(blocks) {
    const sel = toolsState.selectedItem
    if (!sel || !canEditModelSettings()) return false

    try {
      const patch = { blocksPlayer: blocks ? true : false }
      if (sel.layer === 'building') updateBuilding(sel.id, patch)
      else updateProp(sel.id, patch)
      return true
    } catch {
      return false
    }
  }

  function setSelectedHiddenInPlay(hidden) {
    const sel = toolsState.selectedItem
    if (!sel) return false

    try {
      const patch = { hiddenInPlay: !!hidden }
      if (sel.layer === 'building') updateBuilding(sel.id, patch)
      else if (sel.layer === 'prop') updateProp(sel.id, patch)
      else if (sel.layer === 'road') updateRoad(sel.id, patch)
      else return false
      return true
    } catch {
      return false
    }
  }

  function setSelectedPickable(pickable) {
    const sel = toolsState.selectedItem
    if (!sel) return false

    try {
      const patch = { pickable: !!pickable }
      if (sel.layer === 'building') updateBuilding(sel.id, patch)
      else if (sel.layer === 'prop') updateProp(sel.id, patch)
      else return false
      return true
    } catch {
      return false
    }
  }

  function isSelectedHiddenInPlay() {
    return itemHiddenInPlay(selectedItemData.value)
  }

  function isSelectedPickable() {
    return itemPickable(selectedItemData.value)
  }

  function canScaleSelected() {
    return !!toolsState.selectedItem
  }

  function getSelectedItemScale() {
    const item = selectedItemData.value
    if (!item) return 1
    return readItemScale(item)
  }

  function scaleSelected(scale) {
    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item || !canScaleSelected()) return false

    const clamped = clampPlacementScale(scale)
    if (clamped === clampPlacementScale(readItemScale(item))) return true

    try {
      if (sel.layer === 'building') {
        const currentCells = footprintCellsFromScale(readItemScale(item))
        const nextCells = footprintCellsFromScale(clamped)
        const span = nextCells > 1 ? spanCellsToFootprint(nextCells) : null
        const footprintGrows = nextCells > currentCells
        const canExpand =
          !footprintGrows ||
          !span ||
          canPlaceGridBuildingAt(
            item.gx,
            item.gz,
            item.asset,
            item.rotY ?? 0,
            item.id,
            span,
          )

        updateBuilding(item.id, {
          scale: clamped,
          scaleVisualOnly: !canExpand,
        })
      } else if (sel.layer === 'prop') {
        updateProp(item.id, { scale: clamped })
      } else if (sel.layer === 'road') {
        updateRoad(item.id, { scale: clamped })
      } else {
        return false
      }

      applyPlacementScaleToState(clamped)
      return true
    } catch {
      return false
    }
  }

  function stepSelectedScale(direction) {
    return scaleSelected(bumpPlacementScale(getSelectedItemScale(), direction))
  }

  function clearSelection() {
    cancelWanderZoneEdit()
    toolsState.selectedItem = null
    cancelReposition()
  }

  function setScreenItemPicker(fn) {
    screenItemPicker = fn
  }

  function pickItemAtPoint(point) {
    if (!point) return null

    const offshore = findOffshoreBuildingAt(point.gx, point.gz)
    if (offshore) return { layer: 'building', id: offshore.id }

    const building = findBuildingAt(point.gx, point.gz)
    if (building) return { layer: 'building', id: building.id }

    const road = findRoadAt(point.gx, point.gz)
    if (road) return { layer: 'road', id: road.id }

    const prop = findPropNear(point.x, point.z)
    if (prop) return { layer: 'prop', id: prop.id }

    return null
  }

  function pickItemAtScreen(clientX, clientY) {
    if (!screenItemPicker || clientX == null || clientY == null) return null
    return screenItemPicker(clientX, clientY)
  }

  function pickItem(clientX, clientY, point) {
    return normalizePickedItem(
      pickItemAtScreen(clientX, clientY) ?? (point ? pickItemAtPoint(point) : null),
    )
  }

  function selectAtPoint(point, clientX, clientY) {
    const picked = pickItem(clientX, clientY, point)
    if (
      toolsState.wanderZoneEditing &&
      picked?.id !== toolsState.selectedItem?.id
    ) {
      cancelWanderZoneEdit()
    }
    toolsState.selectedItem = picked
    return picked
  }

  function activeToolMatchesPickedItem(picked) {
    if (!picked) return false
    if (toolsState.activeTool === 'select') return true
    if (placementToolMatchesLayer(toolsState.activeTool, picked.layer)) return true

    const item = findItemById(picked.layer, picked.id)
    if (!item || picked.layer !== 'building' || !isOffshoreItemId(item.id)) return false

    const asset = getAsset(item.pack, item.asset)
    return asset ? classifyAssetTool(asset) === toolsState.activeTool : false
  }

  function shouldShowSelectionContext() {
    const sel = toolsState.selectedItem
    if (!sel) return false
    return activeToolMatchesPickedItem(sel)
  }

  function selectExistingAtPoint(point, clientX, clientY) {
    const picked = pickItem(clientX, clientY, point)
    if (!picked) return false
    if (!activeToolMatchesPickedItem(picked)) return false
    if (
      toolsState.wanderZoneEditing &&
      picked.id !== toolsState.selectedItem?.id
    ) {
      cancelWanderZoneEdit()
    }
    toolsState.selectedItem = picked
    return true
  }

  function toolForPickedItem(picked) {
    const item = findItemById(picked.layer, picked.id)
    if (!item) return null

    if (picked.layer === 'road') return { tool: 'road', item }

    const asset = getAsset(item.pack, item.asset)
    const tool =
      picked.layer === 'building' && !isOffshoreItemId(item.id)
        ? 'building'
        : asset
          ? classifyAssetTool(asset)
          : picked.layer === 'building'
            ? 'building'
            : 'prop'
    return { tool, item }
  }

  function activateToolForItem(tool, item) {
    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolRotations[toolsState.activeTool] = toolsState.rotation
      toolPlacement[toolsState.activeTool] = {
        scale: toolsState.placementScale,
      }
    }

    const entry = libraryState.library?.models?.[modelKey(item.pack, item.asset)]
    const categoryId = entry?.categoryIds?.[0]
    if (categoryId && getCategoryById(categoryId)) {
      setCategory(categoryId)
    } else {
      toolsState.activeCategoryId = null
      toolsState.activeTool = tool
    }

    clearPlacementLineAnchor()
    cancelMoveDrag()
    cancelReposition()

    if (!PLACEMENT_TOOLS.includes(tool)) return

    toolsState.rotation = item.rotY ?? toolRotations[tool] ?? 0
    toolRotations[tool] = toolsState.rotation
    restorePlacementForTool(tool)

    if (item.scale != null && item.scale !== 1) {
      applyPlacementScaleToState(item.scale)
      toolPlacement[tool] = { scale: toolsState.placementScale }
    }

    selectAsset(item.pack, item.asset)
  }

  /** Sağ tık: tıklanan öğeyi seçer, araç çubuğunu açar ve ilgili aracı etkinleştirir. */
  function selectItemContextAtPoint(point, clientX, clientY) {
    const picked = pickItem(clientX, clientY, point)
    if (!picked) return false

    const ctx = toolForPickedItem(picked)
    if (!ctx) return false

    activateToolForItem(ctx.tool, ctx.item)
    toolsState.selectedItem = picked
    return true
  }

  function getSelectedWorldAnchor(settings = state.project.settings) {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || !sel) return null

    const terrain = buildTerrainMap(state.project.layers.terrain ?? [])

    if (sel.layer === 'prop') {
      const terrain = buildTerrainMap(state.project.layers.terrain ?? [])
      const y = resolvePropSurfaceY(item.x, item.z, settings, terrain)
      return { x: item.x, y: y + 1.4, z: item.z }
    }

    const { x, z } = gridToWorld(item.gx, item.gz, settings)
    if (isOffshoreItemId(item.id)) {
      return { x, y: OFFSHORE_ITEM_Y + 1.4, z }
    }
    const y = terrainHeightAtCell(terrain, item.gx, item.gz)
    return { x, y: y + 1.4, z }
  }

  function rotateSelected(direction = 1) {
    const sel = toolsState.selectedItem
    if (!sel) return false

    const item = findItemById(sel.layer, sel.id)
    if (!item) {
      clearSelection()
      return false
    }

    const newRot =
      direction >= 0
        ? nextRotation(item.rotY ?? 0)
        : prevRotation(item.rotY ?? 0)

    try {
      if (sel.layer === 'building') {
        const anchor = getRotatedAnchor(item.gx, item.gz, item.asset, item.rotY, newRot, resolveBuildingSpan(item))
        updateBuilding(item.id, { gx: anchor.gx, gz: anchor.gz, rotY: newRot })
      } else if (sel.layer === 'road') {
        updateRoad(item.id, { rotY: newRot, manualOverride: true })
      } else if (sel.layer === 'prop') {
        updateProp(item.id, { rotY: newRot })
      }
      return true
    } catch {
      return false
    }
  }

  function deleteSelected() {
    const sel = toolsState.selectedItem
    if (!sel) return false

    try {
      if (sel.layer === 'road') removeRoad(sel.id)
      else if (sel.layer === 'building') removeBuilding(sel.id)
      else if (sel.layer === 'prop') removeProp(sel.id)
      clearSelection()
      return true
    } catch {
      return false
    }
  }

  function clearPlacementLineAnchor() {
    toolsState.placementLineAnchor = null
  }

  function isMoveDragging() {
    return !!toolsState.moveDrag
  }

  function cancelMoveDrag() {
    toolsState.moveDrag = null
  }

  function isRepositionPending() {
    return !!toolsState.repositionPending
  }

  function cancelReposition() {
    toolsState.repositionPending = false
    cancelMoveDrag()
  }

  function startReposition() {
    if (!toolsState.selectedItem) return false
    if (toolsState.repositionPending) {
      cancelReposition()
      return false
    }
    cancelMoveDrag()
    toolsState.repositionPending = true
    return true
  }

  function canRepositionTo(point) {
    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item || !point) return false

    if (sel.layer === 'building') {
      const span = resolveBuildingSpan(item)
      const offshoreItem = isOffshoreItemId(item.id)
      if (offshoreItem) {
        if (resolvePointZone(point) !== 'offshore') return false
        return canPlaceOffshoreBuilding(
          point.gx,
          point.gz,
          item.asset,
          item.rotY ?? 0,
          item.id,
          span,
        )
      }
      if (resolvePointZone(point) === 'offshore') return false
      return canPlaceBuildingHere(
        point.gx,
        point.gz,
        item.asset,
        item.rotY ?? 0,
        item.id,
        span,
      )
    }
    if (sel.layer === 'road') {
      const occupant = findRoadAt(point.gx, point.gz)
      return !occupant || occupant.id === item.id
    }
    if (sel.layer === 'prop') {
      return isPropWorldAllowed(point.x, point.z, state.project.settings)
    }
    return false
  }

  function getRepositionPreviewGhostOptions(settings, point) {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!toolsState.repositionPending || !item || !sel || !point) return null
    if (toolsState.moveDrag) return getMovePreviewGhostOptions(settings, point)

    const valid = canRepositionTo(point)
    const scale = readItemScale(item)

    if (sel.layer === 'prop') {
      return {
        visible: true,
        tool: 'move',
        pack: item.pack,
        asset: item.asset,
        x: point.x,
        z: point.z,
        rotY: item.rotY ?? 0,
        settings,
        canPlace: valid,
        placementMode: 'prop',
        placementScale: scale,
      }
    }

    const cell = gridToWorld(point.gx, point.gz, settings)
    return {
      visible: true,
      tool: 'move',
      pack: item.pack,
      asset: item.asset,
      gx: point.gx,
      gz: point.gz,
      x: cell.x,
      z: cell.z,
      rotY: item.rotY ?? 0,
      settings,
      canPlace: valid,
      placementMode: 'grid',
      placementScale: scale,
    }
  }

  function tryStartMoveDrag(point, clientX, clientY) {
    if (!point || toolsState.activeTool !== 'select') return false

    let sel = toolsState.selectedItem
    if (!sel) {
      sel = pickItem(clientX, clientY, point)
      if (!sel) return false
      toolsState.selectedItem = sel
    }

    const picked = pickItem(clientX, clientY, point)
    if (!picked || picked.id !== sel.id) return false

    const item = findItemById(sel.layer, sel.id)
    if (!item) return false

    if (sel.layer === 'prop') {
      toolsState.moveDrag = {
        layer: 'prop',
        offsetX: point.x - item.x,
        offsetZ: point.z - item.z,
      }
    } else {
      toolsState.moveDrag = {
        layer: sel.layer,
        offsetGx: point.gx - item.gx,
        offsetGz: point.gz - item.gz,
      }
    }
    return true
  }

  function getMoveTarget(point) {
    if (!point || !toolsState.moveDrag) return null
    const drag = toolsState.moveDrag
    if (drag.layer === 'prop') {
      return {
        x: point.x - drag.offsetX,
        z: point.z - drag.offsetZ,
        gx: point.gx,
        gz: point.gz,
      }
    }
    return {
      gx: point.gx - drag.offsetGx,
      gz: point.gz - drag.offsetGz,
      x: point.x,
      z: point.z,
    }
  }

  function canMoveSelectedTo(point) {
    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item || !point) return false

    const target = getMoveTarget(point)
    if (!target) return false

    if (sel.layer === 'building') {
      const span = resolveBuildingSpan(item)
      const offshoreItem = isOffshoreItemId(item.id)
      if (offshoreItem) {
        if (gridCellZone(target.gx, target.gz) !== 'offshore') return false
        return canPlaceOffshoreBuilding(
          target.gx,
          target.gz,
          item.asset,
          item.rotY ?? 0,
          item.id,
          span,
        )
      }
      if (gridCellZone(target.gx, target.gz) === 'offshore') return false
      return canPlaceBuildingHere(
        target.gx,
        target.gz,
        item.asset,
        item.rotY ?? 0,
        item.id,
        span,
      )
    }
    if (sel.layer === 'road') {
      const occupant = findRoadAt(target.gx, target.gz)
      return !occupant || occupant.id === item.id
    }
    if (sel.layer === 'prop') {
      return isPropWorldAllowed(target.x, target.z, state.project.settings)
    }
    return false
  }

  function beginRepositionDrag(point) {
    if (!toolsState.repositionPending || !point) return false

    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item) return false

    if (sel.layer === 'prop') {
      toolsState.moveDrag = {
        layer: 'prop',
        offsetX: point.x - item.x,
        offsetZ: point.z - item.z,
      }
    } else {
      toolsState.moveDrag = {
        layer: sel.layer,
        offsetGx: point.gx - item.gx,
        offsetGz: point.gz - item.gz,
      }
    }
    return true
  }

  function commitMoveDrag(point) {
    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item || !toolsState.moveDrag) return false

    const wasReposition = toolsState.repositionPending
    const target = getMoveTarget(point)
    if (!target || !canMoveSelectedTo(point)) {
      cancelMoveDrag()
      return false
    }

    try {
      if (sel.layer === 'building') {
        updateBuilding(item.id, { gx: target.gx, gz: target.gz })
      } else if (sel.layer === 'road') {
        updateRoad(item.id, { gx: target.gx, gz: target.gz })
      } else if (sel.layer === 'prop') {
        updateProp(item.id, { x: target.x, z: target.z })
      }
      cancelMoveDrag()
      if (wasReposition) cancelReposition()
      return true
    } catch {
      cancelMoveDrag()
      return false
    }
  }

  function commitRepositionAtPoint(point) {
    if (!toolsState.repositionPending || !point) return false
    const sel = toolsState.selectedItem
    const item = selectedItemData.value
    if (!sel || !item) return false
    if (!canRepositionTo(point)) {
      cancelMoveDrag()
      return false
    }

    try {
      if (sel.layer === 'building') {
        updateBuilding(item.id, { gx: point.gx, gz: point.gz })
      } else if (sel.layer === 'road') {
        updateRoad(item.id, { gx: point.gx, gz: point.gz })
      } else if (sel.layer === 'prop') {
        updateProp(item.id, { x: point.x, z: point.z })
      }
      cancelMoveDrag()
      cancelReposition()
      return true
    } catch {
      cancelMoveDrag()
      return false
    }
  }

  function getMovePreviewGhostOptions(settings, point) {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || !sel || !toolsState.moveDrag || !point) return null

    const target = getMoveTarget(point)
    if (!target) return null
    const valid = canMoveSelectedTo(point)
    const scale = readItemScale(item)

    if (sel.layer === 'prop') {
      return {
        visible: true,
        tool: 'move',
        pack: item.pack,
        asset: item.asset,
        x: target.x,
        z: target.z,
        rotY: item.rotY ?? 0,
        settings,
        canPlace: valid,
        placementMode: 'prop',
        placementScale: scale,
      }
    }

    const cell = gridToWorld(target.gx, target.gz, settings)
    return {
      visible: true,
      tool: 'move',
      pack: item.pack,
      asset: item.asset,
      gx: target.gx,
      gz: target.gz,
      x: cell.x,
      z: cell.z,
      rotY: item.rotY ?? 0,
      settings,
      canPlace: valid,
      placementMode: 'grid',
      placementScale: scale,
    }
  }

  function clipboardScalePayload() {
    if (!clipboard || clipboard.scale === 1) return {}
    return { scale: clipboard.scale }
  }

  function clipboardBuildingSpan() {
    if (!clipboard) return null
    const cells = footprintCellsFromScale(clipboard.scale ?? 1)
    return cells > 1 ? scaleToFootprint(cells) : null
  }

  function copySelected() {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || !sel) return false

    const scale = readItemScale(item)
    const rotY = item.rotY ?? 0

    clipboard = {
      layer: sel.layer,
      offshore: sel.layer === 'building' && isOffshoreItemId(item.id),
      pack: item.pack,
      asset: item.asset,
      rotY,
      scale,
    }

    toolsState.rotation = rotY
    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolRotations[toolsState.activeTool] = rotY
    }
    applyPlacementScaleToState(scale)

    return true
  }

  function canPasteAtPoint(point) {
    if (!clipboard || !point) return false
    if (clipboard.layer === 'building') {
      const span = clipboardBuildingSpan()
      if (clipboard.offshore || resolvePointZone(point) === 'offshore') {
        return canPlaceOffshoreBuilding(
          point.gx,
          point.gz,
          clipboard.asset,
          clipboard.rotY,
          null,
          span,
        )
      }
      return canPlaceBuildingHere(
        point.gx,
        point.gz,
        clipboard.asset,
        clipboard.rotY,
        null,
        span,
      )
    }
    if (clipboard.layer === 'road') {
      return !findRoadAt(point.gx, point.gz)
    }
    if (clipboard.layer === 'prop') {
      return isPropWorldAllowed(point.x, point.z, state.project.settings)
    }
    return false
  }

  function pasteAtPoint(point) {
    if (!clipboard || !point) return false

    beginHistoryBatch()
    try {
      if (clipboard.layer === 'road') {
        addRoad({
          pack: clipboard.pack,
          asset: clipboard.asset,
          gx: point.gx,
          gz: point.gz,
          rotY: clipboard.rotY,
          ...clipboardScalePayload(),
        })
      } else if (clipboard.layer === 'building') {
        if (clipboard.offshore || resolvePointZone(point) === 'offshore') {
          addOffshoreBuilding({
            pack: clipboard.pack,
            asset: clipboard.asset,
            gx: point.gx,
            gz: point.gz,
            rotY: clipboard.rotY,
            ...clipboardScalePayload(),
          })
        } else {
          addBuilding({
            pack: clipboard.pack,
            asset: clipboard.asset,
            gx: point.gx,
            gz: point.gz,
            rotY: clipboard.rotY,
            ...clipboardScalePayload(),
          })
        }
      } else if (clipboard.layer === 'prop') {
        addProp({
          pack: clipboard.pack,
          asset: clipboard.asset,
          x: point.x,
          z: point.z,
          rotY: clipboard.rotY,
          scale: clipboard.scale ?? 1,
        })
      }
      clearSelection()
      return true
    } catch {
      return false
    } finally {
      endHistoryBatch()
    }
  }

  function placeBuildingLine(point) {
    if (!toolsState.placementLineAnchor) {
      toolsState.placementLineAnchor = { gx: point.gx, gz: point.gz }
      return 'anchor'
    }

    const cells = bresenhamCells(
      toolsState.placementLineAnchor.gx,
      toolsState.placementLineAnchor.gz,
      point.gx,
      point.gz,
    )
    toolsState.placementLineAnchor = null

    beginHistoryBatch()
    try {
      for (const cell of cells) {
        const offshore = isOffshoreGridCell(cell.gx, cell.gz, state.project.settings)
        const canPlace = offshore
          ? canPlaceOffshoreBuilding(
              cell.gx,
              cell.gz,
              toolsState.selectedAsset,
              toolsState.rotation,
              null,
              buildingPlacementSpan(),
            )
          : canPlaceBuildingHere(
              cell.gx,
              cell.gz,
              toolsState.selectedAsset,
              toolsState.rotation,
              null,
              buildingPlacementSpan(),
            )
        if (!canPlace) continue

        const cellPayload = placementAssetFields({
          gx: cell.gx,
          gz: cell.gz,
          rotY: toolsState.rotation,
          ...buildingScalePayload(),
        })
        if (offshore) {
          addOffshoreBuilding(cellPayload)
        } else {
          addBuilding(cellPayload)
        }
      }
    } finally {
      endHistoryBatch()
    }
    return 'line'
  }

  function placePropLine(point) {
    if (!toolsState.placementLineAnchor) {
      toolsState.placementLineAnchor = { gx: point.gx, gz: point.gz }
      return 'anchor'
    }

    const cells = bresenhamCells(
      toolsState.placementLineAnchor.gx,
      toolsState.placementLineAnchor.gz,
      point.gx,
      point.gz,
    )
    toolsState.placementLineAnchor = null

    beginHistoryBatch()
    try {
      for (const cell of cells) {
        const { x, z } = gridToWorld(cell.gx, cell.gz, state.project.settings)
        if (!isWorldInBounds(x, z, state.project.settings)) continue
        addProp(
          placementAssetFields({
            x,
            z,
            rotY: toolsState.rotation,
            ...propScalePayload(),
          }),
        )
      }
    } finally {
      endHistoryBatch()
    }
    return 'line'
  }

  function getSelectionGhostOptions(settings) {
    const item = selectedItemData.value
    const sel = toolsState.selectedItem
    if (!item || !sel || !shouldShowSelectionContext()) return null

    const placementScale = readItemScale(item)

    if (sel.layer === 'prop') {
      const terrainMap = buildTerrainMap(state.project.layers.terrain ?? [])
      return {
        visible: true,
        tool: 'select',
        pack: item.pack,
        asset: item.asset,
        x: item.x,
        z: item.z,
        y: resolvePropSurfaceY(item.x, item.z, settings, terrainMap),
        rotY: item.rotY ?? 0,
        settings,
        canPlace: true,
        placementMode: 'prop',
        placementScale,
      }
    }

    const cell = gridToWorld(item.gx, item.gz, settings)
    return {
      visible: true,
      tool: 'select',
      pack: item.pack,
      asset: item.asset,
      gx: item.gx,
      gz: item.gz,
      x: cell.x,
      z: cell.z,
      y: isOffshoreItemId(item.id) ? OFFSHORE_ITEM_Y : undefined,
      rotY: item.rotY ?? 0,
      settings,
      canPlace: true,
      placementMode: 'grid',
      placementScale,
    }
  }

  const displayedAssets = computed(() => {
    if (toolsState.paletteView === 'favorites') {
      favoritesVersion.value
    }
    void libraryState.library?.hiddenKeys

    const search = toolsState.paletteSearch.trim()
    let assets = categoryFilteredAssets.value

    if (toolsState.paletteView === 'recent') {
      const recentKeys = new Set(
        resolveRecentAssets(getAsset).map((a) => `${a.pack}:${a.id}`),
      )
      assets = assets.filter((a) => recentKeys.has(`${a.pack}:${a.id}`))
    } else if (toolsState.paletteView === 'favorites') {
      const favKeys = new Set(
        resolveFavoriteAssets(getAsset).map((a) => `${a.pack}:${a.id}`),
      )
      assets = assets.filter((a) => favKeys.has(`${a.pack}:${a.id}`))
    }

    if (search) {
      return filterModelsBySearch(assets, search, getAssetDisplayLabel)
    }

    return assets
  })

  function setCategory(categoryId) {
    const category = getCategoryById(categoryId)
    if (!category) return

    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolRotations[toolsState.activeTool] = toolsState.rotation
      toolPlacement[toolsState.activeTool] = {
        scale: toolsState.placementScale,
      }
    }

    toolsState.activeCategoryId = categoryId
    toolsState.activeModelSetId = null
    toolsState.activeTool = category.placementType
    clearPlacementLineAnchor()
    cancelMoveDrag()
    cancelReposition()

    toolsState.rotation = toolRotations[category.placementType] ?? 0
    restorePlacementForTool(category.placementType)
    selectDefaultAssetForTool(category.placementType)
    applyDefaultScaleForSelection()
  }

  function setModelSetMode() {
    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolRotations[toolsState.activeTool] = toolsState.rotation
      toolPlacement[toolsState.activeTool] = {
        scale: toolsState.placementScale,
      }
    }

    toolsState.activeCategoryId = MODEL_SET_MODE_ID
    toolsState.activeModelSetId = null
    toolsState.activeStageIndex = 0
    toolsState.activeTool = 'prop'
    clearPlacementLineAnchor()
    cancelMoveDrag()
    cancelReposition()
  }

  function selectModelSet(setId) {
    const library = libraryState.library
    const set = getModelSetById(library, setId)
    if (!set?.stages?.length) return

    toolsState.activeCategoryId = MODEL_SET_MODE_ID
    toolsState.activeModelSetId = setId

    const defaultIndex = set.defaultStageIndex ?? 0
    toolsState.activeStageIndex = defaultIndex
    const stage = getStageAt(set, defaultIndex)
    if (!stage) return

    toolsState.selectedPack = stage.pack
    toolsState.selectedAsset = stage.assetId

    const tool = inferPlacementTool(stage.pack, stage.assetId)
    toolsState.activeTool = tool
    toolsState.rotation = toolRotations[tool] ?? 0
    restorePlacementForTool(tool)
    applyDefaultScaleForSelection()
  }

  function clearActiveModelSet() {
    toolsState.activeModelSetId = null
    toolsState.activeStageIndex = 0
  }

  function setTool(tool) {
    if (UTILITY_TOOLS.includes(tool)) {
      if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
        toolRotations[toolsState.activeTool] = toolsState.rotation
        toolPlacement[toolsState.activeTool] = {
          scale: toolsState.placementScale,
        }
      }
      toolsState.activeCategoryId = null
      toolsState.activeModelSetId = null
      toolsState.activeTool = tool
      clearPlacementLineAnchor()
      cancelMoveDrag()
      cancelReposition()
      return
    }

    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolRotations[toolsState.activeTool] = toolsState.rotation
      toolPlacement[toolsState.activeTool] = {
        scale: toolsState.placementScale,
      }
    }

    toolsState.activeTool = tool
    clearPlacementLineAnchor()
    cancelMoveDrag()
    cancelReposition()

    if (PLACEMENT_TOOLS.includes(tool)) {
      toolsState.rotation = toolRotations[tool] ?? 0
      restorePlacementForTool(tool)
      selectDefaultAssetForTool(tool)
    }
  }

  function selectAsset(pack, assetId) {
    toolsState.selectedPack = pack
    toolsState.selectedAsset = assetId
    syncStageIndexForSelection(pack, assetId)
    pushRecent(pack, assetId)
    applyDefaultScaleForSelection()
  }

  function setActiveStageIndex(stageIndex) {
    const library = libraryState.library
    if (!library) return

    let set = null
    if (toolsState.activeModelSetId) {
      set = getModelSetById(library, toolsState.activeModelSetId)
    } else {
      const match = findModelSetForAsset(
        library,
        toolsState.selectedPack,
        toolsState.selectedAsset,
      )
      set = match?.set ?? null
    }
    if (!set) return

    toolsState.activeStageIndex = stageIndex
    const stage = getStageAt(set, stageIndex)
    if (stage) {
      toolsState.selectedPack = stage.pack
      toolsState.selectedAsset = stage.assetId
      if (isModelSetMode()) {
        const tool = inferPlacementTool(stage.pack, stage.assetId)
        toolsState.activeTool = tool
      }
    }
  }

  function getSelectedModelSet() {
    const item = selectedItemData.value
    if (!item || !libraryState.library) return null
    if (item.modelSetId) {
      return getModelSetById(libraryState.library, item.modelSetId)
    }
    const sets = findAllSetsForAsset(libraryState.library, item.pack, item.asset)
    return sets.length === 1 ? sets[0] : null
  }

  function getSetsForSelectedItem() {
    const item = selectedItemData.value
    if (!item || !libraryState.library) return []
    if (item.modelSetId) {
      const set = getModelSetById(libraryState.library, item.modelSetId)
      return set ? [set] : []
    }
    return findAllSetsForAsset(libraryState.library, item.pack, item.asset)
  }

  function setSelectedModelSet(setId) {
    const item = selectedItemData.value
    if (!item) return false
    const set = getModelSetById(libraryState.library, setId)
    if (!set) return false
    const stageIndex = item.stageIndex ?? set.defaultStageIndex ?? 0
    return setSelectedStage(stageIndex, setId)
  }

  function setSelectedStage(stageIndex, modelSetIdOverride) {
    const sel = toolsState.selectedItem
    if (!sel) return false

    const item = selectedItemData.value
    if (!item) return false

    let setId = modelSetIdOverride ?? item.modelSetId
    if (!setId) {
      const sets = findAllSetsForAsset(libraryState.library, item.pack, item.asset)
      if (sets.length === 1) setId = sets[0].id
      else return false
    }

    const set = getModelSetById(libraryState.library, setId)
    if (!set) return false

    const stage = getStageAt(set, stageIndex)
    if (!stage) return false

    const patch = {
      pack: stage.pack,
      asset: stage.assetId,
      stageIndex,
      modelSetId: set.id,
    }

    if (sel.layer === 'building') updateBuilding(sel.id, patch)
    else if (sel.layer === 'prop') updateProp(sel.id, patch)
    else if (sel.layer === 'road') updateRoad(sel.id, patch)
    else return false

    return true
  }

  const activePlacementModelSet = computed(() => {
    void libraryState.library?.updatedAt
    const library = libraryState.library
    if (!library) return null
    if (toolsState.activeModelSetId) {
      const set = getModelSetById(library, toolsState.activeModelSetId)
      return set ? { set, stageIndex: toolsState.activeStageIndex } : null
    }
    return findModelSetForAsset(library, toolsState.selectedPack, toolsState.selectedAsset)
  })

  const placementStages = computed(() => {
    const match = activePlacementModelSet.value
    if (!match) return []
    return sortStages(match.set.stages)
  })

  function setPaletteSearch(value) {
    toolsState.paletteSearch = value
  }

  function setPaletteView(view) {
    toolsState.paletteView = view
  }

  async function toggleFavoriteAsset(pack, id) {
    try {
      await toggleFavorite(pack, id)
      favoritesVersion.value += 1
    } catch {
      // Firebase hatası — sessizce geç
    }
  }

  function cyclePropSnapMode() {
    toolsState.propSnapMode = nextPropSnapMode(toolsState.propSnapMode)
  }

  function rotatePreview(direction = 1) {
    const oldRot = toolsState.rotation
    toolsState.rotation =
      direction < 0 ? prevRotation(toolsState.rotation) : nextRotation(toolsState.rotation)
    if (PLACEMENT_TOOLS.includes(toolsState.activeTool)) {
      toolRotations[toolsState.activeTool] = toolsState.rotation
    }
  }

  function setHoverPoint(point) {
    toolsState.hoverCell = point
  }

  function clearHoverCell() {
    toolsState.hoverCell = null
  }

  function setTerrainLowerPreview(value) {
    toolsState.terrainLowerPreview = !!value
  }

  function canPlaceAtMirrorPoint(point) {
    if (point?.zone === 'offshore') return false
    const mp = getMirrorPoint(point)
    if (!mp) return false

    if (toolsState.activeTool === 'erase') {
      return hasEraseTarget(mp.x, mp.z)
    }
    if (toolsState.activeTool === 'road') return true
    if (toolsState.activeTool === 'building') {
      const rotY = mirrorRotationY(toolsState.rotation, toolsState.mirrorAxis)
      return canPlaceBuildingHere(
        mp.gx,
        mp.gz,
        toolsState.selectedAsset,
        rotY,
        null,
        buildingPlacementSpan(),
      )
    }
    if (PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
      return isWorldInBounds(mp.x, mp.z, state.project.settings)
    }
    return false
  }

  function getMirrorGhostOptions(point) {
    const mp = getMirrorPoint(point)
    if (!mp || toolsState.mirrorAxis === 'off') return null
    const rotY = mirrorRotationY(toolsState.rotation, toolsState.mirrorAxis)
    const terrainMap = buildTerrainMap(state.project.layers.terrain ?? [])
    const y = terrainHeightAtCell(terrainMap, mp.gx, mp.gz)
    return {
      ...mp,
      y,
      rotY,
      canPlace: canPlaceAtMirrorPoint(point),
    }
  }

  function canPlaceAtPoint(point) {
    if (!point) return false

    if (resolvePointZone(point) === 'offshore') {
      if (toolsState.activeTool === 'erase') {
        return hasEraseTarget(point.x, point.z)
      }
      if (toolsState.activeTool === 'building') {
        return canPlaceOffshoreBuilding(
          point.gx,
          point.gz,
          toolsState.selectedAsset,
          toolsState.rotation,
          null,
          buildingPlacementSpan(),
        )
      }
      if (PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
        return isOffshoreGridCell(point.gx, point.gz, state.project.settings)
      }
      return false
    }

    if (toolsState.activeTool === 'erase') {
      return hasEraseTarget(point.x, point.z)
    }
    if (toolsState.activeTool === 'road') return true
    if (toolsState.activeTool === 'building') {
      return canPlaceBuildingHere(
        point.gx,
        point.gz,
        toolsState.selectedAsset,
        toolsState.rotation,
        null,
        buildingPlacementSpan(),
      )
    }
    if (PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
      return isPropWorldAllowed(point.x, point.z, state.project.settings)
    }
    return false
  }

  function canUsePlacementBrush() {
    if (!PLACEMENT_BRUSH_TOOLS.includes(toolsState.activeTool)) return false
    if (
      PROP_LIKE_TOOLS.includes(toolsState.activeTool) &&
      toolsState.propSnapMode === 'free'
    ) {
      return false
    }
    return true
  }

  function placeGridItemAt(point) {
    if (resolvePointZone(point) === 'offshore') {
      if (toolsState.activeTool === 'building') {
        return placeOffshoreStructureAt(point)
      }
      if (PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
        if (!isOffshoreGridCell(point.gx, point.gz, state.project.settings)) return false
        const payload = placementAssetFields({
          rotY: toolsState.rotation,
          ...propScalePayload(),
        })
        addProp({ ...payload, x: point.x, z: point.z })
        return true
      }
      return false
    }

    if (toolsState.activeTool === 'building') {
      if (
        !canPlaceBuildingHere(
          point.gx,
          point.gz,
          toolsState.selectedAsset,
          toolsState.rotation,
          null,
          buildingPlacementSpan(),
        )
      ) {
        return false
      }

      const payload = placementAssetFields({
        rotY: toolsState.rotation,
        ...buildingScalePayload(),
      })
      const existing = findBuildingAt(point.gx, point.gz)
      if (existing) {
        updateBuilding(existing.id, payload)
      } else {
        addBuilding({ ...payload, gx: point.gx, gz: point.gz })
      }
      placeMirroredBuilding(point.gx, point.gz, payload)
      return true
    }

    if (PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
      if (!isPropWorldAllowed(point.x, point.z, state.project.settings)) return false

      const payload = placementAssetFields({
        rotY: toolsState.rotation,
        ...propScalePayload(),
      })
      addProp({ ...payload, x: point.x, z: point.z })
      placeMirroredProp(point.x, point.z, payload)
      return true
    }

    return false
  }

  function paintPlacementCell(point) {
    if (!point || !paintedPlacementKeys) return
    const key = cellKey(point.gx, point.gz)
    if (paintedPlacementKeys.has(key)) return
    paintedPlacementKeys.add(key)
    placeGridItemAt(point)
  }

  function handlePlacementBrushDown(point, { shiftKey = false } = {}) {
    if (!point || shiftKey || !canUsePlacementBrush()) return false

    clearSelection()
    placementBrushing = true
    lastPlacementCell = { gx: point.gx, gz: point.gz }
    paintedPlacementKeys = new Set()
    beginHistoryBatch()
    paintPlacementCell(point)
    return true
  }

  function handlePlacementBrushMove(point) {
    if (!placementBrushing || !point || !lastPlacementCell || !paintedPlacementKeys) {
      return false
    }

    if (cellKey(lastPlacementCell.gx, lastPlacementCell.gz) === cellKey(point.gx, point.gz)) {
      return true
    }

    const cells = bresenhamCells(
      lastPlacementCell.gx,
      lastPlacementCell.gz,
      point.gx,
      point.gz,
    )
    const settings = state.project.settings
    for (const cell of cells) {
      const { x, z } = gridToWorld(cell.gx, cell.gz, settings)
      paintPlacementCell({ gx: cell.gx, gz: cell.gz, x, z })
    }
    lastPlacementCell = { gx: point.gx, gz: point.gz }
    return true
  }

  function handlePlacementBrushUp() {
    const wasBrushing = placementBrushing
    if (wasBrushing) {
      endHistoryBatch()
    }
    placementBrushing = false
    lastPlacementCell = null
    paintedPlacementKeys = null
    return wasBrushing
  }

  function isPlacementBrushing() {
    return placementBrushing
  }

  function applyAtPoint(point, { shiftKey = false, clientX, clientY } = {}) {
    if (state.mode !== 'create' || !point) return 'none'

    if (toolsState.activeTool === 'select') {
      selectAtPoint(point, clientX, clientY)
      return toolsState.selectedItem ? 'selected' : 'none'
    }

    if (['building', 'road', ...PROP_LIKE_TOOLS].includes(toolsState.activeTool)) {
      if (selectExistingAtPoint(point, clientX, clientY)) return 'selected'
      clearSelection()
    }

    if (toolsState.activeTool === 'erase') {
      clearSelection()
      try {
        removeAtPoint(point.x, point.z, point.gx, point.gz)
        return 'success'
      } catch {
        return 'error'
      }
    }

    if (toolsState.activeTool === 'road') {
      withMirrorBatch(() => {
        const payload = placementAssetFields({ rotY: toolsState.rotation })
        const existing = findRoadAt(point.gx, point.gz)
        if (existing) {
          updateRoad(existing.id, { ...payload, manualOverride: true })
        } else {
          addRoad({ ...payload, gx: point.gx, gz: point.gz, manualOverride: true })
        }
        placeMirroredRoad(point.gx, point.gz, payload)
      })
      return 'success'
    }

    if (toolsState.activeTool === 'building') {
      if (shiftKey) {
        placeBuildingLine(point)
        return 'success'
      }

      let placed = false
      withMirrorBatch(() => {
        placed = placeGridItemAt(point)
      })
      return placed ? 'success' : 'error'
    }

    if (PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
      if (shiftKey) {
        placePropLine(point)
        return 'success'
      }

      if (resolvePointZone(point) === 'offshore') {
        let placed = false
        withMirrorBatch(() => {
          placed = placeGridItemAt(point)
        })
        return placed ? 'success' : 'error'
      }

      if (!isWorldInBounds(point.x, point.z, state.project.settings)) {
        return 'error'
      }

      const payload = placementAssetFields({
        rotY: toolsState.rotation,
        ...propScalePayload(),
      })
      withMirrorBatch(() => {
        addProp({ ...payload, x: point.x, z: point.z })
        placeMirroredProp(point.x, point.z, payload)
      })
      return 'success'
    }

    return 'none'
  }

  function handleKeyDown(e) {
    if (state.mode !== 'create') return
    if (e.target.matches('input, textarea, select')) return

    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
      if (toolsState.selectedItem) {
        e.preventDefault()
        copySelected()
      }
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
      e.preventDefault()
      const hover = toolsState.hoverCell
      if (hover) pasteAtPoint(hover)
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
      e.preventDefault()
      undo()
      return
    }
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))
    ) {
      e.preventDefault()
      redo()
      return
    }

    if (e.code === 'KeyR') {
      if (toolsState.selectedItem) {
        e.preventDefault()
        rotateSelected()
        return
      }
      e.preventDefault()
      rotatePreview()
    }
    if (e.code === 'Delete' && toolsState.selectedItem) {
      e.preventDefault()
      deleteSelected()
      return
    }
    if (e.code === 'KeyX' && toolsState.activeTool !== 'select') {
      e.preventDefault()
      cycleMirrorAxis()
      return
    }
    if (e.code === 'KeyG' && PROP_LIKE_TOOLS.includes(toolsState.activeTool)) {
      e.preventDefault()
      cyclePropSnapMode()
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyC') {
      e.preventDefault()
      copyAreaRegionToClipboard()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyV') {
      e.preventDefault()
      importRegionFromClipboard().then(() => {
        const hover = toolsState.hoverCell
        if (hover) pasteRegionAtPoint(hover)
      })
      return
    }
    if (e.code === 'Digit0') {
      setModelSetMode()
      return
    }
    if (e.code === 'Digit4') {
      setTool('erase')
      return
    }
    if (e.code === 'Digit5') {
      setTool('select')
      return
    }
    if (e.code === 'Digit6') {
      setTool('terrain')
      return
    }
    const digitMatch = e.code.match(/^Digit([1-9])$/)
    if (digitMatch) {
      const catIndex = Number.parseInt(digitMatch[1], 10) - 1
      if (catIndex < modelCategories.value.length) {
        setCategory(modelCategories.value[catIndex].id)
      }
      return
    }
    if (e.code === 'Delete' && !toolsState.selectedItem) setTool('erase')
  }

  function countCategoryAssets(categoryId) {
    return resolveCategoryAssets(categoryId).length
  }

  return {
    toolsState: readonly(toolsState),
    isCreateMode,
    activeCategory,
    modelCategories,
    fullToolAssets,
    displayedAssets,
    displayedModelSets,
    isModelSetMode,
    activeModelSet,
    setTool,
    setCategory,
    setModelSetMode,
    selectModelSet,
    clearActiveModelSet,
    selectAsset,
    setActiveStageIndex,
    setSelectedStage,
    setSelectedModelSet,
    getSelectedModelSet,
    getSetsForSelectedItem,
    activePlacementModelSet,
    placementStages,
    setPaletteSearch,
    setPaletteView,
    toggleFavoriteAsset,
    countCategoryAssets,
    togglePropSnap: cyclePropSnapMode,
    cyclePropSnapMode,
    rotatePreview,
    setHoverPoint,
    clearHoverCell,
    setTerrainLowerPreview,
    canPlaceAtPoint,
    applyAtPoint,
    handlePlacementBrushDown,
    handlePlacementBrushMove,
    handlePlacementBrushUp,
    isPlacementBrushing,
    selectAtPoint,
    setScreenItemPicker,
    pickItemAtScreen,
    selectExistingAtPoint,
    selectItemContextAtPoint,
    shouldShowSelectionContext,
    clearSelection,
    rotateSelected,
    deleteSelected,
    getSelectedWorldAnchor,
    getMovePreviewGhostOptions,
    tryStartMoveDrag,
    beginRepositionDrag,
    commitMoveDrag,
    commitRepositionAtPoint,
    cancelMoveDrag,
    isMoveDragging,
    isRepositionPending,
    startReposition,
    cancelReposition,
    getRepositionPreviewGhostOptions,
    canMoveSelectedTo,
    copySelected,
    renameSelected,
    canEditModelSettings,
    canTintSelected,
    setSelectedTintColor,
    setSelectedBlocksPlayer,
    isSelectedHiddenInPlay,
    isSelectedPickable,
    setSelectedHiddenInPlay,
    setSelectedPickable,
    itemBlocksPlayer,
    canScaleSelected,
    getSelectedItemScale,
    scaleSelected,
    stepSelectedScale,
    pasteAtPoint,
    canPasteAtPoint,
    clearPlacementLineAnchor,
    hasClipboard: () => !!clipboard,
    hasRegionClipboard: () => !!regionClipboard,
    rotatedPlacementFootprint,
    getPlacementScale,
    setPlacementScale,
    stepPlacementScale,
    buildingPlacementSpan,
    propSnapLabel,
    startAreaSelect,
    updateAreaSelect,
    clearAreaSelect,
    canEditWanderZone,
    isWanderZoneEditing,
    toggleWanderZoneEdit,
    cancelWanderZoneEdit,
    paintWanderCellAtPoint,
    beginWanderPaintSession,
    endWanderPaintSession,
    setWanderShiftPreview,
    getWanderZoneGhostOptions,
    getSelectedWanderCellCount,
    isSelectedWanderMapWide,
    isSelectedInSea,
    setSelectedWanderMapWide,
    toggleSelectedWanderMapWide,
    isSelectedCreatureSoundEnabled,
    setSelectedCreatureSoundEnabled,
    isSelectedPlayerApproachEnabled,
    setSelectedPlayerApproachEnabled,
    toggleSelectedPlayerApproachEnabled,
    getSelectedViewerAsset,
    copyAreaRegionToClipboard,
    pasteRegionAtPoint,
    getMirrorPoint,
    getMirrorGhostOptions,
    canPlaceAtMirrorPoint,
    cycleMirrorAxis,
    mirrorLabel,
    getSelectionGhostOptions,
    selectedItemData,
    selectedItemLabel,
    handleKeyDown,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
