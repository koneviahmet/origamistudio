import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Çizim / boya stili örneği — "Türk Kahvesi": node scripts/scenes-kahve-cizim.mjs
// Kütüphaneye cezve + fincan varlıklarını, projeye scene.json'u baştan yazar
// (stüdyoda yapılan elle düzenlemeler kaybolur).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library', 'nesneler');
const dir = path.join(ROOT, 'data', 'projects', 'kahve-cizim');
const k = (t, v, ease) => (ease ? { t, v, ease } : { t, v });
const F = (p, c, s = 0, extra = {}) => ({ p, c, s, ...extra });

// ------------------------------------------------------------ varlıklar
const assets = [
  {
    id: 'cezve',
    name: 'Cezve',
    tags: ['kahve', 'mutfak', 'bakır'],
    size: [200, 200],
    palette: { a: '#d9823b', b: '#a85a24', c: '#7a4a2a' },
    roles: { a: 'ana', b: 'ikincil', c: 'koyu' },
    facets: [
      // sap (iki üçgen)
      F([[126, 104], [188, 56], [196, 66]], 'c', 0.06),
      F([[126, 104], [196, 66], [132, 118]], 'c', -0.16),
      // gövde
      F([[58, 190], [100, 190], [100, 96], [72, 96]], 'a', 0.08),
      F([[100, 190], [142, 190], [128, 96], [100, 96]], 'a', -0.14),
      // ağız ve gaga
      F([[60, 80], [100, 80], [100, 96], [72, 96]], 'b', 0.05),
      F([[100, 80], [140, 80], [128, 96], [100, 96]], 'b', -0.12),
      F([[46, 70], [62, 80], [72, 94]], 'b', 0.02),
      // dövme bant
      F([[63, 160], [137, 160], [139, 170], [61, 170]], 'b', -0.04),
    ],
  },
  {
    id: 'fincan',
    name: 'Kahve Fincanı',
    tags: ['kahve', 'fincan', 'tabak'],
    size: [200, 160],
    palette: { a: '#f5efe2', b: '#c8453b', c: '#5a3420', d: '#e3c79c' },
    roles: { a: 'acik', b: 'vurgu', c: 'koyu', d: 'ikincil' },
    facets: [
      // tabak
      F([[14, 138], [100, 138], [100, 154], [34, 152]], 'd', 0.06),
      F([[100, 138], [186, 138], [166, 152], [100, 154]], 'd', -0.12),
      // kulp
      F([[146, 74], [178, 78], [180, 108], [142, 118], [144, 104], [166, 100], [166, 88], [148, 88]], 'a', -0.1),
      // gövde
      F([[44, 60], [100, 60], [100, 136], [60, 136]], 'a', 0.06),
      F([[100, 60], [156, 60], [140, 136], [100, 136]], 'a', -0.14),
      // desen bandı
      F([[50, 88], [150, 88], [147, 102], [53, 102]], 'b', 0),
      // kahve yüzeyi
      F([[44, 60], [156, 60], [150, 70], [50, 70]], 'c', -0.05),
    ],
  },
];
for (const a of assets) {
  fs.mkdirSync(LIB, { recursive: true });
  fs.writeFileSync(path.join(LIB, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
}

// ------------------------------------------------------------ sahne
const hand = (id, text, x, y, size, t0, dur, extra = {}) => ({
  id, type: 'text', text, x, y, size, font: 'Caveat', weight: 700, color: '#2d3561',
  reveal: [k(t0, 0), k(t0 + dur, 1, 'linear')],
  ...extra,
});

const layers = [
  // gökyüzü
  { id: 'gunes', asset: 'gunes', x: 940, y: 140, scale: 0.75, anims: [{ preset: 'cizerek-gir', t: 0.4, dur: 1.8 }, { preset: 'don', t: 2.2, periyot: 40 }] },
  {
    id: 'bulut', asset: 'bulut', x: [k(0, 230), k(16, 330, 'linear')], y: 190, scale: 0.8,
    anims: [{ preset: 'cizerek-gir', t: 0.9, dur: 1.8 }],
  },
  hand('baslik', "Türk Kahvesi'nin\nYolculuğu", 540, 150, 76, 0.2, 1.6, { lineHeight: 1.05, anims: [{ preset: 'sol', t: 9.4, dur: 0.6 }] }),

  // zemin
  { id: 'tepeler', asset: 'tepeler', x: 540, y: 905, anchor: [0.5, 1], scale: 2.8,
    sketch: { ink: '#4d7d45', width: 2.4 }, // zemin daha yumuşak yeşil kalemle
    anims: [{ preset: 'cizerek-gir', t: 0.6, dur: 2.4 }],
  },

  // kahvehane
  {
    id: 'kahvehane', asset: 'ev', x: 290, y: 880, anchor: [0.5, 1], scale: 2.3,
    palette: { a: '#e8833a', c: '#f2d27a', b: '#7a4a2a', d: '#8cc7de' },
    anims: [{ preset: 'cizerek-gir', t: 2.0, dur: 2.8 }, { preset: 'silinerek-cik', t: 9.2, dur: 1.2 }],
  },
  hand('tabela', 'KAHVE', 290, 690, 54, 4.6, 0.6, {
    color: '#ffffff', box: { color: '#3f8f6b', radius: 8, shadow: false, padding: [4, 16] },
    anims: [{ preset: 'sol', t: 9.2, dur: 0.6 }],
  }),

  // cezve ve fincan
  {
    id: 'cezve', asset: 'cezve', x: 640, y: 880, anchor: [0.5, 1], scale: 1.05,
    anims: [
      { preset: 'cizerek-gir', t: 4.2, dur: 2.2 },
      { preset: 'sallan', t: 6.6, aci: 3, periyot: 1.8 },
      { preset: 'silinerek-cik', t: 9.3, dur: 1.0 },
    ],
  },
  {
    id: 'fincan', asset: 'fincan',
    x: [k(0, 870), k(9.8, 870), k(11.2, 540, 'inOutCubic')],
    y: [k(0, 880), k(9.8, 880), k(11.2, 730, 'inOutCubic')],
    scale: [k(0, 0.95), k(9.8, 0.95), k(11.2, 2.3, 'inOutCubic')],
    anchor: [0.5, 1],
    anims: [{ preset: 'cizerek-gir', t: 5.6, dur: 2.2 }],
  },

  // cezveden fincana el çizimi ok (ok katmanı: nesneden nesneye geçiş)
  {
    id: 'ok-ikram', type: 'arrow', arrow: 'ok-el-cizimi', from: 'cezve', to: 'fincan', bend: 0.5, gap: 12,
    fromAnchor: 'ust', toAnchor: 'ust', // iki nesnenin üstünden yay
    label: 'ikram', labelPos: 0.5,
    anims: [{ preset: 'cizerek-gir', t: 7.8, dur: 1.1 }, { preset: 'silinerek-cik', t: 9.2, dur: 0.6 }],
  },

  // yıl ve açıklama (videodaki gibi alt bant)
  hand('yil-1554', '1554', 540, 975, 64, 2.2, 0.5, { anims: [{ preset: 'sol', t: 9.2, dur: 0.5 }] }),
  hand('aciklama-1', "İstanbul'da ilk kahvehane açılır", 540, 1030, 40, 2.8, 1.4, { anims: [{ preset: 'sol', t: 9.2, dur: 0.5 }] }),

  // kapanış
  hand('soz', 'Bir fincan kahvenin\nkırk yıl hatırı vardır', 540, 895, 64, 11.6, 2.2, {
    lineHeight: 1.1, box: { color: '#fbf6ea', opacity: 0.9, radius: 18, shadow: false, padding: [14, 30] },
  }),
];

const scene = {
  name: 'Türk Kahvesi (çizim)',
  width: 1080,
  height: 1080,
  fps: 30,
  duration: 16,
  style: 'cizim',
  sketch: { ink: '#2d3561', width: 3.4, wobble: 1.4, hatch: 5, angle: 62, wipe: 35 },
  background: { type: 'solid', color: '#f7f1e3', paper: 0.6, vignette: 0.08 },
  sections: [
    { t: 0, name: 'Açılış' },
    { t: 2, name: 'Kahvehane' },
    { t: 9.2, name: 'Fincan' },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log('ok', scene.layers.length, 'katman,', scene.duration, 'sn');
