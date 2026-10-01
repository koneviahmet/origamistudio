// Karşılaştırma: ekran ikiye bölünür (Mit ↔ Gerçek, Önce ↔ Sonra, A ↔ B); her turda üst ve alt cümle sırayla çarpar, ortada VS damgası atar.
import { gerekli } from './lib.mjs';
import { reels, sarMetin, sigdirFont, yaziRengi } from './reels.mjs';

export default {
  id: 'karsilastir',
  ad: 'Karşılaştırma (A ↔ B)',
  etiket: 'Mit · Gerçek · Önce/Sonra',
  sure: '15–30 sn',
  aciklama: 'Ekran ikiye bölünür. Üstte yanlış / eski / A, altta doğru / yeni / B. Her turda iki cümle sırayla çarpar, ortadaki VS damgası vurur; ✕ ve ✓ işaretleri düşer.',
  ornek: {
    sablon: 'karsilastir', id: 'sablon-karsilastir', ad: 'Mit mi Gerçek mi?', format: 'reels', palet: 'canli', muzik: 'hype-132', font: 'Anton',
    ustBaslik: 'MİT', altBaslik: 'GERÇEK',
    turlar: [
      { ust: 'Kediler süt ister', alt: 'Çoğu kedi laktoz intoleranslıdır' },
      { ust: 'Altın balık 3 saniye hatırlar', alt: 'Aylarca hatırlayabilirler' },
      { ust: 'Şimşek aynı yere düşmez', alt: 'Aynı yere defalarca düşebilir' },
    ],
    sonuc: 'Sen kaçını bildin?',
    yayin: { baslik: 'Mit mi gerçek mi? Sen kaçını biliyordun?', aciklama: 'Yıllardır doğru sandığımız üç yanlış. Kaç tanesini biliyordun? Yorumlarda söyle!', etiketler: ['mitgercek', 'bilgi', 'reels', 'shorts', 'ilginc'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'turlar'], 'karsilastir');
    const c = reels(brief, { palet: 'canli', muzik: 'hype-132', font: 'Anton' });
    const { W, H, k, m } = c;
    const turlar = brief.turlar;
    const n = turlar.length;
    const TB = 8;
    const vuruslar = [];
    const topRenk = brief.ustRenk || c.zemin(0); // üst: kırmızımsı
    const altRenk = brief.altRenk || c.zemin(3); // alt: yeşilimsi
    const ustYazi = yaziRengi(topRenk);
    const altYazi = yaziRengi(altRenk);

    // açılış 4 vuruş
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    const ra = c.yigin('acilis', brief.ad, 0, { i: 1, grup: gA, y: 0.46, yuk: 0.6, dekor: 'halkalar' });
    vuruslar.push(...ra.vuruslar);
    let b = ra.beats;
    const tBas = c.vurus(b);
    const tSon = c.vurus(b + n * TB);

    // iki yarı panel
    const gP = c.grup('g-paneller', 'Paneller', true);
    const panel = (id, y, renk, t0) => c.sekil(id, 'kare', W / 2, y, 200, {
      sx: (W * 1.1) / 200, sy: H / 2 / 200, t0, t1: tSon, renk, giris: 'yok', grup: gP,
      extra: { y: [k(t0 - 0.3, y + (y < H / 2 ? -H / 2 : H / 2)), k(t0 + 0.15, y, 'outCubic')] },
    });
    panel('panel-ust', H / 4, topRenk, tBas);
    panel('panel-alt', (H * 3) / 4, altRenk, tBas);
    c.flas('panel-flas', tBas, { alfa: 0.5 });

    // VS damgası (ortada, sürekli nabız)
    c.sekil('vs-s', 'patlama', W / 2, H / 2, m * 0.25, {
      t0: tBas + 0.1, t1: tSon, renk: '#ffe600', grup: gP, rot: -8,
      anims: [{ preset: 'ritimle-nabiz', t: tBas + 0.6, genlik: 0.09 }, { preset: 'don', t: tBas + 0.6, periyot: 14 }],
    });
    c.slam('vs-t', 'VS', tBas + 0.15, tSon, { y: H / 2, size: m * 0.095, sabit: true, giris: 'pop', renk: '#10101c', golge: false, font: c.font, grup: gP });

    // etiketler
    c.hap('etiket-ust', brief.ustBaslik || 'A', tBas + 0.2, tSon, W * 0.24, H * 0.115, { zemin: '#10101c', renk: '#ffffff', size: m * 0.05, grup: gP, giris: 'sol' });
    c.hap('etiket-alt', brief.altBaslik || 'B', tBas + 0.35, tSon, W * 0.76, H * 0.57, { zemin: '#10101c', renk: '#ffffff', size: m * 0.05, grup: gP, giris: 'sag' });

    turlar.forEach((tr, i) => {
      const t0 = c.vurus(b + i * TB);
      const t1 = c.vurus(b + (i + 1) * TB);
      const g = c.grup(`g-tur${i + 1}`, `Tur ${i + 1}`);
      c.bolum(t0, `Tur ${i + 1}`);
      const tUst = c.vurus(b + i * TB + 1);
      const tAlt = c.vurus(b + i * TB + 4);
      vuruslar.push(t0, tUst, tAlt, c.vurus(b + i * TB + 6));
      if (i) c.silme(`silme-${i}`, t0, i % 2 ? '#ffffff' : '#10101c', { sure: 0.42, yon: i % 2 ? 'sag' : 'sol' });

      const yaz = (id, metin, t, y, renk, giris, rot) => {
        const s = sarMetin(metin, 17);
        const size = sigdirFont(s, c.govde, W * 0.84, 112, false);
        return c.slam(id, s, t, t1, { y, font: c.govde, upper: false, weight: 800, size, sabit: true, maxW: W * 0.86, renk, grup: g, giris, lh: 1.08, golge: false, rot });
      };
      yaz(`t${i + 1}-ust`, tr.ust, tUst, H * 0.28, ustYazi, 'sol', -1.5);
      yaz(`t${i + 1}-alt`, tr.alt, tAlt, H * 0.72, altYazi, 'sag', 1.5);
      // ✕ üstte, ✓ altta
      const xs = m * 0.12;
      [45, -45].forEach((r, j) => c.sekil(`t${i + 1}-x${j}`, 'kare', W * 0.84, H * 0.17, 200, { sx: (xs * 1.1) / 200, sy: (xs * 0.2) / 200, rot: r, t0: tUst + 0.25, t1, renk: '#ffffff', grup: g }));
      c.sekil(`t${i + 1}-tik`, 'tik', W * 0.84, H * 0.83, m * 0.13, { t0: tAlt + 0.25, t1, renk: '#ffffff', grup: g });
      c.halka(`t${i + 1}-h1`, tUst, W / 2, H * 0.3, '#ffffff', { group: g, alfa: 0.35, boyut: m * 0.2, son: m * 1.2, sure: 0.5 });
      c.halka(`t${i + 1}-h2`, tAlt, W / 2, H * 0.7, '#ffffff', { group: g, alfa: 0.35, boyut: m * 0.2, son: m * 1.2, sure: 0.5 });
    });

    // sonuç / kapanış
    const tK = c.vurus(b + n * TB);
    const tEnd = c.vurus(b + n * TB + 6);
    c.silme('silme-son', tK, '#10101c');
    c.kapanis(tK, tEnd, brief.sonuc || 'Sen kaçını bildin?', brief.alt, { i: 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(b + n * TB + j));

    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan([{ t: 0, i: 1 }, { t: tK, i: 2 }]),
      camera: c.kameraVurus(vuruslar, { zoom: 0.035, egim: 0.6 }),
    });
  },
};
