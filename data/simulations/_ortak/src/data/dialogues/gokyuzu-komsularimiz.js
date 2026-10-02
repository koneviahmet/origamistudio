import { resolveGameImage } from '../../lib/games/resolveGameImage.js'

const GRADE = 5
const GAME = 'gokyuzundeki-komsularimiz-ve-biz'
const img = (filename) => resolveGameImage(GRADE, GAME, filename)

/** Fen öğretmeni — ilk karşılama, şekil sorusu, Ay modeli hediyesi */
export const gokyuzuOgretmenKarsilamaDialogue = {
  id: 'gokyuzu-ogretmen-karsilama',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Merhaba! Fenköyü\'ne hoş geldin.',
      next: 'tanitim',
    },
    tanitim: {
      type: 'message',
      text:
        'Ben bu köyün fen öğretmeniyim. Birlikte gökyüzündeki komşularımızı keşfedeceğiz: '
        + 'Güneş, Dünya ve Ay.',
      models: [
        { itemId: 'gunes-modeli' },
        { itemId: 'dunya-modeli' },
        { itemId: 'ay-modeli' },
      ],
      next: 'gunes-dusun',
    },
    'gunes-dusun': {
      type: 'message',
      text: 'Güneş olmasaydı sence ne olurdu?',
      next: 'bf1',
    },
    bf1: {
      type: 'choice',
      text: 'Gündüzleri de karanlık mı olurdu?',
      options: [
        { id: 'evet', label: 'Evet', next: 'bf2' },
        { id: 'hayir', label: 'Hayır', next: 'bf2' },
      ],
    },
    bf2: {
      type: 'choice',
      text: 'Dünya yine de ısınır mıydı?',
      options: [
        { id: 'evet', label: 'Evet', next: 'bf3' },
        { id: 'hayir', label: 'Hayır', next: 'bf3' },
      ],
    },
    bf3: {
      type: 'choice',
      text: 'Bitkiler büyüyebilir miydi?',
      options: [
        { id: 'evet', label: 'Evet', next: 'bf4' },
        { id: 'hayir', label: 'Hayır', next: 'bf4' },
      ],
    },
    bf4: {
      type: 'choice',
      text: 'Yağmur yağmaya devam eder miydi?',
      options: [
        { id: 'evet', label: 'Evet', next: 'sekil-soru' },
        { id: 'hayir', label: 'Hayır', next: 'sekil-soru' },
      ],
    },
    'sekil-soru': {
      type: 'quiz-mcq',
      text: 'Sence Dünya, Güneş ve Ay hangi şekle benzer?',
      options: [
        { id: 'a', label: 'Küp' },
        { id: 'b', label: 'Küre (yuvarlak)' },
        { id: 'c', label: 'Düz disk' },
        { id: 'd', label: 'Piramit' },
      ],
      correct: 'b',
      correctFeedback: 'Harika! Hepsi küreseldir, yani top gibi yuvarlaktır.',
      wrongFeedback: 'Tekrar dene. İpucu: Bir topu düşün…',
      onWrong: 'retry',
      points: 3,
      scoreLabel: 'Şekil sorusu +3',
      next: 'hediye',
    },
    hediye: {
      type: 'message',
      text:
        'Doğru cevap! Sana Ay\'ı temsil eden bir model hediye ediyorum. '
        + 'Köyün farklı yerlerinde Güneş ve Dünya modellerini de sakladım. '
        + 'Onları bulup bana getir!',
      models: [{ itemId: 'ay-modeli' }],
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Önce Güneş modelini bul, sonra Dünya\'ya bak!',
    },
  },
}

/** Fen öğretmeni — model teslimi + Güneş bilgisi */
export const gokyuzuOgretmenKurelerDialogue = {
  id: 'gokyuzu-ogretmen-kureler',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Harika! İki modeli de bulmuşsun. Üç komşumuz da envanterinde!',
      models: [
        { itemId: 'gunes-modeli' },
        { itemId: 'dunya-modeli' },
        { itemId: 'ay-modeli' },
      ],
      next: 'gunes-bak',
    },
    'gunes-bak': {
      type: 'message',
      text: 'Haydi Güneş\'i yakından inceleyelim.',
      image: img('ogretmen-gunes-yakin.jpg'),
      imageAlt: 'Yakından görülen Güneş yüzeyi',
      imageWidth: 320,
      next: 'gunes-bilgi-1',
    },
    'gunes-bilgi-1': {
      type: 'message',
      text: 'Güneş, Dünya\'nın ısı ve ışık kaynağıdır.',
      next: 'gunes-bilgi-2',
    },
    'gunes-bilgi-2': {
      type: 'message',
      text: 'Yıldızlar ısı ve ışık verir. Güneş de bize en yakın yıldızdır!',
      image: img('ogretmen-yildizlar.png'),
      imageAlt: 'Yıldızlarla dolu gece gökyüzü',
      imageWidth: 320,
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Güneş hakkında daha fazla bilgi öğrenmek istersen, haydi köydeki teleskopa git!',
    },
  },
}

