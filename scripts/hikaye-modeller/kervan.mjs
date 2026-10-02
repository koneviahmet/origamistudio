// Hikâye 2 — KÜÇÜK KERVAN: yürüyen deve, küçük gezgin, kum tepeleri, piramit, palmiye, vaha, çadır, kaktüs, güneş, kartal, fener.
import { F, ekle, elips, kure, hilal, yumusat, kumBandi, ayna, mix, clamp, rng } from './kit.mjs';
import { YOL, yolMerkez } from './yol.mjs';

const K = 'hikaye-kervan';

// ── kum tepesi bantları ─────────────────────────────────────────────────
[
  ['uzak', { tepe: [[0.18, 0.55, 0.16], [0.6, 0.78, 0.2], [0.95, 0.5, 0.12]], seed: 3 }, { a: '#f6cf9f', b: '#e9b585', c: '#fde6c6' }, { a: '#e8a7a0', b: '#c98aa0', c: '#f6c7b8' }, { a: '#3a4a7a', b: '#2c3a66', c: '#4d5f94' }],
  ['orta', { tepe: [[0.1, 0.6, 0.14], [0.45, 0.88, 0.18], [0.85, 0.7, 0.16]], seed: 8 }, { a: '#f0b66f', b: '#d98f55', c: '#f9d19a' }, { a: '#d98a8e', b: '#a9708f', c: '#efb0a0' }, { a: '#2d3b69', b: '#222e55', c: '#3f5084' }],
  ['yakin', { tepe: [[0.28, 0.9, 0.2], [0.72, 0.62, 0.18], [1.0, 0.8, 0.12]], seed: 12 }, { a: '#e69c52', b: '#c4743a', c: '#f2c07f' }, { a: '#c9707f', b: '#8e5a82', c: '#e0988f' }, { a: '#23305a', b: '#1a2547', c: '#33427a' }],
  ['on', { tepe: [[0.1, 0.5, 0.16], [0.55, 0.95, 0.22], [0.9, 0.55, 0.14]], seed: 17 }, { a: '#cf7e3d', b: '#a95a28', c: '#e8a964' }, { a: '#a95870', b: '#6f4676', c: '#c97c80' }, { a: '#1a2447', b: '#121a36', c: '#27356a' }],
].forEach(([ad, ayar, gun, aksam, gece]) => {
  ekle(K, { id: `kervan-kum-${ad}`, name: `Kum tepesi (${ad})`, tags: ['çöl', 'kum', 'tepe', 'hikaye'], size: [1080, 380], palette: gun, variants: { aksam: { name: 'Akşam', palette: aksam }, gece: { name: 'Gece', palette: gece } }, facets: kumBandi({ w: 1080, h: 380, ...ayar }) });
});

