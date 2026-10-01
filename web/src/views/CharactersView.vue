<script setup>
// Karakterler sayfası: karakter setlerini (data/characters) oluştur, düzenle, aksiyon / duygu / konuşma ile önizle.
// Aksiyonlar ve duygular tüm karakterler için ortaktır (engine/characterData.js); burada yalnızca GÖRÜNÜM düzenlenir.
// Kaydedilen karakterler Stüdyo → ＋ Karakter menüsünde çıkar ve yapay zekâ üretim betiklerinde `karakter()` ile kullanılır.
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
import { api } from '../api.js';
import { resources, loadResources, reloadResources } from '../resources.js';
import { ACTIONS, ACTION_GROUPS, EMOTIONS, PROPS, BUBBLE_KINDS } from '../engine/characterData.js';
import { characterMetrics, mergeCharacter, CHARACTER_DEFAULTS } from '../engine/character.js';
import { slug } from '../slug.js';
import { toast, toastError } from '../toast.js';
import SceneThumb from '../components/SceneThumb.vue';
import ScenePlayer from '../components/ScenePlayer.vue';

const res = resources;
const FORMATS = { kare: [1080, 1080, 'Kare'], dikey: [1080, 1920, 'Dikey 9:16'], yatay: [1920, 1080, 'Yatay 16:9'] };
const clone = (v) => JSON.parse(JSON.stringify(v));

const q = ref('');
const selId = ref(null); // kayıtlı karakter id'si; null = yeni
const work = ref(null); // { name, description, etiketler: string, doc }
const dirty = ref(false);
const saving = ref(false);
const showNew = ref(false);
const player = ref(null);

