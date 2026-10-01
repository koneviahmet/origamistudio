// Sosyal medya simgeleri (düz vektör, tek facet / parça): instagram, youtube.   node scripts/seed-sosyal.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'data', 'library', 'marka');
const r1 = (v) => Math.round(v * 10) / 10;
const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return [r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))]; });
const yuvarlak = (x, y, w, h, r, n = 8) => [...arc(x + w - r, y + r, r, -90, 0, n), ...arc(x + w - r, y + h - r, r, 0, 90, n), ...arc(x + r, y + h - r, r, 90, 180, n), ...arc(x + r, y + r, r, 180, 270, n)];
const daire = (cx, cy, r, n = 40, ters = false) => { const p = arc(cx, cy, r, 0, 360, n).slice(0, -1); return ters ? p.reverse() : p; };
const halka = (cx, cy, ro, ri) => { const d = daire(cx, cy, ro); const i = daire(cx, cy, ri, 40, true); return [...d, d[0], i[0], ...i, i[0]]; };
const dyn = (x, y, w, h, ro, ri) => { // yuvarlak kare halkası (anahtar deliği)
  const d = yuvarlak(x, y, w, h, ro, 10);
  const i = yuvarlak(x + (ro - ri) + 0, y + (ro - ri) + 0, w - 2 * (ro - ri), h - 2 * (ro - ri), ri, 10).reverse();
  return [...d, d[0], i[0], ...i, i[0]];
};

const modeller = [
  {
    id: 'instagram-logo', name: 'Instagram logosu', tags: ['logo', 'marka', 'sosyal', 'instagram'], size: [200, 200], palette: { a: '#ffffff' }, roles: { a: 'ana' },
    variants: { koyu: { name: 'Koyu', palette: { a: '#10101c' } }, pembe: { name: 'Pembe', palette: { a: '#d62976' } } },
    facets: [
      { p: dyn(8, 8, 184, 184, 54, 36), c: 'a', s: 0 },
      { p: halka(100, 100, 46, 30), c: 'a', s: 0 },
      { p: daire(150, 50, 11), c: 'a', s: 0 },
    ],
  },
  {
    id: 'youtube-logo', name: 'YouTube logosu', tags: ['logo', 'marka', 'sosyal', 'youtube'], size: [240, 170], palette: { a: '#ff0000', w: '#ffffff' }, roles: { a: 'ana' },
    variants: { koyu: { name: 'Koyu', palette: { a: '#cc0000', w: '#ffffff' } } },
    facets: [
      { p: yuvarlak(6, 6, 228, 158, 46, 10), c: 'a', s: 0 },
      { p: [[96, 52], [96, 118], [158, 85]], c: 'w', s: 0 },
    ],
  },
];
fs.mkdirSync(DIR, { recursive: true });
for (const m of modeller) fs.writeFileSync(path.join(DIR, `${m.id}.json`), JSON.stringify(m, null, 2) + '\n');
console.log(`ok — ${modeller.length} simge (marka/)`);
