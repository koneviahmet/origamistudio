<script setup>
// Tek bir origami varlığını kutuya sığdırarak çizer. Küçük resim, editör önizlemesi ve
// seçici için ortak bileşen. animate=true iken katlanma animasyonunu döngüde oynatır.
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { hitFacet, assetPalette } from '../engine/origami.js';
import { drawStyled } from '../engine/styles.js';

const props = defineProps({
  asset: { type: Object, required: true },
  animate: { type: Boolean, default: false },
  fold: { type: Number, default: 1 },
  order: { type: String, default: 'radial' },
  spread: { type: Number, default: 0.6 },
  highlight: { type: Number, default: -1 },
  pad: { type: Number, default: 0.1 },
  checker: { type: Boolean, default: false },
  deep: { type: Boolean, default: false },
  variant: { type: String, default: '' },
  drawStyle: { type: String, default: 'origami' },
});
const emit = defineEmits(['pick']);

const wrap = ref(null);
const canvas = ref(null);
let raf = 0;
let t0 = 0;
let ro;
let fit = { k: 1, ox: 0, oy: 0 };

function draw(fold) {
  const c = canvas.value;
  const w = wrap.value?.clientWidth || 0;
  const h = wrap.value?.clientHeight || 0;
  if (!c || !w || !h) return;
  const dpr = window.devicePixelRatio || 1;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, c.width, c.height);
  const a = toRaw(props.asset);
  const [aw, ah] = a.size || [200, 200];
  const k = Math.min(w / aw, h / ah) * (1 - props.pad * 2);
  const ox = (w - aw * k) / 2;
  const oy = (h - ah * k) / 2;
  fit = { k, ox, oy };
  ctx.setTransform(k * dpr, 0, 0, k * dpr, ox * dpr, oy * dpr);
  if (props.checker) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1 / k;
    ctx.strokeRect(0, 0, aw, ah);
    ctx.setLineDash([]);
  }
  drawStyled(ctx, a, props.drawStyle, {
    fold,
    order: props.order,
    spread: props.spread,
    highlight: props.highlight,
    palette: assetPalette(a, props.variant),
  });
}

function loop(now) {
  if (!t0) t0 = now;
  const cycle = 3.2;
  const s = ((now - t0) / 1000) % cycle;
  // 0→1.6s açıl, 1.6→2.6s bekle, 2.6→3.2s kapan
  const f = s < 1.6 ? s / 1.6 : s < 2.6 ? 1 : 1 - (s - 2.6) / 0.6;
  draw(Math.max(0, Math.min(1, f)));
  raf = requestAnimationFrame(loop);
}

function start() {
  cancelAnimationFrame(raf);
  if (props.animate) {
    t0 = 0;
    raf = requestAnimationFrame(loop);
  } else {
    draw(props.fold);
  }
}

function onClick(e) {
  const r = canvas.value.getBoundingClientRect();
  const x = (e.clientX - r.left - fit.ox) / fit.k;
  const y = (e.clientY - r.top - fit.oy) / fit.k;
  emit('pick', hitFacet(toRaw(props.asset), x, y), [x, y]);
}

onMounted(() => {
  ro = new ResizeObserver(() => !props.animate && draw(props.fold));
  ro.observe(wrap.value);
  start();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  ro?.disconnect();
});
watch(() => [props.animate, props.order, props.spread, props.drawStyle], start);
watch(() => props.variant, () => !props.animate && draw(props.fold));
watch(() => [props.fold, props.highlight], () => !props.animate && draw(props.fold));
watch(() => props.asset, () => !props.animate && draw(props.fold), { deep: props.deep });
defineExpose({ redraw: () => draw(props.fold) });
</script>

<template>
  <div ref="wrap" class="asset-canvas">
    <canvas ref="canvas" @click="onClick" />
  </div>
</template>

<style scoped>
.asset-canvas { position: relative; width: 100%; height: 100%; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
</style>