/** Fen öğretmeni — küresellik sonrası Güneş fotoğrafı görevi */
export const gokyuzuOgretmenGunesFotoDialogue = {
  id: 'gokyuzu-ogretmen-gunes-foto',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text:
        'Güneş, Dünya ve Ay\'ın küresel olduğunu gördün. Süper! '
        + 'Sence Güneş\'in içinde ne vardır?',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Teleskopa git ve Güneş\'in detaylı bir fotoğrafını çekip bana getir.',
    },
  },
}

/** Fen öğretmeni — fotoğraf inceleme + güneş lekeleri + 3 foto isteği */
export const gokyuzuOgretmenLekelerDialogue = {
  id: 'gokyuzu-ogretmen-lekeler',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Harika, Güneş fotoğrafını getirmişsin. Hadi birlikte inceleyelim.',
      imageFrom: { simulation: 'gunes-yapisi', pick: 'all' },
      imageAlt: 'Teleskopla çektiğin Güneş fotoğrafı',
      imageWidth: 220,
      next: 'dikkat',
    },
    dikkat: {
      type: 'message',
      text:
        'Fotoğrafta yüzeyde birkaç koyu nokta var. Bunları fark ettin mi?',
      imageFrom: { simulation: 'gunes-yapisi', pick: 'latest' },
      imageAlt: 'Güneş fotoğrafındaki koyu lekeler',
      imageWidth: 220,
      next: 'soru',
    },
    soru: {
      type: 'quiz-mcq',
      text: 'Sence bu koyu noktalar ne olabilir?',
      options: [
        { id: 'a', label: 'Güneş\'in üzerindeki bulutlar' },
        { id: 'b', label: 'Güneş\'teki delikler' },
        { id: 'c', label: 'Güneş lekeleri (daha soğuk bölgeler)' },
        { id: 'd', label: 'Gölgedeki kayalar' },
      ],
      correct: 'c',
      correctFeedback: 'Doğru! Bunlara güneş lekeleri denir.',
      wrongFeedback: 'İpucu: Güneş\'in yüzeyi her yerde aynı sıcaklıkta değildir…',
      onWrong: 'retry',
      points: 3,
      scoreLabel: 'Güneş lekesi sorusu +3',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Teleskopa git ve koyu noktaların göründüğü 3 farklı fotoğraf getir.',
    },
  },
}

/** Fen öğretmeni — üç fotoğrafla Güneş'in dönüşü + Galileo yönlendirmesi */
export const gokyuzuOgretmenGalileoDialogue = {
  id: 'gokyuzu-ogretmen-galileo',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text:
        'Üç fotoğrafı da getirmişsin. Hadi fotoğrafları yan yana inceleyelim.',
      imageFrom: { simulation: 'gunes-yapisi', pick: 'last', count: 3 },
      imageAlt: 'Çektiğin güneş lekesi fotoğrafları',
      next: 'incele',
    },
    incele: {
      type: 'message',
      text:
        'Güneş lekelerinin konumları fotoğraflarda değişmiş. '
        + 'Sence bunun nedeni ne olabilir?',
      imageFrom: { simulation: 'gunes-yapisi', pick: 'last', count: 3 },
      imageAlt: 'Farklı konumlardaki güneş lekeleri',
      next: 'donus-sorusu',
    },
    'donus-sorusu': {
      type: 'quiz-mcq',
      text: 'Güneş lekelerinin yer değiştirmesi neyi gösterir?',
      options: [
        { id: 'a', label: 'Güneş kendi etrafında dönüyor' },
        { id: 'b', label: 'Güneş Dünya\'dan uzaklaşıyor' },
        { id: 'c', label: 'Güneş küçülüyor' },
        { id: 'd', label: 'Dünya dönmeyi bırakıyor' },
      ],
      correct: 'a',
      correctFeedback: 'Doğru! Lekeler Güneş ile birlikte hareket eder.',
      wrongFeedback: 'Üç fotoğrafta lekelerin değişen konumlarına tekrar bak.',
      onWrong: 'retry',
      points: 3,
      scoreLabel: 'Güneşin dönüşü +3',
      next: 'donus-bilgi',
    },
    'donus-bilgi': {
      type: 'info',
      title: 'Güneş dönüyor',
      text:
        'Güneş lekeleri Güneş\'in yüzeyiyle birlikte hareket eder. '
        + 'Üç fotoğrafta konumlarının değişmesi, Güneş\'in kendi etrafında döndüğünü gösterir.',
      next: 'galileo',
    },
    galileo: {
      type: 'message',
      text:
        'Peki güneş lekelerinin nasıl keşfedildiğini merak ediyor musun? '
        + 'Çok uzun yıllar önce bir bilim insanı teleskobu gökyüzüne çevirmiş.',
      next: 'yonlendir',
    },
    yonlendir: {
      type: 'message',
      text:
        'Köydeki bilgisayara git ve Galileo Galilei\'nin hikâyesine bak. '
        + 'Lekeleri nasıl gördüğünü ve Güneş\'in döndüğünü nasıl anladığını öğreneceksin.',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Bilgisayara git ve Galileo\'yu incele.',
    },
  },
}

