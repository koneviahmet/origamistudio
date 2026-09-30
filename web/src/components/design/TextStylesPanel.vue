<script setup>
import { computed, ref } from 'vue';
import { api } from '../../api.js';
import { resources, reloadResources } from '../../resources.js';
import { toast, toastError } from '../../toast.js';
import { clone } from '../../sceneOps.js';
import { textDemoScene } from './previews.js';
import RenderBox from './RenderBox.vue';
import FontPicker from '../FontPicker.vue';

const draft = ref(null);
const origId = ref(null);
const dirty = ref(false);
const sample = ref('Kağıttan Dünya');
const themeId = ref('');
const styles = computed(() => [...resources.value.textStyles.values()]);
const theme = computed(() => (themeId.value ? resources.value.themes.get(themeId.value) : null));
const REFS = ['$baslik', '$metin', '$vurgu', '$arka1', '$arka2'];

function open(s) {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = clone(s);
  origId.value = s.id;
  dirty.value = false;
}
function create() {
  if (dirty.value && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  draft.value = { id: 'yeni-stil', name: 'Yeni Stil', font: 'Poppins', weight: 700, size: 90, color: '$baslik' };
  origId.value = null;
  dirty.value = true;
}
const touch = () => (dirty.value = true);
function set(k, v) {
  if (v === '' || v === null || v === undefined || v === false) delete draft.value[k];
  else draft.value[k] = v;
  touch();
}
function toggleObj(k, on, def) {
  set(k, on ? def : null);
}
function sub(k, key, v) {
  draft.value[k] = { ...draft.value[k], [key]: v };
  touch();
}

async function save() {
  try {
    const saved = origId.value ? await api.colUpdate('textstyles', origId.value, draft.value) : await api.colCreate('textstyles', draft.value);
    origId.value = saved.id;
    draft.value = clone(saved);
    dirty.value = false;
    await reloadResources('textstyles');
    toast('Metin stili kaydedildi', 'ok');
  } catch (e) {
    toastError(e);
  }
}
async function duplicate() {
  const d = clone(draft.value);
  d.id = `${d.id}-kopya`;
  d.name = `${d.name} (kopya)`;
  try {
    const saved = await api.colCreate('textstyles', d);
    await reloadResources('textstyles');
    dirty.value = false;
    open(saved);
  } catch (e) {
    toastError(e);
  }
}
async function remove() {
  if (!origId.value) return (draft.value = null);
  if (!confirm(`"${draft.value.name}" stili silinsin mi? Bu stili kullanan metinler katman ayarlarına döner.`)) return;
  try {
    await api.colDelete('textstyles', origId.value);
    await reloadResources('textstyles');
    draft.value = null;
    dirty.value = false;
  } catch (e) {
    toastError(e);
  }
}

// Önizleme: taslak stili geçici bir kaynak olarak ver
const previewRes = computed(() => {
  const m = new Map(resources.value.textStyles);
  if (draft.value) m.set('__draft', draft.value);
  return { ...resources.value, textStyles: m };
});
const previewScene = computed(() => textDemoScene(draft.value ? '__draft' : null, sample.value, theme.value));
const cardScene = (s) => textDemoScene(s.id, s.name, null);
const fontWeights = computed(() => resources.value.fonts.find((f) => f.family === (draft.value?.font || 'Baloo 2'))?.weights || [400, 700]);

// Renk alanı: "$ref" ya da hex
const isRef = (v) => typeof v === 'string' && v[0] === '$';
</script>

<template>
  <div class="ts">
    <div class="list">
      <button class="btn primary" @click="create">＋ Yeni metin stili</button>
      <button v-for="s in styles" :key="s.id" class="card" :class="{ on: origId === s.id }" @click="open(s)">
        <div class="thumb"><RenderBox :scene="cardScene(s)" :res="resources" /></div>
        <div class="dim small">{{ s.font }} · {{ s.weight }} · {{ s.size }}px</div>
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
          <div class="pv-box"><RenderBox :scene="previewScene" :res="previewRes" /></div>
          <div class="row">
            <input v-model="sample" class="input grow" placeholder="Örnek metin" />
            <select v-model="themeId" class="input" style="width: 180px" title="$renkleri hangi temayla göster">
              <option value="">(tema yok)</option>
              <option v-for="th in resources.themes.values()" :key="th.id" :value="th.id">{{ th.name }}</option>
            </select>
          </div>
        </div>

        <div class="form">
          <div class="field"><label>Font</label><FontPicker :model-value="draft.font || ''" @update:model-value="(v) => set('font', v)" /></div>
          <div class="g3">
            <div class="field">
              <label>Kalınlık</label>
              <select class="input" :value="draft.weight || 600" @change="set('weight', Number($event.target.value))">
                <option v-for="w in fontWeights" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>
            <div class="field"><label>Boyut (px)</label><input type="number" class="input" :value="draft.size || 72" @input="set('size', Number($event.target.value))" /></div>
            <div class="field"><label>Satır aralığı</label><input type="number" step="0.05" class="input" :value="draft.lineHeight || 1.15" @input="set('lineHeight', Number($event.target.value))" /></div>
            <div class="field"><label>Harf aralığı</label><input type="number" class="input" :value="draft.letterSpacing || 0" @input="set('letterSpacing', Number($event.target.value))" /></div>
            <div class="field">
              <label>Hizalama</label>
              <select class="input" :value="draft.align || 'center'" @change="set('align', $event.target.value)">
                <option value="left">sola</option><option value="center">ortala</option><option value="right">sağa</option>
              </select>
            </div>
            <label class="row small chk"><input type="checkbox" :checked="!!draft.uppercase" @change="set('uppercase', $event.target.checked)" /> BÜYÜK HARF</label>
          </div>

          <div class="field">
            <label>Renk</label>
            <div class="row">
              <select class="input" :value="isRef(draft.color) ? draft.color : ''" @change="set('color', $event.target.value || '#3b2a22')">
                <option value="">Sabit renk</option>
                <option v-for="r in REFS" :key="r" :value="r">{{ r }} (temadan)</option>
              </select>
              <input v-if="!isRef(draft.color)" type="color" class="input" :value="draft.color || '#3b2a22'" @input="set('color', $event.target.value)" />
            </div>
          </div>

          <div class="opt">
            <label class="row small"><input type="checkbox" :checked="!!draft.stroke" @change="toggleObj('stroke', $event.target.checked, { color: '#ffffff', width: 8 })" /> <b>Kontur</b></label>
            <div v-if="draft.stroke" class="row">
              <input type="color" class="input" :value="isRef(draft.stroke.color) ? '#ffffff' : draft.stroke.color" @input="sub('stroke', 'color', $event.target.value)" />
              <input type="number" class="input" :value="draft.stroke.width" title="kalınlık" @input="sub('stroke', 'width', Number($event.target.value))" />
            </div>
          </div>
          <div class="opt">
            <label class="row small"><input type="checkbox" :checked="!!draft.shadow" @change="toggleObj('shadow', $event.target.checked, { color: 'rgba(60,30,15,0.3)', blur: 0, y: 6 })" /> <b>Gölge</b></label>
            <div v-if="draft.shadow" class="g3">
              <div class="field"><label>Bulanıklık</label><input type="number" class="input" :value="draft.shadow.blur ?? 12" @input="sub('shadow', 'blur', Number($event.target.value))" /></div>
              <div class="field"><label>X</label><input type="number" class="input" :value="draft.shadow.x ?? 0" @input="sub('shadow', 'x', Number($event.target.value))" /></div>
              <div class="field"><label>Y</label><input type="number" class="input" :value="draft.shadow.y ?? 6" @input="sub('shadow', 'y', Number($event.target.value))" /></div>
              <div class="field" style="grid-column: span 3"><label>Renk (css)</label><input class="input mono" :value="draft.shadow.color" @change="sub('shadow', 'color', $event.target.value)" /></div>
            </div>
          </div>
          <div class="opt">
            <label class="row small"><input type="checkbox" :checked="!!draft.box" @change="toggleObj('box', $event.target.checked, { color: '$vurgu', radius: 24 })" /> <b>Arka kutu</b></label>
            <div v-if="draft.box" class="g3">
              <div class="field">
                <label>Renk</label>
                <select class="input" :value="isRef(draft.box.color) ? draft.box.color : ''" @change="sub('box', 'color', $event.target.value || '#ffffff')">
                  <option value="">Sabit</option>
                  <option v-for="r in REFS" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div class="field">
                <label>&nbsp;</label>
                <input v-if="!isRef(draft.box.color)" type="color" class="input" :value="draft.box.color || '#ffffff'" @input="sub('box', 'color', $event.target.value)" />
              </div>
              <div class="field"><label>Köşe</label><input type="number" class="input" :value="draft.box.radius ?? 24" @input="sub('box', 'radius', Number($event.target.value))" /></div>
              <div class="field"><label>Opaklık</label><input type="number" step="0.05" min="0" max="1" class="input" :value="draft.box.opacity ?? 1" @input="sub('box', 'opacity', Number($event.target.value))" /></div>
            </div>
          </div>
          <p class="dim small">Metin katmanında <code>"textStyle": "{{ draft.id }}"</code> ile kullanılır; katmandaki alanlar stili geçersiz kılar.</p>
        </div>
      </div>
    </div>
    <div v-else class="empty dim">Düzenlemek için bir metin stili seçin ya da yeni stil oluşturun.</div>
  </div>
</template>

<style scoped>
.ts { display: grid; grid-template-columns: 280px 1fr; height: 100%; min-height: 0; }
.list { border-right: 1px solid var(--line); overflow: auto; padding: 12px; display: grid; gap: 10px; align-content: start; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 6px; cursor: pointer; display: grid; gap: 4px; text-align: left; }
.card.on { border-color: var(--accent); }
.thumb { height: 90px; }
.editor { display: flex; flex-direction: column; min-height: 0; }
.head { padding: 10px 14px; border-bottom: 1px solid var(--line); }
.title { max-width: 260px; font-weight: 600; }
.idf { max-width: 180px; }
.body { display: grid; grid-template-columns: 1fr 380px; gap: 16px; padding: 14px; overflow: auto; flex: 1; min-height: 0; }
.preview { display: grid; gap: 8px; align-content: start; }
.pv-box { height: 300px; background: var(--bg-2); border-radius: 10px; border: 1px solid var(--line); padding: 8px; }
.form { display: grid; gap: 12px; align-content: start; }
.g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; align-items: end; }
.chk { height: 30px; }
.opt { display: grid; gap: 8px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
code { font-family: var(--mono); font-size: 11px; }
.empty { padding: 40px; }
</style>
