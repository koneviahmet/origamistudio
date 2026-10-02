// Karakter · TANITIM: sunucu karakter bir ürün / uygulama / hizmeti tanıtır. Cihaz ekranı ortada, karakter özelliklere işaret eder,
// müşteri karakter şaşırır; ardından büyük rakam (sayaç) ve fiyat / teklif damgası. Girişimci, uygulama, e-ticaret, kurs, hizmet tanıtımı için.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const TEPKI = ['Bu çok kullanışlı!', 'Harika görünüyor!', 'Hemen denemek istiyorum!', 'Tam aradığım şey!'];

export default {
  id: 'karakter-tanitim',
  ad: 'Karakter · Ürün / uygulama tanıtımı',
  etiket: 'İş · Tanıtım · Ürün · Karakter',
  sure: '40–70 sn',
  aciklama: 'Sunucu karakter ürünü tanıtır: ortada cihaz ekranı, karakter her özelliğe işaret eder, meraklı müşteri tepki verir; sonra büyük rakam sayacı, teklif damgası ve çağrı. Uygulama, SaaS, e-ticaret, kurs tanıtımı.',
  ornek: {
    sablon: 'karakter-tanitim', id: 'sablon-karakter-tanitim', ad: 'Notly Uygulaması', format: 'reels', palet: 'okyanus', muzik: 'house-126', font: 'Baloo 2',
    sunucu: 'astro', varyantSunucu: 'turuncu', musteri: 'bonbon', varyantMusteri: 'yesil',
    hook: 'Notlar *Notly* ile düzenli', selamSunucu: 'Merhaba! Notly\'yi tanıtayım.', selamMusteri: 'Ne işe yarıyor?',
    cihaz: { frame: 'tarayici', ui: 'panel', title: 'Notly', url: 'notly.app', lines: ['Bugün', 'Toplantı notları', 'Yapılacaklar', 'Fikirler'] },
    ozellikler: [
      { baslik: 'Hızlı not', metin: 'Tek dokunuşla not al, otomatik kaydolsun.' },
      { baslik: 'Akıllı arama', metin: 'Aradığın notu saniyeler içinde bul.' },
      { baslik: 'Her cihazda', metin: 'Telefon, tablet, bilgisayar: hepsi senkron.' },
    ],
    rakam: { sayi: 250, birim: 'B+', etiket: 'mutlu kullanıcı' },
    rozet: 'ÜCRETSİZ', teklif: 'Bugün indir, ilk ay Pro hediye', cta: 'Hemen dene',
    yayin: { baslik: 'Notly: notlarını tek yerde topla 📝', aciklama: 'Hızlı not alma, akıllı arama ve tüm cihazlarda senkron. Notly\'yi ücretsiz dene! Bağlantı profilde.', etiketler: ['uygulama', 'verimlilik', 'notalma', 'tanitim', 'teknoloji', 'startup', 'animasyon', 'shorts', 'reels', 'urun'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'ozellikler'], 'karakter-tanitim');
    const c = karakterKur(brief, { palet: 'okyanus', muzik: 'house-126', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const O = brief.ozellikler.slice(0, 4);
    const n = O.length;
    const cihaz = brief.cihaz || {};
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const sun = c.karakter(brief.sunucu, 'astro', { id: 'sunucu', konum: 'sol', varyant: brief.varyantSunucu, start: 0.3, boy: 0.3 });
    const mus = c.karakter(brief.musteri, 'bonbon', { id: 'musteri', konum: 'sag', varyant: brief.varyantMusteri || 'yesil', start: 0.5, yon: -1, boy: 0.29 });

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    c.akis(sun, { t: 0.5, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 });
    const dA = c.konus({ sun, mus }, [
      { kim: 'sun', metin: brief.selamSunucu || `Merhaba! ${brief.ad} ile tanışın.`, duygu: 'heyecanli', aksiyon: 'sunum' },
      { kim: 'mus', metin: brief.selamMusteri || 'Ne işe yarıyor bu?', duygu: 'dusunceli', aksiyon: 'el-kaldir', efekt: 'soru', sure: 1.8 },
    ], 1.0);
    const introBeat = Math.round((c.snap(dA.bitis + 0.2) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || `*${brief.ad}* ile tanış`, 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'daireler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    let t = ra.t1;

    // ── cihaz + özellikler ───────────────────────────────────────────────
    const ozSure = O.map((o) => c.snap(Math.max(c.sure(o.metin || o.baslik), 3.2) + 1.6));
    const tD = t;
    const gD = c.grup('g-cihaz', 'Cihaz');
    c.bolum(tD, 'Ürün');
    bgler.push({ t: tD, i: 1 });
    c.silme('silme-cihaz', tD, c.vurgu(1), { sure: 0.55 });
    let toplam = 0;
    const baslar = ozSure.map((d) => { const b = R2(tD + 0.9 + toplam); toplam += d; return b; });
    const tF = R2(tD + 0.9 + toplam);
    c.dekor('seritler', tD, tF, c.vurgu(1), { grup: gD, id: 'cihaz-dekor', alfa: 0.15 });
    const dw = Math.round(W * 0.68);
    const dy = H * 0.255;
    c.halka('cihaz-halka', tD + 0.5, W / 2, dy, c.vurgu(1), { group: gD, alfa: 0.5, boyut: m * 0.3, son: m * 1.6, sure: 0.7 });
    c.L({
      id: 'cihaz', group: gD, type: 'device', frame: cihaz.frame || 'tarayici', width: dw, x: W / 2, y: Math.round(dy),
      ...(cihaz.src ? { src: cihaz.src, fit: 'kapla' } : { ui: cihaz.ui || 'panel', title: cihaz.title || brief.ad, lines: cihaz.lines || O.map((o) => o.baslik) }),
      ...(cihaz.url ? { url: cihaz.url } : {}), accent: '$vurgu', scroll: cihaz.scroll ?? 40, start: R2(tD + 0.2), end: R2(tF + 0.1),
      anims: [
        { preset: 'kayarak-gir', t: R2(tD + 0.2), dur: 0.7, yon: 'ust', mesafe: 900, ease: 'outBack' },
        { preset: 'ritimle-zipla', t: R2(tD + 1.2), yukseklik: 10 },
        { preset: 'kuculerek-cik', t: R2(tF - 0.2), dur: 0.3 },
      ],
    });
    vuruslar.push(tD);
    O.forEach((o, i) => {
      const t0 = baslar[i];
      const t1 = R2(t0 + ozSure[i]);
      const g = c.grup(`g-oz${i + 1}`, `Özellik ${i + 1}`);
      const vur = c.vurgu(1);
      const tepki = o.tepki || TEPKI[i % TEPKI.length];
      c.bolum(t0, o.baslik);
      const d = c.konus({ sun, mus }, [
        { kim: 'sun', metin: o.metin || o.baslik, duygu: 'mutlu', aksiyon: 'isaret', hedef: 'cihaz', sure: Math.min(c.sure(o.metin || o.baslik), 4), tepki: { mus: 'mutlu' } },
        { kim: 'mus', metin: tepki, duygu: 'heyecanli', aksiyon: 'sevin', sure: 1.7, tepki: { sun: 'gururlu' } },
      ], t0 + 0.4);
      c.flas(`oz${i + 1}-flas`, t0, { alfa: 0.22 });
      c.kart(`oz${i + 1}-baslik`, o.baslik, c.snap(t0 + 0.2), t1, { y: H * 0.125, size: 70, sar: 22, grup: g, giris: i % 2 ? 'sag' : 'sol', maxW: 0.8, zemin: vur, renk: yaziRengi(vur) });
      vuruslar.push(t0, R2(d.zamanlar[1].t));
    });
    t = tF;

    // ── rakam ────────────────────────────────────────────────────────────
    const rk = brief.rakam;
    if (rk) {
      const tRk = t;
      const tRe = c.vurus(Math.round((tRk - c.off) / c.p) + 8);
      const g = c.grup('g-rakam', 'Rakam', true);
      c.bolum(tRk, 'Rakam');
      bgler.push({ t: tRk, i: 2 });
      c.silme('silme-rakam', tRk, c.vurgu(2));
      c.dekor('patlama', tRk, tRe, c.vurgu(2), { grup: g, id: 'rakam-dekor', alfa: 0.2 });
      c.sayac('rakam-sayi', 0, rk.sayi, tRk + 0.2, 1.4, { y: H * 0.23, size: 420, renk: c.yazi(2), grup: g, t1: tRe, suffix: rk.birim ? ` ${rk.birim}` : '', maxW: W * 0.84, sep: '.', font: c.font });
      c.hap('rakam-etiket', rk.etiket || '', c.snap(tRk + 1.2), tRe, W / 2, H * 0.34, { zemin: c.vurgu(2), renk: yaziRengi(c.vurgu(2)), grup: g, size: Math.round(m * 0.05), upper: false });
      c.akis(sun, { t: R2(tRk + 0.3), aksiyon: 'sunum', duygu: 'cok-mutlu' });
      c.akis(mus, { t: R2(tRk + 0.3), aksiyon: 'alkis', duygu: 'cok-mutlu', efekt: 'yildiz' });
      vuruslar.push(tRk, c.snap(tRk + 1.2));
      t = tRe;
    }

    // ── teklif ───────────────────────────────────────────────────────────
    if (brief.rozet || brief.teklif) {
      const tT = t;
      const tTe = c.vurus(Math.round((tT - c.off) / c.p) + 8);
      const g = c.grup('g-teklif', 'Teklif', true);
      c.bolum(tT, 'Teklif');
      bgler.push({ t: tT, i: 3 });
      c.silme('silme-teklif', tT, c.vurgu(3));
      c.dekor('halkalar', tT, tTe, c.vurgu(3), { grup: g, id: 'teklif-dekor', alfa: 0.2 });
      if (brief.rozet) c.damga('rozet', brief.rozet, tT + 0.2, tTe, W / 2, H * 0.24, m * 0.62, { grup: g, zemin: '#ffe600', font: c.font });
      if (brief.teklif) c.kart('teklif', brief.teklif, c.snap(tT + 0.9), tTe, { y: H * 0.41, size: 66, sar: 28, grup: g, giris: 'yukari', maxW: 0.84 });
      c.akis(sun, { t: R2(tT + 0.3), aksiyon: 'tanit', hedef: 'musteri', duygu: 'cok-mutlu' });
      c.akis(mus, { t: R2(tT + 0.3), aksiyon: 'zipla-yerinde', duygu: 'heyecanli' });
      vuruslar.push(tT, c.snap(tT + 0.9));
      t = tTe;
    }

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: 4 });
    c.silme('silme-son', tK, c.vurgu(4));
    c.kapanisKar(tK, tEnd, brief.cta || 'Hemen dene', brief.alt, [sun, mus], { i: 4 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
