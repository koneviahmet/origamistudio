// Hikâye · LUMİ'NİN IŞIĞI (kendi modelleriyle, ODAK DERİNLİĞİ): gece ormanında dev mantarlar, mantar evleri, ışık çiçekleri, baykuş, salyangoz ve ateş böceği perisi Lumi.
// Beş derinlik düzlemi (uzak sisli mantarlar → dev mantarlar → evler → eylem düzlemi → ön plan yaprak / gövde) kamera ODAĞINA göre bulanır:
// her bölümde odak başka düzleme kayar (rack focus), kamera ormanın içinden sağa doğru paralaksla ilerler. Işık: Lumi'nin değneği sönükten parlaya, çiçekler tek tek yanar, orman ışıldar.
// Modeller: scripts/hikaye-modeller/mantar.mjs (npm run seed:hikaye).  Hikâye: brief.hikaye = [{ baslik, anlatim, altyazi?, ses? }]
import { hikayeKur, R2 } from './hikaye-ortak.mjs';

const RENK = { yazi: '#e8fff2', alt: '#9ffbd8', golge: 'rgba(4,28,30,0.7)', vurgu: '#7dffd0', kontur: 'rgba(6,34,36,0.9)' };
const GOK = {
  gece: ['#07131f', '#0d2a33', '#14403f', '#1d5648'],
  koyu: ['#050c14', '#08181f', '#0d2a2a', '#133a34'],
  parlak: ['#0c2a3a', '#16505a', '#2a7a6a', '#4fae8a'],
};

