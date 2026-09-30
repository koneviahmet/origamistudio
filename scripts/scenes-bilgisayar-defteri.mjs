// ═══════════════════════════════════════════════════════════════════════════
//  BİLGİSAYARIN ÇİZİM DEFTERİ — aynı konu, bu kez kalemle (serbest mod)
//  Konsept: "Kâğıt uçağın haritası". Kareli bir defter sayfası sonsuza uzar; kâğıt uçak kesik çizgili bir rotayla
//  çağdan çağa uçar, kamera onu KESİNTİSİZ (kesme / geçiş yok) takip eder. Her durakta makine kalemle çizilir ("cizim" stili),
//  kırmızı kalem okları parçaları adlandırır. Önce: node scripts/seed-bilgisayar.mjs ; node scripts/gen-muzik-defter.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJE_ID = 'bilgisayar-defteri';
const PROJE_ADI = 'Bilgisayarın Çizim Defteri';
const W = 1080, H = 1920, FPS = 30;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

const INK = '#1f3a7a', RED = '#d1372a', HILITE = '#ffe27a';
const KALAM = 'Kalam', EL = 'Patrick Hand';
const TEMA = {
  name: 'Kareli Defter', paper: 'mat',
  colors: { arka1: '#f8f3e4', arka2: '#efe7d0', baslik: INK, metin: '#2c3a5c', vurgu: RED },
  background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180, paper: 0.9 }, vignette: 0.12,
};

// ─── Dünya ve zaman planı ─────────────────────────────────────────────────
const N = 8;                                   // durak sayısı (0 = kapak)
const SPACING = 1700;
const YOFF = [0, -320, 280, -240, 330, -300, 260, -220, 0];
const cx = (i) => W / 2 + i * SPACING;
const cy = (i) => H / 2 + YOFF[i];
const X = (i, sx) => Math.round(cx(i) + sx - W / 2);
const Y = (i, sy) => Math.round(cy(i) + sy - H / 2);
const TRAVEL = 1.8, DWELL = 5.4;
const arrive = (i) => (i === 0 ? 0 : 4.5 + TRAVEL + (i - 1) * (DWELL + TRAVEL));
const depart = (i) => (i === 0 ? 4.5 : arrive(i) + DWELL);
const SURE = r2(arrive(N) + 6.7);

const groups = [];
const G = (id, name) => (groups.push({ id, name, collapsed: true }), id);

// ─── Yardımcılar ──────────────────────────────────────────────────────────
const txt = (id, g, i, text, sx, sy, o = {}) => L({
  id, group: g, type: 'text', text, x: X(i, sx), y: Y(i, sy), font: o.font || EL, weight: o.weight || 400, size: o.size || 50,
  color: o.color || INK, align: 'center', lineHeight: 1.15, ...(o.extra || {}),
});
const typed = (t0, sure) => ({ reveal: [k(t0, 0), k(t0 + sure, 1, 'linear')] });
const hero = (id, g, i, asset, sx, sy, px, size, t0, o = {}) => L({
  id, group: g, asset, x: X(i, sx), y: Y(i, sy), anchor: [0.5, 0.5], scale: r2(px / size), ...(o.extra || {}),
  anims: [{ preset: 'cizerek-gir', t: t0, dur: o.dur ?? 1.8 }],
});
/** kırmızı kalemle adlandırma: metin + ok */
const cagri = (id, g, i, text, sx, sy, target, t0, o = {}) => {
  txt(`${id}-m`, g, i, text, sx, sy, { color: RED, size: o.size || 58, extra: { ...typed(t0, 0.8), rotation: o.rot ?? -3 } });
  L({ id: `${id}-o`, group: g, type: 'arrow', arrow: 'ok-el-cizimi', from: `${id}-m`, to: target, color: RED, width: 5.5, bend: o.bend ?? 0.35, toAnchor: o.toAnchor || 'auto', anims: [{ preset: 'cizerek-gir', t: t0 + 0.6, dur: 0.9 }] });
};
/** durak başlığı: yıl (kalem) + vurgu kalemli etiket + alt yazı */
const baslik = (g, i, yil, etiket, altyazi) => {
  const a = arrive(i);
  txt(`d${i}-yil`, g, i, yil, 540, 300, { font: KALAM, weight: 700, size: 200, color: RED, extra: { ...typed(a + 0.1, 0.7), letterSpacing: 2 } });
  txt(`d${i}-etiket`, g, i, etiket, 540, 452, { size: 64, extra: { anims: [{ preset: 'belir', t: a + 0.7, dur: 0.5 }], box: { color: HILITE, radius: 14, padding: [10, 30], opacity: 0.95 }, uppercase: false } });
  txt(`d${i}-alt`, g, i, altyazi, 540, 1290, { font: KALAM, weight: 700, size: 52, extra: typed(a + 1.3, 1.0) });
};

