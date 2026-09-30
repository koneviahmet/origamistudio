import express from 'express';
import { HttpError } from './store.js';

export function createApi(store, events, fonts) {
  const r = express.Router();

  r.get('/events', events.handler);

  // ------------------------------------------------- temalar / metin stilleri
  r.get('/col/:col', async (req, res) => res.json(await store.colList(req.params.col)));
  r.get('/col/:col/:id', async (req, res) => res.json(await store.colGet(req.params.col, req.params.id)));
  r.post('/col/:col', async (req, res) => res.status(201).json(await store.colCreate(req.params.col, req.body)));
  r.put('/col/:col/:id', async (req, res) => res.json(await store.colUpdate(req.params.col, req.params.id, req.body)));
  r.delete('/col/:col/:id', async (req, res) => {
    await store.colDelete(req.params.col, req.params.id);
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
    res.json({ categories: await store.listCategories(), assets: await store.listAssets() });
  });
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
  r.delete('/projects/:id', async (req, res) => {
    await store.deleteProject(req.params.id);
    res.status(204).end();
  });

  r.post(
    '/projects/:id/snapshots/:name',
    express.raw({ type: 'image/png', limit: '25mb' }),
    async (req, res) => res.status(201).json(await store.saveSnapshot(req.params.id, req.params.name, req.body)),
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
  r.delete('/projects/:id/notes/:noteId', async (req, res) => {
    await store.deleteNote(req.params.id, req.params.noteId);
    res.status(204).end();
  });

  r.use((_req, _res, next) => next(new HttpError(404, 'API yolu bulunamadı')));
  // eslint-disable-next-line no-unused-vars
  r.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Sunucu hatası' });
  });

  return r;
}
