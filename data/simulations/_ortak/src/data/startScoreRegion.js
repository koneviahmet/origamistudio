import { cornersToBBoxStyle } from './startBoardRegion.js'

/** Kalibre edilmiş puan alanı — ekran yüzdesi (0–100) */
export const DEFAULT_SCORE_CORNERS = {
  topLeft: { x: 24.13, y: 5.2 },
  topRight: { x: 37.22, y: 9.21 },
  bottomRight: { x: 37.11, y: 14.24 },
  bottomLeft: { x: 23.89, y: 10.29 },
}

/** Görsel eğim — kalibrasyon kutusundan daha hafif (fazla yatık görünmesin) */
const SCORE_TILT_DAMPEN = 0.42

export function getScoreTiltDeg(corners = DEFAULT_SCORE_CORNERS) {
  const topAngle = Math.atan2(
    corners.topRight.y - corners.topLeft.y,
    corners.topRight.x - corners.topLeft.x,
  )
  const bottomAngle = Math.atan2(
    corners.bottomRight.y - corners.bottomLeft.y,
    corners.bottomRight.x - corners.bottomLeft.x,
  )
  const avgRad = (topAngle + bottomAngle) / 2
  return ((avgRad * 180) / Math.PI) * SCORE_TILT_DAMPEN
}

export function getScoreRegionStyle(corners = DEFAULT_SCORE_CORNERS) {
  return {
    ...cornersToBBoxStyle(corners),
    '--score-tilt': `${getScoreTiltDeg(corners)}deg`,
  }
}
