// Karakter yüzü: duygu karışımı, göz / kaş / ağız / yanak çizimi, gözyaşı – ter – buhar süsleri.
// Baş çerçevesinde çizer: orijin = baş merkezi, hrx/hry = baş yarıçapları.
import { EMOTIONS } from './characterData.js';
import { DEG, TAU, clamp01, lerp, fillCircle, fillEllipse, rr, starPath, heartPath, strokeLine } from './characterDraw.js';

const NOTR = EMOTIONS.notr;
const num = (v, d = 0) => (typeof v === 'number' ? v : d);

/** Eksik alanları tamamlanmış yüz nesnesi */
function norm(e) {
  const a = e.agiz || {};
  return {
    goz: e.goz || 'nokta',
    ac: num(e.ac, 1),
    kas: [0, 1, 2, 3].map((i) => num((e.kas || [])[i])),
    agiz: { egri: num(a.egri), ac: num(a.ac), gen: num(a.gen, 1), dis: num(a.dis), dil: num(a.dil), dalga: num(a.dalga) },
    kizar: num(e.kizar), gozyasi: num(e.gozyasi), ter: num(e.ter), buhar: num(e.buhar),
    bakis: [num((e.bakis || [])[0]), num((e.bakis || [])[1])],
  };
}

export function blendFace(a, b, w) {
  if (w <= 0) return a;
  if (w >= 1 && !(w > 1)) return b;
  const A = norm(a);
  const B = norm(b);
  const L = (x, y) => lerp(x, y, w);
  return {
    goz: w < 0.5 ? A.goz : B.goz,
    ac: L(A.ac, B.ac),
    kas: A.kas.map((v, i) => L(v, B.kas[i])),
    agiz: Object.fromEntries(Object.keys(A.agiz).map((k) => [k, L(A.agiz[k], B.agiz[k])])),
    kizar: L(A.kizar, B.kizar), gozyasi: L(A.gozyasi, B.gozyasi), ter: L(A.ter, B.ter), buhar: L(A.buhar, B.buhar),
    bakis: [L(A.bakis[0], B.bakis[0]), L(A.bakis[1], B.bakis[1])],
  };
}

/** Duygu adı → yüz nesnesi (karakterin kendi duyguları öncelikli); siddet 0–1.5 */
export function faceOf(C, name, siddet = 1) {
  const e = C?.duygular?.[name] || EMOTIONS[name] || NOTR;
  const f = norm(e);
  if (siddet === 1) return f;
  return norm(blendFace(norm(NOTR), f, siddet));
}

/** Göz kırpma çarpanı: 1 açık … 0 kapalı (deterministik, karaktere özgü ritim) */
export function blinkAt(t, seed) {
  const period = 3.1 + (seed % 7) * 0.13;
  const ph = ((t + (seed % 13) * 0.37) % period) / period;
  const w = 0.11 / period;
  if (ph > w) return 1;
  const x = ph / w;
  return Math.abs(x * 2 - 1);
}

