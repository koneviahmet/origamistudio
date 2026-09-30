// Yerel müzik üretimi: ACE-Step 1.5 (MIT lisanslı; eğitim verisi lisanslı + telifsiz + sentetik, geliştirici beyanı).
// Motor muzik/ACE-Step-1.5 içindeki `acestep-api` sürecidir (127.0.0.1:8001); gerektiğinde burada başlatılır.
// Hem sunucu (sayfa) hem scripts/muzik.mjs kullanır. Yalnızca enstrümantal müzik üretilir (video fonu).
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HttpError } from './store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.MUZIK_PORT) || 8001;
const BASE = `http://127.0.0.1:${PORT}`;

export function createMuzik(dataDir = path.join(ROOT, 'data')) {
  const previewDir = path.join(dataDir, 'muzik-onizleme');
  const repo = path.join(ROOT, 'muzik', 'ACE-Step-1.5');
  const exe = path.join(repo, '.venv', 'Scripts', 'acestep-api.exe');

  let child = null;
  let starting = null;
  let spawned = false;
  let lastErr = '';

  async function healthy() {
    try {
      return (await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(1500) })).ok;
    } catch {
      return false;
    }
  }
  async function status() {
    return { running: await healthy(), starting: !!starting, installed: fssync.existsSync(exe) };
  }

  function ensureWorker() {
    if (starting) return starting;
    starting = (async () => {
      if (await healthy()) return;
      if (!fssync.existsSync(exe)) throw new HttpError(500, 'muzik/ACE-Step-1.5 kurulu değil (docs/ai-workflow.md → Yerel müzik).');
      lastErr = '';
      child = spawn(exe, [], {
        cwd: repo,
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { ...process.env, ACESTEP_API_PORT: String(PORT), ACESTEP_API_HOST: '127.0.0.1', PYTHONIOENCODING: 'utf-8' },
        windowsHide: true,
      });
      spawned = true;
      child.stderr.on('data', (d) => (lastErr = (lastErr + d).slice(-4000)));
      child.on('exit', () => (child = null));
      const t0 = Date.now();
      while (Date.now() - t0 < 1200000) {
        // ilk çalıştırmada model indirilir: 20 dk'ya kadar bekle
        if (!child) throw new HttpError(500, `Müzik motoru kapandı:\n${lastErr.split('\n').slice(-8).join('\n')}`);
        if (await healthy()) return;
        await new Promise((r) => setTimeout(r, 2000));
      }
      stop();
      throw new HttpError(504, 'Müzik motoru 20 dakikada hazır olmadı.');
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

  /**
   * Enstrümantal müzik üretir ve `out` (wav) dosyasına yazar.
   * prompt = müzik tarifi (İngilizce daha iyi); duration 10–120 sn; bpm/key/seed isteğe bağlı.
   */
  async function generate({ prompt, duration = 30, bpm, key, seed, out }) {
    if (!prompt || !String(prompt).trim()) throw new HttpError(400, 'Müzik tarifi boş');
    duration = Math.min(120, Math.max(10, Number(duration) || 30));
    await ensureWorker();
    const body = {
      prompt: String(prompt),
      lyrics: '[Instrumental]',
      instrumental: true,
      audio_duration: duration,
      audio_format: 'wav',
      batch_size: 1,
      thinking: false,
      use_random_seed: seed === undefined || seed === '',
    };
    if (bpm) body.bpm = Number(bpm);
    if (key) body.key_scale = String(key);
    if (seed !== undefined && seed !== '') body.seed = Number(seed);
    const post = await fetch(`${BASE}/release_task`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const pj = await post.json().catch(() => ({}));
    const taskId = pj?.data?.task_id || pj?.task_id;
    if (!post.ok || !taskId) throw new HttpError(502, `Müzik görevi açılamadı: ${JSON.stringify(pj).slice(0, 300)}`);

    const t0 = Date.now();
    for (;;) {
      if (Date.now() - t0 > 2700000) throw new HttpError(504, 'Müzik üretimi 45 dakikada bitmedi (ilk çalıştırmada model indirme uzun sürebilir; tekrar dene).');
      await new Promise((r) => setTimeout(r, 2000));
      const q = await fetch(`${BASE}/query_result`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id_list: [taskId] }) });
      const qj = await q.json().catch(() => ({}));
      const item = (qj?.data || [])[0];
      if (!item || item.status === 0) continue;
      if (item.status === 2) throw new HttpError(500, `Müzik üretimi başarısız: ${String(item.result).slice(0, 300)}`);
      const r = JSON.parse(item.result)[0];
      if (!r?.file) throw new HttpError(500, 'Müzik sonucu boş döndü');
      const res = await fetch(`${BASE}${r.file}`);
      if (!res.ok) throw new HttpError(502, `Müzik dosyası alınamadı (${res.status})`);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, Buffer.from(await res.arrayBuffer()));
      return { dur: r.metas?.duration ?? duration, bpm: r.metas?.bpm ?? null, key: r.metas?.keyscale ?? null, seed: String(r.seed_value || '').split(',')[0] || null };
    }
  }

  /** Dinleme için geçici üretim: data/muzik-onizleme/ (1 saatten eskiler silinir). */
  async function preview(opts) {
    await fs.mkdir(previewDir, { recursive: true });
    for (const f of await fs.readdir(previewDir)) {
      const p = path.join(previewDir, f);
      if (Date.now() - (await fs.stat(p)).mtimeMs > 3600e3) await fs.rm(p, { force: true });
    }
    const file = `${Date.now()}.wav`;
    const r = await generate({ ...opts, out: path.join(previewDir, file) });
    return { ...r, file, url: `/muzik-onizleme/${file}` };
  }

  return { status, ensureWorker, stop, generate, preview, previewDir, spawnedHere: () => spawned };
}
