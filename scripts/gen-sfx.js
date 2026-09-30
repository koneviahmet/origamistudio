// Telifsiz ses efektleri üretir (tamamen sentez) → data/audio/sfx-*.wav
//   node scripts/gen-sfx.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'audio');
const SR = 44100;

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function wav(file, data) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = 0.89 / (peak || 1);
  const n = data.length;
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 2, 4);
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
  out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * g)) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(DIR, file), out);
  return out.length;
}

// Tek kutuplu alçak / yüksek geçiren filtreler (kesim frekansı zamanla değişebilir)
function lowpass(x, fc) {
  const y = new Float32Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const f = typeof fc === 'function' ? fc(i / SR) : fc;
    const a = 1 - Math.exp((-2 * Math.PI * f) / SR);
    s += a * (x[i] - s);
    y[i] = s;
  }
  return y;
}
function highpass(x, fc) {
  const lp = lowpass(x, fc);
  return x.map((v, i) => v - lp[i]);
}
const noise = (sec) => Float32Array.from({ length: Math.floor(sec * SR) }, rnd);
const env = (x, fn) => x.map((v, i) => v * fn(i / SR));

const SFX = {
  // Kağıt katlama: çıtırtılı gürültü patlaması + hafif tok vuruş
  'sfx-kagit-katla.wav': () => {
    const n = noise(0.38);
    const crackle = n.map((v, i) => v * (Math.abs(rnd()) > 0.93 ? 3 : 0.35));
    const body = env(highpass(lowpass(crackle, 5200), 700), (t) => Math.min(1, t / 0.01) * Math.exp(-t * 11));
    const thump = Float32Array.from({ length: body.length }, (_, i) => {
      const t = i / SR;
      return Math.sin(2 * Math.PI * (140 - 60 * t) * t) * Math.exp(-t * 28) * 0.5;
    });
    return body.map((v, i) => v + thump[i]);
  },
  // Kağıt hışırtısı: yavaş kabaran, bant sınırlı gürültü
  'sfx-hisirti.wav': () => {
    const n = noise(0.65).map((v) => v * (0.6 + 0.4 * Math.abs(rnd())));
    return env(highpass(lowpass(n, (t) => 2500 + 2500 * Math.sin(Math.PI * t / 0.65)), 900), (t) => Math.sin(Math.PI * Math.min(1, t / 0.65)) ** 1.5);
  },
  // Pop: hızlı aşağı kayan sinüs
  'sfx-pop.wav': () =>
    Float32Array.from({ length: Math.floor(0.16 * SR) }, (_, i) => {
      const t = i / SR;
      const f = 300 + 700 * Math.exp(-t * 40);
      return Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.002) * Math.exp(-t * 26);
    }),
  // Vınlama (whoosh): kesim frekansı gezinen gürültü
  'sfx-whoosh.wav': () => {
    const d = 0.75;
    const n = noise(d);
    const f = (t) => 400 + 3200 * Math.sin(Math.PI * t / d) ** 2;
    return env(highpass(lowpass(n, f), 250), (t) => Math.sin(Math.PI * t / d) ** 2);
  },
  // Çınlama: çan kısmi frekansları
  'sfx-cin.wav': () =>
    Float32Array.from({ length: Math.floor(1.4 * SR) }, (_, i) => {
      const t = i / SR;
      const a = Math.min(1, t / 0.003);
      return a * (Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 3) + 0.5 * Math.sin(2 * Math.PI * 1980 * t) * Math.exp(-t * 4.5) + 0.25 * Math.sin(2 * Math.PI * 3150 * t) * Math.exp(-t * 7));
    }),
  // Tık: kısa filtreli dürtü
  'sfx-tik.wav': () => env(highpass(noise(0.07), 1800), (t) => Math.exp(-t * 90)),
  // Damla: yukarı kayan sinüs
  'sfx-damla.wav': () =>
    Float32Array.from({ length: Math.floor(0.3 * SR) }, (_, i) => {
      const t = i / SR;
      const f = 500 + 1100 * (1 - Math.exp(-t * 25));
      return Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.003) * Math.exp(-t * 14);
    }),
  // Pırıltı: rastgele zamanlı küçük yüksek pingler
  'sfx-parilti.wav': () => {
    const d = 1.0;
    const out = new Float32Array(Math.floor(d * SR));
    for (let k = 0; k < 9; k++) {
      const t0 = (k / 9) * 0.6 + Math.abs(rnd()) * 0.05;
      const f = 2400 + Math.abs(rnd()) * 2600;
      for (let i = Math.floor(t0 * SR); i < out.length; i++) {
        const t = i / SR - t0;
        out[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 16) * (0.6 + 0.4 * Math.abs(rnd()));
      }
    }
    return env(out, (t) => Math.min(1, (d - t) / 0.2));
  },
};

fs.mkdirSync(DIR, { recursive: true });
for (const [file, fn] of Object.entries(SFX)) {
  const bytes = wav(file, fn());
  console.log(`✓ ${file.padEnd(22)} ${(bytes / 1024).toFixed(0)} KB`);
}
