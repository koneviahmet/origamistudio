// Animasyon ön ayarları — tahribatsız, parametreli ve çalışma anında uygulanır.
//
// Katman: "anims": [ { "preset": "zipla-gir", "t": 1.2, "dur": 0.8, "guc": 1 }, ... ]
//
// Kategoriler:
//   giris   : t'den önce başlangıç durumunda bekler (genelde görünmez), t+dur'da normale döner
//   cikis   : t'ye kadar etkisiz, sonra bitiş durumunda (genelde görünmez) kalır
//   surekli : t ile t+dur arasında (dur yoksa sonsuza kadar) tekrar eden hareket
//   hareket : t..t+dur boyunca konumu devralır (ör. ekranı baştan sona geçme)
//
// Her ön ayar bir "katkı" döndürür:
//   toplanan : x, y, rotation            çarpılan: scale, scaleX, scaleY, opacity, fold
//   parts    : { parçaAdı: { rotation (toplanır), scaleX/scaleY (çarpılır) } }
import { ease, EASE_NAMES } from './easing.js';
import { FOLD_ORDERS } from './origami.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const noise = (x) => Math.sin(x) * 0.55 + Math.sin(x * 2.31 + 1.7) * 0.3 + Math.sin(x * 4.13 + 0.3) * 0.15;

const DIR = { label: 'Yön', type: 'select', options: [['sol', 'Soldan'], ['sag', 'Sağdan'], ['ust', 'Üstten'], ['alt', 'Alttan']] };
const dirVec = (d) => ({ sol: [-1, 0], sag: [1, 0], ust: [0, -1], alt: [0, 1] })[d] || [-1, 0];
const EASE = (def) => ({ key: 'ease', label: 'Eğri', type: 'select', options: EASE_NAMES.map((e) => [e, e]), def });

/** Katmanın ekran dışına çıkması için gereken mesafe (px) */
function offscreen(dir, env) {
  const [dx, dy] = dirVec(dir);
  const m = env.radius + 40;
  if (dx < 0) return env.st.x + m;
  if (dx > 0) return env.W - env.st.x + m;
  if (dy < 0) return env.st.y + m;
  return env.H - env.st.y + m;
}

/** Parça adı filtresi: boşsa varsayılan desen, doluysa virgülle ayrılmış adlar */
function matchParts(env, list, fallback) {
  const names = Object.keys(env.asset?.parts || {});
  if (list && list.trim()) {
    const want = list.split(',').map((s) => s.trim());
    return names.filter((n) => want.includes(n));
  }
  return names.filter((n) => fallback.test(n));
}

