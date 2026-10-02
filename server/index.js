import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createStore } from './store.js';
import { createEvents } from './events.js';
import { createApi } from './api.js';
import { createFonts } from './fonts.js';
import { createTts } from './tts.js';
import { createMuzik } from './muzik.js';
import { createYoutube } from './youtube.js';
import { createOnay } from './onay.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const PROD = process.argv.includes('--prod');
const PORT = Number(process.env.PORT) || 5180;
// --lan: yerel ağdaki cihazlardan (telefon) erişim. Varsayılan yalnızca bu bilgisayar.
const LAN = process.argv.includes('--lan') || process.env.LAN === '1';

const store = createStore(DATA);
await store.init();
const events = createEvents(DATA);
const fonts = createFonts(DATA);
const tts = createTts(DATA);
tts.init();
const muzik = createMuzik(DATA);
const youtube = createYoutube(DATA, store, events, PORT);
const onay = createOnay(DATA);

// Sürüm geçmişi: scene.json her değiştiğinde (stüdyo ya da disk) sürüm al
events.on((evt) => {
  if (evt.kind === 'scene') store.snapshotScene(evt.id).then((ts) => ts && events.broadcast({ kind: 'history', id: evt.id, ts })).catch((e) => console.warn(`[geçmiş] ${evt.id}: ${e.message}`));
});
store.baselineHistory().catch((e) => console.warn('[history]', e.message));

const app = express();
const server = http.createServer(app);
app.use(express.json({ limit: '25mb' }));
app.use('/api', createApi(store, events, fonts, tts, muzik, youtube, onay));
app.use('/font-files', express.static(fonts.dir, { maxAge: '30d', immutable: true }));
app.use('/audio-files', express.static(store.audioDir));
app.use('/media-files', express.static(store.mediaDir));
app.use('/tts-onizleme', express.static(tts.previewDir));
app.use('/muzik-onizleme', express.static(muzik.previewDir));

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

server.listen(PORT, LAN ? '0.0.0.0' : undefined, () => {
  console.log(`\n  Origami Studio  →  http://localhost:${PORT}`);
  if (LAN) {
    const ips = Object.values(os.networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n.address);
    for (const ip of ips) console.log(`  Telefondan      →  http://${ip}:${PORT}`);
    console.log('  (Yerel ağdaki herkes erişebilir; yalnızca güvendiğin ağda kullan.)');
  }
  console.log();
});

for (const sig of ['SIGINT', 'SIGTERM', 'exit']) process.on(sig, () => { tts.stop(); muzik.stop(); if (sig !== 'exit') process.exit(0); });
