// Hikâye modelleri için "kâğıt facet" araç takımı: tohumlu rastgelelik, çokgen yardımcıları, küre / dağ / çam / dalga / kum tepesi üreteçleri.
// Her şey data/library/<kategori>/<id>.json biçimine (şema §2) çıkar: facets = [{ p, c, s, part? }], c = palet anahtarı ya da #hex, s = ışık (-1..1).
// Işık yukarı-soldan gelir: sol yüzler açık (+s), sağ / alt yüzler koyu (-s).
export const r1 = (v) => Math.round(v * 10) / 10;
export const rng = (seed = 1) => {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};
export const F = (p, c, s = 0, extra = {}) => ({ p: p.map(([x, y]) => [r1(x), r1(y)]), c, s: Math.round(s * 100) / 100, ...extra });
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dosya = [];
export const ekle = (kategori, a) => dosya.push({ kategori, roles: { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu' }, ...a });

/** Elips noktaları (tam elips: a0=0, a1=360; yay: a0..a1 derece, y aşağı) */
export const elips = (cx, cy, rx, ry, n = 28, a0 = 0, a1 = 360) => {
  const tam = Math.abs(a1 - a0) >= 360;
  return Array.from({ length: n }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / (tam ? n : n - 1)) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
};
/** Yatay aynalama (cx eksenine göre), sıra ters çevrilir */
export const ayna = (pts, cx) => pts.map(([x, y]) => [2 * cx - x, y]).reverse();
export const tasi = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
/** Catmull-Rom ile yumuşatma: noktalar arasına ara noktalar ekler */
export const yumusat = (pts, adim = 6, kapali = false) => {
  const n = pts.length;
  const al = (i) => (kapali ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  const out = [];
  const son = kapali ? n : n - 1;
  for (let i = 0; i < son; i++) {
    const p0 = al(i - 1); const p1 = al(i); const p2 = al(i + 1); const p3 = al(i + 2);
    for (let t = 0; t < adim; t++) {
      const u = t / adim; const u2 = u * u; const u3 = u2 * u;
      const f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3);
      out.push([f(0), f(1)]);
    }
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
};
/** İki yay arasında kalan hilal (iç yay (ox, oy) kaymış): kürenin gölge / ışık tarafı */
export const hilal = (cx, cy, rx, ry, a0, a1, ox, oy, n = 14) => [
  ...elips(cx, cy, rx, ry, n, a0, a1),
  ...elips(cx + ox, cy + oy, rx * 0.98, ry * 0.98, n, a0, a1).reverse(),
];
/** Küre / yuvarlak gövde: taban + sağ-alt gölge hilali + sol-üst parlama. */
export const kure = (cx, cy, r, c, { ry = r, golge = -0.3, parla = 0.22, parca } = {}) => {
  const ek = parca ? { part: parca } : {};
  return [
    F(elips(cx, cy, r, ry, 30), c, 0, ek),
    F(hilal(cx, cy, r, ry, -70, 110, -r * 0.34, -ry * 0.2), c, golge, ek),
    F(elips(cx - r * 0.38, cy - ry * 0.42, r * 0.3, ry * 0.2, 12), c, parla, ek),
  ];
};
/** İki yüz: sol açık / sağ koyu dikdörtgen sütun */
export const sutun = (x0, y0, x1, y1, c, { bol = 0.55, a = 0.12, b = -0.2 } = {}) => {
  const xm = mix(x0, x1, bol);
  return [F([[x0, y0], [xm, y0], [xm, y1], [x0, y1]], c, a), F([[xm, y0], [x1, y0], [x1, y1], [xm, y1]], c, b)];
};
/** Yamuk sütun (alt genişliği, üst genişliği farklı), iki yüz */
export const yamuk = (cx, yAlt, yUst, hwAlt, hwUst, c, { bol = 0.5, a = 0.14, b = -0.22 } = {}) => {
  const xa = cx - hwAlt + 2 * hwAlt * bol; const xu = cx - hwUst + 2 * hwUst * bol;
  return [
    F([[cx - hwAlt, yAlt], [xa, yAlt], [xu, yUst], [cx - hwUst, yUst]], c, a),
    F([[xa, yAlt], [cx + hwAlt, yAlt], [cx + hwUst, yUst], [xu, yUst]], c, b),
  ];
};

/**
 * Dağ / kayalık bandı: sırt çizgisi + ara halkalar → ışığa göre gölgelenen üçgenler.
 * o: { w, h, tepe: [[x0..1, yukseklik0..1, genislik]…], seed, satir, kolon, anahtar: ['a','b','c'] (açık → koyu), kar, karOran, jit, gain }
 */
export const dagBandi = ({ w = 1080, h = 460, tepe, seed = 3, satir = 5, kolon = 14, anahtar = ['a', 'b', 'c'], kar, karOran = 0.22, jit = 0.5, gain = 1.4, kenarAlcak = true } = {}) => {
  const R = rng(seed);
  const yuk = [];
  for (let i = 0; i <= kolon; i++) {
    const x = i / kolon;
    let v = 0.12;
    if (tepe) tepe.forEach(([tx, th, gen = 0.2]) => { v += (th - 0.12) * Math.exp(-((x - tx) ** 2) / (2 * gen * gen)); });
    else v = 0.25 + R() * 0.7;
    yuk.push(clamp(v + (R() - 0.5) * 0.07, 0.04, 1));
  }
  if (kenarAlcak) { yuk[0] = Math.min(yuk[0], 0.1); yuk[kolon] = Math.min(yuk[kolon], 0.1); }
  const V = [];
  for (let r = 0; r <= satir; r++) {
    const row = [];
    for (let i = 0; i <= kolon; i++) {
      const t = r / satir;
      const ust = h - yuk[i] * h;
      const y = mix(ust, h, t * 0.92 + 0.08 * t * t);
      const jx = r === 0 || r === satir || i === 0 || i === kolon ? 0 : (R() - 0.5) * (w / kolon) * jit;
      const jy = r === 0 || r === satir ? 0 : (R() - 0.5) * (h / satir) * jit * 0.9;
      row.push([clamp((i / kolon) * w + jx, 0, w), clamp(y + jy, 0, h), (h - y) * 1.1]);
    }
    V.push(row);
  }
  const L = [-0.62, -0.5, 0.6];
  const ln = Math.hypot(...L);
  const isik = (a, b, c) => {
    const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
    const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy; let ny = uz * vx - ux * vz; let nz = ux * vy - uy * vx;
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const m = Math.hypot(nx, ny, nz) || 1;
    return (nx * L[0] + ny * L[1] + nz * L[2]) / (m * ln);
  };
  const fac = [];
  for (let r = 0; r < satir; r++) {
    for (let i = 0; i < kolon; i++) {
      const a = V[r][i]; const b = V[r][i + 1]; const c = V[r + 1][i]; const d = V[r + 1][i + 1];
      const tris = (i + r) % 2 ? [[a, b, d], [a, d, c]] : [[a, b, c], [b, d, c]];
      tris.forEach((t) => {
        const yort = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const yuks = 1 - yort / h;
        let key = anahtar[Math.min(anahtar.length - 1, Math.floor((1 - yuks) * anahtar.length * 0.99))];
        if (kar && r === 0 && yuks > 0.5 && R() < 0.85) key = kar;
        else if (kar && r === 1 && yuks > 0.72 && R() < 0.4) key = kar;
        const s = clamp((isik(t[0], t[1], t[2]) - 0.22) * gain, -0.5, 0.45);
        fac.push(F(t, key, s));
      });
    }
  }
  return fac;
};

/** Çam: katlı üçgenler (sol açık / sağ koyu) + gövde. (x, y) = alt orta, h = toplam boy */
export const cam = (x, y, h, { kat = 4, ana = 'a', koyu = 'b', govde = 'd', kar, genislik = 0.46 } = {}) => {
  const f = [];
  const gw = h * 0.06;
  f.push(F([[x - gw, y], [x + gw, y], [x + gw, y - h * 0.2], [x - gw, y - h * 0.2]], govde, -0.1));
  const ust = y - h;
  const govdeUst = y - h * 0.14;
  for (let i = 0; i < kat; i++) {
    const yt = ust + (govdeUst - ust) * (i / (kat + 0.55)) * 0.86;
    const yal = ust + (govdeUst - ust) * ((i + 1.7) / (kat + 0.7));
    const hw = h * genislik * (0.28 + 0.72 * ((i + 1) / kat));
    f.push(F([[x, yt], [x, yal], [x - hw, yal]], ana, 0.16));
    f.push(F([[x, yt], [x + hw, yal], [x, yal]], koyu, -0.22));
    if (kar) f.push(F([[x, yt], [x - hw * 0.5, yt + (yal - yt) * 0.5], [x + hw * 0.5, yt + (yal - yt) * 0.5]], kar, 0.1));
  }
  return f;
};

/** Orman bandı: arka-ön sıralı çamlar (alt kenara yaslı) */
export const ormanBandi = ({ w = 1080, h = 360, sayi = 16, seed = 5, boyMin = 0.5, boyMax = 1.0, ana = 'a', koyu = 'b', govde = 'd', kat = 4, kar, taban = 'c', yamac = true } = {}) => {
  const R = rng(seed);
  const f = [];
  if (yamac) {
    const pts = [[0, h]];
    for (let i = 0; i <= 14; i++) pts.push([(i / 14) * w, h - 26 - Math.sin(i * 1.3 + seed) * 10 - R() * 8]);
    pts.push([w, h]);
    f.push(F(pts, taban, 0));
  }
  const dizi = Array.from({ length: sayi }, (_, i) => ({ x: ((i + R() * 0.8) / sayi) * w, hb: mix(boyMin, boyMax, R()) * h * 0.96, sira: R() })).sort((a, b) => a.sira - b.sira);
  dizi.forEach((d, i) => f.push(...cam(clamp(d.x, 24, w - 24), h - 16 - (i % 3) * 6, d.hb, { kat: kat + (i % 2), ana, koyu, govde, kar, genislik: 0.44 })));
  return f;
};

/** Dalga bandı: satırlar halinde faz kaymalı kıvrımlar, aralarında uzun üçgenler (düşük poligon deniz) + tepe köpükleri */
export const dalgaBandi = ({ w = 1080, h = 300, genlik = 26, seed = 7, serit = 5, ana = 'a', koyu = 'b', kopuk = 'w', n = 14, dalga = 3.2 } = {}) => {
  const R = rng(seed);
  const ph = [R() * 6, R() * 6, R() * 6];
  const kriz = (x, r) => genlik * (0.55 * Math.sin((x / w) * Math.PI * 2 * dalga + ph[0] + r * 0.9) + 0.3 * Math.sin((x / w) * Math.PI * 2 * dalga * 2.1 + ph[1] - r * 0.6) + 0.15 * Math.sin((x / w) * Math.PI * 2 * dalga * 3.7 + ph[2]));
  const satirlar = [];
  for (let r = 0; r <= serit; r++) {
    const row = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w + (i === 0 || i === n ? 0 : (R() - 0.5) * (w / n) * 0.55);
      const taban = genlik * 1.4 + (h - genlik * 2.8) * (r / serit) ** 1.25;
      const y = r === serit ? h : taban + kriz(x, r) * (1 - r / (serit + 1.4)) + (R() - 0.5) * genlik * 0.25;
      row.push([clamp(x, 0, w), y]);
    }
    satirlar.push(row);
  }
  const f = [];
  for (let r = 0; r < serit; r++) {
    for (let i = 0; i < n; i++) {
      const a = satirlar[r][i]; const b = satirlar[r][i + 1]; const c = satirlar[r + 1][i]; const d = satirlar[r + 1][i + 1];
      const tris = (i + r) % 2 ? [[a, b, d], [a, d, c]] : [[a, b, c], [b, d, c]];
      tris.forEach((t, q) => {
        const egim = t[1][1] - t[0][1];
        f.push(F(t, (i + r + q) % 3 === 0 ? koyu : ana, clamp(0.1 - r * 0.045 + (q ? -0.1 : 0.04) - egim * 0.006 + (R() - 0.5) * 0.08, -0.36, 0.3)));
      });
    }
  }
  // köpük: ilk satırın üstünde kıvrık dişler
  for (let i = 0; i < n; i++) {
    const a = satirlar[0][i]; const b = satirlar[0][i + 1];
    if (R() < 0.8) {
      const mx = (a[0] + b[0]) / 2; const my = Math.min(a[1], b[1]);
      const gen = (b[0] - a[0]) * (0.28 + R() * 0.18);
      f.push(F([[mx - gen, my + 4], [mx - gen * 0.2, my - 5 - R() * 5], [mx + gen * 0.5, my + 1], [mx + gen, my + 8], [mx, my + 11 + R() * 5]], kopuk, 0.22));
    }
  }
  return f;
};

/** Bulut: tabanda sıralı yuvarlak kabarıklar (taraklı alt kenar) + üstte büyük kabarıklar; her biri yumuşak alt gölge + üst parlama. puf: [[x, y, r]…] */
export const bulutSekli = ({ puf, w = 900, h = 340, acik = 'c', ana = 'a', koyu = 'b', seed = 3 } = {}) => {
  const R = rng(seed);
  const liste = puf || [[w * 0.14, h * 0.7, h * 0.2], [w * 0.3, h * 0.72, h * 0.22], [w * 0.5, h * 0.72, h * 0.24], [w * 0.7, h * 0.72, h * 0.22], [w * 0.86, h * 0.7, h * 0.19],
    [w * 0.25, h * 0.5, h * 0.24], [w * 0.5, h * 0.4, h * 0.32], [w * 0.72, h * 0.5, h * 0.25], [w * 0.4, h * 0.3, h * 0.2], [w * 0.6, h * 0.26, h * 0.17]];
  const f = [];
  // alttan üste: önce alt sıra (y büyük) çizilsin ki üsttekiler örtsün
  [...liste].sort((p, q) => q[1] - p[1]).forEach(([x, y, r]) => {
    f.push(F(elips(x, y, r, r * 0.94, 28), ana, 0.0));
    f.push(F(hilal(x, y, r, r * 0.94, 5, 175, 0, -r * 0.3, 12), koyu, -0.1));
    f.push(F(elips(x - r * 0.3, y - r * 0.38, r * 0.5, r * 0.34, 14), acik, 0.06));
  });
  return f;
};

/** Kum tepesi bandı: koyu taban + her yükselen sırt için yumuşak açık kama (ışık yüzü); ince rüzgâr çizgileri */
export const kumBandi = ({ w = 1080, h = 360, tepe = [[0.2, 0.7, 0.2], [0.62, 0.95, 0.18], [0.92, 0.55, 0.14]], ana = 'a', koyu = 'b', ince = 'c', seed = 11, n = 60 } = {}) => {
  const R = rng(seed);
  const yuk = (x) => {
    let v = 0.14;
    tepe.forEach(([tx, th, gen = 0.2]) => { v += (th - 0.14) * Math.exp(-(((x / w) - tx) ** 2) / (2 * gen * gen)); });
    return clamp(v + 0.025 * Math.sin((x / w) * 17 + seed) + 0.012 * Math.sin((x / w) * 41 + seed * 2), 0.04, 1) * h;
  };
  const sirt = Array.from({ length: n + 1 }, (_, i) => { const x = (i / n) * w; return [x, h - yuk(x)]; });
  const f = [F([...sirt, [w, h], [0, h]], koyu, -0.04)];
  // yükselen (soldan sağa y azalan) koşular
  let i = 0;
  while (i < n) {
    if (sirt[i + 1][1] < sirt[i][1] - 0.3) {
      let j = i;
      while (j < n && sirt[j + 1][1] < sirt[j][1] + 0.4) j++;
      if (j - i >= 3) {
        const kama = sirt.slice(i, j + 1);
        const tepeP = kama[kama.length - 1]; const vadi = kama[0];
        const dik = (vadi[1] - tepeP[1]);
        const alt = [];
        for (let q = kama.length - 1; q >= 0; q--) {
          const t = q / (kama.length - 1); // 1 tepe .. 0 vadi
          alt.push([kama[q][0] - 6 * t, kama[q][1] + dik * (0.18 + 0.5 * Math.sin(t * Math.PI * 0.5) ** 1.4) * 0.9]);
        }
        f.push(F([...kama, ...alt], ana, 0.12 + clamp(dik / h * 0.4, 0, 0.16)));
        // orta ton kama (daha dar)
        f.push(F([...kama.slice(Math.floor(kama.length * 0.35)), ...alt.slice(0, Math.ceil(alt.length * 0.65)).map(([x, y]) => [x, y - dik * 0.1])], ana, 0.2));
      }
      i = j + 1;
    } else i++;
  }
  for (let q = 0; q < 6; q++) {
    const x0 = R() * w * 0.7; const y0 = h - yuk(x0) + 18 + R() * (h * 0.4); const L = 60 + R() * 90;
    f.push(F([[x0, y0], [x0 + L, y0 - 4], [x0 + L, y0 + 1], [x0, y0 + 3]], ince, 0.12));
  }
  return f;
};

/** Pencere: çerçeveli, ışıklı (cam anahtarı g), orta çıta */
export const pencere = (x, y, w, h, { cerceve = 'd', cam = 'g' } = {}) => [
  F([[x - 3, y - 3], [x + w + 3, y - 3], [x + w + 3, y + h + 3], [x - 3, y + h + 3]], cerceve, -0.1),
  F([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], cam, 0.08),
  F([[x, y], [x + w * 0.5, y], [x + w * 0.5, y + h], [x, y + h]], cam, 0.22),
  F([[x + w * 0.46, y], [x + w * 0.54, y], [x + w * 0.54, y + h], [x + w * 0.46, y + h]], cerceve, -0.1),
  F([[x, y + h * 0.46], [x + w, y + h * 0.46], [x + w, y + h * 0.54], [x, y + h * 0.54]], cerceve, -0.1),
];

/** Daire delikli tam ekran çerçeve: köprüsüz (dikiş çizgisi olmasın) halka parçaları. (cx, cy, R) delik; renk c */
export const delikliCerceve = (W, H, cx, cy, R, c, s = 0, n = 64) => {
  const kenar = (ac) => {
    const dx = Math.cos(ac); const dy = Math.sin(ac);
    const tx = dx > 0 ? (W - cx) / dx : dx < 0 ? -cx / dx : Infinity;
    const ty = dy > 0 ? (H - cy) / dy : dy < 0 ? -cy / dy : Infinity;
    const t = Math.min(tx, ty);
    return [cx + dx * t, cy + dy * t];
  };
  const koseler = [[W, H], [0, H], [0, 0], [W, 0]]; // açı 0'dan saat yönünde (y aşağı)
  const f = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2; const a1 = ((i + 1) / n) * Math.PI * 2;
    const c0 = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R]; const c1 = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R];
    const r0 = kenar(a0); const r1 = kenar(a1);
    const poly = [c0, c1, r1];
    koseler.forEach(([kx, ky]) => { const ak = (Math.atan2(ky - cy, kx - cx) + Math.PI * 2) % (Math.PI * 2); if (ak > a0 + 1e-6 && ak < a1 - 1e-6) poly.push([kx, ky]); });
    poly.push(r0);
    f.push(F(poly, c, s));
  }
  return f;
};

