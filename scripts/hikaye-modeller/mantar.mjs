// Hikâye 5 — MANTAR ORMANI: mantar evleri, dev mantarlar, büyük yaprak, ağaç gövdesi, baykuş, ateş böceği perisi, parlak çiçek, salyangoz, yosunlu zemin.
import { F, ekle, elips, kure, hilal, yumusat, boru, egri, mix, clamp, rng } from './kit.mjs';

const K = 'hikaye-mantar';

/** Mantar şapkası: kubbe + sağ gölge + parlama + alt lamel şeridi + benekler. (cx, yAlt) = alt kenar orta; rx, ry; dişler: lamel çizgileri */
const sapka = (cx, yAlt, rx, ry, { benek = [], anahtar = 'r', lamel = 'm', alt = 18 } = {}) => {
  const f = [];
  const kub = elips(cx, yAlt, rx, ry, 30, 180, 360);
  const taban = [[cx + rx, yAlt], [cx + rx * 0.5, yAlt + alt * 0.8], [cx, yAlt + alt], [cx - rx * 0.5, yAlt + alt * 0.8], [cx - rx, yAlt]];
  f.push(F([...taban], lamel, -0.12));
  for (let i = 0; i < 14; i++) { const x = cx - rx * 0.92 + i * ((rx * 1.84) / 13); const y0 = yAlt + Math.abs(x - cx) * 0.0; f.push(F([[x - 1.6, y0 + 1], [x + 1.6, y0 + 1], [x + 1.6, y0 + alt * 0.8 * (1 - (Math.abs(x - cx) / rx) ** 2) + 2], [x - 1.6, y0 + alt * 0.8 * (1 - (Math.abs(x - cx) / rx) ** 2) + 2]], lamel, -0.34)); }
  f.push(F([...kub, [cx + rx, yAlt]], anahtar, 0));
  f.push(F([...elips(cx, yAlt, rx, ry, 18, 250, 360), [cx + rx * 0.9, yAlt], [cx + rx * 0.2, yAlt - ry * 0.1]], anahtar, -0.2));
  f.push(F(elips(cx - rx * 0.4, yAlt - ry * 0.62, rx * 0.34, ry * 0.18, 14), anahtar, 0.2));
  benek.forEach(([x, y, r]) => { f.push(F(elips(cx + x, yAlt + y, r, r * 0.72, 12), 'w', 0.02)); f.push(F(hilal(cx + x, yAlt + y, r, r * 0.72, -30, 150, -r * 0.18, -r * 0.1, 8), 'w', -0.1)); });
  return f;
};
const BENEK = (rx, ry) => [[-rx * 0.5, -ry * 0.55, rx * 0.13], [rx * 0.05, -ry * 0.84, rx * 0.16], [rx * 0.55, -ry * 0.5, rx * 0.12], [-rx * 0.15, -ry * 0.36, rx * 0.09], [rx * 0.82, -ry * 0.2, rx * 0.08], [-rx * 0.82, -ry * 0.16, rx * 0.08], [rx * 0.32, -ry * 0.22, rx * 0.1]];

