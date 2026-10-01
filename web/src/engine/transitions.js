// Sahne geçişleri — scene.transitions: [{ type, t, dur, color, yon, kat, seed }]
//
// "t" kesme anıdır: içerik (katman start/end) bu anda değişir.
//   örtü tipleri (cover)  : [t - dur/2, t + dur/2] — kağıt örtü t anında ekranı tam kapatır
//   kare tipleri (snap)   : [t, t + dur]           — t'den hemen önceki kare (eski) yenisinin üstünden çekilir
// Hepsi zamanın saf fonksiyonudur (önizleme = dışa aktarım).
import { ease } from './easing.js';
import { shade } from './color.js';
import { resolveRef } from './theme.js';
import { makeCanvas } from './texture.js';

export const TRANSITIONS = {
  katlama: { name: 'Kağıt yelpaze (katlanarak)', kind: 'cover', dur: 1.2, params: ['color', 'yon', 'kat'] },
  perde: { name: 'Kağıt perde', kind: 'cover', dur: 1.2, params: ['color'] },
  iris: { name: 'İris (daire)', kind: 'cover', dur: 1.0, params: ['color'] },
  yirtik: { name: 'Yırtık kağıt', kind: 'cover', dur: 1.2, params: ['color', 'yon', 'seed'] },
  'sayfa-cevir': { name: 'Sayfa çevir', kind: 'snap', dur: 1.1, params: ['color'] },
  kaydir: { name: 'İterek kaydır', kind: 'snap', dur: 0.8, params: ['yon'] },
  yakinlas: { name: 'Yakınlaşarak geç', kind: 'snap', dur: 0.7, params: [] },
  // —— örtüler (yeni)
  jaluzi: { name: 'Jaluzi', kind: 'cover', dur: 1.0, params: ['color'] },
  mozaik: { name: 'Mozaik kareler', kind: 'cover', dur: 1.2, params: ['color', 'seed'] },
  benek: { name: 'Benekler (puantiye)', kind: 'cover', dur: 1.2, params: ['color'] },
  capraz: { name: 'Çapraz süpürme', kind: 'cover', dur: 1.0, params: ['color'] },
  seritler: { name: 'Şeritler (perde dizisi)', kind: 'cover', dur: 1.2, params: ['color'] },
  elmas: { name: 'Elmas (baklava)', kind: 'cover', dur: 1.0, params: ['color'] },
  dalga: { name: 'Dalga', kind: 'cover', dur: 1.2, params: ['color', 'yon'] },
  yildiz: { name: 'Yıldız patlaması', kind: 'cover', dur: 1.1, params: ['color'] },
  kepenk: { name: 'Kepenk', kind: 'cover', dur: 1.0, params: ['color'] },
  saat: { name: 'Saat süpürmesi', kind: 'cover', dur: 1.2, params: ['color'] },
  // —— kare tabanlı (yeni)
  solma: { name: 'Çapraz solma', kind: 'snap', dur: 0.8, params: [] },
  uzaklas: { name: 'Uzaklaşarak geç', kind: 'snap', dur: 0.8, params: [] },
  kapi: { name: 'Kapı aralanır', kind: 'snap', dur: 0.9, params: [] },
  dilim: { name: 'Dilimler kayar', kind: 'snap', dur: 1.0, params: [] },
  pikselle: { name: 'Pikselleşerek çözül', kind: 'snap', dur: 0.9, params: [] },
  'daire-ac': { name: 'Daire daralır', kind: 'snap', dur: 0.9, params: [] },
  silme: { name: 'Silme (yatay)', kind: 'snap', dur: 0.8, params: [] },
  dusen: { name: 'Düşen kart', kind: 'snap', dur: 0.9, params: [] },
  'don-kucul': { name: 'Dönerek küçül', kind: 'snap', dur: 0.9, params: [] },
  'cevir-dikey': { name: 'Dikey eksende çevir', kind: 'snap', dur: 0.9, params: [] },
  // —— örtüler (üçüncü set)
  ucgen: { name: 'Üçgenler', kind: 'cover', dur: 1.2, params: ['color'] },
  petek: { name: 'Petek (altıgen)', kind: 'cover', dur: 1.2, params: ['color'] },
  satirlar: { name: 'Satırlar (iki yönlü)', kind: 'cover', dur: 1.0, params: ['color'] },
  pencere: { name: 'Pencere (dikdörtgen)', kind: 'cover', dur: 0.9, params: ['color'] },
  barlar: { name: 'Ekolayzır çubukları', kind: 'cover', dur: 1.1, params: ['color', 'seed'] },
  ceyrek: { name: 'Çeyrek daire', kind: 'cover', dur: 1.0, params: ['color'] },
  testere: { name: 'Testere dişi', kind: 'cover', dur: 1.0, params: ['color'] },
  'x-kapan': { name: 'X kapanış', kind: 'cover', dur: 1.0, params: ['color'] },
  yelpaze: { name: 'Yelpaze açısı', kind: 'cover', dur: 1.1, params: ['color'] },
  kalp: { name: 'Kalp', kind: 'cover', dur: 1.1, params: ['color'] },
  // —— kare tabanlı (üçüncü set)
  merdiven: { name: 'Merdiven (satır satır)', kind: 'snap', dur: 1.0, params: [] },
  parcalan: { name: 'Parçalanarak küçül', kind: 'snap', dur: 1.0, params: [] },
  'yatay-dilim': { name: 'Yatay dilimler', kind: 'snap', dur: 1.0, params: [] },
  rulo: { name: 'Rulo gibi sarıl', kind: 'snap', dur: 0.9, params: [] },
  'dikey-cevir': { name: 'Yatay eksende çevir', kind: 'snap', dur: 0.9, params: [] },
  'kose-cekil': { name: 'Köşeden soyul', kind: 'snap', dur: 0.9, params: [] },
  'saat-ac': { name: 'Saat yönünde sil', kind: 'snap', dur: 1.0, params: [] },
  dalgalan: { name: 'Dalgalanarak sil', kind: 'snap', dur: 1.0, params: [] },
  'tv-kapan': { name: 'Eski TV kapanışı', kind: 'snap', dur: 0.8, params: [] },
  kapak: { name: 'Kapak (dikey aralan)', kind: 'snap', dur: 0.9, params: [] },
};

