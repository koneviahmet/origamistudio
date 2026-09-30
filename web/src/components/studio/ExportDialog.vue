<script setup>
import { computed, ref, toRaw } from 'vue';
import { exportMp4, downloadBlob, canExportMp4 } from '../../export/mp4.js';
import { slug } from '../../slug.js';
import { ensureSceneFonts } from '../../fonts.js';
import { renderMix } from '../../audio.js';

const props = defineProps({
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  initialFormat: { type: String, default: null },
});
const emit = defineEmits(['close']);

// Hedef: '' = ana sahne, format id, '__all' = ana + tüm formatlar sırayla
const target = ref(props.initialFormat || '');
const scale = ref(1);
const withAudio = ref(true);
const hasAudio = computed(() => (props.scene.audio || []).some((a) => a.file && !a.mute) || !!props.scene.sfx?.auto);
const warn = ref('');
const rangeMode = ref('all');
const from = ref(0);
const to = ref(props.scene.duration);
const progress = ref(0);
const running = ref(false);
const error = ref('');
const results = ref([]);
const current = ref('');
let abort = null;
let started = 0;
const eta = ref('');

const formats = computed(() => props.scene.formats || []);
const jobs = computed(() => {
  if (target.value === '__all') return [null, ...formats.value];
  if (!target.value) return [null];
  return [formats.value.find((f) => f.id === target.value) || null];
});
const dims = (f) => [f?.width ?? props.scene.width, f?.height ?? props.scene.height];
const size = computed(() =>
  jobs.value.map((f) => dims(f).map((d) => Math.round((d * scale.value) / 2) * 2).join('×')).join(' + '),
);
const frames = computed(() => Math.round(((rangeMode.value === 'all' ? props.scene.duration : to.value - from.value) || 0) * props.scene.fps));
const supported = canExportMp4();

async function run() {
  error.value = '';
  results.value = [];
  running.value = true;
  progress.value = 0;
  abort = new AbortController();
  started = performance.now();
  try {
    const scene = JSON.parse(JSON.stringify(toRaw(props.scene)));
    await ensureSceneFonts(scene, props.res);
    const from0 = rangeMode.value === 'all' ? 0 : from.value;
    const to0 = rangeMode.value === 'all' ? scene.duration : to.value;
    warn.value = '';
    // Ses tüm formatlarda aynıdır: bir kez karıştır
    const audioBuffer = withAudio.value && hasAudio.value ? await renderMix(scene, from0, to0) : null;
    const list = jobs.value;
    for (let j = 0; j < list.length; j++) {
      const f = list[j] ? JSON.parse(JSON.stringify(toRaw(list[j]))) : null;
      const [w, h] = dims(f);
      current.value = `${f?.name || f?.id || 'Ana'} (${w}×${h})`;
      const t0 = performance.now();
      const blob = await exportMp4(scene, props.res, {
        audioBuffer,
        format: f,
        onWarning: (m) => (warn.value = m),
        scale: scale.value,
        from: from0,
        to: to0,
        signal: abort.signal,
        onProgress: (p) => {
          progress.value = (j + p) / list.length;
          const el = (performance.now() - started) / 1000;
          eta.value = progress.value > 0.02 ? `${Math.max(0, Math.round(el / progress.value - el))} sn kaldı` : '';
        },
      });
      const name = `${slug(props.scene.name || 'origami')}-${w}x${h}.mp4`;
      results.value.push({ blob, name, mb: (blob.size / 1024 / 1024).toFixed(1), secs: ((performance.now() - t0) / 1000).toFixed(1) });
      downloadBlob(blob, name);
    }
  } catch (e) {
    error.value = e.name === 'AbortError' ? 'İptal edildi.' : e.message || String(e);
  } finally {
    running.value = false;
    current.value = '';
  }
}
function cancel() {
  abort?.abort();
}
</script>

<template>
  <div class="modal-backdrop" @click.self="!running && emit('close')">
    <div class="modal">
      <header>Video dışa aktar (MP4)</header>
      <div class="body">
        <div v-if="!supported" class="err">Bu tarayıcı WebCodecs desteklemiyor. Chrome veya Edge ile açın.</div>
        <div class="field">
          <label>Format</label>
          <select v-model="target" class="input" :disabled="running">
            <option value="">Ana ({{ scene.width }}×{{ scene.height }})</option>
            <option v-for="f in formats" :key="f.id" :value="f.id">{{ f.name || f.id }} ({{ f.width }}×{{ f.height }})</option>
            <option v-if="formats.length" value="__all">Tüm formatlar sırayla ({{ formats.length + 1 }} video)</option>
          </select>
        </div>
        <div class="grid2">
          <div class="field">
            <label>Çözünürlük</label>
            <select v-model.number="scale" class="input" :disabled="running">
              <option :value="1">Tam</option>
              <option :value="0.5">Taslak %50</option>
              <option :value="0.75">%75</option>
            </select>
          </div>
          <div class="field">
            <label>Aralık</label>
            <select v-model="rangeMode" class="input" :disabled="running">
              <option value="all">Tüm video ({{ scene.duration }} sn)</option>
              <option value="range">Özel aralık</option>
            </select>
          </div>
        </div>
        <div v-if="rangeMode === 'range'" class="grid2">
          <div class="field"><label>Başlangıç (sn)</label><input v-model.number="from" type="number" step="0.1" min="0" class="input" /></div>
          <div class="field"><label>Bitiş (sn)</label><input v-model.number="to" type="number" step="0.1" :max="scene.duration" class="input" /></div>
        </div>
        <label v-if="hasAudio" class="row small"><input v-model="withAudio" type="checkbox" :disabled="running" /> Müziği / sesi dahil et (AAC)</label>
        <div v-if="warn" class="err">{{ warn }}</div>
        <div class="dim small">{{ size }} · {{ scene.fps }} fps · {{ frames }} kare · H.264 MP4 (Instagram / YouTube / TikTok uyumlu)</div>

        <div v-if="running || progress > 0" class="prog">
          <div class="bar"><span :style="{ width: `${Math.round(progress * 100)}%` }" /></div>
          <div class="row small"><span class="grow">%{{ Math.round(progress * 100) }} {{ current }}</span><span class="dim">{{ running ? eta : '' }}</span></div>
        </div>
        <div v-if="error" class="err">{{ error }}</div>
        <div v-for="r in results" :key="r.name" class="ok small">
          ✓ {{ r.name }} indirildi ({{ r.mb }} MB, {{ r.secs }} sn).
          <a href="#" @click.prevent="downloadBlob(r.blob, r.name)">Tekrar indir</a>
        </div>
      </div>
      <footer>
        <button v-if="running" class="btn danger" @click="cancel">İptal</button>
        <button v-else class="btn" @click="emit('close')">Kapat</button>
        <button class="btn primary" :disabled="running || !supported || frames <= 0" @click="run">
          {{ running ? 'Kodlanıyor…' : jobs.length > 1 ? `⬇ ${jobs.length} MP4 oluştur` : '⬇ MP4 oluştur' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.prog { display: grid; gap: 4px; }
.bar { height: 8px; background: var(--bg-2); border-radius: 99px; overflow: hidden; border: 1px solid var(--line); }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); transition: width .15s; }
.ok { color: var(--ok); }
</style>
