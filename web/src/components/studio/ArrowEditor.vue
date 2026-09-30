<script setup>
// Ok katmanı ayarları: stil (kütüphane), uçlar, etiket, yolcu ve stil geçersiz kılmaları
import { computed } from 'vue';
import { ARROW_ANCHORS, ARROW_STYLE_KEYS, RIDER_ORIENTS, arrowDef } from '../../engine/arrows.js';
import ArrowStyleFields from '../ArrowStyleFields.vue';
import PropRow from './PropRow.vue';

const props = defineProps({
  layer: { type: Object, required: true },
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  t: { type: Number, required: true },
  eps: { type: Number, required: true },
  edit: { type: Function, required: true },
});

const styles = computed(() => [...props.res.assets.values()].filter((a) => a.type === 'arrow'));
const origami = computed(() => [...props.res.assets.values()].filter((a) => !a.type));
const targets = computed(() => (props.scene.layers || []).filter((l) => l.id !== props.layer.id && l.type !== 'arrow'));
const def = computed(() => arrowDef(props.layer, props.res));
const overridden = computed(() => ARROW_STYLE_KEYS.filter((k) => props.layer[k] !== undefined));

function set(k, v) {
  props.edit(() => {
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete props.layer[k];
    else props.layer[k] = v;
  }, `a:${k}`);
}
function setStyle(k, v) {
  set(k, v);
}
function resetStyle() {
  props.edit(() => {
    for (const k of ARROW_STYLE_KEYS) delete props.layer[k];
  });
}

// ---------------------------------------------------------------- uçlar
const isFree = (end) => Array.isArray(props.layer[end]);
function setEnd(end, v) {
  props.edit(() => {
    if (v === '__serbest') {
      const W = props.scene.width;
      const H = props.scene.height;
      props.layer[end] = end === 'from' ? [Math.round(W * 0.3), Math.round(H * 0.5)] : [Math.round(W * 0.7), Math.round(H * 0.5)];
    } else props.layer[end] = v;
  });
}
function setPt(end, i, v) {
  props.edit(() => {
    const p = [...props.layer[end]];
    p[i] = Number(v);
    props.layer[end] = p;
  }, `pt:${end}${i}`);
}
function swap() {
  props.edit(() => {
    const L = props.layer;
    [L.from, L.to] = [L.to, L.from];
    [L.fromAnchor, L.toAnchor] = [L.toAnchor, L.fromAnchor];
    if (!L.fromAnchor) delete L.fromAnchor;
    if (!L.toAnchor) delete L.toAnchor;
  });
}

// ---------------------------------------------------------------- yolcu
function setRider(k, v) {
  props.edit(() => {
    if (k === 'asset' && !v) {
      delete props.layer.rider;
      delete props.layer.ride;
      return;
    }
    const r = { ...(props.layer.rider || { scale: 0.4, orient: 'cevir' }) };
    if (v === '' || v === null || Number.isNaN(v)) delete r[k];
    else r[k] = v;
    props.layer.rider = r;
  }, `r:${k}`);
}
function separateRide() {
  const t0 = Math.round(props.t * 10) / 10;
  props.edit(() => (props.layer.ride = [{ t: t0, v: 0 }, { t: t0 + 1.8, v: 1, ease: 'inOutSine' }]));
}
</script>