export function transitionWindow(tr) {
  const T = TRANSITIONS[tr.type];
  const d = tr.dur ?? T?.dur ?? 1;
  return T?.kind === 'snap' ? [tr.t, tr.t + d] : [tr.t - d / 2, tr.t + d / 2];
}

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// --------------------------------------------------------------- örtüler
// Hepsi sahne koordinatlarında çizilir (W × H). k: 0..1 örtü miktarı değil, ilerleme p.

function coverKatlama(ctx, W, H, p, col, tr) {
  const N = Math.max(2, Math.min(12, tr.kat ?? 5));
  const first = p < 0.5;
  const e = ease('inOutCubic', first ? p * 2 : (p - 0.5) * 2);
  const a = first ? (1 - e) * (Math.PI / 2) : e * (Math.PI / 2); // 90° = kenardan görünmez
  const pw = (W / N) * Math.cos(a);
  if (pw <= 0.5) return;
  // İlk yarı: soldan açılır; ikinci yarı: sağa doğru katlanıp kapanır (yon=sag ise tersi)
  const fromLeft = (tr.yon === 'sag') !== first;
  const light = shade(col, 0.06 + 0.1 * Math.sin(a));
  const dark = shade(col, -(0.06 + 0.16 * Math.sin(a)));
  for (let i = 0; i < N; i++) {
    const x = fromLeft ? i * pw : W - (i + 1) * pw;
    const g = ctx.createLinearGradient(x, 0, x + pw, 0);
    const c1 = i % 2 ? dark : light;
    const c2 = i % 2 ? shade(dark, -0.06) : shade(light, 0.04);
    g.addColorStop(0, fromLeft ? c1 : c2);
    g.addColorStop(1, fromLeft ? c2 : c1);
    ctx.fillStyle = g;
    ctx.fillRect(x - 0.5, 0, pw + 1, H);
    // Kırışık çizgisi
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(fromLeft ? x : x + pw - 1, 0, 1.5, H);
  }
  // Önde gelen kenarın gölgesi
  const edge = fromLeft ? N * pw : W - N * pw;
  const sg = ctx.createLinearGradient(edge, 0, edge + (fromLeft ? 40 : -40), 0);
  sg.addColorStop(0, 'rgba(30,15,5,0.35)');
  sg.addColorStop(1, 'rgba(30,15,5,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(fromLeft ? edge : edge - 40, 0, 40, H);
}

function coverPerde(ctx, W, H, p, col) {
  const e = p < 0.5 ? ease('outCubic', p * 2) : 1 - ease('inCubic', (p - 0.5) * 2);
  const w = (W / 2) * e + 1;
  ctx.save();
  ctx.shadowColor = 'rgba(30,15,5,0.4)';
  ctx.shadowBlur = 30;
  for (const left of [true, false]) {
    const x = left ? 0 : W - w;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    // Dikey kıvrımlar: perde kumaşı gibi açık/koyu şeritler
    const n = 6;
    for (let i = 0; i <= n; i++) g.addColorStop(i / n, shade(col, i % 2 ? -0.12 : 0.05));
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, H);
  }
  ctx.restore();
}

