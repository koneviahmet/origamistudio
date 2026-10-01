<script setup>
// Bileşen katmanları (grafik, cihaz, medya, ses dalgası) — alan tanımlarından (engine/widgets.js) form üretir
import { computed, ref } from 'vue';
import { WIDGET_FIELDS } from '../../engine/widgets.js';
import { api } from '../../api.js';
import { reloadResources } from '../../resources.js';
import { forgetMedia } from '../../media.js';
import { toast, toastError } from '../../toast.js';
import { componentProps } from '../../sceneOps.js';
import { VARIANTS, VARIANT_NAMES, applyVariant } from '../../engine/widgetStyle.js';
import { slug } from '../../slug.js';
import { withAutoTags } from '../../componentTags.js';

const props = defineProps({
  layer: { type: Object, required: true },
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  edit: { type: Function, required: true },
  bare: { type: Boolean, default: false }, // Bileşenler sayfasında 'bileşen olarak kaydet' düğmesi gizlenir
});

const kindOf = computed(() => props.layer.kind || (WIDGET_FIELDS[props.layer.type] || []).find((f) => f.key === 'kind')?.def);
// `kinds` olan alan yalnızca o türlerde gösterilir
const fields = computed(() => (WIDGET_FIELDS[props.layer.type] || []).filter((f) => !f.kinds || f.kinds.includes(kindOf.value)));
const val = (f) => props.layer[f.key] ?? f.def ?? '';

function set(key, v) {
  props.edit(() => {
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete props.layer[key];
    else props.layer[key] = v;
  }, `w:${key}`);
}
const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

// Grafik verisi: "etiket: değer" satırları
const dataText = computed(() => (props.layer.data || []).map((d) => (typeof d === 'number' ? d : `${d.label}: ${d.value}`)).join('\n'));
function setData(text) {
  const rows = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)[:=]\s*(-?[\d.,]+)\s*$/);
      if (m) return { label: m[1].trim(), value: Number(m[2].replace(',', '.')) };
      const n = Number(l.replace(',', '.'));
      return Number.isNaN(n) ? { label: l, value: 0 } : { label: '', value: n };
    });
  set('data', rows.length ? rows : null);
}
const linesText = computed(() => (props.layer.lines || []).join('\n'));
function setLines(text) {
  const rows = text.split('\n').map((l) => l.trim()).filter(Boolean);
  set('lines', rows.length ? rows : null);
}

const fileInput = ref(null);
const uploading = ref(false);
async function upload(e) {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  uploading.value = true;
  try {
    const saved = await api.uploadMedia(f);
    forgetMedia(saved.file);
    await reloadResources('media');
    set('src', saved.file);
    toast(`Yüklendi: ${saved.file}`, 'ok');
  } catch (err) {
    toastError(err);
  } finally {
    uploading.value = false;
  }
}
async function saveAsComponent() {
  const name = prompt('Bileşen adı:', '');
  if (!name || !name.trim()) return;
  try {
    let id = slug(name);
    if (props.res.components.some((c) => c.id === id)) id = `${id}-${Date.now().toString(36).slice(-3)}`;
    const doc = { id, name: name.trim(), description: '', type: props.layer.type, props: componentProps(props.layer) };
    await api.colCreate('components', { ...doc, etiketler: withAutoTags(doc) });
    await reloadResources('components');
    toast('Bileşen kaydedildi → Bileşenler sayfası', 'ok');
  } catch (e) {
    toastError(e);
  }
}
function applyVar(name) {
  const add = applyVariant(props.layer.type, {}, name);
  if (!Object.keys(add).length) return toast('Bu varyant bu bileşene uygulanmaz');
  props.edit(() => Object.assign(props.layer, add), `w:var:${name}`);
}
const hasAudio = computed(() => (props.scene.audio || []).length > 0);
const hasEnv = computed(() => (props.scene.audio || []).some((a) => a.env?.data?.length));
</script>