/** Fen öğretmeni — konum soruları (sub=12 Kim nerede?) */
export const gokyuzuOgretmenKonumDialogue = {
  id: 'gokyuzu-ogretmen-konum',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Sıra Güneş, Dünya ve Ay\'ın konumlarında! Sence kim nerede duruyor?',
      next: 'q1',
    },
    q1: {
      type: 'quiz-mcq',
      text: 'Sence Güneş Sistemi\'nin merkezinde hangisi vardır?',
      options: [
        { id: 'a', label: 'Dünya' },
        { id: 'b', label: 'Ay' },
        { id: 'c', label: 'Güneş' },
        { id: 'd', label: 'Mars' },
      ],
      correct: 'c',
      correctFeedback: 'Harika! Güneş merkezdedir.',
      wrongFeedback: 'Tekrar dene. İpucu: Isı ve ışık kaynağımız merkezde…',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Konum merkez +2',
      next: 'q2',
    },
    q2: {
      type: 'quiz-true-false',
      text: 'Ay, Dünya\'nın etrafında dolanır.',
      correct: true,
      correctFeedback: 'Aynen öyle! Ay, Dünya\'nın doğal uydusudur.',
      wrongFeedback: 'Tekrar dene. Ay, Dünya\'nın etrafında dolanır.',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Konum Ay +2',
      next: 'bilgi',
    },
    bilgi: {
      type: 'info',
      title: 'Kim nerede?',
      text:
        'Dünya Güneş\'in etrafında, Ay da Dünya\'nın etrafında dolanır. '
        + 'Bu düzen, gökyüzünde gördüklerimizi anlamamıza yardım eder.',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text:
        'Bu düzeni yakından görmek istersen, haydi köydeki teleskopla '
        + 'Güneş, Dünya ve Ay\'ın konumunu incele!',
    },
  },
}

/** Fen öğretmeni — kampçıya yönlendir */
export const gokyuzuOgretmenKampciYonDialogue = {
  id: 'gokyuzu-ogretmen-kampci-yon',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text:
        'Kamp alanındaki kampçı Güneş ve Ay\'ın fotoğraflarını çekmiş. '
        + 'Ona gidip resimleri al, sonra bana getir.',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Kamp çadırının yanındaki kampçıya git.',
    },
  },
}

/** Kampçı — Güneş ve Ay fotoğrafları (sub=15 Kampçının kareleri) */
export const gokyuzuKampciFotograflarDialogue = {
  id: 'gokyuzu-kampci-fotograflar',
  title: 'Kampçı',
  speaker: 'Kampçı',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Vay be, hoş geldin! Güneş ve Ay fotoğraflarını çektim.',
      next: 'gunes-foto',
    },
    'gunes-foto': {
      type: 'image',
      title: 'Güneş fotoğrafı',
      image: img('kampci-gunes.png'),
      imageAlt: 'Kampçının çektiği Güneş fotoğrafı',
      imageWidth: 320,
      caption: 'İşte Güneş. Ufkun üzerinde parlıyor!',
      next: 'ay-foto',
    },
    'ay-foto': {
      type: 'image',
      title: 'Ay fotoğrafı',
      image: img('kampci-ay.png'),
      imageAlt: 'Kampçının çektiği Ay fotoğrafı',
      imageWidth: 320,
      caption: 'Bu da Ay. Gölün üzerinde sakin duruyor.',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Haydi bu kareleri okulun yanındaki öğretmenine götür!',
    },
  },
}

