<script setup>
// Fontları kendi yazı tipleriyle gösteren, aranabilir seçici.
import { computed, nextTick, ref } from 'vue';
import { resources } from '../resources.js';
import { FONT_CAT_LABELS } from '../fonts.js';

const props = defineProps({ modelValue: { type: String, default: '' }, placeholder: { type: String, default: 'Baloo 2' } });
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const q = ref('');
const search = ref(null);

const groups = computed(() => {
  const s = q.value.trim().toLocaleLowerCase('tr');
  const out = {};
  for (const f of resources.value.fonts) {
    if (s && !f.family.toLocaleLowerCase('tr').includes(s)) continue;
    (out[f.category] ||= []).push(f);
  }
  return Object.keys(FONT_CAT_LABELS).filter((c) => out[c]).map((c) => ({ cat: c, label: FONT_CAT_LABELS[c], list: out[c] }));
});
const current = computed(() => resources.value.fonts.find((f) => f.family === props.modelValue));
const trBad = (f) => !f.latinExt || f.check?.ok === false;

function toggle() {
  open.value = !open.value;
  if (open.value) nextTick(() => search.value?.focus());
}
function pick(f) {
  emit('update:modelValue', f ? f.family : '');
  open.value = false;
  q.value = '';
}
</script>

<template>
  <div class="fp">
    <button type="button" class="input trigger" :style="{ fontFamily: `'${modelValue || placeholder}'` }" @click="toggle">
      <span class="grow">{{ modelValue || `${placeholder} (varsayılan)` }}</span>
      <span v-if="current && trBad(current)" class="warn" title="Türkçe karakter desteği eksik">⚠ TR</span>
      <span class="dim">▾</span>
    </button>
    <div v-if="open" class="menu" @keydown.stop @keydown.esc="open = false">
      <input ref="search" v-model="q" class="input" placeholder="Font ara…" />
      <div class="list">
        <button type="button" class="item" @click="pick(null)"><span class="dim">Stil / varsayılan</span></button>
        <template v-for="g in groups" :key="g.cat">
          <div class="cat">{{ g.label }}</div>
          <button
            v-for="f in g.list"
            :key="f.family"
            type="button"
            class="item"
            :class="{ on: f.family === modelValue }"
            @click="pick(f)"
          >
            <span class="name" :style="{ fontFamily: `'${f.family}'` }">{{ f.family }}</span>
            <span class="sample" :style="{ fontFamily: `'${f.family}'` }">Ğğ Şş İı</span>
            <span v-if="trBad(f)" class="warn" title="Türkçe karakter desteği eksik">⚠</span>
          </button>
        </template>
      </div>
    </div>
    <div v-if="open" class="shade" @click="open = false" />
  </div>
</template>

<style scoped>
.fp { position: relative; }
.trigger { display: flex; align-items: center; gap: 6px; text-align: left; cursor: pointer; font-size: 15px; }
.menu {
  position: absolute; z-index: 20; top: 34px; left: 0; right: 0; min-width: 260px;
  background: var(--panel); border: 1px solid var(--line-2); border-radius: 8px; padding: 6px;
  box-shadow: 0 16px 40px rgba(0,0,0,.5); display: grid; gap: 6px;
}
.list { max-height: 340px; overflow: auto; display: grid; }
.cat { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); padding: 8px 6px 2px; }
.item { display: flex; align-items: center; gap: 8px; background: none; border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; text-align: left; }
.item:hover { background: var(--panel-2); }
.item.on { background: #3a281b; }
.name { flex: 1; font-size: 17px; }
.sample { color: var(--text-3); font-size: 14px; }
.warn { color: var(--warn); font-size: 11px; }
.shade { position: fixed; inset: 0; z-index: 19; }
</style>
