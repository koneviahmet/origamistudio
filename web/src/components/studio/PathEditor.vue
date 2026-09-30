<script setup>
// Hareket yolu ayarları (denetçi). Noktalar sahnede sürüklenerek düzenlenir.
import PropRow from './PropRow.vue';
import { pathAt } from '../../engine/path.js';
import { valueAt } from '../../sceneOps.js';

const props = defineProps({
  layer: { type: Object, required: true },
  t: { type: Number, required: true },
  eps: { type: Number, required: true },
  edit: { type: Function, required: true },
});

const r1 = (v) => Math.round(v);
const r2 = (v) => Math.round(v * 100) / 100;

function create() {
  const x = valueAt(props.layer, 'x', props.t);
  const y = valueAt(props.layer, 'y', props.t);
  const t0 = r2(props.layer.start ?? props.t);
  props.edit(() => {
    props.layer.path = { points: [[r1(x - 320), r1(y + 80)], [r1(x), r1(y - 160)], [r1(x + 320), r1(y + 80)]], smooth: true, orient: false };
    props.layer.pathT = [{ t: t0, v: 0 }, { t: r2(t0 + 3), v: 1, ease: 'inOutSine' }];
  });
}
function remove() {
  // Yol kalkınca katman o anki yol konumunda kalsın
  const p = pathAt(props.layer.path, valueAt(props.layer, 'pathT', props.t));
  props.edit(() => {
    delete props.layer.path;
    delete props.layer.pathT;
    props.layer.x = r1(p.x);
    props.layer.y = r1(p.y);
  });
}
function set(k, v) {
  props.edit(() => (props.layer.path[k] = v), `path:${k}`);
}
function addEnd() {
  props.edit(() => {
    const P = props.layer.path.points;
    const a = P[P.length - 2];
    const b = P[P.length - 1];
    P.push([r1(b[0] + (b[0] - a[0])), r1(b[1] + (b[1] - a[1]))]);
  });
}
function reverse() {
  props.edit(() => props.layer.path.points.reverse());
}
</script>

<template>
  <div class="pe">
    <template v-if="!layer.path">
      <p class="dim small">Katmanı sahnede çizilen bir eğri boyunca hareket ettir (kuş uçuşu, yaprak düşüşü, balık yüzüşü…).</p>
      <button class="btn sm" @click="create">＋ Hareket yolu oluştur</button>
    </template>
    <template v-else>
      <PropRow :obj="layer" name="pathT" label="ilerleme" :t="t" :eps="eps" :step="0.01" :min="0" :max="1" :edit="edit" />
      <div class="row wrap small">
        <label class="row"><input type="checkbox" :checked="layer.path.smooth !== false" @change="set('smooth', $event.target.checked)" /> yumuşak</label>
        <label class="row"><input type="checkbox" :checked="!!layer.path.closed" @change="set('closed', $event.target.checked)" /> kapalı (döngü)</label>
        <label class="row"><input type="checkbox" :checked="!!layer.path.orient" @change="set('orient', $event.target.checked)" /> yöne dön</label>
      </div>
      <div v-if="layer.path.orient" class="row small">
        <span class="dim">Yön farkı (°)</span>
        <input type="number" step="15" class="input" style="width: 80px" :value="layer.path.orientOffset || 0" @input="set('orientOffset', Number($event.target.value))" />
        <span class="dim">sola bakan model için 180</span>
      </div>
      <div class="row wrap">
        <span class="dim small grow">{{ layer.path.points.length }} nokta</span>
        <button class="btn sm" @click="addEnd">＋ Sona nokta</button>
        <button class="btn sm" @click="reverse">⇄ Ters</button>
        <button class="btn sm danger" @click="remove">Yolu kaldır</button>
      </div>
      <p class="dim small">
        Sahnede: noktayı sürükle · Ctrl + yola tıkla: nokta ekle · Alt + noktaya tıkla: sil ·
        katmanı sürükle: tüm yolu taşı. <b>ilerleme</b> keyframe'leri hızı belirler (easing ile).
      </p>
    </template>
  </div>
</template>

<style scoped>
.pe { display: grid; gap: 8px; }
.wrap { flex-wrap: wrap; gap: 6px 12px; }
</style>
