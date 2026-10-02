// Reels şablonlarının ortak yapı taşları: vuruş ızgarası, renk paletleri, kamera vuruşu, "slam" metin, şekiller, geçişler, kapanış.
//
//   const c = reels(brief, { palet: 'canli', muzik: 'pop-120', font: 'Anton' });
//   c.vurus(n)            → n. vuruşun zamanı (sn);  c.p = bir vuruşun süresi
//   c.slam(id, 'METİN', t0, t1, { y, size, renk, giris })    c.sekil(id, 'daire', x, y, boyut, { renk, t0, t1 })
//   c.kameraVurus([t…], { zoom: 0.05, egim: 1 })             c.arkaplan([{ t, i }]) → background
//   c.bitir2(ad, sure, { ... }) → scene
//
// Tüm hareket saf keyframe / ön ayardır (rastgelelik yok) → önizleme ile MP4 aynıdır.
import { baglam, varlikBoyut, r2, clamp, zarfCikar } from './lib.mjs';

// ─── Ritim parçaları (scripts/gen-ritim.mjs) ─────────────────────────────────
export const MUZIKLER = {
  'pop-120': { file: 'ritim-pop-120.wav', bpm: 120, ad: 'Pop · 120 BPM (neşeli)' },
  'house-126': { file: 'ritim-house-126.wav', bpm: 126, ad: 'House · 126 BPM (dans)' },
  'trap-140': { file: 'ritim-trap-140.wav', bpm: 140, ad: 'Trap · 140 BPM (sert)' },
  'lofi-90': { file: 'ritim-lofi-90.wav', bpm: 90, ad: 'Lo-fi · 90 BPM (sakin)' },
  'hype-132': { file: 'ritim-hype-132.wav', bpm: 132, ad: 'Hype · 132 BPM (enerjik)' },
};
const muzikBul = (m) => {
  if (typeof m === 'string') return MUZIKLER[m] || Object.values(MUZIKLER).find((x) => x.file === m) || { file: m };
  if (m && typeof m === 'object') return { ...(MUZIKLER[m.ad] || {}), ...m };
  return null;
};

// ─── Renk ────────────────────────────────────────────────────────────────────
const hex = (h) => {
  const n = parseInt(String(h).replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const karistir = (a, b, k) => {
  const x = hex(a);
  const y = hex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * k));
};
export const parlaklik = (h) => {
  const [r, g, b] = hex(h);
  return (r * 299 + g * 587 + b * 114) / 1000;
};
export const yaziRengi = (bg, acik = '#ffffff', koyu = '#10101c') => (parlaklik(bg) > 148 ? koyu : acik);

