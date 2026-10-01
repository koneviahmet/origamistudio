// Adım adım: her adım şerit silmesiyle gelir, numara rozeti patlar, başlık çarpar, açıklama daktilo gibi yazılır; sonda tik tik özet.
import { gerekli } from './lib.mjs';
import { reels, sarMetin, sigdirFont, yaziRengi } from './reels.mjs';

export default {
  id: 'adimlar',
  ad: 'Adım adım (nasıl yapılır)',
  etiket: 'Eğitim · Tarif',
  sure: '20–40 sn',
  aciklama: 'Nasıl yapılır / tarif / ipucu videoları. Her adımda numara rozeti patlar, başlık çarpar, açıklama yazılır; en sonda tüm adımlar tik tik özetlenir.',
  ornek: {
    sablon: 'adimlar', id: 'sablon-adimlar', ad: '3 Adımda Kahve', format: 'reels', palet: 'pastel', muzik: 'lofi-90', font: 'Archivo Black',
    adimlar: [
      { baslik: 'Suyu ısıt', metin: 'Taze su koy, kaynamadan al.' },
      { baslik: 'Kahveyi ekle', metin: 'Bir fincana bir tatlı kaşığı yeter.' },
      { baslik: 'Köpüğü yakala', metin: 'Köpük yükselince ocaktan al.' },
    ],
    ozet: 'Afiyet olsun!', cta: 'Kaydet',
    yayin: { baslik: '3 adımda mükemmel kahve', aciklama: 'Evde kolayca barista gibi kahve yap. Kaydet, sonra dene!', etiketler: ['kahve', 'tarif', 'nasilyapilir', 'reels', 'shorts'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'adimlar'], 'adimlar');
    const c = reels(brief, { palet: 'pastel', muzik: 'lofi-90', font: 'Archivo Black' });
    const { W, H, k, m } = c;
    const ad = brief.adimlar.slice(0, 6);
    const n = ad.length;
    const vuruslar = [];
    const bgler = [];

    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    bgler.push({ t: 0, i: 0 });
    const ra = c.yigin('acilis', brief.ad, 0, { i: 0, grup: gA, y: 0.44, yuk: 0.56, dekor: 'daireler' });
    vuruslar.push(...ra.vuruslar);
    let b = ra.beats;
    // adım başına vuruş: 2 (başlık) + 2 (yazılma) + okuma süresi
    const kelimeSay = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
    const sb = ad.map((a) => Math.max(6, 4 + Math.ceil((1.2 + kelimeSay(a.metin) / 3) / c.p)));
    const bs = sb.map((_, i) => b + sb.slice(0, i).reduce((x, y) => x + y, 0));
    const toplam = sb.reduce((x, y) => x + y, 0);
    const tSon = c.vurus(b + toplam);
    c.noktalar('nokta', n, ad.map((_, i) => [c.vurus(bs[i]), c.vurus(bs[i] + sb[i])]), tSon, { y: H * 0.105 });

    ad.forEach((a, i) => {
      const t0 = c.vurus(bs[i]);
      const t1 = c.vurus(bs[i] + sb[i]);
      const bi = i + 1;
      const g = c.grup(`g-adim${i + 1}`, `${i + 1}. ${a.baslik}`);
      c.bolum(t0, `${i + 1}. ${a.baslik}`);
      bgler.push({ t: t0, i: bi });
      const yaz = c.yazi(bi);
      const vur = c.vurgu(bi);
      c.silme(`silme-${i + 1}`, t0, vur, { yon: i % 2 ? 'sag' : 'sol', sure: 0.55 });
      c.dekor(['halkalar', 'seritler', 'elmaslar'][i % 3], t0, t1, vur, { grup: g, id: `adim${i + 1}-dekor`, alfa: 0.16 });
      vuruslar.push(t0, c.vurus(bs[i] + 1), c.vurus(bs[i] + 2));
      // numara rozeti
      const rz = m * 0.36;
      c.sekil(`adim${i + 1}-rozet`, 'daire', W / 2, H * 0.28, rz, { t0: t0 + 0.2, t1, renk: vur, grup: g, anims: [{ preset: 'nabiz', t: t0 + 0.8, genlik: 0.03, periyot: c.p * 2 }] });
      c.halka(`adim${i + 1}-halka`, t0 + 0.25, W / 2, H * 0.28, vur, { group: g, alfa: 0.6, boyut: rz * 0.7, son: m * 1.4, sure: 0.7 });
      c.slam(`adim${i + 1}-no`, String(i + 1), t0 + 0.28, t1, { y: H * 0.28, size: rz * 0.9, sabit: true, giris: 'pop', renk: yaziRengi(vur), golge: false, grup: g, harf: 0 });
      // başlık
      const bsat = sarMetin(a.baslik, 14);
      c.slam(`adim${i + 1}-baslik`, bsat, c.vurus(bs[i] + 1), t1, { y: H * 0.5, size: 190, maxW: W * 0.86, renk: yaz, grup: g, giris: i % 2 ? 'sag' : 'sol', lh: 1.02, nabiz: 0.02 });
      // açıklama (daktilo)
      if (a.metin) {
        const metin = sarMetin(a.metin, 26);
        const size = sigdirFont(metin, c.govde, W * 0.84, 62, false);
        const ta = c.vurus(bs[i] + 2);
        c.slam(`adim${i + 1}-metin`, metin, ta, t1, {
          y: H * 0.7, font: c.govde, upper: false, weight: 700, size, sabit: true, maxW: W * 0.86, renk: yaz, grup: g, giris: 'yok', lh: 1.25, golge: false,
          extra: { opacity: 1, scale: 1, reveal: [k(ta, 0), k(ta + c.p * 2, 1, 'linear')] },
        });
      }
    });
    b += toplam;

    // özet
    const tO = c.vurus(b);
    const eO = c.vurus(b + 4 + n);
    const gO = c.grup('g-ozet', 'Özet', true);
    c.bolum(tO, 'Özet');
    bgler.push({ t: tO, i: n + 1 });
    c.silme('silme-ozet', tO, c.vurgu(n + 1));
    c.slam('ozet-baslik', brief.ozet || 'Hazır!', tO + 0.1, eO, { y: H * 0.2, size: 250, maxW: W * 0.86, renk: c.yazi(n + 1), grup: gO, giris: 'slam' });
    const adim = Math.min(H * 0.1, (H * 0.5) / n);
    const y0 = H * 0.52 - (adim * (n - 1)) / 2;
    ad.forEach((a, i) => {
      const t0 = c.vurus(b + 1 + i);
      vuruslar.push(t0);
      const y = y0 + adim * i;
      const s = sarMetin(`${a.baslik}`, 20);
      const size = sigdirFont(s, c.govde, W * 0.62, 66, false);
      c.sekil(`ozet${i + 1}-tik`, 'tik', W * 0.16, y, m * 0.1, { t0, t1: eO, renk: c.vurgu(n + 1), grup: gO });
      c.slam(`ozet${i + 1}`, s, t0 + 0.04, eO, { x: W * 0.58, y, font: c.govde, upper: false, weight: 800, size, sabit: true, maxW: W * 0.66, renk: c.yazi(n + 1), grup: gO, giris: 'sag', golge: false });
    });
    const tK = eO;
    const tEnd = c.vurus(b + 4 + n + 6);
    bgler.push({ t: tK, i: n + 2 });
    c.silme('silme-son', tK, c.vurgu(n + 2));
    c.kapanis(tK, tEnd, brief.cta || 'Kaydet', brief.alt, { i: n + 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(b + 4 + n + j));

    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan(bgler),
      camera: c.kameraVurus(vuruslar, { zoom: 0.035, egim: 0.5 }),
    });
  },
};
