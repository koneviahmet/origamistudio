<script setup>
import { onMounted, ref, watch } from 'vue';
import { useSeen } from '../visible.js';
import { renderFrame } from '../engine/renderer.js';
import { ensureSceneFonts } from '../fonts.js';
import { prepareMedia } from '../media.js';

const props = defineProps({
  scene: { type: Object, default: null },
  res: { type: Object, default: null },
  t: { type: Number, default: 0 },
  width: { type: Number, default: 240 },
});
const emit = defineEmits(['seen']);
const canvas = ref(null);
const seen = useSeen(canvas);
watch(seen, (v) => v && emit('seen'), { immediate: true });

function draw() {
  const c = canvas.value;
  const s = props.scene;
  if (!c || !s || !props.res || !seen.value) return;
  const k = props.width / s.width;
  c.width = Math.round(s.width * k * 2);
  c.height = Math.round(s.height * k * 2);
  const ctx = c.getContext('2d');
  ctx.setTransform(k * 2, 0, 0, k * 2, 0, 0);
  renderFrame(ctx, s, props.t, props.res);
}
function drawWithFonts() {
  draw();
  if (props.scene && props.res) {
    ensureSceneFonts(props.scene, props.res).then(draw);
    prepareMedia(props.scene, props.t, props.res, { onUpdate: draw });
  }
}
onMounted(drawWithFonts);
watch([() => props.scene, () => props.res, () => props.t, seen], drawWithFonts);
</script>

<template>
  <canvas ref="canvas" class="scene-thumb" width="1" height="1" />
</template>

<style scoped>
.scene-thumb { display: block; max-width: 100%; max-height: 100%; border-radius: 6px; }
</style>
