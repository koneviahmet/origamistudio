/**
 * Elektroskop 3D simülasyonu yapılandırması.
 * Elektroskop ve deney cismi prosedürel; lab masası isteğe bağlı dekor.
 */
export const elektroskop3dConfig = {
  slug: 'elektroskop-3d',
  title: 'Elektroskop 3D',
  description:
    'Elektroskobun yüklenme ve yaprak hareketini 3 boyutlu olarak gözlemleyin; farklı yüklü cisimlerle deney yapın.',
  engine: 'three',
  category: 'fizik',
  models: [
    { pack: 'school-lab', asset: 'lab-table', role: 'decoration' },
  ],
  hints: [
    'Sürükleyerek kamerayı döndürün, tekerlek ile yakınlaştırın',
    'Önce elektroskobun yük durumunu, sonra cismin yükünü seçin',
    'Yaklaştırma ve dokundurma farklı sonuçlar verir — topraklama ile sıfırlayın',
  ],
  guideFocusKeys: ['welcome', 'camera', 'panel', 'charge', 'ground'],
  eventTypes: ['charge-select', 'experiment-run', 'ground'],
}
