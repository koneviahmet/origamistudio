import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createStore } from './store.js';
import { createEvents } from './events.js';
import { createApi } from './api.js';
import { createFonts } from './fonts.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const PROD = process.argv.includes('--prod');
const PORT = Number(process.env.PORT) || 5180;

const store = createStore(DATA);
await store.init();
const events = createEvents(DATA);
const fonts = createFonts(DATA);

// Sürüm geçmişi: scene.json her değiştiğinde (stüdyo ya da disk) sürüm al
events.on((evt) => {
  if (evt.kind === 'scene') store.snapshotScene(evt.id).then((ts) => ts && events.broadcast({ kind: 'history', id: evt.id, ts }));
});
store.baselineHistory().catch((e) => console.warn('[history]', e.message));

const app = express();
const server = http.createServer(app);
app.use(express.json({ limit: '25mb' }));
app.use('/api', createApi(store, events, fonts));
app.use('/font-files', express.static(fonts.dir, { maxAge: '30d', immutable: true }));
app.use('/audio-files', express.static(store.audioDir));

if (PROD) {
  const dist = path.join(ROOT, 'web', 'dist');
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: path.join(ROOT, 'vite.config.js'),
    server: { middlewareMode: true, hmr: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

server.listen(PORT, () => {
  console.log(`\n  Origami Studio  →  http://localhost:${PORT}\n`);
});
