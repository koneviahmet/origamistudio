// Bileşen katmanları: grafik (chart), cihaz çerçevesi (device), medya (media) ve ses dalgası (waveform).
// Hepsi saf çizim fonksiyonlarıdır: (ctx, layer, t, st, scene, res, th) → yerel koordinatta bbox.
// Katman merkezi (0,0) noktasıdır; dönüşüm renderer'da uygulanmıştır. st.fold = "görünme / çizilme ilerlemesi".
//
// Medya (resim / video): renderFrame senkron kalır. Kare kaynağı res.mediaFrames (Map) içinden okunur;
// bu Map'i web/src/media.js → prepareMedia(scene, t, res) önceden doldurur (önizlemede ve dışa aktarımda).
import { ease } from './easing.js';
import { resolveRef } from './theme.js';
import { spectrumAt } from './audiodrive.js';
import { WIDGET2_TYPES, WIDGET2_FIELDS, WIDGET2_DRAW } from './widgets2.js';
import { COMMON_FIELDS, styledContext } from './widgetStyle.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const DEFAULT_FONT = 'Baloo 2';
const fontCss = (family) => {
  const f = family || DEFAULT_FONT;
  return f.includes(',') ? f : `"${f}", system-ui, sans-serif`;
};
const PALETTE = ['$vurgu', '#4d9de0', '#7bc86c', '#f6c445', '#b388eb', '#ee6c4d', '#3bb3a8', '#e26d9b'];

export const WIDGET_TYPES = ['chart', 'device', 'media', 'waveform'];
export const isWidget = (l) => WIDGET_TYPES.includes(l.type);

function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const hashStr = (str) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const col = (c, th) => resolveRef(c, th);
function withAlpha(hex, a) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const h = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex.slice(0, 7);
  const n = Math.round(clamp01(a) * 255).toString(16).padStart(2, '0');
  return h + n;
}