function coverIris(ctx, W, H, p, col, tr) {
  const e = p < 0.5 ? ease('inOutCubic', p * 2) : 1 - ease('inOutCubic', (p - 0.5) * 2);
  const cx = (tr.cx ?? 0.5) * W;
  const cy = (tr.cy ?? 0.5) * H;
  const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
  const r = R * (1 - e);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  if (r > 0.5) ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fillStyle = col;
  ctx.shadowColor = 'rgba(30,15,5,0.45)';
  ctx.shadowBlur = 40;
  ctx.fill('evenodd');
  ctx.restore();
  if (r > 0.5) {
    ctx.strokeStyle = shade(col, 0.2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function coverYirtik(ctx, W, H, p, col, tr) {
  const J = W * 0.07;
  const r = rng(tr.seed ?? 3);
  const steps = 28;
  const jag = Array.from({ length: steps + 1 }, () => r() * J);
  const rev = tr.yon === 'sag';
  const first = p < 0.5;
  const e = ease('inOutCubic', first ? p * 2 : (p - 0.5) * 2);
  // İlk yarı: yırtık kenar soldan sağa ilerleyerek örter; ikinci yarı: arka kenar sağa çekilerek açar
  const edge = (x0) => jag.map((j, i) => [x0 + j, (i / steps) * H]);
  const lead = first ? -J + (W + 2 * J) * e : W + J;
  const tail = first ? -J * 2 : -J + (W + 2 * J) * e;
  ctx.save();
  if (rev) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  const A = edge(lead);
  const B = edge(tail);
  const poly = [...B, ...A.slice().reverse()];
  ctx.shadowColor = 'rgba(30,15,5,0.4)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = col;
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // Yırtık kenardaki açık renkli lif şeridi
  ctx.fillStyle = shade(col, 0.45);
  for (const [E, dir] of [[A, -1], [B, 1]]) {
    if ((E === A && lead > W + J - 1) || (E === B && tail < -J)) continue;
    ctx.beginPath();
    E.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = E.length - 1; i >= 0; i--) ctx.lineTo(E[i][0] + dir * (5 + (i % 3) * 2), E[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// -------------------------------------------------- kare tabanlı geçişler
// Cihaz pikseli uzayında çalışır. old: eski kare (tuval), cur: şu anki kare (tuval)

function snapSayfa(ctx, old, cur, rect, p, col) {
  const { x, y, w, h } = rect;
  const e = ease('inOutSine', p);
  const fx = w * (1 - e); // katlama çizgisi (soldan uzaklık)
  // Eski sayfanın düz kalan kısmı
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, fx, h);
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x, y, w, h);
  ctx.restore();
  // Katlanan kanadın arka yüzü (kağıt) + katlama gölgesi
  const fw = Math.min(w - fx, fx);
  if (fw > 0.5) {
    const g = ctx.createLinearGradient(x + fx - fw, 0, x + fx, 0);
    g.addColorStop(0, shade(col, 0.05));
    g.addColorStop(0.75, shade(col, -0.05));
    g.addColorStop(1, shade(col, -0.25));
    ctx.fillStyle = g;
    ctx.fillRect(x + fx - fw, y, fw, h);
    const sg = ctx.createLinearGradient(x + fx, 0, x + fx + Math.min(60, w * 0.08), 0);
    sg.addColorStop(0, 'rgba(0,0,0,0.35)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(x + fx, y, Math.min(60, w * 0.08), h);
  }
}

function snapKaydir(ctx, old, cur, rect, p, tr) {
  const { x, y, w, h } = rect;
  const e = ease('inOutCubic', p);
  const vert = tr.yon === 'yukari' || tr.yon === 'asagi';
  const sgn = tr.yon === 'sag' || tr.yon === 'asagi' ? -1 : 1;
  const dx = vert ? 0 : -sgn * w * e;
  const dy = vert ? -sgn * h * e : 0;
  ctx.clearRect(x, y, w, h);
  ctx.drawImage(old, x, y, w, h, x + dx, y + dy, w, h);
  ctx.drawImage(cur, x, y, w, h, x + dx + (vert ? 0 : sgn * w), y + dy + (vert ? sgn * h : 0), w, h);
}

function snapYakinlas(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inCubic', p);
  const s = 1 + e * 0.7;
  ctx.save();
  ctx.globalAlpha = 1 - ease('inOutSine', p);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x + (w - w * s) / 2, y + (h - h * s) / 2, w * s, h * s);
  ctx.restore();
}

// ------------------------------------------------ yeni örtüler
// p: 0..1 ilerleme; örtü p=0.5'te ekranı tam kapatır.
const cov = (p) => (p < 0.5 ? ease('inOutCubic', p * 2) : 1 - ease('inOutCubic', (p - 0.5) * 2));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function paperShadow(ctx) {
  ctx.shadowColor = 'rgba(30,15,5,0.3)';
  ctx.shadowBlur = 14;
}

function coverJaluzi(ctx, W, H, p, col) {
  const e = cov(p);
  const N = 8;
  const bh = H / N;
  ctx.fillStyle = col;
  paperShadow(ctx);
  for (let i = 0; i < N; i++) {
    const h = bh * e + (e > 0.99 ? 1 : 0);
    ctx.fillRect(0, i * bh + (bh - h) / 2, W, h);
  }
}

function coverMozaik(ctx, W, H, p, col, tr) {
  const e = cov(p);
  const cols = 8;
  const cw = W / cols;
  const rows = Math.ceil(H / cw);
  const r = rng(tr.seed ?? 7);
  ctx.fillStyle = col;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const s = clamp01((e * 1.5 - r() * 0.5) / 0.5);
      if (s <= 0) continue;
      const w = cw * s + (s >= 1 ? 1 : 0);
      ctx.fillRect(i * cw + (cw - w) / 2, j * cw + (cw - w) / 2, w, w);
    }
  }
}

function coverBenek(ctx, W, H, p, col) {
  const e = cov(p);
  const cols = 7;
  const cw = W / cols;
  const rows = Math.ceil(H / cw);
  const R = Math.hypot(cw, cw) / 2 + 1;
  ctx.fillStyle = col;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const d = (i / cols + j / rows) / 2;
      const s = clamp01((e * 1.4 - d * 0.4) / 1);
      if (s <= 0) continue;
      ctx.beginPath();
      ctx.arc(i * cw + cw / 2, j * cw + cw / 2, R * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function coverCapraz(ctx, W, H, p, col) {
  const first = p < 0.5;
  const e = ease('inOutCubic', first ? p * 2 : (p - 0.5) * 2);
  const lead = first ? -0.05 + 2.1 * e : 2.2;
  const tail = first ? -0.2 : -0.05 + 2.1 * e;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.beginPath();
  ctx.moveTo(tail * W, 0);
  ctx.lineTo(lead * W, 0);
  ctx.lineTo(0, lead * H);
  ctx.lineTo(0, tail * H);
  ctx.closePath();
  ctx.fill();
}

function coverSeritler(ctx, W, H, p, col) {
  const e = cov(p);
  const N = 6;
  const sw = W / N;
  ctx.fillStyle = col;
  paperShadow(ctx);
  for (let i = 0; i < N; i++) {
    const s = clamp01(e * 1.8 - (i / (N - 1)) * 0.8);
    const h = H * s;
    ctx.fillRect(i * sw, i % 2 ? H - h : 0, sw + 1, h);
  }
}

function coverElmas(ctx, W, H, p, col) {
  const r = (W / 2 + H / 2 + 12) * cov(p);
  if (r < 0.5) return;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.beginPath();
  ctx.moveTo(W / 2, H / 2 - r);
  ctx.lineTo(W / 2 + r, H / 2);
  ctx.lineTo(W / 2, H / 2 + r);
  ctx.lineTo(W / 2 - r, H / 2);
  ctx.closePath();
  ctx.fill();
}

function coverDalga(ctx, W, H, p, col, tr) {
  const first = p < 0.5;
  const e = ease('inOutCubic', first ? p * 2 : (p - 0.5) * 2);
  const A = W * 0.06;
  const steps = 40;
  const edge = (x0, ph) => Array.from({ length: steps + 1 }, (_, i) => [x0 + A * Math.sin((i / steps) * Math.PI * 4 + ph), (i / steps) * H]);
  const lead = first ? -A + (W + 2 * A) * e : W + A;
  const tail = first ? -A * 2 : -A + (W + 2 * A) * e;
  const A1 = edge(lead, p * 8);
  const B1 = edge(tail, p * 8 + 1);
  ctx.save();
  if (tr.yon === 'sag') {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.beginPath();
  [...B1, ...A1.slice().reverse()].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function coverYildiz(ctx, W, H, p, col) {
  const e = cov(p);
  const R = Math.hypot(W, H) * 1.05 * e;
  if (R < 1) return;
  const rot = -Math.PI / 2 + e * 1.2;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? R * 0.5 : R;
    const a = rot + (i * Math.PI) / 5;
    const x = W / 2 + Math.cos(a) * rr;
    const y = H / 2 + Math.sin(a) * rr;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function coverKepenk(ctx, W, H, p, col) {
  const e = cov(p);
  const h = (H / 2 + 1) * e;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(30,15,5,0.12)';
  const gap = H / 24;
  for (let y = gap; y < h; y += gap) {
    ctx.fillRect(0, y, W, 1.5);
    ctx.fillRect(0, H - y, W, 1.5);
  }
}

function coverSaat(ctx, W, H, p, col) {
  const first = p < 0.5;
  const e = ease('inOutSine', first ? p * 2 : (p - 0.5) * 2);
  const a0 = -Math.PI / 2 + (first ? 0 : e * Math.PI * 2);
  const a1 = -Math.PI / 2 + (first ? e * Math.PI * 2 : Math.PI * 2);
  if (a1 - a0 < 0.001) return;
  const R = Math.hypot(W, H);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(W / 2, H / 2);
  ctx.arc(W / 2, H / 2, R, a0, a1);
  ctx.closePath();
  ctx.fill();
}

const COVERS = {
  katlama: coverKatlama, perde: coverPerde, iris: coverIris, yirtik: coverYirtik,
  jaluzi: coverJaluzi, mozaik: coverMozaik, benek: coverBenek, capraz: coverCapraz, seritler: coverSeritler,
  elmas: coverElmas, dalga: coverDalga, yildiz: coverYildiz, kepenk: coverKepenk, saat: coverSaat,
};

// ------------------------------------------------ yeni kare tabanlı geçişler
// Altta yeni kare durur; eski kare (old) üzerine çeşitli biçimlerde çekilir.

function snapSolma(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.globalAlpha = 1 - ease('inOutSine', p);
  ctx.drawImage(old, x, y, w, h, x, y, w, h);
  ctx.restore();
}

function snapUzaklas(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inOutCubic', p);
  const s = 1 - e * 0.55;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = 1 - ease('inCubic', p);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 24;
  ctx.drawImage(old, x, y, w, h, x + (w - w * s) / 2, y + (h - h * s) / 2, w * s, h * s);
  ctx.restore();
}

function snapKapi(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const dx = (w / 2) * ease('inOutCubic', p);
  const hw = w / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 20;
  ctx.drawImage(old, x, y, hw, h, x - dx, y, hw, h);
  ctx.drawImage(old, x + hw, y, hw, h, x + hw + dx, y, hw, h);
  ctx.restore();
}

function snapDilim(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const N = 8;
  const sw = w / N;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 0; i < N; i++) {
    const s = ease('inOutCubic', clamp01(p * 1.6 - (i / (N - 1)) * 0.6));
    const dy = (i % 2 ? 1 : -1) * h * s;
    ctx.drawImage(old, x + i * sw, y, sw + 1, h, x + i * sw, y + dy, sw + 1, h);
  }
  ctx.restore();
}

let bufC = null;
function snapPikselle(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const block = 2 + ease('inCubic', p) * Math.max(24, w / 10);
  const sw = Math.max(1, Math.round(w / block));
  const sh = Math.max(1, Math.round(h / block));
  if (!bufC) bufC = makeCanvas(sw, sh);
  if (bufC.width !== sw || bufC.height !== sh) {
    bufC.width = sw;
    bufC.height = sh;
  }
  const c = bufC.getContext('2d');
  c.clearRect(0, 0, sw, sh);
  c.drawImage(old, x, y, w, h, 0, 0, sw, sh);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1 - p * p;
  ctx.drawImage(bufC, 0, 0, sw, sh, x, y, w, h);
  ctx.restore();
}

function snapDaireAc(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const R = Math.hypot(w, h) / 2 + 4;
  const r = R * (1 - ease('inOutCubic', p));
  if (r < 0.5) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  ctx.stroke();
}

function snapSilme(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inOutCubic', p);
  const cx = x + w * e;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx, y, w - w * e, h);
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x, y, w, h);
  ctx.restore();
  if (e > 0.001 && e < 0.999) {
    const sg = ctx.createLinearGradient(cx, 0, cx + 36, 0);
    sg.addColorStop(0, 'rgba(0,0,0,0.3)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(cx, y, 36, h);
  }
}

function snapDusen(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inQuad', p);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2 + h * 1.3 * e);
  ctx.rotate(e * 0.45);
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 24;
  ctx.drawImage(old, x, y, w, h, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function snapDonKucul(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inOutCubic', p);
  const s = 1 - e;
  if (s < 0.01) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(e * Math.PI * 1.2);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 24;
  ctx.drawImage(old, x, y, w, h, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function snapCevirDikey(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const a = ease('inOutSine', p) * (Math.PI / 2);
  const sx = Math.cos(a);
  if (sx < 0.01) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x + (w - w * sx) / 2, y, w * sx, h);
  ctx.fillStyle = `rgba(0,0,0,${0.35 * Math.sin(a)})`;
  ctx.fillRect(x + (w - w * sx) / 2, y, w * sx, h);
  ctx.restore();
}

const SNAPS = {
  solma: snapSolma, uzaklas: snapUzaklas, kapi: snapKapi, dilim: snapDilim, pikselle: snapPikselle,
  'daire-ac': snapDaireAc, silme: snapSilme, dusen: snapDusen, 'don-kucul': snapDonKucul, 'cevir-dikey': snapCevirDikey,
};

// ------------------------------------------------ üçüncü set: örtüler

function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function regular(ctx, cx, cy, R, n, rot) {
  poly(ctx, Array.from({ length: n }, (_, i) => [cx + Math.cos(rot + (i * 2 * Math.PI) / n) * R, cy + Math.sin(rot + (i * 2 * Math.PI) / n) * R]));
}

function coverUcgen(ctx, W, H, p, col) {
  const e = cov(p);
  const cols = 6;
  const cw = W / cols;
  const rows = Math.ceil(H / cw);
  ctx.fillStyle = col;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const s = clamp01(e * 1.5 - ((i + j) / (cols + rows)) * 0.5);
      if (s <= 0) continue;
      regular(ctx, i * cw + cw / 2, j * cw + cw / 2, cw * 1.5 * s, 3, (i + j) % 2 ? Math.PI / 2 : -Math.PI / 2);
    }
  }
}

function coverPetek(ctx, W, H, p, col) {
  const e = cov(p);
  const cw = W / 6;
  const rows = Math.ceil(H / (cw * 0.87)) + 1;
  ctx.fillStyle = col;
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i <= 6; i++) {
      const cx = i * cw + (j % 2 ? cw / 2 : 0) + cw / 2;
      const cy = j * cw * 0.87;
      const d = Math.hypot(cx - W / 2, cy - H / 2) / Math.hypot(W / 2, H / 2);
      const s = clamp01(e * 1.5 - d * 0.5);
      if (s > 0) regular(ctx, cx, cy, cw * 0.72 * s + (s >= 1 ? 1 : 0), 6, Math.PI / 6);
    }
  }
}

function coverSatirlar(ctx, W, H, p, col) {
  const e = cov(p);
  const N = 7;
  const bh = H / N;
  ctx.fillStyle = col;
  paperShadow(ctx);
  for (let i = 0; i < N; i++) {
    const s = clamp01(e * 1.7 - (i / (N - 1)) * 0.7);
    const w = (W + 1) * s;
    ctx.fillRect(i % 2 ? W - w : 0, i * bh, w, bh + 1);
  }
}

function coverPencere(ctx, W, H, p, col) {
  const e = cov(p);
  const w = (W + 2) * e;
  const h = (H + 2) * e;
  if (w < 1) return;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.fillRect((W - w) / 2, (H - h) / 2, w, h);
}

function coverBarlar(ctx, W, H, p, col, tr) {
  const e = cov(p);
  const N = 10;
  const bw = W / N;
  const r = rng(tr.seed ?? 11);
  ctx.fillStyle = col;
  paperShadow(ctx);
  for (let i = 0; i < N; i++) {
    const s = clamp01((e * 1.7 - r() * 0.7) / 1);
    ctx.fillRect(i * bw, H - H * s, bw + 1, H * s + 1);
  }
}

function coverCeyrek(ctx, W, H, p, col) {
  const R = Math.hypot(W, H) * 1.02 * cov(p);
  if (R < 1) return;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.beginPath();
  ctx.arc(0, H, R, 0, Math.PI * 2);
  ctx.fill();
}

function coverTestere(ctx, W, H, p, col) {
  const first = p < 0.5;
  const e = ease('inOutCubic', first ? p * 2 : (p - 0.5) * 2);
  const A = H * 0.07;
  const n = 10;
  const edge = (y0) => Array.from({ length: n * 2 + 1 }, (_, i) => [(i / (n * 2)) * W, y0 + (i % 2 ? A : 0)]);
  const lead = first ? -A + (H + 2 * A) * e : H + A;
  const tail = first ? -A * 2 : -A + (H + 2 * A) * e;
  ctx.fillStyle = col;
  paperShadow(ctx);
  poly(ctx, [...edge(tail), ...edge(lead).reverse()]);
}

function coverXKapan(ctx, W, H, p, col) {
  const k = cov(p);
  const cx = W / 2;
  const cy = H / 2;
  ctx.fillStyle = col;
  poly(ctx, [[0, 0], [W, 0], [cx, cy * k]]);
  poly(ctx, [[W, 0], [W, H], [W - cx * k, cy]]);
  poly(ctx, [[W, H], [0, H], [cx, H - cy * k]]);
  poly(ctx, [[0, H], [0, 0], [cx * k, cy]]);
  if (k > 0.98) ctx.fillRect(0, 0, W, H);
}

function coverYelpaze(ctx, W, H, p, col) {
  const first = p < 0.5;
  const e = ease('inOutSine', first ? p * 2 : (p - 0.5) * 2);
  const a0 = Math.PI + (first ? 0 : e * Math.PI);
  const a1 = Math.PI + (first ? e * Math.PI : Math.PI);
  if (a1 - a0 < 0.001) return;
  ctx.fillStyle = col;
  paperShadow(ctx);
  ctx.beginPath();
  ctx.moveTo(W / 2, H);
  ctx.arc(W / 2, H, Math.hypot(W, H), a0, a1);
  ctx.closePath();
  ctx.fill();
}

function coverKalp(ctx, W, H, p, col) {
  const e = cov(p);
  const S = Math.hypot(W, H) * 0.8 * e;
  if (S < 1) return;
  ctx.save();
  ctx.translate(W / 2, H / 2 + S * 0.05);
  ctx.scale(S, S);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, 0.55);
  ctx.bezierCurveTo(-1.1, -0.1, -0.7, -0.75, 0, -0.3);
  ctx.bezierCurveTo(0.7, -0.75, 1.1, -0.1, 0, 0.55);
  ctx.closePath();
  paperShadow(ctx);
  ctx.fill();
  ctx.restore();
  if (e > 0.85) {
    ctx.save();
    ctx.globalAlpha = clamp01((e - 0.85) / 0.15);
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

Object.assign(COVERS, {
  ucgen: coverUcgen, petek: coverPetek, satirlar: coverSatirlar, pencere: coverPencere, barlar: coverBarlar,
  ceyrek: coverCeyrek, testere: coverTestere, 'x-kapan': coverXKapan, yelpaze: coverYelpaze, kalp: coverKalp,
});

// ------------------------------------------------ üçüncü set: kare tabanlı

function clipRect(ctx, { x, y, w, h }) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
}

function snapMerdiven(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const N = 6;
  const rh = h / N;
  ctx.save();
  clipRect(ctx, rect);
  for (let i = 0; i < N; i++) {
    const s = ease('inOutCubic', clamp01(p * 1.7 - (i / (N - 1)) * 0.7));
    ctx.drawImage(old, x, y + i * rh, w, rh + 1, x + (i % 2 ? 1 : -1) * w * s, y + i * rh, w, rh + 1);
  }
  ctx.restore();
}

function snapParcalan(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const N = 6;
  const tw = w / N;
  const th = h / N;
  const r = rng(5);
  ctx.save();
  clipRect(ctx, rect);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const s = clamp01(p * 1.6 - r() * 0.6);
      const k = 1 - ease('inCubic', s);
      if (k <= 0.01) continue;
      ctx.drawImage(old, x + i * tw, y + j * th, tw, th, x + i * tw + (tw * (1 - k)) / 2, y + j * th + (th * (1 - k)) / 2, tw * k, th * k);
    }
  }
  ctx.restore();
}

function snapYatayDilim(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const N = 10;
  const rh = h / N;
  ctx.save();
  clipRect(ctx, rect);
  for (let i = 0; i < N; i++) {
    const s = ease('inOutCubic', clamp01(p * 1.5 - (i / (N - 1)) * 0.5));
    ctx.drawImage(old, x, y + i * rh, w, rh + 1, x + (i % 2 ? w : -w) * s, y + i * rh, w, rh + 1);
  }
  ctx.restore();
}

function snapRulo(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inOutCubic', p);
  const vis = h * (1 - e);
  if (vis < 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, vis);
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x, y - h * e, w, h);
  ctx.restore();
  const rr = Math.min(28, h * 0.08);
  const g = ctx.createLinearGradient(0, y + vis - rr, 0, y + vis + rr * 0.4);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y + vis - rr, w, rr * 1.4);
}

