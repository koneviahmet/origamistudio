<script setup>
// Kütüphane efekt öğesi (type=particles) düzenleyici
import { computed, ref } from 'vue';
import { resources } from '../resources.js';
import { PARTICLE_MOTIONS, PARTICLE_SHAPES } from '../engine/particles.js';
import ParticlePreview from './ParticlePreview.vue';

const props = defineProps({ item: { type: Object, required: true } });
const emit = defineEmits(['change']);

const animate = ref(true);
const burst = ref(false);
const dark = ref(true);
const origami = computed(() => [...resources.value.assets.values()].filter((a) => a.type !== 'particles'));
const REFS = ['$vurgu', '$baslik', '$metin', '$arka1', '$arka2'];

function set(k, v) {
  if (v === '' || v === null || Number.isNaN(v)) delete props.item[k];
  else props.item[k] = v;
  emit('change');
}
const num = (v) => (v === '' ? null : Number(v));
function setColor(i, v) {
  props.item.colors = [...(props.item.colors || [])];
  props.item.colors[i] = v;
  emit('change');
}
function addColor() {
  props.item.colors = [...(props.item.colors || []), '#ffffff'];
  emit('change');
}
function removeColor(i) {
  props.item.colors = props.item.colors.filter((_, j) => j !== i);
  emit('change');
}
const isRef = (c) => typeof c === 'string' && c[0] === '$';
const hexOf = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff');
</script>

<template>
  <div class="pie">
    <div class="pv">
      <ParticlePreview :key="burst ? 'b' : 's'" :item="item" :animate="animate" :mode="burst ? 'patlama' : 'surekli'" :dark="dark" />
    </div>
    <div class="row wrap">
      <button class="btn sm" :class="{ on: animate }" @click="animate = !animate">{{ animate ? '■ Durdur' : '▶ Oynat' }}</button>
      <button class="btn sm" :class="{ on: burst }" @click="burst = !burst">Patlama modu</button>
      <button class="btn sm" :class="{ on: !dark }" @click="dark = !dark">Açık zemin</button>
    </div>

    <div class="grid">
      <label>Hareket</label>
      <select class="input" :value="item.motion || 'dus'" @change="set('motion', $event.target.value)">
        <option v-for="(l, k) in PARTICLE_MOTIONS" :key="k" :value="k">{{ l }}</option>
      </select>
      <label>Şekil</label>
      <select class="input" :value="item.shape || 'kagit'" @change="set('shape', $event.target.value)">
        <option v-for="(l, k) in PARTICLE_SHAPES" :key="k" :value="k">{{ l }}</option>
      </select>
      <template v-if="item.shape === 'varlik'">
        <label>Model</label>
        <select class="input" :value="item.asset || ''" @change="set('asset', $event.target.value)">
          <option value="">(seç)</option>
          <option v-for="a in origami" :key="a.id" :value="a.id">{{ a.name || a.id }}</option>
        </select>
      </template>
      <label>Adet</label>
      <input type="number" min="1" max="600" class="input" :value="item.count ?? 80" @input="set('count', num($event.target.value))" />
      <label>Boyut (px)</label>
      <input type="number" min="2" class="input" :value="item.size ?? 20" @input="set('size', num($event.target.value))" />
      <label>Hız (px/sn)</label>
      <input type="number" step="10" class="input" :value="item.speed ?? 200" @input="set('speed', num($event.target.value))" />
      <label>Salınım (px)</label>
      <input type="number" step="5" class="input" :value="item.sway ?? 40" @input="set('sway', num($event.target.value))" />
      <label>Dönüş</label>
      <input type="number" step="0.5" class="input" :value="item.spin ?? 0" @input="set('spin', num($event.target.value))" />
      <label>Rüzgâr (px/sn)</label>
      <input type="number" step="10" class="input" :value="item.wind ?? 0" @input="set('wind', num($event.target.value))" />
      <label>Başta dolu</label>
      <label class="row small"><input type="checkbox" :checked="!!item.prewarm" @change="set('prewarm', $event.target.checked || null)" /> video başında ekran dolu olsun</label>
    </div>

    <div v-if="item.shape !== 'varlik'" class="field">
      <label class="label">Renkler</label>
      <div class="row wrap">
        <div v-for="(c, i) in item.colors || []" :key="i" class="cc">
          <select class="input ref" :value="isRef(c) ? c : ''" @change="setColor(i, $event.target.value || '#ffffff')">
            <option value="">özel</option>
            <option v-for="r in REFS" :key="r" :value="r">{{ r }}</option>
          </select>
          <input v-if="!isRef(c)" type="color" class="input" :value="hexOf(c)" @input="setColor(i, $event.target.value)" />
          <button class="btn icon sm ghost" @click="removeColor(i)">✕</button>
        </div>
        <button class="btn sm" @click="addColor">＋</button>
      </div>
    </div>
    <p class="dim small">Sahnede: stüdyo → ＋ Parçacık → bu efekt. Katmanda adet, boyut, renk, rüzgâr ve mod (sürekli / patlama) ayrıca geçersiz kılınabilir.</p>
  </div>
</template>

<style scoped>
.pie { display: grid; gap: 10px; }
.pv { aspect-ratio: 1; max-height: 360px; border-radius: 10px; overflow: hidden; border: 1px solid var(--line); }
.grid { display: grid; grid-template-columns: 110px 1fr; gap: 6px 10px; align-items: center; }
.grid > label { font-size: 12px; color: var(--text-2); }
.wrap { flex-wrap: wrap; gap: 4px; }
.cc { display: flex; align-items: center; gap: 2px; }
.ref { width: 78px; height: 26px; font-size: 11px; padding: 0 2px; }
</style>
