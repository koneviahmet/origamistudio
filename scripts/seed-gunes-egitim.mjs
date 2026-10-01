// Uzay kategorisi için 3B araç / nesne modelleri (id: <ad>-3d).
// Küçük bir poligon-ağı araç seti: lathe (devrim yüzeyi), kutu, elipsoid, ekstrüzyon, düz panel.
// Hepsi döndürülür, ortografik izdüşürülür, yüzleri normaline göre ışıklanır ve arkadan öne sıralanır
// (yüzeyler düz çokgen = origami). Boyut otomatik sığdırılır.
//   node scripts/seed-gunes-egitim.mjs
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
// Lekeli Güneş: üç görünüm (leke konumu kayar → Güneş kendi ekseninde döner)
const SPOTS = [
  { d: norm([0.25, 0.3, 0.92]), r: 0.2 }, { d: norm([0.52, -0.22, 0.82]), r: 0.14 }, { d: norm([-0.3, -0.35, 0.88]), r: 0.11 },
  { d: norm([0.05, -0.55, 0.83]), r: 0.09 }, { d: norm([-0.55, 0.3, 0.78]), r: 0.12 },
];
function lekeliGunes(id, name, yawDeg, extra = {}) {
  const N = makeNoise(41, 3.0), N2 = makeNoise(8, 6);
  const key = (v) => {
    for (const s of SPOTS) { const dd = Math.hypot(v[0] - s.d[0], v[1] - s.d[1], v[2] - s.d[2]); if (dd < s.r) return 'k'; if (dd < s.r * 1.75) return 'u'; }
    const n = N(v) + N2(v) * 0.3; return n > 0.3 ? 'c' : n > -0.02 ? 'a' : n > -0.3 ? 'b' : 'd';
  };
  const halo = Array.from({ length: 36 }, (_, k) => {
    const a0 = (k / 36) * Math.PI * 2, a1 = ((k + 1) / 36) * Math.PI * 2;
    return poly([[0, 0, -60], [Math.cos(a0) * 100, Math.sin(a0) * 100, -60], [Math.cos(a1) * 100, Math.sin(a1) * 100, -60]], [0, 0, 1], k % 2 ? 'h' : 'p', { two: true, b: k % 2 ? 0.04 : -0.04 });
  });
  add3d(id, name, ['güneş', 'güneş lekesi', 'leke', 'yüzey', 'yakın plan', 'karanlık bölge'],
    { a: '#ffbf2e', b: '#ff9a1f', c: '#fff08a', d: '#e8621a', k: '#3d1b0c', u: '#8a3b12', p: '#ffd06b', h: '#ffe59a' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', k: 'leke', u: 'leke-kenar', p: 'isin-acik', h: 'hale' },
    [halo, xf(ball([0, 0, 0], [84, 84, 84], 3, (v) => key(v), { seed: 2 }), { ry: yawDeg })],
    { yaw: 0, pitch: 8, roll: 0 }, extra, 240);
}
lekeliGunes('gunes-lekeli-3d', 'Lekeli Güneş 3B', 0);
lekeliGunes('gunes-lekeli-sol-3d', 'Lekeli Güneş 3B (sol)', -48);
lekeliGunes('gunes-lekeli-sag-3d', 'Lekeli Güneş 3B (sağ)', 48);

// =====================================================================================
// Galileo teleskobu (tahta ayaklı, deri/altın halkalı uzun tüp)
{
  const tube = lathe([[0, -110], [7, -110], [7, -98], [9, -94], [9, -30], [12, -28], [12, 50], [15, 52], [15, 118], [18, 122], [18, 134], [0, 134]], 14,
    (j, i) => (j <= 2 ? 'e' : j <= 4 ? 'a' : j <= 6 ? 'b' : j <= 8 ? 'a' : 'b'));
  const rings = [-98, -29, 51, 120, 134].flatMap((y, n) => lathe([[[8, 9.8, 12.8, 16, 19][n], y - 3], [[8, 9.8, 12.8, 16, 19][n], y + 3]], 14, () => 'g'));
  const lensC = lathe([[0, 134.6], [15, 134.6]], 14, () => 'l');
  const legs = [0, 120, 240].flatMap((a) => xf(lathe([[0, -120], [4, -120], [6, 0], [0, 0]], 6, () => 'w'), { rx: 24, ry: a, t: [0, -30, 0] }));
  const base = lathe([[0, -32], [22, -32], [22, -18], [0, -18]], 10, () => 'w');
  const mount = lathe([[0, -20], [8, -20], [8, -2], [0, -2]], 8, () => 'd');
  const tubeR = xf([...tube, ...rings, ...lensC], { rz: -52 });
  add3d('teleskop-3d', 'Galileo Teleskobu 3B', ['teleskop', 'dürbün', 'galileo', 'gözlem', 'gökyüzü', 'bilim', 'mercek', 'telescope'],
    { a: '#b07a45', b: '#8e5b2f', e: '#6b4220', g: '#e8b84a', l: '#8fd3f4', w: '#6b4a2a', d: '#4a331d' },
    { a: 'ana', b: 'ikincil', e: 'koyu', g: 'altin', l: 'cam', w: 'ahsap', d: 'detay' },
    [[...legs, ...base, ...mount], tubeR],
    { yaw: -18, pitch: 10, roll: 0 }, { variants: { gumus: { name: 'Modern teleskop', palette: { a: '#dfe5ee', b: '#b4bccb', e: '#7d869a', g: '#5b6cf0' } } } }, 240);
}

// =====================================================================================
// Güneş gözlem gözlüğü (karton çerçeve + koyu filtre camları)
{
  const O = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);
  const frameOut = [[-130, 46], [-118, 56], [118, 56], [130, 46], [130, -34], [108, -56], [20, -56], [0, -44], [-20, -56], [-108, -56], [-130, -34]];
  const frame = extrude(frameOut, 8, 'a', { side: 'd' });
  const lensL = xf(extrude(O(0, 0, 50, 38, 14), 4, 'k'), { t: [-64, 0, 6] });
  const lensR = xf(extrude(O(0, 0, 50, 38, 14), 4, 'k'), { t: [64, 0, 6] });
  const ring = (sx) => Array.from({ length: 14 }, (_, i) => {
    const a0 = (i / 14) * Math.PI * 2, a1 = ((i + 1) / 14) * Math.PI * 2;
    return poly([[sx * 64 + Math.cos(a0) * 54, Math.sin(a0) * 42, 9], [sx * 64 + Math.cos(a1) * 54, Math.sin(a1) * 42, 9], [sx * 64 + Math.cos(a1) * 48, Math.sin(a1) * 36, 9], [sx * 64 + Math.cos(a0) * 48, Math.sin(a0) * 36, 9]], [0, 0, 1], 'y', { two: true });
  });
  const glint = (sx) => poly([[sx * 64 - 30, 18, 9.5], [sx * 64 - 14, 26, 9.5], [sx * 64 - 26, 10, 9.5]], [0, 0, 1], 'g', { two: true });
  add3d('guvenlik-gozlugu-3d', 'Güneş Gözlem Gözlüğü 3B', ['güneş gözlüğü', 'gözlem gözlüğü', 'filtre', 'güvenlik', 'koruma', 'göz', 'tutulma', 'eclipse glasses'],
    { a: '#f2d9a6', d: '#b38a4c', k: '#14121c', y: '#ffc53d', g: '#7a7fb5' },
    { a: 'ana', d: 'koyu', k: 'cam-filtre', y: 'vurgu', g: 'parlama' },
    [[...frame, ...lensL, ...lensR, ...ring(-1), ...ring(1), glint(-1), glint(1)]],
    { yaw: 0, pitch: 4, roll: -5 }, { variants: { mavi: { name: 'Mavi gözlük', palette: { a: '#9cc7f2', d: '#4f86c4', y: '#ffffff' } } } }, 220);
}

