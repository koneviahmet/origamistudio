// Logo / tek renkli görsel → tam vektörel kütüphane modeli (düşük çokgen değil: kontur izleme).
//   node scripts/gorselden-vektor.mjs <gorsel.png> --id logo --ad "Logo" [--kategori marka] [--esik 175] [--ters] [--boyut 400] [--sadelik 0.6] [--renk "#ffffff"] [--etiket "logo,marka"]
// Yöntem: parlaklık alanında marching squares (alt piksel hassasiyetli) → kapalı konturlar → Douglas–Peucker → delikler "anahtar deliği"
// köprüsüyle dış konturlara bağlanır → her bağlı parça TEK facet (iç dikiş çizgisi yok). Çıktı: data/library/<kategori>/<id>.json
// Girdi: 8 bit PNG (RGB / RGBA / gri). Ön plan = parlak taraf (--ters: koyu taraf). Saydam pikseller zemin sayılır.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const file = argv[0] && !argv[0].startsWith('--') && fs.existsSync(argv[0]) ? argv[0] : null;
if (!file) {
  console.log('Kullanım: node scripts/gorselden-vektor.mjs <gorsel.png> --id <id> --ad "<Ad>" [--kategori marka] [--esik 175] [--ters] [--boyut 400] [--sadelik 0.6] [--renk "#ffffff"]');
  process.exit(1);
}
const id = opt('id', path.basename(file).replace(/\.[^.]+$/, ''));
const ad = opt('ad', id);
const kategori = opt('kategori', 'marka');
const esikArg = opt('esik', null);
const ters = argv.includes('--ters');
const hedefBoyut = Number(opt('boyut', 400));
const eps = Number(opt('sadelik', 0.6));
const renk = opt('renk', '#ffffff');
const etiketler = opt('etiket', 'logo,marka').split(',').map((s) => s.trim()).filter(Boolean);

// ─── PNG çözücü ──────────────────────────────────────────────────────────────
function pngOku(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG değil');
  let off = 8;
  let w = 0, h = 0, bit = 8, ct = 2, il = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const d = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bit = d[8]; ct = d[9]; il = d[12]; }
    if (type === 'IDAT') idat.push(d);
    if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bit !== 8 || il !== 0 || ![0, 2, 4, 6].includes(ct)) throw new Error('Yalnızca 8 bit, taramasız PNG (gri / RGB / RGBA) desteklenir');
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ct];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[y * stride + x - ch] : 0;
      const b = y ? px[(y - 1) * stride + x] : 0;
      const c = x >= ch && y ? px[(y - 1) * stride + x - ch] : 0;
      let v = src[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 255;
    }
  }
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * ch;
    let l;
    let al = 255;
    if (ct === 0 || ct === 4) { l = px[o]; if (ct === 4) al = px[o + 1]; }
    else { l = 0.2126 * px[o] + 0.7152 * px[o + 1] + 0.0722 * px[o + 2]; if (ct === 6) al = px[o + 3]; }
    L[i] = al < 255 ? l * (al / 255) : l;
  }
  return { w, h, L };
}

const img = pngOku(fs.readFileSync(file));
// padding (kenara değen şekiller kapansın): 1 piksel zemin çerçevesi
const PW = img.w + 2;
const PH = img.h + 2;
const F = new Float32Array(PW * PH);
const zemin = ters ? 255 : 0;
F.fill(zemin);
for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) F[(y + 1) * PW + x + 1] = img.L[y * img.w + x];
if (ters) for (let i = 0; i < F.length; i++) F[i] = 255 - F[i];

function otsu() {
  const hist = new Array(256).fill(0);
  for (const v of F) hist[Math.max(0, Math.min(255, Math.round(v)))]++;
  const total = F.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, th = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sB += i * hist[i];
    const mB = sB / wB, mF = (sum - sB) / wF;
    const v = wB * wF * (mB - mF) ** 2;
    if (v > best) { best = v; th = i; }
  }
  return th;
}
const iso = esikArg != null ? Number(esikArg) : otsu();

