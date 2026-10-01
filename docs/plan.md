# Origami Studio — Proje Planı

Kod ile üretilen origami tarzı animasyonlar hazırlayıp Instagram Reels, YouTube Shorts / YouTube,
TikTok gibi platformlar için MP4 video çıktısı alan bir masaüstü-web uygulaması.

## Temel fikir

```
 ┌──────────────┐      JSON (scene.json)       ┌──────────────────┐
 │  Claude (AI) │ ───────────────────────────▶ │  Origami Studio   │
 │  kodla üretir│ ◀─────────────────────────── │  önizleme + notlar│
 └──────────────┘      notlar (notes.json)     └──────────────────┘
        │                                               │
        ▼                                               ▼
  data/library/*  (origami çizim kütüphanesi)      MP4 dışa aktarım
```

1. Tüm çizimler **kütüphanede** (`data/library/<kategori>/<id>.json`) düz, katlanmış kağıt
   yüzeylerinden (facet) oluşan vektör origami modelleri olarak tutulur.
2. Her video bir **proje**dir: `data/projects/<id>/scene.json` — katmanlar, keyframe'ler,
   katlanma (fold) animasyonları, kamera, arka plan.
3. Kullanıcı stüdyoda videoyu oynatır, istediği kareye/nesneye **not** bırakır
   (`data/projects/<id>/notes.json`).
4. Claude notları okur (`npm run notes`), `scene.json`'u düzenler, notu `done` yapıp cevap yazar.
   Stüdyo dosya değişikliğini anında algılar ve önizlemeyi yeniler.
5. İstenildiği an tarayıcı içinde (WebCodecs) kare kare deterministik render ile **MP4** alınır.

## Teknoloji seçimi

| Katman | Seçim | Neden |
|---|---|---|
| Sunucu | Node.js + Express | JSON dosya deposu, CRUD API, dosya izleme (SSE) |
| Arayüz | Vue 3 + Vite (tek süreç, middleware mod) | Hızlı geliştirme, tek `npm run dev` |
| Render | Canvas 2D, saf fonksiyon `renderFrame(ctx, scene, t, lib)` | Önizleme ve dışa aktarım birebir aynı |
| Video | WebCodecs `VideoEncoder` + `mp4-muxer` | ffmpeg kurulumu gerekmez, H.264 MP4 |
| Depo | Düz JSON dosyaları | Claude doğrudan okuyup düzenleyebilir, git dostu |

## Fazlar

### Faz 0 — Mimari ve şema ✅
- [x] Klasör yapısı, `package.json`, Vite + Express tek süreç
- [x] Varlık (asset) şeması, sahne (scene) şeması, not şeması → `docs/schema.md`
- [x] AI çalışma akışı → `docs/ai-workflow.md`

### Faz 1 — Sunucu ve veri deposu ✅
- [x] Kütüphane CRUD: `GET/POST/PUT/DELETE /api/library`, kategori ekle/sil
- [x] Proje CRUD: listele, oluştur, kaydet, çoğalt, sil
- [x] Not CRUD: `POST/PATCH/DELETE /api/projects/:id/notes`
- [x] `GET /api/events` (SSE) — diskteki değişiklikleri arayüze canlı bildirir
- [x] Kimlik doğrulama (path traversal koruması), atomik dosya yazımı

### Faz 2 — Origami render motoru ✅
- [x] Renk/gölge (HSL tabanlı facet ışıklandırma), kağıt arka yüzü
- [x] Katlanma animasyonu: her facet kendi menteşe kenarı etrafında 3B dönüş (kosinüs izdüşümü)
- [x] Katlanma sırası: radial / left / right / top / bottom / index / random
- [x] Keyframe sistemi + 13 easing, döngüsel hareketler (sine, noise, saw, triangle)
- [x] Parça (part) animasyonu: kanat çırpma, kuyruk sallama (pivot etrafında)
- [x] Kamera (zoom / pan / rotate), metin katmanı (daktilo efekti), zemin gölgesi
- [x] Kağıt dokusu + vinyet, degrade arka planlar

### Faz 3 — Başlangıç kütüphanesi ✅
- [x] `npm run seed` ile ~18 origami modeli, 5 kategori
  (hayvanlar, doğa, gökyüzü, nesneler, şekiller)
- [x] Örnek proje: "Origami Orman" (9:16 Reels)

