// Kütüphane ve motor kataloğunu (docs/katalog.md) veriden otomatik üretir.
// Yapay zekâ bu dosyayı okuyarak hangi model / efekt / tema / stil / animasyonun var olduğunu bilir.
//   npm run katalog
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const eng = (f) => import(pathToFileURL(path.join(ROOT, 'web', 'src', 'engine', f)).href);

const { PRESETS, PRESET_CATS } = await eng('presets.js');
const { TEXT_ANIMS, TEXT_ANIM_CATS } = await eng('textanims.js');
const { TRANSITIONS } = await eng('transitions.js');
const { EASE_NAMES, BEZIER_PRESETS } = await eng('easing.js');
const { STYLES } = await eng('styles.js');
const { PAPERS, ROLES } = await eng('theme.js');
const { PARTICLE_MOTIONS, PARTICLE_SHAPES } = await eng('particles.js');
const { ARROW_CURVES, ARROW_LINES, ARROW_HEADS, ARROW_FLOWS } = await eng('arrows.js');

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const dirJson = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => ({ id: f.slice(0, -5), ...readJson(path.join(d, f)) })) : []);
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');

const out = [];
const w = (s = '') => out.push(s);
w('# Origami Studio — Katalog');
w();
w('> Bu dosya `npm run katalog` ile **otomatik üretilir** — elle düzenleme. Kütüphane / tasarım değişince yeniden üret.');
w(`> Üretim: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
w();

// ---------------------------------------------------------------- modeller
const cats = fs.readdirSync(path.join(DATA, 'library')).filter((c) => fs.statSync(path.join(DATA, 'library', c)).isDirectory());
const assets = cats.flatMap((c) => dirJson(path.join(DATA, 'library', c)).map((a) => ({ ...a, category: c })));
const models = assets.filter((a) => !a.type);
const arrows = assets.filter((a) => a.type === 'arrow');
const effects = assets.filter((a) => a.type === 'particles');

w(`## 1. Origami modelleri (${models.length})`);
w();
w('Sahnede: `{ "asset": "<id>", "variant": "<varyant>" }`. Boyut = varlık koordinat kutusu; `scale` = istenen px / en uzun kenar.');
w('Parçalar `kanat-cirp` / `kuyruk-salla` ön ayarlarıyla ya da `parts` ile canlanır.');
w();
w('| id | ad | kategori | boyut | parçalar | roller | varyantlar | etiketler |');
w('|---|---|---|---|---|---|---|---|');
for (const a of models.sort((x, y) => x.category.localeCompare(y.category) || x.id.localeCompare(y.id))) {
  const roles = Object.entries(a.roles || {}).map(([k, r]) => `${k}:${r}`).join(' ');
  const vars = Object.entries(a.variants || {}).map(([k, v]) => `${k}${v.name ? ` (${v.name})` : ''}`).join(', ');
  w(`| \`${a.id}\` | ${esc(a.name)} | ${a.category} | ${(a.size || []).join('×')} | ${Object.keys(a.parts || {}).join(', ') || '—'} | ${roles || '—'} | ${esc(vars) || '—'} | ${esc((a.tags || []).join(', '))} |`);
}
w();

// ---------------------------------------------------------------- efektler
w(`## 2. Parçacık efektleri (${effects.length})`);
w();
w('Sahnede: `{ "type": "particles", "particle": "<id>", "mode": "surekli" | "patlama", "start", "end" }`');
w();
w('| id | ad | hareket | şekil | adet | boyut | hız | rüzgâr | başta dolu |');
w('|---|---|---|---|---|---|---|---|---|');
for (const e of effects.sort((x, y) => x.id.localeCompare(y.id))) {
  w(`| \`${e.id}\` | ${esc(e.name)} | ${e.motion} | ${e.shape}${e.asset ? ` (${e.asset})` : ''} | ${e.count} | ${e.size} | ${e.speed} | ${e.wind || 0} | ${e.prewarm ? 'evet' : '—'} |`);
}
w();
w(`Hareket türleri: ${Object.entries(PARTICLE_MOTIONS).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`);
w();
w(`Şekiller: ${Object.entries(PARTICLE_SHAPES).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`);
w();

// ---------------------------------------------------------------- oklar
w(`### Ok stilleri (${arrows.length})`);
w();
w('Sahnede: `{ "type": "arrow", "arrow": "<id>", "from": "<katman id>" | [x, y], "to": …, "label", "rider": { "asset" } }` — şema §11');
w();
w('| id | ad | eğri | çizgi | baş / kuyruk | akış | renk |');
w('|---|---|---|---|---|---|---|');
for (const a of arrows.sort((x, y) => x.id.localeCompare(y.id))) {
  w(`| \`${a.id}\` | ${esc(a.name)} | ${a.curve || 'kavis'} | ${a.line || 'duz'} | ${a.head || 'ucgen'} / ${a.tail || 'yok'} | ${a.flow || '—'} | ${a.color || ''}${a.color2 ? ` → ${a.color2}` : ''} |`);
}
w();
w(`Eğriler: ${Object.entries(ARROW_CURVES).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`);
w();
w(`Çizgiler: ${Object.entries(ARROW_LINES).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`);
w();
w(`Uçlar: ${Object.entries(ARROW_HEADS).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`);
w();
w(`Akış: ${Object.entries(ARROW_FLOWS).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`);
w();

// ---------------------------------------------------------------- temalar
const themes = dirJson(path.join(DATA, 'themes'));
w(`## 3. Temalar (${themes.length})`);
w();
w('Sahnede: `"theme": "<id>"`. Renk referansları: `"$baslik"`, `"$metin"`, `"$vurgu"`, `"$arka1"`, `"$arka2"`.');
w();
w('| id | ad | kağıt | baslik | metin | vurgu | arka1 → arka2 | ayar / palet |');
w('|---|---|---|---|---|---|---|---|');
for (const t of themes) {
  const c = t.colors || {};
  const extra = [t.adjust ? Object.entries(t.adjust).map(([k, v]) => `${k} ${v}`).join(', ') : '', t.palette ? `palet ${t.palette.length} renk (güç ${t.paletteStrength ?? 1})` : '', t.roles ? `rol: ${Object.entries(t.roles).map(([k, v]) => `${k}=${v}`).join(' ')}` : ''].filter(Boolean).join('; ');
  w(`| \`${t.id}\` | ${esc(t.name)} | ${t.paper || 'mat'} | ${c.baslik || '—'} | ${c.metin || '—'} | ${c.vurgu || '—'} | ${c.arka1 || '—'} → ${c.arka2 || '—'} | ${esc(extra) || '—'} |`);
}
w();
w(`Kağıt tipleri: ${Object.entries(PAPERS).map(([k, v]) => `\`${k}\` ${v.label}`).join(' · ')}`);
w();
w(`Renk rolleri: ${ROLES.map((r) => `\`${r}\``).join(', ')}`);
w();

// ----------------------------------------------------------- metin stilleri
const ts = dirJson(path.join(DATA, 'textstyles'));
w(`## 4. Metin stilleri (${ts.length})`);
w();
w('Sahnede: `{ "type": "text", "textStyle": "<id>", "text": "…" }` — katmandaki alanlar stili ezer.');
w();
w('| id | ad | font | kalınlık | boyut | renk | özellikler |');
w('|---|---|---|---|---|---|---|');
for (const s of ts) {
  const f = [s.uppercase ? 'BÜYÜK HARF' : '', s.letterSpacing ? `aralık ${s.letterSpacing}` : '', s.stroke ? 'kontur' : '', s.shadow ? 'gölge' : '', s.box ? 'kutu' : ''].filter(Boolean).join(', ');
  w(`| \`${s.id}\` | ${esc(s.name)} | ${s.font} | ${s.weight} | ${s.size} | ${s.color} | ${f || '—'} |`);
}
w();