/** Palet: bg = zemin renkleri (her bölümde döner), acc = vurgu renkleri */
export const PALETLER = {
  canli: { ad: 'Canlı (pembe · mavi · sarı)', bg: ['#ff3b6b', '#2f6bff', '#ffc400', '#00c48c', '#7a3cff', '#ff7a1a'], acc: ['#ffffff', '#ffe600', '#10101c', '#00f0ff'] },
  neon: { ad: 'Neon gece', bg: ['#120620', '#0a1a3a', '#25093b', '#06211f', '#2b0719'], acc: ['#ff2e93', '#00e5ff', '#ffe600', '#7cff4f', '#b14dff'] },
  gunbatimi: { ad: 'Gün batımı', bg: ['#ff5a36', '#ff2e63', '#7b2cbf', '#ff9f1c', '#3a0ca3'], acc: ['#fff3b0', '#ffffff', '#10101c', '#ffd60a'] },
  pastel: { ad: 'Pastel', bg: ['#ffd6e0', '#d6e6ff', '#fff1bd', '#d2f5e3', '#e6dcff'], acc: ['#ff5d8f', '#3a6cff', '#ff9500', '#00b386', '#7a4dff'] },
  mono: { ad: 'Mono + sarı', bg: ['#111114', '#f4f4ef', '#ffe500', '#111114', '#ff3b30'], acc: ['#ffe500', '#111114', '#ff3b30', '#ffffff'] },
  okyanus: { ad: 'Okyanus', bg: ['#03396c', '#0077b6', '#00a896', '#023e8a', '#0096c7'], acc: ['#ffd60a', '#ffffff', '#caf0f8', '#ff7b00'] },
  kagit: { ad: 'Defter kâğıdı (pastel)', bg: ['#f7f1e3', '#f5e8d3', '#fbe4df', '#e6f0e4', '#e4eaf6', '#f3e6f5'], acc: ['#f6d58e', '#f7a8a0', '#b9a7e6', '#9fd8c4', '#a9c8f0'] },
  tebesir: { ad: 'Tebeşir tahtası', bg: ['#26323a', '#2b3a32', '#3a2f3f', '#2f3a45', '#3a3a2b', '#2a2f3a'], acc: ['#f6d58e', '#f2a7a0', '#b9a7e6', '#9fd8c4', '#a9c8f0'] },
  toprak: { ad: 'Toprak katmanları (kazı)', bg: ['#a46d3f', '#8c5a34', '#744a2d', '#5d3b27', '#46302a', '#2f2226'], acc: ['#f2d49b', '#ffd166', '#e9a66a', '#9bd1b0', '#f4f1de'] },
  pafta: { ad: 'Mavi pafta (teknik çizim)', bg: ['#0f3a7a', '#0d3470', '#0f3f82', '#0b2f66', '#10407f', '#0c3169'], acc: ['#ffffff', '#9fd8ff', '#ffd166', '#ff7b72', '#7ee0b5'] },
  sinema: { ad: 'Sinema (sepyadan renge)', bg: ['#cdb98f', '#c9b995', '#c2b79c', '#b7bfa8', '#a9c3b4', '#9fcad0'], acc: ['#f2e8cf', '#e8c07d', '#d8604a', '#6aa0a8', '#2f3e46'] },
  metro: { ad: 'Metro hattı (açık zemin)', bg: ['#f7f5ef', '#f4f2ea', '#f6f3ec', '#f3f1e9', '#f7f4ee', '#f4f2eb'], acc: ['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#8d5cf6', '#ef476f'] },
  oyun: { ad: 'Oyun (8-bit)', bg: ['#5c94fc', '#1b1b52', '#fc9838', '#3cbcfc', '#0b0b3b', '#5c94fc'], acc: ['#fcfc00', '#e40058', '#00a800', '#ffffff', '#f87858'] },
  dergi: { ad: 'Dergi (krem + canlı blok)', bg: ['#e4572e', '#2e86ab', '#f2a900', '#2b9348', '#7b2cbf', '#d62839'], acc: ['#f4efe6', '#16161a', '#ffffff', '#ffd9a0'] },
  retro: { ad: 'Retro dalga (synthwave)', bg: ['#0d0221', '#14053a', '#0b0a3a', '#1a0536', '#0e0430', '#160845'], acc: ['#ff4fd8', '#00f0ff', '#ffe600', '#7cff4f', '#b14dff'] },
  mantar: { ad: 'Mantar pano (post-it renkleri)', bg: ['#b98a5b', '#c0925f', '#b4835a', '#bb8c5d', '#b88858', '#c2935f'], acc: ['#ffe27a', '#ffb3c1', '#9fe0c4', '#a9c8f0', '#d7b8f5'] },
  galeri: { ad: 'Müze galerisi (koyu + altın)', bg: ['#10252b', '#1c2b36', '#2a2233', '#1f2d29', '#2b2530', '#22262f'], acc: ['#d9b66f', '#e8cf9c', '#c98b6b', '#9fc7b6', '#b9a7e6'] },
  gunyolu: { ad: 'Gün yolu (şafaktan geceye)', bg: ['#ffd9b0', '#ffbf9b', '#f4a3b5', '#a98be0', '#5f5fc4', '#262a6b'], acc: ['#ffffff', '#ffe9a8', '#ff8fa3', '#9fd8c4', '#a9c8f0'] },
  yukselis: { ad: 'Yükseliş (şafaktan uzaya)', bg: ['#ffc89e', '#ff9a9e', '#c77dd8', '#6a4fc7', '#2b2a7a', '#0b0d2e'], acc: ['#fff3b0', '#ffd166', '#ff8fa3', '#8be9fd', '#ffffff'] },
  orman: { ad: 'Orman', bg: ['#0b3d2e', '#14532d', '#f2e8cf', '#1b4332', '#386641'], acc: ['#ffd166', '#f2e8cf', '#ef476f', '#ffffff'] },
};

