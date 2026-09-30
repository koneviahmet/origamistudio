// Çizim / boya stili: el çizimi mürekkep kontur + pastel boya dolgu.
//
// Görünme (fold) iki aşamadır:
//   1) Kontur: tüm varlığın dış hatları kalemle çiziliyormuş gibi uzar (0 → ~0.55)
//   2) Boya  : her renk bölgesi çapraz bir silmeyle, tarama vuruşlarıyla boyanır (~0.35 → 1)
//
// Aynı renk + parçadaki facet'ler tek bir "bölge" sayılır (kağıt kesmedeki tabaka gibi).
// Konturlar bölgelerin birleşik sınırından çıkarılır: bölge içindeki ortak kenarlar ve
// üstteki bölgelerin örttüğü kenarlar atlanır. Tüm rastgelelik tohumludur (deterministik).
//
// opts.sketch (katman ya da sahne "sketch" alanı):
//   { ink: "#2d3561", width: 3.2, wobble: 1.3, hatch: 5, angle: 62, cross: true,
//     wipe: 35, grain: 0.35, outline: true, split: 0.55 }
// Kalınlık / titreme / tarama aralığı sahne pikseli cinsindendir; opts.lineScale
// (sahne px → varlık birimi) ile çevrilir, böylece büyük ve küçük varlıklar aynı kalemle çizilir.
import { shade, lerpColor } from './color.js';
import { ease } from './easing.js';
import { makeCanvas } from './texture.js';
import { facetBase, partMatrices, pointInPolygon } from './origami.js';

export const SKETCH_DEFAULTS = {
  ink: '#2d3561',
  width: 3.2,
  wobble: 1.3,
  hatch: 5,
  angle: 62,
  cross: true,
  wipe: 35,
  grain: 0.35,
  outline: true,
  split: 0.55,
};

const PAPER = '#fbf6ea';
const DEG = Math.PI / 180;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const prepCache = new WeakMap();

function hash(a, b = 0) {
  let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function signedArea(p) {
  let a = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]);
  return a / 2;
}

/** Çokgenin ağırlık merkezine doğru hafifçe küçültülmüş kopyası (yalnız komşu kenarlar örtüşme sayılmasın) */
function shrink(p, k = 0.03) {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of p) (cx += x), (cy += y);
  cx /= p.length;
  cy /= p.length;
  return p.map(([x, y]) => [x + (cx - x) * k, y + (cy - y) * k]);
}