// ═══════════════════════════ ZEMİN: kareli defter ═════════════════════════
L({ id: 'zemin', asset: 'kareli-zemin', x: 7500, y: H / 2 + 30, anchor: [0.5, 0.5], scale: 1, style: 'duz', opacity: 0.55, sfx: false });

// ═══════════════════════════ 0 — KAPAK ════════════════════════════════════
{
  const g = G('g-0', 'Kapak'), i = 0;
  txt('kapak-1', g, i, 'Bilgisayarın', 540, 520, { font: KALAM, weight: 700, size: 150, extra: { textAnims: [{ preset: 'harf-belir', t: 0.3, dur: 0.4, aralik: 0.06 }], shadow: { color: 'rgba(31,58,122,.25)', blur: 0, x: 5, y: 6 } } });
  txt('kapak-2', g, i, 'Çizim Defteri', 540, 700, { font: KALAM, weight: 700, size: 150, color: RED, extra: { textAnims: [{ preset: 'harf-belir', t: 1.1, dur: 0.4, aralik: 0.06 }], shadow: { color: 'rgba(209,55,42,.25)', blur: 0, x: 5, y: 6 } } });
  txt('kapak-3', g, i, 'kâğıt uçakla 190 yıllık yolculuk', 540, 880, { size: 54, extra: typed(2.0, 1.4) });
  cagri('kapak-rehber', g, i, 'rehberimiz', 800, 1010, [X(0, 420), Y(0, 1085)], 3.0, { rot: 4, bend: -0.3 });
}


// ═══════════════════════════ 1 — 1837 ÇARK ════════════════════════════════
{
  const g = G('g-1', '1837 Çark'), i = 1, a = arrive(i);
  baslik(g, i, '1837', 'Analitik Makine', 'Her şey dişlilerle başladı.');
  hero('d1-disli1', g, i, 'disli', 360, 820, 430, 200, a + 0.2, { extra: { palette: { a: '#e8b862', b: '#b98c3a', c: '#f3d995' } } });
  hero('d1-disli2', g, i, 'disli', 660, 900, 250, 200, a + 0.5, { extra: { variant: 'celik', palette: { a: '#aebdd1', b: '#7c8da6', c: '#dbe5f2' } } });
  hero('d1-kart', g, i, 'delikli-kart', 830, 1060, 260, 200, a + 0.9, { dur: 1.3, extra: { rotation: 8 } });
  cagri('d1-c1', g, i, "Babbage'in makinesi", 290, 600, 'd1-disli1', a + 2.0);
  cagri('d1-c2', g, i, 'Lovelace: ilk program', 790, 1185, 'd1-kart', a + 3.0, { bend: -0.3, rot: 3 });
}

// ═══════════════════════════ 2 — 1945 TÜP ═════════════════════════════════
{
  const g = G('g-2', '1945 Tüp'), i = 2, a = arrive(i);
  baslik(g, i, '1945', 'ENIAC', 'Bir salonu dolduran dev.');
  const pal = { a: '#b8c4b5', b: '#8f9f8e', d: '#6c7a72', c: '#ece6d3', k: '#44504a', z: '#77807b' };
  hero('d2-eniac', g, i, 'eniac', 540, 790, 900, 400, a + 0.2, { dur: 2.0, extra: { palette: pal } });
  hero('d2-tupA', g, i, 'vakum-tupu', 125, 985, 240, 200, a + 1.0, { dur: 1.2 });
  hero('d2-tupB', g, i, 'vakum-tupu', 955, 985, 240, 200, a + 1.3, { dur: 1.2 });
  cagri('d2-c1', g, i, '17.000+ vakum tüpü', 330, 1150, 'd2-tupA', a + 2.4, { bend: 0.3 });
  cagri('d2-c2', g, i, '≈ 27 ton', 800, 600, 'd2-eniac', a + 3.3, { bend: -0.3, rot: 4 });
}