// ── mantar evleri ───────────────────────────────────────────────────────
function mantarEv({ id, ad, W = 320, govdeH = 190, rx = 150, ry = 104, kat = 1, renk = {} }) {
  const f = [];
  const taban = govdeH + ry + 60;
  const cx = W / 2; const yS = ry + 30; // şapka alt kenarı
  const yT = taban;
  // gövde
  f.push(F([[cx - 56, yT], [cx - 48, yS + 16], [cx + 48, yS + 16], [cx + 56, yT]], 'c', 0));
  f.push(F([[cx - 56, yT], [cx - 48, yS + 16], [cx - 8, yS + 16], [cx - 10, yT]], 'c', 0.16));
  f.push(F([[cx + 14, yT], [cx + 14, yS + 16], [cx + 48, yS + 16], [cx + 56, yT]], 'c', -0.2));
  for (let i = 0; i < 3; i++) f.push(F([[cx - 52 + i * 2, yS + 34 + i * 40], [cx + 52 - i * 2, yS + 34 + i * 40], [cx + 52 - i * 2, yS + 37 + i * 40], [cx - 52 + i * 2, yS + 37 + i * 40]], 'b', -0.18));
  // kapı
  const dy = yT - 4; const dh = 64;
  f.push(F([[cx - 26, dy], [cx - 26, dy - dh + 22], ...elips(cx, dy - dh + 22, 26, 24, 10, 180, 360), [cx + 26, dy]], 'f', -0.05));
  f.push(F([[cx - 21, dy], [cx - 21, dy - dh + 22], ...elips(cx, dy - dh + 22, 21, 19, 9, 180, 360), [cx + 21, dy]], 'k', 0.06));
  f.push(F([[cx - 21, dy], [cx - 21, dy - dh + 22], ...elips(cx, dy - dh + 22, 21, 19, 9, 180, 270), [cx, dy - dh + 3], [cx, dy]], 'k', 0.2));
  f.push(F(elips(cx, dy - dh + 28, 8, 8, 10), 'f', 0)); f.push(F(elips(cx, dy - dh + 28, 6, 6, 10), 'g', 0.2));
  f.push(F(elips(cx + 13, dy - 26, 2.4, 2.4, 6), 'y', 0.2));
  f.push(F([[cx - 36, yT + 2], [cx + 36, yT + 2], [cx + 30, yT + 10], [cx - 30, yT + 10]], 'p', 0.05));
  // yuvarlak pencere(ler)
  const pen = (x, y) => { f.push(F(elips(x, y, 19, 19, 16), 'f', 0)); f.push(F(elips(x, y, 15, 15, 16), 'g', 0.1)); f.push(F(elips(x - 3, y - 3, 8, 8, 10), 'h', 0.3)); f.push(F([[x - 1.6, y - 15], [x + 1.6, y - 15], [x + 1.6, y + 15], [x - 1.6, y + 15]], 'f', 0)); f.push(F([[x - 15, y - 1.6], [x + 15, y - 1.6], [x + 15, y + 1.6], [x - 15, y + 1.6]], 'f', 0)); f.push(F([[x - 22, y + 20], [x + 22, y + 20], [x + 18, y + 30], [x - 18, y + 30]], 'k', 0)); [-12, -3, 7, 14].forEach((dx, i) => f.push(...kure(x + dx, y + 18, 4.6, i % 2 ? 'o' : 'q'))); };
  pen(cx, yS + 70);
  if (kat > 1) pen(cx, yS + 118 + 0);
  // yosun + çimen
  const R = rng(9);
  for (let i = 0; i < 9; i++) { const x = cx - 78 + i * 20 + R() * 8; const h = 16 + R() * 18; f.push(F([[x - 4, yT + 6], [x + (R() - 0.5) * 8, yT - h], [x + 5, yT + 6]], i % 2 ? 'v' : 'u', i % 2 ? 0.1 : -0.1)); }
  // şapka
  f.push(...sapka(cx, yS, rx, ry, { benek: BENEK(rx, ry), anahtar: 'r', lamel: 'm' }));
  // baca
  f.push(F([[cx + 62, yS - ry * 0.86], [cx + 84, yS - ry * 0.86], [cx + 86, yS - ry * 0.4], [cx + 60, yS - ry * 0.4]], 'm', -0.1));
  f.push(F([[cx + 62, yS - ry * 0.86], [cx + 72, yS - ry * 0.86], [cx + 72, yS - ry * 0.4], [cx + 60, yS - ry * 0.4]], 'm', 0.14));
  f.push(F(elips(cx + 73, yS - ry * 0.88, 14, 4, 12), 'f', 0));
  ekle(K, {
    id, name: ad, tags: ['mantar', 'ev', 'orman', 'peri', 'hikaye'], size: [W, taban + 18],
    palette: { r: '#d94a4a', m: '#f3e4c4', w: '#fff6e8', c: '#f1e2c2', b: '#c8b48c', f: '#6a4a33', k: '#8a5a38', g: '#ffd27a', h: '#fff3c4', y: '#f2c14e', p: '#9a9aa8', v: '#58b060', u: '#3f8f50', o: '#f08ab0', q: '#f2c14e', ...renk },
    variants: {
      mor: { name: 'Mor', palette: { r: '#9a6ad6', m: '#efe3ff' } },
      mavi: { name: 'Mavi', palette: { r: '#4a86d9', m: '#e3f1ff' } },
      turuncu: { name: 'Turuncu', palette: { r: '#e8863a', m: '#fff0d8' } },
      gece: { name: 'Gece', palette: { r: '#9b4a6a', c: '#c9bfd8', b: '#8f84a8', v: '#2f7a66', u: '#1f5a50', m: '#d9c8e8' } },
    },
    facets: f,
  });
}
mantarEv({ id: 'mantar-ev-1', ad: 'Mantar Evi', W: 320, govdeH: 180, rx: 150, ry: 104 });
mantarEv({ id: 'mantar-ev-2', ad: 'Uzun Mantar Evi', W: 280, govdeH: 260, rx: 118, ry: 86, kat: 2 });

