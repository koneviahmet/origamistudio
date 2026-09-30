// Şablon kaydı + tek giriş noktası: uret(brief) → { id, scene }
import explainer from './explainer.mjs';
import veri from './veri.mjs';
import kinetik from './kinetik.mjs';
import urun from './urun.mjs';
import showreel from './showreel.mjs';
import liste from './liste.mjs';
import { slug } from './lib.mjs';

export const SABLONLAR = Object.fromEntries([explainer, veri, kinetik, urun, showreel, liste].map((s) => [s.id, s]));

export function sablonListesi() {
  return Object.values(SABLONLAR).map(({ id, ad, aciklama, ornek }) => ({ id, ad, aciklama, ornek }));
}

/** brief.sablon ile şablonu seçer; proje kimliği brief.id ya da adından türetilir */
export function uret(brief) {
  const s = SABLONLAR[brief.sablon];
  if (!s) throw new Error(`Bilinmeyen şablon: "${brief.sablon}". Seçenekler: ${Object.keys(SABLONLAR).join(', ')}`);
  const scene = s.uret(brief);
  scene.meta = { sablon: s.id };
  return { id: brief.id || slug(brief.ad || s.id), scene };
}
