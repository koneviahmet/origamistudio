// Metin animasyonları — harf / kelime / satır bazlı, tahribatsız.
//
// Metin katmanı: "textAnims": [ { "preset": "harf-katla", "t": 1, "dur": 0.5, "aralik": 0.05 } ]
//   dur    : TEK birimin (harf/kelime/satır) animasyon süresi
//   aralik : ardışık birimler arasındaki gecikme (sn)
import { ease } from './easing.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const TAU = Math.PI * 2;
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const TEXT_ANIMS = {
  'harf-katla': {
    name: 'Harf harf katlanarak', cat: 'giris', unit: 'harf', dur: 0.55, aralik: 0.05,
    fn: (g, p) => {
      const e = ease('outCubic', p);
      g.sy *= Math.cos(Math.PI * (1 - e));
      g.alpha *= clamp01(p * 3);
    },
  },
  'harf-zipla': {
    name: 'Harf harf zıpla', cat: 'giris', unit: 'harf', dur: 0.45, aralik: 0.04,
    fn: (g, p) => {
      const e = Math.max(0, ease('outBack', p));
      g.sx *= e;
      g.sy *= e;
      g.alpha *= clamp01(p * 4);
    },
  },
  'harf-dus': {
    name: 'Harf harf düş', cat: 'giris', unit: 'harf', dur: 0.7, aralik: 0.05,
    fn: (g, p, size) => {
      g.dy -= (1 - ease('outBounce', p)) * size * 1.6;
      g.alpha *= clamp01(p * 5);
    },
  },
  'harf-don': {
    name: 'Harf harf dön', cat: 'giris', unit: 'harf', dur: 0.6, aralik: 0.05,
    fn: (g, p) => {
      const e = ease('outBack', p);
      g.rot += (1 - e) * -100;
      g.sx *= Math.max(0, e);
      g.sy *= Math.max(0, e);
      g.alpha *= clamp01(p * 3);
    },
  },
  'harf-belir': {
    name: 'Harf harf belir', cat: 'giris', unit: 'harf', dur: 0.4, aralik: 0.035,
    fn: (g, p, size) => {
      g.alpha *= ease('inOutSine', p);
      g.dy += (1 - ease('outCubic', p)) * size * 0.35;
    },
  },
  'kelime-zipla': {
    name: 'Kelime kelime zıpla', cat: 'giris', unit: 'kelime', dur: 0.5, aralik: 0.14,
    fn: (g, p, size) => {
      const e = Math.max(0, ease('outBack', p));
      g.sx *= e;
      g.sy *= e;
      g.dy += (1 - e) * size * 0.4;
      g.alpha *= clamp01(p * 4);
    },
  },
  'satir-kay': {
    name: 'Satır satır kay', cat: 'giris', unit: 'satir', dur: 0.6, aralik: 0.18,
    fn: (g, p, size) => {
      g.dx -= (1 - ease('outCubic', p)) * size * 3;
      g.alpha *= clamp01(p * 2.5);
    },
  },
  dalga: {
    name: 'Dalga', cat: 'surekli', unit: 'harf', aralik: 0.08,
    params: [{ key: 'genlik', label: 'Genlik (× boyut)', type: 'number', def: 0.12, step: 0.02 }, { key: 'periyot', label: 'Periyot (sn)', type: 'number', def: 1.6, step: 0.1 }],
    fn: (g, s, size, a, j) => {
      g.dy += Math.sin((s / a.periyot) * TAU - j * (a.aralik / a.periyot) * TAU) * a.genlik * size * a.k;
    },
  },
  titresim: {
    name: 'Titreşim', cat: 'surekli', unit: 'harf',
    params: [{ key: 'genlik', label: 'Şiddet (× boyut)', type: 'number', def: 0.03, step: 0.01 }],
    fn: (g, s, size, a, j) => {
      g.dx += Math.sin(s * 37 + j * 3.1) * a.genlik * size * a.k;
      g.dy += Math.sin(s * 41 + j * 5.7) * a.genlik * size * a.k;
    },
  },
  'harf-katla-cik': {
    name: 'Harf harf katlanarak çık', cat: 'cikis', unit: 'harf', dur: 0.45, aralik: 0.035,
    fn: (g, p) => {
      g.sy *= Math.cos(Math.PI * ease('inCubic', p));
      g.alpha *= 1 - clamp01((p - 0.7) / 0.3);
    },
  },
  'harf-dagil': {
    name: 'Harfler dağılsın', cat: 'cikis', unit: 'harf', dur: 0.7, aralik: 0.02,
    fn: (g, p, size, _a, j) => {
      const e = ease('inQuad', p);
      g.dx += (hash(j) - 0.5) * size * 3 * e;
      g.dy += (hash(j + 9) * 1.5 + 0.5) * size * 2 * e;
      g.rot += (hash(j + 3) - 0.5) * 240 * e;
      g.alpha *= 1 - p;
    },
  },
};

export const TEXT_ANIM_CATS = { giris: 'Giriş', surekli: 'Sürekli', cikis: 'Çıkış' };

export function textAnimDefaults(id) {
  const A = TEXT_ANIMS[id];
  const out = {};
  for (const p of A?.params || []) out[p.key] = p.def;
  return out;
}

/**
 * Bir glifin (harf) durumunu hesaplar.
 * idx: { harf, kelime, satir } — o birim türündeki sıra numaraları
 */
export function glyphState(anims, idx, t, size) {
  const g = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1 };
  for (const a of anims) {
    const A = TEXT_ANIMS[a.preset];
    if (!A || a.off) continue;
    const j = idx[A.unit] ?? idx.harf;
    const aralik = a.aralik ?? A.aralik ?? 0.05;
    const start = (a.t ?? 0) + j * aralik;
    if (A.cat === 'surekli') {
      if (t < (a.t ?? 0) || (a.dur != null && t > (a.t ?? 0) + a.dur)) continue;
      const s = t - (a.t ?? 0);
      const k = Math.min(1, s / 0.4);
      A.fn(g, s, size, { ...textAnimDefaults(a.preset), ...a, aralik, k }, j);
    } else {
      const dur = a.dur ?? A.dur;
      const p = clamp01((t - start) / dur);
      if (A.cat === 'cikis' && t < start) continue;
      A.fn(g, p, size, a, j);
    }
  }
  return g;
}
