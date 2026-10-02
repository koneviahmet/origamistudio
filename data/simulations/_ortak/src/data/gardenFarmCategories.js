// Otomatik üretildi — scripts/generate-garden-farm.mjs

export const GARDEN_FARM_CATEGORY_ORDER = [
  'bed',
  'structure',
  'water',
  'tool',
  'decor',
]

export const GARDEN_FARM_CATEGORY_LABELS = {
  bed: 'Tarla & Yatak',
  structure: 'Yapı',
  water: 'Sulama',
  tool: 'Alet & Araç',
  decor: 'Bahçe Dekoru',
}

export function categorizeGardenFarm(id) {
  if (id.startsWith('soil-') || id.startsWith('raised-bed')) return 'bed'
  if (id === 'greenhouse' || id === 'garden-shed' || id === 'compost-bin' || id === 'beehive') {
    return 'structure'
  }
  if (id.startsWith('water-') || id === 'sprinkler' || id === 'watering-can') return 'water'
  if (id === 'wheelbarrow') return 'tool'
  return 'decor'
}

export const GARDEN_FARM_IDS = [
  'beehive',
  'compost-bin',
  'flower-pot',
  'garden-arch',
  'garden-fence',
  'garden-shed',
  'greenhouse',
  'raised-bed',
  'raised-bed-planted',
  'scarecrow',
  'soil-plot',
  'soil-plot-wet',
  'soil-plot-growing',
  'soil-plot-tomato',
  'soil-plot-turnip',
  'soil-plot-corn',
  'soil-plot-broccoli',
  'soil-plot-cabbage',
  'soil-plot-carrot',
  'soil-plot-strawberry',
  'soil-plot-pumpkin',
  'soil-plot-watermelon',
  'soil-plot-rice',
  'sprinkler',
  'water-barrel',
  'water-pump',
  'watering-can',
  'wheelbarrow',
]

export function getGardenFarmCategories() {
  return GARDEN_FARM_CATEGORY_ORDER.map((id) => ({
    id,
    label: GARDEN_FARM_CATEGORY_LABELS[id] ?? id,
  }))
}
