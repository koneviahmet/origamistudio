// Kayıtlı bileşenleri (data/components) üreteç betiklerinden kullanmak ve projeye UYARLAMAK için yardımcılar.
//
//   import { bilesen, bilesenBaglam } from './lib/bilesen.mjs';
//   const B = bilesenBaglam({ W, H, tema: 'gece' });          // proje boyutu + teması bir kez verilir
//   L(B('fiyat-pro', {
//     id: 'plan1', start: 4, end: 9,                            // zamanlama (giriş animasyonu otomatik)
//     konum: 'orta', genislik: 0.8,                             // yerleşim: ad ya da [fx, fy] oranı · genişlik: W oranı (≤2) ya da px
//     varyant: ['koyu', 'buyuk'],                               // hızlı stil (npm run bilesen -- --varyantlar)
//     tema: true,                                               // renkleri proje temasına bağla ($vurgu, $metin…); ad ya da nesne de olur
//     title: 'Takım', value: '₺199', lines: ['…'],             // içerik: bileşenin tüm alanları (--alanlar <id>)
//     card: { color: '$arka2' }, textScale: 1.1,                // iç içe nesneler birleştirilir, diziler değiştirilir
//     giris: 'zipla-gir', cikis: 'kuculerek-cik',               // ön ayar adı | {preset, dur, …} | sayı (çizilme sn) | false
//     anims: [{ preset: 'nefes', t: 6 }], depth: 0.2,           // katmanın her ortak alanı geçerlidir
//   }));
//
// Hangi alanlar var?   npm run bilesen -- --alanlar <id>      Varyantlar?  npm run bilesen -- --varyantlar
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeTaxonomy, matchComponent, withAutoTags, componentSize } from '../../web/src/componentTags.js';
import { applyVariant, VARIANT_NAMES } from '../../web/src/engine/widgetStyle.js';
import { PRESETS } from '../../web/src/engine/presets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const COMP_DIR = path.join(ROOT, 'data', 'components');
export const TAX_FILE = path.join(ROOT, 'data', 'bilesen-etiketleri.json');
const THEME_DIR = path.join(ROOT, 'data', 'themes');
const r2 = (n) => Math.round(n * 100) / 100;
const clone = (v) => JSON.parse(JSON.stringify(v));

export function taksonomiOku() {
  try {
    return mergeTaxonomy(JSON.parse(fs.readFileSync(TAX_FILE, 'utf8')));
  } catch {
    return mergeTaxonomy(null);
  }
}

export function bilesenleriOku() {
  if (!fs.existsSync(COMP_DIR)) return [];
  return fs.readdirSync(COMP_DIR).filter((f) => f.endsWith('.json')).map((f) => {
    const doc = { ...JSON.parse(fs.readFileSync(path.join(COMP_DIR, f), 'utf8')), id: f.slice(0, -5) };
    // etiketi olmayanlar için bellekte otomatik öneri (dosyaya yazmaz)
    return { ...doc, etiketler: withAutoTags(doc) };
  });
}

// ------------------------------------------------------------------ yardımcılar
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
/** Nesneleri iç içe birleştirir; diziler ve ilkel değerler üstüne yazılır; undefined atlanır. */
export function birlestir(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (v === undefined) continue;
    out[k] = isObj(v) && isObj(out[k]) ? birlestir(out[k], v) : clone(v);
  }
  return out;
}

const KONUMLAR = {
  orta: [0.5, 0.5], ust: [0.5, 0.22], alt: [0.5, 0.8], sol: [0.28, 0.5], sag: [0.72, 0.5],
  'sol-ust': [0.28, 0.22], 'sag-ust': [0.72, 0.22], 'sol-alt': [0.28, 0.8], 'sag-alt': [0.72, 0.8],
  'ust-orta': [0.5, 0.3], 'alt-orta': [0.5, 0.7], 'alt-bant': [0.5, 0.88],
};

