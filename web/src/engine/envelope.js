// Ses zarfı analizi (saf; tarayıcıda ve Node'da çalışır).
// Sesten kare başına 8 frekans bandında seviye çıkarır: sahnede `audio[i].env` olarak saklanır ve
// ritme / sese bağlı animasyonlar (audiodrive.js) ile dalga formu katmanı bunu okur.
// Çıktı deterministiktir — render sırasında ses çözmeye gerek kalmaz.
export const ENV_BANDS = 8;
// Bant kenarları (Hz): bas ............ tiz
const EDGES = [30, 70, 140, 280, 560, 1400, 3500, 7000, 14000];

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const ang = (-2 * Math.PI) / size;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += size) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < size / 2; j++) {
        const a = i + j;
        const b = a + size / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/**
 * @param {Float32Array} mono  tek kanal örnekler
 * @param {number} sampleRate
 * @param {{fps?: number, from?: number, len?: number}} o  from/len: dosyadan kesit (sn)
 * @returns {{fps: number, bands: number, data: number[]}}  data: kare-major düz dizi (0..1, 2 hane)
 */
export function analyzeEnvelope(mono, sampleRate, { fps = 30, from = 0, len = Infinity } = {}) {
  const N = 1024;
  const a = Math.max(0, Math.floor(from * sampleRate));
  const b = Math.min(mono.length, Math.floor((from + len) * sampleRate));
  const frames = Math.max(1, Math.floor(((b - a) / sampleRate) * fps));
  const hop = sampleRate / fps;
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  const binHz = sampleRate / N;
  const band = new Int8Array(N / 2).fill(-1);
  for (let k = 1; k < N / 2; k++) {
    const hz = k * binHz;
    for (let j = 0; j < ENV_BANDS; j++) if (hz >= EDGES[j] && hz < EDGES[j + 1]) band[k] = j;
  }
  const raw = new Float32Array(frames * ENV_BANDS);
  for (let f = 0; f < frames; f++) {
    const c = a + Math.floor(f * hop) - N / 2 + Math.floor(hop / 2);
    for (let i = 0; i < N; i++) {
      const idx = c + i;
      re[i] = idx >= 0 && idx < mono.length ? mono[idx] * win[i] : 0;
      im[i] = 0;
    }
    fft(re, im);
    const sum = new Float32Array(ENV_BANDS);
    const cnt = new Float32Array(ENV_BANDS);
    for (let k = 1; k < N / 2; k++) {
      const j = band[k];
      if (j < 0) continue;
      sum[j] += Math.hypot(re[k], im[k]);
      cnt[j]++;
    }
    for (let j = 0; j < ENV_BANDS; j++) raw[f * ENV_BANDS + j] = cnt[j] ? sum[j] / cnt[j] : 0;
  }
  // Bant başına normalleştir (95. yüzdelik → 1), karekök sıkıştırma, hızlı atak / yavaş sönüm
  const data = new Array(frames * ENV_BANDS);
  for (let j = 0; j < ENV_BANDS; j++) {
    const col = [];
    for (let f = 0; f < frames; f++) col.push(raw[f * ENV_BANDS + j]);
    const sorted = [...col].sort((x, y) => x - y);
    const ref = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1] || 1e-9;
    let prev = 0;
    for (let f = 0; f < frames; f++) {
      let v = Math.min(1.2, Math.sqrt(col[f] / Math.max(ref, 1e-9)));
      v = v > prev ? v : prev + (v - prev) * 0.35;
      prev = v;
      data[f * ENV_BANDS + j] = Math.round(Math.min(1, v) * 100) / 100;
    }
  }
  return { fps, bands: ENV_BANDS, data };
}

/** AudioBuffer benzeri ({numberOfChannels, getChannelData, sampleRate}) nesneden mono karışım */
export function monoOf(buf) {
  const ch = buf.numberOfChannels;
  const n = buf.length;
  const out = new Float32Array(n);
  for (let c = 0; c < ch; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += d[i] / ch;
  }
  return out;
}
