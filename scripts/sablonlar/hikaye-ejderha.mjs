// Hikâye · EJDERHA VE KÜÇÜK ŞÖVALYE (kendi modelleriyle, ÇİZGİ ROMAN): sayfa sayfa çizgi roman. Her sayfa bir panel düzeni (3'lü / dinamik), her panel kendi mini manzarası:
// kale, yürüyüş, mağara, ejderhanın çıkışı, ağlayan ejderha yakın planı, barışma, gün batımı uçuşu. Paneller perde gibi açılır, konuşma balonları ve ses efektleri (GRRR!) çıkar.
// Panel çerçevesi delikli bir sayfa modelidir (kenardan taşan içerik kırpılır). Modeller: scripts/hikaye-modeller/ejderha.mjs (npm run seed:hikaye).
// Hikâye: brief.hikaye = [{ sahne: 'kale'|'yol'|'magara'|'ejderha'|'agla'|'dostluk'|'ucus', anlatim, altyazi?, konus?: 'Balon metni', ses_efekti?: 'GRRR!', ses? }]
//   Her 3 / 4 panel bir sayfadır (ilk sayfa üçlü, ikinci sayfa dinamik düzen; sayfa dizilimi `brief.sayfalar` ile değiştirilebilir: ['uc','dinamik']).
import { hikayeKur, R2 } from './hikaye-ortak.mjs';
import { DUZEN } from '../hikaye-modeller/panel-duzen.mjs';

const KAGIT = '#f6ecd6';
const MUREKKEP = '#241c2e';
const SARI = '#ffd24a';

