// Karakter / aksiyon / duygu arama (yapay zekâ için ucuz seçim): kısa aday listesi.
//   npm run karakter -- "robot teknoloji"              # karakter ara (ad, açıklama, etiket)
//   npm run karakter                                    # tüm karakterler (kısa)
//   npm run karakter -- --detay copadam                 # varyantlar, aksesuarlar, özel aksiyon/duygular + örnek kullanım
//   npm run karakter -- --aksiyonlar [sorgu]            # ortak aksiyon kataloğu (tüm karakterler için geçerli)
//   npm run karakter -- --duygular [sorgu]              # yüz ifadeleri
//   npm run karakter -- --nesneler | --efektler | --balonlar
import { karakterleriOku } from './lib/karakter.mjs';
import { ACTIONS, ACTION_GROUPS, EMOTIONS, PROPS, EFFECTS, BUBBLE_KINDS, EK_TURLERI } from '../web/src/engine/characterData.js';

const argv = process.argv.slice(2);
const flags = {};
const words = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const next = argv[i + 1];
    if (['detay'].includes(k) && next && !next.startsWith('--')) flags[k] = argv[++i];
    else flags[k] = true;
  } else words.push(a);
}
const norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i');
const q = norm(words.join(' ')).split(/\s+/).filter(Boolean);
const score = (hay) => (q.length ? q.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0) : 1);
const docs = karakterleriOku();
const cut = (s, n = 110) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

if (flags.aksiyonlar || flags.duygular || flags.nesneler || flags.efektler || flags.balonlar) {
  if (flags.aksiyonlar) {
    console.log('AKSİYONLAR — katmanda akis: [{ t, aksiyon, sure?, hiz?, dx?, dy?, hedef?, bak?, yon?, duygu?, tutar?, efekt? }]');
    console.log('  * (bekle) = boşta türü: konuşma sırasında otomatik "konus" jestine geçer · ↦ = dx/dy ile hareket (hız otomatik) · ◎ = hedef: katman id / [x,y]');
    for (const [g, label] of ACTION_GROUPS) {
      const rows = Object.entries(ACTIONS).filter(([, a]) => a.grup === g && score(norm([a.ad, a.aciklama, ...(a.etiket || []), ...Object.keys(ACTIONS)].join(' ') && `${norm(a.ad)} ${norm(a.aciklama)} ${(a.etiket || []).map(norm).join(' ')}`)) > 0);
      if (!rows.length) continue;
      console.log(`\n${label}`);
      for (const [k, a] of rows) console.log(`  ${k.padEnd(15)} ${a.bekle ? '*' : ' '}${a.adim ? '↦' : ' '}${a.isaret ? '◎' : ' '} ${cut(a.aciklama, 96)}`);
    }
  }
  if (flags.duygular) {
    console.log('DUYGULAR — katmanda duygu: "mutlu" · akışta duygu + siddet (0–1.5)');
    for (const [k, e] of Object.entries(EMOTIONS)) if (score(`${norm(k)} ${norm(e.ad)} ${norm(e.aciklama)} ${(e.etiket || []).map(norm).join(' ')}`) > 0) console.log(`  ${k.padEnd(11)} ${cut(e.aciklama, 90)}`);
  }
  if (flags.nesneler) {
    console.log('NESNELER — tutar: { nesne, metin?, renk?, el: "R"|"L", olcek? }   (tabela: metin zorunlu gibi)');
    for (const [k, p] of Object.entries(PROPS)) console.log(`  ${k.padEnd(11)} ${p.aciklama}`);
  }
  if (flags.efektler) {
    console.log('EFEKTLER — akis[i].efekt (başın üstünde): ');
    for (const [k, v] of Object.entries(EFFECTS)) console.log(`  ${k.padEnd(8)} ${v}`);
  }
  if (flags.balonlar) {
    console.log('BALON TÜRLERİ — soz: [{ t, sure?, metin, tur, taraf: "sol"|"sag" }]');
    for (const [k, v] of Object.entries(BUBBLE_KINDS)) console.log(`  ${k.padEnd(8)} ${v}`);
  }
  process.exit(0);
}

if (flags.detay) {
  const d = docs.find((x) => x.id === flags.detay);
  if (!d) {
    console.log(`Karakter yok: ${flags.detay}. Seçenekler: ${docs.map((x) => x.id).join(', ')}`);
    process.exit(1);
  }
  console.log(`${d.id} — ${d.name}`);
  console.log(`  ${d.description}`);
  if (d.kullanim) console.log(`  Kullanım: ${d.kullanim}`);
  console.log(`  Etiketler: ${(d.etiketler || []).join(', ')}`);
  console.log(`  Görünüm: kafa ${d.kafa?.sekil || 'daire'}, gövde ${d.govde?.sekil || 'dikdortgen'}, uzuv ${d.uzuv?.tur || 'cubuk'}/${d.uzuv?.el || 'parmak'}, göz ${d.yuz?.goz || 'nokta'}, çizgi titremesi ${d.cizgi?.titrek ?? 1.4}`);
  console.log(`  Varyantlar: ${Object.keys(d.varyantlar || {}).join(', ') || '(yok)'}`);
  const ekler = d.ekler || [];
  console.log(`  Aksesuarlar (ekler: [id…]): ${ekler.map((e) => `${e.id}${e.varsayilan === false ? '' : '*'}`).join(', ') || '(yok)'}   (* = varsayılan takılı)`);
  if (d.aksiyonlar) console.log(`  Bu karaktere özel aksiyonlar: ${Object.keys(d.aksiyonlar).join(', ')}`);
  if (d.duygular) console.log(`  Bu karaktere özel duygular: ${Object.keys(d.duygular).join(', ')}`);
  console.log(`  Aksesuar türleri: ${Object.entries(EK_TURLERI).map(([k, v]) => `${k}(${v.stiller.join('/')})`).join(' · ')}`);
  console.log(`\n  Örnek:\n    const K = karakterBaglam({ W, H });\n    L(K('${d.id}', { id: 'sunucu', konum: 'sol', start: 0.5, ${Object.keys(d.varyantlar || {})[0] ? `varyant: '${Object.keys(d.varyantlar)[0]}', ` : ''}\n      akis: [{ t: 1, aksiyon: 'selamla', duygu: 'mutlu' }, { t: 3.5, aksiyon: 'tanit', hedef: 'urun', duygu: 'cok-mutlu' }],\n      soz: [{ t: 1.3, metin: 'Merhaba!' }] }));`);
  process.exit(0);
}

const rows = docs
  .map((d) => ({ d, s: score(norm([d.id, d.name, d.description, d.kullanim, ...(d.etiketler || [])].join(' '))) }))
  .filter((x) => x.s > 0)
  .sort((a, b) => b.s - a.s);
if (!rows.length) {
  console.log(`Eşleşen karakter yok. Tüm karakterler: ${docs.map((d) => d.id).join(', ')}  (yeni karakter: Karakterler sayfası ya da scripts/seed-characters.mjs)`);
  process.exit(0);
}
for (const { d } of rows) {
  console.log(`${d.id.padEnd(10)} ${d.name} — ${cut(d.description, 120)}`);
  console.log(`${' '.repeat(11)}varyant: ${Object.keys(d.varyantlar || {}).join(', ') || '-'} · ek: ${(d.ekler || []).length} · etiket: ${(d.etiketler || []).slice(0, 7).join(', ')}`);
}
console.log(`\n${docs.length} karakter. Ayrıntı: npm run karakter -- --detay <id> · aksiyonlar: --aksiyonlar · duygular: --duygular`);
