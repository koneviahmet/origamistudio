// Katmanlı manzara (sinematik kapak): gökyüzü, güneş / ay, süzülen bulutlar, uçan kuşlar, aşağıdan yükselen paralaks bantlar
// (dalgalar / dağlar), bantların arasında salınan nesneler, bir "olay" (balina, tilki…), ardından başlık. Kamera yakından açılır.
// Okyanus şablonundan genelleştirildi: sahne = okyanus | daglar | gece. Pikseller 1080×1920 tasarımına göredir (W/H'ye ölçeklenir).
import { gerekli, varliklar, r2 } from './lib.mjs';
import { reels, sigdirFont } from './reels.mjs';

// ─── sahne ön ayarları ──────────────────────────────────────────────────────
// tip: sabit (güneş/ay) · bulut · ucan · bant · gemi · yol (serbest keyframe yolu)
const SAHNELER = {
  okyanus: {
    ad: 'Okyanus', bg: ['#8fd3ec', '#d4eef3', '#8ccbe0', '#1f4f6b'], yazi: '#1f5673', alt: '#2f7596', golge: 'rgba(20,70,100,0.25)',
    katman: [
      { tip: 'sabit', id: 'gunes', asset: 'gunes', x: 810, y: 560, s: 1.6, t: 0.3 },
      { tip: 'bulut', id: 'bulut-1', asset: 'bulut', x: [230, 330], y: 470, s: 1.3, t: 0.6, sira: 'left' },
      { tip: 'bulut', id: 'bulut-2', asset: 'bulut', x: [900, 810], y: 720, s: 0.9, t: 0.9, sira: 'right' },
      { tip: 'ucan', id: 'marti-1', asset: 'marti', t: [1.5, 10.5], y: [700, 560], s: 1.3, amp: 18 },
      { tip: 'ucan', id: 'marti-2', asset: 'marti', t: [3, 12], y: [800, 740], s: 0.85, amp: 12 },
      { tip: 'bant', id: 'dalga-1', asset: 'dalga', y: 880, s: 2.9, pal: { a: '#a6dcea', b: '#86c9de' }, amp: 30, per: 6 },
      { tip: 'gemi', id: 'gemi-uzak', asset: 'kagit-gemi', x: [250, 390], y: 1075, s: 0.7, pal: { a: '#2a9d8f' }, t: 1.6 },
      { tip: 'bant', id: 'dalga-2', asset: 'dalga', y: 1030, s: 3.2, pal: { a: '#86c9de', b: '#63b2cf' }, amp: 38, per: 5.5 },
      { tip: 'gemi', id: 'gemi-orta', asset: 'kagit-gemi', x: [820, 660], y: 1245, s: 1.05, pal: { a: '#f4a261' }, t: 2.0 },
      { tip: 'bant', id: 'dalga-3', asset: 'dalga', y: 1200, s: 3.5, pal: { a: '#63b2cf', b: '#4798bd' }, amp: 46, per: 5 },
      {
        tip: 'yol', id: 'balik-ziplama', asset: 'balik', start: 9.4, end: 10.7, s: 0.9,
        x: [[9.4, 930], [10.7, 650, 'linear']], y: [[9.4, 1470], [10.05, 1170, 'outQuad'], [10.7, 1470, 'inQuad']], rot: [[9.4, 35], [10.05, 0, 'linear'], [10.7, -35, 'linear']],
      },
      {
        tip: 'yol', id: 'su-fiskirmasi', asset: 'su-fiskirmasi', start: 6.3, end: 9.3, x: 469, y: 1344.4, anchor: [0.5, 1], s: 1.9,
        raw: { scaleY: [{ t: 6.3, v: 0.1 }, { t: 6.9, v: 1, ease: 'outBack' }, { t: 8.3, v: 1 }, { t: 9.1, v: 0.2, ease: 'inQuad' }], opacity: [{ t: 8.5, v: 1 }, { t: 9.2, v: 0 }], fold: [{ t: 6.3, v: 0 }, { t: 6.9, v: 1, ease: 'outCubic' }], foldStyle: { order: 'bottom', spread: 0.4 }, loops: [{ prop: 'y', type: 'sine', amp: 10, period: 3.2 }, { prop: 'scaleX', type: 'sine', amp: 0.06, period: 0.4 }] },
      },
      {
        tip: 'yol', id: 'balina', asset: 'balina', s: 2.6,
        x: [[1.5, 1500], [6, 560, 'outCubic'], [8.6, 560], [12, -420, 'inCubic']], y: [[8.6, 1430], [12, 1560, 'inQuad']], rot: [[8.6, 0], [12, -14, 'inQuad']], yLoop: 10,
      },
      { tip: 'bant', id: 'dalga-4', asset: 'dalga', y: 1400, s: 3.8, pal: { a: '#4a9cc0', b: '#357fa6' }, amp: 54, per: 4.5 },
      { tip: 'gemi', id: 'gemi-yakin', asset: 'kagit-gemi', x: [250, 370], y: 1670, s: 1.5, pal: { a: '#e76f51', c: '#fffaf0' }, t: 2.6 },
      { tip: 'bant', id: 'dalga-5', asset: 'dalga', y: 1620, s: 4.1, pal: { a: '#3a86a8', b: '#276688' }, amp: 62, per: 4 },
    ],
  },
  daglar: {
    ad: 'Dağlar', bg: ['#a3d6ee', '#fdeccf', '#d9ecc9', '#7fb58a'], yazi: '#2d4a3e', alt: '#4a6b57', golge: 'rgba(30,60,40,0.22)',
    katman: [
      { tip: 'sabit', id: 'gunes', asset: 'gunes', x: 790, y: 520, s: 1.5, t: 0.3 },
      { tip: 'bulut', id: 'bulut-1', asset: 'bulut', x: [200, 320], y: 430, s: 1.2, t: 0.6, sira: 'left' },
      { tip: 'bulut', id: 'bulut-2', asset: 'bulut', x: [920, 800], y: 690, s: 0.8, t: 0.9, sira: 'right' },
      { tip: 'ucan', id: 'turna-1', asset: 'turna', t: [1.5, 10.5], y: [660, 540], s: 0.8, amp: 14 },
      { tip: 'bant', id: 'dag-1', asset: 'dag', x: 360, y: 980, s: 3.9, pal: { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' }, amp: 10, per: 7 },
      { tip: 'bant', id: 'dag-2', asset: 'dag', x: 760, y: 1060, s: 3.6, pal: { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' }, amp: 14, per: 6 },
      { tip: 'bant', id: 'tepe-1', asset: 'tepeler', x: 540, y: 1180, s: 3.1, pal: { a: '#a9d28b', b: '#8fc274' }, amp: 18, per: 6 },
      { tip: 'bant', id: 'tepe-2', asset: 'tepeler', x: 420, y: 1330, s: 3.4, pal: { a: '#8fc274', b: '#74ab5c' }, amp: 24, per: 5.5 },
      { tip: 'yol', id: 'agac-1', asset: 'cam-agaci', start: 2.2, x: 130, y: 1380, anchor: [0.5, 1], s: 1.5, fold: [[2.2, 0], [3.3, 1, 'linear']], rotLoop: [2, 3.4, 0] },
      { tip: 'yol', id: 'agac-2', asset: 'cam-agaci', start: 2.5, x: 960, y: 1400, anchor: [0.5, 1], s: 1.7, fold: [[2.5, 0], [3.6, 1, 'linear']], rotLoop: [2, 3.8, 0.4] },
      { tip: 'bant', id: 'tepe-3', asset: 'tepeler', x: 600, y: 1520, s: 3.8, pal: { a: '#74ab5c', b: '#5e9449' }, amp: 30, per: 5 },
      { tip: 'yol', id: 'lale-1', asset: 'lale', start: 3.2, x: 240, y: 1790, anchor: [0.5, 1], s: 1.4, fold: [[3.2, 0], [4.2, 1, 'linear']], rotLoop: [3, 2.6, 0.2] },
      { tip: 'yol', id: 'lale-2', asset: 'lale', start: 3.4, x: 840, y: 1810, anchor: [0.5, 1], s: 1.2, variant: 'sari', fold: [[3.4, 0], [4.4, 1, 'linear']], rotLoop: [3, 2.9, 0.6] },
      { tip: 'yol', id: 'tilki', asset: 'tilki', start: 4.6, x: 560, y: [[4.6, 2150], [5.6, 1730, 'outBack']], anchor: [0.5, 1], s: 1.5, partLoop: { tail: [12, 1.2] } },
      { tip: 'ucan', id: 'kelebek', asset: 'kelebek', t: [5, 12], y: [1500, 1250], s: 0.55, amp: 26, per: 0.35 },
    ],
  },
  gece: {
    ad: 'Gece', bg: ['#0b132b', '#1c2541', '#3a506b', '#5b6f8f'], yazi: '#f5e6a8', alt: '#c9d6ea', golge: 'rgba(0,0,0,0.35)',
    katman: [
      { tip: 'sabit', id: 'hilal', asset: 'hilal', x: 860, y: 580, s: 1.8, t: 0.3 },
      ...[[170, 330, 0.3], [420, 230, 0.2], [610, 520, 0.28], [920, 760, 0.22], [140, 700, 0.18], [470, 640, 0.25], [330, 130, 0.2]].map(([x, y, s], i) => (
        { tip: 'yol', id: `yildiz-${i + 1}`, asset: 'yildiz', start: 0.4 + i * 0.15, x, y, s, pal: { a: '#fff2b3' }, fold: [[0.4 + i * 0.15, 0], [1.2 + i * 0.15, 1, 'outBack']], opLoop: [0.35, 1.6 + (i % 4) * 0.5, i * 0.3] }
      )),
      { tip: 'bulut', id: 'bulut-1', asset: 'bulut', x: [150, 290], y: 560, s: 1.2, pal: { a: '#35466e' }, t: 0.8, sira: 'left' },
      { tip: 'bulut', id: 'bulut-2', asset: 'bulut', x: [940, 820], y: 820, s: 0.9, pal: { a: '#2c3b5e' }, t: 1.0, sira: 'right' },
      { tip: 'ucan', id: 'ucak', asset: 'kagit-ucak', t: [2, 11], y: [900, 600], s: 0.7, amp: 14, para: false },
      { tip: 'bant', id: 'dag-1', asset: 'dag', x: 380, y: 1000, s: 3.9, pal: { a: '#2a3a5c', b: '#22304f', c: '#4a5d85' }, amp: 8, per: 7 },
      { tip: 'bant', id: 'dag-2', asset: 'dag', x: 760, y: 1090, s: 3.7, pal: { a: '#1f2c4a', b: '#192440', c: '#3a4a6e' }, amp: 12, per: 6 },
      { tip: 'bant', id: 'tepe-1', asset: 'tepeler', x: 520, y: 1260, s: 3.3, pal: { a: '#16223e', b: '#121b33' }, amp: 18, per: 6 },
      { tip: 'yol', id: 'agac-1', asset: 'cam-agaci', start: 2.2, x: 150, y: 1420, anchor: [0.5, 1], s: 1.6, pal: { a: '#0f1830', b: '#0a1226' }, fold: [[2.2, 0], [3.3, 1, 'linear']], rotLoop: [1.5, 3.4, 0] },
      { tip: 'yol', id: 'agac-2', asset: 'cam-agaci', start: 2.5, x: 930, y: 1440, anchor: [0.5, 1], s: 1.9, pal: { a: '#0f1830', b: '#0a1226' }, fold: [[2.5, 0], [3.6, 1, 'linear']], rotLoop: [1.5, 3.8, 0.4] },
      { tip: 'bant', id: 'tepe-2', asset: 'tepeler', x: 600, y: 1560, s: 3.8, pal: { a: '#0d1529', b: '#0a101f' }, amp: 26, per: 5 },
      { tip: 'yol', id: 'tilki', asset: 'tilki', variant: 'gece', start: 4.6, x: 520, y: [[4.6, 2150], [5.6, 1760, 'outBack']], anchor: [0.5, 1], s: 1.5, partLoop: { tail: [12, 1.4] } },
    ],
  },
};

export const MANZARA_SAHNELER = Object.keys(SAHNELER);

export default {
  id: 'manzara',
  ad: 'Katmanlı manzara (sinematik kapak)',
  etiket: 'Kapak · Atmosfer · Intro',
  sure: '12–20 sn',
  aciklama: 'Gökyüzü, süzülen bulutlar, uçan kuşlar ve aşağıdan yükselen paralaks bantlar (dalga / dağ / gece). Kamera yakından açılır, bir olay yaşanır, sonra başlık gelir. Video açılışı ya da döngülük arka plan için.',
  ornek: {
    sablon: 'manzara', id: 'sablon-manzara', ad: 'Okyanus', format: 'reels', sahne: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2',
    baslik: 'Okyanus', altBaslik: 'kağıttan dalgalar', sure: 12,
    yayin: { baslik: 'Kağıttan okyanus', aciklama: 'Kağıttan dalgalar, gemiler ve bir balina. Beğen ve kaydet!', etiketler: ['okyanus', 'kagit', 'animasyon', 'reels', 'shorts', 'sakin'] },
  },
  uret(brief) {
    gerekli(brief, ['ad'], 'manzara');
    const sahne = SAHNELER[brief.sahne] || SAHNELER.okyanus;
    const c = reels(brief, { palet: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2', stil: brief.stil || 'origami' });
    const { W, H, k } = c;
    const fx = W / 1080;
    const fy = H / 1920;
    const dur = Math.max(12, Number(brief.sure) || 12);
    const lib = varliklar();
    const g = c.grup('g-manzara', sahne.ad, true);
    const T = (arr, u) => arr.map(([t, v, e]) => ({ t: r2(t), v: r2(v * u), ...(e ? { ease: e } : {}) }));
    const TS = (arr) => arr.map(([t, v, e]) => ({ t: r2(t), v, ...(e ? { ease: e } : {}) }));
    const kanat = (asset, per, faz = 0) => {
      const parts = {};
      for (const n of lib.get(asset)?.parts || []) {
        if (/wing|kanat/i.test(n)) parts[n] = { scaleY: 0.2, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.8, period: per, phase: faz }] };
        else if (/tail|kuyruk/i.test(n)) parts[n] = { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.35 }] };
      }
      return Object.keys(parts).length ? { parts } : {};
    };
    const base = (s) => ({ ...(s.variant ? { variant: s.variant } : {}), ...(s.pal ? { palette: s.pal } : {}) });
    const fold = (t0, d, extra = {}) => ({ fold: [k(t0, 0), k(t0 + d, 1, 'linear')], ...extra });

    sahne.katman.forEach((s, i) => {
      const id = s.id || `k-${i}`;
      if (!lib.has(s.asset)) return;
      const L = { id, group: g, asset: s.asset, ...base(s) };
      if (s.tip === 'sabit') {
        Object.assign(L, { x: s.x * fx, y: s.y * fy, scale: r2(s.s * fx), ...fold(s.t, 1.3), loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }] });
      } else if (s.tip === 'bulut') {
        Object.assign(L, { x: [k(0, s.x[0] * fx), k(dur, s.x[1] * fx, 'linear')], y: s.y * fy, scale: r2(s.s * fx), ...fold(s.t, 1.2, { foldStyle: { order: s.sira } }) });
      } else if (s.tip === 'ucan') {
        const [a, b] = s.t;
        Object.assign(L, {
          start: a, x: [k(a, -150 * fx), k(Math.min(b, dur), 1250 * fx, 'linear')], y: [k(a, s.y[0] * fy), k(Math.min(b, dur), s.y[1] * fy, 'inOutSine')], scale: r2(s.s * fx),
          ...fold(a, 0.7), loops: [{ prop: 'y', type: 'sine', amp: s.amp, period: 1.8 }, { prop: 'rotation', type: 'sine', amp: 4, period: 1.8, phase: 0.25 }],
          ...(s.para === false ? {} : kanat(s.asset, s.per || 0.6)),
        });
      } else if (s.tip === 'bant') {
        const n = sahne.katman.filter((x) => x.tip === 'bant').indexOf(s);
        const t0 = 0.1 + n * 0.18;
        Object.assign(L, {
          x: (s.x ?? 540) * fx, anchor: [0.5, 0], scale: r2(s.s * fx), y: [k(t0, (s.y + 700) * fy), k(t0 + 1.2, s.y * fy, 'outCubic')],
          loops: [{ prop: 'x', type: 'sine', amp: s.amp, period: s.per, phase: n * 0.37 }, { prop: 'y', type: 'sine', amp: 6 + n * 2, period: 2.6 + n * 0.2, phase: n * 0.21 }],
        });
      } else if (s.tip === 'gemi') {
        Object.assign(L, {
          x: [k(0, s.x[0] * fx), k(dur, s.x[1] * fx, 'linear')], y: s.y * fy, anchor: [0.5, 0.88], scale: r2(s.s * fx), ...fold(s.t, 1.2, { foldStyle: { order: 'bottom', spread: 0.6 } }),
          loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 2.8, phase: i * 0.2 }, { prop: 'y', type: 'sine', amp: 7 * s.s + 3, period: 2.8, phase: 0.25 + i * 0.1 }],
        });
      } else {
        // yol: serbest keyframe yolu
        Object.assign(L, { scale: r2((s.s || 1) * fx), ...(s.anchor ? { anchor: s.anchor } : {}) });
        if (s.start != null) L.start = s.start;
        if (s.end != null) L.end = s.end;
        L.x = Array.isArray(s.x) ? T(s.x, fx) : (s.x ?? 540) * fx;
        L.y = Array.isArray(s.y) ? T(s.y, fy) : (s.y ?? 1000) * fy;
        if (s.rot) L.rotation = TS(s.rot);
        if (s.fold) L.fold = TS(s.fold);
        const loops = [];
        if (s.yLoop) loops.push({ prop: 'y', type: 'sine', amp: s.yLoop, period: 3.2 });
        if (s.rotLoop) loops.push({ prop: 'rotation', type: 'sine', amp: s.rotLoop[0], period: s.rotLoop[1], phase: s.rotLoop[2] });
        if (s.opLoop) loops.push({ prop: 'opacity', type: 'sine', amp: s.opLoop[0], period: s.opLoop[1], phase: s.opLoop[2] });
        if (loops.length) L.loops = loops;
        if (s.opLoop) L.opacity = 0.7;
        if (s.partLoop) L.parts = Object.fromEntries(Object.entries(s.partLoop).map(([n, [a, per]]) => [n, { loops: [{ prop: 'rotation', type: 'sine', amp: a, period: per }] }]));
        else Object.assign(L, kanat(s.asset, s.per || 0.5));
        if (s.raw) Object.assign(L, s.raw);
      }
      c.L(L);
    });

    // başlık
    const tB = 3.4;
    const bs = sigdirFont(brief.baslik || brief.ad, c.font, W * 0.86, 150, false);
    c.L({
      id: 'baslik', group: g, type: 'text', text: brief.baslik || brief.ad, font: c.font, weight: 700, size: bs, color: sahne.yazi, x: W / 2, y: Math.round(290 * fy),
      shadow: { color: sahne.golge, blur: 0, y: 6 }, opacity: [k(tB, 0), k(tB + 0.6, 1)], scale: [k(tB, 0.6), k(tB + 0.9, 1, 'outBack')],
    });
    if (brief.altBaslik) {
      c.L({
        id: 'alt-baslik', group: g, type: 'text', text: brief.altBaslik, font: c.font, weight: 500, size: sigdirFont(brief.altBaslik, c.font, W * 0.86, 62, false), color: sahne.alt, x: W / 2, y: Math.round(410 * fy),
        reveal: [k(tB + 0.9, 0), k(tB + 2.4, 1, 'linear')],
      });
    }
    c.bolum(0, sahne.ad);
    c.bolum(tB, 'Başlık');

    // takip bloğu: manzara hafifçe kararır, "Takip et!" + Instagram / YouTube
    const takipli = brief.takip !== false;
    const tT = dur;
    if (takipli) {
      c.bolum(tT, 'Takip');
      c.sekil('takip-perde', 'kare', W / 2, H / 2, 200, { sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, renk: '#000000', giris: 'yok', t0: tT, opacity: 0, grup: g, extra: { opacity: [k(tT, 0), k(tT + 0.6, 0.45, 'linear')] } });
      c.slam('takip-baslik', 'Takip et!', tT + 0.3, null, { y: H * 0.5, size: 200, maxW: W * 0.8, renk: '#ffffff', grup: g, font: c.font, upper: false, weight: 700, golge: false, giris: 'pop' });
      c.takip(tT + 0.7, null, { grup: g, y: 0.64 });
    }

    const bg = { type: 'linear', colors: sahne.bg, angle: 180, paper: 0.5, vignette: 0.18 };
    const sc = c.bitir2(brief.ad, dur + (takipli ? 5 : 0), {
      background: bg,
      camera: { zoom: [k(0, 1.15), k(3.5, 1, 'inOutCubic')], x: W / 2, y: [k(0, r2(H / 2 + 120 * fy)), k(3.5, H / 2, 'inOutCubic')] },
    });
    sc.theme = { ...sc.theme, colors: { ...sc.theme.colors, baslik: sahne.yazi, metin: sahne.alt } };
    return sc;
  },
};

