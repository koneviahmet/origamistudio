// Hikâye 1 — KÜÇÜK FENER: gözlü deniz feneri, kayalık, yelkenli, dalga bantları, fırtına bulutu, şimşek, ay, martı.
import { F, ekle, elips, kure, sutun, yamuk, dagBandi, dalgaBandi, bulutSekli, ayna, mix, clamp, rng, hilal } from './kit.mjs';

const K = 'hikaye-fener';

// ── fener kulesi ────────────────────────────────────────────────────────
{
  const cx = 120;
  const hw = (y) => mix(80, 54, clamp((540 - y) / 325, 0, 1));
  const f = [];
  // temel taşı
  f.push(F([[cx - 100, 596], [cx + 100, 596], [cx + 92, 548], [cx - 92, 548]], 'p', -0.08));
  f.push(F([[cx - 100, 596], [cx - 20, 596], [cx - 20, 548], [cx - 92, 548]], 'p', 0.1));
  // bantlar (alt → üst): kırmızı, beyaz, kırmızı, beyaz
  const sinir = [548, 458, 372, 288, 218];
  ['a', 'c', 'a', 'c'].forEach((renk, i) => {
    const yA = sinir[i]; const yU = sinir[i + 1];
    const a = hw(yA); const u = hw(yU);
    f.push(F([[cx - a, yA], [cx - a * 0.28, yA], [cx - u * 0.28, yU], [cx - u, yU]], renk, 0.2));
    f.push(F([[cx - a * 0.28, yA], [cx + a * 0.3, yA], [cx + u * 0.3, yU], [cx - u * 0.28, yU]], renk, 0.02));
    f.push(F([[cx + a * 0.3, yA], [cx + a, yA], [cx + u, yU], [cx + u * 0.3, yU]], renk, -0.24));
  });
  // kapı (kemerli)
  f.push(F([[cx - 22, 548], [cx - 22, 508], ...elips(cx, 508, 22, 22, 9, 180, 360), [cx + 22, 508], [cx + 22, 548]], 'd', 0));
  f.push(F([[cx - 14, 548], [cx - 14, 510], ...elips(cx, 510, 14, 16, 8, 180, 360), [cx + 14, 510], [cx + 14, 548]], 'k', 0.1));
  f.push(F(elips(cx + 8, 530, 2.6, 2.6, 8), 'g', 0.3));
  // yuvarlak pencere (üst kırmızı bant)
  f.push(F(elips(cx, 330, 13, 13, 18), 'd', 0));
  f.push(F(elips(cx, 330, 10, 10, 18), 'g', 0.15));
  f.push(F(elips(cx - 3, 327, 5, 5, 10), 'h', 0.25));
  // gözler (beyaz bant) — part: goz
  const goz = { part: 'goz' };
  f.push(F(elips(cx - 22, 408, 11, 16, 16), 'd', 0, goz));
  f.push(F(elips(cx + 22, 408, 11, 16, 16), 'd', 0, goz));
  f.push(F(elips(cx - 25, 402, 4, 5.5, 8), 'c', 0.2, goz));
  f.push(F(elips(cx + 19, 402, 4, 5.5, 8), 'c', 0.2, goz));
  // yanaklar + gülümseme
  f.push(F(elips(cx - 40, 430, 9, 5, 10), 'y', 0.05));
  f.push(F(elips(cx + 40, 430, 9, 5, 10), 'y', 0.05));
  f.push(F([[cx - 16, 428], [cx - 8, 438], [cx, 441], [cx + 8, 438], [cx + 16, 428], [cx + 12, 428], [cx + 6, 434], [cx, 436], [cx - 6, 434], [cx - 12, 428]], 'd', 0));
  // balkon (galeri)
  f.push(F([[cx - 76, 218], [cx + 76, 218], [cx + 88, 232], [cx - 88, 232]], 'p', 0.06));
  f.push(F([[cx - 88, 232], [cx + 88, 232], [cx + 80, 240], [cx - 80, 240]], 'p', -0.2));
  for (let i = 0; i <= 9; i++) {
    const x = cx - 74 + i * 16.4;
    f.push(F([[x - 1.6, 192], [x + 1.6, 192], [x + 1.6, 218], [x - 1.6, 218]], 'd', 0));
  }
  f.push(F([[cx - 78, 188], [cx + 78, 188], [cx + 78, 195], [cx - 78, 195]], 'd', 0.05));
  // fener odası (cam)
  f.push(F([[cx - 40, 218], [cx + 40, 218], [cx + 40, 146], [cx - 40, 146]], 'g', 0.04));
  f.push(F([[cx - 40, 218], [cx - 6, 218], [cx - 6, 146], [cx - 40, 146]], 'g', 0.22));
  f.push(F(elips(cx, 182, 22, 28, 20), 'h', 0.3));
  [-26, -2, 22].forEach((dx) => f.push(F([[cx + dx - 2.5, 218], [cx + dx + 2.5, 218], [cx + dx + 2.5, 146], [cx + dx - 2.5, 146]], 'd', 0)));
  f.push(F([[cx - 46, 150], [cx + 46, 150], [cx + 46, 140], [cx - 46, 140]], 'd', 0.05));
  // çatı
  f.push(F([[cx - 54, 142], [cx, 62], [cx, 142]], 'r', 0.18));
  f.push(F([[cx, 62], [cx + 54, 142], [cx, 142]], 'r', -0.24));
  f.push(F([[cx - 6, 70], [cx + 6, 70], [cx + 4, 48], [cx - 4, 48]], 'd', 0));
  f.push(F(elips(cx, 44, 7, 7, 12), 'a', 0.1));
  ekle(K, {
    id: 'fener-kule', name: 'Küçük Fener (gözlü)', tags: ['fener', 'deniz', 'kule', 'hikaye', 'karakter'], size: [240, 610],
    palette: { a: '#d94b3f', c: '#f6efe4', d: '#2b2d42', p: '#8d90a3', g: '#ffd27a', h: '#fff4c9', r: '#3e5a8a', k: '#4b3a2f', y: '#f4a79d' },
    parts: { goz: { pivot: [cx, 408] } },
    variants: {
      gece: { name: 'Gece', palette: { a: '#b2434c', c: '#d4d9ee', p: '#5f6382', d: '#171a33', r: '#2c3d68', y: '#d98e9a' } },
      firtina: { name: 'Fırtına', palette: { a: '#9b4d52', c: '#b9bfd6', p: '#555a74', d: '#13162b', r: '#273658', y: '#b98190' } },
    },
    facets: f,
  });
}

