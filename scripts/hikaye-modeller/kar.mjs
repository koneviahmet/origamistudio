// Hikâye 3 — KAR KÜRESİ: sıcacık kulübeler, karlı çamlar, kardan adam, çocuk, kar tepeleri, aurora, cam küre çerçevesi, sokak lambası, kızak, kar tanesi.
import { F, ekle, elips, kure, hilal, yumusat, kumBandi, cam, yamuk, pencere, delikliCerceve, mix, clamp, rng } from './kit.mjs';

const K = 'hikaye-kar';

// ── kulübe üreteci ──────────────────────────────────────────────────────
function ev({ id, ad, gen = 180, kat = 1, duvar = '#d98a5b', cati = '#7a3b2e', baca = true, etiket = [] }) {
  const f = [];
  const taban = kat * 130 + 190;
  const xL = 70; const xR = xL + gen; const cx = (xL + xR) / 2;
  const yT = taban - 30 - kat * 130;
  const tepe = yT - gen * 0.52;
  const W = gen + 140;
  // kar yığını (arka)
  f.push(F([[0, taban - 6], [xL - 30, taban - 38], [cx, taban - 24], [xR + 30, taban - 40], [W, taban - 6], [cx, taban + 14]], 'w', 0));
  // duvar
  f.push(F([[xL, yT], [xR, yT], [xR, taban - 30], [xL, taban - 30]], 'a', 0));
  f.push(F([[xL, yT], [cx, yT], [cx, taban - 30], [xL, taban - 30]], 'a', 0.16));
  f.push(F([[cx, yT], [xR, yT], [xR, taban - 30], [cx, taban - 30]], 'a', -0.14));
  for (let y = yT + 26; y < taban - 34; y += 26) f.push(F([[xL, y], [xR, y], [xR, y + 2.4], [xL, y + 2.4]], 'b', -0.22));
  // pencereler
  const pen = (x, y) => { f.push(...pencere(x, y, 32, 40, { cerceve: 'f', cam: 'g' })); f.push(F([[x - 6, y + 44], [x + 38, y + 44], [x + 40, y + 51], [x - 8, y + 51]], 'w', 0.1)); };
  for (let k = 0; k < kat; k++) {
    const y = yT + 24 + k * 130;
    if (k === 0 && kat === 1) { pen(xL + 22, y + 22); pen(xR - 54, y + 22); }
    else if (k === kat - 1) { pen(xL + 22, y + 56); pen(xR - 54, y + 56); }
    else { pen(xL + 22, y + 10); pen(xR - 54, y + 10); }
  }
  // kapı
  const dx = cx; const dy = taban - 30;
  f.push(F([[dx - 20, dy], [dx - 20, dy - 44], ...elips(dx, dy - 44, 20, 20, 9, 180, 360), [dx + 20, dy - 44], [dx + 20, dy]], 'f', -0.05));
  f.push(F([[dx - 15, dy], [dx - 15, dy - 44], ...elips(dx, dy - 44, 15, 16, 8, 180, 360), [dx + 15, dy - 44], [dx + 15, dy]], 'k', 0.06));
  f.push(F([[dx - 15, dy], [dx - 15, dy - 44], ...elips(dx, dy - 44, 15, 16, 8, 180, 270), [dx, dy - 60], [dx, dy]], 'k', 0.2));
  f.push(F(elips(dx + 8, dy - 24, 2.4, 2.4, 8), 'g', 0.3));
  f.push(F([[dx - 28, dy], [dx + 28, dy], [dx + 24, dy + 8], [dx - 24, dy + 8]], 'w', 0.05));
  // çatı (karlı)
  f.push(F([[xL - 30, yT + 6], [cx, tepe], [cx, tepe + 38], [xL - 12, yT + 16]], 'r', 0.16));
  f.push(F([[cx, tepe], [xR + 30, yT + 6], [xR + 12, yT + 16], [cx, tepe + 38]], 'r', -0.18));
  // baca
  if (baca) {
    const bx = cx + gen * 0.2;
    const by = tepe + (yT - tepe) * 0.42;
    f.push(F([[bx - 14, by - 40], [bx + 14, by - 40], [bx + 14, by + 20], [bx - 14, by + 20]], 'c', -0.05));
    f.push(F([[bx - 14, by - 40], [bx, by - 40], [bx, by + 20], [bx - 14, by + 20]], 'c', 0.14));
    f.push(F([[bx - 19, by - 48], [bx + 19, by - 48], [bx + 17, by - 38], [bx - 17, by - 38]], 'w', 0.1));
  }
  // kar örtüsü
  const kar = (sol) => {
    const s = sol ? -1 : 1;
    const pts = [[cx, tepe - 8], [cx + s * (gen / 2 + 38), yT - 2]];
    const alt = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = mix(cx + s * (gen / 2 + 38), cx, t);
      const y = mix(yT - 2, tepe - 8, t) + 22 + Math.sin(i * 2.1 + (sol ? 0 : 1)) * 6 + (i % 2 ? 6 : 0);
      alt.push([x, y]);
    }
    return [...pts, ...alt];
  };
  f.push(F(kar(true), 'w', 0.08));
  f.push(F(kar(false), 'w', -0.1));
  // buz sarkıtları
  for (let i = 0; i < 9; i++) { const x = xL - 22 + i * ((gen + 44) / 8); f.push(F([[x - 3, yT + 14 + (x < cx ? -(x - xL) * 0.0 : 0)], [x + 3, yT + 14], [x, yT + 26 + (i % 3) * 7]], 'i', 0.1)); }
  // verandada lamba
  f.push(F(elips(xR - 18, dy - 54, 5, 5, 8), 'g', 0.3));
  ekle(K, {
    id, name: ad, tags: ['ev', 'kulübe', 'kış', 'kar', 'hikaye', ...etiket], size: [W, taban + 20],
    palette: { a: duvar, b: '#b96f48', r: cati, c: '#a3513c', f: '#4b3a37', g: '#ffd27a', h: '#fff1b8', k: '#7a4a2e', w: '#f3f8fd', i: '#cfe8f7' },
    variants: {
      gece: { name: 'Gece', palette: { a: '#8c5d62', b: '#5b4048', r: '#3f2c4a', c: '#6b3b46', f: '#2b2433', w: '#cfdcf0', i: '#a9c4e0' } },
    },
    facets: f,
  });
}
ev({ id: 'kar-ev-1', ad: 'Kar Kulübesi', gen: 190, kat: 1, duvar: '#e0956a', cati: '#7b3f35' });
ev({ id: 'kar-ev-2', ad: 'Kar Evi (iki katlı)', gen: 150, kat: 2, duvar: '#7fa7c9', cati: '#5a4a7a', baca: true });
ev({ id: 'kar-ev-3', ad: 'Kar Evi (küçük)', gen: 130, kat: 1, duvar: '#e6c279', cati: '#a24c3a', baca: false });

