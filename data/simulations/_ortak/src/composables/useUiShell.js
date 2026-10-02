import { reactive, readonly, computed } from 'vue'

export const CREATE_HUD_PANEL_IDS = [
  'topBar',
  'bottomRail',
  'sidebar',
  'navHub',
  'camera',
  'blockContext',
]

export const CREATE_HUD_PANELS = [
  { id: 'topBar', label: 'Üst çubuk', icon: 'menu' },
  { id: 'bottomRail', label: 'Alt araç çubuğu', icon: 'grid' },
  { id: 'sidebar', label: 'Parça listesi', icon: 'layers' },
  { id: 'navHub', label: 'Minimap', icon: 'map' },
  { id: 'camera', label: 'Kamera araçları', icon: 'camera' },
  { id: 'blockContext', label: 'Seçim çubuğu', icon: 'select' },
]

const PANEL_VISIBILITY_KEY = 'city-panel-visibility'

function normalizePanelFlag(value, fallback = true) {
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  return fallback
}

function defaultPanelVisibility() {
  return Object.fromEntries(CREATE_HUD_PANEL_IDS.map((id) => [id, true]))
}

function loadPanelVisibility() {
  const defaults = defaultPanelVisibility()
  try {
    const raw = localStorage.getItem(PANEL_VISIBILITY_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return defaults
    return Object.fromEntries(
      CREATE_HUD_PANEL_IDS.map((id) => [id, normalizePanelFlag(parsed[id], defaults[id])]),
    )
  } catch {
    return defaults
  }
}

function persistPanelVisibility(state) {
  localStorage.setItem(PANEL_VISIBILITY_KEY, JSON.stringify(state))
}

const uiState = reactive({
  projectMenuOpen: false,
  settingsMenuOpen: false,
  helpOpen: false,
  panelsMenuOpen: false,
  panelVisibility: loadPanelVisibility(),
  gridVisible: localStorage.getItem('city-grid-visible') !== '0',
  buildSidebarOpen: localStorage.getItem('city-build-sidebar') !== '0',
  cameraToolbarOpen: localStorage.getItem('city-camera-toolbar') === '1',
  layerVisibility: {
    roads: true,
    buildings: true,
    props: true,
  },
})

export function useUiShell() {
  const panelVisibility = computed(() => uiState.panelVisibility)

  const allPanelsVisible = computed(() =>
    CREATE_HUD_PANEL_IDS.every((id) => uiState.panelVisibility[id] === true),
  )

  const anyPanelHidden = computed(() =>
    CREATE_HUD_PANEL_IDS.some((id) => uiState.panelVisibility[id] !== true),
  )

  function setProjectMenuOpen(open) {
    uiState.projectMenuOpen = open
    if (open) {
      uiState.settingsMenuOpen = false
      uiState.panelsMenuOpen = false
    }
  }

  function toggleProjectMenu() {
    uiState.projectMenuOpen = !uiState.projectMenuOpen
    if (uiState.projectMenuOpen) {
      uiState.settingsMenuOpen = false
      uiState.panelsMenuOpen = false
    }
  }

  function setSettingsMenuOpen(open) {
    uiState.settingsMenuOpen = open
    if (open) {
      uiState.projectMenuOpen = false
      uiState.panelsMenuOpen = false
    }
  }

  function toggleSettingsMenu() {
    setSettingsMenuOpen(!uiState.settingsMenuOpen)
  }

  function setPanelsMenuOpen(open) {
    uiState.panelsMenuOpen = open
    if (open) {
      uiState.projectMenuOpen = false
      uiState.settingsMenuOpen = false
    }
  }

  function togglePanelsMenu() {
    setPanelsMenuOpen(!uiState.panelsMenuOpen)
  }

  function toggleHelp() {
    uiState.helpOpen = !uiState.helpOpen
  }

  function closeOverlays() {
    uiState.projectMenuOpen = false
    uiState.settingsMenuOpen = false
    uiState.helpOpen = false
    uiState.panelsMenuOpen = false
  }

  function isPanelVisible(panelId) {
    return uiState.panelVisibility[panelId] === true
  }

  function setPanelVisibility(panelId, visible) {
    if (!(panelId in uiState.panelVisibility)) return
    uiState.panelVisibility[panelId] = visible
    persistPanelVisibility(uiState.panelVisibility)
  }

  function togglePanelVisibility(panelId) {
    setPanelVisibility(panelId, !isPanelVisible(panelId))
    return isPanelVisible(panelId)
  }

  function showAllPanels() {
    CREATE_HUD_PANEL_IDS.forEach((id) => {
      uiState.panelVisibility[id] = true
    })
    persistPanelVisibility(uiState.panelVisibility)
  }

  function hideAllPanels() {
    CREATE_HUD_PANEL_IDS.forEach((id) => {
      uiState.panelVisibility[id] = false
    })
    persistPanelVisibility(uiState.panelVisibility)
    closeOverlays()
  }

  function toggleCreateHud() {
    if (allPanelsVisible.value) {
      hideAllPanels()
    } else {
      showAllPanels()
    }
    return allPanelsVisible.value
  }

  function toggleGrid() {
    uiState.gridVisible = !uiState.gridVisible
    localStorage.setItem('city-grid-visible', uiState.gridVisible ? '1' : '0')
    return uiState.gridVisible
  }

  function toggleLayerVisibility(layer) {
    if (layer in uiState.layerVisibility) {
      uiState.layerVisibility[layer] = !uiState.layerVisibility[layer]
    }
    return { ...uiState.layerVisibility }
  }

  function toggleBuildSidebar() {
    uiState.buildSidebarOpen = !uiState.buildSidebarOpen
    localStorage.setItem('city-build-sidebar', uiState.buildSidebarOpen ? '1' : '0')
    return uiState.buildSidebarOpen
  }

  function toggleCameraToolbar() {
    uiState.cameraToolbarOpen = !uiState.cameraToolbarOpen
    localStorage.setItem('city-camera-toolbar', uiState.cameraToolbarOpen ? '1' : '0')
    return uiState.cameraToolbarOpen
  }

  return {
    uiState: readonly(uiState),
    panelVisibility,
    allPanelsVisible,
    anyPanelHidden,
    setProjectMenuOpen,
    toggleProjectMenu,
    setSettingsMenuOpen,
    toggleSettingsMenu,
    setPanelsMenuOpen,
    togglePanelsMenu,
    closeOverlays,
    toggleHelp,
    toggleGrid,
    toggleBuildSidebar,
    toggleCameraToolbar,
    isPanelVisible,
    setPanelVisibility,
    togglePanelVisibility,
    showAllPanels,
    hideAllPanels,
    toggleCreateHud,
    toggleLayerVisibility,
  }
}
