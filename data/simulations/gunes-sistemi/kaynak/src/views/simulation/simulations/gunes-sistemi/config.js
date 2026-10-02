/**
 * Güneş Sistemi simülasyonu yapılandırması.
 * Model kütüphanesindeki space paketi modelleri asteroit ve uydu için kullanılır.
 */
export const gunesSistemiConfig = {
  slug: 'gunes-sistemi',
  title: 'Güneş Sistemi',
  description: 'Gezegenlerin Güneş etrafındaki yörüngelerini gözlemleyin.',
  engine: 'three',
  /** Model kütüphanesi / asset-catalog referansları */
  models: [
    { pack: 'space', asset: 'meteor', role: 'asteroid' },
    { pack: 'space', asset: 'meteor_detailed', role: 'asteroid' },
    { pack: 'space', asset: 'craft_miner', role: 'satellite' },
  ],
  defaultSpeed: 1,
  hints: [
    'Sürükleyerek kamerayı döndürün',
    'Tekerlek ile yakınlaştırın',
    'Gezegenlere tıklayarak seçin',
  ],
}