export default {
  id: 'hikaye-mantar',
  ad: 'Hikâye · Lumi\'nin Işığı (odak derinliği)',
  etiket: 'Hikâye · Özel modeller · Orman · Derinlik / odak',
  sure: '55–100 sn',
  aciklama: 'Gece ormanı beş derinlik düzleminde: sisli dev mantarlar, evler, ışık çiçekleri, baykuş, salyangoz ve ateş böceği perisi (özel modeller). Odak her bölümde başka düzleme kayar, kamera paralaksla ormandan geçer; ışık sönükten tüm ormana yayılır.',
  ornek: {
    sablon: 'hikaye-mantar', id: 'sablon-hikaye-mantar', ad: 'Lumi\'nin Işığı', format: 'reels', muzik: 'lofi-90', font: 'Fraunces',
    kanca: 'Bir orman masalı', baslik: 'Lumi\'nin Işığı', altBaslik: 'ışığını arayan küçük peri',
    hikaye: [
      { baslik: 'Sönük Işık', anlatim: 'Ormanın en küçük ateş böceği perisi Lumi bir gece fark etti: değneğinin ışığı gitgide sönüyordu. Orman, her zamankinden daha karanlıktı.', altyazi: 'Lumi\'nin ışığı gitgide sönüyordu.' },
      { baslik: 'Baykuş', anlatim: 'Lumi, ormanın en bilge canlısı baykuşa uçtu. Baykuş gözlerini kırpıştırdı: ışığını yeniden bulmak için ışık çiçekleri vadisine gitmelisin.', altyazi: '"Işık çiçekleri vadisine git."' },
      { baslik: 'Salyangoz', anlatim: 'Yolda yavaş yavaş ilerleyen bir salyangoza rastladı. Salyangoz gülümsedi: acele etme küçük peri, güzel şeyler zaman ister. Lumi onun kabuğuna konup birlikte yola koyuldu.', altyazi: '"Acele etme, güzel şeyler zaman ister."' },
      { baslik: 'Karanlık Orman', anlatim: 'Dev mantarların arasından, sisin içinden geçtiler. Her yer karanlıktı ama Lumi küçük ışığını sımsıkı tuttu ve yürümeye devam etti.', altyazi: 'Dev mantarların arasından geçtiler.' },
      { baslik: 'Işık Çiçekleri', anlatim: 'Sonunda vadiye vardılar. Çiçekler birer birer yandı ve Lumi\'nin değneği yeniden parladı. Hem de eskisinden çok daha parlak!', altyazi: 'Lumi\'nin ışığı yeniden parladı.' },
      { baslik: 'Işıldayan Orman', anlatim: 'Lumi yükseldi ve ışığını ormana yaydı. Mantar evlerin pencereleri açıldı, ateş böcekleri dans etti. O gece orman hiç olmadığı kadar ışıl ışıldı.', altyazi: 'O gece orman ışıl ışıldı.' },
    ],
    son: 'Işığını paylaşınca çoğalır', soru: 'Sen kimin ışığı oldun?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Lumi\'nin Işığı: ateş böceği perisinin orman masalı', aciklama: 'Işığı sönen küçük peri Lumi, baykuş ve salyangozun yardımıyla ışık çiçekleri vadisini bulur. Katmanlı, odak derinlikli bir orman masalı. Sen kimin ışığı oldun?', etiketler: ['masal', 'hikaye', 'orman', 'peri', 'animasyon', 'reels', 'shorts', 'cocuk', 'uyku'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-mantar', { palet: 'okyanus', muzik: 'lofi-90', font: 'Fraunces', stil: brief.stil || 'kagit-kesme' }, { kapakBeats: 8, kapSure: 10, minSn: 8.0 });
    const { c, W, H, k, n, planlar, lib, tAc, tK, tEnd, g } = Z;
    const need = ['mantar-ev-1', 'mantar-ev-2', 'mantar-buyuk-1', 'mantar-buyuk-2', 'mantar-buyuk-3', 'mantar-kucuk', 'mantar-yaprak', 'mantar-agac', 'mantar-baykus', 'mantar-peri', 'mantar-cicek', 'mantar-salyangoz', 'mantar-yer', 'huzme'];
    const eksik = need.filter((a) => !lib.has(a));
    if (eksik.length) throw new Error(`Mantar modelleri eksik (${eksik.join(', ')}). Önce: npm run seed:hikaye`);
    const ts = (i, f = 0) => (planlar[Math.min(i, n - 1)] ? planlar[Math.min(i, n - 1)].t0 + f : tK);
    const iz = (a) => { const o = []; a.forEach(([t, v, e]) => { if (!o.length || t > o[o.length - 1].t) o.push(k(R2(t), v, e)); }); return o; };
    const FOC = [[0, 0], [ts(0, 6), 0.05, 'inOutSine'], [ts(1, 1.2), 0, 'inOutCubic'], [ts(2, 0.8), -0.12, 'inOutCubic'], [ts(2, 6), 0.05, 'inOutSine'], [ts(3, 0), 0.12, 'inOutCubic'], [ts(3, 5), 0.3, 'inOutSine'], [ts(3, 9), 0.05, 'inOutSine'], [ts(4, 2), 0, 'inOutCubic'], [ts(5, 1.5), 0.08, 'inOutCubic'], [tK - 2.2, 0.15, 'inOutSine'], [tK - 0.3, 0, 'inOutCubic']];
    const focus = iz(FOC);
    const DOF = 34;
    // yazılar kameradan bağımsız (depth 1) ve odaktan etkilenmez: blur = -(1-focus)*dof (aynı ease → tam sıfırlanır)
    const hud = (ek = 0) => iz(FOC.map(([t, v, e]) => [t, R2(-(1 - v) * DOF + ek), e]));
    const D = { uzak: 0.85, ortaUzak: 0.55, orta: 0.25, eylem: 0, on: -0.4 };
    // yardımcı: derinlikli model
    const M = (id, asset, x, y, s, depth, oz = {}) => Z.ekle({ id, group: g, asset, x, y, anchor: [0.5, 1], scale: s, depth, ...oz });

    // ── gökyüzü ışığı ─────────────────────────────────────────────────────
    [150, 540, 930].forEach((x, i) => c.L({ id: `isin-${i}`, group: g, asset: 'huzme', x, y: -40, anchor: [0.5, 0], scale: 1, scaleX: 2.6 + i * 0.4, scaleY: 5.2, palette: { a: '#b8ffe0' }, opacity: iz([[0, 0.1], [ts(4, 0), 0.1], [ts(5, 0), 0.22]]), blur: 22, depth: 0.9, loops: [{ prop: 'opacity', type: 'sine', amp: 0.04, period: 5 + i, phase: i }, { prop: 'x', type: 'sine', amp: 24, period: 9 + i }] }));
    // ── uzak düzlem: sisli dev mantarlar ──────────────────────────────────
    [[110, 1300, 1.9, 'mantar-buyuk-1'], [560, 1280, 1.5, 'mantar-buyuk-3'], [960, 1310, 1.7, 'mantar-buyuk-1'], [1380, 1290, 1.8, 'mantar-buyuk-3'], [1820, 1300, 1.7, 'mantar-buyuk-1']].forEach(([x, y, s, a], i) => M(`uzak-${i}`, a, x, y, s, D.uzak, { variant: 'uzak', loops: [{ prop: 'rotation', type: 'sine', amp: 0.4, period: 7 + i }] }));
    // ── orta-uzak: dev mantarlar + evler ──────────────────────────────────
    [[250, 1420, 1.15, 'mantar-buyuk-3', 'gece'], [720, 1430, 1.25, 'mantar-buyuk-2', 'gece'], [1150, 1420, 1.2, 'mantar-buyuk-3', 'gece'], [1600, 1430, 1.3, 'mantar-buyuk-2', 'gece']].forEach(([x, y, s, a, v], i) => M(`ortauzak-${i}`, a, x, y, s, D.ortaUzak, { variant: v }));
    M('ev-uzak', 'mantar-ev-2', 900, 1450, 0.8, D.ortaUzak, { variant: 'gece' });
    // ── orta düzlem: mantar evleri ve kümeler ─────────────────────────────
    const evPen = [];
    [['ev-a', 'mantar-ev-1', 520, 1520, 0.92, 'mor'], ['ev-b', 'mantar-ev-1', 860, 1530, 0.72, 'mavi'], ['ev-c', 'mantar-ev-2', 1700, 1530, 0.78, 'turuncu'], ['ev-d', 'mantar-ev-1', 1980, 1530, 0.8, undefined]].forEach(([id, a, x, y, s, v]) => {
      M(id, a, x, y, s, D.orta, v ? { variant: v } : {});
      evPen.push([x, y - 230 * s, 360 * s]);
    });
    [[660, 1560, 1.1], [1040, 1566, 1.0], [1500, 1562, 1.1], [1850, 1566, 1.0]].forEach(([x, y, s], i) => M(`kucuk-${i}`, 'mantar-kucuk', x, y, s, D.orta));
    // ev pencere ışıkları (bölüm 6'da yanar)
    evPen.forEach(([x, y, boy], i) => Z.parilti(`ev-isik-${i}`, x, y, boy, '#ffd27a', { t0: 0, opacity: 0, blur: 34, depth: D.orta, extra: { opacity: iz([[0, 0.05], [ts(4, 3 + i * 0.5), 0.05], [ts(5, 1 + i * 0.7), 0.5], [tEnd, 0.5]]) } }));
    // ── eylem düzlemi: zemin, ağaç + baykuş, ışık çiçekleri, salyangoz ────
    [[540, 1], [1620, 1]].forEach(([x], i) => Z.ekle({ id: `zemin-${i}`, group: g, asset: 'mantar-yer', x, y: 1600, anchor: [0.5, 0], scale: 1.0, depth: D.eylem, variant: 'gece' }));
    c.sekil('zemin-dolgu', 'kare', 540, 1940, 200, { t0: 0, renk: '#1d1a2e', giris: 'yok', grup: g, sx: (W * 4) / 200, sy: 500 / 200, depth: 0 });
    M('agac-sol', 'mantar-agac', 150, 1760, 1.1, D.eylem, { variant: 'gece' });
    const baykus = (t0) => Z.ekle({ id: 'baykus', group: g, asset: 'mantar-baykus', x: 330, y: 1000, anchor: [0.5, 1], scale: 1.15, depth: D.eylem, start: R2(t0), fold: iz([[t0, 0], [t0 + 1.4, 1, 'linear']]), loops: [{ prop: 'rotation', type: 'sine', amp: 1.5, period: 3.4 }, { prop: 'y', type: 'sine', amp: 2, period: 2.8 }],
      parts: { goz: { scaleY: 1, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.0, period: 3 }] } } });
    baykus(0.8);
    Z.parilti('baykus-isik', 330, 880, 200, '#ffe27a', { t0: 0, opacity: 0, blur: 22, depth: D.eylem, extra: { opacity: iz([[0, 0], [ts(1, 0.5), 0], [ts(1, 2), 0.35], [ts(1, 6), 0.35], [ts(1, 8), 0]]) } });
    // ışık çiçekleri: vadide (x 1000-1550) ve yol boyunca
    const cicekler = [[1010, 1620, 1.0, undefined], [1110, 1650, 1.3, 'pembe'], [1200, 1630, 0.9, 'sari'], [1290, 1655, 1.4, undefined], [1380, 1630, 1.1, 'pembe'], [1470, 1650, 1.2, 'sari'], [1560, 1625, 0.95, undefined], [640, 1640, 0.8, undefined], [760, 1660, 0.7, 'pembe'], [880, 1640, 0.9, 'sari']];
    cicekler.forEach(([x, y, s, v], i) => {
      const yan = x > 1000;
      const t = yan ? ts(4, 2.2 + (i % 7) * 0.8) : 0;
      M(`cicek-${i}`, 'mantar-cicek', x, y, s, D.eylem, { ...(v ? { variant: v } : {}), loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3 + (i % 3), phase: i }] });
      const rr = { undefined: '#7ad8ff', pembe: '#ff8ad0', sari: '#ffd24a' }[v];
      Z.parilti(`cicek-isik-${i}`, x, y - 150 * s, 260 * s, rr, { t0: 0, opacity: 0, blur: 26, depth: D.eylem, extra: { opacity: iz(yan ? [[0, 0.04], [t, 0.04], [t + 0.8, 0.8, 'outCubic'], [tEnd, 0.7]] : [[0, 0.08], [ts(4, 0), 0.08], [ts(5, 0.5), 0.5], [tEnd, 0.5]]) }, anims: [{ preset: 'nabiz', t: R2(ts(4, 3)), genlik: 0.08, periyot: 2 + (i % 3) }] });
    });
    // salyangoz
    const sy0 = ts(2, 0.6);
    const syX = iz([[sy0, 640], [ts(2, 5), 700, 'inOutSine'], [ts(3, 2), 840, 'inOutSine'], [ts(3, 8), 1010, 'linear'], [ts(4, 3), 1200, 'linear']]);
    Z.ekle({ id: 'salyangoz', group: g, asset: 'mantar-salyangoz', x: syX, y: 1660, anchor: [0.5, 1], scale: 1.15, scaleX: -1, depth: -0.15, start: R2(sy0), fold: iz([[sy0, 0], [sy0 + 1.2, 1, 'linear']]), loops: [{ prop: 'y', type: 'sine', amp: 1.5, period: 2 }],
      parts: { duyargaA: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 1.6 }] }, duyargaB: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 1.6, phase: 1 }] } } });

    // ── ön plan (bulanık) ────────────────────────────────────────────────
    [[40, 1990, 1.4, -14], [760, 2000, 1.1, 6], [1500, 1990, 1.4, -8], [2100, 2000, 1.2, 10]].forEach(([x, y, s, r], i) => M(`yaprak-${i}`, 'mantar-yaprak', x, y, s, D.on, { variant: 'gece', rotation: r, loops: [{ prop: 'rotation', type: 'sine', amp: 1.6, period: 5 + i, phase: i }] }));
    // sis
    [[300, 1340, 3.2, 0.14], [820, 1500, 3.6, 0.12], [1400, 1380, 3.4, 0.14], [1900, 1520, 3.0, 0.12]].forEach(([x, y, s, a], i) => c.sekil(`sis-${i}`, 'daire', x, y, 300, { t0: 0, renk: '#a8e0d0', opacity: a, giris: 'yok', grup: g, blur: 60, sx: s, sy: 0.32, depth: 0.2, extra: { x: iz([[0, x], [tEnd, x + (i % 2 ? -160 : 160), 'linear']]) } }));

    // ── Lumi (hero): bölüm bölüm yol ──────────────────────────────────────
    const lx = iz([[0.6, 560], [ts(0, 5), 570, 'inOutSine'], [ts(1, 1.4), 520, 'inOutCubic'], [ts(1, 7), 530], [ts(2, 1), 720, 'inOutCubic'], [ts(2, 5), 760, 'inOutSine'], [ts(3, 1), 860, 'inOutSine'], [ts(3, 8), 1010, 'linear'], [ts(4, 3), 1230, 'inOutSine'], [ts(4, 8), 1260, 'inOutSine'], [ts(5, 1.5), 1130, 'inOutCubic'], [tEnd, 1100, 'linear']]);
    const ly = iz([[0.6, 1700], [1.8, 1370, 'outBack'], [ts(0, 5), 1380, 'inOutSine'], [ts(1, 1.4), 1010, 'inOutCubic'], [ts(1, 7), 1000], [ts(2, 1), 1490, 'inOutCubic'], [ts(2, 5), 1440, 'inOutSine'], [ts(3, 1), 1400, 'inOutSine'], [ts(3, 8), 1300, 'inOutSine'], [ts(4, 3), 1180, 'inOutSine'], [ts(4, 8), 1160], [ts(5, 1.5), 900, 'inOutCubic'], [tEnd, 880, 'linear']]);
    const lis = iz([[0.6, 0.0], [1.8, 0.18, 'outBack'], [ts(0, 1.5), 0.12], [ts(0, 6), 0.06, 'inOutSine'], [ts(1, 0), 0.05], [ts(3, 0), 0.07], [ts(4, 3), 0.12], [ts(4, 5), 0.95, 'outCubic'], [ts(5, 2), 1.0], [tEnd, 1.0]]);
    // ışık (parıltı) — değnek ucunda
    Z.parilti('lumi-isik', 0, 0, 520, '#fff3a0', { t0: 0, opacity: 0, blur: 36, depth: D.eylem, extra: { x: lx.map((e) => ({ ...e, v: e.v + 40 })), y: ly.map((e) => ({ ...e, v: e.v - 120 })), opacity: lis.map((e) => ({ ...e, v: R2(e.v * 0.8) })), scale: iz([[0, 0.5], [ts(4, 4), 0.5], [ts(4, 5.2), 1.4, 'outCubic'], [ts(5, 3), 1.2, 'inOutSine']]) } });
    Z.parilti('lumi-cekirdek', 0, 0, 120, '#ffffff', { t0: 0, opacity: 0, blur: 8, depth: D.eylem, extra: { x: lx.map((e) => ({ ...e, v: e.v + 40 })), y: ly.map((e) => ({ ...e, v: e.v - 112 })), opacity: lis } });
    Z.ekle({ id: 'lumi', group: g, asset: 'mantar-peri', x: lx, y: ly, anchor: [0.5, 1], scale: iz([[0.6, 0.7], [1.8, 1.75, 'outBack'], [ts(1, 1.4), 1.6], [ts(2, 1), 1.45], [ts(3, 0), 1.45], [ts(5, 1.5), 1.9, 'inOutSine']]), depth: D.eylem, start: 0.6,
      loops: [{ prop: 'y', type: 'sine', amp: 10, period: 1.3 }, { prop: 'rotation', type: 'sine', amp: 3, period: 2.2 }],
      parts: { kanatSol: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.22 }] }, kanatSag: { loops: [{ prop: 'rotation', type: 'sine', amp: -14, period: 0.22 }] }, degnek: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 1.3 }] } } });
    // ateş böcekleri (parçacık) + bölüm 6'da çoğalır
    c.L({ id: 'atesbocegi', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: 0, end: R2(tEnd), count: 40, area: [0, 700, 2300, 1700], colors: ['#fff2a0', '#b8ffd0'], opacity: 0.9, depth: 0.1 });
    c.L({ id: 'atesbocegi-cok', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: R2(ts(5, 0.5)), end: R2(tEnd), count: 140, area: [300, 500, 2000, 1700], colors: ['#fff2a0', '#9ffbd8', '#ffd0f0'], opacity: 1, depth: 0 });

    // ── yazılar ──────────────────────────────────────────────────────────
    Z.baslikKarti(RENK, { y: 0.15, size: 150, sar: 10, kancaFont: 'Lora', altFont: 'Lora' });
    planlar.forEach((pl, i) => {
      const s = pl.s;
      c.bolum(pl.t0, s.baslik || `Bölüm ${i + 1}`);
      c.L({ id: `bolum-${i}`, group: g, type: 'text', text: s.baslik || '', font: Z.font, weight: 700, size: 92, color: RENK.yazi, x: W / 2, y: 330, align: 'center', start: R2(pl.t0 + 0.2), end: R2(pl.t0 + 3.2), letterSpacing: 4,
        stroke: { color: RENK.kontur, width: 14 }, shadow: { color: 'rgba(125,255,208,0.5)', blur: 0, y: 6 }, depth: 1, blur: hud(), opacity: iz([[pl.t0 + 0.2, 0], [pl.t0 + 1.0, 1], [pl.t0 + 2.4, 1], [pl.t0 + 3.2, 0, 'linear']]), scale: iz([[pl.t0 + 0.2, 0.88], [pl.t0 + 1.0, 1, 'outBack']]) });
      Z.altyaziSinema(`altyazi-${i}`, s.altyazi || s.anlatim, pl.t0 + 1.4, pl.t1 - 0.2, { yazi: RENK.yazi, kontur: RENK.kontur, golge: RENK.golge, bant: '#021214' }, { y: 0.775, size: 62, font: 'Lora', sar: 26, bantAlfa: 0.4, ek: { depth: 1, blur: hud() }, ekBant: { depth: 1, blur: hud(38) } });
      Z.ses(pl, pl.t0 + 0.8);
    });
    Z.kapanis({ yazi: RENK.yazi, alt: RENK.alt, golge: RENK.golge }, { perde: 0.5 });

    // ── kamera: odak kayması + paralaks gezinti ───────────────────────────
    const kx = iz([[0, 560], [ts(0, 6), 540, 'inOutSine'], [ts(1, 1.4), 400, 'inOutCubic'], [ts(1, 8), 400], [ts(2, 1), 640, 'inOutCubic'], [ts(2, 6), 700, 'inOutSine'], [ts(3, 1), 800, 'inOutSine'], [ts(3, 8.5), 1000, 'inOutSine'], [ts(4, 3), 1200, 'inOutSine'], [ts(4, 8), 1230], [ts(5, 2), 1100, 'inOutCubic'], [tK - 2.2, 1080], [tK - 0.3, 540, 'inOutCubic']]);
    const ky = iz([[0, H / 2 + 80], [4, H / 2, 'inOutCubic'], [ts(1, 0), H / 2], [ts(1, 1.4), 1150, 'inOutCubic'], [ts(1, 8), 1130], [ts(2, 1), 1000, 'inOutCubic'], [ts(3, 1), 1000], [ts(4, 4), 1020, 'inOutSine'], [ts(5, 1.5), 900, 'inOutCubic'], [tK - 2.2, 900], [tK - 0.3, H / 2, 'inOutCubic']]);
    const zm = iz([[0, 1.12], [4, 1.0, 'inOutCubic'], [ts(1, 1.4), 1.25, 'inOutCubic'], [ts(1, 8), 1.22], [ts(2, 1), 1.15, 'inOutCubic'], [ts(3, 0), 1.05, 'inOutSine'], [ts(3, 8), 1.2, 'inOutSine'], [ts(4, 3), 1.1, 'inOutSine'], [ts(5, 1.5), 0.95, 'inOutCubic'], [tK - 2.2, 0.97], [tK - 0.3, 1.0, 'inOutCubic']]);
    return Z.bitir({
      background: Z.gokyuzu([{ t: 0, bg: GOK.gece }, { t: ts(3, 0) + 1, bg: GOK.koyu }, { t: ts(4, 4), bg: GOK.parlak }, { t: ts(5, 3), bg: GOK.parlak }], { sure: 3, vinyet: 0.45, kagit: 0.3 }),
      camera: { zoom: zm, x: kx, y: ky, focus, dof: DOF },
    }, RENK);
  },
};
