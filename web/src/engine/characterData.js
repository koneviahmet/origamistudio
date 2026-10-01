// Karakter sistemi — paylaşılan veri: duygular (yüz), aksiyonlar (vücut klipleri), tutulan nesneler, efektler.
// Saf veri (DOM yok): tarayıcı, sunucu ve CLI (scripts/karakter-ara.mjs) aynı katalogu kullanır.
// Aksiyonlar iskelet (rig) üzerindeki eklem açılarını anlatır; bu yüzden aynı rig'i kullanan TÜM karakterlere uyar.
//
// Poz alanları (derece; uzunluk birimi = karakter "birimi", boy ≈ 380):
//   x, y      gövde kayması (y<0 yukarı: zıplama)         rot    gövde eğimi (+ = öne, yüzün baktığı yana)
//   sq        ezilme/uzama (1 = normal, <1 ezilir)         govde  ek gövde dönüşü
//   bas       baş dönüşü (+ öne)   basX, basY baş kayması   omuz   omuz kaldırma (+ yukarı)
//   kolL/R    omuz açısı: 0 = aşağı, 90 = yatay dışa, 180 = yukarı, negatif = gövdeye doğru
//   dirL/R    dirsek bükümü: önkol açısına eklenir (+ yukarı/dışa, − aşağı/içe)
//   bacL/R    kalça açısı: 0 = aşağı, + = ileri (yüzün baktığı yan)    dizL/R  diz bükümü (+ = baldır geri)
//   acik      bacak aralığı
// Kısayollar: kol, dir, bac, diz, on → iki tarafa birden (L/R ayrıca verilirse onlar kazanır).
//   onL/onR   1 ise o kol başın ÖNÜNDE çizilir (eli yüze götüren pozlar)
// IK (ters kinematik): clip.ik = { R: {ref, x, y, dirsek, w}, L: {…}, LR: {…} } — elin gideceği yer; kol açıları otomatik bulunur,
//   böylece poz her karakterin oranına uyar. ref: 'bas' (x,y baş yarıçapı cinsinden, y + aşağı) | 'govde' (x yarı genişlik, y 0=kalça … 1=boyun).
//   x her zaman kolun KENDİ yanına doğru + (LR kullanınca iki taraf aynalanır). dirsek: 'dis' | 'ic' | 'asagi' | 'yukari'. w: ağırlık (iz).
//
// İz (track) türleri: sayı | [[faz, değer, ease?], …] anahtar kareler (faz 0–1) | {o, a, f, p} → o + a·sin(2π(f·faz + p))

export const POSE0 = {
  x: 0, y: 0, rot: 0, sq: 1, govde: 0, bas: 0, basX: 0, basY: 0, omuz: 0,
  kolL: 10, kolR: 10, dirL: 0, dirR: 0, bacL: 0, bacR: 0, dizL: 0, dizR: 0, acik: 7,
  // IK: el hedefi ağırlığı / konumu (clip.ik ile tanımlanır) ve kolun başın önünde çizilmesi
  ikLW: 0, ikLX: 0, ikLY: 0, ikRW: 0, ikRX: 0, ikRY: 0, onL: 0, onR: 0,
};
export const POSE_KEYS = Object.keys(POSE0);

// ════════════════════════════════════════════════════════════════════════════
//  DUYGULAR — yüz ifadesi. Hepsi sayısal olduğundan duygular arası geçiş yumuşaktır.
//   goz: gözün biçimi · ac: göz açıklığı 0–1 · kas: [açıL, açıR, yükseklikL, yükseklikR]
//     (açı + = kaşın iç ucu yukarı → üzgün/endişeli, − = iç uç aşağı → kızgın)
//   agiz: { egri −1..1 (üzgün..gülen), ac 0..1 açıklık, gen genişlik çarpanı, dis, dil, dalga }
//   kizar: yanak kızarması 0–1 · gozyasi / ter / buhar: açık-kapalı süs · bakis: [x, y] bakış yönü
// ════════════════════════════════════════════════════════════════════════════
const M = (egri, ac = 0, gen = 1, extra = {}) => ({ egri, ac, gen, ...extra });
const E = (o) => ({ goz: 'nokta', ac: 1, kas: [0, 0, 0, 0], agiz: M(0), kizar: 0, gozyasi: 0, ter: 0, buhar: 0, bakis: [0, 0], ...o });