function snapDikeyCevir(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const a = ease('inOutSine', p) * (Math.PI / 2);
  const sy = Math.cos(a);
  if (sy < 0.01) return;
  ctx.save();
  clipRect(ctx, rect);
  ctx.drawImage(old, x, y, w, h, x, y + (h - h * sy) / 2, w, h * sy);
  ctx.fillStyle = `rgba(0,0,0,${0.35 * Math.sin(a)})`;
  ctx.fillRect(x, y + (h - h * sy) / 2, w, h * sy);
  ctx.restore();
}

function snapKoseCekil(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const c = ease('inOutCubic', p) * 2;
  ctx.save();
  clipRect(ctx, rect);
  ctx.beginPath();
  ctx.moveTo(x + c * w, y);
  ctx.lineTo(x + 4 * w, y);
  ctx.lineTo(x + 4 * w, y + 4 * h);
  ctx.lineTo(x, y + 4 * h);
  ctx.lineTo(x, y + c * h);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x, y, w, h);
  ctx.restore();
  if (c > 0.01 && c < 1.99) {
    ctx.save();
    clipRect(ctx, rect);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + c * w, y);
    ctx.lineTo(x, y + c * h);
    ctx.stroke();
    ctx.restore();
  }
}

function snapSaatAc(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const e = ease('inOutSine', p);
  const a0 = -Math.PI / 2 + e * Math.PI * 2;
  if (Math.PI * 2 - e * Math.PI * 2 < 0.001) return;
  ctx.save();
  clipRect(ctx, rect);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h / 2);
  ctx.arc(x + w / 2, y + h / 2, Math.hypot(w, h), a0, Math.PI * 1.5);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(old, x, y, w, h, x, y, w, h);
  ctx.restore();
}

