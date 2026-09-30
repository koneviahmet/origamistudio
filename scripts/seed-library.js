// Başlangıç origami kütüphanesini ve örnek projeyi üretir.
//   npm run seed          → yalnızca eksik dosyaları yazar
//   npm run seed:force    → mevcut seed dosyalarının üzerine yazar
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library');
const PROJ = path.join(ROOT, 'data', 'projects');
const FORCE = process.argv.includes('--force');

const r1 = (v) => Math.round(v * 10) / 10;
const P = (cx, cy, r, deg) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))];
const F = (p, c, s = 0, extra = {}) => ({ p, c, s, ...extra });

const assets = [];
const add = (category, a) => assets.push({ category, ...a });

// ------------------------------------------------------------------ hayvanlar
add('hayvanlar', {
  id: 'tilki',
  name: 'Tilki',
  tags: ['hayvan', 'orman', 'oturan'],
  size: [200, 200],
  palette: { a: '#ea7a3b', b: '#b8521f', c: '#fbefe0', d: '#3b2a22' },
  parts: { tail: { pivot: [142, 186] } },
  facets: [
    F([[140, 190], [196, 122], [160, 150]], 'a', -0.15, { part: 'tail' }),
    F([[140, 190], [196, 122], [180, 176]], 'a', 0.08, { part: 'tail' }),
    F([[196, 122], [181, 138], [191, 150]], 'c', 0, { part: 'tail' }),
    F([[100, 108], [70, 98], [50, 192], [100, 192]], 'a', -0.02),
    F([[100, 108], [130, 98], [150, 192], [100, 192]], 'a', -0.22),
    F([[84, 110], [100, 106], [116, 110], [100, 165]], 'c', -0.04),
    F([[55, 45], [60, 4], [86, 45]], 'a', 0.05),
    F([[145, 45], [140, 4], [114, 45]], 'a', -0.18),
    F([[63, 42], [63, 18], [79, 42]], 'b', 0),
    F([[137, 42], [137, 18], [121, 42]], 'b', -0.12),
    F([[55, 45], [100, 45], [100, 112]], 'a', 0.1),
    F([[100, 45], [145, 45], [100, 112]], 'a', -0.1),
    F([[62, 62], [100, 84], [100, 112]], 'c', 0.02),
    F([[138, 62], [100, 84], [100, 112]], 'c', -0.12),
    F([[93, 103], [107, 103], [100, 113]], 'd', 0),
    F([[74, 60], [87, 58], [82, 66]], 'd', 0),
    F([[126, 60], [113, 58], [118, 66]], 'd', 0),
  ],
});

add('hayvanlar', {
  id: 'turna',
  name: 'Turna Kuşu',
  tags: ['kuş', 'uçan', 'klasik'],
  size: [240, 150],
  palette: { a: '#e8554e', b: '#c43d3a' },
  parts: { wingBack: { pivot: [120, 88] }, wingFront: { pivot: [120, 92] } },
  facets: [
    F([[100, 88], [140, 88], [152, 8]], 'b', -0.25, { part: 'wingBack' }),
    F([[140, 97], [160, 100], [226, 44]], 'a', -0.12),
    F([[86, 100], [101, 95], [30, 40]], 'a', 0.02),
    F([[30, 40], [12, 53], [38, 47]], 'a', 0.12),
    F([[80, 100], [120, 80], [160, 100]], 'a', 0.06),
    F([[80, 100], [160, 100], [120, 116]], 'a', -0.22),
    F([[95, 92], [120, 92], [88, 4]], 'a', 0.16, { part: 'wingFront' }),
    F([[120, 92], [145, 92], [88, 4]], 'a', -0.04, { part: 'wingFront' }),
  ],
});

add('hayvanlar', {
  id: 'balik',
  name: 'Balık',
  tags: ['deniz', 'yüzen'],
  size: [200, 120],
  palette: { a: '#3fa7d6', b: '#f29e4c', d: '#1d3557' },
  parts: { tail: { pivot: [146, 60] } },
  facets: [
    F([[140, 60], [195, 18], [182, 60]], 'b', 0.05, { part: 'tail' }),
    F([[140, 60], [182, 60], [195, 102]], 'b', -0.18, { part: 'tail' }),
    F([[60, 26], [95, 6], [102, 36]], 'b', -0.05),
    F([[20, 60], [70, 20], [150, 60]], 'a', 0.1),
    F([[20, 60], [150, 60], [70, 100]], 'a', -0.18),
    F([[70, 100], [95, 80], [110, 112]], 'b', -0.1),
    F([[44, 51], [52, 47], [51, 55]], 'd', 0),
  ],
});

