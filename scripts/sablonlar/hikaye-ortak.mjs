// Hikâye modu için ortak iskelet: "Katmanlı manzara (sinematik kapak)" dilini (paralaks bantlar, süzülen bulutlar, uçan kuşlar, gökyüzü)
// anlatılan bir HİKÂYEYE genişletir. Altı şablon (hikaye-yolculuk, -gun, -damla, -kitap, -ucus, -masal) bu dosyayı kullanır.
//
// Ortak brief:
//   { ad, baslik, altBaslik, hikaye: [{ baslik?, anlatim, altyazi?, ses?, …şablona özgü }], son, soru, cta, takip, muzik, font }
//   `anlatim` = seslendirilecek metin (anlatim.txt üretilir: npm run seslendir), `altyazi` = ekranda gösterilen kısa metin (yoksa anlatım kullanılır).
// Süreler: anlatım uzunluğuna (ya da `ses` wav süresine) göre vuruş ızgarasına yuvarlanır.
import { gerekli, varliklar, varlikBoyut, wavOku, r2 } from './lib.mjs';
import { reels, sarMetin, sigdirFont } from './reels.mjs';

export { r2 };
export const R2 = (n) => Math.round(n * 100) / 100;

/** Gökyüzü / yazı renkleri (manzara ön ayarlarının genişletilmişi) */
export const GOKYUZU = {
  safak: { bg: ['#ffb88c', '#ffd9a8', '#fff0cf', '#cfe3e8'], yazi: '#6b3b2a', alt: '#8a5a44', golge: 'rgba(120,60,30,0.22)' },
  gunduz: { bg: ['#a3d6ee', '#fdeccf', '#d9ecc9', '#7fb58a'], yazi: '#2d4a3e', alt: '#4a6b57', golge: 'rgba(30,60,40,0.22)' },
  deniz: { bg: ['#8fd3ec', '#d4eef3', '#8ccbe0', '#1f4f6b'], yazi: '#1f5673', alt: '#2f7596', golge: 'rgba(20,70,100,0.25)' },
  aksam: { bg: ['#3b2f7a', '#c4528a', '#ff9a62', '#ffd08a'], yazi: '#fff1d6', alt: '#ffd9b0', golge: 'rgba(40,10,50,0.35)' },
  gece: { bg: ['#0b132b', '#1c2541', '#3a506b', '#5b6f8f'], yazi: '#f5e6a8', alt: '#c9d6ea', golge: 'rgba(0,0,0,0.35)' },
  firtina: { bg: ['#4a5568', '#6b7a8f', '#9aa8b8', '#c7d0da'], yazi: '#f4f6fa', alt: '#dfe6ee', golge: 'rgba(0,0,0,0.3)' },
};

const kelimeSay = (t) => String(t || '').split(/\s+/).filter(Boolean).length;

/**
 * Hikâye iskeleti. d: reels varsayılanları. o: { kapakBeats, kapSure, minSn, kar }
 * Dönüş: { c, W, H, k, m, p, fx, fy, lib, font, hik, n, planlar, tAc, tK, tEnd, g, … yardımcılar }
 */
