// Sahne renderer'ı — önizleme ve MP4 dışa aktarım aynı saf fonksiyonu kullanır:
//   renderFrame(ctx, scene, t, res) → sahneyi scene.width × scene.height koordinatlarında çizer.
// res: varlık Map'i ya da { assets: Map, themes: Map, textStyles: Map }.
// Çağıran taraf ctx'e ölçek (önizleme boyutu, dpr) uygulayabilir.
import { sample, prop, loopOffset } from './anim.js';
import { assetPalette } from './origami.js';
import { drawStyled } from './styles.js';
import { applyAnims } from './presets.js';
import { themeContext, resolveRef } from './theme.js';
import { drawPaperTexture, drawVignette } from './texture.js';
import { drawParticles } from './particles.js';
import { drawArrow } from './arrows.js';
import { glyphState } from './textanims.js';
import { drawTransitions } from './transitions.js';
import { pathAt } from './path.js';
import { shade } from './color.js';
import { WIDGET_DRAW, isWidget, deviceGeometry, mediaSize } from './widgets.js';
import { audioApi } from './audiodrive.js';

const DEG = Math.PI / 180;

export const LAYER_PROPS = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotation', 'opacity', 'fold'];
export const TEXT_PROPS = ['size', 'reveal'];
export const PART_PROPS = ['rotation', 'scaleX', 'scaleY', 'x', 'y'];
export const PROP_DEFAULTS = {
  x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1, fold: 1, size: 72, reveal: 1, pathT: 0,
};
export const DEFAULT_FONT = 'Baloo 2';

/**
 * Çoklu format (D1): ana sahneyi başka bir en-boy oranına yerleştirme.
 * format: { width, height, mode: "sigdir" | "kirp", focusX, focusY, zoom, overrides }
 *   sigdir: içerik tamamen görünür, boşluk arka planla dolar
 *   kirp  : hedef tamamen dolar, odak noktası (focusX/Y, 0..1) merkeze alınır, taşan kısım kırpılır
 * @returns {{ s: number, tx: number, ty: number, W: number, H: number }}
 */
export function formatMapping(scene, format) {
  const W0 = scene.width;
  const H0 = scene.height;
  if (!format) return { s: 1, tx: 0, ty: 0, W: W0, H: H0 };
  const FW = format.width;
  const FH = format.height;
  const cover = format.mode === 'kirp';
  const s = (cover ? Math.max(FW / W0, FH / H0) : Math.min(FW / W0, FH / H0)) * (format.zoom ?? 1);
  const fx = format.focusX ?? 0.5;
  const fy = format.focusY ?? 0.5;
  let tx = FW / 2 - fx * W0 * s;
  let ty = FH / 2 - fy * H0 * s;
  // Kırpmada sahnenin dışı görünmesin
  if (cover && W0 * s >= FW) tx = Math.min(0, Math.max(FW - W0 * s, tx));
  if (cover && H0 * s >= FH) ty = Math.min(0, Math.max(FH - H0 * s, ty));
  return { s, tx, ty, W: FW, H: FH };
}

export function normalizeRes(res) {
  if (!res) return { assets: new Map() };
  if (res instanceof Map) return { assets: res };
  return res;
}

export function sceneTheme(scene, res) {
  const th = scene.theme;
  if (!th) return null;
  if (typeof th === 'string') return res.themes?.get(th) || null;
  return th;
}

export function fontCss(family) {
  const f = family || DEFAULT_FONT;
  return f.includes(',') ? f : `"${f}", system-ui, sans-serif`;
}

/** Metin katmanının etkin ayarları: metin stili ← katman alanları */
export function textProps(layer, res) {
  const st = layer.textStyle && res?.textStyles?.get(layer.textStyle);
  return st ? { ...st, ...layer } : layer;
}

function drawBackground(ctx, bg, W, H, t, th) {
  bg = bg || { type: 'solid', color: '#f6efe4' };
  const colors = (bg.colors || []).map((c) => resolveRef(sample(c, t, '#ffffff'), th));
  let fill;
  if (bg.type === 'linear' && colors.length >= 2) {
    const a = (sample(bg.angle, t, 180) || 0) * DEG;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const half = Math.abs((W / 2) * dx) + Math.abs((H / 2) * dy);
    fill = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
    colors.forEach((c, i) => fill.addColorStop(i / (colors.length - 1), c));
  } else if (bg.type === 'radial' && colors.length >= 2) {
    const cx = (bg.cx ?? 0.5) * W;
    const cy = (bg.cy ?? 0.4) * H;
    fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * (bg.radius ?? 0.7));
    colors.forEach((c, i) => fill.addColorStop(i / (colors.length - 1), c));
  } else {
    fill = resolveRef(sample(bg.color, t, colors[0] || '#f6efe4'), th);
  }
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, W, H);
}

