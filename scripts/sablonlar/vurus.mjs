// Vuruş metni: kelimeler müziğin her vuruşunda ekrana çarpar; her satırda zemin rengi, dekor ve kamera darbesi değişir.
import { gerekli } from './lib.mjs';
import { reels, parlaklik } from './reels.mjs';

const DEKOR = ['patlama', 'halkalar', 'seritler', 'daireler', 'elmaslar'];

export default {
  id: 'vurus',
  ad: 'Vuruş metni',
  etiket: 'Hook · Kinetik',
  sure: '10–20 sn',
  aciklama: 'Kelimeler her vuruşta ekrana çarpar. Her satırda renk, dekor ve kamera değişir; *yıldızlı* kelime vurgu kutusuyla öne çıkar. Hook için ideal.',
  ornek: {
    sablon: 'vurus', id: 'sablon-vurus', ad: 'Vuruş Metni', format: 'reels', palet: 'canli', muzik: 'pop-120', font: 'Anton',
    satirlar: ['Dur! *Kaydırma*', 'Bu 10 saniye', 'hayatını *değiştirebilir*', 'Dene ve *gör*'],
    cta: 'Takip et!', dalga: true,
    yayin: { baslik: 'Bunu kaçırma! 10 saniyede dikkat çek', aciklama: 'Vuruşa oturan hızlı yazı videosu. Beğen, kaydet ve takip etmeyi unutma!', etiketler: ['reels', 'shorts', 'motivasyon', 'viral', 'kinetik'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'satirlar'], 'vurus');
    const c = reels(brief, { palet: 'canli', muzik: 'pop-120', font: 'Anton' });
    const { W, H } = c;
    let b = 0;
    const bgler = [];
    const vuruslar = [];
    brief.satirlar.forEach((satir, i) => {
      const g = c.grup(`g-satir${i + 1}`, `Satır ${i + 1}`, true);
      const a = c.vurus(b);
      c.bolum(a, `${i + 1}`);
      bgler.push({ t: a, i });
      if (i) c.flas(`flas-${i + 1}`, a, { alfa: 0.55 });
      const r = c.yigin(`s${i + 1}`, satir, b, { i, grup: g, dekor: DEKOR[i % DEKOR.length], vp: brief.vuruslarPerKelime || 1 });
      vuruslar.push(...r.vuruslar);
      b += r.beats;
    });
    const tK = c.vurus(b);
    const tEnd = c.vurus(b + 6);
    bgler.push({ t: tK, i: brief.satirlar.length });
    c.kapanis(tK, tEnd, brief.cta || 'Takip et!', brief.alt, { i: brief.satirlar.length });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(b + j));
    if (brief.dalga !== false) {
      c.L({
        id: 'dalga', type: 'waveform', style: 'cubuk', x: W / 2, y: Math.round(H * 0.87), width: Math.round(W * 0.74), height: Math.round(H * 0.07),
        bars: 24, color: '#ffffff', gain: 1.4, opacity: 0.8, start: 0, end: tEnd,
      });
    }
    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan(bgler),
      camera: c.kameraVurus(vuruslar, { zoom: 0.05, egim: 1.1 }),
    });
  },
};
