// ═══════════════════════════════════════════════════════════════════════════
//  SAHNE ÜRETECİ ŞABLONU — yeni her video için KOPYALA, sonra düzenle:
//     cp scripts/sablon-sahne.mjs scripts/scenes-<proje-id>.mjs
//     node scripts/scenes-<proje-id>.mjs
//  Rehber: docs/prompt-rehberi.md · Envanter: docs/katalog.md · Şema: docs/schema.md
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── 1. Proje kimliği ──────────────────────────────────────────────────────
const PROJE_ID = 'SABLON'; // ör. 'mevsimler' — küçük harf, rakam, tire
const PROJE_ADI = 'Yeni Video';
const FORMAT = { width: 1080, height: 1920 }; // 9:16 Reels/Shorts. 16:9 → 1920×1080
const FPS = 30;
const TEMA = 'gun-isigi'; // docs/katalog.md §3
const STIL = undefined; // undefined = origami · 'kagit-kesme' · 'duz'

if (PROJE_ID === 'SABLON') {
  console.log('Bu bir şablon. Önce kopyala:  scripts/scenes-<proje-id>.mjs  ve PROJE_ID değerini değiştir.');
  process.exit(0);
}

// ─── 2. Yardımcılar (kanıtlanmış değerler — değiştirmeden kullan) ──────────
const W = FORMAT.width;
const H = FORMAT.height;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

// 9:16 güvenli bölgeler (Reels arayüzü üst ~%12, alt ~%22 kaplar)
const Y = { baslik: 250, alt: 360, merkez: 860, bilgi1: 1300, bilgi2: 1385, bilgi3: 1470 };

