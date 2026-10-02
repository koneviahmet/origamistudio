// "Ay Dersi — Gözlü ile Gökyüzündeki Komşumuz: Ay" (16:9, 5. sınıf Fen Bilimleri, kaynak: fenogren-tahta.netlify.app).
//   Önce modeller:  node scripts/seed-ay-dersi.mjs
//   Seslendirme:    node scripts/seslendir.mjs --proje ay-dersi --satirlar scripts/ay-dersi-satirlar.txt --ad ay-dersi-ses --ses-id d2-00091
//   Sahne:          node scripts/scenes-ay-dersi.mjs   →  data/projects/ay-dersi/scene.json
// Şablon: gunes-dersi (Gözlü anlatıcı, çizim stili, her bölüm bir SORUYLA açılır, cevap sahnede çizilir). Zamanlama wav sürelerinden okunur.
// Kaynaktaki hata düzeltildi: Ay'ın çapı Dünya'nın çapının 4 katı DEĞİL, yaklaşık dörtte biridir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { karakterBaglam } from './lib/karakter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJE_ID = 'ay-dersi';
const W = 1920, H = 1080, FPS = 30;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);
const K = karakterBaglam({ W, H });

// ─── Renkler / yazı tipleri ────────────────────────────────────────────────
const INK = '#3d3a73', CORAL = '#ff7f6e', BUTTER = '#ffd84d', PEACH = '#ffb88c', MINT = '#9be0c8', SKY = '#a9d6f5', LILAC = '#c9b8f5', PINK = '#ffc2d4';
const HILITE = '#fff0a6', GREEN = '#4cc38a', NIGHT = '#2b2e6b';
const F_BASLIK = 'M PLUS Rounded 1c', F_GOVDE = 'Nunito', F_EL = 'Courgette';

// ─── Anlatım: metin (satirlar dosyası) + gerçek süre (wav) ─────────────────
const SATIR = fs.readFileSync(path.join(ROOT, 'scripts', 'ay-dersi-satirlar.txt'), 'utf8').split(/\r?\n/).filter((s) => s.trim()).map((s) => s.replace(/^[\d.]+\s*\|\s*/, ''));
function wavSure(file) {
  try {
    const b = fs.readFileSync(file);
    let p = 12;
    let byteRate = 0;
    while (p + 8 <= b.length) {
      const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4);
      if (id === 'fmt ') byteRate = b.readUInt32LE(p + 16);
      if (id === 'data') return (sz > b.length ? b.length - p - 8 : sz) / byteRate;
      p += 8 + sz + (sz % 2);
    }
  } catch { /* dosya yok */ }
  return null;
}
const SES = SATIR.map((_, i) => `ay-dersi-ses-${i + 1}.wav`);
const D = SATIR.map((m, i) => r2(wavSure(path.join(ROOT, 'data', 'audio', SES[i])) ?? m.length / 14 + 0.6));

// ─── Zaman çizelgesi (anlatıma göre) ───────────────────────────────────────
const TT = {};
let cur = 0.9;
const say = (i, sonra = 0.4) => { TT[i] = { t: r2(cur), d: D[i - 1], e: r2(cur + D[i - 1]) }; cur = cur + D[i - 1] + sonra; return TT[i]; };
const gec = (bekle, ac = 0.8) => { const tb = r2(cur - 0.4 + bekle); cur = tb + ac; return tb; };
say(1, 0.3); say(2, 2.4); say(3, 0.3); say(4, 0);
const tB = gec(1.9);
say(5, 2.0); say(6, 0);
const tC = gec(1.8);
say(7, 1.4); say(8, 2.0); say(9, 0.4); say(10, 0.4); say(11, 0.4); say(12, 0);
const tD = gec(1.9);
say(13, 1.6); say(14, 0.4); say(15, 0.4); say(16, 0.5); say(17, 0.4); say(18, 0);
const tE = gec(1.9);
say(19, 0.4); say(20, 0.4); say(21, 0.4); say(22, 0.4); say(23, 0);
const tF = gec(1.6);
say(24, 0.6); say(25, 0);
const SON = TT[25].e;
const SURE = r2(SON + 3.2);
const n = TT;

// ─── Yardımcılar ───────────────────────────────────────────────────────────
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

/** Model katmanı: px = en uzun kenar (sahne px). giris: çizerek-gir (vars.), cikis: silinerek-cik (end'e kadar) */
const M = (id, g, asset, x, y, px, t0, t1, o = {}) => {
  const sz = SIZE(asset);
  const sc = px / Math.max(...sz);
  const anims = [];
  if (o.giris !== false) anims.push(AN(o.giris || 'cizerek-gir', t0 + (o.gd || 0), o.dur || 1.4));
  if (o.idle) anims.push(AN('suzul', t0 + 1.2, null, { genlik: o.idle === true ? 8 : o.idle, periyot: o.per || 3.2 }));
  if (o.cikis !== false && t1 != null) anims.push(AN(o.cikis || 'silinerek-cik', t1 - (o.cd || 0.7), o.cd || 0.7));
  const lay = {
    id, group: g, asset, x, y, anchor: [0.5, 0.5], scale: r2(sc), start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
    ...(o.sx ? { scaleX: o.sx } : {}), ...(o.sy ? { scaleY: o.sy } : {}),
    ...(o.pal ? { palette: o.pal } : {}), ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.style ? { style: o.style } : {}),
    ...(o.op != null ? { opacity: o.op } : {}), ...(o.shadow != null ? { shadow: o.shadow } : {}),
    ...(o.parts ? { parts: o.parts } : {}), ...(o.loops ? { loops: o.loops } : {}), ...(o.extra || {}),
    anims: [...anims, ...(o.anims || [])],
  };
  return L(lay);
};
/** px cinsinden anahtarlı ölçek: [{t, px, ease}] → scale izi */
const pxk = (asset, ks) => { const m = Math.max(...SIZE(asset)); return ks.map((a) => k(a.t, r2(a.px / m), a.ease)); };

