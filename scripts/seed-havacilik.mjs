// Havacılık kategorisi: ayrıntılı 3B poligon-ağı uçaklar (araçlar: scripts/lib/ucak3d.mjs, mesh3d.mjs)
//   wright-flyer, tek-kanat-ucak (Blériot XI), spirit-of-st-louis, jet-ucagi (He 178), bell-x1
//   node scripts/seed-havacilik.mjs [id ...]     (üzerine yazar; id verilirse yalnızca onları)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { D, add, sub, mul, xf, render, box, ball, extrude, poly } from './lib/mesh3d.mjs';
import { fuse, wingLoft, tube, rod, cylinder, torus, wheel, propeller, radial, loft, superRing, panelQuad, clean } from './lib/ucak3d.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'library', 'havacilik');
const only = process.argv.slice(2);
const out = [];
const A = (id, name, tags, palette, roles, groups, view, extra = {}, size = 260) => {
  if (only.length && !only.includes(id)) return;
  const { facets, size: sz } = render(groups.map((g) => g.flat(Infinity).filter(Boolean)), view, size);
  out.push({ id, name, tags: [...tags, 'havacılık', '3d', '3 boyutlu', 'hacimli'], size: sz, palette, roles, facets, ...extra });
};
const T = (polys, t) => polys.map((p) => ({ ...p, P: p.P.map((q) => add(q, t)) }));
/** Dikey yüzey (gövdeye oturan kuyruk/fin): wingLoft'u x→y döndürür; (z0,y0) kök konumu */
const fin = (o, at) => xf(wingLoft({ u0: 0, u1: 1, capRoot: false, ...o }), { rz: 90, t: at });


/** Basit çizgi yazı tipi: gövdenin liman (−x) yüzüne yazı; z ekseni boyunca okunur. surf(z, y) → yüzeyin x'i */
const GL = { X: [[[0, 0], [1, 1.6]], [[0, 1.6], [1, 0]]], 1: [[[0.5, 0], [0.5, 1.6]], [[0.5, 1.6], [0.15, 1.28]]], '-': [[[0.1, 0.8], [0.9, 0.8]]], N: [[[0, 0], [0, 1.6]], [[0, 1.6], [1, 0]], [[1, 0], [1, 1.6]]], 2: [[[0, 1.6], [1, 1.6]], [[1, 1.6], [1, 0.8]], [[1, 0.8], [0, 0.8]], [[0, 0.8], [0, 0]], [[0, 0], [1, 0]]], 7: [[[0, 1.6], [1, 1.6]], [[1, 1.6], [0.3, 0]]], 8: [[[0, 0], [1, 0]], [[1, 0], [1, 1.6]], [[1, 1.6], [0, 1.6]], [[0, 1.6], [0, 0]], [[0, 0.8], [1, 0.8]]] };
function text(str, { z0, y0, h = 8, gap = 0.35, th = 0.16, x, key = 'k', side = -1 }) {
  const out = [];
  let cur = z0;
  const w = h / 1.6;
  for (const ch of str) {
    for (const [[ax, ay], [bx, by]] of GL[ch] || []) {
      const p = [cur + ax * w, y0 + ay * (h / 1.6)], q = [cur + bx * w, y0 + by * (h / 1.6)];
      const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d), nz = (-d[1] / L) * h * th * 0.5, ny = (d[0] / L) * h * th * 0.5;
      const xs = typeof x === 'function' ? x : () => x;
      out.push(poly([[xs(p[0], p[1]), p[1] + ny, p[0] + nz], [xs(q[0], q[1]), q[1] + ny, q[0] + nz], [xs(q[0], q[1]), q[1] - ny, q[0] - nz], [xs(p[0], p[1]), p[1] - ny, p[0] - nz]].map(([a, b, c]) => [a, b, c]), [side, 0, 0], key));
    }
    cur += w * (1 + gap);
  }
  return out;
}

const wire = (p, q, w = 1, key = 'k') => rod(p, q, w, key, { seg: 3 });

