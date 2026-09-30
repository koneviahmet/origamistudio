// Ses → animasyon köprüsü (saf, deterministik). Sahnenin `audio` izlerinden okur:
//   bpm / beatOffset  → vuruş fazı ve nabız (beat)
//   env               → frekans bandı seviyeleri (enerji); scripts/analyze-audio.mjs ya da stüdyodan "Zarf çıkar"
// Render sırasında ses çözülmez; her şey sahne JSON'undaki verilerden hesaplanır.
import { ENV_BANDS } from './envelope.js';

const BANDS = { hepsi: null, bas: [0, 1], orta: [2, 4], tiz: [5, 7] };
export const DRIVE_BANDS = [['hepsi', 'Hepsi'], ['bas', 'Bas'], ['orta', 'Orta'], ['tiz', 'Tiz']];

function tracks(scene) {
  return (scene.audio || []).filter((tr) => tr.file && !tr.mute);
}

/** t anındaki vuruş: { phase: 0..1 (vuruştan beri), pulse: 1→0 (vuruşta 1, sonra söner), index, down } */
export function beatAt(scene, t, sharp = 5) {
  for (const tr of tracks(scene)) {
    if (!tr.bpm) continue;
    const start = tr.start ?? 0;
    if (t < start) continue;
    if (tr.dur != null && t > start + tr.dur) continue;
    const p = 60 / tr.bpm;
    const x = (t - start + (tr.offset ?? 0) - (tr.beatOffset ?? 0)) / p;
    const idx = Math.floor(x);
    const phase = x - idx;
    return { phase, pulse: Math.exp(-phase * sharp), index: idx, down: (((idx % 4) + 4) % 4) === 0 };
  }
  return { phase: 0, pulse: 0, index: 0, down: false };
}

function frameVal(env, f, bands) {
  const fr = Math.max(0, Math.min(Math.floor(env.data.length / env.bands) - 1, f));
  let s = 0;
  let n = 0;
  const [a, b] = bands || [0, env.bands - 1];
  for (let j = a; j <= b; j++) {
    s += env.data[fr * env.bands + j] || 0;
    n++;
  }
  return n ? s / n : 0;
}

/** t anındaki ses seviyesi 0..1 (band: hepsi | bas | orta | tiz). Zarf yoksa vuruş nabzına düşer. */
export function energyAt(scene, t, band = 'hepsi') {
  let best = 0;
  let any = false;
  for (const tr of tracks(scene)) {
    const env = tr.env;
    if (!env?.data?.length) continue;
    const local = t - (tr.start ?? 0) + (tr.offset ?? 0) - (tr.envFrom ?? 0);
    if (local < 0) continue;
    any = true;
    const x = local * env.fps;
    const f = Math.floor(x);
    const k = x - f;
    const bs = BANDS[band] || null;
    const v = frameVal(env, f, bs) * (1 - k) + frameVal(env, f + 1, bs) * k;
    best = Math.max(best, v * (tr.volume ?? 1) ** 0.25);
  }
  return any ? best : beatAt(scene, t).pulse * 0.6;
}

/** Dalga formu katmanı için t anındaki bant seviyeleri (n çubuk, 0..1) */
export function spectrumAt(scene, t, n) {
  const out = new Array(n).fill(0);
  let any = false;
  for (const tr of tracks(scene)) {
    const env = tr.env;
    if (!env?.data?.length) continue;
    const local = t - (tr.start ?? 0) + (tr.offset ?? 0) - (tr.envFrom ?? 0);
    if (local < 0) continue;
    any = true;
    const x = local * env.fps;
    const f = Math.floor(x);
    const k = x - f;
    for (let i = 0; i < n; i++) {
      // çubuklar bantlara dağıtılır, komşu bantlar arasında doğrusal geçiş
      const bp = (i / Math.max(1, n - 1)) * (env.bands - 1);
      const b0 = Math.floor(bp);
      const b1 = Math.min(env.bands - 1, b0 + 1);
      const bk = bp - b0;
      const g = (fr, b) => env.data[Math.max(0, Math.min(Math.floor(env.data.length / env.bands) - 1, fr)) * env.bands + b] || 0;
      const v0 = g(f, b0) * (1 - bk) + g(f, b1) * bk;
      const v1 = g(f + 1, b0) * (1 - bk) + g(f + 1, b1) * bk;
      out[i] = Math.max(out[i], v0 * (1 - k) + v1 * k);
    }
  }
  if (!any) {
    // Zarf yok: vuruşa bağlı sahte ama deterministik görünüm
    const b = beatAt(scene, t);
    for (let i = 0; i < n; i++) out[i] = b.pulse * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + b.index * 2.3))) * 0.9 + 0.05;
  }
  return out;
}

/** Ön ayarların env.audio'su */
export function audioApi(scene) {
  return { beat: (t, sharp) => beatAt(scene, t, sharp), energy: (t, band) => energyAt(scene, t, band) };
}

export { ENV_BANDS };
