// Otomatik üretildi — scripts/integrate-farm-buildings.mjs

export const FARM_BUILDINGS_CATEGORY_ORDER = [
  'barn',
  'storage',
  'utility',
  'fence',
]

export const FARM_BUILDINGS_CATEGORY_LABELS = {
  barn: 'Ahır & Kümes',
  storage: 'Silo & Depo',
  utility: 'Yel Değirmeni & Kuyu',
  fence: 'Çit',
}

const BARN_IDS = new Set(['Barn', 'BigBarn', 'SmallBarn', 'OpenBarn', 'ChickenCoop', 'Silo_House'])
const STORAGE_IDS = new Set(['Silo'])
const FENCE_IDS = new Set(['Fence', 'Fence2'])

export function categorizeFarmBuilding(id) {
  if (BARN_IDS.has(id)) return 'barn'
  if (STORAGE_IDS.has(id)) return 'storage'
  if (FENCE_IDS.has(id)) return 'fence'
  return 'utility'
}

export const FARM_BUILDINGS_IDS = [
  "Barn",
  "BigBarn",
  "ChickenCoop",
  "Fence",
  "Fence2",
  "OpenBarn",
  "Silo",
  "Silo_House",
  "SmallBarn",
  "TowerWindmill",
  "WaterTower",
  "Well",
  "Windmill",
]

export function getFarmBuildingsCategories() {
  return FARM_BUILDINGS_CATEGORY_ORDER.map((id) => ({
    id,
    label: FARM_BUILDINGS_CATEGORY_LABELS[id] ?? id,
  }))
}