export function hikayeKur(brief, sablonId, d, o = {}) {
  gerekli(brief, ['ad', 'hikaye'], sablonId);
  const c = reels(brief, d);
  const { W, H, k, m, p } = c;
  const fx = W / 1080;
  const fy = H / 1920;
  const lib = varliklar();
  const font = c.font;
  const hik = brief.hikaye.slice(0, o.maks ?? 9);
  const n = hik.length;
  const anlatim = [];
  const audio = [];
  const g = c.grup('g-hikaye', 'Hikâye', true);

  // ── zamanlama ─────────────────────────────────────────────────────────
  const kapakBeats = o.kapakBeats ?? 8;
  let b = kapakBeats;
  const planlar = hik.map((s) => {
    const sesDosya = s.ses && wavOku(String(s.ses));
    const sesSure = sesDosya ? sesDosya.mono.length / sesDosya.sampleRate : 0;
    const metin = s.anlatim || s.soz || s.altyazi || '';
    const okuma = 2.4 + kelimeSay(s.altyazi || metin) * 0.3;
    const anlat = metin ? (sesSure || String(metin).length / 14 + 0.9) + 0.9 : 0;
    const sn = Math.max(o.minSn ?? 5.4, okuma, anlat, s.sure || 0);
    const beats = Math.ceil(sn / p / 2) * 2;
    const pl = { s, beats, b0: b, sesSure };
    b += beats;
    return pl;
  });
  planlar.forEach((pl) => {
    pl.t0 = c.vurus(pl.b0);
    pl.t1 = c.vurus(pl.b0 + pl.beats);
  });
  const tAc = c.vurus(kapakBeats);
  const tK = c.vurus(b);
  const kapSure = o.kapSure ?? 9;
  const tEnd = c.vurus(b + kapSure);

  /** Bölümün sesi / anlatım kaydı */
  const ses = (pl, tBas) => {
    if (pl.s.ses) audio.push({ file: String(pl.s.ses), start: R2(tBas), volume: 1 });
    const metin = pl.s.anlatim || pl.s.soz;
    if (metin) anlatim.push({ t: R2(tBas), metin: String(metin) });
  };

  // ── yardımcı katmanlar ────────────────────────────────────────────────
  const fold = (t0, dur, ekstra = {}) => ({ fold: [k(t0, 0), k(t0 + dur, 1, 'linear')], ...ekstra });
  const kanat = (asset, per, faz = 0) => {
    const parts = {};
    for (const nm of lib.get(asset)?.parts || []) {
      if (/wing|kanat/i.test(nm)) parts[nm] = { scaleY: 0.2, loops: [{ prop: 'scaleY', type: 'sine', amp: 0.8, period: per, phase: faz }] };
      else if (/tail|kuyruk/i.test(nm)) parts[nm] = { loops: [{ prop: 'rotation', type: 'sine', amp: 14, period: 0.35 }] };
    }
    return Object.keys(parts).length ? { parts } : {};
  };
  const var_ = (asset) => lib.has(asset);
  const ekle = (L) => (var_(L.asset) || L.type ? c.L(L) : null);

  /** Paralaks bant (dalga / dağ / tepe): aşağıdan yükselir, yatayda salınır. o: x, amp, per, n, t0, t1, depth, y0 (yükselme başlangıç farkı) */
  const bant = (id, asset, y, s, pal, oo = {}) => {
    const n0 = oo.n ?? 0;
    const t0 = oo.t0 ?? 0.1 + n0 * 0.18;
    const yy = [k(t0, (y + (oo.fark ?? 700)) * fy), k(t0 + 1.2, y * fy, 'outCubic')];
    return ekle({
      id, group: g, asset, ...(pal ? { palette: pal } : {}), x: (oo.x ?? 540) * fx, anchor: [0.5, 0], scale: R2(s * fx), y: oo.sabit ? y * fy : yy,
      ...(oo.depth != null ? { depth: oo.depth } : {}), ...(oo.t1 != null ? { end: R2(oo.t1) } : {}), ...(oo.basla != null ? { start: R2(oo.basla) } : {}),
      loops: oo.amp === 0 ? [] : [{ prop: 'x', type: 'sine', amp: oo.amp ?? 18, period: oo.per ?? 6, phase: n0 * 0.37 }, { prop: 'y', type: 'sine', amp: 6 + n0 * 2, period: 2.6 + n0 * 0.2, phase: n0 * 0.21 }],
    });
  };
  /** Bulut: yavaş süzülür */
  const bulut = (id, x0, x1, y, s, t0, oo = {}) => ekle({
    id, group: g, asset: 'bulut', ...(oo.pal ? { palette: oo.pal } : {}), x: [k(oo.zaman0 ?? 0, x0 * fx), k(oo.zaman1 ?? tEnd, x1 * fx, 'linear')], y: y * fy, scale: R2(s * fx),
    ...fold(t0, 1.2, { foldStyle: { order: oo.sira || 'left' } }), ...(oo.depth != null ? { depth: oo.depth } : {}), ...(oo.end != null ? { end: R2(oo.end) } : {}), ...(oo.basla != null ? { start: R2(oo.basla) } : {}),
  });
  /** Uçan kuş / kelebek: soldan sağa */
  const ucan = (id, asset, ta, tb, ya, yb, s, amp = 14, per = 0.6) => ekle({
    id, group: g, asset, start: R2(ta), end: R2(tb + 0.2), x: [k(ta, -150 * fx), k(tb, 1250 * fx, 'linear')], y: [k(ta, ya * fy), k(tb, yb * fy, 'inOutSine')], scale: R2(s * fx),
    ...fold(ta, 0.7), loops: [{ prop: 'y', type: 'sine', amp, period: 1.8 }, { prop: 'rotation', type: 'sine', amp: 4, period: 1.8, phase: 0.25 }], ...kanat(asset, per),
  });
  /** Yerde duran hayvan / nesne: aşağıdan çıkar (outBack), kuyruk sallar */
  const hayvan = (id, asset, x, y, s, t0, oo = {}) => ekle({
    id, group: g, asset, ...(oo.variant ? { variant: oo.variant } : {}), start: R2(t0), ...(oo.end != null ? { end: R2(oo.end) } : {}), x: typeof x === 'number' ? x * fx : x,
    y: oo.sabit ? y * fy : [k(t0, (y + 420) * fy), k(t0 + 1.0, y * fy, 'outBack')], anchor: [0.5, 1], scale: R2(s * fx), ...(oo.flipX ? { scaleX: -R2(s * fx) } : {}),
    ...(oo.depth != null ? { depth: oo.depth } : {}), ...kanat(asset, 0.5), ...(oo.ek || {}),
  });

  /** Altyazı: yumuşak kutuda, yazılarak belirir. renk: gokyuzu nesnesi */
  const altyazi = (id, metin, t0, t1, renk, oo = {}) => {
    const sm = sarMetin(metin, oo.sar ?? 26);
    const size = sigdirFont(sm, font, (oo.maxW ?? W * 0.88), oo.size ?? 58, false);
    return c.L({
      id, group: g, type: 'text', text: sm, font, weight: oo.weight ?? 600, size, color: renk.yazi, x: oo.x ?? W / 2, y: Math.round((oo.y ?? 0.74) * H), align: oo.align || 'center', lineHeight: 1.12,
      start: R2(t0), end: R2(t1),
      box: oo.kutu === false ? undefined : { color: oo.kutuRenk || (renk.kutu ?? 'rgba(255,255,255,0.8)'), radius: 28, shadow: false, padding: [14, 32] },
      reveal: [k(t0 + 0.15, 0), k(t0 + 0.15 + Math.min(1.6, 0.12 * sm.length), 1, 'linear')], ...(oo.ek || {}),
    });
  };



  /** Parıltı: bulanık yuvarlak ışık. o: opacity (sayı / iz), blur, t0, t1, depth, extra */
  const parilti = (id, x, y, boyut, renk, oo = {}) => c.sekil(id, 'daire', x, y, boyut, {
    t0: oo.t0 ?? 0, t1: oo.t1, renk, opacity: oo.opacity ?? 0.35, giris: 'yok', grup: g, depth: oo.depth, blur: oo.blur ?? 60, sx: oo.sx, sy: oo.sy, extra: oo.extra, anims: oo.anims,
  });

  /** Sinema altyazısı: kutusuz; koyu kontür + yumuşak gölge, arkasında bulanık koyu bant. renk: { yazi, golge } */
  const altyaziSinema = (id, metin, t0, t1, renk, oo = {}) => {
    const sm = sarMetin(metin, oo.sar ?? 26);
    const size = sigdirFont(sm, font, oo.maxW ?? W * 0.9, oo.size ?? 62, false);
    const y = Math.round((oo.y ?? 0.77) * H);
    if (oo.bant !== false) {
      c.sekil(`${id}-bant`, 'kare', W / 2, y, 200, { t0: t0 + 0.1, t1: t1 + 0.1, renk: renk.bant || '#000000', opacity: 0, giris: 'yok', grup: g, sx: (W * 1.2) / 200, sy: (size * (sm.split(String.fromCharCode(10)).length + 1.4)) / 200, blur: 38, extra: { opacity: [k(t0 + 0.1, 0), k(t0 + 0.7, oo.bantAlfa ?? 0.34, 'linear'), k(t1 - 0.3, oo.bantAlfa ?? 0.34, 'linear'), k(t1 + 0.1, 0, 'linear')], ...(oo.ekBant || oo.ek || {}) } });
    }
    return c.L({
      id, group: g, type: 'text', text: sm, font, weight: oo.weight ?? 600, size, color: renk.yazi, x: oo.x ?? W / 2, y, align: 'center', lineHeight: 1.14, start: R2(t0), end: R2(t1),
      stroke: { color: renk.kontur || 'rgba(10,14,30,0.75)', width: Math.round(size * 0.16) }, shadow: { color: renk.golge || 'rgba(0,0,0,0.5)', blur: 0, y: Math.round(size * 0.06) },
      reveal: [k(t0 + 0.15, 0), k(t0 + 0.15 + Math.min(1.8, 0.1 * sm.length), 1, 'linear')], opacity: [k(t0, 0), k(t0 + 0.25, 1, 'linear'), k(t1 - 0.3, 1, 'linear'), k(t1, 0, 'linear')], ...(oo.ek || {}),
    });
  };

  /** Başlık kartı: üst yazı + büyük başlık (parıltılı) + süs çizgisi/elmas + alt başlık. renk: { yazi, alt, golge, vurgu } */
  const baslikKarti = (renk, oo = {}) => {
    const tB = oo.tB ?? 0.9;
    const y0 = (oo.y ?? 0.17) * H;
    const bs = sigdirFont(brief.baslik || brief.ad, font, W * 0.84, oo.size ?? 170, false);
    const sm = sarMetin(brief.baslik || brief.ad, oo.sar ?? 14);
    const sat = sm.split(String.fromCharCode(10)).length;
    const tSon = tAc - 0.4;
    const cik = [k(tSon - 0.5, 1), k(tSon, 0)];
    if (brief.kanca) {
      c.L({ id: 'kanca', group: g, type: 'text', text: brief.kanca, font: oo.kancaFont || font, weight: 600, size: 44, color: renk.alt, x: W / 2, y: Math.round(y0 - bs * 0.85 * sat * 0.55 - 40), align: 'center', letterSpacing: 10, uppercase: true,
        start: R2(tB - 0.2), end: R2(tSon), opacity: [k(tB - 0.2, 0), k(tB + 0.6, 1), ...cik], reveal: [k(tB, 0), k(tB + 1.2, 1, 'linear')] });
    }
    if (oo.parilti !== false) {
      c.L({ id: 'baslik-isik', group: g, type: 'text', text: sm, font, weight: 800, size: bs, color: renk.vurgu || renk.yazi, x: W / 2, y: Math.round(y0), align: 'center', lineHeight: 1.02, blur: 26, start: R2(tB), end: R2(tSon),
        opacity: [k(tB, 0), k(tB + 0.9, 0.7), ...cik.map((e) => ({ ...e, v: e.v * 0.7 }))] });
    }
    c.L({ id: 'baslik', group: g, type: 'text', text: sm, font, weight: 800, size: bs, color: renk.yazi, x: W / 2, y: Math.round(y0), align: 'center', lineHeight: 1.02, start: R2(tB), end: R2(tSon),
      shadow: { color: renk.golge, blur: 0, y: Math.round(bs * 0.04) }, stroke: renk.kontur ? { color: renk.kontur, width: Math.round(bs * 0.1) } : undefined,
      opacity: [k(tB, 0), k(tB + 0.7, 1), ...cik], scale: [k(tB, 0.82), k(tB + 1.2, 1, 'outBack'), k(tSon, 1.06, 'linear')], reveal: [k(tB, 0), k(tB + 1.6, 1, 'linear')] });
    const yO = y0 + bs * 0.62 * sat + 34;
    c.sekil('baslik-cizgi', 'kare', W / 2, yO, 200, { t0: tB + 1.2, t1: tSon, renk: renk.alt, opacity: 0.8, giris: 'yok', grup: g, sx: [k(tB + 1.2, 0), k(tB + 2.0, (W * 0.5) / 200, 'outCubic')], sy: 3 / 200, extra: { opacity: [k(tB + 1.2, 0), k(tB + 1.6, 0.8, 'linear'), ...cik.map((e) => ({ ...e, v: e.v * 0.8 }))] } });
    c.sekil('baslik-elmas', 'elmas', W / 2, yO, 26, { t0: tB + 1.5, t1: tSon, renk: renk.alt, giris: 'yok', grup: g, extra: { scale: [k(tB + 1.5, 0), k(tB + 1.9, 0.13, 'outBack')] } });
    if (brief.altBaslik) {
      c.L({ id: 'alt-baslik', group: g, type: 'text', text: brief.altBaslik, font: oo.altFont || font, weight: 500, size: sigdirFont(brief.altBaslik, oo.altFont || font, W * 0.82, 64, false), color: renk.alt, x: W / 2, y: Math.round(yO + 70), align: 'center',
        start: R2(tB + 1.4), end: R2(tSon), opacity: [k(tB + 1.4, 0), k(tB + 2.0, 1), ...cik], reveal: [k(tB + 1.5, 0), k(tB + 2.8, 1, 'linear')], shadow: { color: renk.golge, blur: 0, y: 3 } });
    }
    c.bolum(0, 'Açılış');
  };

  /** Sinematik açılış: başlık + alt başlık (kamera yakından açılırken). */
  const acilis = (renk, oo = {}) => {
    const tB = oo.tB ?? 1.0;
    const bs = sigdirFont(brief.baslik || brief.ad, font, W * 0.86, oo.size ?? 150, false);
    c.L({
      id: 'baslik', group: g, type: 'text', text: sarMetin(brief.baslik || brief.ad, 16), font, weight: 700, size: bs, color: renk.yazi, x: W / 2, y: Math.round((oo.y ?? 0.15) * H),
      shadow: { color: renk.golge, blur: 0, y: 6 }, start: R2(tB), end: R2(tAc), opacity: [k(tB, 0), k(tB + 0.6, 1), k(tAc - 0.5, 1), k(tAc, 0)], scale: [k(tB, 0.6), k(tB + 0.9, 1, 'outBack')],
    });
    if (brief.altBaslik) {
      c.L({
        id: 'alt-baslik', group: g, type: 'text', text: brief.altBaslik, font, weight: 500, size: sigdirFont(brief.altBaslik, font, W * 0.86, 62, false), color: renk.alt, x: W / 2, y: Math.round(((oo.y ?? 0.15) + 0.07) * H),
        start: R2(tB), end: R2(tAc), opacity: [k(tAc - 0.5, 1), k(tAc, 0)], reveal: [k(tB + 0.9, 0), k(tB + 2.4, 1, 'linear')],
      });
    }
    c.bolum(0, 'Açılış');
  };

  /** Kapanış: manzara kararır, hikâyenin sonu + soru + çağrı + takip. */
  const kapanis = (renk, oo = {}) => {
    const t0 = oo.t0 ?? tK;
    c.bolum(t0, 'Kapanış');
    c.sekil('kapanis-perde', 'kare', W / 2, H / 2, 200, { sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, renk: '#000000', giris: 'yok', t0, opacity: 0, grup: g, extra: { opacity: [k(t0, 0), k(t0 + 0.8, oo.perde ?? 0.5, 'linear')] } });
    c.slam('kapanis-son', brief.son || 'Son', t0 + 0.5, null, { y: H * 0.27, size: 150, maxW: W * 0.84, renk: '#ffffff', grup: g, font, upper: false, weight: 700, golge: false, giris: 'pop', sar: 16 });
    if (brief.soru) c.slam('kapanis-soru', brief.soru, t0 + 1.6, null, { y: H * 0.46, size: 80, maxW: W * 0.84, renk: renk.alt === '#ffffff' ? '#f5e6a8' : '#ffe9a8', grup: g, font, upper: false, weight: 600, golge: false, giris: 'yukari', sar: 22 });
    if (brief.cta) c.slam('kapanis-cta', brief.cta, t0 + 2.4, null, { y: H * 0.545, size: 64, maxW: W * 0.84, renk: '#ffffff', grup: g, font, upper: false, weight: 500, golge: false, giris: 'yukari' });
    if (brief.takip !== false) c.takip(t0 + 3, null, { grup: g, y: 0.7 });
    c.L({ id: 'kapanis-yildiz', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: R2(t0 + 0.5), end: R2(tEnd), count: 40, prewarm: true, opacity: 0.8 });
  };

  /** Gökyüzü arka planı: noktalar [{ t, bg: [4 renk] }] → renkler yumuşak geçer. */
  const gokyuzu = (noktalar, oo = {}) => {
    const kanallar = [0, 1, 2, 3].map((q) => {
      const tr = [];
      noktalar.forEach((nk, j) => {
        if (j) tr.push(k(nk.t - (oo.sure ?? 1.4), noktalar[j - 1].bg[q], 'linear'));
        tr.push(k(nk.t, nk.bg[q], j ? 'inOutSine' : undefined));
      });
      return tr;
    });
    return { type: 'linear', colors: kanallar, angle: oo.aci ?? 180, paper: oo.kagit ?? 0.5, vignette: oo.vinyet ?? 0.18 };
  };

  const bitir = (ek, renk) => {
    const sc = c.bitir2(brief.ad, tEnd, ek);
    if (sc.sections) sc.sections.sort((a, b) => a.t - b.t);
    if (audio.length) sc.audio = [...audio, ...(sc.audio || []).map((a) => ({ ...a, volume: Math.min(a.volume, 0.3) }))];
    if (anlatim.length) sc.meta = { anlatim };
    if (renk) sc.theme = { ...sc.theme, colors: { ...sc.theme.colors, baslik: renk.yazi, metin: renk.alt } };
    return sc;
  };

  return { c, W, H, k, m, p, fx, fy, lib, font, hik, n, planlar, tAc, tK, tEnd, g, fold, kanat, bant, bulut, ucan, hayvan, altyazi, acilis, kapanis, gokyuzu, ses, bitir, ekle, varlikBoyut, parilti, altyaziSinema, baslikKarti };
}
