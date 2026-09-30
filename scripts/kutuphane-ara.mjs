// Kütüphane arama: anahtar kelime (her zaman) + isteğe bağlı Ollaya/laya yeniden sıralama.
//   npm run ara -- "elektron yörünge" [--kategori atom] [--n 8] [--yerel-kapat]
// Ollaya ayarı: data/ayarlar.json → { "ollaya": { "aktif": true|false, "url": "...", "model": "..." } }
// Ollaya kapalı / ulaşılamaz / hata verirse sessizce yalnızca anahtar kelime araması kullanılır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const AYAR_DOSYA = path.join(DATA, 'ayarlar.json');
export const OLLAYA_VARSAYILAN = { aktif: false, url: 'http://localhost:11435', model: 'laya:multilingual' };

export function ayarOku() {
  try {
    const j = JSON.parse(fs.readFileSync(AYAR_DOSYA, 'utf8'));
    return { ...j, ollaya: { ...OLLAYA_VARSAYILAN, ...(j.ollaya || {}) } };
  } catch {
    return { ollaya: { ...OLLAYA_VARSAYILAN } };
  }
}

export function ayarYaz(yama) {
  const cur = ayarOku();
  const yeni = { ...cur, ...yama, ollaya: { ...cur.ollaya, ...(yama.ollaya || {}) } };
  yeni.ollaya.aktif = !!yeni.ollaya.aktif;
  fs.writeFileSync(AYAR_DOSYA, JSON.stringify(yeni, null, 2));
  return yeni;
}

export async function ollayaDurum(cfg = ayarOku().ollaya) {
  try {
    const r = await fetch(cfg.url + '/', { signal: AbortSignal.timeout(800) });
    return { calisiyor: r.ok };
  } catch {
    return { calisiyor: false };
  }
}

// ---------------------------------------------------------------- arama
const norm = (s) =>
  String(s ?? '').toLocaleLowerCase('tr').replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c]).replace(/[^a-z0-9]+/g, ' ').trim();
const DURAK = new Set(['ve', 'bir', 'ile', 'icin', 'bu', 'the', 'and', 'with', 'for', 'of', 'to', 'in', 'a', 'an', 'sahne', 'scene', 'video', 'bir']);
const tokens = (s) => norm(s).split(' ').filter((t) => t.length > 1 && !DURAK.has(t));

// data/esanlamlilar.json: id → Türkçe/İngilizce ek arama sözcükleri (semantik boşluğu kapatır: "hot drink" → fincan)
function esanlamlilar() {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, 'esanlamlilar.json'), 'utf8'));
  } catch {
    return {};
  }
}

// data/duygular.json: duygu/atmosfer → sözcükler + varlık id'leri ("sad rain" → yağmur, bulut…)
function duygular() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(DATA, 'duygular.json'), 'utf8'));
    const map = {};
    for (const [k, d] of Object.entries(j)) {
      if (k.startsWith('_')) continue;
      for (const id of d.varliklar || []) map[id] = `${map[id] || ''} ${d.kelimeler || ''}`;
    }
    return map;
  } catch {
    return {};
  }
}

export function kutuphaneYukle() {
  const es = esanlamlilar();
  const duygu = duygular();
  const lib = path.join(DATA, 'library');
  const out = [];
  for (const c of fs.readdirSync(lib)) {
    const d = path.join(lib, c);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
      try {
        const a = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
        out.push({ id: a.id || f.slice(0, -5), ad: a.name || a.id, kategori: c, tur: a.type === 'particles' ? 'efekt' : a.type === 'arrow' ? 'ok' : 'model', etiketler: a.tags || [], es: String(es[a.id || f.slice(0, -5)] || ''), duygu: duygu[a.id || f.slice(0, -5)] || '' });
      } catch { /* bozuk dosyayı atla */ }
    }
  }
  return out;
}

function tokenEslesme(q, t) {
  if (q === t) return 1;
  const k = Math.min(q.length, t.length);
  if (k >= 3 && (t.startsWith(q) || q.startsWith(t)) || (k >= 4 && t.slice(0, 4) === q.slice(0, 4))) return 0.6; // kaba kök eşleşmesi (kedi/kediler)
  return 0;
}

