// Zaman tüneli · DERGİ: editoryal, premium. Krem sayfa + canlı renk bloğu. Her dönem yeni bir "sayfa": renk, alttan süpürerek ekranı doldurur
// ve üst yarıya çekilir; bloğun içinde devasa (kenarlardan taşan) serif yıl, bloğun alt kenarında duran nesne; sayfada yıl, ad, ince çizgi,
// tireli bilgi satırları ve dipnot. Kapak: dergi kapağı; kapanış: koyu "son sayfa". Sade, şık, "kinetik tipografi".
// Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { parlaklik } from './reels.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-dergi',
  ad: 'Zaman tüneli · Dergi',
  etiket: 'Hikâye · Editoryal · Şık · Tipografik',
  sure: '35–80 sn',
  aciklama: 'Editoryal dergi sayfaları: canlı renk bloğu alttan süpürerek gelir, içinde devasa serif yıl ve kenarda duran nesne; krem sayfada yıl, ad, ince çizgi, tireli bilgi satırları ve dipnot. Sade, şık, kinetik tipografi.',
  ornek: {
    sablon: 'zaman-dergi', id: 'sablon-zaman-dergi', ad: 'Fırının Hikâyesi', format: 'reels', palet: 'dergi', muzik: 'pop-120', font: 'Abril Fatface', stil: 'duz',
    kanca: 'ÖZEL SAYI', baslik: 'Fırının Hikâyesi', altBaslik: 'ateşten akıllı mutfağa', kapakNesne: 'acik-ates',
    bolumler: [
      { yil: 'Tarih öncesi', ad: 'Açık ateş', nesne: 'acik-ates', balon: 'Sıcak!', bilgi: ['İlk pişirme doğrudan ateşte', 'Taşlar ve közler ısıyı tutar'], notlar: ['ateş'], anlatim: 'Tarih öncesinde yemek doğrudan ateşte pişirilirdi. Taşlar ve közler ısıyı tutuyordu.' },
      { yil: 'Binlerce yıl önce', ad: 'Kil fırın', nesne: 'kil-kubbe-firin', balon: 'Ekmek!', bilgi: ['Kil kubbe ısıyı hapseder', 'Ekmek böyle pişer'], notlar: ['kubbe'], anlatim: 'Binlerce yıl önce kil kubbe fırınlar ısıyı hapsederek ekmek gibi yiyecekleri eşit pişirmeye başladı.' },
      { yil: '1800\'ler', ad: 'Gazlı fırın', nesne: 'gazli-firin', balon: 'Gaz!', bilgi: ['Gaz alevi evlere girer', 'Isıyı ayarlamak kolaylaşır'], notlar: ['gaz'], anlatim: 'Bin sekiz yüzlerde gazlı fırınlar yaygınlaştı ve ısıyı ayarlamak çok kolaylaştı.' },
      { yil: '1945', ad: 'Mikrodalga', nesne: 'mikrodalga', balon: 'Bip!', bilgi: ['Radar mühendisi tesadüfen keşfeder', 'Yiyecek içten ısınır'], notlar: ['mikrodalga'], anlatim: 'Bin dokuz yüz kırk beşte bir radar mühendisi mikrodalga ile yiyeceğin ısındığını tesadüfen fark etti.' },
      { yil: 'Bugün', ad: 'Akıllı fırın', nesne: 'akilli-firin', balon: 'Merhaba!', bilgi: ['Telefonla önceden ısıtılır', 'Tarifi kendisi izler'], notlar: ['uygulama'], anlatim: 'Bugün akıllı fırınlar telefondan kontrol ediliyor ve tarifi kendileri izliyor.' },
    ],
    soru: 'Sıradaki mutfak icadı?', cta: 'Yorumlara yaz!', son1: 'Yemeğin', son2: 'hikâyesi!',
    yayin: { baslik: 'Fırının hikâyesi: ateşten akıllı mutfağa', aciklama: 'Açık ateşten akıllı fırına, yemek pişirmenin tarihi. Sence sıradaki mutfak icadı ne olacak?', etiketler: ['firin', 'mutfak', 'tarih', 'teknoloji', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-dergi', { palet: 'dergi', muzik: 'pop-120', font: 'Abril Fatface', stil: 'duz' }, { kapSure: 12, minSn: 5.8 });
    const { c, W, H, k, m, p, n, planlar, yazi, tK, tEnd, tKapak } = Z;
    const SERIF = 'Playfair Display';
    const KITAP = 'Lora';
    const MONO = 'Space Mono';
    const KREM = '#f4efe6';
    const INK = '#16161a';
    const blok = (i) => c.zemin(i); // i. blok rengi (palet bg)
    const BLOK_H = H * 0.5;
    const vuruslar = [];
    const mx = 70;
    const GENIS = W - mx * 2;

    // ── kapak: tam ekran renk + dev başlık ────────────────────────────────
    const gK = c.grup('g-acilis', 'Açılış', true);
    c.sekil('kapak-blok', 'kare', W / 2, H / 2, 200, { t0: 0, t1: tKapak + 0.05, renk: blok(0), giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: gK });
    c.sekil('kapak-ust-cizgi', 'kare', W / 2, H * 0.12, 200, { t0: 0.2, t1: tKapak, renk: '#ffffff', opacity: 0.8, giris: 'yok', grup: gK, sx: [k(0.2, 0), k(0.9, GENIS / 200, 'outCubic')], sy: 3 / 200 });
    yazi('kapak-sayi', 'SAYI 01  ·  ÖZEL', 0.2, tKapak, { grup: gK, x: mx, y: H * 0.095, size: 30, sabit: true, align: 'left', font: MONO, renk: '#ffffff', weight: 700, harf: 5, reveal: [0.05, 0.8] });
    c.sekil('kapak-daire', 'daire', W / 2, H * 0.8, m * 1.15, { t0: 0.3, t1: tKapak, renk: '#ffffff', opacity: 0.14, grup: gK, sure: 0.8 });
    c.sekil('kapak-halka', 'halka', W / 2, H * 0.8, m * 1.5, { t0: 0.5, t1: tKapak, renk: '#ffffff', opacity: 0.3, grup: gK, sure: 0.8 });
    Z.kapak({ renk: '#ffffff', kancaRenk: '#ffffff', altRenk: INK, altKutu: KREM, yK: 0.17, yB: 0.3, yA: 0.465, yN: 0.88, nesnePx: 0.46, weight: 400, suslemeTipi: 'yok', kancaSize: 44, baslikSize: 210, sar: 10, lh: 0.95, upper: false, kancaUpper: true });

    // ── dönemler ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const bg = blok(st);
      const onYazi = parlaklik(bg) > 150 ? INK : '#ffffff';
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      for (let j = 0; j < pl.beats; j += 2) vuruslar.push(c.vurus(pl.b0 + j));
      const tA = t0 + 0.6;
      const son = t1 + 0.02;

      // süpürme (alttan) → blok üst yarıya çekilir
      c.L({
        id: `supur-${st}`, group: g, asset: 'kare', x: W / 2, y: H * 1.02, anchor: [0.5, 1], scale: 1, scaleX: (W * 1.2) / 200, scaleY: [k(t0 - 0.55, 0), k(t0, (H * 1.1) / 200, 'inOutCubic')],
        palette: { a: bg }, start: R2(t0 - 0.55), end: R2(t0 + 0.02),
      });
      c.L({
        id: `blok-${st}`, group: g, asset: 'kare', x: W / 2, y: -H * 0.02, anchor: [0.5, 0], scale: 1, scaleX: (W * 1.2) / 200,
        scaleY: [k(t0, (H * 1.1) / 200), k(t0 + 0.75, (BLOK_H + H * 0.02) / 200, 'inOutCubic')], palette: { a: bg }, start: R2(t0), end: R2(son),
      });

      // blok içi: dev silik yıl (taşar), üst bilgi çizgisi
      const yilM = s.yil || String(st);
      const dev = yilM.length > 5 ? 340 : 600;
      yazi(`yil-dev-${st}`, yilM, t0 + 0.4, son, {
        grup: g, y: H * 0.225, size: dev, sabit: true, renk: onYazi, opacity: 0.17, weight: 400, font: Z.font,
        anims: [{ preset: 'zipla-gir', t: R2(t0 + 0.45), dur: 0.8 }],
      });
      yazi(`sira-${st}`, `Nº ${String(st).padStart(2, '0')}`, tA, son, { grup: g, x: mx, y: H * 0.095, size: 30, sabit: true, align: 'left', font: MONO, renk: onYazi, weight: 700, harf: 5, reveal: [0.05, 0.6] });
      yazi(`sira-sag-${st}`, `${String(st).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, tA, son, { grup: g, x: W - mx, y: H * 0.095, size: 30, sabit: true, align: 'right', font: MONO, renk: onYazi, weight: 700, harf: 5, reveal: [0.05, 0.6] });
      c.sekil(`ust-cizgi-${st}`, 'kare', W / 2, H * 0.12, 200, { t0: tA, t1: son, renk: onYazi, opacity: 0.8, giris: 'yok', grup: g, sx: [k(tA, 0), k(tA + 0.6, GENIS / 200, 'outCubic')], sy: 3 / 200 });

      // nesne: bloğun alt kenarında durur (hafif taşar)
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const oy = BLOK_H + 16;
      c.sekil(`golge-${st}`, 'daire', W / 2, oy + 6, m * 0.5, { t0: tA + 0.15, t1: son, renk: '#000000', opacity: 0.2, sx: 1, sy: 0.12, grup: g, sure: 0.5 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: W / 2, y: Math.round(oy), anchor: [0.5, 1], scale: R2((m * 0.46) / Math.max(aw, ah)), start: R2(tA + 0.1), end: R2(son),
        anims: [{ preset: 'zipla-gir', t: R2(tA + 0.1), dur: 0.7 }, { preset: 'suzul', t: R2(tA + 1.1), genlik: 9, periyot: 3.4 }],
      });
      if (s.balon) c.damga(`balon-${st}`, s.balon, tA + 1.3, son, W * 0.82, BLOK_H * 0.86, m * 0.3, { grup: g, zemin: KREM, renk: INK, rot: 9, font: SERIF, sar: 9 });

      // sayfa: yıl + ad + çizgi + bilgi + dipnot
      yazi(`yil-${st}`, yilM, tA, son, {
        grup: g, x: mx, y: H * 0.595, size: dev > 400 ? 190 : 120, maxW: GENIS, align: 'left', renk: INK, weight: 400, font: Z.font, reveal: [0.05, 0.55],
        anims: [{ preset: 'kayarak-gir', t: R2(tA), dur: 0.5 }],
      });
      yazi(`ad-${st}`, s.ad, tA + 0.35, son, { grup: g, x: mx, y: H * 0.665, size: 46, sabit: true, align: 'left', font: 'Outfit', renk: bg, weight: 700, upper: true, harf: 7, reveal: [0.05, 0.6] });
      c.sekil(`cizgi-${st}`, 'kare', mx + GENIS / 2, H * 0.693, 200, { t0: tA + 0.55, t1: son, renk: INK, giris: 'yok', grup: g, sx: [k(tA + 0.55, 0), k(tA + 1.2, GENIS / 200, 'outCubic')], sy: 3 / 200, extra: { anchor: [0.5, 0.5] } });
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, `—  ${ln}`, tA + 1.1 + j * 1.05, son, {
          grup: g, x: mx, y: H * (0.738 + j * 0.065), size: 56, maxW: GENIS, sar: 34, align: 'left', font: KITAP, renk: INK, weight: 500, lh: 1.08, reveal: [0.05, 0.95],
        });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        yazi(`not-${st}${'ab'[j]}`, `※ ${nt}`, tA + 2.4 + j * 0.4, son, { grup: g, x: mx + j * 360, y: H * 0.85, size: 34, sabit: true, align: 'left', font: MONO, renk: bg, weight: 700, harf: 2, reveal: [0.05, 0.6] });
      });
      Z.ses(pl, tA);
    });

    // ── son sayfa (koyu) ──────────────────────────────────────────────────
    c.L({
      id: 'supur-son', asset: 'kare', x: W / 2, y: H * 1.02, anchor: [0.5, 1], scale: 1, scaleX: (W * 1.2) / 200, scaleY: [k(tK - 0.55, 0), k(tK, (H * 1.1) / 200, 'inOutCubic')], palette: { a: INK }, start: R2(tK - 0.55), end: R2(tK + 0.02),
    });
    c.sekil('son-blok', 'kare', W / 2, H / 2, 200, { t0: tK, renk: INK, giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200 });
    Z.kapanis({ renk: '#ffffff', t0: tK + 0.5, soruKutu: blok(n), soruRenk: '#ffffff', ctaRenk: '#cfc6b8' });
    vuruslar.push(tK + 0.5);

    // ilerleme çizgisi (en üst katman)
    const gP = c.grup('g-ilerleme', 'İlerleme', true);
    c.sekil('ilerleme-iz', 'kare', W / 2, H * 0.965, 200, { t0: tKapak, t1: tK, renk: INK, opacity: 0.12, giris: 'yok', grup: gP, sx: GENIS / 200, sy: 6 / 200 });
    c.L({ id: 'ilerleme', group: gP, asset: 'kare', x: mx, y: H * 0.965, anchor: [0, 0.5], scale: 1, scaleX: [k(tKapak, 0), k(tK, GENIS / 200, 'linear')], scaleY: 6 / 200, palette: { a: INK }, start: R2(tKapak), end: R2(tK) });

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3.4), { zoom: 0.014, egim: 0 });
    cam.zoom = [k(0, 1.1), k(2.8, 1, 'inOutCubic'), ...cam.zoom.filter((z) => z.t > 3)];
    return Z.bitir(brief.ad, {
      background: { type: 'linear', colors: [KREM, '#ece5d6'], angle: 180, paper: 0.4, vignette: 0.1 },
      camera: cam,
    });
  },
};
