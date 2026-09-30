// Metinden yerel TTS (VoxCPM2, GPU) ile ses üretir ve projenin `audio` izlerine ekler.
//   node scripts/seslendir.mjs --proje <id> --metin "Merhaba" [--start 0] [--volume 1] [--ad anlatim]
//   node scripts/seslendir.mjs --proje <id> --satirlar anlatim.txt [--ad anlatim]
// satirlar dosyası: her satır `başlangıç_sn | metin` (örn. `2.5 | Bugün uzaya çıkıyoruz.`). Boş satır ve # yok sayılır.
// --ses-id <id|ad> → /ses sayfasındaki bir ses (katalog id'si ya da kayıtlı ad, örn. d1-02552 / anlatici). Yoksa varsayılan ses.
// --etiket <ad> [--cinsiyet erkek|kadin] [--sira 0] → o etiketi taşıyan sesler arasından seçer (kayıtlılar önce; --sira ile sonraki). Liste: node scripts/sesler.mjs
// Dosyalar data/audio/<ad>-<n>.wav olur; aynı adla tekrar çalıştırmak eski izleri yerine koyar.
// Kurulum: tts/ klasörü (python -m venv tts/.venv; torch cu124; pip install voxcpm soundfile). Bkz. docs/ai-workflow.md
import fs from 'node:fs';
import path from 'node:path';
import { createTts } from '../server/tts.js';
import { zarfCikar, ROOT } from './sablonlar/lib.mjs';

const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(`--${n}`) ? a[a.indexOf(`--${n}`) + 1] : d);
const proje = opt('proje');
const metin = opt('metin');
const satirlar = opt('satirlar');
if (!proje || (!metin && !satirlar)) {
  console.log('Kullanım: node scripts/seslendir.mjs --proje <id> (--metin "..." [--start 0] | --satirlar dosya.txt) [--ad ad] [--volume 1] [--ses-id <id|ad> | --etiket <ad> [--cinsiyet erkek|kadin] [--sira 0]]');
  process.exit(1);
}
const sceneFile = path.join(ROOT, 'data', 'projects', proje, 'scene.json');
if (!fs.existsSync(sceneFile)) (console.error(`Proje yok: ${proje}`), process.exit(1));
const ad = opt('ad', `ses-${proje}`);
const volume = Number(opt('volume', 1));
let sesId = opt('ses-id');
const parcalar = satirlar
  ? fs
      .readFileSync(satirlar, 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'))
      .map((s) => {
        const m = s.match(/^([\d.]+)\s*\|\s*(.+)$/);
        if (!m) (console.error(`Satır biçimi "sn | metin" olmalı: ${s}`), process.exit(1));
        return { start: Number(m[1]), text: m[2] };
      })
  : [{ start: Number(opt('start', 0)), text: metin }];

const audioDir = path.join(ROOT, 'data', 'audio');
fs.mkdirSync(audioDir, { recursive: true });
const tts = createTts();
if (!sesId && opt('etiket')) {
  const g = { erkek: 'male', kadin: 'female', 'kadın': 'female' }[opt('cinsiyet')] || '';
  const liste = await tts.byTag(opt('etiket'), { gender: g });
  const v = liste[Number(opt('sira', 0))];
  if (!v) (console.error(`"${opt('etiket')}" etiketli${g ? ' ' + opt('cinsiyet') : ''} ses yok (${liste.length} bulundu).`), process.exit(1));
  sesId = v.id;
  console.log(`Ses: ${v.id}${v.saved ? ' (kayıtlı)' : ''} — ${v.description}`);
}
const sonuc = [];
try {
  for (const [i, p] of parcalar.entries()) {
    const out = path.join(audioDir, `${ad}-${i + 1}.wav`);
    const r = await tts.synth({ text: p.text, voice: sesId, out });
    sonuc.push({ out, dur: r.dur });
    console.log(`[${i + 1}/${parcalar.length}] yazıldı: ${out} (${r.dur} sn)`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (tts.spawnedHere()) tts.stop(); // sayfa motoru açıksa (5181) ona dokunmaz
}
if (process.exitCode) process.exit(1);

const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
const prefix = `${ad}-`;
scene.audio = (scene.audio || []).filter((t) => !(t.file?.startsWith(prefix) && /^\d+\.wav$/.test(t.file.slice(prefix.length))));
let bitis = 0;
sonuc.forEach((s, i) => {
  const file = path.basename(s.out);
  const tr = { file, start: parcalar[i].start, offset: 0, dur: null, volume, fadeIn: 0, fadeOut: 0, mute: false };
  const env = zarfCikar(file, 30);
  if (env) tr.env = env;
  scene.audio.push(tr);
  bitis = Math.max(bitis, parcalar[i].start + s.dur);
});
fs.writeFileSync(sceneFile, JSON.stringify(scene, null, 2) + '\n');
const sure = scene.duration ?? scene.dur;
console.log(`ok — ${proje}: ${sonuc.length} ses izi eklendi, anlatım ${bitis.toFixed(1)} sn'de bitiyor` + (sure ? ` (sahne ${sure} sn)` : ''));
if (sure && bitis > sure) console.log('UYARI: anlatım sahne süresinden uzun — sahneyi uzat ya da metni kısalt.');
