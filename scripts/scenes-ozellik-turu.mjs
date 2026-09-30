// "Özellik Turu" — Faz 10–13 özelliklerini gezdiren örnek proje üreteci.
//   node scripts/scenes-ozellik-turu.mjs   (scene.json'u baştan yazar)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', 'ozellik-turu');
const k = (t, v, ease) => (ease ? { t, v, ease } : { t, v });
const layers = [];
const L = (o) => layers.push(o);

// Bölüm kesme anları
const S = { acilis: 0, yol: 4, easing: 12, efekt: 19, klasor: 27, kapanis: 34 };
const END = 38.5;

// Başlık + alt başlık yardımcıları
const title = (id, group, text, t0, t1, anim = 'harf-don') => L({
  id, group, type: 'text', textStyle: 'baslik-kalin', text, x: 540, y: 250, size: 130, start: t0, end: t1,
  textAnims: [{ preset: anim, t: t0 + 0.35, dur: 0.5, aralik: 0.05 }],
});
const sub = (id, group, text, t0, t1, y = 360) => L({
  id, group, type: 'text', textStyle: 'alt-baslik', text, x: 540, y, size: 42, start: t0, end: t1,
  textAnims: [{ preset: 'harf-belir', t: t0 + 0.9, dur: 0.35, aralik: 0.02 }],
});

// ------------------------------------------------------------ 1. Açılış
L({
  id: 'acilis-baslik', group: 'g-acilis', type: 'text', textStyle: 'baslik-kalin', text: 'Yeni Özellikler', x: 540, y: 800, size: 170, end: S.yol,
  textAnims: [{ preset: 'harf-katla', t: 0.3, dur: 0.6, aralik: 0.05 }],
});
L({
  id: 'acilis-etiket', group: 'g-acilis', type: 'text', textStyle: 'etiket-kutu', text: 'Faz 10–13 turu', x: 540, y: 960, end: S.yol,
  anims: [{ preset: 'zipla-gir', t: 1.0, dur: 0.6 }],
});
L({
  id: 'acilis-ipucu', group: 'g-acilis', type: 'text', textStyle: 'alt-baslik', size: 38, x: 540, y: 1180, end: S.yol,
  text: 'Zaman çizelgesinde klasörleri aç,\nkatmanları seç ve denetçiye bak',
  textAnims: [{ preset: 'harf-belir', t: 1.8, dur: 0.3, aralik: 0.015 }],
});
L({ id: 'acilis-konfeti', group: 'g-acilis', type: 'particles', particle: 'konfeti', mode: 'patlama', x: 540, y: 760, start: 1.1, end: S.yol });

// ------------------------------------------------------- 2. Hareket yolu
title('yol-baslik', 'g-yol', 'Hareket yolu', S.yol, S.easing);
sub('yol-alt', 'g-yol', 'turna yolun yönüne döner · kelebek kapalı yolda 2 tur', S.yol, S.easing);
L({
  id: 'yol-turna', group: 'g-yol', asset: 'turna', start: S.yol, end: S.easing, scale: 1.15, scaleX: -1,
  // Sola bakan model aynalanır (scaleX -1) → yöne dönünce sağa doğru uçar
  path: { points: [[-140, 1150], [260, 820], [560, 1180], [860, 720], [1240, 940]], smooth: true, orient: true, orientOffset: 0 },
  pathT: [k(4.4, 0), k(11.6, 1, [0.65, 0, 0.35, 1])],
  anims: [{ preset: 'kanat-cirp', t: S.yol, periyot: 0.6 }],
});
{
  // Kapalı elips yol: pathT 0→2 = iki tur
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [Math.round(540 + Math.cos(a) * 330), Math.round(1480 + Math.sin(a) * 170)];
  });
  L({
    id: 'yol-kelebek', group: 'g-yol', asset: 'kelebek', variant: 'turuncu', start: S.yol, end: S.easing, scale: 0.9,
    path: { points: pts, smooth: true, closed: true },
    pathT: [k(4.6, 0), k(11.6, 2, 'linear')],
    anims: [{ preset: 'kanat-cirp', t: S.yol, eksen: 'X', periyot: 0.3, alt: 0.1 }, { preset: 'katlanarak-gir', t: 4.6, dur: 0.8 }],
  });
}

L({
  id: 'yol-ipucu', group: 'g-yol', type: 'text', textStyle: 'etiket-kutu', size: 34, x: 540, y: 1760, start: 5.2, end: S.easing,
  text: 'Stüdyoda turnayı seç → yol ve noktaları görünür',
  anims: [{ preset: 'zipla-gir', t: 5.3, dur: 0.5 }],
});

