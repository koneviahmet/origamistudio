// 5 zaman tüneli reels'i için yeni origami modelleri:
//   biyoloji (hücre keşfi) · tekstil (tişört yolculuğu) · yapay-zeka · internet · havacilik
//   node scripts/seed-zaman-tuneli.mjs      (her çalıştırmada üzerine yazar; bu dosya kaynak)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library');
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (cx, cy, r, deg) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))];
const F = (p, c, s = 0, extra = {}) => ({ p, c, s: r1(s * 100) / 100, ...extra });
const rect = (x, y, w, h, c, s = 0, extra = {}) => [
  F([[x, y], [x + w, y], [x + w, y + h]], c, s + 0.09, extra),
  F([[x, y], [x + w, y + h], [x, y + h]], c, s - 0.09, extra),
];
const poly = (pts, c, s = 0, extra = {}) => {
  const out = [];
  for (let i = 1; i < pts.length - 1; i++) out.push(F([pts[0], pts[i], pts[i + 1]], c, s + (i % 2 ? 0.08 : -0.08), extra));
  return out;
};
const ellipse = (cx, cy, rx, ry, c, s = 0, n = 16, extra = {}) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = (360 / n) * i, a1 = (360 / n) * (i + 1), am = ((a0 + a1) / 2) * (Math.PI / 180);
    const light = Math.cos(am - (225 * Math.PI) / 180) * 0.32;
    out.push(F([[cx, cy], [r1(cx + rx * Math.cos((a0 * Math.PI) / 180)), r1(cy + ry * Math.sin((a0 * Math.PI) / 180))], [r1(cx + rx * Math.cos((a1 * Math.PI) / 180)), r1(cy + ry * Math.sin((a1 * Math.PI) / 180))]], c, s + light, extra));
  }
  return out;
};
/** kalınlıklı çizgi parçası */
const line = (p, q, w, c, s = 0) => {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
  return poly([[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]], c, s);
};

const out = [];
const add = (kategori, a) => out.push({ kategori, ...a });

// ═══════════════════════════════════════════════════════════ BİYOLOJİ
add('biyoloji', (() => {
  // bileşik mikroskop (yan görünüm)
  const f = [];
  f.push(...rect(50, 172, 110, 16, 'a', 0)); // ayak
  f.push(...poly([[118, 172], [118, 70], [136, 58], [146, 70], [146, 172]], 'a', 0.05)); // gövde
  f.push(...rect(66, 128, 64, 9, 'b', -0.05)); // tabla
  f.push(...poly([[70, 30], [90, 22], [132, 104], [112, 112]], 'c', 0)); // tüp
  f.push(...poly([[62, 16], [82, 8], [90, 22], [70, 30]], 'd', 0.1)); // göz merceği
  f.push(...poly([[112, 112], [132, 104], [138, 118], [118, 126]], 'd', -0.1)); // objektif
  f.push(...ellipse(132, 96, 11, 11, 'b', 0, 10)); // ayar düğmesi
  f.push(...ellipse(88, 156, 14, 6, 'e', 0, 10)); // ayna / ışık
  return { id: 'mikroskop', name: 'Mikroskop', tags: ['bilim', 'mikroskop', 'biyoloji', 'hücre', 'keşif'], size: [200, 200],
    palette: { a: '#3b4a6b', b: '#8a97b8', c: '#c9d3ea', d: '#2a3350', e: '#ffd86b' }, roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'vurgu' }, facets: f };
})());

add('biyoloji', (() => {
  // Hooke'un mantar dilimi: petek gibi hücre odacıkları
  const f = [];
  const R = 26;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const cx = 36 + col * 45 + (row % 2 ? 22 : 0), cy = 34 + row * 40;
    if (cx > 178) continue;
    const tone = (row + col) % 3 === 0 ? 'a' : (row + col) % 3 === 1 ? 'b' : 'c';
    f.push(...ellipse(cx, cy, R, R, tone, 0, 6));
    f.push(...ellipse(cx, cy, R - 9, R - 9, 'd', -0.1, 6));
  }
  return { id: 'hucre-petek', name: 'Hücre Peteği (mantar dilimi)', tags: ['hücre', 'mantar', 'hooke', 'petek', 'biyoloji'], size: [200, 200],
    palette: { a: '#d9b27c', b: '#c4955a', c: '#e8cfa2', d: '#7a5230' }, roles: { a: 'ana', b: 'koyu', c: 'acik', d: 'koyu' }, facets: f };
})());

