// Tasarım sistemi başlangıç içeriği:
//   - kütüphane modellerine renk rolleri (roles) ve varyantlar (variants) — yalnızca EKSİKSE eklenir
//   - data/themes/*.json      başlangıç temaları      (dosya yoksa yazılır)
//   - data/textstyles/*.json  başlangıç metin stilleri (dosya yoksa yazılır)
//   npm run seed:design            → eksikleri ekler
//   npm run seed:design -- --force → tema/stil dosyalarının üzerine yazar, rolleri/varyantları yeniler
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const FORCE = process.argv.includes('--force');

// ------------------------------------------------------ roller + varyantlar
const V = (name, palette) => ({ name, palette });
const ASSET_DESIGN = {
  tilki: {
    roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu' },
    variants: {
      kutup: V('Kutup', { a: '#e9eef2', b: '#b8c4cf', c: '#ffffff', d: '#2b2d42' }),
      gece: V('Gece', { a: '#5b5f97', b: '#3f4273', c: '#d9dbf1', d: '#1b1c33' }),
      altin: V('Altın', { a: '#f2b134', b: '#c98a12', c: '#fff4d6' }),
    },
  },
  turna: {
    roles: { a: 'ana', b: 'ikincil' },
    variants: { beyaz: V('Beyaz', { a: '#f4f1ea', b: '#d9d2c3' }), altin: V('Altın', { a: '#f2c14e', b: '#d19a2a' }), mavi: V('Mavi', { a: '#4d96ff', b: '#2f6fd1' }) },
  },
  balik: {
    roles: { a: 'ana', b: 'vurgu', d: 'koyu' },
    variants: { tropik: V('Tropik', { a: '#ffb703', b: '#fb5607' }), yesil: V('Yeşil', { a: '#52b788', b: '#d8f3dc' }), mor: V('Mor', { a: '#9b5de5', b: '#f15bb5' }) },
  },
  balina: {
    roles: { a: 'ana', c: 'acik', d: 'koyu' },
    variants: { gri: V('Gri', { a: '#7d8597' }), pembe: V('Pembe', { a: '#e5989b', c: '#ffe5ec' }), gece: V('Gece', { a: '#22333b', c: '#a9b4c2' }) },
  },
  kelebek: {
    roles: { a: 'ana', b: 'vurgu', d: 'koyu' },
    variants: { mavi: V('Mavi', { a: '#4cc9f0', b: '#4361ee' }), turuncu: V('Turuncu', { a: '#ff9f1c', b: '#ffbf69' }) },
  },
  marti: { roles: { a: 'acik', b: 'ikincil', o: 'vurgu', d: 'koyu' } },
  'cam-agaci': {
    roles: { a: 'ana', b: 'ikincil' },
    variants: { sonbahar: V('Sonbahar', { a: '#d9822b' }), karli: V('Karlı', { a: '#e8f1f2' }), koyu: V('Koyu orman', { a: '#2d6a4f' }) },
  },
  dag: {
    roles: { a: 'ana', b: 'ikincil', c: 'acik' },
    variants: { yesil: V('Yeşil', { a: '#6a994e', b: '#386641' }), kum: V('Kum', { a: '#d4a373', b: '#bc8a5f' }), gece: V('Gece', { a: '#3a506b', b: '#1c2541' }) },
  },
  lale: {
    roles: { a: 'vurgu', g: 'ana' },
    variants: { sari: V('Sarı', { a: '#ffd166' }), mor: V('Mor', { a: '#9b5de5' }), beyaz: V('Beyaz', { a: '#f8f9fa' }) },
  },
  tepeler: {
    roles: { a: 'ana', b: 'ikincil' },
    variants: { sonbahar: V('Sonbahar', { a: '#e9c46a', b: '#f4a261' }), kis: V('Kış', { a: '#edf2f4', b: '#d9e2ec' }), kum: V('Çöl', { a: '#e9c89b', b: '#d4a373' }) },
  },
  gunes: { roles: { a: 'ana', b: 'vurgu' }, variants: { gunbatimi: V('Gün batımı', { a: '#ff8c42', b: '#ff3c38' }) } },
  hilal: { roles: { a: 'ana' }, variants: { gumus: V('Gümüş', { a: '#dfe7ec' }) } },
  bulut: { roles: { a: 'acik' }, variants: { gri: V('Yağmur', { a: '#b8c0cc' }), pembe: V('Gün batımı', { a: '#ffd6e0' }) } },
  'kagit-ucak': { roles: { a: 'acik' }, variants: { mavi: V('Mavi', { a: '#a2d2ff' }), sari: V('Sarı', { a: '#ffe29a' }) } },
  ev: { roles: { a: 'vurgu', b: 'ikincil', c: 'acik', d: 'detay' }, variants: { mavi: V('Mavi çatı', { a: '#457b9d' }) } },
  'kagit-gemi': {
    roles: { a: 'ana', c: 'acik' },
    variants: { kirmizi: V('Kırmızı', { a: '#e76f51' }), sari: V('Sarı', { a: '#f4a261' }), yesil: V('Yeşil', { a: '#2a9d8f' }) },
  },
  yildiz: { roles: { a: 'ana' }, variants: { gumus: V('Gümüş', { a: '#dfe7ec' }) } },
  kalp: { roles: { a: 'ana' }, variants: { pembe: V('Pembe', { a: '#ff8fab' }) } },
  dalga: { roles: { a: 'acik', b: 'ana' }, variants: { gece: V('Gece', { a: '#3a506b', b: '#1c2541' }), tropik: V('Tropik', { a: '#48cae4', b: '#0096c7' }) } },
  'su-fiskirmasi': { roles: { a: 'acik', b: 'ana' } },
  merkur: { roles: { a: 'ana', b: 'ikincil', d: 'koyu' } },
  venus: { roles: { a: 'ana', b: 'ikincil', c: 'acik' } },
  dunya: { roles: { a: 'ana', b: 'ikincil', c: 'acik' }, variants: { buzul: V('Buzul çağı', { b: '#e8f1f2' }), col: V('Çöl gezegeni', { a: '#d4a373', b: '#a3663c' }) } },
  mars: { roles: { a: 'ana', b: 'ikincil', c: 'acik' } },
  jupiter: { roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'vurgu' } },
  saturn: { roles: { a: 'ana', b: 'ikincil', c: 'acik', r: 'detay', q: 'detay' } },
  uranus: { roles: { a: 'ana', b: 'ikincil', c: 'acik' } },
  neptun: { roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu' } },
  ay: { roles: { a: 'ana', b: 'ikincil', d: 'koyu' }, variants: { kanli: V('Kanlı ay', { a: '#c96f53', b: '#a8553d', d: '#7f3b2a' }) } },
};

