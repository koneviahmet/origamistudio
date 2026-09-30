// "Stil Galerisi" — 16 çizim stilinin tanıtımı. Konsept: her stil kendi renkli "sergi odasında",
// uygun bir nesneyle katlanarak/belirerek girer; açılış ve kapanış aynı kelebeği 16 stilde gösterir.
// Çalıştır: node scripts/scenes-stil-galerisi.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJE_ID = 'stil-galerisi';
const PROJE_ADI = 'Stil Galerisi';
const W = 1920;
const H = 1080;
const FPS = 30;
const r2 = (n) => Math.round(n * 100) / 100;
const layers = [];
const L = (o) => (layers.push(o), o);

const BASLIK = 'Archivo Black';
const GOVDE = 'Figtree';
const SIZES = {
  turna: 240, dag: 300, gunes: 160, 'cam-agaci': 140, 'modern-telefon': 320, cezve: 200, fincan: 200, cip: 200,
  dunya: 200, bulut: 200, tilki: 200, disli: 200, dizustu: 260, kelebek: 200, balina: 260, marti: 200,
  eniac: 400, yildiz: 160, kalp: 160, lale: 220, ev: 180, 'kisisel-bilgisayar': 260, tepeler: 400,
};

// Her stil: ad, ipucu, renkler, kahramanlar. dx/dy = sahne sağ yarısının merkezine göre kayma, px = en uzun kenar
const STILLER = [
  { id: 'origami', ad: 'ORİGAMİ', ip: ['Katlanan kâğıt yüzeyler,', 'menteşe etrafında açılır'],
    bg: '#f1e3cc', ink: '#3b2a1e', acc: '#c8553d', hero: [{ a: 'turna', px: 620 }] },
  { id: 'kagit-kesme', ad: 'KAĞIT KESME', ip: ['Renk tabakaları üst üste,', 'derin gölgeyle belirir'],
    bg: '#f4a261', ink: '#3a1f12', acc: '#264653', hero: [
      { a: 'gunes', px: 240, dx: 140, dy: -210 }, { a: 'dag', px: 660, dy: 40 },
      { a: 'cam-agaci', px: 210, dx: -230, dy: 140 }, { a: 'cam-agaci', px: 260, dx: 250, dy: 170 }] },
  { id: 'duz', ad: 'DÜZ VEKTÖR', ip: ['Gölgesiz, temiz renkler:', 'minimal ve infografik'],
    bg: '#ffd166', ink: '#14213d', acc: '#ef476f', hero: [{ a: 'modern-telefon', px: 680 }] },
  { id: 'cizim', ad: 'ÇİZİM / BOYA', ip: ['El çizimi mürekkep kontur,', 'üstüne pastel boya'],
    bg: '#fbf6e9', ink: '#2d3561', acc: '#e63946', hero: [{ a: 'cezve', px: 400, dx: -130, dy: 20 }, { a: 'fincan', px: 360, dx: 210, dy: 120 }] },
  { id: 'neon', ad: 'NEON', ip: ['Koyu zeminde parlayan', 'çizgi iskeleti'],
    bg: '#070812', ink: '#e8faff', acc: '#22d3ee', hero: [{ a: 'cip', px: 600 }], fx: 'yildiz-tozu' },
  { id: 'cam', ad: 'CAM', ip: ['Yarı saydam buzlu cam,', 'parlak kenar ve yansıma'],
    bg: '#4f7fd6', ink: '#ffffff', acc: '#ffe066', hero: [{ a: 'dunya', px: 560, dy: 10 }], fx: 'kabarcik' },
  { id: 'mozaik', ad: 'MOZAİK', ip: ['Her yüzey biraz farklı ton:', 'kristal, low-poly'],
    bg: '#1f3a4d', ink: '#f4efe6', acc: '#ff9f68', hero: [{ a: 'tilki', px: 620 }] },
  { id: 'teknik', ad: 'TEKNİK ÇİZİM', ip: ['Mavi pafta, beyaz ince çizgi:', 'şema ve mühendislik'],
    bg: '#0d2a55', ink: '#eaf3ff', acc: '#7ec8ff', hero: [{ a: 'disli', px: 600, anim: 'don' }] },
  { id: 'vitray', ad: 'VİTRAY', ip: ['Işıklı renkli cam,', 'kalın kurşun çerçeve'],
    bg: '#1a1423', ink: '#fbeedd', acc: '#ffb703', hero: [{ a: 'kelebek', px: 640 }] },
  { id: 'kil', ad: 'KİL', ip: ['Yumuşak, şişkin hacim,', 'plastilin hissi'],
    bg: '#ffb4a2', ink: '#4a2c2a', acc: '#6d597a', hero: [{ a: 'balina', px: 660 }] },
  { id: 'siluet', ad: 'GÖLGE OYUNU', ip: ['Tek renk siluet,', 'ışığın önünde hale'],
    bg: '#ff9f43', ink: '#2a1206', acc: '#fff3c4', hero: [
      { a: 'gunes', px: 300, dx: 120, dy: -170, st: 'duz', pal: { a: '#fff3c4', b: '#ffe08a' } },
      { a: 'dag', px: 720, dy: 110 }, { a: 'marti', px: 170, dx: -170, dy: -170, anim: 'suzul' }] },
  { id: 'gazete', ad: 'GAZETE BASKISI', ip: ['Tek renk mürekkep tonları,', 'eski baskı kayması'],
    bg: '#d8d0bb', ink: '#1c1a17', acc: '#9b2226', hero: [{ a: 'eniac', px: 520, dx: 150, dy: 20 }] },
  { id: 'halftone', ad: 'HALFTONE', ip: ['Nokta rasterli', 'pop-art baskı'],
    bg: '#ff8fab', ink: '#111111', acc: '#3a0ca3', hero: [{ a: 'yildiz', px: 560, dy: -10 }, { a: 'kalp', px: 230, dx: 230, dy: 190 }] },
  { id: 'suluboya', ad: 'SULUBOYA', ip: ['Üst üste şeffaf boya,', 'oynak, yumuşak kenarlar'],
    bg: '#fdf3e7', ink: '#6d597a', acc: '#f28482', hero: [
      { a: 'lale', px: 420, dx: -210, dy: 20 }, { a: 'lale', px: 500, dy: -10, variant: 'mor' },
      { a: 'lale', px: 400, dx: 220, dy: 30, variant: 'sari' }] },
  { id: 'nakis', ad: 'NAKIŞ', ip: ['Kumaş yüzey,', 'dikiş çizgili kenar'],
    bg: '#3c5a6a', ink: '#f5ebdc', acc: '#f4a261', hero: [{ a: 'ev', px: 470, dx: -60, dy: 70 }, { a: 'cam-agaci', px: 330, dx: 250, dy: 120 }] },
  { id: 'piksel', ad: 'PİKSEL', ip: ['Düşük çözünürlük,', 'keskin 8-bit görünüm'],
    bg: '#14213d', ink: '#f1f1f1', acc: '#fca311', hero: [{ a: 'kisisel-bilgisayar', px: 620, variant: 'kehribar' }] },
];