// ── deve ────────────────────────────────────────────────────────────────
{
  const f = [];
  const bacak = (x, y, bukme, c, part, golgeS) => {
    // kalça (x, y) → diz → toynak
    const dz = x + bukme;
    f.push(F([[x - 13, y], [x + 13, y], [dz + 10, y + 44], [dz + 6, y + 82], [dz + 9, y + 94], [dz - 9, y + 94], [dz - 8, y + 80], [dz - 12, y + 44]], c, golgeS, { part }));
    f.push(F([[x + 2, y], [x + 13, y], [dz + 10, y + 44], [dz + 6, y + 82], [dz + 9, y + 94], [dz + 1, y + 94]], 'b', -0.14, { part }));
    f.push(F([[dz - 9, y + 90], [dz + 9, y + 90], [dz + 11, y + 100], [dz - 11, y + 100]], 'd', 0, { part }));
  };
  // uzak bacaklar (arkada)
  bacak(122, 170, -3, 'b', 'bArka2', -0.08);
  bacak(214, 170, 3, 'b', 'bOn2', -0.08);
  // kuyruk
  f.push(F([[66, 134], [48, 150], [42, 182], [54, 156]], 'b', 0, { part: 'kuyruk' }));
  f.push(F([[42, 182], [34, 190], [50, 192]], 'd', 0, { part: 'kuyruk' }));
  // gövde
  const govde = yumusat([[62, 152], [70, 128], [100, 118], [140, 121], [180, 119], [212, 110], [230, 132], [228, 162], [208, 184], [150, 192], [100, 192], [68, 180]], 5, true);
  f.push(F(govde, 'a', 0.02));
  f.push(F([[70, 160], [100, 176], [150, 182], [206, 176], [226, 160], [208, 186], [150, 194], [100, 194], [68, 182]], 'b', -0.2));
  f.push(F([[96, 182], [150, 186], [206, 180], [200, 188], [150, 194], [100, 192]], 'c', 0.1));
  // boyun
  f.push(F(yumusat([[196, 124], [224, 96], [246, 70], [260, 50], [286, 46], [288, 64], [270, 84], [260, 114], [244, 152], [214, 168]], 5), 'a', 0.1));
  f.push(F(yumusat([[262, 60], [280, 56], [270, 84], [258, 114], [244, 152], [230, 160], [246, 112]], 5), 'b', -0.18));
  // hörgüçler
  [[110, 100, 30, 32], [170, 98, 30, 34]].forEach(([x, y, rx, ry]) => {
    f.push(F(yumusat([[x - rx, y + ry], [x - rx * 0.8, y - ry * 0.3], [x - rx * 0.3, y - ry], [x + rx * 0.3, y - ry], [x + rx * 0.8, y - ry * 0.3], [x + rx, y + ry]], 5), 'a', 0.12));
    f.push(F(yumusat([[x + rx * 0.2, y - ry], [x + rx * 0.8, y - ry * 0.3], [x + rx, y + ry], [x + rx * 0.1, y + ry]], 5), 'b', -0.2));
  });
  // battaniye
  f.push(F([[80, 118], [196, 108], [214, 150], [204, 176], [88, 182], [74, 150]], 'r', 0.0));
  f.push(F([[80, 118], [138, 112], [132, 180], [88, 182], [74, 150]], 'r', 0.14));
  f.push(F([[138, 112], [196, 108], [214, 150], [204, 176], [132, 180]], 'r', -0.16));
  f.push(F([[84, 160], [208, 156], [206, 168], [86, 172]], 'm', 0.05));
  f.push(F([[85, 140], [210, 136], [209, 144], [86, 148]], 'y', 0.1));
  for (let i = 0; i < 12; i++) { const x = 90 + i * 10; f.push(F([[x, 178], [x + 8, 178], [x + 4, 190]], 'y', 0.05)); }
  // baş
  f.push(F([[262, 44], [292, 36], [322, 48], [328, 62], [308, 72], [274, 72], [260, 60]], 'a', 0.1));
  f.push(F([[262, 44], [292, 36], [296, 56], [274, 72], [260, 60]], 'a', 0.2));
  f.push(F([[298, 44], [322, 50], [328, 62], [308, 72], [296, 68]], 'c', 0.04));
  f.push(F([[268, 42], [274, 20], [284, 42]], 'b', -0.1));
  f.push(F([[272, 40], [275, 28], [280, 40]], 'y', 0.1));
  f.push(F(elips(289, 53, 5, 5.5, 10), 'd', 0));
  f.push(F(elips(287.5, 51, 1.8, 1.8, 8), 'w', 0.3));
  f.push(F([[283, 46], [279, 41], [282, 45]], 'd', 0));
  f.push(F(elips(321, 58, 2.4, 1.8, 8), 'd', 0));
  f.push(F([[300, 68], [310, 70], [320, 66], [310, 74]], 'd', 0));
  // yük torbaları
  f.push(F(elips(120, 190, 16, 22, 12), 'k', 0.06));
  f.push(F(elips(190, 192, 14, 20, 12), 'k', -0.1));
  f.push(F([[116, 170], [124, 170], [124, 176], [116, 176]], 'd', 0));
  // yakın bacaklar (önde)
  bacak(96, 170, 4, 'a', 'bArka1', 0.04);
  bacak(196, 170, -4, 'a', 'bOn1', 0.04);
  ekle(K, {
    id: 'kervan-deve', name: 'Deve', tags: ['hayvan', 'çöl', 'deve', 'yürüyen', 'hikaye'], size: [340, 276],
    palette: { a: '#c98b52', b: '#9c6a3c', c: '#ecc994', d: '#3a2a22', r: '#c8453b', m: '#2e6f9e', y: '#f2c14e', w: '#ffffff', k: '#d8b98a' },
    parts: { bArka2: { pivot: [122, 170] }, bOn2: { pivot: [214, 170] }, bArka1: { pivot: [96, 170] }, bOn1: { pivot: [196, 170] }, kuyruk: { pivot: [66, 136] } },
    variants: { koyu: { name: 'Koyu', palette: { a: '#a8693a', b: '#7e4d2a', c: '#d3a674' } }, gece: { name: 'Gece', palette: { a: '#6a6a96', b: '#4c4b78', c: '#9a9cc2', r: '#8a3d55', m: '#3a4f7a', y: '#c9a24a', k: '#8f8aa8' } } },
    facets: f,
  });
}

