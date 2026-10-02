// Karakter · SORUN → İPUÇLARI → SONUÇ: tek koç karakter. Önce sorunu yaşar (bıkkın / yorgun), her ipucunda eline bir nesne alır (ampul, kitap, kahve…),
// ipucunu söyler; sonda zafer pozu ve tik listesi. Verimlilik, sağlık, uyku, para, öğrenme, kariyer — "N ipucu" videoları için.
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const NESNELER = ['ampul', 'kitap', 'kahve', 'telefon', 'kalem', 'laptop'];
const HAREKET = ['fikir', 'goster', 'goster', 'anlat'];

export default {
  id: 'karakter-ipucu',
  ad: 'Karakter · Sorun → İpuçları → Sonuç (koç)',
  etiket: 'Eğitim · Yaşam · İpucu · Karakter',
  sure: '40–70 sn',
  aciklama: 'Tek koç karakter sorunu yaşar, her ipucunda eline bir nesne alıp ipucunu anlatır, sonunda zafer pozu ve tik listesiyle biter. Verimlilik, sağlık, para, öğrenme "N ipucu" videoları.',
  ornek: {
    sablon: 'karakter-ipucu', id: 'sablon-karakter-ipucu', ad: 'Derse Odaklanmak', format: 'reels', palet: 'orman', muzik: 'lofi-90', font: 'Baloo 2',
    karakter: 'miyav', varyant: 'beyaz',
    hook: 'Odaklanamıyor *musun?*', sorun: 'Telefona bakıyorum, kitabı unutuyorum… Yine odaklanamadım.',
    ipuclari: [
      { baslik: 'Telefonu uzağa koy', metin: 'Bildirimleri kapat, telefonu başka odaya bırak.', nesne: 'telefon' },
      { baslik: '25 dakika çalış', metin: 'Sonra 5 dakika mola ver: Pomodoro tekniği.', nesne: 'kahve' },
      { baslik: 'Küçük hedef koy', metin: 'Büyük işi parçala, her parçayı tek tek bitir.', nesne: 'kalem' },
    ],
    sonuc: 'Odak artık sende!', cta: 'Kaydet, sonra dene',
    yayin: { baslik: 'Derse odaklanmanın 3 kolay yolu 📚', aciklama: 'Telefonu uzağa koy, 25 dakika çalış, küçük hedefler belirle. Kaydet ve sınav dönemi için sakla!', etiketler: ['odaklanma', 'verimlilik', 'ders', 'calisma', 'pomodoro', 'ipucu', 'egitim', 'animasyon', 'shorts', 'reels'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'ipuclari'], 'karakter-ipucu');
    const c = karakterKur(brief, { palet: 'orman', muzik: 'lofi-90', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const P = brief.ipuclari.slice(0, 4);
    const n = P.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const koc = c.karakter(brief.karakter, 'miyav', { id: 'koc', konum: 'orta', varyant: brief.varyant, start: 0.3, boy: 0.32 });

    // ── sorun ────────────────────────────────────────────────────────────
    const gA = c.grup('g-sorun', 'Sorun', true);
    c.bolum(0, 'Sorun');
    const sorun = brief.sorun || 'Yine olmadı… Bir çözüm lazım.';
    c.akis(koc, { t: 0.5, aksiyon: 'sikilgan', duygu: 'yorgun' });
    const dS = c.konus({ koc }, [{ kim: 'koc', metin: sorun, duygu: 'uzgun', aksiyon: 'sikilgan', sure: Math.min(c.sure(sorun), 4.4) }], 1.0, { bak: false });
    const introBeat = Math.round((c.snap(dS.bitis + 0.4) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || 'Sorun mu *var?*', 0, { i: 0, grup: gA, y: 0.2, yuk: 0.17, dekor: 'daireler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    c.akis(koc, { t: R2(dS.bitis - 0.3), aksiyon: 'dusun', duygu: 'dusunceli', efekt: 'soru' });
    let t = ra.t1;

    // ── ipuçları ─────────────────────────────────────────────────────────
    P.forEach((p, i) => {
      const bi = i + 1;
      const g = c.grup(`g-ipucu${bi}`, `${bi}. ${p.baslik}`);
      const vur = c.vurgu(bi);
      const yaz = c.yazi(bi);
      const nesne = p.nesne || NESNELER[i % NESNELER.length];
      const dur = Math.min(Math.max(c.sure(p.metin || p.baslik), 3.0), 4.6);
      const t0 = t;
      const tE = c.snap(t0 + 0.9 + dur + 1.7);
      c.bolum(t, `${bi}. ${p.baslik}`);
      bgler.push({ t, i: bi });
      c.silme(`silme-p${bi}`, t, vur, { yon: i % 2 ? 'sag' : 'sol', sure: 0.55 });
      c.dekor(['halkalar', 'seritler', 'elmaslar', 'daireler'][i % 4], t, tE, vur, { grup: g, id: `p${bi}-dekor`, alfa: 0.15 });
      c.etiket(`p${bi}-no`, `İPUCU ${bi} / ${n}`, t + 0.25, tE, { zemin: yaz, renk: c.zemin(bi), grup: g });
      // büyük numara + başlık
      const rz = m * 0.2;
      c.sekil(`p${bi}-rozet`, 'daire', W * 0.17, H * 0.215, rz, { t0: t0 + 0.3, t1: tE, renk: vur, grup: g });
      c.halka(`p${bi}-halka`, t0 + 0.3, W * 0.17, H * 0.215, vur, { group: g, alfa: 0.55, boyut: rz * 0.6, son: m * 0.6, sure: 0.6 });
      c.slam(`p${bi}-num`, String(bi), t0 + 0.36, tE, { x: W * 0.17, y: H * 0.215, size: rz * 0.8, sabit: true, giris: 'pop', renk: yaziRengi(vur), golge: false, grup: g, harf: 0, font: c.font, weight: 800 });
      const bs = sarMetin(p.baslik, 16);
      c.slam(`p${bi}-baslik`, bs, c.snap(t0 + 0.4), tE, { x: W * 0.6, y: H * 0.215, size: 110, maxW: W * 0.58, sabit: false, giris: i % 2 ? 'sag' : 'sol', renk: yaz, weight: 800, upper: false, grup: g, harf: 0, lh: 1.02, nabiz: 0.02, font: c.font });
      // karakter: nesne alır, söyler
      c.akis(koc, { t: R2(t0 + 0.3), aksiyon: HAREKET[i % HAREKET.length], duygu: 'mutlu', tutar: { nesne, el: 'R' }, sure: dur + 0.9, ...(i % 4 === 0 ? { efekt: 'ampul' } : {}) });
      const d = c.konus({ koc }, [{ kim: 'koc', metin: p.metin || p.baslik, duygu: 'cok-mutlu', aksiyon: HAREKET[i % HAREKET.length], tutar: { nesne, el: 'R' }, sure: dur }], t0 + 0.9, { bak: false });
      vuruslar.push(t0, c.snap(t0 + 0.4), c.snap(t0 + 0.9));
      t = tE;
    });

    // ── sonuç ────────────────────────────────────────────────────────────
    const tS = t;
    const tSe = c.vurus(Math.round((tS - c.off) / c.p) + 6 + n * 2);
    const gS = c.grup('g-sonuc', 'Sonuç', true);
    c.bolum(tS, 'Sonuç');
    bgler.push({ t: tS, i: n + 1 });
    c.silme('silme-sonuc', tS, c.vurgu(n + 1));
    c.dekor('patlama', tS, tSe, c.vurgu(n + 1), { grup: gS, id: 'sonuc-dekor', alfa: 0.2 });
    c.slam('sonuc', brief.sonuc || 'Sorun çözüldü!', tS + 0.1, tSe, { y: H * 0.195, size: 170, maxW: W * 0.86, sar: 16, renk: c.yazi(n + 1), grup: gS, nabiz: 0.03, lh: 0.95, weight: 800 });
    const ad = Math.min(H * 0.058, (H * 0.2) / n);
    P.forEach((p, i) => {
      const a = c.snap(tS + 0.9 + i * c.p * 1.5);
      const y = H * 0.325 + i * ad;
      c.sekil(`sonuc-tik${i + 1}`, 'tik', W * 0.2, y, m * 0.055, { t0: a, t1: tSe, renk: c.vurgu(n + 1), grup: gS });
      c.slam(`sonuc-m${i + 1}`, p.baslik, a + 0.04, tSe, { x: W * 0.28, y, size: Math.round(m * 0.056), sabit: true, align: 'left', giris: 'sag', upper: false, renk: c.yazi(n + 1), font: c.font, weight: 800, golge: false, grup: gS, harf: 0 });
      vuruslar.push(a);
    });
    c.akis(koc, { t: R2(tS + 0.2), aksiyon: 'zafer', duygu: 'cok-mutlu', efekt: 'yildiz', tutar: null });
    vuruslar.push(tS);
    t = tSe;

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 2 });
    c.silme('silme-son', tK, c.vurgu(n + 2));
    c.kapanisKar(tK, tEnd, brief.cta || 'Kaydet, sonra dene', brief.alt, [koc], { i: n + 2 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
