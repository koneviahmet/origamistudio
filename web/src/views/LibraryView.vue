<script setup>
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { api } from '../api.js';
import { useLive } from '../live.js';
import { toast, toastError } from '../toast.js';
import { clone } from '../sceneOps.js';
import { FOLD_ORDERS, invalidateAsset, resolveColor } from '../engine/origami.js';
import { shade } from '../engine/color.js';
import { ROLES, ROLE_LABELS } from '../engine/theme.js';
import { STYLES } from '../engine/styles.js';
import AssetCanvas from '../components/AssetCanvas.vue';
import FacetEditor from '../components/FacetEditor.vue';
import ImportImageDialog from '../components/ImportImageDialog.vue';
import ParticlePreview from '../components/ParticlePreview.vue';
import ParticleItemEditor from '../components/ParticleItemEditor.vue';
import ArrowPreview from '../components/ArrowPreview.vue';
import ArrowItemEditor from '../components/ArrowItemEditor.vue';

const CAT_LABELS = { hayvanlar: 'Hayvanlar', doga: 'Doğa', gokyuzu: 'Gökyüzü', nesneler: 'Nesneler', sekiller: 'Şekiller', deniz: 'Deniz', uzay: 'Uzay', efektler: 'Efektler', oklar: 'Oklar' };
const catLabel = (c) => CAT_LABELS[c] || c;

const categories = ref([]);
const assets = ref([]);
const activeCat = ref('');
const search = ref('');
const hover = ref('');
const loading = ref(true);
const ollaya = ref({ aktif: false, calisiyor: false });
async function loadOllaya() {
  try { ollaya.value = await api.ollaya(); } catch { /* sunucu yoksa pasif say */ }
}
async function toggleOllaya() {
  try {
    ollaya.value = await api.setOllaya(!ollaya.value.aktif);
    toast(ollaya.value.aktif ? (ollaya.value.calisiyor ? 'Ollaya aktif' : 'Ollaya aktif ama port yanıt vermiyor — yedek arama kullanılır') : 'Ollaya kapalı');
  } catch (e) { toastError(e); }
}

// Düzenleyici durumu
const draft = ref(null);
const origId = ref(null);
const tab = ref('visual');
const selFacet = ref(-1);
const previewFold = ref(1);
const previewAnim = ref(false);
const previewOrder = ref('radial');
const previewSpread = ref(0.6);
const jsonText = ref('');
const jsonErr = ref('');
const dirty = ref(false);
const tagsText = ref('');
const editVariant = ref('');
const showImport = ref(false);
async function onImported(asset) {
  showImport.value = false;
  await load();
  dirty.value = false;
  openAsset(asset);
}
const editMode = ref('sec'); // sec | ciz | yok
const gridSize = ref(5);
const linked = ref(true);
const mirror = ref(false);
const drawColor = ref('a');
const editorOn = computed(() => editMode.value !== 'yok' && !previewAnim.value && previewFold.value >= 1);
function mirrorFacet() {
  const i = selFacet.value;
  if (i < 0) return;
  const f = clone(draft.value.facets[i]);
  const aw = draft.value.size[0];
  f.p = f.p.map(([x, y]) => [Math.round((aw - x) * 10) / 10, y]).reverse();
  f.s = Math.round(-(f.s || 0) * 100) / 100 - 0.08;
  draft.value.facets.splice(i + 1, 0, f);
  selFacet.value = i + 1;
  invalidateAsset(toRaw(draft.value));
  touch();
}
const previewStyle = ref('origami');

async function load() {
  try {
    const d = await api.library();
    categories.value = d.categories;
    assets.value = d.assets.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr'));
  } catch (e) {
    toastError(e);
  } finally {
    loading.value = false;
  }
}
onMounted(() => { load(); loadOllaya(); });
useLive((e) => e.kind === 'library' && load());

const counts = computed(() => {
  const m = {};
  for (const a of assets.value) m[a.category] = (m[a.category] || 0) + 1;
  return m;
});

const filtered = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr');
  return assets.value.filter((a) => {
    if (activeCat.value && a.category !== activeCat.value) return false;
    if (!q) return true;
    return [a.id, a.name, ...(a.tags || [])].join(' ').toLocaleLowerCase('tr').includes(q);
  });
});

