// ═══════════════════════════════════════════════════════════════════════════
//  ODADAN CEBE — bilgisayarların kısa tarihi (serbest mod, konsept: "Küçülen Dev")
//  Kural: her çağda makine KÜÇÜLÜR (BOYUT çubuğu), güç ARTAR (GÜÇ çubuğu).
//  Başlık da aynı oyunu oynar: "ODADAN" devasa, "cebe" minicik. Her çağ = renkli kağıt tabaka.
//  Önce:  node scripts/seed-bilgisayar.mjs   (yeni modeller)   Sonra: node scripts/scenes-bilgisayarin-yolculugu.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJE_ID = 'bilgisayarin-yolculugu';
const PROJE_ADI = 'Odadan Cebe — Bilgisayarın Yolculuğu';
const W = 1080, H = 1920, FPS = 30;

const r2 = (n) => Math.round(n * 100) / 100;
const k = (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v });
const layers = [];
const L = (o) => (layers.push(o), o);

const TEMA = {
  name: 'Silikon', paper: 'mat',
  colors: { arka1: '#06100e', arka2: '#10302a', baslik: '#d8fbe6', metin: '#b9ddc9', vurgu: '#ffb000' },
  background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180 }, vignette: 0.28,
};
const YIL = 'Russo One';   // başlık / yıl
const MONO = 'Space Mono'; // gövde (Türkçe glifleri doğrulandı)

// ─── Çağlar: zaman, renkler, HUD değerleri ────────────────────────────────
const ERA = {
  hook:   { t0: 0,    t1: 4.5,  bg: '#06100e', ink: '#d8fbe6', acc: '#ffb000', onAcc: '#06100e' },
  cark:   { t0: 4.5,  t1: 11.5,   bg: '#eadfc2', ink: '#3a2a16', acc: '#a4561a', onAcc: '#fff6e0' },
  tup:    { t0: 11.5, t1: 18.5, bg: '#141b24', ink: '#e6ecf2', acc: '#ffb000', onAcc: '#141b24', boyut: 1.0, guc: 0.03, kelime: 'bir salon' },
  trans:  { t0: 18.5, t1: 23.5, bg: '#1f3a4d', ink: '#eaf3fa', acc: '#ffd166', onAcc: '#1f3a4d', boyut: 0.55, guc: 0.08, kelime: 'bir dolap' },
  cip:    { t0: 23.5, t1: 29,   bg: '#0c4a3a', ink: '#e9fff3', acc: '#f2c14e', onAcc: '#0c4a3a', boyut: 0.3, guc: 0.2, kelime: 'bir kutu' },
  pc:     { t0: 29,   t1: 35.5, bg: '#23349c', ink: '#ffffff', acc: '#ffe14d', onAcc: '#23349c', boyut: 0.14, guc: 0.34, kelime: 'bir masa' },
  ag:     { t0: 35.5, t1: 42.5, bg: '#0a3a4a', ink: '#e6fbff', acc: '#ff6fb5', onAcc: '#0a3a4a', boyut: 0.07, guc: 0.5, kelime: 'bir kucak' },
  cep:    { t0: 42.5, t1: 49,   bg: '#eef1f6', ink: '#1e2233', acc: '#5b5bff', onAcc: '#ffffff', boyut: 0.03, guc: 0.75, kelime: 'bir avuç' },
  bugun:  { t0: 49,   t1: 56,   bg: '#0a0a1f', ink: '#e9eaff', acc: '#3bf4fb', onAcc: '#0a0a1f', boyut: 0.012, guc: 1.0, kelime: 'bir çip' },
  kapanis:{ t0: 56,   t1: 61.5,  bg: '#06100e', ink: '#d8fbe6', acc: '#ffb000', onAcc: '#06100e' },
};
const SURE = ERA.kapanis.t1;
const order = Object.keys(ERA);
let prev = null;

