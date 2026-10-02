// Simülasyon yöneticisi: data/simulations/<slug>/sim.json + kaynak/ (orman-oyunu deposundan aktarıldı).
// Silme kalıcı değildir: klasör data/simulations-cop/<slug>-<zaman> altına taşınır.
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from './store.js';

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
const EDITABLE = ['title', 'subtitle', 'category', 'description', 'tags', 'status', 'favorite', 'notes', 'usage'];
const STATUS = ['ham', 'hazir', 'arsiv'];

export function createSimulations(dataDir) {
  const DIR = path.join(dataDir, 'simulations');
  const COP = path.join(dataDir, 'simulations-cop');
  const check = (slug) => {
    if (!SLUG.test(slug || '')) throw new HttpError(400, 'Geçersiz simülasyon kimliği');
    return slug;
  };
  const readJson = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));

  let cache = null; // liste önbelleği; update/remove'da düşer
  async function list() {
    if (cache) return cache;
    let names = [];
    try { names = await fs.readdir(DIR); } catch { return []; }
    const out = [];
    for (const n of names) {
      if (!SLUG.test(n)) continue; // _ortak vb. atlanır
      try {
        const s = await readJson(path.join(DIR, n, 'sim.json'));
        out.push({ ...s, fileCount: (s.files || []).length });
      } catch { /* sim.json yok */ }
    }
    return (cache = out.sort((a, b) => a.title.localeCompare(b.title, 'tr')));
  }

  async function get(slug, withSource = false) {
    check(slug);
    let s;
    try { s = await readJson(path.join(DIR, slug, 'sim.json')); } catch { throw new HttpError(404, 'Simülasyon yok'); }
    if (withSource) {
      s.sources = [];
      for (const f of s.files || []) {
        try {
          const text = await fs.readFile(path.join(DIR, slug, 'kaynak', f), 'utf8');
          s.sources.push({ path: f, size: text.length, text: text.length > 200_000 ? text.slice(0, 200_000) : text });
        } catch { /* dosya yok */ }
      }
    }
    return s;
  }

  async function update(slug, body = {}) {
    const s = await get(slug);
    for (const k of EDITABLE) {
      if (body[k] === undefined) continue;
      if (k === 'tags') s.tags = [...new Set((Array.isArray(body.tags) ? body.tags : []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
      else if (k === 'favorite') s.favorite = !!body.favorite;
      else if (k === 'status') {
        if (!STATUS.includes(body.status)) throw new HttpError(400, 'Geçersiz durum');
        s.status = body.status;
      } else s[k] = String(body[k]);
    }
    if (!s.title.trim()) throw new HttpError(400, 'Başlık boş olamaz');
    await fs.writeFile(path.join(DIR, slug, 'sim.json'), JSON.stringify(s, null, 2));
    cache = null;
    return s;
  }

  async function remove(slug) {
    check(slug);
    const src = path.join(DIR, slug);
    try { await fs.access(path.join(src, 'sim.json')); } catch { throw new HttpError(404, 'Simülasyon yok'); }
    await fs.mkdir(COP, { recursive: true });
    const dest = path.join(COP, `${slug}-${Date.now()}`);
    await fs.rename(src, dest);
    cache = null;
    return { moved: path.basename(dest) };
  }

  return { list, get, update, remove };
}

export function simulationRoutes(r, sims) {
  r.get('/simulations', async (_req, res) => res.json(await sims.list()));
  // Kaynak metinleri ağırdır: yalnızca ?kaynak=1 ile istenir (önizleme ve ilk seçim hafif kalır).
  r.get('/simulations/:slug', async (req, res) => res.json(await sims.get(req.params.slug, req.query.kaynak === '1')));
  r.patch('/simulations/:slug', async (req, res) => res.json(await sims.update(req.params.slug, req.body)));
  r.delete('/simulations/:slug', async (req, res) => res.json(await sims.remove(req.params.slug)));
}
