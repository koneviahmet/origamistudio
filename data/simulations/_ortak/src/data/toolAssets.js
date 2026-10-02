import { ASSET_CATALOG } from './asset-catalog.js'
import { KAYKIT_EXTRA_PACK_IDS } from './kaykitExtraPacks.js'

const KAYKIT_PACKS = new Set(['kaykit-city', ...KAYKIT_EXTRA_PACK_IDS])

export const PLACEMENT_TOOLS = ['road', 'building', 'prop', 'vehicle', 'figur', 'food']

export const PROP_LIKE_TOOLS = ['prop', 'vehicle', 'figur', 'food']

export const PLACEMENT_TOOL_LABELS = {
  road: 'Yol',
  building: 'Bina',
  prop: 'Dekor',
  vehicle: 'Araç',
  figur: 'Figür',
  food: 'Yemek',
}

/** Yerleştirme aracının seçebileceği katman (road / building / prop). */
export const LAYER_BY_PLACEMENT_TOOL = {
  road: 'road',
  building: 'building',
  prop: 'prop',
  vehicle: 'prop',
  figur: 'prop',
  food: 'prop',
}

export function placementToolLayer(tool) {
  return LAYER_BY_PLACEMENT_TOOL[tool] ?? null
}

export function placementToolMatchesLayer(tool, layer) {
  return placementToolLayer(tool) === layer
}

const ROAD_LIKE_PREFIXES = ['road', 'driveway', 'path', 'railroad', 'corridor', 'bridge']

function isRoadLikeId(id) {
  return ROAD_LIKE_PREFIXES.some(
    (prefix) => id === prefix || id.startsWith(`${prefix}-`) || id.startsWith(`${prefix}_`),
  )
}

