// Karakterin elinde tuttuğu nesneler (tutar.nesne): her biri ayrıntılı, gradyanlı ve parlamalı çizilir.
// Orijin = el; nesne yukarı (−y) uzanır, tutma noktası el konumundadır. env.dir = ±1 (hangi yana taşındığı),
// env.line / env.lw = karakterin çizgi rengi ve kalınlığı, env.t = zaman (sallanma, buhar, ışık).
import { shade } from './color.js';
import {
  TAU, shape, strokeLine, fillCircle, fillEllipse, starPath, heartPath, ellipsePts, rrectPts, rr,
} from './characterDraw.js';

const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
const dk = (c, s = 0.25) => (isHex(c) ? shade(c, -s) : c);
const lt = (c, s = 0.3) => (isHex(c) ? shade(c, s) : c);
const LG = (ctx, x0, y0, x1, y1, stops) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
const RG = (ctx, x, y, r, fx, fy, stops) => {
  const g = ctx.createRadialGradient(fx, fy, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
const wrap = (ctx, text, maxW) => {
  const out = [];
  for (const para of String(text ?? '').split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxW) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
};
const fontCss = (f) => {
  const x = f || 'Baloo 2';
  return x.includes(',') ? x : `"${x}", system-ui, sans-serif`;
};
const gloss = (ctx, x, y, rx, ry, rot = -0.6, a = 0.55) => {
  ctx.save();
  ctx.globalAlpha *= a;
  fillEllipse(ctx, x, y, rx, ry, rot, '#ffffff');
  ctx.restore();
};

// nesne başına varsayılan ana renk (tutar.renk verilmezse ya da tema yoksa)
const DEF = {
  tabela: '#e8704f', kitap: '#4d7cff', telefon: '#5b7cff', mikrofon: '#e63946', bayrak: '#e63946', ampul: '#ffe066', buyutec: '#8b5a2b',
  kahve: '#ffffff', hediye: '#e63946', laptop: '#4d9de0', 'balon-gaz': '#e8453c', kalp: '#ff4d6d', yildiz: '#ffcf33', kalem: '#ffcf33', cicek: '#ff6b9d',
};

// ════════════════════════════════════════════════════════════════════════════
const TABELA = (ctx, o) => {
  const { tutar, env, dir, c, ol, lw } = o;
  const w = tutar.genislik ?? 200;
  const h = tutar.yukseklik ?? 126;
  const x0 = dir > 0 ? -w * 0.05 : -w * 0.95;
  const top = -78 - h;
  // direk (ahşap)
  const pole = rrectPts(-5, top + 14, 5, 42, 3);
  shape(ctx, pole, LG(ctx, -5, 0, 5, 0, [[0, '#e2b27a'], [0.5, '#c58a52'], [1, '#9a6637']]), ol, lw * 0.9);
  fillCircle(ctx, 0, 42, 5, '#8a5a30');
  // gölge + levha
  ctx.save();
  ctx.globalAlpha *= 0.2;
  shape(ctx, rrectPts(x0 + 5, top + 6, x0 + w + 5, -78 + 6, 14), '#000000', null, 0);
  ctx.restore();
  shape(ctx, rrectPts(x0, top, x0 + w, -78, 14), LG(ctx, 0, top, 0, -78, [[0, lt(c, 0.15)], [1, dk(c, 0.2)]]), ol, lw);
  const ins = 8;
  shape(ctx, rrectPts(x0 + ins, top + ins, x0 + w - ins, -78 - ins, 8), LG(ctx, 0, top, 0, -78, [[0, '#ffffff'], [1, '#f1ece2']]), dk(c, 0.4), lw * 0.45);
  // cıvatalar
  for (const yy of [top + 22, -78 - 22]) {
    const bx = x0 + (dir > 0 ? w * 0.05 + 4 : w * 0.95 - 4);
    void bx;
  }
  fillCircle(ctx, 0, top + 24, 3.4, '#b8bcc6', ol, lw * 0.5);
  fillCircle(ctx, 0, -78 - 24, 3.4, '#b8bcc6', ol, lw * 0.5);
  // yazı
  ctx.fillStyle = dk(c, 0.55);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = tutar.punto ?? 40;
  let lines = [];
  for (let k = 0; k < 8; k++) {
    ctx.font = `800 ${size}px ${fontCss(tutar.font || env.font)}`;
    lines = wrap(ctx, tutar.metin || '', w - 40);
    if (lines.length * size * 1.1 <= h - 30 && lines.every((l) => ctx.measureText(l).width <= w - 36)) break;
    size *= 0.86;
  }
  if (tutar.yazi) ctx.fillStyle = env.col(tutar.yazi);
  lines.forEach((l, i) => ctx.fillText(l, x0 + w / 2, -78 - h / 2 + (i - (lines.length - 1) / 2) * size * 1.1));
  gloss(ctx, x0 + w * 0.2, top + 16, w * 0.12, 5, -0.05, 0.5);
};

const KITAP = (ctx, o) => {
  const { c, ol, lw, t } = o;
  const pg = rrectPts(-23, -72, 31, 4, 4);
  shape(ctx, pg, LG(ctx, 0, 0, 30, 0, [[0, '#fffaf0'], [1, '#e8dfcc']]), ol, lw * 0.8);
  for (const k of [0, 1, 2]) strokeLine(ctx, [[27 - k * 2.5, -66], [27 - k * 2.5, -4]], 'rgba(120,100,70,0.35)', 1);
  const cover = rrectPts(-28, -76, 26, 0, 4);
  shape(ctx, cover, LG(ctx, -28, -76, 26, 0, [[0, lt(c, 0.28)], [0.6, c], [1, dk(c, 0.25)]]), ol, lw);
  shape(ctx, rrectPts(-28, -76, -19, 0, [4, 0, 0, 4]), dk(c, 0.3), ol, lw * 0.7);
  strokeLine(ctx, [[-16, -70], [-16, -6]], lt(c, 0.4), 1.4);
  shape(ctx, rrectPts(-10, -60, 19, -42, 3), 'rgba(255,255,255,0.88)', dk(c, 0.4), lw * 0.45);
  strokeLine(ctx, [[-6, -54], [14, -54]], dk(c, 0.45), 2);
  strokeLine(ctx, [[-6, -48], [8, -48]], dk(c, 0.3), 2);
  starPath(ctx, 5, -24, 11, 0.45);
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.strokeStyle = dk('#ffd23f', 0.4);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // yer imi
  shape(ctx, [[14, -78], [20, -78], [20, -62], [17, -66], [14, -62]], '#e63946', null, 0);
  gloss(ctx, -4, -66, 4, 14, 0.1, 0.25 + 0.05 * Math.sin(t * 2));
};

const TELEFON = (ctx, o) => {
  const { c, ol, lw, t } = o;
  const bw = 20;
  const body = rrectPts(-bw, -82, bw, 0, 8);
  shape(ctx, body, LG(ctx, -bw, 0, bw, 0, [[0, '#4a4f63'], [0.5, '#262a3a'], [1, '#14161f']]), ol, lw);
  const scr = rrectPts(-bw + 3.5, -78, bw - 3.5, -4, 5);
  shape(ctx, scr, LG(ctx, 0, -78, 0, -4, [[0, lt(c, 0.25)], [1, dk(c, 0.2)]]), null, 0);
  // durum çubuğu + çentik
  shape(ctx, rrectPts(-7, -76, 7, -71, 2.5), '#0d0f16', null, 0);
  strokeLine(ctx, [[-14, -66], [-10, -66]], 'rgba(255,255,255,0.8)', 1.4);
  strokeLine(ctx, [[10, -66], [14, -66]], 'rgba(255,255,255,0.8)', 1.4);
  // uygulama ikonları
  const cols = ['#ffd23f', '#ff6b6b', '#69db7c', '#ffffff', '#b197fc', '#4dd4e6'];
  cols.forEach((k, i) => shape(ctx, rrectPts(-12 + (i % 3) * 9, -58 + Math.floor(i / 3) * 10, -5 + (i % 3) * 9, -51 + Math.floor(i / 3) * 10, 2), k, null, 0));
  shape(ctx, rrectPts(-13, -34, 13, -26, 3), 'rgba(255,255,255,0.88)', null, 0);
  shape(ctx, rrectPts(-13, -22, 7, -16, 3), 'rgba(255,255,255,0.55)', null, 0);
  shape(ctx, rrectPts(-6, -9, 6, -7.5, 1), 'rgba(255,255,255,0.7)', null, 0);
  // cam yansıması
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-bw + 3.5, -78);
  ctx.lineTo(4, -78);
  ctx.lineTo(-bw + 3.5, -38);
  ctx.closePath();
  ctx.globalAlpha *= 0.16 + 0.06 * Math.sin(t * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  strokeLine(ctx, [[bw + 1.5, -58], [bw + 1.5, -46]], '#14161f', 2);
};

const MIKROFON = (ctx, o) => {
  const { c, ol, lw } = o;
  // kablo
  strokeLine(ctx, [[0, -2], [-6, 12], [-22, 22], [-34, 40]], '#20222c', lw * 1.1);
  // sap
  shape(ctx, [[-9, -50], [9, -50], [7, -3], [-7, -3]], LG(ctx, -9, 0, 9, 0, [[0, '#4b4f60'], [0.45, '#1c1e28'], [1, '#0d0e14']]), ol, lw);
  shape(ctx, rrectPts(-8.5, -33, 8.5, -26, 2), LG(ctx, -9, 0, 9, 0, [[0, lt(c, 0.3)], [1, dk(c, 0.2)]]), ol, lw * 0.6);
  strokeLine(ctx, [[-4, -47], [-3, -6]], 'rgba(255,255,255,0.25)', 1.6);
  shape(ctx, rrectPts(-7.5, -6, 7.5, 0, 3), '#2c2f3c', ol, lw * 0.6);
  // yaka
  shape(ctx, rrectPts(-13, -57, 13, -48, 3), LG(ctx, -13, 0, 13, 0, [[0, '#c9ccd8'], [0.5, '#8f94a6'], [1, '#5e6275']]), ol, lw * 0.8);
  // kafa (ağ)
  const hr = 20;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -76, hr, 0, TAU);
  ctx.fillStyle = RG(ctx, 0, -76, hr, -7, -84, [[0, '#f0f2f8'], [0.55, '#aeb3c4'], [1, '#6a6f84']]);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,44,60,0.45)';
  ctx.lineWidth = 1.2;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(-hr, -76 + k * 6.5);
    ctx.lineTo(hr, -76 + k * 6.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(k * 6.5, -76 - hr);
    ctx.lineTo(k * 6.5, -76 + hr);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, -76, hr, 0, TAU);
  ctx.strokeStyle = ol;
  ctx.lineWidth = lw;
  ctx.stroke();
  gloss(ctx, -7, -85, 6, 3.5, -0.6, 0.6);
};

