// Yerel font kütüphanesini tarayıcıya kaydeder (FontFace) ve render öncesi yükler.
import { usedFonts } from './engine/renderer.js';
import { makeCanvas } from './engine/texture.js';

export const TR_CHARS = 'ğüşıöçİĞÜŞÖÇ';
export const TR_PANGRAM = 'Pijamalı hasta yağız şoföre çabucak güvendi.';
export const FONT_CAT_LABELS = {
  yuvarlak: 'Yuvarlak',
  modern: 'Modern',
  baslik: 'Başlık',
  serif: 'Serif',
  'el-yazisi': 'El yazısı',
  mono: 'Mono',
};

const faces = new Map(); // family → { sig, list: FontFace[] }

/** Manifest değiştikçe çağrılır: yeni fontları ekler, silinenleri kaldırır. */
export function registerFonts(list) {
  const fams = new Set(list.map((f) => f.family));
  for (const [fam, rec] of faces) {
    if (!fams.has(fam)) {
      rec.list.forEach((ff) => document.fonts.delete(ff));
      faces.delete(fam);
    }
  }
  for (const f of list) {
    const sig = f.files.map((x) => x.file).join(',');
    if (faces.get(f.family)?.sig === sig) continue;
    faces.get(f.family)?.list.forEach((ff) => document.fonts.delete(ff));
    const arr = f.files.map(
      (x) =>
        new FontFace(f.family, `url(/font-files/${x.file})`, {
          weight: String(x.weight),
          style: x.style,
          unicodeRange: x.unicodeRange,
        }),
    );
    arr.forEach((ff) => document.fonts.add(ff));
    faces.set(f.family, { sig, list: arr });
  }
}

export function loadFont(family, weight = 400) {
  return document.fonts.load(`${weight} 40px "${family}"`, `Aa${TR_CHARS}`);
}

/** Sahnedeki metin katmanlarının fontlarını yükler (canvas yüklenmemiş fontla çizemez). */
export async function ensureSceneFonts(scene, res) {
  await Promise.all(usedFonts(scene, res).map((f) => loadFont(f.family, f.weight).catch(() => {})));
}

/**
 * F2 — Türkçe karakter testi. Her karakter iki farklı yedek fontla ölçülür:
 * genişlikler farklıysa font o glifi içermiyor, yedek fonta düşülüyor demektir.
 */
export async function checkTurkish(family, weight = 400) {
  await loadFont(family, weight);
  const c = makeCanvas(64, 64);
  const ctx = c.getContext('2d');
  const missing = [];
  for (const ch of TR_CHARS) {
    ctx.font = `${weight} 64px "${family}", monospace`;
    const a = ctx.measureText(ch).width;
    ctx.font = `${weight} 64px "${family}", serif`;
    const b = ctx.measureText(ch).width;
    if (Math.abs(a - b) > 0.01) missing.push(ch);
  }
  return { ok: missing.length === 0, missing: missing.join(''), at: new Date().toISOString() };
}
