import globalDefaults from './global-settings.json'
import { getActiveGrade } from '../lib/grade/activeGrade.js'
import { DEFAULT_GRADE } from './grades.js'
import {
  getCharacterIdsSnapshot,
  getCharactersSnapshot,
  isValidCharacterIdDynamic,
  useCharacterRegistry,
} from '../stores/characterRegistryStore.js'

export const CHARACTER_BASE = '/assets/characters'

/** @deprecated Statik liste — reaktif liste için useCharacterRegistry().characters kullanın */
export const CHARACTER_IDS = getCharacterIdsSnapshot()

export const CUSTOM_CHARACTERS = Object.fromEntries(
  getCharactersSnapshot()
    .filter((c) => c.label && !c.label.startsWith('Karakter '))
    .map((c) => [c.id, { label: c.label, description: c.description }]),
)

/** @deprecated Statik liste — reaktif liste için useCharacterRegistry().characters kullanın */
export const CHARACTERS = getCharactersSnapshot()

export { useCharacterRegistry }

export const DEFAULT_CHARACTER_ID = 'character-a'
export const CHARACTER_STORAGE_KEY = 'city-project-character'
export const CHARACTER_SCALE = globalDefaults.character.scale
export const CHARACTER_LOOK_AT_Y = 0.95

export const CHARACTER_ANIMATIONS = {
  idle: 'idle',
  walk: 'walk',
  sprint: 'sprint',
  sit: 'sit',
  die: 'die',
}

export const ANIMATION_ALIASES = {
  Idle: 'idle',
  Walk: 'walk',
  Run: 'sprint',
  Sprint: 'sprint',
}

export function isValidCharacterId(id) {
  return isValidCharacterIdDynamic(id)
}

export function characterStorageKey(grade = getActiveGrade()) {
  return `${CHARACTER_STORAGE_KEY}:g${grade}`
}

function migrateLegacyCharacterStorage(grade = getActiveGrade()) {
  try {
    const key = characterStorageKey(grade)
    if (localStorage.getItem(key)) return

    const legacy = localStorage.getItem(CHARACTER_STORAGE_KEY)
    if (legacy && isValidCharacterId(legacy) && grade === DEFAULT_GRADE) {
      localStorage.setItem(key, legacy)
    }
  } catch {
    // yoksay
  }
}

export function getStoredCharacterId(grade = getActiveGrade()) {
  try {
    migrateLegacyCharacterStorage(grade)
    const stored = localStorage.getItem(characterStorageKey(grade))
    return isValidCharacterId(stored) ? stored : DEFAULT_CHARACTER_ID
  } catch {
    return DEFAULT_CHARACTER_ID
  }
}

export function storeCharacterId(id, grade = getActiveGrade()) {
  if (!isValidCharacterId(id)) return
  try {
    localStorage.setItem(characterStorageKey(grade), id)
  } catch {
    /* ignore */
  }
}
