// Ses: çözme (decode) önbelleği, stüdyoda senkron çalma, dalga formu ve dışa aktarım karışımı.
//
// Sahnede: "audio": [{ "file": "uzay-ambiyans.wav", "start": 0, "offset": 0, "dur": null,
//                      "volume": 0.8, "fadeIn": 1.5, "fadeOut": 2, "mute": false }]
//   start  : zaman çizelgesindeki başlangıç (sn)
//   offset : dosyanın içinden kaç sn sonra başlasın (kırpma)
//   dur    : en fazla kaç sn çalsın (boş: dosya / video bitene kadar)

import { sfxEvents, scheduleSfx } from './sfx.js';

let actx = null;
const buffers = new Map();
const peakCache = new Map();

// Çıkış sınırlayıcısı: müzik + efektler üst üste binince taşmasın (bağlam başına bir tane)
const masters = new WeakMap();
export function master(ctx) {
  let m = masters.get(ctx);
  if (!m) {
    m = ctx.createDynamicsCompressor();
    m.threshold.value = -3;
    m.knee.value = 3;
    m.ratio.value = 20;
    m.attack.value = 0.002;
    m.release.value = 0.2;
    // Yumuşak kırpıcı: 0.8'e kadar doğrusal, üstü tanh ile 1.0'a yaklaşır (±2 girişe kadar)
    const pre = ctx.createGain();
    pre.gain.value = 0.5;
    const shaper = ctx.createWaveShaper();
    const N = 4096;
    const curve = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = ((i / (N - 1)) * 2 - 1) * 2;
      const a = Math.abs(x);
      curve[i] = Math.sign(x) * (a <= 0.8 ? a : 0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
    }
    shaper.curve = curve;
    m.connect(pre).connect(shaper).connect(ctx.destination);
    masters.set(ctx, m);
  }
  return m;
}

export function audioCtx() {
  actx ||= new AudioContext();
  return actx;
}

export function loadAudio(file) {
  if (!buffers.has(file)) {
    const p = fetch(`/audio-files/${encodeURIComponent(file)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Ses dosyası yüklenemedi: ${file}`);
        return r.arrayBuffer();
      })
      .then((ab) => audioCtx().decodeAudioData(ab))
      .then((b) => ((b.__file = file), b));
    p.catch(() => buffers.delete(file));
    buffers.set(file, p);
  }
  return buffers.get(file);
}

export function forgetAudio(file) {
  buffers.delete(file);
  for (const k of peakCache.keys()) if (k.startsWith(`${file}|`)) peakCache.delete(k);
}

/** İzin zaman çizelgesindeki aralığı */
export function trackSpan(tr, buffer, sceneDur) {
  const start = tr.start ?? 0;
  const offset = Math.max(0, tr.offset ?? 0);
  const len = Math.max(0, Math.min(buffer.duration - offset, tr.dur ?? Infinity, sceneDur - start));
  return { start, offset, len, end: start + len };
}

/** Dalga formu için tepe değerleri (0..1), n parça */
export function peaks(buffer, offset, len, n) {
  const key = `${buffer.length}|${offset}|${len}|${n}`;
  const cacheKey = `${buffer.__file || ''}|${key}`;
  if (peakCache.has(cacheKey)) return peakCache.get(cacheKey);
  const sr = buffer.sampleRate;
  const a = Math.floor(offset * sr);
  const b = Math.min(buffer.length, Math.floor((offset + len) * sr));
  const ch = [...Array(buffer.numberOfChannels)].map((_, i) => buffer.getChannelData(i));
  const out = new Float32Array(n);
  const step = Math.max(1, Math.floor((b - a) / n));
  for (let i = 0; i < n; i++) {
    let m = 0;
    const s0 = a + i * step;
    for (let j = s0; j < Math.min(b, s0 + step); j += 16) {
      for (const c of ch) m = Math.max(m, Math.abs(c[j]));
    }
    out[i] = m;
  }
  peakCache.set(cacheKey, out);
  return out;
}

