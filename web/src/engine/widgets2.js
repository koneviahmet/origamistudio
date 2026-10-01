// Bileşen katmanları, ikinci aile: kart (alıntı, istatistik, fiyat, profil, bildirim, rozet, puan, alt üçlü, takvim, balon),
// liste (kontrol, adımlar, ilerleme, tablo), kod (terminal / editör penceresi), zaman (geri sayım: dijital, halka, saat).
// widgets.js ile aynı sözleşme: (ctx, layer, t, st, scene, res, th) → yerel bbox. Merkez (0,0); st.fold = görünme ilerlemesi.
// Saf ve deterministiktir; rastgelelik yalnızca katman id'sinden tohumlanır.
import { easings } from './easing.js';
import { resolveRef } from './theme.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const TAU = Math.PI * 2;
const DEFAULT_FONT = 'Baloo 2';
const MONO = '"Cascadia Mono", Consolas, "Courier New", monospace';
const fontCss = (f) => {
  const x = f || DEFAULT_FONT;
  return x.includes(',') ? x : `"${x}", system-ui, sans-serif`;
};
const col = (c, th) => resolveRef(c, th);
const outCubic = easings.outCubic;
const outBack = easings.outBack;
const sub = (p, a, b) => clamp01((p - a) / (b - a)); // p'nin [a,b] aralığındaki ilerlemesi

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
function wrap(ctx, text, maxW) {
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
const split = (s) => String(s ?? '').split('|').map((x) => x.trim());
const initials = (s) => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr');
const fmt = (v, d = 0) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Kart yüzeyi: dolgu, gölge, isteğe bağlı çerçeve. Giriş: hafif büyüyerek belirir. */
function surface(ctx, L, W, H, th, p, { fill, radius = 36, shadow = true } = {}) {
  const f = L.bg ? col(L.bg, th) : fill || '#ffffff';
  ctx.save();
  if (L.shadow !== false && shadow) {
    ctx.shadowColor = 'rgba(40,20,10,0.24)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
  }
  ctx.fillStyle = f;
  rr(ctx, -W / 2, -H / 2, W, H, L.radius ?? radius);
  ctx.fill();
  ctx.restore();
  if (L.border) {
    ctx.save();
    ctx.strokeStyle = col(L.borderColor || '#00000022', th);
    ctx.lineWidth = L.border;
    rr(ctx, -W / 2, -H / 2, W, H, L.radius ?? radius);
    ctx.stroke();
    ctx.restore();
  }
}
const pop = (ctx, p, from = 0.88) => {
  ctx.globalAlpha *= clamp01(p * 2.5);
  const s = from + (1 - from) * outBack(clamp01(p));
  ctx.scale(s, s);
};

// ════════════════════════════════════════════════════════════════════════════
//  Alan tanımları ve varsayılanlar (stüdyo denetçisi bunlardan form üretir)
// ════════════════════════════════════════════════════════════════════════════
const SEL = (arr) => arr.map((x) => (Array.isArray(x) ? x : [x, x]));
const K = (...kinds) => kinds; // alanın hangi türlerde gösterileceği

export const WIDGET2_TYPES = ['kart', 'liste', 'kod', 'zaman', 'balon'];

export const WIDGET2_DEFAULTS = {
  kart: { kind: 'alinti', text: 'Küçük adımlar, büyük yolculukların başlangıcıdır.', sub: 'Atasözü', width: 820, height: 460 },
  liste: { kind: 'kontrol', title: 'Yapılacaklar', lines: ['Planı hazırla', 'Taslağı çiz', 'Videoyu kaydet', 'Paylaş'], width: 700 },
  kod: { kind: 'terminal', tema: 'koyu', title: 'terminal', lines: ['$ npm run dev', 'Sunucu hazır → http://localhost:5180', '$ npm run render -- proje'], width: 900, height: 520 },
  zaman: { kind: 'dijital', from: 60, to: 0, label: 'Kalan süre', width: 760 },
  balon: { kind: 'dusunce', text: 'Acaba bu nasıl çalışıyor?', width: 620, height: 420 },
};

const BALON_KINDS = SEL([['dusunce', 'Düşünce balonu'], ['bagirma', 'Bağırma / patlama'], ['fisilti', 'Fısıltı'], ['anlatici', 'Anlatıcı kutusu'], ['yaziyor', 'Yazıyor… göstergesi'], ['sesmesaji', 'Sesli mesaj'], ['ipucu', 'İpucu / tooltip'], ['notkagidi', 'Not kâğıdı'], ['etiket', 'İşaret etiketi'], ['tepki', 'Tepki çubuğu'], ['soru', 'Soru / fikir balonu'], ['yorum', 'Yorum kartı']]);
export const WIDGET2_FIELDS = {
  balon: [
    { key: 'kind', label: 'Tür', type: 'select', options: BALON_KINDS, def: 'dusunce' },
    { key: 'text', label: 'Metin', type: 'area', def: '', kinds: K('dusunce', 'bagirma', 'fisilti', 'anlatici', 'ipucu', 'notkagidi', 'yorum', 'sesmesaji') },
    { key: 'title', label: 'Başlık / ad', type: 'text', def: '', kinds: K('notkagidi', 'etiket', 'yorum') },
    { key: 'sub', label: 'Alt metin', type: 'text', def: '', kinds: K('etiket', 'yorum') },
    { key: 'icon', label: 'Simge (soru: ? ! 💡)', type: 'text', def: '', kinds: K('soru') },
    { key: 'value', label: 'Değer (beğeni)', type: 'text', def: '', kinds: K('yorum') },
    { key: 'lines', label: 'Tepkiler', type: 'lines', hint: 'emoji|sayı (ör. 👍|24)', kinds: K('tepki') },
    { key: 'side', label: 'Yön', type: 'select', options: SEL([['sol', 'Sol'], ['sag', 'Sağ'], ['ust', 'Üst'], ['alt', 'Alt']]), def: 'sol', kinds: K('dusunce', 'ipucu', 'etiket', 'soru', 'yaziyor') },
    { key: 'width', label: 'Genişlik', type: 'number', def: '', step: 10 },
    { key: 'height', label: 'Yükseklik', type: 'number', def: '', step: 10 },
    { key: 'accent', label: 'Vurgu rengi', type: 'color', def: '$vurgu' },
    { key: 'bg', label: 'Zemin rengi', type: 'color', def: '' },
    { key: 'textColor', label: 'Yazı rengi', type: 'color', def: '#2d2a3e' },
    { key: 'font', label: 'Font', type: 'text', def: DEFAULT_FONT },
    { key: 'shadow', label: 'Gölge', type: 'bool', def: true },
  ],
  kart: [
    { key: 'kind', label: 'Tür', type: 'select', options: SEL([['alinti', 'Alıntı'], ['istatistik', 'İstatistik'], ['fiyat', 'Fiyat kartı'], ['profil', 'Profil'], ['bildirim', 'Bildirim'], ['rozet', 'Rozet / damga'], ['puan', 'Yıldız puanı'], ['altuc', 'Alt üçlü (isim bandı)'], ['takvim', 'Takvim yaprağı'], ['balon', 'Konuşma balonu']]), def: 'alinti' },
    { key: 'title', label: 'Başlık / ad', type: 'text', def: '', kinds: K('istatistik', 'fiyat', 'profil', 'bildirim', 'rozet', 'puan', 'altuc', 'takvim') },
    { key: 'text', label: 'Metin', type: 'area', def: '', kinds: K('alinti', 'bildirim', 'balon', 'puan', 'fiyat') },
    { key: 'sub', label: 'Alt metin', type: 'text', def: '', kinds: K('alinti', 'istatistik', 'fiyat', 'profil', 'rozet', 'puan', 'altuc', 'takvim') },
    { key: 'value', label: 'Değer', type: 'text', def: '', kinds: K('istatistik', 'fiyat', 'puan', 'takvim') },
    { key: 'icon', label: 'Simge (emoji / harf)', type: 'text', def: '', kinds: K('bildirim', 'rozet') },
    { key: 'lines', label: 'Satırlar', type: 'lines', hint: 'Fiyat: özellikler · Profil: değer|etiket', kinds: K('fiyat', 'profil') },
    { key: 'side', label: 'Balon yönü', type: 'select', options: SEL([['sol', 'Sol'], ['sag', 'Sağ']]), def: 'sol', kinds: K('balon') },
    { key: 'width', label: 'Genişlik', type: 'number', def: '', step: 10 },
    { key: 'height', label: 'Yükseklik', type: 'number', def: '', step: 10 },
    { key: 'accent', label: 'Vurgu rengi', type: 'color', def: '$vurgu' },
    { key: 'bg', label: 'Zemin rengi', type: 'color', def: '' },
    { key: 'textColor', label: 'Yazı rengi', type: 'color', def: '#2d2a3e' },
    { key: 'font', label: 'Font', type: 'text', def: DEFAULT_FONT },
    { key: 'shadow', label: 'Gölge', type: 'bool', def: true },
  ],
  liste: [
    { key: 'kind', label: 'Tür', type: 'select', options: SEL([['kontrol', 'Kontrol listesi'], ['adimlar', 'Adımlar (zaman çizgisi)'], ['ilerleme', 'İlerleme çubukları'], ['tablo', 'Tablo']]), def: 'kontrol' },
    { key: 'title', label: 'Başlık', type: 'text', def: '' },
    { key: 'lines', label: 'Satırlar', type: 'lines', hint: 'Adımlar: başlık|açıklama · Tablo: ilk satır başlık, hücreler | ile', kinds: K('kontrol', 'adimlar', 'tablo') },
    { key: 'data', label: 'Veri', type: 'data', hint: 'etiket: yüzde (ör. Tasarım: 80)', kinds: K('ilerleme') },
    { key: 'width', label: 'Genişlik', type: 'number', def: 700, step: 10 },
    { key: 'accent', label: 'Vurgu rengi', type: 'color', def: '$vurgu' },
    { key: 'bg', label: 'Zemin rengi', type: 'color', def: '' },
    { key: 'textColor', label: 'Yazı rengi', type: 'color', def: '#2d2a3e' },
    { key: 'font', label: 'Font', type: 'text', def: DEFAULT_FONT },
    { key: 'card', label: 'Kart zemini', type: 'bool', def: true },
  ],
  kod: [
    { key: 'kind', label: 'Tür', type: 'select', options: SEL([['terminal', 'Terminal'], ['editor', 'Kod editörü']]), def: 'terminal' },
    { key: 'tema', label: 'Renk teması', type: 'select', options: SEL([['koyu', 'Koyu'], ['acik', 'Açık']]), def: 'koyu' },
    { key: 'title', label: 'Pencere başlığı', type: 'text', def: '' },
    { key: 'lines', label: 'Satırlar', type: 'lines', hint: 'Terminalde $ ile başlayan satır komuttur. Yazılma = çizilme ilerlemesi.' },
    { key: 'width', label: 'Genişlik', type: 'number', def: 900, step: 10 },
    { key: 'height', label: 'Yükseklik', type: 'number', def: 520, step: 10 },
    { key: 'accent', label: 'Vurgu rengi', type: 'color', def: '#7bc86c' },
    { key: 'numbers', label: 'Satır numaraları', type: 'bool', def: true },
  ],
  zaman: [
    { key: 'kind', label: 'Tür', type: 'select', options: SEL([['dijital', 'Dijital'], ['halka', 'Halka'], ['saat', 'Analog saat']]), def: 'dijital' },
    { key: 'from', label: 'Başlangıç (sn)', type: 'number', def: 60, step: 1 },
    { key: 'to', label: 'Bitiş (sn)', type: 'number', def: 0, step: 1 },
    { key: 'label', label: 'Etiket', type: 'text', def: '' },
    { key: 'width', label: 'Genişlik', type: 'number', def: 760, step: 10 },
    { key: 'accent', label: 'Vurgu rengi', type: 'color', def: '$vurgu' },
    { key: 'bg', label: 'Zemin rengi', type: 'color', def: '' },
    { key: 'textColor', label: 'Yazı rengi', type: 'color', def: '#2d2a3e' },
    { key: 'font', label: 'Font', type: 'text', def: DEFAULT_FONT },
    { key: 'card', label: 'Kart zemini', type: 'bool', def: true },
  ],
};

// ------------------------------------------------------------------ boyutlar
const KART_SIZE = { alinti: [820, 460], istatistik: [560, 360], fiyat: [520, 700], profil: [560, 420], bildirim: [760, 170], rozet: [360, 360], puan: [640, 300], altuc: [900, 170], takvim: [420, 460], balon: [640, 220] };
const BALON_SIZE = { dusunce: [620, 420], bagirma: [640, 480], fisilti: [560, 200], anlatici: [700, 150], yaziyor: [260, 110], sesmesaji: [560, 130], ipucu: [520, 150], notkagidi: [460, 460], etiket: [560, 260], tepki: [620, 130], soru: [320, 320], yorum: [680, 240] };
const nLines = (L) => (L.lines || []).length || 3;
export function widget2Size(L) {
  const kind = L.kind || WIDGET2_FIELDS[L.type]?.[0]?.def;
  let [w, h] = [800, 400];
  if (L.type === 'kart') [w, h] = KART_SIZE[kind] || KART_SIZE.alinti;
  else if (L.type === 'liste') {
    w = 700;
    const n = kind === 'ilerleme' ? (L.data || []).length || 3 : nLines(L);
    h = kind === 'adimlar' ? 150 + n * 130 : kind === 'ilerleme' ? 150 + n * 100 : kind === 'tablo' ? 130 + n * 80 : 150 + n * 86;
  } else if (L.type === 'kod') [w, h] = [900, 520];
  else if (L.type === 'zaman') [w, h] = kind === 'dijital' ? [760, 260] : [460, 460];
  else if (L.type === 'balon') [w, h] = BALON_SIZE[kind] || BALON_SIZE.dusunce;
  return [L.width || w, L.height || h];
}

// ════════════════════════════════════════════════════════════════════════════
//  KART
// ════════════════════════════════════════════════════════════════════════════
function star(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

export function drawKart(ctx, L, t, st, scene, res, th) {
  const [W, H] = widget2Size(L);
  const kind = L.kind || 'alinti';
  const p = clamp01(st.fold);
  const accent = col(L.accent || '$vurgu', th);
  const tc = col(L.textColor || '#2d2a3e', th);
  const font = fontCss(L.font);
  const hw = W / 2;
  const hh = H / 2;
  ctx.save();
  ctx.globalAlpha = st.opacity;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (kind === 'alinti') {
    pop(ctx, sub(p, 0, 0.5));
    surface(ctx, L, W, H, th, p);
    const pad = W * 0.08;
    ctx.fillStyle = accent;
    ctx.font = `700 ${H * 0.42}px Georgia, serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('“', -hw + pad * 0.8, -hh + H * 0.36);
    ctx.textBaseline = 'middle';
    const size = Math.min(H * 0.1, W * 0.055);
    ctx.font = `600 ${size}px ${font}`;
    const lines = wrap(ctx, L.text || '', W - pad * 2);
    const total = lines.join('\n').length;
    let shown = Math.floor(total * sub(p, 0.25, 1));
    ctx.fillStyle = tc;
    const y0 = -hh + H * 0.36 + size * 0.5;
    lines.forEach((ln, i) => {
      const part = ln.slice(0, Math.max(0, shown));
      shown -= ln.length + 1;
      ctx.fillText(part, -hw + pad, y0 + i * size * 1.3);
    });
    if (L.sub) {
      ctx.globalAlpha *= sub(p, 0.7, 1);
      ctx.fillStyle = accent;
      ctx.fillRect(-hw + pad, hh - H * 0.17, W * 0.08, 5);
      ctx.font = `600 ${size * 0.72}px ${font}`;
      ctx.fillText(L.sub, -hw + pad + W * 0.1, hh - H * 0.17 + 2);
    }
  } else if (kind === 'istatistik') {
    pop(ctx, sub(p, 0, 0.4));
    surface(ctx, L, W, H, th, p);
    const pad = W * 0.09;
    ctx.fillStyle = col('#8a85a3', th);
    ctx.font = `600 ${H * 0.075}px ${font}`;
    ctx.fillText(String(L.title || '').toLocaleUpperCase('tr'), -hw + pad, -hh + H * 0.16);
    const target = parseFloat(String(L.value ?? '0').replace(',', '.')) || 0;
    const dec = /[.,]\d/.test(String(L.value)) ? 1 : 0;
    const cur = target * outCubic(sub(p, 0.1, 0.8));
    ctx.fillStyle = tc;
    ctx.font = `800 ${H * 0.31}px ${font}`;
    ctx.fillText(`${L.prefix || ''}${fmt(cur, dec)}${L.unit || ''}`, -hw + pad, -hh + H * 0.46);
    if (L.sub) {
      const neg = String(L.sub).trim().startsWith('-') || String(L.sub).includes('▼');
      ctx.globalAlpha *= sub(p, 0.6, 0.9);
      ctx.fillStyle = neg ? '#e0584a' : '#2fa36b';
      ctx.font = `700 ${H * 0.085}px ${font}`;
      ctx.fillText(`${neg ? '▼' : '▲'} ${String(L.sub).replace(/^[-+▲▼\s]+/, '')}`, -hw + pad, -hh + H * 0.69);
      ctx.globalAlpha = st.opacity;
    }
    // süs çizgi grafiği
    const pts = 14;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const f = i / (pts - 1);
      if (f > sub(p, 0.2, 1)) break;
      const y = hh - H * 0.1 - (neg(L) ? 1 - f : f) * H * 0.1 - Math.sin(f * 9 + 1) * H * 0.018;
      const x = -hw + pad + f * (W - pad * 2);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else if (kind === 'fiyat') {
    pop(ctx, sub(p, 0, 0.4));
    surface(ctx, L, W, H, th, p);
    const pad = W * 0.1;
    ctx.fillStyle = accent;
    rr(ctx, -hw, -hh, W, H * 0.04, 36);
    ctx.fillRect(-hw + 36, -hh, W - 72, H * 0.014);
    ctx.fillStyle = tc;
    ctx.font = `700 ${H * 0.055}px ${font}`;
    ctx.fillText(L.title || 'Plan', -hw + pad, -hh + H * 0.11);
    ctx.font = `800 ${H * 0.13}px ${font}`;
    ctx.fillText(String(L.value ?? ''), -hw + pad, -hh + H * 0.25);
    const vw = ctx.measureText(String(L.value ?? '')).width;
    ctx.fillStyle = col('#8a85a3', th);
    ctx.font = `600 ${H * 0.045}px ${font}`;
    ctx.fillText(L.sub || '', -hw + pad + vw + 12, -hh + H * 0.27);
    ctx.fillStyle = '#00000014';
    ctx.fillRect(-hw + pad, -hh + H * 0.35, W - pad * 2, 2);
    const feats = L.lines?.length ? L.lines : ['Sınırsız proje', 'HD dışa aktarım', 'Öncelikli destek'];
    feats.forEach((f, i) => {
      const ip = outCubic(sub(p, 0.3 + i * 0.08, 0.5 + i * 0.08));
      const y = -hh + H * 0.43 + i * H * 0.085;
      ctx.save();
      ctx.globalAlpha *= ip;
      ctx.translate((1 - ip) * 24, 0);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(-hw + pad + 14, y, 14, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw + pad + 8, y);
      ctx.lineTo(-hw + pad + 13, y + 5);
      ctx.lineTo(-hw + pad + 21, y - 5);
      ctx.stroke();
      ctx.fillStyle = tc;
      ctx.font = `600 ${H * 0.05}px ${font}`;
      ctx.fillText(f, -hw + pad + 40, y);
      ctx.restore();
    });
    const bp = outBack(sub(p, 0.7, 1));
    ctx.save();
    ctx.translate(0, hh - H * 0.1);
    ctx.scale(bp, bp);
    ctx.fillStyle = accent;
    rr(ctx, -W * 0.3, -H * 0.04, W * 0.6, H * 0.08, H * 0.04);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `700 ${H * 0.046}px ${font}`;
    ctx.fillText(L.text || 'Başla', 0, 2);
    ctx.restore();
  } else if (kind === 'profil') {
    pop(ctx, sub(p, 0, 0.4));
    surface(ctx, L, W, H, th, p);
    ctx.fillStyle = accent;
    ctx.save();
    rr(ctx, -hw, -hh, W, H * 0.34, 36);
    ctx.clip();
    ctx.fillRect(-hw, -hh, W, H * 0.34);
    ctx.restore();
    const ar = H * 0.17;
    const ap = outBack(sub(p, 0.15, 0.55));
    ctx.save();
    ctx.translate(0, -hh + H * 0.34);
    ctx.scale(ap, ap);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, ar + 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = col('#2d2a3e', th);
    ctx.beginPath();
    ctx.arc(0, 0, ar, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `800 ${ar * 0.95}px ${font}`;
    ctx.fillText(initials(L.title), 0, 3);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.globalAlpha *= sub(p, 0.4, 0.7);
    ctx.fillStyle = tc;
    ctx.font = `800 ${H * 0.085}px ${font}`;
    ctx.fillText(L.title || 'Ad Soyad', 0, -hh + H * 0.34 + ar + H * 0.09);
    ctx.fillStyle = col('#8a85a3', th);
    ctx.font = `600 ${H * 0.055}px ${font}`;
    ctx.fillText(L.sub || '', 0, -hh + H * 0.34 + ar + H * 0.17);
    const stats = (L.lines?.length ? L.lines : ['128|Gönderi', '4,2B|Takipçi', '310|Takip']).map(split);
    stats.forEach((s, i) => {
      const x = (i - (stats.length - 1) / 2) * (W / (stats.length + 0.4));
      ctx.globalAlpha = st.opacity * sub(p, 0.6 + i * 0.07, 0.85 + i * 0.07);
      ctx.fillStyle = tc;
      ctx.font = `800 ${H * 0.065}px ${font}`;
      ctx.fillText(s[0], x, hh - H * 0.14);
      ctx.fillStyle = col('#8a85a3', th);
      ctx.font = `600 ${H * 0.04}px ${font}`;
      ctx.fillText(s[1] || '', x, hh - H * 0.07);
    });
  } else if (kind === 'bildirim') {
    const e = outBack(sub(p, 0, 0.55));
    ctx.globalAlpha *= clamp01(p * 3);
    ctx.translate(0, (1 - e) * -H * 1.2);
    surface(ctx, L, W, H, th, p, { radius: H / 2.4 });
    const r = H * 0.3;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-hw + H * 0.5, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `800 ${r}px ${font}`;
    ctx.fillText(L.icon || '!', -hw + H * 0.5, 3);
    ctx.textAlign = 'left';
    ctx.fillStyle = tc;
    ctx.font = `800 ${H * 0.21}px ${font}`;
    ctx.fillText(L.title || 'Bildirim', -hw + H * 0.95, -H * 0.17);
    ctx.fillStyle = col('#6f6a86', th);
    ctx.font = `500 ${H * 0.17}px ${font}`;
    const lines = wrap(ctx, L.text || '', W - H * 1.25);
    lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, -hw + H * 0.95, H * 0.07 + i * H * 0.2));
  } else if (kind === 'rozet') {
    const e = outBack(sub(p, 0, 0.6));
    ctx.rotate((1 - e) * -0.9 + (-0.12));
    ctx.scale(e, e);
    ctx.globalAlpha *= clamp01(p * 4);
    const R = Math.min(W, H) / 2;
    ctx.beginPath();
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * TAU;
      const rad = R * (0.93 + 0.07 * Math.cos(a * 18));
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.save();
    if (L.shadow !== false) {
      ctx.shadowColor = 'rgba(40,20,10,0.3)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
    }
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#ffffffcc';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 9]);
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.8, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    if (L.icon) {
      ctx.font = `700 ${R * 0.42}px ${font}`;
      ctx.fillText(L.icon, 0, -R * 0.38);
    }
    ctx.font = `800 ${R * (L.icon ? 0.3 : 0.4)}px ${font}`;
    ctx.fillText(String(L.title || 'YENİ').toLocaleUpperCase('tr'), 0, L.icon ? R * 0.02 : -R * 0.05);
    ctx.font = `700 ${R * 0.17}px ${font}`;
    ctx.fillText(L.sub || '', 0, L.icon ? R * 0.34 : R * 0.3);
  } else if (kind === 'puan') {
    pop(ctx, sub(p, 0, 0.4));
    surface(ctx, L, W, H, th, p);
    const v = parseFloat(String(L.value ?? '4.5').replace(',', '.')) || 0;
    const sr = H * 0.13;
    const gap = sr * 2.25;
    for (let i = 0; i < 5; i++) {
      const ip = outBack(sub(p, 0.08 + i * 0.1, 0.38 + i * 0.1));
      const fill = clamp01(v - i);
      ctx.save();
      ctx.translate(-hw + W * 0.09 + sr + i * gap, -H * 0.1);
      ctx.scale(ip, ip);
      star(ctx, 0, 0, sr);
      ctx.fillStyle = '#e6e2f0';
      ctx.fill();
      if (fill > 0) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = col('#f6b73c', th);
        ctx.fillRect(-sr, -sr, sr * 2 * fill, sr * 2);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.globalAlpha *= sub(p, 0.6, 0.9);
    ctx.fillStyle = tc;
    ctx.font = `800 ${H * 0.2}px ${font}`;
    ctx.fillText(fmt(v, 1), hw - W * 0.2, -H * 0.1);
    ctx.font = `600 ${H * 0.085}px ${font}`;
    ctx.fillStyle = col('#8a85a3', th);
    ctx.fillText(L.title || '', -hw + W * 0.09, H * 0.2);
    ctx.fillText(L.sub || '', -hw + W * 0.09, H * 0.33 * 1.0);
  } else if (kind === 'altuc') {
    const e = outCubic(sub(p, 0, 0.55));
    const bw = W * e;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-hw, -hh, W, H);
    ctx.clip();
    ctx.fillStyle = accent;
    ctx.fillRect(-hw, -H * 0.02, bw * 0.62, H * 0.5);
    ctx.fillStyle = col(L.bg || '#1f1c2e', th);
    ctx.fillRect(-hw, -hh + H * 0.02, bw, H * 0.62);
    ctx.fillStyle = accent;
    ctx.fillRect(-hw, -hh + H * 0.02, H * 0.07, H * 0.62);
    ctx.globalAlpha *= sub(p, 0.35, 0.7);
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${H * 0.3}px ${font}`;
    ctx.fillText(L.title || 'Ad Soyad', -hw + H * 0.22, -hh + H * 0.3);
    ctx.restore();
    ctx.globalAlpha *= sub(p, 0.5, 0.85);
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${H * 0.2}px ${font}`;
    ctx.save();
    ctx.translate(-hw + H * 0.22 + (1 - sub(p, 0.5, 0.85)) * -40, 0);
    ctx.fillText(L.sub || 'Unvan', 0, hh - H * 0.28);
    ctx.restore();
  } else if (kind === 'takvim') {
    pop(ctx, sub(p, 0, 0.4));
    surface(ctx, L, W, H, th, p, { radius: 30 });
    ctx.save();
    rr(ctx, -hw, -hh, W, H, 30);
    ctx.clip();
    ctx.fillStyle = accent;
    ctx.fillRect(-hw, -hh, W, H * 0.28);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `800 ${H * 0.12}px ${font}`;
    ctx.fillText(String(L.sub || 'Ekim').toLocaleUpperCase('tr'), 0, -hh + H * 0.14);
    for (const x of [-0.25, 0.25]) {
      ctx.fillStyle = '#ffffffee';
      rr(ctx, W * x - 9, -hh - 14, 18, 40, 9);
      ctx.fill();
    }
    ctx.globalAlpha *= outCubic(sub(p, 0.3, 0.7));
    ctx.fillStyle = tc;
    ctx.font = `800 ${H * 0.4}px ${font}`;
    ctx.fillText(String(L.value || '12'), 0, H * 0.07);
    ctx.fillStyle = col('#8a85a3', th);
    ctx.font = `600 ${H * 0.095}px ${font}`;
    ctx.fillText(L.title || 'Pazartesi', 0, hh - H * 0.12);
  } else if (kind === 'balon') {
    const right = L.side === 'sag';
    const e = outBack(sub(p, 0, 0.5));
    ctx.translate(right ? hw : -hw, hh);
    ctx.scale(e, e);
    ctx.translate(right ? -hw : hw, -hh);
    ctx.globalAlpha *= clamp01(p * 3);
    const bh = H * 0.88;
    const bubble = right ? accent : col(L.bg || '#ffffff', th);
    ctx.save();
    if (L.shadow !== false) {
      ctx.shadowColor = 'rgba(40,20,10,0.2)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
    }
    ctx.fillStyle = bubble;
    rr(ctx, -hw, -hh, W, bh, bh * 0.3);
    ctx.fill();
    ctx.beginPath();
    const tx = right ? hw - W * 0.1 : -hw + W * 0.1;
    ctx.moveTo(tx, -hh + bh - 4);
    ctx.lineTo(tx + (right ? 26 : -4), hh);
    ctx.lineTo(tx + (right ? -34 : 34), -hh + bh - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = right ? '#fff' : tc;
    ctx.font = `600 ${H * 0.2}px ${font}`;
    const lines = wrap(ctx, L.text || 'Merhaba!', W * 0.84);
    const y0 = -hh + bh / 2 - ((lines.length - 1) * H * 0.26) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, -hw + W * 0.08, y0 + i * H * 0.26));
  }
  ctx.restore();
  return { x0: -hw, y0: -hh, x1: hw, y1: hh };
}
const neg = (L) => String(L.sub || '').trim().startsWith('-') || String(L.sub || '').includes('▼');

// ════════════════════════════════════════════════════════════════════════════
//  LİSTE
// ════════════════════════════════════════════════════════════════════════════
export function drawListe(ctx, L, t, st, scene, res, th) {
  const [W, H] = widget2Size(L);
  const kind = L.kind || 'kontrol';
  const p = clamp01(st.fold);
  const accent = col(L.accent || '$vurgu', th);
  const tc = col(L.textColor || '#2d2a3e', th);
  const dim = col('#8a85a3', th);
  const font = fontCss(L.font);
  const hw = W / 2;
  const hh = H / 2;
  const pad = W * 0.08;
  ctx.save();
  ctx.globalAlpha = st.opacity;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if (L.card !== false) {
    ctx.save();
    ctx.globalAlpha *= clamp01(p * 4);
    surface(ctx, L, W, H, th, p, { radius: 34 });
    ctx.restore();
  }
  const headH = L.title ? 110 : 40;
  if (L.title) {
    ctx.globalAlpha = st.opacity * clamp01(p * 4);
    ctx.fillStyle = tc;
    ctx.font = `800 ${46}px ${font}`;
    ctx.fillText(L.title, -hw + pad, -hh + 62);
    ctx.fillStyle = accent;
    ctx.fillRect(-hw + pad, -hh + 94, 70 * outCubic(sub(p, 0, 0.3)), 6);
  }
  const top = -hh + headH + 20;

  if (kind === 'kontrol') {
    const items = L.lines?.length ? L.lines : ['Birinci', 'İkinci', 'Üçüncü'];
    const n = items.length;
    items.forEach((it, i) => {
      const a = 0.12 + (i / n) * 0.7;
      const rp = outCubic(sub(p, a - 0.08, a + 0.1));
      const tick = sub(p, a + 0.05, a + 0.2);
      const y = top + 43 + i * 86;
      ctx.save();
      ctx.globalAlpha = st.opacity * rp;
      ctx.translate((1 - rp) * 30, 0);
      ctx.strokeStyle = tick > 0 ? accent : '#cfcade';
      ctx.lineWidth = 5;
      rr(ctx, -hw + pad, y - 25, 50, 50, 14);
      if (tick > 0) {
        ctx.fillStyle = accent;
        ctx.fill();
      } else ctx.stroke();
      if (tick > 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const x0 = -hw + pad;
        ctx.moveTo(x0 + 12, y);
        if (tick < 0.5) ctx.lineTo(x0 + 12 + 10 * (tick / 0.5), y + 10 * (tick / 0.5));
        else {
          ctx.lineTo(x0 + 22, y + 10);
          ctx.lineTo(x0 + 22 + 16 * ((tick - 0.5) / 0.5), y + 10 - 22 * ((tick - 0.5) / 0.5));
        }
        ctx.stroke();
      }
      ctx.fillStyle = tick >= 1 ? dim : tc;
      ctx.font = `600 ${38}px ${font}`;
      ctx.fillText(it, -hw + pad + 76, y + 2);
      if (tick >= 1) {
        const w = ctx.measureText(it).width;
        ctx.fillStyle = dim;
        ctx.fillRect(-hw + pad + 76, y + 2, w * sub(tick, 1, 1), 3);
      }
      ctx.restore();
    });
  } else if (kind === 'adimlar') {
    const items = (L.lines?.length ? L.lines : ['Fikir|Konuyu belirle', 'Taslak|Sahneleri çiz', 'Yayın|Videoyu paylaş']).map(split);
    const n = items.length;
    const x0 = -hw + pad + 28;
    const lineP = sub(p, 0.1, 0.95);
    ctx.strokeStyle = '#d8d3e6';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0, top + 55);
    ctx.lineTo(x0, top + 55 + (n - 1) * 130);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x0, top + 55);
    ctx.lineTo(x0, top + 55 + (n - 1) * 130 * lineP);
    ctx.stroke();
    items.forEach((it, i) => {
      const a = n > 1 ? 0.1 + (i / (n - 1)) * 0.85 : 0.2;
      const rp = outBack(sub(p, a - 0.05, a + 0.12));
      const y = top + 55 + i * 130;
      ctx.save();
      ctx.translate(x0, y);
      ctx.scale(rp, rp);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = `800 ${32}px ${font}`;
      ctx.fillText(String(i + 1), 0, 2);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = st.opacity * clamp01(rp);
      ctx.translate((1 - clamp01(rp)) * 30, 0);
      ctx.textAlign = 'left';
      ctx.fillStyle = tc;
      ctx.font = `800 ${40}px ${font}`;
      ctx.fillText(it[0], x0 + 56, y - (it[1] ? 14 : 0));
      if (it[1]) {
        ctx.fillStyle = dim;
        ctx.font = `500 ${30}px ${font}`;
        ctx.fillText(it[1], x0 + 56, y + 28);
      }
      ctx.restore();
    });
  } else if (kind === 'ilerleme') {
    const raw = (L.data?.length ? L.data : [{ label: 'Tasarım', value: 85 }, { label: 'Kodlama', value: 60 }, { label: 'Test', value: 35 }]);
    const data = raw.map((d) => (typeof d === 'number' ? { label: '', value: d } : { label: d.label ?? '', value: Number(d.value) || 0, color: d.color }));
    const n = data.length;
    const palette = [accent, '#4d9de0', '#7bc86c', '#f6c445', '#b388eb'];
    data.forEach((d, i) => {
      const a = (i / Math.max(1, n)) * 0.45;
      const ip = outCubic(sub(p, a, a + 0.5));
      const y = top + 30 + i * 100;
      const bw = W - pad * 2;
      ctx.globalAlpha = st.opacity * clamp01(ip * 3);
      ctx.fillStyle = tc;
      ctx.font = `700 ${34}px ${font}`;
      ctx.fillText(d.label, -hw + pad, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = dim;
      ctx.fillText(`${fmt(d.value * ip)}%`, hw - pad, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e8e4f1';
      rr(ctx, -hw + pad, y + 24, bw, 22, 11);
      ctx.fill();
      if (ip > 0.01) {
        ctx.fillStyle = col(d.color, th) || palette[i % palette.length];
        rr(ctx, -hw + pad, y + 24, Math.max(22, (bw * Math.min(100, d.value) * ip) / 100), 22, 11);
        ctx.fill();
      }
    });
  } else if (kind === 'tablo') {
    const rows = (L.lines?.length ? L.lines : ['Plan|Fiyat|Kullanıcı', 'Başlangıç|₺0|1', 'Takım|₺99|10', 'Kurumsal|₺499|Sınırsız']).map(split);
    const head = rows[0];
    const body = rows.slice(1);
    const cols = head.length;
    const cw = (W - pad * 2) / cols;
    const rowH = 80;
    const hp = outCubic(sub(p, 0, 0.3));
    ctx.save();
    ctx.globalAlpha = st.opacity * hp;
    ctx.fillStyle = accent;
    rr(ctx, -hw + pad - 14, top + 6, W - pad * 2 + 28, rowH - 10, 16);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${32}px ${font}`;
    head.forEach((c, j) => ctx.fillText(c, -hw + pad + j * cw, top + 6 + (rowH - 10) / 2 + 2));
    ctx.restore();
    body.forEach((r, i) => {
      const a = 0.2 + (i / Math.max(1, body.length)) * 0.6;
      const rp = outCubic(sub(p, a, a + 0.2));
      const y = top + 6 + (i + 1) * rowH;
      ctx.save();
      ctx.globalAlpha = st.opacity * rp;
      ctx.translate(0, (1 - rp) * 20);
      if (i % 2 === 0) {
        ctx.fillStyle = '#f3f0fa';
        rr(ctx, -hw + pad - 14, y, W - pad * 2 + 28, rowH - 10, 14);
        ctx.fill();
      }
      ctx.fillStyle = tc;
      ctx.font = `600 ${32}px ${font}`;
      r.forEach((c, j) => ctx.fillText(c, -hw + pad + j * cw, y + (rowH - 10) / 2 + 2));
      ctx.restore();
    });
  }
  ctx.restore();
  return { x0: -hw, y0: -hh, x1: hw, y1: hh };
}

// ════════════════════════════════════════════════════════════════════════════
//  KOD PENCERESİ
// ════════════════════════════════════════════════════════════════════════════
function tokens(line) {
  // [{text, kind}] — yorum, metin, anahtar sözcük, sayı, diğer
  const out = [];
  const cm = line.search(/(\/\/|#)/);
  const code = cm >= 0 ? line.slice(0, cm) : line;
  const comment = cm >= 0 ? line.slice(cm) : '';
  const re = /("[^"]*"|'[^']*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|for|while|import|from|export|default|class|new|await|async|def|print|true|false|null|None)\b)/g;
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push({ text: code.slice(last, m.index), kind: 'plain' });
    out.push({ text: m[0], kind: m[1] ? 'str' : m[2] ? 'num' : 'kw' });
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push({ text: code.slice(last), kind: 'plain' });
  if (comment) out.push({ text: comment, kind: 'cmt' });
  return out;
}

export function drawKod(ctx, L, t, st, scene, res, th) {
  const [W, H] = widget2Size(L);
  const p = clamp01(st.fold);
  const dark = (L.tema || 'koyu') !== 'acik';
  const kind = L.kind || 'terminal';
  const bg = dark ? '#16151f' : '#fbfaff';
  const bar = dark ? '#24222f' : '#ebe8f5';
  const fg = dark ? '#e7e4f5' : '#2d2a3e';
  const dim = dark ? '#7d7893' : '#9c97b3';
  const accent = col(L.accent || '#7bc86c', th);
  const hw = W / 2;
  const hh = H / 2;
  const barH = 64;
  const fs = Math.min(34, H * 0.065);
  const lh = fs * 1.55;
  const lines = L.lines?.length ? L.lines : ['$ echo merhaba'];
  const total = lines.reduce((s, l) => s + l.length + 1, 0);
  let shown = Math.floor(total * sub(p, 0.12, 0.95));
  ctx.save();
  ctx.globalAlpha = st.opacity;
  pop(ctx, sub(p, 0, 0.25), 0.94);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = bg;
  rr(ctx, -hw, -hh, W, H, 22);
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, -hw, -hh, W, H, 22);
  ctx.clip();
  ctx.fillStyle = bar;
  ctx.fillRect(-hw, -hh, W, barH);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(-hw + 36 + i * 36, -hh + barH / 2, 10, 0, TAU);
    ctx.fill();
  });
  ctx.fillStyle = dim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${26}px system-ui, sans-serif`;
  ctx.fillText(L.title || (kind === 'terminal' ? 'terminal' : 'main.js'), 0, -hh + barH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.font = `500 ${fs}px ${MONO}`;
  const gutter = kind === 'editor' && L.numbers !== false ? 70 : 0;
  const x0 = -hw + 36 + gutter;
  const maxRows = Math.floor((H - barH - 50) / lh);
  let cursor = null;
  lines.slice(0, maxRows).forEach((ln, i) => {
    const y = -hh + barH + 38 + lh * 0.5 + i * lh;
    const take = Math.max(0, Math.min(ln.length, shown));
    shown -= ln.length + 1;
    const vis = ln.slice(0, take);
    if (gutter && (take > 0 || shown >= 0)) {
      ctx.fillStyle = dim;
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), -hw + 36 + gutter - 24, y);
      ctx.textAlign = 'left';
    }
    let x = x0;
    if (kind === 'terminal') {
      const cmd = vis.startsWith('$');
      if (cmd) {
        ctx.fillStyle = accent;
        ctx.fillText('$', x, y);
        x += ctx.measureText('$ ').width;
        ctx.fillStyle = fg;
        ctx.fillText(vis.slice(2), x, y);
        x += ctx.measureText(vis.slice(2)).width;
      } else {
        ctx.fillStyle = dim;
        ctx.fillText(vis, x, y);
        x += ctx.measureText(vis).width;
      }
    } else {
      for (const tk of tokens(vis)) {
        ctx.fillStyle = { kw: dark ? '#c792ea' : '#8b3fc0', str: dark ? '#9be37a' : '#2f8a3a', num: dark ? '#f6a56a' : '#c1561f', cmt: dim, plain: fg }[tk.kind];
        ctx.fillText(tk.text, x, y);
        x += ctx.measureText(tk.text).width;
      }
    }
    if (take > 0 && (shown < 0 || take < ln.length)) cursor = { x, y };
  });
  if (!cursor && p > 0.1) {
    const i = Math.min(lines.length, maxRows) - 1;
    const last = lines[i] || '';
    cursor = { x: x0 + ctx.measureText(kind === 'terminal' && last.startsWith('$') ? `$ ${last.slice(2)}` : last).width, y: -hh + barH + 38 + lh * 0.5 + i * lh };
  }
  if (cursor && Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = accent;
    ctx.fillRect(cursor.x + 4, cursor.y - fs * 0.55, fs * 0.55, fs * 1.1);
  }
  ctx.restore();
  ctx.restore();
  return { x0: -hw, y0: -hh, x1: hw, y1: hh };
}

// ════════════════════════════════════════════════════════════════════════════
//  ZAMAN
// ════════════════════════════════════════════════════════════════════════════
export function drawZaman(ctx, L, t, st, scene, res, th) {
  const [W, H] = widget2Size(L);
  const kind = L.kind || 'dijital';
  const p = clamp01(st.fold);
  const accent = col(L.accent || '$vurgu', th);
  const tc = col(L.textColor || '#2d2a3e', th);
  const font = fontCss(L.font);
  const from = L.from ?? 60;
  const to = L.to ?? 0;
  const secs = from + (to - from) * sub(p, 0.1, 1);
  const frac = from === to ? 1 : (from - secs) / (from - to);
  const mm = Math.floor(Math.max(0, secs) / 60);
  const ss = Math.floor(Math.max(0, secs) % 60);
  const txt = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const hw = W / 2;
  const hh = H / 2;
  ctx.save();
  ctx.globalAlpha = st.opacity;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  pop(ctx, sub(p, 0, 0.12), 0.9);
  if (kind === 'dijital') {
    if (L.card !== false) surface(ctx, L, W, H, th, p, { fill: '#ffffff', radius: 38 });
    const cells = txt.split('');
    const cw = (W * 0.84) / 5.4;
    cells.forEach((c, i) => {
      const x = (i - 2) * cw * 1.04;
      if (c === ':') {
        ctx.fillStyle = accent;
        const on = Math.floor(t * 2) % 2 === 0 || p >= 1;
        ctx.globalAlpha = st.opacity * (on ? 1 : 0.35);
        for (const dy of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(x, dy * H * 0.09, H * 0.032, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = st.opacity;
        return;
      }
      ctx.fillStyle = L.card === false ? '#1f1c2e' : '#1f1c2e';
      rr(ctx, x - cw * 0.46, -H * 0.3, cw * 0.92, H * 0.6, H * 0.08);
      ctx.fill();
      ctx.fillStyle = '#ffffff1a';
      ctx.fillRect(x - cw * 0.46, -1.5, cw * 0.92, 3);
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${H * 0.46}px ${MONO}`;
      ctx.fillText(c, x, 4);
    });
    if (L.label) {
      ctx.fillStyle = col('#8a85a3', th);
      ctx.font = `700 ${H * 0.085}px ${font}`;
      ctx.fillText(String(L.label).toLocaleUpperCase('tr'), 0, hh - H * 0.1);
    }
  } else if (kind === 'halka') {
    const R = Math.min(W, H) / 2;
    if (L.card !== false) {
      ctx.fillStyle = L.bg ? col(L.bg, th) : '#ffffff';
      ctx.save();
      ctx.shadowColor = 'rgba(40,20,10,0.22)';
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.lineWidth = R * 0.12;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e8e4f1';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.78, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.78, -Math.PI / 2, -Math.PI / 2 + TAU * clamp01(1 - frac * 1) + 0.0001);
    ctx.stroke();
    ctx.fillStyle = tc;
    ctx.font = `800 ${R * 0.4}px ${font}`;
    ctx.fillText(txt, 0, -R * 0.02);
    if (L.label) {
      ctx.fillStyle = col('#8a85a3', th);
      ctx.font = `700 ${R * 0.12}px ${font}`;
      ctx.fillText(String(L.label).toLocaleUpperCase('tr'), 0, R * 0.3);
    }
  } else {
    const R = Math.min(W, H) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(40,20,10,0.25)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = L.bg ? col(L.bg, th) : '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = tc;
    ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU - Math.PI / 2;
      const big = i % 5 === 0;
      ctx.lineWidth = big ? 7 : 3;
      ctx.globalAlpha = st.opacity * (big ? 1 : 0.45);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * (big ? 0.82 : 0.88), Math.sin(a) * R * (big ? 0.82 : 0.88));
      ctx.lineTo(Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94);
      ctx.stroke();
    }
    ctx.globalAlpha = st.opacity;
    const sa = (Math.max(0, secs) % 60) / 60 * TAU - Math.PI / 2;
    const ma = (Math.max(0, secs) / 3600) * TAU - Math.PI / 2;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ma) * R * 0.5, Math.sin(ma) * R * 0.5);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(sa) * R * 0.14, -Math.sin(sa) * R * 0.14);
    ctx.lineTo(Math.cos(sa) * R * 0.72, Math.sin(sa) * R * 0.72);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.045, 0, TAU);
    ctx.fill();
    if (L.label) {
      ctx.fillStyle = col('#8a85a3', th);
      ctx.font = `700 ${R * 0.1}px ${font}`;
      ctx.fillText(String(L.label).toLocaleUpperCase('tr'), 0, R * 0.34);
    }
  }
  ctx.restore();
  return { x0: -hw, y0: -hh, x1: hw, y1: hh };
}