/** Katmanın keyframe + döngü değerleri (ön ayarlar hariç) */
export function resolveLayer(layer, t) {
  const st = {};
  for (const p of LAYER_PROPS) st[p] = prop(layer, p, t, PROP_DEFAULTS[p]);
  st.opacity = Math.max(0, Math.min(1, st.opacity));
  st.fold = Math.max(0, Math.min(1, st.fold));
  // Hareket yolu: konum (ve istenirse yön) yoldan gelir; x / y döngüleri üstüne eklenir
  const path = layer.path;
  if (path?.points?.length >= 2) {
    const p = pathAt(path, prop(layer, 'pathT', t, 0));
    st.x = p.x + loopOffset(layer.loops, 'x', t);
    st.y = p.y + loopOffset(layer.loops, 'y', t);
    if (path.orient) st.rotation += p.angle + (path.orientOffset || 0);
  }
  return st;
}

/** Bileşen katmanlarının (grafik / cihaz / medya / dalga) yerel boyutu */
export function widgetSize(layer, res) {
  if (layer.type === 'device') {
    const g = deviceGeometry(layer);
    return [g.w, g.h];
  }
  if (layer.type === 'media') return mediaSize(layer, res);
  if (layer.type === 'chart') return [layer.width || 820, layer.height || 560];
  return [layer.width || 800, layer.height || 240];
}

/** Ön ayarlar dahil tam katman durumu */
export function resolveLayerFull(layer, t, scene, res) {
  const st = resolveLayer(layer, t);
  if (!layer.anims?.length) return st;
  const asset = layer.type === 'text' || isWidget(layer) ? null : res.assets?.get(layer.asset);
  let radius;
  if (isWidget(layer)) {
    const [bw, bh] = widgetSize(layer, res);
    radius = (Math.max(bw, bh) / 2) * Math.abs(st.scale);
  } else if (asset) {
    const [w, h] = asset.size || [200, 200];
    radius = (Math.max(w, h) / 2) * Math.abs(st.scale * Math.max(Math.abs(st.scaleX), Math.abs(st.scaleY)));
  } else {
    const tp = textProps(layer, res);
    radius = (prop(tp, 'size', t, 72) * String(tp.text || '').length * 0.3) * st.scale;
  }
  return applyAnims(layer, st, t, { W: scene.width, H: scene.height, asset, radius, audio: audioApi(scene) });
}

/**
 * Katmanın t anındaki dünya uzayı yönlü kutusu — okların bağlandığı nesne sınırı.
 * @returns {{cx, cy, ux, uy, vx, vy, hw, hh}} merkez, eksen birim vektörleri, yarı boyutlar
 */
