<script setup>
// Görsel facet (yüzey) editörü — AssetCanvas'ın üstüne bindirilen SVG katmanı.
// Varlık koordinatlarında çalışır; AssetCanvas ile aynı sığdırma formülünü kullanır.
import { computed, onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import { hitFacet, invalidateAsset } from '../engine/origami.js';

const props = defineProps({
  asset: { type: Object, required: true },
  selected: { type: Number, default: -1 },
  pad: { type: Number, default: 0.06 },
  mode: { type: String, default: 'sec' }, // sec | ciz
  grid: { type: Number, default: 5 }, // 0 = kapalı
  linked: { type: Boolean, default: true },
  mirror: { type: Boolean, default: false },
  color: { type: String, default: 'a' },
});
const emit = defineEmits(['select', 'change', 'done']);

const wrap = ref(null);
const box = ref({ w: 100, h: 100 });
let ro;
onMounted(() => {
  ro = new ResizeObserver(() => (box.value = { w: wrap.value.clientWidth, h: wrap.value.clientHeight }));
  ro.observe(wrap.value);
  window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  ro?.disconnect();
  window.removeEventListener('keydown', onKey);
});

const size = computed(() => props.asset.size || [200, 200]);
const fit = computed(() => {
  const [aw, ah] = size.value;
  const k = Math.min(box.value.w / aw, box.value.h / ah) * (1 - props.pad * 2);
  return { k, ox: (box.value.w - aw * k) / 2, oy: (box.value.h - ah * k) / 2 };
});
const hs = computed(() => 5 / fit.value.k); // tutamak yarıçapı (varlık birimi)
const facet = computed(() => (props.selected >= 0 ? props.asset.facets[props.selected] : null));
const parts = computed(() => Object.entries(props.asset.parts || {}));
const r1 = (v) => Math.round(v * 10) / 10;

function toAsset(e) {
  const r = wrap.value.getBoundingClientRect();
  return [(e.clientX - r.left - fit.value.ox) / fit.value.k, (e.clientY - r.top - fit.value.oy) / fit.value.k];
}

/** Mıknatıs: önce yakındaki başka bir noktaya, sonra ızgaraya */
function snap([x, y], e, skip) {
  if (e?.shiftKey) return [r1(x), r1(y)];
  const lim = 7 / fit.value.k;
  let best = null;
  let bd = lim;
  props.asset.facets.forEach((f, fi) =>
    f.p.forEach((q, qi) => {
      if (skip?.some(([a, b]) => a === fi && b === qi)) return;
      const d = Math.hypot(q[0] - x, q[1] - y);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }),
  );
  if (best) return [best[0], best[1]];
  if (props.grid > 0) return [Math.round(x / props.grid) * props.grid, Math.round(y / props.grid) * props.grid];
  return [r1(x), r1(y)];
}

function changed() {
  invalidateAsset(toRaw(props.asset));
  emit('change');
}

// ------------------------------------------------------------- sürükleme
let drag = null;

/** Bir noktayla çakışan tüm (yüzey, nokta) çiftleri */
function coincident(x, y) {
  const out = [];
  props.asset.facets.forEach((f, fi) => f.p.forEach((q, qi) => Math.hypot(q[0] - x, q[1] - y) < 0.01 && out.push([fi, qi])));
  return out;
}

function startVertex(e, qi) {
  e.stopPropagation();
  if (e.button === 2 || e.altKey) return removeVertex(qi);
  const p = facet.value.p[qi];
  const targets = props.linked ? coincident(p[0], p[1]) : [[props.selected, qi]];
  // Simetri: aynadaki eş nokta(lar) da hareket etsin
  const [aw] = size.value;
  const mirrors = props.mirror && Math.abs(p[0] - aw / 2) > 0.01 ? coincident(aw - p[0], p[1]) : [];
  drag = { kind: 'v', targets, mirrors, aw };
  listen();
}
function startPivot(e, name) {
  e.stopPropagation();
  drag = { kind: 'pivot', name };
  listen();
}
function listen() {
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, { once: true });
}
function onMove(e) {
  if (!drag) return;
  const [x, y] = snap(toAsset(e), e, drag.targets);
  if (drag.kind === 'v') {
    for (const [fi, qi] of drag.targets) props.asset.facets[fi].p[qi] = [x, y];
    for (const [fi, qi] of drag.mirrors) props.asset.facets[fi].p[qi] = [r1(drag.aw - x), y];
  } else if (drag.kind === 'pivot') {
    props.asset.parts[drag.name].pivot = [x, y];
  }
  changed();
}
function onUp() {
  window.removeEventListener('pointermove', onMove);
  drag = null;
}

