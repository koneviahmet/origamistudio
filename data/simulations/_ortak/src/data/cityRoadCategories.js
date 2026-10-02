export const CITY_ROAD_CATEGORY_ORDER = [
  'road',
  'special',
  'urban',
]

export const CITY_ROAD_CATEGORY_LABELS = {
  road: 'Yol Parçası',
  special: 'Köprü & Eğim',
  urban: 'Işık & Tabela',
}

export function getCityRoadCategories() {
  return CITY_ROAD_CATEGORY_ORDER.map((id) => ({
    id,
    label: CITY_ROAD_CATEGORY_LABELS[id] ?? id,
  }))
}
