// Otomatik üretildi — scripts/integrate-mini-arena.mjs

export const MINI_ARENA_CATEGORY_ORDER = [
  'structure',
  'decor',
  'weapon',
  'character',
]

export const MINI_ARENA_CATEGORY_LABELS = {
  structure: 'Yapı',
  decor: 'Dekor',
  weapon: 'Silah',
  character: 'Karakter',
}

export function categorizeMiniArena(id) {
  if (id.startsWith('character-')) return 'character'
  if (id.startsWith('weapon-')) return 'weapon'
  if (
    id === 'banner' ||
    id === 'statue' ||
    id === 'trophy' ||
    id === 'tree'
  ) {
    return 'decor'
  }
  return 'structure'
}

export const MINI_ARENA_IDS = [
  "banner",
  "block",
  "border-corner",
  "border-straight",
  "bricks",
  "character-soldier",
  "column-damaged",
  "column",
  "floor-detail",
  "floor",
  "stairs-corner-inner",
  "stairs-corner",
  "stairs",
  "statue",
  "tree",
  "trophy",
  "wall-corner",
  "wall-gate",
  "wall",
  "weapon-rack",
  "weapon-spear",
  "weapon-sword",
]

export function getMiniArenaCategories() {
  return MINI_ARENA_CATEGORY_ORDER.map((id) => ({
    id,
    label: MINI_ARENA_CATEGORY_LABELS[id] ?? id,
  }))
}
