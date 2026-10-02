/**
 * Gam1 — Fenköyü görev zinciri.
 */
export const gam1Quests = {
  gameSlug: 'gam1',
  badge: {
    id: 'badge-fenkoyu-kesifcisi',
    name: 'Fenköyü Keşifçisi',
    emoji: '🔬',
    description: 'Fenköyünde dolaş, haritayı keşfet ve kamerayı ustaca kullan.',
  },
  quests: [
    {
      id: 'ilk-adimlar',
      title: 'İlk Adımlar',
      description: 'Fenköyünde dolaşmaya başla.',
      subtasks: [
        {
          id: 'hareket-et',
          title: 'WASD ile hareket et',
          hint: 'W, A, S veya D tuşlarına bas',
          trigger: { type: 'explore-move' },
        },
        {
          id: 'kesif-suresi',
          title: '15 saniye haritada kal',
          hint: 'Haritada dolaşmaya devam et',
          trigger: { type: 'explore-duration', seconds: 15 },
        },
      ],
    },
    {
      id: 'kamera-ustasi',
      title: 'Kamera Ustası',
      description: 'Farklı bakış açılarını dene.',
      subtasks: [
        {
          id: 'kamera-degistir',
          title: 'F5 ile kamera modunu değiştir',
          hint: 'F5 tuşuna bas',
          trigger: { type: 'camera-change' },
        },
        {
          id: 'kos',
          title: 'Shift ile koş',
          hint: 'Shift basılı tutarak hareket et',
          trigger: { type: 'explore-run' },
        },
      ],
    },
  ],
}
