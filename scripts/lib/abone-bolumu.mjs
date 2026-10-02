// Ders videolarının sonuna "beğen · yorum yaz · abone ol" bölümü (Kıpır söyler). Kanal: https://www.youtube.com/@BayKipir
// Üreteç betiğinden çağrılır; metin satırları scripts/abone-satirlar.txt, ses: data/audio/<proje>-abone-1..3.wav.
//   const abone = aboneBolumu({ L, M, T, hap, yika, AN, k, r2, tG, a: [n[21], n[22], n[23]], g: 'g-g', renk: { INK, CORAL, ... } });
//   abone.akis → Kıpır akış adımları (gozlu.akis'e eklenir)
export function aboneBolumu({ L, M, T, hap, yika, AN, k, r2, tG, a, g = 'g-g', renk, fontBaslik, fontEl }) {
  const { INK, CORAL, BUTTER, MINT, SKY, LILAC, PINK } = renk;
  const [a1, a2, a3] = a.map((x) => x.t);
  const son = a[2].e;

  yika('g-yika', g, '#ffe3df', 1340, 540, 1500, tG, null, { op: 0.9 });
  yika('g-yika2', g, '#e3d9fb', 1650, 820, 700, tG + 0.3, null, { op: 0.85, rot: 12 });
  yika('g-yika3', g, '#fff0a6', 1000, 330, 560, tG + 0.5, null, { op: 0.8, rot: -8 });

  // Başlık: kanal adı + adres
  M('g-logo', g, 'youtube-logo', 1010, 175, 190, tG + 0.4, null, { dur: 1.0, cikis: false, idle: 6 });
  T('g-ad', g, 'Bay Kıpır', 1420, 170, 112, tG + 0.5, null, { font: fontBaslik, weight: 900, color: CORAL, cikis: false, adur: 0.5, aralik: 0.05 });
  hap('g-adres', g, 'youtube.com/@BayKipir', 1340, 305, 760, 42, '#ffffff', tG + 1.0, null, { h: 76, t: { font: fontBaslik, weight: 900 }, kutu: { cikis: false } });

  // 1) Beğen
  M('g-begen', g, 'basparmak-cizim', 1130, 540, 250, a1 + 0.3, null, { dur: 1.0, cikis: false, anims: [AN('nabiz', a1 + 1.6, null, { genlik: 0.06, periyot: 1.2 })] });
  hap('g-begen-e', g, 'BEĞEN', 1130, 725, 300, 44, '#c9ddff', a1 + 0.9, null, { h: 84, t: { font: fontBaslik, weight: 900 }, kutu: { cikis: false } });
  L({ id: 'g-kalpler', group: g, type: 'particles', particle: 'kalp-yagmuru', mode: 'patlama', x: 1130, y: 520, start: r2(a1 + 1.3), end: r2(a1 + 4.0), count: 26, sfx: false });

  // 2) Yorum yaz
  M('g-yorum', g, 'yorum-balonu-cizim', 1530, 540, 290, a2 + 0.2, null, { dur: 1.0, cikis: false, anims: [AN('sallan', a2 + 1.4, null, { genlik: 4, periyot: 2.4 })] });
  hap('g-yorum-e', g, 'YORUM YAZ', 1530, 725, 400, 44, '#c6f1e0', a2 + 0.8, null, { h: 84, t: { font: fontBaslik, weight: 900 }, kutu: { cikis: false } });

  // 3) Abone ol: kırmızı düğme → "ABONE OLUNDU" + zil
  const tik = a3 + 3.4;
  hap('g-abone', g, 'ABONE OL', 1330, 895, 700, 74, '#ff0000', a3 + 0.2, tik, { h: 150, color: '#ffffff', t: { font: fontBaslik, weight: 900 }, kutu: { cikis: 'kuculerek-cik' } });
  hap('g-abone2', g, 'ABONE OLUNDU', 1290, 895, 700, 56, '#d6d6e0', tik, null, { h: 150, color: INK, t: { font: fontBaslik, weight: 900 }, kutu: { cikis: false } });
  M('g-abone-tik', g, 'tik', 1000, 895, 60, tik + 0.2, null, { pal: { a: '#2fbf71' }, giris: 'zipla-gir', dur: 0.5, cikis: false });
  M('g-zil', g, 'zil-cizim', 1790, 895, 160, tik + 0.3, null, { dur: 0.8, cikis: false, anims: [AN('sallan', tik + 1.1, null, { genlik: 14, periyot: 0.5 })] });
  L({ id: 'g-konfeti', group: g, type: 'particles', particle: 'konfeti', mode: 'patlama', x: 1330, y: 860, start: r2(tik + 0.2), end: r2(son + 3), colors: [CORAL, BUTTER, MINT, LILAC, PINK, SKY], count: 70, sfx: false });

  return {
    akis: [
      { t: a1, aksiyon: 'tanit', hedef: 'g-begen', duygu: 'mutlu', bak: 'g-begen' },
      { t: a1 + 2.2, aksiyon: 'sevin', duygu: 'cok-mutlu', sure: 1.2 },
      { t: a2, aksiyon: 'isaret', hedef: 'g-yorum', duygu: 'mutlu', bak: 'g-yorum' },
      { t: a3, aksiyon: 'tanit', hedef: 'g-abone-z', duygu: 'cok-mutlu', bak: 'g-abone-z' },
      { t: tik, aksiyon: 'sevin', duygu: 'heyecanli', sure: 1.6 },
      { t: tik + 2.0, aksiyon: 'el-salla', duygu: 'cok-mutlu', bak: 'ileri' },
    ],
  };
}

/** scripts/abone-satirlar.txt → metin dizisi ("sn | metin" biçiminde baştaki süre atılır) */
export function aboneMetinleri(root, fs, path) {
  const dosya = path.join(root, 'scripts', 'abone-satirlar.txt');
  return fs.readFileSync(dosya, 'utf8').split(/\r?\n/).filter((s) => s.trim()).map((s) => s.replace(/^[\d.]+\s*\|\s*/, ''));
}