// ── karlı çam ───────────────────────────────────────────────────────────
{
  const f = [...cam(90, 330, 320, { kat: 5, ana: 'a', koyu: 'b', govde: 'd', kar: 'w', genislik: 0.4 })];
  [[50, 322, 24], [126, 326, 28], [90, 332, 20]].forEach(([x, y, r]) => f.push(F([[x - r, y + 6], [x, y - r * 0.5], [x + r, y + 6]], 'w', 0.08)));
  ekle(K, { id: 'kar-cam', name: 'Karlı Çam', tags: ['ağaç', 'çam', 'kış', 'kar', 'hikaye'], size: [180, 340], palette: { a: '#3f7d5e', b: '#2a5a48', d: '#5a3d2e', w: '#f3f8fd' }, variants: { gece: { name: 'Gece', palette: { a: '#2b5a5c', b: '#1d4044', w: '#cfdcf0' } } }, facets: f });
}

// ── kardan adam ─────────────────────────────────────────────────────────
{
  const f = [];
  const bk = (cx, cy, r, parca) => {
    const ek = parca ? { part: parca } : {};
    f.push(F(elips(cx, cy, r, r * 0.96, 30), 'w', 0, ek));
    f.push(F(hilal(cx, cy, r, r * 0.96, -60, 120, -r * 0.34, -r * 0.18), 'v', 0, ek));
    f.push(F(elips(cx - r * 0.36, cy - r * 0.42, r * 0.34, r * 0.22, 12), 'x', 0.1, ek));
  };
  // kollar (arkada)
  f.push(F([[60, 168], [30, 150], [10, 118], [14, 114], [34, 140], [64, 158]], 'k', -0.1, { part: 'kolSol' }));
  f.push(F([[22, 138], [8, 138], [10, 128], [24, 130]], 'k', 0.1, { part: 'kolSol' }));
  f.push(F([[140, 168], [170, 152], [190, 124], [186, 120], [166, 144], [136, 158]], 'k', -0.2, { part: 'kolSag' }));
  bk(100, 268, 62); bk(100, 176, 46); bk(100, 104, 34);
  // eşarp
  f.push(F([[66, 132], [134, 132], [138, 146], [62, 146]], 'r', 0.06));
  f.push(F([[100, 132], [134, 132], [138, 146], [100, 146]], 'r', -0.18));
  f.push(F([[116, 142], [134, 144], [140, 196], [118, 200]], 'r', -0.1));
  f.push(F([[118, 160], [138, 160], [139, 168], [117, 168]], 'c', 0.1));
  f.push(F([[118, 182], [140, 182], [140, 190], [118, 190]], 'c', 0.1));
  // şapka
  f.push(F(elips(100, 78, 44, 9, 20), 'd', 0.02));
  f.push(F([[72, 78], [128, 78], [124, 30], [76, 30]], 'd', 0.0));
  f.push(F([[72, 78], [98, 78], [98, 30], [76, 30]], 'd', 0.14));
  f.push(F(elips(100, 30, 24, 6, 16), 'd', 0.08));
  f.push(F([[73, 66], [127, 66], [126, 56], [74, 56]], 'r', 0.06));
  // yüz
  f.push(F(elips(88, 98, 4.4, 5, 10), 'd', 0)); f.push(F(elips(114, 98, 4.4, 5, 10), 'd', 0));
  f.push(F(elips(87, 96, 1.4, 1.4, 6), 'x', 0.3)); f.push(F(elips(113, 96, 1.4, 1.4, 6), 'x', 0.3));
  f.push(F([[96, 106], [140, 112], [96, 117]], 'o', 0.05));
  f.push(F([[96, 106], [140, 112], [118, 111]], 'o', 0.2));
  [[80, 118], [88, 124], [100, 127], [112, 124], [120, 118]].forEach(([x, y]) => f.push(F(elips(x, y, 2.4, 2.4, 6), 'd', 0)));
  f.push(F(elips(76, 110, 7, 4.5, 10), 'p', 0.05)); f.push(F(elips(124, 110, 7, 4.5, 10), 'p', 0.0));
  // düğmeler
  [160, 182, 204].forEach((y) => f.push(F(elips(100, y, 4.4, 4.4, 8), 'd', 0)));
  ekle(K, { id: 'kar-kardan-adam', name: 'Kardan Adam', tags: ['karakter', 'kardan adam', 'kış', 'hikaye'], size: [200, 336], palette: { w: '#f3f8fd', v: '#bcd6ee', x: '#ffffff', k: '#6b4a2e', r: '#d84a4a', c: '#f6efe0', d: '#2b2b3a', o: '#f08a3c', p: '#f6a6a6' }, parts: { kolSol: { pivot: [62, 168] }, kolSag: { pivot: [138, 168] } }, variants: { gece: { name: 'Gece', palette: { w: '#d7e4f4', v: '#9fb7d8', r: '#b23d4a' } } }, facets: f });
}

