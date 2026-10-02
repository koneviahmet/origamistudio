import { cornersToBBoxStyle } from './startBoardRegion.js'

/** Kalibre edilmiş sıradaki macera alanı — ekran yüzdesi (0–100) */
export const DEFAULT_PLAY_HUB_CORNERS = {
  topLeft: { x: 46.47, y: 10.95 },
  topRight: { x: 82.23, y: 13.54 },
  bottomRight: { x: 82.22, y: 59.5 },
  bottomLeft: { x: 46.18, y: 61.2 },
}

const PLAY_HUB_TILT_DAMPEN = 0.35

export function getPlayHubTiltDeg(corners = DEFAULT_PLAY_HUB_CORNERS) {
  const topAngle = Math.atan2(
    corners.topRight.y - corners.topLeft.y,
    corners.topRight.x - corners.topLeft.x,
  )
  const bottomAngle = Math.atan2(
    corners.bottomRight.y - corners.bottomLeft.y,
    corners.bottomRight.x - corners.bottomLeft.x,
  )
  const avgRad = (topAngle + bottomAngle) / 2
  return ((avgRad * 180) / Math.PI) * PLAY_HUB_TILT_DAMPEN
}

export function getPlayHubRegionStyle(corners = DEFAULT_PLAY_HUB_CORNERS) {
  return {
    ...cornersToBBoxStyle(corners),
    '--hub-tilt': `${getPlayHubTiltDeg(corners)}deg`,
  }
}