const BAYRAK = (ctx, o) => {
  const { c, ol, lw, t, dir } = o;
  shape(ctx, rrectPts(-3.5, -152, 3.5, 36, 3), LG(ctx, -3.5, 0, 3.5, 0, [[0, '#ead2a8'], [0.5, '#c58a52'], [1, '#8f5f33']]), ol, lw * 0.8);
  fillCircle(ctx, 0, -154, 6.5, RG(ctx, 0, -154, 7, -2, -156, [[0, '#fff2a8'], [1, '#d99a1b']]), ol, lw * 0.7);
  // dalgalı bez
  const n = 12;
  const L = 98;
  const H = 54;
  const top = [];
  const bot = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const wv = Math.sin(u * 5.2 - t * 4.2) * 6 * u;
    top.push([dir * u * L, -146 + wv]);
    bot.push([dir * u * L, -146 + H + wv * 0.9]);
  }
  const pts = [...top, ...bot.reverse()];
  shape(ctx, pts, LG(ctx, 0, 0, dir * L, 0, [[0, lt(c, 0.18)], [0.5, c], [1, dk(c, 0.22)]]), ol, lw);
  // kıvrım gölgeleri
  ctx.save();
  ctx.globalAlpha *= 0.22;
  for (let i = 2; i < n; i += 3) {
    const u = i / n;
    const wv = Math.sin(u * 5.2 - t * 4.2) * 6 * u;
    strokeLine(ctx, [[dir * u * L, -146 + wv + 2], [dir * u * L, -146 + H + wv * 0.9 - 2]], '#000000', 3);
  }
  ctx.restore();
  // amblem
  const u = 0.45;
  const wv = Math.sin(u * 5.2 - t * 4.2) * 6 * u;
  starPath(ctx, dir * u * L, -146 + H / 2 + wv, 11, 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
};

