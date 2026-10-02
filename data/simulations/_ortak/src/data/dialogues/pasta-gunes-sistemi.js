/** Pasta — Güneş Sistemi sorularını bilince envanter ödülü */
export const pastaGunesSistemiDialogue = {
  id: 'pasta-gunes-sistemi',
  title: 'Pasta',
  speaker: 'Pasta',
  start: 'intro',
  nodes: {
    intro: {
      type: 'message',
      speaker: 'Pasta',
      title: 'Tatlı bir ödül',
      text:
        'Bu pasta çok lezzetli görünüyor! Ama onu almak için Güneş Sistemi hakkında '
        + '2 soruyu doğru cevaplaman gerekiyor. Hazır mısın?',
      next: 'q1-mcq',
    },
    'q1-mcq': {
      type: 'quiz-mcq',
      speaker: 'Pasta',
      text: 'Güneş sistemimizde Güneş\'e en yakın gezegen hangisidir?',
      options: [
        { id: 'a', label: 'Merkür' },
        { id: 'b', label: 'Mars' },
        { id: 'c', label: 'Jüpiter' },
        { id: 'd', label: 'Satürn' },
      ],
      correct: 'a',
      correctFeedback: 'Doğru! Merkür, Güneş\'e en yakın gezegendir.',
      wrongFeedback: 'Tekrar dene! İpucu: Bu gezegenin adı bir elementle de aynı.',
      points: 2,
      scoreLabel: 'Pasta — Merkür sorusu +2',
      next: 'q2-tf',
    },
    'q2-tf': {
      type: 'quiz-true-false',
      speaker: 'Pasta',
      text: 'Dünya, Güneş etrafında yaklaşık 365 günde bir tur atar.',
      correct: true,
      correctFeedback: 'Evet! Bir yıl, Dünya\'nın Güneş etrafındaki bir tam turudur.',
      wrongFeedback: 'Aslında doğruydu — Dünya Güneş etrafında yaklaşık 365 günde döner. Tekrar dene!',
      points: 2,
      scoreLabel: 'Pasta — Dünya yörüngesi +2',
      next: 'reward',
    },
    reward: {
      type: 'message',
      speaker: 'Pasta',
      title: 'Tebrikler!',
      text: 'Her iki soruyu da doğru bildin! Pastayı envanterine alıyorsun.',
      next: 'end',
    },
    end: {
      type: 'end',
      speaker: 'Pasta',
      text: 'Afiyet olsun!',
    },
  },
}
