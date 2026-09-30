<script setup>
// Katmanın animasyon ön ayarları — ekle, düzenle, sil.
//   kind="layer" → layer.anims (katman ön ayarları)
//   kind="text"  → layer.textAnims (harf / kelime / satır animasyonları)
import { computed } from 'vue';
import { PRESETS as LAYER_PRESETS, PRESET_CATS as LAYER_CATS, presetDefaults as layerDefaults } from '../../engine/presets.js';
import { TEXT_ANIMS, TEXT_ANIM_CATS, textAnimDefaults } from '../../engine/textanims.js';

const props = defineProps({
  layer: { type: Object, required: true },
  t: { type: Number, required: true },
  edit: { type: Function, required: true },
  kind: { type: String, default: 'layer' },
});

const isText = computed(() => props.kind === 'text');
const field = computed(() => (isText.value ? 'textAnims' : 'anims'));
const PRESETS = computed(() => (isText.value ? TEXT_ANIMS : LAYER_PRESETS));
const PRESET_CATS = computed(() => (isText.value ? TEXT_ANIM_CATS : LAYER_CATS));
const presetDefaults = (id) => (isText.value ? textAnimDefaults(id) : layerDefaults(id));
const list = computed(() => props.layer[field.value] || []);

const CAT_COLORS = { giris: '#6cc28a', cikis: '#e5686d', surekli: '#5aa9e6', hareket: '#b48cf2' };
const byCat = computed(() =>
  Object.keys(PRESET_CATS.value).map((c) => ({
    cat: c,
    label: PRESET_CATS.value[c],
    list: Object.entries(PRESETS.value).filter(([, p]) => p.cat === c).map(([id, p]) => ({ id, name: p.name })),
  })),
);
const r2 = (n) => Math.round(n * 100) / 100;

function add(e) {
  const id = e.target.value;
  e.target.value = '';
  if (!id) return;
  const P = PRESETS.value[id];
  const a = { preset: id, t: r2(props.t), ...presetDefaults(id) };
  if (P.dur) a.dur = P.dur;
  props.edit(() => (props.layer[field.value] ||= []).push(a));
}
function remove(i) {
  props.edit(() => {
    props.layer[field.value].splice(i, 1);
    if (!props.layer[field.value].length) delete props.layer[field.value];
  });
}
function set(a, key, value) {
  props.edit(() => {
    if (value === '' || value === null) delete a[key];
    else a[key] = value;
  }, `anim:${key}`);
}
function numOr(v, fallback) {
  const n = Number(v);
  return v === '' || Number.isNaN(n) ? fallback : n;
}
</script>

<template>
  <div class="anims">
    <div
      v-for="(a, i) in list"
      :key="i"
      class="anim"
      :style="{ borderLeftColor: CAT_COLORS[PRESETS[a.preset]?.cat] || '#888' }"
    >
      <div class="row">
        <strong class="grow">{{ PRESETS[a.preset]?.name || `? ${a.preset}` }}</strong>
        <span class="chip">{{ PRESET_CATS[PRESETS[a.preset]?.cat] }}</span>
        <button class="btn icon sm ghost" :title="a.off ? 'Etkinleştir' : 'Devre dışı bırak'" @click="set(a, 'off', a.off ? null : true)">{{ a.off ? '◌' : '●' }}</button>
        <button class="btn icon sm ghost" title="Sil" @click="remove(i)">✕</button>
      </div>
      <template v-if="PRESETS[a.preset]">
        <div class="grid">
          <label>Başla (sn)</label>
          <div class="row">
            <input type="number" step="0.1" class="input" :value="a.t ?? 0" @input="set(a, 't', numOr($event.target.value, 0))" />
            <button class="btn sm" title="Şu anki zamanı kullan" @click="set(a, 't', r2(t))">⏱</button>
          </div>
          <label>Süre (sn)</label>
          <input
            type="number"
            step="0.1"
            min="0.05"
            class="input"
            :value="a.dur ?? ''"
            :placeholder="PRESETS[a.preset].cat === 'surekli' ? 'sonsuz' : PRESETS[a.preset].dur"
            @input="set(a, 'dur', $event.target.value === '' ? null : numOr($event.target.value, null))"
          />
          <label v-if="isText">Aralık (sn)</label>
          <input
            v-if="isText"
            type="number"
            step="0.01"
            min="0"
            class="input"
            :value="a.aralik ?? PRESETS[a.preset].aralik ?? 0.05"
            title="Ardışık harf / kelime / satır arasındaki gecikme"
            @input="set(a, 'aralik', numOr($event.target.value, null))"
          />
          <template v-for="p in PRESETS[a.preset].params || []" :key="p.key">
            <label :title="p.hint || ''">{{ p.label }}</label>
            <select v-if="p.type === 'select'" class="input" :value="a[p.key] ?? p.def" @change="set(a, p.key, $event.target.value)">
              <option v-for="[v, l] in p.options" :key="v" :value="v">{{ l }}</option>
            </select>
            <input v-else-if="p.type === 'text'" class="input" :value="a[p.key] ?? p.def" :placeholder="p.hint" @change="set(a, p.key, $event.target.value)" />
            <input v-else type="number" class="input" :step="p.step || 1" :value="a[p.key] ?? p.def" @input="set(a, p.key, numOr($event.target.value, p.def))" />
          </template>
        </div>
      </template>
    </div>
    <select class="input add" @change="add">
      <option value="">{{ isText ? '＋ Metin animasyonu ekle…' : '＋ Animasyon ekle (şu anki zamana)…' }}</option>
      <optgroup v-for="g in byCat" :key="g.cat" :label="g.label">
        <option v-for="p in g.list" :key="p.id" :value="p.id">{{ p.name }}</option>
      </optgroup>
    </select>
  </div>
</template>

<style scoped>
.anims { display: grid; gap: 8px; }
.anim { background: var(--bg-2); border: 1px solid var(--line); border-left: 3px solid; border-radius: 8px; padding: 8px; display: grid; gap: 8px; }
.grid { display: grid; grid-template-columns: 84px 1fr; gap: 5px 8px; align-items: center; }
.grid label { font-size: 12px; color: var(--text-2); }
.grid .input { height: 26px; font-size: 12px; }
.add { color: var(--accent-2); }
</style>