### Faz 4 — Kütüphane arayüzü ✅
- [x] Kategori listesi, arama, küçük resimler (üzerine gelince katlanma animasyonu)
- [x] Varlık düzenleyici: canlı önizleme, facet seçip renk/gölge düzenleme, JSON sekmesi
- [x] Oluştur / düzenle / çoğalt / sil / kategori taşı

### Faz 5 — Stüdyo (oynatıcı + düzenleyici) ✅
- [x] Oynat/durdur, kare adımı, hız (0.25×–2×), döngü, tam ekran
- [x] Zaman çizelgesi: cetvel, katman satırları, keyframe elmasları, not işaretleri, zoom
- [x] Sahnede seç + sürükle (keyframe'li özelliklerde o anki keyframe'i günceller)
- [x] Denetçi: özellikler, keyframe ekle/sil, easing, palet, katlanma stili, katman JSON'u
- [x] Kaplamalar: güvenli alan (Reels UI), üçte bir ızgarası
- [x] Geri al / yinele, Ctrl+S, klavye kısayolları
- [x] Proje ayarları: platform ön ayarları (9:16, 16:9, 1:1, 4:5), fps, süre, arka plan

### Faz 6 — Not ve AI revizyon döngüsü ✅
- [x] Zamana / katmana / sahnedeki bir noktaya iğnelenmiş notlar
- [x] Not durumu (open / done) + Claude cevabı
- [x] `npm run notes` — açık notları Claude için listeler
- [x] Not eklenince o anın karesi `snapshots/<notId>.png` olarak kaydedilir (Claude kareyi görür)
- [x] Disk değişikliğinde otomatik yeniden yükleme (kaydedilmemiş değişiklik varsa uyarı)

### Faz 7 — Dışa aktarım ✅
- [x] MP4 (H.264) — WebCodecs, ilerleme çubuğu, iptal
- [x] Çözünürlük ölçeği (tam / %50 taslak)
- [x] O anki kareyi PNG olarak kaydet

### Faz 9 — Tasarım sistemi (tema, stil, font, animasyon ön ayarları) ✅
- [x] **K1** Renk rolleri: varlık palet anahtarlarına anlam (`ana`, `ikincil`, `vurgu`, `acik`, `koyu`, `detay`)
- [x] **K2** Varyantlar: varlık başına kayıtlı renk setleri (`variants`), katmanda `variant` seçimi
- [x] **Ö1** Proje teması (`data/themes/`): kağıt tipi (mat/parlak/kraft/pastel), renk ayarı
      (ton/doygunluk/parlaklık/sıcaklık/kontrast), sınırlı palet eşleme, rol renkleri, `$renk` referansları
- [x] **Ö3** Animasyon ön ayarları: katmanda `anims: [{preset, t, dur, ...}]` — giriş / çıkış / sürekli / hareket,
      parametreli ve tahribatsız (renderer çalışma anında uygular)
- [x] **F1** Font kütüphanesi (`data/fonts/`): Türkçe destekli ~45 Google fontu yerel woff2 olarak;
      font ekle / sil / kategori
- [x] **F2** Türkçe karakter testi (ğüşıöçİĞÜŞÖÇ) — glif ölçümüyle otomatik doğrulama
- [x] **F3** Metin stilleri (`data/textstyles/`): font, boyut, renk, kontur, gölge, kutu, harf aralığı, büyük harf
- [x] **T1** Stil altyapısı: geometri ↔ çizim stili ayrımı; `scene.style` / `layer.style`
- [x] **T2** Kağıt kesme stili (katmanlı kağıt, derin gölge, katman katman belirme) + bonus düz vektör stili
- [x] Tasarım ekranı: Temalar · Metin stilleri · Fontlar · Animasyonlar (önizlemeli galeri)

- [x] F2 bulgusu: Fredoka (ğ ş İ), Titan One (İ), Satisfy (latin-ext yok) eksik → varsayılan font Baloo 2
- [x] Vitrin projesi: `tasarim-vitrini` (keyframe yok, tamamı ön ayar + tema + kağıt kesme)

### Faz 10 — Parçacıklar, müzik, editör kolaylıkları, metin animasyonları ✅
- [x] **Hız** Kağıt kesme stilinde tabaka başına küçük tampon (tüm varlık yerine) — dışa aktarım hızlanır
- [x] **A1** Parçacık katmanı (`type: "particles"`): konfeti, kar, yağmur, kabarcık, yaprak, yıldız tozu, varlık yağmuru;
      sürekli ya da patlama; deterministik (simülasyonsuz, zamanın saf fonksiyonu)
