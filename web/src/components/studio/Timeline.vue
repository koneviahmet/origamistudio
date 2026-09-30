<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { layerKeyTimes, foldSpan, keysAt, removeKeysAt, putKey, sortTracks } from '../../sceneOps.js';
import { PRESETS } from '../../engine/presets.js';
import { TEXT_ANIMS } from '../../engine/textanims.js';
import { loadAudio, trackSpan } from '../../audio.js';
import { beatTimes } from '../../beats.js';
import { TRANSITIONS, transitionWindow } from '../../engine/transitions.js';
import WaveBar from './WaveBar.vue';

const ANIM_COLORS = { giris: '#6cc28a', cikis: '#e5686d', surekli: '#5aa9e6', hareket: '#b48cf2' };
const SNAP_PX = 8;

const props = defineProps({
  scene: { type: Object, required: true },
  time: { type: Number, required: true },
  selectedId: { type: String, default: null },
  notes: { type: Array, default: () => [] },
  selectedNoteId: { type: String, default: null },
  edit: { type: Function, required: true },
  solo: { type: Array, default: () => [] },
});
const emit = defineEmits(['seek', 'select', 'select-note', 'toggle-hidden', 'info', 'solo', 'new-group']);

const scroller = ref(null);
const viewW = ref(800);
const zoom = ref(1);
let ro;

onMounted(() => {
  ro = new ResizeObserver(() => (viewW.value = scroller.value?.clientWidth || 800));
  ro.observe(scroller.value);
});
onBeforeUnmount(() => {
  ro?.disconnect();
  window.removeEventListener('pointermove', dragMove);
});

const fps = computed(() => props.scene.fps || 30);
const dur = computed(() => Math.max(0.1, props.scene.duration || 1));
const innerW = computed(() => Math.max(200, viewW.value * zoom.value - 16));
const pps = computed(() => innerW.value / dur.value);
const px = (t) => (t / dur.value) * innerW.value;
const pos = (t) => `${px(t)}px`;
const r3 = (n) => Math.round(n * 1000) / 1000;

const ticks = computed(() => {
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30];
  const step = steps.find((s) => s * pps.value >= 56) || 60;
  const out = [];
  for (let t = 0; t <= dur.value + 1e-6; t += step) out.push(r3(t));
  return { step, list: out };
});

function groupKeys(obj) {
  const m = new Map();
  for (const k of layerKeyTimes(obj)) {
    const kt = r3(k.t);
    if (!m.has(kt)) m.set(kt, []);
    m.get(kt).push(k.prop);
  }
  return [...m.entries()].map(([t, list]) => ({ t, props: list }));
}

const rows = computed(() =>
  [...(props.scene.layers || [])].reverse().map((l) => ({
    layer: l,
    start: l.start ?? 0,
    end: l.end ?? dur.value,
    fold: foldSpan(l),
    anims: [
      ...(l.anims || []).filter((a) => PRESETS[a.preset] && !a.off).map((a) => {
        const P = PRESETS[a.preset];
        const t0 = a.t ?? 0;
        const d = a.dur ?? P.dur;
        return { obj: a, t0, t1: d == null ? dur.value : Math.min(dur.value, t0 + d), color: ANIM_COLORS[P.cat], name: P.name };
      }),
      ...(l.textAnims || []).filter((a) => TEXT_ANIMS[a.preset] && !a.off).map((a) => {
        const A = TEXT_ANIMS[a.preset];
        const t0 = a.t ?? 0;
        const n = [...String(l.text || '')].filter((c) => !/\s/.test(c)).length;
        const span = A.cat === 'surekli' ? a.dur : (a.dur ?? A.dur) + (a.aralik ?? A.aralik ?? 0.05) * Math.max(0, n - 1);
        return { obj: a, t0, t1: span == null ? dur.value : Math.min(dur.value, t0 + span), color: ANIM_COLORS[A.cat], name: `${A.name} (metin)` };
      }),
    ],
    keys: groupKeys(l),
  })),
);
const camKeys = computed(() => groupKeys(props.scene.camera || {}));

