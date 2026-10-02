export const COASTER_CATEGORY_ORDER = [
  'track',
  'train',
  'venue',
  'decor',
]

export const COASTER_CATEGORY_LABELS = {
  track: 'Ray & Hat',
  train: 'Tren',
  venue: 'İstasyon & Kuyruk',
  decor: 'Dekor',
}

export function getCoasterCategories() {
  return COASTER_CATEGORY_ORDER.map((id) => ({
    id,
    label: COASTER_CATEGORY_LABELS[id] ?? id,
  }))
}
