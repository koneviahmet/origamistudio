// Zaman tüneli · SESSİZ SİNEMA: eski film karası, kenarlarında akan film perforasyonu, sepya ton → zamanla gerçek renge açılır.
// Açılış: "3-2-1" geri sayım halkası → süslü başlık kartı. Her dönem: iris açılışlı SESSİZ FİLM ARA KARTI (roma rakamlı bölüm, devasa serif yıl, ad),
// sonra "kare": nesne ışık havuzunda, alt yazı olarak bilgi satırları, alıntı balonu; ekranda çizik, toz, titreme. Kapanış: "SON" kartı.
// Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

const ROMA = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default {
  id: 'zaman-film',
  ad: 'Zaman tüneli · Sessiz sinema',
  etiket: 'Hikâye · Nostaljik · Film karası · Sinematik',
  sure: '40–90 sn',
  aciklama: 'Sessiz film estetiği: kenarda akan film perforasyonu, çizik ve toz, sepya tondan gerçek renge açılan zaman. Geri sayım, süslü başlık kartı, iris açılışlı roma rakamlı ara kartlar, alt yazı gibi akan bilgiler, "SON" kartı.',
  ornek: {
    sablon: 'zaman-film', id: 'sablon-zaman-film', ad: 'Telefonun Sessiz Filmi', format: 'reels', palet: 'sinema', muzik: 'lofi-90', font: 'DM Serif Display', stil: 'duz',
    kanca: 'Bir zaman yolculuğu', baslik: 'Telefonun Sessiz Filmi', altBaslik: 'altı perdede 150 yıl', kapakNesne: 'cevirmeli-telefon',
    bolumler: [
      { yil: '1876', ad: 'İlk telefon', nesne: 'cevirmeli-telefon', balon: 'Alo?', bilgi: ['Bell sesi tel üzerinden iletir', 'Konuşma ilk kez mesafeyi aşar'], notlar: ['patent'], anlatim: 'Bin sekiz yüz yetmiş altı. Bell, sesi tel üzerinden ileten telefonun patentini aldı.' },
      { yil: '1920\'ler', ad: 'Duvar telefonu', nesne: 'duvar-telefonu', balon: 'Ahize!', bilgi: ['Evlerin duvarına asılır', 'Santral operatörü bağlar'], anlatim: 'Bin dokuz yüz yirmilerde telefonlar evlerin duvarına asıldı ve görüşmeleri operatörler bağladı.' },
      { yil: '1963', ad: 'Tuşlu telefon', nesne: 'tuslu-telefon', balon: 'Tık tık!', bilgi: ['Çevirmek yerine tuşa basılır', 'Numara daha hızlı girilir'], anlatim: 'Bin dokuz yüz altmış üç. Tuşlu telefonlar çevirmenin yerini aldı.' },
      { yil: '1983', ad: 'Tuğla telefon', nesne: 'tugla-telefon', balon: 'Taşınır!', bilgi: ['İlk ticari cep telefonu', 'Ağır ama özgürlük verir'], notlar: ['antenli'], anlatim: 'Bin dokuz yüz seksen üç. İlk ticari cep telefonu tuğla gibi ağırdı ama özgürlük verdi.' },
      { yil: '2007', ad: 'Akıllı telefon', nesne: 'akilli-telefon', balon: 'Dokun!', bilgi: ['Dokunmatik ekran ve uygulamalar', 'Cebimizde bir bilgisayar'], notlar: ['ekran'], anlatim: 'İki bin yedi. Akıllı telefonlar dokunmatik ekranı ve uygulamaları getirdi.' },
    ],
    soru: 'Bir sonraki perde?', cta: 'Tahminini yaz!', son1: 'Film', son2: 'sürüyor!',
    yayin: { baslik: 'Telefonun sessiz filmi: altı perdede 150 yıl', aciklama: 'Çevirmeli telefondan akıllı telefona nostaljik bir sessiz film. Sence bir sonraki perde ne?', etiketler: ['telefon', 'teknoloji', 'tarih', 'nostalji', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-film', { palet: 'sinema', muzik: 'lofi-90', font: 'DM Serif Display', stil: 'duz' }, { kapakBeats: 10, kapSure: 12, minSn: 6.8 });
    const { c, W, H, k, m, p, n, planlar, yazi, tK, tEnd, tKapak } = Z;
    const KOYU = '#0b0906';
    const KREM = '#efe3c8';
    const INK = '#2a2118';
    const LORA = 'Lora';
    const zi = (i) => Math.round((i / (n + 1)) * (c.pal.bg.length - 1));
    const vuruslar = [];
    const IKI = 1.9; // ara kart süresi
    const rnd = (i, a = 1) => ((Math.sin(i * 12.9898 + a * 78.233) * 43758.5453) % 1 + 1) % 1;

    /** Süslü çift çerçeve (kart kenarı) */
    const cerceve = (g, t0, t1, renk = KREM) => {
      const ince = (id, x1, y1, x2, y2, kal, al) => c.L({
        id, group: g, asset: 'kare', x: (x1 + x2) / 2, y: (y1 + y2) / 2, scale: 1, scaleX: Math.max(2, x2 - x1) / 200, scaleY: Math.max(2, y2 - y1) / 200, palette: { a: renk }, opacity: al, start: R2(t0), end: R2(t1),
      });
      [[70, 5, 0.9], [96, 2, 0.6]].forEach(([d, kal, al], q) => {
        const t = `${g}-${q}`;
        ince(`${t}-u`, d, d, W - d, d + kal, kal, al); ince(`${t}-a`, d, H - d - kal, W - d, H - d, kal, al);
        ince(`${t}-l`, d, d, d + kal, H - d, kal, al); ince(`${t}-r`, W - d - kal, d, W - d, H - d, kal, al);
      });
    };

    // ── açılış: geri sayım + başlık kartı ─────────────────────────────────
    const gK = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    const tGS = 2.3; // geri sayım bitişi
    c.sekil('gs-zemin', 'kare', W / 2, H / 2, 200, { t0: 0, t1: tGS, renk: '#1a1611', giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: gK });
    c.sekil('gs-halka', 'halka', W / 2, H * 0.43, m * 0.72, { t0: 0, t1: tGS, renk: KREM, opacity: 0.85, giris: 'yok', grup: gK });
    c.sekil('gs-halka2', 'halka', W / 2, H * 0.43, m * 0.52, { t0: 0, t1: tGS, renk: KREM, opacity: 0.45, giris: 'yok', grup: gK });
    c.sekil('gs-yatay', 'kare', W / 2, H * 0.43, 200, { t0: 0, t1: tGS, renk: KREM, opacity: 0.6, giris: 'yok', grup: gK, sx: (W * 0.9) / 200, sy: 3 / 200 });
    c.sekil('gs-dikey', 'kare', W / 2, H * 0.43, 200, { t0: 0, t1: tGS, renk: KREM, opacity: 0.6, giris: 'yok', grup: gK, sx: 3 / 200, sy: (H * 0.6) / 200 });
    ['3', '2', '1'].forEach((sayi, q) => {
      yazi(`gs-${sayi}`, sayi, q * 0.7, Math.min(tGS, (q + 1) * 0.7 + (q === 2 ? 0.2 : 0)), { grup: gK, y: H * 0.43, size: 380, sabit: true, renk: KREM, weight: 400, anims: [{ preset: 'zipla-gir', t: R2(q * 0.7), dur: 0.25 }] });
    });
    c.gecis('iris', tGS, 0.9, KOYU);
    // başlık kartı
    c.sekil('kart-zemin', 'kare', W / 2, H / 2, 200, { t0: tGS, t1: tKapak, renk: KOYU, giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: gK });
    cerceve('g-acilis', tGS, tKapak);
    const tb = tGS + 0.4;
    yazi('kapak-ust', `— ${brief.kanca || 'Bir zaman yolculuğu'} —`, tb, tKapak, { grup: gK, y: H * 0.135, size: 46, maxW: W * 0.78, font: LORA, renk: KREM, weight: 500, upper: true, harf: 8, reveal: [0.05, 0.9] });
    yazi('baslik', brief.baslik || brief.ad, tb + 0.3, tKapak, { grup: gK, y: H * 0.315, size: 180, sar: 11, renk: KREM, weight: 400, lh: 1, reveal: [0.05, 1.4], anims: [{ preset: 'nefes', t: R2(tb + 2), genlik: 0.012, periyot: p * 4 }] });
    c.sekil('kapak-orn', 'elmas', W / 2, H * 0.505, 22, { t0: tb + 1.6, t1: tKapak, renk: KREM, grup: gK, sure: 0.4 });
    c.sekil('kapak-orn-y', 'kare', W / 2, H * 0.505, 200, { t0: tb + 1.6, t1: tKapak, renk: KREM, opacity: 0.6, giris: 'yok', grup: gK, sx: [k(tb + 1.6, 0), k(tb + 2.2, (W * 0.6) / 200, 'outCubic')], sy: 2 / 200 });
    if (brief.altBaslik) yazi('alt-baslik', brief.altBaslik, tb + 1.9, tKapak, { grup: gK, y: H * 0.56, size: 62, maxW: W * 0.76, font: LORA, renk: '#e8c07d', weight: 500, reveal: [0.05, 0.9] });
    if (brief.kapakNesne) {
      const asset = nesneSec(brief.kapakNesne);
      const [aw, ah] = varlikBoyut(asset);
      Z.isik('kapak-isik', W / 2, H * 0.74, m * 0.7, '#e8c07d', { t0: tb + 1.2, t1: tKapak, opacity: 0.35, blur: 60, grup: gK });
      c.L({ id: 'kapak-nesne', group: gK, asset, x: W / 2, y: Math.round(H * 0.82), anchor: [0.5, 1], scale: R2((m * 0.4) / Math.max(aw, ah)), start: R2(tb + 1.0), end: R2(tKapak), anims: [{ preset: 'zipla-gir', t: R2(tb + 1.0), dur: 0.7 }, { preset: 'suzul', t: R2(tb + 2), genlik: 8, periyot: 3.2 }] });
    }

    // ── dönemler: ara kart → kare ─────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0; // ara kart başlangıcı (iris kesme anı)
      const tI = t0 + IKI; // kare başlangıcı
      const t1 = pl.t1;
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      for (let j = 0; j < pl.beats; j += 4) vuruslar.push(c.vurus(pl.b0 + j));
      c.gecis('iris', t0, 0.9, KOYU);
      c.gecis('iris', tI, 0.8, KOYU);

      // — ara kart —
      const gI = c.grup(`g-ara-${st}`, `Ara kart ${st}`, true);
      c.sekil(`ara-zemin-${st}`, 'kare', W / 2, H / 2, 200, { t0, t1: tI, renk: KOYU, giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: gI });
      cerceve(`g-ara-${st}`, t0, tI);
      const yilM = s.yil || String(st);
      yazi(`ara-bolum-${st}`, `BÖLÜM ${ROMA[st] || st}`, t0 + 0.25, tI, { grup: gI, y: H * 0.26, size: 46, sabit: true, font: LORA, renk: '#e8c07d', weight: 500, harf: 12, reveal: [0.05, 0.6] });
      c.sekil(`ara-orn-${st}`, 'elmas', W / 2, H * 0.31, 20, { t0: t0 + 0.4, t1: tI, renk: '#e8c07d', grup: gI, sure: 0.3 });
      yazi(`ara-yil-${st}`, yilM, t0 + 0.3, tI, { grup: gI, y: H * 0.46, size: yilM.length > 7 ? 150 : 300, maxW: W * 0.8, sar: yilM.length > 12 ? 10 : undefined, renk: KREM, weight: 400, lh: 0.95, reveal: [0.05, 0.6] });
      c.sekil(`ara-cizgi-${st}`, 'kare', W / 2, H * 0.6, 200, { t0: t0 + 0.7, t1: tI, renk: KREM, opacity: 0.6, giris: 'yok', grup: gI, sx: [k(t0 + 0.7, 0), k(t0 + 1.2, (W * 0.5) / 200, 'outCubic')], sy: 2 / 200 });
      yazi(`ara-ad-${st}`, s.ad, t0 + 0.7, tI, { grup: gI, y: H * 0.655, size: 54, maxW: W * 0.76, font: LORA, renk: KREM, weight: 500, upper: true, harf: 6, reveal: [0.05, 0.7] });

      // — kare —
      const tA = tI + 0.3;
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const oy = H * 0.5;
      Z.isik(`havuz-${st}`, W / 2, oy - m * 0.2, m * 0.95, '#fff3d0', { t0: tI, t1, opacity: 0.5, blur: 55, grup: g });
      c.sekil(`oval-${st}`, 'daire', W / 2, oy - m * 0.2, m * 0.78, { t0: tI, t1, renk: '#2a2118', opacity: 0.12, grup: g, sx: 1, sy: 1.1, sure: 0.6 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: W / 2, y: Math.round(oy), anchor: [0.5, 1], scale: R2((m * 0.5) / Math.max(aw, ah)), start: R2(tI + 0.1), end: R2(t1),
        opacity: [k(tI + 0.1, 0), k(tI + 0.7, 1, 'linear')],
        anims: [{ preset: 'suzul', t: R2(tA + 1), genlik: 8, periyot: 3.6 }],
      });
      yazi(`yil-${st}`, yilM, tA, t1, { grup: g, x: 90, y: H * 0.115, size: yilM.length > 7 ? 110 : 170, maxW: W * 0.76, align: 'left', renk: INK, weight: 400, reveal: [0.05, 0.6] });
      yazi(`ad-${st}`, s.ad, tA + 0.3, t1, { grup: g, x: 92, y: H * 0.178, size: 42, sabit: true, align: 'left', font: LORA, renk: INK, weight: 500, upper: true, harf: 6, opacity: 0.85, reveal: [0.05, 0.7] });
      if (s.balon) {
        yazi(`balon-${st}`, `“${s.balon}”`, tA + 1.0, t1, {
          grup: g, x: W * 0.76, y: H * 0.3, size: 60, maxW: W * 0.34, sar: 10, kutu: KREM, kutuAlfa: 0.95, radius: 6, pad: [8, 22], rot: 3, renk: INK, font: Z.font, weight: 400,
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.0), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 1.6), aci: 2, periyot: 2 }],
        });
      }
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.2 + j * 1.1, t1, { grup: g, y: H * (0.755 + j * 0.06), size: 54, maxW: W * 0.9, sar: 34, font: 'Outfit', renk: '#ffffff', weight: 600, kutu: 'rgba(8,6,3,0.62)', kutuAlfa: 1, radius: 8, pad: [8, 22], reveal: [0.05, 0.9], lh: 1.08 });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        yazi(`not-${st}${'ab'[j]}`, `#${nt}`, tA + 2.4 + j * 0.4, t1, { grup: g, x: W * (j % 2 ? 0.8 : 0.22), y: H * 0.6, size: 36, sabit: true, font: LORA, renk: INK, weight: 700, kutu: '#e8c07d', kutuAlfa: 0.9, radius: 4, pad: [6, 16], rot: j % 2 ? 3 : -3, anims: [{ preset: 'zipla-gir', t: R2(tA + 2.4 + j * 0.4), dur: 0.4 }] });
      });
      Z.ses(pl, tI + 0.3);
    });

    // ── kapanış: SON kartı ────────────────────────────────────────────────
    const gS = c.grup('g-kapanis', 'Kapanış', true);
    c.gecis('iris', tK, 0.9, KOYU);
    c.sekil('son-zemin', 'kare', W / 2, H / 2, 200, { t0: tK, renk: KOYU, giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: gS });
    cerceve('g-kapanis', tK, tEnd);
    Z.kapanis({ renk: KREM, t0: tK + 0.4, soruKutu: '#e8c07d', soruRenk: INK, ctaRenk: '#e8c07d', golge: false });
    vuruslar.push(tK + 0.4);

    // ── üst katman: sepya örtü, perforasyon, çizik, titreme ───────────────
    const gF = c.grup('g-film', 'Film efektleri', true);
    c.L({ id: 'sepya', group: gF, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.2) / 200, scaleY: (H * 1.2) / 200, palette: { a: '#b0824a' }, opacity: [k(tKapak, 0.42), k(tK - 1, 0.0, 'linear')], start: R2(tKapak) , end: R2(tK) });
    c.L({ id: 'titreme', group: gF, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.2) / 200, scaleY: (H * 1.2) / 200, palette: { a: '#000000' }, opacity: 0.06, loops: [{ prop: 'opacity', type: 'noise', amp: 0.06, period: 0.1 }], start: 0 });
    c.L({ id: 'toz', group: gF, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: 0, end: R2(tEnd), count: 50, opacity: 0.5, prewarm: true });
    for (let i = 0; i < 34; i++) {
      const t = 0.5 + rnd(i, 9) * (tEnd - 1);
      c.L({ id: `cizik-${i}`, group: gF, asset: 'kare', x: Math.round(W * (0.1 + rnd(i, 3) * 0.8)), y: H / 2, scale: 1, scaleX: (1.5 + rnd(i, 4) * 2) / 200, scaleY: (H * (0.4 + rnd(i, 5) * 0.6)) / 200, palette: { a: '#ffffff' }, opacity: 0.28 + rnd(i, 6) * 0.2, start: R2(t), end: R2(t + 0.09 + rnd(i, 7) * 0.08) });
    }
    for (const sx of [0, 1]) {
      c.sekil(`serit-${sx}`, 'kare', sx ? W - 38 : 38, H / 2, 200, { t0: 0, renk: '#0b0906', opacity: 0.9, giris: 'yok', sx: 76 / 200, sy: (H * 1.2) / 200, grup: gF });
      for (let r = -1; r < 22; r++) {
        c.L({
          id: `delik-${sx}-${r + 1}`, group: gF, asset: 'kart-kare', x: sx ? W - 38 : 38, y: r * 96 + 30, scale: 40 / 400, palette: { a: '#efe3c8' }, opacity: 0.85, start: 0,
          loops: [{ prop: 'y', type: 'saw', amp: 96, period: 1.4 }],
        });
      }
    }
    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3.4), { zoom: 0.012, egim: 0.3 });
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + IKI, i: zi(i + 1) })), { t: tK, i: c.pal.bg.length - 1 }], { aci: 170, vinyet: 0.55, kagit: 0.5, sure: 0.8 }),
      camera: cam,
    });
  },
};
