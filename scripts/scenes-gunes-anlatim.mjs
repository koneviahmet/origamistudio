// "Gökyüzündeki Komşumuz: Güneş" — 5. sınıf Fen Bilimleri, 16:9, sesli (TTS + müzik + efekt).
// Konsept: "Merak Gözlemevi" — koyu mor gece gökyüzü, tek ışık kaynağı Güneş. Her SORU anında kamera "yumruk" zoom yapar,
// pembe/sarı soru rozeti ve iris geçişi gelir (çocuklar soruyu fark etsin); cevap sıcak turuncu sahnelerle verilir.
//   node scripts/scenes-gunes-anlatim.mjs   (önce: npm run seslendir ... ; npm run muzik ...)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zarfCikar } from './sablonlar/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJE_ID = 'gunes-anlatim';
const W = 1920, H = 1080, FPS = 30;
const STIL = process.env.STIL || 'mozaik';
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

// ─── Seslendirme süreleri (npm run seslendir çıktısı) ──────────────────────
const DUR = [5.76, 5.12, 6.88, 3.04, 5.44, 11.36, 3.36, 7.04, 2.4, 6.24, 5.92, 9.44, 8.96, 12.8, 5.92];
const SON_DUR = 6.56;
const YENI_SAHNE = new Set([0, 1, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14]); // bu satırdan önce sahne değişir
const CEVAP_ONCESI = new Set([4, 7, 9]); // sorudan sonra düşünme payı
const S = [];
{
  let t = 0.8;
  DUR.forEach((d, i) => {
    if (i > 0) t += CEVAP_ONCESI.has(i) ? 1.3 : YENI_SAHNE.has(i) ? 0.65 : 0.45;
    S.push(r2(t));
    t += d;
  });
}
const SON_S = r2(S[14] + DUR[14] + 3.4); // geri sayım payı
const SURE = r2(SON_S + SON_DUR + 1.6);
const SFIN = SON_S;
const line = (i, off = 0) => S[i] + off;
const PRE = 0.55; // sahne kesme anı = ilk cümleden önce
const T = { // sahne başlangıçları (kesme anı)
  s0: 0, s1: S[0] + 6.3, // açılış sonrası
};
// sahne başlangıçları: ilk satırından PRE önce
const SC = {
  acilis: 0, tanitim: S[1] - PRE, q1: S[3] - PRE, bilesim: S[4] - PRE, konum: S[5] - PRE, q2: S[6] - PRE, cevap2: S[7] - PRE,
  q3: S[8] - PRE, leke: S[9] - PRE, galileo: S[10] - PRE, guvenlik: S[12] - PRE, ozet: S[13] - PRE, final: S[14] - PRE, son: SON_S - 0.2,
};
const ENDS = { acilis: SC.tanitim, tanitim: SC.q1, q1: SC.bilesim, bilesim: SC.konum, konum: SC.q2, q2: SC.cevap2, cevap2: SC.q3, q3: SC.leke, leke: SC.galileo, galileo: SC.guvenlik, guvenlik: SC.ozet, ozet: SC.final, final: SURE };

/** cümle başlangıçları: bir satırın içindeki cümleler karakter oranıyla dağıtılır */
const sent = (i, parts) => {
  const tot = parts.reduce((s, p) => s + p.length, 0);
  let acc = 0;
  return parts.map((p) => { const t = S[i] + (acc / tot) * DUR[i] * 0.92; acc += p.length; return r2(t); });
};

// ─── Model boyutları ───────────────────────────────────────────────────────
const libSize = {};
const lib = (id) => {
  if (!libSize[id]) {
    for (const cat of fs.readdirSync(path.join(ROOT, 'data', 'library'))) {
      const f = path.join(ROOT, 'data', 'library', cat, id + '.json');
      if (fs.existsSync(f)) { const a = JSON.parse(fs.readFileSync(f, 'utf8')); libSize[id] = Math.max(...a.size); break; }
    }
  }
  if (!libSize[id]) throw new Error('model yok: ' + id);
  return libSize[id];
};

// ─── Bileşen yardımcıları ──────────────────────────────────────────────────
const FONT_B = 'Lexend'; // başlık
const FONT_G = 'Lexend'; // gövde
/** 3B model: px = en uzun kenar (piksel) */
const mdl = (id, asset, x, y, px, t0, t1, o = {}) => {
  const { anims = [], extra = {}, giris = 'katlanarak-gir', girisDur = 1.0 } = o;
  return L({
    id, asset, x, y, scale: r2(px / lib(asset)), start: r2(t0), end: r2(t1), ...(o.variant ? { variant: o.variant } : {}), ...extra,
    anims: [
      ...(giris ? [{ preset: giris, t: r2(t0 + (o.gecikme ?? 0.5)), dur: girisDur, ...(giris === 'katlanarak-gir' ? { sira: 'radial' } : {}) }] : []),
      ...anims,
    ],
  });
};
/** etiket / bilgi kutusu */
const chip = (id, text, x, y, t0, t1, o = {}) => L({
  id, type: 'text', text, x, y, size: o.size || 58, font: FONT_G, weight: o.weight || 800, color: o.color || '#1a0f3c', align: 'center', lineHeight: 1.15,
  box: { color: o.bg || '#ffd93d', radius: o.radius ?? 36, padding: o.padding || [20, 44] },
  start: r2(t0), end: r2(t1), shadow: { color: 'rgba(0,0,0,.35)', blur: 18, x: 0, y: 10 },
  anims: [{ preset: o.giris || 'zipla-gir', t: r2(t0), dur: 0.55 }, ...(o.anims || [])], ...(o.extra || {}),
});
/** düz metin */
const yazi = (id, text, x, y, t0, t1, o = {}) => L({
  id, type: 'text', text, x, y, size: o.size || 64, font: o.font || FONT_B, weight: o.weight || 800, color: o.color || '$baslik', align: 'center', lineHeight: o.lh || 1.12,
  start: r2(t0), end: r2(t1), ...(o.stroke ? { stroke: o.stroke } : {}), shadow: o.shadow === false ? undefined : { color: 'rgba(10,5,40,.55)', blur: 14, x: 0, y: 8 },
  ...(o.ta === false ? {} : { textAnims: [{ preset: o.ta || 'kelime-zipla', t: r2(t0 + (o.d ?? 0.15)), dur: 0.5, aralik: o.aralik ?? 0.09 }] }),
  anims: o.anims || [], ...(o.extra || {}),
});
const isik = (id, x, y, t0, t1, o = {}) => L({ id, type: 'particles', particle: o.p || 'yildiz-tozu', mode: o.mode || 'surekli', x, y, start: r2(t0), end: r2(t1), ...(o.kw || {}) });