export const EMOTIONS = {
  notr: { ad: 'Nötr', aciklama: 'Sakin, yansız yüz', etiket: ['normal', 'sakin', 'düz', 'neutral', 'calm'], ...E({}) },
  mutlu: { ad: 'Mutlu', aciklama: 'Hafif gülümseme', etiket: ['gülümseme', 'memnun', 'happy', 'smile', 'iyi'], ...E({ agiz: M(0.75), kas: [-3, -3, 0.1, 0.1] }) },
  'cok-mutlu': { ad: 'Çok mutlu', aciklama: 'Kocaman gülüş, parlak yüz', etiket: ['sevinç', 'neşe', 'harika', 'joy', 'excited', 'cheerful'], ...E({ agiz: M(0.9, 0.75, 1.15), kas: [-4, -4, 0.3, 0.3], kizar: 0.3 }) },
  gulen: { ad: 'Gülen', aciklama: 'Kahkaha, gözler kapalı ^ ^', etiket: ['kahkaha', 'komik', 'laugh', 'lol', 'eğlenme'], ...E({ goz: 'mutlu', agiz: M(0.9, 1, 1.2), kas: [-6, -6, 0.2, 0.2], kizar: 0.35 }) },
  uzgun: { ad: 'Üzgün', aciklama: 'Kaşlar iç uçtan yukarıda, ağız aşağı', etiket: ['mutsuz', 'keder', 'sad', 'hüzün', 'kırgın'], ...E({ kas: [16, 16, 0.05, 0.05], agiz: M(-0.8), bakis: [0, 0.5] }) },
  aglayan: { ad: 'Ağlayan', aciklama: 'Gözyaşları akar', etiket: ['ağlamak', 'gözyaşı', 'cry', 'tears', 'sob'], ...E({ goz: 'kapali', kas: [20, 20, 0.15, 0.15], agiz: M(-0.9, 0.55, 0.9), gozyasi: 1 }) },
  kizgin: { ad: 'Kızgın', aciklama: 'Çatık kaşlar, aşağı ağız', etiket: ['öfke', 'sinirli', 'angry', 'mad', 'bozulmuş'], ...E({ goz: 'kizgin', kas: [-20, -20, -0.15, -0.15], agiz: M(-0.55) }) },
  ofkeli: { ad: 'Öfke patlaması', aciklama: 'Dişler sıkılı, buhar çıkar', etiket: ['çılgın', 'hiddet', 'rage', 'furious', 'sinir krizi'], ...E({ goz: 'kizgin', kas: [-28, -28, -0.25, -0.25], agiz: M(-0.2, 0, 1.1, { dis: 1 }), buhar: 1, kizar: 0.3 }) },
  saskin: { ad: 'Şaşkın', aciklama: 'Kaşlar yukarıda, ağız "o"', etiket: ['şaşırmış', 'hayret', 'surprised', 'wow', 'shock'], ...E({ goz: 'genis', kas: [0, 0, 0.8, 0.8], agiz: M(0, 0.7, 0.4) }) },
  korku: { ad: 'Korku', aciklama: 'Gözler iri, ağız titrek, ter damlası', etiket: ['korkmuş', 'panik', 'afraid', 'scared', 'dehşet'], ...E({ goz: 'genis', kas: [14, 14, 0.55, 0.55], agiz: M(-0.2, 0.45, 0.9, { dalga: 1 }), ter: 1 }) },
  dusunceli: { ad: 'Düşünceli', aciklama: 'Yukarı bakar, ağız yana kayar', etiket: ['düşünen', 'merak', 'thinking', 'hmm', 'meraklı'], ...E({ kas: [6, -8, 0.3, 0], agiz: M(0.2, 0, 0.7), bakis: [0.6, -0.6] }) },
  endiseli: { ad: 'Endişeli', aciklama: 'Kaygılı, dalgalı ağız', etiket: ['kaygı', 'tedirgin', 'worried', 'anxious', 'gergin'], ...E({ kas: [18, 18, 0.25, 0.25], agiz: M(-0.1, 0, 0.8, { dalga: 1 }), ter: 0.6 }) },
  sikilmis: { ad: 'Sıkılmış', aciklama: 'Yarı kapalı göz, düz ağız', etiket: ['can sıkıntısı', 'ilgisiz', 'bored', 'meh', 'umursamaz'], ...E({ goz: 'yarim', kas: [0, 0, -0.1, -0.1], agiz: M(-0.1, 0, 0.7) }) },
  yorgun: { ad: 'Yorgun', aciklama: 'Ağır göz kapakları', etiket: ['uykulu', 'bitkin', 'tired', 'sleepy', 'bezgin'], ...E({ goz: 'yarim', kas: [10, 10, -0.05, -0.05], agiz: M(-0.2, 0.3, 0.6), bakis: [0, 0.4] }) },
  utanmis: { ad: 'Utanmış', aciklama: 'Kızaran yanaklar, kaçamak bakış', etiket: ['mahcup', 'çekingen', 'shy', 'embarrassed', 'kızarmış'], ...E({ kas: [10, 10, 0.1, 0.1], agiz: M(0.15, 0, 0.7, { dalga: 1 }), kizar: 1, bakis: [-0.7, 0.5], ter: 0.5 }) },
  asik: { ad: 'Âşık', aciklama: 'Kalp gözler, kızaran yanaklar', etiket: ['sevgi', 'hayran', 'love', 'in love', 'kalp'], ...E({ goz: 'kalp', agiz: M(0.8), kizar: 0.9 }) },
  heyecanli: { ad: 'Heyecanlı', aciklama: 'Yıldız gözler, kocaman gülüş', etiket: ['coşku', 'hevesli', 'excited', 'stars', 'wow harika'], ...E({ goz: 'yildiz', agiz: M(0.9, 0.8, 1.15), kas: [-3, -3, 0.4, 0.4], kizar: 0.4 }) },
  kuskulu: { ad: 'Şüpheci', aciklama: 'Tek kaş kalkık, yarı göz', etiket: ['şüphe', 'inanmayan', 'suspicious', 'skeptical', 'ima'], ...E({ goz: 'yarim', kas: [-12, 8, 0, 0.55], agiz: M(0.15, 0, 0.7), bakis: [0.7, 0] }) },
  gururlu: { ad: 'Kendinden emin', aciklama: 'Yan gülüş, özgüven', etiket: ['gurur', 'havalı', 'confident', 'proud', 'smug', 'kibirli'], ...E({ goz: 'yarim', kas: [-8, -8, 0.2, 0.2], agiz: M(0.7, 0, 0.9), kizar: 0.15 }) },
  uykulu: { ad: 'Uykulu', aciklama: 'Gözler kapalı, huzurlu', etiket: ['uyuyan', 'uyku', 'sleep', 'zzz', 'dinlenmiş'], ...E({ goz: 'kapali', agiz: M(0.1, 0.25, 0.5) }) },
  huzurlu: { ad: 'Huzurlu', aciklama: 'Gözler kapalı gülümseme', etiket: ['rahat', 'sakin mutlu', 'peaceful', 'relaxed', 'keyifli'], ...E({ goz: 'kapali', agiz: M(0.7), kas: [-2, -2, 0.1, 0.1] }) },
  dil: { ad: 'Şaka / dil çıkaran', aciklama: 'Dil çıkarır, muzip', etiket: ['şaka', 'muzip', 'playful', 'tongue', 'ayıp'], ...E({ goz: 'mutlu', agiz: M(0.6, 0.3, 1, { dil: 1 }), kas: [-4, -4, 0.2, 0.2] }) },
  bagiran: { ad: 'Bağıran', aciklama: 'Ağız sonuna kadar açık, kızgın', etiket: ['haykırış', 'çığlık', 'shout', 'yell', 'scream'], ...E({ goz: 'kizgin', kas: [-22, -22, -0.1, -0.1], agiz: M(-0.4, 1, 1.05) }) },
};
export const EMOTION_NAMES = Object.keys(EMOTIONS);

