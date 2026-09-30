// Neşeli "çizim defteri" müziği (sentez, telifsiz): marimba melodisi + zıplayan bas + hafif tık ritmi. 96 BPM, 64 sn.
//   node scripts/gen-muzik-defter.mjs → data/audio/defter-neseli.wav
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'audio', 'defter-neseli.wav');
const SR = 32000, DUR = 64, BPM = 96, N = SR * DUR;
const beat = 60 / BPM;
const buf = new Float32Array(N);
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// C – Am – F – G, her akor 4 vuruş (iki ölçü = 8 vuruş döngü tekrarı)
const CHORDS = [
  { bass: 36, tones: [60, 64, 67, 72] },
  { bass: 33, tones: [57, 60, 64, 69] },
  { bass: 41, tones: [60, 65, 69, 72] },
  { bass: 43, tones: [59, 62, 67, 71] },
];
const add = (t0, len, fn) => {
  for (let i = Math.max(0, Math.floor(t0 * SR)); i < Math.min(N, Math.floor((t0 + len) * SR)); i++) buf[i] += fn(i / SR - t0);
};
const marimba = (t0, m, vel) => add(t0, 1.2, (t) => {
  const f = midi(m), env = Math.min(1, t / 0.004) * Math.exp(-t * 5.5);
  return vel * env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 18));
});
const bass = (t0, m, vel) => add(t0, 0.5, (t) => vel * Math.min(1, t / 0.006) * Math.exp(-t * 7) * Math.sin(2 * Math.PI * midi(m) * t));
const tick = (t0, vel) => add(t0, 0.05, (t) => vel * Math.exp(-t * 90) * (Math.sin(t * 9000 * 3.14) * 0.5 + (((t * 7919) % 1) - 0.5)));

const PAT = [0, 2, 1, 3, 2, 3, 1, 2]; // sekizlik desen (akor sesi indeksi)
const total = Math.floor(DUR / (beat / 2));
for (let k = 0; k < total; k++) {
  const t = k * (beat / 2) + 0.05;
  const bar = Math.floor(k / 8) % 4; // her 4 vuruş = 8 sekizlik
  const ch = CHORDS[bar];
  if (t > DUR - 2) break;
  const rest = k % 16 === 13;
  if (!rest) marimba(t, ch.tones[PAT[k % 8]] + (k % 16 >= 8 ? 12 : 0), 0.085 + (k % 4 === 0 ? 0.03 : 0));
  if (k % 2 === 0) bass(t, ch.bass + (k % 4 === 2 ? 12 : 0), 0.13);
  tick(t + (k % 2 ? 0 : 0), k % 2 ? 0.035 : 0.02);
}
// basit yankı
const D = Math.floor(beat * 0.75 * SR);
for (let i = D; i < N; i++) buf[i] += buf[i - D] * 0.22;

let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  buf[i] *= Math.min(1, t / 1) * Math.min(1, (DUR - t) / 3);
  peak = Math.max(peak, Math.abs(buf[i]));
}
const g = 0.707 / (peak || 1);
const out = Buffer.alloc(44 + N * 2);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 2, 4); out.write('WAVE', 8); out.write('fmt ', 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i] * g)) * 32767), 44 + i * 2);
fs.writeFileSync(OUT, out);
console.log(`Yazıldı: ${path.relative(ROOT, OUT)} (${(out.length / 1048576).toFixed(1)} MB, ${DUR} sn, ${BPM} BPM)`);
