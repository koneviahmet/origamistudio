// Parçacık katmanı — deterministik: her parçacığın konumu zamanın saf fonksiyonudur
// (simülasyon yok). Aynı t her zaman aynı kareyi verir; önizleme = dışa aktarım.
//
// Efektin TANIMI kütüphanededir (data/library/efektler/<id>.json, "type": "particles"):
//   { "type": "particles", "name": "Kağıt konfeti", "motion": "dus" | "yuksel" | "yerinde",
//     "shape": "kagit" | "kar" | "damla" | "yaprak" | "kabarcik" | "pirilti" | "varlik",
//     "asset": "kalp" (shape=varlik), "count", "size", "speed" (px/sn), "sway", "spin", "wind",
//     "colors": [...], "prewarm": true }
// Sahnedeki katman bu öğeye başvurur ve istediği alanı geçersiz kılar:
//   { "type": "particles", "particle": "konfeti", "mode": "surekli" | "patlama",
//     "count": 120, "size": 18, "speed": 1 (çarpan), "wind": 0, "seed": 1,
//     "colors": [...], "area": [x, y, w, h], "asset": "kalp",
//     "x": 540, "y": 700 (patlama merkezi), "start": 2, "end": 9 }
import { shade } from './color.js';
import { resolveRef } from './theme.js';
import { drawStyled } from './styles.js';
import { assetPalette } from './origami.js';

const TAU = Math.PI * 2;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Yerleşik yedek tanımlar — asıl kaynak kütüphanedeki "efektler" öğeleridir
 * (npm run seed ile aynı değerlerle yazılır). Kütüphanede bulunamazsa bunlar kullanılır.
 * motion: dus (yukarıdan aşağı), yuksel (aşağıdan yukarı), yerinde (alanda parıldar)
 */
