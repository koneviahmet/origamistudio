<script setup>
// Katman klasörü ayarları
import { computed } from 'vue';

const props = defineProps({
  scene: { type: Object, required: true },
  groupId: { type: String, required: true },
  edit: { type: Function, required: true },
});
const emit = defineEmits(['select']);

const group = computed(() => (props.scene.groups || []).find((g) => g.id === props.groupId));
const members = computed(() => props.scene.layers.filter((l) => l.group === props.groupId));
const others = computed(() => props.scene.layers.filter((l) => l.group !== props.groupId));

function set(k, v) {
  props.edit(() => {
    if (v === false || v === '' || v == null) delete group.value[k];
    else group.value[k] = v;
  }, `grp:${k}`);
}
function add(id) {
  const l = props.scene.layers.find((x) => x.id === id);
  if (l) props.edit(() => (l.group = props.groupId));
}
function removeMember(l) {
  props.edit(() => delete l.group);
}
function ungroup() {
  props.edit(() => {
    for (const l of props.scene.layers) if (l.group === props.groupId) delete l.group;
    props.scene.groups = props.scene.groups.filter((g) => g.id !== props.groupId);
    if (!props.scene.groups.length) delete props.scene.groups;
  });
  emit('select', null);
}
function deleteAll() {
  if (!confirm(`"${group.value.name}" klasörü ve içindeki ${members.value.length} katman silinsin mi? (Ctrl+Z ile geri alınabilir)`)) return;
  props.edit(() => {
    props.scene.layers = props.scene.layers.filter((l) => l.group !== props.groupId);
    props.scene.groups = props.scene.groups.filter((g) => g.id !== props.groupId);
    if (!props.scene.groups.length) delete props.scene.groups;
  });
  emit('select', null);
}
</script>

<template>
  <div v-if="group" class="ge">
    <div class="sec-title">📁 Klasör</div>
    <input class="input" :value="group.name" @change="set('name', $event.target.value)" />
    <div class="row wrap small">
      <label class="row"><input type="checkbox" :checked="!!group.hidden" @change="set('hidden', $event.target.checked)" /> gizli</label>
      <label class="row"><input type="checkbox" :checked="!!group.locked" @change="set('locked', $event.target.checked)" /> kilitli</label>
      <label class="row"><input type="checkbox" :checked="!!group.collapsed" @change="set('collapsed', $event.target.checked)" /> katlanmış</label>
    </div>
    <div class="label">Katmanlar ({{ members.length }})</div>
    <div class="list">
      <div v-for="l in members" :key="l.id" class="row item">
        <button class="linkish grow" @click="emit('select', l.id)">{{ l.id }}</button>
        <button class="btn icon sm ghost" title="Klasörden çıkar" @click="removeMember(l)">✕</button>
      </div>
    </div>
    <select v-if="others.length" class="input" @change="add($event.target.value); $event.target.value = ''">
      <option value="">＋ Klasöre katman ekle…</option>
      <option v-for="l in others" :key="l.id" :value="l.id">{{ l.id }}</option>
    </select>
    <p class="dim small">Klasör seçiliyken sahnede bir üyesini sürüklersen tüm klasör birlikte taşınır (keyframe'ler ve yollar dahil).</p>
    <div class="row">
      <button class="btn sm" @click="ungroup">Klasörü çöz</button>
      <div class="grow" />
      <button class="btn sm danger" @click="deleteAll">Katmanlarıyla sil</button>
    </div>
  </div>
</template>

<style scoped>
.ge { display: grid; gap: 8px; }
.sec-title { font-weight: 600; font-size: 13px; }
.wrap { flex-wrap: wrap; gap: 6px 12px; }
.list { display: grid; gap: 2px; }
.item { background: var(--bg-2); border-radius: 6px; padding: 2px 4px 2px 8px; }
.linkish { background: none; border: none; color: var(--text); text-align: left; cursor: pointer; font-family: var(--mono); font-size: 12px; }
.linkish:hover { color: var(--accent-2); }
</style>
