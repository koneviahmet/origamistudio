// Karakter donanımı: ekler (saç, şapka, gözlük, kulak, kuyruk…), tutulan nesneler, başın üstü efektleri, konuşma balonu.
// Hepsi ctx üzerinde çizer; çağıran doğru çerçeveyi (baş / gövde / el) kurmuştur.
import { easings } from './easing.js';
import { shade } from './color.js';
import {
  DEG, TAU, clamp, clamp01, lerp, snoise,
  shape, strokeLine, fillCircle, fillEllipse, rr, starPath, heartPath, ellipsePts, rrectPts, pathSmooth,
} from './characterDraw.js';

const darker = (c, s = -0.25) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? shade(c, s) : c);
const lighter = (c, s = 0.35) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? shade(c, s) : c);
const fontCss = (f) => {
  const x = f || 'Baloo 2';
  return x.includes(',') ? x : `"${x}", system-ui, sans-serif`;
};

// ════════════════════════════════════════════════════════════════════════════
//  EKLER
//   env: { hrx, hry, tw, th (gövde), lw, line, col(c), t, C }
// ════════════════════════════════════════════════════════════════════════════
/** Ekin hangi çerçevede çizildiği: 'kafa' | 'govde' */
export const ekFrame = (ek) => (['kravat', 'papyon', 'atki', 'pelerin', 'kuyruk'].includes(ek.tur) ? 'govde' : 'kafa');
/** Gövdenin arkasında / başın arkasında kalan parçası var mı */
export const ekHasBack = (ek) => ek.tur === 'kulak' || ek.tur === 'kuyruk' || ek.tur === 'pelerin'
  || (ek.tur === 'sac' && ['uzun', 'at-kuyrugu', 'kabarik', 'lule'].includes(ek.stil));

function fs(ctx, env, pts, fill) {
  shape(ctx, pts, fill, env.line, env.lw);
}

function hairCap(env, fringe = 1) {
  const { hrx, hry } = env;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (1.07 + (0.86 * i) / 14);
    pts.push([(hrx + 2.5) * Math.cos(a), (hry + 2.5) * Math.sin(a)]);
  }
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = hrx * 0.98 * (1 - 2 * u);
    const base = -0.5 * hry + 0.34 * hry * (x / hrx) ** 2 * fringe;
    pts.push([x, base + (i % 2 ? 0.1 * hry : -0.02 * hry)]);
  }
  return pts;
}

