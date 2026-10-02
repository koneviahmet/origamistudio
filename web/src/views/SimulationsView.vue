<script setup>
// Simülasyonlar sayfası: orman-oyunu deposundan aktarılan simülasyonlar (data/simulations).
// Listele / ara / süz, üst veriyi düzenle (başlık, kategori, etiket, durum, not, kullanım amacı), kaynak dosyaları incele, çöpe taşı.
import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { api } from '../api.js';
import { toast, toastError } from '../toast.js';

const props = defineProps({ slug: { type: String, default: '' } });
const router = useRouter();
const srcShow = ref(false);

const STATUS = { ham: 'Ham', hazir: 'Hazır', arsiv: 'Arşiv' };
const list = ref([]);
const loading = ref(true);
const q = ref('');
const cat = ref('');
const status = ref('');
const onlyFav = ref(false);
const sel = ref(null); // tam kayıt (kaynaklarla)
const form = ref(null);
const dirty = ref(false);
const saving = ref(false);
const srcOpen = ref('');
const tagInput = ref('');
const runKey = ref(0); // önizlemeyi yeniden başlat
const full = ref(false);

async function load() {
  loading.value = true;
  try { list.value = await api.simulations(); } catch (e) { toastError(e); }
  loading.value = false;
}
onMounted(load);

