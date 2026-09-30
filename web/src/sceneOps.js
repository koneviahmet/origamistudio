// Sahne JSON'u üzerinde saf yardımcı işlemler (keyframe ekle/sil, özellik yaz, şablonlar).
import { isTrack, sample, keyIndexAt } from './engine/anim.js';
import { PROP_DEFAULTS } from './engine/renderer.js';

export const PRESETS = [
  { id: 'reels', label: 'Reels / Shorts / TikTok — 9:16', width: 1080, height: 1920 },
  { id: 'youtube', label: 'YouTube — 16:9', width: 1920, height: 1080 },
  { id: 'square', label: 'Instagram kare — 1:1', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Instagram gönderi — 4:5', width: 1080, height: 1350 },
];

export function presetOf(scene) {
  return PRESETS.find((p) => p.width === scene.width && p.height === scene.height)?.id || 'custom';
}

export function newScene(name, preset = 'reels') {
  const p = PRESETS.find((x) => x.id === preset) || PRESETS[0];
  return {
    name,
    width: p.width,
    height: p.height,
    fps: 30,
    duration: 8,
    background: { type: 'linear', colors: ['#fdf0dc', '#f6c9a0'], angle: 180, paper: 0.5, vignette: 0.2 },
    camera: { zoom: 1 },
    layers: [],
  };
}

export function uid(prefix, scene) {
  const used = new Set((scene.layers || []).map((l) => l.id));
  let i = 1;
  while (used.has(`${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
}

export function newAssetLayer(scene, asset, t) {
  const t0 = Math.round(t * 10) / 10;
  return {
    id: uid(asset.id, scene),
    asset: asset.id,
    x: Math.round(scene.width / 2),
    y: Math.round(scene.height / 2),
    scale: Math.round((Math.min(scene.width, scene.height) * 0.35) / Math.max(...(asset.size || [200, 200])) * 100) / 100,
    fold: [{ t: t0, v: 0 }, { t: t0 + 1.2, v: 1, ease: 'linear' }],
    foldStyle: { order: 'radial', spread: 0.6 },
  };
}

export function newTextLayer(scene, t) {
  return {
    id: uid('metin', scene),
    type: 'text',
    text: 'Yeni metin',
    x: Math.round(scene.width / 2),
    y: Math.round(scene.height * 0.2),
    size: Math.round(scene.width * 0.08),
    weight: 700,
    color: '#5b3a29',
    opacity: [{ t: Math.round(t * 10) / 10, v: 0 }, { t: Math.round(t * 10) / 10 + 0.5, v: 1 }],
  };
}

export function newParticleLayer(scene, t, particle = 'konfeti') {
  const t0 = Math.round(t * 10) / 10;
  return {
    id: uid(particle, scene),
    type: 'particles',
    particle,
    mode: particle === 'konfeti' ? 'patlama' : 'surekli',
    x: Math.round(scene.width / 2),
    y: Math.round(scene.height * 0.4),
    start: t0,
    end: t0 + 3.5,
  };
}

/**
 * Ok katmanı. Uçlar: seçili katmandan en yakın katmana; yoksa sahnedeki son iki nesne;
 * hiçbiri yoksa ortada serbest iki nokta.
 */
export function newArrowLayer(scene, t, arrow = 'ok-kavis', selectedId = null, assets = null) {
  const t0 = Math.round(t * 10) / 10;
  const W = scene.width;
  const H = scene.height;
  const cands = (scene.layers || []).filter(
    (l) => (!l.type || l.type === 'text') && (l.start == null || l.start <= t) && (l.end == null || l.end >= t),
  );
  // Kaba kutu (varlık boyutu × ölçek, çapa) → merkez; arka plan gibi seçileni içine alan katmanlar elenir
  const box = (l) => {
    const a = !l.type && assets?.get(l.asset);
    const x = valueAt(l, 'x', t);
    const y = valueAt(l, 'y', t);
    if (!a) return { cx: x, cy: y, x0: x, y0: y, x1: x, y1: y };
    const s = Math.abs(valueAt(l, 'scale', t));
    const [w, h] = (a.size || [200, 200]).map((v) => v * s);
    const [ax, ay] = l.anchor || [0.5, 0.5];
    const x0 = x - ax * w;
    const y0 = y - ay * h;
    return { cx: x0 + w / 2, cy: y0 + h / 2, x0, y0, x1: x0 + w, y1: y0 + h };
  };
  const pos = (l) => {
    const b = box(l);
    return [b.cx, b.cy];
  };
  let from = [Math.round(W * 0.3), Math.round(H * 0.55)];
  let to = [Math.round(W * 0.7), Math.round(H * 0.45)];
  const sel = cands.find((l) => l.id === selectedId);
  if (sel && cands.length > 1) {
    const [sx, sy] = pos(sel);
    // Önce nesneler (origami), metinler yalnızca nesne kalmazsa
    const rank = (l) => (l.type === 'text' ? 1e6 : 0);
    const [cx, cy] = pos(sel);
    const encloses = (l) => {
      const b = box(l);
      return b.x1 > b.x0 && cx > b.x0 && cx < b.x1 && cy > b.y0 && cy < b.y1;
    };
    const pool = cands.filter((l) => l !== sel && !encloses(l));
    const other = (pool.length ? pool : cands.filter((l) => l !== sel)).sort((a, b) => {
      const [ax, ay] = pos(a);
      const [bx, by] = pos(b);
      return rank(a) + Math.hypot(ax - sx, ay - sy) - rank(b) - Math.hypot(bx - sx, by - sy);
    })[0];
    from = sel.id;
    to = other.id;
  } else {
    const objs = cands.filter((l) => !l.type);
    const pool = objs.length >= 2 ? objs : cands;
    if (pool.length >= 2) {
      from = pool[pool.length - 2].id;
      to = pool[pool.length - 1].id;
    }
  }
  return {
    id: uid('ok', scene),
    type: 'arrow',
    arrow,
    from,
    to,
    fold: [{ t: t0, v: 0 }, { t: t0 + 1.2, v: 1, ease: 'inOutSine' }],
  };
}

export function valueAt(obj, name, t) {
  return sample(obj[name], t, PROP_DEFAULTS[name] ?? 0);
}

/**
 * Özelliği t anında value yapar. Özellik keyframe'li ise o anki keyframe güncellenir
 * (yoksa eklenir); sabitse doğrudan değer değişir.
 */
export function setPropAt(obj, name, value, t, eps) {
  const v = obj[name];
  if (isTrack(v)) {
    const i = keyIndexAt(v, t, eps);
    if (i >= 0) v[i].v = value;
    else insertKey(v, { t: round3(t), v: value });
  } else {
    obj[name] = value;
  }
}

export function hasKeyAt(obj, name, t, eps) {
  return keyIndexAt(obj[name], t, eps) >= 0;
}

/** ◆ düğmesi: t anında keyframe varsa siler, yoksa (mevcut değerle) ekler. */
export function toggleKeyAt(obj, name, t, eps) {
  const cur = valueAt(obj, name, t);
  const v = obj[name];
  if (isTrack(v)) {
    const i = keyIndexAt(v, t, eps);
    if (i >= 0) {
      v.splice(i, 1);
      if (v.length === 0) obj[name] = cur;
      else if (v.length === 1) obj[name] = v[0].v;
    } else {
      insertKey(v, { t: round3(t), v: cur });
    }
  } else {
    obj[name] = [{ t: round3(t), v: cur }];
  }
}

export function setEaseAt(obj, name, t, easeName, eps) {
  const i = keyIndexAt(obj[name], t, eps);
  if (i >= 0) obj[name][i].ease = easeName;
}

function insertKey(track, key) {
  const i = track.findIndex((k) => k.t > key.t);
  if (i < 0) track.push(key);
  else track.splice(i, 0, key);
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/** Zaman çizelgesi için bir katmandaki tüm keyframe zamanlarını toplar. */
export function layerKeyTimes(layer) {
  const out = [];
  const scan = (obj, prefix) => {
    for (const k in obj) {
      if (isTrack(obj[k])) for (const key of obj[k]) out.push({ t: key.t, prop: prefix + k });
    }
  };
  scan(layer, '');
  if (layer.parts) for (const p in layer.parts) scan(layer.parts[p], `${p}.`);
  return out;
}

/** Bir nesnedeki (katman / kamera) tüm keyframe izleri; parçalar "parca.ozellik" yolu ile */
export function trackRefs(obj) {
  const out = [];
  const scan = (o, prefix) => {
    for (const k in o) if (isTrack(o[k])) out.push({ path: prefix + k, owner: o, prop: k, track: o[k] });
  };
  scan(obj, '');
  if (obj.parts) for (const p in obj.parts) scan(obj.parts[p], `${p}.`);
  return out;
}

/** t anındaki keyframe nesneleri (tüm izlerde) */
export function keysAt(obj, t, eps = 1e-3) {
  const out = [];
  for (const r of trackRefs(obj)) for (const k of r.track) if (Math.abs(k.t - t) <= eps) out.push({ ...r, key: k });
  return out;
}

/** t anındaki keyframe'leri siler; tek keyframe kalan iz sabit değere döner */
export function removeKeysAt(obj, t, eps = 1e-3) {
  for (const r of trackRefs(obj)) {
    const rest = r.track.filter((k) => Math.abs(k.t - t) > eps);
    if (rest.length === r.track.length) continue;
    r.owner[r.prop] = rest.length === 0 ? sample(r.track, t, 0) : rest.length === 1 ? rest[0].v : rest;
  }
}

/** Yol ("x" ya da "kanat.scaleY") üzerinden keyframe yazar (varsa değiştirir) */
export function putKey(obj, path, t, v, easeName) {
  let owner = obj;
  let prop = path;
  if (path.includes('.')) {
    const [part, p] = path.split('.');
    obj.parts ||= {};
    owner = obj.parts[part] ||= {};
    prop = p;
  }
  const key = { t: round3(t), v: JSON.parse(JSON.stringify(v)) };
  if (easeName) key.ease = easeName;
  if (isTrack(owner[prop])) {
    const i = owner[prop].findIndex((k) => Math.abs(k.t - key.t) < 1e-3);
    if (i >= 0) owner[prop][i] = key;
    else insertKey(owner[prop], key);
  } else {
    owner[prop] = [key];
  }
}

export function sortTracks(obj) {
  for (const r of trackRefs(obj)) r.track.sort((a, b) => a.t - b.t);
}

/** fold izinin başlangıç / bitiş zamanı (açılma aralığı) */
export function foldSpan(layer) {
  if (!isTrack(layer.fold)) return null;
  return [layer.fold[0].t, layer.fold[layer.fold.length - 1].t];
}

export function clone(o) {
  return JSON.parse(JSON.stringify(o));
}
