// Dosya tabanlı veri deposu. Her şey düz JSON olarak data/ altında tutulur
// ki Claude (AI) dosyaları doğrudan okuyup düzenleyebilsin.
//
//   data/library/<kategori>/<assetId>.json
//   data/projects/<projectId>/scene.json
//   data/projects/<projectId>/notes.json
import fs from 'node:fs/promises';
import path from 'node:path';

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function assertId(id, what = 'id') {
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    throw new HttpError(400, `Geçersiz ${what}: "${id}" (harf, rakam, - ve _ kullanın)`);
  }
  return id;
}

const TR = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };
export function slugify(text) {
  return String(text || '')
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => TR[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'item';
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  const raw = await fs.readFile(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new HttpError(500, `JSON okunamadı (${path.basename(file)}): ${e.message}`);
  }
}

// Atomik yazım: önce geçici dosyaya yaz, sonra yeniden adlandır.
async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, file);
}

export function createStore(dataDir) {
  const LIB = path.join(dataDir, 'library');
  const PROJ = path.join(dataDir, 'projects');

  async function init() {
    await fs.mkdir(LIB, { recursive: true });
    await fs.mkdir(PROJ, { recursive: true });
  }

  // ---------------------------------------------------------------- library
  async function listCategories() {
    const entries = await fs.readdir(LIB, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  }

  async function listAssets() {
    const cats = await listCategories();
    const assets = [];
    for (const cat of cats) {
      const files = (await fs.readdir(path.join(LIB, cat))).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        try {
          const a = await readJson(path.join(LIB, cat, f));
          assets.push({ ...a, id: f.slice(0, -5), category: cat });
        } catch (e) {
          console.warn('[library]', e.message);
        }
      }
    }
    return assets;
  }

  async function findAssetFile(id) {
    assertId(id);
    for (const cat of await listCategories()) {
      const file = path.join(LIB, cat, `${id}.json`);
      if (await exists(file)) return { file, category: cat };
    }
    return null;
  }

  async function getAsset(id) {
    const found = await findAssetFile(id);
    if (!found) throw new HttpError(404, `Varlık bulunamadı: ${id}`);
    const a = await readJson(found.file);
    return { ...a, id, category: found.category };
  }

  function cleanAsset(asset) {
    const { id, category, ...rest } = asset;
    return rest;
  }

  async function createAsset(asset) {
    const id = assertId(asset.id || slugify(asset.name));
    const category = assertId(asset.category || 'genel', 'kategori');
    if (await findAssetFile(id)) throw new HttpError(409, `Bu id zaten kullanılıyor: ${id}`);
    await writeJson(path.join(LIB, category, `${id}.json`), cleanAsset(asset));
    return getAsset(id);
  }

  async function updateAsset(id, asset) {
    const found = await findAssetFile(id);
    if (!found) throw new HttpError(404, `Varlık bulunamadı: ${id}`);
    const newId = assertId(asset.id || id);
    const category = assertId(asset.category || found.category, 'kategori');
    if (newId !== id && (await findAssetFile(newId))) {
      throw new HttpError(409, `Bu id zaten kullanılıyor: ${newId}`);
    }
    const target = path.join(LIB, category, `${newId}.json`);
    await writeJson(target, cleanAsset(asset));
    if (target !== found.file) await fs.rm(found.file, { force: true });
    return getAsset(newId);
  }

  async function deleteAsset(id) {
    const found = await findAssetFile(id);
    if (!found) throw new HttpError(404, `Varlık bulunamadı: ${id}`);
    await fs.rm(found.file);
  }

  async function createCategory(name) {
    assertId(name, 'kategori');
    await fs.mkdir(path.join(LIB, name), { recursive: true });
  }

  async function deleteCategory(name) {
    assertId(name, 'kategori');
    const dir = path.join(LIB, name);
    if (!(await exists(dir))) throw new HttpError(404, `Kategori yok: ${name}`);
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json'));
    if (files.length) throw new HttpError(409, `Kategori boş değil (${files.length} varlık)`);
    await fs.rm(dir, { recursive: true });
  }

  async function renameCategory(name, newName) {
    assertId(name, 'kategori');
    assertId(newName, 'kategori');
    const dir = path.join(LIB, name);
    const target = path.join(LIB, newName);
    if (!(await exists(dir))) throw new HttpError(404, `Kategori yok: ${name}`);
    if (await exists(target)) throw new HttpError(409, `Kategori zaten var: ${newName}`);
    await fs.rename(dir, target);
  }

  // --------------------------------------------------------------- projects
  const sceneFile = (id) => path.join(PROJ, assertId(id), 'scene.json');
  const notesFile = (id) => path.join(PROJ, assertId(id), 'notes.json');

  async function readNotes(id) {
    const f = notesFile(id);
    return (await exists(f)) ? readJson(f) : [];
  }

  async function listProjects() {
    const entries = await fs.readdir(PROJ, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const f = path.join(PROJ, e.name, 'scene.json');
      if (!(await exists(f))) continue;
      try {
        const scene = await readJson(f);
        const stat = await fs.stat(f);
        const notes = await readNotes(e.name);
        out.push({
          id: e.name,
          name: scene.name || e.name,
          width: scene.width,
          height: scene.height,
          fps: scene.fps,
          duration: scene.duration,
          layers: scene.layers?.length || 0,
          openNotes: notes.filter((n) => n.status !== 'done').length,
          updatedAt: stat.mtime.toISOString(),
        });
      } catch (err) {
        console.warn('[projects]', err.message);
      }
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async function getProject(id) {
    const f = sceneFile(id);
    if (!(await exists(f))) throw new HttpError(404, `Proje bulunamadı: ${id}`);
    return { id, scene: await readJson(f), notes: await readNotes(id) };
  }

  async function uniqueProjectId(base) {
    let id = slugify(base);
    let i = 2;
    while (await exists(path.join(PROJ, id))) id = `${slugify(base)}-${i++}`;
    return id;
  }

  async function createProject(scene) {
    const id = await uniqueProjectId(scene.name || 'proje');
    pendingSource.set(id, 'create');
    await writeJson(sceneFile(id), scene);
    await writeJson(notesFile(id), []);
    return getProject(id);
  }

  async function saveScene(id, scene) {
    const f = sceneFile(id);
    if (!(await exists(f))) throw new HttpError(404, `Proje bulunamadı: ${id}`);
    lastApiWrite.set(id, Date.now());
    await writeJson(f, scene);
    return { id, scene };
  }

  async function duplicateProject(id, name) {
    const { scene } = await getProject(id);
    return createProject({ ...scene, name: name || `${scene.name || id} kopya` });
  }

  async function deleteProject(id) {
    const dir = path.join(PROJ, assertId(id));
    if (!(await exists(dir))) throw new HttpError(404, `Proje bulunamadı: ${id}`);
    await fs.rm(dir, { recursive: true });
  }

  // ---------------------------------------------------------------- history
  // Her scene.json değişikliği bir sürüm olur: data/projects/<id>/history/<ts>.json
  //   { ts, source: "studio" | "disk" | "restore" | "create" | "baseline", summary, scene }
  // Kaynak: son 2 sn içinde API'den kaydedildiyse "studio", değilse "disk" (Claude / elle düzenleme).
  const HIST_MAX = 80;
  const lastApiWrite = new Map();
  const pendingSource = new Map();
  const histDir = (id) => path.join(PROJ, assertId(id), 'history');

  function sceneDiff(a, b) {
    const out = { added: [], removed: [], changed: [], scene: [] };
    if (!a) return out;
    const la = new Map((a.layers || []).map((l) => [l.id, l]));
    const lb = new Map((b.layers || []).map((l) => [l.id, l]));
    for (const id of lb.keys()) if (!la.has(id)) out.added.push(id);
    for (const id of la.keys()) if (!lb.has(id)) out.removed.push(id);
    for (const [id, l] of lb) {
      const o = la.get(id);
      if (!o) continue;
      const keys = [...new Set([...Object.keys(o), ...Object.keys(l)])].filter((k) => JSON.stringify(o[k]) !== JSON.stringify(l[k]));
      if (keys.length) out.changed.push({ id, keys });
    }
    const ia = (a.layers || []).map((l) => l.id).filter((id) => lb.has(id)).join('|');
    const ib = (b.layers || []).map((l) => l.id).filter((id) => la.has(id)).join('|');
    if (ia !== ib) out.scene.push('katman sırası');
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (k !== 'layers' && JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.scene.push(k);
    }
    return out;
  }

  async function readHistory(id) {
    const dir = histDir(id);
    if (!(await exists(dir))) return [];
    return (await fs.readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  }

  async function snapshotScene(id, source) {
    const f = sceneFile(id);
    if (!(await exists(f))) return null;
    let scene;
    try {
      scene = await readJson(f);
    } catch {
      return null; // yarım yazılmış dosya — bir sonraki değişiklikte alınır
    }
    const files = await readHistory(id);
    let prev = null;
    if (files.length) {
      try {
        prev = (await readJson(path.join(histDir(id), files[files.length - 1]))).scene;
      } catch { /* bozuk sürüm atlanır */ }
    }
    if (prev && JSON.stringify(prev) === JSON.stringify(scene)) return null;
    const src = source || pendingSource.get(id) || (Date.now() - (lastApiWrite.get(id) || 0) < 2500 ? 'studio' : 'disk');
    pendingSource.delete(id);
    const ts = Date.now();
    await writeJson(path.join(histDir(id), `${ts}.json`), { ts, source: src, summary: sceneDiff(prev, scene), scene });
    const all = await readHistory(id);
    for (const old of all.slice(0, Math.max(0, all.length - HIST_MAX))) await fs.rm(path.join(histDir(id), old), { force: true });
    return ts;
  }

  async function listHistory(id) {
    await getProject(id);
    const out = [];
    for (const f of (await readHistory(id)).reverse()) {
      try {
        const h = await readJson(path.join(histDir(id), f));
        out.push({ ts: h.ts, source: h.source, summary: h.summary, layers: h.scene.layers?.length || 0, duration: h.scene.duration });
      } catch { /* atla */ }
    }
    return out;
  }

  async function getHistory(id, ts) {
    const f = path.join(histDir(id), `${Number(ts)}.json`);
    if (!(await exists(f))) throw new HttpError(404, 'Sürüm bulunamadı');
    return readJson(f);
  }

  async function restoreHistory(id, ts) {
    const h = await getHistory(id, ts);
    pendingSource.set(id, 'restore');
    await writeJson(sceneFile(id), h.scene);
    return { id, scene: h.scene };
  }

  /** Geçmişi olmayan projeler için başlangıç sürümü */
  async function baselineHistory() {
    for (const p of await listProjects()) if (!(await readHistory(p.id)).length) await snapshotScene(p.id, 'baseline');
  }

  // ------------------------------------------------------------------ notes
  async function addNote(id, note) {
    await getProject(id);
    const notes = await readNotes(id);
    const n = {
      id: `n_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      t: Number(note.t) || 0,
      layerId: note.layerId || null,
      pos: Array.isArray(note.pos) ? note.pos.map(Number) : null,
      text: String(note.text || '').trim(),
      status: 'open',
      reply: null,
      createdAt: new Date().toISOString(),
    };
    if (!n.text) throw new HttpError(400, 'Not metni boş olamaz');
    notes.push(n);
    await writeJson(notesFile(id), notes);
    return n;
  }

  async function updateNote(id, noteId, patch) {
    const notes = await readNotes(id);
    const n = notes.find((x) => x.id === noteId);
    if (!n) throw new HttpError(404, `Not bulunamadı: ${noteId}`);
    for (const k of ['t', 'layerId', 'pos', 'text', 'status', 'reply']) {
      if (k in patch) n[k] = patch[k];
    }
    n.updatedAt = new Date().toISOString();
    await writeJson(notesFile(id), notes);
    return n;
  }

  async function deleteNote(id, noteId) {
    const notes = await readNotes(id);
    const next = notes.filter((x) => x.id !== noteId);
    if (next.length === notes.length) throw new HttpError(404, `Not bulunamadı: ${noteId}`);
    await writeJson(notesFile(id), next);
  }

  // -------------------------------------------------------------- snapshots
  // Kare görüntüleri (PNG) — notlara eklenir, Claude notu işlerken kareyi görür.
  async function saveSnapshot(id, name, buffer) {
    await getProject(id);
    assertId(name, 'görüntü adı');
    if (!Buffer.isBuffer(buffer) || buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) {
      throw new HttpError(400, 'PNG bekleniyor');
    }
    const dir = path.join(PROJ, id, 'snapshots');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.png`);
    await fs.writeFile(file, buffer);
    return { path: path.relative(path.dirname(dataDir), file).replace(/\\/g, '/') };
  }

  // ------------------------------------------------------------ collections
  // Basit belge koleksiyonları: data/<koleksiyon>/<id>.json (temalar, metin stilleri)
  const COLLECTIONS = ['themes', 'textstyles'];
  function colDir(col) {
    if (!COLLECTIONS.includes(col)) throw new HttpError(404, `Bilinmeyen koleksiyon: ${col}`);
    return path.join(dataDir, col);
  }
  async function colList(col) {
    const dir = colDir(col);
    await fs.mkdir(dir, { recursive: true });
    const out = [];
    for (const f of (await fs.readdir(dir)).filter((x) => x.endsWith('.json'))) {
      try {
        out.push({ ...(await readJson(path.join(dir, f))), id: f.slice(0, -5) });
      } catch (e) {
        console.warn(`[${col}]`, e.message);
      }
    }
    return out.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr'));
  }
  async function colGet(col, id) {
    const f = path.join(colDir(col), `${assertId(id)}.json`);
    if (!(await exists(f))) throw new HttpError(404, `Bulunamadı: ${id}`);
    return { ...(await readJson(f)), id };
  }
  async function colCreate(col, doc) {
    const id = assertId(doc.id || slugify(doc.name));
    const f = path.join(colDir(col), `${id}.json`);
    if (await exists(f)) throw new HttpError(409, `Bu id zaten kullanılıyor: ${id}`);
    const { id: _i, ...rest } = doc;
    await writeJson(f, rest);
    return colGet(col, id);
  }
  async function colUpdate(col, id, doc) {
    const old = path.join(colDir(col), `${assertId(id)}.json`);
    if (!(await exists(old))) throw new HttpError(404, `Bulunamadı: ${id}`);
    const newId = assertId(doc.id || id);
    const target = path.join(colDir(col), `${newId}.json`);
    if (newId !== id && (await exists(target))) throw new HttpError(409, `Bu id zaten kullanılıyor: ${newId}`);
    const { id: _i, ...rest } = doc;
    await writeJson(target, rest);
    if (target !== old) await fs.rm(old, { force: true });
    return colGet(col, newId);
  }
  async function colDelete(col, id) {
    const f = path.join(colDir(col), `${assertId(id)}.json`);
    if (!(await exists(f))) throw new HttpError(404, `Bulunamadı: ${id}`);
    await fs.rm(f);
  }

  // ------------------------------------------------------------------ audio
  // Müzik ve ses dosyaları: data/audio/<ad>.<uzantı>
  const AUDIO = path.join(dataDir, 'audio');
  const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i;
  function audioName(name) {
    const m = String(name || '').match(/^(.*?)(\.[a-z0-9]+)$/i);
    if (!m || !AUDIO_EXT.test(m[2])) throw new HttpError(400, 'Desteklenen biçimler: mp3, wav, ogg, m4a, aac, flac, webm');
    return `${slugify(m[1])}${m[2].toLowerCase()}`;
  }
  async function listAudio() {
    await fs.mkdir(AUDIO, { recursive: true });
    const out = [];
    for (const f of (await fs.readdir(AUDIO)).filter((x) => AUDIO_EXT.test(x))) {
      const st = await fs.stat(path.join(AUDIO, f));
      out.push({ file: f, size: st.size, addedAt: st.mtime.toISOString() });
    }
    return out.sort((a, b) => a.file.localeCompare(b.file));
  }
  async function saveAudio(name, buffer) {
    const file = audioName(name);
    if (!Buffer.isBuffer(buffer) || buffer.length < 64) throw new HttpError(400, 'Dosya boş');
    await fs.mkdir(AUDIO, { recursive: true });
    await fs.writeFile(path.join(AUDIO, file), buffer);
    return { file, size: buffer.length };
  }
  async function deleteAudio(name) {
    const file = audioName(name);
    const f = path.join(AUDIO, file);
    if (!(await exists(f))) throw new HttpError(404, `Ses dosyası yok: ${file}`);
    await fs.rm(f);
  }

  return {
    init, saveSnapshot, listAudio, saveAudio, deleteAudio, audioDir: AUDIO, colList, colGet, colCreate, colUpdate, colDelete,
    listCategories, listAssets, getAsset, createAsset, updateAsset, deleteAsset,
    createCategory, deleteCategory, renameCategory,
    listProjects, getProject, createProject, saveScene, duplicateProject, deleteProject,
    readNotes, addNote, updateNote, deleteNote,
    snapshotScene, listHistory, getHistory, restoreHistory, baselineHistory,
  };
}