// ═══════════════════════════ 3 — 1947 TRANSİSTÖR ══════════════════════════
{
  const g = G('g-3', '1947 Transistör'), i = 3, a = arrive(i);
  baslik(g, i, '1947', 'Transistör', 'Küçük, serin, dayanıklı.');
  hero('d3-tr', g, i, 'transistor', 540, 760, 430, 160, a + 0.2);
  for (let q = 0; q < 7; q++) hero(`d3-mini${q + 1}`, g, i, 'transistor', 150 + q * 130, 1000, 100, 160, a + 1.0 + q * 0.12, { dur: 0.7 });
  cagri('d3-c1', g, i, 'Bell Labs · 1947', 800, 590, 'd3-tr', a + 2.2, { bend: -0.3, rot: 3 });
  cagri('d3-c2', g, i, 'tüpün yerini aldı', 290, 640, 'd3-tr', a + 3.1, { bend: 0.3 });
}

// ═══════════════════════════ 4 — 1971 ÇİP ═════════════════════════════════
{
  const g = G('g-4', '1971 Çip'), i = 4, a = arrive(i);
  baslik(g, i, '1971', 'Mikroişlemci', 'Hesap gücü parmak ucuna sığdı.');
  hero('d4-cip', g, i, 'cip', 540, 830, 450, 200, a + 0.2, { extra: { palette: { a: '#6b7894', b: '#9aa7c4', d: '#e0bf62', v: '#f08a24', w: '#eef1fa' } } });
  cagri('d4-c1', g, i, 'Intel 4004', 250, 640, 'd4-cip', a + 2.0, { bend: 0.3 });
  cagri('d4-c2', g, i, '2.300 transistör', 790, 1110, 'd4-cip', a + 2.9, { bend: -0.3, rot: 3 });
}

// ═══════════════════════════ 5 — 1981 PC ══════════════════════════════════
{
  const g = G('g-5', '1981 PC'), i = 5, a = arrive(i);
  baslik(g, i, '1981', 'Kişisel bilgisayar', 'Bilgisayar masaya geldi.');
  const sc = 2.3, sx0 = 540, sy0 = 830;
  hero('d5-pc', g, i, 'kisisel-bilgisayar', sx0, sy0, 260 * sc, 260, a + 0.2, { extra: { palette: { s: '#2f4a42', v: '#ffe27a' } } });
  txt('d5-ekran', g, i, 'C:\\> MERHABA_', Math.round(sx0 + (74 - 130) * sc), Math.round(sy0 + (48 - 120) * sc), { size: 30, color: '#ffe27a', extra: { align: 'left', ...typed(a + 2.0, 1.2) }, });
  layers[layers.length - 1].align = 'left';
  cagri('d5-c1', g, i, 'Apple II · 1977', 240, 600, 'd5-pc', a + 2.6, { bend: 0.3 });
  cagri('d5-c2', g, i, 'IBM PC · 1981', 810, 1120, 'd5-pc', a + 3.5, { bend: -0.3, rot: 3 });
}

// ═══════════════════════════ 6 — 1991 AĞ ══════════════════════════════════
{
  const g = G('g-6', '1991 Ağ'), i = 6, a = arrive(i);
  baslik(g, i, '1991', 'Dünya çapında ağ', 'Bilgisayarlar birbirine bağlandı.');
  const nodes = [['d6-n1', 'kisisel-bilgisayar', 170, 720, 200, 260], ['d6-n2', 'dizustu', 910, 700, 220, 260], ['d6-n3', 'dizustu', 170, 1010, 220, 260], ['d6-n4', 'kisisel-bilgisayar', 910, 1020, 200, 260]];
  nodes.forEach(([id, as, sx, sy, px, size], q) => hero(id, g, i, as, sx, sy, px, size, a + 0.3 + q * 0.3, { dur: 1.3, extra: as === 'kisisel-bilgisayar' ? { variant: 'gri' } : {} }));
  hero('d6-bulut', g, i, 'bulut', 540, 870, 340, 200, a + 0.3, { dur: 1.3 });
  txt('d6-www', g, i, 'WWW', 540, 880, { font: KALAM, weight: 700, size: 70, color: INK, extra: typed(a + 1.6, 0.6) });
  nodes.forEach(([id], q) => L({
    id: `d6-ok${q + 1}`, group: g, type: 'arrow', arrow: 'ok-noktali-akis', from: id, to: 'd6-bulut', color: INK, bend: q % 2 ? 0.25 : -0.25,
    anims: [{ preset: 'cizerek-gir', t: a + 1.9 + q * 0.3, dur: 1.0 }], rider: { asset: 'bit-1', scale: 0.55, orient: 'sabit' }, ride: [k(a + 3.3 + q * 0.3, 0), k(a + 5.0 + q * 0.3, 1, 'inOutSine')],
  }));
  cagri('d6-c1', g, i, 'World Wide Web', 540, 590, 'd6-bulut', a + 2.6, { bend: 0.2, rot: -2 });
}