const GECIS = ['katlama', 'perde', 'iris', 'yirtik', 'sayfa-cevir', 'kaydir', 'yakinlas'];
const HARF = ['harf-zipla', 'harf-katla', 'harf-dus', 'harf-don', 'harf-belir'];

const T_ACILIS = 5.0;
const SEC = 2.3;
const T_KAPANIS = T_ACILIS + STILLER.length * SEC;
const SURE = r2(T_KAPANIS + 5.5);

const bgLayer = (id, color, t0, t1, o = {}) =>
  L({ id, asset: 'tabaka', style: 'duz', palette: { a: color }, x: W / 2, y: H / 2, scaleX: 19.4, scaleY: 10.9, start: t0, end: t1, group: o.group, ...o.extra });

// ─── Açılış ────────────────────────────────────────────────────────────────
L({
  id: 'ac-baslik', group: 'g-acilis', type: 'text', text: 'ON ALTI STİL', font: BASLIK, weight: 400, size: 170, color: '#f4efe6',
  x: W / 2, y: 790, start: 0, end: T_ACILIS, letterSpacing: 3,
  textAnims: [{ preset: 'harf-zipla', t: 0.3, dur: 0.5, aralik: 0.06 }],
});
L({
  id: 'ac-alt', group: 'g-acilis', type: 'text', text: 'Tek geometri, on altı farklı yüz', font: GOVDE, weight: 600, size: 52, color: '#c9c2b4',
  x: W / 2, y: 935, start: 1.2, end: T_ACILIS, textAnims: [{ preset: 'satir-kay', t: 1.2, dur: 0.6 }],
});
const STEP = 0.2;
STILLER.forEach((s, i) => {
  const t0 = 0.6 + i * STEP;
  L({
    id: `ac-kelebek-${s.id}`, group: 'g-acilis', asset: 'kelebek', style: s.id, x: W / 2, y: 410, scale: r2(520 / SIZES.kelebek),
    start: r2(t0), end: r2(i === STILLER.length - 1 ? T_ACILIS : t0 + STEP),
    anims: [{ preset: 'kanat-cirp', t: r2(t0), periyot: 1.0, alt: 0.3 }],
  });
});

