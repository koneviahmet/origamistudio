// ═══════════════════════════════════════════════════════════════════════════
//  "Atomun Hikâyesi" — çizim/boya stili, pastel, "matruşka atom" (her model bir öncekinin içine dalar)
//    node scripts/seed-atom.mjs                       (varlıklar)
//    node scripts/scenes-atom-gelisimi.mjs --ses      (anlatımı yerel TTS ile üretir, sonra sahneyi yazar)
//    node scripts/scenes-atom-gelisimi.mjs            (sesler hazırsa yalnızca sahneyi yazar)
//  --dikey            → 9:16 (1080×1920) sürüm: proje 'atom-gelisimi-dikey' (üstte model, altta yıl ve maddeler)
//  Seçenekler: --ses-id <id|ad> (ses), --etiket "Anlatıcı,Sakin,Genç" (ses seçimi, varsayılan), --cinsiyet erkek|kadin
//  Süreler anlatım dosyalarının gerçek uzunluğundan hesaplanır (data/audio/atom-anlatim-N.wav).
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { createTts } from '../server/tts.js';
import { wavOku, zarfCikar, ROOT } from './sablonlar/lib.mjs';

const DIKEY = process.argv.includes('--dikey');
const PROJE_ID = DIKEY ? 'atom-gelisimi-dikey' : 'atom-gelisimi';
const PROJE_ADI = DIKEY ? 'Atomun Hikâyesi (dikey)' : 'Atomun Hikâyesi';
const W = DIKEY ? 1080 : 1920;
const H = DIKEY ? 1920 : 1080;
const FPS = 30;
const INK = '#4b3f72'; // kontur ve ana yazı
const METIN = '#6b5f8f';
const VURGU = '#f28482';
// Yatay: solda model, sağda yazı paneli. Dikey (9:16): üstte model, altta panel; güvenli alan y 250–1450, sağ kenar (y>860) boş
const S = DIKEY ? { x: 540, y: 790 } : { x: 600, y: 520 }; // sahne (model) merkezi
const PX = DIKEY ? 540 : 1440; // panel merkezi
const Z = DIKEY ? 1.05 : 1.2; // sahne (model) büyütme oranı, S merkezli
// Panel yerleşimi (yıl, ad, maddeler, açılış/kapanış başlığı)
const LY = DIKEY
  ? { yilY: 300, yilS: 120, adY: 412, adS: 58, m0: 1325, mAdim: 105, mS: 42, t1Y: 380, t1S: 124, t2Y: 1150, t2S: 46, kpY: 380, kpS: 120, kp2Y: 1330, kp2S: 46 }
  : { yilY: 290, yilS: 158, adY: 430, adS: 66, m0: 575, mAdim: 135, mS: 46, t1Y: 340, t1S: 136, t2Y: 640, t2S: 50, kpY: 350, kpS: 130, kp2Y: 640, kp2S: 46 };
const zx = (x) => S.x + (x - S.x) * Z;
const zy = (y) => S.y + (y - S.y) * Z;
const zp = (p) => [zx(p[0]), zy(p[1])];

// Pastel paletler (atom-kure: a = gövde, c = parlama)
const PAL = {
  seftali: { a: '#ffc8a8', c: '#fff4ea' },
  nane: { a: '#b5ead7', c: '#f0fff9' },
  lavanta: { a: '#cdb4f6', c: '#f3ecff' },
  gok: { a: '#9bd4f5', c: '#eaf7ff' },
  gul: { a: '#ffc2d1', c: '#fff0f4' },
  tereyagi: { a: '#ffe29a', c: '#fff9e3' },
};

