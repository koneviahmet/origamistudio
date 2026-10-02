export const ARCADE_CATEGORY_ORDER = [
  'machine',
  'service',
  'structure',
  'character',
]

export const ARCADE_CATEGORY_LABELS = {
  machine: 'Oyun Makinesi',
  service: 'Hizmet',
  structure: 'Yapı',
  character: 'Karakter',
}

export function categorizeArcade(id) {
  if (id.startsWith('character-')) return 'character'
  if (id === 'floor' || id === 'column' || id.startsWith('wall')) return 'structure'
  if (id === 'cash-register' || id === 'prizes') return 'service'
  return 'machine'
}

export const ARCADE_IDS = [
  'air-hockey',
  'arcade-machine',
  'basketball-game',
  'cash-register',
  'character-employee',
  'character-gamer',
  'claw-machine',
  'column',
  'dance-machine',
  'floor',
  'gambling-machine',
  'pinball',
  'prize-wheel',
  'prizes',
  'ticket-machine',
  'vending-machine',
  'wall',
  'wall-corner',
  'wall-door-rotate',
  'wall-window',
]

export function getArcadeCategories() {
  return ARCADE_CATEGORY_ORDER.map((id) => ({
    id,
    label: ARCADE_CATEGORY_LABELS[id] ?? id,
  }))
}
