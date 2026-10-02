// Otomatik üretildi — scripts/integrate-cube-pets.mjs

export const CUBE_PETS_CATEGORY_ORDER = [
  'mammal',
  'bird',
  'aquatic',
  'insect',
]

export const CUBE_PETS_CATEGORY_LABELS = {
  mammal: 'Memeli',
  bird: 'Kuş',
  aquatic: 'Su Canlısı',
  insect: 'Böcek',
}

const BIRD_IDS = new Set(['animal-chick', 'animal-parrot', 'animal-penguin'])
const AQUATIC_IDS = new Set(['animal-crab', 'animal-fish'])
const INSECT_IDS = new Set(['animal-bee', 'animal-caterpillar'])

export function categorizeCubePet(id) {
  if (BIRD_IDS.has(id)) return 'bird'
  if (AQUATIC_IDS.has(id)) return 'aquatic'
  if (INSECT_IDS.has(id)) return 'insect'
  return 'mammal'
}

export const CUBE_PETS_IDS = [
  "animal-beaver",
  "animal-bee",
  "animal-bunny",
  "animal-cat",
  "animal-caterpillar",
  "animal-chick",
  "animal-cow",
  "animal-crab",
  "animal-deer",
  "animal-dog",
  "animal-elephant",
  "animal-fish",
  "animal-fox",
  "animal-giraffe",
  "animal-hog",
  "animal-koala",
  "animal-lion",
  "animal-monkey",
  "animal-panda",
  "animal-parrot",
  "animal-penguin",
  "animal-polar",
  "animal-tiger",
]

export function getCubePetsCategories() {
  return CUBE_PETS_CATEGORY_ORDER.map((id) => ({
    id,
    label: CUBE_PETS_CATEGORY_LABELS[id] ?? id,
  }))
}
