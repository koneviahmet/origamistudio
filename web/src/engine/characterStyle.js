// Karakter "cilası": gradyanlı dolgu, parlaklık, renkli kontur, kıyafet / gövde / kafa detayları, eklemler, el ve ayak.
// Hepsi karakter belgesinden açılır (isik, cizgi.renkli, govde.detay, kafa.detay, uzuv.eklem …); varsayılanlar eski (düz) görünümü korur.
import { shade } from './color.js';
import {
  TAU, clamp01, pathSmooth, shape, strokeLine, fillCircle, fillEllipse, rrectPts, ellipsePts, starPath,
} from './characterDraw.js';

const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
export const darker = (c, s = 0.3) => (isHex(c) ? shade(c, -s) : c);
export const lighter = (c, s = 0.3) => (isHex(c) ? shade(c, s) : c);
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/** Dolguya göre kontur rengi: cizgi.renkli açıksa dolgunun koyusu, değilse sabit çizgi rengi */
export function outlineOf(C, fill, lineC) {
  return C.cizgi.renkli && isHex(fill) ? shade(fill, -(C.cizgi.renkliGuc ?? 0.52)) : lineC;
}

function bbox(pts) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

/** Işık sol-üstten: parlak merkez → taban → koyu kenar. isik = 0 ise düz renk döner. */
export function gradFill(ctx, C, pts, base) {
  const g = C.isik || 0;
  if (!g || !isHex(base)) return base;
  const b = bbox(pts);
  const r = Math.max(b.w, b.h) * 0.78;
  const gr = ctx.createRadialGradient(b.cx - b.w * 0.22, b.cy - b.h * 0.3, 0, b.cx, b.cy, r);
  gr.addColorStop(0, shade(base, 0.3 * g));
  gr.addColorStop(0.5, base);
  gr.addColorStop(1, shade(base, -0.3 * g));
  return gr;
}

/** Küçük parlama lekesi (cam / plastik hissi) */
export function gloss(ctx, C, x, y, rx, ry, rot = -0.5) {
  const g = C.isik || 0;
  if (!g) return;
  ctx.save();
  ctx.globalAlpha *= 0.42 * clamp01(g);
  fillEllipse(ctx, x, y, rx, ry, rot, '#ffffff');
  ctx.restore();
}

function clipPath(ctx, pts) {
  pathSmooth(ctx, pts, true);
  ctx.clip();
}

// ════════════════════════════════════════════════════════════════════════════
//  UZUV (kol / bacak)
// ════════════════════════════════════════════════════════════════════════════
export function drawLimb(ctx, C, pts, fill, w, lineC, lw, tube) {
  if (!tube) {
    strokeLine(ctx, pts, lineC, w);
    return;
  }
  const oc = outlineOf(C, fill, lineC);
  strokeLine(ctx, pts, oc, w + lw * 2);
  strokeLine(ctx, pts, fill, w);
  if (C.isik) {
    const o = w * 0.2;
    strokeLine(ctx, pts.map(([x, y]) => [x - o, y - o]), lighter(fill, 0.32 * C.isik), w * 0.26);
  }
  if (C.uzuv.eklem) {
    // robot eklemi: orta noktada yuvarlak mafsal
    const [x, y] = pts[1];
    const jc = darker(fill, 0.12);
    fillCircle(ctx, x, y, w * 0.72, gradCircle(ctx, C, x, y, w * 0.72, jc), outlineOf(C, jc, lineC), lw * 0.9);
    fillCircle(ctx, x, y, w * 0.2, lighter(fill, 0.4));
  }
  if (C.uzuv.manset && pts.length >= 3) {
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ux = (b[0] - a[0]) / d;
    const uy = (b[1] - a[1]) / d;
    const cuff = [[b[0] - ux * 13, b[1] - uy * 13], [b[0] - ux * 5, b[1] - uy * 5]];
    const cc = C.renkler.manset || darker(fill, 0.18);
    strokeLine(ctx, cuff, outlineOf(C, cc, lineC), w * 1.2 + lw * 2);
    strokeLine(ctx, cuff, cc, w * 1.2);
  }
}