// ------------------------------------------------------------- kategoriler
async function addCategory() {
  const name = prompt('Yeni kategori adı (harf, rakam, - ve _):');
  if (!name) return;
  try {
    await api.createCategory(name.trim());
    activeCat.value = name.trim();
    await load();
  } catch (e) {
    toastError(e);
  }
}
async function renameCategory(c) {
  const name = prompt('Kategorinin yeni adı:', c);
  if (!name || name === c) return;
  try {
    await api.renameCategory(c, name.trim());
    if (activeCat.value === c) activeCat.value = name.trim();
    await load();
  } catch (e) {
    toastError(e);
  }
}
async function deleteCategory(c) {
  if (!confirm(`"${catLabel(c)}" kategorisi silinsin mi? (Yalnızca boş kategoriler silinebilir)`)) return;
  try {
    await api.deleteCategory(c);
    if (activeCat.value === c) activeCat.value = '';
    await load();
  } catch (e) {
    toastError(e);
  }
}

// ---------------------------------------------------------------- editör
function openAsset(a) {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = clone(a);
  origId.value = a.id;
  afterOpen();
}

function newEffect() {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = {
    id: 'yeni-efekt',
    name: 'Yeni efekt',
    category: categories.value.includes('efektler') ? 'efektler' : activeCat.value || categories.value[0] || 'genel',
    tags: ['efekt'],
    type: 'particles',
    motion: 'dus',
    shape: 'kagit',
    count: 80,
    size: 20,
    speed: 200,
    sway: 40,
    spin: 4,
    colors: ['#ffd166', '#ef476f', '#06d6a0'],
  };
  origId.value = null;
  afterOpen();
  dirty.value = true;
}

function newArrow() {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = {
    id: 'yeni-ok',
    name: 'Yeni ok',
    category: categories.value.includes('oklar') ? 'oklar' : activeCat.value || categories.value[0] || 'genel',
    tags: ['ok'],
    type: 'arrow',
    curve: 'kavis',
    line: 'duz',
    head: 'ucgen',
    width: 8,
    headSize: 34,
    color: '#2d3561',
    bend: 0.25,
  };
  origId.value = null;
  afterOpen();
  dirty.value = true;
}

function newAsset() {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = {
    id: 'yeni-varlik',
    name: 'Yeni Varlık',
    category: activeCat.value || categories.value[0] || 'genel',
    tags: [],
    size: [200, 200],
    palette: { a: '#ea7a3b', b: '#3b2a22' },
    facets: [
      { p: [[100, 20], [20, 180], [100, 180]], c: 'a', s: 0.12 },
      { p: [[100, 20], [180, 180], [100, 180]], c: 'a', s: -0.16 },
    ],
  };
  origId.value = null;
  afterOpen();
  dirty.value = true;
}

function afterOpen() {
  selFacet.value = -1;
  editVariant.value = '';
  tab.value = 'visual';
  previewFold.value = 1;
  previewAnim.value = false;
  tagsText.value = (draft.value.tags || []).join(', ');
  jsonText.value = JSON.stringify(draft.value, null, 2);
  jsonErr.value = '';
  dirty.value = false;
}

function close() {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Kapatılsın mı?')) return;
  draft.value = null;
  dirty.value = false;
}

function touch() {
  dirty.value = true;
}

watch(tab, (t) => {
  if (t === 'json') {
    jsonText.value = JSON.stringify(draft.value, null, 2);
    jsonErr.value = '';
  }
});

function applyJson() {
  try {
    const d = JSON.parse(jsonText.value);
    if (!d.type) {
      if (!Array.isArray(d.facets)) throw new Error('"facets" dizisi gerekli');
      if (!Array.isArray(d.size) || d.size.length !== 2) throw new Error('"size": [genişlik, yükseklik] gerekli');
    }
    draft.value = d;
    tagsText.value = (d.tags || []).join(', ');
    jsonErr.value = '';
    selFacet.value = -1;
    touch();
    toast('JSON uygulandı', 'ok');
  } catch (e) {
    jsonErr.value = e.message;
  }
}