/** Fen öğretmeni — görünen boyut tartışması */
export const gokyuzuOgretmenGorunenBoyutDialogue = {
  id: 'gokyuzu-ogretmen-gorunen-boyut',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Kampçının fotoğrafları geldi. Güneş ve Ay neredeyse aynı boyutta görünüyor, değil mi?',
      images: [
        { src: img('kampci-gunes.png'), alt: 'Kampçının çektiği Güneş fotoğrafı' },
        { src: img('kampci-ay.png'), alt: 'Kampçının çektiği Ay fotoğrafı' },
      ],
      next: 'soru',
    },
    soru: {
      type: 'quiz-mcq',
      text: 'Sence gerçekte hangisi daha büyüktür?',
      options: [
        { id: 'a', label: 'Ay daha büyük' },
        { id: 'b', label: 'Güneş daha büyük' },
        { id: 'c', label: 'İkisi de aynı boyutta' },
      ],
      correct: 'b',
      correctFeedback: 'Doğru! Güneş çok daha büyük. Uzakta olduğu için küçük görünür.',
      wrongFeedback: 'İpucu: Uzakta olan büyük cisimler küçük görünebilir.',
      onWrong: 'retry',
      points: 3,
      scoreLabel: 'Görünen boyut +3',
      next: 'yonlendir',
    },
    yonlendir: {
      type: 'message',
      text:
        'Görünen boyut, gerçek boyutla aynı şey değil. Uzaklık gözümüzü şaşırtır. '
        + 'Bunu envanterindeki küre modelleriyle deneyebiliriz!',
      models: [
        { itemId: 'gunes-modeli' },
        { itemId: 'ay-modeli' },
      ],
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Haydi köydeki bilgisayara git — modellerinle uzaklığı dene!',
    },
  },
}

/** Fen öğretmeni — final sınav */
export const gokyuzuOgretmenFinalSinavDialogue = {
  id: 'gokyuzu-ogretmen-final-sinav',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Öğrendiklerimizi kısa bir sınavla pekiştirelim. Hazır mısın?',
      next: 'q1',
    },
    q1: {
      type: 'quiz-true-false',
      text: 'Güneş, Dünya ve Ay küreseldir.',
      correct: true,
      correctFeedback: 'Doğru!',
      wrongFeedback: 'Üçü de küreseldir. Tekrar dene!',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Sınav 1 +2',
      next: 'q2',
    },
    q2: {
      type: 'quiz-true-false',
      text: 'Güneş lekeleri, Güneş\'in yüzeyindeki koyu bölgelerdir.',
      correct: true,
      correctFeedback: 'Evet!',
      wrongFeedback: 'Lekeler yüzeydeki koyu bölgelerdir. Tekrar dene!',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Sınav 2 +2',
      next: 'q3',
    },
    q3: {
      type: 'quiz-true-false',
      text: 'Ay kendi ışığını üretir.',
      correct: false,
      correctFeedback: 'Doğru! Ay Güneş ışığını yansıtır.',
      wrongFeedback: 'Ay ışık kaynağı değildir. Tekrar dene!',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Sınav 3 +2',
      next: 'q4',
    },
    q4: {
      type: 'quiz-mcq',
      text: 'Güneş Sistemi\'nin merkezinde ne vardır?',
      options: [
        { id: 'a', label: 'Dünya' },
        { id: 'b', label: 'Güneş' },
        { id: 'c', label: 'Ay' },
      ],
      correct: 'b',
      correctFeedback: 'Harika!',
      wrongFeedback: 'Merkezde Güneş vardır.',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Sınav 4 +2',
      next: 'q5',
    },
    q5: {
      type: 'quiz-mcq',
      text: 'Uzakta olan bir cisim nasıl görünür?',
      options: [
        { id: 'a', label: 'Daha büyük' },
        { id: 'b', label: 'Daha küçük' },
        { id: 'c', label: 'Hep aynı boyutta' },
      ],
      correct: 'b',
      correctFeedback: 'Evet! Uzaklık görünen boyutu küçültür.',
      wrongFeedback: 'Uzak cisimler daha küçük görünür.',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Sınav 5 +2',
      next: 'tebrik',
    },
    tebrik: {
      type: 'message',
      text:
        'Tebrikler! Gökyüzündeki komşumuz Güneş hakkında çok şey öğrendin. '
        + 'İlk görevini başarıyla tamamladın!',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Bir sonraki maceralarda görüşmek üzere!',
    },
  },
}

