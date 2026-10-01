// Başlangıç karakter setlerini data/characters/<id>.json olarak yazar (dosya varsa dokunmaz; --force ile ezer).
//   npm run seed:karakter [-- --force] [--sadece=bonbon,robo]   (--sadece: yalnız bu setleri yazar)
// Karakter belgesi yalnızca GÖRÜNÜM verir; aksiyonlar ve duygular tüm karakterlerce paylaşılan katalogtadır
// (web/src/engine/characterData.js). Yeni karakter eklemek = yeni görünüm yazmak; hareketler otomatik gelir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'characters');
const force = process.argv.includes('--force');
fs.mkdirSync(DIR, { recursive: true });

// Her karakterde açılıp kapatılabilen ortak aksesuarlar (katmanda ekler: ['gozluk', 'bere'] ile açılır)
const ek = (id, ad, tur, stil, extra = {}) => ({ id, ad, tur, stil, varsayilan: false, ...extra });
const EKLER = [
  ek('sac-kisa', 'Kısa saç', 'sac', 'kisa'),
  ek('sac-dikenli', 'Dikenli saç', 'sac', 'dikenli'),
  ek('sac-topuz', 'Topuz', 'sac', 'topuz'),
  ek('sac-uzun', 'Uzun saç', 'sac', 'uzun'),
  ek('sac-kuyruk', 'At kuyruğu', 'sac', 'at-kuyrugu'),
  ek('sac-tutam', 'Tek tutam', 'sac', 'tutam'),
  ek('sac-kabarik', 'Kabarık saç', 'sac', 'kabarik'),
  ek('gozluk', 'Yuvarlak gözlük', 'gozluk', 'yuvarlak'),
  ek('gunes-gozlugu', 'Güneş gözlüğü', 'gozluk', 'gunes'),
  ek('bere', 'Bere', 'sapka', 'bere', { renk: '#e63946' }),
  ek('silindir', 'Silindir şapka', 'sapka', 'silindir'),
  ek('kep', 'Kep', 'sapka', 'kep', { renk: '#3b82f6' }),
  ek('kask', 'İş kaskı', 'sapka', 'kask'),
  ek('sef-sapkasi', 'Aşçı şapkası', 'sapka', 'sef'),
  ek('parti-sapkasi', 'Parti şapkası', 'sapka', 'parti'),
  ek('tac', 'Taç', 'sapka', 'tac'),
  ek('kravat', 'Kravat', 'kravat', 'duz'),
  ek('papyon', 'Papyon', 'papyon', 'duz'),
  ek('atki', 'Atkı', 'atki', 'duz'),
  ek('pelerin', 'Pelerin', 'pelerin', 'duz'),
  ek('biyik', 'Bıyık', 'biyik', 'duz'),
  ek('sakal', 'Sakal', 'sakal', 'duz'),
];
const ekler = (extra = []) => [...extra, ...EKLER];


// Minik serisi ortak görünüm: çizgi sanatı (beyaz dolgu, titrek siyah kontur), dev kafa, ince kol-bacak, çizgi ayak
const MINIK = {
  olcu: { bas: [66, 62], boyun: 2, govde: [54, 68], omuzY: 12, omuzX: 25, kolUst: 40, kolAlt: 36, kalcaX: 12, bacakUst: 29, bacakAlt: 27, el: 9, ayak: [22, 4] },
  cizgi: { renk: '#111111', kalinlik: 4.6, titrek: 1.3, kaynama: 0.13 },
  renkler: { kafa: '#ffffff', govde: '#ffffff', sac: '#ffffff', sort: '#ffffff', desen: '#111111', agiz: '#8c2a36' },
  kafa: { sekil: 'daire' },
  uzuv: { tur: 'cubuk', kalinlik: 4.6, el: 'parmak', ayak: 'cizgi' },
  yuz: { goz: 'oval', boyut: 0.85, aralik: 0.7, yukseklik: -0.02, agizY: -0.06, agizGen: 1.7, agizDerin: 2.4, agizKalinlik: 1, kasEsik: 8, yanakGuc: 0 },
};
const MINIK_EK = (varsayilanSac) => [
  { id: 'kulak-insan', ad: 'Kulaklar', tur: 'kulak', stil: 'insan' },
  ...[['sac-ikili', 'İkili toka', 'ikili'], ['sac-tarak', 'Tarak saç', 'tarak'], ['sac-bukle', 'Bukle', 'bukle'], ['sac-firca', 'At kuyruğu', 'firca'], ['sac-topuz-sarmal', 'Sarmal topuz', 'topuz-sarmal'], ['sac-lule', 'Lüleli saç', 'lule']]
    .map(([id, ad, stil]) => ({ id, ad, tur: 'sac', stil, ...(id === varsayilanSac ? {} : { varsayilan: false }) })),
];

