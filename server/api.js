import express from 'express';
import { HttpError, assertId, slugify } from './store.js';
import { sablonListesi, sablonMeta, uret } from '../scripts/sablonlar/index.mjs';
import { notlariUygula } from '../scripts/ai-notlar.mjs';
import { ayarOku, ayarYaz, ollayaDurum } from '../scripts/kutuphane-ara.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSimulations, simulationRoutes } from './simulations.js';

export function createApi(store, events, fonts, tts, muzik, youtube, onay) {
  const r = express.Router();

  r.get('/events', events.handler);

  // ------------------------------------------------- simülasyonlar (orman-oyunu'ndan aktarılan; arayüz: /simulasyonlar)
  simulationRoutes(r, createSimulations(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')));

  // ------------------------------------------------- temalar / metin stilleri
  r.get('/col/:col', async (req, res) => res.json(await store.colList(req.params.col)));
  r.get('/col/:col/:id', async (req, res) => res.json(await store.colGet(req.params.col, req.params.id)));
  r.post('/col/:col', async (req, res) => res.status(201).json(await store.colCreate(req.params.col, req.body)));
  r.put('/col/:col/:id', async (req, res) => res.json(await store.colUpdate(req.params.col, req.params.id, req.body)));
  r.delete('/col/:col/:id', async (req, res) => {
    await store.colDelete(req.params.col, req.params.id);
    res.status(204).end();
  });

  // ------------------------------------------------------------ ayarlar / Ollaya
  // data/ayarlar.json — ollaya.aktif kapalıysa ya da port yoksa kütüphane araması yalnızca anahtar kelimeyle çalışır.
  const ollayaBilgi = async () => ({ ...ayarOku().ollaya, ...(await ollayaDurum()) });
  r.get('/ollaya', async (_req, res) => res.json(await ollayaBilgi()));
  r.put('/ollaya', async (req, res) => {
    ayarYaz({ ollaya: { aktif: !!req.body?.aktif } });
    res.json(await ollayaBilgi());
  });

  // ------------------------------------------------------- onay kuyruğu
  // Video üretiminde kullanılacak nesne/ses adaylarının kullanıcı onayı (data/onay/<oturum>.json). Arayüz: /onay
  r.get('/onay', async (_req, res) => res.json(await onay.liste()));
  r.post('/onay', async (req, res) => res.status(201).json(await onay.olustur(req.body)));
  r.get('/onay/:id', async (req, res) => res.json(await onay.oku(req.params.id)));
  r.patch('/onay/:id/ogeler/:oge', async (req, res) => res.json(await onay.karar(req.params.id, req.params.oge, req.body || {})));
  r.post('/onay/:id/toplu', async (req, res) => res.json(await onay.topluKarar(req.params.id, req.body || {})));
  r.post('/onay/:id/ogeler/:oge/gorsel', express.raw({ type: () => true, limit: '15mb' }), async (req, res) =>
    res.status(201).json(await onay.gorselEkle(req.params.id, req.params.oge, req.body, req.headers['content-type'])));
  r.delete('/onay/:id/ogeler/:oge/gorsel/:ad', async (req, res) => res.json(await onay.gorselSil(req.params.id, req.params.oge, req.params.ad)));
  r.get('/onay/:id/gorsel/:ad', (req, res) => res.sendFile(onay.gorselYol(req.params.id, req.params.ad)));
  r.post('/onay/:id/arsiv', async (req, res) => res.json(await onay.arsivle(req.params.id, req.body?.arsiv !== false)));

  // -------------------------------------------------------------- şablonlar
  // Brief → sahne: scripts/sablonlar/ üreteçleri (CLI: node scripts/uret.mjs)
  r.get('/templates', (_req, res) => res.json(sablonListesi()));
  r.get('/templates/meta', (_req, res) => res.json(sablonMeta()));
  // Önizleme: sahneyi üretir ama proje oluşturmaz (Şablonlar sayfası)
  r.post('/templates/preview', (req, res) => {
    try {
      res.json(uret(req.body || {}));
    } catch (e) {
      throw new HttpError(400, e.message);
    }
  });
  r.post('/templates/generate', async (req, res) => {
    let out;
    try {
      out = uret(req.body || {});
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    const project = await store.createProject(out.scene);
    await fs.writeFile(path.join(store.projectsDir, project.id, 'brief.json'), JSON.stringify(req.body, null, 2) + '\n');
    if (out.anlatim?.length) await fs.writeFile(path.join(store.projectsDir, project.id, 'anlatim.txt'), out.anlatim.map((a) => `${a.t} | ${a.metin}`).join('\n') + '\n');
    res.status(201).json(project);
  });

  // ------------------------------------------- bileşen etiket sözlüğü (özel değerler)
  // data/bilesen-etiketleri.json = { facetler: { <facet>: { degerler: { <değer>: { ad, es } } } } } — varsayılanların üstüne biner
  const TAXF = path.join(store.projectsDir, '..', 'bilesen-etiketleri.json');
  r.get('/component-tags', async (_req, res) => {
    try {
      res.json(JSON.parse(await fs.readFile(TAXF, 'utf8')));
    } catch {
      res.json({ facetler: {} });
    }
  });
  r.put('/component-tags', async (req, res) => {
    const facetler = req.body?.facetler;
    if (!facetler || typeof facetler !== 'object') throw new HttpError(400, 'facetler nesnesi gerekli');
    await fs.writeFile(TAXF, JSON.stringify({ _not: 'Özel etiket değerleri (varsayılan sözlüğün üstüne biner). Varsayılanlar: web/src/componentTags.js', facetler }, null, 2) + '\n');
    res.json({ facetler });
  });

  // ------------------------------------------- şablon favori / etiketleri
  // data/template-meta.json = { "<hazir|benim>:<id>": { fav: bool, etiketler: [str] } }
  const TMETA = path.join(store.projectsDir, '..', 'template-meta.json');
  const readTmeta = async () => {
    try {
      return JSON.parse(await fs.readFile(TMETA, 'utf8'));
    } catch {
      return {};
    }
  };
  r.get('/template-meta', async (_req, res) => res.json(await readTmeta()));
  r.put('/template-meta', async (req, res) => {
    const { key, fav, etiketler } = req.body || {};
    if (typeof key !== 'string' || !/^(hazir|benim):[\w.-]+$/.test(key)) throw new HttpError(400, 'geçersiz anahtar');
    const all = await readTmeta();
    const cur = all[key] || {};
    if (typeof fav === 'boolean') cur.fav = fav;
    if (Array.isArray(etiketler)) cur.etiketler = [...new Set(etiketler.map((x) => String(x).replace(/^#/, '').trim().toLocaleLowerCase('tr')).filter(Boolean))].slice(0, 20);
    if (!cur.fav && !(cur.etiketler || []).length) delete all[key];
    else all[key] = { fav: !!cur.fav, etiketler: cur.etiketler || [] };
    await fs.writeFile(TMETA, JSON.stringify(all, null, 2) + '\n');
    res.json(all[key] || { fav: false, etiketler: [] });
  });

  // ------------------------------------------- kullanıcı şablonları (projeden)
  // data/templates/<id>.json = { id, ad, aciklama, kaynak, createdAt, scene } — sahnenin tam kopyası
  const TPL = path.join(store.projectsDir, '..', 'templates');
  const tplFile = (id) => path.join(TPL, `${assertId(id, 'şablon id')}.json`);
  const readTpl = async (id) => {
    try {
      return JSON.parse(await fs.readFile(tplFile(id), 'utf8'));
    } catch (e) {
      if (e.status) throw e;
      throw new HttpError(404, `Şablon bulunamadı: ${id}`);
    }
  };
  r.get('/user-templates', async (_req, res) => {
    await fs.mkdir(TPL, { recursive: true });
    const out = [];
    for (const f of await fs.readdir(TPL)) {
      if (!f.endsWith('.json')) continue;
      try {
        out.push(JSON.parse(await fs.readFile(path.join(TPL, f), 'utf8')));
      } catch { /* bozuk dosya atlanır */ }
    }
    res.json(out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
  });
  r.post('/user-templates', async (req, res) => {
    const { projectId, ad, aciklama } = req.body || {};
    const { scene } = await store.getProject(projectId);
    const name = String(ad || scene.name || projectId).trim();
    await fs.mkdir(TPL, { recursive: true });
    let id = slugify(name);
    for (let i = 2; await fs.access(tplFile(id)).then(() => true, () => false); i++) id = `${slugify(name)}-${i}`;
    const doc = { id, ad: name, aciklama: String(aciklama || '').trim(), kaynak: projectId, createdAt: new Date().toISOString(), scene };
    await fs.writeFile(tplFile(id), JSON.stringify(doc, null, 2) + '\n');
    res.status(201).json(doc);
  });
  r.patch('/user-templates/:id', async (req, res) => {
    const doc = await readTpl(req.params.id);
    if (typeof req.body?.ad === 'string' && req.body.ad.trim()) doc.ad = req.body.ad.trim();
    if (typeof req.body?.aciklama === 'string') doc.aciklama = req.body.aciklama.trim();
    await fs.writeFile(tplFile(doc.id), JSON.stringify(doc, null, 2) + '\n');
    res.json(doc);
  });
  r.delete('/user-templates/:id', async (req, res) => {
    await readTpl(req.params.id);
    await fs.unlink(tplFile(req.params.id));
    res.status(204).end();
  });

  // ------------------------------------------------------------------ audio
  r.get('/audio', async (_req, res) => res.json(await store.listAudio()));
  r.post('/audio', express.raw({ type: () => true, limit: '200mb' }), async (req, res) =>
    res.status(201).json(await store.saveAudio(req.query.name, req.body)));
  r.delete('/audio/:file', async (req, res) => {
    await store.deleteAudio(req.params.file);
    res.status(204).end();
  });

  // ------------------------------------------------------------------ medya
  r.get('/media', async (_req, res) => res.json(await store.listMedia()));
  r.post('/media', express.raw({ type: () => true, limit: '500mb' }), async (req, res) =>
    res.status(201).json(await store.saveMedia(req.query.name, req.body)));
  r.delete('/media/:file', async (req, res) => {
    await store.deleteMedia(req.params.file);
    res.status(204).end();
  });

  // ------------------------------------------------------------------ fonts
  r.get('/fonts', async (_req, res) => res.json(await fonts.list()));
  r.post('/fonts', async (req, res) => res.status(201).json(await fonts.add(req.body || {})));
  r.patch('/fonts/:family', async (req, res) => res.json(await fonts.update(req.params.family, req.body || {})));
  r.delete('/fonts/:family', async (req, res) => {
    await fonts.remove(req.params.family);
    res.status(204).end();
  });

  // ---------------------------------------------------------------- library
  r.get('/library', async (_req, res) => {
    res.json({
      categories: await store.listCategories(),
      categoryInfo: await store.listCategoryInfo(),
      assets: await store.listAssets(),
    });
  });
  // Kategori / varlık başına adresler: arayüz yalnızca açtığı kategoriyi / modeli yükler
  r.get('/categories', async (_req, res) => res.json(await store.listCategoryInfo()));
  r.get('/categories/:name/assets', async (req, res) => res.json(await store.listAssetsIn(req.params.name)));
  r.get('/library/:category/:id', async (req, res) => res.json(await store.getAssetIn(req.params.category, req.params.id)));
  r.get('/library/:id', async (req, res) => res.json(await store.getAsset(req.params.id)));
  r.post('/library', async (req, res) => res.status(201).json(await store.createAsset(req.body)));
  r.put('/library/:id', async (req, res) => res.json(await store.updateAsset(req.params.id, req.body)));
  r.delete('/library/:id', async (req, res) => {
    await store.deleteAsset(req.params.id);
    res.status(204).end();
  });

  r.post('/categories', async (req, res) => {
    await store.createCategory(req.body?.name);
    res.status(201).json({ name: req.body.name });
  });
  r.patch('/categories/:name', async (req, res) => {
    await store.renameCategory(req.params.name, req.body?.name);
    res.json({ name: req.body.name });
  });
  r.delete('/categories/:name', async (req, res) => {
    await store.deleteCategory(req.params.name);
    res.status(204).end();
  });

  // --------------------------------------------------------------- projects
  r.get('/projects', async (_req, res) => res.json(await store.listProjects()));
  r.get('/projects/:id', async (req, res) => res.json(await store.getProject(req.params.id)));
  r.post('/projects', async (req, res) => res.status(201).json(await store.createProject(req.body)));
  r.put('/projects/:id', async (req, res) => res.json(await store.saveScene(req.params.id, req.body)));
  r.post('/projects/:id/duplicate', async (req, res) =>
    res.status(201).json(await store.duplicateProject(req.params.id, req.body?.name)));
  r.post('/projects/:id/archive', async (req, res) =>
    res.json(await store.setArchived(req.params.id, req.body?.archived !== false)));
  r.delete('/projects/:id', async (req, res) => {
    await store.deleteProject(req.params.id);
    res.status(204).end();
  });

  r.post(
    '/projects/:id/snapshots/:name',
    express.raw({ type: 'image/png', limit: '25mb' }),
    async (req, res) => res.status(201).json(await store.saveSnapshot(req.params.id, req.params.name, req.body)),
  );

  r.post(
    '/projects/:id/renders/:name',
    express.raw({ type: () => true, limit: '1gb' }),
    async (req, res) => res.status(201).json(await store.saveRender(req.params.id, req.params.name, req.body)),
  );

  // ---------------------------------------------------------------- history
  r.get('/projects/:id/history', async (req, res) => res.json(await store.listHistory(req.params.id)));
  r.get('/projects/:id/history/:ts', async (req, res) => res.json(await store.getHistory(req.params.id, req.params.ts)));
  r.post('/projects/:id/history/:ts/restore', async (req, res) =>
    res.json(await store.restoreHistory(req.params.id, req.params.ts)));

  // ------------------------------------------------------------------ notes
  r.get('/projects/:id/notes', async (req, res) => res.json(await store.readNotes(req.params.id)));
  r.post('/projects/:id/notes', async (req, res) =>
    res.status(201).json(await store.addNote(req.params.id, req.body)));
  r.patch('/projects/:id/notes/:noteId', async (req, res) =>
    res.json(await store.updateNote(req.params.id, req.params.noteId, req.body)));
  // Claude API ile açık notları uygula (ANTHROPIC_API_KEY gerekir); sahne değişir, notlar done + cevap olur
  r.post('/projects/:id/notes-apply', async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(400, 'ANTHROPIC_API_KEY tanımlı değil. Sunucuyu anahtarla başlat: $env:ANTHROPIC_API_KEY="…"; npm run dev');
    const { scene } = await store.getProject(req.params.id);
    const open = (await store.readNotes(req.params.id)).filter((n) => n.status !== 'done');
    if (!open.length) throw new HttpError(400, 'Açık not yok.');
    const snapshots = {};
    for (const n of open) {
      try {
        snapshots[n.id] = await fs.readFile(path.join(store.projectsDir, req.params.id, 'snapshots', `${n.id}.png`));
      } catch { /* kare yok */ }
    }
    let out;
    try {
      out = await notlariUygula({ scene, notes: open, snapshots, apiKey: process.env.ANTHROPIC_API_KEY });
    } catch (e) {
      throw new HttpError(502, e.message);
    }
    await store.saveScene(req.params.id, out.scene);
    const applied = [];
    for (const n of open) {
      if (!(n.id in out.replies)) continue;
      await store.updateNote(req.params.id, n.id, { status: 'done', reply: out.replies[n.id] });
      applied.push(n.id);
    }
    res.json({ applied, open: open.length, usage: out.usage });
  });
  r.delete('/projects/:id/notes/:noteId', async (req, res) => {
    await store.deleteNote(req.params.id, req.params.noteId);
    res.status(204).end();
  });

  // -------------------------------------------------------- seslendirme (TTS)
  r.get('/tts/status', async (_req, res) => res.json(await tts.status()));
  r.post('/tts/start', async (_req, res) => {
    await tts.ensureWorker();
    res.json(await tts.status());
  });
  r.get('/tts/voices', async (req, res) => res.json(await tts.catalog(req.query)));
  r.get('/tts/voices/:id/audio', async (req, res) => res.sendFile(await tts.cacheRef(req.params.id)));
  r.get('/tts/tags', async (_req, res) => res.json(await tts.listTags()));
  r.post('/tts/tags', async (req, res) => res.status(201).json(await tts.createTag(req.body)));
  r.post('/tts/tags/auto', async (_req, res) => res.json(await tts.autoTag()));
  r.put('/tts/tags/:id', async (req, res) => res.json(await tts.updateTag(req.params.id, req.body)));
  r.delete('/tts/tags/:id', async (req, res) => {
    await tts.deleteTag(req.params.id);
    res.status(204).end();
  });
  r.put('/tts/voices/:id/tags', async (req, res) => res.json(await tts.setVoiceTags(req.params.id, req.body?.tags)));
  r.get('/tts/saved', async (_req, res) => res.json(await tts.saved()));
  r.put('/tts/saved/:id', async (req, res) => res.json(await tts.save(req.params.id, req.body?.name)));
  r.delete('/tts/saved/:id', async (req, res) => {
    await tts.remove(req.params.id);
    res.status(204).end();
  });
  r.post('/tts/preview', async (req, res) => res.json(await tts.preview(req.body || {})));
  // Dinlenen üretimi data/audio/ altına kalıcı ses olarak kaydet (stüdyoda ve projelerde kullanılır)
  r.post('/tts/keep', async (req, res) => {
    const { file, name } = req.body || {};
    if (!/^\d+\.wav$/.test(file || '')) throw new HttpError(400, 'Geçersiz önizleme dosyası');
    const ad = String(name || '').trim().replace(/\.wav$/i, '');
    if (!/^[\w-]{1,60}$/.test(ad)) throw new HttpError(400, 'Ad harf, rakam, - ve _ içermeli');
    const buf = await fs.readFile(path.join(tts.previewDir, file)).catch(() => {
      throw new HttpError(404, 'Önizleme bulunamadı (1 saatten eski olabilir)');
    });
    res.status(201).json(await store.saveAudio(`${ad}.wav`, buf));
  });

  // ------------------------------------------------------ müzik (ACE-Step)
  r.get('/muzik/status', async (_req, res) => res.json(await muzik.status()));
  r.post('/muzik/start', async (_req, res) => {
    await muzik.ensureWorker();
    res.json(await muzik.status());
  });
  r.post('/muzik/preview', async (req, res) => res.json(await muzik.preview(req.body || {})));
  r.post('/muzik/keep', async (req, res) => {
    const { file, name } = req.body || {};
    if (!/^\d+\.wav$/.test(file || '')) throw new HttpError(400, 'Geçersiz önizleme dosyası');
    const ad = String(name || '').trim().replace(/\.wav$/i, '');
    if (!/^[\w-]{1,60}$/.test(ad)) throw new HttpError(400, 'Ad harf, rakam, - ve _ içermeli');
    const buf = await fs.readFile(path.join(muzik.previewDir, file)).catch(() => {
      throw new HttpError(404, 'Önizleme bulunamadı (1 saatten eski olabilir)');
    });
    res.status(201).json(await store.saveAudio(`${ad}.wav`, buf));
  });

  // ------------------------------------------------------------ YouTube
  r.get('/youtube/status', (_req, res) => res.json(youtube.status()));
  r.put('/youtube/config', (req, res) => res.json(youtube.saveConfig(req.body || {})));
  r.get('/youtube/auth', (_req, res) => res.json(youtube.authUrl()));
  r.get('/youtube/callback', async (req, res) => {
    const page = (msg, ok) => res.status(ok ? 200 : 400).type('html').send(
      `<meta charset="utf-8"><body style="font:16px system-ui;background:#1a1410;color:#eee;display:grid;place-items:center;height:100vh"><div><h2>${ok ? '✓ YouTube bağlandı' : 'Bağlanılamadı'}</h2><p>${msg.replace(/</g, '&lt;')}</p></div>`);
    try {
      await youtube.callback(req.query);
      page("Bu sekmeyi kapatıp Origami Studio'ya dönebilirsin.", true);
    } catch (e) {
      page(e.message, false);
    }
  });
  r.post('/youtube/disconnect', (_req, res) => res.json(youtube.disconnect()));
  r.get('/youtube/jobs', (_req, res) => res.json(youtube.jobs()));
  r.get('/youtube/jobs/:id', (req, res) => {
    const j = youtube.job(req.params.id);
    if (!j) throw new HttpError(404, 'Yükleme işi bulunamadı');
    res.json(j);
  });
  // Render MP4'ünü indir / telefona aktar (Range destekli)
  r.get('/projects/:id/renders/:name', (req, res, next) => {
    assertId(req.params.id);
    const name = path.basename(req.params.name);
    if (!/\.mp4$/i.test(name)) throw new HttpError(400, 'Yalnızca .mp4');
    const full = path.join(store.projectsDir, req.params.id, 'renders', name);
    res.download(full, name, (err) => err && !res.headersSent && next(new HttpError(404, 'Render bulunamadı')));
  });
  r.get('/projects/:id/renders', async (req, res) => res.json(await youtube.listRenders(req.params.id)));
  r.post('/projects/:id/youtube-upload', async (req, res) => res.status(202).json(await youtube.upload(req.params.id, req.body || {})));

  r.use((_req, _res, next) => next(new HttpError(404, 'API yolu bulunamadı')));
  // eslint-disable-next-line no-unused-vars
  r.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Sunucu hatası' });
  });

  return r;
}
