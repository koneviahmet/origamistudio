<script setup>
import { computed, ref } from 'vue';
import { api } from '../../api.js';
import { resources, reloadResources } from '../../resources.js';
import { toast, toastError } from '../../toast.js';
import { FONT_CAT_LABELS, TR_PANGRAM, TR_CHARS, checkTurkish } from '../../fonts.js';

const q = ref('');
const cat = ref('');
const sample = ref('');
const size = ref(34);
const adding = ref(false);
const form = ref({ family: '', category: 'modern' });
const testing = ref(false);

const list = computed(() => {
  const s = q.value.trim().toLocaleLowerCase('tr');
  return resources.value.fonts.filter((f) => (!cat.value || f.category === cat.value) && (!s || f.family.toLocaleLowerCase('tr').includes(s)));
});
const counts = computed(() => {
  const m = {};
  for (const f of resources.value.fonts) m[f.category] = (m[f.category] || 0) + 1;
  return m;
});

function trState(f) {
  if (!f.latinExt) return { cls: 'bad', text: 'TR yok', title: 'Google Fonts bu font için Türkçe (latin-ext) alt kümesi sunmuyor' };
  if (!f.check) return { cls: 'unk', text: 'TR ?', title: 'Henüz test edilmedi' };
  if (f.check.ok) return { cls: 'ok', text: 'TR ✓', title: `${TR_CHARS} karakterlerinin hepsi var` };
  return { cls: 'bad', text: `TR ✗ ${f.check.missing}`, title: `Eksik karakterler: ${f.check.missing}` };
}

async function test(f) {
  try {
    const r = await checkTurkish(f.family, f.weights.includes(400) ? 400 : f.weights[0]);
    await api.updateFont(f.family, { check: r });
    return r;
  } catch (e) {
    toastError(e);
  }
}
async function testAll() {
  testing.value = true;
  let bad = 0;
  for (const f of resources.value.fonts) {
    const r = await test(f);
    if (r && !r.ok) bad++;
  }
  await reloadResources('fonts');
  testing.value = false;
  toast(bad ? `${bad} fontta eksik Türkçe karakter var` : 'Tüm fontlar Türkçe karakterleri destekliyor', bad ? 'error' : 'ok', 5000);
}
async function testOne(f) {
  const r = await test(f);
  await reloadResources('fonts');
  if (r) toast(r.ok ? `${f.family}: Türkçe tam ✓` : `${f.family}: eksik ${r.missing}`, r.ok ? 'ok' : 'error');
}
async function add() {
  const family = form.value.family.trim();
  if (!family) return;
  adding.value = true;
  try {
    const f = await api.addFont(family, form.value.category);
    await reloadResources('fonts');
    await testOne(f);
    form.value.family = '';
  } catch (e) {
    toastError(e);
  } finally {
    adding.value = false;
  }
}
async function setCat(f, c) {
  try {
    await api.updateFont(f.family, { category: c });
    await reloadResources('fonts');
  } catch (e) {
    toastError(e);
  }
}
async function remove(f) {
  if (!confirm(`"${f.family}" fontu kütüphaneden silinsin mi? Bu fontu kullanan metinler varsayılan fonta döner.`)) return;
  try {
    await api.deleteFont(f.family);
    await reloadResources('fonts');
  } catch (e) {
    toastError(e);
  }
}
</script>

<template>
  <div class="fonts">
    <div class="bar row">
      <input v-model="q" class="input" style="max-width: 200px" placeholder="Font ara…" />
      <div class="chips row">
        <button class="btn sm" :class="{ on: !cat }" @click="cat = ''">Tümü {{ resources.fonts.length }}</button>
        <button v-for="(l, k) in FONT_CAT_LABELS" :key="k" class="btn sm" :class="{ on: cat === k }" @click="cat = k">{{ l }} {{ counts[k] || 0 }}</button>
      </div>
      <div class="grow" />
      <button class="btn" :disabled="testing" @click="testAll">{{ testing ? 'Test ediliyor…' : 'Türkçe testi (tümü)' }}</button>
    </div>
    <div class="bar row">
      <input v-model="sample" class="input grow" :placeholder="TR_PANGRAM" />
      <label class="dim small">Boyut</label>
      <input v-model.number="size" type="range" min="16" max="72" style="width: 120px" />
      <span class="sep" />
      <form class="row" @submit.prevent="add">
        <input v-model="form.family" class="input" style="width: 200px" placeholder="Google Fonts adı (ör. Kanit)" />
        <select v-model="form.category" class="input" style="width: 120px">
          <option v-for="(l, k) in FONT_CAT_LABELS" :key="k" :value="k">{{ l }}</option>
        </select>
        <button class="btn primary" :disabled="adding || !form.family.trim()">{{ adding ? 'İndiriliyor…' : '＋ Font ekle' }}</button>
      </form>
    </div>

    <div class="grid">
      <div v-for="f in list" :key="f.family" class="card">
        <div class="row">
          <strong class="grow">{{ f.family }}</strong>
          <span class="tr" :class="trState(f).cls" :title="trState(f).title">{{ trState(f).text }}</span>
        </div>
        <div class="sample" :style="{ fontFamily: `'${f.family}'`, fontSize: `${size}px` }">{{ sample || TR_PANGRAM }}</div>
        <div class="chars" :style="{ fontFamily: `'${f.family}'` }">{{ TR_CHARS }} 0123456789</div>
        <div class="row small">
          <span class="dim grow">{{ f.weights.join(' · ') }}</span>
          <select class="input cat" :value="f.category" @change="setCat(f, $event.target.value)">
            <option v-for="(l, k) in FONT_CAT_LABELS" :key="k" :value="k">{{ l }}</option>
          </select>
          <button class="btn sm" title="Türkçe karakter testi" @click="testOne(f)">Test</button>
          <button class="btn icon sm ghost" title="Sil" @click="remove(f)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fonts { height: 100%; overflow: auto; }
.bar { padding: 10px 16px; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 8px; }
.chips { flex-wrap: wrap; gap: 4px; }
.sep { width: 1px; height: 22px; background: var(--line); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; padding: 16px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: grid; gap: 8px; }
.sample { line-height: 1.2; min-height: 1.2em; overflow-wrap: anywhere; }
.chars { color: var(--text-2); font-size: 20px; letter-spacing: .05em; }
.tr { font-size: 11px; padding: 1px 7px; border-radius: 99px; border: 1px solid; white-space: nowrap; }
.tr.ok { color: var(--ok); border-color: #2c5a3b; background: #16261b; }
.tr.bad { color: #ff9c9c; border-color: #6b2b2b; background: #2e1a1a; }
.tr.unk { color: var(--text-3); border-color: var(--line-2); }
.cat { width: 110px; height: 26px; font-size: 12px; }
</style>
