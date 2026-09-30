// Uzay modellerinin "3B" sürümleri (uzay kategorisi, id: <ad>-3d).
// Gerçek bir ikosfer ağı üretir, döndürür, ortografik izdüşürür; her yüz kendi normaline göre ışıklanır
// (yüzeyler hâlâ düz üçgen = origami). Halkalar gerçek 3B eğimle arka/ön yarı olarak sıralanır.
//   node scripts/seed-uzay-3d.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'library', 'uzay');
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const D = Math.PI / 180;

// ---- vektör yardımcıları
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const rotY = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const rotX = (v, a) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

// ---- tohumlu rastgele + düzgün gürültü (birim vektör üzerinde)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function makeNoise(seed, freq = 2.2, n = 9) {
  const R = rng(seed);
  const waves = Array.from({ length: n }, () => ({ d: norm([R() - 0.5, R() - 0.5, R() - 0.5]), f: freq * (0.6 + R() * 0.9), p: R() * 6.28 }));
  return (v) => waves.reduce((s, w) => s + Math.sin(dot(v, w.d) * w.f * 3 + w.p), 0) / n; // ≈ -0.6..0.6
}

// ---- ikosfer
function icosphere(sub_) {
  const t = (1 + Math.sqrt(5)) / 2;
  let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let k = 0; k < sub_; k++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? a + '_' + b : b + '_' + a;
      if (!cache.has(key)) { V.push(norm(mul(add(V[a], V[b]), 0.5))); cache.set(key, V.length - 1); }
      return cache.get(key);
    };
    const NF = [];
    for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); NF.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    F = NF;
  }
  return { V, F };
}

const LIGHT = norm([-0.62, 0.52, 0.72]); // görüntü uzayı: x sağ, y yukarı, z izleyiciye
const shade = (n, bias = -0.06, k = 0.62) => r2(Math.max(-0.5, Math.min(0.42, dot(n, LIGHT) * k + bias)));

/**
 * Bir küre gövdesi üretir. opts:
 *  r, cx, cy, sub, yaw, tilt (kuzey kutbu izleyiciye eğimi), roll (düzlem içi dönüş), jitter (kaya pürüzü),
 *  color(unitVec, faceIdx) → palet anahtarı, decals[{c (birim vektör), rx, ry, rot, key, s, n}]
 */