// ── çocuk ───────────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[32, 190], [52, 190], [52, 222], [28, 222], [28, 210]], 'd', 0));
  f.push(F([[62, 190], [82, 190], [86, 212], [88, 222], [62, 222]], 'd', 0.06));
  f.push(F([[34, 150], [80, 150], [82, 196], [30, 196]], 'p', 0));
  // kalın mont
  f.push(F(yumusat([[26, 104], [42, 94], [70, 94], [88, 104], [96, 160], [90, 198], [24, 198], [16, 160]], 4, true), 'a', 0.0));
  f.push(F(yumusat([[26, 104], [42, 94], [56, 94], [56, 198], [24, 198], [16, 160]], 4, true), 'a', 0.16));
  f.push(F(yumusat([[56, 94], [70, 94], [88, 104], [96, 160], [90, 198], [56, 198]], 4, true), 'a', -0.2));
  f.push(F([[18, 150], [94, 150], [94, 160], [16, 160]], 'b', -0.1));
  f.push(F([[54, 98], [58, 98], [58, 198], [54, 198]], 'b', -0.2));
  // kol (el sallayan)
  f.push(F([[86, 112], [102, 100], [110, 78], [118, 80], [112, 108], [96, 128]], 'a', -0.14, { part: 'kol' }));
  f.push(...kure(114, 74, 8, 'r', { parca: 'kol' }));
  f.push(F([[22, 112], [10, 140], [18, 168], [28, 160], [26, 134]], 'a', 0.1));
  f.push(...kure(18, 172, 7, 'r'));
  // eşarp
  f.push(F([[24, 98], [88, 98], [90, 112], [22, 112]], 'c', 0.05));
  f.push(F([[60, 98], [88, 98], [90, 112], [60, 112]], 'c', -0.16));
  // baş + bere
  f.push(...kure(57, 66, 26, 'e', { golge: -0.16 }));
  f.push(F(elips(44, 72, 3, 3.6, 8), 'd', 0)); f.push(F(elips(68, 72, 3, 3.6, 8), 'd', 0));
  f.push(F(elips(44, 70.6, 1, 1, 6), 'w', 0.3)); f.push(F(elips(68, 70.6, 1, 1, 6), 'w', 0.3));
  f.push(F([[50, 82], [57, 88], [64, 82]], 'd', 0));
  f.push(F(elips(38, 80, 6, 3.6, 8), 'p', 0.06)); f.push(F(elips(76, 80, 6, 3.6, 8), 'p', 0.0));
  f.push(F(yumusat([[28, 62], [32, 40], [57, 28], [82, 40], [86, 62], [80, 56], [57, 50], [34, 56]], 4, true), 'r', 0.06));
  f.push(F(yumusat([[57, 28], [82, 40], [86, 62], [80, 56], [57, 50]], 4), 'r', -0.18));
  f.push(F([[28, 56], [86, 56], [86, 64], [28, 64]], 'c', 0.1));
  f.push(...kure(57, 24, 9, 'c', { golge: -0.12 }));
  ekle(K, { id: 'kar-cocuk', name: 'Kışlık Çocuk', tags: ['karakter', 'çocuk', 'kış', 'hikaye'], size: [124, 226], palette: { a: '#3d7fc4', b: '#2a5f98', r: '#d84a4a', c: '#f6efe0', d: '#3a2f3a', e: '#f0c19a', p: '#f08c8c', w: '#ffffff' }, parts: { kol: { pivot: [90, 112] } }, variants: { sari: { name: 'Sarı', palette: { a: '#e0a93a', b: '#b8832a', r: '#3d7fc4' } } }, facets: f });
}

