// Uzay kategorisi için 3B araç / nesne modelleri (id: <ad>-3d).
// Küçük bir poligon-ağı araç seti: lathe (devrim yüzeyi), kutu, elipsoid, ekstrüzyon, düz panel.
// Hepsi döndürülür, ortografik izdüşürülür, yüzleri normaline göre ışıklanır ve arkadan öne sıralanır
// (yüzeyler düz çokgen = origami). Boyut otomatik sığdırılır.
//   node scripts/seed-uzay-3d-nesneler.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'library', 'uzay');
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

const assets = [];
const add3d = (id, name, tags, palette, roles, groups, view, extra = {}, size = 200) => {
  const { facets, size: sz } = render(groups, view, size);
  assets.push({ id, name, tags: [...tags, 'uzay', '3d', '3 boyutlu', 'hacimli'], size: sz, palette, roles, facets, ...extra });
};

// =====================================================================================
// Roket
{
  const body = lathe([[0, -62], [16, -62], [30, -56], [30, 34], [30, 40], [26, 62], [16, 88], [8, 106], [0, 116]].slice(0, 9), 16,
    (j, i) => (j === 3 ? 'w' : j >= 4 ? 'r' : j === 0 ? 'd' : (i % 2 ? 'a' : 'b')));
  const stripe = lathe([[30.6, -20], [30.6, -6], [30.6, -6]], 16, () => 'r');
  const ring = lathe([[30.8, 6], [30.8, 14]], 16, () => 'r');
  const win = lathe([[0, 0], [11, 0], [11, 6], [8, 9], [0, 9]], 12, (j) => (j === 0 ? 'k' : j === 1 ? 'k' : 'g'));
  const windowP = xf(win, { rx: 90, t: [0, 40, 29.5] });
  const rim = xf(lathe([[0, 0], [14, 0], [14, 3], [0, 3]], 12, () => 'k'), { rx: 90, t: [0, 40, 28.5] });
  const fin = (ang) => xf(extrude([[0, 0], [34, -14], [34, -62], [0, -50]], 5, 'r'), { ry: ang, t: [0, 0, 0] });
  const fins = [0, 120, 240].flatMap((a) => xf(extrude([[28, -10], [58, -44], [58, -72], [28, -56]], 5, 'r', { side: 'd' }), { ry: a }));
  const nozzle = lathe([[0, -62], [14, -62], [22, -88], [0, -88]].reverse().reverse(), 14, (j) => 'd');
  const nozzleP = lathe([[0, -88], [22, -88], [14, -62], [0, -62]], 14, () => 'd');
  const flame = lathe([[0, -130], [6, -108], [18, -90], [0, -90]].reverse().reverse(), 10, (j, i) => (i % 2 ? 'f' : 'y'));
  const flame2 = lathe([[0, -110], [8, -96], [14, -90], [0, -90]], 10, (j, i) => (i % 2 ? 'y' : 'h'));
  const sideY = (rot) => rot;
  add3d('roket-3d', 'Roket 3B', ['roket', 'fırlatma', 'uçuş', 'araç', 'keşif'],
    { a: '#f4f5f8', b: '#dfe3ea', r: '#e0483b', w: '#c7cdd8', d: '#5a6070', k: '#2b3a55', g: '#8fd3f4', f: '#ff8a2b', y: '#ffd04a', h: '#fff2b0' },
    { a: 'ana', b: 'ikincil', r: 'vurgu', w: 'acik', d: 'koyu', k: 'detay', g: 'cam', f: 'alev', y: 'alev-acik', h: 'alev-cekirdek' },
    [[...flame, ...flame2], [...fins.slice(0, 0), ...nozzleP, ...body, ...stripe, ...ring, ...rim, ...windowP, ...fins]],
    { yaw: -35, pitch: 18, roll: -32 },
    { variants: { altin: { name: 'Altın roket', palette: { a: '#f5d98a', b: '#e0b95c', r: '#7a4ad8', w: '#fff0c2' } } } });
}

