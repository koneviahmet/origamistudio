// Zaman tüneli ailesinin ortak iskeleti (zaman-yol, zaman-kart, zaman-seridi, zaman-sayac, zaman-merdiven).
// Hepsi AYNI brief'i okur (zaman şablonuyla aynı): { ad, baslik, altBaslik, kanca, kapakNesne, suslemeler,
//   bolumler: [{ yil, ad, nesne, varyant?, balon, bilgi: [2 satır], notlar: [..], anlatim, ses? }], soru, cta, son1, son2, takip }
// → içerik tek yerde yazılır, şablon (görsel dil) değiştirilerek aynı hikâye başka tasarımla üretilebilir.
// Ortak iş: bölüm süreleri (okuma / anlatım süresine göre vuruşa yuvarlı), anlatım → anlatim.txt, ses dosyaları, kapak, kapanış.
import { gerekli, nesneSec, varlikBoyut, wavOku } from './lib.mjs';
import { reels, sarMetin, sigdirFont, parlaklik } from './reels.mjs';

export const R2 = (n) => Math.round(n * 100) / 100;
export const kelimeSay = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
export const kaydir = (hex, f) => {
  const v = parseInt(String(hex).slice(1, 7), 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.round(Math.max(0, Math.min(255, x * f))));
  return '#' + ch.map((x) => x.toString(16).padStart(2, '0')).join('');
};

/**
 * Ortak kurulum. o: { kapakBeats, kapSure, minSn, okumaTaban }
 * Dönüş: { c, W, H, k, m, p, font, bol, n, planlar, tK, tEnd, bK, yazi, cizGir, hi, koyu, anlatim, audio, bitir, kapak, kapanis, ... }
 */