// ─── Yardımcılar ───────────────────────────────────────────────────────────
const txt = (id, group, text, x, y, e, o = {}) => L({
  id, group, type: 'text', text, x, y, font: o.font || MONO, weight: o.weight || 700, size: o.size || 40,
  color: o.color || e.ink, align: o.align || 'center', lineHeight: o.lh || 1.22,
  start: o.start ?? e.t0, end: o.end ?? e.t1, ...(o.extra || {}),
});
/** Daktilo satırı */
const satir = (id, g, text, y, e, at, o = {}) => txt(id, g, text, W / 2, y, e, {
  size: o.size || 38, start: e.t0, end: e.t1, ...o,
  extra: { reveal: [k(e.t0 + at, 0), k(e.t0 + at + (o.sure || 1.1), 1, 'linear')], ...(o.extra || {}) },
});
const yilYaz = (id, g, yil, e, y = 335, at = 0.15) => txt(id, g, yil, W / 2, y, e, {
  font: YIL, weight: 400, size: 215, color: e.acc,
  extra: { textAnims: [{ preset: 'harf-dus', t: e.t0 + at, dur: 0.6, aralik: 0.07 }], shadow: { color: 'rgba(0,0,0,.32)', blur: 0, x: 8, y: 9 }, letterSpacing: 4 },
});
const etiket = (id, g, text, e, y = 478, at = 0.6) => txt(id, g, text, W / 2, y, e, {
  size: 32, color: e.onAcc,
  extra: { uppercase: true, letterSpacing: 5, box: { color: e.acc, radius: 10, padding: [16, 30], opacity: 1 }, anims: [{ preset: 'zipla-gir', t: e.t0 + at, dur: 0.55 }] },
});
const sheet = (id, g, e) => L({
  id, group: g, asset: 'tabaka', x: W / 2, y: H / 2, anchor: [0.5, 0.5], scaleX: (W + 120) / 100, scaleY: (H + 120) / 100,
  palette: { a: e.bg }, shadow: false, start: e.t0, end: e.t1, sfx: false,
});
const hero = (id, g, asset, x, y, px, size, e, o = {}) => L({
  id, group: g, asset, x, y, anchor: [0.5, 0.5], scale: r2(px / size), start: o.start ?? e.t0, end: o.end ?? e.t1, ...(o.extra || {}),
  anims: [
    { preset: o.giris || 'katlanarak-gir', t: (o.start ?? e.t0) + (o.delay ?? 0.5), dur: o.dur ?? 1.0, ...(o.giris === 'katlanarak-gir' || !o.giris ? { sira: 'radial' } : {}) },
    ...(o.anims || [{ preset: 'suzul', t: (o.start ?? e.t0) + 1.5, genlik: 9, periyot: 3.2 }]),
  ],
});
/** BOYUT ↓ / GÜÇ ↑ göstergesi (her çağda önceki değerden yeni değere akar) */
const hud = (e, g, id) => {
  const pv = prev || { boyut: 1, guc: 0.02 };
  const Y1 = 1395, Y2 = 1452, X0 = 388, MAXL = 540;
  const lab = (n, y, s) => txt(`${id}-lab${n}`, g, s, 62, y, e, { size: 27, align: 'left', color: e.ink, extra: { anims: [{ preset: 'belir', t: e.t0 + 0.9, dur: 0.5 }], uppercase: false } });
  lab(1, Y1, `BOYUT · ${e.kelime}`);
  lab(2, Y2, 'GÜÇ · işlem hızı');
  for (const [n, y, key] of [[1, Y1, 'boyut'], [2, Y2, 'guc']]) {
    L({
      id: `${id}-bar${n}`, group: g, asset: 'cubuk', anchor: [0, 0.5], x: X0, y, scaleY: 1.25, palette: { a: e.acc }, sfx: false, start: e.t0, end: e.t1,
      scaleX: [k(e.t0, Math.max(0.06, (MAXL * pv[key]) / 100)), k(e.t0 + 1.0, Math.max(0.06, (MAXL * pv[key]) / 100)), k(e.t0 + 2.3, Math.max(0.06, (MAXL * e[key]) / 100), [0.34, 1.56, 0.64, 1])],
      shadow: false,
    });
  }
  prev = e;
};
const info = (id, g, e, a, b) => {
  if (a) satir(`${id}-1`, g, a, 1135, e, 0.9, { size: 41, sure: 1.1 });
  if (b) satir(`${id}-2`, g, b, 1268, e, 1.9, { size: 41, sure: 1.1 });
};
const rain = (id, g, e, o = {}) => {
  for (const [i, p] of [['s', 'ikili-sifir'], ['b', 'ikili-bir']])
    L({ id: `${id}-${i}`, group: g, type: 'particles', particle: p, mode: 'surekli', seed: i === 's' ? 3 : 8, opacity: o.opacity ?? 0.35, count: o.count ?? 22, depth: 0.5, blur: 2, start: e.t0, end: e.t1, sfx: false });
};