/** Orta çizgi + kalınlık fonksiyonundan "boru" çokgeni (kuyruk, boyun, gövde parçası). yol: [[x,y]…], w(t): yarı kalınlık. ok: yalnızca bir yan (-1 sol, 1 sağ, 0 iki yan) */
export const boru = (yol, w, taraf = 0) => {
  const n = yol.length;
  const sol = []; const sag = [];
  for (let i = 0; i < n; i++) {
    const a = yol[Math.max(0, i - 1)]; const b = yol[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0]; const dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m; const ny = dx / m;
    const hw = w(i / (n - 1));
    sol.push([yol[i][0] + nx * hw * (taraf === 1 ? 0 : 1), yol[i][1] + ny * hw * (taraf === 1 ? 0 : 1)]);
    sag.push([yol[i][0] - nx * hw * (taraf === -1 ? 0 : 1), yol[i][1] - ny * hw * (taraf === -1 ? 0 : 1)]);
  }
  return [...sol, ...sag.reverse()];
};
/** Bezier (kuadratik/kübik) örnekleri */
export const egri = (pts, n = 12) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; const u = 1 - t;
    if (pts.length === 3) out.push([u * u * pts[0][0] + 2 * u * t * pts[1][0] + t * t * pts[2][0], u * u * pts[0][1] + 2 * u * t * pts[1][1] + t * t * pts[2][1]]);
    else out.push([u ** 3 * pts[0][0] + 3 * u * u * t * pts[1][0] + 3 * u * t * t * pts[2][0] + t ** 3 * pts[3][0], u ** 3 * pts[0][1] + 3 * u * u * t * pts[1][1] + 3 * u * t * t * pts[2][1] + t ** 3 * pts[3][1]]);
  }
  return out;
};
