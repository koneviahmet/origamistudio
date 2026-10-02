/** Kalibre edilmiş pano köşeleri — ekran yüzdesi (0–100) */
export const DEFAULT_BOARD_CORNERS = {
  topLeft: { x: 0.65, y: 8.13 },
  topRight: { x: 35.68, y: 17.8 },
  bottomRight: { x: 35.99, y: 55.95 },
  bottomLeft: { x: 0.65, y: 60.63 },
}

/** Pano üzerindeki rozet ızgarası: 5 sütun × 5 satır = 25 */
export const BOARD_BADGE_COLS = 5
export const BOARD_BADGE_ROWS = 5
export const BOARD_BADGE_CAPACITY = BOARD_BADGE_COLS * BOARD_BADGE_ROWS

export function cloneBoardCorners(corners) {
  return {
    topLeft: { ...corners.topLeft },
    topRight: { ...corners.topRight },
    bottomRight: { ...corners.bottomRight },
    bottomLeft: { ...corners.bottomLeft },
  }
}

export function cornersToClipPath(corners) {
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners
  return `polygon(${tl.x}% ${tl.y}%, ${tr.x}% ${tr.y}%, ${br.x}% ${br.y}%, ${bl.x}% ${bl.y}%)`
}

/**
 * Dörtgen pano içinde (u,v) noktası — u soldan sağa, v yukarıdan aşağı (0–1).
 */
export function bilinearQuadPoint(corners, u, v) {
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners
  return {
    x: (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + u * v * br.x + (1 - u) * v * bl.x,
    y: (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + u * v * br.y + (1 - u) * v * bl.y,
  }
}

export function getActiveGridSize(total) {
  const count = Math.max(1, Math.min(total, BOARD_BADGE_CAPACITY))
  const side = Math.min(BOARD_BADGE_COLS, Math.ceil(Math.sqrt(count)))
  return { cols: side, rows: side, count }
}

/**
 * Rozet sayısına göre pano içi (u,v).
 * Az rozet → ortada küçük ızgara; 25 rozette tam 5×5 sol üstten sağa, satır satır.
 */
export function getBadgePinUv(index, total, cols = BOARD_BADGE_COLS) {
  const rows = BOARD_BADGE_ROWS
  const { cols: activeCols, rows: activeRows } = getActiveGridSize(total)

  const col = index % activeCols
  const row = Math.floor(index / activeCols)

  const offsetCol = Math.floor((cols - activeCols) / 2)
  const offsetRow = Math.floor((rows - activeRows) / 2)

  const gridCol = offsetCol + col
  const gridRow = offsetRow + row

  const padU0 = 0.14
  const padU1 = 0.86
  const padV0 = 0.18
  const padV1 = 0.84

  const u = cols <= 1 ? 0.5 : padU0 + (gridCol / (cols - 1)) * (padU1 - padU0)
  const v = rows <= 1 ? 0.5 : padV0 + (gridRow / (rows - 1)) * (padV1 - padV0)

  return { u, v }
}

export function getBadgePinPosition(corners, index, total, cols = BOARD_BADGE_COLS) {
  const { u, v } = getBadgePinUv(index, total, cols)
  return bilinearQuadPoint(corners, u, v)
}

export function cornersBoundingBox(corners) {
  const xs = [
    corners.topLeft.x,
    corners.topRight.x,
    corners.bottomRight.x,
    corners.bottomLeft.x,
  ]
  const ys = [
    corners.topLeft.y,
    corners.topRight.y,
    corners.bottomRight.y,
    corners.bottomLeft.y,
  ]
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const right = Math.max(...xs)
  const bottom = Math.max(...ys)
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

/** Köşeleri bbox içinde yerel yüzdeye çevirir (clip-path için). */
export function cornersToLocalClipPath(corners) {
  const box = cornersBoundingBox(corners)
  const w = box.width || 1
  const h = box.height || 1
  const toLocal = (p) => ({
    x: ((p.x - box.left) / w) * 100,
    y: ((p.y - box.top) / h) * 100,
  })
  const tl = toLocal(corners.topLeft)
  const tr = toLocal(corners.topRight)
  const br = toLocal(corners.bottomRight)
  const bl = toLocal(corners.bottomLeft)
  return `polygon(${tl.x}% ${tl.y}%, ${tr.x}% ${tr.y}%, ${br.x}% ${br.y}%, ${bl.x}% ${bl.y}%)`
}

export function cornersToBBoxStyle(corners) {
  const box = cornersBoundingBox(corners)
  return {
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  }
}

export function cornersToPolygonPoints(corners) {
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners
  return `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`
}

export function formatCornersForCopy(corners) {
  const round = (n) => Math.round(n * 100) / 100
  const fmt = (p) => ({ x: round(p.x), y: round(p.y) })
  const payload = {
    topLeft: fmt(corners.topLeft),
    topRight: fmt(corners.topRight),
    bottomRight: fmt(corners.bottomRight),
    bottomLeft: fmt(corners.bottomLeft),
  }
  return JSON.stringify(payload, null, 2)
}
