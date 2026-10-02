// Uzay yarışı 3B modelleri: Sputnik-1 ve Vostok roketi (referans görsellerden). Yardımcılar seed-uzay-3d-nesneler.mjs ile aynı.
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
// Sputnik-1: parlak çelik küre + eşlik halkası + 4 geriye yatık anten
{
  const Nz = makeNoise(11, 3.2);
  const sphere = ball([0, 0, 0], [50, 50, 50], 2, (v) => { const n = Nz(v); return n > 0.45 ? 'c' : n < -0.4 ? 'b' : 'a'; }, { seed: 3 });
  const seam = lathe([[47, 15], [49.5, 15], [49.5, 23], [47, 23]], 24, (j, i) => (j === 1 ? (i % 2 ? 'w' : 'd') : 'd'));
  const hatch = box([0, -4, 49], [16, 7, 4], (f) => (f === '+z' ? 'd' : 'w'));
  const anten = (phi, tilt, L) => {
    const rod = xf(lathe([[0, 0], [1.7, 0], [1.7, L], [0, L]], 6, () => 'w'), { rz: tilt });
    const collar = xf(lathe([[0, 0], [4.4, 0], [4.4, 14], [3, 16], [0, 16]], 8, () => 'd'), { rz: tilt });
    const root = xf([...collar, ...rod], { t: [0, 0, 0] });
    const base = rotY(rotZ([0, 0, 0], 0), 0);
    const pos = rotY([47, 19, 0], phi * D);
    return xf(root, { ry: phi, t: pos });
  };
  // anten ekseni +Y (geriye); modelin tamamı sonra -x yönüne yatırılır
  const ants = [...anten(35, -52, 260), ...anten(125, -52, 215), ...anten(215, -52, 260), ...anten(305, -52, 215)];
  const hepsi = [...sphere, ...seam, ...hatch, ...ants];
  add3d('sputnik-3d', 'Sputnik 3B', ['sputnik', 'sputnik 1', 'ilk yapay uydu', 'uydu', 'sovyet', 'uzay yarışı', '1957', 'küre', 'anten', 'araç'],
    { a: '#c4cdd6', b: '#98a5b2', c: '#eef3f7', d: '#566170', w: '#7f8c9a' },
    { a: 'ana', b: 'ikincil', c: 'parlak', d: 'koyu', w: 'detay' },
    [[...ants.filter((p) => p.P[0][2] < 0)], [...sphere, ...seam, ...hatch], [...ants.filter((p) => p.P[0][2] >= 0)]].map((g) => xf(g, { rz: 72 })),
    { yaw: -20, pitch: 18, roll: 0 },
    { variants: { altin: { name: 'Altın Sputnik', palette: { a: '#e6c46a', b: '#c29a3a', c: '#fff1c0', d: '#6b5320', w: '#a88a3a' } } } }, 240);
}

