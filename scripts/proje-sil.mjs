// Güvenli proje silme: kalıcı SİLMEZ, data/projects/<id> klasörünü data/projects-cop/<id>-<zaman> altına TAŞIR.
//   node scripts/proje-sil.mjs <id> [<id> ...]     → çöpe taşı
//   node scripts/proje-sil.mjs --liste             → çöpteki klasörler
//   node scripts/proje-sil.mjs --geri <cop-adi>    → çöpten data/projects altına geri al
// Kimlik boş / yol çıkışı / klasör yoksa HİÇBİR ŞEY yapmaz. Test projelerini temizlerken `rm -rf` yerine bunu kullan.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJ = path.join(ROOT, 'data', 'projects');
const COP = path.join(ROOT, 'data', 'projects-cop');
const ID = /^[a-z0-9][a-z0-9-]{0,80}$/;
const args = process.argv.slice(2).filter((a) => String(a).trim() !== '');

if (!args.length) {
  console.error('Kullanım: proje-sil.mjs <id> [<id>…] | --liste | --geri <cop-adi>');
  process.exit(1);
}
if (args[0] === '--liste') {
  const l = fs.existsSync(COP) ? fs.readdirSync(COP) : [];
  console.log(l.length ? l.join('\n') : '(çöp boş)');
  process.exit(0);
}
if (args[0] === '--geri') {
  const ad = args[1];
  const kaynak = path.join(COP, ad || '');
  if (!ad || !ID.test(ad.replace(/-\d{10,}$/, '')) || !fs.existsSync(kaynak)) { console.error(`Çöpte yok: "${ad}"`); process.exit(1); }
  const id = ad.replace(/-\d{10,}$/, '');
  const hedef = path.join(PROJ, id);
  if (fs.existsSync(hedef)) { console.error(`Zaten var: ${id}`); process.exit(1); }
  fs.renameSync(kaynak, hedef);
  console.log(`geri alındı: ${id}`);
  process.exit(0);
}

let sorun = 0;
for (const id of args) {
  const dir = path.join(PROJ, id);
  if (!ID.test(id) || path.dirname(dir) !== PROJ) { console.error(`REDDEDİLDİ (geçersiz kimlik): "${id}"`); sorun++; continue; }
  if (!fs.existsSync(path.join(dir, 'scene.json'))) { console.error(`REDDEDİLDİ (proje yok ya da scene.json yok): ${id}`); sorun++; continue; }
  fs.mkdirSync(COP, { recursive: true });
  const hedef = path.join(COP, `${id}-${Date.now()}`);
  fs.renameSync(dir, hedef);
  console.log(`çöpe taşındı: ${id} → ${path.relative(ROOT, hedef)}`);
}
process.exit(sorun ? 1 : 0);
