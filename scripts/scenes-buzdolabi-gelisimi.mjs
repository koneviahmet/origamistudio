// "Buzdolabının gelişimi" — dikey 9:16, stil: duz, font: DM Serif Display / Outfit
// Konsept "Soğuk Zincir": altta yıl şeridi her çağda bir kat daha "donar" (yanar), her çağda dev yıl + nesne
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJE_ID = 'buzdolabi-gelisimi';
const W = 1080, H = 1920;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

const TEMA = {
  name: 'Soğuk Zincir',
  paper: 'mat',
  adjust: { brightness: 0, saturation: 1 },
  colors: { arka1: '#06222e', arka2: '#0f5a6e', baslik: '#e9fbff', metin: '#bfe6f2', vurgu: '#ff9f6b' },
  background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180 },
  vignette: 0.4,
};

const T = [0, 4, 10.5, 17, 23.5, 30, 36.5, 43]; // bölüm başları
const SURE = 49;

// Bölümler: yıl, başlık, iki satır, varlık, boyut (en uzun kenar), hedef piksel
const B = [
  { yil: '1755', baslik: 'Soğuğu üretmek', a: 'İskoç William Cullen, Glasgow\'da', b: 'Vakumda buharlaşan sıvı ısıyı alıp soğuttu', asset: 'vakum-kap', size: 260, px: 600 },
  { yil: '1806', baslik: 'Buz ticareti', a: 'Frederic Tudor buzu gemilerle taşıdı', b: 'Evlerde ahşap buz sandıkları kullanıldı', asset: 'buz-sandigi', size: 260, px: 640, y: 930 },
  { yil: '1834', baslik: 'Makine soğutma', a: 'Jacob Perkins sıkıştırmalı soğutmayı patentledi', b: 'Bugünkü buzdolaplarının temel ilkesi bu', asset: 'kompresor-devresi', size: 260, px: 640, y: 930 },
  { yil: '1913', baslik: 'Eve giren elektrik', a: 'İlk ev tipi elektrikli buzdolapları çıktı', b: 'Motor dolabın tepesinde duruyordu', asset: 'buzdolabi-ilk-elektrikli', size: 300, px: 640, y: 930 },
  { yil: '1927', baslik: 'Mutfağın yıldızı', a: 'GE\'nin silindir üstlü modeli yayıldı', b: 'Kompresör üstte, dolap evlere yayıldı', asset: 'buzdolabi-monitor', size: 310, px: 640, y: 930 },
  { yil: '2016', baslik: 'Akıllı dolap', a: 'Samsung ekranlı akıllı modeli tanıttı', b: 'No-frost ile buz tutma derdi de bitti', asset: 'akilli-buzdolabi', size: 320, px: 640, y: 930 },
];

const FONT_B = 'DM Serif Display';
const FONT_G = 'Outfit';

// ── Açılış ──
L({ id: 'ac-buz', group: 'g-ac', asset: 'buz-blogu', x: W / 2, y: 1000, scale: r2(600 / 200), start: 0, end: T[1],
  anims: [{ preset: 'katlanarak-gir', t: 0.2, dur: 1.2, sira: 'radial' }, { preset: 'suzul', t: 1.4, genlik: 14, periyot: 3 }, { preset: 'kuculerek-cik', t: T[1] - 0.6, dur: 0.5 }] });
L({ id: 'ac-baslik', group: 'g-ac', type: 'text', text: 'Buzdolabı', x: W / 2, y: 380, size: 190, font: FONT_B, weight: 400, color: '$baslik', start: 0, end: T[1],
  textAnims: [{ preset: 'harf-zipla', t: 0.4, dur: 0.5, aralik: 0.06 }], anims: [{ preset: 'sol', t: T[1] - 0.55, dur: 0.4 }] });
L({ id: 'ac-alt', group: 'g-ac', type: 'text', text: 'nasıl doğdu?', x: W / 2, y: 560, size: 84, font: FONT_G, weight: 600, color: '$vurgu', start: 0, end: T[1],
  textAnims: [{ preset: 'kelime-zipla', t: 1.3, dur: 0.5, aralik: 0.25 }], anims: [{ preset: 'sol', t: T[1] - 0.55, dur: 0.4 }] });
L({ id: 'ac-not', group: 'g-ac', type: 'text', text: 'Bir buz bloğundan ekranlı dolaba', x: W / 2, y: 1400, size: 48, font: FONT_G, weight: 400, color: '$metin', start: 0, end: T[1],
  reveal: [k(1.2, 0), k(2.2, 1, 'linear')], anims: [{ preset: 'sol', t: T[1] - 0.55, dur: 0.4 }] });
L({ id: 'ac-kar', group: 'g-ac', type: 'particles', particle: 'kar', x: W / 2, y: 0, start: 0, end: SURE });