function segCross(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a);
  const d2 = o(c, d, b);
  const d3 = o(a, b, c);
  const d4 = o(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** İki facet pozitif alanla örtüşüyor mu? (yalnızca kenar paylaşmak örtüşme değildir) */
function polysOverlap(A, B) {
  if (A.bb[2] <= B.bb[0] || B.bb[2] <= A.bb[0] || A.bb[3] <= B.bb[1] || B.bb[3] <= A.bb[1]) return false;
  const a = shrink(A.p);
  const b = shrink(B.p);
  if (a.some(([x, y]) => pointInPolygon(x, y, b)) || b.some(([x, y]) => pointInPolygon(x, y, a))) return true;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (segCross(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return false;
}

// --------------------------------------------------------------- hazırlık (önbellekli)

/** Bölgeler, kontur çoklu çizgileri ve toplam uzunluk. Geometri değişmedikçe bir kez hesaplanır. */
function prepare(asset) {
  const facets = asset.facets || [];
  const cached = prepCache.get(facets);
  if (cached && cached.n === facets.length) return cached;

  const [aw, ah] = asset.size || [200, 200];
  const unit = Math.max(aw, ah);

  // 1) Bölgeler — çokgenler pozitif yönlü (nonzero kırpma için). Bir facet aynı renkli son
  // bölgeye ancak arada açılmış bir bölgeyle örtüşmüyorsa katılır; aksi hâlde z-sırası
  // bozulmasın diye yeni bölge açar (ör. duvarın üstündeki kapı, bacayla aynı renkte olsa da).
  const sheets = [];
  const last = new Map();
  facets.forEach((f, i) => {
    if (!f.p || f.p.length < 3) return;
    const key = `${f.c}|${f.part || ''}`;
    const p = signedArea(f.p) < 0 ? [...f.p].reverse() : f.p;
    const bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of p) {
      bb[0] = Math.min(bb[0], x);
      bb[1] = Math.min(bb[1], y);
      bb[2] = Math.max(bb[2], x);
      bb[3] = Math.max(bb[3], y);
    }
    const poly = { p, bb, facet: i };
    let sh = last.get(key);
    if (sh && sheets.slice(sh.idx + 1).some((o) => o.polys.some((q) => polysOverlap(poly, q)))) sh = null;
    if (!sh) {
      sh = { key, c: f.c, part: f.part || null, first: i, idx: sheets.length, polys: [], box: [Infinity, Infinity, -Infinity, -Infinity] };
      sheets.push(sh);
      last.set(key, sh);
    }
    sh.polys.push(poly);
    sh.box = [Math.min(sh.box[0], bb[0]), Math.min(sh.box[1], bb[1]), Math.max(sh.box[2], bb[2]), Math.max(sh.box[3], bb[3])];
  });

  const inSheet = (sh, x, y) => {
    for (const q of sh.polys) {
      if (x < q.bb[0] || x > q.bb[2] || y < q.bb[1] || y > q.bb[3]) continue;
      if (pointInPolygon(x, y, q.p)) return true;
    }
    return false;
  };
  const inLater = (si, x, y) => {
    for (let j = si + 1; j < sheets.length; j++) if (inSheet(sheets[j], x, y)) return true;
    return false;
  };

  // 2) Görünür kontur parçaları: bölge içi ortak kenarlar elenir, kalanlar örneklenip test edilir
  const eps = unit * 0.004;
  const tol = unit * 0.0015;
  const kq = (v) => Math.round(v / tol);
  const heavy = facets.length > 400;
  for (const sh of sheets) {
    const count = new Map();
    const edges = [];
    for (const q of sh.polys) {
      const p = q.p;
      for (let k = 0; k < p.length; k++) {
        const a = p[k];
        const b = p[(k + 1) % p.length];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < tol) continue;
        const ka = `${kq(a[0])},${kq(a[1])}`;
        const kb = `${kq(b[0])},${kq(b[1])}`;
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        count.set(key, (count.get(key) || 0) + 1);
        edges.push({ a, b, key });
      }
    }
    const runs = [];
    for (const e of edges) {
      if (count.get(e.key) > 1) continue;
      const dx = e.b[0] - e.a[0];
      const dy = e.b[1] - e.a[1];
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      const steps = Math.max(1, Math.min(heavy ? 4 : 60, Math.ceil(len / (unit / 90))));
      let run = null;
      for (let s = 0; s < steps; s++) {
        const u0 = s / steps;
        const u1 = (s + 1) / steps;
        const um = (u0 + u1) / 2;
        const mx = e.a[0] + dx * um;
        const my = e.a[1] + dy * um;
        const p1 = [mx + nx * eps, my + ny * eps];
        const p2 = [mx - nx * eps, my - ny * eps];
        const internal = inSheet(sh, p1[0], p1[1]) && inSheet(sh, p2[0], p2[1]);
        const covered = inLater(sh.idx, p1[0], p1[1]) || inLater(sh.idx, p2[0], p2[1]);
        if (!internal && !covered) {
          const q0 = [e.a[0] + dx * u0, e.a[1] + dy * u0];
          const q1 = [e.a[0] + dx * u1, e.a[1] + dy * u1];
          if (run) run[1] = q1;
          else run = [q0, q1];
        } else if (run) {
          runs.push(run);
          run = null;
        }
      }
      if (run) runs.push(run);
    }
    sh.lines = chain(runs, tol * 3).map((pts, li) => wobbly(pts, unit, sh.idx * 97 + li));
    sh.len = sh.lines.reduce((s, l) => s + l.len, 0);
  }
  const total = sheets.reduce((s, sh) => s + sh.len, 0);
  const prep = { n: facets.length, unit, sheets, total };
  prepCache.set(facets, prep);
  return prep;
}

/** Parçaları uç uca ekleyerek kalemin kalkmadan çizdiği çoklu çizgilere dönüştürür (açgözlü). */
function chain(runs, tol) {
  const left = runs.slice();
  const out = [];
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  while (left.length) {
    // Yeni çizgiye sol üstteki uçtan başla
    let bi = 0;
    let bs = Infinity;
    left.forEach((r, i) => {
      const s = Math.min(r[0][1] * 2 + r[0][0], r[1][1] * 2 + r[1][0]);
      if (s < bs) (bs = s), (bi = i);
    });
    let cur = left.splice(bi, 1)[0];
    if (cur[1][1] * 2 + cur[1][0] < cur[0][1] * 2 + cur[0][0]) cur = [cur[1], cur[0]];
    const pts = [cur[0], cur[1]];
    for (;;) {
      const end = pts[pts.length - 1];
      let fi = -1;
      let rev = false;
      for (let i = 0; i < left.length; i++) {
        if (d2(left[i][0], end) <= tol * tol) (fi = i), (rev = false);
        else if (d2(left[i][1], end) <= tol * tol) (fi = i), (rev = true);
        if (fi >= 0) break;
      }
      if (fi < 0) break;
      const r = left.splice(fi, 1)[0];
      pts.push(rev ? r[0] : r[1]);
    }
    out.push(pts);
  }
  return out;
}

/** Çizgiyi sık örnekler; her noktaya normal ve yumuşak gürültü değeri ekler (titrek kalem). */
function wobbly(pts, unit, seed) {
  const step = unit / 55;
  const xs = [];
  const ys = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) {
      xs.push(ax + ((bx - ax) * k) / n);
      ys.push(ay + ((by - ay) * k) / n);
    }
  }
  const last = pts[pts.length - 1];
  xs.push(last[0]);
  ys.push(last[1]);
  const m = xs.length;
  const nx = new Float32Array(m);
  const ny = new Float32Array(m);
  const nz = new Float32Array(m);
  const cum = new Float32Array(m);
  const f1 = (Math.PI * 2) / (unit * 0.32);
  const f2 = (Math.PI * 2) / (unit * 0.11);
  const ph1 = hash(seed, 1) * 10;
  const ph2 = hash(seed, 2) * 10;
  for (let i = 0; i < m; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(m - 1, i + 1);
    const dx = xs[b] - xs[a];
    const dy = ys[b] - ys[a];
    const l = Math.hypot(dx, dy) || 1;
    nx[i] = -dy / l;
    ny[i] = dx / l;
    if (i > 0) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    const s = cum[i];
    // Uçlarda sıfıra inen titreme → çizgiler birbirine kapanır
    nz[i] = Math.sin(s * f1 + ph1) * 0.65 + Math.sin(s * f2 + ph2) * 0.35;
  }
  return { xs, ys, nx, ny, nz, cum, len: cum[m - 1] };
}

