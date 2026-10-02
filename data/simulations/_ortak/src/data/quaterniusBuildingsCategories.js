// Otomatik üretildi — scripts/integrate-quaternius-packs.mjs

export const QUATERNIUS_BUILDINGS_CATEGORY_ORDER = [
  'house',
  'apartment',
  'commercial',
  'public',
]

export const QUATERNIUS_BUILDINGS_CATEGORY_LABELS = {
  house: 'Ev',
  apartment: 'Apartman',
  commercial: 'Dükkan & Banka',
  public: 'Kamu Binası',
}
export function categorizeQuaterniusBuilding(id) {
  if (/^House/i.test(id)) return 'house'
  if (/^Flat/i.test(id)) return 'apartment'
  if (id === 'Shop' || id === 'Bank') return 'commercial'
  if (id === 'Hospital') return 'public'
  return 'building'
}

export const QUATERNIUS_BUILDINGS_IDS = [
  "Bank",
  "Flat",
  "Flat2",
  "Hospital",
  "House",
  "House2",
  "House3",
  "House4",
  "House5",
  "Shop",
]

export function getQuaterniusBuildingsCategories() {
  return QUATERNIUS_BUILDINGS_CATEGORY_ORDER.map((id) => ({
    id,
    label: QUATERNIUS_BUILDINGS_CATEGORY_LABELS[id] ?? id,
  }))
}
