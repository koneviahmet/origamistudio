// Ses kataloğunu ve etiketleri listeler (sunucu açık olmasa da çalışır; /ses sayfasıyla aynı veri).
//   node scripts/sesler.mjs --etiketler                       etiketler ve kaç ses taşıdıkları
//   node scripts/sesler.mjs --etiket "Sakin" (ya da "Anlatıcı,Sakin,Genç": hepsini taşıyanlar) [--cinsiyet erkek|kadin] [--ara kelime] [--limit 20]
//   node scripts/sesler.mjs --kayitli                         ★ ile kaydedilen sesler (ad + etiketler)
// Çıktıdaki id ya da kayıtlı ad, `npm run seslendir -- --ses-id <id|ad>` ile kullanılır.
import { createTts } from '../server/tts.js';

const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(`--${n}`) ? a[a.indexOf(`--${n}`) + 1] : d);
const GENDER = { erkek: 'male', kadin: 'female', 'kadın': 'female', male: 'male', female: 'female' };
const tts = createTts();
const tags = await tts.listTags();
const ad = (id) => tags.find((t) => t.id === id)?.name || id;
const satir = (v) =>
  `${v.id}  ${v.gender === 'male' ? 'erkek' : 'kadın'}  ${v.name ? `[${v.name}]  ` : ''}${(v.tags || []).map(ad).join(', ') || '-'}\n    ${v.description}`;

if (a.includes('--etiketler')) {
  if (!tags.length) console.log('Etiket yok. /ses sayfasında "Hazır etiketleri uygula" ya da kendi etiketlerini ekle.');
  for (const t of tags) console.log(`${t.name.padEnd(22)} ${String(t.count).padStart(5)} ses   (id: ${t.id})`);
} else if (a.includes('--kayitli')) {
  const s = await tts.saved();
  if (!s.length) console.log('Kayıtlı ses yok.');
  s.forEach((v) => console.log(satir(v)));
} else {
  const etiket = opt('etiket');
  let tag = '';
  if (etiket) {
    const ts = await Promise.all(etiket.split(',').map((n) => tts.findTag(n)));
    const yok = etiket.split(',')[ts.findIndex((t) => !t)];
    if (ts.some((t) => !t)) (console.error(`Etiket yok: ${yok}. Var olanlar: ${tags.map((x) => x.name).join(', ') || '(hiç)'}`), process.exit(1));
    tag = ts.map((t) => t.id).join(',');
  }
  const g = opt('cinsiyet');
  if (g && !GENDER[g]) (console.error('--cinsiyet erkek ya da kadin olmalı'), process.exit(1));
  const r = await tts.catalog({ tag, gender: g ? GENDER[g] : '', q: opt('ara', ''), length: Number(opt('limit', 20)) });
  if (r.building) (console.error('Katalog henüz indirilmedi; `npm run dev` ile sayfayı açıp bekle ya da bir kez tekrar çalıştır.'), process.exit(1));
  console.log(`${r.total} ses${r.total > r.rows.length ? ` (ilk ${r.rows.length} gösteriliyor, --limit ile artır)` : ''}`);
  r.rows.forEach((v) => console.log(satir(v)));
}
process.exit(0);