// Vostok roketi (Vostok-K): orta gövde + 4 konik yan hız artırıcı + damla kafa koruması + kafes + alev
{
  const core = lathe([[0, -78], [22, -78], [24, -70], [24, 150], [22, 160], [22, 214]], 18, (j, i) => (j === 0 ? 'k' : j === 3 ? 'w' : i % 3 === 0 ? 'b' : 'a'));
  const truss = Array.from({ length: 12 }, (_, i) => xf(box([0, 0, 0], [3, 24, 3], 'k'), { rz: i % 2 ? 14 : -14, ry: (i / 12) * 360, t: [0, 226, 0] })).flat();
  const trussRings = [lathe([[21, 214], [22.5, 214], [22.5, 218], [21, 218]], 18, () => 'k'), lathe([[21, 234], [22.5, 234], [22.5, 238], [21, 238]], 18, () => 'k')].flat();
  const shroud = lathe([[0, 238], [21, 238], [22, 258], [20, 290], [15, 322], [8, 346], [0, 358]], 18, (j, i) => (j === 0 ? 'w' : j === 1 ? 'c' : i % 3 === 0 ? 'b' : 'a'));
  const band = lathe([[22.5, 262], [22.5, 270]], 18, () => 'c');
  const hole = xf(lathe([[0, 0], [7, 0], [7, 3], [0, 3]], 12, () => 'g'), { rx: 90, t: [0, 308, 17.6] });
  const core2 = lathe([[0, 160], [20, 160], [22, 160]], 18, () => 'a');
  const coreNoz = [0, 90, 180, 270].flatMap((a) => xf(lathe([[0, -78], [7, -78], [9, -92], [0, -92]].reverse().reverse(), 10, () => 'k'), { t: [rotY([9, 0, 0], a * D)[0], 0, rotY([9, 0, 0], a * D)[2]] }));
  const boosterAt = (a) => {
    const pos = rotY([42, 0, 0], a * D);
    const body = lathe([[0, -70], [17, -70], [19, -62], [19, 22], [17, 44], [11, 110], [5, 168], [0, 186]], 14, (j, i) => (j <= 2 ? 'p' : j === 3 ? (i % 2 ? 'b' : 'a') : i % 2 ? 'a' : 'c'));
    const noz = lathe([[0, -84], [11, -84], [14, -70], [0, -70]], 10, () => 'k');
    const fin = [0, 180].flatMap((r) => xf(extrude([[17, 6], [30, -30], [30, -64], [17, -58]], 3, 'd'), { ry: r + 90 }));
    const strap = lathe([[0, 20], [20, 20], [20, 24], [0, 24]], 14, () => 'k');
    return xf([...body, ...noz, ...fin, ...strap], { ry: 0, t: pos });
  };
  const boosters = [45, 135, 225, 315].map(boosterAt);
  const brace = [45, 135, 225, 315].flatMap((a) => xf(box([0, 0, 0], [20, 3, 3], 'd'), { ry: -a, t: rotY([33, 30, 0], a * D) }));
  const flameAt = (x, z, r, L) => xf([...lathe([[0, -L], [r * 0.45, -L * 0.55], [r, -4], [0, -4]], 10, (j, i) => (i % 2 ? 'f' : 'y')), ...lathe([[0, -L * 0.62], [r * 0.5, -L * 0.3], [r * 0.7, -4], [0, -4]], 10, (j, i) => (i % 2 ? 'y' : 'h'))], { t: [x, -86, z] });
  const flames = [...[45, 135, 225, 315].flatMap((a) => { const p = rotY([42, 0, 0], a * D); return flameAt(p[0], p[2], 12, 120); }), ...flameAt(0, 0, 18, 140)];
  add3d('vostok-roketi-3d', 'Vostok Roketi 3B', ['vostok', 'vostok roketi', 'roket', 'gagarin', 'fırlatma', 'sovyet', 'uzay yarışı', '1961', 'uçuş', 'araç'],
    { a: '#dfe3e8', b: '#bcc3cc', c: '#f3f6f9', p: '#c9aebd', d: '#6c7482', w: '#a6afbb', k: '#3b4352', g: '#1b2a45', f: '#ff9a3b', y: '#ffd86a', h: '#fff3c4' },
    { a: 'ana', b: 'ikincil', c: 'acik', p: 'vurgu', d: 'koyu', w: 'detay', k: 'koyu-detay', g: 'cam', f: 'alev', y: 'alev-acik', h: 'alev-cekirdek' },
    [flames, [...coreNoz, ...core, ...truss, ...trussRings, ...shroud, ...band, ...hole, ...core2], ...[[...boosters[2], ...boosters[3]], [...brace], [...boosters[0], ...boosters[1]]]].map((g) => g),
    { yaw: 28, pitch: 6, roll: 0 },
    { variants: { gece: { name: 'Gece rampası', palette: { a: '#c9ced8', b: '#a2a9b6', c: '#e6eaf0', p: '#b3a1b6' } } } }, 240);
}

fs.mkdirSync(OUT, { recursive: true });
for (const a of assets) {
  fs.writeFileSync(path.join(OUT, a.id + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(a.id, a.facets.length, 'yüz', a.size.join('x'));
}
