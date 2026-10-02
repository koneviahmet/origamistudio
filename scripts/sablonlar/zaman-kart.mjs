// Zaman tüneli · KART DESTESİ: pastel zemin, yuvarlak köşeli beyaz kartlar. Her dönem alttan yükselen yeni bir kart; öncekiler arkada
// üst üste "istiflenir" (üstte ince şeritler kalır). Kartın üst kenarından taşan büyük nesne, dev renkli yıl, madde işaretli bilgi satırları,
// altta etiket hapları. Üstte ilerleme noktaları. Temiz, modern, Instagram-carousel hissi. Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

export default {
  id: 'zaman-kart',
  ad: 'Zaman tüneli · Kart destesi',
  etiket: 'Hikâye · Tarihçe · Pastel · Temiz',
  sure: '40–90 sn',
  aciklama: 'Pastel zeminde beyaz yuvarlak kartlar: her dönem alttan yükselir, öncekiler arkada istiflenir. Kartı aşan büyük nesne, dev yıl, madde işaretli bilgiler, etiket hapları. Temiz ve modern carousel hissi.',
  ornek: {
    sablon: 'zaman-kart', id: 'sablon-zaman-kart', ad: 'Ateşten Mikrodalgaya', format: 'reels', palet: 'pastel', muzik: 'pop-120', font: 'Outfit', stil: 'duz',
    kanca: 'Yemek pişirmenin', baslik: 'Ateşten Mikrodalgaya', altBaslik: 'fırının yolculuğu', kapakNesne: 'acik-ates',
    bolumler: [
      { yil: 'Tarih öncesi', ad: 'Açık ateş', nesne: 'acik-ates', balon: 'Sıcak!', bilgi: ['İlk pişirme doğrudan ateşte', 'Taşlar ve közler ısıyı tutar'], notlar: ['ateş'], anlatim: 'Tarih öncesinde yemek doğrudan ateşte pişirilirdi. Taşlar ve közler ısıyı tutuyordu.' },
      { yil: 'Binlerce yıl önce', ad: 'Kil fırın', nesne: 'kil-kubbe-firin', balon: 'Ekmek!', bilgi: ['Kil kubbe ısıyı hapseder', 'Ekmek böyle pişer'], notlar: ['kubbe'], anlatim: 'Binlerce yıl önce kil kubbe fırınlar ısıyı hapsederek ekmek gibi yiyecekleri eşit pişirmeye başladı.' },
      { yil: '1800\'ler', ad: 'Gazlı fırın', nesne: 'gazli-firin', balon: 'Çak!', bilgi: ['Gaz alevi evlere girer', 'Isıyı ayarlamak kolaylaşır'], notlar: ['gaz'], anlatim: 'Bin sekiz yüzlerde gazlı fırınlar yaygınlaştı ve ısıyı ayarlamak çok kolaylaştı.' },
      { yil: '1890\'lar', ad: 'Elektrikli fırın', nesne: 'elektrikli-firin', balon: 'Cııız!', bilgi: ['Rezistans ısınır, duman yok', 'Sıcaklık sabit kalır'], notlar: ['rezistans'], anlatim: 'Bin sekiz yüz doksanlarda elektrikli fırınlar çıktı. Duman yoktu ve sıcaklık sabit kalıyordu.' },
      { yil: '1945', ad: 'Mikrodalga', nesne: 'mikrodalga', balon: 'Bip!', bilgi: ['Radar mühendisi tesadüfen keşfeder', 'Yiyecek içten ısınır'], notlar: ['mikrodalga'], anlatim: 'Bin dokuz yüz kırk beşte bir radar mühendisi mikrodalga ile yiyeceğin ısındığını tesadüfen fark etti.' },
      { yil: 'Bugün', ad: 'Akıllı fırın', nesne: 'akilli-firin', balon: 'Merhaba!', bilgi: ['Telefonla önceden ısıtılır', 'Tarifi kendisi izler'], notlar: ['uygulama'], anlatim: 'Bugün akıllı fırınlar telefondan kontrol ediliyor ve tarifi kendileri izliyor.' },
    ],
    soru: 'Sıradaki mutfak icadı?', cta: 'Yorumlara yaz!', son1: 'Yemeğin', son2: 'hikâyesi!',
    yayin: { baslik: 'Ateşten mikrodalgaya: fırının yolculuğu', aciklama: 'Açık ateşten akıllı fırına, yemek pişirmenin tarihi. Sence sıradaki mutfak icadı ne olacak?', etiketler: ['firin', 'mutfak', 'tarih', 'teknoloji', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-kart', { palet: 'pastel', muzik: 'pop-120', font: 'Outfit', stil: 'duz' }, { kapSure: 10 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const ink = brief.murekkep || '#1f2347';
    const soluk = '#6b7099';
    const vuruslar = [];

    // kart geometrisi (kart.json 400×500): 4:5, ekranın %86'sı
    const KW = W * 0.86;
    const ks = KW / 400;
    const KH = 500 * ks;
    const cx = W / 2;
    const cy = H * 0.535;
    const ct = cy - KH / 2;
    const cl = cx - KW / 2;
    const kartSag = cl + KW;
    const ox = kartSag - KW * 0.2; // nesne merkezi (sağ)

    // ── kapak (ince, kartsız): kapakta da bir kart var gibi başlık ──────────
    Z.kapak({ renk: ink, kancaRenk: '#5b5fc7', altRenk: '#ffffff', altKutu: '#5b5fc7', yK: 0.28, yB: 0.4, yA: 0.53, yN: 0.8, nesnePx: 0.46, weight: 800, suslemeRenk: (i) => hi(i + 1) });

    // ilerleme noktaları (üstte, kapak bittikten sonra)
    const gUst = c.grup('g-ust', 'İlerleme', true);
    const noktaY = H * 0.075;
    const aralik = Math.min(54, (W * 0.7) / Math.max(1, n));
    planlar.forEach((pl, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * aralik;
      const t0 = pl.t0;
      const t1 = pl.t1;
      c.sekil(`ilerleme-${i + 1}`, 'hap', x, noktaY, 400, {
        giris: 'yok', t0: planlar[0].t0 - 0.3, renk: ink, grup: gUst,
        extra: {
          scaleX: [k(planlar[0].t0 - 0.3, 0.06), k(t0, 0.06, 'step'), k(t0 + 0.35, 0.24, 'outBack'), k(t1, 0.24, 'step'), k(t1 + 0.3, 0.06, 'inOutSine')],
          scaleY: 0.24,
          opacity: [k(planlar[0].t0 - 0.3, 0.2), k(t0, 1, 'step'), k(t1, 0.28, 'step')],
        },
      });
    });
    // ilerleme noktaları kapanışta gider (bitiş)
    gUst && c.layers.filter((l) => l.group === gUst).forEach((l) => { l.end = R2(tK + 0.2); });

    // ── kartlar ───────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const acc = hi(i);
      const sonraki = planlar[i + 1];
      const t2 = sonraki ? sonraki.t1 : tK; // 2. istif adımı
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.55; // kart yerleştikten sonra içerik
      const tCik = t1 - 0.05;
      vuruslar.push(t0, c.vurus(pl.b0 + 4));

      // sahte gölge + kart (alttan yükselir; sonra arkada istiflenir)
      const yIstif1 = cy - 92;
      const yIstif2 = cy - 172;
      const kartAnim = (id, renk, yOfs, op) => c.L({
        id, group: g, asset: 'kart', x: cx, y: [
          k(t0 - 0.05, H * 1.35), k(t0 + 0.6, cy + yOfs, 'outBack'), k(t1, cy + yOfs, 'step'),
          k(t1 + 0.55, yIstif1 + yOfs, 'outCubic'), k(t2, yIstif1 + yOfs, 'step'), k(t2 + 0.55, yIstif2 + yOfs, 'outCubic'),
        ],
        anchor: [0.5, 0.5], scale: [k(t1, R2(ks)), k(t1 + 0.55, R2(ks * 0.93), 'outCubic'), k(t2, R2(ks * 0.93), 'step'), k(t2 + 0.55, R2(ks * 0.86), 'outCubic')],
        palette: { a: renk }, opacity: op, start: R2(t0 - 0.05), end: R2(t2 + 0.65),
      });
      kartAnim(`kart-golge-${st}`, '#1f2347', 16, [k(t0, 0.13), k(t1, 0.13, 'step'), k(t1 + 0.4, 0.06, 'linear')]);
      kartAnim(`kart-${st}`, '#ffffff', 0, [k(t0, 1), k(t1, 1, 'step'), k(t1 + 0.55, 0.9, 'linear'), k(t2, 0.9, 'step'), k(t2 + 0.55, 0.7, 'linear')]);
      // renkli üst şerit (kart içinde, yarım daire gibi değil düz): ince vurgu çubuğu
      const kisa = { grup: g };
      const sol = cl + 62;

      // sıra + yıl + ad
      yazi(`sira-${st}`, `${String(st).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, tA, tCik + 0.3, { ...kisa, x: sol, y: ct + 58, size: 38, sabit: true, align: 'left', renk: soluk, weight: 600, harf: 3, anims: [{ preset: 'kayarak-gir', t: R2(tA), dur: 0.4 }] });
      const yilM = s.yil || String(st);
      const uzun = yilM.length > 8;
      yazi(`yil-${st}`, yilM, tA + 0.1, tCik + 0.3, {
        ...kisa, x: sol, y: ct + 205, size: uzun ? 124 : 190, maxW: (ox - m * 0.2 - sol - 30) * 0.86, sar: uzun ? 9 : undefined, lh: 0.95, align: 'left', renk: acc, weight: 800, reveal: [0.1, 0.5],
        anims: [{ preset: 'zipla-gir', t: R2(tA + 0.1), dur: 0.55 }],
      });
      yazi(`ad-${st}`, s.ad, tA + 0.3, tCik + 0.3, { ...kisa, x: sol, y: ct + 372, size: 84, maxW: ox - m * 0.2 - sol - 30, align: 'left', renk: ink, weight: 700, reveal: [0.3, 0.7] });
      // vurgu çubuğu
      c.sekil(`cubuk-${st}`, 'hap', sol + 92, ct + 450, 400, { giris: 'yok', t0: tA + 0.4, t1: tCik + 0.3, renk: acc, grup: g, extra: { scaleX: [k(tA + 0.4, 0), k(tA + 0.9, 0.46, 'outCubic')], scaleY: 0.06 } });

      // nesne: kartın üst kenarını aşar (sağ)
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const oy = ct + 340;
      c.sekil(`zemin-${st}`, 'daire', ox, oy - m * 0.14, m * 0.4, { t0: tA + 0.15, t1: tCik + 0.3, renk: acc, opacity: 0.2, grup: g, sure: 0.5 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: Math.round(ox), y: Math.round(oy), anchor: [0.5, 1], scale: R2((m * 0.34) / Math.max(aw, ah)),
        start: R2(tA + 0.1), end: R2(tCik + 0.3),
        anims: [{ preset: 'zipla-gir', t: R2(tA + 0.1), dur: 0.65 }, { preset: 'suzul', t: R2(tA + 1.0), genlik: 10, periyot: p * 6 }, { preset: 'kuculerek-cik', t: R2(tCik - 0.2), dur: 0.45 }],
      });
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.3, tCik + 0.3, {
          ...kisa, x: ox - KW * 0.02, y: ct - 110, size: 66, maxW: KW * 0.4, kutu: ink, radius: 30, pad: [8, 26], rot: -4, renk: '#ffffff',
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.3), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 1.9), aci: 3, periyot: 1.6 }, { preset: 'kuculerek-cik', t: R2(tCik - 0.25), dur: 0.3 }],
        });
      }

      // ayırıcı çizgi
      c.sekil(`ayirac-${st}`, 'kare', cx, ct + 525, 200, { giris: 'yok', t0: tA + 0.5, t1: tCik + 0.3, renk: ink, opacity: 0.1, sx: (KW * 0.84) / 200, sy: 0.012, grup: g });

      // bilgi satırları (madde işaretli, yazılır)
      pl.bilgi.forEach((ln, j) => {
        const by = ct + 680 + j * 215;
        const tb = tA + 1.2 + j * 1.15;
        c.sekil(`mad-${st}${'ab'[j]}`, 'daire', sol + 14, by, 30, { t0: tb + 0.12, t1: tCik + 0.3, renk: acc, grup: g, sure: 0.3 });
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tb, tCik + 0.3, { ...kisa, x: sol + 54, y: by, size: 68, maxW: KW - 190, sar: 20, align: 'left', renk: ink, weight: 600, lh: 1.12, reveal: [0.1, 0.9] });
      });
      // etiket hapları
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.6 + j * 0.45;
        yazi(`not-${st}${'ab'[j]}`, `#${nt}`, tn, tCik + 0.3, {
          ...kisa, x: sol + j * 330, y: ct + KH - 110, size: 46, sabit: true, align: 'left', kutu: acc, kutuAlfa: 0.28, radius: 999, pad: [10, 28], renk: ink, weight: 700,
          anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }],
        });
      });
      Z.ses(pl, tA);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    Z.kapanis({ renk: ink, soruRenk: '#ffffff', soruKutu: '#5b5fc7', ctaRenk: soluk, t0: tK });
    // kapanışta tüm kartlar istiflenmiş gelsin → kapanış metninin altında kalmasın: kartlar t2+0.65'te zaten biter
    vuruslar.push(tK);

    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3.4), { zoom: 0.012, egim: 0 });
    cam.zoom = [k(0, 1.12), k(2.8, 1, 'inOutCubic'), ...cam.zoom.filter((z) => z.t > 3)];
    return Z.bitir(brief.ad, {
      background: Z.suzBg([{ t: 0, i: 0 }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.5, i: i + 1 })), { t: tK + 0.5, i: n + 1 }], { aci: 160, vinyet: 0.08 }),
      camera: cam,
    });
  },
};
