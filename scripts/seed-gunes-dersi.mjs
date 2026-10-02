// "Güneş Dersi" videosu için çizim (cizim stili) uyumlu yeni modeller.
//   node scripts/seed-gunes-dersi.mjs [--force]   →  data/library/uzay/*-cizim.json, data/library/nesneler/*-cizim.json
// Her model: sade, kalın hatlı, az renk bölgeli (kontur + pastel boya taramasında temiz okunur).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, deg) => [r1(cx + r * Math.cos(rad(deg))), r1(cy + r * Math.sin(rad(deg)))];
const F = (p, c = 'a', s = 0, part) => ({ p, c, s, ...(part ? { part } : {}) });
const disk = (cx, cy, r, n = 48, ry = r) => Array.from({ length: n }, (_, i) => [r1(cx + r * Math.cos(rad((360 * i) / n))), r1(cy + ry * Math.sin(rad((360 * i) / n)))]);
const yay = (cx, cy, r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => pt(cx, cy, r, a0 + ((a1 - a0) * i) / n));
/** (x,y) merkezli, w×h, açılı dikdörtgen */
const dik = (cx, cy, w, h, deg = 0) => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [r1(cx + x * c - y * s), r1(cy + x * s + y * c)]);
};
/** yuvarlak köşeli dikdörtgen */
const yuvarlak = (x, y, w, h, r, n = 5) => {
  const p = [];
  const k = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
  for (const [cx, cy, a0] of k) for (let i = 0; i <= n; i++) p.push(pt(cx, cy, r, a0 + (90 * i) / n));
  return p;
};

