// S3 — Otomatik ses efektleri.
// scene.sfx = { auto: true, volume: 0.7 } — ön ayarlardan, geçişlerden ve patlamalardan efekt üretir.
// Katman: "sfx": false → o katman sessiz. anims[i].sfx / textAnims[i].sfx / transitions[i].sfx:
//   false → bu olay sessiz, "sfx-pop.wav" → başka dosya.
import { loadAudio, master } from './audio.js';
import { PRESETS } from './engine/presets.js';
import { TEXT_ANIMS } from './engine/textanims.js';
import { TRANSITIONS } from './engine/transitions.js';

const A = (file, vol = 0.6, at = 0) => ({ file, vol, at });

export const SFX_FILES = [
  'sfx-kagit-katla.wav', 'sfx-hisirti.wav', 'sfx-pop.wav', 'sfx-whoosh.wav',
  'sfx-cin.wav', 'sfx-tik.wav', 'sfx-damla.wav', 'sfx-parilti.wav',
];

// at: efektin, animasyon süresinin hangi oranında çalacağı (ör. düşüşte ilk sekme ≈ %36)
const LAYER_SFX = {
  'katlanarak-gir': A('sfx-kagit-katla.wav', 0.8),
  'katlanarak-cik': A('sfx-kagit-katla.wav', 0.6),
  'zipla-gir': A('sfx-pop.wav', 0.55, 0.05),
  'donerek-gir': A('sfx-whoosh.wav', 0.45),
  'kayarak-gir': A('sfx-whoosh.wav', 0.4),
  'ekrana-gir': A('sfx-whoosh.wav', 0.55),
  'kayarak-cik': A('sfx-whoosh.wav', 0.35),
  'ekrandan-cik': A('sfx-whoosh.wav', 0.5),
  gec: A('sfx-whoosh.wav', 0.45),
  'dusup-gir': A('sfx-tik.wav', 0.7, 0.36),
  belir: A('sfx-parilti.wav', 0.3),
  dal: A('sfx-damla.wav', 0.6, 0.35),
  'kuculerek-cik': A('sfx-pop.wav', 0.35, 0.3),
};
const TEXT_SFX = {
  'harf-katla': A('sfx-hisirti.wav', 0.4),
  'harf-zipla': A('sfx-hisirti.wav', 0.3),
  'harf-dus': A('sfx-tik.wav', 0.4, 0.25),
  'harf-don': A('sfx-hisirti.wav', 0.35),
  'kelime-zipla': A('sfx-pop.wav', 0.45),
  'satir-kay': A('sfx-whoosh.wav', 0.3),
  'harf-dagil': A('sfx-hisirti.wav', 0.4),
  'harf-katla-cik': A('sfx-hisirti.wav', 0.35),
};
const TRANSITION_SFX = {
  katlama: A('sfx-kagit-katla.wav', 0.8),
  perde: A('sfx-hisirti.wav', 0.7),
  iris: A('sfx-whoosh.wav', 0.5),
  yirtik: A('sfx-hisirti.wav', 0.8),
  'sayfa-cevir': A('sfx-hisirti.wav', 0.7),
  kaydir: A('sfx-whoosh.wav', 0.6),
  yakinlas: A('sfx-whoosh.wav', 0.5),
};

/** Sahneden otomatik efekt olaylarını çıkarır: [{ file, t, vol }] */
export function sfxEvents(scene) {
  const cfg = scene.sfx;
  if (!cfg?.auto) return [];
  const master = cfg.volume ?? 0.7;
  const ev = [];
  const push = (m, t0, dur, override) => {
    if (override === false || !m) return;
    const file = typeof override === 'string' ? override : m.file;
    ev.push({ file, t: t0 + (m.at || 0) * (dur || 0), vol: m.vol * master });
  };
  for (const l of scene.layers || []) {
    if (l.sfx === false || l.hidden) continue;
    for (const a of l.anims || []) if (!a.off) push(LAYER_SFX[a.preset], a.t ?? 0, a.dur ?? PRESETS[a.preset]?.dur, a.sfx);
    for (const a of l.textAnims || []) if (!a.off) push(TEXT_SFX[a.preset], a.t ?? 0, a.dur ?? TEXT_ANIMS[a.preset]?.dur, a.sfx);
    // fold keyframe'leri: 0'dan açılma anı
    if (Array.isArray(l.fold) && l.fold.length > 1 && l.fold[0].v === 0 && l.fold[1].v > 0) {
      push(A('sfx-kagit-katla.wav', 0.6), l.fold[0].t, 0);
    }
    if (l.type === 'particles' && l.mode === 'patlama') {
      push(A('sfx-pop.wav', 0.6), l.start ?? 0, 0);
      push(A('sfx-parilti.wav', 0.45), (l.start ?? 0) + 0.05, 0);
    }
  }
  for (const tr of scene.transitions || []) {
    if (tr.off || !TRANSITIONS[tr.type]) continue;
    const snap = TRANSITIONS[tr.type].kind === 'snap';
    const d = tr.dur ?? TRANSITIONS[tr.type].dur;
    push(TRANSITION_SFX[tr.type], snap ? tr.t : tr.t - d / 2, 0, tr.sfx);
  }
  // Seyrelt: aynı dosya 0.12 sn içinde tekrarlanmasın; 0.15 sn'lik pencerede en fazla 4 olay
  ev.sort((a, b) => a.t - b.t);
  const out = [];
  for (const e of ev) {
    if (e.t < 0 || e.t > scene.duration) continue;
    if (out.some((o) => o.file === e.file && Math.abs(o.t - e.t) < 0.12)) continue;
    if (out.filter((o) => e.t - o.t < 0.15).length >= 4) continue;
    out.push(e);
  }
  return out;
}

/** Efekt olaylarını bir ses bağlamına planlar (canlı ya da çevrimdışı). tl: şimdiki zaman çizelgesi anı */
export async function scheduleSfx(ctx, events, tl, now, speed = 1, until = Infinity) {
  const nodes = [];
  const bufs = new Map();
  await Promise.all([...new Set(events.map((e) => e.file))].map(async (f) => bufs.set(f, await loadAudio(f).catch(() => null))));
  for (const e of events) {
    if (e.t < tl || e.t > until) continue;
    const b = bufs.get(e.file);
    if (!b) continue;
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = speed;
    const g = ctx.createGain();
    g.gain.value = e.vol;
    src.connect(g).connect(master(ctx));
    src.start(now + (e.t - tl) / speed);
    nodes.push(src);
  }
  return nodes;
}
