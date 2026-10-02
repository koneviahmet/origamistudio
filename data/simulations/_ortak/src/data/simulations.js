import { LEGACY_SIMULATIONS } from './simulations-legacy.js'

/**
 * Simülasyon kayıt defteri.
 * /simulation listesi ve yeni simülasyon sayfaları bu listeyi kullanır.
 */
const MODERN_SIMULATIONS = [
  {
    slug: 'gunes-sistemi',
    route: '/simulation/gunes-sistemi',
    title: 'Güneş Sistemi',
    subtitle: 'Gezegen yörüngeleri',
    description:
      'Güneş ve gezegenlerin yörüngelerini izleyin. Hızı ayarlayın, gezegenlere tıklayarak bilgi alın.',
    accent: '#fbbf24',
    engine: 'three',
    available: true,
  },
  {
    slug: 'gunes-dunya-ay',
    route: '/simulation/gunes-dunya-ay',
    title: 'Güneş, Dünya ve Ay',
    subtitle: 'Dönme ve dolanma',
    description:
      'Güneş, Dünya ve Ay’ın dönme ile dolanma hareketlerini izleyin; kamerayı değiştirin, yörüngeleri ve şekilleri kontrol edin.',
    accent: '#38bdf8',
    engine: 'three',
    available: true,
  },
  {
    slug: 'gokcisimleri-katmanlari',
    route: '/simulation/gokcisimleri-katmanlari',
    title: 'Gök Cisimlerinin Katmanları',
    subtitle: 'İç yapı kesiti',
    description:
      'Güneş, Dünya ve Ay’ı inceleyin. Çift tıklayarak resimdeki gibi iç katman kesitini görün.',
    accent: '#f59e0b',
    engine: 'three',
    available: true,
  },
  {
    slug: 'gunes-yapisi',
    route: '/simulation/gunes-yapisi',
    title: 'Güneş Yapısı',
    subtitle: 'Katmanlar ve güneş lekeleri',
    description:
      'Güneş’i yakından inceleyin. Tıklayarak katmanları görün; güneş lekeleriyle dönüş yönünü takip edin.',
    accent: '#fbbf24',
    engine: 'three',
    available: true,
  },
  {
    slug: 'uzaklik-ve-gorunen-boyut',
    route: '/simulation/uzaklik-ve-gorunen-boyut',
    title: 'Uzaklık ve Görünen Boyut',
    subtitle: 'Yakın büyük, uzak küçük',
    description:
      'İki eşit boyuttaki cismi yakına ve uzağa kaydırarak uzak cisimlerin küçük, yakın cisimlerin büyük göründüğünü gözlemleyin.',
    accent: '#7dd3fc',
    engine: 'three',
    available: true,
  },
  {
    slug: 'tarihi-sahislar',
    route: '/simulation/tarihi-sahislar',
    title: 'Tarihi Şahıslar',
    subtitle: 'Keşifler bilgi panosu',
    description:
      'Galileo gibi bilim insanlarının keşiflerini adım adım okuyun. ?who=galileo ile doğrudan bir şahısı açın.',
    accent: '#fbbf24',
    engine: 'dom',
    available: true,
  },
  {
    slug: 'arsimet-prensibi',
    route: '/simulation/arsimet-prensibi',
    title: 'Arşimet Prensibi ve Sıvıların Kaldırma Kuvveti',
    subtitle: 'Yoğunluk ve yüzdürme',
    description:
      'Farklı yoğunluktaki taşları su dolu kaba bırakın; batma, yüzme ve su seviyesindeki değişimi gözlemleyin.',
    accent: '#38bdf8',
    engine: 'three',
    available: true,
  },
  {
    slug: 'atom-modelinin-tarihsel-gelisimi',
    route: '/simulation/atom-modelinin-tarihsel-gelisimi',
    title: 'Atom Modelinin Tarihsel Gelişimi',
    subtitle: 'Dalton → kuantum modeli',
    description:
      'Atom teorisinin tarihsel gelişimini 3D modellerle keşfedin; Rutherford deneyi ve Bohr sıçramasını deneyin.',
    accent: '#818cf8',
    engine: 'three',
    available: true,
  },
  {
    slug: 'elektroskop-3d',
    route: '/simulation/elektroskop-3d',
    title: 'Elektroskop 3D',
    subtitle: 'Elektrostatik yük deneyi',
    description:
      'Elektroskobun yüklenme ve yaprak hareketini 3 boyutlu gözlemleyin; farklı yüklü cisimlerle deney yapın.',
    accent: '#fbbf24',
    engine: 'three',
    available: true,
  },
  {
    slug: 'ayin-evreleri-3d',
    route: '/simulation/ayin-evreleri-3d',
    title: "Ay'ın Evreleri 3D",
    subtitle: 'Ay yörüngesi ve evreler',
    description:
      "Ay'ın Dünya etrafındaki hareketini izleyin; Yeni Ay'dan Dolunay'a kadar 8 evreyi 3 boyutlu keşfedin.",
    accent: '#818cf8',
    engine: 'three',
    available: true,
  },
]

const MODERN_SLUGS = new Set(MODERN_SIMULATIONS.map((sim) => sim.slug))

export const SIMULATIONS = [
  ...MODERN_SIMULATIONS,
  ...LEGACY_SIMULATIONS.filter((sim) => !MODERN_SLUGS.has(sim.slug)),
]

export function getSimulation(slug) {
  return SIMULATIONS.find((sim) => sim.slug === slug) ?? null
}