// ─── Yazı genişlik katsayıları (büyük harfle yaklaşık) ───────────────────────
const FONT_K = {
  Caveat: 0.52, 'Patrick Hand': 0.5, Kalam: 0.54, Mali: 0.52, Quicksand: 0.56, Pacifico: 0.6, 'Dancing Script': 0.46, Comfortaa: 0.62, Anton: 0.56, 'Bebas Neue': 0.42, 'Archivo Black': 0.8, Bungee: 0.84, Oswald: 0.5, 'Russo One': 0.72, Rubik: 0.7, Sora: 0.74, Outfit: 0.62,
  Montserrat: 0.78, 'Playfair Display': 0.6, 'Abril Fatface': 0.64, Fraunces: 0.6, Lora: 0.56, 'JetBrains Mono': 0.62, Righteous: 0.66, Raleway: 0.66, Manrope: 0.66, Poppins: 0.72, 'Space Mono': 0.62, 'Baloo 2': 0.62, Lexend: 0.68, Urbanist: 0.62, 'DM Serif Display': 0.6,
};
export const FONTLAR = Object.keys(FONT_K).sort((a, b) => a.localeCompare(b));
// Ölçülü genişlik tablosu (tarayıcıda canvas measureText, 700 ağırlık, 100px): [küçük harf, BÜYÜK harf, rakam] ortalama ileri-genişlik / em.
const FONT_W = {"Caveat":[0.337,0.461,0.449],"Patrick Hand":[0.358,0.42,0.422],"Kalam":[0.442,0.537,0.511],"Mali":[0.508,0.621,0.585],"Quicksand":[0.48,0.56,0.549],"Pacifico":[0.42,0.703,0.518],"Dancing Script":[0.368,0.556,0.54],"Comfortaa":[0.518,0.616,0.573],"Anton":[0.399,0.412,0.478],"Bebas Neue":[0.34,0.34,0.4],"Archivo Black":[0.545,0.668,0.667],"Bungee":[0.635,0.635,0.668],"Oswald":[0.408,0.475,0.503],"Russo One":[0.507,0.605,0.602],"Rubik":[0.489,0.579,0.636],"Sora":[0.509,0.616,0.642],"Outfit":[0.452,0.569,0.557],"Montserrat":[0.522,0.628,0.609],"Playfair Display":[0.464,0.587,0.516],"Abril Fatface":[0.462,0.572,0.571],"Fraunces":[0.501,0.641,0.619],"Lora":[0.479,0.597,0.541],"JetBrains Mono":[0.6,0.6,0.6],"Righteous":[0.459,0.555,0.57],"Raleway":[0.473,0.57,0.572],"Manrope":[0.47,0.556,0.586],"Poppins":[0.512,0.569,0.597],"Space Mono":[0.612,0.612,0.612],"Baloo 2":[0.443,0.517,0.528],"Lexend":[0.512,0.636,0.594],"Urbanist":[0.444,0.542,0.536],"DM Serif Display":[0.443,0.524,0.504],"Nunito":[0.46,0.584,0.6],"M PLUS Rounded 1c":[0.486,0.565,0.64],"Courgette":[0.444,0.529,0.527]};
/** Metin genişliği (px) — ölçülü tablo + harf aralığı (letterSpacing: engine'deki gibi size/100 çarpanlı) */
export const metinGenisligi = (text, font, size, upper = false, harf = 0, weight = 700) => {
  const [kl, ku, kd] = FONT_W[font] || [0.55, 0.66, 0.62];
  const en = Math.max(0, ...String(text).split('\n').map((l) => {
    const L = upper ? l.toLocaleUpperCase('tr') : l;
    return [...L].reduce((sum, ch) => sum + (/[0-9]/.test(ch) ? kd : upper || ch !== ch.toLocaleLowerCase('tr') ? ku : kl) + harf / 100, 0);
  }));
  // güvenlik payı: tablo ortalama harf dağılımına göre; geniş harfli metinler ve ağır ağırlık için
  return en * size * 1.07 * (weight >= 800 ? 1.06 : 1);
};
/** maxW'a sığan en büyük punto (en çok `taban`) */
export const sigdirFont = (text, font, maxW, taban, upper = true, harf = 0, weight = 700) => {
  const w1 = metinGenisligi(text, font, 1, upper, harf, weight);
  return Math.max(8, Math.round(Math.min(taban, maxW / Math.max(w1, 0.01))));
};

