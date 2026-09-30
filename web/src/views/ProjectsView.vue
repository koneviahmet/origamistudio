<script setup>
import { onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api.js';
import { resources, loadResources } from '../resources.js';
import { useLive } from '../live.js';
import { toast, toastError } from '../toast.js';
import { PRESETS, newScene } from '../sceneOps.js';
import SceneThumb from '../components/SceneThumb.vue';

const router = useRouter();
const projects = ref([]);
const scenes = shallowRef({});
const loading = ref(true);
const showNew = ref(false);
const form = ref({ name: '', preset: 'reels' });

async function load() {
  try {
    const [list] = await Promise.all([api.projects(), loadResources()]);
    projects.value = list;
    const out = {};
    await Promise.all(list.map(async (p) => {
      try {
        out[p.id] = (await api.project(p.id)).scene;
      } catch { /* küçük resim atlanır */ }
    }));
    scenes.value = out;
  } catch (e) {
    toastError(e);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
useLive((e) => ['projects', 'scene', 'notes'].includes(e.kind) && load());

async function create() {
  const name = form.value.name.trim() || 'Yeni Proje';
  try {
    const p = await api.createProject(newScene(name, form.value.preset));
    showNew.value = false;
    router.push(`/studio/${p.id}`);
  } catch (e) {
    toastError(e);
  }
}

async function duplicate(p) {
  try {
    await api.duplicateProject(p.id);
    toast('Proje çoğaltıldı', 'ok');
    load();
  } catch (e) {
    toastError(e);
  }
}

async function remove(p) {
  if (!confirm(`"${p.name}" projesi ve notları kalıcı olarak silinsin mi?`)) return;
  try {
    await api.deleteProject(p.id);
    toast('Proje silindi');
    load();
  } catch (e) {
    toastError(e);
  }
}

const aspect = (p) => {
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(p.width, p.height);
  return `${p.width / d}:${p.height / d}`;
};
const fmtDate = (s) => new Date(s).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<template>
  <div class="wrap">
    <div class="head row">
      <div class="grow">
        <h1>Projeler</h1>
        <p class="muted">Her proje bir video sahnesidir. Stüdyoda açıp oynatın, not bırakın, MP4 alın.</p>
      </div>
      <button class="btn primary" @click="showNew = true">＋ Yeni proje</button>
    </div>

    <div v-if="loading" class="dim">Yükleniyor…</div>
    <div v-else-if="!projects.length" class="empty">
      <p>Henüz proje yok.</p>
      <button class="btn primary" @click="showNew = true">İlk projeyi oluştur</button>
    </div>

    <div class="grid">
      <div v-for="p in projects" :key="p.id" class="card" @click="router.push(`/studio/${p.id}`)">
        <div class="thumb">
          <SceneThumb v-if="scenes[p.id]" :scene="scenes[p.id]" :res="resources" :t="Math.min(p.duration, p.duration * 0.62)" :width="200" />
        </div>
        <div class="info">
          <div class="row">
            <strong class="grow name">{{ p.name }}</strong>
            <span v-if="p.openNotes" class="chip warn" title="Açık notlar">✎ {{ p.openNotes }}</span>
          </div>
          <div class="row dim small">
            <span>{{ aspect(p) }}</span>·<span>{{ p.width }}×{{ p.height }}</span>·<span>{{ p.duration }} sn</span>·<span>{{ p.layers }} katman</span>
          </div>
          <div class="row dim small">{{ fmtDate(p.updatedAt) }}</div>
          <div class="row actions" @click.stop>
            <button class="btn sm primary" @click="router.push(`/studio/${p.id}`)">Aç</button>
            <button class="btn sm" @click="duplicate(p)">Çoğalt</button>
            <div class="grow" />
            <button class="btn sm danger" @click="remove(p)">Sil</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showNew" class="modal-backdrop" @click.self="showNew = false">
      <form class="modal" @submit.prevent="create">
        <header>Yeni proje</header>
        <div class="body">
          <div class="field">
            <label>Proje adı</label>
            <input v-model="form.name" class="input" placeholder="ör. Okyanus Hikayesi" autofocus />
          </div>
          <div class="field">
            <label>Format</label>
            <div class="presets">
              <label v-for="pr in PRESETS" :key="pr.id" class="preset" :class="{ on: form.preset === pr.id }">
                <input v-model="form.preset" type="radio" :value="pr.id" />
                <span class="shape" :style="{ aspectRatio: `${pr.width}/${pr.height}` }" />
                <span>{{ pr.label }}</span>
                <span class="dim small">{{ pr.width }}×{{ pr.height }}</span>
              </label>
            </div>
          </div>
        </div>
        <footer>
          <button type="button" class="btn" @click="showNew = false">Vazgeç</button>
          <button type="submit" class="btn primary">Oluştur ve aç</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.wrap { padding: 24px 28px; max-width: 1400px; margin: 0 auto; }
.head { margin-bottom: 20px; }
h1 { margin: 0 0 4px; font-family: Fredoka, sans-serif; font-weight: 600; }
.head p { margin: 0; }
.empty { display: grid; gap: 12px; justify-items: start; padding: 24px 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.card {
  display: grid; grid-template-columns: 130px 1fr; gap: 14px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px; cursor: pointer;
}
.card:hover { border-color: var(--line-2); }
.thumb { height: 180px; display: grid; place-items: center; background: var(--bg-2); border-radius: 8px; overflow: hidden; }
.info { display: grid; gap: 6px; align-content: start; min-width: 0; }
.info .row { flex-wrap: wrap; gap: 4px 6px; }
.name { font-size: 15px; }
.actions { margin-top: 8px; }
.presets { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.preset {
  display: grid; justify-items: center; gap: 6px; padding: 12px 8px; text-align: center;
  border: 1px solid var(--line); border-radius: 10px; cursor: pointer; font-size: 12px;
}
.preset.on { border-color: var(--accent); background: #2d2118; }
.preset input { display: none; }
.shape { height: 44px; border: 2px solid var(--text-2); border-radius: 4px; }
.preset.on .shape { border-color: var(--accent); }
</style>
