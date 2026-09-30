<script setup>
// Sahnenin ses izleri (scene.audio) + ses kütüphanesi (data/audio) yönetimi
import { ref } from 'vue';
import { api } from '../../api.js';
import { forgetAudio, loadAudio } from '../../audio.js';
import { detectBeats } from '../../beats.js';
import { sfxEvents } from '../../sfx.js';
import { computed } from 'vue';
import { toast, toastError } from '../../toast.js';

const props = defineProps({
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  edit: { type: Function, required: true },
});

const uploading = ref(false);
const detecting = ref(-1);
const sfxCount = computed(() => sfxEvents({ ...props.scene, sfx: { ...(props.scene.sfx || {}), auto: true } }).length);

async function detect(tr, i) {
  detecting.value = i;
  try {
    const b = await loadAudio(tr.file);
    const r = detectBeats(b);
    props.edit(() => {
      tr.bpm = r.bpm;
      tr.beatOffset = r.beatOffset;
    });
    toast(`${r.bpm} BPM (güven %${Math.round(r.confidence * 100)}) — yanlışsa ×2 / ÷2 ya da elle düzelt`, r.confidence > 0.5 ? 'ok' : 'info', 5000);
  } catch (e) {
    toastError(e);
  } finally {
    detecting.value = -1;
  }
}
function scaleBpm(tr, k) {
  props.edit(() => (tr.bpm = Math.round(tr.bpm * k * 10) / 10));
}
function setSfx(k, v) {
  props.edit(() => {
    props.scene.sfx ||= {};
    props.scene.sfx[k] = v;
    if (!props.scene.sfx.auto && props.scene.sfx.volume == null) delete props.scene.sfx;
  }, `sfx:${k}`);
}
const fileInput = ref(null);

function addTrack(file) {
  props.edit(() => (props.scene.audio ||= []).push({ file, start: 0, volume: 0.8, fadeIn: 1, fadeOut: 2 }));
}
function remove(i) {
  props.edit(() => {
    props.scene.audio.splice(i, 1);
    if (!props.scene.audio.length) delete props.scene.audio;
  });
}
function set(tr, k, v) {
  props.edit(() => {
    if (v === '' || v === null || Number.isNaN(v)) delete tr[k];
    else tr[k] = v;
  }, `au:${k}`);
}
const num = (v) => (v === '' ? null : Number(v));

async function upload(e) {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  uploading.value = true;
  try {
    const saved = await api.uploadAudio(f);
    forgetAudio(saved.file);
    toast(`Yüklendi: ${saved.file}`, 'ok');
    if (!(props.scene.audio || []).length) addTrack(saved.file);
  } catch (err) {
    toastError(err);
  } finally {
    uploading.value = false;
  }
}
async function removeFile(file) {
  const used = (props.scene.audio || []).some((a) => a.file === file);
  if (!confirm(`"${file}" ses kütüphanesinden kalıcı olarak silinsin mi?${used ? '\nBu projede kullanılıyor!' : ''}`)) return;
  try {
    await api.deleteAudio(file);
    forgetAudio(file);
  } catch (err) {
    toastError(err);
  }
}
const mb = (n) => (n / 1048576).toFixed(1);
</script>

