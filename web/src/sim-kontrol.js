// Simülasyon video modu — iframe tarafı çekirdeği (sim-onizleme.js `video=1` ile yükler).
// Zaman çizelgesi (JSON) → parametreler → simülasyon. Her kare deterministik: aynı t aynı görüntü.
//
// Zaman çizelgesi biçimi (katman `kontrol`):  [{ t, <param>: değer, ease? }, …]
//   t        : katman başından saniye
//   sayı     : bir sonraki anahtarda o parametre varsa araya girilir (ease: ad ya da [x1,y1,x2,y2]; varsayılan inOutCubic)
//   sayı dışı (metin / bool / dizi / null) : basamaklı — anahtar t'ye gelince değişir
//   Bir parametre anahtarda yoksa önceki değerini korur. Başlangıç değerleri simülasyonun kendi varsayılanlarıdır.
import { nextTick } from 'vue';
import { ease as easeFn, DEFAULT_EASE } from './engine/easing.js';

const SUBSTEP = 1 / 30; // birikimli hareketlerin (dolanma, dönme) adım aralığı
const REPLAY_ESIK = 0.75; // bu kadar sn'den büyük ileri atlama / her geri atlama → baştan yeniden oynat

/** parametre başına iz kur: { ad: [{t, v, ease}] } */
function izler(kontrol) {
  const tracks = {};
  for (const k of [...(kontrol || [])].sort((a, b) => (a.t ?? 0) - (b.t ?? 0))) {
    for (const [ad, v] of Object.entries(k)) {
      if (ad === 't' || ad === 'ease') continue;
      (tracks[ad] ||= []).push({ t: k.t ?? 0, v, ease: k.ease });
    }
  }
  return tracks;
}

function degerAt(iz, t) {
  if (!iz.length) return undefined;
  if (t <= iz[0].t) return iz[0].v;
  for (let i = 1; i < iz.length; i++) {
    const a = iz[i - 1];
    const b = iz[i];
    if (t < b.t) {
      if (typeof a.v === 'number' && typeof b.v === 'number') {
        const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
        const e = b.ease === undefined ? DEFAULT_EASE : b.ease;
        return a.v + (b.v - a.v) * easeFn(e, u);
      }
      return a.v;
    }
  }
  return iz[iz.length - 1].v;
}

export function createKontrol() {
  const K = {
    spec: null,
    sahne: null,
    tracks: {},
    uygulanan: {}, // son uygulanan değerler (JSON)
    sonT: null,
    _hazir: null,
    _hazirCoz: null,
    kaydet(spec) {
      K.spec = spec;
      K._kontrolHazir();
    },
    sahneBagla(sahne) {
      K.sahne = sahne;
      K._kontrolHazir();
    },
    // hazır = simülasyon kayıtlı + sahne bağlı (ya da kendi adim'ı var) + varsa doku yükleme sözü çözüldü
    _kontrolHazir() {
      if (!K._hazirCoz || K._bekliyor || !K.spec || !(K.sahne || K.spec.adim)) return;
      K._bekliyor = true;
      Promise.resolve(K.spec.hazir).catch(() => {}).then(() => K._hazirCoz());
    },
    /** kontrol: katman.kontrol dizisi */
    kur(kontrol) {
      K.tracks = izler(kontrol);
      K.uygulanan = {};
      K.sonT = null;
    },
    hazir() {
      if (!K._hazir) K._hazir = new Promise((r) => { K._hazirCoz = r; K._kontrolHazir(); });
      return K._hazir;
    },
    paramlar(t) {
      const out = {};
      for (const ad of Object.keys(K.tracks)) out[ad] = degerAt(K.tracks[ad], t);
      return out;
    },
    async _uygula(t) {
      const tum = K.paramlar(t);
      const degisen = {};
      let var_ = false;
      for (const [ad, v] of Object.entries(tum)) {
        const js = JSON.stringify(v);
        if (K.uygulanan[ad] !== js) { degisen[ad] = v; K.uygulanan[ad] = js; var_ = true; }
      }
      if (var_) {
        K.spec.uygula(degisen, tum);
        await nextTick();
      }
    },
    /** t anına git ve çiz */
    async git(t) {
      await K.hazir();
      const adim = K.sahne?.adim || K.spec.adim;
      const ilk = K.sonT === null || t < K.sonT - 1e-6 || t - K.sonT > REPLAY_ESIK;
      let cur = K.sonT ?? 0;
      if (ilk) {
        K.spec.sifirla?.();
        K.uygulanan = {};
        cur = 0;
        await K._uygula(0);
      }
      while (cur < t - 1e-9) {
        const dt = Math.min(SUBSTEP, t - cur);
        cur += dt;
        await K._uygula(cur);
        adim(dt, false);
      }
      await K._uygula(t);
      adim(0, true);
      K.sonT = t;
      return true;
    },
    /** Kareyi (tuval + 2B bindirme) döndür */
    kare() {
      const src = K.sahne?.canvas || K.spec.canvas?.();
      if (!K.spec.cizim) return src;
      const w = src.width;
      const h = src.height;
      const c = (K._ek ||= document.createElement('canvas'));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(src, 0, 0);
      K.spec.cizim(ctx, w, h);
      return c;
    },
  };
  return K;
}