// ---------------------------------------------------- 3. Easing eğrileri
title('easing-baslik', 'g-easing', 'Easing eğrileri', S.easing, S.efekt, 'harf-zipla');
sub('easing-alt', 'g-easing', 'aynı süre, aynı mesafe — farklı his', S.easing, S.efekt);
const EASES = [
  ['linear', 'linear'],
  ['inOutCubic', 'inOutCubic'],
  ['yumuşak iniş  [0.16, 1, 0.3, 1]', [0.16, 1, 0.3, 1]],
  ['outBounce (sekme)', 'outBounce'],
  ['taşma  [0.34, 1.56, 0.64, 1]', [0.34, 1.56, 0.64, 1]],
];
EASES.forEach(([label, e], i) => {
  const y = 640 + i * 200;
  L({
    id: `easing-etiket-${i + 1}`, group: 'g-easing', type: 'text', text: label, x: 150, y: y - 70, size: 34, weight: 700,
    align: 'left', color: '$metin', start: S.easing, end: S.efekt, anims: [{ preset: 'belir', t: 12.4 + i * 0.1, dur: 0.4 }],
  });
  L({
    id: `easing-yildiz-${i + 1}`, group: 'g-easing', asset: 'yildiz', variant: i % 2 ? 'gumus' : undefined, start: S.easing, end: S.efekt,
    y, scale: 0.5,
    // 13.2 → 15.7: sağa (aynı süre), 16.5 → 18.5: geri
    x: [k(13.2, 150), k(15.7, 930, e), k(16.5, 930), k(18.5, 150, e)],
    anims: [{ preset: 'zipla-gir', t: 12.5 + i * 0.1, dur: 0.5 }],
  });
});

// -------------------------------------------------- 4. Kütüphane efektleri
title('efekt-baslik', 'g-efekt', 'Kütüphane efektleri', S.efekt, S.klasor, 'harf-katla');
sub('efekt-alt', 'g-efekt', 'Kütüphane → Efektler: oluştur, düzenle, önizle', S.efekt, S.klasor);
L({ id: 'efekt-gunes', group: 'g-efekt', asset: 'gunes', variant: 'gunbatimi', x: 540, y: 1150, scale: 2.4, start: S.efekt, end: S.klasor, anims: [{ preset: 'katlanarak-gir', t: 19.3, dur: 1.2 }, { preset: 'don', t: 20.5, periyot: 30 }] });
L({ id: 'efekt-ucaklar', group: 'g-efekt', type: 'particles', particle: 'kagit-ucaklar', start: S.efekt, end: S.klasor, seed: 4 });
L({ id: 'efekt-yildizlar', group: 'g-efekt', type: 'particles', particle: 'yildiz-yagmuru', start: 22.5, end: S.klasor, count: 50, seed: 2, prewarm: true });
L({
  id: 'efekt-not', group: 'g-efekt', type: 'text', textStyle: 'etiket-kutu', text: '22.5 sn: ikinci efekt başlar', x: 540, y: 1560, size: 36,
  start: 22.3, end: S.klasor, anims: [{ preset: 'zipla-gir', t: 22.4, dur: 0.5 }],
});

// ------------------------------------------------------------- 5. Klasörler
title('klasor-baslik', 'g-kapanis-bas', 'Klasörler', S.klasor, S.kapanis, 'kelime-zipla');
sub('klasor-alt', 'g-kapanis-bas', '"Orman" ve "Gökyüzü" klasörlerini aç\nS = solo · kilit = sahnede seçilemez', S.klasor, S.kapanis, 380);
const K0 = S.klasor;
L({ id: 'gok-gunes', group: 'g-gok', asset: 'gunes', x: 800, y: 650, scale: 1.7, start: K0, end: S.kapanis, anims: [{ preset: 'katlanarak-gir', t: K0 + 0.3, dur: 1.2 }] });
L({ id: 'gok-bulut-1', group: 'g-gok', asset: 'bulut', x: 260, y: 560, scale: 1.3, start: K0, end: S.kapanis, anims: [{ preset: 'kayarak-gir', t: K0 + 0.5, dur: 1, yon: 'sol', mesafe: 400, ease: 'outCubic' }, { preset: 'suzul', t: K0 + 1.5, genlik: 12, periyot: 4 }] });
L({ id: 'gok-bulut-2', group: 'g-gok', asset: 'bulut', variant: 'pembe', x: 880, y: 860, scale: 0.9, start: K0, end: S.kapanis, anims: [{ preset: 'kayarak-gir', t: K0 + 0.7, dur: 1, yon: 'sag', mesafe: 400, ease: 'outCubic' }] });
L({ id: 'orman-dag', group: 'g-orman', asset: 'dag', x: 330, y: 1690, anchor: [0.5, 1], scale: 2.6, start: K0, end: S.kapanis, anims: [{ preset: 'katlanarak-gir', t: K0 + 0.4, dur: 1.2, sira: 'bottom' }] });
L({ id: 'orman-tepeler', group: 'g-orman', asset: 'tepeler', x: 540, y: 1930, anchor: [0.5, 1], scale: 2.9, start: K0, end: S.kapanis, locked: true, anims: [{ preset: 'kayarak-gir', t: K0, dur: 0.9, yon: 'alt', mesafe: 380, ease: 'outCubic' }] });
[[150, 1700, 1.5, 'sonbahar'], [950, 1720, 1.8, undefined], [790, 1670, 1.15, 'koyu']].forEach(([x, y, s, v], i) =>
  L({ id: `orman-agac-${i + 1}`, group: 'g-orman', asset: 'cam-agaci', variant: v, x, y, anchor: [0.5, 1], scale: s, start: K0, end: S.kapanis, anims: [{ preset: 'dusup-gir', t: K0 + 1 + i * 0.2, mesafe: 500 }] }),
);
L({
  id: 'orman-tilki', group: 'g-orman', asset: 'tilki', x: 530, y: 1690, anchor: [0.5, 1], scale: 2.1, start: K0, end: S.kapanis, shadow: true,
  anims: [{ preset: 'zipla-gir', t: K0 + 1.8, dur: 0.8 }, { preset: 'kuyruk-salla', t: K0 + 2.6, aci: 9, periyot: 1.8 }, { preset: 'nefes', t: K0 + 2.6 }],
});