function body(o) {
  const { r = 92, cx = 100, cy = 100, sub: sb = 2, yaw = 0, tilt = 16, roll = 0, jitter = 0, seed = 1, color, decals = [] } = o;
  const { V, F } = icosphere(sb);
  const R = rng(seed * 97 + 13);
  const dv = V.map(() => 1 + (R() - 0.5) * 2 * jitter);
  const view = (v) => rotZ(rotX(rotY(v, yaw * D), tilt * D), roll * D);
  const pts = V.map((v, i) => mul(v, dv[i]));
  const out = [];
  F.forEach(([a, b, c], fi) => {
    const pa = pts[a], pb = pts[b], pc = pts[c];
    const vn = view(norm(cross(sub(pb, pa), sub(pc, pa))));
    const fc = norm(add(add(V[a], V[b]), V[c]));
    const cv = view(fc);
    // dışa bakan normal (ağ dönüşü tutarsız olabilir)
    const nrm = dot(vn, cv) < 0 ? mul(vn, -1) : vn;
    if (nrm[2] <= 0.0) return; // görünmeyen yüz
    const P = [pa, pb, pc].map((p) => { const w = view(p); return [r1(cx + w[0] * r), r1(cy - w[1] * r)]; });
    const jit = (R() - 0.5) * 0.05;
    out.push({ p: P, c: color(fc, fi), s: r2(shade(nrm) + jit) });
  });
  // yüzey işaretleri (krater, leke, bulut)
  for (const d of decals) {
    const c = norm(d.c);
    const cvw = view(c);
    if (cvw[2] < 0.3) continue;
    const up = Math.abs(c[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    const e1 = norm(cross(up, c)), e2 = cross(c, e1);
    const n = d.n || 10;
    const ring = [];
    let ok = true;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * d.rx, y = Math.sin(a) * d.ry;
      const xr = x * Math.cos((d.rot || 0) * D) - y * Math.sin((d.rot || 0) * D);
      const yr = x * Math.sin((d.rot || 0) * D) + y * Math.cos((d.rot || 0) * D);
      const p = norm(add(c, add(mul(e1, xr), mul(e2, yr))));
      const w = view(p);
      if (w[2] < 0.12) ok = false;
      ring.push([r1(cx + w[0] * r * 0.992), r1(cy - w[1] * r * 0.992)]);
    }
    if (ok) out.push({ p: ring, c: d.key, s: r2(d.s !== undefined ? d.s + (dot(cvw, LIGHT) - 0.3) * 0.2 : shade(cvw)) });
  }
  return out;
}

/** Krater = açık kenar halkası + koyu taban (ışığın ters yönüne kaymış) */
function crater(c, rho, keys = { rim: 'b', floor: 'd' }) {
  const v = norm(c);
  return [
    { c: v, rx: rho, ry: rho, key: keys.rim, s: 0.14, n: 9, rot: 20 },
    { c: norm(add(v, [0.012 * rho * 20, -0.008 * rho * 20, 0])), rx: rho * 0.68, ry: rho * 0.68, key: keys.floor, s: -0.12, n: 9, rot: 40 },
  ];
}

/** Halka: 3B eğimli, bantlı; arka yarı gezegenden önce, ön yarı sonra. */
function ringSegments({ cx, cy, bands, tilt, roll, m = 28 }) {
  const back = [], front = [];
  const proj = (rad, th) => {
    const w = rotZ(rotX([rad * Math.cos(th), 0, rad * Math.sin(th)], tilt * D), roll * D);
    return { xy: [r1(cx + w[0]), r1(cy - w[1])], z: w[2] };
  };
  for (const b of bands) {
    for (let i = 0; i < m; i++) {
      const a0 = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2, am = (a0 + a1) / 2;
      const A = proj(b.r0, a0), B = proj(b.r1, a0), C = proj(b.r1, a1), Dd = proj(b.r0, a1);
      const zm = proj((b.r0 + b.r1) / 2, am).z;
      const s = r2(b.s + (i % 2 ? 0.03 : -0.03) + Math.cos(am - 2.4) * 0.05);
      (zm >= 0 ? front : back).push({ p: [A.xy, B.xy, C.xy, Dd.xy], c: b.key, s, hinge: 0 });
    }
  }
  return { back, front };
}

// ---- modeller
const assets = [];
const model = (id, name, tags, palette, roles, facets, extra = {}) =>
  assets.push({ id, name, tags: [...tags, 'gezegen', 'uzay', '3d', '3 boyutlu', 'hacimli'], size: [200, 200], palette, roles, facets, ...extra });

// Merkür
{
  const N = makeNoise(11, 2.6);
  const cr = [[-0.45, 0.35, 0.8, 0.13], [0.35, -0.2, 0.9, 0.16], [0.05, 0.5, 0.85, 0.09], [-0.3, -0.45, 0.8, 0.11], [0.55, 0.45, 0.7, 0.08], [-0.05, -0.05, 1, 0.07]];
  model('merkur-3d', 'Merkür 3B', ['kayalık', 'kraterli'],
    { a: '#a39e9a', b: '#b9b4af', c: '#d2cdc8', d: '#6f6a66', e: '#857f7b' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay' },
    body({ seed: 3, sub: 2, yaw: 30, tilt: 14, jitter: 0.035, color: (v) => { const n = N(v); return n > 0.22 ? 'c' : n > 0.02 ? 'b' : n > -0.2 ? 'a' : 'e'; }, decals: cr.flatMap(([x, y, z, rho]) => crater([x, y, z], rho)) }));
}
// Venüs
{
  const N = makeNoise(21, 1.6);
  model('venus-3d', 'Venüs 3B', ['sıcak', 'bulutlu', 'girdap'],
    { a: '#e6b96e', b: '#d39a4e', c: '#f6dfae', d: '#b9743a', e: '#eecb8a', h: '#ffe6b0' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay', h: 'vurgu' },
    [...halo(92, 'h'), ...body({ seed: 5, sub: 2, yaw: 0, tilt: 10, color: (v) => { const w = v[1] + N(v) * 0.5; const k = Math.floor((w + 1) * 4.4); return ['c', 'e', 'a', 'b', 'a', 'e', 'd', 'b', 'a', 'e'][((k % 10) + 10) % 10]; } })]);
}
// Dünya
{
  const N = makeNoise(31, 1.5), N2 = makeNoise(77, 2.4);
  const clouds = [[-0.4, 0.4, 0.8, 0.2, 0.06, 15], [0.4, 0.05, 0.9, 0.22, 0.05, -10], [-0.1, -0.45, 0.85, 0.24, 0.05, 5], [0.55, 0.55, 0.6, 0.15, 0.04, 30], [-0.6, -0.1, 0.7, 0.17, 0.045, -20]]
    .map(([x, y, z, rx, ry, rot]) => ({ c: [x, y, z], rx, ry, rot, key: 'k', s: 0.3, n: 9 }));
  model('dunya-3d', 'Dünya 3B', ['yaşam', 'mavi', 'kıtalar', 'ev'],
    { a: '#2b78c8', b: '#1f5db0', c: '#f3f8fc', g: '#57b56a', h: '#2f8d50', y: '#d9b870', k: '#ffffff', l: '#9ad6ff' },
    { a: 'ana', b: 'ikincil', c: 'acik', g: 'kara', h: 'koyu', y: 'col', k: 'bulut', l: 'atmosfer' },
    [...halo(92, 'l'), ...body({ seed: 7, sub: 2, yaw: -25, tilt: 18, roll: -8, color: (v) => {
      if (Math.abs(v[1]) > 0.88) return 'c';
      const n = N(v) + N2(v) * 0.25;
      if (n > 0.16) return N2(v) > 0.18 ? 'y' : n > 0.3 ? 'h' : 'g';
      return n < -0.14 ? 'b' : 'a';
    }, decals: clouds })],
    { variants: { gece: { name: 'Gece', palette: { a: '#15305e', b: '#0f2448', g: '#2c4a6b', h: '#1f3556', y: '#3a4a66', l: '#3a6ad0' } } } });
}
// Ay
{
  const N = makeNoise(41, 2.0);
  const cr = [[-0.35, 0.3, 0.88, 0.15], [0.3, 0.45, 0.83, 0.1], [0.4, -0.25, 0.88, 0.17], [-0.25, -0.4, 0.88, 0.12], [0.0, 0.1, 1, 0.08], [-0.6, -0.05, 0.78, 0.09], [0.62, 0.05, 0.78, 0.07], [0.1, -0.68, 0.74, 0.08]];
  model('ay-3d', 'Ay 3B', ['uydu', 'gece', 'kraterli'],
    { a: '#dcdcdc', b: '#f0f0ee', c: '#fbfbf8', d: '#9b9b9e', e: '#b9b9bb' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay' },
    body({ seed: 9, sub: 2, yaw: 10, tilt: 8, jitter: 0.03, color: (v) => { const n = N(v); return n < -0.22 ? 'd' : n < -0.05 ? 'e' : n > 0.25 ? 'b' : 'a'; }, decals: cr.flatMap(([x, y, z, rho]) => crater([x, y, z], rho, { rim: 'b', floor: 'e' })) }),
    { variants: { kanli: { name: 'Kanlı Ay', palette: { a: '#c0553f', b: '#d9705a', c: '#e88a70', d: '#7a2e24', e: '#9b4233' } } } });
}
// Mars
{
  const N = makeNoise(51, 1.7), N2 = makeNoise(9, 3);
  model('mars-3d', 'Mars 3B', ['kızıl', 'kayalık', 'çöl'],
    { a: '#c9573c', b: '#a8432c', c: '#f4ece6', d: '#7d2f20', e: '#dd7a55', h: '#ff9b73' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay', h: 'atmosfer' },
    [...halo(92, 'h', 0.08), ...body({ seed: 13, sub: 2, yaw: 60, tilt: 12, jitter: 0.02, color: (v) => {
      if (v[1] > 0.86 || v[1] < -0.92) return 'c';
      const n = N(v);
      if (n < -0.2) return 'd';
      if (n < -0.02) return 'b';
      return N2(v) > 0.15 ? 'e' : 'a';
    }, decals: [...crater([0.2, -0.2, 0.95], 0.1, { rim: 'e', floor: 'b' }), ...crater([-0.35, 0.3, 0.85], 0.12, { rim: 'e', floor: 'b' }), { c: [0.1, -0.05, 1], rx: 0.4, ry: 0.035, rot: -8, key: 'd', s: -0.1, n: 8 }] })]);
}
// Jüpiter
{
  const N = makeNoise(61, 1.2);
  const keys = ['c', 'e', 'b', 'a', 'f', 'b', 'c', 'e', 'a', 'f', 'b', 'c', 'e'];
  model('jupiter-3d', 'Jüpiter 3B', ['gaz devi', 'şeritli', 'fırtına', 'dev'],
    { a: '#e3c7a2', b: '#bf8a5d', c: '#f5e8d6', d: '#b5452f', e: '#d7a779', f: '#9c6a46', g: '#e9cfae' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'vurgu', e: 'detay', f: 'koyu', g: 'detay' },
    body({ seed: 17, sub: 2, yaw: 0, tilt: 6, color: (v) => { const w = v[1] + N(v) * 0.04; const k = Math.floor((w + 1) * 6.5); return keys[Math.max(0, Math.min(12, k))]; },
      decals: [{ c: [0.35, -0.3, 0.88], rx: 0.2, ry: 0.11, rot: 0, key: 'e', s: 0.12, n: 12 }, { c: [0.35, -0.3, 0.88], rx: 0.15, ry: 0.078, rot: 0, key: 'd', s: -0.02, n: 12 }, { c: [0.3, -0.3, 0.9], rx: 0.065, ry: 0.035, rot: 0, key: 'b', s: -0.06, n: 10 }] }));
}
// Satürn (halkalı, 3B eğimli)
{
  const N = makeNoise(71, 1.0);
  const keys = ['c', 'a', 'b', 'a', 'g', 'a', 'b', 'a', 'c'];
  const cx = 200, cy = 130, tilt = 62, roll = -16; // tilt: halka düzleminin izleyiciye açısı
  const bands = [
    { r0: 92, r1: 108, key: 'q', s: -0.02 }, { r0: 108, r1: 148, key: 'r', s: 0.06 },
    { r0: 154, r1: 176, key: 'r', s: 0.02 }, { r0: 176, r1: 186, key: 'q', s: -0.06 },
  ];
  const { back, front } = ringSegments({ cx, cy, bands, tilt: 90 - tilt + 0, roll, m: 30 });
  const sphere = body({ r: 66, cx, cy, seed: 19, sub: 2, yaw: 0, tilt: 90 - tilt, roll, color: (v) => { const w = v[1] + N(v) * 0.06; return keys[Math.max(0, Math.min(8, Math.floor((w + 1) * 4.5)))]; } });
  assets.push({
    id: 'saturn-3d', name: 'Satürn 3B', tags: ['halka', 'halkalı', 'gezegen', 'uzay', '3d', '3 boyutlu', 'hacimli', 'gaz devi'],
    size: [400, 260], center: [200, 130],
    palette: { a: '#ead6a6', b: '#cfae72', c: '#f7eccf', g: '#dcc08a', r: '#dfc99c', q: '#b59a6c' },
    roles: { a: 'ana', b: 'ikincil', c: 'acik', g: 'detay', r: 'halka', q: 'halka-koyu' },
    facets: [...back, ...sphere, ...front],
  });
}
// Uranüs (yan yatmış, ince dikey halka)
{
  const N = makeNoise(81, 1.0);
  const cx = 100, cy = 100;
  const bands = [{ r0: 78, r1: 82, key: 'r', s: 0.1 }, { r0: 84, r1: 88, key: 'r', s: 0.04 }, { r0: 90, r1: 93, key: 'r', s: 0.08 }];
  const tilt = 68, roll = -82;
  const { back, front } = ringSegments({ cx, cy, bands, tilt: 90 - tilt, roll, m: 30 });
  const sphere = body({ r: 62, cx, cy, seed: 23, sub: 2, yaw: 0, tilt: 90 - tilt, roll, color: (v) => { const w = v[1] + N(v) * 0.1; return w > 0.75 ? 'c' : w > 0.2 ? 'a' : w > -0.3 ? 'd' : w > -0.75 ? 'b' : 'a'; } });
  assets.push({
    id: 'uranus-3d', name: 'Uranüs 3B', tags: ['buz devi', 'yan yatmış', 'halka', 'gezegen', 'uzay', '3d', '3 boyutlu', 'hacimli'], size: [200, 200],
    palette: { a: '#9ee3e8', b: '#72c8d4', c: '#d3f6f7', d: '#85d4dc', r: '#dff7f8', h: '#c3f0f3' },
    roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'detay', r: 'halka', h: 'atmosfer' },
    facets: [...back, ...halo(62, 'h', 0.06, cx, cy, 7), ...sphere, ...front],
  });
}
// Neptün
{
  const N = makeNoise(91, 1.4);
  model('neptun-3d', 'Neptün 3B', ['buz devi', 'mavi', 'fırtınalı', 'rüzgar'],
    { a: '#3e6fe2', b: '#2c50b6', c: '#9bb8ff', d: '#1b3380', e: '#5b8aff', h: '#6f9dff' },
    { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', e: 'detay', h: 'atmosfer' },
    [...halo(92, 'h', 0.06), ...body({ seed: 29, sub: 2, yaw: 0, tilt: 8, color: (v) => { const w = v[1] + N(v) * 0.16; return w > 0.6 ? 'e' : w > 0.1 ? 'a' : w > -0.4 ? 'b' : 'a'; },
      decals: [{ c: [0.3, -0.25, 0.92], rx: 0.17, ry: 0.09, rot: -10, key: 'd', s: -0.1, n: 10 }, { c: [-0.3, 0.3, 0.9], rx: 0.3, ry: 0.025, rot: 8, key: 'c', s: 0.25, n: 8 }, { c: [0.15, -0.6, 0.78], rx: 0.22, ry: 0.022, rot: -6, key: 'c', s: 0.2, n: 8 }] })]);
}

/** Atmosfer parıltısı: gövdenin arkasında hafif büyük halka (yüz yelpazesi) */
function halo(r, key, s = 0.12, cx = 100, cy = 100, grow = 7, n = 28) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
    const p = (rr, a) => [r1(cx + rr * Math.cos(a)), r1(cy + rr * Math.sin(a))];
    out.push({ p: [[cx, cy], p(r + grow, a0), p(r + grow, a1)], c: key, s: r2(i % 2 ? s : s - 0.06) });
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
for (const a of assets) {
  fs.writeFileSync(path.join(OUT, a.id + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(a.id, a.facets.length, 'yüz');
}
