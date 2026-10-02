/**
 * Güneş, Dünya ve Ay hareketleri simülasyonu.
 * Dönme (eksen), dolanma (yörünge), kamera bakışları ve şekil değiştirme.
 */
export const gunesDunyaAyConfig = {
  slug: 'gunes-dunya-ay',
  title: 'Güneş, Dünya ve Ay',
  description:
    'Güneş, Dünya ve Ay’ın dönme ve dolanma hareketlerini izleyin; kamera bakışını ve şekilleri değiştirin.',
  engine: 'three',
  category: 'astronomi',
  /** Prosedürel geometri yeterli — katalog modeli yok */
  models: [],
  defaultSpeed: 0.3,
  hints: [],
  guideFocusKeys: ['welcome', 'camera', 'speed', 'orbits', 'shapes', 'sim-panel'],
  eventTypes: ['camera-change', 'body-select', 'speed-change', 'orbit-toggle', 'shape-change'],
}