// ════════════════════════════════════════════════════════════════════════════
//  BALON / NOT
// ════════════════════════════════════════════════════════════════════════════
const hashStr = (str) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
/** Metni kutuya sığacak en büyük punto ile sarar. */
function fitText(ctx, text, W, H, fontFn, start, min = 14, lh = 1.22) {
  let size = start;
  let lines = [];
  for (; size >= min; size -= 2) {
    ctx.font = fontFn(size);
    lines = wrap(ctx, text, W);
    if (lines.length * size * lh <= H) break;
  }
  return { size, lines, lh };
}
/** Sığdırılmış metni (cx, cy) merkezli çizer; frac = daktilo ilerlemesi (0..1). */
function putText(ctx, fit, cx, cy, frac = 1, align = 'center') {
  const { size, lines, lh } = fit;
  const total = lines.join('\n').length;
  let shown = Math.ceil(total * clamp01(frac));
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const y0 = cy - ((lines.length - 1) * size * lh) / 2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln.slice(0, Math.max(0, shown)), cx, y0 + i * size * lh);
    shown -= ln.length + 1;
  });
}
const shadowOn = (ctx, L, blur = 28, dy = 10) => {
  if (L.shadow === false) return;
  ctx.shadowColor = 'rgba(40,20,10,0.24)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = dy;
};

