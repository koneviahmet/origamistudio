<script setup>
// İçerik paneli: projedeki tüm metinler (metin katmanı, ok etiketi, grafik ve cihaz metinleri) ile
// kütüphane dışı görseller (medya / cihaz ekranı) tek yerde — arayıp değiştir, seç, yükle.
import { computed, ref } from 'vue';
import { api } from '../../api.js';
import { reloadResources } from '../../resources.js';
import { forgetMedia, isVideoFile, mediaUrl } from '../../media.js';
import { toast, toastError } from '../../toast.js';

const props = defineProps({
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  selectedId: { type: String, default: null },
  edit: { type: Function, required: true },
});
const emit = defineEmits(['go']);

const q = ref('');
const showFind = ref(false);
const find = ref('');
const repl = ref('');
const gallery = ref(null); // galeri açık olan katman id'si
const uploadFor = ref(null);
const fileInput = ref(null);
const uploading = ref(false);

const norm = (s) => String(s || '').toLocaleLowerCase('tr');
const match = (...parts) => {
  const s = norm(q.value.trim());
  return !s || parts.some((p) => norm(p).includes(s));
};
const dataText = (l) => (l.data || []).map((d) => (typeof d === 'number' ? d : `${d.label}: ${d.value}`)).join('\n');
const label = (l) => (l.type === 'text' ? 'metin' : ({ arrow: 'ok', chart: 'grafik', device: 'cihaz', media: 'medya', karakter: 'karakter' })[l.type] || l.type);

const texts = computed(() => (props.scene.layers || []).filter((l) => {
  if (l.type === 'text') return match(l.text, l.id);
  if (l.type === 'arrow') return typeof l.label === 'string' && match(l.label, l.id);
  if (l.type === 'chart') return match(l.title, l.unit, dataText(l), l.id);
  if (l.type === 'device') return match(l.title, l.url, (l.lines || []).join(' '), l.id);
  if (l.type === 'karakter') return !!(l.soz || []).length && match((l.soz || []).map((z) => z.metin).join(' '), l.id);
  return false;
}));
const images = computed(() => (props.scene.layers || []).filter((l) => (l.type === 'media' || l.type === 'device') && match(l.src, l.id)));
const totalTexts = computed(() => (props.scene.layers || []).filter((l) => l.type === 'text' || (l.type === 'arrow' && typeof l.label === 'string') || l.type === 'chart' || l.type === 'device' || (l.type === 'karakter' && (l.soz || []).length)).length);

function setField(l, key, v, mode) {
  props.edit(() => {
    if (mode === 'opt' && (v === '' || v == null)) delete l[key];
    else l[key] = v;
  }, `ct:${l.id}:${key}`);
}
function setData(l, text) {
  const rows = text.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?)[:=]\s*(-?[\d.,]+)\s*$/);
    if (m) return { label: m[1].trim(), value: Number(m[2].replace(',', '.')) };
    const n = Number(s.replace(',', '.'));
    return Number.isNaN(n) ? { label: s, value: 0 } : { label: '', value: n };
  });
  props.edit(() => {
    // renk gibi ek alanları sıra eşleşmesiyle koru
    const old = l.data || [];
    rows.forEach((r, i) => {
      if (old[i]?.color) r.color = old[i].color;
    });
    if (rows.length) l.data = rows;
  }, `ct:${l.id}:data`);
}
function setLines(l, text) {
  const rows = text.split('\n').map((s) => s.trim()).filter(Boolean);
  setField(l, 'lines', rows.length ? rows : null, 'opt');
}

// Bul ve değiştir (yalnızca metinler)
const hits = computed(() => {
  if (!find.value) return 0;
  let n = 0;
  for (const f of replaceTargets()) n += f.get().split(find.value).length - 1;
  return n;
});
function replaceTargets() {
  const out = [];
  for (const l of props.scene.layers || []) {
    if (l.type === 'text') out.push({ get: () => l.text || '', set: (v) => (l.text = v) });
    else if (l.type === 'arrow' && typeof l.label === 'string') out.push({ get: () => l.label, set: (v) => (l.label = v) });
    else if (l.type === 'chart') {
      if (l.title) out.push({ get: () => l.title, set: (v) => (l.title = v) });
      (l.data || []).forEach((d) => typeof d === 'object' && d.label && out.push({ get: () => d.label, set: (v) => (d.label = v) }));
    } else if (l.type === 'device') {
      if (l.title) out.push({ get: () => l.title, set: (v) => (l.title = v) });
      (l.lines || []).forEach((_, i) => out.push({ get: () => l.lines[i], set: (v) => (l.lines[i] = v) }));
    } else if (l.type === 'karakter') {
      (l.soz || []).forEach((z) => z.metin && out.push({ get: () => z.metin, set: (v) => (z.metin = v) }));
    }
  }
  return out;
}
function replaceAll() {
  if (!find.value) return;
  const n = hits.value;
  if (!n) return toast('Eşleşme yok');
  props.edit(() => {
    for (const f of replaceTargets()) f.set(f.get().split(find.value).join(repl.value));
  });
  toast(`${n} yerde değiştirildi`, 'ok');
}