// ---------------------------------------------------------------- fontlar
const fonts = fs.existsSync(path.join(DATA, 'fonts', 'fonts.json')) ? readJson(path.join(DATA, 'fonts', 'fonts.json')).fonts : [];
const trBad = fonts.filter((f) => !f.latinExt || f.check?.ok === false);
w(`## 5. Fontlar (${fonts.length})`);
w();
w(`**Türkçe'de KULLANMA:** ${trBad.map((f) => `${f.family}${f.check?.missing ? ` (eksik: ${f.check.missing})` : ' (Türkçe alt kümesi yok)'}`).join(', ') || '—'}. Varsayılan: **Baloo 2**.`);
w();
const byCat = {};
for (const f of fonts) if (!trBad.includes(f)) (byCat[f.category] ||= []).push(`${f.family} (${f.weights.join('/')})`);
for (const [c, list] of Object.entries(byCat)) w(`- **${c}:** ${list.join(', ')}`);
w();

// ------------------------------------------------------------ animasyonlar
w(`## 6. Katman animasyon ön ayarları — \`anims\` (${Object.keys(PRESETS).length})`);
w();
w('`"anims": [{ "preset": "<id>", "t": <başlangıç>, "dur": <süre>, ...parametreler }]`');
w();
w('| id | ad | kategori | varsayılan süre | parametreler |');
w('|---|---|---|---|---|');
for (const [id, p] of Object.entries(PRESETS)) {
  w(`| \`${id}\` | ${p.name} | ${PRESET_CATS[p.cat]} | ${p.dur ?? 'sonsuz'} | ${p.params.map((x) => `\`${x.key}\`=${JSON.stringify(x.def)}`).join(', ') || '—'} |`);
}
w();
w(`## 7. Metin animasyonları — \`textAnims\` (${Object.keys(TEXT_ANIMS).length})`);
w();
w('`"textAnims": [{ "preset": "<id>", "t": <başlangıç>, "dur": <birim süresi>, "aralik": <birimler arası> }]`');
w();
w('| id | ad | kategori | birim | süre | aralık |');
w('|---|---|---|---|---|---|');
for (const [id, a] of Object.entries(TEXT_ANIMS)) w(`| \`${id}\` | ${a.name} | ${TEXT_ANIM_CATS[a.cat]} | ${a.unit} | ${a.dur ?? '—'} | ${a.aralik ?? '—'} |`);
w();