// ════════════════════════════════════════════════════════════════════════════
//  AKSİYONLAR — vücut klipleri
//   sure: bir döngü (saniye, hiz = 1) · dongu: tekrarlar · yoksa tek sefer + son pozda kalır
//   bekle: boşta türü (konuşma sırasında otomatik 'konus' jestine geçilebilir)
//   adim: yürüyüş/koşuda bir döngüde alınan yol (bacak boyu cinsinden) — dx/dy verilince hız otomatik ayarlanır
//   isaret: 'R' → hedef verilirse o kol hedefe uzanır · efekt: başın üstünde çıkan süs · tutar: önerilen nesne
//   grup: arayüz sınıflaması
// ════════════════════════════════════════════════════════════════════════════
const sin = (o, a, f = 1, p = 0) => ({ o, a, f, p });

export const ACTIONS = {
  // ---- Duruş / bekleme ------------------------------------------------------
  bekle: { ad: 'Bekle', grup: 'durus', aciklama: 'Nefes alır, hafifçe sallanır (varsayılan duruş)', sure: 3.4, dongu: true, bekle: true, etiket: ['durmak', 'idle', 'ayakta', 'stand', 'hazır'], poz: { bas: sin(0, 2.2), kol: sin(10, 1.5) } },
  dinle: { ad: 'Dinle', grup: 'durus', aciklama: 'Başı hafif yana eğik, ara sıra başını sallar — diyalogda karşı taraf', sure: 3.2, dongu: true, bekle: true, etiket: ['dinlemek', 'listen', 'karşıdaki', 'ilgiyle'], poz: { bas: [[0, 4], [0.3, 7], [0.5, 12], [0.62, 6], [0.8, 8], [1, 4]], basY: sin(0, 1, 2), kol: 12 } },
  'kollar-belde': { ad: 'Eller belde', grup: 'durus', aciklama: 'Dik, kendinden emin duruş', sure: 3, dongu: true, bekle: true, etiket: ['hands on hips', 'kararlı', 'poz', 'meydan okuma'], ik: { LR: { ref: 'govde', x: 0.98, y: 0.4, dirsek: 'dis' } }, poz: { bas: sin(0, 1.5) } },
  'kollar-kavusuk': { ad: 'Kollar kavuşuk', grup: 'durus', aciklama: 'Kollar göğüste çaprazlanır', sure: 3, dongu: true, bekle: true, etiket: ['arms crossed', 'bekleyen', 'küs', 'sabırsız'], ik: { LR: { ref: 'govde', x: -0.5, y: 0.7, dirsek: 'asagi' } }, poz: { bas: sin(0, 1.5) } },
  sikilgan: { ad: 'Sarkık duruş', grup: 'durus', aciklama: 'Kollar sarkık, omuzlar düşük', sure: 4, dongu: true, bekle: true, etiket: ['bored', 'ilgisiz', 'sıkıntı', 'hareketsiz'], poz: { kol: 4, omuz: -6, bas: sin(3, 2), rot: 3 } },
  // ---- Hareket --------------------------------------------------------------
  yuru: { ad: 'Yürü', grup: 'hareket', aciklama: 'Dx/dy ile birlikte kullan: karakter yürür (adım hızı otomatik)', sure: 1, dongu: true, adim: 1.15, etiket: ['yürümek', 'gitmek', 'walk', 'ilerlemek'], poz: { bacL: sin(0, 26), bacR: sin(0, -26), dizL: sin(16, 16, 1, 0.25), dizR: sin(16, 16, 1, 0.75), acik: 4, kolL: sin(13, 7), kolR: sin(13, -7), dirL: 6, dirR: 6, bas: sin(0, 1.5, 2), rot: 3 } },
  kos: { ad: 'Koş', grup: 'hareket', aciklama: 'Hızlı koşu; öne eğik, kollar bükük', sure: 0.62, dongu: true, adim: 2, etiket: ['koşmak', 'acele', 'run', 'sprint', 'kaçmak'], poz: { bacL: sin(0, 48), bacR: sin(0, -48), dizL: sin(34, 34, 1, 0.25), dizR: sin(34, 34, 1, 0.75), acik: 3, kolL: sin(35, 20), kolR: sin(35, -20), dirL: 80, dirR: 80, rot: 13, bas: -5, y: sin(-4, -4, 2, 0.25) } },
  'sekerek-yuru': { ad: 'Sekerek yürü', grup: 'hareket', aciklama: 'Neşeli sekme adımları', sure: 0.9, dongu: true, adim: 1.0, etiket: ['skip', 'neşeli yürüyüş', 'hoplayarak', 'mutlu yürümek'], poz: { bacL: sin(0, 30), bacR: sin(0, -30), dizL: sin(22, 22, 1, 0.25), dizR: sin(22, 22, 1, 0.75), kolL: sin(32, 18), kolR: sin(32, -18), dirL: 55, dirR: 55, y: sin(-9, -9, 2, 0.25), bas: sin(0, 4, 1) } },
  'sinsi-yuru': { ad: 'Sinsi yürü', grup: 'hareket', aciklama: 'Eğilip parmak ucunda yavaş yürüme', sure: 1.6, dongu: true, adim: 0.7, etiket: ['gizli', 'sneak', 'tiptoe', 'dikkatli', 'sessiz'], poz: { bacL: sin(0, 18), bacR: sin(0, -18), dizL: sin(40, 18, 1, 0.25), dizR: sin(40, 18, 1, 0.75), rot: 14, bas: -8, basY: 4, kol: 22, dir: 45, sq: 0.94 } },
  zipla: { ad: 'Zıpla', grup: 'hareket', aciklama: 'Tek zıplama (çömel → havalan → konup ez)', sure: 1.05, etiket: ['sıçramak', 'jump', 'hop', 'havalanmak'], poz: { y: [[0, 0], [0.16, 0], [0.5, -125, 'outQuad'], [0.82, 0, 'inQuad'], [1, 0]], sq: [[0, 1], [0.14, 0.84], [0.26, 1.12], [0.5, 1.02], [0.8, 1.04], [0.9, 0.86], [1, 1]], diz: [[0, 0], [0.14, 60], [0.28, 0], [0.5, 40], [0.82, 10], [0.9, 55], [1, 0]], bac: [[0, 0], [0.5, 8], [1, 0]], kol: [[0, 10], [0.14, 5], [0.3, 150], [0.55, 165], [0.82, 60], [0.92, 10], [1, 10]], dir: [[0, 0], [0.4, 15], [1, 0]] } },
  'zipla-yerinde': { ad: 'Yerinde zıpla', grup: 'hareket', aciklama: 'Sürekli sekme (heyecan / bekleme)', sure: 0.7, dongu: true, etiket: ['hoplamak', 'bounce', 'heyecanla sıçra'], poz: { y: [[0, 0], [0.5, -34, 'outQuad'], [1, 0, 'inQuad']], sq: [[0, 0.9], [0.18, 1.08], [0.5, 1.02], [0.86, 1.04], [1, 0.9]], diz: [[0, 38], [0.2, 4], [0.5, 22], [0.9, 6], [1, 38]], kol: [[0, 25], [0.5, 70], [1, 25]], dir: [[0, 55], [0.5, 30], [1, 55]] } },
  dans: { ad: 'Dans', grup: 'hareket', aciklama: 'Kalça sallar, kollar sırayla havaya', sure: 1.2, dongu: true, etiket: ['dance', 'oynamak', 'eğlence', 'parti', 'ritim'], poz: { x: sin(0, 9, 1), rot: sin(0, 7, 1, 0.25), kolL: sin(110, 60, 1), kolR: sin(110, -60, 1), dirL: sin(30, 25, 2), dirR: sin(30, 25, 2, 0.5), bacL: sin(0, 10, 1), bacR: sin(0, -10, 1), dizL: sin(18, 18, 2), dizR: sin(18, 18, 2, 0.5), y: sin(-5, -5, 2, 0.25), bas: sin(0, 8, 1, 0.25) } },
  // ---- İletişim -------------------------------------------------------------
  konus: { ad: 'Konuş', grup: 'iletisim', aciklama: 'Konuşurken jest yapar (söz katmanıyla otomatik devreye girer)', sure: 2.6, dongu: true, etiket: ['söylemek', 'anlatmak', 'talk', 'speak', 'diyalog'], poz: { kolR: [[0, 34], [0.22, 58], [0.45, 30], [0.7, 62], [1, 34]], dirR: [[0, 60], [0.25, 98], [0.5, 50], [0.75, 92], [1, 60]], kolL: [[0, 14], [0.3, 12], [0.55, 40], [0.8, 16], [1, 14]], dirL: [[0, 10], [0.55, 70], [1, 10]], bas: sin(0, 3, 2), basY: sin(0, 1.2, 4) } },
  anlat: { ad: 'Anlat (açık avuç)', grup: 'iletisim', aciklama: 'İki el öne açık: açıklama yaparken', sure: 2.4, dongu: true, etiket: ['açıklamak', 'explain', 'tanıtmak', 'sunmak', 'öğretmek'], poz: { kol: sin(48, 8), dir: sin(75, 14, 1, 0.25), bas: sin(0, 3, 1), omuz: 2 } },
  'el-salla': { ad: 'El salla', grup: 'iletisim', aciklama: 'Sürekli el sallar (merhaba / hoşça kal)', sure: 0.85, dongu: true, etiket: ['wave', 'merhaba', 'selam', 'hoşça kal', 'bay bay'], poz: { kolR: 138, dirR: sin(0, 26), kolL: 10, bas: sin(3, 3, 1), omuz: 3 } },
  selamla: { ad: 'Selamla', grup: 'iletisim', aciklama: 'Tek seferlik: el kalkar, üç kez sallanır, iner', sure: 2.6, etiket: ['hello', 'greet', 'merhaba de', 'karşılama', 'tanışma'], poz: { kolR: [[0, 10], [0.14, 138], [0.86, 138], [1, 10]], dirR: [[0, 0], [0.16, 0], [0.26, 28], [0.38, -24], [0.5, 28], [0.62, -24], [0.74, 28], [0.84, 0], [1, 0]], bas: [[0, 0], [0.2, 4], [0.8, 4], [1, 0]] } },
  tanit: { ad: 'Tanıt / sun', grup: 'iletisim', aciklama: 'Bir kol yana açılır (yanındaki ürünü / nesneyi göstermek için), diğer el belde', sure: 1.1, etiket: ['sunmak', 'present', 'tanıtım', 'ürün göster', 'ta-da yana'], isaret: 'R', ik: { L: { ref: 'govde', x: 0.98, y: 0.4, dirsek: 'dis' } }, poz: { kolR: [[0, 10], [0.45, 96, 'outBack'], [1, 96]], dirR: [[0, 0], [0.5, 6], [1, 6]], kolL: [[0, 10], [0.4, 48], [1, 48]], dirL: [[0, 0], [0.4, -105], [1, -105]], bas: [[0, 0], [0.5, -5], [1, -5]] } },
  sunum: { ad: 'Sunum (ta-da)', grup: 'iletisim', aciklama: 'İki kol yukarı-dışa açılır: büyük tanıtım / final', sure: 1.0, etiket: ['ta-da', 'açılış', 'finale', 'tadaa', 'büyük tanıtım'], poz: { kol: [[0, 10], [0.45, 130, 'outBack'], [1, 130]], dir: [[0, 0], [0.5, 12], [1, 12]], bas: [[0, 0], [0.5, -6], [1, -6]], y: [[0, 0], [0.3, -10, 'outQuad'], [0.6, 0], [1, 0]] } },
  isaret: { ad: 'İşaret et', grup: 'iletisim', aciklama: 'Kol hedefe uzanır (hedef: katman id ya da [x,y]); hedefsizse yana işaret eder', sure: 0.9, isaret: 'R', etiket: ['point', 'göstermek', 'şuraya bak', 'yönlendirmek', 'o'], poz: { kolR: [[0, 10], [0.4, 100, 'outBack'], [1, 100]], dirR: 0, kolL: 10, bas: [[0, 0], [0.4, -4], [1, -4]] } },
  goster: { ad: 'Göster (nesne kaldır)', grup: 'iletisim', aciklama: 'Elindeki nesneyi yüz hizasına kaldırır (tutar ile kullan)', sure: 0.9, tutar: 'kitap', etiket: ['hold up', 'elinde tut', 'ürün göster', 'kaldır'], poz: { kolR: [[0, 10], [0.45, 62, 'outBack'], [1, 62]], dirR: [[0, 0], [0.5, 98], [1, 98]], kolL: 10, bas: [[0, 0], [0.5, -4], [1, -4]] } },
  evet: { ad: 'Evet (baş salla)', grup: 'iletisim', aciklama: 'Onaylayarak başını aşağı yukarı sallar', sure: 0.95, dongu: true, etiket: ['onay', 'nod', 'tamam', 'yes', 'katılıyorum'], poz: { bas: sin(5, 12, 2), basY: sin(0, 2, 2), kol: 10 } },
  hayir: { ad: 'Hayır (baş salla)', grup: 'iletisim', aciklama: 'Başını yanlara sallar, parmak sallar', sure: 1.0, dongu: true, etiket: ['red', 'no', 'olmaz', 'katılmıyorum', 'yanlış'], poz: { basX: sin(0, 6, 2), bas: sin(0, 3, 2, 0.25), kolR: 62, dirR: sin(100, 26, 2), kolL: 10, rot: sin(0, 2, 2) } },
  'omuz-silk': { ad: 'Omuz silk', grup: 'iletisim', aciklama: 'Bilmiyorum / ne yapalım: avuçlar yukarı, omuzlar kalkık', sure: 1.0, etiket: ['shrug', 'bilmem', 'emin değil', 'kararsız', 'ne bileyim'], poz: { kol: [[0, 10], [0.35, 52, 'outBack'], [1, 52]], dir: [[0, 0], [0.4, 100], [1, 100]], omuz: [[0, 0], [0.35, 14], [1, 14]], bas: [[0, 0], [0.4, 9], [1, 9]] } },
  alkis: { ad: 'Alkışla', grup: 'iletisim', aciklama: 'Ellerini çırpar', sure: 0.5, dongu: true, etiket: ['clap', 'tebrik', 'bravo', 'takdir', 'applause'], ik: { LR: { ref: 'govde', x: [[0, 0.95], [0.4, 0.95], [0.55, -0.04], [0.72, -0.04], [1, 0.95]], y: 0.78, dirsek: 'asagi' } }, poz: { y: sin(-2, -2, 2, 0.25), bas: sin(0, 2, 2) } },
  dusun: { ad: 'Düşün', grup: 'iletisim', aciklama: 'Elini çenesine koyar, başı yana eğik', sure: 3, dongu: true, bekle: true, etiket: ['think', 'hmm', 'düşünmek', 'karar ver', 'plan'], efekt: 'soru', ik: { R: { ref: 'bas', x: 0.38, y: 0.8, dirsek: 'asagi' }, L: { ref: 'govde', x: -0.75, y: 0.45, dirsek: 'asagi' } }, poz: { bas: sin(8, 2), rot: 2, onR: 1 } },
  fikir: { ad: 'Fikir bulur', grup: 'iletisim', aciklama: 'Parmağını kaldırır, üstünde ampul yanar', sure: 1.0, etiket: ['idea', 'buldum', 'eureka', 'aydınlanma', 'yaratıcı'], efekt: 'ampul', poz: { kolR: [[0, 10], [0.3, 168, 'outBack'], [1, 168]], dirR: 0, bas: [[0, 0], [0.3, -6], [1, -6]], y: [[0, 0], [0.18, -16, 'outQuad'], [0.36, 0], [1, 0]], kolL: 10 } },
  'el-kaldir': { ad: 'Elini kaldır (soru)', grup: 'iletisim', aciklama: 'Parmak kaldırarak söz ister', sure: 0.9, etiket: ['soru sor', 'raise hand', 'söz iste', 'öğrenci'], efekt: 'soru', poz: { kolR: [[0, 10], [0.4, 172, 'outBack'], [1, 172]], dirR: 0, bas: [[0, 0], [0.4, 5], [1, 5]], kolL: 10 } },
  sus: { ad: 'Sus işareti', grup: 'iletisim', aciklama: 'Parmağı dudağa: sessiz ol / sır', sure: 0.8, etiket: ['shh', 'sessiz', 'sır', 'quiet', 'gizli'], ik: { R: { ref: 'bas', x: 0.06, y: 0.52, dirsek: 'dis', w: [[0, 0], [0.45, 1], [1, 1]] } }, poz: { kolR: 20, dirR: 0, bas: [[0, 0], [0.4, -3], [1, -3]], onR: 1 } },
  egil: { ad: 'Eğil (reverans)', grup: 'iletisim', aciklama: 'Öne eğilip selam verir', sure: 1.8, etiket: ['bow', 'selam', 'teşekkür', 'saygı', 'final'], poz: { rot: [[0, 0], [0.3, 48, 'outCubic'], [0.65, 48], [1, 0]], bas: [[0, 0], [0.3, 12], [0.65, 12], [1, 0]], kol: [[0, 10], [0.3, 4], [0.65, 4], [1, 10]], bacL: [[0, 0], [0.3, -6], [0.65, -6], [1, 0]], bacR: [[0, 0], [0.3, -6], [0.65, -6], [1, 0]] } },
  // ---- Duygu / tepki --------------------------------------------------------
  sevin: { ad: 'Sevin', grup: 'duygu', aciklama: 'Kollar yukarıda zıplar (kutlama)', sure: 0.8, dongu: true, etiket: ['cheer', 'yaşasın', 'kutlama', 'başarı', 'hurra'], efekt: 'yildiz', poz: { kol: sin(150, 10, 2), dir: sin(14, 12, 2, 0.25), y: [[0, 0], [0.5, -42, 'outQuad'], [1, 0, 'inQuad']], sq: [[0, 0.93], [0.2, 1.06], [0.5, 1.02], [0.9, 1.04], [1, 0.93]], diz: [[0, 30], [0.2, 4], [0.5, 22], [1, 30]], bas: sin(-4, 3, 1) } },
  zafer: { ad: 'Zafer', grup: 'duygu', aciklama: 'Yumruk havada, göğüs kabarık', sure: 1.1, dongu: true, etiket: ['victory', 'başardım', 'kazandı', 'gurur', 'yes!'], ik: { L: { ref: 'govde', x: 0.98, y: 0.4, dirsek: 'dis' } }, poz: { kolR: sin(160, 7, 2), dirR: -8, kolL: 14, dirL: -80, bas: sin(-6, 2, 1), rot: -3, y: sin(-3, -3, 2, 0.25) } },
  'uzgun-ol': { ad: 'Üzül', grup: 'duygu', aciklama: 'Omuzlar çöker, baş eğilir', sure: 3.2, dongu: true, bekle: true, etiket: ['sad', 'mutsuz', 'çökmek', 'moral bozuk', 'hayal kırıklığı'], poz: { rot: 6, bas: sin(14, 2), kol: sin(4, 2), omuz: -8, sq: 0.985 } },
  agla: { ad: 'Ağla', grup: 'duygu', aciklama: 'Ellerini yüzüne götürür, omuzları titrer', sure: 0.7, dongu: true, etiket: ['cry', 'ağlamak', 'hıçkırık', 'gözyaşı', 'üzüntü'], ik: { LR: { ref: 'bas', x: 0.5, y: 0.12, dirsek: 'dis' } }, poz: { y: sin(-2, -2, 3), rot: 5, bas: sin(14, 2, 3), omuz: sin(0, 4, 3), on: 1 } },
  kizgin: { ad: 'Kızgınlık (tepin)', grup: 'duygu', aciklama: 'Eller belde, ayağını yere vurur', sure: 0.8, dongu: true, etiket: ['angry', 'sinirlenmek', 'tepinmek', 'stomp', 'sinir'], efekt: 'sinir', ik: { LR: { ref: 'govde', x: 0.98, y: 0.4, dirsek: 'dis' } }, poz: { bacR: [[0, 0], [0.25, 22], [0.4, 0], [1, 0]], y: [[0, 0], [0.4, -5], [0.45, 0], [1, 0]], rot: 4, bas: sin(4, 2, 1), sq: [[0, 1], [0.42, 0.97], [0.5, 1], [1, 1]] } },
  yumruk: { ad: 'Yumruk sallar', grup: 'duygu', aciklama: 'Yumruğunu öfkeyle havada sallar', sure: 0.6, dongu: true, etiket: ['fist', 'öfke', 'protesto', 'kızgın', 'hesaplaşma'], efekt: 'sinir', ik: { L: { ref: 'govde', x: 0.98, y: 0.4, dirsek: 'dis' } }, poz: { kolR: sin(165, 9, 2), dirR: sin(-10, 8, 2, 0.25), kolL: 14, dirL: -85, rot: sin(3, 2, 2), bas: 4 } },
  saskin: { ad: 'Şaşır (geri sıçra)', grup: 'duygu', aciklama: 'Geri zıplar, kollar yukarı: şok anı', sure: 0.8, etiket: ['surprise', 'şok', 'hay aksi', 'vay', 'irkilmek'], efekt: 'unlem', poz: { x: [[0, 0], [0.2, -22, 'outQuad'], [1, -22]], y: [[0, 0], [0.2, -28, 'outQuad'], [0.45, 0, 'inQuad'], [1, 0]], rot: [[0, 0], [0.2, -9], [1, -9]], kol: [[0, 10], [0.2, 118, 'outBack'], [1, 118]], dir: [[0, 0], [0.25, 30], [1, 30]], bas: [[0, 0], [0.2, -8], [1, -8]], sq: [[0, 1], [0.12, 1.06], [0.5, 0.96], [1, 1]] } },
  kork: { ad: 'Korkudan titre', grup: 'duygu', aciklama: 'Eller yanaklarda, vücut titrer', sure: 0.35, dongu: true, etiket: ['fear', 'ürkmek', 'titremek', 'panik', 'dehşet'], ik: { LR: { ref: 'bas', x: 1.0, y: 0.5, dirsek: 'dis' } }, poz: { x: sin(0, 3, 1), sq: 0.96, bacL: -6, bacR: 6, diz: 14, bas: sin(0, 2, 2), on: 1 } },
  gule: { ad: 'Kahkaha at', grup: 'duygu', aciklama: 'Gövde sarsılır, eller karında', sure: 0.55, dongu: true, etiket: ['laugh', 'gülmek', 'kahkaha', 'komik', 'ölüyorum'], ik: { LR: { ref: 'govde', x: 0.4, y: 0.5, dirsek: 'dis' } }, poz: { rot: sin(-4, 6, 2), bas: sin(-12, 6, 2), y: sin(-3, -3, 2, 0.25), sq: sin(1, 0.03, 2) } },
  yorgun: { ad: 'Yorgun düş', grup: 'duygu', aciklama: 'Nefes nefese, eğilmiş', sure: 1.6, dongu: true, bekle: true, etiket: ['tired', 'bitkin', 'nefes nefese', 'bezgin'], poz: { rot: 12, bas: sin(16, 2), kol: sin(2, 2), dir: 12, diz: 12, sq: sin(0.96, 0.02) } },
  'kas-goster': { ad: 'Kas göster', grup: 'duygu', aciklama: 'İki kolla güç gösterisi', sure: 1.2, etiket: ['flex', 'güçlü', 'kuvvet', 'strong', 'kahraman'], poz: { kol: [[0, 10], [0.4, 100, 'outBack'], [1, 100]], dir: [[0, 0], [0.4, 105], [1, 105]], bas: [[0, 0], [0.4, -5], [1, -5]], acik: [[0, 7], [0.4, 14], [1, 14]] } },
};
export const ACTION_NAMES = Object.keys(ACTIONS);
export const ACTION_GROUPS = [['durus', 'Duruş'], ['hareket', 'Hareket'], ['iletisim', 'İletişim'], ['duygu', 'Duygu / tepki']];

