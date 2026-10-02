// "Dünya'mız ve Gökyüzündeki Komşularımız" — Kıpır (Gözlü) ile ders (16:9, 5. sınıf Fen Bilimleri, kaynak: fenogren-tahta.netlify.app).
// ÖZELLİK: simülasyonlar videoda JSON ile yönetilir. Katman: { type:'media', sim:'<slug>', width, height, kontrol:[{t, ...param}] }.
//   Parametre sözlüğü: data/simulations/<slug>/sim.json → kontrol.parametreler  (docs/schema.md §16)
//   Önce modeller:  node scripts/seed-dunya-komsular.mjs
//   Sahne:          node scripts/scenes-dunya-komsular.mjs   →  data/projects/dunya-komsular/scene.json
//   Seslendirme:    node scripts/seslendir.mjs --proje dunya-komsular --satirlar scripts/dunya-komsular-satirlar.txt --ad dunya-komsular-ses --ses-id <id>
//   (sonra sahneyi yeniden üret: zamanlama wav sürelerinden okunur, ses izleri korunur)
// Şablon: gunes-dersi / ay-dersi (Gözlü anlatıcı, çizim stili, bölümler soruyla açılır). Bu videoda cevaplar simülasyonla gösterilir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { karakterBaglam } from './lib/karakter.mjs';
import { aboneBolumu, aboneMetinleri } from './lib/abone-bolumu.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJE_ID = 'dunya-komsular';
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
const SATIR = fs.readFileSync(path.join(ROOT, 'scripts', 'dunya-komsular-satirlar.txt'), 'utf8').split(/\r?\n/).filter((s) => s.trim()).map((s) => s.replace(/^[\d.]+\s*\|\s*/, ''));
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
// Bitiş: beğen / yorum / abone ol (scripts/abone-satirlar.txt, ses: dunya-komsular-abone-N.wav)
const NA = SATIR.length;
SATIR.push(...aboneMetinleri(ROOT, fs, path));
const SES = SATIR.map((_, i) => (i < NA ? `dunya-komsular-ses-${i + 1}.wav` : `dunya-komsular-abone-${i - NA + 1}.wav`));
const D = SATIR.map((m, i) => r2(wavSure(path.join(ROOT, 'data', 'audio', SES[i])) ?? m.length / 14 + 0.6));

// ─── Zaman çizelgesi (anlatıma göre) ───────────────────────────────────────
// 1-2 giriş · 3-6 içleri · 7-10 boyutları · 11-17 hareketleri · 18-19 özet + son soru
const TT = {};
let cur = 0.9;
const say = (i, sonra = 0.4) => { TT[i] = { t: r2(cur), d: D[i - 1], e: r2(cur + D[i - 1]) }; cur = cur + D[i - 1] + sonra; return TT[i]; };
const gec = (bekle, ac = 0.8) => { const tb = r2(cur - 0.4 + bekle); cur = tb + ac; return tb; };
say(1, 0.3); say(2, 0);
const tA = gec(1.7);
say(3, 0.4); say(4, 0.4); say(5, 0.4); say(6, 0);
const tB = gec(1.8);
say(7, 1.2); say(8, 0.5); say(9, 0.5); say(10, 0);
const tC = gec(1.8);
say(11, 1.4); say(12, 0.5); say(13, 0.5); say(14, 0.5); say(15, 0.4); say(16, 0.4); say(17, 0);
const tD = gec(1.8);
say(18, 0.6); say(19, 0);
const tG = gec(3.2, 0.9); // son soru ekranda kalır, sonra "abone ol" bölümü
say(20, 0.4); say(21, 0.4); say(22, 0);
const SON = TT[22].e;
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

const KOYU_AY = { a: '#3b3f7a', b: '#2e3266', c: '#565b9e' };
/** Soru işareti */
const SORU = (id, g, x, y, size, t0, t1, rot = 10, renk = CORAL) =>
  T(id, g, '?', x, y, size, t0, t1, { font: F_EL, weight: 400, color: renk, rot, anim: 'harf-zipla', anims: [AN('sallan', t0 + 0.9, null, { aci: 7, periyot: 1.6 })] });
/** Yazı etiketi + el çizimi ok */
const ETIKET = (id, g, text, x, y, hedef, t, t1, renk, o = {}) => {
  T(`${id}-t`, g, text, x, y, o.size || 46, t, t1, { font: F_EL, weight: 400, color: renk, anim: 'harf-belir', cikis: 'kuculerek-cik' });
  OK(`${id}-o`, g, [x + (o.dx || 0), y + (o.dy || -40)], hedef, t + 0.2, { stil: 'ok-el-cizimi', color: renk, width: 5, bend: o.bend ?? 0.3, end: t1, dur: 0.7 });
};