// ---- önizleme durumu
const pv = ref({
  aksiyon: 'bekle', duygu: '', soz: 'Merhaba! Ben bir karakter setiyim.', tur: 'soyle', nesne: '', metin: 'YENİ!', varyant: '', ekler: [],
  yon: 1, format: 'kare', koyu: false, partner: '', golge: true,
});
const preview = shallowRef(null);
const charList = computed(() => [...res.value.characters.values()].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr')));
const list = computed(() => {
  const s = q.value.trim().toLocaleLowerCase('tr');
  if (!s) return charList.value;
  return charList.value.filter((c) => [c.id, c.name, c.description, ...(c.etiketler || [])].join(' ').toLocaleLowerCase('tr').includes(s));
});

onMounted(async () => {
  await loadResources();
  await reloadResources('characters');
  const first = charList.value[0];
  if (first) select(first);
});

// ------------------------------------------------------------ önizleme sahnesi
const WORK_ID = '__calisan';
function mkScene(doc, o, fmt = o.format, thumb = false) {
  const [W, H] = FORMATS[fmt];
  const id = WORK_ID;
  const layerBase = { varyant: o.varyant || undefined, ekler: o.ekler?.length ? [...o.ekler] : undefined };
  const C = mergeCharacter(doc, layerBase);
  const m = characterMetrics(C);
  const scale = Math.round(((H * (thumb ? 0.78 : 0.56)) / m.height) * 100) / 100;
  const clip = ACTIONS[o.aksiyon] || doc.aksiyonlar?.[o.aksiyon] || ACTIONS.bekle;
  const talking = !thumb && o.soz.trim();
  // süre: kısa klipler tekrarlanır
  const loco = !!clip.adim;
  const cycle = clip.dongu || loco ? 4 : clip.sure + 1.0;
  const count = clip.dongu || loco ? 1 : Math.max(1, Math.ceil(4 / cycle));
  const duration = Math.round(Math.max(4, cycle * count, talking ? 4.6 : 0) * 10) / 10;
  const tutar = o.nesne ? { nesne: o.nesne, metin: o.metin, el: 'R' } : undefined;
  const hasPartner = !thumb && o.partner && res.value.characters.has(o.partner);
  const x0 = hasPartner ? W * 0.3 : W / 2;
  const akis = [];
  if (loco) akis.push({ t: 0.1, aksiyon: o.aksiyon, duygu: o.duygu || undefined, dx: Math.round(W * 0.36) * (o.yon < 0 ? -1 : 1), sure: duration - 0.8, tutar, yon: o.yon });
  else for (let i = 0; i < count; i++) akis.push({ t: Math.round(i * cycle * 10) / 10, aksiyon: o.aksiyon, duygu: o.duygu || undefined, tutar, yon: i ? undefined : o.yon });
  const layer = {
    id, type: 'karakter', karakter: id, x: loco ? (o.yon < 0 ? W * 0.68 : W * 0.32) : x0, y: Math.round(H * 0.8), scale, yon: o.yon, ...layerBase, golge: o.golge,
    akis: thumb ? [{ t: 0, aksiyon: 'bekle', duygu: o.duygu }] : akis,
  };
  if (talking) layer.soz = [{ t: 0.4, sure: hasPartner ? Math.round((duration * 0.5 - 0.5) * 10) / 10 : duration - 0.6, metin: o.soz, tur: o.tur }];
  const layers = [layer];
  if (hasPartner) {
    layers.push({
      id: 'partner', type: 'karakter', karakter: o.partner, x: W * 0.7, y: Math.round(H * 0.8), scale, yon: -1,
      akis: [{ t: 0, aksiyon: 'dinle', bak: id }],
      soz: talking ? [{ t: Math.max(2.4, duration * 0.55), sure: 1.8, metin: 'Anladım, devam et!' }] : [],
    });
    layer.akis = layer.akis.map((a) => ({ ...a, bak: 'partner' }));
  }
  return {
    name: 'Önizleme', width: W, height: H, fps: 30, duration, theme: 'gun-isigi',
    background: o.koyu
      ? { type: 'linear', colors: ['#2b2b4a', '#14142b'], angle: 180, paper: 0.2, vignette: 0.2 }
      : { type: 'linear', colors: ['#fdf0dc', '#f6c9a0'], angle: 180, paper: 0.4, vignette: 0.15 },
    camera: { zoom: 1 }, layers,
  };
}
// ---- galeri: her aksiyon / duygu için tek kare küçük resim
const gallery = ref('aksiyon'); // 'aksiyon' | 'duygu' | ''
function galScene(doc, aksiyon, duygu, face) {
  const W = 1080;
  const H = 1080;
  const m = characterMetrics(mergeCharacter(doc, {}));
  const scale = (H * 0.64) / m.height;
  const y = H * 0.88;
  const tutar = ACTIONS[aksiyon]?.tutar ? { nesne: ACTIONS[aksiyon].tutar, metin: 'Yeni!' } : undefined;
  return {
    name: 'g', width: W, height: H, fps: 30, duration: 3, theme: 'gun-isigi',
    background: { type: 'solid', color: '#fbf1e2' },
    camera: face ? { zoom: 2.9, x: W / 2, y: y - m.height * scale * 0.84 } : { zoom: 1 },
    layers: [{ id: WORK_ID, type: 'karakter', karakter: WORK_ID, x: W / 2, y, scale, akis: [{ t: 0, aksiyon, duygu, tutar }] }],
  };
}
const galTime = (a) => {
  const c = ACTIONS[a] || work.value?.doc.aksiyonlar?.[a];
  return c ? (c.onizleme ?? (c.dongu ? 0.25 : 0.55)) * (c.sure || 1) : 0.5;
};
const galActions = computed(() => (work.value ? actionGroups.value.flatMap(([, items]) => items) : []));
const galScenes = computed(() => (work.value ? Object.fromEntries([
  ...galActions.value.map(([k]) => [`a:${k}`, galScene(work.value.doc, k, pv.value.duygu && pv.value.duygu !== 'notr' ? pv.value.duygu : 'mutlu', false)]),
  ...emoList.map(([k]) => [`e:${k}`, galScene(work.value.doc, 'bekle', k, true)]),
]) : {}));
const previewRes = computed(() => {
  const m = new Map(res.value.characters);
  if (work.value) m.set(WORK_ID, work.value.doc);
  return { ...res.value, characters: m };
});
const thumbRes = (c) => ({ ...res.value, characters: new Map([...res.value.characters, [WORK_ID, c]]) });
const thumbScene = (c) => mkScene(c, { ...pv.value, aksiyon: 'bekle', duygu: 'mutlu', varyant: '', ekler: [], nesne: '', soz: '', partner: '', yon: 1, koyu: false, format: 'kare' }, 'kare', true);
let timer = 0;
function refresh() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (!work.value) return;
    preview.value = mkScene(work.value.doc, pv.value);
    await nextTick();
    player.value?.seek(0);
    player.value?.play();
  }, 120);
}
function setPv(patch) {
  pv.value = { ...pv.value, ...patch };
  refresh();
}
function edit(fn) {
  fn();
  dirty.value = true;
  refresh();
}

