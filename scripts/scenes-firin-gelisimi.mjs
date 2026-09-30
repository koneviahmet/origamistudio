// "Közden Ekrana" — fırının gelişimi (9:16). Stil: kil · Tema: Kor Patlıcan (satır içi) · Alfa Slab One / Work Sans
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJE_ID = 'firin-gelisimi';
const PROJE_ADI = 'Fırının Gelişimi';
const W = 1080, H = 1920;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

const TEMA = {
  colors: { arka1: '#241433', arka2: '#51213f', baslik: '#fff1d6', metin: '#f6dcc0', vurgu: '#ffc94a' },
  background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180 },
  vignette: 0.3,
};
const BASLIK_FONT = 'Alfa Slab One';
const GOVDE_FONT = 'Work Sans';

// Çağlar: [id, büyük yazı, boyut, alt başlık, varlık, satırlar, kısa etiket]
const C = [
  ['ates', 'TARİH ÖNCESİ', 112, 'Açık ateş', 'acik-ates', ['Yemek önce doğrudan alevde pişti.', 'Isının çoğu boşa savruluyordu.'], 'Ateş'],
  ['kil', 'ANTİK ÇAĞ', 136, 'Kil ve taş fırın', 'kil-kubbe-firin', ['Kapalı kubbe ısıyı içeride tutar.', 'Ekmek ilk kez eşit pişmeye başladı.'], 'Kil'],
  ['gaz', "1800'LER", 170, 'Gazlı ocaklı fırın', 'gazli-firin', ['Odun taşımak bitti, alev ayarlanır oldu.', 'Mutfak daha temiz ve daha hızlı oldu.'], 'Gaz'],
  ['elk', "1890'LAR", 170, 'Elektrikli fırın', 'elektrikli-firin', ['Alev yok, kurum yok: ısıyı rezistans verir.', 'Sıcaklık sabit tutulabildi.'], 'Elektrik'],
  ['mik', '1945', 250, 'Mikrodalga fırın', 'mikrodalga', ['Percy Spencer radarla çalışırken', 'cebindeki şekerlemenin eridiğini gördü.'], 'Mikrodalga'],
  ['akl', 'BUGÜN', 230, 'Akıllı fırın', 'akilli-firin', ['Kamera yemeği izler, telefona bağlanır.', 'Fırın artık kendi kendine karar veriyor.'], 'Akıllı'],
];
const ACILIS = 4.2;
const SEG = 6.8;
const t0s = C.map((_, i) => r2(ACILIS + i * SEG));
const KAPANIS = r2(ACILIS + C.length * SEG);
const SURE = r2(KAPANIS + 5.2);

// ─── Açılış ────────────────────────────────────────────────────────────────
L({ id: 'ac-kivilcim', group: 'g-acilis', type: 'particles', particle: 'kivilcim', mode: 'surekli', x: W / 2, y: 1150, start: 0, end: ACILIS });
L({
  id: 'ac-baslik1', group: 'g-acilis', type: 'text', textStyle: 'baslik-kalin', font: BASLIK_FONT, weight: 400, text: 'FIRININ', size: 150, letterSpacing: 2,
  x: W / 2, y: 380, start: 0, end: ACILIS, textAnims: [{ preset: 'harf-zipla', t: 0.3, dur: 0.5, aralik: 0.07 }],
});
L({
  id: 'ac-baslik2', group: 'g-acilis', type: 'text', textStyle: 'baslik-kalin', font: BASLIK_FONT, weight: 400, text: 'GELİŞİMİ', size: 150, letterSpacing: 2, color: '$vurgu',
  x: W / 2, y: 560, start: 0, end: ACILIS, textAnims: [{ preset: 'harf-zipla', t: 0.9, dur: 0.5, aralik: 0.07 }],
});
L({
  id: 'ac-ekmek', group: 'g-acilis', asset: 'ekmek-somun', x: W / 2, y: 980, scale: 3.4, start: 0, end: ACILIS,
  anims: [{ preset: 'zipla-gir', t: 0.6, dur: 0.8 }, { preset: 'nefes', t: 1.6, genlik: 0.03, periyot: 2.4 }],
});
L({
  id: 'ac-alt', group: 'g-acilis', type: 'text', textStyle: 'alt-baslik', font: GOVDE_FONT, weight: 600, text: 'Közden ekrana uzanan yolculuk', size: 46, color: '$metin',
  x: W / 2, y: 1290, start: 0, end: ACILIS, reveal: [k(1.2, 0), k(2.0, 1, 'linear')],
});