add('biyoloji', (() => {
  // Leeuwenhoek'un "minik canlıları": çubuk bakteri + kırbaç
  const f = [];
  for (let i = 0; i < 5; i++) {
    const x0 = 22 + i * 12, y0 = 100 + Math.sin(i * 1.4) * 14;
    const x1 = 22 + (i + 1) * 12, y1 = 100 + Math.sin((i + 1) * 1.4) * 14;
    f.push(...line([x0, y0], [x1, y1], 3.4, 'd'));
  }
  f.push(...ellipse(112, 100, 62, 30, 'a', 0, 22));
  f.push(...ellipse(112, 100, 52, 22, 'b', 0, 22));
  f.push(...ellipse(100, 98, 11, 9, 'c', 0, 10));
  f.push(...ellipse(130, 104, 7, 6, 'c', 0, 8));
  f.push(...ellipse(150, 94, 5, 4, 'c', 0, 8));
  return { id: 'bakteri', name: 'Bakteri (kırbaçlı)', tags: ['bakteri', 'mikrop', 'leeuwenhoek', 'biyoloji', 'canlı'], size: [200, 200],
    palette: { a: '#4f9a6a', b: '#86cf97', c: '#e6f7b8', d: '#2f6e49' }, roles: { a: 'ana', b: 'acik', c: 'vurgu', d: 'koyu' }, facets: f };
})());

add('biyoloji', (() => {
  const f = [];
  f.push(...ellipse(100, 100, 86, 78, 'a', 0, 26));
  f.push(...ellipse(100, 100, 74, 66, 'b', 0, 26));
  f.push(...ellipse(92, 92, 28, 26, 'c', 0, 16)); // çekirdek
  f.push(...ellipse(88, 88, 10, 9, 'd', 0, 10)); // çekirdekçik
  for (const [x, y, rx, ry] of [[146, 70, 13, 7], [136, 138, 14, 7], [58, 142, 12, 6], [150, 108, 9, 5]]) f.push(...ellipse(x, y, rx, ry, 'e', 0, 10));
  return { id: 'hucre', name: 'Hücre (çekirdekli)', tags: ['hücre', 'çekirdek', 'canlı', 'biyoloji', 'schleiden', 'schwann'], size: [200, 200],
    palette: { a: '#e88a9a', b: '#f7c1c9', c: '#8e6fc9', d: '#4b3585', e: '#f2a35a' }, roles: { a: 'ana', b: 'acik', c: 'vurgu', d: 'koyu', e: 'vurgu' }, facets: f };
})());

add('biyoloji', (() => {
  // hücre bölünmesi: boğumlanan iki hücre
  const f = [];
  f.push(...ellipse(62, 100, 52, 62, 'a', 0, 22));
  f.push(...ellipse(138, 100, 52, 62, 'a', 0, 22));
  f.push(...poly([[62, 52], [138, 52], [138, 148], [62, 148]], 'a', 0.02));
  f.push(...poly([[100, 38], [112, 100], [100, 162], [88, 100]], 'd', -0.1)); // boğum
  f.push(...ellipse(62, 100, 40, 50, 'b', 0, 22));
  f.push(...ellipse(138, 100, 40, 50, 'b', 0, 22));
  f.push(...ellipse(58, 100, 17, 22, 'c', 0, 14));
  f.push(...ellipse(142, 100, 17, 22, 'c', 0, 14));
  return { id: 'hucre-bolunme', name: 'Hücre Bölünmesi', tags: ['hücre', 'bölünme', 'virchow', 'çoğalma', 'biyoloji'], size: [200, 200],
    palette: { a: '#e88a9a', b: '#f7c1c9', c: '#8e6fc9', d: '#c25d74' }, roles: { a: 'ana', b: 'acik', c: 'vurgu', d: 'koyu' }, facets: f };
})());