// ═══════════════════════════ 7 — 2007 CEP ═════════════════════════════════
{
  const g = G('g-7', '2007 Cep'), i = 7, a = arrive(i);
  baslik(g, i, '2007', 'Akıllı telefon', 'Hepsi artık cebinde.');
  hero('d7-eniac', g, i, 'eniac', 275, 940, 400, 400, a + 0.2, { dur: 1.4, extra: { palette: { a: '#b8c4b5', b: '#8f9f8e', d: '#6c7a72', c: '#ece6d3', k: '#44504a', z: '#77807b' } } });
  hero('d7-tel', g, i, 'modern-telefon', 735, 800, 520, 320, a + 0.6, { dur: 1.8 });
  L({ id: 'd7-ok', group: g, type: 'arrow', arrow: 'ok-serit', from: 'd7-eniac', to: 'd7-tel', color: RED, bend: -0.35,  anims: [{ preset: 'cizerek-gir', t: a + 2.3, dur: 1.3 }] });
  txt('d7-kat', g, i, 'milyonlarca\nkat güçlü', 290, 690, { color: RED, size: 56, extra: { ...typed(a + 2.8, 1.0), rotation: -4 } });
  cagri('d7-c1', g, i, 'iPhone · 2007', 790, 1170, 'd7-tel', a + 3.4, { bend: -0.3, rot: 3 });
}

// ═══════════════════════════ 8 — BUGÜN ════════════════════════════════════
{
  const g = G('g-8', 'Bugün'), i = 8, a = arrive(i);
  txt('d8-yil', g, i, 'Bugün', 540, 300, { font: KALAM, weight: 700, size: 200, color: RED, extra: { ...typed(a + 0.1, 0.7), letterSpacing: 2 } });
  txt('d8-etiket', g, i, 'Bulut ve yapay zekâ', 540, 452, { size: 64, extra: { anims: [{ preset: 'belir', t: a + 0.7, dur: 0.5 }], box: { color: HILITE, radius: 14, padding: [10, 30], opacity: 0.95 } } });
  hero('d8-bulut', g, i, 'bulut', 540, 680, 300, 200, a + 0.2, { dur: 1.3 });
  hero('d8-sunucu', g, i, 'sunucu', 250, 920, 360, 240, a + 0.6, { dur: 1.6, extra: { palette: { a: '#5d6b85', b: '#8797b5', l: '#5ee6f0', d: '#3e495e', k: '#46526a' } } });
  hero('d8-cip', g, i, 'cip', 830, 920, 330, 200, a + 0.9, { dur: 1.6, extra: { variant: 'yapay', palette: { a: '#5a7d8f', b: '#7fb0c4', v: '#19c7d3' } } });
  for (const [q, from] of [['1', 'd8-sunucu'], ['2', 'd8-cip']]) L({ id: `d8-ok${q}`, group: g, type: 'arrow', arrow: 'ok-noktali-akis', from, to: 'd8-bulut', color: INK, anims: [{ preset: 'cizerek-gir', t: a + 2.0 + +q * 0.3, dur: 1.0 }], rider: { asset: 'bit-1', scale: 0.55, orient: 'sabit' }, ride: [k(a + 3.3 + +q * 0.3, 0), k(a + 5.0 + +q * 0.3, 1, 'inOutSine')] });
  cagri('d8-c1', g, i, '10 milyar+ transistör', 800, 1130, 'd8-cip', a + 2.8, { bend: -0.3, rot: 3, size: 52 });
  txt('d8-soru', g, i, 'Sırada ne var?', 540, 1270, { font: KALAM, weight: 700, size: 96, color: RED, extra: { ...typed(a + 3.6, 1.0), shadow: { color: 'rgba(209,55,42,.22)', blur: 0, x: 4, y: 5 } } });
  txt('d8-son', g, i, 'Sıradaki sayfayı sen çiz.', 540, 1390, { size: 52, extra: { anims: [{ preset: 'belir', t: a + 4.9, dur: 0.8 }] } });
}

