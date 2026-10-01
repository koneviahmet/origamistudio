<script setup>
// Şablonlar: reels odaklı, vuruşa oturan hazır video iskeletleri.
// Galeri (üzerine gelince oynar) → büyük önizleme (ses açılabilir) → içerik / görünüm / paylaşım formu → projeye dönüştür.
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api.js';
import { resources, loadResources } from '../resources.js';
import { STYLES } from '../engine/styles.js';
import { toastError } from '../toast.js';
import AnimPreview from '../components/design/AnimPreview.vue';
import ScenePlayer from '../components/ScenePlayer.vue';
import BriefFields from '../components/BriefFields.vue';
import ContentPanel from '../components/studio/ContentPanel.vue';
import PublishPanel from '../components/studio/PublishPanel.vue';

const router = useRouter();
const res = resources;
const templates = ref([]);
const meta = ref({ muzikler: [], paletler: [], fontlar: [], sahneler: [] });
const thumbs = shallowRef({}); // şablon id → örnek sahne
const q = ref('');
const tplId = ref('');
const brief = ref(null);
const jsonText = ref('');
const jsonErr = ref('');
const tab = ref('form');
const scene = shallowRef(null);
const previewErr = ref('');
const busy = ref(false);
const generating = ref(false);
const hot = ref('');
const player = ref(null);

// Kullanıcı şablonları (projeden kaydedilenler): sahnenin tam kopyası; İçerik + Paylaşım sekmeleriyle düzenlenir
const group = ref('hazir'); // hazir | benim
const userTpls = ref([]);
const work = ref(null);
const isUser = computed(() => group.value === 'benim');
let workTimer = 0;
function editWork(fn) {
  fn();
  clearTimeout(workTimer);
  workTimer = setTimeout(() => (scene.value = JSON.parse(JSON.stringify(work.value))), 200);
}

// Şablonlar dikey tasarlanır; kare / yatay çıktı proje içinde hazır "Formatlar" olarak gelir (sığdır).
const FORMATS = [
  ['reels', 'Reels / Shorts / TikTok', '9:16', 9 / 16],
  ['dikey45', 'Instagram gönderi', '4:5', 4 / 5],
];
const COMMON = ['sahne', 'sablon', 'id', 'ad', 'format', 'tema', 'stil', 'vurgu', 'muzik', 'fps', 'yayin', 'palet', 'font', 'renkler', 'bpm', 'beatOffset', 'ses'];
const LABELS = {
  altBaslik: 'Alt başlık', baslik: 'Başlık', metin: 'Metin', nesne: 'Nesne (kütüphane id)', kapanis: 'Kapanış', bilgi: 'Bilgi', alt: 'Alt yazı (örn. @kullanıcı)',
  ad: 'Ad', adimlar: 'Adımlar', maddeler: 'Maddeler', turlar: 'Turlar', grafik: 'Grafik', bitis: 'Bitiş metni', siralama: 'Sıralama (geri | ileri)',
  satirlar: 'Satırlar (*vurgu* için yıldız)', hook: 'Açılış cümlesi (hook) — *vurgu*', sayi: 'Büyük rakam', birim: 'Birim (%, B, K…)', sayiEtiketi: 'Rakamın açıklaması',
  cta: 'Çağrı (kapanış)', istatistikler: 'İstatistikler', ozellikler: 'Özellikler', cihaz: 'Cihaz', rozet: 'Rozet', fiyat: 'Fiyat', fiyatAlt: 'Fiyat altı', link: 'Bağlantı',
  ustBaslik: 'Üst başlık', altBaslik2: 'Alt başlık', sonuc: 'Sonuç', kisiA: '1. kişi', kisiB: '2. kişi', mesajlar: 'Mesajlar (kim: a | b)', tepkiler: 'Tepkiler (emoji|sayı)',
  bolumler: 'Bölümler (dönemler)', kanca: 'Kanca (küçük üst cümle)', altBaslik: 'Alt başlık', suslemeler: 'Kapak süsleri (nesne id)', kapakNesne: 'Kapak nesnesi', soru: 'Kapanış sorusu', son1: 'Kapanış 1. satır', son2: 'Kapanış 2. satır', murekkep: 'Yazı rengi (hex)',
  dalga: 'Alt ses dalgası', ozet: 'Özet başlığı', slogan: 'Slogan', vuruslarPerKelime: 'Kelime başına vuruş', zeminNo: 'Zemin rengi sırası',
};