// ---------------------------------------------------------------- geçişler
w(`## 8. Geçişler — \`transitions\` (${Object.keys(TRANSITIONS).length})`);
w();
w('`"transitions": [{ "type": "<id>", "t": <kesme anı>, "dur": <süre> }]` — örtü: [t−dur/2, t+dur/2], kare: [t, t+dur]');
w();
w('| id | ad | tür | varsayılan süre | parametreler |');
w('|---|---|---|---|---|');
for (const [id, t] of Object.entries(TRANSITIONS)) w(`| \`${id}\` | ${t.name} | ${t.kind === 'cover' ? 'örtü' : 'kare'} | ${t.dur} | ${t.params.join(', ') || '—'} |`);
w();

// ---------------------------------------------------------- easing / stil
w('## 9. Easing ve çizim stilleri');
w();
w(`Adlandırılmış eğriler: ${EASE_NAMES.map((e) => `\`${e}\``).join(', ')}`);
w();
w(`Hazır Bézier eğrileri (\`"ease": [x1, y1, x2, y2]\`): ${Object.entries(BEZIER_PRESETS).map(([k, v]) => `${k} \`[${v.join(', ')}]\``).join(' · ')}`);
w();
w(`Çizim stilleri (\`"style"\`): ${Object.entries(STYLES).map(([k, v]) => `\`${k}\` ${v.label} — ${v.hint}`).join(' · ')}`);
w();

// ----------------------------------------------------------- ses / projeler
const audio = fs.existsSync(path.join(DATA, 'audio')) ? fs.readdirSync(path.join(DATA, 'audio')).filter((f) => /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(f)) : [];
w(`## 10. Ses dosyaları (${audio.length})`);
w();
w(`Müzik: ${audio.filter((f) => !f.startsWith('sfx-')).map((f) => `\`${f}\``).join(', ') || '—'}  `);
w(`Efektler (\`sfx.auto\` kullanır): ${audio.filter((f) => f.startsWith('sfx-')).map((f) => `\`${f}\``).join(', ') || '—'}`);
w();
w('`uzay-ambiyans.wav`: 120 BPM, ilk vuruş 0.25 sn, 64 sn (sentez, telifsiz).');
w();
const projects = fs.readdirSync(path.join(DATA, 'projects')).filter((p) => fs.existsSync(path.join(DATA, 'projects', p, 'scene.json')));
w(`## 11. Örnek projeler (${projects.length})`);
w();
for (const p of projects) {
  const s = readJson(path.join(DATA, 'projects', p, 'scene.json'));
  const gen = fs.existsSync(path.join(ROOT, 'scripts', `scenes-${p}.mjs`)) ? ` — üreteç: \`scripts/scenes-${p}.mjs\`` : '';
  w(`- \`${p}\` **${s.name}** — ${s.width}×${s.height}, ${s.duration} sn, ${s.layers.length} katman${s.theme ? `, tema ${s.theme}` : ''}${s.style ? `, stil ${s.style}` : ''}${gen}`);
}
w();

fs.writeFileSync(path.join(ROOT, 'docs', 'katalog.md'), out.join('\n'));
console.log(`Yazıldı: docs/katalog.md (${models.length} model, ${effects.length} efekt, ${themes.length} tema, ${ts.length} metin stili, ${fonts.length} font)`);
