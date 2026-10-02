/**
 * Ay'ın Evreleri 3D simülasyonu yapılandırması.
 * Güneş, Dünya ve Ay prosedürel; yerel texture dosyaları varsa kullanılır.
 */
export const ayinEvreleri3dConfig = {
  slug: 'ayin-evreleri-3d',
  title: "Ay'ın Evreleri 3D",
  description:
    "Ay'ın Dünya etrafındaki hareketi sırasında oluşan evreleri 3 boyutlu olarak gözlemleyin.",
  engine: 'three',
  category: 'astronomi',
  models: [],
  defaultSpeed: 0.5,
  hints: [
    'Sürükleyerek kamerayı döndürün, tekerlek ile yakınlaştırın',
    'Oynat ile Ay\'ın yörüngesini izleyin; hızı ayarlayın',
    'Evre düğmelerine tıklayarak belirli bir evreye atlayın',
  ],
  guideFocusKeys: ['welcome', 'camera', 'speed', 'phase', 'play'],
  eventTypes: ['phase-select', 'phase-change', 'speed-change', 'play-toggle'],
}