// ─── marching squares (ön plan solda) ────────────────────────────────────────
const val = (x, y) => F[y * PW + x];
const ip = (a, b) => (iso - a) / (b - a);
const pts = new Map(); // kenar kimliği → [x, y]
const nextOf = new Map(); // kenar kimliği → sonraki kenar kimliği
function edge(kind, x, y, cx, cy) {
  // kind: T,R,B,L  (hücre (cx,cy): köşeler tl=(cx,cy) tr=(cx+1,cy) br=(cx+1,cy+1) bl=(cx,cy+1))
  let id;
  let p;
  if (kind === 'T') { id = `h${cx},${cy}`; p = [cx + ip(val(cx, cy), val(cx + 1, cy)), cy]; }
  else if (kind === 'B') { id = `h${cx},${cy + 1}`; p = [cx + ip(val(cx, cy + 1), val(cx + 1, cy + 1)), cy + 1]; }
  else if (kind === 'L') { id = `v${cx},${cy}`; p = [cx, cy + ip(val(cx, cy), val(cx, cy + 1))]; }
  else { id = `v${cx + 1},${cy}`; p = [cx + 1, cy + ip(val(cx + 1, cy), val(cx + 1, cy + 1))]; }
  pts.set(id, p);
  return id;
}
for (let cy = 0; cy < PH - 1; cy++) {
  for (let cx = 0; cx < PW - 1; cx++) {
    const tl = val(cx, cy) > iso, tr = val(cx + 1, cy) > iso, br = val(cx + 1, cy + 1) > iso, bl = val(cx, cy + 1) > iso;
    const m = (tl ? 1 : 0) | (tr ? 2 : 0) | (br ? 4 : 0) | (bl ? 8 : 0);
    if (m === 0 || m === 15) continue;
    const E = (k) => edge(k, 0, 0, cx, cy);
    const seg = (a, b) => nextOf.set(E(a), E(b));
    switch (m) {
      case 1: seg('L', 'T'); break;
      case 2: seg('T', 'R'); break;
      case 3: seg('L', 'R'); break;
      case 4: seg('R', 'B'); break;
      case 6: seg('T', 'B'); break;
      case 7: seg('L', 'B'); break;
      case 8: seg('B', 'L'); break;
      case 9: seg('B', 'T'); break;
      case 11: seg('B', 'R'); break;
      case 12: seg('R', 'L'); break;
      case 13: seg('R', 'T'); break;
      case 14: seg('T', 'L'); break;
      case 5: case 10: {
        const orta = (val(cx, cy) + val(cx + 1, cy) + val(cx + 1, cy + 1) + val(cx, cy + 1)) / 4 > iso;
        if (m === 5) { if (!orta) { seg('L', 'T'); seg('R', 'B'); } else { seg('R', 'T'); seg('L', 'B'); } }
        else if (!orta) { seg('T', 'R'); seg('B', 'L'); } else { seg('T', 'L'); seg('B', 'R'); }
        break;
      }
      default:
    }
  }
}
// kapalı döngüler
let loops = [];
const goruldu = new Set();
for (const start of nextOf.keys()) {
  if (goruldu.has(start)) continue;
  const loop = [];
  let cur = start;
  while (cur && !goruldu.has(cur)) {
    goruldu.add(cur);
    loop.push(pts.get(cur));
    cur = nextOf.get(cur);
  }
  if (loop.length > 3) loops.push(loop);
}

const alan = (p) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
};
loops = loops.filter((l) => Math.abs(alan(l)) > 4);

// ─── Douglas–Peucker (kapalı) ────────────────────────────────────────────────
function dp(p, e) {
  const dist = (q, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = dx * dx + dy * dy;
    if (!L) return Math.hypot(q[0] - a[0], q[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L));
    return Math.hypot(q[0] - (a[0] + t * dx), q[1] - (a[1] + t * dy));
  };
  const zincir = (c) => {
    const rec = (a, b) => {
      let mx = 0, mi = -1;
      for (let i = a + 1; i < b; i++) {
        const d = dist(c[i], c[a], c[b]);
        if (d > mx) { mx = d; mi = i; }
      }
      return mx > e ? [...rec(a, mi), ...rec(mi, b).slice(1)] : [a, b];
    };
    return rec(0, c.length - 1).map((i) => c[i]);
  };
  // kapalı döngü: 0. nokta ile en uzak nokta üzerinden iki zincire böl
  let i1 = 1;
  let best = -1;
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i][0] - p[0][0], p[i][1] - p[0][1]);
    if (d > best) { best = d; i1 = i; }
  }
  const A = zincir(p.slice(0, i1 + 1));
  const B = zincir([...p.slice(i1), p[0]]);
  const out = [...A, ...B.slice(1, -1)];
  return out.length >= 3 ? out : p;
}
loops = loops.map((l) => dp(l, eps)).filter((l) => l.length >= 3 && Math.abs(alan(l)) > 4);