const AMPUL = (ctx, o) => {
  const { ol, lw, t } = o;
  const glow = 0.75 + 0.25 * Math.sin(t * 6);
  ctx.save();
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 30 * glow;
  const bulb = [];
  for (let i = 0; i <= 28; i++) {
    const a = Math.PI * (0.12 + (0.76 * i) / 28);
    bulb.push([Math.cos(a + Math.PI) * -30, -52 - Math.sin(a) * 30 + 0]);
  }
  void bulb;
  ctx.beginPath();
  ctx.arc(0, -56, 30, Math.PI * 0.82, Math.PI * 2.18);
  ctx.quadraticCurveTo(14, -30, 11, -20);
  ctx.lineTo(-11, -20);
  ctx.quadraticCurveTo(-14, -30, 30 * Math.cos(Math.PI * 0.82), -56 + 30 * Math.sin(Math.PI * 0.82));
  ctx.closePath();
  ctx.fillStyle = RG(ctx, 0, -56, 34, -8, -66, [[0, '#fffbe0'], [0.5, '#ffe066'], [1, '#ffb703']]);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ol;
  ctx.lineWidth = lw;
  ctx.stroke();
  // filaman
  strokeLine(ctx, [[-7, -24], [-7, -44]], '#8a6d3b', 1.6);
  strokeLine(ctx, [[7, -24], [7, -44]], '#8a6d3b', 1.6);
  strokeLine(ctx, [[-7, -44], [-4, -50], [-1, -44], [2, -50], [5, -44], [7, -44]], '#ff8a1f', 2);
  gloss(ctx, -14, -68, 8, 4.5, -0.8, 0.7);
  // duy
  const bands = [[-20, -12, '#c9ccd8'], [-12, -5, '#9a9eb0'], [-5, 2, '#c9ccd8']];
  for (const [a, b, col] of bands) shape(ctx, rrectPts(-11 + (a === -5 ? 1 : 0), a, 11 - (a === -5 ? 1 : 0), b, 2), LG(ctx, -11, 0, 11, 0, [[0, lt(col, 0.2)], [1, dk(col, 0.25)]]), ol, lw * 0.7);
  shape(ctx, rrectPts(-4, 2, 4, 7, 2), '#3a3d4a', ol, lw * 0.5);
  // ışık huzmeleri
  ctx.save();
  ctx.globalAlpha *= 0.55 * glow;
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI + (k / 6) * Math.PI;
    strokeLine(ctx, [[Math.cos(a) * 40, -56 + Math.sin(a) * 40], [Math.cos(a) * 52, -56 + Math.sin(a) * 52]], '#ffb703', 3);
  }
  ctx.restore();
};

