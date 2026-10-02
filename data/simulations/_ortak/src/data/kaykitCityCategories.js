export const KAYKIT_CITY_CATEGORY_ORDER = [
  'building',
  'road',
  'street',
]

export const KAYKIT_CITY_CATEGORY_LABELS = {
  building: 'Bina',
  road: 'Yol & Araç',
  street: 'Sokak & Işık',
}

export function categorizeKaykitCity(id) {
  if (id.startsWith('building_')) return 'building'
  if (id.startsWith('road_') || id.startsWith('car_')) return 'road'
  return 'street'
}

export const KAYKIT_CITY_IDS = [
  "base",
  "bench",
  "box_A",
  "box_B",
  "building_A",
  "building_A_withoutBase",
  "building_B",
  "building_B_withoutBase",
  "building_C",
  "building_C_withoutBase",
  "building_D",
  "building_D_withoutBase",
  "building_E",
  "building_E_withoutBase",
  "building_F",
  "building_F_withoutBase",
  "building_G",
  "building_G_withoutBase",
  "building_H",
  "building_H_withoutBase",
  "bush",
  "car_hatchback",
  "car_police",
  "car_sedan",
  "car_stationwagon",
  "car_taxi",
  "dumpster",
  "firehydrant",
  "road_corner",
  "road_corner_curved",
  "road_junction",
  "road_straight",
  "road_straight_crossing",
  "road_tsplit",
  "streetlight",
  "trafficlight_A",
  "trafficlight_B",
  "trafficlight_C",
  "trash_A",
  "trash_B",
  "watertower"
]

export function getKaykitCityCategories() {
  return KAYKIT_CITY_CATEGORY_ORDER.map((id) => ({
    id,
    label: KAYKIT_CITY_CATEGORY_LABELS[id],
    count: KAYKIT_CITY_IDS.filter((assetId) => categorizeKaykitCity(assetId) === id).length,
  }))
}
