// Uçak modelleri için gelişmiş 3B poligon-ağı araçları (mesh3d.mjs üzerine):
//   loft (halka dizisinden yüzey) · fuse (süper-elips kesitli gövde) · wingLoft (profilli, konik, süpürmeli kanat)
//   tube (yol boyunca boru/tel) · torus (lastik) · wheel (telli tekerlek) · propeller (burgulu kanatlı) · cylinder · radial (yıldız motor)
// Koordinat: x = kanat açıklığı, y = yukarı, z = gövde ekseni (burun −z, kuyruk +z).
import { add, sub, mul, dot, cross, norm, poly, D } from './mesh3d.mjs';

const cent = (P) => P.reduce((s, p) => add(s, p), [0, 0, 0]).map((v) => v / P.length);
const same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-3;

/** Newell normali (köşe sırasına göre) */
function newell(P) {
  let n = [0, 0, 0];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return n;
}
const dedupe = (P) => P.filter((p, i) => !same(p, P[(i + 1) % P.length]));
/** İç noktadan dışarı bakan normalli çokgen (yozlaşmışsa null) */
function opoly(P, key, inside, extra) {
  P = dedupe(P);
  if (P.length < 3) return null;
  let n = newell(P);
  if (Math.hypot(...n) < 1e-6) return null;
  if (dot(n, sub(cent(P), inside)) < 0) n = mul(n, -1);
  return poly(P, n, key, extra);
}
const clean = (a) => a.filter(Boolean);

/**
 * Halka dizisinden yüzey. rings: eşit noktalı kapalı halkalar. key(i,j) → anahtar ya da {c, b}.
 * o.cap: 'start' | 'end' | 'both' — uçları kapat.
 */
function loft(rings, key, o = {}) {
  const k = typeof key === 'function' ? key : () => key;
  const m = rings[0].length;
  const out = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const inside = mul(add(cent(rings[i]), cent(rings[i + 1])), 0.5);
    for (let j = 0; j < m; j++) {
      const j2 = (j + 1) % m;
      const kk = k(i, j);
      const c = typeof kk === 'object' ? kk.c : kk;
      const ex = typeof kk === 'object' && kk.b ? { b: kk.b } : undefined;
      out.push(opoly([rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]], c, inside, ex));
    }
  }
  const capK = o.capKey || k(0, 0);
  const ck = typeof capK === 'object' ? capK.c : capK;
  if (o.cap === 'start' || o.cap === 'both') out.push(opoly(rings[0], o.capStartKey || ck, cent(rings[1])));
  if (o.cap === 'end' || o.cap === 'both') { const L = rings.length; out.push(opoly(rings[L - 1], o.capEndKey || ck, cent(rings[L - 2]))); }
  return clean(out);
}

/** Süper-elips halka: n=2 elips, n>2 kutuya yakın */
const superRing = (rx, ry, n, seg, cx = 0, cy = 0, z = 0) => Array.from({ length: seg }, (_, i) => {
  const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
  return [cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n), cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n), z];
});

/**
 * Gövde: istasyon listesi [{z, rx, ry, cy, cx, n}] (burundan kuyruğa). key(i,j,seg) → anahtar.
 * Halka noktası 0 = +x yönü, saat yönünün tersine (üstte seg/4).
 */
function fuse(stations, seg, key, o = {}) {
  const rings = stations.map((s) => superRing(Math.max(s.rx, 0.01), Math.max(s.ry, 0.01), s.n ?? 2.4, seg, s.cx ?? 0, s.cy ?? 0, s.z));
  return loft(rings, key, { cap: o.cap ?? 'both', ...o });
}

/** NAKA benzeri profil: xc∈[0,1] → [üst y, alt y] (akor birimi) */
function foilAt(xc, th, camber) {
  const t = 5 * th * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1015 * xc ** 4);
  const yc = camber * 4 * xc * (1 - xc) * (1 - 0.35 * xc);
  return [yc + t, yc - t];
}

/**
 * Kanat: açıklık boyunca tek parça yüzey (u∈[-1,1]).
 * half: yarı açıklık · chord(u) · le(u): ön kenarın z'si · y(u): dihedral/yükseklik · twist(u) derece
 * th: kalınlık oranı · camber · cp: yüzey başına akor noktası · n: açıklık dilimi
 * keys: üst yüz kumaş anahtarları (açıklık dilimine göre döner) · under · leKey (ön kenar şeridi)
 * x0: merkez · y0 · z0 ofsetler
 */