add('biyoloji', (() => {
  // DNA çift sarmal (dikey)
  const f = [];
  const N = 14, top = 14, step = 12.6, A = 42;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const ph = i * 0.62, y = top + i * step, s = Math.sin(ph);
    pts.push({ y, x1: 100 + A * s, x2: 100 - A * s, front: Math.cos(ph) });
  }
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[i + 1];
    f.push(...line([a.x1, a.y], [b.x1, b.y], 7, a.front > 0 ? 'a' : 'b'));
    f.push(...line([a.x2, a.y], [b.x2, b.y], 7, a.front > 0 ? 'b' : 'a'));
  }
  for (let i = 0; i <= N; i++) {
    const p = pts[i];
    if (i % 1 === 0) f.push(...line([p.x1, p.y], [p.x2, p.y], 4, i % 2 ? 'c' : 'd', -0.05));
    f.push(...ellipse(p.x1, p.y, 6.5, 6.5, 'a', 0, 8));
    f.push(...ellipse(p.x2, p.y, 6.5, 6.5, 'b', 0, 8));
  }
  return { id: 'dna', name: 'DNA Çift Sarmal', tags: ['dna', 'gen', 'sarmal', 'genom', 'biyoloji', 'watson', 'crick'], size: [200, 200],
    palette: { a: '#3fb0d9', b: '#e2557a', c: '#ffd86b', d: '#7bd88f' }, roles: { a: 'ana', b: 'vurgu', c: 'acik', d: 'vurgu' }, facets: f };
})());

// ═══════════════════════════════════════════════════════════ TEKSTİL
add('tekstil', (() => {
  const f = [];
  f.push(...poly([[84, 150], [116, 150], [124, 188], [76, 188]], 'd', 0)); // çanak/sap
  f.push(...poly([[100, 188], [60, 168], [74, 192]], 'e', 0.05)); // yaprak
  f.push(...poly([[100, 188], [142, 170], [128, 194]], 'e', -0.1));
  for (const [x, y, r] of [[100, 54, 40], [58, 88, 38], [142, 88, 38], [74, 126, 36], [126, 126, 36]]) {
    f.push(...ellipse(x, y, r, r, 'a', 0, 14));
    f.push(...ellipse(x - 5, y - 6, r * 0.55, r * 0.55, 'b', 0, 10));
  }
  f.push(...ellipse(100, 98, 24, 24, 'a', 0.05, 12));
  return { id: 'pamuk', name: 'Pamuk Kozası', tags: ['pamuk', 'tarım', 'tarla', 'bitki', 'tekstil'], size: [200, 200],
    palette: { a: '#f4f1ea', b: '#ffffff', d: '#7a5a3a', e: '#5f9e57' }, roles: { a: 'acik', b: 'acik', d: 'koyu', e: 'vurgu' }, facets: f };
})());

add('tekstil', (() => {
  const f = [];
  f.push(...rect(52, 28, 96, 18, 'a', 0)); // üst disk
  f.push(...rect(52, 154, 96, 18, 'a', 0)); // alt disk
  f.push(...rect(62, 46, 76, 108, 'b', 0));
  for (let i = 0; i < 9; i++) f.push(...rect(62, 50 + i * 11.6, 76, 3, 'c', 0.1 * (i % 2 ? 1 : -1)));
  f.push(...line([138, 120], [172, 150], 4, 'b', 0.05));
  f.push(...line([172, 150], [176, 176], 4, 'b', -0.05));
  f.push(...rect(60, 32, 80, 4, 'd', 0.2));
  return { id: 'makara', name: 'İplik Makarası', tags: ['iplik', 'makara', 'dikiş', 'tekstil', 'bobin'], size: [200, 200],
    palette: { a: '#c99a64', b: '#e2557a', c: '#c0415f', d: '#e9c797' }, roles: { a: 'ikincil', b: 'ana', c: 'koyu', d: 'acik' }, facets: f };
})());

