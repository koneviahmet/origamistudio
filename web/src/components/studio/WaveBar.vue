<script setup>
// Ses izinin dalga formu (zaman çizelgesinde)
import { onMounted, ref, watch } from 'vue';
import { loadAudio, peaks } from '../../audio.js';

const props = defineProps({
  file: { type: String, required: true },
  offset: { type: Number, default: 0 },
  len: { type: Number, default: 0 },
  width: { type: Number, default: 100 },
});
const canvas = ref(null);
const error = ref(false);

async function draw() {
  const c = canvas.value;
  if (!c || props.width < 2 || props.len <= 0) return;
  let b;
  try {
    b = await loadAudio(props.file);
    error.value = false;
  } catch {
    error.value = true;
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(2, Math.round(props.width));
  const h = 18;
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.width = `${w}px`;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const n = Math.min(1200, Math.max(8, Math.floor(w / 2)));
  const pk = peaks(b, props.offset, props.len, n);
  ctx.fillStyle = 'rgba(160, 205, 255, 0.85)';
  for (let i = 0; i < n; i++) {
    const a = Math.max(0.5, pk[i] * (h / 2 - 1));
    ctx.fillRect((i / n) * w, h / 2 - a, Math.max(1, w / n - 0.5), a * 2);
  }
}
onMounted(draw);
watch(() => [props.file, props.offset, props.len, Math.round(props.width)], draw);
</script>

<template>
  <canvas ref="canvas" class="wave" :class="{ err: error }" />
</template>

<style scoped>
.wave { display: block; height: 18px; pointer-events: none; }
.err { background: repeating-linear-gradient(45deg, #5a2a2a 0 4px, transparent 4px 8px); }
</style>
