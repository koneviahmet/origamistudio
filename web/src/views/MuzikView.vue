<script setup>
// Müzik sayfası: tarif yaz, enstrümantal müzik üret (yerel ACE-Step 1.5), dinle, data/audio'ya kaydet.
// Claude'a şöyle söyleyebilirsin: "kahve-cizim'e sakin, akustik bir fon müziği üret" → npm run muzik -- --proje … --prompt …
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { api } from '../api.js';
import { toast } from '../toast.js';

const PRESETS = [
  ['Sakin ambiyans', 'calm ambient instrumental, soft warm pads, gentle piano, slow and spacious, relaxing'],
  ['Sıcak akustik', 'warm relaxed instrumental, soft acoustic guitar and light percussion, cozy mood, slow tempo'],
  ['Neşeli', 'upbeat cheerful instrumental, playful ukulele, light claps and glockenspiel, bright and happy, medium tempo'],
  ['Lo-fi', 'lo-fi hip hop instrumental, dusty drums, mellow electric piano, vinyl crackle, chill, slow tempo'],
  ['Sinematik', 'cinematic instrumental, emotional strings and piano, slowly building, inspiring and hopeful'],
  ['Teknoloji', 'modern tech corporate instrumental, clean synths, light electronic beat, optimistic and minimal, medium tempo'],
  ['Masalsı', 'whimsical fairy-tale instrumental, music box, soft harp and pizzicato strings, magical and gentle'],
  ['Gerilim', 'tense dramatic instrumental, low drones, pulsing synth, suspenseful, dark cinematic, slow build'],
];

const status = ref({ running: false, starting: false, installed: true });
const prompt = ref(PRESETS[1][1]);
const duration = ref(30);
const bpm = ref('');
const key = ref('');
const seed = ref('');
const generating = ref(false);
const elapsed = ref(0);
const result = ref(null);
const err = ref('');
const keepName = ref('muzik');
let poll = null;
let timer = null;

async function refreshStatus() {
  try {
    status.value = await api.muzikStatus();
  } catch { /* sunucu yok */ }
}
async function startEngine() {
  try {
    status.value = { ...status.value, starting: true };
    await api.muzikStart();
  } catch (e) {
    toast(e.message, 'error');
  }
  refreshStatus();
}
async function generate() {
  if (!prompt.value.trim() || generating.value) return;
  generating.value = true;
  err.value = '';
  result.value = null;
  elapsed.value = 0;
  timer = setInterval(() => (elapsed.value += 1), 1000);
  try {
    result.value = await api.muzikPreview({
      prompt: prompt.value,
      duration: duration.value,
      bpm: bpm.value || undefined,
      key: key.value || undefined,
      seed: seed.value === '' ? undefined : seed.value,
    });
  } catch (e) {
    err.value = e.message;
  } finally {
    clearInterval(timer);
    generating.value = false;
    refreshStatus();
  }
}
async function keep() {
  try {
    const r = await api.muzikKeep(result.value.file, keepName.value);
    toast(`data/audio/${r.file} olarak kaydedildi`, 'ok');
  } catch (e) {
    toast(e.message, 'error');
  }
}

onMounted(() => {
  refreshStatus();
  poll = setInterval(refreshStatus, 4000);
});
onBeforeUnmount(() => {
  clearInterval(poll);
  clearInterval(timer);
});
</script>