add('tekstil', (() => {
  const f = [];
  f.push(...poly([[28, 70], [150, 70], [150, 130], [28, 130]], 'a', 0));
  for (let i = 0; i < 6; i++) f.push(...rect(28, 70 + i * 10, 122, 5, 'b', 0.06 * (i % 2 ? 1 : -1)));
  f.push(...ellipse(150, 100, 24, 30, 'c', 0, 18));
  f.push(...ellipse(150, 100, 9, 12, 'd', 0, 10));
  f.push(...poly([[150, 70], [188, 92], [188, 160], [150, 130]], 'a', -0.12)); // açılan kumaş
  for (let i = 0; i < 4; i++) f.push(...line([150 + i * 9, 76 + i * 5], [150 + i * 9, 132 + i * 5], 3, 'b', -0.1));
  return { id: 'kumas-rulo', name: 'Kumaş Topu', tags: ['kumaş', 'rulo', 'dokuma', 'tekstil', 'boya'], size: [200, 200],
    palette: { a: '#4a8fd1', b: '#7db4ea', c: '#2c5f9b', d: '#e6edf7' }, roles: { a: 'ana', b: 'acik', c: 'koyu', d: 'acik' }, facets: f };
})());

add('tekstil', (() => {
  const f = [];
  f.push(...rect(20, 156, 170, 20, 'a', 0)); // tabla
  f.push(...poly([[130, 156], [130, 62], [150, 36], [188, 36], [188, 156]], 'b', 0.05)); // gövde / kol
  f.push(...rect(40, 46, 150, 22, 'b', 0.08)); // yatay kol
  f.push(...rect(48, 68, 14, 54, 'c', 0)); // iğne mili
  f.push(...poly([[52, 122], [58, 122], [55, 148]], 'd', 0.2)); // iğne
  f.push(...ellipse(168, 100, 20, 20, 'c', 0, 14)); // volan
  f.push(...ellipse(168, 100, 8, 8, 'a', 0, 8));
  f.push(...rect(30, 150, 64, 6, 'd', 0));
  return { id: 'dikis-makinesi', name: 'Dikiş Makinesi', tags: ['dikiş', 'makine', 'atölye', 'terzi', 'tekstil'], size: [200, 200],
    palette: { a: '#4a4f5c', b: '#e2557a', c: '#b8c3d6', d: '#e9ecf2' }, roles: { a: 'koyu', b: 'ana', c: 'acik', d: 'detay' }, facets: f };
})());

add('tekstil', (() => {
  const f = [];
  const cols = ['b', 'c', 'd', 'e'];
  f.push(...poly([[10, 120], [250, 120], [226, 160], [34, 160]], 'a', 0)); // gövde
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
    f.push(...rect(26 + i * 28, 76 + row * 0 + (2 - row) * 15 - 15, 26, 14, cols[(i + row) % 4], 0.04));
  }
  f.push(...rect(188, 60, 46, 60, 'f', 0)); // köprü üstü
  f.push(...rect(196, 68, 30, 10, 'g', 0));
  f.push(...rect(204, 40, 8, 20, 'a', 0)); // baca
  f.push(...poly([[34, 160], [226, 160], [214, 172], [46, 172]], 'h', 0)); // su hattı
  return { id: 'konteyner-gemisi', name: 'Konteyner Gemisi', tags: ['gemi', 'konteyner', 'taşıma', 'lojistik', 'deniz', 'ihracat'], size: [260, 200],
    palette: { a: '#34495e', b: '#e2557a', c: '#f2a35a', d: '#4aa3df', e: '#6cc08b', f: '#f4f1ea', g: '#8fb8de', h: '#c0415f' }, roles: { a: 'koyu', b: 'ana', c: 'vurgu', d: 'vurgu', e: 'vurgu', f: 'acik', g: 'detay', h: 'koyu' }, facets: f };
})());

