<script setup>
// Sahne geçişleri (scene.transitions) ve bölümler (scene.sections)
import { computed } from 'vue';
import { TRANSITIONS } from '../../engine/transitions.js';

const props = defineProps({
  scene: { type: Object, required: true },
  t: { type: Number, required: true },
  edit: { type: Function, required: true },
});

const r2 = (n) => Math.round(n * 100) / 100;
const list = computed(() => (props.scene.transitions || []).map((tr, i) => ({ tr, i })).sort((a, b) => a.tr.t - b.tr.t));
const sections = computed(() => [...(props.scene.sections || [])].sort((a, b) => a.t - b.t));
const REFS = ['$arka1', '$arka2', '$vurgu', '$baslik'];

function add(type) {
  if (!type) return;
  props.edit(() => (props.scene.transitions ||= []).push({ type, t: r2(props.t) }));
}
function remove(i) {
  props.edit(() => {
    props.scene.transitions.splice(i, 1);
    if (!props.scene.transitions.length) delete props.scene.transitions;
  });
}
function set(tr, k, v) {
  props.edit(() => {
    if (v === '' || v === null || Number.isNaN(v)) delete tr[k];
    else tr[k] = v;
  }, `tr:${k}`);
}
const num = (v) => (v === '' ? null : Number(v));
const isRef = (c) => typeof c === 'string' && c[0] === '$';

function addSection() {
  const name = prompt('Bölüm adı:', `Bölüm ${(props.scene.sections?.length || 0) + 1}`);
  if (!name) return;
  props.edit(() => (props.scene.sections ||= []).push({ t: r2(props.t), name: name.trim() }));
}
function setSection(s, k, v) {
  props.edit(() => (s[k] = v), `sec:${k}`);
}
function removeSection(s) {
  props.edit(() => {
    props.scene.sections = props.scene.sections.filter((x) => x !== s);
    if (!props.scene.sections.length) delete props.scene.sections;
  });
}
</script>

<template>
  <div class="te">
    <div class="sec-title">Geçişler</div>
    <p class="dim small">
      <b>t</b> kesme anıdır: katmanların start / end değerleri bu anda değişmeli.
      Örtü geçişleri t'de ekranı tam kapatır; kare geçişleri t'den önceki kareyi çevirir / iter.
    </p>
    <div v-for="{ tr, i } in list" :key="i" class="tr">
      <div class="row">
        <select class="input grow" :value="tr.type" @change="set(tr, 'type', $event.target.value)">
          <option v-for="(T, k) in TRANSITIONS" :key="k" :value="k">{{ T.name }}</option>
        </select>
        <button class="btn icon sm ghost" :title="tr.off ? 'Etkinleştir' : 'Kapat'" @click="set(tr, 'off', tr.off ? null : true)">{{ tr.off ? '◌' : '●' }}</button>
        <button class="btn icon sm ghost" title="Sil" @click="remove(i)">✕</button>
      </div>
      <div class="grid">
        <label>Kesme (sn)</label>
        <div class="row">
          <input type="number" step="0.1" class="input" :value="tr.t" @input="set(tr, 't', num($event.target.value))" />
          <button class="btn sm" title="Şu anki zaman" @click="set(tr, 't', r2(t))">⏱</button>
        </div>
        <label>Süre (sn)</label>
        <input type="number" step="0.1" min="0.2" class="input" :value="tr.dur ?? ''" :placeholder="TRANSITIONS[tr.type]?.dur" @input="set(tr, 'dur', num($event.target.value))" />
        <template v-if="TRANSITIONS[tr.type]?.params.includes('color')">
          <label>Kağıt rengi</label>
          <div class="row">
            <select class="input" :value="isRef(tr.color) ? tr.color : tr.color ? '' : '$arka2'" @change="set(tr, 'color', $event.target.value || '#efe3cf')">
              <option v-for="r in REFS" :key="r" :value="r">{{ r }}</option>
              <option value="">özel</option>
            </select>
            <input v-if="tr.color && !isRef(tr.color)" type="color" class="input" :value="tr.color" @input="set(tr, 'color', $event.target.value)" />
          </div>
        </template>
        <template v-if="TRANSITIONS[tr.type]?.params.includes('yon')">
          <label>Yön</label>
          <select class="input" :value="tr.yon || ''" @change="set(tr, 'yon', $event.target.value)">
            <option value="">varsayılan</option>
            <option value="sol">sol</option>
            <option value="sag">sağ</option>
            <option v-if="tr.type === 'kaydir'" value="yukari">yukarı</option>
            <option v-if="tr.type === 'kaydir'" value="asagi">aşağı</option>
          </select>
        </template>
        <template v-if="TRANSITIONS[tr.type]?.params.includes('kat')">
          <label>Kat sayısı</label>
          <input type="number" min="2" max="12" class="input" :value="tr.kat ?? 5" @input="set(tr, 'kat', num($event.target.value))" />
        </template>
        <template v-if="TRANSITIONS[tr.type]?.params.includes('seed')">
          <label>Yırtık deseni</label>
          <input type="number" class="input" :value="tr.seed ?? 3" @input="set(tr, 'seed', num($event.target.value))" />
        </template>
      </div>
    </div>
    <select class="input add" @change="add($event.target.value); $event.target.value = ''">
      <option value="">＋ Geçiş ekle (şu anki zamana)…</option>
      <option v-for="(T, k) in TRANSITIONS" :key="k" :value="k">{{ T.name }}</option>
    </select>

    <div class="sec-title" style="margin-top: 8px">Bölümler</div>
    <p class="dim small">Zaman çizelgesinde bant olarak görünür; tıklayınca o bölüme gidilir. Sahneyi düzenlemeye yarar, videoda görünmez.</p>
    <div v-for="(s, i) in sections" :key="i" class="row">
      <input class="input grow" :value="s.name" @change="setSection(s, 'name', $event.target.value)" />
      <input type="number" step="0.1" class="input tnum" :value="s.t" @change="setSection(s, 't', Number($event.target.value))" />
      <button class="btn icon sm ghost" @click="removeSection(s)">✕</button>
    </div>
    <button class="btn sm" @click="addSection">＋ Bölüm (şu anki zamana)</button>
  </div>
</template>

<style scoped>
.te { display: grid; gap: 8px; }
.sec-title { font-weight: 600; font-size: 13px; }
.tr { background: var(--bg-2); border: 1px solid var(--line); border-left: 3px solid #e0b25b; border-radius: 8px; padding: 8px; display: grid; gap: 8px; }
.grid { display: grid; grid-template-columns: 92px 1fr; gap: 5px 8px; align-items: center; }
.grid label { font-size: 12px; color: var(--text-2); }
.grid .input { height: 26px; font-size: 12px; }
.add { color: var(--accent-2); }
.tnum { width: 72px; }
</style>