// ── Bölümler ──
B.forEach((b, i) => {
  const t0 = T[i + 1], t1 = T[i + 2], g = `g-b${i + 1}`, p = `b${i + 1}`;
  L({ id: `${p}-yil`, group: g, type: 'text', text: b.yil, x: W / 2, y: 340, size: 230, font: FONT_B, weight: 400, color: '$vurgu', start: t0, end: t1,
    textAnims: [{ preset: 'harf-katla', t: t0 + 0.2, dur: 0.6, aralik: 0.1 }], anims: [{ preset: 'sol', t: t1 - 0.55, dur: 0.4 }] });
  L({ id: `${p}-baslik`, group: g, type: 'text', text: b.baslik, x: W / 2, y: 540, size: 68, font: FONT_G, weight: 700, color: '$baslik', start: t0, end: t1,
    textAnims: [{ preset: 'kelime-zipla', t: t0 + 0.7, dur: 0.45, aralik: 0.2 }], anims: [{ preset: 'sol', t: t1 - 0.55, dur: 0.4 }] });
  L({ id: `${p}-obje`, group: g, asset: b.asset, x: W / 2, y: b.y || 960, scale: r2(b.px / b.size), start: t0, end: t1,
    anims: [{ preset: 'katlanarak-gir', t: t0 + 0.3, dur: 1.1, sira: 'radial' }, { preset: 'suzul', t: t0 + 1.4, genlik: 10, periyot: 3.2 }, { preset: 'ekrandan-cik', t: t1 - 0.65, dur: 0.55, yon: 'sol', ease: 'inCubic' }] });
  [b.a, b.b].forEach((tx, j) => L({ id: `${p}-bilgi${j + 1}`, group: g, type: 'text', text: tx, x: W / 2, y: 1310 + j * 80, size: 44, font: FONT_G, weight: 500, color: '$metin', start: t0, end: t1,
    box: undefined, reveal: [k(t0 + 1.2 + j * 1.0, 0), k(t0 + 2.0 + j * 1.0, 1, 'linear')], anims: [{ preset: 'sol', t: t1 - 0.55, dur: 0.35 }] }));
});
// Buz bloğu yan öğe (1806: gemi)
L({ id: 'b2-gemi', group: 'g-b2', asset: 'kagit-gemi', x: 880, y: 1130, scale: 1.0, start: T[2], end: T[3],
  anims: [{ preset: 'katlanarak-gir', t: T[2] + 1.0, dur: 0.9 }, { preset: 'dalgada', t: T[2] + 2, genlik: 8, periyot: 2.4 }, { preset: 'ekrandan-cik', t: T[3] - 0.65, dur: 0.55, yon: 'sag', ease: 'inCubic' }] });
L({ id: 'b2-buz', group: 'g-b2', asset: 'buz-blogu', x: 200, y: 1120, scale: 0.6, start: T[2], end: T[3],
  anims: [{ preset: 'zipla-gir', t: T[2] + 1.6, dur: 0.6 }, { preset: 'ekrandan-cik', t: T[3] - 0.65, dur: 0.55, yon: 'sol', ease: 'inCubic' }] });

// ── Yıl şeridi (tüm video) ──
const yillar = B.map((b) => b.yil);
yillar.forEach((y, i) => {
  const ta = T[i + 1];
  L({ id: `serit-${y}`, group: 'g-serit', type: 'text', text: y, x: 150 + i * 156, y: 1560 - 60, size: 40, font: FONT_G, weight: 700, color: '$baslik', start: 0,
    opacity: [k(0, 0.3), k(ta, 0.3), k(ta + 0.4, 1, 'outCubic')] });
});

// ── Kapanış ──
const tk = T[7];
L({ id: 'kp-buzdolabi', group: 'g-kp', asset: 'akilli-buzdolabi', x: W / 2, y: 930, scale: r2(600 / 320), start: tk, end: SURE,
  anims: [{ preset: 'katlanarak-gir', t: tk + 0.2, dur: 1.0 }, { preset: 'nefes', t: tk + 1.4 }] });
L({ id: 'kp-baslik', group: 'g-kp', type: 'text', text: 'Soğuk tutmanın\n260 yıllık yolu', x: W / 2, y: 400, size: 100, font: FONT_B, weight: 400, color: '$baslik', lineHeight: 1.1, start: tk,
  textAnims: [{ preset: 'satir-kay', t: tk + 0.3, dur: 0.6, aralik: 0.3 }] });
L({ id: 'kp-alt', group: 'g-kp', type: 'text', text: 'Bir sonraki raf seni bekliyor.', x: W / 2, y: 1330, size: 44, font: FONT_G, weight: 500, color: '$vurgu', start: tk + 1.5,
  reveal: [k(tk + 1.6, 0), k(tk + 2.8, 1, 'linear')] });

const scene = {
  name: 'Buzdolabının Gelişimi',
  width: W, height: H, fps: 30, duration: SURE,
  theme: TEMA,
  style: 'duz',
  sfx: { auto: true, volume: 0.5 },
  sections: [
    { t: 0, name: 'Açılış' }, { t: T[1], name: '1755' }, { t: T[2], name: '1806' }, { t: T[3], name: '1834' },
    { t: T[4], name: '1913' }, { t: T[5], name: '1927' }, { t: T[6], name: '2016' }, { t: T[7], name: 'Kapanış' },
  ],
  transitions: [
    { type: 'perde', t: T[1], dur: 1.0, color: '$arka2' },
    { type: 'yakinlas', t: T[2], dur: 0.9 },
    { type: 'katlama', t: T[3], dur: 1.1, color: '$arka2' },
    { type: 'sayfa-cevir', t: T[4], dur: 1.0 },
    { type: 'yirtik', t: T[5], dur: 1.0, color: '$arka2' },
    { type: 'iris', t: T[6], dur: 1.0, color: '$vurgu' },
    { type: 'kaydir', t: T[7], dur: 0.9, yon: 'yukari' },
  ],
  groups: [
    { id: 'g-ac', name: 'Açılış', collapsed: true },
    ...B.map((b, i) => ({ id: `g-b${i + 1}`, name: b.yil, collapsed: true })),
    { id: 'g-serit', name: 'Yıl şeridi', collapsed: true },
    { id: 'g-kp', name: 'Kapanış', collapsed: true },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