// ── kayalık adacık ──────────────────────────────────────────────────────
{
  const f = dagBandi({ w: 900, h: 380, tepe: [[0.34, 0.86, 0.1], [0.5, 0.9, 0.12], [0.66, 0.84, 0.1], [0.16, 0.5, 0.1], [0.86, 0.46, 0.1]], seed: 21, satir: 6, kolon: 20, anahtar: ['a', 'b', 'c'], kar: 'g', jit: 0.36, gain: 1.25, kenarAlcak: true });
  // taban köpüğü
  const R = rng(4);
  for (let i = 0; i < 22; i++) {
    const x = 20 + i * 40 + R() * 16; const y = 372; const g = 14 + R() * 14;
    f.push(F([[x - g, y + 8], [x, y - 8 - R() * 8], [x + g, y + 8]], 'w', 0.2));
  }
  ekle(K, {
    id: 'fener-kayalik', name: 'Fener Kayalığı', tags: ['kaya', 'ada', 'kıyı', 'deniz', 'hikaye'], size: [900, 392],
    palette: { a: '#b9b6c4', b: '#8a869b', c: '#615d78', g: '#7fae5c', w: '#f4fbff' },
    variants: {
      gece: { name: 'Gece', palette: { a: '#5a5d7c', b: '#41445f', c: '#2b2d44', g: '#3d6046', w: '#cfe3f2' } },
      firtina: { name: 'Fırtına', palette: { a: '#6d7086', b: '#4d5068', c: '#32344a', g: '#3a5a44', w: '#dbe8f1' } },
    },
    facets: f,
  });
}