const themes = computed(() => [...res.value.themes.values()]);
const list = computed(() => (isUser.value ? userTpls.value : templates.value));
const filtered = computed(() => {
  const s = q.value.trim().toLocaleLowerCase('tr');
  return list.value.filter((t) => !s || `${t.ad} ${t.aciklama} ${t.id} ${t.etiket || ''}`.toLocaleLowerCase('tr').includes(s));
});
const current = computed(() => list.value.find((t) => t.id === tplId.value));
const musicInfo = computed(() => {
  const m = brief.value?.muzik;
  return meta.value.muzikler.find((x) => x.id === m || x.file === m);
});

onMounted(async () => {
  try {
    const [l, mt] = await Promise.all([api.templates(), api.templateMeta().catch(() => ({ muzikler: [], paletler: [], fontlar: [] })), loadResources()]);
    templates.value = l;
    meta.value = mt;
    userTpls.value = await api.userTemplates();
    if (l.length) pick(l[0].id);
    // Galeri küçük resimleri: her şablonun örneğinden sahne üret (sırayla, arayüzü kilitlemeden)
    const out = {};
    await Promise.all(l.map(async (t) => {
      try {
        const { id: _omit, ...o } = t.ornek;
        out[t.id] = (await api.previewTemplate(o)).scene;
        thumbs.value = { ...out };
      } catch { /* küçük resim atlanır */ }
    }));
  } catch (e) {
    toastError(e);
  }
});