/** @deprecated Eski ünite menüsü — Görev 2/3 için geçici tutuluyor */
export const gokyuzuOgretmenDialogue = {
  id: 'gokyuzu-ogretmen',
  title: 'Fen Öğretmeni',
  speaker: 'Fen Öğretmeni',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Merhaba! Ay ve Dünya görevleri yakında yenilenecek.',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Şimdilik Güneş görevine odaklan.',
    },
  },
}

/** @deprecated Meteorolog — Görev 1 dışına alındı */
export const gokyuzuGunesDialogue = {
  id: 'gokyuzu-gunes',
  title: 'Meteorolog',
  speaker: 'Meteorolog',
  start: 'intro',
  nodes: {
    intro: {
      type: 'end',
      text: 'Bu istasyon şimdilik kapalı. Öğretmeninle Güneş görevine devam et!',
    },
  },
}

/** Profösör — Ay konusu (Görev 2 — henüz yeniden yazılmadı) */
export const gokyuzuAyDialogue = {
  id: 'gokyuzu-ay',
  title: 'Profösör',
  speaker: 'Profösör',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text:
        'Ay, gökyüzünde Dünya\'ya en yakın gök cismidir. Bir ışık kaynağı değildir; '
        + 'Güneş\'ten aldığı ışığı yansıtır.',
      next: 'ay-gorsel',
    },
    'ay-gorsel': {
      type: 'image',
      title: 'Ay',
      image: img('ztahta_16728978ba9a3b'),
      imageAlt: 'Ay görüntüsü',
      imageWidth: 280,
      next: 'bilgi',
    },
    bilgi: {
      type: 'info',
      title: 'Ay hakkında',
      text:
        '• Dünya\'nın tek doğal uydusudur.\n'
        + '• Küresel yapıdadır; atmosferi çok azdır.\n'
        + '• Ay\'da rüzgar ve yağmur gibi hava olayları yaşanmaz.\n'
        + '• Yüzeyinde kraterler, vadiler ve dağlık bölgeler vardır.',
      next: 'uyari',
    },
    uyari: {
      type: 'info',
      title: 'Biliyor muydun?',
      text:
        'Ay\'ın Dünya etrafında dolanma süresi ile kendi etrafında dönme süresi aynı '
        + 'olduğu için Ay\'ın hep aynı yüzünü görürüz.',
      next: 'q1-tf',
    },
    'q1-tf': {
      type: 'quiz-true-false',
      text: 'Ay, kendi ışığını üretir.',
      correct: false,
      correctFeedback: 'Doğru! Ay ışığı yansıtır.',
      wrongFeedback: 'Ay ışık kaynağı değildir; Güneş ışığını yansıtır.',
      onWrong: 'continue',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Laboratuvarda Ay evreleri simülasyonunu da incele!',
    },
  },
}

/** Astronot — Ay evreleri quiz (Görev 2) */
export const gokyuzuAyQuizDialogue = {
  id: 'gokyuzu-ay-quiz',
  title: 'Astronot',
  speaker: 'Astronot',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text:
        'Ay\'ın farklı şekillerde görünmesine "Ay\'ın evreleri" denir. '
        + 'Birkaç soruyla bilgini test edelim!',
      next: 'evre-gorsel',
    },
    'evre-gorsel': {
      type: 'image',
      title: 'Ay\'ın evreleri',
      image: img('ztahta_167292cc848709'),
      imageAlt: 'Ay evreleri diyagramı',
      imageWidth: 300,
      next: 'q1-mcq',
    },
    'q1-mcq': {
      type: 'quiz-mcq',
      text: 'Ay\'ın en parlak göründüğü evre hangisidir?',
      options: [
        { id: 'a', label: 'Yeni Ay' },
        { id: 'b', label: 'Hilal' },
        { id: 'c', label: 'Dolunay' },
        { id: 'd', label: 'Son Dördün' },
      ],
      correct: 'c',
      correctFeedback: 'Evet! Dolunayda Ay tamamen aydınlık görünür.',
      wrongFeedback: 'Dolunay evresinde Ay en parlak halini alır.',
      onWrong: 'continue',
      next: 'q2-tf',
    },
    'q2-tf': {
      type: 'quiz-true-false',
      text: 'Ay\'ın ana evreleri arasındaki süre yaklaşık bir haftadır.',
      correct: true,
      correctFeedback: 'Doğru!',
      wrongFeedback: 'Ana evreler arasında yaklaşık bir hafta geçer.',
      onWrong: 'continue',
      next: 'dolunay-gorsel',
    },
    'dolunay-gorsel': {
      type: 'image',
      title: 'Dolunay',
      image: img('ztahta_16728a89c00a58'),
      imageAlt: 'Dolunay evresi',
      imageWidth: 260,
      caption: 'Dolunayda Ay, Güneş ışığını tamamen yansıtır.',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Harika gözlem! Uzay araştırma binasında hareketleri de incele.',
    },
  },
}