add('hayvanlar', {
  id: 'balina',
  name: 'Balina',
  tags: ['deniz', 'büyük'],
  size: [260, 140],
  palette: { a: '#4a6fa5', c: '#dbe7f3', d: '#1b2a41' },
  parts: { tail: { pivot: [208, 70] } },
  facets: [
    F([[205, 70], [255, 28], [236, 70]], 'a', 0.05, { part: 'tail' }),
    F([[205, 70], [236, 70], [255, 106]], 'a', -0.2, { part: 'tail' }),
    F([[10, 80], [90, 30], [120, 75]], 'a', 0.12),
    F([[90, 30], [180, 50], [120, 75]], 'a', 0),
    F([[180, 50], [212, 70], [120, 75]], 'a', -0.15),
    F([[10, 80], [120, 75], [30, 105]], 'c', 0.05),
    F([[30, 105], [120, 75], [120, 120]], 'c', -0.1),
    F([[120, 75], [212, 70], [120, 120]], 'a', -0.3),
    F([[90, 100], [122, 100], [96, 132]], 'a', -0.25),
    F([[44, 77], [53, 75], [50, 83]], 'd', 0),
  ],
});

add('hayvanlar', {
  id: 'kelebek',
  name: 'Kelebek',
  tags: ['böcek', 'uçan', 'çiçek'],
  size: [200, 160],
  palette: { a: '#9b5de5', b: '#f15bb5', d: '#2b2d42' },
  parts: { wingL: { pivot: [100, 78] }, wingR: { pivot: [100, 78] } },
  facets: [
    F([[100, 75], [22, 12], [8, 68]], 'a', 0.12, { part: 'wingL' }),
    F([[100, 75], [8, 68], [60, 82]], 'a', -0.12, { part: 'wingL' }),
    F([[100, 82], [18, 86], [46, 146]], 'b', 0.02, { part: 'wingL' }),
    F([[100, 75], [178, 12], [192, 68]], 'a', -0.05, { part: 'wingR' }),
    F([[100, 75], [192, 68], [140, 82]], 'a', -0.25, { part: 'wingR' }),
    F([[100, 82], [182, 86], [154, 146]], 'b', -0.18, { part: 'wingR' }),
    F([[96, 50], [104, 50], [102, 132], [98, 132]], 'd', 0.1),
  ],
});

// ------------------------------------------------------------------- doğa
add('doga', {
  id: 'cam-agaci',
  name: 'Çam Ağacı',
  tags: ['ağaç', 'orman'],
  size: [140, 220],
  palette: { a: '#4f9d69', b: '#8a5a3b' },
  facets: [
    F([[60, 172], [70, 172], [70, 216], [60, 216]], 'b', 0),
    F([[70, 172], [80, 172], [80, 216], [70, 216]], 'b', -0.22),
    F([[70, 84], [10, 176], [70, 176]], 'a', 0.02),
    F([[70, 84], [130, 176], [70, 176]], 'a', -0.2),
    F([[70, 40], [20, 122], [70, 122]], 'a', 0.08),
    F([[70, 40], [120, 122], [70, 122]], 'a', -0.14),
    F([[70, 4], [30, 70], [70, 70]], 'a', 0.16),
    F([[70, 4], [110, 70], [70, 70]], 'a', -0.08),
  ],
});

add('doga', {
  id: 'dag',
  name: 'Dağ',
  tags: ['manzara', 'kar'],
  size: [300, 180],
  palette: { a: '#9d8ec4', b: '#7c6fa6', c: '#fffaf2' },
  facets: [
    F([[240, 60], [180, 178], [240, 178]], 'b', 0.05),
    F([[240, 60], [300, 178], [240, 178]], 'b', -0.2),
    F([[150, 10], [20, 178], [150, 178]], 'a', 0.06),
    F([[150, 10], [280, 178], [150, 178]], 'a', -0.2),
    F([[150, 10], [121, 48], [138, 42], [150, 58]], 'c', 0.02),
    F([[150, 10], [150, 58], [163, 42], [179, 48]], 'c', -0.1),
  ],
});

add('doga', {
  id: 'lale',
  name: 'Lale',
  tags: ['çiçek', 'bahar'],
  size: [120, 220],
  palette: { a: '#ef476f', g: '#52a36b' },
  facets: [
    F([[57, 92], [63, 92], [63, 216], [57, 216]], 'g', -0.1),
    F([[60, 206], [18, 128], [52, 170]], 'g', 0.1),
    F([[60, 196], [106, 138], [70, 176]], 'g', -0.15),
    F([[20, 30], [45, 50], [30, 95]], 'a', 0.1),
    F([[45, 50], [60, 18], [75, 50]], 'a', 0.22),
    F([[45, 50], [75, 50], [90, 95], [30, 95]], 'a', -0.04),
    F([[75, 50], [100, 30], [90, 95]], 'a', -0.2),
  ],
});