add('tekstil', (() => {
  const f = [];
  f.push(...rect(56, 48, 88, 118, 'a', 0)); // gövde
  f.push(...poly([[56, 48], [24, 76], [40, 106], [56, 94]], 'a', 0.1)); // sol kol
  f.push(...poly([[144, 48], [176, 76], [160, 106], [144, 94]], 'a', -0.12)); // sağ kol
  f.push(...ellipse(100, 46, 22, 13, 'c', 0, 12)); // yaka
  f.push(...rect(56, 130, 88, 6, 'b', 0.04)); // şerit
  f.push(...ellipse(100, 100, 16, 16, 'b', 0, 5)); // yıldız rozeti (beşgen)
  return { id: 'tisort', name: 'Tişört', tags: ['tişört', 'giyim', 'kıyafet', 'moda', 'tekstil', 'mağaza'], size: [200, 200],
    palette: { a: '#4a8fd1', b: '#ffd86b', c: '#2c5f9b' }, roles: { a: 'ana', b: 'vurgu', c: 'koyu' },
    variants: { beyaz: { name: 'Beyaz', palette: { a: '#f4f1ea', b: '#e2557a', c: '#c9c3b6' } }, kirmizi: { name: 'Kırmızı', palette: { a: '#e2557a', b: '#ffd86b', c: '#a63a58' } } }, facets: f };
})());

// ═══════════════════════════════════════════════════════════ YAPAY ZEKÂ
add('yapay-zeka', (() => {
  const f = [];
  f.push(...ellipse(78, 100, 62, 56, 'a', 0, 20));
  f.push(...ellipse(122, 100, 62, 56, 'b', 0, 20));
  f.push(...poly([[100, 54], [106, 100], [100, 148], [94, 100]], 'c', -0.1));
  const nodes = [[56, 80], [84, 62], [116, 70], [146, 86], [70, 116], [100, 112], [132, 120], [92, 88]];
  const link = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 3], [1, 7], [7, 5], [2, 6]];
  for (const [i, j] of link) f.push(...line(nodes[i], nodes[j], 2.6, 'd', 0.1));
  for (const [x, y] of nodes) f.push(...ellipse(x, y, 5.5, 5.5, 'e', 0, 8));
  return { id: 'yapay-beyin', name: 'Yapay Beyin (devre)', tags: ['yapay zekâ', 'beyin', 'sinir ağı', 'devre', 'öğrenme', 'dartmouth'], size: [200, 200],
    palette: { a: '#8d6fe0', b: '#6f9be8', c: '#3c2f78', d: '#d8e5ff', e: '#ffe27a' }, roles: { a: 'ana', b: 'ikincil', c: 'koyu', d: 'acik', e: 'vurgu' }, facets: f };
})());

add('yapay-zeka', (() => {
  // satranç şahı
  const f = [];
  f.push(...poly([[44, 186], [156, 186], [150, 168], [50, 168]], 'a', 0));
  f.push(...poly([[56, 168], [144, 168], [124, 80], [76, 80]], 'a', 0.05));
  f.push(...poly([[56, 168], [100, 168], [100, 80], [76, 80]], 'b', -0.1)); // gölge yarı
  f.push(...poly([[62, 82], [138, 82], [130, 68], [70, 68]], 'a', 0.1)); // yaka
  f.push(...ellipse(100, 52, 28, 24, 'a', 0, 14)); // baş
  f.push(...rect(95, 10, 10, 20, 'c', 0)); // haç
  f.push(...rect(86, 17, 28, 8, 'c', 0));
  return { id: 'satranc-sah', name: 'Satranç Şahı', tags: ['satranç', 'şah', 'oyun', 'deep blue', 'kasparov', 'strateji'], size: [200, 200],
    palette: { a: '#2f3342', b: '#1c1f2b', c: '#ffd86b' }, roles: { a: 'koyu', b: 'koyu', c: 'vurgu' },
    variants: { beyaz: { name: 'Beyaz', palette: { a: '#f1ede4', b: '#cfc8b8', c: '#c8963e' } } }, facets: f };
})());

