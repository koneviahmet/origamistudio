// Bileşen arama (yapay zekâ için ucuz seçim): etiket + sorgu → kısa aday listesi.
//   npm run bilesen -- "geri sayım dramatik"                 # serbest sorgu (eş anlamlılar dahil)
//   npm run bilesen -- --amac fiyatlandirma --ton premium-sik   # etiket süzgeci (virgül = VEYA)
//   npm run bilesen -- --tur kart --konu e-ticaret "indirim"    # tür + etiket + sorgu
//   npm run bilesen -- --etiketler                              # sözlük özeti (facet: değerler)
//   npm run bilesen -- --detay fiyat-pro                        # ayarlar (props) + kullanım satırı
//   npm run bilesen -- --alanlar fiyat-pro                      # özelleştirilebilir TÜM alanlar (tip, varsayılan, şu anki değer, seçenekler)
//   npm run bilesen -- --varyantlar                             # hızlı stil varyantları (koyu, vurgulu, büyük…)
//   Seçenekler: --n 8   --kind istatistik   --facet-adı değer(ler)   --json
import { bilesenleriOku, taksonomiOku } from './lib/bilesen.mjs';
import { FACET_ORDER, matchComponent, tagCounts } from '../web/src/componentTags.js';
import { WIDGET_FIELDS } from '../web/src/engine/widgets.js';
import { VARIANTS } from '../web/src/engine/widgetStyle.js';
import { PRESETS } from '../web/src/engine/presets.js';

const argv = process.argv.slice(2);
const flags = {};
const words = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const next = argv[i + 1];
    if (['etiketler', 'json', 'liste'].includes(k) || next === undefined || next.startsWith('--')) flags[k] = true;
    else flags[k] = argv[++i];
  } else words.push(a);
}

const tax = taksonomiOku();
const docs = bilesenleriOku();

if (flags.etiketler) {
  const counts = tagCounts(docs);
  for (const f of FACET_ORDER) {
    const vals = Object.keys(tax[f]?.degerler || {});
    console.log(`${f} (${tax[f]?.ad}): ${vals.map((v) => `${v}${counts[f]?.[v] ? `·${counts[f][v]}` : ''}`).join(', ')}`);
  }
  console.log(`tur: ${[...new Set(docs.map((d) => d.type))].join(', ')}   (--tur, --kind ile süz)`);
  console.log(`toplam ${docs.length} bileşen`);
  process.exit(0);
}

if (flags.varyantlar) {
  for (const [n, v] of Object.entries(VARIANTS)) console.log(`${n.padEnd(8)} ${v.info}`);
  console.log("kullanım: B('<id>', { varyant: ['koyu', 'buyuk'] })  — birden çok varyant sırayla uygulanır, açık alanlar en son ve en güçlü");
  process.exit(0);
}

if (flags.alanlar) {
  const d = docs.find((x) => x.id === flags.alanlar);
  if (!d) {
    console.log(`yok: ${flags.alanlar}`);
    process.exit(1);
  }
  const kind = d.props?.kind;
  const fields = WIDGET_FIELDS[d.type] || [];
  const aktif = fields.filter((f) => !f.kinds || f.kinds.includes(kind || fields.find((x) => x.key === 'kind')?.def));
  console.log(`${d.id} — ${d.name} (${d.type}${kind ? '/' + kind : ''})  [alan: tip, varsayılan → bu bileşende]`);
  for (const f of aktif) {
    const cur = d.props?.[f.key];
    const opts = f.options ? ' {' + f.options.map((o) => o[0]).filter(Boolean).join('|') + '}' : '';
    const kinds = f.kinds && !kind ? '' : '';
    const show = (v) => (v === undefined || v === '' ? '' : JSON.stringify(v));
    console.log(`  ${f.key}: ${f.type}${opts}${f.def !== undefined && f.def !== '' ? `, var=${show(f.def)}` : ''}${cur !== undefined ? ` → ${show(cur).slice(0, 70)}` : ''}  // ${f.label}${f.hint ? ' — ' + f.hint : ''}${kinds}`);
  }
  const other = fields.filter((f) => f.kinds && !aktif.includes(f)).map((f) => f.key);
  if (other.length) console.log(`  (başka kind'lerde: ${[...new Set(other)].join(', ')} — kind değiştirirsen açılır)`);
  const gir = Object.entries(PRESETS).filter(([, v]) => v.cat === 'giris').map(([k]) => k).join(', ');
  const cik = Object.entries(PRESETS).filter(([, v]) => v.cat === 'cikis').map(([k]) => k).join(', ');
  console.log('GENEL (her katmanda): x, y, scale, rotation, opacity, start, end, depth, blur, group, loops[], anims[], path/pathT, fold (çizilme ilerlemesi, keyframe dizisi)');
  console.log('YARDIMCI (B(id, {...}) ile): varyant, tema, konum, genislik, giris, cikis, start, end, id');
  console.log(`  konum: orta|ust|alt|sol|sag|sol-ust|sag-ust|sol-alt|sag-alt|ust-orta|alt-orta|alt-bant | [fx, fy]   genislik: W oranı (≤2) | px`);
  console.log(`  giris: ${gir}`);
  console.log(`  cikis: ${cik}`);
  process.exit(0);
}

if (flags.detay) {
  const d = docs.find((x) => x.id === flags.detay);
  if (!d) {
    console.log(`yok: ${flags.detay}`);
    process.exit(1);
  }
  console.log(`${d.id} — ${d.name} (${d.type})`);
  console.log(d.description || '');
  console.log('etiketler:', JSON.stringify(d.etiketler));
  console.log('props:', JSON.stringify(d.props));
  console.log(`kullanım: L(bilesen('${d.id}', { id: '...', x: 540, y: 900, start: 2, end: 8, ...alanlar }))   // scripts/lib/bilesen.mjs`);
  process.exit(0);
}

const filters = {};
for (const f of [...FACET_ORDER, 'tur', 'kind']) if (typeof flags[f] === 'string') filters[f] = flags[f].split(',').map((s) => s.trim()).filter(Boolean);
const query = words.join(' ');
const n = Number(flags.n) || 8;
const ranked = docs
  .map((d) => ({ d, s: matchComponent(d, query, filters, tax) }))
  .filter((x) => x.s > 0)
  .sort((a, b) => b.s - a.s || a.d.id.localeCompare(b.d.id))
  .slice(0, flags.liste ? 999 : n);

if (flags.json) {
  console.log(JSON.stringify(ranked.map((x) => ({ id: x.d.id, tur: x.d.type, etiketler: x.d.etiketler, props: x.d.props }))));
  process.exit(0);
}
if (!ranked.length) {
  console.log('Sonuç yok. Daha az süzgeç dene ya da `npm run bilesen -- --etiketler` ile sözlüğe bak.');
  process.exit(0);
}
const kisa = (a = []) => a.join(',');
for (const { d } of ranked) {
  const e = d.etiketler;
  const kind = d.props?.kind || d.props?.frame || d.props?.style || '';
  const size = d.props?.width ? `${d.props.width}${d.props.height ? '×' + d.props.height : ''}` : '';
  console.log(`${d.id}  ${d.type}${kind ? '/' + kind : ''} ${size} | amaç:${kisa(e.amac)} | konu:${kisa(e.konu)} | ton:${kisa(e.ton)} | ${kisa(e.stil)} | gerek:${kisa(e.gereksinim)}`);
}
console.log(`— ${ranked.length} sonuç. Ayrıntı: npm run bilesen -- --detay <id>`);
