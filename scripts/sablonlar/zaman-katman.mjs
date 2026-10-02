// Zaman tüneli · KAZI (toprak katmanları): geçmişe doğru kazı. Yüzeyden başlar, kamera her dönemde bir kat daha aşağı iner;
// kâğıt kesme dalgalı toprak katmanları (açıktan koyuya), çakıllar, çatlak damarları. Her katta nesne kendi nişinde gün yüzüne çıkar (parıltı, halka),
// dev yıl, ad, bilgi satırları. Kenarda derinlik cetveli. En derin katta altın ışıklı kapanış.
// "Eskiden yeniye" ya da "yeniden eskiye" — sıralamayı sen belirlersin (kazıda genellikle yeniden eskiye gidilir). Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2, kaydir } from './zaman-ortak.mjs';

export default {
  id: 'zaman-katman',
  ad: 'Zaman tüneli · Kazı',
  etiket: 'Hikâye · Arkeoloji · Kâğıt kesme · Dikey',
  sure: '40–90 sn',
  aciklama: 'Geçmişe doğru kazı: kamera her dönemde bir toprak katmanı aşağı iner. Dalgalı kâğıt kesme katmanlar, çakıllar, derinlik cetveli; nesne kendi nişinde gün yüzüne çıkar, dev yıl ve bilgi satırlarıyla. Altın ışıklı kapanış.',
  ornek: {
    sablon: 'zaman-katman', id: 'sablon-zaman-katman', ad: 'Bilgisayar Arkeolojisi', format: 'reels', palet: 'toprak', muzik: 'lofi-90', font: 'Fraunces', stil: 'kagit-kesme',
    kanca: 'Kazıya başlıyoruz:', baslik: 'Bilgisayar Arkeolojisi', altBaslik: 'geçmişe doğru kazı', kapakNesne: 'dizustu',
    bolumler: [
      { yil: '1990\'lar', ad: 'Dizüstü', nesne: 'dizustu', balon: 'Çantada!', bilgi: ['Bilgisayar çantaya girer', 'İş de oyun da her yerde'], notlar: ['taşınabilir'], anlatim: 'Bin dokuz yüz doksanlarda dizüstü bilgisayarlar çantalara girdi ve işler her yerde yapılabilir oldu.' },
      { yil: '1981', ad: 'Kişisel bilgisayar', nesne: 'kisisel-bilgisayar', balon: 'Masada!', bilgi: ['Bilgisayar evlerin masasına girer', 'Herkes kullanabilir hâle gelir'], anlatim: 'Bin dokuz yüz seksen bir. Kişisel bilgisayarlar evlerin masasına girdi ve herkes kullanabilir oldu.' },
      { yil: '1958', ad: 'Entegre devre', nesne: 'cip', balon: 'Küçüldü!', bilgi: ['Pek çok transistör tek çipe sığar', 'Bilgisayarlar avuç içine yaklaşır'], notlar: ['çip'], anlatim: 'Bin dokuz yüz elli sekiz. Entegre devreyle pek çok transistör tek bir çipe sığdı.' },
      { yil: '1947', ad: 'Transistör', nesne: 'transistor', balon: 'Minik!', bilgi: ['Tüplerin yerini küçük bir anahtar alır', 'Daha az enerji, daha çok hız'], anlatim: 'Bin dokuz yüz kırk yedi. Transistör tüplerin yerini aldı. Daha küçük ve daha hızlıydı.' },
      { yil: '1945', ad: 'ENIAC', nesne: 'eniac', balon: 'Dev!', bilgi: ['Bir odayı doldurur', 'Binlerce vakum tüpüyle çalışır'], notlar: ['vakum tüpü'], anlatim: 'Bin dokuz yüz kırk beş. ENIAC bir odayı dolduruyor ve binlerce vakum tüpüyle çalışıyordu.' },
    ],
    soru: 'Daha derinde ne var?', cta: 'Tahminini yaz!', son1: 'Hazine', son2: 'bulundu!',
    yayin: { baslik: 'Bilgisayar arkeolojisi: geçmişe doğru kazı', aciklama: 'Dizüstünden ENIAC\'a, bilgisayarın tarihine katman katman iniyoruz. Sence daha derinde ne var?', etiketler: ['bilgisayar', 'tarih', 'arkeoloji', 'teknoloji', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-katman', { palet: 'toprak', muzik: 'lofi-90', font: 'Fraunces', stil: 'kagit-kesme' }, { kapSure: 12, minSn: 6.0 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const KREM = '#f6ecd9';
    const MONO = 'Space Mono';
    const zi = (i) => Math.round((i / (n + 1)) * (c.pal.bg.length - 1));
    const kat = (i) => c.zemin(zi(i)); // i. katın rengi (0 = üst toprak, n+1 = en derin)
    const Yc = (s) => H / 2 + s * H;
    const PAN = 1.3;
    const panT = (t0) => t0 - 0.75;
    const vuruslar = [];
    const gB = c.grup('g-katman', 'Katmanlar', true);
    const rnd = (i, a = 1) => ((Math.sin(i * 12.9898 + a * 78.233) * 43758.5453) % 1 + 1) % 1;

    // ── gökyüzü / yüzey (kapak) ───────────────────────────────────────────
    const yg = H * 0.62; // yüzey çizgisi
    Z.isik('gunes-isik', W * 0.8, H * 0.16, m * 0.7, '#fff1b8', { t0: 0, opacity: 0.55, blur: 40, grup: gB });
    c.sekil('gunes', 'daire', W * 0.8, H * 0.16, m * 0.24, { t0: 0, renk: '#ffe08a', giris: 'yok', grup: gB, anims: [{ preset: 'nefes', t: 0, genlik: 0.03, periyot: 4 }] });
    [[0.2, 0.2, 0.32], [0.55, 0.08, 0.26], [0.88, 0.32, 0.22]].forEach(([fx, fy, f], i) => {
      const asset = nesneSec('bulut');
      const [bw] = varlikBoyut(asset);
      c.L({ id: `gokbulut-${i}`, group: gB, asset, x: Math.round(W * fx), y: Math.round(H * fy), scale: R2((m * f) / bw), palette: { a: '#ffffff' }, anims: [{ preset: 'suzul', t: 0, genlik: 10, periyot: 6 + i }] });
    });
    // ── katlar ────────────────────────────────────────────────────────────
    for (let i = 0; i <= n + 1; i++) {
      const ust = i === 0 ? yg : Yc(i) - H / 2;
      const alt = Yc(i) + H / 2 + (i === n + 1 ? H : 0);
      c.sekil(`kat-${i}`, 'kare', W / 2, (ust + alt) / 2, 200, { t0: 0, renk: kat(i), giris: 'yok', sx: (W * 1.3) / 200, sy: (alt - ust) / 200, grup: gB });
      // dalgalı üst kenar (yukarıdaki katın rengiyle çıkıntılar değil, bu katın rengiyle yukarı taşan tepeler)
      const sayi = 11;
      for (let j = 0; j < sayi; j++) {
        const r = 62 + rnd(i * 31 + j, 1) * 52;
        c.sekil(`kenar-${i}-${j}`, 'daire', -40 + j * ((W + 80) / (sayi - 1)) + (rnd(i * 17 + j, 2) - 0.5) * 50, ust + 8, r * 2, { t0: 0, renk: kat(i), giris: 'yok', grup: gB });
      }
      // çakıllar + damarlar
      for (let j = 0; j < 16; j++) {
        const x = W * (0.04 + rnd(i * 53 + j, 3) * 0.92);
        const y = ust + 40 + rnd(i * 29 + j, 4) * (alt - ust - 80);
        const b = 16 + rnd(i * 41 + j, 5) * 34;
        c.sekil(`cakil-${i}-${j}`, j % 3 ? 'daire' : 'elmas', x, y, b, { t0: 0, renk: j % 2 ? kaydir(kat(i), 1.22) : kaydir(kat(i), 0.72), opacity: 0.55, giris: 'yok', grup: gB, rot: rnd(i + j, 6) * 90 });
      }
      for (let j = 0; j < 3; j++) {
        c.sekil(`damar-${i}-${j}`, 'kare', W * (0.2 + 0.3 * j), ust + (alt - ust) * (0.25 + 0.25 * j), 200, { t0: 0, renk: '#000000', opacity: 0.09, giris: 'yok', sx: (W * 0.7) / 200, sy: 0.02, rot: (j % 2 ? 1 : -1) * (4 + j * 2), grup: gB });
      }
    }
    // çim şeridi
    c.sekil('cim', 'kare', W / 2, yg, 200, { t0: 0, renk: '#6a994e', giris: 'yok', sx: (W * 1.3) / 200, sy: 34 / 200, grup: gB });
    for (let j = 0; j < 24; j++) c.sekil(`cim-diş-${j}`, 'ucgen', j * (W / 22), yg - 14, 38, { t0: 0, renk: '#6a994e', giris: 'yok', grup: gB, sy: 0.7 + rnd(j, 7) * 0.5, extra: { anchor: [0.5, 1] } });
    // derinlik cetveli
    c.sekil('cetvel', 'kare', 34, yg + (Yc(n + 1) - yg) / 2, 200, { t0: 0, renk: KREM, opacity: 0.28, giris: 'yok', sx: 3 / 200, sy: (Yc(n + 1) - yg + H) / 200, grup: gB });
    for (let y = yg + 30; y < Yc(n + 1) + H / 2; y += 150) {
      const uzun = Math.round((y - yg) / 150) % 3 === 0;
      c.sekil(`cetvel-${Math.round(y)}`, 'kare', 34 + (uzun ? 17 : 10), y, 200, { t0: 0, renk: KREM, opacity: uzun ? 0.45 : 0.28, giris: 'yok', sx: (uzun ? 36 : 22) / 200, sy: 3 / 200, grup: gB });
    }

    // ── kapak ─────────────────────────────────────────────────────────────
    Z.kapak({ renk: '#2b3a2a', kancaRenk: '#5b3a1e', altRenk: '#2b2418', altKutu: '#f2d49b', yK: 0.16, yB: 0.27, yA: 0.41, yN: 0.62, nesnePx: 0.3, weight: 800, suslemeTipi: 'yok', kancaSize: 62, baslikSize: 180, sar: 12 });

    // ── katlar: içerik ────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const acc = hi(i);
      const yc = Yc(st);
      const Y = (f) => yc - H / 2 + H * f; // ekran oranı → dünya y
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.55;
      vuruslar.push(tA, c.vurus(pl.b0 + 4));

      yazi(`sira-${st}`, `KAT ${String(st).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, tA, null, { grup: g, x: 90, y: Y(0.075), size: 30, sabit: true, align: 'left', font: MONO, renk: KREM, weight: 700, harf: 5, opacity: 0.85, reveal: [0.05, 0.7] });
      yazi(`yil-${st}`, s.yil || String(st), tA, null, { grup: g, y: Y(0.172), size: 215, maxW: W * 0.86, renk: KREM, weight: 800, reveal: [0.05, 0.55], golge: true, anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.6 }] });
      yazi(`ad-${st}`, s.ad, tA + 0.35, null, { grup: g, y: Y(0.246), size: 70, maxW: W * 0.86, font: 'Outfit', renk: acc, weight: 700, upper: true, harf: 8, reveal: [0.05, 0.7] });

      // nişin içinde nesne gün yüzüne çıkar
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      const oy = Y(0.585);
      c.sekil(`nis-${st}`, 'daire', W / 2, oy - m * 0.17, m * 0.66, { t0: tA, renk: kaydir(kat(st), 0.55), opacity: 0.7, sx: 1.12, sy: 0.9, grup: g, sure: 0.6 });
      Z.isik(`nis-isik-${st}`, W / 2, oy - m * 0.2, m * 0.7, acc, { t0: tA + 0.3, opacity: 0.4, blur: 50, grup: g });
      c.halka(`nis-halka-${st}`, tA + 0.5, W / 2, oy - m * 0.2, acc, { group: g, alfa: 0.6, boyut: m * 0.2, son: m * 0.95, sure: 0.9 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: W / 2, y: [k(tA, Math.round(oy + 360)), k(tA + 1.0, Math.round(oy), 'outBack')], anchor: [0.5, 1],
        scale: [k(tA, R2((m * 0.3) / Math.max(aw, ah))), k(tA + 1.0, R2((m * 0.5) / Math.max(aw, ah)), 'outCubic')], rotation: [k(tA, -14), k(tA + 1.0, 0, 'outBack')], start: R2(tA),
        anims: [{ preset: 'suzul', t: R2(tA + 1.4), genlik: 9, periyot: 3.4 }],
      });
      for (let j = 0; j < 6; j++) {
        c.sekil(`kir-${st}-${j}`, 'daire', W / 2 + (j - 2.5) * 70, oy - 40, 14 + (j % 3) * 8, {
          t0: tA + 0.2, t1: tA + 1.3, renk: kaydir(kat(st), 0.7), opacity: 0.9, giris: 'yok', grup: g,
          extra: { y: [k(tA + 0.2, oy - 40), k(tA + 0.55, oy - 160 - (j % 3) * 50, 'outQuad'), k(tA + 1.3, oy + 160, 'inQuad')], x: [k(tA + 0.2, W / 2 + (j - 2.5) * 60), k(tA + 1.3, W / 2 + (j - 2.5) * 190, 'linear')] },
        });
      }
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.5, null, {
          grup: g, x: W * 0.8, y: Y(0.4), size: 58, maxW: W * 0.3, sar: 10, kutu: KREM, radius: 26, pad: [8, 24], rot: 6, renk: '#3a2a1c', font: 'Outfit', weight: 800,
          anims: [{ preset: 'zipla-gir', t: R2(tA + 1.5), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 2.1), aci: 4, periyot: 1.6 }],
        });
      }
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.3 + j * 1.15, null, { grup: g, y: Y(0.74 + j * 0.062), size: 64, maxW: W * 0.93, sar: 34, font: 'Outfit', renk: KREM, weight: 600, lh: 1.08, reveal: [0.1, 0.95] });
      });
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const tn = tA + 2.5 + j * 0.5;
        yazi(`not-${st}${'ab'[j]}`, nt, tn, null, { grup: g, x: W * (j % 2 ? 0.84 : 0.2), y: Y(0.5), size: 38, maxW: W * 0.24, sar: 12, kutu: acc, renk: '#3a2a1c', font: MONO, weight: 700, radius: 8, pad: [6, 16], rot: j % 2 ? 4 : -4, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.4 }] });
        c.L({
          id: `not-ok-${st}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${st}${'ab'[j]}`, to: `nesne-${st}`, start: R2(tn + 0.3),
          fold: [k(tn + 0.3, 0), k(tn + 1, 1, 'inOutSine')], palette: { a: KREM },
        });
      });
      Z.ses(pl, tA);
    });

    // ── kapanış: en derin kat, altın ışık ─────────────────────────────────
    const sK = n + 1;
    const dyK = sK * H;
    Z.isik('hazine-isik', W / 2, Yc(sK) - H * 0.12, m * 1.6, '#ffd166', { t0: tK, opacity: 0.0, blur: 100, grup: 'g-kapanis', extra: { opacity: [k(tK, 0), k(tK + 1.2, 0.5, 'outCubic')] } });
    Z.kapanis({ renk: KREM, dy: dyK, t0: tK + 0.5, soruRenk: '#2b2418', soruKutu: '#ffd166', ctaRenk: '#e9d8b8' });
    vuruslar.push(tK + 0.5);

    // ── kamera: aşağı iner, varışta hafif sarsıntı ────────────────────────
    const camY = [k(0, H / 2)];
    const camZ = [k(0, 1.1), k(3, 1, 'inOutCubic')];
    const camR = [k(0, 0)];
    let sy = H / 2;
    const pans = [...planlar.map((pl, i) => ({ t: pl.t0, y: Yc(i + 1) })), { t: tK + 0.5, y: Yc(sK) }];
    pans.forEach((q) => {
      camY.push(k(panT(q.t), sy, 'linear'), k(panT(q.t) + PAN, q.y, 'inOutCubic'));
      camZ.push(k(panT(q.t), 1, 'linear'), k(panT(q.t) + PAN * 0.5, 0.95, 'inOutSine'), k(panT(q.t) + PAN, 1, 'inOutSine'));
      camR.push(k(panT(q.t), 0, 'linear'), k(panT(q.t) + PAN * 0.55, 0.9, 'inOutSine'), k(panT(q.t) + PAN + 0.25, -0.5, 'inOutSine'), k(panT(q.t) + PAN + 0.7, 0, 'inOutSine'));
      sy = q.y;
    });
    const duz = (a) => a.filter((e, i, arr) => !i || e.t > arr[i - 1].t);
    return Z.bitir(brief.ad, {
      background: { type: 'linear', colors: ['#8ecae6', '#d9f0f7'], angle: 180, paper: 0.25, vignette: 0.2 },
      camera: { x: W / 2, y: duz(camY), zoom: duz(camZ), rotation: duz(camR) },
    });
  },
};
