import { reactive, readonly } from 'vue'
import { useCityStore } from '../stores/cityStore.js'
import { bresenhamCells, cellKey, rectCells, normalizeGridRect } from '../lib/city/gridLine.js'
import { mirrorGridCell } from '../lib/city/mirrorUtils.js'

const brushState = reactive({
  lineAnchor: null,
  brushing: false,
  rectPreview: null,
})

export function useRoadBrush() {
  const {
    addRoadsBatch,
    removeRoadsBatch,
    removeItemsAtCells,
    findRoadAt,
    beginHistoryBatch,
    endHistoryBatch,
  } = useCityStore()

  let brushMode = null
  let lastCell = null

  function resetStroke() {
    brushMode = null
    lastCell = null
    brushState.brushing = false
    brushState.rectPreview = null
  }

  let brushStartCell = null

  function clearLineAnchor() {
    brushState.lineAnchor = null
  }

  function paintCells(cells, ctx) {
    const expanded = expandMirrorCells(cells, ctx.mirrorAxis, ctx.settings)
    if (!expanded.length) return
    addRoadsBatch(expanded, {
      pack: ctx.manualPack,
      asset: ctx.manualAsset,
      rotY: ctx.manualRotY,
      manualOverride: true,
    })
  }

  function expandMirrorCells(cells, mirrorAxis, settings) {
    if (!mirrorAxis || mirrorAxis === 'off' || !settings) return cells
    const keys = new Set()
    const out = []
    for (const cell of cells) {
      const key = cellKey(cell.gx, cell.gz)
      if (!keys.has(key)) {
        keys.add(key)
        out.push(cell)
      }
      const m = mirrorGridCell(cell.gx, cell.gz, settings, mirrorAxis)
      const mKey = cellKey(m.gx, m.gz)
      if (!keys.has(mKey)) {
        keys.add(mKey)
        out.push(m)
      }
    }
    return out
  }

  function eraseRoadCells(cells) {
    const withRoads = cells.filter(({ gx, gz }) => findRoadAt(gx, gz))
    if (withRoads.length) removeRoadsBatch(withRoads)
  }

  function eraseAnyCells(cells) {
    if (!cells?.length) return
    removeItemsAtCells(cells)
  }

  function strokeBetween(from, to, ctx) {
    const cells = bresenhamCells(from.gx, from.gz, to.gx, to.gz)
    if (brushMode === 'paint') {
      paintCells(cells, ctx)
    } else if (brushMode === 'erase-road') {
      eraseRoadCells(cells)
    } else if (brushMode === 'erase-any') {
      eraseAnyCells(cells)
    }
  }

  function brushContext(options) {
    return {
      manualPack: options.manualPack,
      manualAsset: options.manualAsset,
      manualRotY: options.manualRotY,
      mirrorAxis: options.mirrorAxis,
      settings: options.settings,
    }
  }

  function handlePointerDown(point, options) {
    const { tool, button, shiftKey } = options
    if (!point) return { handled: false }

    const ctx = brushContext(options)

    if (tool === 'road' && button === 0 && shiftKey) {
      if (!brushState.lineAnchor) {
        brushState.lineAnchor = { gx: point.gx, gz: point.gz }
        return { handled: true, kind: 'line-anchor' }
      }

      const cells = bresenhamCells(
        brushState.lineAnchor.gx,
        brushState.lineAnchor.gz,
        point.gx,
        point.gz,
      )
      brushState.lineAnchor = null
      paintCells(cells, ctx)
      return { handled: true, kind: 'line' }
    }

    if (tool === 'road' && button === 0 && !shiftKey) {
      brushMode = 'paint'
      brushState.brushing = true
      lastCell = { gx: point.gx, gz: point.gz }
      beginHistoryBatch()
      paintCells([lastCell], ctx)
      return { handled: true, kind: 'brush-start' }
    }

    if (tool === 'road' && button === 2) {
      brushMode = 'erase-road'
      brushState.brushing = true
      lastCell = { gx: point.gx, gz: point.gz }
      beginHistoryBatch()
      eraseRoadCells([lastCell])
      return { handled: true, kind: 'brush-start' }
    }

    if (tool === 'erase' && button === 0) {
      brushMode = 'erase-any'
      brushState.brushing = true
      brushStartCell = { gx: point.gx, gz: point.gz }
      lastCell = brushStartCell
      beginHistoryBatch()
      eraseAnyCells([lastCell])
      brushState.rectPreview = normalizeGridRect(
        point.gx,
        point.gz,
        point.gx,
        point.gz,
      )
      return { handled: true, kind: 'brush-start' }
    }

    return { handled: false }
  }

  function handlePointerMove(point, options) {
    if (!brushMode || !point || !lastCell) return false

    if (brushMode === 'erase-any' && brushStartCell) {
      brushState.rectPreview = normalizeGridRect(
        brushStartCell.gx,
        brushStartCell.gz,
        point.gx,
        point.gz,
      )
      if (
        cellKey(brushStartCell.gx, brushStartCell.gz) !== cellKey(point.gx, point.gz)
      ) {
        const cells = rectCells(brushStartCell.gx, brushStartCell.gz, point.gx, point.gz)
        eraseAnyCells(cells)
      }
      lastCell = { gx: point.gx, gz: point.gz }
      return true
    }

    if (cellKey(lastCell.gx, lastCell.gz) === cellKey(point.gx, point.gz)) return true

    strokeBetween(lastCell, point, brushContext(options))
    lastCell = { gx: point.gx, gz: point.gz }
    return true
  }

  function handlePointerUp() {
    const wasBrushing = brushState.brushing
    if (wasBrushing) {
      endHistoryBatch()
    }
    brushStartCell = null
    resetStroke()
    return wasBrushing
  }

  return {
    brushState: readonly(brushState),
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    clearLineAnchor,
    isBrushing: () => brushState.brushing,
  }
}
