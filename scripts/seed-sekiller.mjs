// Düz geometrik şekil takımı (reels şablonları için): daire, kare, üçgen, halka, patlama, yıldırım, elmas, tik, ok, leke.
//   node scripts/seed-sekiller.mjs [--force]   → data/library/sekiller/*.json
// Her şekil tek renkli (palet "a"); katmanda `palette: { a: '$vurgu' }`, `scaleX/scaleY` ile esnetilir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'library', 'sekiller');
const FORCE = process.argv.includes('--force');
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (cx, cy, r, deg) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))];
const F = (p, c = 'a', s = 0) => ({ p, c, s });

const shapes = [];
const add = (id, name, tags, size, facets, palette = { a: '#ff5d8f' }, extra = {}) =>
  shapes.push({ id, name, tags, size, palette, roles: { a: 'ana', b: 'vurgu' }, ...extra, facets });

// Not: her şekil TEK çokgendir (iç dikiş çizgisi görünmesin). Halka = "anahtar deliği" çokgeni.
const yay = (cx, cy, r, n, a0 = -90, a1 = 270) => Array.from({ length: n }, (_, i) => pt(cx, cy, r, a0 + ((a1 - a0) * i) / n));

add('daire', 'Daire', ['şekil', 'geometri', 'düz'], [200, 200], [F(yay(100, 100, 100, 48))]);
add('kare', 'Kare', ['şekil', 'geometri', 'düz'], [200, 200], [F([[0, 0], [200, 0], [200, 200], [0, 200]])]);
add('ucgen', 'Üçgen', ['şekil', 'geometri', 'düz'], [200, 180], [F([[100, 0], [200, 180], [0, 180]])]);
add('elmas', 'Elmas', ['şekil', 'geometri', 'düz'], [200, 200], [F([[100, 0], [200, 100], [100, 200], [0, 100]])]);
{
  // halka: dış daire saat yönünde, köprüyle iç daire ters yönde
  const dis = yay(100, 100, 100, 64, 0, 360);
  const ic = yay(100, 100, 84, 64, 0, 360).reverse();
  add('halka', 'Halka', ['şekil', 'geometri', 'çember'], [200, 200], [F([...dis, dis[0], ic[ic.length - 1], ...ic])]);
}
{
  // patlama: 14 sivri uçlu yıldız damga
  const n = 14;
  const nokta = [];
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n - 90;
    nokta.push(pt(100, 100, 100, a), pt(100, 100, 76, a + 180 / n));
  }
  add('patlama', 'Patlama', ['şekil', 'vurgu', 'damga'], [200, 200], [F(nokta)]);
}
add('yildirim', 'Yıldırım', ['şekil', 'enerji', 'hız'], [160, 200], [F([[80, 0], [150, 0], [110, 75], [152, 75], [40, 200], [70, 112], [28, 112]])], { a: '#ffd23f' });
add('tik', 'Tik', ['şekil', 'onay', 'simge'], [200, 160], [F([[0, 92], [38, 56], [78, 98], [162, 6], [200, 42], [78, 160]])], { a: '#06d6a0' });
add('ok-yukari', 'Ok (yukarı)', ['şekil', 'ok', 'yönlendirme'], [200, 170], [
  F([[100, 0], [200, 90], [160, 120], [100, 56], [40, 120], [0, 90]]),
  F([[100, 56], [200, 146], [160, 176], [100, 112], [40, 176], [0, 146]]),
]);
{
  const nokta = [];
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n;
    const r = 86 + 11 * Math.sin((a * Math.PI) / 180 * 3 + 0.6) + 5 * Math.sin((a * Math.PI) / 180 * 5 + 1.9);
    nokta.push(pt(100, 100, r, a));
  }
  add('leke', 'Leke (blob)', ['şekil', 'organik', 'dekor'], [200, 200], [F(nokta)]);
}
add('yarim-daire', 'Yarım daire', ['şekil', 'geometri', 'kemer'], [200, 100], [F([...yay(100, 100, 100, 30, 180, 360), pt(100, 100, 100, 360)])]);

fs.mkdirSync(DIR, { recursive: true });
let yazildi = 0;
for (const s of shapes) {
  const file = path.join(DIR, `${s.id}.json`);
  if (fs.existsSync(file) && !FORCE) continue;
  fs.writeFileSync(file, JSON.stringify(s, null, 2) + '\n');
  yazildi++;
}
console.log(`ok — ${yazildi}/${shapes.length} şekil yazıldı (${path.relative(ROOT, DIR)})`);