// ── küçük gezgin ────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[34, 188], [50, 188], [50, 220], [30, 220], [30, 210]], 'd', 0, { part: 'bacakA' }));
  f.push(F([[60, 188], [76, 188], [80, 210], [80, 220], [60, 220]], 'd', 0.05, { part: 'bacakB' }));
  // cüppe
  f.push(F([[34, 100], [78, 100], [96, 196], [14, 196]], 'a', 0));
  f.push(F([[34, 100], [54, 100], [54, 196], [14, 196]], 'a', 0.18));
  f.push(F([[54, 100], [78, 100], [96, 196], [54, 196]], 'a', -0.2));
  f.push(F([[22, 150], [88, 150], [90, 160], [20, 160]], 'y', 0.05));
  f.push(F([[14, 196], [96, 196], [98, 202], [12, 202]], 'b', -0.1));
  // asa + kol
  f.push(F([[96, 46], [101, 46], [104, 216], [97, 216]], 'k', 0, { part: 'kol' }));
  f.push(F(elips(98, 46, 7, 7, 10), 'y', 0.1, { part: 'kol' }));
  f.push(F([[74, 104], [88, 108], [100, 152], [90, 156], [78, 124]], 'a', -0.08, { part: 'kol' }));
  f.push(F(elips(96, 154, 7, 7, 10), 'e', 0, { part: 'kol' }));
  // baş
  f.push(...kure(55, 72, 24, 'e', { golge: -0.2 }));
  f.push(F(elips(64, 86, 6, 3.5, 8), 'p', 0.05));
  f.push(F(elips(49, 74, 3, 3.6, 8), 'd', 0));
  f.push(F(elips(66, 74, 3, 3.6, 8), 'd', 0));
  f.push(F(elips(49.8, 72.6, 1, 1, 6), 'w', 0.3));
  f.push(F([[52, 85], [57, 89], [62, 85]], 'd', 0));
  // sarık
  f.push(F(yumusat([[28, 62], [34, 40], [55, 32], [76, 40], [82, 62], [76, 58], [55, 52], [34, 58]], 5, true), 'w', 0.08));
  f.push(F([[34, 52], [76, 48], [78, 58], [36, 62]], 'r', 0.05));
  f.push(F([[38, 40], [62, 34], [70, 40], [44, 46]], 'w', 0.2));
  f.push(F([[28, 62], [20, 70], [16, 104], [26, 96], [32, 66]], 'w', -0.1));
  ekle(K, {
    id: 'kervan-gezgin', name: 'Küçük Gezgin', tags: ['karakter', 'çocuk', 'çöl', 'gezgin', 'hikaye'], size: [120, 226],
    palette: { a: '#2a9d8f', b: '#1d6f66', d: '#3a2a22', y: '#f2c14e', k: '#8a5a32', e: '#f0c19a', p: '#f08c8c', w: '#f6efe0', r: '#c8453b' },
    parts: { bacakA: { pivot: [42, 190] }, bacakB: { pivot: [68, 190] }, kol: { pivot: [80, 106] } },
    variants: { gece: { name: 'Gece', palette: { a: '#4a64a8', b: '#334b86', w: '#d9deef' } } },
    facets: f,
  });
}

