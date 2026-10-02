// Zaman tüneli · METRO HATTI: açık, sade, bilgi-grafiği estetiği. Bir metro hattı haritası: renkli hat 90°/45° dönüşlerle ilerler, her dönem bir DURAK.
// Tren (yuvarlak köşeli kapsül) duraktan durağa gider, kamera onu izler; geçilen hat renklenir. Durakta: yıl rozeti, ad, cam kartta nesne,
// koyu "sefer bilgisi" panelinde bilgi satırları ve "Sonraki durak" etiketi. Modern, temiz, akıcı. Aynı brief'i zaman şablonu gibi okur.
import { nesneSec, varlikBoyut } from './lib.mjs';
import { zamanKur, R2 } from './zaman-ortak.mjs';

const RAD = Math.PI / 180;

export default {
  id: 'zaman-metro',
  ad: 'Zaman tüneli · Metro hattı',
  etiket: 'Hikâye · Bilgi grafiği · Açık · Modern',
  sure: '40–90 sn',
  aciklama: 'Metro hattı haritası: tren duraktan durağa gider, kamera izler, geçilen hat renklenir. Her durakta yıl rozeti, cam kartta nesne, koyu sefer bilgisi panelinde bilgi satırları ve "Sonraki durak" etiketi. Açık zeminli, sade, modern.',
  ornek: {
    sablon: 'zaman-metro', id: 'sablon-zaman-metro', ad: 'Işığın Hattı', format: 'reels', palet: 'metro', muzik: 'pop-120', font: 'Outfit', stil: 'duz',
    kanca: 'Hat 1 · Yeni sefer', baslik: 'Aydınlatmanın Hattı', altBaslik: 'ateşten akıllı mutfağa duraklar', kapakNesne: 'acik-ates',
    bolumler: [
      { yil: 'Tarih öncesi', ad: 'Açık ateş', nesne: 'acik-ates', balon: 'Sıcak!', bilgi: ['İlk pişirme doğrudan ateşte', 'Taşlar ve közler ısıyı tutar'], notlar: ['ateş'], anlatim: 'Tarih öncesinde yemek doğrudan ateşte pişirilirdi. Taşlar ve közler ısıyı tutuyordu.' },
      { yil: 'Binlerce yıl önce', ad: 'Kil fırın', nesne: 'kil-kubbe-firin', balon: 'Ekmek!', bilgi: ['Kil kubbe ısıyı hapseder', 'Ekmek böyle pişer'], notlar: ['kubbe'], anlatim: 'Binlerce yıl önce kil kubbe fırınlar ısıyı hapsederek ekmek gibi yiyecekleri eşit pişirmeye başladı.' },
      { yil: '1800\'ler', ad: 'Gazlı fırın', nesne: 'gazli-firin', balon: 'Gaz!', bilgi: ['Gaz alevi evlere girer', 'Isıyı ayarlamak kolaylaşır'], notlar: ['gaz'], anlatim: 'Bin sekiz yüzlerde gazlı fırınlar yaygınlaştı ve ısıyı ayarlamak çok kolaylaştı.' },
      { yil: '1945', ad: 'Mikrodalga', nesne: 'mikrodalga', balon: 'Bip!', bilgi: ['Radar mühendisi tesadüfen keşfeder', 'Yiyecek içten ısınır'], notlar: ['mikrodalga'], anlatim: 'Bin dokuz yüz kırk beşte bir radar mühendisi mikrodalga ile yiyeceğin ısındığını tesadüfen fark etti.' },
      { yil: 'Bugün', ad: 'Akıllı fırın', nesne: 'akilli-firin', balon: 'Merhaba!', bilgi: ['Telefonla önceden ısıtılır', 'Tarifi kendisi izler'], notlar: ['uygulama'], anlatim: 'Bugün akıllı fırınlar telefondan kontrol ediliyor ve tarifi kendileri izliyor.' },
    ],
    soru: 'Son durak neresi?', cta: 'Tahminini yaz!', son1: 'Hat', son2: 'devam ediyor!',
    yayin: { baslik: 'Fırının hattı: ateşten akıllı mutfağa duraklar', aciklama: 'Açık ateşten akıllı fırına metro hattı gibi duraklar. Sence son durak neresi?', etiketler: ['firin', 'mutfak', 'tarih', 'teknoloji', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    const Z = zamanKur(brief, 'zaman-metro', { palet: 'metro', muzik: 'pop-120', font: 'Outfit', stil: 'duz' }, { kapSure: 12, minSn: 6.4 });
    const { c, W, H, k, m, p, n, planlar, yazi, hi, tK, tEnd, tKapak } = Z;
    const INK = '#1d1f2b';
    const GRI = '#d7d4ca';
    const MONO = 'Space Mono';
    const HAT = 26; // hat kalınlığı
    const vuruslar = [];

    // ── durak konumları (dünya): kapak 0, bölümler 1..n, kapanış n+1 ───────
    const DY = 1180;
    const XL = W * 0.3;
    const XR = W * 0.7;
    const P = (i) => ({ x: i === 0 ? W / 2 : i % 2 ? XL : XR, y: H * 0.74 + i * DY });
    const nDur = n + 1; // son durak (kapanış)
    const Pn = (i) => (i === nDur ? { x: W / 2, y: P(n).y + DY } : P(i));
    const camYof = (i) => Pn(i).y + H * 0.2; // durak ekranda y=.30H'de
    const PAN = 1.5;

    // bir bacak: P_i → P_{i+1}: önce düşey, sonra 45° çapraz (hat kıvrımı)
    const bacak = (i) => {
      const a = Pn(i);
      const b = Pn(i + 1);
      const dx = b.x - a.x;
      const dyy = b.y - a.y;
      const cap = Math.abs(dx); // 45°: yatay = düşey
      const dus = dyy - cap;
      const j = { x: a.x, y: a.y + dus }; // dönüş noktası
      return { a, j, b, dus, cap, ang2: dx > 0 ? 45 : 135 }; // çapraz açı (x ekseninden, aşağı)
    };

    const segment = (id, g, x1, y1, x2, y2, renk, kal, t0, sure, op = 1, ease = 'linear') => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      c.L({
        id, group: g, asset: 'kare', x: Math.round(x1), y: Math.round(y1), anchor: [0, 0.5], scale: 1, scaleX: sure ? [k(t0, 0), k(t0 + sure, len / 200, ease)] : len / 200, scaleY: kal / 200,
        rotation: Math.atan2(dy, dx) / RAD, palette: { a: renk }, opacity: op, start: R2(t0 - 0.01),
      });
    };

    /** Yuvarlak köşeli dikdörtgen (iki kare + dört daire): kart/hap esnemesinde köşe bozulmasın */
    const yuvarlak = (id, g, cx, cy, w, h, r, renk, t0, op = 1) => {
      const o = { t0, renk, opacity: op, giris: 'yok', grup: g };
      c.sekil(`${id}-a`, 'kare', cx, cy, 200, { ...o, sx: (w - 2 * r) / 200, sy: h / 200 });
      c.sekil(`${id}-b`, 'kare', cx, cy, 200, { ...o, sx: w / 200, sy: (h - 2 * r) / 200 });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], q) => c.sekil(`${id}-c${q}`, 'daire', cx + dx * (w / 2 - r), cy + dy * (h / 2 - r), r * 2, o));
    };

    // ── hat (gri iz + renkli dolgu): önce gri hepsi, sonra gelen tren renklendirir ──
    const gH = c.grup('g-hat', 'Hat', true);
    const trenSure = 1.9; // bacak boyunca tren yolculuğu
    const BL = [];
    for (let i = 0; i <= n; i++) {
      const L = bacak(i);
      BL[i] = L;
      const tB = (i < n ? planlar[i].t0 : tK) + 0.3 - trenSure; // varış, bir sonraki durağın başlangıcından 0.3 sn sonra
      const acc = hi(i);
      // gri iz (tam, baştan)
      segment(`hat-g-${i}a`, gH, L.a.x, L.a.y, L.j.x, L.j.y, GRI, HAT, 0, 0);
      segment(`hat-g-${i}b`, gH, L.j.x, L.j.y, L.b.x, L.b.y, GRI, HAT, 0, 0);
      c.sekil(`hat-g-${i}d`, 'daire', L.j.x, L.j.y, HAT, { t0: 0, renk: GRI, giris: 'yok', grup: gH });
      // renkli dolgu: tren gelirken uzar (düşey kısım toplam yolun oranına göre)
      const uz1 = L.dus;
      const uz2 = L.cap * Math.SQRT2;
      const top = uz1 + uz2;
      const s1 = (trenSure * uz1) / top;
      const s2 = (trenSure * uz2) / top;
      segment(`hat-${i}a`, gH, L.a.x, L.a.y, L.j.x, L.j.y, acc, HAT, tB, s1, 1, 'linear');
      segment(`hat-${i}b`, gH, L.j.x, L.j.y, L.b.x, L.b.y, acc, HAT, tB + s1, s2, 1, 'linear');
      c.sekil(`hat-${i}d`, 'daire', L.j.x, L.j.y, HAT, { t0: tB + s1, renk: acc, giris: 'yok', grup: gH });
      L.t = { s1, s2, tB };
    }

    // ── tren: bacaklar boyunca hareket (konum + dönüş) ───────────────────
    const trX = [];
    const trY = [];
    const trR = [];
    for (let i = 0; i <= n; i++) {
      const L = BL[i];
      const { s1, s2, tB } = L.t;
      const dir2 = L.ang2;
      const ilk = i === 0;
      if (ilk) { trX.push(k(0, L.a.x)); trY.push(k(0, L.a.y)); trR.push(k(0, 90)); }
      trX.push(k(tB, L.a.x, 'linear'), k(tB + s1, L.j.x, 'inOutSine'), k(tB + s1 + s2, L.b.x, 'inOutSine'));
      trY.push(k(tB, L.a.y, 'linear'), k(tB + s1, L.j.y, 'inOutSine'), k(tB + s1 + s2, L.b.y, 'inOutSine'));
      trR.push(k(tB, 90, 'linear'), k(tB + s1 - 0.05, 90, 'linear'), k(tB + s1 + 0.2, dir2, 'inOutSine'), k(tB + s1 + s2 - 0.2, dir2, 'linear'), k(tB + s1 + s2, 90, 'inOutSine'));
    }
    const duz = (a) => a.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
    const gT = c.grup('g-tren', 'Tren', true);

    // ── kapak ─────────────────────────────────────────────────────────────
    c.sekil('kapak-rozet', 'daire', W * 0.14, H * 0.13, m * 0.12, { t0: 0.2, t1: tKapak, renk: hi(0), grup: 'g-acilis', sure: 0.4 });
    yazi('kapak-no', '1', 0.3, tKapak, { grup: 'g-acilis', x: W * 0.14, y: H * 0.13, size: 80, sabit: true, renk: '#ffffff', weight: 800 });
    Z.kapak({ renk: INK, kancaRenk: hi(0), altRenk: '#ffffff', altKutu: hi(0), yK: 0.13, yB: 0.24, yA: 0.38, yN: 0.62, nesnePx: 0.3, weight: 800, suslemeTipi: 'yok', kancaSize: 54, baslikSize: 160, sar: 13, upper: false });
    c.sekil('ist-0', 'daire', P(0).x, P(0).y, 86, { t0: 0.2, renk: '#ffffff', grup: gH, sure: 0.5 });
    c.sekil('ist-0-halka', 'halka', P(0).x, P(0).y, 86, { t0: 0.2, renk: INK, grup: gH, sure: 0.5 });

    // ── duraklar ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const st = i + 1;
      const acc = hi(st - 1);
      const t0 = pl.t0 + 0.0;
      const t1 = pl.t1;
      const D = P(st);
      const camY = camYof(st);
      const Yw = (f) => camY - H / 2 + H * f; // ekran oranı → dünya y
      const g = c.grup(`g-${st}`, `${s.yil || st} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tA = t0 + 0.45;
      for (let j = 0; j < pl.beats; j += 4) vuruslar.push(c.vurus(pl.b0 + j));

      // durak (halka istasyon)
      c.sekil(`ist-${st}`, 'daire', D.x, D.y, 92, { t0: t0 - 0.35, renk: '#ffffff', grup: gH, sure: 0.4 });
      c.sekil(`ist-${st}-halka`, 'halka', D.x, D.y, 92, { t0: t0 - 0.35, renk: INK, grup: gH, sure: 0.4 });
      c.halka(`ist-${st}-dalga`, t0 - 0.2, D.x, D.y, acc, { group: g, alfa: 0.7, boyut: 60, son: 330, sure: 0.8 });

      // yıl rozeti (karşı tarafta, istasyona hizalı)
      const sol = D.x < W / 2;
      const yilM = s.yil || String(st);
      const rx = sol ? D.x + 120 : D.x - 120;
      yazi(`yil-${st}`, yilM, tA, null, {
        grup: g, x: rx, y: D.y, size: yilM.length > 8 ? 70 : 100, maxW: W * 0.46, align: sol ? 'left' : 'right', renk: '#ffffff', weight: 800, kutu: acc, kutuAlfa: 1, radius: 999, pad: [8, 36],
        reveal: [0.05, 0.5], anims: [{ preset: 'zipla-gir', t: R2(tA), dur: 0.5 }],
      });
      // sıra bilgisi (hat 1 · durak 3/6)
      yazi(`sira-${st}`, `HAT 1 · DURAK ${st}/${n}`, tA, null, { grup: g, x: sol ? D.x + 120 : D.x - 120, y: D.y - 78, size: 28, sabit: true, align: sol ? 'left' : 'right', font: MONO, renk: acc, weight: 700, harf: 4, reveal: [0.05, 0.6] });

      // cam kart + nesne
      const kx = W / 2;
      const ky = Yw(0.5);
      const asset = nesneSec(s.nesne);
      const [aw, ah] = varlikBoyut(asset);
      c.sekil(`kart-g-${st}`, 'kart-kare', kx + 10, ky + 18, 560 * 1.05, { t0: tA + 0.2, renk: '#000000', opacity: 0.12, grup: g, blur: 18, sure: 0.5 });
      c.sekil(`kart-${st}`, 'kart-kare', kx, ky, 560 * 1.05, { t0: tA + 0.2, renk: '#ffffff', grup: g, sure: 0.5 });
      c.sekil(`kart-t-${st}`, 'kart-kare', kx, ky, 560 * 1.05, { t0: tA + 0.2, renk: acc, opacity: 0.16, grup: g, sure: 0.5 });
      c.L({
        id: `nesne-${st}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: kx, y: Math.round(ky + m * 0.22), anchor: [0.5, 1], scale: R2((m * 0.4) / Math.max(aw, ah)), start: R2(tA + 0.35),
        anims: [{ preset: 'zipla-gir', t: R2(tA + 0.35), dur: 0.7 }, { preset: 'suzul', t: R2(tA + 1.2), genlik: 8, periyot: 3.4 }],
      });
      if (s.balon) {
        yazi(`balon-${st}`, s.balon, tA + 1.2, null, { grup: g, x: sol ? W * 0.76 : W * 0.24, y: ky - 330, size: 56, maxW: W * 0.32, sar: 10, kutu: INK, radius: 28, pad: [8, 24], rot: sol ? 5 : -5, renk: '#ffffff', weight: 800, anims: [{ preset: 'zipla-gir', t: R2(tA + 1.2), dur: 0.5 }, { preset: 'sallan', t: R2(tA + 1.8), aci: 3, periyot: 1.8 }] });
      }
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        yazi(`not-${st}${'ab'[j]}`, `#${nt}`, tA + 2.2 + j * 0.4, null, { grup: g, x: kx + (j % 2 ? 190 : -190), y: ky + 320, size: 34, sabit: true, font: MONO, renk: INK, weight: 700, kutu: acc, kutuAlfa: 0.35, radius: 999, pad: [6, 18], anims: [{ preset: 'zipla-gir', t: R2(tA + 2.2 + j * 0.4), dur: 0.4 }] });
      });

      // koyu sefer bilgisi paneli
      const py = Yw(0.775);
      yuvarlak(`panel-${st}`, g, W / 2, py, W * 0.9, H * 0.2, 44, INK, tA + 0.8);
      yazi(`ad-${st}`, s.ad, tA + 1.0, null, { grup: g, x: 100, y: py - H * 0.067, size: 44, sabit: true, align: 'left', renk: acc, weight: 800, upper: true, harf: 5, reveal: [0.05, 0.6] });
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${st}${'ab'[j]}`, ln, tA + 1.4 + j * 1.1, null, { grup: g, x: 100, y: py - H * 0.012 + j * H * 0.046, size: 50, maxW: W * 0.84, sar: 34, align: 'left', renk: '#ffffff', weight: 600, reveal: [0.05, 0.9] });
      });
      const nxt = planlar[i + 1] ? planlar[i + 1].s.ad : null;
      if (nxt) yazi(`sonraki-${st}`, `Sonraki durak › ${nxt}`, tA + 2.6, null, { grup: g, x: W - 100, y: py + H * 0.092, size: 30, sabit: true, align: 'right', font: MONO, renk: '#b9b6ad', weight: 700, harf: 1, reveal: [0.05, 0.9] });
      Z.ses(pl, tA);
      // içerik, sonraki durağa geçerken solar (dünyada üst üste binmesin)
      c.layers.filter((l) => l.group === g && l.end == null).forEach((l) => { l.end = R2(t1 + 0.9); });
    });

    // ── tren katmanı (en üstte) ───────────────────────────────────────────
    c.sekil('tren-golge', 'hap', 1, 1, 400, { t0: 0, renk: '#000000', opacity: 0.18, giris: 'yok', grup: gT, blur: 8, extra: { scale: 1, scaleX: 0.56, scaleY: 0.62, x: duz(trX).map((e) => ({ ...e, v: e.v + 8 })), y: duz(trY).map((e) => ({ ...e, v: e.v + 12 })), rotation: duz(trR) } });
    c.sekil('tren', 'hap', 1, 1, 400, { t0: 0, renk: INK, giris: 'yok', grup: gT, extra: { scale: 1, scaleX: 0.56, scaleY: 0.62, x: duz(trX), y: duz(trY), rotation: duz(trR) } });
    c.sekil('tren-cam', 'hap', 1, 1, 400, { t0: 0, renk: '#ffffff', opacity: 0.9, giris: 'yok', grup: gT, extra: { scale: 1, scaleX: 0.34, scaleY: 0.3, x: duz(trX), y: duz(trY), rotation: duz(trR) } });

    // ── kapanış (son durak) ───────────────────────────────────────────────
    const Dz = Pn(nDur);
    const dxK = Dz.x - W / 2;
    const dyK = camYof(nDur) - H / 2 + H * 0.2;
    c.sekil('son-ist', 'daire', Dz.x, Dz.y, 110, { t0: tK - 0.4, renk: '#ffffff', grup: gH, sure: 0.4 });
    c.sekil('son-ist-halka', 'halka', Dz.x, Dz.y, 110, { t0: tK - 0.4, renk: INK, grup: gH, sure: 0.4 });
    Z.isik('son-isik', Dz.x, Dz.y + H * 0.15, m * 1.4, hi(n), { t0: tK, opacity: 0.2, blur: 90, grup: 'g-kapanis' });
    Z.kapanis({ renk: INK, dx: dxK, dy: dyK, t0: tK + 0.5, soruRenk: '#ffffff', soruKutu: hi(n), ctaRenk: '#6b6a74' });
    vuruslar.push(tK + 0.5);

    // ── kamera: treni izler ───────────────────────────────────────────────
    const camX = [k(0, W / 2)];
    const camY = [k(0, H / 2)];
    const camZ = [k(0, 1.1), k(3, 1, 'inOutCubic')];
    let sy = H / 2;
    for (let i = 1; i <= nDur; i++) {
      const L = BL[i - 1];
      const tB = L.t.tB + 0.1;
      const ty = camYof(i);
      camY.push(k(tB, sy, 'linear'), k(tB + trenSure + 0.1, ty, 'inOutCubic'));
      camZ.push(k(tB, 1, 'linear'), k(tB + trenSure / 2, 0.93, 'inOutSine'), k(tB + trenSure + 0.1, 1, 'inOutSine'));
      sy = ty;
    }
    return Z.bitir(brief.ad, {
      background: { type: 'linear', colors: ['#f7f5ef', '#ece8dc'], angle: 180, paper: 0.3, vignette: 0.12 },
      camera: { x: W / 2, y: duz(camY), zoom: duz(camZ) },
    });
  },
};
