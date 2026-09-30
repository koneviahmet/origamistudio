// Çizim stilleri kaydı. Geometri (varlık facet'leri) aynı kalır, stil onu nasıl
// çizeceğine karar verir. Yeni stil eklemek: draw(ctx, asset, opts) fonksiyonu yaz ve buraya kaydet.
// opts.fold her stilde "görünme ilerlemesi"dir (0 = görünmez, 1 = tam).
import { drawAsset } from './origami.js';
import { drawPapercut } from './papercut.js';
import { drawSketch } from './sketch.js';

export const STYLES = {
  origami: {
    label: 'Origami',
    hint: 'Katlanmış kağıt yüzeyleri, menteşe etrafında açılır',
    draw: drawAsset,
  },
  'kagit-kesme': {
    label: 'Kağıt kesme',
    hint: 'Renk tabakaları üst üste, derin gölge, tabaka tabaka belirir',
    draw: drawPapercut,
  },
  duz: {
    label: 'Düz vektör',
    hint: 'Gölgesiz, temiz renkler (minimal / infografik)',
    draw: (ctx, asset, opts) => drawAsset(ctx, asset, { ...opts, flat: true }),
  },
  cizim: {
    label: 'Çizim / boya',
    hint: 'El çizimi mürekkep kontur, pastel boya taraması; önce çizilir sonra boyanır',
    draw: drawSketch,
  },
};

export const STYLE_IDS = Object.keys(STYLES);

export function drawStyled(ctx, asset, style, opts) {
  (STYLES[style] || STYLES.origami).draw(ctx, asset, opts);
}