{
  const top = [[0, 70], [70, 34], [140, 58], [210, 22], [280, 52], [340, 30], [400, 60]];
  const facets = [];
  for (let i = 0; i < top.length - 1; i++) {
    const [x0, y0] = top[i];
    const [x1, y1] = top[i + 1];
    const mid = [r1((x0 + x1) / 2), 120];
    facets.push(F([[x0, y0], [x1, y1], mid], i % 2 ? 'b' : 'a', i % 2 ? -0.05 : 0.08));
    facets.push(F([[x0, y0], mid, [x0, 120]], 'a', -0.12));
    facets.push(F([[x1, y1], [x1, 120], mid], 'b', -0.18));
  }
  add('doga', {
    id: 'tepeler',
    name: 'Tepeler',
    tags: ['zemin', 'çimen', 'manzara'],
    size: [400, 120],
    palette: { a: '#9ccf7f', b: '#7fb865' },
    facets,
  });
}

// ------------------------------------------------------------------ gökyüzü
{
  const cx = 80;
  const cy = 80;
  const facets = [];
  for (let k = 0; k < 12; k++) {
    const a = k * 30;
    const tip = P(cx, cy, 77, a);
    facets.push(F([tip, P(cx, cy, 48, a - 11), P(cx, cy, 48, a)], 'b', 0.12));
    facets.push(F([tip, P(cx, cy, 48, a), P(cx, cy, 48, a + 11)], 'b', -0.14));
  }
  for (let k = 0; k < 12; k++) {
    facets.push(F([[cx, cy], P(cx, cy, 52, k * 30 - 15), P(cx, cy, 52, k * 30 + 15)], 'a', k % 2 ? 0.12 : -0.04));
  }
  add('gokyuzu', {
    id: 'gunes',
    name: 'Güneş',
    tags: ['gökyüzü', 'ışık'],
    size: [160, 160],
    palette: { a: '#f7c948', b: '#f29e4c' },
    facets,
  });
}

{
  // Hilal: dış yay (merkez 70,70 r=60, 60°→300°) + iç yay (merkez 107.5,70 r=52.5)
  const n = 9;
  const outer = [];
  const inner = [];
  const a0 = (Math.atan2(52, -7.5) * 180) / Math.PI;
  const a1 = (Math.atan2(-52, -7.5) * 180) / Math.PI + 360;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    outer.push(P(70, 70, 60, 60 + 240 * s));
    inner.push(P(107.5, 70, 52.5, a0 + (a1 - a0) * s));
  }
  const facets = [];
  for (let i = 0; i < n; i++) {
    facets.push(F([outer[i], outer[i + 1], inner[i]], 'a', 0.1));
    facets.push(F([inner[i], outer[i + 1], inner[i + 1]], 'a', -0.12));
  }
  add('gokyuzu', {
    id: 'hilal',
    name: 'Hilal Ay',
    tags: ['gece', 'ay'],
    size: [140, 140],
    palette: { a: '#f5e6a8' },
    facets,
  });
}

add('gokyuzu', {
  id: 'bulut',
  name: 'Bulut',
  tags: ['gökyüzü', 'hava'],
  size: [200, 110],
  palette: { a: '#f3f7fb' },
  facets: [
    F([[10, 96], [42, 56], [76, 96]], 'a', -0.04),
    F([[42, 56], [84, 24], [120, 60], [76, 96]], 'a', 0.1),
    F([[84, 24], [126, 34], [120, 60]], 'a', 0.2),
    F([[120, 60], [126, 34], [166, 54], [150, 96], [76, 96]], 'a', -0.06),
    F([[166, 54], [196, 96], [150, 96]], 'a', -0.16),
  ],
});

add('gokyuzu', {
  id: 'kagit-ucak',
  name: 'Kağıt Uçak',
  tags: ['uçan', 'klasik'],
  size: [200, 100],
  palette: { a: '#fdfdfb' },
  facets: [
    F([[10, 50], [196, 40], [70, 18]], 'a', -0.02),
    F([[10, 50], [196, 40], [60, 72]], 'a', 0.12),
    F([[60, 72], [196, 40], [82, 88]], 'a', -0.24),
  ],
});

// ------------------------------------------------------------------ nesneler
add('nesneler', {
  id: 'ev',
  name: 'Ev',
  tags: ['bina', 'köy'],
  size: [180, 180],
  palette: { a: '#d1495b', b: '#8a5a3b', c: '#fbefe0', d: '#6fb1d6' },
  facets: [
    F([[124, 22], [142, 22], [142, 58], [124, 46]], 'b', -0.1),
    F([[25, 80], [90, 80], [90, 172], [25, 172]], 'c', 0.02),
    F([[90, 80], [155, 80], [155, 172], [90, 172]], 'c', -0.14),
    F([[90, 14], [8, 82], [90, 82]], 'a', 0.08),
    F([[90, 14], [172, 82], [90, 82]], 'a', -0.18),
    F([[74, 120], [106, 120], [106, 172], [74, 172]], 'b', -0.05),
    F([[38, 100], [64, 100], [64, 126], [38, 126]], 'd', 0.1),
    F([[116, 100], [142, 100], [142, 126], [116, 126]], 'd', -0.05),
  ],
});