// Doodle kedi serisi ortak görünüm: çizgi sanatı, tombul oranlar, kulak + bıyık + kuyruk
const KEDI = {
  olcu: { bas: [70, 60], boyun: 0, govde: [84, 74], omuzY: 14, omuzX: 31, kolUst: 26, kolAlt: 22, kalcaX: 21, bacakUst: 18, bacakAlt: 16, el: 8, ayak: [26, 6] },
  cizgi: { renk: '#111111', kalinlik: 4.4, titrek: 1.2, kaynama: 0.14 },
  renkler: { kafa: '#ffffff', govde: '#ffffff', kuyruk: '#ffffff', kuyrukUc: '#ffffff', desen: '#111111', burun: '#ffffff', goz: '#111111', agiz: '#8c2a36' },
  uzuv: { tur: 'cubuk', kalinlik: 4.4, el: 'top', ayak: 'oval' },
  yuz: { goz: 'nokta', boyut: 0.85, aralik: 1.0, yukseklik: 0.04, burun: 'ucgen', biyik: 'kedi', agizY: 0.08, agizGen: 0.5, agizDerin: 1, kasEsik: 8, yanakGuc: 0 },
};
const KEDI_EK = [
  { id: 'kulak', ad: 'Kedi kulakları', tur: 'kulak', stil: 'kedi', ic: '#ffffff' },
  { id: 'kuyruk', ad: 'Kuyruk', tur: 'kuyruk', stil: 'kedi' },
];

