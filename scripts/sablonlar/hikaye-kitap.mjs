// Hikâye · KİTAP (sayfa sayfa diorama): her bölüm kendi KATMANLI dünyasına sahip ayrı bir sayfa — kış, ilkbahar vadisi, deniz, sonbahar, gece.
// Kapak: deri ciltli kitap + altın başlık; sayfalar "sayfa çevirme" geçişiyle açılır, her sayfada bölüm başlığı, dünya (paralaks bantlar, hayvanlar, hava olayı)
// ve altta krem bir METİN KUTUSUNDA kitap yazısı + sayfa numarası. Mevsimler, bölgeler, "dünyaları gezen" masallar için.
// Hikâye: brief.hikaye = [{ dunya: 'kis'|'daglar'|'okyanus'|'sonbahar'|'gece', baslik, anlatim, sayfa?, ses? }]  (sayfa = kutuda gösterilen metin; yoksa anlatım)
import { hikayeKur, R2 } from './hikaye-ortak.mjs';

const DUNYALAR = {
  kis: { ad: 'Kış', bg: ['#cfe3f2', '#eaf3fa', '#f4f8fb', '#dfe9f1'], yazi: '#2f4a63', alt: '#4f6a82' },
  daglar: { ad: 'Vadi', bg: ['#a3d6ee', '#fdeccf', '#d9ecc9', '#7fb58a'], yazi: '#2d4a3e', alt: '#4a6b57' },
  okyanus: { ad: 'Deniz', bg: ['#8fd3ec', '#d4eef3', '#8ccbe0', '#1f4f6b'], yazi: '#1f5673', alt: '#2f7596' },
  sonbahar: { ad: 'Sonbahar', bg: ['#f6c58b', '#fde2b6', '#f2d5a0', '#d9a566'], yazi: '#6b3b1c', alt: '#8a5a34' },
  gece: { ad: 'Gece', bg: ['#0b132b', '#1c2541', '#3a506b', '#5b6f8f'], yazi: '#f5e6a8', alt: '#c9d6ea' },
};
const SIRA = ['kis', 'daglar', 'okyanus', 'sonbahar', 'gece'];
const ROMA = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const ALTIN = '#e3bd63';