// ── piramit ─────────────────────────────────────────────────────────────
{
  const f = [];
  const pir = (ax, ay, sol, sag, taban) => {
    const orta = (sol + sag) / 2 + 12;
    f.push(F([[ax, ay], [sol, taban], [orta, taban + 8]], 'a', 0.14));
    f.push(F([[ax, ay], [orta, taban + 8], [sag, taban]], 'b', -0.18));
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const yl = mix(ay, taban, t);
      const xl = mix(ax, sol, t); const xr = mix(ax, sag, t); const xm = mix(ax, orta, t);
      f.push(F([[xl, yl], [xm, yl + 8 * t + 1], [xm, yl + 8 * t + 4], [xl, yl + 3]], 'c', -0.05));
      f.push(F([[xm, yl + 8 * t + 1], [xr, yl], [xr, yl + 3], [xm, yl + 8 * t + 4]], 'c', -0.3));
    }
  };
  pir(330, 90, 210, 440, 290);
  pir(200, 20, 20, 392, 304);
  ekle(K, { id: 'kervan-piramit', name: 'Piramitler', tags: ['piramit', 'çöl', 'anıt', 'hikaye'], size: [460, 330], palette: { a: '#f1c27d', b: '#c98f55', c: '#a5703f' }, variants: { aksam: { name: 'Akşam', palette: { a: '#e8a0a0', b: '#9a6c8d', c: '#7a5476' } }, gece: { name: 'Gece', palette: { a: '#6f78b0', b: '#444c82', c: '#363d6e' } } }, facets: f });
}

// ── palmiye ─────────────────────────────────────────────────────────────
{
  const f = [];
  const yol = (t) => [mix(112, 128, t * t) + Math.sin(t * 2.4) * 8, mix(420, 120, t)];
  const kal = (t) => mix(17, 8, t);
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = yol(i / 12); const [x1, y1] = yol((i + 1) / 12);
    const w0 = kal(i / 12); const w1 = kal((i + 1) / 12);
    const renk = i % 2 ? 'b' : 'a';
    f.push(F([[x0 - w0, y0], [x0 + w0 * 0.1, y0], [x1 + w1 * 0.1, y1], [x1 - w1, y1]], renk, 0.16));
    f.push(F([[x0 + w0 * 0.1, y0], [x0 + w0, y0], [x1 + w1, y1], [x1 + w1 * 0.1, y1]], renk, -0.2));
  }
  const cx = 128; const cy = 118;
  const yaprak = (ac, uz, part, kv) => {
    const r = (ac * Math.PI) / 180;
    const dx = Math.cos(r); const dy = Math.sin(r);
    const orta = []; const n = 8;
    for (let i = 0; i <= n; i++) { const t = i / n; orta.push([cx + dx * uz * t, cy + dy * uz * t + kv * t * t * uz * 0.9]); }
    const ust = orta.map(([x, y], i) => [x - dy * (1 - Math.abs(i / n - 0.35)) * 16 * (i === 0 ? 0 : 1) * -1, y + dx * -(1 - Math.abs(i / n - 0.35)) * 14 * (i === 0 ? 0 : 1)]);
    const alt = orta.map(([x, y], i) => [x + dy * (1 - Math.abs(i / n - 0.35)) * 16 * (i === 0 ? 0 : 1) * -1, y - dx * -(1 - Math.abs(i / n - 0.35)) * 14 * (i === 0 ? 0 : 1)]);
    const ek = part ? { part } : {};
    f.push(F([...ust, ...alt.reverse()], 'g', 0, ek));
    f.push(F([...orta, ...ust.slice().reverse()], 'g', 0.18, ek));
    f.push(F([...orta, ...alt.slice().reverse().reverse()], 'h', -0.14, ek));
  };
  [[-172, 120, 'yaprakA', 0.55], [-150, 124, 'yaprakA', 0.4], [-120, 104, 'yaprakA', 0.2], [-60, 104, 'yaprakB', 0.2], [-30, 124, 'yaprakB', 0.4], [-8, 120, 'yaprakB', 0.55], [-92, 90, null, 0.1]].forEach(([a, u, p, k]) => yaprak(a, u, p, k));
  [[118, 128], [134, 130], [126, 140]].forEach(([x, y]) => f.push(...kure(x, y, 8, 'k')));
  ekle(K, {
    id: 'kervan-palmiye', name: 'Palmiye', tags: ['palmiye', 'ağaç', 'vaha', 'çöl', 'hikaye'], size: [260, 430],
    palette: { a: '#9a6b3d', b: '#7f5430', g: '#4fa35a', h: '#2f7a46', k: '#6b4a2a' },
    parts: { yaprakA: { pivot: [cx, cy] }, yaprakB: { pivot: [cx, cy] } },
    variants: { gece: { name: 'Gece', palette: { a: '#4f4a70', b: '#3b3758', g: '#2f6a73', h: '#22505a', k: '#3a3454' } } },
    facets: f,
  });
}

