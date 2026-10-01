// Reels şablonları için vuruşlu (sentez, telifsiz) ritim parçaları. İlk vuruş t=0'da; beatOffset = 0.
//   node scripts/gen-ritim.mjs            → data/audio/ritim-*.wav (pop-120, house-126, trap-140, lofi-90, hype-132)
//   node scripts/gen-ritim.mjs pop-120    → yalnızca biri
// Parçalar 64 sn sürer (müzik şablonda fade-out ile biter); 8 ölçüde bir kısa "boşluk + yükseliş" (breakdown) vardır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'data', 'audio');
const SR = 32000;
const DUR = 64;
const N = SR * DUR;
const TAU = Math.PI * 2;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

// ─── Stil tanımları ──────────────────────────────────────────────────────────
// prog: ölçü başına [bas notası, akor sesleri]; desen: 16'lıkta arpej indeksleri
const STILLER = {
  'pop-120': {
    bpm: 120, swing: 0, kick: [0, 4, 8, 12], clap: [4, 12], hat: 'off', hatVel: 0.5, bassStil: 'zipla', lead: 'pluck', leadOct: 12,
    prog: [[45, [57, 60, 64]], [41, [53, 57, 60]], [48, [55, 60, 64]], [43, [55, 59, 62]]], desen: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 3, 2, 1, 0, 1], drive: 1,
  },
  'house-126': {
    bpm: 126, swing: 0, kick: [0, 4, 8, 12], clap: [4, 12], hat: 'open', hatVel: 0.55, bassStil: 'pompa', lead: 'stab', leadOct: 12,
    prog: [[38, [62, 65, 69]], [38, [62, 65, 69]], [34, [58, 62, 65]], [36, [60, 64, 67]]], desen: [0, -1, -1, 1, -1, -1, 2, -1, 0, -1, -1, 1, -1, 2, -1, -1], drive: 1,
  },
  'trap-140': {
    bpm: 140, swing: 0, kick: [0, 7, 10], clap: [8], hat: 'trap', hatVel: 0.45, bassStil: '808', lead: 'bell', leadOct: 12,
    prog: [[33, [57, 60, 64]], [33, [57, 60, 64]], [29, [53, 57, 60]], [31, [55, 59, 62]]], desen: [0, -1, 1, -1, -1, 2, -1, 1, 0, -1, 2, -1, 1, -1, -1, -1], drive: 1,
  },
  'lofi-90': {
    bpm: 90, swing: 0.18, kick: [0, 10], clap: [4, 12], hat: 'lofi', hatVel: 0.35, bassStil: 'yumusak', lead: 'keys', leadOct: 0,
    prog: [[41, [60, 64, 67, 71]], [43, [59, 62, 67, 69]], [45, [60, 64, 67, 72]], [40, [59, 64, 67, 71]]], desen: [0, -1, 1, -1, 2, -1, -1, 3, 1, -1, 2, -1, 0, -1, 3, -1], drive: 0.5,
  },
  'hype-132': {
    bpm: 132, swing: 0, kick: [0, 4, 8, 12], clap: [4, 12], hat: 'sekizlik', hatVel: 0.5, bassStil: 'pompa', lead: 'saw', leadOct: 12,
    prog: [[40, [64, 67, 71]], [36, [60, 64, 67]], [43, [62, 67, 71]], [38, [62, 66, 69]]], desen: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 2, 1], drive: 1.15,
  },
};