// ═══════════════════════════ ROTA: kesik çizgi + kâğıt uçak ═══════════════
// Uçak tek katmandır; konumu ve yönü, rota okunun (kavis) BİREBİR aynı yayından örneklenir (arrows.js quad formülü).
const Q = [[X(0, 330), Y(0, 1120)], ...Array.from({ length: N }, (_, q) => [X(q + 1, 340), Y(q + 1, 1440)])];
const ROTA_BEND = (q) => (q % 2 ? 0.11 : -0.11);
const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const deg = (r) => (r * 180) / Math.PI;
function yay(a, b, bend) { // arrows.js: kontrol noktası = orta + sol normal * bend * uzunluk
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const c = [(a[0] + b[0]) / 2 + (dy / len) * bend * len, (a[1] + b[1]) / 2 + (-dx / len) * bend * len];
  const pts = [];
  for (let i = 0; i <= 400; i++) { const t = i / 400, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const at = (u) => {
    const sLen = Math.max(0, Math.min(1, u)) * total;
    let lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < sLen) lo = m; else hi = m; }
    const k2 = (sLen - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
    return { x: pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k2, y: pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k2, ang: deg(Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0])) };
  };
  return { at, total };
}
const YAY = Array.from({ length: N }, (_, q) => yay(Q[q], Q[q + 1], ROTA_BEND(q)));
const M = 60; // yolculuk başına örnek sayısı (her kare ~1 örnek; arası doğrusal)
const ucX = [], ucY = [], ucR = [], foldKeys = {}, flight = [];
const pushRest = (q, tIn, tOut, rIn, rOut, px, py) => {
  ucX.push(k(tIn, px, 'linear'), k(tOut, px, 'linear'));
  ucY.push(k(tIn, py, 'linear'), k(tOut, py, 'linear'));
  ucR.push(k(tIn, rIn, 'linear'), k(tIn + 0.7, 0, 'inOutSine'));
  if (tOut - 0.9 > tIn + 0.7) ucR.push(k(tOut - 0.9, 0, 'linear'), k(tOut - 0.05, rOut, 'inOutSine'));
};
for (let q = 0; q <= N; q++) {
  const tIn = arrive(q), tOut = q === N ? arrive(N) + DWELL - 1.0 : depart(q);
  const rIn = q === 0 ? YAY[0].at(0).ang : YAY[q - 1].at(1).ang;
  const rOut = q === N ? rIn : YAY[q].at(0).ang;
  pushRest(q, tIn, tOut, rIn, rOut, Q[q][0], Q[q][1]);
  if (q < N) {
    const t0 = depart(q);
    const fk = [k(t0, 0)];
    for (let j = 1; j <= M; j++) {
      const p = j / M, u = inOutCubic(p), t = t0 + TRAVEL * p, pt = YAY[q].at(u);
      flight.push({ t, x: pt.x, y: pt.y, ang: pt.ang });
      fk.push(k(t, r2(u), 'linear'));
      if (j < M) { ucX.push(k(t, r2(pt.x), 'linear')); ucY.push(k(t, r2(pt.y), 'linear')); ucR.push(k(t, r2(pt.ang), 'linear')); }
    }
    foldKeys[q] = fk;
    L({
      id: `rota-${q}`, group: 'g-rota', type: 'arrow', arrow: 'ok-kesikli-rota', from: Q[q], to: Q[q + 1], curve: 'kavis', bend: ROTA_BEND(q),
      wobble: 0, head: 'yok', tail: 'yok', color: INK, width: 4.5, fold: fk, sfx: false,
    });
    L({
      id: `serit-${q}`, group: 'g-iz', type: 'arrow', arrow: 'ok-serit', from: Q[q], to: Q[q + 1], curve: 'kavis', bend: ROTA_BEND(q),
      wobble: 0, head: 'yok', tail: 'yok', color: '#ffc2b3', color2: '#ff7a63', width: 34, fold: fk, sfx: false,
      opacity: [k(t0, 0.9), k(arrive(q + 1) + 0.3, 0.9, 'linear'), k(arrive(q + 1) + 1.6, 0, 'linear')],
    });
  }
}
// Finale: ilk durakta deneyim bitince uçak halka atıp sağ üstten çıkar
{
  const t0 = arrive(N) + DWELL - 1.0, T = 2.0, a = Q[N], b = [a[0] + 1300, a[1] - 40];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), tx = dx / len, ty = dy / len, nx = ty, ny = -tx, R = -100;
  let prevAng = ucR[ucR.length - 1].v, prevP = null;
  const pos = (p) => {
    const u = p * p * (3 - 2 * p) * 0.35 + p * 0.65, base = [a[0] + dx * u, a[1] + dy * u];
    const phi = Math.max(0, Math.min(1, (p - 0.22) / 0.34)) * Math.PI * 2;
    const along = -R * Math.sin(phi), off = R * (1 - Math.cos(phi));
    return [base[0] + tx * along + nx * off, base[1] + ty * along + ny * off];
  };
  for (let j = 1; j <= 50; j++) {
    const p = j / 50, P = pos(p), Pp = pos(Math.max(0, p - 0.012));
    let ang = deg(Math.atan2(P[1] - Pp[1], P[0] - Pp[0]));
    while (ang - prevAng > 180) ang -= 360;
    while (ang - prevAng < -180) ang += 360;
    prevAng = ang;
    const t = t0 + T * p;
    flight.push({ t, x: P[0], y: P[1], ang });
    ucX.push(k(t, r2(P[0]), 'linear')); ucY.push(k(t, r2(P[1]), 'linear')); ucR.push(k(t, r2(ang), 'linear'));
  }
}
// ─── İz: kâğıt şeritler + pırıltılar (uçak geçtikçe doğar, savrulup sönerler) ───
const PASTEL = ['#8fb3f2', '#ff9a84', '#ffd54a', '#8fdcc0', '#c7a6ee'];
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
let nz = 0, nk = 0;
const serit = (t, x, y, ang) => {
  const life = 1.5 + rnd() * 0.6, sc = 0.85 + rnd() * 0.6, dx = -30 - rnd() * 60, dy = 50 + rnd() * 90, spin = (rnd() - 0.5) * 360, r0 = ang + (rnd() - 0.5) * 60;
  L({
    id: `iz-${++nz}`, group: 'g-iz', asset: 'serit', style: 'duz', anchor: [0.5, 0.5], palette: { a: PASTEL[nz % PASTEL.length] }, sfx: false,
    start: r2(t - 0.02), end: r2(Math.min(SURE, t + life + 0.05)),
    x: [k(t, r2(x)), k(t + life, r2(x + dx), 'outQuad')], y: [k(t, r2(y)), k(t + life, r2(y + dy), 'inQuad')],
    rotation: [k(t, r2(r0)), k(t + life, r2(r0 + spin), 'outQuad')],
    scale: [k(t, 0.15), k(t + 0.25, sc, 'outBack'), k(t + life, r2(sc * 0.55), 'linear')],
    opacity: [k(t, 0), k(t + 0.12, 1, 'linear'), k(t + life * 0.6, 1, 'linear'), k(t + life, 0, 'linear')],
  });
};
const pirilti = (t, x, y, big) => {
  const life = 0.8 + rnd() * 0.5, sc = big ? 1.0 + rnd() * 0.35 : 0.45 + rnd() * 0.35, ox = (rnd() - 0.5) * 150, oy = (rnd() - 0.5) * 150;
  L({
    id: `par-${++nk}`, group: 'g-iz', asset: 'pirilti', style: 'duz', anchor: [0.5, 0.5], palette: { a: big ? '#fff6b8' : '#ffe27a' }, sfx: false,
    start: r2(t - 0.02), end: r2(Math.min(SURE, t + life + 0.05)),
    x: r2(x + ox), y: [k(t, r2(y + oy)), k(t + life, r2(y + oy + 30), 'linear')],
    rotation: [k(t, 0), k(t + life, 70, 'outQuad')],
    scale: [k(t, 0), k(t + life * 0.35, r2(sc), 'outBack'), k(t + life, 0, 'inQuad')],
  });
};
{
  let dist = 0, nextS = 0, nextP = 40;
  for (let i = 1; i < flight.length; i++) {
    const a = flight[i - 1], b = flight[i];
    dist += Math.hypot(b.x - a.x, b.y - a.y);
    const rad = (b.ang * Math.PI) / 180, tx = b.x - Math.cos(rad) * 95, ty = b.y - Math.sin(rad) * 95;
    while (dist >= nextS) { serit(b.t, tx, ty, b.ang); nextS += 52; }
    while (dist >= nextP) { pirilti(b.t, b.x - Math.cos(rad) * 50, b.y - Math.sin(rad) * 50, nk % 5 === 0); nextP += 95; }
  }
  // varışlarda pırıltı patlaması
  for (let q = 1; q <= N; q++) {
    L({ id: `varis-${q}`, group: 'g-iz', type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: Q[q][0], y: Q[q][1], start: r2(arrive(q) - 0.1), end: r2(arrive(q) + 1.9), life: 1.6, count: 26, size: 34, colors: ['#ffd54a', '#fff6b8', '#ff9a84'], sfx: false });
  }
}
groups.push({ id: 'g-iz', name: 'İz (şerit + pırıltı)', collapsed: true });
groups.push({ id: 'g-rota', name: 'Rota (uçak)', collapsed: true });