// ════════════════════════════════════════════════════════════════════════════
//  Tutulan nesneler (tutar: { nesne, metin?, renk?, el: 'R'|'L', olcek? })
// ════════════════════════════════════════════════════════════════════════════
export const PROPS = {
  tabela: { ad: 'Tabela', aciklama: 'Sopa üstünde yazılı pano — metin ver', etiket: ['pano', 'sign', 'afiş', 'yazı', 'duyuru'] },
  kitap: { ad: 'Kitap', aciklama: 'Kapaklı kitap', etiket: ['book', 'ders', 'okumak', 'eğitim'] },
  telefon: { ad: 'Telefon', aciklama: 'Akıllı telefon', etiket: ['phone', 'mobil', 'uygulama', 'arama'] },
  mikrofon: { ad: 'Mikrofon', aciklama: 'El mikrofonu', etiket: ['mic', 'konuşma', 'sunucu', 'podcast'] },
  bayrak: { ad: 'Bayrak', aciklama: 'Direkli bayrak (renk ver)', etiket: ['flag', 'hedef', 'zafer', 'başarı'] },
  ampul: { ad: 'Ampul', aciklama: 'Elde tutulan yanan ampul', etiket: ['bulb', 'fikir', 'idea', 'ışık'] },
  buyutec: { ad: 'Büyüteç', aciklama: 'Büyüteç', etiket: ['magnifier', 'araştırma', 'inceleme', 'arama'] },
  kahve: { ad: 'Kahve', aciklama: 'Buharlı fincan', etiket: ['coffee', 'çay', 'mola', 'içecek'] },
  hediye: { ad: 'Hediye', aciklama: 'Kurdeleli hediye kutusu', etiket: ['gift', 'sürpriz', 'ödül', 'doğum günü'] },
  laptop: { ad: 'Dizüstü', aciklama: 'Açık dizüstü bilgisayar', etiket: ['laptop', 'bilgisayar', 'çalışma', 'kod'] },
  'balon-gaz': { ad: 'Balon', aciklama: 'İpli renkli balon', etiket: ['balloon', 'parti', 'kutlama', 'eğlence'] },
  kalp: { ad: 'Kalp', aciklama: 'Kırmızı kalp', etiket: ['heart', 'sevgi', 'beğeni', 'aşk'] },
  yildiz: { ad: 'Yıldız', aciklama: 'Sarı yıldız', etiket: ['star', 'ödül', 'puan', 'başarı'] },
  kalem: { ad: 'Kalem', aciklama: 'Kurşun kalem', etiket: ['pencil', 'yazı', 'not', 'çizim'] },
  cicek: { ad: 'Çiçek', aciklama: 'Saplı çiçek', etiket: ['flower', 'doğa', 'hediye', 'bahar'] },
};
export const PROP_NAMES = Object.keys(PROPS);