// --------------------------------------------------------------- doku

let grainCanvas = null;
const grainPatterns = new WeakMap();

function grainPattern(ctx) {
  if (!grainCanvas) {
    const S = 96;
    grainCanvas = makeCanvas(S, S);
    const g = grainCanvas.getContext('2d');
    // Kağıdın dişi: boya vuruşlarında açık kalan küçük benekler
    for (let i = 0; i < 520; i++) {
      const x = hash(i, 11) * S;
      const y = hash(i, 12) * S;
      const r = 0.35 + hash(i, 13) * 1.1;
      g.fillStyle = `rgba(255,252,244,${0.25 + hash(i, 14) * 0.6})`;
      g.beginPath();
      g.ellipse(x, y, r * 1.6, r * 0.7, 1.1, 0, Math.PI * 2);
      g.fill();
    }
  }
  let pat = grainPatterns.get(ctx);
  if (!pat) {
    pat = ctx.createPattern(grainCanvas, 'repeat');
    grainPatterns.set(ctx, pat);
  }
  return pat;
}

// --------------------------------------------------------------- çizim

function sheetPath(ctx, sh) {
  ctx.beginPath();
  for (const q of sh.polys) {
    const p = q.p;
    ctx.moveTo(p[0][0], p[0][1]);
    for (let k = 1; k < p.length; k++) ctx.lineTo(p[k][0], p[k][1]);
    ctx.closePath();
  }
}

/** Parça dönüşümünü (partMatrix.apply) afin matrise çevirir */
function affineOf(pm) {
  const [e, f] = pm.apply(0, 0);
  const [ax, ay] = pm.apply(1, 0);
  const [cx, cy] = pm.apply(0, 1);
  return [ax - e, ay - f, cx - e, cy - f, e, f];
}

