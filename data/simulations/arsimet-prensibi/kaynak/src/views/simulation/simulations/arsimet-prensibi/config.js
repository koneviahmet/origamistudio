/**
 * Arşimet Prensibi simülasyonu yapılandırması.
 * Taşlar prosedürel; katalog modelleri yalnızca isteğe bağlı dekor için.
 */
export const arsimetPrensibiConfig = {
  slug: 'arsimet-prensibi',
  title: 'Arşimet Prensibi ve Sıvıların Kaldırma Kuvveti',
  description:
    'Farklı yoğunluktaki cisimlerin sıvı içindeki davranışını ve su seviyesindeki değişimi gözlemleyin.',
  engine: 'three',
  category: 'fizik',
  models: [],
  hints: [
    'Sürükleyerek kamerayı döndürün, tekerlek ile yakınlaştırın',
    'Panelden bir taş seçin — taş suya bırakılır',
    'Su seviyesindeki artışı ve taşın batma/yüzme davranışını izleyin',
  ],
  guideFocusKeys: ['welcome', 'camera', 'panel', 'stone'],
  eventTypes: ['stone-select', 'simulation-complete'],
}
