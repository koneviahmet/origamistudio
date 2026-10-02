# Üretim özeti — teknik sözlük (tek sayfa)

Bu dosya **ilham değil, yetenek listesidir**: neler mümkün, hangi alan ne yapar. Ne yapacağına sen karar ver (CLAUDE.md "serbest mod").
Ayrıntı: [schema.md](schema.md) · envanter (model/efekt/tema adları): [katalog.md](katalog.md) · reçeteler: [prompt-rehberi.md](prompt-rehberi.md) §4–§8.

## Akış
**Render yasağı:** Claude MP4 render etmez (`npm run render` dahil); kullanıcı arayüzden (Dışa aktar) alır. Claude yalnızca `dogrula` + kare kontrolü yapar.
`scripts/scenes-<id>.mjs` (üreteç, bkz. scripts/sablon-sahne.mjs iskeleti) → `data/projects/<id>/scene.json` → `npm run dogrula -- <id>` → kare kontrolü (§5). **MP4 render yok (kullanıcı arayüzden yapar).**
Eksik model: `scripts/seed-<konu>.mjs` ile `data/library/<kategori>/<id>.json` yaz (facet stili, aşağıda). Sonra `npm run katalog`.

## Sahne
`{ name, width, height, fps, duration, theme (id | satır içi nesne), style, background, camera, layers[], transitions[], sections[], groups[], audio[], sfx, formats[], sketch }`
- Boyutlar: 9:16 1080×1920 · 16:9 1920×1080 · 1:1 1080² · 4:5 1080×1350. 9:16 güvenli alan: metin y 250–1450, alt 1500+ ve sağ kenar x>930 (y 860–1500) boş.
- Hemen her sayı keyframe izi olabilir: `[{t, v, ease?}]`. `ease` = ad (`outBack`, `inOutCubic`…) ya da `[x1,y1,x2,y2]`. `loops: [{prop,type:sine|triangle|saw|noise,amp,period}]`.
- Kamera: `camera {zoom,x,y,rotation,focus,dof}` animasyonlanabilir. Katman `depth` (>0 uzak, <0 yakın = paralaks), `blur`.

## Katman türleri
| tür | anahtar alanlar |
|---|---|
| origami (varsayılan) | `asset, variant, x, y, anchor, scale/scaleX/scaleY, rotation, opacity, fold (0..1 görünme), foldStyle, palette, shadow, parts, anims, path+pathT, start/end, group` |
| `text` | `text, textStyle, font, size, weight, color, align, lineHeight, uppercase, letterSpacing, stroke, shadow, box{color,radius,padding}, reveal (daktilo), textAnims` |
| `particles` | `particle:<kütüphane efekti>` ya da `preset`, `mode: surekli|patlama`, `count,size,speed,wind,colors,seed,area,prewarm` |
| `arrow` | `arrow:<stil>, from, to (katman id | [x,y]), label, rider{asset}, fold/anims: cizerek-gir` |
| `chart` | `kind: bar|yatay|line|pie|donut|sayac, data[{label,value,color}], title, unit, max, card, textColor` |
| `device` | `frame: telefon|tablet|laptop|tarayici, src | ui: liste|panel|sohbet, title, lines, scroll` |
| `media` | `src` (data/media), `trim, rate, loop, radius` |
| `waveform` | `style: cubuk|cizgi|daire|nokta, bars, color, color2` (ses zarfı) |
| `karakter` | `karakter:<id>, x,y (AYAK ucu), scale, yon, varyant, ekler, akis[{t,aksiyon,duygu,dx,dy,hedef,bak,tutar,efekt,sure}], soz[{t,metin,tur}]` — şema §15 |

## Ön ayarlar (ad listesi — parametreler katalog §6–§8)
- `anims` (giriş): katlanarak-gir, cizerek-gir, zipla-gir, kayarak-gir, ekrana-gir, dusup-gir, donerek-gir, belir · (çıkış): katlanarak-cik, silinerek-cik, kuculerek-cik, kayarak-cik, ekrandan-cik, sol, dal
  · (sürekli): suzul, sallan, nefes, nabiz, seksek, dalgada, titre, don, kanat-cirp, kuyruk-salla, ritimle-nabiz/zipla/sallan, sesle-buyu/parla/titre · (hareket): gec
