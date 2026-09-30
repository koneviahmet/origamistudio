<script setup>
import { computed, ref } from 'vue';
import { resources } from '../../resources.js';
import { toast } from '../../toast.js';
import { PRESETS, PRESET_CATS, presetDefaults } from '../../engine/presets.js';
import { STYLES } from '../../engine/styles.js';
import { TEXT_ANIMS, TEXT_ANIM_CATS, textAnimDefaults } from '../../engine/textanims.js';
import ParticlePreview from '../ParticlePreview.vue';
import RenderBox from './RenderBox.vue';

const assetId = ref('tilki');
const style = ref('origami');
const hover = ref('');
const CAT_COLORS = { giris: '#6cc28a', cikis: '#e5686d', surekli: '#5aa9e6', hareket: '#b48cf2' };
const SPECIAL = { 'kanat-cirp': 'turna', 'kuyruk-salla': 'balik' };

const groups = computed(() =>
  Object.keys(PRESET_CATS).map((c) => ({
    cat: c,
    label: PRESET_CATS[c],
    list: Object.entries(PRESETS).filter(([, p]) => p.cat === c).map(([id, p]) => ({ id, ...p })),
  })),
);

function loopLen(p) {
  if (p.cat === 'giris') return 0.4 + p.dur + 1.2;
  if (p.cat === 'cikis') return 0.8 + p.dur + 0.6;
  if (p.cat === 'hareket') return Math.min(p.dur, 4) + 0.4;
  return 4;
}
function anim(p) {
  const a = { preset: p.id, t: p.cat === 'cikis' ? 0.8 : p.cat === 'hareket' ? 0.2 : 0.4, ...presetDefaults(p.id) };
  if (p.dur) a.dur = p.cat === 'hareket' ? Math.min(p.dur, 4) : p.dur;
  return a;
}
function scene(p) {
  const id = SPECIAL[p.id] && resources.value.assets.has(SPECIAL[p.id]) ? SPECIAL[p.id] : assetId.value;
  const a = resources.value.assets.get(id);
  const size = a ? Math.max(...a.size) : 200;
  return {
    width: 400,
    height: 400,
    fps: 30,
    duration: loopLen(p),
    style: style.value,
    background: { type: 'radial', colors: ['#fdf3e4', '#efd2ae'], paper: 0.3, vignette: 0.1 },
    layers: [{ id: 'a', asset: id, x: 200, y: 200, scale: 230 / size, anims: [anim(p)] }],
  };
}
// Metin animasyonları
const textGroups = computed(() =>
  Object.keys(TEXT_ANIM_CATS).map((c) => ({
    cat: c,
    label: `Metin · ${TEXT_ANIM_CATS[c]}`,
    list: Object.entries(TEXT_ANIMS).filter(([, p]) => p.cat === c).map(([id, p]) => ({ id, ...p })),
  })),
);
const textLoop = (p) => (p.cat === 'surekli' ? 3 : p.cat === 'cikis' ? 2.6 : 2.4);
function textScene(p) {
  const a = { preset: p.id, t: p.cat === 'cikis' ? 0.8 : 0.3, ...textAnimDefaults(p.id) };
  return {
    width: 400, height: 400, fps: 30, duration: textLoop(p),
    background: { type: 'radial', colors: ['#fdf3e4', '#efd2ae'], paper: 0.3, vignette: 0.1 },
    layers: [{ id: 't', type: 'text', text: 'Kağıt\nDünya', x: 200, y: 200, size: 90, weight: 800, color: '#c8553d', textAnims: [a] }],
  };
}
// Parçacık efektleri artık kütüphane öğesidir
const effects = computed(() => [...resources.value.assets.values()].filter((a) => a.type === 'particles'));
const origamiAssets = computed(() => [...resources.value.assets.values()].filter((a) => !a.type));

function snippet(p) {
  return JSON.stringify(anim(p));
}
async function copy(p) {
  try {
    await navigator.clipboard.writeText(snippet(p));
    toast('JSON kopyalandı', 'ok', 1500);
  } catch {
    toast(snippet(p));
  }
}
</script>

<template>
  <div class="presets">
    <div class="bar row">
      <span class="dim small">Önizleme modeli</span>
      <select v-model="assetId" class="input" style="width: 180px">
        <option v-for="a in origamiAssets" :key="a.id" :value="a.id">{{ a.name || a.id }}</option>
      </select>
      <select v-model="style" class="input" style="width: 160px">
        <option v-for="(st, k) in STYLES" :key="k" :value="k">{{ st.label }}</option>
      </select>
      <div class="grow" />
      <span class="dim small">Kartın üzerine gelince oynar. Stüdyoda: katman → Animasyonlar → ＋</span>
    </div>
    <div v-for="g in textGroups" :key="g.cat" class="group">
      <h3 :style="{ color: CAT_COLORS[g.cat] }">{{ g.label }}</h3>
      <div class="grid">
        <div v-for="p in g.list" :key="p.id" class="card" @mouseenter="hover = 'tx-' + p.id" @mouseleave="hover = ''">
          <div class="pv"><RenderBox :scene="textScene(p)" :res="resources" :animate="hover === 'tx-' + p.id" :loop="textLoop(p)" :t="textLoop(p) * 0.45" /></div>
          <strong>{{ p.name }}</strong>
          <code>"textAnims": [{ "preset": "{{ p.id }}" }]</code>
        </div>
      </div>
    </div>
    <div class="group">
      <h3 style="color: #f2c14e">Parçacık efektleri <span class="dim small">(Kütüphane → Efektler'de düzenlenir)</span></h3>
      <div class="grid">
        <div v-for="e in effects" :key="e.id" class="card" @mouseenter="hover = 'pa-' + e.id" @mouseleave="hover = ''">
          <div class="pv"><ParticlePreview :item="e" :animate="hover === 'pa-' + e.id" /></div>
          <strong>{{ e.name }}</strong>
          <code>"particle": "{{ e.id }}"</code>
        </div>
      </div>
    </div>
    <div v-for="g in groups" :key="g.cat" class="group">
      <h3 :style="{ color: CAT_COLORS[g.cat] }">{{ g.label }}</h3>
      <div class="grid">
        <div v-for="p in g.list" :key="p.id" class="card" @mouseenter="hover = p.id" @mouseleave="hover = ''">
          <div class="pv"><RenderBox :scene="scene(p)" :res="resources" :animate="hover === p.id" :loop="loopLen(p)" :t="loopLen(p) * 0.6" /></div>
          <div class="row">
            <strong class="grow">{{ p.name }}</strong>
            <button class="btn sm" title="JSON'u kopyala" @click="copy(p)">{ }</button>
          </div>
          <code>{{ p.id }}</code>
          <div class="dim small">{{ p.params.map((x) => x.label).join(' · ') || 'parametresiz' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.presets { height: 100%; overflow: auto; }
.bar { padding: 10px 16px; border-bottom: 1px solid var(--line); gap: 8px; position: sticky; top: 0; background: var(--bg); z-index: 2; }
.group { padding: 8px 16px; }
h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; margin: 8px 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 8px; display: grid; gap: 4px; }
.card:hover { border-color: var(--line-2); }
.pv { aspect-ratio: 1; }
code { font-family: var(--mono); font-size: 11px; color: var(--accent-2); }
</style>
