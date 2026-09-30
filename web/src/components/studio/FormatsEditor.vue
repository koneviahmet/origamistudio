<script setup>
// Çoklu format (scene.formats): aynı sahneden farklı en-boy oranlarında çıktı
import { computed } from 'vue';
import { PRESETS } from '../../sceneOps.js';

const props = defineProps({
  scene: { type: Object, required: true },
  edit: { type: Function, required: true },
});

const available = computed(() =>
  PRESETS.filter((p) => !(p.width === props.scene.width && p.height === props.scene.height) && !(props.scene.formats || []).some((f) => f.id === p.id)),
);

function add(id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return;
  // Yatay formatta içerik çoğu zaman sığdırılır; dikeye yakın formatta kırpma daha dolu görünür
  const wide = p.width / p.height > props.scene.width / props.scene.height;
  props.edit(() =>
    (props.scene.formats ||= []).push({
      id: p.id,
      name: p.label.split(' — ')[0],
      width: p.width,
      height: p.height,
      mode: wide ? 'sigdir' : 'kirp',
      focusX: 0.5,
      focusY: 0.5,
      zoom: 1,
    }),
  );
}
function remove(i) {
  props.edit(() => {
    props.scene.formats.splice(i, 1);
    if (!props.scene.formats.length) delete props.scene.formats;
  });
}
function set(f, k, v) {
  props.edit(() => (f[k] = v), `fmt:${f.id}:${k}`);
}
function clearOverrides(f) {
  props.edit(() => delete f.overrides);
}
const ovCount = (f) => Object.keys(f.overrides || {}).length;
</script>

<template>
  <div class="fe">
    <p class="dim small">
      Ana sahne ({{ scene.width }}×{{ scene.height }}) başka oranlara otomatik yerleştirilir. Üst çubuktaki format
      seçiciyle o formata geçip katmanları sürüklersen yalnızca o formata özel düzeltme kaydedilir.
    </p>
    <div v-for="(f, i) in scene.formats || []" :key="f.id" class="fmt">
      <div class="row">
        <input class="input grow" :value="f.name" @change="set(f, 'name', $event.target.value)" />
        <span class="dim small">{{ f.width }}×{{ f.height }}</span>
        <button class="btn icon sm ghost" title="Formatı sil" @click="remove(i)">✕</button>
      </div>
      <div class="grid">
        <label>Yerleşim</label>
        <select class="input" :value="f.mode" @change="set(f, 'mode', $event.target.value)">
          <option value="sigdir">Sığdır (tümü görünür, kenarlar arka planla dolar)</option>
          <option value="kirp">Kırp (ekranı doldur, odağa göre kırp)</option>
        </select>
        <label>Odak X {{ (f.focusX ?? 0.5).toFixed(2) }}</label>
        <input type="range" min="0" max="1" step="0.01" :value="f.focusX ?? 0.5" @input="set(f, 'focusX', Number($event.target.value))" />
        <label>Odak Y {{ (f.focusY ?? 0.5).toFixed(2) }}</label>
        <input type="range" min="0" max="1" step="0.01" :value="f.focusY ?? 0.5" @input="set(f, 'focusY', Number($event.target.value))" />
        <label>Yakınlaştır ×{{ (f.zoom ?? 1).toFixed(2) }}</label>
        <input type="range" min="0.5" max="2" step="0.01" :value="f.zoom ?? 1" @input="set(f, 'zoom', Number($event.target.value))" />
      </div>
      <div v-if="ovCount(f)" class="row small">
        <span class="grow dim">{{ ovCount(f) }} katmanda formata özel düzeltme</span>
        <button class="btn sm" @click="clearOverrides(f)">Düzeltmeleri temizle</button>
      </div>
    </div>
    <select v-if="available.length" class="input add" @change="add($event.target.value); $event.target.value = ''">
      <option value="">＋ Format ekle…</option>
      <option v-for="p in available" :key="p.id" :value="p.id">{{ p.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.fe { display: grid; gap: 8px; }
.fmt { background: var(--bg-2); border: 1px solid var(--line); border-left: 3px solid #7c5cff; border-radius: 8px; padding: 8px; display: grid; gap: 8px; }
.grid { display: grid; grid-template-columns: 110px 1fr; gap: 5px 8px; align-items: center; }
.grid label { font-size: 12px; color: var(--text-2); }
.grid .input { height: 26px; font-size: 12px; }
.add { color: var(--accent-2); }
</style>