let touched = 0;
const LIB = path.join(DATA, 'library');
for (const cat of fs.readdirSync(LIB)) {
  const dir = path.join(LIB, cat);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const id = f.slice(0, -5);
    const d = ASSET_DESIGN[id];
    if (!d) continue;
    const file = path.join(dir, f);
    const a = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    if (d.roles && (FORCE || !a.roles)) (a.roles = d.roles), (changed = true);
    if (d.variants && (FORCE || !a.variants)) (a.variants = d.variants), (changed = true);
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(a, null, 2) + '\n');
      touched++;
    }
  }
}
console.log(`Kütüphane: ${touched} modele rol/varyant eklendi.`);

// ------------------------------------------------------------------ temalar
const bg = (a = '$arka1', b = '$arka2') => ({ type: 'linear', colors: [a, b], angle: 180 });
const THEMES = {
  'gun-isigi': {
    name: 'Gün Işığı', paper: 'mat',
    colors: { arka1: '#ffe9cf', arka2: '#f4ad86', baslik: '#5b3a29', metin: '#8a5a3b', vurgu: '#e76f51' },
    background: bg(), vignette: 0.2,
  },
  sonbahar: {
    name: 'Sonbahar', paper: 'kraft',
    adjust: { warmth: 0.35, saturation: 0.9 },
    palette: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#8c4a2f', '#f7ede2'], paletteStrength: 0.45,
    colors: { arka1: '#f6e3c5', arka2: '#e2a36f', baslik: '#6b2d0f', metin: '#8c4a2f', vurgu: '#c8553d' },
    background: bg(), vignette: 0.28,
  },
  'pastel-ruya': {
    name: 'Pastel Rüya', paper: 'pastel',
    adjust: { saturation: 0.85, brightness: 0.04 },
    colors: { arka1: '#fde2e4', arka2: '#cddafd', baslik: '#6d597a', metin: '#8e7dbe', vurgu: '#f28482' },
    background: bg(), vignette: 0.1,
  },
  gece: {
    name: 'Gece', paper: 'mat',
    adjust: { brightness: -0.22, warmth: -0.4, saturation: 0.8 },
    colors: { arka1: '#0b132b', arka2: '#3a506b', baslik: '#f5e6a8', metin: '#c9d6ea', vurgu: '#ffd166' },
    background: bg(), vignette: 0.35,
  },
  'neon-parlak': {
    name: 'Neon Parlak', paper: 'parlak',
    adjust: { saturation: 1.4, contrast: 1.12 },
    colors: { arka1: '#1a1033', arka2: '#4a1a7a', baslik: '#ffd23f', metin: '#f7aef8', vurgu: '#3bf4fb' },
    background: { type: 'radial', colors: ['$arka2', '$arka1'], cy: 0.35 }, vignette: 0.3,
  },
  'kurumsal-mavi': {
    name: 'Kurumsal Mavi', paper: 'mat',
    palette: ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd', '#ffffff'], paletteStrength: 1,
    roles: { vurgu: '#ffb703' },
    colors: { arka1: '#f1f4f8', arka2: '#dbe4ee', baslik: '#0d1b2a', metin: '#415a77', vurgu: '#ffb703' },
    background: bg(), vignette: 0.08,
  },
  uzay: {
    name: 'Uzay', paper: 'parlak',
    colors: { arka1: '#1c2257', arka2: '#070a1f', baslik: '#ffd166', metin: '#dfe6ff', vurgu: '#6c63ff' },
    background: { type: 'radial', colors: ['$arka1', '$arka2'], cx: 0.5, cy: 0.45, radius: 0.75 }, vignette: 0.35,
  },
  'kadife-gece': {
    name: 'Kadife Gece', paper: 'kadife',
    colors: { arka1: '#231942', arka2: '#5e548e', baslik: '#e0b1cb', metin: '#be95c4', vurgu: '#f7b267' },
    background: bg(), vignette: 0.3,
  },
};

