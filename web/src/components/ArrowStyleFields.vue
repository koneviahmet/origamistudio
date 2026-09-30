<script setup>
// Ok stil alanları — kütüphane öğesi düzenleyicisi ve stüdyo katmanı (geçersiz kılma) ortak kullanır.
import { computed } from 'vue';
import { ARROW_CURVES, ARROW_LINES, ARROW_HEADS, ARROW_FLOWS } from '../engine/arrows.js';
import FontPicker from './FontPicker.vue';

const props = defineProps({
  value: { type: Object, required: true }, // etkin değerler
  own: { type: Object, default: null }, // katmanda geçersiz kılınanlar (↺ göstermek için)
  set: { type: Function, required: true }, // (anahtar, değer | null)
});

const v = computed(() => props.value);
const isOwn = (k) => !!props.own && props.own[k] !== undefined;
const num = (e) => (e.target.value === '' ? null : Number(e.target.value));
const hexOf = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#888888');
</script>

<template>
  <div class="asf">
    <div class="grid2">
      <div class="field">
        <label>Eğri <button v-if="isOwn('curve')" class="rs" title="Stile dön" @click="set('curve', null)">↺</button></label>
        <select class="input" :value="v.curve" @change="set('curve', $event.target.value)">
          <option v-for="(l, k) in ARROW_CURVES" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <div class="field">
        <label>Çizgi <button v-if="isOwn('line')" class="rs" @click="set('line', null)">↺</button></label>
        <select class="input" :value="v.line" @change="set('line', $event.target.value)">
          <option v-for="(l, k) in ARROW_LINES" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <div class="field">
        <label>Baş <button v-if="isOwn('head')" class="rs" @click="set('head', null)">↺</button></label>
        <select class="input" :value="v.head" @change="set('head', $event.target.value)">
          <option v-for="(l, k) in ARROW_HEADS" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <div class="field">
        <label>Kuyruk <button v-if="isOwn('tail')" class="rs" @click="set('tail', null)">↺</button></label>
        <select class="input" :value="v.tail" @change="set('tail', $event.target.value)">
          <option v-for="(l, k) in ARROW_HEADS" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <div class="field">
        <label>Kalınlık (px) <button v-if="isOwn('width')" class="rs" @click="set('width', null)">↺</button></label>
        <input type="number" min="0.5" step="0.5" class="input" :value="v.width" @input="set('width', num($event))" />
      </div>
      <div class="field">
        <label>Uç boyutu (px) <button v-if="isOwn('headSize')" class="rs" @click="set('headSize', null)">↺</button></label>
        <input type="number" min="0" step="1" class="input" :value="v.headSize" @input="set('headSize', num($event))" />
      </div>
    </div>

    <div class="field">
      <label>Kavis {{ Number(v.bend).toFixed(2) }} <span class="dim">(− ters yön)</span> <button v-if="isOwn('bend')" class="rs" @click="set('bend', null)">↺</button></label>
      <input type="range" min="-1" max="1" step="0.05" :value="v.bend" @input="set('bend', num($event))" />
    </div>
    <div class="grid2">
      <div class="field">
        <label>Nesneye boşluk (px) <button v-if="isOwn('gap')" class="rs" @click="set('gap', null)">↺</button></label>
        <input type="number" step="1" class="input" :value="v.gap" @input="set('gap', num($event))" />
      </div>
      <div class="field">
        <label>El titremesi (px) <button v-if="isOwn('wobble')" class="rs" @click="set('wobble', null)">↺</button></label>
        <input type="number" min="0" step="0.5" class="input" :value="v.wobble" @input="set('wobble', num($event))" />
      </div>
      <template v-if="v.curve === 'dalga'">
        <div class="field"><label>Dalga sayısı</label><input type="number" min="1" step="1" class="input" :value="v.waves" @input="set('waves', num($event))" /></div>
        <div class="field"><label>Dalga genliği (px)</label><input type="number" step="1" class="input" :value="v.amp" @input="set('amp', num($event))" /></div>
      </template>
      <div v-if="v.curve === 'dirsek'" class="field">
        <label>Köşe yarıçapı (px)</label><input type="number" min="0" step="2" class="input" :value="v.radius" @input="set('radius', num($event))" />
      </div>
    </div>

    <div class="grid2">
      <div class="field">
        <label>Renk <button v-if="isOwn('color')" class="rs" @click="set('color', null)">↺</button></label>
        <input type="color" class="input" :value="hexOf(v.color)" @input="set('color', $event.target.value)" />
      </div>
      <div class="field">
        <label>
          <input type="checkbox" :checked="!!v.color2" @change="set('color2', $event.target.checked ? '#a855f7' : false)" /> Geçiş rengi
          <button v-if="isOwn('color2')" class="rs" @click="set('color2', null)">↺</button>
        </label>
        <input v-if="v.color2" type="color" class="input" :value="hexOf(v.color2)" @input="set('color2', $event.target.value)" />
      </div>
      <div class="field">
        <label>Parıltı (neon) <button v-if="isOwn('glow')" class="rs" @click="set('glow', null)">↺</button></label>
        <input type="range" min="0" max="40" step="1" :value="v.glow" @input="set('glow', num($event))" />
      </div>
      <label class="row small chk"><input type="checkbox" :checked="!!v.shadow" @change="set('shadow', $event.target.checked)" /> Gölge</label>
    </div>

    <div class="grid2">
      <div class="field">
        <label>Akış animasyonu <button v-if="isOwn('flow')" class="rs" @click="set('flow', null)">↺</button></label>
        <select class="input" :value="v.flow" @change="set('flow', $event.target.value)">
          <option v-for="(l, k) in ARROW_FLOWS" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <template v-if="v.flow && v.flow !== 'yok'">
        <div class="field"><label>Akış hızı (px/sn)</label><input type="number" step="10" class="input" :value="v.flowSpeed" @input="set('flowSpeed', num($event))" /></div>
        <div class="field"><label>Akış rengi</label><input type="color" class="input" :value="hexOf(v.flowColor)" @input="set('flowColor', $event.target.value)" /></div>
        <div v-if="v.flow === 'nokta'" class="field"><label>Nokta aralığı (px)</label><input type="number" min="10" step="2" class="input" :value="v.flowGap" @input="set('flowGap', num($event))" /></div>
      </template>
    </div>

    <details>
      <summary class="small">Etiket görünümü</summary>
      <div class="grid2">
        <div class="field">
          <label>Font</label>
          <FontPicker :model-value="v.labelFont || ''" placeholder="Caveat" @update:model-value="(f) => set('labelFont', f || null)" />
        </div>
        <div class="field"><label>Boyut (px)</label><input type="number" step="2" class="input" :value="v.labelSize" @input="set('labelSize', num($event))" /></div>
        <div class="field">
          <label><input type="checkbox" :checked="!!v.labelColor" @change="set('labelColor', $event.target.checked ? '#2d3561' : null)" /> Ayrı etiket rengi</label>
          <input v-if="v.labelColor" type="color" class="input" :value="hexOf(v.labelColor)" @input="set('labelColor', $event.target.value)" />
        </div>
        <label class="row small chk"><input type="checkbox" :checked="!!v.labelBox" @change="set('labelBox', $event.target.checked)" /> Kutu içinde</label>
      </div>
    </details>
  </div>
</template>

<style scoped>
.asf { display: grid; gap: 10px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.chk { height: 30px; align-self: end; }
.rs { border: 0; background: none; color: var(--accent); cursor: pointer; padding: 0 2px; font-size: 12px; }
input[type='range'] { width: 100%; }
summary { cursor: pointer; color: var(--dim, #999); }
</style>
