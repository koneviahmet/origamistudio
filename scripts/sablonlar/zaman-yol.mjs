// Zaman tüneli · YOL HARİTASI: karanlık, neon çizgili, dikey kaydırmalı modern tarihçe.
// Kamera aşağı kayar; sol kenarda parlayan bir omurga her durakta uzar, düğüm yanar. Her durak: devasa yıl, ad, cam daire içinde nesne,
// konuşma balonu, cam kartlarda yazılan bilgi satırları, oklu notlar. Geçmiş duraklar omurgada yanık kalır; arkada paralaks parçacık noktaları.
// Aynı brief'i zaman şablonu gibi okur (bolumler: yil, ad, nesne, balon, bilgi[2], notlar, anlatim, ses).
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-yol',
  ad: 'Zaman tüneli · Yol haritası',
  etiket: 'Hikâye · Tarihçe · Neon · Kaydırmalı',
  sure: '40–90 sn',
  aciklama: 'Karanlık zeminde parlayan dikey bir yol: kamera aşağı kayar, omurga uzar, her durakta devasa yıl + cam daire içinde nesne + cam bilgi kartları yanar. Modern, akıcı, sinematik anlatım.',
  ornek: {
    sablon: 'zaman-yol', id: 'sablon-zaman-yol', ad: 'Buzdolabının Hikâyesi', format: 'reels', palet: 'neon', muzik: 'lofi-90', font: 'Sora', stil: 'duz',
    kanca: 'Soğuğu evcilleştirmek', baslik: 'Buzdolabının Hikâyesi', altBaslik: 'buz bloğundan akıllı mutfağa', kapakNesne: 'buz-blogu',
    bolumler: [
      { yil: 'Eski çağ', ad: 'Buz bloğu', nesne: 'buz-blogu', balon: 'Brr!', bilgi: ['Kışın kesilen buz depolanır', 'Yiyecekler buzla serin tutulur'], notlar: ['doğal buz'], anlatim: 'Eskiden soğutmak için kışın buz bloklarını kesip saklarlardı. Yiyecekleri buzla serin tutmak, tek yoldu.' },
      { yil: '1800\'ler', ad: 'Buz sandığı', nesne: 'buz-sandigi', balon: 'Buzcu geldi!', bilgi: ['Yalıtımlı ahşap dolaplar yayılır', 'Her gün buz taşınır'], anlatim: 'Bin sekiz yüzlerde evlerde yalıtımlı buz sandıkları kullanılmaya başlandı ve buz her gün kapıya getirildi.' },
      { yil: '1913', ad: 'İlk elektrikli', nesne: 'buzdolabi-ilk-elektrikli', balon: 'Elektrik!', bilgi: ['Evler için ilk elektrikli buzdolapları', 'Artık buz taşımak yok'], notlar: ['kompresör'], anlatim: 'Bin dokuz yüz on üçte evler için ilk elektrikli buzdolapları çıktı ve buz taşımak tarih oldu.' },
      { yil: '1920\'ler', ad: 'Kompresör', nesne: 'kompresor-devresi', balon: 'Vızzz!', bilgi: ['Soğutucu gaz sıkıştırılıp genleşir', 'Isıyı içeriden dışarı taşır'], anlatim: 'Soğutma, kompresörle çalışan kapalı bir devre sayesinde gerçekleşir. Gaz sıkışır, genleşir ve ısıyı dışarı taşır.' },
      { yil: 'Bugün', ad: 'Akıllı buzdolabı', nesne: 'akilli-buzdolabi', balon: 'Merhaba!', bilgi: ['Ekranlı, internete bağlı', 'Stokunu kendisi takip eder'], notlar: ['ekran'], anlatim: 'Bugün buzdolapları ekranlı, internete bağlı ve stoğunu kendisi takip edebiliyor.' },
    ],
    soru: 'Sıradaki icat ne olacak?', cta: 'Tahminini yorumlara yaz!', son1: 'Soğuk hikâye', son2: 'sürüyor!',
    yayin: { baslik: 'Buzdolabının hikâyesi: buz bloğundan akıllı mutfağa', aciklama: 'Kışın kesilen buzdan akıllı buzdolabına, soğutmanın yolculuğu. Sence sıradaki icat ne olacak?', etiketler: ['buzdolabi', 'tarih', 'teknoloji', 'icatlar', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-yol', { palet: 'neon', muzik: 'lofi-90', font: 'Sora', stil: 'duz' }, { kapSure: 10 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const font = Z.font;
    const acik = brief.murekkep || '#f3f5ff';
    const soluk = '#9aa3d4';
    const SX = W * 0.13; // omurga
    const Yc = (s) => H / 2 + s * H; // durak merkezi (s=0 kapak, 1..n bölümler, n+1 kapanış)
    const ny = (s) => (s === 0 ? H * 0.1 : Yc(s) - H * 0.385); // düğüm y
    const PAN = 1.1;
    const panT = (t0) => t0 - 0.55;
    const vuruslar = [];

    // ── kapak ─────────────────────────────────────────────────────────────
    Z.kapak({ renk: acik, kancaRenk: hi(1), altRenk: '#10142e', altKutu: hi(1), yN: 0.8, nesnePx: 0.5, weight: 800, suslemeRenk: (i) => hi(i + 1), golge: false });
    // başlangıç düğümü + ilk omurga
    c.sekil('yol-bas', 'daire', SX, ny(0), 34, { t0: 0.4, renk: hi(0), giris: 'pop' });

    // ── paralaks nokta tarlası (uzak, dünya boyunca) ──────────────────────
    const toplamS = n + 2;
    for (let i = 0; i < toplamS * 5; i++) {
      const fx = ((i * 0.6180339) % 1) * 0.92 + 0.06;
      const fy = (i + 0.5) / (toplamS * 5);
      const boyut = 8 + ((i * 7) % 5) * 5;
      c.sekil(`toz-${i}`, 'daire', W * fx, H * toplamS * fy, boyut, { t0: 0, renk: hi(i), opacity: 0.16 + (i % 3) * 0.06, giris: 'yok', depth: 0.35 + (i % 4) * 0.1 });
    }

    // ── duraklar ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const yc = Yc(st);
      const acc = hi(i);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.5; // içerik başlangıcı (kaydırma bittikten sonra)
      vuruslar.push(tA, c.vurus(pl.b0 + 4));

      // omurga parçası: önceki düğümden bu düğüme uzar (kaydırma sırasında)
      const y0 = ny(st - 1);
      const y1 = ny(st);
      const len = y1 - y0;
      for (const [w, al, sfx] of [[26, 0.22, 'g'], [7, 1, 'c']]) {
        c.L({
          id: `omurga-${st}${sfx}`, group: g, asset: 'kare', x: SX, y: y0, anchor: [0.5, 0], scale: 1, scaleX: w / 200, scaleY: [k(panT(t0), 0), k(panT(t0) + PAN + 0.2, len / 200, 'inOutSine')],
          palette: { a: acc }, opacity: al, start: R2(panT(t0)),
        });
      }
      // düğüm (yanar) + halka
      c.sekil(`dugum-${st}`, 'daire', SX, y1, 46, { t0: tA, renk: acc, grup: g, giris: 'pop', sure: 0.35, anims: [{ preset: 'nabiz', t: R2(tA + 0.6), genlik: 0.09, periyot: p * 4 }] });
      c.sekil(`dugum-ic-${st}`, 'daire', SX, y1, 18, { t0: tA + 0.05, renk: '#10142e', grup: g, giris: 'pop', sure: 0.3 });
      c.halka(`dugum-halka-${st}`, tA, SX, y1, acc, { group: g, alfa: 0.6, boyut: 40, son: 190, sure: 0.9 });

      // yıl + ad (omurganın sağında, solda hizalı)
      const yx = SX + 62;
      yazi(`yil-${st}`, s.yil || String(st), tA - 0.1, null, {
        grup: g, x: yx, y: y1 - 18, size: 190, maxW: W - yx - 40, align: 'left', renk: acc, weight: 800, reveal: [0.1, 0.55], golge: false,
        anims: [{ preset: 'kayarak-gir', t: R2(tA - 0.1), dur: 0.5 }],
      });
      yazi(`ad-${st}`, s.ad, tA, null, { grup: g, x: yx, y: y1 + 118, size: 92, maxW: W - yx - 40, align: 'left', renk: acik, weight: 600, reveal: [0.45, 0.8] });

      // cam daire + nesne
      const ox = W * 0.6;
      const oy = yc + H * 0.035;
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      c.sekil(`cam-${st}`, 'daire', ox, oy - m * 0.2, m * 0.66, { t0: tA + 0.15, renk: acc, opacity: 0.16, grup: g, sure: 0.5, anims: [{ preset: 'nefes', t: R2(tA + 0.8), genlik: 0.03, periyot: p * 4 }] });
      c.sekil(`cam-halka-${st}`, 'halka', ox, oy - m * 0.2, m * 0.66, { t0: tA + 0.2, renk: acc, opacity: 0.55, grup: g, sure: 0.5 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: Math.round(ox), y: Math.round(oy), anchor: [0.5, 1], scale: R2((m * 0.45) / Math.max(aw, ah)),
        start: R2(tA + 0.2), anims: [{ preset: 'zipla-gir', t: R2(tA + 0.2), dur: 0.7 }, { preset: 'suzul', t: R2(tA + 1.1), genlik: 12, periyot: 3.2 }],
      });
      // balon
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.6, null, {
          grup: g, x: W * 0.74, y: yc - H * 0.255, size: 64, maxW: W * 0.3, kutu: '#ffffff', radius: 30, pad: [8, 26], rot: 5, renk: '#10142e',
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.6), dur: 0.55 }, { preset: 'sallan', t: R2(tA + 2.2), aci: 4, periyot: 1.6 }],
        });
      }
      // bilgi satırları (cam kart, yazılır)
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.4 + j * 1.2, null, {
          grup: g, x: yx, y: yc + H * (0.19 + j * 0.105), size: 66, maxW: W - yx - 50, sar: 24, align: 'left', renk: acik, weight: 500, lh: 1.1, kutu: 'rgba(255,255,255,0.09)', kutuAlfa: 1, radius: 26, pad: [16, 30],
          reveal: [0.2, 0.9], anims: [{ preset: 'kayarak-gir', t: R2(tA + 1.4 + j * 1.2), dur: 0.45 }],
        });
        c.sekil(`bilgi-isik-${st}${'ab'[j]}`, 'kare', yx - 2, yc + H * (0.19 + j * 0.105), 200, { sx: 8 / 200, sy: 0.34, renk: acc, giris: 'yok', t0: tA + 1.4 + j * 1.2, grup: g, opacity: 0.9 });
      });
      // oklu notlar
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.4 + j * 0.6;
        const nx = W * (j % 2 ? 0.8 : 0.34);
        const nyy = yc + H * 0.125;
        yazi(`not-${st}${'ab'[j]}`, nt, tn, null, {
          grup: g, x: nx, y: nyy, size: 52, maxW: W * 0.3, sar: 12, kutu: acc, renk: '#10142e', weight: 700, rot: j % 2 ? 4 : -4, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }],
        });
        c.L({
          id: `not-ok-${st}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${st}${'ab'[j]}`, to: `nesne-${st}`, start: R2(tn + 0.3),
          fold: [k(tn + 0.3, 0), k(tn + 1.1, 1, 'inOutSine')], palette: { a: acc },
        });
      });
      Z.ses(pl, tA - 0.1);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    const sK = n + 1;
    const dyK = sK * H;
    const yE = ny(sK);
    const len = yE - ny(n);
    c.L({ id: 'omurga-son-g', group: 'g-kapanis', asset: 'kare', x: SX, y: ny(n), anchor: [0.5, 0], scale: 1, scaleX: 26 / 200, scaleY: [k(panT(tK), 0), k(panT(tK) + PAN + 0.2, len / 200, 'inOutSine')], palette: { a: hi(n) }, opacity: 0.22, start: R2(panT(tK)) });
    c.L({ id: 'omurga-son', group: 'g-kapanis', asset: 'kare', x: SX, y: ny(n), anchor: [0.5, 0], scale: 1, scaleX: 7 / 200, scaleY: [k(panT(tK), 0), k(panT(tK) + PAN + 0.2, len / 200, 'inOutSine')], palette: { a: hi(n) }, start: R2(panT(tK)) });
    c.sekil('son-dugum', 'yildiz', SX, yE, 70, { t0: tK + 0.5, renk: hi(1), giris: 'pop', anims: [{ preset: 'nabiz', t: R2(tK + 1), genlik: 0.12, periyot: p * 2 }] });
    Z.kapanis({ renk: acik, dy: dyK, soruRenk: '#10142e', ctaRenk: soluk, t0: tK + 0.45 });
    vuruslar.push(tK + 0.5);

    // ── kamera: aşağı süzülür, her durakta kısa nefes ─────────────────────
    const camY = [k(0, H / 2), k(panT(planlar[0].t0), H / 2, 'linear')];
    const camZ = [k(0, 1.1), k(2.6, 1, 'inOutCubic')];
    const pans = [...planlar.map((pl, i) => ({ t: pl.t0, y: Yc(i + 1) })), { t: tK + 0.45, y: Yc(n + 1) }];
    pans.forEach((q) => {
      camY.push(k(panT(q.t), camY.length ? camY[camY.length - 1].v : H / 2, 'linear'), k(panT(q.t) + PAN, q.y, 'inOutCubic'));
      camZ.push(k(panT(q.t), 1, 'linear'), k(panT(q.t) + PAN * 0.5, 0.965, 'inOutSine'), k(panT(q.t) + PAN, 1, 'inOutSine'));
    });
    // art arda aynı t'ler gelirse sırala
    const sirala = (a) => a.sort((x, y) => x.t - y.t).filter((e, i, arr) => !i || e.t > arr[i - 1].t);
    const sc = Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.4, i: i + 1 })), { t: tK + 0.4, i: n + 1 }], { aci: 175, vinyet: 0.28 }),
      camera: { x: W / 2, y: sirala(camY), zoom: sirala(camZ) },
    });
    return sc;
  },
};
