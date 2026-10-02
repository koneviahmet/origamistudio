import { reactive, readonly } from 'vue'
import { useCityStore } from '../stores/cityStore.js'
import { bresenhamCells, cellKey } from '../lib/city/gridLine.js'

const brushState = reactive({
  brushing: false,
  lowerMode: false,
})

export function useTerrainBrush() {
  const { applyTerrainDeltaBatch, beginHistoryBatch, endHistoryBatch } = useCityStore()

  let lastCell = null
  let strokeChangedCells = []

  function resetStroke() {
    lastCell = null
    brushState.brushing = false
    brushState.lowerMode = false
    strokeChangedCells = []
  }

  function paintCells(cells, delta) {
    if (!cells.length || !delta) return []
    const changed = applyTerrainDeltaBatch(cells, delta)
    if (changed.length) strokeChangedCells.push(...changed)
    return changed
  }

  function strokeBetween(from, to, delta) {
    const cells = bresenhamCells(from.gx, from.gz, to.gx, to.gz)
    return paintCells(cells, delta)
  }

  function handlePointerDown(point, options) {
    const { tool, button, shiftKey } = options
    if (tool !== 'terrain' || button !== 0 || !point) return { handled: false }

    const delta = shiftKey ? -1 : 1
    brushState.lowerMode = shiftKey
    brushState.brushing = true
    lastCell = { gx: point.gx, gz: point.gz }
    strokeChangedCells = []
    beginHistoryBatch()
    paintCells([lastCell], delta)
    return { handled: true, kind: 'brush-start' }
  }

  function handlePointerMove(point) {
    if (!brushState.brushing || !point || !lastCell) return false
    if (cellKey(lastCell.gx, lastCell.gz) === cellKey(point.gx, point.gz)) return []

    const delta = brushState.lowerMode ? -1 : 1
    const changed = strokeBetween(lastCell, point, delta)
    lastCell = { gx: point.gx, gz: point.gz }
    return changed
  }

  function handlePointerUp() {
    const wasBrushing = brushState.brushing
    const changedCells = [...strokeChangedCells]
    if (wasBrushing) {
      endHistoryBatch()
    }
    resetStroke()
    return { wasBrushing, changedCells }
  }

  function consumeStrokeChangedCells() {
    return []
  }

  return {
    brushState: readonly(brushState),
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    consumeStrokeChangedCells,
    isBrushing: () => brushState.brushing,
  }
}
