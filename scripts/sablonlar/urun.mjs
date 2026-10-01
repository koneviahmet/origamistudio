// Ürün / uygulama tanıtımı: marka vuruşu → cihaz uçarak gelir → özellik etiketleri her turda çarpar → fiyat damgası → çağrı.
import { gerekli } from './lib.mjs';
import { reels, sarMetin, sigdirFont, yaziRengi } from './reels.mjs';

export default {
  id: 'urun',
  ad: 'Ürün tanıtımı',
  etiket: 'Uygulama · Ürün',
  sure: '15–30 sn',
  aciklama: 'Marka vuruşu, cihaz çerçevesi (sahte arayüz ya da kendi ekran görüntün / videon) uçarak gelir; özellikler tek tek çarpar, fiyat damgası ve çağrı kapatır.',
  ornek: {
    sablon: 'urun', id: 'sablon-urun', ad: 'Not Defteri', format: 'reels', palet: 'okyanus', muzik: 'pop-120', font: 'Archivo Black',
    slogan: 'Fikirlerin hep yanında',
    cihaz: { frame: 'telefon', ui: 'liste', title: 'Notlarım', lines: ['Alışveriş listesi', 'Toplantı notları', 'Kitap önerileri', 'Seyahat planı', 'Yapılacaklar'] },
    ozellikler: [
      { baslik: 'Hızlı not', metin: 'Tek dokunuşla yaz, anında kaydet' },
      { baslik: 'Her yerde', metin: 'Telefon, tablet ve bilgisayarda senkron' },
      { baslik: 'Güvenli', metin: 'Notların şifreli saklanır' },
    ],
    rozet: 'YENİ', fiyat: 'Ücretsiz', fiyatAlt: 'ilk ay', cta: 'Hemen indir', link: 'notdefteri.app',
    yayin: { baslik: 'Not Defteri ile fikirlerin hep yanında', aciklama: 'Hızlı not, her cihazda senkron, güvenli. İlk ay ücretsiz — hemen indir!', etiketler: ['uygulama', 'tanitim', 'verimlilik', 'reels', 'shorts'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'ozellikler'], 'urun');
    const c = reels(brief, { palet: 'okyanus', muzik: 'pop-120', font: 'Archivo Black' });
    const { W, H, k, m } = c;
    const oz = brief.ozellikler.slice(0, 5);
    const cihaz = brief.cihaz || {};
    const vuruslar = [];
    const bgler = [];

    // 1) marka
    const gA = c.grup('g-marka', 'Marka', true);
    c.bolum(0, 'Marka');
    bgler.push({ t: 0, i: 0 });
    const ra = c.yigin('marka', brief.ad, 0, { i: 0, grup: gA, y: 0.4, yuk: 0.38, dekor: 'daireler', sure: 4 });
    vuruslar.push(...ra.vuruslar);
    if (brief.slogan) c.hap('slogan', brief.slogan, c.vurus(2), c.vurus(4), W / 2, H * 0.62, { grup: gA, zemin: c.vurgu(0), renk: yaziRengi(c.vurgu(0)), size: m * 0.05 });

    // 2) cihaz + özellikler
    const b0 = 4;
    const tD = c.vurus(b0);
    const tF = c.vurus(b0 + oz.length * 4 + 2);
    const tOffer = tF;
    const gD = c.grup('g-cihaz', 'Cihaz');
    c.bolum(tD, 'Cihaz');
    bgler.push({ t: tD, i: 1 });
    c.silme('silme-cihaz', tD, c.vurgu(1));
    c.dekor('seritler', tD, tF, c.vurgu(1), { grup: gD, id: 'cihaz-dekor', alfa: 0.16 });
    const dw = Math.round(cihaz.frame === 'laptop' || cihaz.frame === 'tarayici' ? W * 0.9 : cihaz.frame === 'tablet' ? W * 0.78 : W * 0.6);
    const dy = cihaz.frame === 'laptop' || cihaz.frame === 'tarayici' ? H * 0.4 : H * 0.42;
    c.halka('cihaz-halka', tD + 0.5, W / 2, dy, c.vurgu(1), { group: gD, alfa: 0.5, boyut: m * 0.3, son: m * 1.6, sure: 0.7 });
    c.L({
      id: 'cihaz', group: gD, type: 'device', frame: cihaz.frame || 'telefon', width: dw, x: W / 2, y: Math.round(dy),
      ...(cihaz.src ? { src: cihaz.src, fit: 'kapla' } : { ui: cihaz.ui || 'liste', title: cihaz.title || brief.ad, lines: cihaz.lines }),
      ...(cihaz.url ? { url: cihaz.url } : {}), accent: '$vurgu', scroll: cihaz.scroll ?? 40,
      start: c.vurus(b0), end: tF + 0.3, depth: 0,
      rotation: [k(tD, -14), k(tD + 0.7, 0, 'outBack')],
      anims: [
        { preset: 'kayarak-gir', t: tD, dur: 0.7, yon: 'alt', mesafe: 1100, ease: 'outBack' },
        { preset: 'ritimle-zipla', t: tD + 0.9, yukseklik: 14 },
        { preset: 'sallan', t: tD + 0.9, aci: 1.5, periyot: c.p * 8 },
        { preset: 'kuculerek-cik', t: tF - 0.25, dur: 0.3 },
      ],
    });
    if (brief.rozet) c.damga('rozet', brief.rozet, c.vurus(b0 + 2), tF, W * 0.82, H * 0.2, m * 0.3, { grup: gD, zemin: '#ffe600', font: c.font });

    oz.forEach((o, i) => {
      const t0 = c.vurus(b0 + 2 + i * 4);
      const t1 = c.vurus(b0 + 2 + (i + 1) * 4);
      const g = c.grup(`g-oz${i + 1}`, `Özellik ${i + 1}`);
      c.bolum(t0, o.baslik);
      vuruslar.push(t0, c.vurus(b0 + 2 + i * 4 + 2));
      c.flas(`oz${i + 1}-flas`, t0, { alfa: 0.25 });
      c.halka(`oz${i + 1}-h`, t0, W / 2, H * 0.8, c.vurgu(1), { group: g, alfa: 0.5, boyut: m * 0.1, son: m * 1.1, sure: 0.5 });
      const sizeB = Math.round(m * 0.075);
      c.slam(`oz${i + 1}-baslik`, o.baslik, t0, t1, {
        y: H * 0.775, x: W / 2, font: c.font, size: sizeB, sabit: true, giris: i % 2 ? 'sag' : 'sol', grup: g, golge: false, renk: yaziRengi(c.vurgu(1)), weight: 400,
        kutu: { color: c.vurgu(1), radius: 999, padding: [sizeB * 0.28, sizeB * 0.7], shadow: false },
      });
      if (o.metin) {
        const metin = sarMetin(o.metin, 26);
        const sz = sigdirFont(metin, c.govde, W * 0.8, 58, false);
        c.slam(`oz${i + 1}-metin`, metin, c.vurus(b0 + 2 + i * 4 + 1), t1, {
          y: H * 0.86, font: c.govde, upper: false, weight: 700, size: sz, sabit: true, giris: 'asagi', grup: g, golge: false, renk: c.yazi(1), lh: 1.15,
        });
      }
    });

    // 3) fiyat + kapanış
    const gF = c.grup('g-fiyat', 'Fiyat', true);
    let bAfter = b0 + oz.length * 4 + 2;
    let tCta = tF;
    if (brief.fiyat) {
      bgler.push({ t: tF, i: 2 });
      c.silme('silme-fiyat', tF, c.vurgu(2));
      c.bolum(tF, 'Fiyat');
      const tE = c.vurus(bAfter + 4);
      c.dekor('patlama', tF, tE, c.vurgu(2), { grup: gF, id: 'fiyat-dekor', alfa: 0.22 });
      c.slam('fiyat-ust', brief.fiyatUst || 'Şimdi', tF + 0.1, tE, { y: H * 0.3, size: 150, renk: c.yazi(2), grup: gF, giris: 'asagi' });
      c.slam('fiyat', String(brief.fiyat), c.vurus(bAfter + 1), tE, { y: H * 0.46, size: 420, maxW: W * 0.86, renk: c.vurgu(2), grup: gF, nabiz: 0.04, stroke: undefined });
      if (brief.fiyatAlt) c.hap('fiyat-alt', brief.fiyatAlt, c.vurus(bAfter + 2), tE, W / 2, H * 0.6, { grup: gF, zemin: c.vurgu(2), renk: yaziRengi(c.vurgu(2)), size: m * 0.05 });
      vuruslar.push(tF, c.vurus(bAfter + 1), c.vurus(bAfter + 2));
      bAfter += 4;
      tCta = tE;
    }
    const tEnd = c.vurus(bAfter + 6);
    bgler.push({ t: tCta, i: 3 });
    if (brief.fiyat) c.silme('silme-cta', tCta, c.vurgu(3));
    c.kapanis(tCta, tEnd, brief.cta || 'Hemen dene', brief.link || brief.alt, { i: 3, ikon: 'ok' });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(bAfter + j));

    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan(bgler),
      camera: c.kameraVurus(vuruslar, { zoom: 0.04, egim: 0.7 }),
    });
  },
};
