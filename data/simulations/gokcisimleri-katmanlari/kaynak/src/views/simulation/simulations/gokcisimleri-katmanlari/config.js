/**
 * Güneş, Dünya ve Ay katmanları — çift tıklanınca kesit görünümü.
 */
export const gokcisimleriKatmanlariConfig = {
  slug: 'gokcisimleri-katmanlari',
  title: 'Gök Cisimlerinin Katmanları',
  description:
    'Güneş, Dünya ve Ay’ı inceleyin. Çift tıklayarak iç katman kesitini görün.',
  engine: 'three',
  category: 'astronomi',
  models: [],
  defaultSpeed: 0.6,
  hints: [
    'Bir gök cismine çift tıklayarak katman kesitini açın',
    'Boş alana çift tıklayarak genel görünüme dönün',
    'Sürükleyerek kamerayı döndürün',
  ],
  guideFocusKeys: ['welcome', 'camera', 'bodies', 'cutaway', 'sim-panel'],
  eventTypes: ['body-select', 'cutaway-open', 'cutaway-close', 'speed-change'],
}
