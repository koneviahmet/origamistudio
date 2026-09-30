<script setup>
// Parçacık katmanı ayarları
import { computed } from 'vue';
import { PARTICLE_MODES, particleDef } from '../../engine/particles.js';

const props = defineProps({
  layer: { type: Object, required: true },
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  edit: { type: Function, required: true },
});

const P = computed(() => particleDef(props.layer, props.res));
const effects = computed(() => [...props.res.assets.values()].filter((a) => a.type === 'particles'));
const origami = computed(() => [...props.res.assets.values()].filter((a) => !a.type));
const current = computed(() => props.layer.particle || props.layer.preset || 'konfeti');
function setEffect(id) {
  props.edit(() => {
    props.layer.particle = id;
    delete props.layer.preset;
  });
}
const colors = computed(() => props.layer.colors || P.value.colors);
const REFS = ['$vurgu', '$baslik', '$metin', '$arka1', '$arka2'];

function set(k, v) {
  props.edit(() => {
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete props.layer[k];
    else props.layer[k] = v;
  }, `p:${k}`);
}
const num = (v) => (v === '' ? null : Number(v));
function setColor(i, v) {
  props.edit(() => {
    const c = [...colors.value];
    c[i] = v;
    props.layer.colors = c;
  }, `pc:${i}`);
}
function addColor() {
  props.edit(() => (props.layer.colors = [...colors.value, '#ffffff']));
}
function removeColor(i) {
  props.edit(() => {
    const c = [...colors.value];
    c.splice(i, 1);
    props.layer.colors = c;
  });
}
function resetColors() {
  props.edit(() => delete props.layer.colors);
}
function setArea(i, v) {
  props.edit(() => {
    const a = props.layer.area ? [...props.layer.area] : [0, 0, props.scene.width, props.scene.height];
    a[i] = Number(v);
    props.layer.area = a;
  }, `pa:${i}`);
}
const isRef = (c) => typeof c === 'string' && c[0] === '$';
const hexOf = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff');
</script>

<template>
  <div class="pe">
    <div class="grid2">
      <div class="field">
        <label>Efekt (kütüphane)</label>
        <select class="input" :value="current" @change="setEffect($event.target.value)">
          <option v-if="!effects.some((e) => e.id === current)" :value="current">? {{ current }}</option>
          <option v-for="e in effects" :key="e.id" :value="e.id">{{ e.name || e.id }}</option>
        </select>
      </div>
      <div class="field">
        <label>Mod</label>
        <select class="input" :value="layer.mode || 'surekli'" @change="set('mode', $event.target.value)">
          <option v-for="(l, k) in PARTICLE_MODES" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <div class="field"><label>Adet</label><input type="number" min="1" max="600" class="input" :value="layer.count ?? P.count" @input="set('count', num($event.target.value))" /></div>
      <div class="field"><label>Boyut (px)</label><input type="number" class="input" :value="layer.size ?? P.size" @input="set('size', num($event.target.value))" /></div>
      <div class="field"><label>Hız ×</label><input type="number" step="0.1" class="input" :value="layer.speed ?? 1" @input="set('speed', num($event.target.value))" /></div>
      <div class="field"><label>Rüzgar (px/sn)</label><input type="number" step="10" class="input" :value="layer.wind ?? 0" @input="set('wind', num($event.target.value))" /></div>
      <div class="field"><label>Tohum</label><input type="number" class="input" :value="layer.seed ?? 1" title="Farklı rastgele dağılım" @input="set('seed', num($event.target.value))" /></div>
      <div v-if="layer.mode === 'patlama'" class="field"><label>Ömür (sn)</label><input type="number" step="0.1" class="input" :value="layer.life ?? 3.2" @input="set('life', num($event.target.value))" /></div>
      <label v-else class="row small chk"><input type="checkbox" :checked="layer.prewarm ?? !!P.prewarm" @change="set('prewarm', $event.target.checked)" /> Başta dolu</label>
    </div>

    <div class="field">
      <label>Şekil olarak varlık (ops.)</label>
      <select class="input" :value="layer.asset || ''" @change="set('asset', $event.target.value)">
        <option value="">efektin şekli{{ P.asset ? ` (${P.asset})` : '' }}</option>
        <option v-for="a in origami" :key="a.id" :value="a.id">{{ a.name || a.id }}</option>
      </select>
    </div>

    <div class="field">
      <label>Renkler <button v-if="layer.colors" class="btn sm ghost" @click="resetColors">↺ ön ayar</button></label>
      <div class="row wrap">
        <div v-for="(c, i) in colors" :key="i" class="cc">
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

    <div v-if="(layer.mode || 'surekli') === 'surekli'" class="field">
      <label>Doğma alanı x · y · genişlik · yükseklik <span class="dim">(boş: ön ayara göre)</span></label>
      <div class="row">
        <input v-for="(d, i) in ['x', 'y', 'g', 'y']" :key="i" type="number" class="input" :placeholder="d" :value="layer.area?.[i] ?? ''" @change="setArea(i, $event.target.value)" />
        <button v-if="layer.area" class="btn icon sm ghost" title="Varsayılan alan" @click="set('area', null)">↺</button>
      </div>
    </div>
    <p v-else class="dim small">Patlama merkezi katmanın x / y değeridir; başlangıç zamanı katmanın "Başlangıç"ıdır.</p>
  </div>
</template>

<style scoped>
.pe { display: grid; gap: 10px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.chk { height: 30px; align-self: end; }
.wrap { flex-wrap: wrap; gap: 4px; }
.cc { display: flex; align-items: center; gap: 2px; }
.ref { width: 78px; height: 26px; font-size: 11px; padding: 0 2px; }
</style>
