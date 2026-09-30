// Origami varlıklarını çizer.
//
// Varlık = düz kağıt yüzeyleri (facet) listesi. Her facet bir çokgendir:
//   { "p": [[x,y],...], "c": "a" | "#hex", "s": -0.2, "part": "wingL", "hinge": 0 }
//
// Katlanma (fold) animasyonu: fold ∈ [0,1]. Her facet sırası geldiğinde kendi "menteşe"
// kenarı etrafında 180° döner (kosinüs izdüşümü). Dönüş sırasında kağıdın arka yüzü
// (asset.back) görünür ve yüzey ışığı değişir — gerçek kağıt katlama hissi verir.
import { shade } from './color.js';
import { ease } from './easing.js';

export const DEFAULT_BACK = '#f4eee3';
export const FOLD_ORDERS = ['radial', 'inward', 'left', 'right', 'top', 'bottom', 'index', 'reverse', 'random'];

const prepCache = new WeakMap();

function centroid(p) {
  let x = 0;
  let y = 0;
  for (const q of p) {
    x += q[0];
    y += q[1];
  }
  return [x / p.length, y / p.length];
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assetCenter(asset) {
  const [w, h] = asset.size || [200, 200];
  return asset.center || [w / 2, h / 2];
}

export function prepare(asset) {
  const facets = asset.facets || [];
  let prep = prepCache.get(facets);
  if (prep && prep.n === facets.length) return prep;
  const center = assetCenter(asset);
  const items = facets.map((f, i) => {
    const p = f.p || [];
    const c = centroid(p);
    let hinge = 0;
    if (Number.isInteger(f.hinge) && f.hinge < p.length) {
      hinge = f.hinge;
    } else {
      // Asset merkezine en yakın kenar menteşe olur → model içten dışa açılır.
      let best = Infinity;
      for (let k = 0; k < p.length; k++) {
        const a = p[k];
        const b = p[(k + 1) % p.length];
        const mx = (a[0] + b[0]) / 2 - center[0];
        const my = (a[1] + b[1]) / 2 - center[1];
        const d = mx * mx + my * my;
        if (d < best) {
          best = d;
          hinge = k;
        }
      }
    }
    return { i, c, hinge, dist: Math.hypot(c[0] - center[0], c[1] - center[1]) };
  });
  prep = { n: facets.length, items, ranks: {} };
  prepCache.set(facets, prep);
  return prep;
}

/** Geometri yerinde değiştirildiğinde (nokta düzenleme) önbelleği temizler. */
export function invalidateAsset(asset) {
  if (asset?.facets) prepCache.delete(asset.facets);
}

export function ranks(prep, order, seed) {
  const key = `${order}|${seed}`;
  if (prep.ranks[key]) return prep.ranks[key];
  const it = [...prep.items];
  const by = {
    radial: (a, b) => a.dist - b.dist,
    inward: (a, b) => b.dist - a.dist,
    left: (a, b) => a.c[0] - b.c[0],
    right: (a, b) => b.c[0] - a.c[0],
    top: (a, b) => a.c[1] - b.c[1],
    bottom: (a, b) => b.c[1] - a.c[1],
    index: (a, b) => a.i - b.i,
    reverse: (a, b) => b.i - a.i,
  };
  if (order === 'random') {
    const rnd = mulberry32(seed || 1);
    for (let i = it.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [it[i], it[j]] = [it[j], it[i]];
    }
  } else {
    it.sort(by[order] || by.radial);
  }
  const out = new Float32Array(it.length);
  const n = Math.max(1, it.length - 1);
  it.forEach((item, r) => (out[item.i] = r / n));
  prep.ranks[key] = out;
  return out;
}

export function resolveColor(c, palette) {
  if (!c) return '#cccccc';
  if (c[0] === '#') return c;
  return palette?.[c] || '#cccccc';
}

export function partMatrix(asset, name, st) {
  const pivot = asset.parts?.[name]?.pivot || assetCenter(asset);
  const rad = ((st.rotation || 0) * Math.PI) / 180;
  const sx = st.scaleX ?? 1;
  const sy = st.scaleY ?? 1;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = st.x || 0;
  const dy = st.y || 0;
  return {
    flip: sx * sy < 0,
    apply(x, y) {
      const lx = (x - pivot[0]) * sx;
      const ly = (y - pivot[1]) * sy;
      return [pivot[0] + lx * cos - ly * sin + dx, pivot[1] + lx * sin + ly * cos + dy];
    },
  };
}

/**
 * Varlığın etkin paleti: temel palet ← varyant ← katmana özel renkler.
 * Değerler "$ref" olabilir (tema renkleri); çözüm renderer'da yapılır.
 */
export function assetPalette(asset, variant, override) {
  const v = variant && asset.variants?.[variant]?.palette;
  if (!v && !override) return asset.palette || {};
  return { ...asset.palette, ...v, ...override };
}

/** Facet'in temel rengini tema dönüşümüyle birlikte döndürür. */
export function facetBase(f, pal, roles, fx) {
  const hex = resolveColor(f.c, pal);
  return fx ? fx(hex, f.c && f.c[0] !== '#' ? roles?.[f.c] : null) : hex;
}

export function partMatrices(asset, parts) {
  const out = {};
  if (parts) for (const name in parts) out[name] = partMatrix(asset, name, parts[name]);
  return out;
}

/**
 * Origami stili: bir varlığı varlık koordinatlarında (0..size) çizer.
 * opts: { fold, order, spread, seed, palette, parts, crease, highlight, alpha,
 *         fx (tema renk dönüşümü), paper (kağıt tipi), flat (düz vektör) }
 */
export function drawAsset(ctx, asset, opts = {}) {
  const facets = asset.facets || [];
  if (!facets.length) return;
  const fold = opts.fold ?? 1;
  const spread = Math.min(0.95, Math.max(0, opts.spread ?? 0.6));
  const pal = opts.palette || asset.palette || {};
  const paper = opts.paper || {};
  const fx = opts.fx;
  const roles = asset.roles;
  const back = pal.back || asset.back || paper.back || DEFAULT_BACK;
  const baseAlpha = opts.alpha ?? 1;
  const flat = !!opts.flat;
  const crease = opts.crease !== false && !flat;
  const shadeMul = flat ? 0 : paper.shadeMul ?? 1;
  const creaseAlpha = paper.crease ?? 0.16;
  const gloss = paper.gloss || 0;
  const prep = prepare(asset);
  const rk = fold < 1 ? ranks(prep, opts.order || 'radial', opts.seed || 1) : null;

  const partMats = partMatrices(asset, opts.parts);

  ctx.lineJoin = 'round';
  for (let i = 0; i < facets.length; i++) {
    const f = facets[i];
    const p = f.p;
    if (!p || p.length < 3) continue;

    let q = 1;
    if (fold <= 0) continue;
    if (fold < 1) {
      const start = rk[i] * spread;
      q = Math.min(1, Math.max(0, (fold - start) / (1 - spread)));
      if (q <= 0.001) continue;
      q = ease('outCubic', q);
    }

    // Menteşe etrafında katlanma izdüşümü
    let pts = p;
    let c = 1;
    if (q < 1) {
      c = Math.cos(Math.PI * (1 - q));
      const h = prep.items[i].hinge;
      const A = p[h];
      const B = p[(h + 1) % p.length];
      let ux = B[0] - A[0];
      let uy = B[1] - A[1];
      const len = Math.hypot(ux, uy) || 1;
      ux /= len;
      uy /= len;
      pts = p.map(([x, y]) => {
        const d = (x - A[0]) * ux + (y - A[1]) * uy;
        const px = A[0] + d * ux;
        const py = A[1] + d * uy;
        return [px + (x - px) * c, py + (y - py) * c];
      });
    }

    let flipped = c < 0;
    const pm = f.part && partMats[f.part];
    if (pm) {
      pts = pts.map(([x, y]) => pm.apply(x, y));
      if (pm.flip) flipped = !flipped;
    }

    let light = (f.s || 0) * shadeMul - (1 - Math.abs(c)) * 0.3;
    if (gloss && light > 0) light += gloss * (1 - light);
    const fill = flipped ? shade(back, light * 0.6 - 0.04) : shade(facetBase(f, pal, roles, fx), light);

    ctx.globalAlpha = baseAlpha * Math.min(1, q * 3);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    // Komşu yüzeyler arasındaki anti-alias boşluklarını kapat
    ctx.strokeStyle = fill;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    if (crease) {
      ctx.strokeStyle = `rgba(255,255,255,${creaseAlpha})`;
      ctx.lineWidth = 0.45;
      ctx.stroke();
    }
    if (opts.highlight === i) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

export function pointInPolygon(x, y, p) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Üstteki facet önce — varlık koordinatındaki noktaya denk gelen facet indeksini bulur. */
export function hitFacet(asset, x, y) {
  const f = asset.facets || [];
  for (let i = f.length - 1; i >= 0; i--) if (f[i].p && pointInPolygon(x, y, f[i].p)) return i;
  return -1;
}