add('yapay-zeka', (() => {
  // Go tahtası + taşlar
  const f = [];
  f.push(...poly([[10, 10], [190, 10], [190, 190], [10, 190]], 'a', 0));
  for (let i = 0; i < 7; i++) {
    const p = 30 + i * 23.3;
    f.push(...line([p, 28], [p, 172], 2, 'k', 0));
    f.push(...line([28, p], [172, p], 2, 'k', 0));
  }
  f.push(...ellipse(76.6, 76.6, 11, 11, 'b', 0, 14), ...ellipse(123.2, 100, 11, 11, 'w', 0, 14), ...ellipse(100, 123.2, 11, 11, 'b', 0, 14), ...ellipse(76.6, 123.2, 11, 11, 'w', 0, 14), ...ellipse(123.2, 146.5, 11, 11, 'b', 0, 14), ...ellipse(146.5, 76.6, 11, 11, 'w', 0, 14));
  return { id: 'go-tahtasi', name: 'Go Tahtası', tags: ['go', 'tahta', 'alphago', 'oyun', 'strateji', 'lee sedol'], size: [200, 200],
    palette: { a: '#d8b072', k: '#5a3c1c', b: '#252833', w: '#f6f3ea' }, roles: { a: 'ana', k: 'koyu', b: 'koyu', w: 'acik' }, facets: f };
})());

add('yapay-zeka', (() => {
  const f = [];
  f.push(...line([100, 34], [100, 14], 4, 'd'));
  f.push(...ellipse(100, 12, 8, 8, 'e', 0, 8));
  f.push(...poly([[44, 44], [156, 44], [164, 56], [164, 148], [156, 160], [44, 160], [36, 148], [36, 56]], 'a', 0.05));
  f.push(...poly([[52, 60], [148, 60], [148, 144], [52, 144]], 'b', 0));
  f.push(...ellipse(76, 92, 15, 15, 'c', 0, 12), ...ellipse(124, 92, 15, 15, 'c', 0, 12));
  f.push(...ellipse(78, 92, 7, 7, 'e', 0, 8), ...ellipse(126, 92, 7, 7, 'e', 0, 8));
  for (let i = 0; i < 5; i++) f.push(...rect(66 + i * 14, 120, 10, 14, 'e', 0.05));
  f.push(...rect(22, 84, 14, 36, 'd', 0), ...rect(164, 84, 14, 36, 'd', 0));
  f.push(...rect(86, 160, 28, 22, 'd', 0));
  return { id: 'robot-kafa', name: 'Robot Kafası (sohbet botu)', tags: ['robot', 'yapay zekâ', 'sohbet', 'chatgpt', 'asistan', 'bot'], size: [200, 200],
    palette: { a: '#8ea2c8', b: '#1f2740', c: '#2b3a67', d: '#5d6f99', e: '#6fe0d0' }, roles: { a: 'ana', b: 'koyu', c: 'koyu', d: 'ikincil', e: 'vurgu' }, facets: f };
})());

// ═══════════════════════════════════════════════════════════ İNTERNET
add('internet', (() => {
  const f = [];
  f.push(...rect(20, 54, 160, 100, 'a', 0));
  f.push(...poly([[20, 54], [180, 54], [100, 118]], 'b', -0.06)); // kapak
  f.push(...poly([[20, 154], [100, 100], [180, 154]], 'a', 0.1));
  f.push(...ellipse(150, 140, 22, 22, 'c', 0, 14)); // @ rozeti
  f.push(...ellipse(150, 140, 14, 14, 'a', 0, 14));
  f.push(...ellipse(150, 140, 7, 7, 'c', 0, 10));
  return { id: 'eposta-zarf', name: 'E-posta Zarfı (@)', tags: ['e-posta', 'mektup', 'zarf', 'mesaj', 'tomlinson', 'iletişim'], size: [200, 200],
    palette: { a: '#f4f1ea', b: '#c9d3ea', c: '#e2557a' }, roles: { a: 'acik', b: 'ikincil', c: 'vurgu' }, facets: f };
})());

