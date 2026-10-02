// Otomatik üretildi — scripts/integrate-animated-enemies.mjs

export const ANIMATED_ENEMIES_CATEGORY_ORDER = [
  'critter',
  'snake',
  'insect',
]

export const ANIMATED_ENEMIES_CATEGORY_LABELS = {
  critter: 'Küçük Canlı',
  snake: 'Yılan',
  insect: 'Böcek & Örümcek',
}

const SNAKE_IDS = new Set(['Snake', 'Snake_angry'])
const INSECT_IDS = new Set(['Wasp', 'Spider'])

export function categorizeAnimatedEnemy(id) {
  if (SNAKE_IDS.has(id)) return 'snake'
  if (INSECT_IDS.has(id)) return 'insect'
  return 'critter'
}

export const ANIMATED_ENEMIES_IDS = [
  "Frog",
  "Rat",
  "Snake",
  "Snake_angry",
  "Spider",
  "Wasp",
]

export function getAnimatedEnemiesCategories() {
  return ANIMATED_ENEMIES_CATEGORY_ORDER.map((id) => ({
    id,
    label: ANIMATED_ENEMIES_CATEGORY_LABELS[id] ?? id,
  }))
}