const BUYUTEC = (ctx, o) => {
  const { c, ol, lw } = o;
  const handle = [[8, -30], [-2, -4]];
  strokeLine(ctx, handle, ol, 13 + lw * 1.4);
  strokeLine(ctx, handle, LG(ctx, -6, 0, 12, 0, [[0, lt(c, 0.2)], [1, dk(c, 0.3)]]), 13);
  strokeLine(ctx, [[10, -26], [2, -8]], 'rgba(255,255,255,0.28)', 2.5);
  const cx = 18;
  const cy = -64;
  fillCircle(ctx, cx, cy, 31, LG(ctx, cx - 30, cy - 30, cx + 30, cy + 30, [[0, '#f4d98a'], [0.5, '#b8862b'], [1, '#6e4a12']]), ol, lw);
  ctx.beginPath();
  ctx.arc(cx, cy, 24.5, 0, TAU);
  ctx.fillStyle = RG(ctx, cx, cy, 26, cx - 8, cy - 9, [[0, 'rgba(235,248,255,0.85)'], [0.7, 'rgba(160,210,245,0.5)'], [1, 'rgba(110,170,225,0.55)']]);
  ctx.fill();
  ctx.strokeStyle = ol;
  ctx.lineWidth = lw * 0.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 18, Math.PI * 1.1, Math.PI * 1.55);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  shape(ctx, rrectPts(1, -36, 15, -28, 3), '#8f94a6', ol, lw * 0.6);
};

