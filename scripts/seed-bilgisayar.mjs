// "Bilgisayarın yolculuğu" için yeni origami modelleri + efektler → data/library/bilgisayar, efektler
//   node scripts/seed-bilgisayar.mjs      (her çalıştırmada üzerine yazar; bu dosya kaynak)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library');
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (cx, cy, r, deg) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))];
const F = (p, c, s = 0, extra = {}) => ({ p, c, s: r1(s * 100) / 100, ...extra });

/** Dikdörtgen = iki üçgen, zıt gölge (origami hissi) */
const rect = (x, y, w, h, c, s = 0, extra = {}) => [
  F([[x, y], [x + w, y], [x + w, y + h]], c, s + 0.09, extra),
  F([[x, y], [x + w, y + h], [x, y + h]], c, s - 0.09, extra),
];
/** Dışbükey çokgen: ilk köşeden yelpaze */
const poly = (pts, c, s = 0, extra = {}) => {
  const out = [];
  for (let i = 1; i < pts.length - 1; i++) out.push(F([pts[0], pts[i], pts[i + 1]], c, s + (i % 2 ? 0.08 : -0.08), extra));
  return out;
};
/** Elips: merkezden dilimler, ışık sol üstten */
const ellipse = (cx, cy, rx, ry, c, s = 0, n = 16, extra = {}) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = (360 / n) * i, a1 = (360 / n) * (i + 1), am = ((a0 + a1) / 2) * (Math.PI / 180);
    const light = Math.cos(am - (225 * Math.PI) / 180) * 0.32;
    out.push(F([[cx, cy], [r1(cx + rx * Math.cos((a0 * Math.PI) / 180)), r1(cy + ry * Math.sin((a0 * Math.PI) / 180))], [r1(cx + rx * Math.cos((a1 * Math.PI) / 180)), r1(cy + ry * Math.sin((a1 * Math.PI) / 180))]], c, s + light, extra));
  }
  return out;
};
const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

const assets = [];
const add = (a) => assets.push(a);

// ─────────────────────────────────────────────────────────── dişli (Babbage)
{
  const f = [], N = 12, Rin = 24, Rb = 72, Ro = 92;
  for (let i = 0; i < N; i++) {
    const a = (360 / N) * i;
    const sh = Math.cos(((a + 15 - 225) * Math.PI) / 180) * 0.28;
    // gövde halkası dilimi
    f.push(F([pt(100, 100, Rin + 12, a - 15), pt(100, 100, Rb, a - 15), pt(100, 100, Rb, a + 15)], 'a', sh + 0.06));
    f.push(F([pt(100, 100, Rin + 12, a - 15), pt(100, 100, Rb, a + 15), pt(100, 100, Rin + 12, a + 15)], 'a', sh - 0.06));
    // göbek halkası
    f.push(F([pt(100, 100, Rin, a - 15), pt(100, 100, Rin + 12, a - 15), pt(100, 100, Rin + 12, a + 15)], 'b', sh + 0.1));
    f.push(F([pt(100, 100, Rin, a - 15), pt(100, 100, Rin + 12, a + 15), pt(100, 100, Rin, a + 15)], 'b', sh - 0.1));
    // diş
    const t0 = pt(100, 100, Rb - 4, a - 9), t1 = pt(100, 100, Rb - 4, a + 9), t2 = pt(100, 100, Ro, a + 6), t3 = pt(100, 100, Ro, a - 6);
    f.push(F([t0, t3, t2], 'a', sh + 0.18), F([t0, t2, t1], 'a', sh - 0.05));
  }
  // kollar (sabit gövde üstüne parlak detay)
  for (let i = 0; i < 6; i++) {
    const a = 60 * i + 30;
    f.push(F([pt(100, 100, 34, a - 6), pt(100, 100, 62, a), pt(100, 100, 34, a + 6)], 'c', 0.25));
  }
  add({ id: 'disli', name: 'Dişli', tags: ['mekanik', 'babbage', 'bilgisayar'], size: [200, 200], palette: { a: '#c8963e', b: '#7a5a1f', c: '#e7c779' }, roles: { a: 'ana', b: 'koyu', c: 'acik' },
    variants: { celik: { name: 'Çelik', palette: { a: '#8a97a8', b: '#4c5665', c: '#cfd8e3' } } }, facets: f });
}