export const PRESETS = {
  // ------------------------------------------------------------------ giriş
  'katlanarak-gir': {
    name: 'Katlanarak gir', cat: 'giris', dur: 1.2,
    params: [{ key: 'sira', label: 'Açılma sırası', type: 'select', options: [['', '(katman ayarı)'], ...FOLD_ORDERS.map((o) => [o, o])], def: '' }],
    fn: (p, u) => ({ fold: u, ...(p.sira ? { foldOrder: p.sira } : {}) }),
  },
  // Çizim / boya stili için: önce kontur çizilir, sonra bölgeler boyanır (diğer stillerde fold gibi davranır)
  'cizerek-gir': {
    name: 'Çizerek gir', cat: 'giris', dur: 2.2,
    params: [],
    fn: (_p, u) => ({ fold: u }),
  },
  'zipla-gir': {
    name: 'Zıplayarak gir', cat: 'giris', dur: 0.8,
    params: [{ key: 'yay', label: 'Yaylanma', type: 'select', options: [['outBack', 'Yumuşak'], ['outElastic', 'Elastik'], ['outBounce', 'Sekme']], def: 'outBack' }],
    fn: (p, u) => ({ scale: Math.max(0, ease(p.yay, u)), opacity: clamp01(u * 4) }),
  },
  'kayarak-gir': {
    name: 'Kayarak gir', cat: 'giris', dur: 0.9,
    params: [{ key: 'yon', ...DIR, def: 'alt' }, { key: 'mesafe', label: 'Mesafe (px)', type: 'number', def: 240, step: 10 }, EASE('outCubic')],
    fn: (p, u) => {
      const [dx, dy] = dirVec(p.yon);
      const r = 1 - ease(p.ease, u);
      return { x: dx * p.mesafe * r, y: dy * p.mesafe * r, opacity: clamp01(u * 3) };
    },
  },
  'ekrana-gir': {
    name: 'Ekran dışından gir', cat: 'giris', dur: 1.4,
    params: [{ key: 'yon', ...DIR, def: 'sag' }, { key: 'yay', label: 'Kavis (px)', type: 'number', def: 120, step: 10 }, EASE('outCubic')],
    fn: (p, u, env) => {
      const [dx, dy] = dirVec(p.yon);
      const d = offscreen(p.yon, env);
      const r = 1 - ease(p.ease, u);
      const arc = Math.sin(Math.PI * r) * p.yay;
      return { x: dx * d * r + (dy ? arc : 0), y: dy * d * r - (dx ? arc : 0) };
    },
  },
  'dusup-gir': {
    name: 'Düşerek gir', cat: 'giris', dur: 1.1,
    params: [{ key: 'mesafe', label: 'Yükseklik (px)', type: 'number', def: 600, step: 20 }],
    fn: (p, u) => ({ y: -(1 - ease('outBounce', u)) * p.mesafe, opacity: clamp01(u * 5) }),
  },
  'donerek-gir': {
    name: 'Dönerek gir', cat: 'giris', dur: 1,
    params: [{ key: 'aci', label: 'Açı (°)', type: 'number', def: 360, step: 45 }, EASE('outBack')],
    fn: (p, u) => {
      const e = ease(p.ease, u);
      return { rotation: (1 - e) * p.aci, scale: Math.max(0, e), opacity: clamp01(u * 3) };
    },
  },
  belir: {
    name: 'Belir (solarak)', cat: 'giris', dur: 0.6,
    params: [],
    fn: (_p, u) => ({ opacity: ease('inOutSine', u) }),
  },

  // ------------------------------------------------------------------ çıkış
  'katlanarak-cik': {
    name: 'Katlanarak çık', cat: 'cikis', dur: 1,
    params: [{ key: 'sira', label: 'Kapanma sırası', type: 'select', options: [['', '(katman ayarı)'], ...FOLD_ORDERS.map((o) => [o, o])], def: '' }],
    fn: (p, u) => ({ fold: 1 - u, ...(p.sira ? { foldOrder: p.sira } : {}) }),
  },
  'silinerek-cik': {
    name: 'Silinerek çık', cat: 'cikis', dur: 1.2,
    params: [],
    fn: (_p, u) => ({ fold: 1 - u }),
  },
  'kuculerek-cik': {
    name: 'Küçülerek çık', cat: 'cikis', dur: 0.6,
    params: [],
    fn: (_p, u) => ({ scale: Math.max(0, 1 - ease('inBack', u)), opacity: 1 - clamp01((u - 0.7) / 0.3) }),
  },
  'kayarak-cik': {
    name: 'Kayarak çık', cat: 'cikis', dur: 0.8,
    params: [{ key: 'yon', ...DIR, def: 'alt' }, { key: 'mesafe', label: 'Mesafe (px)', type: 'number', def: 240, step: 10 }, EASE('inCubic')],
    fn: (p, u) => {
      const [dx, dy] = dirVec(p.yon);
      const e = ease(p.ease, u);
      return { x: dx * p.mesafe * e, y: dy * p.mesafe * e, opacity: 1 - clamp01((u - 0.4) / 0.6) };
    },
  },
  'ekrandan-cik': {
    name: 'Ekran dışına çık', cat: 'cikis', dur: 1.2,
    params: [{ key: 'yon', ...DIR, def: 'sol' }, EASE('inCubic')],
    fn: (p, u, env) => {
      const [dx, dy] = dirVec(p.yon);
      const d = offscreen(p.yon, env) * ease(p.ease, u);
      return { x: dx * d, y: dy * d };
    },
  },
  sol: {
    name: 'Sol (kaybol)', cat: 'cikis', dur: 0.6,
    params: [],
    fn: (_p, u) => ({ opacity: 1 - ease('inOutSine', u) }),
  },
  dal: {
    name: 'Dal (suya)', cat: 'cikis', dur: 1.6,
    params: [{ key: 'mesafe', label: 'Derinlik (px)', type: 'number', def: 260, step: 10 }, { key: 'aci', label: 'Eğim (°)', type: 'number', def: -18, step: 2 }],
    fn: (p, u) => ({ y: p.mesafe * ease('inQuad', u), rotation: p.aci * ease('outQuad', u), opacity: 1 - clamp01((u - 0.55) / 0.45) }),
  },

  // ---------------------------------------------------------------- sürekli
  suzul: {
    name: 'Süzül', cat: 'surekli',
    params: [{ key: 'genlik', label: 'Genlik (px)', type: 'number', def: 22, step: 2 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 2.4, step: 0.1 }],
    fn: (p, s, _env, k) => ({ y: noise((s / p.periyot) * TAU) * p.genlik * k, x: noise((s / p.periyot) * TAU * 0.7 + 3) * p.genlik * 0.5 * k }),
  },
  sallan: {
    name: 'Sallan', cat: 'surekli',
    params: [{ key: 'aci', label: 'Açı (°)', type: 'number', def: 6, step: 1 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 2.5, step: 0.1 }],
    fn: (p, s, _env, k) => ({ rotation: Math.sin((s / p.periyot) * TAU) * p.aci * k }),
  },
  nefes: {
    name: 'Nefes al', cat: 'surekli',
    params: [{ key: 'genlik', label: 'Şiddet', type: 'number', def: 0.02, step: 0.005 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 3, step: 0.1 }],
    fn: (p, s, _env, k) => {
      const w = Math.sin((s / p.periyot) * TAU) * p.genlik * k;
      return { scaleY: 1 + w, scaleX: 1 - w * 0.5 };
    },
  },
  nabiz: {
    name: 'Nabız', cat: 'surekli',
    params: [{ key: 'genlik', label: 'Büyüme', type: 'number', def: 0.1, step: 0.01 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 1, step: 0.1 }],
    fn: (p, s, _env, k) => ({ scale: 1 + Math.pow(0.5 + 0.5 * Math.sin((s / p.periyot) * TAU), 6) * p.genlik * k }),
  },
  seksek: {
    name: 'Hopla', cat: 'surekli',
    params: [{ key: 'yukseklik', label: 'Yükseklik (px)', type: 'number', def: 40, step: 5 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 0.7, step: 0.05 }],
    fn: (p, s, _env, k) => {
      const ph = (s / p.periyot) % 1;
      const hop = Math.sin(Math.PI * ph);
      const squash = ph < 0.08 || ph > 0.92 ? 0.06 : 0;
      return { y: -hop * p.yukseklik * k, scaleY: 1 - squash * k, scaleX: 1 + squash * k };
    },
  },
  dalgada: {
    name: 'Dalgada sallan', cat: 'surekli',
    params: [{ key: 'genlik', label: 'Genlik (px)', type: 'number', def: 10, step: 1 }, { key: 'aci', label: 'Açı (°)', type: 'number', def: 5, step: 1 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 2.8, step: 0.1 }],
    fn: (p, s, _env, k) => ({
      y: Math.sin((s / p.periyot) * TAU) * p.genlik * k,
      rotation: Math.sin((s / p.periyot + 0.25) * TAU) * p.aci * k,
    }),
  },
  titre: {
    name: 'Titre', cat: 'surekli',
    params: [{ key: 'genlik', label: 'Şiddet (px)', type: 'number', def: 4, step: 1 }],
    fn: (p, s, _env, k) => ({ x: noise(s * 40) * p.genlik * k, y: noise(s * 37 + 5) * p.genlik * k }),
  },
  don: {
    name: 'Dön', cat: 'surekli',
    params: [{ key: 'periyot', label: 'Tur süresi (sn)', type: 'number', def: 4, step: 0.5 }, { key: 'yon', label: 'Yön', type: 'select', options: [['1', 'Saat yönü'], ['-1', 'Ters']], def: '1' }],
    fn: (p, s) => ({ rotation: ((s / p.periyot) * 360 * Number(p.yon)) % 360 }),
  },
  'kanat-cirp': {
    name: 'Kanat çırp', cat: 'surekli',
    params: [
      { key: 'parcalar', label: 'Parçalar', type: 'text', def: '', hint: 'boş: wing/kanat içerenler' },
      { key: 'eksen', label: 'Eksen', type: 'select', options: [['Y', 'Dikey (kuş)'], ['X', 'Yatay (kelebek)']], def: 'Y' },
      { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 0.6, step: 0.05 },
      { key: 'alt', label: 'En kapalı', type: 'number', def: -0.7, step: 0.1 },
    ],
    fn: (p, s, env, k) => {
      const w = 0.5 + 0.5 * Math.sin((s / p.periyot) * TAU);
      const v = 1 + (p.alt + (1 - p.alt) * w - 1) * k;
      const parts = {};
      for (const n of matchParts(env, p.parcalar, /wing|kanat/i)) parts[n] = p.eksen === 'X' ? { scaleX: v } : { scaleY: v };
      return { parts };
    },
  },
  'kuyruk-salla': {
    name: 'Kuyruk salla', cat: 'surekli',
    params: [
      { key: 'parcalar', label: 'Parçalar', type: 'text', def: '', hint: 'boş: tail/kuyruk içerenler' },
      { key: 'aci', label: 'Açı (°)', type: 'number', def: 10, step: 1 },
      { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 1.6, step: 0.1 },
    ],
    fn: (p, s, env, k) => {
      const parts = {};
      const r = Math.sin((s / p.periyot) * TAU) * p.aci * k;
      for (const n of matchParts(env, p.parcalar, /tail|kuyruk/i)) parts[n] = { rotation: r };
      return { parts };
    },
  },

  // ---------------------------------------------------------------- hareket
  gec: {
    name: 'Ekranı geç', cat: 'hareket', dur: 6,
    params: [
      { key: 'yon', label: 'Yön', type: 'select', options: [['sag', 'Soldan sağa'], ['sol', 'Sağdan sola']], def: 'sag' },
      { key: 'yay', label: 'Kavis (px)', type: 'number', def: 80, step: 10 },
      EASE('linear'),
    ],
    fn: (p, u, env) => {
      const m = env.radius + 40;
      const e = ease(p.ease, u);
      const from = p.yon === 'sag' ? -m : env.W + m;
      const to = p.yon === 'sag' ? env.W + m : -m;
      return { x: from + (to - from) * e - env.st.x, y: -Math.sin(Math.PI * e) * p.yay };
    },
  },
};

