// "Dünya'mız ve Gökyüzündeki Komşularımız" dersi için çizim (cizim stili) uyumlu yeni modeller.
//   node scripts/seed-dunya-komsular.mjs [--force]   →  data/library/nesneler/saat-cizim.json, takvim-cizim.json
// saat-cizim: ibre parçası (pivot merkez) sahnede `parts: { ibre: { rotation: [...] } }` ile döner (1 gün = 24 saat).
// takvim-cizim: spiral ciltli yaprak; "365" sahnede metin katmanıyla yazılır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const F = (p, c = 'a', s = 0, part) => ({ p, c, s, ...(part ? { part } : {}) });
const disk = (cx, cy, r, n = 48) => Array.from({ length: n }, (_, i) => [r1(cx + r * Math.cos(rad((360 * i) / n))), r1(cy + r * Math.sin(rad((360 * i) / n)))]);
const kare = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** merkezden dışa doğru (derece: 0 = yukarı) ince şerit */
const sap = (cx, cy, derece, r0, r1_, kal) => {
  const a = rad(derece - 90);
  const dx = Math.cos(a), dy = Math.sin(a);
  const nx = -dy * (kal / 2), ny = dx * (kal / 2);
  const [x0, y0, x1, y1] = [cx + dx * r0, cy + dy * r0, cx + dx * r1_, cy + dy * r1_];
  return [[r1(x0 + nx), r1(y0 + ny)], [r1(x1 + nx), r1(y1 + ny)], [r1(x1 - nx), r1(y1 - ny)], [r1(x0 - nx), r1(y0 - ny)]];
};

const models = [];
const add = (kat, id, name, tags, size, palette, facets, extra = {}) =>
  models.push({ kat, doc: { id, name, tags, size, palette, roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', k: 'vurgu' }, ...extra, facets } });

// ─── Saat (çizim): yuvarlak kadran, 12 çizgi, dönen ibre ───────────────────
{
  const f = [F(disk(150, 150, 128, 64), 'd', -0.1), F(disk(150, 150, 114, 64), 'a', 0.1)];
  for (let i = 0; i < 12; i++) f.push(F(sap(150, 150, i * 30, i % 3 === 0 ? 86 : 96, 106, i % 3 === 0 ? 9 : 5), 'd', 0));
  f.push(F(sap(150, 150, 300, 0, 58, 11), 'd', 0)); // akrep (sabit)
  f.push(F(sap(150, 150, 0, -14, 92, 8), 'b', 0.2, 'ibre')); // yelkovan / ibre (döner)
  f.push(F(disk(150, 150, 12, 20), 'b', 0.3));
  f.push(F([...Array.from({ length: 13 }, (_, i) => [r1(150 + 100 * Math.cos(rad(200 + (i * 62) / 12))), r1(150 + 100 * Math.sin(rad(200 + (i * 62) / 12)))]), ...Array.from({ length: 13 }, (_, i) => [r1(150 + 88 * Math.cos(rad(262 - (i * 62) / 12))), r1(150 + 88 * Math.sin(rad(262 - (i * 62) / 12)))])], 'c', 0.6)); // parlak yay
  add('nesneler', 'saat-cizim', 'Saat (çizim)', ['saat', 'zaman', 'gün', '24 saat', 'ibre', 'süre', 'çizim', 'pastel'], [300, 300], { a: '#fffaf0', b: '#ff7f6e', c: '#ffffff', d: '#3d3a73' }, f, { parts: { ibre: { pivot: [150, 150] } } });
}

// ─── Takvim (çizim): spiral ciltli yaprak ──────────────────────────────────
{
  const f = [F(kare(30, 50, 240, 210), 'd', -0.15), F(kare(40, 60, 220, 190), 'a', 0.1), F(kare(40, 60, 220, 56), 'b', 0.1)];
  for (const x of [80, 130, 180, 220]) f.push(F(kare(x - 7, 36, 14, 40), 'd', 0.2), F(disk(x, 44, 6, 14), 'c', 0.3));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) f.push(F(kare(62 + c * 38, 138 + r * 36, 24, 20), r === 1 && c === 2 ? 'b' : 'c', 0.1));
  add('nesneler', 'takvim-cizim', 'Takvim (çizim)', ['takvim', 'gün', 'tarih', 'yıl', '365 gün', 'zaman', 'çizim', 'pastel'], [300, 300], { a: '#fffaf0', b: '#ff7f6e', c: '#e9e2f7', d: '#3d3a73' }, f);
}

const ONLY = (process.argv.find((x) => x.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
let yazilan = 0;
for (const { kat, doc } of models) {
  if (ONLY.length && !ONLY.includes(doc.id)) continue;
  const dir = path.join(ROOT, 'data', 'library', kat);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${doc.id}.json`);
  if (fs.existsSync(file) && !FORCE && !ONLY.length) { console.log(`atlandı (var): ${kat}/${doc.id}`); continue; }
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  yazilan++;
}
console.log(`ok — ${yazilan} model yazıldı`);
