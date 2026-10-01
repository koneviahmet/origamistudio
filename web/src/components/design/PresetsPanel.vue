<script setup>
// Animasyonlar sayfası: giriş / çıkış / sürekli / hareket ön ayarları, metin animasyonları, sayfa geçişleri, parçacık efektleri.
// Hızlı: kartlar ekrana girince tek kare çizilir (ortak kuyruk), yalnızca üzerine gelinen kart oynar, sahneler önbelleklenir.
// Kullanışlı: arama, kategori sayacı, favoriler, boyut seçici, koyu/açık önizleme, ayrıntı paneli (parametre ayarı, hız, kaydırma çubuğu, JSON).
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { resources, loadResources } from '../../resources.js';
import { toast } from '../../toast.js';
import { PRESETS, PRESET_CATS, presetDefaults } from '../../engine/presets.js';
import { STYLES } from '../../engine/styles.js';
import { TEXT_ANIMS, TEXT_ANIM_CATS, textAnimDefaults } from '../../engine/textanims.js';
import { TRANSITIONS } from '../../engine/transitions.js';
import AnimPreview from './AnimPreview.vue';

// ── kalıcı ayarlar ───────────────────────────────────────────────────────────
const LS = 'design.anim.';
const load = (k, d) => {
  try {
    const v = localStorage.getItem(LS + k);
    return v == null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(LS + k, JSON.stringify(v));
  } catch {
    /* özel pencere */
  }
};

const GROUPS = [
  { k: 'hepsi', label: 'Tümü', color: '#f1e9dd' },
  { k: 'fav', label: 'Favoriler', color: '#f2c14e' },
  { k: 'giris', label: 'Giriş', color: '#6cc28a' },
  { k: 'cikis', label: 'Çıkış', color: '#e5686d' },
  { k: 'surekli', label: 'Sürekli', color: '#5aa9e6' },
  { k: 'hareket', label: 'Hareket', color: '#b48cf2' },
  { k: 'metin', label: 'Metin', color: '#f5a36b' },
  { k: 'gecis', label: 'Sayfa geçişleri', color: '#7fd1c7' },
  { k: 'parcacik', label: 'Parçacıklar', color: '#f2c14e' },
];
const CAT_COLOR = { giris: '#6cc28a', cikis: '#e5686d', surekli: '#5aa9e6', hareket: '#b48cf2', metin: '#f5a36b', gecis: '#7fd1c7', parcacik: '#f2c14e' };
const SPECIAL = { 'kanat-cirp': 'turna', 'kuyruk-salla': 'balik' };
const SIZES = { s: { w: 150, px: 200 }, m: { w: 190, px: 250 }, l: { w: 250, px: 320 } };

const group = ref(load('group', 'hepsi'));
const q = ref('');
const size = ref(load('size', 'm'));
const dark = ref(load('dark', true));
const assetId = ref(load('asset', 'tilki'));
const style = ref(load('style', 'origami'));
const sample = ref(load('sample', 'Kağıt\nDünya'));
const favs = reactive(new Set(load('fav', [])));
const hot = ref('');
const selKey = ref(load('sel', ''));
const over = ref({});
const searchEl = ref(null);
const loaded = ref(resources.value.assets.size > 0); // kaynaklar gelmeden kart çizilmesin (boşa çizim)

watch(group, (v) => save('group', v));
watch(size, (v) => save('size', v));
watch(dark, (v) => save('dark', v));
watch(assetId, (v) => save('asset', v));
watch(style, (v) => save('style', v));
watch(sample, (v) => save('sample', v));
watch(selKey, (v) => save('sel', v));

