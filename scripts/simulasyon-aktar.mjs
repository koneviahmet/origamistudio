// orman-oyunu deposundaki simülasyonları data/simulations/ altına aktarır.
//   node scripts/simulasyon-aktar.mjs --kaynak <orman-oyunu klasörü> [--yeniden]
// Çıktı:
//   data/simulations/<slug>/sim.json      → yönetilebilir üst veri (başlık, kategori, etiket, durum, not…)
//   data/simulations/<slug>/kaynak/...    → o simülasyona ait kaynak dosyalar (depodaki yolla)
//   data/simulations/_ortak/...           → ortak kabuk / composable / kütüphane / varlıklar
// Yeniden çalıştırınca kullanıcının sim.json düzenlemeleri (title, tags, status, notes, favorite, hidden) korunur;
// --yeniden verilmedikçe var olan kaynak dosyaları üzerine yazılmaz. Hiçbir şey SİLİNMEZ.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'simulations');
const args = process.argv.slice(2);
const kIdx = args.indexOf('--kaynak');
const SRC = kIdx >= 0 ? path.resolve(args[kIdx + 1] || '') : '';
const YENIDEN = args.includes('--yeniden');
if (!SRC || !fs.existsSync(path.join(SRC, 'src', 'views', 'simulation'))) {
  console.error('Kullanım: simulasyon-aktar.mjs --kaynak <orman-oyunu klasörü> [--yeniden]');
  process.exit(1);
}

const rel = (p) => path.relative(SRC, p).replace(/\\/g, '/');
const imp = async (p) => (await import(pathToFileURL(p).href + `?v=${Date.now()}`));

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

function kopya(files, hedefKok) {
  let n = 0;
  for (const f of files) {
    const hedef = path.join(hedefKok, rel(f));
    if (fs.existsSync(hedef) && !YENIDEN) continue;
    fs.mkdirSync(path.dirname(hedef), { recursive: true });
    fs.copyFileSync(f, hedef);
    n++;
  }
  return n;
}

const SIM = path.join(SRC, 'src', 'views', 'simulation');
const LEG = path.join(SIM, 'legacy');
const MOD = path.join(SIM, 'simulations');

const { MODERN_SIMULATIONS, LEGACY_SIMULATIONS } = await (async () => {
  const legacy = (await imp(path.join(SRC, 'src', 'data', 'simulations-legacy.js'))).LEGACY_SIMULATIONS;
  // simulations.js MODERN_SIMULATIONS'ı dışa aktarmıyor → metinden ayıkla
  const txt = fs.readFileSync(path.join(SRC, 'src', 'data', 'simulations.js'), 'utf8');
  const m = txt.match(/const MODERN_SIMULATIONS = (\[[\s\S]*?\n\])/);
  const modern = m ? new Function(`return ${m[1]}`)() : [];
  return { MODERN_SIMULATIONS: modern, LEGACY_SIMULATIONS: legacy };
})();
const { LEGACY_METADATA } = await imp(path.join(LEG, 'metadata.js'));

// legacy slug → embed dosyası / klasörü
const slugMapTxt = fs.readFileSync(path.join(LEG, 'slug-map.js'), 'utf8');
const legacyDosya = {};
for (const m of slugMapTxt.matchAll(/'([^']+)':\s*\(\)\s*=>\s*import\('\.\/embed\/([^']+)'\)/g)) legacyDosya[m[1]] = m[2];

const embedDir = path.join(LEG, 'embed');
function legacyDosyalari(ref) {
  if (!ref) return [];
  if (ref.includes('/')) return listFiles(path.join(embedDir, ref.split('/')[0]));
  const f = path.join(embedDir, ref);
  return fs.existsSync(f) ? [f] : [];
}
function modernDosyalari(slug) {
  const out = [];
  const tek = path.join(MOD, `${slug}.vue`);
  if (fs.existsSync(tek)) out.push(tek);
  out.push(...listFiles(path.join(MOD, slug)));
  return out;
}

