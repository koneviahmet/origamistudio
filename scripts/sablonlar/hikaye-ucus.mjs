// Hikâye · UÇUŞ (derinlikte ileri gidiş): kamera sabit, kahraman (kâğıt uçak) ekranın altında süzülür; DÜNYA bize doğru akar —
// ağaçlar, dağlar, bulutlar, turnalar, yıldızlar ufuktaki bir noktadan doğup büyüyerek (perspektif) kenarlardan geçip gider. Üstte irtifa göstergesi sayar,
// yanda yükselen bir ibre var; bölgeler: yer → bulut → gün batımı → yıldızlar → ay. Bölüm başlıkları ekrana patlayarak gelir.
// Yükselme / uçuş / tırmanış / keşif hikâyeleri için. Hikâye: brief.hikaye = [{ bolge?: 'yer'|'bulut'|'aksam'|'yildiz'|'ay', baslik, anlatim, altyazi?, irtifa?, ses? }]
import { hikayeKur, GOKYUZU, R2 } from './hikaye-ortak.mjs';

const UZAY = { bg: ['#030314', '#080824', '#10103a', '#1a1a55'], yazi: '#f5e6a8', alt: '#c9d6ea', golge: 'rgba(0,0,0,0.4)' };
const SIRA = ['yer', 'bulut', 'aksam', 'yildiz', 'ay'];
const IRTIFA = { yer: 80, bulut: 3200, aksam: 18000, yildiz: 380000, ay: 384400000 };