const models = [];
const add = (kat, id, name, tags, size, palette, facets, extra = {}) =>
  models.push({ kat, doc: { id, name, tags, size, palette, roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', k: 'vurgu' }, ...extra, facets } });

// ─── Güneş (çizim): ışınlar + disk + parlama ───────────────────────────────
{
  const f = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (360 * i) / N - 90;
    const uzun = i % 2 === 0;
    f.push(F([pt(200, 200, 118, a - 11), pt(200, 200, uzun ? 196 : 166, a), pt(200, 200, 118, a + 11)], 'b', uzun ? 0.1 : -0.1, 'isin'));
  }
  f.push(F(disk(200, 200, 124, 56), 'a', 0));
  f.push(F([...yay(200, 200, 100, 195, 262, 14), ...yay(200, 200, 84, 262, 195, 14)], 'k', 0.6));
  add('uzay', 'gunes-cizim', 'Güneş (çizim)', ['güneş', 'yıldız', 'ışın', 'sıcak', 'ışık', 'çizim', 'pastel', 'uzay'], [400, 400], { a: '#ffc72e', b: '#ff9440', k: '#fff3b8' }, f, { parts: { isin: { pivot: [200, 200] } } });
}

// ─── Güneş kesiti (çizim): iç içe katmanlar + ışınlı dış kenar ──────────────
{
  const f = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const a = (360 * i) / N - 90;
    f.push(F([pt(220, 220, 188, a - 6), pt(220, 220, i % 2 ? 208 : 216, a), pt(220, 220, 188, a + 6)], 'd', 0, 'isin'));
  }
  f.push(F(disk(220, 220, 194, 64), 'a', 0)); // yüzey
  f.push(F(disk(220, 220, 140, 56), 'b', 0)); // orta katmanlar
  f.push(F(disk(220, 220, 80, 44), 'c', 0)); // çekirdek
  f.push(F([...yay(220, 220, 66, 200, 262, 10), ...yay(220, 220, 50, 262, 200, 10)], 'k', 0.6));
  add('uzay', 'gunes-kesit-cizim', 'Güneş kesiti (çizim)', ['güneş', 'kesit', 'katman', 'iç yapı', 'çekirdek', 'çizim', 'pastel', 'uzay'], [440, 440], { a: '#ffd04d', b: '#ff9c4a', c: '#ff6a5c', d: '#ffb53d', k: '#fff6d5' }, f, { parts: { isin: { pivot: [220, 220] } } });
}

// ─── Teleskop (çizim): üç ayaklı, 30° yukarı bakan tüp ──────────────────────
{
  const f = [];
  f.push(F([[150, 168], [162, 168], [112, 292], [96, 292]], 'c', -0.1)); // sol bacak
  f.push(F([[170, 168], [182, 168], [236, 292], [220, 292]], 'c', -0.1)); // sağ bacak
  f.push(F([[160, 168], [172, 168], [172, 292], [160, 292]], 'c', 0.15)); // orta bacak (öne)
  f.push(F(disk(166, 168, 17, 20), 'b', 0.1)); // bağlantı topu
  const ang = -32;
  const cx = 178, cy = 130;
  f.push(F(dik(cx - 2, cy + 4, 214, 52, ang), 'd', -0.15)); // tüp gölge katmanı (alt)
  f.push(F(dik(cx, cy, 214, 50, ang), 'a', 0.1)); // tüp
  const u = (t, dy = 0) => { const c = Math.cos(rad(ang)), s = Math.sin(rad(ang)); return [r1(cx + t * c - dy * s), r1(cy + t * s + dy * c)]; };
  f.push(F([u(-104, -25), u(-72, -25), u(-72, 25), u(-104, 25)], 'b', 0)); // göz tarafı halka
  f.push(F([u(30, -25), u(48, -25), u(48, 25), u(30, 25)], 'b', 0)); // orta halka
  f.push(F([u(96, -31), u(116, -34), u(116, 34), u(96, 31)], 'b', 0.1)); // ön genişleme
  f.push(F([u(114, -26), u(120, -26), u(120, 26), u(114, 26)], 'k', 0.5)); // lens parıltısı
  f.push(F(dik(...u(-112, 0), 22, 22, ang), 'd', 0)); // göz merceği
  add('uzay', 'teleskop-cizim', 'Teleskop (çizim)', ['teleskop', 'galileo', 'gözlem', 'gökyüzü', 'bilim', 'mercek', 'çizim', 'pastel', 'uzay'], [360, 300], { a: '#a9b8ff', b: '#ffd36b', c: '#c99a76', d: '#5b5f9a', k: '#ffffff' }, f);
}

// ─── Dürbün (çizim) ────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F(dik(150, 150, 70, 26), 'd', 0)); // köprü
  for (const x of [88, 212]) {
    f.push(F(yuvarlak(x - 38, 56, 76, 170, 22), 'a', 0.1)); // gövde
    f.push(F(yuvarlak(x - 46, 16, 92, 58, 18), 'b', -0.05)); // ön lens kovanı (üst)
    f.push(F(disk(x, 45, 28, 24), 'k', 0.4)); // lens
    f.push(F(yuvarlak(x - 30, 214, 60, 34, 12), 'd', 0)); // göz kapağı
  }
  add('uzay', 'durbun-cizim', 'Dürbün (çizim)', ['dürbün', 'gözlem', 'mercek', 'çizim', 'pastel'], [300, 260], { a: '#9be0c8', b: '#ffd36b', d: '#5b5f9a', k: '#ffffff' }, f);
}

// ─── Fotoğraf makinesi / kamera (çizim) ────────────────────────────────────
{
  const f = [];
  f.push(F(yuvarlak(110, 28, 80, 40, 10), 'd', 0)); // vizör çıkıntısı
  f.push(F(yuvarlak(20, 56, 260, 160, 26), 'a', 0.05)); // gövde
  f.push(F(dik(150, 94, 258, 26), 'd', -0.05)); // üst şerit
  f.push(F(yuvarlak(36, 64, 44, 28, 8), 'c', 0.3)); // flaş
  f.push(F(disk(150, 142, 56, 40), 'd', 0)); // lens dış halka
  f.push(F(disk(150, 142, 40, 36), 'b', 0.1)); // lens
  f.push(F(disk(150, 142, 22, 28), 'd', 0));
  f.push(F(disk(140, 134, 8, 14), 'k', 0.6)); // parıltı
  f.push(F(disk(250, 80, 9, 14), 'c', 0.2)); // deklanşör
  add('nesneler', 'kamera-cizim', 'Fotoğraf makinesi (çizim)', ['kamera', 'fotoğraf', 'çekim', 'çizim', 'pastel'], [300, 240], { a: '#ffb7c9', b: '#ffd36b', c: '#fff3b8', d: '#5b5f9a', k: '#ffffff' }, f);
}