export default {
  id: 'hikaye-ejderha',
  ad: 'Hikâye · Ejderha ve Küçük Şövalye (çizgi roman)',
  etiket: 'Hikâye · Özel modeller · Çizgi roman · Paneller',
  sure: '60–110 sn',
  aciklama: 'Sayfa sayfa çizgi roman: paneller perde gibi açılır, her panelin kendi mini manzarası (kale, yol, mağara, ejderha, yakın plan, barışma, gün batımı uçuşu). Konuşma balonları, ses efektleri, tatlı ejderha ve küçük şövalye (özel modeller).',
  ornek: {
    sablon: 'hikaye-ejderha', id: 'sablon-hikaye-ejderha', ad: 'Küçük Şövalye ve Ejderha', format: 'reels', muzik: 'lofi-90', font: 'Bungee',
    kanca: 'Yeni macera!', baslik: 'Küçük Şövalye & Ejderha', altBaslik: 'çizgi roman',
    hikaye: [
      { sahne: 'kale', anlatim: 'Dağın tepesindeki kalede küçük bir şövalye yaşardı.', altyazi: 'Dağın tepesindeki kalede küçük bir şövalye yaşardı.' },
      { sahne: 'yol', anlatim: 'Bir gün cesaretini topladı ve ejderhanın mağarasına doğru yola çıktı.', altyazi: 'Cesaretini topladı ve yola çıktı.', konus: 'Korkmuyorum!' },
      { sahne: 'magara', anlatim: 'Mağaranın içinden garip bir ses geliyordu.', altyazi: 'Mağaradan garip bir ses geliyordu...', ses_efekti: 'GRRR...' },
      { sahne: 'ejderha', anlatim: 'Ejderha birden dışarı çıktı! Şövalye kılıcını kaldırdı.', altyazi: 'Ejderha dışarı çıktı!', konus: 'Dur! Seninle dövüşeceğim!' },
      { sahne: 'agla', anlatim: 'Ama ejderha ağlıyordu. Kimse onunla oynamıyordu.', altyazi: 'Ama ejderha ağlıyordu...', konus: 'Kimse benimle oynamıyor...' },
      { sahne: 'dostluk', anlatim: 'Şövalye kılıcını indirdi ve ona bir çiçek uzattı.', altyazi: 'Şövalye kılıcını indirdi.', konus: 'Ben seninle oynarım!' },
      { sahne: 'ucus', anlatim: 'O günden sonra en iyi arkadaş oldular ve gün batımına doğru birlikte uçtular.', altyazi: 'O günden sonra en iyi arkadaş oldular.' },
    ],
    son: 'Cesaret, nazik olmaktır', soru: 'Sen kime arkadaş oldun?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Küçük Şövalye ve Ejderha: bir çizgi roman', aciklama: 'Küçük şövalye ejderhayla dövüşmeye gider ama ejderha ağlıyordur. Çizgi roman tadında şirin bir dostluk masalı. Sen kime arkadaş oldun?', etiketler: ['masal', 'hikaye', 'ejderha', 'sovalye', 'cizgi-roman', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-ejderha', { palet: 'okyanus', muzik: 'lofi-90', font: 'Bungee', stil: brief.stil || 'kagit-kesme' }, { kapakBeats: 8, kapSure: 10, minSn: 7.0 });
    const { c, W, H, k, n, planlar, lib, tAc, tK, tEnd, g } = Z;
    const need = ['ej-ejderha', 'ej-sovalye', 'ej-kale', 'ej-kaya', 'ej-magara', 'ej-alev', 'ej-hazine', 'ej-sayfa-uc', 'ej-sayfa-iki', 'ej-sayfa-dinamik'];
    const eksik = need.filter((a) => !lib.has(a));
    if (eksik.length) throw new Error(`Ejderha modelleri eksik (${eksik.join(', ')}). Önce: npm run seed:hikaye`);
    const iz = (a) => { const o = []; a.forEach(([t, v, e]) => { if (!o.length || t > o[o.length - 1].t) o.push(k(R2(t), v, e)); }); return o; };
    const FONT = 'Baloo 2';

    // ── sayfa düzeni: panelleri sayfalara dağıt ───────────────────────────
    const sayfaAd = brief.sayfalar || ['uc', 'dinamik', 'uc'];
    const sayfalar = [];
    let i0 = 0;
    for (const ad of sayfaAd) {
      const duzen = DUZEN[ad] || DUZEN.uc;
      if (i0 >= n) break;
      sayfalar.push({ ad, duzen, indisler: planlar.slice(i0, i0 + duzen.length).map((_, q) => i0 + q) });
      i0 += duzen.length;
    }

    // ── ortak çizim araçları (panel koordinatı) ───────────────────────────
    let sayac = 0;
    const mk = (pn, bas, son) => {
      const [X0, Y0, X1, Y1] = pn;
      const ctx = { X0, Y0, w: X1 - X0, h: Y1 - Y0, t0: bas, t1: son };
      const kayX = (v) => (typeof v === 'number' ? X0 + v : v.map((e) => ({ ...e, v: R2(X0 + e.v) })));
      const kayY = (v) => (typeof v === 'number' ? Y0 + v : v.map((e) => ({ ...e, v: R2(Y0 + e.v) })));
      ctx.P = (spec) => {
        if (spec.asset && !lib.has(spec.asset)) return null;
        const L = { id: `p${++sayac}`, group: g, ...spec, x: kayX(spec.x ?? 0), y: kayY(spec.y ?? 0), start: R2(spec.start ?? bas), end: R2(spec.end ?? son + 0.4) };
        return c.L(L);
      };
      ctx.zemin = (ust, alt, bolum = 0.55) => {
        ctx.P({ asset: 'kare', x: ctx.w / 2, y: ctx.h / 2, scale: 1, scaleX: (ctx.w + 40) / 200, scaleY: (ctx.h + 40) / 200, palette: { a: ust } });
        ctx.P({ asset: 'kare', x: ctx.w / 2, y: ctx.h * (1 - bolum / 2) + 8, scale: 1, scaleX: (ctx.w + 20) / 200, scaleY: (ctx.h * bolum + 20) / 200, palette: { a: alt }, blur: 10 });
      };
      // yuvarlak köşeli kutu (kontürlü): kontur + dolgu
      ctx.kutu = (cx, cy, bw, bh, r, dolgu, bas2, kontur = MUREKKEP) => {
        const parca = (cx2, cy2, w2, h2, r2, renk, id) => {
          ctx.P({ asset: 'kare', x: cx2, y: cy2, scale: 1, scaleX: (w2 - 2 * r2) / 200, scaleY: h2 / 200, palette: { a: renk }, start: bas2 });
          ctx.P({ asset: 'kare', x: cx2, y: cy2, scale: 1, scaleX: w2 / 200, scaleY: (h2 - 2 * r2) / 200, palette: { a: renk }, start: bas2 });
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => ctx.P({ asset: 'daire', x: cx2 + dx * (w2 / 2 - r2), y: cy2 + dy * (h2 / 2 - r2), scale: R2((r2 * 2) / 200), palette: { a: renk }, start: bas2 }));
        };
        parca(cx, cy, bw + 10, bh + 10, r + 4, kontur);
        parca(cx, cy, bw, bh, r, dolgu);
      };
      // konuşma balonu
      ctx.balon = (cx, cy, metin, bas2, kuyrukYon = 'sol', size = 46) => {
        const sat = Math.ceil(metin.length / 14);
        const bw = Math.min(ctx.w - 60, Math.max(220, Math.min(metin.length, 14) * size * 0.56 + 56));
        const bh = sat * size * 1.1 + 40;
        const px = Math.max(bw / 2 + 24, Math.min(ctx.w - bw / 2 - 24, cx));
        ctx.kutu(px, cy, bw, bh, 30, '#ffffff', bas2);
        ctx.P({ asset: 'ucgen', x: px + (kuyrukYon === 'sol' ? -bw * 0.2 : bw * 0.2), y: cy + bh / 2 + 24, scale: 0.28, palette: { a: MUREKKEP }, rotation: kuyrukYon === 'sol' ? 190 : 170, start: bas2 });
        ctx.P({ asset: 'ucgen', x: px + (kuyrukYon === 'sol' ? -bw * 0.2 : bw * 0.2), y: cy + bh / 2 + 20, scale: 0.22, palette: { a: '#ffffff' }, rotation: kuyrukYon === 'sol' ? 190 : 170, start: bas2 });
        let satirlar = [];
        const kel = metin.split(' ');
        let cur = '';
        kel.forEach((w2) => { if (cur && (cur + ' ' + w2).length > 14) { satirlar.push(cur); cur = w2; } else cur = cur ? `${cur} ${w2}` : w2; });
        if (cur) satirlar.push(cur);
        ctx.P({ type: 'text', text: satirlar.join('\n'), font: FONT, weight: 800, size, color: MUREKKEP, x: px, y: cy, align: 'center', lineHeight: 1.08, start: bas2 + 0.1,
          opacity: iz([[bas2 + 0.1, 0], [bas2 + 0.3, 1]]), scale: iz([[bas2 + 0.1, 0.7], [bas2 + 0.5, 1, 'outBack']]) });
      };
      // sarı anlatım kutusu
      ctx.altyazi = (metin, bas2, ust = true) => {
        const size = 40;
        const sat = Math.ceil(metin.length / 26);
        const bw = Math.min(ctx.w - 50, Math.max(260, Math.min(metin.length, 26) * size * 0.52 + 50));
        const bh = sat * size * 1.12 + 26;
        const cy = ust ? bh / 2 + 22 : ctx.h - bh / 2 - 22;
        ctx.P({ asset: 'kare', x: 24 + bw / 2 + 5, y: cy + 5, scale: 1, scaleX: bw / 200, scaleY: bh / 200, palette: { a: MUREKKEP }, start: bas2 });
        ctx.P({ asset: 'kare', x: 24 + bw / 2, y: cy, scale: 1, scaleX: bw / 200, scaleY: bh / 200, palette: { a: SARI }, start: bas2 });
        const kel = metin.split(' ');
        const satirlar = []; let cur = '';
        kel.forEach((w2) => { if (cur && (cur + ' ' + w2).length > 26) { satirlar.push(cur); cur = w2; } else cur = cur ? `${cur} ${w2}` : w2; });
        if (cur) satirlar.push(cur);
        ctx.P({ type: 'text', text: satirlar.join('\n'), font: FONT, weight: 700, size, color: MUREKKEP, x: 24 + bw / 2, y: cy, align: 'center', lineHeight: 1.1, start: bas2, reveal: iz([[bas2 + 0.1, 0], [bas2 + 0.1 + Math.min(1.8, metin.length * 0.05), 1, 'linear']]) });
      };
      // ses efekti (kontürlü, devasa)
      ctx.sfx = (metin, x, y, renk, bas2, rot = -8, size = 110) => ctx.P({ type: 'text', text: metin, font: 'Bungee', weight: 400, size, color: renk, x, y, align: 'center', rotation: rot, start: bas2, stroke: { color: MUREKKEP, width: 18 },
        shadow: { color: 'rgba(0,0,0,0.35)', blur: 0, y: 8 }, scale: iz([[bas2, 0.2], [bas2 + 0.35, 1.15, 'outBack'], [bas2 + 0.55, 1, 'inOutSine']]), loops: [{ prop: 'rotation', type: 'sine', amp: 2.5, period: 0.6 }] });
      return ctx;
    };

    // ── sahne kütüphanesi ─────────────────────────────────────────────────
    const SAHNE = {
      kale(x, s) {
        const { w, h, t0 } = x;
        x.zemin('#8fc9ee', '#fbdcae', 0.5);
        x.P({ asset: 'kervan-gunes', variant: 'aksam', x: 790, y: 130, scale: 0.5, loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }] });
        x.P({ asset: 'bulut', x: iz([[t0, 160], [t0 + 8, 300, 'linear']]), y: 110, scale: 1.2 });
        x.P({ asset: 'bulut', x: iz([[t0, 640], [t0 + 8, 540, 'linear']]), y: 180, scale: 0.8 });
        x.P({ asset: 'dag', x: 190, y: h + 6, anchor: [0.5, 1], scale: 3.4, palette: { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' } });
        x.P({ asset: 'dag', x: 820, y: h + 6, anchor: [0.5, 1], scale: 3.0, palette: { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' } });
        x.P({ asset: 'ej-kaya', x: 520, y: h + 20, anchor: [0.5, 1], scale: 1.05, start: s.t0 });
        x.P({ asset: 'ej-kale', x: 520, y: h - 296, anchor: [0.5, 1], scale: 0.64, parts: { bayrak1: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.8 }] }, bayrak2: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.9, phase: 1 }] } },
         });
        x.P({ asset: 'turna', x: iz([[t0, -60], [t0 + 9, 1040, 'linear']]), y: 240, scale: 0.55, loops: [{ prop: 'y', type: 'sine', amp: 10, period: 1.6 }], parts: { wingFront: { scaleY: 0.3, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.7, period: 0.7 }] } } });
      },
      yol(x, s) {
        const { w, h, t0, t1 } = x;
        x.zemin('#ffa76e', '#ffe0a0', 0.55);
        x.P({ asset: 'kervan-gunes', variant: 'aksam', x: 770, y: 250, scale: 0.55 });
        x.P({ asset: 'tepeler', x: 300, y: 330, anchor: [0.5, 0], scale: 2.7, palette: { a: '#c9a15a', b: '#b8864a' } });
        x.P({ asset: 'tepeler', x: 760, y: 380, anchor: [0.5, 0], scale: 2.7, palette: { a: '#a9b95a', b: '#8fa14a' } });
        x.P({ asset: 'ej-magara', x: 840, y: 440, anchor: [0.5, 1], scale: 0.62 });
        [[90, 470, 1.7], [210, 480, 1.4]].forEach(([cx, cy, sc]) => x.P({ asset: 'cam-agaci', x: cx, y: cy, anchor: [0.5, 1], scale: sc }));
        x.P({ asset: 'kare', x: w / 2, y: h - 50, scale: 1, scaleX: (w + 40) / 200, scaleY: 130 / 200, palette: { a: '#8a9a4a' } });
        x.P({ asset: 'kare', x: w / 2, y: h - 26, scale: 1, scaleX: (w + 40) / 200, scaleY: 60 / 200, palette: { a: '#c9a15a' } });
        x.P({ asset: 'ej-sovalye', x: iz([[t0 + 0.4, 130], [t1 - 0.4, 640, 'linear']]), y: h - 48, anchor: [0.5, 1], scale: 1.45, start: t0 + 0.2, loops: [{ prop: 'y', type: 'sine', amp: 6, period: 0.5 }, { prop: 'rotation', type: 'sine', amp: 2.5, period: 1.0 }],
          parts: { pelerin: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 0.5 }] }, tuy: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 0.6 }] } } });
      },
      magara(x, s) {
        const { w, h, t0 } = x;
        x.zemin('#2a2040', '#4b3a70', 0.5);
        for (let q = 0; q < 14; q++) x.P({ asset: 'yildiz', x: 40 + ((q * 233) % 900), y: 30 + ((q * 97) % 200), scale: R2(0.04 + (q % 3) * 0.02), palette: { a: '#fff2b3' }, loops: [{ prop: 'opacity', type: 'sine', amp: 0.3, period: 1.5 + q * 0.17 }] });
        x.P({ asset: 'fener-ay', x: 130, y: 120, scale: 0.3 });
        x.P({ asset: 'ej-magara', x: 620, y: h + 24, anchor: [0.5, 1], scale: 1.5, variant: 'gece', start: t0 });
        // parlayan gözler
        [[600, 340], [680, 340]].forEach(([ex, ey], q) => {
          x.P({ asset: 'daire', x: ex, y: ey, scale: 0.15, palette: { a: '#ffd24a' }, blur: 10, start: t0 + 2.2, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.05, period: 2.4 }] });
          x.P({ asset: 'daire', x: ex, y: ey, scale: 0.09, palette: { a: '#fff4b0' }, start: t0 + 2.2 + q * 0.05, scaleY: iz([[t0 + 2.2, 1], [t0 + 4.4, 1], [t0 + 4.55, 0.1], [t0 + 4.7, 1]]) });
        });
        x.P({ asset: 'ej-sovalye', x: 220, y: h - 8, anchor: [0.5, 1], scale: 1.6, scaleX: 1, start: t0 + 0.3, fold: iz([[t0 + 0.3, 0], [t0 + 1.1, 1, 'linear']]), loops: [{ prop: 'rotation', type: 'sine', amp: 1.2, period: 2 }], parts: { pelerin: { loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 1 }] } } });
        if (s.ses_efekti) x.sfx(s.ses_efekti, 760, 90, '#ff6a4a', t0 + 1.8);
      },
      ejderha(x, s) {
        const { w, h, t0 } = x;
        x.zemin('#3a3470', '#e8805c', 0.55);
        x.P({ asset: 'kervan-gunes', variant: 'aksam', x: 480, y: h - 170, scale: 0.8, start: t0 });
        x.P({ asset: 'dag', x: 150, y: h + 4, anchor: [0.5, 1], scale: 3.4, palette: { a: '#5a4a86', b: '#43386a', c: '#7a68a8' } });
        x.P({ asset: 'dag', x: 840, y: h + 4, anchor: [0.5, 1], scale: 3.1, palette: { a: '#6a5496', b: '#4d3d78', c: '#8c76b8' } });
        x.P({ asset: 'kare', x: w / 2, y: h - 30, scale: 1, scaleX: (w + 40) / 200, scaleY: 110 / 200, palette: { a: '#5a3a4a' } });
        x.P({ asset: 'ej-ejderha', x: iz([[t0 + 0.5, 1180], [t0 + 1.4, 640, 'outBack']]), y: iz([[t0 + 0.5, h - 120], [t0 + 1.4, h - 70, 'outBack']]), anchor: [0.5, 1], scale: 1.45, start: t0 + 0.5, loops: [{ prop: 'y', type: 'sine', amp: 8, period: 1.4 }],
          parts: { kanatOn: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.8 }] }, kanatArka: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.8, phase: 0.3 }] }, kuyruk: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 1.2 }] } } });
        x.P({ asset: 'ej-sovalye', x: 190, y: h - 40, anchor: [0.5, 1], scale: 1.75, start: t0 + 0.3, fold: iz([[t0 + 0.3, 0], [t0 + 1, 1, 'linear']]), parts: { kilic: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 0.5 }] }, tuy: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 0.6 }] }, pelerin: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 0.5 }] } } });
        x.sfx('!', 420, 160, '#ffd24a', t0 + 1.4, 12, 150);
      },
      agla(x, s) {
        const { w, h, t0 } = x;
        x.zemin('#322e5e', '#6a5f9a', 0.6);
        x.P({ asset: 'fener-ay', x: 420, y: 100, scale: 0.34 });
        const sc = 2.5;
        x.P({ asset: 'ej-ejderha', variant: 'mor', x: 250 - 360 * sc, y: 360 - 98 * sc, anchor: [0, 0], scale: sc, start: t0, loops: [{ prop: 'y', type: 'sine', amp: 7, period: 0.55 }], parts: { kanatOn: { loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 1.4 }] } } });
        // gözyaşları (göz: x≈250+8*sc, y≈360-14*sc civarı)
        const ex = 250 + 10 * sc; const ey = 360 - 6 * sc;
        for (let q = 0; q < 4; q++) {
          const xs = []; const ys = []; const os = [];
          for (let t = t0 + 1 + q * 0.5; t < s.t1 + 0.5; t += 1.9) { xs.push([t, ex - q * 6], [t + 1.9, ex - q * 6 + 6, 'linear']); ys.push([t, ey + 30], [t + 1.9, ey + 560, 'inQuad']); os.push([t, 0], [t + 0.3, 1, 'linear'], [t + 1.6, 1, 'linear'], [t + 1.9, 0, 'linear']); }
          x.P({ asset: 'damla', x: iz(xs), y: iz(ys), scale: R2(0.2 + (q % 2) * 0.05), palette: { a: '#8ad8ff' }, opacity: iz(os), start: t0 + 1 + q * 0.5 });
        }
        x.sfx('SNIF...', 280, 880, '#b8d8ff', t0 + 1.6, 6, 80);
      },
      dostluk(x, s) {
        const { w, h, t0 } = x;
        x.zemin('#ffd8a0', '#ffb0a0', 0.5);
        x.P({ asset: 'kervan-gunes', variant: 'aksam', x: 330, y: 150, scale: 0.45 });
        x.P({ asset: 'tepeler', x: 215, y: h - 120, anchor: [0.5, 0], scale: 2.2, palette: { a: '#9fc26a', b: '#85ab54' } });
        x.P({ asset: 'ej-ejderha', variant: 'mor', x: 340, y: h + 30, anchor: [0.5, 1], scale: 0.95, start: t0, loops: [{ prop: 'y', type: 'sine', amp: 4, period: 1.2 }], parts: { kuyruk: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.5 }] } } });
        x.P({ asset: 'ej-sovalye', x: 110, y: h - 30, anchor: [0.5, 1], scale: 1.7, start: t0 + 0.2, parts: { kilic: { rotation: 60, loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 1 }] }, tuy: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 0.6 }] } } });
        x.P({ asset: 'lale', x: 232, y: h - 70, anchor: [0.5, 1], scale: 1.0, start: t0 + 1.2, fold: iz([[t0 + 1.2, 0], [t0 + 2, 1, 'linear']]), loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 1.4 }] });
        for (let q = 0; q < 3; q++) x.P({ asset: 'kalp', x: iz([[t0 + 2.5 + q * 0.8, 250 + q * 30], [t0 + 5 + q * 0.8, 260 + q * 40, 'linear']]), y: iz([[t0 + 2.5 + q * 0.8, h - 260], [t0 + 5 + q * 0.8, h - 420, 'linear']]), scale: 0.26, palette: { a: '#ff6f91' }, start: t0 + 2.5 + q * 0.8, end: t0 + 5.2 + q * 0.8, opacity: iz([[t0 + 2.5 + q * 0.8, 0], [t0 + 3 + q * 0.8, 1, 'linear'], [t0 + 5 + q * 0.8, 0, 'linear']]) });
      },
      ucus(x, s) {
        const { w, h, t0, t1 } = x;
        x.zemin('#ff9a62', '#ffd08a', 0.55);
        x.P({ asset: 'kervan-gunes', variant: 'aksam', x: 215, y: 250, scale: 0.85, loops: [{ prop: 'rotation', type: 'sine', amp: 4, period: 8 }] });
        x.P({ asset: 'dag', x: 120, y: h + 6, anchor: [0.5, 1], scale: 2.6, palette: { a: '#7a5a86', b: '#5d4570', c: '#8c76a0' } });
        x.P({ asset: 'ej-kale', variant: 'gece', x: 330, y: h + 8, anchor: [0.5, 1], scale: 0.42 });
        x.P({ asset: 'bulut', x: iz([[t0, 120], [t0 + 8, 20, 'linear']]), y: 120, scale: 0.9, palette: { a: '#ffe4c4' } });
        const px = iz([[t0 + 0.4, 70], [t1 - 0.4, 360, 'inOutSine']]);
        const py = iz([[t0 + 0.4, 330], [t0 + 3, 290, 'inOutSine'], [t1 - 0.4, 260, 'inOutSine']]);
        x.P({ asset: 'ej-ejderha', variant: 'mor', x: px, y: py, anchor: [0.5, 0.5], scale: 0.64, start: t0 + 0.3, loops: [{ prop: 'y', type: 'sine', amp: 10, period: 1.1 }, { prop: 'rotation', type: 'sine', amp: 3, period: 2.2 }],
          parts: { kanatOn: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.7 }] }, kanatArka: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.7, phase: 0.3 }] }, kuyruk: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.9 }] } } });
        x.P({ asset: 'ej-sovalye', x: iz(px.map((e) => [e.t, e.v + 14])), y: iz(py.map((e) => [e.t, e.v - 62])), anchor: [0.5, 1], scale: 0.4, start: t0 + 0.3, loops: [{ prop: 'y', type: 'sine', amp: 10, period: 1.1 }], parts: { kilic: { rotation: 20 }, tuy: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.5 }] }, pelerin: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.5 }] } } });
        for (let q = 0; q < 4; q++) x.P({ asset: 'kalp', x: iz([[t0 + 2 + q * 1.2, 150 + q * 40], [t0 + 5 + q * 1.2, 190 + q * 30, 'linear']]), y: iz([[t0 + 2 + q * 1.2, 230], [t0 + 5 + q * 1.2, 90, 'linear']]), scale: 0.18, palette: { a: '#ff6f91' }, start: t0 + 2 + q * 1.2, end: t0 + 5.2 + q * 1.2, opacity: iz([[t0 + 2 + q * 1.2, 0], [t0 + 2.5 + q * 1.2, 1, 'linear'], [t0 + 5 + q * 1.2, 0, 'linear']]) });
      },
    };

    // ── kapak (dergi kapağı) ──────────────────────────────────────────────
    c.bolum(0, 'Kapak');
    const kg = c.grup('g-kapak', 'Kapak', true);
    const kp = (o) => c.L({ group: kg, end: R2(tAc), ...o });
    kp({ id: 'kapak-zemin', asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.2) / 200, scaleY: (H * 1.2) / 200, palette: { a: '#33295a' } });
    kp({ id: 'kapak-isinlar', asset: 'kervan-gunes', variant: 'aksam', x: W / 2, y: 1100, scale: 3.4, opacity: 0.35, rotation: iz([[0, 0], [tAc, 30, 'linear']]) });
    kp({ id: 'kapak-kale', asset: 'ej-kale', variant: 'gece', x: 270, y: 1520, anchor: [0.5, 1], scale: 0.9, opacity: 0.9 });
    kp({ id: 'kapak-ejderha', asset: 'ej-ejderha', x: iz([[0.2, 1300], [1.6, 680, 'outBack']]), y: 1420, anchor: [0.5, 1], scale: 1.65, parts: { kanatOn: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 0.9 }] }, kanatArka: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 0.9, phase: 0.3 }] } }, loops: [{ prop: 'y', type: 'sine', amp: 10, period: 1.6 }] });
    kp({ id: 'kapak-sovalye', asset: 'ej-sovalye', x: 230, y: iz([[0.5, 1900], [1.6, 1610, 'outBack']]), anchor: [0.5, 1], scale: 1.9, parts: { kilic: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 0.6 }] }, tuy: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 0.6 }] } } });
    c.L({ id: 'kapak-kanca', group: kg, type: 'text', text: (brief.kanca || '').toUpperCase(), font: 'Bungee', size: 56, color: SARI, x: W / 2, y: 190, align: 'center', stroke: { color: MUREKKEP, width: 14 }, start: 0.3, end: R2(tAc), rotation: -3, scale: iz([[0.3, 0.2], [0.9, 1.1, 'outBack'], [1.2, 1]]) });
    c.L({ id: 'kapak-baslik', group: kg, type: 'text', text: (brief.baslik || brief.ad).replace(' & ', '\n&\n'), font: 'Bungee', size: 118, color: '#ffffff', x: W / 2, y: 520, align: 'center', lineHeight: 1.02, start: 0.6, end: R2(tAc), stroke: { color: MUREKKEP, width: 22 }, shadow: { color: 'rgba(0,0,0,0.4)', blur: 0, y: 10 },
      scale: iz([[0.6, 0.3], [1.4, 1.1, 'outBack'], [1.8, 1, 'inOutSine']]), loops: [{ prop: 'rotation', type: 'sine', amp: 1.2, period: 3 }] });
    if (brief.altBaslik) c.L({ id: 'kapak-alt', group: kg, type: 'text', text: brief.altBaslik.toUpperCase(), font: 'Baloo 2', weight: 800, size: 54, color: '#ffe9a0', x: W / 2, y: 880, align: 'center', letterSpacing: 8, start: 1.6, end: R2(tAc), stroke: { color: MUREKKEP, width: 10 } });

    // ── sayfalar ──────────────────────────────────────────────────────────
    sayfalar.forEach((sy, si) => {
      const pT0 = planlar[sy.indisler[0]].t0;
      const pT1 = planlar[sy.indisler[sy.indisler.length - 1]].t1;
      c.gecis('sayfa-cevir', pT0, 1.0, KAGIT);
      c.bolum(pT0, `Sayfa ${si + 1}`);
      sy.indisler.forEach((bi, q) => {
        const pl = planlar[bi];
        const s = pl.s;
        const pn = sy.duzen[q];
        // önceki panelin taşan öğeleri bu pencerede görünmesin: panel açılana dek kâğıt rengi örtü
        if (q > 0) c.L({ id: `ortu-${si}-${q}`, group: g, asset: 'kare', x: pn[0] + (pn[2] - pn[0]) / 2, y: pn[1] + (pn[3] - pn[1]) / 2, scale: 1, scaleX: (pn[2] - pn[0] + 30) / 200, scaleY: (pn[3] - pn[1] + 30) / 200, palette: { a: '#eadfc8' }, start: R2(pT0), end: R2(pl.t0 + 0.6) });
        const x = mk(pn, pl.t0, pT1);
        x.P = ((orijinal) => (spec) => orijinal({ ...spec, end: spec.end ?? pT1 }))(x.P);
        x.s = s;
        const sahne = SAHNE[s.sahne] || SAHNE.kale;
        const bas = pl.t0 + 0.2;
        const kesit = { ...pl.s, t0: bas, t1: pT1 };
        x.t0 = bas; x.t1 = pT1;
        sahne(x, kesit);
        // yazılar
        if (s.altyazi) x.altyazi(s.altyazi, bas + 0.7, s.sahne !== 'magara' && s.sahne !== 'ucus' && s.sahne !== 'agla');
        if (s.konus) x.balon(s.sahne === 'agla' ? x.w / 2 : s.sahne === 'dostluk' ? 250 : s.sahne === 'yol' ? 330 : s.sahne === 'ejderha' ? 250 : 400, s.sahne === 'agla' ? 760 : s.sahne === 'dostluk' ? 180 : s.sahne === 'yol' ? 250 : s.sahne === 'ejderha' ? 250 : 200, s.konus, bas + 2.0, 'sol');
        // açılış perdesi (panel kâğıtla kapalı başlar, yukarı çekilir)
        c.L({ id: `perde-${si}-${q}`, group: g, asset: 'kare', x: pn[0] + x.w / 2, y: pn[1], anchor: [0.5, 0], scale: 1, scaleX: (x.w + 40) / 200, scaleY: [k(R2(pl.t0), (x.h + 40) / 200), k(R2(pl.t0 + 0.55), 0, 'inOutCubic')], palette: { a: '#241c2e' }, start: R2(pl.t0 - 0.02), end: R2(pl.t0 + 0.6) });
        Z.ses(pl, pl.t0 + 0.6);
      });
      // sayfa çerçevesi (içeriğin üstünde, kırpar)
      Z.ekle({ id: `sayfa-cerceve-${si}`, group: g, asset: `ej-sayfa-${sy.ad}`, x: W / 2, y: H / 2, anchor: [0.5, 0.5], scale: 1, start: R2(pT0), end: R2(pT1), opacity: iz([[pT0, 1]]) });
      // sayfa numarası
      c.L({ id: `sayfa-no-${si}`, group: g, type: 'text', text: `— ${si + 1} —`, font: 'Baloo 2', weight: 800, size: 34, color: MUREKKEP, x: W / 2, y: 1850, align: 'center', start: R2(pT0), end: R2(pT1) });
    });

    // ── kapanış kartı ─────────────────────────────────────────────────────
    c.gecis('sayfa-cevir', tK, 1.0, KAGIT);
    c.sekil('son-zemin', 'kare', W / 2, H / 2, 200, { t0: tK, renk: '#33295a', giris: 'yok', grup: g, sx: (W * 1.2) / 200, sy: (H * 1.2) / 200 });
    c.L({ id: 'son-isinlar', group: g, asset: 'kervan-gunes', variant: 'aksam', x: W / 2, y: 1100, scale: 3.4, opacity: 0.3, start: R2(tK), rotation: iz([[tK, 0], [tEnd, 30, 'linear']]) });
    c.L({ id: 'son-ucus', group: g, asset: 'ej-ejderha', variant: 'mor', x: iz([[tK, -200], [tK + 3, 600, 'outCubic'], [tEnd, 760, 'linear']]), y: iz([[tK, 1500], [tK + 3, 1400, 'inOutSine']]), anchor: [0.5, 0.5], scale: 1.3, start: R2(tK),
      loops: [{ prop: 'y', type: 'sine', amp: 14, period: 1.4 }], parts: { kanatOn: { loops: [{ prop: 'rotation', type: 'sine', amp: 12, period: 0.8 }] }, kanatArka: { loops: [{ prop: 'rotation', type: 'sine', amp: 12, period: 0.8, phase: 0.3 }] }, kuyruk: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 1 }] } } });
    c.L({ id: 'son-sovalye', group: g, asset: 'ej-sovalye', x: iz([[tK, -180], [tK + 3, 626, 'outCubic'], [tEnd, 786, 'linear']]), y: iz([[tK, 1360], [tK + 3, 1262, 'inOutSine']]), anchor: [0.5, 1], scale: 0.85, start: R2(tK), loops: [{ prop: 'y', type: 'sine', amp: 14, period: 1.4 }], parts: { kilic: { rotation: 20 }, tuy: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.5 }] } } });
    const RENK = { yazi: '#ffffff', alt: '#ffe9a0', golge: 'rgba(0,0,0,0.5)' };
    Z.kapanis(RENK, { perde: 0.0 });
    return Z.bitir({ background: { type: 'solid', color: KAGIT, paper: 0.5, vignette: 0.1 }, camera: { zoom: [k(0, 1.08), k(3, 1.0, 'inOutCubic')], x: W / 2, y: H / 2 } }, RENK);
  },
};