function insertVertex(e, qi) {
  e.stopPropagation();
  const p = facet.value.p;
  const a = p[qi];
  const b = p[(qi + 1) % p.length];
  p.splice(qi + 1, 0, [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)]);
  changed();
}
function removeVertex(qi) {
  const p = facet.value.p;
  if (p.length <= 3) return;
  p.splice(qi, 1);
  changed();
}

// ------------------------------------------------------------- seçim / çizim
const draft = ref([]);
const hover = ref(null);

function onDown(e) {
  if (e.button !== 0) return;
  const pt = toAsset(e);
  if (props.mode === 'ciz') {
    const q = snap(pt, e);
    if (draft.value.length >= 3 && Math.hypot(q[0] - draft.value[0][0], q[1] - draft.value[0][1]) < 8 / fit.value.k) return finish();
    draft.value = [...draft.value, q];
    return;
  }
  emit('select', hitFacet(toRaw(props.asset), pt[0], pt[1]));
}
function onHover(e) {
  hover.value = props.mode === 'ciz' ? snap(toAsset(e), e) : null;
}

function finish() {
  if (draft.value.length < 3) return;
  const p = draft.value.map((q) => [...q]);
  const f = { p, c: props.color, s: 0.06 };
  props.asset.facets.push(f);
  let idx = props.asset.facets.length - 1;
  if (props.mirror) {
    const [aw] = size.value;
    const mp = p.map(([x, y]) => [r1(aw - x), y]).reverse();
    // Ekseni geçmeyen yüzeyler için aynalı kopya (ışık tersine döner)
    if (mp.some(([x], i) => Math.abs(x - p[p.length - 1 - i][0]) > 0.01)) {
      props.asset.facets.push({ p: mp, c: props.color, s: -0.12 });
    }
  }
  draft.value = [];
  changed();
  emit('select', idx);
  emit('done');
}

function onKey(e) {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  if (props.mode === 'ciz') {
    if (e.key === 'Enter') finish();
    if (e.key === 'Escape') draft.value = [];
    if (e.key === 'Backspace') draft.value = draft.value.slice(0, -1);
    return;
  }
  // Ok tuşları: seçili yüzeyi kaydır (Shift: 5 birim)
  if (facet.value && e.key.startsWith('Arrow')) {
    e.preventDefault();
    const d = e.shiftKey ? 5 : 1;
    const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0;
    const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0;
    facet.value.p = facet.value.p.map(([x, y]) => [r1(x + dx), r1(y + dy)]);
    changed();
  }
}

const pts = (p) => p.map((q) => q.join(',')).join(' ');
</script>

