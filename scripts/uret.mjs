// Brief'ten video üretir:
//   node scripts/uret.mjs <brief.json>            → data/projects/<id>/ (scene.json + brief.json)
//   node scripts/uret.mjs --ornek <sablon>        → şablonun örnek brief'ini yazdırır
//   node scripts/uret.mjs --liste                 → şablonları listeler
// Brief alanları (ortak): sablon, id, ad, format (reels|youtube|kare|dikey45), tema, stil, vurgu, muzik, fps.
// Şablona özgü alanlar için: --ornek <sablon>.  Rehber: docs/prompt-rehberi.md §9
import fs from 'node:fs';
import path from 'node:path';
import { SABLONLAR, sablonListesi, uret } from './sablonlar/index.mjs';
import { projeYaz } from './sablonlar/lib.mjs';

const args = process.argv.slice(2);
if (!args.length || args[0] === '--liste') {
  console.log('Şablonlar:\n');
  for (const s of sablonListesi()) console.log(`  ${s.id.padEnd(10)} ${s.ad}\n             ${s.aciklama}\n`);
  console.log('Kullanım: node scripts/uret.mjs <brief.json>  |  --ornek <sablon>');
  process.exit(0);
}
if (args[0] === '--ornek') {
  const s = SABLONLAR[args[1]];
  if (!s) {
    console.error(`Bilinmeyen şablon. Seçenekler: ${Object.keys(SABLONLAR).join(', ')}`);
    process.exit(1);
  }
  console.log(JSON.stringify(s.ornek, null, 2));
  process.exit(0);
}

const file = path.resolve(args[0]);
const brief = JSON.parse(fs.readFileSync(file, 'utf8'));
const { id, scene } = uret(brief);
const dir = projeYaz(id, scene, brief);
console.log(`ok — ${id}: ${scene.layers.length} katman, ${scene.duration} sn, ${scene.width}×${scene.height} (${path.relative(process.cwd(), dir)})`);