add('nesneler', {
  id: 'kagit-gemi',
  name: 'Kağıt Gemi',
  tags: ['deniz', 'klasik'],
  size: [220, 140],
  palette: { a: '#277da1', c: '#fdfbf6' },
  facets: [
    F([[60, 80], [110, 8], [110, 80]], 'c', 0.04),
    F([[110, 8], [160, 80], [110, 80]], 'c', -0.14),
    F([[10, 80], [110, 80], [50, 132]], 'a', 0.08),
    F([[50, 132], [110, 80], [170, 132]], 'a', -0.12),
    F([[110, 80], [210, 80], [170, 132]], 'a', -0.02),
  ],
});

// ------------------------------------------------------------------ şekiller
{
  const facets = [];
  const c = [80, 84];
  for (let k = 0; k < 5; k++) {
    const a = -90 + k * 72;
    const tip = P(c[0], c[1], 76, a);
    facets.push(F([c, tip, P(c[0], c[1], 31, a - 36)], 'a', 0.16));
    facets.push(F([c, tip, P(c[0], c[1], 31, a + 36)], 'a', -0.12));
  }
  add('sekiller', {
    id: 'yildiz',
    name: 'Yıldız',
    tags: ['şekil', 'parıltı'],
    size: [160, 160],
    palette: { a: '#ffd23f' },
    facets,
  });
}

add('sekiller', {
  id: 'kalp',
  name: 'Kalp',
  tags: ['şekil', 'sevgi'],
  size: [160, 150],
  palette: { a: '#e63946' },
  facets: [
    F([[80, 40], [45, 12], [10, 50]], 'a', 0.16),
    F([[80, 40], [10, 50], [80, 140]], 'a', 0),
    F([[80, 40], [115, 12], [150, 50]], 'a', -0.04),
    F([[80, 40], [150, 50], [80, 140]], 'a', -0.2),
  ],
});

// ------------------------------------------------------------------ deniz
{
  // Yatay tekrarlanan dalga bandı: tepe noktaları sivri, gövde iki tonlu
  const W = 400;
  const H = 100;
  const n = 8;
  const top = [];
  for (let i = 0; i <= n; i++) top.push([r1((i * W) / n), i % 2 ? 8 : 36]);
  const facets = [F([[0, 36], [W, 36], [W, H], [0, H]], 'b', -0.05)];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = top[i];
    const [x1, y1] = top[i + 1];
    const peakLeft = y0 < y1;
    const mid = [r1((x0 + x1) / 2), 62];
    facets.push(F([[x0, y0], [x1, y1], mid], 'a', peakLeft ? 0.14 : -0.02));
    facets.push(F([[x0, y0], mid, [x0, 62]], 'b', peakLeft ? 0.05 : -0.12));
    facets.push(F([[x1, y1], [x1, 62], mid], 'b', peakLeft ? -0.14 : 0.04));
  }
  add('deniz', {
    id: 'dalga',
    name: 'Dalga',
    tags: ['deniz', 'su', 'zemin'],
    size: [W, H],
    palette: { a: '#7cc6dc', b: '#4f9fc0' },
    facets,
  });
}

add('deniz', {
  id: 'su-fiskirmasi',
  name: 'Su Fışkırması',
  tags: ['deniz', 'balina', 'su'],
  size: [120, 160],
  palette: { a: '#e3f5fb', b: '#b9e2f1' },
  facets: [
    F([[52, 160], [68, 160], [66, 58], [54, 58]], 'b', 0),
    F([[60, 62], [14, 12], [4, 54]], 'a', 0.08),
    F([[60, 62], [4, 54], [30, 70]], 'b', -0.1),
    F([[60, 62], [106, 12], [116, 54]], 'a', -0.06),
    F([[60, 62], [116, 54], [90, 70]], 'b', -0.2),
    F([[60, 62], [40, 2], [80, 2]], 'a', 0.2),
  ],
});

add('hayvanlar', {
  id: 'marti',
  name: 'Martı',
  tags: ['kuş', 'deniz', 'uçan'],
  size: [200, 90],
  palette: { a: '#fbfbf8', b: '#9aa6b2', o: '#f4a259', d: '#2b2d42' },
  parts: { wingL: { pivot: [96, 46] }, wingR: { pivot: [104, 46] } },
  facets: [
    F([[96, 46], [52, 18], [6, 34]], 'b', 0.05, { part: 'wingL' }),
    F([[96, 46], [6, 34], [58, 40]], 'a', -0.08, { part: 'wingL' }),
    F([[104, 46], [148, 18], [194, 34]], 'b', -0.12, { part: 'wingR' }),
    F([[104, 46], [194, 34], [142, 40]], 'a', -0.2, { part: 'wingR' }),
    F([[78, 46], [118, 40], [124, 52], [86, 56]], 'a', 0.02),
    F([[78, 46], [62, 44], [86, 56]], 'b', -0.1),
    F([[118, 40], [134, 42], [124, 52]], 'a', 0.1),
    F([[134, 42], [146, 46], [132, 48]], 'o', 0),
    F([[124, 43], [128, 43], [126, 46]], 'd', 0),
  ],
});