// ─── Mercek / büyüteç (çizim) ──────────────────────────────────────────────
{
  const f = [];
  f.push(F(dik(160, 232, 30, 120, -45), 'c', 0)); // sap
  f.push(F(disk(112, 112, 90, 48), 'b', 0)); // çerçeve
  f.push(F(disk(112, 112, 70, 44), 'k', 0.3)); // cam
  f.push(F([...yay(112, 112, 56, 200, 270, 10), ...yay(112, 112, 46, 270, 200, 10)], 'a', 0.6)); // parlama
  add('nesneler', 'mercek-cizim', 'Mercek / büyüteç (çizim)', ['mercek', 'büyüteç', 'cam', 'ışık', 'çizim', 'pastel'], [240, 290], { a: '#ffffff', b: '#ffd36b', c: '#c99a76', k: '#cfeeff' }, f);
}

// ─── Güneş filtreli gözlük (tutulma gözlüğü, çizim) ────────────────────────
{
  const f = [];
  f.push(F(yuvarlak(10, 20, 300, 110, 22), 'a', 0.1)); // karton çerçeve
  f.push(F([[140, 120], [160, 86], [180, 120]], 'k', 0.1)); // burun girintisi (zeminle)
  f.push(F(yuvarlak(28, 38, 118, 66, 24), 'd', -0.1)); // sol cam
  f.push(F(yuvarlak(174, 38, 118, 66, 24), 'd', -0.1)); // sağ cam
  f.push(F([[42, 50], [64, 50], [46, 76], [42, 76]], 'k', 0.7)); // sol parıltı
  f.push(F([[188, 50], [210, 50], [192, 76], [188, 76]], 'k', 0.7)); // sağ parıltı
  f.push(F(dik(160, 118, 296, 10), 'b', 0)); // alt şerit
  add('uzay', 'filtre-gozluk-cizim', 'Güneş filtreli gözlük (çizim)', ['güneş gözlüğü', 'filtre', 'güvenlik', 'koruma', 'gözlem gözlüğü', 'tutulma', 'çizim', 'pastel', 'uzay'], [320, 150], { a: '#ffd9b3', b: '#ff9b7a', d: '#46466e', k: '#e3e6ff' }, f);
}

// ─── Termometre (çizim): "civa" parçasıyla seviye animasyonu ────────────────
{
  const f = [];
  f.push(F(yuvarlak(60, 10, 40, 230, 20), 'a', 0.1)); // tüp
  f.push(F(disk(80, 250, 36, 36), 'a', 0.1)); // hazne
  f.push(F(disk(80, 250, 24, 28), 'b', 0)); // civa hazne
  f.push(F(dik(80, 140, 14, 220), 'b', 0, 'civa')); // civa sütunu (alttan büyür)
  for (const y of [40, 80, 120, 160]) f.push(F(dik(108, y, 14, 4), 'd', 0));
  add('nesneler', 'termometre-cizim', 'Termometre (çizim)', ['termometre', 'sıcaklık', 'sıcak', 'soğuk', 'derece', 'çizim', 'pastel'], [160, 300], { a: '#fff8ef', b: '#ff6b6b', d: '#5b5f9a' }, f, { parts: { civa: { pivot: [80, 250] } } });
}

// ─── Dönüş oku (saat yönünün tersi) ────────────────────────────────────────
{
  // 40°→310° (saat yönünün tersine açılan yay), uçta ok başı
  const dis = yay(150, 150, 120, 60, 330, 30);
  const ic = yay(150, 150, 98, 330, 60, 30);
  const bas = pt(150, 150, 109, 60);
  const sol = pt(150, 150, 140, 60), sag = pt(150, 150, 78, 60);
  const ucPt = pt(150, 150, 109, 20);
  const f = [F([...dis, ...ic], 'a', 0), F([sol, sag, ucPt], 'a', 0.1)];
  void bas;
  add('uzay', 'donus-oku-cizim', 'Dönüş oku (çizim)', ['ok', 'dönüş', 'döngü', 'saat yönünün tersi', 'çizim', 'pastel'], [300, 300], { a: '#ff7f6e' }, f);
}