// ------------------------------------------------------------------ seçim
const guard = () => !dirty.value || confirm('Kaydedilmemiş değişiklikler var. Devam edilsin mi?');
function open(w, id) {
  work.value = w;
  selId.value = id;
  dirty.value = false;
  pv.value = { ...pv.value, varyant: '', ekler: [] };
  preview.value = mkScene(w.doc, pv.value);
  nextTick(() => player.value?.play());
}
function select(c) {
  if (c.id !== selId.value && !guard()) return;
  const { id: _i, name, description, etiketler, ...doc } = clone(c);
  open({ name: name || c.id, description: description || '', etiketler: (etiketler || []).join(', '), doc: { ...doc } }, c.id);
}
function create(from) {
  if (!guard()) return;
  showNew.value = false;
  const base = from ? clone(from) : { ...clone(CHARACTER_DEFAULTS), ekler: clone(res.value.characters.get('copadam')?.ekler || []) };
  delete base.id;
  const { name, description, etiketler, ...doc } = base;
  open({ name: from ? `${name || from.id} (yeni)` : 'Yeni karakter', description: description || '', etiketler: (etiketler || []).join(', '), doc }, null);
  dirty.value = true;
}

// ------------------------------------------------------------------ alan düzenleme
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v) {
  const ks = p.split('.');
  let cur = o;
  ks.slice(0, -1).forEach((k, i) => {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    cur = cur[k];
  });
  const last = ks[ks.length - 1];
  if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete cur[last];
  else cur[last] = v;
}
const eff = (p) => getPath(work.value.doc, p) ?? getPath(CHARACTER_DEFAULTS, p) ?? '';
function setField(p, v) {
  edit(() => setPath(work.value.doc, p, v));
}
const NUM = [
  ['Oranlar', [
    ['olcu.bas.0', 'Baş genişliği', 30, 100, 1], ['olcu.bas.1', 'Baş yüksekliği', 30, 100, 1],
    ['olcu.govde.0', 'Gövde genişliği', 40, 140, 1], ['olcu.govde.1', 'Gövde yüksekliği', 50, 200, 1],
    ['olcu.kolUst', 'Üst kol', 20, 90, 1], ['olcu.kolAlt', 'Alt kol', 20, 90, 1],
    ['olcu.bacakUst', 'Üst bacak', 20, 90, 1], ['olcu.bacakAlt', 'Alt bacak', 20, 90, 1],
    ['olcu.boyun', 'Boyun', 0, 30, 1], ['olcu.el', 'El boyu', 6, 24, 1], ['boy', 'Genel boy', 0.5, 2, 0.05],
  ]],
  ['Çizgi', [['cizgi.kalinlik', 'Kalınlık', 1, 10, 0.5], ['cizgi.titrek', 'Titreme (el çizimi)', 0, 4, 0.1], ['cizgi.kaynama', 'Kaynama aralığı (sn)', 0, 0.5, 0.01], ['uzuv.kalinlik', 'Uzuv kalınlığı', 3, 20, 1]]],
  ['Yüz', [['yuz.boyut', 'Göz boyutu', 0.5, 2, 0.05], ['yuz.aralik', 'Göz aralığı', 0.5, 1.4, 0.05], ['yuz.yukseklik', 'Yüz yüksekliği', -0.3, 0.3, 0.01], ['yuz.agizGen', 'Ağız genişliği', 0.4, 1.6, 0.05]]],
];
const SEL = [
  ['govde.sekil', 'Gövde', ['dikdortgen', 'elbise', 'yumurta', 'kapsul', 'kutu']],
  ['govde.detay', 'Gövde detayı', ['', 'panel', 'dugme']],
  ['kafa.sekil', 'Kafa', ['daire', 'yumurta', 'kutu', 'yumusak-kare']],
  ['uzuv.tur', 'Uzuv', ['cubuk', 'tup']],
  ['uzuv.el', 'El', ['parmak', 'top', 'eldiven', 'yok']],
  ['uzuv.ayak', 'Ayak', ['oval', 'ayakkabi', 'bot', 'yok']],
  ['yuz.goz', 'Göz', ['nokta', 'buyuk', 'oval', 'ekran']],
  ['yuz.burun', 'Burun', ['', 'top', 'cizgi', 'nokta']],
];
const COLORS = [
  ['cizgi.renk', 'Kontur'], ['renkler.kafa', 'Kafa'], ['renkler.govde', 'Gövde'], ['renkler.kol', 'Kollar'], ['renkler.bacak', 'Bacaklar'], ['renkler.el', 'Eller'],
  ['renkler.ayak', 'Ayaklar'], ['renkler.sac', 'Saç'], ['renkler.goz', 'Göz'], ['renkler.agiz', 'Ağız içi'], ['renkler.yanak', 'Yanak'],
];
const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
const colorVal = (p) => getPath(work.value.doc, p) ?? '';
const varJson = computed(() => JSON.stringify(work.value?.doc.varyantlar || {}, null, 2));
function setVariants(text) {
  try {
    const v = JSON.parse(text || '{}');
    edit(() => (work.value.doc.varyantlar = v));
  } catch {
    toast('Varyant JSON geçersiz', 'warn');
  }
}
const advJson = ref(false);
const docJson = computed(() => JSON.stringify(work.value?.doc || {}, null, 2));
function setDocJson(text) {
  try {
    const v = JSON.parse(text);
    edit(() => (work.value.doc = v));
  } catch {
    toast('JSON geçersiz', 'warn');
  }
}
const ekList = computed(() => work.value?.doc.ekler || []);
function toggleEkDefault(e) {
  edit(() => {
    if (e.varsayilan === false) delete e.varsayilan;
    else e.varsayilan = false;
  });
}
const variantNames = computed(() => Object.keys(work.value?.doc.varyantlar || {}));
function togglePvEk(id) {
  const a = new Set(pv.value.ekler);
  if (a.has(id)) a.delete(id);
  else a.add(id);
  setPv({ ekler: [...a] });
}

