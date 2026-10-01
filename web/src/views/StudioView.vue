<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { api } from '../api.js';
import { resources, loadResources } from '../resources.js';
import { ensureSceneFonts } from '../fonts.js';
import { AudioPlayer, loadAudio } from '../audio.js';
import { useLive } from '../live.js';
import { toast, toastError } from '../toast.js';
import { renderFrame, formatMapping } from '../engine/renderer.js';
import { samplePath, pathAt, nearestOnPath } from '../engine/path.js';
import { prop as sampleProp } from '../engine/anim.js';
import { newAssetLayer, newTextLayer, newParticleLayer, newArrowLayer, newWidgetLayer, newCharacterLayer, layerFromComponent, setPropAt, valueAt, clone } from '../sceneOps.js';
import { exportPng, downloadBlob } from '../export/mp4.js';
import { prepareMedia } from '../media.js';
import { slug } from '../slug.js';
import Timeline from '../components/studio/Timeline.vue';
import Inspector from '../components/studio/Inspector.vue';
import NotesPanel from '../components/studio/NotesPanel.vue';
import ExportDialog from '../components/studio/ExportDialog.vue';
import AssetPicker from '../components/studio/AssetPicker.vue';
import HistoryPanel from '../components/studio/HistoryPanel.vue';
import ContentPanel from '../components/studio/ContentPanel.vue';
import PublishPanel from '../components/studio/PublishPanel.vue';
import { matchComponent } from '../componentTags.js';

const props = defineProps({ id: { type: String, required: true } });
const router = useRouter();

const scene = ref(null);
const notes = ref([]);
const res = resources;
const loadError = ref('');

const time = ref(0);
const playing = ref(false);
const speed = ref(1);
const loop = ref(true);
const muted = ref(false);
const player = new AudioPlayer();
function startAudio() {
  if (muted.value || !scene.value) return player.stop();
  player.play(toRaw(scene.value), () => time.value, speed.value);
}
// Ses dosyalarını önceden çöz (oynat'a basınca gecikme olmasın)
watch(() => (scene.value?.audio || []).map((a) => a.file).join('|'), () => {
  for (const a of scene.value?.audio || []) if (a.file) loadAudio(a.file).catch(() => {});
});

const selectedId = ref(null);
const selectedNoteId = ref(null);
const rightTab = ref('inspector');
const showSafe = ref(false);
const showGrid = ref(false);
const showPins = ref(true);
const pinMode = ref(false);
const pendingPos = ref(null);
const showExport = ref(false);
const showPicker = ref(false);
const externalChange = ref(false);

const dirty = ref(false);
let lastSavedJson = '';
const undoStack = [];
const redoStack = [];
const historyTick = ref(0);
let lastKey = null;
let lastEditAt = 0;

const stageWrap = ref(null);
const canvas = ref(null);
const overlay = ref(null);
const notesPanel = ref(null);
const timeline = ref(null);
const tlInfo = ref('');
const fitK = ref(0.3);
const userZoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const viewK = computed(() => fitK.value * userZoom.value);
// Çoklu format: null = ana sahne; aksi hâlde scene.formats içindeki id
const activeFormat = ref(null);
const formatObj = computed(() => (activeFormat.value ? (scene.value?.formats || []).find((f) => f.id === activeFormat.value) || null : null));
const outW = computed(() => formatObj.value?.width ?? scene.value?.width ?? 1080);
const outH = computed(() => formatObj.value?.height ?? scene.value?.height ?? 1920);
const fmap = () => formatMapping(scene.value, formatObj.value);
watch(formatObj, (f) => {
  if (!f && activeFormat.value) activeFormat.value = null;
  nextTick(fit);
});
let handles = null; // seçili katmanın tutamakları (cihaz pikseli)
let pathHandles = null; // seçili katmanın yol noktaları (cihaz pikseli)
let frameInfo = { layers: [] };
let ro;

const fps = computed(() => scene.value?.fps || 30);
const duration = computed(() => scene.value?.duration || 1);
const frame = computed(() => Math.round(time.value * fps.value));
const totalFrames = computed(() => Math.round(duration.value * fps.value));
const openNotes = computed(() => notes.value.filter((n) => n.status !== 'done').length);
const missingAssets = computed(() => {
  const lib = res.value.assets;
  const out = [];
  for (const l of scene.value?.layers || []) {
    if (!l.type && !lib.has(l.asset)) out.push(l.asset);
    // Ok: stil öğesi ve yolcu modeli kütüphanede olmalı (parçacıkların yerleşik yedekleri var)
    if (l.type === 'arrow') {
      if (l.arrow && !lib.has(l.arrow)) out.push(l.arrow);
      if (l.rider?.asset && !lib.has(l.rider.asset)) out.push(l.rider.asset);
    }
  }
  return out;
});

// ------------------------------------------------------------------ yükleme
async function loadLib() {
  await loadResources();
}

async function load() {
  try {
    const [p] = await Promise.all([api.project(props.id), loadLib()]);
    scene.value = p.scene;
    notes.value = p.notes;
    lastSavedJson = JSON.stringify(p.scene);
    dirty.value = false;
    await nextTick();
    fit();
  } catch (e) {
    loadError.value = e.message;
  }
}

useLive(async (evt) => {
  try {
    if (evt.kind === 'notes' && evt.id === props.id) {
      notes.value = await api.notes(props.id);
    } else if (evt.kind === 'scene' && evt.id === props.id) {
      const p = await api.project(props.id);
      const json = JSON.stringify(p.scene);
      if (json === lastSavedJson) return; // kendi kaydımız
      if (dirty.value) {
        externalChange.value = true;
        return;
      }
      applyExternal(p.scene, json);
    }
  } catch (e) {
    console.warn(e);
  }
});

function applyExternal(sc, json) {
  pushUndo();
  scene.value = sc;
  lastSavedJson = json || JSON.stringify(sc);
  dirty.value = false;
  externalChange.value = false;
  if (selectedId.value && selectedId.value !== '__camera' && !sc.layers.some((l) => l.id === selectedId.value)) {
    selectedId.value = null;
  }
  toast('Sahne diskte güncellendi → önizleme yenilendi (Ctrl+Z ile geri alınabilir)', 'ok', 4500);
  requestRender();
}

async function reloadFromDisk() {
  const p = await api.project(props.id);
  applyExternal(p.scene);
}

// ------------------------------------------------------------------ geçmiş
function pushUndo() {
  if (!scene.value) return;
  undoStack.push(JSON.stringify(toRaw(scene.value)));
  if (undoStack.length > 150) undoStack.shift();
  redoStack.length = 0;
  historyTick.value++;
}

/** Tüm sahne değişiklikleri buradan geçer: geri al kaydı + kirli bayrağı + yeniden çiz. */
function edit(fn, key) {
  const now = Date.now();
  if (!(key && key === lastKey && now - lastEditAt < 800)) pushUndo();
  lastKey = key || null;
  lastEditAt = now;
  fn();
  dirty.value = true;
  requestRender();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(toRaw(scene.value)));
  scene.value = JSON.parse(undoStack.pop());
  dirty.value = JSON.stringify(toRaw(scene.value)) !== lastSavedJson;
  lastKey = null;
  historyTick.value++;
  requestRender();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(toRaw(scene.value)));
  scene.value = JSON.parse(redoStack.pop());
  dirty.value = JSON.stringify(toRaw(scene.value)) !== lastSavedJson;
  lastKey = null;
  historyTick.value++;
  requestRender();
}
const canUndo = computed(() => historyTick.value >= 0 && undoStack.length > 0);
const canRedo = computed(() => historyTick.value >= 0 && redoStack.length > 0);