// ------------------------------------------------------------ ses izleri
const audioDur = reactive({});
watch(
  () => (props.scene.audio || []).map((a) => a.file).join('|'),
  () => {
    for (const a of props.scene.audio || []) {
      if (a.file && audioDur[a.file] == null) loadAudio(a.file).then((b) => (audioDur[a.file] = b.duration)).catch(() => (audioDur[a.file] = 0));
    }
  },
  { immediate: true },
);
const audioRows = computed(() =>
  (props.scene.audio || []).map((tr) => {
    const start = tr.start ?? 0;
    const offset = tr.offset ?? 0;
    const full = audioDur[tr.file];
    const len = full == null ? 0 : Math.max(0, Math.min(full - offset, tr.dur ?? Infinity, dur.value - start));
    const beats = full == null ? [] : beatTimes(tr, { start, offset, len, end: start + len });
    return { tr, start, offset, len, beats };
  }),
);

// ------------------------------------------------------------ klasörler
// Klasör, üyelerinin en üsttekinin yerinde başlık olarak görünür; katlanınca üyeler gizlenir.
const groupsMap = computed(() => new Map((props.scene.groups || []).map((g) => [g.id, g])));
const display = computed(() => {
  const out = [];
  const seen = new Set();
  for (const r of rows.value) {
    const g = r.layer.group && groupsMap.value.get(r.layer.group);
    if (!g) {
      out.push({ kind: 'layer', r, depth: 0, key: r.layer.id });
      continue;
    }
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    const members = rows.value.filter((x) => x.layer.group === g.id);
    out.push({
      kind: 'group', g, members, key: 'g:' + g.id,
      a: Math.min(...members.map((m) => m.start)), b: Math.max(...members.map((m) => m.end)),
    });
    if (!g.collapsed) for (const m of members) out.push({ kind: 'layer', r: m, depth: 1, g, key: m.layer.id });
  }
  for (const g of props.scene.groups || []) if (!seen.has(g.id)) out.push({ kind: 'group', g, members: [], key: 'g:' + g.id, a: 0, b: 0 });
  return out;
});
const isSolo = (id) => props.solo.includes(id);
function groupSet(g, k, v) {
  props.edit(() => {
    if (v) g[k] = true;
    else delete g[k];
  });
}
function layerLock(l) {
  props.edit(() => (l.locked ? delete l.locked : (l.locked = true)));
}
function renameGroup(g) {
  const n = prompt('Klasör adı:', g.name || g.id);
  if (n) props.edit(() => (g.name = n.trim()));
}

// ------------------------------------------------------ geçiş / bölüm
const transRows = computed(() =>
  (props.scene.transitions || []).filter((tr) => TRANSITIONS[tr.type]).map((tr) => {
    const [a, b] = transitionWindow(tr);
    return { tr, a: Math.max(0, a), b: Math.min(dur.value, b), name: TRANSITIONS[tr.type].name };
  }),
);
const sectionRows = computed(() => {
  const s = [...(props.scene.sections || [])].sort((x, y) => x.t - y.t);
  return s.map((sec, i) => ({ sec, a: sec.t, b: i + 1 < s.length ? s[i + 1].t : dur.value }));
});

// -------------------------------------------------------------- seçim
const sel = ref(new Set()); // "katmanId|t"
const selKey = (id, t) => `${id}|${r3(t)}`;
const isSel = (id, t) => sel.value.has(selKey(id, t));
const objOf = (id) => (id === '__camera' ? props.scene.camera : props.scene.layers.find((l) => l.id === id));
watch(() => props.scene, () => (sel.value = new Set()));

// ---------------------------------------------------------- oynatma kafası
function timeFromEvent(e) {
  const r = scroller.value.querySelector('.inner').getBoundingClientRect();
  const t = ((e.clientX - r.left) / innerW.value) * dur.value;
  return Math.max(0, Math.min(dur.value, Math.round(t * fps.value) / fps.value));
}
let scrubbing = false;
function onDown(e) {
  if (e.button !== 0) return;
  scrubbing = true;
  if (!e.shiftKey) sel.value = new Set();
  e.currentTarget.setPointerCapture(e.pointerId);
  emit('seek', timeFromEvent(e));
}
function onMove(e) {
  if (scrubbing) emit('seek', timeFromEvent(e));
}
function onUp() {
  scrubbing = false;
}
// Sürükleme olayları window'dan dinlenir: keyframe kaydıkça eleman yeniden oluşsa da kopmaz
function listen() {
  window.addEventListener('pointermove', dragMove);
  window.addEventListener('pointerup', dragEnd, { once: true });
}

