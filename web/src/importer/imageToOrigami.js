// K7 — Görselden origami: PNG / JPG / SVG → low-poly origami varlığı.
//
//  1. Küçült (en uzun kenar ~240 px)
//  2. Ön plan maskesi: saydamlık varsa alfa, yoksa kenar renginden (arka plan) uzaklık
//  3. Renk kümeleme (k-means++, tohumlu) → palet
//  4. Nokta örnekleme: maske kenarı + renk sınırları + iç ızgara (tohumlu titreşim)
//  5. Delaunay üçgenleme (Bowyer–Watson)
//  6. Maske içindeki üçgenler → palet anahtarı (çoğunluk) + ışık (s)
//  7. Roller: en büyük küme = ana, ikinci = ikincil, en koyu = koyu, en açık = acik, en doygun = vurgu

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => reject(new Error('Görsel okunamadı'));
    img.src = url;
  });
}

function rasterize(img, maxSide) {
  const w0 = img.naturalWidth || img.width || 512;
  const h0 = img.naturalHeight || img.height || 512;
  const k = maxSide / Math.max(w0, h0);
  const w = Math.max(8, Math.round(w0 * k));
  const h = Math.max(8, Math.round(h0 * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return { w, h, data: ctx.getImageData(0, 0, w, h).data };
}

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const sat = ([r, g, b]) => {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx ? (mx - mn) / mx : 0;
};
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const hex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;

function buildMask({ w, h, data }, threshold) {
  const n = w * h;
  const mask = new Uint8Array(n);
  let transparent = 0;
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] < 250) transparent++;
  if (transparent > n * 0.02) {
    for (let i = 0; i < n; i++) mask[i] = data[i * 4 + 3] > 128 ? 1 : 0;
    return mask;
  }
  // Arka plan = kenar piksellerinin medyan rengi
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  const ch = [0, 1, 2].map((c) => border.map((i) => data[i * 4 + c]).sort((a, b) => a - b)[border.length >> 1]);
  const t2 = threshold * threshold;
  for (let i = 0; i < n; i++) mask[i] = d2([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]], ch) > t2 ? 1 : 0;
  // Açma (erode + dilate): tek piksellik kırıntıları temizle
  const er = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    er[i] = mask[i] && mask[i - 1] && mask[i + 1] && mask[i - w] && mask[i + w] ? 1 : 0;
  }
  const out = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    out[i] = er[i] || er[i - 1] || er[i + 1] || er[i - w] || er[i + w] ? 1 : 0;
  }
  return out;
}

function kmeans(pixels, k, seed) {
  const r = rng(seed);
  const centers = [pixels[Math.floor(r() * pixels.length)]];
  while (centers.length < k) {
    // k-means++: uzak noktaları tercih et
    const dist = pixels.map((p) => Math.min(...centers.map((c) => d2(p, c))));
    const sum = dist.reduce((a, b) => a + b, 0) || 1;
    let x = r() * sum;
    let pick = 0;
    for (; pick < dist.length - 1 && (x -= dist[pick]) > 0; pick++);
    centers.push(pixels[pick]);
  }
  const assign = new Int32Array(pixels.length);
  for (let it = 0; it < 14; it++) {
    const acc = centers.map(() => [0, 0, 0, 0]);
    pixels.forEach((p, i) => {
      let b = 0;
      let bd = Infinity;
      centers.forEach((c, ci) => {
        const d = d2(p, c);
        if (d < bd) {
          bd = d;
          b = ci;
        }
      });
      assign[i] = b;
      const a = acc[b];
      a[0] += p[0];
      a[1] += p[1];
      a[2] += p[2];
      a[3]++;
    });
    acc.forEach((a, ci) => a[3] && (centers[ci] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]));
  }
  const counts = centers.map(() => 0);
  for (const a of assign) counts[a]++;
  return { centers, counts };
}

