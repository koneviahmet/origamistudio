// Zaman tüneli reels'leri için 3B poligon-ağı modeller (kullanıcı onay sayfasında "düzenle" dediği nesneler):
//   mikroskop, hucre-petek, bakteri, hucre-bolunme (biyoloji) · kumas-rulo, tisort (tekstil)
//   yapay-beyin, satranc-sah (yapay-zeka) · wright-flyer, tek-kanat-ucak, spirit-of-st-louis, jet-ucagi, bell-x1 (havacilik)
//   node scripts/seed-zaman-tuneli-3d.mjs      (üzerine yazar; araçlar: scripts/lib/mesh3d.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { r1, D, add, sub, mul, dot, cross, norm, rng, makeNoise, poly, lathe, arc, box, ball, extrude, ribbon, xf, render } from './lib/mesh3d.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library');
const out = [];
const A = (kategori, id, name, tags, palette, roles, groups, view, extra = {}, size = 220) => {
  const { facets, size: sz } = render(groups, view, size);
  out.push({ kategori, id, name, tags: [...tags, '3d', '3 boyutlu', 'hacimli'], size: sz, palette, roles, facets, ...extra });
};

// ---- ek araçlar -------------------------------------------------------------------------------
const cent = (P) => P.reduce((s, p) => add(s, p), [0, 0, 0]).map((v) => v / P.length);
/** İçteki bir noktadan dışarı bakacak şekilde normal hesaplayan çokgen */
const opoly = (P, c, inside, extra) => {
  let n = cross(sub(P[1], P[0]), sub(P[2], P[0]));
  if (dot(n, sub(cent(P), inside)) < 0) n = mul(n, -1);
  return poly(P, n, c, extra);
};
/** Eğimli kenarlı ekstrüzyon (xy dış hattı, z kalınlık): yastık / kabartma etkisi */
function bevel(outline, t, inset, key, o = {}) {
  const h = t / 2, h2 = h + (o.lift ?? 5);
  const c = [outline.reduce((s, p) => s + p[0], 0) / outline.length, outline.reduce((s, p) => s + p[1], 0) / outline.length];
  const inn = outline.map(([x, y]) => [c[0] + (x - c[0]) * inset, c[1] + (y - c[1]) * inset]);
  const res = [];
  res.push(poly(inn.map(([x, y]) => [x, y, h2]), [0, 0, 1], o.top || key));
  res.push(poly(inn.slice().reverse().map(([x, y]) => [x, y, -h2]), [0, 0, -1], o.top || key));
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length;
    for (const sg of [1, -1]) {
      const P = [[outline[i][0], outline[i][1], sg * h], [outline[j][0], outline[j][1], sg * h], [inn[j][0], inn[j][1], sg * h2], [inn[i][0], inn[i][1], sg * h2]];
      res.push(opoly(P, key, [c[0], c[1], 0]));
    }
    res.push(opoly([[outline[i][0], outline[i][1], h], [outline[j][0], outline[j][1], h], [outline[j][0], outline[j][1], -h], [outline[i][0], outline[i][1], -h]], o.side || key, [c[0], c[1], 0]));
  }
  return res;
}
/** Açıklıkla x boyunca uzanan kanat: açıklık x, veter z (ön kenar -z), üst yüz kaburga şeritli */
function wing({ L, c, y = 0, th = 5, step = 14, keys = ['a', 'b'], under = 'b', round = 0.82, taper = 0, x0 = 0 }) {
  const res = [];
  const half = (x) => {
    const u = Math.abs(x - x0) / L;
    const k = u < round ? 1 : Math.sqrt(Math.max(0, 1 - ((u - round) / (1 - round)) ** 2));
    return (c / 2) * (1 - taper * u) * Math.max(0.18, k);
  };
  let idx = 0;
  for (let x = x0 - L; x < x0 + L - 0.01; x += step, idx++) {
    const xe = Math.min(x + step, x0 + L), h0 = half(x), h1 = half(xe);
    const k = keys[idx % keys.length];
    res.push(poly([[x, y + th / 2, -h0], [xe, y + th / 2, -h1], [xe, y + th / 2, h1], [x, y + th / 2, h0]], [0, 1, 0], k));
    res.push(poly([[x, y - th / 2, h0], [xe, y - th / 2, h1], [xe, y - th / 2, -h1], [x, y - th / 2, -h0]], [0, -1, 0], under));
    res.push(poly([[x, y + th / 2, -h0], [x, y - th / 2, -h0], [xe, y - th / 2, -h1], [xe, y + th / 2, -h1]], [0, 0, -1], under));
    res.push(poly([[x, y + th / 2, h0], [xe, y + th / 2, h1], [xe, y - th / 2, h1], [x, y - th / 2, h0]], [0, 0, 1], under));
  }
  const hl = half(x0 - L), hr = half(x0 + L - 0.001);
  res.push(poly([[x0 - L, y + th / 2, -hl], [x0 - L, y - th / 2, -hl], [x0 - L, y - th / 2, hl], [x0 - L, y + th / 2, hl]], [-1, 0, 0], under));
  res.push(poly([[x0 + L, y + th / 2, -hr], [x0 + L, y + th / 2, hr], [x0 + L, y - th / 2, hr], [x0 + L, y - th / 2, -hr]], [1, 0, 0], under));
  return res;
}
/** İki nokta arası ince çubuk (dikdörtgen kesit) */
function rod(p, q, w, key) {
  const d = sub(q, p), L = Math.hypot(...d) || 1, u = norm(d);
  const up = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const s = mul(norm(cross(u, up)), w / 2), t = mul(norm(cross(u, s)), w / 2);
  const C = [add(add(p, s), t), add(sub(p, s), t), sub(sub(p, s), t), sub(add(p, s), t)];
  const E = [add(add(q, s), t), add(sub(q, s), t), sub(sub(q, s), t), sub(add(q, s), t)];
  const mid = mul(add(p, q), 0.5);
  const f = [];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; f.push(opoly([C[i], C[j], E[j], E[i]], key, mid)); }
  return f;
}
/** Pervane: z eksenli, iki kanat */
const prop = (R, w, key, t = [0, 0, 0], rz = 0) => [0, 180].flatMap((r) => xf(extrude([[-w / 2, 5], [w / 2, 5], [w * 0.75, R * 0.55], [w * 0.3, R], [-w * 0.3, R], [-w * 0.75, R * 0.55]], 2.6, key), { rz: rz + r, t }));
const wheel = (r, wd, key, hub, t, rx = 90) => xf([...lathe([[0, -wd / 2], [r, -wd / 2], [r, wd / 2], [0, wd / 2]], 14, (j) => (j === 1 ? key : hub))], { rx, t });

