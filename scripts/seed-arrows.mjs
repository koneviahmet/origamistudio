import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Ok kütüphanesi: node scripts/seed-arrows.mjs  (--force: mevcutların üzerine yazar)
// data/library/oklar/<id>.json — "type": "arrow". Alanlar: docs/schema.md §11
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'library', 'oklar');
const FORCE = process.argv.includes('--force');

const A = (id, name, tags, fields) => ({ id, name, tags: ['ok', ...tags], type: 'arrow', ...fields });

const arrows = [
  A('ok-kavis', 'Kavisli ok', ['temel', 'kavis'], {
    curve: 'kavis', line: 'duz', head: 'ucgen', width: 8.5, headSize: 34, color: '#2d3561', bend: 0.25,
  }),
  A('ok-el-cizimi', 'El çizimi ok', ['çizim', 'defter', 'kalem'], {
    curve: 'kavis', line: 'el', head: 'kalem', width: 6.5, headSize: 39, color: '#2d3561', bend: 0.3, wobble: 2.2,
  }),
  A('ok-kesikli-rota', 'Kesikli rota', ['harita', 'yol', 'yolculuk'], {
    curve: 'kavis', line: 'kesik', head: 'acik', width: 7, headSize: 31, color: '#e63946', bend: 0.35,
    flow: 'kesik', flowSpeed: 60,
  }),
  A('ok-neon', 'Neon akış', ['modern', 'parlak', 'teknoloji'], {
    curve: 's', line: 'duz', head: 'ucgen', width: 7, headSize: 31, color: '#22d3ee', color2: '#a855f7', bend: 0.2,
    glow: 18, flow: 'kuyruklu', flowSpeed: 520, flowColor: '#ffffff',
  }),
  A('ok-serit', 'Sivrilen şerit', ['modern', 'dinamik'], {
    curve: 'kavis', line: 'serit', head: 'ucgen', width: 31, headSize: 57, color: '#f4a261', color2: '#e76f51', bend: 0.3,
    shadow: true,
  }),
  A('ok-akis-semasi', 'Akış şeması', ['diyagram', 'dirsek', 'süreç'], {
    curve: 'dirsek', line: 'duz', head: 'ucgen', tail: 'yuvarlak', width: 5.5, headSize: 26, color: '#334155', radius: 26,
    gap: 14, flow: 'nokta', flowSpeed: 120, flowGap: 46, flowColor: '#94a3b8',
  }),
  A('ok-cift-uclu', 'Çift uçlu', ['karşılaştırma', 'ilişki'], {
    curve: 'duz', line: 'duz', head: 'ucgen', tail: 'ucgen', width: 7, headSize: 31, color: '#2a9d8f', bend: 0,
  }),
  A('ok-noktali-akis', 'Noktalı akış', ['akış', 'veri'], {
    curve: 'kavis', line: 'nokta', head: 'acik', width: 8.5, headSize: 28.5, color: '#457b9d', bend: -0.2,
    flow: 'kesik', flowSpeed: 70,
  }),
  A('ok-dalga', 'Dalgalı ok', ['eğlenceli', 'çocuk'], {
    curve: 'dalga', line: 'duz', head: 'ucgen', width: 8.5, headSize: 34, color: '#8338ec', bend: 0.1, waves: 3, amp: 18,
  }),
  A('ok-halka', 'Halkalı ok', ['eğlenceli', 'dikkat'], {
    curve: 'dongu', line: 'duz', head: 'ucgen', width: 7, headSize: 31, color: '#ff006e', bend: 0.15,
  }),
  A('ok-kalin-golge', 'Kalın gölgeli', ['vurgu', 'sunum'], {
    curve: 'kavis', line: 'duz', head: 'ucgen', width: 19.5, headSize: 52, color: '#ffb703', color2: '#fb8500', bend: 0.22,
    shadow: true, flow: 'nabiz', flowSpeed: 240,
  }),
  A('ok-cift-cizgi', 'Çift çizgi', ['zarif', 'klasik'], {
    curve: 's', line: 'cift', head: 'elmas', tail: 'cizgi', width: 7, headSize: 28.5, color: '#6d4c41', bend: 0.25,
  }),
];

fs.mkdirSync(DIR, { recursive: true });
let n = 0;
for (const a of arrows) {
  const file = path.join(DIR, `${a.id}.json`);
  if (!FORCE && fs.existsSync(file)) continue;
  fs.writeFileSync(file, JSON.stringify(a, null, 2) + '\n');
  n++;
}
console.log(`ok: ${n} ok yazıldı (${arrows.length} tanımlı)`);
