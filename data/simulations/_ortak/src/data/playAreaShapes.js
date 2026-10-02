/** Oyun alanı şekil tanımları — ayarlar menüsünde listelenir. */
export const PLAY_AREA_SHAPES = [
  {
    id: 'rectangle',
    label: 'Dikdörtgen',
    description: 'Klasik keskin kenarlı oyun alanı',
    hasWater: false,
  },
  {
    id: 'island',
    label: 'Denizde ada',
    description: 'Yumuşak, organik kenarlar ve çevrede deniz',
    hasWater: true,
  },
  {
    id: 'circle',
    label: 'Daire',
    description: 'Yuvarlak ada, etrafında deniz',
    hasWater: true,
  },
  {
    id: 'oval',
    label: 'Oval',
    description: 'Elips şeklinde ada, etrafında deniz',
    hasWater: true,
  },
  {
    id: 'rounded',
    label: 'Yuvarlatılmış',
    description: 'Köşeleri yumuşatılmış dikdörtgen',
    hasWater: false,
  },
]

export const DEFAULT_PLAY_AREA_SHAPE = 'rectangle'

export const PLAY_AREA_SHAPE_IDS = PLAY_AREA_SHAPES.map((s) => s.id)
