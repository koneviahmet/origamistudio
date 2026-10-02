/** Mehmet — orman şehri rehberi; bilgi + seçenekli konuşma */
export const mehmetDialogue = {
  id: 'mehmet',
  title: 'Mehmet',
  speaker: 'Mehmet',
  start: 'greeting',
  nodes: {
    greeting: {
      type: 'message',
      speaker: 'Mehmet',
      title: 'Hoş geldin',
      text: 'Merhaba! Ben Mehmet. Bu orman şehrinde seni gezdirmekten mutluluk duyarım.',
      next: 'topic-choice',
    },
    'topic-choice': {
      type: 'choice',
      speaker: 'Mehmet',
      text: 'Bugün ne hakkında konuşmak istersin?',
      options: [
        { id: 'forest', label: 'Orman ve doğa', next: 'forest-info' },
        { id: 'city', label: 'Şehirdeki yerler', next: 'city-info' },
        { id: 'tips', label: 'Oyun ipuçları', next: 'tips-info' },
        { id: 'quiz', label: 'Küçük bir bilgi yarışması', next: 'mini-quiz' },
        { id: 'bye', label: 'Hoşça kal', next: 'farewell' },
      ],
    },
    'forest-info': {
      type: 'info',
      speaker: 'Mehmet',
      title: 'Orman',
      text:
        'Ormanlar oksijen üretir, hayvanlara yuva sağlar ve iklimi dengeler. '
        + 'Şehrimizde ağaçları koruyarak hem doğayı hem kendimizi koruyoruz.',
      next: 'topic-choice',
    },
    'city-info': {
      type: 'info',
      speaker: 'Mehmet',
      title: 'Şehir',
      text:
        'Kum zeminde gökyüzü gözlem noktası var — orada Güneş Sistemi simülasyonunu açabilirsin. '
        + 'Beton karo yola gelince yağmur yağar; beton zemine basınca puan kazanırsın.',
      next: 'topic-choice',
    },
    'tips-info': {
      type: 'info',
      speaker: 'Mehmet',
      title: 'İpuçları',
      text:
        'WASD ile yürü, Shift ile koş. F5 ile kamerayı değiştir. '
        + 'Bazı modellere tıklayarak onlarla konuşabilirsin — mesela benimle veya Ayşe ile!',
      next: 'topic-choice',
    },
    'mini-quiz': {
      type: 'quiz-true-false',
      speaker: 'Mehmet',
      text: 'Ormanlar sadece ağaçlardan oluşur; hayvanlar orman ekosisteminin parçası değildir.',
      correct: false,
      correctFeedback: 'Doğru! Ormanlar bitkiler, hayvanlar, mantarlar ve mikroorganizmalardan oluşan bir ekosistemdir.',
      wrongFeedback: 'Yanlış. Orman bir ekosistemdir; hayvanlar da bu sistemin önemli parçasıdır.',
      points: 1,
      scoreLabel: 'Mehmet — bilgi sorusu +1',
      onWrong: 'continue',
      next: 'topic-choice',
    },
    farewell: {
      type: 'end',
      speaker: 'Mehmet',
      text: 'Görüşmek üzere! Şehri keşfetmeye devam et.',
    },
  },
}
