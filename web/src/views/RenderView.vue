<script setup>
// Başsız (headless) render sayfası: scripts/render.mjs bu sayfayı açar, video burada üretilir ve sunucuya yüklenir.
//   /render/<proje>?format=<id>&scale=1&name=<dosya>&from=0&to=8
// Durum window.__render içinde: { state: 'loading'|'running'|'done'|'error', progress, file, error }
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';
import { loadResources, resources } from '../resources.js';
import { ensureSceneFonts } from '../fonts.js';
import { exportMp4 } from '../export/mp4.js';
import { renderMix } from '../audio.js';

const route = useRoute();
const status = ref('hazırlanıyor…');
const st = (window.__render = { state: 'loading', progress: 0 });

onMounted(async () => {
  try {
    await loadResources();
    const id = route.params.id;
    const q = route.query;
    const { scene } = await api.project(id);
    await ensureSceneFonts(scene, resources.value);
    const format = q.format ? (scene.formats || []).find((f) => f.id === q.format) : null;
    if (q.format && !format) throw new Error(`Format bulunamadı: ${q.format}`);
    const from = q.from != null ? Number(q.from) : 0;
    const to = q.to != null ? Number(q.to) : scene.duration;
    st.state = 'running';
    status.value = 'ses karıştırılıyor…';
    const audioBuffer = q.audio === '0' ? null : await renderMix(scene, from, to);
    status.value = 'video kodlanıyor…';
    const blob = await exportMp4(scene, resources.value, {
      audioBuffer, format, scale: Number(q.scale) || 1, from, to,
      onProgress: (p) => {
        st.progress = p;
        status.value = `video kodlanıyor… %${Math.round(p * 100)}`;
      },
      onWarning: (m) => (st.warning = m),
    });
    status.value = 'yükleniyor…';
    const name = q.name || `${id}${format ? `-${format.id}` : ''}`;
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/renders/${encodeURIComponent(name)}`, { method: 'POST', body: blob });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    st.file = data.file;
    st.size = data.size;
    st.path = data.path;
    st.state = 'done';
    status.value = `bitti: ${data.file}`;
  } catch (e) {
    st.state = 'error';
    st.error = e.message || String(e);
    status.value = `hata: ${st.error}`;
  }
});
</script>

<template>
  <div class="render-page">{{ status }}</div>
</template>

<style scoped>
.render-page { padding: 24px; font: 14px system-ui; color: var(--text); }
</style>
