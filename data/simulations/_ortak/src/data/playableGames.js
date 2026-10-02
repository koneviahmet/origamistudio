/**
 * Sınıf bazlı oynanabilir oyun kayıt defteri.
 * /start/:grade sayfası ve oyun sayfaları bu listeyi kullanır.
 */
import { getGamePath, GRADE_IDS } from './grades.js'

const GRADE_6_GAMES = [
  {
    grade: 6,
    slug: 'gam1',
    route: getGamePath(6, 'gam1'),
    firebaseId: 'Cu0SqiDkGNtqHqCVRkuo',
    editorUrl: 'http://localhost:5173/oyun/Cu0SqiDkGNtqHqCVRkuo',
    title: 'Fenköyü',
    subtitle: '6. sınıf keşif macerası',
    description: 'Fenköyü haritasında gezinin, görevleri tamamlayın ve rozet kazanın.',
    accent: '#a78bfa',
    available: true,
  },
]

const GRADE_5_GAMES = [
  {
    grade: 5,
    slug: 'gokyuzundeki-komsularimiz-ve-biz',
    route: getGamePath(5, 'gokyuzundeki-komsularimiz-ve-biz'),
    firebaseId: 'Cu0SqiDkGNtqHqCVRkuo',
    editorUrl: 'http://localhost:5173/oyun/Cu0SqiDkGNtqHqCVRkuo',
    title: 'Gökyüzündeki Komşularımız ve Biz',
    subtitle: 'Güneş, Ay ve Dünya macerası',
    description:
      'Fenköyü haritasında Güneş, Ay ve Dünya\'yı keşfet. Görevleri tamamla, rozet kazan.',
    accent: '#fbbf24',
    available: true,
  },
  {
    grade: 5,
    slug: 'game2',
    route: getGamePath(5, 'game2'),
    firebaseId: 'jmVAMjy3dmpOdhSGIuF2',
    editorUrl: 'http://localhost:5173/oyun/jmVAMjy3dmpOdhSGIuF2',
    title: 'Orman Şehri — Keşif',
    subtitle: 'Serbest gezinti',
    description: 'Aynı haritada WASD ile dolaşın. Etkileşimsiz keşif modu.',
    accent: '#a78bfa',
    available: true,
  },
]

/** @type {Record<number, typeof GRADE_5_GAMES>} */
export const PLAYABLE_GAMES_BY_GRADE = {
  5: GRADE_5_GAMES,
  6: GRADE_6_GAMES,
  7: [],
  8: [],
}

export function getPlayableGames(grade) {
  return PLAYABLE_GAMES_BY_GRADE[grade] ?? []
}

export function getPlayableGame(grade, slug) {
  return getPlayableGames(grade).find((game) => game.slug === slug) ?? null
}

export function hasPlayableGame(grade, slug) {
  return getPlayableGame(grade, slug) != null
}

/** Tüm sınıflardaki oyunları düz liste (ana sayfa vb.) */
export function listAllPlayableGames() {
  return GRADE_IDS.flatMap((grade) => getPlayableGames(grade))
}
