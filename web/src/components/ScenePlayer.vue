<script setup>
// Küçük oynatıcı: bir sahneyi canvas'ta çalar (oynat/durdur, zaman çubuğu, bölüm atlama, isteğe bağlı ses).
// Proje oluşturmadan önizleme için (Şablonlar sayfası).
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { renderFrame } from '../engine/renderer.js';
import { ensureSceneFonts } from '../fonts.js';
import { prepareMedia } from '../media.js';
import { AudioPlayer, loadAudio } from '../audio.js';

const props = defineProps({
  scene: { type: Object, default: null },
  res: { type: Object, required: true },
  maxSide: { type: Number, default: 620 },
});

const canvas = ref(null);
const t = ref(0);
const playing = ref(false);
const sound = ref(false);
const player = new AudioPlayer();
const dur = computed(() => props.scene?.duration || 1);
let raf = 0;
let last = 0;

function draw() {
  const c = canvas.value;
  const s = props.scene;
  if (!c || !s) return;
  const k = props.maxSide / Math.max(s.width, s.height);
  const w = Math.round(s.width * k);
  const h = Math.round(s.height * k);
  if (c.width !== w * 2 || c.height !== h * 2) {
    c.width = w * 2;
    c.height = h * 2;
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(k * 2, 0, 0, k * 2, 0, 0);
  prepareMedia(toRaw(s), t.value, props.res, { onUpdate: draw });
  renderFrame(ctx, toRaw(s), t.value, props.res);
}

function tick(now) {
  if (!playing.value) return;
  t.value += (now - last) / 1000;
  last = now;
  if (t.value >= dur.value) {
    t.value = 0;
    if (sound.value) startAudio();
  }
  draw();
  raf = requestAnimationFrame(tick);
}
function startAudio() {
  if (!sound.value || !props.scene) return player.stop();
  player.play(toRaw(props.scene), () => t.value, 1);
}
function play() {
  if (playing.value) return;
  playing.value = true;
  last = performance.now();
  startAudio();
  raf = requestAnimationFrame(tick);
}
function pause() {
  playing.value = false;
  cancelAnimationFrame(raf);
  player.stop();
}
function toggle() {
  if (playing.value) pause();
  else play();
}
function seek(v) {
  t.value = Math.max(0, Math.min(dur.value, v));
  draw();
  if (playing.value && sound.value) startAudio();
}

async function sceneChanged() {
  if (!props.scene) return;
  for (const a of props.scene.audio || []) if (a.file) loadAudio(a.file).catch(() => {});
  if (t.value > dur.value) t.value = 0;
  draw();
  await ensureSceneFonts(toRaw(props.scene), props.res);
  draw();
  if (playing.value && sound.value) startAudio();
}
onMounted(sceneChanged);
watch(() => props.scene, sceneChanged);
watch(() => props.res, draw);
watch(sound, () => (sound.value ? (playing.value && startAudio()) : player.stop()));
onBeforeUnmount(pause);

const sections = computed(() => props.scene?.sections || []);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
defineExpose({ seek, play, pause });
</script>

<template>
  <div class="sp">
    <div class="stage"><canvas ref="canvas" @click="toggle" /></div>
    <div class="bar row">
      <button class="btn sm" @click="toggle">{{ playing ? '⏸' : '▶' }}</button>
      <input type="range" class="grow" min="0" :max="dur" step="0.01" :value="t" @input="seek(Number($event.target.value))" />
      <span class="dim small mono">{{ fmt(t) }} / {{ fmt(dur) }}</span>
      <button class="btn sm" :class="{ on: sound }" title="Ses (müzik ve efektler)" @click="sound = !sound">{{ sound ? '🔊' : '🔇' }}</button>
    </div>
    <div v-if="sections.length" class="secs">
      <button v-for="s in sections" :key="s.t + s.name" class="chip" @click="seek(s.t + 0.6)">{{ s.name }}</button>
    </div>
  </div>
</template>

<style scoped>
.sp { display: grid; gap: 8px; }
.stage { display: grid; place-items: center; background: var(--bg-2); border-radius: 10px; padding: 10px; }
canvas { max-width: 100%; max-height: 62vh; border-radius: 6px; cursor: pointer; }
.bar { gap: 8px; }
.secs { display: flex; flex-wrap: wrap; gap: 4px; }
.secs .chip { cursor: pointer; border: 1px solid var(--line); background: transparent; color: inherit; }
.secs .chip:hover { border-color: var(--accent); }
</style>