export const PARTICLE_PRESETS = {
  konfeti: {
    name: 'Kağıt konfeti', motion: 'dus', shape: 'kagit', count: 120, size: 20, speed: 260, sway: 40, spin: 7,
    colors: ['$vurgu', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ffffff'],
  },
  kar: { name: 'Kar', motion: 'dus', shape: 'kar', count: 140, size: 9, speed: 90, sway: 30, spin: 1, colors: ['#ffffff', '#eaf4ff'], prewarm: true },
  yagmur: { name: 'Yağmur', motion: 'dus', shape: 'damla', count: 160, size: 30, speed: 1300, sway: 0, spin: 0, colors: ['rgba(190,220,255,0.7)'], prewarm: true },
  yaprak: {
    name: 'Sonbahar yaprakları', motion: 'dus', shape: 'yaprak', count: 45, size: 34, speed: 140, sway: 90, spin: 2.5,
    colors: ['#e76f51', '#f4a261', '#e9c46a', '#c8553d', '#8c4a2f'],
  },
  kabarcik: { name: 'Kabarcıklar', motion: 'yuksel', shape: 'kabarcik', count: 50, size: 22, speed: 120, sway: 25, spin: 0, colors: ['rgba(220,245,255,0.85)'], prewarm: true },
  'yildiz-tozu': { name: 'Yıldız tozu', motion: 'yerinde', shape: 'pirilti', count: 70, size: 28, speed: 20, sway: 10, spin: 0, colors: ['#fff6c2', '#ffffff', '$baslik'], prewarm: true },
  varlik: { name: 'Varlık yağmuru (kütüphaneden)', motion: 'dus', shape: 'varlik', count: 30, size: 70, speed: 200, sway: 60, spin: 1.5, colors: [], asset: 'kalp' },
};
export const PARTICLE_MODES = { surekli: 'Sürekli', patlama: 'Patlama (tek sefer)' };
export const PARTICLE_MOTIONS = { dus: 'Düşer (yukarıdan aşağı)', yuksel: 'Yükselir (aşağıdan yukarı)', yerinde: 'Yerinde parıldar' };
export const PARTICLE_SHAPES = {
  kagit: 'Kağıt parçası', kar: 'Kar tanesi', damla: 'Yağmur damlası', yaprak: 'Yaprak',
  kabarcik: 'Kabarcık', pirilti: 'Pırıltı', varlik: 'Kütüphane modeli',
};
// Eski ön ayar adları → kütüphane id'leri
const ALIASES = { varlik: 'kalp-yagmuru' };

/** Katmanın efekt tanımı: kütüphane öğesi (type=particles) → yerleşik yedek */
export function particleDef(layer, res) {
  const id = layer.particle || layer.preset || 'konfeti';
  for (const k of [id, ALIASES[id]]) {
    const a = k && res?.assets?.get(k);
    if (a && a.type === 'particles') return a;
  }
  return PARTICLE_PRESETS[id] || PARTICLE_PRESETS.konfeti;
}

function drawShape(ctx, shape, size, color, flip, age, p) {
  switch (shape) {
    case 'kagit': {
      // Kağıt parçası: 3B çevrilme hissi için dikey ölçek kosinüsle değişir, arka yüz koyu
      ctx.scale(1, flip);
      ctx.fillStyle = flip < 0 ? shade(color, -0.3) : color;
      ctx.fillRect(-size / 2, -size * 0.3, size, size * 0.6);
      break;
    }
    case 'kar': {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.lineTo(Math.cos(a) * size / 2, Math.sin(a) * size / 2);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'damla': {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, size * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(0, size / 2);
      ctx.stroke();
      break;
    }
    case 'yaprak': {
      ctx.scale(1, flip);
      ctx.fillStyle = flip < 0 ? shade(color, -0.25) : color;
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.lineTo(0, -size * 0.28);
      ctx.lineTo(size / 2, 0);
      ctx.lineTo(0, size * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(color, -0.2);
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.lineTo(size / 2, 0);
      ctx.lineTo(0, size * 0.28);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'kabarcik': {
      const r = size / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, size * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, TAU);
      ctx.fill();
      break;
    }
    case 'pirilti': {
      // Dört köşeli parıltı; parlaklığı yaşa göre titreşir
      const tw = 0.5 + 0.5 * Math.sin(age * p.tw + p.ph);
      const s = (size / 2) * (0.4 + tw * 0.6);
      ctx.globalAlpha *= 0.3 + tw * 0.7;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

/**
 * Parçacık katmanını dünya koordinatlarında çizer.
 * st: katmanın çözülmüş durumu (x, y = patlama merkezi; scale = boyut çarpanı; opacity)
 */
export function drawParticles(ctx, layer, t, st, scene, res, th, view) {
  const P = particleDef(layer, res);
  // view: sahne koordinatında görünen alan (çoklu formatta sahneden geniş olabilir)
  const V = view || { x: 0, y: 0, w: scene.width, h: scene.height };
  const W = V.w;
  const H = V.h;
  const count = Math.min(600, Math.max(1, layer.count ?? P.count));
  const baseSize = (layer.size ?? P.size) * (st.scale || 1);
  const speedMul = layer.speed ?? 1;
  const wind = layer.wind ?? P.wind ?? 0;
  const mode = layer.mode || 'surekli';
  const t0 = layer.start ?? 0;
  const local = t - t0;
  if (local < 0) return null;
  const colors = (layer.colors?.length ? layer.colors : P.colors?.length ? P.colors : ['#ffffff']).map((c) => resolveRef(c, th));
  const shape = layer.asset || P.shape === 'varlik' ? 'varlik' : P.shape;
  const asset = shape === 'varlik' ? res.assets?.get(layer.asset || P.asset) : null;
  const prewarm = layer.prewarm ?? !!P.prewarm;
  const motion = P.motion || 'dus';
  const area = layer.area || (motion === 'dus' ? [V.x, V.y - 80, W, 0] : motion === 'yuksel' ? [V.x, V.y + H + 60, W, 0] : [V.x, V.y, W, H]);
  const seed = (layer.seed ?? 1) * 7919;
  const alpha = st.opacity ?? 1;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const r = rng(seed + i * 131);
    const p = {
      u: r(), v: r(), sz: 0.55 + r() * 0.65, sp: 0.7 + r() * 0.6, ph: r() * TAU, sw: 0.6 + r() * 0.8,
      rot: r() * 360, rs: (r() - 0.5) * 2, spin: 0.5 + r(), col: Math.floor(r() * colors.length), off: r(), tw: 2 + r() * 4, ang: r() * TAU,
    };
    const size = baseSize * p.sz;
    let x;
    let y;
    let age;

    if (mode === 'patlama') {
      // Merkezden dışa saçılma: sürtünmeli hız + yerçekimi
      age = local;
      const life = (layer.life ?? 3.2) * (0.8 + p.off * 0.4);
      if (age > life) continue;
      const v0 = (P.speed * 2.6 + 380) * (0.15 + 0.85 * Math.sqrt(p.u)) * p.sp * speedMul;
      const drag = 2.2;
      const d = (1 - Math.exp(-drag * age)) / drag;
      const g = motion === 'yuksel' ? -160 : motion === 'yerinde' ? 40 : 420;
      x = st.x + Math.cos(p.ang) * v0 * d + wind * age + Math.sin(age * p.sw * 3 + p.ph) * (P.sway * 0.4);
      y = st.y + Math.sin(p.ang) * v0 * d * 0.85 - v0 * 0.25 * d + 0.5 * g * age * age;
      const fade = Math.min(1, (life - age) / 0.5);
      ctx.globalAlpha = alpha * Math.max(0, fade);
    } else {
      const v = P.speed * p.sp * speedMul;
      // Rüzgâr düşme / yükselme hızından baskınsa (uçuşan kağıt uçaklar gibi) parçacıklar rüzgârın
      // geldiği kenardan doğar ve ömür yatay geçiş süresidir; aksi hâlde ekranda hiç görünmezler.
      const windy = motion !== 'yerinde' && Math.abs(wind) > v * 0.8;
      const margin = size * 2 + P.sway;
      const travel = motion === 'yerinde' ? 0 : windy ? W + margin * 2 : H + area[3] + 200;
      const life =
        motion === 'yerinde' ? 2.5 + p.off * 2.5 : Math.max(0.3, travel / Math.max(1, windy ? Math.abs(wind) : v));
      const spawn = prewarm ? -p.off * life : p.off * life;
      if (local < spawn) continue;
      age = (local - spawn) % life;
      let sx = area[0] + p.u * area[2];
      let sy = area[1] + p.v * area[3];
      if (windy) {
        sx = wind > 0 ? V.x - margin : V.x + W + margin;
        // Düşerken ekranın alt kenarını aşmasın diye doğma yüksekliği yol boyunca kayacak kadar yukarıda
        const drift = (motion === 'dus' ? v : -v) * life;
        sy = V.y + p.v * H - drift * 0.5;
      }
      const sway = Math.sin(age * p.sw * 1.6 + p.ph) * P.sway;
      if (motion === 'dus') {
        x = sx + sway + wind * age;
        y = sy + v * age;
      } else if (motion === 'yuksel') {
        x = sx + sway + wind * age;
        y = sy - v * age;
      } else {
        x = sx + Math.sin(age * 0.7 + p.ph) * P.sway + wind * age;
        y = sy + Math.cos(age * 0.5 + p.ph) * P.sway * 0.6 - v * age * 0.2;
      }
      const edge = motion === 'yerinde' ? Math.min(age / 0.5, (life - age) / 0.5, 1) : 1;
      ctx.globalAlpha = alpha * Math.max(0, edge);
    }
    if (x < V.x - size * 2 || x > V.x + W + size * 2 || y < V.y - size * 3 || y > V.y + H + size * 3) continue;

    ctx.save();
    ctx.translate(x, y);
    const rot = p.rot + age * p.rs * (P.spin || 0) * 60;
    if (shape === 'damla') ctx.rotate(Math.atan2(P.speed * p.sp, -wind) - Math.PI / 2);
    else ctx.rotate((rot * Math.PI) / 180);
    const flip = Math.cos(age * (P.spin || 0) * p.spin + p.ph);
    if (shape === 'varlik' && asset) {
      const [aw, ah] = asset.size || [200, 200];
      const k = size / Math.max(aw, ah);
      ctx.scale(k, k * (P.spin ? Math.abs(flip) * 0.6 + 0.4 : 1));
      ctx.translate(-aw / 2, -ah / 2);
      drawStyled(ctx, asset, layer.style || scene.style || 'origami', {
        palette: assetPalette(asset, layer.variant),
        alpha: ctx.globalAlpha,
        crease: false,
      });
    } else {
      drawShape(ctx, shape, size, colors[p.col] || '#ffffff', flip, age, p);
    }
    ctx.restore();
  }
  ctx.restore();
  return mode === 'patlama'
    ? { x0: st.x - 300, y0: st.y - 300, x1: st.x + 300, y1: st.y + 300 }
    : { x0: area[0], y0: Math.max(0, area[1]), x1: area[0] + area[2], y1: Math.min(H, area[1] + Math.max(area[3], 40)) };
}
