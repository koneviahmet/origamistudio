/**
 * Tarihi şahıslar bilgi panosu.
 * URL: /simulation/tarihi-sahislar?who=galileo
 * who yoksa şahıs listesi gösterilir.
 */

export const tarihiSahislarConfig = {
  slug: 'tarihi-sahislar',
  title: 'Tarihi Şahıslar',
  description:
    'Bilim insanlarının keşiflerini adım adım keşfedin. Galileo ile başlayın: teleskop, güneş lekeleri ve Güneş’in dönüşü.',
  engine: 'dom',
  category: 'astronomi',
  models: [],
  hints: [
    'Listeden bir şahıs seçin',
    'Adımları sırayla okuyun',
    '?who=galileo ile doğrudan açabilirsiniz',
  ],
  guideFocusKeys: ['welcome', 'list', 'steps', 'next'],
  eventTypes: ['figure-select', 'step-change', 'board-complete'],
}

/**
 * @typedef {{ id: string, title: string, body: string }} FigureStep
 * @typedef {{
 *   id: string,
 *   name: string,
 *   lifespan: string,
 *   role: string,
 *   summary: string,
 *   portrait: string,
 *   accent: string,
 *   steps: FigureStep[],
 * }} HistoricalFigure
 */

/** @type {HistoricalFigure[]} */
export const FIGURES = [
  {
    id: 'galileo',
    name: 'Galileo Galilei',
    lifespan: '1564–1642',
    role: 'Astronom ve fizikçi',
    summary:
      'Teleskopu gökyüzüne çevirerek Güneş lekelerini gözlemledi ve Güneş’in döndüğünü gösterdi.',
    portrait: '/assets/simulations/tarihi-sahislar/galileo.png',
    accent: '#fbbf24',
    steps: [
      {
        id: 'kimdir',
        title: 'Kimdir?',
        body:
          'Galileo Galilei, İtalya’da yaşamış bir bilim insanıdır. Doğayı deneme ve gözlemle anlamaya çalışmıştır. “Kanıtlara bak!” fikriyle bilim tarihinin önemli isimlerinden biri sayılır.',
      },
      {
        id: 'teleskop',
        title: 'Teleskopu gökyüzüne çevirmek',
        body:
          '1609’da teleskopu geliştirip gökyüzüne yöneltti. Ay’ın yüzeyini, Jüpiter’in uydularını ve daha önce çıplak gözle görülmeyen ayrıntıları inceledi. Teleskop, uzak gök cisimlerini yakına getiren bir mercek gibi düşünülebilir.',
      },
      {
        id: 'gunes-lekeleri',
        title: 'Güneş lekelerini görmek',
        body:
          'Galileo, Güneş’i dikkatli şekilde gözlemlediğinde yüzeyinde koyu lekeler fark etti. Bunlara güneş lekeleri denir. Lekeler, Güneş’in her zaman aynı “kusursuz” görünüme sahip olmadığını gösterdi.',
      },
      {
        id: 'donme-yonu',
        title: 'Güneş dönüyor!',
        body:
          'Lekelerin günler içinde yer değiştirdiğini izleyerek Güneş’in kendi ekseni etrafında döndüğünü anladı. Lekeler bir yandan diğer yana kayıyordu — tıpkı dönen bir topun üzerindeki işaret gibi. Böylece Güneş’in hem kendi ekseninde döndüğü hem de bu hareketin yönü hakkında kanıt toplanmış oldu.',
      },
    ],
  },
]

export function getFigure(who) {
  if (!who) return null
  const id = String(who).toLowerCase().trim()
  return FIGURES.find((f) => f.id === id) ?? null
}