const KAHVE = (ctx, o) => {
  const { c, ol, lw, t, dir } = o;
  // kulp
  ctx.beginPath();
  ctx.arc(dir * 24, -26, 11, -Math.PI * 0.5, Math.PI * 0.5, dir < 0);
  ctx.strokeStyle = ol;
  ctx.lineWidth = 7 + lw * 1.2;
  ctx.stroke();
  ctx.strokeStyle = lt(c, 0.05);
  ctx.lineWidth = 7;
  ctx.stroke();
  // gövde
  const body = [[-24, -46], [24, -46], [21, -8], [16, 0], [-16, 0], [-21, -8]];
  shape(ctx, body.flatMap((p) => [p, p]), LG(ctx, -24, 0, 24, 0, [[0, '#ffffff'], [0.55, lt(c, 0.02)], [1, dk(c, 0.18)]]), ol, lw);
  ctx.save();
  ctx.beginPath();
  body.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#e8704f';
  ctx.fillRect(-26, -30, 52, 9);
  ctx.restore();
  gloss(ctx, -14, -26, 3, 14, 0.05, 0.5);
  // ağız + kahve
  fillEllipse(ctx, 0, -46, 24, 6.5, 0, '#f3efe8', ol, lw * 0.9);
  fillEllipse(ctx, 0, -45.5, 20, 4.6, 0, RG(ctx, 0, -46, 20, -4, -47, [[0, '#a8683a'], [1, '#4a2a14']]));
  heartPath(ctx, 0, -45.5, 2.6);
  ctx.fillStyle = '#f3e3cc';
  ctx.fill();
  // buhar
  ctx.save();
  for (const k of [-1, 0, 1]) {
    const p = (t * 0.55 + (k + 1) / 3) % 1;
    ctx.globalAlpha *= 1;
    ctx.globalAlpha = (1 - p) * 0.6;
    strokeLine(ctx, [[k * 9, -54], [k * 9 + Math.sin(p * 6 + k) * 5, -62 - p * 14], [k * 9 - Math.sin(p * 6 + k) * 4, -72 - p * 18]], '#a9a9b8', 3);
  }
  ctx.restore();
};

