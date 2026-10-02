/** Kategori davranış ayarları — UI etiketleri ve varsayılanlar. */

export const CATEGORY_BEHAVIOR_DEFAULTS = {
  allowOnRoad: false,
  allowStackOnTop: false,
  inventoryEnabled: false,
  defaultScale: null,
  defaultBlocksPlayer: true,
  defaultHiddenInPlay: false,
  defaultPickable: false,
}

export const CATEGORY_SETTING_OPTIONS = [
  {
    key: 'allowStackOnTop',
    label: 'Üstüne yerleştirilebilir',
    hint: 'Yol kategorisi: bu yolun üzerine bina ve dekor konabilir.',
    when: (cat) => cat.placementType === 'road',
  },
  {
    key: 'allowOnRoad',
    label: 'Yol üzerine konabilir',
    hint: 'Bu kategorideki modeller yol hücresine yerleştirilebilir.',
    when: (cat) => cat.placementType === 'building',
  },
  {
    key: 'inventoryEnabled',
    label: 'Envantere alınabilir',
    hint: 'Oyun sırasında yakındaki modeller otomatik envantere eklenir.',
  },
  {
    key: 'defaultPickable',
    label: 'Ele alınabilir',
    hint: 'Oyuncu bu kategorideki modellerle etkileşime girebilir.',
  },
  {
    key: 'defaultHiddenInPlay',
    label: 'Haritada gizle',
    hint: 'Düzenle modunda görünür; oyun/gez modunda gizli (görev vb. ile açılabilir).',
  },
  {
    key: 'defaultBlocksPlayer',
    label: 'Karakter geçemez',
    hint: 'Varsayılan olarak karakterin içinden geçilemez.',
    invert: true,
  },
]

export const MODEL_SETTING_OPTIONS = [
  {
    key: 'defaultScale',
    label: 'Varsayılan boyut',
    type: 'scale',
    hint: 'Haritaya eklenince bu ölçekle gelir.',
  },
  {
    key: 'pickable',
    label: 'Ele alınabilir',
    type: 'toggle',
    hint: 'Kategori ayarını geçersiz kılar.',
  },
  {
    key: 'hiddenInPlay',
    label: 'Haritada gizle',
    type: 'toggle',
    hint: 'Düzenle modunda görünür, oyunda gizli.',
  },
  {
    key: 'blocksPlayer',
    label: 'Karakter geçemez',
    type: 'toggle',
    hint: 'Kategori ayarını geçersiz kılar.',
    invert: true,
  },
]