function anahtarPuan(qTok, a) {
  const alanlar = [
    [tokens(a.ad), 3],
    [tokens(a.etiketler.join(' ')), 2],
    [tokens(a.id), 2],
    [tokens(a.es).slice(0, 2), 2.5], // eş anlamlı listesinin ilk iki sözcüğü = ana İngilizce ad
    [tokens(a.es), 1.5],
    [tokens(a.duygu), 1.2],
    [tokens(a.kategori), 1],
  ];
  let p = 0;
  for (const q of qTok) {
    // alan başına en iyi eşleşme; en güçlü alan tam puan, diğer alanlar küçük katkı (çok alanda eşleşen öne geçer)
    const pu = alanlar.map(([tl, w]) => Math.max(0, ...tl.map((t) => tokenEslesme(q, t) * w))).sort((x, y) => y - x);
    p += Math.min(3, pu[0] + 0.3 * pu.slice(1).reduce((x, y) => x + y, 0));
  }
  if (!p) return 0;
  // özgüllük: ad sözcüklerinin ne kadarı sorguda geçiyor ("yağmur" → Yağmur, İkili yağmur'dan önce)
  const adT = tokens(a.ad);
  const kapsam = adT.length ? adT.filter((t) => qTok.some((q) => tokenEslesme(q, t) > 0)).length / adT.length : 0;
  return Math.min(1, p / (3 * qTok.length)) * 0.92 + 0.08 * kapsam;
}

async function ollayaSirala(sorgu, adaylar, cfg) {
  const criteria = {};
  for (const a of adaylar) criteria[a.id] = `${a.ad} (${a.kategori}: ${a.etiketler.join(', ')}; ${a.es.split(' ').slice(0, 14).join(' ')})`;
  const r = await fetch(cfg.url + '/api/decide', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: cfg.model, state: sorgu, instructions: 'Hangi origami modeli bu tarife en uygun?', questions: { x: { type: 'choice', criteria } } }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  const pr = j.answers?.x?.probabilities;
  if (!pr) throw new Error(j.error || 'cevap yok');
  return pr;
}

export async function ara(sorgu, { kategori, n = 8, yerel = true } = {}) {
  const qTok = tokens(sorgu);
  let liste = kutuphaneYukle();
  if (kategori) liste = liste.filter((a) => a.kategori === kategori);
  for (const a of liste) a.puan = anahtarPuan(qTok, a);
  let kaynak = 'anahtar-kelime';

  const cfg = ayarOku().ollaya;
  if (yerel && cfg.aktif && liste.length > 1 && (await ollayaDurum(cfg)).calisiyor) {
    try {
      // Ölçüm: laya tek başına gürültülü (64 seçenekte doğruluk düşük) → yalnızca eşitlik bozucu / son çare.
      // Anahtar kelime eşleşmesi varsa havuz onlardır ve laya küçük bir katkı verir; hiç eşleşme yoksa laya tüm kütüphaneyi sıralar.
      const guclu = liste.filter((a) => a.puan > 0).sort((x, y) => y.puan - x.puan).slice(0, 24);
      const havuz = guclu.length >= 3 ? guclu : liste.slice(0, 250);
      const pr = await ollayaSirala(sorgu, havuz, cfg);
      const enYuksek = Math.max(1e-9, ...havuz.map((a) => pr[a.id] ?? 0));
      for (const a of liste) a.ollaya = (pr[a.id] ?? 0) / enYuksek;
      // anahtar kelimesi tutmayan adaylar yalnızca laya gerçekten emin ise (olasılık ≥ 0.25) listeye girer
      for (const a of liste) a.puan = a.puan > 0 ? a.puan + 0.06 * a.ollaya : (pr[a.id] ?? 0) >= 0.25 ? 0.06 * a.ollaya : 0;
      kaynak = 'ollaya+anahtar-kelime';
    } catch (e) {
      kaynak = 'anahtar-kelime (ollaya hata: ' + e.message + ')';
    }
  }
  const sonuc = liste.filter((a) => a.puan > 0).sort((x, y) => y.puan - x.puan).slice(0, n);
  return { kaynak, sonuc };
}

// ---------------------------------------------------------------- CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const bayrak = (ad) => {
    const i = args.indexOf(ad);
    if (i < 0) return undefined;
    return args.splice(i, 2)[1];
  };
  const kategori = bayrak('--kategori');
  const n = Number(bayrak('--n')) || 8;
  const yerel = !args.includes('--yerel-kapat');
  const sorgu = args.filter((a) => !a.startsWith('--')).join(' ');
  if (!sorgu) {
    console.error('Kullanım: npm run ara -- "<sorgu>" [--kategori atom] [--n 8] [--yerel-kapat]');
    process.exit(1);
  }
  const { kaynak, sonuc } = await ara(sorgu, { kategori, n, yerel });
  console.log(`# kaynak: ${kaynak}`);
  if (!sonuc.length) console.log('(eşleşme yok → kütüphanede olmayabilir; gerekirse yeni model üret)');
  for (const a of sonuc) console.log(`${a.puan.toFixed(2)}  ${a.id.padEnd(22)} ${a.tur.padEnd(5)} ${a.kategori.padEnd(10)} ${a.ad} [${a.etiketler.join(', ')}]`);
}