// ════════════════════════════════════════════════════════════════════════════
export function drawFace(ctx, C, f, hrx, hry, o) {
  const y = C.yuz || {};
  const c = o.c;
  const lw = C.cizgi.kalinlik;
  const ex = 0.4 * hrx * (y.aralik ?? 1);
  const ey = (-0.06 + (y.yukseklik ?? 0)) * hry;
  const er = 0.105 * Math.min(hrx, hry) * (y.boyut ?? 1);
  const [lx, ly] = o.look;
  const open = clamp01(f.ac * o.blink);
  const style = y.goz || 'nokta';
  const ink = y.ekran ? c.led : c.cizgi;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // robot ekranı (koyu yüz paneli)
  if (y.ekran) {
    rr(ctx, -hrx * 0.86, -hry * 0.62, hrx * 1.72, hry * 1.34, hry * 0.28);
    ctx.fillStyle = y.ekran;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // yanaklar
  const kz = Math.max(f.kizar, y.yanakGuc || 0);
  if (kz > 0.03) {
    ctx.save();
    ctx.globalAlpha *= 0.55 * clamp01(kz);
    for (const s of [-1, 1]) fillEllipse(ctx, s * 0.66 * hrx, 0.24 * hry, 0.17 * hrx, 0.1 * hry, 0, c.yanak);
    ctx.restore();
  }

  // gözler
  for (const s of [-1, 1]) {
    const gx = s * ex;
    switch (f.goz) {
      case 'kapali':
        ctx.beginPath();
        ctx.arc(gx, ey - er * 0.4, er * 1.6, 0.14 * Math.PI, 0.86 * Math.PI);
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw * 0.9;
        ctx.stroke();
        break;
      case 'mutlu':
        ctx.beginPath();
        ctx.arc(gx, ey + er * 1.0, er * 1.6, 1.14 * Math.PI, 1.86 * Math.PI);
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw * 0.9;
        ctx.stroke();
        break;
      case 'yildiz':
        starPath(ctx, gx, ey, er * 2.3, 0.45);
        ctx.fillStyle = '#ffcf33';
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw * 0.5;
        ctx.stroke();
        break;
      case 'kalp':
        heartPath(ctx, gx, ey, er * 1.45);
        ctx.fillStyle = '#ff4d6d';
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw * 0.5;
        ctx.stroke();
        break;
      case 'kizgin':
        fillEllipse(ctx, gx + lx * 0.07 * hrx, ey + ly * 0.06 * hry, er * 1.5, Math.max(er * 0.2, er * 0.85 * open), -s * 0.5, c.goz);
        break;
      case 'yarim':
        fillEllipse(ctx, gx + lx * 0.07 * hrx, ey + er * 0.25 + ly * 0.06 * hry, er * 1.05, Math.max(er * 0.12, er * 0.6 * open), 0, c.goz);
        strokeLine(ctx, [[gx - er * 1.6, ey - er * 0.3], [gx + er * 1.6, ey - er * 0.3]], ink, lw * 0.85);
        break;
      default: {
        const wide = f.goz === 'genis';
        if (style === 'buyuk') {
          const rx = er * (wide ? 2.1 : 1.8);
          const ry = Math.max(er * 0.25, (y.gozYuvarlak ? rx / (wide ? 1 : 1) * 1 : er * (wide ? 2.5 : 2.2)) * open);
          fillEllipse(ctx, gx, ey, rx, ry, 0, '#ffffff', ink, lw * 0.7);
          if (open > 0.2) {
            const px = gx + lx * er * 0.7;
            const py = ey + ly * er * 0.8;
            const pr = Math.min(ry * 0.92, er * (wide ? 0.95 : 1.2) * (y.pupilBoyut ?? 1));
            const gr = ctx.createRadialGradient(px, py + pr * 0.3, pr * 0.1, px, py, pr);
            gr.addColorStop(0, c.irisLight || c.iris);
            gr.addColorStop(1, c.iris);
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(gx, ey, rx - 1, ry - 1, 0, 0, TAU);
            ctx.clip();
            fillCircle(ctx, px, py, pr, gr);
            if (y.pupil === 'yarik') fillEllipse(ctx, px, py, pr * 0.2, pr * 0.92, 0, '#101018');
            else fillCircle(ctx, px, py, pr * 0.5, '#101018');
            fillCircle(ctx, px - pr * 0.32, py - pr * 0.36, pr * 0.3, '#ffffff');
            fillCircle(ctx, px + pr * 0.3, py + pr * 0.34, pr * 0.14, 'rgba(255,255,255,0.85)');
            ctx.restore();
          }
          ctx.beginPath();
          ctx.ellipse(gx, ey, rx, ry, 0, Math.PI * 1.06, Math.PI * 1.94);
          ctx.strokeStyle = ink;
          ctx.lineWidth = lw * 1.15;
          ctx.stroke();
          if (y.kirpik) {
            for (const k of [0, 1, 2]) {
              const a = Math.PI * (s < 0 ? 1.1 + k * 0.1 : 1.9 - k * 0.1);
              strokeLine(ctx, [[gx + Math.cos(a) * rx, ey + Math.sin(a) * ry], [gx + Math.cos(a) * (rx + er * 0.8), ey + Math.sin(a) * (ry + er * 0.5) - er * 0.2]], ink, lw * 0.7);
            }
          }
        } else if (style === 'oval') {
          fillEllipse(ctx, gx + lx * 0.07 * hrx, ey + ly * 0.06 * hry, er * (wide ? 1.2 : 0.9), Math.max(er * 0.15, er * (wide ? 1.9 : 1.5) * open), 0, c.goz);
        } else if (style === 'ekran') {
          const h = er * 2.4 * (0.25 + 0.75 * open) * (wide ? 1.25 : 1);
          ctx.save();
          ctx.shadowColor = c.goz;
          ctx.shadowBlur = er * 1.6;
          rr(ctx, gx - er * 1.25 + lx * er, ey - h / 2 + ly * er * 0.5, er * 2.5, h, er * 0.7);
          ctx.fillStyle = c.goz;
          ctx.fill();
          ctx.restore();
        } else if (wide) {
          fillCircle(ctx, gx, ey, er * 2.0 * (0.4 + 0.6 * open), '#ffffff', ink, lw * 0.7);
          fillCircle(ctx, gx + lx * er * 0.6, ey + ly * er * 0.6, er * 0.8, c.goz);
        } else {
          fillEllipse(ctx, gx + lx * 0.1 * hrx, ey + ly * 0.08 * hry, er, Math.max(er * 0.14, er * open), 0, c.goz);
        }
      }
    }
  }

  // kaşlar (yalnızca ifade varsa)
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const ang = f.kas[i];
    const up = f.kas[2 + i];
    if (Math.abs(ang) < (y.kasEsik ?? 2.5) && Math.abs(up) < (y.kasEsik ? 0.3 : 0.08)) {
      if (y.kasSabit) {
        const cx = s * ex;
        const cy = ey - er * 2.45 - hry * 0.12;
        strokeLine(ctx, [[cx - hrx * 0.17, cy + 3], [cx, cy - 2], [cx + hrx * 0.17, cy + 3]], ink, lw * 0.7);
      }
      continue;
    }
    const cx = s * ex;
    const cy = ey - er * 2.7 - up * hry * 0.34;
    const L = 0.16 * hrx + er * 0.6;
    const th = ang * DEG;
    const inner = [cx - s * L * Math.cos(th), cy - L * Math.sin(th)];
    const outer = [cx + s * L * Math.cos(th), cy + L * Math.sin(th)];
    strokeLine(ctx, [outer, inner], ink, lw * (y.kasKalinlik ?? 1));
  }

  // burun
  if (y.burun === 'top') fillEllipse(ctx, 0, 0.2 * hry, er * 0.85, er * 0.65, 0, c.burun || c.yanak, ink, lw * 0.5);
  else if (y.burun === 'cizgi') strokeLine(ctx, [[0, 0.06 * hry], [-er * 0.5, 0.2 * hry], [er * 0.4, 0.22 * hry]], ink, lw * 0.6);
  else if (y.burun === 'nokta') fillCircle(ctx, 0, 0.18 * hry, er * 0.5, ink);
  else if (y.burun === 'ucgen') {
    ctx.beginPath();
    ctx.moveTo(-er * 0.85, 0.12 * hry);
    ctx.quadraticCurveTo(0, 0.08 * hry, er * 0.85, 0.12 * hry);
    ctx.quadraticCurveTo(er * 0.4, 0.26 * hry, 0, 0.29 * hry);
    ctx.quadraticCurveTo(-er * 0.4, 0.26 * hry, -er * 0.85, 0.12 * hry);
    ctx.fillStyle = c.burun || c.yanak;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
  }
  if (y.biyik === 'kedi') {
    ctx.globalAlpha *= 0.75;
    for (const s of [-1, 1]) {
      for (const k of [-1, 0, 1]) strokeLine(ctx, [[s * hrx * 0.62, hry * (0.28 + k * 0.06)], [s * hrx * 1.3, hry * (0.22 + k * 0.17)]], ink, lw * 0.45);
    }
  }

  drawMouth(ctx, C, f, hrx, hry, o);
  ctx.restore();
}

