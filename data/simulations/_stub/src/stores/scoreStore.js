// Önizleme saplaması: oyun puan sistemi (Firebase) yok; tüm çağrılar etkisiz, alanlar varsayılan.
import { reactive } from 'vue'
const state = reactive({ score: 0, totalScore: 0, sessionScore: 0, level: 1, badges: [] })
const store = new Proxy(state, {
  get: (t, k) => (k in t ? t[k] : (typeof k === 'string' && !k.startsWith('__') ? () => ({}) : undefined)),
})
export const useScoreStore = () => store
export const initScoreStore = async () => {}
export const hydrateScoreFromFirebase = async () => {}
export const reloadScoreForCharacter = async () => {}