// ─── Anlatım metni (rakamlar yazıyla: TTS doğru okusun) ────────────────────
const BOLUMLER = [
  { id: 'acilis', min: 6.5, narr: 'Her şey küçücük bir soruyla başladı: bir şeyi bölmeye devam edersek ne olur?' },
  { id: 'demokritos', min: 11, narr: 'Yaklaşık iki bin dört yüz yıl önce Demokritos, maddenin bölünemeyen en küçük parçalardan oluştuğunu düşündü. Bu parçaya atomos dedi: bölünemez.' },
  { id: 'dalton', min: 10, narr: 'Bin sekiz yüz üçte Dalton, atomu yeniden gündeme getirdi. Ona göre her element, kendine özgü, katı ve bölünemez küçük toplardan oluşuyordu.' },
  { id: 'thomson', min: 11, narr: 'Bin sekiz yüz doksan yedide Thomson, atomdan bile küçük bir parçacık buldu: elektron. Atomu, içine elektronlar serpiştirilmiş, yumuşak bir kek gibi hayal etti.' },
  { id: 'rutherford', min: 14, narr: 'Bin dokuz yüz on birde Rutherford, ince bir altın levhaya ışın parçacıkları gönderdi. Çoğu geçti, bazıları geri sekti. Demek ki atomun ortasında küçük ve yoğun bir çekirdek vardı, geri kalanı ise neredeyse boşluktu.' },
  { id: 'bohr', min: 10, narr: 'Bin dokuz yüz on üçte Bohr, elektronların çekirdeğin çevresinde belirli yörüngelerde döndüğünü önerdi. Tıpkı küçük bir güneş sistemi gibi.' },
  { id: 'bulut', min: 12, narr: 'Sonra kuantum fiziği geldi. Elektronun tam yerini bilemeyiz, yalnızca nerede bulunma ihtimalinin yüksek olduğunu söyleyebiliriz. Bu yüzden bugün elektronlar bir bulut olarak çizilir.' },
  { id: 'kapanis', min: 7, narr: 'Atomun hikâyesi hâlâ bitmedi. Merak ettikçe daha derine inmeye devam ediyoruz.' },
];
const ad = (i) => `atom-anlatim-${i + 1}.wav`;
const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);

// ─── 1. Anlatım sesleri (yerel TTS) ────────────────────────────────────────
const audioDir = path.join(ROOT, 'data', 'audio');
if (argv.includes('--ses') || BOLUMLER.some((_, i) => !fs.existsSync(path.join(audioDir, ad(i))))) {
  const tts = createTts();
  try {
    let sesId = opt('ses-id');
    if (!sesId) {
      const g = { erkek: 'male', kadin: 'female' }[opt('cinsiyet', 'kadin')] || 'female';
      const aday = await tts.byTag(opt('etiket', 'Anlatıcı,Sakin,Genç'), { gender: g });
      if (!aday.length) throw new Error('Etiketlere uyan ses yok');
      sesId = aday[0].id;
      console.log(`Ses: ${sesId} — ${aday[0].description}`);
      if (!aday[0].saved) await tts.save(sesId, 'pastel-anlatici'); // /ses sayfasında "Kayıtlı sesler"de görünsün
    }
    for (const [i, b] of BOLUMLER.entries()) {
      const r = await tts.synth({ text: b.narr, voice: sesId, out: path.join(audioDir, ad(i)) });
      console.log(`[${i + 1}/${BOLUMLER.length}] ${b.id}: ${r.dur} sn`);
    }
  } finally {
    if (tts.spawnedHere()) tts.stop();
  }
}
const sure = BOLUMLER.map((_, i) => {
  const w = wavOku(ad(i));
  return w ? w.mono.length / w.sampleRate : 0;
});

// ─── 2. Zaman planı: bölüm süresi = max(görsel asgari, anlatım + pay) ──────
const GIRIS = 1.0; // bölüm başından anlatımın başlamasına (dalış geçişi)
const T = [];
let cur = 0;
BOLUMLER.forEach((b, i) => {
  const t0 = cur;
  const bas = t0 + (i === 0 ? 0.7 : GIRIS);
  const t1 = t0 + Math.max(b.min, bas - t0 + sure[i] + (i === BOLUMLER.length - 1 ? 2.6 : 1.5));
  T.push({ t0, t1, narr: bas, dur: sure[i] });
  cur = t1;
});
const SURE = Math.ceil((cur + 0.4) * 10) / 10;

// ─── 3. Yardımcılar ────────────────────────────────────────────────────────
const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

/** Model katmanı (çizerek girer) */
const model = (id, group, asset, x, y, scale, t, o = {}) =>
  L({
    id, group, asset, x: zx(x), y: zy(y), scale: r2(scale * Z), anchor: [0.5, 0.5], start: t, ...(o.end ? { end: o.end } : {}),
    ...(o.palette ? { palette: o.palette } : {}), ...(o.rotation ? { rotation: o.rotation } : {}), ...(o.scaleY ? { scaleY: o.scaleY } : {}),
    ...(o.parts ? { parts: o.parts } : {}),
    anims: [{ preset: 'cizerek-gir', t: o.draw ?? t + 0.3, dur: o.dur ?? 1.6 }, ...(o.anims || [])],
  });