// =====================================================================================
// Güneş kesiti (bir sekizlik dilim çıkarılmış; katmanlar iç içe — katman adı verilmez)
{
  const R = 88, seg = 16;
  const prof = arc(0, 0, R, -90, 90, 10);
  const sph = lathe(prof.map(([r, y]) => [Math.max(r, 0), y]), seg, (j, i) => (i % 2 ? 'a' : 'b'));
  const cen = (p) => p.P.reduce((s, q) => add(s, q), [0, 0, 0]).map((v) => v / p.P.length);
  const kept = sph.filter((p) => { const c = cen(p); return !(c[0] > 0.01 && c[1] > 0.01 && c[2] > 0.01); });
  const RINGS = [[0, 26, 'k'], [26, 52, 'y'], [52, 76, 'o'], [76, R - 6, 'r'], [R - 6, R, 'a']];
  const quarter = (ux, vx, n) => RINGS.flatMap(([r0, r1, k]) => Array.from({ length: 6 }, (_, s) => {
    const a0 = (s / 6) * Math.PI / 2, a1 = ((s + 1) / 6) * Math.PI / 2;
    const pt = (r, a) => add(mul(ux, r * Math.cos(a)), mul(vx, r * Math.sin(a)));
    const pts = r0 === 0 ? [pt(0, a0), pt(r1, a0), pt(r1, a1)] : [pt(r0, a0), pt(r1, a0), pt(r1, a1), pt(r0, a1)];
    return poly(pts, n, k, { b: s % 2 ? 0.03 : -0.02 });
  }));
  const walls = [...quarter([1, 0, 0], [0, 1, 0], [0, 0, 1]), ...quarter([0, 0, 1], [0, 1, 0], [1, 0, 0]), ...quarter([1, 0, 0], [0, 0, 1], [0, 1, 0])];
  add3d('gunes-kesit-3d', 'Güneş Kesiti 3B', ['güneş', 'kesit', 'katman', 'iç yapı', 'çekirdek', 'katmanlar', 'dilim'],
    { a: '#ffbf2e', b: '#ff9a1f', k: '#fff6c2', y: '#ffe066', o: '#ffb02e', r: '#f57a1f' },
    { a: 'ana', b: 'ikincil', k: 'cekirdek', y: 'acik', o: 'orta', r: 'dis' },
    [kept, walls],
    { yaw: -28, pitch: 22, roll: 0 }, {}, 230);
}