export function drawEkBack(ctx, ek, env) {
  const { hrx, hry, t } = env;
  const c = env.col(ek.renk || (ek.tur === 'kulak' ? env.C.renkler.kafa : env.C.renkler.sac) || '#222');
  if (ek.tur === 'sac') {
    if (ek.stil === 'uzun') fs(ctx, env, rrectPts(-hrx * 1.14, -hry * 0.75, hrx * 1.14, hry * 1.75, [hrx * 0.7, hrx * 0.7, hrx * 0.3, hrx * 0.3]), c);
    else if (ek.stil === 'at-kuyrugu') {
      ctx.save();
      ctx.translate(hrx * 0.95, -hry * 0.4);
      ctx.rotate(0.55 + Math.sin(t * 2.4) * 0.12);
      fs(ctx, env, ellipsePts(hrx * 0.26, hry * 0.62, 20, 0, hry * 0.5), c);
      ctx.restore();
    } else if (ek.stil === 'lule') {
      // bukleler: kafayı saran küçük halkalar (çizgi saç)
      const N = 16;
      for (let i = 0; i < N; i++) {
        const a = Math.PI * (0.78 + (1.44 * i) / (N - 1));
        const cx = (hrx * 1.1) * Math.cos(a);
        const cy = (hry * 1.06) * Math.sin(a) + (Math.sin(a) > 0 ? hry * 0.1 : 0);
        shape(ctx, ellipsePts(hrx * 0.2, hrx * 0.2, 14, cx, cy), c, env.line, env.lw * 0.9);
      }
    } else if (ek.stil === 'kabarik') {
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1 + i / 8);
        shape(ctx, ellipsePts(hrx * 0.36, hrx * 0.36, 16, (hrx * 0.98) * Math.cos(a), hry * 0.98 * Math.sin(a) + hry * 0.05), c, env.line, env.lw);
      }
    }
  } else if (ek.tur === 'kulak') {
    const inner = env.col(ek.ic || '#ffb3c1');
    if (ek.stil === 'insan') {
      const sk = env.col(ek.renk || env.C.renkler.kafa);
      for (const s of [-1, 1]) {
        fillEllipse(ctx, s * hrx * 0.99, hry * 0.08, hrx * 0.16, hry * 0.22, 0, sk, env.line, env.lw);
        fillEllipse(ctx, s * hrx * 0.99, hry * 0.1, hrx * 0.07, hry * 0.12, 0, darker(sk, 0.12));
      }
    } else if (ek.stil === 'ayi') {
      for (const s of [-1, 1]) {
        fillCircle(ctx, s * hrx * 0.74, -hry * 0.8, hrx * 0.3, c, env.line, env.lw);
        fillCircle(ctx, s * hrx * 0.74, -hry * 0.8, hrx * 0.15, inner);
      }
    } else if (ek.stil === 'tavsan') {
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(s * hrx * 0.42, -hry * 1.5);
        ctx.rotate(s * 0.14 + Math.sin(t * 1.7 + s) * 0.04);
        fs(ctx, env, ellipsePts(hrx * 0.22, hry * 0.7, 22), c);
        shape(ctx, ellipsePts(hrx * 0.11, hry * 0.5, 16), inner, null, 0);
        ctx.restore();
      }
    } else {
      for (const s of [-1, 1]) {
        fs(ctx, env, [[s * hrx * 0.97, -hry * 0.2], [s * hrx * 0.82, -hry * 1.38], [s * hrx * 0.18, -hry * 0.94]], c);
        shape(ctx, [[s * hrx * 0.8, -hry * 0.55], [s * hrx * 0.74, -hry * 1.1], [s * hrx * 0.38, -hry * 0.88]], inner, null, 0);
      }
    }
  } else if (ek.tur === 'kuyruk') {
    const tw = env.tw;
    const sway = Math.sin(t * 2.6) * 0.25;
    const tc = env.col(ek.renk || env.C.renkler.kuyruk || env.C.renkler.kafa || '#ddd');
    ctx.save();
    ctx.translate(-tw * 0.4, -env.th * 0.12);
    if (ek.stil === 'tilki') {
      ctx.rotate(-0.9 + sway * 0.5);
      fs(ctx, env, ellipsePts(env.th * 0.5, env.th * 0.17, 24, -env.th * 0.45, 0), tc);
      fs(ctx, env, ellipsePts(env.th * 0.14, env.th * 0.15, 16, -env.th * 0.88, 0), '#ffffff');
    } else {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        pts.push([-u * env.th * 0.55 + Math.sin(u * 3 + t * 2.6) * 10 * u, -u * env.th * 0.5 - Math.sin(u * 2.2 + sway) * 14]);
      }
      strokeLine(ctx, pts, env.line, env.lw * 2 + env.th * 0.1);
      strokeLine(ctx, pts, tc, env.th * 0.1);
      if (env.C.renkler.kuyrukUc) strokeLine(ctx, pts.slice(-3), env.col(env.C.renkler.kuyrukUc), env.th * 0.1);
      if (env.C.isik) strokeLine(ctx, pts.map(([x, y]) => [x - 2, y - 2]), lighter(tc, 0.3), env.th * 0.03);
    }
    ctx.restore();
  } else if (ek.tur === 'pelerin') {
    const { tw, th } = env;
    const wv = Math.sin(t * 3) * 6;
    const pc = env.col(ek.renk || '#e63946');
    fs(ctx, env, [[-tw * 0.46, -th + 12], [tw * 0.46, -th + 12], [tw * 0.72 + wv, th * 0.5], [tw * 0.1 + wv * 0.5, th * 0.62], [-tw * 0.3 - wv * 0.5, th * 0.52], [-tw * 0.72 - wv, th * 0.45]], pc);
  }
}