/** Bölüm sonu "dalış": nesne merkezden dışa şişip solar (yeni model bunun içinden çıkar) */
const dalis = (layer, t1, f = 4.5) => {
  const x = layer.x;
  const y = layer.y;
  const s = layer.scale;
  layer.x = [k(t1 - 1.2, x), k(t1 + 0.25, S.x + (x - S.x) * f, 'inCubic')];
  layer.y = [k(t1 - 1.2, y), k(t1 + 0.25, S.y + (y - S.y) * f, 'inCubic')];
  layer.scale = [k(t1 - 1.2, s), k(t1 + 0.25, s * f, 'inCubic')];
  layer.opacity = [k(t1 - 0.9, 1), k(t1 + 0.2, 0, 'inQuad')];
  layer.end = t1 + 0.3;
  return layer;
};

const panelText = (id, g, text, y, t0, t1, o = {}) =>
  L({
    id, group: g, type: 'text', text, x: PX, y, start: t0, end: t1, font: o.font || 'Quicksand', weight: o.weight || 700, size: o.size || 46,
    color: o.color || METIN, align: 'center', lineHeight: 1.22,
    ...(o.reveal ? { reveal: [k(o.reveal, 0), k(o.reveal + (o.revDur || 1.2), 1, 'linear')] } : {}),
    ...(o.textAnims ? { textAnims: o.textAnims } : {}),
    anims: [{ preset: 'sol', t: t1 - 0.55, dur: 0.4 }],
  });

/** Sağ panel: yıl (büyük) + ad + maddeler (daktilo) */
const panel = (g, i, { year, name, bullets, bulletsV }) => {
  const { t0, t1, narr } = T[i];
  panelText(`${g}-yil`, g, year, LY.yilY, t0 + 0.6, t1, { font: 'Mali', size: LY.yilS, color: INK, textAnims: [{ preset: 'harf-zipla', t: t0 + 0.7, dur: 0.45, aralik: 0.06 }] });
  panelText(`${g}-ad`, g, name, LY.adY, t0 + 0.9, t1, { font: 'Mali', weight: 600, size: LY.adS, color: VURGU, textAnims: [{ preset: 'harf-belir', t: t0 + 1.0, dur: 0.4, aralik: 0.04 }] });
  (DIKEY && bulletsV ? bulletsV : bullets).forEach((b, j) => panelText(`${g}-m${j + 1}`, g, b, LY.m0 + j * LY.mAdim, t0 + 1.3, t1, { size: LY.mS, reveal: narr + 0.6 + j * 2.4, revDur: 1.3 }));
};

const etiket = (id, g, text, x, y, t0, t1, size = 40) =>
  L({ id, group: g, type: 'text', text, x: zx(x), y: zy(y), start: t0, end: t1, font: 'Mali', weight: 600, size, color: INK, align: 'center', anims: [{ preset: 'belir', t: t0, dur: 0.5 }, { preset: 'sol', t: t1 - 0.5, dur: 0.4 }] });

/** El çizimi ok: etiketten hedefe (kalem ucu, hafif titrek) */
const ok = (id, g, from, to, t0, t1, o = {}) =>
  L({
    id, group: g, type: 'arrow', arrow: 'ok-el-cizimi', from, to, color: INK, width: 4, headSize: 30, bend: o.bend ?? 0.25, start: t0, end: t1,
    anims: [{ preset: 'cizerek-gir', t: t0, dur: 0.9 }, { preset: 'silinerek-cik', t: t1 - 0.7, dur: 0.6 }],
  });

/** Atom logosu (açılış ve kapanış): çekirdek + üç eğik yörünge, elektronlar döner */
const logo = (p, g, t0, t1, ciz = 0.3) => {
  const out = [];
  [[0, 3.4, 0], [60, 4.4, 0.3], [120, 5.4, 0.6]].forEach(([rot, per, ph], n) => {
    out.push(model(`${p}-yor${n + 1}`, g, 'atom-yorunge', S.x, S.y, 2.3, t0, {
      rotation: rot, scaleY: 0.42, palette: { a: ['#cdb4f6', '#b5ead7', '#ffc8a8'][n], e: ['#9bd4f5', '#ffc2d1', '#ffe29a'][n] }, draw: t0 + ciz + n * 0.35, dur: 1.5,
      parts: { e: { loops: [{ prop: 'rotation', type: 'saw', amp: 180, period: per, phase: ph, start: t0 + ciz + n * 0.35 + 1.4 }] } },
    }));
  });
  out.push(model(`${p}-cek`, g, 'atom-cekirdek', S.x, S.y, 1.05, t0, { draw: t0 + ciz, dur: 1.2, anims: [{ preset: 'nabiz', t: t0 + 2, genlik: 0.06, periyot: 1.6 }] }));
  return out;
};

