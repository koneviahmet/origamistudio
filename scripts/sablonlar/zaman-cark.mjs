// Zaman tüneli · ZAMAN ÇARKI: dev, parıldayan bir kadran. Her dönem kadranda bir düğüm; ibre ("tık") o düğüme kayar, düğüm yanar,
// ortadaki cam diskte nesne belirir. Kadranın altında devasa yıl, ad ve yazılan bilgi satırları. Dönem rengi kadranın ışığını boyar.
// Radyal, modern, "geri sayım / saat" hissi — kısa döngüsel hikâyeler (keşifler, evrim, sürümler) için. Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-cark',
  ad: 'Zaman tüneli · Zaman çarkı',
  etiket: 'Hikâye · Radyal · Neon · Kadran',
  sure: '35–80 sn',
  aciklama: 'Parıldayan dev kadran: ibre her dönemde yeni düğüme "tık" diye kayar, düğüm yanar, cam diskte nesne belirir, dönem rengi kadranı boyar. Altında dev yıl, ad ve yazılan bilgi satırları. Radyal ve modern.',
  ornek: {
    sablon: 'zaman-cark', id: 'sablon-zaman-cark', ad: 'Gezegen Avcıları', format: 'reels', palet: 'neon', muzik: 'house-126', font: 'Sora', stil: 'duz',
    kanca: 'Güneşin komşularını', baslik: 'Gezegen Avcıları', altBaslik: 'nasıl keşfettik?', kapakNesne: 'saturn-3d',
    bolumler: [
      { yil: '1610', ad: 'Jüpiter', nesne: 'jupiter-3d', balon: 'Uydular!', bilgi: ['Galileo teleskopla dört uydu görür', 'Her şey Dünya\'nın etrafında dönmüyor'], notlar: ['dört uydu'], anlatim: 'Bin altı yüz on. Galileo teleskopla Jüpiter\'in dört uydusunu gördü ve her şeyin Dünya\'nın etrafında dönmediğini kanıtladı.' },
      { yil: '1655', ad: 'Satürn', nesne: 'saturn-3d', balon: 'Halka!', bilgi: ['Huygens halkayı doğru yorumlar', 'Satürn\'ün en büyük uydusu Titan\'ı bulur'], notlar: ['halka'], anlatim: 'Bin altı yüz elli beş. Huygens Satürn\'ün halkasını doğru yorumladı ve en büyük uydusu Titan\'ı keşfetti.' },
      { yil: '1781', ad: 'Uranüs', nesne: 'uranus-3d', balon: 'Sürpriz!', bilgi: ['William Herschel teleskopla bulur', 'Antik çağdan sonra bulunan ilk gezegen'], anlatim: 'Bin yedi yüz seksen bir. William Herschel, Uranüs\'ü teleskopla buldu. Antik çağdan sonra keşfedilen ilk gezegendi.' },
      { yil: '1846', ad: 'Neptün', nesne: 'neptun-3d', balon: 'Hesapla!', bilgi: ['Önce matematikle tahmin edilir', 'Sonra teleskopla görülür'], notlar: ['matematik'], anlatim: 'Bin sekiz yüz kırk altı. Neptün önce matematikle tahmin edildi, sonra teleskopla görüldü.' },
      { yil: '1930', ad: 'Plüton', nesne: 'pluton-3d', balon: 'Küçük!', bilgi: ['Clyde Tombaugh fotoğraflardan bulur', 'Sonradan cüce gezegen sayılır'], anlatim: 'Bin dokuz yüz otuz. Clyde Tombaugh Plüton\'u fotoğraflardan buldu. Sonradan cüce gezegen olarak sınıflandırıldı.' },
    ],
    soru: 'Sıradaki gezegen nerede?', cta: 'Tahminini yaz!', son1: 'Keşif', son2: 'bitmedi!',
    yayin: { baslik: 'Gezegen avcıları: Güneş Sistemi nasıl keşfedildi?', aciklama: 'Galileo\'dan Plüton\'a, komşu gezegenlerin keşif hikâyesi. Sence sıradaki gezegen nerede saklanıyor?', etiketler: ['uzay', 'gezegenler', 'astronomi', 'bilim', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-cark', { palet: 'neon', muzik: 'house-126', font: 'Sora', stil: 'duz' }, { kapSure: 12, minSn: 5.8 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const ACIK = '#eef1ff';
    const SOLUK = '#8e98cf';
    const cx = W / 2;
    const cy = H * 0.33;
    const R = m * 0.34;
    const ang = (i) => (i * 360) / n; // düğüm açısı (0 = tepe, saat yönü)
    const nx = (a, r = R) => cx + r * Math.sin((a * Math.PI) / 180);
    const ny = (a, r = R) => cy - r * Math.cos((a * Math.PI) / 180);
    const vuruslar = [];

    // ── kadran (kalıcı) ───────────────────────────────────────────────────
    const gD = c.grup('g-kadran', 'Kadran', true);
    Z.isik('kadran-isik', cx, cy, R * 3.1, '#4c5cff', { t0: 0, opacity: 0.28, blur: 90, grup: gD });
    c.sekil('kadran-disk', 'daire', cx, cy, R * 1.44, { t0: tKapak - 0.9, renk: '#12163a', opacity: 0.94, grup: gD, sure: 0.7 });
    c.sekil('kadran-halka-dis', 'halka', cx, cy, R * 2.3, { t0: tKapak - 0.8, renk: '#ffffff', opacity: 0.1, grup: gD, sure: 0.8 });
    c.sekil('kadran-halka', 'halka', cx, cy, R * 2.0, { t0: tKapak - 0.8, renk: '#8e98ff', opacity: 0.55, grup: gD, sure: 0.8 });
    c.sekil('kadran-halka-ic', 'halka', cx, cy, R * 1.42, { t0: tKapak - 0.7, renk: '#8e98ff', opacity: 0.25, grup: gD, sure: 0.8 });
    // dakika çizgileri
    const TICK = 60;
    for (let i = 0; i < TICK; i++) {
      const a = (i * 360) / TICK;
      const buyuk = planlar.some((_, q) => Math.abs(ang(q) - a) < 3);
      c.L({
        id: `tik-${i}`, group: gD, asset: 'kare', x: Math.round(nx(a, R * 1.0)), y: Math.round(ny(a, R * 1.0)), scale: 1, scaleX: (buyuk ? 5 : 2.5) / 200, scaleY: (buyuk ? 30 : 14) / 200, rotation: a,
        palette: { a: buyuk ? '#ffffff' : '#8e98ff' }, opacity: [k(tKapak - 0.7 + i * 0.012, 0), k(tKapak - 0.2 + i * 0.012, buyuk ? 0.7 : 0.4, 'outCubic')], start: R2(tKapak - 0.7),
      });
    }
    // düğümler + yıl etiketleri
    planlar.forEach((pl, i) => {
      const a = ang(i);
      c.sekil(`dugum-${i + 1}`, 'daire', nx(a, R * 1.0), ny(a, R * 1.0), 30, { t0: tKapak - 0.5 + i * 0.08, renk: '#586089', opacity: 0.9, grup: gD, sure: 0.3 });
      c.L({
        id: `etiket-${i + 1}`, group: gD, type: 'text', text: pl.s.yil || String(i + 1), font: Z.font, weight: 700, color: SOLUK, x: Math.round(nx(a, R * 1.0 + 66)), y: Math.round(ny(a, R * 1.0 + 66)), size: 34, align: 'center',
        start: R2(tKapak - 0.4 + i * 0.08), opacity: [k(tKapak - 0.4 + i * 0.08, 0), k(tKapak + 0.2 + i * 0.08, 1, 'outCubic')],
      });
    });
    // ibre (kalıcı): düğüme "tık" diye kayar
    const ibreKey = [k(tKapak - 0.9, 0)];
    planlar.forEach((pl, i) => {
      const a = ang(i);
      ibreKey.push(k(pl.t0 - 0.3, i ? ang(i - 1) : 0, 'linear'), k(pl.t0 + 0.55, a + (i ? 0 : 0), 'outBack'));
    });
    ibreKey.push(k(tK - 0.2, ang(n - 1), 'linear'), k(tK + 1.6, 360, 'inOutCubic'));
    const siraliIbre = ibreKey.filter((e, i, arr) => !i || e.t > arr[i - 1].t);
    c.L({ id: 'ibre', group: gD, asset: 'kare', x: cx, y: cy, anchor: [0.5, 1], scale: 1, scaleX: 7 / 200, scaleY: (R * 0.96) / 200, rotation: siraliIbre, palette: { a: '#ffffff' }, start: R2(tKapak - 0.9), opacity: [k(tKapak - 0.9, 0), k(tKapak - 0.4, 1, 'linear')] });
    c.sekil('ibre-merkez', 'daire', cx, cy, 26, { t0: tKapak - 0.5, renk: '#ffffff', grup: gD, sure: 0.3 });

    // ── kapak ─────────────────────────────────────────────────────────────
    Z.kapak({ renk: ACIK, kancaRenk: hi(1), altRenk: '#10142e', altKutu: hi(1), yK: 0.17, yB: 0.3, yA: 0.43, yN: 0.82, nesnePx: 0.46, weight: 800, suslemeTipi: 'yok', sar: 14, baslikSize: 170 });
    c.L({ id: 'yildiz-tozu', type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: 0, end: R2(tEnd), count: 40, prewarm: true, opacity: 0.8 });

    // ── dönemler ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const acc = hi(i);
      const a = ang(i);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.35;
      vuruslar.push(tA, c.vurus(pl.b0 + 2), c.vurus(pl.b0 + 4));

      // dönem ışığı: kadranı boyar
      Z.isik(`donem-isik-${st}`, cx, cy, R * 2.4, acc, { t0: t0 - 0.2, t1: t1 + 0.4, opacity: 0, blur: 80, grup: g, extra: { opacity: [k(t0 - 0.2, 0), k(t0 + 0.4, 0.38, 'outCubic'), k(t1 - 0.2, 0.38, 'linear'), k(t1 + 0.4, 0, 'inOutSine')] } });
      // düğüm yanar + halka dalgası
      c.sekil(`dugum-yan-${st}`, 'daire', nx(a), ny(a), 44, { t0: t0 + 0.45, t1: tK + 0.6, renk: acc, grup: g, giris: 'pop', sure: 0.35, anims: [{ preset: 'nabiz', t: R2(t0 + 1), genlik: 0.12, periyot: p * 2 }] });
      c.halka(`dugum-dalga-${st}`, t0 + 0.5, nx(a), ny(a), acc, { group: g, alfa: 0.7, boyut: 40, son: 230, sure: 0.8 });
      c.halka(`merkez-dalga-${st}`, t0 + 0.55, cx, cy, acc, { group: g, alfa: 0.5, boyut: R * 0.4, son: R * 2.2, sure: 0.9 });

      // nesne: disk içinde
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: cx, y: Math.round(cy + R * 0.62), anchor: [0.5, 1], scale: [k(t0 + 0.5, 0), k(t0 + 1.05, R2((R * 1.28) / Math.max(aw, ah)), 'outBack')],
        start: R2(t0 + 0.5), end: R2(t1 + 0.2), rotation: [k(t0 + 0.5, -20), k(t0 + 1.05, 0, 'outCubic')],
        anims: [{ preset: 'suzul', t: R2(t0 + 1.4), genlik: 8, periyot: 3.2 }, { preset: 'kuculerek-cik', t: R2(t1 - 0.3), dur: 0.5 }],
      });
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.3, t1, {
          grup: g, x: W * (i % 2 ? 0.2 : 0.8), y: cy - R * 1.28, size: 56, maxW: W * 0.3, kutu: '#ffffff', radius: 28, pad: [8, 26], rot: i % 2 ? -5 : 5, renk: '#10142e',
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.3), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 1.9), aci: 4, periyot: 1.6 }, { preset: 'kuculerek-cik', t: R2(t1 - 0.5), dur: 0.35 }],
        });
      }
      // yıl + ad + bilgi
      yazi(`yil-${st}`, s.yil || String(st), t0 + 0.3, t1, {
        grup: g, y: H * 0.625, size: 230, maxW: W * 0.9, renk: acc, weight: 800, reveal: [0.05, 0.5], golge: false,
        anims: [{ preset: 'zipla-gir', t: R2(t0 + 0.3), dur: 0.6 }, { preset: 'sol', t: R2(t1 - 0.45), dur: 0.4 }],
      });
      yazi(`ad-${st}`, s.ad, t0 + 0.6, t1, { grup: g, y: H * 0.69, size: 84, maxW: W * 0.86, renk: ACIK, weight: 600, upper: true, harf: 8, reveal: [0.1, 0.7], anims: [{ preset: 'sol', t: R2(t1 - 0.45), dur: 0.4 }] });
      c.sekil(`cizgi-${st}`, 'kare', cx, H * 0.722, 200, { t0: t0 + 0.8, t1, renk: acc, giris: 'yok', grup: g, sx: [k(t0 + 0.8, 0), k(t0 + 1.4, (W * 0.5) / 200, 'outCubic')], sy: 0.016 });
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, t0 + 1.4 + j * 1.1, t1, {
          grup: g, y: H * (0.752 + j * 0.058), size: 56, maxW: W * 0.92, sar: 38, renk: ACIK, weight: 500, lh: 1.08, reveal: [0.1, 0.9], anims: [{ preset: 'sol', t: R2(t1 - 0.45), dur: 0.4 }],
        });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = t0 + 2.2 + j * 0.5;
        yazi(`not-${st}${'ab'[j]}`, nt, tn, t1 - 0.5, {
          grup: g, x: W * (j % 2 ? 0.86 : 0.14), y: cy + R * 0.9, size: 40, maxW: W * 0.22, sar: 12, kutu: acc, renk: '#10142e', weight: 700, rot: j % 2 ? 4 : -4, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }],
        });
        c.L({
          id: `not-ok-${st}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${st}${'ab'[j]}`, to: `nesne-${st}`, start: R2(tn + 0.3), end: R2(t1 - 0.5),
          fold: [k(tn + 0.3, 0), k(tn + 1.0, 1, 'inOutSine')], palette: { a: acc },
        });
      });
      Z.ses(pl, t0 + 0.4);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    // kadran sönerek yerini kapanışa bırakır
    const gDl = c.layers.filter((l) => l.group === gD);
    gDl.forEach((l) => { l.end = R2(tK + 0.6); });
    c.flas('kapanis-flas', tK + 0.1, { alfa: 0.35 });
    c.halka('kapanis-dalga', tK + 0.1, cx, cy, hi(1), { alfa: 0.7, boyut: R * 0.6, son: m * 1.6, sure: 1.1 });
    Z.isik('kapanis-isik', cx, H * 0.4, m * 1.3, hi(1), { t0: tK, opacity: 0.32, blur: 90, grup: 'g-kapanis' });
    Z.kapanis({ renk: ACIK, t0: tK + 0.5, soruRenk: '#10142e', soruKutu: hi(1), ctaRenk: SOLUK });
    vuruslar.push(tK + 0.3);

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3.4), { zoom: 0.02, egim: 0.5 });
    cam.zoom = [k(0, 1.16), k(3, 1, 'inOutCubic'), ...cam.zoom.filter((z) => z.t > 3.2)];
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.5, i: i + 1 })), { t: tK + 0.8, i: n + 1 }], { aci: 175, vinyet: 0.32 }),
      camera: cam,
    });
  },
};
