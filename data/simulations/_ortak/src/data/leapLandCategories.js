// Otomatik üretildi — scripts/integrate-leap-voxel-packs.mjs

export const LEAP_LAND_CATEGORY_ORDER = [
  'terrain',
  'vegetation',
  'structure',
  'collectible',
  'interactive',
  'decor',
]

export const LEAP_LAND_CATEGORY_LABELS = {
  terrain: 'Arazi & Yol',
  vegetation: 'Bitki & Ağaç',
  structure: 'Platform & Köprü',
  collectible: 'Toplanabilir',
  interactive: 'Etkileşimli',
  decor: 'Dekor',
}

export function categorizeLeapLand(id) {
  if (
    id.startsWith('ground_') || id.startsWith('trail_') ||
    id.startsWith('rock_') || id === 'crumbling_rock_platform'
  ) return 'terrain'
  if (
    id.startsWith('tree') || id.startsWith('flower') || id.startsWith('plant') ||
    id.startsWith('grass_') || id === 'mushroom' || id === 'lilypad'
  ) return 'vegetation'
  if (
    id.startsWith('bridge_') || id.startsWith('ladder_') ||
    id.startsWith('wall_') || id.startsWith('fence_') ||
    id === 'locked_door' || id === 'rotating_log'
  ) return 'structure'
  if (
    id === 'coin' || id === 'gem' || id === 'key' || id === 'lock' ||
    id === 'heart' || id === 'trophy' || id.startsWith('treasure_') ||
    id.startsWith('balloon_') || id === 'bullet'
  ) return 'collectible'
  if (
    id === 'cannon' || id === 'bomb' || id === 'dynamite' || id === 'detonater' ||
    id === 'slime' || id === 'bee' || id === 'spring' || id === 'rope' ||
    id.startsWith('water_') || id === 'flag' || id === 'wood_spikes' ||
    id === 'crate' || id === 'telescope' || id === 'stopwatch'
  ) return 'interactive'
  if (id.startsWith('cloud_') || id.startsWith('sign')) return 'decor'
  return 'decor'
}

export const LEAP_LAND_IDS = [
  "balloon_blue",
  "balloon_red",
  "balloon_yellow",
  "bee",
  "bomb",
  "bridge_1",
  "bridge_2",
  "bullet",
  "cannon",
  "cloud_1",
  "cloud_2",
  "cloud_3",
  "coin",
  "crate",
  "crumbling_rock_platform",
  "detonater",
  "dynamite",
  "fence_1",
  "fence_2",
  "fence_4",
  "flag",
  "flower",
  "gem",
  "grass_blades_1",
  "grass_blades_2",
  "grass_blades_3",
  "grass_blades_4",
  "ground_cloud_2",
  "ground_cloud_4",
  "ground_dirt_2",
  "ground_dirt_4",
  "ground_dirt_8",
  "ground_grass_2",
  "ground_grass_4",
  "ground_grass_8",
  "ground_wood_2",
  "ground_wood_4",
  "heart",
  "key",
  "ladder_1",
  "ladder_2",
  "ladder_3",
  "lilypad",
  "lock",
  "locked_door",
  "mushroom",
  "plant",
  "rock_1",
  "rock_2",
  "rock_3",
  "rope",
  "rotating_log",
  "sign",
  "sign_arrow",
  "slime",
  "spring",
  "stopwatch",
  "telescope",
  "trail_dirt_curved_1",
  "trail_dirt_curved_2",
  "trail_dirt_end_1",
  "trail_dirt_end_2",
  "trail_dirt_straight_1",
  "trail_dirt_straight_2",
  "trail_rock_curved",
  "trail_rock_straight",
  "treasure_chest",
  "tree_1",
  "tree_2",
  "tree_stump",
  "trophy",
  "wall_logs_1",
  "wall_logs_2",
  "wall_spiked_logs",
  "water_2",
  "water_4",
  "wood_spikes",
]
