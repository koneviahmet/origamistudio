// Ucuz yapısal denetim (ekran görüntüsü almadan):  npm run dogrula -- <proje-id>
// Kontroller: benzersiz id, varlık/efekt/tema/font/ses/ok stili var mı, ön ayar adları, Türkçe glif riski,
// 9:16 güvenli bölge, süre taşması, geçişte start/end hizası, okuma süresi. Çıkış kodu: hata varsa 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
if (!id) { console.log('Kullanım: npm run dogrula -- <proje-id>'); process.exit(1); }
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const scene = readJson(path.join(ROOT, 'data', 'projects', id, 'scene.json'));

const { PRESETS } = await import(pathToUrl(path.join(ROOT, 'web/src/engine/presets.js')));
function pathToUrl(p) { return 'file:///' + p.replace(/\\/g, '/'); }

const listIds = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : []);
const assets = new Set();
const LIB = path.join(ROOT, 'data', 'library');
for (const cat of fs.readdirSync(LIB)) for (const f of listIds(path.join(LIB, cat))) assets.add(`${cat}/${f}`), assets.add(f);
const effects = new Set(listIds(path.join(LIB, 'efektler')));
const arrows = new Set(listIds(path.join(LIB, 'oklar')));
const themes = new Set(listIds(path.join(ROOT, 'data', 'themes')));
const tstyles = new Set(listIds(path.join(ROOT, 'data', 'textstyles')));
const fonts = readJson(path.join(ROOT, 'data', 'fonts', 'fonts.json')).fonts;
const fontMap = new Map(fonts.map((f) => [f.family, f]));
const audioDir = path.join(ROOT, 'data', 'audio');
const BAD_FONTS = new Set(['Fredoka', 'Lilita One', 'Satisfy', 'Titan One']);
const TEXT_ANIMS = new Set(['harf-katla', 'harf-zipla', 'harf-dus', 'harf-don', 'harf-belir', 'kelime-zipla', 'satir-kay', 'dalga', 'titresim', 'harf-katla-cik', 'harf-dagil']);
const TRANS = new Set(['katlama', 'perde', 'iris', 'yirtik', 'sayfa-cevir', 'kaydir', 'yakinlas']);
const STYLES = new Set(['origami', 'kagit-kesme', 'duz', 'cizim', 'neon', 'cam', 'mozaik', 'teknik', 'vitray', 'kil', 'siluet', 'gazete', 'halftone', 'suluboya', 'nakis', 'piksel']);

const err = [];
const warn = [];
const E = (m) => err.push(m);
const Wn = (m) => warn.push(m);

// satır içi değilse kayıtlı tema var mı
if (typeof scene.theme === 'string' && !themes.has(scene.theme)) E(`tema yok: ${scene.theme}`);
if (scene.style && !STYLES.has(scene.style)) E(`stil yok: ${scene.style}`);
const themeObj = typeof scene.theme === 'object' ? scene.theme : null;
if (themeObj && !themeObj.colors) Wn('satır içi temada colors yok ($baslik / $metin / $vurgu referansları çözülmez)');

