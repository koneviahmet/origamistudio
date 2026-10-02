// Zaman tüneli · MAVİ PAFTA: mühendis çizim paftası. Mavi kareli zemin, beyaz ince çizgiler; her dönem yeni bir "pafta" (sayfa):
// nesne teknik çizim olarak kendini çizer, merkez çizgileri + açı halkası + ölçü çizgileri belirir, numaralı notlar, altta "NOTLAR" kutusunda
// numaralı bilgi satırları yazılır, sonda kırmızı "ONAYLANDI" damgası vurur. Pafta geçişi: parlak bir çizici çizgisi ekranı süpürür.
// Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-teknik',
  ad: 'Zaman tüneli · Mavi pafta',
  etiket: 'Hikâye · Teknik çizim · Mühendislik · Sade',
  sure: '35–80 sn',
  aciklama: 'Mühendis paftası: mavi kareli zeminde beyaz çizgiler. Nesne teknik çizim olarak çizilir, merkez çizgileri, açı halkası, ölçü çizgileri ve numaralı notlar belirir; "NOTLAR" kutusu yazılır ve "ONAYLANDI" damgası vurur. Çizici çizgisiyle paftalar arası geçiş.',
  ornek: {
    sablon: 'zaman-teknik', id: 'sablon-zaman-teknik', ad: 'Fırının Teknik Dosyası', format: 'reels', palet: 'pafta', muzik: 'lofi-90', font: 'Oswald', stil: 'teknik',
    kanca: 'TEKNİK DOSYA', baslik: 'Fırının Teknik Dosyası', altBaslik: 'ateşten akıllı mutfağa', kapakNesne: 'akilli-firin',
    bolumler: [
      { yil: 'Tarih öncesi', ad: 'Açık ateş', nesne: 'acik-ates', balon: 'Isı kaynağı', bilgi: ['Doğrudan ateşte pişirme', 'Taşlar ve közler ısıyı tutar'], notlar: ['ateş', 'taş'], anlatim: 'Tarih öncesinde yemek doğrudan ateşte pişirilirdi. Taşlar ve közler ısıyı tutuyordu.' },
      { yil: 'Binlerce yıl önce', ad: 'Kil fırın', nesne: 'kil-kubbe-firin', balon: 'Kapalı hacim', bilgi: ['Kil kubbe ısıyı hapseder', 'Ekmek eşit pişer'], notlar: ['kubbe'], anlatim: 'Binlerce yıl önce kil kubbe fırınlar ısıyı hapsederek ekmeği eşit pişirmeye başladı.' },
      { yil: '1800\'ler', ad: 'Gazlı fırın', nesne: 'gazli-firin', balon: 'Ayarlı alev', bilgi: ['Gaz alevi evlere girer', 'Isıyı ayarlamak kolaylaşır'], notlar: ['gaz'], anlatim: 'Bin sekiz yüzlerde gazlı fırınlar yaygınlaştı ve ısıyı ayarlamak çok kolaylaştı.' },
      { yil: '1890\'lar', ad: 'Elektrikli fırın', nesne: 'elektrikli-firin', balon: 'Sabit ısı', bilgi: ['Rezistans ısınır, duman yok', 'Sıcaklık sabit kalır'], notlar: ['rezistans'], anlatim: 'Bin sekiz yüz doksanlarda elektrikli fırınlar çıktı. Duman yoktu ve sıcaklık sabit kalıyordu.' },
      { yil: 'Bugün', ad: 'Akıllı fırın', nesne: 'akilli-firin', balon: 'Bağlantılı', bilgi: ['Telefonla önceden ısıtılır', 'Tarifi kendisi izler'], notlar: ['uygulama'], anlatim: 'Bugün akıllı fırınlar telefondan kontrol ediliyor ve tarifi kendileri izliyor.' },
    ],
    soru: 'Sıradaki revizyon ne?', cta: 'Tahminini yaz!', son1: 'Dosya', son2: 'onaylandı!',
    yayin: { baslik: 'Fırının teknik dosyası: ateşten akıllı mutfağa', aciklama: 'Açık ateşten akıllı fırına, mühendis paftası tadında bir yolculuk. Sence sıradaki revizyon ne olacak?', etiketler: ['firin', 'mutfak', 'teknoloji', 'tarih', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-teknik', { palet: 'pafta', muzik: 'lofi-90', font: 'Oswald', stil: 'teknik' }, { kapSure: 12, minSn: 6.0 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const MONO = 'Space Mono';
    const BEYAZ = '#ffffff';
    const CAM = '#9fd8ff';
    const SARI = '#ffd166';
    const KIRMIZI = '#ff7b72';
    const MX = 70;
    const GEN = W - MX * 2;
    const vuruslar = [];

    /** ince çizgi: (x1,y1)→(x2,y2), draw: [t0, sure] çizilir */
    const cizgi = (id, g, x1, y1, x2, y2, renk, kal, al, t0, t1, ciz) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      return c.L({
        id, ...(g ? { group: g } : {}), asset: 'kare', x: Math.round(x1), y: Math.round(y1), anchor: [0, 0.5], scale: 1,
        scaleX: ciz ? [k(ciz[0], 0), k(ciz[0] + ciz[1], len / 200, 'outCubic')] : len / 200, scaleY: kal / 200, rotation: Math.atan2(dy, dx) * 180 / Math.PI, palette: { a: renk }, opacity: al, start: R2(t0), ...(t1 != null ? { end: R2(t1) } : {}),
      });
    };

    // ── kalıcı: kareli zemin ──────────────────────────────────────────────
    const gG = c.grup('g-izgara', 'Izgara', true);
    for (let x = 0; x <= W; x += 60) cizgi(`ig-x${x}`, gG, x, 0, x, H, BEYAZ, x % 300 === 0 ? 3 : 1.5, x % 300 === 0 ? 0.2 : 0.08, 0, null);
    for (let y = 0; y <= H; y += 60) cizgi(`ig-y${y}`, gG, 0, y, W, y, BEYAZ, y % 300 === 0 ? 3 : 1.5, y % 300 === 0 ? 0.2 : 0.08, 0, null);
    // pafta çerçevesi
    const gC = c.grup('g-cerceve', 'Çerçeve', true);
    const cer = (id, x1, y1, x2, y2) => cizgi(id, gC, x1, y1, x2, y2, BEYAZ, 4, 0.85, 0, null);
    cer('cer-u', 36, 36, W - 36, 36); cer('cer-a', 36, H - 36, W - 36, H - 36); cer('cer-l', 36, 36, 36, H - 36); cer('cer-r', W - 36, 36, W - 36, H - 36);

    // ── kapak ─────────────────────────────────────────────────────────────
    yazi('kapak-no', 'PAFTA NO. 00  ·  KAPAK', 0.2, tKapak, { grup: 'g-acilis', x: MX, y: H * 0.065, size: 30, sabit: true, align: 'left', font: MONO, renk: CAM, weight: 700, harf: 4, reveal: [0.05, 0.9] });
    cizgi('kapak-cizgi', 'g-acilis', MX, H * 0.085, W - MX, H * 0.085, BEYAZ, 3, 0.8, 0.2, tKapak, [0.2, 0.8]);
    Z.kapak({ renk: BEYAZ, kancaRenk: CAM, altRenk: '#0b2a5c', altKutu: SARI, yK: 0.15, yB: 0.27, yA: 0.42, yN: 0.82, nesnePx: 0.42, weight: 700, suslemeTipi: 'yok', upper: true, harf: 3, kancaSize: 56, baslikSize: 190, sar: 12, lh: 1 });

    // ── paftalar ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0 + 0.15;
      const t1 = pl.t1 + 0.15;
      const acc = [CAM, SARI, '#7ee0b5', KIRMIZI][i % 4];
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(pl.t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.2;
      for (let j = 0; j < pl.beats; j += 4) vuruslar.push(c.vurus(pl.b0 + j));

      // çizici çizgisi (geçiş)
      c.L({ id: `cizici-${st}`, asset: 'kare', x: [k(pl.t0 - 0.05, -30), k(pl.t0 + 0.55, W + 30, 'inOutCubic')], y: H / 2, scale: 1, scaleX: 10 / 200, scaleY: H / 200, palette: { a: '#bff3ff' }, start: R2(pl.t0 - 0.05), end: R2(pl.t0 + 0.6) });
      c.L({ id: `cizici-isik-${st}`, asset: 'kare', x: [k(pl.t0 - 0.05, -30), k(pl.t0 + 0.55, W + 30, 'inOutCubic')], y: H / 2, scale: 1, scaleX: 60 / 200, scaleY: H / 200, palette: { a: CAM }, opacity: 0.4, blur: 30, start: R2(pl.t0 - 0.05), end: R2(pl.t0 + 0.6) });

      // başlık bloğu
      const yilM = s.yil || String(st);
      yazi(`no-${st}`, `PAFTA NO. ${String(st).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, tA, t1, { grup: g, x: MX, y: H * 0.065, size: 30, sabit: true, align: 'left', font: MONO, renk: CAM, weight: 700, harf: 4, reveal: [0.05, 0.7] });
      yazi(`rev-${st}`, `REV. ${String.fromCharCode(64 + st)}`, tA, t1, { grup: g, x: W - MX, y: H * 0.065, size: 30, sabit: true, align: 'right', font: MONO, renk: CAM, weight: 700, harf: 4, reveal: [0.05, 0.7] });
      cizgi(`ust-${st}`, g, MX, H * 0.085, W - MX, H * 0.085, BEYAZ, 3, 0.8, tA, t1, [tA, 0.6]);
      yazi(`yil-${st}`, yilM, tA + 0.1, t1, { grup: g, x: MX, y: H * 0.175, size: yilM.length > 8 ? 120 : 190, maxW: GEN, align: 'left', renk: BEYAZ, weight: 700, reveal: [0.05, 0.6] });
      yazi(`ad-${st}`, s.ad, tA + 0.4, t1, { grup: g, x: MX, y: H * 0.245, size: 56, maxW: GEN, align: 'left', renk: acc, weight: 500, upper: true, harf: 8, reveal: [0.05, 0.7] });

      // merkez çizgileri + açı halkası
      const cx = W / 2;
      const cy = H * 0.46;
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const px = m * 0.42;
      const sc = px / Math.max(aw, ah);
      const ow = aw * sc;
      const oh = ah * sc;
      cizgi(`mer-y-${st}`, g, MX, cy, W - MX, cy, CAM, 2, 0.45, tA + 0.2, t1, [tA + 0.2, 0.9]);
      cizgi(`mer-d-${st}`, g, cx, H * 0.3, cx, H * 0.64, CAM, 2, 0.45, tA + 0.3, t1, [tA + 0.3, 0.9]);
      c.sekil(`aci-halka-${st}`, 'halka', cx, cy, m * 0.72, { t0: tA + 0.3, t1, renk: CAM, opacity: 0.4, grup: g, sure: 0.9 });
      c.sekil(`aci-halka2-${st}`, 'halka', cx, cy, m * 0.56, { t0: tA + 0.4, t1, renk: BEYAZ, opacity: 0.18, grup: g, sure: 0.9 });
      for (let a = 0; a < 360; a += 30) {
        const r = (m * 0.36);
        const rad = (a * Math.PI) / 180;
        c.sekil(`aci-tik-${st}-${a}`, 'kare', cx + r * Math.sin(rad), cy - r * Math.cos(rad), 200, { t0: tA + 0.6, t1, renk: BEYAZ, opacity: 0.5, giris: 'yok', sx: 2.5 / 200, sy: (a % 90 === 0 ? 30 : 14) / 200, rot: a, grup: g });
      }

      // nesne: teknik çizim olarak çizilir
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: cx, y: Math.round(cy + oh / 2), anchor: [0.5, 1], scale: R2(sc), start: R2(tA + 0.3), end: R2(t1),
        anims: [{ preset: 'cizerek-gir', t: R2(tA + 0.3), dur: 1.8 }],
      });
      // ölçü çizgileri (altta yatay, sağda dikey)
      const dy = cy + oh / 2 + 70;
      const tD = tA + 1.8;
      cizgi(`olcu-y-${st}`, g, cx - ow / 2, dy, cx + ow / 2, dy, SARI, 3, 0.95, tD, t1, [tD, 0.7]);
      cizgi(`olcu-y1-${st}`, g, cx - ow / 2, dy - 22, cx - ow / 2, dy + 22, SARI, 3, 0.95, tD, t1, [tD, 0.3]);
      cizgi(`olcu-y2-${st}`, g, cx + ow / 2, dy - 22, cx + ow / 2, dy + 22, SARI, 3, 0.95, tD + 0.3, t1, [tD + 0.3, 0.3]);
      yazi(`olcu-yt-${st}`, 'A', tD + 0.6, t1, { grup: g, x: cx, y: dy - 2, size: 34, sabit: true, font: MONO, renk: '#0b2a5c', weight: 700, kutu: SARI, kutuAlfa: 1, radius: 999, pad: [2, 12], anims: [{ preset: 'zipla-gir', t: R2(tD + 0.6), dur: 0.35 }] });
      const dx = cx + ow / 2 + 70;
      cizgi(`olcu-d-${st}`, g, dx, cy - oh / 2, dx, cy + oh / 2, SARI, 3, 0.95, tD + 0.2, t1, [tD + 0.2, 0.7]);
      cizgi(`olcu-d1-${st}`, g, dx - 22, cy - oh / 2, dx + 22, cy - oh / 2, SARI, 3, 0.95, tD + 0.2, t1, [tD + 0.2, 0.3]);
      cizgi(`olcu-d2-${st}`, g, dx - 22, cy + oh / 2, dx + 22, cy + oh / 2, SARI, 3, 0.95, tD + 0.5, t1, [tD + 0.5, 0.3]);
      yazi(`olcu-dt-${st}`, 'B', tD + 0.8, t1, { grup: g, x: dx, y: cy, size: 34, sabit: true, font: MONO, renk: '#0b2a5c', weight: 700, kutu: SARI, kutuAlfa: 1, radius: 999, pad: [2, 12], anims: [{ preset: 'zipla-gir', t: R2(tD + 0.8), dur: 0.35 }] });

      // numaralı notlar (balon dahil)
      const NOT = [...(s.notlar || []).slice(0, 2)];
      if (s.balon) NOT.unshift(s.balon);
      NOT.slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.2 + j * 0.45;
        const lx = j % 2 ? W * 0.74 : W * 0.2;
        const ly = cy - m * (0.27 - 0.1 * Math.floor(j / 2));
        yazi(`not-${st}-${j}`, `${j + 1}`, tn, t1, { grup: g, x: lx - (j % 2 ? 0 : 0), y: ly - 62, size: 30, sabit: true, font: MONO, renk: '#0b2a5c', weight: 700, kutu: acc, kutuAlfa: 1, radius: 999, pad: [2, 12], anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.35 }] });
        yazi(`not-t-${st}-${j}`, nt, tn + 0.15, t1, { grup: g, x: lx, y: ly, size: 42, maxW: W * 0.28, sar: 10, font: MONO, renk: BEYAZ, weight: 700, reveal: [0.05, 0.6], lh: 1.1 });
        cizgi(`not-c-${st}-${j}`, g, lx, ly + 28, j % 2 ? cx + ow * 0.28 : cx - ow * 0.28, cy - oh * 0.1, acc, 2.5, 0.9, tn + 0.2, t1, [tn + 0.2, 0.6]);
      });

      // NOTLAR kutusu + numaralı satırlar
      const by = H * 0.705;
      const bh = H * 0.18;
      cizgi(`kutu-u-${st}`, g, MX, by, W - MX, by, BEYAZ, 3, 0.9, tA + 1.2, t1, [tA + 1.2, 0.5]);
      cizgi(`kutu-a-${st}`, g, MX, by + bh, W - MX, by + bh, BEYAZ, 3, 0.9, tA + 1.3, t1, [tA + 1.3, 0.5]);
      cizgi(`kutu-l-${st}`, g, MX, by, MX, by + bh, BEYAZ, 3, 0.9, tA + 1.2, t1, [tA + 1.2, 0.5]);
      cizgi(`kutu-r-${st}`, g, W - MX, by, W - MX, by + bh, BEYAZ, 3, 0.9, tA + 1.3, t1, [tA + 1.3, 0.5]);
      yazi(`kutu-b-${st}`, 'NOTLAR', tA + 1.5, t1, { grup: g, x: MX + 24, y: by + 36, size: 30, sabit: true, align: 'left', font: MONO, renk: acc, weight: 700, harf: 6, reveal: [0.05, 0.5] });
      const bY = Z.yigin(pl.bilgi.map((ln, j) => `${j + 1}.  ${ln}`), { size: 46, maxW: GEN - 60, lh: 1.08, gap: 20, font: MONO, minOran: 0.9 });
      bY.items.forEach((it, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, it.ln, tA + 1.9 + j * 1.1, t1, { grup: g, x: MX + 24, y: by + 74 + it.yOff, size: it.size, maxW: GEN - 60, sar: it.sar, align: 'left', font: MONO, renk: BEYAZ, weight: 700, lh: 1.08, reveal: [0.05, 1.0] });
      });

      // damga
      const tS = Math.max(tA + 4.0, t1 - 2.2);
      c.sekil(`damga-d-${st}`, 'kare', W * 0.72, H * 0.93, 200, { t0: tS, t1, renk: KIRMIZI, opacity: 0.95, giris: 'yok', sx: 380 / 200, sy: 100 / 200, rot: -12, grup: g, extra: { scale: [k(tS, 1.6), k(tS + 0.2, 1, 'outBack')] } });
      c.sekil(`damga-i-${st}`, 'kare', W * 0.72, H * 0.93, 200, { t0: tS, t1, renk: '#0d3470', giris: 'yok', sx: 364 / 200, sy: 84 / 200, rot: -12, grup: g, extra: { scale: [k(tS, 1.6), k(tS + 0.2, 1, 'outBack')] } });
      yazi(`damga-t-${st}`, 'ONAYLANDI', tS, t1, { grup: g, x: W * 0.72, y: H * 0.93, size: 52, sabit: true, font: Z.font, renk: KIRMIZI, weight: 700, harf: 6, rot: -12, anims: [{ preset: 'zipla-gir', t: R2(tS), dur: 0.25 }] });
      c.halka(`damga-halka-${st}`, tS + 0.18, W * 0.72, H * 0.93, KIRMIZI, { group: g, alfa: 0.6, boyut: 120, son: 520, sure: 0.5 });
      vuruslar.push(tS + 0.2);
      Z.ses(pl, tA);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    c.L({ id: 'cizici-son', asset: 'kare', x: [k(tK - 0.05, -30), k(tK + 0.55, W + 30, 'inOutCubic')], y: H / 2, scale: 1, scaleX: 10 / 200, scaleY: H / 200, palette: { a: '#bff3ff' }, start: R2(tK - 0.05), end: R2(tK + 0.6) });
    Z.kapanis({ renk: BEYAZ, t0: tK + 0.4, upper: true, soruKutu: SARI, soruRenk: '#0b2a5c', ctaRenk: CAM });
    vuruslar.push(tK + 0.5);

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3), { zoom: 0.014, egim: 0 });
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.3, i: i + 1 })), { t: tK + 0.4, i: n + 1 }], { aci: 170, vinyet: 0.3, sure: 0.8 }),
      camera: cam,
    });
  },
};
