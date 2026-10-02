// Gözlü · HABER BÜLTENİ: Gözlü kravatlı bir sunucu; elinde mikrofon, üstte canlı yayın rozeti. Her haberde kırmızı manşet kartı, ardından grafik ya da büyük sayaç çarpar,
// Gözlü grafiğe işaret eder, rakam geldiğinde şaşırır. Haftalık özet, piyasa, spor, teknoloji, "rakamlarla" videoları için.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

export default {
  id: 'gozlu-haber',
  ad: 'Gözlü · Haber bülteni (manşet + grafik / sayaç)',
  etiket: 'Haber · Veri · Finans · Gözlü',
  sure: '40–70 sn',
  aciklama: 'Kravatlı Gözlü mikrofonla haber sunar: canlı yayın rozeti, kırmızı manşet kartı, ardından grafik ya da dev sayaç. Gözlü grafiğe işaret eder, rakam gelince şaşırır. Haftalık özet ve "rakamlarla" videoları.',
  ornek: {
    sablon: 'gozlu-haber', id: 'sablon-gozlu-haber', ad: 'Haftanın Rakamları', format: 'reels', palet: 'mono', muzik: 'trap-140', font: 'Baloo 2',
    kanal: 'GÖZLÜ TV', varyant: 'kirmizi', ekler: ['kravat', 'sac-kisa'], hook: 'Bu hafta *rakamlar* konuşuyor', selam: 'İyi akşamlar! Haftanın özeti başlıyor.',
    haberler: [
      { baslik: 'Elektrikli araç satışları rekor kırdı', rakam: { sayi: 412, birim: 'bin', etiket: 'adet satıldı', onek: '' }, soz: 'Rekor satış: tam 412 bin araç!' },
      { baslik: 'Yıllara göre kullanıcı sayısı', grafik: { tur: 'bar', birim: 'M', veri: [{ label: '2021', value: 12 }, { label: '2022', value: 31 }, { label: '2023', value: 58 }, { label: '2024', value: 96 }] }, soz: 'Kullanıcı sayısı dört yılda sekiz katına çıktı.' },
      { baslik: 'Okuma alışkanlığı yükselişte', rakam: { sayi: 38, birim: '%', etiket: 'daha fazla kitap okundu', onek: '+' }, soz: 'Okuyan kişi sayısı yüzde 38 arttı. Güzel haber!' },
    ],
    cta: 'Haftalık özet için takip et',
    yayin: { baslik: 'Haftanın rakamları: bülten 📰', aciklama: 'Gözlü ile 3 haberde haftanın öne çıkan rakamları: araç satışları, kullanıcı büyümesi ve okuma alışkanlığı. Her hafta için takip et!', etiketler: ['haber', 'rakamlar', 'bulten', 'veri', 'ekonomi', 'teknoloji', 'animasyon', 'shorts', 'reels', 'haftalikozet'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'haberler'], 'gozlu-haber');
    const c = karakterKur(brief, { palet: 'mono', muzik: 'trap-140', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const B = brief.haberler.slice(0, 4);
    const n = B.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];
    const KIRMIZI = '#e11d48';

    const goz = c.karakter('gozlu', 'gozlu', { id: 'sunucu', konum: 'orta', varyant: brief.varyant || 'kirmizi', ekler: brief.ekler || ['kravat', 'sac-kisa'], start: 0.3, boy: 0.25, akis: [{ t: 0.3, aksiyon: 'bekle', tutar: { nesne: 'mikrofon', el: 'R' } }] });

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    c.akis(goz, { t: 0.5, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.0 });
    const dA = c.konus({ goz }, [{ kim: 'goz', metin: brief.selam || 'İyi akşamlar! Bülten başlıyor.', duygu: 'mutlu', aksiyon: 'anlat', sure: 2.8 }], 1.0, { bak: false });
    const introBeat = Math.round((c.snap(dA.bitis + 0.3) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || 'Bu hafta *rakamlar* konuşuyor', 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'seritler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    let t = ra.t1;

    // ── haberler ─────────────────────────────────────────────────────────
    B.forEach((h, i) => {
      const bi = i + 1;
      const g = c.grup(`g-haber${bi}`, `${bi}. haber`);
      const vur = c.vurgu(bi);
      const yaz = c.yazi(bi);
      const soz = h.soz || h.baslik;
      const tE = c.snap(t + 1.2 + Math.max(3.8, c.sure(soz)) + 1.6);
      c.bolum(t, h.baslik);
      bgler.push({ t, i: bi });
      c.silme(`silme-h${bi}`, t, KIRMIZI, { yon: 'sol', sure: 0.5 });
      c.dekor('halkalar', t, tE, vur, { grup: g, id: `h${bi}-dekor`, alfa: 0.1 });
      // canlı rozeti + haber no
      c.sekil(`h${bi}-nokta`, 'daire', W * 0.11, H * 0.115, m * 0.03, { t0: t + 0.2, t1: tE, renk: KIRMIZI, grup: g, anims: [{ preset: 'ritimle-nabiz', t: t + 0.6, genlik: 0.3 }] });
      c.hap(`h${bi}-canli`, `${brief.kanal || 'GÖZLÜ TV'} · CANLI`, t + 0.25, tE, W * 0.34, H * 0.115, { zemin: '#10101c', renk: '#ffffff', size: Math.round(m * 0.036), grup: g, font: c.govde, weight: 800 });
      c.hap(`h${bi}-no`, `HABER ${bi}/${n}`, t + 0.3, tE, W * 0.8, H * 0.115, { zemin: KIRMIZI, renk: '#ffffff', size: Math.round(m * 0.032), grup: g, font: c.govde, weight: 800 });
      // manşet
      c.kart(`h${bi}-mansetm`, h.baslik, c.snap(t + 0.4), tE, { y: H * 0.175, size: 58, sar: 30, grup: g, giris: 'sol', maxW: 0.86, zemin: KIRMIZI, renk: '#ffffff', weight: 800 });
      const tG = c.snap(t + 1.2);
      let hedef = null;
      if (h.grafik) {
        hedef = `h${bi}-grafik`;
        c.L({
          id: hedef, group: g, type: 'chart', kind: h.grafik.tur || 'bar', title: '', unit: h.grafik.birim || '', width: 860, height: 300, x: W / 2, y: Math.round(H * 0.295),
          data: h.grafik.veri, card: true, textColor: '#1b1b2b', stagger: 0.5, start: R2(tG), end: R2(tE),
          anims: [{ preset: 'katlanarak-gir', t: R2(tG), dur: 1.8 }, { preset: 'kuculerek-cik', t: R2(tE - 0.3), dur: 0.3 }],
        });
      } else if (h.rakam) {
        const r = h.rakam;
        hedef = `h${bi}-sayi`;
        c.sayac(hedef, 0, r.sayi, tG, 1.5, { y: H * 0.285, size: 280, renk: yaz, grup: g, t1: tE, prefix: r.onek || '', suffix: r.birim ? (r.birim === '%' ? '%' : ` ${r.birim}`) : '', maxW: W * 0.84, sep: '.', font: c.font });
        if (r.etiket) c.hap(`h${bi}-etiket`, r.etiket, c.snap(tG + 1.0), tE, W / 2, H * 0.355, { zemin: vur, renk: yaziRengi(vur), grup: g, size: Math.round(m * 0.038), upper: false });
      }
      const d = c.konus({ goz }, [{ kim: 'goz', metin: soz, duygu: h.rakam ? 'saskin' : 'mutlu', aksiyon: hedef ? 'isaret' : 'anlat', ...(hedef ? { hedef, bak: hedef } : {}), sure: Math.min(c.sure(soz), 5) }], R2(tG + 0.5), { bak: false });
      c.akis(goz, { t: R2(d.bitis + 0.1), aksiyon: 'anlat', duygu: 'mutlu', bak: 'ileri' });
      c.flas(`h${bi}-flas`, tG, { alfa: 0.25 });
      vuruslar.push(t, tG, c.snap(tG + 1.0));
      t = tE;
    });

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 1 });
    c.silme('silme-son', tK, c.vurgu(n + 1));
    c.kapanisKar(tK, tEnd, brief.cta || 'Haftalık özet için takip et', brief.alt, [goz], { i: n + 1 });
    c.akis(goz, { t: R2(tK + 0.1), aksiyon: 'el-salla', duygu: 'cok-mutlu', bak: 'ileri', tutar: null });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    c.ilerleme(0.4, tEnd - 0.2, { y: Math.round(H * 0.106) });
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
