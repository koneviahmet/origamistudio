export const CAR_CATEGORY_ORDER = [
  'car',
  'emergency',
  'truck',
  'kart',
  'traffic',
  'debris',
  'wheel',
]

export const CAR_CATEGORY_LABELS = {
  car: 'Otomobil',
  emergency: 'Acil',
  truck: 'Kamyon',
  kart: 'Kart',
  traffic: 'Trafik',
  debris: 'Enkaz',
  wheel: 'Tekerlek',
}

export function getCarCategories() {
  return CAR_CATEGORY_ORDER.map((id) => ({
    id,
    label: CAR_CATEGORY_LABELS[id] ?? id,
  }))
}
