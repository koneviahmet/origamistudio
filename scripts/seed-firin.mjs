// Fırın videosu için yeni modeller (mutfak kategorisi) + kıvılcım efekti.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'data', 'library');
const r1 = (v) => Math.round(v * 10) / 10;
const F = (p, c, s = 0, e = {}) => ({ p, c, s, ...e });
// dikdörtgen = iki üçgen, zıt gölge
const R = (x1, y1, x2, y2, c, s = 0) => [F([[x1, y1], [x2, y1], [x2, y2]], c, s), F([[x1, y1], [x2, y2], [x1, y2]], c, -s)];
// dörtgen
const Q = (a, b, c2, d, c, s = 0) => [F([a, b, c2], c, s), F([a, c2, d], c, -s)];
// yay / kubbe: merkezden üçgen yelpazesi
const fan = (cx, cy, rx, ry, a0, a1, n, c, s = 0.1) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t0 = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    const t1 = ((a0 + ((a1 - a0) * (i + 1)) / n) * Math.PI) / 180;
    out.push(F([[cx, cy], [r1(cx + rx * Math.cos(t0)), r1(cy + ry * Math.sin(t0))], [r1(cx + rx * Math.cos(t1)), r1(cy + ry * Math.sin(t1))]], c, i % 2 ? -s : s));
  }
  return out;
};
const flame = (cx, base, h, w, c, s = 0) => [F([[cx - w, base], [cx, base], [cx - w * 0.2, base - h]], c, s), F([[cx, base], [cx + w, base], [cx + w * 0.2, base - h * 0.85]], c, -s)];
const roles = { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', v: 'vurgu' };
const models = [];
const add = (id, name, tags, palette, facets) => models.push({ id, name, tags, size: [200, 200], palette, roles, facets: facets.flat() });

add('acik-ates', 'Açık ateş (kütükler + taşlar)', ['ateş', 'odun', 'ilk', 'fırın', 'tarih öncesi', 'mutfak'],
  { a: '#8a5a3a', b: '#5e3b24', c: '#f7c948', d: '#4a4a52', v: '#ff6b2c', w: '#d93a1f', x: '#9a9aa5' },
  [
    Q([10, 190], [30, 160], [58, 158], [66, 190], 'x', 0.05), Q([134, 190], [142, 158], [172, 162], [192, 190], 'x', -0.05),
    Q([60, 196], [80, 172], [120, 172], [142, 196], 'd', 0.05),
    Q([30, 184], [38, 170], [150, 150], [160, 164], 'b', -0.1), Q([170, 184], [162, 170], [50, 150], [40, 164], 'a', 0.1),
    flame(100, 168, 120, 46, 'w', 0.05), flame(72, 168, 80, 28, 'v', 0.1), flame(130, 168, 92, 30, 'v', -0.1), flame(100, 168, 78, 26, 'c', 0.05),
  ]);

add('kil-kubbe-firin', 'Kil kubbe fırın', ['kil', 'kubbe', 'taş fırın', 'ekmek', 'odun', 'fırın', 'eski', 'mutfak'],
  { a: '#c98a5a', b: '#a66a3f', c: '#e8b48a', d: '#2b1a12', v: '#ff8a2a', w: '#ffd257' },
  [
    fan(100, 170, 88, 130, 180, 360, 10, 'a', 0.12),
    R(12, 170, 188, 192, 'b', 0.1),
    Q([66, 170], [66, 130], [100, 112], [134, 130], 'd', 0), Q([66, 170], [134, 130], [134, 170], [66, 170], 'd', 0),
    flame(100, 170, 40, 22, 'v', 0), flame(88, 170, 24, 12, 'w', 0.05), flame(114, 170, 28, 12, 'w', -0.05),
    R(40, 120, 60, 128, 'c', 0.1), R(140, 120, 162, 128, 'c', -0.1), R(78, 70, 122, 78, 'c', 0.05), R(56, 92, 76, 100, 'b', 0.1), R(126, 92, 146, 100, 'b', -0.1),
    R(92, 34, 108, 50, 'c', 0.1),
  ]);

add('gazli-firin', 'Gazlı ocaklı fırın', ['gaz', 'ocak', 'fırın', 'ocaklı fırın', 'mutfak', 'mavi alev'],
  { a: '#e9e4dc', b: '#c7bfb3', c: '#ffffff', d: '#2f3138', v: '#ff7a1a', w: '#3b9bff', x: '#8c8f98' },
  [
    R(30, 70, 170, 190, 'a', 0.08), R(30, 60, 170, 76, 'c', 0.1),
    R(40, 46, 160, 52, 'd', 0), R(46, 52, 54, 60, 'd', 0), R(146, 52, 154, 60, 'd', 0), R(98, 52, 102, 60, 'd', 0),
    fan(68, 40, 18, 8, 180, 360, 6, 'x', 0.05), fan(132, 40, 18, 8, 180, 360, 6, 'x', -0.05),
    flame(68, 38, 18, 8, 'w', 0), flame(132, 38, 18, 8, 'w', 0),
    R(42, 96, 158, 178, 'b', -0.1), R(52, 106, 148, 162, 'd', 0), R(56, 110, 100, 140, 'x', 0.15),
    flame(100, 162, 26, 18, 'v', 0.05), flame(78, 162, 18, 10, 'v', -0.05), flame(124, 162, 18, 10, 'v', 0.05),
    R(56, 84, 144, 90, 'x', 0.1),
    fan(56, 82, 6, 6, 0, 360, 6, 'd', 0), fan(100, 82, 6, 6, 0, 360, 6, 'd', 0), fan(144, 82, 6, 6, 0, 360, 6, 'd', 0),
    R(38, 184, 54, 196, 'd', 0), R(146, 184, 162, 196, 'd', 0),
  ]);

add('elektrikli-firin', 'Elektrikli fırın (rezistans)', ['elektrik', 'elektrikli fırın', 'fırın', 'rezistans', 'mutfak', 'ısı'],
  { a: '#d8dde3', b: '#9aa3ae', c: '#ffffff', d: '#23262d', v: '#ff5a1f', w: '#ffb347', x: '#c88a4a' },
  [
    R(16, 50, 184, 180, 'a', 0.08), R(16, 50, 184, 72, 'c', 0.12),
    R(28, 56, 34, 68, 'd', 0), R(40, 56, 46, 68, 'd', 0), R(154, 56, 180, 68, 'd', 0),
    fan(60, 62, 7, 7, 0, 360, 6, 'd', 0), fan(120, 62, 7, 7, 0, 360, 6, 'd', 0),
    R(28, 82, 172, 170, 'b', -0.1), R(36, 90, 164, 162, 'd', 0),
    R(44, 100, 156, 105, 'v', 0.1), R(44, 100, 156, 102, 'w', 0.1), R(44, 146, 156, 151, 'v', 0.1),
    R(48, 138, 152, 144, 'b', 0.1),
    Q([62, 138], [72, 116], [128, 116], [138, 138], 'x', 0.1),
    R(72, 122, 84, 128, 'w', 0.1), R(104, 122, 120, 128, 'w', -0.1),
    R(44, 168, 156, 174, 'c', 0.08),
    R(30, 180, 46, 190, 'd', 0), R(154, 180, 170, 190, 'd', 0),
  ]);

add('mikrodalga', 'Mikrodalga fırın', ['mikrodalga', 'fırın', 'radar', 'mutfak', '1945', 'ısıtma'],
  { a: '#dfe3e8', b: '#9da5b0', c: '#ffffff', d: '#1f2229', v: '#4ad6a7', w: '#ffb347', x: '#2a3b4a' },
  [
    R(10, 50, 190, 160, 'a', 0.08), R(10, 50, 190, 62, 'c', 0.12),
    R(20, 70, 136, 150, 'b', -0.1), R(26, 76, 130, 144, 'x', 0),
    fan(78, 136, 40, 7, 0, 360, 8, 'b', 0.1), Q([58, 134], [62, 108], [94, 108], [98, 134], 'w', 0.1),
    F([[66, 108], [90, 108], [78, 90]], 'v', 0.1),
    R(144, 70, 182, 150, 'd', 0.05), R(150, 76, 176, 92, 'v', 0.1),
    fan(163, 112, 11, 11, 0, 360, 8, 'b', 0.1), R(150, 128, 162, 134, 'b', 0), R(164, 128, 176, 134, 'b', 0), R(150, 138, 162, 144, 'b', 0), R(164, 138, 176, 144, 'b', 0),
    R(26, 160, 40, 170, 'd', 0), R(160, 160, 174, 170, 'd', 0),
    R(40, 34, 70, 38, 'v', 0), R(80, 28, 110, 32, 'v', 0), R(120, 34, 150, 38, 'v', 0),
  ]);

add('akilli-firin', 'Akıllı fırın (ekran + kamera)', ['akıllı fırın', 'wifi', 'kamera', 'ekran', 'fırın', 'modern', 'mutfak'],
  { a: '#2c3038', b: '#454b57', c: '#dfe6f0', d: '#0f1116', v: '#38d6ff', w: '#ffb347', x: '#7be0a8' },
  [
    R(16, 40, 184, 186, 'a', 0.08), R(16, 40, 184, 54, 'b', 0.12),
    R(40, 62, 160, 94, 'd', 0), R(46, 68, 92, 88, 'v', 0.1), R(98, 70, 154, 76, 'c', 0.05), R(98, 80, 136, 86, 'x', 0.05),
    fan(28, 76, 5, 5, 0, 360, 6, 'c', 0), fan(172, 76, 5, 5, 0, 360, 6, 'c', 0),
    R(28, 104, 172, 176, 'b', -0.1), R(36, 112, 164, 168, 'd', 0),
    fan(100, 106, 4, 4, 0, 360, 6, 'v', 0),
    fan(100, 160, 38, 14, 180, 360, 8, 'w', 0.1), F([[84, 146], [116, 146], [100, 128]], 'x', 0.1),
    R(86, 12, 114, 16, 'v', 0), R(92, 22, 108, 26, 'v', 0), R(97, 31, 103, 37, 'v', 0),
    R(34, 180, 48, 190, 'd', 0), R(152, 180, 166, 190, 'd', 0),
  ]);

add('ekmek-somun', 'Ekmek somunu', ['ekmek', 'somun', 'mutfak', 'fırın', 'hamur'],
  { a: '#d8954f', b: '#b5702e', c: '#f3d6a0', d: '#7a4a1e' },
  [
    fan(100, 140, 84, 76, 180, 360, 10, 'a', 0.12), R(16, 140, 184, 162, 'b', 0.1),
    Q([54, 92], [62, 78], [72, 84], [64, 104], 'c', 0.1), Q([92, 76], [100, 62], [110, 70], [102, 90], 'c', 0.1), Q([130, 84], [138, 72], [148, 80], [140, 100], 'c', 0.1),
  ]);

for (const m of models) {
  fs.mkdirSync(path.join(LIB, 'mutfak'), { recursive: true });
  fs.writeFileSync(path.join(LIB, 'mutfak', m.id + '.json'), JSON.stringify(m, null, 2) + '\n');
}
fs.mkdirSync(path.join(LIB, 'efektler'), { recursive: true });
fs.writeFileSync(path.join(LIB, 'efektler', 'kivilcim.json'), JSON.stringify({
  id: 'kivilcim', name: 'Kıvılcım (kor)', type: 'particles', motion: 'yuksel', shape: 'pirilti',
  count: 46, size: 20, speed: 140, wind: 20, sway: 40, spin: 0.5, colors: ['#ffb347', '#ff6b2c', '#ffd257', '#ff8a2a'], prewarm: true,
}, null, 2) + '\n');
console.log('ok', models.length, 'model + kivilcim');
