// Sunucu tarafı render (başsız tarayıcı): stüdyoyu açmadan, arka planda MP4 üretir.
//   node scripts/render.mjs <proje-id> [--format <id>] [--hepsi] [--olcek 1] [--from 0] [--to 8]
//                           [--sessiz] [--cikti <klasör>] [--tarayici <exe>] [--port 5180]
// Yöntem: aynı `renderFrame` + WebCodecs kodlayıcı, başsız Edge/Chrome içinde (web/src/views/RenderView.vue) çalışır;
// çıktı data/projects/<id>/renders/<ad>.mp4 olarak sunucuya kaydedilir (önizleme ile birebir aynı kareler).
// Sunucu çalışmıyorsa kendisi geçici olarak başlatır. Toplu üretim için: --hepsi (ana format + tüm scene.formats).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const VALUE_OPTS = new Set(['format', 'olcek', 'from', 'to', 'cikti', 'tarayici', 'port']);
const id = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && VALUE_OPTS.has(argv[i - 1].slice(2))));
if (!id) {
  console.log('Kullanım: node scripts/render.mjs <proje-id> [--format <id> | --hepsi] [--olcek 1] [--from s] [--to s] [--sessiz] [--cikti <klasör>]');
  process.exit(1);
}

const BROWSERS = [
  process.env.BROWSER,
  opt('tarayici'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) {
  console.error('Chrome / Edge bulunamadı. --tarayici <yol> ile belirt.');
  process.exit(1);
}

async function alive(base) {
  try {
    return (await fetch(`${base}/api/projects`)).ok;
  } catch {
    return false;
  }
}

let child = null;
let base = `http://localhost:${opt('port', 5180)}`;
if (!(await alive(base))) {
  const port = 5199;
  base = `http://localhost:${port}`;
  console.log(`Sunucu çalışmıyor; geçici olarak başlatılıyor (${base})…`);
  child = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  for (let i = 0; i < 60 && !(await alive(base)); i++) await new Promise((r) => setTimeout(r, 500));
  if (!(await alive(base))) {
    child.kill();
    console.error('Sunucu başlatılamadı.');
    process.exit(1);
  }
}

const proj = await (await fetch(`${base}/api/projects/${id}`)).json();
if (!proj.scene) {
  console.error(`Proje bulunamadı: ${id}`);
  child?.kill();
  process.exit(1);
}
const scene = proj.scene;
const jobs = flag('hepsi') ? [null, ...(scene.formats || []).map((f) => f.id)] : [opt('format', null)];

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1280,800'],
});
let failed = 0;
try {
  for (const fmt of jobs) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('  [sayfa hatası]', e.message));
    const q = new URLSearchParams();
    if (fmt) q.set('format', fmt);
    q.set('scale', opt('olcek', '1'));
    if (opt('from')) q.set('from', opt('from'));
    if (opt('to')) q.set('to', opt('to'));
    if (flag('sessiz')) q.set('audio', '0');
    q.set('name', `${id}${fmt ? `-${fmt}` : ''}`);
    const label = fmt || 'ana format';
    console.log(`▶ ${label} render ediliyor…`);
    const t0 = Date.now();
    await page.goto(`${base}/render/${encodeURIComponent(id)}?${q}`);
    let last = -1;
    for (;;) {
      const st = await page.evaluate(() => window.__render || null);
      if (st?.state === 'done') {
        const mb = (st.size / 1048576).toFixed(1);
        console.log(`  ✓ ${st.file} — ${mb} MB, ${((Date.now() - t0) / 1000).toFixed(1)} sn${st.warning ? `  (uyarı: ${st.warning})` : ''}`);
        let out = st.path;
        if (opt('cikti')) {
          fs.mkdirSync(opt('cikti'), { recursive: true });
          out = path.join(opt('cikti'), st.file);
          fs.copyFileSync(path.resolve(ROOT, st.path), out);
        }
        console.log(`    ${out}`);
        break;
      }
      if (st?.state === 'error') {
        console.error(`  ✗ hata: ${st.error}`);
        failed++;
        break;
      }
      if (st?.state === 'running') {
        const pct = Math.floor((st.progress || 0) * 10) * 10;
        if (pct !== last) {
          last = pct;
          process.stdout.write(`  %${pct}\r`);
        }
      }
      if (Date.now() - t0 > 30 * 60 * 1000) {
        console.error('  ✗ zaman aşımı (30 dk)');
        failed++;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    await page.close();
  }
} finally {
  await browser.close();
  child?.kill();
}
process.exit(failed ? 1 : 0);