// ─────────────────────────────────────────────────────────── delikli kart
{
  const f = [];
  f.push(...poly([[28, 10], [190, 10], [190, 82], [10, 82], [10, 28]], 'a', 0.05));
  f.push(...rect(22, 18, 70, 6, 'r', 0.1)); // basılı kırmızı başlık
  const R = rng(7);
  for (let col = 0; col < 14; col++) for (let row = 0; row < 3; row++) {
    if (R() > 0.55) f.push(...rect(22 + col * 11.6, 34 + row * 14, 6.4, 10, 'k', -0.1));
  }
  add({ id: 'delikli-kart', name: 'Delikli Kart', tags: ['mekanik', 'kart', 'bilgisayar', 'eski'], size: [200, 90], palette: { a: '#efe3c4', k: '#3a2c1f', r: '#c8553d' }, roles: { a: 'acik', k: 'koyu', r: 'vurgu' }, facets: f });
}

// ─────────────────────────────────────────────────────────── vakum tüpü
{
  const f = [];
  f.push(...ellipse(50, 78, 36, 66, 'g', 0.12, 18));
  f.push(...rect(36, 52, 28, 62, 'k', -0.05)); // anot plakası
  f.push(...rect(44, 58, 4, 52, 'f', 0.2), ...rect(52, 58, 4, 52, 'f', 0.2)); // filaman
  f.push(F([[30, 40], [40, 24], [44, 50]], 'h', 0.5)); // cam parlaması
  f.push(...rect(28, 140, 44, 30, 'd', 0.1));
  f.push(...rect(28, 140, 44, 6, 'd', 0.35));
  for (let i = 0; i < 4; i++) f.push(...rect(32 + i * 10, 170, 4, 28, 'p', 0.15));
  add({ id: 'vakum-tupu', name: 'Vakum Tüpü', tags: ['elektronik', 'eski', 'bilgisayar'], size: [100, 200], palette: { g: '#cfe6ee', k: '#4a5560', f: '#ffb000', h: '#ffffff', d: '#6b4a2b', p: '#c9ccd1' }, roles: { g: 'acik', k: 'koyu', f: 'vurgu', d: 'ikincil', p: 'detay' }, facets: f });
}

// ─────────────────────────────────────────────────────────── ENIAC (kabin sırası)
{
  const f = [];
  f.push(...rect(0, 186, 400, 10, 'z', -0.2)); // zemin rayı
  for (let i = 0; i < 5; i++) {
    const x = 8 + i * 78;
    f.push(...rect(x, 24, 70, 164, 'a', 0));
    f.push(...rect(x, 24, 70, 22, 'b', 0.1)); // üst panel
    f.push(...rect(x + 6, 30, 26, 10, 'l', 0.15)); // etiket
    const R = rng(11 + i);
    for (let row = 0; row < 5; row++) for (let col = 0; col < 4; col++) {
      f.push(...rect(x + 8 + col * 15, 54 + row * 15, 9, 9, R() > 0.45 ? 'l' : 'd', 0.12));
    }
    f.push(...ellipse(x + 20, 158, 9, 9, 'c', 0.1, 10), ...ellipse(x + 50, 158, 9, 9, 'c', 0.1, 10));
    f.push(...rect(x + 26, 154, 18, 5, 'k', -0.1)); // anahtar
  }
  // tavan kabloları
  f.push(...poly([[0, 10], [400, 10], [400, 24], [0, 24]], 'k', -0.1));
  add({ id: 'eniac', name: 'ENIAC Kabinleri', tags: ['bilgisayar', 'eski', 'ana-bilgisayar', '1945'], size: [400, 200], palette: { a: '#8f9a8c', b: '#647063', l: '#ffb000', d: '#3d4a43', c: '#d8d2c0', k: '#232a26', z: '#4a4f4c' }, roles: { a: 'ana', b: 'ikincil', l: 'vurgu', d: 'koyu', c: 'acik', k: 'koyu', z: 'koyu' }, facets: f });
}

// ─────────────────────────────────────────────────────────── transistör
{
  const f = [];
  for (let i = 0; i < 3; i++) f.push(...rect(36 + i * 22, 100, 5, 56, 'd', 0.1));
  f.push(...rect(30, 44, 30, 64, 'a', 0.32), ...rect(60, 44, 30, 64, 'a', -0.3)); // silindir
  f.push(...ellipse(60, 44, 30, 9, 'a', 0.35, 14)); // kapak
  f.push(...rect(30, 100, 60, 8, 'b', -0.2)); // alt halka
  f.push(F([[84, 62], [98, 66], [84, 74]], 'a', 0.2)); // dil
  add({ id: 'transistor', name: 'Transistör', tags: ['elektronik', 'bilgisayar', '1947'], size: [120, 160], palette: { a: '#b9c2cc', b: '#7d8791', d: '#d6a53a' }, roles: { a: 'acik', b: 'ikincil', d: 'vurgu' }, facets: f });
}