// ── dev mantarlar (arka plan) ───────────────────────────────────────────
function devMantar(id, ad, { W = 340, H = 460, rx = 160, ry = 70, sapkaY = 150, govdeW = 38, renk = {} }) {
  const f = [];
  const cx = W / 2;
  f.push(F([[cx - govdeW - 12, H], [cx - govdeW, sapkaY + 10], [cx + govdeW, sapkaY + 10], [cx + govdeW + 12, H]], 'c', 0));
  f.push(F([[cx - govdeW - 12, H], [cx - govdeW, sapkaY + 10], [cx - 6, sapkaY + 10], [cx - 8, H]], 'c', 0.16));
  f.push(F([[cx + 12, H], [cx + 12, sapkaY + 10], [cx + govdeW, sapkaY + 10], [cx + govdeW + 12, H]], 'c', -0.22));
  f.push(F([[cx - govdeW - 12, H], [cx + govdeW + 12, H], [cx + govdeW + 30, H - 6], [cx - govdeW - 30, H - 6]], 'v', 0.0));
  f.push(...sapka(cx, sapkaY, rx, ry, { benek: BENEK(rx, ry).slice(0, 5), anahtar: 'r', lamel: 'm', alt: 24 }));
  ekle(K, {
    id, name: ad, tags: ['mantar', 'dev', 'orman', 'arka plan', 'hikaye'], size: [W, H + 4],
    palette: { r: '#9a6ad6', m: '#efe3ff', w: '#f7efff', c: '#e8dcc8', v: '#5aa86a', ...renk },
    variants: { kirmizi: { name: 'Kırmızı', palette: { r: '#d94a4a', m: '#f3e4c4' } }, mavi: { name: 'Mavi', palette: { r: '#4a86d9', m: '#e3f1ff' } }, uzak: { name: 'Uzak (sisli)', palette: { r: '#a89ad0', m: '#e6e0f4', w: '#f0ecfa', c: '#d9d4e8', v: '#8fb0a8' } }, gece: { name: 'Gece', palette: { r: '#6a4aa0', m: '#c9bfe0', w: '#e0d8f0', c: '#b9aed0', v: '#2f7a66' } } },
    facets: f,
  });
}
devMantar('mantar-buyuk-1', 'Dev Mantar (kubbe)', { W: 360, H: 480, rx: 170, ry: 78, sapkaY: 150, govdeW: 40 });
devMantar('mantar-buyuk-2', 'Dev Mantar (yassı)', { W: 400, H: 420, rx: 190, ry: 52, sapkaY: 130, govdeW: 34, renk: { r: '#e8863a', m: '#fff0d8' } });
devMantar('mantar-buyuk-3', 'Dev Mantar (çan)', { W: 280, H: 520, rx: 118, ry: 96, sapkaY: 170, govdeW: 30, renk: { r: '#4aa8a0', m: '#e0f6f2' } });