function gradCircle(ctx, C, x, y, r, base) {
  const g = C.isik || 0;
  if (!g || !isHex(base)) return base;
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r * 1.15);
  gr.addColorStop(0, shade(base, 0.32 * g));
  gr.addColorStop(0.55, base);
  gr.addColorStop(1, shade(base, -0.28 * g));
  return gr;
}

// ------------------------------------------------------------------ el
export function drawHand(ctx, C, pos, angDeg, s, tau, fill, line, lw) {
  const kind = C.uzuv.el;
  if (kind === 'yok') return;
  const r = C.olcu.el;
  const a0 = Math.atan2(Math.cos((angDeg * Math.PI) / 180), s * Math.sin((angDeg * Math.PI) / 180)) + tau; // önkol yönü
  if (kind === 'parmak') {
    const len = r * 1.25;
    for (const d of [-0.62, 0, 0.62]) {
      const a = a0 + d;
      strokeLine(ctx, [pos, [pos[0] + Math.cos(a) * len, pos[1] + Math.sin(a) * len]], line, lw * 0.85);
    }
    return;
  }
  const rr = r * (kind === 'eldiven' ? 1.15 : 1);
  const oc = outlineOf(C, fill, line);
  const cx = pos[0] + Math.cos(a0) * rr * 0.35;
  const cy = pos[1] + Math.sin(a0) * rr * 0.35;
  // başparmak
  const ta = a0 + s * 1.15;
  fillEllipse(ctx, cx + Math.cos(ta) * rr * 0.8, cy + Math.sin(ta) * rr * 0.8, rr * 0.38, rr * 0.3, ta, fill, oc, lw * 0.8);
  fillCircle(ctx, cx, cy, rr, gradCircle(ctx, C, cx, cy, rr, fill), oc, lw * 0.9);
  if (kind === 'eldiven') {
    for (const d of [-0.34, 0.34]) {
      const a = a0 + d;
      strokeLine(ctx, [[cx + Math.cos(a) * rr * 0.35, cy + Math.sin(a) * rr * 0.35], [cx + Math.cos(a) * rr * 0.92, cy + Math.sin(a) * rr * 0.92]], oc, lw * 0.55);
    }
  }
  if (C.uzuv.pati) {
    // kedi patisi: avuç içi + 3 minik parmak yastığı
    const pc = C.renkler.pati || '#ffa9b8';
    fillCircle(ctx, cx - Math.cos(a0) * rr * 0.1, cy - Math.sin(a0) * rr * 0.1, rr * 0.3, pc);
    for (const d of [-0.62, 0, 0.62]) {
      const a = a0 + d;
      fillCircle(ctx, cx + Math.cos(a) * rr * 0.58, cy + Math.sin(a) * rr * 0.58, rr * 0.13, pc);
    }
  }
}

