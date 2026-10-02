// Zaman tüneli · MÜZE GALERİSİ: koyu, zarif, altın vurgulu bir sergi salonu. Kamera salonda yatay gezer; her dönem bir sergi:
// tavandan inen spot ışığı, kaide üzerinde nesne, kaidenin yüzünde altın yıl ve ad plaketi, zeminde yazılan açıklama, havada süzülen toz.
// Kamera her sergiye yavaşça "yaklaşır" (dolly-in). Premium, belgesel hissi. Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-galeri',
  ad: 'Zaman tüneli · Müze galerisi',
  etiket: 'Hikâye · Belgesel · Zarif · Sinematik',
  sure: '40–90 sn',
  aciklama: 'Koyu zarif sergi salonu: tavandan inen spot ışığı, kaide üzerinde nesne, kaidede altın yıl plaketi, zeminde yazılan açıklamalar, süzülen toz. Kamera salonda gezer ve her esere yaklaşır. Premium belgesel hissi.',
  ornek: {
    sablon: 'zaman-galeri', id: 'sablon-zaman-galeri', ad: 'Bilgisayar Müzesi', format: 'reels', palet: 'galeri', muzik: 'lofi-90', font: 'Playfair Display', stil: 'duz',
    kanca: 'SERGİ', baslik: 'Bilgisayar Müzesi', altBaslik: 'oda boyutundan cebe', kapakNesne: 'kisisel-bilgisayar',
    bolumler: [
      { yil: '1945', ad: 'ENIAC', nesne: 'eniac', balon: 'Oda boyutunda', bilgi: ['Bir odayı doldurur', 'Binlerce vakum tüpüyle çalışır'], notlar: ['vakum tüpü'], anlatim: 'Bin dokuz yüz kırk beş. ENIAC bir odayı dolduruyor ve binlerce vakum tüpüyle çalışıyordu.' },
      { yil: '1947', ad: 'Transistör', nesne: 'transistor', balon: 'Küçülüyor', bilgi: ['Tüplerin yerini küçük bir anahtar alır', 'Daha az enerji, daha çok hız'], anlatim: 'Bin dokuz yüz kırk yedi. Transistör tüplerin yerini aldı. Daha küçük, daha hızlı ve daha az enerji harcıyordu.' },
      { yil: '1958', ad: 'Entegre devre', nesne: 'cip', balon: 'Bir çipte', bilgi: ['Pek çok transistör tek çipe sığar', 'Bilgisayarlar avuç içine yaklaşır'], notlar: ['çip'], anlatim: 'Bin dokuz yüz elli sekiz. Entegre devreyle pek çok transistör tek bir çipe sığdı.' },
      { yil: '1981', ad: 'Kişisel bilgisayar', nesne: 'kisisel-bilgisayar', balon: 'Masaya girdi', bilgi: ['Bilgisayar evlerin masasına girer', 'Herkes kullanabilir hâle gelir'], anlatim: 'Bin dokuz yüz seksen bir. Kişisel bilgisayarlar evlerin masasına girdi ve herkes kullanabilir oldu.' },
      { yil: 'Bugün', ad: 'Bulut', nesne: 'sunucu', balon: 'Görünmez', bilgi: ['İşlem gücü veri merkezlerinde', 'Cebimizdeki cihaz bulutla çalışır'], notlar: ['veri merkezi'], anlatim: 'Bugün işlem gücü veri merkezlerinde. Cebimizdeki cihaz bile bulutla birlikte çalışıyor.' },
    ],
    soru: 'Sıradaki eser ne olacak?', cta: 'Tahminini yaz!', son1: 'Sergi', son2: 'sürüyor!',
    yayin: { baslik: 'Bilgisayar müzesi: oda boyutundan buluta', aciklama: 'ENIAC\'tan buluta, bilgisayarın küçülerek yayılma hikâyesi. Sence sıradaki eser ne olacak?', etiketler: ['bilgisayar', 'teknoloji', 'tarih', 'muze', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-galeri', { palet: 'galeri', muzik: 'lofi-90', font: 'Playfair Display', stil: 'duz' }, { kapSure: 11 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const ALTIN = '#d9b66f';
    const KREM = '#f3ead7';
    const SX = W;
    const stX = (i) => W / 2 + i * SX;
    const PAN = 1.7;
    const panT = (t0) => t0 - 0.9;
    const dunyaSon = stX(n + 1) + W;
    const vuruslar = [];
    const MONO = 'Space Mono';

    // ── salon: zemin + toz ────────────────────────────────────────────────
    const gS = c.grup('g-salon', 'Salon', true);
    c.sekil('zemin', 'kare', dunyaSon / 2 - 500, H * 0.86, 200, { t0: 0, renk: '#05090b', opacity: 0.62, giris: 'yok', sx: (dunyaSon + 1000) / 200, sy: (H * 0.6) / 200, grup: gS });
    c.sekil('zemin-cizgi', 'kare', dunyaSon / 2 - 500, H * 0.56 + 0, 200, { t0: 0, renk: ALTIN, opacity: 0.0, giris: 'yok', sx: 1, sy: 0.01, grup: gS });
    c.L({ id: 'toz', group: gS, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: 0, end: R2(tEnd), count: 140, prewarm: true, opacity: 0.55, area: [-300, 100, Math.round(dunyaSon), Math.round(H * 0.78)] });

    /** Bir sergi sahnesi: duvar paneli, kaide, spot. kz: kaide üstü y (H oranı), zz: zemin y */
    const sergi = (X, g, t0, o = {}) => {
      const kz = (o.kz ?? 0.46) * H;
      const zz = (o.zz ?? 0.66) * H;
      const kw = W * 0.46;
      // duvar paneli
      c.sekil(`panel-${g}`, 'kare', X, H * 0.07 + (zz - H * 0.07) / 2, 200, { t0: 0, renk: '#ffffff', opacity: 0.045, giris: 'yok', sx: (W * 0.84) / 200, sy: (zz - H * 0.07 - 24) / 200, grup: gS });
      c.sekil(`panel-ust-${g}`, 'kare', X, H * 0.07, 200, { t0: 0, renk: ALTIN, opacity: 0.35, giris: 'yok', sx: (W * 0.84) / 200, sy: 3 / 200, grup: gS });
      // kaide
      c.sekil(`kaide-${g}`, 'kare', X, kz + (zz - kz) / 2, 200, { t0: 0, renk: '#1d2a31', giris: 'yok', sx: kw / 200, sy: (zz - kz) / 200, grup: gS });
      c.sekil(`kaide-yan-${g}`, 'kare', X + kw / 2 - 14, kz + (zz - kz) / 2, 200, { t0: 0, renk: '#000000', opacity: 0.22, giris: 'yok', sx: 28 / 200, sy: (zz - kz) / 200, grup: gS });
      c.sekil(`kaide-kapak-${g}`, 'kare', X, kz + 11, 200, { t0: 0, renk: '#2f424d', giris: 'yok', sx: (kw + 40) / 200, sy: 22 / 200, grup: gS });
      c.sekil(`kaide-altin-${g}`, 'kare', X, kz + 24, 200, { t0: 0, renk: ALTIN, opacity: 0.8, giris: 'yok', sx: (kw + 40) / 200, sy: 3 / 200, grup: gS });
      // spot huzmesi (tavandan)
      const hz = (gen, al, bl, id) => c.L({
        id: `${id}-${g}`, group: gS, asset: 'huzme', x: X, y: 0, anchor: [0.5, 0], scale: 1, scaleX: gen / 200, scaleY: (kz + 10) / 400, palette: { a: '#ffe7b0' }, opacity: al, blur: bl, start: 0,
        anims: [{ preset: 'nefes', t: 0, genlik: 0.01, periyot: 4 }],
      });
      hz(W * 0.9, [k(0, 0.1)], 22, 'huzme-genis');
      hz(W * 0.5, [k(0, 0.12)], 10, 'huzme-dar');
      // ışık havuzu (kaide üstünde)
      Z.isik(`havuz-${g}`, X, kz - 4, W * 0.5, '#ffe7b0', { t0: 0, opacity: 0.4, blur: 26, grup: gS, extra: { scaleY: 0.12 } });
    };

    // ── kapak: sahnede küçük bir kaide ────────────────────────────────────
    sergi(stX(0), 's0', 0, { kz: 0.7, zz: 0.84 });
    Z.kapak({ renk: ALTIN, kancaRenk: KREM, altRenk: '#1a1d22', altKutu: ALTIN, yK: 0.1, yB: 0.2, yA: 0.34, yN: 0.7 - 0.0, nesnePx: 0.4, weight: 700, suslemeTipi: 'yok', kancaSize: 40, baslikSize: 150, sar: 12, upper: false });

    // ── sergiler ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const X = stX(st);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      sergi(X, `s${st}`, t0);
      const tA = t0 + 0.7;
      vuruslar.push(tA);
      const kz = H * 0.46;

      // üst etiket
      yazi(`sira-${st}`, `SERGİ  ${String(st).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, tA, null, { grup: g, x: X, y: H * 0.1, size: 32, sabit: true, font: MONO, renk: ALTIN, weight: 700, harf: 6, opacity: 0.9, reveal: [0.05, 0.7] });
      c.sekil(`sira-cizgi-${st}`, 'kare', X, H * 0.125, 200, { t0: tA + 0.3, renk: ALTIN, opacity: 0.6, giris: 'yok', grup: g, sx: [k(tA + 0.3, 0), k(tA + 0.9, (W * 0.5) / 200, 'outCubic')], sy: 2 / 200 });

      // nesne
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: Math.round(X), y: Math.round(kz - 6), anchor: [0.5, 1], scale: [k(tA, 0), k(tA + 0.8, R2((m * 0.5) / Math.max(aw, ah)), 'outBack')], start: R2(tA),
        rotation: [k(tA, -12), k(tA + 0.8, 0, 'outCubic')],
        anims: [{ preset: 'suzul', t: R2(tA + 1.2), genlik: 10, periyot: 3.6 }],
      });
      c.halka(`halka-${st}`, tA + 0.2, X, kz, ALTIN, { group: g, alfa: 0.45, boyut: m * 0.2, son: m * 1.0, sure: 0.9 });

      // plaket (kaide yüzü)
      yazi(`yil-${st}`, s.yil || String(st), tA + 0.4, null, { grup: g, x: X, y: H * 0.545, size: 128, maxW: W * 0.4, renk: ALTIN, weight: 700, reveal: [0.05, 0.6], anims: [{ preset: 'zipla-gir', t: R2(tA + 0.4), dur: 0.55 }] });
      c.sekil(`plaket-cizgi-${st}`, 'kare', X, H * 0.585, 200, { t0: tA + 0.9, renk: ALTIN, opacity: 0.55, giris: 'yok', grup: g, sx: [k(tA + 0.9, 0), k(tA + 1.4, (W * 0.3) / 200, 'outCubic')], sy: 2 / 200 });
      yazi(`ad-${st}`, s.ad, tA + 0.8, null, { grup: g, x: X, y: H * 0.612, size: 40, maxW: W * 0.4, font: 'Outfit', renk: KREM, weight: 500, upper: true, harf: 6, reveal: [0.05, 0.7] });

      // balon (altın çerçeveli etiket)
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.5, null, {
          grup: g, x: X + W * 0.27, y: H * 0.255, size: 46, maxW: W * 0.3, sar: 12, kutu: KREM, radius: 22, pad: [8, 22], rot: 4, renk: '#1a1d22', font: 'Outfit', weight: 700,
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.5), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 2.1), aci: 3, periyot: 1.8 }],
        });
      }
      // açıklama (zeminde)
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.4 + j * 1.15, null, { grup: g, x: X, y: H * (0.73 + j * 0.058), size: 60, maxW: W * 0.92, sar: 34, font: 'Lora', renk: KREM, weight: 400, lh: 1.1, reveal: [0.1, 1.0] });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.6 + j * 0.5;
        yazi(`not-${st}${'ab'[j]}`, nt, tn, null, {
          grup: g, x: X + (j % 2 ? 1 : -1) * W * 0.34, y: H * 0.56, size: 36, maxW: W * 0.22, sar: 12, font: MONO, weight: 700, kutu: ALTIN, renk: '#1a1d22', radius: 6, pad: [6, 16], rot: j % 2 ? 3 : -3, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.4 }],
        });
        c.L({
          id: `not-ok-${st}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${st}${'ab'[j]}`, to: `nesne-${st}`, start: R2(tn + 0.3),
          fold: [k(tn + 0.3, 0), k(tn + 1, 1, 'inOutSine')], palette: { a: ALTIN },
        });
      });
      Z.ses(pl, tA);
    });

    // ── kapanış: son salon ────────────────────────────────────────────────
    const XK = stX(n + 1);
    Z.isik('kapanis-isik', XK, H * 0.35, m * 1.4, ALTIN, { t0: tK, opacity: 0.2, blur: 90, grup: 'g-kapanis' });
    Z.kapanis({ renk: ALTIN, dx: XK - W / 2, t0: tK + 0.6, soruRenk: '#1a1d22', soruKutu: ALTIN, ctaRenk: KREM });
    vuruslar.push(tK + 0.6);

    // ── kamera: salonda gezinti + her esere yavaş yaklaşma ────────────────
    const camX = [k(0, W / 2)];
    const camZ = [k(0, 1.12), k(3.2, 1, 'inOutCubic')];
    const pans = [...planlar.map((pl) => ({ t: pl.t0, x: 0, son: pl.t1 })), { t: tK + 0.6, x: 0, son: tEnd }];
    let sonX = W / 2;
    pans.forEach((q, i) => {
      const hedef = stX(i + 1);
      camX.push(k(panT(q.t), sonX, 'linear'), k(panT(q.t) + PAN, hedef, 'inOutCubic'));
      camZ.push(k(panT(q.t), camZ[camZ.length - 1].v, 'linear'), k(panT(q.t) + PAN * 0.5, 0.94, 'inOutSine'), k(panT(q.t) + PAN, 1, 'inOutSine'), k(Math.max(panT(q.t) + PAN + 0.1, q.son - 0.5), 1.05, 'inOutSine'));
      sonX = hedef;
    });
    const duz = (a) => a.filter((e, i, arr) => !i || e.t > arr[i - 1].t);
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.6, i: i + 1 })), { t: tK + 1, i: n + 1 }], { aci: 180, vinyet: 0.4 }),
      camera: { x: duz(camX), y: H / 2, zoom: duz(camZ) },
    });
  },
};
