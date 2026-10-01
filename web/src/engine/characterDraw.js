// Karakter çizim ilkelleri: deterministik gürültü, "el çizimi" titreme (kaynama), düzgünleştirilmiş şekil / çizgi yardımcıları.
// Saf ve tohumludur: aynı (zaman dilimi, şekil no) hep aynı titremeyi verir → önizleme ve MP4 aynı kareyi üretir.

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const sstep = (k) => {
  const x = clamp01(k);
  return x * x * (3 - 2 * x);
};
export const hashStr = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** [-1, 1] aralığında tamsayı kafesli deterministik gürültü */
export function noise(a, b) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2147483648 - 1;
}
/** Düzgün (kafes arası yumuşak) gürültü */
export function snoise(seed, s) {
  const i = Math.floor(s);
  const f = sstep(s - i);
  return lerp(noise(seed, i), noise(seed, i + 1), f);
}

// ------------------------------------------------------------------ titreme durumu
const J = { amp: 0, q: 0, base: 0, n: 0 };
/** Her karede bir kez: amp = piksel titreme, q = zaman dilimi (kaynama), base = karaktere özgü tohum */
export function beginJitter(amp, q, base) {
  J.amp = amp;
  J.q = q;
  J.base = base;
  J.n = 0;
}
export const nextShapeId = () => ++J.n;

function wobblePts(pts, id) {
  if (!J.amp) return pts;
  const seed = (J.base + id * 7919 + J.q * 104729) | 0;
  return pts.map((p, i) => [p[0] + snoise(seed, i * 0.4) * J.amp, p[1] + snoise(seed + 31, i * 0.4) * J.amp]);
}

// ------------------------------------------------------------------ nokta kümeleri
export function ellipsePts(rx, ry, n = 32, cx = 0, cy = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}
/** Süper elips: e = 2 elips, > 2 kareye yaklaşır */
export function superPts(rx, ry, e = 3, n = 40) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.push([rx * Math.sign(c) * Math.abs(c) ** (2 / e), ry * Math.sign(s) * Math.abs(s) ** (2 / e)]);
  }
  return out;
}
/** Yumurta: altı biraz geniş */
export function eggPts(rx, ry, n = 36) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    out.push([rx * Math.cos(a) * (1 + 0.1 * Math.sin(a)), ry * Math.sin(a)]);
  }
  return out;
}
/** Yuvarlatılmış dikdörtgen; r = [sol-üst, sağ-üst, sağ-alt, sol-alt] */
export function rrectPts(x0, y0, x1, y1, r = 10, seg = 6) {
  const R = Array.isArray(r) ? r : [r, r, r, r];
  const out = [];
  const corner = (cx, cy, rad, a0) => {
    if (rad < 0.5) {
      out.push([cx, cy]);
      return;
    }
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
  };
  const lim = Math.min(x1 - x0, y1 - y0) / 2;
  const [a, b, c, d] = R.map((v) => Math.min(v, lim));
  corner(x0 + a, y0 + a, a, Math.PI);
  corner(x1 - b, y0 + b, b, Math.PI * 1.5);
  corner(x1 - c, y1 - c, c, 0);
  corner(x0 + d, y1 - d, d, Math.PI / 2);
  return out;
}

// ------------------------------------------------------------------ yol çizimi
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export function pathSmooth(ctx, pts, closed = true) {
  const n = pts.length;
  ctx.beginPath();
  if (n < 2) return;
  if (closed) {
    const m0 = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}

/** Kapalı şekil: dolgu + kontur (titremeli) */
export function shape(ctx, pts, fill, stroke, lw, closed = true) {
  const p = wobblePts(pts, nextShapeId());
  pathSmooth(ctx, p, closed);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && lw > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

/** Açık çizgi (uzuv, kaş…): ara noktalar eklenir ki titreme düzgün görünsün */
export function strokeLine(ctx, pts, color, lw) {
  let p = pts;
  if (J.amp) {
    p = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const k = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 22));
      for (let j = 1; j <= k; j++) p.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
    }
    p = wobblePts(p, nextShapeId());
    // uçlar yerinde kalsın
    p[0] = pts[0];
    p[p.length - 1] = pts[pts.length - 1];
  }
  pathSmooth(ctx, p, false);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function fillCircle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && lw > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

export function fillEllipse(ctx, x, y, rx, ry, rot, fill, stroke, lw) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && lw > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

export function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function starPath(ctx, cx, cy, r, inner = 0.45, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rad = i % 2 ? r * inner : r;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

export function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.8, cy - s * 1.2, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s * 0.8, cy - s * 1.2, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}