// ═══════════════════════════════════════════════════════════ WRIGHT FLYER (1903)
{
  const HS = 134, yU = 21, yL = -21, ch = 46, zLE = -24;
  const wo = (y) => ({ half: HS, chord: () => ch, le: () => zLE, y0: y, th: 0.03, camber: 0.075, cp: 5, n: 26, keys: ['a', 'f'], under: 'u', leKey: 'w' });
  const upper = wingLoft(wo(yU)), lower = wingLoft(wo(yL));
  const xs = Array.from({ length: 11 }, (_, k) => -125 + 25 * k);
  const struts = [-12, 12].flatMap((z) => xs.flatMap((x) => rod([x, yL, z], [x, yU, z], 2.6, 'w')));
  const wires = [-12, 12].flatMap((z) => xs.slice(0, -1).flatMap((x, k) => [wire([x, yL, z], [xs[k + 1], yU, z], 1.1), wire([xs[k + 1], yL, z], [x, yU, z], 1.1)]).flat());
  // ön yükseklik dümeni (iki kat) ve çerçevesi
  const eo = (y) => ({ half: 50, chord: () => 22, le: () => -122, y0: y, th: 0.03, camber: 0.06, cp: 5, n: 10, keys: ['a', 'f'], under: 'u', leKey: 'w' });
  const elev = [...wingLoft(eo(14)), ...wingLoft(eo(-14))];
  const exs = [-50, -25, 0, 25, 50];
  const estruts = [-116, -100].flatMap((z) => exs.flatMap((x) => rod([x, -14, z], [x, 14, z], 2, 'w')));
  const ewires = exs.slice(0, -1).flatMap((x, k) => [wire([x, -14, -116], [exs[k + 1], 14, -116], 0.9), wire([exs[k + 1], -14, -116], [x, 14, -116], 0.9)]);
  const outrig = [-10, 10].flatMap((x) => [...rod([x, yL, -14], [x, -14, -108], 2.2, 'w'), ...rod([x, yU, -14], [x, 14, -108], 2.2, 'w')]);
  // arka çift dümen ve çerçevesi
  const rudders = [-14, 14].flatMap((x) => xf(wingLoft({ half: 21, chord: () => 20, le: () => 0, th: 0.03, camber: 0, cp: 4, n: 5, keys: ['a', 'f'], under: 'u', leKey: 'w' }), { rz: 90, t: [x, 0, 78] }));
  const rframe = [-14, 14].flatMap((x) => [...rod([x, yU, 12], [x, 18, 82], 2.2, 'w'), ...rod([x, yL, 12], [x, -18, 82], 2.2, 'w'), ...rod([x, yL, 12], [x, 18, 82], 1.4, 'w')]);
  // pilot (yüzüstü), motor, yakıt, radyatör
  const pilot = [
    ...ball([-17, -17, 6], [6.4, 3.8, 12], 1, 'j', { seed: 3 }), ...ball([-17, -15.4, -9], [3.6, 3.6, 3.6], 1, 's', { seed: 4 }), ...ball([-17, -14.2, -9.4], [3.9, 2.4, 3.9], 1, 'p', { seed: 5 }),
    ...ball([-19.5, -18.6, 20], [2.6, 2.6, 7], 1, 'j', { seed: 6 }), ...ball([-14.5, -18.6, 20], [2.6, 2.6, 7], 1, 'j', { seed: 7 }),
    ...box([-17, -19.2, 6], [18, 1.4, 20], 'w'),
  ];
  const engine = [...box([12, -16, 6], [20, 7, 24], 'k'), ...[0, 1, 2, 3].flatMap((i) => cylinder([12, -12.4, -2.5 + i * 5.8], [12, -7, -2.5 + i * 5.8], 2.6, 2.3, 6, 'm')), ...box([12, -10.5, 6], [8, 2, 22], 'd')];
  const tank = [...box([4, 14, 4], [10, 5, 16], 'm'), ...rod([4, yU, 4], [4, 11, 4], 1.6, 'k')];
  const radiator = [...box([20, 0, 22], [2.4, 22, 11], 'm'), ...box([20, 0, 22], [3, 21, 5], 'd')];
  const chains = [-1, 1].flatMap((s) => [...tube([[12, -12, 16], [12 + s * 12, -6, 24], [s * 36, 0, 33]], 0.8, 3, 'k', { cap: 'none' }), ...tube([[12, -14, 12], [12 + s * 14, -8, 18], [s * 36, -3, 32]], 0.8, 3, 'k', { cap: 'none' })]);
  const shafts = [-1, 1].flatMap((s) => [...rod([s * 38, -3, 28], [s * 38, -3, 36], 2.4, 'm'), ...rod([s * 38, yL, 28], [s * 38, yU, 28], 1.6, 'w')]);
  const props = [-1, 1].flatMap((s) => propeller(27, 8.5, 2, 'r', { pos: [s * 38, -2, 37], phase: s > 0 ? 75 : 105, pitch: 30, hub: 3.4, hubKey: 'd', th: 2.6 }));
  // kızaklar
  const skids = [-34, 34].flatMap((x) => [
    ...tube([[x, -50, 46], [x, -50, 0], [x, -50, -60], [x, -47.5, -92], [x, -39, -114], [x, -31, -124]], 2, 5, 'w', { cap: 'none' }),
    ...rod([x, yL, -12], [x, -50, -12], 2.2, 'w'), ...rod([x, yL, 12], [x, -50, 12], 2.2, 'w'), ...rod([x, yL + 4, -80], [x, -47, -80], 2, 'w'),
  ]);
  const crossSk = [...rod([-34, -50, -12], [34, -50, -12], 1.8, 'w'), ...rod([-34, -50, 12], [34, -50, 12], 1.8, 'w'), ...rod([-34, -50, -80], [34, -50, -80], 1.6, 'w')];
  A('wright-flyer', 'Wright Flyer (1903)', ['uçak', 'wright', 'ilk uçuş', 'çift kanat', '1903', 'kitty hawk', 'kardeşler'],
    { a: '#efdfb6', f: '#e0c98f', u: '#c7ab72', w: '#a06c36', d: '#6a4424', k: '#2b2826', m: '#8e969e', r: '#cf9a5b', j: '#5d6f86', s: '#e6b48f', p: '#40495a' },
    { a: 'acik', f: 'ana', u: 'ikincil', w: 'koyu', d: 'koyu', k: 'koyu', m: 'detay', r: 'ikincil', j: 'vurgu', s: 'detay', p: 'koyu' },
    [[...skids, ...crossSk, ...lower, ...rframe, ...rudders, ...pilot, ...engine, ...radiator, ...chains, ...shafts, ...struts, ...wires, ...tank, ...outrig, ...elev, ...estruts, ...ewires, ...upper, ...props]],
    { yaw: 148, pitch: 22 }, {}, 270);
}

