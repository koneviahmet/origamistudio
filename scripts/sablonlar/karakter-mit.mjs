// Karakter · MİT Mİ GERÇEK Mİ: sunucu bir iddia ortaya atar, şüpheci arkadaşı tahmin eder, "MİT" / "GERÇEK" damgası çarpar, açıklama gelir.
// Yanlış bilinenler, sağlık / bilim / tarih efsaneleri, marka mitleri için; yorum bırakan ("sen ne dersin?") videolar.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const KIRMIZI = '#ef4444';
const YESIL = '#22b573';
const TEPKI_G = ['Vay, gerçekmiş!', 'Hiç tahmin etmezdim!', 'Şaşırdım valla!'];
const TEPKI_M = ['Demek ki mitmiş!', 'Yıllarca yanlış bilmişim!', 'Ben de inanmıştım!'];

export default {
  id: 'karakter-mit',
  ad: 'Karakter · Mit mi, gerçek mi?',
  etiket: 'Eğitim · Eğlence · Efsane avı · Karakter',
  sure: '40–70 sn',
  aciklama: 'Sunucu karakter bir iddia atar, şüpheci arkadaşı tahmin eder, geri sayımdan sonra dev "MİT" ya da "GERÇEK" damgası çarpar ve açıklama gelir. Yanlış bilinen doğrular için.',
  ornek: {
    sablon: 'karakter-mit', id: 'sablon-karakter-mit', ad: 'Mit mi, Gerçek mi?', format: 'reels', palet: 'gunbatimi', muzik: 'pop-120', font: 'Baloo 2',
    sunucu: 'kare-kedi', varyantSunucu: 'boyali', supheci: 'gozlu', varyantSupheci: 'mavi',
    hook: '*Mit* mi, gerçek mi?', selamSunucu: 'Efsane avındayız! Hazır mısın?',
    iddialar: [
      { iddia: 'Altın balıkların hafızası 3 saniyedir.', gercek: false, aciklama: 'Altın balıklar aylarca hatırlayabilir; hatta saatlere alışırlar.', tahmin: true },
      { iddia: 'Bal asla bozulmaz.', gercek: true, aciklama: 'Düşük nem ve asidi sayesinde bal binlerce yıl bozulmadan kalabilir.', tahmin: true },
      { iddia: 'Yıldırım aynı yere iki kez düşmez.', gercek: false, aciklama: 'Yüksek binalara her yıl onlarca kez yıldırım düşer.', tahmin: false },
    ],
    cta: 'Sen kaç tanesini bildin?',
    yayin: { baslik: 'Mit mi, gerçek mi? Kaç tanesini bildin? 🤔', aciklama: 'Yıllardır doğru sandığımız 3 iddia: hangisi mit, hangisi gerçek? Tahminini yoruma yaz, takip etmeyi unutma!', etiketler: ['mitmigercekmi', 'efsane', 'bilgi', 'ilginc', 'egitim', 'quiz', 'animasyon', 'shorts', 'reels', 'biliyormuydun'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'iddialar'], 'karakter-mit');
    const c = karakterKur(brief, { palet: 'gunbatimi', muzik: 'pop-120', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const I = brief.iddialar.slice(0, 4);
    const n = I.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const sun = c.karakter(brief.sunucu, 'kare-kedi', { id: 'sunucu', konum: 'sol', varyant: brief.varyantSunucu, start: 0.3, boy: 0.29 });
    const sup = c.karakter(brief.supheci, 'gozlu', { id: 'supheci', konum: 'sag', varyant: brief.varyantSupheci || 'mavi', start: 0.5, yon: -1, boy: 0.31 });

    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    c.akis(sun, { t: 0.5, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 });
    const dA = c.konus({ sun, sup }, [
      { kim: 'sun', metin: brief.selamSunucu || 'Efsane avındayız! Hazır mısın?', duygu: 'heyecanli' },
      { kim: 'sup', metin: brief.selamSupheci || 'Ben şüpheciyim, kolay kolay inanmam!', duygu: 'kuskulu', aksiyon: 'kollar-kavusuk', sure: 2.4 },
    ], 1.0);
    const introBeat = Math.round((c.snap(dA.bitis + 0.2) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || '*Mit* mi, gerçek mi?', 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'daireler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    let t = ra.t1;
    let dogruSay = 0;
    const dp = c.p * (c.p < 0.55 ? 2 : 1);

    I.forEach((q, i) => {
      const bi = i + 1;
      const g = c.grup(`g-iddia${bi}`, `${bi}. iddia`);
      const vur = c.vurgu(bi);
      const yaz = c.yazi(bi);
      const gercek = !!q.gercek;
      const tahmin = q.tahmin == null ? i % 2 === 0 : !!q.tahmin;
      const dOk = tahmin === gercek;
      if (dOk) dogruSay++;

      const dQ = c.konus({ sun, sup }, [
        { kim: 'sun', metin: q.soru || 'Sence bu doğru mu?', duygu: 'mutlu', aksiyon: 'anlat', sure: 1.8 },
        { kim: 'sup', metin: `Bence ${tahmin ? 'gerçek' : 'mit'}!`, duygu: 'dusunceli', aksiyon: 'dusun', sure: 1.7 },
      ], t + 0.9);
      const tc = c.snap(dQ.bitis + 0.1);
      const tR = R2(tc + 3 * dp);
      const dR = c.konus({ sun, sup }, [
        { kim: 'sun', metin: gercek ? 'GERÇEK!' : 'MİT!', tur: 'bagir', duygu: 'cok-mutlu', aksiyon: 'sunum', sure: 1.6, tepki: { sup: 'saskin' } },
      ], tR + 0.2);
      const tAc = c.snap(dR.bitis + 0.2);
      const tepkiler = gercek ? TEPKI_G : TEPKI_M;
      const dT = c.konus({ sun, sup }, [
        { kim: 'sup', metin: q.tepki || tepkiler[i % tepkiler.length], duygu: dOk ? 'cok-mutlu' : 'uzgun', aksiyon: dOk ? 'sevin' : 'omuz-silk', sure: 1.8, tepki: { sun: 'mutlu' } },
      ], R2(tAc));
      const tKart = c.snap(dT.bitis + 0.1);
      const tE = c.snap(tKart + Math.max(3.4, c.sure(q.aciklama || '')) + 0.4);
      const damgaRenk = gercek ? YESIL : KIRMIZI;

      c.bolum(t, `${bi}. iddia`);
      bgler.push({ t, i: bi });
      c.silme(`silme-i${bi}`, t, vur, { yon: i % 2 ? 'sag' : 'sol', sure: 0.55 });
      c.dekor(['seritler', 'halkalar', 'daireler', 'elmaslar'][i % 4], t, tE, vur, { grup: g, id: `i${bi}-dekor`, alfa: 0.14 });
      c.etiket(`i${bi}-no`, `İDDİA ${bi} / ${n}`, t + 0.25, tE, { zemin: yaz, renk: c.zemin(bi), grup: g });
      // iddia kartı (tahminden damgaya kadar)
      c.kart(`i${bi}-iddia`, q.iddia, t + 0.4, R2(tR + 0.05), { y: H * 0.2, size: 96, sar: 20, grup: g, giris: 'sol', maxW: 0.84 });

      // MİT / GERÇEK seçenekleri + geri sayım
      const ps = Math.round(m * 0.075);
      [['MİT', KIRMIZI, 0.24], ['GERÇEK', YESIL, 0.76]].forEach(([ad, rn, fx], j) => {
        const a = c.snap(tc - c.p * 3 + j * c.p);
        c.hap(`i${bi}-s${j}`, ad, Math.max(a, c.snap(dQ.bitis - 1.2)), R2(tR), W * fx, H * 0.34, { zemin: rn, renk: '#ffffff', size: ps, grup: g, font: c.font, weight: 800, nabiz: 0.04 });
      });
      c.sekil(`i${bi}-sy`, 'daire', W / 2, H * 0.34, m * 0.11, { t0: tc, t1: R2(tR), renk: '#10101c', grup: g });
      [3, 2, 1].forEach((d, j) => {
        const a = R2(tc + j * dp);
        c.slam(`i${bi}-sy${d}`, String(d), a, R2(a + dp), { y: H * 0.34, size: Math.round(m * 0.085), sabit: true, giris: 'pop', renk: '#ffffff', grup: g, weight: 800, harf: 0, font: c.font });
        c.halka(`i${bi}-syh${d}`, a, W / 2, H * 0.34, vur, { group: g, alfa: 0.5, boyut: m * 0.08, son: m * 0.35, sure: 0.5 });
        vuruslar.push(a);
      });

      // damga
      c.flas(`i${bi}-flas`, tR, { renk: gercek ? '#ffffff' : '#ffb3b3', alfa: 0.6 });
      c.damga(`i${bi}-damga`, gercek ? 'GERÇEK' : 'MİT', R2(tR), tE, W / 2, H * 0.26, m * 0.46, { grup: g, zemin: damgaRenk, renk: '#ffffff', font: c.font, rot: gercek ? -7 : 7 });
      c.L({ id: `i${bi}-konfeti`, group: g, type: 'particles', particle: gercek ? 'konfeti' : 'yildiz-yagmuru', mode: 'patlama', x: W / 2, y: Math.round(H * 0.26), start: R2(tR), end: R2(tR + 2) });
      vuruslar.push(R2(tR), tAc, tKart);
      // açıklama
      if (q.aciklama) c.kart(`i${bi}-aciklama`, q.aciklama, tKart, tE, { y: H * 0.385, size: 58, sar: 34, grup: g, giris: 'yukari', maxW: 0.86, weight: 700, zemin: '#10101c', renk: '#ffffff' });
      t = tE;
    });

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 1 });
    c.silme('silme-son', tK, c.vurgu(n + 1));
    c.kapanisKar(tK, tEnd, brief.cta || 'Sen kaç tanesini bildin?', brief.alt, [sun, sup], { i: n + 1 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.025, egim: 0 }) });
  },
};
