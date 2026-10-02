import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwind from '@tailwindcss/vite';
import fs from 'node:fs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// orman-oyunu simülasyonları (data/simulations/<slug>/kaynak, _ortak, _stub) deponun kendi göreli yollarıyla yazılmıştır.
// Bu eklenti, o dosyalardaki göreli içe aktarmaları aynı sanal depo yoluna göre çözer: önce simülasyonun kendisi,
// sonra _stub (Firebase/GLB gerektirenler), sonra _ortak.
const SIMS = path.join(ROOT, 'data', 'simulations').split(path.sep).join('/');
function simResolver() {
  const EXT = ['', '.js', '.vue', '.json', '/index.js', '/index.vue'];
  return {
    name: 'sim-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return null;
      const imp = importer.split('?')[0].split('\\').join('/');
      const m = imp.startsWith(SIMS + '/') && imp.slice(SIMS.length + 1).match(/^([^/]+)\/(kaynak\/)?(.*)$/);
      if (!m) return null;
      const [, owner, own, repoPath] = m;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(repoPath), source));
      const bases = [...(own ? [`${SIMS}/${owner}/kaynak`] : []), `${SIMS}/_stub`, `${SIMS}/_ortak`];
      for (const b of bases) {
        for (const e of EXT) {
          const f = `${b}/${target}${e}`;
          if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  root: path.join(ROOT, 'web'),
  plugins: [simResolver(), vue(), tailwind()],
  resolve: { alias: { '@': path.join(ROOT, 'web', 'src') } },
  // cloudflared geçici tüneli (telefondan HTTPS ile erişim) için
  server: { allowedHosts: ['.trycloudflare.com'], fs: { allow: [ROOT] } },
  build: {
    outDir: path.join(ROOT, 'web', 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: { main: path.join(ROOT, 'web', 'index.html'), 'sim-onizleme': path.join(ROOT, 'web', 'sim-onizleme.html') } },
  },
});
