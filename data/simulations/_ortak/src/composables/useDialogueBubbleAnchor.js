import { ref } from 'vue'
import { projectWorldToScreen } from '../lib/play/projectWorldToScreen.js'
import { getPropHeadWorldPosition } from '../lib/play/propAnchorPosition.js'

/**
 * NPC dünya konumunu oyun sahnesi üzerinde ekran pikseline yansıtır.
 * Konum her karede usePlayEngine döngüsünden update() ile güncellenir.
 */
export function createDialogueBubbleAnchor({
  controller,
  getCanvas,
  getEngine,
  getProject,
  getRenderer,
  getAnimatedAgents,
}) {
  const anchor = ref({ x: 0, y: 0, visible: false, ready: false })

  function resolveWorldPosition(placement, project) {
    if (placement?.id) {
      const fromAgent = getAnimatedAgents?.()?.getAgentHeadWorldPosition?.(placement.id)
      if (fromAgent) return fromAgent
    }

    const renderer = getRenderer?.()
    if (placement?.id && renderer?.getPropHeadWorldPosition) {
      const fromScene = renderer.getPropHeadWorldPosition(placement.id)
      if (fromScene) return fromScene
    }
    return getPropHeadWorldPosition(placement, project)
  }

  function update() {
    if (!controller.isOpen.value) {
      anchor.value = { x: 0, y: 0, visible: false, ready: false }
      return
    }

    const placement = controller.activePlacement.value
    const canvas = getCanvas?.()
    const engine = getEngine?.()
    const camera = engine?.camera
    const project = getProject?.()

    if (!placement || !canvas || !camera || !project) {
      anchor.value = { ...anchor.value, visible: false, ready: false }
      return
    }

    const world = resolveWorldPosition(placement, project)
    if (!world) {
      anchor.value = { ...anchor.value, visible: false, ready: false }
      return
    }

    const projected = projectWorldToScreen(world.x, world.y, world.z, camera, canvas, {
      clamp: false,
    })
    anchor.value = {
      x: projected.fixedX,
      y: projected.fixedY,
      visible: !projected.behind,
      ready: true,
    }
  }

  return { anchor, update }
}

/** @deprecated createDialogueBubbleAnchor kullanın */
export function useDialogueBubbleAnchor(options) {
  const { anchor, update } = createDialogueBubbleAnchor(options)
  return { anchor, update }
}