// ═══════════════════════════════════════════════════════════ BLÉRIOT XI
{
  const HW = 132;
  const cfn = (u) => (62 - 8 * Math.abs(u) ** 2) * (Math.abs(u) > 0.88 ? Math.sqrt(Math.max(0.2, 1 - ((Math.abs(u) - 0.88) / 0.12) ** 2)) : 1);
  const wo = { half: HW, chord: cfn, le: (u) => -24 - cfn(u) / 2 + 31, y0: 6, y: (u) => 3 * Math.abs(u), th: 0.06, camber: 0.075, cp: 5, n: 16, keys: ['a', 'f'], under: 'u', leKey: 'w', capRoot: false };
  const wR = wingLoft({ ...wo, u0: 0.1, u1: 1 }), wL = wingLoft({ ...wo, u0: -1, u1: -0.1 });
  // ön gövde (kumaş kutu) + motor
  const front = fuse([{ z: -46, rx: 8, ry: 9.5, cy: 0, n: 3 }, { z: -22, rx: 10.5, ry: 12.5, cy: 1, n: 3 }, { z: 12, rx: 10.5, ry: 12.5, cy: 1, n: 3 }, { z: 46, rx: 8, ry: 9.5, cy: 1, n: 3 }], 8, (i, j) => (j === 2 || j === 1 || j === 3 ? { c: 'a', b: i % 2 ? 0.03 : 0 } : 'f'));
  const crank = cylinder([0, 0, -62], [0, 0, -45], 8.5, 9.4, 10, 'k');
  const cyls = radial({ angles: [28, 90, 152], z: -54, rc: 4, len: 22, r: 4.4, key: 'k', fin: 'm', head: 'd', fins: 4 });
  const nose = ball([0, 0, -64], [5, 5, 3], 1, 'm', { seed: 2 });
  const propB = propeller(37, 11, 2, 'r', { pos: [0, 0, -67], phase: 14, pitch: 32, hub: 4.2, hubKey: 'd', th: 2.4 });
  // arka kafes gövde
  const z0 = 46, z1 = 246, hw0 = 8, hh0 = 9.5, hw1 = 1.6, hh1 = 2.4, cy0 = 1, cy1 = 3;
  const lerp = (a, b, t) => a + (b - a) * t;
  const cornersAt = (t) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [sx * lerp(hw0, hw1, t), lerp(cy0, cy1, t) + sy * lerp(hh0, hh1, t), lerp(z0, z1, t)]);
  const longerons = [0, 1, 2, 3].flatMap((c) => rod(cornersAt(0)[c], cornersAt(1)[c], 2.4, 'w'));
  const bays = 8;
  const rungs = Array.from({ length: bays }, (_, b) => cornersAt((b + 1) / bays)).flatMap((C, b) => [0, 1, 2, 3].flatMap((c) => rod(C[c], C[(c + 1) % 4], 1.7, 'w')));
  const diag = Array.from({ length: bays }, (_, b) => b).flatMap((b) => { const A0 = cornersAt(b / bays), A1 = cornersAt((b + 1) / bays); return b % 2 ? [wire(A0[0], A1[3], 0.9), wire(A0[1], A1[2], 0.9), wire(A0[3], A1[0], 0.7, 'k')] : [wire(A0[3], A1[0], 0.9), wire(A0[2], A1[1], 0.9), wire(A0[0], A1[3], 0.7, 'k')]; });
  // kuyruk takımı
  const tc = (u) => 28 * Math.sqrt(Math.max(0.04, 1 - u * u));
  const tailH = wingLoft({ half: 42, chord: tc, le: (u) => 234 - tc(u) / 2 + 12, y0: 4, th: 0.05, camber: 0, cp: 4, n: 10, keys: ['a', 'f'], under: 'u', leKey: 'w' });
  const rc = (u) => 30 * Math.sqrt(Math.max(0.05, 1 - (u * 0.9) ** 2));
  const rudder = fin({ half: 34, chord: rc, le: (u) => 242 - rc(u) / 2 + 6, th: 0.05, camber: 0, cp: 4, n: 8, keys: ['a', 'f'], under: 'u', leKey: 'w' }, [0, 5, 0]);
  const skid = [...rod([0, 4, 238], [0, -14, 250], 2, 'w'), ...wheel([0, -16, 252], 5, 1.4, { axis: [1, 0, 0], tire: 'k', cover: 'm', segR: 8 })];
  // pilot
  const pilot = [...ball([0, 22, 12], [9, 12, 7.4], 1, 'j', { seed: 2 }), ...ball([0, 39, 11], [4.8, 5.2, 4.8], 1, 's', { seed: 3 }), ...ball([0, 41.5, 11], [5.4, 3.3, 5.4], 1, 'p', { seed: 4 }), ...box([0, 38, 6.6], [8.6, 2.2, 1.2], 'k'), ...ball([-9.6, 17, 4], [2.6, 2.6, 7], 1, 'j', { seed: 5 }), ...ball([9.6, 17, 4], [2.6, 2.6, 7], 1, 'j', { seed: 6 })];
  const seatBox = box([0, 11, 12], [14, 3, 18], 'd');
  // direk (kabin) ve teller
  const mastTop = [0, 58, -8];
  const mast = [-9, 9].flatMap((x) => rod([x, 12, -8], mastTop, 2.4, 'w'));
  const keel = [0, -26, -8];
  const wx = [-118, -84, -48, 48, 84, 118];
  const upWires = wx.map((x) => wire(mastTop, [x, 9 + 3 * Math.abs(x / HW), -8], 1.1));
  const dnWires = wx.map((x) => wire(keel, [x, 3 + 3 * Math.abs(x / HW), -8], 1.1));
  const keelRod = [...rod([0, -12, -8], keel, 2, 'w')];
  // iniş takımı
  const wh = [-40, 40].flatMap((x) => wheel([x, -52, -26], 19, 3.2, { axis: [1, 0, 0], tire: 'k', rim: 'm', hub: 'd', spokes: 12, spoke: 'm', segR: 14 }));
  const gear = [-40, 40].flatMap((x) => [...rod([x * 0.28, -12, -34], [x, -52, -26], 2.6, 'w'), ...rod([x * 0.28, -12, -12], [x, -52, -26], 2.6, 'w'), ...rod([x * 0.5, -12, -23], [x, -44, -26], 1.6, 'k')]);
  const axle = rod([-40, -52, -26], [40, -52, -26], 2.4, 'm');
  A('tek-kanat-ucak', 'Blériot XI (tek kanat)', ['uçak', 'blériot', 'manş', 'tek kanat', '1909', 'erken uçak', 'anzani'],
    { a: '#f1e5c4', f: '#e1d0a2', u: '#c8b585', w: '#a2693a', k: '#2a2724', m: '#9aa3ad', d: '#4a4038', r: '#c98d52', j: '#7a4e32', s: '#e8b894', p: '#3d4656' },
    { a: 'acik', f: 'ana', u: 'ikincil', w: 'koyu', k: 'koyu', m: 'detay', d: 'koyu', r: 'ikincil', j: 'vurgu', s: 'detay', p: 'koyu' },
    [[...skid, ...tailH, ...rudder, ...longerons, ...rungs, ...diag, ...wL, ...seatBox, ...pilot, ...front, ...keelRod, ...dnWires, ...gear, ...axle, ...wh, ...crank, ...cyls, ...nose, ...propB, ...wR, ...mast, ...upWires]],
    { yaw: 148, pitch: 18 }, {}, 270);
}

