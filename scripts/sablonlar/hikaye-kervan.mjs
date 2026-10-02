// Hikâye · KÜÇÜK KERVANCI (kendi modelleriyle): kıvrımlı bir çöl yolunda ufuktan izleyiciye doğru yürüyen deve + gezgin çocuk (perspektif).
// Yol ufukta dar, önde geniş; kervan ilerledikçe büyür, dönemeçlerde yönünü çevirir, kamera yavaşça yaklaşır. Gün: şafak → öğle (rüzgâr, kartal, serap) → akşam → gece (çadır, ateş)
// → şafakta vaha. Kum tepeleri, piramitler, palmiyeler, kaktüs, çadır, yağ lambası, güneş / ay hep özel modeller (npm run seed:hikaye).
// Hikâye: brief.hikaye = [{ baslik, anlatim, altyazi?, ses? }]
import { hikayeKur, R2 } from './hikaye-ortak.mjs';
import { YOL, yolMerkez } from '../hikaye-modeller/yol.mjs';

const RENK = { yazi: '#fff3d8', alt: '#ffd9a0', golge: 'rgba(60,24,10,0.6)', vurgu: '#ffb347', kontur: 'rgba(70,32,14,0.88)' };
const GOK = {
  sabah: ['#6fa8d8', '#f6c98a', '#ffd9a0', '#ffeccf'],
  ogle: ['#4a8fd6', '#8cc4ee', '#cfe6f6', '#fbe9c6'],
  aksam: ['#3b2f7a', '#c4528a', '#ff9a62', '#ffd08a'],
  gece: ['#0a1230', '#1a2858', '#34457e', '#5a6ca6'],
  safak: ['#6a7fb8', '#f4a89a', '#ffd2a0', '#ffeccf'],
};
const Y0 = 840; // yolun üst (ufuk) kenarı