export default {
  id: 'hikaye-kitap',
  ad: 'Hikâye · Kitap (sayfa sayfa dünyalar)',
  etiket: 'Hikâye · Masal kitabı · Sayfa çevirme',
  sure: '45–95 sn',
  aciklama: 'Deri ciltli bir masal kitabı: her sayfa kendi katmanlı dünyası (kış, vadi, deniz, sonbahar, gece). Sayfa çevirme geçişleri, bölüm başlığı, altta krem metin kutusunda kitap yazısı ve sayfa numarası. Mevsimleri ve dünyaları gezen masallar için.',
  ornek: {
    sablon: 'hikaye-kitap', id: 'sablon-hikaye-kitap', ad: 'Tilkinin Dört Mevsimi', format: 'reels', muzik: 'lofi-90', font: 'DM Serif Display',
    baslik: 'Tilkinin Dört Mevsimi', altBaslik: 'bir masal kitabı',
    hikaye: [
      { dunya: 'kis', baslik: 'Kış', anlatim: 'Karlar yağınca orman bembeyaz oldu. Küçük tilki, sıcacık yuvasından çıkıp ilk kar tanelerini yakalamaya çalıştı.', sayfa: 'Karlar yağınca orman bembeyaz oldu.' },
      { dunya: 'daglar', baslik: 'İlkbahar', anlatim: 'Güneş kendini gösterince karlar eridi ve vadi çiçeklerle doldu. Tilki laleleri koklayarak patikada koştu.', sayfa: 'Vadi çiçeklerle doldu, tilki koştu.' },
      { dunya: 'okyanus', baslik: 'Yaz', anlatim: 'Yazın kıyıya indi. Dalgaların üzerinde kâğıt gemiler yüzüyor, uzakta bir balina su fışkırtıyordu.', sayfa: 'Uzakta bir balina su fışkırtıyordu.' },
      { dunya: 'sonbahar', baslik: 'Sonbahar', anlatim: 'Yapraklar sarardı ve rüzgâr onları havaya savurdu. Tilki, altın rengi yaprakların altında oyun oynadı.', sayfa: 'Altın yapraklar havada dans etti.' },
      { dunya: 'gece', baslik: 'Uyku', anlatim: 'Yıl bitince gökyüzü yıldızlarla doldu. Küçük tilki yuvasına kıvrıldı ve yeni mevsimin rüyasını gördü.', sayfa: 'Küçük tilki yeni mevsimin rüyasını gördü.' },
    ],
    son: 'Son', soru: 'Senin en sevdiğin mevsim hangisi?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Tilkinin dört mevsimi: bir masal kitabı', aciklama: 'Kış, ilkbahar, yaz ve sonbahar: küçük tilkinin katmanlı kâğıt dünyalarında mevsim yolculuğu. En sevdiğin mevsim hangisi?', etiketler: ['masal', 'hikaye', 'mevsimler', 'tilki', 'animasyon', 'reels', 'shorts', 'cocuk', 'uyku'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-kitap', { palet: 'okyanus', muzik: 'lofi-90', font: 'DM Serif Display', stil: brief.stil || 'origami' }, { kapakBeats: 8, kapSure: 10, minSn: 7.0 });
    const { c, W, H, k, fx, fy, planlar, n, tAc, tK, tEnd, g } = Z;
    const KAHRAMAN = Z.lib.has(brief.kahraman) ? brief.kahraman : 'tilki';
    const dunya = planlar.map((pl, i) => (DUNYALAR[pl.s.dunya] ? pl.s.dunya : SIRA[i % SIRA.length]));
    const LORA = 'Lora';
    const KREM = '#fbf3df';
    const kitapRenk = { yazi: ALTIN, alt: '#f3dca4', golge: 'rgba(30,15,5,0.55)' };

    /** Yuvarlak köşeli dikdörtgen (kareler + daireler) */
    const yuvarlak = (id, cx, cy, w, h, r, renk, t0, t1, op = 1) => {
      const o = { t0, t1, renk, opacity: op, giris: 'yok', grup: g };
      c.sekil(`${id}-a`, 'kare', cx, cy, 200, { ...o, sx: (w - 2 * r) / 200, sy: h / 200 });
      c.sekil(`${id}-b`, 'kare', cx, cy, 200, { ...o, sx: w / 200, sy: (h - 2 * r) / 200 });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], q) => c.sekil(`${id}-c${q}`, 'daire', cx + dx * (w / 2 - r), cy + dy * (h / 2 - r), r * 2, o));
    };

    // ── dünyalar (t0..t1 arasında yaşar) ──────────────────────────────────
    const bantlar = (t0, t1, liste) => liste.forEach(([id, asset, y, s, pal, x, amp, per, nn]) => Z.bant(id, asset, y, s, pal, { x, amp, per, n: nn, t0: t0 + 0.1 + nn * 0.18, basla: t0, t1 }));
    const agac = (id, x, y, s, t0, t1, variant, tt = 0) => Z.hayvan(id, 'cam-agaci', x, y, s, t0 + 0.8 + tt, { sabit: true, end: t1, variant, ek: { fold: [k(t0 + 0.8 + tt, 0), k(t0 + 1.9 + tt, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.4 + tt }] } });
    const kah = (i, t0, t1, variant) => Z.hayvan(`kahraman-${i}`, KAHRAMAN, 560, 1730, 1.5, t0 + 1.6, { end: t1, variant });
    const kopya = (fn, i, t0, t1) => fn(i, t0, t1);
    const D = {
      kis(t0, t1, i) {
        Z.ekle({ id: `gunes-${i}`, group: g, asset: 'gunes', start: R2(t0), end: R2(t1), x: 800 * fx, y: 560 * fy, scale: R2(1.4 * fx), opacity: 0.8, palette: { a: '#fff3d0' }, ...Z.fold(t0 + 0.3, 1.3) });
        Z.bulut(`bulut-${i}a`, 200, 320, 430, 1.2, t0 + 0.6, { basla: t0, end: t1, zaman0: t0, zaman1: t1, pal: { a: '#e8eef5' } });
        Z.bulut(`bulut-${i}b`, 920, 800, 700, 0.8, t0 + 0.9, { basla: t0, end: t1, zaman0: t0, zaman1: t1, sira: 'right', pal: { a: '#e8eef5' } });
        bantlar(t0, t1, [[`dag-${i}a`, 'dag', 980, 3.9, { a: '#d6e0ee', b: '#bccbe0', c: '#ffffff' }, 360, 8, 7, 0], [`tepe-${i}a`, 'tepeler', 1180, 3.1, { a: '#f4f8fb', b: '#dfe9f1' }, 540, 14, 6, 1], [`tepe-${i}b`, 'tepeler', 1340, 3.4, { a: '#e9f0f7', b: '#d2dfec' }, 420, 20, 5.5, 2]]);
        agac(`agac-${i}a`, 140, 1390, 1.5, t0, t1, 'karli'); agac(`agac-${i}b`, 950, 1410, 1.7, t0, t1, 'karli', 0.3);
        bantlar(t0, t1, [[`tepe-${i}c`, 'tepeler', 1530, 3.8, { a: '#ffffff', b: '#e6eef6' }, 600, 26, 5, 3]]);
        kah(i, t0, t1, 'kutup');
        Z.ekle({ id: `kar-${i}`, group: g, type: 'particles', particle: 'kar', mode: 'surekli', start: R2(t0), end: R2(t1), opacity: 0.95 });
      },
      daglar(t0, t1, i) {
        Z.ekle({ id: `gunes-${i}`, group: g, asset: 'gunes', start: R2(t0), end: R2(t1), x: 790 * fx, y: 520 * fy, scale: R2(1.5 * fx), ...Z.fold(t0 + 0.3, 1.3), loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }] });
        Z.bulut(`bulut-${i}a`, 200, 320, 430, 1.2, t0 + 0.6, { basla: t0, end: t1, zaman0: t0, zaman1: t1 });
        Z.bulut(`bulut-${i}b`, 920, 800, 690, 0.8, t0 + 0.9, { basla: t0, end: t1, zaman0: t0, zaman1: t1, sira: 'right' });
        Z.ucan(`turna-${i}`, 'turna', t0 + 1.5, t1 - 0.5, 660, 540, 0.8, 14);
        bantlar(t0, t1, [[`dag-${i}a`, 'dag', 980, 3.9, { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' }, 360, 10, 7, 0], [`dag-${i}b`, 'dag', 1060, 3.6, { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' }, 760, 14, 6, 1], [`tepe-${i}a`, 'tepeler', 1180, 3.1, { a: '#a9d28b', b: '#8fc274' }, 540, 18, 6, 2], [`tepe-${i}b`, 'tepeler', 1330, 3.4, { a: '#8fc274', b: '#74ab5c' }, 420, 24, 5.5, 3]]);
        agac(`agac-${i}a`, 130, 1380, 1.5, t0, t1); agac(`agac-${i}b`, 960, 1400, 1.7, t0, t1, undefined, 0.3);
        bantlar(t0, t1, [[`tepe-${i}c`, 'tepeler', 1520, 3.8, { a: '#74ab5c', b: '#5e9449' }, 600, 30, 5, 4]]);
        Z.hayvan(`lale-${i}a`, 'lale', 240, 1790, 1.4, t0 + 1.4, { sabit: true, end: t1 }); Z.hayvan(`lale-${i}b`, 'lale', 840, 1810, 1.2, t0 + 1.6, { sabit: true, end: t1, variant: 'sari' });
        Z.ucan(`kelebek-${i}`, 'kelebek', t0 + 2.4, t1 - 0.4, 1500, 1250, 0.55, 26, 0.35);
        kah(i, t0, t1);
      },
      okyanus(t0, t1, i) {
        Z.ekle({ id: `gunes-${i}`, group: g, asset: 'gunes', start: R2(t0), end: R2(t1), x: 810 * fx, y: 560 * fy, scale: R2(1.6 * fx), ...Z.fold(t0 + 0.3, 1.3) });
        Z.bulut(`bulut-${i}a`, 230, 330, 470, 1.3, t0 + 0.6, { basla: t0, end: t1, zaman0: t0, zaman1: t1 });
        Z.ucan(`marti-${i}a`, 'marti', t0 + 1.2, t1 - 0.3, 700, 560, 1.3, 18); Z.ucan(`marti-${i}b`, 'marti', t0 + 2.4, t1 - 0.3, 800, 740, 0.85, 12);
        bantlar(t0, t1, [[`dalga-${i}a`, 'dalga', 880, 2.9, { a: '#a6dcea', b: '#86c9de' }, 540, 30, 6, 0], [`dalga-${i}b`, 'dalga', 1030, 3.2, { a: '#86c9de', b: '#63b2cf' }, 540, 38, 5.5, 1], [`dalga-${i}c`, 'dalga', 1200, 3.5, { a: '#63b2cf', b: '#4798bd' }, 540, 46, 5, 2]]);
        Z.ekle({ id: `gemi-${i}`, group: g, asset: 'kagit-gemi', start: R2(t0 + 1.6), end: R2(t1), x: [k(t0, 250 * fx), k(t1, 560 * fx, 'linear')], y: 1075 * fy, anchor: [0.5, 0.88], scale: R2(0.8 * fx), palette: { a: '#f4a261' }, ...Z.fold(t0 + 1.6, 1.2, { foldStyle: { order: 'bottom', spread: 0.6 } }), loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 2.8 }, { prop: 'y', type: 'sine', amp: 7, period: 2.8, phase: 0.25 }] });
        Z.ekle({ id: `balina-${i}`, group: g, asset: 'balina', start: R2(t0 + 2.2), end: R2(t1), x: [k(t0 + 2.2, 1500 * fx), k(t0 + 4.6, 640 * fx, 'outCubic'), k(t1 - 0.6, 640 * fx, 'linear'), k(t1, -420 * fx, 'inCubic')], y: 1430 * fy, scale: R2(2.4 * fx), loops: [{ prop: 'y', type: 'sine', amp: 10, period: 3.2 }], ...Z.kanat('balina', 1) });
        bantlar(t0, t1, [[`dalga-${i}d`, 'dalga', 1400, 3.8, { a: '#4a9cc0', b: '#357fa6' }, 540, 54, 4.5, 3], [`dalga-${i}e`, 'dalga', 1620, 4.1, { a: '#3a86a8', b: '#276688' }, 540, 62, 4, 4]]);
        kah(i, t0 + 0.4, t1);
        const kl = c.layers.find((l) => l.id === `kahraman-${i}`);
        if (kl) { kl.x = 300 * fx; kl.y = [k(t0 + 2, 2300 * fy), k(t0 + 3, 1740 * fy, 'outBack')]; }
      },
      sonbahar(t0, t1, i) {
        Z.ekle({ id: `gunes-${i}`, group: g, asset: 'gunes', start: R2(t0), end: R2(t1), variant: 'gunbatimi', x: 800 * fx, y: 640 * fy, scale: R2(1.5 * fx), ...Z.fold(t0 + 0.3, 1.3) });
        Z.bulut(`bulut-${i}a`, 220, 340, 460, 1.2, t0 + 0.6, { basla: t0, end: t1, zaman0: t0, zaman1: t1, pal: { a: '#fff0d6' } });
        Z.ucan(`turna-${i}`, 'turna', t0 + 1.5, t1 - 0.5, 700, 560, 0.8, 14);
        bantlar(t0, t1, [[`dag-${i}a`, 'dag', 1000, 3.9, { a: '#d9b08c', b: '#c28f6c', c: '#fff1dc' }, 360, 10, 7, 0], [`tepe-${i}a`, 'tepeler', 1200, 3.1, { a: '#e0a458', b: '#c98a3c' }, 540, 18, 6, 1], [`tepe-${i}b`, 'tepeler', 1350, 3.4, { a: '#d68a3a', b: '#b9702a' }, 420, 24, 5.5, 2]]);
        agac(`agac-${i}a`, 140, 1390, 1.5, t0, t1, 'sonbahar'); agac(`agac-${i}b`, 950, 1410, 1.7, t0, t1, 'sonbahar', 0.3);
        bantlar(t0, t1, [[`tepe-${i}c`, 'tepeler', 1530, 3.8, { a: '#b9702a', b: '#9d5a1f' }, 600, 28, 5, 3]]);
        kah(i, t0, t1, 'altin');
        Z.ekle({ id: `yaprak-${i}`, group: g, type: 'particles', particle: 'yaprak', mode: 'surekli', start: R2(t0), end: R2(t1), opacity: 0.95 });
      },
      gece(t0, t1, i) {
        Z.ekle({ id: `ay-${i}`, group: g, asset: 'hilal', start: R2(t0), end: R2(t1), x: 860 * fx, y: 580 * fy, scale: R2(1.8 * fx), ...Z.fold(t0 + 0.3, 1.3), loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }] });
        [[170, 330, 0.3], [420, 230, 0.2], [610, 520, 0.28], [920, 760, 0.22], [140, 700, 0.18], [470, 640, 0.25], [330, 130, 0.2]].forEach(([x, y, s], q) => Z.ekle({ id: `yildiz-${i}-${q}`, group: g, asset: 'yildiz', start: R2(t0 + 0.4 + q * 0.15), end: R2(t1), x: x * fx, y: y * fy, scale: R2(s * fx), palette: { a: '#fff2b3' }, ...Z.fold(t0 + 0.4 + q * 0.15, 0.8), opacity: 0.8, loops: [{ prop: 'opacity', type: 'sine', amp: 0.35, period: 1.6 + (q % 4) * 0.5, phase: q * 0.3 }] }));
        bantlar(t0, t1, [[`dag-${i}a`, 'dag', 1000, 3.9, { a: '#2a3a5c', b: '#22304f', c: '#4a5d85' }, 380, 8, 7, 0], [`dag-${i}b`, 'dag', 1090, 3.7, { a: '#1f2c4a', b: '#192440', c: '#3a4a6e' }, 760, 12, 6, 1], [`tepe-${i}a`, 'tepeler', 1260, 3.3, { a: '#16223e', b: '#121b33' }, 520, 18, 6, 2]]);
        agac(`agac-${i}a`, 150, 1420, 1.6, t0, t1, 'koyu'); agac(`agac-${i}b`, 930, 1440, 1.9, t0, t1, 'koyu', 0.3);
        bantlar(t0, t1, [[`tepe-${i}b`, 'tepeler', 1560, 3.8, { a: '#0d1529', b: '#0a101f' }, 600, 26, 5, 3]]);
        kah(i, t0, t1, 'gece');
      },
    };
    void kopya;

    // ── kapak: deri cilt ──────────────────────────────────────────────────
    c.bolum(0, 'Kapak');
    c.sekil('cilt', 'kare', W / 2, H / 2, 200, { t0: 0, t1: tAc, renk: '#6e4126', giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: g });
    [[70, 6, 0.9], [100, 3, 0.6]].forEach(([d, kal, al], q) => {
      const o = { t0: 0.2, t1: tAc, renk: ALTIN, opacity: al, giris: 'yok', grup: g };
      c.sekil(`cilt-u${q}`, 'kare', W / 2, d, 200, { ...o, sx: (W - 2 * d) / 200, sy: kal / 200 }); c.sekil(`cilt-a${q}`, 'kare', W / 2, H - d, 200, { ...o, sx: (W - 2 * d) / 200, sy: kal / 200 });
      c.sekil(`cilt-l${q}`, 'kare', d, H / 2, 200, { ...o, sx: kal / 200, sy: (H - 2 * d) / 200 }); c.sekil(`cilt-r${q}`, 'kare', W - d, H / 2, 200, { ...o, sx: kal / 200, sy: (H - 2 * d) / 200 });
    });
    c.sekil('cilt-orn', 'elmas', W / 2, H * 0.52, 34, { t0: 1.2, t1: tAc, renk: ALTIN, grup: g, sure: 0.4 });
    c.sekil('cilt-orn-c', 'kare', W / 2, H * 0.52, 200, { t0: 1.4, t1: tAc, renk: ALTIN, opacity: 0.7, giris: 'yok', grup: g, sx: [k(1.4, 0), k(2.2, (W * 0.55) / 200, 'outCubic')], sy: 2 / 200 });
    c.sekil('cilt-kahraman-isik', 'daire', W / 2, H * 0.74, 520, { t0: 1.0, t1: tAc, renk: ALTIN, opacity: 0.18, grup: g, blur: 50 });
    Z.hayvan('cilt-kahraman', KAHRAMAN, 540, 1500, 1.9, 0.8, { end: tAc });
    c.L({ id: 'baslik', group: g, type: 'text', text: brief.baslik || brief.ad, font: Z.font, weight: 400, size: 130, color: ALTIN, x: W / 2, y: Math.round(H * 0.28), align: 'center', lineHeight: 1.02, start: 0.5, end: R2(tAc),
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 0, y: 6 }, reveal: [k(0.6, 0), k(2.4, 1, 'linear')] });
    if (brief.altBaslik) c.L({ id: 'alt-baslik', group: g, type: 'text', text: brief.altBaslik, font: LORA, weight: 500, size: 56, color: '#f3dca4', x: W / 2, y: Math.round(H * 0.585), align: 'center', start: 0.5, end: R2(tAc), reveal: [k(1.8, 0), k(3, 1, 'linear')] });
    c.layers.find((l) => l.id === 'baslik').text = (brief.baslik || brief.ad).replace(/(.{1,14})(\s|$)/g, '$1\n').trim();

    // ── sayfalar ──────────────────────────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const dn = DUNYALAR[dunya[i]];
      c.bolum(t0, `${ROMA[i + 1] || i + 1}. ${s.baslik || dn.ad}`);
      c.gecis('sayfa-cevir', t0, 1.0, '#f3e6c8');
      D[dunya[i]](t0, t1, i);
      // bölüm başlığı
      c.L({ id: `bolum-${i}`, group: g, type: 'text', text: `${ROMA[i + 1] || i + 1}. ${s.baslik || dn.ad}`, font: Z.font, weight: 400, size: 96, color: dn.yazi, x: W / 2, y: Math.round(H * 0.1), align: 'center', start: R2(t0 + 0.4), end: R2(t1),
        shadow: { color: 'rgba(0,0,0,0.18)', blur: 0, y: 5 }, scale: [k(t0 + 0.4, 0.7), k(t0 + 1.1, 1, 'outBack')], opacity: [k(t0 + 0.4, 0), k(t0 + 0.9, 1, 'linear')] });
      // metin kutusu + sayfa numarası
      const py = H * 0.625;
      yuvarlak(`kutu-${i}`, W / 2, py + 10, W * 0.9, H * 0.15, 40, '#000000', t0 + 1.0, t1, 0.18);
      yuvarlak(`kutu-${i}-k`, W / 2, py, W * 0.9, H * 0.15, 40, KREM, t0 + 1.0, t1, 0.97);
      Z.altyazi(`yazi-${i}`, s.sayfa || s.anlatim, t0 + 1.5, t1 - 0.1, { yazi: '#3a2a1a' }, { kutu: false, y: 0.625, sar: 30, size: 54, ek: { font: LORA, weight: 500 } });
      c.L({ id: `sayfa-no-${i}`, group: g, type: 'text', text: `— ${i + 1} —`, font: LORA, weight: 600, size: 34, color: '#8a6a44', x: W / 2, y: Math.round(py + H * 0.062), align: 'center', start: R2(t0 + 1.5), end: R2(t1) });
      Z.ses(pl, t0 + 1.2);
    });

    // ── kapanış: kitap kapanır ────────────────────────────────────────────
    c.gecis('sayfa-cevir', tK, 1.0, '#6e4126');
    c.sekil('son-cilt', 'kare', W / 2, H / 2, 200, { t0: tK, renk: '#6e4126', giris: 'yok', sx: (W * 1.2) / 200, sy: (H * 1.2) / 200, grup: g });
    c.sekil('son-altin-u', 'kare', W / 2, 100, 200, { t0: tK, renk: ALTIN, opacity: 0.6, giris: 'yok', sx: (W - 200) / 200, sy: 3 / 200, grup: g });
    c.sekil('son-altin-a', 'kare', W / 2, H - 100, 200, { t0: tK, renk: ALTIN, opacity: 0.6, giris: 'yok', sx: (W - 200) / 200, sy: 3 / 200, grup: g });
    Z.kapanis(kitapRenk, { perde: 0 });
    return Z.bitir({
      background: bgAdim(Z, planlar, dunya, tK, tAc),
      camera: { zoom: [k(0, 1.1), k(3.5, 1, 'inOutCubic')], x: W / 2, y: H / 2 },
    });
  },
};

/** Sayfa geçişlerinde anlık değişen arka plan (step) */
function bgAdim(Z, planlar, dunya, tK, tAc) {
  const { k } = Z;
  const kanallar = [0, 1, 2, 3].map((q) => {
    const tr = [k(0, '#6e4126')];
    planlar.forEach((pl, i) => tr.push(k(pl.t0, DUNYALAR[dunya[i]].bg[q], 'step')));
    tr.push(k(tK, '#6e4126', 'step'));
    return tr;
  });
  return { type: 'linear', colors: kanallar, angle: 180, paper: 0.5, vignette: 0.18 };
}