// ─── Dünya (çizim): okyanus + kıta lekeleri ────────────────────────────────
{
  const blob = (cx, cy, r, tohum, n = 14) => Array.from({ length: n }, (_, i) => pt(cx, cy, r * (0.78 + 0.22 * Math.sin(i * 2.3 + tohum) + 0.12 * Math.cos(i * 1.1 + tohum * 2)), (360 * i) / n));
  const f = [];
  f.push(F(disk(150, 150, 118, 56), 'a', 0));
  f.push(F(blob(112, 110, 44, 1.2), 'b', 0.05));
  f.push(F(blob(176, 174, 40, 3.4), 'b', -0.05));
  f.push(F(blob(196, 100, 20, 5.1, 10), 'b', 0));
  f.push(F(blob(150, 40, 20, 0.4, 10).map(([x, y]) => [x, Math.max(y, 36)]), 'c', 0.4));
  f.push(F([...yay(150, 150, 98, 200, 262, 12), ...yay(150, 150, 84, 262, 200, 12)], 'k', 0.6));
  add('uzay', 'dunya-cizim', 'Dünya (çizim)', ['dünya', 'gezegen', 'mavi', 'okyanus', 'kıta', 'çizim', 'pastel', 'uzay'], [300, 300], { a: '#4aa3ff', b: '#5fcf80', c: '#ffffff', k: '#e6f4ff' }, f);
}

// ─── Göz (çizim): badem biçimli göz + iris ─────────────────────────────────
{
  const ust = Array.from({ length: 17 }, (_, i) => { const x = 10 + (280 * i) / 16; return [x, r1(100 - 78 * Math.sin((Math.PI * i) / 16))]; });
  const alt = Array.from({ length: 17 }, (_, i) => { const x = 290 - (280 * i) / 16; return [x, r1(100 + 62 * Math.sin((Math.PI * i) / 16))]; });
  const f = [F([...ust, ...alt.slice(1, -1)], 'a', 0), F(disk(150, 104, 52, 36), 'b', 0), F(disk(150, 104, 26, 28), 'd', 0), F(disk(135, 90, 11, 14), 'k', 0.7)];
  add('nesneler', 'goz-cizim', 'Göz (çizim)', ['göz', 'bakmak', 'görme', 'sağlık', 'çizim', 'pastel'], [300, 200], { a: '#ffffff', b: '#7fc8ff', d: '#2b2f5e', k: '#ffffff' }, f);
}

// ─── İnce yörünge halkası (çizim) ───────────────────────────────────────────
{
  const dis = yay(100, 100, 100, 0, 360, 72);
  const ic = yay(100, 100, 94, 360, 0, 72);
  add('uzay', 'yorunge-halka-cizim', 'Yörünge halkası (çizim)', ['yörünge', 'halka', 'çember', 'güneş sistemi', 'çizim', 'pastel'], [200, 200], { a: '#c9b8f5' }, [F([...dis, dis[0], ic[0], ...ic], 'a', 0)]);
}

// ─── Washi bant ────────────────────────────────────────────────────────────
add('nesneler', 'bant-cizim', 'Washi bant (çizim)', ['bant', 'yapıştır', 'dekor', 'çizim', 'pastel'], [160, 54],
  { a: '#ffd1dc', b: '#fff' },
  [F([[0, 6], [10, 0], [18, 8], [26, 0], [34, 8], [42, 0], [50, 8], [58, 0], [66, 8], [74, 0], [82, 8], [90, 0], [98, 8], [106, 0], [114, 8], [122, 0], [130, 8], [138, 0], [146, 8], [154, 0], [160, 6], [160, 48], [152, 54], [144, 46], [136, 54], [128, 46], [120, 54], [112, 46], [104, 54], [96, 46], [88, 54], [80, 46], [72, 54], [64, 46], [56, 54], [48, 46], [40, 54], [32, 46], [24, 54], [16, 46], [8, 54], [0, 48]], 'a', 0)]);

let yazilan = 0;
for (const { kat, doc } of models) {
  const dir = path.join(ROOT, 'data', 'library', kat);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${doc.id}.json`);
  if (fs.existsSync(file) && !FORCE) { console.log(`atlandı (var): ${kat}/${doc.id}`); continue; }
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  yazilan++;
}
console.log(`ok — ${yazilan} model yazıldı`);