// ── vaha ────────────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F(elips(300, 130, 270, 62, 36), 'k', 0));
  f.push(F(elips(300, 126, 246, 52, 36), 'w', 0));
  f.push(F(hilal(300, 126, 246, 52, 20, 160, 0, -14, 14), 'v', -0.14));
  f.push(F(elips(250, 114, 90, 14, 20), 'x', 0.18));
  f.push(F(elips(360, 138, 60, 9, 16), 'x', 0.12));
  const R = rng(3);
  [[60, 138], [96, 150], [520, 134], [548, 148], [150, 170], [440, 168], [300, 182]].forEach(([x, y]) => {
    for (let i = 0; i < 5; i++) { const h = 30 + R() * 36; const dx = (i - 2) * 6 + (R() - 0.5) * 6; f.push(F([[x + dx - 3, y], [x + dx + 3, y], [x + dx + (R() - 0.5) * 12, y - h]], i % 2 ? 'g' : 'h', i % 2 ? 0.1 : -0.12)); }
  });
  [[88, 176, 14], [200, 184, 10], [470, 180, 16], [540, 170, 9]].forEach(([x, y, r]) => f.push(...kure(x, y, r, 'p', { ry: r * 0.7, golge: -0.2 })));
  ekle(K, { id: 'kervan-vaha', name: 'Vaha Gölü', tags: ['vaha', 'göl', 'su', 'çöl', 'hikaye'], size: [600, 210], palette: { k: '#d9a35f', w: '#5cc2d6', v: '#2e8fb0', x: '#bfeaf2', g: '#58b061', h: '#2f8447', p: '#b88a5a' }, variants: { gece: { name: 'Gece', palette: { k: '#4a4670', w: '#2a5d8a', v: '#1c3f66', x: '#6fa3c8', g: '#2f7a66', h: '#1f5a4f', p: '#4f4a70' } } }, facets: f });
}

// ── çadır ───────────────────────────────────────────────────────────────
{
  const f = [];
  const ap = [150, 14];
  const sol = [10, 206]; const sag = [290, 206];
  const sayi = 8;
  for (let i = 0; i < sayi; i++) {
    const a = [mix(sol[0], sag[0], i / sayi), 206]; const b = [mix(sol[0], sag[0], (i + 1) / sayi), 206];
    f.push(F([ap, a, b], i % 2 ? 'c' : 'r', i < sayi / 2 ? 0.12 : -0.16));
  }
  // giriş
  f.push(F([[150, 80], [108, 206], [192, 206]], 'd', 0));
  f.push(F([[150, 100], [122, 206], [178, 206]], 'g', 0.1));
  f.push(F([[150, 80], [108, 206], [138, 206]], 'r', 0.18));
  f.push(F([[150, 80], [192, 206], [162, 206]], 'r', -0.1));
  // direk + bayrak
  f.push(F([[148, 0], [152, 0], [152, 22], [148, 22]], 'd', 0));
  f.push(F([[152, 2], [176, 8], [152, 14]], 'y', 0.1, { part: 'bayrak' }));
  // ip ve kazıklar
  f.push(F([[8, 206], [14, 206], [4, 222], [0, 222]], 'd', 0)); f.push(F([[286, 206], [292, 206], [300, 222], [296, 222]], 'd', 0));
  f.push(F([[8, 206], [292, 206], [292, 212], [8, 212]], 'b', -0.2));
  ekle(K, { id: 'kervan-cadir', name: 'Çöl Çadırı', tags: ['çadır', 'kamp', 'çöl', 'hikaye'], size: [300, 224], palette: { r: '#c8453b', c: '#f4e8cf', d: '#2b2230', g: '#ffd27a', y: '#f2c14e', b: '#a9784a' }, parts: { bayrak: { pivot: [152, 8] } }, variants: { gece: { name: 'Gece', palette: { r: '#8a3d55', c: '#c9cde6' } } }, facets: f });
}

