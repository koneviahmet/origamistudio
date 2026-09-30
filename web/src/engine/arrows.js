// Ok katmanı — bir nesneden diğerine geçişi anlatan bağlantı okları. Deterministiktir:
// yol, çizim ilerlemesi ve akış animasyonu yalnızca t'nin fonksiyonudur.
//
// Okun STİLİ kütüphanededir (data/library/oklar/<id>.json, "type": "arrow"):
//   { "type": "arrow", "name": "Kavisli ok", "curve": "kavis", "line": "duz", "head": "ucgen", "tail": "yok",
//     "width": 6, "headSize": 26, "color": "#2d3561", "color2": null, "bend": 0.25, "gap": 18,
//     "glow": 0, "shadow": false, "flow": "yok", "flowSpeed": 220, "flowColor": "#ffffff", ... }
// Sahnedeki katman bu öğeye başvurur, iki ucu bağlar ve istediği stil alanını geçersiz kılar:
//   { "type": "arrow", "arrow": "ok-kavis", "from": "cezve", "to": "fincan",   // katman id'si ya da [x, y]
//     "fromAnchor": "auto", "toAnchor": "auto",                                // auto | merkez | ust | alt | sol | sag
//     "fold": [{t,v:0},{t,v:1}],       // çizim ilerlemesi (cizerek-gir / silinerek-cik ön ayarları da sürer)
//     "label": "1683", "labelPos": 0.5,
//     "rider": { "asset": "kagit-gemi", "scale": 0.4, "orient": "don" }, "ride": [{t,v:0},{t,v:1}],
//     "x": 0, "y": 0 (tüm oku kaydırır), "bend": -0.3, "color": "#e63946", ... }
import { ease } from './easing.js';
import { resolveRef } from './theme.js';
import { prop } from './anim.js';
import { drawStyled } from './styles.js';
import { assetPalette } from './origami.js';

export const ARROW_CURVES = { duz: 'Düz', kavis: 'Kavisli', s: 'S eğrisi', dirsek: 'Dirsek (köşeli)', dalga: 'Dalgalı', dongu: 'Halkalı' };
export const ARROW_LINES = { duz: 'Düz çizgi', kesik: 'Kesikli', nokta: 'Noktalı', cift: 'Çift çizgi', serit: 'Sivrilen şerit', el: 'El çizimi' };
export const ARROW_HEADS = { ucgen: 'Üçgen', acik: 'Açık (V)', kalem: 'Kalem (el çizimi)', yuvarlak: 'Yuvarlak', elmas: 'Elmas', cizgi: 'Çizgi', yok: 'Yok' };
export const ARROW_FLOWS = { yok: 'Yok', kesik: 'Akan kesikler', nokta: 'Akan noktalar', kuyruklu: 'Kuyruklu yıldız', nabiz: 'Varışta nabız' };
export const ARROW_ANCHORS = { auto: 'Otomatik', merkez: 'Merkez', ust: 'Üst', alt: 'Alt', sol: 'Sol', sag: 'Sağ' };
export const RIDER_ORIENTS = { don: 'Yola göre dön', cevir: 'Yöne göre çevir', yok: 'Sabit' };

/** Stil alanları: kütüphane öğesi ← katman (aynı adla) */
export const ARROW_DEFAULTS = {
  curve: 'kavis',
  line: 'duz',
  head: 'ucgen',
  tail: 'yok',
  width: 8,
  headSize: 34,
  color: '#2d3561',
  color2: null,
  bend: 0.25,
  gap: 18,
  glow: 0,
  shadow: false,
  flow: 'yok',
  flowSpeed: 220,
  flowColor: '#ffffff',
  flowGap: 70,
  wobble: 0,
  waves: 4,
  amp: 16,
  radius: 28,
  labelFont: 'Caveat',
  labelSize: 54,
  labelColor: null,
  labelBox: false,
};
export const ARROW_STYLE_KEYS = Object.keys(ARROW_DEFAULTS);

