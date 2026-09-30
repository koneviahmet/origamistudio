// "Atomun hikâyesi" için yeni varlıklar → data/library/atom
//   node scripts/seed-atom.mjs      (her çalıştırmada üzerine yazar; bu dosya kaynak)
// Hepsi pastel paletli, çizim stiline (style: "cizim") uygun: az bölge, net dış hat.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'library', 'atom');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const F = (p, c, s = 0, extra = {}) => ({ p, c, s: r1(s * 100) / 100, ...extra });

/** Dikdörtgen = iki üçgen, zıt gölge */
const rect = (x, y, w, h, c, s = 0, extra = {}) => [
  F([[x, y], [x + w, y], [x + w, y + h]], c, s + 0.09, extra),
  F([[x, y], [x + w, y + h], [x, y + h]], c, s - 0.09, extra),
];
/** Elips: merkezden dilimler, ışık sol üstten */
const ellipse = (cx, cy, rx, ry, c, s = 0, n = 20, extra = {}) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = (360 / n) * i;
    const a1 = (360 / n) * (i + 1);
    const am = rad((a0 + a1) / 2);
    const light = Math.cos(am - rad(225)) * 0.28;
    out.push(F([[cx, cy], [r1(cx + rx * Math.cos(rad(a0))), r1(cy + ry * Math.sin(rad(a0)))], [r1(cx + rx * Math.cos(rad(a1))), r1(cy + ry * Math.sin(rad(a1)))]], c, s + light, extra));
  }
  return out;
};
/** Halka: dış/iç yarıçap arası dilimler (her dilim iki üçgen) */
const ring = (cx, cy, ro, ri, c, n = 56, extra = {}) => {
  const out = [];
  const pt = (r, a) => [r1(cx + r * Math.cos(rad(a))), r1(cy + r * Math.sin(rad(a)))];
  for (let i = 0; i < n; i++) {
    const a0 = (360 / n) * i;
    const a1 = (360 / n) * (i + 1);
    out.push(F([pt(ro, a0), pt(ro, a1), pt(ri, a1)], c, 0.08, extra), F([pt(ro, a0), pt(ri, a1), pt(ri, a0)], c, -0.08, extra));
  }
  return out;
};

const assets = {
  'atom-kure': {
    name: 'Atom küresi',
    tags: ['atom', 'küre', 'şekil'],
    size: [200, 200],
    palette: { a: '#ffc8a8', c: '#fff4ea' },
    roles: { a: 'ana', c: 'acik' },
    facets: [...ellipse(100, 100, 96, 96, 'a', 0, 22), ...ellipse(68, 66, 24, 15, 'c', 0.25, 12)],
  },
  'atom-halka': {
    name: 'Yörünge halkası',
    tags: ['atom', 'halka', 'şekil'],
    size: [200, 200],
    palette: { a: '#cdb4f6' },
    roles: { a: 'ana' },
    facets: ring(100, 100, 96, 90, 'a', 56),
  },
  'atom-yorunge': {
    name: 'Yörünge + elektron',
    tags: ['atom', 'yörünge', 'elektron'],
    size: [200, 200],
    center: [100, 100],
    palette: { a: '#cdb4f6', e: '#9bd4f5', c: '#e8f6ff' },
    roles: { a: 'ana', e: 'vurgu', c: 'acik' },
    parts: { e: { pivot: [100, 100] } },
    facets: [...ring(100, 100, 88, 83, 'a', 56), ...ellipse(100, 15, 13, 13, 'e', 0, 14, { part: 'e' }), ...ellipse(96, 11, 5, 4, 'c', 0.25, 8, { part: 'e' })],
  },
  'atom-blok': {
    name: 'Bölünen blok',
    tags: ['atom', 'blok', 'şekil'],
    size: [200, 200],
    palette: { a: '#ffe29a', b: '#ffd06b' },
    roles: { a: 'ana', b: 'ikincil' },
    facets: [...rect(10, 10, 180, 180, 'a', 0), ...rect(10, 10, 180, 34, 'b', 0.1)],
  },
  'atom-levha': {
    name: 'Altın levha',
    tags: ['atom', 'levha', 'altın'],
    size: [60, 420],
    palette: { a: '#ffe08a', b: '#ffcb52' },
    roles: { a: 'ana', b: 'ikincil' },
    facets: [...rect(0, 0, 60, 420, 'a', 0), ...rect(12, 30, 8, 360, 'b', 0.1)],
  },
  'atom-kaynak': {
    name: 'Işın kaynağı',
    tags: ['atom', 'deney', 'tüp'],
    size: [220, 120],
    palette: { a: '#cdb4f6', b: '#b39cf0', c: '#ffe08a' },
    roles: { a: 'ana', b: 'ikincil', c: 'vurgu' },
    facets: [...rect(60, 20, 160, 80, 'a', 0), ...rect(0, 46, 70, 28, 'b', -0.05), ...ellipse(200, 60, 12, 12, 'c', 0.15, 10)],
  },
  'atom-cekirdek': {
    name: 'Çekirdek (proton + nötron)',
    tags: ['atom', 'çekirdek'],
    size: [100, 100],
    palette: { a: '#ffb3c1', b: '#bde0fe', c: '#fff0f3' },
    roles: { a: 'ana', b: 'ikincil' },
    facets: [
      ...ellipse(90, 50, 19, 19, 'b', 0, 14),
      ...ellipse(70, 85, 19, 19, 'a', 0, 14),
      ...ellipse(30, 85, 19, 19, 'b', 0, 14),
      ...ellipse(10, 50, 19, 19, 'a', 0, 14),
      ...ellipse(30, 15, 19, 19, 'b', 0, 14),
      ...ellipse(70, 15, 19, 19, 'a', 0, 14),
      ...ellipse(50, 50, 19, 19, 'a', 0, 14),
    ],
  },
  'atom-bulut': {
    name: 'Elektron bulutu',
    tags: ['atom', 'bulut', 'kuantum'],
    size: [240, 240],
    palette: { a: '#efe6ff', b: '#dccbfb', c: '#c6aef6' },
    roles: { a: 'acik', b: 'ikincil', c: 'ana' },
    facets: [...ellipse(120, 120, 117, 117, 'a', 0, 26), ...ellipse(120, 120, 84, 84, 'b', 0, 22), ...ellipse(120, 120, 50, 50, 'c', 0, 18)],
  },
};

fs.mkdirSync(DIR, { recursive: true });
for (const [id, a] of Object.entries(assets)) fs.writeFileSync(path.join(DIR, `${id}.json`), JSON.stringify({ id, ...a }, null, 2) + '\n');
console.log(`ok — ${Object.keys(assets).length} varlık → data/library/atom`);
