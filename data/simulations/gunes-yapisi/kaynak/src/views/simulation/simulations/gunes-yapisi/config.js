/**
 * Güneş yapısı — yakın görünüm, katman kesiti ve güneş lekeleri.
 */
export const gunesYapisiConfig = {
  slug: 'gunes-yapisi',
  title: 'Güneş Yapısı',
  description:
    'Güneş’i yakından inceleyin. Tıklayarak katmanları görün; güneş lekeleriyle dönüş yönünü takip edin.',
  engine: 'three',
  category: 'astronomi',
  models: [],
  defaultSpeed: 0.3,
  hints: [
    'Sürükleyerek kamerayı döndürün',
    'Güneş’e tıklayarak katman kesitini açın / kapatın',
    'Koyu lekeler güneş lekeleridir — dönüş yönünü gösterir',
  ],
  guideFocusKeys: ['welcome', 'camera', 'sun', 'cutaway', 'sim-panel'],
  eventTypes: [
    'cutaway-open',
    'cutaway-close',
    'layer-select',
    'speed-change',
    'photo-capture',
  ],
}

export const SUN_RADIUS = 2.4

export const SUN_LAYERS = [
  {
    id: 'corona',
    name: 'Taç küre',
    desc: 'Güneş’in en dış atmosfer katmanı; çok sıcak ve seyrek gazlardan oluşur.',
    radiusFrac: 1,
    color: 0xffb020,
    surface: true,
  },
  {
    id: 'chromosphere',
    name: 'Renk küre',
    desc: 'Işık küre ile taç küre arasındaki kırmızımsı katman.',
    radiusFrac: 0.78,
    color: 0xc41e2a,
  },
  {
    id: 'photosphere',
    name: 'Işık küre',
    desc: 'Güneş’in görünen yüzeyi; ışığın uzaya çıktığı katman.',
    radiusFrac: 0.52,
    color: 0xe86a10,
  },
  {
    id: 'core',
    name: 'Çekirdek',
    desc: 'Nükleer füzyonun gerçekleştiği en sıcak bölge (~15 milyon °C).',
    radiusFrac: 0.28,
    color: 0xffe8a0,
    solid: true,
  },
]

/**
 * Yan yana 3 leke — eşkenar üçgen kümesi.
 * center: küme merkezi (kamera +Z yüzü), radiusDeg: merkeze açısal uzaklık
 */
export const SUNSPOT_CLUSTER = {
  centerLat: 8,
  centerLon: 0,
  /** Merkezden her lekeye açısal uzaklık (derece) — üçgen boyutu */
  radiusDeg: 4.2,
  /** İlk köşenin teğet düzlemdeki açısı (derece); 90 ≈ üstte bir köşe */
  startAngleDeg: 90,
  spots: [
    { id: 'a', umbra: 0.026, penumbra: 0.05 },
    { id: 'b', umbra: 0.022, penumbra: 0.042 },
    { id: 'c', umbra: 0.024, penumbra: 0.046 },
  ],
}
