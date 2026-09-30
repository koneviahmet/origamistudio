// "Buzdolabının gelişimi" için yeni varlıklar → data/library/mutfak
//   node scripts/seed-buzdolabi.mjs   (üzerine yazar)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'library', 'mutfak');
const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const F = (p, c, s = 0, extra = {}) => ({ p, c, s: r1(s * 100) / 100, ...extra });
const rect = (x, y, w, h, c, s = 0, extra = {}) => [
  F([[x, y], [x + w, y], [x + w, y + h]], c, s + 0.09, extra),
  F([[x, y], [x + w, y + h], [x, y + h]], c, s - 0.09, extra),
];
const quad = (a, b, c2, d, c, s = 0) => [F([a, b, c2], c, s + 0.09), F([a, c2, d], c, s - 0.09)];
const ellipse = (cx, cy, rx, ry, c, s = 0, n = 18) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = (360 / n) * i, a1 = (360 / n) * (i + 1), am = rad((a0 + a1) / 2);
    const light = Math.cos(am - rad(225)) * 0.25;
    out.push(F([[cx, cy], [r1(cx + rx * Math.cos(rad(a0))), r1(cy + ry * Math.sin(rad(a0)))], [r1(cx + rx * Math.cos(rad(a1))), r1(cy + ry * Math.sin(rad(a1)))]], c, s + light));
  }
  return out;
};
/** kalın çizgi parçası */
const seg = (x1, y1, x2, y2, w, c, s = 0) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
  return quad([x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny], c, s);
};
const PAL = { a: '#f4f7fa', b: '#c9d6e2', c: '#ffffff', d: '#4a5868', v: '#ff7a59', w: '#8b5a3c', x: '#cfeefc', y: '#7fc8ee' };
const ROL = { a: 'ana', b: 'ikincil', c: 'acik', d: 'koyu', v: 'vurgu' };

// Dolap gövdesi: ön yüz + yan yüz (üç boyut hissi)
const govde = (x, y, w, h, c, yan = 14) => [
  ...quad([x + w, y], [x + w + yan, y - yan * 0.6], [x + w + yan, y + h - yan * 0.6], [x + w, y + h], 'b', -0.2),
  ...quad([x, y], [x + yan, y - yan * 0.6], [x + w + yan, y - yan * 0.6], [x + w, y], 'c', 0.15),
  ...rect(x, y, w, h, c, 0),
];