// ── kar tepeleri ────────────────────────────────────────────────────────
[
  ['uzak', { tepe: [[0.15, 0.6, 0.18], [0.55, 0.85, 0.2], [0.95, 0.5, 0.14]], seed: 41, h: 340 }, { a: '#ffffff', b: '#d3e2f2', c: '#eef5fc' }, { a: '#9fb4d6', b: '#7189b8', c: '#b9c9e4' }],
  ['orta', { tepe: [[0.3, 0.8, 0.2], [0.75, 0.6, 0.18]], seed: 43, h: 340 }, { a: '#ffffff', b: '#c9dbef', c: '#e6f0fa' }, { a: '#8ea6cc', b: '#647ea9', c: '#aebfdc' }],
  ['yakin', { tepe: [[0.2, 0.55, 0.16], [0.6, 0.95, 0.22], [0.95, 0.6, 0.12]], seed: 47, h: 340 }, { a: '#ffffff', b: '#bfd4ec', c: '#e0ecf8' }, { a: '#7f99c4', b: '#566f9e', c: '#a1b4d6' }],
].forEach(([ad, ayar, gun, gece]) => ekle(K, { id: `kar-tepe-${ad}`, name: `Kar tepesi (${ad})`, tags: ['kar', 'tepe', 'kış', 'hikaye'], size: [1080, ayar.h], palette: gun, variants: { gece: { name: 'Gece', palette: gece }, safak: { name: 'Şafak', palette: { a: '#fff1e8', b: '#f0c3c9', c: '#fbe0d6' } } }, facets: kumBandi({ w: 1080, h: ayar.h, ...ayar }) }));

