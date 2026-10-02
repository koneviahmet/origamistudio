/**
 * Güneş, Dünya ve Ay iç katman tanımları (eğitim amaçlı sadeleştirilmiş).
 * radiusFrac: en dış yarıçapa göre oran (1 = yüzey)
 */
export const BODY_LAYERS = {
  sun: {
    id: 'sun',
    name: 'Güneş',
    radius: 2.2,
    color: 0xffcc33,
    info: 'Güneş sisteminin merkezi yıldızı. Çift tıklayarak katmanlarını incele.',
    layers: [
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
    ],
  },
  earth: {
    id: 'earth',
    name: 'Dünya',
    radius: 1.35,
    color: 0x3b82f6,
    info: 'Yaşam barındıran gezegenimiz. Çift tıklayarak katmanlarını incele.',
    layers: [
      {
        id: 'crust',
        name: 'Kabuk',
        desc: 'Kıtalar ve okyanus tabanını oluşturan ince dış katman.',
        radiusFrac: 1,
        color: 0x4a8c3f,
        surface: true,
      },
      {
        id: 'mantle',
        name: 'Manto',
        desc: 'Sıcak, yarı akışkan kayaçların bulunduğu kalın katman.',
        radiusFrac: 0.82,
        color: 0xb83a1e,
      },
      {
        id: 'outer-core',
        name: 'Dış çekirdek',
        desc: 'Sıvı demir-nikel; manyetik alanın kaynağı.',
        radiusFrac: 0.48,
        color: 0xe07020,
      },
      {
        id: 'inner-core',
        name: 'İç çekirdek',
        desc: 'Katı demir-nikel; gezegenin en iç kısmı.',
        radiusFrac: 0.22,
        color: 0xf5d76e,
        solid: true,
      },
    ],
  },
  moon: {
    id: 'moon',
    name: 'Ay',
    radius: 0.72,
    color: 0xc4c4c4,
    info: 'Dünya’nın uydusu. Çift tıklayarak katmanlarını incele.',
    layers: [
      {
        id: 'crust',
        name: 'Kabuk',
        desc: 'Kraterli, sert kaya yüzey katmanı.',
        radiusFrac: 1,
        color: 0xb0b0b8,
        surface: true,
      },
      {
        id: 'mantle',
        name: 'Manto',
        desc: 'Kalın kayaç katmanı; kısmen erimiş bölgeler içerebilir.',
        radiusFrac: 0.72,
        color: 0x8a5a3c,
      },
      {
        id: 'partial-melt',
        name: 'Kısmi eriyik bölge',
        desc: 'Manto ile çekirdek arasında yumuşak geçiş bölgesi.',
        radiusFrac: 0.42,
        color: 0xc47a3a,
      },
      {
        id: 'core',
        name: 'Çekirdek',
        desc: 'Küçük demir açısından zengin çekirdek.',
        radiusFrac: 0.22,
        color: 0xe8c878,
        solid: true,
      },
    ],
  },
}

/** Sahne yerleşimi — yanyana inceleme */
export const BODY_LAYOUT = [
  { id: 'sun', x: -5.2, y: 0, z: 0 },
  { id: 'earth', x: 0.6, y: 0, z: 0 },
  { id: 'moon', x: 4.2, y: 0, z: 0 },
]

export const TEXTURE_PATHS = {
  earth: '/assets/simulation-models/textures/earth.jpg',
  moon: '/assets/simulation-models/textures/moon.jpg',
}

export const TEXTURE_FALLBACKS = {
  earth: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  moon: 'https://threejs.org/examples/textures/planets/moon_1024.jpg',
}
