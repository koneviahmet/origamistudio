// "Abone ol / beğen / yorum yap" bitiş bölümü için çizim (cizim stili) uyumlu modeller.
//   node scripts/seed-abone.mjs [--force]   →  data/library/iletisim/{basparmak,yorum-balonu,zil}-cizim.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, deg, ry = r) => [r1(cx + r * Math.cos(rad(deg))), r1(cy + ry * Math.sin(rad(deg)))];
const F = (p, c = 'a', s = 0) => ({ p, c, s });
const yay = (cx, cy, r, a0, a1, n = 14, ry = r) => Array.from({ length: n + 1 }, (_, i) => pt(cx, cy, r, a0 + ((a1 - a0) * i) / n, ry));
const disk = (cx, cy, r, n = 28) => yay(cx, cy, r, 0, 360 - 360 / n, n - 1);
const roles = { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', k: 'vurgu' };
const models = [];
const add = (id, name, tags, size, palette, facets) => models.push({ id, name, tags, size, palette, roles, facets });

// Başparmak (beğen): sol manşet + el + parmak çizgileri
{
  const el = [[104, 138], [146, 100], [168, 40], [196, 22], [226, 36], [230, 84], [216, 124], [272, 124], [292, 148], [284, 176], [294, 198], [282, 224], [272, 246], [244, 264], [104, 264]];
  const f = [F(el, 'a', 0), F([[24, 130], [96, 130], [96, 272], [24, 272]], 'b', -0.15)];
  for (const y of [172, 212]) f.push(F([[150, y], [262, y], [262, y + 5], [150, y + 5]], 'd', -0.25));
  f.push(F([[176, 52], [196, 40], [206, 52], [190, 96], [174, 100]], 'k', 0.5));
  f.push(F(disk(60, 150, 7, 12), 'c', 0.4));
  add('basparmak-cizim', 'Başparmak / beğen (çizim)', ['beğen', 'başparmak', 'like', 'onay', 'sosyal medya', 'youtube', 'çizim', 'pastel'], [310, 290], { a: '#ffcf5c', b: '#4f8ef7', c: '#ffffff', d: '#e0a22e', k: '#fff2c2' }, f);
}

// Yorum balonu: yuvarlak köşeli balon + kuyruk + üç nokta
{
  const R = 44, x0 = 20, x1 = 300, y0 = 20, y1 = 200;
  const g = [
    ...yay(x1 - R, y0 + R, R, -90, 0, 8), ...yay(x1 - R, y1 - R, R, 0, 90, 8),
    [200, y1], [92, 252], [100, y1],
    ...yay(x0 + R, y1 - R, R, 90, 180, 8), ...yay(x0 + R, y0 + R, R, 180, 270, 8),
  ];
  const f = [F(g, 'a', 0)];
  for (const x of [98, 160, 222]) f.push(F(disk(x, 110, 16, 18), 'd', -0.2));
  f.push(F([[60, 44], [150, 44], [150, 52], [60, 52]], 'k', 0.55));
  add('yorum-balonu-cizim', 'Yorum balonu (çizim)', ['yorum', 'konuşma balonu', 'mesaj', 'sosyal medya', 'youtube', 'sohbet', 'çizim', 'pastel'], [320, 270], { a: '#8fe0c4', c: '#ffffff', d: '#3d3a73', k: '#d6fff1' }, f);
}

// Zil (bildirim): kubbe gövde, kulp, dil
{
  const g = [...yay(130, 126, 84, 180, 360, 18), [214, 226], [246, 248], [246, 266], [14, 266], [14, 248], [46, 226]];
  const f = [F(disk(130, 40, 18, 18), 'b', 0), F(g, 'a', 0), F(disk(130, 282, 22, 18), 'b', -0.1)];
  f.push(F([...yay(130, 126, 62, 200, 250, 8), ...yay(130, 126, 50, 250, 200, 8)], 'k', 0.6));
  f.push(F([[14, 246], [246, 246], [246, 252], [14, 252]], 'd', -0.2));
  add('zil-cizim', 'Bildirim zili (çizim)', ['zil', 'bildirim', 'abone', 'youtube', 'sosyal medya', 'çan', 'çizim', 'pastel'], [260, 310], { a: '#ffd23f', b: '#ff9a3c', d: '#d99a1a', k: '#fff6c9' }, f);
}

const dir = path.join(ROOT, 'data', 'library', 'iletisim');
fs.mkdirSync(dir, { recursive: true });
let n = 0;
for (const m of models) {
  const file = path.join(dir, `${m.id}.json`);
  if (fs.existsSync(file) && !FORCE) { console.log(`atlandı (var): ${m.id}`); continue; }
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n'); n++;
}
console.log(`ok — ${n} model yazıldı`);
