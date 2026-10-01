// Karakter setlerini (data/characters) üreteç betiklerinden kullanmak için yardımcılar.
//
//   import { karakterBaglam, diyalog } from './lib/karakter.mjs';
//   const K = karakterBaglam({ W, H });                         // proje boyutu bir kez verilir
//   const ayse = K('copadam', {                                 // karakter id (npm run karakter -- "<sorgu>")
//     id: 'ayse', konum: 'sol', boy: 0.52,                      // konum: ad ya da [fx, fy] (ayak ucu oranı) · boy: sahne yüksekliği oranı
//     varyant: 'kiz', ekler: ['gozluk'],                        // karakter belgesindeki varyant / aksesuar id'leri
//     start: 0.4, giris: 'zipla-gir',                           // zamanlama + giriş ön ayarı (false = yok)
//     akis: [{ t: 1, aksiyon: 'el-salla', sure: 2.4, duygu: 'mutlu' }],   // hareket / yüz akışı
//     soz: [{ t: 1.2, metin: 'Merhaba!', tur: 'soyle' }],       // konuşma balonu (ağız oynar, jest otomatik)
//   });
//   L(ayse);
//   const bitis = diyalog({ ayse, can }, [                      // iki karakteri konuştur
//     { kim: 'ayse', metin: 'Bu cihazı biliyor musun?', duygu: 'dusunceli' },
//     { kim: 'can',  metin: 'Hayır, anlat!', duygu: 'heyecanli' },
//   ], { t0: 1 }).bitis;
//
// Ne var?  npm run karakter -- "<sorgu>"   (--aksiyonlar, --duygular, --nesneler, --efektler, --detay <id>)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeCharacter, characterMetrics, speechDur } from '../../web/src/engine/character.js';
import { ACTIONS, EMOTIONS, PROPS, EFFECTS, BUBBLE_KINDS, LOOK_NAMES } from '../../web/src/engine/characterData.js';
import { PRESETS } from '../../web/src/engine/presets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CHAR_DIR = path.join(ROOT, 'data', 'characters');
const r2 = (n) => Math.round(n * 100) / 100;
const clone = (v) => JSON.parse(JSON.stringify(v));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function karakterleriOku() {
  if (!fs.existsSync(CHAR_DIR)) return [];
  return fs.readdirSync(CHAR_DIR).filter((f) => f.endsWith('.json')).map((f) => ({ ...JSON.parse(fs.readFileSync(path.join(CHAR_DIR, f), 'utf8')), id: f.slice(0, -5) }));
}

// ------------------------------------------------------------------ yardımcılar
const KONUMLAR = {
  orta: 0.5, sol: 0.27, sag: 0.73, 'sol-uc': 0.14, 'sag-uc': 0.86, 'sol-ic': 0.36, 'sag-ic': 0.64, 'sol-3': 0.33, 'sag-3': 0.67,
};
const yakin = (ad, liste) => {
  const a = String(ad).toLocaleLowerCase('tr');
  const hit = liste.filter((x) => x.includes(a) || a.includes(x)).slice(0, 5);
  return hit.length ? ` Yakın adaylar: ${hit.join(', ')}.` : '';
};

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

