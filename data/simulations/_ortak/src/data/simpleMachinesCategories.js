// Otomatik üretildi — scripts/generate-simple-machines.mjs

export const SIMPLE_MACHINES_CATEGORY_ORDER = [
  'lever',
  'pulley',
  'incline',
  'wheel',
  'info',
]

export const SIMPLE_MACHINES_CATEGORY_LABELS = {
  lever: 'Kaldıraç',
  pulley: 'Makara & Palanga',
  incline: 'Eğik Düzlem & Vida',
  wheel: 'Çıkrık & Çark',
  info: 'Bilgi',
}

export function categorizeSimpleMachines(id) {
  if (id.startsWith('lever-')) return 'lever'
  if (id.startsWith('pulley-')) return 'pulley'
  if (id.startsWith('ramp-') || id.startsWith('wedge-') || id.startsWith('screw-')) return 'incline'
  if (id.startsWith('wheel-') || id.startsWith('water-') || id.startsWith('gear-')) return 'wheel'
  return 'info'
}

export const SIMPLE_MACHINES_IDS = [
  'gear-station',
  'info-board-machines',
  'lever-crowbar-rock',
  'lever-seesaw',
  'pulley-crane',
  'pulley-fixed',
  'pulley-flagpole',
  'pulley-movable',
  'ramp-inclined-plane',
  'ramp-loading-dock',
  'screw-archimedes',
  'screw-jack',
  'water-wheel',
  'wedge-axe-log',
  'wheel-axle-well',
]

export function getSimpleMachinesCategories() {
  return SIMPLE_MACHINES_CATEGORY_ORDER.map((id) => ({
    id,
    label: SIMPLE_MACHINES_CATEGORY_LABELS[id] ?? id,
  }))
}
