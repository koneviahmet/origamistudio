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
      if (tr.type === 'katlama') coverKatlama(ctx, W, H, p, col, tr);
      else if (tr.type === 'perde') coverPerde(ctx, W, H, p, col);
      else if (tr.type === 'iris') coverIris(ctx, W, H, p, col, tr);
      else coverYirtik(ctx, W, H, p, col, tr);
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
      else snapYakinlas(ctx, old, cur, rect, p);
      ctx.restore();
    }
  }
}
