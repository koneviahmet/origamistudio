// Bileşenlere etiket yazar / sözlüğü oluşturur.
//   npm run etiketle:bilesen            # etiketi olmayan facet'leri otomatik doldurur (var olanlara dokunmaz)
//   npm run etiketle:bilesen -- --force # tüm etiketleri otomatik önerilerle yeniden yazar
import fs from 'node:fs';
import path from 'node:path';
import { COMP_DIR, TAX_FILE } from './lib/bilesen.mjs';
import { autoTags, withAutoTags } from '../web/src/componentTags.js';

const force = process.argv.includes('--force');

if (!fs.existsSync(TAX_FILE)) {
  const j = { _not: 'Özel etiket değerleri (varsayılan sözlüğün üstüne biner): facetler.<facet>.degerler.<değer> = {ad, es}. es = arama için eş anlamlılar (TR+EN). Varsayılanlar: web/src/componentTags.js', facetler: {} };
  fs.writeFileSync(TAX_FILE, JSON.stringify(j, null, 2) + '\n');
  console.log('sözlük yazıldı → data/bilesen-etiketleri.json');
}

let n = 0;
for (const f of fs.readdirSync(COMP_DIR).filter((x) => x.endsWith('.json'))) {
  const file = path.join(COMP_DIR, f);
  const doc = { ...JSON.parse(fs.readFileSync(file, 'utf8')), id: f.slice(0, -5) };
  const next = force ? autoTags(doc) : withAutoTags(doc);
  const before = JSON.stringify(doc.etiketler || {});
  if (before === JSON.stringify(next)) continue;
  const { id: _i, ...rest } = doc;
  fs.writeFileSync(file, JSON.stringify({ ...rest, etiketler: next }, null, 2) + '\n');
  n++;
}
console.log(`${n} bileşene etiket yazıldı`);
