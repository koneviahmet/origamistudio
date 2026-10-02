// Reels sonundaki "videonun tamamı YouTube'da" yönlendirmesi için çizim uyumlu oynat düğmesi.
//   node scripts/seed-oynat-dugmesi.mjs [--force]   →  data/library/iletisim/oynat-dugmesi-cizim.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, deg) => [r1(cx + r * Math.cos(rad(deg))), r1(cy + r * Math.sin(rad(deg)))];
const yay = (cx, cy, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => pt(cx, cy, r, a0 + ((a1 - a0) * i) / n));
const F = (p, c = 'a', s = 0) => ({ p, c, s });

const R = 52, x0 = 20, x1 = 360, y0 = 20, y1 = 250;
const govde = [...yay(x1 - R, y0 + R, R, -90, 0), ...yay(x1 - R, y1 - R, R, 0, 90), ...yay(x0 + R, y1 - R, R, 90, 180), ...yay(x0 + R, y0 + R, R, 180, 270)];
const facets = [
  F(govde, 'a', 0),
  F([[x0 + 60, y0 + 14], [x1 - 60, y0 + 14], [x1 - 60, y0 + 26], [x0 + 60, y0 + 26]], 'k', 0.55),
  F([[150, 70], [150, 200], [262, 135]], 'c', -0.1),
  F([[150, 70], [262, 135], [214, 135]], 'c', 0.4),
];
const model = {
  id: 'oynat-dugmesi-cizim', name: 'Oynat düğmesi (çizim)',
  tags: ['oynat', 'play', 'video', 'youtube', 'izle', 'tamamını izle', 'yönlendirme', 'sosyal medya', 'çizim', 'pastel'],
  size: [380, 270], palette: { a: '#ff3b30', c: '#ffffff', d: '#b3201a', k: '#ff8c84' },
  roles: { a: 'ana', c: 'acik', d: 'koyu', k: 'vurgu' }, facets,
};
const file = path.join(ROOT, 'data', 'library', 'iletisim', `${model.id}.json`);
if (fs.existsSync(file) && !FORCE) console.log('atlandı (var)');
else { fs.writeFileSync(file, JSON.stringify(model, null, 2) + '\n'); console.log('ok — oynat-dugmesi-cizim yazıldı'); }
