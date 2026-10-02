// Zaman tüneli · SİNEMATİK ŞERİT: yatay kaydırmalı, paralaks katmanlı gün yolculuğu (şafak → gece).
// Kamera sağa süzülür; uzak tepeler / yakın tepeler / zemin farklı hızda kayar, güneş batar, ay doğar, gökyüzü renk değiştirir.
// Her durakta: arkada dev silik yıl (paralaks), önde ad, zemine basan nesne + gölgesi, balon, oklu notlar; bilgi satırları koyu zemin şeridinde yazılır.
// Kâğıt kesme stili (katmanlı derin gölge). Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { parlaklik } from './reels.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-seridi',
  ad: 'Zaman tüneli · Sinematik şerit',
  etiket: 'Hikâye · Tarihçe · Paralaks · Sinematik',
  sure: '40–90 sn',
  aciklama: 'Yatay kaydırmalı sinematik yolculuk: paralaks tepeler, batan güneş, doğan ay, şafaktan geceye değişen gökyüzü. Her durakta silik dev yıl, zemine basan nesne, balon, notlar ve zemin şeridinde bilgi satırları.',
  ornek: {
    sablon: 'zaman-seridi', id: 'sablon-zaman-seridi', ad: 'Bilgisayarın Yolculuğu', format: 'reels', palet: 'gunyolu', muzik: 'lofi-90', font: 'Baloo 2', stil: 'kagit-kesme',
    kanca: 'Odalardan cebe', baslik: 'Bilgisayarın Yolculuğu', altBaslik: 'oda boyutundan bulutlara', kapakNesne: 'kisisel-bilgisayar',
    bolumler: [
      { yil: '1945', ad: 'ENIAC', nesne: 'eniac', balon: 'Dev gibi!', bilgi: ['Bir odayı doldurur', 'Binlerce vakum tüpüyle çalışır'], notlar: ['vakum tüpü'], anlatim: 'Bin dokuz yüz kırk beş. ENIAC bir odayı dolduruyor ve binlerce vakum tüpüyle çalışıyordu.' },
      { yil: '1947', ad: 'Transistör', nesne: 'transistor', balon: 'Küçülüyor!', bilgi: ['Tüplerin yerini küçük anahtar alır', 'Daha az enerji, daha çok hız'], anlatim: 'Bin dokuz yüz kırk yedi. Transistör, tüplerin yerini aldı. Daha küçük, daha hızlı ve daha az enerji harcıyordu.' },
      { yil: '1958', ad: 'Entegre devre', nesne: 'cip', balon: 'Bir arada!', bilgi: ['Pek çok transistör tek çipe sığar', 'Bilgisayarlar avuç içine yaklaşır'], notlar: ['çip'], anlatim: 'Bin dokuz yüz elli sekiz. Entegre devreyle pek çok transistör tek bir çipe sığdı.' },
      { yil: '1981', ad: 'Kişisel bilgisayar', nesne: 'kisisel-bilgisayar', balon: 'Evime!', bilgi: ['Bilgisayar masalara girer', 'Herkes kullanabilir hâle gelir'], anlatim: 'Bin dokuz yüz seksen bir. Kişisel bilgisayarlar masalara girdi ve herkes kullanabilir oldu.' },
      { yil: '1990\'lar', ad: 'Dizüstü', nesne: 'dizustu', balon: 'Her yerde!', bilgi: ['Bilgisayar çantaya girer', 'İş de oyun da her yerde'], anlatim: 'Bin dokuz yüz doksanlarda dizüstü bilgisayarlar çantalara girdi ve işler her yerde yapılabilir oldu.' },
      { yil: 'Bugün', ad: 'Bulut', nesne: 'sunucu', balon: 'Görünmez!', bilgi: ['İşlem gücü veri merkezlerinde', 'Telefonun bile bulutla çalışır'], notlar: ['veri merkezi'], anlatim: 'Bugün işlem gücü veri merkezlerinde. Telefonumuz bile bulutla birlikte çalışıyor.' },
    ],
    soru: 'Sırada ne var?', cta: 'Tahminini yaz!', son1: 'Yolculuk', son2: 'sürüyor!',
    yayin: { baslik: 'Bilgisayarın yolculuğu: oda boyutundan buluta', aciklama: 'ENIAC\'tan buluta, bilgisayarın küçülerek yayılma hikâyesi. Sence sırada ne var?', etiketler: ['bilgisayar', 'teknoloji', 'tarih', 'bilim', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-seridi', { palet: 'gunyolu', muzik: 'lofi-90', font: 'Baloo 2', stil: 'kagit-kesme' }, { kapSure: 10 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd } = Z;
    const SX = W; // durak aralığı
    const ink = '#2a2d6b';
    const acik = '#f6f2ff';
    const zeminSeri = '#23244f';
    const zi = (i) => Math.round((i / (n + 1)) * (c.pal.bg.length - 1)); // zaman çizgisinde palet indeksi
    const yr = (i) => (parlaklik(c.zemin(zi(i))) < 148 ? acik : ink);
    const stX = (i) => W / 2 + i * SX; // durak merkezi (dünya)
    const PAN = 1.5;
    const panT = (t0) => t0 - 0.8;
    const yerY = H * 0.69;
    const toplamD = (n + 1) * SX; // kamera toplam yol
    const vuruslar = [];
    const dunyaSon = stX(n + 1) + W;

    // ── arka plan öğeleri (paralaks) ──────────────────────────────────────
    // güneş (batar) + ay (doğar): çok uzak katman
    const fS = 0.1;
    const sunX = W / 2 + (fS * toplamD) / 2;
    c.sekil('gunes-hale', 'daire', sunX, H * 0.22, m * 0.62, {
      t0: 0, renk: '#fff1b8', opacity: 0.35, giris: 'yok', depth: 0.9,
      extra: { y: [k(0, H * 0.2), k(tK, H * 0.48, 'inOutSine')], opacity: [k(0, 0.35), k(tK * 0.62, 0.3, 'linear'), k(tK * 0.78, 0, 'inOutSine')] },
    });
    c.sekil('gunes', 'daire', sunX, H * 0.22, m * 0.3, {
      t0: 0, renk: '#ffd34d', giris: 'yok', depth: 0.9,
      extra: { y: [k(0, H * 0.2), k(tK, H * 0.48, 'inOutSine')], opacity: [k(0, 1), k(tK * 0.62, 1, 'linear'), k(tK * 0.78, 0, 'inOutSine')] },
    });
    c.sekil('ay', 'daire', W * 0.86 + fS * toplamD, H * 0.2, m * 0.26, {
      t0: 0, renk: '#fff6d8', giris: 'yok', depth: 0.9,
      extra: { y: [k(0, H * 0.4), k(tK * 0.55, H * 0.4, 'linear'), k(tK, H * 0.09, 'outSine')], opacity: [k(0, 0), k(tK * 0.6, 0, 'linear'), k(tK * 0.85, 1, 'inOutSine')] },
    });
    // bulutlar + yıldızlar
    for (let i = 0; i < 7; i++) {
      const asset = nesneSec('bulut');
      const [bw] = varlikBoyut(asset);
      const d = 0.55 + (i % 3) * 0.12;
      const f = 1 - d;
      c.L({
        id: `bulut-${i + 1}`, asset, x: Math.round(-200 + (i + 0.4) * ((toplamD * f + W + 400) / 7)), y: Math.round(H * (0.12 + (i % 4) * 0.075)), scale: R2((m * (0.22 + (i % 3) * 0.06)) / bw),
        palette: { a: '#ffffff' }, opacity: [k(0, 0.85), k(tK * 0.6, 0.85, 'linear'), k(tK * 0.9, 0.2, 'inOutSine')], depth: d,
        anims: [{ preset: 'suzul', t: 0, genlik: 10, periyot: 5 + i }],
      });
    }
    for (let i = 0; i < 26; i++) {
      const d = 0.8;
      const f = 1 - d;
      c.sekil(`yildiz-${i}`, 'yildiz', ((i * 0.618) % 1) * (toplamD * f + W), H * (0.05 + ((i * 0.37) % 1) * 0.42), 14 + (i % 3) * 8, {
        t0: 0, renk: '#fff6d8', giris: 'yok', depth: d,
        extra: { opacity: [k(0, 0), k(tK * 0.55, 0, 'linear'), k(tK * 0.9, 0.35 + (i % 4) * 0.15, 'inOutSine')] },
        anims: [{ preset: 'nabiz', t: 0, genlik: 0.2, periyot: 2 + (i % 5) * 0.4 }],
      });
    }
    // uzak ve yakın tepeler
    [[0.62, ink, 0.16, 360, 520, H * 0.7, 'tepe-uzak'], [0.36, ink, 0.3, 300, 420, H * 0.745, 'tepe-yakin']].forEach(([d, renk, al, yuk, gen, taban, ad]) => {
      const f = 1 - d;
      const adet = Math.ceil((toplamD * f + W + gen * 2) / (gen * 0.78));
      for (let i = 0; i < adet; i++) {
        const hs = 0.8 + ((i * 53) % 7) / 14;
        c.sekil(`${ad}-${i}`, 'yarim-daire', -gen + i * gen * 0.78, taban, 200, { t0: 0, renk, opacity: al, giris: 'yok', sx: (gen * (0.9 + (i % 3) * 0.1)) / 200, sy: (yuk * hs) / 100, depth: d, extra: { anchor: [0.5, 1] } });
      }
    });

    // ── zemin ─────────────────────────────────────────────────────────────
    c.sekil('zemin', 'kare', dunyaSon / 2 - 400, yerY + H * 0.3, 200, { t0: 0, renk: zeminSeri, giris: 'yok', sx: (dunyaSon + 800) / 200, sy: (H * 0.6) / 200 });
    c.sekil('zemin-cizgi', 'kare', dunyaSon / 2 - 400, yerY + 3, 200, { t0: 0, renk: '#ffffff', opacity: 0.35, giris: 'yok', sx: (dunyaSon + 800) / 200, sy: 6 / 200 });

    // ── kapak ─────────────────────────────────────────────────────────────
    Z.kapak({ renk: ink, kancaRenk: '#7a3cbf', altRenk: '#ffffff', altKutu: '#5b5fc7', yK: 0.26, yB: 0.38, yA: 0.51, yN: 0.69, nesnePx: 0.46, weight: 800, suslemeTipi: 'yok' });

    // ── duraklar ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const X = stX(st);
      const acc = hi(i);
      const renk = yr(zi(st));
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.6;
      vuruslar.push(tA, c.vurus(pl.b0 + 4));

      // silik dev yıl (paralaks, uzak)
      const dY = 0.45;
      const xGhost = W / 2 + st * SX * (1 - dY);
      yazi(`yil-hayalet-${st}`, s.yil || String(st), tA - 0.3, null, {
        grup: g, x: xGhost, y: H * 0.3, size: 330, maxW: W * 0.96, renk, opacity: 0.2, weight: 800, depth: dY, reveal: [0.05, 0.6],
        anims: [{ preset: 'zipla-gir', t: R2(tA - 0.3), dur: 0.7 }],
      });
      // ad (önde)
      yazi(`ad-${st}`, s.ad, tA, null, { grup: g, x: X, y: H * 0.17, size: 112, maxW: W * 0.9, renk, weight: 800, golge: parlaklik(renk) > 148, reveal: [0.1, 0.7], anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.5 }] });
      yazi(`yil-${st}`, s.yil || String(st), tA + 0.2, null, { grup: g, x: X, y: H * 0.235, size: 64, maxW: W * 0.7, kutu: acc, kutuAlfa: 1, radius: 999, pad: [6, 26], renk: '#2a2d6b', weight: 800, anims: [{ preset: 'zipla-gir', t: R2(tA + 0.2), dur: 0.45 }] });

      // nesne: zemine basar, gölgesi
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      c.sekil(`golge-${st}`, 'daire', X, yerY + 14, m * 0.5, { t0: tA + 0.1, renk: '#000000', opacity: 0.28, sx: 1, sy: 0.14, grup: g, sure: 0.5 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: Math.round(X), y: Math.round(yerY), anchor: [0.5, 1], scale: R2((m * 0.48) / Math.max(aw, ah)), start: R2(tA),
        anims: [{ preset: 'zipla-gir', t: R2(tA + 0.05), dur: 0.7 }, { preset: 'nefes', t: R2(tA + 1), genlik: 0.014, periyot: p * 4 }],
      });
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.4, null, {
          grup: g, x: X + W * 0.27, y: H * 0.4, size: 64, maxW: W * 0.34, kutu: '#ffffff', radius: 28, pad: [8, 26], rot: 5, renk: '#2a2d6b',
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.4), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 2), aci: 4, periyot: 1.6 }],
        });
      }
      // bilgi satırları zemin şeridinde
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.2 + j * 1.15, null, {
          grup: g, x: X, y: H * (0.748 + j * 0.068), size: 78, maxW: W * 0.94, renk: acik, weight: 700, reveal: [0.1, 0.9],
        });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.4 + j * 0.6;
        yazi(`not-${st}${'ab'[j]}`, nt, tn, null, {
          grup: g, x: X + (j % 2 ? 1 : -1) * W * 0.3, y: H * (0.47 + j * 0.06), size: 48, maxW: W * 0.3, sar: 12, kutu: acc, renk: '#2a2d6b', weight: 800, rot: j % 2 ? 4 : -4,
          anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }],
        });
        c.L({
          id: `not-ok-${st}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${st}${'ab'[j]}`, to: `nesne-${st}`, start: R2(tn + 0.3),
          fold: [k(tn + 0.3, 0), k(tn + 1.1, 1, 'inOutSine')], palette: { a: parlaklik(renk) > 148 ? '#ffffff' : '#2a2d6b' },
        });
      });
      Z.ses(pl, tA);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    const dxK = stX(n + 1) - W / 2;
    Z.kapanis({ renk: acik, dx: dxK, t0: tK + 0.5, soruRenk: '#2a2d6b', ctaRenk: '#cfc6f2', golge: false });
    vuruslar.push(tK + 0.5);

    // ── kamera: yatay süzülme + her geçişte hafif uzaklaşma ───────────────
    const camX = [k(0, W / 2)];
    const camZ = [k(0, 1.12), k(3, 1, 'inOutCubic')];
    const pans = [...planlar.map((pl, i) => ({ t: pl.t0, x: stX(i + 1) })), { t: tK + 0.5, x: stX(n + 1) }];
    let sonX = W / 2;
    pans.forEach((q) => {
      camX.push(k(panT(q.t), sonX, 'linear'), k(panT(q.t) + PAN, q.x, 'inOutCubic'));
      camZ.push(k(panT(q.t), 1, 'linear'), k(panT(q.t) + PAN * 0.5, 0.93, 'inOutSine'), k(panT(q.t) + PAN, 1, 'inOutSine'));
      sonX = q.x;
    });
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.6, i: zi(i + 1) })), { t: tK + 1.2, i: c.pal.bg.length - 1 }].map((q, j) => (j === 0 ? q : { ...q })), { aci: 175, vinyet: 0.14, kagit: 0.2 }),
      camera: { x: camX, y: H / 2, zoom: camZ },
    });
  },
};
