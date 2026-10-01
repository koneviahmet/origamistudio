<script setup>
import { computed, ref, watch } from 'vue';
import PropRow from './PropRow.vue';
import AnimsEditor from './AnimsEditor.vue';
import ParticlesEditor from './ParticlesEditor.vue';
import ArrowEditor from './ArrowEditor.vue';
import WidgetEditor from './WidgetEditor.vue';
import CharacterEditor from './CharacterEditor.vue';
import AudioEditor from './AudioEditor.vue';
import TransitionsEditor from './TransitionsEditor.vue';
import FormatsEditor from './FormatsEditor.vue';
import PathEditor from './PathEditor.vue';
import GroupEditor from './GroupEditor.vue';
import FontPicker from '../FontPicker.vue';
import { FOLD_ORDERS, assetPalette } from '../../engine/origami.js';
import { STYLES } from '../../engine/styles.js';
import { PRESETS, presetOf, clone, uid } from '../../sceneOps.js';

const props = defineProps({
  scene: { type: Object, required: true },
  selectedId: { type: String, default: null },
  t: { type: Number, required: true },
  res: { type: Object, required: true },
  edit: { type: Function, required: true },
});
const emit = defineEmits(['select']);

const eps = computed(() => 0.5 / (props.scene.fps || 30));
const layerIndex = computed(() => (props.scene.layers || []).findIndex((l) => l.id === props.selectedId));
const layer = computed(() => (layerIndex.value >= 0 ? props.scene.layers[layerIndex.value] : null));
const asset = computed(() => (layer.value && layer.value.type !== 'text' ? props.res.assets.get(layer.value.asset) : null));
const isCamera = computed(() => props.selectedId === '__camera');

const assetsByCat = computed(() => {
  const m = {};
  for (const a of props.res.assets.values()) if (!a.type) (m[a.category] ||= []).push(a);
  return m;
});

const textStyle = computed(() => (layer.value?.textStyle ? props.res.textStyles.get(layer.value.textStyle) : null));
const fontWeights = computed(() => {
  const fam = layer.value?.font || textStyle.value?.font || 'Baloo 2';
  return props.res.fonts.find((f) => f.family === fam)?.weights || [400, 500, 600, 700];
});
const basePalette = computed(() => (asset.value ? assetPalette(asset.value, layer.value.variant) : {}));
const themeDoc = computed(() => (typeof props.scene.theme === 'string' ? props.res.themes.get(props.scene.theme) : props.scene.theme));
function applyThemeBg() {
  props.edit(() => (props.scene.background = clone(themeDoc.value.background)));
}

// ---------------------------------------------------------------- katman JSON
const layerJson = ref('');
const layerJsonErr = ref('');
const showJson = ref(false);
watch([layer, showJson], () => {
  if (showJson.value && layer.value) {
    layerJson.value = JSON.stringify(layer.value, null, 2);
    layerJsonErr.value = '';
  }
});
function applyLayerJson() {
  try {
    const obj = JSON.parse(layerJson.value);
    if (!obj.id) throw new Error('"id" gerekli');
    if (obj.id !== layer.value.id && props.scene.layers.some((l) => l.id === obj.id)) throw new Error('Bu id başka katmanda var');
    const i = layerIndex.value;
    props.edit(() => props.scene.layers.splice(i, 1, obj));
    emit('select', obj.id);
    layerJsonErr.value = '';
  } catch (e) {
    layerJsonErr.value = e.message;
  }
}

// ------------------------------------------------------------ katman işlemleri
function rename(e) {
  const id = e.target.value.trim();
  if (!id || id === layer.value.id) return;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id) || props.scene.layers.some((l) => l.id === id)) {
    e.target.value = layer.value.id;
    return;
  }
  props.edit(() => (layer.value.id = id));
  emit('select', id);
}
function move(dir) {
  const i = layerIndex.value;
  const j = i + dir;
  if (j < 0 || j >= props.scene.layers.length) return;
  props.edit(() => {
    const L = props.scene.layers;
    [L[i], L[j]] = [L[j], L[i]];
  });
}
function duplicate() {
  const copy = clone(layer.value);
  copy.id = uid(layer.value.id.replace(/-\d+$/, ''), props.scene);
  props.edit(() => props.scene.layers.splice(layerIndex.value + 1, 0, copy));
  emit('select', copy.id);
}
function remove() {
  const i = layerIndex.value;
  props.edit(() => props.scene.layers.splice(i, 1));
  emit('select', null);
}
function setField(obj, key, value) {
  props.edit(() => {
    if (value === '' || value === null || value === undefined) delete obj[key];
    else obj[key] = value;
  }, `field:${key}`);
}
const numOrNull = (v) => (v === '' ? null : Number(v));

