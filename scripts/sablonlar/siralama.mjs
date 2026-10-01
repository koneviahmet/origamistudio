// Sıralama / "En iyi N": her madde şerit silmesiyle gelir; dev sıra numarası, ad, nesne ve bilgi vuruşlarla yerleşir.
import { gerekli, nesneSec, varlikBoyut } from './lib.mjs';
import { reels, sarMetin, sigdirFont, yaziRengi } from './reels.mjs';

export default {
  id: 'siralama',
  ad: 'Sıralama (Top N)',
  etiket: 'Liste · Geri sayım',
  sure: '15–35 sn',
  aciklama: 'Geri sayım ya da ileri sıralı liste. Her madde şerit silmesiyle gelir: dev numara, ad, kütüphane nesnesi ve bilgi vuruşlarla yerleşir; üstte ilerleme noktaları.',
  ornek: {
    sablon: 'siralama', id: 'sablon-siralama', ad: 'En Hızlı 3 Hayvan', format: 'reels', palet: 'gunbatimi', muzik: 'house-126', font: 'Anton',
    siralama: 'geri',
    maddeler: [
      { ad: 'Tilki', bilgi: 'Saatte 50 km hıza çıkabilir', nesne: 'tilki' },
      { ad: 'Turna', bilgi: 'Göç ederken günlerce uçar', nesne: 'turna' },
      { ad: 'Kelebek', bilgi: 'Küçük ama çok çevik', nesne: 'kelebek' },
    ],
    bitis: 'Sence hangisi?',
    yayin: { baslik: 'En hızlı 3 hayvan — hangisi şaşırttı?', aciklama: 'Sıralamayı izle, sence hangisi birinci olmalıydı? Yorumlara yaz!', etiketler: ['siralama', 'hayvanlar', 'reels', 'shorts', 'ilginc', 'bilgi'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'maddeler'], 'siralama');
    const c = reels(brief, { palet: 'gunbatimi', muzik: 'house-126', font: 'Anton' });
    const { W, H, k, m } = c;
    const n = brief.maddeler.length;
    const geri = (brief.siralama || 'geri') === 'geri';
    const vuruslar = [];
    const bgler = [];
    const MB = 8; // madde başına vuruş

    // açılış: başlık yığını
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    bgler.push({ t: 0, i: 0 });
    const ra = c.yigin('acilis', brief.ad, 0, { i: 0, grup: gA, y: 0.46, yuk: 0.6, dekor: 'patlama' });
    vuruslar.push(...ra.vuruslar);
    let b = ra.beats;

    // madde zamanları (noktalar için)
    const zamanlar = brief.maddeler.map((_, i) => [c.vurus(b + i * MB), c.vurus(b + (i + 1) * MB)]);
    const tSon = c.vurus(b + n * MB);
    c.noktalar('nokta', n, zamanlar, tSon, { y: H * 0.105 });

    brief.maddeler.forEach((it, i) => {
      const no = geri ? n - i : i + 1;
      const t0 = c.vurus(b + i * MB);
      const t1 = c.vurus(b + (i + 1) * MB);
      const bi = i + 1;
      const g = c.grup(`g-madde${i + 1}`, `${no}. ${it.ad}`);
      c.bolum(t0, `${no}. ${it.ad}`);
      bgler.push({ t: t0, i: bi });
      const yaz = c.yazi(bi);
      const vur = c.vurgu(bi);
      c.silme(`silme-${i + 1}`, t0, vur, { yon: i % 2 ? 'sag' : 'sol' });
      c.flas(`flas-${i + 1}`, t0 + 0.25, { alfa: 0.35 });
      vuruslar.push(t0, c.vurus(b + i * MB + 2), c.vurus(b + i * MB + 4));

      // dev sıra numarası (arkada, şeffaf)
      const noSize = Math.round(Math.min(W * 1.5, H * 0.62));
      c.slam(`m${i + 1}-no`, String(no), t0 + 0.2, t1, {
        y: H * 0.38, size: noSize, sabit: true, renk: vur, grup: g, golge: false, from: 2.6, harf: 0, extra: { opacity: [k(t0 + 0.2, 0), k(t0 + 0.25, 0.28, 'linear')], depth: 0.35 },
      });
      // ad
      const ad = String(it.ad);
      c.slam(`m${i + 1}-ad`, ad, c.vurus(b + i * MB + 1), t1, {
        y: H * 0.225, size: 250, maxW: W * 0.86, renk: yaz, grup: g, giris: i % 2 ? 'sag' : 'sol', nabiz: 0.02,
      });
      // nesne
      const asset = nesneSec(it.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const px = m * 0.8;
      const tn = c.vurus(b + i * MB + 2);
      c.halka(`m${i + 1}-halka`, tn, W / 2, H * 0.49, vur, { group: g, alfa: 0.6, boyut: px * 0.4, son: px * 1.7, sure: 0.7 });
      c.L({
        id: `m${i + 1}-nesne`, group: g, asset, ...(it.varyant ? { variant: it.varyant } : {}), x: W / 2, y: Math.round(H * 0.49), scale: Math.round((px / Math.max(aw, ah)) * 1000) / 1000,
        start: Math.round(tn * 100) / 100, end: Math.round(t1 * 100) / 100, shadow: true,
        anims: [
          { preset: 'zipla-gir', t: tn, dur: 0.55, yay: 'outBack' },
          { preset: 'ritimle-zipla', t: tn + 0.6, yukseklik: 34 },
        ],
      });
      // bilgi
      if (it.bilgi) {
        const bilgi = sarMetin(it.bilgi, 24);
        const size = sigdirFont(bilgi, c.govde, W * 0.74, 70, false);
        c.slam(`m${i + 1}-bilgi`, bilgi, c.vurus(b + i * MB + 4), t1, {
          y: H * 0.76, font: c.govde, upper: false, weight: 800, size, sabit: true, renk: '#10101c', grup: g, giris: 'pop', lh: 1.12, golge: false,
          kutu: { color: '#ffffff', radius: size * 0.5, padding: [size * 0.45, size * 0.8], shadow: false },
        });
      }
    });

    // kapanış
    const tK = c.vurus(b + n * MB);
    const tEnd = c.vurus(b + n * MB + 6);
    bgler.push({ t: tK, i: n + 1 });
    c.silme('silme-son', tK, c.vurgu(n + 1));
    c.kapanis(tK, tEnd, brief.bitis || 'Sence hangisi?', brief.alt, { i: n + 1 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(b + n * MB + j));

    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan(bgler),
      camera: c.kameraVurus(vuruslar, { zoom: 0.04, egim: 0.8 }),
    });
  },
};