// ═══════════════════════════════════════════════════════════ BİYOLOJİ
{ // mikroskop
  const body = [];
  const th = 24;
  const pts = [];
  const cx = -18;
  for (let a = -78; a <= 78; a += 13) pts.push([cx + 96 * Math.cos(a * D), 96 * Math.sin(a * D) - 6]);
  const inn = [];
  for (let a = 78; a >= -78; a -= 13) inn.push([cx + 72 * Math.cos(a * D), 72 * Math.sin(a * D) - 6]);
  const arm = bevel([...pts, ...inn], th, 0.9, 'a', { side: 'd', lift: 3 });
  const base = [...bevel([[-78, -118], [78, -118], [84, -100], [-84, -100]], 100, 0.9, 'a', { side: 'd', lift: 3 }), ...box([0, -124, 0], [190, 8, 112], 'd')];
  const baseTop = box([-10, -108, 0], [150, 8, 96], 'a');
  const neck = box([-28, 82, 0], [56, 26, 26], 'a');
  const tube = xf(lathe([[0, 0], [17, 0], [17, 120], [14, 124], [0, 124]], 18, (j, i) => (i % 2 ? 'b' : 'q')), { t: [-30, -14, 0] });
  const ring = xf(lathe([[17, 40], [19.5, 40], [19.5, 48], [17, 48]], 18, () => 'd'), { t: [-30, -14, 0] });
  const eye = xf(lathe([[0, 0], [11, 0], [11, 36], [9, 42], [0, 42]], 16, (j, i) => (j === 2 ? 'c' : i % 2 ? 'd' : 'k')), { t: [-30, 108, 0] });
  const nose = xf(lathe([[0, 0], [26, 0], [26, -12], [0, -12]], 14, (j) => (j === 1 ? 'a' : 'd')), { t: [-30, -14, 0] });
  const obj = [-24, 14].flatMap((rz, i) => xf(lathe([[0, 0], [7, 0], [8, -22], [5, -34], [0, -34]], 10, (j, k) => (k % 2 ? 'c' : 'q')), { rz, t: [-30 + (i ? 12 : -12), -24, 0] }));
  const stage = [...box([-30, -62, 4], [112, 7, 80], 'a'), ...box([-30, -57, 4], [60, 2, 28], 'k'), ...box([-30, -52, 8], [44, 2.6, 15], 'g')];
  const pillar = box([-30, -80, -4], [18, 36, 14], 'a');
  const clips = [-1, 1].flatMap((s) => box([-30 + s * 26, -54, 4], [3, 3, 22], 'c'));
  const knob = (yy) => [1, -1].flatMap((s) => xf([...lathe([[0, 0], [15, 0], [15, 11], [12, 14], [0, 14]], 14, (j, i) => (j === 2 || j === 3 ? 'd' : i % 2 ? 'q' : 'c')), ...lathe([[6, 14], [6, 28]], 6, () => 'd')], { rx: 90 * s, t: [58, yy, s * 18] }));
  const mirror = xf(lathe([[0, 0], [24, 0], [24, 4], [0, 4]], 16, (j, i) => (i % 2 ? 'e' : 'y')), { rx: -22, t: [-30, -96, 14] });
  const bundle = [[...base, ...baseTop, ...pillar, ...mirror], [...arm, ...neck], [...knob(-6), ...knob(26)], [...stage, ...clips], [...tube, ...ring, ...nose, ...obj, ...eye]];
  A('biyoloji', 'mikroskop', 'Mikroskop', ['bilim', 'mikroskop', 'biyoloji', 'hücre', 'keşif', 'hooke'],
    { a: '#2d3a54', b: '#cfa24a', c: '#e9edf5', d: '#171d2e', e: '#ffe48a', y: '#e0b84e', g: '#8fc6f0', k: '#4a5a7a', q: '#b88a34' },
    { a: 'ana', b: 'vurgu', c: 'acik', d: 'koyu', e: 'vurgu', y: 'vurgu', g: 'cam', k: 'detay', q: 'ikincil' },
    bundle, { yaw: -32, pitch: 10 }, {}, 240);
}
{ // hücre peteği: mantar diliminde odacıklar
  const R = 74, N = 30;
  const circ = Array.from({ length: N }, (_, i) => [R * Math.cos((i / N) * 6.283), R * Math.sin((i / N) * 6.283)]);
  const slab = bevel(circ, 30, 0.97, 'a', { side: 'b', top: 'c', lift: 2 });
  const cells = [];
  const r = 11.5, w = Math.sqrt(3) * r;
  for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
    const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * 1.5 * r;
    if (Math.hypot(cx, cy) > R - r * 1.15) continue;
    const hex = (rr, z) => Array.from({ length: 6 }, (_, i) => [cx + rr * Math.cos((60 * i + 30) * D), cy + rr * Math.sin((60 * i + 30) * D), z]);
    cells.push(poly(hex(r * 0.99, 17.4), [0, 0, 1], (row + col) % 3 === 0 ? 'e' : 'w'));
    cells.push(poly(hex(r * 0.7, 17.6), [0, 0, 1], 'd'));
    cells.push(poly(hex(r * 0.42, 17.8), [0, 0, 1], (row * 3 + col) % 4 === 0 ? 'k' : 'f'));
  }
  A('biyoloji', 'hucre-petek', 'Hücre Peteği (mantar dilimi)', ['hücre', 'mantar', 'hooke', 'petek', 'biyoloji', 'mikroskop görüntüsü'],
    { a: '#c99a5e', b: '#9a6b36', c: '#dcb77c', d: '#6d4724', e: '#b98a4a', w: '#e2c48c', k: '#3f2813', f: '#8d6034' },
    { a: 'ana', b: 'koyu', c: 'acik', d: 'koyu', e: 'ikincil', w: 'acik', k: 'koyu', f: 'ikincil' },
    [slab, cells], { yaw: -24, pitch: 26 }, {}, 220);
}
{ // bakteri: çubuk gövde, tüycükler, dalgalı kırbaç
  const profile = [...arc(0, -42, 32, -90, 0, 7), ...arc(0, 42, 32, 0, 90, 7).slice(0)];
  const body = lathe(profile, 20, (j, i) => (j % 2 ? (i % 2 ? 'a' : 'b') : i % 2 ? 'b' : 'a'));
  const R = rng(5);
  const spots = Array.from({ length: 18 }, () => { const y = (R() - 0.5) * 110, ph = R() * 6.283; return ball([34 * Math.cos(ph), y, 34 * Math.sin(ph)], [4, 4, 4], 1, 'c', { seed: 2 }); }).flat();
  const pili = Array.from({ length: 34 }, (_, k) => {
    const y = (R() - 0.5) * 120, ph = R() * 6.283, rr = Math.sqrt(Math.max(0, 1 - ((Math.abs(y) - 42) / 32) ** 2));
    const rad = Math.abs(y) > 42 ? 32 * rr : 32;
    return xf(lathe([[0, 0], [1.8, 0], [0, 20]], 4, () => 'p'), { rz: -90, ry: -ph / D, t: [rad * Math.cos(ph), y, rad * Math.sin(ph)] });
  }).flat();
  const pts = Array.from({ length: 14 }, (_, k) => [16 * Math.sin(k * 0.8) * (k / 12), -74 - k * 9, 16 * Math.cos(k * 0.8) * (k / 12)]);
  const flag = ribbon(pts, pts.map((_, k) => 3.4 - k * 0.07), ['d', 'f'], { up: [1, 0, 0] });
  const nuc = ball([0, 6, 0], [16, 30, 14], 1, 'n', { seed: 4 });
  const g = (arr) => xf(arr, { rz: 68 });
  A('biyoloji', 'bakteri', 'Bakteri (kırbaçlı)', ['bakteri', 'mikrop', 'leeuwenhoek', 'biyoloji', 'canlı'],
    { a: '#5aad74', b: '#7fcf93', c: '#d9f5b0', d: '#2f7a50', f: '#3d9a66', p: '#a8dfae', n: '#2c6b46' },
    { a: 'ana', b: 'acik', c: 'vurgu', d: 'koyu', f: 'ikincil', p: 'detay', n: 'koyu' },
    [g(flag), g([...pili.filter((p) => p.P[0][2] < 0)]), g(body), g(spots), g(pili.filter((p) => p.P[0][2] >= 0))], { yaw: -10, pitch: 16 }, {}, 230);
}
{ // hücre bölünmesi: bel verme
  const Rn = rng(9);
  const cell = (x) => [
    ...ball([x, 0, 0], [46, 52, 34], 3, (v) => (makeNoise(3)(v) > 0.2 ? 'b' : 'a'), { seed: 6, jitter: 0.015 }),
  ];
  const nucleus = (x) => [...ball([x, 2, 24], [20, 24, 14], 2, (v, i) => (i % 5 === 0 ? 'm' : 'c'), { seed: 8 }), ...ball([x - 4, 8, 36], [7, 7, 5], 1, 'k')];
  const organelles = (x) => Array.from({ length: 5 }, (_, i) => ball([x + (Rn() - 0.5) * 60, (Rn() - 0.5) * 70, 22 + Rn() * 6], [8, 5, 5], 1, 'o', { seed: 3 })).flat();
  const neck = xf(lathe([[0, -26], [18, -26], [14, -10], [14, 10], [18, 26], [0, 26]], 14, () => 'd'), { rz: 90, t: [0, 0, 0] });
  const ring = xf(lathe([[13, -4], [17, -4], [17, 4], [13, 4]], 18, () => 'k'), { rz: 90 });
  const L = -34, Rr = 34;
  A('biyoloji', 'hucre-bolunme', 'Hücre Bölünmesi', ['hücre', 'bölünme', 'virchow', 'çoğalma', 'biyoloji', 'mitoz'],
    { a: '#ee8fa2', b: '#f7b6c2', c: '#8e6fc9', d: '#c9566f', k: '#3a2a6b', m: '#a98ae0', o: '#f2a35a' },
    { a: 'ana', b: 'acik', c: 'vurgu', d: 'koyu', k: 'koyu', m: 'vurgu', o: 'vurgu' },
    [neck, ring, cell(L), cell(Rr), nucleus(L - 4), nucleus(Rr + 4), organelles(L), organelles(Rr)], { yaw: -16, pitch: 20 }, {}, 230);
}