/** Uzay araştırma binası — Dünya ve komşular (Görev 3) */
export const gokyuzuDunyaHareketleriDialogue = {
  id: 'gokyuzu-dunya-hareketleri',
  title: 'Uzay Araştırma Merkezi',
  speaker: 'Rehber',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text:
        'Güneş, Dünya ve Ay\'ın hareketlerini inceleyelim. Her gök cisminin '
        + 'kendi ekseni etrafında dönme ve dolanma hareketleri vardır.',
      next: 'hareket-gorsel',
    },
    'hareket-gorsel': {
      type: 'image',
      title: 'Güneş, Dünya ve Ay hareketleri',
      image: img('ztahta_16729340d48472'),
      imageAlt: 'Güneş Dünya Ay hareketleri',
      imageWidth: 320,
      next: 'gunes-hareket',
    },
    'gunes-hareket': {
      type: 'message',
      title: 'Güneş',
      text: 'Güneş kendi ekseni etrafında saat yönünün tersinde döner.',
      image: img('ztahta_167293c9817a0e'),
      imageAlt: 'Güneş dönme hareketi',
      imageWidth: 260,
      next: 'dunya-hareket',
    },
    'dunya-hareket': {
      type: 'message',
      title: 'Dünya',
      text:
        'Dünya Güneş\'in etrafında 365 gün 6 saatte dolanır. '
        + 'Kendi etrafında dönmesi ise 24 saat sürer.',
      image: img('ztahta_167293c9e1e676'),
      imageAlt: 'Dünya hareketleri',
      imageWidth: 260,
      next: 'ay-hareket',
    },
    'ay-hareket': {
      type: 'message',
      title: 'Ay',
      text:
        'Ay kendi ekseni etrafında ve Dünya\'nın etrafında 27 gün 8 saatte hareket eder. '
        + 'Dünya ile birlikte Güneş\'in etrafında da dolanır.',
      image: img('ztahta_167293ca1da2b7'),
      imageAlt: 'Ay hareketleri',
      imageWidth: 260,
      next: 'model-bilgi',
    },
    'model-bilgi': {
      type: 'info',
      text:
        'Boyutları modellemek için basketbol topu (Güneş), beyzbol topu (Dünya) '
        + 've bilye (Ay) kullanılabilir.',
      next: 'q1-drag',
    },
    'q1-drag': {
      type: 'quiz-drag',
      text: 'Gök cisimlerini doğru kategoriye sürükle.',
      items: [
        { id: 'gunes', label: 'Güneş' },
        { id: 'dunya', label: 'Dünya' },
        { id: 'ay', label: 'Ay' },
      ],
      zones: [
        { id: 'yildiz', label: 'Yıldız', accept: 'gunes' },
        { id: 'gezegen', label: 'Gezegen', accept: 'dunya' },
        { id: 'uydu', label: 'Uydu', accept: 'ay' },
      ],
      correctFeedback: 'Mükemmel!',
      wrongFeedback: 'Güneş yıldız, Dünya gezegen, Ay uydu.',
      onWrong: 'continue',
      next: 'kapanis',
    },
    kapanis: {
      type: 'end',
      text: 'Tebrikler! Gökyüzündeki komşularımızı başarıyla keşfettin.',
    },
  },
}