// ════════════════════════════════════════════════════════════════════════════
//  Efektler (başın üstünde kısa süre çıkan süsler) ve ekler (aksesuar türleri)
// ════════════════════════════════════════════════════════════════════════════
export const EFFECTS = {
  ampul: 'Yanan ampul (fikir)', unlem: 'Ünlem (şok)', soru: 'Soru işareti', kalp: 'Yükselen kalpler', yildiz: 'Parıltı yıldızları', sinir: 'Sinir damarı', muzik: 'Müzik notaları', uyku: 'Zzz',
};
export const EK_TURLERI = {
  sac: { ad: 'Saç', stiller: ['kisa', 'dikenli', 'topuz', 'uzun', 'at-kuyrugu', 'tutam', 'kabarik', 'ikili', 'tarak', 'bukle', 'firca', 'topuz-sarmal', 'lule'] },
  sapka: { ad: 'Şapka / başlık', stiller: ['bere', 'silindir', 'kep', 'kask', 'sef', 'parti', 'tac', 'astronot'] },
  gozluk: { ad: 'Gözlük', stiller: ['yuvarlak', 'gunes'] },
  kulak: { ad: 'Kulak', stiller: ['insan', 'kedi', 'ayi', 'tavsan'] },
  kuyruk: { ad: 'Kuyruk', stiller: ['kedi', 'tilki'] },
  anten: { ad: 'Anten', stiller: ['top'] },
  kravat: { ad: 'Kravat', stiller: ['duz'] },
  papyon: { ad: 'Papyon', stiller: ['duz'] },
  atki: { ad: 'Atkı', stiller: ['duz'] },
  pelerin: { ad: 'Pelerin', stiller: ['duz'] },
  biyik: { ad: 'Bıyık', stiller: ['duz'] },
  sakal: { ad: 'Sakal', stiller: ['duz'] },
};
export const BUBBLE_KINDS = { soyle: 'Konuşma balonu', dusun: 'Düşünce balonu', bagir: 'Bağırma (patlama)', fisilda: 'Fısıltı (kesik çizgi)' };
export const LOOK_NAMES = ['ileri', 'sag', 'sol', 'yukari', 'asagi'];
