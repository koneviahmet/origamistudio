// Hikâye 4 — EJDERHA VE KÜÇÜK ŞÖVALYE: tatlı ejderha, şövalye, kale, kayalık, mağara, alev, hazine, çizgi roman sayfa çerçeveleri.
import { F, ekle, elips, kure, hilal, yumusat, dagBandi, boru, egri, bulutSekli, mix, clamp, rng } from './kit.mjs';
import { DUZEN, DUZEN_YATAY, SAYFA, SAYFA_YATAY } from './panel-duzen.mjs';

const K = 'hikaye-ejderha';

// ── ejderha ─────────────────────────────────────────────────────────────
{
  const f = [];
  const kanat = (sx, sy, uc, part, acik) => {
    const [A, B, C] = uc;
    const m1 = [mix(A[0], B[0], 0.5) + 4, mix(A[1], B[1], 0.5) + 70];
    const m2 = [mix(B[0], C[0], 0.5) - 4, mix(B[1], C[1], 0.5) + 74];
    const S = [sx, sy]; const E = [sx + 52, sy - 8];
    const ek = { part };
    const [c1, c2, c3] = acik ? ['w', 'w', 'q'] : ['v', 'v', 'q'];
    f.push(F([S, A, m1], c1, 0.16, ek)); f.push(F([S, m1, B], c2, 0.02, ek)); f.push(F([S, B, m2], c1, -0.1, ek)); f.push(F([S, m2, C], c2, -0.2, ek)); f.push(F([S, C, E], c3, -0.26, ek));
    [A, B, C].forEach((p, i) => {
      const dx = p[0] - S[0]; const dy = p[1] - S[1]; const m = Math.hypot(dx, dy); const nx = -dy / m * 3.4; const ny = dx / m * 3.4;
      f.push(F([[S[0] + nx * 0.5, S[1] + ny * 0.5], [p[0] + nx * 0.2, p[1] + ny * 0.2], [p[0] - nx * 0.2, p[1] - ny * 0.2], [S[0] - nx * 0.5, S[1] - ny * 0.5]], 'd', 0, ek));
    });
  };
  // uzak kanat
  kanat(206, 178, [[118, 78], [170, 30], [236, 52]], 'kanatArka', false);
  // kuyruk
  const kuyrukYol = egri([[156, 262], [100, 308], [38, 304], [20, 230]], 16);
  f.push(F(boru(kuyrukYol, (t) => mix(30, 5, t)), 'a', -0.04, { part: 'kuyruk' }));
  f.push(F(boru(kuyrukYol.map(([x, y]) => [x - 2, y - 5]), (t) => mix(20, 3, t), 1), 'a', 0.14, { part: 'kuyruk' }));
  for (let i = 1; i < kuyrukYol.length - 2; i += 2) { const [x, y] = kuyrukYol[i]; const g = mix(30, 5, i / 16); f.push(F([[x - 7, y - g + 2], [x, y - g - 14 + i * 0.4], [x + 7, y - g + 4]], 'k', i % 4 ? 0.0 : 0.1, { part: 'kuyruk' })); }
  f.push(F([[20, 232], [4, 206], [20, 190], [36, 206]], 'k', 0.05, { part: 'kuyruk' }));
  f.push(F([[20, 232], [36, 206], [20, 190]], 'k', -0.18, { part: 'kuyruk' }));
  // arka bacak (uzak) ve gövde
  f.push(F(elips(176, 300, 26, 30, 16), 'b', -0.1));
  f.push(F(elips(232, 236, 100, 78, 36), 'a', 0.0));
  f.push(F(hilal(232, 236, 100, 78, -40, 120, -22, -14, 18), 'b', -0.2));
  f.push(F(elips(206, 188, 60, 22, 16), 'a', 0.16));
  // karın
  f.push(F(yumusat([[188, 228], [250, 214], [300, 232], [312, 268], [270, 304], [214, 304], [180, 272]], 4, true), 'c', 0.04));
  for (let i = 0; i < 5; i++) f.push(F([[196 + i * 2, 238 + i * 14], [302 - i * 4, 242 + i * 13], [300 - i * 4, 247 + i * 13], [196 + i * 2, 243 + i * 14]], 'b', -0.1));
  // arka bacak (yakın), ön bacak
  f.push(F(elips(166, 292, 34, 32, 18), 'a', 0.06));
  f.push(F(hilal(166, 292, 34, 32, -30, 150, -8, -6, 12), 'b', -0.18));
  f.push(F([[130, 318], [200, 318], [206, 338], [194, 346], [176, 340], [162, 348], [146, 340], [128, 346], [122, 332]], 'a', 0.0));
  [140, 166, 192].forEach((x) => f.push(F([[x - 4, 336], [x + 4, 336], [x, 352]], 'h', 0.1)));
  f.push(F(elips(284, 290, 24, 26, 16), 'a', 0.0));
  f.push(F([[262, 308], [312, 308], [316, 330], [304, 338], [288, 330], [274, 340], [260, 332]], 'a', -0.06));
  [272, 290, 306].forEach((x) => f.push(F([[x - 3.6, 328], [x + 3.6, 328], [x, 344]], 'h', 0.1)));
  // sırt dikenleri
  [[168, 178], [196, 164], [224, 160], [252, 164], [276, 176]].forEach(([x, y], i) => f.push(F([[x - 12, y + 18], [x, y - 8 - (i % 2) * 3], [x + 12, y + 16]], 'k', i % 2 ? -0.05 : 0.08)));
  // boyun
  const boyun = egri([[286, 218], [320, 206], [316, 150], [342, 108]], 14);
  f.push(F(boru(boyun, (t) => mix(44, 34, t)), 'a', 0.0));
  f.push(F(boru(boyun.map(([x, y]) => [x + 10, y + 2]), (t) => mix(22, 22, t), -1), 'c', 0.05));
  f.push(F(boru(boyun.map(([x, y]) => [x - 4, y - 3]), (t) => mix(26, 20, t), 1), 'a', 0.14));
  for (let i = 1; i < boyun.length - 3; i += 3) { const [x, y] = boyun[i]; f.push(F([[x - 22, y - 8], [x - 38, y - 18 - i * 0.5], [x - 20, y + 8]], 'k', 0.0)); }
  // yakın kanat
  kanat(236, 172, [[184, 34], [270, -4], [352, 42]], 'kanatOn', true);
  // boynuzlar (başın arkasında)
  f.push(F([[336, 66], [312, 20], [350, 58]], 'h', 0.1));
  f.push(F([[356, 60], [346, 10], [376, 54]], 'h', -0.1));
  f.push(F([[336, 66], [312, 20], [326, 52]], 'k', -0.1));
  // kafa
  f.push(F(elips(358, 98, 46, 44, 24), 'a', 0.04));
  f.push(F(hilal(358, 98, 46, 44, -50, 130, -12, -8, 14), 'b', -0.16));
  f.push(F(yumusat([[368, 88], [412, 88], [442, 104], [440, 126], [412, 138], [370, 134]], 4, true), 'a', 0.12));
  f.push(F(yumusat([[372, 120], [420, 122], [440, 128], [436, 138], [404, 146], [372, 138]], 4, true), 'c', 0.0));
  f.push(F([[374, 130], [434, 128], [420, 134], [376, 138]], 'd', 0));
  f.push(F(elips(418, 100, 3.6, 2.6, 8), 'd', 0)); f.push(F(elips(430, 106, 3, 2.2, 8), 'd', 0));
  f.push(F(elips(386, 112, 9, 5.5, 10), 'p', 0.05));
  // göz
  f.push(F(elips(368, 84, 13, 15, 16), 'x', 0));
  f.push(F(elips(371, 85, 8, 10.5, 14), 'e', 0));
  f.push(F(elips(372, 86, 4.6, 6, 10), 'd', 0));
  f.push(F(elips(369, 81, 2.8, 3, 8), 'x', 0.4));
  f.push(F([[352, 66], [372, 62], [386, 70], [372, 69]], 'k', -0.1));
  ekle(K, {
    id: 'ej-ejderha', name: 'Tatlı Ejderha', tags: ['ejderha', 'hayvan', 'fantastik', 'hikaye', 'karakter'], size: [460, 360],
    palette: { a: '#5cb88a', b: '#3f8f6a', c: '#d9efb0', d: '#2a3a3a', k: '#f08a4b', h: '#f6e6b8', w: '#f4b4a0', v: '#c9806f', q: '#8a4f4f', e: '#ffcf4a', x: '#ffffff', p: '#f2a1a1' },
    parts: { kanatOn: { pivot: [232, 172] }, kanatArka: { pivot: [204, 176] }, kuyruk: { pivot: [156, 262] } },
    variants: { mor: { name: 'Mor', palette: { a: '#9a73d6', b: '#7550b0', c: '#f0e3ff', k: '#ff9ac2', w: '#ffc2e0', v: '#d98ab8' } }, kirmizi: { name: 'Kırmızı', palette: { a: '#e0584a', b: '#b03a36', c: '#ffe3b0', k: '#ffb347', w: '#ffd0a0', v: '#e08a6a' } }, gece: { name: 'Gece', palette: { a: '#3f7f86', b: '#2b5a62', c: '#a9d8d0', k: '#c9826e', w: '#8a7ab0', v: '#5f5388' } } },
    facets: f,
  });
}

