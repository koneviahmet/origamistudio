// Yerel yapay zekâ ile enstrümantal müzik üretir (ACE-Step 1.5, GPU) ve projenin `audio` izlerine ekler.
//   node scripts/muzik.mjs --proje <id> --prompt "calm ambient pads, soft piano" [--sure 30] [--start 0] [--volume 0.35]
//        [--ad muzik] [--bpm 90] [--anahtar "C Major"] [--seed 123] [--fadein 1.5] [--fadeout 2.5] [--parca 90] [--capraz 2]
// prompt İngilizce yazılırsa daha iyi sonuç verir (tür, ruh hali, enstrümanlar, tempo). Yalnızca enstrümantal.
// Motor tek seferde en çok 120 sn üretir. Sahne (start'tan sonra) buna sığarsa tek parça; sığmazsa parça (--parca, varsayılan 90 sn)
// aynı dosyadan art arda DÖNGÜ olarak eklenir (--capraz 2 sn çapraz geçiş; sondaki sessiz --kuyruk 2 sn kırpılır).
// Konuşma altında --volume 0.25–0.35 kullan.
// Dosya data/audio/<ad>.wav olur; aynı adla tekrar çalıştırmak eski izi yerine koyar.
// Kurulum: muzik/ACE-Step-1.5 (docs/ai-workflow.md → Yerel müzik). Model ilk üretimde iner (birkaç GB).
import fs from 'node:fs';
import path from 'node:path';
import { createMuzik } from '../server/muzik.js';
import { zarfCikar, ROOT } from './sablonlar/lib.mjs';

const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(`--${n}`) ? a[a.indexOf(`--${n}`) + 1] : d);
const proje = opt('proje');
const prompt = opt('prompt');
if (!proje || !prompt) {
  console.log('Kullanım: node scripts/muzik.mjs --proje <id> --prompt "tarif" [--sure 30] [--start 0] [--volume 0.35] [--ad muzik] [--bpm 90] [--anahtar "C Major"] [--seed n]');
  process.exit(1);
}
const sceneFile = path.join(ROOT, 'data', 'projects', proje, 'scene.json');
if (!fs.existsSync(sceneFile)) (console.error(`Proje yok: ${proje}`), process.exit(1));
const ad = opt('ad', `muzik-${proje}`);
if (!/^[\w-]{1,60}$/.test(ad)) (console.error('--ad harf, rakam, - ve _ içermeli'), process.exit(1));

const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
const start = Number(opt('start', 0));
const MAKS = 120; // motorun tek seferde üretebildiği en uzun parça (sn)
const KUYRUK = Number(opt('kuyruk', 2)); // üretilen parçanın sondaki sessiz payı (sn): döngüde kırpılır
const CAPRAZ = Number(opt('capraz', 2)); // döngüde parçalar arası bindirme / çapraz geçiş (sn)
const gerek = Math.max(10, (scene.duration || 30) - start); // müziğin kaplaması gereken süre
// --sure verilirse parça uzunluğu odur. Verilmezse: sığıyorsa tek parça, sığmıyorsa 90 sn'lik parça döngüye alınır.
const sure = Math.min(MAKS, Math.max(10, Number(opt('sure', gerek + KUYRUK <= MAKS ? Math.ceil(gerek + KUYRUK) : opt('parca', 90)))));
const out = path.join(ROOT, 'data', 'audio', `${ad}.wav`);

const muzik = createMuzik();
let r;
try {
  console.log(`Üretiliyor (${sure} sn)… ilk seferde model inip yüklenir, birkaç dakika sürebilir.`);
  r = await muzik.generate({ prompt, duration: sure, bpm: opt('bpm'), key: opt('anahtar'), seed: opt('seed'), out });
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (muzik.spawnedHere()) muzik.stop(); // sayfanın açtığı motora dokunmaz
}
if (process.exitCode) process.exit(1);

const file = path.basename(out);
const volume = Number(opt('volume', 0.35));
const fadeIn = Number(opt('fadein', 1.5));
const fadeOut = Number(opt('fadeout', 2.5));
const env = zarfCikar(file, 30);
const kullanilir = Math.max(5, r.dur - KUYRUK);
const iz = (st, extra) => ({ file, start: Math.round(st * 100) / 100, offset: 0, dur: null, volume, fadeIn, fadeOut, mute: false, ...extra, ...(env ? { env } : {}) });
const tracks = [];
if (kullanilir >= gerek - 0.05) {
  tracks.push(iz(start));
} else {
  // Parça sahneyi kaplamıyor: aynı parçayı art arda ekle (döngü), aralarda çapraz geçiş
  const adim = kullanilir - CAPRAZ;
  const n = Math.ceil((gerek - kullanilir) / adim) + 1;
  for (let i = 0; i < n; i++) {
    const son = i === n - 1;
    tracks.push(iz(start + i * adim, {
      dur: son ? Math.round(Math.min(kullanilir, gerek - i * adim) * 100) / 100 : Math.round(kullanilir * 100) / 100,
      fadeIn: i === 0 ? fadeIn : CAPRAZ,
      fadeOut: son ? fadeOut : CAPRAZ,
    }));
  }
  console.log(`Parça ${r.dur} sn (kullanılır ${kullanilir.toFixed(1)}), sahne ${gerek.toFixed(1)} sn: ${n} kez art arda döngüye alındı (${CAPRAZ} sn çapraz geçiş).`);
}
scene.audio = (scene.audio || []).filter((t) => t.file !== file);
scene.audio.push(...tracks);
fs.writeFileSync(sceneFile, JSON.stringify(scene, null, 2) + '\n');
console.log(`ok — ${proje}: ${file} (${r.dur} sn${r.bpm ? `, ${r.bpm} BPM` : ''}${r.key ? `, ${r.key}` : ''}${r.seed ? `, seed ${r.seed}` : ''}) ${tracks.length} ses izi olarak eklendi`);
