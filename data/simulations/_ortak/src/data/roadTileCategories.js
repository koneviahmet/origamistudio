const COLS = 16

export const ROAD_CATEGORY_LABELS = {
  ground: 'Zemin',
  straight: 'Düz',
  corner: 'Köşe',
  't-junction': 'T Kavşağı',
  crossroad: 'Kavşak',
  slope: 'Eğim',
  elevated: 'Yükselti',
  structure: 'Yapı',
}

export const ROAD_CATEGORY_ORDER = [
  'straight',
  'corner',
  't-junction',
  'crossroad',
  'slope',
  'elevated',
  'ground',
  'structure',
]

/** Kenney 3D Road Tiles önizleme ızgarasına göre satır bazlı kategori. */
export function categorizeRoadTile(id) {
  const num = parseInt(id.replace('roadTile_', ''), 10)
  const row = Math.floor((num - 1) / COLS)

  if (row <= 1) return 'ground'
  if (row <= 4) return 'straight'
  if (row <= 6) return 'corner'
  if (row <= 8) return 't-junction'
  if (row <= 9) return 'crossroad'
  if (row <= 12) return 'slope'
  if (row <= 14) return 'elevated'
  return 'structure'
}

export function getRoadCategories() {
  return ROAD_CATEGORY_ORDER.map((id) => ({
    id,
    label: ROAD_CATEGORY_LABELS[id],
  }))
}
