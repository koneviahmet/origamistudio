// fastPano tanıtım videosu — "Pastel Slayt Rüyası": yatay (16:9) + dikey (9:16)
//   node scripts/scenes-fastpano.mjs   →  data/projects/fastpano-yatay + fastpano-dikey
// Ses/müzik betikleri sahne.audio'ya yazar; bu üreteç mevcut audio'yu korur.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });

// Bölüm başlangıçları (sn) — seslendirme süresine göre ayarlı
const S = { a: 0, b: 7.5, c: 16, d: 30.5, e: 40.2, f: 47.2 };
const SURE = 53;

const THEME = {
  name: 'Pastel Slayt Rüyası',
  paper: 'pastel',
  adjust: { saturation: 0.9, brightness: 0.03 },
  colors: { arka1: '#fff1e6', arka2: '#e4e9ff', baslik: '#5b4b8a', metin: '#7a6aa8', vurgu: '#ff8fa3' },
  background: { type: 'linear', colors: ['$arka1', '#f3e8ff', '$arka2'], angle: 160 },
  vignette: 0.08,
};
const PASTEL = { mint: '#a8e6cf', sky: '#9ab8ff', butter: '#ffe29a', lilac: '#c9a7ff', rose: '#ff8fa3', peach: '#ffc8a2' };
const HEAD = 'Fraunces';
const BODY = 'Lexend';