// ── yerdeki küçük mantar öbeği ──────────────────────────────────────────
{
  const f = [];
  [[60, 120, 34, 22, 'r'], [110, 130, 22, 16, 'r2'], [150, 118, 30, 20, 'r'], [214, 128, 40, 26, 'r3'], [262, 134, 20, 14, 'r']].forEach(([x, y, rx, ry, k], i) => {
    f.push(F([[x - rx * 0.28, 150], [x - rx * 0.24, y], [x + rx * 0.24, y], [x + rx * 0.28, 150]], 'c', i % 2 ? -0.08 : 0.06));
    f.push(...sapka(x, y, rx, ry, { benek: [[-rx * 0.35, -ry * 0.55, rx * 0.14], [rx * 0.2, -ry * 0.7, rx * 0.12], [rx * 0.5, -ry * 0.3, rx * 0.1]], anahtar: k, lamel: 'm', alt: 8 }));
  });
  const R = rng(4);
  for (let i = 0; i < 12; i++) { const x = 8 + i * 26 + R() * 8; const h = 20 + R() * 26; f.push(F([[x - 5, 156], [x + (R() - 0.5) * 12, 156 - h], [x + 6, 156]], i % 2 ? 'v' : 'u', i % 2 ? 0.12 : -0.12)); }
  ekle(K, { id: 'mantar-kucuk', name: 'Küçük Mantarlar', tags: ['mantar', 'yer', 'orman', 'hikaye'], size: [310, 160], palette: { r: '#e0584a', r2: '#f2a65a', r3: '#b58ae0', m: '#f3e4c4', w: '#fff6e8', c: '#f1e2c2', v: '#58b060', u: '#3f8f50' }, variants: { gece: { name: 'Gece', palette: { r: '#9b4a6a', r2: '#a8704a', r3: '#6a4aa0', c: '#c9bfd8', v: '#2f7a66', u: '#1f5a50' } } }, facets: f });
}

// ── büyük yaprak (ön plan) ──────────────────────────────────────────────
{
  const f = [];
  const orta = egri([[40, 520], [90, 380], [150, 220], [230, 40]], 14);
  const yan = (taraf) => orta.map(([x, y], i) => { const t = i / (orta.length - 1); const gen = Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.8 * 150 * (taraf > 0 ? 1 : 0.92); return [x + taraf * gen * 0.9, y + gen * 0.14 * -taraf * 0.2]; });
  const sol = yan(-1); const sag = yan(1);
  f.push(F([...orta, ...sag.slice().reverse()], 'a', -0.08));
  f.push(F([...orta, ...sol.slice().reverse()], 'a', 0.16));
  for (let i = 1; i < orta.length - 1; i++) {
    f.push(F([orta[i], sol[i], sol[i + 1], orta[i + 1]], i % 2 ? 'a' : 'b', i % 2 ? 0.2 : 0.1));
    f.push(F([orta[i], sag[i], sag[i + 1], orta[i + 1]], i % 2 ? 'b' : 'a', i % 2 ? -0.16 : -0.06));
  }
  f.push(F(boru(orta, (t) => mix(5, 1.4, t)), 'd', 0.05));
  ekle(K, { id: 'mantar-yaprak', name: 'Büyük Yaprak', tags: ['yaprak', 'orman', 'ön plan', 'hikaye'], size: [300, 530], palette: { a: '#3d9a5a', b: '#2f7a48', d: '#1f5a38' }, variants: { gece: { name: 'Gece', palette: { a: '#2a7a6a', b: '#1f5a54', d: '#14403c' } }, sonbahar: { name: 'Sonbahar', palette: { a: '#d98a3a', b: '#b8662a', d: '#8a4a1f' } } }, facets: f });
}