// ─── 4. Bölümler ───────────────────────────────────────────────────────────
const G = {};
BOLUMLER.forEach((b) => (G[b.id] = `g-${b.id}`));

// 0 · Açılış
{
  const { t0, t1 } = T[0];
  const ls = logo('ac', G.acilis, t0, t1);
  ls.forEach((l) => dalis(l, t1));
  panelText('ac-baslik', G.acilis, 'Atomun\nHikâyesi', LY.t1Y, t0 + 0.5, t1, { font: 'Mali', size: LY.t1S, color: INK, textAnims: [{ preset: 'harf-zipla', t: t0 + 0.6, dur: 0.45, aralik: 0.05 }] });
  panelText('ac-alt', G.acilis, 'en küçük parçanın\nbüyük yolculuğu', LY.t2Y, t0 + 0.9, t1, { size: LY.t2S, reveal: t0 + 1.4, revDur: 1.4 });
}

// 1 · Demokritos: blok bölünür, bölünür… sonunda "atomos"
{
  const { t0, t1, narr, dur } = T[1];
  const g = G.demokritos;
  panel(g, 1, { year: 'MÖ ~400', name: 'Demokritos', bullets: ['Madde sonsuza dek\nbölünemez', 'En küçük parçaya\n“atomos” dedi'] });
  const a1 = t0 + 1.2;
  const a2 = narr + dur * 0.38;
  const a3 = narr + dur * 0.62;
  const a4 = narr + dur * 0.82;
  model('d-blok', g, 'atom-blok', S.x, S.y, 1.8, t0, { end: a2 + 0.05, draw: a1, dur: 1.6 });
  // 4 blok
  const dort = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], n) => {
    const l = model(`d-b${n + 1}`, g, 'atom-blok', S.x + sx * 96, S.y + sy * 96, 0.88, a2, { draw: a2, dur: 0.55, palette: n % 2 ? { a: '#ffd9a8', b: '#ffc785' } : undefined, anims: [{ preset: 'zipla-gir', t: a2, dur: 0.5 }] });
    l.x = [k(a2, zx(S.x + sx * 96)), k(a2 + 0.7, zx(S.x + sx * 112), 'outCubic')];
    l.y = [k(a2, zy(S.y + sy * 96)), k(a2 + 0.7, zy(S.y + sy * 112), 'outCubic')];
    return l;
  });
  // üst-sol blok bir kez daha bölünür: 4 minik
  dort[0].end = a3 + 0.05;
  const mini = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], n) => {
    const bx = S.x - 112;
    const by = S.y - 112;
    const l = model(`d-m${n + 1}`, g, 'atom-blok', bx + sx * 44, by + sy * 44, 0.42, a3, { draw: a3, dur: 0.45, palette: { a: '#ffe8b0', b: '#ffd98a' }, anims: [{ preset: 'zipla-gir', t: a3, dur: 0.4 }] });
    l.x = [k(a3, zx(bx + sx * 44)), k(a3 + 0.6, zx(bx + sx * 54), 'outCubic')];
    l.y = [k(a3, zy(by + sy * 44)), k(a3 + 0.6, zy(by + sy * 54), 'outCubic')];
    return l;
  });
  // son: diğerleri solar, bir tane kalır → merkeze gelir ve büyür: "atomos"
  [...dort.slice(1)].forEach((l) => {
    l.opacity = [k(a4 - 0.2, 1), k(a4 + 0.5, 0, 'inQuad')];
    l.end = a4 + 0.55;
  });
  mini.slice(0, 3).forEach((l) => {
    l.opacity = [k(a4 - 0.2, 1), k(a4 + 0.5, 0, 'inQuad')];
    l.end = a4 + 0.55;
  });
  const son = mini[3];
  const sx0 = zx(S.x - 112 + 54);
  const sy0 = zy(S.y - 112 + 54);
  // merkeze gelir, büyür; bölüm sonunda şişip solar (dalış)
  dalis(son, t1, 4);
  son.x = [k(a4, sx0), k(a4 + 1.0, S.x, 'inOutCubic')];
  son.y = [k(a4, sy0), k(a4 + 1.0, S.y, 'inOutCubic')];
  son.scale = [k(a3, 0.42 * Z), k(a4, 0.42 * Z), k(a4 + 1.0, 0.95 * Z, 'inOutCubic'), k(t1 - 1.2, 0.95 * Z), k(t1 + 0.25, 0.95 * 4 * Z, 'inCubic')];
  etiket('d-atomos', g, 'atomos', S.x, S.y - 190, a4 + 1.0, t1, 84);
  etiket('d-atomos2', g, '= bölünemez', S.x, S.y + 175, a4 + 1.4, t1, 50);
  // diğer büyük kare ve minik kareler dalış sırasında zaten bitti; ana blok ve dörtlü için dalış gerekmez
}

