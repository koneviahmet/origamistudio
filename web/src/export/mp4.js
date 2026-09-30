// Tarayıcı içinde MP4 (H.264) dışa aktarımı: WebCodecs VideoEncoder + mp4-muxer.
// Her kare renderFrame ile deterministik çizilir — gerçek zamanlı kayıt değildir,
// bu yüzden takılma/kare atlama olmaz.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { renderFrame } from '../engine/renderer.js';
import { makeCanvas } from '../engine/texture.js';

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

async function pickConfig(width, height, fps, bitrate) {
  const candidates = [
    { codec: 'avc1.640034', mux: 'avc' },
    { codec: 'avc1.4d0034', mux: 'avc' },
    { codec: 'avc1.42003e', mux: 'avc' },
    { codec: 'vp09.00.40.08', mux: 'vp9' },
  ];
  for (const c of candidates) {
    const config = {
      codec: c.codec,
      width,
      height,
      bitrate,
      framerate: fps,
      ...(c.mux === 'avc' ? { avc: { format: 'avc' } } : {}),
    };
    try {
      const { supported } = await VideoEncoder.isConfigSupported(config);
      if (supported) return { config, mux: c.mux };
    } catch { /* sıradakini dene */ }
  }
  return null;
}

async function pickAudioConfig(sampleRate, numberOfChannels) {
  if (typeof AudioEncoder === 'undefined') return null;
  for (const c of [
    { codec: 'mp4a.40.2', mux: 'aac', bitrate: 192000 },
    { codec: 'opus', mux: 'opus', bitrate: 160000 },
  ]) {
    const config = { codec: c.codec, sampleRate, numberOfChannels, bitrate: c.bitrate };
    try {
      const { supported } = await AudioEncoder.isConfigSupported(config);
      if (supported) return { config, mux: c.mux };
    } catch { /* sıradakini dene */ }
  }
  return null;
}

/** Karışık ses tamponunu kodlayıp muxer'a ekler */
async function encodeAudio(muxer, picked, buffer) {
  let err = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => (err = e),
  });
  enc.configure(picked.config);
  const sr = buffer.sampleRate;
  const chs = [...Array(buffer.numberOfChannels)].map((_, i) => buffer.getChannelData(i));
  const BLOCK = 4096;
  for (let i = 0; i < buffer.length; i += BLOCK) {
    if (err) throw err;
    const n = Math.min(BLOCK, buffer.length - i);
    const data = new Float32Array(n * chs.length);
    chs.forEach((c, k) => data.set(c.subarray(i, i + n), k * n));
    const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: chs.length, timestamp: Math.round((i / sr) * 1e6), data });
    enc.encode(ad);
    ad.close();
    while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 1));
  }
  await enc.flush();
  if (err) throw err;
  enc.close();
}

export function canExportMp4() {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
}

/**
 * @param {object} scene
 * @param {Map} lib
 * @param {{scale?: number, from?: number, to?: number, onProgress?: (p:number)=>void, signal?: AbortSignal}} opts
 * @returns {Promise<Blob>}
 */
export async function exportMp4(scene, lib, opts = {}) {
  if (!canExportMp4()) throw new Error('Bu tarayıcı WebCodecs desteklemiyor. Chrome veya Edge kullanın.');
  const scale = opts.scale || 1;
  const fps = scene.fps || 30;
  // opts.format: çoklu format çıktısı (bkz. renderer formatMapping)
  const OW = opts.format?.width ?? scene.width;
  const OH = opts.format?.height ?? scene.height;
  const width = even(OW * scale);
  const height = even(OH * scale);
  const from = opts.from ?? 0;
  const to = opts.to ?? scene.duration;
  const frames = Math.max(1, Math.round((to - from) * fps));
  const bitrate = opts.bitrate || Math.round(width * height * fps * 0.2);

  const picked = await pickConfig(width, height, fps, bitrate);
  if (!picked) throw new Error(`Bu çözünürlükte (${width}×${height}) uygun video kodlayıcı bulunamadı.`);

  if (document.fonts?.ready) await document.fonts.ready;

  // Ses (varsa): opts.audioBuffer — sahnenin önceden karıştırılmış sesi
  const ab = opts.audioBuffer || null;
  const pickedAudio = ab ? await pickAudioConfig(ab.sampleRate, ab.numberOfChannels) : null;
  if (ab && !pickedAudio) opts.onWarning?.('Bu tarayıcıda ses kodlayıcı yok; video sessiz aktarılacak.');

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: picked.mux, width, height, frameRate: fps },
    ...(pickedAudio ? { audio: { codec: pickedAudio.mux, sampleRate: ab.sampleRate, numberOfChannels: ab.numberOfChannels } } : {}),
    fastStart: 'in-memory',
  });
  if (pickedAudio) await encodeAudio(muxer, pickedAudio, ab);
  let encError = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (encError = e),
  });
  encoder.configure(picked.config);

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const sx = width / OW;
  const sy = height / OH;
  const frameDur = 1e6 / fps;

  try {
    for (let i = 0; i < frames; i++) {
      if (opts.signal?.aborted) throw new DOMException('İptal edildi', 'AbortError');
      if (encError) throw encError;
      ctx.setTransform(sx, 0, 0, sy, 0, 0);
      renderFrame(ctx, scene, from + i / fps, lib, { format: opts.format });
      const frame = new VideoFrame(canvas, { timestamp: Math.round(i * frameDur), duration: Math.round(frameDur) });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (encoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 1));
      if (i % 3 === 0) {
        opts.onProgress?.(i / frames);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await encoder.flush();
    if (encError) throw encError;
    muxer.finalize();
    opts.onProgress?.(1);
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
  return new Blob([target.buffer], { type: 'video/mp4' });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function exportPng(scene, lib, t, scale = 1, format = null) {
  const OW = format?.width ?? scene.width;
  const OH = format?.height ?? scene.height;
  const canvas = makeCanvas(even(OW * scale), even(OH * scale));
  const ctx = canvas.getContext('2d');
  if (document.fonts?.ready) await document.fonts.ready;
  ctx.setTransform(canvas.width / OW, 0, 0, canvas.height / OH, 0, 0);
  renderFrame(ctx, scene, t, lib, { format });
  if (canvas.convertToBlob) return canvas.convertToBlob({ type: 'image/png' });
  return new Promise((r) => canvas.toBlob(r, 'image/png'));
}