export const PRESET_CATS = { giris: 'Giriş', cikis: 'Çıkış', surekli: 'Sürekli', hareket: 'Hareket' };

export function presetDefaults(id) {
  const P = PRESETS[id];
  if (!P) return {};
  const out = {};
  for (const prm of P.params) out[prm.key] = prm.def;
  return out;
}

const ADD = ['x', 'y', 'rotation'];
const MUL = ['scale', 'scaleX', 'scaleY', 'opacity', 'fold'];

/**
 * Katmanın anims listesini t anında st'ye (çözülmüş katman durumu) uygular.
 * env: { W, H, asset, radius }. Parça katkıları st.partFx'e yazılır.
 */
export function applyAnims(layer, st, t, env) {
  const anims = layer.anims;
  if (!anims || !anims.length) return st;
  const base = { ...st };
  const e = { ...env, st: base };
  for (const a of anims) {
    const P = PRESETS[a.preset];
    if (!P || a.off) continue;
    const p = { ...presetDefaults(a.preset), ...a };
    const start = a.t ?? 0;
    const dur = a.dur ?? P.dur ?? null;
    let c = null;
    if (P.cat === 'giris') {
      c = P.fn(p, clamp01(dur ? (t - start) / dur : 1), e);
    } else if (P.cat === 'cikis') {
      if (t < start) continue;
      c = P.fn(p, clamp01(dur ? (t - start) / dur : 1), e);
    } else if (P.cat === 'hareket') {
      if (t < start || t > start + dur) {
        c = { opacity: 0 };
      } else {
        c = P.fn(p, clamp01((t - start) / dur), e);
      }
    } else {
      if (t < start || (dur != null && t > start + dur)) continue;
      const s = t - start;
      const fade = a.yumusat ?? 0.4;
      let k = fade > 0 ? Math.min(1, s / fade) : 1;
      if (dur != null && fade > 0) k = Math.min(k, (start + dur - t) / fade);
      c = P.fn(p, s, e, Math.max(0, k));
    }
    if (!c) continue;
    for (const key of ADD) if (c[key] != null) st[key] += c[key];
    for (const key of MUL) if (c[key] != null) st[key] *= c[key];
    if (c.foldOrder) st.foldOrder = c.foldOrder;
    if (c.parts) {
      st.partFx ||= {};
      for (const n in c.parts) {
        const pf = (st.partFx[n] ||= {});
        for (const key in c.parts[n]) {
          if (key === 'rotation' || key === 'x' || key === 'y') pf[key] = (pf[key] || 0) + c.parts[n][key];
          else pf[key] = (pf[key] ?? 1) * c.parts[n][key];
        }
      }
    }
  }
  st.opacity = clamp01(st.opacity);
  st.fold = clamp01(st.fold);
  return st;
}
