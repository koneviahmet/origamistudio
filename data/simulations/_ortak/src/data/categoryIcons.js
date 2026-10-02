/** Kategori oluştururken seçilebilir ikonlar (Icon.vue name değerleri). */
export const CATEGORY_ICON_OPTIONS = [
  { id: 'road', label: 'Yol' },
  { id: 'building', label: 'Bina' },
  { id: 'tree', label: 'Ağaç' },
  { id: 'treePine', label: 'Çam' },
  { id: 'car', label: 'Araç' },
  { id: 'minichar', label: 'Figür' },
  { id: 'food', label: 'Yemek' },
  { id: 'package', label: 'Paket' },
  { id: 'shapes', label: 'Şekil' },
  { id: 'fence', label: 'Çit' },
  { id: 'fountain', label: 'Su' },
  { id: 'train', label: 'Tren' },
  { id: 'coaster', label: 'Lunapark' },
  { id: 'nature', label: 'Doğa' },
  { id: 'crops', label: 'Mahsul' },
  { id: 'flag', label: 'Bayrak' },
  { id: 'star', label: 'Yıldız' },
  { id: 'home', label: 'Ev' },
  { id: 'terrain', label: 'Tepe' },
  { id: 'layers', label: 'Katman' },
]

export const PLACEMENT_TYPE_OPTIONS = [
  { id: 'road', label: 'Yol (ızgara)' },
  { id: 'building', label: 'Bina (ızgara)' },
  { id: 'prop', label: 'Dekor (serbest)' },
  { id: 'vehicle', label: 'Araç (serbest)' },
  { id: 'figur', label: 'Figür (serbest)' },
  { id: 'food', label: 'Yemek (serbest)' },
]

export const DEFAULT_CATEGORY_SEEDS = [
  { name: 'Yol', icon: 'road', placementType: 'road' },
  { name: 'Bina', icon: 'building', placementType: 'building' },
  { name: 'Dekor', icon: 'tree', placementType: 'prop' },
  { name: 'Araç', icon: 'car', placementType: 'vehicle' },
  { name: 'Figür', icon: 'minichar', placementType: 'figur' },
  { name: 'Yemek', icon: 'food', placementType: 'food' },
]