// ═══════════════════════════════════════════════════════════ TEKSTİL
{ // kumaş topu: çubuk üzerinde rulo + açılan kumaş
  const core = lathe([[0, -78], [11, -78], [11, 78], [0, 78]], 12, () => 'k');
  const rings = [];
  const layers = 7;
  const roll = lathe([[0, -62], [50, -62], [50, 62], [0, 62]], 28, (j, i) => (j === 1 ? (i % 4 < 2 ? 'a' : 'b') : j === 0 ? 'w' : 'w'));
  const caps = [];
  for (let l = 0; l < layers; l++) {
    const r0 = 12 + l * 5.4, r1 = r0 + 5.4;
    caps.push(...lathe([[r0, 62.2], [r1, 62.2]], 28, () => (l % 2 ? 'a' : 'c')), ...lathe([[r1, -62.2], [r0, -62.2]], 28, () => (l % 2 ? 'a' : 'c')));
  }
  const sheetPath = Array.from({ length: 20 }, (_, k) => [0, 3 + 4 * Math.sin(k * 0.7) * (k / 20), 40 + k * 8.5]);
  const sheet = ribbon(sheetPath, sheetPath.map(() => 62), ['a', 'b'], { up: [0, 1, 0] }).map((p) => ({ ...p, b: 0 }));
  const hem = ribbon([[-62, 3, 40], [-62, 3, 40 + 19 * 8.5]], [1.2, 1.2], ['d'], { up: [1, 0, 0] });
  const stripe = Array.from({ length: 5 }, (_, s) => ribbon(sheetPath.map(([x, y, z]) => [-48 + s * 24, y + 0.3, z]), sheetPath.map(() => 3.2), ['c'], { up: [0, 1, 0] })).flat();
  const rollG = xf([...roll, ...caps], { rz: 90, t: [0, 50, 0] });
  const coreG = xf(core, { rz: 90, t: [0, 50, 0] });
  A('tekstil', 'kumas-rulo', 'Kumaş Topu', ['kumaş', 'rulo', 'dokuma', 'tekstil', 'boya', 'balya'],
    { a: '#4a8fd1', b: '#6fa9e0', c: '#f1f5fb', w: '#3d7bb8', k: '#c9a26b', d: '#2c5f9b' },
    { a: 'ana', b: 'acik', c: 'detay', w: 'ikincil', k: 'ikincil', d: 'koyu' },
    [sheet, stripe, hem, coreG, rollG], { yaw: -32, pitch: 24 }, {}, 240);
}
{ // tişört: katlı ön yüzey + yaka + kol ağzı
  const outline = [[-22, 70], [-52, 62], [-92, 34], [-74, 6], [-52, 24], [-52, -70], [52, -70], [52, 24], [74, 6], [92, 34], [52, 62], [22, 70], [14, 55], [0, 49], [-14, 55]];
  const inside = (x, y) => { let c = false; for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) { const [xi, yi] = outline[i], [xj, yj] = outline[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const back = extrude(outline, 12, 'b', { side: 'd' });
  const fz = (x, y) => 9 + 3.2 * Math.sin(x * 0.11 + y * 0.03) + 2.2 * Math.sin(y * 0.09 - x * 0.05) - (Math.abs(x) > 52 ? 2 : 0);
  const front = [];
  const st = 4;
  for (let x = -96; x < 96; x += st) for (let y = -72; y < 72; y += st) {
    const pts = [[x, y], [x + st, y], [x + st, y + st], [x, y + st]];
    if (!pts.every(([px, py]) => inside(px, py) || inside(px + (px < x + 1 ? 0.01 : -0.01), py + (py < y + 1 ? 0.01 : -0.01)))) continue;
    const e = 0.8;
    const dz = (fz(x + e, y + st / 2) - fz(x - e, y + st / 2)) / (2 * e), dzy = (fz(x + st / 2, y + e) - fz(x + st / 2, y - e)) / (2 * e);
    const sleeve = Math.abs(x + st / 2) > 52 && y + st / 2 > 6;
    const hem = y < -62 || (sleeve && (Math.hypot(Math.abs(x + st / 2) - 83, y + st / 2 - 21) < 4 || false));
    const stripe = y + st / 2 < -50 && y + st / 2 > -58;
    front.push(poly(pts.map(([px, py]) => [px, py, fz(px, py)]), [-dz, -dzy, 1], hem ? 'h' : stripe ? 's' : 'a'));
  }
  const collar = [];
  const nk = Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (i / 12); return [22 * Math.cos(a) * -1, 70 - 21 * Math.sin(a) * 1.0, 11]; });
  // yaka şeridi: boyun hattı boyunca iki kat
  const neckPath = [[-22, 70, 11], [-14, 55, 11], [0, 49, 11], [14, 55, 11], [22, 70, 11]];
  const neckIn = [[-17, 70, 11], [-11, 59, 11], [0, 54, 11], [11, 59, 11], [17, 70, 11]];
  for (let i = 0; i < 4; i++) collar.push(poly([neckPath[i], neckPath[i + 1], neckIn[i + 1], neckIn[i]], [0, 0, 1], 'c'));
  const inner = poly([[-17, 70, 6], [17, 70, 6], [11, 59, 6], [0, 54, 6], [-11, 59, 6]], [0, 0, 1], 'd');
  const star = Array.from({ length: 10 }, (_, i) => { const a = (i * 36 - 90) * D, r = i % 2 ? 9 : 20; return [r * Math.cos(a), 4 + r * Math.sin(a)]; });
  const print = (() => { const z = fz(0, 4) + 1; const c = star.reduce((s, p) => [s[0] + p[0] / 10, s[1] + p[1] / 10], [0, 0]); return star.map((p, i) => poly([[c[0], c[1], z], [p[0], p[1], z], [star[(i + 1) % 10][0], star[(i + 1) % 10][1], z]], [0, 0, 1], 'p', { two: true })); })();
  A('tekstil', 'tisort', 'Tişört', ['tişört', 'giyim', 'kıyafet', 'moda', 'tekstil', 'mağaza'],
    { a: '#4a8fd1', b: '#2e6aa6', c: '#2c5f9b', d: '#1d4577', h: '#3f7dbb', s: '#ffd86b', p: '#ffd86b' },
    { a: 'ana', b: 'koyu', c: 'koyu', d: 'koyu', h: 'ikincil', s: 'vurgu', p: 'vurgu' },
    [back, [inner], front, collar, print], { yaw: -8, pitch: 6 },
    { variants: { beyaz: { name: 'Beyaz', palette: { a: '#f4f1ea', b: '#cfc9bb', c: '#b9b2a2', d: '#9d9686', h: '#e6e1d6', s: '#e2557a', p: '#e2557a' } }, kirmizi: { name: 'Kırmızı', palette: { a: '#e2557a', b: '#b13e5e', c: '#9d3350', d: '#7d2540', h: '#cc4a6d', s: '#ffd86b', p: '#ffd86b' } } } }, 240);
}