// ------------------------------------------------------------------ ağız
function drawMouth(ctx, C, f, hrx, hry, o) {
  const y = C.yuz || {};
  const c = o.c;
  const lw = C.cizgi.kalinlik;
  const m = { ...f.agiz };
  if (o.talk != null) {
    m.ac = clamp01(o.talk) * 0.95;
    m.gen = lerp(m.gen, 0.55 + 0.5 * o.talkGen, 0.8);
    m.dis = 0;
    m.dalga = 0;
  }
  const my = (0.44 + (y.agizY ?? 0)) * hry;
  const w = 0.3 * hrx * Math.max(0.2, m.gen) * (y.agizGen ?? 1);
  const mc = c.agiz;
  ctx.save();
  ctx.strokeStyle = y.ekran ? c.led : c.cizgi;
  ctx.lineWidth = lw * (y.agizKalinlik ?? 0.9);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const e = m.egri;
  const deep = y.agizDerin ?? 1;
  const endY = my - e * 0.1 * hry * deep;

  if (m.ac < 0.07 || m.dis > 0.4) {
    if (m.dalga > 0.4 && m.dis <= 0.4) {
      ctx.beginPath();
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const px = -w + 2 * w * k;
        const py = my + Math.sin(k * TAU * 1.5 + o.t * 14) * 0.045 * hry * m.dalga - e * 0.04 * hry;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
    } else if (m.dis > 0.4) {
      // sıkılı dişler (öfke)
      const th = 0.3 * hry;
      rr(ctx, -w * 1.05, my - th / 2, w * 2.1, th, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = lw * 0.55;
      for (let i = 1; i < 6; i++) {
        const px = -w * 1.05 + (w * 2.1 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(px, my - th / 2);
        ctx.lineTo(px, my + th / 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-w * 1.05, my);
      ctx.lineTo(w * 1.05, my);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-w, endY);
      ctx.quadraticCurveTo(0, my + e * 0.34 * hry * deep, w, endY);
      ctx.stroke();
    }
    if (m.dil > 0.4) {
      fillEllipse(ctx, w * 0.35, my + 0.13 * hry + e * 0.05 * hry, w * 0.28, 0.13 * hry, 0, '#ff8aa0', c.cizgi, lw * 0.6);
    }
  } else {
    const d = m.ac * 0.42 * hry;
    const topEnd = my - e * 0.06 * hry;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-w, topEnd);
      ctx.quadraticCurveTo(0, topEnd + e * 0.08 * hry, w, topEnd);
      ctx.quadraticCurveTo(0, topEnd + d * 1.9 - Math.max(0, -e) * d * 0.6, -w, topEnd);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = mc;
    ctx.fill();
    if (m.dil > 0.2 || e > 0.55) {
      ctx.save();
      ctx.clip();
      fillEllipse(ctx, w * 0.1, topEnd + d * 1.25, w * 0.55, d * 0.55, 0, '#ff8aa0');
      ctx.restore();
    }
    path();
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ gözyaşı / ter / buhar
export function drawFaceFx(ctx, C, f, hrx, hry, o) {
  const y = C.yuz || {};
  const ex = 0.4 * hrx * (y.aralik ?? 1);
  const ey = (-0.06 + (y.yukseklik ?? 0)) * hry;
  const er = 0.105 * Math.min(hrx, hry) * (y.boyut ?? 1);
  const t = o.t;
  if (f.gozyasi > 0.05) {
    ctx.save();
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.85 + k / 3 + (s > 0 ? 0.17 : 0)) % 1;
        const yy = ey + er * 1.8 + p * hry * 0.95;
        ctx.globalAlpha = (1 - p) * clamp01(f.gozyasi) * 0.95;
        fillEllipse(ctx, s * ex + s * er * 0.3 * p, yy, er * 0.55, er * 0.8, 0, '#7cc6ff', '#3d8fd1', 1.5);
      }
    }
    ctx.restore();
  }
  if (f.ter > 0.05) {
    ctx.save();
    ctx.globalAlpha *= clamp01(f.ter);
    const x = 0.82 * hrx;
    const yy = -0.4 * hry + Math.sin(t * 5) * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, yy - er * 1.7);
    ctx.quadraticCurveTo(x + er * 1.5, yy + er * 0.4, x, yy + er * 1.3);
    ctx.quadraticCurveTo(x - er * 1.5, yy + er * 0.4, x, yy - er * 1.7);
    ctx.fillStyle = '#7cc6ff';
    ctx.fill();
    ctx.strokeStyle = '#3d8fd1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  if (f.buhar > 0.05) {
    ctx.save();
    for (const s of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const p = (t * 1.1 + k * 0.5 + (s > 0 ? 0.3 : 0)) % 1;
        ctx.globalAlpha = (1 - p) * clamp01(f.buhar) * 0.9;
        const r = hry * (0.1 + 0.16 * p);
        fillCircle(ctx, s * hrx * (0.62 + 0.25 * p), -hry * (0.95 + 0.9 * p), r, '#ffffff', 'rgba(120,120,120,0.55)', 1.5);
      }
    }
    ctx.restore();
  }
}