function setGroup(g) {
  if (group.value === g) return;
  group.value = g;
  tab.value = 'form';
  const l = g === 'benim' ? userTpls.value : templates.value;
  if (l.length) pick(l[0].id);
  else {
    tplId.value = '';
    brief.value = null;
    work.value = null;
    scene.value = null;
  }
}
function pickUser(id) {
  const t = userTpls.value.find((x) => x.id === id);
  clearTimeout(timer);
  seq++;
  brief.value = null;
  work.value = JSON.parse(JSON.stringify(t.scene));
  scene.value = JSON.parse(JSON.stringify(t.scene));
  previewErr.value = '';
  tplId.value = id;
  if (tab.value === 'look' || tab.value === 'json') tab.value = 'form';
}
async function removeUser() {
  const t = current.value;
  if (!t || !confirm('"' + t.ad + '" şablonu silinsin mi? (Kaynak proje etkilenmez)')) return;
  try {
    await api.deleteUserTemplate(t.id);
    userTpls.value = userTpls.value.filter((x) => x.id !== t.id);
    group.value = '';
    setGroup('benim');
  } catch (e) {
    toastError(e);
  }
}
async function renameUser() {
  const t = current.value;
  const ad = prompt('Şablon adı:', t.ad);
  if (!ad || !ad.trim()) return;
  try {
    Object.assign(t, await api.updateUserTemplate(t.id, { ad }));
  } catch (e) {
    toastError(e);
  }
}
function pick(id) {
  if (isUser.value) return pickUser(id);
  tplId.value = id;
  const t = templates.value.find((x) => x.id === id);
  const { id: _omit, ...ornek } = JSON.parse(JSON.stringify(t.ornek));
  brief.value = ornek;
  ensureYayin();
  syncJson();
}
function ensureYayin() {
  if (!brief.value.yayin) brief.value.yayin = { baslik: '', aciklama: '', etiketler: [] };
}
const yayinTags = computed({
  get: () => (brief.value?.yayin?.etiketler || []).join(', '),
  set: (v) => {
    ensureYayin();
    brief.value.yayin.etiketler = v.split(/[,\n]/).map((s) => s.replace(/^#/, '').trim()).filter(Boolean);
  },
});

// Form ↔ JSON eşleşmesi: form değişince JSON metni yenilenir, JSON elle düzenlenince brief yerine konur
let fromJson = false;
function syncJson() {
  jsonText.value = JSON.stringify(brief.value, null, 2);
  jsonErr.value = '';
}
function onJson(text) {
  jsonText.value = text;
  try {
    fromJson = true;
    brief.value = JSON.parse(text);
    jsonErr.value = '';
  } catch (e) {
    fromJson = false;
    jsonErr.value = `JSON hatası: ${e.message}`;
  }
}

let timer = 0;
let seq = 0;
watch(brief, () => {
  if (!brief.value) return;
  if (!fromJson) syncJson();
  fromJson = false;
  clearTimeout(timer);
  timer = setTimeout(refresh, 450);
}, { deep: true });

async function refresh() {
  if (!brief.value) return;
  const my = ++seq;
  busy.value = true;
  try {
    const out = await api.previewTemplate(clean(brief.value));
    if (my !== seq) return;
    scene.value = out.scene;
    previewErr.value = '';
    await nextTick();
    player.value?.play?.();
  } catch (e) {
    if (my === seq) previewErr.value = e.message;
  } finally {
    if (my === seq) busy.value = false;
  }
}
watch(tab, (t) => t === 'yayin' && brief.value && ensureYayin());
watch(tplId, () => {
  if (isUser.value || !brief.value) return;
  clearTimeout(timer);
  refresh();
});

/** Boş yayin / boş alanları çıkar */
function clean(b) {
  const o = JSON.parse(JSON.stringify(b));
  const y = o.yayin;
  if (y && !y.baslik && !y.aciklama && !(y.etiketler || []).length) delete o.yayin;
  for (const k of ['vurgu', 'tema', 'stil', 'ad', 'muzik', 'palet', 'font']) if (o[k] === '') delete o[k];
  return o;
}

function setKey(k, v) {
  if (v === '' || v == null) delete brief.value[k];
  else brief.value[k] = v;
}
function reset() {
  pick(tplId.value);
}
const thumbScene = (t) => (isUser.value ? t.scene : thumbs.value[t.id]);
const posterT = (s) => (s ? Math.min(s.duration * 0.5, 4) : 1);

async function create() {
  generating.value = true;
  try {
    const p = isUser.value ? await api.createProject(JSON.parse(JSON.stringify(work.value))) : await api.generateFromTemplate(clean(brief.value));
    router.push(`/studio/${p.id}`);
  } catch (e) {
    previewErr.value = e.message;
    toastError(e);
  } finally {
    generating.value = false;
  }
}
const fmtDur = (s) => `${Math.round(s.duration)} sn`;
</script>

<template>
  <div class="tv">
    <!-- Galeri -->
    <aside class="gal">
      <div class="gh">
        <div class="title">
          <h1>Şablonlar</h1>
          <p>Reels için vuruşa oturan hazır videolar. Seç, doldur, projeye dönüştür.</p>
        </div>
        <div class="seg">
          <button :class="{ on: !isUser }" @click="setGroup('hazir')">Hazır <span class="n">{{ templates.length }}</span></button>
          <button :class="{ on: isUser }" @click="setGroup('benim')">Benim <span class="n">{{ userTpls.length }}</span></button>
        </div>
        <input v-model="q" class="input" placeholder="Şablon ara…" />
      </div>
      <div class="cards">
        <button
          v-for="t in filtered"
          :key="t.id"
          class="card"
          :class="{ on: tplId === t.id }"
          @click="pick(t.id)"
          @mouseenter="hot = t.id"
          @mouseleave="hot = ''"
        >
          <div class="poster">
            <AnimPreview v-if="thumbScene(t)" :scene="thumbScene(t)" :res="res" :t="posterT(thumbScene(t))" :active="hot === t.id" :loop="thumbScene(t).duration" :px="340" />
            <div v-else class="ph" />
            <span v-if="thumbScene(t)" class="dur">{{ fmtDur(thumbScene(t)) }}</span>
          </div>
          <div class="info">
            <strong>{{ t.ad }}</strong>
            <span v-if="t.etiket" class="tag">{{ t.etiket }}</span>
            <span class="desc">{{ t.aciklama }}</span>
          </div>
        </button>
        <p v-if="!filtered.length" class="dim small pad">{{ isUser ? 'Henüz şablon yok. Projeler sayfasında bir projenin ☆ Şablon düğmesine bas.' : 'Eşleşen şablon yok.' }}</p>
      </div>
    </aside>

    <!-- Önizleme -->
    <section class="preview">
      <div class="ph2 row">
        <div class="grow">
          <h2>{{ current?.ad }}</h2>
          <div v-if="scene" class="meta">
            <span class="pill">{{ scene.width }}×{{ scene.height }}</span>
            <span class="pill">{{ Math.round(scene.duration) }} sn</span>
            <span class="pill">{{ scene.layers?.length }} katman</span>
            <span v-if="musicInfo" class="pill acc">♪ {{ musicInfo.ad }}</span>
            <span v-else-if="scene.audio?.length" class="pill acc">♪ müzikli</span>
          </div>
        </div>
        <span v-if="busy" class="dim small">güncelleniyor…</span>
      </div>
      <div class="stage">
        <ScenePlayer v-if="scene" ref="player" :scene="scene" :res="res" :max-side="700" />
        <div v-else class="dim pad">Önizleme hazırlanıyor…</div>
      </div>
      <p v-if="previewErr" class="err">{{ previewErr }}</p>
      <p class="dim small hint">♪ düğmesiyle sesi aç — şablonlar müziğin vuruşlarına oturur.</p>
    </section>

    <!-- Düzenleme: kullanıcı şablonu -->
    <aside v-if="work" class="edit">
      <div class="tabs">
        <button :class="{ active: tab === 'form' }" @click="tab = 'form'">İçerik</button>
        <button :class="{ active: tab === 'yayin' }" @click="tab = 'yayin'">Paylaşım</button>
      </div>
      <div class="eb">
        <div v-if="tab === 'form'" class="stack">
          <div class="field">
            <label>Yeni projenin adı</label>
            <input v-model="work.name" class="input" />
          </div>
          <ContentPanel :scene="work" :res="res" :selected-id="null" :edit="editWork" />
        </div>
        <PublishPanel v-else :scene="work" :edit="editWork" />
      </div>
      <footer class="row">
        <button class="btn" @click="renameUser">Adı değiştir</button>
        <button class="btn danger" @click="removeUser">Sil</button>
        <div class="grow" />
        <button class="btn primary" :disabled="generating" @click="create">{{ generating ? 'Oluşturuluyor…' : 'Proje oluştur ve aç' }}</button>
      </footer>
    </aside>

    <!-- Düzenleme: hazır şablon -->
    <aside v-else-if="brief" class="edit">
      <div class="tabs">
        <button :class="{ active: tab === 'form' }" @click="tab = 'form'">İçerik</button>
        <button :class="{ active: tab === 'look' }" @click="tab = 'look'">Görünüm</button>
        <button :class="{ active: tab === 'yayin' }" @click="tab = 'yayin'">Paylaşım</button>
        <button :class="{ active: tab === 'json' }" @click="tab = 'json'">JSON</button>
      </div>
      <div class="eb">
        <div v-if="tab === 'form'" class="stack">
          <div class="field">
            <label>Video / proje adı</label>
            <input class="input" :value="brief.ad || ''" @input="setKey('ad', $event.target.value)" />
          </div>
          <BriefFields :obj="brief" :skip="COMMON" :labels="LABELS" />
        </div>

        <div v-else-if="tab === 'look'" class="stack">
          <div class="field">
            <label>Format</label>
            <div class="fmts">
              <button v-for="f in FORMATS" :key="f[0]" class="fmt" :class="{ on: (brief.format || 'reels') === f[0] }" @click="setKey('format', f[0])">
                <i :style="{ aspectRatio: f[3] }" />
                <span>{{ f[1] }}</span>
                <small>{{ f[2] }}</small>
              </button>
            </div>
            <small class="dim">Kare (1:1) ve yatay (16:9) çıktılar proje içinde "Formatlar" olarak hazır gelir.</small>
          </div>

          <div v-if="brief.sahne !== undefined && meta.sahneler?.length" class="field">
            <label>Sahne</label>
            <div class="mus">
              <button v-for="s in meta.sahneler" :key="s" class="mu" :class="{ on: brief.sahne === s }" @click="setKey('sahne', s)"><span>{{ ({ okyanus: 'Okyanus', daglar: 'Dağlar', gece: 'Gece' })[s] || s }}</span></button>
            </div>
          </div>
          <div v-if="meta.paletler.length" class="field">
            <label>Renk paleti</label>
            <div class="pals">
              <button v-for="p in meta.paletler" :key="p.id" class="pal" :class="{ on: brief.palet === p.id }" :title="p.ad" @click="setKey('palet', p.id)">
                <span class="sw"><i v-for="c in p.renkler" :key="c" :style="{ background: c }" /></span>
                <small>{{ p.ad }}</small>
              </button>
            </div>
          </div>
          <div class="field">
            <label>Vurgu rengi <span class="dim">(isteğe bağlı)</span></label>
            <div class="row">
              <input type="color" class="input color" :value="/^#[0-9a-f]{6}$/i.test(brief.vurgu || '') ? brief.vurgu : '#ff3b6b'" @input="setKey('vurgu', $event.target.value)" />
              <input class="input mono grow" :value="brief.vurgu || ''" placeholder="(paletten)" @change="setKey('vurgu', $event.target.value.trim())" />
              <button class="btn sm" @click="setKey('vurgu', '')">Temizle</button>
            </div>
          </div>

          <div v-if="meta.muzikler.length" class="field">
            <label>Müzik (vuruşlar buna oturur)</label>
            <div class="mus">
              <button v-for="m in meta.muzikler" :key="m.id" class="mu" :class="{ on: brief.muzik === m.id || brief.muzik === m.file }" @click="setKey('muzik', m.id)">
                <b>{{ m.bpm }}</b><span>{{ m.ad.replace(/ · \d+ BPM/, '') }}</span>
              </button>
              <button class="mu" :class="{ on: brief.muzik === false }" @click="setKey('muzik', false)"><b>—</b><span>Müziksiz</span></button>
            </div>
          </div>

          <div v-if="meta.fontlar.length" class="field">
            <label>Başlık fontu</label>
            <select class="input" :value="brief.font || ''" @change="setKey('font', $event.target.value)">
              <option value="">(şablon varsayılanı)</option>
              <option v-for="f in meta.fontlar" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="field">
            <label>Çizim stili</label>
            <select class="input" :value="brief.stil || ''" @change="setKey('stil', $event.target.value)">
              <option value="">Düz (şablon varsayılanı)</option>
              <option v-for="(s, k) in STYLES" :key="k" :value="k">{{ s.label }}</option>
            </select>
          </div>
          <div v-if="brief.tema !== undefined" class="field">
            <label>Tema</label>
            <select class="input" :value="brief.tema || ''" @change="setKey('tema', $event.target.value)">
              <option value="">(şablon varsayılanı)</option>
              <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.name || t.id }}</option>
            </select>
          </div>
        </div>

        <div v-else-if="tab === 'yayin' && brief.yayin" class="stack">
          <p class="dim small">Proje oluşturulunca Stüdyo → Paylaşım sekmesine gelir.</p>
          <div class="field">
            <label>Başlık</label>
            <input v-model="brief.yayin.baslik" class="input" />
          </div>
          <div class="field">
            <label>Açıklama</label>
            <textarea v-model="brief.yayin.aciklama" class="input" rows="5" />
          </div>
          <div class="field">
            <label>Etiketler (virgülle)</label>
            <input class="input" :value="yayinTags" @change="yayinTags = $event.target.value" />
          </div>
        </div>

        <div v-else class="stack">
          <textarea :value="jsonText" class="input mono json" spellcheck="false" @input="onJson($event.target.value)" />
          <span v-if="jsonErr" class="err">{{ jsonErr }}</span>
          <span class="dim small">Alanlar: docs/prompt-rehberi.md §9</span>
        </div>
      </div>
      <footer class="row">
        <button class="btn" @click="reset">Sıfırla</button>
        <div class="grow" />
        <button class="btn primary" :disabled="generating || !!jsonErr || !!previewErr" @click="create">{{ generating ? 'Üretiliyor…' : 'Proje oluştur ve aç' }}</button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.tv { display: grid; grid-template-columns: 330px minmax(380px, 1fr) 410px; height: calc(100vh - 56px); min-height: 0; }

