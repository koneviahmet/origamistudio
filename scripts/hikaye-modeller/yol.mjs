// Kervan yolu geometrisi: model (kervan.mjs) ve şablon (hikaye-kervan.mjs) aynı eğriyi kullanır. t: 0 = ufuk (uzak), 1 = ön (yakın)
export const YOL = { W: 1080, H: 1100, A0: 40, A1: 250, w0: 14, w1: 200 };
export const yolMerkez = (t) => ({ x: 540 + (YOL.A0 + (YOL.A1 - YOL.A0) * t) * Math.sin(t * Math.PI * 2 * 1.25 + 0.5), y: YOL.H * t, w: YOL.w0 + (YOL.w1 - YOL.w0) * t ** 1.5 });
