// Başlangıç font kütüphanesini Google Fonts'tan indirir (latin + latin-ext → Türkçe).
//   npm run fonts            → eksik fontları indirir
//   npm run fonts -- --force → hepsini yeniden indirir
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFonts } from '../server/fonts.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');

export const STARTER_FONTS = {
  yuvarlak: ['Fredoka', 'Baloo 2', 'Nunito', 'Quicksand', 'Comfortaa', 'Varela Round', 'M PLUS Rounded 1c', 'Mali'],
  modern: [
    'Inter', 'Poppins', 'Montserrat', 'Rubik', 'Outfit', 'Plus Jakarta Sans', 'Manrope', 'Work Sans',
    'Raleway', 'Lexend', 'Sora', 'Urbanist', 'DM Sans', 'Figtree',
  ],
  baslik: ['Bebas Neue', 'Anton', 'Oswald', 'Archivo Black', 'Righteous', 'Bungee', 'Titan One', 'Lilita One', 'Russo One', 'Alfa Slab One'],
  serif: ['Playfair Display', 'DM Serif Display', 'Merriweather', 'Lora', 'Abril Fatface', 'Fraunces'],
  'el-yazisi': ['Caveat', 'Pacifico', 'Lobster', 'Dancing Script', 'Kalam', 'Satisfy', 'Patrick Hand', 'Courgette'],
  mono: ['JetBrains Mono', 'Space Mono'],
};

const fonts = createFonts(path.join(ROOT, 'data'));
const have = new Set((await fonts.list()).map((f) => f.family));
let ok = 0;
const fail = [];
for (const [category, list] of Object.entries(STARTER_FONTS)) {
  for (const family of list) {
    if (have.has(family) && !FORCE) continue;
    try {
      const e = await fonts.add({ family, category });
      ok++;
      console.log(`✓ ${family.padEnd(20)} ${e.weights.join(',').padEnd(28)} ${e.latinExt ? 'TR' : '— latin-ext YOK'}`);
    } catch (err) {
      fail.push(family);
      console.log(`✗ ${family}: ${err.message}`);
    }
  }
}
console.log(`\n${ok} font indirildi${fail.length ? `, başarısız: ${fail.join(', ')}` : ''}.`);