function snapDalgalan(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const N = 48;
  const rh = h / N;
  const amp = w * 0.09 * Math.sin(Math.PI * Math.min(1, p * 1.3));
  ctx.save();
  clipRect(ctx, rect);
  ctx.globalAlpha = 1 - ease('inQuad', p);
  for (let i = 0; i < N; i++) {
    ctx.drawImage(old, x, y + i * rh, w, rh + 1, x + Math.sin(i * 0.5 + p * 10) * amp, y + i * rh, w, rh + 1);
  }
  ctx.restore();
}

function snapTvKapan(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  clipRect(ctx, rect);
  if (p < 0.6) {
    const sy = Math.max(0.012, 1 - ease('inCubic', p / 0.6));
    ctx.drawImage(old, x, y, w, h, x, cy - (h * sy) / 2, w, h * sy);
  } else {
    const sx = 1 - ease('inOutCubic', (p - 0.6) / 0.4);
    if (sx > 0.01) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 16;
      ctx.fillRect(cx - (w * sx) / 2, cy - 2, w * sx, 4);
    }
  }
  ctx.restore();
}

function snapKapak(ctx, old, cur, rect, p) {
  const { x, y, w, h } = rect;
  const dy = (h / 2) * ease('inOutCubic', p);
  const hh = h / 2;
  ctx.save();
  clipRect(ctx, rect);
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 20;
  ctx.drawImage(old, x, y, w, hh, x, y - dy, w, hh);
  ctx.drawImage(old, x, y + hh, w, hh, x, y + hh + dy, w, hh);
  ctx.restore();
}