async function save() {
  if (!scene.value) return;
  try {
    const raw = toRaw(scene.value);
    await api.saveScene(props.id, raw);
    lastSavedJson = JSON.stringify(raw);
    dirty.value = false;
    externalChange.value = false;
    toast('Kaydedildi', 'ok', 1500);
  } catch (e) {
    toastError(e);
  }
}

// ------------------------------------------------------------------- render
let renderQueued = false;
function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function fit() {
  const w = stageWrap.value;
  const s = scene.value;
  if (!w || !s) return;
  const pad = 24;
  fitK.value = Math.max(0.05, Math.min((w.clientWidth - pad * 2) / outW.value, (w.clientHeight - pad * 2) / outH.value));
  requestRender();
}

function render() {
  const c = canvas.value;
  const s = scene.value;
  if (!c || !s) return;
  const dpr = window.devicePixelRatio || 1;
  const k = viewK.value;
  const w = Math.round(outW.value * k * dpr);
  const h = Math.round(outH.value * k * dpr);
  for (const el of [c, overlay.value]) {
    if (el.width !== w || el.height !== h) {
      el.width = w;
      el.height = h;
    }
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  prepareMedia(toRaw(s), time.value, res.value, { onUpdate: requestRender });
  frameInfo = renderFrame(ctx, toRaw(s), time.value, res.value, { format: formatObj.value ? toRaw(formatObj.value) : null, only: onlySet.value });
  drawOverlay();
}

function drawOverlay() {
  const o = overlay.value;
  const s = scene.value;
  if (!o || !s) return;
  const ctx = o.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const k = viewK.value * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, o.width, o.height);
  const W = outW.value;
  const H = outH.value;

  if (showGrid.value) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const f of [1 / 3, 2 / 3]) {
      ctx.moveTo(W * f * k, 0);
      ctx.lineTo(W * f * k, H * k);
      ctx.moveTo(0, H * f * k);
      ctx.lineTo(W * k, H * f * k);
    }
    ctx.stroke();
  }

  if (showSafe.value) {
    ctx.save();
    if (H > W * 1.4) {
      // 9:16 Reels / Shorts / TikTok arayüz bölgeleri
      const zones = [
        [0, 0, W, H * 0.12, 'üst arayüz'],
        [0, H * 0.78, W, H * 0.22, 'açıklama / altyazı'],
        [W * 0.86, H * 0.45, W * 0.14, H * 0.33, 'butonlar'],
      ];
      for (const [x, y, w, h, label] of zones) {
        ctx.fillStyle = 'rgba(229,72,77,0.18)';
        ctx.fillRect(x * k, y * k, w * k, h * k);
        ctx.fillStyle = 'rgba(255,200,200,0.9)';
        ctx.font = `${11 * dpr}px Inter, sans-serif`;
        ctx.fillText(label, x * k + 6 * dpr, y * k + 14 * dpr);
      }
    }
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.lineWidth = dpr;
    for (const [m, col] of [[0.05, 'rgba(255,255,255,0.45)'], [0.1, 'rgba(242,193,78,0.6)']]) {
      ctx.strokeStyle = col;
      ctx.strokeRect(W * m * k, H * m * k, W * (1 - 2 * m) * k, H * (1 - 2 * m) * k);
    }
    ctx.restore();
  }

  // Seçili katman çerçevesi
  const info = frameInfo.layers.find((l) => l.id === selectedId.value);
  if (info) {
    const { matrix: m, bbox: b } = info;
    const pts = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(([x, y]) => m.transformPoint(new DOMPoint(x, y)));
    ctx.save();
    ctx.strokeStyle = '#ea7a3b';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([5 * dpr, 4 * dpr]);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    const layer = s.layers.find((l) => l.id === selectedId.value);
    handles = null;
    if (layer && !info.nohandles) {
      // Yol varsa katmanın merkezi yol üzerindeki anlık konumdur
      const pp = layer.path?.points?.length >= 2 ? pathAt(layer.path, sampleProp(layer, 'pathT', time.value, 0)) : null;
      const x = pp ? pp.x : sampleProp(layer, 'x', time.value, 0);
      const y = pp ? pp.y : sampleProp(layer, 'y', time.value, 0);
      const o = camToScreen(x, y);
      const origin = [o[0] * k, o[1] * k];
      ctx.fillStyle = '#ea7a3b';
      ctx.beginPath();
      ctx.arc(origin[0], origin[1], 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      if (!info.nohit) {
        // Köşe (ölçek) ve üst (döndürme) tutamakları
        const top = [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2];
        const c = [(pts[0].x + pts[2].x) / 2, (pts[0].y + pts[2].y) / 2];
        const dl = Math.hypot(top[0] - c[0], top[1] - c[1]) || 1;
        const rot = [top[0] + ((top[0] - c[0]) / dl) * 26 * dpr, top[1] + ((top[1] - c[1]) / dl) * 26 * dpr];
        ctx.strokeStyle = '#ea7a3b';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(top[0], top[1]);
        ctx.lineTo(rot[0], rot[1]);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(rot[0], rot[1], 5.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const hs = 4.5 * dpr;
        for (const p of pts) {
          ctx.fillRect(p.x - hs, p.y - hs, hs * 2, hs * 2);
          ctx.strokeRect(p.x - hs, p.y - hs, hs * 2, hs * 2);
        }
        handles = { corners: pts.map((p) => [p.x, p.y]), rot, origin };
      }
    }
    ctx.restore();
  } else {
    handles = null;
  }

  // Klasör seçiliyse üyelerinin çerçeveleri
  if (selectedGroup.value) {
    ctx.save();
    ctx.strokeStyle = 'rgba(234, 122, 59, 0.8)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    for (const li of frameInfo.layers) {
      if (li.group !== selectedGroup.value) continue;
      const b = li.bbox;
      const q = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(([x, y]) => li.matrix.transformPoint(new DOMPoint(x, y)));
      ctx.beginPath();
      q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hareket yolu (seçili katman)
  pathHandles = null;
  const sl = s.layers.find((l) => l.id === selectedId.value);
  if (sl?.path?.points?.length >= 2) {
    const P = sl.path;
    const toDev = ([x, y]) => camToScreen(x, y).map((v) => v * k);
    const { pts } = samplePath(P);
    ctx.save();
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.9)';
    ctx.lineWidth = 2 * dpr;
    ctx.setLineDash([7 * dpr, 5 * dpr]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = toDev(p);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    // Başlangıç / bitiş okları yerine küçük yön işaretleri
    const dev = P.points.map(toDev);
    dev.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? '#6cc28a' : i === dev.length - 1 && !P.closed ? '#e5686d' : '#fff';
      ctx.strokeStyle = '#7c5cff';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 6.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2a1f5c';
      ctx.font = `bold ${9 * dpr}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y + 0.5 * dpr);
    });
    // Şu anki konum
    const cur = pathAt(P, sampleProp(sl, 'pathT', time.value, 0));
    const [cx, cy] = toDev([cur.x, cur.y]);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(cx, cy, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    pathHandles = { layer: sl, pts: dev };
  }

  // Not iğneleri
  if (showPins.value) {
    const pins = notes.value.filter((n) => n.pos && (n.id === selectedNoteId.value || Math.abs(n.t - time.value) < 0.75));
    for (const n of pins) drawPin(ctx, toOut(...n.pos)[0] * k, toOut(...n.pos)[1] * k, dpr, n.status === 'done' ? '#6cc28a' : '#f2c14e', n.id === selectedNoteId.value);
  }
  if (pendingPos.value) drawPin(ctx, toOut(...pendingPos.value)[0] * k, toOut(...pendingPos.value)[1] * k, dpr, '#22d3ee', true);
}

function drawPin(ctx, x, y, dpr, color, strong) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = strong ? '#fff' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.arc(x, y - 14 * dpr, 9 * dpr, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2a1f05';
  ctx.font = `bold ${11 * dpr}px Inter`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✎', x, y - 14 * dpr);
  ctx.restore();
}

/** Çıktı (ekran) koordinatı → sahne (dünya) koordinatı: camToScreen'in tersi */
function screenToWorld(ox, oy) {
  const [fx, fy] = fromOut(ox, oy);
  const s = scene.value;
  const cam = s.camera || {};
  const t = time.value;
  const z = sampleProp(cam, 'zoom', t, 1);
  const cx = sampleProp(cam, 'x', t, s.width / 2);
  const cy = sampleProp(cam, 'y', t, s.height / 2);
  const r = (sampleProp(cam, 'rotation', t, 0) * Math.PI) / 180;
  const dx = fx - s.width / 2;
  const dy = fy - s.height / 2;
  return [cx + (dx * Math.cos(-r) - dy * Math.sin(-r)) / z, cy + (dx * Math.sin(-r) + dy * Math.cos(-r)) / z];
}

/** Ana kare koordinatı → seçili formatın çıktı koordinatı */
function toOut(x, y) {
  const m = fmap();
  return [m.tx + x * m.s, m.ty + y * m.s];
}
function fromOut(x, y) {
  const m = fmap();
  return [(x - m.tx) / m.s, (y - m.ty) / m.s];
}

/** Sahne (dünya) koordinatı → kamera uygulanmış, formata yerleştirilmiş çıktı koordinatı */
function camToScreen(x, y) {
  return toOut(...camToFrame(x, y));
}
function camToFrame(x, y) {
  const s = scene.value;
  const cam = s.camera || {};
  const t = time.value;
  const z = sampleProp(cam, 'zoom', t, 1);
  const cx = sampleProp(cam, 'x', t, s.width / 2);
  const cy = sampleProp(cam, 'y', t, s.height / 2);
  const r = (sampleProp(cam, 'rotation', t, 0) * Math.PI) / 180;
  const dx = (x - cx) * z;
  const dy = (y - cy) * z;
  return [s.width / 2 + dx * Math.cos(r) - dy * Math.sin(r), s.height / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
}

watch([time, selectedId, selectedNoteId, showGrid, showSafe, showPins, pendingPos], requestRender);
watch(scene, requestRender, { deep: true });
watch(resources, requestRender);
let fontTimer = 0;
watch([scene, resources], () => {
  clearTimeout(fontTimer);
  fontTimer = setTimeout(() => scene.value && ensureSceneFonts(toRaw(scene.value), res.value).then(requestRender), 150);
}, { deep: true });
watch(notes, requestRender, { deep: true });
watch(() => [scene.value?.width, scene.value?.height], () => nextTick(fit));

// ----------------------------------------------------------------- oynatma
let raf = 0;
let last = 0;
function tick(now) {
  if (!playing.value) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let t = time.value + dt * speed.value;
  if (t >= duration.value) {
    if (loop.value) {
      t = t % duration.value;
      time.value = t;
      startAudio();
    } else {
      t = duration.value;
      playing.value = false;
    }
  }
  time.value = t;
  render();
  raf = requestAnimationFrame(tick);
}
function play() {
  if (!scene.value) return;
  if (time.value >= duration.value - 1e-3) time.value = 0;
  playing.value = true;
  last = performance.now();
  raf = requestAnimationFrame(tick);
  startAudio();
}
function pause() {
  playing.value = false;
  cancelAnimationFrame(raf);
  player.stop();
  // Duraklayınca kareye oturt
  time.value = Math.round(time.value * fps.value) / fps.value;
}
const togglePlay = () => (playing.value ? pause() : play());
function toggleMute() {
  muted.value = !muted.value;
  if (playing.value) startAudio();
}
// Oynarken hız ya da ses izleri değişirse sesi yeniden hizala
watch(speed, () => playing.value && startAudio());
watch(() => JSON.stringify([scene.value?.audio || [], scene.value?.sfx || null]), () => playing.value && startAudio());
function seek(t) {
  if (playing.value) pause();
  time.value = Math.max(0, Math.min(duration.value, t));
}
// İçerik panelinden bir katmana git: seç, görünür değilse başlangıç anına atla
function goLayer(id) {
  selectedId.value = id;
  const l = scene.value?.layers.find((x) => x.id === id);
  if (!l) return;
  const t0 = l.start ?? 0;
  const t1 = l.end ?? duration.value;
  if (time.value < t0 || time.value > t1) seek(Math.min(t0 + 0.8, t1));
}
const stepFrame = (n) => seek(Math.round((time.value + n / fps.value) * fps.value) / fps.value);

// ------------------------------------------------------- sahne etkileşimi
let drag = null;
function pointerPos(e) {
  const r = overlay.value.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}
function hitLayer(px, py) {
  const dpr = window.devicePixelRatio || 1;
  for (let i = frameInfo.layers.length - 1; i >= 0; i--) {
    const { id, matrix, bbox, nohit } = frameInfo.layers[i];
    if (nohit) continue;
    const p = matrix.inverse().transformPoint(new DOMPoint(px * dpr, py * dpr));
    if (bbox.hitPath) {
      // Ok: yalnızca yola yakın tıklama
      const k = Math.hypot(matrix.a, matrix.b) || 1;
      const tol = bbox.hitW / 2 + (8 * dpr) / k;
      const P = bbox.hitPath;
      for (let j = 1; j < P.length; j++) {
        const [ax, ay] = P[j - 1];
        const [bx, by] = P[j];
        const dx = bx - ax;
        const dy = by - ay;
        const u = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(p.x - ax - dx * u, p.y - ay - dy * u) <= tol) return id;
      }
      continue;
    }
    if (p.x >= bbox.x0 && p.x <= bbox.x1 && p.y >= bbox.y0 && p.y <= bbox.y1) return id;
  }
  return null;
}
function handleAt(px, py) {
  if (!handles) return null;
  const dpr = window.devicePixelRatio || 1;
  const X = px * dpr;
  const Y = py * dpr;
  const near = (p) => Math.hypot(p[0] - X, p[1] - Y) <= 9 * dpr;
  if (near(handles.rot)) return 'rotate';
  if (handles.corners.some(near)) return 'scale';
  return null;
}
function onStageDown(e) {
  if (!scene.value) return;
  const [px, py] = pointerPos(e);
  // Kaydırma: orta tuş ya da Alt + sürükle
  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    e.preventDefault();
    drag = { mode: 'pan', cx: e.clientX, cy: e.clientY, pan: { ...pan.value } };
    overlay.value.setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0) return;
  // Hareket yolu noktaları
  if (pathHandles && !pinMode.value) {
    const dpr = window.devicePixelRatio || 1;
    const X = px * dpr;
    const Y = py * dpr;
    const i = pathHandles.pts.findIndex(([x, y]) => Math.hypot(x - X, y - Y) <= 9 * dpr);
    const lay = pathHandles.layer;
    if (i >= 0 && e.altKey) {
      if (lay.path.points.length > 2) edit(() => lay.path.points.splice(i, 1));
      return;
    }
    if (i >= 0) {
      if (playing.value) pause();
      pushUndo();
      drag = { mode: 'pathpt', layer: lay, index: i };
      overlay.value.setPointerCapture(e.pointerId);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      const [wx, wy] = screenToWorld(px / viewK.value, py / viewK.value);
      const near = nearestOnPath(lay.path, wx, wy);
      const sc = sampleProp(scene.value.camera || {}, 'zoom', time.value, 1) * fmap().s * viewK.value;
      if (near.dist * sc <= 14) {
        edit(() => lay.path.points.splice(near.seg + 1, 0, [Math.round(wx), Math.round(wy)]));
        return;
      }
    }
  }
  const h = !pinMode.value && handleAt(px, py);
  if (h) {
    const layer = scene.value.layers.find((l) => l.id === selectedId.value);
    if (layer) {
      if (playing.value) pause();
      const dpr = window.devicePixelRatio || 1;
      const [ox, oy] = handles.origin;
      drag = {
        mode: h,
        layer,
        origin: handles.origin,
        dist0: Math.hypot(px * dpr - ox, py * dpr - oy) || 1,
        a0: Math.atan2(py * dpr - oy, px * dpr - ox),
        s0: valueAt(layer, 'scale', time.value),
        os0: formatObj.value?.overrides?.[layer.id]?.scale ?? 1,
        r0: valueAt(layer, 'rotation', time.value),
        moved: false,
      };
      overlay.value.setPointerCapture(e.pointerId);
      return;
    }
  }
  if (pinMode.value) {
    pendingPos.value = fromOut(px / viewK.value, py / viewK.value);
    pinMode.value = false;
    rightTab.value = 'notes';
    notesPanel.value?.focus();
    return;
  }
  const id = hitLayer(px, py);
  const grp = selectedGroup.value;
  const hitLayerObj = id && scene.value.layers.find((l) => l.id === id);
  if (grp && hitLayerObj?.group === grp) {
    if (playing.value) pause();
    const members = scene.value.layers.filter((l) => l.group === grp);
    drag = {
      mode: 'group',
      px,
      py,
      zoom: sampleProp(scene.value.camera || {}, 'zoom', time.value, 1) * fmap().s,
      members: members.map((l) => ({
        layer: l,
        orig: { x: clone(l.x ?? 0), y: clone(l.y ?? 0), pts: l.path ? l.path.points.map((p) => [...p]) : null },
      })),
      moved: false,
    };
    overlay.value.setPointerCapture(e.pointerId);
    return;
  }
  selectedId.value = id;
  if (!id) return;
  const layer = scene.value.layers.find((l) => l.id === id);
  if (!layer) return;
  if (playing.value) pause();
  const ov0 = formatObj.value?.overrides?.[layer.id] || {};
  drag = {
    mode: 'move',
    layer,
    px,
    py,
    x: valueAt(layer, 'x', time.value),
    y: valueAt(layer, 'y', time.value),
    ovx: ov0.dx || 0,
    ovy: ov0.dy || 0,
    pts0: layer.path ? layer.path.points.map((p) => [...p]) : null,
    zoom: sampleProp(scene.value.camera || {}, 'zoom', time.value, 1) * fmap().s,
    moved: false,
  };
  overlay.value.setPointerCapture(e.pointerId);
}
function onStageMove(e) {
  if (!drag) {
    if (scene.value && !pinMode.value) {
      const [px, py] = pointerPos(e);
      const h = handleAt(px, py);
      overlay.value.style.cursor = h === 'rotate' ? 'grab' : h === 'scale' ? 'nwse-resize' : e.altKey ? 'grab' : hitLayer(px, py) ? 'move' : 'default';
    }
    return;
  }
  const [px, py] = pointerPos(e);
  if (drag.mode === 'pan') {
    pan.value = { x: drag.pan.x + e.clientX - drag.cx, y: drag.pan.y + e.clientY - drag.cy };
    return;
  }
  if (drag.mode === 'group') {
    const dx = (px - drag.px) / (viewK.value * drag.zoom);
    const dy = (py - drag.py) / (viewK.value * drag.zoom);
    if (!drag.moved && Math.hypot(dx, dy) < 2) return;
    if (!drag.moved) {
      pushUndo();
      drag.moved = true;
    }
    for (const m of drag.members) shiftLayer(m.layer, m.orig, dx, dy);
    dirty.value = true;
    requestRender();
    return;
  }
  if (drag.mode === 'pathpt') {
    const [wx, wy] = screenToWorld(px / viewK.value, py / viewK.value);
    drag.layer.path.points[drag.index] = [Math.round(wx), Math.round(wy)];
    dirty.value = true;
    requestRender();
    return;
  }
  if (drag.mode === 'scale' || drag.mode === 'rotate') {
    const dpr = window.devicePixelRatio || 1;
    const [ox, oy] = drag.origin;
    if (!drag.moved) {
      pushUndo();
      drag.moved = true;
    }
    const eps = 0.5 / fps.value;
    if (drag.mode === 'scale') {
      const d = Math.hypot(px * dpr - ox, py * dpr - oy);
      if (formatObj.value) {
        const ov = formatOverride(drag.layer.id);
        ov.scale = Math.max(0.05, Math.round(drag.os0 * (d / drag.dist0) * 100) / 100);
      } else {
        setPropAt(drag.layer, 'scale', Math.max(0.01, Math.round(drag.s0 * (d / drag.dist0) * 100) / 100), time.value, eps);
      }
    } else {
      let r = drag.r0 + ((Math.atan2(py * dpr - oy, px * dpr - ox) - drag.a0) * 180) / Math.PI;
      r = e.shiftKey ? Math.round(r / 15) * 15 : Math.round(r * 10) / 10;
      setPropAt(drag.layer, 'rotation', r, time.value, eps);
    }
    dirty.value = true;
    requestRender();
    return;
  }
  const dx = (px - drag.px) / (viewK.value * drag.zoom);
  const dy = (py - drag.py) / (viewK.value * drag.zoom);
  if (!drag.moved && Math.hypot(dx, dy) < 2) return;
  if (!drag.moved) {
    pushUndo();
    drag.moved = true;
  }
  const eps = 0.5 / fps.value;
  if (formatObj.value) {
    // Bu formata özel düzeltme: ana sahne değişmez
    const ov = formatOverride(drag.layer.id);
    ov.dx = Math.round(drag.ovx + dx);
    ov.dy = Math.round(drag.ovy + dy);
  } else {
    if (drag.pts0) {
      drag.layer.path.points = drag.pts0.map(([x, y]) => [Math.round(x + dx), Math.round(y + dy)]);
    } else {
      setPropAt(drag.layer, 'x', Math.round(drag.x + dx), time.value, eps);
      setPropAt(drag.layer, 'y', Math.round(drag.y + dy), time.value, eps);
    }
  }
  dirty.value = true;
  requestRender();
}
function formatOverride(id) {
  const f = formatObj.value;
  f.overrides ||= {};
  return (f.overrides[id] ||= {});
}
function onStageUp() {
  drag = null;
}
function onStageWheel(e) {
  if (!scene.value) return;
  if (e.ctrlKey) {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const z = Math.max(0.25, Math.min(8, userZoom.value * f));
    const real = z / userZoom.value;
    const r = stageWrap.value.getBoundingClientRect();
    const cx = r.left + r.width / 2 + pan.value.x;
    const cy = r.top + r.height / 2 + pan.value.y;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    pan.value = { x: pan.value.x + dx * (1 - real), y: pan.value.y + dy * (1 - real) };
    userZoom.value = z;
  } else if (userZoom.value > 1.001) {
    e.preventDefault();
    pan.value = { x: pan.value.x - e.deltaX, y: pan.value.y - e.deltaY };
  }
}
function fitView() {
  userZoom.value = 1;
  pan.value = { x: 0, y: 0 };
}
watch(userZoom, requestRender);

// ------------------------------------------------------------ katman ekle
const pickerCat = ref('');

// Solo (yalnız önizleme; kaydedilmez): katman id'leri ya da "g:<klasör>"
const solo = ref([]);
function toggleSolo(id) {
  solo.value = solo.value.includes(id) ? solo.value.filter((x) => x !== id) : [...solo.value, id];
  requestRender();
}
watch(solo, requestRender);
const onlySet = computed(() => {
  if (!solo.value.length || !scene.value) return null;
  const set = new Set();
  for (const id of solo.value) {
    if (id.startsWith('g:')) for (const l of scene.value.layers) l.group === id.slice(2) && set.add(l.id);
    else set.add(id);
  }
  return set;
});
const selectedGroup = computed(() => (selectedId.value?.startsWith('__group:') ? selectedId.value.slice(8) : null));
function newGroup() {
  const name = prompt('Klasör adı:', 'Yeni klasör');
  if (!name) return;
  const used = new Set((scene.value.groups || []).map((g) => g.id));
  let i = 1;
  while (used.has(`klasor-${i}`)) i++;
  const id = `klasor-${i}`;
  const layer = scene.value.layers.find((l) => l.id === selectedId.value);
  edit(() => {
    (scene.value.groups ||= []).push({ id, name: name.trim() });
    if (layer) layer.group = id;
  });
  selectedId.value = '__group:' + id;
  rightTab.value = 'inspector';
}
/** Katmanın tüm hareketini (x/y keyframe'leri ya da yol noktaları) dx, dy kadar kaydırır */
function shiftLayer(layer, orig, dx, dy) {
  if (orig.pts) {
    layer.path.points = orig.pts.map(([x, y]) => [Math.round(x + dx), Math.round(y + dy)]);
    return;
  }
  for (const [k, d] of [['x', dx], ['y', dy]]) {
    const o = orig[k];
    if (Array.isArray(o)) layer[k] = o.map((key) => ({ ...key, v: Math.round(key.v + d) }));
    else layer[k] = Math.round((o ?? 0) + d);
  }
}
function addAsset(asset) {
  const layer =
    asset.type === 'particles'
      ? newParticleLayer(scene.value, time.value, asset.id)
      : asset.type === 'arrow'
        ? newArrowLayer(scene.value, time.value, asset.id, selectedId.value, res.value?.assets)
        : newAssetLayer(scene.value, asset, time.value);
  edit(() => scene.value.layers.push(layer));
  selectedId.value = layer.id;
  showPicker.value = false;
  rightTab.value = 'inspector';
}
function addText() {
  const layer = newTextLayer(scene.value, time.value);
  edit(() => scene.value.layers.push(layer));
  selectedId.value = layer.id;
  rightTab.value = 'inspector';
}
const showWidgetMenu = ref(false);
const compQ = ref('');
const compList = computed(() => {
  const rows = res.value.components.map((c) => ({ c, s: matchComponent(c, compQ.value, {}, res.value.taxonomy) })).filter((x) => x.s > 0);
  if (compQ.value.trim()) rows.sort((a, b) => b.s - a.s);
  return rows.map((x) => x.c);
});
const compTip = (c) => [c.description, ...['amac', 'ton'].map((f) => (c.etiketler?.[f] || []).map((v) => res.value.taxonomy[f]?.degerler?.[v]?.ad || v).join(', '))].filter(Boolean).join(' · ');
function addWidget(type, comp) {
  const layer = comp ? layerFromComponent(scene.value, comp, time.value) : newWidgetLayer(scene.value, type, time.value);
  edit(() => scene.value.layers.push(layer));
  selectedId.value = layer.id;
  rightTab.value = 'inspector';
  showWidgetMenu.value = false;
}
const showCharMenu = ref(false);
const charList = computed(() => [...res.value.characters.values()].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, 'tr')));
function addCharacter(c) {
  const same = scene.value.layers.filter((l) => l.type === 'karakter').length;
  const layer = newCharacterLayer(scene.value, c, time.value, same);
  edit(() => scene.value.layers.push(layer));
  selectedId.value = layer.id;
  rightTab.value = 'inspector';
  showCharMenu.value = false;
}
function addParticles() {
  // Parçacık efektleri kütüphanededir: seçiciyi "efektler" kategorisiyle aç
  pickerCat.value = 'efektler';
  showPicker.value = true;
}
function addArrow() {
  // Ok stilleri kütüphanededir: seçiciyi "oklar" kategorisiyle aç (seçili katmandan başlar)
  pickerCat.value = 'oklar';
  showPicker.value = true;
}
function toggleHidden(id) {
  const l = scene.value.layers.find((x) => x.id === id);
  if (l) edit(() => (l.hidden ? delete l.hidden : (l.hidden = true)));
}
function deleteSelectedLayer() {
  const i = scene.value.layers.findIndex((l) => l.id === selectedId.value);
  if (i < 0) return;
  edit(() => scene.value.layers.splice(i, 1));
  selectedId.value = null;
}

// ----------------------------------------------------------------- notlar
const applying = ref(false);
/** Açık notları sunucudan Claude API ile uygula (ANTHROPIC_API_KEY gerekir) */
async function applyNotesApi() {
  if (dirty.value) return toast('Önce kaydet (Ctrl+S): uygulama sahneyi diskten yeniler', 'info');
  applying.value = true;
  try {
    const r = await api.applyNotes(props.id);
    toast(`${r.applied.length}/${r.open} not uygulandı`, 'ok');
  } catch (e) {
    toastError(e);
  } finally {
    applying.value = false;
  }
}
async function addNote(n) {
  try {
    const created = await api.addNote(props.id, n);
    if (!notes.value.some((x) => x.id === created.id)) notes.value.push(created);
    pendingPos.value = null;
    selectedNoteId.value = created.id;
    toast('Not eklendi', 'ok', 1500);
    // Notun karesini sunucuya kaydet: Claude notu işlerken ne görüldüğünü bilir
    const png = await exportPng(clone(toRaw(scene.value)), res.value, created.t, 0.5);
    await api.saveSnapshot(props.id, created.id, png);
  } catch (e) {
    toastError(e);
  }
}
async function updateNote(n, patch) {
  try {
    Object.assign(n, await api.updateNote(props.id, n.id, patch));
  } catch (e) {
    toastError(e);
  }
}
async function deleteNote(n) {
  if (!confirm('Not silinsin mi?')) return;
  try {
    await api.deleteNote(props.id, n.id);
    notes.value = notes.value.filter((x) => x.id !== n.id);
  } catch (e) {
    toastError(e);
  }
}
function goNote(n) {
  seek(n.t);
  selectedNoteId.value = n.id;
  if (n.layerId && scene.value.layers.some((l) => l.id === n.layerId)) selectedId.value = n.layerId;
}
function selectNote(id) {
  const n = notes.value.find((x) => x.id === id);
  if (!n) return;
  rightTab.value = 'notes';
  goNote(n);
}

// -------------------------------------------------------------- JSON sekmesi
const jsonText = ref('');
const jsonErr = ref('');
const jsonEditing = ref(false);
function refreshJson() {
  if (scene.value) jsonText.value = JSON.stringify(toRaw(scene.value), null, 2);
  jsonErr.value = '';
  jsonEditing.value = false;
}
watch(rightTab, (t) => t === 'json' && refreshJson());
watch(scene, () => rightTab.value === 'json' && !jsonEditing.value && refreshJson(), { deep: true });
function applyJson() {
  try {
    const obj = JSON.parse(jsonText.value);
    if (!obj.width || !obj.height || !Array.isArray(obj.layers)) throw new Error('width, height ve layers alanları gerekli');
    edit(() => (scene.value = obj));
    jsonEditing.value = false;
    toast('Sahne JSON uygulandı', 'ok');
  } catch (e) {
    jsonErr.value = e.message;
  }
}

// ----------------------------------------------------------------- diğer
async function snapshot() {
  try {
    const blob = await exportPng(clone(toRaw(scene.value)), res.value, time.value);
    downloadBlob(blob, `${slug(scene.value.name)}-${time.value.toFixed(2)}s.png`);
  } catch (e) {
    toastError(e);
  }
}
/** Şu anki kareyi (önizleme kaplamaları olmadan, tam çıktı çözünürlüğünde) PNG olarak indirir. */
function saveFrame() {
  const s = scene.value;
  if (!s) return;
  const W = outW.value;
  const H = outH.value;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  prepareMedia(toRaw(s), time.value, res.value, { onUpdate: requestRender });
  renderFrame(ctx, toRaw(s), time.value, res.value, { format: formatObj.value ? toRaw(formatObj.value) : null, only: onlySet.value });
  c.toBlob((blob) => {
    if (!blob) return toast('Kare kaydedilemedi', 'error');
    const name = `${props.id}-${time.value.toFixed(2).replace('.', '_')}s.png`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Kare kaydedildi: ${name}`, 'ok', 2500);
  }, 'image/png');
}
function fullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else stageWrap.value?.requestFullscreen();
}

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}
function onKey(e) {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    e.shiftKey ? saveFrame() : save();
    return;
  }
  if (isTyping(e) || showExport.value || showPicker.value) return;
  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if (mod && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
    if (timeline.value?.copy()) e.preventDefault();
    return;
  }
  if (mod && e.key.toLowerCase() === 'v') {
    if (timeline.value?.paste()) e.preventDefault();
    return;
  }
  if (mod && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
    return;
  }
  if (mod) return;
  switch (e.code) {
    case 'Space': e.preventDefault(); togglePlay(); break;
    case 'ArrowLeft': e.preventDefault(); e.shiftKey ? seek(time.value - 1) : stepFrame(-1); break;
    case 'ArrowRight': e.preventDefault(); e.shiftKey ? seek(time.value + 1) : stepFrame(1); break;
    case 'Home': seek(0); break;
    case 'End': seek(duration.value); break;
    case 'KeyL': loop.value = !loop.value; break;
    case 'KeyM': toggleMute(); break;
    case 'Digit0': fitView(); break;
    case 'KeyG': showGrid.value = !showGrid.value; break;
    case 'KeyS': showSafe.value = !showSafe.value; break;
    case 'KeyF': fullscreen(); break;
    case 'KeyN': e.preventDefault(); rightTab.value = 'notes'; notesPanel.value?.focus(); break;
    case 'KeyP': pinMode.value = !pinMode.value; break;
    case 'Delete':
    case 'Backspace':
      if (!timeline.value?.deleteSelected()) deleteSelectedLayer();
      break;
    case 'Escape': pinMode.value = false; selectedId.value = null; break;
  }
}
function onBeforeUnload(e) {
  if (dirty.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKey);
  window.addEventListener('beforeunload', onBeforeUnload);
  ro = new ResizeObserver(fit);
  ro.observe(stageWrap.value);
  if (document.fonts?.ready) document.fonts.ready.then(requestRender);
  await load();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  player.stop();
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('beforeunload', onBeforeUnload);
  ro?.disconnect();
});
onBeforeRouteLeave(() => !dirty.value || confirm('Kaydedilmemiş değişiklikler var. Çıkılsın mı?'));

