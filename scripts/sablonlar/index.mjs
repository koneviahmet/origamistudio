// Şablon kaydı + tek giriş noktası: uret(brief) → { id, scene }
import vurus from './vurus.mjs';
import hook from './hook.mjs';
import siralama from './siralama.mjs';
import karsilastir from './karsilastir.mjs';
import urun from './urun.mjs';
import rakamlar from './rakamlar.mjs';
import adimlar from './adimlar.mjs';
import sohbet from './sohbet.mjs';
import zaman from './zaman.mjs';
import manzara, { MANZARA_SAHNELER } from './manzara.mjs';
import dalis from './dalis.mjs';
import { slug } from './lib.mjs';
import { MUZIKLER, PALETLER, FONTLAR } from './reels.mjs';

const LISTE = [vurus, hook, siralama, karsilastir, urun, rakamlar, adimlar, sohbet, zaman, manzara, dalis];
export const SABLONLAR = Object.fromEntries(LISTE.map((s) => [s.id, s]));

export function sablonListesi() {
  return LISTE.map(({ id, ad, aciklama, ornek, etiket, sure }) => ({ id, ad, aciklama, ornek, etiket: etiket || '', sure: sure || '' }));
}

/** Arayüz seçenekleri (müzik, palet, font) */
export function sablonMeta() {
  return {
    muzikler: Object.entries(MUZIKLER).map(([id, m]) => ({ id, ad: m.ad, bpm: m.bpm, file: m.file })),
    paletler: Object.entries(PALETLER).map(([id, p]) => ({ id, ad: p.ad, renkler: p.bg.slice(0, 4), vurgu: p.acc.slice(0, 2) })),
    fontlar: FONTLAR,
    sahneler: MANZARA_SAHNELER,
  };
}

/** brief.sablon ile şablonu seçer; proje kimliği brief.id ya da adından türetilir. Anlatım metni varsa `anlatim: [{t, metin}]` da döner. */
export function uret(brief) {
  const s = SABLONLAR[brief.sablon];
  if (!s) throw new Error(`Bilinmeyen şablon: "${brief.sablon}". Seçenekler: ${Object.keys(SABLONLAR).join(', ')}`);
  const scene = s.uret(brief);
  const anlatim = scene.meta?.anlatim;
  scene.meta = { sablon: s.id };
  // Paylaşım bilgisi: brief.yayin { baslik, aciklama, etiketler } → scene.publish
  const y = brief.yayin;
  if (y && typeof y === 'object') {
    scene.publish = {
      title: String(y.baslik ?? y.title ?? ''),
      description: String(y.aciklama ?? y.description ?? ''),
      tags: (y.etiketler ?? y.tags ?? []).map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean),
    };
  }
  return { id: brief.id || slug(brief.ad || s.id), scene, ...(anlatim ? { anlatim } : {}) };
}