// ----------------------------------------------------------- metin stilleri
const TEXT_STYLES = {
  'baslik-yuvarlak': { name: 'Başlık · Yuvarlak', font: 'Baloo 2', weight: 800, size: 120, color: '$baslik', shadow: { color: 'rgba(60,30,15,0.22)', blur: 0, y: 6 } },
  'baslik-kalin': { name: 'Başlık · Kalın Poster', font: 'Bebas Neue', weight: 400, size: 160, letterSpacing: 4, uppercase: true, color: '$baslik' },
  'baslik-serif': { name: 'Başlık · Zarif Serif', font: 'Playfair Display', weight: 800, size: 110, color: '$baslik' },
  'baslik-modern': { name: 'Başlık · Modern', font: 'Outfit', weight: 800, size: 110, letterSpacing: -2, color: '$baslik' },
  'alt-baslik': { name: 'Alt başlık', font: 'Nunito', weight: 600, size: 54, color: '$metin' },
  altyazi: { name: 'Altyazı (Reels)', font: 'Poppins', weight: 700, size: 58, color: '#ffffff', stroke: { color: '#111111', width: 10 }, lineHeight: 1.2 },
  'etiket-kutu': { name: 'Etiket · Kutu', font: 'Outfit', weight: 700, size: 46, color: '#ffffff', uppercase: true, letterSpacing: 3, box: { color: '$vurgu', radius: 999 } },
  'el-yazisi': { name: 'El yazısı', font: 'Caveat', weight: 700, size: 96, color: '$metin' },
  'cocuk-eglenceli': { name: 'Eğlenceli', font: 'Baloo 2', weight: 800, size: 110, color: '#ffffff', stroke: { color: '$baslik', width: 12 }, shadow: { color: 'rgba(0,0,0,0.25)', blur: 0, y: 8 } },
};

function writeCol(col, docs) {
  const dir = path.join(DATA, col);
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const [id, doc] of Object.entries(docs)) {
    const f = path.join(dir, `${id}.json`);
    if (fs.existsSync(f) && !FORCE) continue;
    fs.writeFileSync(f, JSON.stringify(doc, null, 2) + '\n');
    n++;
  }
  console.log(`${col}: ${n}/${Object.keys(docs).length} yazıldı.`);
}
writeCol('themes', THEMES);
writeCol('textstyles', TEXT_STYLES);