export default {
  id: 'hikaye-kervan',
  ad: 'Hikâye · Küçük Kervancı (kıvrımlı çöl yolu)',
  etiket: 'Hikâye · Özel modeller · Çöl · Perspektif',
  sure: '55–100 sn',
  aciklama: 'Kıvrımlı çöl yolunda ufuktan izleyiciye doğru yürüyen deve ve gezgin çocuk (özel modeller). Perspektifle büyür, dönemeçlerde yön çevirir; rüzgâr, kartal, serap, çadır ve ateş, vaha. Gün şafaktan geceye, geceden şafağa döner.',
  ornek: {
    sablon: 'hikaye-kervan', id: 'sablon-hikaye-kervan', ad: 'Küçük Kervancı', format: 'reels', muzik: 'lofi-90', font: 'Playfair Display',
    kanca: 'Bir çöl masalı', baslik: 'Küçük Kervancı', altBaslik: 'Yusuf ile Zeytin\'in yolu',
    hikaye: [
      { baslik: 'Şafak', anlatim: 'Güneş kumların ardından doğarken küçük Yusuf ve devesi Zeytin yola çıktı. Önlerinde uzun bir yol, ufukta ise tek bir hayal vardı: vaha.', altyazi: 'Yusuf ve Zeytin yola çıktı.' },
      { baslik: 'Rüzgâr', anlatim: 'Kumların üzerinden sert bir rüzgâr geçti. Kum taneleri havalandı ama Yusuf eşarbını sıkıca sardı ve yürümeye devam etti.', altyazi: 'Yusuf rüzgâra aldırmadan yürüdü.' },
      { baslik: 'Kartal', anlatim: 'Gökyüzünde bir kartal süzülüyordu. Yusuf başını kaldırıp ona seslendi: vahaya giden yol bu mu? Kartal kanat çırptı ve yolu gösterdi.', altyazi: 'Kartal yolu gösterdi.' },
      { baslik: 'Serap', anlatim: 'Öğle sıcağında ufukta parlak bir göl göründü. Yusuf koşmak istedi ama Zeytin başını salladı: bu bir serapmış. Sabretmek gerekirdi.', altyazi: 'Bu bir serapmış; sabretmek gerekirdi.' },
      { baslik: 'Gece', anlatim: 'Akşam olunca çadırlarını kurdular, ateşin başında yıldızları saydılar. Çölde gece soğuktu ama dostluk sıcaktı.', altyazi: 'Çölde gece soğuktu, dostluk sıcaktı.' },
      { baslik: 'Vaha', anlatim: 'Sabah palmiyelerin arasında gerçek bir vaha göründü. Zeytin suyu içti, Yusuf gülümsedi. Sabreden yolcu hep varırdı.', altyazi: 'Sabreden yolcu hep varır.' },
    ],
    son: 'Sabreden yolcu varır', soru: 'Senin vahan neresi?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Küçük Kervancı: Yusuf ile Zeytin\'in çöl yolculuğu', aciklama: 'Kıvrımlı bir çöl yolunda küçük gezgin Yusuf ve devesi Zeytin\'in vahaya yolculuğu. Katmanlı kâğıt dünyada bir çöl masalı. Senin vahan neresi?', etiketler: ['masal', 'hikaye', 'col', 'deve', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-kervan', { palet: 'okyanus', muzik: 'lofi-90', font: 'Playfair Display', stil: brief.stil || 'kagit-kesme' }, { kapakBeats: 8, kapSure: 10, minSn: 7.6 });
    const { c, W, H, k, n, planlar, lib, tAc, tK, tEnd, g } = Z;
    const need = ['kervan-deve', 'kervan-gezgin', 'kervan-yol', 'kervan-kum-uzak', 'kervan-kum-orta', 'kervan-piramit', 'kervan-palmiye', 'kervan-vaha', 'kervan-cadir', 'kervan-kaktus', 'kervan-gunes', 'kervan-kartal', 'kervan-fener'];
    const eksik = need.filter((a) => !lib.has(a));
    if (eksik.length) throw new Error(`Kervan modelleri eksik (${eksik.join(', ')}). Önce: npm run seed:hikaye`);
    const ts = (i, f = 0) => (planlar[Math.min(i, n - 1)] ? planlar[Math.min(i, n - 1)].t0 + f : tK);
    const iz = (a) => { const o = []; a.forEach(([t, v, e]) => { if (!o.length || t > o[o.length - 1].t) o.push(k(R2(t), v, e)); }); return o; };
    const sc = (u) => 0.2 + 1.3 * u ** 1.3; // deve ölçeği
    const nokta = (u) => { const m = yolMerkez(u); return { x: m.x, y: Y0 + m.y, w: m.w, s: sc(u) }; };

    // ── yürüyüş programı: u(t) ────────────────────────────────────────────
    const ub = [[0.2, 0.28], [0.28, 0.4], [0.4, 0.52], [0.52, 0.62], [0.62, 0.7], [0.7, 0.94]];
    const kontrol = [];
    planlar.forEach((pl, i) => { const [a, b] = ub[Math.min(i, ub.length - 1)]; kontrol.push([pl.t0 + 0.5, a], [pl.t1 - (i === 4 ? 3.2 : 0.8), b]); });
    const uAt = (t) => {
      if (t <= kontrol[0][0]) return kontrol[0][1];
      for (let i = 0; i < kontrol.length - 1; i++) {
        const [t0, u0] = kontrol[i]; const [t1, u1] = kontrol[i + 1];
        if (t <= t1) { const f = (t - t0) / (t1 - t0); const e = i % 2 === 0 ? 0.5 - 0.5 * Math.cos(Math.PI * f) : f; return u0 + (u1 - u0) * e; }
      }
      return kontrol[kontrol.length - 1][1];
    };
    // örnekler
    const tBas = 0.8; const dt = 0.35;
    const orn = [];
    let fs = 1;
    for (let t = tBas; t <= tK + 0.001; t += dt) {
      const u = uAt(t); const uN = uAt(t + 0.15); const p = nokta(u); const pN = nokta(uN);
      const hiz = (uN - u) / 0.15;
      const yon = (pN.x - p.x) >= 0 ? 1 : -1;
      if (hiz > 0.004) fs += (yon - fs) * Math.min(1, dt / 0.45);
      orn.push({ t, u, ...p, hiz, fs });
    }
    const track = (f, e) => iz(orn.map((o) => [o.t, f(o), e || 'linear']));
    const dur = (o) => o.hiz < 0.004;
    const hareketOp = iz(orn.map((o) => [o.t, dur(o) ? 0 : 1]));
    const durOp = iz(orn.map((o) => [o.t, dur(o) ? 1 : 0]));

    // ── gökyüzü ───────────────────────────────────────────────────────────
    const sunY = iz([[0, 900], [ts(0, 0.5), 880], [ts(0, 6), 600, 'outCubic'], [ts(1, 0), 500, 'inOutSine'], [ts(2, 0), 420], [ts(3, 0), 560, 'inOutSine'], [ts(3, 7), 820, 'inOutSine'], [ts(4, 1), 1060, 'inQuad'], [ts(5, 0), 1060], [ts(5, 5), 700, 'outCubic']]);
    const sunX = iz([[0, 700], [ts(2, 0), 780], [ts(4, 0), 860], [ts(5, 0), 560]]);
    c.L({ id: 'gunes', group: g, asset: 'kervan-gunes', x: sunX, y: sunY, anchor: [0.5, 0.5], scale: 0.9, depth: 0.96, opacity: iz([[0, 1], [ts(4, 2), 1], [ts(4, 5), 0], [ts(5, 0), 0], [ts(5, 2), 1]]) });
    Z.parilti('gunes-isik', 700, 700, 1000, '#ffcf8a', { t0: 0, opacity: 0.4, blur: 90, depth: 0.96, extra: { x: sunX, y: sunY, opacity: iz([[0, 0.4], [ts(3, 7), 0.55], [ts(4, 3), 0.7], [ts(4, 6), 0], [ts(5, 1), 0], [ts(5, 5), 0.5]]) } });
    for (let i = 0; i < 24; i++) {
      Z.ekle({ id: `yildiz-${i}`, group: g, asset: 'yildiz', x: 70 + ((i * 337) % 940), y: 120 + ((i * 197) % 600), scale: R2(0.07 + (i % 4) * 0.03), palette: { a: '#fff2b3' }, depth: 0.98, opacity: iz([[0, 0], [ts(4, 1) + (i % 6) * 0.3, 0.9], [ts(5, 0), 0.9], [ts(5, 3), 0]]), loops: [{ prop: 'opacity', type: 'sine', amp: 0.25, period: 1.6 + (i % 5) * 0.5, phase: i * 0.4 }] });
    }
    Z.ekle({ id: 'ay', group: g, asset: 'fener-ay', x: 280, y: iz([[0, 700], [ts(4, 1), 700], [ts(4, 5), 360, 'outCubic']]), scale: 0.6, depth: 0.97, opacity: iz([[0, 0], [ts(4, 1), 0], [ts(4, 4), 1], [ts(5, 0), 1], [ts(5, 3), 0]]) });
    // bulutlar
    [[120, 330, 1.2], [640, 240, 0.9], [900, 440, 1.0]].forEach(([x, y, s], i) => Z.bulut(`bulut-${i}`, x, x + 120, y, s, 0.4 + i * 0.2, { zaman1: tEnd, depth: 0.9, pal: { a: '#ffffff' }, sira: i % 2 ? 'right' : 'left' }));

    // ── üç renkli çapraz geçiş yardımcısı (gün / akşam / gece) ─────────────
    const pencere = {
      gun: [[0, 1], [ts(3, 2), 1], [ts(3, 6.5), 0], [ts(5, 0.5), 0], [ts(5, 3.5), 1]],
      aksam: [[0, 0], [ts(3, 2), 0], [ts(3, 6.5), 1], [ts(4, 0.5), 1], [ts(4, 3.5), 0], [ts(5, 2), 0], [ts(5, 3), 0.6], [ts(5, 5), 0]],
      gece: [[0, 0], [ts(4, 0.5), 0], [ts(4, 3.5), 1], [ts(5, 0.5), 1], [ts(5, 3.5), 0]],
    };
    const uc = (id, asset, oz, depth, loops) => ['gun', 'aksam', 'gece'].forEach((d) => Z.ekle({ id: `${id}-${d}`, group: g, asset, ...(d === 'gun' ? {} : { variant: d }), ...oz, ...(depth != null ? { depth } : {}), opacity: iz(pencere[d]), ...(loops ? { loops } : {}) }));

    // ── uzak: piramitler, kum tepeleri, serap ────────────────────────────
    uc('piramit', 'kervan-piramit', { x: 230, y: 860, anchor: [0.5, 1], scale: 0.78 }, 0.9);
    uc('kum-uzak', 'kervan-kum-uzak', { x: 540, y: 700, anchor: [0.5, 0], scale: 1.05 }, 0.8, [{ prop: 'x', type: 'sine', amp: 10, period: 8 }]);
    // serap: bölüm 4'te ufukta titreşen vaha
    Z.ekle({ id: 'serap', group: g, asset: 'kervan-vaha', x: 330, y: 880, anchor: [0.5, 1], scale: 0.55, depth: 0.85, blur: 3, opacity: iz([[0, 0], [ts(3, 1), 0], [ts(3, 3), 0.55], [ts(3, 7), 0.5], [ts(3, 9), 0]]), loops: [{ prop: 'x', type: 'sine', amp: 8, period: 0.9 }, { prop: 'scaleY', type: 'sine', amp: 0.06, period: 1.3 }] });
    Z.ekle({ id: 'serap-palmiye', group: g, asset: 'kervan-palmiye', x: 330, y: 870, anchor: [0.5, 1], scale: 0.22, depth: 0.85, blur: 3, opacity: iz([[0, 0], [ts(3, 1), 0], [ts(3, 3), 0.5], [ts(3, 7), 0.45], [ts(3, 9), 0]]), loops: [{ prop: 'x', type: 'sine', amp: 8, period: 0.9 }] });
    uc('kum-orta', 'kervan-kum-orta', { x: 540, y: 790, anchor: [0.5, 0], scale: 1.1 }, 0.55, [{ prop: 'x', type: 'sine', amp: 14, period: 7 }]);
    // ön zemin: yakın kum + dolgu (yolun altındaki boşluğu kapatır)
    uc('kum-yakin', 'kervan-kum-yakin', { x: 540, y: 930, anchor: [0.5, 0], scale: 1.1 }, 0.3, [{ prop: 'x', type: 'sine', amp: 18, period: 6 }]);
    [['gun', '#c4743a'], ['aksam', '#8e5a82'], ['gece', '#1a2547']].forEach(([d, renk]) => c.sekil(`zemin-dolgu-${d}`, 'kare', W / 2, 1860, 200, { t0: 0, renk, giris: 'yok', grup: g, sx: (W * 1.3) / 200, sy: 1100 / 200, extra: { opacity: iz(pencere[d]) } }));
    uc('yol', 'kervan-yol', { x: 540, y: Y0, anchor: [0.5, 0], scale: 1 });

    // ── yol kenarı: yakın kum bandı + objeler (u'ya göre ölçek) ───────────
    const yan = (id, asset, u, taraf, ek, oz = {}) => {
      const p = nokta(u);
      uc(id, asset, { x: Math.round(p.x + taraf * (p.w * 1.5 + 40 * p.s)), y: Math.round(p.y + 4), anchor: [0.5, 1], scale: R2(p.s * ek), ...oz });
    };
    yan('kaktus-1', 'kervan-kaktus', 0.28, -1, 1.3);
    yan('kaktus-2', 'kervan-kaktus', 0.5, 1, 1.5);
    yan('kaktus-3', 'kervan-kaktus', 0.86, -1, 1.5);
    // palmiye + vaha (bölüm 6): ön solda
    const vahaT = ts(5, 0.4);
    Z.ekle({ id: 'vaha', group: g, asset: 'kervan-vaha', x: 200, y: 1790, anchor: [0.5, 1], scale: [k(0, 0), k(vahaT, 0), k(vahaT + 1.6, 1.15, 'outBack')], start: R2(vahaT), fold: iz([[vahaT, 0], [vahaT + 1.6, 1, 'linear']]) });
    [[90, 1730, 0.95], [300, 1700, 0.8]].forEach(([x, y, s], i) => Z.ekle({ id: `palmiye-${i}`, group: g, asset: 'kervan-palmiye', x, y, anchor: [0.5, 1], scale: s, start: R2(vahaT + 0.3 * i), fold: iz([[vahaT + 0.3 * i, 0], [vahaT + 1.8 + 0.3 * i, 1, 'linear']]),
      parts: { yaprakA: { loops: [{ prop: 'rotation', type: 'sine', amp: 4, period: 3.2 + i }] }, yaprakB: { loops: [{ prop: 'rotation', type: 'sine', amp: 4, period: 3.6 + i, phase: 1 }] } } }));
    // çadır + ateş + lamba (bölüm 5, yolun sağında)
    const cp = nokta(0.66);
    const cadirX = Math.round(cp.x + cp.w * 1.7 + 90 * cp.s);
    Z.ekle({ id: 'cadir', group: g, asset: 'kervan-cadir', x: cadirX, y: cp.y + 6, anchor: [0.5, 1], scale: R2(cp.s * 1.15), start: R2(ts(4, -0.5)), variant: 'gece', fold: iz([[ts(4, -0.5), 0], [ts(4, 1.2), 1, 'linear']]), parts: { bayrak: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 0.9 }] } } });
    const ateşX = Math.round(cp.x + cp.w * 1.05);
    Z.ekle({ id: 'ates', group: g, asset: 'ej-alev', x: ateşX, y: cp.y + 20, anchor: [0.5, 1], scale: R2(cp.s * 0.6), start: R2(ts(4, 1)), end: R2(ts(5, 3)), fold: iz([[ts(4, 1), 0], [ts(4, 2), 1, 'linear']]),
      parts: { dis: { loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 0.5 }] }, orta: { loops: [{ prop: 'rotation', type: 'sine', amp: 7, period: 0.37 }] }, ic: { loops: [{ prop: 'scaleY', type: 'sine', amp: 0.1, period: 0.3 }] } } });
    Z.parilti('ates-isik', ateşX, cp.y - 30 * cp.s, 300 * cp.s, '#ffa94d', { t0: ts(4, 1), t1: ts(5, 3.2), opacity: 0, blur: 50, extra: { opacity: iz([[ts(4, 1), 0], [ts(4, 3), 0.6], [ts(5, 0), 0.6], [ts(5, 3), 0]]) }, anims: [{ preset: 'ritimle-nabiz', t: ts(4, 2), genlik: 0.05 }] });
    Z.ekle({ id: 'fener-lamba', group: g, asset: 'kervan-fener', x: cadirX - Math.round(60 * cp.s), y: cp.y - 120 * cp.s, anchor: [0.5, 0], scale: R2(cp.s * 1.1), start: R2(ts(4, 0.5)), end: R2(ts(5, 3)), fold: iz([[ts(4, 0.5), 0], [ts(4, 1.5), 1, 'linear']]), loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 2.4 }] });

    // ── kervan ────────────────────────────────────────────────────────────
    const GENIS = (fn) => iz(orn.map((o) => [o.t, fn(o)]));
    const pw = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) { if (t <= pts[i + 1][0]) { const f = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f; } } return pts[pts.length - 1][1]; };
    const gunW = [[0, 1], [ts(4, 0.5), 1], [ts(4, 3.5), 0], [ts(5, 0.5), 0], [ts(5, 3.5), 1]];
    const geceW = [[0, 0], [ts(4, 0.5), 0], [ts(4, 3.5), 1], [ts(5, 0.5), 1], [ts(5, 3.5), 0]];
    const caravan = (id, asset, { dx = 0, dy = 0, mul = 1, opa, loops, parts }) => {
      [['gun', gunW], ['gece', geceW]].forEach(([d, W2]) => {
        Z.ekle({
          id: `${id}-${d}`, group: g, asset, ...(d === 'gece' ? { variant: 'gece' } : {}), start: R2(tBas), anchor: [0.5, 1],
          x: GENIS((o) => R2(o.x + dx * o.s * mul)), y: GENIS((o) => R2(o.y + dy * o.s * mul)), scale: GENIS((o) => R2(o.s * mul)), scaleX: GENIS((o) => R2(o.fs)),
          opacity: iz(orn.map((o) => [o.t, R2((opa ? opa(o) : 1) * pw(W2, o.t) * Math.min(1, (o.t - tBas) / 0.8))])), ...(loops ? { loops } : {}), ...(parts ? { parts } : {}),
        });
      });
    };
    // gölge
    c.sekil('kervan-golge', 'daire', 540, 1000, 160, { t0: tBas, renk: '#3a2410', opacity: 0.28, giris: 'yok', grup: g, blur: 8, extra: { x: GENIS((o) => o.x), y: GENIS((o) => o.y + 6 * o.s), scale: GENIS((o) => R2(o.s * 1.9)), scaleY: 0.12 } });
    const bacak = (faz) => ({ amp: 16, per: 0.9, faz });
    const dev = (hareket) => ({ bArka1: { loops: [{ prop: 'rotation', type: 'sine', amp: hareket ? 16 : 0, period: 0.9, phase: 0 }] }, bOn1: { loops: [{ prop: 'rotation', type: 'sine', amp: hareket ? 16 : 0, period: 0.9, phase: 0.5 }] }, bArka2: { loops: [{ prop: 'rotation', type: 'sine', amp: hareket ? 16 : 0, period: 0.9, phase: 0.5 }] }, bOn2: { loops: [{ prop: 'rotation', type: 'sine', amp: hareket ? 16 : 0, period: 0.9, phase: 0 }] }, kuyruk: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 1.1 }] } });
    void bacak;
    // hareketli ve durağan deve (gün/gece çiftleri)
    caravan('deve-yuruyen', 'kervan-deve', { opa: (o) => (dur(o) ? 0 : 1), loops: [{ prop: 'y', type: 'sine', amp: 4, period: 0.45 }], parts: dev(true) });
    caravan('deve-duran', 'kervan-deve', { opa: (o) => (dur(o) ? 1 : 0), loops: [{ prop: 'y', type: 'sine', amp: 1.5, period: 2.4 }], parts: dev(false) });
    caravan('gezgin-yuruyen', 'kervan-gezgin', { dx: -170, dy: 6, mul: 0.92, opa: (o) => (dur(o) ? 0 : 1), loops: [{ prop: 'y', type: 'sine', amp: 3, period: 0.45 }], parts: { bacakA: { loops: [{ prop: 'rotation', type: 'sine', amp: 20, period: 0.9 }] }, bacakB: { loops: [{ prop: 'rotation', type: 'sine', amp: 20, period: 0.9, phase: 0.5 }] }, kol: { loops: [{ prop: 'rotation', type: 'sine', amp: 8, period: 0.9 }] } } });
    caravan('gezgin-duran', 'kervan-gezgin', { dx: -170, dy: 6, mul: 0.92, opa: (o) => (dur(o) ? 1 : 0), loops: [{ prop: 'y', type: 'sine', amp: 1, period: 2.2 }], parts: { kol: { loops: [{ prop: 'rotation', type: 'sine', amp: 6, period: 2.2 }] } } });
    void hareketOp; void durOp; void track;

    // ── rüzgâr / kum, kartal ──────────────────────────────────────────────
    c.L({ id: 'ruzgar-kum', group: g, type: 'particles', particle: 'kar', mode: 'surekli', start: R2(ts(1, 0.4)), end: R2(ts(1, 6.8)), count: 140, speed: 5, wind: 900, colors: ['#f0c08a', '#e8a86a', '#fbe0b8'], opacity: 0.8 });
    const kt = ts(2, 0.8);
    Z.ekle({ id: 'kartal', group: g, asset: 'kervan-kartal', start: R2(kt), end: R2(ts(2, 7.2)), x: iz([[kt, -220], [kt + 3.2, 420, 'outCubic'], [ts(2, 5.4), 760, 'inOutSine'], [ts(2, 7.2), 1320, 'inCubic']]), y: iz([[kt, 360], [kt + 3.2, 300, 'inOutSine'], [ts(2, 5.4), 280], [ts(2, 7.2), 150, 'inOutSine']]), scale: 0.9, depth: 0.5,
      loops: [{ prop: 'y', type: 'sine', amp: 14, period: 2.2 }], parts: { kanatSol: { loops: [{ prop: 'rotation', type: 'sine', amp: 10, period: 1.2 }] }, kanatSag: { loops: [{ prop: 'rotation', type: 'sine', amp: -10, period: 1.2 }] } } });

    // ── ışık örtüleri ─────────────────────────────────────────────────────
    const orten = (id, renk, a) => c.L({ id, group: g, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.3) / 200, scaleY: (H * 1.3) / 200, palette: { a: renk }, opacity: iz(a) });
    orten('sicak-orten', '#ff9a5a', [[0, 0.1], [ts(0, 6), 0.0], [ts(3, 5), 0], [ts(3, 8), 0.16], [ts(4, 2), 0.1], [ts(4, 4), 0], [ts(5, 0), 0], [ts(5, 2), 0.14], [ts(5, 6), 0]]);
    orten('gece-orten', '#0a1236', [[0, 0], [ts(4, 0.5), 0], [ts(4, 3.5), 0.28], [ts(5, 0.5), 0.28], [ts(5, 3.5), 0]]);

    // ── yazılar ──────────────────────────────────────────────────────────
    Z.baslikKarti(RENK, { y: 0.17, size: 190, sar: 8, kancaFont: 'Lora', altFont: 'Lora' });
    planlar.forEach((pl, i) => {
      const s = pl.s;
      c.bolum(pl.t0, s.baslik || `Bölüm ${i + 1}`);
      c.L({ id: `bolum-${i}`, group: g, type: 'text', text: (s.baslik || '').toUpperCase(), font: 'Lora', weight: 700, size: 70, color: RENK.yazi, x: W / 2, y: 120, align: 'center', letterSpacing: 18, start: R2(pl.t0 + 0.2), end: R2(pl.t0 + 3.2),
        stroke: { color: RENK.kontur, width: 12 }, shadow: { color: RENK.golge, blur: 0, y: 5 }, opacity: iz([[pl.t0 + 0.2, 0], [pl.t0 + 0.9, 1], [pl.t0 + 2.4, 1], [pl.t0 + 3.2, 0, 'linear']]) });
      Z.altyaziSinema(`altyazi-${i}`, s.altyazi || s.anlatim, pl.t0 + 1.2, pl.t1 - 0.2, { yazi: RENK.yazi, kontur: RENK.kontur, golge: RENK.golge, bant: '#4a2a12' }, { y: 0.165, size: 64, font: 'Lora', sar: 26, bantAlfa: 0.2 });
      Z.ses(pl, pl.t0 + 0.6);
    });
    Z.kapanis({ yazi: RENK.yazi, alt: RENK.alt, golge: RENK.golge }, { perde: 0.45 });

    // ── kamera: kervanı izler ─────────────────────────────────────────────
    const sonO = orn.filter((o) => o.t < tK - 1.4);
    const zoom = iz([[0, 1.12], [4, 1.0, 'inOutCubic'], ...sonO.filter((o, i) => i % 3 === 0).map((o) => [o.t, R2(1 + 0.32 * o.u ** 1.2), 'linear']), [tK + 0.2, 1.0, 'inOutCubic']]);
    const kx = iz([[0, 540], ...sonO.filter((o, i) => i % 3 === 0).map((o) => [o.t, R2(540 + (o.x - 540) * 0.45), 'linear']), [tK + 0.2, 540, 'inOutCubic']]);
    const ky = iz([[0, H / 2 + 100], [4, H / 2, 'inOutCubic'], ...sonO.filter((o, i) => i % 3 === 0).map((o) => [o.t, R2(H / 2 + 300 * o.u ** 1.1), 'linear']), [tK + 0.2, H / 2, 'inOutCubic']]);
    return Z.bitir({
      background: Z.gokyuzu([{ t: 0, bg: GOK.sabah }, { t: ts(1, 0) + 2, bg: GOK.ogle }, { t: ts(3, 6), bg: GOK.aksam }, { t: ts(4, 3), bg: GOK.gece }, { t: ts(5, 1) + 1.5, bg: GOK.safak }], { sure: 2.8, vinyet: 0.26, kagit: 0.35 }),
      camera: { zoom, x: kx, y: ky },
    }, RENK);
  },
};
