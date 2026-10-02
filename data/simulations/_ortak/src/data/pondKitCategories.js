// Otomatik üretildi — scripts/integrate-pond-kit.mjs

export const POND_KIT_CATEGORY_ORDER = [
  'pond',
  'vegetation',
  'terrain',
  'container',
  'wildlife',
  'decor',
]

export const POND_KIT_CATEGORY_LABELS = {
  pond: 'Gölet',
  vegetation: 'Su Bitkileri & Çimen',
  terrain: 'Kaya & Çakıl',
  container: 'Küvet & Saksı',
  wildlife: 'Kuş & Kurbağa',
  decor: 'Dekor',
}

export function categorizePondKit(id) {
  if (id.startsWith('pond_')) return 'pond'
  if (
    id.startsWith('bird_') || id.startsWith('frog_') || id.startsWith('dragonfly_')
  ) return 'wildlife'
  if (
    id.startsWith('water_lily_') || id.startsWith('water_hyacinth_') ||
    id.startsWith('water_lettuce_') || id.startsWith('water_mint_') ||
    id.startsWith('swamp_calla_') || id.startsWith('cattail_') ||
    id.startsWith('mini_plant_') || id.startsWith('branch_') ||
    id.startsWith('long_grass_patch_') || id.startsWith('short_grass_patch_')
  ) return 'vegetation'
  if (id.startsWith('rock_') || id.startsWith('pebble_')) return 'terrain'
  if (
    id === 'bathtub' || id === 'clay_pot' || id === 'metal_tub' || id === 'wooden_tub'
  ) return 'container'
  return 'decor'
}

export const POND_KIT_IDS = [
  "bathtub",
  "bird_1",
  "bird_2",
  "bird_3",
  "branch_1a",
  "branch_1b",
  "branch_2a",
  "branch_2b",
  "branch_3a",
  "branch_3b",
  "cattail_1",
  "cattail_2",
  "cattail_3",
  "clay_pot",
  "dragonfly_1",
  "dragonfly_2",
  "dragonfly_3",
  "frog_1",
  "frog_2",
  "frog_3",
  "long_grass_patch_1",
  "long_grass_patch_2",
  "metal_tub",
  "mini_plant_1",
  "mini_plant_2",
  "mini_plant_3",
  "pebble_1a",
  "pebble_1a_moss",
  "pebble_1b",
  "pebble_1b_moss",
  "pebble_1c",
  "pebble_1c_moss",
  "pebble_2a",
  "pebble_2a_moss",
  "pebble_2b",
  "pebble_2b_moss",
  "pebble_2c",
  "pebble_2c_moss",
  "pebble_3a",
  "pebble_3a_moss",
  "pebble_3b",
  "pebble_3b_moss",
  "pebble_3c",
  "pebble_3c_moss",
  "pebble_4",
  "pebble_4a",
  "pebble_4a_moss",
  "pebble_4b",
  "pebble_4b_moss",
  "pebble_4c",
  "pebble_4c_moss",
  "pond_1",
  "pond_2",
  "pond_3",
  "pond_4",
  "rock_1a",
  "rock_1b",
  "rock_1c",
  "rock_2a",
  "rock_2b",
  "rock_2c",
  "rock_3a",
  "rock_3b",
  "rock_3c",
  "rock_4a",
  "rock_4b",
  "rock_4c",
  "short_grass_patch_1",
  "short_grass_patch_2",
  "swamp_calla_1",
  "swamp_calla_2",
  "swamp_calla_3",
  "water_hyacinth_1",
  "water_hyacinth_2",
  "water_hyacinth_3",
  "water_lettuce_1",
  "water_lettuce_2",
  "water_lettuce_3",
  "water_lily_blossom_1",
  "water_lily_blossom_2",
  "water_lily_blossom_3",
  "water_lily_leaf_1",
  "water_lily_leaf_2",
  "water_lily_leaf_3",
  "water_lily_leaf_4",
  "water_mint_1",
  "water_mint_2",
  "water_mint_3",
  "wooden_tub",
]
