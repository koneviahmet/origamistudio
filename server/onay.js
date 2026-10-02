// Onay kuyruğu: video üretiminde kullanılacak nesne / ses adaylarını kullanıcıya onaylatır.
// data/onay/<oturum>.json — her video üretimi ayrı oturum (aynı anda birden fazla olabilir).
//   { id, baslik, durum: 'bekliyor'|'tamam', arsiv, olusturma, guncelleme,
//     ogeler: [{ id, tur: 'nesne'|'ses', ref, ad, kategori?, yeni?, nerede, amac, aciklama?, karar: null|'kullan'|'kullanma'|'duzenle', not?, duzenlendi? }] }
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError, assertId } from './store.js';

const KARARLAR = ['kullan', 'kullanma', 'duzenle'];

export function createOnay(dataDir) {
  const dir = path.join(dataDir, 'onay');
  const file = (id) => path.join(dir, `${assertId(id)}.json`);

  async function oku(id) {
    try {
      return JSON.parse(await fs.readFile(file(id), 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') throw new HttpError(404, `Onay oturumu yok: ${id}`);
      throw e;
    }
  }

  async function yaz(o) {
    await fs.mkdir(dir, { recursive: true });
    o.guncelleme = new Date().toISOString();
    o.durum = o.ogeler.length && o.ogeler.every((x) => x.karar) ? 'tamam' : 'bekliyor';
    const tmp = file(o.id) + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(o, null, 2));
    await fs.rename(tmp, file(o.id));
    return o;
  }

  async function liste() {
    await fs.mkdir(dir, { recursive: true });
    const out = [];
    for (const f of await fs.readdir(dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const o = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
        const say = (tur) => ({ toplam: o.ogeler.filter((x) => x.tur === tur).length, karar: o.ogeler.filter((x) => x.tur === tur && x.karar).length });
        out.push({ id: o.id, baslik: o.baslik, durum: o.durum, arsiv: !!o.arsiv, guncelleme: o.guncelleme, olusturma: o.olusturma, nesne: say('nesne'), ses: say('ses') });
      } catch {}
    }
    return out.sort((a, b) => String(b.guncelleme).localeCompare(String(a.guncelleme)));
  }

  // Oluştur / üstüne ekle: aynı öge id'si varsa kararı koruyarak alanları günceller.
  async function olustur(body) {
    const id = assertId(body?.id);
    let o;
    try { o = await oku(id); } catch { o = { id, baslik: id, olusturma: new Date().toISOString(), ogeler: [] }; }
    if (body.baslik) o.baslik = body.baslik;
    o.arsiv = false;
    for (const x of body.ogeler || []) {
      if (!x.id || !x.tur) throw new HttpError(400, 'Her öge id ve tur içermeli');
      const i = o.ogeler.findIndex((y) => y.id === x.id);
      const eski = i >= 0 ? o.ogeler[i] : {};
      const yeni = { ...eski, ...x, karar: eski.karar ?? x.karar ?? null };
      if (i >= 0) o.ogeler[i] = yeni; else o.ogeler.push(yeni);
    }
    return yaz(o);
  }

  async function karar(id, ogeId, { karar: k, not, duzenlendi }) {
    const o = await oku(id);
    const x = o.ogeler.find((y) => y.id === ogeId);
    if (!x) throw new HttpError(404, `Öge yok: ${ogeId}`);
    if (k !== undefined) {
      if (k !== null && !KARARLAR.includes(k)) throw new HttpError(400, 'karar: kullan | kullanma | duzenle');
      x.karar = k;
      if (k !== 'duzenle') x.duzenlendi = false;
    }
    if (not !== undefined) x.not = String(not).slice(0, 2000);
    if (duzenlendi !== undefined) x.duzenlendi = !!duzenlendi;
    return yaz(o);
  }

  async function topluKarar(id, { karar: k, tur }) {
    const o = await oku(id);
    if (!KARARLAR.includes(k)) throw new HttpError(400, 'karar: kullan | kullanma | duzenle');
    for (const x of o.ogeler) if (!x.karar && (!tur || x.tur === tur)) x.karar = k;
    return yaz(o);
  }

  async function arsivle(id, arsiv = true) {
    const o = await oku(id);
    o.arsiv = !!arsiv;
    return yaz(o);
  }

  // Referans görsel: data/onay/<oturum>/gorsel/<öge>-<n>.<uzantı>; öge.gorseller = [dosya adı]
  const UZANTI = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
  const gorselDir = (id) => path.join(dir, assertId(id), 'gorsel');
  async function gorselEkle(id, ogeId, buf, mime) {
    const uz = UZANTI[String(mime).split(';')[0]];
    if (!uz) throw new HttpError(400, 'Yalnızca PNG, JPEG, WebP ya da GIF görsel');
    if (!buf?.length) throw new HttpError(400, 'Boş görsel');
    const o = await oku(id);
    const x = o.ogeler.find((y) => y.id === ogeId);
    if (!x) throw new HttpError(404, `Öge yok: ${ogeId}`);
    await fs.mkdir(gorselDir(id), { recursive: true });
    const ad = `${ogeId}-${Date.now().toString(36)}.${uz}`;
    await fs.writeFile(path.join(gorselDir(id), ad), buf);
    x.gorseller = [...(x.gorseller || []), ad];
    return yaz(o);
  }
  async function gorselSil(id, ogeId, ad) {
    const o = await oku(id);
    const x = o.ogeler.find((y) => y.id === ogeId);
    if (!x) throw new HttpError(404, `Öge yok: ${ogeId}`);
    x.gorseller = (x.gorseller || []).filter((g) => g !== ad); // dosya diskte kalır (veri silmeyiz); listeden çıkar
    return yaz(o);
  }
  function gorselYol(id, ad) {
    if (!/^[\w-]+(?:\.[\w-]+)*\.(png|jpg|webp|gif)$/.test(ad)) throw new HttpError(400, 'Geçersiz dosya adı');
    return path.join(gorselDir(id), ad);
  }

  return { dir, oku, liste, olustur, karar, topluKarar, arsivle, gorselEkle, gorselSil, gorselYol };
}