/** Bölüm başlığı: harf harf girer, bölüm sonunda sola kayar */
const baslik = (id, group, text, t0, t1, o = {}) =>
  L({
    id, group, type: 'text', textStyle: 'baslik-kalin', text, x: W / 2, y: Y.baslik, start: t0, end: t1,
    textAnims: [{ preset: o.anim || 'harf-don', t: t0 + 0.15, dur: 0.5, aralik: 0.05 }],
    anims: [{ preset: 'kayarak-cik', t: t1 - 0.6, dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' }],
    ...o.extra,
  });

/** Etiket kutusu (ör. "3. gezegen") */
const etiket = (id, group, text, t0, t1, y = Y.alt + 60) =>
  L({
    id, group, type: 'text', textStyle: 'etiket-kutu', text, x: W / 2, y, start: t0, end: t1,
    anims: [{ preset: 'zipla-gir', t: t0 + 0.4, dur: 0.5 }, { preset: 'sol', t: t1 - 0.55, dur: 0.35 }],
  });

/** Bilgi satırı: daktilo ile yazılır. Okuma: ≥ 1.2 sn / 5 kelime ekranda kalmalı */
const bilgi = (id, group, text, y, t0, t1, gecikme) =>
  L({
    id, group, type: 'text', textStyle: 'alt-baslik', text: `• ${text}`, x: W / 2, y, size: 46, start: t0, end: t1,
    reveal: [k(t0 + gecikme, 0), k(t0 + gecikme + 0.8, 1, 'linear')],
    anims: [{ preset: 'sol', t: t1 - 0.55, dur: 0.35 }],
  });

/** Ana nesne: katlanarak açılır, süzülür, bölüm sonunda ekrandan çıkar */
const kahraman = (id, group, asset, t0, t1, px = 440, o = {}) => {
  const size = o.size || 200; // varlığın en uzun kenarı (katalog §1)
  return L({
    id, group, asset, x: W / 2, y: Y.merkez, scale: r2(px / size), start: t0, end: t1, ...o.extra,
    anims: [
      { preset: 'katlanarak-gir', t: t0, dur: 1.0, sira: 'radial' },
      { preset: 'suzul', t: t0 + 1, genlik: 10, periyot: 3 },
      { preset: 'ekrandan-cik', t: t1 - 0.65, dur: 0.55, yon: 'sol', ease: 'inCubic' },
    ],
  });
};

// ─── 3. Zaman planı (bölüm başı saniyeleri) ────────────────────────────────
// Kural: bilgi başına ≥ 2.5 sn okuma; bölüm = giriş 1 sn + içerik + çıkış 0.6 sn
const S = { acilis: 0, bolum1: 4, bolum2: 9, kapanis: 14 };
const SURE = 18;

// ─── 4. İçerik ─────────────────────────────────────────────────────────────
// Açılış
L({
  id: 'acilis-baslik', group: 'g-acilis', type: 'text', textStyle: 'baslik-kalin', text: PROJE_ADI, x: W / 2, y: 820, size: 170,
  end: S.bolum1, textAnims: [{ preset: 'harf-katla', t: 0.3, dur: 0.6, aralik: 0.05 }],
});
L({ id: 'acilis-konfeti', group: 'g-acilis', type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: 780, start: 1.0, end: S.bolum1 });

// Bölüm 1 — örnek
baslik('b1-baslik', 'g-b1', 'Birinci Bölüm', S.bolum1, S.bolum2);
kahraman('b1-tilki', 'g-b1', 'tilki', S.bolum1, S.bolum2, 460);
bilgi('b1-bilgi1', 'g-b1', 'İlk kısa bilgi', Y.bilgi1, S.bolum1, S.bolum2, 1.0);
bilgi('b1-bilgi2', 'g-b1', 'İkinci kısa bilgi', Y.bilgi2, S.bolum1, S.bolum2, 1.6);

// Bölüm 2 — hareket yolu örneği
baslik('b2-baslik', 'g-b2', 'İkinci Bölüm', S.bolum2, S.kapanis, { anim: 'harf-zipla' });
L({
  id: 'b2-turna', group: 'g-b2', asset: 'turna', scale: 1.1, scaleX: -1, start: S.bolum2, end: S.kapanis,
  path: { points: [[-140, 1100], [300, 820], [700, 1150], [1220, 850]], smooth: true, orient: true },
  pathT: [k(S.bolum2 + 0.3, 0), k(S.kapanis - 0.3, 1, [0.65, 0, 0.35, 1])],
  anims: [{ preset: 'kanat-cirp', t: S.bolum2, periyot: 0.6 }],
});

// Kapanış
L({
  id: 'kapanis-baslik', group: 'g-kapanis', type: 'text', textStyle: 'baslik-kalin', text: 'Teşekkürler!', x: W / 2, y: 820, size: 150,
  start: S.kapanis, textAnims: [{ preset: 'harf-zipla', t: S.kapanis + 0.4, dur: 0.45, aralik: 0.04 }],
});

// Hazır bileşen (grafik, kart, liste, kod, zamanlayıcı…): npm run bilesen -- "<sorgu>" ile id bul, sonra
//   import { bilesenBaglam } from './lib/bilesen.mjs';  const B = bilesenBaglam({ W, H, tema: TEMA });
//   L(B('fiyat-pro', { id: 'plan', konum: 'orta', genislik: 0.8, start: 4, end: 9, varyant: ['koyu'], tema: true, title: 'Takım' }));
//   Alanlar: npm run bilesen -- --alanlar fiyat-pro

// ─── 5. Sahne ──────────────────────────────────────────────────────────────
const scene = {
  name: PROJE_ADI,
  width: W,
  height: H,
  fps: FPS,
  duration: SURE,
  // Paylaşım bilgisi (Stüdyo → Paylaşım sekmesi): videoya göre doldur. tags '#'sız yazılır.
  publish: { title: '', description: '', tags: [] },
  theme: TEMA,
  ...(STIL ? { style: STIL } : {}),
  // Müzik (katalog §10) — kendi müziğin için bpm/beatOffset'i stüdyoda "Algıla" ile bul
  audio: [{ file: 'uzay-ambiyans.wav', start: 0, volume: 0.55, fadeIn: 1, fadeOut: 2.5, bpm: 120, beatOffset: 0.25 }],
  sfx: { auto: true, volume: 0.5 },
  sections: [
    { t: S.acilis, name: 'Açılış' },
    { t: S.bolum1, name: 'Bölüm 1' },
    { t: S.bolum2, name: 'Bölüm 2' },
    { t: S.kapanis, name: 'Kapanış' },
  ],
  // t = kesme anı: o bölümün katmanları tam bu saniyede başlamalı (start = t)
  transitions: [
    { type: 'katlama', t: S.bolum1, dur: 1.2, color: '$arka2' },
    { type: 'iris', t: S.bolum2, dur: 1.0, color: '$vurgu' },
    { type: 'perde', t: S.kapanis, dur: 1.2, color: '$vurgu' },
  ],
  groups: [
    { id: 'g-acilis', name: 'Açılış', collapsed: true },
    { id: 'g-b1', name: 'Bölüm 1' },
    { id: 'g-b2', name: 'Bölüm 2' },
    { id: 'g-kapanis', name: 'Kapanış', collapsed: true },
  ],
  formats: [
    { id: 'youtube', name: 'YouTube 16:9', width: 1920, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.46, zoom: 1.3 },
    { id: 'square', name: 'Kare 1:1', width: 1080, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.47, zoom: 1.2 },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

// ─── 6. Yaz ────────────────────────────────────────────────────────────────
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);

// ─── 7. Sonra: kareleri render edip BAK (docs/prompt-rehberi.md §5) ─────────