<template>
  <div ref="wrap" class="fe" :class="mode">
    <svg :viewBox="`0 0 ${box.w} ${box.h}`" @pointerdown="onDown" @pointermove="onHover" @contextmenu.prevent>
      <g :transform="`translate(${fit.ox} ${fit.oy}) scale(${fit.k})`">
        <!-- ızgara -->
        <g v-if="grid > 0 && fit.k * grid >= 6" class="grid">
          <line v-for="i in Math.floor(size[0] / grid) + 1" :key="'x' + i" :x1="(i - 1) * grid" :x2="(i - 1) * grid" y1="0" :y2="size[1]" />
          <line v-for="i in Math.floor(size[1] / grid) + 1" :key="'y' + i" y1="0" :x1="0" :x2="size[0]" :y1="(i - 1) * grid" :y2="(i - 1) * grid" />
        </g>
        <line v-if="mirror" class="axis" :x1="size[0] / 2" :x2="size[0] / 2" y1="0" :y2="size[1]" />

        <!-- tüm yüzeylerin ince hatları -->
        <polygon v-for="(f, i) in asset.facets" :key="'o' + i" class="outline" :points="pts(f.p)" />

        <!-- seçili yüzey -->
        <template v-if="facet && mode === 'sec'">
          <polygon class="sel" :points="pts(facet.p)" />
          <circle
            v-for="(q, qi) in facet.p"
            :key="'m' + qi"
            class="mid"
            :cx="(q[0] + facet.p[(qi + 1) % facet.p.length][0]) / 2"
            :cy="(q[1] + facet.p[(qi + 1) % facet.p.length][1]) / 2"
            :r="hs * 0.7"
            @pointerdown="insertVertex($event, qi)"
          ><title>Nokta ekle</title></circle>
          <circle
            v-for="(q, qi) in facet.p"
            :key="'v' + qi"
            class="vtx"
            :cx="q[0]"
            :cy="q[1]"
            :r="hs"
            @pointerdown="startVertex($event, qi)"
          ><title>Sürükle: taşı · Shift: mıknatıssız · Sağ tık / Alt+tık: sil</title></circle>
        </template>

        <!-- parça pivotları -->
        <g v-for="[name, pdef] in parts" :key="name" class="pivot" @pointerdown="startPivot($event, name)">
          <circle :cx="pdef.pivot?.[0] ?? size[0] / 2" :cy="pdef.pivot?.[1] ?? size[1] / 2" :r="hs * 1.3" />
          <line :x1="(pdef.pivot?.[0] ?? size[0] / 2) - hs * 2" :x2="(pdef.pivot?.[0] ?? size[0] / 2) + hs * 2" :y1="pdef.pivot?.[1] ?? size[1] / 2" :y2="pdef.pivot?.[1] ?? size[1] / 2" />
          <line :y1="(pdef.pivot?.[1] ?? size[1] / 2) - hs * 2" :y2="(pdef.pivot?.[1] ?? size[1] / 2) + hs * 2" :x1="pdef.pivot?.[0] ?? size[0] / 2" :x2="pdef.pivot?.[0] ?? size[0] / 2" />
          <text :x="(pdef.pivot?.[0] ?? size[0] / 2) + hs * 2" :y="(pdef.pivot?.[1] ?? size[1] / 2) - hs * 1.5" :font-size="hs * 2.4">{{ name }}</text>
          <title>{{ name }} pivotu — sürükle</title>
        </g>

        <!-- çizim taslağı -->
        <template v-if="mode === 'ciz'">
          <polyline v-if="draft.length" class="draft" :points="pts(hover ? [...draft, hover] : draft)" />
          <circle v-for="(q, i) in draft" :key="'d' + i" class="dpt" :class="{ first: i === 0 }" :cx="q[0]" :cy="q[1]" :r="hs * (i === 0 ? 1.2 : 0.8)" />
          <circle v-if="hover" class="hov" :cx="hover[0]" :cy="hover[1]" :r="hs * 0.6" />
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.fe { position: absolute; inset: 0; }
.fe.ciz { cursor: crosshair; }
svg { width: 100%; height: 100%; display: block; }
.grid line { stroke: rgba(0, 0, 0, .07); stroke-width: .3; vector-effect: non-scaling-stroke; }
.axis { stroke: #7c5cff; stroke-dasharray: 4 3; stroke-width: 1; vector-effect: non-scaling-stroke; }
.outline { fill: none; stroke: rgba(0, 0, 0, .18); stroke-width: .6; vector-effect: non-scaling-stroke; pointer-events: none; }
.sel { fill: rgba(34, 211, 238, .12); stroke: #22d3ee; stroke-width: 2; vector-effect: non-scaling-stroke; pointer-events: none; }
.vtx { fill: #fff; stroke: #0e7490; stroke-width: 1.5; vector-effect: non-scaling-stroke; cursor: move; }
.vtx:hover { fill: #22d3ee; }
.mid { fill: rgba(34, 211, 238, .5); stroke: none; cursor: copy; }
.mid:hover { fill: #22d3ee; }
.pivot { cursor: move; }
.pivot circle { fill: rgba(234, 122, 59, .25); stroke: #ea7a3b; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.pivot line { stroke: #ea7a3b; stroke-width: 1.2; vector-effect: non-scaling-stroke; }
.pivot text { fill: #b8521f; font-family: Inter, sans-serif; font-weight: 600; paint-order: stroke; stroke: #fff; stroke-width: .6; }
.draft { fill: rgba(124, 92, 255, .15); stroke: #7c5cff; stroke-width: 2; stroke-dasharray: 5 3; vector-effect: non-scaling-stroke; pointer-events: none; }
.dpt { fill: #7c5cff; pointer-events: none; }
.dpt.first { fill: #fff; stroke: #7c5cff; stroke-width: 2; vector-effect: non-scaling-stroke; }
.hov { fill: rgba(124, 92, 255, .6); pointer-events: none; }
</style>