// ─────────────────────────────────────────────────────────── işlemci / çip
{
  const f = [];
  for (let i = 0; i < 8; i++) {
    const p = 46 + i * 15.5;
    f.push(...rect(p, 14, 7, 30, 'd', 0.12), ...rect(p, 156, 7, 30, 'd', -0.05));
    f.push(...rect(14, p, 30, 7, 'd', 0.12), ...rect(156, p, 30, 7, 'd', -0.05));
  }
  f.push(...rect(40, 40, 120, 120, 'a', 0));
  f.push(F([[40, 40], [160, 40], [150, 50]], 'a', 0.3), F([[40, 40], [150, 50], [50, 50]], 'a', 0.3));
  f.push(...rect(66, 66, 68, 68, 'b', 0.05));
  f.push(...rect(76, 76, 48, 6, 'v', 0.15), ...rect(76, 92, 30, 6, 'v', 0.15), ...rect(76, 108, 48, 6, 'v', 0.15));
  f.push(...rect(118, 92, 6, 22, 'v', 0.15), ...rect(76, 76, 6, 40, 'v', 0.1));
  f.push(...ellipse(52, 52, 4, 4, 'w', 0.3, 8)); // 1. bacak işareti
  add({ id: 'cip', name: 'Mikroçip', tags: ['elektronik', 'bilgisayar', 'işlemci'], size: [200, 200], palette: { a: '#2b3140', b: '#47506a', d: '#d4b25a', v: '#ffb000', w: '#c9d1e3' },
    roles: { a: 'koyu', b: 'ikincil', d: 'detay', v: 'vurgu', w: 'acik' },
    variants: { yapay: { name: 'Yapay zekâ', palette: { a: '#1c2b35', b: '#2a4a5a', v: '#3bf4fb' } } }, facets: f });
}

// ─────────────────────────────────────────────────────────── kişisel bilgisayar (CRT)
{
  const f = [];
  f.push(...rect(40, 10, 180, 140, 'a', 0.05));
  f.push(...rect(40, 10, 180, 8, 'a', 0.3));
  f.push(...rect(54, 24, 152, 110, 'b', -0.1)); // çerçeve içi
  f.push(...rect(62, 32, 136, 94, 's', -0.25)); // ekran
  f.push(F([[198, 32], [166, 32], [198, 58]], 'h', 0.6)); // yansıma
  f.push(...poly([[80, 150], [180, 150], [196, 166], [64, 166]], 'a', -0.2)); // ayak
  f.push(...ellipse(192, 141, 3.5, 3.5, 'v', 0.3, 8)); // güç ışığı
  f.push(...poly([[26, 196], [234, 196], [254, 232], [6, 232]], 'a', 0.0)); // klavye gövdesi
  for (let row = 0; row < 3; row++) {
    const y = 201 + row * 9, inset = row * 3.2;
    for (let i = 0; i < 12; i++) f.push(...rect(34 + inset * 0.6 + i * (186 / 12) * (1 + row * 0.03), y, 12, 6, 'k', 0.1));
  }
  add({ id: 'kisisel-bilgisayar', name: 'Kişisel Bilgisayar (CRT)', tags: ['bilgisayar', '1980', 'kişisel', 'masaüstü'], size: [260, 240], palette: { a: '#d8cfb8', b: '#b7ad94', s: '#0f2a1f', v: '#7dffa8', h: '#ffffff', k: '#8a8270' }, roles: { a: 'acik', b: 'ikincil', s: 'koyu', v: 'vurgu', k: 'detay' },
    variants: { kehribar: { name: 'Kehribar', palette: { v: '#ffb000', s: '#2a1a08' } }, gri: { name: 'Gri kasa', palette: { a: '#b9bec6', b: '#8d939d', k: '#646a74' } } }, facets: f });
}

