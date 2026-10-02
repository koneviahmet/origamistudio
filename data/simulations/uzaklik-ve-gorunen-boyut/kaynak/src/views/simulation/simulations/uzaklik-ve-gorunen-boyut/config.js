/**
 * Uzaklık ve görünen boyut — aynı gerçek boyuttaki cisimler
 * yakında büyük, uzakta küçük görünür.
 */
export const uzaklikVeGorunenBoyutConfig = {
  slug: 'uzaklik-ve-gorunen-boyut',
  title: 'Uzaklık ve Görünen Boyut',
  description:
    'İki eşit boyuttaki cismi yakına ve uzağa kaydırarak uzak cisimlerin küçük, yakın cisimlerin büyük göründüğünü gözlemleyin.',
  engine: 'three',
  category: 'astronomi',
  models: [
    { pack: 'primitives', asset: 'sphere', role: 'body' },
  ],
  hints: [
    'İki cismin gerçek boyutları eşittir',
    'Yaklaştır / uzaklaştır düğmeleriyle derinliği değiştir',
    'Uzakta olan küçük, yakında olan büyük görünür',
    'Güneş–Dünya–Ay modunda uzaklık görünen boyutu nasıl etkiler bakın',
  ],
  guideFocusKeys: ['welcome', 'camera', 'sim-panel', 'body-a', 'body-b', 'astro-mode'],
  eventTypes: ['depth-change', 'reset', 'mode-change'],
}

/** Gerçek yarıçap — her iki cisim için aynı */
export const BODY_RADIUS = 1.15

/** primitives/sphere modeli yarıçapı (normalize sonrası çap ≈ 1) */
export const SPHERE_MODEL_RADIUS = 0.5

/** Cisimlerin X konumları (yan yana; kamera −Z’den bakınca a solda kalır) */
export const BODY_X = {
  a: 2.4,
  b: -2.4,
}

/**
 * Sahne koridoru (Z):
 * far  = en uç (toplar burada başlar)
 * near = koridorun içi (geri ile buraya gider)
 * Kamera uzak ucun gerisinde; küre mesafesi önceki kadrajla aynı (7.3).
 */
export const SCENE = {
  nearZ: 16,
  farZ: -16,
  groundWidth: 16,
  cameraHeight: 2.8,
  /** Küre (farZ+2) − 7.3 — önceki cameraZ−default ile aynı boşluk */
  cameraZ: -21.3,
  /** Kürelerin önünden koridora bak (+Z) */
  lookAtZ: -10.8,
}

/**
 * Derinlik (Z):
 * min = en uç (kameraya yakın, başlangıç)
 * max = koridorun içi (kameradan uzak)
 * Geri → Z artar (küçülür), İleri → Z azalır (büyür)
 */
export const DEPTH = {
  min: SCENE.farZ + 2,
  max: SCENE.nearZ - 2.8,
  defaultA: SCENE.farZ + 2,
  defaultB: SCENE.farZ + 2,
  step: 0.5,
}

export const BODIES = [
  {
    id: 'a',
    name: 'Cisim A',
    color: 0xfbbf24,
    emissive: 0x332200,
    radius: BODY_RADIUS,
    x: BODY_X.a,
    defaultDepth: DEPTH.defaultA,
  },
  {
    id: 'b',
    name: 'Cisim B',
    color: 0x38bdf8,
    emissive: 0x002233,
    radius: BODY_RADIUS,
    x: BODY_X.b,
    defaultDepth: DEPTH.defaultB,
  },
]

/**
 * Güneş–Dünya–Ay modu (sıkıştırılmış ölçek).
 * Gerçekte Güneş ≈ 400× Ay kadar uzaktır ve ≈ 400× büyüktür —
 * bu yüzden gökyüzünde benzer büyüklükte görünürler.
 * Varsayılan: Ay yakın, Güneş uzak → Ay görünen boyutta önde olabilir.
 */
export const ASTRO_BODIES = [
  {
    id: 'sun',
    name: 'Güneş',
    color: 0xf59e0b,
    emissive: 0x664400,
    /** Sınıf koridoruna sığacak şekilde küçültülmüş (gerçek ≈ 109 Dünya) */
    radius: 1.1,
    x: -2.6,
    defaultDepth: DEPTH.max,
  },
  {
    id: 'earth',
    name: 'Dünya',
    color: 0x3b82f6,
    emissive: 0x001a44,
    radius: 1.0,
    x: 0.2,
    /** Ortada-uzakta referans; karşılaştırmayı Ay–Güneş’e bırakır */
    defaultDepth: DEPTH.max - 2,
  },
  {
    id: 'moon',
    name: 'Ay',
    color: 0xd1d5db,
    emissive: 0x1a1a1a,
    /** ≈ 0.27 Dünya yarıçapı */
    radius: 0.27,
    x: 3.2,
    defaultDepth: DEPTH.min,
  },
]

export const MODE_EQUAL = 'equal'
export const MODE_ASTRO = 'astro'
export const GUIDE_FOCUS_ASTRO_MODE = 'astro-mode'