// ═══════════════════════════════════════════════════════════ YAPAY ZEKÂ
{ // yapay beyin: yan görünüm + devre izleri
  const Nz = makeNoise(21, 3.0);
  const cerebrum = ball([0, 8, 0], [82, 58, 50], 3, (v) => { const n = Nz(v); return n < -0.15 ? 'b' : n > 0.38 ? 'c' : 'a'; }, { seed: 5, jitter: 0.085 });
  const cb = ball([34, -44, 0], [36, 22, 30], 2, (v, i) => (i % 3 ? 'b' : 'a'), { seed: 9, jitter: 0.03 });
  const stem = xf(lathe([[0, 0], [11, 0], [9, 38], [0, 38]], 10, () => 'b'), { rz: -14, t: [6, -58, 0] });
  const nodes = [[-52, 6], [-26, 30], [4, 22], [38, 34], [58, 8], [-34, -16], [-2, -6], [30, -10], [12, 46]];
  const zOn = (x, y) => { const q = 1 - (x / 82) ** 2 - ((y - 8) / 58) ** 2; return Math.sqrt(Math.max(0.02, q)) * 50 + 2.5; };
  const P3 = nodes.map(([x, y]) => [x, y, zOn(x, y)]);
  const link = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 4], [1, 8], [8, 3], [2, 6], [6, 3]];
  const lines = link.flatMap(([i, j]) => { const mid = mul(add(P3[i], P3[j]), 0.5); mid[2] = zOn(mid[0], mid[1]) + 2.5; return ribbon([P3[i], mid, P3[j]], [1.5, 1.5, 1.5], ['g'], { up: [0, 0, 1], b: 0.3 }); });
  const dots = P3.flatMap((p) => ball(add(p, [0, 0, 1]), [4.6, 4.6, 4.6], 1, 'e', { seed: 2 }));
  const glow = P3.flatMap((p) => ball(add(p, [0, 0, 0.5]), [7.6, 7.6, 3], 1, 'g', { seed: 2 }));
  A('yapay-zeka', 'yapay-beyin', 'Yapay Beyin (devre)', ['yapay zekâ', 'beyin', 'sinir ağı', 'devre', 'öğrenme', 'dartmouth'],
    { a: '#a68be8', b: '#7d63c4', c: '#c9b8f5', g: '#6fe0d0', e: '#fff3a8' },
    { a: 'ana', b: 'koyu', c: 'acik', g: 'vurgu', e: 'vurgu' },
    [stem, cb, cerebrum, glow, lines, dots], { yaw: -12, pitch: 8 }, {}, 240);
}
{ // satranç atı (şahsız, haçsız): şekilli at + kaideli
  const base = lathe([[0, 0], [52, 0], [54, 6], [50, 12], [40, 18], [38, 24], [0, 24]], 22, (j, i) => (j === 2 ? 'g' : i % 2 ? 'a' : 'b'));
  const collar = lathe([[0, 24], [40, 24], [42, 30], [36, 36], [32, 44], [0, 44]], 22, (j, i) => (j === 0 ? 'g' : i % 2 ? 'a' : 'b'));
  const head = [[34, 44], [38, 70], [32, 98], [22, 118], [18, 144], [8, 128], [-4, 142], [-6, 118], [-26, 100], [-46, 80], [-60, 64], [-62, 52], [-54, 44], [-38, 50], [-26, 62], [-16, 70], [-22, 56], [-34, 44]];
  const horse = xf(bevel(head, 40, 0.8, 'a', { side: 'b', top: 'a', lift: 5 }), { t: [0, 0, 0] });
  const mane = Array.from({ length: 7 }, (_, i) => { const t = i / 6; const x = 34 - t * 16, y = 56 + t * 74; return box([x - 4, y, 0], [8, 12, 12], 'm'); }).flat();
  const eye = ball([-28, 92, 21], [4.2, 4.2, 4.2], 1, 'k', { seed: 2 });
  const nostril = ball([-56, 60, 18], [3, 3, 3], 1, 'k', { seed: 2 });
  A('yapay-zeka', 'satranc-sah', 'Satranç Atı', ['satranç', 'at', 'taş', 'oyun', 'deep blue', 'kasparov', 'strateji', 'satranç taşı'],
    { a: '#2f3342', b: '#1c1f2b', g: '#c8963e', m: '#464c63', k: '#e9edf5' },
    { a: 'ana', b: 'koyu', g: 'vurgu', m: 'ikincil', k: 'acik' },
    [base, collar, horse, mane, eye, nostril], { yaw: -26, pitch: 10 },
    { variants: { beyaz: { name: 'Beyaz', palette: { a: '#f1ede4', b: '#cfc8b8', g: '#c8963e', m: '#d9d2c2', k: '#2f3342' } } } }, 240);
}

