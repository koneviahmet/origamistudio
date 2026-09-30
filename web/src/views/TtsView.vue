<script setup>
// Ses sayfası: ses kataloğunu gez/ara/etiketle, referans kaydı dinle, metni seçilen sesle üret ve dinle.
// Katalog yerelde aranır (data/voices-katalog.json); etiketler data/voice-tags.json'da durur.
// Kayıtlı sesler (★) data/voices/ altında. Claude'a "şu sesi kullan" derken id, kayıtlı ad ya da etiket yeterlidir:
//   npm run seslendir -- --proje <id> --satirlar dosya.txt --ses-id <id|ad>   |   --etiket "Sakin" --cinsiyet kadin
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { api } from '../api.js';
import { toast } from '../toast.js';

const PAGE = 24;
const tab = ref('saved');
const status = ref({ running: false, starting: false, installed: true });
const saved = ref([]);
const cat = ref({ total: 0, rows: [] });
const offset = ref(0);
const q = ref('');
const gender = ref('');
const loading = ref(false);
const catErr = ref('');

const tags = ref([]);
const tagFilter = ref([]);
const showTags = ref(false);
const newTag = ref({ name: '', color: '#ea7a3b' });
const pickerFor = ref('');

const selected = ref(null); // null = varsayılan ses
const text = ref('Merhaba, bu ses Origami Studio içinde yerel olarak üretildi. Bugün hava çok güzel.');
const generating = ref(false);
const elapsed = ref(0);
const result = ref(null);
const genErr = ref('');
const keepName = ref('');
const playing = ref('');

const savedIds = computed(() => new Set(saved.value.map((v) => v.id)));
const tagMap = computed(() => new Map(tags.value.map((t) => [t.id, t])));
const savedShown = computed(() => saved.value.filter((v) => tagFilter.value.every((t) => v.tags?.includes(t))));
const list = computed(() => (tab.value === 'saved' ? savedShown.value : cat.value.rows));
const pages = computed(() => Math.max(1, Math.ceil(cat.value.total / PAGE)));
const page = computed(() => Math.floor(offset.value / PAGE) + 1);
const GENDER = { male: 'Erkek', female: 'Kadın' };

let audioEl = null;
let poll = null;
let timer = null;
let qTimer = null;
let buildTimer = null;

const refUrl = (v) => `/api/tts/voices/${v.id}/audio`; // ilk dinlemede sunucu indirip önbelleğe alır
function playRef(v) {
  if (audioEl) audioEl.pause();
  if (playing.value === v.id) return (playing.value = '');
  audioEl = new Audio(refUrl(v));
  audioEl.onended = () => (playing.value = '');
  audioEl.onerror = () => ((playing.value = ''), toast('Kayıt çalınamadı', 'error'));
  audioEl.play().then(() => (playing.value = v.id)).catch(() => (playing.value = ''));
}

async function loadSaved() {
  saved.value = await api.ttsSaved();
}
async function loadTags() {
  tags.value = await api.ttsTags();
  tagFilter.value = tagFilter.value.filter((id) => tagMap.value.has(id));
}
async function loadCat() {
  loading.value = true;
  catErr.value = '';
  try {
    cat.value = await api.ttsVoices({ offset: offset.value, length: PAGE, q: q.value, gender: gender.value, tag: tagFilter.value.join(',') });
    clearTimeout(buildTimer);
    if (cat.value.building) buildTimer = setTimeout(loadCat, 1500); // ilk kurulum: katalog indiriliyor
  } catch (e) {
    catErr.value = e.message;
  } finally {
    loading.value = false;
  }
}
function go(delta) {
  offset.value = Math.max(0, Math.min((pages.value - 1) * PAGE, offset.value + delta * PAGE));
  loadCat();
}
watch([q, gender, tagFilter], () => {
  offset.value = 0;
  clearTimeout(qTimer);
  qTimer = setTimeout(loadCat, 120);
});
watch(tab, (t) => {
  if (t === 'catalog' && !cat.value.rows.length) loadCat();
});

async function toggleSave(v) {
  try {
    if (savedIds.value.has(v.id)) {
      await api.ttsRemove(v.id);
      if (selected.value?.id === v.id) selected.value = null;
    } else {
      await api.ttsSave(v.id);
      toast(`${v.id} kaydedildi`, 'ok');
    }
    await loadSaved();
  } catch (e) {
    toast(e.message, 'error');
  }
}
async function rename(v, name) {
  if ((v.name || '') === name.trim()) return;
  try {
    await api.ttsSave(v.id, name);
    await loadSaved();
  } catch (e) {
    toast(e.message, 'error');
  }
}
function pick(v) {
  selected.value = v;
}

