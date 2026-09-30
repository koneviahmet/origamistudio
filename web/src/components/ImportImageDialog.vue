<script setup>
// K7 — Görselden origami içe aktarma penceresi
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { api } from '../api.js';
import { toast, toastError } from '../toast.js';
import { slug } from '../slug.js';
import { imageToOrigami, loadImageFile } from '../importer/imageToOrigami.js';
import AssetCanvas from './AssetCanvas.vue';

const props = defineProps({ categories: { type: Array, required: true }, category: { type: String, default: '' } });
const emit = defineEmits(['close', 'created']);

const img = shallowRef(null);
const imgUrl = ref('');
const result = shallowRef(null);
const error = ref('');
const colors = ref(5);
const spacing = ref(14);
const threshold = ref(40);
const seed = ref(7);
const name = ref('');
const category = ref(props.category || props.categories[0] || 'genel');
const animate = ref(false);
const saving = ref(false);

async function pick(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  error.value = '';
  try {
    const { img: im, url } = await loadImageFile(f);
    if (imgUrl.value) URL.revokeObjectURL(imgUrl.value);
    img.value = im;
    imgUrl.value = url;
    name.value = f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
    convert();
  } catch (err) {
    error.value = err.message;
  }
}

function convert() {
  if (!img.value) return;
  try {
    result.value = imageToOrigami(img.value, { colors: colors.value, spacing: spacing.value, threshold: threshold.value, seed: seed.value });
    error.value = '';
  } catch (err) {
    result.value = null;
    error.value = err.message;
  }
}
let timer = 0;
watch([colors, spacing, threshold, seed], () => {
  clearTimeout(timer);
  timer = setTimeout(convert, 120);
});
onBeforeUnmount(() => imgUrl.value && URL.revokeObjectURL(imgUrl.value));

async function save() {
  if (!result.value) return;
  saving.value = true;
  try {
    const asset = await api.createAsset({
      id: slug(name.value || 'gorsel'),
      name: name.value || 'Görsel',
      category: category.value,
      tags: ['içe aktarım'],
      ...result.value.asset,
    });
    toast(`Kütüphaneye eklendi: ${asset.name}`, 'ok');
    emit('created', asset);
  } catch (err) {
    toastError(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal imp">
      <header class="row">
        <span class="grow">Görselden origami</span>
        <button class="btn icon ghost" @click="emit('close')">✕</button>
      </header>
      <div class="body">
        <label class="drop">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="pick" />
          <span v-if="!img">⬆ PNG / JPG / SVG seç — saydam arka planlı ya da düz arka planlı tek nesne en iyi sonucu verir</span>
          <span v-else>Başka görsel seç</span>
        </label>
        <div v-if="img" class="cmp">
          <div class="box"><img :src="imgUrl" alt="" /></div>
          <div class="box paper">
            <AssetCanvas v-if="result" :key="result.stats.facets + '-' + seed" :asset="result.asset" :animate="animate" :pad="0.06" />
          </div>
        </div>
        <div v-if="result" class="dim small">
          {{ result.stats.facets }} yüzey · {{ result.stats.colors }} renk · {{ result.stats.points }} nokta
          <span v-if="result.stats.facets > 500"> · çok yüzey: animasyonda ağırlaşabilir, yoğunluğu azaltın</span>
        </div>
        <div v-if="img" class="grid">
          <label>Renk sayısı {{ colors }}</label>
          <input v-model.number="colors" type="range" min="2" max="10" />
          <label title="Küçük değer = daha çok, daha küçük üçgen">Üçgen boyu {{ spacing }}</label>
          <input v-model.number="spacing" type="range" min="7" max="32" />
          <label title="Opak görsellerde arka planı ayırma eşiği">Arka plan eşiği {{ threshold }}</label>
          <input v-model.number="threshold" type="range" min="8" max="120" />
          <label>Desen tohumu</label>
          <div class="row"><input v-model.number="seed" type="number" class="input" style="width: 80px" /><button class="btn sm" :class="{ on: animate }" @click="animate = !animate">▶ Katlanma</button></div>
        </div>
        <div v-if="result" class="grid">
          <label>Ad</label>
          <input v-model="name" class="input" />
          <label>Kategori</label>
          <select v-model="category" class="input">
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div v-if="error" class="err">{{ error }}</div>
        <p class="dim small">Yalnızca kullanım hakkına sahip olduğun görselleri içe aktar. Sonucu kütüphane editöründe (noktalar, renkler, roller) düzeltebilirsin.</p>
      </div>
      <footer>
        <button class="btn" @click="emit('close')">Vazgeç</button>
        <button class="btn primary" :disabled="!result || saving" @click="save">{{ saving ? 'Ekleniyor…' : 'Kütüphaneye ekle' }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.imp { width: min(760px, 100%); }
.drop { display: grid; place-items: center; min-height: 56px; border: 2px dashed var(--line-2); border-radius: 10px; cursor: pointer; color: var(--text-2); padding: 8px; text-align: center; }
.drop:hover { border-color: var(--accent); color: var(--text); }
.cmp { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.box { aspect-ratio: 1; border-radius: 10px; border: 1px solid var(--line); background: var(--bg-2); display: grid; place-items: center; overflow: hidden; }
.box img { max-width: 92%; max-height: 92%; }
.box.paper { background: radial-gradient(circle at 50% 40%, #fbf1e2, #e9d2b3); }
.grid { display: grid; grid-template-columns: 150px 1fr; gap: 6px 10px; align-items: center; }
.grid label { font-size: 12px; color: var(--text-2); }
</style>