// ── sokak lambası ───────────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[22, 250], [38, 250], [36, 236], [24, 236]], 'd', 0));
  f.push(F([[27, 236], [33, 236], [33, 70], [27, 70]], 'd', 0.1));
  f.push(F([[30, 236], [33, 236], [33, 70], [30, 70]], 'd', -0.3));
  f.push(F([[18, 66], [42, 66], [46, 56], [14, 56]], 'd', 0.05));
  f.push(F([[18, 56], [42, 56], [46, 30], [14, 30]], 'g', 0.02));
  f.push(F([[18, 56], [30, 56], [30, 30], [14, 30]], 'g', 0.22));
  f.push(F(elips(30, 44, 7, 11, 12), 'h', 0.3));
  f.push(F([[10, 30], [50, 30], [30, 8]], 'd', 0));
  f.push(F([[16, 30], [44, 30], [30, 12]], 'w', 0.1));
  f.push(F(elips(30, 6, 3.4, 3.4, 8), 'd', 0));
  ekle(K, { id: 'kar-lamba', name: 'Sokak Lambası', tags: ['lamba', 'ışık', 'kış', 'sokak', 'hikaye'], size: [60, 252], palette: { d: '#2f3446', g: '#ffd27a', h: '#fff1b8', w: '#f3f8fd' }, facets: f });
}

// ── kızak ───────────────────────────────────────────────────────────────
{
  const f = [];
  f.push(F([[10, 80], [170, 80], [182, 70], [190, 62], [196, 70], [186, 86], [10, 90]], 'd', 0));
  f.push(F([[30, 40], [150, 40], [160, 66], [24, 66]], 'r', 0.1));
  f.push(F([[30, 40], [90, 40], [90, 66], [24, 66]], 'r', 0.22));
  f.push(F([[20, 66], [160, 66], [158, 74], [18, 74]], 'k', 0));
  f.push(F([[44, 74], [50, 74], [48, 86], [42, 86]], 'd', 0)); f.push(F([[128, 74], [134, 74], [132, 86], [126, 86]], 'd', 0));
  f.push(F([[170, 66], [186, 62], [188, 66], [170, 70]], 'k', 0));
  ekle(K, { id: 'kar-kizak', name: 'Kızak', tags: ['kızak', 'kış', 'oyun', 'hikaye'], size: [200, 100], palette: { r: '#c4453b', d: '#2f3446', k: '#8a5a32' }, facets: f });
}

// ── aurora ──────────────────────────────────────────────────────────────
{
  const f = [];
  const perde = (y0, genlik, ph, ust, alt, hiz) => {
    const n = 36;
    for (let i = 0; i < n; i++) {
      const x0 = (i / n) * 1080; const x1 = ((i + 1) / n) * 1080;
      const yt = (x) => y0 + Math.sin((x / 1080) * Math.PI * 2 * hiz + ph) * genlik + Math.sin((x / 1080) * Math.PI * 7 + ph * 2) * genlik * 0.25;
      const boy = (x) => 260 + 90 * Math.sin((x / 1080) * Math.PI * 3 + ph);
      f.push(F([[x0, yt(x0)], [x1, yt(x1)], [x1, yt(x1) + boy(x1) * 0.55], [x0, yt(x0) + boy(x0) * 0.55]], ust, 0.1 - (i % 3) * 0.05));
      f.push(F([[x0, yt(x0) + boy(x0) * 0.55], [x1, yt(x1) + boy(x1) * 0.55], [x1, yt(x1) + boy(x1)], [x0, yt(x0) + boy(x0)]], alt, 0.0 + (i % 2) * 0.06));
    }
  };
  perde(60, 50, 0.4, 'a', 'b', 1.4);
  perde(150, 40, 2.0, 'b', 'c', 1.1);
  ekle(K, { id: 'kar-aurora', name: 'Kutup Işıkları', tags: ['aurora', 'gök', 'kış', 'gece', 'hikaye'], size: [1080, 520], palette: { a: '#5de8b0', b: '#2fb8c8', c: '#8a6cf0' }, variants: { mor: { name: 'Mor', palette: { a: '#b48cff', b: '#6c7cff', c: '#ff7ad9' } } }, facets: f });
}

