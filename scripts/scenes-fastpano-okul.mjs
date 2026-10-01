// ═══════════════════════════════════════════════════════════════════════════
//  FASTPANO · OKUL DEFTERİ — "Logonun koridor turu"
//  Kareli okul defteri sayfası sonsuza uzar; fastPano logosu kesik çizgili rotada durak durak uçar, kamera onu kesintisiz
//  izler. Her durakta pastel boyalı çizimler: koridordaki televizyon, QR, içerik türleri (kendi çizdiğim slaytlar),
//  eğitim, internetsiz çalışma, ücretsiz, Play Store + Instagram.
//  Önce: node scripts/seed-fastpano.mjs ; node scripts/seed-fastpano-okul.mjs
//  Sonra: node scripts/scenes-fastpano-okul.mjs → fastpano-okul-yatay + fastpano-okul-dikey (mevcut audio korunur)
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });

const INK = '#5b4b8a', ROSE = '#ff6f8e', HILITE = '#ffe9a8', MINT = '#6fcfb3', SKY = '#8fb0ff', LILAC = '#b897f5', PEACH = '#ffb98a', BUTTER = '#ffd54a';
const HEAD = 'Lilita One', BODY = 'Varela Round';
const TEMA = {
  name: 'Pastel Okul Defteri', paper: 'pastel', adjust: { saturation: 0.95, brightness: 0.03 },
  colors: { arka1: '#fff8ec', arka2: '#f1ecff', baslik: INK, metin: '#6b5f8f', vurgu: ROSE },
  background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 170, paper: 0.8 }, vignette: 0.08,
};

// Zaman planı (sn) — seslendirme süresine göre ayarlı. D[i] = i. durakta kalma süresi
const TRAVEL = 1.6;
const D = [5.2, 6.2, 6.8, 9.6, 7.4, 6.8, 5.2, 9.0];
const N = D.length - 1;
const A = [0];
const DEP = [];
for (let i = 0; i <= N; i++) { DEP[i] = A[i] + D[i]; if (i < N) A[i + 1] = DEP[i] + TRAVEL; }
const SURE = r2(A[N] + D[N]);
const NAMES = ['Kapak', 'Koridor', 'Üç adım', 'İçerik türleri', 'Eğitim', 'İnternetsiz', 'Ücretsiz', 'Play + Instagram'];

