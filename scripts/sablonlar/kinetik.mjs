// Kinetik tipografi: satırlar müziğin vuruşlarına oturur; her satırda renk kesmesi, ritimle nabız, ses dalgası.
import { baglam, gerekli, sigdir, sar, r2, OZEL_MUZIK } from './lib.mjs';

const PALETLER = [
  ['#ff5d8f', '#ffd3e1', '#2b0a1a'],
  ['#3a86ff', '#cfe3ff', '#ffffff'],
  ['#ffbe0b', '#fff2c2', '#2b1a00'],
  ['#06d6a0', '#c8f7ea', '#06241c'],
  ['#8338ec', '#e3d2fb', '#ffffff'],
  ['#fb5607', '#ffd9c7', '#ffffff'],
];
const ANIMLER = ['harf-zipla', 'kelime-zipla', 'harf-don', 'harf-dus', 'harf-katla', 'satir-kay'];

export default {
  id: 'kinetik',
  ad: 'Kinetik tipografi (müzikli)',
  aciklama: 'Kısa cümleler vuruşa oturur: her satır renk kesmesiyle gelir, ritimle nabız atar, altta ses dalgası oynar.',
  ornek: {
    sablon: 'kinetik', id: 'sablon-kinetik', ad: 'Kinetik Örnek', format: 'reels', stil: 'duz', tema: 'gun-isigi',
    satirlar: ['Fikir', 'Kağıda dökülür', 'Hareketle canlanır', 'Müzikle atar', 'Hadi başlayalım!'],
    vuruslarPerSatir: 4,
    dalga: true,
  },
  uret(brief) {
    gerekli(brief, ['ad', 'satirlar'], 'kinetik');
    const c = baglam(brief, { tema: 'gun-isigi', stil: 'duz' });
    const { W, H, dikey } = c;
    const muzik = brief.muzik === false ? null : c.sesEkle(brief.muzik ?? {});
    const bpm = muzik?.bpm || brief.bpm || OZEL_MUZIK.bpm;
    const off = muzik?.beatOffset ?? brief.beatOffset ?? 0;
    const p = 60 / bpm;
    const vp = brief.vuruslarPerSatir || 4;
    const satirDur = p * vp;
    const t0 = off + p * 2; // 2 vuruşluk giriş boşluğu, ilk satır vuruşa oturur
    const satirlar = brief.satirlar.map((s) => (typeof s === 'string' ? { metin: s } : s));
    const palet = brief.renkler?.length ? brief.renkler : null;

    const bgA = [c.k(0, PALETLER[0][0])];
    const bgB = [c.k(0, PALETLER[0][1])];
    satirlar.forEach((s, i) => {
      const a = t0 + i * satirDur;
      const b = a + satirDur;
      const pl = palet ? [palet[i % palet.length], palet[(i + 1) % palet.length], '#ffffff'] : PALETLER[i % PALETLER.length];
      bgA.push(c.k(a, pl[0], 'step'));
      bgB.push(c.k(a, pl[1], 'step'));
      const g = c.grup(`g-satir${i + 1}`, `Satır ${i + 1}`, true);
      c.bolum(a, `${i + 1}`);
      const txt = s.metin;
      const satir = sar(txt, dikey ? 12 : 26);
      const size = sigdir(satir, 'baslik-kalin', W * 0.9, dikey ? 330 : 300);
      const ac = ANIMLER[i % ANIMLER.length];
      const renk = pl[2];
      c.L({
        id: `satir-${i + 1}`, group: g, type: 'text', textStyle: 'baslik-kalin', text: satir, x: W / 2, y: Math.round(H * (dikey ? 0.42 : 0.45)),
        size, color: renk, start: r2(a), end: r2(b),
        textAnims: [{ preset: ac, t: a + 0.05, dur: 0.42, aralik: ac.startsWith('harf') ? 0.035 : 0.12 }],
        anims: [
          { preset: 'ritimle-nabiz', t: a + 0.6, genlik: 0.1, keskinlik: 5 },
          { preset: 'kayarak-cik', t: b - 0.25, dur: 0.22, yon: i % 2 ? 'sag' : 'sol', mesafe: 900, ease: 'inCubic' },
        ],
        ...(s.vurgu ? { stroke: { width: 10, color: pl[1] } } : {}),
      });
      if (i === satirlar.length - 1 || s.vurgu) {
        c.L({ id: `konfeti-${i + 1}`, group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: Math.round(H * 0.4), start: r2(a + 0.2), end: r2(b) });
      }
    });
    const sure = t0 + satirlar.length * satirDur + p * 2;
    if (brief.dalga !== false) {
      c.L({
        id: 'dalga', type: 'waveform', x: W / 2, y: Math.round(H * (dikey ? 0.82 : 0.86)), width: Math.round(W * 0.78), height: Math.round(Math.min(W, H) * 0.16),
        bars: dikey ? 28 : 48, color: '#ffffff', style: brief.dalgaStil || 'cubuk', gain: 1.2, start: r2(t0 - p),
        opacity: 0.9,
      });
    }
    return c.bitir(brief.ad, sure, {
      background: { type: 'linear', colors: [bgA, bgB], angle: 160, paper: 0.25, vignette: 0.12 },
    });
  },
};
