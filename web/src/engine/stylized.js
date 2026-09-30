// Geometriyi farklı "görünüşlerle" çizen hafif stiller: neon, cam, mozaik, teknik, vitray,
// kil, siluet, gazete, halftone, suluboya, nakis, piksel.
// Hepsi aynı facet listesini kullanır (ek varlık / yapay zekâ maliyeti yok); saf ve deterministiktir.
// opts.fold = görünme ilerlemesi: yüzeyler kendi merkezlerinden büyüyerek belirir.
import { shade, lerpColor, parseHex } from './color.js';
import { ease } from './easing.js';
import { makeCanvas } from './texture.js';
import { prepare, ranks, facetBase, partMatrices, drawAsset } from './origami.js';

const hash = (i, j = 0) => ((Math.imul(i + 1, 73856093) ^ Math.imul(j + 7, 19349663)) >>> 0) % 1000 / 1000;
const lum = (hex) => {
  const [r, g, b] = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const bbox = (pts) => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
};

const LOOKS = {
  // Parlayan çizgi iskeleti, koyu dolgu
  neon: {
    fill: (c, s) => shade(c, -0.72 + s * 0.1),
    stroke: (c) => shade(c, 0.35),
    width: 1.1,
    glow: 0.5,
  },
  // Yarı saydam buzlu cam, parlak kenar
  cam: {
    fill: (c, s) => shade(c, 0.25 + s * 0.12),
    stroke: () => 'rgba(255,255,255,0.75)',
    width: 0.9,
    alpha: 0.55,
    sheen: true,
  },
  // Low-poly: her yüzeye deterministik küçük ton sapması
  mozaik: {
    fill: (c, s, i) => shade(c, s * 0.5 + hash(i) * 0.32 - 0.16),
    stroke: (c) => shade(c, -0.12),
    width: 0.6,
  },
  // Mavi pafta: ince beyaz çizgi, mavi tonlu dolgu
  teknik: {
    fill: (c) => lerpColor(c, '#123a78', 0.9),
    stroke: () => 'rgba(235,245,255,0.92)',
    width: 1,
  },
  // Vitray: doygun ışıklı cam, kalın koyu kurşun çerçeve
  vitray: {
    fill: (c, s) => shade(c, 0.12 + s * 0.15),
    stroke: () => '#14101a',
    width: 2.6,
    sheen: true,
  },
  // Kil: yumuşak, şişkin yüzeyler, yumuşak gölge
  kil: {
    fill: (c, s) => shade(c, 0.06 + s * 0.3),
    stroke: (c) => shade(c, -0.22),
    width: 0.7,
    puff: true,
    drop: true,
  },
  // Gölge oyunu: tek renk siluet, yüzeyin renginde hale
  siluet: {
    fill: (c) => lerpColor(c, '#08070d', 0.93),
    stroke: (c) => lerpColor(c, '#08070d', 0.93),
    width: 0.8,
    halo: true,
  },
  // Gazete baskısı: tek renk mürekkep tonları, baskı kayması
  gazete: {
    fill: (c, s) => {
      const v = Math.max(0, Math.min(1, lum(c) + s * 0.12));
      return lerpColor('#1c1a17', '#ddd6c2', 0.12 + v * 0.88);
    },
    stroke: () => 'rgba(28,26,23,0.55)',
    width: 0.6,
    ghost: true,
  },
  // Halftone / pop-art: açık zemin üzerine renkli nokta rasteri
  halftone: {
    fill: (c) => lerpColor(c, '#ffffff', 0.72),
    stroke: (c) => shade(c, -0.25),
    width: 0.7,
    dots: true,
  },
  // Suluboya: üst üste yarı saydam, kenarı oynak lekeler
  suluboya: {
    fill: (c, s) => shade(c, 0.2 + s * 0.1),
    stroke: (c) => shade(c, -0.15),
    width: 0.9,
    wash: 3,
  },
  // Nakış: kumaş rengi dolgu, dikiş çizgili kenar
  nakis: {
    fill: (c, s) => shade(c, s * 0.12 - 0.05),
    stroke: (c) => shade(c, 0.4),
    width: 1.1,
    stitch: true,
  },
};

