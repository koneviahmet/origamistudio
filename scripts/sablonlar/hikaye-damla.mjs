// Hikâye · DAMLA (dikey yolculuk): çok uzun DİKEY bir dünya — bulut, dağ, dere, deniz yüzeyi, derin deniz. Kamera küçük bir damlayı AŞAĞI doğru
// izler (yağmur, akış, derinlik), sonra buharlaşıp yeniden yukarı çıkar; hikâye bir dairedir. Her bölge kendi katmanlı manzarası ve ışığıyla.
// Su döngüsü, besin zinciri, yaşam döngüsü, "bir şeyin yolculuğu" hikâyeleri için. Kahraman: `damla` şekli (rengi `renk` ile).
// Hikâye: brief.hikaye = [{ bolge?: 'gok'|'dag'|'dere'|'deniz'|'derin', baslik, anlatim, altyazi?, ses? }]
import { hikayeKur, GOKYUZU, R2 } from './hikaye-ortak.mjs';

const BOLGE_Y = { gok: 600, dag: 2150, dere: 2800, deniz: 3470, derin: 5400 };
const SIRA = ['gok', 'dag', 'dere', 'deniz', 'derin', 'deniz', 'gok'];

export default {
  id: 'hikaye-damla',
  ad: 'Hikâye · Damla (dikey iniş)',
  etiket: 'Hikâye · Dikey dünya · Su döngüsü',
  sure: '45–90 sn',
  aciklama: 'Çok uzun dikey bir dünya: bulut, dağ, dere, deniz yüzeyi ve derin deniz. Kamera küçük bir damlayı aşağıya doğru izler, sonra buharlaşıp yeniden yukarı çıkar. Her bölgenin kendi katmanlı manzarası ve ışığı var. Su döngüsü gibi "bir şeyin yolculuğu" hikâyeleri için.',
  ornek: {
    sablon: 'hikaye-damla', id: 'sablon-hikaye-damla', ad: 'Damlanın Yolculuğu', format: 'reels', muzik: 'lofi-90', font: 'Baloo 2', renk: '#4aa8ff',
    baslik: 'Damlanın Yolculuğu', altBaslik: 'bulutan okyanusa, okyanustan buluta',
    hikaye: [
      { bolge: 'gok', baslik: 'Bulut', anlatim: 'Gökyüzünde kocaman bir bulutun içinde küçük bir su damlası uyandı. Adı Damla idi ve dünyayı görmek istiyordu.', altyazi: 'Damla bulutta uyandı.' },
      { bolge: 'dag', baslik: 'Yağmur', anlatim: 'Bulut ağırlaşınca Damla aşağı süzüldü. Dağların üzerine yağmur olarak düştü ve çam ağaçlarını selamladı.', altyazi: 'Damla yağmur olup yağdı.' },
      { bolge: 'dere', baslik: 'Dere', anlatim: 'Sonra bir derenin içine karıştı. Taşların arasından neşeyle akıp gitti.', altyazi: 'Dere onu denize taşıdı.' },
      { bolge: 'derin', baslik: 'Derinlik', anlatim: 'Denizin derinliklerinde balıklarla, bir de büyük balinayla tanıştı. Her yer masmaviydi.', altyazi: 'Balıklarla tanıştı.' },
      { bolge: 'deniz', baslik: 'Buharlaşma', anlatim: 'Güneş denizi ısıtınca Damla buharlaşıp yeniden yükselmeye başladı.', altyazi: 'Güneş onu yukarı çağırdı.' },
      { bolge: 'gok', baslik: 'Yeniden bulut', anlatim: 'Yükseldi, yükseldi ve bir bulutun içinde yeniden uyandı. Yolculuk bir daire gibi hiç bitmiyordu.', altyazi: 'Yolculuk hiç bitmiyor.' },
    ],
    son: 'Her damla bir yolculuk', soru: 'Sen hangi damlasın?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Damlanın yolculuğu: su döngüsü hikâyesi', aciklama: 'Bulutan yağmura, dereden okyanusa, buharlaşıp yeniden buluta: küçük bir damlanın hikâyesi. Beğen ve kaydet!', etiketler: ['su-dongusu', 'hikaye', 'animasyon', 'egitim', 'doga', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-damla', { palet: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2', stil: brief.stil || 'origami' }, { kapakBeats: 8, kapSure: 10, minSn: 6.4 });
    const { c, W, H, k, fx, fy, planlar, n, tAc, tK, tEnd, g } = Z;
    const sg = GOKYUZU;
    const TAHTA = { yazi: '#1f3a4d', kutu: 'rgba(255,255,255,0.85)', alt: '#3a5a6e', golge: 'rgba(0,0,0,0.25)' };
    const RENK = /^#[0-9a-f]{6}$/i.test(brief.renk || '') ? brief.renk : '#4aa8ff';
    const bolge = planlar.map((pl, i) => pl.s.bolge || SIRA[Math.round((i * (SIRA.length - 1)) / Math.max(1, n - 1))]);
    const yd = bolge.map((b) => BOLGE_Y[b] ?? 600); // damla y (dünya)
    const camOf = (y) => y + 0.08 * H; // damla ekranın %42'sinde
    const bolgeGok = { gok: sg.gunduz.bg, dag: sg.gunduz.bg, dere: sg.deniz.bg, deniz: sg.deniz.bg, derin: ['#1f6a8a', '#17506f', '#0f3a58', '#0a2840'] };

    // ── dünya: gökyüzü bölgesi ────────────────────────────────────────────
    Z.ekle({ id: 'gunes', group: g, asset: 'gunes', x: 800 * fx, y: 330 * fy, scale: R2(1.6 * fx), ...Z.fold(0.3, 1.3), loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }] });
    Z.bulut('bulut-ev', 540, 560, 640, 5.0, 0.5, { zaman1: tEnd, pal: { a: '#ffffff' } });
    [[160, 460, 1.4], [900, 360, 1.1], [220, 820, 1.0], [880, 900, 1.3], [540, 220, 1.0]].forEach(([x, y, s], i) => Z.bulut(`bulut-${i}`, x, x + (i % 2 ? -90 : 90), y, s, 0.6 + i * 0.1, { zaman1: tEnd, sira: i % 2 ? 'right' : 'left' }));
    Z.ucan('marti-1', 'marti', 2.0, tEnd - 2, 1180, 1050, 1.3, 16);
    // ── dağ bölgesi ───────────────────────────────────────────────────────
    const B = (id, asset, y, s, pal, x, amp, per, nn) => Z.bant(id, asset, y, s, pal, { x, amp, per, n: nn, sabit: true });
    B('dag-1', 'dag', 1330, 3.9, { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' }, 360, 10, 7, 0);
    B('dag-2', 'dag', 1420, 3.6, { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' }, 760, 14, 6, 1);
    B('tepe-1', 'tepeler', 1560, 3.1, { a: '#a9d28b', b: '#8fc274' }, 540, 18, 6, 2);
    B('tepe-2', 'tepeler', 1710, 3.4, { a: '#8fc274', b: '#74ab5c' }, 420, 24, 5.5, 3);
    Z.hayvan('agac-1', 'cam-agaci', 130, 1840, 1.6, 0.5, { sabit: true, ek: { loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.4 }] } });
    Z.hayvan('agac-2', 'cam-agaci', 960, 1860, 1.8, 0.5, { sabit: true, ek: { loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.8, phase: 0.4 }] } });
    B('tepe-3', 'tepeler', 1960, 3.8, { a: '#74ab5c', b: '#5e9449' }, 600, 30, 5, 4);
    // ── dere bölgesi (yeşil kıyı → akan su) ───────────────────────────────
    c.sekil('dere-zemin', 'kare', W / 2, 2760, 200, { t0: 0, renk: '#6fb4cc', giris: 'yok', sx: (W * 1.3) / 200, sy: 760 / 200, grup: g });
    [[2440, '#a6dcea', '#86c9de'], [2600, '#86c9de', '#63b2cf'], [2760, '#63b2cf', '#4798bd'], [2920, '#4798bd', '#357fa6']].forEach(([y, a, b], i) => B(`dere-${i}`, 'dalga', y, 3.2 + i * 0.2, { a, b }, 540, 34 + i * 6, 4.6 - i * 0.3, 5 + i));
    // ── deniz yüzeyi + derin deniz ────────────────────────────────────────
    B('deniz-1', 'dalga', 3150, 2.9, { a: '#a6dcea', b: '#86c9de' }, 540, 30, 6, 0);
    Z.ekle({ id: 'gemi', group: g, asset: 'kagit-gemi', x: [k(0, 250 * fx), k(tEnd, 700 * fx, 'linear')], y: 3290 * fy, anchor: [0.5, 0.88], scale: R2(1.05 * fx), loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 2.8 }, { prop: 'y', type: 'sine', amp: 7, period: 2.8, phase: 0.25 }] });
    B('deniz-2', 'dalga', 3300, 3.2, { a: '#86c9de', b: '#63b2cf' }, 540, 38, 5.5, 1);
    B('deniz-3', 'dalga', 3450, 3.5, { a: '#63b2cf', b: '#4798bd' }, 540, 46, 5, 2);
    [['#3d8cb3', 3560], ['#2f78a0', 4200], ['#236489', 4900], ['#194f70', 5600], ['#103b57', 6300]].forEach(([renk, y], i) => c.sekil(`derin-${i}`, 'kare', W / 2, y + 400, 200, { t0: 0, renk, giris: 'yok', sx: (W * 1.3) / 200, sy: 900 / 200, grup: g }));
    B('deniz-4', 'dalga', 3560, 3.8, { a: '#4a9cc0', b: '#357fa6' }, 540, 54, 4.5, 3);
    // ışık huzmeleri + balıklar + balina + kabarcık
    [200, 520, 840].forEach((x, i) => c.L({ id: `huzme-${i}`, group: g, asset: 'huzme', x: x * fx, y: 3640 * fy, anchor: [0.5, 0], scale: 1, scaleX: 1.4 + i * 0.3, scaleY: 3.6, palette: { a: '#d8f3ff' }, opacity: 0.16, blur: 14, loops: [{ prop: 'opacity', type: 'sine', amp: 0.05, period: 3 + i, phase: i }] }));
    for (let i = 0; i < 5; i++) Z.ekle({ id: `balik-${i}`, group: g, asset: 'balik', variant: ['tropik', 'yesil', 'mor'][i % 3], x: [k(0, (i % 2 ? 1250 : -150) * fx), k(tEnd, (i % 2 ? -150 : 1250) * fx, 'linear')], y: (4500 + i * 230) * fy, scale: R2((0.8 + (i % 3) * 0.2) * fx), scaleX: (i % 2 ? 1 : -1) * R2((0.8 + (i % 3) * 0.2) * fx),
      loops: [{ prop: 'y', type: 'sine', amp: 24, period: 3 + i * 0.4 }], ...Z.kanat('balik', 0.5) });
    Z.ekle({ id: 'balina', group: g, asset: 'balina', x: [k(0, 1500 * fx), k(tEnd, -500 * fx, 'linear')], y: 5500 * fy, scale: R2(2.6 * fx), loops: [{ prop: 'y', type: 'sine', amp: 30, period: 5 }], ...Z.kanat('balina', 1) });
    c.L({ id: 'kabarcik', group: g, type: 'particles', particle: 'kabarcik', mode: 'surekli', start: 0, end: R2(tEnd), count: 40, area: [0, 3700 * fy, W, 6200 * fy], opacity: 0.9 });

    // ── damla ─────────────────────────────────────────────────────────────
    const yTrack = (fark, lag = 0) => {
      const out = [k(0, R2((yd[0] + fark) * fy))];
      planlar.forEach((pl, i) => {
        const onceki = i ? yd[i - 1] : yd[0];
        out.push(k(pl.t0 + 0.1 + lag, R2((onceki + fark) * fy), 'linear'), k(pl.t0 + 2.0 + lag, R2((yd[i] + fark) * fy), 'inOutCubic'));
      });
      return out.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
    };
    const bas = planlar[0].t0 - 1.5;
    const buhar = bolge.map((b, i) => (b === 'deniz' && i > 0 && bolge.slice(0, i).includes('derin') ? 1 : 0));
    const dOp = [k(0, 1), ...planlar.flatMap((pl, i) => [k(pl.t0 + 0.2, i ? (buhar[i - 1] ? 0.55 : 1) : 1, 'linear'), k(pl.t0 + 2, buhar[i] ? 0.5 : 1, 'linear')])];
    const dOps = dOp.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
    c.L({ id: 'damla-g', group: g, asset: 'damla', x: W / 2, y: yTrack(18), anchor: [0.5, 0.5], scale: R2(0.58 * fx), palette: { a: '#000000' }, opacity: 0.12, start: R2(bas), blur: 4,
      loops: [{ prop: 'x', type: 'sine', amp: 20, period: 2.6 }] });
    c.L({ id: 'damla', group: g, asset: 'damla', x: W / 2, y: yTrack(0), anchor: [0.5, 0.5], scale: [k(bas, 0), k(bas + 0.8, R2(0.6 * fx), 'outBack')], palette: { a: RENK }, opacity: dOps, start: R2(bas),
      loops: [{ prop: 'x', type: 'sine', amp: 20, period: 2.6 }, { prop: 'scaleY', type: 'sine', amp: 0.04, period: 1.3 }] });
    c.L({ id: 'damla-isik', group: g, asset: 'daire', x: W / 2 - 18, y: yTrack(-22), anchor: [0.5, 0.5], scale: R2(0.07 * fx), palette: { a: '#ffffff' }, opacity: 0.85, start: R2(bas), loops: [{ prop: 'x', type: 'sine', amp: 20, period: 2.6 }] });

    // ── yağmur (dağ bölgesi bölümünde) ────────────────────────────────────
    planlar.forEach((pl, i) => {
      const bb = bolge[i];
      if (bb === 'dag') c.L({ id: `yagmur-${i}`, group: g, type: 'particles', particle: 'yagmur', mode: 'surekli', start: R2(pl.t0), end: R2(pl.t1 + 0.5), area: [0, (BOLGE_Y.dag - 700) * fy, W, (BOLGE_Y.dag + 500) * fy], opacity: 0.9 });
      if (buhar[i]) for (let q = 0; q < 6; q++) c.sekil(`buhar-${i}-${q}`, 'daire', 300 + q * 90, 3560, 60 + (q % 3) * 24, { t0: pl.t0 + 0.4 + q * 0.3, t1: pl.t1, renk: '#ffffff', opacity: 0.5, giris: 'yok', grup: g, extra: { y: [k(pl.t0 + 0.4 + q * 0.3, 3560 * fy), k(pl.t1, 1100 * fy, 'linear')], opacity: [k(pl.t0 + 0.4 + q * 0.3, 0), k(pl.t0 + 1.2 + q * 0.3, 0.55, 'linear'), k(pl.t1, 0, 'linear')] } });
    });

    // ── bölüm yazıları: kamera durağı etrafında ───────────────────────────
    Z.acilis({ yazi: sg.gunduz.yazi, alt: sg.gunduz.alt, golge: sg.gunduz.golge }, { y: 0.1 });
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const cy = camOf(yd[i]);
      c.bolum(t0, s.baslik || `Bölüm ${i + 1}`);
      // bölge etiketi (damlanın solunda)
      c.L({ id: `etiket-${i}`, group: g, type: 'text', text: s.baslik || '', font: Z.font, weight: 700, size: 60, color: '#ffffff', x: W * 0.78, y: Math.round(yd[i] - 20), start: R2(t0 + 1.9), end: R2(t1 - 0.1),
        stroke: { color: 'rgba(20,70,100,0.85)', width: 12 }, rotation: 3, reveal: [k(t0 + 2.0, 0), k(t0 + 2.7, 1, 'linear')], scale: [k(t0 + 1.9, 0.7), k(t0 + 2.4, 1, 'outBack')] });
      Z.altyazi(`altyazi-${i}`, s.altyazi || s.anlatim, t0 + 2.1, t1 - 0.1, TAHTA, { y: 0.74, ek: { y: Math.round(cy + (0.74 - 0.5) * H) } });
      Z.ses(pl, t0 + 1.0);
    });

    // kapanış: son bölgenin ekranında
    Z.kapanis(TAHTA, { perde: 0.5 });
    const dy = camOf(yd[n - 1]) - H / 2;
    c.layers.filter((l) => /^kapanis-|^takip-/.test(l.id)).forEach((l) => {
      if (typeof l.y === 'number') l.y = Math.round(l.y + dy);
      else if (Array.isArray(l.y)) l.y = l.y.map((e) => ({ ...e, v: R2(e.v + dy) }));
      if (l.area) l.area = [l.area[0], l.area[1] + dy, l.area[2], l.area[3] + dy];
    });

    // ── kamera: damlayı izler ─────────────────────────────────────────────
    const camY = [k(0, R2(camOf(yd[0]) + 100 * fy))];
    camY.push(k(3.5, R2(camOf(yd[0])), 'inOutCubic'));
    planlar.forEach((pl, i) => {
      if (!i) return;
      camY.push(k(pl.t0 + 0.1, R2(camOf(yd[i - 1])), 'linear'), k(pl.t0 + 2.1, R2(camOf(yd[i])), 'inOutCubic'));
    });
    const duz = (a) => a.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
    const gok = Z.gokyuzu([{ t: 0, bg: sg.gunduz.bg }, ...planlar.map((pl, i) => ({ t: pl.t0 + 0.6, bg: bolgeGok[bolge[i]] }))], { sure: 2.2 });
    return Z.bitir({
      background: gok,
      camera: { zoom: [k(0, 1.15), k(3.5, 1, 'inOutCubic')], x: W / 2, y: duz(camY) },
    }, { yazi: sg.gunduz.yazi, alt: sg.gunduz.alt });
  },
};