// ── ağaç gövdesi (dev, ön plan) ─────────────────────────────────────────
{
  const f = [];
  const R = rng(13);
  const yol = egri([[130, 1160], [124, 800], [138, 400], [130, 0]], 16);
  const g = (t) => mix(110, 76, t);
  f.push(F(boru(yol, g), 'a', 0));
  // kabuk şeritleri (sol açık, sağ koyu)
  f.push(F(boru(yol.map(([x, y]) => [x - 34, y]), (t) => g(t) * 0.5, 1), 'a', 0.16));
  f.push(F(boru(yol.map(([x, y]) => [x + 40, y]), (t) => g(t) * 0.45, -1), 'b', -0.2));
  for (let i = 0; i < 26; i++) { const t = R(); const [x, y] = yol[Math.floor(t * (yol.length - 1))]; const w = 10 + R() * 22; const h = 36 + R() * 90; const dx = (R() - 0.5) * g(t) * 1.4; f.push(F([[x + dx - w / 2, y], [x + dx + w / 2, y], [x + dx + w * 0.3, y - h]], i % 2 ? 'b' : 'c', i % 2 ? -0.1 : 0.1)); }
  // kökler
  f.push(F([[20, 1160], [60, 1080], [80, 1160]], 'a', -0.1)); f.push(F([[180, 1160], [200, 1070], [250, 1160]], 'a', -0.2));
  f.push(F([[60, 1160], [100, 1100], [140, 1160]], 'b', -0.1));
  f.push(F([[0, 1160], [110, 1140], [260, 1160]], 'v', 0.0));
  // oyuk
  f.push(F(elips(138, 760, 40, 56, 18), 'd', 0)); f.push(F(elips(138, 766, 30, 44, 16), 'n', 0)); f.push(F(elips(138, 790, 18, 18, 12), 'g', 0.1));
  ekle(K, { id: 'mantar-agac', name: 'Dev Ağaç Gövdesi', tags: ['ağaç', 'gövde', 'orman', 'ön plan', 'hikaye'], size: [270, 1170], palette: { a: '#7a5a42', b: '#4f3a2a', c: '#9a7656', d: '#241a14', n: '#3a2a22', g: '#ffd27a', v: '#3f8f50' }, variants: { gece: { name: 'Gece', palette: { a: '#4a4666', b: '#322f4a', c: '#625d84', v: '#1f5a50' } } }, facets: f });
}

// ── baykuş ──────────────────────────────────────────────────────────────
{
  const f = [];
  const goz = { part: 'goz' };
  f.push(F([[0, 270], [220, 262], [226, 276], [4, 286]], 'k', -0.1));
  f.push(F([[0, 270], [110, 266], [110, 280], [4, 286]], 'k', 0.12));
  // gövde
  f.push(F(yumusat([[110, 62], [160, 84], [176, 160], [166, 230], [140, 262], [80, 262], [54, 230], [44, 160], [60, 84]], 5, true), 'a', 0));
  f.push(F(yumusat([[110, 62], [60, 84], [44, 160], [54, 230], [80, 262], [110, 262]], 5, true), 'a', 0.16));
  f.push(F(yumusat([[110, 62], [160, 84], [176, 160], [166, 230], [140, 262], [110, 262]], 5, true), 'a', -0.2));
  // karın tüyleri
  f.push(F(yumusat([[110, 128], [140, 150], [144, 210], [124, 248], [96, 248], [76, 210], [80, 150]], 4, true), 'c', 0.04));
  for (let r = 0; r < 5; r++) for (let i = 0; i < 3; i++) { const x = 90 + i * 20 + (r % 2) * 10; const y = 156 + r * 18; f.push(F([[x - 9, y], [x, y + 11], [x + 9, y]], 'b', -0.04)); }
  // kanatlar
  f.push(F([[52, 110], [34, 170], [44, 230], [72, 250], [66, 160]], 'b', 0.1));
  f.push(F([[168, 110], [186, 170], [176, 230], [148, 250], [154, 160]], 'b', -0.2));
  [[44, 190], [48, 214]].forEach(([x, y]) => f.push(F([[x - 4, y], [x + 10, y - 6], [x + 14, y + 6]], 'a', 0.1)));
  // yüz diski
  f.push(F(elips(84, 112, 34, 32, 22), 'c', 0.04)); f.push(F(elips(136, 112, 34, 32, 22), 'c', -0.04));
  f.push(F([[110, 84], [114, 150], [106, 150]], 'c', 0.0));
  f.push(F([[60, 66], [50, 28], [82, 56]], 'b', 0.0)); f.push(F([[160, 66], [170, 28], [138, 56]], 'b', -0.14));
  // gözler
  f.push(F(elips(86, 112, 22, 22, 18), 'e', 0, goz)); f.push(F(elips(134, 112, 22, 22, 18), 'e', 0, goz));
  f.push(F(elips(88, 114, 12, 12, 14), 'd', 0, goz)); f.push(F(elips(132, 114, 12, 12, 14), 'd', 0, goz));
  f.push(F(elips(84, 109, 4, 4, 8), 'x', 0.4, goz)); f.push(F(elips(128, 109, 4, 4, 8), 'x', 0.4, goz));
  f.push(F(yumusat([[62, 96], [86, 84], [106, 98]], 4), 'b', -0.1)); f.push(F(yumusat([[114, 98], [134, 84], [158, 96]], 4), 'b', -0.1));
  f.push(F([[100, 134], [120, 134], [110, 156]], 'o', 0.1)); f.push(F([[110, 134], [120, 134], [110, 156]], 'o', -0.2));
  // ayaklar
  [[92, 262], [128, 262]].forEach(([x, y]) => { f.push(F([[x - 10, y], [x + 10, y], [x + 8, y + 12], [x - 8, y + 12]], 'o', 0)); [-8, 0, 8].forEach((dx) => f.push(F([[x + dx - 2.4, y + 10], [x + dx + 2.4, y + 10], [x + dx, y + 20]], 'd', 0))); });
  ekle(K, { id: 'mantar-baykus', name: 'Bilge Baykuş', tags: ['baykuş', 'kuş', 'orman', 'karakter', 'hikaye'], size: [230, 292], palette: { a: '#9a7656', b: '#6f5238', c: '#e8d3b0', d: '#2a1f1a', e: '#ffcf4a', x: '#ffffff', o: '#f2a65a', k: '#5a4030' }, parts: { goz: { pivot: [110, 112] } }, variants: { gece: { name: 'Gece', palette: { a: '#6a6a96', b: '#4a4a74', c: '#c9c6e0', e: '#ffe27a', k: '#3a3452' } } }, facets: f });
}