// ── yelkenli ────────────────────────────────────────────────────────────
{
  const f = [];
  const flag = { part: 'bayrak' };
  // gövde
  f.push(F([[24, 238], [140, 238], [140, 300], [118, 300], [46, 284]], 'a', 0.12));
  f.push(F([[140, 238], [240, 238], [214, 284], [140, 300]], 'a', -0.22));
  f.push(F([[26, 246], [238, 246], [236, 256], [30, 256]], 'w', 0.1));
  [58, 96, 134, 172].forEach((x) => f.push(F(elips(x, 270, 5, 5, 10), 'd', 0)));
  // ana direk ve yelkenler
  f.push(F([[127, 36], [135, 36], [135, 240], [127, 240]], 'd', 0.05));
  f.push(F([[135, 36], [137, 36], [137, 240], [135, 240]], 'd', -0.3));
  // ana yelken (fan)
  f.push(F([[138, 44], [176, 112], [138, 228]], 'c', 0.16));
  f.push(F([[176, 112], [208, 172], [138, 228]], 'c', 0.0));
  f.push(F([[208, 172], [226, 228], [138, 228]], 'c', -0.16));
  f.push(F(elips(172, 170, 13, 13, 16), 'b', 0.1));
  // flok yelken
  f.push(F([[124, 54], [90, 124], [124, 228]], 'b', 0.14));
  f.push(F([[90, 124], [60, 184], [124, 228]], 'b', -0.04));
  f.push(F([[60, 184], [44, 228], [124, 228]], 'b', -0.2));
  // halat çizgileri
  f.push(F([[131, 38], [26, 240], [24, 238], [129, 36]], 'd', 0.1));
  f.push(F([[133, 38], [238, 240], [240, 238], [135, 36]], 'd', 0.1));
  // bayrak
  f.push(F([[135, 34], [164, 42], [135, 54]], 'a', 0.1, flag));
  f.push(F([[135, 34], [150, 38], [135, 44]], 'w', 0.2, flag));
  ekle(K, {
    id: 'fener-yelkenli', name: 'Küçük Yelkenli', tags: ['tekne', 'yelkenli', 'gemi', 'deniz', 'hikaye'], size: [260, 316],
    palette: { a: '#c85a3b', c: '#f6efe4', b: '#f2a65a', d: '#3a2b2b', w: '#ffffff' },
    parts: { bayrak: { pivot: [135, 44] } },
    variants: {
      gece: { name: 'Gece', palette: { a: '#8c4a49', c: '#cfd3e8', b: '#c8884f', d: '#1f1b2b', w: '#e3e8f5' } },
      mavi: { name: 'Mavi', palette: { a: '#3b7fc8', b: '#f2d35a' } },
    },
    facets: f,
  });
}

// ── dalga bantları ──────────────────────────────────────────────────────
[
  ['uzak', { genlik: 9, dalga: 6, serit: 4, seed: 31, n: 22 }, { a: '#a8d5e6', b: '#8dc3da', w: '#eef9ff' }, { a: '#2c4466', b: '#233957', w: '#6f86a8' }, { a: '#5f6f8c', b: '#4d5c78', w: '#9aa8c2' }],
  ['orta', { genlik: 18, dalga: 4, serit: 5, seed: 33, n: 16 }, { a: '#76bcd6', b: '#5ba6c4', w: '#f1fbff' }, { a: '#21395c', b: '#1a2e4c', w: '#7f97b8' }, { a: '#4d5f7e', b: '#3d4d69', w: '#a7b4cb' }],
  ['yakin', { genlik: 32, dalga: 2.6, serit: 6, seed: 35, n: 12 }, { a: '#4c9fc2', b: '#3a86ab', w: '#f4fcff' }, { a: '#182f50', b: '#12253f', w: '#8aa2c4' }, { a: '#3b4c6c', b: '#2f3d58', w: '#b3bfd3' }],
].forEach(([ad, ayar, gun, gece, firt]) => {
  ekle(K, {
    id: `fener-dalga-${ad}`, name: `Dalga bandı (${ad})`, tags: ['dalga', 'deniz', 'su', 'hikaye'], size: [1080, 300],
    palette: gun, variants: { gece: { name: 'Gece', palette: gece }, firtina: { name: 'Fırtına', palette: firt } },
    facets: dalgaBandi({ w: 1080, h: 300, ...ayar }),
  });
});