// ─── Simülasyon katmanı (JSON ile yönetilir) ───────────────────────────────
// Katman: { type:'media', sim:'<slug>', width, height, kontrol:[{t, ...param, ease?}] } — t katman başından sn.
// Aşağıdaki `zc` kurucusu sahne saniyesiyle yazmayı kolaylaştırır; parametre sözlüğü: data/simulations/<slug>/sim.json
const CX = 1300, CY = 575, CW = 1240, CH = 800; // sim alanı (çerçevesiz, şeffaf: gök cisimleri defter kâğıdının üstünde durur)
function zc(t0) {
  const arr = [], cur = {};
  const rel = (t) => r2(Math.max(0, t - t0));
  return {
    cur,
    /** anında / basamaklı değer (metin, bool, dizi; sayı ise o anda sıçrar) */
    set(t, props) { arr.push({ t: rel(t), ...props }); Object.assign(cur, props); },
    /** sayıları `dur` boyunca kaydır (önceki değerden) */
    git(t, dur, props, easeAd = 'inOutCubic') {
      const hold = {};
      for (const key of Object.keys(props)) if (typeof cur[key] === 'number') hold[key] = cur[key];
      if (Object.keys(hold).length) arr.push({ t: rel(t), ...hold });
      arr.push({ t: rel(t + dur), ...props, ease: easeAd });
      Object.assign(cur, props);
    },
    out: () => [...arr].sort((a, b) => a.t - b.t),
  };
}
// Simülasyon: çerçeve / gölge yok (şeffaf arka plan), genel `boya` parametresi ile pastel düzlük + el çizimi kontur → çizim stiline uyar.
// Girişte "zıplayarak" belirir ve etrafında pırıltı patlar.
const SIM = (id, g, slug, t0, t1, kz, o = {}) => {
  const x = o.x ?? CX, y = o.y ?? CY;
  const kontrol = [{ t: 0, boya: o.boya ?? 0.85 }, ...kz.out()];
  if (o.pirilti !== false) L({ id: `${id}-pirilti`, group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x, y, start: r2(t0 + 0.25), end: r2(t0 + 2.6), colors: [BUTTER, '#fff6b8', CORAL, '#ffffff'], count: 28, sfx: false });
  return L({
    id, group: g, type: 'media', sim: slug, x, y, width: o.w ?? CW, height: o.h ?? CH, radius: o.radius ?? 0, shadow: false,
    border: o.border ?? 0, borderColor: '#ffffff', kalite: o.kalite ?? 1, start: r2(t0), end: r2(t1), kontrol,
    anims: o.anims || [AN('zipla-gir', t0, 0.8), ...(o.cikis === false ? [] : [AN('kuculerek-cik', t1 - 0.5, 0.45)])],
  });
};
/** Alt bilgi çubuğu (kartın altı) */
const ALT = (id, g, text, t0, t1, renk = HILITE, size = 40) => T(id, g, text, CX, 997, size, t0, t1, {
  font: F_BASLIK, weight: 900, anim: false, giris: 'belir', box: { color: renk, radius: 26, padding: [8, 30], opacity: 1 },
});
/** Kart üstü başlık hapı */
const BASLIK = (id, g, text, t0, t1, renk) => hap(id, g, text, 1180, 188, Math.max(420, text.length * 29), 40, renk, t0, t1, { h: 78, t: { font: F_BASLIK, weight: 900 } });

