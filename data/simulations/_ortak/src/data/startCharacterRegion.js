import { cornersToBBoxStyle } from './startBoardRegion.js'

/** Kalibre edilmiş karakter alanı — ekran yüzdesi (0–100) */
export const DEFAULT_CHARACTER_CORNERS = {
  topLeft: { x: 71.38, y: 63.5 },
  topRight: { x: 85.75, y: 63.6 },
  bottomRight: { x: 89.64, y: 99.2 },
  bottomLeft: { x: 70.08, y: 99.5 },
}

export function getCharacterRegionStyle(corners = DEFAULT_CHARACTER_CORNERS) {
  return cornersToBBoxStyle(corners)
}
