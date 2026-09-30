import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Ok sistemi vitrini: node scripts/scenes-ok-vitrini.mjs  (scene.json'u baştan yazar)
// Üç bölüm: rota + yolcu, bilim (neon / noktalı akış), süreç (akış şeması) → kapanış vurgusu.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', 'ok-vitrini');
const k = (t, v, ease) => (ease ? { t, v, ease } : { t, v });

const title = (id, text, t0, t1) => ({
  id, type: 'text', textStyle: 'baslik-kalin', text, x: 540, y: 110, size: 64, start: t0, end: t1,
  textAnims: [{ preset: 'harf-zipla', t: t0 + 0.1, dur: 0.45, aralik: 0.03 }],
  anims: [{ preset: 'sol', t: t1 - 0.45, dur: 0.4 }],
});
const node = (id, text, x, y, t0, t1, extra = {}) => ({
  id, type: 'text', textStyle: 'etiket-kutu', text, x, y, size: 58, start: t0, end: t1,
  anims: [{ preset: 'zipla-gir', t: t0, dur: 0.5 }, { preset: 'sol', t: t1 - 0.45, dur: 0.4 }],
  ...extra,
});
const thing = (id, asset, x, y, scale, t0, t1, extra = {}) => ({
  id, asset, x, y, scale, start: t0, end: t1,
  anims: [{ preset: 'zipla-gir', t: t0, dur: 0.6 }, { preset: 'kuculerek-cik', t: t1 - 0.6, dur: 0.5 }],
  ...extra,
});
const arrow = (id, style, from, to, t0, dur, t1, extra = {}) => ({
  id, type: 'arrow', arrow: style, from, to, start: t0, end: t1,
  fold: [k(t0, 0), k(t0 + dur, 1, 'inOutSine')],
  anims: [{ preset: 'sol', t: t1 - 0.45, dur: 0.4 }],
  ...extra,
});

const layers = [
  // ------------------------------------------------ 1) Rota: İstanbul → Viyana, kağıt gemi yolcu
  title('b1', 'Bir yolculuk', 0, 5.4),
  node('istanbul', 'İstanbul', 230, 820, 0.3, 5.4),
  node('viyana', 'Viyana', 830, 330, 0.6, 5.4),
  arrow('rota', 'ok-kesikli-rota', 'istanbul', 'viyana', 1.2, 2.2, 5.4, {
    bend: 0.35, label: '1683', labelPos: 0.55,
    rider: { asset: 'kagit-gemi', scale: 0.5, orient: 'cevir', lift: 18 },
  }),

  // ------------------------------------------------ 2) Bilim: Güneş → Dünya → Ay
  title('b2', 'Işık ve çekim', 5.4, 10.8),
  thing('gunes', 'gunes', 210, 330, 1.1, 5.6, 10.8, { anims: [{ preset: 'zipla-gir', t: 5.6, dur: 0.6 }, { preset: 'don', t: 6.2, periyot: 30 }, { preset: 'kuculerek-cik', t: 10.2, dur: 0.5 }] }),
  thing('dunya', 'dunya', 600, 600, 0.9, 5.9, 10.8),
  thing('ay', 'ay', 900, 860, 0.45, 6.2, 10.8),
  arrow('isik', 'ok-neon', 'gunes', 'dunya', 6.6, 1.3, 10.8, { label: 'ışık', labelColor: '#0e7490' }),
  arrow('cekim', 'ok-noktali-akis', 'dunya', 'ay', 7.9, 1.1, 10.8, { label: 'çekim', bend: 0.25 }),

  // ------------------------------------------------ 3) Süreç: akış şeması (dirsek, sabit çapalar)
  title('b3', 'Fikirden videoya', 10.8, 17),
  node('fikir', 'Fikir', 210, 300, 11.0, 17),
  node('taslak', 'Taslak', 540, 560, 11.3, 17),
  node('video', 'Video', 870, 820, 11.6, 17),
  arrow('s1', 'ok-akis-semasi', 'fikir', 'taslak', 12.0, 1.0, 17, { fromAnchor: 'sag', toAnchor: 'ust' }),
  arrow('s2', 'ok-akis-semasi', 'taslak', 'video', 13.0, 1.0, 17, { fromAnchor: 'sag', toAnchor: 'ust' }),
  // Geri bildirim döngüsü: çift çizgi, ters kavis
  arrow('geri', 'ok-el-cizimi', 'video', 'fikir', 14.2, 1.4, 17, { bend: 0.35, label: 'geri bildirim', labelPos: 0.5, color: '#b5651d' }),
  // Kapanış vurgusu
  thing('yildiz', 'yildiz', 880, 330, 0.55, 14.8, 17, { anims: [{ preset: 'zipla-gir', t: 14.8, dur: 0.6 }, { preset: 'nabiz', t: 15.4, genlik: 0.08, periyot: 1.2 }] }),
  arrow('hedef', 'ok-kalin-golge', 'video', 'yildiz', 15.3, 0.9, 17, { bend: -0.2, gap: 26 }),
];

const scene = {
  name: 'Ok Vitrini',
  width: 1080,
  height: 1080,
  fps: 30,
  duration: 17,
  background: { type: 'radial', colors: ['#fdf6ea', '#efdcc0'], cx: 0.5, cy: 0.45, paper: 0.45, vignette: 0.12 },
  sections: [
    { t: 0, name: 'Rota + yolcu' },
    { t: 5.4, name: 'Neon / noktalı akış' },
    { t: 10.8, name: 'Akış şeması' },
  ],
  transitions: [
    { type: 'iris', t: 5.4, dur: 0.9, color: '#efdcc0' },
    { type: 'iris', t: 10.8, dur: 0.9, color: '#efdcc0' },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log('ok', scene.layers.length, 'katman,', scene.duration, 'sn');
