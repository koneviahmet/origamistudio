// Otomatik üretildi — scripts/generate-science-city.mjs

export const SCIENCE_CITY_CATEGORY_ORDER = [
  'bio',
  'chem',
  'physics',
  'earth',
  'health',
]

export const SCIENCE_CITY_CATEGORY_LABELS = {
  bio: 'Canlılar & Çevre',
  chem: 'Madde & Kimya',
  physics: 'Fiziksel Olaylar',
  earth: 'Yer Bilimleri',
  health: 'Sağlık',
}

const CATEGORY_BY_ID = {
  greenhouse: 'bio',
  'botanical-garden': 'bio',
  'eco-park-gate': 'bio',
  'observation-tower': 'bio',
  'recycling-center': 'chem',
  'recycle-bins': 'chem',
  'pharmacy-lab': 'chem',
  'ferris-wheel': 'physics',
  observatory: 'physics',
  'optic-mirror': 'physics',
  'sound-studio': 'physics',
  'info-board-science': 'physics',
  'weather-station': 'earth',
  'health-center': 'health',
}

export function categorizeScienceCity(id) {
  return CATEGORY_BY_ID[id] ?? 'physics'
}

export const SCIENCE_CITY_IDS = [
  'botanical-garden',
  'eco-park-gate',
  'ferris-wheel',
  'greenhouse',
  'health-center',
  'info-board-science',
  'observation-tower',
  'observatory',
  'optic-mirror',
  'pharmacy-lab',
  'recycle-bins',
  'recycling-center',
  'sound-studio',
  'weather-station',
]

export function getScienceCityCategories() {
  return SCIENCE_CITY_CATEGORY_ORDER.map((id) => ({
    id,
    label: SCIENCE_CITY_CATEGORY_LABELS[id] ?? id,
  }))
}
