import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Güneş Sistemi videosunun sahne üreteci: node scripts/scenes-gunes-sistemi.mjs
// (scene.json'u baştan yazar; stüdyoda yapılan elle düzenlemeler kaybolur)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', 'gunes-sistemi');
const k = (t, v, ease) => (ease ? { t, v, ease } : { t, v });
const r2 = (n) => Math.round(n * 100) / 100;
const layers = [];

// ------------------------------------------------------------ yıldız alanı
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 34; i++) {
  layers.push({
    id: `yildiz-${i + 1}`,
    asset: 'yildiz',
    variant: rnd() > 0.55 ? 'gumus' : undefined,
    x: Math.round(40 + rnd() * 1000),
    y: Math.round(40 + rnd() * 1840),
    scale: r2(0.05 + rnd() * 0.09),
    rotation: Math.round(rnd() * 70),
    opacity: r2(0.55 + rnd() * 0.35),
    loops: [{ prop: 'opacity', type: 'sine', amp: 0.3, period: r2(1.4 + rnd() * 2.2), phase: r2(rnd()) }],
    anims: [{ preset: 'belir', t: r2(rnd() * 1.5), dur: 0.6 }],
  });
}

// Sürekli parıldayan yıldız tozu
layers.push({ id: 'yildiz-tozu', type: 'particles', particle: 'yildiz-tozu', count: 45, size: 24, opacity: 0.85, seed: 3 });

