// 3B poligon-ağı araç seti (seed-uzay-yarisi-3d.mjs'den ayrıldı): lathe, box, ball, extrude, panel, ribbon, xf, render.
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const D = Math.PI / 180;

// ---- vektör
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const rotY = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const rotX = (v, a) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function makeNoise(seed, freq = 2.2, n = 9) {
  const R = rng(seed);
  const waves = Array.from({ length: n }, () => ({ d: norm([R() - 0.5, R() - 0.5, R() - 0.5]), f: freq * (0.6 + R() * 0.9), p: R() * 6.28 }));
  return (v) => waves.reduce((s, w) => s + Math.sin(dot(v, w.d) * w.f * 3 + w.p), 0) / n;
}

const LIGHT = norm([-0.6, 0.55, 0.75]);
const shade = (n, bias = 0, k = 0.62) => Math.max(-0.5, Math.min(0.42, dot(n, LIGHT) * k - 0.06 + bias));

// ---- çokgen: { P:[3B noktalar], n:[normal], c:anahtar, two:çift yüzlü, b:ışık sapması }
const poly = (P, n, c, extra = {}) => ({ P, n: norm(n), c, ...extra });

/** Devrim yüzeyi (Y ekseni). profile: [[r,y],...] alttan üste, dışa doğru giden yol (normal yolun sağında). key: (j,i)=>anahtar */
function lathe(profile, seg, key, o = {}) {
  const out = [];
  const pt = (r, y, a) => [r * Math.cos(a), y, r * Math.sin(a)];
  for (let j = 0; j < profile.length - 1; j++) {
    const [r0, y0] = profile[j], [r1_, y1] = profile[j + 1];
    const dr = r1_ - r0, dy = y1 - y0, L = Math.hypot(dr, dy) || 1;
    const nr = dy / L, ny = -dr / L;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2, am = (a0 + a1) / 2;
      const pts = [pt(r0, y0, a0), pt(r0, y0, a1), pt(r1_, y1, a1), pt(r1_, y1, a0)];
      const uniq = pts.filter((p, k) => pts.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-6) === k);
      if (uniq.length < 3) continue;
      out.push(poly(uniq, [nr * Math.cos(am), ny, nr * Math.sin(am)], key(j, i), o.extra));
    }
  }
  return out;
}
/** Yarıküre / kapsül profili yardımcıları */
const arc = (cr, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => { const a = (a0 + (a1 - a0) * k / n) * D; return [cr + r * Math.cos(a), cy + r * Math.sin(a)]; });