/** Çokgenin x·dx + y·dy <= thr yarı düzlemindeki kısmı (Sutherland–Hodgman, tek kenar) */
function clipHalf(p, dx, dy, thr) {
  const out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    const da = a[0] * dx + a[1] * dy - thr;
    const db = b[0] * dx + b[1] * dy - thr;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const k = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    }
  }
  return out;
}

function paintSheet(ctx, sh, q, col, o) {
  const [x0, y0, x1, y1] = sh.box;
  // Çapraz silme: boyanan alan wipe yönünde ilerleyen bir yarı düzlemle sınırlanır.
  // Yarı düzlem çokgenlere hesapla uygulanır ve tek bir clip() yapılır — iç içe iki clip()
  // Chrome'un GPU canvas'ında ilk kırpmanın düşmesine (boyanın taşmasına) yol açıyordu.
  let polys = sh.polys.map((q2) => q2.p);
  if (q < 1) {
    const dx = Math.cos(o.wipe);
    const dy = Math.sin(o.wipe);
    const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => x * dx + y * dy);
    const pmin = Math.min(...corners);
    const pmax = Math.max(...corners);
    const thr = pmin + (pmax - pmin) * ease('inOutSine', q);
    polys = polys.map((p) => clipHalf(p, dx, dy, thr)).filter((p) => p.length >= 3);
    if (!polys.length) return;
  }
  const path = () => {
    ctx.beginPath();
    for (const p of polys) {
      ctx.moveTo(p[0][0], p[0][1]);
      for (let k = 1; k < p.length; k++) ctx.lineTo(p[k][0], p[k][1]);
      ctx.closePath();
    }
  };
  ctx.save();
  path();
  ctx.clip();

  // Taban: rengin kağıtla karışmış hâli (opak → üst üste binen bölgeler koyulaşmaz)
  path();
  ctx.globalAlpha = o.alpha;
  ctx.fillStyle = lerpColor(col, PAPER, 0.3);
  ctx.fill();

  // Tarama vuruşları
  const hatchPass = (ang, spacing, alphaMul, widthMul, salt) => {
    const hx = Math.cos(ang);
    const hy = Math.sin(ang);
    const px = -hy;
    const py = hx;
    const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    const pr = cs.map(([x, y]) => x * px + y * py);
    const lo = Math.min(...pr) - spacing;
    const hi = Math.max(...pr) + spacing;
    const half = Math.hypot(x1 - x0, y1 - y0) / 2 + spacing * 2;
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const mp = mx * px + my * py;
    ctx.lineCap = 'round';
    ctx.lineWidth = spacing * widthMul;
    const k0 = Math.floor(lo / spacing);
    const k1 = Math.ceil(hi / spacing);
    for (let k = k0; k <= k1; k++) {
      const r1 = hash(k, sh.idx * 7 + salt);
      const r2 = hash(k, sh.idx * 7 + salt + 1);
      const r3 = hash(k, sh.idx * 7 + salt + 2);
      const off = k * spacing + (r1 - 0.5) * spacing * 0.6 - mp;
      const bx = mx + px * off;
      const by = my + py * off;
      const l0 = half * (0.75 + r2 * 0.35);
      const l1 = half * (0.75 + r3 * 0.35);
      const bend = (r2 - 0.5) * spacing * 1.2;
      ctx.globalAlpha = o.alpha * alphaMul * (0.45 + r1 * 0.5);
      ctx.strokeStyle = shade(col, (r3 - 0.55) * 0.22);
      ctx.beginPath();
      ctx.moveTo(bx - hx * l0, by - hy * l0);
      ctx.quadraticCurveTo(bx + px * bend, by + py * bend, bx + hx * l1, by + hy * l1);
      ctx.stroke();
    }
  };
  hatchPass(o.angle, o.sp, 0.85, 0.95, 0);
  if (o.cross) hatchPass(o.angle - 78 * DEG, o.sp * 1.7, 0.35, 0.7, 50);

  // Kenarlarda bastırılmış boya: bölge sınırı biraz koyu
  ctx.globalAlpha = o.alpha * 0.28;
  sheetPath(ctx, sh);
  ctx.strokeStyle = shade(col, -0.18);
  ctx.lineWidth = o.sp * 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Kağıt dişi (açık benekler)
  if (o.grain > 0) {
    const pat = grainPattern(ctx);
    if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(o.ls, o.ls));
    ctx.globalAlpha = o.alpha * o.grain;
    ctx.fillStyle = pat;
    ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  }
  ctx.restore();
}

