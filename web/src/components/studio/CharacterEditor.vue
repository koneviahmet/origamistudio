<script setup>
// Karakter katmanı denetçisi: karakter / varyant / aksesuar, hareket-yüz akışı (akis) ve konuşma balonları (soz).
// Aksiyon ve duygu listeleri tüm karakterler için ortaktır (engine/characterData.js).
import { computed } from 'vue';
import { mergeCharacter } from '../../engine/character.js';
import { ACTIONS, ACTION_GROUPS, EMOTIONS, PROPS, EFFECTS, BUBBLE_KINDS, LOOK_NAMES } from '../../engine/characterData.js';

const props = defineProps({
  layer: { type: Object, required: true },
  scene: { type: Object, required: true },
  res: { type: Object, required: true },
  t: { type: Number, required: true },
  edit: { type: Function, required: true },
});

const chars = computed(() => [...props.res.characters.values()].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr')));
const doc = computed(() => props.res.characters.get(props.layer.karakter));
const variants = computed(() => Object.keys(doc.value?.varyantlar || {}));
const ekler = computed(() => doc.value?.ekler || []);
const others = computed(() => (props.scene.layers || []).filter((l) => l.id !== props.layer.id));
const r1 = (n) => Math.round(n * 10) / 10;

const actionGroups = computed(() => {
  const custom = Object.entries(doc.value?.aksiyonlar || {}).map(([k, v]) => [k, { ...v, grup: 'ozel' }]);
  const all = [...Object.entries(ACTIONS), ...custom];
  return [...ACTION_GROUPS, ['ozel', 'Bu karaktere özel']].map(([g, label]) => [label, all.filter(([, a]) => a.grup === g)]).filter(([, a]) => a.length);
});
const emotions = computed(() => [...Object.entries(EMOTIONS), ...Object.entries(doc.value?.duygular || {})]);

function set(key, v) {
  props.edit(() => {
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete props.layer[key];
    else props.layer[key] = v;
  }, `ch:${key}`);
}
// etkin aksesuar kümesi: karakter varsayılanları + varyant + katman geçersiz kılmaları
const activeEk = computed(() => new Set(doc.value ? mergeCharacter(doc.value, props.layer).ekAktif.map((e) => e.id) : []));
const hasEk = (id) => activeEk.value.has(id);
function toggleEk(id) {
  props.edit(() => {
    const cur = props.layer.ekler;
    const o = Array.isArray(cur) ? Object.fromEntries(cur.map((x) => [x, true])) : { ...(cur || {}) };
    o[id] = !hasEk(id);
    props.layer.ekler = o;
  }, 'ch:ekler');
}

// ------------------------------------------------------------------ akış
const akis = computed(() => props.layer.akis || []);
function addSeg() {
  props.edit(() => {
    (props.layer.akis ||= []).push({ t: r1(props.t), aksiyon: 'bekle' });
    props.layer.akis.sort((a, b) => (a.t || 0) - (b.t || 0));
  });
}
function removeSeg(i) {
  props.edit(() => {
    props.layer.akis.splice(i, 1);
    if (!props.layer.akis.length) delete props.layer.akis;
  });
}
function setSeg(i, key, v) {
  props.edit(() => {
    const s = props.layer.akis[i];
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete s[key];
    else s[key] = v;
  }, `ch:akis:${i}:${key}`);
}
function setSegTutar(i, nesne) {
  props.edit(() => {
    const s = props.layer.akis[i];
    if (!nesne) s.tutar = null;
    else s.tutar = { ...(s.tutar || {}), nesne, el: 'R' };
  }, `ch:akis:${i}:tutar`);
}
function setSegTutarText(i, metin) {
  props.edit(() => {
    const s = props.layer.akis[i];
    if (s.tutar) s.tutar.metin = metin;
  }, `ch:akis:${i}:tm`);
}
const hedefVal = (s) => (typeof s.hedef === 'string' ? s.hedef : '');
const bakVal = (s) => (typeof s.bak === 'string' ? s.bak : '');

// ------------------------------------------------------------------ söz
const soz = computed(() => props.layer.soz || []);
function addSoz() {
  props.edit(() => {
    (props.layer.soz ||= []).push({ t: r1(props.t), metin: 'Merhaba!' });
    props.layer.soz.sort((a, b) => (a.t || 0) - (b.t || 0));
  });
}
function removeSoz(i) {
  props.edit(() => {
    props.layer.soz.splice(i, 1);
    if (!props.layer.soz.length) delete props.layer.soz;
  });
}
function setSoz(i, key, v) {
  props.edit(() => {
    const s = props.layer.soz[i];
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) delete s[key];
    else s[key] = v;
  }, `ch:soz:${i}:${key}`);
}
const num = (e) => (e.target.value === '' ? null : Number(e.target.value));
</script>

