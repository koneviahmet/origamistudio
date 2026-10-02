import { getActiveGrade } from '../../lib/grade/activeGrade.js'
import { gokyuzuKomsularQuests } from './5/gokyuzundeki-komsularimiz-ve-biz.js'
import { game2Quests } from './5/game2.js'
import { gam1Quests } from './6/gam1.js'

const GRADE_QUEST_DATA = {
  5: {
    order: ['gokyuzundeki-komsularimiz-ve-biz', 'game2'],
    definitions: {
      'gokyuzundeki-komsularimiz-ve-biz': gokyuzuKomsularQuests,
      game2: game2Quests,
    },
  },
  6: {
    order: ['gam1'],
    definitions: {
      gam1: gam1Quests,
    },
  },
  7: { order: [], definitions: {} },
  8: { order: [], definitions: {} },
}

function getGradeQuestData(grade = getActiveGrade()) {
  return GRADE_QUEST_DATA[grade] ?? { order: [], definitions: {} }
}

export function getQuestGameOrder(grade = getActiveGrade()) {
  return [...getGradeQuestData(grade).order]
}

export function getQuestDefinition(gameSlug, grade = getActiveGrade()) {
  return getGradeQuestData(grade).definitions[gameSlug] ?? null
}

export function subtaskKey(gameSlug, questId, subtaskId) {
  return `${gameSlug}:${questId}:${subtaskId}`
}

export function questKey(gameSlug, questId) {
  return `${gameSlug}:${questId}`
}

export function listAllSubtasks(definition) {
  const items = []
  for (const quest of definition.quests) {
    for (const subtask of quest.subtasks) {
      items.push({
        gameSlug: definition.gameSlug,
        quest,
        subtask,
        key: subtaskKey(definition.gameSlug, quest.id, subtask.id),
        questKey: questKey(definition.gameSlug, quest.id),
      })
    }
  }
  return items
}
