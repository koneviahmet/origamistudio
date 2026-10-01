<script setup>
// Bir brief nesnesinin (şablon girdisi) alanlarını otomatik form olarak gösterir.
// Metin / sayı / evet-hayır, dizi (satır satır), nesne dizisi (kartlar: ekle, sil, taşı). Nesneyi yerinde değiştirir.
defineOptions({ name: 'BriefFields' });
const props = defineProps({
  obj: { type: Object, required: true },
  skip: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) },
});

const keys = () => Object.keys(props.obj).filter((k) => !props.skip.includes(k));
const ORTAK = { yil: 'Yıl / dönem', anlatim: 'Anlatım metni (seslendirme)', bilgi: 'Bilgi satırları', notlar: 'Oklu notlar', balon: 'Konuşma balonu', ses: 'Ses dosyası (wav)', ust: 'Üst', alt: 'Alt', kim: 'Kim (a | b)', deger: 'Değer', etiket: 'Etiket', birim: 'Birim', onek: 'Ön ek', oran: 'Doluluk (0–1)', nesne: 'Nesne (kütüphane id)', varyant: 'Varyant' };
const label = (k) => props.labels[k] || ORTAK[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toLocaleUpperCase('tr'));
const kind = (v) => {
  if (Array.isArray(v)) return v.length && v.every((x) => x && typeof x === 'object' && !Array.isArray(x)) ? 'objlist' : 'list';
  if (v && typeof v === 'object') return 'obj';
  return typeof v;
};
const isLong = (v) => typeof v === 'string' && (v.length > 42 || v.includes('\n'));

function setList(k, text) {
  const raw = props.obj[k];
  const nums = Array.isArray(raw) && raw.length && raw.every((x) => typeof x === 'number');
  const rows = text.split('\n').map((s) => s.trim()).filter(Boolean);
  props.obj[k] = nums ? rows.map(Number).filter((n) => !Number.isNaN(n)) : rows;
}
function addItem(k) {
  const list = props.obj[k];
  const last = list[list.length - 1] || {};
  const blank = {};
  for (const [key, v] of Object.entries(last)) blank[key] = typeof v === 'number' ? v : typeof v === 'boolean' ? v : '';
  list.push(blank);
}
function moveItem(k, i, d) {
  const list = props.obj[k];
  const j = i + d;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}
function setNum(o, k, v) {
  o[k] = v === '' ? 0 : Number(v);
}
</script>

<template>
  <div class="bf">
    <div v-for="k in keys()" :key="k" class="field">
      <label>{{ label(k) }}</label>
      <template v-if="kind(obj[k]) === 'string'">
        <textarea v-if="isLong(obj[k])" v-model="obj[k]" class="input" rows="3" />
        <input v-else v-model="obj[k]" class="input" />
      </template>
      <input v-else-if="kind(obj[k]) === 'number'" type="number" class="input" step="any" :value="obj[k]" @input="setNum(obj, k, $event.target.value)" />
      <label v-else-if="kind(obj[k]) === 'boolean'" class="row chk"><input v-model="obj[k]" type="checkbox" /> evet</label>
      <textarea
        v-else-if="kind(obj[k]) === 'list'"
        class="input"
        rows="3"
        :value="obj[k].join('\n')"
        placeholder="her satıra bir öğe"
        @change="setList(k, $event.target.value)"
      />
      <div v-else-if="kind(obj[k]) === 'objlist'" class="items">
        <div v-for="(it, i) in obj[k]" :key="i" class="item">
          <div class="row ih">
            <span class="chip">{{ i + 1 }}</span>
            <span class="grow" />
            <button type="button" class="btn sm ghost" title="Yukarı" @click="moveItem(k, i, -1)">↑</button>
            <button type="button" class="btn sm ghost" title="Aşağı" @click="moveItem(k, i, 1)">↓</button>
            <button type="button" class="btn sm ghost danger" title="Sil" @click="obj[k].splice(i, 1)">✕</button>
          </div>
          <BriefFields :obj="it" />
        </div>
        <button type="button" class="btn sm" @click="addItem(k)">＋ Öğe ekle</button>
      </div>
      <div v-else-if="kind(obj[k]) === 'obj'" class="item"><BriefFields :obj="obj[k]" /></div>
      <span v-else class="dim small">(karmaşık değer — JSON sekmesinden düzenle)</span>
    </div>
  </div>
</template>

<style scoped>
.bf { display: grid; gap: 10px; }
.items { display: grid; gap: 8px; }
.item { border: 1px solid var(--line); border-radius: 10px; padding: 8px; background: var(--bg-2); }
.ih { margin-bottom: 6px; }
.chk { height: 30px; }
textarea.input { resize: vertical; }
</style>