function strokeLine(ctx, L, upto, amp) {
  const { xs, ys, nx, ny, nz, cum } = L;
  const m = xs.length;
  if (upto <= 0 || m < 2) return;
  const end = Math.min(upto, L.len);
  const tip = (i) => {
    // Uçlarda titremeyi azalt: kapalı şekiller düzgün birleşir
    const s = cum[i];
    const fade = Math.min(1, s / (amp * 12 + 1e-6), (L.len - s) / (amp * 12 + 1e-6));
    return nz[i] * amp * Math.max(0.25, fade);
  };
  ctx.beginPath();
  let w = tip(0);
  ctx.moveTo(xs[0] + nx[0] * w, ys[0] + ny[0] * w);
  for (let i = 1; i < m; i++) {
    if (cum[i] >= end) {
      const seg = cum[i] - cum[i - 1] || 1;
      const k = (end - cum[i - 1]) / seg;
      const wa = tip(i - 1);
      const wb = tip(i);
      const ax = xs[i - 1] + nx[i - 1] * wa;
      const ay = ys[i - 1] + ny[i - 1] * wa;
      const bx = xs[i] + nx[i] * wb;
      const by = ys[i] + ny[i] * wb;
      ctx.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k);
      break;
    }
    w = tip(i);
    ctx.lineTo(xs[i] + nx[i] * w, ys[i] + ny[i] * w);
  }
  ctx.stroke();
}

/**
 * Çizim / boya stili. opts: { fold, spread, palette, parts, alpha, fx, sketch, lineScale }
 */
export function drawSketch(ctx, asset, opts = {}) {
  const facets = asset.facets || [];
  if (!facets.length) return;
  const f = opts.fold ?? 1;
  if (f <= 0) return;
  const sk = { ...SKETCH_DEFAULTS, ...(opts.sketch || {}) };
  const prep = prepare(asset);
  const { sheets, unit } = prep;
  const ls = opts.lineScale || 1;
  const pal = opts.palette || asset.palette || {};
  const alpha = opts.alpha ?? 1;
  const partMats = partMatrices(asset, opts.parts);
  const outline = sk.outline !== false && prep.total > 0;

  // Aşamalar
  const split = outline ? Math.min(0.9, Math.max(0.1, sk.split)) : 0;
  const drawP = outline ? (f >= 1 ? 1 : ease('inOutSine', clamp01(f / split))) : 1;
  const paintP = f >= 1 ? 1 : clamp01((f - split * 0.65) / (1 - split * 0.65));
  const spread = Math.min(0.9, Math.max(0, opts.spread ?? 0.5));
  const n = sheets.length;

  const o = {
    alpha,
    ls,
    sp: Math.min(unit * 0.08, Math.max(unit * 0.006, sk.hatch * ls)),
    angle: sk.angle * DEG,
    wipe: sk.wipe * DEG,
    cross: sk.cross !== false,
    grain: sk.grain ?? 0.35,
  };
  const lw = Math.max(unit * 0.002, sk.width * ls);
  const amp = sk.wobble * ls;
  let budget = drawP * prep.total;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let si = 0; si < n; si++) {
    const sh = sheets[si];
    const pm = sh.part && partMats[sh.part];
    ctx.save();
    if (pm) ctx.transform(...affineOf(pm));

    // Boya
    const start = (n > 1 ? si / (n - 1) : 0) * spread;
    const q = paintP >= 1 ? 1 : clamp01((paintP - start) / (1 - spread));
    if (q > 0.001 && paintP > 0) {
      const col = facetBase(facets[sh.first], pal, asset.roles, opts.fx);
      paintSheet(ctx, sh, q, col, o);
    }

    // Kontur
    if (outline && budget > 0) {
      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = sk.ink;
      ctx.lineWidth = lw;
      for (const L of sh.lines) {
        if (budget <= 0) break;
        strokeLine(ctx, L, budget, amp);
        budget -= L.len;
      }
    }
    ctx.restore();
  }
  ctx.restore();
}
