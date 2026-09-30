// Hareket yolu (Ö4): katman, sahnede tanımlı bir eğri boyunca ilerler.
//
// layer.path = { points: [[x,y], ...], smooth: true, closed: false, orient: false, orientOffset: 0 }
// layer.pathT = 0..1 (keyframe'li olabilir) — yol üzerindeki konum, YAY UZUNLUĞUNA göre (sabit hız).
// smooth: noktalardan geçen Catmull-Rom eğrisi; false: düz çizgiler.

const cache = new Map();
const STEPS = 24;

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1].map(
    (i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3),
  );
}

/** Yolu sık örneklenmiş çoklu çizgiye çevirir (önbellekli): { pts, cum, len } */
export function samplePath(path) {
  const key = JSON.stringify([path.points, path.smooth !== false, !!path.closed]);
  let s = cache.get(key);
  if (s) return s;
  const P = path.points;
  const n = P.length;
  const closed = !!path.closed && n > 2;
  const pts = [];
  const segs = closed ? n : n - 1;
  const at = (i) => (closed ? P[((i % n) + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < STEPS; k++) {
      const t = k / STEPS;
      if (path.smooth === false) {
        const a = at(i);
        const b = at(i + 1);
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      } else {
        pts.push(catmull(at(i - 1), at(i), at(i + 1), at(i + 2), t));
      }
    }
  }
  pts.push(closed ? [...P[0]] : [...P[n - 1]]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  s = { pts, cum, len: cum[cum.length - 1] };
  if (cache.size > 300) cache.clear();
  cache.set(key, s);
  return s;
}

/** Yol üzerindeki nokta ve yön açısı (derece). u: 0..1 (kapalı yolda sarar) */
export function pathAt(path, u) {
  const { pts, cum, len } = samplePath(path);
  if (pts.length < 2 || len === 0) return { x: pts[0]?.[0] ?? 0, y: pts[0]?.[1] ?? 0, angle: 0 };
  let v = path.closed ? ((u % 1) + 1) % 1 : Math.max(0, Math.min(1, u));
  const target = v * len;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const k = (target - cum[lo]) / seg;
  const a = pts[lo];
  const b = pts[hi];
  return {
    x: a[0] + (b[0] - a[0]) * k,
    y: a[1] + (b[1] - a[1]) * k,
    angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
  };
}

/** Bir noktaya en yakın yol konumu (yeni nokta eklemek için): { u, dist, seg } */
export function nearestOnPath(path, x, y) {
  const { pts, cum, len } = samplePath(path);
  let best = { u: 0, dist: Infinity, i: 0 };
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - x, pts[i][1] - y);
    if (d < best.dist) best = { u: len ? cum[i] / len : 0, dist: d, i };
  }
  // Hangi kontrol noktası aralığında: örnek indeksinden
  best.seg = Math.min(path.points.length - 1, Math.floor(best.i / STEPS));
  return best;
}
