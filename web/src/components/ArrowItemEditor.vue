<script setup>
// Kütüphane ok öğesi (type=arrow) düzenleyici
import { computed, ref } from 'vue';
import { ARROW_DEFAULTS } from '../engine/arrows.js';
import ArrowPreview from './ArrowPreview.vue';
import ArrowStyleFields from './ArrowStyleFields.vue';

const props = defineProps({ item: { type: Object, required: true } });
const emit = defineEmits(['change']);

const animate = ref(true);
const sample = ref('1683');
const value = computed(() => ({ ...ARROW_DEFAULTS, ...props.item }));

function set(k, v) {
  if (v === '' || v === null || Number.isNaN(v)) delete props.item[k];
  else props.item[k] = v;
  emit('change');
}
</script>

<template>
  <div class="aie">
    <div class="pv">
      <ArrowPreview deep :item="item" :animate="animate" :label="sample" />
    </div>
    <div class="row wrap">
      <button class="btn sm" :class="{ on: animate }" @click="animate = !animate">{{ animate ? '■ Durdur' : '▶ Oynat' }}</button>
      <input v-model="sample" class="input sm grow" placeholder="Örnek etiket" />
    </div>
    <ArrowStyleFields :value="value" :set="set" />
  </div>
</template>

<style scoped>
.aie { display: grid; gap: 10px; align-content: start; }
.pv { aspect-ratio: 1; max-height: 360px; border-radius: 8px; overflow: hidden; }
.wrap { flex-wrap: wrap; gap: 6px; }
</style>