/** Ses zarfını (seviye + fade) zaman çizelgesi → gerçek zaman dönüşümüyle planlar */
function scheduleGain(param, tr, span, tl, now, speed) {
  const vol = tr.volume ?? 1;
  const fi = Math.max(0, tr.fadeIn ?? 0);
  const fo = Math.max(0, tr.fadeOut ?? 0);
  const v = (tau) => {
    let k = vol;
    if (fi > 0) k *= Math.min(1, Math.max(0, (tau - span.start) / fi));
    if (fo > 0) k *= Math.min(1, Math.max(0, (span.end - tau) / fo));
    return k;
  };
  const real = (tau) => now + (tau - tl) / speed;
  const from = Math.max(tl, span.start);
  param.setValueAtTime(v(from), real(from));
  const pts = [span.start + fi, span.end - fo, span.end].filter((tau) => tau > from).sort((x, y) => x - y);
  for (const tau of pts) param.linearRampToValueAtTime(v(tau), real(tau));
}

/** Stüdyo çalıcısı: oynatma başlayınca ses izlerini doğru noktadan başlatır */
export class AudioPlayer {
  constructor() {
    this.nodes = [];
    this.token = 0;
  }

  /** getTime: yükleme bittiğinde güncel zamanı okumak için fonksiyon */
  async play(scene, getTime, speed = 1) {
    this.stop();
    const token = ++this.token;
    const tracks = (scene.audio || []).filter((tr) => tr.file && !tr.mute);
    const events = sfxEvents(scene);
    if (!tracks.length && !events.length) return;
    const ctx = audioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    const loaded = await Promise.all(tracks.map((tr) => loadAudio(tr.file).catch(() => null)));
    await Promise.all([...new Set(events.map((e) => e.file))].map((f) => loadAudio(f).catch(() => null)));
    if (token !== this.token) return; // bu arada durduruldu
    const tl = getTime();
    const now = ctx.currentTime + 0.03;
    tracks.forEach((tr, i) => {
      const b = loaded[i];
      if (!b) return;
      const span = trackSpan(tr, b, scene.duration);
      if (span.len <= 0 || tl >= span.end) return;
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.playbackRate.value = speed;
      const g = ctx.createGain();
      src.connect(g).connect(master(ctx));
      scheduleGain(g.gain, tr, span, tl, now, speed);
      const from = Math.max(tl, span.start);
      src.start(now + (from - tl) / speed, span.offset + (from - span.start), span.end - from);
      this.nodes.push(src);
    });
    const fx = await scheduleSfx(ctx, events, tl, now, speed);
    if (token !== this.token) fx.forEach((n) => n.stop());
    else this.nodes.push(...fx);
  }

  stop() {
    this.token++;
    for (const n of this.nodes) {
      try {
        n.stop();
      } catch {
        /* zaten durmuş */
      }
    }
    this.nodes = [];
  }
}

/** Dışa aktarım için sahnenin sesini [from, to] aralığında stereo olarak karıştırır. */
export async function renderMix(scene, from, to, sampleRate = 48000) {
  const tracks = (scene.audio || []).filter((tr) => tr.file && !tr.mute);
  const events = sfxEvents(scene);
  if (!tracks.length && !events.length) return null;
  const length = Math.max(1, Math.ceil((to - from) * sampleRate));
  const off = new OfflineAudioContext(2, length, sampleRate);
  let any = false;
  for (const tr of tracks) {
    const b = await loadAudio(tr.file);
    const span = trackSpan(tr, b, scene.duration);
    if (span.len <= 0 || span.end <= from || span.start >= to) continue;
    const src = off.createBufferSource();
    src.buffer = b;
    const g = off.createGain();
    src.connect(g).connect(master(off));
    scheduleGain(g.gain, tr, span, from, 0, 1);
    const f = Math.max(from, span.start);
    src.start(f - from, span.offset + (f - span.start), span.end - f);
    any = true;
  }
  const fx = await scheduleSfx(off, events, from, 0, 1, to);
  if (fx.length) any = true;
  return any ? off.startRendering() : null;
}
