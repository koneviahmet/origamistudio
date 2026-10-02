// Ders videolarına simülasyon bölümü eklemek için ortak yardımcılar (JSON ile yönetilen simülasyonlar; şema §16).
// Üreteç betiği kendi yardımcılarını (L, M, T, hap, AN, k, r2, ETIKET …) verir:
//   const S = simKit({ L, M, T, hap, AN, k, r2, BUTTER, CORAL, HILITE, INK, F_BASLIK }, { SURE });
//   const z = S.zc(t0); z.set(t, {…}); z.git(t, dur, {…}, 'inOutCubic');
//   S.SIM('id', 'grup', 'slug', t0, t1, z);      // çerçevesiz, şeffaf, boyalı simülasyon + giriş pırıltısı
//   S.ALT('id', 'grup', 'metin', t0, t1, renk);  // alt bilgi hapı        S.BASLIK(...) üst başlık hapı
// Aynı kit scripts/scenes-dunya-komsular.mjs içinde elle yazılmıştı; yeni videolarda bunu kullan.
export function simKit(H, o = {}) {
  const { L, M, T, hap, AN, k, r2, BUTTER, CORAL, HILITE, F_BASLIK } = H;
  const CX = o.CX ?? 1300, CY = o.CY ?? 575, CW = o.CW ?? 1240, CH = o.CH ?? 800;

  /** Zaman çizelgesi kurucu: t'ler SAHNE saniyesidir; katman başına göre çevrilir. */
  function zc(t0) {
    const arr = [], cur = {};
    const rel = (t) => r2(Math.max(0, t - t0));
    return {
      cur,
      /** anında / basamaklı değer (metin, bool, dizi; sayı ise o anda sıçrar) */
      set(t, props) { arr.push({ t: rel(t), ...props }); Object.assign(cur, props); },
      /** sayıları `dur` boyunca kaydır (önceki değerden) */
      git(t, dur, props, easeAd = 'inOutCubic') {
        const hold = {};
        for (const key of Object.keys(props)) if (typeof cur[key] === 'number') hold[key] = cur[key];
        if (Object.keys(hold).length) arr.push({ t: rel(t), ...hold });
        arr.push({ t: rel(t + dur), ...props, ease: easeAd });
        Object.assign(cur, props);
      },
      out: () => [...arr].sort((a, b) => a.t - b.t),
    };
  }

  /** Simülasyon katmanı: şeffaf, gölgesiz, `boya` ile çizim stiline uyar; girişte zıplar + pırıltı patlar. */
  const SIM = (id, g, slug, t0, t1, kz, opt = {}) => {
    const x = opt.x ?? CX, y = opt.y ?? CY;
    const kontrol = [{ t: 0, boya: opt.boya ?? 0.85 }, ...kz.out()];
    if (opt.pirilti !== false) L({ id: `${id}-pirilti`, group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'patlama', x, y, start: r2(t0 + 0.25), end: r2(t0 + 2.6), colors: [BUTTER, '#fff6b8', CORAL, '#ffffff'], count: 28, sfx: false });
    return L({
      id, group: g, type: 'media', sim: slug, x, y, width: opt.w ?? CW, height: opt.h ?? CH, radius: 0, shadow: false, border: 0, kalite: opt.kalite ?? 1,
      start: r2(t0), end: r2(t1), kontrol,
      anims: opt.anims || [AN('zipla-gir', t0, 0.8), ...(opt.cikis === false ? [] : [AN('kuculerek-cik', t1 - 0.5, 0.45)])],
    });
  };

  /** Alt bilgi hapı */
  const ALT = (id, g, text, t0, t1, renk = HILITE, size = 40) => T(id, g, text, CX, 997, size, t0, t1, {
    font: F_BASLIK, weight: 900, anim: false, giris: 'belir', box: { color: renk, radius: 26, padding: [8, 30], opacity: 1 },
  });

  /** Üst başlık hapı */
  const BASLIK = (id, g, text, t0, t1, renk) => hap(id, g, text, CX - 150, 188, Math.max(420, text.length * 29), 40, renk, t0, t1, { h: 78, t: { font: F_BASLIK, weight: 900 } });

  return { zc, SIM, ALT, BASLIK, CX, CY, CW, CH, M };
}
