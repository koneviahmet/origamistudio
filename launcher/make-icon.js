// Origami Studio masaüstü ikonunu üretir (harici araç gerektirmez): launcher/origami-studio.ico
//   node launcher/make-icon.js
// Çizim: koyu yuvarlatılmış kare üzerinde dört üçgenden oluşan origami elmas (uygulama logosu).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));

// --- CRC32 + PNG yazıcı
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit derinliği
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtre yok
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Rasterleştirici (4×4 süper örnekleme ile kenar yumuşatma)
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const inTri = (px, py, [a, b, c]) => {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const P = [px, py];
  const d1 = s(P, a, b);
  const d2 = s(P, b, c);
  const d3 = s(P, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};
function render(size) {
  const out = Buffer.alloc(size * size * 4);
  const SS = 4;
  // 0..1 birim koordinatlarda şekiller (üstteki sonra çizilir)
  const R = 0.2; // köşe yarıçapı
  const inRounded = (x, y) => {
    const m = 0.03;
    if (x < m || y < m || x > 1 - m || y > 1 - m) return false;
    const cx = Math.min(Math.max(x, m + R), 1 - m - R);
    const cy = Math.min(Math.max(y, m + R), 1 - m - R);
    return (x - cx) ** 2 + (y - cy) ** 2 <= R * R;
  };
  const c = [0.5, 0.5];
  const T = [0.5, 0.13];
  const B = [0.5, 0.87];
  const Lp = [0.13, 0.5];
  const Rp = [0.87, 0.5];
  const shapes = [
    { test: (x, y) => inRounded(x, y), col: hex('#1e1a15') },
    { test: (x, y) => inTri(x, y, [T, Rp, c]), col: hex('#ea7a3b') },
    { test: (x, y) => inTri(x, y, [T, Lp, c]), col: hex('#f5a36b') },
    { test: (x, y) => inTri(x, y, [Lp, B, c]), col: hex('#c95c26') },
    { test: (x, y) => inTri(x, y, [Rp, B, c]), col: hex('#e8763a') },
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          let col = null;
          for (const s of shapes) if (s.test(u, v)) col = s.col;
          if (col) {
            r += col[0];
            g += col[1];
            b += col[2];
            a++;
          }
        }
      }
      const i = (y * size + x) * 4;
      if (a) {
        out[i] = Math.round(r / a);
        out[i + 1] = Math.round(g / a);
        out[i + 2] = Math.round(b / a);
      }
      out[i + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return out;
}

// --- ICO: PNG sıkıştırmalı girişler (Windows Vista ve sonrası)
const sizes = [256, 64, 48, 32, 24, 16];
const pngs = sizes.map((s) => png(s, render(s)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e[0] = s >= 256 ? 0 : s;
  e[1] = s >= 256 ? 0 : s;
  e.writeUInt16LE(1, 4); // renk düzlemi
  e.writeUInt16LE(32, 6); // bit/piksel
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
fs.writeFileSync(path.join(DIR, 'origami-studio.ico'), Buffer.concat([header, ...dir, ...pngs]));
fs.writeFileSync(path.join(DIR, 'origami-studio-256.png'), pngs[0]);
console.log('Yazıldı: launcher/origami-studio.ico (' + sizes.join(', ') + ' px)');