export function drawEkFront(ctx, ek, env) {
  const { hrx, hry, t } = env;
  const hair = env.col(ek.renk || env.C.renkler.sac || '#222');
  const cl = env.col(ek.renk || '#e63946');
  const ey = (-0.06 + (env.C.yuz?.yukseklik ?? 0)) * hry;
  const ex = 0.4 * hrx * (env.C.yuz?.aralik ?? 1);
  switch (ek.tur) {
    case 'sac':
      const fringe = (xs, drop = 0.42) => xs.forEach((x, k) => {
        const sg = x < 0 ? -1 : 1;
        strokeLine(ctx, [[x * hrx, -hry * 0.99], [(x + sg * 0.04 + 0.03 * k) * hrx, -hry * (0.99 - drop * 0.5)], [(x + sg * 0.14) * hrx, -hry * (0.99 - drop)]], env.line, env.lw * 0.95);
      });
      if (ek.stil === 'ikili') {
        for (const sd of [-1, 1]) {
          const bx = sd * hrx * 0.8;
          const by = -hry * 0.86;
          for (const ang of [-1.1, -0.45, 0.2, 0.85]) {
            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(sd * ang * 0.9 - 0.35 + (sd > 0 ? 0.7 : 0));
            shape(ctx, ellipsePts(hrx * 0.4, hrx * 0.12, 18, sd * hrx * 0.34, -hrx * 0.04), hair, env.line, env.lw * 0.9);
            ctx.restore();
          }
          fillCircle(ctx, bx, by, hrx * 0.06, hair, env.line, env.lw * 0.8);
        }
        fringe([-0.3, -0.08, 0.16], 0.4);
      } else if (ek.stil === 'tarak') {
        for (let i = 0; i < 6; i++) {
          const x = (i - 2.5) * 0.16;
          const y0 = -hry * Math.sqrt(Math.max(0.05, 1 - (x * 0.98) ** 2)) * 0.99;
          strokeLine(ctx, [[x * hrx, y0 + 3], [x * hrx * 1.04, y0 - hry * 0.2]], env.line, env.lw * 0.95);
        }
      } else if (ek.stil === 'bukle') {
        for (let i = 0; i < 9; i++) {
          const x = (i - 4) * 0.19;
          const y = -hry * Math.sqrt(Math.max(0.04, 1 - x * x)) * 0.98;
          shape(ctx, ellipsePts(hrx * 0.13, hrx * 0.13, 12, x * hrx, y), hair, env.line, env.lw * 0.9);
        }
      } else if (ek.stil === 'firca') {
        // yana savrulan at kuyruğu: üç esnek çizgi + kâkül
        for (const k of [0, 1, 2, 3]) {
          const o = k * 0.2;
          strokeLine(ctx, [[-hrx * (0.25 + o * 0.5), -hry * 0.99], [-hrx * (0.85 + o), -hry * (1.4 + o * 0.3)], [-hrx * (1.5 + o), -hry * (1.3 - o * 0.4)], [-hrx * (1.85 + o * 1.2), -hry * (0.9 - o * 1.2)]], env.line, env.lw * 0.9);
        }
        fringe([-0.05, 0.14, 0.34, 0.52], 0.34);
      } else if (ek.stil === 'topuz-sarmal') {
        const bx = hrx * 0.78;
        const by = -hry * 1.05;
        shape(ctx, ellipsePts(hrx * 0.26, hrx * 0.26, 18, bx, by), hair, env.line, env.lw);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const a = i * 0.45;
          const r = hrx * (0.03 + i * 0.0072);
          const px = bx + Math.cos(a) * r;
          const py = by + Math.sin(a) * r;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.strokeStyle = env.line;
        ctx.lineWidth = env.lw * 0.7;
        ctx.stroke();
        strokeLine(ctx, [[-hrx * 0.85, -hry * 0.52], [-hrx * 0.4, -hry * 0.82], [hrx * 0.2, -hry * 0.9], [hrx * 0.7, -hry * 0.78]], env.line, env.lw);
        fringe([-0.45, -0.2, 0.05], 0.3);
      } else if (ek.stil === 'lule') {
        for (let i = 0; i < 7; i++) {
          const x = (i - 3) * 0.2;
          const y = -hry * Math.sqrt(Math.max(0.04, 1 - x * x)) * 0.97;
          shape(ctx, ellipsePts(hrx * 0.11, hrx * 0.11, 12, x * hrx, y + hry * 0.1), hair, env.line, env.lw * 0.8);
        }
      } else if (ek.stil === 'topuz') {
        fillCircle(ctx, 0, -hry * 1.2, hry * 0.3, hair, env.line, env.lw);
        fs(ctx, env, hairCap(env), hair);
      } else if (ek.stil === 'dikenli') {
        const pts = [];
        const N = 11;
        for (let i = 0; i <= N; i++) {
          const a = Math.PI * (1.08 + (0.84 * i) / N);
          const r = i % 2 ? 1.55 : 1.02;
          pts.push([(hrx + 2) * r * Math.cos(a), (hry + 2) * r * Math.sin(a)]);
        }
        pts.push([hrx * 0.8, -hry * 0.35], [0, -hry * 0.5], [-hrx * 0.8, -hry * 0.35]);
        fs(ctx, env, pts, hair);
      } else if (ek.stil === 'tutam') {
        for (const [dx, dy, k] of [[0, -hry - 20, 0], [-8, -hry - 14, -1], [8, -hry - 14, 1]]) {
          strokeLine(ctx, [[k * 3, -hry + 3], [k * 5 + dx * 0.4, dy * 0.6 - 4], [dx + Math.sin(t * 2 + k) * 2, dy]], env.line, env.lw * 1.1);
        }
      } else if (ek.stil !== 'kabarik') fs(ctx, env, hairCap(env), hair);
      break;
    case 'sapka': {
      const hc = env.col(ek.renk || '#3b82f6');
      const dome = (rx, ry, y0) => {
        const pts = [];
        for (let i = 0; i <= 16; i++) {
          const a = Math.PI * (1 + i / 16);
          pts.push([rx * Math.cos(a), y0 + ry * Math.sin(a)]);
        }
        return pts;
      };
      if (ek.stil === 'silindir') {
        const col = env.col(ek.renk || '#2a2a35');
        fillEllipse(ctx, 0, -hry * 0.66, hrx * 1.3, hry * 0.13, 0, col, env.line, env.lw);
        fs(ctx, env, rrectPts(-hrx * 0.74, -hry * 1.75, hrx * 0.74, -hry * 0.66, 5), col);
        shape(ctx, rrectPts(-hrx * 0.74, -hry * 0.9, hrx * 0.74, -hry * 0.74, 2), env.col(ek.bant || '#e63946'), null, 0);
      } else if (ek.stil === 'kep') {
        fs(ctx, env, dome(hrx * 1.04, hry * 0.9, -hry * 0.5), hc);
        fillEllipse(ctx, hrx * 0.62, -hry * 0.5, hrx * 0.7, hry * 0.12, 0.04, darker(hc, -0.15), env.line, env.lw);
      } else if (ek.stil === 'kask') {
        const col = env.col(ek.renk || '#ffd23f');
        fs(ctx, env, dome(hrx * 1.08, hry * 0.95, -hry * 0.5), col);
        fs(ctx, env, rrectPts(-hrx * 1.22, -hry * 0.56, hrx * 1.22, -hry * 0.42, 5), darker(col, -0.12));
        shape(ctx, rrectPts(-hrx * 0.14, -hry * 1.44, hrx * 0.14, -hry * 0.6, 3), darker(col, -0.2), env.line, env.lw * 0.6);
      } else if (ek.stil === 'sef') {
        const col = env.col(ek.renk || '#ffffff');
        for (const [x, y, r] of [[-0.55, -1.15, 0.42], [0.55, -1.15, 0.42], [0, -1.45, 0.5], [-0.28, -0.98, 0.4], [0.28, -0.98, 0.4]]) {
          fillCircle(ctx, x * hrx, y * hry, r * hrx, col, env.line, env.lw);
        }
        fs(ctx, env, rrectPts(-hrx * 0.8, -hry * 0.95, hrx * 0.8, -hry * 0.55, 4), col);
      } else if (ek.stil === 'parti') {
        const col = env.col(ek.renk || '#e26d9b');
        fs(ctx, env, [[-hrx * 0.5, -hry * 0.66], [hrx * 0.5, -hry * 0.66], [hrx * 0.08, -hry * 1.95]], col);
        for (const [x, y] of [[-0.12, -1.05], [0.15, -1.35], [-0.02, -1.6]]) fillCircle(ctx, x * hrx, y * hry, hrx * 0.07, '#ffffff');
        fillCircle(ctx, hrx * 0.08, -hry * 1.97, hrx * 0.12, '#ffd23f', env.line, env.lw * 0.7);
      } else if (ek.stil === 'tac') {
        const col = env.col(ek.renk || '#ffc533');
        const pts = [[-hrx * 0.7, -hry * 0.68]];
        for (let i = 0; i <= 4; i++) {
          const x = -hrx * 0.7 + (hrx * 1.4 * i) / 4;
          pts.push([x, -hry * 1.45], [x + (hrx * 0.7) / 4, -hry * 1.05]);
        }
        pts.pop();
        pts.push([hrx * 0.7, -hry * 0.68]);
        fs(ctx, env, pts, col);
        for (const x of [-0.35, 0, 0.35]) fillCircle(ctx, x * hrx, -hry * 0.8, hrx * 0.06, '#e63946');
      } else if (ek.stil === 'astronot') {
        // cam kask: gradyanlı kubbe + yansıma + boyun halkası
        const rx = hrx * 1.32;
        const ry = hry * 1.32;
        ctx.save();
        const gr = ctx.createRadialGradient(-rx * 0.35, -ry * 0.45, 2, 0, 0, rx);
        gr.addColorStop(0, 'rgba(255,255,255,0.38)');
        gr.addColorStop(0.55, 'rgba(180,220,255,0.12)');
        gr.addColorStop(1, 'rgba(120,170,230,0.30)');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.strokeStyle = env.col(ek.renk || '#eef1f8');
        ctx.lineWidth = env.lw * 2.2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(70,90,130,0.55)';
        ctx.lineWidth = env.lw * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx - env.lw * 1.4, ry - env.lw * 1.4, 0, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, rx * 0.8, Math.PI * 1.1, Math.PI * 1.42);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = env.lw * 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, rx * 0.8, Math.PI * 1.5, Math.PI * 1.56);
        ctx.stroke();
        ctx.restore();
      } else {
        // bere
        fs(ctx, env, dome(hrx * 1.05, hry * 0.88, -hry * 0.5), hc);
        fs(ctx, env, rrectPts(-hrx * 1.08, -hry * 0.66, hrx * 1.08, -hry * 0.38, 6), lighter(hc, 0.25));
        fillCircle(ctx, 0, -hry * 1.43, hry * 0.17, lighter(hc, 0.45), env.line, env.lw);
      }
      break;
    }
    case 'gozluk': {
      const r = hrx * 0.26;
      if (ek.stil === 'gunes') {
        const col = env.col(ek.renk || '#1d1d2b');
        for (const s of [-1, 1]) fs(ctx, env, rrectPts(s * ex - r * 1.1, ey - r * 0.8, s * ex + r * 1.1, ey + r * 0.8, r * 0.5), col);
        strokeLine(ctx, [[-ex + r * 1.1, ey - r * 0.2], [ex - r * 1.1, ey - r * 0.2]], env.line, env.lw);
      } else {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(s * ex, ey, r, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fill();
          ctx.strokeStyle = env.col(ek.renk || env.C.cizgi.renk);
          ctx.lineWidth = env.lw * 1.1;
          ctx.stroke();
        }
        strokeLine(ctx, [[-ex + r, ey], [ex - r, ey]], env.col(ek.renk || env.C.cizgi.renk), env.lw);
      }
      break;
    }
    case 'anten': {
      const ac = env.col(ek.renk || '#ff6b6b');
      const sw = Math.sin(t * 3) * 0.12;
      ctx.save();
      ctx.translate(0, -hry);
      ctx.rotate(sw);
      strokeLine(ctx, [[0, 2], [0, -hry * 0.5]], env.line, env.lw * 1.1);
      fillCircle(ctx, 0, -hry * 0.58, hry * 0.12, ac, env.line, env.lw * 0.8);
      ctx.restore();
      break;
    }
    case 'biyik': {
      const col = env.col(ek.renk || '#3a2a20');
      for (const s of [-1, 1]) {
        fs(ctx, env, [[0, hry * 0.25], [s * hrx * 0.28, hry * 0.17], [s * hrx * 0.5, hry * 0.3], [s * hrx * 0.28, hry * 0.3]], col);
      }
      break;
    }
    case 'sakal': {
      const col = env.col(ek.renk || '#3a2a20');
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (0.05 + (0.9 * i) / 12);
        pts.push([(hrx + 2) * Math.cos(a), (hry + 2) * Math.sin(a)]);
      }
      pts.push([hrx * 0.5, hry * 0.5], [0, hry * 0.62], [-hrx * 0.5, hry * 0.5]);
      fs(ctx, env, pts, col);
      break;
    }
    case 'kravat': {
      const { tw, th } = env;
      fs(ctx, env, [[-tw * 0.07, -th + 6], [tw * 0.07, -th + 6], [tw * 0.1, -th + 20], [-tw * 0.1, -th + 20]], cl);
      fs(ctx, env, [[-tw * 0.09, -th + 20], [tw * 0.09, -th + 20], [tw * 0.15, -th * 0.38], [0, -th * 0.3], [-tw * 0.15, -th * 0.38]], cl);
      break;
    }
    case 'papyon': {
      const { tw, th } = env;
      const y = -th + 9;
      fs(ctx, env, [[0, y], [-tw * 0.26, y - 12], [-tw * 0.26, y + 12]], cl);
      fs(ctx, env, [[0, y], [tw * 0.26, y - 12], [tw * 0.26, y + 12]], cl);
      fillCircle(ctx, 0, y, tw * 0.06, darker(cl), env.line, env.lw * 0.8);
      break;
    }
    case 'atki': {
      const { tw, th } = env;
      const col = env.col(ek.renk || '#2a9d8f');
      fs(ctx, env, rrectPts(-tw * 0.52, -th - 2, tw * 0.52, -th + 22, 10), col);
      fs(ctx, env, [[tw * 0.12, -th + 18], [tw * 0.34, -th + 18], [tw * 0.4 + Math.sin(t * 2.5) * 4, -th * 0.35], [tw * 0.16, -th * 0.42]], darker(col, -0.1));
      break;
    }
    default:
  }
}

