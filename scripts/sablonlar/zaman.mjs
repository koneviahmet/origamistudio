// Zaman tüneli (anlatımlı hikâye): dönem dönem ilerleyen, el çizimi görünümlü anlatım videosu.
// Her bölüm: yıl + ad → kütüphane nesnesi kendini çizer → konuşma balonu → iki bilgi satırı (yazılır) → isteğe bağlı oklu notlar →
// nesne alttaki RAFA uçar, yılı rafta kalır (koleksiyon birikir). Arka plan dönem renginden renge süzülür; sayfa çevirme geçişi;
// bölüm süreleri okuma / anlatım süresine göre vuruş ızgarasına yuvarlanır. Anlatım metni verilirse `anlatim.txt` üretilir (npm run seslendir).
import { gerekli, nesneSec, varlikBoyut, wavOku } from './lib.mjs';
import { reels, sarMetin, sigdirFont, parlaklik } from './reels.mjs';

const R2 = (n) => Math.round(n * 100) / 100;
const kelimeSay = (t) => String(t || '').split(/\s+/).filter(Boolean).length;

export default {
  id: 'zaman',
  ad: 'Zaman tüneli (anlatımlı)',
  etiket: 'Hikâye · Tarihçe · Evrim',
  sure: '40–90 sn',
  aciklama: 'Dönem dönem ilerleyen el çizimi anlatım: yıl, nesne kendini çizer, konuşma balonu, yazılan bilgi satırları, oklu notlar; nesneler alttaki rafa dizilir. Anlatım metni ve müzikle birlikte.',
  ornek: {
    sablon: 'zaman', id: 'sablon-zaman', ad: 'Uzay Yarışı', format: 'reels', palet: 'kagit', muzik: 'lofi-90', font: 'Caveat', stil: 'cizim',
    kanca: 'Gökyüzüne uzanan', baslik: 'Uzay Yarışı', altBaslik: '400 yıllık keşif',
    bolumler: [
      { yil: '1609', ad: 'Teleskop', nesne: 'teleskop-3d', balon: 'Bakın!', bilgi: ['Galileo teleskopu göğe çevirir', 'Ay\'da dağlar, Jüpiter\'de uydular görür'], notlar: ['mercek'], anlatim: 'Bin altı yüz dokuz. Galileo teleskopunu gökyüzüne çevirdi ve evrene bakış sonsuza dek değişti.' },
      { yil: '1957', ad: 'Sputnik', nesne: 'uydu-3d', balon: 'Bip bip!', bilgi: ['İlk yapay uydu yörüngeye çıkar', 'Uzay çağı başlar'], anlatim: 'Bin dokuz yüz elli yedi. Sputnik, dünyanın ilk yapay uydusu olarak yörüngeye çıktı.' },
      { yil: '1961', ad: 'Gagarin', nesne: 'roket-3d', balon: 'Hadi!', bilgi: ['Yuri Gagarin uzaya giden ilk insan', 'Yolculuk 108 dakika sürer'], anlatim: 'Bin dokuz yüz altmış bir. Yuri Gagarin uzaya giden ilk insan oldu.' },
      { yil: '1969', ad: 'Ay\'a iniş', nesne: 'astronot-3d', balon: 'Küçük adım!', bilgi: ['Apollo 11 Ay\'a ayak basar', 'Neil Armstrong ilk adımı atar'], anlatim: 'Bin dokuz yüz altmış dokuz. Apollo on bir ile insan ilk kez Ay\'a ayak bastı.' },
      { yil: '1998', ad: 'Uzay istasyonu', nesne: 'uzay-istasyonu-3d', balon: 'Merhaba!', bilgi: ['Uluslararası Uzay İstasyonu kurulmaya başlar', 'İnsanlar yıllardır orada yaşıyor'], anlatim: 'Bin dokuz yüz doksan sekiz. Uluslararası Uzay İstasyonu\'nun ilk modülü yörüngeye yerleşti.' },
      { yil: 'Bugün', ad: 'Mars', nesne: 'mars-gezgini-3d', balon: 'Keşfet!', bilgi: ['Gezginler Mars\'ın yüzeyini inceliyor', 'Sıradaki durak: insanlı yolculuk'], anlatim: 'Bugün gezginler Mars\'ı inceliyor. Sıradaki durak, insanlı yolculuk.' },
    ],
    soru: 'Sıradaki durak ne olacak?', cta: 'Tahminini yorumlara yaz!', son1: '400 yılda', son2: 'göğe uzandık!',
    yayin: { baslik: 'Uzay yarışının 400 yıllık hikâyesi', aciklama: 'Galileo\'nun teleskopundan Mars gezginlerine, uzay keşfinin dönüm noktaları. Sence sıradaki durak ne? Yorumlara yaz!', etiketler: ['uzay', 'tarih', 'bilim', 'reels', 'shorts', 'egitim', 'nasa'] },
  },
  uret(brief) {
    gerekli(brief, ['ad', 'bolumler'], 'zaman');
    const c = reels(brief, { palet: 'kagit', muzik: 'lofi-90', font: 'Caveat', stil: 'cizim' });
    const { W, H, k, m } = c;
    const font = c.font;
    const bol = brief.bolumler.slice(0, 9);
    const n = bol.length;
    const p = c.p;
    const koyu = parlaklik(c.zemin(0)) < 148;
    const murekkep = brief.murekkep || (koyu ? '#f4efe1' : '#2d3561');
    const kahve = koyu ? '#d9c7a0' : '#7a4a2a';
    const hi = (i) => c.pal.acc[i % c.pal.acc.length];
    const hiYazi = koyu ? '#1b2228' : '#2d3561';
    const anlatim = [];
    const audio = [];

    // ── zamanlama ─────────────────────────────────────────────────────────
    const kapakBeats = 8;
    let b = kapakBeats;
    const planlar = bol.map((s) => {
      const bilgi = (s.bilgi || []).slice(0, 2);
      const okuma = 2.6 + bilgi.reduce((x, l) => x + kelimeSay(l), 0) * 0.34;
      const sesDosya = s.ses && wavOku(String(s.ses));
      const sesSure = sesDosya ? sesDosya.mono.length / sesDosya.sampleRate : 0;
      const anlat = s.anlatim ? (sesSure || String(s.anlatim).length / 14 + 0.9) + 1.0 : 0;
      const sn = Math.max(6.2, okuma + 1.6, anlat);
      const beats = Math.ceil(sn / p / 2) * 2;
      const pl = { s, bilgi, beats, b0: b, sesSure };
      b += beats;
      return pl;
    });
    const bK = b; // kapanış başlangıç vuruşu
    const kapSure = 8; // vuruş
    const tEnd = c.vurus(bK + kapSure);
    const tK = c.vurus(bK);

    // ── arka plan: dönem renginden renge süzülür ─────────────────────────
    const bgA = [k(0, c.zemin(0))];
    const bgB = [k(0, karistir2(c.zemin(0)))];
    planlar.forEach((pl, i) => {
      const t0 = c.vurus(pl.b0);
      bgA.push(k(t0 - 0.5, c.zemin(i), 'linear'), k(t0 + 0.5, c.zemin(i + 1), 'inOutSine'));
      bgB.push(k(t0 - 0.5, karistir2(c.zemin(i)), 'linear'), k(t0 + 0.5, karistir2(c.zemin(i + 1)), 'inOutSine'));
    });
    bgA.push(k(tK - 0.5, c.zemin(n), 'linear'), k(tK + 0.5, c.zemin(n + 1), 'inOutSine'));
    bgB.push(k(tK - 0.5, karistir2(c.zemin(n)), 'linear'), k(tK + 0.5, karistir2(c.zemin(n + 1)), 'inOutSine'));
    function karistir2(hex) {
      return parlaklik(hex) > 148 ? shade(hex, 0.93) : shade(hex, 0.8);
    }
    function shade(hex, f) {
      const v = parseInt(hex.slice(1), 16);
      const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.round(Math.min(255, x * f)));
      return '#' + ch.map((x) => x.toString(16).padStart(2, '0')).join('');
    }

    // ── yardımcılar ───────────────────────────────────────────────────────
    const yazi = (id, text, t0, t1, o) => {
      const metin = o.sar ? sarMetin(text, o.sar) : String(text);
      const size = o.sabit ? o.size : sigdirFont(metin, font, o.maxW ?? W * 0.9, o.size ?? 80, false);
      const rev = o.reveal; // [başla, süre] (sn, t0'a göre)
      return c.L({
        id, ...(o.grup ? { group: o.grup } : {}), type: 'text', text: metin, font, weight: 700, color: o.renk || murekkep, x: o.x ?? W / 2, y: o.y, size,
        align: 'center', lineHeight: o.lh ?? 1.05, start: R2(t0), ...(t1 != null ? { end: R2(t1) } : {}),
        ...(rev ? { reveal: [k(t0 + rev[0], 0), k(t0 + rev[0] + Math.max(0.02, rev[1]), 1, 'linear')] } : {}),
        ...(o.rot ? { rotation: o.rot } : {}),
        ...(o.kutu ? { box: { color: o.kutu, opacity: 0.88, radius: o.radius ?? 16, shadow: false, padding: o.pad ?? [4, 30] } } : {}),
        ...(o.anims ? { anims: o.anims } : {}),
      });
    };
    const nesne = (id, grup, asset, px, x, y, t0, t1, anims, extra = {}) => {
      const [w, h] = varlikBoyut(asset);
      return c.L({
        id, group: grup, asset, x, y, anchor: [0.5, 1], scale: R2(px / Math.max(w, h)), start: R2(t0), ...(t1 != null ? { end: R2(t1) } : {}), anims, ...extra,
      });
    };
    const cizGir = (t, dur) => (c.stil === 'cizim' ? { preset: 'cizerek-gir', t: R2(t), dur } : { preset: 'katlanarak-gir', t: R2(t), dur });

    // ── kapak ─────────────────────────────────────────────────────────────
    const gK = c.grup('g-acilis', 'Açılış', true);
    c.bolum(0, 'Açılış');
    const tKapak = c.vurus(kapakBeats);
    const sus = brief.suslemeler || ['yildiz', 'bulut', 'yildiz'];
    [[0.17, 0.2, 0.34, -10], [0.84, 0.17, 0.42, 8], [0.8, 0.62, 0.3, 14]].slice(0, sus.length).forEach(([fx, fy, f, r], i) => {
      const asset = nesneSec(sus[i]);
      const [w, h] = varlikBoyut(asset);
      c.L({
        id: `susleme-${i + 1}`, group: gK, asset, x: Math.round(W * fx), y: Math.round(H * fy), scale: R2((m * f) / Math.max(w, h)), rotation: r, end: R2(tKapak), depth: 0.3,
        palette: { a: hi(i + 1) }, anims: [cizGir(0.5 + i * 0.3, 1.2), { preset: 'sallan', t: 1.9 + i * 0.2, aci: 8, periyot: 2.2 }, { preset: 'sol', t: R2(tKapak - 0.5), dur: 0.45 }],
      });
    });
    if (brief.kapakNesne) {
      const asset = nesneSec(brief.kapakNesne);
      nesne('kapak-nesne', gK, asset, m * 0.5, W / 2, H * 0.78, 0.4, tKapak, [cizGir(0.5, 1.8), { preset: 'suzul', t: 2.4, genlik: 10, periyot: 3 }, { preset: 'sol', t: R2(tKapak - 0.5), dur: 0.45 }]);
    }
    if (brief.kanca) yazi('kanca', brief.kanca, 0, tKapak, { grup: gK, y: H * 0.29, size: 96, reveal: [0.15, 0.9], anims: [{ preset: 'sol', t: R2(tKapak - 0.5), dur: 0.45 }] });
    yazi('baslik', brief.baslik || brief.ad, 0, tKapak, { grup: gK, y: H * 0.4, size: 190, sar: 12, reveal: [0.9, 1.5], lh: 1, anims: [{ preset: 'nefes', t: 2.4, genlik: 0.015, periyot: p * 4 }, { preset: 'kuculerek-cik', t: R2(tKapak - 0.55), dur: 0.5 }] });
    if (brief.altBaslik) yazi('alt-baslik', brief.altBaslik, 0, tKapak, { grup: gK, y: H * 0.53, size: 92, reveal: [2.0, 1.0], kutu: hi(0), rot: -2, anims: [{ preset: 'zipla-gir', t: 2.0, dur: 0.5 }, { preset: 'sol', t: R2(tKapak - 0.5), dur: 0.45 }] });

    // raf (kalıcı): kapakta çizilir
    const gRaf = c.grup('g-raf', 'Raf', false);
    c.L({
      id: 'raf', group: gRaf, asset: 'raf', x: W / 2, y: Math.round(H * 0.745), anchor: [0.5, 0], scale: R2((W * 0.86) / 400), scaleY: 0.66, start: 1.2,
      sketch: { ink: kahve, width: 2.6 }, palette: { a: koyu ? '#6b5a42' : '#c9a373', b: koyu ? '#5a4a36' : '#a98557' }, anims: [cizGir(1.4, 2.0)],
    });
    const sp = Math.min(150, (W * 0.84) / Math.max(1, n));
    const slotX = (i) => W / 2 + (i - (n - 1) / 2) * sp;
    const slotPx = Math.min(130, sp * 0.9);
    const rafY = H * 0.745;

    // ── bölümler ──────────────────────────────────────────────────────────
    const vuruslar = [];
    planlar.forEach((pl, i) => {
      const s = pl.s;
      const t0 = c.vurus(pl.b0);
      const t1 = c.vurus(pl.b0 + pl.beats);
      const g = c.grup(`g-${i + 1}`, `${s.yil || i + 1} · ${s.ad}`, true);
      c.bolum(t0, `${s.yil ? s.yil + ' · ' : ''}${s.ad}`);
      const tUc = t1 - 1.0; // rafa uçuş başlangıcı
      c.gecis('sayfa-cevir', t0, 0.9, '$arka1');
      vuruslar.push(t0, c.vurus(pl.b0 + 4));

      // yıl + ad
      yazi(`yil-${i + 1}`, s.yil || String(i + 1), t0, t1, {
        grup: g, y: H * 0.142, size: 190, maxW: W * 0.74, kutu: hi(i), rot: -2, reveal: [0.1, 0.5], pad: [0, 38], radius: 18,
        color: hiYazi, renk: hiYazi, anims: [{ preset: 'zipla-gir', t: R2(t0 + 0.05), dur: 0.6 }, { preset: 'sol', t: R2(t1 - 0.5), dur: 0.45 }],
      });
      yazi(`ad-${i + 1}`, s.ad, t0, t1, { grup: g, y: H * 0.208, size: 112, reveal: [0.5, 0.8], anims: [{ preset: 'sol', t: R2(t1 - 0.5), dur: 0.45 }] });

      // nesne: kendini çizer, rafa uçar
      const asset = nesneSec(s.nesne);
      const px = m * 0.48;
      const y0 = H * 0.515;
      const [aw, ah] = varlikBoyut(asset);
      const sc0 = px / Math.max(aw, ah);
      const sc1 = slotPx / Math.max(aw, ah);
      const x = slotX(i);
      c.L({
        id: `nesne-${i + 1}`, group: g, asset, ...(s.varyant ? { variant: s.varyant } : {}), x: [k(t0, W / 2), k(tUc, W / 2), k(t1 - 0.05, x, 'inOutCubic')],
        y: [k(t0, y0), k(tUc, y0), k(tUc + 0.4, y0 - 150, 'outQuad'), k(t1 - 0.05, rafY, 'inQuad')], anchor: [0.5, 1],
        scale: [k(t0, R2(sc0)), k(tUc, R2(sc0)), k(t1 - 0.05, R2(sc1), 'inOutCubic')],
        rotation: [k(tUc, 0), k(tUc + 0.4, -8, 'outQuad'), k(t1 - 0.05, 0, 'outBack')], start: R2(t0),
        anims: [cizGir(t0 + 0.55, 1.7), { preset: 'nefes', t: R2(t0 + 2.3), dur: 2.4, genlik: 0.012, periyot: p * 3 }],
      });
      // balon
      if (s.balon) yazi(`balon-${i + 1}`, s.balon, t0, t1, {
        grup: g, x: W * (i % 2 ? 0.22 : 0.78), y: H * 0.3, size: 86, maxW: W * 0.4, kutu: '#ffffff', radius: 26, pad: [8, 24], rot: i % 2 ? 6 : -6,
        renk: '#2d3561', anims: [{ preset: 'zipla-gir', t: R2(t0 + 2.3), dur: 0.55 }, { preset: 'sallan', t: R2(t0 + 2.9), aci: 4, periyot: 1.6 }, { preset: 'kuculerek-cik', t: R2(t1 - 1.0), dur: 0.4 }],
      });
      // bilgi satırları (el yazısı gibi yazılır)
      pl.bilgi.forEach((ln, j) => {
        yazi(`bilgi-${i + 1}${'ab'[j]}`, ln, t0, t1, { grup: g, y: H * (0.59 + j * 0.055), size: 78, maxW: W * 0.92, reveal: [2.6 + j * 1.15, 0.9], anims: [{ preset: 'sol', t: R2(t1 - 0.5), dur: 0.45 }] });
      });
      // oklu notlar
      (s.notlar || []).slice(0, 2).forEach((nt, j) => {
        const lx = W * (j % 2 ? 0.82 : 0.18);
        const ly = H * (0.42 + j * 0.07);
        const tn = t0 + 3.0 + j * 0.5;
        yazi(`not-${i + 1}${'ab'[j]}`, nt, tn, t1 - 0.8, { grup: g, x: lx, y: ly, size: 60, maxW: W * 0.32, sar: 12, kutu: hi(i + 2), rot: j % 2 ? 4 : -4, renk: hiYazi, anims: [{ preset: 'zipla-gir', t: R2(tn), dur: 0.45 }] });
        c.L({
          id: `not-ok-${i + 1}${'ab'[j]}`, group: g, type: 'arrow', arrow: 'ok-kavis', from: `not-${i + 1}${'ab'[j]}`, to: `nesne-${i + 1}`, start: R2(tn + 0.3), end: R2(t1 - 0.8),
          fold: [k(tn + 0.3, 0), k(tn + 1.1, 1, 'inOutSine')], anims: [{ preset: 'silinerek-cik', t: R2(t1 - 1.3), dur: 0.5 }],
        });
      });
      // raf yılı (kalıcı)
      yazi(`raf-yil-${i + 1}`, s.yil || String(i + 1), t1 - 0.3, null, { grup: gRaf, x, y: H * 0.78, size: 44, sabit: true, renk: kahve, anims: [{ preset: 'zipla-gir', t: R2(t1 - 0.25), dur: 0.45 }] });

      // anlatım
      if (s.ses) audio.push({ file: String(s.ses), start: R2(t0 + 0.4), volume: 1 });
      if (s.anlatim) anlatim.push({ t: R2(t0 + 0.4), metin: String(s.anlatim) });
    });

    // ── kapanış ───────────────────────────────────────────────────────────
    const gS = c.grup('g-kapanis', 'Kapanış', true);
    c.bolum(tK, 'Kapanış');
    c.gecis('sayfa-cevir', tK, 0.9, '$arka1');
    if (brief.son1) yazi('son-1', brief.son1, tK, null, { grup: gS, y: H * 0.2, size: 140, reveal: [0.3, 0.7] });
    yazi('son-2', brief.son2 || `${brief.ad}!`, tK, null, { grup: gS, y: H * 0.3, size: 200, sar: 14, reveal: [1.0, 1.2], lh: 1, anims: [{ preset: 'nefes', t: R2(tK + 2.4), genlik: 0.02, periyot: p * 3 }] });
    if (brief.soru) yazi('son-soru', brief.soru, tK, null, { grup: gS, y: H * 0.41, size: 104, sar: 18, kutu: hi(1), rot: -3, reveal: [2.8, 0.01], anims: [{ preset: 'zipla-gir', t: R2(tK + 2.8), dur: 0.7 }, { preset: 'sallan', t: R2(tK + 3.6), aci: 3, periyot: 2 }] });
    if (brief.cta) yazi('son-cta', brief.cta, tK, null, { grup: gS, y: H * 0.47, size: 74, renk: koyu ? '#cdbfe6' : '#5b4a7a', reveal: [4.0, 1.2] });
    if (brief.takip !== false) c.takip(tK + 3.2, tEnd, { grup: gS, y: 0.6 });
    // raftaki nesneler sırayla zıplar (dalga)
    for (let i = 0; i < n; i++) {
      const ly = c.layers.find((l) => l.id === `nesne-${i + 1}`);
      ly.anims.push({ preset: 'seksek', t: R2(tK + 0.4 + i * p * 0.5), yukseklik: 22, periyot: p * 2 });
    }
    c.L({ id: 'kapanis-konfeti', group: gS, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', start: R2(tK), end: R2(tEnd), count: 45, prewarm: true, area: [60, 300, W - 60, Math.round(H * 0.65)] });
    c.L({ id: 'kapanis-patlama', group: gS, type: 'particles', particle: 'konfeti', mode: 'patlama', x: W / 2, y: Math.round(H * 0.4), start: R2(tK + 2.8), end: R2(tEnd) });
    for (let j = 0; j < kapSure; j += 2) vuruslar.push(c.vurus(bK + j));

    // ── sahne ─────────────────────────────────────────────────────────────
    const cam = c.kameraVurus(vuruslar.filter((t) => t > 3.4), { zoom: 0.014, egim: 0 });
    cam.zoom = [k(0, 1.14), k(3, 1, 'inOutCubic'), ...cam.zoom.filter((z) => z.t > 3.2)];
    const sc = c.bitir2(brief.ad, tEnd, {
      background: { type: 'linear', colors: [bgA, bgB], angle: 170, paper: 0.45, vignette: 0.16 },
      camera: cam,
      sketch: { ink: murekkep, width: 3.4, wobble: 1.4, hatch: 5, angle: 62, wipe: 35, grain: 0.35 },
    });
    if (audio.length) sc.audio = [...audio, ...(sc.audio || []).map((a) => ({ ...a, volume: audio.length ? Math.min(a.volume, 0.28) : a.volume }))];
    if (anlatim.length) sc.meta = { anlatim };
    return sc;
  },
};
