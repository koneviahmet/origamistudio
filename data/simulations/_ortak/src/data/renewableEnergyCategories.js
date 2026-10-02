// Otomatik üretildi — scripts/generate-renewable-energy.mjs

export const RENEWABLE_ENERGY_CATEGORY_ORDER = [
  'wind',
  'solar',
  'water',
  'plant',
  'infra',
]

export const RENEWABLE_ENERGY_CATEGORY_LABELS = {
  wind: 'Rüzgar',
  solar: 'Güneş',
  water: 'Su & Arıtma',
  plant: 'Enerji Tesisi',
  infra: 'Altyapı & Bilgi',
}

export function categorizeRenewableEnergy(id) {
  if (id.startsWith('wind-')) return 'wind'
  if (id.startsWith('solar-')) return 'solar'
  if (id.startsWith('water-') || id.startsWith('clarifier-')) return 'water'
  if (id.startsWith('hydro-') || id.startsWith('biogas-')) return 'plant'
  return 'infra'
}

export const RENEWABLE_ENERGY_IDS = [
  "battery-storage",
  "biogas-plant",
  "clarifier-tank",
  "hydro-dam-small",
  "info-board-energy",
  "inverter-box",
  "solar-array-4",
  "solar-farm",
  "solar-panel-single",
  "water-treatment-main",
  "wind-turbine",
  "wind-turbine-small",
]

export function getRenewableEnergyCategories() {
  return RENEWABLE_ENERGY_CATEGORY_ORDER.map((id) => ({
    id,
    label: RENEWABLE_ENERGY_CATEGORY_LABELS[id] ?? id,
  }))
}