function uret(ad, st) {
  seed = 1234567;
  const buf = new Float32Array(N);
  const duck = new Float32Array(N).fill(1); // kick yan-zincir (sidechain) zarfı
  const beat = 60 / st.bpm;
  const s16 = beat / 4;
  const t16 = (k) => k * s16 + (k % 2 ? st.swing * s16 : 0);
  const mix = (t0, len, fn, g = 1, bus = buf) => {
    const a = Math.max(0, Math.floor(t0 * SR));
    const b = Math.min(N, Math.floor((t0 + len) * SR));
    for (let i = a; i < b; i++) bus[i] += g * fn(i / SR - t0);
  };

  const kick = (t0, v = 1) => {
    mix(t0, 0.45, (t) => {
      const f = 48 + 120 * Math.exp(-t * 28);
      return Math.sin(TAU * f * t) * Math.exp(-t * 7.5) + 0.35 * Math.exp(-t * 90) * rnd();
    }, 0.95 * v);
    // yan-zincir: kick sonrası 0.18 sn içinde diğer katmanlar kısılır
    const a = Math.floor(t0 * SR);
    for (let i = a; i < Math.min(N, a + Math.floor(0.2 * SR)); i++) duck[i] = Math.min(duck[i], 0.25 + 0.75 * Math.pow((i - a) / (0.2 * SR), 0.7));
  };
  const clap = (t0, v = 1) => {
    for (let k = 0; k < 3; k++) mix(t0 + k * 0.011, 0.05, (t) => rnd() * Math.exp(-t * 90), 0.28 * v);
    mix(t0 + 0.033, 0.22, (t) => rnd() * Math.exp(-t * 17), 0.2 * v);
  };
  const hat = (t0, v = 0.5, open = false) => {
    let p = 0;
    mix(t0, open ? 0.14 : 0.04, (t) => {
      const x = rnd();
      const y = x - p; // yüksek geçiren
      p = x;
      return y * Math.exp(-t * (open ? 22 : 130));
    }, 0.32 * v);
  };
  const bass = (t0, m, len, stil, v = 1) => {
    const f = midi(m);
    let lp = 0;
    mix(t0, len, (t) => {
      const env = Math.min(1, t / 0.005) * Math.exp(-t * (stil === '808' ? 1.8 : stil === 'yumusak' ? 4 : 5.5));
      const sub = Math.sin(TAU * f * t);
      if (stil === '808') return Math.tanh(sub * 2.2 + Math.sin(TAU * f * 2 * t) * 0.15) * env * 0.5;
      if (stil === 'yumusak') return (sub + 0.3 * Math.sin(TAU * f * 2 * t)) * env * 0.5;
      const saw = 2 * ((f * t) % 1) - 1;
      lp += (saw - lp) * 0.12;
      return (sub * 0.7 + lp * 0.55) * env * 0.5;
    }, v, buf);
  };
  const lead = (t0, m, len, stil, v = 1) => {
    const f = midi(m);
    mix(t0, len, (t) => {
      const a = Math.min(1, t / 0.003);
      if (stil === 'pluck') return Math.sign(Math.sin(TAU * f * t)) * 0.4 * a * Math.exp(-t * 11) * 0.6 + Math.sin(TAU * f * t) * 0.3 * a * Math.exp(-t * 6);
      if (stil === 'bell') return (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 3.01 * t) * Math.exp(-t * 9)) * a * Math.exp(-t * 3.2) * 0.4;
      if (stil === 'stab') return (2 * ((f * t) % 1) - 1) * a * Math.exp(-t * 9) * 0.35 + Math.sin(TAU * f * 0.5 * t) * a * Math.exp(-t * 9) * 0.2;
      if (stil === 'keys') return (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 5) + 0.15 * Math.sin(TAU * f * 3 * t)) * a * Math.exp(-t * 3.4) * 0.34;
      // saw
      return (2 * ((f * t) % 1) - 1) * a * Math.exp(-t * 7) * 0.32 + (2 * ((f * 1.005 * t) % 1) - 1) * a * Math.exp(-t * 7) * 0.2;
    }, v, buf);
  };
  const pad = (t0, len, notes, v = 1) => {
    for (const m of notes) {
      const f = midi(m);
      mix(t0, len, (t) => {
        const a = Math.min(1, t / 0.25) * Math.min(1, (len - t) / 0.25);
        return Math.sin(TAU * f * t) * a * 0.05 + Math.sin(TAU * f * 1.004 * t) * a * 0.04;
      }, v, buf);
    }
  };
  const yukselis = (t0, len) => mix(t0, len, (t) => {
    const x = t / len;
    return Math.sin(TAU * (300 + 2500 * x * x) * t) * x * x * 0.1 + rnd() * x * x * x * 0.12;
  });

  const bar = beat * 4;
  const bars = Math.floor(DUR / bar);
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const [bs, tones] = st.prog[b % st.prog.length];
    const faz = b % 8; // 8 ölçülük döngü
    const bosluk = faz === 7; // 8. ölçü: breakdown
    const giris = b < 2; // ilk iki ölçü: sade
    // ritim
    if (!bosluk) st.kick.forEach((k) => kick(t0 + t16(k), 1));
    else kick(t0, 1);
    if (!giris && !bosluk) st.clap.forEach((k) => clap(t0 + t16(k), 1));
    if (bosluk) clap(t0 + t16(12), 0.8), clap(t0 + t16(14), 0.8), clap(t0 + t16(15), 0.8);
    for (let k = 0; k < 16; k++) {
      const t = t0 + t16(k);
      if (st.hat === 'off' && k % 4 === 2) hat(t, st.hatVel, false);
      else if (st.hat === 'open' && k % 4 === 2) hat(t, st.hatVel, true);
      else if (st.hat === 'open' && k % 2 === 0 && k % 4 !== 0 && !giris) hat(t, 0.25);
      else if (st.hat === 'sekizlik' && k % 2 === 0) hat(t, k % 4 === 2 ? st.hatVel : st.hatVel * 0.55, k % 8 === 6);
      else if (st.hat === 'trap') {
        hat(t, st.hatVel * (k % 2 ? 0.6 : 1));
        if (k === 7 || k === 15) { hat(t + s16 / 2, 0.4); }
      } else if (st.hat === 'lofi' && k % 2 === 0) hat(t, st.hatVel * (k % 4 === 2 ? 1 : 0.6));
    }
    // bas
    if (!(bosluk && st.bassStil !== '808')) {
      if (st.bassStil === 'pompa') for (let k = 2; k < 16; k += 4) bass(t0 + t16(k), bs, s16 * 3, 'pompa', 1);
      else if (st.bassStil === 'zipla') [0, 3, 6, 8, 10, 14].forEach((k, i) => bass(t0 + t16(k), bs + (i % 3 === 2 ? 12 : 0), s16 * 2.4, 'zipla', 1));
      else if (st.bassStil === '808') { bass(t0, bs, bar * 0.9, '808', 1); bass(t0 + t16(10), bs + 7, beat * 0.9, '808', 0.8); }
      else bass(t0, bs, beat * 2, 'yumusak', 1), bass(t0 + beat * 2.5, bs + 7, beat * 1.2, 'yumusak', 0.9);
    }
    // pad (kick'e göre kısılır — sonradan duck ile çarpılır)
    pad(t0, bar, tones.map((m) => m - 12));
    // lead arpej
    if (!giris && !bosluk) {
      for (let k = 0; k < 16; k++) {
        const ix = st.desen[k];
        if (ix < 0) continue;
        const m = tones[ix % tones.length] + st.leadOct + (ix >= tones.length ? 12 : 0);
        lead(t0 + t16(k), m, s16 * 2.6, st.lead, k % 4 === 0 ? 1 : 0.8);
      }
    }
    if (bosluk) yukselis(t0, bar);
  }

  // yan-zincir + yumuşak sınırlayıcı
  let peak = 0;
  const wet = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 0.01) * Math.min(1, (DUR - t) / 3);
    // kick zaten buf içinde; duck yalnızca kick dışı katmanlara uygulanmalı → kick'i ayrı tutmak yerine hafif kısmak yeterli
    wet[i] = Math.tanh(buf[i] * (0.85 + 0.15 * duck[i]) * st.drive * (0.55 + 0.45 * duck[i])) * fade;
    peak = Math.max(peak, Math.abs(wet[i]));
  }
  const g = 0.8 / (peak || 1);
  const out = Buffer.alloc(44 + N * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 2, 4); out.write('WAVE', 8); out.write('fmt ', 12);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, wet[i] * g)) * 32767), 44 + i * 2);
  const file = path.join(OUTDIR, `ritim-${ad}.wav`);
  fs.writeFileSync(file, out);
  console.log(`ok — ${path.relative(ROOT, file)} (${(out.length / 1048576).toFixed(1)} MB, ${st.bpm} BPM)`);
}

fs.mkdirSync(OUTDIR, { recursive: true });
const secim = process.argv[2];
for (const [ad, st] of Object.entries(STILLER)) if (!secim || secim === ad) uret(ad, st);