function wingLoft({ u0 = -1, u1 = 1, capRoot = true, capTip = true, half, chord, le = () => 0, y = () => 0, twist = () => 0, th = 0.1, camber = 0.04, cp = 4, n = 14, keys = ['a'], under = 'u', leKey, x0 = 0, y0 = 0, z0 = 0, endCaps = true, rib, ctrl }) {
  const rings = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const c = chord(u), zle = le(u) + z0, yy = y(u) + y0, tw = twist(u) * D;
    const ring = [];
    const xs = Array.from({ length: cp + 1 }, (_, q) => (1 - Math.cos((q / cp) * Math.PI)) / 2);
    const P = (xc, yv) => {
      const dz = (xc - 0.25) * c, dy = yv * c;
      return [x0 + u * half, yy + dy * Math.cos(tw) + dz * Math.sin(tw), zle + 0.25 * c + dz * Math.cos(tw) - dy * Math.sin(tw)];
    };
    for (let q = 0; q <= cp; q++) ring.push(P(xs[q], foilAt(xs[q], th, camber)[0]));
    for (let q = cp - 1; q >= 1; q--) ring.push(P(xs[q], foilAt(xs[q], th, camber)[1]));
    rings.push(ring);
  }
  const m = rings[0].length;
  const kf = (i, j) => {
    const top = j < cp;
    if (top) {
      const base = keys[i % keys.length];
      if (leKey && j === 0) return leKey;
      if (ctrl && j >= ctrl.from) { const uu = Math.abs(u0 + ((u1 - u0) * (i + 0.5)) / n); if (uu >= (ctrl.uMin ?? 0) && uu <= (ctrl.uMax ?? 1)) return { c: ctrl.key, b: ctrl.every ? (i % 2 ? 0.02 : -0.02) : 0 }; }
      return rib && i % rib.every === 0 ? { c: base, b: rib.b } : base;
    }
    return under;
  };
  const surf = loft(rings, kf);
  if (!endCaps) return surf;
  const capK = typeof under === 'string' ? under : 'u';
  const L = rings.length;
  return [...surf, capRoot ? opoly(rings[0], capK, cent(rings[1])) : null, capTip ? opoly(rings[L - 1], capK, cent(rings[L - 2])) : null].filter(Boolean);
}

