<script setup>
// Sahne sürüm geçmişi: her kayıt / disk değişikliği bir sürüm. Fark özeti + önizleme + geri yükleme.
import { onMounted, ref, shallowRef } from 'vue';
import { api } from '../../api.js';
import { useLive } from '../../live.js';
import { toast, toastError } from '../../toast.js';
import SceneThumb from '../SceneThumb.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  res: { type: Object, required: true },
  t: { type: Number, required: true },
  dirty: { type: Boolean, default: false },
});

const emit = defineEmits(['restored']);
const list = ref([]);
const open = ref(null);
const openScene = shallowRef(null);
const loading = ref(false);

const SOURCES = {
  studio: ['Stüdyo', 'st'],
  disk: ['Claude / disk', 'dk'],
  restore: ['Geri yükleme', 'rs'],
  create: ['Oluşturma', 'cr'],
  baseline: ['Başlangıç', 'cr'],
};

async function load() {
  try {
    list.value = await api.history(props.projectId);
  } catch (e) {
    toastError(e);
  }
}
onMounted(load);
useLive((e) => e.kind === 'history' && e.id === props.projectId && load());

async function toggle(h) {
  if (open.value === h.ts) {
    open.value = null;
    return;
  }
  open.value = h.ts;
  openScene.value = null;
  loading.value = true;
  try {
    openScene.value = (await api.historyGet(props.projectId, h.ts)).scene;
  } catch (e) {
    toastError(e);
  } finally {
    loading.value = false;
  }
}

async function restore(h) {
  const msg = props.dirty
    ? 'Kaydedilmemiş değişiklikleriniz var ve kaybolacak. Bu sürüm geri yüklensin mi?'
    : 'Bu sürüm geri yüklensin mi? (Şu anki hâl de geçmişte kalır, istersen geri dönebilirsin.)';
  if (!confirm(msg)) return;
  try {
    await api.historyRestore(props.projectId, h.ts);
    emit('restored');
    toast('Sürüm geri yüklendi', 'ok');
  } catch (e) {
    toastError(e);
  }
}

const rel = (ts) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
};
const abs = (ts) => new Date(ts).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });
function summary(s) {
  if (!s) return '';
  const parts = [];
  if (s.added?.length) parts.push(`+${s.added.length} katman`);
  if (s.removed?.length) parts.push(`−${s.removed.length} katman`);
  if (s.changed?.length) parts.push(`${s.changed.length} katman değişti`);
  if (s.scene?.length) parts.push(s.scene.join(', '));
  return parts.join(' · ') || 'ilk sürüm';
}
</script>

<template>
  <div class="hist">
    <p class="dim small pad">
      Her kayıt ve diskteki her değişiklik (ör. Claude'un düzenlemesi) otomatik sürüm olur. Son 80 sürüm saklanır.
    </p>
    <div v-if="!list.length" class="dim small pad">Henüz sürüm yok.</div>
    <div v-for="(h, i) in list" :key="h.ts" class="item" :class="{ open: open === h.ts }">
      <button class="head" @click="toggle(h)">
        <span class="src" :class="SOURCES[h.source]?.[1]">{{ SOURCES[h.source]?.[0] || h.source }}</span>
        <span class="grow sum">{{ summary(h.summary) }}</span>
        <span class="dim small" :title="abs(h.ts)">{{ i === 0 ? 'şu anki' : rel(h.ts) }}</span>
      </button>
      <div v-if="open === h.ts" class="body">
        <div class="thumb">
          <SceneThumb v-if="openScene" :scene="openScene" :res="res" :t="Math.min(t, openScene.duration)" :width="110" />
          <span v-else-if="loading" class="dim small">yükleniyor…</span>
        </div>
        <div class="detail">
          <div class="dim small">{{ abs(h.ts) }} · {{ h.layers }} katman · {{ h.duration }} sn</div>
          <div v-if="h.summary?.added?.length" class="small"><b class="ok">Eklenen:</b> <span class="mono">{{ h.summary.added.join(', ') }}</span></div>
          <div v-if="h.summary?.removed?.length" class="small"><b class="bad">Silinen:</b> <span class="mono">{{ h.summary.removed.join(', ') }}</span></div>
          <div v-for="c in (h.summary?.changed || []).slice(0, 12)" :key="c.id" class="small">
            <span class="mono">{{ c.id }}</span> <span class="dim">— {{ c.keys.join(', ') }}</span>
          </div>
          <div v-if="(h.summary?.changed || []).length > 12" class="dim small">… ve {{ h.summary.changed.length - 12 }} katman daha</div>
          <div v-if="h.summary?.scene?.length" class="small"><b>Sahne:</b> {{ h.summary.scene.join(', ') }}</div>
          <p class="dim small">Küçük resim bu sürümün şu anki oynatma zamanındaki hâlidir.</p>
          <button v-if="i > 0" class="btn sm" @click="restore(h)">↺ Bu sürüme dön</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hist { display: grid; gap: 4px; padding: 8px; align-content: start; }
.pad { padding: 4px 4px 8px; margin: 0; }
.item { border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); overflow: hidden; }
.item.open { border-color: var(--line-2); }
.head { display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: none; padding: 7px 8px; cursor: pointer; text-align: left; }
.head:hover { background: var(--panel-2); }
.sum { font-size: 12px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.src { font-size: 10px; padding: 1px 6px; border-radius: 99px; white-space: nowrap; }
.src.st { background: #2d2118; color: var(--accent-2); }
.src.dk { background: #1b2a3a; color: #9cc8f0; }
.src.rs { background: #26213a; color: #c4b5fd; }
.src.cr { background: #1d2a21; color: var(--ok); }
.body { display: grid; grid-template-columns: 110px 1fr; gap: 10px; padding: 8px; border-top: 1px solid var(--line); }
.thumb { display: grid; place-items: start center; }
.detail { display: grid; gap: 4px; align-content: start; }
.ok { color: var(--ok); }
.bad { color: #ff8b8e; }
</style>