// ------------------------------------------------------------ sürükleme
// Tek mekanizma: keyframe grubu, animasyon bloğu ya da ses izi zamanda kaydırılır.
let drag = null;

/** Mıknatıs: kare ızgarası + oynatma kafası + diğer keyframe zamanları */
function snap(t, exclude, alt) {
  let best = Math.round(t * fps.value) / fps.value;
  if (alt) return best;
  const cands = [props.time, 0, dur.value];
  for (const r of rows.value) for (const k of r.keys) if (!exclude?.has(selKey(r.layer.id, k.t))) cands.push(k.t);
  for (const k of camKeys.value) if (!exclude?.has(selKey('__camera', k.t))) cands.push(k.t);
  for (const a of audioRows.value) for (const b of a.beats) cands.push(b.t);
  for (const s of props.scene.sections || []) cands.push(s.t);
  for (const tr of props.scene.transitions || []) cands.push(tr.t);
  let bd = SNAP_PX / pps.value;
  for (const c of cands) {
    if (Math.abs(c - t) < bd) {
      bd = Math.abs(c - t);
      best = c;
    }
  }
  return best;
}

function startKeyDrag(e, id, t) {
  e.stopPropagation();
  if (e.button !== 0) return;
  const k = selKey(id, t);
  if (e.shiftKey) {
    const s = new Set(sel.value);
    s.has(k) ? s.delete(k) : s.add(k);
    sel.value = s;
    return;
  }
  if (!sel.value.has(k)) sel.value = new Set([k]);
  emit('select', id);
  // Seçili grupların keyframe nesnelerini topla
  const items = [];
  for (const sk of sel.value) {
    const [lid, st] = sk.split('|');
    const obj = objOf(lid);
    if (!obj) continue;
    for (const ref of keysAt(obj, Number(st))) items.push({ key: ref.key, t0: ref.key.t, obj });
  }
  drag = { kind: 'keys', x0: e.clientX, anchor: t, items, moved: false, click: t };
  listen();
}

function startBlockDrag(e, target, field, t0, extra = {}) {
  e.stopPropagation();
  if (e.button !== 0) return;
  drag = { kind: 'block', x0: e.clientX, target, field, t0, anchor: t0, moved: false, ...extra };
  listen();
}

function dragMove(e) {
  if (!drag) return;
  const dxT = (e.clientX - drag.x0) / pps.value;
  if (!drag.moved && Math.abs(e.clientX - drag.x0) < 3) return;
  const exclude = drag.kind === 'keys' ? sel.value : null;
  const target = snap(Math.max(0, Math.min(dur.value, drag.anchor + dxT)), exclude, e.altKey);
  const delta = target - drag.anchor;
  props.edit(() => {
    if (drag.kind === 'keys') {
      for (const it of drag.items) it.key.t = r3(Math.max(0, Math.min(dur.value, it.t0 + delta)));
      for (const o of new Set(drag.items.map((i) => i.obj))) sortTracks(o);
    } else {
      drag.target[drag.field] = r3(Math.max(0, drag.t0 + delta));
    }
  }, `tl-drag-${drag.kind}`);
  drag.moved = true;
  drag.delta = delta;
  emit('info', `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} sn`);
}

function dragEnd() {
  window.removeEventListener('pointermove', dragMove);
  if (!drag) return;
  if (drag.kind === 'block' && drag.select) emit('select', drag.select);
  if (drag.kind === 'block' && !drag.moved && drag.click != null) emit('seek', drag.click);
  if (drag.kind === 'keys') {
    if (!drag.moved) {
      emit('seek', drag.click);
    } else {
      // Seçimi yeni zamanlara taşı
      const s = new Set();
      for (const sk of sel.value) {
        const [lid, st] = sk.split('|');
        s.add(selKey(lid, Number(st) + drag.delta));
      }
      sel.value = s;
    }
  }
  emit('info', '');
  drag = null;
}