// Görseller
const inLib = (src) => props.res.media.some((m) => m.file === src);
function pickMedia(l, file) {
  setField(l, 'src', file, 'opt');
  gallery.value = null;
}
function askUpload(l) {
  uploadFor.value = l;
  fileInput.value.click();
}
async function upload(e) {
  const f = e.target.files?.[0];
  e.target.value = '';
  const l = uploadFor.value;
  if (!f || !l) return;
  uploading.value = true;
  try {
    const saved = await api.uploadMedia(f);
    forgetMedia(saved.file);
    await reloadResources('media');
    setField(l, 'src', saved.file, 'opt');
    toast(`Yüklendi: ${saved.file}`, 'ok');
  } catch (err) {
    toastError(err);
  } finally {
    uploading.value = false;
  }
}
const usage = (file) => (props.scene.layers || []).filter((l) => l.src === file).length;
</script>

<template>
  <div class="cp" @keydown.stop>
    <div class="row">
      <input v-model="q" class="input grow" placeholder="Metin ya da dosya ara…" />
      <button class="btn sm" :class="{ on: showFind }" title="Bul ve değiştir" @click="showFind = !showFind">⇄</button>
    </div>
    <div v-if="showFind" class="find">
      <input v-model="find" class="input" placeholder="Bul" />
      <input v-model="repl" class="input" placeholder="Değiştir" />
      <div class="row">
        <span class="dim small grow">{{ find ? `${hits} eşleşme` : 'Tüm metinlerde' }}</span>
        <button class="btn sm primary" :disabled="!hits" @click="replaceAll">Hepsini değiştir</button>
      </div>
    </div>

    <div class="sec-title">Metinler <span class="dim small">· {{ texts.length }}{{ q ? ` / ${totalTexts}` : '' }}</span></div>
    <p v-if="!texts.length" class="dim small">{{ q ? 'Eşleşen metin yok.' : 'Projede metin yok.' }}</p>
    <div v-for="l in texts" :key="l.id" class="it" :class="{ sel: l.id === selectedId }">
      <div class="ih row" @click="emit('go', l.id)">
        <span class="chip">{{ label(l) }}</span>
        <span class="mono small dim grow ell">{{ l.id }}</span>
        <span v-if="l.start != null" class="dim small">{{ l.start }}s</span>
      </div>
      <template v-if="l.type === 'text'">
        <textarea class="input" :rows="Math.min(6, Math.max(1, (l.text || '').split('\n').length))" :value="l.text" @focus="emit('go', l.id)" @input="setField(l, 'text', $event.target.value)" />
      </template>
      <template v-else-if="l.type === 'arrow'">
        <input class="input" :value="l.label" @focus="emit('go', l.id)" @input="setField(l, 'label', $event.target.value)" />
      </template>
      <template v-else-if="l.type === 'chart'">
        <div class="grid2">
          <input class="input" :value="l.title || ''" placeholder="Başlık" @input="setField(l, 'title', $event.target.value, 'opt')" />
          <input class="input" :value="l.unit || ''" placeholder="Birim" @input="setField(l, 'unit', $event.target.value, 'opt')" />
        </div>
        <textarea class="input mono" rows="4" spellcheck="false" :value="dataText(l)" placeholder="etiket: değer" @change="setData(l, $event.target.value)" />
      </template>
      <template v-else-if="l.type === 'karakter'">
        <textarea v-for="(z, i) in l.soz" :key="i" class="input" rows="2" :value="z.metin" :title="`t = ${z.t}s`" @focus="emit('go', l.id)" @input="props.edit(() => (z.metin = $event.target.value), `ct:${l.id}:soz${i}`)" />
      </template>
      <template v-else-if="l.type === 'device'">
        <div class="grid2">
          <input class="input" :value="l.title || ''" placeholder="Başlık" @input="setField(l, 'title', $event.target.value, 'opt')" />
          <input class="input" :value="l.url || ''" placeholder="Adres" @input="setField(l, 'url', $event.target.value, 'opt')" />
        </div>
        <textarea class="input" rows="3" :value="(l.lines || []).join('\n')" placeholder="Ekran satırları (her satıra bir)" @change="setLines(l, $event.target.value)" />
      </template>
    </div>

    <div class="sec-title">Görseller <span class="dim small">· kütüphane dışı · {{ images.length }}</span></div>
    <p v-if="!images.length" class="dim small">Medya ya da cihaz katmanı yok. Katman ekleyip Denetçi'den dosya seçebilirsin.</p>
    <div v-for="l in images" :key="l.id" class="it" :class="{ sel: l.id === selectedId }">
      <div class="ih row" @click="emit('go', l.id)">
        <span class="chip">{{ label(l) }}</span>
        <span class="mono small dim grow ell">{{ l.id }}</span>
      </div>
      <div class="img row">
        <div class="pv" @click="gallery = gallery === l.id ? null : l.id">
          <template v-if="l.src">
            <video v-if="isVideoFile(l.src)" :src="mediaUrl(l.src)" muted preload="metadata" />
            <img v-else :src="mediaUrl(l.src)" :alt="l.src" />
          </template>
          <span v-else class="dim small">{{ l.type === 'device' ? 'sahte arayüz' : 'seç' }}</span>
        </div>
        <div class="grow stack">
          <select class="input" :value="l.src || ''" @change="pickMedia(l, $event.target.value)">
            <option value="">{{ l.type === 'device' ? '(sahte arayüz)' : '(seç)' }}</option>
            <option v-if="l.src && !inLib(l.src)" :value="l.src">? {{ l.src }} (dosya yok)</option>
            <option v-for="m in res.media" :key="m.file" :value="m.file">{{ m.video ? '🎞' : '🖼' }} {{ m.file }}</option>
          </select>
          <div class="row">
            <button class="btn sm" @click="gallery = gallery === l.id ? null : l.id">Galeri</button>
            <button class="btn sm" :disabled="uploading" @click="askUpload(l)">Yükle</button>
            <button v-if="l.src" class="btn sm ghost" @click="pickMedia(l, '')">Kaldır</button>
          </div>
        </div>
      </div>
      <div v-if="gallery === l.id" class="gal">
        <p v-if="!res.media.length" class="dim small">Henüz yüklenmiş dosya yok.</p>
        <button v-for="m in res.media" :key="m.file" class="gi" :class="{ on: m.file === l.src }" :title="`${m.file} · ${usage(m.file)} katmanda`" @click="pickMedia(l, m.file)">
          <video v-if="m.video" :src="mediaUrl(m.file)" muted preload="metadata" />
          <img v-else :src="mediaUrl(m.file)" :alt="m.file" loading="lazy" />
          <span class="small ell">{{ m.file }}</span>
        </button>
      </div>
    </div>
    <input ref="fileInput" type="file" hidden accept="image/*,video/mp4,video/webm,video/quicktime" @change="upload" />
  </div>
</template>

<style scoped>
.cp { display: grid; gap: 8px; padding: 10px; align-content: start; }
.sec-title { margin-top: 6px; font-weight: 600; }
.find { display: grid; gap: 6px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); }
.it { display: grid; gap: 6px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); }
.it.sel { border-color: var(--accent); }
.ih { cursor: pointer; gap: 6px; }
.ell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
textarea.input { resize: vertical; }
.stack { display: grid; gap: 6px; min-width: 0; }
.img { align-items: flex-start; gap: 8px; }
.pv { width: 76px; height: 76px; flex: none; display: grid; place-items: center; background: #000 center/cover; border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--line); }
.pv img, .pv video { width: 100%; height: 100%; object-fit: cover; }
.gal { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-height: 260px; overflow: auto; }
.gi { display: grid; gap: 2px; padding: 4px; background: transparent; border: 1px solid var(--line); border-radius: 8px; color: inherit; cursor: pointer; min-width: 0; }
.gi.on { border-color: var(--accent); }
.gi img, .gi video { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; }
</style>
