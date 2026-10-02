// "Ay Dersi" videosu için çizim (cizim stili) uyumlu yeni modeller.
//   node scripts/seed-ay-dersi.mjs [--force]   →  data/library/uzay/ay-*-cizim.json vb.
// Evre modelleri kuzey yarımküre görünümünde "büyüyen" (sağı aydınlık) çizilir; küçülen evre için sahnede scaleX: -1 kullan.
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
/** a0→a1 yayı boyunca kalınlıklı şerit (rüzgâr çizgisi) */
const serit = (cx, cy, r, a0, a1, kal, n = 18) => [...yay(cx, cy, r + kal / 2, a0, a1, n), ...yay(cx, cy, r - kal / 2, a1, a0, n)];

const models = [];
const add = (kat, id, name, tags, size, palette, facets, extra = {}) =>
  models.push({ kat, doc: { id, name, tags, size, palette, roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', k: 'vurgu' }, ...extra, facets } });

const AY = { a: '#efe8d2', b: '#cdc3a6', c: '#fffaf0', d: '#5b5f9a', k: '#ffffff' };

/** Ay yüzeyi kraterleri: [x, y, r] */
const KRATER = [[108, 112, 26], [186, 92, 18], [196, 176, 32], [118, 196, 16], [150, 150, 11], [226, 130, 10]];
const krater = (x, y, r) => [F(disk(x, y, r, 22, r * 0.86), 'b', -0.2), F(disk(x + r * 0.12, y + r * 0.14, r * 0.62, 18, r * 0.52), 'c', 0.25)];

// ─── Ay (çizim): dolunay, kraterli ──────────────────────────────────────────
{
  const f = [F(disk(150, 150, 124, 64), 'a', 0)];
  for (const [x, y, r] of KRATER) f.push(...krater(x, y, r));
  f.push(F([...yay(150, 150, 104, 200, 262, 12), ...yay(150, 150, 90, 262, 200, 12)], 'k', 0.6));
  add('uzay', 'ay-cizim', 'Ay (çizim)', ['ay', 'dolunay', 'uydu', 'krater', 'gece', 'çizim', 'pastel', 'uzay'], [300, 300], AY, f);
}

// ─── Ay evreleri (çizim): koyu disk + aydınlık bölge ───────────────────────
const evre = (id, ad, p, etiket) => {
  const R = 124, cx = 150, cy = 150;
  const f = [F(disk(cx, cy, R, 64), 'd', 0)];
  if (p > 0) {
    const kk = 1 - 2 * p; // terminatör x yarıçapı oranı (+: hilal, −: şişkin)
    const dis = yay(cx, cy, R, -90, 90, 32);
    const ic = Array.from({ length: 33 }, (_, i) => {
      const th = 90 - (180 * i) / 32;
      return [r1(cx + R * kk * Math.cos(rad(th))), r1(cy + R * Math.sin(rad(th)))];
    });
    f.push(F([...dis, ...ic], 'a', 0.1));
    if (p >= 0.45) for (const [x, y, r] of [[196, 176, 28], [186, 92, 16], [212, 130, 9]]) f.push(...krater(x, y, r).slice(0, 1));
  }
  add('uzay', id, ad, ['ay', 'evre', 'ay evreleri', etiket, 'gece', 'çizim', 'pastel', 'uzay'], [300, 300], AY, f);
};
evre('ay-evre-yeni-cizim', 'Yeni Ay (çizim)', 0, 'yeni ay');
evre('ay-evre-hilal-cizim', 'Hilal (çizim)', 0.16, 'hilal');
evre('ay-evre-dordun-cizim', 'İlk Dördün (çizim)', 0.5, 'dördün');
evre('ay-evre-sisk-cizim', 'Şişkin Ay (çizim)', 0.84, 'şişkin ay');

// ─── Meteor (çizim): kayaç sağ altta, alev kuyruğu sol üstte (sağa-aşağı uçar) ─
{
  const f = [];
  f.push(F([[196, 96], [118, 36], [34, 6], [96, 52], [8, 52], [92, 84], [20, 110], [112, 110], [176, 156]], 'b', -0.1)); // dış alev
  f.push(F([[188, 104], [120, 58], [60, 34], [104, 78], [64, 88], [122, 106], [176, 136]], 'k', 0.35)); // iç alev
  // pürüzlü kaya: 11 köşe, merkez (232,128)
  const kaya = [[-58, -4], [-44, -40], [-10, -58], [30, -50], [58, -26], [62, 14], [44, 46], [8, 60], [-30, 52], [-54, 30]].map(([x, y]) => [232 + x, 130 + y]);
  f.push(F(kaya, 'a', 0.1));
  f.push(F([[188, 90], [222, 72], [262, 82], [272, 104], [238, 110], [200, 116]], 'c', 0.35)); // aydınlık yüz
  f.push(F(disk(250, 146, 12, 16), 'd', -0.2));
  f.push(F(disk(212, 150, 8, 14), 'd', -0.2));
  f.push(F(disk(268, 118, 6, 12), 'd', -0.2));
  add('uzay', 'meteor-cizim', 'Meteor (çizim)', ['meteor', 'göktaşı', 'çarpma', 'kaya', 'alev', 'uzay', 'çizim', 'pastel'], [320, 200], { a: '#9c7a62', b: '#ff7a2e', c: '#cfae92', d: '#5e4636', k: '#ffd84a' }, f);
}

// ─── Krater (çizim): yukarıdan bakış, yüksek kenarlı çukur ──────────────────
{
  const f = [];
  f.push(F(disk(150, 100, 140, 56, 82), 'a', 0.1)); // dış kenar
  f.push(F(disk(150, 108, 108, 48, 56), 'd', -0.2)); // çukur
  f.push(F(disk(160, 118, 66, 36, 30), 'b', -0.1)); // çukur derin gölge
  f.push(F([...yay(150, 100, 126, 200, 290, 14).map(([x, y]) => [x, r1(100 + (y - 100) * 0.585)]), ...yay(150, 100, 112, 290, 200, 14).map(([x, y]) => [x, r1(100 + (y - 100) * 0.585)])], 'k', 0.6));
  add('uzay', 'krater-cizim', 'Krater (çizim)', ['krater', 'çukur', 'ay yüzeyi', 'meteor çarpması', 'uzay', 'çizim', 'pastel'], [300, 200], { a: '#e6dcc2', b: '#8a8d6f', d: '#6d6a86', k: '#ffffff' }, f);
}

// ─── Ay yüzeyi (çizim): ufuk, dağlar, kraterler, kayalar ────────────────────
{
  const f = [];
  f.push(F([[0, 150], [70, 70], [120, 118], [190, 40], [262, 120], [330, 80], [400, 130], [480, 62], [560, 124], [600, 100], [600, 190], [0, 190]], 'c', 0)); // arka dağlar
  f.push(F([[0, 168], [90, 150], [200, 164], [330, 146], [470, 162], [600, 148], [600, 260], [0, 260]], 'a', 0.08)); // zemin
  for (const [x, y, w, h] of [[140, 212, 120, 34], [380, 200, 160, 40], [520, 236, 70, 20], [40, 236, 66, 18]]) {
    f.push(F(disk(x, y, w / 2, 32, h / 2), 'b', -0.2));
    f.push(F(disk(x + 6, y + 4, w * 0.34, 26, h * 0.3), 'd', 0.1));
  }
  f.push(F([[250, 176], [270, 160], [296, 166], [304, 188], [276, 196]], 'd', 0.1)); // kaya
  f.push(F([[456, 224], [470, 212], [488, 218], [490, 232], [468, 238]], 'd', 0.1));
  add('uzay', 'ay-yuzeyi-cizim', 'Ay yüzeyi (çizim)', ['ay yüzeyi', 'kayalık', 'vadi', 'dağ', 'krater', 'uzay', 'çizim', 'pastel'], [600, 260], { a: '#e3dac0', b: '#c5bb9c', c: '#b3b0d4', d: '#8b8878' }, f);
}

// ─── Rüzgâr (çizim): sonu kıvrımlı üç esinti çizgisi + savrulan yapraklar ────
/** merkez çizgisi boyunca incelen şerit */
const kurdele = (pts, w0, w1) => {
  const sol = [], sag = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    sol.push([r1(p[0] - (dy / l) * w), r1(p[1] + (dx / l) * w)]);
    sag.push([r1(p[0] + (dy / l) * w), r1(p[1] - (dx / l) * w)]);
  });
  return [...sol, ...sag.reverse()];
};
/** düz-dalgalı gövde + sona doğru yukarı kıvrılan sarmal */
const esinti = (x0, y0, uzun, dalga, kivrim, yon = 1) => {
  const p = [];
  const N = 22;
  for (let i = 0; i <= N; i++) { const t = i / N; p.push([x0 + yon * uzun * t, y0 + Math.sin(t * Math.PI * 2) * dalga]); }
  const [ex, ey] = p[p.length - 1];
  const cx = ex, cy = ey - kivrim;
  for (let i = 1; i <= 20; i++) {
    const ang = rad(90 - i * 17), r = kivrim * (1 - i / 22);
    p.push([r1(cx + yon * r * Math.cos(ang)), r1(cy + r * Math.sin(ang))]);
  }
  return p;
};
{
  const f = [];
  f.push(F(kurdele(esinti(20, 78, 170, 10, 34), 4, 14), 'a', 0.1));
  f.push(F(kurdele(esinti(40, 138, 200, 12, 40), 4, 14), 'b', 0.05));
  f.push(F(kurdele(esinti(14, 198, 150, 9, 28), 4, 12), 'a', 0.1));
  // yapraklar
  f.push(F([[236, 54], [262, 40], [280, 62], [258, 74]], 'c', 0.2));
  f.push(F([[250, 168], [274, 158], [290, 178], [268, 188]], 'c', 0.2));
  add('uzay', 'ruzgar-cizim', 'Rüzgâr (çizim)', ['rüzgar', 'esinti', 'hava olayı', 'atmosfer', 'yaprak', 'çizim', 'pastel'], [300, 240], { a: '#6fb1e3', b: '#a9d6f5', c: '#6cc28a' }, f);
}

// ─── Bulut (çizim): kabarık siluet + gölge + yağmur damlaları ──────────────
{
  const daireler = [[84, 126, 44], [140, 92, 56], [206, 106, 50], [256, 138, 38], [58, 150, 30]];
  const taban = 168;
  const ic = (x, y, atla) => daireler.some(([cx, cy, r], i) => i !== atla && Math.hypot(x - cx, y - cy) < r - 0.5);
  let nokta = [];
  daireler.forEach(([cx, cy, r], i) => {
    for (let d = 0; d < 360; d += 4) {
      const [x, y] = pt(cx, cy, r, d);
      if (y <= taban && !ic(x, y, i)) nokta.push([x, y]);
    }
  });
  for (let x = 40; x <= 290; x += 10) nokta.push([x, taban]);
  const mx = 170, my = 120;
  nokta = nokta.filter(([x, y]) => x > 28 && x < 296).sort((p, q) => Math.atan2(p[1] - my, p[0] - mx) - Math.atan2(q[1] - my, q[0] - mx));
  const f = [F(nokta.map(([x, y]) => [r1(x), r1(y)]), 'a', 0.05)];
  f.push(F([[60, 150], [120, 138], [190, 146], [262, 140], [276, 158], [250, 168], [60, 168]], 'b', -0.15)); // karın gölgesi
  f.push(F(yay(140, 92, 42, 200, 262, 10).concat(yay(140, 92, 32, 262, 200, 10)), 'k', 0.6)); // parlak yay
  for (const [x, y] of [[96, 190], [160, 200], [222, 188]]) f.push(F([[x, y - 14], [x + 9, y + 6], [x, y + 12], [x - 9, y + 6]], 'c', 0.2)); // damlalar
  add('gokyuzu', 'bulut-cizim', 'Bulut (çizim)', ['bulut', 'yağmur', 'hava olayı', 'gökyüzü', 'damla', 'çizim', 'pastel'], [330, 220], { a: '#f4f8ff', b: '#dde7f7', c: '#6fb1e3', k: '#ffffff' }, f);
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
