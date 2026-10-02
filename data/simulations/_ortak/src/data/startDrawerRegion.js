import { cornersToBBoxStyle, cornersToLocalClipPath } from './startBoardRegion.js'

/** Kalibre edilmiş çekmece (envanter) alanı — ekran yüzdesi (0–100) */
export const DEFAULT_DRAWER_CORNERS = {
  topLeft: { x: 44.75, y: 83.5 },
  topRight: { x: 53.74, y: 79.44 },
  bottomRight: { x: 53.77, y: 87.39 },
  bottomLeft: { x: 44.9, y: 92.2 },
}

export function getDrawerRegionStyle(corners = DEFAULT_DRAWER_CORNERS) {
  return {
    ...cornersToBBoxStyle(corners),
    clipPath: cornersToLocalClipPath(corners),
  }
}