// ── öğe listesi ──────────────────────────────────────────────────────────────
const effects = computed(() => [...resources.value.assets.values()].filter((a) => a.type === 'particles'));
const origamiAssets = computed(() => [...resources.value.assets.values()].filter((a) => !a.type).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr')));

const items = computed(() => {
  const out = [];
  for (const [id, p] of Object.entries(PRESETS)) out.push({ key: `p:${id}`, kind: 'preset', id, name: p.name, group: p.cat, sub: PRESET_CATS[p.cat], dur: p.dur, params: p.params || [] });
  for (const [id, p] of Object.entries(TEXT_ANIMS)) out.push({ key: `t:${id}`, kind: 'text', id, name: p.name, group: 'metin', sub: `Metin · ${TEXT_ANIM_CATS[p.cat]}`, tcat: p.cat, dur: p.dur, params: p.params || [], unit: p.unit });
  for (const [id, T] of Object.entries(TRANSITIONS)) out.push({ key: `g:${id}`, kind: 'gecis', id, name: T.name, group: 'gecis', sub: T.kind === 'cover' ? 'Örtü' : 'Kare', dur: T.dur, params: T.params.map((k) => ({ key: k })) });
  for (const e of effects.value) out.push({ key: `e:${e.id}`, kind: 'parcacik', id: e.id, name: e.name || e.id, group: 'parcacik', sub: 'Parçacık', dur: 4, params: [], asset: e });
  return out;
});

const fold = (s) => String(s ?? '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
const haystack = (it) => fold(`${it.name} ${it.id} ${it.sub} ${it.params.map((p) => p.label || p.key).join(' ')}`);
const counts = computed(() => {
  const c = { hepsi: items.value.length, fav: 0 };
  for (const it of items.value) {
    c[it.group] = (c[it.group] || 0) + 1;
    if (favs.has(it.key)) c.fav++;
  }
  return c;
});
const shown = computed(() => {
  const s = fold(q.value.trim());
  return items.value.filter((it) => {
    if (group.value === 'fav' ? !favs.has(it.key) : group.value !== 'hepsi' && it.group !== group.value) return false;
    return !s || haystack(it).includes(s);
  });
});
const sel = computed(() => items.value.find((i) => i.key === selKey.value) || null);

// ── sahne kurucular ──────────────────────────────────────────────────────────
const BG = {
  koyu: { type: 'radial', colors: ['#34304a', '#14121d'], paper: 0.15, vignette: 0.25 },
  acik: { type: 'radial', colors: ['#fdf3e4', '#efd2ae'], paper: 0.3, vignette: 0.1 },
};
const base = (duration, extra) => ({ width: 400, height: 400, fps: 30, duration, background: dark.value ? BG.koyu : BG.acik, ...extra });

const loopLen = (it) => {
  if (it.kind === 'gecis') return CUT + it.dur + 0.8;
  if (it.kind === 'text') return it.tcat === 'surekli' ? 3 : it.tcat === 'cikis' ? 2.6 : 2.4;
  if (it.kind === 'parcacik') return 4;
  if (it.group === 'giris') return 0.4 + it.dur + 1.2;
  if (it.group === 'cikis') return 0.8 + it.dur + 0.6;
  if (it.group === 'hareket') return Math.min(it.dur, 4) + 0.4;
  return 4;
};
const posterT = (it) => {
  if (it.kind === 'gecis') return CUT + it.dur * 0.5;
  if (it.kind === 'text') return it.tcat === 'cikis' ? 1.1 : it.tcat === 'surekli' ? 1.2 : 0.3 + 1.0;
  if (it.kind === 'parcacik') return 2.2;
  if (it.group === 'giris') return 0.4 + it.dur * 0.55;
  if (it.group === 'cikis') return 0.8 + it.dur * 0.5;
  if (it.group === 'hareket') return 0.2 + Math.min(it.dur, 4) * 0.5;
  return 1.6;
};
const CUT = 1.2;

function presetAnim(it, ov = {}) {
  const a = { preset: it.id, t: it.group === 'cikis' ? 0.8 : it.group === 'hareket' ? 0.2 : 0.4, ...presetDefaults(it.id), ...ov };
  if (it.dur && ov.dur == null) a.dur = it.group === 'hareket' ? Math.min(it.dur, 4) : it.dur;
  return a;
}
function textAnim(it, ov = {}) {
  return { preset: it.id, t: it.tcat === 'cikis' ? 0.8 : 0.3, ...textAnimDefaults(it.id), ...ov };
}
function transition(it, ov = {}) {
  return { type: it.id, t: CUT, ...ov };
}

function buildScene(it, ov = {}) {
  if (it.kind === 'preset') {
    const id = SPECIAL[it.id] && resources.value.assets.has(SPECIAL[it.id]) ? SPECIAL[it.id] : assetId.value;
    const a = resources.value.assets.get(id);
    const sz = a ? Math.max(...a.size) : 200;
    const dur = Math.max(loopLen(it), (ov.dur ?? 0) + (ov.t ?? 0.4) + 0.8);
    return base(dur, { style: style.value, layers: [{ id: 'a', asset: id, x: 200, y: 200, scale: 230 / sz, anims: [presetAnim(it, ov)] }] });
  }
  if (it.kind === 'text') {
    return base(loopLen(it), {
      layers: [{ id: 't', type: 'text', text: sample.value || 'Kağıt', x: 200, y: 200, size: 84, weight: 800, color: dark.value ? '#ffd9a8' : '#c8553d', textAnims: [textAnim(it, ov)] }],
    });
  }
  if (it.kind === 'gecis') {
    const page = (id, text, color, start, end) => ({ id, type: 'text', text, x: 200, y: 200, size: 170, weight: 800, color, start, end });
    return base(loopLen(it), {
      background: { type: 'solid', color: dark.value ? '#1b1826' : '#efd2ae' },
      layers: [page('a', 'A', '#f08a4b', 0, CUT), page('b', 'B', '#4b9bf0', CUT)],
      transitions: [transition(it, ov)],
    });
  }
  const e = it.asset;
  return base(4, {
    background: { type: 'linear', colors: ['#2b3a67', '#0b1026'], paper: 0.2, vignette: 0.1 },
    layers: [{ id: 'p', type: 'particles', particle: e.id, mode: 'surekli', x: 200, y: 170, size: (e.size || 20) * 0.5, count: Math.max(6, Math.round((e.count || 60) * 0.45)), speed: 0.45, prewarm: true }],
  });
}

// Kart sahneleri önbellekte: ayar değişince temizlenir; kimlik sabit kaldığı için yeniden çizim tetiklenmez.
const cache = new Map();
const ver = ref(0);
watch([assetId, style, dark, sample, () => resources.value], () => {
  cache.clear();
  ver.value++;
});
function cardScene(it) {
  void ver.value;
  let s = cache.get(it.key);
  if (!s) cache.set(it.key, (s = buildScene(it)));
  return s;
}

// ── seçili öğe (ayrıntı paneli) ─────────────────────────────────────────────
const playing = ref(true);
const speed = ref(1);
const ts = ref(0);
const cur = ref(0);
const detailScene = computed(() => {
  void ver.value;
  return sel.value ? buildScene(sel.value, over.value) : null;
});
const detailLoop = computed(() => (detailScene.value ? detailScene.value.duration : 3));
const snippet = computed(() => {
  const it = sel.value;
  if (!it) return '';
  const ov = over.value;
  if (it.kind === 'preset') return JSON.stringify(presetAnim(it, ov));
  if (it.kind === 'text') return JSON.stringify(textAnim(it, ov));
  if (it.kind === 'gecis') return JSON.stringify({ ...transition(it, ov), t: 4 });
  return JSON.stringify({ type: 'particles', particle: it.id, mode: 'surekli' });
});
const where = computed(() => {
  const it = sel.value;
  if (!it) return '';
  return { preset: 'katman → "anims": [ … ]', text: 'metin katmanı → "textAnims": [ … ]', gecis: 'sahne → "transitions": [ … ]', parcacik: 'katman olarak ekle (Stüdyo → ＋ Parçacık)' }[it.kind];
});

function open(it) {
  selKey.value = it.key;
  over.value = {};
  playing.value = true;
  ts.value = 0;
}
function close() {
  selKey.value = '';
}
watch(sel, (s) => {
  if (s) {
    playing.value = true;
    ts.value = 0;
  }
});
function onTime(t) {
  if (Math.abs(t - cur.value) > 0.04) cur.value = t;
}
function scrub(e) {
  playing.value = false;
  ts.value = Number(e.target.value);
  cur.value = ts.value;
}
function togglePlay() {
  if (!playing.value) ts.value = cur.value;
  playing.value = !playing.value;
}
function setOver(key, v, def) {
  const o = { ...over.value };
  if (v === '' || v == null || v === def) delete o[key];
  else o[key] = v;
  over.value = o;
}
function paramValue(p) {
  return over.value[p.key] ?? p.def ?? '';
}
const TR_PARAMS = {
  color: { label: 'Kağıt rengi', type: 'color', def: '#f6efe4' },
  yon: { label: 'Yön', type: 'select', options: [['sol', 'Sol'], ['sag', 'Sağ'], ['yukari', 'Yukarı'], ['asagi', 'Aşağı']], def: 'sol' },
  kat: { label: 'Kat sayısı', type: 'number', def: 5, step: 1 },
  seed: { label: 'Tohum', type: 'number', def: 1, step: 1 },
};
const detailParams = computed(() => {
  const it = sel.value;
  if (!it) return [];
  if (it.kind === 'gecis') return it.params.map((p) => ({ key: p.key, ...TR_PARAMS[p.key] })).filter((p) => p.type).concat([{ key: 'dur', label: 'Süre (sn)', type: 'number', def: it.dur, step: 0.1 }]);
  const list = [...it.params];
  if (it.kind === 'preset' && it.dur && !list.some((p) => p.key === 'dur')) list.push({ key: 'dur', label: 'Süre (sn)', type: 'number', def: it.dur, step: 0.1 });
  if (it.kind === 'text') {
    if (!list.some((p) => p.key === 'dur')) list.push({ key: 'dur', label: 'Birim süresi (sn)', type: 'number', def: it.dur, step: 0.05 });
    if (it.tcat !== 'surekli' && !list.some((p) => p.key === 'aralik')) list.push({ key: 'aralik', label: 'Birimler arası (sn)', type: 'number', def: TEXT_ANIMS[it.id].aralik ?? 0.05, step: 0.01 });
  }
  return list;
});

async function copy(text, what = 'JSON') {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} kopyalandı`, 'ok', 1400);
  } catch {
    toast(text);
  }
}
function toggleFav(it) {
  if (favs.has(it.key)) favs.delete(it.key);
  else favs.add(it.key);
  save('fav', [...favs]);
}

// ── klavye ───────────────────────────────────────────────────────────────────
function onKey(e) {
  const tag = e.target?.tagName;
  if (e.key === 'Escape') {
    if (tag === 'INPUT' && q.value) q.value = '';
    else close();
  } else if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    e.preventDefault();
    searchEl.value?.focus();
  } else if (sel.value && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    const list = shown.value;
    const i = list.findIndex((x) => x.key === selKey.value);
    const n = list[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (n) open(n);
  } else if (sel.value && e.key === ' ' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    e.preventDefault();
    togglePlay();
  }
}
onMounted(async () => {
  window.addEventListener('keydown', onKey);
  await loadResources();
  loaded.value = true;
  if (!resources.value.assets.has(assetId.value) || resources.value.assets.get(assetId.value)?.type) assetId.value = origamiAssets.value.find((a) => a.id === 'tilki')?.id || origamiAssets.value[0]?.id || '';
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="anim" :class="{ withDetail: !!sel }">
    <!-- Sol: kategoriler + önizleme ayarları -->
    <aside class="side">
      <nav class="cats">
        <button v-for="g in GROUPS" :key="g.k" :class="{ on: group === g.k }" @click="group = g.k">
          <i class="dot" :style="{ background: g.color }" />
          <span class="grow">{{ g.label }}</span>
          <span class="n">{{ counts[g.k] || 0 }}</span>
        </button>
      </nav>
      <div class="set">
        <h4>Önizleme</h4>
        <label>Model (giriş / çıkış / sürekli)</label>
        <select v-model="assetId" class="input">
          <option v-for="a in origamiAssets" :key="a.id" :value="a.id">{{ a.name || a.id }}</option>
        </select>
        <label>Çizim stili</label>
        <select v-model="style" class="input">
          <option v-for="(st, k) in STYLES" :key="k" :value="k">{{ st.label }}</option>
        </select>
        <label>Metin animasyonları için yazı</label>
        <textarea v-model="sample" class="input" rows="2" />
      </div>
    </aside>

    <!-- Orta: arama + ızgara -->
    <section class="main">
      <div class="tools">
        <div class="search">
          <span class="ico">⌕</span>
          <input ref="searchEl" v-model="q" class="input" placeholder="Animasyon ara…   ( / )" />
          <button v-if="q" class="x" @click="q = ''">✕</button>
        </div>
        <span class="dim small count">{{ shown.length }} sonuç</span>
        <div class="seg" title="Kart boyutu">
          <button v-for="s in ['s', 'm', 'l']" :key="s" :class="{ on: size === s }" @click="size = s">{{ s.toUpperCase() }}</button>
        </div>
        <div class="seg" title="Önizleme zemini">
          <button :class="{ on: dark }" @click="dark = true">Koyu</button>
          <button :class="{ on: !dark }" @click="dark = false">Açık</button>
        </div>
      </div>

      <div class="grid" :style="{ '--cw': SIZES[size].w + 'px' }">
        <article
          v-for="it in (loaded ? shown : [])"
          :key="it.key"
          class="card"
          :class="{ sel: selKey === it.key, hot: hot === it.key }"
          tabindex="0"
          :style="{ '--c': CAT_COLOR[it.group] }"
          @mouseenter="hot = it.key"
          @mouseleave="hot = ''"
          @focus="hot = it.key"
          @blur="hot = ''"
          @click="open(it)"
          @keydown.enter="open(it)"
        >
          <div class="pv">
            <AnimPreview :scene="cardScene(it)" :res="resources" :t="posterT(it)" :active="hot === it.key" :loop="loopLen(it)" :px="SIZES[size].px" />
            <span class="badge">{{ it.dur ? it.dur + ' sn' : 'döngü' }}</span>
            <button class="fav" :class="{ on: favs.has(it.key) }" :title="favs.has(it.key) ? 'Favoriden çıkar' : 'Favorilere ekle'" @click.stop="toggleFav(it)">★</button>
            <span class="play">▶</span>
          </div>
          <div class="meta">
            <strong>{{ it.name }}</strong>
            <code>{{ it.id }}</code>
          </div>
          <div class="chips">
            <span class="chip" :style="{ color: CAT_COLOR[it.group] }">{{ it.sub }}</span>
            <span v-if="it.params.length" class="dim tiny">{{ it.params.length }} ayar</span>
          </div>
        </article>
        <p v-if="!shown.length" class="empty dim">
          {{ group === 'fav' ? 'Henüz favori yok. Bir kartın sağ üstündeki ★ düğmesine bas.' : 'Eşleşen animasyon yok.' }}
        </p>
      </div>
    </section>

    <!-- Sağ: ayrıntı -->
    <aside v-if="sel" class="detail">
      <header>
        <div class="grow">
          <strong>{{ sel.name }}</strong>
          <div><code>{{ sel.id }}</code> <span class="chip" :style="{ color: CAT_COLOR[sel.group] }">{{ sel.sub }}</span></div>
        </div>
        <button class="btn sm ghost" :title="favs.has(sel.key) ? 'Favoriden çıkar' : 'Favori'" :style="{ color: favs.has(sel.key) ? '#f2c14e' : '' }" @click="toggleFav(sel)">★</button>
        <button class="btn sm ghost" title="Kapat (Esc)" @click="close">✕</button>
      </header>
      <div class="big">
        <AnimPreview :scene="detailScene" :res="resources" :t="ts" :active="true" :paused="!playing" :loop="detailLoop" :speed="speed" :px="520" :lazy="false" />
      </div>
      <div class="player row">
        <button class="btn sm" :title="playing ? 'Duraklat (boşluk)' : 'Oynat (boşluk)'" @click="togglePlay">{{ playing ? '❚❚' : '▶' }}</button>
        <input type="range" class="bar" min="0" :max="detailLoop" step="0.01" :value="playing ? cur : ts" @input="scrub" />
        <span class="mono tiny">{{ (playing ? cur : ts).toFixed(1) }}/{{ detailLoop.toFixed(1) }}s</span>
        <select v-model.number="speed" class="input spd">
          <option :value="0.25">0.25×</option>
          <option :value="0.5">0.5×</option>
          <option :value="1">1×</option>
          <option :value="2">2×</option>
        </select>
      </div>

      <div class="body">
        <div v-if="detailParams.length" class="params">
          <div class="ph row"><h4 class="grow">Ayarlar</h4><button v-if="Object.keys(over).length" class="btn sm ghost" @click="over = {}">Sıfırla</button></div>
          <div v-for="p in detailParams" :key="p.key" class="prm">
            <label>{{ p.label || p.key }}</label>
            <select v-if="p.type === 'select'" class="input" :value="paramValue(p)" @change="setOver(p.key, $event.target.value, p.def)">
              <option v-for="o in p.options" :key="o[0]" :value="o[0]">{{ o[1] }}</option>
            </select>
            <input v-else-if="p.type === 'color'" type="color" class="input color" :value="paramValue(p)" @input="setOver(p.key, $event.target.value, p.def)" />
            <input v-else class="input" type="number" :step="p.step || 1" :value="paramValue(p)" @change="setOver(p.key, $event.target.value === '' ? '' : Number($event.target.value), p.def)" />
          </div>
        </div>
        <p v-else class="dim small">Bu öğenin ayarı yok.</p>

        <div class="code">
          <div class="ph row"><h4 class="grow">JSON</h4><button class="btn sm" @click="copy(snippet)">Kopyala</button></div>
          <pre>{{ snippet }}</pre>
          <p class="dim tiny">Nereye: {{ where }} · Stüdyoda: katman → Animasyonlar → ＋</p>
        </div>
        <p class="dim tiny keys">← → önceki / sonraki · boşluk oynat/duraklat · Esc kapat</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.anim { display: grid; grid-template-columns: 236px minmax(0, 1fr); height: 100%; min-height: 0; }
.anim.withDetail { grid-template-columns: 236px minmax(0, 1fr) 392px; }
.side { border-right: 1px solid var(--line); padding: 14px 12px; overflow: auto; display: flex; flex-direction: column; gap: 16px; background: var(--bg-2); }
.cats { display: grid; gap: 2px; }
.cats button { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border: 0; border-radius: 9px; background: transparent; color: var(--text-2); cursor: pointer; font: inherit; font-size: 13px; text-align: left; transition: background .12s, color .12s; }
.cats button:hover { background: var(--panel); color: var(--text); }
.cats button.on { background: var(--panel-2); color: var(--text); box-shadow: inset 2px 0 0 var(--accent); }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.n { font-size: 11px; color: var(--text-3); font-variant-numeric: tabular-nums; background: var(--bg); padding: 1px 7px; border-radius: 999px; }
.set { display: grid; gap: 6px; }
.set h4, .params h4, .code h4 { margin: 0; font-size: 11px; letter-spacing: .09em; text-transform: uppercase; color: var(--text-3); font-weight: 600; }
.set label, .prm label { font-size: 11.5px; color: var(--text-3); }
.set textarea { resize: vertical; min-height: 44px; }

.main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.tools { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); flex-wrap: wrap; }
.search { position: relative; flex: 1; min-width: 200px; max-width: 460px; }
.search .input { width: 100%; padding-left: 32px; padding-right: 30px; height: 36px; border-radius: 10px; }
.search .ico { position: absolute; left: 11px; top: 50%; transform: translateY(-52%); color: var(--text-3); font-size: 17px; pointer-events: none; }
.search .x { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: var(--text-3); cursor: pointer; padding: 4px 6px; }
.count { margin-right: auto; }
.seg { display: inline-flex; background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 2px; }
.seg button { border: 0; background: transparent; color: var(--text-2); font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 7px; cursor: pointer; }
.seg button.on { background: var(--panel-2); color: var(--text); box-shadow: 0 0 0 1px var(--line-2); }

.grid { flex: 1; min-height: 0; overflow: auto; padding: 16px 18px 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--cw), 1fr)); gap: 14px; align-content: start; }
.card { --c: #f1e9dd; position: relative; background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 8px 8px 10px; display: grid; gap: 7px; cursor: pointer; outline: none; content-visibility: auto; contain-intrinsic-size: auto 280px; transition: transform .14s ease, border-color .14s, box-shadow .14s; }
.card:hover, .card:focus-visible { transform: translateY(-2px); border-color: color-mix(in srgb, var(--c) 55%, var(--line)); box-shadow: 0 10px 26px -12px color-mix(in srgb, var(--c) 45%, transparent); }
.card.sel { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 10px 26px -12px rgba(234, 122, 59, .5); }
.pv { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: var(--bg-2); }
.badge { position: absolute; left: 6px; bottom: 6px; font-size: 10.5px; padding: 1px 7px; border-radius: 999px; background: rgba(0, 0, 0, .55); color: #e9dfd0; font-variant-numeric: tabular-nums; pointer-events: none; }
.fav { position: absolute; right: 5px; top: 5px; width: 26px; height: 26px; border: 0; border-radius: 50%; background: rgba(0, 0, 0, .45); color: #9a8d7d; cursor: pointer; font-size: 14px; line-height: 1; opacity: 0; transition: opacity .12s, color .12s; }
.card:hover .fav, .fav.on, .card:focus-visible .fav { opacity: 1; }
.fav.on { color: #f2c14e; }
.play { position: absolute; right: 7px; bottom: 6px; font-size: 10px; color: #fff; opacity: .55; pointer-events: none; transition: opacity .12s; }
.card.hot .play { opacity: 0; }
.meta { display: grid; gap: 1px; padding: 0 2px; min-width: 0; }
.meta strong { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
code { font-family: var(--mono); font-size: 11px; color: var(--accent-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chips { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; gap: 6px; }
.chip { font-size: 10.5px; padding: 1px 8px; border-radius: 999px; background: var(--bg-2); border: 1px solid var(--line); font-weight: 600; letter-spacing: .02em; }
.tiny { font-size: 10.5px; }
.empty { grid-column: 1 / -1; padding: 40px 0; text-align: center; }

.detail { border-left: 1px solid var(--line); background: var(--bg-2); display: flex; flex-direction: column; min-height: 0; animation: slide .16s ease-out; }
@keyframes slide { from { transform: translateX(14px); opacity: 0; } to { transform: none; opacity: 1; } }
.detail header { display: flex; align-items: flex-start; gap: 4px; padding: 12px 14px 8px; }
.detail header strong { font-size: 15px; }
.big { margin: 0 14px; aspect-ratio: 1; border-radius: 14px; overflow: hidden; background: var(--bg); border: 1px solid var(--line); }
.player { padding: 10px 14px 4px; gap: 8px; }
.player .bar { flex: 1; accent-color: var(--accent); min-width: 0; }
.spd { width: 74px; height: 26px; padding: 0 4px; font-size: 12px; }
.body { flex: 1; min-height: 0; overflow: auto; padding: 8px 14px 18px; display: grid; gap: 14px; align-content: start; }
.params { display: grid; gap: 8px; }
.ph { align-items: center; }
.prm { display: grid; grid-template-columns: 1fr 120px; gap: 8px; align-items: center; }
.prm .input { height: 28px; }
.prm .color { padding: 1px; }
.code pre { margin: 6px 0; padding: 10px; background: var(--bg); border: 1px solid var(--line); border-radius: 10px; font: 11.5px/1.5 var(--mono); white-space: pre-wrap; word-break: break-all; color: #e6d9c6; max-height: 150px; overflow: auto; }
.keys { text-align: center; }
@media (max-width: 1100px) {
  .anim, .anim.withDetail { grid-template-columns: 200px minmax(0, 1fr); }
  .detail { position: fixed; right: 0; top: 56px; bottom: 0; width: min(392px, 92vw); z-index: 20; box-shadow: -18px 0 40px rgba(0, 0, 0, .45); }
}
@media (prefers-reduced-motion: reduce) {
  .card, .detail { transition: none; animation: none; }
}
</style>
