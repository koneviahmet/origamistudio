// "Güneş Dersi — Kıpır ile Gökyüzündeki Komşumuz" (16:9, 5. sınıf Fen Bilimleri, kaynak: fenogren-tahta.netlify.app).
//   Önce modeller:  node scripts/seed-gunes-dersi.mjs
//   Sahne:          node scripts/scenes-gunes-dersi.mjs   →  data/projects/gunes-dersi/scene.json
// Konsept: "Gökyüzü Defteri" — pastel boya / çizim stilinde anlatım. Kıpır (çöp adam) anlatır ve soru sorar;
//   her bölüm bir SORU ile açılır, cevap sahnede çizilir. Seslendirme: d1-00574 (data/audio/gunes-dersi-ses-N.wav),
//   süreler wav dosyalarından okunur → tüm zamanlama anlatıma göre kurulur. Müzik: gunes-dersi-muzik.wav (ACE-Step).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { karakterBaglam } from './lib/karakter.mjs';
import { aboneBolumu, aboneMetinleri } from './lib/abone-bolumu.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJE_ID = 'gunes-dersi';
const W = 1920, H = 1080, FPS = 30;
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);
const K = karakterBaglam({ W, H });

// ─── Renkler / yazı tipleri ────────────────────────────────────────────────
const INK = '#3d3a73', CORAL = '#ff7f6e', BUTTER = '#ffd84d', PEACH = '#ffb88c', MINT = '#9be0c8', SKY = '#a9d6f5', LILAC = '#c9b8f5', PINK = '#ffc2d4';
const HILITE = '#fff0a6', GREEN = '#4cc38a';
const F_BASLIK = 'M PLUS Rounded 1c', F_GOVDE = 'Nunito', F_EL = 'Courgette';

// ─── Anlatım: metin + gerçek süre (wav) ────────────────────────────────────
const SATIR = [
  'Merhaba, ben Kıpır! Gökyüzünde her sabah bizi uyandıran bir komşumuz var.',
  'Sence o bir gezegen mi, yoksa bir yıldız mı?',
  'Cevap: yıldız! Güneş, orta büyüklükte bir yıldızdır.',
  "Üstelik Dünya'nın ısı ve ışık kaynağı da o!",
  'Peki Güneş neyden yapılmış? Katı bir kaya parçası mı?',
  'Hayır! Güneş gazlardan oluşur ve şekli küreseldir. Tıpkı Dünya gibi, katmanları vardır.',
  'Gazların yüzde yetmiş biri hidrojen, yüzde yirmi altı buçuğu helyum. Kalan yüzde iki buçuk ise diğer gazlar.',
  "Gökyüzünde Güneş'ten çok daha büyük yıldızlar var. Peki neden Güneş bize daha büyük görünüyor?",
  "Çünkü Güneş, Dünya'ya en yakın yıldız! Aramızda yaklaşık yüz elli milyon kilometre var.",
  "Güneş, Güneş Sistemi'nin tam merkezinde durur. Yaşı da yaklaşık beş milyar yıl. Yani çok yaşlı bir komşu!",
  "Güneş'in yüzüne yakından bakabilsek, karanlık bölgeler görürdük. Bunlara güneş lekeleri denir.",
  'Lekeler, çevresine göre daha soğuk bölgelerdir. Soğuk oldukları için daha karanlık görünürler.',
  "Güneş'in yüzeyini kendi yaptığı teleskopla ilk inceleyen bilim insanı, Galileo Galilei'dir.",
  'Galileo bir şey fark etti: lekeler, günler geçtikçe hep aynı yöne kayıyordu. Peki sence bu ne demek?',
  'Güneş, kendi etrafında dönüyor! Hem de saat yönünün tersine.',
  "Ama dikkat! Güneş'e çıplak gözle asla bakma. Gözlerine zarar verir.",
  "Dürbün, teleskop, mercek ya da kamerayla da Güneş'e bakılmaz!",
  "Güneş'i gözlemlemek için özel filtreler kullanılır. Bu filtreler, Güneş'e bakmayı güvenli hâle getirir.",
  'Hadi özetleyelim: Güneş, gazlardan oluşan, bize ısı ve ışık veren, dev bir yıldızdır.',
  'Şimdi sana bir sorum var: Güneş hiç olmasaydı, Dünya nasıl bir yer olurdu? Düşün ve yorumlara yaz!',
];
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
// Bitiş: beğen / yorum / abone ol (scripts/abone-satirlar.txt, ses: gunes-dersi-abone-N.wav)
const NA = SATIR.length;
SATIR.push(...aboneMetinleri(ROOT, fs, path));
const SES = SATIR.map((_, i) => (i < NA ? `gunes-dersi-kipir-ses-${i + 1}.wav` : `gunes-dersi-abone-${i - NA + 1}.wav`));
const D = SATIR.map((m, i) => r2(wavSure(path.join(ROOT, 'data', 'audio', SES[i])) ?? m.length / 14 + 0.6));

