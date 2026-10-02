// Otomatik üretildi — scripts/integrate-city-industrial.mjs

export const CITY_INDUSTRIAL_CATEGORY_ORDER = [
  'building',
  'chimney',
  'detail',
]

export const CITY_INDUSTRIAL_CATEGORY_LABELS = {
  building: 'Fabrika & Depo',
  chimney: 'Baca',
  detail: 'Detay',
}

export function categorizeCityIndustrial(id) {
  if (id.startsWith('building-')) return 'building'
  if (id.startsWith('chimney-')) return 'chimney'
  return 'detail'
}

export const CITY_INDUSTRIAL_IDS = [
  "building-a",
  "building-b",
  "building-c",
  "building-d",
  "building-e",
  "building-f",
  "building-g",
  "building-h",
  "building-i",
  "building-j",
  "building-k",
  "building-l",
  "building-m",
  "building-n",
  "building-o",
  "building-p",
  "building-q",
  "building-r",
  "building-s",
  "building-t",
  "chimney-basic",
  "chimney-large",
  "chimney-medium",
  "chimney-small",
  "detail-tank",
]

export function getCityIndustrialCategories() {
  return CITY_INDUSTRIAL_CATEGORY_ORDER.map((id) => ({
    id,
    label: CITY_INDUSTRIAL_CATEGORY_LABELS[id] ?? id,
  }))
}
