const c1 = 1.70158;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;

function outBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export const easings = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: (t) => c3 * t * t * t - c1 * t * t,
  outBack: (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  outElastic: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1,
  outBounce,
  step: (t) => (t < 1 ? 0 : 1),
};

export const EASE_NAMES = Object.keys(easings);
export const DEFAULT_EASE = 'inOutCubic';

/**
 * Kübik Bézier easing (CSS cubic-bezier ile aynı): P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1).
 * x → parametre çözümü: Newton, yakınsamazsa ikiye bölme.
 */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0;
    let hi = 1;
    u = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

const bezierCache = new Map();
export const isBezier = (e) => Array.isArray(e) && e.length === 4 && e.every((v) => typeof v === 'number');

/** Adlandırılmış eğri ("outBack") ya da özel kübik Bézier ([x1, y1, x2, y2]) */
export function ease(name, t) {
  if (isBezier(name)) {
    const key = name.join(',');
    let f = bezierCache.get(key);
    if (!f) {
      f = cubicBezier(...name);
      if (bezierCache.size > 200) bezierCache.clear();
      bezierCache.set(key, f);
    }
    return f(t);
  }
  return (easings[name] || easings[DEFAULT_EASE])(t);
}

/** Editör için hazır kübik Bézier eğrileri (CSS ve yaygın tasarım eğrileri) */
export const BEZIER_PRESETS = {
  'CSS ease': [0.25, 0.1, 0.25, 1],
  'CSS ease-in': [0.42, 0, 1, 1],
  'CSS ease-out': [0, 0, 0.58, 1],
  'CSS ease-in-out': [0.42, 0, 0.58, 1],
  'Yumuşak iniş': [0.16, 1, 0.3, 1],
  'Keskin başla': [0.7, 0, 0.84, 0],
  'Hafif taşma': [0.34, 1.56, 0.64, 1],
  'Geri çekil': [0.36, 0, 0.66, -0.56],
  'Kağıt düşüşü': [0.55, 0.06, 0.68, 0.19],
  'Materyal': [0.4, 0, 0.2, 1],
};
