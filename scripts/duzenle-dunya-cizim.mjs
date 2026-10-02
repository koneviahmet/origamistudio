// Dünya (çizim) modelini referans görsele (düz renkli, kalın kıtalı küre) göre yeniden üretir; kütüphanedeki dosyanın üzerine yazar.
//   node scripts/duzenle-dunya-cizim.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'library', 'uzay', 'dunya-cizim.json');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const R = 118, C = [150, 150];
// referans görsel koordinatı → model (küre merkezi (242,165), yarıçap 155)
const S = R / 155;
const m = ([x, y]) => {
  let px = (x - 242) * S, py = (y - 165) * S;
  const d = Math.hypot(px, py);
  if (d > R - 0.5) { px *= (R - 0.5) / d; py *= (R - 0.5) / d; } // kıtalar küre kenarında kesilir
  return [r1(C[0] + px), r1(C[1] + py)];
};
const poly = (pts) => pts.map(m);
const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = rad(a0 + ((a1 - a0) * i) / n); return [r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))]; });
const disk = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, i) => [r1(cx + rx * Math.cos(rad((360 * i) / n))), r1(cy + ry * Math.sin(rad((360 * i) / n)))]);
const F = (p, c, s = 0) => ({ p, c, s });

const okyanus = arc(C[0], C[1], R, 0, 360, 64).slice(0, -1);
// sağ-alt gölge hilali: dış yay (küre) + iç yay (kaydırılmış daire)
const golge = [...arc(C[0], C[1], R - 0.5, -75, 80, 24), ...arc(C[0] - 52, C[1] - 18, R + 4, 80, -75, 24).map(([x, y]) => {
  const dx = x - C[0], dy = y - C[1], d = Math.hypot(dx, dy);
  return d > R - 0.5 ? [r1(C[0] + dx * (R - 0.5) / d), r1(C[1] + dy * (R - 0.5) / d)] : [x, y];
})];

const sol = poly([[215, 14], [205, 40], [185, 65], [173, 85], [185, 98], [210, 103], [218, 115], [205, 135], [198, 155], [205, 185], [208, 215], [195, 237], [178, 235], [165, 215], [155, 195], [135, 175], [125, 155], [127, 140], [105, 130], [92, 128], [96, 100], [115, 75], [140, 48], [170, 28]]);
const ustSag = poly([[290, 20], [270, 38], [245, 58], [240, 75], [255, 90], [275, 85], [300, 70], [330, 68], [360, 68], [350, 45], [325, 30], [305, 22]]);
const altSag = poly([[390, 190], [350, 185], [320, 185], [300, 188], [290, 200], [305, 215], [300, 232], [280, 255], [270, 275], [275, 300], [258, 320], [300, 312], [345, 285], [378, 240]]);
const ada = disk(...m([115, 220]), 7, 9, 14);

const doc = {
  id: 'dunya-cizim',
  name: 'Dünya (çizim)',
  tags: ['dünya', 'gezegen', 'mavi', 'okyanus', 'kıta', 'çizim', 'pastel', 'uzay'],
  size: [300, 300],
  palette: { a: '#2cc4ff', b: '#b2f55f', c: '#a3df59', d: '#26b0ff', k: '#e6f9ff' },
  roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', k: 'vurgu' },
  facets: [F(okyanus, 'a', 0), F(golge, 'd', 0), F(sol, 'b', 0), F(ustSag, 'b', 0), F(altSag, 'c', 0), F(ada, 'b', 0)],
};
fs.writeFileSync(FILE, JSON.stringify(doc, null, 2) + '\n');
console.log('yazıldı:', FILE);
