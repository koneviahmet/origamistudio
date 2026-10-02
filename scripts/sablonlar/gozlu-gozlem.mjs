// Gözlü · DİKKAT TESTİ (farklı olanı bul): ızgarada tek farklı nesne saklıdır; Gözlü büyüteçle ızgarayı tarar (gözleri dolaşır), süre çubuğu azalır,
// süre bitince farklı olan büyür, diğerleri solar, Gözlü işaret eder. 3 tur, zorluk artar. İzleyiciyi videoya ortak eden, yorum toplayan oyun.
import { gerekli, varlikBoyut } from './lib.mjs';
import { karakterKur, R2, sarMetin, sigdirFont, yaziRengi } from './karakter-ortak.mjs';
import { karistir } from './reels.mjs';

const SEKILLER = ['daire', 'kalp', 'yildiz', 'elmas', 'ucgen', 'kare'];
const RENKLER = ['#ff5d8f', '#ffd60a', '#4dd0e1', '#a78bfa'];

export default {
  id: 'gozlu-gozlem',
  ad: 'Gözlü · Dikkat testi (farklı olanı bul)',
  etiket: 'Oyun · Etkileşim · Gözlü',
  sure: '35–60 sn',
  aciklama: 'Gözlü büyüteçle ızgarayı tarar, süre çubuğu azalır, farklı olan nesne süre bitince büyüyüp parlar. 3 tur, gittikçe zorlaşır. İzleyiciyi oyuna katan, yorum ve tekrar izletme getiren video.',
  ornek: {
    sablon: 'gozlu-gozlem', id: 'sablon-gozlu-gozlem', ad: 'Dikkat Testi', format: 'reels', palet: 'neon', muzik: 'house-126', font: 'Baloo 2',
    hook: 'Gözlerin *keskin* mi?', selam: 'Dikkat testi! Farklı olanı bul.', varyant: 'mavi', ekler: ['gozluk'],
    turlar: [
      { sekil: 'daire', renk: '#ff5d8f', fark: { sekil: 'kare' }, satir: 3, sutun: 3, sure: 4, ipucu: 'Kolay: şekli farklı olan!' },
      { sekil: 'kalp', renk: '#ffd60a', fark: { renk: '#ffb703' }, satir: 3, sutun: 4, sure: 5, ipucu: 'Orta: rengi biraz farklı.' },
      { sekil: 'yildiz', renk: '#4dd0e1', fark: { renk: '#5ee0ee', rot: 36 }, satir: 4, sutun: 5, sure: 6, ipucu: 'Zor: çok dikkatli bak!' },
    ],
    cta: 'Kaç saniyede buldun? Yorumla!',
    yayin: { baslik: 'Dikkat testi: farklı olanı bulabilir misin? 👀', aciklama: '3 turluk göz testi! Hangi turda yakalandın? Yorumlara yaz, arkadaşına meydan oku. Takip etmeyi unutma!', etiketler: ['dikkattesti', 'farklıolanıbul', 'gozdesti', 'oyun', 'challenge', 'eglence', 'animasyon', 'shorts', 'reels', 'bulmaca'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'turlar'], 'gozlu-gozlem');
    const c = karakterKur(brief, { palet: 'neon', muzik: 'house-126', font: 'Baloo 2' });
    const { W, H, k, m } = c;
    const T = brief.turlar.slice(0, 3);
    const n = T.length;
    const vuruslar = [];
    const bgler = [{ t: 0, i: 0 }];

    const goz = c.karakter('gozlu', 'gozlu', { id: 'gozlu', konum: 'orta', varyant: brief.varyant || 'mavi', ekler: brief.ekler || ['gozluk'], start: 0.3, boy: 0.31 });

    // ── açılış ───────────────────────────────────────────────────────────
    const gA = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    c.akis(goz, { t: 0.5, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.0, tutar: { nesne: 'buyutec', el: 'L' } });
    const dA = c.konus({ goz }, [{ kim: 'goz', metin: brief.selam || 'Dikkat testi! Farklı olanı bul.', duygu: 'heyecanli', sure: 2.4 }], 1.0, { bak: false });
    const introBeat = Math.round((c.snap(dA.bitis + 0.3) - c.off) / c.p);
    const ra = c.yigin('hook', brief.hook || 'Gözlerin *keskin* mi?', 0, { i: 0, grup: gA, y: 0.24, yuk: 0.19, dekor: 'daireler', sure: Math.max(introBeat, 4) });
    vuruslar.push(...ra.vuruslar);
    c.etiket('konu', brief.ad, c.snap(1.4), ra.t1, { grup: gA, i: 0 });
    let t = ra.t1;

    // ── turlar ───────────────────────────────────────────────────────────
    T.forEach((tur, i) => {
      const bi = i + 1;
      const g = c.grup(`g-tur${bi}`, `${bi}. tur`);
      const vur = c.vurgu(bi);
      const yaz = c.yazi(bi);
      const cols = tur.sutun || [3, 4, 5][i];
      const rows = tur.satir || [3, 3, 4][i];
      const cell = Math.min((W * 0.88) / cols, (H * 0.3) / rows);
      const gy = H * 0.285;
      const pos = (r, q) => [W / 2 - (cols * cell) / 2 + cell * (q + 0.5), gy - (rows * cell) / 2 + cell * (r + 0.5)];
      const hedef = tur.hedef || [(i * 7 + 3) % rows, (i * 5 + 2) % cols];
      const [tx, ty] = pos(hedef[0], hedef[1]);
      const sekil = tur.sekil || SEKILLER[i % SEKILLER.length];
      const renk = tur.renk || RENKLER[i % RENKLER.length];
      const fark = tur.fark || (i === 0 ? { sekil: 'kare' } : { renk: karistir(renk, '#ffffff', 0.4) });
      const boyut = cell * 0.68;
      const sure = tur.sure || 4 + i;
      const tG = t;
      const tBas = c.snap(tG + 1.0 + cols * rows * 0.03);
      const tR = c.snap(tBas + sure);
      const tE = c.snap(tR + 3.0);

      c.bolum(t, `${bi}. tur`);
      bgler.push({ t, i: bi });
      c.silme(`silme-t${bi}`, t, vur, { yon: i % 2 ? 'sag' : 'sol', sure: 0.55 });
      c.dekor(['halkalar', 'seritler', 'elmaslar'][i % 3], t, tE, vur, { grup: g, id: `t${bi}-dekor`, alfa: 0.13 });
      c.etiket(`t${bi}-no`, `TUR ${bi} / ${n}`, t + 0.25, tE, { zemin: yaz, renk: c.zemin(bi), grup: g });

      // ızgara (dalga gibi belirir)
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const [x, y] = pos(r, q);
          const hedefMi = r === hedef[0] && q === hedef[1];
          const o = hedefMi ? fark : {};
          const t0 = R2(tG + 0.55 + (r * cols + q) * 0.03);
          c.sekil(`t${bi}-s${r}-${q}`, o.sekil || sekil, x, y, boyut, {
            t0, t1: R2(tE), renk: o.renk || renk, grup: g, sure: 0.22, rot: o.rot,
            ...(hedefMi ? { anims: [{ preset: 'nabiz', t: R2(tR), genlik: 0.14, periyot: c.p * 2 }] } : { extra: { opacity: [k(t0, 1), k(tR, 1, 'linear'), k(R2(tR + 0.35), 0.18, 'outQuad')] } }),
          });
        }
      }
      // süre çubuğu (azalır)
      const bw = Math.round(W * 0.76);
      const bx = Math.round((W - bw) / 2);
      const by = Math.round(H * 0.46);
      c.sekil(`t${bi}-iz`, 'kare', bx + bw / 2, by, 200, { sx: bw / 200, sy: 0.07, renk: yaz, opacity: 0.22, giris: 'yok', t0: R2(tBas), t1: R2(tR + 0.4), grup: g });
      c.L({ id: `t${bi}-sure`, group: g, asset: 'kare', x: bx, y: by, scale: 1, scaleX: [k(tBas, bw / 200), k(tR, 0.001, 'linear')], scaleY: 0.07, anchor: [0, 0.5], palette: { a: vur }, start: R2(tBas), end: R2(tR + 0.4) });

      // Gözlü: tarar, sonra bulur
      const tarama = [];
      const adim = 0.45;
      for (let a = tBas, j = 0; a < tR - 0.4; a += adim, j++) {
        const rr = (j * 2 + i) % rows;
        const qq = (j * 3 + 1) % cols;
        const [px, py] = pos(rr, qq);
        tarama.push({ t: R2(a), aksiyon: 'bekle', duygu: 'kuskulu', bak: [Math.round(px), Math.round(py)] });
      }
      tarama.forEach((s) => c.akis(goz, s));
      const dI = c.konus({ goz }, [{ kim: 'goz', metin: tur.ipucu || 'Farklı olanı bul!', duygu: 'dusunceli', sure: Math.min(c.sure(tur.ipucu || 'Farklı olanı bul!'), 2.6) }], R2(tG + 0.8), { bak: false });
      const dB = c.konus({ goz }, [{ kim: 'goz', metin: 'Buldum!', tur: 'bagir', duygu: 'cok-mutlu', aksiyon: 'isaret', hedef: [Math.round(tx), Math.round(ty)], bak: [Math.round(tx), Math.round(ty)], efekt: 'yildiz', sure: 1.8 }], R2(tR + 0.1), { bak: false });
      c.akis(goz, { t: R2(tR + 1.9), aksiyon: 'sevin', duygu: 'cok-mutlu', bak: 'ileri' });

      // geri sayım sesleri / vurgu
      c.flas(`t${bi}-flas`, tR, { renk: '#ffffff', alfa: 0.5 });
      c.halka(`t${bi}-halka`, tR, tx, ty, vur, { group: g, alfa: 0.8, boyut: boyut * 0.8, son: boyut * 3, sure: 0.7 });
      c.sekil(`t${bi}-cember`, 'halka', tx, ty, boyut * 1.5, { t0: R2(tR + 0.1), t1: R2(tE), renk: yaz, grup: g, sure: 0.3, anims: [{ preset: 'nabiz', t: R2(tR + 0.5), genlik: 0.06, periyot: c.p * 2 }] });
      c.hap(`t${bi}-satir`, `${hedef[0] + 1}. SATIR · ${hedef[1] + 1}. SÜTUN`, R2(tR + 0.5), R2(tE), W / 2, H * 0.5, { zemin: yaz, renk: c.zemin(bi), grup: g, size: Math.round(m * 0.032), font: c.govde, weight: 800 });
      vuruslar.push(t, tBas, R2(tR), c.snap(tR + 1.0));
      t = tE;
    });

    // ── kapanış ──────────────────────────────────────────────────────────
    const tK = t;
    const tEnd = c.vurus(Math.round((tK - c.off) / c.p) + 12);
    bgler.push({ t: tK, i: n + 1 });
    c.silme('silme-son', tK, c.vurgu(n + 1));
    c.kapanisKar(tK, tEnd, brief.cta || 'Kaç saniyede buldun?', brief.alt, [goz], { i: n + 1 });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(Math.round((tK - c.off) / c.p) + j * 2));
    c.ilerleme(0.4, tEnd - 0.2, { y: Math.round(H * 0.106) });
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 }) });
  },
};