// ─── iç içe yapı: dış / delik ───────────────────────────────────────────────
const icinde = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const info = loops.map((l, i) => ({ l, i, a: Math.abs(alan(l)), derin: 0, ebeveyn: -1 }));
for (const a of info) {
  let en = Infinity;
  for (const b of info) {
    if (a === b || b.a <= a.a) continue;
    if (icinde(a.l[0], b.l)) {
      a.derin++;
      if (b.a < en) { en = b.a; a.ebeveyn = b.i; }
    }
  }
}
// yönleri normalle: dış = pozitif alan işareti S, delik = ters
const S = Math.sign(alan(info.reduce((m, x) => (x.a > m.a ? x : m), info[0]).l)) || 1;
for (const x of info) {
  const dis = x.derin % 2 === 0;
  if (Math.sign(alan(x.l)) !== (dis ? S : -S)) x.l = [...x.l].reverse();
}

// ─── delikleri köprüle ──────────────────────────────────────────────────────
const kesisir = (a, b, c, d) => {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(a, b, c), d2 = o(a, b, d), d3 = o(c, d, a), d4 = o(c, d, b);
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9;
};
function bagla(dis, delik) {
  // delik köşesi ile dış köşe arasında hiçbir kenara değmeyen en kısa köprü
  let best = null;
  for (let j = 0; j < delik.length; j++) {
    for (let i = 0; i < dis.length; i++) {
      const dd = Math.hypot(dis[i][0] - delik[j][0], dis[i][1] - delik[j][1]);
      if (best && dd >= best.d) continue;
      let ok = true;
      for (let e = 0; e < dis.length && ok; e++) if (e !== i && (e + 1) % dis.length !== i && kesisir(dis[i], delik[j], dis[e], dis[(e + 1) % dis.length])) ok = false;
      for (let e = 0; e < delik.length && ok; e++) if (e !== j && (e + 1) % delik.length !== j && kesisir(dis[i], delik[j], delik[e], delik[(e + 1) % delik.length])) ok = false;
      if (ok) best = { i, j, d: dd };
    }
  }
  if (!best) best = { i: 0, j: 0, d: 0 };
  const { i, j } = best;
  const dl = [...delik.slice(j), ...delik.slice(0, j), delik[j]];
  return [...dis.slice(0, i + 1), ...dl, ...dis.slice(i)];
}
const facetler = [];
for (const x of info) {
  if (x.derin % 2 !== 0) continue;
  let poly = x.l;
  const delikler = info.filter((h) => h.derin % 2 === 1 && h.ebeveyn === x.i).sort((a, b) => b.a - a.a);
  for (const h of delikler) poly = bagla(poly, h.l);
  facetler.push(poly);
}

// ─── model ──────────────────────────────────────────────────────────────────
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const f of facetler) for (const [x, y] of f) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
const k = hedefBoyut / Math.max(maxX - minX, maxY - minY);
const pad = 8;
const r1 = (v) => Math.round(v * 10) / 10;
const model = {
  id, name: ad, tags: etiketler, size: [Math.ceil((maxX - minX) * k + pad * 2), Math.ceil((maxY - minY) * k + pad * 2)],
  palette: { a: renk }, roles: { a: 'ana' },
  variants: { koyu: { name: 'Koyu', palette: { a: '#10262b' } }, teal: { name: 'Teal', palette: { a: '#1c6e75' } } },
  facets: facetler.map((f) => ({ p: f.map(([x, y]) => [r1((x - minX) * k + pad), r1((y - minY) * k + pad)]), c: 'a', s: 0 })),
};
const dir = path.join(ROOT, 'data', 'library', kategori);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(model, null, 2) + '\n');
const toplam = model.facets.reduce((s, f) => s + f.p.length, 0);
console.log(`ok — ${kategori}/${id}: ${model.facets.length} parça, ${toplam} nokta, boyut ${model.size.join('×')}, eşik ${iso}${esikArg == null ? ' (otomatik)' : ''}`);