function temaOku(tema) {
  if (!tema || tema === true) return null;
  if (typeof tema === 'object') return tema;
  const f = path.join(THEME_DIR, `${tema}.json`);
  if (!fs.existsSync(f)) throw new Error(`Tema yok: "${tema}". Seçenekler: ${fs.readdirSync(THEME_DIR).map((x) => x.replace('.json', '')).join(', ')}`);
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
const lum = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return 255;
  const n = parseInt(m[1], 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
};

/** Renkleri proje temasına bağlar: vurgu → $vurgu, yazı → $metin, koyu temada zemin → $arka2. */
function temaBagla(type, props, theme) {
  const dark = lum(theme?.colors?.arka1) < 110;
  const add = {};
  const has = (k) => props[k] === undefined;
  if (['kart', 'liste', 'zaman', 'balon', 'device', 'waveform', 'kod'].includes(type) && has('accent')) add.accent = '$vurgu';
  if (type === 'chart') {
    add.textColor = props.textColor ?? '$metin';
    if (dark) add.card = { color: '$arka2' };
  } else if (['kart', 'liste', 'zaman', 'balon'].includes(type)) {
    if (props.bg === undefined && dark) add.bg = '$arka2';
    add.textColor = props.textColor ?? (dark ? '$metin' : '$metin');
  } else if (type === 'kod') {
    add.tema = dark ? 'koyu' : props.tema || 'acik';
  } else if (type === 'waveform') {
    if (has('color')) add.color = '$vurgu';
  }
  return birlestir(props, add);
}

function animUret(spec, t, kind) {
  const s = typeof spec === 'string' ? { preset: spec } : spec;
  const def = PRESETS[s.preset];
  if (!def) {
    const adlar = Object.entries(PRESETS).filter(([, v]) => v.cat === (kind === 'giris' ? 'giris' : 'cikis')).map(([k]) => k);
    throw new Error(`Bilinmeyen ${kind} ön ayarı: "${s.preset}". Seçenekler: ${adlar.join(', ')}`);
  }
  const { preset, dur, ...params } = s;
  return { preset, t: r2(t), dur: dur ?? def.dur ?? 0.8, ...params };
}

/**
 * Bileşeni sahne katmanına çevirir ve projeye uyarlar.
 * @param id    data/components/<id>.json
 * @param over  katman alanları + yardımcı seçenekler (giris, cikis, genislik, konum, varyant, tema, start, end)
 * @param ctx   { W, H, tema } — bilesenBaglam() ile bir kez verilir
 */
export function bilesen(id, over = {}, ctx = {}) {
  const all = bilesenleriOku();
  const doc = all.find((d) => d.id === id);
  if (!doc) {
    const tax = taksonomiOku();
    const yakin = all.map((d) => [d, matchComponent(d, id.replace(/-/g, ' '), {}, tax)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0].id);
    throw new Error(`Bileşen yok: "${id}".${yakin.length ? ` Yakın adaylar: ${yakin.join(', ')}.` : ''} Arama: npm run bilesen -- "<sorgu>"`);
  }
  const { giris, cikis, genislik, konum, varyant, tema, start, end, ...rest } = over;
  const W = ctx.W || 1080;
  const H = ctx.H || 1920;

  let props = clone(doc.props || {});
  // 1) tema bağlama → 2) hızlı stil varyantları → 3) açık alanlar (en güçlüsü)
  const temaKaynak = tema === true ? ctx.tema : tema;
  if (temaKaynak) props = temaBagla(doc.type, props, temaOku(temaKaynak) || { colors: {} });
  if (varyant) props = applyVariant(doc.type, props, varyant);

  const layer = birlestir({ id, type: doc.type, x: Math.round(W / 2), y: Math.round(H / 2), ...props }, rest);

  // yerleşim
  if (konum) {
    const [fx, fy] = Array.isArray(konum) ? konum : KONUMLAR[konum] || (() => { throw new Error(`Bilinmeyen konum: "${konum}". Seçenekler: ${Object.keys(KONUMLAR).join(', ')} ya da [fx, fy]`); })();
    layer.x = Math.round(fx * W);
    layer.y = Math.round(fy * H);
  }
  if (genislik) {
    const [bw] = componentSize({ type: doc.type, props: layer });
    layer.scale = r2(((genislik <= 2 ? genislik * W : genislik)) / bw);
  }

  // zamanlama + giriş / çıkış
  if (start != null) layer.start = start;
  if (end != null) layer.end = end;
  const t0 = layer.start;
  if (t0 != null && giris !== false && !layer.fold) {
    if (typeof giris === 'string' || isObj(giris)) {
      layer.anims = [...(layer.anims || []), animUret(giris, t0, 'giris')];
    } else {
      layer.fold = [{ t: t0, v: 0 }, { t: r2(t0 + (typeof giris === 'number' ? giris : 1.4)), v: 1, ease: 'outCubic' }];
    }
  }
  if (cikis && layer.end != null) {
    const a = animUret(cikis, 0, 'cikis');
    a.t = r2(layer.end - a.dur);
    layer.anims = [...(layer.anims || []), a];
  }
  return layer;
}

/** Proje bağlamını (W, H, tema) bir kez verip kısa çağrı üretir: B('fiyat-pro', {...}) */
export function bilesenBaglam(ctx) {
  return (id, over) => bilesen(id, over, ctx);
}

export { VARIANT_NAMES };