// 2 · Dalton: katı toplar
{
  const { t0, t1, narr } = T[2];
  const g = G.dalton;
  panel(g, 2, { year: '1803', name: 'Dalton', bullets: ['Her element kendine özgü\nküçük bir top', 'Katı ve bölünemez'] });
  const b = [
    ['dl-buyuk', S.x - 105, S.y + 15, 1.55, PAL.seftali, 1.2],
    ['dl-orta', S.x + 175, S.y - 120, 1.05, PAL.nane, 1.9],
    ['dl-kucuk', S.x + 150, S.y + 140, 0.72, PAL.lavanta, 2.5],
  ];
  b.forEach(([id, x, y, sc, pal, d]) => dalis(model(id, g, 'atom-kure', x, y, sc, t0, { palette: pal, draw: t0 + d, dur: 1.5, anims: [{ preset: 'suzul', t: t0 + d + 1.6, genlik: 7, periyot: 3.2 }] }), t1));
  etiket('dl-not', g, 'katı · bölünemez', S.x + 10, S.y - 250, narr + 3.5, t1, 40);
}

// 3 · Thomson: üzümlü kek
{
  const { t0, t1, narr } = T[3];
  const g = G.thomson;
  panel(g, 3, { year: '1897', name: 'Thomson', bullets: ['Elektron keşfedildi', 'Atom: elektronlu,\npozitif bir kek'] });
  dalis(model('th-kek', g, 'atom-kure', S.x, S.y, 2.05, t0, { palette: PAL.gul, draw: t0 + 0.9, dur: 1.9 }), t1);
  const P = [[-150, -10], [-72, -125], [90, -92], [150, 42], [-22, 72], [42, 22], [-90, 138], [72, 136], [-72, -38]];
  const E = [[-105, -80], [35, -125], [120, -30], [-45, 4], [75, 88], [-115, 75], [10, 138], [-2, -52]];
  P.forEach(([dx, dy], n) => {
    const l = L({ id: `th-p${n + 1}`, group: g, type: 'text', text: '+', x: zx(S.x + dx), y: zy(S.y + dy), start: narr + 0.4 + n * 0.12, end: t1 + 0.3, font: 'Mali', weight: 700, size: 54, color: '#e5738f', align: 'center', anims: [{ preset: 'belir', t: narr + 0.4 + n * 0.12, dur: 0.4 }] });
    l.x = [k(t1 - 1.2, zx(S.x + dx)), k(t1 + 0.25, S.x + dx * Z * 4.5, 'inCubic')];
    l.y = [k(t1 - 1.2, zy(S.y + dy)), k(t1 + 0.25, S.y + dy * Z * 4.5, 'inCubic')];
    l.opacity = [k(t1 - 0.9, 1), k(t1 + 0.2, 0, 'inQuad')];
  });
  E.forEach(([dx, dy], n) => {
    const t = narr + 1.6 + n * 0.28;
    dalis(model(`th-e${n + 1}`, g, 'atom-kure', S.x + dx, S.y + dy, 0.19, t, { palette: PAL.gok, draw: t, dur: 0.7, anims: [{ preset: 'nabiz', t: t + 0.8, genlik: 0.12, periyot: 1.8 + (n % 3) * 0.3 }] }), t1);
  });
  etiket('th-lbl-e', g, 'elektron', S.x + 300, S.y - 250, narr + 2.2, t1, 40);
  ok('th-ok-e', g, 'th-lbl-e', 'th-e2', narr + 2.6, t1, { bend: -0.3 });
  etiket('th-lbl-k', g, 'pozitif yüklü kek', S.x - 270, S.y + 265, narr + 5.0, t1, 38);
  ok('th-ok-k', g, 'th-lbl-k', 'th-kek', narr + 5.4, t1, { bend: 0.3 });
}