const W = scene.width, H = scene.height, D = scene.duration;
const vertical = H > W;
const moving = Array.isArray(scene.camera && scene.camera.x) || Array.isArray(scene.camera && scene.camera.y); // kamera dünyada geziyorsa ekran güvenli bölgesi ölçülemez
const seen = new Set();
const groupIds = new Set((scene.groups || []).map((g) => g.id));
const layerById = new Map();
const fontOf = (l) => {
  const ts = l.textStyle ? readJsonSafe(path.join(ROOT, 'data', 'textstyles', l.textStyle + '.json')) : null;
  const fam = (l.font || ts?.font || 'Baloo 2').split(',')[0].replace(/["']/g, '').trim();
  return fam;
};
function readJsonSafe(p) { try { return readJson(p); } catch { return null; } }
const num = (v) => (Array.isArray(v) ? v[0]?.v : v);

for (const l of scene.layers) {
  const lid = l.id || '(adsız)';
  if (!l.id) E('id olmayan katman var');
  else if (seen.has(l.id)) E(`yinelenen katman id: ${l.id}`);
  seen.add(l.id);
  layerById.set(l.id, l);
  if (l.group && !groupIds.has(l.group)) E(`${lid}: grup yok → ${l.group}`);
  if (l.start != null && l.end != null && l.end <= l.start) E(`${lid}: end ≤ start`);
  if (l.end != null && l.end > D + 0.01) Wn(`${lid}: end (${l.end}) süreyi (${D}) aşıyor`);
  if (l.start != null && l.start >= D) E(`${lid}: start süre sonundan sonra`);

  const type = l.type || 'asset';
  if (type === 'asset') {
    if (!assets.has(l.asset)) E(`${lid}: model yok → ${l.asset}`);
  } else if (type === 'particles') {
    const e = l.particle || l.preset;
    if (e && !effects.has(e) && !['konfeti', 'kar', 'yagmur', 'yaprak', 'kabarcik', 'yildiz-tozu', 'varlik'].includes(e)) E(`${lid}: parçacık efekti yok → ${e}`);
  } else if (type === 'arrow') {
    if (l.arrow && !arrows.has(l.arrow)) E(`${lid}: ok stili yok → ${l.arrow}`);
    for (const k of ['from', 'to']) if (typeof l[k] === 'string' && !layerById.has(l[k]) && !scene.layers.some((x) => x.id === l[k])) E(`${lid}: ok ${k} katmanı yok → ${l[k]}`);
  } else if (type === 'text') {
    if (l.textStyle && !tstyles.has(l.textStyle)) E(`${lid}: metin stili yok → ${l.textStyle}`);
    const fam = fontOf(l);
    if (BAD_FONTS.has(fam)) E(`${lid}: Türkçe glifi eksik font → ${fam}`);
    else if (!fontMap.has(fam) && !/system|sans-serif|serif|monospace/i.test(fam)) Wn(`${lid}: font kayıtlı değil → ${fam}`);
    else if (fontMap.get(fam) && fontMap.get(fam).check && fontMap.get(fam).check.ok === false) E(`${lid}: font glif testi başarısız → ${fam}`);
    for (const a of l.textAnims || []) if (!TEXT_ANIMS.has(a.preset)) E(`${lid}: textAnim yok → ${a.preset}`);
    // okuma süresi
    if (l.reveal && l.start != null && l.end != null) {
      const words = String(l.text || '').trim().split(/\s+/).length;
      const revEnd = Array.isArray(l.reveal) ? l.reveal[l.reveal.length - 1].t : l.start;
      const visible = l.end - Math.max(revEnd, l.start);
      if (words >= 3 && visible < 1.2 + words / 3 - 0.001) Wn(`${lid}: okuma süresi kısa (${visible.toFixed(1)} sn, ${words} kelime)`);
    }
    // güvenli bölge (9:16)
    const y = num(l.y);
    if (!moving && vertical && H >= 1900 && typeof y === 'number' && (y > 1500 || y < 200)) Wn(`${lid}: y=${y} Reels arayüz bölgesinde (200–1500 dışı)`);
  }
  for (const a of l.anims || []) {
    if (a.preset && !PRESETS[a.preset]) E(`${lid}: anim ön ayarı yok → ${a.preset}`);
  }
}

for (const t of scene.transitions || []) {
  if (!TRANS.has(t.type)) E(`geçiş türü yok: ${t.type}`);
  if (t.t > D) E(`geçiş süre dışında: ${t.t}`);
  // kesme anında en az bir katman bitmeli ve en az biri başlamalı
  const ends = scene.layers.some((l) => l.end != null && Math.abs(l.end - t.t) < 0.06);
  const starts = scene.layers.some((l) => l.start != null && Math.abs(l.start - t.t) < 0.06);
  if (!ends || !starts) Wn(`geçiş t=${t.t}: katman ${!ends ? 'bitişi' : ''}${!ends && !starts ? ' ve ' : ''}${!starts ? 'başlangıcı' : ''} t ile hizalı değil`);
}
for (const a of scene.audio || []) if (!fs.existsSync(path.join(audioDir, a.file))) E(`ses dosyası yok: ${a.file}`);
for (const f of scene.formats || []) if (!f.width || !f.height) E(`format eksik: ${f.id}`);

// kare başına örtüşen metinler (aynı anda aynı y bandı) — kaba uyarı
const texts = scene.layers.filter((l) => l.type === 'text' && typeof num(l.y) === 'number');
for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
  const a = texts[i], b = texts[j];
  const as = a.start ?? 0, ae = a.end ?? D, bs = b.start ?? 0, be = b.end ?? D;
  const over = Math.min(ae, be) - Math.max(as, bs);
  if (over > 0.8 && Math.abs(num(a.y) - num(b.y)) < 30 && Math.abs(num(a.x) - num(b.x)) < 200 && !Array.isArray(a.y) && !Array.isArray(b.y)) Wn(`metin çakışması olası: ${a.id} / ${b.id} (aynı konum, ${over.toFixed(1)} sn)`);
}

console.log(`${id}: ${W}×${H}, ${D} sn, ${scene.layers.length} katman, ${(scene.transitions || []).length} geçiş`);
for (const m of err) console.log('  ✗ HATA  ', m);
for (const m of warn) console.log('  ! uyarı ', m);
if (!err.length && !warn.length) console.log('  ✓ sorun bulunmadı');
process.exit(err.length ? 1 : 0);