- [x] **S1** Müzik: `data/audio/` yükle/sil, sahnede `audio` izleri (başlangıç, kırpma, ses, fade), stüdyoda senkron çalma,
      zaman çizelgesinde dalga formu, MP4'e AAC ses (WebCodecs AudioEncoder + mp4-muxer)
- [x] **U1** Zaman çizelgesi: keyframe sürükle, çoklu seçim (Shift), kopyala/yapıştır (Ctrl+C/V), Delete,
      kareye / oynatma kafasına / diğer keyframe'lere mıknatıs; animasyon bloklarını sürükleyerek kaydırma
- [x] **U2** Sahne: ölçek ve döndürme tutamakları, sahne yakınlaştırma (Ctrl+tekerlek) ve kaydırma (Boşluk/orta tuş + sürükle), sığdır
- [x] **F4** Metin animasyonları (`textAnims`): harf harf katlanma, zıplama, düşme, dönme, belirme, kelime zıplama, dalga; çıkışlar

- [x] Hata düzeltmeleri: `anims` dizileri keyframe sanılıyordu (isTrack artık `t`+`v` ister); metin animasyonu bloğunda boşluk sayımı
- [x] Güneş Sistemi videosuna müzik, yıldız tozu, harf animasyonları eklendi

### Faz 11 — Geçişler, ses efektleri, ritim, görsel çizim editörü ✅
- [x] **A2** Sahne geçişleri (`scene.transitions`): örtü tipleri (katlama yelpazesi, perde, iris, yırtık kağıt)
      ve kare tabanlı tipler (sayfa çevir, itme, yakınlaşma); bölümler (`scene.sections`) — cetvelde bant, tıkla-git
- [x] **S3** Ses efekti kütüphanesi (sentez, telifsiz) + otomatik tetikleme (`scene.sfx.auto`): ön ayar / geçiş / patlama → efekt
- [x] **S2** Ritim algılama: BPM + faz (`audio[i].bpm`, `beatOffset`), zaman çizelgesinde vuruş çizgileri, vuruşlara mıknatıs
- [x] **K6** Görsel facet editörü: nokta sürükle (ızgara/nokta mıknatısı), kenara nokta ekle, nokta sil, yeni yüzey çiz,
      yatay simetri kopyası, parça pivotu sürükle

- [x] Çıkış sınırlayıcısı + yumuşak kırpıcı (müzik + efekt üst üste binince taşma yok)
- [x] Güneş Sistemi: bölümler, iris ve sayfa çevirme geçişleri, otomatik efektler, 120 BPM ızgarası
- [x] Ritim algılama: ped vurusu sorunu Faz 12'de spektral akı + metrik düzey düzeltmesiyle giderildi

### Faz 12 — Çoklu format, sürüm geçmişi, görselden origami ✅
- [x] **S2+** Ritim algılama: FFT tabanlı spektral akı (ped vurusuna daha dayanıklı)
- [x] **AI1** Sürüm geçmişi: her stüdyo kaydı ve diskteki (Claude) değişiklik otomatik sürüm; fark özeti; geri yükleme
- [x] **D1** Çoklu format (`scene.formats`): sığdır / kırp + odak + yakınlaştırma; format bazlı katman düzeltmeleri
      (`overrides`), stüdyoda format seçici (o formatta sürükleme = düzeltme), toplu dışa aktarım
- [x] **K7** Görselden origami: PNG/JPG/SVG → ön plan maskesi → renk kümeleme (k-means) → Delaunay üçgenleme
      → palet + roller + ışık; kütüphaneye ekle

- [x] Ritim testi: sentez müzik 120 BPM + 75–170 BPM tıklama izleri (ara vuruşlu / ara vuruşsuz) 10/10
- [x] Güneş Sistemi: YouTube 16:9, Kare 1:1, Instagram 4:5 formatları