add('internet', (() => {
  const f = [];
  const N = [[100, 100], [40, 44], [160, 46], [34, 148], [164, 150], [100, 18], [100, 184]];
  const link = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 5], [2, 5], [3, 6], [4, 6], [1, 3], [2, 4]];
  for (const [i, j] of link) f.push(...line(N[i], N[j], 3, 'd', 0.05));
  N.forEach(([x, y], i) => {
    f.push(...ellipse(x, y, i === 0 ? 20 : 12, i === 0 ? 20 : 12, i === 0 ? 'b' : 'a', 0, 12));
    f.push(...ellipse(x, y, i === 0 ? 9 : 5, i === 0 ? 9 : 5, 'c', 0, 8));
  });
  return { id: 'ag-dugumleri', name: 'Ağ Düğümleri', tags: ['ağ', 'internet', 'bağlantı', 'arpanet', 'tcp/ip', 'düğüm'], size: [200, 200],
    palette: { a: '#4aa3df', b: '#e2557a', c: '#f4f1ea', d: '#8fb8de' }, roles: { a: 'ana', b: 'vurgu', c: 'acik', d: 'ikincil' }, facets: f };
})());

// ═══════════════════════════════════════════════════════════ HAVACILIK
add('havacilik', (() => {
  // Wright Flyer (yan görünüm, çift kanat)
  const f = [];
  f.push(...poly([[16, 70], [178, 62], [180, 72], [18, 80]], 'a', 0.08)); // üst kanat
  f.push(...poly([[22, 128], [172, 124], [174, 134], [24, 138]], 'a', -0.1)); // alt kanat
  for (const x of [44, 84, 124, 160]) f.push(...rect(x, 76, 3.4, 52, 'd', 0));
  f.push(...line([28, 76], [166, 130], 1.8, 'd', 0));
  f.push(...line([166, 76], [30, 132], 1.8, 'd', 0));
  f.push(...rect(100, 98, 10, 22, 'c', 0)); // motor
  f.push(...poly([[176, 90], [196, 94], [196, 114], [176, 110]], 'a', 0.05)); // kuyruk
  f.push(...poly([[2, 86], [14, 80], [14, 118], [2, 112]], 'a', -0.05)); // ön dümen
  f.push(...ellipse(104, 82, 6, 6, 'e', 0, 8)); // pilot
  f.push(...line([30, 144], [166, 144], 3, 'd'), ...line([60, 134], [60, 144], 2, 'd'), ...line([130, 134], [130, 144], 2, 'd'));
  f.push(...ellipse(120, 109, 5, 24, 'd', 0, 8)); // pervane
  return { id: 'wright-flyer', name: 'Wright Flyer (1903)', tags: ['uçak', 'wright', 'ilk uçuş', 'çift kanat', 'havacılık', '1903'], size: [200, 200],
    palette: { a: '#e9d9b0', c: '#7a5a3a', d: '#8a6a45', e: '#e2557a' }, roles: { a: 'acik', c: 'koyu', d: 'ikincil', e: 'vurgu' }, facets: f };
})());

