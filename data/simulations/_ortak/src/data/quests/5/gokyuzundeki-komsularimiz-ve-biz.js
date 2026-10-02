/**
 * Gökyüzündeki Komşularımız ve Biz — görev zinciri.
 * Görev 1 (Güneş) plana göre yeniden yazıldı: docs/plans/gokyuzu-gorev1-yeniden-yazim.md
 */
export const gokyuzuKomsularQuests = {
  gameSlug: 'gokyuzundeki-komsularimiz-ve-biz',
  badge: {
    id: 'badge-gokyuzu-komsulari',
    name: 'Gökyüzü Kaşifi',
    emoji: '🌙',
    description: 'Güneş, Ay ve Dünya\'nın gökyüzündeki sırlarını keşfet.',
  },
  quests: [
    {
      id: 'gunes-komsusu',
      title: 'Gökyüzündeki Komşumuz: Güneş',
      description: 'Güneş\'in şeklini, katmanlarını, lekelerini ve görünen boyutunu keşfet.',
      subtasks: [
        {
          id: 'ogretmen-tanis',
          title: 'İlk buluşma',
          hint: 'Okul yakınındaki öğretmene git',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-karsilama' },
        },
        {
          id: 'kure-gunes-bul',
          title: 'Güneşi bul',
          hint: 'Güneş panellerinin yanındaki sarı modeli bul',
          trigger: { type: 'pickup-collect', interactionId: 'gunes-kuresi-pickup' },
        },
        {
          id: 'kure-dunya-bul',
          title: 'Dünyayı bul',
          hint: 'Uzay binası yakınındaki mavi modeli bul',
          trigger: { type: 'pickup-collect', interactionId: 'dunya-kuresi-pickup' },
        },
        {
          id: 'kureleri-getir',
          title: 'Teslim zamanı',
          hint: 'İki modeli öğretmene götür',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-kureler' },
        },
        {
          id: 'sim-kuresellik',
          title: 'Küre mi, düz mü?',
          hint: 'Teleskoba git',
          trigger: { type: 'simulation-open', interactionId: 'teleskop-gunes-dunya-ay' },
        },
        {
          id: 'ogretmen-foto-iste',
          title: 'Fotoğraf görevi',
          hint: 'Öğretmene git',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-gunes-foto' },
        },
        {
          id: 'sim-katmanlar',
          title: 'Güneşin katmanları',
          hint: 'Teleskopa dön',
          trigger: { type: 'simulation-open', interactionId: 'teleskop-gunes-yapisi' },
        },
        {
          id: 'ogretmen-lekeler',
          title: 'Lekeleri konuş',
          hint: 'Öğretmene dön',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-gunes-lekeleri' },
        },
        {
          id: 'sim-leke-foto',
          title: 'Leke avı',
          hint: 'Teleskoba git — üç fotoğraf çek',
          trigger: { type: 'simulation-open', interactionId: 'teleskop-gunes-yapisi-leke' },
        },
        {
          id: 'ogretmen-galileo-yon',
          title: 'Galileo izinde',
          hint: 'Öğretmene dön',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-galileo' },
        },
        {
          id: 'galileo-kesfet',
          title: 'Galileo\'nun keşfi',
          hint: 'Bilgisayara git — Galileo\'yu incele',
          trigger: { type: 'simulation-open', interactionId: 'bilgisayar-galileo' },
        },
        {
          id: 'ogretmen-konum',
          title: 'Kim nerede?',
          hint: 'Öğretmene git',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-konum' },
        },
        {
          id: 'sim-konum',
          title: 'Üç gök cismi',
          hint: 'Teleskoba git',
          trigger: { type: 'simulation-open', interactionId: 'teleskop-konum' },
        },
        {
          id: 'ogretmen-kampci-yon',
          title: 'Kampçıya yol',
          hint: 'Öğretmene git',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-kampci-yon' },
        },
        {
          id: 'kampci-fotolar',
          title: 'Kampçının kareleri',
          hint: 'Kamp alanındaki kampçıya git',
          trigger: { type: 'dialogue-complete', interactionId: 'kampci-fotograflar' },
        },
        {
          id: 'ogretmen-boyut',
          title: 'Hangisi büyük?',
          hint: 'Fotoğrafları öğretmene götür',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-gorunen-boyut' },
        },
        {
          id: 'sim-uzaklik',
          title: 'Uzaklık yanılsaması',
          hint: 'Bilgisayara git',
          trigger: { type: 'simulation-open', interactionId: 'bilgisayar-uzaklik' },
        },
        {
          id: 'ogretmen-sinav',
          title: 'Son sınav',
          hint: 'Öğretmene dön',
          trigger: { type: 'dialogue-complete', interactionId: 'ogretmen-final-sinav' },
        },
      ],
    },
    {
      id: 'ay-komsusu',
      title: 'Gökyüzündeki Komşumuz: Ay',
      description: 'Ay\'ın özelliklerini ve evrelerini keşfet. (Yakında yenilenecek)',
      subtasks: [
        {
          id: 'profesor-ay',
          title: 'Profösörden Ay\'ı öğren',
          hint: 'Laboratuvar yakınındaki profösöre git',
          trigger: { type: 'dialogue-complete', interactionId: 'profesor-ay' },
        },
        {
          id: 'ay-evreleri-sim',
          title: 'Laboratuvarda Ay evreleri simülasyonunu aç',
          hint: 'Laboratuvar binasına git',
          trigger: { type: 'simulation-open', interactionId: 'labaratuar-ay-evreleri' },
        },
        {
          id: 'astronot-quiz',
          title: 'Astronot ile Ay evreleri quizini tamamla',
          hint: 'Uzay binası yakınındaki astronota git',
          trigger: { type: 'dialogue-complete', interactionId: 'astronot-quiz' },
        },
      ],
    },
    {
      id: 'dunya-komsular',
      title: 'Dünya\'mız ve Gökyüzündeki Komşularımız',
      description: 'Güneş, Dünya ve Ay\'ın hareketlerini öğren. (Yakında yenilenecek)',
      subtasks: [
        {
          id: 'uzay-hareketler',
          title: 'Uzay merkezinde hareketleri incele',
          hint: 'Uzay araştırma binasına git',
          trigger: { type: 'dialogue-complete', interactionId: 'uzay-binasi-hareketler' },
        },
        {
          id: 'gunes-tikla',
          title: 'Güneş Sistemi simülasyonunda Güneş\'e tıkla',
          hint: 'Güneş paneli veya teleskopta simülasyonu aç',
          trigger: {
            type: 'simulation-event',
            interactionId: 'gunespaneli-simulasyon',
            eventType: 'sun-click',
          },
        },
      ],
    },
  ],
}
