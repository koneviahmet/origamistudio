/** 8 ay evresi — sıra saat yönünün tersine (Yeni Ay → Dolunay → Yeni Ay) */
export const MOON_PHASES = [
  {
    id: 0,
    name: 'Yeni Ay',
    emoji: '🌑',
    info: 'Ay, Dünya ile Güneş arasında. Aydınlatılan yüz Dünya\'ya dönük değil, Ay görünmez.',
  },
  {
    id: 1,
    name: 'İlk Hilal',
    emoji: '🌒',
    info: 'Ay\'ın ince bir hilali batı ufkunda görünür; aydınlanan kısım büyümeye başlar.',
  },
  {
    id: 2,
    name: 'İlk Dördün',
    emoji: '🌓',
    info: 'Ay\'ın yarısı aydınlanmıştır. Güneş ışığı sağ yarıdan gelir.',
  },
  {
    id: 3,
    name: 'Büyüyen Şişkin',
    emoji: '🌔',
    info: 'Ay\'ın aydınlanan kısmı dörtte üçünü geçer; Dolunay\'a doğru ilerler.',
  },
  {
    id: 4,
    name: 'Dolunay',
    emoji: '🌕',
    info: 'Ay, Dünya\'nın Güneş\'ten baktığı tarafında. Tam disk görünür.',
  },
  {
    id: 5,
    name: 'Küçülen Şişkin',
    emoji: '🌖',
    info: 'Dolunay sonrası aydınlanan kısım azalmaya başlar.',
  },
  {
    id: 6,
    name: 'Son Dördün',
    emoji: '🌗',
    info: 'Ay\'ın sol yarısı aydınlanmıştır; hilale doğru küçülür.',
  },
  {
    id: 7,
    name: 'Son Hilal',
    emoji: '🌘',
    info: 'Doğu ufkunda ince bir hilal; bir sonraki Yeni Ay\'a yaklaşır.',
  },
]

/** Evre indeksine karşılık Ay yörünge açısı (radyan) */
export const MOON_PHASE_ANGLES = [
  Math.PI,
  Math.PI * 1.25,
  Math.PI * 1.5,
  Math.PI * 1.75,
  0,
  Math.PI * 0.25,
  Math.PI * 0.5,
  Math.PI * 0.75,
]

export const SCENE = {
  sunRadius: 1.55,
  earthOrbit: 10.5,
  earthRadius: 1.25,
  moonOrbit: 3.35,
  moonRadius: 0.38,
  /** Kamera odak noktası — Dünya yörüngesinin merkezine yakın */
  focusX: 10.5,
}

export const TEXTURE_PATHS = {
  earth: '/assets/simulation-models/textures/earth.jpg',
  earthNormal: '/assets/simulation-models/textures/earth_normal.jpg',
  earthClouds: '/assets/simulation-models/textures/earth_clouds.jpg',
  moon: '/assets/simulation-models/textures/moon.jpg',
  moonBump: '/assets/simulation-models/textures/moon_bump.jpg',
  stars: '/assets/simulation-models/textures/stars_milky_way.jpg',
}

/** Yerel texture yoksa kullanılacak yedek URL'ler */
export const TEXTURE_FALLBACKS = {
  earth: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  earthNormal: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
  earthClouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  moon: 'https://threejs.org/examples/textures/planets/moon_1024.jpg',
  moonBump: 'https://threejs.org/examples/textures/planets/moon_bump.jpg',
}
