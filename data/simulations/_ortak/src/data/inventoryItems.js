/**
 * Envantere eklenebilir eşya kataloğu.
 * Oyun config'inde pickup-collect etkileşimleri `itemId` ile buraya referans verir.
 */
export const INVENTORY_ITEMS = {
  burger: {
    id: 'burger',
    label: 'Hamburger',
    emoji: '🍔',
    pack: 'food',
    asset: 'burger',
    category: 'meal',
  },
  cake: {
    id: 'cake',
    label: 'Pasta',
    emoji: '🎂',
    pack: 'food',
    asset: 'cake',
    category: 'dessert',
  },
  'ay-modeli': {
    id: 'ay-modeli',
    label: 'Ay Modeli',
    emoji: '🌕',
    pack: 'primitives',
    asset: 'sphere',
    color: '#c4c4c4',
    category: 'science',
  },
  'gunes-modeli': {
    id: 'gunes-modeli',
    label: 'Güneş Modeli',
    emoji: '☀️',
    pack: 'primitives',
    asset: 'sphere',
    color: '#f59e0b',
    category: 'science',
  },
  'dunya-modeli': {
    id: 'dunya-modeli',
    label: 'Dünya Modeli',
    emoji: '🌍',
    pack: 'primitives',
    asset: 'sphere',
    color: '#3b82f6',
    category: 'science',
  },
  // Eski id'ler — kayıtlarda kalan eşyalar için
  'ay-kuresi': {
    id: 'ay-modeli',
    label: 'Ay Modeli',
    emoji: '🌕',
    pack: 'primitives',
    asset: 'sphere',
    color: '#c4c4c4',
    category: 'science',
  },
  'gunes-kuresi': {
    id: 'gunes-modeli',
    label: 'Güneş Modeli',
    emoji: '☀️',
    pack: 'primitives',
    asset: 'sphere',
    color: '#f59e0b',
    category: 'science',
  },
  'dunya-kuresi': {
    id: 'dunya-modeli',
    label: 'Dünya Modeli',
    emoji: '🌍',
    pack: 'primitives',
    asset: 'sphere',
    color: '#3b82f6',
    category: 'science',
  },
}

export const INVENTORY_SLOT_COUNT = 24

export function getInventoryItem(itemId) {
  return INVENTORY_ITEMS[itemId] ?? null
}

export function listInventoryCatalog() {
  const seen = new Set()
  return Object.values(INVENTORY_ITEMS).filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

/** Aynı model (pack/asset) tek slotta birleşir. */
export function buildStackKey(pack, asset) {
  if (!pack || !asset) return null

  for (const item of Object.values(INVENTORY_ITEMS)) {
    if (item.pack === pack && item.asset === asset) return item.id
  }

  return `${pack}:${asset}`
}

export function resolvePickupItem(interaction, placement) {
  if (interaction?.itemId) {
    const catalog = getInventoryItem(interaction.itemId)
    if (catalog) return { ...catalog }
  }

  if (!placement?.pack || !placement?.asset) return null

  const stackKey = buildStackKey(placement.pack, placement.asset)

  return {
    id: stackKey,
    label: interaction?.label ?? placement.name ?? placement.asset,
    emoji: interaction?.emoji ?? '✨',
    pack: placement.pack,
    asset: placement.asset,
    color: placement.color ?? null,
    category: placement.category ?? 'decor',
  }
}

export function buildPickupKey(gameSlug, placementId) {
  return `${gameSlug}:${placementId}`
}