const fmt = (t) => {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(2).padStart(5, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
};
</script>

<template>
  <div v-if="loadError" class="load-err">
    <p class="err">{{ loadError }}</p>
    <button class="btn" @click="router.push('/')">Projelere dön</button>
  </div>
  <div v-else class="studio">
    <header class="bar">
      <button class="btn ghost" title="Projeler" @click="router.push('/')">←</button>
      <div class="title">
        <strong>{{ scene?.name || '…' }}</strong>
        <span v-if="dirty" class="chip warn">kaydedilmedi</span>
        <span v-else-if="scene" class="chip ok">kaydedildi</span>
        <span v-if="scene" class="dim small">{{ outW }}×{{ outH }} · {{ scene.fps }}fps · {{ scene.duration }}s</span>
        <select v-if="scene?.formats?.length" v-model="activeFormat" class="input fmt-sel" title="Önizleme / düzenleme formatı — formattayken sürüklemek yalnızca o formatı düzeltir">
          <option :value="null">Ana ({{ scene.width }}×{{ scene.height }})</option>
          <option v-for="f in scene.formats" :key="f.id" :value="f.id">{{ f.name || f.id }} ({{ f.width }}×{{ f.height }})</option>
        </select>
        <span v-if="formatObj" class="chip warn" title="Sürükleme / ölçekleme bu formata özel düzeltme olarak kaydedilir">format düzenleme</span>
      </div>
      <div class="grow" />
      <button class="btn icon" :disabled="!canUndo" title="Geri al (Ctrl+Z)" @click="undo">↶</button>
      <button class="btn icon" :disabled="!canRedo" title="Yinele (Ctrl+Y)" @click="redo">↷</button>
      <button class="btn" @click="pickerCat = ''; showPicker = true">＋ Kütüphane</button>
      <button class="btn" @click="addText">＋ Metin</button>
      <button class="btn" title="Konfeti, kar, yağmur, kabarcık…" @click="addParticles">＋ Parçacık</button>
      <button class="btn" title="Nesneden nesneye geçiş oku (seçili katmandan en yakın nesneye)" @click="addArrow">＋ Ok</button>
      <span class="wmenu">
        <button class="btn" title="Grafik, cihaz, resim / video, ses dalgası, kart, liste, kod, zamanlayıcı" @click="showWidgetMenu = !showWidgetMenu">＋ Bileşen ▾</button>
        <span v-if="showWidgetMenu" class="wpop" @mouseleave="showWidgetMenu = false">
          <button class="btn sm" @click="addWidget('chart')">📊 Grafik / sayaç</button>
          <button class="btn sm" @click="addWidget('device')">📱 Cihaz çerçevesi</button>
          <button class="btn sm" @click="addWidget('media')">🖼 Resim / video</button>
          <button class="btn sm" @click="addWidget('waveform')">🎚 Ses dalgası</button>
          <button class="btn sm" @click="addWidget('kart')">🪪 Kart (alıntı, fiyat, profil…)</button>
          <button class="btn sm" @click="addWidget('liste')">📋 Liste / tablo</button>
          <button class="btn sm" @click="addWidget('kod')">💻 Kod penceresi</button>
          <button class="btn sm" @click="addWidget('zaman')">⏱ Zamanlayıcı</button>
          <button class="btn sm" @click="addWidget('balon')">💭 Balon / not (düşünce, yorum…)</button>
          <span class="wsep">Kayıtlı bileşenler</span>
          <input v-model="compQ" class="input wq" placeholder="Ara: ad, etiket, anlam…" @keydown.stop />
          <span v-if="!compList.length" class="dim small wnone">{{ res.components.length ? 'Eşleşen yok' : 'Henüz yok' }}</span>
          <span class="wlist">
            <button v-for="c in compList" :key="c.id" class="btn sm" :title="compTip(c)" @click="addWidget(c.type, c)">{{ c.name || c.id }}</button>
          </span>
          <RouterLink class="btn sm ghost" to="/bilesenler" target="_blank">⚙ Bileşenleri yönet</RouterLink>
        </span>
      </span>
      <span class="wmenu">
        <button class="btn" title="Konuşan, yürüyen, tepki veren karakterler" @click="showCharMenu = !showCharMenu">＋ Karakter ▾</button>
        <span v-if="showCharMenu" class="wpop" @mouseleave="showCharMenu = false">
          <button v-for="c in charList" :key="c.id" class="btn sm" :title="c.description" @click="addCharacter(c)">🧍 {{ c.name || c.id }}</button>
          <span v-if="!charList.length" class="dim small wnone">Henüz karakter yok</span>
          <RouterLink class="btn sm ghost" to="/karakterler" target="_blank">⚙ Karakterleri yönet</RouterLink>
        </span>
      </span>
      <button class="btn" :disabled="!dirty" @click="save">Kaydet</button>
      <button class="btn primary" @click="showExport = true">⬇ Dışa aktar</button>
    </header>

    <div v-if="externalChange" class="banner ext">
      Sahne dosyası diskte değişti (ör. Claude düzenledi) ama sizin kaydedilmemiş değişiklikleriniz var.
      <button class="btn sm" @click="reloadFromDisk">Diskten yükle</button>
      <button class="btn sm ghost" @click="externalChange = false">Yok say</button>
    </div>
    <div v-if="missingAssets.length" class="banner warn">
      Kütüphanede bulunamayan varlıklar: <b class="mono">{{ [...new Set(missingAssets)].join(', ') }}</b>
    </div>

    <section class="stage-col">
      <div ref="stageWrap" class="stage" :class="{ pin: pinMode }" @wheel="onStageWheel">
        <div class="canvas-box" :style="scene ? { width: `${outW * viewK}px`, height: `${outH * viewK}px`, transform: `translate(${pan.x}px, ${pan.y}px)` } : {}">
          <canvas ref="canvas" class="main-canvas" />
          <canvas
            ref="overlay"
            class="overlay"
            @pointerdown="onStageDown"
            @auxclick.prevent
            @pointermove="onStageMove"
            @pointerup="onStageUp"
            @pointercancel="onStageUp"
            @dblclick="rightTab = 'inspector'"
          />
        </div>
        <div v-if="pinMode" class="pin-hint">📍 Notu iğnelemek için sahnede bir noktaya tıklayın (Esc: vazgeç)</div>
      </div>

      <div class="transport">
        <button class="btn icon ghost" title="Başa (Home)" @click="seek(0)">⏮</button>
        <button class="btn icon ghost" title="Önceki kare (←)" @click="stepFrame(-1)">◀︎|</button>
        <button class="btn icon play" :title="playing ? 'Durdur (Space)' : 'Oynat (Space)'" @click="togglePlay">{{ playing ? '❚❚' : '▶' }}</button>
        <button class="btn icon ghost" title="Sonraki kare (→)" @click="stepFrame(1)">|▶︎</button>
        <button class="btn icon ghost" title="Sona (End)" @click="seek(duration)">⏭</button>
        <div class="tc mono">
          <span class="now">{{ fmt(time) }}</span><span class="dim"> / {{ fmt(duration) }}</span>
          <span class="dim fr">kare {{ frame }}/{{ totalFrames }}</span>
          <span v-if="tlInfo" class="tl-info">{{ tlInfo }}</span>
          <button v-if="solo.length" class="btn sm solo-chip" title="Solo süzgecini kaldır" @click="solo = []">SOLO ×</button>
        </div>
        <input
          class="scrub grow"
          type="range"
          min="0"
          :max="duration"
          :step="1 / fps"
          :value="time"
          @input="seek(Number($event.target.value))"
        />
        <select v-model.number="speed" class="input speed" title="Oynatma hızı">
          <option v-for="s in [0.25, 0.5, 1, 1.5, 2]" :key="s" :value="s">{{ s }}×</option>
        </select>
        <button class="btn sm" :class="{ on: loop }" title="Döngü (L)" @click="loop = !loop">⟲</button>
        <button class="btn sm" :class="{ on: !muted }" :title="muted ? 'Sesi aç (M)' : 'Sessiz (M)'" @click="toggleMute">{{ muted ? '🔇' : '🔊' }}</button>
        <span class="sep" />
        <button class="btn sm" :class="{ on: showSafe }" title="Güvenli alan / Reels arayüzü (S)" @click="showSafe = !showSafe">Güvenli alan</button>
        <button class="btn sm" :class="{ on: showGrid }" title="Üçte bir ızgarası (G)" @click="showGrid = !showGrid">#</button>
        <button class="btn sm" :class="{ on: showPins }" title="Not iğnelerini göster" @click="showPins = !showPins">📍</button>
        <button class="btn sm" title="Bu kareyi PNG kaydet" @click="snapshot">PNG</button>
        <button class="btn sm" title="Sahneyi sığdır (0) · Ctrl+tekerlek: yakınlaş · Alt/orta tuş + sürükle: kaydır" @click="fitView">{{ Math.round(userZoom * 100) }}%</button>
        <button class="btn sm" title="Tam ekran (F)" @click="fullscreen">⛶</button>
      </div>
    </section>

    <aside class="side">
      <div class="tabs">
        <button :class="{ active: rightTab === 'inspector' }" @click="rightTab = 'inspector'">Denetçi</button>
        <button :class="{ active: rightTab === 'content' }" title="Metinler ve görseller — tek yerden düzenle" @click="rightTab = 'content'">İçerik</button>
        <button :class="{ active: rightTab === 'publish' }" title="Başlık, açıklama, etiketler — platforma kopyala" @click="rightTab = 'publish'">Paylaşım</button>
        <button :class="{ active: rightTab === 'notes' }" @click="rightTab = 'notes'">
          Notlar <span v-if="openNotes" class="chip warn">{{ openNotes }}</span>
        </button>
        <button :class="{ active: rightTab === 'json' }" @click="rightTab = 'json'">JSON</button>
        <button :class="{ active: rightTab === 'history' }" @click="rightTab = 'history'">Geçmiş</button>
      </div>
      <div class="side-body">
        <Inspector
          v-if="rightTab === 'inspector' && scene"
          :scene="scene"
          :selected-id="selectedId"
          :t="time"
          :res="res"
          :edit="edit"
          @select="(id) => (selectedId = id)"
        />
        <ContentPanel
          v-else-if="rightTab === 'content' && scene"
          :scene="scene"
          :res="res"
          :selected-id="selectedId"
          :edit="edit"
          @go="goLayer"
        />
        <PublishPanel v-else-if="rightTab === 'publish' && scene" :scene="scene" :edit="edit" :project-id="id" />
        <NotesPanel
          v-else-if="rightTab === 'notes'"
          ref="notesPanel"
          :notes="notes"
          :t="time"
          :selected-id="selectedId"
          :selected-note-id="selectedNoteId"
          :pin-mode="pinMode"
          :pending-pos="pendingPos"
          :applying="applying"
          @add="addNote"
          @apply="applyNotesApi"
          @update="updateNote"
          @delete="deleteNote"
          @go="goNote"
          @toggle-pin-mode="pinMode = !pinMode"
          @clear-pos="pendingPos = null"
        />
        <HistoryPanel v-else-if="rightTab === 'history'" :project-id="id" :res="res" :t="time" :dirty="dirty" @restored="reloadFromDisk" />
        <div v-else-if="rightTab === 'json'" class="json-tab">
          <textarea v-model="jsonText" class="input mono json" spellcheck="false" @input="jsonEditing = true" @keydown.stop />
          <div class="row">
            <span v-if="jsonErr" class="err grow">{{ jsonErr }}</span>
            <span v-else class="dim small grow">{{ jsonEditing ? 'Düzenleniyor — uygulamak için "Uygula"' : 'Canlı sahne JSON' }}</span>
            <button class="btn sm" @click="refreshJson">Yenile</button>
            <button class="btn sm primary" :disabled="!jsonEditing" @click="applyJson">Uygula</button>
          </div>
        </div>
      </div>
    </aside>

    <section class="tl">
      <Timeline
        v-if="scene"
        :scene="scene"
        :time="time"
        :selected-id="selectedId"
        :notes="notes"
        :selected-note-id="selectedNoteId"
        @seek="seek"
        @select="(id) => { selectedId = id; rightTab = rightTab === 'json' ? 'inspector' : rightTab; }"
        ref="timeline"
        :edit="edit"
        :solo="solo"
        @solo="toggleSolo"
        @new-group="newGroup"
        @save-frame="saveFrame"
        @select-note="selectNote"
        @toggle-hidden="toggleHidden"
        @info="(m) => (tlInfo = m)"
      />
    </section>

    <ExportDialog v-if="showExport && scene" :project-id="id" :scene="scene" :res="res" :initial-format="activeFormat" @close="showExport = false" />
    <AssetPicker v-if="showPicker" :lib="res.assets" :initial-cat="pickerCat" @pick="addAsset" @close="showPicker = false" />
  </div>
</template>

<style scoped>
.wmenu { position: relative; display: inline-block; }
.wpop { position: absolute; top: 100%; left: 0; z-index: 30; display: grid; gap: 4px; padding: 6px; min-width: 170px;
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
.wpop .btn { text-align: left; }
.studio {
  display: grid; height: 100%;
  grid-template-columns: minmax(0, 1fr) 400px;
  grid-template-rows: 48px auto auto minmax(0, 1fr) 250px;
  grid-template-areas: 'bar bar' 'b1 b1' 'b2 b2' 'stage side' 'tl side';
}
.load-err { padding: 40px; display: grid; gap: 12px; justify-items: start; }
.bar { grid-area: bar; display: flex; align-items: center; gap: 8px; padding: 0 10px; border-bottom: 1px solid var(--line); background: var(--bg-2); }
.title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.fmt-sel { width: auto; height: 28px; font-size: 12px; }
.banner { grid-area: b1; padding: 8px 14px; background: #2d2512; color: var(--warn); border-bottom: 1px solid #6b5520; display: flex; gap: 10px; align-items: center; }
.banner.warn { grid-area: b2; background: #2e1a1a; color: #ff9c9c; border-color: #6b2b2b; }
.stage-col { grid-area: stage; display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.stage {
  flex: 1; min-height: 0; display: grid; place-items: center; position: relative; overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, #221c16, #120f0c);
}
.stage:fullscreen { background: #000; }
.canvas-box { position: relative; box-shadow: 0 20px 60px rgba(0,0,0,.55); }
.main-canvas, .overlay { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.stage.pin .overlay { cursor: crosshair !important; }
.pin-hint { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: #0e3a44; color: #bff3ff; padding: 6px 12px; border-radius: 8px; font-size: 12px; }
.transport {
  display: flex; align-items: center; gap: 6px; padding: 6px 10px;
  border-top: 1px solid var(--line); background: var(--bg-2);
}
.play { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); width: 38px; height: 34px; font-size: 14px; }
.play:hover { background: var(--accent-2); }
.tc { font-size: 13px; min-width: 190px; display: flex; gap: 4px; align-items: baseline; }
.tc .now { color: var(--text); font-size: 15px; }
.tc .fr { margin-left: 8px; font-size: 11px; }
.tl-info { margin-left: 8px; font-size: 11px; color: var(--accent-2); }
.solo-chip { margin-left: 8px; height: 20px; color: var(--warn); border-color: #6b5520; }
.scrub { accent-color: var(--accent); min-width: 80px; }
.speed { width: 64px; height: 28px; }
.sep { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
.side { grid-area: side; border-left: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; min-height: 0; }
.wsep { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-3); padding: 6px 4px 0; }
.wnone { padding: 0 4px; }
.wq { margin: 2px 0; }
.wlist { display: grid; gap: 4px; max-height: 240px; overflow: auto; }
.side .tabs { padding: 0 4px; }
.side .tabs button { padding: 10px 7px 8px; font-size: 13px; }
.side-body { flex: 1; overflow: auto; min-height: 0; }
.json-tab { display: flex; flex-direction: column; gap: 8px; padding: 10px; height: 100%; }
.json { flex: 1; resize: none; min-height: 300px; line-height: 1.45; font-size: 11.5px; }
.tl { grid-area: tl; border-top: 1px solid var(--line); min-height: 0; background: var(--bg); }
</style>