add('havacilik', (() => {
  // tek kanatlı erken uçak (Blériot / Spirit of St. Louis)
  const f = [];
  f.push(...poly([[20, 100], [150, 84], [196, 104], [150, 120], [30, 116]], 'a', 0.08)); // gövde
  f.push(...poly([[60, 92], [118, 86], [128, 100], [62, 106]], 'b', 0.1)); // kanat (üstten gelen)
  f.push(...poly([[56, 100], [132, 98], [140, 108], [58, 112]], 'b', -0.1));
  f.push(...poly([[176, 104], [196, 80], [200, 108]], 'a', 0.1)); // dikey kuyruk
  f.push(...poly([[168, 110], [198, 112], [196, 120], [166, 118]], 'a', -0.1));
  f.push(...ellipse(98, 92, 9, 7, 'c', 0, 8)); // kokpit
  f.push(...ellipse(16, 100, 6, 6, 'd', 0, 8)); // pervane göbeği
  f.push(...poly([[12, 70], [20, 70], [20, 130], [12, 130]], 'd', 0.1)); // pervane
  f.push(...line([88, 118], [84, 148], 3, 'd'), ...line([120, 118], [124, 148], 3, 'd'));
  f.push(...ellipse(84, 152, 10, 10, 'd', 0, 8), ...ellipse(124, 152, 10, 10, 'd', 0, 8));
  return { id: 'tek-kanat-ucak', name: 'Tek Kanatlı Erken Uçak', tags: ['uçak', 'blériot', 'lindbergh', 'manş', 'atlantik', 'havacılık', 'tek kanat'], size: [200, 200],
    palette: { a: '#e7d6a6', b: '#f4efe0', c: '#5a7a96', d: '#4a4f5c' }, roles: { a: 'ana', b: 'acik', c: 'vurgu', d: 'koyu' },
    variants: { spirit: { name: 'Spirit of St. Louis (gümüş)', palette: { a: '#c9d3e0', b: '#e9eef5', c: '#e2557a', d: '#4a4f5c' } } }, facets: f };
})());

add('havacilik', (() => {
  // erken jet (yan görünüm, ok kanat)
  const f = [];
  f.push(...poly([[8, 104], [60, 88], [170, 88], [196, 100], [170, 112], [60, 116]], 'a', 0.08)); // gövde
  f.push(...poly([[60, 116], [150, 112], [112, 156], [88, 156]], 'b', -0.12)); // kanat
  f.push(...poly([[160, 90], [188, 56], [198, 56], [186, 92]], 'a', 0.1)); // kuyruk
  f.push(...ellipse(54, 98, 20, 8, 'c', 0, 10)); // kokpit camı
  f.push(...ellipse(150, 106, 14, 9, 'd', 0, 10)); // egzoz
  f.push(...ellipse(194, 104, 6, 5, 'e', 0, 8)); // alev
  return { id: 'jet-ucagi', name: 'Jet Uçağı', tags: ['jet', 'uçak', 'heinkel', 'türbin', 'havacılık', '1939'], size: [200, 200],
    palette: { a: '#b8c3d6', b: '#8a97b8', c: '#4aa3df', d: '#4a4f5c', e: '#f2a35a' }, roles: { a: 'ana', b: 'ikincil', c: 'vurgu', d: 'koyu', e: 'vurgu' }, facets: f };
})());

add('havacilik', (() => {
  // Bell X-1: turuncu roket uçağı
  const f = [];
  f.push(...ellipse(100, 100, 92, 26, 'a', 0, 24));
  f.push(...poly([[8, 100], [40, 90], [40, 110]], 'a', 0.1)); // burun
  f.push(...ellipse(60, 96, 20, 9, 'c', 0, 10)); // kokpit
  f.push(...poly([[96, 100], [128, 100], [112, 140], [100, 140]], 'b', -0.1)); // kısa kanat
  f.push(...poly([[168, 98], [192, 70], [198, 72], [190, 102]], 'a', 0.1)); // kuyruk
  f.push(...poly([[176, 104], [198, 104], [198, 112], [176, 108]], 'b', 0));
  f.push(...rect(112, 94, 38, 4, 'd', 0.1));
  return { id: 'bell-x1', name: 'Bell X-1 (roket uçak)', tags: ['x-1', 'yeager', 'ses duvarı', 'roket uçak', 'havacılık', '1947'], size: [200, 200],
    palette: { a: '#f2a35a', b: '#d9782c', c: '#8fb8de', d: '#ffffff' }, roles: { a: 'ana', b: 'koyu', c: 'vurgu', d: 'acik' }, facets: f };
})());

// ─────────────────────────────────────────────────────────── yaz
for (const { kategori, ...a } of out) {
  const dir = path.join(LIB, kategori);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
}
console.log(`ok — ${out.length} model: ${out.map((a) => `${a.kategori}/${a.id}`).join(', ')}`);