/** Bowyer–Watson Delaunay üçgenleme → [ [i, j, k], ... ] */
export function delaunay(pts) {
  const n = pts.length;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const d = Math.max(maxX - minX, maxY - minY) * 10;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const P = [...pts, [cx - d, cy - d], [cx + d, cy - d], [cx, cy + d]];
  const circ = (a, b, c) => {
    const [ax, ay] = P[a];
    const [bx, by] = P[b];
    const [qx, qy] = P[c];
    const D = 2 * (ax * (by - qy) + bx * (qy - ay) + qx * (ay - by));
    if (Math.abs(D) < 1e-12) return { x: 0, y: 0, r2: Infinity };
    const ux = ((ax * ax + ay * ay) * (by - qy) + (bx * bx + by * by) * (qy - ay) + (qx * qx + qy * qy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (qx - bx) + (bx * bx + by * by) * (ax - qx) + (qx * qx + qy * qy) * (bx - ax)) / D;
    return { x: ux, y: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
  };
  let tris = [{ v: [n, n + 1, n + 2], c: circ(n, n + 1, n + 2) }];
  for (let i = 0; i < n; i++) {
    const [px, py] = P[i];
    const bad = [];
    const keep = [];
    for (const t of tris) ((px - t.c.x) ** 2 + (py - t.c.y) ** 2 < t.c.r2 ? bad : keep).push(t);
    // Kötü üçgenlerin sınır kenarları (paylaşılmayan)
    const edges = new Map();
    for (const t of bad) {
      for (let e = 0; e < 3; e++) {
        const a = t.v[e];
        const b = t.v[(e + 1) % 3];
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (edges.has(key)) edges.delete(key);
        else edges.set(key, [a, b]);
      }
    }
    for (const [a, b] of edges.values()) keep.push({ v: [a, b, i], c: circ(a, b, i) });
    tris = keep;
  }
  return tris.filter((t) => t.v.every((v) => v < n)).map((t) => t.v);
}

/**
 * @param {HTMLImageElement} img
 * @param {{ colors?: number, spacing?: number, threshold?: number, seed?: number, size?: number }} o
 * @returns {{ asset: object, stats: object }}
 */
export function imageToOrigami(img, o = {}) {
  const colors = Math.max(2, Math.min(10, o.colors ?? 5));
  const spacing = Math.max(5, o.spacing ?? 14);
  const seed = o.seed ?? 7;
  const R = rasterize(img, 240);
  const { w, h, data } = R;
  const mask = buildMask(R, o.threshold ?? 40);
  const px = (x, y) => {
    const i = (Math.min(h - 1, Math.max(0, Math.round(y))) * w + Math.min(w - 1, Math.max(0, Math.round(x)))) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const inside = (x, y) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    return xi >= 0 && yi >= 0 && xi < w && yi < h && mask[yi * w + xi] === 1;
  };

  // --- renk kümeleme (ön plandan en fazla 5000 örnek)
  const fg = [];
  for (let i = 0; i < w * h; i++) if (mask[i]) fg.push(i);
  if (fg.length < 30) throw new Error('Ön plan bulunamadı — eşik değerini düşürün ya da saydam arka planlı görsel kullanın');
  const r = rng(seed);
  const sample = [];
  for (let s = 0; s < Math.min(5000, fg.length); s++) {
    const i = fg[Math.floor(r() * fg.length)];
    sample.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
  }
  const { centers, counts } = kmeans(sample, colors, seed);
  const cluster = (c) => {
    let b = 0;
    let bd = Infinity;
    centers.forEach((q, i) => {
      const d = d2(c, q);
      if (d < bd) {
        bd = d;
        b = i;
      }
    });
    return b;
  };
  const cmap = new Int16Array(w * h).fill(-1);
  for (const i of fg) cmap[i] = cluster([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);

  // --- nokta örnekleme (min aralıklı ızgara hücreleriyle seyreltme)
  const pts = [];
  const cell = spacing * 0.55;
  const occupied = new Set();
  const addPt = (x, y, minGap) => {
    const key = `${Math.floor(x / (minGap || cell))},${Math.floor(y / (minGap || cell))}`;
    if (occupied.has(key)) return;
    occupied.add(key);
    pts.push([x, y]);
  };
  // 1) maske kenarı (öncelikli: siluet düzgün çıksın)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!mask[i]) continue;
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w];
    if (edge) addPt(x + 0.5, y + 0.5, spacing * 0.45);
  }
  // 2) renk sınırları
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (cmap[i] < 0) continue;
    if ((cmap[i + 1] >= 0 && cmap[i + 1] !== cmap[i]) || (cmap[i + w] >= 0 && cmap[i + w] !== cmap[i])) addPt(x + 0.5, y + 0.5, spacing * 0.6);
  }
  // 3) iç ızgara (titreşimli)
  for (let y = spacing / 2; y < h; y += spacing) for (let x = spacing / 2; x < w; x += spacing) {
    const jx = x + (r() - 0.5) * spacing * 0.6;
    const jy = y + (r() - 0.5) * spacing * 0.6;
    if (inside(jx, jy)) addPt(jx, jy, spacing * 0.8);
  }
  if (pts.length > 2500) throw new Error('Çok fazla nokta — yoğunluğu azaltın');

  // --- üçgenleme ve renklendirme
  const tris = delaunay(pts);
  const k = 200 / Math.max(w, h);
  const facets = [];
  const used = new Map();
  for (const [a, b, c] of tris) {
    const A = pts[a];
    const B = pts[b];
    const C = pts[c];
    const area = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
    if (area < 1.5) continue;
    const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    // Üçgenin içinden 4 örnek: ağırlık merkezi + köşelere doğru yarı yol
    const probes = [g, ...[A, B, C].map((v) => [(v[0] + g[0]) / 2, (v[1] + g[1]) / 2])];
    const ins = probes.filter(([x, y]) => inside(x, y));
    if (ins.length < 3) continue;
    const votes = new Map();
    let mean = [0, 0, 0];
    for (const [x, y] of ins) {
      const col = px(x, y);
      mean = mean.map((v, i) => v + col[i] / ins.length);
      const cl = cluster(col);
      votes.set(cl, (votes.get(cl) || 0) + 1);
    }
    const cl = [...votes.entries()].sort((p, q) => q[1] - p[1])[0][0];
    // Işık: görselin kendi parlaklık farkı + yüzey yönüne göre hafif origami gölgesi
    const dl = (lum(mean) - lum(centers[cl])) / 255;
    const nx = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
    const fold = ((Math.floor(g[0] / (spacing * 2)) + Math.floor(g[1] / (spacing * 2))) % 2 ? 0.05 : -0.05) * Math.sign(nx || 1);
    const s = Math.round(Math.max(-0.45, Math.min(0.45, dl * 1.6 + fold)) * 100) / 100;
    used.set(cl, (used.get(cl) || 0) + 1);
    facets.push({ p: [A, B, C].map(([x, y]) => [Math.round(x * k * 10) / 10, Math.round(y * k * 10) / 10]), c: cl, s });
  }
  if (!facets.length) throw new Error('Üçgen üretilemedi');

  // --- palet anahtarları (en büyük küme = a) ve roller
  const order = [...used.keys()].sort((p, q) => used.get(q) - used.get(p));
  const keyOf = new Map(order.map((cl, i) => [cl, 'abcdefghij'[i]]));
  const palette = {};
  for (const cl of order) palette[keyOf.get(cl)] = hex(centers[cl]);
  for (const f of facets) f.c = keyOf.get(f.c);
  const roles = {};
  const keys = order.map((cl) => keyOf.get(cl));
  if (keys[0]) roles[keys[0]] = 'ana';
  if (keys[1]) roles[keys[1]] = 'ikincil';
  const rest = order.filter((cl) => !roles[keyOf.get(cl)]);
  const byL = [...order].sort((p, q) => lum(centers[p]) - lum(centers[q]));
  const dark = byL[0];
  const light = byL[byL.length - 1];
  if (!roles[keyOf.get(dark)] && lum(centers[dark]) < 90) roles[keyOf.get(dark)] = 'koyu';
  if (!roles[keyOf.get(light)] && lum(centers[light]) > 180) roles[keyOf.get(light)] = 'acik';
  const vivid = rest.filter((cl) => !roles[keyOf.get(cl)]).sort((p, q) => sat(centers[q]) - sat(centers[p]))[0];
  if (vivid != null) roles[keyOf.get(vivid)] = sat(centers[vivid]) > 0.35 ? 'vurgu' : 'detay';

  return {
    asset: { size: [Math.round(w * k), Math.round(h * k)], palette, roles, facets },
    stats: { points: pts.length, facets: facets.length, colors: order.length, raster: `${w}×${h}` },
  };
}