// ── fırtına bulutu ──────────────────────────────────────────────────────
{
  const f = bulutSekli({ w: 900, h: 340, seed: 5 });
  ekle(K, { id: 'fener-bulut-firtina', name: 'Fırtına Bulutu', tags: ['bulut', 'fırtına', 'gök', 'yağmur', 'hikaye'], size: [900, 340], palette: { a: '#6a7191', b: '#454b69', c: '#9aa3c2' }, variants: { acik: { name: 'Açık', palette: { a: '#c2d0e4', b: '#8fa3c0', c: '#eef4fc' } }, safak: { name: 'Şafak', palette: { a: '#f5c2ac', b: '#d98e8e', c: '#ffe8d4' } }, gece: { name: 'Gece', palette: { a: '#3e4562', b: '#262b42', c: '#5c6585' } } }, facets: f });
}

// ── şimşek ──────────────────────────────────────────────────────────────
ekle(K, {
  id: 'fener-simsek', name: 'Şimşek', tags: ['şimşek', 'fırtına', 'enerji'], size: [140, 360], palette: { a: '#fff3a8', b: '#ffffff' },
  facets: [
    F([[78, 0], [110, 0], [86, 120], [124, 120], [50, 250], [70, 160], [40, 160]], 'a', 0),
    F([[88, 14], [102, 14], [82, 124], [110, 124], [58, 226], [72, 150], [56, 150]], 'b', 0.2),
    F([[50, 250], [124, 120], [70, 160], [40, 160]], 'a', -0.1),
    F([[50, 250], [62, 300], [58, 360], [46, 300]], 'a', -0.05),
  ],
});

// ── ay ──────────────────────────────────────────────────────────────────
{
  const f = [...kure(110, 110, 100, 'a', { golge: -0.1, parla: 0.1 })];
  [[78, 82, 16], [128, 72, 11], [140, 128, 18], [90, 140, 12], [58, 118, 9]].forEach(([x, y, r]) => { f.push(F(elips(x, y, r, r * 0.9, 14), 'b', -0.04)); f.push(F(hilal(x, y, r, r * 0.9, 150, 330, 2, 3), 'b', 0.12)); });
  ekle(K, { id: 'fener-ay', name: 'Dolunay', tags: ['ay', 'gece', 'gök', 'hikaye'], size: [220, 220], palette: { a: '#f4eecb', b: '#d9d2a4' }, variants: { soluk: { name: 'Soluk', palette: { a: '#cfd6e6', b: '#aab3c8' } } }, facets: f });
}

// ── martı ───────────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[62, 56], [118, 50], [150, 58], [118, 68], [78, 70]], 'a', 0.0));
  f.push(F([[62, 56], [100, 50], [100, 64], [78, 70]], 'a', 0.15));
  f.push(F([[150, 58], [178, 54], [170, 62], [150, 64]], 'b', -0.1)); // kuyruk
  f.push(F(elips(58, 52, 12, 11, 14), 'a', 0.12)); // baş
  f.push(F([[46, 50], [28, 56], [46, 58]], 'o', 0)); // gaga
  f.push(F(elips(56, 49, 2.2, 2.2, 8), 'd', 0));
  f.push(F([[104, 56], [134, 24], [150, 8], [152, 28], [128, 58]], 'a', 0.1, { part: 'kanatSag' }));
  f.push(F([[108, 54], [136, 22], [150, 8], [144, 34]], 'b', -0.1, { part: 'kanatSag' }));
  f.push(F([[96, 58], [64, 22], [50, 8], [48, 30], [74, 60]], 'a', 0.16, { part: 'kanatSol' }));
  f.push(F([[92, 56], [62, 26], [50, 8], [56, 36]], 'b', 0.04, { part: 'kanatSol' }));
  f.push(F([[48, 8], [44, 14], [52, 12]], 'd', 0, { part: 'kanatSol' }));
  f.push(F([[150, 8], [154, 14], [146, 12]], 'd', 0, { part: 'kanatSag' }));
  ekle(K, { id: 'fener-marti', name: 'Martı', tags: ['kuş', 'martı', 'deniz', 'uçan'], size: [200, 100], palette: { a: '#f4f6fa', b: '#9aa6bd', d: '#2b2d42', o: '#f2a65a' }, parts: { kanatSag: { pivot: [108, 58] }, kanatSol: { pivot: [92, 58] } }, facets: f });
}
