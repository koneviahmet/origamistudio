// Gözlü · NEDEN? (neden-sonuç zinciri): Gözlü büyük bir "neden" sorusuna kafa yorar; cevap adım adım ok bağlı kartlarla kurulur,
// Gözlü her karta işaret eder (gözleri karta döner), sonunda ampul yanar ve tek cümlelik cevap çarpar. Bilim, tarih, ekonomi, gündelik "neden" videoları.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

export default {
  id: 'gozlu-neden',
  ad: 'Gözlü · Neden? (ok bağlı neden-sonuç zinciri)',
  etiket: 'Eğitim · Bilim · Açıklama · Gözlü',
  sure: '35–60 sn',
  aciklama: 'Gözlü bir "neden" sorusuna kafa yorar; cevap ok bağlı 3–4 kartın zinciriyle adım adım kurulur, Gözlü her karta işaret eder, sonda ampul yanar ve cevap çarpar. Her "neden?" konusuna uyar.',
  ornek: {
    sablon: 'gozlu-neden', id: 'sablon-gozlu-neden', ad: 'Gökyüzü Neden Mavi?', format: 'reels', palet: 'kagit', muzik: 'lofi-90', font: 'Baloo 2',
    soru: 'Gökyüzü neden mavi?', varyant: 'kafalisi', ekler: ['bere'], selam: 'Hmm… Bunu hiç düşündün mü?',
    zincir: [
      { baslik: 'Güneş ışığı gelir', metin: 'Güneşten gelen beyaz ışık aslında tüm renkleri taşır.' },
      { baslik: 'Havaya çarpar', metin: 'Işık atmosferdeki gaz moleküllerine çarpar ve dağılır.' },
      { baslik: 'Mavi en çok saçılır', metin: 'Kısa dalga boylu mavi, diğer renklerden çok daha fazla saçılır.' },
    ],
    cevap: 'Mavi ışık en çok saçıldığı için her yerden bize ulaşır.', cta: 'Başka neden sorun var mı?',
    yayin: { baslik: 'Gökyüzü neden mavi? 3 adımda cevap ☁️', aciklama: 'Gözlü gökyüzünün mavi olmasının nedenini 3 adımda anlatıyor. Merak ettiğin başka bir "neden" varsa yoruma yaz!', etiketler: ['nedenmavi', 'gokyuzu', 'bilim', 'merak', 'egitim', 'neden', 'animasyon', 'shorts', 'reels', 'biliyormuydun'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'soru', 'zincir'], 'gozlu-neden');
    const c = karakterKur(brief, { palet: 'kagit', muzik: 'lofi-90', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const Z = brief.zincir.slice(0, 4);
    const n = Z.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const goz = c.karakter('gozlu', 'gozlu', { id: 'gozlu', konum: 'orta', varyant: brief.varyant || 'kafalisi', ekler: brief.ekler || ['bere'], start: 0.3, boy: 0.27 });

    // ── soru ─────────────────────────────────────────────────────────────
    const gS = c.grup('g-soru', 'Soru', true);
    c.bolum(0, 'Soru');
    c.akis(goz, { t: 0.5, aksiyon: 'dusun', duygu: 'dusunceli', efekt: 'soru', bak: 'yukari' });
    const dA = c.konus({ goz }, [{ kim: 'goz', metin: brief.selam || 'Hmm… Bunu hiç düşündün mü?', duygu: 'dusunceli', sure: 2.6 }], 1.2, { bak: false });
    const t0 = c.snap(dA.bitis + 0.4);
    c.etiket('konu', 'NEDEN?', c.snap(0.8), t0, { grup: gS, i: 0 });
    c.dekor('daireler', 0, t0, c.vurgu(0), { grup: gS, id: 'soru-dekor', alfa: 0.18 });
    const sq = sarMetin(brief.soru, 14);
    c.slam('soru', sq, 0.1, t0, { y: H * 0.24, size: 190, maxW: W * 0.74, renk: c.yazi(0), grup: gS, nabiz: 0.03, lh: 1.0, upper: false, harf: 0 });
    vuruslar.push(0.1, c.snap(1.2));
    let t = t0;

    // ── zincir ───────────────────────────────────────────────────────────
    const gZ = c.grup('g-zincir', 'Zincir');
    const adimSure = Z.map((z) => c.snap(Math.max(3.2, c.sure(z.metin || z.baslik) ) + 1.1));
    const tZ0 = t;
    const tZ1 = R2(tZ0 + adimSure.reduce((a, b) => a + b, 0) + 0.2);
    c.bolum(tZ0, 'Zincir');
    bgler.push({ t: tZ0, i: 1 });
    c.silme('silme-zincir', tZ0, c.vurgu(1), { sure: 0.55 });
    c.dekor('seritler', tZ0, tZ1, c.vurgu(1), { grup: gZ, id: 'zincir-dekor', alfa: 0.12 });
    const aralik = Math.min(0.07, 0.18 / Math.max(1, n - 1));
    const y0 = 0.155;
    let ta = tZ0 + 0.5;
    const ids = [];
    Z.forEach((z, j) => {
      const id = `dugum-${j + 1}`;
      ids.push(id);
      const y = H * (y0 + j * aralik);
      const vur = c.vurgu(1 + j);
      const t1 = R2(tZ1);
      c.kart(id, `${j + 1}  ${z.baslik}`, ta, t1, { y, size: 62, sar: 30, grup: gZ, giris: j % 2 ? 'sag' : 'sol', maxW: 0.84, zemin: j % 2 ? '#ffffff' : c.vurgu(1), renk: j % 2 ? '#1b1b2b' : yaziRengi(c.vurgu(1)) });
      if (j > 0) {
        c.L({
          id: `ok-${j}`, group: gZ, type: 'arrow', arrow: 'ok-kalin-golge', from: ids[j - 1], to: id, fromAnchor: 'alt', toAnchor: 'ust', color: c.yazi(1),
          fold: [k(ta - 0.1, 0), k(ta + 0.35, 1, 'outCubic')], start: R2(ta - 0.1), end: t1,
        });
      }
      const d = c.konus({ goz }, [{ kim: 'goz', metin: z.metin || z.baslik, duygu: 'mutlu', aksiyon: 'isaret', hedef: id, bak: id, sure: Math.min(c.sure(z.metin || z.baslik), 4.4) }], R2(ta + 0.3), { bak: false });
      c.halka(`halka-${j + 1}`, ta, W / 2, y, vur, { group: gZ, alfa: 0.55, boyut: m * 0.2, son: m * 1.1, sure: 0.5 });
      c.flas(`flas-${j + 1}`, ta, { alfa: 0.18 });
      vuruslar.push(ta, c.snap(ta + 1));
      c.bolum(ta, z.baslik);
      ta = R2(ta + adimSure[j]);
    });
    t = c.snap(tZ1);

    // ── cevap ────────────────────────────────────────────────────────────
    const tC = t;
    const tCe = c.vurus(Math.round((tC - c.off) / c.p) + 9);
    const gC = c.grup('g-cevap', 'Cevap', true);
    c.bolum(tC, 'Cevap');
    bgler.push({ t: tC, i: 2 });
    c.silme('silme-cevap', tC, c.vurgu(2));
    c.dekor('patlama', tC, tCe, c.vurgu(2), { grup: gC, id: 'cevap-dekor', alfa: 0.22 });
    c.etiket('cevap-etiket', 'CEVAP', tC + 0.25, tCe, { zemin: c.yazi(2), renk: c.zemin(2), grup: gC });
    c.slam('cevap', sarMetin(brief.cevap || 'İşte cevap!', 22), tC + 0.2, tCe, { y: H * 0.27, size: 112, maxW: W * 0.82, renk: c.yazi(2), grup: gC, nabiz: 0.02, lh: 1.05, upper: false, harf: 0 });
    c.L({ id: 'cevap-konfeti', group: gC, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: Math.round(H * 0.3), start: R2(tC + 0.15), end: R2(tCe) });
    c.akis(goz, { t: R2(tC + 0.2), aksiyon: 'fikir', duygu: 'heyecanli', efekt: 'ampul', bak: 'ileri' });
    c.akis(goz, { t: R2(tC + 2.0), aksiyon: 'zafer', duygu: 'cok-mutlu', efekt: 'yildiz' });
    vuruslar.push(tC, c.snap(tC + 1));
    t = tCe;

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: 3 });
    c.silme('silme-son', tK, c.vurgu(3));
    c.kapanisKar(tK, tEnd, brief.cta || 'Başka neden sorun var mı?', brief.alt, [goz], { i: 3 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    c.ilerleme(0.4, tEnd - 0.2, { y: Math.round(H * 0.106) });
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
