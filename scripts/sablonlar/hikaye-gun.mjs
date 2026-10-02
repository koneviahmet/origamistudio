// Hikâye · GÜNÜN DÖNGÜSÜ: tek bir vadi, kamera sabit (yalnızca yavaş yaklaşır). Hikâye SAATLERE bölünür: güneş yay çizerek ilerler, gökyüzü
// şafak → gündüz → gün batımı → geceye döner, ay ve yıldızlar çıkar, ışık örtüsü manzarayı boyar. Köşede dijital saat + analog saat ibresi.
// Her bölümde sahneye yeni konuklar gelir (kelebek, turna, tilki…). Altyazı altta. "Bir günün hikâyesi" tarzı anlatılar için.
// Hikâye: brief.hikaye = [{ saat: 6, baslik, anlatim, altyazi?, konuk?: ['kelebek'|'turna'|'marti'], ses? }]
import { hikayeKur, GOKYUZU, R2 } from './hikaye-ortak.mjs';

export default {
  id: 'hikaye-gun',
  ad: 'Hikâye · Günün döngüsü (saatli)',
  etiket: 'Hikâye · Bir gün · Saat · Sabit sahne',
  sure: '45–90 sn',
  aciklama: 'Tek bir vadi: güneş yay çizerek ilerler, gökyüzü şafaktan geceye döner, ay ve yıldızlar çıkar. Hikâye saatlere bölünür; köşede dijital saat ve analog ibre. Bölümlere göre sahneye kelebek, turna gibi konuklar gelir. "Bir günün hikâyesi".',
  ornek: {
    sablon: 'hikaye-gun', id: 'sablon-hikaye-gun', ad: 'Ormanda Bir Gün', format: 'reels', muzik: 'lofi-90', font: 'Baloo 2',
    baslik: 'Ormanda Bir Gün', altBaslik: 'tilkinin saatleri',
    hikaye: [
      { saat: 6, baslik: 'Gün doğuyor', anlatim: 'Saat altıda güneş tepelerin ardından yükseldi. Küçük tilki gerinip uyandı; yeni bir gün başlıyordu.', altyazi: 'Küçük tilki gerinip uyandı.' },
      { saat: 10, baslik: 'Kelebekler', anlatim: 'Saat onda çiçekler açtı ve kelebekler dans etmeye başladı. Tilki, kelebeklerin peşinden koşmayı çok severdi.', altyazi: 'Kelebekler dans ediyordu.', konuk: ['kelebek'] },
      { saat: 14, baslik: 'Sıcak öğle', anlatim: 'Öğleden sonra güneş tam tepedeydi. Tilki, çam ağacının gölgesinde serinledi ve bir turnanın gökte süzülüşünü izledi.', altyazi: 'Gölgede serinledi.', konuk: ['turna'] },
      { saat: 18, baslik: 'Gün batımı', anlatim: 'Akşam altıda gökyüzü pembeye ve turuncuya boyandı. Turnalar uzaklara doğru yola çıktı.', altyazi: 'Gökyüzü pembeye boyandı.', konuk: ['turna', 'turna'] },
      { saat: 21, baslik: 'Yıldızlar', anlatim: 'Gece olunca önce ay, sonra yıldızlar göründü. Orman sessizleşti, yalnızca bir baykuşun sesi duyuldu.', altyazi: 'Yıldızlar göründü.' },
      { saat: 24, baslik: 'Uyku', anlatim: 'Gece yarısı tilki yuvasına kıvrıldı. Yarın yine güneş doğacaktı. İyi geceler, küçük tilki.', altyazi: 'İyi geceler, küçük tilki.' },
    ],
    son: 'İyi geceler', soru: 'Senin gününde en güzel saat hangisi?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Ormanda bir gün: tilkinin saatleri', aciklama: 'Gün doğumundan gece yarısına, katmanlı bir ormanda küçük tilkinin günü. Senin gününün en güzel saati hangisi?', etiketler: ['masal', 'hikaye', 'tilki', 'orman', 'animasyon', 'reels', 'shorts', 'cocuk', 'uyku'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-gun', { palet: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2', stil: brief.stil || 'origami' }, { kapakBeats: 8, kapSure: 10, minSn: 6.2 });
    const { c, W, H, k, fx, fy, planlar, n, tAc, tK, tEnd, g } = Z;
    const sg = GOKYUZU;
    const MONO = 'Space Mono';
    const saatler = planlar.map((pl, i) => (pl.s.saat != null ? Number(pl.s.saat) : 6 + Math.round((18 * i) / Math.max(1, n - 1))));
    const gokOf = (h) => (h < 5 ? sg.gece : h < 8 ? sg.safak : h < 16.5 ? sg.gunduz : h < 19.5 ? sg.aksam : sg.gece);
    const TAHTA = { yazi: '#2b3a47', kutu: 'rgba(255,255,255,0.82)', alt: '#4a5a6c', golge: 'rgba(0,0,0,0.25)' };

    // gökyüzü rengi bölüm saatine göre
    const gok = Z.gokyuzu([{ t: 0, bg: sg.safak.bg }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.2, bg: gokOf(saatler[i]).bg }))], { sure: 2.4 });

    // güneş / ay yörüngeleri (saatten konum)
    const gunesYol = (h) => {
      const u = (h - 6) / 12; // 0..1 gündüz
      if (u < -0.05 || u > 1.05) return { x: 540 + (u < 0.5 ? -1 : 1) * 620, y: 1250 };
      const uu = Math.max(0, Math.min(1, u));
      return { x: 120 + 840 * uu, y: 1150 - 820 * Math.sin(Math.PI * uu) };
    };
    const ayYol = (h) => {
      const hh = h < 12 ? h + 24 : h;
      const u = (hh - 18.5) / 11; // 18.5 → 29.5
      if (u < -0.05 || u > 1.05) return { x: 540, y: 1300 };
      const uu = Math.max(0, Math.min(1, u));
      return { x: 140 + 800 * uu, y: 1100 - 780 * Math.sin(Math.PI * uu) };
    };
    const yolTrack = (fn, oz) => {
      const xs = [];
      const ys = [];
      planlar.forEach((pl, i) => {
        const pz = fn(saatler[i]);
        xs.push(k(pl.t0 + 1.6, R2(pz.x * fx), 'inOutSine'));
        ys.push(k(pl.t0 + 1.6, R2(pz.y * fy), 'inOutSine'));
      });
      const p0 = fn(saatler[0] - 1);
      return { x: [k(0, R2(p0.x * fx)), ...xs], y: [k(0, R2(p0.y * fy)), ...ys] };
    };
    const gy = yolTrack(gunesYol);
    const ay = yolTrack(ayYol);
    const gece = (h) => (h >= 20 || h < 5 ? 1 : 0);
    Z.ekle({ id: 'gunes', group: g, asset: 'gunes', x: gy.x, y: gy.y, scale: R2(1.6 * fx), ...Z.fold(0.3, 1.3), loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }],
      opacity: [k(0, 1), ...planlar.map((pl, i) => k(pl.t0 + 1.6, gece(saatler[i]) ? 0 : 1, 'linear'))] });
    // yıldızlar
    for (let i = 0; i < 14; i++) {
      Z.ekle({ id: `yildiz-${i}`, group: g, asset: 'yildiz', x: (80 + ((i * 331) % 920)) * fx, y: (180 + ((i * 197) % 600)) * fy, scale: R2((0.16 + (i % 3) * 0.06) * fx), palette: { a: '#fff2b3' },
        opacity: [k(0, 0), ...planlar.map((pl, q) => k(pl.t0 + 2 + i * 0.05, gece(saatler[q]) ? 0.9 : 0, 'linear'))], loops: [{ prop: 'opacity', type: 'sine', amp: 0.3, period: 1.6 + (i % 4) * 0.5, phase: i * 0.3 }] });
    }
    Z.ekle({ id: 'ay', group: g, asset: 'hilal', x: ay.x, y: ay.y, scale: R2(1.7 * fx), opacity: [k(0, 0), ...planlar.map((pl, i) => k(pl.t0 + 1.6, gece(saatler[i]) ? 1 : 0, 'linear'))] });
    // bulutlar
    Z.bulut('bulut-1', 200, 330, 430, 1.2, 0.6, { zaman1: tEnd });
    Z.bulut('bulut-2', 920, 780, 690, 0.8, 0.9, { sira: 'right', zaman1: tEnd });

    // ── vadi (daglar ön ayarı) ────────────────────────────────────────────
    Z.bant('dag-1', 'dag', 980, 3.9, { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' }, { x: 360, amp: 10, per: 7, n: 0 });
    Z.bant('dag-2', 'dag', 1060, 3.6, { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' }, { x: 760, amp: 14, per: 6, n: 1 });
    Z.bant('tepe-1', 'tepeler', 1180, 3.1, { a: '#a9d28b', b: '#8fc274' }, { x: 540, amp: 18, per: 6, n: 2 });
    Z.bant('tepe-2', 'tepeler', 1330, 3.4, { a: '#8fc274', b: '#74ab5c' }, { x: 420, amp: 24, per: 5.5, n: 3 });
    Z.hayvan('agac-1', 'cam-agaci', 130, 1380, 1.5, 2.2, { sabit: true, ek: { fold: [k(2.2, 0), k(3.3, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.4 }] } });
    Z.hayvan('agac-2', 'cam-agaci', 960, 1400, 1.7, 2.5, { sabit: true, ek: { fold: [k(2.5, 0), k(3.6, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.8, phase: 0.4 }] } });
    Z.bant('tepe-3', 'tepeler', 1520, 3.8, { a: '#74ab5c', b: '#5e9449' }, { x: 600, amp: 30, per: 5, n: 4 });
    Z.hayvan('lale-1', 'lale', 240, 1790, 1.4, 3.2, { sabit: true, ek: { fold: [k(3.2, 0), k(4.2, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 2.6, phase: 0.2 }] } });
    Z.hayvan('lale-2', 'lale', 840, 1810, 1.2, 3.4, { sabit: true, variant: 'sari', ek: { fold: [k(3.4, 0), k(4.4, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 2.9, phase: 0.6 }] } });

    // ışık örtüsü (gün boyu): şafak sıcak, gün batımı turuncu, gece lacivert
    const orten = (id, renk, deger) => c.L({ id, group: g, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.3) / 200, scaleY: (H * 1.3) / 200, palette: { a: renk }, opacity: [k(0, deger(saatler[0] - 1)), ...planlar.map((pl, i) => k(pl.t0 + 1.8, deger(saatler[i]), 'inOutSine'))] });
    orten('isik-sicak', '#ff8a4c', (h) => (h < 8 ? 0.14 : h >= 16.5 && h < 19.5 ? 0.2 : 0));
    orten('isik-gece', '#0a1036', (h) => (h >= 20 || h < 5 ? 0.45 : h >= 19.5 ? 0.2 : 0));
    // ay ve yıldızlar örtünün üstünde parlasın: yeniden çizim yerine örtü şeffaflığı düşük tutuldu

    // ── tilki: tüm gün sahnede ────────────────────────────────────────────
    const gnTilki = saatler.findIndex((h) => gece(h));
    const tilkiBas = planlar[0].t0 + 0.4;
    Z.hayvan('tilki', 'tilki', 520, 1730, 1.5, tilkiBas, { ek: { partLoop: undefined, parts: { tail: { loops: [{ prop: 'rotation', type: 'sine', amp: 12, period: 1.2 }] } } } });
    if (gnTilki >= 0) {
      const tg = planlar[gnTilki].t0 + 1.6;
      Z.hayvan('tilki-gece', 'tilki', 520, 1730, 1.5, tg, { variant: 'gece', sabit: true, ek: { fold: [k(tg, 0), k(tg + 1, 1, 'linear')], parts: { tail: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 2.4 }] } } } });
      c.layers.find((l) => l.id === 'tilki').end = R2(tg + 0.4);
      // uykuda Zzz
      const son = planlar[n - 1].t0 + 1.8;
      ['z', 'Z', 'Z'].forEach((zc, q) => c.L({ id: `zzz-${q}`, group: g, type: 'text', text: zc, font: Z.font, weight: 700, size: 70 + q * 22, color: '#fff2b3', x: (600 + q * 55) * fx, y: [k(son + q * 0.7, (1520 - q * 50) * fy), k(son + q * 0.7 + 2.4, (1280 - q * 90) * fy, 'linear')],
        opacity: [k(son + q * 0.7, 0), k(son + q * 0.7 + 0.5, 1, 'linear'), k(son + q * 0.7 + 2.4, 0, 'linear')], start: R2(son + q * 0.7), end: R2(son + q * 0.7 + 2.5), loops: [{ prop: 'x', type: 'sine', amp: 14, period: 1.4 }] }));
    }

    // ── saat widget'ı: dijital + analog ───────────────────────────────────
    const SX = W - 150;
    const SY = 230;
    c.sekil('saat-halka', 'halka', SX, SY, 190, { t0: tAc - 0.5, renk: '#ffffff', opacity: 0.8, grup: g, sure: 0.6 });
    c.sekil('saat-yuz', 'daire', SX, SY, 172, { t0: tAc - 0.5, renk: '#ffffff', opacity: 0.35, grup: g, sure: 0.6 });
    for (let q = 0; q < 12; q++) {
      const a = (q * 30 * Math.PI) / 180;
      c.sekil(`saat-tik-${q}`, 'kare', SX + 74 * Math.sin(a), SY - 74 * Math.cos(a), 200, { t0: tAc - 0.4, renk: '#2b3a47', opacity: 0.7, giris: 'yok', grup: g, sx: 3 / 200, sy: (q % 3 ? 10 : 18) / 200, rot: q * 30 });
    }
    const derece = (h) => (h % 12) * 30;
    const ibre = [k(tAc - 0.5, derece(saatler[0] - 1))];
    let onceki = derece(saatler[0] - 1);
    planlar.forEach((pl, i) => {
      let d = derece(saatler[i]);
      while (d < onceki) d += 360;
      ibre.push(k(pl.t0 + 0.2, onceki, 'linear'), k(pl.t0 + 1.8, d, 'inOutCubic'));
      onceki = d;
    });
    const sirali = ibre.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
    c.L({ id: 'saat-ibre', group: g, asset: 'kare', x: SX, y: SY, anchor: [0.5, 1], scale: 1, scaleX: 6 / 200, scaleY: 62 / 200, rotation: sirali, palette: { a: '#2b3a47' }, start: R2(tAc - 0.4) });
    c.sekil('saat-merkez', 'daire', SX, SY, 18, { t0: tAc - 0.4, renk: '#2b3a47', grup: g, sure: 0.3 });
    planlar.forEach((pl, i) => {
      const h = saatler[i] % 24;
      const metin = `${String(h).padStart(2, '0')}:00`;
      c.L({ id: `saat-yazi-${i}`, group: g, type: 'text', text: metin, font: MONO, weight: 700, size: 78, color: '#ffffff', align: 'left', x: 60, y: SY - 22, start: R2(pl.t0 + 0.4), end: R2(pl.t1 + 0.1),
        stroke: { color: '#2b3a47', width: 10 }, reveal: [k(pl.t0 + 0.5, 0), k(pl.t0 + 1.2, 1, 'linear')] });
      c.L({ id: `saat-baslik-${i}`, group: g, type: 'text', text: pl.s.baslik || '', font: Z.font, weight: 700, size: 52, color: '#ffffff', align: 'left', x: 64, y: SY + 56, start: R2(pl.t0 + 0.7), end: R2(pl.t1 + 0.1),
        stroke: { color: '#2b3a47', width: 8 }, reveal: [k(pl.t0 + 0.8, 0), k(pl.t0 + 1.6, 1, 'linear')] });
    });

    // ── bölümler: konuklar + altyazı ──────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = pl.t0;
      const t1 = pl.t1;
      c.bolum(t0, `${String(saatler[i] % 24).padStart(2, '0')}:00 · ${s.baslik || ''}`);
      (s.konuk || []).forEach((kn, q) => {
        if (kn === 'kelebek') Z.ucan(`konuk-${i}-${q}`, 'kelebek', t0 + 0.8 + q * 1.2, t0 + 0.8 + q * 1.2 + 8, 1500 - q * 120, 1200, 0.55, 28, 0.35);
        else Z.ucan(`konuk-${i}-${q}`, kn, t0 + 0.8 + q * 1.4, t1 - 0.2, 760 + q * 110, 560 + q * 60, kn === 'marti' ? 1.3 : 0.9, 14, 0.6);
      });
      Z.altyazi(`altyazi-${i}`, s.altyazi || s.anlatim, t0 + 1.4, t1 - 0.1, TAHTA, { y: 0.745 });
      Z.ses(pl, t0 + 0.6);
    });

    Z.acilis({ yazi: sg.safak.yazi, alt: sg.safak.alt, golge: sg.safak.golge }, { y: 0.14 });
    Z.kapanis(TAHTA, { perde: 0.5 });
    return Z.bitir({
      background: gok,
      camera: { zoom: [k(0, 1.15), k(3.5, 1, 'inOutCubic'), k(tEnd, 1.05, 'linear')], x: W / 2, y: [k(0, R2(H / 2 + 120 * fy)), k(3.5, H / 2, 'inOutCubic')] },
    }, { yazi: sg.gunduz.yazi, alt: sg.gunduz.alt });
  },
};