// =====================================================================================
// Soru rozeti ("?" metin katmanı olarak üstüne konur)
{
  const n = 16;
  const burst = Array.from({ length: n }, (_, k) => {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
    return poly([[0, 0, 0], [Math.cos(a0) * 70, Math.sin(a0) * 70, 0], [Math.cos(am) * 100, Math.sin(am) * 100, 0], [Math.cos(a1) * 70, Math.sin(a1) * 70, 0]], [0, 0, 1], k % 2 ? 'a' : 'b', { two: true, b: k % 2 ? 0.05 : -0.05 });
  });
  const disk = Array.from({ length: 24 }, (_, k) => {
    const a0 = (k / 24) * Math.PI * 2, a1 = ((k + 1) / 24) * Math.PI * 2;
    return poly([[0, 0, 4], [Math.cos(a0) * 66, Math.sin(a0) * 66, 4], [Math.cos(a1) * 66, Math.sin(a1) * 66, 4]], [0, 0, 1], k % 2 ? 'c' : 'd', { two: true, b: k % 2 ? 0.03 : -0.03 });
  });
  add3d('soru-rozeti', 'Soru Rozeti', ['soru', 'soru işareti', 'merak', 'rozet', 'düşün', 'peki', 'question'],
    { a: '#ff6fa8', b: '#ff4f8b', c: '#7a4cff', d: '#6a3de8' },
    { a: 'ana', b: 'ikincil', c: 'vurgu', d: 'koyu' },
    [[...burst, ...disk]], { yaw: 0, pitch: 0, roll: 0 }, { variants: { sari: { name: 'Sarı rozet', palette: { a: '#ffd23f', b: '#ffb400', c: '#1f3a8a', d: '#16306f' } } } }, 200);
}

// Yasak işareti (kırmızı halka + çapraz çizgi)
{
  const Nn = 28;
  const ringQ = Array.from({ length: Nn }, (_, k) => {
    const a0 = (k / Nn) * Math.PI * 2, a1 = ((k + 1) / Nn) * Math.PI * 2;
    return poly([[Math.cos(a0) * 100, Math.sin(a0) * 100, 0], [Math.cos(a1) * 100, Math.sin(a1) * 100, 0], [Math.cos(a1) * 78, Math.sin(a1) * 78, 0], [Math.cos(a0) * 78, Math.sin(a0) * 78, 0]], [0, 0, 1], k % 2 ? 'a' : 'b', { two: true, b: k % 2 ? 0.04 : -0.04 });
  });
  const c = Math.SQRT1_2;
  const bar = poly([[-70 * c - 11 * c, 70 * c - 11 * c, 2], [-70 * c + 11 * c, 70 * c + 11 * c, 2], [70 * c + 11 * c, -70 * c + 11 * c, 2], [70 * c - 11 * c, -70 * c - 11 * c, 2]], [0, 0, 1], 'a', { two: true });
  add3d('yasak-isareti', 'Yasak İşareti', ['yasak', 'dur', 'uyarı', 'tehlike', 'dikkat', 'yapma', 'güvenlik', 'no'],
    { a: '#e5283c', b: '#c31c30' }, { a: 'ana', b: 'ikincil' }, [[...ringQ, bar]], { yaw: 0, pitch: 0, roll: 0 }, {}, 200);
}


fs.mkdirSync(OUT, { recursive: true });
for (const a of assets) {
  fs.writeFileSync(path.join(OUT, a.id + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(a.id, a.facets.length, 'yüz', a.size.join('x'));
}
