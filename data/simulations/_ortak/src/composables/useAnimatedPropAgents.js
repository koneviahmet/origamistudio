import { buildCollisionGrid } from '../lib/three/collision.js'
import { resolveCrossSpeciesFlee } from '../lib/play/creatureBehaviorSettings.js'
import { createAnimatedPropAgent } from '../lib/three/animatedPropAgent.js'
import { isAnimatedAsset } from '../lib/modelLibrary/animatedAssets.js'
import { isHumanoidCharacterPack } from '../lib/three/animatedPropActions.js'
import { placementHasDialogue, placementHasInteraction } from '../lib/play/interactionMatcher.js'

function shouldSpawnAnimatedAgent(prop, interactions, { hideInactiveCharacters = true } = {}) {
  if (prop.hiddenInPlay) return false
  if (!isAnimatedAsset(prop.pack, prop.asset)) return false
  if (
    hideInactiveCharacters
    && isHumanoidCharacterPack(prop.pack)
    && !placementHasInteraction(prop, interactions)
  ) {
    return false
  }
  return true
}

export function createAnimatedPropAgentsController() {
  /** @type {import('../lib/three/animatedPropAgent.js').createAnimatedPropAgent extends (...args: any[]) => Promise<infer R> ? NonNullable<R> : never}[]} */
  let agents = []
  let collisionGrid = null
  /** @type {string | null} */
  let dialogueLockedPropId = null

  async function init({ scene, project, renderer, interactions = [], hideInactiveCharacters = true }) {
    dispose()

    const props = (project.layers?.props ?? []).filter(
      (prop) => shouldSpawnAnimatedAgent(prop, interactions, { hideInactiveCharacters }),
    )
    const offshoreAnimated = (project.layers?.offshore ?? []).filter(
      (item) => shouldSpawnAnimatedAgent(item, interactions, { hideInactiveCharacters }),
    )
    const placements = [...props, ...offshoreAnimated]
    if (!placements.length) return

    collisionGrid = buildCollisionGrid(project, {
      excludePropIds: props.map((prop) => prop.id),
      excludeOffshoreIds: offshoreAnimated.map((item) => item.id),
    })

    for (const prop of placements) {
      const agent = await createAnimatedPropAgent({
        scene,
        prop,
        project,
        collisionGrid,
        hasDialogue: placementHasDialogue(prop, interactions),
      })
      if (!agent) continue
      renderer?.setPlacementCollected?.(prop.id, true)
      agents.push(agent)
    }
  }

  function update(dt, playerPos, projectSettings = null) {
    if (!agents.length) return
    const crossSpeciesFlee = resolveCrossSpeciesFlee(projectSettings)
    for (const agent of agents) {
      const peers = agents
        .filter((other) => other !== agent)
        .map((other) => ({
          x: other.root.position.x,
          z: other.root.position.z,
          typeKey: other.typeKey,
        }))
      agent.update(dt, playerPos, { crossSpeciesFlee, peers })
    }
  }

  function getAgentPositions() {
    return agents.map((agent) => ({
      x: agent.root.position.x,
      z: agent.root.position.z,
    }))
  }

  function getAgentThreats() {
    return agents
      .filter((agent) => agent.isActivelyMoving?.())
      .map((agent) => ({
        x: agent.root.position.x,
        z: agent.root.position.z,
      }))
  }

  function getSoundSources() {
    return agents.map((agent) => ({
      x: agent.root.position.x,
      z: agent.root.position.z,
      typeKey: agent.typeKey,
      soundEnabled: agent.creatureSoundEnabled === true,
      alwaysOn: false,
    }))
  }

  function getAgentWorldPosition(propId) {
    const agent = agents.find((entry) => entry.propId === propId)
    if (!agent?.root) return null
    return { x: agent.root.position.x, z: agent.root.position.z }
  }

  function getAgentHeadWorldPosition(propId) {
    const agent = agents.find((entry) => entry.propId === propId)
    return agent?.getHeadWorldPosition?.() ?? null
  }

  /**
   * Aktif diyalog NPC'sini yerinde kilitler; önceki kilit açılır.
   * @param {string | null | undefined} propId
   * @param {{ x: number, z: number } | null} [faceToward]
   */
  function setDialogueLockedPlacement(propId, faceToward = null) {
    const nextId = propId || null

    if (dialogueLockedPropId && dialogueLockedPropId !== nextId) {
      const prev = agents.find((entry) => entry.propId === dialogueLockedPropId)
      prev?.setDialogueLocked?.(false)
      dialogueLockedPropId = null
    }

    if (!nextId) {
      dialogueLockedPropId = null
      return
    }

    if (dialogueLockedPropId === nextId) return

    const agent = agents.find((entry) => entry.propId === nextId)
    if (!agent?.setDialogueLocked) return

    agent.setDialogueLocked(true, faceToward)
    dialogueLockedPropId = nextId
  }

  function dispose() {
    for (const agent of agents) {
      agent.dispose()
    }
    agents = []
    collisionGrid = null
    dialogueLockedPropId = null
  }

  return {
    init,
    update,
    dispose,
    getAgentCount: () => agents.length,
    getAgentPositions,
    getAgentThreats,
    getAgentHeadWorldPosition,
    getAgentWorldPosition,
    getSoundSources,
    setDialogueLockedPlacement,
  }
}
