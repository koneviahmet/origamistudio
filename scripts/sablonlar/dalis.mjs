// Dalış (model / kavram evrimi): tek bir kavramın tarihsel modelleri art arda anlatılır. Atomun Hikâyesi'nden genelleştirildi.
// Her bölüm: yıl + ad (sabit), merkezde bir ŞEMA (tek · bölün · küme · gömülü · ışın · yörünge · bulut) kendini çizer, oklu etiketler,
// iki bilgi satırı; bölüm sonunda kamera şemanın İÇİNE DALAR (yakınlaşıp solar) ve sıradaki model aynı yerden çıkar.
// Altta zincirleme zaman şeridi (küçük simgeler + yıllar + el çizimi oklar) birikir. Anlatım metni → anlatim.txt (npm run seslendir).
import { gerekli, nesneSec, varlikBoyut, varliklar, wavOku } from './lib.mjs';
import { reels, sarMetin, sigdirFont, parlaklik } from './reels.mjs';

const R2 = (n) => Math.round(n * 100) / 100;
const kelimeSay = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
export const DALIS_DUZENLER = ['tek', 'bolun', 'kume', 'gomulu', 'isin', 'yorunge', 'bulut'];

export default {
  id: 'dalis',
  ad: 'Dalış (model evrimi)',
  etiket: 'Bilim · Kavram zinciri',
  sure: '45–100 sn',
  aciklama: 'Bir kavramın tarihsel modelleri sırayla: merkezde şema kendini çizer, oklu etiketler gelir, bölüm sonunda kamera şemanın içine dalıp sıradakine geçer. Altta zincirleme zaman şeridi. Atom, hücre, evren modeli gibi konular için.',
  ornek: {
    sablon: 'dalis', id: 'sablon-dalis', ad: 'Atomun Hikâyesi', format: 'reels', palet: 'kagit', muzik: 'lofi-90', font: 'Mali', stil: 'cizim', murekkep: '#4b3f72',
    baslik: 'Atomun Hikâyesi', altBaslik: 'en küçük parçanın büyük yolculuğu', kapakDuzen: 'yorunge', kapakNesne: 'atom-cekirdek', kapakHalka: 'atom-yorunge',
    bolumler: [
      { yil: 'MÖ ~400', ad: 'Demokritos', duzen: 'bolun', nesne: 'atom-blok', bilgi: ['Madde sonsuza dek bölünemez', 'En küçük parçaya “atomos” dedi'], notlar: ['atomos'], anlatim: 'İ.Ö. dört yüz civarı. Demokritos, maddenin sonsuza dek bölünemeyeceğini düşündü ve en küçük parçaya atomos dedi.' },
      { yil: '1803', ad: 'Dalton', duzen: 'kume', nesne: 'atom-kure', bilgi: ['Her element kendine özgü küçük bir top', 'Katı ve bölünemez'], notlar: ['katı · bölünemez'], anlatim: 'Bin sekiz yüz üç. Dalton, her elementin kendine özgü, katı ve bölünemez küçük toplardan oluştuğunu söyledi.' },
      { yil: '1897', ad: 'Thomson', duzen: 'gomulu', nesne: 'atom-kure', nesne2: 'atom-kure', bilgi: ['Elektron keşfedildi', 'Atom: elektronlu, pozitif bir kek'], notlar: ['elektron', 'pozitif yüklü kek'], anlatim: 'Bin sekiz yüz doksan yedi. Thomson elektronu keşfetti ve atomu, içinde elektronlar gömülü pozitif bir keke benzetti.' },
      { yil: '1911', ad: 'Rutherford', duzen: 'isin', nesne: 'atom-levha', nesne2: 'atom-kaynak', mermi: 'atom-kure', bilgi: ['Ortada küçük, yoğun bir çekirdek', 'Atomun çoğu boşluk'], notlar: ['altın levha', 'çekirdek'], anlatim: 'Bin dokuz yüz on bir. Rutherford, altın levhaya parçacık gönderdi ve atomun ortasında küçük, yoğun bir çekirdek olduğunu buldu.' },
      { yil: '1913', ad: 'Bohr', duzen: 'yorunge', nesne: 'atom-cekirdek', nesne2: 'atom-yorunge', bilgi: ['Elektronlar belirli yörüngelerde döner', 'Küçük bir güneş sistemi'], notlar: ['yörünge'], anlatim: 'Bin dokuz yüz on üç. Bohr, elektronların çekirdeğin çevresinde belirli yörüngelerde döndüğünü önerdi.' },
      { yil: '1926', ad: 'Elektron bulutu', duzen: 'bulut', nesne: 'atom-bulut', merkez: 'atom-cekirdek', bilgi: ['Yer değil, olasılık', 'Bulut yoğunsa elektron orada olabilir'], notlar: ['elektronun olası yeri'], anlatim: 'Bin dokuz yüz yirmi altı. Elektron artık bir nokta değil, bir olasılık bulutu olarak düşünülüyor.' },
    ],
    son1: 'Hikâye', son2: 'sürüyor…', soru: 'merak ettikçe derine iniyoruz', cta: '',
    yayin: { baslik: 'Atomun hikâyesi: 2400 yılda 6 model', aciklama: 'Demokritos\'tan elektron bulutuna atom modelinin yolculuğu. Sence sıradaki model ne olacak?', etiketler: ['atom', 'bilim', 'fizik', 'kimya', 'reels', 'shorts', 'egitim'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'bolumler'], 'dalis');
    const c = reels(brief, { palet: 'kagit', muzik: 'lofi-90', font: 'Mali', govde: 'Quicksand', stil: 'cizim' });
    const { W, H, k, m } = c;
    const font = c.font;
    const govde = c.govde;
    const bol = brief.bolumler.slice(0, 9);
    const n = bol.length;
    const p = c.p;
    const lib = varliklar();
    const koyu = parlaklik(c.zemin(0)) < 148;
    const murekkep = brief.murekkep || (koyu ? '#f4efe1' : '#2d3561');
    const soluk = koyu ? '#c9c0e0' : '#6b5f8f';
    const hi = (i) => c.pal.acc[i % c.pal.acc.length];
    const hiYazi = koyu ? '#1b2228' : '#2d3561';
    const cizim = c.stil === 'cizim';
    const cizGir = (t, dur) => (cizim ? { preset: 'cizerek-gir', t: R2(t), dur } : { preset: 'katlanarak-gir', t: R2(t), dur });

    const cy = H * 0.425; // şema merkezi
    const cyKapak = H * 0.5;
    const cx = W / 2;
    const Rb0 = m * 0.46; // şema taban boyutu
    const anlatim = [];
    const audio = [];

    // ── zamanlama ─────────────────────────────────────────────────────────
    const DIVE = 1.5;
    const kapakBeats = 10;
    let b = kapakBeats;
    const planlar = bol.map((s) => {
      const bilgi = (s.bilgi || []).slice(0, 2);
      const sesDosya = s.ses && wavOku(String(s.ses));
      const sesSure = sesDosya ? sesDosya.mono.length / sesDosya.sampleRate : 0;
      const anlat = s.anlatim ? (sesSure || String(s.anlatim).length / 14 + 0.9) + 1.0 : 0;
      const icerik = 4.6 + bilgi.reduce((x, l) => x + kelimeSay(l), 0) * 0.3;
      const sn = Math.max(8, icerik, anlat) + DIVE;
      const beats = Math.ceil(sn / p / 2) * 2;
      const pl = { s, bilgi, beats, b0: b };
      b += beats;
      return pl;
    });
    const bK = b;
    const kapSure = 8;
    const tK = c.vurus(bK);
    const tEnd = c.vurus(bK + kapSure);
    const tKapak = c.vurus(kapakBeats);

    // arka plan (dönem rengine süzülür)
    const gol = (hex) => {
      const v = parseInt(hex.slice(1), 16);
      const f = parlaklik(hex) > 148 ? 0.94 : 0.8;
      return '#' + [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.round(Math.min(255, x * f)).toString(16).padStart(2, '0')).join('');
    };
    const bgA = [k(0, c.zemin(0))];
    const bgB = [k(0, gol(c.zemin(0)))];
    planlar.forEach((pl, i) => {
      const t0 = c.vurus(pl.b0);
      bgA.push(k(t0 - 0.5, c.zemin(i), 'linear'), k(t0 + 0.5, c.zemin(i + 1), 'inOutSine'));
      bgB.push(k(t0 - 0.5, gol(c.zemin(i)), 'linear'), k(t0 + 0.5, gol(c.zemin(i + 1)), 'inOutSine'));
    });
    bgA.push(k(tK - 0.5, c.zemin(n), 'linear'), k(tK + 0.5, c.zemin(n + 1), 'inOutSine'));
    bgB.push(k(tK - 0.5, gol(c.zemin(n)), 'linear'), k(tK + 0.5, gol(c.zemin(n + 1)), 'inOutSine'));

    // ── yardımcılar ───────────────────────────────────────────────────────
    const boyutOf = (asset) => {
      const [w, h] = varlikBoyut(asset);
      return Math.max(w, h);
    };
    /** Metin: ui = true → kamera dalışından etkilenmez (depth 1) */
    const yazi = (id, text, t0, t1, o) => {
      const metin = o.sar ? sarMetin(text, o.sar) : String(text);
      const f = o.font || font;
      const size = o.sabit ? o.size : sigdirFont(metin, f, o.maxW ?? W * 0.9, o.size ?? 80, false);
      return c.L({
        id, ...(o.grup ? { group: o.grup } : {}), type: 'text', text: metin, font: f, weight: o.weight ?? 700, color: o.renk || murekkep, x: o.x ?? W / 2, y: o.y, size,
        align: 'center', lineHeight: o.lh ?? 1.1, start: R2(t0), ...(t1 != null ? { end: R2(t1) } : {}), ...(o.ui ? { depth: 1 } : {}),
        ...(o.reveal ? { reveal: [k(t0 + o.reveal[0], 0), k(t0 + o.reveal[0] + Math.max(0.02, o.reveal[1]), 1, 'linear')] } : {}),
        ...(o.rot ? { rotation: o.rot } : {}), ...(o.opacity ? { opacity: o.opacity } : {}),
        ...(o.kutu ? { box: { color: o.kutu, opacity: 0.88, radius: 16, shadow: false, padding: [4, 26] } } : {}),
        ...(o.textAnims ? { textAnims: o.textAnims } : {}), ...(o.anims ? { anims: o.anims } : {}),
      });
    };

    /**
     * Şema üreticisi. t0..t1 = bölümün görünme aralığı, fadeT = solma başlangıcı (dalış), cyy = merkez y.
     * Döndürür: { hedef (oklar için ana katman id), alt: oklar için ikinci hedef }
     */
    function sema(pre, s, g, t0, t1, fadeT, cyy, kapak = false) {
      const Rb = kapak ? Rb0 * 1.3 : Rb0;
      const duzen = s.duzen || 'tek';
      const nesne = nesneSec(s.nesne, 'daire');
      const nesne2 = s.nesne2 && lib.has(s.nesne2) ? s.nesne2 : null;
      const fade = { opacity: [k(fadeT, 1), k(t1 - 0.12, 0, 'linear')] };
      const bitis = kapak && t1 === tEnd ? {} : fade; // kapanış şeması solmaz
      const U = (id, asset, x, y, px, ts, te, extra = {}, anims = []) => {
        const sc = R2(px / boyutOf(asset));
        c.L({
          id, group: g, asset, ...(extra.variant ? { variant: extra.variant } : {}), x: R2(x), y: R2(y), anchor: [0.5, 0.5], scale: sc, start: R2(ts), end: R2(te), ...bitis,
          ...(extra.palette ? { palette: extra.palette } : {}), ...(extra.parts ? { parts: extra.parts } : {}), ...(extra.loops ? { loops: extra.loops } : {}), ...(extra.path ? { path: extra.path, pathT: extra.pathT } : {}),
          ...(extra.opacity ? { opacity: extra.opacity } : {}), ...(extra.scale ? { scale: extra.scale } : {}), ...(extra.rotation ? { rotation: extra.rotation } : {}),
          anims,
        });
        return id;
      };
      const pa = (i) => ({ a: s.renk || hi(i), });
      let hedef = `${pre}-ana`;
      let alt = hedef;

      if (duzen === 'tek') {
        U(hedef, nesne, cx, cyy, Rb, t0, t1, { palette: s.renk ? pa(0) : undefined }, [cizGir(t0 + 0.5, 1.6), { preset: 'nabiz', t: R2(t0 + 2.2), genlik: 0.03, periyot: p * 2 }]);
      } else if (duzen === 'bolun') {
        const tA = t0 + 3.4;
        const tB = t0 + 5.2;
        U(`${pre}-ana`, nesne, cx, cyy, Rb, t0, tA, {}, [cizGir(t0 + 0.5, 1.8)]);
        const o4 = [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]];
        o4.forEach(([dx, dy], j) => U(`${pre}-b${j + 1}`, nesne, cx + dx * Rb * 1.05, cyy + dy * Rb * 1.05, Rb * 0.48, tA, tB, {}, [cizGir(tA, 0.5), { preset: 'zipla-gir', t: R2(tA), dur: 0.5 }]));
        for (let j = 0; j < 8; j++) {
          const gx = (j % 4) - 1.5;
          const gy = j < 4 ? -0.5 : 0.5;
          U(`${pre}-m${j + 1}`, nesne, cx + gx * Rb * 0.26, cyy + gy * Rb * 0.3, Rb * 0.22, tB, t1, { palette: { a: hi(j + 1) } }, [cizGir(tB, 0.45), { preset: 'zipla-gir', t: R2(tB), dur: 0.4 }]);
        }
        hedef = `${pre}-m2`;
        alt = `${pre}-m7`;
      } else if (duzen === 'kume') {
        const yer = [[-0.22, -0.1, 0.78], [0.3, 0.14, 0.55], [-0.1, 0.34, 0.4]];
        yer.forEach(([dx, dy, f], j) => U(`${pre}-k${j + 1}`, nesne, cx + dx * Rb * 1.3, cyy + dy * Rb * 1.3, Rb * f, t0, t1, { palette: { a: j === 0 ? s.renk || hi(0) : hi(j + 1) } }, [cizGir(t0 + 0.7 + j * 0.7, 1.4), { preset: 'suzul', t: R2(t0 + 2.4 + j * 0.5), genlik: 7, periyot: 3.2 }]));
        hedef = `${pre}-k1`;
        alt = `${pre}-k2`;
      } else if (duzen === 'gomulu') {
        U(`${pre}-ana`, nesne, cx, cyy, Rb * 1.1, t0, t1, { palette: { a: s.renk || hi(0) } }, [cizGir(t0 + 0.5, 1.8)]);
        const miniler = [[-0.3, -0.2], [0.2, -0.32], [0.34, 0.05], [-0.05, 0.12], [-0.32, 0.22], [0.12, 0.34], [-0.12, -0.38], [0.38, 0.3]];
        miniler.forEach(([dx, dy], j) => {
          const tt = t0 + 2.2 + j * 0.28;
          const rr = Rb * 1.1;
          yazi(`${pre}-p${j + 1}`, '+', tt, t1, { grup: g, x: cx + dx * rr * 0.95 - rr * 0.05, y: cyy + dy * rr * 0.95, size: 54, sabit: true, renk: hi(1), anims: [{ preset: 'belir', t: R2(tt), dur: 0.4 }], opacity: [k(fadeT, 1), k(t1 - 0.12, 0, 'linear')] });
          U(`${pre}-e${j + 1}`, nesne2 || nesne, cx + dx * rr * 0.95 + rr * 0.06, cyy + dy * rr * 0.95 + 4, Rb * 0.15, tt + 0.25, t1, { palette: { a: hi(2) } }, [cizGir(tt + 0.25, 0.6), { preset: 'nabiz', t: R2(tt + 1), genlik: 0.12, periyot: 1.8 }]);
        });
        hedef = `${pre}-e2`;
        alt = `${pre}-ana`;
      } else if (duzen === 'isin') {
        const hx = cx + Rb * 0.55;
        U(`${pre}-ana`, nesne, hx, cyy, Rb * 1.05, t0, t1, {}, [cizGir(t0 + 0.8, 1.3)]);
        U(`${pre}-kaynak`, nesne2 || 'yildiz', cx - Rb * 0.78, cyy, Rb * 0.5, t0, t1, {}, [cizGir(t0 + 1.2, 1.2)]);
        const mermi = nesneSec(s.mermi || 'daire', 'daire');
        const yler = [-0.34, -0.22, -0.1, 0, 0.08, 0.2, 0.32];
        yler.forEach((dy, j) => {
          const ts = t0 + 2.4 + j * 0.45;
          const y = cyy + dy * Rb;
          const sapar = j === 1 || j === 4;
          const pts = sapar ? [[cx - Rb * 0.5, y], [hx - Rb * 0.06, y - dy * 0.1 * Rb], [W * 0.98, y + (dy < 0 ? -1 : 1) * Rb * 0.5]] : [[cx - Rb * 0.5, y], [hx, y], [W * 1.02, y + dy * 0.02 * Rb]];
          const sc = R2((Rb * 0.1) / boyutOf(mermi));
          c.L({
            id: `${pre}-mr${j + 1}`, group: g, asset: mermi, anchor: [0.5, 0.5], scale: sc, start: R2(ts), end: R2(Math.min(ts + 1.8, t1)), palette: { a: '#ffd166', c: '#fff7d6' },
            path: { points: pts.map(([x, y2]) => [R2(x), R2(y2)]), smooth: false }, pathT: [k(ts, 0), k(ts + 1.7, 1, 'linear')], anims: [{ preset: 'belir', t: R2(ts), dur: 0.2 }],
          });
        });
        hedef = `${pre}-ana`;
        alt = `${pre}-kaynak`;
      } else if (duzen === 'yorunge') {
        U(`${pre}-ana`, nesne, cx, cyy, Rb * 0.3, t0, t1, {}, [cizGir(t0 + 0.4, 1.0), { preset: 'nabiz', t: R2(t0 + 2), genlik: 0.06, periyot: 1.6 }]);
        const halkaAsset = s.nesne2 && lib.has(s.nesne2) ? s.nesne2 : kapak && brief.kapakHalka && lib.has(brief.kapakHalka) ? brief.kapakHalka : null;
        const parcalar = halkaAsset ? lib.get(halkaAsset).parts : [];
        [1, 1.75, 2.5].forEach((f, j) => {
          const tt = t0 + 0.9 + j * 0.9;
          if (halkaAsset) {
            const pr = parcalar[0];
            U(`${pre}-y${j + 1}`, halkaAsset, cx, cyy, Rb * 0.36 * f, tt, t1, { palette: { a: hi(j + 1) }, ...(pr ? { parts: { [pr]: { loops: [{ prop: 'rotation', type: 'saw', amp: 180, period: 3 + j * 1.1, phase: j * 0.35, start: tt + 0.9 }] } } } : {}) }, [cizGir(tt, 1.4)]);
          } else {
            const rx = Rb * 0.19 * f * 1.6;
            const ry = rx * 0.42;
            U(`${pre}-y${j + 1}`, 'halka', cx, cyy, rx * 2, tt, t1, { palette: { a: hi(j + 1) }, opacity: 0.8, scale: [k(tt, 0), k(tt + 0.7, R2((rx * 2) / boyutOf('halka')), 'outBack')] }, []);
            // elips: dikeyde ezilmiş halka
            const ly = c.layers[c.layers.length - 1];
            ly.scaleY = R2(0.42);
            const dot = nesneSec(s.mermi || s.nesne2 || 'daire', 'daire');
            U(`${pre}-d${j + 1}`, dot, cx, cyy, Rb * 0.09, tt + 0.5, t1, { palette: { a: hi(j + 2) }, loops: [{ prop: 'x', type: 'sine', amp: rx, period: 3 + j * 1.1, phase: j * 0.3 }, { prop: 'y', type: 'sine', amp: ry, period: 3 + j * 1.1, phase: j * 0.3 + 0.25 }] }, [{ preset: 'belir', t: R2(tt + 0.5), dur: 0.3 }]);
          }
        });
        hedef = `${pre}-y2`;
        alt = `${pre}-ana`;
      } else if (duzen === 'bulut') {
        U(`${pre}-ana`, nesne, cx, cyy, Rb * 1.25, t0, t1, {}, [cizGir(t0 + 0.9, 2.0), { preset: 'nefes', t: R2(t0 + 3), genlik: 0.025, periyot: 4 }]);
        const merkez = s.merkez && lib.has(s.merkez) ? s.merkez : null;
        if (merkez) U(`${pre}-mrk`, merkez, cx, cyy, Rb * 0.25, t0, t1, {}, [cizGir(t0 + 0.5, 1.0)]);
        c.L({ id: `${pre}-toz`, group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', count: 60, size: 38, speed: 0.5, seed: 7, prewarm: true, colors: [hi(0), hi(1), hi(2), hi(3)], area: [R2(cx - Rb * 0.6), R2(cyy - Rb * 0.6), R2(cx + Rb * 0.6), R2(cyy + Rb * 0.6)], start: R2(t0 + 1.8), end: R2(t1) });
        hedef = `${pre}-ana`;
        alt = `${pre}-ana`;
      }
      return { hedef, alt, duzen };
    }

    // ── kapak ─────────────────────────────────────────────────────────────
    const gK = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    const kapakS = { duzen: brief.kapakDuzen || 'yorunge', nesne: brief.kapakNesne || bol[0].nesne, nesne2: brief.kapakHalka, mermi: brief.kapakMermi };
    sema('kp', kapakS, gK, 0, tKapak, tKapak - DIVE, cyKapak, true);
    yazi('baslik', brief.baslik || brief.ad, 0.5, tKapak - DIVE + 0.3, {
      grup: gK, y: H * 0.17, size: 150, sar: 11, lh: 1.15, ui: true, textAnims: [{ preset: 'harf-zipla', t: 0.6, dur: 0.45, aralik: 0.05 }], anims: [{ preset: 'sol', t: R2(tKapak - DIVE - 0.1), dur: 0.4 }],
    });
    if (brief.altBaslik) yazi('alt-baslik', brief.altBaslik, 1, tKapak - DIVE + 0.3, { grup: gK, y: H * 0.74, size: 64, font: govde, ui: true, sar: 26, reveal: [0.4, 1.4], renk: soluk, anims: [{ preset: 'sol', t: R2(tKapak - DIVE - 0.1), dur: 0.4 }] });

    // ── zaman şeridi ──────────────────────────────────────────────────────
    const gS = c.grup('g-serit', 'Zaman şeridi', false);
    const sp = n > 1 ? Math.min(150, (W * 0.78) / (n - 1)) : 0;
    const sx = (i) => W / 2 + (i - (n - 1) / 2) * sp;
    const sy = H * 0.745;
    const ikonOf = (s) => ({ isin: s.mermi || s.nesne2, yorunge: s.nesne, bulut: s.merkez || s.nesne, gomulu: s.nesne }[s.duzen]) || s.nesne;

    // ── bölümler ──────────────────────────────────────────────────────────
    const camZ = [k(0, 1)];
    const camY = [k(0, H / 2)];
    const dalis = (t1, pivot) => {
      const tz = t1 - DIVE;
      camZ.push(k(R2(tz), 1), k(R2(t1 - 0.05), 5, 'inCubic'), k(R2(t1), 1, 'step'));
      camY.push(k(R2(tz), H / 2), k(R2(t1 - 0.05), R2(pivot), 'inCubic'), k(R2(t1), H / 2, 'step'));
    };
    dalis(tKapak, cyKapak);
    const vuruslar = [];
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = c.vurus(pl.b0);
      const t1 = c.vurus(pl.b0 + pl.beats);
      const tz = t1 - DIVE;
      const g = c.grup(`g-${i + 1}`, `${s.yil || i + 1} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      vuruslar.push(t0);
      const exit = [{ preset: 'sol', t: R2(tz - 0.15), dur: 0.4 }];
      yazi(`yil-${i + 1}`, s.yil || String(i + 1), t0, tz + 0.3, { grup: g, y: H * 0.135, size: 150, maxW: W * 0.86, ui: true, textAnims: [{ preset: 'harf-zipla', t: R2(t0 + 0.1), dur: 0.45, aralik: 0.06 }], anims: exit });
      yazi(`ad-${i + 1}`, s.ad, t0, tz + 0.3, { grup: g, y: H * 0.195, size: 80, ui: true, renk: soluk, reveal: [0.4, 0.8], anims: exit });

      const sm = sema(`b${i + 1}`, s, g, t0, t1, tz + 0.6, cy);
      // oklu etiketler
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const lx = W * (j % 2 ? 0.8 : 0.2);
        const ly = cy + Rb0 * (j % 2 ? 0.62 : -0.62);
        const tn = t0 + 3.2 + j * 0.6;
        yazi(`not-${i + 1}${'ab'[j]}`, nt, tn, tz - 0.1, { grup: g, x: lx, y: ly, size: 48, maxW: W * 0.34, sar: 14, kutu: hi(i + 2), rot: j % 2 ? 3 : -3, renk: hiYazi, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }] });
        c.L({
          id: `not-ok-${i + 1}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-el-cizimi', from: `not-${i + 1}${'ab'[j]}`, to: j % 2 ? sm.alt : sm.hedef, color: murekkep, width: 4, headSize: 30, bend: j % 2 ? 0.3 : -0.3,
          start: R2(tn + 0.3), end: R2(tz - 0.1), anims: [cizGir(tn + 0.3, 0.9), { preset: 'silinerek-cik', t: R2(tz - 0.7), dur: 0.6 }],
        });
      });
      // bilgi satırları
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${i + 1}${'ab'[j]}`, ln, t0, tz + 0.3, { grup: g, y: H * (0.645 + j * 0.05), size: 54, font: govde, ui: true, maxW: W * 0.88, sar: 40, reveal: [1.6 + j * 1.2, 1.0], renk: soluk, anims: exit });
      });
      // zaman şeridi simgesi + yıl + zincir oku
      const ikon = nesneSec(ikonOf(s) || s.nesne, 'daire');
      const ts = t0 + 0.6;
      const [aw, ah] = varlikBoyut(ikon);
      c.L({
        id: `serit-n${i + 1}`, group: gS, asset: ikon, x: R2(sx(i)), y: R2(sy), anchor: [0.5, 0.5], scale: R2(60 / Math.max(aw, ah)), start: R2(ts), depth: 1, palette: { a: s.renk || hi(i) },
        anims: [cizGir(ts, 0.9), { preset: 'nabiz', t: R2(ts + 1), dur: R2(pl.beats * p), genlik: 0.1, periyot: 1.4 }],
      });
      yazi(`serit-y${i + 1}`, s.yil || String(i + 1), ts + 0.3, null, { grup: gS, x: sx(i), y: sy + 52, size: 28, sabit: true, font: govde, ui: true, renk: soluk, anims: [{ preset: 'belir', t: R2(ts + 0.3), dur: 0.5 }] });
      if (i > 0) {
        c.L({
          id: `serit-ok${i}`, group: gS, type: 'arrow', arrow: 'ok-el-cizimi', from: `serit-n${i}`, to: `serit-n${i + 1}`, color: koyu ? '#6f6590' : '#b7a9d9', width: 3.8, head: 'yok', bend: 0.18, start: R2(ts), depth: 1,
          anims: [cizGir(ts, 1.0)],
        });
      }
      if (s.ses) audio.push({ file: String(s.ses), start: R2(t0 + 0.4), volume: 1 });
      if (s.anlatim) anlatim.push({ t: R2(t0 + 0.4), metin: String(s.anlatim) });
      dalis(t1, cy);
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    const gC = c.grup('g-kapanis', 'Kapanış', true);
    c.bolum(tK, 'Kapanış');
    if (brief.takip !== false) c.takip(tK + 1.2, tEnd, { grup: gC, y: 0.45 });
    else sema('kn', kapakS, gC, tK, tEnd, tEnd + 1, cyKapak, true);
    if (brief.son1) yazi('son-1', brief.son1, tK + 0.2, null, { grup: gC, y: H * 0.13, size: 140, ui: true, textAnims: [{ preset: 'harf-zipla', t: R2(tK + 0.3), dur: 0.45, aralik: 0.06 }] });
    yazi('son-2', brief.son2 || '…', tK + 0.5, null, { grup: gC, y: H * 0.225, size: 140, ui: true, textAnims: [{ preset: 'harf-zipla', t: R2(tK + 0.6), dur: 0.45, aralik: 0.06 }] });
    if (brief.soru) yazi('son-soru', brief.soru, tK + 1.5, null, { grup: gC, y: H * 0.64, size: 66, font: govde, ui: true, sar: 26, kutu: hi(1), renk: hiYazi, rot: -2, anims: [{ preset: 'zipla-gir', t: R2(tK + 1.6), dur: 0.6 }] });
    if (brief.cta) yazi('son-cta', brief.cta, tK + 2.5, null, { grup: gC, y: H * 0.64, size: 60, font: govde, ui: true, renk: soluk, reveal: [0.2, 1.2] });
    c.L({ id: 'kapanis-konfeti', group: gC, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: R2(tK), end: R2(tEnd), count: 40, prewarm: true, area: [60, 300, W - 60, Math.round(H * 0.7)] });
    for (let j = 0; j < kapSure; j += 2) vuruslar.push(c.vurus(bK + j));

    // ── sahne ─────────────────────────────────────────────────────────────
    const sc = c.bitir2(brief.ad, tEnd, {
      background: { type: 'linear', colors: [bgA, bgB], angle: 170, paper: 0.45, vignette: 0.14 },
      camera: { zoom: camZ, x: W / 2, y: camY },
      sketch: { ink: murekkep, width: 3.6, wobble: 1.7, hatch: 6.5, angle: 52, cross: true, wipe: 38, grain: 0.42, split: 0.5 },
    });
    if (audio.length) sc.audio = [...audio, ...(sc.audio || []).map((a) => ({ ...a, volume: Math.min(a.volume, 0.28) }))];
    if (anlatim.length) sc.meta = { anlatim };
    return sc;
  },
};