// ------------------------------------------------------------- 6. Kapanış
L({
  id: 'kapanis-baslik', group: 'g-kapanis', type: 'text', textStyle: 'baslik-kalin', text: 'Keşfetmeye başla!', x: 540, y: 820, size: 150, start: S.kapanis,
  textAnims: [{ preset: 'harf-zipla', t: 34.5, dur: 0.45, aralik: 0.04 }, { preset: 'dalga', t: 35.8, genlik: 0.06, periyot: 1.6 }],
});
L({
  id: 'kapanis-alt', group: 'g-kapanis', type: 'text', textStyle: 'etiket-kutu', text: 'docs/schema.md §6–§9', x: 540, y: 980, start: S.kapanis,
  anims: [{ preset: 'zipla-gir', t: 35.4, dur: 0.6 }],
});
L({ id: 'kapanis-konfeti', group: 'g-kapanis', type: 'particles', particle: 'konfeti', mode: 'patlama', x: 540, y: 780, start: 35.0 });
L({ id: 'kapanis-tozu', group: 'g-kapanis', type: 'particles', particle: 'yildiz-tozu', start: S.kapanis, count: 40, colors: ['#ffd166', '#ffffff', '#e76f51'] });

const scene = {
  name: 'Özellik Turu',
  width: 1080,
  height: 1920,
  fps: 30,
  duration: END,
  theme: 'gun-isigi',
  audio: [{ file: 'uzay-ambiyans.wav', start: 0, volume: 0.55, fadeIn: 1, fadeOut: 2.5, bpm: 120, beatOffset: 0.25 }],
  sfx: { auto: true, volume: 0.5 },
  sections: [
    { t: S.acilis, name: 'Açılış' },
    { t: S.yol, name: 'Hareket yolu' },
    { t: S.easing, name: 'Easing' },
    { t: S.efekt, name: 'Efektler' },
    { t: S.klasor, name: 'Klasörler' },
    { t: S.kapanis, name: 'Kapanış' },
  ],
  transitions: [
    { type: 'katlama', t: S.yol, dur: 1.2, color: '$arka2', kat: 6 },
    { type: 'iris', t: S.easing, dur: 1.0, color: '$vurgu' },
    { type: 'yirtik', t: S.efekt, dur: 1.2, color: '#fffaf0', seed: 5 },
    { type: 'sayfa-cevir', t: S.klasor, dur: 1.1, color: '#fffaf0' },
    { type: 'perde', t: S.kapanis, dur: 1.2, color: '$vurgu' },
  ],
  groups: [
    { id: 'g-acilis', name: 'Açılış', collapsed: true },
    { id: 'g-yol', name: 'Hareket yolu' },
    { id: 'g-easing', name: 'Easing karşılaştırma', collapsed: true },
    { id: 'g-efekt', name: 'Efektler', collapsed: true },
    { id: 'g-kapanis-bas', name: 'Klasörler — başlık', collapsed: true },
    { id: 'g-gok', name: 'Gökyüzü' },
    { id: 'g-orman', name: 'Orman' },
    { id: 'g-kapanis', name: 'Kapanış', collapsed: true },
  ],
  formats: [
    { id: 'youtube', name: 'YouTube 16:9', width: 1920, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.47, zoom: 1.3 },
    { id: 'square', name: 'Kare 1:1', width: 1080, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.48, zoom: 1.2 },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log('ok', scene.layers.length, 'katman,', END, 'sn');
