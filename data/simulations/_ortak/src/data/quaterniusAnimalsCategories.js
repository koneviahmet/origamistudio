// Otomatik üretildi — scripts/integrate-quaternius-packs.mjs

export const QUATERNIUS_ANIMALS_CATEGORY_ORDER = [
  'mammal',
  'bird',
  'aquatic',
]

export const QUATERNIUS_ANIMALS_CATEGORY_LABELS = {
  mammal: 'Memeli',
  bird: 'Kuş',
  aquatic: 'Su Canlısı',
}
export function categorizeQuaterniusAnimal(id) {
  if (/bird|Chick/i.test(id)) return 'bird'
  if (/Fish|Whale/i.test(id)) return 'aquatic'
  return 'mammal'
}

export const QUATERNIUS_ANIMALS_IDS = [
  "Chick",
  "Fish",
  "Red_Fox",
  "Whale",
  "bird",
]

export function getQuaterniusAnimalsCategories() {
  return QUATERNIUS_ANIMALS_CATEGORY_ORDER.map((id) => ({
    id,
    label: QUATERNIUS_ANIMALS_CATEGORY_LABELS[id] ?? id,
  }))
}