/** Yerleşik yedek — asıl kaynak kütüphanedeki "oklar" öğeleridir */
const FALLBACK = { name: 'Ok', ...ARROW_DEFAULTS };

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function hash(a, b = 0) {
  let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
function strHash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Katmanın etkin ok stili: varsayılan ← kütüphane öğesi ← katman alanları */
export function arrowDef(layer, res) {
  const item = layer.arrow && res?.assets?.get(layer.arrow);
  const base = item && item.type === 'arrow' ? item : FALLBACK;
  const out = { ...ARROW_DEFAULTS };
  for (const k of ARROW_STYLE_KEYS) {
    if (base[k] !== undefined) out[k] = base[k];
    if (layer[k] !== undefined && layer[k] !== null) out[k] = layer[k];
  }
  return out;
}

// ------------------------------------------------------------------ uç noktaları

/**
 * Bağlantı noktası. box: { cx, cy, ux, uy, vx, vy, hw, hh } (renderer.layerBox) ya da null (serbest nokta).
 * toward: diğer ucun merkezi. Dönüş: { x, y, nx, ny (dışa doğru normal / yön) }
 */
function attach(box, anchor, toward, gap) {
  if (!box) return null;
  const { cx, cy, ux, uy, vx, vy, hw, hh } = box;
  const side = { ust: [0, -1], alt: [0, 1], sol: [-1, 0], sag: [1, 0] }[anchor];
  if (anchor === 'merkez') {
    const dx = toward[0] - cx;
    const dy = toward[1] - cy;
    const l = Math.hypot(dx, dy) || 1;
    return { x: cx, y: cy, nx: dx / l, ny: dy / l };
  }
  if (side) {
    const nx = ux * side[0] + vx * side[1];
    const ny = uy * side[0] + vy * side[1];
    const d = side[0] ? hw : hh;
    return { x: cx + nx * (d + gap), y: cy + ny * (d + gap), nx, ny };
  }
  // Otomatik: merkezden karşı uca giden ışının yuvarlatılmış dikdörtgenden çıktığı nokta
  let dx = toward[0] - cx;
  let dy = toward[1] - cy;
  const l = Math.hypot(dx, dy) || 1;
  dx /= l;
  dy /= l;
  const lx = dx * ux + dy * uy;
  const ly = dx * vx + dy * vy;
  const p = 4;
  const s = 1 / Math.pow(Math.pow(Math.abs(lx) / (hw || 1e-6), p) + Math.pow(Math.abs(ly) / (hh || 1e-6), p), 1 / p);
  const r = (hw || hh ? s : 0) + gap;
  return { x: cx + dx * r, y: cy + dy * r, nx: dx, ny: dy };
}

function endPoint(spec, boxOf) {
  if (Array.isArray(spec)) return { pt: [spec[0], spec[1]], box: null };
  const box = spec ? boxOf(spec) : null;
  return box ? { pt: [box.cx, box.cy], box } : null;
}

/** Okun iki ucu (dünya koordinatı), t anında. Bağlı katman bulunamazsa null. */
export function arrowEnds(layer, def, boxOf, off = [0, 0]) {
  const A = endPoint(layer.from, boxOf);
  const B = endPoint(layer.to, boxOf);
  if (!A || !B) return null;
  const a = attach(A.box, layer.fromAnchor || 'auto', B.pt, def.gap) || { x: A.pt[0], y: A.pt[1] };
  const b = attach(B.box, layer.toAnchor || 'auto', A.pt, def.gap) || { x: B.pt[0], y: B.pt[1] };
  a.x += off[0];
  a.y += off[1];
  b.x += off[0];
  b.y += off[1];
  return { a, b, anchored: [!!A.box && layer.fromAnchor && layer.fromAnchor !== 'auto', !!B.box && layer.toAnchor && layer.toAnchor !== 'auto'] };
}

// ------------------------------------------------------------------ yol

function quad(p0, c, p1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
  return out;
}
function cubic(p0, c1, c2, p1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]]);
  }
  return out;
}

/**
 * Köşeleri yuvarlatılmış dik açılı rota. hStart / hEnd: uçların yatay çıkıp girmesi.
 * Aynı eksen → Z (üç parça), farklı eksen → L (iki parça; uç bağlandığı kenara dik girer).
 */
