// Zaman tüneli · 8-BİT OYUN: arcade / platform oyunu estetiği (piksel stili). Açılış: oyun başlık ekranı + yanıp sönen "BAŞLAMAK İÇİN BAS".
// Her dönem bir BÖLÜM (DÜNYA 1-n): piksel geçişle yeni seviye, üstte HUD (skor sayarak artar, dünya, kalpler), "?" bloğuna vurulur →
// altın çıkar, nesne bloktan fırlayıp büyür; devasa kontürlü yıl; alt kısımda NES konuşma kutusunda bilgi satırları yazılır.
// Sonda "YÜKSEK SKOR" ve havai fişek. Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-piksel',
  ad: 'Zaman tüneli · 8-bit oyun',
  etiket: 'Hikâye · Oyun · Piksel · Eğlenceli',
  sure: '35–80 sn',
  aciklama: 'Platform oyunu estetiği: başlık ekranı, piksel geçişli bölümler (DÜNYA 1-n), HUD ve sayarak artan skor, "?" bloğuna vurunca altın ve nesne fırlar, NES konuşma kutusunda yazılan bilgiler, yüksek skor ve havai fişek. Piksel stili.',
  ornek: {
    sablon: 'zaman-piksel', id: 'sablon-zaman-piksel', ad: 'Fırın Macerası', format: 'reels', palet: 'oyun', muzik: 'hype-132', font: 'Bungee', stil: 'piksel',
    kanca: 'YENİ OYUN', baslik: 'Fırın Macerası', altBaslik: 'ateşten akıllı mutfağa', kapakNesne: 'acik-ates',
    bolumler: [
      { yil: 'Tarih öncesi', ad: 'Açık ateş', nesne: 'acik-ates', balon: 'Sıcak!', bilgi: ['İlk pişirme doğrudan ateşte', 'Taşlar ve közler ısıyı tutar'], notlar: ['ateş'], anlatim: 'Tarih öncesinde yemek doğrudan ateşte pişirilirdi. Taşlar ve közler ısıyı tutuyordu.' },
      { yil: 'Eski çağ', ad: 'Kil fırın', nesne: 'kil-kubbe-firin', balon: 'Ekmek!', bilgi: ['Kil kubbe ısıyı hapseder', 'Ekmek böyle pişer'], notlar: ['kubbe'], anlatim: 'Eski çağda kil kubbe fırınlar ısıyı hapsederek ekmek gibi yiyecekleri eşit pişirmeye başladı.' },
      { yil: '1800\'ler', ad: 'Gazlı fırın', nesne: 'gazli-firin', balon: 'Gaz!', bilgi: ['Gaz alevi evlere girer', 'Isıyı ayarlamak kolaylaşır'], notlar: ['gaz'], anlatim: 'Bin sekiz yüzlerde gazlı fırınlar yaygınlaştı ve ısıyı ayarlamak çok kolaylaştı.' },
      { yil: '1945', ad: 'Mikrodalga', nesne: 'mikrodalga', balon: 'Bip!', bilgi: ['Radar mühendisi tesadüfen keşfeder', 'Yiyecek içten ısınır'], notlar: ['mikrodalga'], anlatim: 'Bin dokuz yüz kırk beşte bir radar mühendisi mikrodalga ile yiyeceğin ısındığını tesadüfen fark etti.' },
      { yil: 'Bugün', ad: 'Akıllı fırın', nesne: 'akilli-firin', balon: 'Merhaba!', bilgi: ['Telefonla önceden ısıtılır', 'Tarifi kendisi izler'], notlar: ['uygulama'], anlatim: 'Bugün akıllı fırınlar telefondan kontrol ediliyor ve tarifi kendileri izliyor.' },
    ],
    soru: 'Sonraki bölüm ne?', cta: 'Yorumlara yaz!', son1: 'Oyun', son2: 'devam ediyor!',
    yayin: { baslik: 'Fırın macerası: ateşten akıllı mutfağa (8-bit)', aciklama: 'Açık ateşten akıllı fırına, 8-bit bir oyun gibi yolculuk. Sence sonraki bölüm ne?', etiketler: ['firin', 'mutfak', 'oyun', 'retro', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-piksel', { palet: 'oyun', muzik: 'hype-132', font: 'Bungee', stil: 'piksel' }, { kapakBeats: 8, kapSure: 14, minSn: 6.0 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const MONO = 'JetBrains Mono';
    const SARI = '#fcfc00';
    const KIRMIZI = '#e40058';
    const vuruslar = [];
    const zy = H * 0.775; // zemin üst kenarı
    const SIYAH = { color: '#000000', width: 12 };

    // ── kalıcı sahne: bulutlar, tepeler, zemin ────────────────────────────
    const gA = c.grup('g-oyun', 'Oyun dünyası', true);
    /** Piksel bulut: üç sıra dikdörtgen */
    const bulut = (id, x, y, f, t0 = 0) => {
      const u = 46 * f;
      [[0, 0, 3, 1], [-1, 1, 5, 1], [-0.5, 2, 4, 1]].forEach(([dx, dy, gn], q) => {
        c.sekil(`${id}-${q}`, 'kare', x + dx * u + (gn * u) / 2 - (3 * u) / 2, y + dy * u, 200, { t0, renk: '#fcfcfc', opacity: 0.92, giris: 'yok', grup: gA, sx: (gn * u) / 200, sy: u / 200 });
      });
    };
    bulut('bulut-1', W * 0.24, H * 0.27, 1.1);
    bulut('bulut-2', W * 0.74, H * 0.4, 0.9);
    bulut('bulut-3', W * 0.5, H * 0.14, 0.7);
    // tepe (basamaklı yeşil)
    [[0.14, 0.78, 5], [0.9, 0.78, 6]].forEach(([fx, fy, gn], i) => {
      for (let q = 0; q < 3; q++) {
        const w = (gn - q * 1.6) * 60;
        c.sekil(`tepe-${i}-${q}`, 'kare', W * fx, H * fy - q * 58 - 29, 200, { t0: 0, renk: '#00a800', giris: 'yok', grup: gA, sx: w / 200, sy: 58 / 200, opacity: 0.9 });
      }
    });
    // zemin: çim şeridi + tuğla
    c.sekil('zemin', 'kare', W / 2, zy + (H - zy) / 2, 200, { t0: 0, renk: '#c84c0c', giris: 'yok', sx: (W * 1.1) / 200, sy: (H - zy) / 200, grup: gA });
    c.sekil('cim', 'kare', W / 2, zy + 14, 200, { t0: 0, renk: '#00a800', giris: 'yok', sx: (W * 1.1) / 200, sy: 28 / 200, grup: gA });
    c.sekil('cim-gol', 'kare', W / 2, zy + 34, 200, { t0: 0, renk: '#005800', giris: 'yok', sx: (W * 1.1) / 200, sy: 8 / 200, grup: gA });
    for (let q = 0; q <= 11; q++) c.sekil(`tugla-d-${q}`, 'kare', q * 90 + (0), zy + 100, 200, { t0: 0, renk: '#7c2a00', giris: 'yok', sx: 5 / 200, sy: (H - zy - 40) / 200, grup: gA, opacity: 0.55 });
    for (let q = 0; q < 5; q++) c.sekil(`tugla-y-${q}`, 'kare', W / 2, zy + 90 + q * 92, 200, { t0: 0, renk: '#7c2a00', giris: 'yok', sx: (W * 1.1) / 200, sy: 5 / 200, grup: gA, opacity: 0.55 });

    /** Piksel metin: siyah kontürlü */
    const pt = (id, text, t0, t1, o) => yazi(id, text, t0, t1, { weight: 400, stroke: SIYAH, ...o });

    // ── açılış: başlık ekranı ─────────────────────────────────────────────
    const gK = c.grup('g-acilis', 'Başlık ekranı', true);
    c.bolum(0, 'Açılış');
    pt('kapak-kanca', brief.kanca || 'YENİ OYUN', 0.1, tKapak, { grup: gK, y: H * 0.15, size: 60, maxW: W * 0.8, renk: SARI, upper: true, harf: 6, reveal: [0.05, 0.7], stroke: { color: '#000000', width: 8 } });
    pt('baslik', brief.baslik || brief.ad, 0.4, tKapak, { grup: gK, y: H * 0.29, size: 170, sar: 10, renk: '#ffffff', upper: true, lh: 0.95, reveal: [0.05, 1.2], anims: [{ preset: 'nefes', t: 2, genlik: 0.015, periyot: p * 4 }] });
    if (brief.altBaslik) pt('alt-baslik', brief.altBaslik, 1.5, tKapak, { grup: gK, y: H * 0.46, size: 52, maxW: W * 0.82, font: MONO, renk: '#ffffff', upper: true, harf: 3, weight: 700, reveal: [0.05, 0.8], stroke: { color: '#000000', width: 8 } });
    if (brief.kapakNesne) {
      const asset = nesneSec(brief.kapakNesne);
      const [aw, ah] = varlikBoyut(asset);
      c.L({ id: 'kapak-nesne', group: gK, asset, x: W / 2, y: Math.round(zy - 10), anchor: [0.5, 1], scale: R2((m * 0.34) / Math.max(aw, ah)), start: 0.3, end: R2(tKapak), anims: [{ preset: 'zipla-gir', t: 0.3, dur: 0.6 }, { preset: 'seksek', t: 1.2, yukseklik: 36, periyot: p * 2 }] });
    }
    // yanıp sönen "BAŞLAMAK İÇİN BAS"
    const blink = [];
    for (let t = 0; t < tKapak; t += 0.5) blink.push(k(t, Math.round(t / 0.5) % 2 ? 0 : 1, 'step'));
    c.L({ id: 'bas', group: gK, type: 'text', text: 'BAŞLAMAK İÇİN BAS', font: MONO, weight: 800, color: '#ffffff', x: W / 2, y: H * 0.6, size: 46, align: 'center', stroke: { color: '#000000', width: 8 }, start: 1.6, end: R2(tKapak), opacity: blink });
    pt('kapak-tel', '© 2026   1 OYUNCU', 0.6, tKapak, { grup: gK, y: H * 0.68, size: 30, sabit: true, font: MONO, renk: '#ffffff', weight: 700, stroke: { color: '#000000', width: 6 }, harf: 4 });

    // ── bölümler (seviyeler) ──────────────────────────────────────────────
    let oncekiSkor = 0;
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      c.gecis('pikselle', t0, 0.7, null);
      for (let j = 0; j < pl.beats; j += 2) vuruslar.push(c.vurus(pl.b0 + j));
      const tA = t0 + 0.55;
      const yilM = s.yil || String(st);

      // HUD
      pt(`hud-sk-${st}`, 'SKOR', t0, t1, { grup: g, x: 60, y: H * 0.05, size: 30, sabit: true, align: 'left', font: MONO, renk: '#ffffff', weight: 800, stroke: { color: '#000000', width: 6 } });
      const skor = st * 1000 + (st % 3) * 250;
      c.sayac(`hud-skor-${st}`, oncekiSkor, skor, tA, 1.2, { x: 60, y: H * 0.075, size: 44, maxW: 300, font: MONO, weight: 800, renk: SARI, grup: g, t1, sep: '', stroke: { color: '#000000', width: 6 } });
      const sk = c.layers[c.layers.length - 1];
      sk.align = 'left';
      oncekiSkor = skor;
      pt(`hud-dn-${st}`, 'DÜNYA', t0, t1, { grup: g, x: W * 0.62, y: H * 0.05, size: 30, sabit: true, align: 'left', font: MONO, renk: '#ffffff', weight: 800, stroke: { color: '#000000', width: 6 } });
      pt(`hud-dn2-${st}`, `1-${st}`, tA, t1, { grup: g, x: W * 0.62, y: H * 0.075, size: 44, sabit: true, align: 'left', font: MONO, renk: SARI, weight: 800, stroke: { color: '#000000', width: 6 } });
      for (let q = 0; q < 3; q++) c.sekil(`kalp-${st}-${q}`, 'kalp', W - 70 - q * 62, H * 0.065, 46, { t0: tA + 0.1 * q, t1, renk: KIRMIZI, grup: g, sure: 0.3 });

      // yıl + ad
      pt(`yil-${st}`, yilM, tA, t1, { grup: g, y: H * 0.2, size: yilM.length > 8 ? 110 : 190, maxW: W * 0.92, renk: SARI, upper: true, reveal: [0.05, 0.5], anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.4 }], stroke: { color: '#000000', width: 14 } });
      pt(`ad-${st}`, s.ad, tA + 0.3, t1, { grup: g, y: H * 0.285, size: 58, maxW: W * 0.88, font: MONO, renk: '#ffffff', upper: true, weight: 800, harf: 3, reveal: [0.05, 0.6], stroke: { color: '#000000', width: 8 } });

      // "?" bloğu + altın + nesne
      const bx = W / 2;
      const by = H * 0.6;
      const tH = tA + 0.9; // vuruş anı
      c.sekil(`blok-${st}`, 'kare', bx, by, 150, { t0: tA, t1: tH, renk: '#e49a2c', giris: 'yok', grup: g, extra: { y: [k(tA, by + 400), k(tA + 0.5, by, 'outBack')] } });
      yazi(`blok-q-${st}`, '?', tA + 0.4, tH, { grup: g, x: bx, y: by, size: 110, sabit: true, font: MONO, renk: '#ffffff', weight: 800, stroke: { color: '#7c2a00', width: 6 } });
      c.sekil(`blok2-${st}`, 'kare', bx, by, 150, { t0: tH, t1, renk: '#8a5a2a', giris: 'yok', grup: g, extra: { y: [k(tH, by), k(tH + 0.1, by - 26, 'outQuad'), k(tH + 0.22, by, 'inQuad')] } });
      c.sekil(`blok2-k-${st}`, 'kare', bx, by, 100, { t0: tH, t1, renk: '#5a3a1a', giris: 'yok', grup: g, extra: { y: [k(tH, by), k(tH + 0.1, by - 26, 'outQuad'), k(tH + 0.22, by, 'inQuad')] } });
      // altın
      c.sekil(`altin-${st}`, 'daire', bx, by - 80, 70, { t0: tH, t1: tH + 0.7, renk: SARI, giris: 'yok', grup: g, extra: { scaleX: [k(tH, 0.34), k(tH + 0.14, 0.05, 'linear'), k(tH + 0.28, 0.34, 'linear'), k(tH + 0.42, 0.05, 'linear'), k(tH + 0.56, 0.34, 'linear')], y: [k(tH, by - 60), k(tH + 0.3, by - 330, 'outQuad'), k(tH + 0.7, by - 200, 'inQuad')], opacity: [k(tH, 1), k(tH + 0.55, 1, 'linear'), k(tH + 0.7, 0, 'linear')] } });
      vuruslar.push(tH);
      // nesne bloktan fırlar
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const sc1 = (m * 0.4) / Math.max(aw, ah);
      const ty = by - 110;
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: bx, anchor: [0.5, 1], start: R2(tH + 0.05), end: R2(t1),
        y: [k(tH + 0.05, by - 60), k(tH + 0.7, ty, 'outBack')], scale: [k(tH + 0.05, R2(sc1 * 0.15)), k(tH + 0.7, R2(sc1), 'outBack')],
        anims: [{ preset: 'seksek', t: R2(tH + 1.0), yukseklik: 20, periyot: p * 2 }],
      });
      c.sekil(`kivilcim-${st}`, 'yildiz', bx + m * 0.26, ty - m * 0.3, 44, { t0: tH + 0.6, t1, renk: SARI, grup: g, sure: 0.3, anims: [{ preset: 'nabiz', t: R2(tH + 0.9), genlik: 0.3, periyot: p }] });
      if (s.balon) {
        pt(`balon-${st}`, s.balon, tH + 0.9, t1, { grup: g, x: W * 0.8, y: by - 250, size: 46, maxW: W * 0.3, sar: 9, font: MONO, renk: '#000000', weight: 800, kutu: '#ffffff', radius: 0, pad: [10, 20], stroke: undefined, rot: 4, anims: [{ preset: 'zipla-gir', t: R2(tH + 0.9), dur: 0.35 }] });
      }
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        pt(`not-${st}${'ab'[j]}`, `+${nt}`, tH + 1.6 + j * 0.4, t1, { grup: g, x: W * (j % 2 ? 0.82 : 0.18), y: by + 100, size: 30, sabit: true, font: MONO, renk: '#ffffff', weight: 800, upper: true, stroke: { color: '#000000', width: 6 }, anims: [{ preset: 'zipla-gir', t: R2(tH + 1.6 + j * 0.4), dur: 0.3 }] });
      });

      // NES konuşma kutusu
      const dy = H * 0.885;
      const dh = H * 0.15;
      c.sekil(`kutu-d-${st}`, 'kare', W / 2, dy, 200, { t0: tA + 0.8, t1, renk: '#ffffff', giris: 'yok', grup: g, sx: (W * 0.92) / 200, sy: dh / 200 });
      c.sekil(`kutu-i-${st}`, 'kare', W / 2, dy, 200, { t0: tA + 0.8, t1, renk: '#000000', giris: 'yok', grup: g, sx: (W * 0.92 - 16) / 200, sy: (dh - 16) / 200 });
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.3 + j * 1.05, t1, { grup: g, x: W * 0.07, y: dy - dh * 0.2 + j * dh * 0.42, size: 42, maxW: W * 0.86, align: 'left', font: MONO, renk: '#ffffff', weight: 700, reveal: [0.05, 0.9] });
      });
      yazi(`ok-${st}`, '▼', tA + 3.2, t1, { grup: g, x: W * 0.92, y: dy + dh * 0.32, size: 30, sabit: true, font: MONO, renk: '#ffffff', weight: 800, anims: [{ preset: 'seksek', t: R2(tA + 3.2), yukseklik: 8, periyot: p }] });
      Z.ses(pl, tH);
    });

    // ── kapanış: yüksek skor + havai fişek ────────────────────────────────
    const gS = c.grup('g-kapanis', 'Kapanış', true);
    c.gecis('pikselle', tK, 0.7, null);
    c.sekil('son-gece', 'kare', W / 2, H / 2, 200, { t0: tK, renk: '#0b0b3b', giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: gS });
    for (let q = 0; q < 28; q++) c.sekil(`son-yildiz-${q}`, 'kare', W * (((q * 0.618) % 1) * 0.94 + 0.03), H * (0.04 + ((q * 0.37) % 1) * 0.6), 200, { t0: tK, renk: '#ffffff', giris: 'yok', grup: gS, sx: 8 / 200, sy: 8 / 200, anims: [{ preset: 'nabiz', t: R2(tK), genlik: 0.4, periyot: 1 + (q % 4) * 0.4 }] });
    c.sekil('son-zemin', 'kare', W / 2, zy + (H - zy) / 2, 200, { t0: tK, renk: '#c84c0c', giris: 'yok', sx: (W * 1.1) / 200, sy: (H - zy) / 200, grup: gS });
    c.sekil('son-cim', 'kare', W / 2, zy + 14, 200, { t0: tK, renk: '#00a800', giris: 'yok', sx: (W * 1.1) / 200, sy: 28 / 200, grup: gS });
    pt('son-hs-e', 'YÜKSEK SKOR', tK + 0.4, null, { grup: gS, y: H * 0.83, size: 40, sabit: true, font: MONO, renk: '#ffffff', weight: 800, harf: 4, stroke: { color: '#000000', width: 6 } });
    c.sayac('son-hs', oncekiSkor, oncekiSkor * 4 + 4200, tK + 0.6, 2.4, { y: H * 0.89, size: 110, maxW: W * 0.8, font: MONO, weight: 800, renk: SARI, grup: gS, sep: '', stroke: { color: '#000000', width: 10 } });
    c.L({ id: 'son-havai', group: gS, type: 'particles', particle: 'konfeti', mode: 'patlama', x: Math.round(W * 0.3), y: Math.round(H * 0.3), start: R2(tK + 0.8), end: R2(tEnd) });
    c.L({ id: 'son-havai-2', group: gS, type: 'particles', particle: 'konfeti', mode: 'patlama', x: Math.round(W * 0.72), y: Math.round(H * 0.22), start: R2(tK + 1.8), end: R2(tEnd) });
    Z.kapanis({ renk: '#ffffff', t0: tK + 0.3, upper: true, soruKutu: SARI, soruRenk: '#000000', ctaRenk: SARI });
    vuruslar.push(tK + 0.4);

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3), { zoom: 0.025, egim: 0 });
    return Z.bitir(brief.ad, {
      background: c.arkaplan([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0, i: i + 1 })), { t: tK, i: 4 }], { aci: 180, vinyet: 0.05 }),
      camera: cam,
    });
  },
};