// ═══════════════════════════════════════════════════════════ HAVACILIK
{ // Wright Flyer: çift kanat, ön dümen, iki arka pervane, kızaklar
  const U = 40, Lo = -40;
  const upper = wing({ L: 150, c: 56, y: U, th: 4, step: 12, keys: ['a', 'f'], under: 'u' });
  const lower = wing({ L: 150, c: 56, y: Lo, th: 4, step: 12, keys: ['a', 'f'], under: 'u' });
  const struts = [];
  for (const x of [-140, -100, -60, -20, 20, 60, 100, 140]) for (const z of [-25, 25]) struts.push(...rod([x, Lo, z], [x, U, z], 2.8, 'w'));
  const wires = [];
  for (const z of [-25, 25]) for (let x = -140; x < 140; x += 40) { wires.push(...rod([x, Lo, z], [x + 40, U, z], 1.1, 'k'), ...rod([x + 40, Lo, z], [x, U, z], 1.1, 'k')); }
  // ön dümen (iki kat) uzakta
  const fz0 = -125;
  const cu = wing({ L: 52, c: 28, y: 18, th: 3, step: 10, keys: ['a', 'f'], under: 'u' }).map((p) => ({ ...p, P: p.P.map(([x, y, z]) => [x, y, z + fz0]) }));
  const cl = wing({ L: 52, c: 28, y: -8, th: 3, step: 10, keys: ['a', 'f'], under: 'u' }).map((p) => ({ ...p, P: p.P.map(([x, y, z]) => [x, y, z + fz0]) }));
  const cstrut = [-44, 0, 44].flatMap((x) => [...rod([x, -8, fz0 - 10], [x, 18, fz0 - 10], 2, 'w'), ...rod([x, -8, fz0 + 10], [x, 18, fz0 + 10], 2, 'w')]);
  const boom = [-22, 22].flatMap((x) => [...rod([x, Lo, -26], [x * 0.9, 5, fz0 + 8], 2.4, 'w')]);
  // arka dümen (iki dikey kanat)
  const rud = [-12, 12].flatMap((x) => xf(extrude([[0, -20], [34, -20], [34, 20], [0, 20]].map(([a, b]) => [a - 17, b * 1.2]), 2.4, 'a', { side: 'u' }), { ry: 90, t: [x, 4, 112] }));
  const tailBoom = [-12, 12].flatMap((x) => [...rod([x, 2, 112], [x * 2.2, Lo, 25], 2.2, 'w'), ...rod([x, 18, 112], [x * 2.2, U, 25], 2.2, 'w')]);
  // pilot + motor + pervaneler
  const engine = box([14, Lo + 8, 2], [26, 16, 22], 'k');
  const pilot = [...ball([-6, Lo + 6, 4], [8, 6, 20], 1, 'p', { seed: 3 }), ...ball([-6, Lo + 12, -14], [6, 6, 6], 1, 'p', { seed: 4 })];
  const props = [-62, 62].flatMap((x) => prop(52, 12, 'r', [x, 2, 52], 12));
  const chain = [-62, 62].flatMap((x) => rod([x, Lo + 4, 28], [x, 4, 52], 1.8, 'k'));
  const skids = [-34, 34].flatMap((x) => [...rod([x, -58, 70], [x, -58, -85], 3.4, 'w'), ...rod([x, -58, -85], [x, -42, -112], 3.4, 'w'), ...rod([x, Lo, 30], [x, -58, 36], 2.2, 'w'), ...rod([x, Lo, -30], [x, -58, -34], 2.2, 'w')]);
  A('havacilik', 'wright-flyer', 'Wright Flyer (1903)', ['uçak', 'wright', 'ilk uçuş', 'çift kanat', 'havacılık', '1903'],
    { a: '#ead29a', f: '#dcbc78', u: '#c9a96a', w: '#8a5a30', k: '#2e2a26', r: '#b98a50', p: '#b8512f' },
    { a: 'acik', f: 'ana', u: 'ikincil', w: 'koyu', k: 'koyu', r: 'ikincil', p: 'vurgu' },
    [skids, lower, [...struts, ...wires], [...tailBoom, ...rud], [...cl, ...cstrut, ...boom], [...engine, ...pilot, ...chain], upper, [...cu], props], { yaw: 32, pitch: 24, roll: 0 }, {}, 260);
}
{ // Blériot XI: krem tek kanat, kafes gövde, üç silindirli motor
  const wg = wing({ L: 120, c: 58, y: 8, th: 4, step: 12, keys: ['a', 'f'], under: 'u', round: 0.86 });
  const cowl = xf(lathe([[0, 0], [15, 0], [17, 10], [17, 30], [0, 30]], 14, (j, i) => (j === 0 ? 'k' : i % 2 ? 'm' : 'k')), { rx: 90, t: [0, 4, -62] });
  const cyl = Array.from({ length: 3 }, (_, i) => xf(lathe([[0, 0], [5, 0], [5, 18], [0, 18]], 8, () => 'k'), { rz: (i - 1) * 55, t: [(i - 1) * 3, 4, -66] })).flat();
  const rails = [[-8, -8], [8, -8], [-8, 8], [8, 8]].flatMap(([x, y]) => rod([x, y + 6, -48], [x * 0.18, y * 0.18 + 12, 120], 2.4, 'w'));
  const rungs = [-30, -4, 24, 52, 80, 104].flatMap((z) => { const k = 1 - (z + 48) / 190 * 0.78; return [...rod([-8 * k, 14 - 8 * k, z], [8 * k, 14 - 8 * k, z], 1.6, 'w'), ...rod([-8 * k, 14 + 8 * k, z], [8 * k, 14 + 8 * k, z], 1.6, 'w'), ...rod([-8 * k, 14 - 8 * k, z], [-8 * k, 14 + 8 * k, z], 1.6, 'w'), ...rod([8 * k, 14 - 8 * k, z], [8 * k, 14 + 8 * k, z], 1.6, 'w')]; });
  const seat = [...ball([0, 22, 6], [7, 9, 7], 1, 'p', { seed: 2 }), ...box([0, 14, 6], [14, 4, 18], 'k')];
  const tailH = wing({ L: 34, c: 24, y: 16, th: 3, step: 10, keys: ['a', 'f'], under: 'u' }).map((p) => ({ ...p, P: p.P.map(([x, y, z]) => [x, y, z + 118]) }));
  const tailV = xf(extrude([[0, 0], [30, 0], [34, 40], [10, 44]], 2.6, 'a', { side: 'u' }), { ry: 90, t: [0, 12, 118] });
  const mast = [...rod([-30, 10, -2], [0, 40, -2], 2, 'k'), ...rod([30, 10, -2], [0, 40, -2], 2, 'k'), ...rod([-110, 8, -2], [0, 40, -2], 1, 'k'), ...rod([110, 8, -2], [0, 40, -2], 1, 'k')];
  const strutW = [-44, 44].flatMap((x) => rod([x, -2, -2], [x * 0.2, -26, -34], 3, 'w'));
  const wheels = [-30, 30].flatMap((x) => wheel(15, 6, 'k', 'm', [x, -34, -34], 90).map((p) => ({ ...p, P: p.P.map(([a, b, c]) => [a, b, c]) })));
  const axle = rod([-30, -34, -34], [30, -34, -34], 2.6, 'w');
  const tailW = rod([0, 6, 112], [0, -6, 120], 2, 'k');
  const propB = prop(66, 12, 'r', [0, 4, -76], 0);
  A('havacilik', 'tek-kanat-ucak', 'Blériot XI (tek kanat)', ['uçak', 'blériot', 'manş', 'havacılık', 'tek kanat', '1909', 'erken uçak'],
    { a: '#f1e6c8', f: '#e3d3a8', u: '#c9b98a', w: '#8a5a30', k: '#2e2a26', m: '#5b6572', r: '#c18a52', p: '#5a7a96' },
    { a: 'acik', f: 'ana', u: 'ikincil', w: 'koyu', k: 'koyu', m: 'detay', r: 'ikincil', p: 'vurgu' },
    [[...wheels, ...axle, ...strutW], [...rails, ...rungs, ...tailW], [...tailH, ...tailV], [...seat], wg, [...mast], [...cowl, ...cyl], propB], { yaw: 38, pitch: 20 }, {}, 260);
}
{ // Spirit of St. Louis: gümüş, kalın gövde, yıldız motor
  const fus = xf(lathe([[0, -62], [26, -62], [28, -50], [26, -30], [30, 20], [28, 80], [20, 130], [8, 160], [0, 164]], 22, (j, i) => (j === 0 ? 'k' : j === 1 ? 'm' : i % 2 ? 'a' : 'f')), { rx: 90, t: [0, 0, 0] });
  const wg = wing({ L: 150, c: 62, y: 28, th: 7, step: 14, keys: ['a', 'f'], under: 'u', round: 0.9, taper: 0.25 });
  const cowlRing = xf(lathe([[24, -66], [29, -66], [29, -54], [24, -54]], 22, () => 'm'), { rx: 90 });
  const cyl = Array.from({ length: 9 }, (_, i) => xf(box([0, 0, 0], [6, 6, 8], 'k'), { rz: i * 40, t: [22 * Math.cos(i * 40 * D), 22 * Math.sin(i * 40 * D), -64] })).flat();
  const prop_ = prop(74, 13, 'p', [0, 0, -74], 90);
  const hub = xf(lathe([[0, 0], [9, 0], [7, 8], [0, 10]], 10, () => 'm'), { rx: -90, t: [0, 0, -76] });
  const tailH = wing({ L: 46, c: 40, y: 8, th: 4, step: 12, keys: ['a', 'f'], under: 'u' }).map((p) => ({ ...p, P: p.P.map(([x, y, z]) => [x, y, z + 150]) }));
  const tailV = xf(extrude([[0, 0], [44, 0], [50, 56], [14, 62]], 3.4, 'a', { side: 'u' }), { ry: 90, t: [0, 20, 142] });
  const struts = [-52, 52].flatMap((x) => [...rod([x * 0.5, 14, 6], [x, 26, 6], 3, 'w'), ...rod([x * 0.5, -24, 6], [x * 0.9, 26, 6], 2.6, 'k')]);
  const gear = [-40, 40].flatMap((x) => [...rod([x * 0.5, -20, -6], [x, -52, -22], 3.4, 'k'), ...rod([x * 0.5, -20, 16], [x, -52, -22], 3.4, 'k'), ...wheel(20, 9, 'k', 'm', [x, -52, -22], 90)]);
  const axle = rod([-40, -52, -22], [40, -52, -22], 2.6, 'k');
  const stripe = xf(lathe([[28.4, 22], [28.4, 34], [26.4, 34], [26.4, 22]].map(([r, y]) => [r, y]), 22, () => 'n'), { rx: 90 }).filter(() => false);
  const win = ball([0, 26, 34], [9, 5, 14], 1, 'g', { seed: 2 });
  A('havacilik', 'spirit-of-st-louis', 'Spirit of St. Louis (1927)', ['uçak', 'lindbergh', 'atlantik', 'havacılık', 'tek kanat', '1927', 'new york paris'],
    { a: '#cfd6e0', f: '#b7c0cd', u: '#8f9aa8', k: '#2e3340', m: '#7b8696', p: '#c18a52', g: '#2a3a55', w: '#6c4a2a', n: '#e2557a' },
    { a: 'acik', f: 'ana', u: 'ikincil', k: 'koyu', m: 'detay', p: 'vurgu', g: 'cam', w: 'koyu', n: 'vurgu' },
    [[...gear, ...axle], [...tailH, ...tailV], fus, [...cowlRing, ...cyl], wg, [...struts, ...win], [...hub], prop_], { yaw: 34, pitch: 18 }, {}, 260);
}
{ // erken jet (He 178 ruhunda): burun girişi, omuz kanatları, kuyruk
  const fus = xf(lathe([[0, -100], [11, -100], [20, -94], [24, -78], [26, -40], [26, 40], [22, 90], [14, 122], [9, 130], [0, 130]], 22, (j, i) => (j === 0 ? 'k' : j === 1 ? 'r' : i % 2 ? 'a' : 'f')), { rx: 90, t: [0, 0, 0] });
  const intake = xf(lathe([[0, 0], [13, 0], [11, 6], [0, 8]], 18, () => 'k'), { rx: 90, t: [0, 0, -104] });
  const lip = xf(lathe([[10, 0], [16, 0], [16, 5], [10, 5]], 18, () => 'm'), { rx: 90, t: [0, 0, -101] });
  const wg = wing({ L: 110, c: 54, y: 4, th: 5, step: 16, keys: ['a', 'f'], under: 'u', round: 0.92, taper: 0.45 });
  const tailH = wing({ L: 46, c: 30, y: 10, th: 4, step: 12, keys: ['a', 'f'], under: 'u', taper: 0.3 }).map((p) => ({ ...p, P: p.P.map(([x, y, z]) => [x, y, z + 112]) }));
  const tailV = xf(extrude([[0, 0], [38, 0], [48, 52], [18, 56]], 3.4, 'a', { side: 'u' }), { ry: 90, t: [0, 18, 98] });
  const canopy = ball([0, 22, 14], [12, 12, 28], 2, 'g', { seed: 2 });
  const nozzle = xf(lathe([[0, 0], [10, 0], [8, 8], [0, 8]], 14, (j) => (j === 1 ? 'k' : 'e')), { rx: 90, t: [0, 0, 128] });
  const flame = xf(lathe([[0, 0], [8, 0], [5, 40], [0, 70]], 10, (j, i) => (i % 2 ? 'o' : 'y')), { rx: -90, t: [0, 0, 136 + 70] }).filter(() => false);
  const band = xf(lathe([[26.2, 52], [26.2, 62], [22.8, 62], [22.8, 52]], 22, () => 'r'), { rx: 90 }).filter(() => false);
  const pods = [];
  A('havacilik', 'jet-ucagi', 'Jet Uçağı (1939)', ['jet', 'uçak', 'heinkel', 'türbin', 'havacılık', '1939', 'erken jet'],
    { a: '#cfd8e3', f: '#aab6c6', u: '#7d8aa0', k: '#242a38', m: '#5b6572', r: '#e2557a', g: '#7fb7e6', e: '#ff9a3b' },
    { a: 'acik', f: 'ana', u: 'ikincil', k: 'koyu', m: 'detay', r: 'vurgu', g: 'cam', e: 'vurgu' },
    [[...tailH], fus, [...tailV], wg, [...intake, ...lip, ...nozzle], [...canopy]], { yaw: 38, pitch: 18 }, {}, 260);
}
{ // Bell X-1: turuncu mermi gövde, ince kısa kanat
  const fus = xf(lathe([[0, -110], [9, -104], [18, -90], [24, -66], [27, -30], [27, 50], [22, 100], [16, 116], [14, 120], [0, 120]], 22, (j, i) => (j <= 1 ? 'k' : i % 2 ? 'a' : 'f')), { rx: 90 });
  const wg = wing({ L: 78, c: 34, y: 0, th: 3.2, step: 13, keys: ['a', 'f'], under: 'u', round: 0.9, taper: 0.28, x0: 0 });
  const tailH = wing({ L: 40, c: 24, y: 40, th: 2.8, step: 12, keys: ['a', 'f'], under: 'u', taper: 0.3 }).map((p) => ({ ...p, P: p.P.map(([x, y, z]) => [x, y, z + 106]) }));
  const tailV = xf(extrude([[0, 0], [32, 0], [38, 44], [14, 48]], 3, 'a', { side: 'u' }), { ry: 90, t: [0, 24, 92] });
  const canopy = ball([0, 22, -62], [11, 10, 20], 2, 'g', { seed: 2 });
  const frame = [-1, 0, 1].flatMap((k) => rod([k * 6, 30, -74], [k * 6, 14, -50], 1.4, 'k'));
  const nozz = [[-6, -6], [6, -6], [-6, 6], [6, 6]].flatMap(([x, y]) => xf(lathe([[0, 0], [6, 0], [4, 14], [0, 14]], 10, (j) => (j === 1 ? 'k' : 'e')), { rx: 90, t: [x, y, 118] }));
  const stripe = xf(lathe([[27.3, -10], [27.3, 6], [23, 6], [23, -10]], 22, () => 'w'), { rx: 90 }).filter(() => false);
  const nose = xf(lathe([[0, 0], [8, 0], [8, 8], [0, 8]], 12, () => 'k'), { rx: 90, t: [0, 0, -114] }).filter(() => false);
  A('havacilik', 'bell-x1', 'Bell X-1 (roket uçak)', ['x-1', 'yeager', 'ses duvarı', 'roket uçak', 'havacılık', '1947'],
    { a: '#f59a3c', f: '#e07a1f', u: '#b8581a', k: '#2e2a26', g: '#8fc6f0', e: '#ff7a3b', w: '#ffffff' },
    { a: 'ana', f: 'ikincil', u: 'koyu', k: 'koyu', g: 'cam', e: 'vurgu', w: 'acik' },
    [[...tailH], fus, [...tailV], wg, [...canopy, ...frame], [...nozz]], { yaw: 38, pitch: 18 }, {}, 260);
}

// ─────────────────────────────────────────────────────────── yaz
for (const { kategori, ...a } of out) {
  if (kategori === 'havacilik') continue; // havacılık: scripts/seed-havacilik.mjs ile yeniden yazıldı (ayrıntılı model)
  const dir = path.join(LIB, kategori);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
  console.log(`${kategori}/${a.id}`.padEnd(32), a.facets.length, 'yüz', a.size.join('x'));
}