// ── küçük şövalye ───────────────────────────────────────────────────────
{
  const f = [];
  const pel = { part: 'pelerin' };
  f.push(F([[34, 100], [8, 150], [0, 214], [44, 206], [58, 120]], 'r', -0.18, pel));
  f.push(F([[34, 100], [8, 150], [20, 160], [44, 112]], 'r', -0.04, pel));
  f.push(F([[30, 206], [50, 206], [50, 238], [24, 238], [24, 226]], 'd', 0));
  f.push(F([[60, 206], [80, 206], [88, 228], [88, 238], [60, 238]], 'd', 0.06));
  f.push(F([[30, 178], [50, 178], [50, 210], [30, 210]], 'm', 0.12)); f.push(F([[60, 178], [80, 178], [80, 210], [60, 210]], 'm', -0.1));
  f.push(F([[30, 102], [82, 102], [92, 196], [20, 196]], 'r', 0));
  f.push(F([[30, 102], [56, 102], [56, 196], [20, 196]], 'r', 0.16));
  f.push(F([[56, 102], [82, 102], [92, 196], [56, 196]], 'r', -0.18));
  f.push(F([[24, 150], [88, 150], [90, 162], [22, 162]], 'k', 0.04)); f.push(F([[50, 148], [62, 148], [62, 164], [50, 164]], 'y', 0.12));
  f.push(F([[28, 88], [84, 88], [88, 118], [24, 118]], 'm', 0.06)); f.push(F([[28, 88], [54, 88], [54, 118], [24, 118]], 'm', 0.2));
  f.push(F(elips(56, 150, 2.4, 2.4, 6), 'y', 0.3));
  // kalkan (sol kol)
  f.push(...kure(22, 150, 22, 'm', { golge: -0.2 }));
  f.push(F(elips(22, 150, 14, 14, 16), 'r', 0.04));
  f.push(F([[22, 138], [26, 148], [36, 150], [28, 156], [30, 166], [22, 160], [14, 166], [16, 156], [8, 150], [18, 148]], 'y', 0.12));
  // kılıç kolu (sağ)
  f.push(F([[78, 108], [92, 100], [108, 70], [118, 72], [106, 112], [86, 124]], 'm', -0.12, { part: 'kilic' }));
  f.push(F([[110, 66], [116, 66], [118, 8], [113, -4], [108, 8]], 'x', 0.2, { part: 'kilic' }));
  f.push(F([[113, -4], [118, 8], [116, 66], [113, 66]], 'm', -0.2, { part: 'kilic' }));
  f.push(F([[100, 68], [126, 68], [126, 74], [100, 74]], 'y', 0.1, { part: 'kilic' }));
  f.push(F([[110, 74], [116, 74], [116, 90], [110, 90]], 'k', 0, { part: 'kilic' }));
  f.push(...kure(113, 94, 7, 'm', { parca: 'kilic' }));
  // kask
  f.push(...kure(56, 62, 30, 'm', { golge: -0.24 }));
  f.push(F([[30, 70], [82, 70], [82, 84], [30, 84]], 'm', -0.1));
  f.push(F([[34, 66], [78, 66], [80, 74], [32, 74]], 'd', 0));
  f.push(F(elips(46, 70, 3.2, 2.4, 8), 'x', 0.3)); f.push(F(elips(66, 70, 3.2, 2.4, 8), 'x', 0.3));
  f.push(F([[54, 32], [58, 32], [58, 66], [54, 66]], 'm', -0.2));
  // tüy
  f.push(F([[52, 34], [36, 14], [20, 22], [30, 36], [16, 48], [34, 48], [50, 40]], 'r', 0.1, { part: 'tuy' }));
  f.push(F([[52, 34], [34, 18], [28, 30], [44, 40]], 'r', -0.14, { part: 'tuy' }));
  ekle(K, {
    id: 'ej-sovalye', name: 'Küçük Şövalye', tags: ['şövalye', 'karakter', 'fantastik', 'hikaye'], size: [130, 242],
    palette: { m: '#aab4c8', r: '#d94a4a', d: '#2f2b3a', k: '#7a4a2e', y: '#f2c14e', x: '#ffffff' },
    parts: { pelerin: { pivot: [34, 102] }, kilic: { pivot: [90, 108] }, tuy: { pivot: [52, 34] } },
    variants: { mavi: { name: 'Mavi', palette: { r: '#3d7fc4' } }, altin: { name: 'Altın', palette: { m: '#e8c868', r: '#8a2f4a' } } },
    facets: f,
  });
}

