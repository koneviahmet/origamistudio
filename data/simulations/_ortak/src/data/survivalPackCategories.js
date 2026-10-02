// Otomatik üretildi — scripts/integrate-quaternius-packs.mjs

export const SURVIVAL_PACK_CATEGORY_ORDER = [
  'weapon',
  'tool',
  'medical',
  'consumable',
  'camp',
  'fire',
  'trap',
  'container',
  'misc',
]

export const SURVIVAL_PACK_CATEGORY_LABELS = {
  weapon: 'Silah',
  tool: 'Alet',
  medical: 'Sağlık',
  consumable: 'Yiyecek & İçecek',
  camp: 'Kamp',
  fire: 'Ateş & Işık',
  trap: 'Tuzak',
  container: 'Depolama',
  misc: 'Diğer',
}
export function categorizeSurvivalPack(id) {
  if (/Pistol|Revolver|Shotgun|FlareGun/i.test(id)) return 'weapon'
  if (/Bandage|FirstAid/i.test(id)) return 'medical'
  if (/BearTrap/i.test(id)) return 'trap'
  if (/Bonfire|Torch|Match_Fire|WoodenTorch/i.test(id)) return 'fire'
  if (/Tent|Raft/i.test(id)) return 'camp'
  if (/Can_|WaterBottle|GasCan/i.test(id)) return 'consumable'
  if (/Backpack|Trashcan|PropaneTank/i.test(id)) return 'container'
  if (/Axe|Shovel|Pan|Pot|Knife|Match|Compass|Radio|Phone|Battery/i.test(id)) return 'tool'
  return 'misc'
}

export const SURVIVAL_PACK_IDS = [
  "Axe",
  "Axe_Small",
  "Backpack",
  "Bandages",
  "Battery_Big",
  "Battery_Small",
  "BearTrap_Closed",
  "BearTrap_Open",
  "Bonfire",
  "Bonfire_Fire",
  "Can_Broken",
  "Can_Closed",
  "Can_Open",
  "Can_Red",
  "Compass_Closed",
  "Compass_Open",
  "FirstAidKit",
  "FirstAidKit_Hard",
  "FlareGun",
  "GasCan",
  "Knife",
  "Match",
  "Match_Burnt",
  "Match_Fire",
  "Matchbox",
  "Pan",
  "Pan_Small",
  "Phone",
  "Pistol_1",
  "Pistol_2",
  "Pot",
  "Pot_Small",
  "PropaneTank",
  "Radio",
  "Raft",
  "Raft_Paddle",
  "Revolver_1",
  "Revolver_2",
  "Revolver_3",
  "Shotgun_1",
  "Shotgun_2",
  "Shotgun_SawedOff",
  "Shotgun_ShortStock",
  "Shovel",
  "Tent",
  "Torch",
  "Trashcan",
  "WaterBottle_1",
  "WaterBottle_2",
  "WaterBottle_3",
  "WoodLog",
  "WoodenTorch",
  "WoodenTorch_Fire",
]

export function getSurvivalPackCategories() {
  return SURVIVAL_PACK_CATEGORY_ORDER.map((id) => ({
    id,
    label: SURVIVAL_PACK_CATEGORY_LABELS[id] ?? id,
  }))
}