// ----------------------------------------------- kopyala / yapıştır / sil
let clipboard = null;

function copy() {
  if (!sel.value.size) return false;
  const entries = [];
  let minT = Infinity;
  for (const sk of sel.value) {
    const [lid, st] = sk.split('|');
    const obj = objOf(lid);
    if (!obj) continue;
    for (const r of keysAt(obj, Number(st))) {
      entries.push({ path: r.path, t: r.key.t, v: r.key.v, ease: r.key.ease });
      minT = Math.min(minT, r.key.t);
    }
  }
  clipboard = entries.map((e) => ({ ...e, t: e.t - minT }));
  emit('info', `${sel.value.size} keyframe grubu kopyalandı`);
  setTimeout(() => emit('info', ''), 1500);
  return true;
}

function paste() {
  if (!clipboard?.length) return false;
  const obj = objOf(props.selectedId);
  if (!obj) {
    emit('info', 'Yapıştırmak için bir katman seçin');
    setTimeout(() => emit('info', ''), 1500);
    return true;
  }
  props.edit(() => {
    for (const c of clipboard) putKey(obj, c.path, Math.min(dur.value, props.time + c.t), c.v, c.ease);
  });
  sel.value = new Set([...new Set(clipboard.map((c) => c.t))].map((t) => selKey(props.selectedId, props.time + t)));
  return true;
}

function deleteSelected() {
  if (!sel.value.size) return false;
  props.edit(() => {
    for (const sk of sel.value) {
      const [lid, st] = sk.split('|');
      const obj = objOf(lid);
      if (obj) removeKeysAt(obj, Number(st));
    }
  });
  sel.value = new Set();
  return true;
}

function deleteAt(id, t) {
  const obj = objOf(id);
  if (obj) props.edit(() => removeKeysAt(obj, t));
}

defineExpose({ copy, paste, deleteSelected, hasSelection: () => sel.value.size > 0 });

