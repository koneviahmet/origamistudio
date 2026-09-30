// Açıklayıcı video: açılış → adımlar (numara, başlık, nesne, metin) → oklarla bağlanan özet → kapanış.
import { baglam, gerekli, kelimeSayisi, nesneSec, r2, clamp } from './lib.mjs';

export default {
  id: 'explainer',
  ad: 'Açıklayıcı (adım adım)',
  aciklama: 'Konuyu adımlara böler; her adım bir nesne + kısa metin, sonda adımlar oklarla bağlanır. Defter görünümü için stil: "cizim".',
  ornek: {
    sablon: 'explainer', id: 'sablon-explainer', ad: 'Kahve Nasıl Olur?', format: 'reels', tema: 'gun-isigi', stil: 'cizim',
    altBaslik: '3 adımda',
    adimlar: [
      { baslik: 'Cezveye koy', metin: 'Su, kahve ve şeker cezveye konur', nesne: 'cezve' },
      { baslik: 'Kısık ateşte pişir', metin: 'Köpük yükselince ateşten alınır', nesne: 'gunes' },
      { baslik: 'Fincana doldur', metin: 'Köpüğü bozmadan fincana servis et', nesne: 'fincan' },
    ],
    kapanis: 'Afiyet olsun!',
  },
  uret(brief) {
    gerekli(brief, ['ad', 'adimlar'], 'explainer');
    const c = baglam(brief, { tema: 'gun-isigi' });
    const { W, H, dikey } = c;
    const adimlar = brief.adimlar;
    const nesnePx = Math.round(dikey ? W * 0.62 : H * 0.6);
    const cikisKay = { preset: 'kayarak-cik', dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' };
    let t = 0;

    // Açılış
    const gA = c.grup('g-acilis', 'Açılış', true);
    const tA = 3.4;
    c.bolum(0, 'Açılış');
    c.metin('acilis-baslik', gA, brief.ad, 0, tA, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.42), sar: dikey ? 14 : 24, maxW: W * 0.9,
      giris: [{ preset: 'harf-katla', t: 0.3, dur: 0.6, aralik: 0.05 }], cikis: [{ ...cikisKay, t: tA - 0.6 }],
    });
    if (brief.altBaslik) c.metin('acilis-alt', gA, brief.altBaslik, 0.6, tA, { stil: 'etiket-kutu', x: W / 2, y: c.Y(0.56, 0.6), giris: [], cikis: [{ preset: 'sol', t: tA - 0.5, dur: 0.35 }], extra: { anims: [{ preset: 'zipla-gir', t: 0.8, dur: 0.5 }, { preset: 'sol', t: tA - 0.5, dur: 0.35 }] } });
    t = tA;

    // Adımlar
    const geciste = ['katlama', 'iris', 'kaydir', 'yirtik'];
    adimlar.forEach((a, i) => {
      const dur = r2(clamp(2.6 + kelimeSayisi(a.metin) / 2.6, 4.6, 8));
      const t0 = t;
      const t1 = t + dur;
      const g = c.grup(`g-adim${i + 1}`, `Adım ${i + 1}`);
      c.bolum(t0, `${i + 1}. ${a.baslik}`);
      c.gecis(geciste[i % geciste.length], t0, 1.0, '$vurgu');
      c.metin(`adim${i + 1}-no`, g, `Adım ${i + 1}`, t0, t1, {
        stil: 'etiket-kutu', y: c.Y(0.115, 0.3), giris: [], cikis: [],
        extra: { anims: [{ preset: 'zipla-gir', t: t0 + 0.4, dur: 0.5 }, { preset: 'sol', t: t1 - 0.5, dur: 0.35 }] },
      });
      c.metin(`adim${i + 1}-baslik`, g, a.baslik, t0, t1, {
        stil: 'baslik-kalin', y: c.Y(0.185, 0.42), sar: 40,
        giris: [{ preset: 'harf-don', t: t0 + 0.3, dur: 0.5, aralik: 0.05 }], cikis: [{ ...cikisKay, t: t1 - 0.6 }],
      });
      c.nesne(`adim${i + 1}-nesne`, g, nesneSec(a.nesne), t0, t1, nesnePx, { y: c.Y(0.5), variant: a.varyant });
      c.metin(`adim${i + 1}-metin`, g, a.metin, t0, t1, {
        stil: 'alt-baslik', size: dikey ? 60 : 50, y: c.Y(0.8, 0.66), sar: dikey ? 24 : 30,
        reveal: [1.1, Math.min(1.6, 0.4 + kelimeSayisi(a.metin) * 0.12)], giris: [],
      });
      t = t1;
    });

    // Özet: adımlar ızgarada, oklarla bağlı
    const n = adimlar.length;
    if (n > 1 && brief.ozet !== false) {
      const tO = t;
      const dO = r2(2.4 + n * 0.9 + 1.6);
      const gO = c.grup('g-ozet', 'Özet');
      c.bolum(tO, 'Özet');
      c.gecis('sayfa-cevir', tO, 1.0, '$vurgu');
      c.metin('ozet-baslik', gO, brief.ozetBaslik || 'Özet', tO, tO + dO, {
        stil: 'baslik-kalin', x: W / 2, y: c.Y(0.13, 0.14), giris: [{ preset: 'harf-zipla', t: tO + 0.3, dur: 0.45, aralik: 0.04 }], cikis: [],
      });
      const cols = dikey ? (n <= 2 ? 1 : 2) : Math.min(n, 4);
      const rows = Math.ceil(n / cols);
      const areaY0 = H * 0.26;
      const areaH = H * 0.62;
      const cellW = (W * 0.9) / cols;
      const cellH = areaH / rows;
      const px = Math.round(Math.min(cellW * 0.6, cellH * 0.56));
      adimlar.forEach((a, i) => {
        const x = W * 0.05 + cellW * ((i % cols) + 0.5);
        const y = areaY0 + cellH * (Math.floor(i / cols) + 0.42);
        const ti = tO + 0.9 + i * 0.9;
        c.nesne(`ozet-nesne-${i + 1}`, gO, nesneSec(a.nesne), ti, tO + dO, px, { x, y, variant: a.varyant, yasam: false, cikis: 'sol', anims: [] });
        c.metin(`ozet-etiket-${i + 1}`, gO, a.baslik, ti, tO + dO, {
          stil: 'alt-baslik', x, y: y + px * 0.68, maxW: cellW * 0.92, size: Math.min(46, Math.round(cellW / 10)),
          giris: [{ preset: 'kelime-zipla', t: ti + 0.5, dur: 0.4, aralik: 0.1 }], cikis: [],
        });
        if (i > 0) {
          c.L({
            id: `ozet-ok-${i}`, group: gO, type: 'arrow', arrow: brief.stil === 'cizim' ? 'ok-el-cizimi' : 'ok-kavis',
            from: `ozet-nesne-${i}`, to: `ozet-nesne-${i + 1}`, start: r2(ti - 0.2), end: r2(tO + dO),
            fold: [c.k(ti - 0.2, 0), c.k(ti + 0.6, 1, 'inOutSine')],
          });
        }
      });
      t = tO + dO;
    }

    // Kapanış
    const gK = c.grup('g-kapanis', 'Kapanış', true);
    c.bolum(t, 'Kapanış');
    c.gecis('perde', t, 1.2, '$vurgu');
    c.metin('kapanis-baslik', gK, brief.kapanis || 'Teşekkürler!', t, null, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.45), sar: dikey ? 14 : 24, maxW: W * 0.9,
      giris: [{ preset: 'harf-zipla', t: t + 0.5, dur: 0.45, aralik: 0.04 }], cikis: [],
    });
    c.L({ id: 'kapanis-konfeti', group: gK, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: c.Y(0.42), start: r2(t + 0.9) });
    if (brief.muzik !== false) c.sesEkle(brief.muzik);
    return c.bitir(brief.ad, t + 4);
  },
};
