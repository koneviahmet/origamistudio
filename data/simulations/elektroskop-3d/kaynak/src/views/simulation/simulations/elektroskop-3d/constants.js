/** Yük seçenekleri */
export const CHARGE_OPTIONS = [
  { id: 'n', label: 'Nötr (n)', short: 'n', color: '#fbbf24' },
  { id: '+', label: 'Pozitif (+)', short: '+', color: '#f87171' },
  { id: '-', label: 'Negatif (−)', short: '−', color: '#60a5fa' },
]

/** Deney sonuç mesajları — anahtar: elektroskop + cisim + temas */
export const EXPERIMENT_MESSAGES = {
  nnn: 'Elektroskobun başlangıç yük durumunu seçin.',
  nnd: 'Nötr bir elektroskoba nötr bir cisim dokunursa yaprakların durumu değişmez.',
  'n+d': 'Nötr bir elektroskoba pozitif bir cisim dokundurulursa elektroskop pozitif yüklenir ve yapraklar açılır.',
  'n-d': 'Nötr bir elektroskoba negatif bir cisim dokundurulursa elektroskop negatif yüklenir ve yapraklar açılır.',
  '++d': 'Pozitif yüklü elektroskoba pozitif cisim dokundurulursa yaprak durumu değişmez; yükler eşit dağılır.',
  '+-d': 'Pozitif yüklü elektroskoba negatif cisim dokundurulursa elektroskop nötrleşir ve yapraklar kapanır.',
  '-nd': 'Negatif yüklü elektroskoba nötr cisim dokunursa yaprakların yükü azalır ve biraz kapanır.',
  '+nd': 'Pozitif yüklü elektroskoba nötr cisim dokunursa yaprakların yükü azalır ve biraz kapanır.',
  '--d': 'Negatif yüklü elektroskoba negatif cisim dokundurulursa yaprak durumu değişmez.',
  '-+d': 'Negatif yüklü elektroskoba pozitif cisim dokundurulursa elektroskop nötrleşir ve yapraklar kapanır.',
  nny: 'Nötr bir elektroskoba nötr cisim yaklaştırılırsa yaprakların durumu değişmez.',
  'n+y': 'Nötr elektroskoba pozitif cisim yaklaştırılırsa yapraklar açılır; topuzda zıt (−) yük birikir.',
  'n-y': 'Nötr elektroskoba negatif cisim yaklaştırılırsa yapraklar açılır; topuzda zıt (+) yük birikir.',
  '+ny': 'Pozitif yüklü elektroskoba nötr cisim yaklaştırılırsa yaprak durumu değişmez.',
  '-ny': 'Negatif yüklü elektroskoba nötr cisim yaklaştırılırsa yaprak durumu değişmez.',
  '++y': 'Pozitif yüklü elektroskoba pozitif cisim yaklaştırılırsa yaprakların açıklığı artar.',
  '+-y': 'Pozitif yüklü elektroskoba negatif cisim yaklaştırılırsa yapraklar bir miktar kapanır.',
  '-+y': 'Negatif yüklü elektroskoba pozitif cisim yaklaştırılırsa yapraklar bir miktar kapanır.',
  '--y': 'Negatif yüklü elektroskoba negatif cisim yaklaştırılırsa yaprakların açıklığı artar.',
}

export const SCENE_COLORS = {
  metal: 0x64748b,
  glass: 0x7dd3fc,
  gold: 0xfbbf24,
  positive: 0xf87171,
  negative: 0x60a5fa,
  neutral: 0xfbbf24,
  platform: 0x1e293b,
  objectNeutral: 0x94a3b8,
}
