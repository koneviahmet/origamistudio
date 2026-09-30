<script setup>
import { computed, ref } from 'vue';
import AssetCanvas from '../AssetCanvas.vue';
import ParticlePreview from '../ParticlePreview.vue';

const props = defineProps({ lib: { type: Map, required: true }, initialCat: { type: String, default: '' } });
const emit = defineEmits(['pick', 'close']);

const q = ref('');
const cat = ref(props.initialCat);
const hover = ref('');
const cats = computed(() => [...new Set([...props.lib.values()].map((a) => a.category))].sort());
const list = computed(() => {
  const s = q.value.trim().toLocaleLowerCase('tr');
  return [...props.lib.values()].filter(
    (a) =>
      (!cat.value || a.category === cat.value) &&
      (!s || [a.id, a.name, ...(a.tags || [])].join(' ').toLocaleLowerCase('tr').includes(s)),
  );
});
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal picker">
      <header class="row">
        <span class="grow">Kütüphaneden ekle</span>
        <button class="btn icon ghost" @click="emit('close')">✕</button>
      </header>
      <div class="body">
        <div class="row">
          <input v-model="q" class="input" placeholder="Ara…" autofocus @keydown.stop />
          <select v-model="cat" class="input" style="width: 160px">
            <option value="">Tüm kategoriler</option>
            <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="grid">
          <button
            v-for="a in list"
            :key="a.id"
            class="item"
            @click="emit('pick', a)"
            @mouseenter="hover = a.id"
            @mouseleave="hover = ''"
          >
            <div class="th" :class="{ fx: a.type === 'particles' }">
              <ParticlePreview v-if="a.type === 'particles'" :item="a" :animate="hover === a.id" />
              <AssetCanvas v-else :asset="a" :animate="hover === a.id" />
            </div>
            <span class="small">{{ a.name || a.id }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker { width: min(760px, 100%); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; max-height: 60vh; overflow: auto; }
.item { background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; padding: 6px; cursor: pointer; display: grid; gap: 4px; }
.item:hover { border-color: var(--accent); }
.th.fx { background: #0b1026; }
.th { aspect-ratio: 1; background: radial-gradient(circle at 50% 40%, #fbf1e2, #efd9bd); border-radius: 6px; }
</style>