function build(V) {
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
  const P = (l, p) => (V ? p : l);
  const SPACING = V ? 1650 : 2100;
  const YOFF = V ? [0, -300, 260, -240, 300, -280, 240, -200] : [0, -200, 160, -180, 200, -160, 140, -120];
  const cx = (i) => W / 2 + i * SPACING, cy = (i) => H / 2 + YOFF[i];
  const X = (i, sx) => Math.round(cx(i) + sx - W / 2), Y = (i, sy) => Math.round(cy(i) + sy - H / 2);
  const layers = [], groups = [];
  const L = (o) => (layers.push(o), o);
  const G = (id, name) => (groups.push({ id, name, collapsed: true }), id);

  // ── yardımcılar ───────────────────────────────────────────────────────
  const typed = (t0, sure) => ({ reveal: [k(t0, 0), k(t0 + sure, 1, 'linear')] });
  /** daktilo yazılan metin (t0 mutlak sn) */
  const say = (id, g, i, text, sx, sy, t0, o = {}) => L({
    id, group: g, type: 'text', text, x: X(i, sx), y: Y(i, sy), font: o.font || BODY, weight: o.weight || 700, size: o.size || 50,
    color: o.color || INK, align: 'center', lineHeight: o.lh || 1.2,
    ...(o.rotation ? { rotation: o.rotation } : {}), ...(o.shadow ? { shadow: o.shadow } : {}),
    ...typed(t0, o.dur ?? Math.min(1.3, 0.05 * text.length + 0.3)),
  });
  /** kutulu etiket, zıplayarak girer */
  const chip = (id, g, i, text, sx, sy, t0, color, o = {}) => L({
    id, group: g, type: 'text', text, x: X(i, sx), y: Y(i, sy), font: o.font || BODY, weight: 800, size: o.size || 50,
    color: o.color || '#ffffff', align: 'center', lineHeight: 1.15, ...(o.rotation ? { rotation: o.rotation } : {}),
    box: { color, radius: o.radius ?? 999, padding: o.padding || [12, 30] }, start: r2(t0), ...(o.end ? { end: r2(o.end) } : {}),
    anims: [{ preset: 'zipla-gir', t: r2(t0), dur: 0.55 }, ...(o.end ? [{ preset: 'sol', t: r2(o.end - 0.4), dur: 0.35 }] : [])],
  });
  const title = (g, i, text, t0, sy = P(150, 290), size = P(112, 104)) => L({
    id: `t${i}-baslik`, group: g, type: 'text', text, x: X(i, W / 2), y: Y(i, sy), font: HEAD, weight: 400, size, color: ROSE, align: 'center',
    textAnims: [{ preset: 'harf-zipla', t: r2(t0), dur: 0.5, aralik: 0.04 }],
    shadow: { color: 'rgba(91,75,138,.22)', blur: 0, x: 4, y: 5 },
  });
  const hero = (id, g, i, asset, sx, sy, px, size, t0, o = {}) => L({
    id, group: g, asset, x: X(i, sx), y: Y(i, sy), anchor: [0.5, 0.5], scale: r2(px / size), ...(o.extra || {}),
    anims: [{ preset: 'cizerek-gir', t: r2(t0), dur: o.dur ?? 1.6 }, ...(o.float ? [{ preset: 'suzul', t: r2(t0 + 2), genlik: o.float, periyot: 3.2 }] : [])],
  });
  const cagri = (id, g, i, text, sx, sy, target, t0, o = {}) => {
    const m = say(`${id}-m`, g, i, text, sx, sy, t0, { color: o.color || ROSE, size: o.size || 54, rotation: o.rot ?? -3 });
    if (o.end) m.end = r2(o.end);
    L({
      ...(o.end ? { end: r2(o.end) } : {}),
      id: `${id}-o`, group: g, type: 'arrow', arrow: 'ok-el-cizimi', from: `${id}-m`, to: target, color: o.color || ROSE, width: 5.5, bend: o.bend ?? 0.35,
      ...(o.toAnchor ? { toAnchor: o.toAnchor } : {}), ...(o.fromAnchor ? { fromAnchor: o.fromAnchor } : {}),
      anims: [{ preset: 'cizerek-gir', t: r2(t0 + 0.5), dur: 0.8 }],
    });
  };
  const arrow = (id, g, from, to, t0, o = {}) => L({
    id, group: g, type: 'arrow', arrow: o.stil || 'ok-el-cizimi', from, to, color: o.color || ROSE, width: o.width || 6, bend: o.bend ?? 0.3,
    ...(o.label ? { label: o.label, labelPos: 0.5, labelOffset: o.labelOffset ?? 44, labelSize: 56, labelColor: o.color || ROSE } : {}),
    ...(o.fromAnchor ? { fromAnchor: o.fromAnchor } : {}), ...(o.toAnchor ? { toAnchor: o.toAnchor } : {}),
    ...(o.extra || {}), anims: [{ preset: 'cizerek-gir', t: r2(t0), dur: o.dur ?? 0.9 }],
  });

  // ── Televizyon + ekran içeriği (hepsi çizim: slaytları biz üretiyoruz) ─────────
  const tvDraw = (id, g, i, sx, sy, w, t0) => {
    hero(id, g, i, 'televizyon', sx, sy, w, 360, t0, { dur: 1.3 });
    const u = w / 360;
    return { id, u, x: X(i, sx), y: Y(i, sy) - 15 * u, g };
  };
  /** spec: { bg, items:[{t:'text'|'model', ...}] } — koordinatlar model birimi (ekran 296×166, merkez 0,0) */
  const slide = (id, tv, t0, t1, spec) => {
    const u = tv.u, S0 = r2(t0), S1 = r2(t1);
    const life = { start: S0, end: S1, anims: [{ preset: 'belir', t: S0, dur: 0.35 }] };
    L({ id: `${id}-fon`, group: tv.g, asset: 'fon', x: tv.x, y: r2(tv.y), anchor: [0.5, 0.5], scaleX: r2((296 * u) / 160), scaleY: r2((166 * u) / 90), palette: { a: spec.bg }, ...life });
    spec.items.forEach((it, q) => {
      if (it.t === 'model') {
        L({ id: `${id}-m${q}`, group: tv.g, asset: it.asset, x: r2(tv.x + it.x * u), y: r2(tv.y + it.y * u), anchor: [0.5, 0.5], scale: r2((it.w * u) / it.nat), rotation: it.rot || 0, ...(it.palette ? { palette: it.palette } : {}), ...life });
      } else {
        L({
          id: `${id}-t${q}`, group: tv.g, type: 'text', text: it.text, x: r2(tv.x + it.x * u), y: r2(tv.y + it.y * u), font: it.font || BODY, weight: it.weight || 800,
          size: r2(it.size * u), color: it.color || INK, align: it.align || 'center', lineHeight: 1.15, ...life,
        });
      }
    });
  };
  const SL = {
    pdf: { bg: '#e6f0ff', items: [{ t: 'model', asset: 'pdf-sayfa', x: -62, y: 0, w: 82, nat: 170 }, { t: 'text', text: 'Ders\nProgramı.pdf', x: 52, y: -12, size: 18, color: INK }, { t: 'text', text: 'Sayfa 1 / 3', x: 52, y: 32, size: 12, color: '#7a6aa8', weight: 600 }] },
    video: { bg: '#ece0ff', items: [{ t: 'model', asset: 'oynat', x: 0, y: -8, w: 150, nat: 260 }, { t: 'text', text: 'Okul tanıtım videosu', x: 0, y: 62, size: 14, color: INK }] },
    resim: { bg: '#e4fbf2', items: [{ t: 'model', asset: 'tepeler', x: 0, y: 28, w: 250, nat: 400 }, { t: 'model', asset: 'yildiz', x: 70, y: -38, w: 52, nat: 160, palette: { a: BUTTER } }, { t: 'text', text: 'Gezi fotoğrafları', x: 0, y: 64, size: 15, color: INK }] },
    nobet: { bg: '#fff6e0', items: [{ t: 'text', text: 'Nöbetçi Öğretmenler', x: 0, y: -60, size: 17, color: ROSE }, { t: 'text', text: 'Bahçe · Ayşe Kaya', x: 0, y: -28, size: 13 }, { t: 'text', text: 'Koridor · Mehmet Demir', x: 0, y: -4, size: 13 }, { t: 'text', text: 'Kantin · Zeynep Aydın', x: 0, y: 20, size: 13 }, { t: 'text', text: 'Giriş · Can Yılmaz', x: 0, y: 44, size: 13 }] },
    duyuru: { bg: '#ffe3ea', items: [{ t: 'model', asset: 'megafon', x: -84, y: 4, w: 84, nat: 260 }, { t: 'text', text: 'DUYURU', x: 40, y: -46, size: 24, color: ROSE }, { t: 'text', text: 'Yarın saat 10.00\'da\nokul fotoğraf çekimi', x: 40, y: 8, size: 14 }] },
    kazananlar: { bg: '#fff3c4', items: [{ t: 'model', asset: 'kupa', x: -86, y: 4, w: 78, nat: 200 }, { t: 'text', text: 'Kazananlar', x: 38, y: -52, size: 22, color: ROSE }, { t: 'text', text: '1. Elif · 95 puan', x: 38, y: -14, size: 14 }, { t: 'text', text: '2. Deniz · 90 puan', x: 38, y: 12, size: 14 }, { t: 'text', text: '3. Ada · 88 puan', x: 38, y: 38, size: 14 }] },
  };

  // ═══ ZEMİN: kareli defter ═══════════════════════════════════════════════
  for (let z = 0; z < (V ? 1 : 2); z++) L({ id: `zemin-${z}`, asset: 'kareli-zemin', x: 7900 + z * 15800, y: H / 2, anchor: [0.5, 0.5], scale: 1, style: 'duz', palette: { a: '#dde6fb', b: '#c9d7f6' }, opacity: 0.55, sfx: false });

  // ═══ 0 · KAPAK ═══════════════════════════════════════════════════════════
  { const g = G('g-0', NAMES[0]), i = 0;
    L({ id: 'kapak-1', group: g, type: 'text', text: 'fastPano', x: X(i, W / 2), y: Y(i, P(430, 620)), font: HEAD, weight: 400, size: P(230, 210), color: ROSE, align: 'center',
      textAnims: [{ preset: 'harf-zipla', t: 0.3, dur: 0.5, aralik: 0.06 }], shadow: { color: 'rgba(91,75,138,.25)', blur: 0, x: 6, y: 7 } });
    say('kapak-2', g, i, 'Okul koridorundaki televizyon için', W / 2, P(610, 830), 1.4, { size: P(60, 56), font: BODY, dur: 1.6 });
    hero('kapak-okul', g, i, 'okul', P(560, 290), P(850, 1140), P(330, 400), 380, 1.0, { dur: 1.6 });
    hero('kapak-tv', g, i, 'televizyon', P(1040, 790), P(850, 1150), P(380, 400), 360, 1.6, { dur: 1.4, float: 6 });
    cagri('kapak-rehber', g, i, 'rehberimiz', P(1700, 520), P(650, 390), 'rehber', 3.0, { rot: 4, bend: -0.3, size: P(56, 54), end: DEP[0] - 0.2 });
  }

  // ═══ 1 · KORİDOR ════════════════════════════════════════════════════════
  { const g = G('g-1', NAMES[1]), i = 1, a = A[i];
    title(g, i, 'Ekran uyumasın!', a + 0.1);
    if (!V) {
      L({ id: 'k-zemin', group: g, asset: 'fon', x: X(i, 960), y: Y(i, 960), anchor: [0.5, 0.5], scaleX: 12, scaleY: 0.35, palette: { a: '#ffd6a5' }, anims: [{ preset: 'cizerek-gir', t: a + 0.2, dur: 1.2 }] });
      hero('k-dolap', g, i, 'dolap', 330, 720, 470, 320, a + 0.4);
      hero('k-kapi', g, i, 'kapi', 1610, 700, 200, 150, a + 0.7);
      say('k-plaka', g, i, '9-A', 1610, 590, a + 1.6, { size: 34, color: INK });
    } else {
      hero('k-dolap', g, i, 'dolap', 250, 1350, 440, 320, a + 0.4);
      hero('k-kapi', g, i, 'kapi', 830, 1320, 190, 150, a + 0.7);
      say('k-plaka', g, i, '9-A', 830, 1215, a + 1.6, { size: 32, color: INK });
    }
    const tv = tvDraw('k-tv', g, i, P(960, 540), P(480, 850), P(780, 900), a + 0.6);
    slide('k-bos', tv, a + 1.6, a + 3.9, { bg: '#4a4170', items: [{ t: 'text', text: 'zzz…', x: 0, y: -10, size: 40, color: '#b9b0e8' }, { t: 'text', text: 'boş ekran', x: 0, y: 34, size: 14, color: '#b9b0e8', weight: 600 }] });
    slide('k-dolu', tv, a + 3.9, a + D[i] + 2, SL.duyuru);
    say('k-alt', g, i, 'Koridordaki televizyon\ncanlı bir pano olsun', P(960, 540), P(870, 400), a + 2.2, { size: P(50, 48), dur: 1.6, lh: 1.25 });
  }

  // ═══ 2 · ÜÇ ADIM ════════════════════════════════════════════════════════
  { const g = G('g-2', NAMES[2]), i = 2, a = A[i];
    title(g, i, '3 adımda hazır', a + 0.1);
    const b = (n) => a + 0.9 + n * 1.7;
    hero('n-tv', g, i, 'televizyon', P(380, 300), P(560, 520), P(440, 430), 360, b(0), { float: 6 });
    chip('n-c1', g, i, '1 · Uygulamayı aç', P(380, 790), P(820, 520), b(0) + 0.6, SKY, { size: P(46, 40) });
    hero('n-qr', g, i, 'qr-kod', P(960, 780), P(550, 960), P(270, 270), 220, b(1), { float: 5 });
    chip('n-c2', g, i, '2 · QR kodu tara', P(960, 310), P(830, 960), b(1) + 0.6, ROSE, { size: P(46, 40) });
    hero('n-tel', g, i, 'modern-telefon', P(1500, 300), P(540, 1330), P(250, 150), 160, b(2), { float: 5 });
    chip('n-c3', g, i, '3 · Yükle ve sırala', P(1500, 790), P(890, 1330), b(2) + 0.6, MINT, { size: P(46, 40), color: '#2f5c4b' });
    arrow('n-ok1', g, 'n-tv', 'n-qr', b(1) - 0.6, { color: ROSE, bend: P(-0.35, 0.3), label: 'tara', fromAnchor: P('sag', 'alt'), toAnchor: P('sol', 'ust') });
    arrow('n-ok2', g, 'n-qr', 'n-tel', b(2) - 0.6, { color: '#3fb596', bend: P(-0.35, -0.3), label: 'yükle', fromAnchor: P('sag', 'alt'), toAnchor: P('sol', 'ust') });
    say('n-not', g, i, 'Ek uygulama gerekmez · tarayıcı yeter', W / 2, P(980, 1500 - 40), b(2) + 1.4, { size: P(46, 38), color: '#6b5f8f', weight: 600 });
  }

  // ═══ 3 · İÇERİK TÜRLERİ (kendi çizdiğim slaytlar) ═══════════════════════
  { const g = G('g-3', NAMES[3]), i = 3, a = A[i];
    title(g, i, 'Onlarca içerik türü', a + 0.1, P(120, 280), P(100, 92));
    const tv = tvDraw('c-tv', g, i, P(960, 540), P(570, 930), P(860, 960), a + 0.3);
    const order = [['pdf', 'PDF', SKY], ['video', 'Video', LILAC], ['resim', 'Resim', MINT], ['nobet', 'Nöbet takip', PEACH], ['duyuru', 'Duyuru', ROSE], ['kazananlar', 'Kazananlar', '#f2b233']];
    const step = (D[i] - 2.4) / order.length;
    order.forEach(([key, name, col], q) => {
      const t0 = a + 1.1 + q * step, t1 = q === order.length - 1 ? a + D[i] + 2 : t0 + step + 0.25;
      slide(`c-s${q}`, tv, t0, t1, SL[key]);
      const left = q % 2 === 0;
      const ex = P(left ? 240 : 1680, 540), ey = P(left ? 360 : 330, 450);
      chip(`c-e${q}`, g, i, name, ex, ey, t0, col, { size: P(58, 58), end: t0 + step + 0.3, color: col === PEACH ? '#7a4a2a' : '#ffffff' });
      const tgt = V ? 'c-tv' : [X(i, left ? 540 : 1380), Y(i, ey + 110)];
      arrow(`c-o${q}`, g, `c-e${q}`, tgt, t0 + 0.25, {
        color: col === PEACH ? '#ff9f68' : col, bend: V ? 0.3 : (left ? 0.18 : -0.18), dur: 0.55, extra: { end: r2(t0 + step + 0.3) },
        fromAnchor: V ? 'alt' : (left ? 'sag' : 'sol'), ...(V ? { toAnchor: 'ust' } : {}),
      });
    });
    chip('c-diger', g, i, '+ onlarca içerik türü daha', W / 2, P(1010, 1330), a + D[i] - 3.3, BUTTER, { size: P(52, 46), color: INK });
    if (V) say('c-diger2', g, i, 'Menü · Geri sayım · Ders durumu · Saat\nÖncesi-Sonrası · Düğün · Zeka sorusu', W / 2, 1450, a + D[i] - 2.4, { size: 34, weight: 600, color: '#6b5f8f', lh: 1.4 });
  }

  // ═══ 4 · EĞİTİM ═════════════════════════════════════════════════════════
  { const g = G('g-4', NAMES[4]), i = 4, a = A[i];
    title(g, i, 'Okullar için birebir', a + 0.1);
    hero('e-okul', g, i, 'okul', P(960, 300), P(470, 800), P(470, 440), 380, a + 0.4, { float: 5 });
    hero('e-kitap', g, i, 'acik-kitap', P(200, 300), P(950, 1130), P(210, 200), 200, a + 1.0);
    hero('e-kalem', g, i, 'kalem', P(170, 120), P(130, 600), P(60, 90), 60, a + 1.2, { extra: { rotation: 25 } });
    const items = [
      ['Ders durumu', P(330, 790), P(300, 560), SKY], ['Nöbet takip', P(330, 790), P(540, 680), PEACH], ['Geri sayım', P(330, 790), P(780, 800), LILAC],
      ['Yemek menüsü', P(1590, 790), P(300, 920), MINT], ['Başarı panosu', P(1590, 790), P(540, 1040), '#f2b233'], ['Duyurular', P(1590, 790), P(780, 1160), ROSE],
    ];
    items.forEach(([txtv, x, y, col], q) => {
      const t0 = a + 1.3 + q * 0.55;
      chip(`e-c${q}`, g, i, txtv, x, y, t0, col, { size: P(50, 42), color: col === PEACH || col === '#f2b233' ? '#5b3b1a' : '#ffffff' });
      arrow(`e-o${q}`, g, `e-c${q}`, 'e-okul', t0 + 0.3, { color: col === PEACH ? '#ff9f68' : col, bend: V ? 0.15 : (q < 3 ? 0.3 : -0.3), width: 5.5, dur: 0.6, ...(V ? { fromAnchor: 'sol', toAnchor: 'sag' } : {}) });
    });
    say('e-alt', g, i, 'Öğretmen ve öğrenci için hazır ekranlar', W / 2, P(960, 1480 - 30), a + 4.4, { size: P(50, 40), color: '#6b5f8f', dur: 1.6 });
  }

  // ═══ 5 · İNTERNET GEREKMEZ ══════════════════════════════════════════════
  { const g = G('g-5', NAMES[5]), i = 5, a = A[i];
    title(g, i, 'internet gerekmez!', a + 0.1);
    hero('i-bulut', g, i, 'bulut', P(960, 540), P(330, 640), P(330, 380), 200, a + 0.4, { float: 6 });
    hero('i-carpi', g, i, 'carpi', P(960, 540), P(330, 640), P(250, 280), 200, a + 1.4, { dur: 0.9 });
    say('i-bulut-t', g, i, 'internet', P(1250, 830), P(330, 640) + 0, a + 1.9, { size: 46, color: '#6b5f8f' });
    layers[layers.length - 1].y = Y(i, P(470, 870));
    layers[layers.length - 1].x = X(i, P(960, 540));
    hero('i-tel', g, i, 'modern-telefon', P(430, 230), P(620, 1000), P(400, 300), 320, a + 1.2, { float: 5 });
    hero('i-tv', g, i, 'televizyon', P(1500, 790), P(640, 1290), P(500, 450), 360, a + 1.5, { float: 5 });
    arrow('i-ok', g, 'i-tel', 'i-tv', a + 2.4, { stil: 'ok-noktali-akis', color: '#3fb596', bend: P(-0.25, 0.3), width: 8, dur: 1.2, label: 'yerel ağ', labelOffset: P(50, 55), extra: { rider: { asset: 'wifi', scale: 0.6, orient: 'sabit' }, ride: [k(a + 3.8, 0), k(a + 5.4, 1, 'inOutSine')] } });
    say('i-alt', g, i, 'Aynı yerel ağda olmanız yeterli', W / 2, P(960, 1490 - 30), a + 3.6, { size: P(52, 40), color: '#6b5f8f', dur: 1.4 });
    if (!V) layers[layers.length - 1].y = Y(i, 960);
  }

  // ═══ 6 · ÜCRETSİZ ═══════════════════════════════════════════════════════
  { const g = G('g-6', NAMES[6]), i = 6, a = A[i];
    L({ id: 'u-ust', group: g, type: 'text', text: 'fastPano', x: X(i, W / 2), y: Y(i, P(240, 480)), font: HEAD, weight: 400, size: P(120, 110), color: INK, align: 'center', textAnims: [{ preset: 'harf-zipla', t: a + 0.1, dur: 0.5, aralik: 0.05 }] });
    chip('u-stamp', g, i, 'ücretsiz!', W / 2, P(540, 880), a + 0.7, ROSE, { font: HEAD, size: P(270, 200), radius: 60, padding: P([24, 80], [22, 46]), rotation: -5 });
    [[P(300, 160), P(340, 560), 260, 12], [P(1620, 930), P(400, 600), 200, -14], [P(240, 200), P(800, 1260), 180, 20], [P(1800, 900), P(700, 1230), 220, -8]].forEach(([sx, sy, px, rot], q) =>
      hero(`u-y${q}`, g, i, 'yildiz', sx, sy, px, 160, a + 1.4 + q * 0.3, { dur: 1.0, extra: { rotation: rot, palette: { a: q % 2 ? '#ff9ab0' : BUTTER } } }));
    say('u-alt', g, i, 'Her okul için, hiçbir ücret ödemeden', W / 2, P(800, 1130), a + 2.4, { size: P(56, 50), color: '#6b5f8f', dur: 1.6 });
    L({ id: 'u-konfeti', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: X(i, W / 2), y: Y(i, P(320, 560)), start: r2(a + 0.9), end: r2(a + D[i]) });
  }

  // ═══ 7 · PLAY + INSTAGRAM ═══════════════════════════════════════════════
  { const g = G('g-7', NAMES[7]), i = 7, a = A[i];
    title(g, i, 'Hemen dene!', a + 0.1, P(150, 300), P(130, 120));
    hero('s-play', g, i, 'play-rozet', P(610, 540), P(520, 650), P(260, 240), 200, a + 0.7, { float: 6 });
    chip('s-play-t', g, i, "Google Play'den indir", P(610, 540), P(760, 820), a + 1.6, MINT, { size: P(52, 46), color: '#2f5c4b' });
    hero('s-ig', g, i, 'instagram', P(1310, 540), P(520, 1080), P(260, 240), 180, a + 2.4, { float: 6 });
    chip('s-ig-t', g, i, 'instagram.com/fastpano', P(1310, 540), P(760, 1250), a + 3.3, LILAC, { size: P(48, 42) });
    say('s-site', g, i, 'fastpano.com', W / 2, P(930, 1400), a + 4.4, { size: P(62, 58), color: ROSE, font: HEAD, weight: 400 });
    L({ id: 's-konfeti', group: g, type: 'particles', particle: 'yildiz-yagmuru', mode: 'surekli', x: X(i, W / 2), y: Y(i, 0), start: r2(a + 2), end: r2(SURE), opacity: 0.85 });
  }

  // ═══ ROTA + REHBER LOGO ═════════════════════════════════════════════════
  // Rehberin her durakta "oturduğu" yer: içeriğin yanında, metne değmeden, içeriğe bağlı (kapakta başlığın yanı, koridorda dolap-kapı arası, sonda iki rozetin arası)
  const QL = V
    ? [[880, 450], [570, 1390], [930, 700], [930, 450], [480, 1300], [850, 960], [540, 1330], [850, 650]]
    : [[1700, 400], [1400, 905], [1560, 190], [1720, 860], [1700, 940], [1450, 430], [1620, 930], [960, 520]];
  const Q = QL.map(([sx, sy], q) => [X(q, sx), Y(q, sy)]);
  const BEND = (q) => (q % 2 ? 0.11 : -0.11);
  const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const deg = (r) => (r * 180) / Math.PI;
  const yay = (a0, b0, bend) => {
    const dx = b0[0] - a0[0], dy = b0[1] - a0[1], len = Math.hypot(dx, dy);
    const c = [(a0[0] + b0[0]) / 2 + (dy / len) * bend * len, (a0[1] + b0[1]) / 2 + (-dx / len) * bend * len];
    const pts = [];
    for (let s = 0; s <= 400; s++) { const t = s / 400, u = 1 - t; pts.push([u * u * a0[0] + 2 * u * t * c[0] + t * t * b0[0], u * u * a0[1] + 2 * u * t * c[1] + t * t * b0[1]]); }
    const cum = [0];
    for (let s = 1; s < pts.length; s++) cum.push(cum[s - 1] + Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]));
    const total = cum[cum.length - 1];
    const at = (u) => {
      const sl = Math.max(0, Math.min(1, u)) * total;
      let lo = 0, hi = pts.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < sl) lo = m; else hi = m; }
      const f = (sl - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
      return { x: pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, y: pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f, ang: deg(Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0])) };
    };
    return { at };
  };
  const YAY = Array.from({ length: N }, (_, q) => yay(Q[q], Q[q + 1], BEND(q)));
  const M = 50, gX = [], gY = [], gR = [], flight = [];
  const tilt = (ang) => r2(ang * 0.35); // logo yola baksın ama okunur kalsın
  for (let q = 0; q <= N; q++) {
    const tIn = A[q], tOut = q === N ? SURE : DEP[q];
    gX.push(k(tIn, Q[q][0], 'linear'), k(tOut, Q[q][0], 'linear'));
    gY.push(k(tIn, Q[q][1], 'linear'), k(tOut, Q[q][1], 'linear'));
    const rIn = q === 0 ? 0 : tilt(YAY[q - 1].at(1).ang);
    gR.push(k(tIn, rIn, 'linear'), k(tIn + 0.6, 0, 'inOutSine'));
    if (q < N) {
      const t0 = DEP[q], fk = [k(t0, 0)];
      if (tOut - 0.8 > tIn + 0.6) gR.push(k(tOut - 0.8, 0, 'linear'));
      gR.push(k(tOut - 0.02, tilt(YAY[q].at(0).ang), 'linear'));
      for (let j = 1; j <= M; j++) {
        const p = j / M, u = inOutCubic(p), t = t0 + TRAVEL * p, pt = YAY[q].at(u);
        flight.push({ t, x: pt.x, y: pt.y, ang: pt.ang });
        fk.push(k(t, r2(u), 'linear'));
        if (j < M) { gX.push(k(t, r2(pt.x), 'linear')); gY.push(k(t, r2(pt.y), 'linear')); gR.push(k(t, tilt(pt.ang), 'linear')); }
      }
      L({ id: `rota-${q}`, group: 'g-rota', type: 'arrow', arrow: 'ok-kesikli-rota', from: Q[q], to: Q[q + 1], curve: 'kavis', bend: BEND(q), wobble: 0, head: 'yok', tail: 'yok', color: INK, width: 4.5, fold: fk, sfx: false, opacity: [k(t0, 1), k(A[q + 1], 1, 'linear'), k(A[q + 1] + 1.0, 0, 'linear')] });
      L({ id: `serit-${q}`, group: 'g-iz', type: 'arrow', arrow: 'ok-serit', from: Q[q], to: Q[q + 1], curve: 'kavis', bend: BEND(q), wobble: 0, head: 'yok', tail: 'yok', color: '#ffd6e0', color2: '#ffb3c6', width: 30, fold: fk, sfx: false,
        opacity: [k(t0, 0.85), k(A[q + 1] + 0.3, 0.85, 'linear'), k(A[q + 1] + 1.5, 0, 'linear')] });
    }
  }
  // iz: pastel şeritler + pırıltı
  const PAST = ['#8fb3f2', '#ff9ab0', '#ffd54a', '#8fdcc0', '#c7a6ee'];
  let seed = 23; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  let nz = 0, nk = 0;
  const serit = (t, x, y, ang) => {
    const life = 1.4 + rnd() * 0.6, sc = 0.8 + rnd() * 0.6, dx = -30 - rnd() * 60, dy = 50 + rnd() * 90, spin = (rnd() - 0.5) * 360, r0 = ang + (rnd() - 0.5) * 60;
    L({ id: `iz-${++nz}`, group: 'g-iz', asset: 'serit', style: 'duz', anchor: [0.5, 0.5], palette: { a: PAST[nz % PAST.length] }, sfx: false, start: r2(t - 0.02), end: r2(Math.min(SURE, t + life + 0.05)),
      x: [k(t, r2(x)), k(t + life, r2(x + dx), 'outQuad')], y: [k(t, r2(y)), k(t + life, r2(y + dy), 'inQuad')], rotation: [k(t, r2(r0)), k(t + life, r2(r0 + spin), 'outQuad')],
      scale: [k(t, 0.15), k(t + 0.25, sc, 'outBack'), k(t + life, r2(sc * 0.55), 'linear')], opacity: [k(t, 0), k(t + 0.12, 1, 'linear'), k(t + life * 0.6, 1, 'linear'), k(t + life, 0, 'linear')] });
  };
  const pirilti = (t, x, y, big) => {
    const life = 0.8 + rnd() * 0.5, sc = big ? 1.0 + rnd() * 0.3 : 0.45 + rnd() * 0.35, ox = (rnd() - 0.5) * 150, oy = (rnd() - 0.5) * 150;
    L({ id: `par-${++nk}`, group: 'g-iz', asset: 'pirilti', style: 'duz', anchor: [0.5, 0.5], palette: { a: big ? '#fff6b8' : '#ffe27a' }, sfx: false, start: r2(t - 0.02), end: r2(Math.min(SURE, t + life + 0.05)),
      x: r2(x + ox), y: [k(t, r2(y + oy)), k(t + life, r2(y + oy + 30), 'linear')], rotation: [k(t, 0), k(t + life, 70, 'outQuad')], scale: [k(t, 0), k(t + life * 0.35, r2(sc), 'outBack'), k(t + life, 0, 'inQuad')] });
  };
  { let dist = 0, nextS = 0, nextP = 40;
    for (let s = 1; s < flight.length; s++) {
      const a0 = flight[s - 1], b0 = flight[s];
      dist += Math.hypot(b0.x - a0.x, b0.y - a0.y);
      const rad = (b0.ang * Math.PI) / 180, tx = b0.x - Math.cos(rad) * 80, ty = b0.y - Math.sin(rad) * 80;
      while (dist >= nextS) { serit(b0.t, tx, ty, b0.ang); nextS += 56; }
      while (dist >= nextP) { pirilti(b0.t, b0.x - Math.cos(rad) * 50, b0.y - Math.sin(rad) * 50, nk % 5 === 0); nextP += 100; }
    }
    for (let q = 1; q <= N; q++) L({ id: `varis-${q}`, group: 'g-iz', type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: Q[q][0], y: Q[q][1], start: r2(A[q] - 0.1), end: r2(A[q] + 1.9), life: 1.6, count: 24, size: 32, colors: ['#ffd54a', '#fff6b8', '#ff9ab0'], sfx: false });
  }
  groups.push({ id: 'g-iz', name: 'İz (şerit + pırıltı)', collapsed: true }, { id: 'g-rota', name: 'Rota + rehber', collapsed: true }, { id: 'g-karala', name: 'Karalamalar', collapsed: true });

  // karalamalar (duraklar arası)
  const KARALA = ['2 + 2 = 4', 'A B C', 'π ≈ 3,14', '★ ★ ★', 'A+', 'x² + 1', '√49 = 7'];
  for (let q = 0; q < N; q++) {
    const mx = Math.round((cx(q) + cx(q + 1)) / 2), my = Math.round((cy(q) + cy(q + 1)) / 2);
    L({ id: `karala-${q}`, group: 'g-karala', type: 'text', text: KARALA[q], x: mx, y: my - P(180, 260) + (q % 2) * 120, font: BODY, weight: 700, size: P(76, 84), color: INK, opacity: 0.5, rotation: q % 2 ? 6 : -7, align: 'center', sfx: false });
    L({ id: `yildiz-${q}`, group: 'g-karala', asset: 'yildiz', x: mx + (q % 2 ? -120 : 130), y: my + P(170, 230) - (q % 2) * 100, anchor: [0.5, 0.5], scale: 0.5, rotation: q * 17, palette: { a: PAST[q % 5] }, sfx: false });
  }

  // rehber logo
  L({ id: 'rehber', group: 'g-rota', type: 'media', src: 'fp-logo.png', x: gX, y: gY, rotation: gR, width: P(170, 150), height: r2((P(170, 150) * 193) / 240), fit: 'sigdir', radius: 0, shadow: false, sfx: false,
    loops: [{ prop: 'y', type: 'sine', amp: 8, period: 2.6 }],
    anims: [{ preset: 'zipla-gir', t: 1.6, dur: 0.8 }] });

  // kamera
  const camX = [], camY = [], camZ = [];
  for (let s = 0; s <= N; s++) {
    const a0 = A[s], d0 = s === N ? SURE : DEP[s];
    camX.push(k(a0, cx(s), 'inOutCubic'), k(d0, cx(s), 'inOutCubic'));
    camY.push(k(a0, cy(s), 'inOutCubic'), k(d0, cy(s), 'inOutCubic'));
    camZ.push(k(a0, 1, 'inOutSine'), k(d0 - 0.05, s === N ? 1 : 1.03, 'linear'));
    if (s < N) camZ.push(k((d0 + A[s + 1]) / 2, 0.94, 'inOutSine'));
  }
  return { layers, groups, W, H, camera: { zoom: camZ, x: camX, y: camY } };
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const V of [false, true]) {
  const id = V ? 'fastpano-okul-dikey' : 'fastpano-okul-yatay';
  const { layers, groups, W, H, camera } = build(V);
  const dir = path.join(ROOT, 'data', 'projects', id);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'scene.json');
  let audio = [];
  try { audio = JSON.parse(fs.readFileSync(file, 'utf8')).audio || []; } catch {}
  const scene = {
    name: V ? 'fastPano Okul Defteri (dikey)' : 'fastPano Okul Defteri (yatay)', width: W, height: H, fps: 30, duration: SURE,
    theme: TEMA, style: 'cizim',
    sketch: { ink: INK, width: 3.2, wobble: 1.4, hatch: 6.5, angle: 58, cross: true, wipe: 35, grain: 0.4, split: 0.5 },
    camera, audio, sfx: { auto: true, volume: 0.4 },
    sections: NAMES.map((name, s) => ({ t: A[s], name })),
    groups, layers: JSON.parse(JSON.stringify(layers)),
  };
  fs.writeFileSync(file, JSON.stringify(scene, null, 2) + '\n');
  if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
  console.log(`ok — ${id}: ${scene.layers.length} katman, ${SURE} sn`);
}