// ─── Duraklar arası karalamalar (yolculuk sırasında ekran boş kalmasın) ─────
const KARALA = ['1 + 1 = 10', '0101 1010', '{ ; }', '÷ × − +', '101010', 'Ctrl + Z', '404', '★ ★ ★'];
groups.push({ id: 'g-karala', name: 'Karalamalar', collapsed: true });
for (let q = 0; q < N; q++) {
  const mx = Math.round((cx(q) + cx(q + 1)) / 2), my = Math.round((cy(q) + cy(q + 1)) / 2);
  L({ id: `karala-${q}`, group: 'g-karala', type: 'text', text: KARALA[q], x: mx, y: my - 260 + (q % 2) * 150, font: EL, size: 84, color: INK, opacity: 0.6, rotation: q % 2 ? 6 : -7, align: 'center', sfx: false });
  L({ id: `yildiz-${q}`, group: 'g-karala', asset: 'yildiz', x: mx + (q % 2 ? -120 : 130), y: my + 230 - (q % 2) * 120, anchor: [0.5, 0.5], scale: 0.55, rotation: q * 17, palette: { a: '#ffd54a' }, sfx: false });
}

L({
  id: 'ucak', group: 'g-rota', asset: 'ucak', anchor: [0.5, 0.5], scale: 0.95, x: ucX, y: ucY, rotation: ucR, sfx: false,
  loops: [{ prop: 'y', type: 'sine', amp: 7, period: 2.6 }, { prop: 'rotation', type: 'sine', amp: 2.2, period: 3.1 }],
  anims: [{ preset: 'cizerek-gir', t: 2.2, dur: 1.3 }],
});