// ═══════════════════════════════════════════════════════════ SPIRIT OF ST. LOUIS (1927)
{
  const HS = 142;
  const cs = (u) => (50 - 17 * Math.abs(u)) * (Math.abs(u) > 0.9 ? Math.sqrt(Math.max(0.2, 1 - ((Math.abs(u) - 0.9) / 0.1) ** 2)) : 1);
  const wo = { half: HS, chord: cs, le: (u) => -40 + 3 * Math.abs(u) ** 2 * 6, y0: 19.5, y: (u) => 3.5 * Math.abs(u), th: 0.125, camber: 0.05, cp: 5, n: 18, keys: ['a', 'f'], under: 'u', leKey: 'a', capRoot: false, ctrl: { from: 3, key: 'f', uMin: 0.5, uMax: 0.96, every: true }, rib: { every: 1, b: 0.012 } };
  const wR = wingLoft({ ...wo, u0: 0.06, u1: 1 }), wL = wingLoft({ ...wo, u0: -1, u1: -0.06 });
  const profile = [[-80, 13.6, 14, 0, 2.2], [-70, 14.4, 14.6, 0.4, 2.2], [-50, 14.6, 15.8, 1.4, 2.3], [-26, 14, 16.4, 2.2, 2.4], [-12, 13.4, 16.2, 2.3, 2.4], [6, 12.2, 15.4, 2.4, 2.5], [28, 10, 12.6, 2.4, 2.4], [56, 6.6, 8.6, 3, 2.3], [74, 3.4, 5.4, 3.6, 2.2], [88, 1.2, 2.6, 4.2, 2]];
  const winJ = (i, j) => i >= 3 && i <= 4 && (j === 0 || j === 1 || j === 6 || j === 7 || j === 13);
  const body = fuse(profile.map(([z, rx, ry, cy, n]) => ({ z, rx, ry, cy, n })), 14, (i, j) => (winJ(i, j) ? 'g' : { c: j > 8 ? 'f' : 'a', b: i % 2 ? 0.03 : -0.015 }), { cap: 'end' });
  const plug = cylinder([0, 0, -80], [0, 0, -76], 12.6, 12.6, 14, 'k');
  const cowl = fuse([{ z: -82, rx: 13.9, ry: 14.2, n: 2.1 }, { z: -78, rx: 14.1, ry: 14.4, n: 2.1 }], 14, 'm', { cap: 'none' });
  const crank = cylinder([0, 0, -92], [0, 0, -78], 5.6, 6.4, 10, 'k');
  const cyl9 = radial({ n: 9, z: -84, rc: 5, len: 10, r: 3.5, key: 'k', fin: 'm', head: 'd', fins: 2 });
  const spin = fuse([{ z: -92, rx: 0.6, ry: 0.6 }, { z: -97, rx: 3.4, ry: 3.4 }, { z: -100, rx: 5.6, ry: 5.6 }, { z: -102, rx: 5.4, ry: 5.4 }, { z: -104, rx: 3.5, ry: 3.5 }, { z: -106, rx: 0.6, ry: 0.6 }].reverse(), 10, 'm', { cap: 'both' });
  const prop = propeller(28, 6.4, 2, 'm', { pos: [0, 0, -99], phase: 16, pitch: 30, hub: 5, th: 1.6, tip: 'f' });
  const winSide = [-1, 1].flatMap((s) => [
    poly([[s * 11.7, 6, -12], [s * 11.7, 6, 8], [s * 11.2, 14.5, 8], [s * 11.2, 14.5, -9]], [s, 0, 0], 'g'),
    poly([[s * 11.3, 14.8, -9], [s * 11.3, 14.8, 8], [s * 9.4, 17.2, 7], [s * 9.4, 17.2, -6]], [s * 0.7, 0.7, 0], 'g'),
  ]);
  const periscope = [...rod([-10.4, 12, -34], [-12.6, 25, -34], 2.2, 'k'), ...rod([-12.6, 25, -34], [-12.6, 25, -30], 2.2, 'k')];
  const prAt = (z) => { for (let i = 0; i < profile.length - 1; i++) if (z >= profile[i][0] && z <= profile[i + 1][0]) { const t = (z - profile[i][0]) / (profile[i + 1][0] - profile[i][0]); return profile[i].map((v, k) => v + (profile[i + 1][k] - v) * t); } return profile[profile.length - 1]; };
  const letters = text('NX-211', { z0: 22, y0: -1.5, h: 7.4, th: 0.18, x: (z, y) => { const [, rx, ry, cy, n] = prAt(z); return -(rx * Math.max(0.2, 1 - Math.abs((y - cy) / ry) ** n) ** (1 / n) + 0.5); }, key: 'k' });
  const headrest = box([0, 20, 18], [12, 2, 12], 'f');
  // kanat payandaları
  const sx = 80;
  const struts = [-1, 1].flatMap((s) => [
    ...rod([s * 11, -13, -30], [s * sx, 15.8, -20], 3.2, 'd'), ...rod([s * 11, -13, -4], [s * sx, 15.8, -2], 3.2, 'd'),
    ...wire([s * 11, 14, -34], [s * 118, 21, -26], 1.2, 'd'), ...wire([s * 11, -11, -16], [s * 118, 18.8, -14], 1.2, 'd'),
  ]);
  // kuyruk
  const stabO = { half: 46, chord: (u) => 30 - 12 * Math.abs(u), le: (u) => 52 + 10 * Math.abs(u), y0: 7, th: 0.09, camber: 0, cp: 4, n: 10, keys: ['a'], under: 'u', capRoot: false, ctrl: { from: 2, key: 'f', every: true } };
  const stabR = wingLoft({ ...stabO, u0: 0.08, u1: 1 }), stabL = wingLoft({ ...stabO, u0: -1, u1: -0.08 });
  const rudder = fin({ half: 46, chord: (u) => 36 - 18 * u, le: (u) => 52 + 22 * u, th: 0.1, camber: 0, cp: 4, n: 8, keys: ['a'], under: 'u', leKey: 'a', ctrl: { from: 2, key: 'f', every: true } }, [0, 6, 0]);
  const tailStays = [-1, 1].flatMap((s) => [wire([s * 44, 6, 66], [s * 6, -2, 68], 1, 'd')]);
  const skid = [...rod([0, 4, 86], [0, -8, 92], 2.2, 'k'), ...wheel([0, -10, 94], 4.5, 1.3, { axis: [1, 0, 0], tire: 'k', cover: 'm', segR: 8 })];
  // iniş takımı
  const ax = 38, ay = -41, az = -20;
  const gear = [-1, 1].flatMap((s) => [
    ...rod([s * 9, -13, -30], [s * ax, ay, az], 3.2, 'd'), ...rod([s * 9, -13, -8], [s * ax, ay, az], 3.2, 'd'), ...rod([s * 20, -20, -19], [s * (ax - 4), ay + 8, az], 2, 'k'),
    ...wheel([s * ax, ay, az], 19, 4.2, { axis: [1, 0, 0], tire: 'k', rim: 'm', hub: 'm', cover: 'c', segR: 16 }),
  ]);
  const axle = rod([-ax, ay, az], [ax, ay, az], 2.4, 'm');
  A('spirit-of-st-louis', 'Spirit of St. Louis (1927)', ['uçak', 'lindbergh', 'atlantik', 'tek kanat', '1927', 'new york paris', 'gümüş', 'ryan'],
    { a: '#a9b8cf', f: '#8c9db8', u: '#6c7e9a', k: '#222836', m: '#cdd7e6', g: '#2f4766', d: '#3d4a62', c: '#eef2f8' },
    { a: 'acik', f: 'ana', u: 'ikincil', k: 'koyu', m: 'detay', g: 'cam', d: 'koyu', c: 'acik' },
    [[...skid, ...tailStays, ...stabL, ...rudder, ...body, ...headrest, ...periscope, ...gear, ...axle, ...wL, ...plug, ...cowl, ...crank, ...cyl9, ...struts, ...stabR, ...wR, ...spin, ...prop], letters],
    { yaw: 150, pitch: 18 }, {}, 270);
}