const HEDIYE = (ctx, o) => {
  const { c, ol, lw, t } = o;
  shape(ctx, rrectPts(-32, -50, 32, 0, 3), LG(ctx, -32, 0, 32, 0, [[0, lt(c, 0.2)], [0.55, c], [1, dk(c, 0.28)]]), ol, lw);
  shape(ctx, rrectPts(-36, -64, 36, -47, 4), LG(ctx, -36, 0, 36, 0, [[0, lt(c, 0.12)], [0.55, dk(c, 0.05)], [1, dk(c, 0.35)]]), ol, lw);
  const rib = LG(ctx, -8, 0, 8, 0, [[0, '#fff0a8'], [0.5, '#ffd23f'], [1, '#d99a1b']]);
  shape(ctx, rrectPts(-8, -64, 8, 0, 1), rib, ol, lw * 0.6);
  // fiyonk
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(0, -66);
    ctx.rotate(s * 0.55);
    shape(ctx, ellipsePts(15, 8.5, 20, s * 13, -4), RG(ctx, s * 13, -4, 16, s * 9, -7, [[0, '#fff0a8'], [1, '#d99a1b']]), ol, lw * 0.8);
    ctx.restore();
  }
  fillCircle(ctx, 0, -66, 5.4, '#ffd23f', ol, lw * 0.7);
  strokeLine(ctx, [[0, -62], [-8, -52]], ol, lw * 0.6);
  strokeLine(ctx, [[0, -62], [8, -52]], ol, lw * 0.6);
  gloss(ctx, -22, -24, 3, 14, 0.05, 0.4);
  // parıltı
  const a = 0.5 + 0.5 * Math.sin(t * 5);
  ctx.save();
  ctx.globalAlpha *= a;
  starPath(ctx, 30, -76, 5.5, 0.35, 4);
  ctx.fillStyle = '#fff6b0';
  ctx.fill();
  ctx.restore();
};

const LAPTOP = (ctx, o) => {
  const { c, ol, lw, t } = o;
  // ekran kapağı + çerçeve
  shape(ctx, rrectPts(-48, -68, 48, -8, 5), LG(ctx, 0, -68, 0, -8, [[0, '#3a3e50'], [1, '#1c1e28']]), ol, lw);
  const scr = rrectPts(-43, -63, 43, -13, 2);
  shape(ctx, scr, LG(ctx, -43, -63, 43, -13, [[0, lt(c, 0.3)], [1, dk(c, 0.25)]]), null, 0);
  // pencere arayüzü
  shape(ctx, rrectPts(-37, -58, 4, -22, 2), 'rgba(255,255,255,0.9)', null, 0);
  strokeLine(ctx, [[-33, -52], [-6, -52]], dk(c, 0.3), 2);
  strokeLine(ctx, [[-33, -46], [-14, -46]], dk(c, 0.15), 2);
  strokeLine(ctx, [[-33, -40], [-9, -40]], dk(c, 0.15), 2);
  fillCircle(ctx, 22, -45, 11, 'rgba(255,255,255,0.85)');
  fillCircle(ctx, 22, -45, 5.5, lt(c, 0.25));
  shape(ctx, rrectPts(-37, -19, 38, -15, 1), 'rgba(255,255,255,0.45)', null, 0);
  // yansıma
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-43, -63);
  ctx.lineTo(-6, -63);
  ctx.lineTo(-43, -26);
  ctx.closePath();
  ctx.globalAlpha *= 0.14 + 0.05 * Math.sin(t * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  // taban
  shape(ctx, [[-52, -7], [52, -7], [60, 0], [-60, 0], [-60, 0]], LG(ctx, 0, -7, 0, 2, [[0, '#d9dbe6'], [1, '#8f94a6']]), ol, lw * 0.9);
  shape(ctx, rrectPts(-9, -7, 9, -4, 1.5), '#6b6f82', null, 0);
  fillCircle(ctx, 0, -38, 0.1, '#fff');
};

