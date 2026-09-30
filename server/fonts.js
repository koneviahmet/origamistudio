// Font kütüphanesi: Google Fonts'tan yalnızca latin + latin-ext (Türkçe) alt kümelerini
// woff2 olarak data/fonts/files/ altına indirir. Böylece render ve dışa aktarım
// internetsiz ve her seferinde aynı sonucu verir.
//
//   data/fonts/fonts.json   → manifest
//   data/fonts/files/*.woff2
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { HttpError } from './store.js';

export const FONT_CATEGORIES = ['yuvarlak', 'modern', 'baslik', 'serif', 'el-yazisi', 'mono'];
const DEFAULT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const FAMILY_RE = /^[A-Za-z0-9 ]{2,60}$/;

export function createFonts(dataDir) {
  const DIR = path.join(dataDir, 'fonts');
  const FILES = path.join(DIR, 'files');
  const MANIFEST = path.join(DIR, 'fonts.json');
  let lock = Promise.resolve();

  // Manifest yazımlarını sırala (eşzamanlı eklemelerde kayıp olmasın)
  function serial(fn) {
    const run = lock.then(fn, fn);
    lock = run.catch(() => {});
    return run;
  }

  async function read() {
    try {
      return JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
    } catch {
      return { fonts: [] };
    }
  }
  async function write(m) {
    await fs.mkdir(DIR, { recursive: true });
    m.fonts.sort((a, b) => a.family.localeCompare(b.family));
    const tmp = `${MANIFEST}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(m, null, 2) + '\n');
    await fs.rename(tmp, MANIFEST);
  }

  async function fetchCss(family, weight) {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    return res.text();
  }

  function parseCss(css) {
    const out = [];
    const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
    let m;
    while ((m = re.exec(css))) {
      const subset = m[1];
      const body = m[2];
      const src = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
      const weight = Number(/font-weight:\s*(\d+)/.exec(body)?.[1] || 400);
      const style = /font-style:\s*(\w+)/.exec(body)?.[1] || 'normal';
      const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim();
      if (src) out.push({ subset, src, weight, style, unicodeRange: range });
    }
    return out;
  }

  async function download(src) {
    const name = `${crypto.createHash('sha1').update(src).digest('hex').slice(0, 16)}.woff2`;
    const file = path.join(FILES, name);
    try {
      await fs.access(file);
    } catch {
      const res = await fetch(src, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`İndirilemedi: ${src}`);
      await fs.mkdir(FILES, { recursive: true });
      await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    }
    return `files/${name}`;
  }

  async function add({ family, category = 'modern', weights = DEFAULT_WEIGHTS }) {
    family = String(family || '').trim();
    if (!FAMILY_RE.test(family)) throw new HttpError(400, `Geçersiz font adı: "${family}"`);
    if (!FONT_CATEGORIES.includes(category)) category = 'modern';
    // Ağırlıklar tek tek istenir: fontta olmayan ağırlık tüm isteği bozmasın
    const blocks = [];
    const results = await Promise.all(weights.map((w) => fetchCss(family, w).catch(() => null)));
    for (const css of results) if (css) blocks.push(...parseCss(css));
    const wanted = blocks.filter((b) => b.subset === 'latin' || b.subset === 'latin-ext');
    if (!wanted.length) throw new HttpError(404, `Google Fonts'ta bulunamadı: ${family}`);
    const files = [];
    for (const b of wanted) {
      files.push({ weight: b.weight, style: b.style, subset: b.subset, unicodeRange: b.unicodeRange, file: await download(b.src) });
    }
    const entry = {
      family,
      category,
      weights: [...new Set(files.map((f) => f.weight))].sort((a, b) => a - b),
      latinExt: files.some((f) => f.subset === 'latin-ext'),
      check: null,
      files,
      addedAt: new Date().toISOString(),
    };
    return serial(async () => {
      const m = await read();
      m.fonts = m.fonts.filter((f) => f.family !== family);
      m.fonts.push(entry);
      await write(m);
      return entry;
    });
  }

  function update(family, patch) {
    return serial(async () => {
      const m = await read();
      const f = m.fonts.find((x) => x.family === family);
      if (!f) throw new HttpError(404, `Font yok: ${family}`);
      if (patch.category && FONT_CATEGORIES.includes(patch.category)) f.category = patch.category;
      if ('check' in patch) f.check = patch.check;
      await write(m);
      return f;
    });
  }

  function remove(family) {
    return serial(async () => {
      const m = await read();
      const f = m.fonts.find((x) => x.family === family);
      if (!f) throw new HttpError(404, `Font yok: ${family}`);
      m.fonts = m.fonts.filter((x) => x !== f);
      const used = new Set(m.fonts.flatMap((x) => x.files.map((y) => y.file)));
      for (const file of new Set(f.files.map((x) => x.file))) {
        if (!used.has(file)) await fs.rm(path.join(DIR, file), { force: true });
      }
      await write(m);
    });
  }

  return { list: async () => (await read()).fonts, add, update, remove, dir: DIR };
}
