// fastPano okul tanıtımı için ek çizim varlıkları
//   node scripts/seed-fastpano-okul.mjs → data/library/okul/*.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'library', 'okul');
fs.mkdirSync(OUT, { recursive: true });
const r1 = (v) => Math.round(v * 10) / 10;
const facets = [];
const tri = (p, c, s) => facets.push({ p: p.map(([x, y]) => [r1(x), r1(y)]), c, s });
const rect = (x, y, w, h, c, s = 0.1) => { tri([[x, y], [x + w, y], [x + w, y + h]], c, s); tri([[x, y], [x + w, y + h], [x, y + h]], c, -s); };
const quad = (a, b, c2, d, col, s = 0.1) => { tri([a, b, c2], col, s); tri([a, c2, d], col, -s); };
const fan = (cx, cy, rx, ry, col, s = 0.1, n = 20) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
    tri([[cx, cy], [cx + rx * Math.cos(a), cy + ry * Math.sin(a)], [cx + rx * Math.cos(b), cy + ry * Math.sin(b)]], col, i % 2 ? s : -s);
  }
};
const save = (id, name, tags, size, palette, roles) => {
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ id, name, tags, size, palette, roles, variants: {}, facets: facets.splice(0) }, null, 2) + '\n');
  console.log('yazıldı', id);
};

// kupa (200×230)
quad([40, 20], [160, 20], [140, 120], [60, 120], 'a', 0.12);
quad([50, 20], [100, 20], [95, 120], [60, 120], 'b', -0.1);
quad([40, 35], [15, 38], [22, 85], [50, 90], 'c', 0.1); quad([160, 35], [185, 38], [178, 85], [150, 90], 'c', -0.1);
rect(90, 120, 20, 50, 'c', 0.1); rect(55, 170, 90, 22, 'a', -0.1); rect(45, 192, 110, 26, 'c', 0.12);
tri([[100, 45], [110, 72], [136, 72]], 'y', 0.2); tri([[100, 45], [90, 72], [64, 72]], 'y', -0.2); tri([[64, 72], [100, 100], [136, 72]], 'y', 0.1);
save('kupa', 'Kupa', ['kupa', 'ödül', 'kazanan', 'başarı', 'yarışma'], [200, 230], { a: '#ffd54a', b: '#fff0a8', c: '#f3b73c', y: '#ffffff' }, { a: 'ana', b: 'isik', c: 'golge', y: 'vurgu' });

// megafon (260×190)
quad([20, 70], [60, 60], [60, 130], [20, 120], 'a', 0.1);
quad([60, 60], [190, 10], [190, 180], [60, 130], 'b', -0.1);
quad([190, 10], [215, 5], [215, 185], [190, 180], 'c', 0.14);
rect(75, 130, 26, 50, 'c', 0.1);
tri([[230, 50], [250, 40], [232, 62]], 'y', 0.1); tri([[232, 95], [256, 95], [232, 108]], 'y', -0.1); tri([[230, 135], [250, 152], [228, 145]], 'y', 0.1);
save('megafon', 'Megafon (duyuru)', ['duyuru', 'megafon', 'haber', 'anons'], [260, 190], { a: '#ff8fa3', b: '#ffb8c6', c: '#e0607a', y: '#ffd54a' }, { a: 'ana', b: 'isik', c: 'golge', y: 'vurgu' });

// pdf sayfa (170×220)
quad([10, 10], [120, 10], [160, 50], [160, 210], 'a', 0.08); tri([[10, 10], [160, 210], [10, 210]], 'a', -0.08);
tri([[120, 10], [160, 50], [120, 50]], 'c', 0.2);
rect(30, 70, 100, 34, 'r', 0.1);
rect(30, 120, 100, 8, 'l', 0.05); rect(30, 140, 100, 8, 'l', -0.05); rect(30, 160, 70, 8, 'l', 0.05); rect(30, 180, 90, 8, 'l', -0.05);
save('pdf-sayfa', 'PDF sayfası', ['pdf', 'belge', 'sayfa', 'doküman'], [170, 220], { a: '#fffaf3', c: '#ffc2b3', r: '#ff6b6b', l: '#c9c2e8' }, { a: 'ana', c: 'golge', r: 'vurgu', l: 'golge' });

// oynat / video (260×170)
rect(10, 10, 240, 150, 'a', 0.1); rect(22, 22, 216, 126, 'b', -0.06);
tri([[110, 52], [110, 118], [168, 85]], 'p', 0.2); tri([[110, 52], [168, 85], [120, 70]], 'p', -0.2);
rect(22, 140, 216, 6, 'p', 0.05);
save('oynat', 'Video oynatıcı', ['video', 'mp4', 'oynat', 'film'], [260, 170], { a: '#5b4b8a', b: '#a8d8ff', p: '#ffffff' }, { a: 'ana', b: 'ekran', p: 'vurgu' });

// okul binası (380×300)
rect(30, 110, 320, 170, 'a', 0.1); tri([[10, 115], [190, 30], [370, 115]], 'r', 0.15); tri([[10, 115], [190, 30], [100, 115]], 'r2', -0.1);
rect(160, 190, 60, 90, 'd', 0.1); rect(172, 205, 14, 40, 'l', -0.05); rect(194, 205, 14, 40, 'l', 0.05);
[[55, 140], [125, 140], [235, 140], [295, 140], [55, 205], [295, 205], [125, 205], [235, 205]].forEach(([x, y]) => rect(x, y, 40, 40, 'w', 0.08));
fan(190, 78, 20, 20, 'w', 0.08); rect(189, 64, 2, 14, 'd', 0.05);
rect(188, 0, 3, 34, 'd', 0.05); tri([[191, 2], [228, 12], [191, 24]], 'f', 0.2);
save('okul', 'Okul binası', ['okul', 'bina', 'eğitim', 'sınıf'], [380, 300], { a: '#ffe8c8', r: '#ff8fa3', r2: '#ffb8c6', d: '#9a6b4f', l: '#ffd6a5', w: '#b8e0ff', f: '#ff6b6b' }, { a: 'ana', r: 'vurgu', r2: 'isik', d: 'golge', l: 'ikinci', w: 'ekran', f: 'vurgu' });