/** Kutu (merkez, boyut) — anahtar: fn(yüzAdı) ya da sabit */
function box(c, s, key, o = {}) {
  const [hx, hy, hz] = [s[0] / 2, s[1] / 2, s[2] / 2];
  const k = typeof key === 'function' ? key : () => key;
  const F = [
    ['+x', [1, 0, 0], [[hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [hx, -hy, hz]]],
    ['-x', [-1, 0, 0], [[-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-hx, -hy, -hz]]],
    ['+y', [0, 1, 0], [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz]]],
    ['-y', [0, -1, 0], [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz]]],
    ['+z', [0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]]],
    ['-z', [0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]]],
  ];
  return F.map(([nm, n, P]) => poly(P.map((p) => add(p, c)), n, k(nm), o.extra));
}
/** Elipsoid (ikosfer) */
function icoMesh(sb) {
  const t = (1 + Math.sqrt(5)) / 2;
  let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let k = 0; k < sb; k++) {
    const cache = new Map();
    const mid = (a, b) => { const key = a < b ? a + '_' + b : b + '_' + a; if (!cache.has(key)) { V.push(norm(mul(add(V[a], V[b]), 0.5))); cache.set(key, V.length - 1); } return cache.get(key); };
    const NF = [];
    for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); NF.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    F = NF;
  }
  return { V, F };
}
function ball(c, s, sb, key, o = {}) {
  const { V, F } = icoMesh(sb);
  const R = rng((o.seed || 1) * 31 + 7);
  const jit = V.map(() => 1 + (R() - 0.5) * 2 * (o.jitter || 0));
  const k = typeof key === 'function' ? key : () => key;
  const pts = V.map((v, i) => [c[0] + v[0] * s[0] * jit[i], c[1] + v[1] * s[1] * jit[i], c[2] + v[2] * s[2] * jit[i]]);
  return F.map(([a, b, d], fi) => {
    const fc = norm(add(add(V[a], V[b]), V[d]));
    const n = [fc[0] / s[0], fc[1] / s[1], fc[2] / s[2]];
    return poly([pts[a], pts[b], pts[d]], n, k(fc, fi), o.extra);
  });
}
/** Ekstrüzyon: xy düzlemindeki dış hat, z boyunca kalınlık */
function extrude(outline, t, key, o = {}) {
  const h = t / 2, out = [];
  out.push(poly(outline.map(([x, y]) => [x, y, h]), [0, 0, 1], key, o.extra));
  out.push(poly(outline.slice().reverse().map(([x, y]) => [x, y, -h]), [0, 0, -1], key, o.extra));
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length, cy = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    let n = [b[1] - a[1], -(b[0] - a[0]), 0];
    if (dot(n, [(a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy, 0]) < 0) n = mul(n, -1);
    out.push(poly([[a[0], a[1], h], [b[0], b[1], h], [b[0], b[1], -h], [a[0], a[1], -h]], n, o.side || key, o.extra));
  }
  return out;
}
/** Izgaralı düz panel (xy düzleminde, çift yüzlü) */
function panel(w, h, cols, rows, keys, o = {}) {
  const out = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = -w / 2 + (w * i) / cols, x1 = -w / 2 + (w * (i + 1)) / cols, y0 = -h / 2 + (h * j) / rows, y1 = -h / 2 + (h * (j + 1)) / rows;
    out.push(poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], [0, 0, 1], keys[(i + j) % keys.length], { two: true, b: ((i + j) % 2 ? 0.03 : -0.03) }));
  }
  return out;
}
/** Şerit (kuyruk): noktalar dizisi + genişlikler; çift yüzlü dörtgenler */
function ribbon(path_, widths, keys, o = {}) {
  const out = [];
  for (let i = 0; i < path_.length - 1; i++) {
    const a = path_[i], b = path_[i + 1];
    const d = norm(sub(b, a));
    const side = norm(cross(d, o.up || [0, 0, 1]));
    const P = [add(a, mul(side, widths[i])), add(b, mul(side, widths[i + 1])), sub(b, mul(side, widths[i + 1])), sub(a, mul(side, widths[i]))];
    out.push(poly(P, cross(d, side), keys[i % keys.length], { two: true, b: o.b || 0 }));
  }
  return out;
}

// ---- dönüşüm
function xf(polys, { s = [1, 1, 1], rx = 0, ry = 0, rz = 0, t = [0, 0, 0] } = {}) {
  const S = typeof s === 'number' ? [s, s, s] : s;
  const f = (v) => add(rotY(rotX(rotZ([v[0] * S[0], v[1] * S[1], v[2] * S[2]], rz * D), rx * D), ry * D), t);
  const g = (n) => rotY(rotX(rotZ(n, rz * D), rx * D), ry * D);
  return polys.map((p) => ({ ...p, P: p.P.map(f), n: g(p.n) }));
}

// ---- çizim: görünüm dönüşümü, kesme, ışık, sıralama, otomatik sığdırma
function render(groups, view, size = 200) {
  const vw = (v) => rotZ(rotX(rotY(v, view.yaw * D), view.pitch * D), (view.roll || 0) * D);
  const items = [];
  groups.forEach((g, gi) => {
    const list = [];
    for (const p of g) {
      let n = vw(p.n);
      if (p.two) { if (n[2] < 0) n = mul(n, -1); } else if (n[2] <= 0.02) continue;
      const P = p.P.map(vw);
      const z = P.reduce((s, q) => s + q[2], 0) / P.length;
      list.push({ P, z, n, c: p.c, b: p.b || 0 });
    }
    list.sort((a, b) => a.z - b.z);
    items.push(...list);
  });
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const it of items) for (const q of it.P) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  const m = 10, k = (size - 2 * m) / Math.max(x1 - x0, y1 - y0);
  const W = Math.round((x1 - x0) * k + 2 * m), H = Math.round((y1 - y0) * k + 2 * m);
  const facets = items.map((it) => ({
    p: it.P.map((q) => [r1(m + (q[0] - x0) * k), r1(m + (y1 - q[1]) * k)]),
    c: it.c,
    s: r2(shade(it.n, it.b)),
  })).filter((f) => { // dejenere (alanı ~0) yüzleri at
    let a = 0; for (let i = 0; i < f.p.length; i++) { const q = f.p[i], r = f.p[(i + 1) % f.p.length]; a += q[0] * r[1] - r[0] * q[1]; }
    return Math.abs(a) > 0.6;
  });
  return { facets, size: [W, H] };
}

export { r1, r2, D, add, sub, mul, dot, cross, norm, rotX, rotY, rotZ, rng, makeNoise, poly, lathe, arc, box, icoMesh, ball, extrude, panel, ribbon, xf, render, shade };