const cam = []; // kamera keyframe'leri (x, y, zoom)
const kam = (t0, t1, z0, z1, x0 = 960, y0 = 540, x1 = x0, y1 = y0, ease = 'inOutSine') => {
  cam.push({ t: t0, z: z0, x: x0, y: y0, ease }, { t: t1 - 0.03, z: z1, x: x1, y: y1 });
};
/** soru anı: kamera yumruk zoom (büyük → normale, hafif dönüş) */
const soruKam = (t0, t1) => {
  cam.push({ t: t0 + 0.4, z: 1.32, x: 960, y: 500, ease: 'outBack' }, { t: t0 + 1.0, z: 1.0, x: 960, y: 540, ease: 'inOutSine' },
    { t: t1 - 0.03, z: 1.07, x: 960, y: 520 });
};

// ─── Arka plan: yıldız tozu her yerde ──────────────────────────────────────
L({ id: 'yildizlar', type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: 0, end: SURE, count: 90, size: 22, seed: 7, colors: ['#fff3c4', '#ffffff', '#b9a8ff'], area: [0, 0, W, H], depth: 6 });

// ═══════════════════════════════════════════════════════════════════════════
// 0 — AÇILIŞ
{
  const t0 = 0, t1 = ENDS.acilis;
  kam(t0, t1, 1.0, 1.06, 960, 540, 1000, 530);
  L({ id: 'ac-hale', type: 'particles', particle: 'kivilcim', mode: 'surekli', x: 1400, y: 540, start: 0, end: t1, count: 40, size: 18, colors: ['#ffd93d', '#ff9a1f', '#fff3c4'], area: [1000, 300, 1900, 900] });
  mdl('ac-gunes', 'gunes-3d', 1400, 540, 760, t0, t1, { gecikme: 0.2, girisDur: 1.4, anims: [{ preset: 'don', t: 1.2, periyot: 50, yon: '-1' }, { preset: 'nefes', t: 1.2, genlik: 0.025, periyot: 3 }] });
  yazi('ac-b1', 'Gökyüzündeki', 560, 250, t0 + 0.4, t1, { size: 104, color: '#fff3df', ta: 'harf-zipla', aralik: 0.04 });
  yazi('ac-b2', 'Komşumuz', 560, 370, t0 + 1.0, t1, { size: 120, color: '#fff3df', ta: 'harf-zipla', aralik: 0.04 });
  yazi('ac-b3', 'GÜNEŞ', 560, 620, t0 + 1.7, t1, { size: 230, color: '#ffd93d', ta: 'harf-katla', aralik: 0.08, stroke: { color: '#e8621a', width: 14 } });
  chip('ac-sinif', '5. Sınıf Fen Bilimleri', 560, 860, t0 + 2.8, t1, { size: 50, bg: '#ff7a3d', color: '#ffffff' });
  mdl('ac-astronot', 'astronot-3d', 1020, 830, 310, t0, t1, { gecikme: 2.4, giris: 'zipla-gir', girisDur: 0.7, anims: [{ preset: 'sallan', t: 3.3, aci: 7, periyot: 1.2 }, { preset: 'suzul', t: 3.3, genlik: 10, periyot: 2.6 }] });
  mdl('ac-dunya', 'dunya-3d', 1760, 190, 150, t0, t1, { gecikme: 1.5, anims: [{ preset: 'suzul', t: 2.5, genlik: 10, periyot: 3.4 }] });
  chip('ac-selam', 'Merhaba kaşifler!', 1020, 660, S[0] + 0.3, S[0] + 3.2, { size: 46, bg: '#3ee0c2', color: '#0e2a3a' });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 — TANITIM (ısı-ışık kaynağı / orta büyüklükte yıldız / küre-gaz-katman)
{
  const t0 = SC.tanitim, t1 = ENDS.tanitim, ls = S[2] - 0.2;
  kam(t0, t1, 1.0, 1.08, 960, 540, 820, 520);
  yazi('t-baslik', 'Güneş nedir?', 960, 130, t0 + 0.55, t1, { size: 88, color: '#ffd93d' });
  mdl('t-gunes', 'gunes-3d', 560, 590, 620, t0, ls, { gecikme: 0.4, anims: [{ preset: 'don', t: t0 + 1.4, periyot: 60, yon: '-1' }, { preset: 'kuculerek-cik', t: ls - 0.6, dur: 0.6 }] });
  mdl('t-kesit', 'gunes-kesit-3d', 560, 590, 640, ls, t1, { gecikme: 0.2, anims: [{ preset: 'suzul', t: ls + 1.2, genlik: 10, periyot: 3 }] });
  isik('t-kv', 560, 590, t0 + 1, ls, { p: 'kivilcim', kw: { count: 30, area: [260, 330, 880, 850] } });
  const a = sent(1, ['Güneş, Dünya\'nın ısı ve ışık kaynağıdır.', 'Orta büyüklükte bir yıldızdır.']);
  chip('t-c1', 'Dünya\'nın ısı ve\nışık kaynağı', 1390, 380, a[0], ls - 0.3, { bg: '#ffd93d' });
  chip('t-c2', 'Orta büyüklükte\nbir yıldız', 1390, 640, a[1], ls - 0.3, { bg: '#ff7a3d', color: '#ffffff' });
  const b = sent(2, ['Şekli küre gibidir.', 'Gazlardan oluşur ve yapısında hidrojen gazı bulunur.', 'Tıpkı Dünya gibi, o da katmanlardan oluşur.']);
  chip('t-c3', 'Küre şeklinde', 1390, 300, b[0], t1, { bg: '#3ee0c2', color: '#0e2a3a' });
  chip('t-c4', 'Gazlardan oluşur\n(hidrojen gazı var)', 1390, 520, b[1], t1, { bg: '#ffd93d' });
  chip('t-c5', 'Dünya gibi\nkatmanlı', 1390, 780, b[2], t1, { bg: '#ff7a3d', color: '#ffffff' });
  yazi('t-ipucu', 'kesit: katmanlar', 560, 960, ls + 0.9, t1, { size: 40, color: '#b9a8ff', weight: 700, ta: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// SORU sahnesi üretici
const soru = (p, t0, t1, satirlar, o = {}) => {
  soruKam(t0, t1);
  isik(p + '-yt', 960, 540, t0, t1, { p: 'yildiz-yagmuru', kw: { count: 26, size: 34, speed: 120, colors: ['#ffd93d', '#ff6fa8', '#3ee0c2'] } });
  mdl(p + '-rozet', 'soru-rozeti', o.rx ?? 960, o.ry ?? 400, o.rpx ?? 560, t0, t1, { gecikme: 0.15, giris: 'zipla-gir', girisDur: 0.8, variant: o.variant, anims: [{ preset: 'don', t: t0 + 1, periyot: 40, yon: '-1' }, { preset: 'nabiz', t: t0 + 1, genlik: 0.05, periyot: 1.1 }] });
  L({ id: p + '-isaret', type: 'text', text: '?', x: o.rx ?? 960, y: (o.ry ?? 400) + 10, size: Math.round((o.rpx ?? 560) * 0.72), font: FONT_B, weight: 900, color: '#ffffff', align: 'center', start: r2(t0), end: r2(t1),
    stroke: { color: o.strokeC || '#6a3de8', width: 10 }, shadow: { color: 'rgba(0,0,0,.35)', blur: 10, x: 0, y: 8 },
    anims: [{ preset: 'zipla-gir', t: r2(t0 + 0.45), dur: 0.7 }, { preset: 'nabiz', t: r2(t0 + 1.4), genlik: 0.06, periyot: 1.1 }] });
  chip(p + '-etiket', 'MERAK SORUSU', o.ex ?? 960, 92, t0 + 0.3, t1, { size: 44, bg: '#ff6fa8', color: '#ffffff', giris: 'kayarak-gir', extra: { letterSpacing: 4 } });
  satirlar.forEach((s, i) => yazi(`${p}-s${i}`, s, o.tx ?? 960, (o.ty ?? 790) + i * 110, t0 + 0.9 + i * 0.25, t1, { size: o.tsize || 86, color: '#fff3df', stroke: { color: '#1a0f3c', width: 12 } }));
  yazi(p + '-dus', 'Sen ne düşünüyorsun?', o.tx ?? 960, o.dy ?? 1000, S[o.satir] + DUR[o.satir] + 0.15, t1, { size: 48, color: '#3ee0c2', weight: 700, ta: 'harf-belir', aralik: 0.04 });
};

// 2 — SORU 1
{
  const t0 = SC.q1, t1 = ENDS.q1;
  soru('q1', t0, t1, ['Güneş', 'neyden yapılmış olabilir?'], { satir: 3, ty: 800, tsize: 84 });
  mdl('q1-astro', 'astronot-3d', 330, 640, 330, t0, t1, { gecikme: 0.9, giris: 'kayarak-gir', extra: { rotation: -8 }, anims: [{ preset: 'suzul', t: t0 + 2, genlik: 10, periyot: 2.6 }] });
  mdl('q1-gunes', 'gunes-3d', 1600, 330, 300, t0, t1, { gecikme: 1.0, anims: [{ preset: 'don', t: t0 + 2, periyot: 30, yon: '-1' }] });
}

// 3 — BİLEŞİM (grafik)
{
  const t0 = SC.bilesim, t1 = ENDS.bilesim;
  kam(t0, t1, 1.0, 1.06, 960, 540, 900, 540);
  yazi('b-baslik', 'Güneş neyden oluşur?', 960, 120, t0 + 0.55, t1, { size: 78, color: '#ffd93d' });
  L({
    id: 'b-grafik', type: 'chart', kind: 'donut', x: 560, y: 590, width: 820, height: 780, start: t0, end: t1, unit: '%', decimals: 1, textColor: '#2a1450', card: true, font: FONT_G,
    data: [{ label: 'Hidrojen', value: 71, color: '#ff8a1f' }, { label: 'Helyum', value: 26.5, color: '#ffd93d' }, { label: 'Diğer gazlar', value: 2.5, color: '#3ee0c2' }],
    fold: [k(t0 + 0.6, 0), k(t0 + 2.6, 1, 'outCubic')], anims: [{ preset: 'zipla-gir', t: t0 + 0.5, dur: 0.7 }],
  });
  const hh = S[4];
  chip('b-h', '%71 hidrojen', 1420, 330, hh + 0.4, t1, { size: 72, bg: '#ff8a1f', color: '#ffffff', padding: [24, 50] });
  chip('b-he', '%26,5 helyum', 1420, 540, hh + 2.0, t1, { size: 72, bg: '#ffd93d', padding: [24, 50] });
  chip('b-d', '%2,5 diğer gazlar', 1420, 750, hh + 3.6, t1, { size: 64, bg: '#3ee0c2', color: '#0e2a3a', padding: [24, 50] });
  mdl('b-gunes', 'gunes-3d', 1650, 930, 210, t0, t1, { gecikme: 1.2, anims: [{ preset: 'don', t: t0 + 2, periyot: 25, yon: '-1' }] });
}

// 4 — KONUM, UZAKLIK, YAŞ
{
  const t0 = SC.konum, t1 = ENDS.konum;
  kam(t0, t1, 1.0, 1.1, 800, 560, 1000, 520);
  const a = sent(5, ['Güneş, Güneş Sistemi\'nin tam merkezindedir ve Dünya\'ya en yakın yıldızdır.', 'Dünya ile arasındaki uzaklık yaklaşık yüz elli milyon kilometredir.', 'Yaşı ise yaklaşık beş milyar yıl.']);
  mdl('k-gunes', 'gunes-3d', 380, 560, 600, t0, t1, { gecikme: 0.3, anims: [{ preset: 'don', t: t0 + 1.4, periyot: 50, yon: '-1' }, { preset: 'nefes', t: t0 + 1.4, genlik: 0.02, periyot: 3 }] });
  mdl('k-dunya', 'dunya-3d', 1580, 560, 170, t0, t1, { gecikme: 0.9, anims: [{ preset: 'suzul', t: t0 + 2, genlik: 9, periyot: 3.2 }, { preset: 'don', t: t0 + 2, periyot: 20, yon: '-1' }] });
  chip('k-merkez', 'Güneş Sistemi\'nin merkezi', 960, 150, a[0], t1, { size: 60, bg: '#ffd93d' });
  chip('k-yakin', 'Dünya\'ya en yakın yıldız', 960, 275, a[0] + 1.6, t1, { size: 52, bg: '#3ee0c2', color: '#0e2a3a' });
  L({ id: 'k-ok', type: 'arrow', arrow: 'ok-kesikli-rota', from: [700, 560], to: [1470, 560], color: '#fff3df', width: 10, bend: 0, start: r2(a[1] - 0.2), end: r2(t1),
    fold: [k(a[1], 0), k(a[1] + 1.8, 1, 'inOutSine')] });
  chip('k-km', 'yaklaşık 150 milyon km', 1150, 700, a[1] + 1.4, t1, { size: 62, bg: '#ff7a3d', color: '#ffffff', padding: [22, 48] });
  chip('k-yas', 'Yaşı: yaklaşık 5 milyar yıl', 960, 900, a[2], t1, { size: 60, bg: '#b9a8ff', color: '#1a0f3c' });
  isik('k-kv', 380, 560, t0 + 1, t1, { p: 'kivilcim', kw: { count: 30, area: [80, 260, 700, 860] } });
}

// 5 — SORU 2
{
  const t0 = SC.q2, t1 = ENDS.q2;
  soru('q2', t0, t1, ['Güneş neden diğer yıldızlardan', 'daha büyük görünüyor?'], { satir: 6, variant: 'sari', strokeC: '#1f3a8a', ty: 800, tsize: 76, dy: 1010 });
  mdl('q2-gunes', 'gunes-3d', 1600, 420, 420, t0, t1, { gecikme: 1.2, anims: [{ preset: 'nefes', t: t0 + 2, genlik: 0.04, periyot: 2 }] });
  mdl('q2-y1', 'gunes-3d', 260, 330, 120, t0, t1, { gecikme: 1.5, variant: 'mavi', anims: [{ preset: 'nefes', t: t0 + 2, genlik: 0.05, periyot: 2.3 }] });
  mdl('q2-y2', 'gunes-3d', 380, 560, 90, t0, t1, { gecikme: 1.8, variant: 'kirmizi', anims: [{ preset: 'nefes', t: t0 + 2, genlik: 0.05, periyot: 1.9 }] });
}

// 6 — CEVAP 2: yakın = büyük görünür
{
  const t0 = SC.cevap2, t1 = ENDS.cevap2;
  kam(t0, t1, 1.0, 1.08, 900, 540, 1050, 500);
  const a = sent(7, ['Gökyüzünde Güneş\'ten çok daha büyük yıldızlar var!', 'Ama Güneş, Dünya\'ya daha yakın olduğu için bize daha büyük görünür.']);
  isik('c2-st', 960, 540, t0, t1, { p: 'yildiz-tozu', kw: { count: 50, size: 20, area: [900, 100, 1900, 900] } });
  mdl('c2-dunya', 'dunya-3d', 240, 860, 250, t0, t1, { gecikme: 0.3, anims: [{ preset: 'suzul', t: t0 + 1, genlik: 8, periyot: 3 }] });
  mdl('c2-gunes', 'gunes-3d', 700, 480, 520, t0, t1, { gecikme: 0.3, giris: 'katlanarak-gir', anims: [{ preset: 'don', t: t0 + 1, periyot: 50, yon: '-1' }] });
  mdl('c2-mavi', 'gunes-3d', 1630, 280, 230, a[0], t1, { gecikme: 0, variant: 'mavi', extra: { depth: 4 }, anims: [{ preset: 'nefes', t: a[0] + 1, genlik: 0.04, periyot: 2.4 }] });
  mdl('c2-kirmizi', 'gunes-3d', 1560, 760, 300, a[0] + 0.5, t1, { gecikme: 0, variant: 'kirmizi', extra: { depth: 4 }, anims: [{ preset: 'nefes', t: a[0] + 1.5, genlik: 0.04, periyot: 2.9 }] });
  chip('c2-etk1', 'Bu yıldızlar daha büyük\nama çok uzakta!', 1430, 500, a[0] + 0.8, a[1] - 0.2, { size: 50, bg: '#b9a8ff' });
  L({ id: 'c2-ok', type: 'arrow', arrow: 'ok-kesikli-rota', from: [330, 800], to: [620, 600], color: '#ffd93d', width: 10, start: r2(a[1]), end: r2(t1), fold: [k(a[1] + 0.2, 0), k(a[1] + 1.2, 1, 'inOutSine')], label: 'yakın', labelFont: FONT_G, labelSize: 56, labelColor: '#ffd93d' });
  L({ id: 'c2-ok2', type: 'arrow', arrow: 'ok-kesikli-rota', from: [330, 800], to: [1500, 330], color: '#b9a8ff', width: 6, bend: 0.25, start: r2(a[0] + 1.6), end: r2(a[1] - 0.2), fold: [k(a[0] + 1.6, 0), k(a[0] + 3.0, 1, 'inOutSine')], label: 'çok uzak', labelFont: FONT_G, labelSize: 52, labelColor: '#b9a8ff' });
  chip('c2-etk2', 'Yakın olan,\ndaha büyük görünür!', 1330, 620, a[1] + 1.0, t1, { size: 60, bg: '#ffd93d', extra: {} });
}

// 7 — SORU 3
{
  const t0 = SC.q3, t1 = ENDS.q3;
  soru('q3', t0, t1, ['Güneş\'te karanlık', 'noktalar neden var?'], { satir: 8, rx: 560, tx: 560, ry: 400, ty: 800, tsize: 88, strokeC: '#6a3de8', dy: 1010 });
  mdl('q3-leke', 'gunes-lekeli-3d', 1450, 520, 720, t0, t1, { gecikme: 0.8, anims: [{ preset: 'nefes', t: t0 + 2, genlik: 0.02, periyot: 3 }] });
  mdl('q3-astro', 'astronot-3d', 880, 250, 240, t0, t1, { gecikme: 1.2, giris: 'zipla-gir', extra: { rotation: 10 }, anims: [{ preset: 'suzul', t: t0 + 2, genlik: 9, periyot: 2.8 }] });
}

// 8 — CEVAP 3: güneş lekeleri
{
  const t0 = SC.leke, t1 = ENDS.leke;
  kam(t0, t1, 1.05, 1.0, 960, 540, 820, 540);
  const a = sent(9, ['Bunlara Güneş lekeleri denir.', 'Sıcaklıkları çevresindeki bölgelerden daha düşük olduğu için karanlık görünürler.']);
  mdl('l-gunes', 'gunes-lekeli-3d', 600, 560, 740, t0, t1, { gecikme: 0.3, girisDur: 1.0, anims: [{ preset: 'nefes', t: t0 + 1.4, genlik: 0.015, periyot: 3 }] });
  isik('l-kv', 600, 560, t0 + 1, t1, { p: 'kivilcim', kw: { count: 24, area: [230, 190, 970, 930] } });
  chip('l-c1', 'Güneş lekeleri', 1420, 270, a[0] + 0.1, t1, { size: 72, bg: '#ffd93d', padding: [24, 50] });
  L({ id: 'l-ok1', type: 'arrow', arrow: 'ok-kalin-golge', from: [1250, 330], to: [700, 470], color: '#ffd93d', width: 9, start: r2(a[0] + 0.4), end: r2(t1), fold: [k(a[0] + 0.5, 0), k(a[0] + 1.3, 1, 'inOutSine')] });
  chip('l-c2', 'Çevresinden daha\nDÜŞÜK sıcaklık', 1420, 560, a[1] + 0.2, t1, { size: 58, bg: '#63c7ff', color: '#0b2a4a', padding: [24, 50] });
  chip('l-c3', 'Sıcaklık düşük\n= karanlık görünür', 1420, 800, a[1] + 2.4, t1, { size: 58, bg: '#ff7a3d', color: '#ffffff', padding: [24, 50] });
}

// 9 — GALİLEO (teleskop + lekelerin kayması)
{
  const t0 = SC.galileo, t1 = ENDS.galileo, ls = S[11] - 0.25;
  kam(t0, t1, 1.0, 1.06, 960, 540, 900, 520);
  const a = sent(10, ['Güneş\'in yüzeyini, kendi yaptığı teleskopla', 'ilk inceleyen bilim insanı Galileo Galilei\'dir.']);
  mdl('g-tel', 'teleskop-3d', 520, 580, 640, t0, ls, { gecikme: 0.3, anims: [{ preset: 'suzul', t: t0 + 1.5, genlik: 8, periyot: 3 }, { preset: 'kuculerek-cik', t: ls - 0.6, dur: 0.6 }] });
  yazi('g-ad', 'Galileo Galilei', 1380, 330, a[0], ls - 0.3, { size: 84, color: '#ffd93d' });
  chip('g-yil', '1564 – 1642', 1380, 470, a[0] + 0.6, ls - 0.3, { size: 60, bg: '#b9a8ff' });
  chip('g-t', 'Kendi yaptığı teleskopla\nGüneş\'in yüzeyini ilk\ninceleyen bilim insanı', 1380, 700, a[1] - 1.2, ls - 0.3, { size: 50, bg: '#3ee0c2', color: '#0e2a3a', padding: [22, 40] });
  // lekelerin kayması
  const b = sent(11, ['Galileo, lekelerin belli bir sürede hep aynı yöne kaydığını gördü.', 'Bu, Güneş\'in kendi etrafında saat yönünün tersine döndüğünü gösterdi.']);
  yazi('g-b', 'Lekeler hep aynı yöne kayıyor!', 960, 130, ls + 0.3, t1, { size: 76, color: '#ffd93d' });
  const pos = [['gunes-lekeli-sol-3d', 400], ['gunes-lekeli-3d', 960], ['gunes-lekeli-sag-3d', 1520]];
  pos.forEach(([asset, x], i) => mdl('g-l' + i, asset, x, 520, 400, ls + 0.2 + i * 1.0, t1, { gecikme: 0.1, girisDur: 0.8 }));
  [0, 1].forEach((i) => L({ id: 'g-ok' + i, type: 'arrow', arrow: 'ok-neon', from: [[590, 520], [1150, 520]][i], to: [[770, 520], [1330, 520]][i], width: 10, start: r2(ls + 1.6 + i), end: r2(t1), fold: [k(ls + 1.6 + i, 0), k(ls + 2.4 + i, 1, 'inOutSine')] }));
  chip('g-donus', 'Güneş kendi etrafında\nsaat yönünün tersine döner', 960, 900, b[1] - 0.2, t1, { size: 62, bg: '#ff7a3d', color: '#ffffff', padding: [22, 54] });
}

// 10 — GÜVENLİK
{
  const t0 = SC.guvenlik, t1 = ENDS.guvenlik;
  kam(t0, t1, 1.0, 1.05, 960, 540, 900, 540);
  const a = sent(12, ['Dikkat!', 'Güneş\'e asla çıplak gözle bakmayın.', 'Dürbün, teleskop, mercek ya da kamerayla da bakılmaz.', 'Gözlem için özel filtre gerekir.']);
  const alarm = t0 + 0.55;
  L({ id: 'v-fon', type: 'particles', particle: 'kivilcim', mode: 'surekli', x: 560, y: 560, start: r2(t0), end: r2(t1), count: 26, size: 16, colors: ['#ff4d4d', '#ffd93d'], area: [200, 250, 920, 900] });
  mdl('v-gunes', 'gunes-3d', 520, 450, 440, t0, t1, { gecikme: 0.3 });
  mdl('v-yasak', 'yasak-isareti', 520, 450, 600, t0, a[3] - 0.1, { gecikme: 0.4, giris: 'zipla-gir', girisDur: 0.7, anims: [{ preset: 'titre', t: alarm + 1.2, genlik: 5 }, { preset: 'nabiz', t: alarm + 1.2, genlik: 0.04, periyot: 0.8 }, { preset: 'kuculerek-cik', t: a[3] - 0.7, dur: 0.6 }] });
  mdl('v-gozluk', 'guvenlik-gozlugu-3d', 520, 720, 680, a[3], t1, { gecikme: 0.1, giris: 'zipla-gir', girisDur: 0.7, anims: [{ preset: 'suzul', t: a[3] + 1, genlik: 10, periyot: 2.6 }] });
  L({ id: 'v-dikkat', type: 'text', text: 'DİKKAT!', x: 1340, y: 160, size: 150, font: FONT_B, weight: 900, color: '#ffffff', align: 'center', start: r2(t0 + 0.4), end: r2(t1),
    box: { color: '#e5283c', radius: 30, padding: [18, 60] }, shadow: { color: 'rgba(0,0,0,.45)', blur: 16, x: 0, y: 10 },
    anims: [{ preset: 'zipla-gir', t: r2(t0 + 0.5), dur: 0.6 }, { preset: 'titre', t: r2(t0 + 1.3), genlik: 3 }, { preset: 'nabiz', t: r2(t0 + 1.3), genlik: 0.04, periyot: 0.6 }] });
  chip('v-m1', 'Güneş\'e ÇIPLAK GÖZLE\nbakılmaz!', 1340, 400, a[1], t1, { size: 58, bg: '#ffd93d', padding: [22, 44] });
  const items = ['Dürbün', 'Teleskop', 'Mercek', 'Kamera'];
  items.forEach((s, i) => chip('v-i' + i, s + ' ile de bakılmaz', 1340, 540 + i * 88, a[2] + i * 0.75, t1, { size: 50, bg: '#ff6fa8', color: '#ffffff', padding: [12, 40] }));
  chip('v-f', 'Gözlem için ÖZEL\nFİLTRE gerekir', 1340, 960, a[3] + 0.2, t1, { size: 50, bg: '#3ee0c2', color: '#0e2a3a', padding: [20, 44] });
}

// 11 — ÖZET: iki dönüş, ikisi de saat yönünün tersine
{
  const t0 = SC.ozet, t1 = ENDS.ozet;
  kam(t0, t1, 1.0, 1.06, 960, 560, 960, 520);
  const a = sent(13, ['Özetleyelim: Güneş, kendi ekseni etrafında saat yönünün tersine döner.', 'Dünya da Güneş\'in etrafında, saat yönünün tersine, üç yüz altmış beş gün altı saatte dolanır.']);
  const cx = 960, cy = 560, rx = 640, ry = 240;
  mdl('o-gunes', 'gunes-lekeli-3d', cx, cy, 360, t0, t1, { gecikme: 0.3, anims: [{ preset: 'don', t: a[0], periyot: 12, yon: '-1' }] });
  // yörünge izi: küçük yıldızlar sayaç yönünün tersinde (ekranda saat yönünün tersi) yanar
  const N = 40;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2; // 0'dan artarak: sağdan başlayıp yukarı (ekranda ters yön)
    mdl('o-iz' + i, 'yildiz', cx + rx * Math.cos(th), cy - ry * Math.sin(th), 20, a[1] + 0.2 + (i / N) * 7.0, t1, { gecikme: 0, giris: 'belir', girisDur: 0.3 });
  }
  const pts = Array.from({ length: 41 }, (_, i) => { const th = (i / 40) * Math.PI * 2; return [r2(cx + rx * Math.cos(th)), r2(cy - ry * Math.sin(th))]; });
  L({ id: 'o-dunya', asset: 'dunya-3d', scale: r2(150 / lib('dunya-3d')), x: cx + rx, y: cy, start: r2(t0), end: r2(t1), path: { points: pts, smooth: true }, pathT: [k(t0, 0), k(a[1] + 0.2, 0), k(a[1] + 7.2, 1, 'linear')],
    anims: [{ preset: 'katlanarak-gir', t: t0 + 0.6, dur: 0.9, sira: 'radial' }, { preset: 'don', t: t0 + 1.5, periyot: 6, yon: '-1' }] });
  chip('o-c1', 'Güneş: kendi ekseninde saat yönünün tersine', 960, 110, a[0] + 0.3, t1, { size: 54, bg: '#ffd93d', padding: [20, 48] });
  chip('o-c2', 'Dünya: Güneş\'in etrafında saat yönünün tersine\n365 gün 6 saatte bir tur', 960, 930, a[1] + 0.3, t1, { size: 52, bg: '#3ee0c2', color: '#0e2a3a', padding: [20, 48] });
}

// 12 — FİNAL SORUSU + geri sayım + cevap
{
  const t0 = SC.final, t1 = SURE, qEnd = SFIN - 0.15;
  soruKam(t0, qEnd);
  isik('f-yt', 960, 540, t0, qEnd, { p: 'yildiz-yagmuru', kw: { count: 26, size: 34, speed: 120, colors: ['#ffd93d', '#ff6fa8', '#3ee0c2'] } });
  mdl('f-rozet', 'soru-rozeti', 560, 400, 560, t0, qEnd, { gecikme: 0.15, giris: 'zipla-gir', girisDur: 0.8, variant: 'sari', anims: [{ preset: 'don', t: t0 + 1, periyot: 40, yon: '-1' }, { preset: 'nabiz', t: t0 + 1, genlik: 0.05, periyot: 1.1 }] });
  L({ id: 'f-isaret', type: 'text', text: '?', x: 560, y: 410, size: 400, font: FONT_B, weight: 900, color: '#ffffff', align: 'center', start: r2(t0), end: r2(SON_S - 3.3), stroke: { color: '#1f3a8a', width: 10 }, anims: [{ preset: 'zipla-gir', t: t0 + 0.45, dur: 0.7 }] });
  chip('f-etiket', 'SIRA SENDE! MEYDAN OKUMA', 960, 92, t0 + 0.3, qEnd, { size: 44, bg: '#ff6fa8', color: '#ffffff', giris: 'kayarak-gir', extra: { letterSpacing: 3 } });
  yazi('f-s0', 'Dünya, Güneş\'in etrafındaki', 1390, 330, t0 + 0.9, qEnd, { size: 62, color: '#fff3df', stroke: { color: '#1a0f3c', width: 10 } });
  yazi('f-s1', 'bir turu kaç gün ve', 1390, 420, t0 + 1.2, qEnd, { size: 62, color: '#fff3df', stroke: { color: '#1a0f3c', width: 10 } });
  yazi('f-s2', 'kaç saatte tamamlıyordu?', 1390, 510, t0 + 1.5, qEnd, { size: 62, color: '#ffd93d', stroke: { color: '#1a0f3c', width: 10 } });
  mdl('f-dunya', 'dunya-3d', 1390, 750, 200, t0, qEnd, { gecikme: 1.4, anims: [{ preset: 'don', t: t0 + 2, periyot: 8, yon: '-1' }] });
  mdl('f-astro', 'astronot-3d', 1790, 830, 250, t0, t1, { gecikme: 1.2, giris: 'zipla-gir', extra: { rotation: 8 }, anims: [{ preset: 'sallan', t: t0 + 2.5, aci: 6, periyot: 1.4 }, { preset: 'suzul', t: t0 + 2.5, genlik: 9, periyot: 2.6 }] });
  // geri sayım 3-2-1
  const c0 = SON_S - 3.3;
  ['3', '2', '1'].forEach((n, i) => L({ id: 'f-say' + n, type: 'text', text: n, x: 560, y: 410, size: 420, font: FONT_B, weight: 900, color: '#ffd93d', align: 'center', start: r2(c0 + i * 1.05 + 0.05), end: r2(c0 + (i + 1) * 1.05), stroke: { color: '#e8621a', width: 14 }, shadow: { color: 'rgba(0,0,0,.4)', blur: 14, x: 0, y: 10 },
    anims: [{ preset: 'zipla-gir', t: r2(c0 + i * 1.05 + 0.05), dur: 0.5 }] }));
  // cevap
  isik('f-cevap-konf', 960, 420, SFIN, t1, { p: 'konfeti', mode: 'patlama', kw: { count: 140, size: 22, colors: ['#ffd93d', '#ff6fa8', '#3ee0c2', '#ffffff'], life: 3.2 } });
  mdl('f-gunes', 'gunes-3d', 380, 560, 560, SFIN - 0.3, t1, { gecikme: 0.2, anims: [{ preset: 'don', t: SFIN + 1, periyot: 50, yon: '-1' }, { preset: 'nefes', t: SFIN + 1, genlik: 0.025, periyot: 3 }] });
  yazi('f-cvp0', 'Doğru cevap:', 1230, 330, SFIN, t1, { size: 70, color: '#fff3df' });
  yazi('f-cvp1', '365 gün', 1230, 500, SFIN + 0.9, t1, { size: 200, color: '#ffd93d', stroke: { color: '#e8621a', width: 12 }, ta: 'harf-zipla', aralik: 0.06 });
  yazi('f-cvp2', '6 saat!', 1230, 720, SFIN + 1.5, t1, { size: 190, color: '#3ee0c2', stroke: { color: '#0e4a4a', width: 12 }, ta: 'harf-zipla', aralik: 0.06 });
  chip('f-gorusuruz', 'Görüşmek üzere, küçük kaşifler!', 1230, 930, SFIN + 3.6, t1, { size: 52, bg: '#ff7a3d', color: '#ffffff', padding: [20, 50] });
}

// ─── Ses izleri ────────────────────────────────────────────────────────────
const audio = [];
const ses = (file, start, dur) => { const a = { file, start: r2(start), offset: 0, dur: null, volume: 1, fadeIn: 0, fadeOut: 0, mute: false }; const env = zarfCikar(file, 30); if (env) a.env = env; audio.push(a); };
DUR.forEach((_, i) => ses(`gunes-ses-${i + 1}.wav`, S[i]));
ses('gunes-son-1.wav', SON_S);
// müzik: üretilen iki parçalı döngü (çapraz geçişli)
audio.push({ file: 'gunes-muzik.wav', start: 0, offset: 0, dur: 118, volume: 0.17, fadeIn: 1.5, fadeOut: 2, mute: false });
if (SURE > 116) audio.push({ file: 'gunes-muzik.wav', start: 116, offset: 0, dur: r2(SURE - 116), volume: 0.17, fadeIn: 2, fadeOut: 2.5, mute: false });
// efektler
const sfx = (file, t, v = 0.6) => audio.push({ file, start: r2(Math.max(0, t)), offset: 0, dur: null, volume: v, fadeIn: 0, fadeOut: 0, mute: false });
[SC.q1, SC.q2, SC.q3, SC.final].forEach((t) => sfx('sfx-cin.wav', t + 0.35, 0.9));
[SC.bilesim, SC.leke, SC.cevap2].forEach((t) => sfx('sfx-parilti.wav', t + 0.3, 0.7));
sfx('sfx-cin.wav', SC.guvenlik + 0.5, 0.9); sfx('sfx-cin.wav', SC.guvenlik + 0.95, 0.9);
sfx('sfx-parilti.wav', SFIN, 0.9);
[1, 2].forEach((i) => sfx('sfx-tik.wav', SON_S - 3.3 + (i - 1) * 1.05 + 0.05, 0.8)); sfx('sfx-tik.wav', SON_S - 3.3 + 2.15, 0.8);
const GECISLER = [
  ['yakinlas', SC.tanitim, 0.9], ['iris', SC.q1, 0.9, '#ff6fa8'], ['katlama', SC.bilesim, 1.0], ['perde', SC.konum, 0.9], ['iris', SC.q2, 0.9, '#ff6fa8'],
  ['sayfa-cevir', SC.cevap2, 0.9], ['iris', SC.q3, 0.9, '#ff6fa8'], ['yirtik', SC.leke, 1.0], ['kaydir', SC.galileo, 0.8], ['iris', SC.guvenlik, 0.9, '#e5283c'],
  ['katlama', SC.ozet, 1.0], ['iris', SC.final, 0.9, '#ff6fa8'],
];
GECISLER.forEach(([, t]) => sfx('sfx-whoosh.wav', t - 0.35, 0.5));

// ─── Sahne ─────────────────────────────────────────────────────────────────
const KAM = (p) => cam.map((c) => ({ t: r2(Math.max(0, c.t)), v: r2(c[p]), ...(c.ease ? { ease: c.ease } : {}) }));
cam.sort((a, b) => a.t - b.t);
const scene = {
  name: 'Gökyüzündeki Komşumuz: Güneş',
  width: W, height: H, fps: FPS, duration: SURE,
  theme: {
    paper: 'parlak', adjust: { saturation: 1.05 },
    colors: { arka1: '#1b0f45', arka2: '#080420', baslik: '#ffd93d', metin: '#fff3df', vurgu: '#ff7a3d' },
    background: { type: 'radial', colors: ['#3b1d78', '#0a0522'], cx: 0.68, cy: 0.5, radius: 0.95, vignette: 0.3 },
    vignette: 0.3,
  },
  style: STIL,
  camera: { zoom: KAM('z'), x: KAM('x'), y: KAM('y') },
  audio,
  sfx: { auto: false, volume: 0.5 },
  sections: [
    ['Açılış', 0], ['Güneş nedir?', SC.tanitim], ['Soru 1', SC.q1], ['Bileşim', SC.bilesim], ['Uzaklık ve yaş', SC.konum], ['Soru 2', SC.q2], ['Yakın = büyük', SC.cevap2],
    ['Soru 3', SC.q3], ['Güneş lekeleri', SC.leke], ['Galileo', SC.galileo], ['Güvenlik', SC.guvenlik], ['Özet', SC.ozet], ['Final sorusu', SC.final],
  ].map(([name, t]) => ({ t: r2(t), name })),
  transitions: GECISLER.map(([type, t, dur, color]) => ({ type, t: r2(t), dur, ...(color ? { color } : { color: '$arka1' }) })),
  layers: JSON.parse(JSON.stringify(layers)),
};

const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
console.log('Sahneler:', Object.entries(SC).map(([n, t]) => `${n}@${r2(t)}`).join(' '));
console.log('Satır başları:', S.join(' '), '| son:', SON_S);