const KATEGORI = { fizik: 'Fizik', kimya: 'Kimya', biyoloji: 'Biyoloji', astronomi: 'Astronomi', uzay: 'Astronomi', matematik: 'Matematik' };
const MODERN_KATEGORI = [[/gunes|ay-|gok|uzaklik|gezegen/, 'Astronomi'], [/arsimet|elektroskop/, 'Fizik'], [/atom/, 'Kimya']];
const modernKategori = (slug) => MODERN_KATEGORI.find(([re]) => re.test(slug))?.[1] || 'Diğer';
const kategori = (s) => KATEGORI[String(s || '').toLowerCase()] || (s ? String(s)[0].toUpperCase() + String(s).slice(1) : 'Diğer');

fs.mkdirSync(OUT, { recursive: true });
const simler = new Map();
for (const s of LEGACY_SIMULATIONS) simler.set(s.slug, { ...s, kind: 'legacy' });
for (const s of MODERN_SIMULATIONS) simler.set(s.slug, { ...s, kind: 'modern' });

let toplamDosya = 0;
for (const [slug, s] of simler) {
  const dosyalar = [...modernDosyalari(slug), ...legacyDosyalari(legacyDosya[slug])];
  const meta = LEGACY_METADATA[slug] || {};
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  toplamDosya += kopya(dosyalar, path.join(dir, 'kaynak'));

  const jsonYol = path.join(dir, 'sim.json');
  const eski = fs.existsSync(jsonYol) ? JSON.parse(fs.readFileSync(jsonYol, 'utf8')) : {};
  const yeni = {
    slug,
    title: s.title,
    subtitle: s.subtitle || '',
    category: s.kind === 'legacy' ? kategori(s.subtitle) : modernKategori(slug),
    description: s.description || meta.description || '',
    tags: [...new Set((meta.attach || []).map((t) => String(t).toLowerCase()))],
    accent: s.accent || '',
    engine: s.engine || (s.kind === 'legacy' ? 'legacy' : 'three'),
    kind: s.kind,
    available: s.available !== false,
    status: 'ham', // ham | hazir | arsiv
    favorite: false,
    notes: '',
    usage: '', // video / kullanım amacı (sonradan doldurulacak)
    // Önizleme girişi (kaynak/ altındaki depo yolu): modern → simulations/<slug>/index.vue, eski → embed/<dosya>
    entry: s.kind === 'modern' ? `src/views/simulation/simulations/${slug}/index.vue` : `src/views/simulation/legacy/embed/${legacyDosya[slug]}`,
    files: dosyalar.map(rel),
    importedAt: eski.importedAt || new Date().toISOString(),
    source: 'github.com/koneviahmet/orman-oyunu',
  };
  // Kullanıcı düzenlemeleri korunur
  for (const k of ['title', 'category', 'description', 'tags', 'status', 'favorite', 'notes', 'usage', 'subtitle', 'jsonKontrol', 'kontrol']) { // jsonKontrol/kontrol: video modunda JSON ile yönetilen simülasyonlar
    if (eski[k] !== undefined && !(k === 'category' && eski[k] === 'Diğer')) yeni[k] = eski[k];
  }
  fs.writeFileSync(jsonYol, JSON.stringify(yeni, null, 2));
}

// Ortak parçalar: simülasyona özel olmayan her şey
const ozel = new Set([...simler.keys()].flatMap((slug) => {
  const d = [...modernDosyalari(slug), ...legacyDosyalari(legacyDosya[slug])];
  return d.map(rel);
}));
const ortakKokler = [
  SIM,
  path.join(SRC, 'src', 'components', 'simulation'),
  path.join(SRC, 'src', 'lib', 'simulation'),
  path.join(SRC, 'src', 'data'),
  path.join(SRC, 'src', 'composables'),
  path.join(SRC, 'public', 'assets', 'simulations'),
  path.join(SRC, 'docs', 'guides'),
  path.join(SRC, 'docs', 'models'),
];
const ortak = ortakKokler.flatMap(listFiles).filter((f) => !ozel.has(rel(f)) && (!rel(f).startsWith('docs/') || /simul/i.test(f)));
const ortakN = kopya(ortak, path.join(OUT, '_ortak'));

console.log(`✔ ${simler.size} simülasyon (${MODERN_SIMULATIONS.length} modern, ${simler.size - MODERN_SIMULATIONS.length} eski) · ${toplamDosya} dosya kopyalandı · ortak ${ortakN} dosya`);
