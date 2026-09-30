// Showreel / portfolyo: vuruşa oturan hızlı kesmeler; her karede büyük başlık, nesne (ya da resim/video) ve derinlik yankısı.
import { baglam, gerekli, nesneSec, sigdir, sar, r2, OZEL_MUZIK } from './lib.mjs';

const RENKLER = [
  ['#ff5d8f', '#ffb3c9'],
  ['#3a86ff', '#a9ccff'],
  ['#ffbe0b', '#ffe69a'],
  ['#06d6a0', '#a4f0dc'],
  ['#8338ec', '#c9a6f7'],
  ['#fb5607', '#ffb590'],
];
const GECIS = ['kaydir', 'yakinlas', 'kaydir', 'sayfa-cevir'];

export default {
  id: 'showreel',
  ad: 'Showreel / portfolyo',
  aciklama: 'Vuruşa oturan hızlı kareler. Her karede başlık + nesne (kütüphane) ya da kendi resim/video dosyan; ritimle nabız ve kamera vuruşu.',
  ornek: {
    sablon: 'showreel', id: 'sablon-showreel', ad: 'Showreel', format: 'reels', stil: 'kagit-kesme', tema: 'gun-isigi',
    kareler: [
      { baslik: 'Hayvanlar', alt: 'tilki · turna · martı', nesne: 'tilki' },
      { baslik: 'Uzay', alt: 'gezegenler', nesne: 'saturn' },
      { baslik: 'Doğa', alt: 'dağ · ağaç', nesne: 'cam-agaci' },
      { baslik: 'Deniz', alt: 'balina · gemi', nesne: 'balina' },
    ],
    vuruslarPerKare: 4,
  },
  uret(brief) {
    gerekli(brief, ['ad', 'kareler'], 'showreel');
    const c = baglam(brief, { tema: 'gun-isigi', stil: 'kagit-kesme' });
    const { W, H, dikey, m } = c;
    const muzik = brief.muzik === false ? null : c.sesEkle(brief.muzik ?? {});
    const bpm = muzik?.bpm || brief.bpm || OZEL_MUZIK.bpm;
    const off = muzik?.beatOffset ?? brief.beatOffset ?? 0;
    const p = 60 / bpm;
    const kareDur = p * (brief.vuruslarPerKare || 4);
    const t0 = off + p * 2;
    const kareler = brief.kareler;
    const palet = brief.renkler?.length ? brief.renkler.map((r) => [r, r]) : RENKLER;

    // Açılış karesi (2 vuruş)
    const bgA = [c.k(0, palet[0][0])];
    const bgB = [c.k(0, palet[0][1])];
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.metin('acilis', gA, brief.ad, 0, t0, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.45), sar: dikey ? 12 : 24, maxW: W * 0.9, color: '#fff',
      giris: [{ preset: 'harf-katla', t: 0.2, dur: 0.5, aralik: 0.04 }], cikis: [], extra: { color: '#ffffff' },
    });
    const camZ = [c.k(0, 1)];
    kareler.forEach((k, i) => {
      const a = t0 + i * kareDur;
      const b = a + kareDur;
      const pl = palet[(i + 1) % palet.length];
      bgA.push(c.k(a, pl[0], 'step'));
      bgB.push(c.k(a, pl[1], 'step'));
      camZ.push(c.k(a, 1.0, 'step'), c.k(a + 0.25, 1.07, 'outCubic'), c.k(b - 0.02, 1.0, 'inOutSine'));
      const g = c.grup(`g-kare${i + 1}`, `Kare ${i + 1}`, true);
      c.bolum(a, k.baslik || `Kare ${i + 1}`);
      c.gecis(GECIS[i % GECIS.length], a, GECIS[i % GECIS.length] === 'yakinlas' ? 0.5 : 0.45, '$vurgu');
      const baslik = sar(k.baslik || '', dikey ? 12 : 22);
      c.L({
        id: `kare${i + 1}-baslik`, group: g, type: 'text', textStyle: 'baslik-kalin', text: baslik, x: W / 2, y: c.Y(0.17, 0.18),
        size: sigdir(baslik, 'baslik-kalin', W * 0.9, dikey ? 230 : 190), color: '#ffffff', start: r2(a), end: r2(b),
        textAnims: [{ preset: i % 2 ? 'harf-don' : 'harf-zipla', t: a + 0.05, dur: 0.4, aralik: 0.035 }],
        anims: [{ preset: 'ritimle-nabiz', t: a + 0.5, genlik: 0.06 }],
        shadow: { color: 'rgba(0,0,0,0.25)', blur: 18, y: 8 },
      });
      if (k.alt) c.metin(`kare${i + 1}-alt`, g, k.alt, a, b, { stil: 'etiket-kutu', x: W / 2, y: c.Y(0.26, 0.3), giris: [], cikis: [], extra: { anims: [{ preset: 'zipla-gir', t: a + 0.3, dur: 0.4 }] } });
      const px = Math.round(dikey ? W * 0.62 : H * 0.6);
      const cy = c.Y(0.56, 0.58);
      if (k.medya) {
        c.L({ id: `kare${i + 1}-medya`, group: g, type: 'media', src: k.medya, x: W / 2, y: cy, width: Math.round(dikey ? W * 0.78 : W * 0.4), start: r2(a), end: r2(b), anims: [{ preset: 'zipla-gir', t: a, dur: 0.5 }, { preset: 'ritimle-nabiz', t: a + 0.5, genlik: 0.05 }] });
      } else {
        // Derinlik yankısı: aynı nesne büyük, bulanık ve uzakta
        c.nesne(`kare${i + 1}-yanki`, g, nesneSec(k.nesne), a, b, Math.round(px * 1.5), {
          x: W / 2, y: cy, yasam: false, cikis: 'sol', anims: [], extra: { depth: 0.6, blur: 12, opacity: 0.4, scaleX: -1 },
        });
        c.nesne(`kare${i + 1}-nesne`, g, nesneSec(k.nesne), a, b, px, {
          x: W / 2, y: cy, variant: k.varyant, yasam: false, cikis: 'sol',
          anims: [{ preset: 'ritimle-zipla', t: a + 0.6, yukseklik: 26 }],
        });
      }
    });
    const sure = t0 + kareler.length * kareDur + p * 2;
    return c.bitir(brief.ad, sure, {
      background: { type: 'linear', colors: [bgA, bgB], angle: 150, paper: 0.35, vignette: 0.15 },
      camera: { zoom: camZ, x: W / 2, y: H / 2 },
    });
  },
};
