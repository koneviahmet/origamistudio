// data/ klasörünü izler ve değişiklikleri Server-Sent Events ile arayüze yayınlar.
// Böylece Claude scene.json'u diskte düzenlediğinde stüdyo önizlemesi anında yenilenir.
import fs from 'node:fs';
import path from 'node:path';

export function createEvents(dataDir) {
  const clients = new Set();
  const listeners = new Set();
  const timers = new Map();

  function broadcast(evt) {
    for (const fn of listeners) {
      try {
        fn(evt);
      } catch (e) {
        console.warn('[events]', e.message);
      }
    }
    const payload = `data: ${JSON.stringify(evt)}\n\n`;
    for (const res of clients) res.write(payload);
  }

  function classify(rel) {
    const parts = rel.split(/[\\/]/);
    if (parts[0] === 'library') return { kind: 'library' };
    if (parts[0] === 'themes' || parts[0] === 'textstyles' || parts[0] === 'components' || parts[0] === 'characters') return { kind: 'design', col: parts[0] };
    if (parts[0] === 'bilesen-etiketleri.json') return { kind: 'design', col: 'components' };
    if (parts[0] === 'fonts' && parts[1] === 'fonts.json') return { kind: 'fonts' };
    if (parts[0] === 'audio') return { kind: 'audio' };
    if (parts[0] === 'media') return { kind: 'media' };
    if (parts[0] === 'projects' && parts[1]) {
      if (parts[2] === 'scene.json') return { kind: 'scene', id: parts[1] };
      if (parts[2] === 'notes.json') return { kind: 'notes', id: parts[1] };
      if (parts.length <= 2) return { kind: 'projects' };
    }
    return null;
  }

  try {
    fs.watch(dataDir, { recursive: true }, (_type, filename) => {
      if (!filename || filename.endsWith('.tmp')) return;
      const evt = classify(filename);
      if (!evt) return;
      const key = `${evt.kind}:${evt.id || ''}`;
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => {
        timers.delete(key);
        broadcast({ ...evt, at: Date.now() });
      }, 120));
    });
  } catch (e) {
    console.warn('[events] dosya izleme başlatılamadı:', e.message);
  }

  setInterval(() => {
    for (const res of clients) res.write(': ping\n\n');
  }, 25000).unref();

  function handler(req, res) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write('retry: 2000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
  }

  return { handler, broadcast, on: (fn) => listeners.add(fn), dir: path.resolve(dataDir) };
}
