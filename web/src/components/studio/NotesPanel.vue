<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps({
  notes: { type: Array, required: true },
  t: { type: Number, required: true },
  selectedId: { type: String, default: null },
  selectedNoteId: { type: String, default: null },
  pinMode: { type: Boolean, default: false },
  pendingPos: { type: Array, default: null },
  applying: { type: Boolean, default: false },
});
const emit = defineEmits(['apply', 'add', 'update', 'delete', 'go', 'toggle-pin-mode', 'clear-pos']);

const text = ref('');
const attachLayer = ref(true);
const filter = ref('open');
const input = ref(null);

const list = computed(() =>
  [...props.notes]
    .filter((n) => filter.value === 'all' || (filter.value === 'open' ? n.status !== 'done' : n.status === 'done'))
    .sort((a, b) => a.t - b.t),
);
const openCount = computed(() => props.notes.filter((n) => n.status !== 'done').length);

function submit() {
  const v = text.value.trim();
  if (!v) return;
  emit('add', {
    text: v,
    t: Math.round(props.t * 100) / 100,
    layerId: attachLayer.value && props.selectedId && props.selectedId !== '__camera' ? props.selectedId : null,
    pos: props.pendingPos,
  });
  text.value = '';
}

function focus() {
  nextTick(() => input.value?.focus());
}
defineExpose({ focus });

watch(() => props.selectedNoteId, (id) => {
  if (!id) return;
  nextTick(() => document.getElementById(`note-${id}`)?.scrollIntoView({ block: 'nearest' }));
});

const fmt = (t) => {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
};
</script>

<template>
  <div class="notes">
    <form class="compose" @submit.prevent="submit">
      <textarea
        ref="input"
        v-model="text"
        class="input"
        rows="3"
        placeholder="Düzenleme notu yazın… (ör. &quot;tilki biraz daha sola, kuyruk daha hızlı sallansın&quot;)"
        @keydown.enter.exact.prevent="submit"
        @keydown.stop
      />
      <div class="row wrap small">
        <span class="chip">⏱ {{ fmt(t) }}</span>
        <label v-if="selectedId && selectedId !== '__camera'" class="row">
          <input v-model="attachLayer" type="checkbox" /> katman: <b class="mono">{{ selectedId }}</b>
        </label>
        <button type="button" class="btn sm" :class="{ on: pinMode }" title="Sahneye tıklayarak notu bir noktaya iğneleyin" @click="emit('toggle-pin-mode')">
          📍 {{ pendingPos ? `${Math.round(pendingPos[0])}, ${Math.round(pendingPos[1])}` : 'nokta seç' }}
        </button>
        <button v-if="pendingPos" type="button" class="btn icon sm ghost" @click="emit('clear-pos')">✕</button>
        <div class="grow" />
        <button type="submit" class="btn sm primary" :disabled="!text.trim()">Not ekle</button>
      </div>
      <div v-if="openCount" class="row small">
        <button type="button" class="btn sm" :disabled="applying" title="Açık notları Claude API ile uygular (sunucuda ANTHROPIC_API_KEY gerekir); Geçmiş'ten geri alınabilir" @click="emit('apply')">
          {{ applying ? 'Claude uyguluyor…' : `✨ Claude ile uygula (${openCount})` }}
        </button>
      </div>
      <div class="dim small">Enter ile gönder, Shift+Enter ile alt satıra geç. Notlar anında kaydedilir; Claude'a "notları uygula" demeniz yeterli.</div>
    </form>

    <div class="tabs">
      <button :class="{ active: filter === 'open' }" @click="filter = 'open'">Açık ({{ openCount }})</button>
      <button :class="{ active: filter === 'done' }" @click="filter = 'done'">Tamamlanan</button>
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">Tümü</button>
    </div>

    <div class="list">
      <div v-if="!list.length" class="dim small pad">Not yok.</div>
      <div
        v-for="n in list"
        :id="`note-${n.id}`"
        :key="n.id"
        class="note"
        :class="{ done: n.status === 'done', sel: n.id === selectedNoteId }"
      >
        <div class="row">
          <button class="chip time" title="Bu ana git" @click="emit('go', n)">⏱ {{ fmt(n.t) }}</button>
          <span v-if="n.layerId" class="chip mono">{{ n.layerId }}</span>
          <span v-if="n.pos" class="chip">📍</span>
          <div class="grow" />
          <button
            class="btn sm"
            :class="n.status === 'done' ? '' : 'ok'"
            @click="emit('update', n, { status: n.status === 'done' ? 'open' : 'done' })"
          >{{ n.status === 'done' ? 'Yeniden aç' : '✓ Tamam' }}</button>
          <button class="btn icon sm ghost" title="Sil" @click="emit('delete', n)">✕</button>
        </div>
        <div class="text">{{ n.text }}</div>
        <div v-if="n.reply" class="reply"><b>Claude:</b> {{ n.reply }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notes { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.compose { display: grid; gap: 8px; padding: 12px; border-bottom: 1px solid var(--line); }
.wrap { flex-wrap: wrap; }
.list { overflow: auto; padding: 8px; display: grid; gap: 8px; align-content: start; flex: 1; }
.pad { padding: 12px; }
.note { background: var(--bg-2); border: 1px solid var(--line); border-left: 3px solid var(--note); border-radius: 8px; padding: 8px 10px; display: grid; gap: 6px; }
.note.done { border-left-color: var(--ok); opacity: .75; }
.note.sel { border-color: var(--accent); }
.text { white-space: pre-wrap; }
.reply { font-size: 12px; background: #1d2a21; border-radius: 6px; padding: 6px 8px; color: #cfe9d7; white-space: pre-wrap; }
.time { cursor: pointer; }
.btn.ok { color: var(--ok); }
</style>
