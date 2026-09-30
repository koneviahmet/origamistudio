// Keyframe örnekleme ve döngüsel (loop) hareketler.
//
// Bir özellik iki biçimde yazılabilir:
//   "x": 540                                   → sabit değer
//   "x": [{ "t": 0, "v": 0 }, { "t": 2, "v": 540, "ease": "outBack" }]  → keyframe izi
// Bir keyframe'in "ease" alanı, ÖNCEKİ keyframe'den o keyframe'e geçişin eğrisidir.
import { ease } from './easing.js';
import { lerpColor } from './color.js';

// Keyframe izi: { t, v } nesnelerinden oluşan dizi. ("anims" gibi t içeren ama v içermeyen
// diziler keyframe değildir.)
export function isTrack(v) {
  return Array.isArray(v) && v.length > 0 && v[0] !== null && typeof v[0] === 'object' && 't' in v[0] && 'v' in v[0];
}

function lerp(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => x + ((b[i] ?? x) - x) * k);
  if (typeof a === 'string' && a[0] === '#' && typeof b === 'string') return lerpColor(a, b, k);
  return k < 1 ? a : b;
}

export function sample(v, t, def) {
  if (v === undefined || v === null) return def;
  if (!isTrack(v)) return v;
  const n = v.length;
  if (t <= v[0].t) return v[0].v;
  if (t >= v[n - 1].t) return v[n - 1].v;
  for (let i = 0; i < n - 1; i++) {
    const a = v[i];
    const b = v[i + 1];
    if (t >= a.t && t < b.t) {
      const span = b.t - a.t;
      const k = span > 0 ? (t - a.t) / span : 1;
      return lerp(a.v, b.v, ease(b.ease, k));
    }
  }
  return v[n - 1].v;
}

/** Düzgün, tekrarlanabilir "gürültü" — birkaç sinüsün toplamı (deterministik). */
function smoothNoise(x) {
  return (
    Math.sin(x) * 0.55 +
    Math.sin(x * 2.31 + 1.7) * 0.3 +
    Math.sin(x * 4.13 + 0.3) * 0.15
  );
}

/**
 * loops: [{ prop, type: "sine"|"triangle"|"saw"|"noise", amp, period, phase, start, end }]
 * Tanımlı özelliğe (prop) eklenecek ofseti döndürür.
 */
export function loopOffset(loops, prop, t) {
  if (!loops || !loops.length) return 0;
  let sum = 0;
  for (const l of loops) {
    if (l.prop !== prop) continue;
    if (l.start != null && t < l.start) continue;
    if (l.end != null && t > l.end) continue;
    const period = l.period || 1;
    const x = t / period + (l.phase || 0);
    const amp = l.amp ?? 1;
    let w;
    switch (l.type) {
      case 'triangle': {
        const f = x - Math.floor(x);
        w = 1 - 4 * Math.abs(f - 0.5);
        break;
      }
      case 'saw':
        w = (x - Math.floor(x)) * 2 - 1;
        break;
      case 'noise':
        w = smoothNoise(x * Math.PI * 2);
        break;
      default:
        w = Math.sin(x * Math.PI * 2);
    }
    sum += amp * w;
  }
  return sum;
}

export function prop(obj, name, t, def) {
  return sample(obj[name], t, def) + loopOffset(obj.loops, name, t);
}

/** Bir keyframe izinde t anına (±eps) denk gelen keyframe'in indeksini bulur. */
export function keyIndexAt(track, t, eps = 1 / 120) {
  if (!isTrack(track)) return -1;
  return track.findIndex((k) => Math.abs(k.t - t) <= eps);
}