/** Her modeli 6 ana yerleştirme aracından birine atar. */
export function classifyAssetTool(asset) {
  const { pack, id, category } = asset

  if (pack === 'food' || pack === 'crops') return 'food'
  if (pack === 'mini-characters' || pack === 'characters') return 'figur'
  if (pack === 'cars') return 'vehicle'
  if (pack === 'road-tiles') return 'road'

  if (pack === 'watercraft') {
    return category === 'dock' ? 'prop' : 'vehicle'
  }

  if (pack === 'train') {
    return category === 'rolling' ? 'vehicle' : 'road'
  }

  if (pack === 'coaster') {
    if (category === 'track') return 'road'
    if (category === 'train') return 'vehicle'
    return 'prop'
  }

  if (pack === 'racing') {
    if (category === 'track') return 'road'
    if (category === 'vehicle') return 'vehicle'
    if (category === 'venue') return 'building'
    return 'prop'
  }

  if (KAYKIT_PACKS.has(pack)) {
    if (category === 'road') return 'road'
    if (category === 'building') return 'building'
    if (category === 'food') return 'food'
    if (category === 'figur') return 'figur'
    if (category === 'vehicle') return 'vehicle'
    return 'prop'
  }

  if (pack === 'city-roads') {
    return category === 'urban' ? 'prop' : 'road'
  }

  if (pack === 'suburban') {
    if (category === 'building') return 'building'
    if (id.startsWith('path') || id.startsWith('driveway')) return 'road'
    return 'prop'
  }

  if (pack === 'city-industrial') {
    if (category === 'building' || category === 'chimney') return 'building'
    return 'prop'
  }

  if (pack === 'fantasy-town') {
    if (category === 'building') return 'building'
    if (isRoadLikeId(id)) return 'road'
    return 'prop'
  }

  if (pack === 'holiday') {
    return category === 'building' ? 'building' : 'prop'
  }

  if (pack === 'space') {
    if (category === 'structure') return 'building'
    if (category === 'transport') return 'vehicle'
    if (category === 'character') return 'figur'
    return 'prop'
  }

  if (pack === 'nature') {
    if (category === 'structure' && (id.startsWith('bridge_') || id.startsWith('path_'))) {
      return 'road'
    }
    return 'prop'
  }

  if (pack === 'arcade') {
    if (category === 'character') return 'figur'
    if (category === 'structure') return 'building'
    return 'prop'
  }

  if (pack === 'mini-arena') {
    if (category === 'character') return 'figur'
    if (category === 'structure') return 'building'
    return 'prop'
  }

  if (pack === 'mini-skate') {
    return category === 'character' ? 'figur' : 'prop'
  }

  if (pack === 'leap-land') {
    if (category === 'terrain' && (id.startsWith('trail_') || id.startsWith('ground_'))) {
      return 'road'
    }
    return 'prop'
  }

  if (pack === 'voxel-park') {
    if (category === 'animal') return 'figur'
    if (category === 'bike') return 'vehicle'
    if (category === 'food') return 'food'
    if (category === 'path') return 'road'
    return 'prop'
  }

  if (pack === 'renewable-energy') {
    // Büyük tesisler ızgaraya oturan binalar; direkler ve kabinler serbest dekor
    if (
      id === 'solar-farm' || id === 'solar-array-4' ||
      id === 'water-treatment-main' || id === 'hydro-dam-small' ||
      id === 'biogas-plant'
    ) {
      return 'building'
    }
    return 'prop'
  }

  if (pack === 'science-city') {
    // Tesis ölçeğindeki modeller bina; kapı, kule, pano ve kutular serbest dekor
    if (
      id === 'greenhouse' || id === 'botanical-garden' ||
      id === 'recycling-center' || id === 'pharmacy-lab' ||
      id === 'ferris-wheel' || id === 'observatory' ||
      id === 'sound-studio' || id === 'weather-station' ||
      id === 'health-center'
    ) {
      return 'building'
    }
    return 'prop'
  }

  if (pack === 'garden-farm') {
    // Büyük yapılar ızgaraya oturan binalar; küçük öğeler serbest dekor
    if (id === 'greenhouse' || id === 'garden-shed') return 'building'
    return 'prop'
  }

  if (pack === 'school-lab') {
    // Mobilya ölçeğindeki parçalar bina gibi ızgaraya oturur; aletler serbest dekor
    if (
      id === 'lab-table' || id === 'lab-cabinet' ||
      id === 'periodic-table-board' || id === 'microscope-on-table' ||
      id === 'computer-on-table'
    ) {
      return 'building'
    }
    return 'prop'
  }

  if (pack === 'primitives') return 'prop'

  if (pack === 'simple-machines') {
    // Tesis ölçeğindeki düzenekler ızgaraya oturan binalar; küçük aletler serbest dekor
    if (
      id === 'pulley-crane' || id === 'ramp-loading-dock' ||
      id === 'wheel-axle-well' || id === 'water-wheel' ||
      id === 'ramp-inclined-plane'
    ) {
      return 'building'
    }
    return 'prop'
  }

  if (pack === 'survival-pack') return 'prop'

  if (pack === 'ultimate-food') return 'food'

  if (pack === 'textured-buildings') {
    if (category === 'modular_part') return 'prop'
    return 'building'
  }

  if (pack === 'quaternius-buildings') return 'building'

  if (pack === 'quaternius-animals') return 'figur'

  if (pack === 'cube-pets') return 'figur'

  if (pack === 'animated-enemies') return 'figur'

  if (pack === 'farm-buildings') {
    if (category === 'fence') return 'prop'
    return 'building'
  }

  if (pack === 'pond-kit') {
    if (category === 'wildlife') return 'figur'
    return 'prop'
  }

  return 'prop'
}

const ALL_ASSETS = Object.values(ASSET_CATALOG).flat()

export const TOOL_ASSETS = Object.fromEntries(
  PLACEMENT_TOOLS.map((tool) => [
    tool,
    ALL_ASSETS.filter((asset) => classifyAssetTool(asset) === tool),
  ]),
)

export function getAssetsForTool(tool) {
  return TOOL_ASSETS[tool] ?? []
}

export function findAssetInTool(tool, pack, assetId) {
  return getAssetsForTool(tool).find((a) => a.pack === pack && a.id === assetId) ?? null
}
