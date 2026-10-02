// "Kıpır Reels" — uzun ders videolarını YouTube kanalına çeken 3 kısa dikey video (1080×1920, ~30 sn).
//   Önce: node scripts/seed-oynat-dugmesi.mjs     (oynat düğmesi modeli)
//   Ses:  scripts/reels-kipir-satirlar.json → npm run seslendir -- --proje <id> --satirlar … --ad <id>-ses --ses-id d2-00091
//   Sahne: node scripts/scenes-reels-kipir.mjs [reels-gunes-bakma|reels-ay-yuz|reels-109-dunya]   (verilmezse üçü de)
// Konsept: "Gece Defteri" — koyu çivit kâğıt üstüne pastel boya çizim; dev kanca yazısı, tek fikir, son 6 sn'de
//   oynat düğmeli "videonun tamamı YouTube'da" kartı. Anlatıcı Kıpır (gozlu) — konuşma balonu = altyazı.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { karakterBaglam } from './lib/karakter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1080, H = 1920, FPS = 30;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const SATIRLAR = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'reels-kipir-satirlar.json'), 'utf8'));

const INK = '#2a2760', CREAM = '#fff3c4', CORAL = '#ff7f6e', BUTTER = '#ffd84d', MINT = '#9be0c8', SKY = '#a9d6f5', LILAC = '#c9b8f5', PINK = '#ffc2d4', RED = '#ff3b30';
const F_BASLIK = 'M PLUS Rounded 1c', F_GOVDE = 'Nunito', F_EL = 'Courgette';

function wavSure(file) {
  try {
    const b = fs.readFileSync(file);
    let p = 12, byteRate = 0;
    while (p + 8 <= b.length) {
      const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4);
      if (id === 'fmt ') byteRate = b.readUInt32LE(p + 16);
      if (id === 'data') return (sz > b.length ? b.length - p - 8 : sz) / byteRate;
      p += 8 + sz + (sz % 2);
    }
  } catch { /* dosya yok */ }
  return null;
}
const sizeCache = {};
const SIZE = (asset) => {
  if (sizeCache[asset]) return sizeCache[asset];
  const lib = path.join(ROOT, 'data', 'library');
  for (const kat of fs.readdirSync(lib)) {
    const f = path.join(lib, kat, `${asset}.json`);
    if (fs.existsSync(f)) return (sizeCache[asset] = JSON.parse(fs.readFileSync(f, 'utf8')).size);
  }
  throw new Error(`model yok: ${asset}`);
};
const AN = (preset, t, dur, extra = {}) => ({ preset, t: r2(t), ...(dur ? { dur } : {}), ...extra });
const yorunge = (cx, cy, r, t0, t1, tur, faz = 0) => {
  const N = Math.max(12, Math.round(36 * tur)), xs = [], ys = [], as = [];
  for (let i = 0; i <= N; i++) {
    const a = faz + (2 * Math.PI * tur * i) / N, t = t0 + ((t1 - t0) * i) / N;
    xs.push(k(t, r2(cx + r * Math.cos(a)), 'linear')); ys.push(k(t, r2(cy + r * Math.sin(a)), 'linear')); as.push(k(t, r2((a * 180) / Math.PI), 'linear'));
  }
  return { x: xs, y: ys, deg: as };
};