async function save() {
  const d = draft.value;
  d.tags = tagsText.value.split(',').map((s) => s.trim()).filter(Boolean);
  try {
    const saved = origId.value ? await api.updateAsset(origId.value, d) : await api.createAsset(d);
    draft.value = clone(saved);
    origId.value = saved.id;
    dirty.value = false;
    toast(`Kaydedildi: ${saved.name || saved.id}`, 'ok');
    await load();
  } catch (e) {
    toastError(e);
  }
}

async function duplicate() {
  const d = clone(draft.value);
  let id = `${d.id}-kopya`;
  let i = 2;
  while (assets.value.some((a) => a.id === id)) id = `${d.id}-kopya-${i++}`;
  d.id = id;
  d.name = `${d.name || d.id} (kopya)`;
  try {
    const saved = await api.createAsset(d);
    await load();
    dirty.value = false;
    openAsset(saved);
    toast('Kopya oluşturuldu', 'ok');
  } catch (e) {
    toastError(e);
  }
}

async function remove() {
  if (!origId.value) return close();
  if (!confirm(`"${draft.value.name || origId.value}" kalıcı olarak silinsin mi?\nBu varlığı kullanan projelerde katman "?" olarak görünür.`)) return;
  try {
    await api.deleteAsset(origId.value);
    dirty.value = false;
    draft.value = null;
    await load();
    toast('Silindi');
  } catch (e) {
    toastError(e);
  }
}

// ------------------------------------------------------------- palet/facet
const paletteKeys = computed(() => Object.keys(draft.value?.palette || {}));
const facet = computed(() => (selFacet.value >= 0 ? draft.value?.facets[selFacet.value] : null));
const partNames = computed(() => Object.keys(draft.value?.parts || {}));

function addPaletteKey() {
  const k = prompt('Palet anahtarı (ör. a, b, govde):');
  if (!k) return;
  draft.value.palette ||= {};
  draft.value.palette[k.trim()] = '#888888';
  touch();
}
function removePaletteKey(k) {
  const used = draft.value.facets.some((f) => f.c === k);
  if (used && !confirm(`"${k}" facet'lerde kullanılıyor. Yine de silinsin mi?`)) return;
  delete draft.value.palette[k];
  touch();
}

function shownColor(k) {
  return (editVariant.value && draft.value.variants?.[editVariant.value]?.palette?.[k]) || draft.value.palette[k];
}
function setColor(k, v) {
  if (editVariant.value) {
    const vr = draft.value.variants[editVariant.value];
    vr.palette ||= {};
    vr.palette[k] = v;
  } else {
    draft.value.palette[k] = v;
  }
  touch();
}
function setRole(k, r) {
  draft.value.roles ||= {};
  if (r) draft.value.roles[k] = r;
  else delete draft.value.roles[k];
  if (!Object.keys(draft.value.roles).length) delete draft.value.roles;
  touch();
}
function addVariant() {
  const name = prompt('Varyant adı (ör. Kutup, Gece):');
  if (!name) return;
  const id = name.trim().toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-').replace(/^-|-$/g, '') || 'varyant';
  draft.value.variants ||= {};
  draft.value.variants[id] = { name: name.trim(), palette: {} };
  editVariant.value = id;
  touch();
}
function renameVariant() {
  const v = draft.value.variants[editVariant.value];
  const name = prompt('Varyant adı:', v.name || editVariant.value);
  if (!name) return;
  v.name = name.trim();
  touch();
}
function deleteVariant() {
  if (!confirm('Varyant silinsin mi? Bu varyantı kullanan katmanlar varsayılan renklere döner.')) return;
  delete draft.value.variants[editVariant.value];
  if (!Object.keys(draft.value.variants).length) delete draft.value.variants;
  editVariant.value = '';
  touch();
}
function resetVariantColor(k) {
  delete draft.value.variants[editVariant.value].palette[k];
  touch();
}

function facetSwatch(f) {
  return shade(resolveColor(f.c, draft.value.palette), f.s || 0);
}

