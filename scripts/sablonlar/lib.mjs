// Şablon üreteçlerinin ortak kütüphanesi.
// Bir şablon:  export default { id, ad, aciklama, ornek: {…brief}, uret(brief) → scene }
// `baglam(brief, varsayilan)` sahne kurucu bağlamını verir; `ctx.bitir()` tam scene.json nesnesini döndürür.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeEnvelope } from '../../web/src/engine/envelope.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = path.join(ROOT, 'data');

export const FORMATLAR = {
  reels: { width: 1080, height: 1920, ad: 'Reels / Shorts 9:16' },
  youtube: { width: 1920, height: 1080, ad: 'YouTube 16:9' },
  kare: { width: 1080, height: 1080, ad: 'Kare 1:1' },
  dikey45: { width: 1080, height: 1350, ad: 'Instagram 4:5' },
};

export const r2 = (n) => Math.round(n * 100) / 100;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ─── Kütüphane envanteri (yalnızca boyut / varlık var mı bilgisi) ─────────────
let assetCache = null;
export function varliklar() {
  if (assetCache) return assetCache;
  assetCache = new Map();
  const lib = path.join(DATA, 'library');
  for (const cat of fs.readdirSync(lib)) {
    const dir = path.join(lib, cat);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        const id = f.replace(/\.json$/, '');
        assetCache.set(id, { id, cat, type: j.type, size: j.size || [200, 200], name: j.name, variants: Object.keys(j.variants || {}), parts: Object.keys(j.parts || {}) });
      } catch { /* bozuk dosya atlanır */ }
    }
  }
  return assetCache;
}
export function varlikBoyut(id) {
  const a = varliklar().get(id);
  return a ? a.size : [200, 200];
}
export function varlikVarMi(id) {
  const a = varliklar().get(id);
  return !!a && !a.type;
}

export function temaOku(id) {
  const f = path.join(DATA, 'themes', `${id}.json`);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

// ─── Metin ölçümü (yaklaşık) ve sarma ────────────────────────────────────────
const GENISLIK = { 'baslik-kalin': 0.43, 'baslik-modern': 0.56, 'baslik-serif': 0.58, 'baslik-yuvarlak': 0.58, 'alt-baslik': 0.54, 'etiket-kutu': 0.62, altyazi: 0.58, 'el-yazisi': 0.42, 'cocuk-eglenceli': 0.6 };

/** Metni en çok `maks` karakterlik satırlara böler (kelime bölmeden) */
export function sar(text, maks = 28) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > maks) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out.join('\n');
}

/** Metnin verilen genişliğe sığması için piksel boyutu (en çok `taban`) */
export function sigdir(text, stil, maxW, taban) {
  const k = GENISLIK[stil] ?? 0.56;
  const en = Math.max(1, ...String(text).split('\n').map((l) => [...l].length));
  return Math.round(Math.min(taban, maxW / (en * k)));
}

export const kelimeSayisi = (t) => String(t ?? '').split(/\s+/).filter(Boolean).length;

// ─── Ses ─────────────────────────────────────────────────────────────────────
export const OZEL_MUZIK = { file: 'uzay-ambiyans.wav', bpm: 120, beatOffset: 0.25, volume: 0.55 };

/** WAV (PCM 16 / float32) → mono Float32Array. Başka biçimler için null (stüdyoda "Zarf çıkar"). */
export function wavOku(file) {
  const f = path.join(DATA, 'audio', file);
  if (!/\.wav$/i.test(file) || !fs.existsSync(f)) return null;
  const b = fs.readFileSync(f);
  if (b.toString('ascii', 0, 4) !== 'RIFF') return null;
  let off = 12;
  let fmt = null;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { tag: b.readUInt16LE(off + 8), ch: b.readUInt16LE(off + 10), sr: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    if (id === 'data' && fmt) {
      const bytes = fmt.bits / 8;
      const n = Math.floor(Math.min(size, b.length - off - 8) / (bytes * fmt.ch));
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let s = 0;
        for (let c = 0; c < fmt.ch; c++) {
          const p = off + 8 + (i * fmt.ch + c) * bytes;
          s += fmt.tag === 3 ? b.readFloatLE(p) : fmt.bits === 16 ? b.readInt16LE(p) / 32768 : fmt.bits === 24 ? b.readIntLE(p, 3) / 8388608 : 0;
        }
        out[i] = s / fmt.ch;
      }
      return { mono: out, sampleRate: fmt.sr };
    }
    off += 8 + size + (size % 2);
  }
  return null;
}