// ------------------------------------------------------------------- uzay
// Low-poly küre üreteçleri. Işık sol üstten gelir (açı 225°).
const LIGHT = (225 * Math.PI) / 180;
const lit = (ang, k) => r1(Math.cos(ang - LIGHT) * k * 100) / 100;

/** Kayalık gezegen: iç yelpaze + dış halka. color(i, bölge) → palet anahtarı */
function radialSphere({ cx = 100, cy = 100, r = 90, n = 14, color = () => 'a', extra = [] }) {
  const ri = r * 0.56;
  const facets = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 360;
    const a1 = ((i + 1) / n) * 360;
    const am = (((i + 0.5) / n) * 360 * Math.PI) / 180;
    facets.push(F([P(cx, cy, r, a0), P(cx, cy, r, a1), P(cx, cy, ri, a1), P(cx, cy, ri, a0)], color(i, 'dis'), lit(am, 0.3) - 0.04));
  }
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 360;
    const a1 = ((i + 1) / n) * 360;
    const am = (((i + 0.5) / n) * 360 * Math.PI) / 180;
    facets.push(F([[cx, cy], P(cx, cy, ri, a0), P(cx, cy, ri, a1)], color(i, 'ic'), lit(am, 0.14) + 0.06));
  }
  return facets.concat(extra);
}

/** Gaz devi: yatay şeritler, her şerit sol/orta/sağ parçaya bölünür. bands: palet anahtarları (yukarıdan aşağı) */
function bandedSphere({ cx = 100, cy = 100, r = 90, bands }) {
  const k = bands.length;
  const facets = [];
  const hw = (y) => Math.sqrt(Math.max(0, r * r - y * y));
  for (let i = 0; i < k; i++) {
    const yA = -r + (2 * r * i) / k;
    const yB = -r + (2 * r * (i + 1)) / k;
    const ym = (yA + yB) / 2;
    const c = hw(ym) * 0.34;
    const L = [[-hw(yA), yA], [-hw(ym), ym], [-hw(yB), yB]];
    const R = [[hw(yA), yA], [hw(ym), ym], [hw(yB), yB]];
    const T = (pts) => pts.map(([x, y]) => [r1(cx + x), r1(cy + y)]);
    const cutL = [[-Math.min(c, hw(yA)), yA], [-Math.min(c, hw(yB)), yB]];
    const cutR = [[Math.min(c, hw(yA)), yA], [Math.min(c, hw(yB)), yB]];
    const vy = ym / r; // üst şeritler daha aydınlık
    facets.push(F(T([L[0], cutL[0], cutL[1], L[2], L[1]]), bands[i], r1((0.16 - vy * 0.08) * 100) / 100));
    facets.push(F(T([cutL[0], cutR[0], cutR[1], cutL[1]]), bands[i], r1((0.04 - vy * 0.08) * 100) / 100));
    facets.push(F(T([cutR[0], R[0], R[1], R[2], cutR[1]]), bands[i], r1((-0.2 - vy * 0.06) * 100) / 100));
  }
  return facets;
}

/** Elips biçimli leke / krater */
const blob = (cx, cy, rx, ry, c, s = 0, n = 7) =>
  F(Array.from({ length: n }, (_, i) => [r1(cx + rx * Math.cos((i / n) * Math.PI * 2)), r1(cy + ry * Math.sin((i / n) * Math.PI * 2))]), c, s);

