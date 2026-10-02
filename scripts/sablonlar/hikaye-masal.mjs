// Hikâye · MASAL (diyalog): sabit, katmanlı bir manzarada İKİ KARAKTER konuşur. Her replik konuşma balonunda belirir (kuyruk konuşana bakar),
// konuşan zıplar, dinleyen tepki verir (kalp / şaşkınlık / üzüntü), kamera konuşana doğru hafifçe kayar. Anlatıcı satırları üstte kitap yazısı olur.
// Satır başına `sahne` verilirse gökyüzü ve ışık değişir (gündüz → akşam). Fabl, masal, diyalog, "iki kişilik" hikâyeler için (örnek: Tilki ile Turna).
// Hikâye: brief.hikaye = [{ kim: 'a'|'b'|'anlatici', soz, duygu?: 'sevinc'|'saskin'|'uzgun', sahne?: 'gunduz'|'aksam'|'gece', nesne?: 'fincan'|'cezve'|…, ses? }]
//   brief.karakterA / karakterB = kütüphane hayvanı (varsayılan tilki / turna), brief.adA / adB = ad etiketleri.
import { hikayeKur, GOKYUZU, R2 } from './hikaye-ortak.mjs';
import { sarMetin, sigdirFont } from './reels.mjs';

export default {
  id: 'hikaye-masal',
  ad: 'Hikâye · Masal (iki karakter diyalogu)',
  etiket: 'Hikâye · Diyalog · Fabl · Konuşma balonları',
  sure: '50–100 sn',
  aciklama: 'Katmanlı manzarada iki hayvan konuşur: replikler konuşma balonlarında belirir, konuşan zıplar, dinleyen tepki verir, kamera konuşana kayar. Anlatıcı satırları üstte; gündüz → akşam geçişi. Fabl ve masal diyalogları için (örnek: Tilki ile Turna).',
  ornek: {
    sablon: 'hikaye-masal', id: 'sablon-hikaye-masal', ad: 'Tilki ile Turna', format: 'reels', muzik: 'lofi-90', font: 'Baloo 2', karakterA: 'tilki', karakterB: 'turna', adA: 'Tilki', adB: 'Turna',
    baslik: 'Tilki ile Turna', altBaslik: 'bir fabl',
    hikaye: [
      { kim: 'anlatici', soz: 'Bir gün tilki, turnayı yemeğe davet etmek istedi.' },
      { kim: 'a', soz: 'Sevgili Turna Hanım, bu akşam bana yemeğe gelir misin?', duygu: 'sevinc' },
      { kim: 'b', soz: 'Elbette Tilki Kardeş, çok memnun olurum!', duygu: 'sevinc' },
      { kim: 'anlatici', soz: 'Tilki çorbayı geniş ve yassı bir tabağa doldurdu.', nesne: 'fincan' },
      { kim: 'a', soz: 'Afiyet olsun! Çok lezzetli bir çorba!' },
      { kim: 'b', soz: 'Ama... gagam bu yassı tabağa sığmıyor ki...', duygu: 'saskin' },
      { kim: 'anlatici', soz: 'Turna aç kaldı, tilki ise çorbanın hepsini yaladı.' },
      { kim: 'b', soz: 'Tilki Kardeş, yarın akşam da sen bana gel. Ben de seni ağırlayayım.', sahne: 'aksam' },
      { kim: 'anlatici', soz: 'Ertesi akşam turna yemeği uzun boyunlu dar bir kaba koydu.', nesne: 'cezve', sahne: 'aksam' },
      { kim: 'a', soz: 'Hımm... burnum bu kaba girmiyor.', duygu: 'uzgun', sahne: 'aksam' },
      { kim: 'b', soz: 'Afiyet olsun Tilki Kardeş! Bana yaptığını sana da yaptım.', sahne: 'aksam' },
      { kim: 'anlatici', soz: 'Tilki çok utandı ve bir daha kimseye oyun etmedi.', sahne: 'aksam' },
    ],
    son: 'Kime nasıl davranırsan öyle davranılır', soru: 'Sence tilki dersini aldı mı?', cta: 'Yorumlara yaz!',
    yayin: { baslik: 'Tilki ile Turna: bir fabl', aciklama: 'Katmanlı kâğıt manzarada Tilki ile Turna\'nın meşhur masalı. Sence tilki dersini aldı mı?', etiketler: ['fabl', 'masal', 'tilki', 'turna', 'hikaye', 'animasyon', 'reels', 'shorts', 'cocuk'] },
  },
  uret(brief) {
    const Z = hikayeKur(brief, 'hikaye-masal', { palet: 'okyanus', muzik: 'lofi-90', font: 'Baloo 2', stil: brief.stil || 'origami' }, { kapakBeats: 8, kapSure: 12, minSn: 4.4, maks: 14 });
    const { c, W, H, k, fx, fy, lib, planlar, n, tAc, tK, tEnd, g } = Z;
    const sg = GOKYUZU;
    const A = lib.has(brief.karakterA) ? brief.karakterA : 'tilki';
    const B = lib.has(brief.karakterB) ? brief.karakterB : 'turna';
    const adA = brief.adA || 'A';
    const adB = brief.adB || 'B';
    const TAHTA = { yazi: '#2c3a47', kutu: 'rgba(255,253,247,0.88)', alt: '#4a5a6c', golge: 'rgba(0,0,0,0.25)' };
    const sahneBg = { gunduz: sg.gunduz.bg, aksam: sg.aksam.bg, gece: sg.gece.bg };
    const XA = 250;
    const XB = 850;
    const YA = 1745;
    const YB = 1600;

    // ── gökyüzü: satırların `sahne` alanına göre ──────────────────────────
    const noktalar = [{ t: 0, bg: sahneBg.gunduz }];
    let son = 'gunduz';
    planlar.forEach((pl) => {
      const sh = pl.s.sahne || son;
      if (sh !== son) { noktalar.push({ t: pl.t0 + 0.3, bg: sahneBg[sh] || sahneBg.gunduz }); son = sh; }
    });
    const gok = Z.gokyuzu(noktalar, { sure: 2.4 });
    const aksamIdx = planlar.findIndex((pl) => pl.s.sahne === 'aksam');
    const geceIdx = planlar.findIndex((pl) => pl.s.sahne === 'gece');

    // ── manzara (sabit) ───────────────────────────────────────────────────
    const gunesY = aksamIdx >= 0 ? [k(0, 520 * fy), k(planlar[aksamIdx].t0 + 0.3, 520 * fy, 'linear'), k(planlar[aksamIdx].t0 + 3, 960 * fy, 'inOutSine')] : 520 * fy;
    Z.ekle({ id: 'gunes', group: g, asset: 'gunes', x: 790 * fx, y: gunesY, scale: R2(1.5 * fx), ...Z.fold(0.3, 1.3), loops: [{ prop: 'rotation', type: 'sine', amp: 5, period: 8 }] });
    Z.bulut('bulut-1', 200, 330, 430, 1.2, 0.6, { zaman1: tEnd });
    Z.bulut('bulut-2', 920, 800, 690, 0.8, 0.9, { sira: 'right', zaman1: tEnd });
    Z.bant('dag-1', 'dag', 980, 3.9, { a: '#b8c9e0', b: '#9fb4d0', c: '#ffffff' }, { x: 360, amp: 10, per: 7, n: 0 });
    Z.bant('dag-2', 'dag', 1060, 3.6, { a: '#9db7d1', b: '#7f9cbc', c: '#f3f7fb' }, { x: 760, amp: 14, per: 6, n: 1 });
    Z.bant('tepe-1', 'tepeler', 1180, 3.1, { a: '#a9d28b', b: '#8fc274' }, { x: 540, amp: 18, per: 6, n: 2 });
    Z.bant('tepe-2', 'tepeler', 1330, 3.4, { a: '#8fc274', b: '#74ab5c' }, { x: 420, amp: 24, per: 5.5, n: 3 });
    Z.hayvan('agac-1', 'cam-agaci', 90, 1390, 1.5, 2.2, { sabit: true, ek: { fold: [k(2.2, 0), k(3.3, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.4 }] } });
    Z.hayvan('agac-2', 'cam-agaci', 990, 1410, 1.7, 2.5, { sabit: true, ek: { fold: [k(2.5, 0), k(3.6, 1, 'linear')], loops: [{ prop: 'rotation', type: 'sine', amp: 2, period: 3.8, phase: 0.4 }] } });
    Z.bant('tepe-3', 'tepeler', 1520, 3.8, { a: '#74ab5c', b: '#5e9449' }, { x: 600, amp: 30, per: 5, n: 4 });
    // masa
    c.sekil('masa-ust', 'kare', W / 2, 1585, 200, { t0: 3.0, renk: '#a8744a', giris: 'yok', grup: g, sx: 400 / 200, sy: 34 / 200, extra: { y: [k(3.0, 1900 * fy), k(3.8, 1585 * fy, 'outBack')] } });
    [-160, 160].forEach((dx, q) => c.sekil(`masa-ayak-${q}`, 'kare', W / 2 + dx, 1665, 200, { t0: 3.1, renk: '#8a5c38', giris: 'yok', grup: g, sx: 28 / 200, sy: 130 / 200, extra: { y: [k(3.1, 1980 * fy), k(3.9, 1665 * fy, 'outBack')] } }));
    // akşam ışığı
    if (aksamIdx >= 0) c.L({ id: 'isik-aksam', group: g, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.3) / 200, scaleY: (H * 1.3) / 200, palette: { a: '#ff7a3d' }, opacity: [k(0, 0), k(planlar[aksamIdx].t0 + 0.3, 0, 'linear'), k(planlar[aksamIdx].t0 + 3, 0.16, 'inOutSine')] });
    if (geceIdx >= 0) c.L({ id: 'isik-gece', group: g, asset: 'kare', x: W / 2, y: H / 2, scale: 1, scaleX: (W * 1.3) / 200, scaleY: (H * 1.3) / 200, palette: { a: '#0a1036' }, opacity: [k(0, 0), k(planlar[geceIdx].t0 + 0.3, 0, 'linear'), k(planlar[geceIdx].t0 + 3, 0.4, 'inOutSine')] });

    // ── karakterler: konuşana zıplama izi ─────────────────────────────────
    const iz = (kim, taban) => {
      const y = [k(0, (taban + 420) * fy)];
      const r = [k(0, 0)];
      y.push(k(2.6, (taban + 420) * fy, 'linear'), k(3.6, taban * fy, 'outBack'));
      planlar.forEach((pl) => {
        if (pl.s.kim !== kim) return;
        y.push(k(pl.t0 + 0.1, taban * fy, 'linear'), k(pl.t0 + 0.28, (taban - 34) * fy, 'outQuad'), k(pl.t0 + 0.5, taban * fy, 'inQuad'));
        r.push(k(pl.t0 + 0.1, 0, 'linear'), k(pl.t0 + 0.3, kim === 'a' ? -4 : 4, 'inOutSine'), k(pl.t0 + 0.8, 0, 'inOutSine'));
      });
      const f = (a) => a.filter((e, q, arr) => !q || e.t > arr[q - 1].t);
      return { y: f(y), r: f(r) };
    };
    const ia = iz('a', YA);
    const ib = iz('b', YB);
    Z.ekle({ id: 'karakter-a', group: g, asset: A, start: 2.6, x: XA * fx, y: ia.y, rotation: ia.r, anchor: [0.5, 1], scale: R2(1.9 * fx), ...Z.kanat(A, 0.5), parts: { tail: { loops: [{ prop: 'rotation', type: 'sine', amp: 12, period: 1.1 }] } } });
    Z.ekle({ id: 'karakter-b', group: g, asset: B, start: 2.6, x: XB * fx, y: ib.y, rotation: ib.r, anchor: [0.5, 1], scale: R2(1.45 * fx), scaleX: -R2(1.45 * fx), ...Z.kanat(B, 1.1), loops: [{ prop: 'y', type: 'sine', amp: 12, period: 2.4 }] });
    [[adA, XA, YA], [adB, XB, YB]].forEach(([ad, x, y], q) => c.L({ id: `ad-${q}`, group: g, type: 'text', text: ad, font: Z.font, weight: 700, size: 46, color: '#ffffff', x: x * fx, y: Math.round((y + 70) * fy), align: 'center', start: 3.6,
      box: { color: q ? '#3a7ca5' : '#d9622b', radius: 999, shadow: false, padding: [4, 26] }, scale: [k(3.6, 0.6), k(4.1, 1, 'outBack')] }));

    // ── replikler ─────────────────────────────────────────────────────────
    const yuvarlak = (id, cx, cy, w, h, r, renk, t0, t1) => {
      const o = { t0, t1, renk, giris: 'yok', grup: g };
      c.sekil(`${id}-a`, 'kare', cx, cy, 200, { ...o, sx: (w - 2 * r) / 200, sy: h / 200 });
      c.sekil(`${id}-b`, 'kare', cx, cy, 200, { ...o, sx: w / 200, sy: (h - 2 * r) / 200 });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], q) => c.sekil(`${id}-c${q}`, 'daire', cx + dx * (w / 2 - r), cy + dy * (h / 2 - r), r * 2, o));
    };
    let eskiNesne = null;
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = pl.t0;
      const t1 = pl.t1;
      const kim = s.kim === 'a' || s.kim === 'b' ? s.kim : 'anlatici';
      c.bolum(t0, `${i + 1}. ${kim === 'anlatici' ? 'Anlatıcı' : kim === 'a' ? adA : adB}`);
      if (kim === 'anlatici') {
        Z.altyazi(`anlatici-${i}`, s.soz, t0 + 0.2, t1 - 0.1, { ...TAHTA, kutu: 'rgba(255,248,230,0.9)' }, { y: 0.095, sar: 24, size: 56, ek: { font: Z.font, weight: 600 } });
      } else {
        const size = 56;
        const sm = sarMetin(s.soz, 22);
        const satir = sm.split('\n');
        const enUzun = Math.max(...satir.map((l) => l.length));
        const bw = Math.min(W * 0.84, enUzun * size * 0.5 + 90);
        const bh = satir.length * size * 1.15 + 66;
        const konX = (kim === 'a' ? XA : XB) * fx;
        const bx = Math.max(bw / 2 + 36, Math.min(W - bw / 2 - 36, konX + (kim === 'a' ? 160 : -160)));
        const by = 1110;
        yuvarlak(`balon-g-${i}`, bx + 8, by + 10, bw, bh, 36, '#000000', t0 + 0.1, t1 - 0.05);
        yuvarlak(`balon-${i}`, bx, by, bw, bh, 36, kim === 'a' ? '#fff3e6' : '#e8f4ff', t0 + 0.1, t1 - 0.05);
        c.sekil(`balon-kuyruk-${i}`, 'ucgen', Math.max(bx - bw / 2 + 60, Math.min(bx + bw / 2 - 60, konX)), by + bh / 2 + 14, 54, { t0: t0 + 0.1, t1: t1 - 0.05, renk: kim === 'a' ? '#fff3e6' : '#e8f4ff', giris: 'yok', grup: g, rot: 180 });
        c.L({ id: `balon-yazi-${i}`, group: g, type: 'text', text: sm, font: Z.font, weight: 600, size: sigdirFont(sm, Z.font, bw - 70, size, false), color: '#2c3a47', x: Math.round(bx), y: by, align: 'center', lineHeight: 1.12, start: R2(t0 + 0.2), end: R2(t1 - 0.05),
          reveal: [k(t0 + 0.25, 0), k(t0 + 0.25 + Math.min(2.4, 0.07 * s.soz.length), 1, 'linear')] });
        // dinleyen/konuşan duygusu (kalp / şaşkınlık / üzüntü)
        const dx = kim === 'a' ? XA : XB;
        const dy = (kim === 'a' ? YA : YB) - 430;
        if (s.duygu === 'sevinc') c.sekil(`duygu-${i}`, 'kalp', dx + 90, dy, 56, { t0: t0 + 0.6, t1: t0 + 2.2, renk: '#ff4d6d', grup: g, sure: 0.3, extra: { y: [k(t0 + 0.6, dy), k(t0 + 2.2, dy - 90, 'linear')], opacity: [k(t0 + 0.6, 1), k(t0 + 2.0, 1, 'linear'), k(t0 + 2.2, 0, 'linear')] } });
        else if (s.duygu === 'saskin' || s.duygu === 'uzgun') c.L({ id: `duygu-${i}`, group: g, type: 'text', text: s.duygu === 'saskin' ? '!?' : '...', font: Z.font, weight: 800, size: 90, color: s.duygu === 'saskin' ? '#e63946' : '#4a6fa5', x: dx + 100, y: dy,
          start: R2(t0 + 0.5), end: R2(t0 + 2.4), stroke: { color: '#ffffff', width: 10 }, scale: [k(t0 + 0.5, 0.3), k(t0 + 0.85, 1.1, 'outBack'), k(t0 + 1.0, 1, 'linear')], rotation: s.duygu === 'saskin' ? 8 : -6 });
      }
      // masadaki nesne
      if (s.nesne && s.nesne !== eskiNesne && lib.has(s.nesne)) {
        Z.hayvan(`masa-nesne-${i}`, s.nesne, 540, 1580, 1.3, t0 + 0.4, { sabit: true, ek: { fold: [k(t0 + 0.4, 0), k(t0 + 1.2, 1, 'linear')] } });
        eskiNesne = s.nesne;
        c.layers[c.layers.length - 1].end = R2(tK);
      }
      Z.ses(pl, t0 + 0.3);
    });
    // masa nesneleri bir sonraki nesneye kadar
    const nes = c.layers.filter((l) => /^masa-nesne-/.test(l.id));
    nes.forEach((l, q) => { l.end = R2(nes[q + 1] ? Number(nes[q + 1].start) : tK); });

    // ── kamera: konuşana kayar ────────────────────────────────────────────
    const camX = [k(0, W / 2)];
    planlar.forEach((pl) => {
      const hedef = pl.s.kim === 'a' ? W / 2 - 70 : pl.s.kim === 'b' ? W / 2 + 70 : W / 2;
      camX.push(k(pl.t0 + 0.1, camX[camX.length - 1].v, 'linear'), k(pl.t0 + 0.9, hedef, 'inOutSine'));
    });
    const camXs = camX.filter((e, q, arr) => !q || e.t > arr[q - 1].t);

    Z.acilis({ yazi: sg.gunduz.yazi, alt: sg.gunduz.alt, golge: sg.gunduz.golge }, { y: 0.14 });
    Z.kapanis(TAHTA, { perde: 0.5 });
    return Z.bitir({
      background: gok,
      camera: { zoom: [k(0, 1.15), k(3.5, 1, 'inOutCubic'), k(tK, 1.06, 'linear')], x: camXs, y: [k(0, R2(H / 2 + 120 * fy)), k(3.5, H / 2, 'inOutCubic')] },
    }, { yazi: sg.gunduz.yazi, alt: sg.gunduz.alt });
  },
};