export function layerBox(layer, t, scene, res, ctx, fmt) {
  const st = resolveLayerFull(layer, t, scene, res);
  const ov = fmt?.overrides?.[layer.id];
  if (ov) {
    st.x += ov.dx || 0;
    st.y += ov.dy || 0;
    st.scale *= ov.scale ?? 1;
  }
  let lx0 = 0;
  let ly0 = 0;
  let lx1 = 0;
  let ly1 = 0;
  if (layer.type === 'text') {
    const L = textProps(layer, res);
    const size = prop(L, 'size', t, 72);
    let text = String(L.text ?? '');
    if (L.uppercase) text = text.toLocaleUpperCase('tr');
    const lines = text.split('\n');
    ctx.save();
    ctx.font = `${L.weight || 600} ${size}px ${fontCss(L.font)}`;
    let maxW = 0;
    for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);
    ctx.restore();
    const hh = (lines.length * size * (L.lineHeight || 1.15)) / 2;
    const align = L.align || 'center';
    lx0 = align === 'left' ? 0 : align === 'right' ? -maxW : -maxW / 2;
    lx1 = lx0 + maxW;
    ly0 = -hh;
    ly1 = hh;
  } else if (isWidget(layer)) {
    const [bw, bh] = widgetSize(layer, res);
    lx0 = -bw / 2;
    lx1 = bw / 2;
    ly0 = -bh / 2;
    ly1 = bh / 2;
  } else if (layer.type !== 'particles' && layer.type !== 'arrow') {
    const asset = res.assets?.get(layer.asset);
    if (asset) {
      const [w, h] = asset.size || [200, 200];
      const [ax, ay] = layer.anchor || [0.5, 0.5];
      lx0 = -ax * w;
      lx1 = (1 - ax) * w;
      ly0 = -ay * h;
      ly1 = (1 - ay) * h;
    }
  }
  const sx = st.scale * st.scaleX;
  const sy = st.scale * st.scaleY;
  const r = st.rotation * DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const mx = ((lx0 + lx1) / 2) * sx;
  const my = ((ly0 + ly1) / 2) * sy;
  return {
    cx: st.x + mx * c - my * s,
    cy: st.y + mx * s + my * c,
    ux: c, uy: s, vx: -s, vy: c,
    hw: Math.abs(((lx1 - lx0) / 2) * sx),
    hh: Math.abs(((ly1 - ly0) / 2) * sy),
  };
}

function resolveParts(layer, t, partFx) {
  if (!layer.parts && !partFx) return null;
  const out = {};
  const names = new Set([...Object.keys(layer.parts || {}), ...Object.keys(partFx || {})]);
  for (const name of names) {
    const pdef = layer.parts?.[name] || {};
    const st = {};
    for (const p of PART_PROPS) st[p] = sample(pdef[p], t, p.startsWith('scale') ? 1 : 0) + loopOffset(pdef.loops, p, t);
    const fx = partFx?.[name];
    if (fx) {
      for (const k in fx) {
        if (k === 'rotation' || k === 'x' || k === 'y') st[k] += fx[k];
        else st[k] *= fx[k];
      }
    }
    out[name] = st;
  }
  return out;
}

export function isLayerActive(layer, t) {
  if (layer.start != null && t < layer.start) return false;
  if (layer.end != null && t > layer.end) return false;
  return true;
}