// ═══════════════════════════════════════════════════════════ HEINKEL He 178 (1939)
{
  const HS = 132;
  const cj = (u) => (66 - 26 * Math.abs(u)) * (Math.abs(u) > 0.9 ? Math.sqrt(Math.max(0.2, 1 - ((Math.abs(u) - 0.9) / 0.1) ** 2)) : 1);
  const wo = { half: HS, chord: cj, le: (u) => -46 + 22 * Math.abs(u) ** 1.4, y0: 11, y: (u) => 3 * Math.abs(u), th: 0.115, camber: 0.02, cp: 5, n: 14, keys: ['a', 'f'], under: 'u', leKey: 'a', capRoot: false, ctrl: { from: 3, key: 'f', uMin: 0.3, uMax: 0.95, every: true }, rib: { every: 1, b: 0.012 } };
  const wR = wingLoft({ ...wo, u0: 0.1, u1: 1 }), wL = wingLoft({ ...wo, u0: -1, u1: -0.1 });
  const prof = [[-124, 11, 0], [-116, 14.5, 0], [-102, 18.5, 0.2], [-80, 21.5, 0.6], [-50, 22.8, 1], [-10, 22.8, 1], [30, 21, 1.2], [70, 17, 1.6], [104, 11.6, 2.2], [126, 8, 2.6], [134, 6.6, 2.8]];
  const bandK = (i) => (i === 0 ? 'm' : i === 1 ? 'r' : i === 2 ? 'r' : 'a');
  const body = fuse(prof.map(([z, r, cy]) => ({ z, rx: r, ry: r * 0.98, cy, n: 2 })), 16, (i, j) => ({ c: i <= 2 ? bandK(i) : j > 11 || j < 3 ? 'f' : 'a', b: i % 2 ? 0.025 : -0.015 }), { cap: 'end' });
  const mouth = fuse([{ z: -124, rx: 10.4, ry: 10.4 }, { z: -118, rx: 10.4, ry: 10.4 }], 16, 'k', { cap: 'start', capKey: 'k' });
  const cone = fuse([{ z: -100, rx: 0.6, ry: 0.6 }, { z: -110, rx: 3.6, ry: 3.6 }, { z: -118, rx: 6.2, ry: 6.2 }, { z: -126, rx: 7.2, ry: 7.2 }], 12, (i) => (i < 2 ? 'm' : 'd'), { cap: 'none' });
  const canopy = fuse([{ z: -64, rx: 1.2, ry: 1.2, cy: 23 }, { z: -56, rx: 9.5, ry: 6.5, cy: 25 }, { z: -34, rx: 11.4, ry: 8.4, cy: 25 }, { z: -10, rx: 9.8, ry: 6.4, cy: 24 }, { z: 6, rx: 1.4, ry: 1.2, cy: 22.6 }], 12, (i, j) => (j > 6 ? 'f' : 'g'), { cap: 'none' });
  const canopyFrame = [-60, -46, -32, -18].flatMap((z) => tube([[-10, 22, z], [-8.6, 28, z], [0, 32, z], [8.6, 28, z], [10, 22, z]], 0.55, 3, 'k', { cap: 'none' }));
  const tailO = { half: 44, chord: (u) => 34 - 14 * Math.abs(u), le: (u) => 92 + 20 * Math.abs(u), y0: 4, th: 0.09, camber: 0, cp: 4, n: 10, keys: ['a'], under: 'u', capRoot: false, ctrl: { from: 2, key: 'f', every: true } };
  const stabR = wingLoft({ ...tailO, u0: 0.1, u1: 1 }), stabL = wingLoft({ ...tailO, u0: -1, u1: -0.1 });
  const fin_ = fin({ half: 50, chord: (u) => 52 - 28 * u, le: (u) => 80 + 30 * u, th: 0.1, camber: 0, cp: 4, n: 9, keys: ['a'], under: 'u', leKey: 'a', ctrl: { from: 2, key: 'f', every: true } }, [0, 9, 0]);
  const pipe = [...fuse([{ z: 131, rx: 7, ry: 7, cy: 2.8 }, { z: 138, rx: 6.2, ry: 6.2, cy: 2.8 }, { z: 144, rx: 5.6, ry: 5.6, cy: 2.8 }], 14, 'm', { cap: 'none' }), ...cylinder([0, 2.8, 144], [0, 2.8, 144.4], 5.2, 4.8, 14, 'e')];
  // iniş takımı
  const gearX = 30, gy = -36, gz = -14;
  const gear = [-1, 1].flatMap((s) => [
    ...rod([s * 22, 4, -22], [s * gearX, gy, gz], 3.4, 'm'), ...rod([s * 14, -6, -4], [s * gearX, gy + 6, gz], 2.2, 'k'),
    ...wheel([s * gearX, gy, gz], 14, 3.4, { axis: [1, 0, 0], tire: 'k', rim: 'm', hub: 'm', cover: 'd', segR: 12 }),
  ]);
  const tailWheel = [...rod([0, -2, 102], [0, -14, 112], 2.4, 'm'), ...wheel([0, -17, 114], 5.5, 1.6, { axis: [1, 0, 0], tire: 'k', cover: 'm', segR: 8 })];
  const jr = (z) => { for (let i = 0; i < prof.length - 1; i++) if (z >= prof[i][0] && z <= prof[i + 1][0]) { const t = (z - prof[i][0]) / (prof[i + 1][0] - prof[i][0]); return [prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t, prof[i][2] + (prof[i + 1][2] - prof[i][2]) * t]; } return [10, 0]; };
  const letters = text('178', { z0: 30, y0: -2, h: 9, th: 0.17, x: (z, y) => { const [r, cy] = jr(z); return -(Math.sqrt(Math.max(1, r * r - (y - cy) ** 2)) + 0.5); }, key: 'k' });
  A('jet-ucagi', 'Jet Uçağı (Heinkel He 178, 1939)', ['jet', 'uçak', 'heinkel', 'türbin', '1939', 'erken jet', 'he 178', 'ilk jet'],
    { a: '#9fb3cf', f: '#8197b6', u: '#5d7191', k: '#1f2533', m: '#c3cfe0', r: '#e04b63', g: '#8ec5ec', e: '#ff9a3b', d: '#46546d' },
    { a: 'acik', f: 'ana', u: 'ikincil', k: 'koyu', m: 'detay', r: 'vurgu', g: 'cam', e: 'vurgu', d: 'koyu' },
    [[...tailWheel, ...stabL, ...fin_, ...pipe, ...body, ...mouth, ...cone, ...gear, ...wL, ...canopy, ...canopyFrame, ...stabR, ...wR], letters],
    { yaw: 150, pitch: 17 }, {}, 270);
}

