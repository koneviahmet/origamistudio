import { getStoredCharacterId, DEFAULT_CHARACTER_ID } from '../../data/kenneyCharacters.js'

/**
 * Simülasyon panelinde gösterilecek modeli çözümler.
 *
 * panelModel örnekleri:
 * - { source: 'player' } — o anki oyun karakteri
 * - { source: 'character', characterId: 'character-b' }
 * - { source: 'asset', pack: 'space', asset: 'astronautA', scale: 0.35 }
 */
export function resolvePanelModel(panelModel, playerCharacterId) {
  const playerId = playerCharacterId || getStoredCharacterId() || DEFAULT_CHARACTER_ID

  if (!panelModel || panelModel.source === 'player') {
    return { type: 'character', characterId: playerId, scale: panelModel?.scale }
  }

  if (panelModel.source === 'character') {
    return {
      type: 'character',
      characterId: panelModel.characterId ?? playerId,
      scale: panelModel.scale,
    }
  }

  if (panelModel.source === 'asset') {
    return {
      type: 'asset',
      pack: panelModel.pack,
      asset: panelModel.asset,
      scale: panelModel.scale ?? 0.2,
    }
  }

  return { type: 'character', characterId: playerId }
}