// ── kale ────────────────────────────────────────────────────────────────
{
  const f = [];
  const kule = (x0, x1, yUst, yAlt, roofC, bayrak, kosk = true) => {
    const xm = (x0 + x1) / 2;
    f.push(F([[x0, yUst], [xm, yUst], [xm, yAlt], [x0, yAlt]], 'a', 0.16));
    f.push(F([[xm, yUst], [x1, yUst], [x1, yAlt], [xm, yAlt]], 'a', -0.18));
    for (let y = yUst + 36; y < yAlt - 10; y += 34) f.push(F([[x0, y], [x1, y], [x1, y + 2.4], [x0, y + 2.4]], 'b', -0.2));
    for (let i = 0; i < 4; i++) f.push(F([[x0 + i * ((x1 - x0) / 4) + 3, yUst - 20], [x0 + (i + 0.62) * ((x1 - x0) / 4), yUst - 20], [x0 + (i + 0.62) * ((x1 - x0) / 4), yUst], [x0 + i * ((x1 - x0) / 4) + 3, yUst]], 'a', i % 2 ? -0.1 : 0.1));
    // pencere
    f.push(F([[xm - 8, yUst + 50], [xm + 8, yUst + 50], [xm + 8, yUst + 80], [xm - 8, yUst + 80]], 'd', 0));
    f.push(F(elips(xm, yUst + 50, 8, 9, 8, 180, 360), 'd', 0));
    f.push(F([[xm - 5, yUst + 52], [xm + 5, yUst + 52], [xm + 5, yUst + 78], [xm - 5, yUst + 78]], 'g', 0.15));
    // çatı
    f.push(F([[x0 - 12, yUst - 20], [xm, yUst - 20 - (x1 - x0) * 1.0], [xm, yUst - 20]], roofC, 0.16));
    f.push(F([[xm, yUst - 20 - (x1 - x0) * 1.0], [x1 + 12, yUst - 20], [xm, yUst - 20]], roofC, -0.2));
    f.push(F([[xm - 1.6, yUst - 20 - (x1 - x0) * 1.0 - 38], [xm + 1.6, yUst - 20 - (x1 - x0) * 1.0 - 38], [xm + 1.6, yUst - 20 - (x1 - x0) * 1.0], [xm - 1.6, yUst - 20 - (x1 - x0) * 1.0]], 'd', 0));
    f.push(F([[xm + 1.6, yUst - 20 - (x1 - x0) * 1.0 - 38], [xm + 40, yUst - 20 - (x1 - x0) * 1.0 - 28], [xm + 1.6, yUst - 20 - (x1 - x0) * 1.0 - 18]], 'y', 0.1, { part: bayrak }));
  };
  // ana bina
  f.push(F([[150, 250], [370, 250], [370, 540], [150, 540]], 'a', 0));
  f.push(F([[150, 250], [260, 250], [260, 540], [150, 540]], 'a', 0.16));
  f.push(F([[260, 250], [370, 250], [370, 540], [260, 540]], 'a', -0.14));
  for (let y = 280; y < 530; y += 32) { f.push(F([[150, y], [370, y], [370, y + 2.4], [150, y + 2.4]], 'b', -0.2)); for (let x = (y / 32) % 2 ? 190 : 170; x < 370; x += 44) f.push(F([[x, y], [x + 2.4, y], [x + 2.4, y + 32], [x, y + 32]], 'b', -0.2)); }
  for (let i = 0; i < 8; i++) f.push(F([[150 + i * 30 + 2, 226], [150 + i * 30 + 20, 226], [150 + i * 30 + 20, 250], [150 + i * 30 + 2, 250]], 'a', i % 2 ? -0.12 : 0.1));
  kule(60, 150, 190, 540, 'r', 'bayrak1');
  kule(370, 460, 160, 540, 'z', 'bayrak2');
  // orta kule
  f.push(F([[212, 150], [308, 150], [308, 250], [212, 250]], 'a', 0));
  f.push(F([[212, 150], [260, 150], [260, 250], [212, 250]], 'a', 0.16)); f.push(F([[260, 150], [308, 150], [308, 250], [260, 250]], 'a', -0.16));
  f.push(F([[204, 150], [260, 84], [316, 150]], 'r', 0.1)); f.push(F([[260, 84], [316, 150], [260, 150]], 'r', -0.22));
  f.push(F([[256, 84], [264, 84], [264, 60], [256, 60]], 'd', 0));
  // kapı
  f.push(F([[222, 540], [222, 470], ...elips(260, 470, 38, 38, 12, 180, 360), [298, 470], [298, 540]], 'd', 0));
  for (let i = 0; i < 5; i++) f.push(F([[229 + i * 15, 470], [232 + i * 15, 470], [232 + i * 15, 540], [229 + i * 15, 540]], 'k', 0.1));
  // pencereler (ışıklı)
  [[180, 330], [310, 330], [180, 420], [310, 420]].forEach(([x, y]) => { f.push(F([[x - 12, y + 40], [x - 12, y], ...elips(x, y, 12, 14, 8, 180, 360), [x + 12, y + 40]], 'd', 0)); f.push(F([[x - 8, y + 38], [x - 8, y], ...elips(x, y, 8, 10, 8, 180, 360), [x + 8, y + 38]], 'g', 0.15)); f.push(F([[x - 1, y - 10], [x + 1, y - 10], [x + 1, y + 38], [x - 1, y + 38]], 'd', 0)); });
  // meşaleler
  [200, 320].forEach((x) => { f.push(F([[x - 2, 500], [x + 2, 500], [x + 2, 520], [x - 2, 520]], 'k', 0)); f.push(F([[x, 482], [x + 6, 498], [x, 502], [x - 6, 498]], 'o', 0.1)); f.push(F([[x, 488], [x + 3, 498], [x - 3, 498]], 'g', 0.3)); });
  ekle(K, {
    id: 'ej-kale', name: 'Dağ Kalesi', tags: ['kale', 'bina', 'fantastik', 'hikaye'], size: [520, 548],
    palette: { a: '#cdc8dc', b: '#9893b0', r: '#4a6fb5', z: '#c04a5a', d: '#2a2638', g: '#ffd27a', y: '#f2c14e', k: '#7a4a2e', o: '#f08a3c' },
    parts: { bayrak1: { pivot: [105, 132] }, bayrak2: { pivot: [415, 102] } },
    variants: { gece: { name: 'Gece', palette: { a: '#8f90b8', b: '#656890', r: '#2f4a85', z: '#80344a', d: '#171428' } }, gun: { name: 'Gün batımı', palette: { a: '#e6c4c0', b: '#b88f9a', r: '#7a5ab0', z: '#d4584a' } } },
    facets: f,
  });
}

