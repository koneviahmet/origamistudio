// Karakter · QUIZ: sunucu karakter soru sorar, 3 şık belirir, yarışmacı tahmin eder, geri sayım, doğru şık yeşile döner, tepkiler, final skoru.
// Etkileşimli izlenme (izleyen de cevabı tahmin eder) → yorum + izlenme süresi. Eğitim, genel kültür, marka quizi, dil öğrenimi için.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const HARF = ['A', 'B', 'C', 'D'];
const YESIL = '#22b573';

export default {
  id: 'karakter-quiz',
  ad: 'Karakter · Quiz (sunucu + yarışmacı)',
  etiket: 'Eğlence · Eğitim · Quiz · Karakter',
  sure: '45–75 sn',
  aciklama: 'Sunucu karakter soruyu sorar, şıklar belirir, yarışmacı tahmin eder, 3-2-1 geri sayımı ve doğru şık yeşile döner; karakterler sevinir ya da üzülür, sonda puan çıkar. İzleyiciyi cevap vermeye çağıran yarışma videosu.',
  ornek: {
    sablon: 'karakter-quiz', id: 'sablon-karakter-quiz', ad: 'Genel Kültür Quiz', format: 'reels', palet: 'canli', muzik: 'hype-132', font: 'Baloo 2',
    sunucu: 'robo', varyantSunucu: 'mor', yarismaci: 'bonbon', varyantYarismaci: 'sari',
    hook: 'Kaç *doğru* yaparsın?', selamSunucu: 'Quiz zamanı! 3 soru, 1 şans.', selamYarismaci: 'Hazırım, sor bakalım!',
    sorular: [
      { soru: 'Hangi gezegen "Kızıl Gezegen" diye bilinir?', sikler: ['Venüs', 'Mars', 'Jüpiter'], dogru: 1, bilgi: 'Mars\'ın yüzeyi demir oksitle kaplı, o yüzden kızıl.' },
      { soru: 'Bir yılda kaç mevsim vardır?', sikler: ['3', '5', '4'], dogru: 2, tahmin: 0, bilgi: 'İlkbahar, yaz, sonbahar ve kış: toplam 4.' },
      { soru: 'Balinalar hangi sınıf hayvandır?', sikler: ['Balık', 'Memeli', 'Sürüngen'], dogru: 1, bilgi: 'Balinalar süt veren, akciğerle soluyan memelilerdir.' },
    ],
    cta: 'Sen kaç yaptın? Yorumla!',
    yayin: { baslik: 'Genel kültür quiz: Kaç doğru yaparsın? 🧠', aciklama: '3 soruluk eğlenceli quiz! Cevaplarını yorumlara yaz, sonucunu paylaş. Daha fazla quiz için takip et.', etiketler: ['quiz', 'genelkultur', 'bilgiyarismasi', 'soru', 'egitim', 'eglence', 'animasyon', 'shorts', 'reels', 'challenge'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'sorular'], 'karakter-quiz');
    const c = karakterKur(brief, { palet: 'canli', muzik: 'hype-132', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const S = brief.sorular.slice(0, 4);
    const n = S.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const sun = c.karakter(brief.sunucu, 'robo', { id: 'sunucu', konum: 'sol', varyant: brief.varyantSunucu, start: 0.3, boy: 0.29 });
    const yar = c.karakter(brief.yarismaci, 'bonbon', { id: 'yarismaci', konum: 'sag', varyant: brief.varyantYarismaci || 'sari', start: 0.5, yon: -1, boy: 0.29 });

    // yuvarlak uçlu şerit (pill)
    const pill = (id, cx, cy, w, h, renk, t0, t1, g, o = {}) => {
      const r = h / 2;
      const p = { t0, t1, renk, giris: 'yok', grup: g, ...(o.opacity != null ? { opacity: o.opacity } : {}) };
      c.sekil(`${id}-m`, 'kare', cx, cy, 200, { ...p, sx: (w - h) / 200, sy: h / 200 });
      c.sekil(`${id}-l`, 'daire', cx - (w - h) / 2, cy, h, p);
      c.sekil(`${id}-r`, 'daire', cx + (w - h) / 2, cy, h, p);
    };

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    c.akis(sun, { t: 0.5, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 });
    const dA = c.konus({ sun, yar }, [
      { kim: 'sun', metin: brief.selamSunucu || 'Quiz zamanı! Hazır mısın?', duygu: 'heyecanli' },
      { kim: 'yar', metin: brief.selamYarismaci || 'Hazırım, sor bakalım!', duygu: 'mutlu', aksiyon: 'zipla-yerinde', sure: 1.8 },
    ], 1.0);
    const introBeat = Math.round((c.snap(dA.bitis + 0.2) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || 'Kaç *doğru* yaparsın?', 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'daireler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    let t = ra.t1;
    let puan = 0;
    const dp = c.p * (c.p < 0.55 ? 2 : 1); // geri sayım adımı

    // ── sorular ──────────────────────────────────────────────────────────
    S.forEach((q, i) => {
      const bi = i + 1;
      const g = c.grup(`g-soru${bi}`, `${bi}. soru`);
      const vur = c.vurgu(bi);
      const yaz = c.yazi(bi);
      const sik = q.sikler.slice(0, 3);
      const dogru = Math.min(q.dogru ?? 0, sik.length - 1);
      const tahmin = Math.min(q.tahmin ?? dogru, sik.length - 1);
      const dOk = tahmin === dogru;

      const dq = c.konus({ sun, yar }, [{ kim: 'sun', metin: q.soru, duygu: 'mutlu', aksiyon: 'anlat', sure: Math.min(c.sure(q.soru), 4.2) }], t + 0.6);
      const tO = c.snap(dq.bitis + 0.1);
      const dT = c.konus({ sun, yar }, [{ kim: 'yar', metin: `Bence ${HARF[tahmin]}!`, duygu: 'dusunceli', aksiyon: 'dusun', sure: 1.7 }], tO + 0.5);
      const tc = c.snap(dT.bitis + 0.2);
      const tR = R2(tc + 3 * dp);
      const tReact = tR + 1.5;
      const dS = c.konus({ sun, yar }, [
        { kim: 'sun', metin: dOk ? 'Doğru bildin!' : `Olmadı! Doğrusu ${HARF[dogru]}.`, duygu: dOk ? 'cok-mutlu' : 'mutlu', aksiyon: dOk ? 'alkis' : 'anlat', sure: 1.8, tepki: { yar: dOk ? 'cok-mutlu' : 'uzgun' } },
        ...(q.bilgi ? [{ kim: 'sun', metin: q.bilgi, duygu: 'mutlu', aksiyon: 'anlat', sure: Math.min(c.sure(q.bilgi), 4.4) }] : []),
      ], tReact);
      const tE = c.snap(dS.bitis + 0.5);
      if (dOk) puan++;
      c.akis(yar, { t: R2(tR + 0.05), aksiyon: dOk ? 'sevin' : 'uzgun-ol', duygu: dOk ? 'cok-mutlu' : 'aglayan', sure: 1.4, ...(dOk ? { efekt: 'yildiz' } : {}) });
      c.akis(sun, { t: R2(tR + 0.05), aksiyon: dOk ? 'alkis' : 'bekle', duygu: dOk ? 'cok-mutlu' : 'mutlu', sure: 1.4 });

      c.bolum(t, `${bi}. soru`);
      bgler.push({ t, i: bi });
      c.silme(`silme-s${bi}`, t, vur, { yon: i % 2 ? 'sag' : 'sol', sure: 0.55 });
      c.dekor(['halkalar', 'seritler', 'elmaslar', 'daireler'][i % 4], t, tE, vur, { grup: g, id: `s${bi}-dekor`, alfa: 0.14 });
      c.etiket(`s${bi}-no`, `SORU ${bi} / ${n}`, t + 0.25, tE, { zemin: yaz, renk: c.zemin(bi), grup: g });
      c.hap(`s${bi}-puan`, `PUAN ${puan - (dOk ? 1 : 0)}`, t + 0.3, R2(tR), W * 0.14, H * 0.115, { zemin: '#10101c', renk: '#ffffff', size: Math.round(m * 0.036), grup: g, font: c.govde, upper: true });
      c.hap(`s${bi}-puan2`, `PUAN ${puan}`, R2(tR), tE, W * 0.14, H * 0.115, { zemin: dOk ? YESIL : '#10101c', renk: '#ffffff', size: Math.round(m * 0.036), grup: g, font: c.govde, upper: true, giris: 'pop' });
      c.kart(`s${bi}-soru`, q.soru, t + 0.4, tE, { y: H * 0.19, size: 84, sar: 24, grup: g, giris: 'sol', maxW: 0.84 });

      // şıklar
      const pw = Math.round(W * 0.8);
      const ph = Math.round(m * 0.085);
      sik.forEach((s, j) => {
        const y = H * (0.278 + j * 0.062);
        const t0 = c.snap(tO + j * c.p);
        const left = W / 2 - pw / 2;
        const sz = sigdirFont(s, c.font, pw - ph * 2.1, Math.round(ph * 0.56), false);
        const ok = j === dogru;
        // önce
        pill(`s${bi}-p${j}`, W / 2, y, pw, ph, '#ffffff', t0, R2(tR), g, {});
        c.sekil(`s${bi}-r${j}`, 'daire', left + ph / 2, y, ph * 0.78, { t0, t1: R2(tR), renk: vur, grup: g, giris: 'pop' });
        c.slam(`s${bi}-h${j}`, HARF[j], t0 + 0.04, R2(tR), { x: left + ph / 2, y, size: Math.round(ph * 0.5), sabit: true, giris: 'pop', renk: yaziRengi(vur), golge: false, grup: g, weight: 800, harf: 0, font: c.font });
        c.slam(`s${bi}-t${j}`, s, t0 + 0.06, R2(tR), { x: left + ph * 1.05, y, size: sz, sabit: true, align: 'left', giris: 'pop', upper: false, renk: '#1b1b2b', golge: false, grup: g, weight: 800, harf: 0, font: c.font });
        vuruslar.push(t0);
        // sonra
        const bitisT = tE;
        pill(`s${bi}-q${j}`, W / 2, y, pw, ph, ok ? YESIL : '#ffffff', R2(tR), bitisT, g, { opacity: ok ? 1 : 0.28 });
        c.sekil(`s${bi}-w${j}`, 'daire', left + ph / 2, y, ph * 0.78, { t0: tR, t1: bitisT, renk: ok ? '#ffffff' : vur, grup: g, giris: 'yok', opacity: ok ? 1 : 0.35 });
        c.slam(`s${bi}-g${j}`, HARF[j], tR, bitisT, { x: left + ph / 2, y, size: Math.round(ph * 0.5), sabit: true, giris: 'yok', renk: ok ? YESIL : yaziRengi(vur), golge: false, grup: g, weight: 800, harf: 0, font: c.font, extra: { opacity: ok ? 1 : 0.4 } });
        c.slam(`s${bi}-u${j}`, s, tR, bitisT, { x: left + ph * 1.05, y, size: sz, sabit: true, align: 'left', giris: 'yok', upper: false, renk: ok ? '#ffffff' : '#1b1b2b', golge: false, grup: g, weight: 800, harf: 0, font: c.font, extra: { opacity: ok ? 1 : 0.4 } });
        if (ok) {
          c.sekil(`s${bi}-tik`, 'tik', left + pw - ph * 0.7, y, ph * 0.62, { t0: R2(tR + 0.1), t1: bitisT, renk: '#ffffff', grup: g });
          c.halka(`s${bi}-halka`, tR, W / 2, y, YESIL, { group: g, alfa: 0.6, boyut: ph, son: m * 0.9, sure: 0.6 });
        }
      });

      // geri sayım 3-2-1
      c.sekil(`s${bi}-sy`, 'daire', W * 0.86, H * 0.115, m * 0.1, { t0: tc, t1: R2(tR), renk: '#10101c', grup: g });
      [3, 2, 1].forEach((d, j) => {
        const a = R2(tc + j * dp);
        c.slam(`s${bi}-sy${d}`, String(d), a, R2(a + dp), { x: W * 0.86, y: H * 0.115, size: Math.round(m * 0.075), sabit: true, giris: 'pop', renk: '#ffffff', golge: false, grup: g, weight: 800, harf: 0, font: c.font });
        c.halka(`s${bi}-syh${d}`, a, W * 0.86, H * 0.115, vur, { group: g, alfa: 0.55, boyut: m * 0.07, son: m * 0.3, sure: 0.5 });
        vuruslar.push(a);
      });
      c.flas(`s${bi}-flas`, tR, { renk: dOk ? '#ffffff' : '#ff8a8a', alfa: 0.5 });
      vuruslar.push(R2(tR));
      t = tE;
    });

    // ── final: puan ──────────────────────────────────────────────────────
    const tF = t;
    const gF = c.grup('g-skor', 'Skor', true);
    c.bolum(tF, 'Skor');
    const oran = puan / n;
    const mesaj = oran >= 1 ? 'Kusursuz! 🏆' : oran >= 0.6 ? 'Harika iş!' : 'Bir dahaki sefere!';
    const tFe = c.vurus(Math.round((tF - c.off) / c.p) + 8);
    bgler.push({ t: tF, i: n + 1 });
    c.silme('silme-skor', tF, c.vurgu(n + 1));
    c.dekor('patlama', tF, tFe, c.vurgu(n + 1), { grup: gF, id: 'skor-dekor', alfa: 0.22 });
    c.hap('skor-etiket', 'SENİN SKORUN', tF + 0.3, tFe, W / 2, H * 0.115, { zemin: c.yazi(n + 1), renk: c.zemin(n + 1), grup: gF, size: Math.round(m * 0.04) });
    c.sayac('skor-sayi', 0, puan, tF + 0.15, 1.0, { y: H * 0.23, size: 420, renk: c.yazi(n + 1), grup: gF, t1: tFe, suffix: ` / ${n}`, maxW: W * 0.8, font: c.font });
    c.hap('skor-mesaj', mesaj.replace(' 🏆', ''), c.snap(tF + 1.2), tFe, W / 2, H * 0.33, { zemin: c.vurgu(n + 1), renk: yaziRengi(c.vurgu(n + 1)), grup: gF, size: Math.round(m * 0.05), upper: false });
    c.akis(sun, { t: tF + 0.2, aksiyon: oran >= 0.6 ? 'sunum' : 'omuz-silk', duygu: oran >= 0.6 ? 'cok-mutlu' : 'mutlu' });
    c.akis(yar, { t: tF + 0.2, aksiyon: oran >= 0.6 ? 'sevin' : 'omuz-silk', duygu: oran >= 0.6 ? 'cok-mutlu' : 'uzgun' });
    vuruslar.push(tF, c.snap(tF + 1.0));
    t = tFe;

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 2 });
    c.silme('silme-son', tK, c.vurgu(n + 2));
    c.kapanisKar(tK, tEnd, brief.cta || 'Sen kaç yaptın? Yorumla!', brief.alt, [sun, yar], { i: n + 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
