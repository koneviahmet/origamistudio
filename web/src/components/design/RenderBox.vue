<script setup>
// Bir sahneyi kutuya sığdırıp çizer; animate=true ise zamanı döngüde ilerletir.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { renderFrame } from '../../engine/renderer.js';
import { ensureSceneFonts } from '../../fonts.js';
import { useSeen } from '../../visible.js';

const props = defineProps({
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  t: { type: Number, default: 1 },
  animate: { type: Boolean, default: false },
  loop: { type: Number, default: 3 },
  deep: { type: Boolean, default: true },
});
const wrap = ref(null);
const canvas = ref(null);
const seen = useSeen(wrap);
let raf = 0;
let t0 = 0;
let ro;

function draw(t) {
  const c = canvas.value;
  const s = props.scene;
  if (!c || !s || !wrap.value || !seen.value) return;
  const w = wrap.value.clientWidth;
  const h = wrap.value.clientHeight;
  if (!w || !h) return;
  const k = Math.min(w / s.width, h / s.height);
  const dpr = window.devicePixelRatio || 1;
  c.style.width = `${s.width * k}px`;
  c.style.height = `${s.height * k}px`;
  c.width = Math.round(s.width * k * dpr);
  c.height = Math.round(s.height * k * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  renderFrame(ctx, s, t, props.res);
}

function tick(now) {
  if (!t0) t0 = now;
  draw(((now - t0) / 1000) % props.loop);
  raf = requestAnimationFrame(tick);
}
function start() {
  cancelAnimationFrame(raf);
  t0 = 0;
  if (props.animate) raf = requestAnimationFrame(tick);
  else draw(props.t);
}
function refresh() {
  start();
  ensureSceneFonts(props.scene, props.res).then(() => !props.animate && draw(props.t));
}
onMounted(() => {
  ro = new ResizeObserver(() => !props.animate && draw(props.t));
  ro.observe(wrap.value);
  refresh();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  ro?.disconnect();
});
watch(() => [props.animate, props.t], start);
watch(seen, (v) => v && refresh());
watch(() => [props.scene, props.res], refresh, { deep: props.deep });
</script>

<template>
  <div ref="wrap" class="render-box"><canvas ref="canvas" /></div>
</template>

<style scoped>
.render-box { width: 100%; height: 100%; display: grid; place-items: center; overflow: hidden; }
canvas { display: block; border-radius: 6px; }
</style>