/** Katman alanlarını karakter belgesine karşı denetler; hata mesajı fırlatır */
export function karakterDogrula(doc, layer) {
  const aks = new Set([...Object.keys(ACTIONS), ...Object.keys(doc.aksiyonlar || {})]);
  const duy = new Set([...Object.keys(EMOTIONS), ...Object.keys(doc.duygular || {})]);
  const hata = [];
  const act = (a, w) => a && !aks.has(a) && hata.push(`${w}: aksiyon yok → "${a}".${yakin(a, [...aks])} (npm run karakter -- --aksiyonlar)`);
  const emo = (e, w) => e && !duy.has(e) && hata.push(`${w}: duygu yok → "${e}".${yakin(e, [...duy])} (npm run karakter -- --duygular)`);
  act(layer.aksiyon, 'aksiyon');
  emo(layer.duygu, 'duygu');
  (layer.akis || []).forEach((s, i) => {
    act(s.aksiyon, `akis[${i}].aksiyon`);
    emo(s.duygu, `akis[${i}].duygu`);
    if (s.tutar?.nesne && !PROPS[s.tutar.nesne]) hata.push(`akis[${i}].tutar.nesne yok → "${s.tutar.nesne}". Seçenekler: ${Object.keys(PROPS).join(', ')}`);
    if (s.efekt && !EFFECTS[s.efekt]) hata.push(`akis[${i}].efekt yok → "${s.efekt}". Seçenekler: ${Object.keys(EFFECTS).join(', ')}`);
    if (typeof s.bak === 'string' && !LOOK_NAMES.includes(s.bak) && !/^[\w-]+$/.test(s.bak)) hata.push(`akis[${i}].bak geçersiz → ${s.bak}`);
  });
  if (layer.tutar?.nesne && !PROPS[layer.tutar.nesne]) hata.push(`tutar.nesne yok → "${layer.tutar.nesne}". Seçenekler: ${Object.keys(PROPS).join(', ')}`);
  (layer.soz || []).forEach((s, i) => {
    if (!s.metin) hata.push(`soz[${i}].metin boş`);
    if (s.tur && !BUBBLE_KINDS[s.tur]) hata.push(`soz[${i}].tur yok → "${s.tur}". Seçenekler: ${Object.keys(BUBBLE_KINDS).join(', ')}`);
  });
  if (layer.varyant && !doc.varyantlar?.[layer.varyant]) hata.push(`varyant yok → "${layer.varyant}". Bu karakterde: ${Object.keys(doc.varyantlar || {}).join(', ') || '(yok)'}`);
  const ekIds = (doc.ekler || []).map((e) => e.id);
  const ekIst = Array.isArray(layer.ekler) ? layer.ekler : isObj(layer.ekler) ? Object.keys(layer.ekler) : [];
  for (const id of ekIst) if (!ekIds.includes(id)) hata.push(`ek yok → "${id}".${yakin(id, ekIds)} Bu karakterde: ${ekIds.join(', ')}`);
  if (hata.length) throw new Error(`Karakter "${doc.id}" (${layer.id}):\n  - ${hata.join('\n  - ')}`);
}

/**
 * Karakteri sahne katmanına çevirir.
 * @param id    data/characters/<id>.json
 * @param over  katman alanları + yardımcılar: konum, boy, start, end, giris, cikis (+ aksiyon, duygu, akis, soz, varyant, ekler, renkler, tutar, yon, bak …)
 * @param ctx   { W, H } — karakterBaglam() ile bir kez verilir
 */
export function karakter(id, over = {}, ctx = {}) {
  const docs = karakterleriOku();
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error(`Karakter yok: "${id}".${yakin(id, docs.map((d) => d.id))} Seçenekler: ${docs.map((d) => d.id).join(', ')} (npm run karakter -- "<sorgu>")`);
  const { konum, boy, giris, cikis, start, end, id: lid, ...rest } = over;
  const W = ctx.W || 1080;
  const H = ctx.H || 1920;
  const portrait = H > W;
  let fx = 0.5;
  let fy = portrait ? 0.78 : 0.9;
  if (konum != null) {
    if (Array.isArray(konum)) [fx, fy = fy] = konum;
    else if (KONUMLAR[konum] != null) fx = KONUMLAR[konum];
    else throw new Error(`Bilinmeyen konum: "${konum}". Seçenekler: ${Object.keys(KONUMLAR).join(', ')} ya da [fx, fy]`);
  }
  const layer = { id: lid || id, type: 'karakter', karakter: id, ...clone(rest) };
  const C = mergeCharacter(doc, layer);
  const m = characterMetrics(C);
  const wantH = (boy ?? (portrait ? 0.3 : 0.5)) * H;
  layer.scale = r2(Math.min(wantH / m.height, (0.5 * W) / m.width));
  layer.x = Math.round(fx * W);
  layer.y = Math.round(fy * H);
  if (rest.scale != null) layer.scale = rest.scale;
  if (rest.x != null) layer.x = rest.x;
  if (rest.y != null) layer.y = rest.y;
  if (start != null) layer.start = start;
  if (end != null) layer.end = end;
  const t0 = layer.start;
  if (t0 != null && giris !== false) layer.anims = [...(layer.anims || []), animUret(giris || 'zipla-gir', t0, 'giris')];
  if (cikis && layer.end != null) {
    const a = animUret(cikis, 0, 'cikis');
    a.t = r2(layer.end - a.dur);
    layer.anims = [...(layer.anims || []), a];
  }
  karakterDogrula({ ...doc, id }, layer);
  return layer;
}