// ── kaktüs ──────────────────────────────────────────────────────────────
{
  const f = [];
  const govde = (x0, x1, yu, ya, c) => { f.push(F([[x0, ya], [x0, yu + (x1 - x0) / 2], ...elips((x0 + x1) / 2, yu + (x1 - x0) / 2, (x1 - x0) / 2, (x1 - x0) / 2, 8, 180, 360), [x1, ya]], c, 0)); const xm = (x0 + x1) / 2; f.push(F([[x0, ya], [x0, yu + (x1 - x0) / 2], ...elips((x0 + xm) / 2 + 2, yu + (x1 - x0) / 2, (xm - x0) / 2 + 2, (x1 - x0) / 2, 6, 180, 270), [xm, yu], [xm, ya]], c, 0.16)); f.push(F([[xm + 8, ya], [xm + 8, yu + 8], [x1, yu + (x1 - x0) / 2], [x1, ya]], c, -0.22)); };
  govde(70, 108, 20, 216, 'g');
  f.push(F([[70, 150], [36, 150], [36, 90], [20, 90], [20, 150], [24, 164], [70, 164]], 'g', 0.04));
  f.push(F([[20, 90], [36, 90], [36, 76], [28, 66], [20, 76]], 'g', 0.14));
  f.push(F([[108, 130], [140, 130], [140, 70], [156, 70], [156, 132], [150, 146], [108, 146]], 'g', -0.1));
  f.push(F([[140, 70], [156, 70], [156, 58], [148, 50], [140, 58]], 'g', 0.1));
  [[89, 40], [89, 90], [89, 150]].forEach(([x, y]) => f.push(F([[x - 1.5, y], [x + 1.5, y], [x + 1.5, y + 40], [x - 1.5, y + 40]], 'h', 0)));
  f.push(...kure(89, 20, 9, 'p'));
  ekle(K, { id: 'kervan-kaktus', name: 'Kaktüs', tags: ['kaktüs', 'çöl', 'bitki', 'hikaye'], size: [176, 220], palette: { g: '#5fae6a', h: '#3a8a4a', p: '#f07aa0' }, variants: { gece: { name: 'Gece', palette: { g: '#2f7a6a', h: '#1f5a50', p: '#c76090' } } }, facets: f });
}

// ── güneş ───────────────────────────────────────────────────────────────
{
  const f = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2; const a1 = ((i + 1) / n) * Math.PI * 2; const am = (a0 + a1) / 2;
    f.push(F([[210 + Math.cos(a0) * 112, 210 + Math.sin(a0) * 112], [210 + Math.cos(am) * 200, 210 + Math.sin(am) * 200], [210 + Math.cos(a1) * 112, 210 + Math.sin(a1) * 112]], i % 2 ? 'b' : 'a', i % 2 ? -0.05 : 0.08));
  }
  f.push(...kure(210, 210, 118, 'a', { golge: -0.14 }));
  f.push(...kure(210, 210, 86, 'c', { golge: -0.1, parla: 0.16 }));
  ekle(K, { id: 'kervan-gunes', name: 'Çöl Güneşi', tags: ['güneş', 'gök', 'çöl', 'hikaye'], size: [420, 420], palette: { a: '#ffb23f', b: '#ff8d33', c: '#ffe27a' }, variants: { aksam: { name: 'Akşam', palette: { a: '#ff8f66', b: '#ff6f5e', c: '#ffc46b' } } }, facets: f });
}

// ── kartal ──────────────────────────────────────────────────────────────
{
  const f = [];
  const kanat = (yon, part) => {
    const s = yon; const cx = 150;
    f.push(F([[cx, 66], [cx + s * 40, 40], [cx + s * 100, 20], [cx + s * 134, 24], [cx + s * 140, 34], [cx + s * 118, 40], [cx + s * 132, 48], [cx + s * 100, 52], [cx + s * 110, 62], [cx + s * 70, 70], [cx + s * 40, 80]], 'a', yon < 0 ? 0.12 : -0.16, { part }));
    f.push(F([[cx, 66], [cx + s * 40, 40], [cx + s * 56, 54], [cx + s * 30, 78]], 'b', yon < 0 ? 0.0 : -0.2, { part }));
    f.push(F([[cx + s * 100, 20], [cx + s * 134, 24], [cx + s * 140, 34], [cx + s * 118, 40], [cx + s * 104, 32]], 'd', 0, { part }));
  };
  kanat(-1, 'kanatSol'); kanat(1, 'kanatSag');
  f.push(F([[150, 60], [166, 66], [160, 96], [150, 104], [140, 96], [134, 66]], 'a', 0.0));
  f.push(F([[134, 66], [150, 60], [150, 104], [140, 96]], 'a', 0.16));
  f.push(F([[150, 104], [168, 126], [150, 118], [132, 126]], 'b', -0.1));
  f.push(F(elips(150, 54, 11, 11, 14), 'c', 0.1));
  f.push(F([[160, 52], [172, 58], [160, 60]], 'o', 0));
  f.push(F(elips(153, 51, 2, 2, 6), 'd', 0));
  ekle(K, { id: 'kervan-kartal', name: 'Kartal', tags: ['kuş', 'kartal', 'uçan', 'çöl', 'hikaye'], size: [300, 130], palette: { a: '#7a5638', b: '#5a3e29', c: '#f2e2c4', d: '#2b2230', o: '#f2b134' }, parts: { kanatSol: { pivot: [150, 66] }, kanatSag: { pivot: [150, 66] } }, variants: { gece: { name: 'Gece', palette: { a: '#3b3a5c', b: '#2b2a46', c: '#8a89b0' } } }, facets: f });
}