// ------------------------------------------------------------------ ayak
export function drawFoot(ctx, C, pos, s, fill, line, lw) {
  const kind = C.uzuv.ayak;
  if (kind === 'yok') return;
  const [fw, fh] = C.olcu.ayak;
  const oc = outlineOf(C, fill, line);
  if (kind === 'oval-dis') {
    const pts = ellipsePts(fw / 2, fh / 2, 20, pos[0] + s * fw * 0.28, pos[1] + fh * 0.35);
    shape(ctx, pts, gradFill(ctx, C, pts, fill), oc, lw * 0.9);
    return;
  }
  if (kind === 'cizgi') {
    strokeLine(ctx, [[pos[0] - fw * 0.1, pos[1] + 2], [pos[0] + fw * 0.8, pos[1] + 2]], line, lw);
    return;
  }
  if (kind === 'ayakkabi' || kind === 'bot') {
    const x0 = pos[0] - fw * 0.6 + 4;
    const x1 = pos[0] + fw * 0.9 + 4;
    const y0 = pos[1] - (kind === 'bot' ? fh * 0.9 : fh * 0.2);
    const y1 = pos[1] + fh * 0.9;
    const pts = rrectPts(x0, y0, x1, y1, [fh * 0.4, fh * 0.6, fh * 0.35, fh * 0.35]);
    shape(ctx, pts, gradFill(ctx, C, pts, fill), oc, lw * 0.9);
    // taban
    const sole = C.renkler.taban || '#f4f1ea';
    ctx.save();
    clipPath(ctx, pts);
    ctx.fillStyle = sole;
    ctx.fillRect(x0 - 2, y1 - fh * 0.3, x1 - x0 + 4, fh * 0.4);
    ctx.restore();
    strokeLine(ctx, [[x0 + 2, y1 - fh * 0.3], [x1 - 2, y1 - fh * 0.3]], oc, lw * 0.5);
    if (kind === 'bot') strokeLine(ctx, [[x0 + 1, y0 + fh * 0.32], [x1 - fh * 0.5, y0 + fh * 0.32]], darker(fill, 0.3), lw * 0.7);
    else {
      strokeLine(ctx, [[pos[0] + fw * 0.15, pos[1] + fh * 0.05], [pos[0] + fw * 0.55, pos[1] + fh * 0.05]], lighter(fill, 0.45), lw * 0.6);
    }
  } else {
    const pts = ellipsePts(fw / 2, fh / 2, 20, pos[0] + 5, pos[1] + fh * 0.35);
    shape(ctx, pts, gradFill(ctx, C, pts, fill), oc, lw * 0.9);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  GÖVDE detayları (govde.detay: dize ya da dizi) — orijin = leğen, yukarı −y
// ════════════════════════════════════════════════════════════════════════════
export function torsoBack(ctx, C, col, tw, tH, lineC, lw) {
  if (!list(C.govde.detay).includes('bagaj')) return;
  const bc = col(C.renkler.bagaj || '#aab4c6');
  const pts = rrectPts(-tw * 0.66, -tH * 0.96, tw * 0.66, -tH * 0.14, tw * 0.2);
  shape(ctx, pts, gradFill(ctx, C, pts, bc), outlineOf(C, bc, lineC), lw);
  shape(ctx, rrectPts(-tw * 0.5, -tH * 0.82, tw * 0.5, -tH * 0.6, 4), darker(bc, 0.14), null, 0);
}

export function torsoDetails(ctx, C, col, tpts, tw, tH, lineC, lw, t) {
  const R = C.renkler;
  const items = list(C.govde.detay);
  if (!items.length) return;
  const base = col(R.govde);
  ctx.save();
  clipPath(ctx, tpts);
  for (const d of items) {
    if (d === 'sirit') {
      const sc = col(R.sirit || lighter(base, 0.35));
      for (const y of [0.78, 0.5, 0.22]) {
        ctx.fillStyle = sc;
        ctx.fillRect(-tw, -tH * y - tH * 0.07, tw * 2, tH * 0.14);
      }
    } else if (d === 'benekli') {
      const dc = col(R.desen || lineC);
      [0.8, 0.6, 0.4, 0.2].forEach((y, r) => {
        for (let k = -2; k <= 2; k++) fillCircle(ctx, (k + (r % 2 ? 0.5 : 0)) * tw * 0.2, -tH * y, tw * 0.05, dc);
      });
    } else if (d === 'cizgili') {
      for (const y of [0.8, 0.62, 0.44, 0.26]) strokeLine(ctx, [[-tw, -tH * y], [tw, -tH * y]], lineC, lw * 0.85);
    } else if (d === 'karin') {
      ctx.save();
      ctx.globalAlpha *= 0.95;
      fillEllipse(ctx, 0, -tH * 0.36, tw * 0.34, tH * 0.3, 0, col(R.karin || lighter(base, 0.5)));
      ctx.restore();
    } else if (d === 'tabby') {
      const dc = col(R.desen || darker(base, 0.35));
      for (const y of [0.74, 0.54, 0.34]) {
        for (const s of [-1, 1]) strokeLine(ctx, [[s * tw * 0.56, -tH * y], [s * tw * 0.3, -tH * y + 5]], dc, lw * 1.2);
      }
    } else if (d === 'kemer') {
      ctx.fillStyle = col(R.kemer || '#4a3426');
      ctx.fillRect(-tw, -tH * 0.17, tw * 2, tH * 0.1);
    } else if (d === 'tulum') {
      ctx.fillStyle = col(R.kemer || darker(base, 0.18));
      ctx.fillRect(-tw, -tH * 0.2, tw * 2, tH * 0.07);
      ctx.fillStyle = col(R.sirit || '#ffd23f');
      ctx.fillRect(-tw, -tH * 0.62, tw * 2, tH * 0.05);
    }
  }
  ctx.restore();
  for (const d of items) {
    if (d === 'panel') {
      const w = tw * 0.52;
      shape(ctx, rrectPts(-w / 2, -tH * 0.76, w / 2, -tH * 0.34, 5), '#1b2238', lineC, lw * 0.7);
      const vc = col(R.vurgu === '$vurgu' ? '#3df5e0' : R.vurgu);
      for (let i = 0; i < 4; i++) {
        const h = (tH * 0.3) * (0.25 + 0.7 * Math.abs(Math.sin(t * 3.1 + i * 1.7)));
        ctx.fillStyle = vc;
        ctx.fillRect(-w * 0.38 + i * w * 0.2, -tH * 0.38 - h, w * 0.13, h);
      }
      fillCircle(ctx, -tw * 0.28, -tH * 0.2, 3, '#ff6b6b');
      fillCircle(ctx, -tw * 0.14, -tH * 0.2, 3, '#ffd23f');
      fillCircle(ctx, 0, -tH * 0.2, 3, '#69db7c');
      for (let i = -1; i <= 1; i += 2) strokeLine(ctx, [[i * tw * 0.3, -tH * 0.12], [i * tw * 0.42, -tH * 0.12]], darker(base, 0.35), lw * 0.8);
    } else if (d === 'dugme') {
      for (const yy of [0.62, 0.42, 0.22]) fillCircle(ctx, 0, -tH * yy, 3.4, lineC);
    } else if (d === 'yaka') {
      const yc = col(R.yaka || '#ffffff');
      shape(ctx, [[-tw * 0.06, -tH + 2], [-tw * 0.34, -tH + 5], [-tw * 0.2, -tH + 22]], yc, outlineOf(C, yc, lineC), lw * 0.7);
      shape(ctx, [[tw * 0.06, -tH + 2], [tw * 0.34, -tH + 5], [tw * 0.2, -tH + 22]], yc, outlineOf(C, yc, lineC), lw * 0.7);
    } else if (d === 'halka') {
      const hc = col(R.halka || '#8fa0bf');
      const pts = rrectPts(-tw * 0.4, -tH - 3, tw * 0.4, -tH + 14, 7);
      shape(ctx, pts, gradFill(ctx, C, pts, hc), outlineOf(C, hc, lineC), lw);
      strokeLine(ctx, [[-tw * 0.3, -tH + 4], [tw * 0.3, -tH + 4]], lighter(hc, 0.4), lw * 0.6);
    } else if (d === 'yama') {
      fillCircle(ctx, -tw * 0.22, -tH * 0.7, tw * 0.13, col(R.yama || '#e63946'), outlineOf(C, '#e63946', lineC), lw * 0.7);
      starPath(ctx, -tw * 0.22, -tH * 0.7, tw * 0.08, 0.45);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (d === 'cep') {
      shape(ctx, rrectPts(tw * 0.1, -tH * 0.55, tw * 0.38, -tH * 0.36, 4), darker(base, 0.1), outlineOf(C, base, lineC), lw * 0.6);
    } else if (d === 'atlet') {
      strokeLine(ctx, [[-tw * 0.22, -tH + 1], [-tw * 0.1, -tH * 0.86], [tw * 0.1, -tH * 0.86], [tw * 0.22, -tH + 1]], lineC, lw * 0.9);
    } else if (d === 'sort') {
      const sc = col(R.sort || '#ffffff');
      const P = [[-tw * 0.52, 1], [tw * 0.52, 1], [tw * 0.64, tH * 0.28], [tw * 0.08, tH * 0.28], [0, tH * 0.13], [-tw * 0.08, tH * 0.28], [-tw * 0.64, tH * 0.28]];
      shape(ctx, P.flatMap((p) => [p, p]), sc, lineC, lw);
    } else if (d === 'kemerTokasi') {
      shape(ctx, rrectPts(-5, -tH * 0.17, 5, -tH * 0.07, 2), '#ffd23f', lineC, lw * 0.5);
    }
  }
}

// ------------------------------------------------------------------ gövde parlaklığı
export function torsoGloss(ctx, C, tw, tH) {
  gloss(ctx, C, -tw * 0.24, -tH * 0.72, tw * 0.11, tH * 0.2, -0.15);
}

// ════════════════════════════════════════════════════════════════════════════
//  KAFA detayları (kafa.detay) — orijin = baş merkezi
// ════════════════════════════════════════════════════════════════════════════
export function headBack(ctx, C, col, hrx, hry, lineC, lw) {
  const items = list(C.kafa.detay);
  if (items.includes('kulaklik')) {
    const kc = col(C.renkler.kulaklik || darker(col(C.renkler.kafa), 0.22));
    for (const s of [-1, 1]) {
      fillEllipse(ctx, s * hrx * 1.0, hry * 0.04, hrx * 0.17, hry * 0.3, 0, gradCircle(ctx, C, s * hrx, 0, hry * 0.3, kc), outlineOf(C, kc, lineC), lw);
      fillCircle(ctx, s * hrx * 1.02, hry * 0.04, hry * 0.1, col(C.renkler.goz));
    }
  }
}

export function headFront(ctx, C, col, hrx, hry, lineC, lw, hpts) {
  const items = list(C.kafa.detay);
  const base = col(C.renkler.kafa);
  for (const d of items) {
    if (d === 'seritler') {
      const dc = col(C.renkler.desen || darker(base, 0.35));
      ctx.save();
      clipPath(ctx, hpts);
      for (const x of [-0.22, 0, 0.22]) strokeLine(ctx, [[x * hrx, -hry * 1.02], [x * hrx * 0.85, -hry * (x ? 0.66 : 0.58)]], dc, lw * 1.3);
      for (const s of [-1, 1]) for (const y of [0.0, 0.2]) strokeLine(ctx, [[s * hrx * 1.02, hry * y], [s * hrx * 0.78, hry * (y + 0.04)]], dc, lw * 1.2);
      ctx.restore();
    } else if (d === 'civata') {
      for (const [x, y] of [[-0.82, -0.72], [0.82, -0.72], [-0.82, 0.74], [0.82, 0.74]]) {
        fillCircle(ctx, x * hrx, y * hry, hry * 0.06, lighter(base, 0.25), outlineOf(C, base, lineC), lw * 0.5);
        strokeLine(ctx, [[x * hrx - 2, y * hry - 1], [x * hrx + 2, y * hry + 1]], outlineOf(C, base, lineC), lw * 0.4);
      }
    } else if (d === 'yanak-tuy') {
      const fc = base;
      for (const s of [-1, 1]) {
        shape(ctx, [[s * hrx * 0.92, hry * 0.12], [s * hrx * 1.2, hry * 0.2], [s * hrx * 0.98, hry * 0.34], [s * hrx * 1.16, hry * 0.5], [s * hrx * 0.84, hry * 0.5]], fc, outlineOf(C, fc, lineC), lw * 0.9, true);
      }
    }
  }
  gloss(ctx, C, -hrx * 0.42, -hry * 0.66, hrx * 0.2, hry * 0.1, -0.5);
}
