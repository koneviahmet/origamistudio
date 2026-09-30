// Telifsiz örnek müzik üretir (tamamen sentez): yumuşak akor pedi + arpej + yankı.
//   node scripts/gen-audio.js  → data/audio/uzay-ambiyans.wav
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'audio', 'uzay-ambiyans.wav');
const SR = 32000;
const DUR = 64;
const N = SR * DUR;
const buf = new Float32Array(N);

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
// Cmaj7 → Am7 → Fmaj7 → G6 (her biri 8 sn), iki tur
const CHORDS = [
  [48, 52, 55, 59],
  [45, 48, 52, 55],
  [41, 45, 48, 52],
  [43, 47, 50, 52],
];
const CH = 8;

// Ped: her akor için yumuşak açılıp kapanan detune'lu sinüsler
for (let c = 0; c < DUR / CH; c++) {
  const notes = CHORDS[c % CHORDS.length];
  const t0 = c * CH - 1.5;
  const t1 = t0 + CH + 3;
  for (const m of notes) {
    for (const det of [-0.0018, 0.0018]) {
      const f = midi(m) * (1 + det);
      for (let i = Math.max(0, Math.floor(t0 * SR)); i < Math.min(N, Math.floor(t1 * SR)); i++) {
        const t = i / SR;
        const a = Math.min(1, (t - t0) / 2.2) * Math.min(1, (t1 - t) / 2.2);
        const ph = 2 * Math.PI * f * t;
        buf[i] += a * 0.05 * (Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph));
      }
    }
  }
}

// Arpej: akor notaları iki oktav yukarıda, deterministik desen
const PATTERN = [0, 2, 1, 3, 2, 1, 3, 0];
const arp = new Float32Array(N);
for (let k = 0; k * 0.5 < DUR - 2; k++) {
  const t0 = k * 0.5 + 0.25;
  const chord = CHORDS[Math.floor(t0 / CH) % CHORDS.length];
  if (k % 16 === 15) continue; // nefes payı
  const f = midi(chord[PATTERN[k % PATTERN.length]] + 24);
  const vel = 0.05 + ((k * 7) % 5) * 0.006;
  for (let i = Math.floor(t0 * SR); i < Math.min(N, Math.floor((t0 + 1.4) * SR)); i++) {
    const t = i / SR - t0;
    const env = Math.min(1, t / 0.008) * Math.exp(-t * 3.2);
    const ph = 2 * Math.PI * f * t;
    arp[i] += vel * env * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) * Math.exp(-t * 6));
  }
}
// Yankı (geri beslemeli gecikme)
const D = Math.floor(0.25 * SR); // sekizlik yankı (120 BPM ızgarasına oturur)
for (let i = D; i < N; i++) arp[i] += arp[i - D] * 0.38;
for (let i = 0; i < N; i++) buf[i] += arp[i];

// Master: giriş/çıkış solması + normalize (-3 dBFS)
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  buf[i] *= Math.min(1, t / 1.5) * Math.min(1, (DUR - t) / 3);
  peak = Math.max(peak, Math.abs(buf[i]));
}
const g = 0.707 / (peak || 1);

const out = Buffer.alloc(44 + N * 2);
out.write('RIFF', 0);
out.writeUInt32LE(36 + N * 2, 4);
out.write('WAVE', 8);
out.write('fmt ', 12);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(1, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 2, 28);
out.writeUInt16LE(2, 32);
out.writeUInt16LE(16, 34);
out.write('data', 36);
out.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i] * g)) * 32767), 44 + i * 2);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`Yazıldı: ${path.relative(ROOT, OUT)} (${(out.length / 1048576).toFixed(1)} MB, ${DUR} sn)`);
