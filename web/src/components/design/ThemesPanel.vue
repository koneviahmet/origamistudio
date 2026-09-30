<script setup>
import { computed, ref } from 'vue';
import { api } from '../../api.js';
import { resources, reloadResources } from '../../resources.js';
import { toast, toastError } from '../../toast.js';
import { clone } from '../../sceneOps.js';
import { PAPERS, ROLES, ROLE_LABELS } from '../../engine/theme.js';
import { STYLES } from '../../engine/styles.js';
import { themeDemoScene } from './previews.js';
import RenderBox from './RenderBox.vue';

const draft = ref(null);
const origId = ref(null);
const dirty = ref(false);
const previewStyle = ref('origami');
const themes = computed(() => [...resources.value.themes.values()]);

const STD_COLORS = ['arka1', 'arka2', 'baslik', 'metin', 'vurgu'];
const COLOR_LABELS = { arka1: 'Arka plan 1', arka2: 'Arka plan 2', baslik: 'Başlık', metin: 'Metin', vurgu: 'Vurgu' };

function open(th) {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = normalize(clone(th));
  origId.value = th.id;
  dirty.value = false;
}
function normalize(d) {
  d.adjust ||= {};
  d.colors ||= {};
  d.roles ||= {};
  d.palette ||= [];
  return d;
}
function create() {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = normalize({
    id: 'yeni-tema',
    name: 'Yeni Tema',
    paper: 'mat',
    adjust: {},
    colors: { arka1: '#fdf0dc', arka2: '#f6c9a0', baslik: '#5b3a29', metin: '#8a5a3b', vurgu: '#e76f51' },
    background: { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180 },
  });
  origId.value = null;
  dirty.value = true;
}
const touch = () => (dirty.value = true);

// Kaydederken boş alanları temizle
function cleaned() {
  const d = clone(draft.value);
  for (const k of ['adjust', 'colors', 'roles']) if (!Object.keys(d[k] || {}).length) delete d[k];
  if (!d.palette?.length) {
    delete d.palette;
    delete d.paletteStrength;
  }
  return d;
}
async function save() {
  try {
    const d = cleaned();
    const saved = origId.value ? await api.colUpdate('themes', origId.value, d) : await api.colCreate('themes', d);
    origId.value = saved.id;
    draft.value = normalize(clone(saved));
    dirty.value = false;
    await reloadResources('themes');
    toast('Tema kaydedildi', 'ok');
  } catch (e) {
    toastError(e);
  }
}
async function duplicate() {
  const d = cleaned();
  d.id = `${d.id}-kopya`;
  d.name = `${d.name} (kopya)`;
  try {
    const saved = await api.colCreate('themes', d);
    await reloadResources('themes');
    dirty.value = false;
    open(saved);
  } catch (e) {
    toastError(e);
  }
}
async function remove() {
  if (!origId.value) return (draft.value = null);
  if (!confirm(`"${draft.value.name}" teması silinsin mi? Bu temayı kullanan projeler temasız görünür.`)) return;
  try {
    await api.colDelete('themes', origId.value);
    await reloadResources('themes');
    draft.value = null;
    dirty.value = false;
  } catch (e) {
    toastError(e);
  }
}

function setAdj(k, v) {
  const n = Number(v);
  const neutral = { hue: 0, saturation: 1, brightness: 0, warmth: 0, contrast: 1 }[k];
  if (Math.abs(n - neutral) < 1e-6) delete draft.value.adjust[k];
  else draft.value.adjust[k] = n;
  touch();
}
const adj = (k, def) => draft.value.adjust[k] ?? def;
function toggleRole(r, on) {
  if (on) draft.value.roles[r] = draft.value.colors.vurgu || '#e76f51';
  else delete draft.value.roles[r];
  touch();
}
function addColorKey() {
  const k = prompt('Renk anahtarı (ör. ikincil, golge):');
  if (!k) return;
  draft.value.colors[k.trim()] = '#888888';
  touch();
}
const colorKeys = computed(() => [...new Set([...STD_COLORS, ...Object.keys(draft.value?.colors || {})])]);

// Arka plan renkleri "$anahtar" ya da doğrudan renk olabilir
function bgEnsure() {
  draft.value.background ||= { type: 'linear', colors: ['$arka1', '$arka2'], angle: 180 };
  return draft.value.background;
}
function setBgColor(i, v) {
  bgEnsure().colors[i] = v;
  touch();
}
const refColor = (v) => (typeof v === 'string' && v[0] === '$' ? draft.value.colors[v.slice(1)] || '#888888' : v);

const previewScene = computed(() => (draft.value ? themeDemoScene(clone(draft.value), previewStyle.value, resources.value.assets) : null));
const cardScene = (th) => themeDemoScene(th, 'origami', resources.value.assets);
</script>