// ── fener (yağ lambası) ─────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[28, 0], [32, 0], [32, 18], [28, 18]], 'd', 0));
  f.push(F([[18, 18], [42, 18], [46, 26], [14, 26]], 'y', 0.1));
  f.push(F([[16, 26], [44, 26], [40, 82], [20, 82]], 'g', 0.0));
  f.push(F([[16, 26], [30, 26], [30, 82], [20, 82]], 'g', 0.22));
  f.push(F(elips(30, 54, 7, 12, 12), 'h', 0.3));
  f.push(F([[18, 82], [42, 82], [46, 92], [14, 92]], 'y', -0.1));
  f.push(F([[29, 26], [31, 26], [31, 82], [29, 82]], 'd', 0));
  ekle(K, { id: 'kervan-fener', name: 'Gezgin Feneri', tags: ['fener', 'lamba', 'ışık', 'gece', 'çöl'], size: [60, 96], palette: { d: '#2b2230', y: '#e0a93a', g: '#ffc85e', h: '#fff1b8' }, facets: f });
}

// ── kıvrımlı yol (perspektif: üstte dar/uzak, altta geniş/yakın) ───────
{
  const f = [];
  const N = 48;
  const P = Array.from({ length: N + 1 }, (_, i) => { const t = i / N; const m = yolMerkez(t); return { ...m, t }; });
  for (let i = 0; i < N; i++) {
    const a = P[i]; const b = P[i + 1];
    const sol = (p) => [p.x - p.w, p.y];
    const sag = (p) => [p.x + p.w, p.y];
    const mid = (p) => [p.x, p.y];
    f.push(F([sol(a), mid(a), mid(b), sol(b)], 'a', 0.14));
    f.push(F([mid(a), sag(a), sag(b), mid(b)], 'a', -0.1));
    // tekerlek / ayak izi çizgileri
    f.push(F([[a.x - a.w * 0.5 - a.w * 0.06, a.y], [a.x - a.w * 0.5 + a.w * 0.06, a.y], [b.x - b.w * 0.5 + b.w * 0.06, b.y], [b.x - b.w * 0.5 - b.w * 0.06, b.y]], 'b', -0.12));
    f.push(F([[a.x + a.w * 0.5 - a.w * 0.06, a.y], [a.x + a.w * 0.5 + a.w * 0.06, a.y], [b.x + b.w * 0.5 + b.w * 0.06, b.y], [b.x + b.w * 0.5 - b.w * 0.06, b.y]], 'b', -0.12));
    // kenar kum yığınları
    f.push(F([[a.x - a.w, a.y], [a.x - a.w - a.w * 0.22, a.y + 2], [b.x - b.w - b.w * 0.22, b.y + 2], [b.x - b.w, b.y]], 'c', 0.12));
    f.push(F([[a.x + a.w, a.y], [a.x + a.w + a.w * 0.22, a.y + 2], [b.x + b.w + b.w * 0.22, b.y + 2], [b.x + b.w, b.y]], 'b', -0.2));
  }
  ekle(K, { id: 'kervan-yol', name: 'Kervan Yolu (kıvrımlı)', tags: ['yol', 'çöl', 'patika', 'perspektif', 'hikaye'], size: [YOL.W, YOL.H], palette: { a: '#f2cf98', b: '#cf9a62', c: '#fbe4bd' }, variants: { aksam: { name: 'Akşam', palette: { a: '#e6a9a0', b: '#a9708f', c: '#f6c9bd' } }, gece: { name: 'Gece', palette: { a: '#4a5890', b: '#303d70', c: '#6a78b0' } } }, facets: f });
}