- `textAnims`: harf-katla/zipla/dus/don/belir, kelime-zipla, satir-kay, dalga, titresim, harf-katla-cik, harf-dagil
- Geçişler (`t` = kesme anı; eski katmanlar `end=t`, yeniler `start=t`): örtü → katlama, perde, iris, yirtik · kare → sayfa-cevir, kaydir (yon), yakinlas · yeni örtü → jaluzi, mozaik (seed), benek, capraz, seritler, elmas, dalga (yon), yildiz, kepenk, saat · yeni kare → solma, uzaklas, kapi, dilim, pikselle, daire-ac, silme, dusen, don-kucul, cevir-dikey
- Stiller: `origami`, `kagit-kesme` (tabakalı derin gölge), `duz` (vektör), `cizim` (kontur + pastel boya; `sketch` ayarları), `neon`, `cam`, `mozaik` (low-poly), `teknik` (mavi pafta), `vitray`, `kil`, `siluet`, `gazete`, `halftone`, `suluboya`, `nakis`, `piksel`. Katman bazında da verilebilir.
- Tema: kayıtlı `theme: "<id>"` ya da **satır içi** `{ paper, adjust, palette, roles, colors{arka1,arka2,baslik,metin,vurgu}, background, vignette }`. Renk referansı `"$vurgu"`.
- Metin stilleri ve fontlar: katalog §4–§5. Türkçe'de Fredoka, Lilita One, Satisfy, Titan One kullanma. Font listesi geniş (48); varsayılana yapışma.
- Ses: `audio[{file,start,volume,fadeIn,fadeOut,bpm,beatOffset,env}]`, `sfx:{auto,volume}`. Seslendirme: `npm run seslendir` (ses: `/ses` sayfası, etiketle seç). Müzik: `npm run muzik` (yerel ACE-Step; >120 sn'de aynı parça döngüye alınır, çapraz geçişli). Efekt: `npm run gen-audio`.
- Çoklu format: `formats[{id,width,height,mode: sigdir|kirp,zoom,focusX/Y,overrides}]`.

## Yeni model / efekt yazmak
- **Logo / tek renkli görsel → birebir vektör model:** `npm run vektor -- <gorsel.png> --id <id> --ad "<Ad>" [--kategori marka] [--esik 175] [--ters]` (kontur izleme, tek facet / parça; düşük çokgen değil). Mevcut: `marka/logo`.
- Model: `{ id, name, tags, size:[w,h], palette{a,b..}, roles, variants, parts{ad:{pivot}}, facets:[{p:[[x,y]..],c:'a',s:-1..1,part?}] }` — her düzlem iki üçgen, zıt `s`; ilk facet en arkada.
  Dosya: `data/library/<kategori>/<id>.json` (kategori = klasör; yeni kategori açabilirsin).
- Efekt: `data/library/efektler/<id>.json` → `{ type:'particles', motion: dus|yuksel|yerinde, shape: kagit|kar|damla|yaprak|kabarcik|pirilti|varlik, asset?, count,size,speed,wind,sway,spin,colors,prewarm }`.
- Ok stili: `data/library/oklar/<id>.json` (şema §11).

## Bileşenler (az token)
`npm run bilesen -- "<sorgu>"` · `--amac/--konu/--ton/--stil/--icerik/--tur/--n` · `--etiketler` · `--detay <id>`; sahneye: `L(B(id, {id,konum,genislik,start,end,varyant,tema:true,…alanlar,giris,cikis}))` (`bilesenBaglam({W,H,tema})`, `scripts/lib/bilesen.mjs`); özelleştirilebilir alanlar: `--alanlar <id>`, `--varyantlar`. `data/components/*.json` dosyalarını okuma.

## Karakterler (konuşan / yürüyen / tanıtan — az token)
`npm run karakter -- "<sorgu>"` (robot, kedi, çocuk…) · `--detay <id>` (varyant, aksesuar, örnek) · `--aksiyonlar [sorgu]` · `--duygular` · `--nesneler` · `--efektler`. `data/characters/*.json` dosyalarını okuma.
Hareketler ve duygular **tüm karakterler için ortaktır** (yeni karakter eklemek = yalnızca görünüm). Üreteçte: `const K = karakterBaglam({W,H}); L(K('copadam', { id, konum, boy, varyant, ekler, start, akis, soz }))`;
iki karakter konuşturmak: `diyalog({a, b}, [{kim, metin, duygu?, aksiyon?, hedef?, sure}], { t0 })` (`scripts/lib/karakter.mjs`). Ürünü tanıtma: `aksiyon: 'tanit'|'isaret', hedef: <katman id>`. Yürütme: `{ aksiyon: 'yuru', dx: 600, sure: 3 }`. Şema §15, rehber §11.

## Kontrol (kısa)
Okuma ≥2.5 sn/bilgi · başlık y 250–450 · Türkçe glif · geçişte start/end = t · emin olmadığın bilgiyi koyma · kareleri gör (§5) · test görsellerini sil ·
`npm run katalog` (yeni model/efekt/proje) · `docs/kullanilan-kombinasyonlar.md`'ye satır.