<template>
  <div class="we">
    <div class="qv">
      <span class="dim small">Hızlı stil</span>
      <button v-for="n in VARIANT_NAMES" :key="n" type="button" class="chip qb" :title="VARIANTS[n].info" @click="applyVar(n)">{{ n }}</button>
    </div>
    <div v-for="f in fields" :key="f.key" class="field">
      <label>{{ f.label }}</label>
      <select v-if="f.type === 'select'" class="input" :value="val(f)" @change="set(f.key, $event.target.value)">
        <option v-for="o in f.options" :key="o[0]" :value="o[0]">{{ o[1] }}</option>
      </select>
      <label v-else-if="f.type === 'bool'" class="row chk">
        <input type="checkbox" :checked="layer[f.key] ?? f.def" @change="set(f.key, $event.target.checked ? null : false)" /> açık
      </label>
      <div v-else-if="f.type === 'color'" class="row">
        <input v-if="isHex(val(f))" type="color" class="input color" :value="val(f)" @input="set(f.key, $event.target.value)" />
        <input class="input mono grow" :value="layer[f.key] ?? ''" :placeholder="String(f.def)" @change="set(f.key, $event.target.value.trim())" />
      </div>
      <textarea v-else-if="f.type === 'area'" class="input" rows="3" :value="layer[f.key] ?? ''" @input="set(f.key, $event.target.value)" />
      <textarea v-else-if="f.type === 'data'" class="input mono" rows="6" spellcheck="false" :value="dataText" :placeholder="f.hint" @change="setData($event.target.value)" />
      <textarea v-else-if="f.type === 'lines'" class="input mono" rows="4" spellcheck="false" :value="linesText" :placeholder="f.hint" @change="setLines($event.target.value)" />
      <div v-else-if="f.type === 'media'" class="row">
        <select class="input grow" :value="layer[f.key] || ''" @change="set(f.key, $event.target.value)">
          <option value="">{{ layer.type === 'device' ? '(sahte arayüz)' : '(seç)' }}</option>
          <option v-if="layer[f.key] && !res.media.some((m) => m.file === layer[f.key])" :value="layer[f.key]">? {{ layer[f.key] }}</option>
          <option v-for="m in res.media" :key="m.file" :value="m.file">{{ m.video ? '🎞' : '🖼' }} {{ m.file }}</option>
        </select>
        <button class="btn sm" :disabled="uploading" @click="fileInput.click()">Yükle</button>
        <input ref="fileInput" type="file" hidden accept="image/*,video/mp4,video/webm,video/quicktime" @change="upload" />
      </div>
      <input v-else-if="f.type === 'number'" type="number" class="input" :step="f.step || 1" :value="layer[f.key] ?? ''" :placeholder="String(f.def)" @change="set(f.key, $event.target.value === '' ? null : Number($event.target.value))" />
      <input v-else class="input" :value="layer[f.key] ?? ''" :placeholder="String(f.def)" @change="set(f.key, $event.target.value)" />
    </div>
    <button v-if="!bare" class="btn sm" title="Bu görünümü kayıtlı bileşen olarak sakla; Bileşen menüsünden tekrar eklenir" @click="saveAsComponent">☆ Bileşen olarak kaydet</button>
    <p v-if="layer.type === 'waveform'" class="dim small">
      {{ !hasAudio ? 'Sahneye bir müzik izi ekleyin.' : hasEnv ? 'Ses zarfı var — çubuklar müziğe göre hareket eder.' : 'Ses zarfı yok: sahte vuruş animasyonu gösterilir. Ses bölümünden “Zarf çıkar”a basın.' }}
    </p>
    <p v-if="layer.type === 'chart'" class="dim small">Çizilme ilerlemesi <b>katlanma</b> özelliğidir (ön ayar: Katlanarak gir / Çizerek gir).</p>
    <p v-if="layer.type === 'media'" class="dim small">Video sesi dışa aktarıma karışmaz; müziği ses izi olarak ekleyin.</p>
  </div>
</template>

<style scoped>
.we { display: grid; gap: 8px; }
.chk { height: 30px; }
.qv { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.qb { cursor: pointer; background: transparent; color: inherit; }
.qb:hover { border-color: var(--accent); }
textarea.input { resize: vertical; }
</style>