// Metin yardımcıları
const title = (id, text, t0, t1, extra = {}) => ({
  id, type: 'text', textStyle: 'baslik-kalin', text, x: 540, y: 300, start: t0, end: t1,
  textAnims: [{ preset: 'harf-don', t: t0 + 0.15, dur: 0.5, aralik: 0.05 }],
  anims: [{ preset: 'kayarak-cik', t: t1 - 0.6, dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' }],
  ...extra,
});
const label = (id, text, t0, t1) => ({
  id, type: 'text', textStyle: 'etiket-kutu', text, x: 540, y: 425, start: t0, end: t1,
  anims: [{ preset: 'zipla-gir', t: t0 + 0.4, dur: 0.5 }, { preset: 'sol', t: t1 - 0.55, dur: 0.35 }],
});
const fact = (id, text, y, t0, t1, delay) => ({
  id, type: 'text', textStyle: 'alt-baslik', text: `• ${text}`, x: 540, y, size: 46, start: t0, end: t1,
  reveal: [k(t0 + delay, 0), k(t0 + delay + 0.8, 1, 'linear')],
  anims: [{ preset: 'sol', t: t1 - 0.55, dur: 0.35 }],
});

// ------------------------------------------------------------ 0–4.2 açılış
layers.push({
  id: 'baslik-giris', type: 'text', textStyle: 'baslik-kalin', text: 'Güneş Sistemi', x: 540, y: 820, size: 190, start: 0, end: 4.3,
  textAnims: [{ preset: 'harf-katla', t: 0.4, dur: 0.6, aralik: 0.06 }],
  anims: [{ preset: 'kayarak-cik', t: 3.6, dur: 0.5, yon: 'ust', mesafe: 500, ease: 'inCubic' }],
});
layers.push({
  id: 'alt-giris', type: 'text', textStyle: 'etiket-kutu', text: '8 gezegen · 1 yıldız', x: 540, y: 980, start: 0, end: 4.3,
  anims: [{ preset: 'zipla-gir', t: 1.2, dur: 0.6 }, { preset: 'sol', t: 3.7, dur: 0.4 }],
});

// ------------------------------------------------------------ 4.2–9.6 Güneş
const S0 = 4.2;
const S1 = 9.7;
layers.push({
  id: 'gunes', asset: 'gunes', x: 540, y: 860, scale: 3.4, start: S0, end: S1,
  anims: [
    { preset: 'katlanarak-gir', t: S0, dur: 1.3, sira: 'radial' },
    { preset: 'nabiz', t: S0 + 1.3, genlik: 0.04, periyot: 1.8 },
    { preset: 'don', t: S0, periyot: 40 },
    { preset: 'kuculerek-cik', t: S1 - 0.6, dur: 0.5 },
  ],
});
layers.push(title('gunes-ad', 'Güneş', S0, S1));
layers.push(label('gunes-etiket', 'merkezdeki yıldız', S0, S1));
layers.push(fact('gunes-b1', 'Sistemin tek yıldızı', 1260, S0, S1, 1.3));
layers.push(fact('gunes-b2', 'Işığı bize 8 dakikada ulaşır', 1345, S0, S1, 2.0));
layers.push(fact('gunes-b3', 'Toplam kütlenin %99,8\'i onda', 1430, S0, S1, 2.7));

// ------------------------------------------------------------ gezegenler
const PLANETS = [
  { id: 'merkur', ad: 'Merkür', d: 320, b: ['Güneş\'e en yakın, en küçük', 'Bir yılı sadece 88 gün'] },
  { id: 'venus', ad: 'Venüs', d: 430, b: ['En sıcak gezegen: ~465 °C', 'Kendi etrafında ters döner'] },
  { id: 'dunya', ad: 'Dünya', d: 450, b: ['Yaşam bilinen tek gezegen', 'Yüzeyinin ~%71\'i su'], ay: true },
  { id: 'mars', ad: 'Mars', d: 360, b: ['Kızıl gezegen: pas rengi toprak', 'En yüksek volkan: Olympus Mons'] },
  { id: 'jupiter', ad: 'Jüpiter', d: 640, b: ['En büyük gezegen', 'Kırmızı Leke: dev bir fırtına'] },
  { id: 'saturn', ad: 'Satürn', d: 1000, w: 400, rot: -14, b: ['Halkaları buz ve kaya parçası', 'Yoğunluğu sudan bile düşük'] },
  { id: 'uranus', ad: 'Uranüs', d: 480, rot: 82, b: ['Yan yatmış döner (~98°)', 'Soğuk bir buz devi'] },
  { id: 'neptun', ad: 'Neptün', d: 470, b: ['Güneş\'e en uzak gezegen', 'Rüzgarları ~2.000 km/sa'] },
];
const P0 = 9.8;
const STEP = 4.6;
PLANETS.forEach((p, i) => {
  const t0 = r2(P0 + i * STEP);
  const t1 = r2(t0 + STEP + 0.1);
  layers.push({
    id: p.id, asset: p.id, x: 540, y: 860, scale: r2(p.d / (p.w || 200)), rotation: p.rot || 0, start: t0, end: t1,
    anims: [
      { preset: 'ekrana-gir', t: t0, dur: 0.9, yon: 'sag', yay: 60, ease: 'outCubic' },
      { preset: 'katlanarak-gir', t: t0, dur: 1.0, sira: 'radial' },
      { preset: 'suzul', t: t0 + 1, genlik: 10, periyot: 3 },
      { preset: 'ekrandan-cik', t: t1 - 0.65, dur: 0.55, yon: 'sol', ease: 'inCubic' },
    ],
  });
  if (p.ay) {
    layers.push({
      id: 'ay', asset: 'ay', x: 880, y: 590, scale: 0.55, start: t0, end: t1,
      anims: [
        { preset: 'zipla-gir', t: t0 + 0.9, dur: 0.6 },
        { preset: 'suzul', t: t0 + 1.5, genlik: 16, periyot: 2.5 },
        { preset: 'ekrandan-cik', t: t1 - 0.7, dur: 0.55, yon: 'sol', ease: 'inCubic' },
      ],
    });
  }
  layers.push(title(`${p.id}-ad`, p.ad, t0, t1));
  layers.push(label(`${p.id}-etiket`, `${i + 1}. gezegen`, t0, t1));
  layers.push(fact(`${p.id}-b1`, p.b[0], 1300, t0, t1, 0.9));
  layers.push(fact(`${p.id}-b2`, p.b[1], 1385, t0, t1, 1.5));
});

// ------------------------------------------------------------ kapanış: dizilim
const E0 = r2(P0 + PLANETS.length * STEP + 0.2); // ~39.8
const END = r2(E0 + 7);
layers.push({
  id: 'gunes-son', asset: 'gunes', x: 540, y: 50, scale: 3.4, start: E0,
  anims: [{ preset: 'ekrana-gir', t: E0, dur: 1, yon: 'ust', yay: 0, ease: 'outCubic' }, { preset: 'don', t: E0, periyot: 40 }],
});
layers.push({ id: 'kapanis-patlama', type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: 540, y: 150, count: 90, size: 30, life: 3.5, start: r2(E0 + 0.6) });
const small = [70, 92, 98, 78, 190, 128, 118, 114]; // gezegen çapları (px)
let y = 380;
PLANETS.forEach((p, i) => {
  if (i > 0) y += small[i - 1] / 2 + small[i] / 2 + 14;
  const t = r2(E0 + 0.5 + i * 0.22);
  const w = p.id === 'saturn' ? 128 * 400 / 170 : small[i];
  layers.push({
    id: `${p.id}-son`, asset: p.id, x: 330, y: Math.round(y), scale: r2(w / (p.w || 200)), rotation: p.rot || 0, start: E0,
    anims: [{ preset: 'zipla-gir', t, dur: 0.6 }, { preset: 'suzul', t: t + 0.6, genlik: 6, periyot: 2.5 + i * 0.2 }],
  });
  layers.push({
    id: `${p.id}-son-ad`, type: 'text', textStyle: 'alt-baslik', text: p.ad, x: 560, y: Math.round(y), size: 50, align: 'left', start: E0,
    anims: [{ preset: 'kayarak-gir', t: t + 0.15, dur: 0.5, yon: 'sag', mesafe: 120, ease: 'outCubic' }],
  });
});
layers.push({
  id: 'kapanis', type: 'text', textStyle: 'etiket-kutu', text: 'Hepsi Güneş\'in etrafında döner', x: 540, y: 1460, size: 40, start: E0,
  anims: [{ preset: 'zipla-gir', t: E0 + 2.6, dur: 0.6 }, { preset: 'nabiz', t: E0 + 3.4, genlik: 0.04, periyot: 1.8 }],
});

const scene = {
  name: 'Güneş Sistemi',
  width: 1080,
  height: 1920,
  fps: 30,
  duration: END,
  theme: 'uzay',
  // Örnek müzik 120 BPM; ilk arpej notası 0.25 sn'de (otomatik algılama bu sentez pedlerde yanılıyor)
  audio: [{ file: 'uzay-ambiyans.wav', start: 0, volume: 0.65, fadeIn: 1.5, fadeOut: 2.5, bpm: 120, beatOffset: 0.25 }],
  sfx: { auto: true, volume: 0.5 },
  sections: [
    { t: 0, name: 'Açılış' },
    { t: S0, name: 'Güneş' },
    ...PLANETS.map((p, i) => ({ t: r2(P0 + i * STEP), name: p.ad })),
    { t: E0, name: 'Kapanış' },
  ],
  // Aynı videonun diğer platform formatları (D1)
  formats: [
    { id: 'youtube', name: 'YouTube 16:9', width: 1920, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.43, zoom: 1.35 },
    { id: 'square', name: 'Kare 1:1', width: 1080, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.45, zoom: 1.2 },
    { id: 'portrait', name: 'Instagram 4:5', width: 1080, height: 1350, mode: 'kirp', focusX: 0.5, focusY: 0.46, zoom: 1 },
  ],
  transitions: [
    { type: 'iris', t: 4.15, dur: 1.0, color: '$arka2' },
    { type: 'sayfa-cevir', t: E0, dur: 1.1, color: '#dfe6ff' },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log('ok', scene.layers.length, 'katman,', END, 'sn');
