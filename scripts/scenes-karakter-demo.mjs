// "Karakterler" sistemi demosu — iki karakter yürür, tanışır, konuşur, bir ürünü tanıtır (data/characters).
//   node scripts/scenes-karakter-demo.mjs   →  data/projects/karakter-demo/scene.json
// Konsept: sıcak kağıt masa — Çöp adam (Ayşe) ile Robo, ortadaki telefonu tanıtırken tüm aksiyon/duygu kataloğundan örnek gösterir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { karakterBaglam, diyalog } from './lib/karakter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJE_ID = 'karakter-demo';
const W = 1920, H = 1080, FPS = 30;
const r2 = (n) => Math.round(n * 100) / 100;
const layers = [];
const L = (o) => (layers.push(o), o);
const K = karakterBaglam({ W, H });

// ürün: ortada telefon (karakterlerin işaret edeceği hedef)
L({
  id: 'telefon', type: 'device', frame: 'telefon', x: W / 2, y: H * 0.5, scale: 0.62, width: 460, title: 'Karakter Seti', ui: 'sohbet',
  lines: ['Merhaba!', 'Hareketler hazır', 'Konuşma balonu', 'Duygular'], start: 3.6, anims: [{ preset: 'zipla-gir', t: 3.6, dur: 0.9 }],
});

// karakterler
const ayse = K('copadam', {
  id: 'ayse', konum: [0.1, 0.92], boy: 0.56, varyant: 'kiz', start: 0.2, giris: false, scale: undefined,
  akis: [{ t: 0.3, aksiyon: 'yuru', dx: W * 0.19, sure: 2.4, duygu: 'mutlu' }, { t: 2.8, aksiyon: 'selamla', duygu: 'cok-mutlu', sure: 2.6 }],
});
const robo = K('robo', {
  id: 'robo', konum: [0.9, 0.92], boy: 0.56, yon: -1, start: 0.2, giris: false,
  akis: [{ t: 0.3, aksiyon: 'yuru', dx: -W * 0.19, sure: 2.4, duygu: 'notr' }],
});
L(ayse); L(robo);

const d = diyalog({ ayse, robo }, [
  { kim: 'ayse', metin: 'Selam Robo! Bugün sana yeni bir şey göstereceğim.', duygu: 'mutlu', sure: 3.0 },
  { kim: 'robo', metin: 'Merhaba Ayşe! Çok merak ediyorum. Nedir bu?', duygu: 'heyecanli', tepki: { ayse: 'mutlu' }, sure: 3.0 },
  { kim: 'ayse', metin: 'Bu, karakter seti! Yürür, konuşur, tepki verir.', aksiyon: 'tanit', hedef: 'telefon', duygu: 'cok-mutlu', efekt: 'yildiz', sure: 3.2 },
  { kim: 'robo', metin: 'Hmm… Peki ben de aynı hareketleri yapabilir miyim?', aksiyon: 'dusun', duygu: 'dusunceli', sure: 3.2 },
  { kim: 'ayse', metin: 'Tabii! Tüm karakterler aynı aksiyonları paylaşır.', aksiyon: 'sunum', duygu: 'cok-mutlu', sure: 3.0 },
  { kim: 'robo', metin: 'Harika!', tur: 'bagir', aksiyon: 'sevin', duygu: 'heyecanli', sure: 2.0, tepki: { ayse: 'gulen' } },
  { kim: 'ayse', metin: 'Sen de dene!', aksiyon: 'isaret', hedef: 'telefon', duygu: 'mutlu', sure: 1.6, bosluk: 0.2 },
], { t0: 5.6 });

// kapanış: ikisi birden el sallar
const SON = r2(d.bitis + 0.3);
ayse.akis.push({ t: SON, aksiyon: 'el-salla', duygu: 'cok-mutlu', bak: 'ileri' });
robo.akis.push({ t: SON, aksiyon: 'el-salla', duygu: 'mutlu', bak: 'ileri' });
const SURE = r2(SON + 2.6);

const scene = {
  name: 'Karakterler — tanışma ve tanıtım',
  width: W, height: H, fps: FPS, duration: SURE,
  theme: 'gun-isigi',
  style: 'duz',
  background: { type: 'linear', colors: ['#fff3df', '#f7cfa4'], angle: 180, paper: 0.45, vignette: 0.2 },
  camera: { zoom: 1 },
  layers: JSON.parse(JSON.stringify(layers)),
  publish: {
    title: 'Konuşan Karakterler: Çöp Adam ve Robo Yeni Bir Sistemi Tanıtıyor',
    description: 'İki karakter yürüyor, selamlaşıyor, tepki veriyor ve bir ürünü tanıtıyor. Tüm karakter setleri aynı aksiyon ve duygu kütüphanesini paylaşır. Siz de kendi karakterinizle deneyin!',
    tags: ['karakter', 'animasyon', 'çöp adam', 'robot', 'diyalog', 'konuşan karakter', 'animasyon videosu', 'tanıtım', 'eğlenceli', 'çizgi film', 'karakter tasarımı'],
  },
};
const dir = path.join(ROOT, 'data', 'projects', PROJE_ID);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
console.log(`ok — ${PROJE_ID}: ${scene.layers.length} katman, ${SURE} sn`);