function elbow(a, b, hStart, hEnd, r) {
  let pts;
  if (hStart && !hEnd) pts = [[a.x, a.y], [b.x, a.y], [b.x, b.y]];
  else if (!hStart && hEnd) pts = [[a.x, a.y], [a.x, b.y], [b.x, b.y]];
  else if (hStart) {
    const mx = (a.x + b.x) / 2;
    pts = [[a.x, a.y], [mx, a.y], [mx, b.y], [b.x, b.y]];
  } else {
    const my = (a.y + b.y) / 2;
    pts = [[a.x, a.y], [a.x, my], [b.x, my], [b.x, b.y]];
  }
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(cx - px, cy - py);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) {
      out.push([cx, cy]);
      continue;
    }
    const s = [cx - ((cx - px) / l1) * rr, cy - ((cy - py) / l1) * rr];
    const e = [cx + ((nx - cx) / l2) * rr, cy + ((ny - cy) / l2) * rr];
    out.push(...quad(s, [cx, cy], e, 8));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Noktaları eşit aralıklarla yeniden örnekler; kümülatif uzunluk ekler */
function resample(pts, step) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  const n = Math.max(2, Math.min(400, Math.ceil(L / step)));
  const out = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (L * i) / n;
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const k = (s - cum[j]) / seg;
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * k, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * k]);
  }
  return out;
}

function withCum(pts) {
  const cum = new Float32Array(pts.length);
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { pts, cum, L: cum[pts.length - 1] };
}

/** Okun yolu (çoklu çizgi + yay uzunluğu) */
export function arrowPath(ends, def, seed = 1) {
  const { a, b, anchored } = ends;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Sol normal (ekranda "yukarı" kavis için bend > 0)
  const nx = uy;
  const ny = -ux;
  const bend = def.bend || 0;
  const n = Math.max(24, Math.min(160, Math.round(len / 8)));
  let pts;
  switch (def.curve) {
    case 'duz':
      pts = [[a.x, a.y], [b.x, b.y]];
      break;
    case 's': {
      // Sabit çapalarda uçlar çapa normali boyunca çıkar (akış şeması görünümü)
      const k = len * 0.42;
      const t0 = anchored[0] ? [a.nx, a.ny] : [ux + nx * bend * 2, uy + ny * bend * 2];
      const t1 = anchored[1] ? [b.nx, b.ny] : [-ux + nx * bend * 2, -uy + ny * bend * 2];
      pts = cubic([a.x, a.y], [a.x + t0[0] * k, a.y + t0[1] * k], [b.x + t1[0] * k, b.y + t1[1] * k], [b.x, b.y], n);
      break;
    }
    case 'dirsek': {
      const auto = Math.abs(dx) >= Math.abs(dy);
      const hStart = anchored[0] ? Math.abs(a.nx) > Math.abs(a.ny) : anchored[1] ? !(Math.abs(b.nx) > Math.abs(b.ny)) || auto : auto;
      const hEnd = anchored[1] ? Math.abs(b.nx) > Math.abs(b.ny) : hStart;
      pts = elbow(a, b, hStart, hEnd, def.radius ?? 28);
      break;
    }
    default: {
      // kavis / dalga / dongu: kavisli temel yol
      const c = [(a.x + b.x) / 2 + nx * bend * len, (a.y + b.y) / 2 + ny * bend * len];
      pts = quad([a.x, a.y], c, [b.x, b.y], n);
    }
  }
  pts = resample(pts, 5);

  // Dalga / halka / el titremesi: yol normali boyunca ofset
  if (def.curve === 'dalga' || def.curve === 'dongu' || def.wobble > 0) {
    const base = withCum(pts);
    const out = [];
    const R = Math.min(60, base.L * 0.075);
    const ph1 = hash(seed, 1) * 10;
    const ph2 = hash(seed, 2) * 10;
    for (let i = 0; i < pts.length; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(pts.length - 1, i + 1);
      const tx = pts[i1][0] - pts[i0][0];
      const ty = pts[i1][1] - pts[i0][1];
      const tl = Math.hypot(tx, ty) || 1;
      const Tx = tx / tl;
      const Ty = ty / tl;
      const Nx = Ty;
      const Ny = -Tx;
      const s = base.cum[i];
      const u = s / (base.L || 1);
      let along = 0;
      let off = 0;
      if (def.curve === 'dalga') off = Math.sin(u * Math.PI * 2 * (def.waves || 4)) * (def.amp ?? 16) * Math.sin(Math.PI * u);
      if (def.curve === 'dongu') {
        // Yolun ortasında trokoid halka
        const q = clamp01((u - 0.38) / 0.24);
        const phi = q * Math.PI * 2;
        along = -R * Math.sin(phi);
        off = R * (1 - Math.cos(phi));
      }
      if (def.wobble > 0) off += (Math.sin(s * 0.045 + ph1) * 0.6 + Math.sin(s * 0.13 + ph2) * 0.4) * def.wobble;
      out.push([pts[i][0] + Nx * off + Tx * along, pts[i][1] + Ny * off + Ty * along]);
    }
    pts = out;
  }
  return withCum(pts);
}

