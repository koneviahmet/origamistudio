// Hikâye · KAR KÜRESİ (kendi modelleriyle): ahşap kaideli cam küre içinde gece köyü — sıcak pencereli kulübeler, karlı çamlar, kardan adam, çocuk, kızak, kuzey ışıkları.
// Sahne yuvarlak bir pencereden görünür (delikli çerçeve modeli); her bölümde küre SALLANIR, kar yeniden savrulur. Zaman: akşam → dilek (kayan yıldız) → kuzey ışıkları (kızak)
// → sessiz gece → şafakta ilk çiçekler. Başlık küre kaidesindeki plakette, altyazı ahşabın üstünde. Modeller: scripts/hikaye-modeller/kar.mjs (npm run seed:hikaye).
// Hikâye: brief.hikaye = [{ baslik, anlatim, altyazi?, ses? }]
import { hikayeKur, R2 } from './hikaye-ortak.mjs';

const RENK = { yazi: '#fff1d6', alt: '#f6dc8a', golge: 'rgba(30,14,40,0.7)', vurgu: '#ffd27a', kontur: 'rgba(24,12,34,0.88)' };
const GOK = {
  aksam: ['#2b2d6b', '#6a4a8a', '#d98a7a', '#ffcf9a'],
  gece: ['#0a1030', '#162058', '#2a3a82', '#4a5aa8'],
  aurora: ['#071026', '#0d2a48', '#1a4a66', '#2a6a7a'],
  safak: ['#8aa0d0', '#f2b0b0', '#ffd9b0', '#fff1d6'],
};

