// Yerel seslendirme: ses kataloğu (Hugging Face veri seti), kayıtlı sesler ve TTS motoru süreci (tts/sunucu.py).
// Hem sunucu (sayfa) hem scripts/seslendir.mjs kullanır.
// Ses = veri setindeki "voices" kaydı: id, cinsiyet, tarif (İngilizce), referans kayıt (48 kHz) ve referans metni.
// Veri seti lisansı CC-BY / CC-BY-SA: sesleri olduğu gibi yeniden dağıtırsan atıf ver. Üretilen konuşma senindir.
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HttpError } from './store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS = 'cloud0day3/alania-synthetic-speech-tr';
const HF = 'https://datasets-server.huggingface.co';
const PORT = Number(process.env.TTS_PORT) || 5181;
const BASE = `http://127.0.0.1:${PORT}`;
const ID_RE = /^[\w-]{1,40}$/;

export function createTts(dataDir = path.join(ROOT, 'data')) {
  const voicesDir = path.join(dataDir, 'voices');
  const previewDir = path.join(dataDir, 'tts-onizleme');
  const py = path.join(ROOT, 'tts', '.venv', 'Scripts', 'python.exe');
  const script = path.join(ROOT, 'tts', 'sunucu.py');

  // --------------------------------------------------------------- katalog
  // Katalogun metin bilgisi (2.750 ses) bir kez indirilip data/voices-katalog.json'a yazılır; arama, süzgeç ve
  // sayfalama yerelde yapılır. HF API'ye yalnızca referans kayıtlar (ilk dinleme/kaydetme) ve ilk indirme için gidilir.
  const catFile = path.join(dataDir, 'voices-katalog.json');
  const cacheDir = path.join(dataDir, 'voices-cache');
  let index = null;
  let byId = new Map();
  let building = null;
  let buildErr = '';
  const progress = { done: 0, total: 0 };

  const meta = (x) => ({
    i: x.row_idx,
    id: x.row.voice_id,
    gender: x.row.gender,
    description: x.row.voice_description,
    referenceText: x.row.reference_text,
  });

  // HF istekleri: geçici hatalarda (5xx, 429, "dizin yükleniyor", ağ) bekleyip yeniden dener
  async function hf(kind, params) {
    const qs = new URLSearchParams({ dataset: DS, config: 'voices', split: 'train', ...params });
    let son = '';
    for (let deneme = 0; deneme < 8; deneme++) {
      try {
        const res = await fetch(`${HF}/${kind}?${qs}`, { signal: AbortSignal.timeout(60000) });
        const body = await res.text();
        if (res.ok) return JSON.parse(body);
        son = `(${res.status}) ${body.slice(0, 200)}`;
        if (!(res.status >= 500 || res.status === 429 || /index is loading/i.test(body))) break;
      } catch (e) {
        son = e.message;
      }
      await new Promise((r) => setTimeout(r, 2000 + deneme * 1500));
    }
    throw new HttpError(502, `Ses listesi alınamadı ${son}`);
  }

  function setIndex(rows) {
    index = rows;
    byId = new Map(rows.map((v) => [v.id, v]));
  }
  async function loadIndex() {
    if (index) return index;
    try {
      setIndex(JSON.parse(await fs.readFile(catFile, 'utf8')));
    } catch { /* henüz yok */ }
    return index;
  }

  const partial = new Map(); // offset → satırlar (hata sonrası kaldığı yerden devam)
  let totalRows = 0;
  function buildIndex() {
    if (building) return building;
    buildErr = '';
    building = (async () => {
      const L = 100;
      if (!partial.has(0)) {
        const f = await hf('rows', { offset: 0, length: L });
        totalRows = f.num_rows_total;
        partial.set(0, f.rows.map(meta));
      }
      const upd = () => Object.assign(progress, { total: totalRows, done: [...partial.values()].reduce((n, x) => n + x.length, 0) });
      upd();
      const offsets = [];
      for (let o = L; o < totalRows; o += L) if (!partial.has(o)) offsets.push(o);
      let next = 0;
      const worker = async () => {
        while (next < offsets.length) {
          const o = offsets[next++];
          partial.set(o, (await hf('rows', { offset: o, length: L })).rows.map(meta));
          upd();
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      const rows = [...partial.keys()].sort((x, y) => x - y).flatMap((k) => partial.get(k));
      await fs.writeFile(catFile, JSON.stringify(rows));
      setIndex(rows);
      partial.clear();
    })()
      .catch((e) => {
        buildErr = e.message;
        throw e;
      })
      .finally(() => (building = null));
    return building;
  }
  const ensureIndex = async () => (await loadIndex()) || (await buildIndex(), index);

  /** Sunucu açılırken: katalog yoksa arka planda indirmeye başla. */
  async function init() {
    if (!(await loadIndex())) buildIndex().catch((e) => console.warn('[tts] katalog indirilemedi:', e.message));
  }

  /** Yerel arama: q = tarif içinde tüm sözcükler (İngilizce), gender = male | female, tag = etiket id'leri (virgülle, hepsi). */
  async function catalog({ offset = 0, length = 24, q = '', gender = '', tag = '' } = {}) {
    offset = Math.max(0, Number(offset) || 0);
    length = Math.min(100, Math.max(1, Number(length) || 24));
    if (gender && !/^(male|female)$/.test(gender)) throw new HttpError(400, 'gender male ya da female olmalı');
    if (!(await loadIndex())) {
      const error = building ? '' : buildErr; // son deneme başarısızdı: yenisini başlat
      buildIndex().catch(() => {});
      return { building: true, progress: { ...progress }, error, total: 0, offset, rows: [] };
    }
    const terms = String(q).toLowerCase().split(/\s+/).filter(Boolean);
    const want = String(tag).split(',').filter(Boolean);
    const { assign } = await tagsLoad();
    const hits = index.filter((v) => {
      if (gender && v.gender !== gender) return false;
      if (want.length && !want.every((t) => assign[v.id]?.includes(t))) return false;
      const hay = `${v.description} ${v.id}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    return { total: hits.length, offset, rows: hits.slice(offset, offset + length).map((v) => ({ ...v, tags: assign[v.id] || [] })) };
  }

  /** Referans kaydı data/voices-cache/ altına indirir (ilk istekte), yolunu döner. */
  const inflight = new Map();
  async function cacheRef(id) {
    if (!ID_RE.test(id)) throw new HttpError(400, `Geçersiz ses id: ${id}`);
    const f = path.join(cacheDir, `${id}.flac`);
    if (fssync.existsSync(f)) return f;
    if (!inflight.has(id)) {
      inflight.set(
        id,
        (async () => {
          await ensureIndex();
          const m = byId.get(id);
          if (!m) throw new HttpError(404, `Ses bulunamadı: ${id}`);
          const url = (await hf('rows', { offset: m.i, length: 1 })).rows[0]?.row.reference_audio?.[0]?.src;
          const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
          if (!res.ok) throw new HttpError(502, `Referans kayıt indirilemedi (${res.status})`);
          await fs.mkdir(cacheDir, { recursive: true });
          await fs.writeFile(f, Buffer.from(await res.arrayBuffer()));
        })().finally(() => inflight.delete(id)),
      );
    }
    await inflight.get(id);
    return f;
  }

  // --------------------------------------------------------------- etiketler
  // data/voice-tags.json: { tags: [{id, name, color}], assign: { <sesId>: [etiketId] } }. Katalog yenilense de korunur.
  const tagFile = path.join(dataDir, 'voice-tags.json');
  let tagData = null;
  async function tagsLoad() {
    if (tagData) return tagData;
    try {
      tagData = JSON.parse(await fs.readFile(tagFile, 'utf8'));
    } catch {
      tagData = { tags: [], assign: {} };
    }
    return tagData;
  }
  const tagsSave = () => fs.writeFile(tagFile, JSON.stringify(tagData, null, 2) + '\n');
  const slug = (n) =>
    String(n).trim().toLocaleLowerCase('tr')
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

  async function listTags() {
    const d = await tagsLoad();
    const count = {};
    for (const ids of Object.values(d.assign)) for (const t of ids) count[t] = (count[t] || 0) + 1;
    return d.tags.map((t) => ({ ...t, count: count[t.id] || 0 }));
  }
  async function createTag({ name, color } = {}) {
    const d = await tagsLoad();
    const ad = String(name || '').trim();
    if (!ad) throw new HttpError(400, 'Etiket adı boş olamaz');
    const id = slug(ad);
    if (!id) throw new HttpError(400, 'Etiket adı harf ya da rakam içermeli');
    if (d.tags.some((t) => t.id === id || t.name.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'))) throw new HttpError(409, `"${ad}" etiketi zaten var`);
    if (color && !COLOR_RE.test(color)) throw new HttpError(400, 'Renk #rrggbb olmalı');
    const tag = { id, name: ad, color: color || '#ea7a3b' };
    d.tags.push(tag);
    await tagsSave();
    return { ...tag, count: 0 };
  }
  async function updateTag(id, { name, color } = {}) {
    const d = await tagsLoad();
    const t = d.tags.find((x) => x.id === id);
    if (!t) throw new HttpError(404, `Etiket yok: ${id}`);
    if (name !== undefined) {
      const ad = String(name).trim();
      if (!ad) throw new HttpError(400, 'Etiket adı boş olamaz');
      if (d.tags.some((x) => x.id !== id && x.name.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'))) throw new HttpError(409, `"${ad}" etiketi zaten var`);
      t.name = ad; // id sabit kalır (atamalar ve betikler bozulmaz)
    }
    if (color !== undefined) {
      if (!COLOR_RE.test(color)) throw new HttpError(400, 'Renk #rrggbb olmalı');
      t.color = color;
    }
    await tagsSave();
    return t;
  }
  async function deleteTag(id) {
    const d = await tagsLoad();
    if (!d.tags.some((x) => x.id === id)) throw new HttpError(404, `Etiket yok: ${id}`);
    d.tags = d.tags.filter((x) => x.id !== id);
    for (const [v, ids] of Object.entries(d.assign)) {
      d.assign[v] = ids.filter((t) => t !== id);
      if (!d.assign[v].length) delete d.assign[v];
    }
    await tagsSave();
  }
  // Tariflerden (İngilizce) hazır etiket önerileri. Yalnızca ekler; elle verdiğin etiketlere dokunmaz.
  const OTO = [
    ['Genç', '#4cc9f0', /young adult/],
    ['Orta yaş', '#8ecae6', /thirties|forties/],
    ['Olgun', '#b08968', /fifties|sixties/],
    ['Yaşlı', '#9d8189', /elderly/],
    ['Kalın ses', '#6d597a', /deep|low-pitched|medium-low/],
    ['İnce ses', '#ff99c8', /high-pitched|medium-high/],
    ['Sıcak', '#f4a261', /warm|velvety|mellow|rich/],
    ['Sakin', '#90be6d', /calm|relaxed|soft-spoken|gentle|reassuring/],
    ['Enerjik', '#ffb703', /energetic|lively|animated|cheerful|enthusiastic|playful/],
    ['Ciddi', '#577590', /authoritative|serious|matter-of-fact/],
    ['Hızlı tempo', '#e76f51', /brisk|fast/],
    ['Yavaş tempo', '#2a9d8f', /slow pace|slow\b/],
    ['Anlatıcı', '#ea7a3b', /narrator/],
    ['Sunucu', '#e5484d', /\bhost\b|presenter|radio|news/],
    ['Müşteri hizmetleri', '#6cc28a', /customer service|receptionist|agent|sales|consultant/],
    ['Öğretmen', '#f2c14e', /teacher/],
  ];
  /** Hazır etiketleri oluşturur ve tariflere göre seslere atar (mevcut etiket/atamalar korunur). */
  async function autoTag() {
    await ensureIndex();
    const d = await tagsLoad();
    const ids = {};
    for (const [name, color] of OTO) {
      let t = d.tags.find((x) => x.id === slug(name));
      if (!t) d.tags.push((t = { id: slug(name), name, color }));
      ids[name] = t.id;
    }
    let added = 0;
    for (const v of index) {
      const low = v.description.toLowerCase();
      for (const [name, , re] of OTO) {
        if (!re.test(low)) continue;
        const cur = (d.assign[v.id] ||= []);
        if (!cur.includes(ids[name])) (cur.push(ids[name]), added++);
      }
    }
    await tagsSave();
    return { tags: OTO.length, added };
  }
  /** Bir sesin etiketlerini topluca ayarlar. */
  async function setVoiceTags(voiceId, ids) {
    if (!ID_RE.test(voiceId)) throw new HttpError(400, `Geçersiz ses id: ${voiceId}`);
    if (!Array.isArray(ids)) throw new HttpError(400, 'tags bir dizi olmalı');
    await ensureIndex();
    if (!byId.has(voiceId)) throw new HttpError(404, `Ses bulunamadı: ${voiceId}`);
    const d = await tagsLoad();
    const bilinen = new Set(d.tags.map((t) => t.id));
    const yeni = [...new Set(ids)].filter((t) => bilinen.has(t));
    if (yeni.length) d.assign[voiceId] = yeni;
    else delete d.assign[voiceId];
    await tagsSave();
    return yeni;
  }
  /** Etiket adı ya da id'si → etiket. */
  async function findTag(nameOrId) {
    const d = await tagsLoad();
    const k = String(nameOrId).trim().toLocaleLowerCase('tr');
    return d.tags.find((t) => t.id === k || t.id === slug(k) || t.name.toLocaleLowerCase('tr') === k) || null;
  }
  /** Etiket(ler)e (virgülle; hepsini taşıyan) ve isteğe bağlı cinsiyete uyan sesler: kayıtlılar önce, sonra id sırasıyla. */
  async function byTag(namesOrIds, { gender = '' } = {}) {
    const ids = [];
    for (const n of String(namesOrIds).split(',').map((x) => x.trim()).filter(Boolean)) {
      const t = await findTag(n);
      if (!t) throw new HttpError(404, `Etiket yok: ${n}`);
      ids.push(t.id);
    }
    if (!ids.length) throw new HttpError(400, 'Etiket verilmedi');
    await ensureIndex();
    const { assign } = await tagsLoad();
    const kayitli = new Set((await saved()).map((v) => v.id));
    return index
      .filter((v) => ids.every((t) => assign[v.id]?.includes(t)) && (!gender || v.gender === gender))
      .sort((a, b) => kayitli.has(b.id) - kayitli.has(a.id) || a.id.localeCompare(b.id))
      .map((v) => ({ ...v, tags: assign[v.id], saved: kayitli.has(v.id) }));
  }
  // ------------------------------------------------------- kayıtlı sesler
  const metaFile = (id) => path.join(voicesDir, `${id}.json`);

  async function saved() {
    let files = [];
    try {
      files = (await fs.readdir(voicesDir)).filter((f) => f.endsWith('.json'));
    } catch { /* klasör yok */ }
    const out = [];
    for (const f of files) {
      try {
        out.push(JSON.parse(await fs.readFile(path.join(voicesDir, f), 'utf8')));
      } catch { /* bozuk kayıt */ }
    }
    const { assign } = await tagsLoad();
    return out.map((v) => ({ ...v, tags: assign[v.id] || [] })).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr'));
  }

  /** Sesi kayıtlılara ekler (ya da adını günceller); referans kaydı da önbelleğe indirir. */
  async function save(id, name) {
    if (!ID_RE.test(id)) throw new HttpError(400, `Geçersiz ses id: ${id}`);
    await ensureIndex();
    const m = byId.get(id);
    if (!m) throw new HttpError(404, `Ses bulunamadı: ${id}`);
    await cacheRef(id);
    await fs.mkdir(voicesDir, { recursive: true });
    let cur = {};
    try {
      cur = JSON.parse(await fs.readFile(metaFile(id), 'utf8'));
    } catch { /* yeni */ }
    const out = { id, name: name !== undefined ? String(name).trim() : cur.name || '', gender: m.gender, description: m.description, referenceText: m.referenceText };
    await fs.writeFile(metaFile(id), JSON.stringify(out, null, 2) + '\n');
    return out;
  }

  async function remove(id) {
    if (!ID_RE.test(id)) throw new HttpError(400, `Geçersiz ses id: ${id}`);
    await fs.rm(metaFile(id), { force: true });
  }

  /** id ya da verdiğin ad → kayıtlı ses (yoksa katalogdan bulur). */
  async function resolve(idOrName) {
    const s = await saved();
    const hit = s.find((v) => v.id === idOrName || (v.name && v.name.toLowerCase() === String(idOrName).toLowerCase()));
    const id = hit?.id || idOrName;
    if (!hit) {
      await ensureIndex();
      if (!byId.has(id)) throw new HttpError(404, `Ses bulunamadı: ${idOrName}`);
    }
    return { ...(hit || byId.get(id)), ref: await cacheRef(id) };
  }

  // ---------------------------------------------------------------- motor
  let child = null;
  let starting = null;
  let spawned = false;
  let lastErr = '';

  async function healthy() {
    try {
      return (await fetch(`${BASE}/saglik`, { signal: AbortSignal.timeout(1500) })).ok;
    } catch {
      return false;
    }
  }

  async function status() {
    return { running: await healthy(), starting: !!starting, installed: fssync.existsSync(py), catalog: { ready: !!index, building: !!building, ...progress } };
  }

  function ensureWorker() {
    if (starting) return starting;
    starting = (async () => {
      if (await healthy()) return;
      if (!fssync.existsSync(py)) throw new HttpError(500, 'tts/.venv kurulu değil (docs/ai-workflow.md → Yerel seslendirme).');
      lastErr = '';
      child = spawn(py, [script, '--port', String(PORT)], {
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', TQDM_DISABLE: '1' },
        windowsHide: true,
      });
      spawned = true;
      child.stderr.on('data', (d) => (lastErr = (lastErr + d).slice(-3000)));
      child.on('exit', () => (child = null));
      const t0 = Date.now();
      while (Date.now() - t0 < 300000) {
        if (!child) throw new HttpError(500, `TTS motoru kapandı:\n${lastErr.split('\n').slice(-8).join('\n')}`);
        if (await healthy()) return;
        await new Promise((r) => setTimeout(r, 1000));
      }
      stop();
      throw new HttpError(504, 'TTS motoru 5 dakikada hazır olmadı.');
    })().finally(() => (starting = null));
    return starting;
  }

  /** Yalnızca bu süreçte başlatılan motoru kapatır. */
  function stop() {
    if (!child) return;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
    else child.kill();
    child = null;
  }

  /** text → out (wav). voice = kayıtlı ad ya da katalog id'si (yoksa varsayılan ses). */
  async function synth({ text, voice, out }) {
    if (!text || !String(text).trim()) throw new HttpError(400, 'Metin boş');
    const v = voice ? await resolve(voice) : null;
    await ensureWorker();
    await fs.mkdir(path.dirname(out), { recursive: true });
    const res = await fetch(`${BASE}/uret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text), out, ref: v?.ref }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(500, j.error || `TTS hatası (${res.status})`);
    return { dur: j.dur, voice: v?.id || null };
  }

  /** Dinleme için geçici üretim: data/tts-onizleme/ (1 saatten eskiler silinir). */
  async function preview({ text, voice }) {
    await fs.mkdir(previewDir, { recursive: true });
    for (const f of await fs.readdir(previewDir)) {
      const p = path.join(previewDir, f);
      if (Date.now() - (await fs.stat(p)).mtimeMs > 3600e3) await fs.rm(p, { force: true });
    }
    const file = `${Date.now()}.wav`;
    const r = await synth({ text, voice, out: path.join(previewDir, file) });
    return { ...r, file, url: `/tts-onizleme/${file}` };
  }

  return { init, listTags, createTag, updateTag, deleteTag, autoTag, setVoiceTags, findTag, byTag, catalog, cacheRef, saved, save, remove, resolve, status, ensureWorker, stop, synth, preview, previewDir, spawnedHere: () => spawned };
}
