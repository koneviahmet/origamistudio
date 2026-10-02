// Hikâye şablonları için özel origami modelleri (Küçük Fener, Kervan, Kar Küresi, Ejderha, Mantar Ormanı).
//   node scripts/seed-hikaye.mjs [fener|kervan|kar|ejderha|mantar …]   → data/library/hikaye-<…>/<id>.json (her çalıştırmada üzerine yazar)
//   node scripts/seed-hikaye.mjs --test fener   → data/projects/test-modeller altına bir model galerisi sahnesi yazar (görsel denetim; sonra: npm run proje-sil -- test-modeller)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dosya } from './hikaye-modeller/kit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library');
const args = process.argv.slice(2);
const test = args[0] === '--test';
const sec = (test ? args.slice(1) : args).filter(Boolean);
const HEPSI = ['fener', 'kervan', 'kar', 'ejderha', 'mantar'];
const hedef = sec.length ? sec : HEPSI;

for (const ad of hedef) {
  if (!HEPSI.includes(ad)) { console.error(`Bilinmeyen hikâye: ${ad} (${HEPSI.join(', ')})`); process.exit(1); }
  await import(`./hikaye-modeller/${ad}.mjs`).catch((e) => { console.error(`${ad}: ${e.message}`); process.exit(1); });
}

const yazilan = [];
for (const { kategori, ...a } of dosya) {
  const dir = path.join(LIB, kategori);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${a.id}.json`), JSON.stringify(a, null, 2) + '\n');
  yazilan.push(a);
}
console.log(`ok — ${yazilan.length} model yazıldı: ${yazilan.map((a) => a.id).join(', ')}`);

if (test) {
  // galeri sahnesi: modeller ızgarada, koyu / açık zemin
  const kol = 4;
  const hucre = 520;
  const layers = [];
  yazilan.forEach((a, i) => {
    const x = (i % kol) * hucre + hucre / 2;
    const y = Math.floor(i / kol) * hucre + hucre * 0.55;
    const [w, h] = a.size;
    const s = Math.min((hucre * 0.86) / w, (hucre * 0.8) / h);
    layers.push({ id: `m-${i}`, asset: a.id, x: Math.round(x), y: Math.round(y), anchor: [0.5, 0.5], scale: Math.round(s * 1000) / 1000 });
    if (a.variants?.gece) layers.push({ id: `m-${i}-g`, asset: a.id, variant: 'gece', x: Math.round(x), y: Math.round(y + hucre * 0.0), anchor: [0.5, 0.5], scale: 0.001, hidden: true });
  });
  const satir = Math.ceil(yazilan.length / kol);
  const sc = { name: 'Model galerisi', width: kol * hucre, height: satir * hucre, fps: 30, duration: 2, background: { type: 'solid', color: '#cfd8e3', paper: 0.2, vignette: 0 }, layers };
  const dir = path.join(ROOT, 'data', 'projects', 'test-modeller');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(sc, null, 1));
  fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
  console.log(`galeri: ${sc.width}x${sc.height} → /api/projects/test-modeller`);
}