// ─────────────────────────────────────────────────────────── dizüstü
{
  const f = [];
  f.push(...rect(50, 10, 160, 112, 'a', 0));
  f.push(...rect(58, 18, 144, 96, 's', -0.1));
  f.push(...rect(58, 18, 144, 10, 'b', 0.1));
  f.push(...rect(66, 38, 60, 40, 'w', 0.15), ...rect(134, 38, 60, 18, 'v', 0.12), ...rect(134, 62, 60, 16, 'w', 0.1));
  f.push(...rect(66, 88, 128, 6, 'w', 0.05), ...rect(66, 100, 80, 6, 'w', 0.05));
  f.push(...poly([[22, 128], [238, 128], [258, 168], [2, 168]], 'c', 0.12));
  f.push(...rect(104, 142, 52, 18, 'd', -0.12)); // izleme dörtgeni
  f.push(...rect(28, 132, 204, 4, 'd', -0.15));
  add({ id: 'dizustu', name: 'Dizüstü Bilgisayar', tags: ['bilgisayar', '1990', 'dizüstü', 'taşınabilir'], size: [260, 180], palette: { a: '#3a404d', b: '#d5dae3', s: '#eaf0fb', w: '#ffffff', v: '#6c63ff', c: '#b9c0cc', d: '#8f97a5' }, roles: { a: 'koyu', b: 'acik', s: 'acik', w: 'acik', v: 'vurgu', c: 'ikincil', d: 'detay' }, facets: f });
}

// ─────────────────────────────────────────────────────────── sunucu rafı
{
  const f = [];
  f.push(...rect(10, 10, 140, 222, 'a', 0));
  f.push(...rect(2, 228, 156, 10, 'k', -0.2));
  const R = rng(3);
  for (let u = 0; u < 6; u++) {
    const y = 18 + u * 34;
    f.push(...rect(18, y, 124, 28, 'b', 0.05));
    for (let i = 0; i < 4; i++) f.push(...rect(24 + i * 10, y + 10, 5, 8, R() > 0.3 ? 'l' : 'd', 0.15));
    for (let i = 0; i < 6; i++) f.push(...rect(74 + i * 10, y + 6, 4, 16, 'k', -0.1));
  }
  add({ id: 'sunucu', name: 'Sunucu Rafı', tags: ['bilgisayar', 'bulut', 'veri merkezi', 'bugün'], size: [160, 240], palette: { a: '#2f3746', b: '#465069', l: '#3bf4fb', d: '#1b2230', k: '#20273a' }, roles: { a: 'koyu', b: 'ikincil', l: 'vurgu', d: 'koyu', k: 'koyu' }, facets: f });
}

// ─────────────────────────────────────────────────────────── bit rakamları (0 / 1)
{
  add({ id: 'bit-0', name: 'Bit 0', tags: ['ikili', 'rakam', 'bilgisayar'], size: [40, 64], palette: { a: '#7dffa8' },
    facets: [...rect(6, 4, 28, 8, 'a', 0.2), ...rect(6, 52, 28, 8, 'a', -0.1), ...rect(6, 4, 8, 56, 'a', 0.1), ...rect(26, 4, 8, 56, 'a', -0.15)] });
  add({ id: 'bit-1', name: 'Bit 1', tags: ['ikili', 'rakam', 'bilgisayar'], size: [40, 64], palette: { a: '#7dffa8' },
    facets: [...rect(16, 4, 8, 56, 'a', 0.1), F([[16, 4], [4, 18], [16, 18]], 'a', 0.25), ...rect(6, 52, 28, 8, 'a', -0.12)] });
}

// ─────────────────────────────────────────────────────────── çubuk (HUD göstergesi; sol kenardan uzar)
add({ id: 'cubuk', name: 'Gösterge Çubuğu', tags: ['ui', 'çubuk', 'şekil'], size: [100, 24], palette: { a: '#ffb000' }, facets: [...rect(0, 0, 100, 24, 'a', 0.05), F([[0, 0], [100, 0], [100, 6]], 'a', 0.3)] });