// ─── 16 bölüm ──────────────────────────────────────────────────────────────
const transitions = [{ type: 'iris', t: T_ACILIS, dur: 0.8, color: STILLER[0].bg }];
const sections = [{ t: 0, name: 'Açılış' }];
const groups = [{ id: 'g-acilis', name: 'Açılış', collapsed: true }];
const HX = 1390;
const HY = 560;

STILLER.forEach((s, i) => {
  const t0 = r2(T_ACILIS + i * SEC);
  const t1 = r2(t0 + SEC);
  const g = `g-${s.id}`;
  groups.push({ id: g, name: s.ad, collapsed: true });
  sections.push({ t: t0, name: `${String(i + 1).padStart(2, '0')} ${s.ad}` });
  if (i > 0) {
    const type = GECIS[(i - 1) % GECIS.length];
    transitions.push({ type, t: t0, dur: 0.75, color: s.bg, ...(type === 'kaydir' ? { yon: i % 2 ? 'sol' : 'sag' } : {}) });
  }

  bgLayer(`${s.id}-bg`, s.bg, t0, t1, { group: g });

  // Sol sütun: sıra no, stil adı, vurgu çizgisi, iki satır açıklama
  const len = s.ad.length;
  const size = Math.min(140, Math.floor(1000 / (len * 0.76)));
  L({
    id: `${s.id}-no`, group: g, type: 'text', text: `${String(i + 1).padStart(2, '0')} / ${STILLER.length}`, font: GOVDE, weight: 800, size: 44,
    color: s.acc, align: 'left', x: 120, y: 330, start: t0, end: t1, letterSpacing: 4,
    textAnims: [{ preset: 'satir-kay', t: r2(t0 + 0.2), dur: 0.5 }],
  });
  L({
    id: `${s.id}-ad`, group: g, type: 'text', text: s.ad, font: BASLIK, weight: 400, size, color: s.ink, align: 'left', x: 120, y: 450,
    start: t0, end: t1, textAnims: [{ preset: HARF[i % HARF.length], t: r2(t0 + 0.25), dur: 0.5, aralik: 0.045 }],
  });
  L({
    id: `${s.id}-cizgi`, group: g, asset: 'tabaka', style: 'duz', palette: { a: s.acc }, x: 120, y: 550, anchor: [0, 0.5], scaleX: 2.4, scaleY: 0.07,
    start: t0, end: t1, anims: [{ preset: 'zipla-gir', t: r2(t0 + 0.5), dur: 0.5 }],
  });
  s.ip.forEach((line, j) => {
    L({
      id: `${s.id}-ip${j + 1}`, group: g, type: 'text', text: line, font: GOVDE, weight: 600, size: 50, color: s.ink, align: 'left',
      x: 120, y: 640 + j * 70, start: t0, end: t1, opacity: 0.88,
      textAnims: [{ preset: 'satir-kay', t: r2(t0 + 0.75 + j * 0.25), dur: 0.55 }],
    });
  });

  // Sağ yarı: kahraman(lar), stile özel katlanarak / belirerek giriş
  s.hero.forEach((h, j) => {
    L({
      id: `${s.id}-h${j + 1}`, group: g, asset: h.a, style: h.st || s.id, ...(h.variant ? { variant: h.variant } : {}), ...(h.pal ? { palette: h.pal } : {}),
      x: HX + (h.dx || 0), y: HY + (h.dy || 0), scale: r2(h.px / SIZES[h.a]), start: t0, end: t1,
      anims: [
        { preset: 'katlanarak-gir', t: r2(t0 + 0.25 + j * 0.18), dur: 1.0, sira: 'radial' },
        h.anim === 'don' ? { preset: 'don', t: r2(t0 + 1.2), periyot: 14 } : { preset: h.anim || 'suzul', t: r2(t0 + 1.2), genlik: 8, periyot: 3 },
      ],
    });
  });
  if (s.fx) L({ id: `${s.id}-fx`, group: g, type: 'particles', particle: s.fx, mode: 'surekli', x: HX, y: HY, start: t0, end: t1 });
});