// ── kayalık / uçurum ────────────────────────────────────────────────────
ekle(K, {
  id: 'ej-kaya', name: 'Kale Uçurumu', tags: ['kaya', 'uçurum', 'dağ', 'hikaye'], size: [760, 340],
  palette: { a: '#a9a0b8', b: '#7c7292', c: '#574f6e', g: '#78b05a' },
  variants: { gece: { name: 'Gece', palette: { a: '#5f5f8c', b: '#45456f', c: '#2e2e50', g: '#3f6a52' } } },
  facets: dagBandi({ w: 760, h: 340, tepe: [[0.5, 0.88, 0.2], [0.18, 0.5, 0.12], [0.86, 0.56, 0.12]], seed: 61, satir: 6, kolon: 17, anahtar: ['a', 'b', 'c'], kar: 'g', jit: 0.36, gain: 1.25 }),
});

// ── mağara ──────────────────────────────────────────────────────────────
{
  const f = dagBandi({ w: 420, h: 320, tepe: [[0.5, 0.95, 0.3]], seed: 71, satir: 5, kolon: 12, anahtar: ['a', 'b', 'c'], jit: 0.34, gain: 1.2, kenarAlcak: true });
  f.push(F([[120, 320], [120, 190], ...elips(210, 190, 90, 80, 14, 180, 360), [300, 190], [300, 320]], 'd', 0));
  f.push(F([[140, 320], [140, 200], ...elips(210, 200, 70, 62, 12, 180, 360), [280, 200], [280, 320]], 'n', 0));
  f.push(F([[160, 320], [160, 214], ...elips(210, 214, 50, 46, 10, 180, 360), [260, 214], [260, 320]], 'm', 0));
  [[170, 300, 10], [198, 308, 8], [226, 298, 10], [248, 306, 8], [214, 292, 7]].forEach(([x, y, r]) => { f.push(F(elips(x, y, r, r * 0.4, 10), 'y', 0.05)); f.push(F(elips(x - 2, y - 1, r * 0.4, r * 0.15, 8), 'x', 0.3)); });
  for (let i = 0; i < 6; i++) f.push(F([[134 + i * 30, 184 + (i % 2) * 6], [146 + i * 30, 184 + (i % 2) * 6], [140 + i * 30, 214 + (i % 3) * 8]], 'b', -0.1));
  ekle(K, { id: 'ej-magara', name: 'Hazine Mağarası', tags: ['mağara', 'kaya', 'hazine', 'hikaye'], size: [420, 324], palette: { a: '#9c92ac', b: '#72688a', c: '#4e4766', d: '#1a1428', n: '#3a2a3e', m: '#8a5a3a', y: '#f2c14e', x: '#fff3b0' }, variants: { gece: { name: 'Gece', palette: { a: '#5a5a86', b: '#43436a', c: '#2d2d4c' } } }, facets: f });
}

