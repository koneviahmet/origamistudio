<script setup>
// Bileşenler sayfası: grafik / cihaz / görsel / ses dalgası ön ayarlarını (data/components) oluştur, düzenle, önizle, sil.
// Kayıtlı bileşenler Stüdyo → ＋ Bileşen menüsünde görünür.
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api.js';
import { resources, loadResources, reloadResources } from '../resources.js';
import { newWidgetLayer, componentProps } from '../sceneOps.js';
import { WIDGET2_TYPES, widget2Size } from '../engine/widgets2.js';
import { slug } from '../slug.js';
import { FACET_ORDER, matchComponent, autoTags, tagCounts } from '../componentTags.js';
import { toast, toastError } from '../toast.js';
import SceneThumb from '../components/SceneThumb.vue';
import ScenePlayer from '../components/ScenePlayer.vue';
import WidgetEditor from '../components/studio/WidgetEditor.vue';

const res = resources;
const TYPES = [
  ['chart', '📊', 'Grafik / sayaç', 'Veri hikâyeleri: sütun, çizgi, pasta, halka, sayaç'],
  ['device', '📱', 'Cihaz çerçevesi', 'Telefon, tablet, dizüstü, tarayıcı penceresi'],
  ['media', '🖼', 'Resim / video', 'Yüklediğin dosya için stil: köşe, çerçeve, gölge'],
  ['waveform', '🎚', 'Ses dalgası', 'Müziğe tepki veren çubuk / daire / çizgi'],
  ['kart', '🪪', 'Kart', 'Alıntı, istatistik, fiyat, profil, bildirim, rozet, puan, alt üçlü, takvim, balon'],
  ['liste', '📋', 'Liste / tablo', 'Kontrol listesi, adımlar, ilerleme çubukları, tablo'],
  ['kod', '💻', 'Kod penceresi', 'Yazılan terminal ya da kod editörü'],
  ['zaman', '⏱', 'Zamanlayıcı', 'Geri sayım: dijital, halka, analog saat'],
  ['balon', '💭', 'Balon / not', 'Düşünce, bağırma, fısıltı, anlatıcı, yazıyor, sesli mesaj, ipucu, not kâğıdı, tepki, yorum'],
];
const typeInfo = (t) => TYPES.find((x) => x[0] === t) || TYPES[0];
const FORMATS = { kare: [1080, 1080, 'Kare'], dikey: [1080, 1920, 'Dikey 9:16'], yatay: [1920, 1080, 'Yatay 16:9'] };

const q = ref('');
const typeFilter = ref('');
const format = ref('kare');
const selId = ref(null); // kayıtlı bileşen id'si; null = yeni (kaydedilmemiş)
const work = ref(null); // { name, description, type, layer }
const dirty = ref(false);
const preview = shallowRef(null);
const saving = ref(false);
const showNew = ref(false);

onMounted(async () => {
  await loadResources();
  await reloadResources('components');
  const first = res.value.components.find((c) => c.id === route.params.id) || res.value.components[0];
  if (first) select(first);
});

// Her bileşenin kendi adresi var: /bilesenler/<id> (geri/ileri düğmeleri de çalışır)
const route = useRoute();
const router = useRouter();
watch(() => route.params.id, (id) => {
  if (!id || id === selId.value) return;
  const c = res.value.components.find((x) => x.id === id);
  if (!c) return;
  if (!guard()) {
    router.replace(selId.value ? `/bilesenler/${selId.value}` : '/bilesenler');
    return;
  }
  select(c);
});
function syncUrl(id) {
  const want = id ? `/bilesenler/${id}` : '/bilesenler';
  if (route.path !== want) router.push(want);
}

