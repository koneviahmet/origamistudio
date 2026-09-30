<script setup>
// Tek bir animasyonlanabilir özellik satırı: değer + keyframe düğmesi + easing.
import { computed, ref } from 'vue';
import { isTrack, keyIndexAt } from '../../engine/anim.js';
import { ease as easeFn, isBezier } from '../../engine/easing.js';
import EaseEditor from './EaseEditor.vue';
import { valueAt, setPropAt, toggleKeyAt, setEaseAt } from '../../sceneOps.js';

const props = defineProps({
  obj: { type: Object, required: true },
  name: { type: String, required: true },
  label: { type: String, default: '' },
  t: { type: Number, required: true },
  eps: { type: Number, default: 1 / 60 },
  step: { type: Number, default: 1 },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  kind: { type: String, default: 'number' }, // number | color
  edit: { type: Function, required: true },
});

const track = computed(() => isTrack(props.obj[props.name]));
const keyIdx = computed(() => keyIndexAt(props.obj[props.name], props.t, props.eps));
const value = computed(() => {
  const v = valueAt(props.obj, props.name, props.t);
  if (props.kind === 'color') return v || '#000000';
  return typeof v === 'number' ? Math.round(v * 100) / 100 : v;
});
const easeName = computed(() => (keyIdx.value >= 0 ? props.obj[props.name][keyIdx.value].ease || 'inOutCubic' : ''));

function onInput(e) {
  const raw = e.target.value;
  const v = props.kind === 'color' ? raw : Number(raw);
  if (props.kind !== 'color' && Number.isNaN(v)) return;
  props.edit(() => setPropAt(props.obj, props.name, v, props.t, props.eps), `${props.name}`);
}
function toggle() {
  props.edit(() => toggleKeyAt(props.obj, props.name, props.t, props.eps));
}
const showEase = ref(false);
function setEase(v) {
  props.edit(() => setEaseAt(props.obj, props.name, props.t, v, props.eps), `ease:${props.name}`);
}
const easeLabel = computed(() => (isBezier(easeName.value) ? 'özel' : easeName.value));
const easeMini = computed(() =>
  Array.from({ length: 17 }, (_, i) => {
    const x = i / 16;
    return `${i ? 'L' : 'M'}${(1 + x * 16).toFixed(1)},${(15 - (easeFn(easeName.value, x) + 0.2) * 10).toFixed(1)}`;
  }).join(' '),
);
</script>

<template>
  <div class="prop-row">
    <span class="lbl" :title="name">{{ label || name }}</span>
    <input
      v-if="kind === 'color'"
      type="color"
      class="input color"
      :value="value"
      @input="onInput"
    />
    <input
      v-else
      type="number"
      class="input num"
      :class="{ animated: track }"
      :value="value"
      :step="step"
      :min="min"
      :max="max"
      @input="onInput"
    />
    <button
      class="kbtn"
      :class="{ on: keyIdx >= 0, track }"
      :title="keyIdx >= 0 ? 'Bu andaki keyframe\'i sil' : 'Bu anda keyframe ekle'"
      @click="toggle"
    >{{ keyIdx >= 0 ? '◆' : '◇' }}</button>
    <button v-if="keyIdx >= 0" class="input ease" title="Bu keyframe'e geliş eğrisi — düzenle" @click="showEase = !showEase">
      <svg viewBox="0 0 18 18"><path :d="easeMini" /></svg>
      <span>{{ easeLabel }}</span>
    </button>
    <span v-else class="ease-ph" />
    <EaseEditor v-if="showEase && keyIdx >= 0" :model-value="obj[name][keyIdx].ease || 'inOutCubic'" @update:model-value="setEase" @close="showEase = false" />
  </div>
</template>

<style scoped>
.prop-row { position: relative; display: grid; grid-template-columns: 64px 1fr 24px 92px; gap: 6px; align-items: center; }
.lbl { font-size: 12px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; }
.num { height: 26px; font-family: var(--mono); font-size: 12px; }
.num.animated { border-color: #6a4a30; color: var(--accent-2); }
.color { width: 100%; height: 26px; }
.kbtn { background: none; border: none; color: var(--text-3); cursor: pointer; font-size: 14px; padding: 0; }
.kbtn.track { color: #a07a5c; }
.kbtn.on { color: var(--kf); }
.ease { height: 26px; font-size: 11px; padding: 0 4px; display: flex; align-items: center; gap: 3px; cursor: pointer; overflow: hidden; }
.ease svg { width: 18px; height: 18px; flex: none; }
.ease path { fill: none; stroke: var(--accent-2); stroke-width: 1.6; }
.ease span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
