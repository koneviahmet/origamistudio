// Gözlü · MİNİ SKEÇ (plot twist): 2–3 Gözlü, farklı renk ve aksesuarla bir oyuncu kadrosu olur. Kamera konuşana kayar ve yaklaşır;
// replik zinciri beklenmedik bir "twist" cümlesine varır: kamera yüze çarpar, flaş + dev "PLOT TWIST" damgası, diğerleri şoka girer.
// Komedi, replik tabanlı hikâye, marka mizahı, "ben vs. arkadaşım" formatları için.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const KADRO = [
  { id: 'a', ad: 'Mavi', varyant: 'mavi', ekler: ['bere'] },
  { id: 'b', ad: 'Kırmızı', varyant: 'kirmizi', ekler: ['sef-sapkasi'] },
  { id: 'c', ad: 'Yeşil', varyant: 'yesil', ekler: ['gozluk'] },
];
const X2 = [0.3, 0.7];
const X3 = [0.21, 0.5, 0.79];

export default {
  id: 'gozlu-skec',
  ad: 'Gözlü · Mini skeç (plot twist)',
  etiket: 'Komedi · Hikâye · Diyalog · Gözlü',
  sure: '35–60 sn',
  aciklama: 'Üç Gözlü (farklı renk ve şapka) bir skeç oynar: kamera konuşana kayar, replikler beklenmedik bir "twist" cümlesine varır; kamera yüze çarpar, dev PLOT TWIST damgası ve şoka giren kadro gelir. Komedi ve marka mizahı için.',
  ornek: {
    sablon: 'gozlu-skec', id: 'sablon-gozlu-skec', ad: 'Kafede Wi-Fi', format: 'reels', palet: 'gunbatimi', muzik: 'pop-120', font: 'Baloo 2',
    mekan: 'Bir kafe', hook: 'Bu skeçin sonu *şaşırtacak*',
    oyuncular: [
      { id: 'a', ad: 'Müşteri', varyant: 'mavi', ekler: ['bere'] },
      { id: 'b', ad: 'Barista', varyant: 'kirmizi', ekler: ['sef-sapkasi'] },
      { id: 'c', ad: 'Komşu', varyant: 'yesil', ekler: ['gozluk'] },
    ],
    replikler: [
      { kim: 'b', metin: 'Hoş geldin! Ne alırsın?', duygu: 'mutlu' },
      { kim: 'a', metin: 'Bir kahve ve wi-fi şifresi lütfen.', duygu: 'heyecanli' },
      { kim: 'b', metin: 'Şifre kolay: burada kimse telefona bakmaz.', duygu: 'gururlu', aksiyon: 'anlat' },
      { kim: 'a', metin: 'Peki herkes ne yapıyor?', duygu: 'kuskulu' },
      { kim: 'c', metin: 'Biz sohbet ediyoruz!', duygu: 'cok-mutlu', aksiyon: 'sevin' },
      { kim: 'b', metin: 'Wi-Fi şifresi de zaten "sohbet". Tek bağlantı insanlar.', duygu: 'cok-mutlu', aksiyon: 'sunum', twist: true },
    ],
    cta: 'Sen de böyle bir kafe biliyor musun?',
    yayin: { baslik: 'Kafede wi-fi şifresi: plot twist! ☕', aciklama: 'Gözlü ve arkadaşları kafede şaşırtıcı bir sonla bitiyor. Sen olsan ne yapardın? Yoruma yaz, takip etmeyi unutma!', etiketler: ['mizah', 'skec', 'komik', 'kafe', 'plottwist', 'komedi', 'animasyon', 'shorts', 'reels', 'eglence'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'replikler'], 'gozlu-skec');
    const c = karakterKur(brief, { palet: 'gunbatimi', muzik: 'pop-120', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const kadro = (brief.oyuncular?.length ? brief.oyuncular : KADRO).slice(0, 3);
    const R = brief.replikler.slice(0, 10);
    const nk = kadro.length;
    const XS = nk === 2 ? X2 : X3;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    // kadro
    const layers = {};
    const xOf = {};
    kadro.forEach((o, q) => {
      const fx = XS[q];
      layers[o.id] = c.karakter('gozlu', 'gozlu', {
        id: `oyuncu-${o.id}`, konum: fx, varyant: o.varyant, ekler: o.ekler, start: 0.3 + q * 0.2, boy: 0.34, yon: fx > 0.6 ? -1 : 1,
      });
      xOf[o.id] = fx * W;
    });
    const isimler = Object.fromEntries(kadro.map((o) => [o.id, o.ad || o.id]));

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    const introBeat = 6;
    const ra = c.yigin('hook', brief.hook || 'Bu skeçin sonu *şaşırtacak*', 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'daireler', sure: introBeat });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.mekan ? `SAHNE · ${brief.mekan}` : brief.ad, c.snap(1.2), ra.t1, { grup: gA, i: 0 });
    kadro.forEach((o, q) => c.akis(layers[o.id], { t: R2(0.8 + q * 0.3), aksiyon: q ? 'bekle' : 'selamla', duygu: 'mutlu', sure: 1.6 }));
    let t = ra.t1;

    // ── sahne: replikler ─────────────────────────────────────────────────
    const tS = t;
    c.bolum(tS, 'Skeç');
    bgler.push({ t: tS, i: 1 });
    c.silme('silme-skec', tS, c.vurgu(1), { sure: 0.5 });
    const twistIdx = R.findIndex((r) => r.twist);
    const satirlar = R.map((r, i) => ({
      kim: r.kim, metin: r.metin, duygu: r.duygu || 'mutlu', ...(r.aksiyon ? { aksiyon: r.aksiyon } : {}),
      sure: Math.max(2.0, Math.min(c.sure(r.metin), 4.6)), bosluk: i + 1 === twistIdx ? 1.0 : 0.35,
      ...(i === twistIdx ? { tepki: Object.fromEntries(kadro.filter((o) => o.id !== r.kim).map((o) => [o.id, 'saskin'])) } : {}),
    }));
    const d = c.konus(layers, satirlar, tS + 0.8);
    const gS = c.grup('g-skec', 'Skeç');
    c.dekor('seritler', tS, d.bitis + 4, c.vurgu(1), { grup: gS, id: 'skec-dekor', alfa: 0.12 });
    c.sekil('zemin', 'kare', W / 2, H * 0.805, 200, { sx: (W * 1.2) / 200, sy: 0.05, renk: '#000000', opacity: 0.16, giris: 'yok', t0: R2(tS), t1: R2(d.bitis + 6), grup: gS });
    c.etiket('sahne-etiket', brief.mekan || brief.ad, tS + 0.3, d.zamanlar[0].t + 2, { zemin: c.yazi(1), renk: c.zemin(1), grup: gS, y: H * 0.115 });

    // kamera: konuşana kayar; twist'te yüze çarpar
    const camX = [k(0, W / 2)];
    const camZ = [k(0, 1)];
    const camY = [k(0, H / 2)];
    const camR = [k(0, 0)];
    const push = (a, x, z, y = H * 0.56) => {
      camX.push(k(R2(a), camX[camX.length - 1].v, 'linear'), k(R2(a + 0.7), Math.round(x), 'inOutCubic'));
      camZ.push(k(R2(a), camZ[camZ.length - 1].v, 'linear'), k(R2(a + 0.7), z, 'inOutCubic'));
      camY.push(k(R2(a), camY[camY.length - 1].v, 'linear'), k(R2(a + 0.7), Math.round(y), 'inOutCubic'));
    };
    d.zamanlar.forEach((z, i) => {
      const sx = xOf[z.kim];
      const twist = i === twistIdx;
      if (twist) {
        push(z.t - 0.05, sx, 1.4, H * 0.52);
        camR.push(k(R2(z.t - 0.05), 0, 'linear'), k(R2(z.t + 0.1), -2.5, 'outCubic'), k(R2(z.t + 0.35), 2, 'inOutSine'), k(R2(z.t + 0.7), 0, 'inOutSine'));
      } else push(z.t - 0.2, W / 2 + (sx - W / 2) * 0.8, 1.1);
      vuruslar.push(z.t);
    });

    // twist: flaş + damga
    let tEnd0 = d.bitis + 0.6;
    if (twistIdx >= 0) {
      const tz = d.zamanlar[twistIdx];
      const sx = xOf[tz.kim];
      const ta = R2(tz.t + 0.1);
      c.flas('twist-flas', ta, { alfa: 0.8 });
      c.halka('twist-halka', ta, sx, H * 0.52, c.vurgu(2), { alfa: 0.7, boyut: m * 0.2, son: m * 1.6, sure: 0.8 });
      c.damga('twist', 'PLOT TWIST!', R2(tz.t + 0.45), R2(tz.t + 0.45 + 2.6), sx, H * 0.26, m * 0.42, { zemin: '#ffe600', font: c.font, rot: -8 });
      c.L({ id: 'twist-konfeti', type: 'particles', particle: 'yildiz-yagmuru', mode: 'patlama', x: Math.round(sx), y: Math.round(H * 0.4), start: R2(ta), end: R2(ta + 2.4) });
      tEnd0 = R2(tz.t + tz.sure + 2.4);
      camX.push(k(R2(tEnd0 - 0.4), camX[camX.length - 1].v, 'linear'), k(R2(tEnd0 + 0.4), W / 2, 'inOutCubic'));
      camZ.push(k(R2(tEnd0 - 0.4), camZ[camZ.length - 1].v, 'linear'), k(R2(tEnd0 + 0.4), 1, 'inOutCubic'));
      camY.push(k(R2(tEnd0 - 0.4), camY[camY.length - 1].v, 'linear'), k(R2(tEnd0 + 0.4), H / 2, 'inOutCubic'));
      kadro.forEach((o) => c.akis(layers[o.id], { t: R2(tEnd0 - 0.2), aksiyon: o.id === tz.kim ? 'zafer' : 'gule', duygu: 'gulen', bak: 'ileri' }));
    } else {
      camX.push(k(R2(tEnd0), camX[camX.length - 1].v, 'linear'), k(R2(tEnd0 + 0.5), W / 2, 'inOutCubic'));
      camZ.push(k(R2(tEnd0), camZ[camZ.length - 1].v, 'linear'), k(R2(tEnd0 + 0.5), 1, 'inOutCubic'));
      camY.push(k(R2(tEnd0), camY[camY.length - 1].v, 'linear'), k(R2(tEnd0 + 0.5), H / 2, 'inOutCubic'));
    }
    t = c.snap(tEnd0 + 1.0);

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: 2 });
    c.silme('silme-son', tK, c.vurgu(2));
    c.kapanisKar(tK, tEnd, brief.cta || 'Sen olsan ne yapardın?', brief.alt, Object.values(layers), { i: 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    c.ilerleme(0.4, tEnd - 0.2, { y: Math.round(H * 0.106) });
    const mono = (a) => a.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: { x: mono(camX), y: mono(camY), zoom: mono(camZ), rotation: mono(camR) } });
  },
};