// Etiket süzgeci: facet içinde VEYA, facetler arasında VE. Sorgu varsa eşleşme puanına göre sıralanır.
const filters = ref({});
const showFilters = ref(false);
const tax = computed(() => res.value.taxonomy);
const facetCounts = computed(() => tagCounts(res.value.components));
const FILTER_FACETS = FACET_ORDER.filter((f) => f !== 'boyut');
const activeFilters = computed(() => Object.values(filters.value).reduce((n, a) => n + a.length, 0));
function toggleFilter(f, v) {
  const a = new Set(filters.value[f] || []);
  if (a.has(v)) a.delete(v);
  else a.add(v);
  filters.value = { ...filters.value, [f]: [...a] };
}
// Etiket kirliliğini azalt: her başlıkta ilk birkaç etiket (+ seçili olanlar) görünür, "+N daha" ile hepsi açılır.
const TAG_LIMIT = 6;
const expanded = ref({});
function visibleTags(key, entries, isOn) {
  if (expanded.value[key]) return { items: entries, hidden: 0 };
  const items = entries.filter(([v], i) => i < TAG_LIMIT || isOn(v));
  return { items, hidden: entries.length - items.length };
}
const filterTags = (f) => visibleTags('f:' + f, Object.entries(tax.value[f]?.degerler || {}).filter(([v]) => facetCounts.value[f]?.[v] || (filters.value[f] || []).includes(v)), (v) => (filters.value[f] || []).includes(v));
const editTags = (f) => visibleTags('t:' + f, Object.entries(tax.value[f]?.degerler || {}), (v) => hasTag(f, v));
const tagName = (f, v) => tax.value[f]?.degerler?.[v]?.ad || v;
const list = computed(() => {
  const f = { ...filters.value };
  if (typeFilter.value) f.tur = [typeFilter.value];
  const rows = res.value.components
    .map((c) => ({ c, s: matchComponent(c, q.value, f, tax.value) }))
    .filter((x) => x.s > 0);
  if (q.value.trim()) rows.sort((a, b) => b.s - a.s);
  return rows.map((x) => x.c);
});
const counts = computed(() => Object.fromEntries(TYPES.map((t) => [t[0], res.value.components.filter((c) => c.type === t[0]).length])));

// ------------------------------------------------------------ önizleme sahnesi
function buildScene(type, props, fmt = format.value) {
  const [W, H] = FORMATS[fmt];
  const layer = { ...JSON.parse(JSON.stringify(props)), id: 'onizleme', type, x: W / 2, y: H / 2 };
  const [w, h] = WIDGET2_TYPES.includes(type) ? widget2Size(layer) : [layer.width || (type === 'device' ? 460 : 800), layer.height || (type === 'device' ? (layer.width || 460) * 2 : (layer.width || 800) * 0.7)];
  const k = Math.min(1, (W * 0.88) / w, (H * 0.8) / h);
  if (k < 1) layer.scale = Math.round(k * 100) / 100;
  layer.fold = [{ t: 0.4, v: 0 }, { t: 2.2, v: 1, ease: 'outCubic' }];
  return {
    name: 'Önizleme', width: W, height: H, fps: 30, duration: 4.5, theme: 'gun-isigi',
    background: { type: 'linear', colors: ['#fdf0dc', '#f6c9a0'], angle: 180, paper: 0.4, vignette: 0.15 },
    camera: { zoom: 1 }, layers: [layer],
  };
}
const thumbs = computed(() => Object.fromEntries(res.value.components.map((c) => [c.id, buildScene(c.type, c.props || {}, 'kare')])));
let timer = 0;
function refresh() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (work.value) preview.value = buildScene(work.value.type, work.value.layer);
  }, 150);
}
function edit(fn) {
  fn();
  dirty.value = true;
  refresh();
}
const scene = computed(() => preview.value);

// ------------------------------------------------------------------ seçim
function guard() {
  return !dirty.value || confirm('Kaydedilmemiş değişiklikler var. Devam edilsin mi?');
}
function open(w, id) {
  w.layer.type = w.type; // WidgetEditor alan tanımlarını katman türünden seçer
  work.value = w;
  selId.value = id;
  dirty.value = false;
  preview.value = buildScene(w.type, w.layer);
  syncUrl(id);
}
function select(c) {
  if (c.id !== selId.value && !guard()) return;
  open({ name: c.name || c.id, description: c.description || '', type: c.type, layer: JSON.parse(JSON.stringify(c.props || {})), etiketler: JSON.parse(JSON.stringify(c.etiketler || autoTags(c))) }, c.id);
}
function create(type) {
  if (!guard()) return;
  showNew.value = false;
  const base = componentProps(newWidgetLayer({ width: 1080, height: 1080 }, type, 0));
  const w = { name: `Yeni ${typeInfo(type)[2].toLocaleLowerCase('tr')}`, description: '', type, layer: base, etiketler: {} };
  w.etiketler = autoTags({ id: 'yeni', name: w.name, type, props: base });
  open(w, null);
  dirty.value = true;
}
function setFormat(f) {
  format.value = f;
  if (work.value) preview.value = buildScene(work.value.type, work.value.layer, f);
}

