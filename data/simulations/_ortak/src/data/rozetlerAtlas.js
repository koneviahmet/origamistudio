import atlasData from './rozetler.json'

export const ROZET_SPRITE_URL = '/assets/rozetler/rozetler.png'

const meta = atlasData.meta
const sheetWidth = meta.size.w
const sheetHeight = meta.size.h

/** @type {Array<{ id: string, label: string, x: number, y: number, w: number, h: number }>} */
export const ROZET_FRAMES = Object.entries(atlasData.frames)
  .map(([id, entry]) => {
    const num = Number(id.match(/_(\d+)\.png$/)?.[1] ?? 0)
    return {
      id,
      label: `Rozet ${num}`,
      x: entry.frame.x,
      y: entry.frame.y,
      w: entry.frame.w,
      h: entry.frame.h,
      num,
    }
  })
  .sort((a, b) => a.num - b.num)

const frameById = new Map(ROZET_FRAMES.map((frame) => [frame.id, frame]))

export const DEFAULT_BADGE_FRAMES = {
  'gokyuzundeki-komsularimiz-ve-biz': 'kullan1_01.png',
  game2: 'kullan1_02.png',
  gam1: 'kullan1_03.png',
}

export function getRozetFrame(frameId) {
  return frameById.get(frameId) ?? null
}

export function resolveBadgeFrameId(gameSlug, selection) {
  return selection ?? DEFAULT_BADGE_FRAMES[gameSlug] ?? ROZET_FRAMES[0]?.id ?? null
}

/**
 * CSS background style for a sprite frame.
 * @param {string} frameId
 * @param {number} [displaySize] rendered box size in px
 */
export function getRozetSpriteStyle(frameId, displaySize = 64) {
  const frame = getRozetFrame(frameId)
  if (!frame) return {}

  const scale = displaySize / frame.w

  return {
    backgroundImage: `url(${ROZET_SPRITE_URL})`,
    backgroundPosition: `${-frame.x * scale}px ${-frame.y * scale}px`,
    backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
    width: `${displaySize}px`,
    height: `${displaySize}px`,
  }
}