// ── ateş böceği perisi ──────────────────────────────────────────────────
{
  const f = [];
  const kanat = (yon, part) => {
    const s = yon; const cx = 70;
    f.push(F([[cx, 78], [cx + s * 20, 30], [cx + s * 62, 6], [cx + s * 74, 36], [cx + s * 44, 78]], 'w', yon < 0 ? 0.14 : -0.04, { part }));
    f.push(F([[cx, 84], [cx + s * 54, 96], [cx + s * 56, 134], [cx + s * 24, 118]], 'v', yon < 0 ? 0.08 : -0.1, { part }));
    f.push(F([[cx, 78], [cx + s * 62, 6], [cx + s * 44, 78]], 'x', 0.1, { part }));
  };
  kanat(-1, 'kanatSol'); kanat(1, 'kanatSag');
  f.push(F([[56, 188], [64, 188], [62, 168], [56, 168]], 'e', 0)); f.push(F([[76, 188], [84, 188], [82, 168], [76, 168]], 'e', 0.06));
  f.push(F([[70, 70], [98, 130], [104, 162], [36, 162], [42, 130]], 'a', 0));
  f.push(F([[70, 70], [42, 130], [36, 162], [70, 162]], 'a', 0.18)); f.push(F([[70, 70], [98, 130], [104, 162], [70, 162]], 'a', -0.2));
  for (let i = 0; i < 6; i++) { const x = 36 + i * 13.6; f.push(F([[x, 162], [x + 13.6, 162], [x + 6.8, 176]], 'a', i % 2 ? -0.1 : 0.1)); }
  f.push(F([[54, 74], [86, 74], [82, 84], [58, 84]], 'o', 0.06));
  f.push(F([[92, 82], [112, 100], [110, 108], [90, 92]], 'e', -0.1));
  f.push(...kure(70, 50, 22, 'e', { golge: -0.2 }));
  f.push(F(yumusat([[48, 46], [52, 24], [74, 18], [92, 28], [94, 46], [88, 38], [70, 34], [54, 40]], 4, true), 'h', 0.06));
  f.push(F(elips(62, 52, 2.6, 3.2, 8), 'd', 0)); f.push(F(elips(80, 52, 2.6, 3.2, 8), 'd', 0));
  f.push(F([[66, 62], [71, 66], [76, 62]], 'd', 0));
  f.push(F(elips(56, 60, 4.4, 2.6, 8), 'p', 0.05)); f.push(F(elips(86, 60, 4.4, 2.6, 8), 'p', 0));
  f.push(F([[110, 82], [112, 78], [116, 112], [112, 112]], 'k', 0, { part: 'degnek' }));
  f.push(F([[114, 66], [118, 74], [128, 74], [120, 80], [123, 90], [114, 84], [105, 90], [108, 80], [100, 74], [110, 74]], 'g', 0.2, { part: 'degnek' }));
  ekle(K, { id: 'mantar-peri', name: 'Ateş Böceği Perisi', tags: ['peri', 'karakter', 'orman', 'ışık', 'hikaye'], size: [140, 194], palette: { a: '#ff9ac2', e: '#f6d2b0', h: '#7a4a3a', w: '#d4f4ff', v: '#a9e0f0', x: '#ffffff', o: '#ffd27a', d: '#3a2a3a', p: '#ff9a9a', k: '#8a5a3a', g: '#fff3a0' }, parts: { kanatSol: { pivot: [70, 82] }, kanatSag: { pivot: [70, 82] }, degnek: { pivot: [112, 98] } }, variants: { mavi: { name: 'Mavi', palette: { a: '#6aa8ff', w: '#e0ecff' } }, yesil: { name: 'Yeşil', palette: { a: '#6ad69a', w: '#e0ffe8' } } }, facets: f });
}

