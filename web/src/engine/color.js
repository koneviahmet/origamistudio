const cache = new Map();

export function parseHex(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [200, 200, 200];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}

/**
 * Bir rengi açar (s > 0) ya da koyulaştırır (s < 0). s ∈ [-1, 1].
 * Origami yüzeylerindeki ışık farkı bu fonksiyonla verilir.
 */
export function shade(hex, s = 0) {
  const q = Math.round(s * 100) / 100;
  if (!q) return hex;
  const key = `${hex}|${q}`;
  let out = cache.get(key);
  if (out) return out;
  const [h, sat, l] = rgbToHsl(parseHex(hex));
  const nl = q > 0 ? l + (1 - l) * q : l * (1 + q);
  out = toHex(hslToRgb([h, sat, Math.max(0, Math.min(1, nl))]));
  if (cache.size > 5000) cache.clear();
  cache.set(key, out);
  return out;
}

export function lerpColor(a, b, k) {
  const A = parseHex(a);
  const B = parseHex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * k));
}
