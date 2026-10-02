/**
 * Sınıf (grade) kayıt defteri.
 * Her sınıfın kendi oyun, görev, puan ve rozet sistemi vardır.
 */
export const GRADES = [
  {
    id: 5,
    label: '5. Sınıf',
    shortLabel: '5',
    description: 'Orman Şehri macerası — görevler, rozetler ve keşif.',
    accent: '#38bdf8',
    available: true,
  },
  {
    id: 6,
    label: '6. Sınıf',
    shortLabel: '6',
    description: 'Fenköyü macerası — görevler, rozetler ve keşif.',
    accent: '#a78bfa',
    available: true,
  },
  {
    id: 7,
    label: '7. Sınıf',
    shortLabel: '7',
    description: '7. sınıf oyunları yakında burada olacak.',
    accent: '#34d399',
    available: true,
  },
  {
    id: 8,
    label: '8. Sınıf',
    shortLabel: '8',
    description: '8. sınıf oyunları yakında burada olacak.',
    accent: '#fbbf24',
    available: true,
  },
]

export const DEFAULT_GRADE = 5

export const GRADE_IDS = GRADES.map((g) => g.id)

export function parseGrade(raw) {
  const n = Number(raw)
  return Number.isInteger(n) ? n : null
}

export function isValidGrade(grade) {
  return GRADE_IDS.includes(grade)
}

export function getGradeMeta(grade) {
  return GRADES.find((g) => g.id === grade) ?? null
}

export function getStartPath(grade) {
  return `/start/${grade}`
}

export function getQuestCatalogPath(grade) {
  return `/start/${grade}/quests`
}

export function getGamePath(grade, slug) {
  return `/games/${grade}/${slug}`
}
