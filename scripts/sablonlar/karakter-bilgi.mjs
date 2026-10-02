// Karakter · BİLGİ SOHBETİ: öğretmen ile meraklı öğrenci. Öğrenci sorar, öğretmen cevaplar; cevabın anahtar rakamı / kelimesi üstte çarpar.
// "Biliyor muydun?" tarzı eğitici kısa videolar için (bilim, tarih, sağlık, finans, dil… konu fark etmez).
import { gerekli } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';

const TEPKI = ['Vay canına!', 'Çok ilginç!', 'Bunu bilmiyordum!', 'İnanamıyorum!', 'Şaşırtıcı!'];

export default {
  id: 'karakter-bilgi',
  ad: 'Karakter · Biliyor muydun? (öğretmen + öğrenci)',
  etiket: 'Eğitim · Bilgi · Diyalog · Karakter',
  sure: '35–60 sn',
  aciklama: 'Öğretmen karakter ile meraklı öğrenci sohbet eder: öğrenci sorar, öğretmen cevaplar, cevabın büyük rakamı / kelimesi üstte çarpar. Her konuya uyan "biliyor muydun?" bilgi serisi.',
  ornek: {
    sablon: 'karakter-bilgi', id: 'sablon-karakter-bilgi', ad: 'Uzay Hakkında 3 Bilgi', format: 'reels', palet: 'pastel', muzik: 'pop-120', font: 'Baloo 2',
    karakterA: 'copadam', varyantA: 'ogretmen', karakterB: 'bonbon', varyantB: 'pembe',
    hook: 'Biliyor *muydun?*', selamA: 'Merhaba! Bugün uzaydan 3 şaşırtıcı bilgi var.', selamB: 'Hazırım, başlayalım!',
    bilgiler: [
      { soru: 'Güneş ne kadar büyük?', buyuk: '1,3 milyon', etiket: 'Dünya sığar', cevap: 'İçine yaklaşık 1,3 milyon Dünya sığar!' },
      { soru: 'Işık Güneş\'ten bize kaç dakikada gelir?', buyuk: '8 dakika', etiket: 'ışığın yolculuğu', cevap: 'Güneş ışığı bize yaklaşık 8 dakikada ulaşır.' },
      { soru: 'Uzayda ses duyulur mu?', buyuk: 'HAYIR', etiket: 'boşlukta ses yok', cevap: 'Uzay boşluk olduğu için ses taşınamaz, tam sessizdir.' },
    ],
    cta: 'Daha fazlası için takip et',
    yayin: { baslik: 'Uzay hakkında 3 şaşırtıcı bilgi 🚀', aciklama: 'Öğretmen ve meraklı öğrenci uzaydan 3 ilginç bilgi anlatıyor. Hangisini bilmiyordun? Yorumlara yaz, takip etmeyi unutma!', etiketler: ['biliyormuydun', 'uzay', 'bilgi', 'egitim', 'bilim', 'ogren', 'animasyon', 'shorts', 'reels', 'ilginc'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'bilgiler'], 'karakter-bilgi');
    const c = karakterKur(brief, { palet: 'pastel', muzik: 'pop-120', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const bil = brief.bilgiler.slice(0, 4);
    const n = bil.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const ogr = c.karakter(brief.karakterA, 'copadam', { id: 'ogretmen', konum: 'sol', varyant: brief.varyantA || 'ogretmen', ekler: ['gozluk'], start: 0.3, boy: 0.35 });
    const ogc = c.karakter(brief.karakterB, 'bonbon', { id: 'ogrenci', konum: 'sag', varyant: brief.varyantB || 'pembe', start: 0.55, yon: -1, boy: 0.33 });

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    c.akis(ogr, { t: 0.5, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.2 });
    const dA = c.konus({ ogr, ogc }, [
      { kim: 'ogr', metin: brief.selamA || 'Merhaba! Bugün birlikte yeni bir şey öğreneceğiz.', duygu: 'mutlu' },
      { kim: 'ogc', metin: brief.selamB || 'Hazırım, başlayalım!', duygu: 'heyecanli', aksiyon: 'zipla-yerinde', sure: 1.8 },
    ], 1.0);
    const introBeat = Math.round((c.snap(dA.bitis + 0.2) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || 'Biliyor *muydun?*', 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'daireler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    let t = ra.t1;

    // ── bilgiler ─────────────────────────────────────────────────────────
    bil.forEach((b, i) => {
      const bi = i + 1;
      const g = c.grup(`g-bilgi${bi}`, `${bi}. ${b.soru}`);
      const yaz = c.yazi(bi);
      const vur = c.vurgu(bi);
      const tepki = b.tepki || TEPKI[i % TEPKI.length];
      const d = c.konus({ ogr, ogc }, [
        { kim: 'ogc', metin: b.soru, duygu: 'dusunceli', efekt: 'soru', aksiyon: 'el-kaldir', sure: c.sure(b.soru), tepki: { ogr: 'mutlu' } },
        { kim: 'ogr', metin: b.cevap, duygu: 'mutlu', aksiyon: 'anlat', efekt: 'ampul', tepki: { ogc: 'saskin' } },
        { kim: 'ogc', metin: tepki, duygu: 'heyecanli', aksiyon: 'sevin', sure: 1.8, tepki: { ogr: 'gururlu' } },
      ], t + 0.7);
      const tA = c.snap(d.zamanlar[1].t);
      const tE = c.snap(d.bitis + 0.4);
      c.bolum(t, `${bi}. ${b.soru}`);
      bgler.push({ t, i: bi });
      c.silme(`silme-b${bi}`, t, vur, { yon: i % 2 ? 'sag' : 'sol', sure: 0.55 });
      c.dekor(['halkalar', 'seritler', 'elmaslar', 'daireler'][i % 4], t, tE, vur, { grup: g, id: `b${bi}-dekor`, alfa: 0.16 });
      c.etiket(`b${bi}-no`, `BİLGİ ${bi} / ${n}`, t + 0.25, tE, { zemin: vur, grup: g, y: H * 0.115 });
      // soru kartı
      c.kart(`b${bi}-soru`, b.soru, t + 0.35, b.buyuk ? tA : tE, { y: H * 0.21, size: 100, sar: 22, grup: g, giris: 'sol' });
      // büyük cevap
      if (b.buyuk) {
        const sz = sigdirFont(b.buyuk, c.font, W * 0.86, 260, true);
        c.halka(`b${bi}-halka`, tA, W / 2, H * 0.22, vur, { group: g, alfa: 0.5, boyut: m * 0.2, son: m * 1.3, sure: 0.6 });
        c.slam(`b${bi}-buyuk`, b.buyuk, tA, tE, { y: H * 0.22, size: sz, sabit: true, renk: yaz, weight: 800, grup: g, nabiz: 0.03, harf: 0 });
        if (b.etiket) c.hap(`b${bi}-etiket`, b.etiket, c.snap(tA + 0.35), tE, W / 2, H * 0.295, { zemin: vur, renk: yaziRengi(vur), grup: g, size: Math.round(m * 0.042), upper: false });
      }
      vuruslar.push(t, tA, c.snap(d.zamanlar[2].t));
      t = tE;
    });

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 1 });
    c.silme('silme-son', tK, c.vurgu(n + 1));
    c.kapanisKar(tK, tEnd, brief.cta || 'Daha fazlası için takip et', brief.alt, [ogr, ogc], { i: n + 1 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