const assets = {
  'buz-blogu': {
    name: 'Buz blok', tags: ['buz', 'soğuk', 'blok', 'mutfak'], size: [200, 170],
    facets: [
      ...quad([20, 50], [60, 18], [190, 18], [150, 50], 'c', 0.2),
      ...quad([150, 50], [190, 18], [190, 130], [150, 160], 'y', -0.25),
      ...rect(20, 50, 130, 110, 'x', 0),
      ...quad([36, 66], [70, 66], [48, 120], [36, 120], 'c', 0.3),
      ...seg(84, 70, 100, 70, 6, 'c', 0.25),
    ],
  },
  'buz-sandigi': {
    name: 'Buz sandığı (ahşap)', tags: ['buz', 'sandık', 'ahşap', 'eski', 'soğutma'], size: [220, 260],
    facets: [
      ...quad([196, 70], [214, 54], [214, 230], [196, 250], 'w', -0.3),
      ...rect(14, 70, 182, 180, 'w', 0),
      ...rect(14, 70, 182, 10, 'b', 0.2),
      ...rect(24, 92, 162, 70, 'd', -0.05),
      ...rect(24, 172, 162, 66, 'd', -0.05),
      ...rect(92, 196, 26, 10, 'v', 0.1),
      ...quad([14, 70], [32, 54], [214, 54], [196, 70], 'b', 0.25),
      ...quad([50, 30], [90, 8], [170, 8], [130, 30], 'c', 0.2),
      ...rect(50, 30, 80, 30, 'x', 0),
      ...quad([130, 30], [170, 8], [170, 40], [130, 60], 'y', -0.2),
    ],
  },
  'vakum-kap': {
    name: 'Vakum kapağı + pompa (Cullen deneyi)', tags: ['deney', 'pompa', 'cam', 'soğutma', '1755'], size: [240, 260],
    facets: [
      ...rect(20, 226, 200, 24, 'w', 0),
      ...rect(40, 214, 160, 14, 'd', 0),
      ...ellipse(120, 140, 70, 78, 'x', 0.15, 20),
      ...ellipse(96, 110, 14, 26, 'c', 0.4, 10),
      ...rect(92, 168, 56, 46, 'y', -0.1),
      ...ellipse(120, 168, 28, 7, 'c', 0.2, 10),
      ...seg(190, 222, 232, 160, 8, 'd'),
      ...rect(222, 120, 14, 50, 'b', 0),
      ...ellipse(229, 116, 10, 10, 'v', 0.1, 10),
    ],
  },
  'kompresor-devresi': {
    name: 'Buhar sıkıştırmalı soğutma devresi', tags: ['kompresör', 'boru', 'soğutma', 'mekanik'], size: [260, 260],
    facets: [
      ...rect(20, 20, 220, 220, 'c', 0),
      ...rect(28, 28, 204, 204, 'x', 0.05),
      ...rect(40, 40, 70, 50, 'd', 0),
      ...ellipse(75, 65, 14, 14, 'v', 0.1, 12),
      ...seg(110, 60, 210, 60, 10, 'v'),
      ...seg(210, 60, 210, 120, 10, 'v'),
      ...seg(210, 120, 160, 120, 10, 'v'),
      ...seg(160, 120, 210, 150, 10, 'v'),
      ...seg(210, 150, 160, 180, 10, 'v'),
      ...seg(160, 180, 210, 210, 10, 'v'),
      ...seg(210, 210, 100, 210, 10, 'y'),
      ...seg(100, 210, 60, 210, 10, 'y'),
      ...seg(60, 210, 60, 100, 10, 'y'),
      ...rect(40, 130, 40, 50, 'b', 0),
      ...rect(48, 138, 24, 34, 'c', 0.2),
    ],
  },
  'buzdolabi-ilk-elektrikli': {
    name: 'İlk ev tipi elektrikli buzdolabı', tags: ['buzdolabı', 'eski', 'elektrikli', 'mutfak', '1913'], size: [180, 300],
    facets: [
      ...rect(40, 4, 100, 44, 'd', 0),
      ...rect(54, 12, 72, 8, 'b', 0.1),
      ...rect(54, 26, 72, 8, 'b', 0.1),
      ...govde(24, 48, 132, 236, 'a'),
      ...rect(24, 48, 132, 4, 'c', 0.3),
      ...rect(36, 62, 108, 100, 'b', -0.05),
      ...rect(36, 172, 108, 100, 'b', -0.05),
      ...rect(128, 100, 7, 34, 'd', 0),
      ...rect(128, 204, 7, 34, 'd', 0),
      ...rect(30, 284, 14, 14, 'd', 0), ...rect(136, 284, 14, 14, 'd', 0),
    ],
  },
  'buzdolabi-monitor': {
    name: 'Silindir üstlü buzdolabı (Monitor Top tarzı)', tags: ['buzdolabı', 'retro', '1927', 'mutfak'], size: [190, 310],
    facets: [
      ...ellipse(95, 28, 52, 22, 'd', 0, 18),
      ...rect(43, 28, 104, 26, 'd', -0.05),
      ...ellipse(95, 54, 52, 10, 'b', 0, 14),
      ...rect(56, 20, 78, 5, 'c', 0.3),
      ...rect(56, 34, 78, 4, 'c', 0.3),
      ...govde(28, 60, 134, 216, 'a'),
      ...rect(40, 74, 110, 90, 'b', -0.05),
      ...rect(40, 174, 110, 90, 'b', -0.05),
      ...rect(134, 108, 7, 30, 'd', 0),
      ...rect(134, 206, 7, 30, 'd', 0),
      ...quad([32, 276], [60, 276], [50, 308], [38, 308], 'd', 0),
      ...quad([130, 276], [158, 276], [152, 308], [140, 308], 'd', 0),
    ],
  },
  'akilli-buzdolabi': {
    name: 'Akıllı buzdolabı (çift kapı + ekran)', tags: ['buzdolabı', 'akıllı', 'modern', 'mutfak', 'ekran'], size: [200, 320],
    palette: { ...PAL, a: '#dfe5ea' },
    facets: [
      ...govde(24, 10, 152, 300, 'a', 16),
      ...rect(32, 18, 66, 284, 'b', -0.03),
      ...rect(102, 18, 66, 284, 'b', -0.03),
      ...rect(40, 70, 50, 60, 'd', 0),
      ...rect(44, 74, 42, 52, 'y', 0.15),
      ...rect(48, 84, 34, 5, 'c', 0.3), ...rect(48, 96, 24, 5, 'c', 0.3), ...rect(48, 108, 30, 5, 'v', 0.1),
      ...rect(92, 120, 5, 50, 'd', 0), ...rect(103, 120, 5, 50, 'd', 0),
      ...rect(120, 40, 30, 4, 'y', 0.2),
    ],
  },
};

fs.mkdirSync(DIR, { recursive: true });
for (const [id, a] of Object.entries(assets)) {
  const o = { id, name: a.name, tags: a.tags, size: a.size, palette: a.palette || PAL, roles: ROL, facets: a.facets };
  fs.writeFileSync(path.join(DIR, `${id}.json`), JSON.stringify(o, null, 2) + '\n');
}
console.log(`ok — ${Object.keys(assets).length} varlık → data/library/mutfak`);