function wrapLines(ctx, text, maxW) {
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
}

// ════════════════════════════════════════════════════════════════════════════
//  EFEKTLER (başın üstünde)
// ════════════════════════════════════════════════════════════════════════════
export function drawEffect(ctx, name, o) {
  // o: { x, y (efekt merkezi), age (sn), t, s (boyut = baş yarıçapı), line }
  const { x, y, age, t, s } = o;
  const pop = easings.outBack(clamp01(age / 0.32));
  const fade = clamp01(age / 0.15);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.globalAlpha *= fade;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const lw = Math.max(2, s * 0.07);
  switch (name) {
    case 'ampul': {
      const g = 0.6 + 0.4 * Math.sin(t * 9);
      ctx.save();
      ctx.shadowColor = '#ffe066';
      ctx.shadowBlur = s * 0.6 * g;
      fillCircle(ctx, 0, 0, s * 0.42, '#ffe066', o.line, lw);
      ctx.restore();
      shape(ctx, rrectPts(-s * 0.17, s * 0.36, s * 0.17, s * 0.62, 3), '#b9bcc9', o.line, lw * 0.8);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI + (i / 6) * Math.PI;
        const r0 = s * 0.62;
        const r1 = s * (0.8 + 0.1 * g);
        strokeLine(ctx, [[Math.cos(a) * r0, Math.sin(a) * r0 - s * 0.05], [Math.cos(a) * r1, Math.sin(a) * r1 - s * 0.05]], '#ffb703', lw);
      }
      break;
    }
    case 'unlem':
      shape(ctx, rrectPts(-s * 0.1, -s * 0.5, s * 0.1, s * 0.12, s * 0.07), '#e63946', o.line, lw);
      fillCircle(ctx, 0, s * 0.36, s * 0.11, '#e63946', o.line, lw);
      break;
    case 'soru':
      ctx.beginPath();
      ctx.arc(0, -s * 0.22, s * 0.26, Math.PI * 1.05, Math.PI * 2.55);
      ctx.quadraticCurveTo(s * 0.04, s * 0.18, 0, s * 0.22);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = lw * 2;
      ctx.stroke();
      fillCircle(ctx, 0, s * 0.5, s * 0.075, '#3b82f6');
      break;
    case 'kalp':
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.7 + k / 3) % 1;
        ctx.save();
        ctx.globalAlpha *= Math.sin(p * Math.PI);
        heartPath(ctx, (k - 1) * s * 0.5 + Math.sin(p * 6 + k) * s * 0.08, s * 0.4 - p * s * 1.1, s * (0.16 + k * 0.03));
        ctx.fillStyle = '#ff4d6d';
        ctx.fill();
        ctx.restore();
      }
      break;
    case 'yildiz':
      for (let k = 0; k < 4; k++) {
        const a = k * 1.7 + 0.4;
        const tw = 0.5 + 0.5 * Math.sin(t * 7 + k * 2);
        starPath(ctx, Math.cos(a) * s * 0.75, Math.sin(a) * s * 0.55, s * (0.14 + 0.13 * tw), 0.4, 4);
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
      }
      break;
    case 'sinir': {
      const a = 1 + Math.sin(t * 14) * 0.12;
      ctx.scale(a, a);
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = lw * 1.5;
      for (const k of [0, 1, 2, 3]) {
        const ang = (k * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * s * 0.17, Math.sin(ang) * s * 0.17, s * 0.15, ang + Math.PI * 0.85, ang + Math.PI * 1.65);
        ctx.stroke();
      }
      break;
    }
    case 'muzik':
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.6 + k / 3) % 1;
        ctx.save();
        ctx.globalAlpha *= Math.sin(p * Math.PI);
        const nx = (k - 1) * s * 0.55 + Math.sin(p * 5 + k) * s * 0.1;
        const ny = s * 0.3 - p * s;
        fillEllipse(ctx, nx, ny, s * 0.11, s * 0.08, -0.4, '#6c5ce7');
        strokeLine(ctx, [[nx + s * 0.1, ny], [nx + s * 0.1, ny - s * 0.42], [nx + s * 0.26, ny - s * 0.32]], '#6c5ce7', lw);
        ctx.restore();
      }
      break;
    case 'uyku':
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.5 + k / 3) % 1;
        ctx.save();
        ctx.globalAlpha *= Math.sin(p * Math.PI);
        const z = s * (0.14 + 0.1 * k);
        ctx.translate(k * s * 0.4, s * 0.3 - p * s * 0.9);
        strokeLine(ctx, [[-z, -z], [z, -z], [-z, z], [z, z]], '#4c6ef5', lw * 1.2);
        ctx.restore();
      }
      break;
    default:
  }
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════════════
//  KONUŞMA BALONU — sahne pikseli biriminde çizilir (çağıran ctx'i ölçeklemiştir)
// ════════════════════════════════════════════════════════════════════════════
const OUT = easings.outBack;