<template>
  <div class="ae">
    <div v-for="(tr, i) in scene.audio || []" :key="i" class="track">
      <div class="row">
        <span>♪</span>
        <select class="input grow" :value="tr.file" @change="set(tr, 'file', $event.target.value)">
          <option v-if="!res.audio.some((a) => a.file === tr.file)" :value="tr.file">? {{ tr.file }}</option>
          <option v-for="a in res.audio" :key="a.file" :value="a.file">{{ a.file }}</option>
        </select>
        <button class="btn icon sm ghost" :title="tr.mute ? 'Sesi aç' : 'Sessiz'" @click="set(tr, 'mute', tr.mute ? null : true)">{{ tr.mute ? '🔇' : '🔊' }}</button>
        <button class="btn icon sm ghost" title="İzi kaldır" @click="remove(i)">✕</button>
      </div>
      <div class="grid">
        <label>Başlangıç</label><input type="number" step="0.1" class="input" :value="tr.start ?? 0" @input="set(tr, 'start', num($event.target.value))" />
        <label>Kırp (sn)</label><input type="number" step="0.1" min="0" class="input" :value="tr.offset ?? 0" title="Dosyanın içinden kaç sn sonra başlasın" @input="set(tr, 'offset', num($event.target.value))" />
        <label>En fazla</label><input type="number" step="0.5" min="0" class="input" :value="tr.dur ?? ''" placeholder="sonuna kadar" @input="set(tr, 'dur', num($event.target.value))" />
        <label>Ses {{ Math.round((tr.volume ?? 1) * 100) }}%</label><input type="range" min="0" max="1.5" step="0.05" :value="tr.volume ?? 1" @input="set(tr, 'volume', Number($event.target.value))" />
        <label>Açılış (sn)</label><input type="number" step="0.1" min="0" class="input" :value="tr.fadeIn ?? 0" @input="set(tr, 'fadeIn', num($event.target.value))" />
        <label>Kapanış (sn)</label><input type="number" step="0.1" min="0" class="input" :value="tr.fadeOut ?? 0" @input="set(tr, 'fadeOut', num($event.target.value))" />
      </div>
      <div class="row beat">
        <span class="dim small">♩ Ritim</span>
        <input type="number" step="0.1" class="input bpm" :value="tr.bpm ?? ''" placeholder="BPM" title="Dakikadaki vuruş" @input="set(tr, 'bpm', num($event.target.value))" />
        <input type="number" step="0.01" class="input bpm" :value="tr.beatOffset ?? ''" placeholder="ilk vuruş" title="Dosyadaki ilk vuruşun zamanı (sn)" @input="set(tr, 'beatOffset', num($event.target.value))" />
        <button class="btn sm" :disabled="!tr.bpm" title="Tempoyu yarıya indir" @click="scaleBpm(tr, 0.5)">÷2</button>
        <button class="btn sm" :disabled="!tr.bpm" title="Tempoyu ikiye katla" @click="scaleBpm(tr, 2)">×2</button>
        <button class="btn sm" :disabled="detecting === i" @click="detect(tr, i)">{{ detecting === i ? '…' : 'Algıla' }}</button>
      </div>
    </div>

    <div class="sfx">
      <label class="row small"><input type="checkbox" :checked="!!scene.sfx?.auto" @change="setSfx('auto', $event.target.checked)" /> <b>Otomatik ses efektleri</b> <span class="dim">({{ sfxCount }} olay)</span></label>
      <div v-if="scene.sfx?.auto" class="row small">
        <span class="dim">Efekt sesi {{ Math.round((scene.sfx.volume ?? 0.7) * 100) }}%</span>
        <input type="range" min="0" max="1.5" step="0.05" class="grow" :value="scene.sfx.volume ?? 0.7" @input="setSfx('volume', Number($event.target.value))" />
      </div>
      <p class="dim small">Ön ayarlar, metin animasyonları, geçişler ve patlamalar kağıt katlama, hışırtı, pop, vınlama sesleriyle eşlenir. Katmanda <code>"sfx": false</code> ile susturulur.</p>
    </div>

    <div class="row wrap">
      <select class="input grow" @change="$event.target.value && addTrack($event.target.value); $event.target.value = ''">
        <option value="">＋ İz ekle (kütüphaneden)…</option>
        <option v-for="a in res.audio" :key="a.file" :value="a.file">{{ a.file }}</option>
      </select>
      <button class="btn sm" :disabled="uploading" @click="fileInput.click()">{{ uploading ? 'Yükleniyor…' : '⬆ Ses yükle' }}</button>
      <input ref="fileInput" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" hidden @change="upload" />
    </div>

    <details v-if="res.audio.length" class="lib">
      <summary class="dim small">Ses kütüphanesi ({{ res.audio.length }})</summary>
      <div v-for="a in res.audio" :key="a.file" class="row small">
        <span class="grow mono">{{ a.file }}</span>
        <span class="dim">{{ mb(a.size) }} MB</span>
        <button class="btn icon sm ghost" title="Kütüphaneden sil" @click="removeFile(a.file)">✕</button>
      </div>
    </details>
    <p class="dim small">Yalnızca kullanım hakkına sahip olduğun müzikleri yükle. MP4'e AAC ses olarak eklenir.</p>
  </div>
</template>

<style scoped>
.ae { display: grid; gap: 8px; }
.track { background: var(--bg-2); border: 1px solid var(--line); border-left: 3px solid #5aa9e6; border-radius: 8px; padding: 8px; display: grid; gap: 8px; }
.grid { display: grid; grid-template-columns: 80px 1fr 80px 1fr; gap: 5px 8px; align-items: center; }
.grid label { font-size: 11px; color: var(--text-2); }
.grid .input { height: 26px; font-size: 12px; }
.wrap { flex-wrap: wrap; }
.lib { display: grid; gap: 4px; }
.beat { gap: 4px; }
.bpm { width: 70px; height: 26px; font-size: 12px; }
.sfx { display: grid; gap: 6px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; padding: 8px; }
code { font-family: var(--mono); font-size: 11px; }
</style>