// ─── Çağlar ────────────────────────────────────────────────────────────────
C.forEach(([id, buyuk, bsz, ad, asset, satirlar, etiket], i) => {
  const a = t0s[i];
  const b = i === C.length - 1 ? KAPANIS : t0s[i + 1];
  const g = `g-${id}`;
  const ates = i <= 2;
  L({
    id: `${id}-kivilcim`, group: g, type: 'particles', particle: ates ? 'kivilcim' : 'yildiz-tozu', mode: 'surekli', x: W / 2, y: 1100, start: a, end: b,
  });
  L({
    id: `${id}-yil`, group: g, type: 'text', textStyle: 'baslik-kalin', font: BASLIK_FONT, weight: 400, text: buyuk, size: bsz, letterSpacing: 1, color: '$vurgu',
    x: W / 2, y: 340, start: a, end: b,
    textAnims: [{ preset: 'harf-katla', t: a + 0.35, dur: 0.5, aralik: 0.05 }],
    anims: [{ preset: 'kayarak-cik', t: b - 0.6, dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' }],
  });
  L({
    id: `${id}-ad`, group: g, type: 'text', textStyle: 'alt-baslik', font: GOVDE_FONT, weight: 700, text: ad, size: 70, color: '$baslik',
    x: W / 2, y: 500, start: a, end: b,
    anims: [{ preset: 'zipla-gir', t: a + 0.7, dur: 0.5 }, { preset: 'sol', t: b - 0.55, dur: 0.35 }],
  });
  L({
    id: `${id}-model`, group: g, asset, x: W / 2, y: 800, scale: 3.3, start: a, end: b,
    anims: [
      { preset: 'katlanarak-gir', t: a + 0.3, dur: 1.0, sira: 'radial' },
      { preset: 'suzul', t: a + 1.4, genlik: 10, periyot: 3 },
      { preset: 'ekrandan-cik', t: b - 0.65, dur: 0.55, yon: 'sol', ease: 'inCubic' },
    ],
  });
  satirlar.forEach((tx, j) =>
    L({
      id: `${id}-satir${j + 1}`, group: g, type: 'text', textStyle: 'alt-baslik', font: GOVDE_FONT, weight: 600, text: tx, size: 45, color: '$metin',
      x: W / 2, y: 1230 + j * 80, start: a, end: b,
      reveal: [k(a + 1.3 + j * 1.1, 0), k(a + 2.2 + j * 1.1, 1, 'linear')],
      anims: [{ preset: 'sol', t: b - 0.55, dur: 0.35 }],
    }),
  );
});

// ─── Yıl şeridi (alt) ──────────────────────────────────────────────────────
const SX = (i) => 140 + i * 160;
C.forEach(([id, , , , , , etiket], i) => {
  const a = t0s[i];
  const op = [k(0, 0.3), k(a, 0.3), k(a + 0.5, 1)];
  L({ id: `serit-nokta-${id}`, group: 'g-serit', type: 'text', text: '●', font: GOVDE_FONT, size: 34, color: '$vurgu', x: SX(i), y: 1410, start: ACILIS, end: KAPANIS, opacity: op,
    anims: [{ preset: 'belir', t: ACILIS, dur: 0.4 }] });
  L({ id: `serit-etiket-${id}`, group: 'g-serit', type: 'text', text: etiket, font: GOVDE_FONT, weight: 700, size: 30, color: '$baslik', x: SX(i), y: 1458, start: ACILIS, end: KAPANIS, opacity: op,
    anims: [{ preset: 'belir', t: ACILIS, dur: 0.4 }] });
});

// ─── Kapanış ───────────────────────────────────────────────────────────────
L({ id: 'kp-kivilcim', group: 'g-kapanis', type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', x: W / 2, y: 1000, start: KAPANIS, end: SURE });
L({
  id: 'kp-baslik', group: 'g-kapanis', type: 'text', textStyle: 'baslik-kalin', font: BASLIK_FONT, weight: 400, text: 'ATEŞTEN EKRANA', size: 92, color: '$baslik',
  x: W / 2, y: 400, start: KAPANIS, textAnims: [{ preset: 'harf-zipla', t: KAPANIS + 0.4, dur: 0.45, aralik: 0.05 }],
});
C.forEach(([id, , , , asset], i) => {
  const row = Math.floor(i / 3), col = i % 3;
  L({
    id: `kp-model-${id}`, group: 'g-kapanis', asset, x: 215 + col * 325, y: 760 + row * 330, scale: 1.45, start: KAPANIS,
    anims: [{ preset: 'katlanarak-gir', t: KAPANIS + 0.8 + i * 0.35, dur: 0.8, sira: 'radial' }, { preset: 'suzul', t: KAPANIS + 2, genlik: 7, periyot: 3 + i * 0.3 }],
  });
});
L({
  id: 'kp-alt', group: 'g-kapanis', type: 'text', textStyle: 'alt-baslik', font: GOVDE_FONT, weight: 600, text: 'Sıradaki fırın neyle ısınacak?', size: 48, color: '$vurgu',
  x: W / 2, y: 1300, start: KAPANIS, reveal: [k(KAPANIS + 3, 0), k(KAPANIS + 4.2, 1, 'linear')],
});

// ─── Kamera: her bölümde yavaş itme ────────────────────────────────────────
const camZoom = [], camX = [];
[0, ...t0s, KAPANIS].forEach((t, i, arr) => {
  const bitis = i === arr.length - 1 ? SURE : arr[i + 1];
  camZoom.push(k(t, 1), k(bitis - 0.02, 1.05, 'linear'));
  camX.push(k(t, 540 + (i % 2 ? 14 : -14)), k(bitis - 0.02, 540 + (i % 2 ? -14 : 14), 'linear'));
});

const gecisler = ['perde', 'kaydir', 'yakinlas', 'katlama', 'iris', 'sayfa-cevir', 'yirtik'];
const tr = [ACILIS, ...t0s.slice(1), KAPANIS].map((t, i) => {
  const ty = gecisler[i];
  const dur = ty === 'yakinlas' ? 0.7 : ty === 'kaydir' ? 0.8 : ty === 'sayfa-cevir' ? 1.1 : 1.2;
  return { type: ty, t, dur, ...(ty === 'kaydir' ? { yon: 'yukari' } : {}), ...(['perde', 'katlama', 'iris', 'yirtik'].includes(ty) ? { color: '$vurgu' } : {}) };
});

const scene = {
  name: PROJE_ADI, width: W, height: H, fps: 30, duration: SURE, theme: TEMA, style: 'kil',
  camera: { zoom: camZoom, x: camX, y: 960 },
  sfx: { auto: true, volume: 0.5 },
  sections: [
    { t: 0, name: 'Açılış' },
    ...C.map(([, , , ad], i) => ({ t: t0s[i], name: ad })),
    { t: KAPANIS, name: 'Kapanış' },
  ],
  transitions: tr,
  groups: [
    { id: 'g-acilis', name: 'Açılış', collapsed: true },
    ...C.map(([id, , , ad]) => ({ id: `g-${id}`, name: ad })),
    { id: 'g-serit', name: 'Yıl şeridi', collapsed: true },
    { id: 'g-kapanis', name: 'Kapanış', collapsed: true },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
