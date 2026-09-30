// "En iyi N" liste videosu: büyük sıra numarası, ad, tek satır bilgi, nesne; iterek kaydırma geçişi.
import { baglam, gerekli, kelimeSayisi, nesneSec, r2, clamp } from './lib.mjs';

export default {
  id: 'liste',
  ad: 'Liste / "En iyi N"',
  aciklama: 'Geri sayım (5 → 1) ya da ileri sıralı liste. Her madde: sıra numarası, ad, bilgi, nesne. Son maddede konfeti.',
  ornek: {
    sablon: 'liste', id: 'sablon-liste', ad: 'En Hızlı 3 Hayvan', format: 'reels', tema: 'sonbahar', siralama: 'geri',
    maddeler: [
      { ad: 'Tilki', bilgi: 'Saatte 50 km hıza çıkabilir', nesne: 'tilki' },
      { ad: 'Turna', bilgi: 'Göç ederken günlerce uçar', nesne: 'turna' },
      { ad: 'Kelebek', bilgi: 'Küçük ama çok çevik', nesne: 'kelebek' },
    ],
    bitis: 'Sence hangisi?',
  },
  uret(brief) {
    gerekli(brief, ['ad', 'maddeler'], 'liste');
    const c = baglam(brief, { tema: 'sonbahar' });
    const { W, H, dikey } = c;
    const n = brief.maddeler.length;
    const geri = (brief.siralama || 'geri') === 'geri';
    const cikisKay = { preset: 'kayarak-cik', dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' };
    const gA = c.grup('g-acilis', 'Açılış', true);
    const tA = 3.2;
    c.bolum(0, 'Açılış');
    c.metin('acilis-baslik', gA, brief.ad, 0, tA, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.42), sar: dikey ? 14 : 26, maxW: W * 0.9,
      giris: [{ preset: 'harf-katla', t: 0.3, dur: 0.6, aralik: 0.05 }], cikis: [{ ...cikisKay, t: tA - 0.6 }],
    });
    let t = tA;
    brief.maddeler.forEach((it, i) => {
      const no = geri ? n - i : i + 1;
      const dur = r2(clamp(3.4 + kelimeSayisi(it.bilgi) / 3, 4.4, 7));
      const t0 = t;
      const t1 = t + dur;
      const g = c.grup(`g-madde${i + 1}`, `${no}. ${it.ad}`);
      c.bolum(t0, `${no}. ${it.ad}`);
      c.gecis(i % 2 ? 'sayfa-cevir' : 'kaydir', t0, i % 2 ? 1.0 : 0.8, '$vurgu');
      c.L({
        id: `m${i + 1}-no`, group: g, type: 'text', textStyle: 'baslik-kalin', text: String(no), x: c.tx, y: c.Y(0.2, 0.3),
        size: Math.round(dikey ? W * 0.42 : H * 0.36), start: r2(t0), end: r2(t1), color: '$vurgu',
        textAnims: [{ preset: 'harf-zipla', t: t0 + 0.2, dur: 0.6, aralik: 0.05 }],
        anims: [{ preset: 'ritimle-nabiz', t: t0 + 1, genlik: 0.04 }, { preset: 'sol', t: t1 - 0.5, dur: 0.35 }],
      });
      c.metin(`m${i + 1}-ad`, g, it.ad, t0, t1, {
        stil: 'baslik-kalin', x: c.tx, y: c.Y(0.36, 0.52), size: undefined, sar: dikey ? 16 : 14,
        giris: [{ preset: 'harf-don', t: t0 + 0.5, dur: 0.5, aralik: 0.05 }], cikis: [{ ...cikisKay, t: t1 - 0.6 }],
      });
      c.nesne(`m${i + 1}-nesne`, g, nesneSec(it.nesne), t0 + 0.3, t1, Math.round(dikey ? W * 0.5 : H * 0.55), { y: c.Y(0.58, 0.5), variant: it.varyant });
      if (it.bilgi) c.metin(`m${i + 1}-bilgi`, g, it.bilgi, t0, t1, { stil: 'alt-baslik', x: c.tx, y: c.Y(0.82, 0.68), sar: dikey ? 26 : 28, reveal: [1.3, 1.2], giris: [] });
      if (i === n - 1) c.L({ id: 'm-konfeti', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: c.ox, y: c.Y(0.5), start: r2(t0 + 1.0), end: r2(t1) });
      t = t1;
    });
    const gK = c.grup('g-bitis', 'Bitiş', true);
    c.bolum(t, 'Bitiş');
    c.gecis('perde', t, 1.2, '$vurgu');
    c.metin('bitis', gK, brief.bitis || 'Teşekkürler!', t, null, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.45), sar: dikey ? 14 : 26, maxW: W * 0.9,
      giris: [{ preset: 'harf-zipla', t: t + 0.5, dur: 0.45, aralik: 0.04 }], cikis: [],
    });
    if (brief.muzik !== false) c.sesEkle(brief.muzik);
    return c.bitir(brief.ad, t + 3.6);
  },
};