export function drawBalon(ctx, L, t, st, scene, res, th) {
  const [W, H] = widget2Size(L);
  const kind = L.kind || 'dusunce';
  const p = clamp01(st.fold);
  const accent = col(L.accent || '$vurgu', th);
  const tc = col(L.textColor || '#2d2a3e', th);
  const font = fontCss(L.font);
  const fnt = (w) => (sz) => `${w} ${sz}px ${font}`;
  const hw = W / 2;
  const hh = H / 2;
  const side = L.side || 'sol';
  const dirX = side === 'sag' ? 1 : -1;
  const type = sub(p, 0.25, 0.9);
  ctx.save();
  ctx.globalAlpha = st.opacity;
  ctx.textBaseline = 'middle';

  if (kind === 'dusunce') {
    const e = outBack(sub(p, 0, 0.5));
    ctx.globalAlpha *= clamp01(p * 3);
    const cw = W;
    const ch = H * 0.78;
    const cy = -hh + ch / 2;
    ctx.translate(0, (1 - e) * 30);
    ctx.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e);
    const bump = (cx, cy2, r, path) => {
      path.moveTo(cx + r, cy2);
      path.arc(cx, cy2, r, 0, TAU);
    };
    const path = new Path2D();
    const rx = cw * 0.4;
    const ry = ch * 0.38;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      bump(Math.cos(a) * rx, cy + Math.sin(a) * ry, Math.min(cw, ch) * 0.17, path);
    }
    path.moveTo(rx * 0.9, cy);
    path.ellipse(0, cy, rx * 0.95, ry * 0.95, 0, 0, TAU);
    const fill = L.bg ? col(L.bg, th) : '#ffffff';
    // önce kalın kontur (gölgeyle), üstüne dolgu: yalnızca dış kontur görünür
    ctx.save();
    shadowOn(ctx, L, 32, 12);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.stroke(path);
    ctx.restore();
    ctx.fillStyle = fill;
    ctx.fill(path);
    // küçülen düşünce baloncukları
    const baseX = dirX * cw * 0.28;
    [[0.14, 0.9], [0.09, 0.97], [0.05, 1.0]].forEach(([r, f], i) => {
      const ip = outBack(sub(p, 0.35 + i * 0.12, 0.65 + i * 0.12));
      ctx.save();
      ctx.translate(baseX - dirX * i * cw * 0.1, cy + ch / 2 + H * (0.03 + i * 0.075));
      ctx.scale(ip, ip);
      shadowOn(ctx, L, 12, 4);
      ctx.fillStyle = fill;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, H * r * f * 0.7, 0, TAU);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = tc;
    const fit = fitText(ctx, L.text || '', cw * 0.62, ch * 0.5, fnt('700'), H * 0.14);
    ctx.font = fit.size ? fnt('700')(fit.size) : ctx.font;
    putText(ctx, fit, 0, cy, type);
  } else if (kind === 'bagirma') {
    const e = outBack(sub(p, 0, 0.45));
    ctx.rotate((1 - e) * 0.5 + (p >= 1 ? Math.sin(t * 16) * 0.012 : 0));
    ctx.scale(e, e);
    ctx.globalAlpha *= clamp01(p * 4);
    const r = rng(hashStr(L.id || 'b'));
    const n = 18;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU;
      const big = i % 2 === 0;
      const rad = big ? 1 : 0.68 + r() * 0.06;
      const jitter = big ? 0.9 + r() * 0.1 : 1;
      ctx.lineTo(Math.cos(a) * hw * rad * jitter, Math.sin(a) * hh * rad * jitter);
    }
    ctx.closePath();
    ctx.save();
    shadowOn(ctx, L, 0, 0);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = col('#1f1c2e', th);
    ctx.stroke();
    ctx.fillStyle = L.textColor ? tc : '#ffffff';
    const txt = String(L.text || 'VAY CANINA!').toLocaleUpperCase('tr');
    const fit = fitText(ctx, txt, W * 0.62, H * 0.5, fnt('800'), H * 0.2, 16, 1.05);
    ctx.font = fnt('800')(fit.size);
    ctx.save();
    ctx.rotate(-0.06);
    putText(ctx, fit, 0, 0, type);
    ctx.restore();
  } else if (kind === 'fisilti') {
    ctx.globalAlpha *= clamp01(p * 2.2) * 0.92;
    const lift = (1 - outCubic(sub(p, 0, 0.6))) * 20;
    ctx.translate(0, lift);
    const bw = W;
    const bh = H * 0.72;
    ctx.fillStyle = L.bg ? col(L.bg, th) : '#ffffffd9';
    rr(ctx, -hw, -hh, bw, bh, bh * 0.4);
    ctx.fill();
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = col('#9c97b3', th);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col('#8a85a3', th);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(dirX * hw * 0.55 - dirX * i * 22, -hh + bh + 18 + i * 8, 7 - i * 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = col(L.textColor || '#6f6a86', th);
    const fit = fitText(ctx, L.text || 'psst… sana bir sırrım var', bw * 0.8, bh * 0.6, (sz) => `italic 500 ${sz}px ${font}`, H * 0.24);
    ctx.font = `italic 500 ${fit.size}px ${font}`;
    putText(ctx, fit, 0, -hh + bh / 2, type);
  } else if (kind === 'anlatici') {
    const e = outCubic(sub(p, 0, 0.45));
    ctx.translate((1 - e) * -60, 0);
    ctx.globalAlpha *= clamp01(p * 3);
    const bg = L.bg ? col(L.bg, th) : '#ffd54a';
    ctx.fillStyle = '#1f1c2e';
    ctx.fillRect(-hw + 10, -hh + 10, W - 12, H - 12);
    ctx.fillStyle = bg;
    ctx.fillRect(-hw, -hh, W - 12, H - 12);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1f1c2e';
    ctx.strokeRect(-hw, -hh, W - 12, H - 12);
    ctx.fillStyle = col(L.textColor || '#1f1c2e', th);
    const fit = fitText(ctx, L.text || 'Bu sırada, şehrin öbür ucunda…', W * 0.86, (H - 12) * 0.7, fnt('800'), H * 0.34);
    ctx.font = fnt('800')(fit.size);
    putText(ctx, fit, -hw + W * 0.05, -hh + (H - 12) / 2, type, 'left');
  } else if (kind === 'yaziyor') {
    const e = outBack(sub(p, 0, 0.4));
    ctx.translate(dirX * hw, hh);
    ctx.scale(e, e);
    ctx.translate(-dirX * hw, -hh);
    ctx.globalAlpha *= clamp01(p * 3);
    const bh = H * 0.82;
    ctx.save();
    shadowOn(ctx, L, 20, 6);
    ctx.fillStyle = L.bg ? col(L.bg, th) : '#e9e6f2';
    rr(ctx, -hw, -hh, W, bh, bh / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(dirX * hw * 0.62, -hh + bh - 6);
    ctx.lineTo(dirX * hw * 0.95, hh);
    ctx.lineTo(dirX * hw * 0.3, -hh + bh - 6);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = col(L.textColor && L.textColor !== '#2d2a3e' ? L.textColor : '#8a85a3', th);
    for (let i = 0; i < 3; i++) {
      const bounce = Math.max(0, Math.sin(t * 7 - i * 0.9)) * bh * 0.16;
      ctx.beginPath();
      ctx.arc((i - 1) * W * 0.22, -hh + bh / 2 - bounce, bh * 0.11, 0, TAU);
      ctx.fill();
    }
  } else if (kind === 'sesmesaji') {
    const e = outBack(sub(p, 0, 0.4));
    ctx.scale(e, e);
    ctx.globalAlpha *= clamp01(p * 3);
    ctx.save();
    shadowOn(ctx, L, 22, 8);
    ctx.fillStyle = L.bg ? col(L.bg, th) : accent;
    rr(ctx, -hw, -hh, W, H, H / 2.2);
    ctx.fill();
    ctx.restore();
    const cr = H * 0.34;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-hw + H * 0.5, 0, cr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-hw + H * 0.5 - cr * 0.28, -cr * 0.42);
    ctx.lineTo(-hw + H * 0.5 + cr * 0.5, 0);
    ctx.lineTo(-hw + H * 0.5 - cr * 0.28, cr * 0.42);
    ctx.fill();
    const r = rng(hashStr(L.id || 'v'));
    const bars = 26;
    const x0 = -hw + H * 1.05;
    const x1 = hw - W * 0.17;
    const prog = sub(p, 0.2, 1);
    for (let i = 0; i < bars; i++) {
      const hgt = H * (0.18 + r() * 0.5);
      const x = x0 + (i / (bars - 1)) * (x1 - x0);
      ctx.fillStyle = i / bars < prog ? '#ffffff' : '#ffffff66';
      rr(ctx, x - 3.5, -hgt / 2, 7, hgt, 3.5);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.font = `700 ${H * 0.24}px ${font}`;
    ctx.fillText(L.text || '0:12', hw - W * 0.04, 2);
  } else if (kind === 'ipucu') {
    const e = outBack(sub(p, 0, 0.45));
    ctx.scale(e, e);
    ctx.globalAlpha *= clamp01(p * 3);
    const bg = L.bg ? col(L.bg, th) : '#1f1c2e';
    const vertical = side === 'ust' || side === 'alt';
    const aw = Math.min(W, H) * 0.18;
    const bw = vertical ? W : W - aw;
    const bh = vertical ? H - aw : H;
    const bx = side === 'sol' ? -hw + aw : -hw;
    const by = side === 'ust' ? -hh + aw : -hh;
    ctx.save();
    shadowOn(ctx, L, 24, 8);
    ctx.fillStyle = bg;
    rr(ctx, bx, by, bw, bh, Math.min(bw, bh) * 0.22);
    ctx.fill();
    ctx.beginPath();
    if (side === 'ust') { ctx.moveTo(-aw, by + 2); ctx.lineTo(0, -hh); ctx.lineTo(aw, by + 2); }
    else if (side === 'alt') { ctx.moveTo(-aw, by + bh - 2); ctx.lineTo(0, hh); ctx.lineTo(aw, by + bh - 2); }
    else if (side === 'sag') { ctx.moveTo(bx + bw - 2, -aw); ctx.lineTo(hw, 0); ctx.lineTo(bx + bw - 2, aw); }
    else { ctx.moveTo(bx + 2, -aw); ctx.lineTo(-hw, 0); ctx.lineTo(bx + 2, aw); }
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = L.textColor && L.textColor !== '#2d2a3e' ? tc : '#ffffff';
    const fit = fitText(ctx, L.text || 'İpucu: Kaydet düğmesine bas', bw * 0.84, bh * 0.66, fnt('600'), bh * 0.3);
    ctx.font = fnt('600')(fit.size);
    putText(ctx, fit, bx + bw / 2, by + bh / 2, type);
  } else if (kind === 'notkagidi') {
    const e = outBack(sub(p, 0, 0.5));
    ctx.rotate(-0.05 + (1 - e) * 0.4);
    ctx.scale(e, e);
    ctx.globalAlpha *= clamp01(p * 3);
    const bg = L.bg ? col(L.bg, th) : '#ffe770';
    ctx.save();
    shadowOn(ctx, L, 26, 12);
    ctx.fillStyle = bg;
    ctx.beginPath();
    const f = Math.min(W, H) * 0.14;
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, hh - f);
    ctx.lineTo(hw - f, hh);
    ctx.lineTo(-hw, hh);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#00000022';
    ctx.beginPath();
    ctx.moveTo(hw, hh - f);
    ctx.lineTo(hw - f, hh);
    ctx.lineTo(hw - f, hh - f);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff99';
    ctx.fillRect(-W * 0.16, -hh - H * 0.03, W * 0.32, H * 0.08);
    ctx.fillStyle = col(L.textColor || '#3a3320', th);
    let y = -hh + H * 0.18;
    if (L.title) {
      ctx.font = `800 ${H * 0.1}px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText(L.title, -hw + W * 0.09, y);
      y += H * 0.1;
    }
    const fit = fitText(ctx, L.text || 'Unutma: videoyu\nyarın paylaş!', W * 0.82, hh - y - H * 0.08 + hh * 0.9, fnt('600'), H * 0.11);
    ctx.font = fnt('600')(fit.size);
    ctx.textAlign = 'left';
    const total = fit.lines.join('\n').length;
    let shown = Math.ceil(total * type);
    fit.lines.forEach((ln, i) => {
      ctx.fillText(ln.slice(0, Math.max(0, shown)), -hw + W * 0.09, y + H * 0.06 + i * fit.size * 1.3);
      shown -= ln.length + 1;
    });
  } else if (kind === 'etiket') {
    const pillH = H * 0.5;
    const pw = W * 0.7;
    const px = side === 'sag' ? -hw : hw - pw;
    const dotX = side === 'sag' ? hw - 18 : -hw + 18;
    const dotY = hh - 18;
    const lp = outCubic(sub(p, 0.05, 0.6));
    const midX = dotX;
    const pillCx = px + pw / 2;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // gösterge çizgisi: nokta → yukarı → balona
    ctx.beginPath();
    ctx.moveTo(dotX, dotY);
    const up = dotY + (-hh + pillH / 2 - dotY) * Math.min(1, lp * 2);
    ctx.lineTo(midX, up);
    if (lp > 0.5) {
      const tx = side === 'sag' ? px + pw : px;
      ctx.lineTo(midX + (tx - midX) * ((lp - 0.5) * 2), -hh + pillH / 2);
    }
    ctx.stroke();
    const dp = outBack(sub(p, 0, 0.3));
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 13 * dp, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 13 * dp, 0, TAU);
    ctx.stroke();
    const pp = outBack(sub(p, 0.4, 0.8));
    ctx.save();
    ctx.translate(pillCx, -hh + pillH / 2);
    ctx.scale(pp, pp);
    shadowOn(ctx, L, 22, 8);
    ctx.fillStyle = L.bg ? col(L.bg, th) : '#ffffff';
    rr(ctx, -pw / 2, -pillH / 2, pw, pillH, pillH * 0.3);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = accent;
    rr(ctx, -pw / 2, -pillH / 2, 12, pillH, 6);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = tc;
    ctx.font = `800 ${pillH * (L.sub ? 0.32 : 0.4)}px ${font}`;
    ctx.fillText(L.title || 'Önemli nokta', -pw / 2 + 32, L.sub ? -pillH * 0.16 : 2);
    if (L.sub) {
      ctx.fillStyle = col('#8a85a3', th);
      ctx.font = `500 ${pillH * 0.24}px ${font}`;
      ctx.fillText(L.sub, -pw / 2 + 32, pillH * 0.2);
    }
    ctx.restore();
  } else if (kind === 'tepki') {
    const items = (L.lines?.length ? L.lines : ['👍|24', '❤️|18', '😂|9']).map(split);
    ctx.save();
    ctx.globalAlpha *= clamp01(p * 3);
    shadowOn(ctx, L, 24, 8);
    ctx.fillStyle = L.bg ? col(L.bg, th) : '#ffffff';
    rr(ctx, -hw, -hh, W, H, H / 2);
    ctx.fill();
    ctx.restore();
    const cell = W / items.length;
    items.forEach((it, i) => {
      const ip = outBack(sub(p, 0.15 + i * 0.12, 0.5 + i * 0.12));
      const x = -hw + cell * (i + 0.5);
      ctx.save();
      ctx.translate(x, 0);
      ctx.scale(ip, ip);
      ctx.fillStyle = '#f3f0fa';
      rr(ctx, -cell * 0.4, -H * 0.34, cell * 0.8, H * 0.68, H * 0.34);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = tc;
      ctx.font = `${H * 0.38}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.fillText(it[0], -cell * 0.14, 4);
      ctx.font = `800 ${H * 0.26}px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText(it[1] || '', cell * 0.0, 3);
      ctx.restore();
    });
  } else if (kind === 'soru') {
    const R = Math.min(W, H) / 2 * 0.86;
    const e = outBack(sub(p, 0, 0.5));
    ctx.translate(0, -H * 0.04);
    ctx.rotate((p >= 1 ? Math.sin(t * 3) * 0.05 : 0) + (1 - e) * 0.5);
    ctx.scale(e, e);
    ctx.globalAlpha *= clamp01(p * 4);
    ctx.save();
    shadowOn(ctx, L, 26, 10);
    ctx.fillStyle = L.bg ? col(L.bg, th) : accent;
    ctx.beginPath();
    ctx.arc(0, -R * 0.08, R, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(dirX * R * 0.35, R * 0.8);
    ctx.lineTo(dirX * R * 0.95, R * 1.18);
    ctx.lineTo(dirX * R * 0.7, R * 0.4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = L.textColor && L.textColor !== '#2d2a3e' ? tc : '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `800 ${R * 1.15}px ${font}`;
    ctx.fillText(L.icon || '?', 0, -R * 0.04);
  } else if (kind === 'yorum') {
    const e = outBack(sub(p, 0, 0.45));
    ctx.translate(0, (1 - e) * 36);
    ctx.globalAlpha *= clamp01(p * 3);
    ctx.save();
    shadowOn(ctx, L, 30, 10);
    ctx.fillStyle = L.bg ? col(L.bg, th) : '#ffffff';
    rr(ctx, -hw, -hh, W, H, 30);
    ctx.fill();
    ctx.restore();
    const ar = H * 0.14;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-hw + H * 0.24, -hh + H * 0.27, ar, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `800 ${ar * 0.95}px ${font}`;
    ctx.fillText(initials(L.title), -hw + H * 0.24, -hh + H * 0.27 + 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = tc;
    ctx.font = `800 ${H * 0.115}px ${font}`;
    ctx.fillText(L.title || 'Ayşe', -hw + H * 0.46, -hh + H * 0.2);
    ctx.fillStyle = col('#8a85a3', th);
    ctx.font = `500 ${H * 0.085}px ${font}`;
    ctx.fillText(L.sub || '2 sa önce', -hw + H * 0.46, -hh + H * 0.33);
    ctx.fillStyle = tc;
    const fit = fitText(ctx, L.text || 'Çok güzel olmuş, elinize sağlık!', W * 0.86, H * 0.36, fnt('500'), H * 0.13);
    ctx.font = fnt('500')(fit.size);
    putText(ctx, fit, -hw + W * 0.06, -hh + H * 0.6 + (fit.lines.length - 1) * fit.size * 0.6, type, 'left');
    ctx.fillStyle = '#e0584a';
    ctx.font = `${H * 0.12}px system-ui, "Segoe UI Symbol", sans-serif`;
    ctx.fillText('♥', -hw + W * 0.06, hh - H * 0.1);
    ctx.fillStyle = col('#8a85a3', th);
    ctx.font = `700 ${H * 0.095}px ${font}`;
    ctx.fillText(String(L.value || '24'), -hw + W * 0.06 + H * 0.17, hh - H * 0.1 + 2);
  }
  ctx.restore();
  return { x0: -hw, y0: -hh, x1: hw, y1: hh };
}

export const WIDGET2_DRAW = { kart: drawKart, liste: drawListe, kod: drawKod, zaman: drawZaman, balon: drawBalon };