// ── parlayan çan çiçeği ─────────────────────────────────────────────────
{
  const f = [];
  const sap = egri([[60, 240], [64, 170], [46, 110], [58, 66]], 12);
  f.push(F(boru(sap, (t) => mix(5, 3, t)), 'h', 0.0));
  f.push(F([[62, 190], [100, 160], [108, 176], [64, 204]], 'h', 0.12)); f.push(F([[60, 220], [22, 190], [14, 204], [56, 232]], 'h', -0.1));
  // çan
  f.push(F([[30, 46], [86, 46], [96, 100], [20, 100]], 'g', 0)); f.push(F([[30, 46], [58, 46], [58, 100], [20, 100]], 'g', 0.2)); f.push(F([[58, 46], [86, 46], [96, 100], [58, 100]], 'g', -0.16));
  f.push(F(elips(58, 46, 28, 10, 16), 'h2', 0.1)); f.push(F(elips(58, 98, 38, 12, 18), 'x', 0.05));
  f.push(F(elips(58, 78, 14, 18, 14), 'x', 0.3));
  ekle(K, { id: 'mantar-cicek', name: 'Işık Çiçeği', tags: ['çiçek', 'ışık', 'orman', 'hikaye'], size: [118, 244], palette: { g: '#7ad8ff', h: '#3f9a6a', h2: '#9ae8ff', x: '#e6faff' }, variants: { pembe: { name: 'Pembe', palette: { g: '#ff8ad0', h2: '#ffb0e4', x: '#ffe6f6' } }, sari: { name: 'Sarı', palette: { g: '#ffd24a', h2: '#ffe27a', x: '#fff6cc' } } }, facets: f });
}

// ── salyangoz ───────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F(yumusat([[10, 108], [24, 88], [60, 82], [150, 92], [168, 104], [150, 112], [20, 114]], 4, true), 'b', 0));
  f.push(F(yumusat([[10, 108], [24, 88], [60, 82], [100, 86], [100, 112], [20, 114]], 4, true), 'b', 0.16));
  f.push(F(yumusat([[132, 92], [150, 70], [166, 54], [170, 58], [160, 78], [150, 94]], 4), 'b', 0.0));
  f.push(F(elips(158, 92, 18, 16, 14), 'b', 0.1));
  f.push(F([[150, 82], [146, 56]].map(([x, y]) => [x, y]).concat([[150, 56], [154, 82]]), 'b', 0.0, { part: 'duyargaA' }));
  f.push(F(elips(148, 54, 6, 6, 10), 'd', 0, { part: 'duyargaA' }));
  f.push(F([[160, 82], [166, 52], [170, 52], [166, 84]], 'b', -0.1, { part: 'duyargaB' }));
  f.push(F(elips(168, 50, 6, 6, 10), 'd', 0, { part: 'duyargaB' }));
  f.push(F([[150, 98], [160, 104], [170, 98]], 'd', 0));
  [[56, 66, 54], [56, 66, 42], [56, 66, 30], [56, 66, 18]].forEach(([x, y, r], i) => { f.push(F(elips(x, y, r, r * 0.96, 24), i % 2 ? 'a' : 'c', 0.0 + (i % 2) * 0.08)); f.push(F(hilal(x, y, r, r * 0.96, -40, 140, -r * 0.14, -r * 0.1, 12), 'a', -0.2)); });
  f.push(F(elips(56, 66, 6, 6, 10), 'd', 0));
  ekle(K, { id: 'mantar-salyangoz', name: 'Salyangoz', tags: ['salyangoz', 'hayvan', 'orman', 'karakter', 'hikaye'], size: [180, 120], palette: { a: '#e8863a', c: '#f6c98a', b: '#d9b88a', d: '#2a1f1a' }, parts: { duyargaA: { pivot: [150, 84] }, duyargaB: { pivot: [162, 84] } }, variants: { mor: { name: 'Mor', palette: { a: '#9a6ad6', c: '#d9bef2' } } }, facets: f });
}

