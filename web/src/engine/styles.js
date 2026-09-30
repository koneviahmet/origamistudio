// Çizim stilleri kaydı. Geometri (varlık facet'leri) aynı kalır, stil onu nasıl
// çizeceğine karar verir. Yeni stil eklemek: draw(ctx, asset, opts) fonksiyonu yaz ve buraya kaydet.
// opts.fold her stilde "görünme ilerlemesi"dir (0 = görünmez, 1 = tam).
import { drawAsset } from './origami.js';
import { drawPapercut } from './papercut.js';
import { drawSketch } from './sketch.js';
import { drawNeon, drawGlass, drawMosaic, drawBlueprint, drawVitray, drawClay, drawSilhouette, drawNewsprint, drawHalftone, drawWatercolor, drawStitch, drawPixel } from './stylized.js';

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
  neon: {
    label: 'Neon',
    hint: 'Koyu zemin üstünde parlayan çizgi iskeleti (gece / teknoloji)',
    draw: drawNeon,
  },
  cam: {
    label: 'Cam',
    hint: 'Yarı saydam buzlu cam, parlak kenar ve yansıma',
    draw: drawGlass,
  },
  mozaik: {
    label: 'Mozaik (low-poly)',
    hint: 'Her yüzey hafif farklı tonda, kristal / low-poly görünüm',
    draw: drawMosaic,
  },
  teknik: {
    label: 'Teknik çizim',
    hint: 'Mavi pafta, beyaz ince çizgi (mühendislik / şema)',
    draw: drawBlueprint,
  },
  vitray: {
    label: 'Vitray',
    hint: 'Işıklı renkli cam, kalın koyu kurşun çerçeve',
    draw: drawVitray,
  },
  kil: {
    label: 'Kil',
    hint: 'Yumuşak, şişkin hacimli kil / plastilin, yumuşak gölge',
    draw: drawClay,
  },
  siluet: {
    label: 'Gölge oyunu',
    hint: 'Tek renk siluet, yüzeyin renginde hale (sinematik / gizem)',
    draw: drawSilhouette,
  },
  gazete: {
    label: 'Gazete baskısı',
    hint: 'Tek renk mürekkep tonları ve baskı kayması (retro haber)',
    draw: drawNewsprint,
  },
  halftone: {
    label: 'Halftone / pop-art',
    hint: 'Nokta rasterli çizgi roman baskısı',
    draw: drawHalftone,
  },
  suluboya: {
    label: 'Suluboya',
    hint: 'Üst üste yarı saydam, kenarı oynak boya lekeleri',
    draw: drawWatercolor,
  },
  nakis: {
    label: 'Nakış',
    hint: 'Kumaş yüzey, dikiş çizgili kenar',
    draw: drawStitch,
  },
  piksel: {
    label: 'Piksel (8-bit)',
    hint: 'Düşük çözünürlüklü, keskin piksel oyun görünümü',
    draw: drawPixel,
  },
};

export const STYLE_IDS = Object.keys(STYLES);

export function drawStyled(ctx, asset, style, opts) {
  (STYLES[style] || STYLES.origami).draw(ctx, asset, opts);
}