export default {
  id: 'hikaye-kar',
  ad: 'Hikâye · Kar Küresi (kardan adamın dileği)',
  etiket: 'Hikâye · Özel modeller · Kış · Cam küre',
  sure: '50–90 sn',
  aciklama: 'Ahşap kaideli bir kar küresi: içinde sıcak pencereli kulübeler, karlı çamlar, kardan adam, çocuk ve kızak (özel modeller). Her bölümde küre sallanır, kar savrulur; akşam, kayan yıldız, kuzey ışıkları, sessiz gece ve şafakta ilk çiçekler.',
  ornek: {
    sablon: 'hikaye-kar', id: 'sablon-hikaye-kar', ad: 'Kardan Adamın Dileği', format: 'reels', muzik: 'lofi-90', font: 'DM Serif Display',
    kanca: 'Bir kış masalı', baslik: 'Kardan Adamın Dileği', altBaslik: 'kar küresinde bir gece',
    hikaye: [
      { baslik: 'Akşam', anlatim: 'Karlı küçük köyde akşam olurken pencerelerde ışıklar birer birer yandı. Bir çocuk, bahçeye kocaman bir kardan adam yapmıştı.', altyazi: 'Pencerelerde ışıklar yandı.' },
      { baslik: 'Dilek', anlatim: 'Gece olunca gökyüzünden bir yıldız kaydı. Kardan adam gözlerini kapadı ve dilek tuttu: bahar nasıl bir şeydir, bir kez olsun görmek istiyorum.', altyazi: 'Kardan adam bir dilek tuttu.' },
      { baslik: 'Kuzey Işıkları', anlatim: 'Gökyüzü yeşil ve mor ışıklarla dans etti. Çocuk kızağını getirdi ve kardan adamla birlikte karların üzerinde kaydılar.', altyazi: 'Gökyüzü ışıklarla dans etti.' },
      { baslik: 'Sessizlik', anlatim: 'Sonra her yer sessizleşti. Kar usul usul yağdı, kulübelerin ışıkları teker teker söndü. Çocuk kardan adamın yanında uyuyakaldı.', altyazi: 'Kar usul usul yağdı.' },
      { baslik: 'Şafak', anlatim: 'Sabah güneş doğdu. Kardan adamın yanında karların arasından minik çiçekler baş verdi. Dilek gerçek olmuştu: bahar gelmişti.', altyazi: 'Dilek gerçek oldu: bahar geldi.' },
    ],
    son: 'Her dilek bir gün çiçek açar', soru: 'Sen ne dilerdin?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Kardan Adamın Dileği: kar küresinde bir kış masalı', aciklama: 'Ahşap kaideli bir kar küresinin içinde kardan adamın baharı görme dileği. Katmanlı kâğıt dünyada bir kış masalı. Sen ne dilerdin?', etiketler: ['masal', 'hikaye', 'kis', 'kardan-adam', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-kar', { palet: 'okyanus', muzik: 'lofi-90', font: 'DM Serif Display', stil: brief.stil || 'kagit-kesme' }, { kapakBeats: 8, kapSure: 10, minSn: 8.2 });
    const { c, W, H, k, n, planlar, lib, tAc, tK, tEnd, g } = Z;
    const need = ['kar-ev-1', 'kar-ev-2', 'kar-ev-3', 'kar-cam', 'kar-kardan-adam', 'kar-cocuk', 'kar-tepe-uzak', 'kar-tepe-orta', 'kar-tepe-yakin', 'kar-lamba', 'kar-kizak', 'kar-aurora', 'kar-kure-cerceve', 'kar-kure-yansima', 'kar-tanesi'];
    const eksik = need.filter((a) => !lib.has(a));
    if (eksik.length) throw new Error(`Kar modelleri eksik (${eksik.join(', ')}). Önce: npm run seed:hikaye`);
    const ts = (i, f = 0) => (planlar[Math.min(i, n - 1)] ? planlar[Math.min(i, n - 1)].t0 + f : tK);
    const iz = (a) => { const o = []; a.forEach(([t, v, e]) => { if (!o.length || t > o[o.length - 1].t) o.push(k(R2(t), v, e)); }); return o; };
    const GECE = [[0, 0], [ts(0, 3), 0], [ts(0, 7), 1], [ts(4, 0.5), 1], [ts(4, 4), 0]]; // gece görünümü penceresi
    const GUN = GECE.map(([t, v]) => [t, 1 - v]);

    // ── çift görünümlü (gün / gece) yardımcı ──────────────────────────────
    const cift = (id, asset, oz, loops) => {
      Z.ekle({ id: `${id}-gun`, group: g, asset, ...oz, opacity: iz(GUN), ...(loops ? { loops } : {}) });
      Z.ekle({ id: `${id}-gece`, group: g, asset, variant: 'gece', ...oz, opacity: iz(GECE), ...(loops ? { loops } : {}) });
    };

    // ── gök: ay, yıldızlar, kuzey ışıkları ────────────────────────────────
    Z.ekle({ id: 'ay', group: g, asset: 'fener-ay', x: 300, y: iz([[0, 700], [ts(0, 6), 700], [ts(0, 10), 520, 'outCubic']]), scale: 0.4, opacity: iz([[0, 0], [ts(0, 5), 0], [ts(0, 9), 1], [ts(4, 0), 1], [ts(4, 3), 0]]) });
    Z.parilti('ay-isik', 300, 520, 360, '#cfe0ff', { t0: 0, opacity: 0, blur: 50, extra: { opacity: iz([[0, 0], [ts(0, 9), 0.4], [ts(4, 0), 0.4], [ts(4, 3), 0]]) } });
    for (let i = 0; i < 22; i++) {
      Z.ekle({ id: `yildiz-${i}`, group: g, asset: 'yildiz', x: 130 + ((i * 337) % 820), y: 400 + ((i * 193) % 380), scale: R2(0.05 + (i % 4) * 0.02), palette: { a: '#fff2b3' }, opacity: iz([[0, 0], [ts(0, 6 + (i % 5) * 0.4), 0.9], [ts(4, 0), 0.9], [ts(4, 3.5), 0]]), loops: [{ prop: 'opacity', type: 'sine', amp: 0.3, period: 1.6 + (i % 5) * 0.5, phase: i * 0.4 }] });
    }
    Z.ekle({ id: 'aurora', group: g, asset: 'kar-aurora', x: 540, y: 380, anchor: [0.5, 0], scale: 1.0, blur: 5, opacity: iz([[0, 0], [ts(2, 0.5), 0], [ts(2, 3.5), 0.75], [ts(3, 2), 0.7], [ts(3, 6), 0], [ts(4, 0), 0]]), loops: [{ prop: 'x', type: 'sine', amp: 40, period: 7 }, { prop: 'scaleY', type: 'sine', amp: 0.08, period: 5 }] });
    Z.ekle({ id: 'aurora-2', group: g, asset: 'kar-aurora', variant: 'mor', x: 480, y: 440, anchor: [0.5, 0], scale: 0.9, blur: 6, opacity: iz([[0, 0], [ts(2, 1.5), 0], [ts(2, 4.5), 0.5], [ts(3, 2), 0.45], [ts(3, 6), 0], [ts(4, 0), 0]]), loops: [{ prop: 'x', type: 'sine', amp: -50, period: 9 }] });
    // şafak güneşi (tepelerin arkasında doğar)
    Z.ekle({ id: 'gunes', group: g, asset: 'kervan-gunes', variant: 'aksam', x: 700, y: iz([[0, 1250], [ts(4, 0.5), 1250], [ts(4, 6), 930, 'outCubic']]), scale: 0.62, opacity: iz([[0, 0], [ts(4, 0.4), 0], [ts(4, 2), 1]]) });
    Z.parilti('gunes-isik', 700, 1000, 700, '#ffc79e', { t0: 0, opacity: 0, blur: 80, extra: { opacity: iz([[0, 0], [ts(4, 0.5), 0], [ts(4, 5), 0.6]]), y: iz([[0, 1250], [ts(4, 0.5), 1250], [ts(4, 6), 960, 'outCubic']]) } });

    // ── tepeler ───────────────────────────────────────────────────────────
    const tepe = (ad, y, s, amp, per) => cift(`tepe-${ad}`, `kar-tepe-${ad}`, { x: 540, y, anchor: [0.5, 0], scale: s }, [{ prop: 'x', type: 'sine', amp, period: per }]);
    tepe('uzak', 880, 1.2, 10, 8);
    // uzak çamlar
    [[200, 960, 0.55], [330, 950, 0.46], [790, 954, 0.5], [900, 966, 0.58]].forEach(([x, y, s], i) => cift(`cam-uzak-${i}`, 'kar-cam', { x, y, anchor: [0.5, 1], scale: s }));
    tepe('orta', 990, 1.15, 14, 7);
    // kulübeler: arka sıra → ön sıra
    const evler = [
      ['ev-3', 'kar-ev-3', 800, 1085, 0.9, null],
      ['ev-2', 'kar-ev-2', 270, 1095, 0.78, { W: 290, H: 470, chx: 175, chy: 67 }],
      ['ev-1', 'kar-ev-1', 560, 1135, 1.0, { W: 330, H: 340, chx: 203, chy: 54 }],
    ];
    evler.forEach(([id, asset, x, y, s, baca], i) => {
      cift(id, asset, { x, y, anchor: [0.5, 0.94], scale: s });
      Z.parilti(`${id}-isik`, x, y - 150 * s, 330 * s, '#ffc66b', { t0: 0, opacity: 0, blur: 30, extra: { opacity: iz([[0, 0], [ts(0, 1.5 + i * 1.2), 0], [ts(0, 3.2 + i * 1.2), 0.3], [ts(2, 0), 0.34], [ts(3, 1.5 + i * 1.8), 0.34], [ts(3, 3.5 + i * 2.2), 0.03], [ts(4, 0), 0.0]]) } });
      if (!baca) return;
      const cx = x + (baca.chx - baca.W / 2) * s; const cy = y - (0.94 * baca.H - baca.chy) * s - 12;
      for (let p = 0; p < 3; p++) {
        const xs = []; const ys = []; const os = []; const ss = [];
        for (let t = p * 1.1; t < tEnd; t += 3.3) { xs.push([t, cx], [t + 3.3, cx + 36 + p * 8, 'linear']); ys.push([t, cy], [t + 3.3, cy - 170, 'linear']); os.push([t, 0], [t + 0.8, 0.55, 'linear'], [t + 3.0, 0, 'linear']); ss.push([t, 0.05], [t + 3.3, 0.16, 'linear']); }
        Z.ekle({ id: `${id}-duman-${p}`, group: g, asset: 'daire', x: iz(xs), y: iz(ys), scale: iz(ss), palette: { a: '#e8eefc' }, blur: 8, opacity: iz(os), start: R2(ts(0, 2 + i)) });
      }
    });
    tepe('yakin', 1085, 1.1, 18, 6);
    // çamlar (orta plan) + ön büyük çam
    [[170, 1150, 1.0], [935, 1140, 1.05]].forEach(([x, y, s], i) => cift(`cam-${i}`, 'kar-cam', { x, y, anchor: [0.5, 1], scale: s }, [{ prop: 'rotation', type: 'sine', amp: 0.8, period: 4 + i }]));
    // ön zemin karı
    c.sekil('zemin-kar', 'kare', 540, 1330, 200, { t0: 0, renk: '#e6f0fb', giris: 'yok', grup: g, sx: (W * 1.2) / 200, sy: 300 / 200 });
    c.sekil('zemin-kar-golge', 'kare', 540, 1210, 200, { t0: 0, renk: '#c9daf0', giris: 'yok', grup: g, sx: (W * 1.2) / 200, sy: 26 / 200, blur: 10, opacity: 0.8 });
    // sokak lambası
    cift('lamba', 'kar-lamba', { x: 745, y: 1240, anchor: [0.5, 1], scale: 1.05 });
    Z.parilti('lamba-isik', 745, 1030, 330, '#ffd27a', { t0: 0, opacity: 0, blur: 36, extra: { opacity: iz([[0, 0], [ts(0, 3), 0], [ts(0, 5), 0.6], [ts(3, 4), 0.6], [ts(3, 8), 0], [ts(4, 0), 0]]) } });

    // ── kardan adam, çocuk, kızak ─────────────────────────────────────────
    const sa = ts(0, 1.4);
    cift('kardan-adam', 'kar-kardan-adam', { x: 420, y: 1252, anchor: [0.5, 1], scale: 1.4, start: R2(sa), fold: iz([[sa, 0], [sa + 1.6, 1, 'linear']]),
      parts: { kolSol: { loops: [{ prop: 'rotation', type: 'sine', amp: 4, period: 3.2 }] }, kolSag: { loops: [{ prop: 'rotation', type: 'sine', amp: 9, period: 2.2, phase: 0.6 }] } } });
    // kardan adamın eriyip çiçeklenmesi: şafakta hafif ezilme
    const kz = ts(4, 5);
    const kartopu = ['gun', 'gece'].map((d) => `kardan-adam-${d}`);
    kartopu.forEach((id) => { const L = c.layers.find((l) => l.id === id); if (L) L.scaleY = iz([[0, 1], [kz, 1], [kz + 6, 0.95, 'inOutSine']]); });
    // çocuk: iki durum — bahçede ve kızakta
    const cd0 = ts(0, 3.4); const cdE = ts(2, 0.2);
    cift('cocuk', 'kar-cocuk', { x: 620, y: 1250, anchor: [0.5, 1], scale: 1.15, start: R2(cd0), end: R2(cdE), fold: iz([[cd0, 0], [cd0 + 1.4, 1, 'linear']]), parts: { kol: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.8 }] } } });
    const kizakT0 = ts(2, 1.5); const kizakT1 = ts(2, 7.2);
    const kx = iz([[kizakT0, 200], [kizakT1, 860, 'inOutSine']]); const ky = iz([[kizakT0, 1236], [kizakT0 + 1.7, 1222, 'inOutSine'], [kizakT1 - 1.2, 1240, 'inOutSine'], [kizakT1, 1226, 'inOutSine']]);
    Z.ekle({ id: 'kizak', group: g, asset: 'kar-kizak', x: kx, y: ky, anchor: [0.5, 1], scale: 1.15, start: R2(kizakT0 - 0.3), end: R2(kizakT1 + 0.3), rotation: iz([[kizakT0, -4], [kizakT0 + 2.5, 2, 'inOutSine'], [kizakT1, -3, 'inOutSine']]), opacity: iz([[kizakT0 - 0.3, 0], [kizakT0, 1], [kizakT1, 1], [kizakT1 + 0.3, 0]]) });
    Z.ekle({ id: 'kizak-cocuk', group: g, asset: 'kar-cocuk', x: kx, y: ky.map((e) => ({ ...e, v: e.v - 32 })), anchor: [0.5, 1], scale: 0.68, start: R2(kizakT0 - 0.3), end: R2(kizakT1 + 0.3), rotation: iz([[kizakT0, -4], [kizakT0 + 2.5, 2, 'inOutSine'], [kizakT1, -3, 'inOutSine']]), opacity: iz([[kizakT0 - 0.3, 0], [kizakT0, 1], [kizakT1, 1], [kizakT1 + 0.3, 0]]), parts: { kol: { loops: [{ prop: 'rotation', type: 'sine', amp: 20, period: 0.6 }] } } });
    // çocuk geri döner ve kardan adamın yanında uyur (bölüm 4+)
    const cd1 = ts(3, 0.5);
    cift('cocuk-uyku', 'kar-cocuk', { x: 560, y: 1252, anchor: [0.5, 1], scale: 1.1, start: R2(cd1), fold: iz([[cd1, 0], [cd1 + 1.2, 1, 'linear']]), rotation: iz([[cd1, 0], [cd1 + 4, 8, 'inOutSine']]) });
    for (let i = 0; i < 3; i++) c.L({ id: `zzz-${i}`, group: g, type: 'text', text: i === 0 ? 'z' : 'Z', font: Z.font, weight: 700, size: 46 + i * 14, color: '#f6efe0', x: 500 + i * 26, y: iz([[cd1 + 2 + i * 0.9, 1100], [cd1 + 5.5 + i * 0.9, 980 - i * 40, 'linear']]), start: R2(cd1 + 2 + i * 0.9), end: R2(ts(4, 1)),
      opacity: iz([[cd1 + 2 + i * 0.9, 0], [cd1 + 3 + i * 0.9, 0.9], [cd1 + 5.5 + i * 0.9, 0]]), loops: [{ prop: 'x', type: 'sine', amp: 8, period: 1.4 }] });
    // dilek: kayan yıldız + kalp
    const dt = ts(1, 2.4);
    Z.ekle({ id: 'kayan-yildiz', group: g, asset: 'yildiz', x: iz([[dt, 880], [dt + 1.6, 380, 'linear']]), y: iz([[dt, 470], [dt + 1.6, 720, 'inQuad']]), scale: 0.1, palette: { a: '#fff6c0' }, start: R2(dt), end: R2(dt + 1.7), rotation: iz([[dt, 0], [dt + 1.6, 360, 'linear']]), opacity: iz([[dt, 0], [dt + 0.2, 1], [dt + 1.4, 1], [dt + 1.7, 0]]) });
    c.L({ id: 'kayan-iz', group: g, asset: 'huzme', x: iz([[dt, 880], [dt + 1.6, 380, 'linear']]), y: iz([[dt, 470], [dt + 1.6, 720, 'inQuad']]), anchor: [0.5, 0], rotation: -112, scale: 1, scaleX: 0.5, scaleY: 0.9, palette: { a: '#fff6c0' }, blur: 6, start: R2(dt), end: R2(dt + 1.7), opacity: iz([[dt, 0], [dt + 0.3, 0.7], [dt + 1.4, 0.5], [dt + 1.7, 0]]) });
    Z.parilti('dilek-isik', 420, 940, 420, '#ffe9a8', { t0: 0, opacity: 0, blur: 50, extra: { opacity: iz([[0, 0], [dt + 1.6, 0], [dt + 2.2, 0.7], [dt + 5, 0.15, 'inOutSine'], [ts(2, 0), 0]]) } });
    c.sekil('dilek-kalp', 'kalp', 440, 820, 64, { t0: dt + 2.2, t1: dt + 6.5, renk: '#ff6f91', giris: 'yok', grup: g, extra: { y: iz([[dt + 2.2, 900], [dt + 6.5, 700, 'linear']]), opacity: iz([[dt + 2.2, 0], [dt + 3, 1], [dt + 5.5, 1], [dt + 6.5, 0]]), scale: iz([[dt + 2.2, 0.05], [dt + 3.2, 0.3, 'outBack']]) } });

    // ── şafak: çiçekler + kelebek ─────────────────────────────────────────
    [[300, 1262, 1.05, undefined], [560, 1276, 0.95, 'sari'], [350, 1290, 0.85, 'mor']].forEach(([x, y, s, v], i) => {
      const t = ts(4, 5.5 + i * 0.7);
      Z.ekle({ id: `cicek-${i}`, group: g, asset: 'lale', ...(v ? { variant: v } : {}), x, y, anchor: [0.5, 1], scale: s, start: R2(t), fold: iz([[t, 0], [t + 1.4, 1, 'outCubic']]), loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 2.4, phase: i }] });
      Z.parilti(`cicek-isik-${i}`, x, y - 60, 120, '#fff3b8', { t0: t, opacity: 0, blur: 16, extra: { opacity: iz([[t, 0], [t + 0.8, 0.6], [t + 2.4, 0.15]]) } });
    });
    const kt = ts(4, 8);
    Z.ekle({ id: 'kelebek', group: g, asset: 'kelebek', start: R2(kt), x: iz([[kt, 200], [kt + 3, 360, 'inOutSine'], [kt + 6, 560, 'inOutSine'], [kt + 9, 420, 'inOutSine']]), y: iz([[kt, 980], [kt + 3, 1040, 'inOutSine'], [kt + 6, 940, 'inOutSine'], [kt + 9, 1080, 'inOutSine']]), scale: 0.5, variant: 'mavi',
      loops: [{ prop: 'y', type: 'sine', amp: 14, period: 1.1 }], parts: { wingL: { scaleX: 0.3, loops: [{ prop: 'scaleX', type: 'sine', amp: 0.7, period: 0.35 }] }, wingR: { scaleX: 0.3, loops: [{ prop: 'scaleX', type: 'sine', amp: 0.7, period: 0.35 }] } } });

    // ── kar yağışı ────────────────────────────────────────────────────────
    c.L({ id: 'kar', group: g, type: 'particles', particle: 'kar', mode: 'surekli', start: 0, end: R2(tEnd), count: 120, area: [90, 360, 990, 1270], opacity: 0.95 });
    planlar.forEach((pl, i) => c.L({ id: `kar-savrul-${i}`, group: g, type: 'particles', particle: 'kar', mode: 'patlama', x: 540, y: 800, start: R2(pl.t0 + 0.05), end: R2(pl.t0 + 3.2), opacity: 0.9, ...(i ? {} : {}) }));
    // yoğun kar (sessiz gece)
    c.L({ id: 'kar-yogun', group: g, type: 'particles', particle: 'kar', mode: 'surekli', start: R2(ts(3, 0.5)), end: R2(ts(4, 1)), count: 200, area: [90, 360, 990, 1270], opacity: 0.95, speed: 1.4 });
    // ışık örtüleri (küre içi)
    const orten = (id, renk, a) => c.L({ id, group: g, asset: 'kare', x: 540, y: 840, scale: 1, scaleX: 950 / 200, scaleY: 950 / 200, palette: { a: renk }, opacity: iz(a) });
    orten('gece-orten', '#0a1236', [[0, 0.1], [ts(0, 6), 0.3], [ts(4, 0.5), 0.34], [ts(4, 5), 0]]);

    // ── çerçeve + yansıma + kaide yazıları ────────────────────────────────
    Z.ekle({ id: 'cerceve', group: g, asset: 'kar-kure-cerceve', x: 540, y: 960, anchor: [0.5, 0.5], scale: 1 });
    Z.ekle({ id: 'yansima', group: g, asset: 'kar-kure-yansima', x: 540, y: 960 - 120, anchor: [0.5, 0.5], scale: 1, opacity: 0.5 });
    Z.baslikKarti(RENK, { y: 0.1, size: 104, sar: 14, kancaFont: 'Lora', altFont: 'Lora', parilti: true });
    // başlık kartını kürenin üstündeki karanlık alana sığdır: ayrıca plakette bölüm adı
    planlar.forEach((pl, i) => {
      const s = pl.s;
      c.bolum(pl.t0, s.baslik || `Bölüm ${i + 1}`);
      c.L({ id: `plaket-${i}`, group: g, type: 'text', text: (s.baslik || '').toUpperCase(), font: Z.font, weight: 400, size: 54, color: '#e6c36a', x: 540, y: 1628, align: 'center', letterSpacing: 8, start: R2(pl.t0 + 0.2), end: R2(pl.t1 + 0.05),
        shadow: { color: 'rgba(0,0,0,0.6)', blur: 0, y: 3 }, opacity: iz([[pl.t0 + 0.2, 0], [pl.t0 + 0.9, 1], [pl.t1 - 0.4, 1], [pl.t1, 0]]) });
      c.L({ id: `ust-${i}`, group: g, type: 'text', text: `${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][i]} · ${s.baslik || ''}`, font: 'Lora', weight: 600, size: 52, color: RENK.alt, x: 540, y: 190, align: 'center', letterSpacing: 6, start: R2(pl.t0 + 0.4), end: R2(pl.t1),
        stroke: { color: RENK.kontur, width: 10 }, opacity: iz([[pl.t0 + 0.4, 0], [pl.t0 + 1.2, 1], [pl.t1 - 0.5, 1], [pl.t1, 0]]) });
      Z.altyaziSinema(`altyazi-${i}`, s.altyazi || s.anlatim, pl.t0 + 1.2, pl.t1 - 0.2, { yazi: RENK.yazi, kontur: RENK.kontur, golge: RENK.golge }, { y: 0.775, size: 56, font: 'Lora', sar: 28, bant: false });
      Z.ses(pl, pl.t0 + 0.8);
    });
    Z.kapanis({ yazi: RENK.yazi, alt: RENK.alt, golge: RENK.golge }, { perde: 0.55 });

    // ── kamera: küre sallanır (her bölüm başı) ve hafifçe yaklaşır ───────
    const rot = [k(0, 0)]; const zm = [k(0, 1.06), k(3.5, 1.0, 'inOutCubic')];
    planlar.forEach((pl, i) => {
      const t = pl.t0;
      rot.push(k(R2(t - 0.01), 0, 'linear'), k(R2(t + 0.12), 2.2, 'outCubic'), k(R2(t + 0.34), -1.8, 'inOutSine'), k(R2(t + 0.62), 1.0, 'inOutSine'), k(R2(t + 0.95), -0.4, 'inOutSine'), k(R2(t + 1.4), 0, 'inOutSine'));
      zm.push(k(R2(t - 0.01), 1.0, 'linear'), k(R2(t + 0.15), 1.045, 'outCubic'), k(R2(t + 1.2), 1.0, 'inOutSine'));
      if (i === 3) zm.push(k(R2(t + 5), 1.1, 'inOutSine'));
    });
    return Z.bitir({
      background: Z.gokyuzu([{ t: 0, bg: GOK.aksam }, { t: ts(0, 6), bg: GOK.gece }, { t: ts(2, 3), bg: GOK.aurora }, { t: ts(3, 6), bg: GOK.gece }, { t: ts(4, 3), bg: GOK.safak }], { sure: 3, vinyet: 0.4, kagit: 0.3 }),
      camera: { zoom: iz(zm.map((e) => [e.t, e.v, e.ease])), x: 540, y: iz([[0, 960], [3.5, 960]]), rotation: iz(rot.map((e) => [e.t, e.v, e.ease])) },
    }, RENK);
  },
};
