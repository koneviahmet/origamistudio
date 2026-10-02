// Zaman tüneli · YIL SAYACI: enerjik, vuruşa oturan, dev tipografili zaman yolculuğu.
// Her dönem renkli bir şerit silmesiyle başlar; dev yıl sayacı önceki yıldan bu yıla SAYARAK akar (zaman geçiyor hissi), ad çarpar,
// renkli daire içinde nesne vuruşlarla zıplar, "damga" balonu patlar, bilgi satırları yanlardan çarpar, üstte ilerleme noktaları.
// Aynı brief'i zaman şablonu gibi okur (sayısal olmayan yıllar — "Bugün", "Eski çağ" — sayaçsız çarpar; "1890'lar" → 1890 + 'lar').
import { nesneSec, varlikBoyut } from './lib.mjs';
import { yaziRengi } from './reels.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

const yilCoz = (y) => {
  const m = String(y ?? '').trim().match(/^(\d{3,4})(\S*)$/);
  return m ? { sayi: parseInt(m[1], 10), ek: m[2] || '' } : null;
};

export default {
  id: 'zaman-sayac',
  ad: 'Zaman tüneli · Yıl sayacı',
  etiket: 'Hikâye · Tarihçe · Enerjik · Ritimli',
  sure: '35–80 sn',
  aciklama: 'Vuruşa oturan hızlı zaman yolculuğu: renkli şerit silmeleri, dev yıl sayacı önceki yıldan bu yıla sayarak akar, ad çarpar, nesne daire içinde zıplar, damga balonları ve çarpan bilgi satırları.',
  ornek: {
    sablon: 'zaman-sayac', id: 'sablon-zaman-sayac', ad: 'Telefonun Yolculuğu', format: 'reels', palet: 'canli', muzik: 'house-126', font: 'Anton', stil: 'duz',
    kanca: 'Tellerden cebe', baslik: 'Telefonun Yolculuğu', altBaslik: '150 yılda neler değişti', kapakNesne: 'cevirmeli-telefon',
    bolumler: [
      { yil: '1876', ad: 'İlk telefon', nesne: 'cevirmeli-telefon', balon: 'Alo!', bilgi: ['Bell sesi tel üzerinden iletir', 'Konuşma ilk kez mesafeyi aşar'], notlar: ['patent'], anlatim: 'Bin sekiz yüz yetmiş altı. Bell, sesi tel üzerinden ileten telefonun patentini aldı.' },
      { yil: '1920', ad: 'Duvar telefonu', nesne: 'duvar-telefonu', balon: 'Ahize!', bilgi: ['Evlerin duvarına asılır', 'Santral operatörü bağlar'], anlatim: 'Bin dokuz yüz yirmilerde telefonlar evlerin duvarına asıldı ve görüşmeleri operatörler bağladı.' },
      { yil: '1963', ad: 'Tuşlu telefon', nesne: 'tuslu-telefon', balon: 'Tık tık!', bilgi: ['Çevirmek yerine tuşa basılır', 'Numara daha hızlı girilir'], anlatim: 'Bin dokuz yüz altmış üç. Tuşlu telefonlar çevirmenin yerini aldı ve numara girmek hızlandı.' },
      { yil: '1983', ad: 'Tuğla telefon', nesne: 'tugla-telefon', balon: 'Taşınır!', bilgi: ['İlk ticari cep telefonu', 'Ağır ama özgürlük verir'], notlar: ['antenli'], anlatim: 'Bin dokuz yüz seksen üç. İlk ticari cep telefonu tuğla gibi ağırdı ama insanlara özgürlük verdi.' },
      { yil: '2007', ad: 'Akıllı telefon', nesne: 'akilli-telefon', balon: 'Dokun!', bilgi: ['Dokunmatik ekran ve uygulamalar', 'Cebimizde bir bilgisayar'], notlar: ['ekran'], anlatim: 'İki bin yedi. Akıllı telefonlar dokunmatik ekranı ve uygulamaları getirdi, cebimize bir bilgisayar girdi.' },
      { yil: 'Bugün', ad: 'Modern telefon', nesne: 'modern-telefon', balon: 'Hepsi bir arada!', bilgi: ['Kamera, harita, cüzdan, stüdyo', 'Her şey tek cihazda'], anlatim: 'Bugün telefon kamera, harita, cüzdan ve stüdyo, hepsi tek cihazda.' },
    ],
    soru: 'Sıradaki ne olacak?', cta: 'Yorumlara yaz!', son1: 'Konuşmanın', son2: 'hikâyesi!',
    yayin: { baslik: 'Telefonun yolculuğu: 1876\'dan bugüne', aciklama: 'Çevirmeli telefondan akıllı telefona 150 yılın hikâyesi. Sence sıradaki ne olacak?', etiketler: ['telefon', 'teknoloji', 'tarih', 'icatlar', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-sayac', { palet: 'canli', muzik: 'house-126', font: 'Anton', stil: 'duz' }, { kapakBeats: 8, kapSure: 12, minSn: 5.4 });
    const { c, W, H, k, m, p, n, planlar, hi, tK, tEnd, tKapak } = Z;
    const vuruslar = [];

    // ── kapak ─────────────────────────────────────────────────────────────
    c.grup('g-acilis', 'Açılış', true);
    c.dekor('halkalar', 0.3, tKapak, c.vurgu(0), { id: 'kapak-halka', alfa: 0.18, grup: 'g-acilis' });
    Z.kapak({ renk: c.yazi(0), kancaRenk: c.vurgu(0), altRenk: '#10101c', altKutu: c.vurgu(1), yK: 0.27, yB: 0.4, yA: 0.53, yN: 0.8, nesnePx: 0.46, weight: 400, upper: true, golge: true, baslikSize: 210, kancaSize: 76 });

    // ── duraklar ──────────────────────────────────────────────────────────
    let oncekiYil = null;
    const aktifZ = planlar.map((pl) => [pl.t0, pl.t1]);
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const bg = c.zemin(st);
      const yaz = yaziRengi(bg);
      const vur = c.vurgu(st);
      const vurYaz = yaziRengi(vur);
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      c.silme(`silme-${st}`, t0, bg, { sure: 0.5, yon: i % 2 ? 'sag' : 'sol' });
      const tA = t0 + 0.12;
      for (let j = 0; j < pl.beats; j += 2) vuruslar.push(c.vurus(pl.b0 + j));
      c.dekor(['patlama', 'halkalar', 'elmaslar'][i % 3], tA, t1, vur, { grup: g, id: `dekor-${st}`, alfa: 0.16 });

      // sayaç: önceki yıldan bu yıla akar
      const yc = yilCoz(s.yil);
      const yMerkez = H * 0.2;
      if (yc) {
        const from = oncekiYil != null && Math.abs(yc.sayi - oncekiYil) > 0 ? oncekiYil : yc.sayi - Math.max(8, Math.round(yc.sayi * 0.04));
        c.sayac(`yil-${st}`, from, yc.sayi, tA, 1.5, { y: yMerkez, size: 380, maxW: W * 0.92, renk: yaz, sep: '', suffix: yc.ek, t1, grup: g });
        oncekiYil = yc.sayi;
      } else {
        c.slam(`yil-${st}`, s.yil || String(st), tA, t1, { y: yMerkez, size: 330, maxW: W * 0.9, renk: yaz, grup: g, sar: 8, lh: 0.9 });
      }
      c.halka(`yil-halka-${st}`, tA + 1.5, W / 2, yMerkez, vur, { group: g, alfa: 0.5, boyut: m * 0.2, son: m * 0.9, sure: 0.6 });

      // ad
      c.slam(`ad-${st}`, s.ad, tA + 0.5, t1, {
        y: H * 0.325, size: 130, maxW: W * 0.88, renk: vurYaz, grup: g, giris: i % 2 ? 'sag' : 'sol', golge: false,
        kutu: { color: vur, radius: 22, padding: [10, 36], shadow: false }, rot: i % 2 ? 1.5 : -1.5,
      });

      // nesne: daire içinde, vuruşta zıplar
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const oy = H * 0.5;
      c.sekil(`daire-${st}`, 'daire', W / 2, oy, m * 0.56, { t0: tA + 0.3, t1, renk: vur, opacity: 0.9, grup: g, sure: 0.4, anims: [{ preset: 'ritimle-nabiz', t: R2(tA + 0.8), genlik: 0.04 }] });
      c.halka(`obje-halka-${st}`, tA + 0.5, W / 2, oy, yaz, { group: g, alfa: 0.4, boyut: m * 0.3, son: m * 1.1, sure: 0.7 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: W / 2, y: Math.round(oy + m * 0.21), anchor: [0.5, 1], scale: [k(tA + 0.4, 0), k(tA + 0.75, R2((m * 0.4) / Math.max(aw, ah)), 'outBack')],
        start: R2(tA + 0.4), end: R2(t1), anims: [{ preset: 'ritimle-zipla', t: R2(tA + 1.0), yukseklik: 26 }, { preset: 'ritimle-sallan', t: R2(tA + 1.0), aci: 3 }],
      });
      if (s.balon) c.damga(`balon-${st}`, s.balon, tA + 1.4, t1, W * 0.84, H * 0.43, m * 0.36, { grup: g, zemin: vur.toLowerCase() === '#ffe600' ? '#ffffff' : '#ffe600', renk: '#10101c', rot: 9, font: c.govde, sar: 8 });

      // bilgi satırları (vuruşta çarpar)
      pl.bilgi.forEach((ln, j) => {
        const tb = c.vurus(pl.b0 + 4 + j * 2);
        c.slam(`bilgi-${st}${'ab'[j]}`, ln, tb, t1, {
          y: H * (0.715 + j * 0.065), size: 70, maxW: W * 0.82, font: c.govde, weight: 800, upper: false, renk: yaz, grup: g, giris: j % 2 ? 'sag' : 'sol', golge: false, harf: 0,
        });
      });
      // not hapları
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = c.vurus(pl.b0 + 6 + j);
        c.hap(`not-${st}${'ab'[j]}`, `#${nt}`, tn, t1, W * (j % 2 ? 0.8 : 0.22), H * 0.85, { grup: g, zemin: vur, renk: vurYaz, size: Math.round(m * 0.046), upper: false });
      });
      Z.ses(pl, tA);
    });

    // ilerleme noktaları
    const gUst = c.grup('g-ilerleme', 'İlerleme', true);
    c.noktalar('ilerleme', n, aktifZ, tK, { grup: gUst, y: Math.round(H * 0.072) });

    // ── kapanış ───────────────────────────────────────────────────────────
    const bgK = c.zemin(n + 1);
    c.silme('silme-kapanis', tK, bgK, { sure: 0.5, yon: 'sol' });
    c.flas('kapanis-flas', tK + 0.2, { alfa: 0.5 });
    c.dekor('patlama', tK, tEnd, c.vurgu(n + 1), { id: 'kapanis-dekor', alfa: 0.2 });
    Z.kapanis({ renk: yaziRengi(bgK), t0: tK + 0.1, upper: true, golge: true, soruKutu: c.vurgu(n + 1), soruRenk: yaziRengi(c.vurgu(n + 1)), ctaRenk: yaziRengi(bgK) });
    for (let j = 0; j < 12; j += 2) vuruslar.push(c.vurus(Math.round(tK / p) + j));

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3), { zoom: 0.045, egim: 0.6 });
    return Z.bitir(brief.ad, {
      background: c.arkaplan([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0, i: i + 1 })), { t: tK, i: n + 1 }], { aci: 160, vinyet: 0.14 }),
      camera: cam,
    });
  },
};