/** Metni en çok `maks` karakterlik satırlara böler */
export const sarMetin = (text, maks) => {
  const out = [];
  let cur = '';
  for (const w of String(text ?? '').split(/\s+/).filter(Boolean)) {
    if (cur && (cur + ' ' + w).length > maks) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out.join('\n');
};

/** "Düz *vurgulu* kelime" → [{ s: 'Düz', v: false }, { s: 'vurgulu', v: true }, …] */
export function kelimeler(metin) {
  const out = [];
  for (const parca of String(metin ?? '').split(/(\*[^*]+\*)/)) {
    if (!parca) continue;
    const v = parca.startsWith('*') && parca.endsWith('*') && parca.length > 2;
    const t = v ? parca.slice(1, -1) : parca;
    for (const w of t.split(/\s+/).filter(Boolean)) out.push({ s: w, v });
  }
  return out;
}

export function reels(brief, d = {}) {
  // Şablonlar dikey tasarlanır: 9:16 ya da 4:5 doğrudan; kare / yatay istenirse 9:16 üretilir, `scene.formats` (sığdır) ile dışa aktarılır.
  const c = baglam({ ...brief, format: brief.format === 'dikey45' ? 'dikey45' : 'reels' }, { stil: d.stil ?? 'duz', tema: d.tema ?? 'gece' });
  const { W, H } = c;
  const { L, k } = c;
  const m = c.m;

  // ── palet ───────────────────────────────────────────────────────────────
  const baz = PALETLER[brief.palet] || PALETLER[d.palet] || PALETLER.canli;
  const pal = { bg: [...baz.bg], acc: [...baz.acc] };
  if (Array.isArray(brief.renkler) && brief.renkler.length) pal.bg = brief.renkler.filter((x) => /^#[0-9a-f]{6}$/i.test(x));
  if (/^#[0-9a-f]{6}$/i.test(brief.vurgu || '')) pal.acc = [brief.vurgu, ...pal.acc];
  c.pal = pal;
  c.zemin = (i) => pal.bg[((i % pal.bg.length) + pal.bg.length) % pal.bg.length];
  c.yazi = (i) => yaziRengi(c.zemin(i));
  /** i. zemin rengine en iyi okunan vurgu rengi */
  c.vurgu = (i) => {
    const bg = c.zemin(i);
    const fark = (a) => Math.abs(parlaklik(a) - parlaklik(bg));
    const sirali = [...pal.acc].sort((a, b) => fark(b) - fark(a));
    const iyi = sirali.filter((a) => fark(a) > 90);
    const liste = (iyi.length ? iyi : sirali).slice(0, 3);
    return liste[i % liste.length];
  };
  c.tema = {
    name: baz.ad,
    paper: 'mat',
    colors: { arka1: c.zemin(0), arka2: c.zemin(1), baslik: c.yazi(0), metin: c.yazi(0), vurgu: c.vurgu(0) },
    background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 160 },
    vignette: 0.1,
  };
  c.font = brief.font || d.font || 'Anton';
  c.govde = d.govde || 'Outfit';

  // ── ritim ───────────────────────────────────────────────────────────────
  const muzik = brief.muzik === false ? null : muzikBul(brief.muzik ?? d.muzik ?? 'pop-120');
  c.bpm = (muzik && muzik.bpm) || brief.bpm || 120;
  c.off = (muzik && muzik.beatOffset) ?? brief.beatOffset ?? 0;
  c.p = 60 / c.bpm;
  c.vurus = (n) => r2(c.off + n * c.p);
  c.olc = (n) => c.vurus(n * 4);
  c.muzikDosya = muzik;

  // ── arka plan: zaman çizgisinde renk değişimi ───────────────────────────
  c.arkaplan = (parcalar, o = {}) => {
    const a = [];
    const b = [];
    parcalar.forEach((s, j) => {
      const bg = s.bg || c.zemin(s.i ?? j);
      const bg2 = s.bg2 || (parlaklik(bg) > 148 ? karistir(bg, '#000000', 0.14) : karistir(bg, '#000000', 0.38));
      a.push(k(s.t, bg, j ? 'step' : undefined));
      b.push(k(s.t, bg2, j ? 'step' : undefined));
    });
    return { type: 'linear', colors: [a, b], angle: o.aci ?? 165, paper: 0, vignette: o.vinyet ?? 0.12 };
  };

  // ── kamera: her vuruşta zoom darbesi + hafif eğim ───────────────────────
  c.kameraVurus = (zamanlar, o = {}) => {
    const z = o.zoom ?? 0.045;
    const tilt = o.egim ?? 0;
    const zoom = [k(0, 1)];
    const rot = [k(0, 0)];
    let son = 0;
    zamanlar.forEach((t, i) => {
      if (t < son + 0.12) return;
      const sonraki = zamanlar[i + 1] ?? t + c.p;
      const hold = Math.min(c.p * 0.85, sonraki - t - 0.04);
      if (hold < 0.15) return;
      zoom.push(k(t, 1 + z * 0.35), k(t + 0.07, 1 + z, 'outCubic'), k(t + hold, 1, 'inOutSine'));
      if (tilt) {
        const y = i % 2 ? -tilt : tilt;
        rot.push(k(t, 0), k(t + 0.07, y, 'outCubic'), k(t + hold, 0, 'inOutSine'));
      }
      son = t + hold;
    });
    const out = { zoom, x: W / 2, y: H / 2 };
    if (tilt) out.rotation = rot;
    return out;
  };

  // ── şekil (kütüphane "sekiller") ────────────────────────────────────────
  c.sekil = (id, asset, x, y, boyut, o = {}) => {
    const [w, h] = varlikBoyut(asset);
    const sc = boyut / Math.max(w, h);
    const t0 = o.t0 ?? 0;
    const giris = o.giris ?? 'pop';
    const d0 = o.sure ?? 0.28;
    const scale = giris === 'pop' ? [k(t0, 0), k(t0 + d0, r2(sc), 'outBack')] : giris === 'zip' ? [k(t0, r2(sc * 1.6)), k(t0 + d0, r2(sc), 'outCubic')] : r2(sc);
    return L({
      id, ...(o.grup ? { group: o.grup } : {}), asset, x: Math.round(x), y: Math.round(y), scale,
      ...(o.sx != null ? { scaleX: o.sx } : {}), ...(o.sy != null ? { scaleY: o.sy } : {}),
      ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}),
      palette: { a: o.renk || '$vurgu' }, start: r2(t0), ...(o.t1 != null ? { end: r2(o.t1) } : {}),
      ...(o.depth != null ? { depth: o.depth } : {}), ...(o.blur ? { blur: o.blur } : {}),
      ...(o.anims ? { anims: o.anims } : {}), ...(o.extra || {}),
    });
  };

  /** Vuruşta dışa yayılan halka (ses dalgası hissi) */
  c.halka = (id, t0, x, y, renk, o = {}) => {
    const dur = o.sure ?? 0.7;
    const bas = o.boyut ?? m * 0.25;
    const son = o.son ?? m * 1.5;
    const [w] = varlikBoyut('halka');
    return L({
      id, asset: 'halka', x: Math.round(x), y: Math.round(y), palette: { a: renk }, start: r2(t0), end: r2(t0 + dur),
      scale: [k(t0, r2(bas / w)), k(t0 + dur, r2(son / w), 'outCubic')],
      opacity: [k(t0, o.alfa ?? 0.55), k(t0 + dur, 0, 'linear')],
      ...(o.group ? { group: o.group } : {}),
    });
  };

  /** Beyaz flaş (kesme anında) */
  c.flas = (id, t0, o = {}) =>
    L({
      id, asset: 'kare', x: W / 2, y: H / 2, scale: r2(Math.max(W, H) * 1.3 / 200), palette: { a: o.renk || '#ffffff' },
      start: r2(t0), end: r2(t0 + 0.2), opacity: [k(t0, o.alfa ?? 0.7), k(t0 + (o.sure ?? 0.18), 0, 'outQuad')],
    });

  /** Şerit silme: ekranı soldan sağa süpüren renkli panel; kesme anı t'de ekran tamamen kapalı */
  c.silme = (id, t, renk, o = {}) => {
    const dur = o.sure ?? 0.5;
    const gen = W * 1.35;
    const sx = r2(gen / 200);
    const sy = r2((H * 1.2) / 200);
    const yon = o.yon === 'sag' ? -1 : 1;
    return L({
      id, asset: 'kare', x: [k(t - dur / 2, yon > 0 ? -gen / 2 : W + gen / 2), k(t + dur / 2, yon > 0 ? W + gen / 2 : -gen / 2, 'inOutCubic')],
      y: H / 2, scale: 1, scaleX: sx, scaleY: sy, palette: { a: renk }, start: r2(t - dur / 2), end: r2(t + dur / 2),
    });
  };

  // ── metin ───────────────────────────────────────────────────────────────
  /**
   * Vuruşa çarpan metin. giris: 'slam' (büyükten çarpar) | 'sol' | 'sag' | 'asagi' | 'yukari' | 'pop' | 'don'
   * o: x, y, size (üst sınır), maxW, renk, font, weight, stroke, golge, kutu, lh, upper, rot, giris, nabiz, cikis, grup
   */
  c.slam = (id, text, t0, t1, o = {}) => {
    const font = o.font || c.font;
    const upper = o.upper !== false;
    const maxW = o.maxW ?? W * 0.88;
    const satir = o.sar ? sarMetin(text, o.sar) : String(text);
    const size = o.size && o.sabit ? o.size : sigdirFont(satir, font, maxW, o.size ?? 240, upper);
    const x = o.x ?? W / 2;
    const y = o.y ?? H / 2;
    const giris = o.giris || 'slam';
    const dz = 0.2;
    const kx = giris === 'sol' ? [k(t0, x - W * 0.75), k(t0 + dz, x, 'outCubic')] : giris === 'sag' ? [k(t0, x + W * 0.75), k(t0 + dz, x, 'outCubic')] : x;
    const ky = giris === 'asagi' ? [k(t0, y - H * 0.18), k(t0 + dz, y, 'outBack')] : giris === 'yukari' ? [k(t0, y + H * 0.18), k(t0 + dz, y, 'outBack')] : y;
    const ks = giris === 'slam' ? [k(t0, o.from ?? 2.1), k(t0 + 0.15, 1, 'outCubic')] : giris === 'pop' ? [k(t0, 0), k(t0 + 0.3, 1, 'outBack')] : giris === 'don' ? [k(t0, 0.2), k(t0 + 0.32, 1, 'outBack')] : 1;
    const kr = giris === 'don' ? [k(t0, o.rot != null ? o.rot - 140 : -140), k(t0 + 0.32, o.rot ?? 0, 'outCubic')] : o.rot != null ? (giris === 'slam' ? [k(t0, o.rot * 2.2), k(t0 + 0.22, o.rot, 'outBack')] : o.rot) : 0;
    const renk = o.renk || '$baslik';
    const golgeRenk = o.golgeRenk || 'rgba(0,0,0,0.28)';
    return L({
      id, ...(o.grup ? { group: o.grup } : {}), type: 'text', text: satir, font, weight: o.weight ?? (font === 'Outfit' || font === 'Sora' || font === 'Poppins' || font === 'Montserrat' || font === 'Lexend' || font === 'Rubik' ? 800 : 400),
      color: renk, x: Array.isArray(kx) ? kx : Math.round(kx), y: ky, size, align: o.align || 'center', lineHeight: o.lh ?? 1.0, uppercase: upper,
      letterSpacing: o.harf ?? (upper ? 2 : 0), start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
      ...(o.stroke ? { stroke: o.stroke } : {}),
      shadow: o.golge === false ? undefined : { color: golgeRenk, blur: 0, x: 0, y: Math.round(size * 0.035) },
      ...(o.kutu ? { box: o.kutu } : {}),
      opacity: giris === 'pop' ? 1 : [k(t0, 0), k(t0 + 0.035, 1, 'linear')],
      scale: ks, rotation: kr,
      ...(o.nabiz || o.anims ? { anims: [...(o.nabiz ? [{ preset: 'ritimle-nabiz', t: t0 + 0.3, genlik: o.nabiz }] : []), ...(o.anims || [])] } : {}),
      ...(o.textAnims ? { textAnims: o.textAnims } : {}),
      ...(o.extra || {}),
    });
  };

  /** Hap (chip): kutulu kısa etiket, pop ile gelir */
  c.hap = (id, text, t0, t1, x, y, o = {}) => {
    const font = o.font || c.govde;
    const size = o.size ?? Math.round(m * 0.044);
    return c.slam(id, text, t0, t1, {
      ...o, x, y, font, size, sabit: true, giris: o.giris || 'pop', upper: o.upper ?? true, weight: o.weight ?? 800, golge: false,
      kutu: { color: o.zemin || '$vurgu', radius: 999, padding: [size * 0.42, size * 0.9], shadow: false },
      renk: o.renk || '#10101c', harf: 2,
    });
  };

  /** Sayaç metni: from → to (sayarak). count/counter alanları motor tarafından çözülür */
  c.sayac = (id, from, to, t0, sure, o = {}) => {
    const font = o.font || c.font;
    const metin = `${o.prefix ?? ''}${to}${o.suffix ?? ''}`;
    const size = o.size ? Math.min(o.size, sigdirFont(metin, font, o.maxW ?? W * 0.88, o.size, true)) : sigdirFont(metin, font, o.maxW ?? W * 0.88, 420, true);
    return L({
      id, ...(o.grup ? { group: o.grup } : {}), type: 'text', text: metin, font, weight: o.weight ?? 400, color: o.renk || '$baslik',
      x: o.x ?? W / 2, y: o.y ?? H / 2, size, align: 'center', lineHeight: 1, start: r2(t0), ...(o.t1 != null ? { end: r2(o.t1) } : {}),
      count: { from, to, decimals: o.ondalik ?? 0, prefix: o.prefix ?? '', suffix: o.suffix ?? '', ...(o.sep !== undefined ? { sep: o.sep } : {}) },
      counter: [k(t0, 0), k(t0 + sure, 1, 'outCubic')],
      scale: [k(t0, 1.5), k(t0 + 0.18, 1, 'outCubic')], opacity: [k(t0, 0), k(t0 + 0.04, 1, 'linear')],
      ...(o.stroke ? { stroke: o.stroke } : {}),
      shadow: { color: 'rgba(0,0,0,0.28)', blur: 0, x: 0, y: Math.round(size * 0.03) },
      ...(o.anims ? { anims: o.anims } : {}),
    });
  };

  /** Çıkartma / damga: patlama şekli üstünde kısa yazı, dönerek pop */
  c.damga = (id, text, t0, t1, x, y, boyut, o = {}) => {
    const g = o.grup;
    c.sekil(`${id}-s`, 'patlama', x, y, boyut, {
      t0, t1, renk: o.zemin || '$vurgu', grup: g, rot: o.rot ?? -8,
      anims: [{ preset: 'nabiz', t: t0 + 0.4, genlik: 0.04, periyot: c.p * 2 }],
      extra: { rotation: [k(t0, -50), k(t0 + 0.4, o.rot ?? -8, 'outBack')] },
    });
    return c.slam(`${id}-t`, text, t0 + 0.04, t1, {
      x, y, size: boyut * 0.34, maxW: boyut * 0.7, giris: 'pop', renk: o.renk || '#10101c', font: o.font || c.font, golge: false, rot: o.rot ?? -8, grup: g, sar: o.sar,
    });
  };

  /** Üst ilerleme çubuğu (ince şerit) */
  c.ilerleme = (t0, t1, o = {}) => {
    const y = o.y ?? Math.round(H * 0.075);
    const gen = Math.round(W * 0.84);
    const x0 = Math.round((W - gen) / 2);
    c.sekil('ilerleme-iz', 'kare', x0 + gen / 2, y, 200, { sx: gen / 200, sy: 0.05, renk: '#ffffff', opacity: 0.22, giris: 'yok', t0, t1, grup: o.grup });
    return L({
      id: 'ilerleme', ...(o.grup ? { group: o.grup } : {}), asset: 'kare', x: x0, y, scale: 1, scaleX: [k(t0, 0), k(t1, gen / 200, 'linear')], scaleY: 0.05,
      anchor: [0, 0.5], palette: { a: o.renk || '#ffffff' }, start: r2(t0), end: r2(t1),
    });
  };

  /** Vuruş noktaları: n nokta, aktif olan vurguda (sıralama / adım göstergesi) */
  c.noktalar = (id, n, aktifZamanlari, bitis, o = {}) => {
    const y = o.y ?? Math.round(H * 0.075);
    const aralik = Math.round(m * 0.075);
    const x0 = W / 2 - ((n - 1) * aralik) / 2;
    for (let i = 0; i < n; i++) {
      const [a, b] = aktifZamanlari[i];
      c.sekil(`${id}-${i + 1}`, 'daire', x0 + i * aralik, y, 1, {
        giris: 'yok', t0: aktifZamanlari[0][0], t1: bitis, renk: '#ffffff', grup: o.grup,
        extra: { scale: [k(aktifZamanlari[0][0], 0.12), k(a, 0.12, 'step'), k(a + 0.2, 0.24, 'outBack'), k(b, 0.24, 'step'), k(b + 0.01, 0.12, 'step')], opacity: [k(aktifZamanlari[0][0], 0.35), k(a, 1, 'step'), k(b, 0.55, 'step')] },
      });
    }
  };

  /** Dekor (arka plan şekilleri). tip: patlama | halkalar | seritler | daireler | izgara */
  c.dekor = (tip, a, b, renk, o = {}) => {
    const g = o.grup;
    const al = o.alfa ?? 0.2;
    const id = o.id || `dekor-${tip}-${Math.round(a * 100)}`;
    if (tip === 'patlama') {
      c.sekil(id, 'patlama', W / 2, H * 0.5, m * 1.7, {
        t0: a, t1: b, renk, opacity: al, grup: g, giris: 'pop', sure: 0.5,
        extra: { rotation: [k(a, 0), k(b, 70, 'linear')], depth: 0.4 },
      });
    } else if (tip === 'halkalar') {
      [0.7, 1.15, 1.6].forEach((f, i) => c.sekil(`${id}-${i}`, 'halka', W / 2, H * 0.5, m * f, {
        t0: a + i * 0.06, t1: b, renk, opacity: al * (1 - i * 0.2), grup: g, giris: 'pop', sure: 0.4,
        anims: [{ preset: 'ritimle-nabiz', t: a + 0.4, genlik: 0.05 + i * 0.015 }],
      }));
    } else if (tip === 'seritler') {
      [-0.26, 0, 0.26].forEach((f, i) => c.sekil(`${id}-${i}`, 'kare', W / 2, H * (0.5 + f), 200, {
        sx: (W * 1.6) / 200, sy: 0.9 + i * 0.25, rot: -18, t0: a, t1: b, renk, opacity: al * (i === 1 ? 1.3 : 0.8), grup: g, giris: 'yok',
        extra: { x: [k(a, W / 2 + (i % 2 ? 120 : -120)), k(b, W / 2 + (i % 2 ? -120 : 120), 'linear')] },
      }));
    } else if (tip === 'daireler') {
      [[0.12, 0.2, 0.55], [0.9, 0.82, 0.7], [0.88, 0.16, 0.28]].forEach(([fx, fy, f], i) => c.sekil(`${id}-${i}`, 'daire', W * fx, H * fy, m * f, {
        t0: a, t1: b, renk, opacity: al, grup: g, giris: 'pop', sure: 0.45, depth: 0.3 + i * 0.2,
        anims: [{ preset: 'nefes', t: a + 0.5, genlik: 0.05, periyot: c.p * 4 }],
      }));
    } else if (tip === 'elmaslar') {
      [[0.15, 0.25, 0.28, 20], [0.85, 0.7, 0.4, -15], [0.2, 0.82, 0.2, 40]].forEach(([fx, fy, f, r], i) => c.sekil(`${id}-${i}`, 'elmas', W * fx, H * fy, m * f, {
        t0: a, t1: b, renk, opacity: al, grup: g, giris: 'pop', rot: r, depth: 0.4,
        extra: { rotation: [k(a, r), k(b, r + 90, 'linear')] },
      }));
    }
  };

  /**
   * Kelime yığını: metindeki kelimeler her vuruşta alt alta çarpar (kısa kelimeler yan yana paketlenir).
   * `*vurgulu*` kelime kutulu vurgu olur. Dönüş: { beats, t0, t1, vuruslar[] }.
   * o: i (renk indeksi), grup, y (merkez, 0..1 H oranı), yuk (yığın yüksekliği, H oranı), hizli (kelime başına vuruş), sure (vuruş; varsayılan otomatik), dekor
   */
  c.yigin = (pre, metin, b0, o = {}) => {
    const kel = kelimeler(metin);
    const birim = [];
    for (const w of kel) {
      const son = birim[birim.length - 1];
      if (son && son.v === w.v && son.n < 2 && (son.s + ' ' + w.s).length <= 11) {
        son.s += ' ' + w.s;
        son.n++;
      } else birim.push({ s: w.s, v: w.v, n: 1 });
    }
    const vp = o.vp || 1;
    const beats = o.sure ?? Math.max(4, Math.ceil((birim.length * vp + 1) / 2) * 2);
    const a = c.vurus(b0);
    const e = c.vurus(b0 + beats);
    const i = o.i ?? 0;
    const g = o.grup;
    const yaz = o.renk || c.yazi(i);
    const vur = o.vurgu || c.vurgu(i);
    if (o.dekor) c.dekor(o.dekor, a, e, vur, { grup: g, id: `${pre}-dekor`, alfa: parlaklik(c.zemin(i)) < 148 ? 0.18 : 0.22 });
    const rowH = Math.min((H * (o.yuk ?? 0.58)) / birim.length, o.satirMaks ?? 560);
    const top = H * (o.y ?? 0.46) - (rowH * birim.length) / 2;
    const GIRIS = ['slam', 'sol', 'sag', 'slam', 'asagi', 'don'];
    const vuruslar = [];
    birim.forEach((w, j) => {
      const t0 = c.vurus(b0 + j * vp);
      vuruslar.push(t0);
      const y = top + rowH * (j + 0.5);
      const cap = rowH * (w.n > 1 ? 0.8 : 0.95);
      const size = Math.min(sigdirFont(w.s, c.font, W * 0.86, cap, true), 600);
      const rot = w.v ? -3 : (j % 2 ? -1 : 1) * (1 + (j % 3)) * 0.9;
      c.slam(`${pre}-w${j + 1}`, w.s, t0, e, {
        y, size, sabit: true, grup: g, giris: w.v ? 'slam' : GIRIS[(i + j) % GIRIS.length], rot,
        renk: w.v ? yaziRengi(vur) : yaz, nabiz: w.v ? 0.04 : 0.02,
        ...(w.v ? { kutu: { color: vur, radius: size * 0.14, padding: [size * 0.04, size * 0.2], shadow: false }, golge: false } : {}),
      });
      c.halka(`${pre}-h${j + 1}`, t0, W / 2, y, w.v ? vur : yaz, { group: g, alfa: 0.4, boyut: size * 0.4, son: size * 2.8, sure: 0.55 });
    });
    return { beats, t0: a, t1: e, vuruslar };
  };

  /** Takip bloğu: Instagram + YouTube logoları ve hesap adı pilleri (varsayılan @nasilldegisti). y = merkez (H oranı) */
  c.hesap = brief.hesap || '@nasilldegisti';
  c.takip = (t0, t1, o = {}) => {
    const g = o.grup;
    const y = H * (o.y ?? 0.64);
    const bs = m * 0.17;
    const dx = W * 0.2;
    // Instagram: pembe daire rozet + beyaz simge
    c.sekil('takip-ig-zemin', 'daire', W / 2 - dx, y, bs * 1.05, { t0: t0 + 0.1, t1, renk: '#d62976', grup: g, anims: [{ preset: 'ritimle-nabiz', t: t0 + 0.8, genlik: 0.07 }] });
    c.sekil('takip-ig', 'instagram-logo', W / 2 - dx, y, bs * 0.62, { t0: t0 + 0.15, t1, renk: '#ffffff', grup: g, anims: [{ preset: 'ritimle-nabiz', t: t0 + 0.8, genlik: 0.07 }] });
    c.sekil('takip-yt', 'youtube-logo', W / 2 + dx, y, bs * 1.15, { t0: t0 + 0.3, t1, renk: '#ff0000', grup: g, anims: [{ preset: 'ritimle-nabiz', t: t0 + 1.1, genlik: 0.07 }] });
    c.halka('takip-h1', t0 + 0.1, W / 2 - dx, y, '#d62976', { group: g, alfa: 0.5, boyut: bs * 0.5, son: bs * 1.8, sure: 0.6 });
    c.halka('takip-h2', t0 + 0.3, W / 2 + dx, y, '#ff0000', { group: g, alfa: 0.5, boyut: bs * 0.5, son: bs * 1.8, sure: 0.6 });
    c.hap('takip-hesap', c.hesap, t0 + 0.6, t1, W / 2, y + bs * 0.95, { grup: g, zemin: '#10101c', renk: '#ffffff', size: Math.round(m * 0.058), nabiz: 0.03, upper: false });
  };

  /**
   * Kapanış (çağrı): son bölümün tamamı. cta = ana mesaj, alt = küçük mesaj (ör. @kullanıcı), ikon: kalp | ok | yok
   */
  c.kapanis = (t0, t1, cta, alt, o = {}) => {
    const g = c.grup('g-kapanis', 'Kapanış', true);
    const renk = o.renk || c.yazi(o.i ?? 0);
    const vur = o.vurgu || c.vurgu(o.i ?? 0);
    c.bolum(t0, 'Kapanış');
    c.flas('kapanis-flas', t0, { alfa: 0.6 });
    c.dekor(o.dekor || 'patlama', t0, t1, vur, { grup: g, alfa: 0.22 });
    c.slam('kapanis-cta', cta || 'Takip et!', t0 + 0.05, t1, {
      y: H * 0.42, size: 320, maxW: W * 0.88, renk, sar: 12, grup: g, stroke: o.stroke, nabiz: 0.035, lh: 0.95,
    });
    c.sekil('kapanis-alt-cizgi', 'kare', W / 2, H * 0.54, 200, {
      sx: [k(t0 + 0.3, 0), k(t0 + 0.7, (W * 0.5) / 200, 'outCubic')], sy: 0.05, t0: t0 + 0.3, t1, renk: vur, giris: 'yok', grup: g,
    });
    if (o.takip !== false && brief.takip !== false) c.takip(t0 + 0.5, t1, { grup: g, y: 0.65 });
    else {
      if (alt) c.hap('kapanis-alt', alt, t0 + 0.5, t1, W / 2, H * 0.6, { zemin: vur, renk: yaziRengi(vur), grup: g, size: Math.round(m * 0.05), nabiz: 0.03 });
      if (o.ikon !== 'yok') {
        const ikon = o.ikon === 'ok' ? 'ok-yukari' : 'kalp';
        c.sekil('kapanis-ikon', ikon, W / 2, H * 0.74, m * 0.2, {
          t0: t0 + 0.8, t1, renk: ikon === 'kalp' ? '#ff3b5c' : vur, grup: g, sure: 0.4,
          anims: [{ preset: ikon === 'kalp' ? 'ritimle-nabiz' : 'seksek', t: t0 + 1.3, ...(ikon === 'kalp' ? { genlik: 0.16 } : { yukseklik: 26, periyot: c.p }) }],
        });
      }
    }
    c.L({ id: 'kapanis-konfeti', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: Math.round(H * 0.4), start: r2(t0 + 0.15), end: r2(t1) });
    c.L({ id: 'kapanis-yildiz', group: g, type: 'particles', particle: 'yildiz-yagmuru', mode: 'surekli', start: r2(t0 + 0.8), end: r2(t1), opacity: 0.8 });
  };

  /** Sahneyi tamamlar: ses (süreye kırpılmış zarf), kamera, arka plan */
  c.bitir2 = (ad, sure, ek = {}) => {
    if (muzik) {
      const tr = { file: muzik.file, start: 0, volume: brief.ses ?? 0.85, fadeIn: 0.05, fadeOut: 1.4, dur: r2(sure), bpm: c.bpm, beatOffset: c.off };
      const env = zarfCikar(muzik.file);
      if (env) {
        const n = Math.ceil(sure * env.fps) * env.bands;
        tr.env = { ...env, data: env.data.slice(0, n) };
      }
      c.audio = [tr];
    }
    const sc = c.bitir(ad, sure, ek);
    sc.theme = c.tema;
    return sc;
  };

  return c;
}