const BALON = (ctx, o) => {
  const { c, ol, lw, t, dir } = o;
  const sw = Math.sin(t * 1.8) * 6;
  const bo = dir * 22;
  const bx = bo + sw;
  strokeLine(ctx, [[0, 0], [bo * 0.45 + sw * 0.3, -46 + Math.sin(t * 2.4) * 3], [bx - sw * 0.2, -92]], ol, lw * 0.6);
  // gövde (hafif damla)
  const pts = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    pts.push([bx + Math.cos(a) * 33, -130 + Math.sin(a) * 41 + (Math.sin(a) > 0 ? Math.sin(a) * 4 : 0)]);
  }
  shape(ctx, pts, RG(ctx, bx, -130, 48, bx - 12, -146, [[0, lt(c, 0.42)], [0.45, c], [1, dk(c, 0.3)]]), ol, lw);
  // bağ düğümü
  shape(ctx, [[bx, -86], [bx - 6, -77], [bx + 6, -77]], dk(c, 0.15), ol, lw * 0.7);
  gloss(ctx, bx - 14, -146, 7, 12, -0.5, 0.65);
  gloss(ctx, bx - 8, -127, 2.5, 4, -0.5, 0.4);
};

const KALP = (ctx, o) => {
  const { c, ol, lw, t } = o;
  const bob = Math.sin(t * 4) * 2.5;
  const k = 1 + 0.06 * Math.sin(t * 8);
  ctx.save();
  ctx.translate(0, -46 + bob);
  ctx.scale(k, k);
  heartPath(ctx, 0, 0, 29);
  ctx.fillStyle = RG(ctx, 0, 0, 44, -10, -14, [[0, lt(c, 0.45)], [0.5, c], [1, dk(c, 0.3)]]);
  ctx.fill();
  ctx.strokeStyle = ol;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
  gloss(ctx, -15, -13, 8, 4.5, -0.7, 0.7);
  ctx.restore();
};

const YILDIZ = (ctx, o) => {
  const { c, ol, lw, t } = o;
  const cy = -48 + Math.sin(t * 3) * 2;
  const R = 36;
  const r = R * 0.46;
  const P = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    P.push([Math.cos(a) * (i % 2 ? r : R), cy + Math.sin(a) * (i % 2 ? r : R)]);
  }
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const a = P[i];
    const b = P[(i + 1) % 10];
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? dk(c, 0.18) : lt(c, 0.22);
    ctx.fill();
  }
  ctx.beginPath();
  P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.strokeStyle = ol;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  gloss(ctx, -8, cy - 14, 5, 2.6, -0.8, 0.7);
  const a = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.save();
  ctx.globalAlpha *= a;
  starPath(ctx, 28, cy - 28, 6, 0.3, 4);
  ctx.fillStyle = '#fffbe0';
  ctx.fill();
  ctx.restore();
};

const KALEM = (ctx, o) => {
  const { c, ol, lw } = o;
  ctx.save();
  ctx.rotate(0.22);
  const w = 12;
  // gövde (altıgen: 3 yüz)
  shape(ctx, rrectPts(-w, -86, -w / 3, -24, 0.5), lt(c, 0.28), null, 0);
  shape(ctx, rrectPts(-w / 3, -86, w / 3, -24, 0.5), c, null, 0);
  shape(ctx, rrectPts(w / 3, -86, w, -24, 0.5), dk(c, 0.25), null, 0);
  shape(ctx, rrectPts(-w, -86, w, -24, 1), null, ol, lw);
  // ahşap koni + uç
  shape(ctx, [[-w, -24], [w, -24], [2.5, 8], [-2.5, 8]], LG(ctx, -w, 0, w, 0, [[0, '#f6d9a8'], [1, '#d6a96a']]), ol, lw * 0.9);
  shape(ctx, [[-4.6, -2], [4.6, -2], [2.5, 8], [-2.5, 8]], '#3a3d4a', null, 0);
  // metal bilezik + silgi
  shape(ctx, rrectPts(-w, -97, w, -86, 1.5), LG(ctx, -w, 0, w, 0, [[0, '#e6e8f0'], [0.5, '#a3a8bb'], [1, '#6b7087']]), ol, lw * 0.8);
  strokeLine(ctx, [[-w, -92], [w, -92]], 'rgba(60,64,80,0.5)', 1);
  shape(ctx, rrectPts(-w, -108, w, -97, [6, 6, 1, 1]), LG(ctx, -w, 0, w, 0, [[0, '#ffc2cf'], [1, '#e8789a']]), ol, lw * 0.8);
  gloss(ctx, -w * 0.6, -60, 1.6, 22, 0, 0.45);
  ctx.restore();
};

