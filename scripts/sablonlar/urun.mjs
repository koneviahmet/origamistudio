// Ürün / uygulama tanıtımı: marka açılışı → cihaz çerçevesi + özellik çağrıları (oklu) → çağrı (CTA).
// Derinlik: arka planda bulanık uzak nesneler, öndeki bokeh yıldızları; kamera yavaşça kayar (paralaks).
import { baglam, gerekli, kelimeSayisi, r2, clamp } from './lib.mjs';

export default {
  id: 'urun',
  ad: 'Ürün / uygulama tanıtımı',
  aciklama: 'Marka + slogan, cihaz çerçevesinde uygulama (ekran görüntüsü / video ya da sahte arayüz), özellik çağrıları ve son çağrı.',
  ornek: {
    sablon: 'urun', id: 'sablon-urun', ad: 'Not Defteri', format: 'reels', tema: 'kurumsal-mavi', vurgu: '#ff7b00',
    slogan: 'Fikirlerin hep yanında',
    cihaz: { frame: 'telefon', ui: 'liste', title: 'Notlarım', lines: ['Alışveriş listesi', 'Toplantı notları', 'Kitap önerileri', 'Seyahat planı', 'Yapılacaklar'] },
    ozellikler: [
      { baslik: 'Hızlı not', metin: 'Tek dokunuşla yaz, anında kaydet' },
      { baslik: 'Her yerde', metin: 'Telefon, tablet ve bilgisayarda senkron' },
      { baslik: 'Güvenli', metin: 'Notların şifreli saklanır' },
    ],
    cta: 'Ücretsiz dene', link: 'notdefteri.app',
  },
  uret(brief) {
    gerekli(brief, ['ad', 'ozellikler'], 'urun');
    const c = baglam(brief, { tema: 'kurumsal-mavi', stil: 'kagit-kesme' });
    const { W, H, dikey, m } = c;
    const oz = brief.ozellikler;
    const cikisKay = { preset: 'kayarak-cik', dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' };

    const tIntro = 3.6;
    const ozSure = oz.map((o) => r2(clamp(3 + kelimeSayisi(o.metin) / 3, 4, 6)));
    const tFeat = tIntro;
    const tCta = tFeat + ozSure.reduce((a, b) => a + b, 0);
    const sure = tCta + 4.2;

    // Arka plan derinliği: uzak, bulanık nesneler
    const gBg = c.grup('g-derinlik', 'Derinlik (paralaks)', true);
    const uzak = [['bulut', 0.12, 0.2, 0.7, 0.14], ['bulut', 0.85, 0.62, 0.55, 0.11], ['yildiz', 0.8, 0.14, 0.8, 0.06], ['kalp', 0.15, 0.78, 0.7, 0.07]];
    uzak.forEach(([asset, fx, fy, depth, boy], i) => {
      c.nesne(`uzak-${i + 1}`, gBg, asset, 0.2 + i * 0.3, null, Math.round(m * (0.22 + boy * 2)), {
        x: Math.round(W * fx), y: Math.round(H * fy), yasam: true,
        extra: { depth, blur: 6, opacity: 0.55 },
      });
    });
    // Öndeki bokeh (yakın, çok bulanık)
    [['yildiz', 0.92, 0.42, -0.6], ['yildiz', 0.06, 0.55, -0.5]].forEach(([asset, fx, fy, depth], i) => {
      c.nesne(`yakin-${i + 1}`, gBg, asset, 1 + i * 0.4, null, Math.round(m * 0.16), {
        x: Math.round(W * fx), y: Math.round(H * fy), yasam: true,
        extra: { depth, blur: 10, opacity: 0.45 },
      });
    });

    // Açılış
    const gA = c.grup('g-acilis', 'Açılış');
    c.bolum(0, 'Açılış');
    c.metin('marka', gA, brief.ad, 0, tIntro, {
      stil: 'baslik-modern', x: W / 2, y: c.Y(0.36, 0.42), maxW: W * 0.88, size: 170,
      giris: [{ preset: 'harf-katla', t: 0.3, dur: 0.6, aralik: 0.05 }], cikis: [{ ...cikisKay, t: tIntro - 0.6 }],
    });
    if (brief.slogan) c.metin('slogan', gA, brief.slogan, 0.8, tIntro, { stil: 'alt-baslik', x: W / 2, y: c.Y(0.46, 0.56), sar: dikey ? 26 : 40, maxW: W * 0.86, reveal: [0.4, 1.2], giris: [], cikis: [{ preset: 'sol', t: tIntro - 0.5, dur: 0.35 }] });

    // Cihaz — açılıştan sonra gelir ve kapanışa kadar kalır
    const gD = c.grup('g-cihaz', 'Cihaz');
    const cihaz = brief.cihaz || {};
    const dw = Math.round(cihaz.frame === 'laptop' || cihaz.frame === 'tarayici' ? (dikey ? W * 0.9 : W * 0.46) : dikey ? W * 0.52 : H * 0.42);
    c.L({
      id: 'cihaz', group: gD, type: 'device', frame: cihaz.frame || 'telefon', width: dw, x: c.ox, y: c.Y(dikey ? 0.42 : 0.5),
      ...(cihaz.src ? { src: cihaz.src } : { ui: cihaz.ui || 'liste', title: cihaz.title || brief.ad, lines: cihaz.lines }),
      ...(cihaz.url ? { url: cihaz.url } : {}), scroll: cihaz.scroll ?? 40,
      start: r2(tIntro - 0.8), end: r2(tCta),
      anims: [
        { preset: 'kayarak-gir', t: tIntro - 0.8, dur: 1.1, yon: 'alt', mesafe: 500, ease: 'outCubic' },
        { preset: 'suzul', t: tIntro + 0.4, genlik: 10, periyot: 3.4 },
        { preset: 'sol', t: tCta - 0.6, dur: 0.5 },
      ],
    });
    c.bolum(tFeat, 'Özellikler');
    let t = tFeat;
    oz.forEach((o, i) => {
      const t0 = t;
      const t1 = t + ozSure[i];
      const g = c.grup(`g-oz${i + 1}`, `Özellik ${i + 1}`);
      const ly = c.Y(0.76, 0.42);
      c.metin(`oz${i + 1}-baslik`, g, o.baslik, t0, t1, {
        stil: 'etiket-kutu', y: ly, giris: [], cikis: [], extra: { anims: [{ preset: 'zipla-gir', t: t0 + 0.2, dur: 0.5 }, { preset: 'sol', t: t1 - 0.45, dur: 0.35 }] },
      });
      c.metin(`oz${i + 1}-metin`, g, o.metin, t0, t1, { stil: 'alt-baslik', y: ly + Math.round(H * (dikey ? 0.065 : 0.1)), sar: dikey ? 26 : 24, reveal: [0.7, 1.0], giris: [] });
      c.L({
        id: `oz${i + 1}-ok`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `oz${i + 1}-baslik`, to: 'cihaz', start: r2(t0 + 0.5), end: r2(t1),
        fold: [c.k(t0 + 0.5, 0), c.k(t0 + 1.3, 1, 'inOutSine')], anims: [{ preset: 'sol', t: t1 - 0.45, dur: 0.35 }],
      });
      t = t1;
    });

    // CTA
    const gC = c.grup('g-cta', 'Çağrı');
    c.bolum(tCta, 'Çağrı');
    c.gecis('iris', tCta, 1.0, '$vurgu');
    c.metin('cta', gC, brief.cta || 'Hemen dene', tCta, null, {
      stil: 'baslik-modern', x: W / 2, y: c.Y(0.42, 0.45), sar: dikey ? 14 : 26, maxW: W * 0.88,
      giris: [{ preset: 'harf-zipla', t: tCta + 0.5, dur: 0.45, aralik: 0.04 }], cikis: [],
    });
    if (brief.link) c.metin('link', gC, brief.link, tCta + 1.2, null, { stil: 'etiket-kutu', x: W / 2, y: c.Y(0.54, 0.6), giris: [], cikis: [], extra: { anims: [{ preset: 'zipla-gir', t: tCta + 1.3, dur: 0.5 }, { preset: 'nabiz', t: tCta + 2.2 }] } });
    c.L({ id: 'cta-konfeti', group: gC, type: 'particles', particle: 'yildiz-yagmuru', mode: 'patlama', x: W / 2, y: c.Y(0.4), start: r2(tCta + 0.6) });

    if (brief.muzik !== false) c.sesEkle(brief.muzik);
    return c.bitir(brief.ad, sure, {
      // Yavaş kamera kayması: derinlikli katmanlar farklı hızda hareket eder
      camera: {
        zoom: [c.k(0, 1), c.k(sure * 0.5, 1.06, 'inOutSine'), c.k(sure, 1, 'inOutSine')],
        x: [c.k(0, W / 2 - W * 0.03), c.k(sure, W / 2 + W * 0.03, 'inOutSine')],
        y: H / 2,
      },
    });
  },
};
