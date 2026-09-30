import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Çizim / pastel boya — "Telefonun Yolculuğu" (9:16): node scripts/scenes-telefonun-yolculugu.mjs
// Kütüphaneye 7 telefon + raf varlığını (data/library/iletisim), projeye scene.json'u baştan yazar
// (stüdyoda yapılan elle düzenlemeler kaybolur).
// Kurgu: her dönemde telefon ortada çizilir, bilgiler yazılır, sonra telefon küçülüp alttaki rafa uçar.
// Raf dolarak ilerlemeyi gösterir; kapanışta tüm telefonlar sırayla zıplar.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library', 'iletisim');
const PROJE_ID = 'telefonun-yolculugu';
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });

// ------------------------------------------------------------ geometri yardımcıları
const R = (n) => Math.round(n * 10) / 10;
const rect = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
const ellipse = (cx, cy, rx, ry, n = 20) =>
  Array.from({ length: n }, (_, i) => [R(cx + rx * Math.cos((i / n) * 2 * Math.PI)), R(cy + ry * Math.sin((i / n) * 2 * Math.PI))]);
const circle = (cx, cy, r, n = 20) => ellipse(cx, cy, r, r, n);
function rrect(x1, y1, x2, y2, r, seg = 4) {
  const pts = [];
  const arc = (cx, cy, a0) => {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([R(cx + r * Math.cos(a)), R(cy + r * Math.sin(a))]);
    }
  };
  arc(x2 - r, y1 + r, -Math.PI / 2);
  arc(x2 - r, y2 - r, 0);
  arc(x1 + r, y2 - r, Math.PI / 2);
  arc(x1 + r, y1 + r, Math.PI);
  return pts;
}
// Çokgeni x = cx doğrusuyla ikiye kırp (Sutherland–Hodgman)
function clip(poly, cx, keepLeft) {
  const inside = (p) => (keepLeft ? p[0] <= cx : p[0] >= cx);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const k2 = (cx - a[0]) / (b[0] - a[0]);
      out.push([R(cx), R(a[1] + (b[1] - a[1]) * k2)]);
    }
  }
  return out;
}
const F = (p, c, s = 0) => ({ p, c, s });
/** Bir "düzlem": dikey orta çizgiden ikiye bölünür, zıt ışık (katlanma hissi) */
function plane(poly, c, s = 0.08) {
  const xs = poly.map((p) => p[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  return [F(clip(poly, cx, true), c, s), F(clip(poly, cx, false), c, -s * 1.6)];
}
const grid = (cols, rows, x0, y0, dx, dy, fn) => {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(fn(x0 + c * dx, y0 + r * dy, r, c));
  return out;
};

// ------------------------------------------------------------ varlıklar
const TAGS = ['telefon', 'iletişim', 'teknoloji'];
const assets = [
  {
    id: 'duvar-telefonu',
    name: 'Duvar Telefonu (1800ler)',
    tags: [...TAGS, 'eski', 'ahşap'],
    size: [200, 300],
    palette: { a: '#d9a066', b: '#f0c75e', c: '#a8683a', d: '#4a4040' },
    roles: { a: 'ana', b: 'vurgu', c: 'ikincil', d: 'koyu' },
    facets: [
      ...plane(rect(34, 8, 166, 292), 'a'), // arka tahta
      // ahize kordonu + ahize (solda asılı)
      F([[48, 112], [52, 116], [28, 152], [24, 148]], 'd', -0.1),
      ...plane(rrect(12, 148, 38, 214, 8), 'd', 0.06),
      // zil kapları
      F(circle(72, 48, 24), 'b', 0.1),
      F(circle(128, 48, 24), 'b', -0.12),
      // gövde kutusu
      ...plane(rect(46, 78, 154, 204), 'c', 0.07),
      // konuşma borusu (huni)
      F(circle(100, 150, 22), 'd', 0.05),
      F(circle(100, 150, 10), '#2a2424', -0.1),
      // manivela
      F([[154, 118], [184, 116], [184, 124], [154, 126]], 'd', -0.05),
      ...plane(rrect(178, 100, 192, 136, 5), 'd', 0.04),
      // yazı rafı + pil kutusu
      ...plane(rect(38, 208, 162, 222), 'c', 0.05),
      ...plane(rect(56, 222, 144, 282), 'c', 0.07),
    ],
  },
  {
    id: 'cevirmeli-telefon',
    name: 'Çevirmeli Telefon',
    tags: [...TAGS, 'kadran', 'ev'],
    size: [240, 220],
    palette: { a: '#ec8a7e', b: '#c95f57', c: '#8a3f3a', d: '#fbf1dc' },
    roles: { a: 'ana', b: 'ikincil', c: 'koyu', d: 'acik' },
    variants: { mint: { name: 'Mint', palette: { a: '#8fd1b4', b: '#5fa98a', c: '#3c7560' } } },
    facets: [
      ...plane(rect(18, 196, 222, 212), 'c', 0.04), // taban
      ...plane([[30, 200], [210, 200], [182, 88], [58, 88]], 'a', 0.1), // gövde
      // ahize çatalları
      ...plane(rect(52, 70, 72, 92), 'c'),
      ...plane(rect(168, 70, 188, 92), 'c'),
      // ahize
      ...plane([[34, 56], [206, 56], [214, 68], [202, 80], [38, 80], [26, 68]], 'b', 0.08),
      F(ellipse(40, 76, 24, 15), 'b', 0.1),
      F(ellipse(200, 76, 24, 15), 'b', -0.14),
      // kadran
      F(circle(120, 148, 44, 28), 'd', 0.06),
      ...Array.from({ length: 9 }, (_, i) => {
        const a = (-60 + i * 30) * (Math.PI / 180) + Math.PI / 2;
        return F(circle(R(120 + 30 * Math.cos(a)), R(148 + 30 * Math.sin(a)), 6.5, 12), 'c', 0);
      }),
      F(circle(120, 148, 13, 16), 'a', -0.05),
    ],
  },
  {
    id: 'tugla-telefon',
    name: 'Tuğla Cep Telefonu',
    tags: [...TAGS, 'cep', 'anten'],
    size: [120, 320],
    palette: { a: '#e8dcc2', b: '#9c958a', c: '#4f4a45', d: '#6b4a4f', e: '#ff8a73' },
    roles: { a: 'ana', b: 'ikincil', c: 'koyu', d: 'detay', e: 'vurgu' },
    facets: [
      ...plane(rrect(50, 0, 64, 74, 6, 2), 'c', 0.05), // anten
      ...plane(rrect(18, 58, 102, 316, 10), 'a', 0.1), // gövde
      ...plane(rect(40, 76, 80, 86), 'c'), // kulaklık
      ...plane(rect(30, 100, 90, 130), 'd', 0.05), // ekran
      ...grid(3, 3, 38, 110, 16, 0, (x) => F(rect(x, 112, x + 10, 120), 'e', 0)).slice(0, 3), // kırmızı rakamlar
      ...grid(3, 5, 30, 146, 22, 26, (x, y) => F(rrect(x, y, x + 16, y + 17, 4, 2), 'b', 0.04)), // tuşlar
      ...plane(rect(40, 292, 80, 300), 'c'), // mikrofon
    ],
  },
  {
    id: 'tuslu-telefon',
    name: 'Tuşlu Cep Telefonu',
    tags: [...TAGS, 'cep', 'sms'],
    size: [120, 260],
    palette: { a: '#86acd9', b: '#eef2f7', c: '#2f3b52', d: '#b9d98a' },
    roles: { a: 'ana', b: 'acik', c: 'koyu', d: 'vurgu' },
    variants: { sari: { name: 'Sarı', palette: { a: '#f2cf6b' } } },
    facets: [
      ...plane(rrect(82, 0, 98, 34, 6, 2), 'c', 0.05), // kısa anten
      ...plane(rrect(14, 20, 106, 256, 26), 'a', 0.1), // gövde
      ...plane(rrect(24, 42, 96, 118, 8), 'c', 0.04), // ekran çerçevesi
      ...plane(rect(32, 52, 88, 108), 'd', 0.06), // yeşil ekran
      // yılan + yem
      F([[40, 94], [70, 94], [70, 72], [76, 72], [76, 100], [40, 100]], 'c', 0),
      F(rect(52, 64, 58, 70), 'c', 0),
      F(rrect(46, 28, 74, 34, 3, 2), 'c', 0), // hoparlör
      F(ellipse(60, 134, 22, 9), 'b', 0.05), // yön tuşu
      ...grid(3, 4, 36, 162, 24, 23, (x, y) => F(ellipse(x, y, 9, 7, 12), 'b', 0.04)),
    ],
  },
  {
    id: 'kapakli-telefon',
    name: 'Kapaklı Telefon',
    tags: [...TAGS, 'cep', 'kamera'],
    size: [140, 340],
    palette: { a: '#bba6de', b: '#8e79b8', c: '#3d3452', d: '#cfe8f7', e: '#f1eef7', f: '#ffd98a' },
    roles: { a: 'ana', b: 'ikincil', c: 'koyu', d: 'acik', e: 'detay', f: 'vurgu' },
    facets: [
      ...plane(rrect(24, 8, 116, 168, 14), 'a', 0.1), // üst kapak
      ...plane(rect(34, 36, 106, 144), 'd', 0.06), // ekran
      F(circle(70, 84, 14, 16), 'f', 0.05), // ekranda güneş
      F([[34, 144], [34, 118], [56, 104], [80, 124], [106, 110], [106, 144]], 'b', -0.02), // ekranda tepe
      F(rrect(54, 18, 86, 25, 3, 2), 'c', 0), // hoparlör
      ...plane(rrect(18, 160, 122, 182, 8, 2), 'b', 0.05), // menteşe
      ...plane(rrect(24, 176, 116, 334, 14), 'a', 0.1), // alt kapak
      F(circle(70, 204, 13, 16), 'e', 0.05), // yön tuşu
      ...grid(3, 4, 36, 228, 24, 24, (x, y) => F(rrect(x, y, x + 20, y + 14, 5, 2), 'e', 0.04)),
    ],
  },
  {
    id: 'akilli-telefon',
    name: 'Akıllı Telefon (ilk dokunmatik)',
    tags: [...TAGS, 'akıllı', 'dokunmatik'],
    size: [160, 300],
    palette: { a: '#4b5061', b: '#737a8f', c: '#aed9f1', e: '#f28b82', f: '#ffd166', g: '#8fd1b4', h: '#b9a7e6' },
    roles: { a: 'koyu', b: 'ikincil', c: 'acik', e: 'vurgu', f: 'vurgu', g: 'ana', h: 'detay' },
    facets: [
      ...plane(rrect(10, 4, 150, 296, 22), 'a', 0.1), // gövde
      F(rrect(62, 20, 98, 27, 3, 2), 'b', 0), // hoparlör
      ...plane(rect(20, 42, 140, 250), 'c', 0.06), // ekran
      ...grid(3, 4, 30, 56, 38, 44, (x, y, r, c) => F(rrect(x, y, x + 26, y + 26, 7, 2), 'efgh'[(r + c) % 4], 0.05)),
      F(circle(80, 272, 12, 18), 'b', 0.05), // ana ekran tuşu
    ],
  },
  {
    id: 'modern-telefon',
    name: 'Modern Akıllı Telefon',
    tags: [...TAGS, 'akıllı', 'yapay zekâ'],
    size: [160, 320],
    palette: { a: '#c8bfd9', b: '#fbd3d0', c: '#2f2b3a', d: '#b9a7e6', e: '#9fd8c9', f: '#fffaf2', g: '#f7a8a0' },
    roles: { a: 'ikincil', b: 'acik', c: 'koyu', d: 'ana', e: 'vurgu', f: 'detay', g: 'vurgu' },
    facets: [
      ...plane(rrect(8, 4, 152, 316, 26), 'a', 0.1), // çerçeve
      ...plane(rrect(15, 11, 145, 309, 20), 'b', 0.05), // ekran (duvar kâğıdı)
      // dalgalı duvar kâğıdı
      F([[15, 210], [48, 192], [82, 206], [116, 186], [145, 196], [145, 290], [128, 309], [32, 309], [15, 290]], 'd', 0.04),
      F([[15, 256], [52, 238], [92, 254], [145, 236], [145, 290], [128, 309], [32, 309], [15, 290]], 'e', -0.04),
      // sohbet balonları (yapay zekâ asistanı)
      F(rrect(30, 70, 118, 100, 12), 'f', 0.05),
      F(rrect(46, 112, 132, 142, 12), 'g', 0.05),
      F(circle(80, 26, 5, 12), 'c', 0), // kamera deliği
      F(rrect(56, 296, 104, 300, 2, 1), 'c', 0), // hareket çubuğu
    ],
  },
  {
    id: 'raf',
    name: 'Ahşap Raf',
    tags: ['raf', 'mobilya', 'zemin'],
    size: [400, 40],
    palette: { a: '#e0ad78', b: '#b98352' },
    roles: { a: 'ana', b: 'ikincil' },
    facets: [
      F([[40, 26], [64, 26], [52, 40]], 'b', -0.1),
      F([[336, 26], [360, 26], [348, 40]], 'b', -0.1),
      ...plane(rect(0, 0, 400, 18), 'a', 0.06),
      ...plane(rect(8, 18, 392, 27), 'b', 0.04),
    ],
  },
];
fs.mkdirSync(LIB, { recursive: true });
for (const a of assets) fs.writeFileSync(path.join(LIB, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
const A = Object.fromEntries(assets.map((a) => [a.id, a]));

// ------------------------------------------------------------ sahne
const W = 1080;
const INK = '#2d3561';
const layers = [];
const L = (o) => (layers.push(o), o);
const Y = { yil: 272, ad: 392, zemin: 1010, bilgi1: 1096, bilgi2: 1180, raf: 1400 };

/** El yazısı metin: daktiloyla yazılır */
const hand = (id, group, text, x, y, size, t0, dur, extra = {}) =>
  L({
    id, group, type: 'text', text, x, y, size, font: 'Caveat', weight: 700, color: INK,
    reveal: [k(t0, 0), k(t0 + dur, 1, 'linear')],
    ...extra,
  });

// Dönemler — yalnızca genel kabul görmüş bilgiler
const DONEM = [
  {
    asset: 'duvar-telefonu', yil: '1876', ad: 'İlk Telefon', bg: '#f5e8d3', vurgu: '#f6d58e',
    b1: 'Bell, telefonun patentini alır', b2: 'Ses artık tellerle yolculuk eder', balon: 'Alo?',
  },
  {
    asset: 'cevirmeli-telefon', yil: "1950'ler", ad: 'Çevirmeli Telefon', bg: '#fbe4df', vurgu: '#f7b8ae',
    b1: 'Numara, kadran çevrilerek aranır', b2: 'Evin en değerli köşesinde durur', balon: 'Zırrr!', titre: true,
  },
  {
    asset: 'tugla-telefon', yil: '1973', ad: 'İlk Cep Telefonu', bg: '#f3ecd4', vurgu: '#ffd08a',
    b1: 'Sokakta ilk cep telefonu görüşmesi', b2: 'Ağırlığı neredeyse 1 kilo!', balon: '1 kilo!',
  },
  {
    asset: 'tuslu-telefon', yil: "1990'lar", ad: 'Tuşlu Cep Telefonu', bg: '#e1ecf7', vurgu: '#b9d98a',
    b1: 'SMS ile kısa mesaj çağı başlar', b2: 'Küçük ekran, uzun pil, yılan oyunu', balon: 'Naber? :)',
  },
  {
    asset: 'kapakli-telefon', yil: "2000'ler", ad: 'Kapaklı Telefon', bg: '#ebe4f6', vurgu: '#cdb8f0',
    b1: 'Kapağı açıp kapatmak bir tarz olur', b2: 'Telefonlara kamera gelir', balon: 'Klik!',
  },
  {
    asset: 'akilli-telefon', yil: '2007', ad: 'Akıllı Telefon', bg: '#dff1ec', vurgu: '#9fd8c9',
    b1: 'Tuşlar gider, dokunmatik ekran gelir', b2: 'İnternet ve uygulamalar cebimizde', balon: 'Dokun!',
  },
  {
    asset: 'modern-telefon', yil: 'Bugün', ad: 'Cebimizdeki Bilgisayar', bg: '#fbe9ef', vurgu: '#f7b3c6',
    b1: 'Kamera, harita, müzik, yapay zekâ', b2: 'Hepsi tek bir ekranda', balon: 'Merhaba!',
  },
];

const ACILIS = 4.2;
const BOLUM = 6;
const KAPANIS = ACILIS + DONEM.length * BOLUM; // 46.2
const SURE = KAPANIS + 8;
const RAF_X = DONEM.map((_, i) => 120 + i * 125); // 120 … 870 (sağ kenar UI'sine girmez)

// Gruplar ve bölümler
const groups = [
  { id: 'g-acilis', name: 'Açılış' },
  ...DONEM.map((d, i) => ({ id: `g-${i + 1}`, name: `${d.yil} · ${d.ad}` })),
  { id: 'g-raf', name: 'Raf' },
  { id: 'g-kapanis', name: 'Kapanış' },
];
const sections = [
  { t: 0, name: 'Açılış' },
  ...DONEM.map((d, i) => ({ t: ACILIS + i * BOLUM, name: `${d.yil} · ${d.ad}` })),
  { t: KAPANIS, name: 'Kapanış' },
];

// Arka plan rengi dönemle birlikte yumuşakça değişir
const KAGIT = '#f7f1e3';
const bgTrack = [k(0, KAGIT)];
DONEM.forEach((d, i) => {
  const s = ACILIS + i * BOLUM;
  bgTrack.push(k(s - 0.4, i ? DONEM[i - 1].bg : KAGIT), k(s + 0.6, d.bg, 'inOutSine'));
});
bgTrack.push(k(KAPANIS - 0.4, DONEM.at(-1).bg), k(KAPANIS + 0.8, KAGIT, 'inOutSine'));

// ---- Açılış
hand('kanca', 'g-acilis', 'Cebindeki telefonun', W / 2, 560, 68, 0.15, 0.9, {
  anims: [{ preset: 'sol', t: ACILIS - 0.6, dur: 0.5 }],
});
hand('baslik', 'g-acilis', '150 yıllık\nyolculuğu', W / 2, 760, 150, 0.9, 1.5, {
  lineHeight: 1.0,
  anims: [{ preset: 'nefes', t: 2.4, genlik: 0.015, periyot: 2 }, { preset: 'kuculerek-cik', t: ACILIS - 0.65, dur: 0.55 }],
});
L({
  id: 'yildiz-1', group: 'g-acilis', asset: 'yildiz', x: 200, y: 470, scale: 0.4, variant: 'gumus', end: ACILIS,
  palette: { a: '#ffd166' },
  anims: [{ preset: 'cizerek-gir', t: 1.6, dur: 1.2 }, { preset: 'sallan', t: 2.8, aci: 10, periyot: 2 }, { preset: 'sol', t: ACILIS - 0.6, dur: 0.5 }],
});
L({
  id: 'yildiz-2', group: 'g-acilis', asset: 'yildiz', x: 880, y: 960, scale: 0.3, end: ACILIS,
  palette: { a: '#f7a8a0' },
  anims: [{ preset: 'cizerek-gir', t: 2.0, dur: 1.2 }, { preset: 'sallan', t: 3.2, aci: 10, periyot: 2.3 }, { preset: 'sol', t: ACILIS - 0.6, dur: 0.5 }],
});

// ---- Raf (tüm video boyunca)
L({
  id: 'raf', group: 'g-raf', asset: 'raf', x: (RAF_X[0] + RAF_X.at(-1)) / 2, y: Y.raf, anchor: [0.5, 0], scale: 2.05, scaleY: 0.66,
  sketch: { ink: '#7a4a2a', width: 2.6 },
  anims: [{ preset: 'cizerek-gir', t: 1.6, dur: 2.0 }],
});

// ---- Dönemler
DONEM.forEach((d, i) => {
  const s = ACILIS + i * BOLUM;
  const e = s + BOLUM;
  const g = `g-${i + 1}`;
  const a = A[d.asset];
  const [aw, ah] = a.size;
  const big = r2(Math.min(540 / ah, 560 / aw));
  const small = r2(Math.min(118 / ah, 100 / aw));
  const ucus = s + 5.0; // rafa uçuş başlar
  const iner = s + 5.9;

  // yıl — fosforlu kalem kutusu
  hand(`yil-${i + 1}`, g, d.yil, W / 2, Y.yil, 132, s + 0.1, 0.5, {
    start: s, end: e,
    box: { color: d.vurgu, opacity: 0.85, radius: 14, shadow: false, padding: [0, 34] },
    rotation: -2,
    anims: [{ preset: 'zipla-gir', t: s + 0.05, dur: 0.6 }, { preset: 'sol', t: ucus - 0.1, dur: 0.5 }],
  });
  hand(`ad-${i + 1}`, g, d.ad, W / 2, Y.ad, 76, s + 0.6, 0.7, {
    start: s, end: e, anims: [{ preset: 'sol', t: ucus - 0.1, dur: 0.5 }],
  });

  // telefon: ortada çizilir, sonra rafa uçar ve orada kalır
  L({
    id: `tel-${i + 1}`, group: g, asset: d.asset, anchor: [0.5, 1], start: s,
    x: [k(s, W / 2), k(ucus, W / 2), k(iner, RAF_X[i], 'inOutCubic')],
    y: [k(s, Y.zemin), k(ucus, Y.zemin), k(ucus + 0.45, Y.zemin - 140, 'outQuad'), k(iner, Y.raf, 'inQuad')],
    scale: [k(s, big), k(ucus, big), k(iner, small, 'inOutCubic')],
    rotation: [k(ucus, 0), k(ucus + 0.45, i % 2 ? 8 : -8, 'outQuad'), k(iner, 0, 'outBack')],
    anims: [
      { preset: 'cizerek-gir', t: s + 0.2, dur: 2.0 },
      d.titre
        ? { preset: 'titre', t: s + 2.4, dur: 1.6, genlik: 3 }
        : { preset: 'nefes', t: s + 2.2, dur: 2.6, genlik: 0.012, periyot: 2.4 },
      // kapanışta dalga gibi sırayla zıplar
      { preset: 'seksek', t: KAPANIS + 0.4 + i * 0.12, yukseklik: 16, periyot: 0.9 },
    ],
  });

  // konuşma balonu
  hand(`balon-${i + 1}`, g, d.balon, 822, 560, 60, s + 2.0, 0.01, {
    start: s, end: e, rotation: i % 2 ? 5 : -6,
    box: { color: '#ffffff', opacity: 0.95, radius: 26, shadow: false, padding: [6, 22] },
    anims: [
      { preset: 'zipla-gir', t: s + 2.0, dur: 0.6 },
      { preset: 'sallan', t: s + 2.6, aci: 4, periyot: 1.6 },
      { preset: 'kuculerek-cik', t: ucus - 0.3, dur: 0.4 },
    ],
  });

  // bilgi satırları
  hand(`bilgi-${i + 1}a`, g, d.b1, W / 2, Y.bilgi1, 60, s + 1.7, 0.8, {
    start: s, end: e, anims: [{ preset: 'sol', t: ucus - 0.1, dur: 0.5 }],
  });
  hand(`bilgi-${i + 1}b`, g, d.b2, W / 2, Y.bilgi2, 60, s + 2.4, 0.8, {
    start: s, end: e, color: '#5b4a7a', anims: [{ preset: 'sol', t: ucus - 0.1, dur: 0.5 }],
  });

  // raftaki yıl etiketi
  L({
    id: `raf-yil-${i + 1}`, group: 'g-raf', type: 'text', text: d.yil, x: RAF_X[i], y: Y.raf + 70, size: 34,
    font: 'Caveat', weight: 700, color: '#7a4a2a', start: iner - 0.2,
    anims: [{ preset: 'zipla-gir', t: iner - 0.15, dur: 0.45 }],
  });
});

// ---- Kapanış
const K = KAPANIS;
L({ id: 'pirilti', group: 'g-kapanis', type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: K, end: SURE, count: 45, prewarm: true, colors: ['#ffd166', '#f7a8a0', '#b9a7e6'], area: [60, 300, 1020, 1250] });
hand('son-1', 'g-kapanis', '150 yılda', W / 2, 540, 96, K + 0.3, 0.7, { start: K });
hand('son-2', 'g-kapanis', 'duvardan cebe!', W / 2, 680, 132, K + 0.9, 1.1, {
  start: K, anims: [{ preset: 'nefes', t: K + 2.2, genlik: 0.02, periyot: 1.8 }],
});
hand('son-soru', 'g-kapanis', 'Sıradaki ne olacak?', W / 2, 900, 76, K + 2.4, 0.01, {
  start: K, rotation: -3, box: { color: '#f6d58e', opacity: 0.9, radius: 18, shadow: false, padding: [4, 28] },
  anims: [{ preset: 'zipla-gir', t: K + 2.4, dur: 0.7 }, { preset: 'sallan', t: K + 3.2, aci: 3, periyot: 2 }],
});
hand('son-cta', 'g-kapanis', 'Tahminini yorumlara yaz!', W / 2, 1060, 56, K + 3.6, 1.2, { start: K, color: '#5b4a7a' });

const scene = {
  name: 'Telefonun Yolculuğu (çizim)',
  width: 1080,
  height: 1920,
  fps: 30,
  duration: r2(SURE),
  style: 'cizim',
  sketch: { ink: INK, width: 3.4, wobble: 1.4, hatch: 5, angle: 62, wipe: 35, grain: 0.35 },
  background: { type: 'solid', color: bgTrack, paper: 0.65, vignette: 0.1 },
  sfx: { auto: true, volume: 0.45 },
  audio: [{ file: 'uzay-ambiyans.wav', start: 0, offset: 0, volume: 0.4, fadeIn: 1.5, fadeOut: 2.5 }],
  sections,
  groups,
  formats: [
    { id: 'youtube', name: 'YouTube 16:9', width: 1920, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.45, zoom: 1.32 },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log('ok', scene.layers.length, 'katman,', scene.duration, 'sn');