/** Metin katmanı */
const T = (id, g, text, x, y, size, t0, t1, o = {}) => L({
  id, group: g, type: 'text', text, x, y, size, font: o.font || F_GOVDE, weight: o.weight || 800, color: o.color || INK, align: o.align || 'center',
  start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}), lineHeight: o.lh || 1.12,
  ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.box ? { box: o.box } : {}), ...(o.stroke ? { stroke: o.stroke } : {}),
  ...(o.up ? { uppercase: true } : {}), ...(o.ls ? { letterSpacing: o.ls } : {}),
  ...(o.anim === false ? {} : { textAnims: [{ preset: o.anim || 'harf-zipla', t: r2(t0 + (o.delay ?? 0.1)), dur: o.adur || 0.45, aralik: o.aralik ?? 0.04 }] }),
  ...(o.reveal ? { reveal: o.reveal } : {}),
  anims: [...(o.giris ? [AN(o.giris, t0, 0.5)] : []), ...(o.cikis !== false && t1 != null ? [AN(o.cikis || 'kuculerek-cik', t1 - 0.45, 0.4)] : []), ...(o.anims || [])],
  ...(o.extra || {}),
});
/** Boya parçası (hap / kart) — düz renkli yuvarlak zemin; style 'duz' kontursuz */
const kutu = (id, g, shape, x, y, w, h, color, t0, t1, o = {}) => {
  const sz = SIZE(shape);
  return L({
    id, group: g, asset: shape, x, y, anchor: [0.5, 0.5], scaleX: r2(w / sz[0]), scaleY: r2(h / sz[1]), palette: { a: color }, start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
    ...(o.style ? { style: o.style } : {}), ...(o.rot != null ? { rotation: o.rot } : {}), ...(o.op != null ? { opacity: o.op } : {}),
    anims: [AN(o.giris || 'zipla-gir', t0, o.dur || 0.6), ...(t1 != null && o.cikis !== false ? [AN(o.cikis || 'kuculerek-cik', t1 - 0.45, 0.4)] : []), ...(o.anims || [])],
  });
};
/** Etiket "hap": renkli zemin + yazı birlikte */
const hap = (id, g, text, x, y, w, size, color, t0, t1, o = {}) => {
  kutu(`${id}-z`, g, 'hap', x, y, w, o.h || size * 1.9, color, t0, t1, { style: 'cizim', giris: 'zipla-gir', dur: 0.5, ...(o.kutu || {}) });
  return T(`${id}-t`, g, text, x, y + (o.dy || 0), size, t0 + 0.12, t1, { anim: false, giris: 'belir', color: o.color || INK, font: o.font, weight: o.weight, ...(o.t || {}) });
};
/** Boyalı bölüm zemini (blob) */
const yika = (id, g, color, x, y, px, t0, t1, o = {}) => M(id, g, 'leke', x, y, px, t0, t1, {
  pal: { a: color }, style: 'duz', giris: 'belir', dur: 0.9, cikis: false, op: o.op ?? 0.62, rot: o.rot ?? 0, anims: o.anims,
});
/** Çizim okları */
const OK = (id, g, from, to, t0, o = {}) => L({
  id, group: g, type: 'arrow', arrow: o.stil || 'ok-el-cizimi', from, to, color: o.color || CORAL, width: o.width || 6, bend: o.bend ?? 0.3,
  start: r2(t0), ...(o.end != null ? { end: r2(o.end) } : {}),
  ...(o.label ? { label: o.label, labelPos: o.labelPos ?? 0.5, labelOffset: o.labelOffset ?? 44, labelSize: o.labelSize || 52, labelColor: o.labelColor || o.color || CORAL, labelFont: F_EL } : {}),
  ...(o.fromAnchor ? { fromAnchor: o.fromAnchor } : {}), ...(o.toAnchor ? { toAnchor: o.toAnchor } : {}), ...(o.extra || {}),
  anims: [AN('cizerek-gir', t0, o.dur ?? 0.9)],
});
/** Çember üzerinde dönüş: x / y anahtarları */
const yorunge = (cx, cy, r, t0, t1, tur, faz = 0) => {
  const N = Math.max(12, Math.round(36 * tur)), xs = [], ys = [];
  for (let i = 0; i <= N; i++) {
    const a = faz + (2 * Math.PI * tur * i) / N, t = t0 + ((t1 - t0) * i) / N;
    xs.push(k(t, r2(cx + r * Math.cos(a)), 'linear')); ys.push(k(t, r2(cy + r * Math.sin(a)), 'linear'));
  }
  return { x: xs, y: ys };
};
/** Güneş ışınlarının sürekli (saat yönünün tersine) dönüşü */
const isinDon = (t0, t1, derece = -360) => ({ isin: { rotation: [k(t0, 0, 'linear'), k(t1, derece, 'linear')] } });

const KOYU_AY = { a: '#3b3f7a', b: '#2e3266', c: '#565b9e' };
/** Soru işareti */
const SORU = (id, g, x, y, size, t0, t1, rot = 10, renk = CORAL) =>
  T(id, g, '?', x, y, size, t0, t1, { font: F_EL, weight: 400, color: renk, rot, anim: 'harf-zipla', anims: [AN('sallan', t0 + 0.9, null, { aci: 7, periyot: 1.6 })] });