const groups = [];
const G = (id, name) => { groups.push({ id, name, collapsed: id !== 'g-cark' }); return id; };

// ═══════════════════════════ 0 — KANCA ═══════════════════════════════════
{
  const e = ERA.hook, g = G('g-hook', 'Kanca');
  sheet('hook-zemin', g, e);
  rain('hook-yagmur', g, e, { opacity: 0.45, count: 26 });
  txt('hook-prompt', g, '> zamanda_yolculuk.baslat()', W / 2, 640, e, { size: 33, color: '#7dffa8', extra: { reveal: [k(0.3, 0), k(1.5, 1, 'linear')] } });
  txt('hook-oda', g, 'ODADAN', W / 2, 905, e, {
    font: YIL, weight: 400, size: 212, color: e.ink,
    extra: { textAnims: [{ preset: 'harf-dus', t: 1.5, dur: 0.65, aralik: 0.08 }], shadow: { color: 'rgba(0,0,0,.4)', blur: 0, x: 8, y: 9 } },
  });
  txt('hook-cebe', g, 'cebe', W / 2, 1120, e, {
    size: 56, color: e.onAcc,
    extra: { uppercase: false, letterSpacing: 6, box: { color: e.acc, radius: 10, padding: [14, 34], opacity: 1 }, anims: [{ preset: 'zipla-gir', t: 3.0, dur: 0.6, yay: 'outElastic' }] },
  });
  txt('hook-alt', g, 'bilgisayarların kısa tarihi', W / 2, 1290, e, { size: 32, color: '#b9ddc9', extra: { anims: [{ preset: 'belir', t: 3.4, dur: 0.7 }], letterSpacing: 3 } });
}

