import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(ROOT, 'web'),
  plugins: [vue()],
  resolve: { alias: { '@': path.join(ROOT, 'web', 'src') } },
  build: { outDir: path.join(ROOT, 'web', 'dist'), emptyOutDir: true },
});