// ------------------------------------------------------------------ kaydet / sil
const payload = () => ({
  name: work.value.name.trim() || 'Adsız karakter',
  description: work.value.description.trim(),
  etiketler: work.value.etiketler.split(/[,\n]/).map((x) => x.trim()).filter(Boolean),
  ...clone(work.value.doc),
});
async function save() {
  saving.value = true;
  try {
    const doc = payload();
    if (selId.value) await api.colUpdate('characters', selId.value, doc);
    else {
      let id = slug(doc.name);
      const taken = new Set(charList.value.map((c) => c.id));
      for (let i = 2; taken.has(id); i++) id = `${slug(doc.name)}-${i}`;
      await api.colCreate('characters', { id, ...doc });
      selId.value = id;
    }
    await reloadResources('characters');
    dirty.value = false;
    toast('Karakter kaydedildi', 'ok');
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
  const taken = new Set(charList.value.map((c) => c.id));
  for (let i = 2; taken.has(id); i++) id = `${slug(doc.name)}-${i}`;
  try {
    await api.colCreate('characters', { id, ...doc });
    await reloadResources('characters');
    dirty.value = false;
    const c = res.value.characters.get(id);
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
  if (!confirm(`"${work.value.name}" karakteri silinsin mi? Bu karakteri kullanan katmanlar kırmızı kutu gösterir.`)) return;
  try {
    await api.colDelete('characters', selId.value);
    await reloadResources('characters');
    dirty.value = false;
    selId.value = null;
    work.value = null;
    preview.value = null;
    const first = charList.value[0];
    if (first) select(first);
  } catch (e) {
    toastError(e);
  }
}
const propNames = Object.entries(PROPS);
const emoList = Object.entries(EMOTIONS);
// Çip kirliliğini azalt: her grupta ilk birkaç çip (+ seçili olan) görünür, "+N daha" ile hepsi açılır.
const CHIP_LIMIT = 6;
const expanded = ref({});
function shownChips(key, entries, isOn) {
  if (expanded.value[key]) return { items: entries, hidden: 0 };
  const items = entries.filter(([k], i) => i < CHIP_LIMIT || isOn(k));
  return { items, hidden: entries.length - items.length };
}
const actionGroups = computed(() => {
  const custom = Object.entries(work.value?.doc.aksiyonlar || {}).map(([k, v]) => [k, { ...v, grup: v.grup || 'ozel' }]);
  const all = [...Object.entries(ACTIONS), ...custom];
  return [...ACTION_GROUPS, ['ozel', 'Bu karaktere özel']].map(([g, label]) => [label, all.filter(([, a]) => (a.grup || 'iletisim') === g)]).filter(([, a]) => a.length);
});
</script>

<template>
  <div class="cv">
    <aside class="list">
      <div class="lh">
        <div class="row">
          <h1 class="grow">Karakterler</h1>
          <button class="btn sm primary" @click="showNew = !showNew">＋ Yeni</button>
        </div>
        <p class="dim small">Konuşan, yürüyen, tepki veren karakter setleri. Hareketler (aksiyon) ve yüz ifadeleri (duygu) tüm karakterler için ortaktır; sen yalnızca görünümü tasarlarsın.</p>
        <div v-if="showNew" class="newbox">
          <button class="nt" @click="create(null)"><span class="ic">✨</span><span><strong>Boş karakter</strong><br /><span class="dim small">Varsayılan çöp adam ölçüleriyle başla</span></span></button>
          <button v-for="c in charList" :key="c.id" class="nt" @click="create(c)"><span class="ic">⧉</span><span><strong>{{ c.name || c.id }} kopyası</strong></span></button>
        </div>
        <input v-model="q" class="input" placeholder="Ara: ad, etiket (ör. robot, kedi, çocuk)" @keydown.stop />
      </div>
      <button v-for="c in list" :key="c.id" class="item" :class="{ on: c.id === selId }" @click="select(c)">
        <div class="th"><SceneThumb :scene="thumbScene(c)" :res="thumbRes(c)" :t="0.8" :width="64" /></div>
        <div class="tx">
          <strong>{{ c.name || c.id }}</strong>
          <span class="dim small clamp">{{ c.description }}</span>
        </div>
      </button>
      <p v-if="!list.length" class="dim small pad">Karakter yok. <code>npm run seed:karakter</code> ile başlangıç setlerini yükle.</p>
    </aside>

    <section class="preview">
      <template v-if="work">
        <div class="ph row">
          <div class="grow">
            <strong>{{ work.name }}</strong>
            <span v-if="dirty" class="chip warn">kaydedilmedi</span>
            <span class="chip">id: {{ selId || '(yeni)' }}</span>
          </div>
          <label class="row small dim"><input type="checkbox" :checked="pv.koyu" @change="setPv({ koyu: $event.target.checked })" /> koyu zemin</label>
          <div class="seg">
            <button v-for="(f, k) in FORMATS" :key="k" :class="{ on: pv.format === k }" @click="setPv({ format: k })">{{ f[2] }}</button>
          </div>
        </div>
        <ScenePlayer v-if="preview" ref="player" :scene="preview" :res="previewRes" />

        <div class="ctl">
          <div class="grp">
            <span class="gl">Aksiyon <span class="dim">· {{ ACTIONS[pv.aksiyon]?.aciklama || work.doc.aksiyonlar?.[pv.aksiyon]?.aciklama }}</span></span>
            <div v-for="[label, items] in actionGroups" :key="label" class="chips">
              <span class="cl dim">{{ label }}</span>
              <button v-for="[k, a] in shownChips('a:' + label, items, (x) => pv.aksiyon === x).items" :key="k" class="chip" :class="{ on: pv.aksiyon === k }" :title="a.aciklama" @click="setPv({ aksiyon: k })">{{ a.ad || k }}</button>
              <button v-if="shownChips('a:' + label, items, (x) => pv.aksiyon === x).hidden" class="chip more" @click="expanded['a:' + label] = true">+{{ shownChips('a:' + label, items, (x) => pv.aksiyon === x).hidden }} daha</button>
              <button v-else-if="expanded['a:' + label]" class="chip more" @click="expanded['a:' + label] = false">daha az</button>
            </div>
          </div>
          <div class="grp">
            <span class="gl">Duygu <span class="dim">· {{ EMOTIONS[pv.duygu]?.aciklama }}</span></span>
            <div class="chips">
              <button v-for="[k, e] in shownChips('duygu', emoList, (x) => pv.duygu === x).items" :key="k" class="chip" :class="{ on: pv.duygu === k }" :title="e.aciklama" @click="setPv({ duygu: k })">{{ e.ad }}</button>
              <button v-if="shownChips('duygu', emoList, (x) => pv.duygu === x).hidden" class="chip more" @click="expanded.duygu = true">+{{ shownChips('duygu', emoList, (x) => pv.duygu === x).hidden }} daha</button>
              <button v-else-if="expanded.duygu" class="chip more" @click="expanded.duygu = false">daha az</button>
            </div>
          </div>
          <div class="grp row2">
            <label>Konuşma
              <input v-model="pv.soz" class="input" placeholder="Boş bırakırsan konuşmaz" @input="setPv({})" @keydown.stop />
            </label>
            <label>Balon
              <select class="input" :value="pv.tur" @change="setPv({ tur: $event.target.value })">
                <option v-for="(n, k) in BUBBLE_KINDS" :key="k" :value="k">{{ n }}</option>
              </select>
            </label>
            <label>Elinde tuttuğu
              <select class="input" :value="pv.nesne" @change="setPv({ nesne: $event.target.value })">
                <option value="">(yok)</option>
                <option v-for="[k, p] in propNames" :key="k" :value="k">{{ p.ad }}</option>
              </select>
            </label>
            <label v-if="pv.nesne === 'tabela'">Tabela yazısı
              <input v-model="pv.metin" class="input" @input="setPv({})" @keydown.stop />
            </label>
            <label>Karşısında (diyalog)
              <select class="input" :value="pv.partner" @change="setPv({ partner: $event.target.value })">
                <option value="">(yalnız)</option>
                <option v-for="c in charList" :key="c.id" :value="c.id">{{ c.name || c.id }}</option>
              </select>
            </label>
            <label>Yön
              <select class="input" :value="pv.yon" @change="setPv({ yon: Number($event.target.value) })">
                <option :value="1">Sağa bakar</option>
                <option :value="-1">Sola bakar</option>
              </select>
            </label>
          </div>
          <div v-if="variantNames.length || ekList.length" class="grp">
            <span class="gl">Varyant ve aksesuar önizlemesi <span class="dim">· katmanda <code>varyant</code> / <code>ekler</code> ile seçilir</span></span>
            <div class="chips">
              <button class="chip" :class="{ on: !pv.varyant }" @click="setPv({ varyant: '' })">varsayılan</button>
              <button v-for="v in variantNames" :key="v" class="chip" :class="{ on: pv.varyant === v }" @click="setPv({ varyant: v })">{{ v }}</button>
            </div>
            <div class="chips">
              <button v-for="e in ekList" :key="e.id" class="chip" :class="{ on: pv.ekler.includes(e.id) }" @click="togglePvEk(e.id)">{{ e.ad || e.id }}</button>
            </div>
          </div>
        </div>
        <div class="gal">
          <div class="row">
            <button class="chip" :class="{ on: gallery === 'aksiyon' }" @click="gallery = gallery === 'aksiyon' ? '' : 'aksiyon'">Aksiyon galerisi ({{ galActions.length }})</button>
            <button class="chip" :class="{ on: gallery === 'duygu' }" @click="gallery = gallery === 'duygu' ? '' : 'duygu'">Duygu galerisi ({{ emoList.length }})</button>
          </div>
          <div v-if="gallery === 'aksiyon'" class="gg">
            <button v-for="[k, a] in galActions" :key="k" class="gc" :class="{ on: pv.aksiyon === k }" :title="a.aciklama" @click="setPv({ aksiyon: k })">
              <SceneThumb :scene="galScenes['a:' + k]" :res="previewRes" :t="galTime(k)" :width="118" />
              <span>{{ a.ad || k }}</span>
            </button>
          </div>
          <div v-if="gallery === 'duygu'" class="gg">
            <button v-for="[k, e] in emoList" :key="k" class="gc" :class="{ on: pv.duygu === k }" :title="e.aciklama" @click="setPv({ duygu: k })">
              <SceneThumb :scene="galScenes['e:' + k]" :res="previewRes" :t="0.4" :width="118" />
              <span>{{ e.ad }}</span>
            </button>
          </div>
        </div>
      </template>
      <div v-else class="empty dim">
        <p>Soldan bir karakter seç ya da <strong>＋ Yeni</strong> ile oluştur.</p>
      </div>
    </section>

    <aside v-if="work" class="edit">
      <div class="eb" @keydown.stop>
        <div class="field">
          <label>Ad</label>
          <input v-model="work.name" class="input" @input="dirty = true" />
        </div>
        <div class="field">
          <label>Açıklama (yapay zekâ bunu okuyarak seçer)</label>
          <textarea v-model="work.description" class="input" rows="3" placeholder="Nasıl bir karakter, hangi videolara uyar?" @input="dirty = true" />
        </div>
        <div class="field">
          <label>Etiketler (virgülle)</label>
          <input v-model="work.etiketler" class="input" placeholder="robot, teknoloji, sevimli…" @input="dirty = true" />
        </div>

        <div v-for="[title, fields] in NUM" :key="title" class="sec">
          <div class="sec-title">{{ title }}</div>
          <div v-for="f in fields" :key="f[0]" class="rng">
            <label>{{ f[1] }}</label>
            <input type="range" :min="f[2]" :max="f[3]" :step="f[4]" :value="eff(f[0])" @input="setField(f[0], Number($event.target.value))" />
            <span class="mono small">{{ eff(f[0]) }}</span>
          </div>
        </div>

        <div class="sec">
          <div class="sec-title">Biçim</div>
          <div v-for="s in SEL" :key="s[0]" class="field inl">
            <label>{{ s[1] }}</label>
            <select class="input" :value="getPath(work.doc, s[0]) ?? ''" @change="setField(s[0], $event.target.value)">
              <option v-for="o in s[2]" :key="o" :value="o">{{ o || '(yok)' }}</option>
            </select>
          </div>
        </div>

        <div class="sec">
          <div class="sec-title">Renkler <span class="dim small">· $vurgu gibi tema renkleri de olur</span></div>
          <div v-for="c in COLORS" :key="c[0]" class="field inl">
            <label>{{ c[1] }}</label>
            <div class="row">
              <input v-if="isHex(colorVal(c[0]))" type="color" class="input color" :value="colorVal(c[0])" @input="setField(c[0], $event.target.value)" />
              <input class="input mono grow" :value="colorVal(c[0])" placeholder="(gövde rengi)" @change="setField(c[0], $event.target.value.trim())" />
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-title">Aksesuarlar <span class="dim small">· işaretliler varsayılan olarak takılıdır</span></div>
          <label v-for="e in ekList" :key="e.id" class="row chk">
            <input type="checkbox" :checked="e.varsayilan !== false" @change="toggleEkDefault(e)" /> {{ e.ad || e.id }} <span class="dim small mono">{{ e.id }}</span>
          </label>
        </div>

        <div class="sec">
          <div class="sec-title">Varyantlar (JSON)</div>
          <textarea class="input mono" rows="7" spellcheck="false" :value="varJson" @change="setVariants($event.target.value)" />
          <p class="dim small">Her varyant: <code>{ renkler, govde, cizgi, ekAc: [id], ekKapat: [id] }</code>. Katmanda <code>varyant: "ad"</code>.</p>
        </div>

        <button class="btn sm" @click="advJson = !advJson">{{ advJson ? '▾' : '▸' }} Gelişmiş: tüm JSON</button>
        <textarea v-if="advJson" class="input mono" rows="16" spellcheck="false" :value="docJson" @change="setDocJson($event.target.value)" />
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
.cv { display: grid; grid-template-columns: 290px minmax(380px, 1fr) 380px; height: calc(100vh - 56px); min-height: 0; }
.list { border-right: 1px solid var(--line); overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.lh { display: grid; gap: 8px; }
.lh h1 { margin: 0; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 22px; }
.lh p { margin: 0; }
.newbox { display: grid; gap: 6px; }
.nt { display: flex; gap: 10px; align-items: center; text-align: left; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); color: inherit; cursor: pointer; }
.nt:hover { border-color: var(--accent); }
.ic { font-size: 20px; }
.item { display: grid; grid-template-columns: 64px 1fr; gap: 10px; text-align: left; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); color: inherit; cursor: pointer; align-items: center; }
.item:hover { border-color: var(--line-2); }
.item.on { border-color: var(--accent); background: #2d2118; }
.th { min-height: 64px; display: grid; place-items: center; background: var(--bg-2); border-radius: 6px; overflow: hidden; }
.tx { display: grid; gap: 2px; min-width: 0; }
.clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.preview { padding: 14px 18px; overflow: auto; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ph { gap: 8px; flex-wrap: wrap; }
.seg { display: flex; gap: 4px; }
.seg button { padding: 4px 8px; border: 1px solid var(--line); background: transparent; color: var(--text-2); border-radius: 8px; cursor: pointer; font: inherit; font-size: 12px; }
.seg button.on { border-color: var(--accent); color: var(--text); background: #2d2118; }
.ctl { display: grid; gap: 12px; }
.grp { display: grid; gap: 6px; }
.gl { font-weight: 600; font-size: 13px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.cl { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; width: 74px; }
.chips .chip { cursor: pointer; background: transparent; color: inherit; font: inherit; font-size: 12px; }
.chips .chip.on { border-color: var(--accent); background: #2d2118; }
.chips .chip.more { border-style: dashed; color: var(--accent); }
.chips .chip:hover { border-color: var(--line-2); }
.row2 { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); align-items: end; }
.row2 label { display: grid; gap: 3px; font-size: 12px; color: var(--text-2); }
.gal { display: grid; gap: 8px; }
.gg { display: grid; grid-template-columns: repeat(auto-fill, minmax(122px, 1fr)); gap: 6px; }
.gc { display: grid; gap: 2px; justify-items: center; padding: 4px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); color: inherit; cursor: pointer; font: inherit; font-size: 11px; }
.gc:hover { border-color: var(--line-2); }
.gc.on { border-color: var(--accent); background: #2d2118; }
.edit { border-left: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; min-height: 0; }
.eb { flex: 1; overflow: auto; padding: 12px; min-height: 0; display: grid; gap: 12px; align-content: start; }
.sec { display: grid; gap: 6px; }
.sec-title { font-weight: 600; }
.rng { display: grid; grid-template-columns: 120px 1fr 44px; gap: 6px; align-items: center; font-size: 12px; }
.rng label { color: var(--text-2); }
.inl { grid-template-columns: 110px 1fr; align-items: center; display: grid; gap: 6px; }
.chk { gap: 6px; font-size: 13px; }
.edit footer { padding: 10px 12px; border-top: 1px solid var(--line); gap: 8px; }
.empty { display: grid; place-items: center; height: 60%; text-align: center; }
.pad { padding: 12px; }
textarea.input { resize: vertical; }
</style>