// ------------------------------------------------------------------ etiket düzenleme
const hasTag = (f, v) => (work.value?.etiketler?.[f] || []).includes(v);
function toggleTag(f, v) {
  const e = (work.value.etiketler ||= {});
  const a = new Set(e[f] || []);
  if (a.has(v)) a.delete(v);
  else a.add(v);
  e[f] = [...a];
  dirty.value = true;
}
function autoFill(replace) {
  const auto = autoTags({ id: selId.value || slug(work.value.name), name: work.value.name, type: work.value.type, props: componentProps(work.value.layer) });
  const cur = work.value.etiketler || {};
  work.value.etiketler = replace ? auto : Object.fromEntries(Object.keys(auto).map((k) => [k, cur[k]?.length ? cur[k] : auto[k]]));
  dirty.value = true;
}
const newVal = ref({});
async function addValue(f) {
  const raw = (newVal.value[f] || '').trim();
  if (!raw) return;
  const key = slug(raw);
  try {
    if (!tax.value[f]?.degerler?.[key]) {
      const custom = JSON.parse(JSON.stringify(res.value.taxonomyCustom?.facetler || {}));
      custom[f] ||= { degerler: {} };
      custom[f].degerler ||= {};
      custom[f].degerler[key] = { ad: raw, es: raw };
      await api.saveComponentTags(custom);
      await reloadResources('components');
    }
    if (!hasTag(f, key)) toggleTag(f, key);
    newVal.value = { ...newVal.value, [f]: '' };
  } catch (e) {
    toastError(e);
  }
}
const keywords = computed({
  get: () => (work.value?.etiketler?.anahtar || []).join(', '),
  set: (v) => {
    (work.value.etiketler ||= {}).anahtar = v.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
    dirty.value = true;
  },
});
const tagTotal = computed(() => FACET_ORDER.reduce((n, f) => n + (work.value?.etiketler?.[f]?.length || 0), 0));

// ------------------------------------------------------------------ kaydet / sil
const payload = () => ({
  name: work.value.name.trim() || 'Adsız bileşen',
  description: work.value.description.trim(),
  type: work.value.type,
  props: componentProps(work.value.layer),
  etiketler: Object.fromEntries(Object.entries(work.value.etiketler || {}).filter(([, v]) => v?.length)),
});
async function save() {
  saving.value = true;
  try {
    const doc = payload();
    if (selId.value) {
      await api.colUpdate('components', selId.value, doc);
    } else {
      let id = slug(doc.name);
      const taken = new Set(res.value.components.map((c) => c.id));
      for (let i = 2; taken.has(id); i++) id = `${slug(doc.name)}-${i}`;
      await api.colCreate('components', { id, ...doc });
      selId.value = id;
      syncUrl(id);
    }
    await reloadResources('components');
    dirty.value = false;
    toast('Bileşen kaydedildi', 'ok');
  } catch (e) {
    toastError(e);
  } finally {
    saving.value = false;
  }
}
async function duplicate() {
  if (!work.value) return;
  const doc = payload();
  doc.name = `${doc.name} kopya`;
  let id = slug(doc.name);
  const taken = new Set(res.value.components.map((c) => c.id));
  for (let i = 2; taken.has(id); i++) id = `${slug(doc.name)}-${i}`;
  try {
    await api.colCreate('components', { id, ...doc });
    await reloadResources('components');
    const c = res.value.components.find((x) => x.id === id);
    dirty.value = false;
    if (c) select(c);
    toast('Çoğaltıldı', 'ok');
  } catch (e) {
    toastError(e);
  }
}
async function remove() {
  if (!selId.value) {
    work.value = null;
    preview.value = null;
    dirty.value = false;
    return;
  }
  if (!confirm(`"${work.value.name}" bileşeni silinsin mi? Projelerdeki katmanlar etkilenmez.`)) return;
  try {
    await api.colDelete('components', selId.value);
    await reloadResources('components');
    dirty.value = false;
    selId.value = null;
    work.value = null;
    preview.value = null;
    const first = res.value.components[0];
    if (first) select(first);
  } catch (e) {
    toastError(e);
  }
}
</script>