/** Balonun ölçüleri (metin sarılır) */
export function bubbleLayout(ctx, text, tur, fsz, maxW, font, weight) {
  ctx.font = `${weight} ${fsz}px ${fontCss(font)}`;
  const pad = fsz * 0.62;
  const lines = wrapLines(ctx, text, maxW - pad * 2);
  let tw = 0;
  for (const l of lines) tw = Math.max(tw, ctx.measureText(l).width);
  const lh = fsz * 1.2;
  const w = Math.max(fsz * 2.2, tw + pad * 2);
  const h = Math.max(fsz * 1.7, lines.length * lh + pad * 1.5);
  return { lines, w, h, lh, pad, tw };
}

/**
 * o: { text, tur, fsz, font, weight, zemin, cizgi, yazi, lw, ax, ay (kafa üstü, orijine göre), side (±1),
 *      bounds: {x0, x1, y0}, age, shown (görünen harf sayısı), out (0–1 sönme), L (bubbleLayout çıktısı) }
 */
export function drawBubble(ctx, o) {
  const { L, fsz, ax, ay, side } = o;
  const tur = o.tur || 'soyle';
  const gap = fsz * (tur === 'dusun' ? 2.1 : 1.35);
  const m = fsz * 0.5;
  let bw = L.w;
  let bh = L.h;
  if (tur === 'bagir') {
    bw *= 1.18;
    bh *= 1.3;
  }
  let cx = ax + side * (bw * 0.27 + fsz * 0.3);
  cx = clamp(cx, o.bounds.x0 + m + bw / 2, o.bounds.x1 - m - bw / 2);
  let by = ay - gap; // balonun alt kenarı
  if (by - bh < o.bounds.y0 + m) by = o.bounds.y0 + m + bh;
  const x0 = cx - bw / 2;
  const x1 = cx + bw / 2;
  const y0 = by - bh;
  const pop = OUT(clamp01(o.age / 0.22));
  const alpha = clamp01(o.age / 0.08) * (1 - clamp01(o.out || 0));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(ax, ay - fsz * 0.4);
  ctx.scale(0.55 + 0.45 * pop, 0.55 + 0.45 * pop);
  ctx.translate(-ax, -(ay - fsz * 0.4));
  const lw = o.lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = o.cizgi;
  ctx.lineWidth = lw;
  ctx.fillStyle = o.zemin;
  ctx.shadowColor = 'rgba(30,20,10,0.22)';
  ctx.shadowBlur = fsz * 0.35;
  ctx.shadowOffsetY = fsz * 0.12;
  const rad = Math.min(bh / 2, fsz * (tur === 'dusun' ? 1.6 : 0.95));
  // tail / yan öğeler
  const tipX = clamp(ax, x0 + rad * 0.6, x1 - rad * 0.6);
  const tipY = ay - fsz * 0.25;
  if (tur === 'bagir') {
    const cxm = (x0 + x1) / 2;
    const cym = (y0 + by) / 2;
    const n = 20;
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU;
      const spike = i % 2 ? 0.8 : 1.04 + 0.05 * Math.sin(i * 2.3);
      pts.push([cxm + Math.cos(a) * (bw / 2) * spike * 1.05, cym + Math.sin(a) * (bh / 2) * spike * 1.12]);
    }
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();
  } else {
    if (tur === 'fisilda') ctx.setLineDash([fsz * 0.32, fsz * 0.2]);
    rr(ctx, x0, y0, bw, bh, rad);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();
    ctx.setLineDash([]);
    if (tur === 'dusun') {
      const bx = clamp(ax, x0 + rad, x1 - rad);
      [[0.0, 0.2], [0.42, 0.14], [0.8, 0.09]].forEach(([k, r]) => {
        const px = lerp(bx, tipX, k) + (k ? 0 : 0);
        const py = lerp(by + fsz * 0.3, tipY, k);
        fillCircle(ctx, px, py + fsz * 0.2, fsz * r * 1.6, o.zemin, o.cizgi, lw * 0.85);
      });
    } else {
      // kuyruk: iki kenarı çiz, tabanı kutu dolgusu ile örtülür
      const tb = clamp(tipX, x0 + rad + fsz * 0.3, x1 - rad - fsz * 0.3);
      const half = fsz * 0.42;
      const tx = lerp(tb, tipX, 0.9);
      ctx.beginPath();
      ctx.moveTo(tb - half, by - lw * 0.4);
      ctx.lineTo(tx, tipY);
      ctx.lineTo(tb + half, by - lw * 0.4);
      ctx.fillStyle = o.zemin;
      if (tur === 'fisilda') ctx.setLineDash([fsz * 0.25, fsz * 0.16]);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tb - half + lw * 0.5, by - lw * 0.5);
      ctx.lineTo(tb + half - lw * 0.5, by - lw * 0.5);
      ctx.strokeStyle = o.zemin;
      ctx.lineWidth = lw * 1.3;
      ctx.stroke();
    }
  }
  // metin
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = o.yazi;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${o.weight} ${fsz * (tur === 'fisilda' ? 0.9 : tur === 'bagir' ? 1.06 : 1)}px ${fontCss(o.font)}`;
  let left = o.shown;
  const textH = L.lines.length * L.lh;
  const ty0 = (y0 + by) / 2 - textH / 2 + L.lh / 2;
  const tx0 = (x0 + x1) / 2 - L.tw / 2;
  for (let i = 0; i < L.lines.length && left > 0; i++) {
    const seg = [...L.lines[i]].slice(0, left).join('');
    left -= [...L.lines[i]].length + 1;
    ctx.fillText(seg, tx0, ty0 + i * L.lh);
  }
  ctx.restore();
}

export { pathSmooth };