export function zarfCikar(file, fps = 30) {
  const w = wavOku(file);
  return w ? analyzeEnvelope(w.mono, w.sampleRate, { fps }) : null;
}

// ─── Bağlam ──────────────────────────────────────────────────────────────────
export function baglam(brief, d = {}) {
  const fk = FORMATLAR[brief.format] || FORMATLAR[d.format] || FORMATLAR.reels;
  const W = fk.width;
  const H = fk.height;
  const dikey = H > W * 1.15;
  const layers = [];
  const groups = [];
  const sections = [];
  const transitions = [];
  const kullanilan = new Set();
  const ctx = {
    W, H, dikey, layers, groups, sections, transitions, brief,
    stil: brief.stil ?? d.stil,
    tema: brief.tema ?? d.tema ?? 'gun-isigi',
    fps: brief.fps || 30,
    // düzen: dikeyde her şey ortada üst üste; yatayda metin solda (x=0.3W), nesne sağda (x=0.72W)
    tx: dikey ? W / 2 : W * 0.22,
    ox: dikey ? W / 2 : W * 0.68,
    tw: dikey ? W * 0.86 : W * 0.38, // metin kutusu genişliği
    m: Math.min(W, H),
    id(prefix) {
      let i = 1;
      while (kullanilan.has(`${prefix}-${i}`)) i++;
      const id = `${prefix}-${i}`;
      kullanilan.add(id);
      return id;
    },
    L(o) {
      layers.push(o);
      if (o.id) kullanilan.add(o.id);
      return o;
    },
    k: (t, v, ease) => (ease ? { t: r2(t), v, ease } : { t: r2(t), v }),
    /** Dikey düzende y'yi H'nin oranı olarak, yatayda yatay düzen oranıyla verir */
    Y: (dikeyOran, yatayOran) => Math.round(H * (dikey ? dikeyOran : (yatayOran ?? dikeyOran))),
    grup(id, ad, collapsed = false) {
      if (!groups.some((g) => g.id === id)) groups.push({ id, name: ad, ...(collapsed ? { collapsed } : {}) });
      return id;
    },
    bolum(t, ad) {
      sections.push({ t: r2(t), name: ad });
    },
    gecis(type, t, dur, color = '$vurgu') {
      transitions.push({ type, t: r2(t), dur, ...(color && ['katlama', 'perde', 'iris', 'yirtik', 'sayfa-cevir'].includes(type) ? { color } : {}) });
    },
    /** Metin katmanı: stil, konum, sığdırma, giriş / çıkış animasyonu */
    metin(id, group, text, t0, t1, o = {}) {
      const stil = o.stil || 'alt-baslik';
      const satirlar = o.sar ? sar(text, o.sar) : String(text);
      const taban = o.size || { 'baslik-kalin': 150, 'baslik-modern': 100, 'baslik-serif': 100, 'baslik-yuvarlak': 110, 'alt-baslik': ctx.dikey ? 58 : 50, 'etiket-kutu': 44, altyazi: 54, 'el-yazisi': 84 }[stil] || 64;
      const size = sigdir(satirlar, stil, o.maxW || ctx.tw, taban);
      const giris = o.giris === undefined ? [{ preset: 'harf-zipla', t: t0 + 0.2, dur: 0.45, aralik: 0.035 }] : o.giris;
      const cikis = o.cikis === undefined ? [{ preset: 'sol', t: t1 - 0.5, dur: 0.35 }] : o.cikis;
      return ctx.L({
        id, ...(group ? { group } : {}), type: 'text', textStyle: stil, text: satirlar,
        x: o.x ?? ctx.tx, y: o.y, size, start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
        ...(o.reveal ? { reveal: [ctx.k(t0 + o.reveal[0], 0), ctx.k(t0 + o.reveal[0] + o.reveal[1], 1, 'linear')] } : {}),
        ...(giris?.length ? { textAnims: giris } : {}),
        ...(cikis?.length ? { anims: cikis } : {}),
        ...(o.extra || {}),
      });
    },
    /** Kütüphane nesnesi: girişle belirir, sürekli canlanır, çıkışla gider */
    nesne(id, group, asset, t0, t1, px, o = {}) {
      const [w, h] = varlikBoyut(asset);
      const cizim = (o.stil || ctx.stil) === 'cizim';
      return ctx.L({
        id, ...(group ? { group } : {}), asset, ...(o.variant ? { variant: o.variant } : {}),
        x: o.x ?? ctx.ox, y: o.y, scale: r2(px / Math.max(w, h)), start: r2(t0), ...(t1 != null ? { end: r2(t1) } : {}),
        ...(o.extra || {}),
        anims: [
          cizim ? { preset: 'cizerek-gir', t: t0, dur: 1.8 } : { preset: 'katlanarak-gir', t: t0, dur: 1.0, sira: 'radial' },
          ...(o.yasam === false ? [] : [{ preset: 'suzul', t: t0 + 1.2, genlik: 9, periyot: 3.2 }]),
          ...(t1 != null ? [{ preset: o.cikis || 'sol', t: t1 - 0.55, dur: 0.5 }] : []),
          ...(o.anims || []),
        ],
      });
    },
    sesEkle(muzik) {
      const m = typeof muzik === 'string' ? { file: muzik } : muzik;
      if (m === false || m === null) return null;
      const tr = { ...OZEL_MUZIK, ...(m || {}), start: 0, fadeIn: 1, fadeOut: 2.5 };
      if (m && m.file && m.file !== OZEL_MUZIK.file && m.bpm == null) {
        delete tr.bpm;
        delete tr.beatOffset;
      }
      const env = zarfCikar(tr.file);
      if (env && tr.env === undefined) tr.env = env;
      ctx.audio = [tr];
      return tr;
    },
    /** Hesaplanmış toplam süre: son katmanın bitişi */
    bitir(ad, sure, ek = {}) {
      const tema = ctx.tema;
      let temaDeger = tema;
      if (brief.vurgu && typeof tema === 'string') {
        const t0 = temaOku(tema);
        if (t0) temaDeger = { ...t0, colors: { ...t0.colors, vurgu: brief.vurgu }, roles: { ...(t0.roles || {}), vurgu: brief.vurgu } };
      }
      const formatlar = Object.entries(FORMATLAR)
        .filter(([, f]) => !(f.width === W && f.height === H))
        .slice(0, 3)
        .map(([id, f]) => ({
          id, name: f.ad, width: f.width, height: f.height, mode: 'sigdir',
          focusX: 0.5, focusY: 0.47, zoom: f.height < f.width && dikey ? 1.3 : 1,
        }));
      return {
        name: ad,
        width: W,
        height: H,
        fps: ctx.fps,
        duration: r2(sure),
        theme: temaDeger,
        ...(ctx.stil ? { style: ctx.stil } : {}),
        ...(ctx.audio ? { audio: ctx.audio, sfx: { auto: true, volume: 0.45 } } : {}),
        ...(sections.length ? { sections } : {}),
        ...(transitions.length ? { transitions } : {}),
        ...(groups.length ? { groups } : {}),
        formats: formatlar,
        layers: JSON.parse(JSON.stringify(layers)),
        ...ek,
      };
    },
  };
  return ctx;
}

// ─── Proje yazma ─────────────────────────────────────────────────────────────
export const slug = (s) =>
  String(s).toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'proje';

export function projeYaz(id, scene, brief) {
  const dir = path.join(DATA, 'projects', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'brief.json'), JSON.stringify(brief, null, 2) + '\n');
  if (!fs.existsSync(path.join(dir, 'notes.json'))) fs.writeFileSync(path.join(dir, 'notes.json'), '[]\n');
  return dir;
}

/** Brief doğrulama: zorunlu alanlar eksikse anlaşılır Türkçe hata */
export function gerekli(brief, alanlar, sablon) {
  const eksik = alanlar.filter((a) => brief[a] == null || (Array.isArray(brief[a]) && !brief[a].length));
  if (eksik.length) throw new Error(`"${sablon}" şablonu için eksik alan: ${eksik.join(', ')}`);
}

export function nesneSec(ad, yedek = 'yildiz') {
  if (ad && varlikVarMi(ad)) return ad;
  return yedek;
}