// ------------------------------------------------------------------ etiketler
function toggleFilter(id) {
  const i = tagFilter.value.indexOf(id);
  tagFilter.value = i < 0 ? [...tagFilter.value, id] : tagFilter.value.filter((t) => t !== id);
}
async function toggleVoiceTag(v, id) {
  const cur = v.tags || [];
  const next = cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id];
  try {
    v.tags = await api.ttsVoiceTags(v.id, next);
    // aynı sesin öbür listedeki kopyası da güncellensin
    for (const x of [...saved.value, ...cat.value.rows]) if (x.id === v.id) x.tags = v.tags;
    loadTags();
  } catch (e) {
    toast(e.message, 'error');
  }
}
async function addTag() {
  try {
    await api.ttsTagCreate({ name: newTag.value.name, color: newTag.value.color });
    newTag.value.name = '';
    await loadTags();
  } catch (e) {
    toast(e.message, 'error');
  }
}
async function patchTag(t, patch) {
  try {
    await api.ttsTagUpdate(t.id, patch);
  } catch (e) {
    toast(e.message, 'error');
  }
  await loadTags();
}
async function removeTag(t) {
  if (!window.confirm(`"${t.name}" etiketi silinsin mi? ${t.count} sesten kaldırılır.`)) return;
  try {
    await api.ttsTagDelete(t.id);
    await Promise.all([loadTags(), loadSaved(), tab.value === 'catalog' ? loadCat() : null]);
  } catch (e) {
    toast(e.message, 'error');
  }
}
async function autoTags() {
  try {
    const r = await api.ttsTagAuto();
    toast(`${r.added} etiket ataması eklendi`, 'ok');
    await Promise.all([loadTags(), loadSaved(), tab.value === 'catalog' ? loadCat() : null]);
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function refreshStatus() {
  try {
    status.value = await api.ttsStatus();
  } catch { /* sunucu yok */ }
}

async function generate() {
  if (!text.value.trim() || generating.value) return;
  generating.value = true;
  genErr.value = '';
  result.value = null;
  elapsed.value = 0;
  timer = setInterval(() => (elapsed.value += 1), 1000);
  try {
    result.value = await api.ttsPreview(text.value, selected.value?.id);
    keepName.value = keepName.value || 'anlatim';
  } catch (e) {
    genErr.value = e.message;
  } finally {
    clearInterval(timer);
    generating.value = false;
    refreshStatus();
  }
}
async function keep() {
  try {
    const r = await api.ttsKeep(result.value.file, keepName.value);
    toast(`data/audio/${r.file} olarak kaydedildi`, 'ok');
  } catch (e) {
    toast(e.message, 'error');
  }
}
async function startEngine() {
  try {
    status.value = { ...status.value, starting: true };
    await api.ttsStart();
  } catch (e) {
    toast(e.message, 'error');
  }
  refreshStatus();
}

onMounted(async () => {
  await Promise.all([loadSaved(), loadTags(), refreshStatus()]);
  if (!saved.value.length) tab.value = 'catalog';
  poll = setInterval(refreshStatus, 4000);
});
onBeforeUnmount(() => {
  clearInterval(poll);
  clearInterval(timer);
  clearTimeout(buildTimer);
  clearTimeout(qTimer);
  if (audioEl) audioEl.pause();
});
</script>

<template>
  <div class="tts">
    <section class="left">
      <div class="row head">
        <div class="tabs">
          <button :class="{ active: tab === 'saved' }" @click="tab = 'saved'">Kayıtlı sesler ({{ saved.length }})</button>
          <button :class="{ active: tab === 'catalog' }" @click="tab = 'catalog'">Katalog (2.750)</button>
        </div>
        <span class="grow" />
        <span class="chip" :title="status.installed ? '' : 'tts/.venv kurulu değil'">
          <i class="dot" :class="{ on: status.running, wait: status.starting }" />
          {{ status.running ? 'Motor hazır' : status.starting ? 'Motor başlıyor…' : 'Motor kapalı' }}
        </span>
        <button v-if="!status.running && !status.starting" class="btn sm" @click="startEngine">Başlat</button>
      </div>

      <div v-if="tab === 'catalog'" class="row filters">
        <input v-model="q" class="input" placeholder="Ara (İngilizce): deep, raspy, narrator…" />
        <select v-model="gender" class="input sel">
          <option value="">Hepsi</option>
          <option value="female">Kadın</option>
          <option value="male">Erkek</option>
        </select>
      </div>

      <div class="row tagbar">
        <button
          v-for="t in tags"
          :key="t.id"
          class="tagchip"
          :class="{ on: tagFilter.includes(t.id) }"
          :style="{ '--c': t.color }"
          :title="`${t.count} ses`"
          @click="toggleFilter(t.id)"
        >
          {{ t.name }} <small>{{ t.count }}</small>
        </button>
        <button v-if="tagFilter.length" class="btn sm ghost" @click="tagFilter = []">Süzgeci temizle</button>
        <span class="grow" />
        <button class="btn sm" :class="{ on: showTags }" @click="showTags = !showTags">🏷 Etiketleri yönet</button>
      </div>

      <div v-if="showTags" class="tagman">
        <div v-for="t in tags" :key="t.id" class="row tagrow">
          <input type="color" class="input color" :value="t.color" @change="patchTag(t, { color: $event.target.value })" />
          <input class="input" :value="t.name" @change="patchTag(t, { name: $event.target.value })" />
          <span class="dim small count">{{ t.count }} ses</span>
          <button class="btn icon sm danger" title="Etiketi sil" @click="removeTag(t)">✕</button>
        </div>
        <div class="row tagrow">
          <input v-model="newTag.color" type="color" class="input color" />
          <input v-model="newTag.name" class="input" placeholder="Yeni etiket (örn. Reklam, Çocuk masalı)" @keyup.enter="addTag" />
          <button class="btn sm primary" :disabled="!newTag.name.trim()" @click="addTag">Ekle</button>
        </div>
        <div class="row">
          <button class="btn sm" @click="autoTags">✨ Hazır etiketleri uygula</button>
          <span class="dim small">Tariflerden yaş, ton, tempo ve rol etiketleri atar; mevcut etiketlerine dokunmaz.</span>
        </div>
      </div>

      <div class="list">
        <p v-if="tab === 'saved' && !saved.length" class="dim empty">
          Henüz kayıtlı ses yok. Katalogdan ★ ile kaydet; kaydettiğin sese ad verip Claude'a "<b>anlatici</b> sesini kullan" diyebilirsin.
        </p>
        <p v-else-if="tab === 'saved' && !savedShown.length" class="dim empty">Bu etiketlerle kayıtlı ses yok.</p>
        <p v-if="catErr && tab === 'catalog'" class="err empty">{{ catErr }}</p>
        <p v-if="tab === 'catalog' && cat.building" class="dim empty">
          Katalog ilk kez indiriliyor: {{ cat.progress?.done || 0 }} / {{ cat.progress?.total || '…' }} ses. Bir kez yapılır, sonra arama anında çalışır.
          <span v-if="cat.error" class="err"> Geçici hata, yeniden deneniyor.</span>
        </p>
        <p v-else-if="tab === 'catalog' && !loading && !catErr && !cat.rows.length" class="dim empty">Bu aramayla eşleşen ses yok.</p>

        <article v-for="v in list" :key="v.id" class="voice" :class="{ sel: selected?.id === v.id }" @click="pick(v)">
          <button class="btn icon sm" :class="{ on: playing === v.id }" title="Referans kaydı dinle" @click.stop="playRef(v)">
            {{ playing === v.id ? '■' : '▶' }}
          </button>
          <div class="grow">
            <div class="row meta">
              <b class="mono">{{ v.id }}</b>
              <span class="chip">{{ GENDER[v.gender] || v.gender }}</span>
              <input
                v-if="tab === 'saved'"
                class="input name"
                :value="v.name"
                placeholder="Ad ver (örn. anlatici)"
                @click.stop
                @change="rename(v, $event.target.value)"
              />
            </div>
            <div class="desc">{{ v.description }}</div>
            <div class="row vtags" @click.stop>
              <span v-for="id in v.tags || []" :key="id" class="tagchip mini on" :style="{ '--c': tagMap.get(id)?.color }">{{ tagMap.get(id)?.name || id }}</span>
              <button class="btn sm ghost addtag" :class="{ on: pickerFor === v.id }" title="Etiketle" @click="pickerFor = pickerFor === v.id ? '' : v.id">🏷 {{ pickerFor === v.id ? 'Kapat' : 'Etiketle' }}</button>
            </div>
            <div v-if="pickerFor === v.id" class="row picker" @click.stop>
              <button
                v-for="t in tags"
                :key="t.id"
                class="tagchip"
                :class="{ on: v.tags?.includes(t.id) }"
                :style="{ '--c': t.color }"
                @click="toggleVoiceTag(v, t.id)"
              >
                {{ t.name }}
              </button>
              <span v-if="!tags.length" class="dim small">Önce "Etiketleri yönet"ten etiket ekle.</span>
            </div>
          </div>
          <button class="btn icon sm ghost star" :class="{ on: savedIds.has(v.id) }" :title="savedIds.has(v.id) ? 'Kayıttan çıkar' : 'Kaydet'" @click.stop="toggleSave(v)">
            {{ savedIds.has(v.id) ? '★' : '☆' }}
          </button>
        </article>
      </div>

      <div v-if="tab === 'catalog' && cat.total > PAGE" class="row pager">
        <button class="btn sm" :disabled="page <= 1" @click="go(-1)">‹ Önceki</button>
        <span class="dim small">{{ page }} / {{ pages }} · {{ cat.total }} ses</span>
        <button class="btn sm" :disabled="page >= pages" @click="go(1)">Sonraki ›</button>
      </div>
    </section>

    <section class="right">
      <div class="label">Kullanılacak ses</div>
      <div class="chosen">
        <template v-if="selected">
          <b class="mono">{{ selected.id }}</b><span v-if="selected.name"> · {{ selected.name }}</span>
          <div class="desc">{{ selected.description }}</div>
          <button class="btn sm ghost" @click="selected = null">Varsayılan sese dön</button>
        </template>
        <span v-else class="dim">Varsayılan ses (soldan bir ses seçebilirsin)</span>
      </div>

      <div class="field">
        <label>Metin</label>
        <textarea v-model="text" class="input" rows="7" placeholder="Seslendirilecek metin…" />
        <span class="dim small">{{ text.length }} karakter · rakamları yazıyla yazmak daha doğru okunur (1554 → bin beş yüz elli dört)</span>
      </div>

      <div class="row">
        <button class="btn primary" :disabled="generating || !text.trim()" @click="generate">
          {{ generating ? `Üretiliyor… ${elapsed} sn` : '🔊 Sese dönüştür' }}
        </button>
        <span v-if="generating && !status.running" class="dim small">Motor açılıyor, ilk seferde 1 dk kadar sürer.</span>
      </div>
      <p v-if="genErr" class="err">{{ genErr }}</p>

      <div v-if="result" class="result">
        <audio :key="result.file" :src="result.url" controls autoplay />
        <div class="dim small">{{ result.dur }} sn · {{ result.voice || 'varsayılan ses' }}</div>
        <div class="row">
          <input v-model="keepName" class="input" placeholder="dosya adı" />
          <button class="btn" @click="keep">data/audio'ya kaydet</button>
        </div>
      </div>

      <p class="dim small note">
        Sesler sentetik (CC-BY veri seti). Claude'a şöyle söyleyebilirsin:<br />
        <code>kahve-cizim'i {{ selected ? selected.name || selected.id : 'd1-02552' }} sesiyle seslendir</code><br />
        <code>kahve-cizim'i "Sakin" etiketli bir kadın sesiyle seslendir</code>
      </p>
    </section>
  </div>
</template>

<style scoped>
.tts { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr); gap: 16px; padding: 16px; height: 100%; }
.left, .right { min-height: 0; display: flex; flex-direction: column; gap: 10px; }
.left { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); overflow: hidden; }
.right { overflow: auto; padding-right: 4px; }
.head { padding: 6px 8px 0 0; }
.filters, .tagbar { padding: 0 10px; }
.filters .sel { width: 110px; }
.tagbar { flex-wrap: wrap; gap: 6px; }
.tagchip {
  --c: #ea7a3b;
  display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px; border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); background: transparent; color: var(--c);
  font-size: 12px; cursor: pointer;
}
.tagchip small { color: var(--text-3); font-size: 10px; }
.tagchip.on { background: color-mix(in srgb, var(--c) 24%, transparent); border-color: var(--c); }
.tagchip.mini { height: 20px; font-size: 11px; padding: 0 7px; cursor: default; }
.tagman { margin: 0 10px; padding: 8px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); display: grid; gap: 6px; max-height: 190px; overflow: auto; flex: none; }
.tagrow .color { width: 36px; height: 28px; flex: none; }
.tagrow .count { width: 56px; text-align: right; flex: none; }
.list { flex: 1; min-height: 0; overflow: auto; display: grid; align-content: start; gap: 6px; padding: 0 10px 10px; }
.empty { padding: 16px 4px; margin: 0; }
.voice { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); cursor: pointer; }
.voice:hover { border-color: var(--line-2); }
.voice.sel { border-color: var(--accent); background: #2a1f16; }
.meta { flex-wrap: wrap; gap: 6px; }
.meta .name { width: 170px; height: 24px; }
.desc { font-size: 12px; color: var(--text-2); margin-top: 3px; line-height: 1.45; }
.vtags { flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.addtag { height: 22px; font-size: 11px; padding: 0 6px; color: var(--text-3); }
.picker { flex-wrap: wrap; gap: 5px; margin-top: 6px; padding: 6px; border: 1px dashed var(--line-2); border-radius: 8px; }
.star.on { color: var(--warn); }
.pager { justify-content: center; padding: 8px; border-top: 1px solid var(--line); }
.chosen { padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); display: grid; gap: 6px; justify-items: start; }
.result { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); }
.result audio { width: 100%; }
.note code { background: var(--bg-2); padding: 1px 5px; border-radius: 4px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); display: inline-block; }
.dot.on { background: var(--ok); }
.dot.wait { background: var(--warn); }
@media (max-width: 900px) { .tts { grid-template-columns: 1fr; height: auto; } }
</style>
