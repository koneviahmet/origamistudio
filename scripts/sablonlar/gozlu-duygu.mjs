// Gözlü · DUYGU ATLASI: tek dev Gözlü, her duyguya geçer (yüzü, vücut dili ve rengiyle); üstte duygunun adı, altında kısa bir "baş etme" ipucu çarpar.
// Sonda tüm duygular hızlıca art arda akar: "hepsi normal". Duygusal okuryazarlık, psikoloji, çocuk eğitimi, özsakınım içerikleri için.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const HAREKET = { mutlu: 'zipla-yerinde', 'cok-mutlu': 'sevin', uzgun: 'uzgun-ol', aglayan: 'agla', kizgin: 'kizgin', ofkeli: 'yumruk', saskin: 'saskin', korku: 'kork', endiseli: 'kork', sikilmis: 'sikilgan', yorgun: 'yorgun', utanmis: 'omuz-silk', asik: 'bekle', heyecanli: 'zipla-yerinde', gururlu: 'zafer', kuskulu: 'kollar-kavusuk', dusunceli: 'dusun', huzurlu: 'bekle', uykulu: 'yorgun', gulen: 'gule' };
const EFEKT = { mutlu: 'yildiz', uzgun: null, kizgin: 'sinir', ofkeli: 'sinir', saskin: 'unlem', korku: 'unlem', asik: 'kalp', heyecanli: 'yildiz', dusunceli: 'soru', uykulu: 'uyku', endiseli: 'soru' };