<template>
  <div class="ae">
    <div class="field">
      <label>Ok stili (kütüphane)</label>
      <select class="input" :value="layer.arrow || ''" @change="set('arrow', $event.target.value)">
        <option v-if="!styles.some((s) => s.id === layer.arrow)" :value="layer.arrow || ''">? {{ layer.arrow || '(yok)' }}</option>
        <option v-for="s in styles" :key="s.id" :value="s.id">{{ s.name || s.id }}</option>
      </select>
    </div>

    <div v-for="end in ['from', 'to']" :key="end" class="end">
      <div class="row">
        <span class="lbl">{{ end === 'from' ? 'Başlangıç' : 'Bitiş' }}</span>
        <select class="input grow" :value="isFree(end) ? '__serbest' : layer[end] || ''" @change="setEnd(end, $event.target.value)">
          <option value="__serbest">⌖ Serbest nokta</option>
          <option v-if="!isFree(end) && layer[end] && !targets.some((l) => l.id === layer[end])" :value="layer[end]">? {{ layer[end] }}</option>
          <option v-for="l in targets" :key="l.id" :value="l.id">{{ l.type === 'text' ? 'T' : '◆' }} {{ l.id }}</option>
        </select>
      </div>
      <div class="row">
        <template v-if="isFree(end)">
          <input type="number" class="input" :value="layer[end][0]" title="x" @input="setPt(end, 0, $event.target.value)" />
          <input type="number" class="input" :value="layer[end][1]" title="y" @input="setPt(end, 1, $event.target.value)" />
        </template>
        <select v-else class="input grow" :value="layer[end + 'Anchor'] || 'auto'" title="Bağlantı noktası" @change="set(end + 'Anchor', $event.target.value === 'auto' ? null : $event.target.value)">
          <option v-for="(l, k) in ARROW_ANCHORS" :key="k" :value="k">bağlantı: {{ l }}</option>
        </select>
      </div>
    </div>
    <button class="btn sm" title="Başlangıç ve bitişi değiştir" @click="swap">⇅ Yönü çevir</button>

    <div class="props">
      <PropRow :obj="layer" name="fold" label="çizim" :t="t" :eps="eps" :step="0.05" :min="0" :max="1" :edit="edit" />
    </div>

    <div class="field">
      <label>Etiket <span class="dim">(ok üzerinde; ör. yıl, fiil)</span></label>
      <input class="input" :value="layer.label || ''" placeholder="ör. 1683 · Viyana'ya" @input="set('label', $event.target.value)" />
    </div>
    <div v-if="layer.label" class="field">
      <label>Etiket konumu {{ (layer.labelPos ?? 0.5).toFixed(2) }}</label>
      <input type="range" min="0" max="1" step="0.05" :value="layer.labelPos ?? 0.5" @input="set('labelPos', Number($event.target.value))" />
    </div>

    <div class="field">
      <label>Yolcu <span class="dim">(ok boyunca taşınan nesne)</span></label>
      <select class="input" :value="layer.rider?.asset || ''" @change="setRider('asset', $event.target.value)">
        <option value="">(yok)</option>
        <option v-for="a in origami" :key="a.id" :value="a.id">{{ a.name || a.id }}</option>
      </select>
    </div>
    <template v-if="layer.rider?.asset">
      <div class="grid2">
        <div class="field"><label>Ölçek</label><input type="number" step="0.05" class="input" :value="layer.rider.scale ?? 0.4" @input="setRider('scale', Number($event.target.value))" /></div>
        <div class="field">
          <label>Yön</label>
          <select class="input" :value="layer.rider.orient || 'cevir'" @change="setRider('orient', $event.target.value)">
            <option v-for="(l, k) in RIDER_ORIENTS" :key="k" :value="k">{{ l }}</option>
          </select>
        </div>
      </div>
      <div v-if="layer.ride !== undefined" class="props">
        <PropRow :obj="layer" name="ride" label="yolculuk" :t="t" :eps="eps" :step="0.05" :min="0" :max="1" :edit="edit" />
        <button class="btn sm ghost" @click="set('ride', null)">Çizimi izlesin</button>
      </div>
      <p v-else class="dim small">
        Yolcu çizim ucunu izler.
        <button class="btn sm" @click="separateRide">Ayrı zamanla (t'den 1.8 sn)</button>
      </p>
    </template>

    <div class="sec-title">
      Stil ayarları
      <span class="dim small">· {{ overridden.length ? `${overridden.length} alan bu katmana özel` : 'kütüphane stilinden' }}</span>
      <button v-if="overridden.length" class="btn sm ghost" @click="resetStyle">↺ tümü</button>
    </div>
    <ArrowStyleFields :value="def" :own="layer" :set="setStyle" />
  </div>
</template>

<style scoped>
.ae { display: grid; gap: 10px; }
.end { display: grid; gap: 4px; }
.lbl { width: 70px; font-size: 12px; color: var(--dim, #999); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
input[type='range'] { width: 100%; }
</style>