/** Yol üzerinde s uzunluğundaki nokta ve teğet açısı */
export function pointAt(path, s) {
  const { pts, cum, L } = path;
  s = Math.max(0, Math.min(L, s));
  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cum[m] < s) lo = m;
    else hi = m;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const k = (s - cum[lo]) / seg;
  const x = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k;
  const y = pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k;
  return { x, y, angle: Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]) };
}

/** Yolun [s0, s1] aralığını path'e ekler */
function tracePart(ctx, path, s0, s1, offset = 0) {
  const { pts, cum } = path;
  const p0 = pointAt(path, s0);
  const at = (x, y, i) => {
    if (!offset) return [x, y];
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(pts.length - 1, i + 1);
    const tx = pts[i1][0] - pts[i0][0];
    const ty = pts[i1][1] - pts[i0][1];
    const tl = Math.hypot(tx, ty) || 1;
    return [x + (ty / tl) * offset, y - (tx / tl) * offset];
  };
  let i = 0;
  while (i < pts.length && cum[i] <= s0) i++;
  const q0 = at(p0.x, p0.y, Math.max(0, i - 1));
  ctx.moveTo(q0[0], q0[1]);
  for (; i < pts.length && cum[i] < s1; i++) {
    const q = at(pts[i][0], pts[i][1], i);
    ctx.lineTo(q[0], q[1]);
  }
  const p1 = pointAt(path, s1);
  const q1 = at(p1.x, p1.y, Math.min(pts.length - 1, i));
  ctx.lineTo(q1[0], q1[1]);
}

// ------------------------------------------------------------------ uçlar