// 4 · Rutherford: altın levha deneyi → çekirdek
{
  const { t0, t1, narr, dur } = T[4];
  const g = G.rutherford;
  panel(g, 4, { year: '1911', name: 'Rutherford', bullets: ['Altın levha deneyi', 'Ortada küçük, yoğun\nbir çekirdek', 'Atomun çoğu boşluk'], bulletsV: ['Ortada küçük, yoğun\nbir çekirdek', 'Atomun çoğu boşluk'] });
  const tB = narr + dur * 0.56; // "Demek ki …" cümlesi
  const fx = S.x + 90;
  dalis(model('ru-levha', g, 'atom-levha', fx, S.y, 1, t0, { draw: t0 + 0.9, dur: 1.3 }), tB, 3);
  dalis(model('ru-kaynak', g, 'atom-kaynak', S.x - 300, S.y, 1.05, t0, { draw: t0 + 1.4, dur: 1.2 }), tB, 3);
  // ışın parçacıkları: çoğu geçer, biri geri seker
  const ys = [-150, -95, -45, 0, 45, 95, 150];
  ys.forEach((dy, n) => {
    const ts = narr + 0.8 + n * 0.75;
    const y0 = S.y + dy * 0.45 + 0;
    const bounce = n === 3;
    const pts = bounce
      ? [[S.x - 185, y0], [fx - 30, y0], [S.x - 120, y0 - 210]].map(zp)
      : [[S.x - 185, y0], [fx, y0 + (n % 2 ? 5 : -5)], [S.x + 400, y0 + dy * 0.5]].map(zp);
    L({
      id: `ru-a${n + 1}`, group: g, asset: 'atom-kure', scale: 0.18, anchor: [0.5, 0.5], palette: { a: '#ffd166', c: '#fff7d6' }, start: ts, end: ts + 1.9,
      path: { points: pts, smooth: false }, pathT: [k(ts, 0), k(ts + 1.7, 1, 'linear')],
      anims: [{ preset: 'belir', t: ts, dur: 0.2 }, { preset: 'sol', t: ts + 1.55, dur: 0.3 }],
    });
  });
  etiket('ru-lbl-levha', g, 'altın levha', fx, S.y - 260, t0 + 2.0, tB, 36);
  // B: atomun içine dalış → halka + çekirdek + boşluk
  const hr = model('ru-atom', g, 'atom-halka', S.x, S.y, 3.3, tB - 0.2, { palette: { a: '#cdb4f6' }, draw: tB - 0.4, dur: 1.6 });
  dalis(hr, t1, 3);
  dalis(model('ru-cek', g, 'atom-cekirdek', S.x, S.y, 0.72, tB - 0.2, { draw: tB + 0.1, dur: 1.0 }), t1, 3);
  etiket('ru-lbl-cek', g, 'çekirdek', S.x + (DIKEY ? 130 : 170), S.y - (DIKEY ? 115 : 125), tB + 1.9, t1, 46);
  ok('ru-ok-cek', g, 'ru-lbl-cek', 'ru-cek', tB + 2.2, t1, { bend: -0.3 });
  etiket('ru-lbl-bos', g, 'boşluk', S.x - (DIKEY ? 115 : 150), S.y + (DIKEY ? 120 : 135), tB + 3.0, t1, 46);
  const pA = [[S.x - 380, S.y - 150], [S.x + 380, S.y - 150]].map(zp);
  const pB = [[S.x - 380, S.y - 6], [S.x - 34, S.y - 6], [S.x - 250, S.y - 240]].map(zp);
  [[pA, 'ru-g1', tB + 1.6], [pB, 'ru-g2', tB + 2.8]].forEach(([pts, id, ts]) =>
    L({ id, group: g, asset: 'atom-kure', scale: 0.18, anchor: [0.5, 0.5], palette: { a: '#ffd166', c: '#fff7d6' }, start: ts, end: ts + 2.1, path: { points: pts, smooth: false }, pathT: [k(ts, 0), k(ts + 1.9, 1, 'linear')], anims: [{ preset: 'belir', t: ts, dur: 0.2 }, { preset: 'sol', t: ts + 1.7, dur: 0.3 }] }));
}

