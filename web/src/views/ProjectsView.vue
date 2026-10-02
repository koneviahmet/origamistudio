<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api.js';
import { resources, loadResources } from '../resources.js';
import { useLive } from '../live.js';
import { toast, toastError } from '../toast.js';
import { PRESETS, newScene } from '../sceneOps.js';
import SceneThumb from '../components/SceneThumb.vue';

const router = useRouter();
const projects = ref([]);
const scenes = shallowRef({});
const loading = ref(true);
const showNew = ref(false);
const form = ref({ name: '', preset: 'reels' });

// Küçük resim sahneleri yalnızca kart görünür olunca (ve proje değiştiyse) yüklenir
const seenIds = new Set();
const sceneStamp = new Map(); // id → updatedAt (yüklenen sürüm)
const inflight = new Set();
async function ensureScene(p) {
  seenIds.add(p.id);
  if (sceneStamp.get(p.id) === p.updatedAt || inflight.has(p.id)) return;
  inflight.add(p.id);
  try {
    const sc = (await api.project(p.id)).scene;
    sceneStamp.set(p.id, p.updatedAt);
    scenes.value = { ...scenes.value, [p.id]: sc };
  } catch { /* küçük resim atlanır */ } finally {
    inflight.delete(p.id);
  }
}

async function load() {
  try {
    const [list] = await Promise.all([api.projects(), loadResources()]);
    projects.value = list;
    // silinenleri bırak, değişen + daha önce görünmüş olanları yenile
    const alive = new Set(list.map((p) => p.id));
    for (const id of Object.keys(scenes.value)) if (!alive.has(id)) delete scenes.value[id];
    list.filter((p) => seenIds.has(p.id)).forEach(ensureScene);
  } catch (e) {
    toastError(e);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
useLive((e) => ['projects', 'scene', 'notes'].includes(e.kind) && load());

async function create() {
  const name = form.value.name.trim() || 'Yeni Proje';
  try {
    const p = await api.createProject(newScene(name, form.value.preset));
    showNew.value = false;
    router.push(`/studio/${p.id}`);
  } catch (e) {
    toastError(e);
  }
}

async function saveAsTemplate(p) {
  const ad = prompt('Şablon adı:', p.name);
  if (ad === null) return;
  try {
    await api.saveAsTemplate(p.id, ad.trim() || p.name);
    toast('Şablon olarak kaydedildi → Şablonlar sayfası', 'ok');
  } catch (e) {
    toastError(e);
  }
}

async function duplicate(p) {
  try {
    await api.duplicateProject(p.id);
    toast('Proje çoğaltıldı', 'ok');
    load();
  } catch (e) {
    toastError(e);
  }
}

async function remove(p) {
  if (!confirm(`"${p.name}" projesi ve notları kalıcı olarak silinsin mi?`)) return;
  try {
    await api.deleteProject(p.id);
    toast('Proje silindi');
    load();
  } catch (e) {
    toastError(e);
  }
}

const aspect = (p) => {
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(p.width, p.height);
  return `${p.width / d}:${p.height / d}`;
};
const fmtDate = (s) => new Date(s).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

// ---- liste yönetimi: arama, sıralama, filtre, görünüm, yıldız, seçim
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem('proj.' + k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem('proj.' + k, JSON.stringify(v)); } catch { /* yok say */ } };
const q = ref('');
const sort = ref(ls('sort', 'updated'));
const fmt = ref('all');
const view = ref(ls('view', 'grid'));
const onlyNotes = ref(false);
const onlyStar = ref(false);
const showArchived = ref(false);
const stars = ref(new Set(ls('stars', [])));
const picked = ref(new Set());
watch(sort, (v) => sv('sort', v));
watch(view, (v) => sv('view', v));

const kind = (p) => (p.width === p.height ? 'kare' : p.width > p.height ? 'yatay' : 'dikey');
const KINDS = { all: 'Tümü', dikey: 'Dikey', yatay: 'Yatay', kare: 'Kare' };
const SORTS = { updated: 'Son düzenlenen', name: 'Ad (A-Z)', duration: 'Süre', layers: 'Katman sayısı' };
const active = computed(() => projects.value.filter((p) => !p.archived));
const archivedCount = computed(() => projects.value.length - active.value.length);
const count = (k) => projects.value.filter((p) => !!p.archived === showArchived.value && (k === 'all' || kind(p) === k)).length;

const shown = computed(() => {
  const t = q.value.trim().toLocaleLowerCase('tr');
  let l = projects.value.filter((p) =>
    !!p.archived === showArchived.value &&
    (!t || p.name.toLocaleLowerCase('tr').includes(t) || p.id.includes(t)) &&
    (fmt.value === 'all' || kind(p) === fmt.value) &&
    (!onlyNotes.value || p.openNotes) && (!onlyStar.value || stars.value.has(p.id)));
  const by = {
    updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    name: (a, b) => a.name.localeCompare(b.name, 'tr'),
    duration: (a, b) => b.duration - a.duration,
    layers: (a, b) => b.layers - a.layers,
  }[sort.value];
  l = [...l].sort(by);
  return [...l.filter((p) => stars.value.has(p.id)), ...l.filter((p) => !stars.value.has(p.id))];
});
const totalSec = computed(() => active.value.reduce((n, p) => n + (p.duration || 0), 0));
const openNotesTotal = computed(() => active.value.reduce((n, p) => n + (p.openNotes || 0), 0));

function toggleStar(p) {
  const s = new Set(stars.value);
  if (s.has(p.id)) s.delete(p.id); else s.add(p.id);
  stars.value = s;
  sv('stars', [...s]);
}
function togglePick(p) {
  const s = new Set(picked.value);
  if (s.has(p.id)) s.delete(p.id); else s.add(p.id);
  picked.value = s;
}
const allPicked = computed(() => shown.value.length > 0 && shown.value.every((p) => picked.value.has(p.id)));
function togglePickAll() {
  picked.value = allPicked.value ? new Set() : new Set(shown.value.map((p) => p.id));
}
async function archive(p, on = true) {
  try {
    await api.archiveProject(p.id, on);
    toast(on ? 'Proje arşivlendi' : 'Arşivden çıkarıldı', 'ok');
    load();
  } catch (e) {
    toastError(e);
  }
}
async function archivePicked(on = true) {
  const ids = [...picked.value];
  try {
    await Promise.all(ids.map((id) => api.archiveProject(id, on)));
    picked.value = new Set();
    toast(`${ids.length} proje ${on ? 'arşivlendi' : 'arşivden çıkarıldı'}`, 'ok');
    load();
  } catch (e) {
    toastError(e);
  }
}
async function removePicked() {
  const ids = [...picked.value];
  if (!ids.length || !confirm(`${ids.length} proje ve notları kalıcı olarak silinsin mi?`)) return;
  try {
    await Promise.all(ids.map((id) => api.deleteProject(id)));
    picked.value = new Set();
    toast(`${ids.length} proje silindi`);
    load();
  } catch (e) {
    toastError(e);
  }
}
function clearFilters() {
  q.value = '';
  showArchived.value = false;
  fmt.value = 'all';
  onlyNotes.value = false;
  onlyStar.value = false;
}

// ---- üzerine gelince küçük resim oynar
const hoverId = ref(null);
const hoverT = ref(0);
let raf = 0;
function hoverStart(p) {
  hoverId.value = p.id;
  const t0 = performance.now();
  cancelAnimationFrame(raf);
  const tick = (now) => {
    hoverT.value = ((now - t0) / 1000) % Math.max(p.duration, 0.5);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function hoverEnd() {
  cancelAnimationFrame(raf);
  hoverId.value = null;
}
onBeforeUnmount(() => cancelAnimationFrame(raf));
const thumbT = (p) => (hoverId.value === p.id ? hoverT.value : Math.min(p.duration, p.duration * 0.62));
const fmtDur = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s * 10) / 10} sn`);
const ago = (s) => {
  const m = (Date.now() - new Date(s)) / 60000;
  if (m < 1) return 'şimdi';
  if (m < 60) return `${Math.floor(m)} dk önce`;
  if (m < 1440) return `${Math.floor(m / 60)} sa önce`;
  if (m < 43200) return `${Math.floor(m / 1440)} gün önce`;
  return fmtDate(s);
};
</script>

<template>
  <div class="wrap">
    <div class="head row">
      <div class="grow">
        <h1>Projeler</h1>
        <p class="muted">Her proje bir video sahnesidir. Stüdyoda açıp oynatın, not bırakın, MP4 alın.</p>
      </div>
      <button class="btn" title="Hazır video iskeletleri: önizle, düzenle, projeye dönüştür" @click="router.push('/sablonlar')">✦ Şablonlar</button>
      <button class="btn primary" @click="showNew = true">＋ Yeni proje</button>
    </div>

    <div v-if="projects.length" class="stats">
      <div class="stat"><b>{{ active.length }}</b><span>proje</span></div>
      <div class="stat"><b>{{ fmtDur(totalSec) }}</b><span>toplam video</span></div>
      <div class="stat" :class="{ hot: openNotesTotal }"><b>{{ openNotesTotal }}</b><span>açık not</span></div>
      <div class="stat"><b>{{ stars.size }}</b><span>yıldızlı</span></div>
    </div>

    <div v-if="projects.length" class="toolbar">
      <div class="search">
        <span>⌕</span>
        <input v-model="q" placeholder="Proje ara…  (ad ya da kimlik)" />
        <button v-if="q" class="x" @click="q = ''">✕</button>
      </div>
      <div class="seg">
        <button v-for="(l, k) in KINDS" :key="k" :class="{ on: fmt === k }" @click="fmt = k">{{ l }} <i>{{ count(k) }}</i></button>
      </div>
      <button class="pill" :class="{ on: showArchived }" title="Arşivlenmiş projeleri göster" @click="showArchived = !showArchived; picked = new Set()">🗄 Arşiv <i>{{ archivedCount }}</i></button>
      <button class="pill" :class="{ on: onlyStar }" @click="onlyStar = !onlyStar">★ Yıldızlı</button>
      <button class="pill" :class="{ on: onlyNotes }" @click="onlyNotes = !onlyNotes">✎ Açık notlu</button>
      <button v-if="shown.length" class="pill" :class="{ on: allPicked }" title="Görünen tüm projeleri seç / bırak" @click="togglePickAll">☑ Tümünü seç</button>
      <div class="grow" />
      <select v-model="sort" class="sel">
        <option v-for="(l, k) in SORTS" :key="k" :value="k">{{ l }}</option>
      </select>
      <div class="seg">
        <button :class="{ on: view === 'grid' }" title="Kart görünümü" @click="view = 'grid'">▦</button>
        <button :class="{ on: view === 'list' }" title="Liste görünümü" @click="view = 'list'">☰</button>
      </div>
    </div>

    <div v-if="picked.size" class="bulk">
      <b>{{ picked.size }} seçili</b>
      <button class="btn sm" @click="togglePickAll">{{ allPicked ? 'Tümünü bırak' : `Görünenlerin tümünü seç (${shown.length})` }}</button>
      <button class="btn sm" @click="archivePicked(!showArchived)">{{ showArchived ? 'Arşivden çıkar' : 'Arşivle' }}</button>
      <button class="btn sm danger" @click="removePicked">Seçilenleri sil</button>
      <button class="btn sm" @click="picked = new Set()">Seçimi kaldır</button>
    </div>

    <div v-if="loading" class="dim">Yükleniyor…</div>
    <div v-else-if="!projects.length" class="empty">
      <p>Henüz proje yok.</p>
      <button class="btn primary" @click="showNew = true">İlk projeyi oluştur</button>
    </div>
    <div v-else-if="!shown.length" class="empty">
      <p>{{ showArchived ? 'Arşivde proje yok.' : 'Filtreyle eşleşen proje yok.' }}</p>
      <button class="btn" @click="clearFilters">Filtreleri temizle</button>
    </div>

    <div :class="view === 'grid' ? 'grid' : 'list'">
      <div
        v-for="p in shown" :key="p.id" class="card" :class="{ picked: picked.has(p.id) }"
        @click="router.push(`/studio/${p.id}`)" @mouseenter="hoverStart(p)" @mouseleave="hoverEnd"
      >
        <div class="thumb">
          <SceneThumb :scene="scenes[p.id] || null" @seen="ensureScene(p)" :res="resources" :t="thumbT(p)" :width="view === 'grid' ? 240 : 90" />
          <span class="dur">{{ fmtDur(p.duration) }}</span>
          <input type="checkbox" class="pick" :checked="picked.has(p.id)" title="Seç" @click.stop @change="togglePick(p)" />
          <button class="star" :class="{ on: stars.has(p.id) }" title="Yıldızla" @click.stop="toggleStar(p)">{{ stars.has(p.id) ? '★' : '☆' }}</button>
        </div>
        <div class="info">
          <div class="row">
            <strong class="grow name" :title="p.name">{{ p.name }}</strong>
            <span v-if="p.openNotes" class="chip warn" title="Açık notlar">✎ {{ p.openNotes }}</span>
          </div>
          <div class="meta">
            <span class="tag">{{ kind(p) }} {{ aspect(p) }}</span>
            <span>{{ p.width }}×{{ p.height }}</span>
            <span>{{ p.layers }} katman</span>
            <span :title="fmtDate(p.updatedAt)">{{ ago(p.updatedAt) }}</span>
          </div>
          <div class="row actions" @click.stop>
            <button class="btn sm primary" @click="router.push(`/studio/${p.id}`)">Aç</button>
            <button class="btn sm" @click="duplicate(p)">Çoğalt</button>
            <button class="btn sm" title="Bu projeyi Şablonlar sayfasına şablon olarak kaydet" @click="saveAsTemplate(p)">☆ Şablon</button>
            <div class="grow" />
            <button class="btn sm" :title="p.archived ? 'Arşivden çıkar' : 'Arşivle (listeden gizler, silmez)'" @click="archive(p, !p.archived)">{{ p.archived ? '↩ Çıkar' : '🗄 Arşivle' }}</button>
            <button class="btn sm danger" @click="remove(p)">Sil</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showNew" class="modal-backdrop" @click.self="showNew = false">
      <form class="modal" @submit.prevent="create">
        <header>Yeni proje</header>
        <div class="body">
          <div class="field">
            <label>Proje adı</label>
            <input v-model="form.name" class="input" placeholder="ör. Okyanus Hikayesi" autofocus />
          </div>
          <div class="field">
            <label>Format</label>
            <div class="presets">
              <label v-for="pr in PRESETS" :key="pr.id" class="preset" :class="{ on: form.preset === pr.id }">
                <input v-model="form.preset" type="radio" :value="pr.id" />
                <span class="shape" :style="{ aspectRatio: `${pr.width}/${pr.height}` }" />
                <span>{{ pr.label }}</span>
                <span class="dim small">{{ pr.width }}×{{ pr.height }}</span>
              </label>
            </div>
          </div>
        </div>
        <footer>
          <button type="button" class="btn" @click="showNew = false">Vazgeç</button>
          <button type="submit" class="btn primary">Oluştur ve aç</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.wrap { padding: 24px 28px; max-width: 1500px; margin: 0 auto; }
.head { margin-bottom: 18px; }
h1 { margin: 0 0 4px; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 28px; }
.head p { margin: 0; }
.empty { display: grid; gap: 12px; justify-items: start; padding: 24px 0; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat { background: linear-gradient(135deg, var(--panel), var(--panel-2)); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; display: grid; }
.stat b { font-size: 24px; font-family: Fredoka, sans-serif; color: var(--accent-2); }
.stat span { font-size: 12px; color: var(--text-3); }
.stat.hot b { color: var(--warn); }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px; position: sticky; top: 0; z-index: 5; background: var(--bg); padding: 8px 0; }
.search { display: flex; align-items: center; gap: 6px; background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 0 12px; min-width: 240px; }
.search:focus-within { border-color: var(--accent); }
.search input { background: none; border: 0; outline: 0; color: var(--text); padding: 8px 0; flex: 1; font: inherit; }
.search .x { background: none; border: 0; color: var(--text-3); cursor: pointer; }
.seg { display: flex; background: var(--panel); border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
.seg button { background: none; border: 0; color: var(--text-2); padding: 7px 12px; cursor: pointer; font: inherit; font-size: 13px; }
.seg button i { font-style: normal; color: var(--text-3); font-size: 11px; margin-left: 2px; }
.seg button.on { background: var(--accent); color: var(--accent-ink); }
.seg button.on i { color: var(--accent-ink); }
.pill { background: var(--panel); border: 1px solid var(--line); color: var(--text-2); border-radius: 999px; padding: 7px 12px; cursor: pointer; font: inherit; font-size: 13px; }
.pill.on { border-color: var(--accent); color: var(--accent-2); background: #2d2118; }
.sel { background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 999px; padding: 7px 12px; font: inherit; font-size: 13px; }
.bulk { display: flex; gap: 10px; align-items: center; background: #2d2118; border: 1px solid var(--accent); border-radius: 10px; padding: 8px 12px; margin-bottom: 14px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
.card {
  position: relative; display: flex; flex-direction: column; overflow: hidden;
  background: var(--panel); border: 1px solid var(--line); border-radius: 14px; cursor: pointer;
  transition: transform .15s, border-color .15s, box-shadow .15s;
}
.card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 10px 28px #0007; }
.card.picked { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent) inset; }
.thumb { position: relative; height: 210px; display: grid; place-items: center; background: radial-gradient(circle at 50% 40%, var(--panel-2), var(--bg-2)); overflow: hidden; }
.thumb :deep(canvas), .thumb :deep(svg) { max-height: 100%; max-width: 100%; }
.dur { position: absolute; right: 8px; bottom: 8px; background: #000a; color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 6px; }
.pick { position: absolute; left: 8px; top: 8px; width: 17px; height: 17px; opacity: 0; accent-color: var(--accent); cursor: pointer; }
.card:hover .pick, .card.picked .pick { opacity: 1; }
.star { position: absolute; right: 6px; top: 4px; background: none; border: 0; font-size: 22px; color: #fff9; cursor: pointer; opacity: 0; text-shadow: 0 1px 4px #000; }
.card:hover .star, .star.on { opacity: 1; }
.star.on { color: var(--warn); }
.info { display: grid; gap: 8px; align-content: start; min-width: 0; padding: 12px 14px 14px; }
.info .row { flex-wrap: wrap; gap: 4px 6px; }
.name { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 12px; color: var(--text-3); align-items: center; }
.tag { background: var(--bg-2); border: 1px solid var(--line); border-radius: 6px; padding: 1px 7px; color: var(--text-2); text-transform: capitalize; }
.actions { margin-top: 2px; opacity: .85; }
.card:hover .actions { opacity: 1; }
.list { display: grid; gap: 8px; }
.list .card { flex-direction: row; align-items: center; border-radius: 12px; }
.list .card:hover { transform: none; }
.list .thumb { height: 76px; width: 110px; flex: none; }
.list .dur { display: none; }
.list .info { flex: 1; grid-template-columns: minmax(180px, 1.4fr) 2fr auto; align-items: center; padding: 8px 14px; }
.list .star { top: 2px; right: 2px; font-size: 17px; }
.presets { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.preset {
  display: grid; justify-items: center; gap: 6px; padding: 12px 8px; text-align: center;
  border: 1px solid var(--line); border-radius: 10px; cursor: pointer; font-size: 12px;
}
.preset.on { border-color: var(--accent); background: #2d2118; }
.preset input { display: none; }
.shape { height: 44px; border: 2px solid var(--text-2); border-radius: 4px; }
.preset.on .shape { border-color: var(--accent); }
@media (max-width: 700px) { .list .info { grid-template-columns: 1fr; } }
@media (max-width: 820px) {
  .wrap { padding: 14px 12px 28px; }
  h1 { font-size: 22px; }
  .head { flex-wrap: wrap; gap: 8px; }
  .head > div { flex: 1 1 100%; }
  .head .btn { flex: 1; }
  .stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .toolbar { gap: 6px; }
  .search { flex: 1 1 100%; min-width: 0; }
  .seg { max-width: 100%; overflow-x: auto; scrollbar-width: none; }
  .seg button { white-space: nowrap; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .thumb { height: 170px; }
  .info { padding: 10px; }
  .card:hover { transform: none; }
  .pick, .star { opacity: 1; }
  .actions { flex-wrap: wrap; }
  .list .thumb { width: 84px; height: 64px; }
  .bulk { flex-wrap: wrap; }
}
</style>