/** Yazı etiketi + el çizimi ok */
const ETIKET = (id, g, text, x, y, hedef, t, t1, renk, o = {}) => {
  T(`${id}-t`, g, text, x, y, o.size || 46, t, t1, { font: F_EL, weight: 400, color: renk, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  OK(`${id}-o`, g, [x + (o.dx || 0), y + (o.dy || -40)], hedef, t + 0.2, { stil: 'ok-el-cizimi', color: renk, width: 5, bend: o.bend ?? 0.3, end: t1, dur: 0.7 });
};

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM A — KİM BU?  (soru: yıldız mı? → Ay, tek doğal uydu, küresel)
// ═══════════════════════════════════════════════════════════════════════════
const gA = 'g-a';
{
  const t1 = tB;
  yika('a-yika', gA, '#d9d2fb', 1340, 540, 1500, 0, t1, { op: 0.9 });
  yika('a-yika2', gA, '#ffe9b8', 1480, 800, 760, 0.4, t1, { op: 0.85, rot: 40 });
  // Ay: başlangıçta büyük ortada; soruda küçülüp yukarı çıkar; cevapta sola yerleşir
  const ax = [k(0.3, 1340), k(n[2].t + 1.0, 1340, 'inOutCubic'), k(n[3].t + 1.4, 1340), k(n[3].t + 2.4, 1060, 'inOutCubic')];
  const ay = [k(0.3, 610), k(n[2].t, 610), k(n[2].t + 1.0, 360, 'inOutCubic'), k(n[3].t + 1.4, 360), k(n[3].t + 2.4, 530, 'inOutCubic')];
  const a = M('ay-ana', gA, 'ay-cizim', 1340, 540, 440, 0.3, t1, { dur: 2.4, cikis: false, idle: 6 });
  a.x = ax; a.y = ay;
  a.scale = pxk('ay-cizim', [{ t: 0.3, px: 440 }, { t: n[2].t, px: 440 }, { t: n[2].t + 1.0, px: 250, ease: 'inOutCubic' }, { t: n[3].t + 1.4, px: 250 }, { t: n[3].t + 2.4, px: 400, ease: 'inOutCubic' }]);
  a.rotation = [k(0.3, 0), k(t1, 35, 'linear')];

  T('a-baslik', gA, 'AY', 1340, 205, 160, 0.7, n[2].t - 0.2, { font: F_BASLIK, weight: 900, color: INK, adur: 0.5, aralik: 0.07, anims: [AN('nefes', 1.6, null, { genlik: 0.02, periyot: 2.4 })] });
  T('a-alt', gA, 'gökyüzündeki komşumuz', 1340, 320, 54, 1.7, n[2].t - 0.2, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir' });

  // n2 — soru kartları: YILDIZ mı, UYDU mu?
  const q0 = n[2].t + 0.35, tKart = n[3].t + 1.7;
  const kart = (id, x, ad, simge, renk, t0, o = {}) => {
    kutu(`${id}-z`, gA, 'kart-kare', x, 765, 360, 300, renk, t0, tKart, { style: 'cizim', dur: 0.6, anims: o.anims });
    M(`${id}-i`, gA, simge, x, 715, 130, t0 + 0.3, tKart, { cikis: 'kuculerek-cik', cd: 0.45, dur: 1.0, pal: o.pal });
    T(`${id}-t`, gA, ad, x, 850, 50, t0 + 0.35, tKart, { font: F_BASLIK, weight: 900, adur: 0.4 });
  };
  kart('k-yil', 1110, 'YILDIZ', 'yildiz', '#fff0a6', q0, { pal: { a: '#ffc21a' }, anims: [AN('titre', n[3].t + 0.3, null, { genlik: 4 })] });
  kart('k-uydu', 1570, 'UYDU', 'ay-cizim', '#dfe6ff', q0 + 0.25, { anims: [AN('nabiz', n[3].t + 0.35, null, { genlik: 0.06, periyot: 0.9 })] });
  M('k-yil-x', gA, 'carpi', 1110, 740, 190, n[3].t + 0.2, tKart, { pal: { a: CORAL }, dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  M('k-uydu-tik', gA, 'tik', 1735, 650, 120, n[3].t + 0.45, tKart, { pal: { a: GREEN }, dur: 0.7, cd: 0.4, cikis: 'kuculerek-cik' });
  SORU('a-soru', gA, 1560, 210, 190, n[2].t + 0.1, n[3].t - 0.1);

  // n3 — Ay sola yerleşince etiketler
  const e3 = n[3].t + 2.1;
  T('a-etiket1', gA, "DÜNYA'NIN TEK", 1060, 790, 60, e3, t1, { font: F_BASLIK, weight: 900, anim: 'harf-belir', cikis: false });
  T('a-etiket2', gA, 'DOĞAL UYDUSU', 1060, 880, 68, e3 + 0.5, t1, { font: F_BASLIK, weight: 900, color: INK, box: { color: HILITE, radius: 26, padding: [8, 30], opacity: 1 }, giris: 'zipla-gir', anim: false, cikis: false });

  // n3 sonu — Dünya + en yakın komşu oku
  const d3 = e3 + 0.6;
  M('dunya-a', gA, 'dunya-cizim', 1700, 560, 230, d3, t1, { dur: 1.4, cikis: false, idle: 7 });
  OK('ok-yakin', gA, 'ay-ana', 'dunya-a', d3 + 0.7, { stil: 'ok-cift-uclu', color: INK, width: 6, bend: -0.2, label: 'en yakın', labelOffset: -42, labelColor: CORAL, dur: 1.0, end: t1 });
  T('a-yakin', gA, 'EN YAKIN GÖK CİSMİ', 1400, 215, 56, d3 + 0.3, t1, { font: F_BASLIK, weight: 900, color: INK, box: { color: '#ffe0d6', radius: 26, padding: [10, 34], opacity: 1 }, giris: 'zipla-gir', anim: false, cikis: false });

  // n4 — küre
  T('a-kure', gA, 'İKİSİ DE KÜRESEL', 1380, 960, 54, n[4].t + 0.3, t1, { font: F_BASLIK, weight: 900, color: '#6b4fc9', anim: 'harf-zipla', cikis: false });
  M('a-halka-ay', gA, 'yorunge-halka-cizim', 1060, 530, 470, n[4].t + 0.6, t1, { pal: { a: CORAL }, dur: 1.2, cikis: false });
  M('a-halka-dunya', gA, 'yorunge-halka-cizim', 1700, 560, 290, n[4].t + 1.0, t1, { pal: { a: CORAL }, dur: 1.2, cikis: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM B — IŞIĞI KİMİN?  (kendi ışığı yok → Güneş'in ışığını yansıtır)
// ═══════════════════════════════════════════════════════════════════════════
const gB = 'g-b';
{
  const t0 = tB, t1 = tC;
  yika('b-yika', gB, '#ffeebd', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('b-yika2', gB, '#cfe4fb', 1520, 320, 700, t0 + 0.3, t1, { op: 0.85, rot: 70 });
  const q = n[5].t, a6 = n[6].t;
  // n5 — gece gökyüzü parıltısı + soru
  const b = M('b-ay', gB, 'ay-cizim', 1040, 540, 420, t0 + 0.2, t1, { dur: 1.6, cikis: false, idle: 6 });
  b.x = [k(t0 + 0.2, 1040), k(a6 + 0.3, 1040), k(a6 + 1.5, 1340, 'inOutCubic')];
  b.y = [k(t0 + 0.2, 540), k(a6 + 0.3, 540), k(a6 + 1.5, 640, 'inOutCubic')];
  b.scale = pxk('ay-cizim', [{ t: t0 + 0.2, px: 420 }, { t: a6 + 0.3, px: 420 }, { t: a6 + 1.5, px: 320, ease: 'inOutCubic' }]);
  L({ id: 'b-yildiz', group: gB, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', x: 1040, y: 540, start: r2(t0 + 0.4), end: r2(a6 - 0.2), colors: ['#fff6b8', '#ffffff', '#d9ccff'], count: 22, opacity: 0.9, sfx: false });
  hap('b-parlak', gB, 'gecenin en parlak komşusu', 1040, 860, 640, 40, '#fff0a6', t0 + 0.9, q + 3.8, { h: 84 });
  SORU('b-soru', gB, 1560, 300, 190, q + 1.8, a6 - 0.1, 10);
  hap('b-kendi', gB, 'kendi ışığı mı?', 1560, 480, 500, 42, '#ffe9c7', q + 3.0, a6 - 0.1, { h: 86 });

  // n6 — Güneş → Ay → Dünya
  M('b-gunes', gB, 'gunes-cizim', 1720, 300, 300, a6 + 0.3, t1, { dur: 1.4, parts: isinDon(a6, SURE, -540), cikis: false });
  M('b-dunya', gB, 'dunya-cizim', 960, 850, 240, a6 + 2.4, t1, { dur: 1.2, cikis: false, idle: 6 });
  OK('b-ok1', gB, 'b-gunes', 'b-ay', a6 + 1.7, { stil: 'ok-kavis', color: '#ffb300', width: 9, bend: -0.2, label: 'ışık', labelOffset: -38, labelColor: '#e69500', dur: 1.0, end: t1 });
  OK('b-ok2', gB, 'b-ay', 'b-dunya', a6 + 3.4, { stil: 'ok-kavis', color: '#6aa6e8', width: 8, bend: 0.25, label: 'yansıyan ışık', labelOffset: 48, labelColor: '#4a86c8', dur: 1.0, end: t1 });
  M('b-x', gB, 'carpi', 1330, 420, 200, a6 + 0.35, a6 + 3.9, { pal: { a: CORAL }, giris: 'zipla-gir', dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  hap('b-t1', gB, 'IŞIK KAYNAĞI DEĞİL', 1330, 190, 600, 48, '#ffe0d6', a6 + 0.5, a6 + 4.0, { h: 98, t: { font: F_BASLIK, weight: 900 } });
  hap('b-t2', gB, "GÜNEŞ'İN IŞIĞINI YANSITIR", 1330, 190, 820, 48, '#fff0a6', a6 + 4.2, t1, { h: 98, kutu: { cikis: false }, t: { font: F_BASLIK, weight: 900 } });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM C — YÜZEYİ  (küçük komşu → hava olayı yok → meteor/krater → sıcaklık farkı → yer şekilleri)
// ═══════════════════════════════════════════════════════════════════════════
const gC = 'g-c';
{
  const t0 = tC, t1 = tD;
  yika('c-yika', gC, '#d6e2f7', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('c-yika2', gC, '#ffdbe8', 1560, 800, 700, t0 + 0.3, t1, { op: 0.85, rot: 20 });
  const a7 = n[7].t, a8 = n[8].t, a9 = n[9].t, a10 = n[10].t, a11 = n[11].t, a12 = n[12].t;

  // n7 — boyut kıyası: Dünya'nın çapı = 4 Ay
  const cm = a8 - 0.5;
  M('c-dunya', gC, 'dunya-cizim', 1000, 520, 400, t0 + 0.2, cm, { dur: 1.4, idle: 6, cikis: 'kuculerek-cik', cd: 0.5 });
  M('c-ay', gC, 'ay-cizim', 1500, 520, 100, a7 + 1.0, cm, { dur: 1.0, idle: 3, cikis: 'kuculerek-cik', cd: 0.5 });
  T('c-dunya-t', gC, 'DÜNYA', 1000, 770, 52, t0 + 0.8, cm, { font: F_BASLIK, weight: 900 });
  T('c-ay-t', gC, 'AY', 1500, 620, 52, a7 + 1.4, cm, { font: F_BASLIK, weight: 900, color: CORAL });
  // dörtlü ay sırası (Dünya'nın çapı içine 4 Ay sığar)
  [0, 1, 2, 3].forEach((i) => M(`c-sira${i}`, gC, 'ay-cizim', 1000 - 150 + i * 100, 940, 92, a7 + 3.2 + i * 0.35, cm, { dur: 0.5, giris: 'zipla-gir', cikis: 'kuculerek-cik', cd: 0.4 }));
  hap('c-oran', gC, "ÇAPI ≈ DÜNYA'NIN ÇAPININ 1/4'Ü", 1340, 190, 1020, 46, '#fff0a6', a7 + 2.6, cm, { h: 96, t: { font: F_BASLIK, weight: 900 } });

  // n8–n12: Ay zemini
  const zk = 1300 / SIZE('ay-yuzeyi-cizim')[0], zs = SIZE('ay-yuzeyi-cizim');
  const zx = (ax) => r2(1340 + (ax - zs[0] / 2) * zk), zy = (ay) => r2(810 + (ay - zs[1] / 2) * zk);
  M('c-zemin', gC, 'ay-yuzeyi-cizim', 1340, 810, 1300, a8 + 0.1, t1, { dur: 1.8, cikis: false });
  // n8 soru: rüzgâr mı, yağmur mu?
  M('c-ruzgar', gC, 'ruzgar-cizim', 1080, 400, 250, a8 + 0.8, a10 - 0.4, { dur: 1.2, cikis: 'kuculerek-cik', cd: 0.4, idle: 8 });
  M('c-bulut', gC, 'bulut-cizim', 1580, 380, 300, a8 + 1.4, a10 - 0.4, { dur: 1.2, cikis: 'kuculerek-cik', cd: 0.4, idle: 8 });
  SORU('c-soru', gC, 1330, 330, 170, a8 + 2.4, a9 - 0.1, -8);
  // n9 cevap: iki çarpı + etiket
  M('c-x1', gC, 'carpi', 1080, 400, 190, a9 + 0.2, a10 - 0.4, { pal: { a: CORAL }, giris: 'zipla-gir', dur: 0.5, cd: 0.4, cikis: 'kuculerek-cik' });
  M('c-x2', gC, 'carpi', 1580, 380, 190, a9 + 0.9, a10 - 0.4, { pal: { a: CORAL }, giris: 'zipla-gir', dur: 0.5, cd: 0.4, cikis: 'kuculerek-cik' });
  hap('c-atm', gC, 'ATMOSFER YOK DENECEK KADAR AZ', 1340, 170, 1000, 44, '#e6defb', a9 + 1.4, a10 - 0.4, { h: 92, t: { font: F_BASLIK, weight: 900 } });
  // n10: meteor → krater
  const hit = a10 + 3.4;
  const m = M('c-meteor', gC, 'meteor-cizim', 900, 180, 240, a10 + 0.3, hit, { giris: 'belir', dur: 0.3, cikis: false });
  m.x = [k(a10 + 0.3, 880), k(hit, zx(430), 'inCubic')];
  m.y = [k(a10 + 0.3, 160), k(hit, zy(176) - 40, 'inCubic')];
  M('c-krater', gC, 'krater-cizim', zx(430), zy(176) + 26, 280, hit, a11 - 0.4, { giris: 'zipla-gir', dur: 0.6, cikis: 'kuculerek-cik', cd: 0.4 });
  L({ id: 'c-toz', group: gC, type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: zx(430), y: zy(176), start: r2(hit), end: r2(a11 - 0.4), colors: ['#e3dac0', '#c5bb9c', '#fff0a6'], count: 36, sfx: false });
  T('c-krater-t', gC, 'KRATER', 1340, 215, 100, hit + 0.3, a11 - 0.4, { font: F_BASLIK, weight: 900, color: '#8a6a3a', anim: 'harf-zipla', cikis: 'kuculerek-cik' });
  T('c-meteor-t', gC, 'meteor çarpması', 900, 330, 46, a10 + 0.8, hit - 0.2, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  // n11: sıcaklık farkı
  const termo = (id, x, seviye, renk, ad, t, asset, px) => {
    M(`${id}-m`, gC, 'termometre-cizim', x, 440, 330, t, a12 - 0.4, { dur: 1.0, parts: { civa: { scaleY: [k(t + 0.4, 0), k(t + 2.2, seviye, 'outCubic')] } }, cd: 0.4, cikis: 'kuculerek-cik' });
    T(`${id}-t`, gC, ad, x, 640, 40, t + 0.5, a12 - 0.4, { font: F_BASLIK, weight: 900, color: renk });
    M(`${id}-s`, gC, asset, x + 190, 380, px, t + 0.6, a12 - 0.4, { dur: 0.9, cd: 0.4, cikis: 'kuculerek-cik', ...(asset === 'gunes-cizim' ? { parts: isinDon(t, SURE, -540) } : {}) });
  };
  termo('c-t1', 980, 0.95, CORAL, 'GÜNDÜZ', a11 + 0.2, 'gunes-cizim', 150);
  termo('c-t2', 1560, 0.12, '#5a8de0', 'GECE', a11 + 1.4, 'ay-cizim', 130);
  hap('c-fark', gC, 'KAYAÇLAR HIZLA TOZA DÖNÜŞÜR', 1340, 175, 980, 42, '#ffe0d6', a11 + 3.2, a12 - 0.4, { h: 92, t: { font: F_BASLIK, weight: 900 } });
  // n12: yer şekilleri
  ETIKET('c-dag', gC, 'dağlık bölgeler', 960, 420, [zx(190), zy(50)], a12 + 0.5, t1, '#6b4fc9', { dx: 120, dy: 30, bend: -0.2 });
  ETIKET('c-vadi', gC, 'vadiler', 860, 640, [zx(120), zy(130)], a12 + 2.0, t1, '#2e9e72', { dx: 40, dy: 30, bend: 0.2 });
  ETIKET('c-kaya', gC, 'kayalıklar', 1700, 560, [zx(276), zy(170)], a12 + 3.4, t1, CORAL, { dx: -40, dy: 40, bend: -0.25 });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM D — HAREKETLERİ  (3 hareket → hep aynı yüz → karanlık yüz → soru: neden farklı?)
// ═══════════════════════════════════════════════════════════════════════════
const gD = 'g-d';
{
  const t0 = tD, t1 = tE;
  yika('d-yika', gD, '#e1ecd0', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('d-yika2', gD, '#ffd6e6', 1500, 380, 800, t0 + 0.3, t1, { op: 0.85, rot: 30 });
  const a13 = n[13].t, a14 = n[14].t, a15 = n[15].t, a16 = n[16].t, a17 = n[17].t, a18 = n[18].t;
  const sistemSon = a17 - 0.4;
  const cx = 1080, cy = 600, R = 270;

  // n13 — "3 hareket" + soru
  T('d-baslik', gD, 'AY HİÇ DURMAZ!', 1260, 140, 80, t0 + 0.4, a14 - 0.2, { font: F_BASLIK, weight: 900, color: INK, aralik: 0.05, cikis: 'kuculerek-cik' });
  M('d-dunya', gD, 'dunya-cizim', cx, cy, 200, t0 + 0.2, sistemSon, { dur: 1.4, idle: 5, cikis: 'kuculerek-cik', cd: 0.5 });
  M('d-halka', gD, 'yorunge-halka-cizim', cx, cy, R * 2, t0 + 0.8, sistemSon, { pal: { a: '#b6a5ee' }, dur: 1.6, cikis: 'kuculerek-cik', cd: 0.5 });
  M('d-gunes', gD, 'gunes-cizim', 1700, 280, 270, t0 + 1.0, sistemSon, { dur: 1.4, parts: isinDon(t0, SURE, -540), cikis: 'kuculerek-cik', cd: 0.5 });
  SORU('d-soru', gD, 1560, 490, 150, a13 + 1.8, a14 - 0.1, 12, '#9b7fe8');
  // Ay: önce sağda durur (n13–14), n14'te kendi etrafında döner, n15'te Dünya etrafında dolanır
  const o = yorunge(cx, cy, R, a15 + 0.2, a16 - 0.3, 1.0, 0);
  const ayD = M('d-ay', gD, 'ay-cizim', cx + R, cy, 120, a13 + 0.8, sistemSon, { dur: 1.0, cikis: 'kuculerek-cik', cd: 0.5 });
  ayD.x = [k(a13 + 0.8, cx + R), ...o.x, k(a16 + 0.2, cx + R)];
  ayD.y = [k(a13 + 0.8, cy), ...o.y, k(a16 + 0.2, cy)];
  ayD.rotation = [k(a14 + 0.2, 0), k(a15 - 0.3, -360, 'linear'), k(a16 - 0.3, -360 - 360, 'linear'), k(sistemSon, -1100, 'linear')];
  // n14 — kendi ekseni: dönüş oku
  const dn = M('d-don-ok', gD, 'donus-oku-cizim', cx + R, cy, 210, a14 + 0.3, a15 - 0.2, { pal: { a: CORAL }, dur: 1.0, cikis: 'kuculerek-cik', cd: 0.4 });
  dn.rotation = [k(a14 + 0.3, 0), k(a15 - 0.2, -250, 'linear')];
  // sağdaki üç madde (sırayla)
  const chip = (id, text, y, t, renk) => hap(id, gD, text, 1670, y, 540, 28, renk, t, sistemSon, { h: 70, t: { font: F_BASLIK, weight: 900 } });
  chip('d-c1', '1 · KENDİ EKSENİ ETRAFINDA', 540, a14 + 1.0, '#ffe0d6');
  chip('d-c2', "2 · DÜNYA'NIN ETRAFINDA", 690, a15 + 1.0, '#d9f3ea');
  chip('d-c3', "3 · GÜNEŞ'İN ETRAFINDA", 840, a16 + 1.0, '#e6defb');
  T('d-s1', gD, '27 gün 8 saat', 1670, 602, 34, a14 + 1.6, sistemSon, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir' });
  T('d-s2', gD, '27 gün 8 saat', 1670, 752, 34, a15 + 1.6, sistemSon, { font: F_EL, weight: 400, color: '#2e9e72', anim: 'harf-belir' });
  T('d-s3', gD, '365 gün 6 saat', 1670, 902, 34, a16 + 1.6, sistemSon, { font: F_EL, weight: 400, color: '#6b4fc9', anim: 'harf-belir' });
  // n16 — Dünya + Ay Güneş'e doğru birlikte ilerler
  OK('d-ok-gunes', gD, 'd-dunya', 'd-gunes', a16 + 0.6, { stil: 'ok-kavis', color: '#ffb300', width: 7, bend: -0.35, dur: 1.2, end: sistemSon });
  const dd = layers.find((l) => l.id === 'd-dunya');
  const dx = (o2) => [k(t0 + 0.2, o2), k(a16 + 0.4, o2), k(a16 + 3.5, o2 + 90, 'inOutSine'), k(sistemSon, o2 + 90)];
  void dd; void dx;

  // n17 — hep aynı yüz / karanlık yüz
  const ex = 1060, ey = 540, ez = 1620;
  M('d-on', gD, 'ay-cizim', ex, ey, 360, a17 + 0.1, a18 - 0.5, { dur: 1.2, idle: 5, cikis: 'kuculerek-cik', cd: 0.5 });
  M('d-kar', gD, 'ay-cizim', ez, ey, 360, a17 + 1.6, a18 - 0.5, { dur: 1.2, pal: KOYU_AY, idle: 5, cikis: 'kuculerek-cik', cd: 0.5 });
  M('d-bant', gD, 'bant-cizim', ez, ey - 215, 190, a17 + 2.6, a18 - 0.5, { pal: { a: PINK }, rot: -4, dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  T('d-on-t', gD, 'GÖRDÜĞÜMÜZ YÜZ', ex, 800, 46, a17 + 0.6, a18 - 0.5, { font: F_BASLIK, weight: 900 });
  T('d-kar-t', gD, 'KARANLIK YÜZ', ez, 800, 46, a17 + 2.0, a18 - 0.5, { font: F_BASLIK, weight: 900, color: '#6b4fc9' });
  OK('d-ok-esit', gD, [ex + 200, ey], [ez - 200, ey], a17 + 1.0, { stil: 'ok-cift-uclu', color: CORAL, width: 6, bend: 0.1, dur: 1.0, end: a18 - 0.5 });
  T('d-hep', gD, 'hep aynı yüz', 1340, 200, 76, a17 + 1.2, a18 - 0.5, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  T('d-esit', gD, 'dönme süresi = dolanma süresi', 1340, 920, 44, a17 + 3.4, a18 - 0.5, { font: F_EL, weight: 400, color: INK, anim: 'harf-belir', cikis: 'kuculerek-cik' });

  // n18 — soru: neden farklı şekillerde? (evre ipucu)
  const ev = ['ay-evre-hilal-cizim', 'ay-evre-dordun-cizim', 'ay-evre-sisk-cizim', 'ay-cizim'];
  ev.forEach((a, i) => M(`d-ev${i}`, gD, a, 1010 + i * 230, 620, 190, a18 + 0.2 + i * 0.35, t1, { dur: 0.9, cikis: false, idle: 6 }));
  SORU('d-soru2', gD, 1340, 330, 200, a18 + 0.3, t1, -8, '#9b7fe8');
  T('d-farkli', gD, 'neden her gece farklı?', 1340, 840, 60, a18 + 1.4, t1, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM E — EVRELERİ  (Ay Dünya'nın etrafında → ışık farklı açıdan → 8 evre)
// ═══════════════════════════════════════════════════════════════════════════
const gE = 'g-e';
{
  const t0 = tE, t1 = tF;
  yika('e-yika', gE, '#d3d7f8', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('e-yika2', gE, '#ffe9b8', 1580, 800, 700, t0 + 0.3, t1, { op: 0.85, rot: 50 });
  const a19 = n[19].t, a20 = n[20].t, a21 = n[21].t, a22 = n[22].t, a23 = n[23].t;
  const gSon = a20 - 0.4;
  // n19 — diyagram: Güneş sağda, Dünya ortada, Ay yörüngede bir tam tur
  const cx = 1050, cy = 580, R = 300;
  T('e-baslik', gE, "AY'IN EVRELERİ", 1190, 125, 72, t0 + 0.3, gSon, { font: F_BASLIK, weight: 900, color: INK, aralik: 0.05, cikis: 'kuculerek-cik' });
  M('e-gunes', gE, 'gunes-cizim', 1700, 580, 250, t0 + 0.2, gSon, { dur: 1.4, parts: isinDon(t0, SURE, -540), cikis: 'kuculerek-cik', cd: 0.5 });
  M('e-dunya', gE, 'dunya-cizim', cx, cy, 170, t0 + 0.3, gSon, { dur: 1.2, idle: 4, cikis: 'kuculerek-cik', cd: 0.5 });
  M('e-halka', gE, 'yorunge-halka-cizim', cx, cy, R * 2, t0 + 0.7, gSon, { pal: { a: '#b6a5ee' }, dur: 1.5, cikis: 'kuculerek-cik', cd: 0.5 });
  OK('e-isik', gE, 'e-gunes', 'e-dunya', a19 + 0.5, { stil: 'ok-kavis', color: '#ffb300', width: 8, bend: 0.0, label: 'Güneş ışığı', labelOffset: -44, labelColor: '#e69500', dur: 1.0, end: gSon, extra: { fromAnchor: 'sol', toAnchor: 'sag' } });
  const tur = yorunge(cx, cy, R, a19 + 1.2, gSon - 0.2, 1.0, 0);
  const em = M('e-ay', gE, 'ay-cizim', cx + R, cy, 110, a19 + 0.9, gSon, { dur: 0.8, cikis: 'kuculerek-cik', cd: 0.4 });
  em.x = [k(a19 + 0.9, cx + R), ...tur.x]; em.y = [k(a19 + 0.9, cy), ...tur.y];
  // Dünya'dan görünüş penceresi: 8 evre zamanla değişir (Ay yörüngede ilerledikçe)
  const pen = [1130, 330];
  kutu('e-pencere', gE, 'kart-kare', 1700, 280, 300, 310, '#ffffff', a19 + 1.0, gSon, { style: 'cizim', dur: 0.6 });
  T('e-pencere-t', gE, "Dünya'dan görünüş", 1700, 150, 28, a19 + 1.2, gSon, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  void pen;
  const evSira = [['ay-evre-yeni-cizim', 1], ['ay-evre-hilal-cizim', 1], ['ay-evre-dordun-cizim', 1], ['ay-evre-sisk-cizim', 1], ['ay-cizim', 1], ['ay-evre-sisk-cizim', -1], ['ay-evre-dordun-cizim', -1], ['ay-evre-hilal-cizim', -1]];
  const adim = (gSon - 0.2 - (a19 + 1.2)) / 8;
  evSira.forEach(([a, yon], i) => {
    const ta = i === 0 ? a19 + 1.1 : a19 + 1.2 + adim * i - 0.1, tb = i === 7 ? gSon : a19 + 1.2 + adim * (i + 1) - 0.1;
    M(`e-g${i}`, gE, a, 1700, 300, 200, ta, tb, { giris: 'belir', dur: 0.2, cikis: false, ...(yon < 0 ? { sx: -1 } : {}) });
  });

  // n20 — 8 evre ızgarası (2 × 4), isimleriyle
  const adlar = ['YENİ AY', 'HİLAL', 'İLK DÖRDÜN', 'ŞİŞKİN AY', 'DOLUNAY', 'ŞİŞKİN AY', 'SON DÖRDÜN', 'HİLAL'];
  const px = [1000, 1250, 1500, 1750];
  const pos = (i) => [px[i % 4], i < 4 ? 380 : 760];
  const ge = [];
  evSira.forEach(([a, yon], i) => {
    const [x, y] = pos(i), t = a20 + 0.2 + i * (n[20].d - 1.0) / 8;
    const sc = r2(190 / Math.max(...SIZE(a)));
    const ml = M(`e-i${i}`, gE, a, x, y, 190, t, t1, { dur: 0.6, giris: 'zipla-gir', cikis: false, idle: 4, ...(yon < 0 ? { sx: -1 } : {}) });
    ge.push(ml);
    T(`e-n${i}`, gE, `${i + 1}`, x - 100, y - 100, 44, t + 0.2, t1, { font: F_BASLIK, weight: 900, color: CORAL, anim: 'harf-zipla', cikis: false });
    T(`e-a${i}`, gE, adlar[i], x, y + 128, 32, t + 0.3, t1, { font: F_BASLIK, weight: 900, anim: 'harf-belir', cikis: false });
  });
  hap('e-ana', gE, 'ANA EVRELER: 1 · 3 · 5 · 7  (≈ 1 hafta arayla)', 1375, 1010, 1000, 32, '#fff0a6', a20 + 3.4, t1, { h: 66, kutu: { cikis: false }, t: { font: F_BASLIK, weight: 900 } });
  // n21–23: vurgu halkaları
  const ring = (id, i, t, bit) => M(id, gE, 'yorunge-halka-cizim', pos(i)[0], pos(i)[1], 235, t, bit, { pal: { a: CORAL }, dur: 0.6, cikis: 'kuculerek-cik', cd: 0.3 });
  ring('e-h0', 0, a21 + 0.3, a21 + 4.8);
  ring('e-h1', 1, a21 + 3.6, a22 - 0.3);
  ring('e-h2', 2, a22 + 0.3, a22 + 3.0);
  ring('e-h3', 3, a22 + 2.2, a22 + 3.8);
  ring('e-h4', 4, a22 + 3.6, a23 - 0.3);
  ring('e-h5', 5, a23 + 0.3, a23 + 1.9);
  ring('e-h6', 6, a23 + 1.5, a23 + 3.1);
  ring('e-h7', 7, a23 + 2.7, t1);
  hap('e-yeni-t', gE, 'aydınlık yüzü bize bakmaz → görünmez', 1375, 200, 1000, 36, '#e6defb', a21 + 0.4, a21 + 4.6, { h: 80, t: { font: F_BASLIK, weight: 900 } });
  hap('e-dolu-t', gE, 'en büyük ve en parlak hâli!', 1375, 200, 820, 40, '#fff0a6', a22 + 3.6, a23 - 0.2, { h: 86, t: { font: F_BASLIK, weight: 900 } });
  L({ id: 'e-pirilti', group: gE, type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: pos(4)[0], y: pos(4)[1], start: r2(a22 + 3.8), end: r2(a23 - 0.2), colors: [BUTTER, '#fff6b8', '#ffffff'], count: 36, sfx: false });
  T('e-kuc', gE, 'sonra yine küçülür…', 1375, 200, 54, a23 + 0.5, t1, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM F — ÖZET + SON SORU
// ═══════════════════════════════════════════════════════════════════════════
const gF = 'g-f';
{
  const t0 = tF;
  yika('f-yika', gF, '#e3d9fb', 1340, 540, 1500, t0, null, { op: 0.9 });
  yika('f-yika2', gF, '#ffd9b8', 1580, 780, 700, t0 + 0.3, null, { op: 0.85, rot: 10 });
  const a24 = n[24].t, a25 = n[25].t;
  const cardEnd = a25 + 1.2;
  kutu('f-kart', gF, 'kart-kare', 1340, 560, 1000, 880, '#ffffff', t0 + 0.2, cardEnd, { style: 'cizim', dur: 0.8, rot: 0 });
  M('f-ay', gF, 'ay-cizim', 1745, 235, 170, a24 + 0.1, cardEnd, { dur: 1.2, cd: 0.4, cikis: 'kuculerek-cik', idle: 5 });
  T('f-baslik', gF, 'AY KİMLİK KARTI', 1280, 200, 58, a24 + 0.1, cardEnd, { font: F_BASLIK, weight: 900, adur: 0.4 });
  const maddeler = [
    "Dünya'nın tek doğal uydusu",
    "Kendi ışığı yok: Güneş'i yansıtır",
    "Çapı ≈ Dünya'nın çapının 1/4'ü",
    'Atmosferi yok denecek kadar az',
    'Yüzeyi kraterli, kayalık ve dağlık',
    "Dünya'yı 27 gün 8 saatte dolanır",
    'Hep aynı yüzünü görürüz; 8 evresi var',
  ];
  maddeler.forEach((m, i) => {
    const y = 330 + i * 98, t = a24 + 0.5 + i * 0.95;
    M(`f-tik${i}`, gF, 'tik', 905, y, 54, t, cardEnd, { pal: { a: GREEN }, giris: 'zipla-gir', dur: 0.5, cd: 0.4, cikis: 'kuculerek-cik' });
    T(`f-m${i}`, gF, m, 960, y, 42, t + 0.1, cardEnd, { align: 'left', anim: 'harf-belir', aralik: 0.02, cikis: 'kuculerek-cik' });
  });
  // Son soru: gece, Ay yok
  const gece = M('f-gece', gF, 'kare', 960, 540, 2600, a25 + 0.2, null, { pal: { a: NIGHT }, style: 'duz', giris: 'belir', dur: 2.6, cikis: false, op: 0.0 });
  gece.scaleX = r2(2000 / 200); gece.scaleY = r2(1200 / 200); gece.anims = []; gece.opacity = [k(a25 + 0.2, 0), k(a25 + 3.0, 0.93, 'inOutSine')];
  const sol = M('f-ay2', gF, 'ay-cizim', 1340, 520, 400, a25 + 0.4, null, { dur: 1.4, cikis: false });
  sol.anims = [AN('cizerek-gir', a25 + 0.4, 1.4)]; sol.opacity = [k(a25 + 1.8, 1), k(a25 + 6.0, 0.0, 'inOutSine')];
  L({ id: 'f-yildizlar', group: gF, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: r2(a25 + 2.4), colors: ['#fff6b8', '#ffffff', '#d9ccff'], count: 36, opacity: 0.9, sfx: false });
  T('f-son', gF, 'Ay olmasaydı?', 1330, 190, 104, a25 + 1.8, null, { font: F_BASLIK, weight: 900, color: '#fff6d8', adur: 0.5, aralik: 0.05, cikis: false });
  hap('f-yorum', gF, 'düşün ve yorumlara yaz!', 1340, 900, 700, 52, '#fff0a6', a25 + 4.0, null, { h: 110, t: { font: F_EL, weight: 400 }, kutu: { cikis: false } });
}

// ─── Bölüm sekmeleri (sağ üst köşe) ────────────────────────────────────────
{
  const S = [[0, tB, '1 · Kim bu?', PEACH], [tB, tC, '2 · Işığı kimin?', '#ffe58f'], [tC, tD, '3 · Yüzeyi', SKY], [tD, tE, '4 · Hareketleri', MINT], [tE, tF, '5 · Evreleri', LILAC]];
  S.forEach(([a, b, ad, renk], i) => {
    const t = a + (i === 0 ? 0.6 : 0.8);
    hap(`tab${i}`, `g-${'abcde'[i]}`, ad, 1680, 62, 420, 34, renk, t, b, { h: 70, kutu: { style: 'cizim' } });
  });
}

// ─── GÖZLÜ — anlatıcı (en üstte) ───────────────────────────────────────────
const soz = (i, metin, extra = {}) => ({ t: n[i].t, sure: n[i].d, metin: metin ?? SATIR[i - 1], ...extra });
const gozlu = K('gozlu', {
  id: 'gozlu', konum: [0.145, 0.955], boy: 0.64, varyant: 'mavi', ekler: ['sac-tutam'], start: 0.1, giris: 'zipla-gir',
  balon: { font: F_GOVDE, boyut: 42, genislik: 700, zemin: '#ffffff', yazi: INK },
  akis: [
    { t: 0.3, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 },
    { t: n[1].t + 3.0, aksiyon: 'isaret', hedef: 'ay-ana', duygu: 'mutlu', bak: 'ay-ana', sure: 2.4 },
    { t: n[2].t, aksiyon: 'dusun', duygu: 'dusunceli' },
    { t: n[3].t, aksiyon: 'sevin', duygu: 'cok-mutlu', sure: 1.6 },
    { t: n[3].t + 2.2, aksiyon: 'tanit', hedef: 'dunya-a', duygu: 'mutlu', sure: 2.4 },
    { t: n[4].t + 0.3, aksiyon: 'anlat', duygu: 'mutlu', bak: 'ay-ana' },
    // B
    { t: n[5].t, aksiyon: 'isaret', hedef: 'b-ay', duygu: 'mutlu', bak: 'b-ay' },
    { t: n[5].t + 3.6, aksiyon: 'dusun', duygu: 'dusunceli' },
    { t: n[6].t, aksiyon: 'hayir', duygu: 'mutlu', sure: 1.4 },
    { t: n[6].t + 2.0, aksiyon: 'tanit', hedef: 'b-gunes', duygu: 'cok-mutlu', bak: 'b-gunes' },
    // C
    { t: n[7].t, aksiyon: 'tanit', hedef: 'c-dunya', duygu: 'mutlu', bak: 'c-ay' },
    { t: n[8].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'c-ruzgar' },
    { t: n[9].t, aksiyon: 'hayir', duygu: 'mutlu', sure: 1.4 },
    { t: n[10].t, aksiyon: 'isaret', hedef: 'c-meteor', duygu: 'saskin', bak: 'c-meteor' },
    { t: n[10].t + 3.6, aksiyon: 'tanit', hedef: 'c-krater', duygu: 'mutlu', bak: 'c-krater' },
    { t: n[11].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'c-t1-m' },
    { t: n[12].t, aksiyon: 'isaret', hedef: 'c-zemin', duygu: 'mutlu', bak: 'c-zemin' },
    // D
    { t: n[13].t, aksiyon: 'sevin', duygu: 'heyecanli', sure: 1.6 },
    { t: n[13].t + 2.0, aksiyon: 'dusun', duygu: 'dusunceli' },
    { t: n[14].t, aksiyon: 'isaret', hedef: 'd-ay', duygu: 'mutlu', bak: 'd-ay' },
    { t: n[15].t, aksiyon: 'tanit', hedef: 'd-halka', duygu: 'mutlu', bak: 'd-dunya' },
    { t: n[16].t, aksiyon: 'tanit', hedef: 'd-gunes', duygu: 'cok-mutlu', bak: 'd-gunes' },
    { t: n[17].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'd-on' },
    { t: n[18].t, aksiyon: 'omuz-silk', duygu: 'dusunceli', bak: 'd-ev1' },
    // E
    { t: n[19].t, aksiyon: 'tanit', hedef: 'e-halka', duygu: 'mutlu', bak: 'e-ay' },
    { t: n[20].t, aksiyon: 'sevin', duygu: 'mutlu', sure: 1.2 },
    { t: n[20].t + 1.6, aksiyon: 'isaret', hedef: 'e-i0', duygu: 'mutlu', bak: 'e-i2' },
    { t: n[21].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'e-i0' },
    { t: n[22].t, aksiyon: 'isaret', hedef: 'e-i4', duygu: 'cok-mutlu', bak: 'e-i4' },
    { t: n[23].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'e-i6' },
    // F
    { t: n[24].t, aksiyon: 'tanit', hedef: 'f-kart', duygu: 'mutlu', bak: 'f-kart' },
    { t: n[25].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'f-ay2' },
    { t: n[25].t + 5.4, aksiyon: 'el-salla', duygu: 'cok-mutlu', bak: 'ileri' },
  ],
  soz: SATIR.map((m, i) => soz(i + 1, m)),
  golge: true,
});
gozlu.group = 'g-gozlu';
L(gozlu);

// ─── Sahne ─────────────────────────────────────────────────────────────────
const eski = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects', PROJE_ID, 'scene.json'), 'utf8')); } catch { return { audio: [] }; } })();
const eskiSes = (f) => (eski.audio || []).find((a) => a.file === f);
const audio = [];
SES.forEach((f, i) => {
  const e = eskiSes(f) || { file: f, offset: 0, dur: null, volume: 1, fadeIn: 0, fadeOut: 0, mute: false };
  audio.push({ ...e, file: f, start: n[i + 1].t, volume: 1 });
});
const muzik = (eski.audio || []).filter((a) => /ay-dersi-muzik/.test(a.file));
muzik.forEach((m, i) => {
  const son = i === muzik.length - 1;
  audio.push({ ...m, volume: 0.2, ...(son ? { dur: r2(Math.max(10, SURE - m.start)), fadeOut: 3 } : {}) });
});

const scene = {
  name: 'Ay Dersi — Kıpır ile Gökyüzündeki Komşumuz',
  width: W, height: H, fps: FPS, duration: SURE,
  style: 'cizim',
  sketch: { ink: '#3d3a73', width: 3.4, wobble: 1.3, hatch: 5.5, angle: 62, cross: true, wipe: 35, grain: 0.3 },
  theme: {
    name: 'Gökyüzü Defteri', paper: 'pastel',
    colors: { arka1: '#fff7ec', arka2: '#ffe8da', baslik: '#3d3a73', metin: '#4a4780', vurgu: '#ff7f6e' },
    background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180, paper: 0.45, vignette: 0.16 },
  },
  camera: { zoom: 1 },
  publish: {
    title: 'Gökyüzündeki Komşumuz: AY 🌙 | 5. Sınıf Fen Bilimleri',
    description: "Kıpır ile Ay'ı keşfediyoruz! Ay bir yıldız mı, ışık kaynağı mı? Neden hep aynı yüzünü görürüz? Kraterler nasıl oluşur, Ay'ın üç hareketi nedir ve Ay'ın evreleri neden değişir? 5. sınıf Fen Bilimleri \"Gökyüzündeki Komşularımız ve Biz\" konusunun Ay bölümü, soru-cevap tadında ve çizimlerle. Beğen, abone ol ve Ay olmasaydı geceler nasıl olurdu, yorumlara yaz!",
    tags: ['ay', 'ay nedir', 'ay evreleri', 'ayın hareketleri', 'ayın karanlık yüzü', 'krater', '5. sınıf fen', 'fen bilimleri', 'gökyüzündeki komşularımız ve biz', 'dünyanın uydusu', 'çocuklar için bilim', 'eğitim videosu', 'animasyon', 'ders anlatımı'],
  },
  audio,
  sfx: { auto: true, volume: 0.45 },
  sections: [
    { t: 0, name: 'Kim bu?' }, { t: tB, name: 'Işığı kimin?' }, { t: tC, name: 'Yüzeyi' }, { t: tD, name: 'Hareketleri' }, { t: tE, name: 'Evreleri' }, { t: tF, name: 'Özet ve soru' },
  ],
  transitions: [
    { type: 'daire-ac', t: tB, dur: 1.0 },
    { type: 'jaluzi', t: tC, dur: 1.1, color: '#bfd3f0' },
    { type: 'sayfa-cevir', t: tD, dur: 1.2 },
    { type: 'mozaik', t: tE, dur: 1.1, color: '#c9b8f5' },
    { type: 'yildiz', t: tF, dur: 1.1, color: '#ffe3a8' },
  ],
  groups: [
    { id: 'g-a', name: '1 · Kim bu?' }, { id: 'g-b', name: '2 · Işığı kimin?', collapsed: true }, { id: 'g-c', name: '3 · Yüzeyi', collapsed: true },
    { id: 'g-d', name: '4 · Hareketleri', collapsed: true }, { id: 'g-e', name: '5 · Evreleri', collapsed: true }, { id: 'g-f', name: '6 · Özet ve soru', collapsed: true }, { id: 'g-gozlu', name: 'Kıpır' },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn · bölümler: B ${tB} · C ${tC} · D ${tD} · E ${tE} · F ${tF}`);
