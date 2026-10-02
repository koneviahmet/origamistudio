/** Ev inşaatı — box yanında Güneş Sistemi soruları; her doğru cevap +5 puan ve set ilerlemesi */
export const boxEvInsaatiDialogue = {
  id: 'box-ev-insaati',
  title: 'Ev İnşaatı',
  speaker: 'İnşaat',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      speaker: 'İnşaat',
      title: 'Ev İnşaatı',
      text:
        'Bu yapının temeli atıldı! İnşaatı ilerletmek için Güneş Sistemi hakkında '
        + '2 soruyu doğru cevaplaman gerekiyor. Her doğru cevap +5 puan.',
      next: 'q1-mcq',
    },
    'q1-mcq': {
      type: 'quiz-mcq',
      speaker: 'İnşaat',
      text: 'Güneş sistemimizde Güneş\'e en yakın gezegen hangisidir?',
      options: [
        { id: 'a', label: 'Merkür' },
        { id: 'b', label: 'Mars' },
        { id: 'c', label: 'Jüpiter' },
        { id: 'd', label: 'Venüs' },
      ],
      correct: 'a',
      correctFeedback: 'Doğru! Merkür, Güneş\'e en yakın gezegendir. +5 puan — inşaat ilerliyor!',
      wrongFeedback: 'Tekrar dene! İpucu: Bu gezegenin adı bir elementle de aynı.',
      points: 5,
      scoreLabel: 'Ev inşaatı — Merkür sorusu +5',
      scoreOncePerPlacement: true,
      next: 'q2-tf',
    },
    'q2-tf': {
      type: 'quiz-true-false',
      speaker: 'İnşaat',
      text: 'Dünya, Güneş etrafında yaklaşık 365 günde bir tur atar.',
      correct: true,
      correctFeedback: 'Evet! Bir yıl, Dünya\'nın Güneş etrafındaki bir tam turudur. +5 puan!',
      wrongFeedback: 'Aslında doğruydu — Dünya Güneş etrafında yaklaşık 365 günde döner. Tekrar dene!',
      points: 5,
      scoreLabel: 'Ev inşaatı — Dünya yörüngesi +5',
      scoreOncePerPlacement: true,
      next: 'outro',
    },
    outro: {
      type: 'message',
      speaker: 'İnşaat',
      title: 'Tebrikler!',
      text: 'Her iki soruyu da doğru bildin! Ev inşaatı tamamlandı.',
      next: 'end',
    },
    end: {
      type: 'end',
      speaker: 'İnşaat',
      text: 'Harika iş çıkardın!',
    },
  },
}