Object.assign(SNAPS, {
  merdiven: snapMerdiven, parcalan: snapParcalan, 'yatay-dilim': snapYatayDilim, rulo: snapRulo,
  'dikey-cevir': snapDikeyCevir, 'kose-cekil': snapKoseCekil, 'saat-ac': snapSaatAc, dalgalan: snapDalgalan,
  'tv-kapan': snapTvKapan, kapak: snapKapak,
});

let bufA = null;
let bufB = null;
function buf(which, w, h) {
  let b = which === 'A' ? bufA : bufB;
  if (!b || b.width !== w || b.height !== h) {
    b = makeCanvas(w, h);
    if (which === 'A') bufA = b;
    else bufB = b;
  }
  return b;
}

/**
 * Etkin geçişleri çizer. base: sahne → cihaz dönüşümü (renderFrame başındaki).
 * renderOld(ctx2, tt): eski kareyi geçişsiz ve son işlemsiz çizer.
 */
export function drawTransitions(ctx, base, scene, t, th, renderOld) {
  const list = scene.transitions;
  if (!list?.length) return;
  const W = scene.width;
  const H = scene.height;
  for (const tr of list) {
    const T = TRANSITIONS[tr.type];
    if (!T || tr.off) continue;
    const [a, b] = transitionWindow(tr);
    if (t < a || t > b) continue;
    const p = Math.max(0, Math.min(1, (t - a) / (b - a || 1)));
    const col = resolveRef(tr.color || (th?.colors?.arka2 ? '$arka2' : '#efe3cf'), th);
    if (T.kind === 'cover') {
      ctx.save();
      ctx.setTransform(base);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      (COVERS[tr.type] || coverYirtik)(ctx, W, H, p, col, tr);
      ctx.restore();
    } else {
      // Sahne alanının cihaz pikseli dikdörtgeni
      const rect = {
        x: Math.round(base.e),
        y: Math.round(base.f),
        w: Math.round(W * base.a),
        h: Math.round(H * base.d),
      };
      const cw = ctx.canvas.width;
      const ch = ctx.canvas.height;
      const cur = buf('A', cw, ch);
      const cc = cur.getContext('2d');
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.clearRect(0, 0, cw, ch);
      cc.drawImage(ctx.canvas, 0, 0);
      const old = buf('B', cw, ch);
      const oc = old.getContext('2d');
      oc.setTransform(1, 0, 0, 1, 0, 0);
      oc.clearRect(0, 0, cw, ch);
      oc.setTransform(base);
      renderOld(oc, tr.t - 1 / (scene.fps || 30));
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (tr.type === 'sayfa-cevir') snapSayfa(ctx, old, cur, rect, p, col);
      else if (tr.type === 'kaydir') snapKaydir(ctx, old, cur, rect, p, tr);
      else if (SNAPS[tr.type]) SNAPS[tr.type](ctx, old, cur, rect, p, tr);
      else snapYakinlas(ctx, old, cur, rect, p);
      ctx.restore();
    }
  }
}
