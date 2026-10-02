// YouTube'a yükleme: OAuth 2.0 (yerel yönlendirme) + YouTube Data API v3 resumable upload. Ek bağımlılık yok.
// Ayarlar ve token'lar data/youtube.json'da (gitignore'da) tutulur. Kullanıcı bir kez Google Cloud'da OAuth istemcisi oluşturur.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import crypto from 'node:crypto';
import { HttpError, assertId } from './store.js';

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'];
const PRIVACY = ['private', 'unlisted', 'public'];

// Her açıklamanın en altına otomatik eklenen ses veri seti atfı (web/PublishPanel.vue ile aynı metin)
const VOICE_CREDIT = 'Ses Veri Seti: Alania Synthetic Speech TR (CC BY 4.0) - https://huggingface.co/datasets/cloud0day3/alania-synthetic-speech-tr';

export function createYoutube(dataDir, store, events, port) {
  const FILE = path.join(dataDir, 'youtube.json');
  const redirectUri = `http://localhost:${port}/api/youtube/callback`;
  const jobs = new Map();
  const states = new Map();

  const read = () => {
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
      return {};
    }
  };
  const write = (c) => fs.writeFileSync(FILE, JSON.stringify(c, null, 2) + '\n');

  async function post(url, form) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(400, data.error_description || data.error || `Google ${res.status}`);
    return data;
  }

  async function accessToken() {
    const c = read();
    if (!c.tokens?.refresh_token) throw new HttpError(401, 'YouTube hesabı bağlı değil.');
    if (c.tokens.access_token && c.tokens.expiry > Date.now() + 60000) return c.tokens.access_token;
    let t;
    try {
      t = await post('https://oauth2.googleapis.com/token', {
        client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.tokens.refresh_token, grant_type: 'refresh_token',
      });
    } catch (e) {
      throw new HttpError(401, `Oturum yenilenemedi, hesabı yeniden bağla (${e.message})`);
    }
    c.tokens = { ...c.tokens, access_token: t.access_token, expiry: Date.now() + t.expires_in * 1000 };
    write(c);
    return c.tokens.access_token;
  }

  async function channelTitle(token) {
    try {
      const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      return d.items?.[0]?.snippet?.title || '';
    } catch {
      return '';
    }
  }

  function status() {
    const c = read();
    return {
      redirectUri,
      configured: !!(c.clientId && c.clientSecret),
      clientId: c.clientId || '',
      connected: !!c.tokens?.refresh_token,
      channel: c.channel || '',
    };
  }

  function saveConfig({ clientId, clientSecret }) {
    const c = read();
    if (typeof clientId === 'string') c.clientId = clientId.trim();
    if (typeof clientSecret === 'string' && clientSecret.trim()) c.clientSecret = clientSecret.trim();
    if (!c.clientId || !c.clientSecret) throw new HttpError(400, 'İstemci kimliği ve gizli anahtar gerekli.');
    write(c);
    return status();
  }

  function authUrl() {
    const c = read();
    if (!c.clientId || !c.clientSecret) throw new HttpError(400, 'Önce OAuth istemci kimliği ve gizli anahtarı kaydet.');
    const state = crypto.randomBytes(16).toString('hex');
    states.set(state, Date.now());
    for (const [k, t] of states) if (Date.now() - t > 600000) states.delete(k);
    const q = new URLSearchParams({
      client_id: c.clientId, redirect_uri: redirectUri, response_type: 'code', scope: SCOPES.join(' '),
      access_type: 'offline', prompt: 'consent', state,
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` };
  }

  async function callback(query) {
    if (query.error) throw new HttpError(400, `Google: ${query.error}`);
    if (!states.has(query.state)) throw new HttpError(400, 'Geçersiz ya da süresi dolmuş istek (state). Bağlanmayı yeniden başlat.');
    states.delete(query.state);
    const c = read();
    const t = await post('https://oauth2.googleapis.com/token', {
      code: query.code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code',
    });
    if (!t.refresh_token) throw new HttpError(400, 'Google yenileme anahtarı vermedi. myaccount.google.com/permissions üzerinden uygulamayı kaldırıp tekrar dene.');
    c.tokens = { refresh_token: t.refresh_token, access_token: t.access_token, expiry: Date.now() + t.expires_in * 1000 };
    c.channel = await channelTitle(t.access_token);
    write(c);
    events.broadcast({ kind: 'youtube', at: Date.now() });
  }

  function disconnect() {
    const c = read();
    delete c.tokens;
    delete c.channel;
    write(c);
    events.broadcast({ kind: 'youtube', at: Date.now() });
    return status();
  }

  async function listRenders(id) {
    assertId(id);
    const dir = path.join(store.projectsDir, id, 'renders');
    const out = [];
    for (const f of await fsp.readdir(dir).catch(() => [])) {
      if (!/\.mp4$/i.test(f)) continue;
      const st = await fsp.stat(path.join(dir, f));
      out.push({ file: f, size: st.size, at: st.mtime.toISOString() });
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
  }

  const put = (url, headers, file, size, onBytes) => new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'PUT', headers: { ...headers, 'Content-Length': size, 'Content-Type': 'video/mp4' } }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => (res.statusCode < 300 ? resolve(JSON.parse(body || '{}')) : reject(new Error(`YouTube ${res.statusCode}: ${body.slice(0, 300)}`))));
    });
    req.on('error', reject);
    const rs = fs.createReadStream(file);
    rs.on('data', (d) => onBytes(d.length));
    rs.on('error', reject);
    rs.pipe(req);
  });

  async function run(job, file, size, meta) {
    const update = (p) => {
      Object.assign(job, p);
      events.broadcast({ kind: 'youtube-job', job: { ...job }, at: Date.now() });
    };
    try {
      const token = await accessToken();
      const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify(meta),
      });
      if (!init.ok) {
        const d = await init.json().catch(() => ({}));
        throw new Error(d.error?.message || `YouTube ${init.status}`);
      }
      const loc = init.headers.get('location');
      update({ status: 'uploading' });
      let sent = 0;
      let last = 0;
      const v = await put(loc, {}, file, size, (n) => {
        sent += n;
        if (Date.now() - last > 400) {
          last = Date.now();
          update({ sent });
        }
      });
      update({ status: 'done', sent: size, videoId: v.id, url: `https://youtu.be/${v.id}`, studioUrl: `https://studio.youtube.com/video/${v.id}/edit` });
    } catch (e) {
      update({ status: 'error', error: e.message });
    }
  }

  async function upload(projectId, { file, privacy, title, description, tags, madeForKids, shorts }) {
    assertId(projectId);
    const safe = path.basename(String(file || ''));
    if (!/\.mp4$/i.test(safe)) throw new HttpError(400, 'Yüklenecek .mp4 dosyası seçilmeli.');
    const full = path.join(store.projectsDir, projectId, 'renders', safe);
    const st = await fsp.stat(full).catch(() => { throw new HttpError(404, `Render bulunamadı: ${safe}`); });
    if (!status().connected) throw new HttpError(401, 'YouTube hesabı bağlı değil.');
    if (!PRIVACY.includes(privacy)) throw new HttpError(400, 'Gizlilik: private | unlisted | public');
    const t = String(title || '').trim();
    if (!t) throw new HttpError(400, 'Başlık gerekli.');
    if (t.length > 100) throw new HttpError(400, 'Başlık en fazla 100 karakter.');
    if ([...jobs.values()].some((j) => j.status === 'starting' || j.status === 'uploading')) throw new HttpError(409, 'Devam eden bir yükleme var.');
    let desc = String(description || '');
    if (!desc.includes(VOICE_CREDIT)) desc = `${desc}\n\n${VOICE_CREDIT}`.trim();
    if (shorts && !/#shorts/i.test(desc)) desc = `${desc}\n\n#Shorts`.trim();
    // YouTube etiket alanı toplam 500 karakter; kalanları atla
    const tagList = [];
    let len = 0;
    for (const x of tags || []) {
      const tg = String(x).replace(/^#+/, '').trim();
      if (!tg || len + tg.length + 1 > 480) continue;
      tagList.push(tg);
      len += tg.length + 1;
    }
    const id = crypto.randomBytes(6).toString('hex');
    const job = { id, projectId, file: safe, status: 'starting', sent: 0, total: st.size, title: t, privacy };
    jobs.set(id, job);
    run(job, full, st.size, {
      snippet: { title: t, description: desc, tags: tagList, categoryId: '22', defaultLanguage: 'tr' },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: !!madeForKids },
    });
    return { ...job };
  }

  return { status, saveConfig, authUrl, callback, disconnect, listRenders, upload, job: (id) => jobs.get(id) || null, jobs: () => [...jobs.values()] };
}
