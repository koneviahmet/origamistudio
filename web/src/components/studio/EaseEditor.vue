<script setup>
// Easing eğri editörü: adlandırılmış eğriler + özel kübik Bézier [x1, y1, x2, y2]
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ease, isBezier, EASE_NAMES, BEZIER_PRESETS } from '../../engine/easing.js';

const props = defineProps({ modelValue: { type: [String, Array], default: 'inOutCubic' } });
const emit = defineEmits(['update:modelValue', 'close']);

const val = computed(() => props.modelValue || 'inOutCubic');
const bez = computed(() => (isBezier(val.value) ? val.value : null));

// Grafik alanı: x 0..1 → 24..196, y -0.5..1.5 → 206..14
const W = 220;
const H = 220;
const X = (x) => 24 + x * 172;
const Y = (y) => 206 - (y + 0.5) * 96;
const invX = (px) => (px - 24) / 172;
const invY = (py) => (206 - py) / 96 - 0.5;

const curvePath = (e, n = 64) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = i / n;
    return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(ease(e, x)).toFixed(1)}`;
  }).join(' ');
const mini = (e) =>
  Array.from({ length: 25 }, (_, i) => {
    const x = i / 24;
    const y = ease(e, x);
    return `${i ? 'L' : 'M'}${(4 + x * 40).toFixed(1)},${(38 - (y + 0.3) * 26).toFixed(1)}`;
  }).join(' ');

const r2 = (v) => Math.round(v * 100) / 100;
function set(v) {
  emit('update:modelValue', v);
}
function setComp(i, v) {
  const b = [...(bez.value || [0.42, 0, 0.58, 1])];
  b[i] = i % 2 === 0 ? Math.max(0, Math.min(1, v)) : Math.max(-1, Math.min(2, v));
  set(b.map(r2));
}

// Tutamak sürükleme
const svg = ref(null);
let drag = -1;
function down(i, e) {
  e.preventDefault();
  drag = i;
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up, { once: true });
}
function move(e) {
  if (drag < 0) return;
  const r = svg.value.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * W;
  const py = ((e.clientY - r.top) / r.height) * H;
  const b = [...bez.value];
  b[drag * 2] = r2(Math.max(0, Math.min(1, invX(px))));
  b[drag * 2 + 1] = r2(Math.max(-1, Math.min(2, invY(py))));
  set(b);
}
function up() {
  drag = -1;
  window.removeEventListener('pointermove', move);
}

// Önizleme: eğriyi izleyen top
const phase = ref(0);
let raf = 0;
let t0 = 0;
function tick(now) {
  if (!t0) t0 = now;
  const s = ((now - t0) / 1000) % 1.6;
  phase.value = Math.min(1, s / 1.2);
  raf = requestAnimationFrame(tick);
}
onMounted(() => (raf = requestAnimationFrame(tick)));
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('pointermove', move);
});
const dot = computed(() => ({ x: X(phase.value), y: Y(ease(val.value, phase.value)) }));
const barX = computed(() => 24 + ease(val.value, phase.value) * 172);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
</script>

<template>
  <div class="ee" @pointerdown.stop @keydown.stop>
    <div class="row head">
      <strong class="grow">Easing eğrisi</strong>
      <button class="btn icon sm ghost" @click="emit('close')">✕</button>
    </div>
    <div class="main">
      <div>
        <svg ref="svg" :viewBox="`0 0 ${W} ${H}`" class="plot">
          <rect :x="X(0)" :y="Y(1)" :width="X(1) - X(0)" :height="Y(0) - Y(1)" class="area" />
          <line :x1="X(0)" :y1="Y(0)" :x2="X(1)" :y2="Y(0)" class="axis" />
          <line :x1="X(0)" :y1="Y(1)" :x2="X(1)" :y2="Y(1)" class="axis" />
          <path :d="curvePath(val)" class="curve" />
          <template v-if="bez">
            <line :x1="X(0)" :y1="Y(0)" :x2="X(bez[0])" :y2="Y(bez[1])" class="arm" />
            <line :x1="X(1)" :y1="Y(1)" :x2="X(bez[2])" :y2="Y(bez[3])" class="arm" />
            <circle :cx="X(bez[0])" :cy="Y(bez[1])" r="7" class="h" @pointerdown="down(0, $event)" />
            <circle :cx="X(bez[2])" :cy="Y(bez[3])" r="7" class="h" @pointerdown="down(1, $event)" />
          </template>
          <circle :cx="dot.x" :cy="dot.y" r="4" class="dot" />
          <line :x1="X(0)" :y1="214" :x2="X(1)" :y2="214" class="track" />
          <circle :cx="barX" cy="214" r="4" class="dot2" />
        </svg>
        <div v-if="bez" class="nums">
          <input v-for="i in 4" :key="i" type="number" step="0.05" class="input" :value="bez[i - 1]" @change="setComp(i - 1, Number($event.target.value))" />
        </div>
        <div v-else class="row">
          <span class="dim small grow">{{ val }}</span>
          <button class="btn sm" @click="set([0.42, 0, 0.58, 1])">Özel eğri</button>
        </div>
      </div>
      <div class="presets">
        <div class="label">Hazır</div>
        <div class="grid">
          <button v-for="n in EASE_NAMES" :key="n" class="pre" :class="{ on: val === n }" :title="n" @click="set(n)">
            <svg viewBox="0 0 48 44"><path :d="mini(n)" /></svg>
            <span>{{ n }}</span>
          </button>
          <button v-for="(b, n) in BEZIER_PRESETS" :key="n" class="pre bz" :class="{ on: same(val, b) }" :title="b.join(', ')" @click="set([...b])">
            <svg viewBox="0 0 48 44"><path :d="mini(b)" /></svg>
            <span>{{ n }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ee {
  position: absolute; z-index: 30; right: 0; top: 30px; width: 330px;
  background: var(--panel); border: 1px solid var(--line-2); border-radius: 10px; padding: 10px;
  box-shadow: 0 18px 50px rgba(0,0,0,.55); display: grid; gap: 8px;
}
.main { display: grid; grid-template-columns: 1fr; gap: 10px; justify-items: center; }
.main > div { width: 100%; }
.plot { display: block; margin: 0 auto; width: 220px; height: 220px; background: var(--bg-2); border-radius: 8px; touch-action: none; }
.area { fill: rgba(255,255,255,.03); }
.axis { stroke: var(--line-2); stroke-dasharray: 3 3; }
.curve { fill: none; stroke: var(--accent); stroke-width: 2.5; }
.arm { stroke: #7c5cff; stroke-width: 1.2; }
.h { fill: #fff; stroke: #7c5cff; stroke-width: 2; cursor: grab; }
.dot { fill: #22d3ee; }
.track { stroke: var(--line-2); }
.dot2 { fill: var(--accent-2); }
.nums { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 6px; }
.nums .input { height: 26px; font-size: 11px; padding: 0 4px; }
.presets { display: grid; gap: 6px; align-content: start; max-height: 190px; overflow: auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr)); gap: 4px; }
.pre { display: grid; justify-items: center; gap: 2px; padding: 4px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 6px; cursor: pointer; color: var(--text-2); }
.pre span { font-size: 9.5px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pre svg { width: 48px; height: 36px; }
.pre path { fill: none; stroke: var(--accent-2); stroke-width: 2; }
.pre.bz path { stroke: #a78bfa; }
.pre.on { border-color: var(--accent); color: var(--text); }
</style>
