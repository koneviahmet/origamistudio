// Zaman tüneli · MANTAR PANO: dedektif panosu gibi el yapımı hikâye. Kamera panoda bir polaroidden diğerine KIRMIZI İPİN ucunu izleyerek gider;
// her durakta kamera polaroide göre döner (kare düzleşir), raptiye çakılır, fotoğraf alanında nesne kendini katlayarak belirir, altına el yazısı yıl,
// yanına yapışkan not kâğıtlarında bilgi satırları yazılır. Sonda kamera uzaklaşıp tüm panoyu gösterir. Sıcak, el emeği, merak uyandıran.
// Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

const RAD = Math.PI / 180;

export default {
  id: 'zaman-pano',
  ad: 'Zaman tüneli · Mantar pano',
  etiket: 'Hikâye · El yapımı · Polaroid · Sıcak',
  sure: '40–90 sn',
  aciklama: 'Dedektif panosu: kamera kırmızı ipi izleyerek polaroidden polaroide gider ve kareyi düzleştirmek için döner. Raptiye çakılır, nesne katlanarak belirir, post-it notlarında bilgi yazılır; sonda kamera uzaklaşıp tüm panoyu gösterir.',
  ornek: {
    sablon: 'zaman-pano', id: 'sablon-zaman-pano', ad: 'Telefonun Hikâyesi', format: 'reels', palet: 'mantar', muzik: 'lofi-90', font: 'Caveat', stil: 'duz',
    kanca: 'Dosyayı açıyoruz:', baslik: 'Telefonun Hikâyesi', altBaslik: '150 yıllık iz sürme', kapakNesne: 'cevirmeli-telefon',
    bolumler: [
      { yil: '1876', ad: 'İlk telefon', nesne: 'cevirmeli-telefon', balon: 'Alo?', bilgi: ['Bell sesi tel üzerinden iletir', 'Konuşma mesafeyi aşar'], notlar: ['patent'], anlatim: 'Bin sekiz yüz yetmiş altı. Bell, sesi tel üzerinden ileten telefonun patentini aldı.' },
      { yil: '1920\'ler', ad: 'Duvar telefonu', nesne: 'duvar-telefonu', balon: 'Ahize!', bilgi: ['Evlerin duvarına asılır', 'Santral operatörü bağlar'], anlatim: 'Bin dokuz yüz yirmilerde telefonlar evlerin duvarına asıldı ve görüşmeleri operatörler bağladı.' },
      { yil: '1963', ad: 'Tuşlu telefon', nesne: 'tuslu-telefon', balon: 'Tık tık!', bilgi: ['Çevirmek yerine tuşa basılır', 'Numara daha hızlı girilir'], anlatim: 'Bin dokuz yüz altmış üç. Tuşlu telefonlar çevirmenin yerini aldı.' },
      { yil: '1983', ad: 'Tuğla telefon', nesne: 'tugla-telefon', balon: 'Taşınır!', bilgi: ['İlk ticari cep telefonu', 'Ağır ama özgürlük verir'], notlar: ['antenli'], anlatim: 'Bin dokuz yüz seksen üç. İlk ticari cep telefonu tuğla gibi ağırdı ama özgürlük verdi.' },
      { yil: '2007', ad: 'Akıllı telefon', nesne: 'akilli-telefon', balon: 'Dokun!', bilgi: ['Dokunmatik ekran ve uygulamalar', 'Cebimizde bir bilgisayar'], notlar: ['ekran'], anlatim: 'İki bin yedi. Akıllı telefonlar dokunmatik ekranı ve uygulamaları getirdi.' },
    ],
    soru: 'Dosyanın sonu ne?', cta: 'Tahminini yaz!', son1: 'Dosya', son2: 'kapanmadı!',
    yayin: { baslik: 'Telefonun hikâyesi: 150 yıllık iz sürme', aciklama: 'Çevirmeli telefondan akıllı telefona dedektif panosu tadında bir yolculuk. Sence dosyanın sonu ne?', etiketler: ['telefon', 'teknoloji', 'tarih', 'icatlar', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-pano', { palet: 'mantar', muzik: 'lofi-90', font: 'Caveat', stil: 'duz' }, { kapSure: 15, minSn: 6.4 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const INK = '#2b2433';
    const KIRMIZI = '#c0262d';
    const font = Z.font;
    const KALEM = 'Kalam';
    const ROT = [-4, 3, -3.5, 4, -2.5, 3.5, -3, 2.5, -4];
    const SAG = 330;
    const P = (i) => (i === 0 ? { x: W / 2, y: H / 2 } : { x: W / 2 + (i % 2 ? SAG : -SAG), y: H / 2 + i * 1180 });
    const rot = (i) => (i === 0 ? 0 : ROT[(i - 1) % ROT.length]);
    const loc = (i, lx, ly) => {
      const r = rot(i) * RAD;
      const q = P(i);
      return { x: Math.round(q.x + lx * Math.cos(r) - ly * Math.sin(r)), y: Math.round(q.y + lx * Math.sin(r) + ly * Math.cos(r)) };
    };
    const PIN_Y = -372;
    const KAM_DY = 230; // polaroid ekranın üst yarısında dursun
    const vuruslar = [];
    const dunyaY = P(n).y + 2400;

    // ── pano dokusu: mantar benekleri ─────────────────────────────────────
    const gB = c.grup('g-pano', 'Pano', true);
    for (let i = 0; i < 260; i++) {
      const fx = (i * 0.618034) % 1;
      const fy = (i * 0.381966 + (i % 7) * 0.13) % 1;
      c.sekil(`benek-${i}`, 'daire', -500 + fx * 2200, -400 + fy * (dunyaY + 600), 5 + (i % 5) * 4, { t0: 0, renk: i % 3 ? '#6b4423' : '#e7c79a', opacity: i % 3 ? 0.16 : 0.2, giris: 'yok', grup: gB });
    }

    // ── kırmızı iplerin yeri (polaroidlerden önce çizilir → altta kalır) ──
    for (let i = 0; i < n; i++) {
      const a = loc(i, 0, PIN_Y);
      const b = loc(i + 1, 0, PIN_Y);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx) / RAD;
      const tB = planlar[i].t0 - 1.0; // i. polaroide gelirken ip uzar
      const tBit = tB + 1.1;
      for (const [yOfs, renk, al, kal] of [[8, '#000000', 0.25, 9], [0, KIRMIZI, 1, 6]]) {
        c.L({
          id: `ip-${i + 1}${yOfs ? 'g' : ''}`, group: gB, asset: 'kare', x: a.x, y: a.y + yOfs, anchor: [0, 0.5], scale: 1, scaleX: [k(tB, 0), k(tBit, len / 200, 'inOutCubic')], scaleY: kal / 200, rotation: ang,
          palette: { a: renk }, opacity: al, start: R2(tB),
        });
      }
    }
    // kapanıştaki (son) ip: son polaroidden kapanış notuna
    const sK = P(n);
    const KAP = { x: W / 2, y: sK.y + 1750 };

    // ── kapak: pano üstünde kâğıt başlık ──────────────────────────────────
    c.sekil('kapak-golge', 'kare', W / 2 + 12, H * 0.34 + 22, 200, { t0: 0, t1: tKapak, renk: '#000000', opacity: 0.22, giris: 'yok', sx: (W * 0.86) / 200, sy: (H * 0.4) / 200, rot: -1.5, grup: 'g-acilis' });
    c.sekil('kapak-kagit', 'kare', W / 2, H * 0.34, 200, { t0: 0, t1: tKapak, renk: '#fbf6ea', giris: 'yok', sx: (W * 0.86) / 200, sy: (H * 0.4) / 200, rot: -1.5, grup: 'g-acilis', anims: [{ preset: 'zipla-gir', t: 0.1, dur: 0.6 }] });
    c.sekil('kapak-raptiye', 'daire', W * 0.5, H * 0.34 - H * 0.2 + 8, 62, { t0: 0.5, t1: tKapak, renk: KIRMIZI, grup: 'g-acilis', sure: 0.3 });
    c.sekil('kapak-raptiye-isik', 'daire', W * 0.5 - 8, H * 0.34 - H * 0.2 - 2, 18, { t0: 0.55, t1: tKapak, renk: '#ffffff', opacity: 0.8, grup: 'g-acilis', sure: 0.3 });
    Z.kapak({ renk: INK, kancaRenk: KIRMIZI, altRenk: INK, altKutu: '#ffe27a', yK: 0.185, yB: 0.285, yA: 0.4, yN: 0.82, nesnePx: 0.46, weight: 700, suslemeTipi: 'yok', kancaSize: 84, baslikSize: 190, sar: 12 });

    // ── polaroidler ───────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const r = rot(st);
      const acc = hi(i);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.2;
      vuruslar.push(tA, c.vurus(pl.b0 + 4));
      const Lc = (lx, ly) => loc(st, lx, ly);
      const pop = (t, dur = 0.5) => ({ preset: 'zipla-gir', t: R2(t), dur });

      // gölge + çerçeve + fotoğraf alanı
      const g0 = Lc(14, 20);
      c.sekil(`golge-${st}`, 'kare', g0.x, g0.y, 200, { t0: tA, renk: '#000000', opacity: 0.3, giris: 'yok', sx: 640 / 200, sy: 780 / 200, rot: r, grup: g, blur: 10, anims: [pop(tA)] });
      const f0 = Lc(0, 0);
      c.sekil(`cerceve-${st}`, 'kare', f0.x, f0.y, 200, { t0: tA, renk: '#fbf8f1', giris: 'yok', sx: 640 / 200, sy: 780 / 200, rot: r, grup: g, anims: [pop(tA)] });
      const ph = Lc(0, -70);
      c.sekil(`foto-${st}`, 'kare', ph.x, ph.y, 200, { t0: tA, renk: acc, giris: 'yok', sx: 560 / 200, sy: 560 / 200, rot: r, grup: g, anims: [pop(tA + 0.1)] });
      Z.isik(`foto-isik-${st}`, ph.x, ph.y, 380, '#ffffff', { t0: tA + 0.2, opacity: 0.5, blur: 40, grup: g });

      // nesne (katlanarak belirir)
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const ob = Lc(0, 175);
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: ob.x, y: ob.y, anchor: [0.5, 1], scale: R2(470 / Math.max(aw, ah)), rotation: r, start: R2(tA + 0.3),
        anims: [{ preset: 'katlanarak-gir', t: R2(tA + 0.35), dur: 0.9 }, { preset: 'suzul', t: R2(tA + 1.4), genlik: 8, periyot: 3.4 }],
      });
      // raptiye
      const pn = Lc(0, PIN_Y);
      c.sekil(`raptiye-golge-${st}`, 'daire', pn.x + 5, pn.y + 9, 64, { t0: tA + 0.15, renk: '#000000', opacity: 0.3, grup: g, sure: 0.3 });
      c.sekil(`raptiye-${st}`, 'daire', pn.x, pn.y, 62, { t0: tA + 0.15, renk: KIRMIZI, grup: g, sure: 0.35 });
      c.sekil(`raptiye-isik-${st}`, 'daire', pn.x - 9, pn.y - 10, 18, { t0: tA + 0.2, renk: '#ffffff', opacity: 0.85, grup: g, sure: 0.3 });
      c.halka(`raptiye-halka-${st}`, tA + 0.2, pn.x, pn.y, '#ffffff', { group: g, alfa: 0.6, boyut: 50, son: 230, sure: 0.6 });

      // el yazısı yıl + ad
      const yp = Lc(0, 268);
      yazi(`yil-${st}`, s.yil || String(st), tA + 0.6, null, { grup: g, x: yp.x, y: yp.y, size: 128, maxW: 560, renk: INK, weight: 700, rot: r, reveal: [0.05, 0.6], font, anims: [pop(tA + 0.6)] });
      const np = Lc(0, 352);
      yazi(`ad-${st}`, s.ad, tA + 0.9, null, { grup: g, x: np.x, y: np.y, size: 62, maxW: 560, renk: '#6b5b73', weight: 600, rot: r, reveal: [0.05, 0.7], font });

      // balon (çıkartma)
      if (s.balon) {
        const bp = Lc(300, -300);
        c.damga(`balon-${st}`, s.balon, tA + 1.4, null, bp.x, bp.y, 250, { grup: g, zemin: '#ffe27a', renk: INK, rot: r + 12, font, sar: 8 });
      }

      // post-it'ler: bilgi satırları
      const NOT = [{ lx: -135, ly: 640, ar: -4, tape: -8 }, { lx: 150, ly: 905, ar: 3.5, tape: 6 }];
      const renkler = ['#ffe27a', '#ffb3c1'];
      pl.bilgi.forEach((ln, j) => {
        const q = NOT[j];
        const np2 = Lc(q.lx, q.ly);
        const tb = tA + 1.5 + j * 1.2;
        const pr = r + q.ar;
        c.sekil(`postit-golge-${st}${'ab'[j]}`, 'kare', np2.x + 8, np2.y + 12, 200, { t0: tb, renk: '#000000', opacity: 0.25, giris: 'yok', sx: 400 / 200, sy: 300 / 200, rot: pr, grup: g, blur: 8, anims: [pop(tb)] });
        c.sekil(`postit-${st}${'ab'[j]}`, 'kare', np2.x, np2.y, 200, { t0: tb, renk: renkler[j % 2], giris: 'yok', sx: 400 / 200, sy: 300 / 200, rot: pr, grup: g, anims: [pop(tb)] });
        const tp = loc(st, q.lx, q.ly - 150);
        c.sekil(`bant-${st}${'ab'[j]}`, 'kare', tp.x, tp.y, 200, { t0: tb + 0.1, renk: '#ffffff', opacity: 0.55, giris: 'yok', sx: 140 / 200, sy: 40 / 200, rot: pr + q.tape, grup: g, anims: [pop(tb + 0.1, 0.4)] });
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tb + 0.3, null, { grup: g, x: np2.x, y: np2.y, size: 60, maxW: 350, sar: 13, renk: INK, weight: 600, rot: pr, font: KALEM, lh: 1.05, reveal: [0.05, 1.0] });
      });
      // etiket (washi bant)
      (s.notlar || []).slice(0, 1).forEach((nt) => {
        const q = Lc(-250, 150);
        yazi(`not-${st}`, `#${nt}`, tA + 2.4, null, { grup: g, x: q.x, y: q.y, size: 46, sabit: true, kutu: '#a9c8f0', kutuAlfa: 0.9, radius: 6, pad: [8, 20], renk: INK, weight: 700, rot: r - 8, font: KALEM, anims: [pop(tA + 2.4, 0.4)] });
      });
      Z.ses(pl, tA + 0.2);
    });

    // ── kapanış: büyük sarı not kâğıdı + pano uzaklaşma ───────────────────
    const tOv = tK + 0.1; // uzaklaşma başlangıcı
    const tKap = tK + 3.4; // kapanış notuna gelme
    c.sekil('kapanis-golge', 'kare', KAP.x + 14, KAP.y + 24, 200, { t0: tKap - 1.5, renk: '#000000', opacity: 0.26, giris: 'yok', sx: (W * 0.9) / 200, sy: (H * 0.76) / 200, rot: -2, grup: 'g-kapanis', blur: 12 });
    c.sekil('kapanis-kagit', 'kare', KAP.x, KAP.y, 200, { t0: tKap - 1.5, renk: '#ffe27a', giris: 'yok', sx: (W * 0.9) / 200, sy: (H * 0.76) / 200, rot: -2, grup: 'g-kapanis' });
    c.sekil('kapanis-bant', 'kare', KAP.x, KAP.y - H * 0.38, 200, { t0: tKap - 1.4, renk: '#ffffff', opacity: 0.6, giris: 'yok', sx: 260 / 200, sy: 60 / 200, rot: 3, grup: 'g-kapanis' });
    Z.kapanis({ renk: INK, dx: KAP.x - W / 2, dy: KAP.y - H * 0.5, t0: tKap, soruRenk: INK, soruKutu: '#ffffff', ctaRenk: '#6b5b73' });
    vuruslar.push(tKap);

    // ── kamera: polaroid düzleştirme (dönüş) + son uzaklaşma ──────────────
    const camX = [k(0, W / 2)];
    const camY = [k(0, H / 2)];
    const camR = [k(0, 0)];
    const camZ = [k(0, 1.14), k(3.2, 1, 'inOutCubic')];
    let sx = W / 2;
    let sy = H / 2;
    let sr = 0;
    const PAN = 1.3;
    const bitisAnim = (t, hx, hy, hr, zoomOrta = 0.9) => {
      const a = t - 0.9;
      camX.push(k(a, sx, 'linear'), k(a + PAN, hx, 'inOutCubic'));
      camY.push(k(a, sy, 'linear'), k(a + PAN, hy, 'inOutCubic'));
      camR.push(k(a, sr, 'linear'), k(a + PAN, hr, 'inOutCubic'));
      camZ.push(k(a, 1, 'linear'), k(a + PAN * 0.5, zoomOrta, 'inOutSine'), k(a + PAN, 1, 'inOutSine'));
      sx = hx;
      sy = hy;
      sr = hr;
    };
    planlar.forEach((pl, i) => {
      const st = i + 1;
      const c0 = loc(st, 0, KAM_DY);
      bitisAnim(pl.t0, c0.x, c0.y, -rot(st));
    });
    // son: pano genel görünüm, sonra kapanış notu
    const tüm = { x: W / 2, y: (P(1).y + P(n).y) / 2 + 150 };
    const zOv = Math.min(0.5, (H * 0.96) / (P(n).y - P(1).y + 1900));
    {
      const a = tOv + 0.2;
      camX.push(k(a, sx, 'linear'), k(a + 1.6, tüm.x, 'inOutCubic'));
      camY.push(k(a, sy, 'linear'), k(a + 1.6, tüm.y, 'inOutCubic'));
      camR.push(k(a, sr, 'linear'), k(a + 1.6, 0, 'inOutCubic'));
      camZ.push(k(a, 1, 'linear'), k(a + 1.6, R2(zOv), 'inOutCubic'), k(tKap - 1.1, R2(zOv), 'linear'));
      sx = tüm.x; sy = tüm.y; sr = 0;
      bitisAnim(tKap, KAP.x, KAP.y - 20, 0, R2(zOv));
    }
    const duz = (a) => a.filter((e, i, arr) => !i || e.t > arr[i - 1].t);
    const cam = { x: duz(camX), y: duz(camY), rotation: duz(camR), zoom: duz(camZ) };
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }], { aci: 160, vinyet: 0.38, kagit: 0.55 }),
      camera: cam,
    });
  },
};