export default {
  id: 'hikaye-ucus',
  ad: 'Hikâye · Uçuş (ileri akış)',
  etiket: 'Hikâye · Derinlik · Uçuş · Tırmanış',
  sure: '40–80 sn',
  aciklama: 'Kamera sabit, kâğıt uçak süzülür; dünya bize doğru akar: ağaçlar, bulutlar, turnalar, yıldızlar ufuktan doğup büyüyerek yanımızdan geçer. İrtifa sayacı, yükselen ibre, patlayarak gelen bölüm başlıkları. Yer → bulut → gün batımı → yıldız → ay.',
  ornek: {
    sablon: 'hikaye-ucus', id: 'sablon-hikaye-ucus', ad: 'Kâğıt Uçağın Büyük Uçuşu', format: 'reels', muzik: 'lofi-90', font: 'Baloo 2', kahraman: 'kagit-ucak',
    baslik: 'Kâğıt Uçağın Büyük Uçuşu', altBaslik: 'bir çocuğun atışından aya',
    hikaye: [
      { bolge: 'yer', baslik: 'Kalkış', anlatim: 'Bir çocuk kâğıttan bir uçak katladı ve gökyüzüne fırlattı. Uçak, ağaçların ve tepelerin üzerinden yükselmeye başladı.', altyazi: 'Uçak yükselmeye başladı.' },
      { bolge: 'bulut', baslik: 'Bulutlar', anlatim: 'Uçak bulutların arasına daldı. Turnalar ona eşlik etti; hiç bu kadar yükseğe çıkmamıştı.', altyazi: 'Turnalar ona eşlik etti.' },
      { bolge: 'aksam', baslik: 'Gün batımı', anlatim: 'Güneş batarken gökyüzü pembeye ve turuncuya boyandı. Kâğıt uçak, altın ışığın içinde süzüldü.', altyazi: 'Altın ışığın içinde süzüldü.' },
      { bolge: 'yildiz', baslik: 'Yıldızlar', anlatim: 'Karanlık çöktüğünde yıldızlar yanına geldi. Uçak, yıldız tozunun içinde hızla ilerliyordu.', altyazi: 'Yıldız tozunun içinden geçti.' },
      { bolge: 'ay', baslik: 'Ay', anlatim: 'Sonunda ay göründü. Kâğıt uçak onun gümüş ışığına doğru süzüldü ve yolculuğunu tamamladı.', altyazi: 'Ay\'a vardı.' },
    ],
    son: 'Hayal kurmak uçmaktır', soru: 'Senin uçağın nereye giderdi?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Kâğıt uçağın büyük uçuşu: yerden aya', aciklama: 'Küçük bir kâğıt uçağın ağaçlardan bulutlara, yıldızlardan aya yolculuğu. Senin uçağın nereye giderdi?', etiketler: ['kagit-ucak', 'hikaye', 'uzay', 'hayal', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-ucus', { palet: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2', stil: brief.stil || 'origami' }, { kapakBeats: 8, kapSure: 10, minSn: 6.4 });
    const { c, W, H, k, fx, fy, lib, planlar, n, tAc, tK, tEnd, g } = Z;
    const sg = GOKYUZU;
    const KAHRAMAN = lib.has(brief.kahraman) ? brief.kahraman : 'kagit-ucak';
    const TAHTA = { yazi: '#23364a', kutu: 'rgba(255,255,255,0.85)', alt: '#3a5a6e', golge: 'rgba(0,0,0,0.25)' };
    const MONO = 'Space Mono';
    const bolge = planlar.map((pl, i) => (SIRA.includes(pl.s.bolge) ? pl.s.bolge : SIRA[Math.round((i * (SIRA.length - 1)) / Math.max(1, n - 1))]));
    const V = { x: W / 2, y: H * 0.4 }; // kaçış noktası
    const rnd = (a, b = 1) => ((Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 + 1) % 1;
    const gokOf = { yer: sg.gunduz.bg, bulut: ['#7fc3ea', '#cfeaf8', '#e8f5fc', '#bfe0f2'], aksam: sg.aksam.bg, yildiz: sg.gece.bg, ay: UZAY.bg };

    /** Perspektifle büyüyen geçit nesnesi: ufuk noktasından doğar, (ox, oy) uzaklığına kenarlardan çıkar. */
    const gecit = (id, asset, t, ox, oy, s0, s1, dur, o = {}) => {
      if (!lib.has(asset)) return;
      const t1 = t + dur;
      c.L({
        id, group: g, asset, ...(o.variant ? { variant: o.variant } : {}), ...(o.pal ? { palette: o.pal } : {}), anchor: o.anchor || [0.5, 0.5], start: R2(t), end: R2(t1 + 0.05),
        x: [k(t, R2(V.x + ox * 0.04)), k(t1, R2(V.x + ox), 'inQuad')], y: [k(t, R2(V.y + oy * 0.04)), k(t1, R2(V.y + oy), 'inQuad')],
        scale: [k(t, R2(s0 * fx)), k(t1, R2(s1 * fx), 'inQuad')], opacity: [k(t, 0), k(t + 0.4, 1, 'linear'), k(t1 - 0.45, 1, 'linear'), k(t1, 0, 'linear')],
        ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.ek || {}),
      });
    };

    // ── sabit: güneş ufku (akşam), ay (son), zemin bantları (kalkış) ───────
    const ilk = planlar[0].t0;
    const bIndis = (b) => bolge.findIndex((x) => x === b);
    const ai = bIndis('aksam');
    if (ai >= 0) {
      const a = planlar[ai];
      Z.ekle({ id: 'gunes-ufuk', group: g, asset: 'gunes', x: V.x, y: V.y + 90 * fy, anchor: [0.5, 0.5], scale: [k(a.t0, R2(0.9 * fx)), k(a.t1, R2(2.6 * fx), 'inQuad')], start: R2(a.t0 - 0.5), end: R2(a.t1 + 1.2),
        opacity: [k(a.t0 - 0.5, 0), k(a.t0 + 1.2, 1, 'linear'), k(a.t1, 1, 'linear'), k(a.t1 + 1.2, 0, 'linear')], palette: { a: '#ffb86b' } });
    }
    const mi = bIndis('ay');
    if (mi >= 0) {
      const a = planlar[mi];
      Z.ekle({ id: 'ay-ufuk', group: g, asset: 'hilal', x: V.x, y: V.y - 20 * fy, anchor: [0.5, 0.5], scale: [k(a.t0 + 0.5, R2(0.6 * fx)), k(tK - 1.2, R2(6.2 * fx), 'inQuad')], start: R2(a.t0 + 0.5), end: R2(tK + 0.2),
        opacity: [k(a.t0 + 0.5, 0), k(a.t0 + 2, 1, 'linear')], rotation: [k(a.t0 + 0.5, -8), k(tK - 1.2, 6, 'linear')] });
    }
    const yi = bIndis('yer');
    if (yi >= 0) {
      const a = planlar[yi];
      [[1290, 3.9, { a: '#a9d28b', b: '#8fc274' }], [1450, 4.3, { a: '#8fc274', b: '#74ab5c' }], [1640, 4.8, { a: '#74ab5c', b: '#5e9449' }]].forEach(([y, s, pal], q) => Z.bant(`zemin-${q}`, 'tepeler', y, s, pal, {
        x: 540, amp: 20, per: 6, n: q, t0: 0.1 + q * 0.18, t1: a.t1 + 3.5, fark: 700,
      }));
      // zeminler uçak yükselirken aşağı kayıp çıkar
      ['zemin-0', 'zemin-1', 'zemin-2'].forEach((id, q) => {
        const L = c.layers.find((l) => l.id === id);
        if (!L) return;
        const y0 = [1290, 1450, 1640][q] * fy;
        L.y = [k(0.1 + q * 0.18, (y0 + 700 * fy)), k(1.3 + q * 0.18, y0, 'outCubic'), k(a.t0 + 1.5, y0, 'linear'), k(a.t1 + 3, 2300 * fy, 'inQuad')];
      });
    }

    // ── geçitler: bölgeye göre akan dünya ─────────────────────────────────
    planlar.forEach((pl, i) => {
      const zon = bolge[i];
      const adim = zon === 'yildiz' ? 0.16 : 0.34;
      let q = 0;
      for (let t = pl.t0 + 0.4; t < pl.t1 - 0.4; t += adim, q++) {
        const yan = q % 2 ? 1 : -1;
        const r1 = rnd(i * 97 + q, 1);
        const r2 = rnd(i * 97 + q, 2);
        const dur = 2.6 + r1 * 0.8;
        const id = (a) => `gecit-${i}-${q}-${a}`;
        if (zon === 'yer') {
          gecit(id('a'), q % 3 === 2 ? 'dag' : 'cam-agaci', t, yan * (560 + r1 * 520), 360 + r2 * 260, q % 3 === 2 ? 0.25 : 0.2, q % 3 === 2 ? 4.2 : 4.0, dur, { anchor: [0.5, 1] });
        } else if (zon === 'bulut' || zon === 'aksam') {
          gecit(id('a'), 'bulut', t, yan * (240 + r1 * 600), -320 + r2 * 760, 0.3, 5.4, dur, zon === 'aksam' ? { variant: 'pembe' } : undefined);
          if (q % 4 === 1) gecit(id('b'), zon === 'bulut' ? 'turna' : 'marti', t + 0.2, -yan * (260 + r2 * 360), -160 + r1 * 380, 0.2, 2.6, dur, { ek: Z.kanat(zon === 'bulut' ? 'turna' : 'marti', 0.45) });
        } else if (zon === 'yildiz') {
          const ac = r1 * Math.PI * 2;
          gecit(id('a'), 'yildiz', t, Math.cos(ac) * (620 + r2 * 520), Math.sin(ac) * (700 + r2 * 520), 0.03, 0.55 + r1 * 0.4, 2.1 + r2 * 0.6, { pal: { a: '#fff2b3' }, rot: R2(r1 * 90) });
        } else {
          gecit(id('a'), 'yildiz', t, yan * (360 + r1 * 600), -420 + r2 * 840, 0.03, 0.4, dur, { pal: { a: '#fff2b3' } });
        }
      }
    });

    // ── kahraman: kâğıt uçak ──────────────────────────────────────────────
    const tUc = tK - 1.2;
    Z.ekle({
      id: 'kahraman', group: g, asset: KAHRAMAN, start: 0.3, x: [k(0.3, W / 2), k(tUc, W / 2, 'linear'), k(tK, V.x, 'inQuad')], y: [k(0.3, 1900 * fy), k(1.4, 1420 * fy, 'outBack'), k(tUc, 1420 * fy, 'linear'), k(tK, R2(V.y + 20 * fy), 'inQuad')], anchor: [0.5, 0.5],
      scale: [k(0.3, R2(2.2 * fx)), k(tUc, R2(2.2 * fx), 'linear'), k(tK, R2(0.35 * fx), 'inQuad')], rotation: [k(0.3, -20), k(1.4, 0, 'outCubic')],
      loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 2.6 }, { prop: 'x', type: 'sine', amp: 38, period: 5.2 }, { prop: 'y', type: 'sine', amp: 14, period: 1.9, phase: 0.4 }],
    });
    // kanat uçlarından uzanan rüzgâr çizgileri
    [-1, 1].forEach((yon, q) => c.sekil(`iz-${q}`, 'kare', W / 2 + yon * 150, 1700, 200, { t0: 1.5, t1: tUc, renk: '#ffffff', opacity: 0.28, giris: 'yok', grup: g, sx: 4 / 200, sy: 560 / 200, blur: 2, extra: { loops: [{ prop: 'opacity', type: 'sine', amp: 0.1, period: 1.1, phase: q }, { prop: 'x', type: 'sine', amp: 38, period: 5.2 }] } }));

    // ── HUD: irtifa sayacı + yükselen ibre ────────────────────────────────
    const gH = c.grup('g-hud', 'İrtifa', true);
    c.L({ id: 'hud-etiket', group: gH, type: 'text', text: 'İRTİFA', font: MONO, weight: 700, size: 30, color: '#ffffff', align: 'left', x: 60, y: Math.round(H * 0.05), start: R2(ilk), stroke: { color: 'rgba(20,40,70,0.7)', width: 8 } });
    let prev = 0;
    planlar.forEach((pl, i) => {
      const hedef = Number(pl.s.irtifa) || IRTIFA[bolge[i]] || (i + 1) * 1000;
      c.sayac(`hud-deger-${i}`, prev, hedef, pl.t0 + 0.4, Math.min(3.2, pl.t1 - pl.t0 - 1), { x: 60, y: H * 0.085, size: 56, maxW: 420, font: MONO, weight: 700, renk: '#ffe9a8', grup: gH, t1: pl.t1, suffix: ' m', stroke: { color: 'rgba(20,40,70,0.7)', width: 8 } });
      c.layers[c.layers.length - 1].align = 'left';
      prev = hedef;
    });
    c.sekil('ibre-iz', 'kare', W - 60, H * 0.37, 200, { t0: ilk, t1: tK, renk: '#ffffff', opacity: 0.4, giris: 'yok', grup: gH, sx: 5 / 200, sy: (H * 0.5) / 200 });
    const ibreY = [k(ilk, H * 0.6)];
    planlar.forEach((pl, i) => ibreY.push(k(pl.t0 + 0.4, ibreY[ibreY.length - 1].v, 'linear'), k(pl.t0 + 3, H * (0.6 - 0.46 * ((i + 1) / n)), 'inOutCubic')));
    c.sekil('ibre', 'daire', W - 60, H * 0.6, 34, { t0: ilk, t1: tK, renk: '#ffe9a8', giris: 'yok', grup: gH, extra: { y: ibreY.filter((e, q, arr) => !q || e.t > arr[q - 1].t) } });

    // ── bölüm başlığı patlaması + altyazı ─────────────────────────────────
    Z.acilis({ yazi: sg.gunduz.yazi, alt: sg.gunduz.alt, golge: sg.gunduz.golge }, { y: 0.12 });
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = pl.t0;
      const t1 = pl.t1;
      c.bolum(t0, s.baslik || `Bölüm ${i + 1}`);
      c.L({ id: `bolum-${i}`, group: g, type: 'text', text: (s.baslik || '').toUpperCase(), font: Z.font, weight: 800, size: 150, color: '#ffffff', x: W / 2, y: Math.round(H * 0.3), align: 'center', start: R2(t0 + 0.1), end: R2(t0 + 1.9), lineHeight: 1,
        stroke: { color: 'rgba(30,60,100,0.6)', width: 18 }, scale: [k(t0 + 0.1, 2.2), k(t0 + 0.5, 1, 'outBack'), k(t0 + 1.9, 1.2, 'linear')], opacity: [k(t0 + 0.1, 0), k(t0 + 0.3, 1, 'linear'), k(t0 + 1.4, 1, 'linear'), k(t0 + 1.9, 0, 'linear')] });
      c.halka(`bolum-halka-${i}`, t0 + 0.1, V.x, V.y, '#ffffff', { group: g, alfa: 0.5, boyut: 60, son: 1300, sure: 0.9 });
      Z.altyazi(`altyazi-${i}`, s.altyazi || s.anlatim, t0 + 1.7, t1 - 0.1, TAHTA, { y: 0.19 });
      Z.ses(pl, t0 + 0.5);
    });

    Z.kapanis({ yazi: UZAY.yazi, alt: '#ffffff' }, { perde: 0.2 });
    // gökyüzü rengi bölgeye göre
    const gok = Z.gokyuzu([{ t: 0, bg: sg.gunduz.bg }, ...planlar.map((pl, i) => ({ t: pl.t0 + 1.2, bg: gokOf[bolge[i]] })), { t: tK, bg: UZAY.bg }], { sure: 2.4 });
    return Z.bitir({ background: gok, camera: { zoom: [k(0, 1.12), k(3, 1, 'inOutCubic')], x: W / 2, y: H / 2 } }, { yazi: sg.gunduz.yazi, alt: sg.gunduz.alt });
  },
};
