// fastPano tanıtımı için pastel varlıklar: televizyon, qr-kod, wifi, yukle-bulut
//   node scripts/seed-fastpano.mjs   →  data/library/iletisim/*.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'library', 'iletisim');
const r1 = (v) => Math.round(v * 10) / 10;

const facets = [];
const tri = (p, c, s, part) => facets.push({ p: p.map(([x, y]) => [r1(x), r1(y)]), c, s, ...(part ? { part } : {}) });
/** dörtgen = iki üçgen, zıt gölge */
const rect = (x, y, w, h, c, s = 0.1, part) => {
  tri([[x, y], [x + w, y], [x + w, y + h]], c, s, part);
  tri([[x, y], [x + w, y + h], [x, y + h]], c, -s, part);
};
const quad = (a, b, c2, d, col, s = 0.1) => { tri([a, b, c2], col, s); tri([a, c2, d], col, -s); };
const save = (id, name, tags, size, palette, roles, variants = {}) => {
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ id, name, tags, size, palette, roles, variants, facets: facets.splice(0) }, null, 2) + '\n');
  console.log('yazıldı', id);
};

// ── Televizyon (360×260): gövde, ekran, ayak
rect(10, 10, 340, 210, 'govde', 0.12);
rect(24, 24, 312, 182, 'kenar', -0.05);
rect(32, 32, 296, 166, 'ekran', 0.06);
tri([[32, 32], [150, 32], [32, 120]], 'parilti', 0.3); tri([[32, 32], [90, 32], [32, 80]], 'parilti', -0.3);
rect(168, 220, 24, 18, 'ayak', 0.15);
rect(110, 238, 140, 14, 'ayak', -0.12);
rect(166, 212, 28, 6, 'led', 0.2);
save('televizyon', 'Televizyon (pastel)', ['televizyon', 'tv', 'ekran', 'android tv', 'slayt'], [360, 260],
  { govde: '#8f9bff', kenar: '#5a66cf', ekran: '#fff1e6', parilti: '#ffffff', ayak: '#7d88e6', led: '#ff9aa2' },
  { govde: 'ana', kenar: 'golge', ekran: 'ekran', parilti: 'isik', ayak: 'golge', led: 'vurgu' },
  { mint: { name: 'Nane', palette: { govde: '#a8e6cf', kenar: '#6cc4a1', ayak: '#8ed4b8' } } });

// ── QR kod (220×220): 11×11 ızgara, üç köşe göz
{
  const N = 11, cell = 18, off = 11;
  rect(0, 0, 220, 220, 'kart', 0.08);
  const eye = (gx, gy) => {
    rect(off + gx * cell, off + gy * cell, cell * 3, cell * 3, 'koyu', 0.1);
    rect(off + (gx + 0.5) * cell, off + (gy + 0.5) * cell, cell * 2, cell * 2, 'kart', -0.05);
    rect(off + (gx + 1) * cell, off + (gy + 1) * cell, cell, cell, 'koyu', 0.1);
  };
  eye(0, 0); eye(N - 3, 0); eye(0, N - 3);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const inEye = (gx < 4 && gy < 4) || (gx > N - 5 && gy < 4) || (gx < 4 && gy > N - 5);
    if (inEye || rnd() < 0.5) continue;
    rect(off + gx * cell + 1, off + gy * cell + 1, cell - 2, cell - 2, rnd() < 0.25 ? 'vurgu' : 'koyu', 0.08);
  }
  save('qr-kod', 'QR kod (pastel)', ['qr', 'kod', 'tara', 'bağlantı'], [220, 220],
    { kart: '#fffaf3', koyu: '#4a4f94', vurgu: '#ff9aa2' }, { kart: 'ana', koyu: 'golge', vurgu: 'vurgu' });
}