// ─── Zaman çizelgesi (anlatıma göre) ───────────────────────────────────────
// n(i) = i. satır (1..20): { t: başlangıç, d: süre, e: bitiş }
const TT = {};
let cur = 0.9;
const say = (i, sonra = 0.4) => { TT[i] = { t: r2(cur), d: D[i - 1], e: r2(cur + D[i - 1]) }; cur = cur + D[i - 1] + sonra; return TT[i]; };
const gec = (bekle, ac = 0.8) => { const tb = r2(cur - 0.4 + bekle); cur = tb + ac; return tb; }; // bölüm sınırı: önceki satırdan sonra `bekle` sn tut, geçiş, sonra yeni satır
say(1, 0.3); say(2, 2.4); say(3, 0.3); say(4, 0);
const tB = gec(1.9);
say(5, 1.7); say(6, 0.45); say(7, 0);
const tC = gec(1.6);
say(8, 2.2); say(9, 0.35); say(10, 0);
const tD = gec(2.0);
say(11, 0.4); say(12, 0.4); say(13, 0.5); say(14, 2.5); say(15, 0);
const tE = gec(1.7);
say(16, 0.4); say(17, 0.4); say(18, 0);
const tF = gec(1.4);
say(19, 0.6); say(20, 0);
const tG = gec(3.2, 0.9); // son soru ekranda kalır, sonra "abone ol" bölümü
say(21, 0.4); say(22, 0.4); say(23, 0);
const SON = TT[23].e;
const SURE = r2(SON + 3.6);
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

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM A — KİM BU?  (soru: gezegen mi, yıldız mı?)
// ═══════════════════════════════════════════════════════════════════════════
const gA = 'g-a';
{
  const t1 = tB;
  yika('a-yika', gA, '#ffd9b8', 1340, 540, 1500, 0, t1, { op: 0.9 });
  yika('a-yika2', gA, '#fff1a8', 1480, 780, 760, 0.4, t1, { op: 0.85, rot: 40 });
  // Güneş: başlangıçta büyük ortada; soruda küçülüp yukarı çıkar; cevapta sola yerleşir
  const sx = [k(0.3, 1340), k(n[2].t, 1340), k(n[2].t + 1.0, 1340, 'inOutCubic'), k(n[3].t + 1.4, 1340), k(n[3].t + 2.4, 1060, 'inOutCubic')];
  const sy = [k(0.3, 610), k(n[2].t, 610), k(n[2].t + 1.0, 340, 'inOutCubic'), k(n[3].t + 1.4, 340), k(n[3].t + 2.4, 520, 'inOutCubic')];
  const s = M('gunes-ana', gA, 'gunes-cizim', 1340, 540, 440, 0.3, t1, { dur: 2.4, cikis: false, parts: isinDon(0.3, SURE, -540) });
  s.x = sx; s.y = sy;
  s.scale = pxk('gunes-cizim', [{ t: 0.3, px: 440 }, { t: n[2].t, px: 440 }, { t: n[2].t + 1.0, px: 250, ease: 'inOutCubic' }, { t: n[3].t + 1.4, px: 250 }, { t: n[3].t + 2.4, px: 400, ease: 'inOutCubic' }]);

  // Başlık (açılış)
  T('a-baslik', gA, 'GÜNEŞ', 1340, 205, 150, 0.7, n[2].t - 0.2, { font: F_BASLIK, weight: 900, color: INK, adur: 0.5, aralik: 0.07, anims: [AN('nefes', 1.6, null, { genlik: 0.02, periyot: 2.4 })] });
  T('a-alt', gA, 'gökyüzündeki komşumuz', 1340, 315, 54, 1.7, n[2].t - 0.2, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir' });

  // n2 — soru kartları
  const q0 = n[2].t + 0.35;
  const kart = (id, x, ad, simge, renk, t0, t1, o = {}) => {
    kutu(`${id}-z`, gA, 'kart-kare', x, 765, 360, 300, renk, t0, t1, { style: 'cizim', dur: 0.6, anims: o.anims });
    M(`${id}-i`, gA, simge, x, 720, 130, t0 + 0.3, t1, { cikis: 'kuculerek-cik', cd: 0.45, dur: 1.0, anims: o.ianims });
    T(`${id}-t`, gA, ad, x, 850, 50, t0 + 0.35, t1, { font: F_BASLIK, weight: 900, adur: 0.4, ...(o.t || {}) });
  };
  const tKart = n[3].t + 1.7;
  kart('k-gez', 1110, 'GEZEGEN', 'dunya-cizim', '#ffd9e4', q0, tKart, { anims: [AN('titre', n[3].t + 0.3, null, { genlik: 4 })] });
  kart('k-yil', 1570, 'YILDIZ', 'yildiz', '#fff0a6', q0 + 0.25, tKart, { anims: [AN('nabiz', n[3].t + 0.35, null, { genlik: 0.07, periyot: 0.8 })] });
  // yıldız simgesine altın rengi, kartın kendi kenarına cevap işareti
  layers.find((l) => l.id === 'k-yil-i').palette = { a: '#ffc21a' };
  // cevap: çarpı + tik
  M('k-gez-x', gA, 'carpi', 1110, 740, 190, n[3].t + 0.2, tKart, { pal: { a: CORAL }, dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  M('k-yil-tik', gA, 'tik', 1735, 650, 120, n[3].t + 0.45, tKart, { pal: { a: GREEN }, dur: 0.7, cd: 0.4, cikis: 'kuculerek-cik' });
  // "?" büyük işareti
  T('a-soru', gA, '?', 1560, 210, 190, n[2].t + 0.1, n[3].t - 0.1, { font: F_EL, weight: 400, color: CORAL, rot: 10, anim: 'harf-zipla', anims: [AN('sallan', n[2].t + 1.0, null, { aci: 7, periyot: 1.6 })] });

  // n3 — etiket (Güneş sola yerleşince)
  const e3 = n[3].t + 2.1;
  T('a-etiket1', gA, 'ORTA BÜYÜKLÜKTE', 1060, 790, 60, e3, t1, { font: F_BASLIK, weight: 900, anim: 'harf-belir', cikis: false });
  T('a-etiket2', gA, 'BİR YILDIZ', 1060, 880, 68, e3 + 0.5, t1, { font: F_BASLIK, weight: 900, color: INK, box: { color: HILITE, radius: 26, padding: [8, 30], opacity: 1 }, giris: 'zipla-gir', anim: false, cikis: false });

  // n4 — Dünya + ısı / ışık okları
  const d4 = n[4].t;
  M('dunya-a', gA, 'dunya-cizim', 1700, 560, 230, d4 + 0.2, t1, { dur: 1.4, cikis: false, idle: 7 });
  OK('ok-isik', gA, 'gunes-ana', 'dunya-a', d4 + 0.9, { stil: 'ok-kavis', color: '#ffb300', width: 8, bend: -0.28, label: 'ışık', labelOffset: -38, labelColor: '#e69500', dur: 1.1, end: t1 });
  OK('ok-isi', gA, 'gunes-ana', 'dunya-a', d4 + 1.6, { stil: 'ok-dalga', color: CORAL, width: 7, bend: 0.28, label: 'ısı', labelOffset: 46, labelColor: CORAL, dur: 1.1, end: t1, extra: { waves: 4, amp: 12 } });
  T('a-isik-isi', gA, 'ISI + IŞIK KAYNAĞI', 1400, 250, 58, d4 + 0.4, t1, { font: F_BASLIK, weight: 900, color: INK, box: { color: '#ffe0d6', radius: 26, padding: [10, 34], opacity: 1 }, giris: 'zipla-gir', anim: false, cikis: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM B — NEYDEN YAPILMIŞ?  (soru → katmanlı gaz küre → hidrojen/helyum grafiği)
// ═══════════════════════════════════════════════════════════════════════════
const gB = 'g-b';
{
  const t0 = tB, t1 = tC;
  yika('b-yika', gB, '#cdf0e2', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('b-yika2', gB, '#d3e9fb', 1520, 320, 700, t0 + 0.3, t1, { op: 0.85, rot: 70 });
  // n5 — soru: tek Güneş + soru işaretleri
  const q = n[5].t;
  M('b-gunes', gB, 'gunes-cizim', 1340, 560, 400, t0 + 0.2, q + n[5].d + 1.2, { dur: 1.6, parts: isinDon(t0, SURE, -540), idle: 6, cd: 0.9 });
  T('b-soru1', gB, '?', 1000, 330, 170, q + 0.3, q + n[5].d + 1.0, { font: F_EL, weight: 400, color: CORAL, rot: -12, anims: [AN('sallan', q + 1, null, { aci: 8, periyot: 1.5 })] });
  T('b-soru2', gB, '?', 1700, 380, 130, q + 0.7, q + n[5].d + 1.0, { font: F_EL, weight: 400, color: LILAC.replace('c9b8f5', '9b7fe8'), rot: 14, anims: [AN('sallan', q + 1, null, { aci: 8, periyot: 1.9 })] });
  hap('b-kaya', gB, 'katı bir kaya mı?', 1340, 910, 560, 44, '#ffe9c7', q + 1.4, q + n[5].d + 1.0, { kutu: { style: 'cizim' } });

  // n6 — Güneş kesiti: gaz, küre, katman
  const a6 = n[6].t;
  M('b-kesit', gB, 'gunes-kesit-cizim', 1170, 560, 540, a6 + 0.3, n[7].t + 0.7, { dur: 2.4, cikis: 'kuculerek-cik', cd: 0.6, parts: isinDon(a6, SURE, -300) });
  const chip = (id, text, y, t, renk) => hap(id, gB, text, 1640, y, 520, 36, renk, t, n[7].t - 0.4, { h: 84 });
  chip('b-c1', 'GAZLARDAN OLUŞUR', 300, a6 + 0.7, '#ffe0d6');
  chip('b-c2', 'KÜRESEL YAPI', 410, a6 + 2.7, '#d9f3ea');
  chip('b-c3', 'KATMANLARI VAR', 520, a6 + 4.3, '#e6defb');
  // katman etiketleri (cizim oklarıyla)
  const lab = (id, text, x, y, hedef, t, renk, o = {}) => {
    T(`${id}-t`, gB, text, x, y, 46, t, n[7].t - 0.4, { font: F_EL, weight: 400, color: renk, anim: 'harf-belir', cikis: 'kuculerek-cik' });
    OK(`${id}-o`, gB, [x + (o.dx || 0), y + (o.dy || -40)], hedef, t + 0.2, { stil: 'ok-el-cizimi', color: renk, width: 5, bend: o.bend ?? 0.3, end: n[7].t - 0.4, dur: 0.7 });
  };
  lab('b-yuzey', 'yüzey', 1590, 800, [1338, 735], a6 + 3.8, '#e0861e', { dx: -40, dy: -34 });
  lab('b-ic', 'iç katmanlar', 840, 800, [1040, 680], a6 + 4.3, '#d9534f', { dx: 90, dy: -30, bend: -0.3 });
  lab('b-cek', 'çekirdek', 1170, 960, [1190, 600], a6 + 4.8, '#c2413a', { dy: -34, bend: 0.1 });

  // n7 — grafik (hidrojen / helyum / diğer)
  const g7 = n[7].t;
  L({
    id: 'b-grafik', group: gB, type: 'chart', kind: 'donut', x: 1380, y: 540, width: 820, height: 760, start: g7 - 0.1, end: t1, unit: '%', decimals: 1, textColor: INK, card: true, font: F_GOVDE, title: "Güneş'in içindeki gazlar",
    data: [{ label: 'Hidrojen', value: 71, color: CORAL }, { label: 'Helyum', value: 26.5, color: '#ffc21a' }, { label: 'Diğer gazlar', value: 2.5, color: '#9b7fe8' }],
    fold: [k(g7 + 0.2, 0), k(g7 + n[7].d - 0.6, 1, 'linear')], anims: [AN('zipla-gir', g7 - 0.1, 0.7)],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM C — NE KADAR UZAK?  (büyük yıldız ama uzak → yakın = büyük görünür → Güneş Sistemi'nin merkezi)
// ═══════════════════════════════════════════════════════════════════════════
const gC = 'g-c';
{
  const t0 = tC, t1 = tD;
  yika('c-yika', gC, '#d3e9fb', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('c-yika2', gC, '#ffdbe8', 1560, 800, 700, t0 + 0.3, t1, { op: 0.85, rot: 20 });
  const a8 = n[8].t, a9 = n[9].t, a10 = n[10].t;
  // Dünya (bakış noktamız) + Güneş + dev yıldız
  M('c-dunya', gC, 'dunya-cizim', 900, 800, 190, t0 + 0.2, a10 - 0.5, { dur: 1.4, idle: 6, cd: 0.5, cikis: 'kuculerek-cik' });
  const gx = [k(t0 + 0.2, 1170), k(a9 + 0.3, 1170), k(a9 + 1.2, 1500, 'inOutCubic')];
  const gy = [k(t0 + 0.2, 570), k(a9 + 0.3, 570), k(a9 + 1.2, 560, 'inOutCubic')];
  const gS = M('c-gunes', gC, 'gunes-cizim', 1170, 570, 320, t0 + 0.2, a10 - 0.5, { dur: 1.6, parts: isinDon(t0, SURE, -540), cikis: 'kuculerek-cik', cd: 0.5 });
  gS.x = gx; gS.y = gy; gS.scale = pxk('gunes-cizim', [{ t: t0 + 0.2, px: 320 }, { t: a9 + 0.3, px: 320 }, { t: a9 + 1.2, px: 360, ease: 'inOutCubic' }]);
  // dev yıldız: n8'de dev; n9'da uzaklaşıp küçülür
  const yx = [k(a8 + 0.5, 1660), k(a9 + 0.4, 1660), k(a9 + 2.0, 1790, 'inCubic')];
  const yy = [k(a8 + 0.5, 360), k(a9 + 0.4, 360), k(a9 + 2.0, 235, 'inCubic')];
  const yS = M('c-yildiz', gC, 'yildiz', 1660, 360, 360, a8 + 0.5, a10 - 0.5, { pal: { a: '#9b7fe8' }, dur: 1.4, cikis: 'kuculerek-cik', cd: 0.4 });
  yS.x = yx; yS.y = yy; yS.scale = pxk('yildiz', [{ t: a8 + 0.5, px: 360 }, { t: a9 + 0.4, px: 360 }, { t: a9 + 2.0, px: 46, ease: 'inCubic' }]);
  yS.anims.push(AN('sallan', a8 + 2.2, null, { aci: 5, periyot: 2.2 }));
  T('c-dev', gC, 'DEV YILDIZ', 1660, 570, 44, a8 + 1.0, a9 + 0.3, { font: F_BASLIK, weight: 900, color: '#6b4fc9', cikis: 'kuculerek-cik' });
  hap('c-buyuk', gC, 'Güneş’ten çok daha büyük!', 1620, 660, 560, 36, '#e6defb', a8 + 1.4, a9 + 0.3, { h: 78 });
  T('c-soru', gC, '?', 1130, 300, 190, a8 + 3.6, a9 - 0.2, { font: F_EL, weight: 400, color: CORAL, rot: -10, anims: [AN('sallan', a8 + 4.4, null, { aci: 8, periyot: 1.5 })] });
  T('c-uzak', gC, 'çok uzak!', 1790, 330, 42, a9 + 1.6, a10 - 0.5, { font: F_EL, weight: 400, color: '#6b4fc9', anim: 'harf-belir', cikis: 'kuculerek-cik' });
  // n9 — mesafe oku + sayaç
  OK('c-ok', gC, 'c-dunya', 'c-gunes', a9 + 1.5, { stil: 'ok-cift-uclu', color: INK, width: 6, bend: 0.1, dur: 1.2, end: a10 - 0.5, extra: { fromAnchor: 'sag', toAnchor: 'sol' } });
  L({
    id: 'c-km', group: gC, type: 'text', text: '≈ 150.000.000 km', x: 1230, y: 250, size: 84, font: F_BASLIK, weight: 900, color: INK, align: 'center', start: r2(a9 + 1.2), end: r2(a10 - 0.5),
    count: { from: 0, to: 150000000, decimals: 0, prefix: '≈ ', suffix: ' km', sep: '.' }, counter: [k(a9 + 1.4, 0), k(a9 + 3.4, 1, 'outCubic')],
    box: { color: HILITE, radius: 30, padding: [10, 36], opacity: 1 }, anims: [AN('zipla-gir', a9 + 1.2, 0.6), AN('kuculerek-cik', a10 - 0.9, 0.4)],
  });
  T('c-yakin', gC, "Dünya'ya en yakın yıldız", 1230, 935, 50, a9 + 0.4, a10 - 0.5, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  T('c-not', gC, '(şema — ölçekli değil)', 1630, 1000, 30, a9 + 2.0, a10 - 0.5, { font: F_GOVDE, weight: 700, color: '#7a76b0', anim: false, giris: 'belir', cikis: 'kuculerek-cik' });

  // n10 — Güneş Sistemi'nin merkezi + yaş sayacı
  const cx = 1340, cy = 540;
  const ring = (id, r, t, renk) => M(id, gC, 'yorunge-halka-cizim', cx, cy, r * 2, t, t1, { pal: { a: renk }, giris: 'cizerek-gir', dur: 1.4, cikis: false });
  ring('c-r1', 125, a10 + 0.4, '#ffc78f'); ring('c-r2', 210, a10 + 0.6, '#a9d6f5'); ring('c-r3', 295, a10 + 0.8, '#c9b8f5');
  M('c-merkez', gC, 'gunes-cizim', cx, cy, 230, a10 + 0.3, t1, { dur: 1.4, parts: isinDon(a10, SURE, -540), cikis: false });
  const o1 = yorunge(cx, cy, 125, a10 + 1.0, t1 + 4, 1.9, 0.6), o2 = yorunge(cx, cy, 210, a10 + 1.0, t1 + 4, 1.2, 2.4), o3 = yorunge(cx, cy, 295, a10 + 1.0, t1 + 4, 0.8, 4.0);
  const gez = (id, asset, px, o, renk) => { const l = M(id, gC, asset, cx + 100, cy, px, a10 + 1.0, t1, { dur: 0.9, cikis: false, pal: renk ? { a: renk } : undefined }); l.x = o.x; l.y = o.y; return l; };
  gez('c-g1', 'daire', 36, o1, '#ff9b7a'); gez('c-g2', 'daire', 48, o2, '#7fd1b9'); gez('c-g3', 'dunya-cizim', 90, o3);
  T('c-merkez-t', gC, "GÜNEŞ SİSTEMİ'NİN MERKEZİ", 1340, 150, 58, a10 + 0.5, t1, { font: F_BASLIK, weight: 900, anim: 'harf-belir', cikis: false });
  L({
    id: 'c-yas', group: gC, type: 'text', text: '≈ 5.000.000.000 yıl', x: 1340, y: 985, size: 70, font: F_BASLIK, weight: 900, color: INK, align: 'center', start: r2(a10 + 2.8), end: r2(t1),
    count: { from: 0, to: 5000000000, decimals: 0, prefix: '≈ ', suffix: ' yıl', sep: '.' }, counter: [k(a10 + 3.0, 0), k(a10 + 5.0, 1, 'outCubic')],
    box: { color: '#ffe0d6', radius: 30, padding: [8, 32], opacity: 1 }, anims: [AN('zipla-gir', a10 + 2.8, 0.6)],
  });
  L({ id: 'c-konfeti', group: gC, type: 'particles', particle: 'konfeti', mode: 'patlama', x: 1340, y: 960, start: r2(a10 + 5.0), end: r2(t1), colors: [CORAL, BUTTER, MINT, LILAC, PINK], count: 60, sfx: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM D — GÜNEŞ LEKELERİ  (fotoğraf → daha soğuk → Galileo → lekeler kayar → Güneş dönüyor)
// ═══════════════════════════════════════════════════════════════════════════
const gD = 'g-d';
{
  const t0 = tD, t1 = tE;
  yika('d-yika', gD, '#e3d9fb', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('d-yika2', gD, '#ffd6e6', 1500, 380, 800, t0 + 0.3, t1, { op: 0.85, rot: 30 });
  const a11 = n[11].t, a12 = n[12].t, a13 = n[13].t, a14 = n[14].t, a15 = n[15].t;

  // n11–n12: Fotoğraf kartı (gerçek lekeli Güneş görüntüsü, sitenin görseli)
  const px = 1120, py = 540, cd = 400;
  const fotoSon = a13 - 0.5;
  kutu('d-kart', gD, 'kart', px, py + 20, 520, 640, '#ffffff', a11 + 0.2, fotoSon, { style: 'cizim', dur: 0.7, rot: 0 });
  L({
    id: 'd-foto', group: gD, type: 'media', src: 'gd-leke-1.png', x: px, y: py - 20, width: cd, height: cd, radius: cd / 2, border: 7, borderColor: '#ffd84d', shadow: false,
    start: r2(a11 + 0.5), end: r2(fotoSon), anims: [AN('belir', a11 + 0.5, 0.6), AN('kuculerek-cik', fotoSon - 0.45, 0.4)],
  });
  M('d-bant', gD, 'bant-cizim', px, py - 300, 190, a11 + 0.5, fotoSon, { pal: { a: PINK }, rot: -4, dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  T('d-cap', gD, "Güneş'in yüzeyi", px, py + 262, 46, a11 + 0.9, fotoSon, { font: F_EL, weight: 400, color: INK, anim: 'harf-belir' });
  // leke (fotoğraftaki kırmızı daire): görüntüde (≈ 0.17, 0.56) → kart içi konum
  const spot = [px + (0.172 - 0.5) * cd, py - 20 + (0.56 - 0.5) * cd];
  T('d-leke-t', gD, 'güneş lekesi', 720, 700, 54, a11 + 3.2, fotoSon, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', rot: -4 });
  OK('d-leke-o', gD, [800, 720], [spot[0] - 24, spot[1] + 20], a11 + 3.4, { stil: 'ok-el-cizimi', color: CORAL, width: 6, bend: -0.3, end: fotoSon, dur: 0.9 });

  // n12: iki termometre
  const termo = (id, x, seviye, renk, ad, t) => {
    M(`${id}-m`, gD, 'termometre-cizim', x, 520, 330, t, fotoSon, { dur: 1.0, parts: { civa: { scaleY: [k(t + 0.4, 0), k(t + 2.4, seviye, 'outCubic')] } }, cd: 0.4, cikis: 'kuculerek-cik' });
    T(`${id}-t`, gD, ad, x, 725, 40, t + 0.6, fotoSon, { font: F_BASLIK, weight: 900, color: renk });
  };
  termo('d-t1', 1560, 0.95, CORAL, 'ÇEVRESİ', a12 + 0.2);
  termo('d-t2', 1760, 0.45, '#5a8de0', 'LEKE', a12 + 1.1);
  hap('d-soguk', gD, 'daha soğuk = daha karanlık', 1650, 900, 560, 34, '#e6defb', a12 + 3.4, fotoSon, { h: 86 });

  // n13: Galileo + teleskop
  const gx = 1000, gy = 520;
  M('d-gal-bant', gD, 'bant-cizim', gx, gy - 195, 190, a13 + 0.4, a14 - 0.5, { pal: { a: HILITE.replace('fff0a6', 'ffe9a8') }, rot: 5, dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  L({
    id: 'd-galileo', group: gD, type: 'media', src: 'gd-galileo.png', x: gx, y: gy, width: 380, height: 380, radius: 190, border: 8, borderColor: '#ffffff', shadow: false,
    start: r2(a13 + 0.2), end: r2(a14 - 0.5), anims: [AN('zipla-gir', a13 + 0.2, 0.7), AN('kuculerek-cik', a14 - 0.9, 0.4)],
  });
  T('d-gal-ad', gD, 'GALİLEO GALİLEİ', gx, gy + 245, 46, a13 + 0.7, a14 - 0.5, { font: F_BASLIK, weight: 900 });
  T('d-gal-yil', gD, '(1564 – 1642)', gx, gy + 300, 38, a13 + 1.1, a14 - 0.5, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir' });
  M('d-tel', gD, 'teleskop-cizim', 1560, 650, 470, a13 + 1.6, a14 - 0.5, { dur: 1.8, cd: 0.4, cikis: 'kuculerek-cik' });
  const gm = M('d-tel-gunes', gD, 'gunes-cizim', 1740, 290, 190, a13 + 3.4, a14 - 0.5, { dur: 1.2, parts: isinDon(a13, SURE, -540), cd: 0.4, cikis: 'kuculerek-cik' });
  void gm;
  OK('d-tel-ok', gD, [1640, 480], [1712, 372], a13 + 4.3, { stil: 'ok-noktali-akis', color: '#e69500', width: 6, bend: 0.2, end: a14 - 0.5, dur: 0.8 });
  hap('d-tel-t', gD, 'kendi yaptığı teleskop', 1520, 925, 640, 40, '#fff0a6', a13 + 2.8, a14 - 0.5, { h: 84 });

  // n14: üç gözlem — lekeler hep aynı yöne kayıyor
  const fx = [980, 1330, 1680], fy = 500, fc = 300;
  const kay = [[0.172, 0.56], [0.301, 0.59], [0.664, 0.615]];
  const imgs = ['gd-leke-1.png', 'gd-leke-2.png', 'gd-leke-3.png'];
  const pts = [];
  fx.forEach((x, i) => {
    const t = a14 + 0.4 + i * 1.25;
    L({
      id: `d-g${i + 1}`, group: gD, type: 'media', src: imgs[i], x, y: fy, width: fc, height: fc, radius: fc / 2, border: 7, borderColor: '#ffffff', shadow: false,
      start: r2(t), end: r2(a15 - 0.5), anims: [AN('zipla-gir', t, 0.6), AN('kuculerek-cik', a15 - 0.9, 0.4)],
    });
    T(`d-g${i + 1}-t`, gD, `${i + 1}. gözlem`, x, fy + 215, 40, t + 0.3, a15 - 0.5, { font: F_BASLIK, weight: 900, anim: 'harf-belir' });
    pts.push([x + (kay[i][0] - 0.5) * fc, fy + (kay[i][1] - 0.5) * fc]);
  });
  const t4 = a14 + 4.6;
  OK('d-kay1', gD, [pts[0][0] + 22, pts[0][1] - 4], [pts[1][0] - 70, pts[1][1] - 8], t4, { stil: 'ok-kesikli-rota', color: CORAL, width: 6, bend: -0.45, end: a15 - 0.5, dur: 0.9, extra: { head: 'ucgen' } });
  OK('d-kay2', gD, [pts[1][0] + 22, pts[1][1] - 4], [pts[2][0] - 70, pts[2][1] - 8], t4 + 0.8, { stil: 'ok-kesikli-rota', color: CORAL, width: 6, bend: -0.45, end: a15 - 0.5, dur: 0.9, extra: { head: 'ucgen' } });
  T('d-hep', gD, 'hep aynı yöne kayıyor →', 1330, 800, 56, t4 + 0.3, a15 - 0.5, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  T('d-soru', gD, '?', 1800, 880, 150, a14 + 5.7, a15 - 0.2, { font: F_EL, weight: 400, color: '#9b7fe8', rot: 12, anims: [AN('sallan', a14 + 6.3, null, { aci: 8, periyot: 1.4 })] });

  // n15: cevap — Güneş kendi etrafında saat yönünün tersine dönüyor
  const cx = 1340, cy = 520;
  M('d-don-gunes', gD, 'gunes-cizim', cx, cy, 380, a15 + 0.1, t1, { dur: 1.6, cikis: false, parts: isinDon(a15, SURE, -540) });
  const dn = M('d-don-ok', gD, 'donus-oku-cizim', cx, cy, 590, a15 + 0.9, t1, { pal: { a: CORAL }, dur: 1.4, cikis: false });
  dn.rotation = [k(a15 + 0.9, 0), k(t1, -170, 'linear')];
  T('d-don-t1', gD, 'KENDİ ETRAFINDA DÖNÜYOR!', cx, 880, 66, a15 + 0.5, t1, { font: F_BASLIK, weight: 900, anim: 'harf-zipla', cikis: false });
  hap('d-don-t2', gD, 'saat yönünün tersine ↺', cx, 985, 600, 46, '#ffe0d6', a15 + 2.2, t1, { h: 84, color: CORAL, t: { font: F_EL, weight: 400 }, kutu: { cikis: false } });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM E — DİKKAT!  (çıplak göz yok · aletler yok · özel filtre var)
// ═══════════════════════════════════════════════════════════════════════════
const gE = 'g-e';
{
  const t0 = tE, t1 = tF;
  yika('e-yika', gE, '#ffcfbd', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('e-yika2', gE, '#ffeaa0', 1560, 800, 700, t0 + 0.3, t1, { op: 0.85, rot: 50 });
  const a16 = n[16].t, a17 = n[17].t, a18 = n[18].t;
  // n16: Güneş → göz, üstüne büyük çarpı
  T('e-baslik', gE, 'DİKKAT!', 1340, 150, 120, a16 + 0.1, a17 - 0.4, { font: F_BASLIK, weight: 900, color: CORAL, adur: 0.5, anims: [AN('titre', a16 + 1.6, null, { genlik: 3 })] });
  M('e-gunes', gE, 'gunes-cizim', 1620, 520, 330, a16 + 0.3, a17 - 0.4, { dur: 1.4, parts: isinDon(a16, SURE, -540), cd: 0.5, cikis: 'kuculerek-cik' });
  M('e-goz', gE, 'goz-cizim', 1000, 560, 330, a16 + 0.8, a17 - 0.4, { dur: 1.2, cd: 0.5, cikis: 'kuculerek-cik' });
  OK('e-isin', gE, 'e-gunes', 'e-goz', a16 + 1.5, { stil: 'ok-kalin-golge', color: '#ffb300', width: 12, bend: 0.0, dur: 0.9, end: a17 - 0.4, extra: { fromAnchor: 'sol', toAnchor: 'sag' } });
  M('e-carpi', gE, 'carpi', 1000, 560, 380, a16 + 2.7, a17 - 0.4, { pal: { a: '#ff4d5e' }, giris: 'zipla-gir', dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  hap('e-zarar', gE, 'çıplak gözle bakma!', 1340, 880, 640, 52, '#ffffff', a16 + 3.0, a17 - 0.4, { h: 100, color: '#d9473f', t: { font: F_BASLIK, weight: 900 } });

  // n17: dört alet — hepsi yasak
  T('e-b2', gE, 'BUNLARLA DA BAKILMAZ!', 1340, 160, 68, a17 + 0.1, a18 - 0.4, { font: F_BASLIK, weight: 900, color: '#d9473f', adur: 0.45 });
  const ay = 540;
  const alet = (id, asset, ad, x, px, t, fy = 0) => {
    M(`${id}-m`, gE, asset, x, ay + fy, px, t, a18 - 0.4, { giris: 'zipla-gir', dur: 0.7, cd: 0.4, cikis: 'kuculerek-cik' });
    T(`${id}-t`, gE, ad, x, 800, 44, t + 0.2, a18 - 0.4, { font: F_BASLIK, weight: 900, anim: 'harf-belir' });
    M(`${id}-x`, gE, 'carpi', x, ay + fy, px * 0.9, t + 0.55, a18 - 0.4, { pal: { a: '#ff4d5e' }, giris: 'zipla-gir', dur: 0.45, cd: 0.4, cikis: 'kuculerek-cik' });
  };
  alet('e-a1', 'durbun-cizim', 'dürbün', 990, 250, a17 + 0.1);
  alet('e-a2', 'teleskop-cizim', 'teleskop', 1240, 290, a17 + 0.95, -10);
  alet('e-a3', 'mercek-cizim', 'mercek', 1500, 240, a17 + 1.7);
  alet('e-a4', 'kamera-cizim', 'kamera', 1750, 250, a17 + 2.3);

  // n18: özel filtre
  T('e-b3', gE, 'ÖZEL FİLTRE', 1340, 150, 112, a18 + 0.1, t1, { font: F_BASLIK, weight: 900, color: '#2e9e72', adur: 0.5, cikis: false });
  M('e-filtre', gE, 'filtre-gozluk-cizim', 1340, 520, 600, a18 + 0.5, t1, { dur: 1.8, idle: 6, cikis: false });
  M('e-tik', gE, 'tik', 1700, 330, 170, a18 + 2.6, t1, { pal: { a: GREEN }, giris: 'zipla-gir', dur: 0.7, cikis: false });
  M('e-mini', gE, 'gunes-cizim', 960, 330, 160, a18 + 1.8, t1, { dur: 1.0, parts: isinDon(a18, SURE, -540), cikis: false });
  hap('e-guv', gE, 'bakmayı güvenli hâle getirir', 1340, 900, 780, 50, '#ffffff', a18 + 3.2, t1, { h: 104, color: '#2e9e72', t: { font: F_BASLIK, weight: 900 }, kutu: { cikis: false } });
  L({ id: 'e-pirilti', group: gE, type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x: 1340, y: 520, start: r2(a18 + 2.6), end: r2(t1), colors: [BUTTER, '#fff6b8', MINT], count: 40, sfx: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM F — ÖZET + SON SORU
// ═══════════════════════════════════════════════════════════════════════════
const gF = 'g-f';
{
  const t0 = tF;
  yika('f-yika', gF, '#e3d9fb', 1340, 540, 1500, t0, null, { op: 0.9 });
  yika('f-yika2', gF, '#ffd9b8', 1580, 780, 700, t0 + 0.3, null, { op: 0.85, rot: 10 });
  const a19 = n[19].t, a20 = n[20].t;
  const cardEnd = a20 + 1.2;
  // Kimlik kartı
  kutu('f-kart', gF, 'kart-kare', 1340, 560, 1000, 880, '#ffffff', t0 + 0.2, cardEnd, { style: 'cizim', dur: 0.8, rot: 0 });
  M('f-gunes', gF, 'gunes-cizim', 1745, 235, 170, a19 + 0.1, cardEnd, { dur: 1.2, parts: isinDon(a19, SURE, -540), cd: 0.4, cikis: 'kuculerek-cik' });
  T('f-baslik', gF, 'GÜNEŞ KİMLİK KARTI', 1280, 200, 58, a19 + 0.1, cardEnd, { font: F_BASLIK, weight: 900, adur: 0.4 });
  const maddeler = [
    'Orta büyüklükte bir yıldız',
    'Dünya’nın ısı ve ışık kaynağı',
    'Gazlardan oluşan bir küre',
    'Dünya’ya uzaklığı ≈ 150 milyon km',
    'Yaşı ≈ 5 milyar yıl',
    'Lekeleri: kendi etrafında döner',
    'Gözlem için özel filtre şart!',
  ];
  maddeler.forEach((m, i) => {
    const y = 330 + i * 98, t = a19 + 0.5 + i * 0.85;
    M(`f-tik${i}`, gF, 'tik', 905, y, 54, t, cardEnd, { pal: { a: i === 6 ? CORAL : GREEN }, giris: 'zipla-gir', dur: 0.5, cd: 0.4, cikis: 'kuculerek-cik' });
    T(`f-m${i}`, gF, m, 960, y, 44, t + 0.1, cardEnd, { align: 'left', anim: 'harf-belir', aralik: 0.02, color: i === 6 ? '#d9473f' : INK, cikis: 'kuculerek-cik' });
  });
  // Son soru: gece
  M('f-gece', gF, 'kare', 960, 540, 2600, a20 + 0.2, null, { pal: { a: '#2b2e6b' }, style: 'duz', giris: 'belir', dur: 2.6, cikis: false, op: 0.0 });
  const gece = layers[layers.length - 1];
  gece.scaleX = r2(2000 / 200); gece.scaleY = r2(1200 / 200); gece.anims = []; gece.opacity = [k(a20 + 0.2, 0), k(a20 + 3.0, 0.93, 'inOutSine')];
  const sol = M('f-gunes2', gF, 'gunes-cizim', 1340, 520, 400, a20 + 0.4, null, { dur: 1.4, parts: isinDon(a20, SURE, -540), cikis: false });
  sol.anims = [AN('cizerek-gir', a20 + 0.4, 1.4)]; sol.opacity = [k(a20 + 1.8, 1), k(a20 + 5.4, 0.12, 'inOutSine')];
  L({ id: 'f-yildizlar', group: gF, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: r2(a20 + 2.4), colors: ['#fff6b8', '#ffffff', '#d9ccff'], count: 36, opacity: 0.9, sfx: false });
  T('f-son', gF, 'Güneş olmasaydı?', 1330, 190, 104, a20 + 1.8, null, { font: F_BASLIK, weight: 900, color: '#fff6d8', adur: 0.5, aralik: 0.05, cikis: false });
  hap('f-yorum', gF, 'düşün ve yorumlara yaz!', 1340, 900, 700, 52, '#fff0a6', a20 + 4.0, null, { h: 110, t: { font: F_EL, weight: 400 }, kutu: { cikis: false } });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM G — BEĞEN · YORUM YAZ · ABONE OL (Kıpır söyler; kanal: youtube.com/@BayKipir)
// ═══════════════════════════════════════════════════════════════════════════
const gG = 'g-g';
layers.filter((l) => l.group === 'g-f' && l.end == null).forEach((l) => { l.end = r2(tG); }); // F bölümünün açık uçlu katmanları geçişte biter
const abone = aboneBolumu({ L, M, T, hap, yika, AN, k, r2, tG, a: [n[21], n[22], n[23]], g: gG, renk: { INK, CORAL, BUTTER, MINT, SKY, LILAC, PINK }, fontBaslik: F_BASLIK, fontEl: F_EL });

// ─── Bölüm sekmeleri (sağ üst köşe) ────────────────────────────────────────
{
  const S = [[0, tB, '1 · Kim bu?', PEACH], [tB, tC, '2 · Neyden yapılmış?', MINT], [tC, tD, '3 · Ne kadar uzak?', SKY], [tD, tE, '4 · Güneş lekeleri', LILAC], [tE, tF, '5 · Dikkat!', '#ffcab8']];
  S.forEach(([a, b, ad, renk], i) => {
    const t = a + (i === 0 ? 0.6 : 0.8);
    hap(`tab${i}`, `g-${'abcde'[i]}`, ad, 1680, 62, 420, 34, renk, t, b, { h: 70, kutu: { style: 'cizim' } });
  });
}

// ─── GÖZLÜ — anlatıcı (en üstte) ───────────────────────────────────────────
const soz = (i, metin, extra = {}) => ({ t: n[i].t, sure: n[i].d, metin: metin ?? SATIR[i - 1], ...extra });
const gozlu = K('gozlu', {
  id: 'gozlu', konum: [0.145, 0.955], boy: 0.64, varyant: 'mavi', ekler: ['sac-tutam'], start: 0.1, giris: 'zipla-gir',
  balon: { font: F_GOVDE, boyut: 42, genislik: 650, zemin: '#ffffff', yazi: INK },
  akis: [
    { t: 0.3, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 },
    { t: n[1].t + 2.2, aksiyon: 'isaret', hedef: 'gunes-ana', duygu: 'mutlu', bak: 'gunes-ana', sure: 2.4 },
    { t: n[2].t, aksiyon: 'dusun', duygu: 'dusunceli' },
    { t: n[3].t, aksiyon: 'sevin', duygu: 'cok-mutlu', sure: 1.6 },
    { t: n[3].t + 1.9, aksiyon: 'anlat', duygu: 'mutlu', bak: 'ileri' },
    { t: n[4].t + 0.6, aksiyon: 'tanit', hedef: 'dunya-a', duygu: 'mutlu', sure: 2.4 },
    // B
    { t: n[5].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'b-gunes' },
    { t: n[6].t, aksiyon: 'sevin', duygu: 'mutlu', sure: 1.0 },
    { t: n[6].t + 1.4, aksiyon: 'anlat', duygu: 'mutlu', bak: 'b-kesit' },
    { t: n[7].t, aksiyon: 'tanit', hedef: 'b-grafik', duygu: 'mutlu' },
    // C
    { t: n[8].t, aksiyon: 'isaret', hedef: 'c-yildiz', duygu: 'saskin', bak: 'c-yildiz' },
    { t: n[8].t + 3.6, aksiyon: 'dusun', duygu: 'dusunceli' },
    { t: n[9].t, aksiyon: 'tanit', hedef: 'c-gunes', duygu: 'cok-mutlu' },
    { t: n[10].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'ileri' },
    { t: n[10].t + 4.0, aksiyon: 'gule', duygu: 'gulen', sure: 1.6 },
    // D
    { t: n[11].t, aksiyon: 'isaret', hedef: 'd-foto', duygu: 'mutlu', bak: 'd-foto' },
    { t: n[12].t, aksiyon: 'tanit', hedef: 'd-t1-m', duygu: 'mutlu' },
    { t: n[13].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'd-galileo' },
    { t: n[14].t + 0.5, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'd-g2' },
    { t: n[14].t + 4.8, aksiyon: 'omuz-silk', duygu: 'dusunceli' },
    { t: n[15].t, aksiyon: 'sevin', duygu: 'heyecanli', sure: 1.8 },
    { t: n[15].t + 2.0, aksiyon: 'isaret', hedef: 'd-don-gunes', duygu: 'cok-mutlu', bak: 'd-don-gunes' },
    // E
    { t: n[16].t, aksiyon: 'kork', duygu: 'korku', bak: 'e-gunes', sure: 2.0 },
    { t: n[16].t + 2.5, aksiyon: 'hayir', duygu: 'endiseli' },
    { t: n[17].t, aksiyon: 'hayir', duygu: 'endiseli' },
    { t: n[18].t, aksiyon: 'tanit', hedef: 'e-filtre', duygu: 'mutlu', bak: 'e-filtre' },
    { t: n[18].t + 3.0, aksiyon: 'evet', duygu: 'cok-mutlu', sure: 2.4 },
    // F
    { t: n[19].t, aksiyon: 'tanit', hedef: 'f-kart', duygu: 'mutlu', bak: 'f-kart' },
    { t: n[20].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'f-gunes2' },
    { t: n[20].t + 4.8, aksiyon: 'el-salla', duygu: 'cok-mutlu', bak: 'ileri' },
    ...abone.akis,
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
const muzik = (eski.audio || []).filter((a) => /gunes-dersi-muzik/.test(a.file));
muzik.forEach((m, i) => {
  const son = i === muzik.length - 1;
  audio.push({ ...m, volume: 0.2, ...(son ? { dur: r2(Math.max(10, SURE - m.start)), fadeOut: 3 } : {}) });
});

const scene = {
  name: 'Güneş Dersi — Kıpır ile Gökyüzündeki Komşumuz',
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
    title: 'Gökyüzündeki Komşumuz: GÜNEŞ ☀️ | 5. Sınıf Fen Bilimleri',
    description: "Kıpır ile Güneş'i keşfediyoruz! Güneş bir gezegen mi, yıldız mı? Neyden yapılmış? Dünya'ya ne kadar uzak? Güneş lekeleri nedir, Galileo ne keşfetti ve Güneş'e neden çıplak gözle bakılmaz? 5. sınıf Fen Bilimleri \"Gökyüzündeki Komşularımız ve Biz\" konusunun Güneş bölümü, soru-cevap tadında ve çizimlerle. Beğen, abone ol ve Güneş olmasaydı ne olurdu, yorumlara yaz!",
    tags: ['güneş', 'güneş nedir', 'güneş lekeleri', 'galileo', '5. sınıf fen', 'fen bilimleri', 'gökyüzündeki komşularımız ve biz', 'gökyüzü', 'yıldız', 'çocuklar için bilim', 'eğitim videosu', 'animasyon', 'ders anlatımı', 'güneş sistemi'],
  },
  audio,
  sfx: { auto: true, volume: 0.45 },
  sections: [
    { t: 0, name: 'Kim bu?' }, { t: tB, name: 'Neyden yapılmış?' }, { t: tC, name: 'Ne kadar uzak?' }, { t: tD, name: 'Güneş lekeleri' }, { t: tE, name: 'Dikkat!' }, { t: tF, name: 'Özet ve soru' }, { t: tG, name: 'Abone ol' },
  ],
  transitions: [
    { type: 'benek', t: tB, dur: 1.2, color: '#ffe3a8' },
    { type: 'dalga', t: tC, dur: 1.2, color: '#bfe3ff', yon: 'sag' },
    { type: 'daire-ac', t: tD, dur: 0.9 },
    { type: 'kepenk', t: tE, dur: 1.0, color: '#ff9d8a' },
    { type: 'yildiz', t: tF, dur: 1.1, color: '#c9b8f5' },
    { type: 'dalga', t: tG, dur: 1.1, color: '#ffd1cc', yon: 'sol' },
  ],
  groups: [
    { id: 'g-a', name: '1 · Kim bu?' }, { id: 'g-b', name: '2 · Neyden yapılmış?', collapsed: true }, { id: 'g-c', name: '3 · Ne kadar uzak?', collapsed: true },
    { id: 'g-d', name: '4 · Güneş lekeleri', collapsed: true }, { id: 'g-e', name: '5 · Dikkat!', collapsed: true }, { id: 'g-f', name: '6 · Özet ve soru', collapsed: true }, { id: 'g-g', name: '7 · Abone ol', collapsed: true }, { id: 'g-gozlu', name: 'Kıpır' },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn · bölümler: B ${tB} · C ${tC} · D ${tD} · E ${tE} · F ${tF}`);