function setFoldStyle(key, value) {
  props.edit(() => {
    layer.value.foldStyle ||= {};
    layer.value.foldStyle[key] = value;
  }, `fold:${key}`);
}
function setPalette(key, value) {
  props.edit(() => {
    layer.value.palette ||= {};
    layer.value.palette[key] = value;
  }, `pal:${key}`);
}
function resetPalette(key) {
  props.edit(() => {
    delete layer.value.palette[key];
    if (!Object.keys(layer.value.palette).length) delete layer.value.palette;
  });
}
function setAnchor(i, v) {
  props.edit(() => {
    const a = layer.value.anchor ? [...layer.value.anchor] : [0.5, 0.5];
    a[i] = Number(v);
    layer.value.anchor = a;
  }, `anchor:${i}`);
}

// ------------------------------------------------------------- proje ayarları
const bg = computed(() => props.scene.background || {});
function ensureBg(fn) {
  props.edit(() => {
    props.scene.background ||= { type: 'solid', color: '#f6efe4' };
    fn(props.scene.background);
  }, 'bg');
}
function setBgType(type) {
  ensureBg((b) => {
    b.type = type;
    if (type !== 'solid' && !(b.colors?.length >= 2)) b.colors = [b.color || '#fdf0dc', '#f6c9a0'];
    if (type === 'solid' && !b.color) b.color = b.colors?.[0] || '#f6efe4';
  });
}
function setPreset(id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return;
  props.edit(() => {
    props.scene.width = p.width;
    props.scene.height = p.height;
  });
}
function ensureCamera() {
  if (!props.scene.camera) {
    props.edit(() => (props.scene.camera = { zoom: 1, x: props.scene.width / 2, y: props.scene.height / 2 }));
  }
}
// Kamera x/y tanımsızsa renderer sahne merkezini kullanır; alanlar da aynı değeri göstersin.
watch(isCamera, (on) => {
  const c = props.scene.camera;
  if (!on || !c) return;
  if (c.x == null) c.x = props.scene.width / 2;
  if (c.y == null) c.y = props.scene.height / 2;
}, { immediate: true });
</script>