// kâğıt uçak (origami; burun sağa bakar, 3/4 üstten görünüm: iki kanat + sırt katı + karın altı)
{
  const f = [];
  const N = [238, 70], T = [18, 64], WL = [26, 6], WR = [40, 128], KL = [70, 98];
  f.push(F([N, [34, 100], [92, 100]], 'c', -0.05)); // karın (kırmızı kalemle boyalı şerit)
  f.push(F([N, WL, T], 'a', 0.32)); // uzak kanat (ışıklı)
  f.push(F([N, [150, 34], [90, 52]], 'a', 0.5)); // uzak kanat iç katı parlaması
  f.push(F([N, T, WR], 'a', -0.12)); // yakın kanat (gölgede)
  f.push(F([N, T, KL], 'b', -0.38)); // sırt katının gölgesi
  f.push(F([N, [120, 82], [60, 96]], 'b', -0.2)); // yakın kanat alt kıvrımı
  f.push(F([T, WL, [38, 40]], 'b', 0.05)); // kuyruk kıvrımı
  add({ id: 'ucak', name: 'Kâğıt Uçak (origami)', tags: ['uçan', 'kağıt', 'rehber'], size: [240, 130], palette: { a: '#dce9ff', b: '#9db9ea', c: '#ff9a84' }, roles: { a: 'acik', b: 'ikincil', c: 'vurgu' }, facets: f });
}

// kâğıt şerit parçası (iz bırakan konfeti / serpantin; ortadan katlı iki ton)
add({ id: 'serit', name: 'Kâğıt Şerit', tags: ['konfeti', 'iz', 'kağıt'], size: [120, 26], palette: { a: '#8fb3f2' },
  facets: [F([[0, 6], [60, 0], [60, 20]], 'a', 0.3), F([[0, 6], [60, 20], [0, 26]], 'a', 0.1), F([[60, 0], [120, 7], [120, 27]], 'a', -0.3), F([[60, 0], [120, 27], [60, 20]], 'a', -0.12)] });
// dört uçlu pırıltı
{
  const f = [], C = [50, 50];
  for (let i = 0; i < 4; i++) {
    const a = i * 90, tip = pt(50, 50, 48, a - 90), l = pt(50, 50, 9, a - 135), r = pt(50, 50, 9, a - 45);
    f.push(F([C, l, tip], 'a', i % 2 ? 0.55 : 0.25), F([C, tip, r], 'a', i % 2 ? 0.1 : -0.15));
  }
  add({ id: 'pirilti', name: 'Pırıltı (4 uçlu)', tags: ['efekt', 'parıltı', 'yıldız'], size: [100, 100], palette: { a: '#fff1a8' }, facets: f });
}

// kareli defter zemini (dünya uzayında geniş; "duz" stille çizilir)
{
  const f = [];
  const GW = 15800, GH = 3400, STEP = 60;
  for (let x = 0; x <= GW; x += STEP) f.push(...rect(x, 0, x % (STEP * 5) === 0 ? 2.6 : 1.4, GH, x % (STEP * 5) === 0 ? 'b' : 'a', 0));
  for (let y = 0; y <= GH; y += STEP) f.push(...rect(0, y, GW, y % (STEP * 5) === 0 ? 2.6 : 1.4, y % (STEP * 5) === 0 ? 'b' : 'a', 0));
  add({ id: 'kareli-zemin', name: 'Kareli Defter Zemini', tags: ['ui', 'arka plan', 'defter'], size: [GW, GH], palette: { a: '#c9d6ee', b: '#a9bde3' }, facets: f.map((q) => ({ ...q, s: 0 })) });
}

// düz tabaka (arka plan kağıdı; ölçeklenip ekranı kaplar)
add({ id: 'tabaka', name: 'Düz Tabaka', tags: ['ui', 'arka plan', 'şekil'], size: [100, 100], palette: { a: '#ffffff' }, facets: [F([[0, 0], [100, 0], [100, 100]], 'a', 0), F([[0, 0], [100, 100], [0, 100]], 'a', 0)] });

// ─────────────────────────────────────────────────────────── yaz
for (const a of assets) {
  const dir = path.join(LIB, 'bilgisayar');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
}
const effect = (id, name, asset) => ({ id, name, tags: ['efekt', 'ikili', 'bilgisayar'], type: 'particles', motion: 'dus', shape: 'varlik', asset, count: 26, size: 44, speed: 95, wind: 0, sway: 8, spin: 0, colors: [], prewarm: true });
for (const e of [effect('ikili-sifir', 'İkili yağmur (0)', 'bit-0'), effect('ikili-bir', 'İkili yağmur (1)', 'bit-1')]) {
  fs.writeFileSync(path.join(LIB, 'efektler', `${e.id}.json`), JSON.stringify(e, null, 2) + '\n');
}
console.log(`ok — ${assets.length} model (bilgisayar/) + 2 efekt`);