<template>
  <div class="muzik">
    <section class="col">
      <div class="row">
        <h2>Müzik üret</h2>
        <span class="grow" />
        <span class="chip" :title="status.installed ? '' : 'muzik/ACE-Step-1.5 kurulu değil'">
          <i class="dot" :class="{ on: status.running, wait: status.starting }" />
          {{ status.running ? 'Motor hazır' : status.starting ? 'Motor başlıyor…' : 'Motor kapalı' }}
        </span>
        <button v-if="!status.running && !status.starting" class="btn sm" @click="startEngine">Başlat</button>
      </div>

      <div class="row presets">
        <button v-for="[ad, p] in PRESETS" :key="ad" class="btn sm" :class="{ on: prompt === p }" @click="prompt = p">{{ ad }}</button>
      </div>

      <div class="field">
        <label>Tarif (İngilizce daha iyi: tür, ruh hali, enstrümanlar, tempo)</label>
        <textarea v-model="prompt" class="input" rows="4" />
      </div>

      <div class="grid">
        <div class="field">
          <label>Süre: {{ duration }} sn</label>
          <input v-model.number="duration" type="range" min="10" max="120" step="5" />
        </div>
        <div class="field">
          <label>BPM (isteğe bağlı)</label>
          <input v-model="bpm" class="input" type="number" min="30" max="300" placeholder="otomatik" />
        </div>
        <div class="field">
          <label>Anahtar (isteğe bağlı)</label>
          <input v-model="key" class="input" placeholder="örn. C Major, Am" />
        </div>
        <div class="field">
          <label>Seed (aynı sonucu tekrar için)</label>
          <input v-model="seed" class="input" type="number" placeholder="rastgele" />
        </div>
      </div>

      <div class="row">
        <button class="btn primary" :disabled="generating || !prompt.trim()" @click="generate">
          {{ generating ? `Üretiliyor… ${elapsed} sn` : '🎵 Müzik üret' }}
        </button>
        <span v-if="generating && !status.running" class="dim small">Motor açılıyor; ilk seferde model inip yüklenir (birkaç dakika).</span>
      </div>
      <p v-if="err" class="err">{{ err }}</p>

      <div v-if="result" class="result">
        <audio :key="result.file" :src="result.url" controls autoplay />
        <div class="dim small">
          {{ result.dur }} sn<span v-if="result.bpm"> · {{ result.bpm }} BPM</span><span v-if="result.key"> · {{ result.key }}</span
          ><span v-if="result.seed"> · seed {{ result.seed }}</span>
        </div>
        <div class="row">
          <input v-model="keepName" class="input" placeholder="dosya adı" />
          <button class="btn" @click="keep">data/audio'ya kaydet</button>
        </div>
      </div>
    </section>

    <aside class="col info">
      <div class="label">Lisans ve telif</div>
      <p class="small">
        ACE-Step 1.5 MIT lisanslıdır. Geliştiricisi eğitim verisini <i>lisanslı, telifsiz ve sentetik</i> olarak tanımlıyor; bu bağımsız doğrulanmış bir belge değil, geliştirici beyanıdır.
      </p>
      <ul class="small">
        <li>Yalnızca enstrümantal üretilir; şarkı sözü ve vokal yok.</li>
        <li>Üretilen müzik mevcut bir esere kasıtsız benzeyebilir. Önemli videolarda dinleyip kontrol et.</li>
        <li>Saf yapay zekâ çıktısının telif hakkı ülkeye göre değişir. Tarifi, seed'i ve tarihi sakla.</li>
        <li>YouTube Content ID temiz bir müziği yanlışlıkla eşleştirebilir (olasılık düşük).</li>
      </ul>
      <p class="dim small">Claude'a: <code>kahve-cizim'e sakin akustik bir fon müziği üret</code></p>
    </aside>
  </div>
</template>

<style scoped>
.muzik { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr); gap: 20px; padding: 20px; max-width: 1100px; margin: 0 auto; }
.col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
h2 { margin: 0; font-size: 18px; }
.presets { flex-wrap: wrap; gap: 6px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.result { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); }
.result audio { width: 100%; }
.info { padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); align-self: start; }
.info p, .info ul { margin: 0; line-height: 1.5; }
.info ul { padding-left: 18px; display: grid; gap: 4px; }
code { background: var(--bg-2); padding: 1px 5px; border-radius: 4px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); display: inline-block; }
.dot.on { background: var(--ok); }
.dot.wait { background: var(--warn); }
@media (max-width: 900px) { .muzik { grid-template-columns: 1fr; } }
</style>