<template>
  <div class="inspector">
    <!-- Kamera -->
    <template v-if="isCamera">
      <div class="sec-title">🎥 Kamera</div>
      <p class="dim small">Kamera tüm sahneyi yakınlaştırır / kaydırır. Değerler sahne koordinatındadır (merkez = {{ scene.width / 2 }}, {{ scene.height / 2 }}).</p>
      <div class="props" @focusin="ensureCamera">
        <PropRow v-if="scene.camera" :obj="scene.camera" name="zoom" label="zoom" :t="t" :eps="eps" :step="0.01" :edit="edit" />
        <PropRow v-if="scene.camera" :obj="scene.camera" name="x" label="merkez x" :t="t" :eps="eps" :edit="edit" />
        <PropRow v-if="scene.camera" :obj="scene.camera" name="y" label="merkez y" :t="t" :eps="eps" :edit="edit" />
        <PropRow v-if="scene.camera" :obj="scene.camera" name="rotation" label="açı" :t="t" :eps="eps" :edit="edit" />
        <PropRow v-if="scene.camera" :obj="scene.camera" name="focus" label="odak derinliği" :t="t" :eps="eps" :step="0.1" :edit="edit" />
        <PropRow v-if="scene.camera" :obj="scene.camera" name="dof" label="alan derinliği (bulanık px)" :t="t" :eps="eps" :step="1" :min="0" :edit="edit" />
        <button v-if="!scene.camera" class="btn sm" @click="ensureCamera">Kamerayı etkinleştir</button>
      </div>
      <div class="dim small">İpucu: ◇ ile keyframe ekleyip değer değiştirerek yakınlaşma/kaydırma yapın.</div>
    </template>

    <!-- Klasör -->
    <template v-else-if="selectedId?.startsWith('__group:')">
      <GroupEditor :scene="scene" :group-id="selectedId.slice(8)" :edit="edit" @select="(id) => emit('select', id)" />
    </template>

    <!-- Geçişler ve bölümler -->
    <template v-else-if="selectedId === '__transitions'">
      <TransitionsEditor :scene="scene" :t="t" :edit="edit" />
    </template>

    <!-- Katman -->
    <template v-else-if="layer">
      <div class="row">
        <input class="input mono grow" :value="layer.id" title="Katman id" @change="rename" />
        <span class="chip">{{ layer.type === 'text' ? 'metin' : layer.type === 'particles' ? 'parçacık' : layer.type === 'arrow' ? 'ok' : ({ chart: 'grafik', device: 'cihaz', media: 'medya', waveform: 'dalga', kart: 'kart', liste: 'liste', kod: 'kod', zaman: 'zaman', balon: 'balon', karakter: 'karakter' })[layer.type] || 'origami' }}</span>
      </div>
      <div class="row actions">
        <button class="btn sm" title="Bir üst katmana (öne)" @click="move(1)">↑</button>
        <button class="btn sm" title="Bir alt katmana (arkaya)" @click="move(-1)">↓</button>
        <button class="btn sm" @click="duplicate">Çoğalt</button>
        <button class="btn sm" :class="{ on: showJson }" @click="showJson = !showJson">{ } JSON</button>
        <div class="grow" />
        <button class="btn sm danger" @click="remove">Sil</button>
      </div>

      <div v-if="scene.groups?.length" class="row small">
        <span class="dim">Klasör</span>
        <select class="input grow" :value="layer.group || ''" @change="setField(layer, 'group', $event.target.value)">
          <option value="">(yok)</option>
          <option v-for="g in scene.groups" :key="g.id" :value="g.id">📁 {{ g.name || g.id }}</option>
        </select>
        <label class="row" title="Sahnede seçilemez"><input type="checkbox" :checked="!!layer.locked" @change="setField(layer, 'locked', $event.target.checked || null)" /> kilit</label>
      </div>

      <div v-if="showJson" class="sec">
        <textarea v-model="layerJson" class="input mono" rows="14" spellcheck="false" />
        <div class="row">
          <span v-if="layerJsonErr" class="err grow">{{ layerJsonErr }}</span>
          <span v-else class="grow" />
          <button class="btn sm primary" @click="applyLayerJson">Uygula</button>
        </div>
      </div>

      <div v-if="layer.type === 'particles'" class="sec">
        <div class="sec-title">Parçacıklar</div>
        <ParticlesEditor :layer="layer" :scene="scene" :res="res" :edit="edit" />
      </div>

      <div v-if="['chart', 'device', 'media', 'waveform', 'kart', 'liste', 'kod', 'zaman', 'balon'].includes(layer.type)" class="sec">
        <div class="sec-title">{{ { chart: 'Grafik', device: 'Cihaz çerçevesi', media: 'Resim / video', waveform: 'Ses dalgası', kart: 'Kart', liste: 'Liste / tablo', kod: 'Kod penceresi', zaman: 'Zamanlayıcı', balon: 'Balon / not' }[layer.type] }}</div>
        <WidgetEditor :layer="layer" :scene="scene" :res="res" :edit="edit" />
      </div>

      <div v-if="layer.type === 'karakter'" class="sec">
        <div class="sec-title">Karakter</div>
        <CharacterEditor :layer="layer" :scene="scene" :res="res" :t="t" :edit="edit" />
      </div>

      <div v-if="layer.type === 'arrow'" class="sec">
        <div class="sec-title">Ok <span class="dim small">· nesneden nesneye geçiş</span></div>
        <ArrowEditor :layer="layer" :scene="scene" :res="res" :t="t" :eps="eps" :edit="edit" />
      </div>

      <div v-if="!layer.type" class="sec">
        <div class="sec-title">Varlık</div>
        <select class="input" :value="layer.asset" @change="setField(layer, 'asset', $event.target.value)">
          <option v-if="!asset" :value="layer.asset">? {{ layer.asset }}</option>
          <optgroup v-for="(list, cat) in assetsByCat" :key="cat" :label="cat">
            <option v-for="a in list" :key="a.id" :value="a.id">{{ a.name || a.id }}</option>
          </optgroup>
        </select>
        <div class="grid2">
          <div class="field">
            <label>Varyant</label>
            <select class="input" :value="layer.variant || ''" @change="setField(layer, 'variant', $event.target.value)">
              <option value="">Varsayılan</option>
              <option v-for="(v, k) in asset?.variants || {}" :key="k" :value="k">{{ v.name || k }}</option>
            </select>
          </div>
          <div class="field">
            <label>Çizim stili</label>
            <select class="input" :value="layer.style || ''" @change="setField(layer, 'style', $event.target.value)">
              <option value="">Proje ({{ STYLES[scene.style || 'origami']?.label }})</option>
              <option v-for="(st, k) in STYLES" :key="k" :value="k">{{ st.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="layer.type === 'text'" class="sec">
        <div class="sec-title">Metin</div>
        <textarea class="input" rows="2" :value="layer.text" @input="setField(layer, 'text', $event.target.value)" />
        <div class="field">
          <label>Metin stili</label>
          <select class="input" :value="layer.textStyle || ''" @change="setField(layer, 'textStyle', $event.target.value)">
            <option value="">(yok)</option>
            <option v-for="ts in res.textStyles.values()" :key="ts.id" :value="ts.id">{{ ts.name || ts.id }}</option>
          </select>
        </div>
        <div class="field">
          <label>Font <span v-if="textStyle?.font && !layer.font" class="dim">(stilden: {{ textStyle.font }})</span></label>
          <FontPicker :model-value="layer.font || ''" :placeholder="textStyle?.font || 'Baloo 2'" @update:model-value="(v) => setField(layer, 'font', v)" />
        </div>
        <div class="grid2">
          <select class="input" :value="layer.weight || ''" title="Kalınlık" @change="setField(layer, 'weight', Number($event.target.value) || null)">
            <option value="">kalınlık ({{ textStyle?.weight || 600 }})</option>
            <option v-for="w in fontWeights" :key="w" :value="w">{{ w }}</option>
          </select>
          <select class="input" :value="layer.align || 'center'" @change="setField(layer, 'align', $event.target.value)">
            <option value="left">sola</option>
            <option value="center">ortala</option>
            <option value="right">sağa</option>
          </select>
          <label class="row small"><input type="checkbox" :checked="layer.uppercase ?? textStyle?.uppercase ?? false" @change="setField(layer, 'uppercase', $event.target.checked)" /> BÜYÜK HARF</label>
          <div class="field">
            <label>Harf aralığı</label>
            <input type="number" step="1" class="input" :value="layer.letterSpacing ?? textStyle?.letterSpacing ?? 0" @change="setField(layer, 'letterSpacing', Number($event.target.value))" />
          </div>
          <label class="row small"><input type="checkbox" :checked="!!(layer.box ?? textStyle?.box)" @change="setField(layer, 'box', $event.target.checked ? { color: '$vurgu', radius: 24 } : false)" /> Arka kutu</label>
        </div>
        <div class="props">
          <PropRow :obj="layer" name="size" label="boyut" :t="t" :eps="eps" :edit="edit" />
          <PropRow :obj="layer" name="reveal" label="daktilo" :t="t" :eps="eps" :step="0.05" :min="0" :max="1" :edit="edit" />
          <PropRow :obj="layer" name="color" label="renk" kind="color" :t="t" :eps="eps" :edit="edit" />
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">Dönüşüm <span class="dim small">· t = {{ t.toFixed(2) }}s</span></div>
        <div class="props">
          <PropRow :obj="layer" name="x" :t="t" :eps="eps" :edit="edit" />
          <PropRow :obj="layer" name="y" :t="t" :eps="eps" :edit="edit" />
          <template v-if="layer.type !== 'arrow'">
            <PropRow :obj="layer" name="scale" label="ölçek" :t="t" :eps="eps" :step="0.05" :edit="edit" />
            <PropRow :obj="layer" name="scaleX" label="ölçek X" :t="t" :eps="eps" :step="0.05" :edit="edit" />
            <PropRow :obj="layer" name="scaleY" label="ölçek Y" :t="t" :eps="eps" :step="0.05" :edit="edit" />
            <PropRow :obj="layer" name="rotation" label="açı°" :t="t" :eps="eps" :edit="edit" />
          </template>
          <PropRow :obj="layer" name="opacity" label="opaklık" :t="t" :eps="eps" :step="0.05" :min="0" :max="1" :edit="edit" />
          <PropRow :obj="layer" name="depth" label="derinlik" :t="t" :eps="eps" :step="0.1" :edit="edit" />
          <PropRow :obj="layer" name="blur" label="bulanık px" :t="t" :eps="eps" :step="1" :min="0" :edit="edit" />
          <PropRow v-if="!layer.type" :obj="layer" name="fold" label="katlanma" :t="t" :eps="eps" :step="0.05" :min="0" :max="1" :edit="edit" />
        </div>
      </div>

      <div v-if="layer.type !== 'particles' && layer.type !== 'arrow'" class="sec">
        <div class="sec-title">Hareket yolu</div>
        <PathEditor :layer="layer" :t="t" :eps="eps" :edit="edit" />
      </div>

      <div class="sec">
        <div class="sec-title">Animasyonlar <span class="dim small">· ön ayarlar</span></div>
        <AnimsEditor :layer="layer" :t="t" :edit="edit" />
      </div>

      <div v-if="layer.type === 'text'" class="sec">
        <div class="sec-title">Metin animasyonları <span class="dim small">· harf / kelime / satır</span></div>
        <AnimsEditor kind="text" :layer="layer" :t="t" :edit="edit" />
      </div>

      <div class="sec">
        <div class="sec-title">Zamanlama</div>
        <div class="grid2">
          <div class="field">
            <label>Başlangıç (sn)</label>
            <input type="number" step="0.1" class="input" :value="layer.start ?? ''" placeholder="0" @change="setField(layer, 'start', numOrNull($event.target.value))" />
          </div>
          <div class="field">
            <label>Bitiş (sn)</label>
            <input type="number" step="0.1" class="input" :value="layer.end ?? ''" :placeholder="scene.duration" @change="setField(layer, 'end', numOrNull($event.target.value))" />
          </div>
        </div>
      </div>

      <div v-if="!layer.type" class="sec">
        <div class="sec-title">Origami</div>
        <div class="grid2">
          <div class="field">
            <label>Katlanma sırası</label>
            <select class="input" :value="layer.foldStyle?.order || 'radial'" @change="setFoldStyle('order', $event.target.value)">
              <option v-for="o in FOLD_ORDERS" :key="o" :value="o">{{ o }}</option>
            </select>
          </div>
          <div class="field">
            <label>Yayılım {{ (layer.foldStyle?.spread ?? 0.6).toFixed(2) }}</label>
            <input type="range" min="0" max="0.95" step="0.05" :value="layer.foldStyle?.spread ?? 0.6" @input="setFoldStyle('spread', Number($event.target.value))" />
          </div>
          <div class="field">
            <label>Çapa X / Y</label>
            <div class="row">
              <input type="number" step="0.1" class="input" :value="layer.anchor?.[0] ?? 0.5" @change="setAnchor(0, $event.target.value)" />
              <input type="number" step="0.1" class="input" :value="layer.anchor?.[1] ?? 0.5" @change="setAnchor(1, $event.target.value)" />
            </div>
          </div>
          <div class="field">
            <label>Zemin gölgesi</label>
            <label class="row small"><input type="checkbox" :checked="!!layer.shadow" @change="setField(layer, 'shadow', $event.target.checked || null)" /> göster</label>
          </div>
        </div>
        <template v-if="asset && asset.palette">
          <div class="label">Renkler (bu katmana özel)</div>
          <div class="pal">
            <div v-for="(c, k) in basePalette" :key="k" class="pal-item">
              <input type="color" class="input" :value="layer.palette?.[k] || c" @input="setPalette(k, $event.target.value)" />
              <span class="mono small">{{ k }}<span v-if="asset.roles?.[k]" class="dim"> · {{ asset.roles[k] }}</span></span>
              <button v-if="layer.palette?.[k]" class="btn icon sm ghost" title="Varsayılana dön" @click="resetPalette(k)">↺</button>
            </div>
          </div>
        </template>
        <div v-if="layer.loops?.length || layer.parts" class="dim small">
          Döngü: {{ (layer.loops || []).map((l) => `${l.prop}~${l.type || 'sine'}`).join(', ') || '—' }}
          <template v-if="layer.parts"> · Parçalar: {{ Object.keys(layer.parts).join(', ') }}</template>
          <br />(JSON ile düzenlenir)
        </div>
      </div>
    </template>

    <!-- Proje -->
    <template v-else>
      <div class="sec-title">Proje ayarları</div>
      <div class="field">
        <label>Ad</label>
        <input class="input" :value="scene.name" @input="setField(scene, 'name', $event.target.value)" />
      </div>
      <div class="field">
        <label>Format</label>
        <select class="input" :value="presetOf(scene)" @change="setPreset($event.target.value)">
          <option v-for="p in PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
          <option value="custom" disabled>Özel</option>
        </select>
      </div>
      <div class="grid2">
        <div class="field"><label>Genişlik</label><input type="number" class="input" :value="scene.width" @change="setField(scene, 'width', Number($event.target.value))" /></div>
        <div class="field"><label>Yükseklik</label><input type="number" class="input" :value="scene.height" @change="setField(scene, 'height', Number($event.target.value))" /></div>
        <div class="field">
          <label>FPS</label>
          <select class="input" :value="scene.fps" @change="setField(scene, 'fps', Number($event.target.value))">
            <option v-for="f in [24, 25, 30, 50, 60]" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
        <div class="field"><label>Süre (sn)</label><input type="number" step="0.5" min="0.5" class="input" :value="scene.duration" @change="setField(scene, 'duration', Number($event.target.value))" /></div>
      </div>

      <div class="sec">
        <div class="sec-title">Tasarım</div>
        <div class="field">
          <label>Tema</label>
          <select class="input" :value="typeof scene.theme === 'string' ? scene.theme : ''" @change="setField(scene, 'theme', $event.target.value)">
            <option value="">(tema yok)</option>
            <option v-for="th in res.themes.values()" :key="th.id" :value="th.id">{{ th.name || th.id }}</option>
          </select>
        </div>
        <button v-if="themeDoc?.background" class="btn sm" title="Temanın arka planını projeye kopyala" @click="applyThemeBg">Tema arka planını uygula</button>
        <div class="field">
          <label>Çizim stili</label>
          <select class="input" :value="scene.style || 'origami'" @change="setField(scene, 'style', $event.target.value === 'origami' ? null : $event.target.value)">
            <option v-for="(st, k) in STYLES" :key="k" :value="k">{{ st.label }} — {{ st.hint }}</option>
          </select>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">Diğer formatlar</div>
        <FormatsEditor :scene="scene" :edit="edit" />
      </div>

      <div class="sec">
        <div class="sec-title">Müzik ve ses</div>
        <AudioEditor :scene="scene" :res="res" :edit="edit" />
      </div>

      <div class="sec">
        <div class="sec-title">Arka plan</div>
        <select class="input" :value="bg.type || 'solid'" @change="setBgType($event.target.value)">
          <option value="solid">Düz renk</option>
          <option value="linear">Doğrusal degrade</option>
          <option value="radial">Dairesel degrade</option>
        </select>
        <div v-if="(bg.type || 'solid') === 'solid'" class="row">
          <input type="color" class="input" :value="bg.color || '#f6efe4'" @input="ensureBg((b) => (b.color = $event.target.value))" />
          <span class="mono small">{{ bg.color }}</span>
        </div>
        <template v-else>
          <div class="row wrap">
            <div v-for="(c, i) in bg.colors" :key="i" class="row">
              <input type="color" class="input" :value="c" @input="ensureBg((b) => (b.colors[i] = $event.target.value))" />
              <button v-if="bg.colors.length > 2" class="btn icon sm ghost" @click="ensureBg((b) => b.colors.splice(i, 1))">✕</button>
            </div>
            <button class="btn sm" @click="ensureBg((b) => b.colors.push(b.colors[b.colors.length - 1]))">＋</button>
          </div>
          <div v-if="bg.type === 'linear'" class="field">
            <label>Açı {{ bg.angle ?? 180 }}°</label>
            <input type="range" min="0" max="360" :value="bg.angle ?? 180" @input="ensureBg((b) => (b.angle = Number($event.target.value)))" />
          </div>
        </template>
        <div class="field">
          <label>Kağıt dokusu {{ (bg.paper ?? 0.5).toFixed(2) }}</label>
          <input type="range" min="0" max="1" step="0.05" :value="bg.paper ?? 0.5" @input="ensureBg((b) => (b.paper = Number($event.target.value)))" />
        </div>
        <div class="field">
          <label>Vinyet {{ (bg.vignette ?? 0.2).toFixed(2) }}</label>
          <input type="range" min="0" max="0.8" step="0.02" :value="bg.vignette ?? 0.2" @input="ensureBg((b) => (b.vignette = Number($event.target.value)))" />
        </div>
      </div>
      <p class="dim small">Bir katmanı düzenlemek için sahnede ya da zaman çizelgesinde seçin. Kamera için 🎥 satırına tıklayın.</p>
    </template>
  </div>
</template>

<style scoped>
.inspector { display: grid; gap: 12px; padding: 12px; align-content: start; }
.sec { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
.sec-title { font-weight: 600; font-size: 13px; }
.props { display: grid; gap: 5px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.actions { flex-wrap: wrap; gap: 4px; }
.wrap { flex-wrap: wrap; }
.pal { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.pal-item { display: flex; align-items: center; gap: 6px; }
</style>