<template>
  <div class="cv">
    <aside class="list">
      <div class="lh">
        <div class="row">
          <h1 class="grow">Bileşenler</h1>
          <button class="btn sm primary" @click="showNew = !showNew">＋ Yeni</button>
        </div>
        <p class="dim small">Grafik, cihaz, görsel ve ses dalgası ön ayarların. Kaydettiklerin Stüdyo’daki ＋ Bileşen menüsünde çıkar.</p>
        <div v-if="showNew" class="newbox">
          <button v-for="t in TYPES" :key="t[0]" class="nt" @click="create(t[0])">
            <span class="ic">{{ t[1] }}</span>
            <span><strong>{{ t[2] }}</strong><br /><span class="dim small">{{ t[3] }}</span></span>
          </button>
        </div>
        <div class="chips">
          <button class="chip" :class="{ on: !typeFilter }" @click="typeFilter = ''">Tümü {{ res.components.length }}</button>
          <button v-for="t in TYPES" :key="t[0]" class="chip" :class="{ on: typeFilter === t[0] }" @click="typeFilter = typeFilter === t[0] ? '' : t[0]">{{ t[1] }} {{ counts[t[0]] }}</button>
        </div>
        <input v-model="q" class="input" placeholder="Ara: ad, etiket, anlam (ör. geri sayım, fiyat, dramatik)" />
        <button class="btn sm" :class="{ on: showFilters || activeFilters }" @click="showFilters = !showFilters">🏷 Etikete göre süz{{ activeFilters ? ` · ${activeFilters}` : '' }}</button>
        <div v-if="showFilters" class="filters">
          <div v-for="f in FILTER_FACETS" :key="f" class="fgroup">
            <span class="flabel" :title="tax[f]?.ipucu">{{ tax[f]?.ad || f }}</span>
            <span class="fchips">
              <button
                v-for="[v, def] in filterTags(f).items"
                :key="v"
                class="tg"
                :class="{ on: (filters[f] || []).includes(v) }"
                :title="def.es"
                @click="toggleFilter(f, v)"
              >{{ def.ad }} <b>{{ facetCounts[f]?.[v] || 0 }}</b></button>
              <button v-if="filterTags(f).hidden" class="tg more" @click="expanded['f:' + f] = true">+{{ filterTags(f).hidden }} daha</button>
              <button v-else-if="expanded['f:' + f]" class="tg more" @click="expanded['f:' + f] = false">daha az</button>
            </span>
          </div>
          <button v-if="activeFilters" class="btn sm ghost" @click="filters = {}">Süzgeçleri temizle</button>
        </div>
      </div>
      <button v-for="c in list" :key="c.id" class="item" :class="{ on: c.id === selId }" @click="select(c)">
        <div class="th"><SceneThumb :scene="thumbs[c.id]" :res="res" :t="2.6" :width="64" /></div>
        <div class="tx">
          <strong>{{ c.name || c.id }}</strong>
          <span class="dim small">{{ typeInfo(c.type)[2] }}</span>
        </div>
      </button>
      <p v-if="!list.length" class="dim small pad">Eşleşen bileşen yok.</p>
    </aside>

    <section class="preview">
      <template v-if="work">
        <div class="ph row">
          <div class="grow">
            <strong>{{ work.name }}</strong>
            <span class="chip">{{ typeInfo(work.type)[1] }} {{ typeInfo(work.type)[2] }}</span>
            <span v-if="dirty" class="chip warn">kaydedilmedi</span>
          </div>
          <div class="seg">
            <button v-for="(f, k) in FORMATS" :key="k" :class="{ on: format === k }" @click="setFormat(k)">{{ f[2] }}</button>
          </div>
        </div>
        <ScenePlayer v-if="scene" :scene="scene" :res="res" />
        <p v-if="work.type === 'waveform'" class="dim small">Ses dalgası önizlemede sahte vuruşla oynar; gerçek projede sahnedeki müziğe tepki verir.</p>
        <p v-if="work.type === 'media' && !work.layer.src" class="dim small">Önizleme için sağdan bir dosya seçebilirsin. Dosya seçimi ön ayara kaydedilir; boş bırakırsan eklerken sen seçersin.</p>
      </template>
      <div v-else class="empty dim">
        <p>Soldan bir bileşen seç ya da <strong>＋ Yeni</strong> ile oluştur.</p>
      </div>
    </section>

    <aside v-if="work" class="edit">
      <div class="eb">
        <div class="field">
          <label>Ad</label>
          <input v-model="work.name" class="input" @input="dirty = true" />
        </div>
        <div class="field">
          <label>Açıklama</label>
          <textarea v-model="work.description" class="input" rows="2" placeholder="Ne için kullanılır?" @input="dirty = true" />
        </div>
        <details class="tagbox">
          <summary><strong>Etiketler</strong> <span class="dim small">· {{ tagTotal }} seçili — yapay zekâ bu etiketlerle bileşeni bulur</span></summary>
          <div class="trow">
            <button class="btn sm" title="Boş kalan başlıkları türe ve ayarlara göre doldurur" @click="autoFill(false)">Boşları öner</button>
            <button class="btn sm" title="Tüm etiketleri otomatik önerilerle değiştirir" @click="autoFill(true)">Hepsini yeniden öner</button>
          </div>
          <div v-for="f in FACET_ORDER" :key="f" class="tfacet">
            <span class="flabel" :title="tax[f]?.ipucu">{{ tax[f]?.ad || f }} <span class="dim">· {{ (work.etiketler?.[f] || []).length }}</span></span>
            <span class="fchips">
              <button v-for="[v, def] in editTags(f).items" :key="v" class="tg" :class="{ on: hasTag(f, v) }" :title="def.es" @click="toggleTag(f, v)">{{ def.ad }}</button>
              <button v-if="editTags(f).hidden" class="tg more" @click="expanded['t:' + f] = true">+{{ editTags(f).hidden }} daha</button>
              <button v-else-if="expanded['t:' + f]" class="tg more" @click="expanded['t:' + f] = false">daha az</button>
              <input v-model="newVal[f]" class="tin" placeholder="+ yeni" @keydown.enter.prevent="addValue(f)" @keydown.stop />
            </span>
          </div>
          <div class="field">
            <label>Anahtar kelimeler</label>
            <input v-model="keywords" class="input" placeholder="serbest kelimeler, virgülle" @keydown.stop />
          </div>
        </details>
        <div class="sec-title">{{ typeInfo(work.type)[2] }} ayarları</div>
        <WidgetEditor :layer="work.layer" :scene="scene || { audio: [] }" :res="res" :edit="edit" :bare="true" @keydown.stop />
      </div>
      <footer class="row">
        <button class="btn danger" @click="remove">{{ selId ? 'Sil' : 'Vazgeç' }}</button>
        <button v-if="selId" class="btn" @click="duplicate">Çoğalt</button>
        <div class="grow" />
        <button class="btn primary" :disabled="saving || (!dirty && !!selId)" @click="save">{{ saving ? 'Kaydediliyor…' : 'Kaydet' }}</button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.cv { display: grid; grid-template-columns: 300px minmax(360px, 1fr) 400px; height: calc(100vh - 56px); min-height: 0; }
