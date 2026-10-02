export const WATERCRAFT_CATEGORY_ORDER = [
  'boat',
  'ship',
  'dock',
]

export const WATERCRAFT_CATEGORY_LABELS = {
  boat: 'Tekne',
  ship: 'Gemi & Kargo',
  dock: 'İskele & Şamandıra',
}

export function categorizeWatercraft(id) {
  if (
    id.startsWith('boat-speed') || id.startsWith('boat-sail') ||
    id.startsWith('boat-row') || id.startsWith('boat-fishing') || id === 'boat-fan' ||
    id.startsWith('boat-house') || id.startsWith('boat-tow') || id.startsWith('boat-tug')
  ) return 'boat'
  if (id.startsWith('ship-') || id.startsWith('cargo-')) return 'ship'
  return 'dock'
}

export const WATERCRAFT_IDS = [
  "arrow",
  "arrow-standing",
  "boat-fan",
  "boat-fishing-small",
  "boat-house-a",
  "boat-house-b",
  "boat-house-c",
  "boat-house-d",
  "boat-row-large",
  "boat-row-small",
  "boat-sail-a",
  "boat-sail-b",
  "boat-speed-a",
  "boat-speed-b",
  "boat-speed-c",
  "boat-speed-d",
  "boat-speed-e",
  "boat-speed-f",
  "boat-speed-g",
  "boat-speed-h",
  "boat-speed-i",
  "boat-speed-j",
  "boat-tow-a",
  "boat-tow-b",
  "boat-tug-a",
  "boat-tug-b",
  "boat-tug-c",
  "buoy",
  "buoy-flag",
  "cargo-container-a",
  "cargo-container-b",
  "cargo-container-c",
  "cargo-pile-a",
  "cargo-pile-b",
  "gate",
  "gate-finish",
  "ramp",
  "ramp-wide",
  "ship-cargo-a",
  "ship-cargo-b",
  "ship-cargo-c",
  "ship-large",
  "ship-ocean-liner",
  "ship-ocean-liner-small",
  "ship-small",
  "ship-small-ghost"
]

export function getWatercraftCategories() {
  return WATERCRAFT_CATEGORY_ORDER.map((id) => ({
    id,
    label: WATERCRAFT_CATEGORY_LABELS[id],
    count: WATERCRAFT_IDS.filter((assetId) => categorizeWatercraft(assetId) === id).length,
  }))
}