<template>
  <div class="themes">
    <div class="list">
      <button class="btn primary" @click="create">＋ Yeni tema</button>
      <button v-for="th in themes" :key="th.id" class="card" :class="{ on: origId === th.id }" @click="open(th)">
        <div class="thumb"><RenderBox :scene="cardScene(th)" :res="resources" /></div>
        <div class="meta">
          <strong>{{ th.name }}</strong>
          <span class="dim small">{{ PAPERS[th.paper]?.label || 'Mat kağıt' }}</span>
          <div class="sw">
            <span v-for="k in STD_COLORS" :key="k" :style="{ background: th.colors?.[k] || 'transparent' }" />
          </div>
        </div>
      </button>
    </div>

    <div v-if="draft" class="editor">
      <div class="head row">
        <input v-model="draft.name" class="input title" @input="touch" />
        <input v-model="draft.id" class="input mono idf" title="id" @input="touch" />
        <span v-if="dirty" class="chip warn">kaydedilmedi</span>
        <div class="grow" />
        <button class="btn primary" @click="save">Kaydet</button>
        <button class="btn" :disabled="!origId" @click="duplicate">Çoğalt</button>
        <button class="btn danger" @click="remove">Sil</button>
      </div>

      <div class="body">
        <div class="preview">
          <RenderBox :scene="previewScene" :res="resources" />
          <select v-model="previewStyle" class="input">
            <option v-for="(st, k) in STYLES" :key="k" :value="k">Önizleme stili: {{ st.label }}</option>
          </select>
        </div>

        <div class="form">
          <section>
            <div class="sec-title">Kağıt</div>
            <div class="papers">
              <label v-for="(p, k) in PAPERS" :key="k" class="paper" :class="{ on: (draft.paper || 'mat') === k }">
                <input v-model="draft.paper" type="radio" :value="k" @change="touch" />
                <span class="pv" :style="{ background: p.back }" />{{ p.label }}
              </label>
            </div>
          </section>

          <section>
            <div class="sec-title">Renk ayarı <span class="dim small">(bütün modellere uygulanır)</span></div>
            <div class="sl"><label>Ton kaydır {{ adj('hue', 0) }}°</label><input type="range" min="-180" max="180" step="1" :value="adj('hue', 0)" @input="setAdj('hue', $event.target.value)" /></div>
            <div class="sl"><label>Doygunluk ×{{ adj('saturation', 1).toFixed(2) }}</label><input type="range" min="0" max="2" step="0.05" :value="adj('saturation', 1)" @input="setAdj('saturation', $event.target.value)" /></div>
            <div class="sl"><label>Parlaklık {{ adj('brightness', 0).toFixed(2) }}</label><input type="range" min="-0.5" max="0.5" step="0.02" :value="adj('brightness', 0)" @input="setAdj('brightness', $event.target.value)" /></div>
            <div class="sl"><label>Sıcaklık {{ adj('warmth', 0).toFixed(2) }}</label><input type="range" min="-1" max="1" step="0.05" :value="adj('warmth', 0)" @input="setAdj('warmth', $event.target.value)" /></div>
            <div class="sl"><label>Kontrast ×{{ adj('contrast', 1).toFixed(2) }}</label><input type="range" min="0.5" max="1.6" step="0.05" :value="adj('contrast', 1)" @input="setAdj('contrast', $event.target.value)" /></div>
          </section>

          <section>
            <div class="sec-title">Sınırlı palet <span class="dim small">(her renk en yakın palet rengine çekilir)</span></div>
            <div class="row wrap">
              <div v-for="(c, i) in draft.palette" :key="i" class="pc">
                <input type="color" class="input" :value="c" @input="draft.palette[i] = $event.target.value; touch()" />
                <button class="btn icon sm ghost" @click="draft.palette.splice(i, 1); touch()">✕</button>
              </div>
              <button class="btn sm" @click="draft.palette.push(draft.palette.at(-1) || '#888888'); touch()">＋</button>
            </div>
            <div v-if="draft.palette.length" class="sl">
              <label>Güç {{ (draft.paletteStrength ?? 1).toFixed(2) }}</label>
              <input type="range" min="0" max="1" step="0.05" :value="draft.paletteStrength ?? 1" @input="draft.paletteStrength = Number($event.target.value); touch()" />
            </div>
          </section>

          <section>
            <div class="sec-title">Rol renkleri <span class="dim small">(bu roldeki tüm renkler buna döner — marka rengi)</span></div>
            <div class="roles">
              <label v-for="r in ROLES" :key="r" class="row small">
                <input type="checkbox" :checked="!!draft.roles[r]" @change="toggleRole(r, $event.target.checked)" />
                <span class="grow">{{ ROLE_LABELS[r] }}</span>
                <input v-if="draft.roles[r]" type="color" class="input" :value="refColor(draft.roles[r])" @input="draft.roles[r] = $event.target.value; touch()" />
              </label>
            </div>
          </section>

          <section>
            <div class="row"><span class="sec-title grow">Tema renkleri <span class="dim small">($anahtar ile kullanılır)</span></span><button class="btn sm" @click="addColorKey">＋</button></div>
            <div class="colors">
              <label v-for="k in colorKeys" :key="k" class="row small">
                <input type="color" class="input" :value="draft.colors[k] || '#888888'" @input="draft.colors[k] = $event.target.value; touch()" />
                <span class="grow">{{ COLOR_LABELS[k] || k }}</span>
                <code>${{ k }}</code>
              </label>
            </div>
          </section>

          <section>
            <div class="sec-title">Arka plan</div>
            <div class="row">
              <select class="input" :value="draft.background?.type || 'linear'" @change="bgEnsure().type = $event.target.value; touch()">
                <option value="solid">Düz</option>
                <option value="linear">Doğrusal degrade</option>
                <option value="radial">Dairesel degrade</option>
              </select>
            </div>
            <div v-if="(draft.background?.type || 'linear') === 'solid'" class="row">
              <select class="input" :value="draft.background?.color || '$arka1'" @change="bgEnsure().color = $event.target.value; touch()">
                <option v-for="k in colorKeys" :key="k" :value="`$${k}`">${{ k }}</option>
              </select>
            </div>
            <div v-else class="row wrap">
              <select v-for="(c, i) in draft.background?.colors || []" :key="i" class="input bgc" :value="c" @change="setBgColor(i, $event.target.value)">
                <option v-for="k in colorKeys" :key="k" :value="`$${k}`">${{ k }}</option>
                <option v-if="c[0] !== '$'" :value="c">{{ c }}</option>
              </select>
              <button class="btn sm" @click="bgEnsure().colors.push('$arka2'); touch()">＋</button>
              <button v-if="(draft.background?.colors || []).length > 2" class="btn sm" @click="draft.background.colors.pop(); touch()">−</button>
            </div>
            <div class="sl">
              <label>Vinyet {{ (draft.vignette ?? 0.2).toFixed(2) }}</label>
              <input type="range" min="0" max="0.8" step="0.02" :value="draft.vignette ?? 0.2" @input="draft.vignette = Number($event.target.value); touch()" />
            </div>
          </section>
        </div>
      </div>
    </div>
    <div v-else class="empty dim">Düzenlemek için bir tema seçin ya da yeni tema oluşturun.<br />Projede tema: Stüdyo → Proje ayarları → Tasarım → Tema.</div>
  </div>
