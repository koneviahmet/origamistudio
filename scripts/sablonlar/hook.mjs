// Merak kancası: şok açılış (hook) → büyük sayaç → hızlı maddeler (tik) → çağrı. İlk 1.5 sn'de izleyiciyi yakalamak için.
import { gerekli } from './lib.mjs';
import { reels, sigdirFont, sarMetin } from './reels.mjs';

export default {
  id: 'hook',
  ad: 'Merak kancası',
  etiket: 'Bilgi · Hook',
  sure: '12–20 sn',
  aciklama: 'Şok edici açılış cümlesi, sayarak yükselen büyük rakam, tik tik ilerleyen kanıt maddeleri ve çağrı. Bilgi / ipucu / "bunu biliyor muydun" videoları için.',
  ornek: {
    sablon: 'hook', id: 'sablon-hook', ad: 'Merak Kancası', format: 'reels', palet: 'neon', muzik: 'trap-140', font: 'Anton',
    hook: 'Bunu *yanlış* yapıyorsun!',
    sayi: 87, birim: '%', sayiEtiketi: 'insan bu hatayı her gün yapıyor',
    maddeler: ['Çoğu kişi fark bile etmiyor', 'Düzeltmek sadece 10 saniye', 'Hemen deneyebilirsin'],
    cta: 'Kaydet ve dene',
    yayin: { baslik: 'Bunu yanlış yapıyor olabilirsin', aciklama: 'Çoğu kişi bu hatayı her gün yapıyor. Düzeltmek sadece 10 saniye. Kaydet ve dene!', etiketler: ['ipucu', 'bilgi', 'reels', 'shorts', 'ogren', 'hack'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'hook'], 'hook');
    const c = reels(brief, { palet: 'neon', muzik: 'trap-140', font: 'Anton' });
    const { W, H, k, m } = c;
    const vuruslar = [];
    const bgler = [];

    // 1) HOOK
    const g1 = c.grup('g-hook', 'Hook', true);
    c.bolum(0, 'Hook');
    bgler.push({ t: 0, i: 0 });
    const hv = c.vurgu(0);
    [[0.14, 0.2, 0.3, -12], [0.86, 0.74, 0.34, 10]].forEach(([fx, fy, f, r], i) => {
      const ops = [];
      for (let j = 0; j < 8; j++) ops.push(k(c.vurus(j) + 0.0, 1), k(c.vurus(j) + 0.09, 0.15, 'step'), k(c.vurus(j) + 0.18, 1, 'step'));
      c.sekil(`hook-simsek-${i + 1}`, 'yildirim', W * fx, H * fy, m * f, { t0: 0, t1: c.vurus(4), renk: '#ffd23f', rot: r, grup: g1, extra: { opacity: ops } });
    });
    const r1 = c.yigin('hook', brief.hook, 0, { i: 0, grup: g1, y: 0.5, yuk: 0.66, dekor: 'patlama', vp: 1 });
    vuruslar.push(...r1.vuruslar);
    let b = r1.beats;

    // 2) SAYI
    const g2 = c.grup('g-sayi', 'Rakam', true);
    const t2 = c.vurus(b);
    c.bolum(t2, 'Rakam');
    bgler.push({ t: t2, i: 1 });
    c.flas('sayi-flas', t2, { alfa: 0.6 });
    c.dekor('halkalar', t2, c.vurus(b + 8), c.vurgu(1), { grup: g2, id: 'sayi-dekor', alfa: 0.25 });
    const sayiSure = c.p * 3.2;
    c.sayac('sayi', 0, Number(brief.sayi ?? 100), t2 + 0.05, sayiSure, {
      y: H * 0.42, size: 560, suffix: brief.birim ? String(brief.birim) : '', renk: c.vurgu(1), grup: g2, t1: c.vurus(b + 8),
      ondalik: brief.ondalik || 0, sep: brief.ayrac ?? '.', stroke: undefined,
    });
    const tBitis = t2 + 0.05 + sayiSure;
    c.halka('sayi-halka', tBitis, W / 2, H * 0.42, c.vurgu(1), { group: g2, alfa: 0.7, boyut: m * 0.3, son: m * 1.8, sure: 0.8 });
    c.L({ id: 'sayi-kivilcim', group: g2, type: 'particles', particle: 'kivilcim', mode: 'patlama', x: W / 2, y: Math.round(H * 0.42), start: r2s(tBitis), end: r2s(c.vurus(b + 8)) });
    if (brief.sayiEtiketi) {
      const et = sarMetin(brief.sayiEtiketi, 20);
      c.slam('sayi-etiket', et, c.vurus(b + 4), c.vurus(b + 8), {
        y: H * 0.64, font: c.govde, upper: false, weight: 800, size: 92, maxW: W * 0.86, renk: c.yazi(1), giris: 'asagi', grup: g2, lh: 1.15, golge: false,
      });
    }
    for (let j = 0; j < 8; j += 2) vuruslar.push(c.vurus(b + j));
    b += 8;

    // 3) MADDELER (tik tik)
    const maddeler = (brief.maddeler || []).slice(0, 4);
    if (maddeler.length) {
      const g3 = c.grup('g-maddeler', 'Maddeler', true);
      const t3 = c.vurus(b);
      const e3 = c.vurus(b + maddeler.length * 4);
      c.bolum(t3, 'Maddeler');
      bgler.push({ t: t3, i: 2 });
      c.flas('madde-flas', t3, { alfa: 0.6 });
      c.dekor('seritler', t3, e3, c.vurgu(2), { grup: g3, id: 'madde-dekor', alfa: 0.2 });
      const adim = Math.min(H * 0.16, (H * 0.6) / maddeler.length);
      const y0 = H * 0.5 - (adim * (maddeler.length - 1)) / 2;
      maddeler.forEach((md, j) => {
        const t0 = c.vurus(b + j * 4);
        vuruslar.push(t0);
        const y = y0 + adim * j;
        const metin = sarMetin(md, 22);
        const size = sigdirFont(metin, c.govde, W * 0.62, 88, false);
        c.sekil(`madde${j + 1}-tik`, 'tik', W * 0.13, y, m * 0.13, { t0, t1: e3, renk: '#2ee88a', grup: g3 });
        c.slam(`madde${j + 1}`, metin, t0 + 0.04, e3, {
          x: W * 0.57, y, font: c.govde, upper: false, weight: 800, size, sabit: true, maxW: W * 0.66, renk: c.yazi(2), giris: 'sag', grup: g3, lh: 1.1, golge: false,
          kutu: { color: 'rgba(255,255,255,0.14)', radius: 34, padding: [size * 0.35, size * 0.55], shadow: false },
        });
        c.halka(`madde${j + 1}-h`, t0, W * 0.13, y, '#2ee88a', { group: g3, alfa: 0.6, boyut: m * 0.08, son: m * 0.5, sure: 0.5 });
      });
      b += maddeler.length * 4;
    }

    // 4) KAPANIŞ
    const tK = c.vurus(b);
    const tEnd = c.vurus(b + 6);
    bgler.push({ t: tK, i: 3 });
    c.kapanis(tK, tEnd, brief.cta || 'Kaydet!', brief.alt, { i: 3 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(b + j));

    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan(bgler),
      camera: c.kameraVurus(vuruslar, { zoom: 0.055, egim: 1.3 }),
    });
  },
};
const r2s = (n) => Math.round(n * 100) / 100;
