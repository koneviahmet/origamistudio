// Proje teması: varlık renklerini tek noktadan dönüştürür ve kağıt tipini belirler.
//
// Renk hattı (her facet rengi için):
//   1. rol rengi   → theme.roles[rol] tanımlıysa doğrudan o renk (marka rengi)
//   2. sınırlı palet → theme.palette'teki en yakın renge doğru (paletteStrength kadar) kaydır
//   3. ayar       → ton, doygunluk, parlaklık, sıcaklık, kontrast
//   4. kağıt tipi → pastel/kraft gibi kağıtların kendi renk etkisi
import { parseHex, toHex } from './color.js';

export const ROLES = ['ana', 'ikincil', 'vurgu', 'acik', 'koyu', 'detay'];
export const ROLE_LABELS = { ana: 'Ana', ikincil: 'İkincil', vurgu: 'Vurgu', acik: 'Açık', koyu: 'Koyu', detay: 'Detay' };

// Kağıt tipleri: facet gölge çarpanı, kırışık çizgisi, doku gücü, arka yüz rengi, renk etkisi
export const PAPERS = {
  mat: { label: 'Mat kağıt', shadeMul: 1, crease: 0.16, texture: 0.5, back: '#f4eee3' },
  parlak: { label: 'Parlak kağıt', shadeMul: 1.45, crease: 0.32, texture: 0.25, back: '#fbf8f2', gloss: 0.18 },
  kraft: { label: 'Kraft kağıt', shadeMul: 0.9, crease: 0.1, texture: 0.9, back: '#c9a47a', tint: ['#b08455', 0.18] },
  pastel: { label: 'Pastel kağıt', shadeMul: 0.75, crease: 0.22, texture: 0.45, back: '#fbf7f2', pastel: 0.35 },
  kadife: { label: 'Kadife (koyu mat)', shadeMul: 0.8, crease: 0.05, texture: 0.7, back: '#2b2530', velvet: 0.25 },
};

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
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}

// sRGB → Lab (algısal uzaklık için)
function toLab([r, g, b]) {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const x = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047);
  const y = f(R * 0.2126 + G * 0.7152 + B * 0.0722);
  const z = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

export function adjustRgb(rgb, adj = {}) {
  let [h, s, l] = rgbToHsl(rgb);
  if (adj.hue) h = (h + adj.hue / 360 + 1) % 1;
  if (adj.saturation != null && adj.saturation !== 1) s = Math.min(1, Math.max(0, s * adj.saturation));
  if (adj.contrast != null && adj.contrast !== 1) l = Math.min(1, Math.max(0, 0.5 + (l - 0.5) * adj.contrast));
  if (adj.brightness) l = adj.brightness > 0 ? l + (1 - l) * adj.brightness : l * (1 + adj.brightness);
  let out = hslToRgb([h, s, l]);
  if (adj.warmth) out = mix(out, adj.warmth > 0 ? [255, 150, 60] : [60, 130, 255], Math.min(0.5, Math.abs(adj.warmth) * 0.3));
  return out;
}

/** "$anahtar" biçimindeki renk referanslarını tema renkleriyle çözer. */
export function resolveRef(c, theme) {
  if (typeof c !== 'string' || c[0] !== '$') return c;
  return theme?.colors?.[c.slice(1)] || '#888888';
}

/**
 * Tema bağlamı: renderer her kare başında bir kez oluşturur (önbellekli).
 * { fx(hex, role) → hex, paper, colors }
 */
// Önbellek anahtarı tema içeriğidir (JSON): editörde yerinde değişen tema da doğru yansır.
const ctxCache = new Map();
export function themeContext(theme) {
  const key = theme ? JSON.stringify(theme) : '';
  let c = ctxCache.get(key);
  if (c) return c;
  if (ctxCache.size > 24) ctxCache.clear();
  const t = theme || {};
  const paper = { ...PAPERS.mat, ...(PAPERS[t.paper] || {}), ...(t.paperOverrides || {}) };
  const palette = (t.palette || []).map((h) => ({ rgb: parseHex(h), lab: toLab(parseHex(h)) }));
  const strength = t.paletteStrength ?? 1;
  const roles = t.roles || {};
  const adj = t.adjust || {};
  const identity =
    !palette.length && !Object.keys(roles).length && !Object.keys(adj).length && !paper.tint && !paper.pastel && !paper.velvet;
  const cache = new Map();

  function fx(hex, role) {
    if (identity) return hex;
    const k = `${hex}|${role || ''}`;
    let out = cache.get(k);
    if (out) return out;
    if (role && roles[role]) {
      out = resolveRef(roles[role], t);
    } else {
      let rgb = parseHex(hex);
      if (palette.length && strength > 0) {
        const lab = toLab(rgb);
        let best = palette[0];
        let bd = Infinity;
        for (const p of palette) {
          const d = (p.lab[0] - lab[0]) ** 2 * 0.6 + (p.lab[1] - lab[1]) ** 2 + (p.lab[2] - lab[2]) ** 2;
          if (d < bd) {
            bd = d;
            best = p;
          }
        }
        rgb = mix(rgb, best.rgb, strength);
      }
      rgb = adjustRgb(rgb, adj);
      if (paper.tint) rgb = mix(rgb, parseHex(paper.tint[0]), paper.tint[1]);
      if (paper.pastel) {
        const [h, s, l] = rgbToHsl(rgb);
        rgb = hslToRgb([h, s * (1 - paper.pastel), l + (1 - l) * paper.pastel]);
      }
      if (paper.velvet) {
        const [h, s, l] = rgbToHsl(rgb);
        rgb = hslToRgb([h, Math.min(1, s * (1 + paper.velvet)), l * (1 - paper.velvet * 0.8)]);
      }
      out = toHex(rgb);
    }
    if (cache.size > 4000) cache.clear();
    cache.set(k, out);
    return out;
  }

  c = { fx, paper, colors: t.colors || {}, theme: t, identity };
  ctxCache.set(key, c);
  return c;
}
