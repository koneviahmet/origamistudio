export const TRAIN_CATEGORY_ORDER = [
  'rail',
  'rolling',
]

export const TRAIN_CATEGORY_LABELS = {
  rail: 'Ray & Hat',
  rolling: 'Lokomotif & Vagon',
}

export function getTrainCategories() {
  return TRAIN_CATEGORY_ORDER.map((id) => ({
    id,
    label: TRAIN_CATEGORY_LABELS[id] ?? id,
  }))
}
