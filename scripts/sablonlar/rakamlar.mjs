// Rakamlarla: her istatistik şerit silmesiyle gelir, dev sayaç vuruşa kadar sayar, çubuk dolar; sona sütun grafik ve çağrı eklenebilir.
import { gerekli } from './lib.mjs';
import { reels, sarMetin, sigdirFont, yaziRengi } from './reels.mjs';

export default {
  id: 'rakamlar',
  ad: 'Rakamlarla (sayaç)',
  etiket: 'Veri · İstatistik',
  sure: '15–30 sn',
  aciklama: 'Dev rakam sayarak yükselir, açıklama çarpar, ilerleme çubuğu dolar. İstatistik başına bir sahne; istersen sonda sütun grafik karşılaştırması.',
  ornek: {
    sablon: 'rakamlar', id: 'sablon-rakamlar', ad: 'Rakamlarla Büyüme', format: 'reels', palet: 'mono', muzik: 'house-126', font: 'Anton',
    istatistikler: [
      { deger: 250, birim: 'B', etiket: 'aktif kullanıcı', oran: 0.62 },
      { deger: 98, birim: '%', etiket: 'memnuniyet oranı', oran: 0.98 },
      { deger: 12, birim: 'ay', etiket: 'sürede 4 kat büyüme', oran: 0.4 },
    ],
    grafik: { baslik: 'Aylık kullanıcı (bin)', veri: [{ etiket: 'Oca', deger: 40 }, { etiket: 'Şub', deger: 90 }, { etiket: 'Mar', deger: 150 }, { etiket: 'Nis', deger: 250 }] },
    cta: 'Sen de katıl',
    yayin: { baslik: 'Rakamlarla büyüme hikâyemiz', aciklama: '12 ayda 4 kat büyüdük. Rakamlar yalan söylemez — sen de aramıza katıl!', etiketler: ['rakamlar', 'buyume', 'girisim', 'reels', 'shorts', 'istatistik'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'istatistikler'], 'rakamlar');
    const c = reels(brief, { palet: 'mono', muzik: 'house-126', font: 'Anton' });
    const { W, H, k, m } = c;
    const st = brief.istatistikler;
    const SB = 8;
    const vuruslar = [];
    const bgler = [];

    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    bgler.push({ t: 0, i: 0 });
    const ra = c.yigin('acilis', brief.ad, 0, { i: 0, grup: gA, y: 0.46, yuk: 0.6, dekor: 'elmaslar' });
    vuruslar.push(...ra.vuruslar);
    let b = ra.beats;

    st.forEach((s, i) => {
      const t0 = c.vurus(b + i * SB);
      const t1 = c.vurus(b + (i + 1) * SB);
      const bi = i + 1;
      const g = c.grup(`g-stat${i + 1}`, `${s.etiket || 'İstatistik ' + (i + 1)}`);
      c.bolum(t0, s.etiket || `İstatistik ${i + 1}`);
      bgler.push({ t: t0, i: bi });
      const yaz = c.yazi(bi);
      const vur = c.vurgu(bi);
      c.silme(`silme-${i + 1}`, t0, vur, { yon: i % 2 ? 'sag' : 'sol' });
      c.dekor(['halkalar', 'seritler', 'daireler'][i % 3], t0, t1, vur, { grup: g, id: `stat${i + 1}-dekor`, alfa: 0.18 });
      vuruslar.push(t0, c.vurus(b + i * SB + 2), c.vurus(b + i * SB + 4));
      if (s.ust) c.hap(`stat${i + 1}-ust`, s.ust, t0 + 0.25, t1, W / 2, H * 0.2, { grup: g, zemin: vur, renk: yaziRengi(vur), size: m * 0.045 });
      const sayiSure = c.p * 3;
      const deger = Number(s.deger);
      const ond = s.ondalik ?? (Number.isInteger(deger) ? 0 : 1);
      c.sayac(`stat${i + 1}-sayi`, 0, deger, t0 + 0.2, sayiSure, {
        y: H * 0.4, size: 520, prefix: s.onek || '', suffix: s.birim ? (/^[A-Za-zÇĞİÖŞÜçğıöşü]{2,}$/.test(s.birim) ? ` ${s.birim}` : s.birim) : '', renk: vur, grup: g, t1, ondalik: ond,
      });
      const tb = t0 + 0.2 + sayiSure;
      c.halka(`stat${i + 1}-h`, tb, W / 2, H * 0.4, vur, { group: g, alfa: 0.6, boyut: m * 0.3, son: m * 1.7, sure: 0.7 });
      c.L({ id: `stat${i + 1}-kivilcim`, group: g, type: 'particles', particle: 'kivilcim', mode: 'patlama', x: W / 2, y: Math.round(H * 0.4), start: Math.round(tb * 100) / 100, end: Math.round(t1 * 100) / 100 });
      if (s.etiket) {
        const et = sarMetin(s.etiket, 20);
        c.slam(`stat${i + 1}-etiket`, et, c.vurus(b + i * SB + 3), t1, { y: H * 0.585, font: c.govde, upper: false, weight: 800, size: 96, maxW: W * 0.86, renk: yaz, grup: g, giris: 'asagi', lh: 1.1, golge: false });
      }
      // ilerleme çubuğu
      const oran = Math.max(0.04, Math.min(1, s.oran ?? 0.8));
      const gen = W * 0.8;
      c.sekil(`stat${i + 1}-iz`, 'kare', W / 2, H * 0.7, 200, { sx: gen / 200, sy: 0.19, renk: yaz, opacity: 0.18, giris: 'yok', t0: c.vurus(b + i * SB + 3), t1, grup: g });
      c.L({
        id: `stat${i + 1}-cubuk`, group: g, asset: 'kare', x: W / 2 - gen / 2, y: Math.round(H * 0.7), scale: 1, anchor: [0, 0.5],
        scaleX: [k(c.vurus(b + i * SB + 3), 0), k(c.vurus(b + i * SB + 6), (gen * oran) / 200, 'outCubic')], scaleY: 0.19, palette: { a: vur },
        start: Math.round(c.vurus(b + i * SB + 3) * 100) / 100, end: Math.round(t1 * 100) / 100,
      });
    });
    b += st.length * SB;

    // grafik
    const gr = brief.grafik;
    if (gr && Array.isArray(gr.veri) && gr.veri.length) {
      const tG = c.vurus(b);
      const eG = c.vurus(b + 8);
      const gi = st.length + 1;
      const g = c.grup('g-grafik', 'Grafik');
      c.bolum(tG, 'Grafik');
      bgler.push({ t: tG, i: gi });
      c.silme('silme-grafik', tG, c.vurgu(gi));
      if (gr.baslik) c.slam('grafik-baslik', gr.baslik, c.vurus(b + 0.5), eG, { y: H * 0.2, font: c.govde, upper: false, weight: 800, size: 78, maxW: W * 0.86, renk: c.yazi(gi), grup: g, giris: 'pop', golge: false, sar: 24 });
      const w = Math.round(W * 0.88);
      const h = Math.round(H * 0.46);
      c.L({
        id: 'grafik', group: g, type: 'chart', kind: gr.tur || 'bar', width: w, height: h, x: W / 2, y: Math.round(H * 0.5),
        data: gr.veri.map((d, j) => ({ label: String(d.etiket), value: Number(d.deger), color: c.pal.acc[j % c.pal.acc.length] })),
        ...(gr.birim ? { unit: gr.birim } : {}), stagger: 0.6, card: false, textColor: c.yazi(gi),
        start: Math.round(c.vurus(b + 1) * 100) / 100, end: Math.round(eG * 100) / 100,
        anims: [{ preset: 'katlanarak-gir', t: c.vurus(b + 1), dur: c.p * 4 }],
      });
      vuruslar.push(tG, c.vurus(b + 1), c.vurus(b + 3), c.vurus(b + 5));
      b += 8;
    }

    const tK = c.vurus(b);
    const tEnd = c.vurus(b + 6);
    bgler.push({ t: tK, i: st.length + 2 });
    c.silme('silme-son', tK, c.vurgu(st.length + 2));
    c.kapanis(tK, tEnd, brief.cta || 'Takip et', brief.alt, { i: st.length + 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(b + j));

    return c.bitir2(brief.ad, tEnd, {
      background: c.arkaplan(bgler),
      camera: c.kameraVurus(vuruslar, { zoom: 0.04, egim: 0.6 }),
    });
  },
};