function moveFacet(dir) {
  const i = selFacet.value;
  const j = i + dir;
  const f = draft.value.facets;
  if (i < 0 || j < 0 || j >= f.length) return;
  [f[i], f[j]] = [f[j], f[i]];
  selFacet.value = j;
  touch();
}
function deleteFacet() {
  if (selFacet.value < 0) return;
  draft.value.facets.splice(selFacet.value, 1);
  selFacet.value = -1;
  touch();
}
function duplicateFacet() {
  const i = selFacet.value;
  if (i < 0) return;
  const f = clone(draft.value.facets[i]);
  f.p = f.p.map(([x, y]) => [x + 6, y + 6]);
  draft.value.facets.splice(i + 1, 0, f);
  selFacet.value = i + 1;
  touch();
}
function setFacetColor(v) {
  facet.value.c = v;
  touch();
}
const facetPointsText = computed({
  get: () => (facet.value ? JSON.stringify(facet.value.p) : ''),
  set: (v) => {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p) && p.length >= 3) {
        facet.value.p = p;
        invalidateAsset(toRaw(draft.value));
        touch();
      }
    } catch {
      /* yazarken geçersiz olabilir */
    }
  },
});
</script>

<template>
  <div class="lib">
    <aside class="cats">
      <div class="cats-head">
        <span class="label">Kategoriler</span>
        <button class="btn sm ghost" title="Kategori ekle" @click="addCategory">＋</button>
      </div>
      <button class="cat" :class="{ active: !activeCat }" @click="activeCat = ''">
        <span>Tümü</span><span class="dim">{{ assets.length }}</span>
      </button>
      <div v-for="c in categories" :key="c" class="cat-row">
        <button class="cat" :class="{ active: activeCat === c }" @click="activeCat = c" @dblclick="renameCategory(c)">
          <span>{{ catLabel(c) }}</span><span class="dim">{{ counts[c] || 0 }}</span>
        </button>
        <button class="btn icon sm ghost del" title="Kategoriyi sil" @click="deleteCategory(c)">✕</button>
      </div>
      <p class="dim small hint">Yeniden adlandırmak için kategoriye çift tıklayın.</p>
    </aside>

    <section class="main">
      <div class="toolbar row">
        <input v-model="search" class="input search" placeholder="Ara: isim, id, etiket…" />
        <div class="grow" />
        <span class="dim small">{{ filtered.length }} varlık</span>
        <button
          class="btn"
          :class="{ primary: ollaya.aktif && ollaya.calisiyor }"
          :title="'Yapay zekâ kütüphane aramasında yerel Ollaya (laya) yardımcı olsun. Kapalıysa ya da port yoksa anahtar kelime araması kullanılır.'"
          @click="toggleOllaya"
        >
          Ollaya: {{ ollaya.aktif ? 'açık' : 'kapalı' }}<span v-if="ollaya.aktif && !ollaya.calisiyor"> ⚠ port yok</span>
        </button>
        <button class="btn" title="PNG / JPG / SVG'den otomatik low-poly origami" @click="showImport = true">⬆ Görselden origami</button>
        <button class="btn" title="Kar, konfeti, yağmur gibi parçacık efekti" @click="newEffect">＋ Yeni efekt</button>
        <button class="btn" title="Nesneden nesneye geçiş oku stili" @click="newArrow">＋ Yeni ok</button>
        <button class="btn primary" @click="newAsset">＋ Yeni varlık</button>
      </div>
      <div v-if="loading" class="dim pad">Yükleniyor…</div>
      <div v-else-if="!filtered.length" class="empty dim">
        Bu filtrede varlık yok.
      </div>
      <div class="grid">
        <button
          v-for="a in filtered"
          :key="a.id"
          class="card"
          :class="{ active: draft && origId === a.id }"
          @click="openAsset(a)"
          @mouseenter="hover = a.id"
          @mouseleave="hover = ''"
        >
          <div class="thumb" :class="{ fx: a.type === 'particles' }">
            <ParticlePreview v-if="a.type === 'particles'" :item="a" :animate="hover === a.id" />
            <ArrowPreview v-else-if="a.type === 'arrow'" :item="a" :animate="hover === a.id" />
            <AssetCanvas v-else :asset="a" :animate="hover === a.id" />
          </div>
          <div class="meta">
            <div class="name">{{ a.name || a.id }}</div>
            <div class="dim small mono">{{ a.id }}</div>
            <div class="tags">
              <span class="chip">{{ catLabel(a.category) }}</span>
              <span v-if="a.type === 'particles'" class="chip fxchip">✦ efekt</span>
              <span v-else-if="a.type === 'arrow'" class="chip okchip">➜ ok</span>
              <span v-else class="chip">{{ a.facets?.length || 0 }} facet</span>
              <span v-if="a.variants" class="chip">{{ Object.keys(a.variants).length }} varyant</span>
            </div>
          </div>
        </button>
      </div>
    </section>

    <aside v-if="draft" class="editor">
      <div class="ed-head row">
        <div class="grow">
          <div class="ed-title">{{ draft.name || draft.id }} <span v-if="dirty" class="chip warn">kaydedilmedi</span></div>
          <div class="dim small mono">{{ origId ? `${draft.category}/${origId}` : 'yeni varlık' }}</div>
        </div>
        <button class="btn primary" @click="save">Kaydet</button>
        <button class="btn" :disabled="!origId" @click="duplicate">Çoğalt</button>
        <button class="btn danger" @click="remove">Sil</button>
        <button class="btn icon ghost" title="Kapat" @click="close">✕</button>
      </div>
      <div class="tabs">
        <button :class="{ active: tab === 'visual' }" @click="tab = 'visual'">Görsel</button>
        <button :class="{ active: tab === 'json' }" @click="tab = 'json'">JSON</button>
      </div>

      <div v-if="tab === 'visual' && (draft.type === 'particles' || draft.type === 'arrow')" class="ed-body fx-body">
        <ParticleItemEditor v-if="draft.type === 'particles'" :item="draft" @change="touch" />
        <ArrowItemEditor v-else :item="draft" @change="touch" />
        <div class="ed-side">
          <div class="grid2">
            <div class="field"><label>İsim</label><input v-model="draft.name" class="input" @input="touch" /></div>
            <div class="field"><label>ID</label><input v-model="draft.id" class="input mono" @input="touch" /></div>
            <div class="field">
              <label>Kategori</label>
              <select v-model="draft.category" class="input" @change="touch">
                <option v-for="c in categories" :key="c" :value="c">{{ catLabel(c) }}</option>
              </select>
            </div>
          </div>
          <div class="field"><label>Etiketler (virgülle)</label><input v-model="tagsText" class="input" @input="touch" /></div>
        </div>
      </div>
      <div v-else-if="tab === 'visual'" class="ed-body">
        <div class="ed-preview">
          <div class="stage-box">
            <AssetCanvas
              :asset="draft"
              :animate="previewAnim"
              :fold="previewFold"
              :order="previewOrder"
              :spread="previewSpread"
              :highlight="selFacet"
              :variant="editVariant"
              :draw-style="previewStyle"
              :pad="0.06"
              checker
              deep
              @pick="(i) => (selFacet = i)"
            />
            <FacetEditor
              v-if="editorOn"
              :asset="draft"
              :selected="selFacet"
              :pad="0.06"
              :mode="editMode"
              :grid="gridSize"
              :linked="linked"
              :mirror="mirror"
              :color="drawColor"
              @select="(i) => (selFacet = i)"
              @change="touch"
              @done="editMode = 'sec'"
            />
          </div>
          <div class="row wrap edit-bar">
            <div class="seg">
              <button class="btn sm" :class="{ on: editMode === 'sec' }" title="Seç ve noktaları düzenle" @click="editMode = 'sec'">⬚ Düzenle</button>
              <button class="btn sm" :class="{ on: editMode === 'ciz' }" title="Tıklayarak yeni yüzey çiz; ilk noktaya tıkla ya da Enter ile bitir, Esc iptal" @click="editMode = 'ciz'">✎ Yüzey çiz</button>
              <button class="btn sm" :class="{ on: editMode === 'yok' }" title="Editörü gizle (yalnız önizleme)" @click="editMode = 'yok'">👁</button>
            </div>
            <template v-if="editMode === 'ciz'">
              <span class="dim small">renk</span>
              <select v-model="drawColor" class="input sel">
                <option v-for="k in paletteKeys" :key="k" :value="k">{{ k }}</option>
              </select>
            </template>
            <label class="small row" title="Izgaraya yapış (Shift: kapalı)">
              ızgara
              <select v-model.number="gridSize" class="input sel">
                <option :value="0">yok</option>
                <option :value="2">2</option>
                <option :value="5">5</option>
                <option :value="10">10</option>
              </select>
            </label>
            <label class="small row" title="Ortak köşeler birlikte taşınır (model kopmaz)"><input v-model="linked" type="checkbox" /> bağlı noktalar</label>
            <label class="small row" title="Dikey eksene göre simetrik düzenle / çiz"><input v-model="mirror" type="checkbox" /> simetri</label>
          </div>
          <p v-if="editorOn && editMode === 'sec'" class="dim small">
            Yüzeye tıkla: seç · Noktayı sürükle: taşı · Kenar ortasındaki noktaya tıkla: nokta ekle · Sağ tık: nokta sil ·
            Ok tuşları: yüzeyi kaydır (Shift ×5) · Turuncu artı: parça pivotu
          </p>
          <p v-else-if="editorOn && editMode === 'ciz'" class="dim small">Tıklayarak köşe ekle · ilk noktaya tıkla ya da Enter: bitir · Backspace: son noktayı sil · Esc: iptal</p>
          <p v-else-if="editMode !== 'yok'" class="dim small">Düzenlemek için katlanmayı 1'e getirip animasyonu durdurun.</p>
          <div class="row wrap">
            <button class="btn sm" :class="{ on: previewAnim }" @click="previewAnim = !previewAnim">
              {{ previewAnim ? '■ Durdur' : '▶ Katlanmayı oynat' }}
            </button>
            <label class="dim small">Katlanma</label>
            <input v-model.number="previewFold" type="range" min="0" max="1" step="0.01" class="grow" :disabled="previewAnim" />
            <select v-model="previewOrder" class="input sel">
              <option v-for="o in FOLD_ORDERS" :key="o" :value="o">{{ o }}</option>
            </select>
            <select v-model="previewStyle" class="input sel" title="Önizleme stili">
              <option v-for="(st, k) in STYLES" :key="k" :value="k">{{ st.label }}</option>
            </select>
            <label class="dim small" title="Facet'lerin açılma sırası ne kadar yayılsın">Yayılım</label>
            <input v-model.number="previewSpread" type="range" min="0" max="0.95" step="0.05" style="width: 70px" />
          </div>
          <p class="dim small">Önizlemede bir yüzeye tıklayarak seçin. Menteşe, varlık merkezine en yakın kenardır (facet'e <code>"hinge": kenarIndeksi</code> ile değiştirilebilir).</p>
        </div>

        <div class="ed-side">
          <div class="grid2">
            <div class="field"><label>İsim</label><input v-model="draft.name" class="input" @input="touch" /></div>
            <div class="field"><label>ID</label><input v-model="draft.id" class="input mono" @input="touch" /></div>
            <div class="field">
              <label>Kategori</label>
              <select v-model="draft.category" class="input" @change="touch">
                <option v-for="c in categories" :key="c" :value="c">{{ catLabel(c) }}</option>
              </select>
            </div>
            <div class="field">
              <label>Boyut (g × y)</label>
              <div class="row">
                <input v-model.number="draft.size[0]" type="number" class="input" @input="touch" />
                <input v-model.number="draft.size[1]" type="number" class="input" @input="touch" />
              </div>
            </div>
          </div>
          <div class="field"><label>Etiketler (virgülle)</label><input v-model="tagsText" class="input" @input="touch" /></div>

          <div class="section">
            <div class="row"><span class="label grow">Palet · roller · varyantlar</span><button class="btn sm" @click="addPaletteKey">＋ renk</button></div>
            <div class="row wrap variants">
              <button class="btn sm" :class="{ on: !editVariant }" @click="editVariant = ''">Varsayılan</button>
              <button
                v-for="(v, k) in draft.variants || {}"
                :key="k"
                class="btn sm"
                :class="{ on: editVariant === k }"
                @click="editVariant = k"
              >{{ v.name || k }}</button>
              <button class="btn sm ghost" title="Mevcut renklerden yeni varyant" @click="addVariant">＋ varyant</button>
            </div>
            <div v-if="editVariant" class="row small var-bar">
              <span class="grow">"{{ draft.variants[editVariant].name || editVariant }}" düzenleniyor — yalnızca değişen renkler kaydedilir</span>
              <button class="btn sm" @click="renameVariant">Ad</button>
              <button class="btn sm danger" @click="deleteVariant">Sil</button>
            </div>
            <div class="palette">
              <div v-for="k in paletteKeys" :key="k" class="pal-item">
                <input type="color" class="input" :value="shownColor(k)" @input="setColor(k, $event.target.value)" />
                <span class="mono">{{ k }}</span>
                <select class="input role" :value="draft.roles?.[k] || ''" title="Rol: temalar bu anlama göre renk verir" @change="setRole(k, $event.target.value)">
                  <option value="">rol yok</option>
                  <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
                </select>
                <button v-if="editVariant && draft.variants[editVariant].palette?.[k]" class="btn icon sm ghost" title="Varsayılan renge dön" @click="resetVariantColor(k)">↺</button>
                <button v-else-if="!editVariant" class="btn icon sm ghost" @click="removePaletteKey(k)">✕</button>
                <span v-else class="ph" />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="row"><span class="label grow">Yüzeyler ({{ draft.facets.length }})</span></div>
            <div class="facets">
              <button
                v-for="(f, i) in draft.facets"
                :key="i"
                class="facet-dot"
                :class="{ active: selFacet === i }"
                :style="{ background: facetSwatch(f) }"
                :title="`#${i} ${f.part ? '· ' + f.part : ''}`"
                @click="selFacet = i"
              />
            </div>
            <div v-if="facet" class="facet-edit">
              <div class="row">
                <strong>#{{ selFacet }}</strong>
                <div class="grow" />
                <button class="btn sm" title="Alta al (önce çiz)" @click="moveFacet(-1)">↓ geri</button>
                <button class="btn sm" title="Üste al (sonra çiz)" @click="moveFacet(1)">↑ öne</button>
                <button class="btn sm" @click="duplicateFacet">Çoğalt</button>
                <button class="btn sm" title="Dikey eksene göre aynalı kopya" @click="mirrorFacet">Aynala</button>
                <button class="btn sm danger" @click="deleteFacet">Sil</button>
              </div>
              <div class="field">
                <label>Renk</label>
                <div class="row wrap">
                  <button
                    v-for="k in paletteKeys"
                    :key="k"
                    class="btn sm"
                    :class="{ on: facet.c === k }"
                    @click="setFacetColor(k)"
                  >
                    <span class="sw" :style="{ background: draft.palette[k] }" />{{ k }}
                  </button>
                  <input
                    type="color"
                    class="input"
                    :value="facet.c?.startsWith('#') ? facet.c : '#888888'"
                    title="Özel renk"
                    @input="setFacetColor($event.target.value)"
                  />
                </div>
              </div>
              <div class="field">
                <label>Işık / gölge: {{ (facet.s || 0).toFixed(2) }}</label>
                <input v-model.number="facet.s" type="range" min="-0.6" max="0.6" step="0.01" @input="touch" />
              </div>
              <div class="field">
                <label>Parça (animasyon grubu)</label>
                <input v-model="facet.part" class="input" list="part-names" placeholder="ör. wingL" @input="touch" />
                <datalist id="part-names"><option v-for="p in partNames" :key="p" :value="p" /></datalist>
              </div>
              <div class="field">
                <label>Noktalar [[x,y],…]</label>
                <textarea v-model.lazy="facetPointsText" class="input mono" rows="3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="ed-json">
        <textarea v-model="jsonText" class="input mono json" spellcheck="false" />
        <div class="row">
          <span v-if="jsonErr" class="err grow">{{ jsonErr }}</span>
          <span v-else class="dim small grow">JSON'u düzenleyip "Uygula" deyin, sonra "Kaydet".</span>
          <button class="btn" @click="applyJson">Uygula</button>
        </div>
      </div>
    </aside>
  </div>
  <ImportImageDialog v-if="showImport" :categories="categories" :category="activeCat" @close="showImport = false" @created="onImported" />
</template>

<style scoped>
.lib { display: grid; grid-template-columns: 220px 1fr auto; height: 100%; }
.cats { border-right: 1px solid var(--line); padding: 12px 8px; overflow: auto; background: var(--bg-2); }
.cats-head { display: flex; align-items: center; justify-content: space-between; padding: 0 6px 8px; }
.cat-row { display: flex; align-items: center; }
.cat-row .del { opacity: 0; }
.cat-row:hover .del { opacity: 1; }
.cat {
  flex: 1; display: flex; justify-content: space-between; align-items: center;
  background: none; border: none; padding: 7px 10px; border-radius: 6px; cursor: pointer; text-align: left;
  color: var(--text-2);
}
.cat:hover { background: var(--panel); }
.cat.active { background: var(--panel-2); color: var(--text); }
.hint { padding: 8px 6px; }

.main { overflow: auto; min-width: 0; }
.toolbar { position: sticky; top: 0; z-index: 2; padding: 12px 16px; background: var(--bg); border-bottom: 1px solid var(--line); }
.search { max-width: 320px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; padding: 16px; }
.empty, .pad { padding: 32px 16px; }
.card {
  background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 0; overflow: hidden;
  cursor: pointer; text-align: left; transition: border-color .12s, transform .12s;
}
.card:hover { border-color: var(--line-2); transform: translateY(-1px); }
.card.active { border-color: var(--accent); }
.thumb.fx { background: #0b1026; }
.fxchip { color: #f2c14e; border-color: #6b5520; }
.okchip { color: #7dd3fc; border-color: #1e4a63; }
.fx-body { grid-template-columns: 1fr 260px; }
.thumb { aspect-ratio: 1; overflow: hidden; background: radial-gradient(circle at 50% 40%, #fbf1e2, #efd9bd); }
.meta { padding: 8px 10px 10px; display: grid; gap: 2px; }
.name { font-weight: 600; }
.tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }

.editor {
  width: min(820px, 58vw); border-left: 1px solid var(--line); background: var(--panel);
  display: flex; flex-direction: column; min-height: 0;
}
.ed-head { padding: 12px 14px; border-bottom: 1px solid var(--line); }
.ed-title { font-weight: 600; font-size: 16px; display: flex; gap: 8px; align-items: center; }
.ed-body { display: grid; grid-template-columns: 1fr 300px; gap: 14px; padding: 14px; overflow: auto; flex: 1; min-height: 0; }
.ed-preview { display: grid; gap: 10px; align-content: start; }
.edit-bar { gap: 6px; }
.seg { display: flex; gap: 2px; }
.stage-box {
  position: relative;
  aspect-ratio: 1; border-radius: 10px; border: 1px solid var(--line);
  background: radial-gradient(circle at 50% 40%, #fbf1e2, #e9d2b3);
}
.wrap { flex-wrap: wrap; }
.sel { width: auto; }
.ed-side { display: grid; gap: 14px; align-content: start; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.section { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
.palette { display: grid; gap: 6px; }
.pal-item { display: flex; align-items: center; gap: 8px; }
.pal-item .mono { width: 34px; }
.pal-item .role { flex: 1; height: 26px; font-size: 12px; }
.pal-item .ph { width: 26px; }
.variants { gap: 4px; flex-wrap: wrap; }
.var-bar { background: #2d2118; border: 1px solid #6a4a30; border-radius: 6px; padding: 4px 8px; color: var(--accent-2); }
.facets { display: flex; flex-wrap: wrap; gap: 4px; }
.facet-dot { width: 22px; height: 22px; border-radius: 5px; border: 2px solid transparent; cursor: pointer; }
.facet-dot.active { border-color: #22d3ee; }
.facet-edit { display: grid; gap: 10px; background: var(--bg-2); padding: 10px; border-radius: 8px; border: 1px solid var(--line); }
.sw { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.ed-json { display: flex; flex-direction: column; gap: 8px; padding: 14px; flex: 1; min-height: 0; }
.json { flex: 1; min-height: 300px; resize: none; line-height: 1.5; }
code { font-family: var(--mono); font-size: 11px; background: var(--bg-2); padding: 1px 4px; border-radius: 4px; }
</style>