function build(V) {
  const W = V ? 1080 : 1920;
  const H = V ? 1920 : 1080;
  const P = (l, p) => (V ? p : l); // yatay / dikey değer seç
  const layers = [];
  const L = (o) => (layers.push(o), o);

  // ── yardımcılar
  const txt = (id, group, text, x, y, t0, t1, o = {}) => L({
    id, group, type: 'text', text, x, y, start: t0, end: t1 || undefined, font: o.font || BODY, weight: o.weight || 600, size: o.size || 52,
    color: o.color || '$baslik', align: 'center', lineHeight: o.lineHeight || 1.18,
    ...(o.box ? { box: { color: o.box, radius: o.radius ?? 999, padding: o.padding || [14, 34] } } : {}),
    ...(o.rotation ? { rotation: o.rotation } : {}),
    ...(o.textAnim ? { textAnims: [{ preset: o.textAnim, t: t0 + (o.delay ?? 0.25), dur: 0.5, aralik: 0.045 }] } : {}),
    anims: [
      ...(o.textAnim ? [] : [{ preset: o.anim || 'zipla-gir', t: t0 + (o.delay ?? 0.25), dur: 0.6 }]),
      ...(o.noExit || !t1 ? [] : [{ preset: 'sol', t: t1 - 0.45, dur: 0.35 }]),
      ...(o.float ? [{ preset: 'suzul', t: t0 + 1, genlik: o.float, periyot: 3.2 }] : []),
    ],
  });
  const model = (id, group, asset, x, y, widthPx, natW, t0, t1, o = {}) => L({
    id, group, asset, x, y, style: 'kagit-kesme', scale: r2(widthPx / natW), start: t0, end: t1 || undefined, ...(o.variant ? { variant: o.variant } : {}),
    anims: [
      { preset: 'katlanarak-gir', t: t0 + (o.delay ?? 0.1), dur: 0.9, sira: 'radial' },
      { preset: 'suzul', t: t0 + 1.2, genlik: o.float ?? 8, periyot: 3 + (o.phase ?? 0) },
      ...(t1 ? [{ preset: 'kuculerek-cik', t: t1 - 0.6, dur: 0.5 }] : []),
    ],
  });
  const logo = (id, group, x, y, w, t0, t1) => L({
    id, group, type: 'media', src: 'fp-logo.png', x, y, width: w, height: r2((w * 193) / 240), fit: 'sigdir', radius: 0, shadow: false,
    start: t0, end: t1 || undefined,
    anims: [{ preset: 'zipla-gir', t: t0 + 0.15, dur: 0.7 }, { preset: 'nefes', t: t0 + 1, genlik: 0.03, periyot: 2.8 }],
  });
  const ok = (id, group, from, to, t0, t1, o = {}) => L({
    id, group, type: 'arrow', arrow: 'ok-el-cizimi', from, to, start: t0, end: t1,
    color: o.color || '#ff8fa3', bend: o.bend ?? 0.3, width: o.width || 7, headSize: 40,
    ...(o.label ? { label: o.label, labelPos: 0.5, labelOffset: o.labelOffset ?? 46, labelSize: o.labelSize || 60, labelColor: o.color || '#ff8fa3' } : {}),
    ...(o.fromAnchor ? { fromAnchor: o.fromAnchor } : {}), ...(o.toAnchor ? { toAnchor: o.toAnchor } : {}),
    anims: [{ preset: 'cizerek-gir', t: t0, dur: o.dur || 0.9 }, { preset: 'silinerek-cik', t: t1 - 0.6, dur: 0.5 }],
  });
  /** Televizyon + ekranda değişen gerçek slayt görüntüleri. screens: [{src,t0,t1,id}] */
  const tv = (id, group, cx, cy, w, t0, t1, screens, o = {}) => {
    const s = w / 360;
    model(id, group, 'televizyon', cx, cy, w, 360, t0, t1, { variant: o.variant, float: o.float ?? 6 });
    screens.forEach((sc, i) => {
      const last = i === screens.length - 1;
      L({
        id: sc.id || `${id}-ekran-${i}`, group, type: 'media', src: sc.src, x: cx, y: r2(cy - 15 * s + (o.float ? 0 : 0)), width: r2(296 * s), height: r2(166 * s),
        fit: 'kapla', radius: 8, shadow: false, start: sc.t0, end: last ? t1 : screens[i + 1].t0 + 0.6,
        anims: [{ preset: 'belir', t: sc.t0, dur: i === 0 ? 0.9 : 0.45 }, ...(last ? [{ preset: 'kuculerek-cik', t: t1 - 0.6, dur: 0.5 }] : [])],
      });
    });
  };

  // ── ortak: yıldız tozu (tüm video)
  L({ id: 'toz', type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', x: W / 2, y: H / 2, opacity: 0.8 });

  // ═══ A · Açılış ═══════════════════════════════════════════════════════
  const gA = 'g-acilis';
  logo('a-logo', gA, P(560, 540), P(300, 430), P(230, 250), S.a, S.b);
  txt('a-baslik', gA, 'fastPano', P(560, 540), P(520, 640), S.a + 0.2, S.b, { font: HEAD, weight: 800, size: P(190, 200), textAnim: 'harf-zipla', noExit: false });
  txt('a-alt', gA, V ? 'Televizyonunu saniyeler içinde\nslayt ekranına çevir' : 'Televizyonunu saniyeler içinde\nslayt ekranına çevir', P(560, 540), P(720, 850), S.a + 1.3, S.b,
    { size: P(54, 58), color: '$metin', weight: 500, lineHeight: 1.3 });
  tv('a-tv', gA, P(1420, 540), P(560, 1330), P(860, 900), S.a + 0.6, S.b, [
    { src: 'fp-collage.png', t0: S.a + 0.8, t1: 0 },
    { src: 'fp-countdown.png', t0: S.a + 4.2, t1: 0 },
  ]);
  L({ id: 'a-konfeti', group: gA, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: P(300, 500), start: 1.2, end: S.b });

  // ═══ B · Nasıl çalışır ════════════════════════════════════════════════
  const gB = 'g-nasil';
  const b0 = S.b;
  txt('b-baslik', gB, 'Üç adımda hazır', W / 2, P(130, 300), b0, S.c, { font: HEAD, weight: 800, size: P(92, 110), textAnim: 'harf-don' });
  const bt = (i) => b0 + 0.6 + i * 2.6;
  // adım 1 — TV
  tv('b-tv', gB, P(400, 300), P(520, 520), P(430, 440), bt(0), S.c, [{ src: 'fp-menu.png', t0: bt(0) + 0.9, id: 'b-ekran' }]);
  txt('b-c1', gB, '1 · Uygulamayı aç', P(400, 790), P(800, 520), bt(0) + 0.4, S.c, { size: P(46, 42), box: PASTEL.sky, color: '#ffffff', weight: 700 });
  // adım 2 — QR
  model('b-qr', gB, 'qr-kod', P(960, 780), P(520, 960), P(270, 280), 220, bt(1), S.c, { phase: 0.5 });
  txt('b-c2', gB, '2 · QR kodu tara', P(960, 310), P(800, 960), bt(1) + 0.4, S.c, { size: P(46, 42), box: PASTEL.rose, color: '#ffffff', weight: 700 });
  // adım 3 — telefon
  model('b-tel', gB, 'modern-telefon', P(1500, 300), P(520, 1340), P(250, 150), 160, bt(2), S.c, { phase: 1 });
  txt('b-c3', gB, '3 · Yükle ve sırala', P(1500, 790), P(870, 1340), bt(2) + 0.4, S.c, { size: P(46, 42), box: PASTEL.mint, color: '#3d5a4c', weight: 700 });
  ok('b-ok1', gB, 'b-tv', 'b-qr', bt(1) - 0.7, S.c, { bend: P(-0.35, 0.3), label: 'tara', color: PASTEL.rose, toAnchor: P('sol', 'ust'), fromAnchor: P('sag', 'alt') });
  ok('b-ok2', gB, 'b-qr', 'b-tel', bt(2) - 0.7, S.c, { bend: P(-0.35, -0.3), label: 'yükle', color: '#58b59a', toAnchor: P('sol', 'ust'), fromAnchor: P('sag', 'alt') });
  if (!V) {
    model('b-wifi', gB, 'wifi', 590, 960, 120, 220, bt(2) + 0.6, S.c, { float: 4 });
    txt('b-wifi-t', gB, 'Aynı Wi-Fi ağında olmanız yeterli', 1120, 960, bt(2) + 0.8, S.c, { size: 46, weight: 500, color: '$metin' });
  }

  // ═══ C · Hazır içerik türleri (gerçek ekranlar) ═══════════════════════
  const gC = 'g-tipler';
  const c0 = S.c;
  txt('c-baslik', gC, 'Hazır içerik türleri', W / 2, P(120, 290), c0, S.d, { font: HEAD, weight: 800, size: P(84, 100), textAnim: 'harf-zipla' });
  const screens = [
    ['fp-collage.png', 'Kolaj', PASTEL.sky], ['fp-menu.png', 'Menü', PASTEL.mint], ['fp-countdown.png', 'Geri sayım', PASTEL.lilac],
    ['fp-quote.png', 'Saat', PASTEL.rose], ['fp-winners.png', 'Kazananlar', '#f5b942'], ['fp-wedding.png', 'Duyuru', PASTEL.peach],
  ];
  const step = (S.d - c0 - 1.2) / screens.length;
  const cTvX = W / 2, cTvY = P(610, 985), cTvW = P(1000, 960);
  tv('c-tv', gC, cTvX, cTvY, cTvW, c0 + 0.2, S.d, screens.map(([src], i) => ({ src, id: `c-ekran-${i}`, t0: c0 + 0.9 + i * step })));
  screens.forEach(([, name, col], i) => {
    const t0 = c0 + 0.9 + i * step, t1 = t0 + step + 0.2;
    const left = i % 2 === 0;
    const cx = P(left ? 330 : 1590, 540), cy = P(left ? 360 : 330, 505);
    txt(`c-etiket-${i}`, gC, name, cx, cy, t0, t1, { size: P(62, 64), box: col, color: '#ffffff', weight: 800, noExit: false, anim: 'zipla-gir', delay: 0.05 });
    ok(`c-ok-${i}`, gC, `c-etiket-${i}`, `c-ekran-${i}`, t0 + 0.25, t1, {
      color: col === PASTEL.peach ? '#ff9f68' : col, bend: P(left ? 0.3 : -0.3, 0.35), width: 7, dur: 0.6,
      fromAnchor: P(left ? 'sag' : 'sol', 'alt'), toAnchor: P(left ? 'sol' : 'sag', 'ust'),
    });
  });
  if (V) txt('c-diger', gC, 'Öncesi-Sonrası · Düğün · Ürün\nSözler · Zeka Sorusu · Ders Durumu', W / 2, 1480, c0 + 3, S.d, { size: 38, weight: 500, color: '$metin', lineHeight: 1.4 });
  else txt('c-diger', gC, 'Öncesi-Sonrası · Düğün · Ürün · Sözler · Zeka Sorusu · Ders Durumu', W / 2, 985, c0 + 3, S.d, { size: 40, weight: 500, color: '$metin' });

  // ═══ D · Özellikler ═══════════════════════════════════════════════════
  const gD = 'g-ozellik';
  const d0 = S.d;
  txt('d-baslik', gD, 'Güçlü özellikler', W / 2, P(120, 290), d0, S.e, { font: HEAD, weight: 800, size: P(92, 104), textAnim: 'harf-don' });
  logo('d-logo', gD, W / 2, P(560, 620), P(190, 210), d0 + 0.2, S.e);
  const items = [
    ['yukle-bulut', 240, 'Resim · Video\nPDF · Excel', P(380, 290), P(400, 960), PASTEL.sky],
    ['slayt-yigini', 240, 'Sürükle-bırak\nsıralama', P(1540, 790), P(400, 960), PASTEL.lilac],
    ['wifi', 220, 'İnternet gerekmez\nyerel ağda çalışır', P(380, 290), P(800, 1330), PASTEL.mint],
    ['zamanlayici', 200, 'Her slayta\nözel süre', P(1540, 790), P(800, 1330), PASTEL.rose],
  ];
  items.forEach(([asset, nat, label, x, y, col], i) => {
    const t0 = d0 + 0.8 + i * 1.6;
    const mw = P(250, 250);
    model(`d-m${i}`, gD, asset, x, y, mw, nat, t0, S.e, { phase: i * 0.4 });
    txt(`d-t${i}`, gD, label, x, y + P(150, 160), t0 + 0.3, S.e, { size: P(44, 42), weight: 700, box: col, color: '#ffffff', radius: 40, padding: [14, 30] });
    const chain = V && i >= 2; // dikeyde alt sıra oklar üst sıradaki etiketten iner (logodan çapraz geçmesin)
    ok(`d-ok${i}`, gD, chain ? `d-t${i - 2}` : 'd-logo', `d-m${i}`, t0 - 0.2, S.e, {
      color: col === PASTEL.mint ? '#58b59a' : col, bend: chain ? 0 : (i % 2 ? -0.3 : 0.3), width: 6, dur: 0.7,
      ...(chain ? { fromAnchor: 'alt', toAnchor: 'ust' } : {}),
    });
  });

  // ═══ E · Ücretsiz ═════════════════════════════════════════════════════
  const gE = 'g-ucretsiz';
  const e0 = S.e;
  txt('e-ust', gE, 'fastPano', W / 2, P(200, 380), e0, S.f, { font: HEAD, weight: 800, size: P(110, 120), color: '$metin', textAnim: 'harf-zipla' });
  txt('e-ucretsiz', gE, 'ÜCRETSİZ', W / 2, P(500, 760), e0 + 0.6, S.f, {
    font: HEAD, weight: 900, size: P(250, 175), color: '#ffffff', box: PASTEL.rose, radius: 60, padding: P([30, 80], [28, 50]), rotation: -5, anim: 'zipla-gir', delay: 0, float: 10,
  });
  txt('e-play', gE, "Google Play'den indir", W / 2, P(830, 1120), e0 + 2.4, S.f, { size: P(62, 56), box: PASTEL.mint, color: '#2f5c4b', weight: 800 });
  txt('e-android', gE, 'Android 8.0 ve üzeri', W / 2, P(950, 1250), e0 + 3.2, S.f, { size: P(44, 42), weight: 500, color: '$metin' });
  ok('e-ok', gE, 'e-ucretsiz', 'e-play', e0 + 2.0, S.f, { color: '#58b59a', bend: P(0.3, 0.3), width: 8, fromAnchor: 'alt', toAnchor: 'ust' });
  L({ id: 'e-konfeti', group: gE, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: P(330, 500), start: e0 + 0.8, end: S.f });
  L({ id: 'e-kalp', group: gE, type: 'particles', particle: 'kalp-yagmuru', mode: 'surekli', x: W / 2, y: 0, start: e0 + 1.5, end: S.f, opacity: 0.7 });

  // ═══ F · Kapanış ══════════════════════════════════════════════════════
  const gF = 'g-kapanis';
  const f0 = S.f;
  logo('f-logo', gF, W / 2, P(330, 560), P(250, 280), f0, 0);
  txt('f-baslik', gF, 'fastPano', W / 2, P(570, 800), f0 + 0.3, 0, { font: HEAD, weight: 800, size: P(200, 210), textAnim: 'harf-zipla', noExit: true });
  txt('f-site', gF, 'fastpano.com', W / 2, P(760, 990), f0 + 1.4, 0, { size: P(78, 76), box: PASTEL.sky, color: '#ffffff', weight: 800, noExit: true });
  txt('f-play', gF, "Google Play'de ara: fastPano", W / 2, P(890, 1120), f0 + 2.2, 0, { size: P(48, 48), weight: 500, color: '$metin', noExit: true });
  L({ id: 'f-yildiz', group: gF, type: 'particles', particle: 'yildiz-yagmuru', mode: 'surekli', x: W / 2, y: 0, start: f0 + 0.5, opacity: 0.8 });

  return { layers, W, H };
}

const groups = [
  { id: 'g-acilis', name: 'Açılış' }, { id: 'g-nasil', name: 'Nasıl çalışır' }, { id: 'g-tipler', name: 'İçerik türleri' },
  { id: 'g-ozellik', name: 'Özellikler' }, { id: 'g-ucretsiz', name: 'Ücretsiz' }, { id: 'g-kapanis', name: 'Kapanış' },
];

for (const V of [false, true]) {
  const id = V ? 'fastpano-dikey' : 'fastpano-yatay';
  const { layers, W, H } = build(V);
  const dir = path.join(ROOT, 'data', 'projects', id);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'scene.json');
  let audio = [];
  try { audio = JSON.parse(fs.readFileSync(file, 'utf8')).audio || []; } catch {}
  const scene = {
    name: V ? 'fastPano Tanıtım (dikey)' : 'fastPano Tanıtım (yatay)',
    width: W, height: H, fps: 30, duration: SURE, style: 'suluboya', theme: THEME,
    audio, sfx: { auto: true, volume: 0.45 },
    sections: [
      { t: S.a, name: 'Açılış' }, { t: S.b, name: 'Nasıl çalışır' }, { t: S.c, name: 'İçerik türleri' },
      { t: S.d, name: 'Özellikler' }, { t: S.e, name: 'Ücretsiz' }, { t: S.f, name: 'Kapanış' },
    ],
    transitions: [
      { type: 'iris', t: S.b, dur: 1.0, color: '#ffd6e0' },
      { type: 'kaydir', t: S.c, dur: 0.8, yon: 'yukari' },
      { type: 'perde', t: S.d, dur: 1.1, color: '#d9e4ff' },
      { type: 'yakinlas', t: S.e, dur: 0.7 },
      { type: 'katlama', t: S.f, dur: 1.2, color: '#ffe8c8' },
    ],
    groups,
    layers: JSON.parse(JSON.stringify(layers)),
  };
  fs.writeFileSync(file, JSON.stringify(scene, null, 2) + '\n');
  if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
  console.log(`ok — ${id}: ${scene.layers.length} katman, ${SURE} sn`);
}
