// Karakter şablonlarının ortak yapı taşları: reels() bağlamı + karakter yerleşimi + diyalog + kapanış.
//
//   const c = karakterKur(brief, { palet: 'pastel', muzik: 'pop-120', font: 'Baloo 2' });
//   const ogr = c.karakter(brief.karakterA, 'copadam', { id: 'ogretmen', konum: 'sol', varyant: brief.varyantA || 'ogretmen', start: 0.3 });
//   const d = c.konus({ ogr, can }, [{ kim: 'ogr', metin: '…' }], t0);       // diyalog() + süre bilgisi
//   c.snap(t)  → t'den sonraki ilk vuruş (kartlar vuruşa oturur)
//   c.kapanisKar(t0, t1, cta, alt, [karakterler])
//
// Dikey 1080×1920 düzeni: üst %5–%46 kartlar / metin, alt %56–%93 karakterler (boy ≈ %31), konuşma balonu karakterin başının üstünde.
import { reels, sarMetin, sigdirFont, yaziRengi } from './reels.mjs';
import { karakterBaglam, diyalog, karakterleriOku } from '../lib/karakter.mjs';
import { speechDur } from '../../web/src/engine/character.js';

export { sarMetin, sigdirFont, yaziRengi };
// Karakterler içeriğin önüne geçmesin: tüm boylar bu çarpanla küçülür (içerik kartları / grafikler ana öğedir)
export const OLCEK = 0.85;
export const R2 = (n) => Math.round(n * 100) / 100;

