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

// ── "Boya + mürekkep" süzgeci (genel parametre `boya`, 0..1): 3B kareyi defter çizimine yaklaştırır.
//    Renkler basamaklanır (pastel boya düzlükleri), şekil siluetinde ve güçlü iç kenarlarda hafif titrek mürekkep çizgisi.
//    Deterministik (rastgelelik yok) → önizleme = MP4.
let _buf = null;
function boyaUygula(ctx, w, h, m) {
  const n = w * h;
  if (!_buf || _buf.n !== n) _buf = { n, A: new Float32Array(n), L: new Float32Array(n) };
  const { A, L } = _buf;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const Q = 6 + (1 - m) * 10; // basamak sayısı: m büyüdükçe daha düz
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const a = d[p + 3] / 255;
    A[i] = a;
    L[i] = ((0.3 * d[p] + 0.59 * d[p + 1] + 0.11 * d[p + 2]) / 255) * a;
    if (a > 0) {
      for (let c = 0; c < 3; c++) {
        const v = d[p + c] / 255;
        const q = Math.round(v * Q) / Q;
        d[p + c] = (v + (q - v) * m) * 255 * 0.94 + 255 * 0.06; // hafif pastelleşme
      }
    }
  }
  const S = Math.max(2, Math.round(Math.min(w, h) / 330)); // çizgi kalınlığı çözünürlükle ölçeklenir
  const INK = [61, 58, 115];
  for (let y = S + 2; y < h - S - 2; y++) {
    const wob = Math.round(Math.sin(y * 0.045) * 1.4);
    for (let x = S + 2; x < w - S - 2; x++) {
      const xx = x + wob + Math.round(Math.cos(x * 0.05) * 0.0);
      const i = y * w + xx;
      const gA = Math.abs(A[i + S] - A[i - S]) + Math.abs(A[i + S * w] - A[i - S * w]);
      const gL = Math.abs(L[i + S] - L[i - S]) + Math.abs(L[i + S * w] - L[i - S * w]);
      const e = Math.max(gA * 0.9, gL * 0.75);
      if (e < 0.16) continue;
      const t = Math.min(1, (e - 0.16) / 0.3) * Math.min(1, m * 1.4);
      const p = (y * w + x) * 4;
      d[p] = d[p] + (INK[0] - d[p]) * t;
      d[p + 1] = d[p + 1] + (INK[1] - d[p + 1]) * t;
      d[p + 2] = d[p + 2] + (INK[2] - d[p + 2]) * t;
      d[p + 3] = Math.max(d[p + 3], t * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function createKontrol() {
  const K = {
    spec: null,
    sahne: null,
    tracks: {},
    uygulanan: {}, // son uygulanan değerler (JSON)
    boya: 0, // genel parametre: boya + mürekkep süzgeci miktarı
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
      K.boya = typeof tum.boya === 'number' ? tum.boya : 0;
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
        K.boya = 0;
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
      if (!K.spec.cizim && !(K.boya > 0.001)) return src;
      const w = src.width;
      const h = src.height;
      const c = (K._ek ||= document.createElement('canvas'));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(src, 0, 0);
      if (K.boya > 0.001) boyaUygula(ctx, w, h, Math.min(1, K.boya));
      K.spec.cizim?.(ctx, w, h);
      return c;
    },
  };
  return K;
}