// İçerik bandını (g-ana, g-son) altyazıya yer açmak için aşağı kaydır: y sayısı / anahtar izi / ok uçları
const DY = 120;
const kaydir = (ls) => {
  const yy = (v) => (typeof v === 'number' ? r2(v + DY) : Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' ? [v[0], r2(v[1] + DY)] : Array.isArray(v) ? v.map((a) => (a && typeof a === 'object' && 'v' in a ? { ...a, v: r2(a.v + DY) } : a)) : v);
  ls.forEach((l) => {
    if (l.group !== 'g-ana' && l.group !== 'g-son') return;
    if (l.y !== undefined) l.y = yy(l.y);
    if (l.type === 'arrow') { if (Array.isArray(l.from)) l.from = yy(l.from); if (Array.isArray(l.to)) l.to = yy(l.to); }
  });
  return ls;
};

function yap(PROJE_ID, kur) {
  const layers = [];
  const L = (o) => (layers.push(o), o);
  const K = karakterBaglam({ W, H });

  // ── anlatım zamanları ────────────────────────────────────────────────
  const SATIR = SATIRLAR[PROJE_ID];
  const SES = SATIR.map((_, i) => `${PROJE_ID}-ses-${i + 1}.wav`);
  const D = SATIR.map((m, i) => r2(wavSure(path.join(ROOT, 'data', 'audio', SES[i])) ?? m.length / 14 + 0.6));
  const n = {};
  let cur = 0.3;
  SATIR.forEach((_, i) => { n[i + 1] = { t: r2(cur), d: D[i], e: r2(cur + D[i]) }; cur += D[i] + (i === 0 ? 0.35 : 0.3); });
  const SON = n[SATIR.length].e;
  const SURE = r2(SON + 1.4);

  // ── yardımcılar ─────────────────────────────────────────────────────
  const M = (id, g, asset, x, y, px, t0, t1, o = {}) => {
    const sz = SIZE(asset);
    const anims = [];
    if (o.giris !== false) anims.push(AN(o.giris || 'cizerek-gir', t0 + (o.gd || 0), o.dur || 0.9));
    if (o.idle) anims.push(AN('suzul', t0 + 1.0, null, { genlik: o.idle === true ? 8 : o.idle, periyot: o.per || 3.2 }));
    if (o.cikis !== false && t1 != null) anims.push(AN(o.cikis || 'silinerek-cik', t1 - (o.cd || 0.5), o.cd || 0.5));
    return L({
      id, group: g, asset, x, y, anchor: [0.5, 0.5], scale: r2(px / Math.max(...sz)), start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
      ...(o.sx ? { scaleX: o.sx } : {}), ...(o.sy ? { scaleY: o.sy } : {}), ...(o.pal ? { palette: o.pal } : {}),
      ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.style ? { style: o.style } : {}), ...(o.op != null ? { opacity: o.op } : {}),
      ...(o.shadow != null ? { shadow: o.shadow } : {}), ...(o.parts ? { parts: o.parts } : {}), ...(o.extra || {}),
      anims: [...anims, ...(o.anims || [])],
    });
  };
  const pxk = (asset, ks) => { const m = Math.max(...SIZE(asset)); return ks.map((a) => k(a.t, r2(a.px / m), a.ease)); };
  const T = (id, g, text, x, y, size, t0, t1, o = {}) => L({
    id, group: g, type: 'text', text, x, y, size, font: o.font || F_GOVDE, weight: o.weight || 900, color: o.color || CREAM, align: o.align || 'center',
    start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}), lineHeight: o.lh || 1.1,
    ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.stroke ? { stroke: o.stroke } : {}), ...(o.shadow ? { shadow: o.shadow } : {}),
    ...(o.ls ? { letterSpacing: o.ls } : {}), ...(o.box ? { box: o.box } : {}),
    ...(o.anim === false ? {} : { textAnims: [{ preset: o.anim || 'harf-zipla', t: r2(t0 + 0.05), dur: o.adur || 0.45, aralik: o.aralik ?? 0.035 }] }),
    anims: [...(o.giris ? [AN(o.giris, t0, 0.5)] : []), ...(o.cikis !== false && t1 != null ? [AN(o.cikis || 'kuculerek-cik', t1 - 0.4, 0.35)] : []), ...(o.anims || [])],
    ...(o.extra || {}),
  });
  const kutu = (id, g, x, y, w, h, color, t0, t1, o = {}) => {
    const sz = SIZE('hap');
    return L({
      id, group: g, asset: 'hap', x, y, anchor: [0.5, 0.5], scaleX: r2(w / sz[0]), scaleY: r2(h / sz[1]), palette: { a: color }, start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
      style: 'cizim', anims: [AN('zipla-gir', t0, 0.5), ...(t1 != null && o.cikis !== false ? [AN('kuculerek-cik', t1 - 0.4, 0.35)] : [])],
    });
  };
  const hap = (id, g, text, x, y, w, size, color, t0, t1, o = {}) => {
    kutu(`${id}-z`, g, x, y, w, o.h || size * 1.9, color, t0, t1, o);
    return T(`${id}-t`, g, text, x, y, size, t0 + 0.1, t1, { anim: false, giris: 'belir', color: o.color || INK, font: F_BASLIK, ...(o.t || {}) });
  };
  const yika = (id, g, color, x, y, px, t0, t1, o = {}) => M(id, g, 'leke', x, y, px, t0, t1, { pal: { a: color }, style: 'duz', giris: 'belir', dur: 0.7, cikis: false, op: o.op ?? 0.55, rot: o.rot ?? 0 });
  const OK = (id, g, from, to, t0, o = {}) => L({
    id, group: g, type: 'arrow', arrow: o.stil || 'ok-el-cizimi', from, to, color: o.color || CORAL, width: o.width || 9, bend: o.bend ?? 0.3,
    start: r2(t0), ...(o.end != null ? { end: r2(o.end) } : {}),
    ...(o.label ? { label: o.label, labelPos: 0.5, labelOffset: o.labelOffset ?? 50, labelSize: o.labelSize || 56, labelColor: o.labelColor || o.color || CORAL, labelFont: F_EL } : {}),
    ...(o.extra || {}), anims: [AN('cizerek-gir', t0, o.dur ?? 0.7)],
  });
  const gunesDon = (t0, t1) => ({ isin: { rotation: [k(t0, 0, 'linear'), k(t1, -540, 'linear')] } });
  const ctx = { L, M, T, hap, kutu, yika, OK, pxk, AN, n, SURE, SATIR, gunesDon, yorunge };

  // ── sahne içeriği (reels'e özgü) ────────────────────────────────────
  const kt = n[SATIR.length].t; // kapanış (yönlendirme) kartı başlangıcı
  const ozel = kur(ctx);

  // ── ortak: kapanış kartı (videonun tamamı YouTube'da) ────────────────
  {
    const g = 'g-son';
    const t0 = kt;
    yika('son-yika', g, '#5b3f9f', 540, 760, 1500, t0, null, { op: 0.95 });
    yika('son-yika2', g, '#ff7f6e', 820, 1020, 560, t0 + 0.2, null, { op: 0.35, rot: 25 });
    M('son-logo', g, 'youtube-logo', 540, 290, 190, t0 + 0.2, null, { dur: 0.7, cikis: false, idle: 6 });
    T('son-baslik', g, 'VİDEONUN TAMAMI\nYOUTUBE’DA!', 540, 470, 88, t0 + 0.4, null, { font: F_BASLIK, color: CREAM, cikis: false, stroke: { color: INK, width: 10 }, lh: 1.05 });
    M('son-oynat', g, 'oynat-dugmesi-cizim', 540, 720, 440, t0 + 0.7, null, { dur: 0.8, cikis: false, anims: [AN('nabiz', t0 + 1.6, null, { genlik: 0.06, periyot: 1.0 })] });
    hap('son-adres', g, '@BayKipir', 540, 880, 600, 66, BUTTER, t0 + 1.2, null, { h: 108, cikis: false });
    L({ id: 'son-konfeti', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: 540, y: 720, start: r2(t0 + 1.0), end: r2(SURE), colors: [CORAL, BUTTER, MINT, LILAC, PINK, SKY], count: 60, sfx: false });
  }

  // ── altyazı: balon yok; içeriğin ALTINDA (y≈1190), kutusuz, kalın konturlu, en çok 2 satırlık parçalar ──
  const NL = String.fromCharCode(10);
  const parcala = (m, maks = 24) => { // kelimeleri ≤maks karakterlik satırlara, 2 satırı bir parçaya topla
    const satirlar = []; let s = '';
    for (const w of m.split(' ')) { if ((s + ' ' + w).trim().length > maks && s) { satirlar.push(s); s = w; } else s = (s + ' ' + w).trim(); }
    if (s) satirlar.push(s);
    const out = []; for (let i = 0; i < satirlar.length; i += 2) out.push(satirlar.slice(i, i + 2).join(NL));
    return out;
  };
  SATIR.forEach((m, i) => {
    const ps = parcala(m), top = ps.reduce((a, b) => a + b.length, 0);
    let t = n[i + 1].t;
    ps.forEach((p, j) => {
      const d = n[i + 1].d * (p.length / top), son = i === SATIR.length - 1 && j === ps.length - 1;
      T(`alt-${i + 1}-${j + 1}`, 'g-kipir', p, 600, 1195, 62, t, son ? null : r2(t + d), {
        font: F_BASLIK, weight: 900, color: '#ffffff', stroke: { color: INK, width: 14 }, anim: false, giris: 'belir', cikis: false, lh: 1.12,
      });
      t += d;
    });
  });

  // ── Kıpır: anlatıcı (balon = altyazı). Kapanışta oynat düğmesini tanıtır ──
  const kipir = K('gozlu', {
    id: 'kipir', konum: [0.14, 0.86], boy: 0.19, varyant: 'mavi', ekler: ['sac-tutam'], start: 0.05, giris: 'zipla-gir',
    balon: { gizle: true }, // balon ana içeriği kapatıyordu → altyazı ayrı bantta (aşağıda)
    akis: [{ t: 0.1, aksiyon: 'selamla', duygu: 'heyecanli', sure: 1.2 }, ...(ozel.akis || []),
      { t: kt, aksiyon: 'tanit', hedef: 'son-oynat', duygu: 'cok-mutlu', bak: 'son-oynat', sure: 2.5 },
      { t: kt + 3.0, aksiyon: 'el-salla', duygu: 'cok-mutlu', bak: 'ileri' }],
    soz: SATIR.map((m, i) => ({ t: n[i + 1].t, sure: n[i + 1].d, metin: m })),
    golge: true,
  });
  kipir.group = 'g-kipir';
  L(kipir);

  // ── sahne dosyası ───────────────────────────────────────────────────
  const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
  fs.mkdirSync(dir, { recursive: true });
  let eski = { audio: [] };
  try { eski = JSON.parse(fs.readFileSync(path.join(dir, 'scene.json'), 'utf8')); } catch { /* yeni */ }
  const audio = SES.map((f, i) => {
    const e = (eski.audio || []).find((a) => a.file === f) || { file: f, offset: 0, dur: null, volume: 1, fadeIn: 0, fadeOut: 0, mute: false };
    return { ...e, file: f, start: n[i + 1].t, volume: 1 };
  });
  const m = ozel.muzik;
  const mz = (eski.audio || []).find((a) => a.file === m.file) || { file: m.file, offset: 0, mute: false };
  audio.push({ ...mz, file: m.file, start: 0, dur: r2(SURE), volume: m.volume ?? 0.22, fadeIn: 0.5, fadeOut: 1.5, ...(m.bpm ? { bpm: m.bpm } : {}) });

  const scene = {
    name: ozel.ad, width: W, height: H, fps: FPS, duration: SURE, style: 'cizim',
    sketch: { ink: INK, width: 3.6, wobble: 1.3, hatch: 5.5, angle: 62, cross: true, wipe: 35, grain: 0.3 },
    theme: {
      name: 'Gece Defteri', paper: 'pastel',
      colors: { arka1: '#25225e', arka2: '#3b2f7d', baslik: '#fff3c4', metin: '#fff3c4', vurgu: '#ff7f6e' },
      background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180, paper: 0.35, vignette: 0.25 },
    },
    camera: { zoom: 1 },
    publish: ozel.publish,
    audio, sfx: { auto: true, volume: 0.4 },
    sections: [{ t: 0, name: 'Kanca' }, ...(ozel.sections || []), { t: r2(kt), name: 'Videonun tamamı' }],
    transitions: ozel.transitions || [],
    groups: [...(ozel.groups || []), { id: 'g-son', name: 'Videonun tamamı YouTube’da' }, { id: 'g-kipir', name: 'Kıpır' }],
    layers: kaydir(JSON.parse(JSON.stringify(layers))),
  };
  fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
  if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
  console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn · kapanış ${r2(kt)} sn`);
}

// ═════════════════════════════════════════════════════════════════════════
// REELS 1 — "Güneş'e sakın bakma!"  (→ Güneş dersi)
// ═════════════════════════════════════════════════════════════════════════
const reelsGunes = ({ L, M, T, hap, yika, OK, pxk, AN, n, SURE, gunesDon }) => {
  const g = 'g-ana';
  const kt = n[6].t;
  yika('y1', g, '#4a3f93', 540, 640, 1300, 0, kt, { op: 0.9 });
  yika('y2', g, '#ff9d4d', 540, 600, 700, 0.2, n[3].t, { op: 0.28, rot: 30 });
  // Güneş: dev → sağ üste çekilir
  const gunes = M('gunes', g, 'gunes-cizim', 540, 640, 640, 0.25, kt, { dur: 1.0, cikis: false, parts: gunesDon(0.25, SURE) });
  gunes.x = [k(0.25, 540), k(n[2].t, 540), k(n[2].t + 0.8, 800, 'inOutCubic'), k(n[4].t, 800), k(n[4].t + 0.8, 540, 'inOutCubic')];
  gunes.y = [k(0.25, 640), k(n[2].t, 640), k(n[2].t + 0.8, 560, 'inOutCubic'), k(n[4].t, 560), k(n[4].t + 0.8, 640, 'inOutCubic')];
  gunes.scale = pxk('gunes-cizim', [{ t: 0.25, px: 640 }, { t: n[2].t, px: 640 }, { t: n[2].t + 0.8, px: 380, ease: 'inOutCubic' }, { t: n[4].t, px: 380 }, { t: n[4].t + 0.8, px: 440, ease: 'inOutCubic' }]);
  gunes.end = r2(kt);
  T('hook', g, 'GÜNEŞ’E\nSAKIN BAKMA!', 540, 330, 118, 0.3, n[2].t + 0.6, { font: F_BASLIK, color: CREAM, stroke: { color: INK, width: 12 }, lh: 1.02 });
  M('hook-yasak', g, 'yasak-isareti', 540, 640, 360, 0.9, n[2].t + 0.6, { dur: 0.6, giris: 'zipla-gir' });

  // 2: göz — zarar
  M('goz', g, 'goz-cizim', 270, 560, 360, n[2].t + 0.5, n[3].t, { dur: 0.7, cd: 0.4 });
  OK('ok-isik', g, 'gunes', 'goz', n[2].t + 1.2, { stil: 'ok-kalin-golge', color: '#ffb300', width: 14, bend: 0.0, end: n[3].t - 0.2, extra: { fromAnchor: 'sol', toAnchor: 'sag' } });
  hap('zarar', g, 'GÖZE ZARAR!', 540, 790, 640, 66, RED_, n[2].t + 1.6, n[3].t, { color: '#ffffff', h: 120 });

  // 3: dürbün / teleskop / mercek / kamera — yasak
  const ysk = [['DÜRBÜN', 'durbun-cizim', 300, 560, 330], ['TELESKOP', 'teleskop-cizim', 780, 560, 380]];
  ysk.forEach(([ad, asset, x, y, px], i) => {
    const t0 = n[3].t + 0.2 + i * 1.3;
    M(`y-${i}`, g, asset, x, y, px, t0, n[4].t, { dur: 0.6, cd: 0.4 });
    M(`y-${i}-x`, g, 'yasak-isareti', x, y, px + 40, t0 + 0.5, n[4].t, { dur: 0.4, giris: 'zipla-gir', cd: 0.3 });
    hap(`y-${i}-e`, g, ad, x, y + 235, 420, 50, CORAL, t0 + 0.4, n[4].t, { h: 92 });
  });
  hap('y-diger', g, 'MERCEK · KAMERA da YASAK!', 540, 1010 - 140, 900, 52, BUTTER, n[3].t + 3.0, n[4].t, { h: 100 });

  // 4: özel filtre → güvenli
  M('filtre', g, 'filtre-gozluk-cizim', 540, 540, 700, n[4].t + 0.6, n[5].t, { dur: 1.0, idle: 8, cd: 0.4 });
  hap('guvenli', g, 'ÖZEL FİLTRE = GÜVENLİ', 500, 800, 800, 56, '#7fe3b4', n[4].t + 1.4, n[5].t, { h: 108 });
  M('guvenli-tik', g, 'tik', 970, 800, 130, n[4].t + 1.8, n[5].t, { pal: { a: '#2fbf71' }, giris: 'zipla-gir', dur: 0.5, cd: 0.4 });
  L({ id: 'pirilti', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: 540, y: 540, start: r2(n[4].t + 1.4), end: r2(n[5].t), colors: [BUTTER_, '#fff6b8', '#9be0c8'], count: 40, sfx: false });

  // 5: uzaklık
  M('d-dunya', g, 'dunya-cizim', 930, 640, 150, n[5].t + 0.2, kt, { dur: 0.6, cd: 0.4, idle: 5 });
  hap('uzak', g, '150 MİLYON KM', 540, 760, 640, 56, SKY_, n[5].t + 1.2, kt, { h: 104 });

  return {
    ad: 'Reels · Güneş’e sakın bakma!',
    akis: [
      { t: n[1].t, aksiyon: 'kork', duygu: 'korku', sure: 1.6 },
      { t: n[2].t, aksiyon: 'hayir', duygu: 'endiseli' },
      { t: n[3].t, aksiyon: 'hayir', duygu: 'endiseli' },
      { t: n[4].t + 0.6, aksiyon: 'tanit', hedef: 'filtre', duygu: 'mutlu', bak: 'filtre' },
      { t: n[4].t + 3.2, aksiyon: 'evet', duygu: 'cok-mutlu', sure: 1.6 },
      { t: n[5].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'ileri' },
    ],
    muzik: { file: 'ritim-hype-132.wav', volume: 0.22, bpm: 132 },
    groups: [{ id: 'g-ana', name: 'Güneş’e bakma' }],
    transitions: [{ type: 'daire-ac', t: r2(kt), dur: 0.8 }],
    publish: {
      title: 'Güneş’e SAKIN Bakma! ☀️👀 #shorts',
      description: 'Güneş’e çıplak gözle, dürbünle, teleskopla, mercekle ya da kamerayla bakılmaz! Güneş’i güvenle izlemenin tek yolu özel filtreler. Videonun tamamını YouTube kanalımızda izle: youtube.com/@BayKipir 🌞 Beğen, abone ol, zili aç!',
      tags: ['shorts', 'güneş', 'güneşe bakma', 'güneş filtresi', 'göz sağlığı', '5. sınıf fen', 'fen bilimleri', 'kıpır', 'bay kıpır', 'çocuklar için bilim', 'animasyon', 'uzay'],
    },
  };
};
const RED_ = '#ff5b4f', BUTTER_ = '#ffd84d', SKY_ = '#a9d6f5';

// ═════════════════════════════════════════════════════════════════════════
// REELS 2 — "Ay'ın arka yüzünü hiç gördün mü?"  (→ Ay dersi)
// ═════════════════════════════════════════════════════════════════════════
const reelsAy = ({ L, M, T, hap, yika, OK, pxk, AN, n, SURE, yorunge }) => {
  const g = 'g-ana';
  const kt = n[6].t;
  yika('y1', g, '#4a3f93', 540, 640, 1300, 0, kt, { op: 0.9 });
  yika('y2', g, '#9aa8ff', 540, 620, 640, 0.2, n[3].t, { op: 0.25, rot: 20 });
  // 1-2: büyük Ay, hep aynı yüz
  const ay1 = M('ay', g, 'ay-cizim', 540, 640, 620, 0.25, n[3].t, { dur: 1.0, cd: 0.5, idle: 6 });
  T('hook', g, 'AY’IN ARKA YÜZÜNÜ\nHİÇ GÖRDÜN MÜ?', 540, 300, 84, 0.3, n[3].t, { font: F_BASLIK, stroke: { color: INK, width: 10 }, lh: 1.05 });
  T('soru', g, '?', 880, 520, 220, 0.9, n[2].t, { color: BUTTER_, font: F_BASLIK, stroke: { color: INK, width: 10 }, giris: 'zipla-gir' });
  hap('hep', g, 'HEP AYNI YÜZ!', 540, 1000 - 140, 700, 64, BUTTER_, n[2].t + 0.2, n[3].t, { h: 116 });
  M('isaret', g, 'krater-cizim', 470, 600, 150, n[2].t + 0.9, n[3].t, { dur: 0.5, giris: 'zipla-gir', cd: 0.4 });
  OK('ok-yuz', g, [840, 840], [560, 650], n[2].t + 1.3, { color: CORAL, width: 9, bend: -0.3, end: n[3].t - 0.2, label: 'bize bakan yüz', labelOffset: 52, labelSize: 50 });

  // 3-4: dolanma + dönme = senkron
  const t3 = n[3].t + 0.5, tE = n[5].t + 0.3;
  const cx = 540, cy = 620;
  M('halka', g, 'yorunge-halka-cizim', cx, cy, 470, t3, tE, { dur: 0.9, cd: 0.4, op: 0.8 });
  M('dunya', g, 'dunya-cizim', cx, cy, 190, t3 + 0.2, tE, { dur: 0.7, cd: 0.4, parts: undefined });
  const dolan = yorunge(cx, cy, 200, t3 + 1.0, tE, 1, -Math.PI / 2);
  const ay = M('ay2', g, 'ay-cizim', cx, cy - 200, 125, t3 + 0.6, tE, { dur: 0.6, cd: 0.4 });
  ay.x = dolan.x; ay.y = dolan.y;
  ay.rotation = dolan.deg.map((a) => k(a.t, r2(a.v + 90), 'linear'));
  const iz = M('ay2-iz', g, 'krater-cizim', cx, cy - 172, 46, t3 + 0.9, tE, { dur: 0.4, giris: 'zipla-gir', cd: 0.3 });
  const dolanIc = yorunge(cx, cy, 172, t3 + 1.0, tE, 1, -Math.PI / 2);
  iz.x = dolanIc.x; iz.y = dolanIc.y; iz.rotation = dolan.deg.map((a) => k(a.t, r2(a.v + 90), 'linear'));
  hap('esit', g, 'DÖNME = DOLANMA', 540, 400, 760, 58, MINT_, n[4].t + 0.3, tE, { h: 108 });
  T('sure', g, '27 gün 8 saat', 540, 300, 70, n[4].t + 0.6, tE, { font: F_EL, weight: 700, color: CREAM, anim: 'kelime-zipla' });

  // 5: karanlık yüz
  M('on', g, 'ay-cizim', 300, 600, 380, n[5].t + 0.4, kt, { dur: 0.7, cd: 0.4 });
  M('arka', g, 'ay-cizim', 790, 600, 380, n[5].t + 0.8, kt, { dur: 0.7, op: 0.28, pal: undefined, cd: 0.4 });
  hap('on-e', g, 'GÖRÜNEN', 300, 830, 360, 44, '#c9ddff', n[5].t + 0.8, kt, { h: 84 });
  hap('arka-e', g, 'KARANLIK YÜZ', 790, 830, 400, 44, LILAC_, n[5].t + 1.1, kt, { h: 84 });
  T('arka-soru', g, '?', 790, 600, 240, n[5].t + 1.2, kt, { font: F_BASLIK, color: CREAM, stroke: { color: INK, width: 10 }, giris: 'zipla-gir' });

  return {
    ad: 'Reels · Ay’ın arka yüzü',
    akis: [
      { t: n[1].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'ay' },
      { t: n[2].t, aksiyon: 'isaret', hedef: 'ay', duygu: 'saskin', bak: 'ay' },
      { t: n[3].t + 0.6, aksiyon: 'anlat', duygu: 'mutlu', bak: 'dunya' },
      { t: n[4].t + 0.4, aksiyon: 'sevin', duygu: 'heyecanli', sure: 1.4 },
      { t: n[5].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'arka' },
    ],
    muzik: { file: 'ritim-lofi-90.wav', volume: 0.24, bpm: 90 },
    groups: [{ id: 'g-ana', name: 'Ay’ın arka yüzü' }],
    transitions: [{ type: 'elmas', t: r2(kt), dur: 0.8 }],
    publish: {
      title: 'Ay’ın ARKA Yüzünü Neden Hiç Görmeyiz? 🌙 #shorts',
      description: 'Ay hem kendi etrafında döner hem de Dünya’nın etrafında dolanır; ikisi de yaklaşık 27 gün 8 saat sürdüğü için hep aynı yüzünü görürüz. Görünmeyen tarafa Ay’ın karanlık yüzü denir. Videonun tamamını YouTube kanalımızda izle: youtube.com/@BayKipir 🌙 Beğen, abone ol, zili aç!',
      tags: ['shorts', 'ay', 'ayın karanlık yüzü', 'ay hareketleri', 'ay neden hep aynı yüzünü gösterir', '5. sınıf fen', 'fen bilimleri', 'kıpır', 'bay kıpır', 'uzay', 'çocuklar için bilim', 'animasyon'],
    },
  };
};
const MINT_ = '#9be0c8', LILAC_ = '#c9b8f5';

// ═════════════════════════════════════════════════════════════════════════
// REELS 3 — "Güneş kaç Dünya eder?"  (→ Dünya ve komşuları)
// ═════════════════════════════════════════════════════════════════════════
const reels109 = ({ L, M, T, hap, yika, OK, pxk, AN, n, SURE, gunesDon }) => {
  const g = 'g-ana';
  const kt = n[6].t;
  yika('y1', g, '#4a3f93', 540, 640, 1300, 0, kt, { op: 0.9 });
  yika('y2', g, '#ff9d4d', 330, 600, 620, 0.2, n[3].t, { op: 0.3, rot: 30 });
  // 1-2: Güneş + 109 Dünya ızgarası
  const gunes = M('gunes', g, 'gunes-cizim', 540, 640, 560, 0.25, n[3].t, { dur: 1.0, cd: 0.5, parts: gunesDon(0.25, SURE) });
  gunes.x = [k(0.25, 540), k(n[2].t, 540), k(n[2].t + 0.9, 290, 'inOutCubic')];
  gunes.y = [k(0.25, 640), k(n[2].t, 640), k(n[2].t + 0.9, 600, 'inOutCubic')];
  gunes.scale = pxk('gunes-cizim', [{ t: 0.25, px: 560 }, { t: n[2].t, px: 560 }, { t: n[2].t + 0.9, px: 420, ease: 'inOutCubic' }]);
  T('hook', g, 'GÜNEŞ KAÇ\nDÜNYA EDER?', 540, 300, 108, 0.3, n[3].t, { font: F_BASLIK, stroke: { color: INK, width: 12 }, lh: 1.02 });
  M('dunya-tek', g, 'dunya-cizim', 800, 700, 70, 0.9, n[2].t + 0.4, { dur: 0.5, giris: 'zipla-gir', cd: 0.3 });
  // 109 minik Dünya: 10 sütun × 11 satır, tek tek dolar
  const t2 = n[2].t + 0.7, hiz = Math.max(0.012, (n[2].d - 1.0) / 109);
  for (let i = 0; i < 109; i++) {
    const c = i % 10, r = Math.floor(i / 10);
    M(`d${i}`, g, 'dunya-cizim', 640 + c * 38, 480 + r * 38, 34, t2 + i * hiz, n[3].t, { dur: 0.25, giris: 'zipla-gir', cd: 0.3, style: 'duz' });
  }
  T('sayac', g, '109×', 290, 860, 130, n[2].t + 0.9, n[3].t, { font: F_BASLIK, color: BUTTER_, stroke: { color: INK, width: 12 }, anim: false,
    extra: { count: { from: 0, to: 109, decimals: 0, suffix: '×' }, counter: [k(n[2].t + 0.9, 0), k(n[2].t + 0.9 + Math.max(1.0, n[2].d - 1.4), 1, 'outCubic')] } });

  // 3: Ay — Dünya'nın dörtte biri
  M('dunya-b', g, 'dunya-cizim', 330, 620, 380, n[3].t + 0.3, n[4].t, { dur: 0.8, cd: 0.4, idle: 6 });
  M('ay-k', g, 'ay-cizim', 790, 620, 96, n[3].t + 0.9, n[4].t, { dur: 0.6, giris: 'zipla-gir', cd: 0.4, idle: 4 });
  hap('dunya-e', g, 'DÜNYA', 330, 870, 300, 46, SKY_, n[3].t + 0.6, n[4].t, { h: 86 });
  hap('ay-e', g, 'AY ≈ ¼', 790, 870, 320, 46, '#e6defb', n[3].t + 1.1, n[4].t, { h: 86 });
  OK('ok-ay', g, [520, 620], [700, 620], n[3].t + 1.2, { stil: 'ok-cift-uclu', color: CREAM, width: 7, bend: 0.0, end: n[4].t - 0.2, dur: 0.6 });

  // 4: daha büyük yıldızlar, çok uzakta
  M('gunes-s', g, 'gunes-cizim', 300, 640, 260, n[4].t + 0.4, n[5].t, { dur: 0.7, cd: 0.4 });
  [[760, 460, 130], [900, 760, 90], [680, 780, 70], [860, 560, 60]].forEach(([x, y, px], i) => M(`yl${i}`, g, 'yildiz', x, y, px, n[4].t + 0.9 + i * 0.25, n[5].t, { dur: 0.5, giris: 'zipla-gir', cd: 0.3, pal: { a: i % 2 ? BUTTER_ : PINK_ }, idle: 6 }));
  hap('buyuk', g, 'DAHA BÜYÜK YILDIZLAR VAR!', 540, 1000 - 120, 920, 48, '#e6defb', n[4].t + 1.0, n[5].t, { h: 96 });
  OK('ok-uzak', g, [440, 640], [640, 600], n[4].t + 1.6, { color: CREAM, width: 7, bend: -0.25, end: n[5].t - 0.2, label: 'çok uzak!', labelOffset: -52, labelSize: 48, extra: { head: 'ucgen' } });

  // 5: en yakın yıldız = en büyük görünür
  const gb = M('gunes-b', g, 'gunes-cizim', 540, 600, 520, n[5].t + 0.3, kt, { dur: 0.9, cd: 0.4, parts: gunesDon(n[5].t, SURE) });
  hap('yakin', g, 'EN YAKIN YILDIZ', 540, 960 - 110, 700, 56, '#ffb85c', n[5].t + 1.0, kt, { h: 104 });
  T('gor', g, '= EN BÜYÜK GÖRÜNÜR', 540, 960 + 10, 50, n[5].t + 1.6, kt, { font: F_BASLIK, color: CREAM, anim: 'kelime-zipla' });
  void gb;

  return {
    ad: 'Reels · Güneş kaç Dünya eder?',
    akis: [
      { t: n[1].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'gunes' },
      { t: n[2].t, aksiyon: 'sevin', duygu: 'heyecanli', sure: 1.6 },
      { t: n[3].t, aksiyon: 'tanit', hedef: 'dunya-b', duygu: 'mutlu', bak: 'dunya-b' },
      { t: n[4].t, aksiyon: 'isaret', hedef: 'gunes-s', duygu: 'saskin', bak: 'gunes-s' },
      { t: n[5].t + 0.4, aksiyon: 'anlat', duygu: 'mutlu', bak: 'ileri' },
    ],
    muzik: { file: 'ritim-pop-120.wav', volume: 0.22, bpm: 120 },
    groups: [{ id: 'g-ana', name: 'Güneş kaç Dünya eder?' }],
    transitions: [{ type: 'yildiz', t: r2(kt), dur: 0.8, color: '#c9b8f5' }],
    publish: {
      title: 'Güneş KAÇ Dünya Eder? 🌍☀️ #shorts',
      description: 'Güneş’in çapı Dünya’nın yaklaşık 109 katı! Ay ise Dünya’nın yaklaşık dörtte biri kadar. Güneş’ten büyük yıldızlar da var ama çok uzaktalar. Güneş, Dünya ve Ay’ın hareketlerini simülasyonla görmek için videonun tamamını YouTube kanalımızda izle: youtube.com/@BayKipir 🌍 Beğen, abone ol, zili aç!',
      tags: ['shorts', 'güneş', 'dünya', 'ay', 'güneş dünyadan kaç kat büyük', 'boyut kıyaslama', '5. sınıf fen', 'fen bilimleri', 'kıpır', 'bay kıpır', 'uzay', 'çocuklar için bilim', 'animasyon'],
    },
  };
};
const PINK_ = '#ffc2d4';

const TUM = { 'reels-gunes-bakma': reelsGunes, 'reels-ay-yuz': reelsAy, 'reels-109-dunya': reels109 };
const istenen = process.argv[2] ? [process.argv[2]] : Object.keys(TUM);
for (const id of istenen) yap(id, TUM[id]);