// ── alev ────────────────────────────────────────────────────────────────
{
  const f = [];
  const temel = [[80, 224], [34, 186], [26, 134], [52, 98], [46, 54], [78, 4], [98, 58], [124, 98], [132, 150], [120, 198]];
  const alev = (c, k, s, part) => f.push(F(yumusat(temel.map(([x, y]) => [80 + (x - 80) * k, 224 + (y - 224) * k]), 4, true), c, s, { part }));
  alev('a', 1, 0, 'dis'); alev('b', 0.72, 0.05, 'orta'); alev('c', 0.44, 0.1, 'ic');
  ekle(K, { id: 'ej-alev', name: 'Alev', tags: ['ateş', 'alev', 'ejderha', 'hikaye'], size: [160, 230], palette: { a: '#e8503a', b: '#ff9a3c', c: '#ffe27a' }, parts: { dis: { pivot: [80, 224] }, orta: { pivot: [80, 224] }, ic: { pivot: [80, 224] } }, variants: { mavi: { name: 'Mavi', palette: { a: '#3a7fe8', b: '#5fb8ff', c: '#d8f4ff' } } }, facets: f });
}

// ── hazine ──────────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[30, 100], [250, 100], [262, 60], [18, 60]], 'k', -0.1)); // kapak (açık, arkada)
  f.push(F([[30, 100], [250, 100], [250, 106], [30, 106]], 'm', 0.1));
  f.push(F([[20, 110], [260, 110], [256, 190], [24, 190]], 'k', 0)); f.push(F([[20, 110], [140, 110], [140, 190], [24, 190]], 'k', 0.16)); f.push(F([[140, 110], [260, 110], [256, 190], [140, 190]], 'k', -0.18));
  [58, 140, 222].forEach((x) => f.push(F([[x - 8, 110], [x + 8, 110], [x + 8, 190], [x - 8, 190]], 'm', 0.05)));
  f.push(F([[20, 108], [260, 108], [260, 118], [20, 118]], 'm', 0.12));
  f.push(F([[130, 118], [150, 118], [148, 142], [132, 142]], 'y', 0.12)); f.push(F(elips(140, 130, 2.4, 3, 6), 'd', 0));
  // altın yığını
  const R = rng(5);
  f.push(F([[30, 112], [60, 78], [100, 62], [140, 52], [186, 62], [222, 80], [252, 112]], 'y', 0.0));
  for (let i = 0; i < 26; i++) { const x = 40 + R() * 200; const y = 62 + R() * 46 + (Math.abs(x - 140) / 120) * 18; const r = 9 + R() * 6; f.push(F(elips(x, y, r, r * 0.85, 10), 'y', 0.08 + R() * 0.12)); f.push(F(elips(x - r * 0.2, y - r * 0.2, r * 0.5, r * 0.35, 8), 'x', 0.2)); }
  // mücevherler
  f.push(F([[96, 52], [112, 40], [128, 52], [112, 72]], 'g1', 0.14)); f.push(F([[112, 40], [128, 52], [112, 72]], 'g1', -0.2));
  f.push(F([[178, 56], [192, 46], [206, 56], [192, 74]], 'g2', 0.14)); f.push(F([[192, 46], [206, 56], [192, 74]], 'g2', -0.2));
  ekle(K, { id: 'ej-hazine', name: 'Hazine Sandığı', tags: ['hazine', 'sandık', 'altın', 'hikaye'], size: [280, 200], palette: { k: '#8a4f2e', m: '#d8b04a', y: '#f2c14e', x: '#fff3b0', d: '#2a1d1a', g1: '#e8503a', g2: '#3ab0e8' }, facets: f });
}