export default {
  id: 'gozlu-duygu',
  ad: 'Gözlü · Duygu atlası',
  etiket: 'Eğitim · Psikoloji · Çocuk · Gözlü',
  sure: '35–60 sn',
  aciklama: 'Dev Gözlü her duyguya yüzü ve vücut diliyle geçer: üstte duygunun adı, altında kısa bir baş etme ipucu. Sonda tüm duygular hızlıca akar. Duygusal okuryazarlık ve psikoloji videoları için.',
  ornek: {
    sablon: 'gozlu-duygu', id: 'sablon-gozlu-duygu', ad: 'Duygu Atlası', format: 'reels', palet: 'pastel', muzik: 'lofi-90', font: 'Baloo 2',
    hook: 'Şu an ne *hissediyorsun?*', varyant: 'mavi', ekler: ['sac-kabarik'],
    duygular: [
      { duygu: 'mutlu', ad: 'Mutlu', ipucu: 'Sevdiğin birine anlat, mutluluk paylaşılınca büyür.', renk: '#ffd166' },
      { duygu: 'uzgun', ad: 'Üzgün', ipucu: 'Ağlamak serbest. Sonra bir bardak su iç, kısa bir yürüyüşe çık.', renk: '#9ecbff' },
      { duygu: 'kizgin', ad: 'Kızgın', ipucu: 'Cevap vermeden önce 10’a kadar say, derin nefes al.', renk: '#ff8a80' },
      { duygu: 'korku', ad: 'Korkmuş', ipucu: 'Neden korktuğunu yaz. Adını koyunca küçülür.', renk: '#b39ddb' },
      { duygu: 'saskin', ad: 'Şaşkın', ipucu: 'Bir an dur, durumu anlamaya çalış, acele etme.', renk: '#80deea' },
    ],
    son: 'Her duygu normaldir', cta: 'Bugün nasılsın? Yorumla!',
    yayin: { baslik: 'Duygu atlası: bugün ne hissediyorsun? 💭', aciklama: 'Gözlü 5 duyguyu ve her biri için kısa bir baş etme ipucunu anlatıyor. Her duygu normaldir! Bugün nasılsın, yoruma yaz.', etiketler: ['duygular', 'psikoloji', 'ruhsagligi', 'duygusalzeka', 'egitim', 'cocuk', 'animasyon', 'shorts', 'reels', 'farkindalik'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'duygular'], 'gozlu-duygu');
    const c = karakterKur(brief, { palet: 'pastel', muzik: 'lofi-90', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const D = brief.duygular.slice(0, 6);
    const n = D.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];
    const zoom = [k(0, 1)];

    const goz = c.karakter('gozlu', 'gozlu', { id: 'gozlu', konum: 'orta', varyant: brief.varyant || 'mavi', ekler: brief.ekler, start: 0.3, boy: 0.44, giris: 'zipla-gir' });

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    const introBeat = 8;
    const ra = c.yigin('hook', brief.hook || 'Şu an ne *hissediyorsun?*', 0, { i: 0, grup: gA, y: 0.22, yuk: 0.22, dekor: 'daireler', sure: introBeat });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    c.akis(goz, { t: 0.5, aksiyon: 'selamla', duygu: 'mutlu', sure: 2.2 });
    c.akis(goz, { t: 3.0, aksiyon: 'dusun', duygu: 'dusunceli', efekt: 'soru' });
    let t = ra.t1;
    const araliklar = [];

    // ── duygular ─────────────────────────────────────────────────────────
    D.forEach((d, i) => {
      const bi = i + 1;
      const g = c.grup(`g-duygu${bi}`, `${bi}. ${d.ad}`);
      const bg = d.renk || c.zemin(bi);
      const yaz = c.yazi(bi);
      const sure = Math.max(4.6, c.sure(d.ipucu || '') * 0.5 + 3.4);
      const tE = c.snap(t + sure);
      const hareket = d.aksiyon || HAREKET[d.duygu] || 'bekle';
      const efekt = d.efekt === undefined ? EFEKT[d.duygu] : d.efekt;
      c.bolum(t, d.ad);
      araliklar.push([t, tE]);
      bgler.push({ t, bg });
      c.silme(`silme-d${bi}`, t, c.vurgu(bi), { yon: i % 2 ? 'sag' : 'sol', sure: 0.5 });
      c.dekor(['halkalar', 'daireler', 'seritler', 'elmaslar', 'patlama'][i % 5], t, tE, c.vurgu(bi), { grup: g, id: `d${bi}-dekor`, alfa: 0.16 });
      c.slam(`d${bi}-ad`, d.ad, c.snap(t + 0.35), tE, { y: H * 0.165, size: 210, maxW: W * 0.84, renk: yaz, grup: g, nabiz: 0.035, upper: true, weight: 800 });
      if (d.ipucu) c.kart(`d${bi}-ipucu`, d.ipucu, c.snap(t + 1.5), tE, { y: H * 0.25, size: 52, sar: 36, grup: g, giris: 'yukari', maxW: 0.86, weight: 700 });
      // yüz: nötr → duygu (yumuşak) → zirve
      c.akis(goz, { t: R2(t + 0.1), aksiyon: 'bekle', duygu: 'notr', siddet: 1 });
      c.akis(goz, { t: R2(t + 0.55), aksiyon: hareket, duygu: d.duygu, siddet: 0.7, ...(efekt ? { efekt } : {}) });
      c.akis(goz, { t: R2(t + 1.8), aksiyon: hareket, duygu: d.duygu, siddet: 1.3 });
      c.akis(goz, { t: R2(tE - 0.5), aksiyon: 'bekle', duygu: 'notr', siddet: 1 });
      zoom.push(k(R2(t + 0.4), 1, 'linear'), k(R2(t + 1.0), 1.05, 'outCubic'), k(R2(tE - 0.4), 1.05, 'linear'), k(R2(tE), 1, 'inOutSine'));
      c.halka(`d${bi}-halka`, R2(t + 0.55), W / 2, H * 0.52, c.vurgu(bi), { group: g, alfa: 0.5, boyut: m * 0.3, son: m * 1.6, sure: 0.7 });
      vuruslar.push(t, c.snap(t + 0.4), c.snap(t + 1.6));
      t = tE;
    });

    // ── finalde hepsi birden ─────────────────────────────────────────────
    const tF = t;
    const hiz = c.p * 1.5;
    const tFe = R2(c.snap(tF + 0.8 + n * hiz + 3.0));
    const gF = c.grup('g-son', 'Hepsi normal', true);
    c.bolum(tF, 'Hepsi normal');
    bgler.push({ t: tF, i: n + 1 });
    c.silme('silme-final', tF, c.vurgu(n + 1));
    c.dekor('patlama', tF, tFe, c.vurgu(n + 1), { grup: gF, id: 'final-dekor', alfa: 0.2 });
    D.forEach((d, i) => {
      const a = R2(tF + 0.5 + i * hiz);
      c.akis(goz, { t: a, aksiyon: d.aksiyon || HAREKET[d.duygu] || 'bekle', duygu: d.duygu, siddet: 1.1, gecis: 0.1 });
      c.slam(`final-${i + 1}`, d.ad, a, R2(a + hiz), { y: H * 0.19, size: 240, maxW: W * 0.84, renk: c.yazi(n + 1), grup: gF, giris: 'slam', weight: 800 });
      vuruslar.push(a);
    });
    const tS = R2(tF + 0.5 + n * hiz);
    c.akis(goz, { t: tS, aksiyon: 'sunum', duygu: 'huzurlu', siddet: 1 });
    c.slam('final-son', sarMetin(brief.son || 'Her duygu normaldir', 14), tS, tFe, { y: H * 0.2, size: 200, maxW: W * 0.86, renk: c.yazi(n + 1), grup: gF, giris: 'slam', nabiz: 0.03, upper: false, harf: 0, lh: 1.0, weight: 800 });
    c.L({ id: 'final-yildiz', group: gF, type: 'particles', particle: 'yildiz-yagmuru', mode: 'surekli', start: R2(tS), end: R2(tFe), opacity: 0.8 });
    vuruslar.push(tS);
    c.noktalar('nokta', n, araliklar, tF, { y: H * 0.106 });
    t = tFe;

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 2 });
    c.silme('silme-son', tK, c.vurgu(n + 2));
    c.kapanisKar(tK, tEnd, brief.cta || 'Bugün nasılsın?', brief.alt, [goz], { i: n + 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    c.ilerleme(0.4, tEnd - 0.2, { y: Math.round(H * 0.106) });
    const cam = c.kameraVurus(vuruslar, { zoom: 0.015, egim: 0 });
    // duygu vurguları: yüze yaklaşma (vuruş zoom'unun üstüne)
    const zs = zoom.filter((e, q, a) => !q || e.t > a[q - 1].t);
    cam.zoom = zs.length > 1 ? zs.map((e) => ({ ...e })) : cam.zoom;
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: { ...cam, y: H * 0.52 } });
  },
};
