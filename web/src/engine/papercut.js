// Kağıt kesme stili: aynı renkteki yüzeyler tek bir kağıt tabakası olarak kesilir,
// tabakalar üst üste yapıştırılmış gibi alttakine gölge düşürür. Görünme (fold)
// ilerlemesinde tabakalar alttan üste sırayla kayarak yerine oturur.
import { shade } from './color.js';
import { ease } from './easing.js';
import { makeCanvas } from './texture.js';
import { facetBase, partMatrices } from './origami.js';

const sheetCache = new WeakMap();
let scratch = null;

/** Facet'leri (renk anahtarı + parça) bazında tabakalara ayırır; ilk görünme sırası korunur. */
function sheetsOf(asset) {
  const facets = asset.facets || [];
  let s = sheetCache.get(facets);
  if (s && s.n === facets.length) return s.sheets;
  const map = new Map();
  facets.forEach((f, i) => {
    if (!f.p || f.p.length < 3) return;
    const key = `${f.c}|${f.part || ''}`;
    if (!map.has(key)) map.set(key, { c: f.c, part: f.part || null, idx: [], cx: 0, cy: 0 });
    map.get(key).idx.push(i);
  });
  const sheets = [...map.values()];
  for (const sh of sheets) {
    let x = 0;
    let y = 0;
    let n = 0;
    for (const i of sh.idx) for (const p of facets[i].p) (x += p[0]), (y += p[1]), n++;
    sh.cx = x / n;
    sh.cy = y / n;
  }
  sheetCache.set(facets, { n: facets.length, sheets });
  return sheets;
}

function getScratch(w, h) {
  if (!scratch || scratch.width < w || scratch.height < h) {
    scratch = makeCanvas(Math.max(w, scratch?.width || 0), Math.max(h, scratch?.height || 0));
  }
  return scratch;
}

export function drawPapercut(ctx, asset, opts = {}) {
  const facets = asset.facets || [];
  if (!facets.length) return;
  const sheets = sheetsOf(asset);
  const reveal = opts.fold ?? 1;
  if (reveal <= 0) return;
  const spread = Math.min(0.95, Math.max(0, opts.spread ?? 0.6));
  const pal = opts.palette || asset.palette || {};
  const fx = opts.fx;
  const roles = asset.roles;
  const [aw, ah] = asset.size || [200, 200];
  const unit = Math.max(aw, ah);
  const partMats = partMatrices(asset, opts.parts);

  // Her tabaka yalnızca kendi kapladığı küçük piksel alanında çizilir (hız için);
  // gölge drawImage sırasında tampon sınırlarının dışına da düşer.
  const m = ctx.getTransform();
  const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
  const cw = ctx.canvas.width;
  const chh = ctx.canvas.height;
  const n = sheets.length;
  const depthPx = unit * 0.018 * k * (opts.depth ?? 1);
  const shadowPad = depthPx * 3.5;

  for (let si = 0; si < n; si++) {
    const sh = sheets[si];
    let q = 1;
    if (reveal < 1) {
      const start = (n > 1 ? si / (n - 1) : 0) * spread;
      q = Math.min(1, Math.max(0, (reveal - start) / (1 - spread)));
      if (q <= 0.001) continue;
    }
    const e = ease('outBack', q);
    const pm = sh.part && partMats[sh.part];
    // Tabaka aşağıdan kayıp hafifçe büyüyerek yerine oturur
    const sc = q < 1 ? 0.85 + 0.15 * e : 1;
    const dy = q < 1 ? (1 - e) * unit * 0.12 : 0;

    // Noktaları varlık uzayında hesapla ve cihaz uzayındaki sınırları bul
    let bx0 = Infinity;
    let by0 = Infinity;
    let bx1 = -Infinity;
    let by1 = -Infinity;
    const polys = sh.idx.map((i) => {
      let pts = facets[i].p;
      if (pm) pts = pts.map(([x, y]) => pm.apply(x, y));
      if (sc !== 1 || dy) pts = pts.map(([x, y]) => [sh.cx + (x - sh.cx) * sc, sh.cy + dy + (y - sh.cy) * sc]);
      for (const [x, y] of pts) {
        const X = m.a * x + m.c * y + m.e;
        const Y = m.b * x + m.d * y + m.f;
        if (X < bx0) bx0 = X;
        if (X > bx1) bx1 = X;
        if (Y < by0) by0 = Y;
        if (Y > by1) by1 = Y;
      }
      return pts;
    });
    // Ekranın (gölge payı dahil) tamamen dışındaysa atla
    if (bx1 < -shadowPad || by1 < -shadowPad || bx0 > cw + shadowPad || by0 > chh + shadowPad) continue;
    const x0 = Math.floor(Math.max(-shadowPad, bx0 - 2));
    const y0 = Math.floor(Math.max(-shadowPad, by0 - 2));
    const x1 = Math.min(cw + shadowPad, Math.ceil(bx1) + 2);
    const y1 = Math.min(chh + shadowPad, Math.ceil(by1) + 2);
    const w = Math.ceil(x1 - x0);
    const h = Math.ceil(y1 - y0);
    if (w <= 0 || h <= 0) continue;

    const off = getScratch(w, h);
    const o = off.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, w, h);
    o.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
    o.lineJoin = 'round';
    polys.forEach((pts, j) => {
      const f = facets[sh.idx[j]];
      o.beginPath();
      o.moveTo(pts[0][0], pts[0][1]);
      for (let q2 = 1; q2 < pts.length; q2++) o.lineTo(pts[q2][0], pts[q2][1]);
      o.closePath();
      const fill = shade(facetBase(f, pal, roles, fx), (f.s || 0) * 0.08);
      o.fillStyle = fill;
      o.fill();
      o.strokeStyle = fill;
      o.lineWidth = 0.8;
      o.stroke();
    });
    // Kağıdın hafif kıvrımı: tabakanın üst kenarı aydınlık, alt kenarı gölgeli
    o.globalCompositeOperation = 'source-atop';
    o.setTransform(1, 0, 0, 1, 0, 0);
    const g = o.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0.08)');
    o.fillStyle = g;
    o.fillRect(0, 0, w, h);
    o.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = (opts.alpha ?? 1) * Math.min(1, q * 2.5);
    ctx.shadowColor = 'rgba(40,22,10,0.42)';
    ctx.shadowBlur = depthPx * 2.2;
    ctx.shadowOffsetX = depthPx * 0.25;
    ctx.shadowOffsetY = depthPx * 0.9;
    ctx.drawImage(off, 0, 0, w, h, x0, y0, w, h);
    ctx.restore();
  }
}
