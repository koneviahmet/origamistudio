import { cloneAssetInstance, preloadAssets } from '../three/assetRegistry.js'

/**
 * Simülasyon config.models dizisindeki pack/asset çiftlerini yükler.
 * @param {Array<{ pack: string, asset: string, role?: string }>} modelDefs
 * @param {(progress: number) => void} [onProgress]
 */
export async function loadSimulationModels(modelDefs = [], onProgress) {
  const unique = []
  const seen = new Set()

  for (const def of modelDefs) {
    const key = `${def.pack}:${def.asset}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push({ pack: def.pack, asset: def.asset })
  }

  await preloadAssets(unique, onProgress)

  const instances = new Map()
  for (const def of modelDefs) {
    const key = `${def.pack}:${def.asset}`
    if (instances.has(key)) continue
    const instance = await cloneAssetInstance(def.pack, def.asset)
    instances.set(key, instance)
  }

  return instances
}

export function modelKey(pack, asset) {
  return `${pack}:${asset}`
}
