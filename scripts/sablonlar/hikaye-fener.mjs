// Hikâye · KÜÇÜK FENER (kendi modelleriyle): gözlü bir deniz feneri, kayalık, yelkenli, dalgalar, fırtına bulutları, şimşek, martılar.
// Sabit geniş sahne + hava durumu yayı: akşam → temiz gece → FIRTINA (şimşek, yağmur, sallanan tekne) → CESARET (ışık odaklanır, kamera feneri yakalar) → kurtuluş → şafak.
// Fener ışığı iki yana süpürür, tekneyi bulduğunda tek bir huzme olur. Gökyüzü, dalga ve fener renkleri bölümlere göre çapraz geçer.
// Modeller: scripts/hikaye-modeller/fener.mjs → data/library/hikaye-fener (npm run seed:hikaye).  Hikâye: brief.hikaye = [{ baslik, anlatim, altyazi?, ses? }]
import { hikayeKur, R2 } from './hikaye-ortak.mjs';

const RENK = { yazi: '#fff1d6', alt: '#ffd9a8', golge: 'rgba(10,14,40,0.6)', vurgu: '#ffb86b', kontur: 'rgba(12,16,44,0.85)' };
const GOK = {
  aksam: ['#2b3a6b', '#8a5a8a', '#f2a07a', '#ffd9a0'],
  gece: ['#0b1230', '#18265a', '#2d4180', '#4a63a8'],
  firtina: ['#161b2a', '#272f44', '#3a4560', '#566179'],
  acilan: ['#1a2650', '#34497f', '#6580b0', '#a2b6d2'],
  safak: ['#6a7fb8', '#e89aa6', '#ffc79e', '#ffeccf'],
};

