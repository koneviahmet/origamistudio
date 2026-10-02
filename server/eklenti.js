// Chrome eklentisi (chrome-eklenti/) için yardımcı API: proje listesi + platforma hazır yayın metinleri + MP4 üretim işi.
//   GET  /api/ext/ping
//   GET  /api/ext/projects[?arsiv=1]       → projeler (publish, hazır YouTube / Facebook metinleri, mevcut MP4'ler)
//   POST /api/ext/projects/:id/render      → scripts/render.mjs'i arka planda başlatır (yalnızca kullanıcı eklentiden isterse)
//   GET  /api/ext/render-jobs              → üretim işlerinin durumu
// CORS gerekmez: eklenti sayfaları / arka plan betiği host_permissions ile doğrudan istek atar.
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HttpError, assertId } from './store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// web/PublishPanel.vue ve server/youtube.js ile aynı metin
const VOICE_CREDIT = 'Ses Veri Seti: Alania Synthetic Speech TR (CC BY 4.0) - https://huggingface.co/datasets/cloud0day3/alania-synthetic-speech-tr';

// "yapay zekâ" → "#yapayzekâ" (boşluklu etiket platformlarda tek etiket olmaz)
const hash = (list) => list.map((t) => `#${String(t).replace(/^#+/, '').replace(/[^\p{L}\p{N}_]+/gu, '')}`).filter((h) => h.length > 1).join(' ');

export function yayinMetinleri(pub = {}) {
  const t = String(pub.title || '').trim();
  const d = String(pub.description || '').trim();
  const tags = (pub.tags || []).map((x) => String(x).replace(/^#+/, '').trim()).filter(Boolean);
  // YouTube etiket alanı toplam 500 karakter
  const ytTags = [];
  let len = 0;
  for (const tg of tags) {
    if (len + tg.length + 1 > 480) continue;
    ytTags.push(tg);
    len += tg.length + 1;
  }
  return {
    youtube: {
      baslik: t.slice(0, 100),
      aciklama: [d, tags.length ? hash(tags.slice(0, 3)) : '', VOICE_CREDIT].filter(Boolean).join('\n\n'),
      etiketler: ytTags,
    },
    facebook: {
      aciklama: [t, d, VOICE_CREDIT, tags.length ? hash(tags.slice(0, 15)) : ''].filter(Boolean).join('\n\n'),
    },
  };
}

export function createEklenti(store, events, port) {
  const jobs = new Map();
  const publishCache = new Map();

  async function publishOf(id) {
    const f = path.join(store.projectsDir, id, 'scene.json');
    const st = await fsp.stat(f);
    const key = `${st.mtimeMs}:${st.size}`;
    const hit = publishCache.get(id);
    if (hit?.key === key) return hit.publish;
    const scene = JSON.parse(await fsp.readFile(f, 'utf8'));
    const publish = scene.publish || null;
    publishCache.set(id, { key, publish });
    return publish;
  }

  async function renders(id) {
    const dir = path.join(store.projectsDir, id, 'renders');
    const out = [];
    for (const f of await fsp.readdir(dir).catch(() => [])) {
      if (!/\.mp4$/i.test(f)) continue;
      const st = await fsp.stat(path.join(dir, f));
      out.push({ file: f, size: st.size, at: st.mtime.toISOString() });
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
  }

  async function projects({ arsiv = false } = {}) {
    const list = await store.listProjects();
    const out = await Promise.all(
      list.filter((p) => arsiv || !p.archived).map(async (p) => {
        const publish = await publishOf(p.id).catch(() => null);
        return {
          id: p.id,
          name: p.name,
          width: p.width,
          height: p.height,
          duration: p.duration,
          updatedAt: p.updatedAt,
          archived: p.archived,
          publish,
          yayin: yayinMetinleri(publish || { title: p.name }),
          renders: await renders(p.id),
        };
      }),
    );
    return out;
  }

  function startRender(id) {
    assertId(id);
    if ([...jobs.values()].some((j) => j.status === 'running')) throw new HttpError(409, 'Devam eden bir MP4 üretimi var.');
    const job = { id: crypto.randomBytes(5).toString('hex'), projectId: id, status: 'running', progress: 0, startedAt: Date.now(), log: '' };
    jobs.set(job.id, job);
    const update = (p) => {
      Object.assign(job, p);
      events.broadcast({ kind: 'ext-render', job: { ...job }, at: Date.now() });
    };
    const child = spawn(process.execPath, ['scripts/render.mjs', id, '--port', String(port)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    const onData = (buf) => {
      const text = buf.toString();
      job.log = (job.log + text).slice(-2000);
      const m = [...text.matchAll(/%(\d+)/g)].pop();
      if (m) update({ progress: Math.min(1, Number(m[1]) / 100) });
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (e) => update({ status: 'error', error: e.message }));
    child.on('close', (code) => {
      if (job.status !== 'running') return;
      if (code === 0) update({ status: 'done', progress: 1, finishedAt: Date.now() });
      else update({ status: 'error', error: job.log.trim().split(/[\r\n]+/).pop() || `Çıkış kodu ${code}`, finishedAt: Date.now() });
    });
    return { ...job };
  }

  function routes(r) {
    r.get('/ext/ping', (_req, res) => res.json({ ok: true, app: 'origami-studio', port }));
    r.get('/ext/projects', async (req, res) => res.json(await projects({ arsiv: req.query.arsiv === '1' })));
    r.post('/ext/projects/:id/render', (req, res) => res.status(202).json(startRender(req.params.id)));
    r.get('/ext/render-jobs', (_req, res) => res.json([...jobs.values()]));
  }

  return { routes, projects, startRender };
}