// ── kar küresi çerçevesi (delikli) ──────────────────────────────────────
{
  const W0 = 1080; const H0 = 1920; const cx = 540; const cy = 840; const R = 470;
  const f = delikliCerceve(W0, H0, cx, cy, R, 'd', 0, 72);
  // pirinç halka
  const dis = elips(cx, cy, R + 22, R + 22, 72);
  const ic = elips(cx, cy, R - 4, R - 4, 72).reverse();
  f.push(F([...dis, dis[0], ic[ic.length - 1], ...ic], 'p', 0.1));
  const dis2 = elips(cx, cy, R + 22, R + 22, 36, 150, 330); const ic2 = elips(cx, cy, R + 6, R + 6, 36, 150, 330).reverse();
  f.push(F([...dis2, ...ic2], 'q', 0.3));
  // ahşap kaide
  f.push(F([[0, 1400], [W0, 1400], [W0, H0], [0, H0]], 'k', 0));
  f.push(F([[0, 1400], [W0, 1400], [W0, 1440], [0, 1440]], 'l', 0.2));
  f.push(F([[0, 1440], [W0, 1440], [W0, 1470], [0, 1470]], 'k', -0.2));
  for (let i = 0; i < 6; i++) f.push(F([[0, 1500 + i * 70], [W0, 1500 + i * 70], [W0, 1504 + i * 70], [0, 1504 + i * 70]], 'k', -0.3));
  f.push(F([[250, 1560], [830, 1560], [830, 1690], [250, 1690]], 'p', 0.05));
  f.push(F([[262, 1572], [818, 1572], [818, 1678], [262, 1678]], 'z', 0.0));
  ekle(K, { id: 'kar-kure-cerceve', name: 'Kar Küresi Çerçevesi', tags: ['çerçeve', 'küre', 'kar', 'maske', 'hikaye'], size: [W0, H0], palette: { d: '#120d22', p: '#c8a14a', q: '#f6dc8a', k: '#5a3a26', l: '#8a5a3a', z: '#2a1d30' }, facets: f });
}
// cam yansıması
{
  const cx = 540; const cy = 840;
  const f = [];
  const yay = elips(cx, cy, 440, 440, 24, 195, 255); const ic = elips(cx, cy, 420, 420, 24, 195, 255).reverse();
  f.push(F([...yay, ...ic], 'w', 0.3));
  f.push(F(elips(cx - 330, cy - 280, 36, 22, 14), 'w', 0.3));
  f.push(F(elips(cx + 360, cy + 220, 24, 12, 14), 'w', 0.2));
  ekle(K, { id: 'kar-kure-yansima', name: 'Cam Yansıması', tags: ['yansıma', 'cam', 'küre', 'hikaye'], size: [1080, 1680], palette: { w: '#ffffff' }, facets: f });
}

// ── kar tanesi ──────────────────────────────────────────────────────────
{
  const f = [];
  const kol = (ac) => {
    const r = (ac * Math.PI) / 180; const c = Math.cos(r); const s = Math.sin(r);
    const dn = (x, y) => [60 + x * c - y * s, 60 + x * s + y * c];
    f.push(F([dn(0, -3), dn(50, -2), dn(54, 0), dn(50, 2), dn(0, 3)], 'a', 0.1));
    [[22, 14], [36, 10]].forEach(([x, u]) => { f.push(F([dn(x, -1.6), dn(x + u, -u), dn(x + u + 2, -u + 2), dn(x + 3, 1)], 'a', 0.0)); f.push(F([dn(x, 1.6), dn(x + u, u), dn(x + u + 2, u - 2), dn(x + 3, -1)], 'a', 0.0)); });
  };
  [0, 60, 120, 180, 240, 300].forEach(kol);
  f.push(F(elips(60, 60, 7, 7, 6), 'b', 0.2));
  ekle(K, { id: 'kar-tanesi', name: 'Kar Tanesi', tags: ['kar', 'kış', 'süs', 'hikaye'], size: [120, 120], palette: { a: '#e8f4ff', b: '#ffffff' }, facets: f });
}
