// Otomatik üretildi — scripts/generate-school-lab.mjs

export const SCHOOL_LAB_CATEGORY_ORDER = [
  'optics',
  'glassware',
  'measurement',
  'science',
  'furniture',
]

export const SCHOOL_LAB_CATEGORY_LABELS = {
  optics: 'Optik Araçlar',
  glassware: 'Cam Malzeme',
  measurement: 'Ölçüm & Isıtma',
  science: 'Bilim Modelleri',
  furniture: 'Lab Mobilyası',
}

export function categorizeSchoolLab(id) {
  if (
    id === 'microscope' || id === 'microscope-on-table' ||
    id === 'telescope' || id === 'magnifying-glass'
  ) {
    return 'optics'
  }
  if (
    id === 'beaker' || id === 'erlenmeyer-flask' ||
    id === 'graduated-cylinder' || id === 'test-tube-rack'
  ) {
    return 'glassware'
  }
  if (id === 'bunsen-burner' || id === 'balance-scale') return 'measurement'
  if (id === 'globe' || id === 'atom-model' || id === 'periodic-table-board') return 'science'
  return 'furniture'
}

export const SCHOOL_LAB_IDS = [
  'atom-model',
  'balance-scale',
  'beaker',
  'bunsen-burner',
  'computer-on-table',
  'erlenmeyer-flask',
  'globe',
  'graduated-cylinder',
  'lab-cabinet',
  'lab-table',
  'magnifying-glass',
  'microscope',
  'microscope-on-table',
  'periodic-table-board',
  'telescope',
  'test-tube-rack',
]

export function getSchoolLabCategories() {
  return SCHOOL_LAB_CATEGORY_ORDER.map((id) => ({
    id,
    label: SCHOOL_LAB_CATEGORY_LABELS[id] ?? id,
  }))
}
