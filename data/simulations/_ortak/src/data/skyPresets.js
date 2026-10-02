export const DEFAULT_SKY_PRESET_ID = 'day'

/** @typedef {'color' | 'hdr'} SkyPresetType */

/**
 * @typedef {object} SkyPreset
 * @property {string} id
 * @property {string} label
 * @property {SkyPresetType} type
 * @property {string} preview CSS gradient for picker thumbnail
 * @property {number} [color] hex color for solid skies
 * @property {number} [fogColor] fog color when using HDR (hex)
 * @property {number} fogNear
 * @property {number} fogFar
 * @property {string} [texture] path under /assets/sky/
 * @property {number} [ambientColor]
 * @property {number} [ambientIntensity]
 * @property {number} [sunColor]
 * @property {number} [sunIntensity]
 */

/** @type {SkyPreset[]} */
export const SKY_PRESETS = [
  {
    id: 'day',
    label: 'Gündüz',
    type: 'color',
    preview: 'linear-gradient(180deg, #7ec8f8 0%, #b8d4f0 55%, #d4e8f7 100%)',
    color: 0xb8d4f0,
    fogNear: 60,
    fogFar: 140,
    ambientIntensity: 0.55,
    sunColor: 0xfff4e0,
    sunIntensity: 1.15,
  },
  {
    id: 'clear',
    label: 'Açık Mavi',
    type: 'color',
    preview: 'linear-gradient(180deg, #4db8ff 0%, #87ceeb 50%, #c8e8ff 100%)',
    color: 0x87ceeb,
    fogNear: 70,
    fogFar: 160,
    ambientIntensity: 0.6,
    sunColor: 0xfff8e8,
    sunIntensity: 1.25,
  },
  {
    id: 'twilight',
    label: 'Alacakaranlık',
    type: 'color',
    preview: 'linear-gradient(180deg, #2d1b4e 0%, #6b4c8a 40%, #e8a87c 100%)',
    color: 0x6b4c8a,
    fogNear: 45,
    fogFar: 110,
    ambientColor: 0xc4b5fd,
    ambientIntensity: 0.42,
    sunColor: 0xffb88c,
    sunIntensity: 0.75,
  },
  {
    id: 'storm',
    label: 'Fırtınalı',
    type: 'color',
    preview: 'linear-gradient(180deg, #3a4555 0%, #5c6b7a 45%, #8a9aaa 100%)',
    color: 0x5c6b7a,
    fogNear: 35,
    fogFar: 90,
    ambientColor: 0xb0bec5,
    ambientIntensity: 0.38,
    sunColor: 0xdde4ea,
    sunIntensity: 0.55,
  },
  {
    id: 'sunset',
    label: 'Gün Batımı',
    type: 'hdr',
    preview: 'linear-gradient(180deg, #1a2040 0%, #e85d3a 35%, #ffb347 70%, #ffd89b 100%)',
    texture: 'sunset.hdr',
    fogColor: 0xe8a070,
    fogNear: 50,
    fogFar: 130,
    ambientColor: 0xffe0c8,
    ambientIntensity: 0.48,
    sunColor: 0xffaa66,
    sunIntensity: 0.9,
  },
  {
    id: 'dawn',
    label: 'Şafak',
    type: 'hdr',
    preview: 'linear-gradient(180deg, #1a3050 0%, #6a9fd4 40%, #f0c878 85%, #fff5d6 100%)',
    texture: 'dawn.hdr',
    fogColor: 0xa8c8e8,
    fogNear: 55,
    fogFar: 135,
    ambientColor: 0xffeedd,
    ambientIntensity: 0.5,
    sunColor: 0xffd8a0,
    sunIntensity: 0.85,
  },
  {
    id: 'cloudy',
    label: 'Bulutlu',
    type: 'hdr',
    preview: 'linear-gradient(180deg, #6a7a8a 0%, #9aabb8 50%, #c8d4dc 100%)',
    texture: 'cloudy.hdr',
    fogColor: 0x9aabb8,
    fogNear: 40,
    fogFar: 100,
    ambientColor: 0xe8eef2,
    ambientIntensity: 0.45,
    sunColor: 0xf0f4f8,
    sunIntensity: 0.7,
  },
  {
    id: 'night',
    label: 'Gece',
    type: 'hdr',
    preview: 'linear-gradient(180deg, #0a1020 0%, #1a2840 50%, #2a4060 100%)',
    texture: 'night.hdr',
    fogColor: 0x1a2840,
    fogNear: 30,
    fogFar: 85,
    ambientColor: 0x8090b0,
    ambientIntensity: 0.28,
    sunColor: 0xa0b8d8,
    sunIntensity: 0.35,
  },
  {
    id: 'urban-night',
    label: 'Şehir Gecesi',
    type: 'hdr',
    preview: 'linear-gradient(180deg, #0c1020 0%, #1e2848 45%, #3a5080 100%)',
    texture: 'urban.hdr',
    fogColor: 0x1e2848,
    fogNear: 35,
    fogFar: 95,
    ambientColor: 0x8898b8,
    ambientIntensity: 0.32,
    sunColor: 0xc0d0e8,
    sunIntensity: 0.4,
  },
]

const presetMap = new Map(SKY_PRESETS.map((p) => [p.id, p]))

export function getSkyPreset(id) {
  return presetMap.get(id) ?? presetMap.get(DEFAULT_SKY_PRESET_ID)
}

export function isValidSkyPreset(id) {
  return presetMap.has(id)
}

export function normalizeSkySettings(sky) {
  const preset = sky?.preset
  return {
    preset: isValidSkyPreset(preset) ? preset : DEFAULT_SKY_PRESET_ID,
  }
}
