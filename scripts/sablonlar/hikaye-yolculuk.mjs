// Hikâye · YOLCULUK: yatay kayan katmanlı manzara. Kamera sağa doğru kesintisiz ilerler; uzak dağlar, tepeler, ağaçlar, laleler
// farklı hızlarda (paralaks) akar; kahraman (tilki) ekranın solunda yürür. Her bölüm yol kenarındaki bir TABELA ile başlar, anlatım altyazı olur.
// Gökyüzü yolculuk boyunca şafaktan geceye döner, güneş batar, ay ve yıldızlar çıkar. Yolculuk / keşif / büyüme hikâyeleri için.
// Hikâye: brief.hikaye = [{ baslik, anlatim, altyazi?, ses? }] (anlatım → anlatim.txt → npm run seslendir)
import { hikayeKur, GOKYUZU, R2 } from './hikaye-ortak.mjs';

export default {
  id: 'hikaye-yolculuk',
  ad: 'Hikâye · Yolculuk (yatay paralaks)',
  etiket: 'Hikâye · Yolculuk · Yatay kaydırma',
  sure: '45–90 sn',
  aciklama: 'Kamera sağa doğru kesintisiz ilerler; dağlar, tepeler, ağaçlar ve laleler paralaksla akar, kahraman yürür. Her bölüm bir yol tabelasıyla başlar; gökyüzü şafaktan geceye döner. Yolculuk ve keşif hikâyeleri için.',
  ornek: {
    sablon: 'hikaye-yolculuk', id: 'sablon-hikaye-yolculuk', ad: 'Küçük Tilkinin Yolculuğu', format: 'reels', muzik: 'lofi-90', font: 'Baloo 2', kahraman: 'tilki',
    baslik: 'Küçük Tilkinin Yolculuğu', altBaslik: 'dağların ardındaki deniz',
    hikaye: [
      { baslik: 'Sabah', anlatim: 'Güneş doğarken küçük tilki yuvasından çıktı. Bugün, dağların ardındaki denizi görmeye karar vermişti.', altyazi: 'Küçük tilki yuvasından çıktı.' },
      { baslik: 'Çam ormanı', anlatim: 'Önce yüksek çam ağaçlarının arasından geçti. Rüzgâr yapraklarla fısıldaşıyor, kelebekler ona yol gösteriyordu.', altyazi: 'Kelebekler ona yol gösterdi.' },
      { baslik: 'Çiçek vadisi', anlatim: 'Sonra rengârenk laleler açmış bir vadiye vardı. Kokuları o kadar güzeldi ki bir an durup derin bir nefes aldı.', altyazi: 'Laleler ne kadar güzel kokuyordu!' },
      { baslik: 'Turnalar', anlatim: 'Gökyüzünde turnalar süzülüyordu. Tilki onlara el salladı ve denize doğru mu gittiklerini sordu.', altyazi: '"Denize mi gidiyorsunuz?"' },
      { baslik: 'Akşam', anlatim: 'Güneş batarken tepelerin ardında mavi bir çizgi belirdi. Deniz! Tilkinin kalbi heyecanla çarptı.', altyazi: 'Deniz! Sonunda deniz!' },
      { baslik: 'Gece', anlatim: 'Gece, yıldızların altında dalgaları dinledi. Yolculuk uzundu ama her adımına değmişti.', altyazi: 'Her adımına değmişti.' },
    ],
    son: 'Yolculuk içimizde başlar', soru: 'Sen hangi yola çıkardın?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Küçük Tilkinin Yolculuğu: dağların ardındaki deniz', aciklama: 'Kâğıttan katmanlı bir manzarada küçük tilkinin denize yolculuğu. Sen hangi yola çıkardın?', etiketler: ['masal', 'hikaye', 'tilki', 'yolculuk', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-yolculuk', { palet: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2', stil: brief.stil || 'origami' }, { kapakBeats: 8, kapSure: 10, minSn: 6.2 });
    const { c, W, H, k, fx, fy, lib, planlar, n, tAc, tK, tEnd, g } = Z;
    const KAHRAMAN = lib.has(brief.kahraman) ? brief.kahraman : 'tilki';
    const tS = tAc - 0.4; // kamera hareketinin başlangıcı
    const Dx = Math.round(n * W * 0.92);
    const camX = (t) => W / 2 + Dx * Math.max(0, Math.min(1, (t - tS) / (tK - tS)));
    const TAHTA = { yazi: '#2c3a4b', kutu: 'rgba(255,255,255,0.82)', alt: '#4a5a6c', golge: 'rgba(0,0,0,0.25)' };
    const sg = GOKYUZU;

    // ── gökyüzü: şafak → gündüz → akşam → gece ────────────────────────────
    const at = (f) => planlar[Math.min(n - 1, Math.round(f * (n - 1)))].t0;
    const gok = Z.gokyuzu([{ t: 0, bg: sg.safak.bg }, { t: at(0.25), bg: sg.gunduz.bg }, { t: at(0.62), bg: sg.aksam.bg }, { t: at(0.88), bg: sg.gece.bg }], { sure: 2.2 });

    // güneş: kamerayla neredeyse sabit (çok uzak), yavaşça batar; ay + yıldızlar sonda doğar
    const gy0 = 560 * fy;
    c.L({ id: 'gunes', group: g, asset: 'gunes', depth: 0.96, x: camX(0) + 250 * fx, scale: R2(1.6 * fx), ...Z.fold(0.3, 1.3),
      y: [k(0, gy0), k(at(0.25), 430 * fy, 'inOutSine'), k(at(0.7), 900 * fy, 'inOutSine'), k(at(0.85), 1250 * fy, 'inQuad')], opacity: [k(at(0.8), 1), k(at(0.88), 0, 'linear')] });
    // bulutlar (uzak, yavaş)
    for (let i = 0; i < 8; i++) Z.bulut(`bulut-${i}`, 100 + i * 760, 40 + i * 760, 420 + (i % 3) * 140, 1.0 + (i % 2) * 0.4, 0.6 + i * 0.1, { depth: 0.8, pal: i % 2 ? { a: '#ffffff' } : undefined });

    // ── paralaks katmanlar ────────────────────────────────────────────────
    const seri = (ad, asset, y, s, pal, depth, aralik, boyU, sayiOfs = 0) => {
      const f = 1 - depth;
      const bas = -boyU;
      const bit = W + boyU + Dx * f;
      let q = 0;
      for (let x = bas; x < bit; x += aralik) {
        Z.bant(`${ad}-${q}`, asset, y + ((q * 37) % 40) - 20, s, pal, { x: x + (q % 2) * 90 + sayiOfs, depth, amp: 0, sabit: true });
        q++;
      }
    };
    seri('dag-uzak', 'dag', 960, 3.9, { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' }, 0.75, 760, 600);
    seri('dag-orta', 'dag', 1070, 3.4, { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' }, 0.6, 700, 560, 200);
    seri('tepe-1', 'tepeler', 1170, 3.1, { a: '#a9d28b', b: '#8fc274' }, 0.42, 940, 620);
    seri('tepe-2', 'tepeler', 1330, 3.4, { a: '#8fc274', b: '#74ab5c' }, 0.25, 1000, 640, 300);
    // ağaçlar (orta düzlem)
    for (let i = 0; i < 16; i++) {
      const dpt = 0.25;
      Z.hayvan(`agac-${i}`, 'cam-agaci', 140 + i * 520 * (1 - dpt) + (i % 3) * 60, 1420 + (i % 2) * 30, 1.5 + (i % 3) * 0.2, 0.4 + i * 0.05, { sabit: true, depth: dpt, ek: { fold: [k(0.4, 0), k(1.4, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 1.5, period: 3.4 + (i % 3) * 0.4, phase: i * 0.4 }] } });
    }
    seri('tepe-zemin', 'tepeler', 1520, 3.8, { a: '#74ab5c', b: '#5e9449' }, 0.05, 1480, 700);
    // ön plan laleleri (kameradan hızlı)
    for (let i = 0; i < 27; i++) {
      Z.hayvan(`lale-${i}`, 'lale', 100 + i * 330 + ((i * 53) % 90), 1810 + (i % 3) * 18, 1.2 + (i % 4) * 0.15, 0.6, { sabit: true, depth: -0.15, variant: i % 3 === 1 ? 'sari' : i % 3 === 2 ? 'mor' : undefined, ek: { loops: [{ prop: 'rotation', type: 'sine', amp: 3, period: 2.4 + (i % 3) * 0.3, phase: i * 0.5 }] } });
    }
    // kuşlar / kelebekler (dünyada belirli yerlerde)
    for (let i = 0; i < Math.max(3, n); i++) {
      const x0 = W * 0.6 + i * Dx / Math.max(1, n) * 0.9;
      const tur = i % 3;
      Z.ekle({ id: `ucan-${i}`, group: g, asset: tur === 1 ? 'turna' : 'kelebek', depth: tur === 1 ? 0.4 : 0.1, x: [k(0, x0), k(tEnd, x0 + 900 * fx, 'linear')], y: (tur === 1 ? 560 : 1500) * fy, scale: R2((tur === 1 ? 0.8 : 0.55) * fx),
        loops: [{ prop: 'y', type: 'sine', amp: tur === 1 ? 24 : 40, period: tur === 1 ? 3 : 1.4, phase: i }], ...Z.kanat(tur === 1 ? 'turna' : 'kelebek', 0.5, i * 0.3) });
    }

    // ışık örtüleri: akşam turuncu, gece lacivert (kameraya bağlı büyük dikdörtgenler)
    const orten = (id, renk, noktalar) => c.L({ id, group: g, asset: 'kare', x: [k(0, camX(0)), k(tS, camX(tS), 'linear'), k(tK, camX(tK), 'linear')], y: H / 2, scale: 1, scaleX: (W * 1.5) / 200, scaleY: (H * 1.3) / 200, palette: { a: renk }, opacity: noktalar });
    orten('isik-aksam', '#ff7a3d', [k(at(0.4), 0), k(at(0.62), 0.16, 'inOutSine'), k(at(0.82), 0.1, 'inOutSine'), k(at(0.9), 0, 'linear')]);
    orten('isik-gece', '#0a1036', [k(at(0.7), 0), k(at(0.92), 0.42, 'inOutSine')]);

    // ay + yıldızlar örtünün üstünde parlak kalsın
    c.L({ id: 'ay', group: g, asset: 'hilal', depth: 0.96, x: camX(0) + 280 * fx, scale: R2(1.7 * fx), y: [k(0, 1300 * fy), k(at(0.78), 1300 * fy, 'linear'), k(at(0.95), 520 * fy, 'outSine')], opacity: [k(at(0.78), 0), k(at(0.92), 1, 'linear')] });
    for (let i = 0; i < 12; i++) {
      c.L({ id: `yildiz-${i}`, group: g, asset: 'yildiz', depth: 0.93, x: camX(0) + (60 + ((i * 331) % 960)) * fx, y: (200 + ((i * 197) % 650)) * fy, scale: R2((0.16 + (i % 3) * 0.06) * fx), palette: { a: '#fff2b3' },
        opacity: [k(at(0.75), 0), k(at(0.9) + i * 0.1, 0.9, 'linear')], loops: [{ prop: 'opacity', type: 'sine', amp: 0.3, period: 1.6 + (i % 4) * 0.5, phase: i * 0.3 }] });
    }
    // ── kahraman: ekranın solunda yürür (kamerayla birlikte) ──────────────
    const hx = W * 0.28;
    Z.ekle({ id: 'kahraman', group: g, asset: KAHRAMAN, start: 0.5, x: [k(0, hx), k(tS, hx, 'linear'), k(tK, hx + Dx, 'linear')], y: [k(0.5, 2150 * fy), k(1.5, 1735 * fy, 'outBack')], anchor: [0.5, 1], scale: R2(1.5 * fx),
      loops: [{ prop: 'y', type: 'sine', amp: 8, period: 0.62 }, { prop: 'rotation', type: 'sine', amp: 3, period: 1.24 }], ...Z.kanat(KAHRAMAN, 0.5) });
    // ekrana bağlı yardımcı: [t0,t1] aralığında kameraya sabit x
    const ekranX = (t0, t1, dx = 0) => [k(t0, camX(t0) + dx), k(t1, camX(t1) + dx, 'linear')];

    Z.acilis({ yazi: sg.safak.yazi, alt: sg.safak.alt, golge: sg.safak.golge }, { y: 0.12 });

    // ── bölümler: tabela + altyazı ───────────────────────────────────────
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = pl.t0;
      const t1 = pl.t1;
      c.bolum(t0, s.baslik || `Bölüm ${i + 1}`);
      // tabela: yolun sağında dikilir, kahraman yanından geçer
      const xT = camX(t0 + 0.9) + W * 0.34;
      const yT = 1590 * fy;
      c.sekil(`tabela-direk-${i}`, 'kare', xT, yT - 60, 200, { t0: t0 + 0.2, renk: '#8a5a3a', giris: 'yok', sx: 22 / 200, sy: 300 / 200, grup: g, extra: { anchor: [0.5, 0], y: yT - 20, scaleY: [k(t0 + 0.2, 0), k(t0 + 0.8, 300 / 200, 'outBack')] } });
      c.sekil(`tabela-levha-${i}`, 'kart', xT, yT - 250, 400, { t0: t0 + 0.5, renk: '#c58a54', grup: g, sx: 0.88, sy: 0.42, sure: 0.5, extra: { rotation: [k(t0 + 0.5, -12), k(t0 + 1.0, ((i % 2) * 2 - 1) * 3, 'outBack')] } });
      c.L({ id: `tabela-yazi-${i}`, group: g, type: 'text', text: s.baslik || `Bölüm ${i + 1}`, font: Z.font, weight: 700, size: 58, color: '#fff6e4', x: xT, y: yT - 252, align: 'center', start: R2(t0 + 0.6),
        reveal: [k(t0 + 0.7, 0), k(t0 + 1.3, 1, 'linear')], shadow: { color: 'rgba(60,30,10,0.4)', blur: 0, y: 3 }, rotation: ((i % 2) * 2 - 1) * 3 });
      // altyazı (ekrana bağlı)
      Z.altyazi(`altyazi-${i}`, s.altyazi || s.anlatim, t0 + 0.6, t1 - 0.2, TAHTA, { y: 0.115, ek: { x: ekranX(t0 + 0.6, t1 - 0.2) } });
      Z.ses(pl, t0 + 0.3);
    });

    // kapanış: kamera durur, perde iner (ekrana bağlı değil: kamera tK'da durduğu için sabit)
    const camSon = camX(tK);
    Z.kapanis(TAHTA, { perde: 0.55 });
    // kapanış katmanları dünya koordinatında: kamera konumuna kaydır
    c.layers.filter((l) => /^kapanis-|^takip-/.test(l.id)).forEach((l) => { if (typeof l.x === 'number') l.x = Math.round(l.x + camSon - W / 2); });

    return Z.bitir({
      background: gok,
      camera: { zoom: [k(0, 1.15), k(3.5, 1, 'inOutCubic')], x: [k(0, W / 2), k(tS, W / 2, 'linear'), k(tK, W / 2 + Dx, 'linear')], y: [k(0, R2(H / 2 + 120 * fy)), k(3.5, H / 2, 'inOutCubic')] },
    }, { yazi: sg.gunduz.yazi, alt: sg.gunduz.alt });
  },
};