function onWheel(e) {
  if (!e.ctrlKey) return;
  e.preventDefault();
  zoom.value = Math.max(1, Math.min(40, zoom.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
}

// Oynatırken oynatma kafasını görünür alanda tut
watch(() => props.time, (t) => {
  const s = scroller.value;
  if (!s || zoom.value <= 1 || drag) return;
  const x = px(t);
  if (x < s.scrollLeft || x > s.scrollLeft + s.clientWidth - 40) s.scrollLeft = x - 40;
});

const fmt = (t) => (ticks.value.step < 1 ? t.toFixed(ticks.value.step < 0.5 ? 2 : 1) : `${t}`) + 's';
</script>

<template>
  <div class="timeline">
    <div class="names">
      <div class="ruler-name row">
        <span class="label grow">Katmanlar</span>
        <button class="btn icon sm ghost" title="Yeni klasör (seçili katmanı içine alır)" @click="emit('new-group')">📁</button>
        <button class="btn icon sm ghost" title="Uzaklaş" @click="zoom = Math.max(1, zoom / 1.5)">−</button>
        <button class="btn icon sm ghost" title="Yakınlaş (Ctrl+tekerlek)" @click="zoom = Math.min(40, zoom * 1.5)">＋</button>
      </div>
      <div class="name" :class="{ sel: selectedId === '__transitions' }" @click="emit('select', '__transitions')">§ Bölümler</div>
      <div class="name" :class="{ sel: selectedId === '__transitions' }" @click="emit('select', '__transitions')">⧉ Geçişler</div>
      <div class="name cam" :class="{ sel: selectedId === '__camera' }" @click="emit('select', '__camera')">🎥 Kamera</div>
      <template v-for="d in display" :key="d.key">
        <div
          v-if="d.kind === 'group'"
          class="name group"
          :class="{ sel: selectedId === '__group:' + d.g.id, hidden: d.g.hidden }"
          @click="emit('select', '__group:' + d.g.id)"
          @dblclick="renameGroup(d.g)"
        >
          <button class="eye" :title="d.g.collapsed ? 'Aç' : 'Katla'" @click.stop="groupSet(d.g, 'collapsed', !d.g.collapsed)">{{ d.g.collapsed ? '▸' : '▾' }}</button>
          <span class="kind">📁</span>
          <span class="grow ell">{{ d.g.name || d.g.id }} <span class="dim">({{ d.members.length }})</span></span>
          <button class="tg" :class="{ on: isSolo('g:' + d.g.id) }" title="Solo: yalnız bu klasörü göster (önizleme)" @click.stop="emit('solo', 'g:' + d.g.id)">S</button>
          <button class="tg" :class="{ on: d.g.locked }" title="Kilitle (sahnede seçilemez)" @click.stop="groupSet(d.g, 'locked', !d.g.locked)">🔒</button>
          <button class="tg" :title="d.g.hidden ? 'Göster' : 'Gizle'" @click.stop="groupSet(d.g, 'hidden', !d.g.hidden)">{{ d.g.hidden ? '◌' : '●' }}</button>
        </div>
        <div
          v-else
          class="name"
          :class="{ sel: d.r.layer.id === selectedId, hidden: d.r.layer.hidden, sub: d.depth }"
          @click="emit('select', d.r.layer.id)"
        >
          <button class="eye" :title="d.r.layer.hidden ? 'Göster' : 'Gizle'" @click.stop="emit('toggle-hidden', d.r.layer.id)">
            {{ d.r.layer.hidden ? '◌' : '●' }}
          </button>
          <span class="kind">{{ d.r.layer.type === 'text' ? 'T' : d.r.layer.type === 'particles' ? '✦' : '◆' }}</span>
          <span class="grow ell">{{ d.r.layer.id }}</span>
          <button class="tg" :class="{ on: isSolo(d.r.layer.id) }" title="Solo: yalnız bu katmanı göster (önizleme)" @click.stop="emit('solo', d.r.layer.id)">S</button>
          <button class="tg" :class="{ on: d.r.layer.locked }" title="Kilitle (sahnede seçilemez)" @click.stop="layerLock(d.r.layer)">🔒</button>
        </div>
      </template>
      <div v-for="(a, i) in audioRows" :key="'au' + i" class="name audio" :class="{ hidden: a.tr.mute }" @click="emit('select', null)">
        <span class="kind">♪</span>
        <span class="grow ell">{{ a.tr.file }}</span>
      </div>
    </div>

    <div ref="scroller" class="scroller" @wheel="onWheel">
      <div class="inner" :style="{ width: innerW + 'px' }" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp">
        <div class="ruler">
          <div v-for="t in ticks.list" :key="t" class="tick" :style="{ left: pos(t) }">
            <span>{{ fmt(t) }}</span>
          </div>
          <button
            v-for="n in notes"
            :key="n.id"
            class="note-pin"
            :class="{ done: n.status === 'done', sel: n.id === selectedNoteId }"
            :style="{ left: pos(n.t) }"
            :title="n.text"
            @pointerdown.stop
            @click.stop="emit('select-note', n.id)"
          >✎</button>
        </div>
        <div class="row-track sections">
          <div
            v-for="(s, i) in sectionRows"
            :key="'s' + i"
            class="section"
            :class="{ odd: i % 2 }"
            :style="{ left: pos(s.a), width: `${Math.max(8, px(s.b) - px(s.a))}px` }"
            :title="`${s.sec.name} · ${s.sec.t}s — tıkla: git, sürükle: taşı`"
            @pointerdown="startBlockDrag($event, s.sec, 't', s.sec.t, { click: s.sec.t, select: '__transitions' })"
          >{{ s.sec.name }}</div>
        </div>
        <div class="row-track trans">
          <div
            v-for="(g, i) in transRows"
            :key="'g' + i"
            class="trans-bar"
            :class="{ off: g.tr.off }"
            :style="{ left: pos(g.a), width: `${Math.max(8, px(g.b) - px(g.a))}px` }"
            :title="`${g.name} · kesme ${g.tr.t}s — sürükleyerek kaydır`"
            @pointerdown="startBlockDrag($event, g.tr, 't', g.tr.t, { click: g.tr.t, select: '__transitions' })"
          ><span class="cut" :style="{ left: `${px(g.tr.t) - px(g.a)}px` }" /></div>
        </div>
        <div class="row-track cam">
          <button
            v-for="k in camKeys"
            :key="k.t"
            class="kf"
            :class="{ on: isSel('__camera', k.t) }"
            :style="{ left: pos(k.t) }"
            :title="`${k.t}s · ${k.props.join(', ')}`"
            @pointerdown="startKeyDrag($event, '__camera', k.t)"
            @contextmenu.prevent="deleteAt('__camera', k.t)"
          />
        </div>
        <template v-for="d in display" :key="d.key">
        <div v-if="d.kind === 'group'" class="row-track grp" :class="{ sel: selectedId === '__group:' + d.g.id, hidden: d.g.hidden }">
          <div v-if="d.members.length" class="gbar" :style="{ left: pos(d.a), width: `${Math.max(4, px(d.b) - px(d.a))}px` }" />
        </div>
        <div
          v-else
          class="row-track"
          :class="{ sel: d.r.layer.id === selectedId, hidden: d.r.layer.hidden || d.g?.hidden }"
        >
          <template v-for="r in [d.r]" :key="r.layer.id">
          <div class="bar" :style="{ left: pos(r.start), width: `${px(r.end) - px(r.start)}px` }" />
          <div
            v-for="(a, i) in r.anims"
            :key="'a' + i"
            class="anim-bar"
            :style="{ left: pos(a.t0), width: `${Math.max(6, px(a.t1) - px(a.t0))}px`, background: a.color }"
            :title="`${a.name} · ${a.t0}s — sürükleyerek kaydır`"
            @pointerdown="emit('select', r.layer.id); startBlockDrag($event, a.obj, 't', a.t0)"
          />
          <div v-if="r.fold" class="fold" :style="{ left: pos(r.fold[0]), width: `${px(r.fold[1]) - px(r.fold[0])}px` }" title="katlanma" />
          <button
            v-for="k in r.keys"
            :key="k.t"
            class="kf"
            :class="{ on: isSel(r.layer.id, k.t) }"
            :style="{ left: pos(k.t) }"
            :title="`${k.t}s · ${k.props.join(', ')}\nSürükle: taşı · Shift: çoklu seçim · Sağ tık: sil`"
            @pointerdown="startKeyDrag($event, r.layer.id, k.t)"
            @contextmenu.prevent="deleteAt(r.layer.id, k.t)"
          />
          </template>
        </div>
        </template>
        <div v-for="(a, i) in audioRows" :key="'au' + i" class="row-track audio" :class="{ hidden: a.tr.mute }">
          <div
            class="audio-bar"
            :style="{ left: pos(a.start), width: `${Math.max(6, px(a.start + a.len) - px(a.start))}px` }"
            :title="`${a.tr.file} · ${a.start}s — sürükleyerek kaydır`"
            @pointerdown="startBlockDrag($event, a.tr, 'start', a.start)"
          >
            <WaveBar :file="a.tr.file" :offset="a.offset" :len="a.len" :width="px(a.start + a.len) - px(a.start)" />
          </div>
          <div
            v-for="(b, j) in a.beats"
            :key="'b' + j"
            class="beat"
            :class="{ down: b.down }"
            :style="{ left: pos(b.t) }"
          />
        </div>
        <div class="playhead" :style="{ left: pos(time) }"><span /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline { display: grid; grid-template-columns: 190px 1fr; height: 100%; min-height: 0; overflow: auto; font-size: 12px; }
.names { border-right: 1px solid var(--line); background: var(--bg-2); position: sticky; left: 0; z-index: 3; }
.ruler-name { height: 28px; padding: 0 4px 0 10px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--bg-2); z-index: 2; }
.name {
  height: 24px; display: flex; align-items: center; gap: 6px; padding: 0 8px;
  cursor: pointer; border-bottom: 1px solid #2a241d; color: var(--text-2);
}
.name:hover { background: var(--panel); }
.name.sel { background: #3a281b; color: var(--text); }
.name.hidden { opacity: .45; }
.name.audio { color: #a9cdf5; }
.name.group { background: #231d16; color: var(--text); font-weight: 600; }
.name.sub { padding-left: 22px; }
.tg { background: none; border: none; cursor: pointer; color: var(--text-3); font-size: 10px; width: 16px; padding: 0; opacity: .45; }
.name:hover .tg, .tg.on { opacity: 1; }
.tg.on { color: var(--accent-2); }
.row-track.grp { background: rgba(255,255,255,.025); }
.gbar { position: absolute; top: 9px; height: 6px; border-radius: 3px; background: #5a4a38; }
.eye { background: none; border: none; cursor: pointer; color: var(--text-3); width: 14px; padding: 0; font-size: 10px; }
.kind { color: var(--accent-2); font-size: 10px; width: 10px; }
.ell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.scroller { overflow-x: auto; overflow-y: visible; position: relative; }
.inner { position: relative; min-height: 100%; cursor: text; padding-right: 16px; }
.ruler { height: 28px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--bg-2); z-index: 2; }
.tick { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--line-2); }
.tick span { position: absolute; left: 4px; top: 6px; color: var(--text-3); font-size: 10px; white-space: nowrap; }
.row-track { position: relative; height: 24px; border-bottom: 1px solid #2a241d; }
.row-track.sel { background: rgba(234, 122, 59, .07); }
.row-track.hidden { opacity: .4; }
.row-track.cam { background: rgba(255,255,255,.02); }
.row-track.audio { background: rgba(90, 169, 230, .05); }
.row-track.sections, .row-track.trans { background: rgba(224, 178, 91, .04); }
.section { position: absolute; top: 3px; height: 18px; padding: 0 6px; border-radius: 4px; font-size: 11px; line-height: 18px;
  background: #3b3322; color: #f2dca8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; border-left: 2px solid #e0b25b; }
.section.odd { background: #332c1e; }
.trans-bar { position: absolute; top: 5px; height: 14px; border-radius: 7px; cursor: ew-resize;
  background: linear-gradient(90deg, rgba(224,178,91,.15), rgba(224,178,91,.75), rgba(224,178,91,.15)); border: 1px solid #b8914a; }
.trans-bar.off { opacity: .35; }
.trans-bar .cut { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #fff3d1; }
.beat { position: absolute; top: 2px; bottom: 2px; width: 1px; background: rgba(170, 210, 255, .25); pointer-events: none; }
.beat.down { background: rgba(200, 230, 255, .6); width: 2px; }
.bar { position: absolute; top: 6px; height: 12px; background: #3a3128; border-radius: 3px; }
.row-track.sel .bar { background: #4d3a2a; }
.anim-bar { position: absolute; bottom: 1px; height: 6px; border-radius: 3px; opacity: .85; cursor: ew-resize; z-index: 1; }
.anim-bar:hover { opacity: 1; outline: 1px solid #fff; }
.fold { position: absolute; top: 6px; height: 12px; border-radius: 3px; background: linear-gradient(90deg, rgba(234,122,59,.15), rgba(234,122,59,.6)); pointer-events: none; }
.audio-bar { position: absolute; top: 3px; height: 18px; background: #1f3a55; border: 1px solid #3c6d99; border-radius: 4px; overflow: hidden; cursor: ew-resize; }
.kf {
  position: absolute; top: 7px; width: 10px; height: 10px; margin-left: -5px; padding: 0;
  background: var(--kf); border: 1px solid #1b120b; transform: rotate(45deg); cursor: grab; z-index: 2;
}
.kf:hover { background: #ffd9b8; }
.kf.on { background: #fff; outline: 2px solid var(--accent); }
.note-pin {
  position: absolute; top: 3px; margin-left: -9px; width: 18px; height: 20px; padding: 0;
  background: var(--note); color: #2a1f05; border: none; border-radius: 4px 4px 4px 0; cursor: pointer;
  font-size: 11px; z-index: 3;
}
.note-pin.done { background: #53735e; color: #d9f2e2; }
.note-pin.sel { outline: 2px solid #fff; }
.playhead { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px solid #ff5d5d; pointer-events: none; z-index: 4; }
.playhead span { position: absolute; top: 0; left: -7px; width: 12px; height: 12px; background: #ff5d5d; clip-path: polygon(0 0, 100% 0, 50% 100%); }
</style>
