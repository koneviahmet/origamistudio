export const FANTASY_CATEGORY_ORDER = [
  'vegetation',
  'building',
  'urban',
  'decor',
]

export const FANTASY_CATEGORY_LABELS = {
  vegetation: 'Ağaç & Çit',
  building: 'Duvar & Çatı',
  urban: 'Yol & Çeşme',
  decor: 'Dekor',
}

export function getFantasyCategories() {
  return FANTASY_CATEGORY_ORDER.map((id) => ({
    id,
    label: FANTASY_CATEGORY_LABELS[id] ?? id,
  }))
}
