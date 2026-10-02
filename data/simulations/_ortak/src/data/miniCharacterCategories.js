export const MINI_CHARACTER_CATEGORY_ORDER = [
  'male',
  'female',
  'wheelchair',
  'aid',
]

export const MINI_CHARACTER_CATEGORY_LABELS = {
  male: 'Erkek',
  female: 'Kadın',
  wheelchair: 'Tekerlekli Sandalye',
  aid: 'Yardımcı Araç',
}

export function categorizeMiniCharacter(id) {
  if (id.startsWith('character-male-')) return 'male'
  if (id.startsWith('character-female-')) return 'female'
  if (id.startsWith('wheelchair')) return 'wheelchair'
  if (id.startsWith('aid')) return 'aid'
  return 'male'
}

export const MINI_CHARACTER_IDS = [
  'aid-cane',
  'aid-cane-blind',
  'aid-cane-low-vision',
  'aid-crutch',
  'aid-defibrillator-green',
  'aid-defibrillator-red',
  'aid-glasses',
  'aid-mask',
  'aid-sunglasses',
  'aid_hearing',
  'character-female-a',
  'character-female-b',
  'character-female-c',
  'character-female-d',
  'character-female-e',
  'character-female-f',
  'character-male-a',
  'character-male-b',
  'character-male-c',
  'character-male-d',
  'character-male-e',
  'character-male-f',
  'wheelchair',
  'wheelchair-deluxe',
  'wheelchair-power',
  'wheelchair-power-deluxe',
]

export function getMiniCharacterCategories() {
  return MINI_CHARACTER_CATEGORY_ORDER.map((id) => ({
    id,
    label: MINI_CHARACTER_CATEGORY_LABELS[id] ?? id,
  }))
}