// dolap sırası (320×260)
for (let i = 0; i < 4; i++) {
  const x = 10 + i * 76, c = ['a', 'b', 'a', 'b'][i];
  rect(x, 10, 70, 240, c, 0.1);
  rect(x + 8, 28, 54, 6, 'd', 0.06); rect(x + 8, 40, 54, 6, 'd', -0.06); rect(x + 8, 52, 54, 6, 'd', 0.06);
  rect(x + 52, 130, 6, 28, 'h', 0.12);
}
save('dolap', 'Okul dolapları', ['dolap', 'koridor', 'okul', 'sıra'], [320, 260], { a: '#9ab8ff', b: '#7ad7c1', d: '#5b6fbf', h: '#fff1e6' }, { a: 'ana', b: 'ikinci', d: 'golge', h: 'vurgu' });

// sınıf kapısı (150×290)
rect(10, 10, 130, 270, 'k', 0.08); rect(24, 24, 102, 256, 'a', 0.1);
rect(46, 50, 58, 70, 'w', -0.06); rect(36, 150, 78, 10, 'd', 0.05); rect(112, 190, 8, 30, 'h', 0.15);
rect(44, 130, 62, 14, 'p', 0.08);
save('kapi', 'Sınıf kapısı', ['kapı', 'sınıf', 'koridor', 'okul'], [150, 290], { k: '#c98f6b', a: '#ffd6a5', w: '#b8e0ff', d: '#c98f6b', h: '#ffffff', p: '#ffffff' }, { k: 'golge', a: 'ana', w: 'ekran', d: 'golge', h: 'vurgu', p: 'vurgu' });

// çarpı (200×200)
quad([20, 40], [45, 15], [185, 160], [160, 185], 'a', 0.12); quad([160, 15], [185, 40], [45, 185], [20, 160], 'a', -0.12);
save('carpi', 'Çarpı (yasak)', ['çarpı', 'hayır', 'iptal', 'yok'], [200, 200], { a: '#ff5d73' }, { a: 'vurgu' });

// instagram (180×180)
rect(10, 10, 160, 160, 'a', 0.1); tri([[10, 10], [170, 10], [10, 170]], 'b', 0.2); tri([[170, 170], [170, 10], [10, 170]], 'c', -0.1);
fan(90, 90, 44, 44, 'w', 0.08, 24); fan(90, 90, 28, 28, 'a', -0.06, 24); fan(132, 48, 7, 7, 'w', 0.08, 10);
save('instagram', 'Instagram rozeti', ['instagram', 'sosyal medya', 'takip'], [180, 180], { a: '#d6249f', b: '#fd9f3a', c: '#7a4fe0', w: '#ffffff' }, { a: 'ana', b: 'isik', c: 'golge', w: 'vurgu' });

// play rozeti (200×200): renkli üçgen
tri([[30, 20], [30, 180], [105, 100]], 'g', 0.15); tri([[30, 20], [105, 100], [150, 55]], 'b', -0.1);
tri([[30, 180], [105, 100], [150, 145]], 'r', 0.1); tri([[150, 55], [105, 100], [150, 145]], 'y', 0.2); tri([[150, 55], [190, 100], [150, 145]], 'y', -0.1);
save('play-rozet', 'Play rozeti', ['google play', 'mağaza', 'indir', 'android'], [200, 200], { g: '#3ddc97', b: '#5ab0ff', r: '#ff6b6b', y: '#ffd54a' }, { g: 'ana', b: 'ikinci', r: 'vurgu', y: 'isik' });

// açık kitap (200×150)
quad([10, 30], [100, 50], [100, 140], [10, 120], 'a', 0.1); quad([190, 30], [100, 50], [100, 140], [190, 120], 'b', -0.1);
tri([[10, 30], [100, 10], [100, 50]], 'c', 0.05); tri([[190, 30], [100, 10], [100, 50]], 'c', -0.05);
save('acik-kitap', 'Açık kitap', ['kitap', 'eğitim', 'ders', 'okuma'], [200, 150], { a: '#ffd6a5', b: '#fff1e6', c: '#ff8fa3' }, { a: 'ana', b: 'isik', c: 'vurgu' });

// kalem (60×220)
rect(15, 30, 30, 140, 'a', 0.1); rect(15, 30, 10, 140, 'b', -0.1);
tri([[15, 170], [45, 170], [30, 210]], 'w', 0.1); tri([[26, 192], [34, 192], [30, 210]], 'k', 0.1); rect(15, 14, 30, 16, 'e', 0.1);
save('kalem', 'Kurşun kalem', ['kalem', 'yazı', 'okul', 'eğitim'], [60, 220], { a: '#ffd54a', b: '#fff0a8', w: '#ffe8c8', k: '#5b4b8a', e: '#ff8fa3' }, { a: 'ana', b: 'isik', w: 'ikinci', k: 'golge', e: 'vurgu' });

// düz dolgu dikdörtgen (160×90) — TV ekranı / zemin şeridi için, renk palette.a ile verilir
rect(0, 0, 160, 90, 'a', 0.04);
save('fon', 'Düz dikdörtgen', ['fon', 'dikdörtgen', 'zemin'], [160, 90], { a: '#fff6e0' }, { a: 'ana' });