/* galeri */
.gal { border-right: 1px solid var(--line); display: flex; flex-direction: column; min-height: 0; background: var(--bg-2); }
.gh { padding: 16px 16px 10px; display: grid; gap: 10px; }
.title h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -.02em; background: linear-gradient(90deg, #ffd9a8, #ea7a3b 60%, #ff5d8f); -webkit-background-clip: text; background-clip: text; color: transparent; width: fit-content; }
.title p { margin: 3px 0 0; font-size: 12px; color: var(--text-3); }
.seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 2px; }
.seg button { border: 0; background: transparent; color: var(--text-2); font: inherit; font-size: 12.5px; padding: 6px; border-radius: 8px; cursor: pointer; }
.seg button.on { background: var(--panel-2); color: var(--text); box-shadow: 0 0 0 1px var(--line-2); }
.n { font-size: 10.5px; color: var(--text-3); margin-left: 4px; }
.cards { flex: 1; min-height: 0; overflow: auto; padding: 4px 14px 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }
.card { display: grid; gap: 8px; text-align: left; padding: 7px 7px 10px; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); color: inherit; cursor: pointer; font: inherit; transition: transform .14s, border-color .14s, box-shadow .14s; }
.card:hover { transform: translateY(-2px); border-color: var(--line-2); box-shadow: 0 12px 26px -14px rgba(0, 0, 0, .8); }
.card.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 14px 30px -14px rgba(234, 122, 59, .55); }
.poster { position: relative; aspect-ratio: 9 / 16; border-radius: 10px; overflow: hidden; background: #0e0c10; }
.poster .ph { height: 100%; background: linear-gradient(110deg, #1b1721 30%, #26202e 50%, #1b1721 70%); background-size: 200% 100%; animation: sh 1.4s linear infinite; }
@keyframes sh { to { background-position: -200% 0; } }
.dur { position: absolute; left: 6px; bottom: 6px; font-size: 10.5px; padding: 1px 7px; border-radius: 999px; background: rgba(0, 0, 0, .6); color: #eee; }
.info { display: grid; gap: 3px; padding: 0 3px; min-width: 0; }
.info strong { font-size: 13px; line-height: 1.2; }
.tag { font-size: 10.5px; color: var(--accent-2); font-weight: 600; }
.desc { font-size: 11px; color: var(--text-3); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; }

/* önizleme */
.preview { padding: 16px 20px; overflow: auto; display: flex; flex-direction: column; gap: 10px; min-width: 0; background: radial-gradient(900px 500px at 50% 0%, rgba(234, 122, 59, .08), transparent 70%); }
.ph2 h2 { margin: 0; font-size: 18px; font-weight: 700; }
.meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.pill { font-size: 11px; padding: 2px 9px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line); color: var(--text-2); }
.pill.acc { color: var(--accent-2); border-color: color-mix(in srgb, var(--accent) 40%, var(--line)); }
.stage { display: grid; place-items: start center; }
.hint { text-align: center; }

/* düzenleme */
.edit { border-left: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; min-height: 0; }
.tabs { display: flex; border-bottom: 1px solid var(--line); }
.tabs button { flex: 1; padding: 11px 6px; background: transparent; border: 0; border-bottom: 2px solid transparent; color: var(--text-2); cursor: pointer; font: inherit; }
.tabs button.active { color: var(--text); border-bottom-color: var(--accent); }
.eb { flex: 1; overflow: auto; padding: 14px; min-height: 0; }
.stack { display: grid; gap: 14px; align-content: start; }
.edit footer { padding: 10px 12px; border-top: 1px solid var(--line); gap: 8px; }
.json { min-height: 60vh; font-size: 11.5px; line-height: 1.45; resize: vertical; }
.err { color: #ff8a8a; font-size: 12px; }
.pad { padding: 12px; }

.fmts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.fmt { display: grid; justify-items: center; gap: 4px; padding: 8px 4px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); color: var(--text-2); cursor: pointer; font: inherit; }
.fmt i { display: block; height: 30px; background: var(--line-2); border-radius: 4px; max-width: 54px; }
.fmt span { font-size: 11px; } .fmt small { font-size: 10px; color: var(--text-3); }
.fmt.on { border-color: var(--accent); color: var(--text); }
.fmt.on i { background: var(--accent); }
.pals { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.pal { display: grid; gap: 5px; padding: 7px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); color: var(--text-2); cursor: pointer; font: inherit; text-align: left; }
.pal small { font-size: 11px; }
.pal .sw { display: flex; height: 20px; border-radius: 6px; overflow: hidden; }
.pal .sw i { flex: 1; }
.pal.on { border-color: var(--accent); color: var(--text); box-shadow: 0 0 0 1px var(--accent); }
.mus { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.mu { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); color: var(--text-2); cursor: pointer; font: inherit; font-size: 12px; text-align: left; }
.mu b { font-size: 15px; color: var(--accent-2); min-width: 30px; font-variant-numeric: tabular-nums; }
.mu.on { border-color: var(--accent); color: var(--text); box-shadow: 0 0 0 1px var(--accent); }

@media (max-width: 1280px) { .tv { grid-template-columns: 270px 1fr 360px; } .cards { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .card, .poster .ph { transition: none; animation: none; } }
</style>