// ── çizgi roman sayfa çerçeveleri ───────────────────────────────────────
const SAYFALAR = [...Object.entries(DUZEN).map(([ad, p]) => [ad, p, SAYFA, '']), ...Object.entries(DUZEN_YATAY).map(([ad, p]) => [`yatay-${ad}`, p, SAYFA_YATAY, ' – yatay'])];
for (const [ad, paneller, { W, H }, ek] of SAYFALAR) {
  const xs = [...new Set([0, W, ...paneller.flatMap(([a, , c]) => [a, c])])].sort((a, b) => a - b);
  const ys = [...new Set([0, H, ...paneller.flatMap(([, b, , d]) => [b, d])])].sort((a, b) => a - b);
  const f = [];
  for (let j = 0; j < ys.length - 1; j++) {
    let basla = null;
    for (let i = 0; i <= xs.length - 1; i++) {
      const icinde = i < xs.length - 1 && paneller.some(([a, b, c, d]) => xs[i] >= a && xs[i + 1] <= c && ys[j] >= b && ys[j + 1] <= d);
      if (i < xs.length - 1 && !icinde) { if (basla === null) basla = i; }
      else if (basla !== null) { f.push(F([[xs[basla] - 0.7, ys[j] - 0.7], [xs[i] + 0.7, ys[j] - 0.7], [xs[i] + 0.7, ys[j + 1] + 0.7], [xs[basla] - 0.7, ys[j + 1] + 0.7]], 'p', 0)); basla = null; }
    }
  }
  paneller.forEach(([a, b, c, d]) => {
    const t = 9;
    f.push(F([[a - t, b - t], [c + t, b - t], [c + t, b], [a - t, b]], 'd', 0)); f.push(F([[a - t, d], [c + t, d], [c + t, d + t], [a - t, d + t]], 'd', 0));
    f.push(F([[a - t, b], [a, b], [a, d], [a - t, d]], 'd', 0)); f.push(F([[c, b], [c + t, b], [c + t, d], [c, d]], 'd', 0));
  });
  ekle('cizgi-roman-sayfalari', { id: `ej-sayfa-${ad}`, name: `Çizgi roman sayfası (${ad.replace('yatay-', '')})${ek}`, tags: ['çerçeve', 'panel', 'çizgi roman', 'maske', 'hikaye'], size: [W, H], palette: { p: '#f6ecd6', d: '#241c2e' }, variants: { koyu: { name: 'Koyu', palette: { p: '#2c2440', d: '#0c0814' } } }, facets: f });
}
