// Ses zarfı çıkarır (ritme / sese bağlı animasyonlar ve dalga formu için) ve projeye yazar.
//   node scripts/analyze-audio.mjs <dosya.wav> [--proje <id>] [--fps 30]
// WAV (PCM16/24/float) desteklenir. mp3/m4a için stüdyoda Ses → "Zarf çıkar" düğmesini kullan.
// --proje verilirse, o projenin `audio` izlerinden bu dosyayı kullananlara `env` yazılır; verilmezse özet yazdırılır.
import fs from 'node:fs';
import path from 'node:path';
import { zarfCikar, ROOT } from './sablonlar/lib.mjs';

const a = process.argv.slice(2);
const file = a.find((x) => !x.startsWith('--') && a[a.indexOf(x) - 1] !== '--proje' && a[a.indexOf(x) - 1] !== '--fps');
const opt = (n, d) => (a.includes(`--${n}`) ? a[a.indexOf(`--${n}`) + 1] : d);
if (!file) {
  console.log('Kullanım: node scripts/analyze-audio.mjs <dosya.wav> [--proje <id>] [--fps 30]');
  process.exit(1);
}
const env = zarfCikar(path.basename(file), Number(opt('fps', 30)));
if (!env) {
  console.error(`Çözülemedi: ${file} (data/audio içinde bir .wav olmalı). mp3 için stüdyoda "Zarf çıkar".`);
  process.exit(1);
}
const frames = env.data.length / env.bands;
console.log(`${file}: ${frames} kare (${(frames / env.fps).toFixed(1)} sn), ${env.bands} bant`);
const proje = opt('proje');
if (proje) {
  const f = path.join(ROOT, 'data', 'projects', proje, 'scene.json');
  const scene = JSON.parse(fs.readFileSync(f, 'utf8'));
  let n = 0;
  for (const tr of scene.audio || []) if (tr.file === path.basename(file)) (tr.env = env), n++;
  if (!n) {
    console.error(`"${proje}" projesinde bu dosyayı kullanan ses izi yok.`);
    process.exit(1);
  }
  fs.writeFileSync(f, JSON.stringify(scene, null, 2) + '\n');
  console.log(`ok — ${proje}: ${n} ses izine env yazıldı`);
}
