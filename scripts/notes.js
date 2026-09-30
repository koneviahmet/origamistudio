// Claude için açık notları listeler.
//   npm run notes            → tüm projelerdeki açık notlar
//   npm run notes -- <id>    → tek proje
//   npm run notes -- --all   → tamamlananlar dahil
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJ = path.join(ROOT, 'data', 'projects');
const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.find((a) => !a.startsWith('--'));

const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
let total = 0;

for (const id of fs.readdirSync(PROJ)) {
  if (only && id !== only) continue;
  const nf = path.join(PROJ, id, 'notes.json');
  const sf = path.join(PROJ, id, 'scene.json');
  if (!fs.existsSync(nf) || !fs.existsSync(sf)) continue;
  const notes = JSON.parse(fs.readFileSync(nf, 'utf8')).filter((n) => all || n.status !== 'done');
  if (!notes.length) continue;
  const scene = JSON.parse(fs.readFileSync(sf, 'utf8'));
  console.log(`\n■ ${id}  (${scene.name}, ${scene.width}x${scene.height}, ${scene.duration}s)`);
  console.log(`  scene: data/projects/${id}/scene.json`);
  for (const n of notes.sort((a, b) => a.t - b.t)) {
    total++;
    const where = [
      `t=${fmt(n.t)}`,
      n.layerId ? `katman=${n.layerId}` : null,
      n.pos ? `nokta=(${Math.round(n.pos[0])},${Math.round(n.pos[1])})` : null,
    ].filter(Boolean).join('  ');
    console.log(`  [${n.status}] ${n.id}  ${where}`);
    console.log(`      ${n.text.replace(/\n/g, '\n      ')}`);
    const snap = path.join(PROJ, id, 'snapshots', `${n.id}.png`);
    if (fs.existsSync(snap)) console.log(`      kare: ${path.relative(ROOT, snap).replace(/\\/g, '/')}`);
    if (n.reply) console.log(`      ↳ ${n.reply}`);
  }
}
console.log(total ? `\nToplam ${total} not.` : 'Açık not yok.');