function drawGroundShadow(ctx, w, h, sh, amount) {
  const o = typeof sh === 'object' ? sh : {};
  const rx = w * 0.42 * (o.width ?? 1);
  const ry = Math.max(4, h * 0.05 * (o.height ?? 1));
  const cx = w / 2 + (o.x || 0);
  const cy = h + (o.y ?? -ry * 0.3);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  const a = (o.opacity ?? 0.28) * amount;
  g.addColorStop(0, `rgba(60,30,15,${a})`);
  g.addColorStop(1, 'rgba(60,30,15,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawText(ctx, layer, t, alpha, res, th) {
  const L = textProps(layer, res);
  const size = prop(L, 'size', t, 72);
  const reveal = Math.max(0, Math.min(1, prop(L, 'reveal', t, 1)));
  ctx.font = `${L.weight || 600} ${size}px ${fontCss(L.font)}`;
  ctx.textAlign = L.align || 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(L.letterSpacing || 0) * (size / 100)}px`;
  let text = String(L.text ?? '');
  if (L.uppercase) text = text.toLocaleUpperCase('tr');
  const lines = text.split('\n');
  const total = lines.reduce((s, l) => s + [...l].length, 0);
  let budget = Math.round(total * reveal);
  const lh = size * (L.lineHeight || 1.15);
  const y0 = -((lines.length - 1) * lh) / 2;
  let maxW = 0;
  for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);
  const x0 = ctx.textAlign === 'left' ? 0 : ctx.textAlign === 'right' ? -maxW : -maxW / 2;
  const hh = lines.length * lh;

  const tAnims = (L.textAnims || []).filter((a) => !a.off);
  let boxAlpha = 1;
  if (tAnims.length) boxAlpha = glyphState(tAnims, { harf: 0, kelime: 0, satir: 0 }, t, size).alpha;
  ctx.globalAlpha = alpha;
  if (L.box && boxAlpha > 0) {
    const b = L.box;
    const [py, px] = Array.isArray(b.padding) ? b.padding : [b.padding ?? size * 0.3, b.padding ?? size * 0.5];
    ctx.fillStyle = resolveRef(b.color || '#ffffff', th);
    roundRect(ctx, x0 - px, -hh / 2 - py, maxW + px * 2, hh + py * 2, b.radius ?? size * 0.3);
    ctx.save();
    if (b.shadow !== false) {
      ctx.shadowColor = 'rgba(40,20,10,0.25)';
      ctx.shadowBlur = size * 0.25;
      ctx.shadowOffsetY = size * 0.08;
    }
    ctx.globalAlpha = alpha * (b.opacity ?? 1) * Math.min(1, reveal * 4) * boxAlpha;
    ctx.fill();
    ctx.restore();
  }
  if (L.shadow) {
    const s = typeof L.shadow === 'object' ? L.shadow : {};
    ctx.shadowColor = resolveRef(s.color || 'rgba(60,30,15,0.35)', th);
    ctx.shadowBlur = s.blur ?? 12;
    ctx.shadowOffsetX = s.x ?? 0;
    ctx.shadowOffsetY = s.y ?? 6;
  }
  const color = resolveRef(sample(L.color, t, '#3b2a22'), th);
  if (tAnims.length) {
    drawGlyphs(ctx, L, lines, { t, size, lh, y0, maxW, budget, color, alpha, th, anims: tAnims });
  } else lines.forEach((line, i) => {
    const chars = [...line];
    const shown = chars.slice(0, Math.max(0, budget)).join('');
    budget -= chars.length;
    if (!shown) return;
    const y = y0 + i * lh;
    if (L.stroke) {
      ctx.lineWidth = L.stroke.width || 6;
      ctx.strokeStyle = resolveRef(L.stroke.color || '#ffffff', th);
      ctx.lineJoin = 'round';
      ctx.strokeText(shown, 0, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(shown, 0, y);
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  return { x0, y0: -hh / 2, x1: x0 + maxW, y1: hh / 2 };
}

/** Harf harf çizim (metin animasyonları). Her glif kendi dönüşümüyle çizilir. */
function drawGlyphs(ctx, L, lines, o) {
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  const back = /^#[0-9a-f]{6}$/i.test(o.color) ? shade(o.color, -0.35) : o.color;
  let hi = 0; // harf sırası (boşluklar hariç)
  let wi = 0; // kelime sırası
  let budget = o.budget;
  lines.forEach((line, li) => {
    const chars = [...line];
    const lineW = ctx.measureText(line).width;
    const startX = align === 'left' ? 0 : align === 'right' ? -lineW : -lineW / 2;
    const y = o.y0 + li * o.lh;
    let prefix = '';
    let inWord = false;
    for (const ch of chars) {
      const x = startX + ctx.measureText(prefix).width;
      const w = ctx.measureText(prefix + ch).width - (x - startX);
      prefix += ch;
      const space = /\s/.test(ch);
      if (space) {
        if (inWord) wi++;
        inWord = false;
        budget--;
        continue;
      }
      inWord = true;
      if (budget-- <= 0) return;
      const g = glyphState(o.anims, { harf: hi, kelime: wi, satir: li }, o.t, o.size);
      hi++;
      if (g.alpha <= 0.001 || (Math.abs(g.sx) < 0.001 && Math.abs(g.sy) < 0.001)) continue;
      ctx.save();
      ctx.translate(x + w / 2 + g.dx, y + g.dy);
      if (g.rot) ctx.rotate((g.rot * Math.PI) / 180);
      ctx.scale(g.sx, g.sy);
      ctx.globalAlpha = o.alpha * g.alpha;
      if (L.stroke) {
        ctx.lineWidth = L.stroke.width || 6;
        ctx.strokeStyle = resolveRef(L.stroke.color || '#ffffff', o.th);
        ctx.lineJoin = 'round';
        ctx.strokeText(ch, -w / 2, 0);
      }
      // Katlanan harfin arka yüzü koyu (kağıt)
      ctx.fillStyle = g.sy < 0 ? back : o.color;
      ctx.fillText(ch, -w / 2, 0);
      ctx.restore();
    }
    if (inWord) wi++;
  });
  ctx.textAlign = align;
}

function resolvePalette(pal, th) {
  let out = null;
  for (const k in pal) {
    const v = pal[k];
    if (typeof v === 'string' && v[0] === '$') {
      out ||= { ...pal };
      out[k] = resolveRef(v, th);
    }
  }
  return out || pal;
}

/**
 * @returns {{layers: Array<{id, matrix: DOMMatrix, bbox}>}} isabet testi için bilgi
 */
export function renderFrame(ctx, scene, t, resIn, opts = {}) {
  const res = normalizeRes(resIn);
  const fmt = opts.format || null;
  const fm = formatMapping(scene, fmt);
  const W = scene.width;
  const H = scene.height;
  const OW = fm.W; // çıktı (format) boyutu
  const OH = fm.H;
  const theme = sceneTheme(scene, res);
  const tc = themeContext(theme);
  const th = theme;
  const info = { layers: [] };
  ctx.save();
  const base = ctx.getTransform();
  const bg = scene.background || theme?.background || {};
  drawBackground(ctx, bg, OW, OH, t, th);
  if (fmt) {
    ctx.translate(fm.tx, fm.ty);
    ctx.scale(fm.s, fm.s);
  }

  const cam = scene.camera || {};
  const zoom = prop(cam, 'zoom', t, 1);
  const cx = prop(cam, 'x', t, W / 2);
  const cy = prop(cam, 'y', t, H / 2);
  const rot = prop(cam, 'rotation', t, 0);
  // Derinlik (paralaks): layer.depth > 0 uzak (kamera hareketinden az etkilenir), < 0 yakın (daha çok).
  // f = 1 − derinlik: kameranın pan / zoom etkisi bu çarpanla uygulanır.
  const preCam = ctx.getTransform();
  const applyCamera = (f) => {
    ctx.setTransform(preCam);
    ctx.translate(W / 2, H / 2);
    const z = 1 + (zoom - 1) * f;
    ctx.scale(z, z);
    ctx.rotate(rot * DEG);
    ctx.translate(-(W / 2 + (cx - W / 2) * f), -(H / 2 + (cy - H / 2) * f));
  };
  applyCamera(1);
  const camBase = ctx.getTransform();
  const pxScale = Math.hypot(preCam.a, preCam.b) || 1;
  const focus = prop(cam, 'focus', t, 0);
  const dof = prop(cam, 'dof', t, 0); // derinlik birimi başına bulanıklık (sahne px)

  // Klasörler: gizli klasördeki katmanlar çizilmez, kilitli olanlar seçilemez
  const groups = new Map((scene.groups || []).map((g) => [g.id, g]));
  for (const layer of scene.layers || []) {
    const grp = layer.group ? groups.get(layer.group) : null;
    if ((layer.hidden || grp?.hidden) && !opts.showHidden) continue;
    // Solo (yalnızca stüdyo önizlemesi): opts.only verilmişse yalnız o katmanlar
    if (opts.only && !opts.only.has(layer.id)) continue;
    const locked = !!(layer.locked || grp?.locked);
    if (!isLayerActive(layer, t)) continue;
    const st = resolveLayerFull(layer, t, scene, res);
    const ov = fmt?.overrides?.[layer.id];
    if (ov) {
      if (ov.hidden) continue;
      st.x += ov.dx || 0;
      st.y += ov.dy || 0;
      st.scale *= ov.scale ?? 1;
    }
    if (st.opacity <= 0) continue;
    const depth = sample(layer.depth, t, 0);
    if (depth) applyCamera(1 - depth);
    else ctx.setTransform(camBase);
    const blur = Math.max(0, sample(layer.blur, t, 0) + (dof ? Math.abs(depth - focus) * dof : 0)) * pxScale;
    ctx.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : 'none';
    if (isWidget(layer)) {
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.rotation * DEG);
      ctx.scale(st.scale * st.scaleX, st.scale * st.scaleY);
      const wbb = WIDGET_DRAW[layer.type](ctx, layer, t, st, scene, res, th);
      info.layers.push({ id: layer.id, matrix: ctx.getTransform(), bbox: wbb, nohit: locked, group: layer.group });
      ctx.restore();
      continue;
    }
    if (layer.type === 'particles') {
      ctx.save();
      const bb = drawParticles(ctx, layer, t, st, scene, res, th, fmt ? { x: -fm.tx / fm.s, y: -fm.ty / fm.s, w: OW / fm.s, h: OH / fm.s } : null);
      if (bb) info.layers.push({ id: layer.id, matrix: ctx.getTransform(), bbox: bb, nohit: true, group: layer.group });
      ctx.restore();
      continue;
    }
    if (layer.type === 'arrow') {
      ctx.save();
      const byId = (id) => {
        const target = id !== layer.id && (scene.layers || []).find((l) => l.id === id);
        return target ? layerBox(target, t, scene, res, ctx, fmt) : null;
      };
      const bb = drawArrow(ctx, layer, t, st, scene, res, th, byId);
      if (bb) info.layers.push({ id: layer.id, matrix: ctx.getTransform(), bbox: bb, nohit: locked, nohandles: true, group: layer.group });
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.rotation * DEG);
    ctx.scale(st.scale * st.scaleX, st.scale * st.scaleY);

    let bbox;
    if (layer.type === 'text') {
      bbox = drawText(ctx, layer, t, st.opacity, res, th);
    } else {
      const asset = res.assets?.get(layer.asset);
      if (!asset) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#e11d48';
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 3;
        ctx.strokeRect(-50, -50, 100, 100);
        ctx.setLineDash([]);
        ctx.fillStyle = '#e11d48';
        ctx.font = '600 20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`? ${layer.asset}`, 0, 0);
        bbox = { x0: -50, y0: -50, x1: 50, y1: 50 };
      } else {
        const [w, h] = asset.size || [200, 200];
        const [ax, ay] = layer.anchor || [0.5, 0.5];
        ctx.translate(-ax * w, -ay * h);
        {
          if (layer.shadow) drawGroundShadow(ctx, w, h, layer.shadow, st.fold * st.opacity);
          const fs = layer.foldStyle || {};
          drawStyled(ctx, asset, layer.style || scene.style || 'origami', {
            fold: st.fold,
            order: st.foldOrder || fs.order,
            spread: fs.spread,
            seed: fs.seed,
            palette: resolvePalette(assetPalette(asset, layer.variant, layer.palette), th),
            parts: resolveParts(layer, t, st.partFx),
            alpha: st.opacity,
            crease: layer.crease,
            fx: tc.identity ? null : tc.fx,
            paper: tc.paper,
            // Çizim stili: kalem kalınlığı sahne pikseli cinsinden sabit kalsın
            sketch: layer.sketch ? { ...scene.sketch, ...layer.sketch } : scene.sketch,
            lineScale: 1 / Math.max(0.05, Math.abs(st.scale) * Math.sqrt(Math.abs(st.scaleX * st.scaleY))),
          });
        }
        bbox = { x0: 0, y0: 0, x1: w, y1: h };
      }
    }
    info.layers.push({ id: layer.id, matrix: ctx.getTransform(), bbox, nohit: locked, group: layer.group });
    ctx.restore();
  }

  ctx.filter = 'none';
  ctx.setTransform(base);
  if (!opts.noTransitions && scene.transitions?.length) {
    const outScene = fmt ? { ...scene, width: OW, height: OH } : scene;
    drawTransitions(ctx, base, outScene, t, th, (c2, tt) => renderFrame(c2, scene, tt, res, { noTransitions: true, noPost: true, format: fmt }));
    ctx.setTransform(base);
  }
  if (!opts.noPost) {
    drawPaperTexture(ctx, OW, OH, bg.paper ?? tc.paper.texture ?? 0.5);
    drawVignette(ctx, OW, OH, bg.vignette ?? theme?.vignette ?? 0.2);
  }
  ctx.restore();
  return info;
}

/** Sahnede kullanılan (font, ağırlık) çiftleri — dışa aktarım öncesi yükleme için */
export function usedFonts(scene, resIn) {
  const res = normalizeRes(resIn);
  const out = new Map();
  for (const l of scene.layers || []) {
    if (l.type === 'arrow' && l.label) {
      const it = l.arrow && res.assets?.get(l.arrow);
      const fam = l.labelFont || it?.labelFont || 'Caveat';
      out.set(`${fam}|700`, { family: fam, weight: 700 });
      continue;
    }
    if (l.type !== 'text') continue;
    const L = textProps(l, res);
    const fam = L.font || DEFAULT_FONT;
    if (fam.includes(',')) continue;
    out.set(`${fam}|${L.weight || 600}`, { family: fam, weight: L.weight || 600 });
  }
  return [...out.values()];
}
