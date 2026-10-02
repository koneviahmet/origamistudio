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
  const fit = (text, oo = {}) => {
    const f = oo.font || font;
    const upper = !!oo.upper;
    const metin = oo.sar ? sarMetin(text, oo.sar) : String(text);
    // Sığdırma: sabit puntolu metin de ölçülü genişlikle küçülür (ekran dışına taşmasın); kutulu metinde iç boşluk düşülür
    const ax = oo.x ?? W / 2;
    const al = oo.align || 'center';
    const bos = oo.kutu ? 2 * (Array.isArray(oo.pad) ? oo.pad[1] : 28) : 0;
    const avail = (oo.maxW ?? (ax >= 0 && ax <= W ? (al === 'left' ? W - ax - 44 : al === 'right' ? ax - 44 : Math.min(2 * Math.min(ax, W - ax) - 40, W * 0.9)) : W * 0.9)) - bos;
    const size = sigdirFont(metin, f, avail, oo.size ?? 80, upper, oo.harf ?? 0, oo.weight ?? 700);
    return { f, upper, metin, size, satir: metin.split(String.fromCharCode(10)).length };
  };
  /**
   * Bilgi satırı yığını: her satır önce tek satıra sığdırılır (punto ≥ minOran·size), olmazsa 2 satıra bölünür;
   * ölçülen yüksekliklerle alt alta dizilir (üst üste binmez). o: { size, maxW, lh, gap, minOran, font, upper, harf, kutu }
   * Dönüş: { items: [{ ln, sar, size, yOff }], toplam } — yOff = bloğun üstünden satır merkezine uzaklık (px).
   */
  const yigin = (lines, o = {}) => {
    const lh = o.lh ?? 1.12;
    const items = lines.map((ln) => {
      let v = fit(ln, { ...o, sar: undefined });
      let sar;
      if (v.size < o.size * (o.minOran ?? 0.8)) {
        sar = Math.ceil(String(ln).length / 2) + 3;
        v = fit(ln, { ...o, sar });
      }
      return { ln, sar, size: v.size, h: v.size * lh * v.satir };
    });
    let cur = 0;
    for (const it of items) { it.yOff = cur + it.h / 2; cur += it.h + (o.gap ?? it.size * 0.35); }
    return { items, toplam: items.length ? cur - (o.gap ?? items[items.length - 1].size * 0.35) : 0 };
  };
  const yazi = (id, text, t0, t1, oo = {}) => {
    const { f, upper, metin, size } = fit(text, oo);
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
    // Dikey yığın: kanca → başlık → alt başlık, ölçülü yüksekliklerle (başlık 3 satıra inse bile üst üste binmez)
    const kOpt = { size: kw.kancaSize ?? 84, upper: kw.upper, harf: kw.upper ? 6 : undefined, maxW: W * 0.9 };
    const bOpt = { size: kw.baslikSize ?? 190, sar: kw.sar ?? 12, upper: kw.upper, weight: kw.weight ?? 800 };
    const aOpt = { size: kw.altSize ?? 88, kutu: true, pad: [8, 28], maxW: W * 0.9 };
    const fK = brief.kanca ? fit(brief.kanca, kOpt) : null;
    const fB = fit(brief.baslik || brief.ad, bOpt);
    const fA = brief.altBaslik ? fit(brief.altBaslik, aOpt) : null;
    const hK = fK ? fK.size * 1.1 : 0;
    const hB = fB.size * fB.satir * (kw.lh ?? 1);
    const hA = fA ? fA.size * 1.1 + 24 : 0;
    const GAPK = 34;
    let top = H * (kw.yK ?? 0.29) - hK / 2;
    let tot = hK + (fK ? GAPK : 0) + hB + (fA ? GAPK + 14 : 0) + hA;
    const limit = brief.kapakNesne ? H * (kw.yN ?? 0.8) - m * (kw.nesnePx ?? 0.5) * 0.8 : H * 0.85;
    if (top + tot > limit) top = Math.max(90, top - (top + tot - limit));
    const yKc = top + hK / 2;
    const yBc = top + hK + (fK ? GAPK : 0) + hB / 2;
    const yAc = top + hK + (fK ? GAPK : 0) + hB + GAPK + 14 + hA / 2;

    if (brief.kanca) yazi('kanca', brief.kanca, 0, tKapak, { grup: g, x: W / 2 + dx, y: yKc + dy, size: kw.kancaSize ?? 84, maxW: W * 0.9, renk: kw.kancaRenk || renk, reveal: [0.15, 0.9], anims: A([]), upper: kw.upper, harf: kw.upper ? 6 : undefined });
    yazi('baslik', brief.baslik || brief.ad, 0, tKapak, {
      grup: g, x: W / 2 + dx, y: yBc + dy, size: kw.baslikSize ?? 190, sar: kw.sar ?? 12, renk, reveal: [0.9, 1.5], lh: kw.lh ?? 1, weight: kw.weight ?? 800, upper: kw.upper, golge: kw.golge,
      anims: [{ preset: 'nefes', t: 2.4, genlik: 0.015, periyot: p * 4 }, { preset: 'kuculerek-cik', t: R2(tKapak - 0.55), dur: 0.5 }],
    });
    if (brief.altBaslik) {
      yazi('alt-baslik', brief.altBaslik, 0, tKapak, {
        grup: g, x: W / 2 + dx, y: yAc + dy, size: kw.altSize ?? 88, maxW: W * 0.9, pad: [8, 28], reveal: [2.0, 1.0], kutu: kw.altKutu ?? hi(0), rot: -2, renk: kw.altRenk || (koyu ? '#1b2228' : '#2d3561'),
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
    // Dikey yığın: blok yükseklikleri ölçülür, sırayla dizilir (üst üste binmez); sığmazsa son2 küçülür
    const u1 = kw.upper ? 110 : 130;
    let s2 = kw.upper ? 190 : 200;
    let sq = 92;
    const bloklar = () => {
      const o1 = brief.son1 ? fit(brief.son1, { size: u1, upper: kw.upper }) : null;
      const o2 = fit(brief.son2 || `${brief.ad}!`, { size: s2, sar: 14, maxW: W * 0.8, upper: kw.upper });
      const o3 = brief.soru ? fit(brief.soru, { size: sq, sar: 16, kutu: true }) : null;
      const o4 = brief.cta ? fit(brief.cta, { size: 72 }) : null;
      return [[o1, o1 && o1.size * 1.05], [o2, o2.size * o2.satir], [o3, o3 && o3.size * 1.05 * o3.satir + 46 + 40], [o4, o4 && o4.size * 1.05]].filter((q) => q[0]);
    };
    const ust = H * (kw.upper ? 0.12 : 0.14);
    const alt = H * 0.6;
    const GAP = 44;
    let bl = bloklar();
    while (bl.reduce((x, q) => x + q[1], 0) + GAP * (bl.length - 1) > alt - ust && (s2 > 90 || sq > 60)) { s2 = Math.max(90, Math.round(s2 * 0.92)); sq = Math.max(60, Math.round(sq * 0.94)); bl = bloklar(); }
    let cur = ust;
    const yy = {};
    bl.forEach(([o, h], i) => { yy[o.metin] = cur + h / 2; cur += h + GAP; });
    const yTakip = (cur - GAP) / H + 0.075; // takip bloğu yığının hemen altında (CTA ile çakışmaz)
    const Y = (txt) => yy[txt] + dy;
    const o1 = brief.son1 ? fit(brief.son1, { size: u1, upper: kw.upper }) : null;
    if (o1) yazi('son-1', brief.son1, t0, null, { grup: g, x: W / 2 + dx, y: Y(o1.metin), size: u1, renk, reveal: [0.3, 0.7], upper: kw.upper });
    const o2 = fit(brief.son2 || `${brief.ad}!`, { size: s2, sar: 14, maxW: W * 0.8, upper: kw.upper });
    yazi('son-2', brief.son2 || `${brief.ad}!`, t0, null, {
      grup: g, x: W / 2 + dx, y: Y(o2.metin), size: s2, sar: 14, maxW: W * 0.8, renk, reveal: [1.0, 1.2], lh: 1, weight: 800, upper: kw.upper, golge: kw.golge,
      anims: [{ preset: 'nefes', t: R2(t0 + 2.4), genlik: 0.02, periyot: p * 3 }],
    });
    if (brief.soru) {
      const o3 = fit(brief.soru, { size: sq, sar: 16, kutu: true });
      yazi('son-soru', brief.soru, t0, null, {
        grup: g, x: W / 2 + dx, y: Y(o3.metin), size: sq, sar: 16, kutu: kw.soruKutu ?? hi(1), renk: kw.soruRenk || (koyu ? '#1b2228' : '#2d3561'), rot: -3, reveal: [2.8, 0.01],
        anims: [{ preset: 'zipla-gir', t: R2(t0 + 2.8), dur: 0.7 }, { preset: 'sallan', t: R2(t0 + 3.6), aci: 3, periyot: 2 }],
      });
    }
    if (brief.cta) { const o4 = fit(brief.cta, { size: 72 }); yazi('son-cta', brief.cta, t0, null, { grup: g, x: W / 2 + dx, y: Y(o4.metin), size: 72, renk: kw.ctaRenk || renk, reveal: [4.0, 1.2], opacity: 0.9 }); }
    if (brief.takip !== false) c.takip(t0 + 3.2, tEnd, { grup: g, y: yTakip + dy / H });
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

  return { c, W, H, k, m, p, font, bol, n, koyu, hi, planlar, bK, tK, tEnd, tKapak, kapSure, yazi, cizGir, cizim, ses, kapak, kapanis, bitir, suzBg, isik, anlatim, audio, fit, yigin };
}

/** Yıl metni sayı mı? (sayaç şablonu için) */
export const yilSayi = (y) => {
  const s = String(y ?? '').trim();
  return /^\d{3,4}$/.test(s) ? parseInt(s, 10) : null;
};