export function karakterKur(brief, d = {}) {
  const c = reels(brief, d);
  const { W, H, k, m } = c;
  const docs = Object.fromEntries(karakterleriOku().map((x) => [x.id, x]));
  const K = karakterBaglam({ W, H });
  const iyi = (x) => /^[\w-]+$/.test(x || '');

  // Baloo 2 başlıkları kalın olsun (reels() yalnızca bazı fontlara 800 verir)
  const slam0 = c.slam;
  c.slam = (id, text, t0, t1, op = {}) => slam0(id, text, t0, t1, { ...(((op.font || c.font) === 'Baloo 2') ? { weight: 800 } : {}), ...op });

  c.snap = (t) => c.vurus(Math.max(0, Math.ceil((t - c.off) / c.p - 1e-6)));
  c.sure = (metin, sure) => R2(speechDur({ metin, sure }));
  c.hepsi = [];

  /**
   * Karakteri sahneye ekler. adi = kullanıcının seçtiği karakter (yoksa yedek), over.varyant geçersizse varsayılan görünüm.
   * konum: ad ya da fx (0–1); ayak ucu y = 0.93H. over.boy varsayılanı 0.31.
   */
  c.karakter = (adi, yedek, over = {}) => {
    const id = docs[adi] ? adi : yedek;
    const doc = docs[id];
    const { konum = 'orta', varyant, ekler, ...rest } = over;
    const o = { boy: 0.33, giris: 'zipla-gir', ...rest };
    o.boy = Math.round(o.boy * OLCEK * 1000) / 1000;
    o.konum = Array.isArray(konum) ? konum : typeof konum === 'number' ? [konum, 0.80] : konum;
    if (!Array.isArray(o.konum)) o.konum = [({ orta: 0.5, sol: 0.27, sag: 0.73, 'sol-ic': 0.36, 'sag-ic': 0.64, 'sol-uc': 0.16, 'sag-uc': 0.84 })[o.konum] ?? 0.5, 0.80];
    if (varyant && doc.varyantlar?.[varyant]) o.varyant = varyant;
    if (Array.isArray(ekler)) {
      const var_ = (doc.ekler || []).map((e) => e.id);
      const ok = ekler.filter((e) => var_.includes(e));
      if (ok.length) o.ekler = ok;
    }
    const l = K(id, o);
    c.L(l);
    c.hepsi.push(l);
    return l;
  };

  /** diyalog() + (t0 → bitiş) — satırlar: [{ kim: 'ad', metin, duygu, aksiyon, tepki, sure … }]; layers: { ad: katman } */
  c.konus = (layers, satirlar, t0, opts = {}) => diyalog(layers, satirlar, { t0, ...opts });

  /** Karakterlere akış parçası ekler */
  c.akis = (l, parca) => {
    (l.akis ||= []).push(parca);
    l.akis.sort((a, b) => a.t - b.t);
  };

  /** Üst köşede "n / N" gibi küçük etiket (hap) */
  c.etiket = (id, metin, t0, t1, o = {}) => c.hap(id, metin, t0, t1, o.x ?? W / 2, o.y ?? H * 0.115, {
    zemin: o.zemin ?? c.vurgu(o.i ?? 0), renk: o.renk ?? yaziRengi(o.zemin ?? c.vurgu(o.i ?? 0)), size: o.size ?? Math.round(m * 0.04), grup: o.grup, font: c.govde, weight: 800,
  });

  /**
   * Kart: kutulu metin (beyaz zemin, koyu yazı; ya da renkli). o: y, size, sar, zemin, renk, giris, grup
   */
  c.kart = (id, metin, t0, t1, o = {}) => {
    const sar = o.sar ?? 20;
    const satir = sarMetin(metin, sar);
    const size = o.sabit ? o.size : sigdirFont(satir, o.font || c.font, W * (o.maxW ?? 0.78), o.size ?? 120, o.upper ?? false);
    return c.slam(id, satir, t0, t1, {
      y: o.y ?? H * 0.2, x: o.x, size, sabit: true, upper: o.upper ?? false, font: o.font || c.font, weight: o.weight ?? 800, renk: o.renk ?? '#1b1b2b',
      giris: o.giris ?? 'asagi', lh: 1.1, grup: o.grup, golge: false, harf: 0, rot: o.rot,
      kutu: { color: o.zemin ?? '#ffffff', radius: size * 0.32, padding: [size * 0.34, size * 0.5], shadow: true },
    });
  };

  /**
   * Kapanış: karakterler sahnede KALIR (el sallar); üstte çağrı + takip logoları. Tam ekran silme + konfeti.
   */
  c.kapanisKar = (t0, t1, cta, alt, kars = [], o = {}) => {
    const g = c.grup('g-kapanis', 'Kapanış', true);
    const vur = o.vurgu || c.vurgu(o.i ?? 0);
    c.bolum(t0, 'Kapanış');
    c.flas('kapanis-flas', t0, { alfa: 0.55 });
    c.dekor(o.dekor || 'patlama', t0, t1, vur, { grup: g, alfa: 0.2 });
    c.slam('kapanis-cta', cta || 'Takip et!', t0 + 0.05, t1, { y: H * 0.18, size: 210, maxW: W * 0.86, renk: c.yazi(o.i ?? 0), sar: 16, grup: g, nabiz: 0.03, lh: 0.95, weight: 800, font: c.font });
    c.sekil('kapanis-cizgi', 'kare', W / 2, H * 0.255, 200, { sx: [k(t0 + 0.3, 0), k(t0 + 0.7, (W * 0.5) / 200, 'outCubic')], sy: 0.05, t0: t0 + 0.3, t1, renk: vur, giris: 'yok', grup: g });
    if (brief.takip !== false) c.takip(t0 + 0.45, t1, { grup: g, y: 0.33 });
    else if (alt) c.hap('kapanis-alt', alt, t0 + 0.45, t1, W / 2, H * 0.36, { zemin: vur, renk: yaziRengi(vur), grup: g, size: Math.round(m * 0.05), nabiz: 0.03 });
    c.L({ id: 'kapanis-konfeti', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: Math.round(H * 0.4), start: R2(t0 + 0.15), end: R2(t1) });
    c.L({ id: 'kapanis-yildiz', group: g, type: 'particles', particle: 'yildiz-yagmuru', mode: 'surekli', start: R2(t0 + 0.8), end: R2(t1), opacity: 0.8 });
    kars.forEach((l, i) => c.akis(l, { t: R2(t0 + 0.1 + i * 0.15), aksiyon: i ? 'sevin' : 'sunum', duygu: i ? 'cok-mutlu' : 'heyecanli', bak: 'ileri' }));
  };

  /** Çizim sırası: şekiller / dekor → karakterler → metin, grafik, cihaz, ok, parçacık (metin hiçbir zaman karakterin arkasında kalmaz) */
  const bitir2 = c.bitir2;
  c.bitir2 = (...a) => {
    const ids = new Set(c.hepsi.map((l) => l.id));
    const rest = c.layers.filter((l) => !ids.has(l.id));
    const sekil = rest.filter((l) => !l.type && l.asset);
    const ust = rest.filter((l) => !(!l.type && l.asset));
    c.layers.length = 0;
    c.layers.push(...sekil, ...c.hepsi, ...ust);
    return bitir2(...a);
  };

  return c;
}

export const iyiMi = (x) => typeof x === 'string' && x.length > 0;