add('uzay', {
  id: 'merkur', name: 'Merkür', tags: ['gezegen', 'uzay', 'kayalık'], size: [200, 200],
  palette: { a: '#9e9a97', b: '#7d7874', d: '#5f5a57' },
  facets: radialSphere({
    color: (i, z) => (z === 'dis' && i % 4 === 1 ? 'b' : 'a'),
    extra: [blob(70, 80, 12, 9, 'd', -0.05), blob(125, 115, 9, 7, 'd', -0.1), blob(95, 140, 7, 5, 'b', 0), blob(135, 70, 6, 5, 'b', -0.05)],
  }),
});
add('uzay', {
  id: 'venus', name: 'Venüs', tags: ['gezegen', 'uzay', 'sıcak'], size: [200, 200],
  palette: { a: '#e8c07a', b: '#d9a55b', c: '#f3dca8' },
  facets: bandedSphere({ bands: ['c', 'a', 'b', 'a', 'c', 'a', 'b'] }),
});
{
  const land = new Set([1, 2, 5, 7, 12, 13]);
  add('uzay', {
    id: 'dunya', name: 'Dünya', tags: ['gezegen', 'uzay', 'yaşam'], size: [200, 200],
    palette: { a: '#2f80c7', b: '#4caf6a', c: '#f4f7fb' },
    facets: radialSphere({
      color: (i, z) => (z === 'dis' && (i === 10 || i === 11) ? 'c' : land.has(i) && (z === 'dis' || i % 2) ? 'b' : 'a'),
      extra: [blob(78, 92, 14, 9, 'c', 0.1), blob(128, 128, 12, 6, 'c', 0)],
    }),
  });
}
add('uzay', {
  id: 'mars', name: 'Mars', tags: ['gezegen', 'uzay', 'kızıl'], size: [200, 200],
  palette: { a: '#c8553d', b: '#a33e2a', c: '#f4ece6' },
  facets: radialSphere({
    color: (i, z) => (z === 'dis' && (i === 10 || i === 11) ? 'c' : z === 'dis' && i % 3 === 0 ? 'b' : 'a'),
    extra: [blob(115, 110, 16, 7, 'b', -0.05), blob(75, 125, 9, 6, 'b', 0)],
  }),
});
add('uzay', {
  id: 'jupiter', name: 'Jüpiter', tags: ['gezegen', 'uzay', 'gaz devi'], size: [200, 200],
  palette: { a: '#e3c9a8', b: '#c08a5b', c: '#f3e6d3', d: '#b5452f' },
  facets: [...bandedSphere({ bands: ['b', 'c', 'a', 'b', 'c', 'a', 'b', 'c', 'a'] }), blob(128, 128, 16, 8, 'd', -0.02, 8)],
});
{
  // Satürn: halka arka yarısı → gezegen → halka ön yarısı
  const cx = 200;
  const cy = 110;
  const m = 18;
  const ring = (fromDeg, toDeg) => {
    const out = [];
    for (let i = 0; i < m; i++) {
      const a0 = ((fromDeg + ((toDeg - fromDeg) * i) / m) * Math.PI) / 180;
      const a1 = ((fromDeg + ((toDeg - fromDeg) * (i + 1)) / m) * Math.PI) / 180;
      const E = (rx, ry, a) => [r1(cx + rx * Math.cos(a)), r1(cy + ry * Math.sin(a))];
      const s = r1(-Math.sin((a0 + a1) / 2) * 0.12 * 100) / 100;
      out.push(F([E(125, 26, a0), E(158, 33, a0), E(158, 33, a1), E(125, 26, a1)], 'r', s, { hinge: 0 }));
      out.push(F([E(158, 33, a0), E(192, 40, a0), E(192, 40, a1), E(158, 33, a1)], 'q', s - 0.04, { hinge: 0 }));
    }
    return out;
  };
  add('uzay', {
    id: 'saturn', name: 'Satürn', tags: ['gezegen', 'uzay', 'halka'], size: [400, 220], center: [200, 110],
    palette: { a: '#e8d3a2', b: '#cfae72', c: '#f5ead0', r: '#d8c49a', q: '#b89f74' },
    facets: [...ring(180, 360), ...bandedSphere({ cx, cy, r: 85, bands: ['c', 'a', 'b', 'a', 'c', 'a', 'b'] }), ...ring(0, 180)],
  });
}
add('uzay', {
  id: 'uranus', name: 'Uranüs', tags: ['gezegen', 'uzay', 'buz devi'], size: [200, 200],
  palette: { a: '#9fe0e6', b: '#7ccbd6', c: '#c9f1f3' },
  facets: bandedSphere({ bands: ['c', 'a', 'a', 'b', 'a', 'a', 'c'] }),
});
add('uzay', {
  id: 'neptun', name: 'Neptün', tags: ['gezegen', 'uzay', 'buz devi'], size: [200, 200],
  palette: { a: '#3f6fe0', b: '#2d52b5', c: '#8fb0ff', d: '#1d3580' },
  facets: radialSphere({
    color: (i, z) => (z === 'dis' && i % 3 === 0 ? 'b' : 'a'),
    extra: [blob(118, 112, 14, 8, 'd', 0), blob(80, 80, 18, 3, 'c', 0.1, 6), blob(100, 138, 20, 3, 'c', 0, 6)],
  }),
});
add('uzay', {
  id: 'ay', name: 'Ay', tags: ['uydu', 'uzay', 'gece'], size: [200, 200],
  palette: { a: '#d8d8d8', b: '#bdbdbd', d: '#9a9a9a' },
  facets: radialSphere({
    color: (i, z) => (z === 'dis' && i % 3 === 2 ? 'b' : 'a'),
    extra: [blob(72, 84, 13, 10, 'd', 0), blob(120, 70, 9, 7, 'b', -0.05), blob(122, 128, 15, 11, 'd', -0.05), blob(82, 138, 7, 6, 'b', 0)],
  }),
});

