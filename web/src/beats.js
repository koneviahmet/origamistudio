// S2 — Ritim algılama ve vuruş zamanları.

/**
 * Müzikten BPM ve ilk vuruşun konumunu tahmin eder.
 *  1. FFT spektral akı (log-genlik spektrumunun pozitif değişimi) = başlangıç (onset) zarfı
 *  2. Otokorelasyon + tarak skoru (periyodun 2, 3, 4 katı da güçlü olmalı) → kaba tempo
 *  3. Metrik düzey düzeltmesi (hızlı tempo yarısıyla eşit güçteyse yarısı)
 *  4. Tempo ± %3 ve faz üzerinde ince ızgara araması → kesin BPM ve ilk vuruş
 * @returns {{ bpm: number, beatOffset: number, confidence: number }}
 */
/** Yerinde, radix-2 karmaşık FFT (re, im uzunluğu 2'nin kuvveti) */
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
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/**
 * Spektral akı başlangıç zarfı: her karede log-genlik spektrumunun pozitif değişimlerinin toplamı.
 * Yeni bir nota / vuruş birçok frekans kutusunda aynı anda ani artış yaratır; yavaş genlik
 * dalgalanmaları (ped vurusu, fade) zayıf kalır.
 */
function spectralFlux(buffer, hop, win) {
  const chs = [...Array(buffer.numberOfChannels)].map((_, i) => buffer.getChannelData(i));
  const len = buffer.length;
  const n = Math.floor(len / hop);
  const bins = win / 2;
  const hann = Float32Array.from({ length: win }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (win - 1)));
  const re = new Float32Array(win);
  const im = new Float32Array(win);
  let prev = new Float32Array(bins);
  let cur = new Float32Array(bins);
  const flux = new Float32Array(n);
  const lin = new Float32Array(n); // doğrusal genlik akısı (vuruş güçlerini karşılaştırmak için)
  let prevL = new Float32Array(bins);
  let curL = new Float32Array(bins);
  // 30 Hz altı (DC, uğultu) hesaba katılmaz
  const k0 = Math.max(1, Math.round((30 * win) / buffer.sampleRate));
  for (let f = 0; f < n; f++) {
    const s0 = f * hop - win / 2;
    for (let i = 0; i < win; i++) {
      const j = s0 + i;
      let v = 0;
      if (j >= 0 && j < len) for (const c of chs) v += c[j];
      re[i] = (v / chs.length) * hann[i];
      im[i] = 0;
    }
    fft(re, im);
    let s = 0;
    let sl = 0;
    for (let k = k0; k < bins; k++) {
      const mag = Math.hypot(re[k], im[k]);
      cur[k] = Math.log1p(100 * mag);
      curL[k] = mag;
      const d = cur[k] - prev[k];
      if (d > 0) s += d;
      const dl = curL[k] - prevL[k];
      if (dl > 0) sl += dl;
    }
    flux[f] = f === 0 ? 0 : s;
    lin[f] = f === 0 ? 0 : sl;
    [prev, cur] = [cur, prev];
    [prevL, curL] = [curL, prevL];
  }
  return { flux, lin };
}