/** Proje bağlamını (W, H) bir kez verip kısa çağrı üretir: K('copadam', {...}) */
export function karakterBaglam(ctx) {
  return (id, over) => karakter(id, over, ctx);
}

/**
 * Karakterleri konuştur: her satır için konuşana söz balonu, dinleyenlere dinleme + bakış ekler (katmanları DEĞİŞTİRİR).
 * @param layers   { ad: karakterKatmanı } — satırlardaki `kim` bu adlara karşılık gelir
 * @param satirlar [{ kim, metin, tur?, sure?, tepki?: { kim: duygu }, bosluk?, + akış alanları: aksiyon?, duygu?, hedef?, tutar?, efekt?, yon?, hiz? }]
 *                 sure: söz/ses süresi (sn). Verilmezse metin uzunluğundan; seslendirme varsa gerçek süreyi ver.
 * @param opts     { t0 = 0.8, bosluk = 0.4, dinleyen = 'dinle', bak = true, tepkiSure = 0.6 }
 * @returns { bitis, zamanlar: [{ kim, t, sure }] }
 */
export function diyalog(layers, satirlar, opts = {}) {
  const { t0 = 0.8, bosluk = 0.4, dinleyen = 'dinle', bak = true } = opts;
  const names = Object.keys(layers);
  const zamanlar = [];
  let t = t0;
  for (const s of satirlar) {
    const { kim, metin, tur, sure: sure0, taraf, bosluk: bos, tepki, ...segExtra } = s;
    const who = layers[s.kim];
    if (!who) throw new Error(`diyalog: "${s.kim}" katmanı yok. Katmanlar: ${names.join(', ')}`);
    const sure = r2(s.sure ?? speechDur({ metin: s.metin }));
    (who.soz ||= []).push({ t: r2(t), sure, metin: s.metin, ...(s.tur ? { tur: s.tur } : {}), ...(s.taraf ? { taraf: s.taraf } : {}) });
    const others = names.filter((n) => n !== s.kim);
    const seg = { t: r2(t - 0.05), ...segExtra, aksiyon: segExtra.aksiyon || 'bekle' }; // aksiyon, duygu, hedef, tutar, efekt, sure … akışa aynen geçer
    if (bak && others.length) seg.bak = layers[others[0]].id;
    (who.akis ||= []).push(seg);
    for (const n of others) {
      const l = layers[n];
      const reaction = s.tepki?.[n];
      (l.akis ||= []).push({ t: r2(t - 0.05), aksiyon: dinleyen, ...(bak ? { bak: who.id } : {}), ...(reaction ? { duygu: reaction } : {}) });
    }
    zamanlar.push({ kim: s.kim, t: r2(t), sure });
    t += sure + (s.bosluk ?? bosluk);
  }
  for (const l of Object.values(layers)) l.akis?.sort((a, b) => a.t - b.t);
  return { bitis: r2(t), zamanlar };
}

export { ACTIONS, EMOTIONS, PROPS, EFFECTS, BUBBLE_KINDS };
