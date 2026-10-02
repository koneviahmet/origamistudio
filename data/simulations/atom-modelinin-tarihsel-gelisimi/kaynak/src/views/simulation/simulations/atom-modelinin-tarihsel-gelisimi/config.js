/**
 * Atom Modelinin Tarihsel Gelişimi — yapılandırma.
 * Tarihsel atom modelleri prosedürel; katalog modeli isteğe bağlı dekor.
 */
export const atomTarihselGelisimiConfig = {
  slug: 'atom-modelinin-tarihsel-gelisimi',
  title: 'Atom Modelinin Tarihsel Gelişimi',
  description:
    'Dalton’dan modern kuantum modeline kadar atom teorilerini 3D olarak keşfedin.',
  engine: 'three',
  category: 'kimya',
  models: [
    { pack: 'school-lab', asset: 'atom-model', role: 'decoration' },
  ],
  hints: [
    'Sürükleyerek kamerayı döndürün, tekerlek ile yakınlaştırın',
    'Tarih düğmeleri ile modeller arasında gezinin',
    'Rutherford ve Bohr modellerinde deney düğmelerini deneyin',
  ],
  guideFocusKeys: ['welcome', 'camera', 'panel', 'timeline', 'model', 'experiment'],
  eventTypes: [
    'model-select',
    'rutherford-experiment',
    'electron-jump',
  ],
}