// ── Wi‑Fi (220×170): nokta + üç yay (yay başına 16 dilim, dilim başına tek gölge → zebra yok)
{
  const cx = 110, cy = 150;
  const arc = (r0, r1_, col, sh) => {
    const n = 16, a0 = -138 * Math.PI / 180, a1 = -42 * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (i / n), b = a0 + (a1 - a0) * ((i + 1) / n);
      const P = (r, t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
      quad(P(r0, a), P(r0, b), P(r1_, b), P(r1_, a), col, sh);
    }
  };
  arc(112, 138, 'c', 0.04); arc(76, 100, 'b', 0.04); arc(40, 64, 'a', 0.04);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, b = (i + 1) / 16 * 6.283; tri([[cx, cy - 6], [cx + 18 * Math.cos(a), cy - 6 + 18 * Math.sin(a)], [cx + 18 * Math.cos(b), cy - 6 + 18 * Math.sin(b)]], 'a', i % 2 ? 0.06 : -0.06); }
  save('wifi', 'Wi‑Fi (pastel)', ['wifi', 'kablosuz', 'ağ', 'yerel ağ', 'lan'], [220, 170],
    { a: '#3fc9a5', b: '#6f97ff', c: '#a879ff' }, { a: 'vurgu', b: 'ana', c: 'golge' });
}

// ── Yükle bulut (240×170): bulut + yukarı ok
{
  rect(40, 70, 160, 80, 'bulut', 0.1);
  tri([[30, 110], [70, 60], [70, 150]], 'bulut', 0.12);
  tri([[70, 60], [130, 20], [170, 70]], 'bulut', -0.1);
  tri([[70, 60], [170, 70], [100, 110]], 'bulut', 0.06);
  tri([[130, 20], [200, 50], [170, 70]], 'bulut', 0.1);
  tri([[200, 60], [225, 110], [200, 150]], 'bulut', -0.14);
  tri([[120, 55], [90, 95], [150, 95]], 'ok', 0.2);
  rect(108, 95, 24, 45, 'ok', -0.1);
  save('yukle-bulut', 'Yükleme (bulut + ok)', ['yükle', 'bulut', 'dosya', 'medya'], [240, 170],
    { bulut: '#cfe3ff', ok: '#ff9aa2' }, { bulut: 'ana', ok: 'vurgu' });
}

// ── Slayt yığını (240×180): üst üste üç pastel kart (sürükle-bırak sıralama)
{
  rect(10, 40, 170, 110, 'a', 0.08);
  rect(40, 25, 170, 110, 'b', 0.1);
  rect(70, 10, 160, 110, 'c', 0.12);
  rect(84, 24, 132, 62, 'ic', -0.06);
  rect(84, 94, 80, 10, 'yazi', 0.08);
  save('slayt-yigini', 'Slayt yığını', ['slayt', 'sıralama', 'sürükle', 'kart'], [240, 160],
    { a: '#c9a7ff', b: '#9ab8ff', c: '#ffd6a5', ic: '#fff8ef', yazi: '#b9a9ff' }, { a: 'ana', b: 'ikinci', c: 'vurgu', ic: 'ekran', yazi: 'golge' });
}

// ── Zamanlayıcı (200×220): daire (24 dilim) + akrep/yelkovan + üst düğme
{
  const cx = 100, cy = 125, R = 84, n = 24;
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283, b = (i + 1) / n * 6.283;
    tri([[cx, cy], [cx + R * Math.cos(a), cy + R * Math.sin(a)], [cx + R * Math.cos(b), cy + R * Math.sin(b)]], 'cerceve', i % 2 ? 0.1 : -0.1);
    const r2 = R - 12;
    tri([[cx, cy], [cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)], [cx + r2 * Math.cos(b), cy + r2 * Math.sin(b)]], 'yuz', i % 2 ? 0.05 : -0.05);
  }
  quad([cx - 5, cy + 4], [cx + 5, cy + 4], [cx + 4, cy - 60], [cx - 4, cy - 60], 'el', 0.12);
  quad([cx - 4, cy + 4], [cx + 4, cy - 3], [cx + 46, cy + 18], [cx + 40, cy + 26], 'el', -0.12);
  rect(84, 18, 32, 14, 'cerceve', 0.15);
  rect(94, 30, 12, 22, 'cerceve', -0.1);
  save('zamanlayici', 'Zamanlayıcı', ['süre', 'zaman', 'saat', 'sayaç'], [200, 220],
    { cerceve: '#ff9aa2', yuz: '#fff8ef', el: '#6d597a' }, { cerceve: 'ana', yuz: 'ekran', el: 'golge' });
}