// Uydu
{
  const gold = box([0, 0, 0], [46, 46, 54], (f) => (f === '+z' || f === '-z' ? 'a' : 'b'));
  const band = box([0, 0, 0], [49, 12, 57], (f) => 'd');
  const arm = (sx) => box([sx * 40, 0, 0], [36, 4, 4], 'd');
  const pan = (sx) => xf(panel(72, 40, 4, 3, ['s', 't']), { rx: 90, t: [sx * 84, 0, 0] });
  const frame = (sx) => xf(box([0, 0, 0], [74, 42, 2], 'd').filter((p) => Math.abs(p.n[2]) < 0.5), { rx: 90, t: [sx * 84, 0, 0] });
  const dishP = xf(lathe([[0, 0], [9, 2], [18, 8], [24, 16], [21, 17], [15, 11], [7, 5], [0, 3]].reverse().reverse(), 16, (j) => 'c'), { rx: -60, t: [0, 38, 6] });
  const dishIn = xf(lathe([[0, 3], [7, 5], [15, 11], [21, 17]], 16, () => 'w'), { rx: -60, t: [0, 38.5, 6] });
  const dishOut = xf(lathe([[0, 0], [9, 2], [18, 8], [24, 16]].reverse().map((p) => p).reverse(), 16, () => 'c'), { rx: -60, t: [0, 38, 6] });
  const mast = xf(lathe([[0, 0], [2, 0], [2, 26], [0, 26]], 6, () => 'd'), { t: [0, 23, 0] });
  const ant = xf(lathe([[0, 0], [1.5, 0], [1.5, 26], [0, 30]], 6, () => 'd'), { t: [-16, 23, 14] });
  const lens = xf(lathe([[0, 0], [9, 0], [9, 8], [6, 10], [0, 10]], 12, (j) => (j >= 2 ? 'g' : 'd')), { rx: 90, t: [0, -8, 26] });
  add3d('uydu-3d', 'Uydu 3B', ['uydu', 'yapay uydu', 'haberleşme', 'yörünge', 'araç', 'güneş paneli'],
    { a: '#e6b84a', b: '#c99a33', c: '#d9dde6', w: '#9aa3b4', d: '#4a5162', s: '#3a64c8', t: '#2b4fa6', g: '#7fd0f0' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', s: 'panel', t: 'panel-koyu', g: 'cam', w: 'detay' },
    [[...arm(1), ...arm(-1), ...gold, ...band, ...pan(1), ...pan(-1), ...frame(1), ...frame(-1), ...mast, ...ant, ...dishOut, ...dishIn, ...lens]],
    { yaw: -32, pitch: 22, roll: -10 },
    { variants: { gece: { name: 'Gümüş uydu', palette: { a: '#d5dbe6', b: '#aeb6c6', s: '#1f3f8f', t: '#16306f' } } } }, 220);
}

// UFO
{
  const saucer = lathe([[0, -8], [34, -8], [52, -2], [84, 4], [86, 8], [80, 12], [48, 18], [0, 18]].reverse().reverse(), 20,
    (j, i) => (j === 2 || j === 3 ? (i % 2 ? 'a' : 'b') : j >= 4 ? 'c' : 'd'));
  const sau2 = lathe([[0, -14], [26, -14], [34, -8], [0, -8]], 20, () => 'd');
  const under = lathe([[0, -14], [26, -14], [34, -8]], 20, () => 'd');
  const dome = lathe([[0, 18], [40, 18], [44, 26], [40, 40], [28, 52], [14, 58], [0, 60]], 20, (j) => (j < 2 ? 'c' : 'g'));
  const lights = Array.from({ length: 10 }, (_, k) => {
    const a = (k / 10) * Math.PI * 2 + 0.15;
    return xf(ball([0, 0, 0], [6, 5, 6], 1, k % 2 ? 'y' : 'l'), { t: [Math.cos(a) * 76, 5, Math.sin(a) * 76] });
  }).flat();
  const beam = lathe([[0, -150], [70, -150], [30, -12], [0, -12]].reverse().reverse(), 20, () => 'u');
  add3d('ufo-3d', 'UFO 3B', ['ufo', 'uzaylı', 'uçan daire', 'gizem', 'araç', 'istila'],
    { a: '#b7c0d4', b: '#8d98b2', c: '#d7deed', d: '#56607a', g: '#6fe3c8', y: '#ffd95a', l: '#ff7ab8', u: '#6fae9c' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', g: 'cam', y: 'isik', l: 'isik-2', u: 'isin' },
    [[...lathe([[0, -110], [52, -110], [26, -12]], 20, (j, i) => 'u', { extra: { b: -0.25 } })], [...under, ...sau2, ...saucer, ...dome, ...lights]],
    { yaw: 0, pitch: 18, roll: -8 },
    { variants: { kirmizi: { name: 'Kızıl UFO', palette: { a: '#d97a6a', b: '#b25546', c: '#f0a898', g: '#ff9a7a', u: '#c98a78' } } } }, 220);
}

// Asteroit
{
  const N = makeNoise(5, 2.6);
  const cr = makeNoise(17, 4.2);
  add3d('asteroit-3d', 'Asteroit 3B', ['asteroit', 'kaya', 'göktaşı', 'kayalık', 'meteor', 'uzay kayası'],
    { a: '#9a8f86', b: '#857a72', c: '#b9aea4', d: '#5e554f', e: '#74695f' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay' },
    [ball([0, 0, 0], [90, 66, 74], 2, (v) => { const n = N(v) + cr(v) * 0.35; return n > 0.28 ? 'c' : n > 0.05 ? 'a' : n > -0.2 ? 'b' : n > -0.38 ? 'e' : 'd'; }, { jitter: 0.11, seed: 4 })],
    { yaw: 25, pitch: 15, roll: -12 },
    { variants: { buzlu: { name: 'Buzlu kuyruklu kaya', palette: { a: '#b7c9d6', b: '#94aabb', c: '#e2eef5', d: '#5d7284', e: '#78909f' } } } });
}

// Güneş 3B
{
  const N = makeNoise(77, 2.0), N2 = makeNoise(3, 4);
  const spikes = Array.from({ length: 18 }, (_, k) => {
    const a0 = (k / 18) * Math.PI * 2, a1 = ((k + 1) / 18) * Math.PI * 2, am = (a0 + a1) / 2, R = k % 2 ? 128 : 112;
    return poly([[Math.cos(a0) * 96, Math.sin(a0) * 96, -30], [Math.cos(am) * R, Math.sin(am) * R, -30], [Math.cos(a1) * 96, Math.sin(a1) * 96, -30]], [0, 0, 1], k % 2 ? 'o' : 'p', { two: true });
  });
  const halo = Array.from({ length: 28 }, (_, k) => {
    const a0 = (k / 28) * Math.PI * 2, a1 = ((k + 1) / 28) * Math.PI * 2;
    return poly([[0, 0, -28], [Math.cos(a0) * 102, Math.sin(a0) * 102, -28], [Math.cos(a1) * 102, Math.sin(a1) * 102, -28]], [0, 0, 1], k % 2 ? 'h' : 'p', { two: true, b: k % 2 ? 0.04 : -0.04 });
  });
  add3d('gunes-3d', 'Güneş 3B', ['güneş', 'yıldız', 'sıcak', 'ışık', 'gündüz', 'enerji', 'merkez'],
    { a: '#ffbf2e', b: '#ff9a1f', c: '#fff08a', d: '#e8621a', o: '#ffb347', p: '#ffd06b', h: '#ffe59a' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', o: 'isin', p: 'isin-acik', h: 'hale' },
    [[...spikes, ...halo], ball([0, 0, 0], [84, 84, 84], 2, (v) => { const n = N(v) + N2(v) * 0.25; return n > 0.3 ? 'c' : n > 0.0 ? 'a' : n > -0.25 ? 'b' : 'd'; }, { seed: 2 })],
    { yaw: 15, pitch: 10, roll: 0 },
    { variants: { kirmizi: { name: 'Kızıl dev', palette: { a: '#e8513a', b: '#c2382a', c: '#ff8a66', d: '#8f2418', o: '#ff7a5c', p: '#ff9e84', h: '#ffb8a2' } }, mavi: { name: 'Mavi yıldız', palette: { a: '#6fb4ff', b: '#4a8ae8', c: '#d6ecff', d: '#2f63b8', o: '#8cc6ff', p: '#b6dcff', h: '#d2eaff' } } } });
}

// Kuyruklu yıldız
{
  const N = makeNoise(9, 3);
  const curve = (off, len, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [60 + t * len, 40 - t * 70 * 0.7 + off * t * 12 + Math.sin(t * 3 + off) * 6 * t, off * 8 * t]; });
  const w = (W, n = 12) => Array.from({ length: n + 1 }, (_, i) => W * (1 - i / n) * (1 - i / n * 0.2) + 1);
  const t1 = ribbon(curve(0, 230), w(26), ['i', 'j'], { b: 0.05 });
  const t2 = ribbon(curve(1, 210), w(16), ['j', 'k'], { b: 0.08 });
  const t3 = ribbon(curve(-1, 190), w(14), ['k', 'i'], { b: -0.02 });
  const coma = Array.from({ length: 24 }, (_, k) => {
    const a0 = (k / 24) * Math.PI * 2, a1 = ((k + 1) / 24) * Math.PI * 2;
    return poly([[60, 40, -18], [60 + Math.cos(a0) * 48, 40 + Math.sin(a0) * 48, -18], [60 + Math.cos(a1) * 48, 40 + Math.sin(a1) * 48, -18]], [0, 0, 1], k % 2 ? 'j' : 'i', { two: true });
  });
  const nuc = ball([60, 40, 0], [30, 27, 28], 2, (v) => { const n = N(v); return n > 0.2 ? 'c' : n > -0.1 ? 'a' : 'd'; }, { jitter: 0.1, seed: 3 });
  add3d('kuyruklu-yildiz-3d', 'Kuyruklu Yıldız 3B', ['kuyruklu yıldız', 'komet', 'buz', 'kuyruk', 'gökcismi', 'halley'],
    { a: '#9aa3b0', c: '#dfe6ee', d: '#5d6573', i: '#bff1ff', j: '#8fd8f7', k: '#e9fbff' },
    { a: 'ana', c: 'acik', d: 'koyu', i: 'kuyruk', j: 'kuyruk-koyu', k: 'kuyruk-acik' },
    [[...t3, ...t2, ...t1, ...coma], nuc],
    { yaw: -20, pitch: 12, roll: 0 },
    { variants: { alev: { name: 'Ateş kuyruğu', palette: { i: '#ffd27a', j: '#ff9a3c', k: '#fff0c2' } } } }, 240);
}

// Uzay istasyonu
{
  const truss = box([0, 0, 0], [220, 10, 10], (f) => (f.endsWith('y') ? 'c' : 'd'));
  const bars = Array.from({ length: 10 }, (_, k) => box([-99 + k * 22, 0, 0], [3, 16, 16], 'd')).flat();
  const mod = (x, y, z, len, r, rx, rz, k1 = 'a', k2 = 'b') => xf(lathe([[0, -len / 2], [r, -len / 2], [r, len / 2], [0, len / 2]], 14, (j, i) => (j === 1 ? (i % 4 < 2 ? k1 : k2) : 'w')), { rx, rz, t: [x, y, z] });
  const modules = [
    mod(0, 0, 0, 120, 16, 0, 90), mod(0, 0, 38, 70, 13, 90, 0, 'a', 'b'), mod(-34, 0, 0, 40, 14, 0, 90, 'b', 'a'),
    mod(0, 34, 0, 60, 11, 0, 0, 'a', 'b'), mod(58, 0, 0, 30, 10, 0, 90, 'w', 'a'),
  ].flat();
  const cup = xf(ball([0, 0, 0], [13, 13, 13], 1, 'g'), { t: [0, 0, 74] });
  const sol = (x, y) => [
    ...xf(panel(56, 26, 5, 2, ['s', 't']), { rx: 0, ry: 0, t: [x, y, 0] }),
  ];
  const arrays = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    arrays.push(...xf(panel(26, 62, 3, 4, ['s', 't']), { t: [sx * 98, sy * 40, 0] }));
    arrays.push(...xf(box([0, 0, 0], [3, 64, 3], 'd'), { t: [sx * 98, sy * 40, 0] }));
  }
  const rad = xf(panel(40, 22, 4, 2, ['w', 'c']), { rx: 90, t: [0, -40, -30] });
  add3d('uzay-istasyonu-3d', 'Uzay İstasyonu 3B', ['uzay istasyonu', 'iss', 'yörünge', 'laboratuvar', 'araç', 'istasyon', 'güneş paneli'],
    { a: '#eef1f6', b: '#c9d0dc', c: '#aab3c2', d: '#5d6577', s: '#3a64c8', t: '#2b4fa6', w: '#8d98ab', g: '#e0b84a' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', s: 'panel', t: 'panel-koyu', w: 'detay', g: 'altin' },
    [[...arrays, ...rad, ...truss, ...bars, ...modules, ...cup]],
    { yaw: -38, pitch: 22, roll: -6 },
    {}, 260);
}

// Astronot
{
  // iki nokta arasında kapsül (yarıküre uçlu silindir)
  const capsule = (p0, p1, r, key, r1_ = r) => {
    const d = sub(p1, p0), L = Math.hypot(...d), u = norm(d);
    const prof = [...arc(0, 0, r, -90, 0, 4), ...arc(0, L, r1_, 0, 90, 4)];
    const polys = lathe(prof, 12, typeof key === 'function' ? key : () => key);
    // Y eksenini u yönüne çeviren Rodrigues dönüşü
    const ax = cross([0, 1, 0], u), s = Math.hypot(...ax), c = u[1];
    const rot = (v) => {
      if (s < 1e-6) return c > 0 ? v : [v[0], -v[1], v[2]];
      const k = mul(ax, 1 / s);
      return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
    };
    return polys.map((p) => ({ ...p, P: p.P.map((q) => add(rot(q), p0)), n: rot(p.n) }));
  };
  const ring = (y, r, h, key, t = [0, 0, 0]) => xf(lathe([[r, y], [r, y + h]], 14, () => key).concat(lathe([[0, y], [r, y]], 14, () => key), lathe([[r, y + h], [0, y + h]], 14, () => key)), { t });
  const sph = (c, r, key, sb = 1) => ball(c, [r, r, r], sb, key);

  // gövde
  const torso = ball([0, 26, 0], [31, 36, 23], 2, (v) => (v[1] < -0.55 ? 'b' : 'a'));
  const waist = ring(-12, 29, 8, 'c');
  const hips = ball([0, -14, 0], [27, 14, 20], 2, 'a');
  const chest = box([0, 34, 22], [26, 20, 5], 'c');
  const buttons = [
    ...box([-7, 38, 25.5], [6, 4, 2], 'r'), ...box([2, 38, 25.5], [6, 4, 2], 'g'), ...box([11, 38, 25.5], [4, 4, 2], 'y'),
    ...box([-6, 29, 25.5], [10, 5, 2], 'd'), ...box([8, 29, 25.5], [6, 5, 2], 'd'),
  ];
  const hoses = [];
  const pack = [...box([0, 34, -30], [48, 58, 26], (f) => (f === '+z' || f === '-z' ? 'b' : 'c')), ...box([0, 34, -44], [40, 48, 4], 'd'), ...box([-14, 34, -47], [8, 34, 3], 'r'), ...box([0, 34, -47], [8, 34, 3], 'c'), ...box([14, 34, -47], [8, 34, 3], 'r')];
  // kafa
  const neck = ring(54, 27, 7, 'c');
  const helmet = ball([0, 82, 0], [37, 35, 35], 3, (v) => {
    if (v[2] < 0.05) return 'a';
    const e = Math.pow(v[0] / 0.86, 2) + Math.pow((v[1] - 0.02) / 0.66, 2);
    if (e < 0.78) return v[0] < -0.1 && v[1] > 0.12 && e > 0.3 ? 'w' : 'v';
    return e < 1.0 ? 'd' : 'a';
  });
  const visorAll = ball([0, 81, 15], [29, 23, 25], 2, (v) => (v[2] > 0.1 ? (v[1] > 0.45 && v[0] < 0.1 ? 'w' : 'v') : 'a'));
  const visor = [];
  const ears = [-1, 1].flatMap((sx) => xf(lathe([[0, -3], [8, -3], [8, 3], [0, 3]], 10, () => 'c').concat(lathe([[0, 3], [8, 3]], 10, () => 'c')), { rz: 90, t: [sx * 37, 80, 0] }));
  const ant = [capsule([10, 113, -6], [16, 134, -8], 1.6, 'd'), sph([16, 136, -8], 4, 'r')].flat();
  const torsoGroup = [...pack, ...hoses, ...hips, ...torso, ...waist, ...chest, ...buttons, ...neck];
  // kollar: sol (izleyicinin solu) havada el sallıyor, sağ aşağıda
  const armL = [sph([-36, 48, 0], 13, 'a'), capsule([-36, 48, 0], [-60, 72, 6], 11, (j, i) => 'a'), sph([-60, 72, 6], 10.5, 'b'), capsule([-60, 72, 6], [-66, 98, 14], 9.5, 'a'),
    capsule([-66, 98, 14], [-68, 104, 15], 12, 'r'), sph([-68, 112, 15], 12, 'c')].flat();
  const armR = [sph([36, 48, 0], 13, 'a'), capsule([36, 48, 0], [52, 22, 10], 11, 'a'), sph([52, 22, 10], 10.5, 'b'), capsule([52, 22, 10], [58, 0, 26], 9.5, 'a'),
    capsule([58, 0, 26], [59, -4, 28], 12, 'r'), sph([59, -10, 29], 12, 'c')].flat();
  const badge = [...xf(box([0, 0, 0], [9, 6, 1.6], 'r'), { rz: 35, t: [-30, 58, 17] }), ...xf(box([0, 0, 0], [9, 1.6, 2], 'w'), { rz: 35, t: [-30, 58, 17.4] })];
  // bacaklar: biri diz bükük, süzülme pozu
  const legL = [sph([-14, -18, 2], 14, 'a'), capsule([-14, -18, 2], [-18, -48, 8], 13, 'a'), sph([-18, -48, 8], 12, 'b'), capsule([-18, -48, 8], [-26, -76, -2], 12, 'a'), ring(-78, 13.5, 6, 'r', [-26, 0, -2])].flat();
  const legR = [sph([14, -18, 2], 14, 'a'), capsule([14, -18, 2], [20, -46, 14], 13, 'a'), sph([20, -46, 14], 12, 'b'), capsule([20, -46, 14], [22, -76, 22], 12, 'a'), ring(-78, 13.5, 6, 'r', [22, 0, 22])].flat();
  const boot = (x, z, yaw) => [...xf(ball([0, 0, 0], [15, 11, 24], 2, 'c'), { ry: yaw, t: [x, -90, z + 6] }), ...xf(ball([0, 0, 0], [15.5, 5, 25], 1, 'd'), { ry: yaw, t: [x, -98, z + 6] })];
  const feet = [...boot(-27, -2, 10), ...boot(22, 22, -8)];
  add3d('astronot-3d', 'Astronot 3B', ['astronot', 'kozmonot', 'uzay giysisi', 'insan', 'karakter', 'keşif', 'uzay yürüyüşü', 'el sallayan'],
    { a: '#f3f5f9', b: '#cfd5e1', c: '#9ba5b8', d: '#4a5367', v: '#d99a2b', w: '#ffe9a8', r: '#e0483b', g: '#5fd18a', y: '#ffd04a' },
    { a: 'ana', b: 'ikincil', c: 'detay', d: 'koyu', v: 'cam', w: 'yansima', r: 'vurgu', g: 'isik', y: 'isik-2' },
    [[...torsoGroup, ...legL, ...legR, ...feet, ...armR, ...armL, ...badge, ...ears, ...helmet, ...ant, ...visor]],
    { yaw: -24, pitch: 8, roll: 7 },
    { variants: { turuncu: { name: 'Turuncu giysi', palette: { a: '#f59a48', b: '#d27328', c: '#ffd9b0', r: '#ffffff' } }, mavi: { name: 'Mavi giysi', palette: { a: '#6fa0e8', b: '#4a7cc8', c: '#b9d4ff', v: '#ffd66b' } } } }, 240);
}

// Mars gezgini
{
  const wheel = (x, y, z) => xf([
    ...lathe([[0, -9], [14, -9], [16, -7], [16, 7], [14, 9], [0, 9]], 12, (j, i) => (j === 2 ? (i % 2 ? 'd' : 'e') : j === 1 || j === 3 ? 'd' : 'c')),
  ], { rz: 90, t: [x, y, z] });
  const wheels = [[-46, -4, 40], [-46, -4, 0], [-46, -4, -40], [46, -4, 40], [46, -4, 0], [46, -4, -40]].flatMap(([x, y, z]) => wheel(x, y, z));
  const arm = (sx, z) => box([sx * 34, 12, z], [4, 4, 34], 'd');
  const arms = [[-1, 20], [1, 20], [-1, -20], [1, -20]].flatMap(([sx, z]) => box([sx * 34, 8, z], [28, 4, 4], 'd'));
  const hull = box([0, 26, 0], [62, 24, 92], (f) => (f === '+y' ? 'a' : f === '+z' ? 'c' : 'b'));
  const top = box([0, 41, -10], [50, 6, 62], (f) => 'w');
  const deck = panel(56, 50, 3, 3, ['s', 't']);
  const deckP = xf(deck, { rx: 90, t: [0, 45, -14] });
  const mast = box([0, 60, 30], [4, 40, 4], 'd');
  const head = box([0, 84, 30], [22, 12, 12], 'a');
  const lensA = ball([-6, 84, 37], [4, 4, 3], 1, 'k'), lensB = ball([6, 84, 37], [4, 4, 3], 1, 'k');
  const dish = xf(lathe([[0, 0], [9, 2], [14, 8], [12, 9], [6, 4], [0, 2]], 12, (j) => (j < 3 ? 'c' : 'w')), { rx: -40, t: [-18, 50, -42] });
  const armBase = box([-20, 26, 52], [6, 6, 22], 'd'), armEnd = box([-20, 24, 66], [8, 8, 10], 'r');
  add3d('mars-gezgini-3d', 'Mars Gezgini 3B', ['gezgin', 'rover', 'mars aracı', 'keşif aracı', 'robot', 'araç', 'ay aracı', 'mars'],
    { a: '#dcd6cc', b: '#b9b2a6', c: '#f1ede5', d: '#4a4f5c', e: '#2e323d', w: '#c9c2b6', s: '#3a64c8', t: '#2b4fa6', k: '#22283a', r: '#e0783a' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'lastik', w: 'detay', s: 'panel', t: 'panel-koyu', k: 'lens', r: 'vurgu' },
    [[...arms, ...wheels.filter((p) => p.P[0][0] < 0 || true), ...hull, ...top, ...deckP, ...mast, ...head, ...lensA, ...lensB, ...dish, ...armBase, ...armEnd]],
    { yaw: 38, pitch: 22, roll: 0 },
    { variants: { kum: { name: 'Kum fırtınası', palette: { a: '#d8b088', b: '#b48e68', c: '#efd2ae', w: '#c69c72' } } } }, 220);
}

// Plüton
{
  const N = makeNoise(13, 2.2), N2 = makeNoise(29, 3.4);
  const heart = (v) => { const x = (v[0] - 0.05) * 2.6, y = (v[1] + 0.05) * 2.6 + 0.25; if (v[2] < 0.2) return false; return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y < 0; };
  add3d('pluton-3d', 'Plüton 3B', ['cüce gezegen', 'plüton', 'buzlu', 'kalp', 'uzak', 'kuiper'],
    { a: '#c9a98a', b: '#a98568', c: '#f3e8da', d: '#7a5b47', e: '#e2cdb6', h: '#f8efe4' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay', h: 'kalp' },
    [ball([0, 0, 0], [84, 84, 84], 2, (v) => { if (heart(v)) return v[0] > 0.05 ? 'h' : 'c'; const n = N(v) + N2(v) * 0.3; return n > 0.3 ? 'e' : n > 0.0 ? 'a' : n > -0.25 ? 'b' : 'd'; }, { seed: 6 })],
    { yaw: 0, pitch: 6, roll: -10 },
    { variants: { mavi: { name: 'Buz çağı', palette: { a: '#a7b8cf', b: '#8499b5', c: '#eef4fb', d: '#56667f', e: '#d3deec', h: '#ffffff' } } } });
}

// Kara delik
{
  const tilt = 58, roll = -14, cx = 0, cy = 0;
  const ringQ = (r0, r1, key, s, m = 40) => {
    const back = [], front = [];
    const P = (rad, th) => rotZ(rotX([rad * Math.cos(th), 0, rad * Math.sin(th)], (90 - tilt) * D), roll * D);
    for (let i = 0; i < m; i++) {
      const a0 = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2, am = (a0 + a1) / 2;
      const q = poly([P(r0, a0), P(r1, a0), P(r1, a1), P(r0, a1)], [0, 1, 0], typeof key === 'function' ? key(i) : key, { two: true, b: s + (i % 2 ? 0.03 : -0.03) });
      (P((r0 + r1) / 2, am)[2] >= 0 ? front : back).push(q);
    }
    return { back, front };
  };
  const b1 = ringQ(62, 92, (i) => (i % 3 === 0 ? 'y' : 'o'), 0.1), b2 = ringQ(92, 128, (i) => (i % 2 ? 'r' : 'o'), 0.0), b3 = ringQ(128, 164, 'p', -0.06);
  const core = ball([0, 0, 0], [54, 54, 54], 2, (v, fi) => (fi % 7 === 0 ? 'k' : 'n'), { seed: 1 });
  // kütle çekimi halkası (yıldız ışığı kırılması): ince dikey halka, gövdenin üstünde
  const lens = Array.from({ length: 36 }, (_, i) => {
    const a0 = (i / 36) * Math.PI * 2, a1 = ((i + 1) / 36) * Math.PI * 2;
    const p = (rad, a) => [Math.cos(a) * rad, Math.sin(a) * rad, 60];
    return poly([p(56, a0), p(64, a0), p(64, a1), p(56, a1)], [0, 0, 1], 'y', { two: true, b: 0.2 });
  });
  add3d('kara-delik-3d', 'Kara Delik 3B', ['kara delik', 'olay ufku', 'akresyon diski', 'yerçekimi', 'gizem', 'galaksi', 'karanlık'],
    { k: '#05060c', n: '#0b0d1a', y: '#fff0b0', o: '#ff9a3c', r: '#e0483b', p: '#8a2be2' },
    { k: 'ana', n: 'koyu', y: 'isik', o: 'disk', r: 'disk-koyu', p: 'disk-mor' },
    [[...b3.back, ...b2.back, ...b1.back], core, [...lens], [...b1.front, ...b2.front, ...b3.front]],
    { yaw: 0, pitch: 0, roll: 0 },
    { variants: { mavi: { name: 'Mavi disk', palette: { y: '#e6f4ff', o: '#4ea6ff', r: '#2d6fd6', p: '#7a5cff' } } } }, 240);
}

fs.mkdirSync(OUT, { recursive: true });
for (const a of assets) {
  fs.writeFileSync(path.join(OUT, a.id + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(a.id, a.facets.length, 'yüz', a.size.join('x'));
}