const CICEK = (ctx, o) => {
  const { c, ol, lw, t } = o;
  const sw = Math.sin(t * 1.6) * 3;
  const stem = [[0, 2], [1.5 + sw * 0.2, -30], [2 + sw * 0.6, -60], [sw, -90]];
  strokeLine(ctx, stem, ol, 6.5 + lw * 0.8);
  strokeLine(ctx, stem, '#3fae5a', 6);
  strokeLine(ctx, [[-1, -6], [0, -50]], 'rgba(255,255,255,0.25)', 1.6);
  // yapraklar
  for (const [x, y, s, rot] of [[2, -28, -1, -0.5], [2, -50, 1, 0.5]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot * s);
    shape(ctx, ellipsePts(14, 6, 18, s * 15, 0), LG(ctx, 0, -6, 0, 6, [[0, '#7ad98a'], [1, '#2f9e4c']]), ol, lw * 0.7);
    strokeLine(ctx, [[s * 3, 0], [s * 24, 0]], 'rgba(20,80,40,0.5)', 1);
    ctx.restore();
  }
  // çiçek başı
  const hx = sw;
  const hy = -98;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2;
    ctx.save();
    ctx.translate(hx + Math.cos(a) * 12, hy + Math.sin(a) * 12);
    ctx.rotate(a);
    shape(ctx, ellipsePts(11, 7.5, 16), RG(ctx, 0, 0, 12, -3, -2, [[0, lt(c, 0.4)], [1, dk(c, 0.1)]]), dk(c, 0.45), lw * 0.7);
    ctx.restore();
  }
  fillCircle(ctx, hx, hy, 8.5, RG(ctx, hx, hy, 9, hx - 2, hy - 3, [[0, '#fff2a8'], [1, '#e8a300']]), dk('#e8a300', 0.4), lw * 0.7);
  for (const [dx, dy] of [[-2.5, -2], [2.5, -2.5], [0, 2.5], [-3.5, 2]]) fillCircle(ctx, hx + dx, hy + dy, 1, '#a86a00');
};

const SAHNE = {
  tabela: TABELA, kitap: KITAP, telefon: TELEFON, mikrofon: MIKROFON, bayrak: BAYRAK, ampul: AMPUL, buyutec: BUYUTEC, kahve: KAHVE,
  hediye: HEDIYE, laptop: LAPTOP, 'balon-gaz': BALON, kalp: KALP, yildiz: YILDIZ, kalem: KALEM, cicek: CICEK,
};

export function drawProp(ctx, tutar, env) {
  const name = tutar.nesne || tutar.tur;
  const fn = SAHNE[name];
  const ft = tutar.olcek ?? 1;
  let c = tutar.renk ? env.col(tutar.renk) : DEF[name];
  if (!isHex(c)) c = DEF[name] || '#e8704f';
  if (tutar.renk && String(tutar.renk)[0] === '$' && c === '#888888') c = DEF[name];
  ctx.save();
  ctx.scale(ft, ft);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const o = { tutar, env, c, ol: env.line, lw: Math.max(2.2, env.lw * 0.85), t: env.t, dir: env.dir || 1 };
  if (fn) fn(ctx, o);
  else {
    shape(ctx, rrectPts(-26, -52, 26, 0, 6), '#ffffff', env.line, env.lw);
  }
  ctx.restore();
}