</template>

<style scoped>
.themes { display: grid; grid-template-columns: 260px 1fr; height: 100%; min-height: 0; }
.list { border-right: 1px solid var(--line); overflow: auto; padding: 12px; display: grid; gap: 10px; align-content: start; }
.card { display: grid; grid-template-columns: 70px 1fr; gap: 10px; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 8px; cursor: pointer; text-align: left; }
.card.on { border-color: var(--accent); }
.thumb { height: 86px; }
.meta { display: grid; gap: 3px; align-content: start; }
.sw { display: flex; gap: 3px; margin-top: 4px; }
.sw span { width: 14px; height: 14px; border-radius: 4px; border: 1px solid rgba(255,255,255,.1); }
.editor { display: flex; flex-direction: column; min-height: 0; }
.head { padding: 10px 14px; border-bottom: 1px solid var(--line); }
.title { max-width: 260px; font-weight: 600; }
.idf { max-width: 180px; }
.body { display: grid; grid-template-columns: minmax(260px, 1fr) 420px; gap: 16px; padding: 14px; overflow: auto; flex: 1; min-height: 0; }
.preview { display: grid; grid-template-rows: 1fr auto; gap: 8px; min-height: 480px; position: sticky; top: 0; max-height: calc(100vh - 170px); }
.form { display: grid; gap: 14px; align-content: start; }
section { display: grid; gap: 8px; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.sec-title { font-weight: 600; font-size: 13px; }
.papers { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.paper { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; font-size: 12px; }
.paper.on { border-color: var(--accent); background: #2d2118; }
.paper input { display: none; }
.pv { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(0,0,0,.3); }
.sl { display: grid; grid-template-columns: 140px 1fr; gap: 8px; align-items: center; font-size: 12px; color: var(--text-2); }
.pc { display: flex; align-items: center; }
.roles, .colors { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
.bgc { width: 110px; }
.wrap { flex-wrap: wrap; }
code { font-family: var(--mono); font-size: 11px; color: var(--text-3); }
.empty { padding: 40px; line-height: 1.8; }
</style>