// ════════════════════════════════════════════════════════════════════════════
//  Alan tanımları — stüdyo denetçisi (WidgetEditor.vue) bunlardan form üretir
// ════════════════════════════════════════════════════════════════════════════
const SEL = (arr) => arr.map((x) => (Array.isArray(x) ? x : [x, x]));
export const WIDGET_FIELDS = {
  chart: [
    { key: 'kind', label: 'Tür', type: 'select', options: SEL([['bar', 'Sütun'], ['yatay', 'Yatay çubuk'], ['line', 'Çizgi'], ['pie', 'Pasta'], ['donut', 'Halka'], ['sayac', 'Sayaç']]), def: 'bar' },
    { key: 'data', label: 'Veri', type: 'data', hint: 'Her satır: etiket: değer (ör. 2021: 45)' },
    { key: 'title', label: 'Başlık', type: 'text', def: '' },
    { key: 'width', label: 'Genişlik', type: 'number', def: 820, step: 10 },
    { key: 'height', label: 'Yükseklik', type: 'number', def: 560, step: 10 },
    { key: 'unit', label: 'Birim / sonek', type: 'text', def: '' },
    { key: 'prefix', label: 'Önek', type: 'text', def: '' },
    { key: 'decimals', label: 'Ondalık', type: 'number', def: 0, step: 1 },
    { key: 'max', label: 'En büyük değer', type: 'number', def: '', step: 1 },
    { key: 'stagger', label: 'Kademe (0–1)', type: 'number', def: 0.5, step: 0.05 },
    { key: 'textColor', label: 'Yazı rengi', type: 'color', def: '#2d2a3e' },
    { key: 'font', label: 'Font', type: 'text', def: DEFAULT_FONT },
    { key: 'card', label: 'Kart arka planı', type: 'bool', def: true },
  ],
  device: [
    { key: 'frame', label: 'Cihaz', type: 'select', options: SEL([['telefon', 'Telefon'], ['tablet', 'Tablet'], ['laptop', 'Dizüstü'], ['tarayici', 'Tarayıcı penceresi']]), def: 'telefon' },
    { key: 'width', label: 'Genişlik', type: 'number', def: 460, step: 10 },
    { key: 'color', label: 'Gövde rengi', type: 'color', def: '#1c1c28' },
    { key: 'src', label: 'Ekran içeriği (medya)', type: 'media', def: '' },
    { key: 'fit', label: 'Sığdırma', type: 'select', options: SEL([['kapla', 'Kapla'], ['sigdir', 'Sığdır']]), def: 'kapla' },
    { key: 'ui', label: 'Sahte arayüz', type: 'select', options: SEL([['liste', 'Liste'], ['panel', 'Panel'], ['sohbet', 'Sohbet']]), def: 'liste' },
    { key: 'title', label: 'Başlık / adres', type: 'text', def: '' },
    { key: 'lines', label: 'Satırlar', type: 'lines', hint: 'Sahte arayüzdeki metinler (her satır bir öğe)' },
    { key: 'screenColor', label: 'Ekran rengi', type: 'color', def: '#f7f4ff' },
    { key: 'accent', label: 'Vurgu rengi', type: 'color', def: '$vurgu' },
    { key: 'scroll', label: 'Kaydırma (px/sn)', type: 'number', def: 0, step: 5 },
  ],
  media: [
    { key: 'src', label: 'Dosya', type: 'media', def: '' },
    { key: 'width', label: 'Genişlik', type: 'number', def: '', step: 10 },
    { key: 'height', label: 'Yükseklik', type: 'number', def: '', step: 10 },
    { key: 'fit', label: 'Sığdırma', type: 'select', options: SEL([['kapla', 'Kapla'], ['sigdir', 'Sığdır']]), def: 'kapla' },
    { key: 'radius', label: 'Köşe yarıçapı', type: 'number', def: 24, step: 2 },
    { key: 'border', label: 'Çerçeve (px)', type: 'number', def: 0, step: 1 },
    { key: 'borderColor', label: 'Çerçeve rengi', type: 'color', def: '#ffffff' },
    { key: 'shadow', label: 'Gölge', type: 'bool', def: true },
    { key: 'trim', label: 'Video başlangıcı (sn)', type: 'number', def: 0, step: 0.1 },
    { key: 'rate', label: 'Video hızı', type: 'number', def: 1, step: 0.1 },
    { key: 'loop', label: 'Video döngü', type: 'bool', def: true },
  ],
  waveform: [
    { key: 'style', label: 'Görünüm', type: 'select', options: SEL([['cubuk', 'Çubuklar'], ['cizgi', 'Çizgi'], ['daire', 'Daire'], ['nokta', 'Noktalar']]), def: 'cubuk' },
    { key: 'bars', label: 'Çubuk sayısı', type: 'number', def: 32, step: 1 },
    { key: 'width', label: 'Genişlik', type: 'number', def: 800, step: 10 },
    { key: 'height', label: 'Yükseklik', type: 'number', def: 240, step: 10 },
    { key: 'color', label: 'Renk', type: 'color', def: '$vurgu' },
    { key: 'color2', label: 'İkinci renk (geçiş)', type: 'color', def: '' },
    { key: 'gain', label: 'Kazanç', type: 'number', def: 1, step: 0.1 },
    { key: 'gap', label: 'Boşluk (0–1)', type: 'number', def: 0.35, step: 0.05 },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
//  Ortak: kart, medya karesi
// ════════════════════════════════════════════════════════════════════════════
function drawCard(ctx, L, w, h, th, alpha) {
  if (L.card === false) return;
  const c = typeof L.card === 'object' ? L.card : {};
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.shadowColor = 'rgba(40,20,10,0.22)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = col(c.color || '#ffffff', th);
  rr(ctx, -w / 2, -h / 2, w, h, c.radius ?? 36);
  ctx.fill();
  ctx.restore();
}

export const mediaKey = (layer, suffix = '') => `${layer.id}${suffix}`;

/** Kare kaynağını kutuya (x, y, w, h) kapla / sığdır ve çiz. Kare yoksa yer tutucu. */
function paintMedia(ctx, fr, x, y, w, h, fit, label) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!fr?.source) {
    ctx.fillStyle = '#d9d4e6';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b9b2cf';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    if (label) {
      ctx.fillStyle = '#7a7394';
      ctx.font = `600 ${Math.max(14, Math.min(w, h) * 0.06)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2);
    }
    ctx.restore();
    return;
  }
  const iw = fr.w;
  const ih = fr.h;
  const s = fit === 'sigdir' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(fr.source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════════════
//  MEDYA
// ════════════════════════════════════════════════════════════════════════════
export function mediaSize(L, res) {
  const fr = res.mediaFrames?.get(mediaKey(L));
  const nat = fr ? [fr.w, fr.h] : [800, 500];
  let w = L.width;
  let h = L.height;
  if (w && !h) h = (w * nat[1]) / nat[0];
  else if (h && !w) w = (h * nat[0]) / nat[1];
  else if (!w && !h) {
    const k = Math.min(1, 900 / nat[0]);
    w = nat[0] * k;
    h = nat[1] * k;
  }
  return [w, h];
}

export function drawMedia(ctx, L, t, st, scene, res, th) {
  const [w, h] = mediaSize(L, res);
  const fr = res.mediaFrames?.get(mediaKey(L));
  const radius = L.radius ?? 24;
  const reveal = ease('outCubic', st.fold);
  ctx.save();
  ctx.globalAlpha = st.opacity;
  if (st.fold < 1) {
    // Belirme: yukarıdan aşağı silinerek açılır
    ctx.beginPath();
    ctx.rect(-w / 2 - 50, -h / 2 - 50, w + 100, (h + 100) * reveal);
    ctx.clip();
  }
  if (L.shadow !== false) {
    ctx.save();
    ctx.shadowColor = 'rgba(30,15,10,0.3)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#000';
    rr(ctx, -w / 2, -h / 2, w, h, radius);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  rr(ctx, -w / 2, -h / 2, w, h, radius);
  ctx.clip();
  paintMedia(ctx, fr, -w / 2, -h / 2, w, h, L.fit, L.src ? `? ${L.src}` : 'medya seç');
  ctx.restore();
  if (L.border) {
    ctx.strokeStyle = col(L.borderColor || '#ffffff', th);
    ctx.lineWidth = L.border;
    rr(ctx, -w / 2, -h / 2, w, h, radius);
    ctx.stroke();
  }
  ctx.restore();
  return { x0: -w / 2, y0: -h / 2, x1: w / 2, y1: h / 2 };
}

// ════════════════════════════════════════════════════════════════════════════
//  CİHAZ ÇERÇEVESİ
// ════════════════════════════════════════════════════════════════════════════
const DEVICES = {
  // en/boy oranı, çerçeve kalınlığı (genişliğin oranı), köşe yarıçapı (genişliğin oranı)
  telefon: { ratio: 2.05, bezel: 0.035, radius: 0.13 },
  tablet: { ratio: 0.72, bezel: 0.045, radius: 0.07 },
  laptop: { ratio: 0.64, bezel: 0.03, radius: 0.025 },
  tarayici: { ratio: 0.66, bezel: 0, radius: 0.02 },
};

export function deviceGeometry(L) {
  const d = DEVICES[L.frame] || DEVICES.telefon;
  const w = L.width || (L.frame === 'laptop' || L.frame === 'tarayici' ? 900 : L.frame === 'tablet' ? 640 : 460);
  const h = w * d.ratio;
  const bz = w * d.bezel;
  const top = L.frame === 'tarayici' ? w * 0.06 : bz;
  const sx = -w / 2 + bz;
  const sy = -h / 2 + top;
  const sw = w - bz * 2;
  const sh = h - top - bz;
  return { w, h, bz, top, screen: { x: sx, y: sy, w: sw, h: sh }, radius: w * d.radius, d };
}

function mockUi(ctx, L, g, t, th) {
  const { x, y, w, h } = g.screen;
  const accent = col(L.accent || '$vurgu', th);
  const lines = L.lines?.length ? L.lines : ['Yeni mesaj', 'Bugünkü görevler', 'Ödeme alındı', 'Hatırlatma', 'Takvim', 'Ayarlar', 'Profil'];
  const r = rng(hashStr(L.id || 'x'));
  const scroll = ((L.scroll || 0) * t) % (h * 1.2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = col(L.screenColor || '#f7f4ff', th);
  ctx.fillRect(x, y, w, h);
  const pad = w * 0.06;
  const top0 = y + h * 0.12 + (L.frame === 'telefon' ? h * 0.03 : 0);
  const rowH = h * 0.105;
  const fs = w * 0.048;
  for (let i = 0; i < 14; i++) {
    const ry = top0 + i * rowH - scroll;
    if (ry < y - rowH || ry > y + h) continue;
    const text = lines[i % lines.length];
    if (L.ui === 'sohbet') {
      const mine = i % 2 === 0;
      const bw = w * (0.45 + r() * 0.25);
      ctx.fillStyle = mine ? accent : '#ffffff';
      rr(ctx, mine ? x + w - pad - bw : x + pad, ry, bw, rowH * 0.8, rowH * 0.3);
      ctx.fill();
      ctx.fillStyle = mine ? '#fff' : '#3a3550';
      ctx.font = `600 ${fs}px ${fontCss(L.font)}`;
      ctx.textAlign = 'left';
      ctx.fillText(text, (mine ? x + w - pad - bw : x + pad) + bw * 0.08, ry + rowH * 0.4, bw * 0.84);
    } else if (L.ui === 'panel') {
      const cw = (w - pad * 3) / 2;
      const cx = x + pad + (i % 2) * (cw + pad);
      const cy = top0 + Math.floor(i / 2) * (rowH * 1.5) - scroll;
      if (i % 2 === 1 || cy < y - rowH * 2 || cy > y + h) continue;
      for (let k = 0; k < 2; k++) {
        const xx = cx + k * (cw + pad);
        ctx.fillStyle = '#ffffff';
        rr(ctx, xx, cy, cw, rowH * 1.3, 12);
        ctx.fill();
        ctx.fillStyle = k ? '#3a3550' : accent;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(xx + cw * 0.1, cy + rowH * 0.85, cw * (0.3 + r() * 0.5), rowH * 0.18);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#3a3550';
        ctx.font = `700 ${fs * 0.9}px ${fontCss(L.font)}`;
        ctx.textAlign = 'left';
        ctx.fillText(lines[(i + k) % lines.length], xx + cw * 0.1, cy + rowH * 0.45, cw * 0.8);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      rr(ctx, x + pad, ry, w - pad * 2, rowH * 0.86, 12);
      ctx.fill();
      ctx.fillStyle = withAlpha(accent, 0.85);
      ctx.beginPath();
      ctx.arc(x + pad * 2.2, ry + rowH * 0.43, rowH * 0.26, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#3a3550';
      ctx.font = `700 ${fs}px ${fontCss(L.font)}`;
      ctx.textAlign = 'left';
      ctx.fillText(text, x + pad * 3.6 + rowH * 0.26, ry + rowH * 0.34, w * 0.62);
      ctx.fillStyle = '#b6b0c9';
      ctx.fillRect(x + pad * 3.6 + rowH * 0.26, ry + rowH * 0.56, w * (0.25 + r() * 0.3), rowH * 0.1);
    }
  }
  // Üst çubuk (kayan satırların üstünde kalır)
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, h * 0.09 + (L.frame === 'telefon' ? h * 0.03 : 0));
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${w * 0.055}px ${fontCss(L.font)}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(L.title || 'Uygulama', x + pad, y + h * 0.055 + (L.frame === 'telefon' ? h * 0.03 : 0));
  ctx.restore();
}

export function drawDevice(ctx, L, t, st, scene, res, th) {
  const g = deviceGeometry(L);
  const { w, h, bz, screen: sc } = g;
  const body = col(L.color || '#1c1c28', th);
  const reveal = ease('outBack', clamp01(st.fold));
  ctx.save();
  ctx.globalAlpha = st.opacity;
  if (st.fold < 1) ctx.scale(0.85 + 0.15 * reveal, 0.85 + 0.15 * reveal);
  ctx.globalAlpha *= clamp01(st.fold * 2.2);

  // Laptop tabanı
  if (L.frame === 'laptop') {
    ctx.fillStyle = body;
    rr(ctx, -w * 0.56, h / 2 - 2, w * 1.12, h * 0.045, h * 0.02);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, -w * 0.09, h / 2, w * 0.18, h * 0.014, 4);
    ctx.fill();
  }
  // Gövde
  ctx.save();
  ctx.shadowColor = 'rgba(25,12,8,0.35)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = L.frame === 'tarayici' ? '#e9e5f3' : body;
  rr(ctx, -w / 2, -h / 2, w, h, g.radius);
  ctx.fill();
  ctx.restore();

  if (L.frame === 'tarayici') {
    const ty = -h / 2;
    const bh = g.top;
    ctx.fillStyle = '#dcd6ea';
    ctx.save();
    rr(ctx, -w / 2, ty, w, h, g.radius);
    ctx.clip();
    ctx.fillRect(-w / 2, ty, w, bh);
    ctx.restore();
    [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([c, i]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(-w / 2 + bh * (0.55 + i * 0.5), ty + bh / 2, bh * 0.16, 0, TAU);
      ctx.fill();
    });
    ctx.fillStyle = '#f7f5fc';
    rr(ctx, -w / 2 + bh * 2.3, ty + bh * 0.22, w - bh * 3.2, bh * 0.56, bh * 0.28);
    ctx.fill();
    ctx.fillStyle = '#7a7394';
    ctx.font = `600 ${bh * 0.3}px system-ui`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(L.url || 'https://ornek.com', -w / 2 + bh * 2.6, ty + bh / 2);
  }

  // Ekran
  ctx.save();
  const sr = L.frame === 'telefon' ? g.radius - bz : Math.max(2, g.radius * 0.5);
  rr(ctx, sc.x, sc.y, sc.w, sc.h, sr);
  ctx.clip();
  const fr = res.mediaFrames?.get(mediaKey(L, '#screen'));
  if (L.src) {
    paintMedia(ctx, fr, sc.x, sc.y, sc.w, sc.h, L.fit, `? ${L.src}`);
  } else {
    mockUi(ctx, L, g, t, th);
  }
  ctx.restore();

  // Telefon: ada (dynamic island) + kenar parlaması
  if (L.frame === 'telefon') {
    ctx.fillStyle = body;
    rr(ctx, -w * 0.15, -h / 2 + bz * 1.5, w * 0.3, bz * 1.2, bz * 0.6);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  rr(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, g.radius);
  ctx.stroke();
  ctx.restore();
  return { x0: -w / 2, y0: -h / 2, x1: w / 2, y1: h / 2 + (L.frame === 'laptop' ? h * 0.05 : 0) };
}

// ════════════════════════════════════════════════════════════════════════════
//  GRAFİK
// ════════════════════════════════════════════════════════════════════════════
function fmtNum(v, L) {
  const d = L.decimals ?? 0;
  const s = v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${L.prefix || ''}${s}${L.unit || ''}`;
}

export function chartData(L) {
  const raw = L.data || [];
  return raw.map((d, i) => (typeof d === 'number' ? { label: String(i + 1), value: d } : { label: d.label ?? '', value: Number(d.value) || 0, color: d.color }));
}

export function drawChart(ctx, L, t, st, scene, res, th) {
  const W = L.width || 820;
  const H = L.height || 560;
  const kind = L.kind || 'bar';
  const data = chartData(L);
  const n = data.length;
  const tc = col(L.textColor || '#2d2a3e', th);
  const font = fontCss(L.font);
  const p = clamp01(st.fold);
  const stagger = L.stagger ?? 0.5;
  const colors = (L.colors?.length ? L.colors : PALETTE).map((c) => col(c, th));
  const color = (i) => col(data[i]?.color, th) || colors[i % colors.length];
  const itemP = (i) => {
    if (n <= 1 || stagger <= 0) return p;
    const d = stagger / n;
    return clamp01((p - i * d) / Math.max(0.05, 1 - (n - 1) * d));
  };
  const max = L.max || Math.max(1e-9, ...data.map((d) => d.value)) * (kind === 'line' ? 1.15 : 1.12);

  ctx.save();
  ctx.globalAlpha = st.opacity;
  drawCard(ctx, L, W, H, th, clamp01(p * 4));
  ctx.translate(-W / 2, -H / 2);
  const pad = Math.min(W, H) * 0.07;
  let top = pad;
  ctx.textBaseline = 'middle';
  if (L.title) {
    ctx.fillStyle = tc;
    ctx.globalAlpha = st.opacity * clamp01(p * 5);
    ctx.font = `800 ${Math.min(W, H) * 0.065}px ${font}`;
    ctx.textAlign = 'left';
    ctx.fillText(L.title, pad, pad + Math.min(W, H) * 0.03);
    top = pad + Math.min(W, H) * 0.11;
    ctx.globalAlpha = st.opacity;
  }
  const labelSize = L.labelSize || Math.max(16, Math.min(W / Math.max(4, n) * 0.3, H * 0.05));
  const valueSize = L.valueSize || labelSize * 1.1;

  if (kind === 'sayac') {
    const v = (data[0]?.value ?? L.value ?? 0) * ease('outCubic', p);
    const cx = W / 2;
    const cy = top + (H - top - pad) * 0.46;
    const R = Math.min(W - pad * 2, H - top - pad * 2) * 0.46;
    if (L.ring !== false) {
      ctx.lineWidth = R * 0.14;
      ctx.lineCap = 'round';
      ctx.strokeStyle = withAlpha(tc, 0.1);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = color(0);
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * clamp01(v / max) * (L.max ? 1 : 0.85));
      ctx.stroke();
    }
    ctx.fillStyle = tc;
    ctx.textAlign = 'center';
    ctx.font = `800 ${R * 0.62}px ${font}`;
    ctx.fillText(fmtNum(v, L), cx, cy);
    if (data[0]?.label) {
      ctx.font = `600 ${R * 0.17}px ${font}`;
      ctx.globalAlpha = st.opacity * 0.7;
      ctx.fillText(data[0].label, cx, cy + R * 0.5);
    }
  } else if (kind === 'pie' || kind === 'donut') {
    const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
    const legendRows = n;
    const wide = W > H * 1.1;
    const R = wide ? Math.min(H - top - pad, W * 0.5) * 0.5 : Math.min(W - pad * 2, (H - top - pad) * 0.66) * 0.5;
    const cx = wide ? pad + R + 10 : W / 2;
    const cy = wide ? top + (H - top - pad) / 2 : top + R + 6;
    let a = -Math.PI / 2;
    const sweepAll = ease('outCubic', p) * TAU;
    let acc = 0;
    data.forEach((d, i) => {
      const frac = Math.max(0, d.value) / total;
      const a0 = a;
      const span = frac * TAU;
      const visible = Math.max(0, Math.min(span, sweepAll - acc));
      acc += span;
      a += span;
      if (visible <= 0) return;
      if (kind === 'donut') {
        // Halka: delik açmak yerine kalın yay çizilir (arka plana dokunmaz)
        ctx.strokeStyle = color(i);
        ctx.lineWidth = R * 0.42;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.79, a0, a0 + visible);
        ctx.stroke();
      } else {
        ctx.fillStyle = color(i);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a0 + visible);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      if (visible >= span - 1e-4 && frac > 0.06 && kind === 'pie') {
        const am = a0 + span / 2;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = `800 ${valueSize}px ${font}`;
        ctx.fillText(`%${Math.round(frac * 100)}`, cx + Math.cos(am) * R * 0.62, cy + Math.sin(am) * R * 0.62);
      }
    });
    if (kind === 'donut') {
      ctx.fillStyle = tc;
      ctx.textAlign = 'center';
      ctx.font = `800 ${R * 0.3}px ${font}`;
      ctx.globalAlpha = st.opacity * clamp01(p * 2 - 0.6);
      ctx.fillText(L.center ?? fmtNum(total * ease('outCubic', p), L), cx, cy);
    }
    // Gösterge
    ctx.globalAlpha = st.opacity * clamp01(p * 3 - 0.8);
    const lx = wide ? cx + R + pad : pad;
    const ly0 = wide ? top + 10 : cy + R + pad * 0.7;
    const rowH = Math.min(labelSize * 1.9, wide ? (H - top - pad) / legendRows : (H - ly0 - pad * 0.4) / Math.ceil(legendRows / 2));
    data.forEach((d, i) => {
      const colN = wide ? 0 : i % 2;
      const row = wide ? i : Math.floor(i / 2);
      const x = lx + colN * ((W - pad * 2) / 2);
      const y = ly0 + row * rowH + rowH / 2;
      ctx.fillStyle = color(i);
      rr(ctx, x, y - labelSize * 0.4, labelSize * 0.8, labelSize * 0.8, 6);
      ctx.fill();
      ctx.fillStyle = tc;
      ctx.textAlign = 'left';
      ctx.font = `700 ${labelSize}px ${font}`;
      ctx.fillText(`${d.label}  ${fmtNum(d.value, L)}`, x + labelSize * 1.2, y, (wide ? W - lx - pad : (W - pad * 2) / 2) - labelSize * 1.3);
    });
  } else if (kind === 'yatay') {
    const areaTop = top;
    const areaH = H - areaTop - pad;
    const slot = areaH / Math.max(1, n);
    ctx.font = `700 ${labelSize}px ${font}`;
    const lw = Math.min(W * 0.3, Math.max(...data.map((d) => ctx.measureText(d.label).width), 10) + 16);
    const x0 = pad + lw;
    const plotW = W - x0 - pad - valueSize * 3.2;
    data.forEach((d, i) => {
      const u = ease('outCubic', itemP(i));
      const y = areaTop + i * slot + slot / 2;
      const bh = Math.min(slot * 0.62, 70);
      ctx.fillStyle = tc;
      ctx.textAlign = 'right';
      ctx.font = `700 ${labelSize}px ${font}`;
      ctx.globalAlpha = st.opacity * clamp01(itemP(i) * 3);
      ctx.fillText(d.label, x0 - 14, y, lw);
      ctx.fillStyle = color(i);
      const bw = Math.max(0, (d.value / max) * plotW * u);
      rr(ctx, x0, y - bh / 2, bw, bh, bh * 0.28);
      ctx.fill();
      ctx.fillStyle = tc;
      ctx.textAlign = 'left';
      ctx.font = `800 ${valueSize}px ${font}`;
      ctx.fillText(fmtNum(d.value * u, L), x0 + bw + 12, y);
    });
  } else {
    // sütun / çizgi: ortak eksen
    const axisBottom = H - pad - labelSize * 1.6;
    const plotTop = top + valueSize * 1.3;
    const plotH = axisBottom - plotTop;
    const x0 = pad;
    const plotW = W - pad * 2;
    ctx.globalAlpha = st.opacity * clamp01(p * 4);
    ctx.strokeStyle = withAlpha(tc, 0.12);
    ctx.lineWidth = 2;
    for (let g = 0; g <= 4; g++) {
      const y = axisBottom - (plotH * g) / 4;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + plotW, y);
      ctx.stroke();
    }
    ctx.globalAlpha = st.opacity;
    const slot = plotW / Math.max(1, n);
    const xAt = (i) => (kind === 'line' ? x0 + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW * 0.92 + plotW * 0.04) : x0 + slot * (i + 0.5));
    const yAt = (v) => axisBottom - (v / max) * plotH;
    ctx.fillStyle = tc;
    ctx.textAlign = 'center';
    ctx.font = `700 ${labelSize}px ${font}`;
    data.forEach((d, i) => {
      ctx.globalAlpha = st.opacity * clamp01(p * 4);
      ctx.fillText(d.label, xAt(i), axisBottom + labelSize * 1.1, slot * 1.05);
    });
    ctx.globalAlpha = st.opacity;
    if (kind === 'line') {
      const c0 = color(0);
      const prog = ease('inOutSine', p) * (n - 1);
      const pts = [];
      for (let i = 0; i < n; i++) {
        if (i <= prog) pts.push([xAt(i), yAt(data[i].value)]);
        else if (i - 1 < prog) {
          const k = prog - (i - 1);
          pts.push([xAt(i - 1) + (xAt(i) - xAt(i - 1)) * k, yAt(data[i - 1].value) + (yAt(data[i].value) - yAt(data[i - 1].value)) * k]);
        }
      }
      if (pts.length > 1) {
        const grad = ctx.createLinearGradient(0, plotTop, 0, axisBottom);
        grad.addColorStop(0, withAlpha(c0, 0.35));
        grad.addColorStop(1, withAlpha(c0, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], axisBottom);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(pts[pts.length - 1][0], axisBottom);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = c0;
        ctx.lineWidth = Math.max(5, Math.min(W, H) * 0.012);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      data.forEach((d, i) => {
        const u = clamp01(prog - i + 1);
        if (u <= 0) return;
        const x = xAt(i);
        const y = yAt(d.value);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = c0;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, (labelSize * 0.38) * ease('outBack', u), 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = tc;
        ctx.font = `800 ${valueSize}px ${font}`;
        ctx.globalAlpha = st.opacity * u;
        ctx.fillText(fmtNum(d.value, L), x, y - labelSize * 1.1);
        ctx.globalAlpha = st.opacity;
      });
    } else {
      const bw = Math.min(slot * 0.62, 140);
      data.forEach((d, i) => {
        const u = ease('outBack', itemP(i));
        const h = Math.max(0, (d.value / max) * plotH * u);
        const x = xAt(i) - bw / 2;
        ctx.fillStyle = color(i);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 4, axisBottom - h - 4, bw + 8, h + 4);
        ctx.clip();
        rr(ctx, x, axisBottom - h, bw, h + bw * 0.4, bw * 0.28);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = tc;
        ctx.textAlign = 'center';
        ctx.font = `800 ${valueSize}px ${font}`;
        ctx.globalAlpha = st.opacity * clamp01(itemP(i) * 2 - 0.6);
        ctx.fillText(fmtNum(d.value * clamp01(u), L), xAt(i), axisBottom - h - valueSize * 0.85);
        ctx.globalAlpha = st.opacity;
      });
    }
  }
  ctx.restore();
  return { x0: -W / 2, y0: -H / 2, x1: W / 2, y1: H / 2 };
}

