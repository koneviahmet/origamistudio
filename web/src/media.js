// Medya (resim / video) kare hazırlayıcı.
// renderFrame senkron ve saf kalır; medya karesi res.mediaFrames (Map) içinden okunur.
// Bu modül o Map'i doldurur:  prepareMedia(scene, t, res, { wait, onUpdate })
//   wait: true  → dışa aktarım: tüm kareler hazır olana kadar bekler (her kare tam zamanında)
//   wait: false → önizleme: bekleme yok, hazır olanı kullanır; yeni kare gelince onUpdate çağrılır
// Video sesi karışıma girmez (yalnızca görüntü).
import { isLayerActive } from './engine/renderer.js';
import { mediaKey } from './engine/widgets.js';

const images = new Map(); // src → Promise<{source, w, h}>
const videos = new Map(); // src → Promise<HTMLVideoElement>
const seeking = new Map(); // key → true (uçuştaki seek)
const lastT = new Map(); // key → son istenen kuantize zaman

export const mediaUrl = (src) => `/media-files/${encodeURIComponent(src)}`;
export const isVideoFile = (src) => /\.(mp4|webm|mov)$/i.test(src || '');

export function forgetMedia(src) {
  images.delete(src);
  videos.delete(src);
}

function loadImage(src) {
  if (!images.has(src)) {
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve({ source: img, w: img.naturalWidth || img.width || 800, h: img.naturalHeight || img.height || 600 });
      img.onerror = () => reject(new Error(`Medya yüklenemedi: ${src}`));
      img.src = mediaUrl(src);
    });
    p.catch(() => images.delete(src));
    images.set(src, p);
  }
  return images.get(src);
}

function loadVideo(src) {
  if (!videos.has(src)) {
    const p = new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.onloadeddata = () => resolve(v);
      v.onerror = () => reject(new Error(`Video yüklenemedi: ${src}`));
      v.src = mediaUrl(src);
    });
    p.catch(() => videos.delete(src));
    videos.set(src, p);
  }
  return videos.get(src);
}

function seekTo(v, time) {
  return new Promise((resolve) => {
    if (Math.abs(v.currentTime - time) < 1e-3 && v.readyState >= 2) return resolve();
    const done = () => {
      v.removeEventListener('seeked', done);
      resolve();
    };
    v.addEventListener('seeked', done);
    v.currentTime = time;
  });
}

/** Sahnedeki medya isteklerini topla: [{ key, src, layer }] */
function requests(scene, t) {
  const out = [];
  for (const l of scene.layers || []) {
    if (l.hidden || !isLayerActive(l, t)) continue;
    if (l.type === 'media' && l.src) out.push({ key: mediaKey(l), src: l.src, layer: l });
    else if (l.type === 'device' && l.src) out.push({ key: mediaKey(l, '#screen'), src: l.src, layer: l });
  }
  return out;
}

async function produce(req, t, res) {
  const { key, src, layer } = req;
  if (!isVideoFile(src)) {
    const img = await loadImage(src);
    if (res.mediaFrames.get(key)?.source !== img.source) res.mediaFrames.set(key, img);
    return false; // resim: zaman bağımsız; yalnız ilk yüklemede güncelleme
  }
  const v = await loadVideo(src);
  const rate = layer.rate ?? 1;
  let vt = (t - (layer.start ?? 0)) * rate + (layer.trim ?? 0);
  const d = v.duration || 0;
  if (d > 0) vt = layer.loop === false ? Math.min(d - 0.04, Math.max(0, vt)) : ((vt % d) + d) % d;
  vt = Math.max(0, vt);
  await seekTo(v, vt);
  const old = res.mediaFrames.get(key);
  const bmp = await createImageBitmap(v);
  res.mediaFrames.set(key, { source: bmp, w: v.videoWidth, h: v.videoHeight });
  old?.source?.close?.();
  return true;
}

export async function prepareMedia(scene, t, res, { wait = false, onUpdate } = {}) {
  res.mediaFrames ||= new Map();
  const reqs = requests(scene, t);
  if (!reqs.length) return;
  const jobs = [];
  for (const req of reqs) {
    const video = isVideoFile(req.src);
    const q = Math.round(t * 60) / 60;
    if (!wait) {
      if (seeking.get(req.key)) continue;
      if (video ? lastT.get(req.key) === q : res.mediaFrames.get(req.key)) continue;
    }
    lastT.set(req.key, q);
    seeking.set(req.key, true);
    const job = produce(req, t, res)
      .then((changed) => {
        if (changed || !res.mediaFrames.has(req.key)) return;
        onUpdate?.();
      })
      .catch(() => {})
      .finally(() => {
        seeking.delete(req.key);
        if (video) onUpdate?.();
      });
    jobs.push(job);
  }
  if (wait) await Promise.all(jobs);
}
