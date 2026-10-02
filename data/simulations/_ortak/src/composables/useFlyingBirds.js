import { buildBirdPerchPoints } from '../lib/three/birdPerchPoints.js'
import { createFlyingBirdAgent } from '../lib/three/flyingBirdAgent.js'
import { resolveBirdCount } from '../lib/play/birdSettings.js'

const BIRD_VARIANTS = [
  { pack: 'cube-pets', asset: 'animal-parrot', scale: 0.2 },
]

function pickVariant(index) {
  return BIRD_VARIANTS[index % BIRD_VARIANTS.length]
}

export function createFlyingBirdsController() {
  /** @type {Awaited<ReturnType<typeof createFlyingBirdAgent>>[]} */
  let birds = []
  /** @type {import('../lib/three/birdPerchPoints.js').BirdPerchPoint[]} */
  let perches = []
  /** @type {{ x: number, z: number } | null} */
  let lastPlayerPos = null

  async function init({ scene, project }) {
    dispose()

    const total = resolveBirdCount(project.settings)
    if (total <= 0) return

    perches = await buildBirdPerchPoints(project)
    if (!perches.length) return

    for (let i = 0; i < total; i += 1) {
      const variant = pickVariant(i)
      const bird = await createFlyingBirdAgent({
        scene,
        variant,
        perches,
        settings: project.settings,
      })
      if (bird) birds.push(bird)
    }
  }

  function buildThreats(playerPos, playerMoving, agentThreats) {
    /** @type {{ x: number, z: number, vx?: number, vz?: number }[]} */
    const threats = []

    if (playerPos) {
      const threat = { x: playerPos.x, z: playerPos.z }

      if (playerMoving && lastPlayerPos) {
        const vx = playerPos.x - lastPlayerPos.x
        const vz = playerPos.z - lastPlayerPos.z
        const vlen = Math.hypot(vx, vz)
        if (vlen > 0.02) {
          threat.vx = vx / vlen
          threat.vz = vz / vlen
        }
      }

      threats.push(threat)
      lastPlayerPos = { x: playerPos.x, z: playerPos.z }
    } else {
      lastPlayerPos = null
    }

    for (const pos of agentThreats) {
      threats.push({ x: pos.x, z: pos.z })
    }

    return threats
  }

  function update(dt, { playerPos = null, playerMoving = false, agentThreats = [] } = {}) {
    if (!birds.length) return
    const threats = buildThreats(playerPos, playerMoving, agentThreats)
    for (const bird of birds) {
      bird.update(dt, threats)
    }
  }

  function getSoundSources() {
    return birds.map((bird) => ({
      x: bird.root.position.x,
      z: bird.root.position.z,
      typeKey: bird.typeKey,
      soundEnabled: true,
      alwaysOn: true,
    }))
  }

  function dispose() {
    for (const bird of birds) {
      bird.dispose()
    }
    birds = []
    perches = []
    lastPlayerPos = null
  }

  return {
    init,
    update,
    dispose,
    getBirdCount: () => birds.length,
    getPreloadAssets: () => BIRD_VARIANTS.map(({ pack, asset }) => ({ pack, asset })),
    getSoundSources,
  }
}