// ─── Kamera: durak durak, kesintisiz ──────────────────────────────────────
const camX = [], camY = [], camZ = [];
for (let s = 0; s <= N; s++) {
  const a = arrive(s), d = s === N ? SURE : depart(s);
  camX.push(k(a, cx(s), 'inOutCubic'), k(d, cx(s), 'inOutCubic'));
  camY.push(k(a, cy(s), 'inOutCubic'), k(d, cy(s), 'inOutCubic'));
  camZ.push(k(a, 1, 'inOutSine'), k(d - 0.05, s === N ? 1 : 1.04, 'linear'));
  if (s < N) camZ.push(k((d + arrive(s + 1)) / 2, 0.93, 'inOutSine'));
}

const scene = {
  name: PROJE_ADI, width: W, height: H, fps: FPS, duration: SURE,
  theme: TEMA, style: 'cizim',
  sketch: { ink: INK, width: 3.4, wobble: 1.5, hatch: 6.5, angle: 58, cross: true, wipe: 35, grain: 0.45, split: 0.5 },
  camera: { zoom: camZ, x: camX, y: camY },
  audio: [{ file: 'defter-neseli.wav', start: 0, volume: 0.5, fadeIn: 1, fadeOut: 3, bpm: 96, beatOffset: 0.05 }],
  sfx: { auto: true, volume: 0.4 },
  sections: Array.from({ length: N + 1 }, (_, s) => ({ t: arrive(s), name: ['Kapak', '1837 Çark', '1945 Tüp', '1947 Transistör', '1971 Çip', '1981 PC', '1991 Ağ', '2007 Cep', 'Bugün'][s] })),
  groups,
  formats: [
    { id: 'youtube', name: 'YouTube 16:9', width: 1920, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.46, zoom: 1.3 },
    { id: 'square', name: 'Kare 1:1', width: 1080, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.47, zoom: 1.2 },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
