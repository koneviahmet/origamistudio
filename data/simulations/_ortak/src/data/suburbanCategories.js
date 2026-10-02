export const SUBURBAN_CATEGORY_ORDER = [
  'building',
  'outdoor',
  'decor',
]

export const SUBURBAN_CATEGORY_LABELS = {
  building: 'Binalar',
  outdoor: 'Bahçe & Yol',
  decor: 'Dekor',
}

export function getSuburbanCategories() {
  return SUBURBAN_CATEGORY_ORDER.map((id) => ({
    id,
    label: SUBURBAN_CATEGORY_LABELS[id],
  }))
}