// 5 · Bohr: yörüngeler
{
  const { t0, t1, narr } = T[5];
  const g = G.bohr;
  panel(g, 5, { year: '1913', name: 'Bohr', bullets: ['Elektronlar belirli\nyörüngelerde döner', 'Küçük bir güneş sistemi'] });
  const R = [[108, 3.2, 0, '#cdb4f6', '#9bd4f5'], [186, 5.2, 0.35, '#b5ead7', '#ffc2d1'], [264, 7.4, 0.7, '#ffc8a8', '#ffe29a']];
  R.forEach(([r, per, ph, c1, c2], n) => {
    const td = t0 + 1.3 + n * 0.9;
    dalis(model(`bo-y${n + 1}`, g, 'atom-yorunge', S.x, S.y, r / 88, t0, {
      palette: { a: c1, e: c2 }, draw: td, dur: 1.5,
      parts: { e: { loops: [{ prop: 'rotation', type: 'saw', amp: 180, period: per, phase: ph, start: td + 1.4 }] } },
    }), t1);
    // yörünge numarası: halkanın hemen dışında, sağ üst çapraz hatta (birbirinden ayrı yükseklikte)
    etiket(`bo-n${n + 1}`, g, String(n + 1), S.x + (r + 24) * Math.cos(-0.62), S.y + (r + 24) * Math.sin(-0.62), td + 1.6, t1, 42);
  });
  dalis(model('bo-cek', g, 'atom-cekirdek', S.x, S.y, 0.85, t0, { draw: t0 + 0.5, dur: 1.0 }), t1);
  etiket('bo-lbl', g, 'yörünge', S.x - 250, S.y - 300, narr + 2.2, t1, 38);
  ok('bo-ok', g, 'bo-lbl', 'bo-y2', narr + 2.6, t1, { bend: 0.3 });
}

// 6 · Elektron bulutu
{
  const { t0, t1, narr } = T[6];
  const g = G.bulut;
  panel(g, 6, { year: '1926', name: 'Elektron bulutu', bullets: ['Yer değil, olasılık', 'Bulut yoğunsa elektron\norada olası'] });
  dalis(model('bl-bulut', g, 'atom-bulut', S.x, S.y, 2.45, t0, { draw: t0 + 0.9, dur: 2.0, anims: [{ preset: 'nefes', t: t0 + 3, genlik: 0.025, periyot: 4 }] }), t1);
  dalis(model('bl-cek', g, 'atom-cekirdek', S.x, S.y, 0.55, t0, { draw: t0 + 1.8, dur: 0.9 }), t1);
  L({
    id: 'bl-toz', group: g, type: 'particles', preset: 'yildiz-tozu', mode: 'surekli', count: 70, size: 38, speed: 0.5, seed: 7, prewarm: true,
    colors: ['#6fb3e8', '#f2829a', '#f5c84c', '#8fd6b4'], area: [zx(S.x - 250), zy(S.y - 250), 500 * Z, 500 * Z], start: narr + 0.8, end: t1 + 0.2,
  });
  etiket('bl-lbl', g, 'elektronun olası yeri', S.x - 10, S.y + (DIKEY ? 315 : 300), narr + 4.5, t1, 44);
}

// 7 · Kapanış: başa dönüş (logo)
{
  const { t0, t1 } = T[7];
  const g = G.kapanis;
  logo('kp', g, t0, t1 + 0.4, 0.6).forEach((l) => (l.end = SURE));
  panelText('kp-baslik', g, 'Hikâye\nsürüyor…', LY.kpY, t0 + 0.8, SURE, { font: 'Mali', size: LY.kpS, color: INK, textAnims: [{ preset: 'harf-zipla', t: t0 + 0.9, dur: 0.45, aralik: 0.06 }] });
  panelText('kp-alt', g, 'merak ettikçe\nderine iniyoruz', LY.kp2Y, t0 + 1.3, SURE, { size: LY.kp2S, reveal: t0 + 1.8, revDur: 1.4 });
}

