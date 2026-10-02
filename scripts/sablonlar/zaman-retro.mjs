// Zaman tüneli · RETRO DALGA: synthwave yolu. Çizgili güneş, neon dağlar, ufka kayan perspektif ızgara; her dönemde nesne ufuktan
// üstümüze doğru YAKLAŞIR (perspektif büyüme), zemine konar, altında neon platform halkası atar. Yıl neon parıltılı + RGB kayma (glitch) ile gelir,
// bilgi satırları "terminal" gibi yazılır; dönem sonunda nesne güneşe doğru uçup küçülür. Vuruşa oturan zoom darbeleri. Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-retro',
  ad: 'Zaman tüneli · Retro dalga',
  etiket: 'Hikâye · Synthwave · Neon · Enerjik',
  sure: '35–80 sn',
  aciklama: 'Synthwave yolu: çizgili güneş, neon dağlar, ufka kayan ızgara. Nesneler ufuktan yaklaşır, neon platforma konar; yıl parıltılı ve RGB kaymalı gelir, bilgi satırları terminal gibi yazılır. Vuruşlu, retro-fütüristik.',
  ornek: {
    sablon: 'zaman-retro', id: 'sablon-zaman-retro', ad: 'Oyunun Evrimi', format: 'reels', palet: 'retro', muzik: 'house-126', font: 'Righteous', stil: 'duz',
    kanca: 'INSERT COIN', baslik: 'Telefon 2.0', altBaslik: 'ahizeden ekrana', kapakNesne: 'akilli-telefon',
    bolumler: [
      { yil: '1876', ad: 'Ahize', nesne: 'cevirmeli-telefon', balon: 'Alo!', bilgi: ['Ses tel üzerinden ilk kez gider', 'Bell patentini alır'], notlar: ['patent'], anlatim: 'Bin sekiz yüz yetmiş altı. Bell, sesi tel üzerinden ileten telefonun patentini aldı.' },
      { yil: '1963', ad: 'Tuşlar', nesne: 'tuslu-telefon', balon: 'Tık tık!', bilgi: ['Çevirmek yerine tuşa basılır', 'Numara çok daha hızlı girilir'], anlatim: 'Bin dokuz yüz altmış üç. Tuşlu telefonlar çevirmenin yerini aldı ve numara girmek hızlandı.' },
      { yil: '1983', ad: 'Tuğla', nesne: 'tugla-telefon', balon: 'Taşınır!', bilgi: ['İlk ticari cep telefonu', 'Ağır ama özgürlük verir'], notlar: ['antenli'], anlatim: 'Bin dokuz yüz seksen üç. İlk ticari cep telefonu tuğla gibi ağırdı ama özgürlük verdi.' },
      { yil: '2007', ad: 'Dokunmatik', nesne: 'akilli-telefon', balon: 'Dokun!', bilgi: ['Ekran ve uygulamalar', 'Cebimizde bir bilgisayar'], notlar: ['ekran'], anlatim: 'İki bin yedi. Akıllı telefonlar dokunmatik ekranı ve uygulamaları getirdi.' },
      { yil: 'Bugün', ad: 'Her şey', nesne: 'modern-telefon', balon: 'Hepsi bir arada!', bilgi: ['Kamera, harita, cüzdan, stüdyo', 'Her şey tek cihazda'], anlatim: 'Bugün telefon kamera, harita, cüzdan ve stüdyo, hepsi tek cihazda.' },
    ],
    soru: 'Sonraki seviye ne?', cta: 'Yorumlara yaz!', son1: 'Oyun', son2: 'devam ediyor!',
    yayin: { baslik: 'Telefon 2.0: ahizeden ekrana', aciklama: 'Çevirmeli telefondan akıllı telefona retro-dalga bir yolculuk. Sence sonraki seviye ne?', etiketler: ['telefon', 'teknoloji', 'retro', 'synthwave', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-retro', { palet: 'retro', muzik: 'house-126', font: 'Righteous', stil: 'duz' }, { kapakBeats: 8, kapSure: 12, minSn: 5.6 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const MONO = 'Space Mono';
    const CYAN = '#00f0ff';
    const PEMBE = '#ff4fd8';
    const cx = W / 2;
    const hz = H * 0.5; // ufuk
    const zeminY = H - hz;
    const vuruslar = [];

    // ── gökyüzü: yıldızlar + güneş + dağlar ──────────────────────────────
    const gA = c.grup('g-arka', 'Arka plan', true);
    for (let i = 0; i < 46; i++) {
      c.sekil(`y-${i}`, 'yildiz', W * (((i * 0.618) % 1) * 0.96 + 0.02), H * (0.03 + ((i * 0.37) % 1) * 0.42), 10 + (i % 4) * 6, {
        t0: 0, renk: '#ffffff', opacity: 0.5 + (i % 3) * 0.15, giris: 'yok', grup: gA, anims: [{ preset: 'nabiz', t: 0, genlik: 0.3, periyot: 1.5 + (i % 5) * 0.4 }],
      });
    }
    Z.isik('ufuk-isik', cx, hz, W * 1.5, '#ff2e93', { t0: 0, opacity: 0.55, blur: 80, grup: gA, extra: { scaleY: 0.45 } });
    const GR = m * 0.34;
    const sunY = hz - m * 0.13;
    c.sekil('gunes-hale', 'daire', cx, sunY, m * 0.95, { t0: 0, renk: '#ff5ea8', opacity: 0.35, blur: 50, giris: 'yok', grup: gA });
    c.sekil('gunes', 'daire', cx, sunY, m * 0.66, { t0: 0, renk: '#ffcf4a', giris: 'yok', grup: gA, anims: [{ preset: 'ritimle-nabiz', t: 0.5, genlik: 0.025 }] });
    c.sekil('gunes-alt', 'daire', cx, sunY + m * 0.1, m * 0.64, { t0: 0, renk: '#ff5ea8', opacity: 0.55, giris: 'yok', grup: gA });
    // güneş çizgileri (kesikler)
    [[0.04, 5], [0.085, 9], [0.13, 14], [0.18, 20], [0.235, 28]].forEach(([f, h], i) => {
      c.sekil(`gunes-cizgi-${i}`, 'kare', cx, sunY + m * 0.02 + m * f * 1.4, 200, { t0: 0, renk: '#1a0638', giris: 'yok', sx: (m * 0.7) / 200, sy: h / 200, grup: gA });
    });
    // neon dağlar
    [[0.17, 0.13, 560, 330], [0.84, 0.15, 620, 380], [0.02, 0.1, 360, 230], [0.99, 0.11, 400, 260]].forEach(([fx, fy, gen, yuk], i) => {
      c.sekil(`dag-kenar-${i}`, 'ucgen', W * fx, hz - 6, gen + 16, { t0: 0, renk: CYAN, opacity: 0.75, giris: 'yok', sx: 1, sy: (yuk * 200) / (180 * (gen + 16)), grup: gA, extra: { anchor: [0.5, 1] } });
      c.sekil(`dag-${i}`, 'ucgen', W * fx, hz, gen, { t0: 0, renk: '#150640', giris: 'yok', sx: 1, sy: ((yuk - 12) * 200) / (180 * gen), grup: gA, extra: { anchor: [0.5, 1] } });
    });

    // ── zemin: perspektif ızgara ─────────────────────────────────────────
    const gZ = c.grup('g-zemin', 'Zemin', true);
    c.sekil('zemin', 'kare', cx, hz + zeminY / 2, 200, { t0: 0, renk: '#12042e', giris: 'yok', sx: (W * 1.2) / 200, sy: zeminY / 200, grup: gZ });
    // dikey (ufuktan açılan) çizgiler
    for (let q = -7; q <= 7; q++) {
      const a = q * 12;
      const len = Math.min(zeminY / Math.cos((a * Math.PI) / 180) + 60, 5200);
      c.L({ id: `izgara-d-${q + 7}`, group: gZ, asset: 'kare', x: cx, y: hz, anchor: [0.5, 0], scale: 1, scaleX: 3.5 / 200, scaleY: len / 200, rotation: -a, palette: { a: q % 2 ? '#b14dff' : CYAN }, opacity: 0.55, start: 0 });
    }
    // yatay çizgiler: ufuktan yaklaşır (perspektif ivmeli); bir döngü = 4 vuruş
    const T = p * 4;
    const NL = 8;
    const ornek = 6;
    for (let j = 0; j < NL; j++) {
      const keys = [];
      const ph = j / NL;
      const cycles = Math.ceil(tEnd / T) + 1;
      for (let cy = -1; cy < cycles; cy++) {
        for (let s = 0; s <= ornek; s++) {
          const u = s / ornek;
          const t = (cy + (u - ph)) * T; // u'nun bu çizgideki faza göre zamanı
          const uu = u;
          const y = hz + zeminY * Math.pow(uu, 2.2);
          if (t < -T || t > tEnd + T) continue;
          keys.push(k(t, R2(y), 'linear'));
        }
      }
      const sirali = keys.sort((a, b) => a.t - b.t).filter((e, i, arr) => !i || e.t > arr[i - 1].t);
      // döngü sıçraması: u=1 → u=0 arası aynı t'de değil, bir sonraki döngünün ilk anahtarı u=0 (t = (cy+1-ph)T) — ardışık olduğundan sıçrama anında 'step' gerekir
      for (let i = 1; i < sirali.length; i++) {
        if (sirali[i].v < sirali[i - 1].v) { sirali[i].ease = 'step'; }
      }
      c.L({ id: `izgara-y-${j}`, group: gZ, asset: 'kare', x: cx, y: sirali, scale: 1, scaleX: (W * 1.2) / 200, scaleY: 3.5 / 200, palette: { a: j % 2 ? PEMBE : CYAN }, opacity: 0.5, start: 0 });
    }
    c.sekil('ufuk-cizgi', 'kare', cx, hz, 200, { t0: 0, renk: '#ff7bd9', giris: 'yok', sx: (W * 1.2) / 200, sy: 5 / 200, grup: gZ });
    Z.isik('ufuk-cizgi-isik', cx, hz, W, '#ff7bd9', { t0: 0, opacity: 0.7, blur: 12, grup: gZ, extra: { scaleY: 0.02 } });

    // ── kapak ─────────────────────────────────────────────────────────────
    Z.kapak({ renk: '#ffffff', kancaRenk: CYAN, altRenk: '#10001f', altKutu: '#ffe600', yK: 0.14, yB: 0.24, yA: 0.37, yN: 0.74, nesnePx: 0.4, weight: 400, suslemeTipi: 'yok', upper: true, golge: true, baslikSize: 190, kancaSize: 62, sar: 11 });
    yazi('baslik-isik', brief.baslik || brief.ad, 0, tKapak, { grup: 'g-acilis', y: H * 0.24, size: 190, sar: 11, renk: PEMBE, upper: true, blur: 22, opacity: 0.9, weight: 400, reveal: [0.9, 1.5], lh: 1, anims: [{ preset: 'kuculerek-cik', t: R2(tKapak - 0.55), dur: 0.5 }] });

    // ── dönemler ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const acc = hi(i);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.1;
      for (let j = 0; j < pl.beats; j += 2) vuruslar.push(c.vurus(pl.b0 + j));

      // geçiş: parlama + RGB kayma
      c.flas(`flas-${st}`, t0, { renk: acc, alfa: 0.55, sure: 0.3 });
      c.halka(`gecis-halka-${st}`, t0, cx, hz, acc, { group: g, alfa: 0.8, boyut: m * 0.2, son: m * 2.2, sure: 0.8 });

      // yıl: neon + glitch
      const yilM = s.yil || String(st);
      const yY = H * 0.17;
      yazi(`yil-isik-${st}`, yilM, t0, t1, { grup: g, y: yY, size: 250, maxW: W * 0.9, renk: acc, upper: true, blur: 22, opacity: 0.85, weight: 400, anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.5 }] });
      yazi(`yil-c-${st}`, yilM, t0, t0 + 0.4, { grup: g, x: cx - 12, y: yY, size: 250, maxW: W * 0.9, renk: CYAN, upper: true, opacity: 0.8, weight: 400, rot: 0 });
      yazi(`yil-m-${st}`, yilM, t0, t0 + 0.4, { grup: g, x: cx + 12, y: yY, size: 250, maxW: W * 0.9, renk: PEMBE, upper: true, opacity: 0.8, weight: 400 });
      yazi(`yil-${st}`, yilM, tA, t1, { grup: g, y: yY, size: 250, maxW: W * 0.9, renk: '#ffffff', upper: true, weight: 400, stroke: { color: acc, width: 6 }, anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.5 }, { preset: 'ritimle-nabiz', t: R2(tA + 0.6), genlik: 0.025 }] });
      yazi(`ad-${st}`, s.ad, tA + 0.4, t1, { grup: g, y: H * 0.255, size: 70, maxW: W * 0.86, renk: '#ffffff', upper: true, harf: 10, weight: 400, reveal: [0.1, 0.7], anims: [{ preset: 'sol', t: R2(t1 - 0.4), dur: 0.35 }] });
      c.sekil(`ad-cizgi-${st}`, 'kare', cx, H * 0.285, 200, { t0: tA + 0.8, t1, renk: acc, giris: 'yok', grup: g, sx: [k(tA + 0.8, 0), k(tA + 1.3, (W * 0.5) / 200, 'outCubic')], sy: 4 / 200 });

      // nesne: ufuktan yaklaşır
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const sc1 = (m * 0.46) / Math.max(aw, ah);
      const yZ = H * 0.7;
      const tG = t0 + 0.2;
      const tV = tG + 1.4; // varış
      Z.isik(`nesne-isik-${st}`, cx, yZ - m * 0.2, m * 0.8, acc, { t0: tV - 0.3, t1: t1, opacity: 0, blur: 55, grup: g, extra: { opacity: [k(tV - 0.3, 0), k(tV + 0.4, 0.5, 'outCubic'), k(t1 - 0.4, 0.5, 'linear'), k(t1, 0, 'linear')] } });
      c.sekil(`platform-${st}`, 'halka', cx, yZ + 8, m * 0.62, { t0: tV - 0.2, t1: t1, renk: acc, opacity: 0.95, giris: 'yok', sx: 1, sy: 0.2, grup: g, anims: [{ preset: 'ritimle-nabiz', t: R2(tV), genlik: 0.05 }], blur: 0 });
      c.sekil(`platform-isik-${st}`, 'halka', cx, yZ + 8, m * 0.62, { t0: tV - 0.2, t1: t1, renk: acc, opacity: 0.6, giris: 'yok', sx: 1, sy: 0.2, grup: g, blur: 14 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: cx, anchor: [0.5, 1], start: R2(tG), end: R2(t1),
        y: [k(tG, hz), k(tV, yZ, 'inQuad'), k(t1 - 0.55, yZ, 'linear'), k(t1 - 0.05, sunY, 'inCubic')],
        scale: [k(tG, R2(sc1 * 0.08)), k(tV, R2(sc1), 'inQuad'), k(t1 - 0.55, R2(sc1), 'linear'), k(t1 - 0.05, R2(sc1 * 0.1), 'inCubic')],
        rotation: [k(tG, -8), k(tV, 0, 'outCubic')],
        opacity: [k(tG, 0.2), k(tG + 0.5, 1, 'linear'), k(t1 - 0.55, 1, 'linear'), k(t1 - 0.05, 0.4, 'linear')],
        anims: [{ preset: 'suzul', t: R2(tV + 0.3), genlik: 10, periyot: p * 4 }],
      });
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tV + 0.5, t1 - 0.5, {
          grup: g, x: W * 0.78, y: H * 0.41, size: 52, maxW: W * 0.3, sar: 10, kutu: acc, radius: 14, pad: [8, 20], rot: 6, renk: '#10001f', weight: 400,
          anims: [{ preset: 'zipla-gir', t: R2(tV + 0.5), dur: 0.45 }, { preset: 'ritimle-sallan', t: R2(tV + 1), aci: 3 }, { preset: 'kuculerek-cik', t: R2(t1 - 0.8), dur: 0.3 }],
        });
      }
      // terminal bilgi satırları
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, `> ${ln}`, tV + 0.6 + j * 1.1, t1 - 0.2, {
          grup: g, y: H * (0.765 + j * 0.055), size: 44, maxW: W * 0.92, sar: 40, font: MONO, weight: 700, renk: CYAN, align: 'center', kutu: 'rgba(8,0,32,0.72)', kutuAlfa: 1, radius: 8, pad: [10, 22], reveal: [0.05, 0.9], lh: 1.1,
        });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tV + 1.8 + j * 0.5;
        yazi(`not-${st}${'ab'[j]}`, `#${nt}`, tn, t1 - 0.5, {
          grup: g, x: W * (j % 2 ? 0.84 : 0.16), y: H * 0.545, size: 38, sabit: true, font: MONO, weight: 700, kutu: PEMBE, renk: '#10001f', radius: 6, pad: [6, 16], rot: j % 2 ? 4 : -4, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.4 }],
        });
      });
      Z.ses(pl, tA);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    c.flas('flas-kapanis', tK, { renk: '#ffffff', alfa: 0.6, sure: 0.35 });
    c.halka('kapanis-halka', tK, cx, hz, PEMBE, { alfa: 0.8, boyut: m * 0.2, son: m * 2.4, sure: 1.0 });
    Z.kapanis({ renk: '#ffffff', t0: tK + 0.1, upper: true, golge: true, soruKutu: '#ffe600', soruRenk: '#10001f', ctaRenk: CYAN });
    for (let j = 0; j < 12; j += 2) vuruslar.push(c.vurus(Math.round(tK / p) + j));

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3), { zoom: 0.035, egim: 0.5 });
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.3, i: i + 1 })), { t: tK + 0.4, i: n + 1 }], { aci: 180, vinyet: 0.34, sure: 0.8 }),
      camera: cam,
    });
  },
};