/** Teleskop — küresellik + Güneş küp beyin fırtınası (simülasyon paneli) */
export const gokyuzuTeleskopKuresellikDialogue = {
  id: 'gokyuzu-teleskop-kuresellik',
  title: 'Teleskop',
  speaker: 'Teleskop',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Güneş burada küp gibi duruyor! Böyle mi bekliyordun?',
      shapes: { sun: 'cube', earth: 'sphere', moon: 'sphere' },
      focus: 'shapes',
      next: 'kup-dusun',
    },
    'kup-dusun': {
      type: 'message',
      text: 'Sence gerçekten küp olsaydı ne olurdu?',
      shapes: { sun: 'cube', earth: 'sphere', moon: 'sphere' },
      focus: 'shapes',
      next: 'bf1',
    },
    bf1: {
      type: 'choice',
      text: 'Düz yüzeyi bize bakınca Dünya çok ısınır mıydı?',
      shapes: { sun: 'cube', earth: 'sphere', moon: 'sphere' },
      focus: 'shapes',
      options: [
        { id: 'evet', label: 'Evet', next: 'bf2' },
        { id: 'hayir', label: 'Hayır', next: 'bf2' },
      ],
    },
    bf2: {
      type: 'choice',
      text: 'Köşesi bize dönünce ışık azalır mıydı?',
      shapes: { sun: 'cube', earth: 'sphere', moon: 'sphere' },
      focus: 'shapes',
      options: [
        { id: 'evet', label: 'Evet', next: 'bf3' },
        { id: 'hayir', label: 'Hayır', next: 'bf3' },
      ],
    },
    bf3: {
      type: 'choice',
      text: 'Gökyüzü Minecraft\'taki gibi mi olurdu?',
      shapes: { sun: 'cube', earth: 'sphere', moon: 'sphere' },
      focus: 'shapes',
      options: [
        { id: 'evet', label: 'Evet', next: 'kure-geri' },
        { id: 'hayir', label: 'Hayır', next: 'kure-geri' },
      ],
    },
    'kure-geri': {
      type: 'message',
      text: 'Neyse ki öyle değil! Güneş, Dünya ve Ay küreseldir.',
      shapes: { sun: 'sphere', earth: 'sphere', moon: 'sphere' },
      focus: 'welcome',
      next: 'kapanis',
    },
    kapanis: {
      type: 'message',
      text: 'Hadi simülasyonu yakından incele.',
      shapes: { sun: 'sphere', earth: 'sphere', moon: 'sphere' },
      showControls: true,
      focus: 'panel',
      next: 'end',
    },
    end: {
      type: 'end',
      text: '',
      showControls: true,
    },
  },
}

/** Teleskop — Güneş yapısı / fotoğraf ve katmanlar */
export const gokyuzuTeleskopGunesYapisiDialogue = {
  id: 'gokyuzu-teleskop-gunes-yapisi',
  title: 'Teleskop',
  speaker: 'Teleskop',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Güneş\'i daha detaylı incelemeye ne dersin?',
      focus: 'welcome',
      next: 'gaz',
    },
    gaz: {
      type: 'message',
      text: 'Güneş katı bir cisim değildir; sıcak gazlardan oluşur.',
      focus: 'sun',
      next: 'gaz-miktar',
    },
    'gaz-miktar': {
      type: 'message',
      text:
        'Yaklaşık %75\'i hidrojen, %24\'ü helyumdur. '
        + 'Kalan %1 ise oksijen, karbon, neon ve demir gibi gazlardır.',
      focus: 'sun',
      next: 'yapi',
    },
    yapi: {
      type: 'message',
      text: 'Güneş katmanlardan oluşur.',
      focus: 'cutaway',
      cutaway: true,
      next: 'ipuclari',
    },
    ipuclari: {
      type: 'message',
      text:
        'Fotoğraf makinesiyle resim çekebilirsin. '
        + 'Katmanları kapatmak için Güneş\'e iki kez tıkla.',
      focus: 'cutaway',
      cutaway: true,
      next: 'kapanis',
    },
    kapanis: {
      type: 'message',
      text: 'Haydi incele. Fotoğrafını çekmeyi unutma!',
      cutaway: true,
      showControls: true,
      focus: 'sim-panel',
      next: 'end',
    },
    end: {
      type: 'end',
      text: '',
      cutaway: true,
      showControls: true,
    },
  },
}