.list { border-right: 1px solid var(--line); overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.lh { display: grid; gap: 8px; }
.lh h1 { margin: 0; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 22px; }
.lh p { margin: 0; }
.newbox { display: grid; gap: 6px; }
.nt { display: flex; gap: 10px; align-items: center; text-align: left; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); color: inherit; cursor: pointer; }
.nt:hover { border-color: var(--accent); }
.ic { font-size: 22px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips .chip { cursor: pointer; background: transparent; color: inherit; }
.chips .chip.on { border-color: var(--accent); background: #2d2118; }
.item { display: grid; grid-template-columns: 64px 1fr; gap: 10px; text-align: left; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); color: inherit; cursor: pointer; align-items: center; }
.item:hover { border-color: var(--line-2); }
.item.on { border-color: var(--accent); background: #2d2118; }
.th { min-height: 64px; display: grid; place-items: center; background: var(--bg-2); border-radius: 6px; overflow: hidden; }
.tx { display: grid; gap: 2px; min-width: 0; }
.preview { padding: 14px 18px; overflow: auto; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ph { gap: 8px; flex-wrap: wrap; }
.seg { display: flex; gap: 4px; }
.seg button { padding: 4px 8px; border: 1px solid var(--line); background: transparent; color: var(--text-2); border-radius: 8px; cursor: pointer; font: inherit; font-size: 12px; }
.seg button.on { border-color: var(--accent); color: var(--text); background: #2d2118; }
.edit { border-left: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; min-height: 0; }
.eb { flex: 1; overflow: auto; padding: 12px; min-height: 0; display: grid; gap: 12px; align-content: start; }
.sec-title { font-weight: 600; }
.edit footer { padding: 10px 12px; border-top: 1px solid var(--line); gap: 8px; }
.empty { display: grid; place-items: center; height: 60%; text-align: center; }
.pad { padding: 12px; }
.filters { display: grid; gap: 8px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); max-height: 46vh; overflow: auto; }
.fgroup, .tfacet { display: grid; gap: 4px; }
.flabel { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-3); }
.fchips { display: flex; flex-wrap: wrap; gap: 4px; }
.tg { padding: 2px 8px; font: inherit; font-size: 12px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--text-2); cursor: pointer; }
.tg b { font-weight: 600; color: var(--text-3); margin-left: 2px; }
.tg:hover { border-color: var(--line-2); }
.tg.more { border-style: dashed; color: var(--accent); }
.tg.on { border-color: var(--accent); background: #2d2118; color: var(--text); }
.tin { width: 74px; padding: 2px 8px; font: inherit; font-size: 12px; border-radius: 999px; border: 1px dashed var(--line-2); background: transparent; color: inherit; outline: 0; }
.tagbox { border: 1px solid var(--line); border-radius: 10px; padding: 8px; background: var(--bg-2); display: grid; gap: 8px; }
.tagbox summary { cursor: pointer; }
.trow { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
textarea.input { resize: vertical; }
</style>