### Faz 13 — Hareket yolu, easing eğri editörü, katman klasörleri ✅
- [x] **U3** Özel easing: keyframe `ease` = `[x1, y1, x2, y2]` (kübik Bézier); eğri editörü (tutamak sürükle, hazır eğriler, önizleme)
- [x] **Ö4** Hareket yolu: `layer.path = { points, smooth, closed, orient, orientOffset }` + `pathT` (0..1, keyframe'li);
      yay uzunluğuna göre sabit hız; stüdyoda yol çizimi / nokta sürükleme / nokta ekle-sil
- [x] **U4** Katman klasörleri: `scene.groups` + `layer.group`; zaman çizelgesinde katlanabilir klasörler;
      gizle / kilitle / solo (klasör ve katman); klasörü sahnede toplu taşıma
- [x] Parçacık efektleri kütüphane öğesi oldu (`efektler` kategorisi, `type: "particles"`): oluştur / düzenle / önizle;
      stüdyoda kütüphane seçicisinden eklenir; +2 yeni efekt (uçuşan kağıt uçaklar, yıldız yağmuru)
- [x] Parçacık motoru: rüzgâr baskın efektlerde yandan doğma (önceden ekran dışında kalıyordu)

### Faz 14 — Çizim / boya stili ✅
- [x] `style: "cizim"`: bölge sınırlarından çıkarılan titrek mürekkep konturu, kalemle çizilir gibi uzar (yay uzunluğu bütçesi)
- [x] Pastel boya dolgusu: kağıtla karışmış taban + tohumlu eğik tarama + çapraz tarama + kenar baskısı + kağıt dişi
- [x] Boyama çapraz silmeyle açılır (yarı düzlem çokgenlere hesapla uygulanır — GPU canvas'ta iç içe clip taşması giderildi)
- [x] Z-sırası duyarlı bölge gruplama (ör. duvar üstündeki kapı, bacayla aynı renk olsa da ayrı bölge)
- [x] `scene.sketch` / `layer.sketch` ayarları (sahne px cinsinden; ölçekten bağımsız kalem), `cizerek-gir` / `silinerek-cik` ön ayarları
- [x] Örnek: `kahve-cizim` projesi + `cezve` / `fincan` varlıkları (`scripts/scenes-kahve-cizim.mjs`)

### Faz 15 — Ok sistemi (nesneden nesneye geçiş) ✅
- [x] `type: "arrow"` katmanı: uçlar katman id'si ya da serbest nokta; yönlü kutudan otomatik / sabit (üst-alt-sol-sağ) bağlantı + boşluk
- [x] Eğriler: düz, kavis, S, dirsek (L/Z, yuvarlatılmış), dalga, halka; gövde: düz, kesikli, noktalı, çift, sivrilen şerit, el çizimi
- [x] Uçlar (üçgen, açık V, kalem, yuvarlak, elmas, çizgi) çizim ucunu izler; geçişli renk, neon parıltı, gölge
- [x] Akış animasyonları: akan kesikler, akan noktalar, kuyruklu yıldız, varışta nabız; etiket; yol boyunca taşınan "yolcu" nesne
- [x] Kütüphane "oklar" kategorisi (12 stil, `scripts/seed-arrows.mjs`), kütüphanede ok düzenleyici + canlı önizleme
- [x] Stüdyo: ＋ Ok (seçili nesneden en yakın nesneye), ok denetçisi (uçlar, çapa, etiket, yolcu, stil geçersiz kılma), yola yakın isabet testi
- [x] Örnek: `ok-vitrini` projesi; `kahve-cizim`e cezve → fincan el çizimi ok

### Faz 8 — Sonraki adımlar
- [x] Ses / müzik katmanı (WebCodecs AudioEncoder ile MP4'e mux) → Faz 10
- [x] Görsel facet (poligon) çizim editörü → Faz 11 (K6)
- [x] Hazır animasyon ön ayarları → Faz 9 (Ö3)
- [x] Sahne şablonları → Faz 16
- [x] Parçacık sistemi → Faz 10 (A1)
- [x] Geçişler → Faz 11 (A2)
- [x] Sunucu tarafı render (başsız tarayıcı) → Faz 16
- [ ] Gerçek 3B facet derinliği ve dinamik ışık yönü
- [x] Hareket yolu (Ö4), easing eğri editörü (U3), katman klasörleri / kilit (U4) → Faz 13
- [ ] Telefon önizleme modu (U5)
- [x] Uygulama içinden Claude API ile "notları uygula" (AI4) → Faz 16

### Faz 16 — Bileşenler, derinlik, ses-reaktif animasyon, şablonlar, sunucu render ✅
- [x] **Bileşen katmanları**: `chart` (sütun / yatay / çizgi / pasta / halka / sayaç), `device` (telefon / tablet / dizüstü / tarayıcı + sahte arayüz),
      `media` (resim / video; `data/media`, yükleme), `waveform` (çubuk / çizgi / daire / nokta) — şema §12
- [x] **Video karesi hattı**: `prepareMedia` (deterministik seek) — `renderFrame` saf kalır; önizleme ve dışa aktarım aynı kareyi alır
- [x] **Ses zarfı** (`env`, 8 bant, FFT) + `audiodrive.js`; ön ayarlar: `ritimle-*`, `sesle-*`; stüdyoda "Zarf çıkar", `scripts/analyze-audio.mjs`
- [x] **Sahte 3B**: `layer.depth` paralaks (kamera pan/zoom), `layer.blur`, `camera.focus` / `camera.dof` alan derinliği
- [x] **Şablonlar** (Faz 8 maddesi): `scripts/sablonlar/`, `node scripts/uret.mjs`, Projeler → ✦ Şablondan, `brief.json`
      (ilk takım — explainer / veri / kinetik / urun / showreel / liste — kaldırıldı; yerine ↓ reels takımı)
- [x] **Reels şablon takımı** (yeniden tasarım): `vurus, hook, siralama, karsilastir, urun, rakamlar, adimlar, sohbet` — vuruşa oturan kamera darbesi, kelime çarpması,
      silme geçişleri, sayaç; `reels.mjs` yapı taşları, `gen-ritim.mjs` ritim parçaları (5), `seed-sekiller.mjs` şekil takımı (11), metin `count` / `counter` sayacı,
      yeni Şablonlar sayfası (galeri + hover-oynat, palet / müzik / format kartları), yeni Animasyonlar sayfası (arama, favori, parametre ayarı, hızlı kuyruk)
- [x] **Sunucu tarafı render** (D3): `scripts/render.mjs` — başsız Edge/Chrome, toplu format (`--hepsi`), `/render/:id` sayfası
- [x] **AI4**: Notlar → "Claude ile uygula" (`POST /api/projects/:id/notes-apply`, `scripts/ai-notlar.mjs`; `ANTHROPIC_API_KEY` gerekir)
- [ ] Sınır: video sesi karışıma girmez; bileşenler için stüdyoda sürükle-boyutlandır tutamağı yok (denetçiden ayarlanır)
- [ ] Kapsam dışı bırakıldı (istek üzerine): podcast / seslendirme + otomatik altyazı hattı

### Faz 17 — Karakter sistemi ✅
- [x] **Karakter setleri** (`data/characters`, `type: "karakter"`): ortak iskelet (rig) + el çizimi titremeli çizim; 5 hazır set (copadam, bonbon, robo, miyav, astro) + varyant / aksesuar (saç, şapka, gözlük, kulak, kuyruk, kravat…)
- [x] **Ortak aksiyon kataloğu** (40): duruş, yürü / koş / zıpla, konuş, tanıt, işaret et, el salla, düşün, fikir, sevin, ağla… — iz tabanlı, IK ile elin yüze / belde olması her oranda doğru
- [x] **Duygular** (23 yüz ifadesi, yumuşak geçiş), tutulan nesneler (15), başın üstü efektleri (8), **konuşma balonu** (konuş / düşün / bağır / fısılda; harf harf yazılır, ağız oynar, otomatik jest)
- [x] **Zaman akışı**: `akis` (aksiyon + duygu + hareket dx/dy + hedef / bakış + nesne), `soz`; ürün tanıtma (`hedef` katman), iki karakter diyaloğu (`diyalog()`)
- [x] **Karakterler sayfası** (önizleme, aksiyon / duygu galerisi, görünüm editörü, varyant), Stüdyo **＋ Karakter** + denetçi (akış / söz editörü), İçerik panelinde sözler
- [x] Yapay zekâ altyapısı: `scripts/lib/karakter.mjs` (`karakter`, `diyalog`, doğrulama), `npm run karakter` (ara / katalog), `npm run dogrula`, `npm run seed:karakter`, şema §15, örnek: `scripts/scenes-karakter-demo.mjs`
- [ ] Sınır: tek iskelet (insan; dört ayaklılar yok), yan görünüm yok (yürüyüş ön görünüm "yürür" stilidir), sandalye / oturma yok
