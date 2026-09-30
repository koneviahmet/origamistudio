// Tasarım ekranındaki canlı önizlemeler için küçük örnek sahneler.

/** Temayı denemek için kütüphanedeki varlıklardan kurulan örnek manzara */
export function themeDemoScene(theme, style, assets) {
  const L = [];
  const add = (asset, extra) => assets.has(asset) && L.push({ id: `${asset}-${L.length}`, asset, ...extra });
  add('gunes', { x: 540, y: 250, scale: 1.1 });
  add('bulut', { x: 170, y: 190, scale: 0.9 });
  add('dag', { x: 230, y: 700, anchor: [0.5, 1], scale: 1.9 });
  add('dag', { x: 560, y: 710, anchor: [0.5, 1], scale: 1.4, palette: { a: '#8fb3c9', b: '#6f93aa' } });
  add('tepeler', { x: 360, y: 905, anchor: [0.5, 1], scale: 2.1 });
  add('cam-agaci', { x: 95, y: 760, anchor: [0.5, 1], scale: 1.0 });
  add('cam-agaci', { x: 630, y: 770, anchor: [0.5, 1], scale: 1.2 });
  add('lale', { x: 520, y: 800, anchor: [0.5, 1], scale: 0.55 });
  add('tilki', { x: 330, y: 780, anchor: [0.5, 1], scale: 1.45, shadow: true });
  add('kelebek', { x: 560, y: 470, scale: 0.4, rotation: 10 });
  L.push({ id: 'b', type: 'text', text: 'Tema önizleme', x: 360, y: 90, size: 64, weight: 700, color: '$baslik' });
  L.push({ id: 'm', type: 'text', text: 'kağıttan bir dünya', x: 360, y: 150, size: 30, weight: 500, color: '$metin' });
  return {
    width: 720,
    height: 900,
    fps: 30,
    duration: 1,
    theme,
    style,
    background: theme?.background ? undefined : { type: 'linear', colors: ['#ffe9cf', '#f4ad86'], angle: 180 },
    layers: L,
  };
}

/** Metin stilini denemek için tek metinli sahne */
export function textDemoScene(styleId, text, theme, bg) {
  return {
    width: 900,
    height: 360,
    fps: 30,
    duration: 1,
    theme,
    background: bg || { type: 'linear', colors: ['#fdf0dc', '#f6c9a0'], angle: 135, paper: 0.3, vignette: 0 },
    layers: [{ id: 't', type: 'text', textStyle: styleId, text, x: 450, y: 180 }],
  };
}