/** Teleskop — Güneş–Dünya–Ay konumları (sub=13 / teleskop-konum) */
export const gokyuzuTeleskopKonumDialogue = {
  id: 'gokyuzu-teleskop-konum',
  title: 'Teleskop',
  speaker: 'Teleskop',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Güneş, Dünya ve Ay uzayda nasıl görünür?',
      focus: 'welcome',
      next: 'q-sun',
    },
    'q-sun': {
      type: 'quiz-simulation',
      text: 'Dünya\'nın ısı ve ışık kaynağıdır. Sence hangisi Güneş?',
      hint: 'Ortadaki parlak cisme tıkla.',
      action: 'select-body',
      accept: 'sun',
      focus: 'orbits',
      correctFeedback: 'Doğru! Güneş merkezdedir.',
      wrongFeedback: 'Tekrar dene. İpucu: Ortadaki parlak cisim.',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Konum Güneş +2',
      next: 'q-earth',
    },
    'q-earth': {
      type: 'quiz-simulation',
      text: 'Ay ile birlikte Güneş\'in etrafında dolanır. Sence hangisi Dünya?',
      hint: 'Güneş\'in etrafında dolanan mavi cisme tıkla.',
      action: 'select-body',
      accept: 'earth',
      focus: 'orbits',
      correctFeedback: 'Harika! Dünya Güneş\'in etrafında dolanır.',
      wrongFeedback: 'Tekrar dene. İpucu: Yörüngedeki mavi cisim.',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Konum Dünya +2',
      next: 'q-moon',
    },
    'q-moon': {
      type: 'quiz-simulation',
      text: 'Dünya\'nın doğal uydusudur. Sence hangisi Ay?',
      hint: 'Dünya\'nın yanındaki küçük cisme tıkla.',
      action: 'select-body',
      accept: 'moon',
      focus: 'orbits',
      correctFeedback: 'Süper! Ay, Dünya\'nın doğal uydusudur.',
      wrongFeedback: 'Tekrar dene. İpucu: Dünya\'nın yanındaki küçük cisim.',
      onWrong: 'retry',
      points: 2,
      scoreLabel: 'Konum Ay +2',
      next: 'kapanis',
    },
    kapanis: {
      type: 'message',
      text: 'Haydi simülasyonu daha detaylı incele.',
      showControls: true,
      focus: 'sim-panel',
      next: 'end',
    },
    end: {
      type: 'end',
      text: '',
      showControls: true,
    },
  },
}

/** Teleskop — güneş lekeleri + üç foto (sub=9 / sim-leke-foto) */
export const gokyuzuTeleskopGunesLekeleriDialogue = {
  id: 'gokyuzu-teleskop-gunes-lekeleri',
  title: 'Güneş Lekeleri',
  speaker: 'Teleskop',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      text: 'Sanırım koyu noktaları incelemek için tekrar geldin.',
      focus: 'welcome',
      cutaway: false,
      next: 'gor',
    },
    gor: {
      type: 'info',
      title: 'Güneş lekeleri',
      text:
        'Görmüş olduğun koyu noktaların ismi güneş lekeleridir. '
        + 'Çevresinden daha soğuk ve koyu görünen bölgelerdir.',
      focus: 'sun',
      cutaway: false,
      next: 'quiz',
    },
    quiz: {
      type: 'quiz-mcq',
      text: 'Güneş lekeleri neden koyu görünür?',
      options: [
        { id: 'a', label: 'Çünkü deliktirler' },
        { id: 'b', label: 'Çünkü çevresinden daha soğukturlar' },
        { id: 'c', label: 'Çünkü bulutturlar' },
        { id: 'd', label: 'Çünkü gölgedirler' },
      ],
      correct: 'b',
      correctFeedback: 'Aynen öyle! Daha soğuk oldukları için koyu görünürler.',
      wrongFeedback: 'İpucu: Sıcaklık farkını düşün…',
      onWrong: 'retry',
      points: 3,
      scoreLabel: 'Leke bilgisi +3',
      focus: 'sun',
      cutaway: false,
      next: 'gorev',
    },
    gorev: {
      type: 'message',
      text: 'Şimdi koyu noktaların göründüğü üç farklı fotoğraf çek.',
      focus: 'camera',
      cutaway: false,
      next: 'kapanis',
    },
    kapanis: {
      type: 'message',
      text: 'Çok güzel fotoğraflar çekmişsin. Çektiğin fotoğrafları öğretmene götürebilirsin.',
      showControls: true,
      focus: 'sim-panel',
      cutaway: false,
      next: 'end',
    },
    end: {
      type: 'end',
      text: '',
      showControls: true,
      cutaway: false,
    },
  },
}
