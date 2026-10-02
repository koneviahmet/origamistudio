// Zaman tüneli · YÜKSELİŞ MERDİVENİ: her dönem bir basamak — kamera çapraz yukarı tırmanır, gökyüzü şafaktan uzaya doğru koyulaşır.
// Basamaklar yerden yükselir (renkli üst kenar), nesne basamağın tepesinde durur; yıl ve ad gökyüzünde, bilgi satırları basamağın yüzünde yazılır.
// Altta bulutlar kalır, yukarıda yıldızlar belirir (paralaks). Gelişim / ilerleme / "adım adım yükseliş" hikâyeleri için.
// Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { parlaklik, karistir } from './reels.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-merdiven',
  ad: 'Zaman tüneli · Yükseliş merdiveni',
  etiket: 'Hikâye · Gelişim · Yükseliş · Sinematik',
  sure: '40–90 sn',
  aciklama: 'Her dönem bir basamak: kamera çapraz yukarı tırmanır, gökyüzü şafaktan uzaya koyulaşır, bulutlar altta kalır, yıldızlar belirir. Basamağın tepesinde nesne, gökyüzünde yıl ve ad, basamak yüzünde bilgi satırları.',
  ornek: {
    sablon: 'zaman-merdiven', id: 'sablon-zaman-merdiven', ad: 'Gökyüzüne Tırmanış', format: 'reels', palet: 'yukselis', muzik: 'pop-120', font: 'Lexend', stil: 'duz',
    kanca: 'Kâğıt uçaktan', baslik: 'Gökyüzüne Tırmanış', altBaslik: 'uzaya uzanan 120 yıl', kapakNesne: 'kagit-ucak',
    bolumler: [
      { yil: '1903', ad: 'İlk motorlu uçuş', nesne: 'ucak', balon: 'Havalandı!', bilgi: ['Wright kardeşler 12 saniye uçar', 'Havacılık çağı başlar'], notlar: ['motor'], anlatim: 'Bin dokuz yüz üç. Wright kardeşler motorlu uçakla on iki saniye havada kaldı ve havacılık çağı başladı.' },
      { yil: '1957', ad: 'Sputnik', nesne: 'uydu-3d', balon: 'Bip bip!', bilgi: ['İlk yapay uydu yörüngede', 'Uzay çağı başlar'], anlatim: 'Bin dokuz yüz elli yedi. Sputnik, yörüngeye çıkan ilk yapay uydu oldu.' },
      { yil: '1961', ad: 'İlk insan', nesne: 'roket-3d', balon: 'Hadi!', bilgi: ['Yuri Gagarin uzaya çıkar', 'Yolculuk 108 dakika sürer'], anlatim: 'Bin dokuz yüz altmış bir. Yuri Gagarin uzaya giden ilk insan oldu.' },
      { yil: '1969', ad: 'Ay\'a iniş', nesne: 'astronot-3d', balon: 'Küçük adım!', bilgi: ['Apollo 11 Ay\'a ayak basar', 'Armstrong ilk adımı atar'], notlar: ['Ay'], anlatim: 'Bin dokuz yüz altmış dokuz. Apollo on bir ile insan ilk kez Ay\'a ayak bastı.' },
      { yil: '1998', ad: 'Uzay istasyonu', nesne: 'uzay-istasyonu-3d', balon: 'Merhaba!', bilgi: ['Uluslararası Uzay İstasyonu kurulur', 'Yörüngede kalıcı yaşam'], anlatim: 'Bin dokuz yüz doksan sekiz. Uluslararası Uzay İstasyonu\'nun ilk modülü yörüngeye yerleşti.' },
    ],
    soru: 'Sıradaki basamak neresi?', cta: 'Tahminini yaz!', son1: 'Yükseliş', son2: 'sürüyor!',
    yayin: { baslik: 'Gökyüzüne tırmanış: kâğıt uçaktan uzay istasyonuna', aciklama: 'Wright kardeşlerden uzay istasyonuna, gökyüzüne yükselişin 120 yılı. Sence sıradaki basamak neresi?', etiketler: ['uzay', 'havacilik', 'tarih', 'bilim', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-merdiven', { palet: 'yukselis', muzik: 'pop-120', font: 'Lexend', stil: 'duz' }, { kapSure: 10 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd } = Z;
    const SW = Math.round(W * 0.72); // basamak genişliği
    const SY = Math.round(H * 0.125); // basamak yüksekliği
    const ACIK = '#f4f1ff';
    const KOYU = '#1b1d4a';
    const zi = (i) => Math.round((i / (n + 1)) * (c.pal.bg.length - 1));
    const yr = (i) => (parlaklik(c.zemin(zi(i))) < 148 ? ACIK : KOYU);
    const yerY = H * 0.745;
    const cx = (i) => W / 2 + i * SW;
    const cy = (i) => H / 2 - i * SY;
    const tY = (i) => yerY - i * SY; // basamak üst kenarı (dünya)
    const PAN = 1.4;
    const panT = (t0) => t0 - 0.8;
    const vuruslar = [];
    const dxT = (i) => i * SW;
    const dyT = (i) => -i * SY;
    const Dx = (n + 1) * SW;
    const Dy = (n + 1) * SY;

    // ── paralaks gökyüzü: bulutlar (alçakta kalır) + yıldızlar (yukarıda belirir) ──
    for (let i = 0; i < 9; i++) {
      const d = 0.5 + (i % 3) * 0.1;
      const f = 1 - d;
      const u = (i % 5) / 5 * 0.55; // alçak aşamalarda görünür
      const asset = nesneSec('bulut');
      const [bw] = varlikBoyut(asset);
      c.L({
        id: `bulut-${i + 1}`, asset, x: Math.round(W * (0.1 + ((i * 0.37) % 0.8)) + f * Dx * u), y: Math.round(H * (0.2 + ((i * 0.23) % 0.45)) - f * Dy * u), scale: R2((m * (0.24 + (i % 3) * 0.07)) / bw),
        palette: { a: '#ffffff' }, opacity: [k(0, 0.9), k(tK * 0.45, 0.8, 'linear'), k(tK * 0.75, 0, 'inOutSine')], depth: d, anims: [{ preset: 'suzul', t: 0, genlik: 12, periyot: 5 + i }],
      });
    }
    for (let i = 0; i < 40; i++) {
      const d = 0.78 + (i % 3) * 0.05;
      const f = 1 - d;
      const u = 0.35 + (i % 8) / 8 * 0.65;
      c.sekil(`yildiz-${i}`, 'yildiz', W * (0.05 + ((i * 0.618) % 0.9)) + f * Dx * u, H * (0.04 + ((i * 0.37) % 0.6)) - f * Dy * u, 12 + (i % 4) * 7, {
        t0: 0, renk: '#fff6d8', giris: 'yok', depth: d,
        extra: { opacity: [k(0, 0), k(tK * 0.4, 0, 'linear'), k(tK * 0.85, 0.35 + (i % 4) * 0.15, 'inOutSine')] },
        anims: [{ preset: 'nabiz', t: 0, genlik: 0.25, periyot: 2 + (i % 5) * 0.4 }],
      });
    }
    // uzak dev gezegen (yukarıda yükselir)
    c.sekil('gezegen', 'daire', W * 0.86 + (1 - 0.93) * Dx, H * 0.5 - (1 - 0.93) * Dy * 0.2, m * 0.55, {
      t0: 0, renk: '#6a4fc7', opacity: 0.0, giris: 'yok', depth: 0.93,
      extra: { opacity: [k(0, 0), k(tK * 0.5, 0, 'linear'), k(tK * 0.95, 0.28, 'inOutSine')] },
    });

    // ── zemin / basamaklar ────────────────────────────────────────────────
    const zeminRenk = (i) => karistir(c.zemin(zi(i)), '#000000', 0.62);
    c.L({
      id: 'basamak-0', asset: 'kare', x: W / 2, y: tY(0), anchor: [0.5, 0], scale: 1, scaleX: (W * 3) / 200, scaleY: (H * 3) / 200, palette: { a: zeminRenk(0) },
    });
    c.L({ id: 'basamak-0-kenar', asset: 'kare', x: W / 2, y: tY(0), anchor: [0.5, 0], scale: 1, scaleX: (W * 3) / 200, scaleY: 14 / 200, palette: { a: hi(0) } });

    // ── kapak ─────────────────────────────────────────────────────────────
    Z.kapak({ renk: yr(0), kancaRenk: '#b0207a', altRenk: '#ffffff', altKutu: '#6a4fc7', yK: 0.26, yB: 0.38, yA: 0.51, yN: 0.742, nesnePx: 0.46, weight: 800, suslemeRenk: (i) => hi(i + 1) });

    // ── duraklar ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const acc = hi(i + 1);
      const tE = R2(t1 + 0.4); // basamak sahnesi kameradan çıkarken yazı/nesne de çekilir (soldaki kesik artıklar kalmasın)
      const renk = yr(st);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.55;
      vuruslar.push(tA, c.vurus(pl.b0 + 4));
      const ox = dxT(st);
      const oy = dyT(st);
      const X = (sx) => sx + ox; // ekran → dünya
      const Y = (sy) => sy + oy;

      // basamak (yerden yükselir) + üst kenar
      const bx = cx(st);
      const tBas = panT(t0) + 0.1;
      c.L({
        id: `basamak-${st}`, group: g, asset: 'kare', x: bx, y: [k(tBas, tY(st) + SY * 1.6), k(tBas + 0.8, tY(st), 'outBack')], anchor: [0.5, 0], scale: 1, scaleX: SW / 200, scaleY: (H * 3) / 200,
        palette: { a: zeminRenk(st) }, start: R2(tBas),
      });
      c.L({
        id: `basamak-kenar-${st}`, group: g, asset: 'kare', x: bx, y: [k(tBas, tY(st) + SY * 1.6), k(tBas + 0.8, tY(st), 'outBack')], anchor: [0.5, 0], scale: 1, scaleX: SW / 200, scaleY: 14 / 200,
        palette: { a: acc }, start: R2(tBas),
      });

      // yıl + ad (gökyüzü)
      yazi(`yil-${st}`, s.yil || String(st), tA, tE, {
        grup: g, x: X(W / 2), y: Y(H * 0.125), size: 200, maxW: W * 0.88, renk, weight: 800, reveal: [0.05, 0.55], golge: parlaklik(renk) > 148,
        anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.6 }],
      });
      yazi(`ad-${st}`, s.ad, tA + 0.3, tE, {
        grup: g, x: X(W / 2), y: Y(H * 0.215), size: 80, maxW: W * 0.86, kutu: acc, kutuAlfa: 1, radius: 999, pad: [8, 34], renk: '#1b1d4a', weight: 700, anims: [{ preset: 'zipla-gir', t: R2(tA + 0.3), dur: 0.5 }],
      });

      // nesne: basamağın tepesinde
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      c.sekil(`golge-${st}`, 'daire', X(W / 2), Y(yerY) + 12, m * 0.46, { t0: tA + 0.1, t1: tE, renk: '#000000', opacity: 0.3, sx: 1, sy: 0.13, grup: g, sure: 0.5 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: Math.round(X(W / 2)), y: Math.round(Y(yerY)), anchor: [0.5, 1], scale: R2((m * 0.44) / Math.max(aw, ah)), start: R2(tA), end: tE,
        anims: [{ preset: 'zipla-gir', t: R2(tA + 0.05), dur: 0.7 }, { preset: 'suzul', t: R2(tA + 1), genlik: 9, periyot: 3.2 }],
      });
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.4, tE, {
          grup: g, x: X(W * 0.76), y: Y(H * 0.44), size: 60, maxW: W * 0.3, kutu: '#ffffff', radius: 28, pad: [8, 26], rot: 5, renk: '#1b1d4a',
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.4), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 2), aci: 4, periyot: 1.6 }],
        });
      }
      // bilgi satırları: basamağın yüzünde
      const bY = Z.yigin(pl.bilgi, { size: 54, maxW: SW * 0.88, lh: 1.08, gap: 26, minOran: 0.82 });
      bY.items.forEach((it, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, it.ln, tA + 1.2 + j * 1.15, tE, {
          grup: g, x: X(W / 2), y: Y(H * 0.775) + it.yOff, size: it.size, maxW: SW * 0.88, sar: it.sar, renk: ACIK, weight: 600, lh: 1.08, reveal: [0.1, 0.9],
        });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.4 + j * 0.6;
        yazi(`not-${st}${'ab'[j]}`, nt, tn, tE, {
          grup: g, x: X(W * (j % 2 ? 0.8 : 0.2)), y: Y(H * 0.58), size: 46, maxW: W * 0.28, sar: 12, kutu: acc, renk: '#1b1d4a', weight: 700, rot: j % 2 ? 4 : -4, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }],
        });
        c.L({
          id: `not-ok-${st}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${st}${'ab'[j]}`, to: `nesne-${st}`, start: R2(tn + 0.3), end: tE,
          fold: [k(tn + 0.3, 0), k(tn + 1.1, 1, 'inOutSine')], palette: { a: renk },
        });
      });
      Z.ses(pl, tA);
    });

    // ── zirve (kapanış) ───────────────────────────────────────────────────
    const sK = n + 1;
    const bxK = cx(sK);
    const tBasK = panT(tK + 0.5) + 0.1;
    c.L({ id: 'zirve', group: 'g-kapanis', asset: 'kare', x: bxK, y: [k(tBasK, tY(sK) + SY * 1.6), k(tBasK + 0.8, tY(sK), 'outBack')], anchor: [0.5, 0], scale: 1, scaleX: (W * 3) / 200, scaleY: (H * 3) / 200, palette: { a: zeminRenk(sK) }, start: R2(tBasK) });
    c.L({ id: 'zirve-kenar', group: 'g-kapanis', asset: 'kare', x: bxK, y: [k(tBasK, tY(sK) + SY * 1.6), k(tBasK + 0.8, tY(sK), 'outBack')], anchor: [0.5, 0], scale: 1, scaleX: (W * 3) / 200, scaleY: 14 / 200, palette: { a: hi(1) }, start: R2(tBasK) });
    Z.kapanis({ renk: ACIK, dx: dxT(sK), dy: dyT(sK), t0: tK + 0.5, soruRenk: '#1b1d4a', soruKutu: hi(1), ctaRenk: '#cfc6f2' });
    vuruslar.push(tK + 0.5);

    // ── kamera: çapraz tırmanış ───────────────────────────────────────────
    const camX = [k(0, W / 2)];
    const camY = [k(0, H / 2)];
    const camZ = [k(0, 1.12), k(3, 1, 'inOutCubic')];
    const pans = [...planlar.map((pl, i) => ({ t: pl.t0, i: i + 1 })), { t: tK + 0.5, i: n + 1 }];
    let sx = W / 2;
    let sy = H / 2;
    pans.forEach((q) => {
      camX.push(k(panT(q.t), sx, 'linear'), k(panT(q.t) + PAN, cx(q.i), 'inOutCubic'));
      camY.push(k(panT(q.t), sy, 'linear'), k(panT(q.t) + PAN, cy(q.i), 'inOutCubic'));
      camZ.push(k(panT(q.t), 1, 'linear'), k(panT(q.t) + PAN * 0.5, 0.95, 'inOutSine'), k(panT(q.t) + PAN, 1, 'inOutSine'));
      sx = cx(q.i);
      sy = cy(q.i);
    });
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.4, i: zi(i + 1) })), { t: tK + 0.9, i: c.pal.bg.length - 1 }], { aci: 180, vinyet: 0.2, sure: 1.2 }),
      camera: { x: camX, y: camY, zoom: camZ },
    });
  },
};