// ═══════════════════════════ 1 — ÇARK (1837) ═════════════════════════════
{
  const e = ERA.cark, g = G('g-cark', '1837 · Çark');
  sheet('cark-zemin', g, e);
  L({ id: 'cark-toz', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', colors: ['#a4561a', '#d9a441'], opacity: 0.5, count: 40, seed: 5, depth: 0.5, start: e.t0, end: e.t1, sfx: false });
  yilYaz('cark-yil', g, '1837', e);
  etiket('cark-etiket', g, 'Analitik Makine', e);
  hero('cark-disli1', g, 'disli', 365, 800, 450, 200, e, { extra: {}, anims: [{ preset: 'don', t: e.t0 + 1.4, periyot: 14, yon: 1 }] });
  hero('cark-disli2', g, 'disli', 672, 882, 270, 200, e, { delay: 0.8, extra: { variant: 'celik' }, anims: [{ preset: 'don', t: e.t0 + 1.8, periyot: 8.4, yon: -1 }] });
  hero('cark-kart', g, 'delikli-kart', 860, 985, 270, 200, e, { giris: 'ekrana-gir', delay: 1.2, dur: 1.2, extra: { rotation: 8 }, anims: [{ preset: 'sallan', t: e.t0 + 2.6, aci: 3, periyot: 3 }] });
  info('cark-bilgi', g, e, 'Babbage dişlilerle çalışan bir hesap\nmakinesi tasarladı.', "Lovelace 1843'te ilk program\nsayılan notları yazdı.");
}

// ═══════════════════════════ 2 — TÜP (1945) ══════════════════════════════
{
  const e = ERA.tup, g = G('g-tup', '1945 · Vakum tüpü');
  sheet('tup-zemin', g, e);
  L({ id: 'tup-kivilcim', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', colors: ['#ffb000', '#ffd98a'], opacity: 0.6, count: 55, seed: 9, depth: 0.5, start: e.t0, end: e.t1, sfx: false });
  yilYaz('tup-yil', g, '1945', e);
  etiket('tup-etiket', g, 'Vakum tüpü çağı', e);
  hero('tup-eniac', g, 'eniac', W / 2, 805, 940, 400, e, { dur: 1.3, anims: [{ preset: 'nefes', t: e.t0 + 2, genlik: 0.012, periyot: 3 }] });
  hero('tup-tupA', g, 'vakum-tupu', 120, 960, 250, 200, e, { giris: 'dusup-gir', delay: 1.0, dur: 1.0, anims: [{ preset: 'nabiz', t: e.t0 + 2.2, genlik: 0.05, periyot: 1.6 }] });
  hero('tup-tupB', g, 'vakum-tupu', 960, 960, 250, 200, e, { giris: 'dusup-gir', delay: 1.25, dur: 1.0, anims: [{ preset: 'nabiz', t: e.t0 + 2.4, genlik: 0.05, periyot: 1.6 }] });
  info('tup-bilgi', g, e, "ENIAC: 17.000'den fazla tüp,\nyaklaşık 27 ton.", 'Saniyede 5.000 toplama,\nbir salon boyutunda.');
  hud(e, g, 'tup-hud');
}

// ═══════════════════════════ 3 — TRANSİSTÖR (1947) ═══════════════════════
{
  const e = ERA.trans, g = G('g-trans', '1947 · Transistör');
  sheet('trans-zemin', g, e);
  yilYaz('trans-yil', g, '1947', e);
  etiket('trans-etiket', g, 'Transistör', e);
  hero('trans-transistor', g, 'transistor', W / 2, 740, 440, 160, e, { giris: 'zipla-gir', dur: 0.9, anims: [{ preset: 'sallan', t: e.t0 + 1.5, aci: 4, periyot: 3 }] });
  for (let i = 0; i < 7; i++) hero(`trans-mini${i + 1}`, g, 'transistor', 150 + i * 130, 985, 105, 160, e, { giris: 'zipla-gir', delay: 1.4 + i * 0.16, dur: 0.6, anims: [{ preset: 'seksek', t: e.t0 + 3 + i * 0.12, yukseklik: 14, periyot: 1.4 }] });
  info('trans-bilgi', g, e, 'Bell Labs: tüpten küçük,\nserin.', null);
  hud(e, g, 'trans-hud');
}

// ═══════════════════════════ 4 — ÇİP (1971) ══════════════════════════════
{
  const e = ERA.cip, g = G('g-cip', '1971 · Çip');
  sheet('cip-zemin', g, e);
  rain('cip-yagmur', g, e, { opacity: 0.25, count: 18 });
  yilYaz('cip-yil', g, '1971', e);
  etiket('cip-etiket', g, 'Mikroişlemci', e);
  hero('cip-cip', g, 'cip', W / 2, 815, 470, 200, e, { dur: 1.1, anims: [{ preset: 'nabiz', t: e.t0 + 1.8, genlik: 0.03, periyot: 2 }] });
  info('cip-bilgi', g, e, 'Intel 4004: bir çipte\n2.300 transistör.', null);
  hud(e, g, 'cip-hud');
}

// ═══════════════════════════ 5 — KİŞİSEL BİLGİSAYAR (1981) ═══════════════
{
  const e = ERA.pc, g = G('g-pc', '1981 · Masaüstü');
  sheet('pc-zemin', g, e);
  yilYaz('pc-yil', g, '1981', e);
  etiket('pc-etiket', g, 'Kişisel bilgisayar', e);
  const cx = W / 2, cy = 830, sc = 2.35; // kisisel-bilgisayar 260×240
  hero('pc-pc', g, 'kisisel-bilgisayar', cx, cy, 260 * sc, 260, e, { giris: 'zipla-gir', dur: 0.9, extra: { variant: 'kehribar' } });
  const sx = (mx) => Math.round(cx + (mx - 130) * sc), sy = (my) => Math.round(cy + (my - 120) * sc);
  txt('pc-ekran', g, 'C:\\> MERHABA_', sx(72), sy(45), e, { size: 28, color: '#ffb000', align: 'left', start: e.t0 + 1.4, extra: { reveal: [k(e.t0 + 1.6, 0), k(e.t0 + 2.8, 1, 'linear')] } });
  info('pc-bilgi', g, e, 'Apple II (1977), IBM PC (1981):\nbilgisayar masaya geldi.', 'Her eve, her ofise\nbir bilgisayar.');
  hud(e, g, 'pc-hud');
}

// ═══════════════════════════ 6 — AĞ (1991) ═══════════════════════════════
{
  const e = ERA.ag, g = G('g-ag', '1991 · Ağ');
  sheet('ag-zemin', g, e);
  L({ id: 'ag-toz', group: g, type: 'particles', particle: 'yildiz-tozu', mode: 'surekli', colors: ['#3bf4fb', '#ff6fb5'], opacity: 0.55, count: 45, seed: 4, depth: 0.5, start: e.t0, end: e.t1, sfx: false });
  yilYaz('ag-yil', g, '1991', e);
  etiket('ag-etiket', g, 'Dünya çapında ağ', e);
  const nodes = [['ag-n1', 'kisisel-bilgisayar', 175, 650, 200, 260, 1.0], ['ag-n2', 'dizustu', 905, 640, 220, 260, 1.25], ['ag-n3', 'dizustu', 175, 1010, 220, 260, 1.5], ['ag-n4', 'kisisel-bilgisayar', 905, 1020, 200, 260, 1.75]];
  for (const [id, a, x, y, px, size, d] of nodes) hero(id, g, a, x, y, px, size, e, { giris: 'zipla-gir', delay: d, dur: 0.8, extra: a === 'kisisel-bilgisayar' ? { variant: 'gri' } : {} });
  hero('ag-bulut', g, 'bulut', W / 2, 830, 330, 200, e, { giris: 'katlanarak-gir', delay: 0.8, dur: 1.0 });
  txt('ag-www', g, 'WWW', W / 2, 838, e, { font: YIL, weight: 400, size: 64, color: '#0a3a4a', start: e.t0 + 1.7, extra: { anims: [{ preset: 'belir', t: e.t0 + 1.7, dur: 0.5 }] } });
  nodes.forEach(([id], i) => L({
    id: `ag-ok${i + 1}`, group: g, type: 'arrow', arrow: 'ok-neon', from: id, to: 'ag-bulut', start: e.t0, end: e.t1, bend: i % 2 ? 0.25 : -0.25,
    anims: [{ preset: 'cizerek-gir', t: e.t0 + 2.0 + i * 0.35, dur: 1.2 }], rider: { asset: 'bit-1', scale: 0.55, orient: 'sabit' }, ride: [k(e.t0 + 3.2 + i * 0.35, 0), k(e.t0 + 5.6 + i * 0.35, 1, 'inOutSine')],
  }));
  info('ag-bilgi', g, e, '1991: Web herkese açıldı.', 'Bilgi bir tıkla dünyayı\ndolaşıyordu.');
  hud(e, g, 'ag-hud');
}

// ═══════════════════════════ 7 — CEP (2007) ══════════════════════════════
{
  const e = ERA.cep, g = G('g-cep', '2007 · Cep');
  sheet('cep-zemin', g, e);
  yilYaz('cep-yil', g, '2007', e);
  etiket('cep-etiket', g, 'Akıllı telefon', e);
  hero('cep-eniac', g, 'eniac', 275, 930, 400, 400, e, { giris: 'katlanarak-gir', delay: 0.7, dur: 1.0, anims: [], extra: { opacity: 0.85 } });
  hero('cep-telefon', g, 'modern-telefon', 725, 790, 520, 320, e, { giris: 'zipla-gir', delay: 1.3, dur: 0.9, anims: [{ preset: 'suzul', t: e.t0 + 2.4, genlik: 10, periyot: 3 }] });
  L({ id: 'cep-ok', group: g, type: 'arrow', arrow: 'ok-serit', from: 'cep-eniac', to: 'cep-telefon', start: e.t0, end: e.t1, color: e.acc, bend: -0.35, anims: [{ preset: 'cizerek-gir', t: e.t0 + 2.3, dur: 1.4 }] });
  info('cep-bilgi', g, e, '2007: iPhone ile akıllı\ntelefon çağı başladı.', "Cebindeki telefon ENIAC'tan\nmilyonlarca kat güçlü.");
  hud(e, g, 'cep-hud');
}

// ═══════════════════════════ 8 — BUGÜN ═══════════════════════════════════
{
  const e = ERA.bugun, g = G('g-bugun', 'Bugün · Bulut ve YZ');
  sheet('bugun-zemin', g, e);
  rain('bugun-yagmur', g, e, { opacity: 0.4, count: 30 });
  yilYaz('bugun-yil', g, 'BUGÜN', e);
  etiket('bugun-etiket', g, 'Bulut ve yapay zekâ', e);
  hero('bugun-bulut', g, 'bulut', W / 2, 640, 300, 200, e, { giris: 'belir', delay: 0.6, dur: 0.8, anims: [{ preset: 'suzul', t: e.t0 + 1.5, genlik: 10, periyot: 3 }] });
  hero('bugun-sunucu', g, 'sunucu', 270, 880, 380, 240, e, { giris: 'katlanarak-gir', delay: 0.9, dur: 1.0, anims: [{ preset: 'nefes', t: e.t0 + 2, genlik: 0.012, periyot: 2.6 }] });
  hero('bugun-cip', g, 'cip', 790, 890, 360, 200, e, { giris: 'zipla-gir', delay: 1.3, dur: 0.9, extra: { variant: 'yapay' }, anims: [{ preset: 'nabiz', t: e.t0 + 2.4, genlik: 0.04, periyot: 1.4 }] });
  for (const [i, from] of [['1', 'bugun-sunucu'], ['2', 'bugun-cip']]) L({ id: `bugun-ok${i}`, group: g, type: 'arrow', arrow: 'ok-neon', from, to: 'bugun-bulut', start: e.t0, end: e.t1, anims: [{ preset: 'cizerek-gir', t: e.t0 + 2.2 + +i * 0.4, dur: 1.2 }] });
  satir('bugun-k1', g, '1971 · 2.300 transistör', 1120, e, 3.0, { size: 34, sure: 1.0 });
  txt('bugun-k2', g, '10 milyar+', W / 2, 1255, e, { font: YIL, weight: 400, size: 158, color: e.acc, start: e.t0 + 4.3, extra: { textAnims: [{ preset: 'harf-zipla', t: e.t0 + 4.3, dur: 0.5, aralik: 0.05 }], shadow: { color: 'rgba(0,0,0,.4)', blur: 0, x: 6, y: 7 } } });
  hud(e, g, 'bugun-hud');
}

// ═══════════════════════════ 9 — KAPANIŞ ═════════════════════════════════
{
  const e = ERA.kapanis, g = G('g-kapanis', 'Kapanış');
  sheet('kap-zemin', g, e);
  rain('kap-yagmur', g, e, { opacity: 0.45, count: 26 });
  txt('kap-soru', g, 'SIRADA\nNE VAR?', W / 2, 800, e, {
    font: YIL, weight: 400, size: 200, color: e.ink, lh: 1.08,
    extra: { textAnims: [{ preset: 'harf-katla', t: e.t0 + 0.5, dur: 0.6, aralik: 0.06 }], shadow: { color: 'rgba(0,0,0,.4)', blur: 0, x: 9, y: 10 } },
  });
  txt('kap-prompt', g, '> yarin.baslat()', W / 2, 1110, e, { size: 40, color: '#7dffa8', extra: { reveal: [k(e.t0 + 2.0, 0), k(e.t0 + 3.0, 1, 'linear')] } });
  txt('kap-imlec', g, '█', 850, 1110, e, { size: 40, color: e.acc, start: e.t0 + 3.0, extra: { loops: [{ prop: 'opacity', type: 'saw', amp: 0.5, period: 0.9 }] } });
  txt('kap-alt', g, 'Belki de onu sen yazacaksın.', W / 2, 1290, e, { size: 34, color: '#b9ddc9', extra: { anims: [{ preset: 'belir', t: e.t0 + 3.4, dur: 0.8 }], letterSpacing: 2 } });
}

// ─── Kamera: her çağda yavaş itme ─────────────────────────────────────────
const zoom = [];
for (const key of order) { const e = ERA[key]; zoom.push(k(e.t0, 1), k(e.t1 - 0.05, 1.055, 'linear')); }

// ─── Geçişler (t = kesme anı; kesmede katmanlar start/end = t) ─────────────
const tr = (key, type, dur, o = {}) => ({ type, t: ERA[key].t0, dur, ...o });
const scene = {
  name: PROJE_ADI, width: W, height: H, fps: FPS, duration: SURE,
  theme: TEMA, style: 'kagit-kesme',
  camera: { zoom, x: W / 2, y: H / 2 },
  audio: [{ file: 'uzay-ambiyans.wav', start: 0, volume: 0.42, fadeIn: 1.2, fadeOut: 3, bpm: 120, beatOffset: 0.25 }],
  sfx: { auto: true, volume: 0.45 },
  sections: order.map((key) => ({ t: ERA[key].t0, name: { hook: 'Kanca', cark: '1837 Çark', tup: '1945 Tüp', trans: '1947 Transistör', cip: '1971 Çip', pc: '1981 PC', ag: '1991 Ağ', cep: '2007 Cep', bugun: 'Bugün', kapanis: 'Kapanış' }[key] })),
  transitions: [
    tr('cark', 'kaydir', 0.8, { yon: 'yukari' }),
    tr('tup', 'kaydir', 0.8, { yon: 'yukari' }),
    tr('trans', 'yirtik', 1.0, { color: ERA.trans.bg, yon: 'sol', seed: 3 }),
    tr('cip', 'yakinlas', 0.8),
    tr('pc', 'perde', 1.0, { color: ERA.pc.bg }),
    tr('ag', 'iris', 1.0, { color: ERA.ag.bg }),
    tr('cep', 'sayfa-cevir', 1.1, { color: '#ffffff' }),
    tr('bugun', 'yakinlas', 0.8),
    tr('kapanis', 'kaydir', 0.9, { yon: 'asagi' }),
  ],
  groups,
  formats: [
    { id: 'youtube', name: 'YouTube 16:9', width: 1920, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.46, zoom: 1.3 },
    { id: 'square', name: 'Kare 1:1', width: 1080, height: 1080, mode: 'sigdir', focusX: 0.5, focusY: 0.47, zoom: 1.2 },
  ],
  layers: JSON.parse(JSON.stringify(layers)),
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