function make(look) {
  const L = LOOKS[look];
  return function drawLook(ctx, asset, opts = {}) {
    const facets = asset.facets || [];
    const fold = opts.fold ?? 1;
    if (!facets.length || fold <= 0) return;
    const spread = Math.min(0.95, Math.max(0, opts.spread ?? 0.6));
    const pal = opts.palette || asset.palette || {};
    const prep = prepare(asset);
    const rk = fold < 1 ? ranks(prep, opts.order || 'radial', opts.seed || 1) : null;
    const partMats = partMatrices(asset, opts.parts);
    const baseAlpha = opts.alpha ?? 1;
    const m = ctx.getTransform();
    const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
    const [aw, ah] = asset.size || [200, 200];
    const unit = Math.max(aw, ah);

    ctx.save();
    ctx.lineJoin = 'round';
    for (let i = 0; i < facets.length; i++) {
      const f = facets[i];
      let pts = f.p;
      if (!pts || pts.length < 3) continue;
      let q = 1;
      if (fold < 1) {
        q = Math.min(1, Math.max(0, (fold - rk[i] * spread) / (1 - spread)));
        if (q <= 0.001) continue;
        q = ease('outCubic', q);
      }
      const pm = f.part && partMats[f.part];
      if (pm) pts = pts.map(([x, y]) => pm.apply(x, y));
      if (q < 1) {
        let cx = 0;
        let cy = 0;
        for (const [x, y] of pts) (cx += x), (cy += y);
        cx /= pts.length;
        cy /= pts.length;
        const sc = 0.4 + 0.6 * q;
        pts = pts.map(([x, y]) => [cx + (x - cx) * sc, cy + (y - cy) * sc]);
      }
      const base = facetBase(f, pal, asset.roles, opts.fx);
      const s = f.s || 0;
      const a = baseAlpha * Math.min(1, q * 3);
      const path = (p) => {
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (let j = 1; j < p.length; j++) ctx.lineTo(p[j][0], p[j][1]);
        ctx.closePath();
      };
      const fill = L.fill(base, s, i);

      if (L.ghost) {
        // Baskı kayması: renkli kopya hafifçe kaymış
        path(pts.map(([x, y]) => [x + unit * 0.006, y + unit * 0.004]));
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = base;
        ctx.fill();
      }

      if (L.wash) {
        // Her kat köşeleri hafifçe oynatılmış, düşük opaklıkta boya
        const jit = unit * 0.012;
        for (let l = 0; l < L.wash; l++) {
          path(pts.map(([x, y], j) => [x + (hash(i, j * 5 + l) - 0.5) * 2 * jit, y + (hash(i, j * 5 + l + 50) - 0.5) * 2 * jit]));
          ctx.globalAlpha = a * 0.36;
          ctx.fillStyle = fill;
          ctx.fill();
        }
        path(pts);
        ctx.globalAlpha = a * 0.3;
        ctx.strokeStyle = L.stroke(base);
        ctx.lineWidth = L.width / k;
        ctx.stroke();
        continue;
      }

      path(pts);
      if (L.drop) {
        ctx.shadowColor = 'rgba(30,18,10,0.35)';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetY = 3;
      }
      if (L.halo) {
        ctx.shadowColor = base;
        ctx.shadowBlur = 14;
      }
      ctx.globalAlpha = a * (L.alpha ?? 1);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (!L.glow && !L.alpha && !L.stitch) {
        // komşu yüzeyler arasındaki anti-alias boşluklarını kapat
        ctx.strokeStyle = fill;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      const [x0, y0, x1, y1] = bbox(pts);
      if (L.sheen) {
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, 'rgba(255,255,255,0.35)');
        g.addColorStop(0.6, 'rgba(255,255,255,0)');
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = g;
        ctx.fill();
      }
      if (L.puff) {
        // Şişkin hacim: sol-üstte yumuşak parlama
        const r = Math.max(x1 - x0, y1 - y0) * 0.7 || 1;
        const g = ctx.createRadialGradient(x0 + (x1 - x0) * 0.35, y0 + (y1 - y0) * 0.3, 0, x0 + (x1 - x0) * 0.35, y0 + (y1 - y0) * 0.3, r);
        g.addColorStop(0, 'rgba(255,255,255,0.32)');
        g.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.globalAlpha = a;
        ctx.fillStyle = g;
        ctx.fill();
      }
      if (L.dots) {
        // 45° dönük nokta rasteri; koyu yüzeyde nokta büyür
        const step = unit * 0.022;
        if ((x1 - x0) > step * 1.2 && (y1 - y0) > step * 1.2) {
          const dark = 1 - Math.max(0, Math.min(1, lum(base) + s * 0.15));
          const r = step * (0.14 + 0.36 * dark);
          ctx.save();
          ctx.clip();
          ctx.globalAlpha = a;
          ctx.fillStyle = base;
          ctx.beginPath();
          for (let yy = Math.floor(y0 / step) * step, row = 0; yy < y1 + step; yy += step, row++) {
            for (let xx = Math.floor(x0 / step) * step + (row % 2 ? step / 2 : 0); xx < x1 + step; xx += step) {
              ctx.moveTo(xx + r, yy);
              ctx.arc(xx, yy, r, 0, Math.PI * 2);
            }
          }
          ctx.fill();
          ctx.restore();
        }
      }
      path(pts);
      ctx.globalAlpha = a;
      ctx.strokeStyle = L.stroke(base);
      ctx.lineWidth = L.width / k;
      if (L.stitch) ctx.setLineDash([3.2 / k, 2.2 / k]);
      if (L.glow) {
        ctx.shadowColor = L.stroke(base);
        ctx.shadowBlur = 10 * L.glow;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (L.stitch) ctx.setLineDash([]);
    }
    ctx.restore();
  };
}

// Piksel: düz vektörü düşük çözünürlüklü tampona çizip keskin büyütür.
let pxBuf = null;
export function drawPixel(ctx, asset, opts = {}) {
  const facets = asset.facets || [];
  if (!facets.length || (opts.fold ?? 1) <= 0) return;
  const m = ctx.getTransform();
  const [aw, ah] = asset.size || [200, 200];
  const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
  const block = Math.max(2, Math.round((Math.max(aw, ah) * k) / 44));
  // Varlığın (parça dönüşleri için pay bırakarak) cihaz uzayındaki sınırları
  const pad = Math.max(aw, ah) * 0.25;
  const cs = [[-pad, -pad], [aw + pad, -pad], [aw + pad, ah + pad], [-pad, ah + pad]].map(([x, y]) => [
    m.a * x + m.c * y + m.e,
    m.b * x + m.d * y + m.f,
  ]);
  const [bx0, by0, bx1, by1] = bbox(cs);
  // Izgara cihaz uzayına sabitlenir, böylece hareket ederken pikseller yüzmez
  const ox = Math.floor(bx0 / block) * block;
  const oy = Math.floor(by0 / block) * block;
  const w = Math.ceil((bx1 - ox) / block);
  const h = Math.ceil((by1 - oy) / block);
  if (w <= 0 || h <= 0 || w > 400 || h > 400) return drawAsset(ctx, asset, { ...opts, flat: true });
  if (!pxBuf || pxBuf.width < w || pxBuf.height < h) pxBuf = makeCanvas(Math.max(w, pxBuf?.width || 0), Math.max(h, pxBuf?.height || 0));
  const o = pxBuf.getContext('2d', { willReadFrequently: true });
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.clearRect(0, 0, pxBuf.width, pxBuf.height);
  o.setTransform(m.a / block, m.b / block, m.c / block, m.d / block, (m.e - ox) / block, (m.f - oy) / block);
  drawAsset(o, asset, { ...opts, flat: true, alpha: 1 });
  // Kenar yumuşatmasını at: alfa eşiği + renk kuantalama
  const img = o.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) {
      d[i + 3] = 0;
      continue;
    }
    d[i + 3] = 255;
    for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] / 40) * 40;
  }
  o.putImageData(img, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.drawImage(pxBuf, 0, 0, w, h, ox, oy, w * block, h * block);
  ctx.restore();
}

export const drawNeon = make('neon');
export const drawGlass = make('cam');
export const drawMosaic = make('mozaik');
export const drawBlueprint = make('teknik');
export const drawVitray = make('vitray');
export const drawClay = make('kil');
export const drawSilhouette = make('siluet');
export const drawNewsprint = make('gazete');
export const drawHalftone = make('halftone');
export const drawWatercolor = make('suluboya');
export const drawStitch = make('nakis');
