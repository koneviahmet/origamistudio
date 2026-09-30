// Veri hikâyesi: başlık → her bölümde grafik + not → sonuç. Grafikler canlı çizilir.
import { baglam, gerekli, r2, clamp } from './lib.mjs';

export default {
  id: 'veri',
  ad: 'Veri hikâyesi (grafikli)',
  aciklama: 'Sayıları grafikle anlatır: sütun, yatay çubuk, çizgi, pasta, halka ve sayaç. Her bölümde grafik + bir cümlelik not.',
  ornek: {
    sablon: 'veri', id: 'sablon-veri', ad: 'Yıllık Büyüme', format: 'reels', tema: 'kurumsal-mavi', vurgu: '#ff7b00',
    altBaslik: '2021 – 2024',
    bolumler: [
      { baslik: 'Kullanıcı sayısı', grafik: { kind: 'bar', unit: 'B', title: 'Bin kullanıcı', data: [{ label: '2021', value: 12 }, { label: '2022', value: 31 }, { label: '2023', value: 58 }, { label: '2024', value: 96 }] }, not: 'Dört yılda sekiz kat büyüdük.' },
      { baslik: 'Gelir dağılımı', grafik: { kind: 'donut', data: [{ label: 'Abonelik', value: 55 }, { label: 'Reklam', value: 30 }, { label: 'Diğer', value: 15 }] }, not: 'Gelirin yarısından fazlası abonelikten.' },
      { baslik: 'Memnuniyet', grafik: { kind: 'sayac', unit: '%', data: [{ label: 'Memnun kullanıcı', value: 94 }], max: 100 }, not: 'Her 100 kullanıcıdan 94 tanesi tavsiye ediyor.' },
    ],
    sonuc: 'Büyümeye devam!',
  },
  uret(brief) {
    gerekli(brief, ['ad', 'bolumler'], 'veri');
    const c = baglam(brief, { tema: 'kurumsal-mavi' });
    const { W, H, dikey } = c;
    const cikisKay = { preset: 'kayarak-cik', dur: 0.45, yon: 'sol', mesafe: 700, ease: 'inCubic' };
    let t = 0;
    const gA = c.grup('g-acilis', 'Açılış', true);
    const tA = 3.2;
    c.bolum(0, 'Açılış');
    c.metin('acilis-baslik', gA, brief.ad, 0, tA, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.42), sar: dikey ? 14 : 26, maxW: W * 0.9,
      giris: [{ preset: 'harf-katla', t: 0.3, dur: 0.6, aralik: 0.05 }], cikis: [{ ...cikisKay, t: tA - 0.6 }],
    });
    if (brief.altBaslik) c.metin('acilis-alt', gA, brief.altBaslik, 0.6, tA, { stil: 'etiket-kutu', x: W / 2, y: c.Y(0.54, 0.6), giris: [], cikis: [], extra: { anims: [{ preset: 'zipla-gir', t: 0.8, dur: 0.5 }, { preset: 'sol', t: tA - 0.5, dur: 0.35 }] } });
    t = tA;
    const gec = ['kaydir', 'katlama', 'yakinlas', 'iris'];
    brief.bolumler.forEach((b, i) => {
      const dur = r2(clamp(5.4 + (b.not ? b.not.split(' ').length / 4 : 0), 5.4, 8));
      const t0 = t;
      const t1 = t + dur;
      const g = c.grup(`g-bolum${i + 1}`, `Bölüm ${i + 1}`);
      const gt = gec[i % gec.length];
      c.bolum(t0, b.baslik || `Bölüm ${i + 1}`);
      c.gecis(gt, t0, gt === 'yakinlas' ? 0.7 : 1.0, '$vurgu');
      c.metin(`b${i + 1}-baslik`, g, b.baslik || '', t0, t1, {
        stil: 'baslik-kalin', y: c.Y(0.13, 0.2), x: c.tx, maxW: c.tw, sar: dikey ? 22 : 16,
        giris: [{ preset: 'harf-zipla', t: t0 + 0.3, dur: 0.45, aralik: 0.035 }], cikis: [{ ...cikisKay, t: t1 - 0.6 }],
      });
      const gw = dikey ? Math.round(W * 0.88) : Math.round(W * 0.46);
      const gh = dikey ? Math.round(W * (b.grafik?.kind === 'sayac' ? 0.95 : 1.05)) : Math.round(H * 0.72);
      c.L({
        id: `b${i + 1}-grafik`, group: g, type: 'chart', x: c.ox, y: c.Y(0.46, 0.5), width: gw, height: gh,
        start: r2(t0), end: r2(t1), ...b.grafik,
        anims: [{ preset: 'katlanarak-gir', t: t0 + 0.6, dur: 2.4 }, { preset: 'sol', t: t1 - 0.5, dur: 0.35 }],
      });
      if (b.not) c.metin(`b${i + 1}-not`, g, b.not, t0, t1, { stil: 'alt-baslik', y: c.Y(0.78, 0.55), sar: dikey ? 28 : 26, reveal: [2.6, 1.2], giris: [] });
      t = t1;
    });
    const gK = c.grup('g-sonuc', 'Sonuç', true);
    c.bolum(t, 'Sonuç');
    c.gecis('perde', t, 1.2, '$vurgu');
    c.metin('sonuc', gK, brief.sonuc || 'Teşekkürler!', t, null, {
      stil: 'baslik-kalin', x: W / 2, y: c.Y(0.45), sar: dikey ? 14 : 26, maxW: W * 0.9,
      giris: [{ preset: 'harf-zipla', t: t + 0.5, dur: 0.45, aralik: 0.04 }], cikis: [],
    });
    c.L({ id: 'sonuc-konfeti', group: gK, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: c.Y(0.42), start: r2(t + 0.9) });
    if (brief.muzik !== false) c.sesEkle(brief.muzik);
    return c.bitir(brief.ad, t + 4);
  },
};
