// Deterministik kağıt dokusu (gürültü + lif çizgileri). Dışa aktarımda her karede aynı olur.
let noiseCanvas = null;
const patterns = new WeakMap();

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildNoise() {
  const S = 384;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  const r = rng(7);
  for (let i = 0; i < S * S; i++) {
    const v = 128 + (r() - 0.5) * 34;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // Kağıt lifleri
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    const y = r() * S;
    const a = r() * Math.PI;
    const l = 4 + r() * 16;
    ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  return c;
}

export function drawPaperTexture(ctx, w, h, strength = 0.5) {
  if (strength <= 0) return;
  noiseCanvas ||= buildNoise();
  let pat = patterns.get(ctx);
  if (!pat) {
    pat = ctx.createPattern(noiseCanvas, 'repeat');
    patterns.set(ctx, pat);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(1, strength);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVignette(ctx, w, h, strength = 0.25) {
  if (strength <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(40,20,10,${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export { makeCanvas };
