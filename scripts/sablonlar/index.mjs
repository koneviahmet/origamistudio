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
import zamanYol from './zaman-yol.mjs';
import zamanKart from './zaman-kart.mjs';
import zamanSeridi from './zaman-seridi.mjs';
import zamanSayac from './zaman-sayac.mjs';
import zamanMerdiven from './zaman-merdiven.mjs';
import zamanCark from './zaman-cark.mjs';
import zamanGaleri from './zaman-galeri.mjs';
import zamanPano from './zaman-pano.mjs';
import zamanRetro from './zaman-retro.mjs';
import zamanDergi from './zaman-dergi.mjs';
import zamanKatman from './zaman-katman.mjs';
import zamanTeknik from './zaman-teknik.mjs';
import zamanFilm from './zaman-film.mjs';
import zamanMetro from './zaman-metro.mjs';
import zamanPiksel from './zaman-piksel.mjs';
import hikayeYolculuk from './hikaye-yolculuk.mjs';
import hikayeGun from './hikaye-gun.mjs';
import hikayeDamla from './hikaye-damla.mjs';
import hikayeKitap from './hikaye-kitap.mjs';
import hikayeUcus from './hikaye-ucus.mjs';
import hikayeMasal from './hikaye-masal.mjs';
import hikayeFener from './hikaye-fener.mjs';
import hikayeKervan from './hikaye-kervan.mjs';
import hikayeKar from './hikaye-kar.mjs';
import hikayeEjderha from './hikaye-ejderha.mjs';
import hikayeMantar from './hikaye-mantar.mjs';
import karakterBilgi from './karakter-bilgi.mjs';
import karakterQuiz from './karakter-quiz.mjs';
import karakterMit from './karakter-mit.mjs';
import karakterTanitim from './karakter-tanitim.mjs';
import karakterIpucu from './karakter-ipucu.mjs';
import gozluGozlem from './gozlu-gozlem.mjs';
import gozluNeden from './gozlu-neden.mjs';
import gozluDuygu from './gozlu-duygu.mjs';
import gozluHaber from './gozlu-haber.mjs';
import gozluSkec from './gozlu-skec.mjs';
import manzara, { MANZARA_SAHNELER } from './manzara.mjs';
import dalis from './dalis.mjs';
import { slug } from './lib.mjs';
import { MUZIKLER, PALETLER, FONTLAR } from './reels.mjs';

const LISTE = [vurus, hook, siralama, karsilastir, urun, rakamlar, adimlar, sohbet, zaman, zamanYol, zamanKart, zamanSeridi, zamanSayac, zamanMerdiven, zamanCark, zamanGaleri, zamanPano, zamanRetro, zamanDergi, zamanKatman, zamanTeknik, zamanFilm, zamanMetro, zamanPiksel, hikayeYolculuk, hikayeGun, hikayeDamla, hikayeKitap, hikayeUcus, hikayeMasal, hikayeFener, hikayeKervan, hikayeKar, hikayeEjderha, hikayeMantar, karakterBilgi, karakterQuiz, karakterMit, karakterTanitim, karakterIpucu, gozluGozlem, gozluNeden, gozluDuygu, gozluHaber, gozluSkec, manzara, dalis];
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
