export const MINI_SKATE_CATEGORY_ORDER = [
  'park',
  'character',
  'gear',
]

export const MINI_SKATE_CATEGORY_LABELS = {
  park: 'Park & Ramp',
  character: 'Karakter',
  gear: 'Ekipman',
}

export function categorizeMiniSkate(id) {
  if (id.startsWith('character-')) return 'character'
  if (id === 'skateboard') return 'gear'
  return 'park'
}

export const MINI_SKATE_IDS = [
  'bowl-corner-inner',
  'bowl-corner-outer',
  'bowl-side',
  'character-skate-boy',
  'character-skate-girl',
  'floor-concrete',
  'floor-wood',
  'half-pipe',
  'obstacle-box',
  'obstacle-end',
  'obstacle-middle',
  'pallet',
  'rail-curve',
  'rail-high',
  'rail-low',
  'rail-slope',
  'skateboard',
  'steps',
  'structure-platform',
  'structure-wood',
]

export function getMiniSkateCategories() {
  return MINI_SKATE_CATEGORY_ORDER.map((id) => ({
    id,
    label: MINI_SKATE_CATEGORY_LABELS[id] ?? id,
  }))
}