// ═══════════════════════════════════════════════════════════ BELL X-1
{
  const stn = [[-140, 0.6], [-134, 4.5], [-122, 9], [-105, 13], [-85, 15.8], [-55, 17], [-40, 17], [-20, 17], [-6, 17], [40, 17], [75, 15.6], [110, 12.4], [138, 10.6]];
  const bodyK = (i, j) => (i <= 0 ? 'm' : i === 7 || i === 1 ? 'u' : { c: j > 12 || j < 4 ? 'f' : 'a', b: i % 2 ? 0.035 : -0.02 });
  const body = fuse(stn.map(([z, r]) => ({ z, rx: r, ry: r * 0.97, n: 2 })), 16, bodyK, {});
  const tip = cylinder([0, 0, -150], [0, 0, -138], 0.5, 2.2, 6, 'm');
  const boom = tube([[0, 0, -176], [0, 0, -138]], [0.5, 1.1], 5, 'm', { cap: 'none' });
  const canopy = [
    ...fuse([{ z: -88, rx: 1, ry: 1, cy: 15 }, { z: -78, rx: 7.2, ry: 7, cy: 16.6 }, { z: -62, rx: 8.4, ry: 7.6, cy: 16.4 }, { z: -48, rx: 7.4, ry: 6.4, cy: 15.8 }, { z: -38, rx: 1, ry: 1, cy: 14 }], 10, (i, j) => (j > 5 ? 'k' : 'g')),
  ];
  const ribs = [-78, -68, -58, -48].flatMap((z, k) => tube([[-7, 12, z], [-5.4, 20, z], [0, 24, z], [5.4, 20, z], [7, 12, z]], 0.5, 3, 'k', { cap: 'none' }));
  const wingO = { half: 124, chord: (u) => (60 - 26 * Math.abs(u)) * (Math.abs(u) > 0.9 ? Math.sqrt(Math.max(0.15, 1 - ((Math.abs(u) - 0.9) / 0.1) ** 2)) : 1), le: (u) => -15 - 0.25 * (60 - 26 * Math.abs(u)), th: 0.075, camber: 0, cp: 3, n: 12, keys: ['o', 'a'], under: 'f', leKey: 'o', ctrl: { from: 2, key: 'a', uMin: 0.45, uMax: 0.97, every: true } };
  const wR = wingLoft({ ...wingO, u0: 0.12, u1: 1, capRoot: false });
  const wL = wingLoft({ ...wingO, u0: -1, u1: -0.12, capTip: true, capRoot: false });
  const tailO = { half: 44, chord: (u) => (30 - 12 * Math.abs(u)) * (Math.abs(u) > 0.9 ? 0.6 : 1), le: (u) => 106 + 8 * Math.abs(u), th: 0.06, camber: 0, cp: 3, n: 8, keys: ['o'], under: 'f', ctrl: { from: 2, key: 'a', every: true } };
  const stabR = wingLoft({ ...tailO, y0: 14, u0: 0.12, u1: 1, capRoot: false });
  const stabL = wingLoft({ ...tailO, y0: 14, u0: -1, u1: -0.12, capRoot: false });
  const rudder = fin({ half: 42, chord: (u) => 38 - 18 * u, le: (u) => 100 + 24 * u, th: 0.07, cp: 3, n: 6, keys: ['o'], under: 'f', ctrl: { from: 2, key: 'a', every: true } }, [0, 9, 0]);
  const nozz = [[-5.6, 5.6], [5.6, 5.6], [-5.6, -5.6], [5.6, -5.6]].flatMap(([x, y]) => [
    ...tube([[x, y, 136], [x, y, 146], [x, y, 156]], [3.6, 4.5, 5.2], 8, (i) => (i ? 'k' : 'm'), { cap: 'none' }),
    ...cylinder([x, y, 156], [x, y, 156.4], 4.2, 3.8, 8, 'e', { cap: 'end' }),
  ]);
  const ring = fuse([{ z: 138, rx: 11.2, ry: 11, n: 2 }, { z: 143, rx: 11.6, ry: 11.4, n: 2 }], 16, 'k', { cap: 'end' });
  const rAt = (z) => { for (let i = 0; i < stn.length - 1; i++) if (z >= stn[i][0] && z <= stn[i + 1][0]) return stn[i][1] + ((stn[i + 1][1] - stn[i][1]) * (z - stn[i][0])) / (stn[i + 1][0] - stn[i][0]); return 10; };
  const letters = text('X-1', { z0: 46, y0: -4.5, h: 9, x: (z, y) => -(Math.sqrt(Math.max(1, rAt(z) ** 2 - y * y)) + 0.45), key: 'k' });
  A('bell-x1', 'Bell X-1 (roket uçak)', ['x-1', 'yeager', 'ses duvarı', 'roket uçak', '1947', 'turuncu', 'uçak'],
    { a: '#f59a3c', o: '#e87818', f: '#d9701a', u: '#b8581a', k: '#2c2622', g: '#a9d8f5', e: '#ffcf5a', m: '#aab2bd', w: '#ffffff' },
    { a: 'ana', o: 'ana', f: 'ikincil', u: 'koyu', k: 'koyu', g: 'cam', e: 'vurgu', m: 'detay', w: 'acik' },
    [[...stabL, ...wL, ...rudder, ...body, ...tip, ...boom, ...canopy, ...ribs, ...nozz, ...ring, ...stabR, ...wR], letters], { yaw: 150, pitch: 16 }, {}, 260);
}

// ─────────────────────────────────────────────────────────── yaz
fs.mkdirSync(DIR, { recursive: true });
for (const a of out) {
  fs.writeFileSync(path.join(DIR, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
  console.log(a.id.padEnd(22), a.facets.length, 'yüz', a.size.join('x'));
}
