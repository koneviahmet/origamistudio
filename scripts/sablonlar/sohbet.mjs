// Mesajlaşma hikâyesi: yazıyor… göstergesi → balon vuruşla pat diye çıkar → sohbet yukarı kayar. Dedikodu / diyalog / "bak ne dedi" formatı.
import { gerekli } from './lib.mjs';
import { reels, sarMetin, yaziRengi } from './reels.mjs';

const kelimeSay = (t) => String(t).split(/\s+/).filter(Boolean).length;
const R2 = (n) => Math.round(n * 100) / 100;

export default {
  id: 'sohbet',
  ad: 'Mesajlaşma hikâyesi',
  etiket: 'Hikâye · Diyalog',
  sure: '15–40 sn',
  aciklama: 'İki kişilik sohbet: "yazıyor…" göstergesi, vuruşla pat diye çıkan balonlar, kayan ekran, sonda tepkiler. Hikâye anlatma / diyalog / espri videoları için.',
  ornek: {
    sablon: 'sohbet', id: 'sablon-sohbet', ad: 'Sınav Sabahı', format: 'reels', palet: 'gunbatimi', muzik: 'pop-120', font: 'Anton',
    kisiA: 'Ece', kisiB: 'Can',
    mesajlar: [
      { kim: 'a', metin: 'Can, sınav kaçta başlıyor?' },
      { kim: 'b', metin: 'Dokuzda. Neden?' },
      { kim: 'a', metin: 'Saat şu an 9.20 😅' },
      { kim: 'b', metin: 'NE?! Hemen çıkıyorum!!' },
      { kim: 'a', metin: 'Şaka şaka, 7.20 daha 😂' },
      { kim: 'b', metin: 'Seni görünce konuşuruz.' },
    ],
    tepkiler: ['😂|128', '❤️|64', '😱|31'],
    cta: 'Devamı yorumlarda',
    yayin: { baslik: 'Sınav sabahı mesajlaşması 😂', aciklama: 'Böyle bir şaka yaptın mı hiç? Devamı yorumlarda!', etiketler: ['komik', 'mesajlasma', 'hikaye', 'reels', 'shorts'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'mesajlar'], 'sohbet');
    const c = reels(brief, { palet: 'gunbatimi', muzik: 'pop-120', font: 'Anton' });
    const { W, H, k, m } = c;
    const mesajlar = brief.mesajlar.slice(0, 14);
    const adA = brief.kisiA || 'Ece';
    const adB = brief.kisiB || 'Can';
    const zi = brief.zeminNo ?? 2;
    const vur = c.vurgu(zi);
    const sol = '#ffffff';
    const sag = vur;
    const solYazi = '#1a1a24';
    const sagYazi = yaziRengi(sag);

    const size = Math.round(m * 0.064);
    const padV = size * 0.5;
    const padX = size * 0.75;
    const maxChars = Math.floor((W * 0.66) / (size * 0.5));
    const gap = size * 0.6;
    const yBas = H * 0.2;
    const altSinir = H * 0.82;

    // zamanlama + yerleşim (kamera kayması panT)
    let b = 0;
    const olaylar = [];
    let y = yBas;
    let pan = 0;
    const panT = [{ t: 0, v: 0 }];
    mesajlar.forEach((ms, i) => {
      const kim = ms.kim === 'b' || (ms.kim == null && i % 2) ? 'b' : 'a';
      const metin = sarMetin(ms.metin, maxChars);
      const satir = metin.split('\n').length;
      const h = satir * size * 1.2 + padV * 2;
      const beats = Math.max(3, Math.ceil((0.45 + kelimeSay(ms.metin) * 0.3) / c.p));
      const tYaz = c.vurus(b);
      const t0 = c.vurus(b + 1);
      const cy = y + h / 2;
      const yeniPan = Math.max(pan, cy + h / 2 + gap - altSinir);
      if (yeniPan > pan) {
        panT.push({ t: R2(t0 - 0.02), v: pan, ease: 'step' }, { t: R2(t0 + 0.4), v: yeniPan, ease: 'outCubic' });
        pan = yeniPan;
      }
      olaylar.push({ kim, metin, satir, h, cy, tYaz, t0, i });
      y += h + gap;
      b += beats;
    });
    const sonBeat = b;
    const tK = c.vurus(sonBeat + 4);
    const tEnd = c.vurus(sonBeat + 4 + 6);
    // üst çubuk kamerayla birlikte kayar → ters izle (ekranda sabit görünür)
    const pinned = (baseY) => panT.map((p) => ({ t: p.t, v: R2(baseY + p.v), ...(p.ease ? { ease: p.ease } : {}) }));

    const g0 = c.grup('g-baslik', 'Üst çubuk', true);
    c.bolum(0, 'Sohbet');
    c.sekil('bar', 'kare', W / 2, H * 0.075, 200, { sx: (W * 1.1) / 200, sy: (H * 0.15) / 200, renk: '#000000', opacity: 0.28, giris: 'yok', t0: 0, t1: tK, grup: g0, extra: { y: pinned(H * 0.075) } });
    c.sekil('avatar-a', 'daire', W * 0.12, H * 0.085, m * 0.085, { t0: 0.05, t1: tK, renk: vur, grup: g0, extra: { y: pinned(H * 0.085) } });
    c.slam('avatar-a-t', adA[0] || 'A', 0.1, tK, { x: W * 0.12, y: H * 0.085, size: m * 0.055, sabit: true, giris: 'pop', renk: yaziRengi(vur), golge: false, grup: g0, harf: 0, extra: { y: pinned(H * 0.085) } });
    c.slam('baslik-ad', `${adA} & ${adB}`, 0.1, tK, { x: W * 0.2, y: H * 0.075, size: m * 0.046, sabit: true, align: 'left', giris: 'pop', renk: '#ffffff', font: c.govde, weight: 800, upper: false, golge: false, grup: g0, harf: 0, extra: { y: pinned(H * 0.075) } });
    c.slam('baslik-alt', brief.ad, 0.15, tK, { x: W * 0.2, y: H * 0.107, size: m * 0.028, sabit: true, align: 'left', giris: 'pop', renk: 'rgba(255,255,255,0.75)', font: c.govde, weight: 600, upper: false, golge: false, grup: g0, harf: 0, extra: { y: pinned(H * 0.107) } });

    const vuruslar = [];
    const bgler = [{ t: 0, i: zi }];
    olaylar.forEach((o) => {
      const g = c.grup(`g-msj${o.i + 1}`, `${o.i + 1}. mesaj`, true);
      const right = o.kim === 'b';
      vuruslar.push(o.t0);
      // yazıyor göstergesi (balonun yerinde, mesaj gelince kaybolur)
      const bh = size * 1.7;
      const bw = bh * 2.4;
      const xy = right ? W - W * 0.07 - bw / 2 : W * 0.07 + bw / 2;
      c.L({
        id: `msj${o.i + 1}-yaziyor`, group: g, type: 'balon', kind: 'yaziyor', side: right ? 'sag' : 'sol', width: Math.round(bw), height: Math.round(bh),
        x: Math.round(xy), y: Math.round(o.cy - o.h / 2 + bh / 2), start: R2(o.tYaz + 0.05), end: R2(o.t0),
        bg: right ? sag : '#f1eef8', textColor: right ? sagYazi : '#8a85a3',
      });
      const x = right ? W - W * 0.07 - padX : W * 0.07 + padX;
      c.slam(`msj${o.i + 1}`, o.metin, o.t0, tK, {
        x, y: o.cy, size, sabit: true, align: right ? 'right' : 'left', giris: 'pop', renk: right ? sagYazi : solYazi, font: c.govde, weight: 700, upper: false, golge: false, grup: g, harf: 0, lh: 1.2,
        kutu: { color: right ? sag : sol, radius: size * 0.85, padding: [padV, padX], shadow: false },
      });
      c.halka(`msj${o.i + 1}-h`, o.t0, x, o.cy, right ? sag : '#ffffff', { group: g, alfa: 0.45, boyut: m * 0.05, son: m * 0.4, sure: 0.4 });
    });

    // tepkiler
    const tT = c.vurus(sonBeat);
    const son = olaylar[olaylar.length - 1];
    const tepkiY = Math.max(son.cy + son.h / 2 + gap + 80, H * 0.5);
    if (brief.tepkiler?.length) {
      const g = c.grup('g-tepki', 'Tepkiler', true);
      c.bolum(tT, 'Tepkiler');
      c.L({
        id: 'tepki', group: g, type: 'balon', kind: 'tepki', lines: brief.tepkiler, width: Math.round(W * 0.8), height: 130, x: Math.round(W / 2), y: Math.round(tepkiY),
        start: R2(tT), end: R2(tK), fold: [k(tT, 0), k(tT + 0.8, 1, 'outCubic')],
      });
      vuruslar.push(tT, c.vurus(sonBeat + 1));
    }

    // kapanış
    bgler.push({ t: tK, i: zi + 1 });
    c.silme('silme-son', tK, c.vurgu(zi + 1));
    c.kapanis(tK, tEnd, brief.cta || 'Devamı yorumlarda', brief.alt, { i: zi + 1, ikon: 'ok' });
    for (let j = 0; j < 6; j++) vuruslar.push(c.vurus(sonBeat + 4 + j));

    const cam = c.kameraVurus(vuruslar, { zoom: 0.02, egim: 0 });
    cam.y = [...panT.map((p) => ({ t: p.t, v: R2(H / 2 + p.v), ...(p.ease ? { ease: p.ease } : {}) })), { t: R2(tK - 0.01), v: R2(H / 2 + pan), ease: 'step' }, { t: R2(tK), v: H / 2, ease: 'step' }];
    return c.bitir2(brief.ad, tEnd, { background: c.arkaplan(bgler), camera: cam });
  },
};
