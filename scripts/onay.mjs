// Onay kuyruğu CLI'ı — video için seçilen nesne/sesleri kullanıcıya onaylatır (arayüz: http://localhost:5180/onay/<oturum>).
//   npm run onay -- olustur <dosya.json>      oturum oluştur / öge ekle (aynı id'li ögenin kararı korunur)
//   npm run onay -- durum <oturum>            kararlar (kullan / kullanma / duzenle / bekliyor)
//   npm run onay -- bekle <oturum> [--dk 30]  tüm ögeler karara bağlanana dek bekler, sonra özet basar
//   (kullanma / düzenle kararlarında kullanıcı açıklama + referans görsel ekleyebilir: `durum` çıktısındaki yolu Read ile aç, modeli ona göre üret)
//   npm run onay -- liste                     oturumlar
//   npm run onay -- duzenlendi <oturum> <oge> "ne yaptım"   düzenleme tamamlandı notu
// dosya.json = { id, baslik, ogeler: [{ id, tur: "nesne"|"ses", ref, nerede, amac, yeni?, ad?, kategori?, cinsiyet?, etiketler?, aciklama? }] }
//   nesne: ref = kütüphane varlık id'si (ad/kategori kütüphaneden doldurulur). ses: ref = `npm run sesler` çıktısındaki ses id'si.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOnay } from '../server/onay.js';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const onay = createOnay(DATA);
const [cmd, a1, a2, a3] = process.argv.slice(2);
const opt = (n, d) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : d);

function kutuphaneBul(ref) {
  const lib = path.join(DATA, 'library');
  for (const k of fs.readdirSync(lib)) {
    const f = path.join(lib, k, `${ref}.json`);
    if (fs.existsSync(f)) {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      return { ad: j.name || ref, kategori: j.category || k };
    }
  }
  return null;
}

function ozet(o) {
  const satir = (x) => `${(x.karar || 'BEKLİYOR').toUpperCase().padEnd(9)} ${x.tur.padEnd(5)} ${x.id.padEnd(22)} ${x.ad || ''}${x.karar === 'duzenle' ? (x.duzenlendi ? '  [kullanıcı düzenledi]' : '  [düzenleme isteniyor]') : ''}${x.not ? `\n            not: ${x.not}` : ''}${(x.gorseller || []).map((g) => `\n            referans görsel: ${path.join(onay.dir, o.id, 'gorsel', g)}`).join('')}`;
  return `${o.baslik} (${o.id}) — ${o.durum}\n` + o.ogeler.map(satir).join('\n');
}

if (cmd === 'olustur') {
  const body = JSON.parse(fs.readFileSync(a1, 'utf8'));
  for (const x of body.ogeler || []) {
    if (x.tur === 'nesne') {
      x.ref ||= x.id;
      const k = kutuphaneBul(x.ref);
      if (!k) { console.error(`Kütüphanede yok: ${x.ref} (önce üret / seed et)`); process.exit(1); }
      x.ad ||= k.ad;
      x.kategori ||= k.kategori;
    }
  }
  const o = await onay.olustur(body);
  console.log(`Oturum hazır: ${o.id} — ${o.ogeler.length} öge\nOnay sayfası: http://localhost:5180/onay/${o.id}`);
} else if (cmd === 'durum') {
  console.log(ozet(await onay.oku(a1)));
} else if (cmd === 'bekle') {
  const son = Date.now() + Number(opt('dk', 30)) * 60000;
  for (;;) {
    const o = await onay.oku(a1);
    if (o.durum === 'tamam') { console.log(ozet(o)); break; }
    if (Date.now() > son) { console.log(`Zaman aşımı; ${o.ogeler.filter((x) => !x.karar).length} öge bekliyor.\n` + ozet(o)); process.exit(2); }
    await new Promise((r) => setTimeout(r, 2000));
  }
} else if (cmd === 'duzenlendi') {
  await onay.karar(a1, a2, { duzenlendi: true, ...(a3 ? { not: a3 } : {}) });
  console.log('işaretlendi');
} else if (cmd === 'liste') {
  for (const o of await onay.liste()) console.log(`${o.id.padEnd(24)} ${o.durum.padEnd(8)} nesne ${o.nesne.karar}/${o.nesne.toplam} ses ${o.ses.karar}/${o.ses.toplam} ${o.arsiv ? '(arşiv)' : ''} ${o.baslik}`);
} else {
  console.log('Kullanım: npm run onay -- olustur|durum|bekle|liste|duzenlendi …  (başlıktaki açıklamaya bak)');
}