export function detectBeats(buffer, { minBpm = 70, maxBpm = 180 } = {}) {
  const sr = buffer.sampleRate;
  const hop = 512;
  const win = 1024;
  const n = Math.floor(buffer.length / hop);
  const { flux: env, lin } = spectralFlux(buffer, hop, win);
  // Yerel ortalamayı çıkar: yalnızca belirgin vuruşlar kalsın
  const W = 16;
  const loc = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += env[i] - (i >= W ? env[i - W] : 0);
    loc[i] = Math.max(0, env[i] - acc / Math.min(W, i + 1));
  }

  const fps = sr / hop;
  const minLag = Math.floor((60 / maxBpm) * fps);
  const maxLag = Math.ceil((60 / minBpm) * fps);
  const ac = new Float32Array(maxLag * 4 + 2);
  for (let lag = 1; lag < ac.length && lag < n; lag++) {
    let s = 0;
    for (let i = lag; i < n; i++) s += loc[i] * loc[i - lag];
    ac[lag] = s / (n - lag);
  }
  let best = minLag;
  let bestScore = -Infinity;
  const raw = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let m = 1; m <= 4; m++) s += (ac[lag * m] || 0) / m;
    raw[lag] = s;
    // 120 BPM civarını hafifçe tercih et (ikiye katlama / yarılama belirsizliğine karşı)
    const bpm = (60 * fps) / lag;
    s *= Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.2) ** 2);
    if (s > bestScore) {
      bestScore = s;
      best = lag;
    }
  }
  // Metrik düzey düzeltmesi. Tamsayı gecikmeyi parabolik olarak inceltip (pf), "vuruş" ve
  // "ara vuruş" konumlarının DOĞRUSAL güçlerini karşılaştırırız:
  //  - hızlı tempo (>150) + ara vuruşlar zayıf  → gerçek tempo yarısı (güçlü sekizlikler)
  //  - yavaş tempo (<100) + ara vuruşlar eşit    → gerçek tempo iki katı (eşit aralıklı vuruşlar)
  const a0 = raw[best - 1];
  const b0 = raw[best];
  const c0 = raw[best + 1];
  let pf = a0 != null && c0 != null && a0 - 2 * b0 + c0 !== 0 ? best + (0.5 * (a0 - c0)) / (a0 - 2 * b0 + c0) : best;
  const peak = (i) => Math.max(lin[i - 1] || 0, lin[i] || 0, lin[i + 1] || 0);
  /** period p'de, ara vuruşların (p/2 kaymış) ana vuruşlara oranı */
  const offRatio = (p) => {
    let bestOn = 0;
    let bestOff = 0;
    for (let ph = 0; ph < p; ph++) {
      let on = 0;
      let off = 0;
      for (let k = 0; ph + (k + 0.5) * p < n; k++) {
        on += peak(Math.round(ph + k * p));
        off += peak(Math.round(ph + (k + 0.5) * p));
      }
      if (on > bestOn) {
        bestOn = on;
        bestOff = off;
      }
    }
    return bestOn ? bestOff / bestOn : 1;
  };
  const bpmOf = (p) => (60 * fps) / p;
  if (bpmOf(pf) > 150 && pf * 2 <= maxLag + 1 && offRatio(pf * 2) < 0.6) pf *= 2;
  else if (bpmOf(pf) < 100 && bpmOf(pf / 2) <= maxBpm && offRatio(pf) >= 0.6) pf /= 2;
  best = Math.round(pf);

  // İnce ızgara: periyot ± %3, faz 0.25 kare adımla; skor = vuruş noktalarındaki zarf toplamı
  const at = (f) => {
    const i = Math.floor(f);
    const r = f - i;
    return (loc[i] || 0) * (1 - r) + (loc[i + 1] || 0) * r;
  };
  let bp = best;
  let bph = 0;
  let bs = -Infinity;
  for (let p = best * 0.97; p <= best * 1.03; p += 0.02) {
    for (let ph = 0; ph < p; ph += 0.25) {
      let s = 0;
      let c = 0;
      for (let k = ph; k < n - 1; k += p) {
        s += at(k);
        c++;
      }
      s /= c || 1;
      if (s > bs) {
        bs = s;
        bp = p;
        bph = ph;
      }
    }
  }
  let mean = 0;
  for (let i = 0; i < n; i++) mean += loc[i];
  mean = mean / n || 1;
  return {
    bpm: Math.round(((60 * fps) / bp) * 10) / 10,
    beatOffset: Math.round((bph / fps) * 1000) / 1000,
    confidence: Math.round(Math.min(1, bs / (mean * 4)) * 100) / 100,
  };
}

/**
 * İzin zaman çizelgesindeki vuruş zamanları (bpm tanımlıysa).
 * span: { start, offset, len, end } — audio.js trackSpan çıktısı
 */
export function beatTimes(tr, span) {
  if (!tr.bpm || !span || span.len <= 0) return [];
  const p = 60 / tr.bpm;
  // Dosyadaki ilk vuruşun, izin görünen başlangıcından sonraki ilk karşılığı
  const phase = ((((tr.beatOffset ?? 0) - span.offset) % p) + p) % p;
  const k0 = Math.round(((tr.beatOffset ?? 0) - span.offset - phase) / p); // ölçü sayacı için
  const out = [];
  for (let k = 0; k < 5000; k++) {
    const t = span.start + phase + k * p;
    if (t > span.end + 1e-6) break;
    out.push({ t: Math.round(t * 1000) / 1000, down: (((k - k0) % 4) + 4) % 4 === 0 });
  }
  return out;
}