/** Yol boyunca boru. path: noktalar, radii: yarıçaplar (tek sayı olabilir), seg: kenar sayısı */
function tube(path, radii, seg, key, o = {}) {
  const R = (i) => (Array.isArray(radii) ? radii[i] : radii);
  const rings = path.map((p, i) => {
    const d = norm(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
    const up = Math.abs(d[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    const u = norm(cross(d, up)), v = norm(cross(d, u));
    return Array.from({ length: seg }, (_, k) => {
      const a = (k / seg) * Math.PI * 2 + (o.phase || 0);
      return add(p, add(mul(u, Math.cos(a) * R(i)), mul(v, Math.sin(a) * R(i))));
    });
  });
  return loft(rings, key, { cap: o.cap ?? 'both' });
}
const rod = (p, q, w, key, o = {}) => tube([p, q], w / 2, o.seg || 4, key, { cap: o.cap ?? 'none', phase: Math.PI / 4 });

/** Silindir (iki uç noktası, yarıçaplar, kenar sayısı) */
const cylinder = (p, q, r0, r1, seg, key, o = {}) => tube([p, q], [r0, r1], seg, key, { cap: o.cap ?? 'both' });

/** Lastik (simit): merkez, eksen yönü, büyük yarıçap R, kesit yarıçapı r */
function torus(c, axis, R, r, segR, segr, key) {
  const a = norm(axis);
  const up = Math.abs(a[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(a, up)), v = norm(cross(a, u));
  const rings = [];
  for (let k = 0; k <= segR; k++) {
    const ph = (k / segR) * Math.PI * 2;
    const rad = add(mul(u, Math.cos(ph)), mul(v, Math.sin(ph)));
    const cp = add(c, mul(rad, R));
    rings.push(Array.from({ length: segr }, (_, q) => {
      const ps = (q / segr) * Math.PI * 2;
      return add(cp, add(mul(rad, Math.cos(ps) * r), mul(a, Math.sin(ps) * r)));
    }));
  }
  const out = [];
  for (let i = 0; i < segR; i++) {
    const inside = cent(rings[i]);
    for (let j = 0; j < segr; j++) {
      const j2 = (j + 1) % segr;
      out.push(opoly([rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]], typeof key === 'function' ? key(i, j) : key, add(mul(inside, 0.5), mul(cent(rings[i + 1]), 0.5))));
    }
  }
  return clean(out);
}

/** Telli tekerlek: eksen yönü a (varsayılan x), lastik + jant + göbek + teller */
function wheel(c, R, r, { axis = [1, 0, 0], tire = 'k', rim = 'm', hub = 'm', spokes = 10, spoke = 'm', segR = 14, cover } = {}) {
  const a = norm(axis);
  const up = Math.abs(a[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(a, up)), v = norm(cross(a, u));
  const at = (rad, ph, off = 0) => add(c, add(add(mul(u, Math.cos(ph) * rad), mul(v, Math.sin(ph) * rad)), mul(a, off)));
  const out = [...torus(c, a, R - r, r, segR, 6, (i, j) => (j % 2 ? tire : rim === tire ? tire : tire))];
  out.push(...cylinder(add(c, mul(a, -r * 0.7)), add(c, mul(a, r * 0.7)), R * 0.16, R * 0.16, 8, hub));
  out.push(...tube([add(c, mul(a, -r * 0.9)), add(c, mul(a, r * 0.9))], R * 0.07, 6, rim, { cap: 'both' }));
  for (let s = 0; s < (cover ? 0 : spokes); s++) {
    const ph = (s / spokes) * Math.PI * 2;
    out.push(...tube([at(R * 0.16, ph, 0), at(R - r * 1.2, ph, 0)], r * 0.16, 3, spoke, { cap: 'none' }));
  }
  if (cover) out.push(...cylinder(add(c, mul(a, -r * 0.55)), add(c, mul(a, r * 0.55)), R - r * 1.1, R - r * 1.1, segR, cover));
  return out;
}

/** Pervane: z ekseni, iki/üç kanat. R yarıçap, w maks. genişlik, pitch burgu (derece), hub göbek yarıçapı */
function propeller(R, w, blades, key, { pos = [0, 0, 0], phase = 0, pitch = 28, hub = 5, hubKey, tip, th = 1.8 } = {}) {
  const out = [];
  for (let b = 0; b < blades; b++) {
    const ang = phase + (b * 360) / blades;
    const rings = [];
    const N = 5;
    for (let i = 0; i <= N; i++) {
      const t = i / N, r = hub + (R - hub) * t;
      const cw = w * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.9))) * (t > 0.9 ? 0.75 : 1);
      const tw = (pitch * (1 - 0.65 * t)) * D;
      const hw = cw / 2;
      const sec = [[-hw, th * 0.1], [0, th * 0.55], [hw, -th * 0.1], [0, -th * 0.55]].map(([px, pz]) => {
        const x = px * Math.cos(tw) - pz * Math.sin(tw), zz = px * Math.sin(tw) + pz * Math.cos(tw);
        return [x, r, zz];
      });
      rings.push(sec);
    }
    const blade = loft(rings, (i) => (tip && i === N - 1 ? tip : key), { cap: 'end' });
    out.push(...blade.map((p) => ({ ...p, P: p.P.map(([x, y, z]) => rotZ3([x, y, z], ang * D)), n: rotZ3(p.n, ang * D) })));
  }
  if (hubKey) out.push(...cylinder([0, 0, -2.4], [0, 0, 2.4], hub, hub * 0.8, 8, hubKey));
  return out.map((p) => ({ ...p, P: p.P.map((q) => add(q, pos)) }));
}
const rotZ3 = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

/** Yıldız motor: z ekseninde, silindirler dışa doğru. */
function radial({ n = 9, z = 0, rc = 14, len = 18, r = 5, key = 'k', fin = 'm', head = 'd', fins = 3, angles }) {
  const out = [];
  const N = angles ? angles.length : n;
  for (let i = 0; i < N; i++) {
    const a = angles ? angles[i] * D : ((i + 0.5) / n) * Math.PI * 2;
    const dir = [Math.cos(a), Math.sin(a), 0];
    const path = [], radii = [];
    path.push(mul(dir, rc), mul(dir, rc + 3));
    radii.push(r * 0.85, r * 0.85);
    for (let f = 0; f < fins; f++) {
      const d0 = rc + 3 + ((len - 8) * (f + 0.5)) / fins;
      path.push(mul(dir, d0 - 1.2), mul(dir, d0 + 1.2));
      radii.push(r * 1.28, r * 1.28);
      path.push(mul(dir, d0 + 1.4));
      radii.push(r * 0.92);
    }
    path.push(mul(dir, rc + len - 3), mul(dir, rc + len));
    radii.push(r * 1.05, r * 0.75);
    out.push(...tube(path.map((p) => [p[0], p[1], p[2] + z]), radii, 6, (i2, j) => (i2 % 3 === 0 ? fin : key), { cap: 'end' }));
    // valf kapağı
    out.push(...tube([add(mul(dir, rc + len - 1), [0, 0, z - r * 0.3]), add(mul(dir, rc + len - 1), [0, 0, z + r * 0.3])], r * 0.55, 5, head, { cap: 'both' }));
  }
  return out;
}

/** Gezegen/gövde için basit düz kutu-kiriş: iki nokta arası şerit panel (kumaş) */
function panelQuad(a, b, c, d, key, o = {}) {
  const n = newell([a, b, c, d]);
  return poly([a, b, c, d], n, key, { two: true, ...o });
}

export { cent, newell, opoly, loft, superRing, fuse, wingLoft, foilAt, tube, rod, cylinder, torus, wheel, propeller, radial, panelQuad, clean };
