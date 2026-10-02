// Otomatik üretildi — scripts/generate-primitives.mjs

export const PRIMITIVES_CATEGORY_ORDER = ['shapes']

export const PRIMITIVES_CATEGORY_LABELS = {
  shapes: 'Şekiller',
}

export function categorizePrimitives(id) {
  if (id === 'sphere') return 'shapes'
  return 'shapes'
}

export const PRIMITIVES_IDS = ['sphere']

export const PRIMITIVES_LABELS = {
  sphere: 'Küre',
}

export function getPrimitivesCategories() {
  return PRIMITIVES_CATEGORY_ORDER.map((id) => ({
    id,
    label: PRIMITIVES_CATEGORY_LABELS[id] ?? id,
  }))
}