export default {
  id: 'hikaye-fener',
  ad: 'Hikâye · Küçük Fener (fırtınadan şafağa)',
  etiket: 'Hikâye · Özel modeller · Deniz · Sinematik',
  sure: '55–100 sn',
  aciklama: 'Gözlü küçük bir deniz feneri, kayalık, yelkenli ve dalgalar (özel modeller). Akşamdan temiz geceye, fırtınaya (şimşek, yağmur), ışığın odaklanıp tekneyi kurtarmasına ve şafağa uzanan hava durumu yayı; ışık huzmeleri, sallanan tekne, çapraz geçen gökyüzü.',
  ornek: {
    sablon: 'hikaye-fener', id: 'sablon-hikaye-fener', ad: 'Küçük Fener', format: 'reels', muzik: 'lofi-90', font: 'DM Serif Display',
    kanca: 'Bir deniz masalı', baslik: 'Küçük Fener', altBaslik: 'ışığını hiç söndürmeyen',
    hikaye: [
      { baslik: 'Akşam', anlatim: 'Denizin kıyısındaki kayalıkta küçük bir fener yaşardı. Her akşam güneş batarken ışığını yakar, uzaktaki gemilere yolu gösterirdi.', altyazi: 'Küçük fener her akşam ışığını yakardı.' },
      { baslik: 'Işık', anlatim: 'Işığı denizin üzerinde uzun uzun süzülürdü. Martılar ona iyi geceler der, balıkçı tekneleri eve onun ışığıyla dönerdi.', altyazi: 'Tekneler eve onun ışığıyla dönerdi.' },
      { baslik: 'Fırtına', anlatim: 'Ama bir gece gökyüzü karardı. Rüzgâr uğuldadı, dalgalar kabardı ve şimşekler çaktı. Uzaklarda küçük bir yelkenli yolunu kaybetmişti.', altyazi: 'Küçük bir yelkenli yolunu kaybetmişti.' },
      { baslik: 'Cesaret', anlatim: 'Küçük fener çok korktu. Sonra düşündü: bu gece ışığına en çok ihtiyaç duyan oydu. Bütün gücüyle parladı.', altyazi: 'Küçük fener bütün gücüyle parladı.' },
      { baslik: 'Kurtuluş', anlatim: 'Yelkenli ışığı gördü. Kayalıkların arasından dikkatle süzüldü ve sakin limana ulaştı. Fırtına yavaş yavaş dağılıyordu.', altyazi: 'Yelkenli kayalıkları aşıp limana vardı.' },
      { baslik: 'Şafak', anlatim: 'Sabah güneş doğdu. Yelkenli el salladı ve küçük fener, uykulu gözleriyle ilk kez gülümsedi.', altyazi: 'Küçük fener ilk kez gülümsedi.' },
    ],
    son: 'Işığın birine yol olur', soru: 'Sen kime ışık oldun?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Küçük Fener: fırtınada ışığını söndürmeyen fener', aciklama: 'Gözlü küçük bir fener ve fırtınada yolunu kaybeden yelkenli. Katmanlı kâğıt dünyada bir deniz masalı. Sen kime ışık oldun?', etiketler: ['masal', 'hikaye', 'fener', 'deniz', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-fener', { palet: 'okyanus', muzik: 'lofi-90', font: 'DM Serif Display', stil: brief.stil || 'kagit-kesme' }, { kapakBeats: 8, kapSure: 10, minSn: 7.4 });
    const { c, W, H, k, p, n, planlar, lib, tAc, tK, tEnd, g } = Z;
    const need = ['fener-kule', 'fener-kayalik', 'fener-yelkenli', 'fener-dalga-uzak', 'fener-dalga-orta', 'fener-dalga-yakin', 'fener-bulut-firtina', 'fener-simsek', 'fener-ay', 'fener-marti'];
    const eksik = need.filter((a) => !lib.has(a));
    if (eksik.length) throw new Error(`Fener modelleri eksik (${eksik.join(', ')}). Önce: npm run seed:hikaye`);
    const T = planlar.map((pl) => pl.t0);
    const E = planlar.map((pl) => pl.t1);
    const ts = (i, f = 0) => (planlar[Math.min(i, n - 1)] ? planlar[Math.min(i, n - 1)].t0 + f : tK);
    const iz = (noktalar) => { const out = []; noktalar.forEach(([t, v, e]) => { if (!out.length || t > out[out.length - 1].t) out.push(k(t, v, e)); }); return out; };
    const LX = 330; const LY = 744; // lamba merkezi
    const ROCK_Y = 1560; const FENER_Y = 1238;
    const stormA = ts(2, 0.4); const stormB = ts(4, 1.5); // fırtına penceresi
    const sd = (a) => iz(a);

    // ── gökyüzü nesneleri ─────────────────────────────────────────────────
    const sunY = [k(0, 1330), k(ts(5, 0), 1330), k(ts(5, 5.5), 960, 'outCubic')];
    c.L({ id: 'safak-gunes', group: g, asset: 'kervan-gunes', x: 700, y: sunY, anchor: [0.5, 0.5], scale: 0.9, variant: 'aksam', start: R2(ts(5, -1)), opacity: [k(ts(5, -1), 0), k(ts(5, 1), 1, 'linear')] });
    Z.parilti('safak-isik', 700, 1060, 900, '#ffc79e', { t0: ts(5, -1), opacity: 0, blur: 90, extra: { opacity: [k(ts(5, -1), 0), k(ts(5, 4), 0.55, 'inOutSine')], y: [k(ts(5, -1), 1250), k(ts(5, 5.5), 1020, 'outCubic')] } });
    // yıldızlar + ay
    for (let i = 0; i < 26; i++) {
      const gorun = [k(0, 0), k(ts(0, 4 + (i % 5) * 0.4), 0.9 * (0.5 + (i % 3) * 0.25), 'linear'), k(stormA - 0.4, 0.8, 'linear'), k(stormA + 1.4, 0, 'linear'), k(stormB, 0, 'linear'), k(stormB + 2.4, 0.8, 'linear'), k(ts(5, 1), 0.9, 'linear'), k(ts(5, 4), 0, 'linear')];
      Z.ekle({ id: `yildiz-${i}`, group: g, asset: 'yildiz', x: 70 + ((i * 337) % 940), y: 150 + ((i * 211) % 700), scale: R2(0.07 + (i % 4) * 0.03), palette: { a: '#fff2b3' }, opacity: iz(gorun.map((e) => [e.t, e.v])), loops: [{ prop: 'opacity', type: 'sine', amp: 0.25, period: 1.6 + (i % 5) * 0.5, phase: i * 0.4 }] });
    }
    Z.ekle({ id: 'ay', group: g, asset: 'fener-ay', x: 800, y: [k(0, 700), k(ts(1, 0), 700, 'linear'), k(ts(1, 6), 420, 'outCubic'), k(stormA, 420, 'linear'), k(stormA + 2, 330, 'linear')], scale: 0.62, opacity: iz([[0, 0], [ts(1, 0), 0], [ts(1, 3), 1], [stormA - 0.5, 1], [stormA + 1.8, 0], [stormB + 1.5, 0], [stormB + 4, 0.9], [ts(5, 0), 0.9], [ts(5, 3), 0]]) });
    Z.parilti('ay-isik', 800, 420, 520, '#cfe0ff', { t0: 0, opacity: 0, blur: 70, extra: { opacity: iz([[0, 0], [ts(1, 3), 0.4], [stormA - 0.5, 0.4], [stormA + 1.8, 0], [stormB + 4, 0.35], [ts(5, 3), 0]]) } });
    // fırtına bulutları (üstten sürüklenir)
    [[160, 250, 1.0, 0], [620, 180, 1.2, 1], [900, 330, 0.9, 2]].forEach(([x, y, s, i]) => {
      Z.ekle({ id: `bulut-${i}`, group: g, asset: 'fener-bulut-firtina', x: iz([[0, x - 700 - i * 100], [stormA - 2.5, x - 700 - i * 100], [stormA + 1.5, x, 'outCubic'], [stormB, x + 80, 'linear'], [ts(4, 6), x + 1100, 'inCubic']]), y, scale: s, variant: 'gece',
        opacity: iz([[0, 0], [stormA - 2.5, 0], [stormA, 1, 'linear'], [ts(4, 4), 1], [ts(4, 7), 0]]), loops: [{ prop: 'y', type: 'sine', amp: 10, period: 5 + i }] });
    });
    // ── denizin uzak katmanları ──────────────────────────────────────────
    const dalga = (id, asset, y, s, amp, per, ph) => {
      Z.ekle({ id: `${id}-gun`, group: g, asset, x: 540, y, anchor: [0.5, 0], scale: s, opacity: iz([[0, 1], [ts(1, -1), 1], [ts(1, 2), 0], [ts(5, 0), 0], [ts(5, 3), 1]]), loops: [{ prop: 'x', type: 'sine', amp, period: per, phase: ph }, { prop: 'y', type: 'sine', amp: 6, period: per * 0.5, phase: ph }] });
      Z.ekle({ id: `${id}-gece`, group: g, asset, x: 540, y, anchor: [0.5, 0], scale: s, variant: 'gece', opacity: iz([[0, 0], [ts(1, -1), 0], [ts(1, 2), 1], [stormA - 0.3, 1], [stormA + 1.5, 0], [stormB + 1.5, 0], [stormB + 4, 1], [ts(5, 0), 1], [ts(5, 3), 0]]), loops: [{ prop: 'x', type: 'sine', amp, period: per, phase: ph }, { prop: 'y', type: 'sine', amp: 6, period: per * 0.5, phase: ph }] });
      Z.ekle({ id: `${id}-firtina`, group: g, asset, x: 540, y, anchor: [0.5, 0], scale: [k(0, s), k(stormA, s), k(stormA + 3, R2(s * 1.14), 'inOutSine'), k(stormB, R2(s * 1.14)), k(stormB + 3, s, 'inOutSine')], variant: 'firtina', opacity: iz([[0, 0], [stormA - 0.3, 0], [stormA + 1.5, 1], [stormB + 1.5, 1], [stormB + 4, 0]]), loops: [{ prop: 'x', type: 'sine', amp: amp * 1.8, period: per * 0.62, phase: ph }, { prop: 'y', type: 'sine', amp: 14, period: per * 0.4, phase: ph }] });
    };
    dalga('dalga-uzak', 'fener-dalga-uzak', 1070, 1.0, 26, 7, 0.2);
    dalga('dalga-orta', 'fener-dalga-orta', 1190, 1.05, 34, 5.6, 1.1);

    // ── kayalık + fener (3 renk durumu çapraz) ────────────────────────────
    const durum = (ad, variant, pencere) => {
      const op = iz(pencere);
      Z.ekle({ id: `kayalik-${ad}`, group: g, asset: 'fener-kayalik', ...(variant ? { variant } : {}), x: LX, y: ROCK_Y, anchor: [0.5, 1], scale: 0.95, opacity: op });
      Z.ekle({ id: `fener-${ad}`, group: g, asset: 'fener-kule', ...(variant ? { variant } : {}), x: LX, y: FENER_Y, anchor: [0.5, 1], scale: 1.15, opacity: op, loops: [{ prop: 'rotation', type: 'sine', amp: 0.35, period: 6 }],
        parts: { goz: { scaleY: ad === 'safak' ? 1 : 1, loops: [{ prop: 'scaleY', type: 'saw', amp: 0.0, period: 4 }] } } });
    };
    // gün (akşam + şafak), gece, fırtına
    durum('gun', undefined, [[0, 1], [ts(1, 0), 1], [ts(1, 3), 0], [ts(5, 0), 0], [ts(5, 3), 1]]);
    durum('gece', 'gece', [[0, 0], [ts(1, 0), 0], [ts(1, 3), 1], [stormA - 0.3, 1], [stormA + 1.4, 0], [stormB + 1.5, 0], [stormB + 4, 1], [ts(5, 0), 1], [ts(5, 3), 0]]);
    durum('firtina', 'firtina', [[0, 0], [stormA - 0.3, 0], [stormA + 1.4, 1], [stormB + 1.5, 1], [stormB + 4, 0]]);

    // ── ışık: parıltı + huzmeler ──────────────────────────────────────────
    const isikTrack = iz([[0, 0], [ts(0, 2.6), 0, 'linear'], [ts(0, 3.1), 0.4], [ts(0, 3.4), 0.18], [ts(0, 3.7), 0.7, 'outCubic'], [ts(1, 0), 0.55], [stormA, 0.6], [ts(3, 0), 0.62], [ts(3, 3), 1.0, 'inOutSine'], [ts(4, 0), 0.9], [ts(5, 0), 0.5], [ts(5, 3), 0, 'linear']]);
    Z.parilti('lamba-isik', LX, LY, 620, '#ffd27a', { t0: 0, opacity: 0, blur: 70, extra: { opacity: isikTrack, scale: [k(0, 1), k(ts(3, 0), 1), k(ts(3, 3), 1.6, 'inOutSine'), k(ts(4, 0), 1.5), k(ts(5, 0), 1, 'inOutSine')] } });
    Z.parilti('lamba-cekirdek', LX, LY + 8, 160, '#fff4c9', { t0: 0, opacity: 0, blur: 14, extra: { opacity: isikTrack } });
    const beam = (id, rot, faz, boy, gen, alfa) => c.L({
      id, group: g, asset: 'huzme', x: LX, y: LY + 6, anchor: [0.5, 0], rotation: rot, scale: 1, scaleX: gen, scaleY: boy / 400, palette: { a: '#fff2b0' }, blur: 12,
      opacity: iz([[0, 0], [ts(0, 3.1), 0], [ts(0, 4.2), alfa], [ts(3, 2.6), alfa], [ts(3, 3.4), 0, 'linear'], [ts(4, 6), 0, 'linear'], [ts(4, 7.4), alfa * 0.8], [ts(5, 0), alfa * 0.8], [ts(5, 2.5), 0]]),
      loops: [{ prop: 'scaleY', type: 'sine', amp: (boy / 400) * 0.62, period: 7.2, phase: faz }, { prop: 'rotation', type: 'sine', amp: 3, period: 7.2, phase: faz + 1 }],
    });
    beam('huzme-sag', -89, 0, 1500, 2.2, 0.26);
    beam('huzme-sol', 89, 3.6, 1100, 2.0, 0.22);
    // odaklı huzme (tekneyi bulur)
    c.L({ id: 'huzme-hedef', group: g, asset: 'huzme', x: LX, y: LY + 6, anchor: [0.5, 0], rotation: iz([[0, -80], [ts(3, 2.6), -80], [ts(3, 5), -36, 'inOutCubic'], [ts(4, 0), -36], [ts(4, 5), -62, 'inOutSine']]), scale: 1, scaleX: 1.5, scaleY: 2.3, palette: { a: '#fff6c8' }, blur: 8,
      opacity: iz([[0, 0], [ts(3, 2.6), 0], [ts(3, 3.6), 0.5], [ts(4, 5), 0.42], [ts(4, 7), 0, 'linear']]) });

    // ── yelkenli: bölüm bölüm yolculuk ────────────────────────────────────
    const bx = iz([[0, 1010], [ts(0, 0.4), 1010], [E[0], 900, 'inOutSine'], [E[1], 760, 'inOutSine'], [ts(2, 4), 640, 'inOutSine'], [E[2], 560, 'inOutSine'], [ts(3, 3), 580, 'inOutSine'], [E[3], 640, 'inOutSine'], [ts(4, 4), 800, 'inOutSine'], [E[4], 930, 'inOutSine'], [ts(5, 3), 910, 'inOutSine']]);
    const by = iz([[0, 1330], [E[1], 1340, 'inOutSine'], [E[2], 1352, 'inOutSine'], [ts(3, 4), 1360, 'inOutSine'], [ts(4, 3), 1410, 'inOutSine'], [E[4], 1470, 'inOutSine'], [ts(5, 3), 1478]]);
    const bs = iz([[0, 0.5], [E[0], 0.52], [E[1], 0.62, 'inOutSine'], [E[2], 0.86, 'inOutSine'], [E[3], 0.98, 'inOutSine'], [E[4], 1.15, 'inOutSine'], [tK, 1.18]]);
    const rot = [k(0, 0)];
    for (let t = stormA; t < stormB + 3; t += 0.85) rot.push(k(R2(t), (Math.round((t - stormA) / 0.85) % 2 ? -1 : 1) * (t < ts(3, 3) ? 11 : 6), 'inOutSine'));
    rot.push(k(R2(stormB + 4), 0, 'inOutSine'));
    Z.ekle({ id: 'tekne', group: g, asset: 'fener-yelkenli', x: bx, y: by, anchor: [0.5, 0.9], scale: bs, rotation: rot, opacity: iz([[0, 0], [ts(0, 0.6), 1, 'linear']]),
      loops: [{ prop: 'y', type: 'sine', amp: 7, period: 2.6 }, { prop: 'rotation', type: 'sine', amp: 2, period: 3.1 }], parts: { bayrak: { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.7 }] } } });
    Z.ekle({ id: 'tekne-isik', group: g, asset: 'daire', x: bx, y: by.map((e) => ({ ...e, v: e.v - 120 })), scale: 0.16, palette: { a: '#ffe9a8' }, blur: 18, opacity: iz([[0, 0], [stormA, 0], [stormA + 1, 0.8], [ts(5, 0), 0.5], [ts(5, 3), 0]]) });

    // ── martılar ──────────────────────────────────────────────────────────
    [[ts(0, 1.5), ts(0, 9), 640, 540, 0.9], [ts(1, 0.5), ts(1, 8), 760, 660, 0.65], [ts(5, 1), ts(5, 8), 700, 560, 0.8], [ts(5, 3), ts(5, 9), 600, 500, 0.6]].forEach(([a, b, ya, yb, s], i) => {
      Z.ekle({ id: `marti-${i}`, group: g, asset: 'fener-marti', start: R2(a), end: R2(b + 0.3), x: iz([[a, i % 2 ? 1300 : -200], [b, i % 2 ? -200 : 1300, 'linear']]), y: iz([[a, ya], [b, yb, 'inOutSine']]), scale: s, scaleX: i % 2 ? -1 : 1,
        loops: [{ prop: 'y', type: 'sine', amp: 14, period: 1.8 }], parts: { kanatSag: { scaleY: 0.3, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.7, period: 0.7 }] }, kanatSol: { scaleY: 0.3, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.7, period: 0.7 }] } } });
    });
    // ön plandaki yakın dalgalar (kayalığın tabanını örter) + ön kaya silüeti
    dalga('dalga-yakin', 'fener-dalga-yakin', 1470, 1.1, 44, 4.6, 2.0);
    dalga('dalga-on', 'fener-dalga-yakin', 1660, 1.2, 56, 3.8, 3.1);
    c.sekil('deniz-taban', 'kare', W / 2, 1930, 200, { t0: 0, renk: '#0f2a46', giris: 'yok', grup: g, sx: (W * 1.2) / 200, sy: 300 / 200 });

    // ── yağmur + şimşek + ışık örtüleri ───────────────────────────────────
    c.L({ id: 'yagmur', group: g, type: 'particles', particle: 'yagmur', mode: 'surekli', start: R2(stormA), end: R2(stormB + 2), opacity: 0.8 });
    c.L({ id: 'yagmur-2', group: g, type: 'particles', particle: 'yagmur', mode: 'surekli', start: R2(stormA + 0.5), end: R2(stormB + 1), opacity: 0.6, speed: 1.4 });
    const orten = (id, renk, noktalar) => c.L({ id, group: g, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.3) / 200, scaleY: (H * 1.3) / 200, palette: { a: renk }, opacity: iz(noktalar) });
    orten('karanlik', '#070a1c', [[0, 0], [stormA - 0.4, 0], [stormA + 2.2, 0.42, 'inOutSine'], [ts(3, 3), 0.3, 'inOutSine'], [stormB + 1.5, 0.3], [stormB + 5, 0, 'inOutSine']]);
    orten('safak-isik-orten', '#ffb27a', [[0, 0], [ts(5, 0), 0], [ts(5, 5), 0.14, 'inOutSine']]);
    // şimşek anları: bölüm 3 ve 4'ün başında
    const cakmalar = [stormA + 1.6, stormA + 3.6, ts(2, 5.8), ts(3, 0.9), ts(3, 5.3)];
    cakmalar.forEach((t, i) => {
      const x = [560, 820, 240, 700, 900][i % 5];
      Z.ekle({ id: `simsek-${i}`, group: g, asset: 'fener-simsek', x, y: 170, anchor: [0.5, 0], scale: 2.4 + (i % 2) * 0.5, rotation: (i % 2 ? 6 : -4), start: R2(t), end: R2(t + 0.5), opacity: iz([[t, 1], [t + 0.07, 0.2], [t + 0.12, 1], [t + 0.5, 0, 'linear']]) });
      c.L({ id: `flas-${i}`, group: g, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.3) / 200, scaleY: (H * 1.3) / 200, palette: { a: '#e8f0ff' }, start: R2(t - 0.02), end: R2(t + 0.6), opacity: iz([[t - 0.02, 0], [t + 0.04, 0.55], [t + 0.16, 0.12], [t + 0.2, 0.4], [t + 0.6, 0, 'linear']]) });
    });

    // ── gösterge: başlık, bölüm adı, altyazı ──────────────────────────────
    Z.baslikKarti(RENK, { y: 0.16, size: 160, sar: 8, kancaFont: 'Lora', altFont: 'Lora' });
    planlar.forEach((pl, i) => {
      const s = pl.s;
      c.bolum(pl.t0, s.baslik || `Bölüm ${i + 1}`);
      c.L({ id: `bolum-${i}`, group: g, type: 'text', text: s.baslik || '', font: Z.font, weight: 400, size: 120, color: RENK.yazi, x: W / 2, y: 420, align: 'center', start: R2(pl.t0 + 0.2), end: R2(pl.t0 + 3.0), letterSpacing: 6,
        stroke: { color: RENK.kontur, width: 14 }, shadow: { color: RENK.golge, blur: 0, y: 6 }, opacity: iz([[pl.t0 + 0.2, 0], [pl.t0 + 0.9, 1], [pl.t0 + 2.2, 1], [pl.t0 + 3.0, 0, 'linear']]), scale: iz([[pl.t0 + 0.2, 0.85], [pl.t0 + 1.0, 1, 'outBack'], [pl.t0 + 3.0, 1.06, 'linear']]) });
      Z.altyaziSinema(`altyazi-${i}`, s.altyazi || s.anlatim, pl.t0 + 1.2, pl.t1 - 0.2, { yazi: RENK.yazi, kontur: RENK.kontur, golge: RENK.golge }, { y: 0.775, size: 66, font: 'Lora' });
      Z.ses(pl, pl.t0 + 0.6);
    });
    Z.kapanis({ yazi: RENK.yazi, alt: RENK.alt, golge: RENK.golge }, { perde: 0.5 });

    // ── kamera: genel plan → şimşekte sarsıntı → fenere yaklaşma → geri çekilme ──
    const zoom = iz([[0, 1.14], [4, 1.0, 'inOutCubic'], [ts(1, 0), 1.0], [ts(2, 0), 1.05, 'inOutSine'], [ts(3, 0), 1.1, 'inOutSine'], [ts(3, 4), 1.3, 'inOutCubic'], [ts(4, 0), 1.28], [ts(4, 6), 1.08, 'inOutCubic'], [ts(5, 0), 1.0, 'inOutSine'], [tK, 1.04]]);
    const kx = iz([[0, 540], [ts(2, 0), 540], [ts(3, 4), 430, 'inOutCubic'], [ts(4, 0), 430], [ts(4, 6), 540, 'inOutCubic']]);
    const ky = iz([[0, H / 2 + 120], [4, H / 2, 'inOutCubic'], [ts(3, 0), H / 2], [ts(3, 4), 840, 'inOutCubic'], [ts(4, 0), 840], [ts(4, 6), H / 2, 'inOutCubic']]);
    const sallan = [k(0, 0)];
    cakmalar.forEach((t, i) => sallan.push(k(R2(t - 0.01), 0, 'linear'), k(R2(t + 0.08), (i % 2 ? -1 : 1) * 1.1, 'outCubic'), k(R2(t + 0.5), 0, 'inOutSine')));
    return Z.bitir({ background: Z.gokyuzu([{ t: 0, bg: GOK.aksam }, { t: ts(1, 0) + 1.2, bg: GOK.gece }, { t: stormA + 1.4, bg: GOK.firtina }, { t: stormB + 2.5, bg: GOK.acilan }, { t: ts(5, 0) + 1.5, bg: GOK.safak }], { sure: 2.6, vinyet: 0.3, kagit: 0.35 }),
      camera: { zoom, x: kx, y: ky, rotation: iz(sallan.map((e) => [e.t, e.v])) } }, RENK);
  },
};