// ─── 5. Zaman şeridi (altta): yıllar + el çizimi oklar ─────────────────────
const ZAMAN = [
  ['MÖ ~400', 1, PAL.tereyagi],
  ['1803', 2, PAL.seftali],
  ['1897', 3, PAL.gul],
  ['1911', 4, PAL.gok],
  ['1913', 5, PAL.nane],
  ['1926', 6, PAL.lavanta],
];
const ZX = (i) => (DIKEY ? 150 + i * 156 : 250 + i * 292);
const ZY = DIKEY ? 1185 : 975;
ZAMAN.forEach(([yil, b, pal], i) => {
  const t = T[b].t0 + 1.5;
  const son = T[BOLUMLER.length - 1].t1;
  L({
    id: `zm-n${i + 1}`, group: 'g-zaman', asset: 'atom-kure', x: ZX(i), y: ZY, scale: DIKEY ? 0.22 : 0.2, anchor: [0.5, 0.5], palette: pal, start: t, end: SURE,
    anims: [{ preset: 'cizerek-gir', t, dur: 0.9 }, ...(b < 6 ? [{ preset: 'nabiz', t: t + 1, dur: T[b].t1 - t - 1, genlik: 0.12, periyot: 1.4 }] : [])],
  });
  L({ id: `zm-y${i + 1}`, group: 'g-zaman', type: 'text', text: yil, x: ZX(i), y: ZY + (DIKEY ? 50 : 56), start: t + 0.4, end: SURE, font: 'Quicksand', weight: 700, size: DIKEY ? 31 : 32, color: METIN, align: 'center', anims: [{ preset: 'belir', t: t + 0.4, dur: 0.5 }] });
  if (i > 0)
    L({ id: `zm-ok${i}`, group: 'g-zaman', type: 'arrow', arrow: 'ok-el-cizimi', from: `zm-n${i}`, to: `zm-n${i + 1}`, color: '#b7a9d9', width: 3.8, head: 'yok', bend: 0.18, start: t, end: SURE, anims: [{ preset: 'cizerek-gir', t, dur: 1.0 }] });
});

// ─── 6. Sahne ──────────────────────────────────────────────────────────────
const scene = {
  name: PROJE_ADI,
  width: W,
  height: H,
  fps: FPS,
  duration: SURE,
  style: 'cizim',
  theme: {
    name: 'Pastel Laboratuvar',
    paper: 'pastel',
    adjust: { saturation: 0.95, brightness: 0.02 },
    colors: { arka1: '#fff7ec', arka2: '#f8e4ef', baslik: INK, metin: METIN, vurgu: VURGU },
    background: { type: 'radial', colors: ['$arka1', '$arka2'], cx: 0.32, cy: 0.5, radius: 0.95 },
    vignette: 0.1,
  },
  sketch: { ink: INK, width: 3.6, wobble: 1.7, hatch: 6.5, angle: 52, cross: true, wipe: 38, grain: 0.42, split: 0.5 },
  audio: BOLUMLER.map((_, i) => {
    const f = ad(i);
    const tr = { file: f, start: r2(T[i].narr), offset: 0, dur: null, volume: 1, fadeIn: 0, fadeOut: 0, mute: false };
    const env = zarfCikar(f, FPS);
    if (env) tr.env = env;
    return tr;
  }),
  sfx: { auto: true, volume: 0.28 },
  sections: BOLUMLER.map((b, i) => ({ t: r2(T[i].t0), name: ['Açılış', 'Demokritos', 'Dalton', 'Thomson', 'Rutherford', 'Bohr', 'Elektron bulutu', 'Kapanış'][i] })),
  groups: [...BOLUMLER.map((b) => ({ id: G[b.id], name: b.id, collapsed: true })), { id: 'g-zaman', name: 'Zaman şeridi' }],
  layers: JSON.parse(JSON.stringify(layers)),
};

// Müzik daha önce eklendiyse (npm run muzik) koru
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
const sf = path.join(dir, 'scene.json');
if (fs.existsSync(sf)) {
  try {
    const eski = JSON.parse(fs.readFileSync(sf, 'utf8'));
    const m = (eski.audio || []).filter((t) => !/^atom-anlatim-/.test(t.file));
    scene.audio.push(...m);
  } catch { /* yok say */ }
} else if (DIKEY) {
  // dikey proje ilk kez yazılıyor: yatay sürümdeki müzik iz(ler)ini devral
  try {
    const yatay = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects', 'atom-gelisimi', 'scene.json'), 'utf8'));
    scene.audio.push(...(yatay.audio || []).filter((t) => !/^atom-anlatim-/.test(t.file)));
  } catch { /* yatay yok */ }
}
fs.writeFileSync(sf, JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
console.log(T.map((t, i) => `${BOLUMLER[i].id} ${t.t0.toFixed(1)}–${t.t1.toFixed(1)}`).join(' | '));