export function zamanKur(brief, sablonId, d, o = {}) {
  gerekli(brief, ['ad', 'bolumler'], sablonId);
  const c = reels(brief, d);
  const { W, H, k, m, p } = c;
  const font = c.font;
  const bol = brief.bolumler.slice(0, 9);
  const n = bol.length;
  const koyu = parlaklik(c.zemin(0)) < 148;
  const hi = (i) => c.pal.acc[((i % c.pal.acc.length) + c.pal.acc.length) % c.pal.acc.length];
  const anlatim = [];
  const audio = [];

  // ── zamanlama: okuma süresi / anlatım süresi → vuruş ızgarasına yuvarlı ─────
  const kapakBeats = o.kapakBeats ?? 8;
  const kapSure = o.kapSure ?? 8;
  let b = kapakBeats;
  const planlar = bol.map((s) => {
    const bilgi = (s.bilgi || []).slice(0, 2);
    const okuma = 2.6 + bilgi.reduce((x, l) => x + kelimeSay(l), 0) * 0.34;
    const sesDosya = s.ses && wavOku(String(s.ses));
    const sesSure = sesDosya ? sesDosya.mono.length / sesDosya.sampleRate : 0;
    const anlat = s.anlatim ? (sesSure || String(s.anlatim).length / 14 + 0.9) + 1.0 : 0;
    const sn = Math.max(o.minSn ?? 6.2, okuma + 1.6, anlat);
    const beats = Math.ceil(sn / p / 2) * 2;
    const pl = { s, bilgi, beats, b0: b, sesSure };
    b += beats;
    return pl;
  });
  planlar.forEach((pl) => {
    pl.t0 = c.vurus(pl.b0);
    pl.t1 = c.vurus(pl.b0 + pl.beats);
  });
  const bK = b;
  const tK = c.vurus(bK);
  const tEnd = c.vurus(bK + kapSure);
  const tKapak = c.vurus(kapakBeats);

  /** Metin katmanı (el yazısı / modern, sığdırmalı). o: grup, x, y, size, sabit, maxW, sar, reveal, renk, kutu, rot, anims, lh, weight, align, font, upper, harf, stroke, opacity, depth */
  const yazi = (id, text, t0, t1, oo = {}) => {
    const f = oo.font || font;
    const upper = !!oo.upper;
    const metin = oo.sar ? sarMetin(text, oo.sar) : String(text);
    const size = oo.sabit ? oo.size : sigdirFont(metin, f, oo.maxW ?? W * 0.9, oo.size ?? 80, upper);
    const rev = oo.reveal;
    return c.L({
      id, ...(oo.grup ? { group: oo.grup } : {}), type: 'text', text: metin, font: f, weight: oo.weight ?? 700, color: oo.renk || '$baslik',
      x: oo.x ?? W / 2, y: oo.y, size, align: oo.align || 'center', lineHeight: oo.lh ?? 1.05, start: R2(t0), ...(t1 != null ? { end: R2(t1) } : {}),
      ...(upper ? { uppercase: true } : {}), ...(oo.harf != null ? { letterSpacing: oo.harf } : {}),
      ...(rev ? { reveal: [k(t0 + rev[0], 0), k(t0 + rev[0] + Math.max(0.02, rev[1]), 1, 'linear')] } : {}),
      ...(oo.rot ? { rotation: oo.rot } : {}), ...(oo.stroke ? { stroke: oo.stroke } : {}), ...(oo.opacity != null ? { opacity: oo.opacity } : {}),
      ...(oo.depth != null ? { depth: oo.depth } : {}), ...(oo.blur ? { blur: oo.blur } : {}),
      ...(oo.golge ? { shadow: { color: 'rgba(0,0,0,0.3)', blur: 0, x: 0, y: Math.round(size * 0.035) } } : {}),
      ...(oo.kutu ? { box: { color: oo.kutu, opacity: oo.kutuAlfa ?? 0.92, radius: oo.radius ?? 18, shadow: false, padding: oo.pad ?? [4, 28] } } : {}),
      ...(oo.anims ? { anims: oo.anims } : {}),
    });
  };
  const cizim = c.stil === 'cizim';
  const cizGir = (t, dur) => (cizim ? { preset: 'cizerek-gir', t: R2(t), dur } : { preset: 'katlanarak-gir', t: R2(t), dur });

  /** Bölüm sesi / anlatım kaydı */
  const ses = (pl, tBas) => {
    if (pl.s.ses) audio.push({ file: String(pl.s.ses), start: R2(tBas), volume: 1 });
    if (pl.s.anlatim) anlatim.push({ t: R2(tBas), metin: String(pl.s.anlatim) });
  };

  /**
   * Kapak (ortak): kanca + başlık + alt başlık + kapak nesnesi + süslemeler. kw: { renk, y: [kanca, baslik, alt, nesne], font, kutu, altRenk, grup, camX, camY }
   * `ox`/`oy` verilirse (dünya koordinatı) hepsi o merkeze kaydırılır (kaydırmalı şablonlar).
   */
  const kapak = (kw = {}) => {
    const g = c.grup('g-acilis', 'Açılış', true);
    const dx = kw.dx ?? 0;
    const dy = kw.dy ?? 0;
    const renk = kw.renk || '$baslik';
    const cik = kw.cikis === false ? [] : [{ preset: 'sol', t: R2(tKapak - 0.5), dur: 0.45 }];
    c.bolum(0, 'Açılış');
    const sus = brief.suslemeler || kw.suslemeler || ['yildiz', 'bulut', 'yildiz'];
    if (kw.suslemeTipi !== 'yok') {
      [[0.17, 0.2, 0.34, -10], [0.84, 0.17, 0.42, 8], [0.8, 0.64, 0.3, 14]].slice(0, sus.length).forEach(([fx, fy, f, r], i) => {
        const asset = nesneSec(sus[i]);
        const [w, h] = varlikBoyut(asset);
        c.L({
          id: `susleme-${i + 1}`, group: g, asset, x: Math.round(W * fx + dx), y: Math.round(H * fy + dy), scale: R2((m * f) / Math.max(w, h)), rotation: r, end: R2(tKapak), depth: 0.3,
          palette: { a: kw.suslemeRenk ? kw.suslemeRenk(i) : hi(i + 1) },
          anims: [cizGir(0.5 + i * 0.3, 1.2), { preset: 'sallan', t: 1.9 + i * 0.2, aci: 8, periyot: 2.2 }, ...cik],
        });
      });
    }
    if (brief.kapakNesne) {
      const asset = nesneSec(brief.kapakNesne);
      const [w, h] = varlikBoyut(asset);
      c.L({
        id: 'kapak-nesne', group: g, asset, x: Math.round(W / 2 + dx), y: Math.round((kw.yN ?? 0.8) * H + dy), anchor: [0.5, 1], scale: R2((m * (kw.nesnePx ?? 0.5)) / Math.max(w, h)),
        start: 0.4, end: R2(tKapak), anims: [cizGir(0.5, 1.6), { preset: 'suzul', t: 2.4, genlik: 10, periyot: 3 }, ...cik],
      });
    }
    const A = (extra) => [...extra, ...cik];
    if (brief.kanca) yazi('kanca', brief.kanca, 0, tKapak, { grup: g, x: W / 2 + dx, y: H * (kw.yK ?? 0.29) + dy, size: kw.kancaSize ?? 84, renk: kw.kancaRenk || renk, reveal: [0.15, 0.9], anims: A([]), upper: kw.upper, harf: kw.upper ? 6 : undefined });
    yazi('baslik', brief.baslik || brief.ad, 0, tKapak, {
      grup: g, x: W / 2 + dx, y: H * (kw.yB ?? 0.4) + dy, size: kw.baslikSize ?? 190, sar: kw.sar ?? 12, renk, reveal: [0.9, 1.5], lh: kw.lh ?? 1, weight: kw.weight ?? 800, upper: kw.upper, golge: kw.golge,
      anims: [{ preset: 'nefes', t: 2.4, genlik: 0.015, periyot: p * 4 }, { preset: 'kuculerek-cik', t: R2(tKapak - 0.55), dur: 0.5 }],
    });
    if (brief.altBaslik) {
      yazi('alt-baslik', brief.altBaslik, 0, tKapak, {
        grup: g, x: W / 2 + dx, y: H * (kw.yA ?? 0.53) + dy, size: kw.altSize ?? 88, reveal: [2.0, 1.0], kutu: kw.altKutu ?? hi(0), rot: -2, renk: kw.altRenk || (koyu ? '#1b2228' : '#2d3561'),
        anims: A([{ preset: 'zipla-gir', t: 2.0, dur: 0.5 }]),
      });
    }
    return g;
  };

  /** Kapanış (ortak): son1 / son2 / soru / cta / takip / konfeti. kw: { renk, dx, dy, grup, ykaydir } */
  const kapanis = (kw = {}) => {
    const g = c.grup('g-kapanis', 'Kapanış', true);
    const dx = kw.dx ?? 0;
    const dy = kw.dy ?? 0;
    const renk = kw.renk || '$baslik';
    const t0 = kw.t0 ?? tK;
    const [y1, y2, y3, y4] = kw.upper ? [0.165, 0.29, 0.43, 0.55] : [0.2, 0.3, 0.42, 0.545];
    c.bolum(t0, 'Kapanış');
    if (brief.son1) yazi('son-1', brief.son1, t0, null, { grup: g, x: W / 2 + dx, y: H * y1 + dy, size: kw.upper ? 110 : 130, renk, reveal: [0.3, 0.7], upper: kw.upper });
    yazi('son-2', brief.son2 || `${brief.ad}!`, t0, null, {
      grup: g, x: W / 2 + dx, y: H * y2 + dy, size: kw.upper ? 190 : 200, sar: 14, maxW: W * 0.8, renk, reveal: [1.0, 1.2], lh: 1, weight: 800, upper: kw.upper, golge: kw.golge,
      anims: [{ preset: 'nefes', t: R2(t0 + 2.4), genlik: 0.02, periyot: p * 3 }],
    });
    if (brief.soru) {
      yazi('son-soru', brief.soru, t0, null, {
        grup: g, x: W / 2 + dx, y: H * y3 + dy, size: 92, sar: 16, kutu: kw.soruKutu ?? hi(1), renk: kw.soruRenk || (koyu ? '#1b2228' : '#2d3561'), rot: -3, reveal: [2.8, 0.01],
        anims: [{ preset: 'zipla-gir', t: R2(t0 + 2.8), dur: 0.7 }, { preset: 'sallan', t: R2(t0 + 3.6), aci: 3, periyot: 2 }],
      });
    }
    if (brief.cta) yazi('son-cta', brief.cta, t0, null, { grup: g, x: W / 2 + dx, y: H * y4 + dy, size: 72, renk: kw.ctaRenk || renk, reveal: [4.0, 1.2], opacity: 0.9 });
    if (brief.takip !== false) c.takip(t0 + 3.2, tEnd, { grup: g, y: 0.64 + dy / H });
    c.L({ id: 'kapanis-konfeti', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: R2(t0), end: R2(tEnd), count: 45, prewarm: true, area: [60 + dx, 300 + dy, W - 60 + dx, Math.round(H * 0.65) + dy] });
    c.L({ id: 'kapanis-patlama', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: Math.round(W / 2 + dx), y: Math.round(H * 0.4 + dy), start: R2(t0 + 2.8), end: R2(tEnd) });
    return g;
  };

  /** Parıltı: bulanık yuvarlak ışık. o: t0, t1, opacity (sayı ya da izi), blur, grup, depth, x/y izi için extra */
  const isik = (id, x, y, boyut, renk, oo = {}) => c.sekil(id, 'daire', x, y, boyut, {
    t0: oo.t0 ?? 0, t1: oo.t1, renk, opacity: oo.opacity ?? 0.3, giris: 'yok', grup: oo.grup, depth: oo.depth, blur: oo.blur ?? 60, extra: oo.extra, anims: oo.anims,
  });

  /** Yumuşak geçişli çizgisel arka plan: noktalar [{ t, i }] (t = geçişin bittiği an, i = zemin rengi indeksi), ikinci renk otomatik koyulaşır. */
  const suzBg = (noktalar, bo = {}) => {
    const gol = (hex) => (parlaklik(hex) > 148 ? kaydir(hex, 0.93) : kaydir(hex, 0.78));
    const a = [];
    const b = [];
    noktalar.forEach((q, j) => {
      const bg = c.zemin(q.i);
      if (j) {
        const onceki = c.zemin(noktalar[j - 1].i);
        a.push(k(q.t - (bo.sure ?? 1), onceki, 'linear'));
        b.push(k(q.t - (bo.sure ?? 1), gol(onceki), 'linear'));
      }
      a.push(k(q.t, bg, j ? 'inOutSine' : undefined));
      b.push(k(q.t, gol(bg), j ? 'inOutSine' : undefined));
    });
    return { type: 'linear', colors: [a, b], angle: bo.aci ?? 170, paper: bo.kagit ?? 0, vignette: bo.vinyet ?? 0.16 };
  };

  /** Sahneyi bitirir: ses birleştirir, anlatım kaydı ekler. */
  const bitir = (ad, ek) => {
    const sc = c.bitir2(ad, tEnd, ek);
    if (audio.length) sc.audio = [...audio, ...(sc.audio || []).map((a) => ({ ...a, volume: Math.min(a.volume, 0.28) }))];
    if (anlatim.length) sc.meta = { anlatim };
    return sc;
  };

  return { c, W, H, k, m, p, font, bol, n, koyu, hi, planlar, bK, tK, tEnd, tKapak, kapSure, yazi, cizGir, cizim, ses, kapak, kapanis, bitir, suzBg, isik, anlatim, audio };
}

/** Yıl metni sayı mı? (sayaç şablonu için) */
export const yilSayi = (y) => {
  const s = String(y ?? '').trim();
  return /^\d{3,4}$/.test(s) ? parseInt(s, 10) : null;
};