// --------------------------------------------------------------- efektler
// Parçacık efektleri de kütüphane öğesidir ("type": "particles"); sahnede "particle": "<id>" ile kullanılır.
const FX = (id, name, tags, def) => add('efektler', { id, name, tags: ['efekt', ...tags], type: 'particles', ...def });
FX('konfeti', 'Kağıt konfeti', ['kutlama'], {
  motion: 'dus', shape: 'kagit', count: 120, size: 20, speed: 260, sway: 40, spin: 7,
  colors: ['$vurgu', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ffffff'],
});
FX('kar', 'Kar', ['kış', 'hava'], { motion: 'dus', shape: 'kar', count: 140, size: 9, speed: 90, sway: 30, spin: 1, colors: ['#ffffff', '#eaf4ff'], prewarm: true });
FX('yagmur', 'Yağmur', ['hava'], { motion: 'dus', shape: 'damla', count: 160, size: 30, speed: 1300, sway: 0, spin: 0, colors: ['rgba(190,220,255,0.7)'], prewarm: true });
FX('yaprak', 'Sonbahar yaprakları', ['sonbahar', 'doğa'], {
  motion: 'dus', shape: 'yaprak', count: 45, size: 34, speed: 140, sway: 90, spin: 2.5,
  colors: ['#e76f51', '#f4a261', '#e9c46a', '#c8553d', '#8c4a2f'],
});
FX('kabarcik', 'Kabarcıklar', ['deniz', 'su'], { motion: 'yuksel', shape: 'kabarcik', count: 50, size: 22, speed: 120, sway: 25, spin: 0, colors: ['rgba(220,245,255,0.85)'], prewarm: true });
FX('yildiz-tozu', 'Yıldız tozu', ['parıltı', 'uzay'], { motion: 'yerinde', shape: 'pirilti', count: 70, size: 28, speed: 20, sway: 10, spin: 0, colors: ['#fff6c2', '#ffffff', '$baslik'], prewarm: true });
FX('kalp-yagmuru', 'Kalp yağmuru', ['sevgi', 'kutlama'], { motion: 'dus', shape: 'varlik', asset: 'kalp', count: 30, size: 70, speed: 200, sway: 60, spin: 1.5, colors: [] });
FX('kagit-ucaklar', 'Uçuşan kağıt uçaklar', ['uçan', 'gökyüzü'], { motion: 'dus', shape: 'varlik', asset: 'kagit-ucak', count: 12, size: 90, speed: 45, wind: 240, sway: 70, spin: 0, colors: [], prewarm: true });
FX('yildiz-yagmuru', 'Yıldız yağmuru', ['parıltı', 'kutlama'], { motion: 'dus', shape: 'varlik', asset: 'yildiz', count: 40, size: 44, speed: 170, sway: 50, spin: 1.2, colors: [] });

// ------------------------------------------------------------------ yazım
let written = 0;
for (const a of assets) {
  const { category, ...data } = a;
  const file = path.join(LIB, category, `${a.id}.json`);
  if (fs.existsSync(file) && !FORCE) continue;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  delete data.id;
  fs.writeFileSync(file, JSON.stringify({ id: a.id, ...data }, null, 2) + '\n');
  written++;
}
console.log(`Kütüphane: ${written}/${assets.length} varlık yazıldı → ${path.relative(ROOT, LIB)}`);

// ------------------------------------------------------------ örnek proje
const projDir = path.join(PROJ, 'origami-orman');
const sceneFile = path.join(projDir, 'scene.json');
if (!fs.existsSync(sceneFile) || FORCE) {
  const k = (t, v, ease) => (ease ? { t, v, ease } : { t, v });
  const unfold = (t0, t1, ease = 'linear') => [k(t0, 0), k(t1, 1, ease)];
  const scene = {
    name: 'Origami Orman',
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 12,
    background: { type: 'linear', colors: ['#ffe9cf', '#fbd0a8', '#f4ad86'], angle: 180, paper: 0.55, vignette: 0.22 },
    camera: {
      zoom: [k(0, 1.22), k(4, 1, 'inOutCubic'), k(12, 1.06, 'linear')],
      y: [k(0, 1120), k(4, 960, 'inOutCubic')],
    },
    layers: [
      { id: 'gunes', asset: 'gunes', x: 770, y: 640, scale: 2.1, fold: unfold(0.2, 1.8), foldStyle: { order: 'radial', spread: 0.7 }, loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 9 }] },
      { id: 'bulut-1', asset: 'bulut', x: [k(0, 250), k(12, 380, 'linear')], y: 520, scale: 1.5, fold: unfold(0.6, 2), foldStyle: { order: 'left' } },
      { id: 'bulut-2', asset: 'bulut', x: [k(0, 920), k(12, 800, 'linear')], y: 800, scale: 1.0, fold: unfold(1.1, 2.4), foldStyle: { order: 'right' } },
      { id: 'dag-1', asset: 'dag', x: 330, y: 1690, anchor: [0.5, 1], scale: 2.7, fold: unfold(0.4, 2.0), foldStyle: { order: 'bottom', spread: 0.5 } },
      { id: 'dag-2', asset: 'dag', x: 850, y: 1710, anchor: [0.5, 1], scale: 2.1, palette: { a: '#8fb3c9', b: '#6f93aa' }, fold: unfold(0.8, 2.3), foldStyle: { order: 'bottom', spread: 0.5 } },
      { id: 'tepeler', asset: 'tepeler', x: 540, y: 1930, anchor: [0.5, 1], scale: 2.9, fold: unfold(0.1, 1.3), foldStyle: { order: 'left', spread: 0.75 } },
      { id: 'agac-1', asset: 'cam-agaci', x: 150, y: 1700, anchor: [0.5, 1], scale: 1.5, fold: unfold(1.3, 2.4), foldStyle: { order: 'bottom' }, shadow: true },
      { id: 'agac-2', asset: 'cam-agaci', x: 950, y: 1720, anchor: [0.5, 1], scale: 1.8, fold: unfold(1.5, 2.6), foldStyle: { order: 'bottom' }, shadow: true },
      { id: 'agac-3', asset: 'cam-agaci', x: 810, y: 1670, anchor: [0.5, 1], scale: 1.15, palette: { a: '#6bb07b' }, fold: unfold(1.7, 2.8), foldStyle: { order: 'bottom' }, shadow: true },
      { id: 'lale-1', asset: 'lale', x: 330, y: 1760, anchor: [0.5, 1], scale: 0.8, fold: unfold(3.4, 4.2), loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 3 }] },
      { id: 'lale-2', asset: 'lale', x: 700, y: 1770, anchor: [0.5, 1], scale: 0.7, palette: { a: '#ffb703' }, fold: unfold(3.6, 4.4), loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 3.4, phase: 0.3 }] },
      {
        id: 'tilki', asset: 'tilki', x: 530, y: 1690, anchor: [0.5, 1], scale: 2.3,
        fold: unfold(2.0, 3.8), foldStyle: { order: 'bottom', spread: 0.7 }, shadow: { opacity: 0.32 },
        parts: { tail: { loops: [{ prop: 'rotation', type: 'sine', amp: 7, period: 2.2 }] } },
        loops: [{ prop: 'scaleY', type: 'sine', amp: 0.012, period: 3 }],
      },
      {
        id: 'turna', asset: 'turna', start: 3.4, scaleX: -1,
        x: [k(3.4, -260), k(11.5, 1360, 'inOutSine')],
        y: [k(3.4, 980), k(11.5, 620, 'inOutSine')],
        scale: 1.25, fold: unfold(3.4, 4.4, 'outCubic'),
        loops: [{ prop: 'y', type: 'sine', amp: 22, period: 1.4 }],
        parts: {
          wingBack: { scaleY: 0.15, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.85, period: 0.7 }] },
          wingFront: { scaleY: 0.15, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.85, period: 0.7 }] },
        },
      },
      {
        id: 'kelebek', asset: 'kelebek', start: 6,
        x: [k(6, -80), k(9, 380, 'inOutSine'), k(12, 760, 'inOutSine')],
        y: [k(6, 1200), k(9, 1050, 'inOutSine'), k(12, 1150, 'inOutSine')],
        scale: 0.55, rotation: 8,
        parts: {
          wingL: { scaleX: 0.55, loops: [{ prop: 'scaleX', type: 'sine', amp: 0.45, period: 0.35 }] },
          wingR: { scaleX: 0.55, loops: [{ prop: 'scaleX', type: 'sine', amp: 0.45, period: 0.35 }] },
        },
        loops: [{ prop: 'y', type: 'noise', amp: 30, period: 2 }],
      },
      {
        id: 'baslik', type: 'text', text: 'Origami Orman', x: 540, y: 300, size: 118, weight: 700,
        color: '#5b3a29', shadow: { color: 'rgba(120,60,20,0.25)', blur: 0, y: 6 },
        opacity: [k(4.2, 0), k(4.8, 1)], scale: [k(4.2, 0.6), k(5.0, 1, 'outBack')],
      },
      {
        id: 'alt-baslik', type: 'text', text: 'kağıttan bir dünya', x: 540, y: 410, size: 56, weight: 500,
        color: '#8a5a3b', reveal: [k(5.0, 0), k(6.6, 1, 'linear')],
      },
    ],
  };
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(sceneFile, JSON.stringify(scene, null, 2) + '\n');
  if (!fs.existsSync(path.join(projDir, 'notes.json'))) fs.writeFileSync(path.join(projDir, 'notes.json'), '[]\n');
  console.log('Örnek proje yazıldı → data/projects/origami-orman');
}
