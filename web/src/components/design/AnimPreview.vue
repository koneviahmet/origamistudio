<script setup>
// Hafif sahne önizlemesi (Animasyonlar sayfası): ekrana girince tek kare çizer, `active` iken döngüde oynatır.
// - Kare çizimleri ortak bir kuyrukta, rAF başına ~8 ms bütçeyle (aynı anda onlarca kart görününce takılmaz).
// - Tuval çözünürlüğü sabit (px); boyutlandırma CSS ile yapılır → ResizeObserver / yeniden çizim yok.
// - `scene` DERİN izlenmez: üst bileşen sahneyi önbellekler, kimliği değişince yeniden çizilir.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { renderFrame } from '../../engine/renderer.js';
import { ensureSceneFonts } from '../../fonts.js';

const props = defineProps({
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  t: { type: Number, default: 1 }, // durağan kare zamanı
  active: { type: Boolean, default: false }, // true: döngüde oynar
  loop: { type: Number, default: 3 },
  speed: { type: Number, default: 1 },
  paused: { type: Boolean, default: false },
  px: { type: Number, default: 260 }, // tuval kenarı (CSS px); yüksek dpi için en çok 1.75 katı
  lazy: { type: Boolean, default: true },
});
const emit = defineEmits(['time']);

const el = ref(null);
const canvas = ref(null);
const visible = ref(!props.lazy);
let raf = 0;
let t0 = 0;
let io = null;
let fontsFor = null;
let stale = true;

// ── ortak çizim kuyruğu ──────────────────────────────────────────────────────
const queue = (globalThis.__animQueue ||= { jobs: new Set(), raf: 0 });
function pump() {
  queue.raf = 0;
  const t0 = performance.now();
  for (const job of queue.jobs) {
    queue.jobs.delete(job);
    try {
      job();
    } catch (e) {
      console.warn('[önizleme]', e);
    }
    if (performance.now() - t0 > 8) break; // kare bütçesi: ~8 ms
  }
  if (queue.jobs.size) queue.raf = requestAnimationFrame(pump);
}
function enqueue(job) {
  queue.jobs.add(job);
  if (!queue.raf) queue.raf = requestAnimationFrame(pump);
}

function draw(t) {
  const c = canvas.value;
  const s = props.scene;
  if (!c || !s) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const k = props.px / Math.max(s.width, s.height);
  const w = Math.round(s.width * k * dpr);
  const h = Math.round(s.height * k * dpr);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  renderFrame(ctx, s, t, props.res);
}

async function ready() {
  if (fontsFor === props.scene) return;
  fontsFor = props.scene;
  try {
    await ensureSceneFonts(props.scene, props.res);
  } catch {
    /* yazı tipi yüklenemese de çiz */
  }
}

function poster() {
  stale = false;
  ready().then(() => enqueue(() => draw(props.t)));
}

let clock = 0; // duraklatıldığında kaldığı yer
function tick(now) {
  if (!t0) t0 = now - (clock / props.speed) * 1000;
  clock = (((now - t0) / 1000) * props.speed) % props.loop;
  draw(clock);
  emit('time', clock);
  raf = requestAnimationFrame(tick);
}
function sync() {
  cancelAnimationFrame(raf);
  raf = 0;
  if (!visible.value) return;
  if (props.active && !props.paused) {
    t0 = 0;
    ready().then(() => {
      if (props.active && !props.paused) raf = requestAnimationFrame(tick);
    });
  } else if (props.active && props.paused) {
    ready().then(() => draw(props.t));
  } else {
    clock = 0;
    poster();
  }
}

onMounted(() => {
  if (props.lazy) {
    io = new IntersectionObserver(
      (es) => {
        const v = es.some((e) => e.isIntersecting);
        if (v === visible.value) return;
        visible.value = v;
        if (v && stale) sync();
        else if (!v) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: '240px' },
    );
    io.observe(el.value);
  } else sync();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  io?.disconnect();
});

watch(() => props.scene, () => {
  stale = true;
  fontsFor = null;
  if (visible.value) sync();
});
watch(() => props.paused, (p) => {
  if (!p) clock = props.t;
  sync();
});
watch(() => props.active, sync);
watch(() => props.t, () => {
  if (visible.value && (!props.active || props.paused)) draw(props.t);
});
watch(() => props.speed, () => {
  // oynarken hız değişirse mevcut konumdan devam et
  if (raf) t0 = 0;
});
</script>

<template>
  <div ref="el" class="ap"><canvas ref="canvas" /></div>
</template>

<style scoped>
.ap { width: 100%; height: 100%; display: grid; place-items: center; overflow: hidden; }
canvas { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