// ─── Kapanış: 4×4 özet ızgarası ────────────────────────────────────────────
groups.push({ id: 'g-kapanis', name: 'Kapanış', collapsed: true });
sections.push({ t: T_KAPANIS, name: 'Kapanış' });
transitions.push({ type: 'perde', t: T_KAPANIS, dur: 0.9, color: '#15131a' });
L({
  id: 'kap-baslik', group: 'g-kapanis', type: 'text', text: 'Hangisini seçersin?', font: BASLIK, weight: 400, size: 84, color: '#f4efe6',
  x: W / 2, y: 110, start: T_KAPANIS, end: SURE, textAnims: [{ preset: 'harf-zipla', t: T_KAPANIS + 0.3, dur: 0.45, aralik: 0.035 }],
});
STILLER.forEach((s, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const cx = 420 + col * 360;
  const cy = 300 + row * 200;
  const ta = r2(T_KAPANIS + 0.7 + i * 0.12);
  const pop = [{ preset: 'zipla-gir', t: ta, dur: 0.6 }];
  L({ id: `kap-${s.id}-kart`, group: 'g-kapanis', asset: 'tabaka', style: 'duz', palette: { a: s.bg }, x: cx, y: cy, scaleX: 3.3, scaleY: 1.8, start: T_KAPANIS, end: SURE, anims: pop });
  L({
    id: `kap-${s.id}-kelebek`, group: 'g-kapanis', asset: 'kelebek', style: s.id, x: cx, y: cy - 14, scale: r2(150 / SIZES.kelebek), start: T_KAPANIS, end: SURE,
    anims: [{ preset: 'zipla-gir', t: ta, dur: 0.6 }, { preset: 'suzul', t: r2(ta + 0.6), genlik: 5, periyot: 2.4 }],
  });
  L({
    id: `kap-${s.id}-ad`, group: 'g-kapanis', type: 'text', text: s.ad, font: GOVDE, weight: 800, size: 28, color: s.ink, x: cx, y: cy + 70, start: T_KAPANIS, end: SURE,
    anims: pop, letterSpacing: 2,
  });
});

// ─── Sahne ─────────────────────────────────────────────────────────────────
const scene = {
  name: PROJE_ADI,
  width: W,
  height: H,
  fps: FPS,
  duration: SURE,
  theme: {
    paper: 'mat',
    colors: { arka1: '#15131a', arka2: '#241f2e', baslik: '#f4efe6', metin: '#c9c2b4', vurgu: '#ff5d73' },
    background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180 },
  },
  sfx: { auto: true, volume: 0.45 },
  sections,
  transitions,
  groups,
  formats: [{ id: 'kare', name: 'Kare 1:1', width: 1080, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.5, zoom: 1 }],
  layers: JSON.parse(JSON.stringify(layers)),
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