const cats = computed(() => {
  const m = {};
  for (const s of list.value) m[s.category] = (m[s.category] || 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
});
const norm = (t) => String(t || '').toLocaleLowerCase('tr');
const shown = computed(() => {
  const w = norm(q.value).split(/\s+/).filter(Boolean);
  return list.value.filter((s) => {
    if (cat.value && s.category !== cat.value) return false;
    if (status.value && s.status !== status.value) return false;
    if (onlyFav.value && !s.favorite) return false;
    if (!w.length) return true;
    const hay = norm([s.title, s.slug, s.description, s.category, s.notes, s.usage, ...(s.tags || [])].join(' '));
    return w.every((x) => hay.includes(x));
  });
});

// Her simülasyonun kendi adresi var: /simulasyonlar/<slug>. Tıklayınca adres değişir, önizleme hemen başlar;
// ağır kaynak metinleri yalnızca "Kaynak dosyalar" açılınca çekilir.
function select(s) {
  if (s.slug === props.slug) return;
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler var, atılsın mı?')) return;
  router.push(`/simulasyonlar/${s.slug}`);
}
async function open(slug) {
  if (!slug) { sel.value = form.value = null; dirty.value = false; return; }
  const meta = list.value.find((x) => x.slug === slug);
  if (meta) { sel.value = { ...meta }; form.value = { ...meta, tags: [...(meta.tags || [])] }; } // liste verisiyle anında göster
  dirty.value = false;
  srcShow.value = false;
  srcOpen.value = '';
  try {
    const full = await api.simulation(slug);
    if (props.slug !== slug) return;
    sel.value = full;
    if (!meta || !dirty.value) form.value = { ...full, tags: [...(full.tags || [])] };
  } catch (e) { toastError(e); }
}
async function showSources() {
  srcShow.value = true;
  if (sel.value?.sources) return;
  const slug = sel.value.slug;
  try {
    const full = await api.simulation(slug, true);
    if (props.slug !== slug) return;
    sel.value = full;
    srcOpen.value = full.sources?.[0]?.path || '';
  } catch (e) { toastError(e); }
}
watch(() => props.slug, (s) => open(s));
watch(list, () => { if (props.slug && !sel.value) open(props.slug); });
onBeforeRouteLeave(() => !dirty.value || confirm('Kaydedilmemiş değişiklikler var, atılsın mı?'));
const touch = () => { dirty.value = true; };
function addTag() {
  const t = tagInput.value.trim().toLowerCase();
  tagInput.value = '';
  if (t && !form.value.tags.includes(t)) { form.value.tags.push(t); touch(); }
}
function dropTag(t) { form.value.tags = form.value.tags.filter((x) => x !== t); touch(); }

async function patch(slug, p) {
  const saved = await api.updateSimulation(slug, p);
  const i = list.value.findIndex((x) => x.slug === slug);
  if (i >= 0) list.value[i] = { ...list.value[i], ...saved, fileCount: list.value[i].fileCount };
  return saved;
}
async function save() {
  saving.value = true;
  try {
    const { title, subtitle, category, description, tags, status: st, notes, usage, favorite } = form.value;
    await patch(sel.value.slug, { title, subtitle, category, description, tags, status: st, notes, usage, favorite });
    dirty.value = false;
    toast('Kaydedildi', 'ok');
  } catch (e) { toastError(e); }
  saving.value = false;
}
async function toggleFav(s, ev) {
  ev?.stopPropagation();
  try {
    await patch(s.slug, { favorite: !s.favorite });
    if (form.value?.slug === s.slug) form.value.favorite = !s.favorite;
  } catch (e) { toastError(e); }
}
async function remove() {
  const s = sel.value;
  if (!confirm(`"${s.title}" çöpe taşınsın mı? (data/simulations-cop altına taşınır, kalıcı silinmez)`)) return;
  try {
    await api.deleteSimulation(s.slug);
    list.value = list.value.filter((x) => x.slug !== s.slug);
    sel.value = form.value = null;
    dirty.value = false;
    router.push('/simulasyonlar');
    toast('Çöpe taşındı', 'ok');
  } catch (e) { toastError(e); }
}
const curSrc = computed(() => sel.value?.sources?.find((x) => x.path === srcOpen.value));
const short = (p) => p.replace('src/views/simulation/', '');
function copySrc() {
  navigator.clipboard?.writeText(curSrc.value?.text || '').then(() => toast('Kopyalandı', 'ok'), toastError);
}
</script>

<template>
  <div class="sv">
    <section class="list">
      <div class="lh">
        <h1>Simülasyonlar</h1>
        <p class="muted small">orman-oyunu deposundan aktarıldı · {{ list.length }} simülasyon</p>
        <input v-model="q" class="input" placeholder="Ara: başlık, etiket, not…" />
        <div class="chips">
          <button class="chip" :class="{ on: !cat }" @click="cat = ''">Tümü</button>
          <button v-for="[c, n] in cats" :key="c" class="chip" :class="{ on: cat === c }" @click="cat = cat === c ? '' : c">{{ c }} {{ n }}</button>
        </div>
        <div class="chips">
          <button v-for="(l, k) in STATUS" :key="k" class="chip" :class="{ on: status === k }" @click="status = status === k ? '' : k">{{ l }}</button>
          <button class="chip" :class="{ on: onlyFav }" @click="onlyFav = !onlyFav">★ Favoriler</button>
        </div>
        <div class="muted small">{{ shown.length }} sonuç</div>
      </div>
      <div v-if="loading" class="muted pad">Yükleniyor…</div>
      <button v-for="s in shown" :key="s.slug" class="item" :class="{ on: sel?.slug === s.slug }" @click="select(s)">
        <span class="dot" :style="{ background: s.accent || '#888' }"></span>
        <span class="tx">
          <b>{{ s.title }}</b>
          <span class="muted small">{{ s.category }} · {{ s.kind === 'modern' ? 'Three.js' : 'eski' }} · {{ STATUS[s.status] }}</span>
        </span>
        <span class="star" :class="{ on: s.favorite }" @click="toggleFav(s, $event)">★</span>
      </button>
      <div v-if="!loading && !list.length" class="muted pad">
        Henüz simülasyon yok. Aktarmak için:<br /><code>node scripts/simulasyon-aktar.mjs --kaynak &lt;orman-oyunu klasörü&gt;</code>
      </div>
    </section>

    <section class="detail">
      <div v-if="!form" class="empty muted">Soldan bir simülasyon seç.</div>
      <template v-else>
        <div class="dh row">
          <h2>{{ form.title }}</h2>
          <span class="chip">{{ form.slug }}</span>
          <span class="chip">{{ form.engine }}</span>
          <span class="chip">{{ sel.fileCount ?? sel.files?.length ?? 0 }} dosya</span>
          <span style="flex: 1"></span>
          <button class="btn danger sm" @click="remove">Çöpe taşı</button>
          <button class="btn primary" :disabled="!dirty || saving" @click="save">{{ saving ? '…' : dirty ? 'Kaydet' : 'Kayıtlı' }}</button>
        </div>
        <div class="prev" :class="{ full }">
          <div class="row prevbar">
            <span class="flabel">Canlı önizleme</span>
            <span style="flex: 1"></span>
            <button class="btn sm" @click="runKey++">↻ Yeniden başlat</button>
            <button class="btn sm" @click="full = !full">{{ full ? '✕ Küçült' : '⛶ Büyüt' }}</button>
            <a class="btn sm" :href="`/sim-onizleme.html?slug=${form.slug}`" target="_blank">↗ Yeni sekme</a>
          </div>
          <iframe :key="form.slug + runKey" class="frame" :src="`/sim-onizleme.html?slug=${form.slug}`" allow="fullscreen"></iframe>
        </div>
        <div class="grid">
          <label>Başlık<input v-model="form.title" class="input" @input="touch" /></label>
          <label>Kategori<input v-model="form.category" class="input" list="cats" @input="touch" /></label>
          <datalist id="cats"><option v-for="[c] in cats" :key="c" :value="c" /></datalist>
          <label>Durum
            <select v-model="form.status" class="input" @change="touch">
              <option v-for="(l, k) in STATUS" :key="k" :value="k">{{ l }}</option>
            </select>
          </label>
          <label class="wide">Açıklama<textarea v-model="form.description" class="input" rows="3" @input="touch"></textarea></label>
          <label class="wide">Kullanım amacı (video / ders…)<textarea v-model="form.usage" class="input" rows="2" placeholder="Bu simülasyon nerede, nasıl kullanılacak?" @input="touch"></textarea></label>
          <label class="wide">Notlar<textarea v-model="form.notes" class="input" rows="2" @input="touch"></textarea></label>
          <div class="wide">
            <div class="flabel">Etiketler</div>
            <div class="chips">
              <span v-for="t in form.tags" :key="t" class="chip tagc">{{ t }} <a @click="dropTag(t)">×</a></span>
              <input v-model="tagInput" class="tin" placeholder="+ etiket" @keydown.enter.prevent="addTag" @blur="addTag" />
            </div>
          </div>
        </div>

        <div class="src">
          <div class="flabel">Kaynak dosyalar</div>
          <button v-if="!srcShow" class="btn sm" style="justify-self: start" @click="showSources">Kaynağı göster ({{ sel.fileCount ?? sel.files?.length ?? 0 }} dosya)</button>
          <div v-else-if="!sel.sources" class="muted small">Yükleniyor…</div>
          <div v-else class="chips">
            <button v-for="f in sel.sources" :key="f.path" class="chip" :class="{ on: srcOpen === f.path }" @click="srcOpen = f.path">{{ short(f.path) }}</button>
          </div>
          <div v-if="curSrc" class="code-wrap">
            <div class="row muted small"><span>{{ curSrc.path }} · {{ (curSrc.size / 1024).toFixed(1) }} KB</span><span style="flex: 1"></span><button class="btn sm" @click="copySrc">Kopyala</button></div>
            <pre class="code">{{ curSrc.text }}</pre>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.sv { display: grid; grid-template-columns: 340px 1fr; height: calc(100vh - 56px); min-height: 0; }
.list { border-right: 1px solid var(--line); overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.lh { display: grid; gap: 8px; }
.lh h1 { margin: 0; font-size: 22px; font-weight: 600; }
.lh p { margin: 0; }
.small { font-size: 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips .chip { cursor: pointer; background: transparent; color: inherit; font: inherit; font-size: 12px; }
.chips .chip.on { border-color: var(--accent); background: #2d2118; }
.item { display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; text-align: left; padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); color: inherit; cursor: pointer; align-items: center; }
.item:hover { border-color: var(--line-2); }
.item.on { border-color: var(--accent); background: #2d2118; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.tx { display: grid; gap: 2px; min-width: 0; }
.tx b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.star { color: var(--text-3); font-size: 16px; padding: 2px 4px; }
.star.on { color: #fbbf24; }
.detail { overflow: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.dh { gap: 8px; flex-wrap: wrap; }
.dh h2 { margin: 0; font-size: 20px; }
.grid { display: grid; grid-template-columns: 1fr 1fr 160px; gap: 10px; }
.grid label, .grid .wide { display: grid; gap: 4px; font-size: 12px; color: var(--text-2); }
.wide { grid-column: 1 / -1; }
.flabel { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-3); }
.tin { width: 90px; padding: 2px 8px; font: inherit; font-size: 12px; border-radius: 999px; border: 1px dashed var(--line-2); background: transparent; color: inherit; outline: 0; }
.tagc a { cursor: pointer; margin-left: 4px; color: var(--text-3); }
.prev { display: grid; gap: 6px; }
.prevbar { gap: 6px; }
.frame { width: 100%; height: calc(100vh - 56px - 130px); min-height: 360px; border: 1px solid var(--line); border-radius: 10px; background: #050814; }
.prev.full { position: fixed; inset: 56px 0 0 0; z-index: 50; background: var(--bg); padding: 10px 14px; grid-template-rows: auto 1fr; }
.prev.full .frame { height: 100%; }
.src { display: grid; gap: 8px; }
.code { margin: 0; max-height: 46vh; overflow: auto; padding: 10px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; font-size: 12px; line-height: 1.45; white-space: pre; }
.code-wrap { display: grid; gap: 6px; }
.empty { display: grid; place-items: center; height: 60%; }
.pad { padding: 12px; }
textarea.input { resize: vertical; }
</style>