<template>
  <div class="ce">
    <div class="field">
      <label>Karakter</label>
      <select class="input" :value="layer.karakter" @change="set('karakter', $event.target.value)">
        <option v-if="!doc" :value="layer.karakter">? {{ layer.karakter }}</option>
        <option v-for="c in chars" :key="c.id" :value="c.id">{{ c.name || c.id }}</option>
      </select>
    </div>
    <div class="grid2">
      <div class="field">
        <label>Varyant</label>
        <select class="input" :value="layer.varyant || ''" @change="set('varyant', $event.target.value)">
          <option value="">Varsayılan</option>
          <option v-for="v in variants" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>
      <div class="field">
        <label>Baktığı yön</label>
        <select class="input" :value="layer.yon ?? 1" @change="set('yon', Number($event.target.value) === 1 ? null : -1)">
          <option :value="1">Sağa</option>
          <option :value="-1">Sola</option>
        </select>
      </div>
    </div>
    <div v-if="ekler.length" class="field">
      <label>Aksesuarlar <span class="dim small">· açıp kapat</span></label>
      <div class="chips">
        <button v-for="e in ekler" :key="e.id" type="button" class="chip" :class="{ on: hasEk(e.id) }" :title="e.id" @click="toggleEk(e.id)">{{ e.ad || e.id }}</button>
      </div>
    </div>
    <label class="row small"><input type="checkbox" :checked="layer.golge ?? true" @change="set('golge', $event.target.checked ? null : false)" /> Yer gölgesi</label>
    <p class="dim small">Konum = <b>ayak ucu</b>. Duygu / aksiyon değişimleri aşağıdaki akışta zamanlanır; yürüme için <code>dx</code> ver (hız otomatik).</p>

    <div class="sec-title">Akış <span class="dim small">· hareket + yüz, zamana göre</span></div>
    <div v-for="(s, i) in akis" :key="i" class="seg">
      <div class="row">
        <input type="number" step="0.1" class="input tn" :value="s.t ?? 0" title="Başlangıç (sn)" @change="setSeg(i, 't', num($event))" />
        <select class="input grow" :value="s.aksiyon || 'bekle'" title="Aksiyon" @change="setSeg(i, 'aksiyon', $event.target.value)">
          <optgroup v-for="[label, items] in actionGroups" :key="label" :label="label">
            <option v-for="[k, a] in items" :key="k" :value="k">{{ a.ad || k }}</option>
          </optgroup>
        </select>
        <button class="btn icon sm ghost" title="Sil" @click="removeSeg(i)">✕</button>
      </div>
      <div class="row">
        <select class="input grow" :value="s.duygu || ''" title="Duygu (boşsa öncekini sürdürür)" @change="setSeg(i, 'duygu', $event.target.value)">
          <option value="">duygu: önceki</option>
          <option v-for="[k, e] in emotions" :key="k" :value="k">{{ e.ad || k }}</option>
        </select>
        <select class="input grow" :value="bakVal(s)" title="Bakış" @change="setSeg(i, 'bak', $event.target.value)">
          <option value="">bakış: önceki</option>
          <option v-for="n in LOOK_NAMES" :key="n" :value="n">{{ n }}</option>
          <option v-for="l in others" :key="l.id" :value="l.id">→ {{ l.id }}</option>
        </select>
      </div>
      <details :open="!!(s.dx || s.dy || s.hedef || s.tutar || s.efekt || s.sure || s.hiz)">
        <summary class="dim small">ayrıntı (hareket, hedef, nesne, efekt)</summary>
        <div class="grid3">
          <div class="field"><label>dx (px)</label><input type="number" step="10" class="input" :value="s.dx ?? ''" @change="setSeg(i, 'dx', num($event))" /></div>
          <div class="field"><label>dy (px)</label><input type="number" step="10" class="input" :value="s.dy ?? ''" @change="setSeg(i, 'dy', num($event))" /></div>
          <div class="field"><label>Süre (sn)</label><input type="number" step="0.1" class="input" :value="s.sure ?? ''" placeholder="sonrakine" @change="setSeg(i, 'sure', num($event))" /></div>
          <div class="field"><label>Hız ×</label><input type="number" step="0.1" class="input" :value="s.hiz ?? ''" placeholder="oto" @change="setSeg(i, 'hiz', num($event))" /></div>
          <div class="field"><label>Geçiş (sn)</label><input type="number" step="0.05" class="input" :value="s.gecis ?? ''" placeholder="0.25" @change="setSeg(i, 'gecis', num($event))" /></div>
          <div class="field"><label>Siddet</label><input type="number" step="0.1" class="input" :value="s.siddet ?? ''" placeholder="1" @change="setSeg(i, 'siddet', num($event))" /></div>
        </div>
        <div class="row">
          <select class="input grow" :value="hedefVal(s)" title="İşaret / tanıtma hedefi" @change="setSeg(i, 'hedef', $event.target.value)">
            <option value="">hedef: yok</option>
            <option v-for="l in others" :key="l.id" :value="l.id">◎ {{ l.id }}</option>
          </select>
          <select class="input grow" :value="s.efekt || ''" @change="setSeg(i, 'efekt', $event.target.value)">
            <option value="">efekt: aksiyonun</option>
            <option v-for="(n, k) in EFFECTS" :key="k" :value="k">{{ n }}</option>
          </select>
        </div>
        <div class="row">
          <select class="input grow" :value="s.tutar?.nesne || ''" title="Elinde tuttuğu nesne" @change="setSegTutar(i, $event.target.value)">
            <option value="">{{ s.tutar === null ? 'nesne: bırak' : 'nesne: önceki' }}</option>
            <option v-for="(p, k) in PROPS" :key="k" :value="k">{{ p.ad }}</option>
          </select>
          <input v-if="s.tutar?.nesne === 'tabela'" class="input grow" :value="s.tutar.metin || ''" placeholder="Tabela yazısı" @input="setSegTutarText(i, $event.target.value)" />
        </div>
      </details>
    </div>
    <button class="btn sm" @click="addSeg">＋ Akış ekle (t = {{ t.toFixed(1) }})</button>

    <div class="sec-title">Sözler <span class="dim small">· konuşma balonu + ağız hareketi</span></div>
    <div v-for="(s, i) in soz" :key="i" class="seg">
      <div class="row">
        <input type="number" step="0.1" class="input tn" :value="s.t ?? 0" title="Başlangıç (sn)" @change="setSoz(i, 't', num($event))" />
        <input type="number" step="0.1" class="input tn" :value="s.sure ?? ''" placeholder="süre" title="Süre (boşsa metne göre)" @change="setSoz(i, 'sure', num($event))" />
        <select class="input grow" :value="s.tur || 'soyle'" @change="setSoz(i, 'tur', $event.target.value === 'soyle' ? null : $event.target.value)">
          <option v-for="(n, k) in BUBBLE_KINDS" :key="k" :value="k">{{ n }}</option>
        </select>
        <select class="input tn" :value="s.taraf || ''" title="Balon yönü" @change="setSoz(i, 'taraf', $event.target.value)">
          <option value="">oto</option>
          <option value="sol">sol</option>
          <option value="sag">sağ</option>
        </select>
        <button class="btn icon sm ghost" title="Sil" @click="removeSoz(i)">✕</button>
      </div>
      <textarea class="input" rows="2" :value="s.metin" @input="setSoz(i, 'metin', $event.target.value)" />
    </div>
    <button class="btn sm" @click="addSoz">＋ Söz ekle (t = {{ t.toFixed(1) }})</button>
  </div>
</template>

<style scoped>
.ce { display: grid; gap: 8px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 6px 0; }
.seg { border: 1px solid var(--line); border-radius: 8px; padding: 6px; display: grid; gap: 6px; background: var(--bg-2); }
.tn { width: 62px; flex: none; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips .chip { cursor: pointer; background: transparent; color: inherit; font: inherit; font-size: 11px; }
.chips .chip.on { border-color: var(--accent); background: #2d2118; }
summary { cursor: pointer; }
textarea.input { resize: vertical; }
</style>