// ════════════════════════════════════════════════════════════════════════════
//  SES DALGASI / EKOLAYZER
// ════════════════════════════════════════════════════════════════════════════
export function drawWaveform(ctx, L, t, st, scene, res, th) {
  const W = L.width || 800;
  const H = L.height || 240;
  const n = Math.max(3, Math.min(200, L.bars || 32));
  const gain = L.gain ?? 1;
  const style = L.style || 'cubuk';
  const vals = spectrumAt(scene, t, n).map((v) => clamp01(v * gain) * clamp01(st.fold));
  const c1 = col(L.color || '$vurgu', th);
  const c2 = L.color2 ? col(L.color2, th) : null;
  ctx.save();
  ctx.globalAlpha = st.opacity;
  let fill = c1;
  if (c2 && style !== 'daire') {
    fill = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
    fill.addColorStop(0, c1);
    fill.addColorStop(1, c2);
  } else if (c2) {
    fill = ctx.createLinearGradient(-H / 2, -H / 2, H / 2, H / 2);
    fill.addColorStop(0, c1);
    fill.addColorStop(1, c2);
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  if (style === 'daire') {
    const R = Math.min(W, H) * 0.3;
    const len = Math.min(W, H) * 0.2;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(3, (TAU * R) / n * (1 - (L.gap ?? 0.35)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - Math.PI / 2;
      const v = vals[Math.abs(i < n / 2 ? i : n - 1 - i) % n];
      const r0 = R;
      const r1 = R + 6 + len * v * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
  } else if (style === 'cizgi') {
    ctx.lineWidth = Math.max(4, H * 0.03);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const sgn of [1, -1]) {
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = -W / 2 + (i / (n - 1)) * W;
        const y = sgn * (H / 2) * v;
        if (!i) ctx.moveTo(x, y);
        else {
          const px = -W / 2 + ((i - 1) / (n - 1)) * W;
          const py = sgn * (H / 2) * vals[i - 1];
          ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        }
      });
      ctx.stroke();
    }
  } else {
    const slot = W / n;
    const bw = slot * (1 - (L.gap ?? 0.35));
    for (let i = 0; i < n; i++) {
      const v = vals[i];
      const x = -W / 2 + slot * i + (slot - bw) / 2;
      if (style === 'nokta') {
        const cnt = Math.max(1, Math.round(v * (H / (bw * 1.3))));
        for (let k = 0; k < cnt; k++) {
          ctx.beginPath();
          ctx.arc(x + bw / 2, H / 2 - bw * 0.65 - k * bw * 1.3, bw * 0.45, 0, TAU);
          ctx.fill();
        }
      } else {
        const h = Math.max(bw, H * v);
        rr(ctx, x, -h / 2, bw, h, bw / 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  return { x0: -W / 2, y0: -H / 2, x1: W / 2, y1: H / 2 };
}

export const WIDGET_DRAW = { chart: drawChart, device: drawDevice, media: drawMedia, waveform: drawWaveform, ...WIDGET2_DRAW };
// İkinci aile (widgets2.js): kart, liste, kod, zaman
WIDGET_TYPES.push(...WIDGET2_TYPES);
Object.assign(WIDGET_FIELDS, WIDGET2_FIELDS);
// Evrensel alanlar (yazı ölçeği, kalınlık) her türe eklenir
for (const t of WIDGET_TYPES) WIDGET_FIELDS[t] = [...WIDGET_FIELDS[t], ...COMMON_FIELDS];

/** Renderer'ın tek çizim girişi: evrensel stil (textScale, weight) sonra türe özgü çizim */
export function drawWidget(ctx, layer, t, st, scene, res, th) {
  const draw = WIDGET_DRAW[layer.type];
  return draw(styledContext(ctx, layer), layer, t, st, scene, res, th);
}