function drawHead(ctx, kind, x, y, ang, size, w, color, seed) {
  if (!kind || kind === 'yok' || size <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const L = size;
  const H = size * 0.62;
  switch (kind) {
    case 'ucgen':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-L, -H / 2 - w * 0.2);
      ctx.quadraticCurveTo(-L * 0.78, 0, -L, H / 2 + w * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'acik':
      ctx.lineWidth = Math.max(2, w);
      ctx.beginPath();
      ctx.moveTo(-L * 0.8, -H * 0.55);
      ctx.lineTo(0, 0);
      ctx.lineTo(-L * 0.8, H * 0.55);
      ctx.stroke();
      break;
    case 'kalem': {
      // El çizimi: iki ayrı vuruş, hafif taşmalı ve asimetrik
      ctx.lineWidth = Math.max(2, w * 0.9);
      const j1 = (hash(seed, 7) - 0.5) * 0.25;
      const j2 = (hash(seed, 8) - 0.5) * 0.25;
      ctx.beginPath();
      ctx.moveTo(-L * (0.85 + j1), -H * (0.6 + j2));
      ctx.quadraticCurveTo(-L * 0.35, -H * 0.2, w * 0.3, 0);
      ctx.moveTo(-L * (0.8 - j2), H * (0.62 - j1));
      ctx.quadraticCurveTo(-L * 0.3, H * 0.18, w * 0.2, 0);
      ctx.stroke();
      break;
    }
    case 'yuvarlak':
      ctx.beginPath();
      ctx.arc(-size * 0.28, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'elmas':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-L * 0.5, -H * 0.45);
      ctx.lineTo(-L, 0);
      ctx.lineTo(-L * 0.5, H * 0.45);
      ctx.closePath();
      ctx.fill();
      break;
    case 'cizgi':
      ctx.lineWidth = Math.max(2, w * 0.9);
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, -H * 0.5);
      ctx.lineTo(-w * 0.5, H * 0.5);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

/** Ucun çizginin ne kadar önünde bittiği (çizgi ucu delip geçmesin) */
function headInset(kind, size, w) {
  if (kind === 'ucgen') return size * 0.8;
  if (kind === 'elmas') return size * 0.9;
  if (kind === 'yuvarlak') return size * 0.45;
  if (kind === 'yok') return 0;
  return w * 0.4;
}

// ------------------------------------------------------------------ çizim

/**
 * Ok katmanını çizer (dünya koordinatlarında, kamera dönüşümü uygulanmış ctx).
 * boxOf(id) → renderer'ın katman kutusu. @returns bbox | null
 */
export function drawArrow(ctx, layer, t, st, scene, res, th, boxOf) {
  const def = arrowDef(layer, res);
  const ends = arrowEnds(layer, def, boxOf, [st.x || 0, st.y || 0]);
  if (!ends) return null;
  const seed = strHash(layer.id || 'ok');
  const path = arrowPath(ends, def, seed);
  const L = path.L;
  if (L < 2) return null;
  const p = st.fold ?? 1;
  const alpha = st.opacity ?? 1;
  const w = Math.max(0.5, def.width);
  const hs = def.headSize;
  const col = resolveRef(def.color, th) || '#2d3561';
  const col2 = def.color2 ? resolveRef(def.color2, th) : null;
  const headCol = col2 || col;

  // bbox (seçim / isabet için)
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of path.pts) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const pad = Math.max(w, hs * 0.6) + 6;
  // hitPath: stüdyo yalnızca yola yakın tıklamaları oka sayar (alttaki nesneler seçilebilsin)
  const bbox = { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad, hitPath: path.pts, hitW: Math.max(w, hs * 0.5) };
  if (p <= 0 || alpha <= 0) return bbox;

  const vis = L * clamp01(p);
  const headIn = def.head !== 'yok' ? headInset(def.head, hs, w) : 0;
  const tailIn = def.tail !== 'yok' ? headInset(def.tail, hs * 0.85, w) : 0;
  const sStart = Math.min(vis, tailIn);
  const sEnd = Math.max(sStart, vis - headIn * clamp01(vis / (headIn * 2 + 1e-6)));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  let stroke = col;
  if (col2) {
    const pa = path.pts[0];
    const pb = path.pts[path.pts.length - 1];
    const g = ctx.createLinearGradient(pa[0], pa[1], pb[0], pb[1]);
    g.addColorStop(0, col);
    g.addColorStop(1, col2);
    stroke = g;
  }
  if (def.glow > 0) {
    ctx.shadowColor = col2 || col;
    ctx.shadowBlur = def.glow;
  } else if (def.shadow) {
    ctx.shadowColor = 'rgba(30,20,10,0.28)';
    ctx.shadowBlur = w * 1.6 + 4;
    ctx.shadowOffsetY = w * 0.5 + 2;
  }

  // Gövde
  if (sEnd > sStart + 0.5) {
    ctx.strokeStyle = stroke;
    ctx.fillStyle = stroke;
    ctx.lineWidth = w;
    const line = def.line;
    if (line === 'serit') {
      // Kuyruktan başa kalınlaşan dolu şerit
      const N = 64;
      const left = [];
      const right = [];
      for (let i = 0; i <= N; i++) {
        const s = sStart + ((sEnd - sStart) * i) / N;
        const q = pointAt(path, s);
        const ww = (w * (0.18 + 0.82 * (s / (L || 1)))) / 2;
        const nx = -Math.sin(q.angle);
        const ny = Math.cos(q.angle);
        left.push([q.x + nx * ww, q.y + ny * ww]);
        right.push([q.x - nx * ww, q.y - ny * ww]);
      }
      ctx.beginPath();
      left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      ctx.closePath();
      ctx.fill();
    } else if (line === 'cift') {
      ctx.lineWidth = Math.max(1, w * 0.5);
      for (const o of [-w * 0.75, w * 0.75]) {
        ctx.beginPath();
        tracePart(ctx, path, sStart, sEnd, o);
        ctx.stroke();
      }
    } else {
      if (line === 'kesik') ctx.setLineDash([w * 3, w * 2.2]);
      if (line === 'nokta') ctx.setLineDash([0.01, w * 2.3]);
      if ((line === 'kesik' || line === 'nokta') && def.flow === 'kesik') ctx.lineDashOffset = -t * def.flowSpeed;
      ctx.beginPath();
      tracePart(ctx, path, sStart, sEnd);
      ctx.stroke();
      if (line === 'el') {
        // Kalemle ikinci geçiş: hafif kaymış, ince
        ctx.globalAlpha = alpha * 0.45;
        ctx.lineWidth = w * 0.55;
        ctx.beginPath();
        tracePart(ctx, path, sStart, sEnd, w * 0.45 + (def.wobble || 0) * 0.3);
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }
      ctx.setLineDash([]);
    }
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Akış animasyonu (çizilmiş kısım üzerinde)
  const fc = resolveRef(def.flowColor, th) || '#ffffff';
  const spd = def.flowSpeed || 0;
  if (def.flow === 'kesik' && def.line !== 'kesik' && def.line !== 'nokta' && def.line !== 'serit' && sEnd > sStart) {
    ctx.save();
    ctx.strokeStyle = fc;
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = Math.max(1, w * 0.4);
    ctx.setLineDash([w * 1.6, w * 2.8]);
    ctx.lineDashOffset = -t * spd;
    ctx.beginPath();
    tracePart(ctx, path, sStart, sEnd);
    ctx.stroke();
    ctx.restore();
  } else if (def.flow === 'nokta' && vis > 0) {
    ctx.save();
    ctx.fillStyle = fc;
    const gap = Math.max(10, def.flowGap || 70);
    const off = (t * spd) % gap;
    for (let s = off; s < Math.min(vis, sEnd); s += gap) {
      const q = pointAt(path, s);
      const edge = Math.min(1, s / 20, (sEnd - s) / 20);
      ctx.globalAlpha = alpha * Math.max(0, edge);
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(1.5, w * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (def.flow === 'kuyruklu' && vis > 0) {
    // Yol boyunca kayan parlak kuyruklu ışık
    const tail = Math.min(L * 0.35, 160);
    const head = (t * spd) % (L + tail);
    ctx.save();
    ctx.shadowColor = fc;
    ctx.shadowBlur = w * 2.5;
    const N = 14;
    for (let i = 0; i < N; i++) {
      const s0 = head - tail + (tail * i) / N;
      const s1 = head - tail + (tail * (i + 1)) / N;
      const a0 = Math.max(0, s0);
      const a1 = Math.min(vis, sEnd, s1);
      if (a1 <= a0) continue;
      ctx.globalAlpha = alpha * ((i + 1) / N);
      ctx.strokeStyle = fc;
      ctx.lineWidth = Math.max(1, w * (0.3 + (0.7 * (i + 1)) / N));
      ctx.beginPath();
      tracePart(ctx, path, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Uçlar: baş, çizim ucunu izler (kalem gibi); kuyruk başlangıçta
  if (def.tail !== 'yok' && vis > 0) {
    const q = pointAt(path, 0);
    const q2 = pointAt(path, Math.min(L, 6));
    const k = ease('outBack', clamp01(vis / (hs * 1.5 + 1e-6)));
    drawHead(ctx, def.tail, q.x, q.y, Math.atan2(q.y - q2.y, q.x - q2.x), hs * 0.85 * k, w, col, seed + 1);
  }
  if (def.head !== 'yok' && vis > 0) {
    const q = pointAt(path, vis);
    const q2 = pointAt(path, Math.max(0, vis - 8));
    const k = ease('outBack', clamp01(vis / (hs * 1.5 + 1e-6)));
    if (def.glow > 0) {
      ctx.shadowColor = headCol;
      ctx.shadowBlur = def.glow;
    }
    drawHead(ctx, def.head, q.x, q.y, Math.atan2(q.y - q2.y, q.x - q2.x), hs * k, w, headCol, seed);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  // Varış nabzı: ok tamamlandıktan sonra uçtan yayılan halkalar
  if (def.flow === 'nabiz' && p >= 1) {
    const q = pointAt(path, L);
    const period = Math.max(0.3, 240 / (spd || 240));
    for (let r = 0; r < 2; r++) {
      const ph = ((t / period + r * 0.5) % 1 + 1) % 1;
      ctx.globalAlpha = alpha * (1 - ph) * 0.8;
      ctx.strokeStyle = headCol;
      ctx.lineWidth = Math.max(1.5, w * 0.5);
      ctx.beginPath();
      ctx.arc(q.x, q.y, hs * (0.4 + ph * 1.6), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
  }

  // Etiket
  if (layer.label) {
    const lp = clamp01(layer.labelPos ?? 0.5);
    const la = clamp01((p - lp + 0.05) / 0.12);
    if (la > 0) {
      const q = pointAt(path, L * lp);
      const size = def.labelSize;
      // Normalin "yukarı" bakan yönü
      let nx = -Math.sin(q.angle);
      let ny = Math.cos(q.angle);
      if (ny > 0) (nx = -nx), (ny = -ny);
      const offset = layer.labelOffset ?? size * 0.75 + w;
      const lx = q.x + nx * offset;
      const ly = q.y + ny * offset;
      ctx.save();
      ctx.globalAlpha = alpha * la;
      ctx.font = `700 ${size}px "${def.labelFont || 'Baloo 2'}", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = String(layer.label).split('\n');
      if (def.labelBox) {
        const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const bh = lines.length * size * 1.1;
        const bx = lx - tw / 2 - size * 0.4;
        const by = ly - bh / 2 - size * 0.15;
        const bw = tw + size * 0.8;
        const bhh = bh + size * 0.3;
        const r = Math.min(size * 0.35, bhh / 2);
        ctx.fillStyle = '#fffdf7';
        ctx.shadowColor = 'rgba(30,20,10,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bhh, r);
        ctx.arcTo(bx + bw, by + bhh, bx, by + bhh, r);
        ctx.arcTo(bx, by + bhh, bx, by, r);
        ctx.arcTo(bx, by, bx + bw, by, r);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.fillStyle = resolveRef(def.labelColor, th) || col;
      lines.forEach((l, i) => ctx.fillText(l, lx, ly + (i - (lines.length - 1) / 2) * size * 1.1));
      ctx.restore();
    }
  }

  // Yolcu: ok boyunca taşınan nesne (varsayılan: çizim ucunu izler)
  const rider = layer.rider;
  const rAsset = rider?.asset && res?.assets?.get(rider.asset);
  if (rAsset && !rAsset.type) {
    const u = layer.ride !== undefined ? clamp01(prop(layer, 'ride', t, 0)) : clamp01(p);
    if (u > 0 || layer.ride !== undefined) {
      const q = pointAt(path, L * u);
      const [aw, ah] = rAsset.size || [200, 200];
      const sc = rider.scale ?? 0.4;
      ctx.save();
      ctx.translate(q.x, q.y);
      const orient = rider.orient || 'cevir';
      if (orient === 'don') ctx.rotate(q.angle + ((rider.angle || 0) * Math.PI) / 180);
      else if (orient === 'cevir' && Math.cos(q.angle) < 0) ctx.scale(-1, 1);
      ctx.scale(sc, sc);
      ctx.translate(-aw / 2, -ah / 2 - (rider.lift || 0) / sc);
      drawStyled(ctx, rAsset, layer.style || scene.style || 'origami', {
        palette: assetPalette(rAsset, rider.variant),
        alpha,
        crease: false,
        lineScale: 1 / sc,
      });
      ctx.restore();
    }
  }
  ctx.restore();
  return bbox;
}

/** Bir ok stilindeki alanları özetler (kütüphane kartları için) */
export function arrowSummary(item) {
  return [ARROW_CURVES[item.curve] || item.curve, ARROW_LINES[item.line] || item.line, item.flow && item.flow !== 'yok' ? ARROW_FLOWS[item.flow] : null]
    .filter(Boolean)
    .join(' · ');
}