// ═══════════════════════════════════════════════════════════════════════════
// GİRİŞ — başlık + Güneş / Dünya / Ay dolanıyor
// ═══════════════════════════════════════════════════════════════════════════
const gI = 'g-i';
{
  const t1 = tA;
  yika('i-yika', gI, '#ffe3cf', 1340, 540, 1500, 0, t1, { op: 0.9 });
  yika('i-yika2', gI, '#d9d2fb', 1580, 860, 760, 0.3, t1, { op: 0.85, rot: 30 });
  T('i-baslik', gI, "Dünya'mız ve\nGökyüzündeki Komşularımız", CX, 98, 58, 0.5, t1 - 0.2, { font: F_BASLIK, weight: 900, lh: 1.04, aralik: 0.035, cikis: 'kuculerek-cik' });
  hap('i-alt', gI, '5. SINIF FEN BİLİMLERİ', CX, 202, 560, 30, '#ffe9c7', 1.6, t1, { h: 58, t: { font: F_BASLIK, weight: 900 } });
  const z = zc(0.4);
  z.set(0.4, { camera: 'free', takip: '', labels: true, orbits: true, speed: 0.55, pitch: 0.52, yaw: 0.55, distance: 17, isik: 1.8 });
  z.git(1.0, t1 - 1.8, { yaw: 1.9, distance: 12, pitch: 0.7 }, 'inOutSine');
  SIM('i-sim', gI, 'gunes-dunya-ay', 0.4, t1, z, { y: 610, h: 740 });
  // merak: içleri neye benziyor?
  SORU('i-soru', gI, 1780, 330, 170, n[2].t + 0.2, t1 - 0.2, 12);
  ALT('i-ne', gI, 'Peki içleri neye benziyor?', n[2].t + 0.3, t1 - 0.2, '#ffe58f');
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM A — İÇLERİ  (soru: içleri neye benziyor? → katmanlar, gokcisimleri-katmanlari simülasyonu)
// ═══════════════════════════════════════════════════════════════════════════
const gA = 'g-a';
{
  const t0 = tA, t1 = tB;
  yika('a-yika', gA, '#ffe9b8', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('a-yika2', gA, '#cfe4fb', 1560, 860, 760, t0 + 0.3, t1, { op: 0.85, rot: 40 });
  const a3 = n[3], a4 = n[4], a5 = n[5], a6 = n[6];
  const ac1 = a3.t + a3.d * 0.64; // "Güneş'in içine bakalım" → kesit açılır
  const seg = (a, f) => r2(a.t + a.d * f);

  // katman anlatımı: [id, ad, kısa açıklama, cümle içindeki konum]
  const KAT = {
    sun: { baslik: "GÜNEŞ'İN KATMANLARI", renk: '#ffe58f', dist: 6.2, anlat: a4, ac: ac1, satirlar: [
      ['corona', 'Taç küre: en dış, çok sıcak seyrek gazlar', 0.04], ['chromosphere', 'Renk küre: kırmızımsı ince katman', 0.27],
      ['photosphere', "Işık küre: Güneş'in görünen yüzeyi", 0.42], ['core', 'Çekirdek: füzyonun olduğu en sıcak bölge', 0.6]] },
    earth: { baslik: "DÜNYA'NIN KATMANLARI", renk: '#cfe9ff', dist: 3.7, anlat: a5, ac: a5.t + 0.1, satirlar: [
      ['crust', 'Kabuk: ince dış katman (kıtalar, okyanuslar)', 0.3], ['mantle', 'Manto: sıcak, yarı akışkan kayaçlar', 0.46],
      ['outer-core', 'Dış çekirdek: sıvı demir-nikel', 0.65], ['inner-core', 'İç çekirdek: katı demir-nikel', 0.84]] },
    moon: { baslik: "AY'IN KATMANLARI", renk: '#e6defb', dist: 3.1, anlat: a6, ac: a6.t + 0.05, satirlar: [
      ['crust', 'Kabuk: kraterli sert kaya', 0.24], ['mantle', 'Manto: kalın kayaç katmanı', 0.41],
      ['partial-melt', 'Kısmi eriyik bölge: yumuşak geçiş', 0.57], ['core', 'Çekirdek: küçük, demir açısından zengin', 0.8]] },
  };
  const z = zc(t0 + 0.2);
  z.set(t0 + 0.2, { speed: 0.7, cutaway: '', labels: false });
  const bitis = { sun: a5.t + 0.1, earth: a6.t + 0.05, moon: t1 };
  for (const [cisim, v] of Object.entries(KAT)) {
    z.set(v.ac, { cutaway: cisim, labels: true, layer: v.satirlar[0][0], distance: v.dist, labelSize: 0.036 });
    BASLIK(`a-b-${cisim}`, gA, v.baslik, v.ac, bitis[cisim], v.renk);
    v.satirlar.forEach(([lid, metin, f], i) => {
      const ta = seg(v.anlat, f), tb = i === v.satirlar.length - 1 ? bitis[cisim] : seg(v.anlat, v.satirlar[i + 1][2]);
      z.set(ta, { layer: lid });
      ALT(`a-c-${cisim}-${i}`, gA, metin, ta, tb - 0.05, v.renk, 38);
    });
  }
  // çizim ruhu: kesitin çevresine el çizimi halka, el yazısı notlar
  M('a-halka', gA, 'yorunge-halka-cizim', CX, CY + 10, 700, t0 + 0.6, t1, { pal: { a: '#ff9b8a' }, dur: 1.4, cikis: false, idle: 3 });
  ETIKET('a-nk', gA, 'iç yapıyı gör!', CX - 420, CY - 300, [CX - 190, CY - 110], ac1 + 0.4, a5.t - 0.2, CORAL, { size: 42, dx: 120, dy: 20, bend: -0.25 });
  ETIKET('a-nk2', gA, 'ışıltılı bir çekirdek', CX + 330, CY + 270, [CX + 40, CY + 40], a4.t + a4.d * 0.62, a5.t - 0.2, '#6b4fc9', { size: 38, dx: -80, dy: -30, bend: 0.25 });
  // kesit açılmadan önce kısa yönerge
  ALT('a-c-0', gA, 'Katmanlar: iç yapı', t0 + 1.0, ac1 - 0.1, '#e6defb', 38);
  SIM('a-sim', gA, 'gokcisimleri-katmanlari', t0 + 0.2, t1, z);
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM B — BOYUTLARI  (soru: hangisi büyük? → çizgi roman sayfası: 2 kıyaslama simülasyonu + 1 çizim panel)
// ═══════════════════════════════════════════════════════════════════════════
const gB = 'g-b';
{
  const t0 = tB, t1 = tC;
  yika('b-yika', gB, '#d6e2f7', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('b-yika2', gB, '#ffdbe8', 1560, 860, 760, t0 + 0.3, t1, { op: 0.85, rot: 20 });
  const b7 = n[7], b8 = n[8], b9 = n[9], b10 = n[10];
  // sayfa: ej-sayfa-yatay-uc (1920×1080, 3 panel) ölçeklenmiş
  const PX = 1270, PY = 565, PS = 0.65;
  // sayfa: ej-sayfa-yatay-iki (2 panel). Sol panel: TEK kesintisiz kıyaslama simülasyonu; sağ panel: çizimli bilgi.
  const pn = [[60, 60, 940, 1020], [980, 60, 1860, 1020]].map(([x0, y0, x1, y1]) => ({
    x: r2(PX + ((x0 + x1) / 2 - 960) * PS), y: r2(PY + ((y0 + y1) / 2 - 540) * PS), w: r2((x1 - x0) * PS), h: r2((y1 - y0) * PS),
  }));
  const ts = t0 + 0.3;

  // Sol panel — tek simülasyon: Ay + Dünya → kamera geri çekilir → dev Güneş (aynı sahnede, kopukluk yok)
  const z1 = zc(ts);
  z1.set(ts, { goster: ['moon', 'earth', 'sun'], olcek: 100, odak: 0.5, mesafe: 15, pitch: 0.05, yaw: 0, ayK: 0, dunyaK: 0, gunesK: 0, etiketler: true, etiketKisa: true, etiketBoyu: 0.034, isik: 1.4 });
  z1.git(b8.t + 0.2, 0.9, { dunyaK: 1 }, 'outBack');
  z1.git(b8.t + b8.d * 0.42, 0.9, { ayK: 1 }, 'outBack');
  z1.git(b9.t + 0.1, 1.0, { odak: 1, mesafe: 8 }, 'inOutCubic'); // Dünya'ya yaklaş
  z1.git(b9.t + 1.2, 1.6, { gunesK: 1 }, 'outBack'); // dev Güneş büyüyerek belirir
  z1.git(b9.t + 1.5, 6.6, { mesafe: 250, yaw: 0, pitch: 0.05 }, 'inOutCubic'); // geri çekil: Güneş'in tamamı
  z1.git(b10.t + 0.3, 6.0, { yaw: 0.3, pitch: 0.22, mesafe: 280 }, 'inOutSine');

  // Sağ panel — çizimli bilgi (gece zemini): Ay ↔ Dünya, Güneş ↔ Dünya, uzak büyük yıldızlar
  kutu('b-p-z0', gB, 'kare', pn[0].x, pn[0].y, pn[0].w, pn[0].h, '#dfeaff', ts, t1, { style: 'duz', giris: 'belir', dur: 0.5, cikis: false });
  kutu('b-p-z', gB, 'kare', pn[1].x, pn[1].y, pn[1].w, pn[1].h, '#fff4de', ts, t1, { style: 'duz', giris: 'belir', dur: 0.5, cikis: false });
  SIM('b-sim', gB, 'gunes-dunya-ay-kiyaslama', ts, t1, z1, { x: pn[0].x, y: pn[0].y, w: pn[0].w, h: pn[0].h, radius: 0, border: 0, kalite: 1.4, anims: [AN('belir', ts, 0.5)] });
  const RX = pn[1].x, RY = pn[1].y;
  // n8 — Ay ve Dünya boyutları (çap oranı ≈ 1 : 3,7)
  const e8 = b9.t - 0.3;
  M('b-i-ay', gB, 'ay-cizim', RX - 150, RY - 20, 98, b8.t + 0.5, e8, { dur: 0.9, cd: 0.4, cikis: 'kuculerek-cik', idle: 3 });
  M('b-i-dunya', gB, 'dunya-cizim', RX + 105, RY - 20, 360, b8.t + b8.d * 0.42, e8, { dur: 1.1, cd: 0.4, cikis: 'kuculerek-cik', idle: 4 });
  T('b-i-ay-t', gB, 'AY\n3.474 km', RX - 150, RY + 80, 34, b8.t + 0.9, e8, { font: F_BASLIK, weight: 900, color: '#8a6fd1', anim: 'harf-belir', lh: 1.1 });
  T('b-i-dunya-t', gB, 'DÜNYA\n12.742 km', RX + 105, RY + 205, 38, b8.t + b8.d * 0.5, e8, { font: F_BASLIK, weight: 900, color: '#2a7fd1', anim: 'harf-belir', lh: 1.1 });
  T('b-i-oran1', gB, 'DÜNYA ≈ 4 × AY', RX, RY - 255, 42, b8.t + b8.d * 0.6, e8, { font: F_BASLIK, weight: 900, color: INK, anim: false, giris: 'belir', box: { color: '#d9f3ea', radius: 24, padding: [8, 26], opacity: 1 } });
  // n9 — Güneş, Dünya'nın ≈ 109 katı
  const e9 = b10.t - 0.3;
  M('b-i-gunes', gB, 'gunes-cizim', RX, RY - 40, 380, b9.t + 0.3, e9, { dur: 1.2, parts: isinDon(t0, SURE, -540), cd: 0.4, cikis: 'kuculerek-cik' });
  M('b-i-dunya2', gB, 'dunya-cizim', RX + 190, RY + 190, 40, b9.t + 1.4, e9, { dur: 0.7, cd: 0.4, cikis: 'kuculerek-cik' });
  T('b-i-dunya2-t', gB, 'Dünya', RX + 190, RY + 232, 26, b9.t + 1.8, e9, { font: F_EL, weight: 400, color: '#2a7fd1', anim: 'harf-belir' });
  T('b-i-gunes-t', gB, 'GÜNEŞ\n1.392.700 km', RX, RY + 190, 36, b9.t + 0.8, e9, { font: F_BASLIK, weight: 900, color: '#e69500', anim: 'harf-belir', lh: 1.1 });
  T('b-i-oran2', gB, 'GÜNEŞ ≈ 109 × DÜNYA', RX, RY - 255, 40, b9.t + 1.6, e9, { font: F_BASLIK, weight: 900, color: INK, anim: false, giris: 'belir', box: { color: '#ffe0d6', radius: 24, padding: [8, 26], opacity: 1 } });
  // n10 — daha büyük yıldızlar çok uzakta
  M('b-i-buyuk', gB, 'yildiz', RX - 110, RY - 150, 96, b10.t + 0.3, t1, { pal: { a: '#9aa4f0' }, dur: 1.0, cikis: false, idle: 4 });
  M('b-i-buyuk2', gB, 'yildiz', RX + 120, RY - 80, 58, b10.t + 0.6, t1, { pal: { a: '#9aa4f0' }, dur: 1.0, cikis: false, idle: 4 });
  M('b-p-gunes', gB, 'gunes-cizim', RX, RY + 110, 210, b10.t + 1.6, t1, { dur: 1.2, parts: isinDon(t0, SURE, -540), cikis: false });
  T('b-i-t1', gB, 'daha büyük yıldızlar\nçok uzakta', RX, RY - 235, 30, b10.t + 0.7, t1, { font: F_EL, weight: 400, color: '#6b4fc9', anim: 'harf-belir', cikis: false, lh: 1.15 });
  T('b-i-t2', gB, 'bize en yakın yıldız:\nGÜNEŞ', RX, RY + 252, 32, b10.t + 2.2, t1, { font: F_BASLIK, weight: 900, color: CORAL, anim: 'harf-belir', cikis: false, lh: 1.12 });
  // n7 merak: üç aday (soru işaretli) — cevap n8-n9'da sırayla belli olur
  [['AY?', '#e6defb', -150], ['DÜNYA?', '#d9f3ea', 0], ['GÜNEŞ?', '#ffe0d6', 150]].forEach(([ad, renk, dy], i) => {
    T(`b-q${i}`, gB, ad, RX, RY - 40 + dy, 52, b7.t + 0.3 + i * 0.35, b8.t + 0.4, { font: F_BASLIK, weight: 900, color: INK, anim: false, giris: 'zipla-gir', box: { color: renk, radius: 28, padding: [10, 34], opacity: 1 }, anims: [AN('sallan', b7.t + 1.2 + i * 0.2, null, { aci: 4, periyot: 1.4 })] });
  });
  // çizgi roman çerçevesi (içeriğin üstünde)
  L({ id: 'b-sayfa', group: gB, asset: 'ej-sayfa-yatay-iki', x: PX, y: PY, anchor: [0.5, 0.5], scale: PS, start: r2(t0 + 0.1), end: r2(t1), anims: [AN('belir', t0 + 0.1, 0.6)] });
  M('b-bant1', gB, 'bant-cizim', PX - 560, PY - 330, 170, t0 + 0.5, t1, { pal: { a: PINK }, rot: -28, dur: 0.6, cikis: false });
  M('b-bant2', gB, 'bant-cizim', PX + 560, PY - 330, 170, t0 + 0.7, t1, { pal: { a: '#fff0a6' }, rot: 28, dur: 0.6, cikis: false });
  // sol panel altlığı + üst ölçü çubuğu
  T('b-a1', gB, 'AY  →  DÜNYA  →  GÜNEŞ', pn[0].x, pn[0].y + pn[0].h / 2 - 46, 30, b8.t + 0.4, t1, { font: F_BASLIK, weight: 900, anim: false, giris: 'belir', cikis: false, color: INK, box: { color: HILITE, radius: 20, padding: [6, 20], opacity: 1 } });
  T('b-km3', gB, "GÜNEŞ = EN YAKIN YILDIZ → EN BÜYÜK GÖRÜNEN", PX, 143, 34, b10.t + 0.3, t1, { font: F_BASLIK, weight: 900, color: INK, anim: false, giris: 'belir', cikis: false, box: { color: '#fff0a6', radius: 24, padding: [8, 28], opacity: 1 } });
  SORU('b-soru', gB, 1700, 150, 130, b7.t + 0.3, b8.t - 0.1, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM C — HAREKETLERİ  (soru: durup dinleniyor mu? → gunes-dunya-ay simülasyonu, kamera + hız JSON'dan)
// ═══════════════════════════════════════════════════════════════════════════
const gC = 'g-c';
{
  const t0 = tC, t1 = tD;
  yika('c-yika', gC, '#d3d7f8', 1340, 540, 1500, t0, t1, { op: 0.9 });
  yika('c-yika2', gC, '#ffe9b8', 1580, 860, 760, t0 + 0.3, t1, { op: 0.85, rot: 50 });
  const c11 = n[11], c12 = n[12], c13 = n[13], c14 = n[14], c15 = n[15], c16 = n[16], c17 = n[17];
  const ts = t0 + 0.2;
  const z = zc(ts);
  // 11 — genel görünüm
  z.set(ts, { camera: 'free', takip: '', labels: true, orbits: false, axes: false, speed: 0.5, pitch: 0.5, yaw: 0.55, distance: 22, clarity: 1.6, isik: 2.8 });
  z.git(c11.t + 1.0, c11.d, { yaw: 1.3, distance: 19 }, 'inOutSine');
  // 12 — Güneş kendi ekseni etrafında (yukarıdan: saat yönünün tersi)
  z.git(c12.t - 0.2, 1.8, { pitch: 1.12, distance: 9.5, speed: 2.4, yaw: 0.0 }, 'inOutCubic');
  z.set(c12.t + 0.5, { axes: true });
  // 13 — Dünya Güneş'in etrafında (yörünge çizgisi + yukarıdan görünüm)
  z.set(c13.t - 0.1, { axes: false, orbits: true });
  z.git(c13.t - 0.1, 2.0, { pitch: 1.13, distance: 19, speed: 1.0 }, 'inOutCubic');
  // 14 — Dünya kendi etrafında (kamera Dünya'yı izler)
  z.set(c14.t - 0.1, { takip: 'earth', orbits: false, axes: true });
  z.git(c14.t - 0.1, 1.6, { pitch: 0.34, distance: 3.6, speed: 0.45, yaw: 0.2 }, 'inOutCubic');
  // 15 — Ay kendi ekseni etrafında
  z.set(c15.t - 0.1, { takip: 'moon' });
  z.git(c15.t - 0.1, 1.4, { pitch: 0.3, distance: 1.7, speed: 0.4, yaw: 0.6 }, 'inOutCubic');
  // 16 — Ay Dünya'nın etrafında
  z.set(c16.t - 0.1, { takip: 'earth', axes: false, orbits: true });
  z.git(c16.t - 0.1, 1.6, { pitch: 1.0, distance: 5.4, speed: 0.4, yaw: 0.3 }, 'inOutCubic');
  // 17 — ikisi birlikte Güneş'in etrafında
  z.set(c17.t - 0.1, { takip: '', labels: true });
  z.git(c17.t - 0.1, 2.0, { pitch: 1.12, distance: 18, speed: 0.9, yaw: 0.0 }, 'inOutCubic');
  SIM('c-sim', gC, 'gunes-dunya-ay', ts, t1, z);

  // başlık hapları + alt bilgi çubukları + ikonlar
  BASLIK('c-b0', gC, 'HİÇ DURMAZLAR!', t0 + 0.6, c12.t - 0.3, '#fff0a6');
  BASLIK('c-b1', gC, 'GÜNEŞ', c12.t, c13.t - 0.1, '#ffe58f');
  BASLIK('c-b2', gC, 'DÜNYA', c13.t, c15.t - 0.1, '#cfe9ff');
  BASLIK('c-b3', gC, 'AY', c15.t, t1, '#e6defb');
  ALT('c-i11', gC, 'Hepsi sürekli hareket ediyor', c11.t + 1.2, c12.t - 0.3, '#fff0a6');
  ALT('c-i12', gC, "Güneş: kendi ekseni etrafında DÖNER", c12.t, c13.t - 0.1, '#ffe58f');
  ALT('c-i13', gC, "Dünya: Güneş'in etrafında DOLANIR · 365 gün 6 saat", c13.t, c14.t - 0.1, '#cfe9ff', 36);
  ALT('c-i14', gC, 'Dünya: kendi ekseni etrafında DÖNER · 1 gün = 24 saat', c14.t, c15.t - 0.1, '#cfe9ff', 36);
  ALT('c-i15', gC, 'Ay: kendi ekseni etrafında DÖNER · 27 gün 8 saat', c15.t, c16.t - 0.1, '#e6defb', 36);
  ALT('c-i16', gC, "Ay: Dünya'nın etrafında DOLANIR · 27 gün 8 saat", c16.t, c17.t - 0.1, '#e6defb', 36);
  ALT('c-i17', gC, "Ay, Dünya ile birlikte Güneş'in etrafında dolanır", c17.t, t1, '#e6defb', 36);

  const IK = [CX - 500, 345]; // kart sol üst köşe ikon konumu
  const ccw = (id, t, t2, px = 150, x = IK[0], y = IK[1]) => {
    const o = M(id, gC, 'donus-oku-cizim', x, y, px, t, t2, { pal: { a: CORAL }, dur: 0.8, cd: 0.4, cikis: 'kuculerek-cik' });
    o.rotation = [k(t, 0), k(t2, -300, 'linear')];
    return o;
  };
  // 12 — saat yönünün tersi oku + yazı
  ccw('c-ok12', c12.t + 0.4, c13.t - 0.1);
  T('c-ok12-t', gC, 'saat yönünün\ntersi', IK[0], IK[1] + 120, 28, c12.t + 0.9, c13.t - 0.1, { font: F_EL, weight: 400, color: CORAL, anim: 'harf-belir', lh: 1.1 });
  // 13 — takvim
  M('c-takvim', gC, 'takvim-cizim', IK[0], IK[1], 170, c13.t + 0.2, c14.t - 0.1, { dur: 0.8, cd: 0.4, cikis: 'kuculerek-cik', idle: 4 });
  T('c-takvim-t', gC, '365', IK[0], IK[1] + 36, 54, c13.t + 0.9, c14.t - 0.1, { font: F_BASLIK, weight: 900, color: INK, anim: 'harf-zipla' });
  ccw('c-ok13', c13.t + 1.0, c14.t - 0.1, 110, IK[0] + 150, IK[1] - 20);
  // 14 — saat: ibre saat yönünün tersine tam tur
  const sa = M('c-saat', gC, 'saat-cizim', IK[0], IK[1], 190, c14.t + 0.2, c15.t - 0.1, { dur: 0.8, cd: 0.4, cikis: 'kuculerek-cik' });
  sa.parts = { ibre: { rotation: [k(c14.t + 0.4, 0, 'linear'), k(c15.t - 0.5, -360, 'linear')] } };
  T('c-saat-t', gC, '24 saat', IK[0], IK[1] + 128, 40, c14.t + 0.9, c15.t - 0.1, { font: F_BASLIK, weight: 900, color: INK, anim: false, giris: 'zipla-gir', box: { color: '#fff0a6', radius: 22, padding: [4, 18], opacity: 1 } });
  ccw('c-ok14', c14.t + 1.0, c15.t - 0.1, 110, IK[0] + 150, IK[1] - 20);
  // 15–16 — Ay: dönüş oku / süre
  ccw('c-ok15', c15.t + 0.4, c16.t - 0.1, 130);
  M('c-ay15', gC, 'ay-cizim', IK[0], IK[1] + 130, 90, c15.t + 0.6, c16.t - 0.1, { dur: 0.7, cd: 0.4, cikis: 'kuculerek-cik', idle: 4 });
  M('c-halka16', gC, 'yorunge-halka-cizim', IK[0], IK[1], 170, c16.t + 0.3, c17.t - 0.1, { pal: { a: '#b6a5ee' }, dur: 0.9, cd: 0.4, cikis: 'kuculerek-cik' });
  ccw('c-ok16', c16.t + 0.6, c17.t - 0.1, 110, IK[0], IK[1]);
  // 17 — Dünya + Ay birlikte
  M('c-d17', gC, 'dunya-cizim', IK[0] - 36, IK[1], 110, c17.t + 0.3, t1, { dur: 0.8, cikis: false, idle: 4 });
  M('c-a17', gC, 'ay-cizim', IK[0] + 54, IK[1] - 34, 52, c17.t + 0.5, t1, { dur: 0.8, cikis: false, idle: 4 });
  ETIKET('c-eksen', gC, 'dönme ekseni', CX + 330, CY - 250, [CX + 75, CY - 120], c14.t + 1.0, c15.t - 0.2, CORAL, { size: 40, dx: -90, dy: 25, bend: 0.25 });
  SORU('c-soru', gC, 1780, 190, 130, c11.t + 0.1, c11.t + 3.6, 10);
  // merak: ikisi birden mi? (kelimeler önceden tanıtılır)
  hap('c-q1', gC, 'DÖNER Mİ?', CX - 220, 330, 320, 40, '#ffe0d6', c11.t + 1.2, c12.t - 0.3, { h: 78, t: { font: F_BASLIK, weight: 900 } });
  hap('c-q2', gC, 'DOLANIR MI?', CX + 170, 330, 380, 40, '#d9f3ea', c11.t + 2.2, c12.t - 0.3, { h: 78, t: { font: F_BASLIK, weight: 900 } });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM D — ÖZET + SON SORU (dönmeseydi? → Dünya dondurulmuş: gece-gündüz sınırı)
// ═══════════════════════════════════════════════════════════════════════════
const gD = 'g-d';
{
  const t0 = tD;
  yika('d-yika', gD, '#e3d9fb', 1340, 540, 1500, t0, null, { op: 0.9 });
  yika('d-yika2', gD, '#ffd9b8', 1580, 780, 700, t0 + 0.3, null, { op: 0.85, rot: 10 });
  const d18 = n[18], d19 = n[19];
  const kartSon = d19.t - 0.2;
  kutu('d-kart', gD, 'kart-kare', 1330, 560, 1000, 860, '#ffffff', t0 + 0.2, kartSon, { style: 'cizim', dur: 0.8 });
  T('d-baslik', gD, 'KOMŞULARIMIZIN HAREKETLERİ', 1330, 205, 52, t0 + 0.3, kartSon, { font: F_BASLIK, weight: 900, adur: 0.4 });
  M('d-bant', gD, 'bant-cizim', 1330, 140, 210, t0 + 0.4, kartSon, { pal: { a: PINK }, rot: -3, dur: 0.6, cd: 0.4, cikis: 'kuculerek-cik' });
  const satir = [
    ['gunes-cizim', 'GÜNEŞ', 'kendi ekseni etrafında döner', '#ffb300'],
    ['dunya-cizim', 'DÜNYA', 'döner (24 saat) + dolanır (365 gün 6 saat)', '#3b82f6'],
    ['ay-cizim', 'AY', 'döner + dolanır (27 gün 8 saat)', '#8a6fd1'],
  ];
  satir.forEach(([asset, ad, aciklama, renk], i) => {
    const y = 350 + i * 175, t = d18.t + 0.5 + i * (d18.d * 0.2);
    const ic = M(`d-ic${i}`, gD, asset, 880, y, 130, t, kartSon, { dur: 0.9, cd: 0.4, cikis: 'kuculerek-cik', idle: 4, ...(asset === 'gunes-cizim' ? { parts: isinDon(t0, SURE, -540) } : {}) });
    void ic;
    T(`d-ad${i}`, gD, ad, 1000, y - 34, 50, t + 0.1, kartSon, { font: F_BASLIK, weight: 900, color: renk, align: 'left', adur: 0.4 });
    T(`d-ac${i}`, gD, aciklama, 1000, y + 26, 34, t + 0.35, kartSon, { align: 'left', anim: 'harf-belir', aralik: 0.02 });
    M(`d-tik${i}`, gD, 'tik', 1790, y, 56, t + 0.5, kartSon, { pal: { a: GREEN }, giris: 'zipla-gir', dur: 0.5, cd: 0.4, cikis: 'kuculerek-cik' });
  });
  const dk = M('d-ccw', gD, 'donus-oku-cizim', 890, 855, 90, d18.t + d18.d * 0.74, kartSon, { pal: { a: CORAL }, dur: 0.7, cd: 0.4, cikis: 'kuculerek-cik' });
  dk.rotation = [k(d18.t + d18.d * 0.74, 0), k(kartSon, -300, 'linear')];
  hap('d-ters', gD, 'HEPSİ SAAT YÖNÜNÜN TERSİNE!', 1370, 860, 790, 38, '#ffe0d6', d18.t + d18.d * 0.74, kartSon, { h: 84, t: { font: F_BASLIK, weight: 900 } });

  // Son soru: gece örtüsü + Dünya dondurulmuş (speed 0): bir yarısı gündüz, bir yarısı gece
  const gece = L({ id: 'd-gece-zemin', group: gD, asset: 'kare', x: 960, y: 540, scaleX: r2(2000 / 200), scaleY: r2(1200 / 200), anchor: [0.5, 0.5], palette: { a: '#5b55b8' }, style: 'duz', start: r2(d19.t - 0.2),
    opacity: [k(d19.t - 0.2, 0), k(d19.t + 2.4, 0.94, 'inOutSine')], anims: [] });
  void gece;
  const zs = zc(d19.t + 0.1);
  zs.set(d19.t + 0.1, { camera: 'free', takip: 'earth', labels: false, orbits: false, axes: false, speed: 0, pitch: 0.2, yaw: -0.4, distance: 2.4, clarity: 2, isik: 3.2 });
  SIM('d-sim', gD, 'gunes-dunya-ay', d19.t + 0.1, SURE, zs, { x: CX, y: 560, w: 1000, h: 600, cikis: false, anims: [AN('zipla-gir', d19.t + 0.1, 0.8)] });
  L({ id: 'd-yildizlar', group: gD, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: r2(d19.t + 1.6), colors: ['#fff6b8', '#ffffff', '#d9ccff'], count: 30, opacity: 0.9, sfx: false });
  T('d-son', gD, 'Dünya hiç dönmeseydi?', 1400, 125, 70, d19.t + 0.9, null, { font: F_BASLIK, weight: 900, color: '#fff6d8', adur: 0.5, aralik: 0.04, cikis: false });
  T('d-gun', gD, 'GÜNDÜZ', 1060, 900, 40, d19.t + 3.0, null, { font: F_BASLIK, weight: 900, color: '#ffe58f', anim: 'harf-zipla', cikis: false });
  T('d-gece', gD, 'GECE', 1600, 900, 40, d19.t + 3.6, null, { font: F_BASLIK, weight: 900, color: '#b6a5ee', anim: 'harf-zipla', cikis: false });
  hap('d-yorum', gD, 'düşün ve yorumlara yaz!', 1330, 985, 720, 48, '#fff0a6', d19.t + d19.d - 3.0, null, { h: 100, t: { font: F_EL, weight: 400 }, kutu: { cikis: false } });
}

// ═══════════════════════════════════════════════════════════════════════════
// BÖLÜM G — BEĞEN · YORUM YAZ · ABONE OL (Kıpır söyler; kanal: youtube.com/@BayKipir)
// ═══════════════════════════════════════════════════════════════════════════
const gG = 'g-g';
layers.filter((l) => l.group === 'g-d' && (l.end == null || l.end > tG)).forEach((l) => { l.end = r2(tG); }); // D bölümünün açık uçlu katmanları geçişte biter
const abone = aboneBolumu({ L, M, T, hap, yika, AN, k, r2, tG, a: [n[20], n[21], n[22]], g: gG, renk: { INK, CORAL, BUTTER, MINT, SKY, LILAC, PINK }, fontBaslik: F_BASLIK, fontEl: F_EL });

// ─── Bölüm sekmeleri (sağ üst köşe) ────────────────────────────────────────
{
  const S = [[tA, tB, '1 · İçleri', PEACH, 'g-a'], [tB, tC, '2 · Boyutları', '#ffe58f', 'g-b'], [tC, tD, '3 · Hareketleri', MINT, 'g-c'], [tD, tG, '4 · Özet', LILAC, 'g-d']];
  S.forEach(([a, b, ad, renk, g], i) => hap(`tab${i}`, g, ad, 1680, 62, 420, 34, renk, a + 0.8, b, { h: 70, kutu: { style: 'cizim', ...(i === 3 ? { cikis: false } : {}) } }));
}

// ─── GÖZLÜ — anlatıcı (en üstte) ───────────────────────────────────────────
const soz = (i, metin, extra = {}) => ({ t: n[i].t, sure: n[i].d, metin: metin ?? SATIR[i - 1], ...extra });
const gozlu = K('gozlu', {
  id: 'gozlu', konum: [0.145, 0.955], boy: 0.64, varyant: 'mavi', ekler: ['sac-tutam'], start: 0.1, giris: 'zipla-gir',
  balon: { font: F_GOVDE, boyut: 42, genislik: 700, zemin: '#ffffff', yazi: INK },
  akis: [
    { t: 0.3, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 },
    { t: n[1].t + 3.6, aksiyon: 'isaret', hedef: 'i-sim', duygu: 'mutlu', bak: 'i-sim', sure: 2.4 },
    { t: n[2].t, aksiyon: 'dusun', duygu: 'dusunceli' },
    // A
    { t: n[3].t, aksiyon: 'tanit', hedef: 'a-sim', duygu: 'mutlu', bak: 'a-sim' },
    { t: n[4].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'a-sim' },
    { t: n[5].t, aksiyon: 'isaret', hedef: 'a-sim', duygu: 'mutlu', bak: 'a-sim' },
    { t: n[6].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'a-sim' },
    // B
    { t: n[7].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'b-sayfa' },
    { t: n[8].t, aksiyon: 'isaret', hedef: 'b-sim', duygu: 'mutlu', bak: 'b-sim' },
    { t: n[9].t, aksiyon: 'sevin', duygu: 'saskin', sure: 1.6 },
    { t: n[9].t + 2.0, aksiyon: 'isaret', hedef: 'b-sim', duygu: 'mutlu', bak: 'b-sim' },
    { t: n[10].t, aksiyon: 'tanit', hedef: 'b-p-gunes', duygu: 'cok-mutlu', bak: 'b-p-gunes' },
    // C
    { t: n[11].t, aksiyon: 'sevin', duygu: 'heyecanli', sure: 1.6 },
    { t: n[12].t, aksiyon: 'tanit', hedef: 'c-sim', duygu: 'mutlu', bak: 'c-sim' },
    { t: n[13].t, aksiyon: 'isaret', hedef: 'c-takvim', duygu: 'mutlu', bak: 'c-sim' },
    { t: n[14].t, aksiyon: 'isaret', hedef: 'c-saat', duygu: 'mutlu', bak: 'c-sim' },
    { t: n[15].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'c-sim' },
    { t: n[16].t, aksiyon: 'anlat', duygu: 'mutlu', bak: 'c-sim' },
    { t: n[17].t, aksiyon: 'tanit', hedef: 'c-sim', duygu: 'cok-mutlu', bak: 'c-sim' },
    // D
    { t: n[18].t, aksiyon: 'tanit', hedef: 'd-kart', duygu: 'mutlu', bak: 'd-kart' },
    { t: n[19].t, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'd-sim' },
    { t: n[19].t + n[19].d - 1.4, aksiyon: 'dusun', duygu: 'dusunceli', bak: 'd-sim' },
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
const muzik = (eski.audio || []).filter((a) => /dunya-komsular-muzik/.test(a.file));
muzik.forEach((m, i) => {
  const son = i === muzik.length - 1;
  audio.push({ ...m, volume: 0.2, ...(son ? { dur: r2(Math.max(10, SURE - m.start)), fadeOut: 3 } : {}) });
});

const scene = {
  name: "Dünya'mız ve Gökyüzündeki Komşularımız — Kıpır ile ders (simülasyonlu)",
  width: W, height: H, fps: FPS, duration: SURE,
  style: 'cizim',
  sketch: { ink: '#3d3a73', width: 3.4, wobble: 1.3, hatch: 5.5, angle: 62, cross: true, wipe: 35, grain: 0.3 },
  theme: {
    name: 'Gökyüzü Defteri', paper: 'pastel',
    colors: { arka1: '#fff7ec', arka2: '#ffe8da', baslik: '#3d3a73', metin: '#4a4780', vurgu: '#ff7f6e' },
    background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180, paper: 0.45, vignette: 0.16 },
  },
  camera: { zoom: (() => { const a = []; [[0, tA], [tA, tB], [tB, tC], [tC, tD], [tD, tG], [tG, SURE]].forEach(([s0, s1]) => { a.push(k(s0 + 0.02, 1), k(s1 - 0.05, 1.04, 'inOutSine')); }); return a; })() },
  publish: {
    title: "Dünya'mız ve Gökyüzündeki Komşularımız 🌍☀️🌙 | Güneş, Dünya ve Ay | 5. Sınıf Fen",
    description: "Kıpır ile Güneş, Dünya ve Ay'ı yakından tanıyoruz! Üç gök cisminin katmanlarına simülasyonla bakıyor, boyutlarını kıyaslıyor ve hareketlerini izliyoruz: Güneş kendi ekseninde döner, Dünya hem döner hem Güneş'in etrafında dolanır, Ay hem döner hem Dünya'nın etrafında dolanır. 5. sınıf Fen Bilimleri \"Gökyüzündeki Komşularımız ve Biz\" konusu. Beğen, abone ol ve Dünya hiç dönmeseydi gece ile gündüz nasıl olurdu, yorumlara yaz!",
    tags: ['güneş', 'dünya', 'ay', 'güneş dünya ay', 'dünyanın hareketleri', 'ayın hareketleri', 'dönme ve dolanma', 'güneşin katmanları', 'dünyanın katmanları', 'gök cisimleri', '5. sınıf fen', 'fen bilimleri', 'gökyüzündeki komşularımız ve biz', 'simülasyon', 'ders anlatımı', 'çocuklar için bilim'],
  },
  audio,
  sfx: { auto: true, volume: 0.45 },
  sections: [
    { t: 0, name: 'Giriş' }, { t: tA, name: 'İçleri' }, { t: tB, name: 'Boyutları' }, { t: tC, name: 'Hareketleri' }, { t: tD, name: 'Özet ve soru' }, { t: tG, name: 'Abone ol' },
  ],
  transitions: [
    { type: 'kepenk', t: tA, dur: 1.0, color: '#ffe3a8' },
    { type: 'dalga', t: tB, dur: 1.1, color: '#bfd3f0' },
    { type: 'capraz', t: tC, dur: 1.1, color: '#c9b8f5' },
    { type: 'elmas', t: tD, dur: 1.1, color: '#ffd9b8' },
    { type: 'dalga', t: tG, dur: 1.1, color: '#ffd1cc', yon: 'sol' },
  ],
  groups: [
    { id: 'g-i', name: '0 · Giriş' }, { id: 'g-a', name: '1 · İçleri', collapsed: true }, { id: 'g-b', name: '2 · Boyutları', collapsed: true },
    { id: 'g-c', name: '3 · Hareketleri', collapsed: true }, { id: 'g-d', name: '4 · Özet ve soru', collapsed: true }, { id: 'g-g', name: '5 · Abone ol', collapsed: true }, { id: 'g-gozlu', name: 'Kıpır' },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
if (process.env.TT) console.log(JSON.stringify(n));
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn · bölümler: A ${tA} · B ${tB} · C ${tC} · D ${tD}`);