const SETS = {
  // ------------------------------------------------------------------ 1) Çöp adam (el çizimi)
  copadam: {
    name: 'Çöp adam',
    description: 'Defter kenarı çizgi karakteri: beyaz dolgu, titrek siyah kontur, çubuk uzuvlar. Her konuya uyar; en hızlı okunan karakter.',
    rig: 'insan',
    etiketler: ['çöp adam', 'stickman', 'çizgi', 'el çizimi', 'doodle', 'defter', 'sade', 'genel', 'eğitim', 'anlatım', 'whiteboard', 'minimal', 'siyah beyaz'],
    kullanim: 'Genel anlatıcı / diyalog. Kâğıt, kroki, çizim stilli ve sade videolar için. Renkli arka planlarda da okunur.',
    olcu: { bas: [60, 56], boyun: 2, govde: [80, 128], omuzY: 16, omuzX: 36, kolUst: 54, kolAlt: 50, kalcaX: 18, bacakUst: 52, bacakAlt: 50, el: 10, ayak: [20, 9] },
    cizgi: { renk: '#17171c', kalinlik: 5, titrek: 1.5, kaynama: 0.13 },
    renkler: { kafa: '#ffffff', govde: '#ffffff', sac: '#17171c', agiz: '#8c2a36', yanak: '#ff8f8f' },
    govde: { sekil: 'dikdortgen', yaricap: [20, 20, 4, 4] },
    kafa: { sekil: 'daire' },
    uzuv: { tur: 'cubuk', kalinlik: 5, el: 'parmak', ayak: 'oval' },
    yuz: { goz: 'nokta', boyut: 1, burun: null },
    ekler: ekler(),
    varyantlar: {
      kiz: { govde: { sekil: 'elbise' }, ekAc: ['sac-uzun'], renkler: { govde: '#ffd1dc' } },
      ogretmen: { ekAc: ['gozluk', 'papyon', 'sac-kisa'] },
      patron: { ekAc: ['kravat', 'sac-kisa'], renkler: { govde: '#dfe7ff' } },
      renkli: { renkler: { kafa: '#fff3c4', govde: '#ffcf9e' } },
      kirmizi: { renkler: { govde: '#ffb3b3' } },
      mavi: { renkler: { govde: '#b8d8ff' } },
      yesil: { renkler: { govde: '#bfe8b9' } },
    },
  },

  // ------------------------------------------------------------------ 2) Bonbon (renkli yuvarlak kukla)
  bonbon: {
    name: 'Bonbon',
    description: 'Yumuşak, canlı renkli çizgi film çocuğu: parlak gradyanlı yüz, iri ışıltılı gözler, çizgili tişört, renkli konturlar. Çocuk içerikleri, ürün tanıtımı ve sıcak anlatım için.',
    rig: 'insan',
    etiketler: ['bonbon', 'sevimli', 'çocuk', 'renkli', 'kukla', 'chibi', 'cute', 'mascot', 'maskot', 'yumuşak', 'eğlenceli', 'ürün', 'reklam', 'oyuncak', 'çizgi film'],
    kullanim: 'Çocuk / aile içeriği, maskot, ürün tanıtımı. Konuşma balonlarıyla çok iyi çalışır. Renk varyantlarıyla ekip kurulabilir.',
    olcu: { bas: [66, 61], boyun: 0, govde: [76, 100], omuzY: 20, omuzX: 35, kolUst: 44, kolAlt: 40, kalcaX: 18, bacakUst: 38, bacakAlt: 34, el: 13, ayak: [28, 14] },
    isik: 0.75,
    cizgi: { renk: '#3d2a24', kalinlik: 3.6, titrek: 0, kaynama: 0, renkli: true, renkliGuc: 0.5 },
    renkler: { kafa: '#ffd2ac', govde: '#ff7f50', sirit: '#ffb48a', yaka: '#ffffff', kol: '#ffd2ac', bacak: '#5f5ad8', el: '#ffd2ac', ayak: '#46302a', taban: '#f6efe6', sac: '#8a4f2a', goz: '#2a1b17', iris: '#7a4a2b', agiz: '#8f2d3a', yanak: '#ff7e8b' },
    govde: { sekil: 'yumurta', detay: ['sirit', 'yaka'] },
    kafa: { sekil: 'daire' },
    uzuv: { tur: 'tup', kalinlik: 11, el: 'top', ayak: 'ayakkabi' },
    yuz: { goz: 'buyuk', boyut: 1.05, aralik: 0.95, yukseklik: 0.02, agizGen: 1.0, agizKalinlik: 1, burun: 'nokta', yanakGuc: 0.32, kirpik: true },
    ekler: ekler([
      { id: 'kulak-insan', ad: 'Kulaklar', tur: 'kulak', stil: 'insan' },
      { id: 'sac', ad: 'Saç', tur: 'sac', stil: 'kisa' },
    ]),
    varyantlar: {
      mavi: { renkler: { govde: '#4dabf7', sirit: '#a5d8ff', bacak: '#364fc7', sac: '#2b2b3a', iris: '#3b6ea8' } },
      pembe: { renkler: { govde: '#f783ac', sirit: '#ffc9de', bacak: '#9c36b5', sac: '#c2410c', iris: '#8f4a8f' }, ekAc: ['sac-kuyruk'], ekKapat: ['sac'] },
      yesil: { renkler: { govde: '#51cf66', sirit: '#b2f2bb', bacak: '#2b8a3e', sac: '#3b2a1e', iris: '#2f7d4f' } },
      sari: { renkler: { govde: '#ffd43b', sirit: '#fff3bf', bacak: '#e67700', sac: '#6b3a1f' } },
      sef: { ekAc: ['sef-sapkasi'], renkler: { govde: '#ffffff', sirit: '#e9ecef', bacak: '#495057' } },
    },
  },

  // ------------------------------------------------------------------ 3) Robo
  robo: {
    name: 'Robo',
    description: 'Parlak metal gövdeli, koyu ekranlı yüzünde LED gözleri yanan robot: eklemli kollar, göğüs panelinde dans eden ışıklar, kulaklık diskleri, anten. Teknoloji, yapay zekâ, yazılım, bilim anlatıcısı.',
    rig: 'insan',
    etiketler: ['robot', 'robo', 'teknoloji', 'yapay zeka', 'ai', 'bilim', 'yazılım', 'dijital', 'gelecek', 'makine', 'cyber', 'asistan', 'kod', 'neon'],
    kullanim: 'Teknoloji / yazılım / yapay zekâ anlatıcısı, asistan rolü. Neon ve koyu temalarla çok iyi gider.',
    olcu: { bas: [68, 55], boyun: 7, govde: [86, 112], omuzY: 19, omuzX: 41, kolUst: 46, kolAlt: 44, kalcaX: 21, bacakUst: 42, bacakAlt: 42, el: 14, ayak: [32, 15] },
    isik: 0.7,
    cizgi: { renk: '#222a44', kalinlik: 4, titrek: 0, kaynama: 0, renkli: true, renkliGuc: 0.55 },
    renkler: { kafa: '#d3dcee', govde: '#b4c1da', kol: '#93a4c6', bacak: '#93a4c6', el: '#eef2fa', ayak: '#4b5778', manset: '#6f7fa3', taban: '#dfe5f1', goz: '#3df5e0', agiz: '#3df5e0', led: '#3df5e0', vurgu: '#3df5e0', kulaklik: '#7889ad', yanak: '#ff9bb0' },
    govde: { sekil: 'kutu', detay: ['panel'] },
    kafa: { sekil: 'kutu', detay: ['kulaklik', 'civata'] },
    uzuv: { tur: 'tup', kalinlik: 11, el: 'eldiven', ayak: 'bot', eklem: true, manset: true },
    yuz: { goz: 'ekran', boyut: 1.2, aralik: 0.88, yukseklik: -0.04, agizY: 0.0, agizGen: 0.75, agizKalinlik: 1.2, kasKalinlik: 0.9, ekran: '#161c33' },
    ekler: ekler([{ id: 'anten', ad: 'Anten', tur: 'anten', stil: 'top', renk: '#ff6b6b' }]),
    varyantlar: {
      mor: { renkler: { kafa: '#dcd3f5', govde: '#b9a9ec', kol: '#9a88da', bacak: '#9a88da', ayak: '#4f4478', goz: '#ffd43b', agiz: '#ffd43b', led: '#ffd43b', vurgu: '#ffd43b', kulaklik: '#8272c0', manset: '#7867b8' } },
      turuncu: { renkler: { kafa: '#ffe6cc', govde: '#ffbf80', kol: '#eb9d4f', bacak: '#eb9d4f', ayak: '#6b4220', goz: '#ffffff', agiz: '#ffffff', led: '#ffffff', vurgu: '#ff7a3d', kulaklik: '#d68a3f', manset: '#c97d33' } },
      gece: { renkler: { kafa: '#4a5575', govde: '#394260', kol: '#2e3650', bacak: '#2e3650', el: '#7080a3', ayak: '#1a2038', goz: '#7cf7ff', agiz: '#7cf7ff', led: '#7cf7ff', kulaklik: '#252d46', manset: '#1f2740', taban: '#5a6788' }, cizgi: { renk: '#10152a' } },
    },
  },

  // ------------------------------------------------------------------ 4) Miyav (kedi)
  miyav: {
    name: 'Miyav',
    description: 'İki ayaklı sevimli çizgi film kedisi: iri yeşil gözler, pembe burun, bıyıklar, alında tabby çizgileri, krem karın, sallanan kuyruk. Hayvan / mizah / sıcak anlatımlar için.',
    rig: 'insan',
    etiketler: ['kedi', 'cat', 'hayvan', 'miyav', 'sevimli', 'evcil', 'komik', 'mizah', 'maskot', 'turuncu', 'tüylü', 'pati', 'çizgi film'],
    kullanim: 'Hayvan temalı, esprili veya sıcak videolar; maskot. Çift olarak varyantlarla (siyah, beyaz, gri) ikili diyalog için uygundur.',
    olcu: { bas: [68, 58], boyun: 0, govde: [74, 104], omuzY: 18, omuzX: 33, kolUst: 42, kolAlt: 38, kalcaX: 17, bacakUst: 38, bacakAlt: 34, el: 13, ayak: [28, 14] },
    isik: 0.7,
    cizgi: { renk: '#5a3015', kalinlik: 4, titrek: 0.4, kaynama: 0.2, renkli: true, renkliGuc: 0.55 },
    renkler: { kafa: '#f5a04d', govde: '#f5a04d', kol: '#f5a04d', bacak: '#f5a04d', kuyruk: '#f5a04d', kuyrukUc: '#fff1de', el: '#fff1de', ayak: '#fff1de', karin: '#fff1de', desen: '#c9702a', pati: '#ffa9b8', goz: '#2a1b12', iris: '#79c86a', agiz: '#8f2d3a', yanak: '#ff8fa3', burun: '#ff8fa3' },
    govde: { sekil: 'yumurta', detay: ['karin', 'tabby'] },
    kafa: { sekil: 'yumurta', detay: ['seritler', 'yanak-tuy'] },
    uzuv: { tur: 'tup', kalinlik: 11, el: 'top', ayak: 'oval', pati: true },
    yuz: { goz: 'buyuk', boyut: 1.1, aralik: 0.86, yukseklik: 0.0, burun: 'ucgen', biyik: 'kedi', pupil: 'yarik', agizY: 0.04, agizGen: 0.8, yanakGuc: 0.2 },
    ekler: ekler([
      { id: 'kulak', ad: 'Kedi kulakları', tur: 'kulak', stil: 'kedi', ic: '#ffb3c1' },
      { id: 'kuyruk', ad: 'Kuyruk', tur: 'kuyruk', stil: 'kedi' },
    ]),
    varyantlar: {
      siyah: { renkler: { kafa: '#3b3b4a', govde: '#3b3b4a', kol: '#3b3b4a', bacak: '#3b3b4a', kuyruk: '#3b3b4a', kuyrukUc: '#3b3b4a', el: '#56566b', ayak: '#56566b', karin: '#4e4e62', desen: '#2a2a36', iris: '#ffd43b' }, cizgi: { renk: '#14141c' } },
      beyaz: { renkler: { kafa: '#ffffff', govde: '#ffffff', kol: '#ffffff', bacak: '#ffffff', kuyruk: '#ffffff', kuyrukUc: '#e8d9f2', el: '#ffffff', ayak: '#ffffff', karin: '#f3eef7', desen: '#cdbfd6', iris: '#5aa9e6' }, cizgi: { renk: '#7a6a85' } },
      gri: { renkler: { kafa: '#aeb6bf', govde: '#aeb6bf', kol: '#aeb6bf', bacak: '#aeb6bf', kuyruk: '#aeb6bf', kuyrukUc: '#e9ecef', el: '#e9ecef', ayak: '#e9ecef', karin: '#e9ecef', desen: '#6c757d', iris: '#fcc419' }, cizgi: { renk: '#3d444b' } },
    },
  },

  // ------------------------------------------------------------------ 5) Astro
  astro: {
    name: 'Astro',
    description: 'Parlak beyaz uzay giysili, sırt çantalı, camlı kasklı astronot: yansımalı kask, göğüs paneli, yama, turuncu eldiven ve botlar. Uzay, bilim, keşif ve gökyüzü videoları için.',
    rig: 'insan',
    etiketler: ['astronot', 'uzay', 'space', 'astronaut', 'bilim', 'gezegen', 'keşif', 'roket', 'gökyüzü', 'güneş', 'eğitim', 'fen'],
    kullanim: 'Uzay / astronomi / bilim anlatıcısı; karanlık yıldızlı arka planlarda parlak okunur.',
    olcu: { bas: [64, 60], boyun: 0, govde: [88, 110], omuzY: 20, omuzX: 40, kolUst: 45, kolAlt: 41, kalcaX: 20, bacakUst: 41, bacakAlt: 37, el: 15, ayak: [32, 16] },
    isik: 0.7,
    cizgi: { renk: '#3a4663', kalinlik: 4, titrek: 0, kaynama: 0, renkli: true, renkliGuc: 0.42 },
    renkler: { kafa: '#ffd7b5', govde: '#f6f8fc', kol: '#f6f8fc', bacak: '#f6f8fc', el: '#ff9f43', ayak: '#ff9f43', manset: '#c9d3e6', halka: '#8fa0bf', bagaj: '#aab4c6', yama: '#e63946', kemer: '#8fa0bf', taban: '#e9edf5', sirit: '#ffd23f', sac: '#5a3b2a', goz: '#2a1b17', iris: '#3b6ea8', agiz: '#8f2d3a', yanak: '#ff8f8f', vurgu: '#3df5e0' },
    govde: { sekil: 'kapsul', detay: ['bagaj', 'halka', 'panel', 'yama'] },
    kafa: { sekil: 'daire' },
    uzuv: { tur: 'tup', kalinlik: 13, el: 'eldiven', ayak: 'bot', manset: true },
    yuz: { goz: 'buyuk', boyut: 0.95, aralik: 0.9, yukseklik: 0.0, agizGen: 0.9, burun: 'nokta', yanakGuc: 0.25, kirpik: false },
    ekler: ekler([
      { id: 'kulak-insan', ad: 'Kulaklar', tur: 'kulak', stil: 'insan' },
      { id: 'sac', ad: 'Saç', tur: 'sac', stil: 'kisa' },
      { id: 'kask-cam', ad: 'Uzay kaskı (cam)', tur: 'sapka', stil: 'astronot', renk: '#eef1f8' },
    ]),
    varyantlar: {
      turuncu: { renkler: { govde: '#ff9f43', kol: '#ff9f43', bacak: '#ff9f43', el: '#f6f8fc', ayak: '#f6f8fc', manset: '#e18329', halka: '#d9d9e3', yama: '#3b6ea8' } },
      mavi: { renkler: { govde: '#74c0fc', kol: '#74c0fc', bacak: '#74c0fc', el: '#f6f8fc', ayak: '#f6f8fc', manset: '#4a9ee0', halka: '#d9e3f2' } },
      kaskisiz: { ekKapat: ['kask-cam'] },
    },
  },
  // ------------------------------------------------------------------ 6-8) Minikler (çocuk çizgi serisi: büyük yuvarlak kafa, geniş gülüş)
  'minik-kiz': {
    name: 'Minik Kız',
    description: 'Defter kenarı çocuk çizimi: dev yuvarlak kafa, geniş gülümseme, kulaklar, ikili toka saç, benekli elbise. Neşeli çocuk / okul / aile içerikleri için.',
    rig: 'insan',
    etiketler: ['çocuk', 'kız', 'minik', 'okul', 'çizim', 'doodle', 'sevimli', 'neşeli', 'çöp adam', 'kids', 'aile', 'bebek', 'çizgi'],
    kullanim: 'Çocuk / okul / aile videoları, eğitim. Varyantlar: kuyruk (çizgili tişört + at kuyruğu), topuz, duz, boyali (renkli).',
    duygu: 'mutlu',
    ...MINIK,
    govde: { sekil: 'elbise', detay: ['benekli'] },
    ekler: ekler(MINIK_EK('sac-ikili')),
    varyantlar: {
      kuyruk: { govde: { sekil: 'dikdortgen', detay: ['cizgili'] }, ekAc: ['sac-firca'], ekKapat: ['sac-ikili'] },
      topuz: { govde: { detay: [] }, ekAc: ['sac-topuz-sarmal'], ekKapat: ['sac-ikili'] },
      duz: { govde: { detay: [] } },
      boyali: { renkler: { kafa: '#ffe3c8', govde: '#ff9ec2', desen: '#ffffff', sac: '#8a4f2a' } },
    },
  },
  'minik-oglan': {
    name: 'Minik Oğlan',
    description: 'Defter kenarı çocuk çizimi: dev yuvarlak kafa, geniş gülümseme, tarak saç, atlet ve şort. Neşeli çocuk / okul / spor içerikleri için.',
    rig: 'insan',
    etiketler: ['çocuk', 'oğlan', 'minik', 'okul', 'çizim', 'doodle', 'sevimli', 'neşeli', 'çöp adam', 'kids', 'aile', 'çizgi', 'spor'],
    kullanim: 'Çocuk / okul / aile videoları. Varyantlar: bukle (kıvırcık saç), tutam, cizgili (çizgili tişört), boyali (renkli).',
    duygu: 'mutlu',
    ...MINIK,
    govde: { sekil: 'dikdortgen', yaricap: [10, 10, 3, 3], detay: ['atlet', 'sort'] },
    ekler: ekler(MINIK_EK('sac-tarak')),
    varyantlar: {
      bukle: { ekAc: ['sac-bukle'], ekKapat: ['sac-tarak'] },
      tutam: { ekAc: ['sac-tutam'], ekKapat: ['sac-tarak'] },
      cizgili: { govde: { detay: ['cizgili', 'sort'] } },
      boyali: { renkler: { kafa: '#ffe3c8', govde: '#74c0fc', sort: '#ffd43b', sac: '#5a3b2a' } },
    },
  },
  'minik-lule': {
    name: 'Minik Lüle',
    description: 'Defter kenarı çocuk çizimi: dev yuvarlak kafa, geniş gülümseme, kıvırcık lüleli saç, A kesim elbise. Neşeli çocuk / okul / aile içerikleri için.',
    rig: 'insan',
    etiketler: ['çocuk', 'kız', 'kıvırcık', 'lüle', 'minik', 'okul', 'çizim', 'doodle', 'sevimli', 'neşeli', 'kids', 'çizgi'],
    kullanim: 'Çocuk / okul / aile videoları. Varyantlar: benekli, topuz, boyali (renkli).',
    duygu: 'mutlu',
    ...MINIK,
    govde: { sekil: 'elbise', detay: ['atlet'] },
    ekler: ekler(MINIK_EK('sac-lule')),
    varyantlar: {
      benekli: { govde: { detay: ['benekli'] } },
      topuz: { ekAc: ['sac-topuz-sarmal'], ekKapat: ['sac-lule'] },
      boyali: { renkler: { kafa: '#ffe3c8', govde: '#b197fc', sac: '#6b3a1f' } },
    },
  },

  // ------------------------------------------------------------------ 9-11) Doodle kediler (çizgi sanatı)
  kedicik: {
    name: 'Kedicik',
    description: 'Defter kenarı doodle kedisi: tombul yuvarlak vücut, iri baş, sivri kulaklar, bıyıklar, minik üçgen burun, kıvrık kuyruk. Sade, sevimli; hayvan, evcil, mizah ve çocuk içerikleri için.',
    rig: 'insan',
    etiketler: ['kedi', 'cat', 'doodle', 'çizim', 'sevimli', 'tombul', 'hayvan', 'evcil', 'minik', 'komik', 'mizah', 'çizgi', 'miyav', 'kawaii'],
    kullanim: 'Hayvan / evcil / çocuk / mizah videoları, sade çizim stilli içerikler. Varyantlar: benekli, cizgili (tabby), siyah, boyali (turuncu).',
    duygu: 'mutlu',
    ...KEDI,
    govde: { sekil: 'yumurta', detay: [] },
    kafa: { sekil: 'yumurta' },
    ekler: ekler(KEDI_EK),
    varyantlar: {
      benekli: { govde: { detay: ['benekli'] } },
      cizgili: { govde: { detay: ['tabby'] }, kafa: { detay: ['seritler'] }, renkler: { kuyrukUc: '#ffffff' } },
      siyah: { renkler: { kafa: '#3b3b4a', govde: '#3b3b4a', kuyruk: '#3b3b4a', kuyrukUc: '#3b3b4a', goz: '#ffe066', burun: '#ffa9b8' }, cizgi: { renk: '#14141c' } },
      boyali: { renkler: { kafa: '#f5a04d', govde: '#f5a04d', kuyruk: '#f5a04d', kuyrukUc: '#fff1de', desen: '#c9702a', burun: '#ffa9b8' } },
    },
  },
  'kare-kedi': {
    name: 'Kare Kedi',
    description: 'Kutu kafalı, iri şaşkın gözlü, çizgili çoraplı doodle kedi: komik ve akılda kalıcı. Mizah, sosyal medya ve çocuk içerikleri için.',
    rig: 'insan',
    etiketler: ['kedi', 'cat', 'kare', 'kutu', 'doodle', 'komik', 'mizah', 'şaşkın', 'çizim', 'sevimli', 'çizgi', 'meme'],
    kullanim: 'Mizahi / şaşkın tepki karakteri. Varyantlar: boyali (gri), siyah.',
    duygu: 'saskin',
    ...KEDI,
    olcu: { bas: [76, 64], boyun: 0, govde: [50, 14], omuzY: 8, omuzX: 36, kolUst: 26, kolAlt: 22, kalcaX: 22, bacakUst: 30, bacakAlt: 28, el: 8, ayak: [26, 12] },
    govde: { sekil: 'dikdortgen', yaricap: [4, 4, 4, 4], detay: [] },
    kafa: { sekil: 'kutu' },
    uzuv: { tur: 'cubuk', kalinlik: 4.4, el: 'yok', ayak: 'ayakkabi' },
    yuz: { goz: 'buyuk', boyut: 1.05, aralik: 0.62, yukseklik: -0.02, burun: 'nokta', biyik: 'kedi', agizY: 0.1, agizGen: 0.5, agizDerin: 1, kasEsik: 8, yanakGuc: 0 },
    renkler: { ...KEDI.renkler, iris: '#ffffff' },
    ekler: ekler(KEDI_EK.filter((e) => e.id !== 'kuyruk')),
    varyantlar: {
      boyali: { renkler: { kafa: '#c9ced6', govde: '#c9ced6', iris: '#ffffff' } },
      siyah: { renkler: { kafa: '#3b3b4a', govde: '#3b3b4a', iris: '#ffe066' }, cizgi: { renk: '#14141c' } },
    },
  },
  'top-kedi': {
    name: 'Top Kedi',
    description: 'Tam yuvarlak, top gibi doodle kedi: dev yuvarlak kafa-vücut, çizgili kuyruk, minik kulaklar ve bıyıklar. Çok sade ve sevimli; hayvan, çocuk, mizah içerikleri için.',
    rig: 'insan',
    etiketler: ['kedi', 'cat', 'top', 'yuvarlak', 'tombul', 'doodle', 'sevimli', 'çizim', 'komik', 'hayvan', 'çizgi', 'kawaii'],
    kullanim: 'Sade hayvan / çocuk / mizah videoları. Varyantlar: benekli, boyali.',
    duygu: 'mutlu',
    ...KEDI,
    olcu: { bas: [78, 74], boyun: 0, govde: [96, 70], omuzY: 10, omuzX: 34, kolUst: 22, kolAlt: 20, kalcaX: 24, bacakUst: 14, bacakAlt: 12, el: 8, ayak: [28, 6] },
    govde: { sekil: 'yumurta', detay: [] },
    kafa: { sekil: 'daire' },
    renkler: { ...KEDI.renkler, kuyrukUc: '#111111' },
    ekler: ekler(KEDI_EK),
    varyantlar: {
      benekli: { govde: { detay: ['benekli'] } },
      boyali: { renkler: { kafa: '#ffd2a8', govde: '#ffd2a8', kuyruk: '#ffd2a8', kuyrukUc: '#c9702a', desen: '#c9702a' } },
    },
  },

  // ------------------------------------------------------------------ 12) Gözlü (ince uzun çöp adam, iri halkalı gözler)
  gozlu: {
    name: 'Gözlü',
    description: 'İnce uzun boylu çöp adam: dev yuvarlak kafa, iri halkalı gözler, minik ağız, boyun, sivrilen gövde ve kollar, mitten eller. Temiz kalın çizgi; ifadeleri çok iyi okunur. Komik, şaşkın, meraklı anlatıcı karakter.',
    rig: 'insan',
    etiketler: ['çöp adam', 'stickman', 'gözlü', 'iri göz', 'uzun', 'ince', 'şaşkın', 'meraklı', 'komik', 'sade', 'temiz çizgi', 'anlatıcı', 'minimal', 'eğitim', 'whiteboard'],
    kullanim: 'Sade, temiz çizgili anlatıcı; şaşkın / meraklı tepkiler. Beyaz ve açık zeminlerde keskin okunur. Varyantlar: mavi, kirmizi, yesil (renkli tişört), kafalisi.',
    olcu: { bas: [64, 62], boyun: 14, boyunGen: 13, govde: [40, 82], omuzY: 8, omuzX: 17, kolUst: 52, kolAlt: 48, kalcaX: 14, bacakUst: 64, bacakAlt: 60, el: 11, ayak: [38, 11] },
    cizgi: { renk: '#111111', kalinlik: 5, titrek: 0, kaynama: 0 },
    renkler: { kafa: '#ffffff', govde: '#ffffff', iris: '#111111', goz: '#111111', agiz: '#7a2a33' },
    govde: { sekil: 'elbise', detay: [] },
    kafa: { sekil: 'daire' },
    uzuv: { tur: 'cubuk', kalinlik: 5, el: 'top', ayak: 'oval-dis' },
    yuz: { goz: 'buyuk', gozYuvarlak: true, boyut: 2.3, aralik: 0.99, yukseklik: -0.02, pupilBoyut: 0.78, agizY: 0.06, agizGen: 0.28, agizDerin: 1, agizKalinlik: 0.9, kasEsik: 8, kasSabit: true, yanakGuc: 0 },
    ekler: ekler(),
    varyantlar: {
      mavi: { renkler: { govde: '#8ec5ff' } },
      kirmizi: { renkler: { govde: '#ff9a9a' } },
      yesil: { renkler: { govde: '#a6e3a1' } },
      kafalisi: { renkler: { kafa: '#ffe3c8', govde: '#ffd43b' } },
    },
  },

};

const only = (process.argv.find((a) => a.startsWith('--sadece=')) || '').slice(9).split(',').filter(Boolean);

let wrote = 0;
for (const [id, doc] of Object.entries(SETS)) {
  if (only.length && !only.includes(id)) continue;
  const f = path.join(DIR, `${id}.json`);
  if (fs.existsSync(f) && !force) {
    console.log(`  atlandı (var): ${id}`);
    continue;
  }
  fs.writeFileSync(f, JSON.stringify(doc, null, 2) + '\n');
  wrote++;
  console.log(`  yazıldı: ${id}`);
}
console.log(`ok — ${wrote} karakter yazıldı (${DIR})`);