// ── yosunlu orman zemini ────────────────────────────────────────────────
{
  const f = [];
  const R = rng(21);
  const W = 1080; const H = 300;
  const ust = (x) => 70 + Math.sin((x / W) * Math.PI * 4 + 1) * 18 + Math.sin((x / W) * Math.PI * 11) * 6;
  const pts = Array.from({ length: 41 }, (_, i) => [(i / 40) * W, ust((i / 40) * W)]);
  f.push(F([...pts, [W, H], [0, H]], 'a', 0));
  // toprak gölge katmanları
  for (let i = 0; i < 40; i++) { const x0 = pts[i][0]; const x1 = pts[i + 1][0]; f.push(F([[x0, pts[i][1] + 46 + (i % 3) * 14], [x1, pts[i + 1][1] + 46 + (i % 3) * 14], [x1, H], [x0, H]], 'b', -0.12 - (i % 3) * 0.04)); }
  // yosun
  const yosun = pts.map(([x, y]) => [x, y - 6 + (x % 3)]);
  const alt = pts.map(([x, y], i) => [x, y + 26 + Math.sin(i * 2.3) * 10 + (i % 2) * 8]).reverse();
  f.push(F([...yosun, ...alt], 'g', 0.04));
  for (let i = 0; i < 40; i++) f.push(F([[yosun[i][0], yosun[i][1]], [yosun[i + 1][0], yosun[i + 1][1]], [yosun[i + 1][0], yosun[i + 1][1] + 12], [yosun[i][0], yosun[i][1] + 12]], i % 2 ? 'g2' : 'g', 0.14));
  // çimen sapları
  for (let i = 0; i < 70; i++) { const x = R() * W; const y = ust(x) - 4; const h = 22 + R() * 46; f.push(F([[x - 5, y + 4], [x + (R() - 0.5) * 20, y - h], [x + 6, y + 4]], i % 3 ? (i % 2 ? 'g' : 'g2') : 'g3', i % 2 ? 0.12 : -0.12)); }
  // taşlar
  for (let i = 0; i < 9; i++) { const x = R() * W; const y = ust(x) + 30 + R() * 80; f.push(...kure(x, y, 12 + R() * 14, 'p', { ry: 8 + R() * 6, golge: -0.2 })); }
  ekle(K, { id: 'mantar-yer', name: 'Yosunlu Zemin', tags: ['zemin', 'yosun', 'orman', 'çimen', 'hikaye'], size: [W, H], palette: { a: '#5a4030', b: '#3f2c22', g: '#4fa35a', g2: '#3b8a48', g3: '#7acb74', p: '#8a8a98' }, variants: { gece: { name: 'Gece', palette: { a: '#3a3450', b: '#2a2540', g: '#2f7a6a', g2: '#22604f', g3: '#4fb090', p: '#5a5a7a' } }, uzak: { name: 'Uzak', palette: { a: '#6a5a62', b: '#564650', g: '#7ab090', g2: '#6a9c82', g3: '#9ac8a8', p: '#9a9aaa' } } }, facets: f });
}
