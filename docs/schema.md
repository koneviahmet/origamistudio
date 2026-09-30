# JSON Şemaları

Tüm veriler düz JSON dosyalarıdır. Koordinatlar piksel, zamanlar saniyedir.

## 1. Animasyonlanabilir değer

Hemen her sayısal alan (ve renkler) iki şekilde yazılabilir:

```jsonc
"x": 540                                              // sabit
"x": [ { "t": 0, "v": 100 },                          // keyframe izi
       { "t": 2, "v": 540, "ease": "outBack" } ]      // ease: önceki keyframe'den buraya geçiş eğrisi
```

**Easing adları:** `linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`,
`inOutCubic` (varsayılan), `inOutSine`, `inBack`, `outBack`, `outElastic`, `outBounce`, `step`.

**Döngüler (loops)** — keyframe değerinin üstüne eklenir:

```jsonc
"loops": [
  { "prop": "rotation", "type": "sine", "amp": 6, "period": 2.2, "phase": 0, "start": 1, "end": 10 }
]
// type: sine | triangle | saw | noise
```

## 2. Varlık (asset) — `data/library/<kategori>/<id>.json`

```jsonc
{
  "name": "Tilki",
  "tags": ["hayvan", "orman"],
  "size": [200, 200],                 // çizim kutusu (varlık koordinatları 0..size)
  "center": [100, 100],               // (ops.) katlanma merkezi; varsayılan kutu merkezi
  "palette": { "a": "#ea7a3b", "c": "#fbefe0" },
  "back": "#f4eee3",                  // (ops.) kağıdın arka yüzü rengi
  "parts": {                          // (ops.) ayrı hareket eden parçalar
    "tail": { "pivot": [142, 186] }
  },
  "roles": { "a": "ana", "c": "acik" },          // (ops.) palet anahtarlarının anlamı (bkz. §5)
  "variants": {                                  // (ops.) hazır renk setleri; yalnızca değişen renkler
    "kutup": { "name": "Kutup", "palette": { "a": "#e9eef2" } }
  },
  "facets": [                         // ÇİZİM SIRASI: ilk eleman en arkada
    { "p": [[140,190],[196,122],[160,150]], "c": "a", "s": -0.15, "part": "tail" },
    { "p": [[55,45],[100,45],[100,112]],    "c": "a", "s": 0.1, "hinge": 2 }
  ]
}
```

| Alan | Anlamı |
|---|---|
| `p` | Çokgen noktaları `[[x,y],…]` (en az 3) |
| `c` | Palet anahtarı (`"a"`) ya da doğrudan `"#hex"` |
| `s` | Işık: `-1` (koyu) … `+1` (açık). Origami görünümünü veren yüzey gölgesi |
| `part` | `parts` içindeki bir parçaya bağlar (kanat, kuyruk…) |
| `hinge` | (ops.) Katlanmada menteşe olacak kenar indeksi. Yoksa merkeze en yakın kenar |

**Tasarım ipuçları:** Her "düzlemi" iki üçgene bölün, birine `s > 0`, diğerine `s < 0` verin —
ortadaki katlanma çizgisi hissini bu verir. Arkadaki parçalar (kuyruk, arka kanat) listede önce gelir.

## 3. Sahne (scene) — `data/projects/<id>/scene.json`

```jsonc
{
  "name": "Origami Orman",
  "width": 1080, "height": 1920,      // 9:16 Reels. 16:9 → 1920×1080, 1:1 → 1080×1080, 4:5 → 1080×1350
  "fps": 30,
  "duration": 12,
  "background": {
    "type": "linear",                 // solid | linear | radial
    "colors": ["#ffe9cf", "#f4ad86"], // linear/radial
    "color": "#f6efe4",               // solid
    "angle": 180,                     // linear: CSS açısı (180 = yukarıdan aşağı)
    "cx": 0.5, "cy": 0.4, "radius": 0.7, // radial
    "paper": 0.55,                    // kağıt dokusu gücü 0..1
    "vignette": 0.22                  // kenar kararması 0..0.8
  },
  "camera": { "zoom": 1, "x": 540, "y": 960, "rotation": 0 },  // hepsi animasyonlanabilir
  "layers": [ /* alttan üste çizim sırası */ ]
}
```

### Origami katmanı

```jsonc
{
  "id": "tilki",                      // benzersiz; notlar bu id'ye bağlanır
  "asset": "tilki",                   // kütüphane varlık id'si
  "x": 530, "y": 1690,                // konum (anchor noktası)
  "anchor": [0.5, 1],                 // varlık kutusunda çapa (0.5,1 = alt orta → zemine basar)
  "scale": 2.3, "scaleX": 1, "scaleY": 1,   // scaleX: -1 → yatay ayna
  "rotation": 0,                      // derece
  "opacity": 1,
  "fold": [ {"t":2,"v":0}, {"t":3.8,"v":1,"ease":"linear"} ],  // 0 = katlı/görünmez, 1 = açık
  "foldStyle": { "order": "bottom", "spread": 0.7, "seed": 1 },
  "palette": { "a": "#8fb3c9" },      // bu katmana özel renk değişimi
  "shadow": true,                     // ya da { "opacity": 0.3, "width": 1, "height": 1, "x": 0, "y": 0 }
  "start": 3.4, "end": 12,            // (ops.) görünür zaman aralığı
  "hidden": false,
  "loops": [ { "prop": "y", "type": "sine", "amp": 22, "period": 1.4 } ],
  "parts": {
    "wingFront": { "scaleY": 0.15, "loops": [ { "prop": "scaleY", "type": "sine", "amp": 0.85, "period": 0.7 } ] }
  }
}
```

- `foldStyle.order`: `radial` (merkezden dışa), `inward`, `left`, `right`, `top`, `bottom`, `index`, `reverse`, `random`
- `foldStyle.spread` (0–0.95): yüzeylerin açılma zamanlarının ne kadar yayılacağı. 0 = hepsi aynı anda.
- `fold` değeri 1'den 0'a inerse model **geri katlanarak** kaybolur.
- Parça özellikleri: `rotation`, `scaleX`, `scaleY`, `x`, `y` (+ `loops`). Parça ters dönerse
  (`scaleX*scaleY < 0`) kağıdın arka yüzü görünür — kanat çırpma bu şekilde gerçekçi görünür.

### Metin katmanı

```jsonc
{
  "id": "baslik", "type": "text",
  "text": "Origami Orman\nikinci satır",
  "x": 540, "y": 300,
  "size": 118, "weight": 700, "font": "Fredoka, sans-serif",
  "color": "#5b3a29", "align": "center", "lineHeight": 1.15,
  "reveal": [ {"t":5,"v":0}, {"t":6.6,"v":1,"ease":"linear"} ],   // daktilo efekti 0..1
  "stroke": { "color": "#fff", "width": 6 },
  "shadow": { "color": "rgba(0,0,0,.3)", "blur": 0, "x": 0, "y": 6 },
  "opacity": 1, "scale": 1, "rotation": 0
}
```

## 4. Notlar — `data/projects/<id>/notes.json`

```jsonc
[
  {
    "id": "n_munuhv43m4b",
    "t": 7.57,                        // notun bırakıldığı an (sn)
    "layerId": "kelebek",             // (ops.) seçili katman
    "pos": [310, 1120],               // (ops.) kare üzerinde iğnelenen nokta (kare koordinatı)
    "text": "Kelebek biraz büyüsün",
    "status": "open",                 // open | done
    "reply": null,                    // Claude'un yaptığı değişikliğin özeti
    "createdAt": "…", "updatedAt": "…"
  }
]
```

## 5. Tasarım sistemi

### Renk rolleri
Varlıktaki `roles` palet anahtarlarına anlam verir:
`ana`, `ikincil`, `vurgu`, `acik`, `koyu`, `detay`.
Tema bir rol için renk tanımlarsa (`roles.vurgu`), o roldeki bütün renkler o renge döner (marka rengi).

### Renk çözümleme sırası (bir facet için)
`asset.palette` ← `asset.variants[layer.variant].palette` ← `layer.palette` → tema dönüşümü (rol rengi / sınırlı palet / ayar / kağıt tipi).
Renk değerleri `"$anahtar"` olabilir; temanın `colors` sözlüğünden okunur (`"$baslik"`, `"$vurgu"`…).

### Sahne ve katman alanları
```jsonc
{
  "theme": "sonbahar",          // data/themes/<id>.json (ya da satır içi tema nesnesi)
  "style": "kagit-kesme",       // origami (varsayılan) | kagit-kesme | duz | cizim
  "background": { … },          // yoksa temanın arka planı kullanılır
  "layers": [
    {
      "asset": "tilki",
      "variant": "kutup",       // varlığın varyantı
      "style": "duz",           // bu katmana özel çizim stili
      "anims": [ { "preset": "zipla-gir", "t": 2.2, "dur": 0.9, "yay": "outBack" } ]
    },
    {
      "type": "text", "text": "Sonbahar",
      "textStyle": "baslik-kalin",   // data/textstyles/<id>.json; katmandaki alanlar stili ezer
      "font": "Poppins",             // data/fonts'taki aile adı
      "uppercase": true,             // Türkçe kurallarıyla büyük harf (i → İ)
      "letterSpacing": 4,            // 100px boyuta göre px
      "box": { "color": "$vurgu", "radius": 999, "padding": [18, 36], "opacity": 1 }
    }
  ]
}
```
`fold` her stilde "görünme ilerlemesi"dir: origamide yüzeyler katlanarak açılır, kağıt kesmede tabakalar kayarak yerine oturur.

### Animasyon ön ayarları (`anims`)
Keyframe'lerin üstüne çalışma anında uygulanır, JSON'u değiştirmez. Ortak alanlar: `preset`, `t` (başlangıç), `dur` (süre), `off` (geçici kapat).
Toplanan etkiler: x, y, rotation. Çarpılan etkiler: scale, scaleX, scaleY, opacity, fold.

| Kategori | preset | Parametreler |
|---|---|---|
| giriş | `katlanarak-gir` | `sira` (açılma sırası) |
| giriş | `zipla-gir` | `yay`: outBack / outElastic / outBounce |
| giriş | `kayarak-gir` | `yon` (sol/sag/ust/alt), `mesafe`, `ease` |
| giriş | `ekrana-gir` | `yon`, `yay` (kavis px), `ease` — ekran dışından gelir |
| giriş | `dusup-gir` | `mesafe` (sekerek düşer) |
| giriş | `donerek-gir` | `aci`, `ease` |
| giriş | `belir` | — |
| çıkış | `katlanarak-cik` | `sira` |
| çıkış | `kuculerek-cik` | — |
| çıkış | `kayarak-cik` | `yon`, `mesafe`, `ease` |
| çıkış | `ekrandan-cik` | `yon`, `ease` |
| çıkış | `sol` | — |
| çıkış | `dal` | `mesafe`, `aci` |
| sürekli | `suzul` | `genlik`, `periyot` |
| sürekli | `sallan` | `aci`, `periyot` |
| sürekli | `nefes` | `genlik`, `periyot` |
| sürekli | `nabiz` | `genlik`, `periyot` |
| sürekli | `seksek` | `yukseklik`, `periyot` |
| sürekli | `dalgada` | `genlik`, `aci`, `periyot` |
| sürekli | `titre` | `genlik` |
| sürekli | `don` | `periyot`, `yon` (1/-1) |
| sürekli | `kanat-cirp` | `parcalar` (boş: wing/kanat), `eksen` (Y/X), `periyot`, `alt` |
| sürekli | `kuyruk-salla` | `parcalar` (boş: tail/kuyruk), `aci`, `periyot` |
| hareket | `gec` | `yon` (sag/sol), `yay`, `ease` — ekranı baştan sona geçer |

- Giriş ön ayarları `t`'den önce başlangıç durumunda bekler (genelde görünmez).
- Çıkış ön ayarları bitişten sonra bitiş durumunda kalır.
- Sürekli ön ayarlar `dur` yoksa sonsuza kadar sürer ve 0.4 sn'de yumuşakça başlar (`yumusat`).

### Tema — `data/themes/<id>.json`
```jsonc
{
  "name": "Sonbahar",
  "paper": "kraft",                 // mat | parlak | kraft | pastel | kadife
  "adjust": { "hue": 0, "saturation": 0.9, "brightness": 0, "warmth": 0.35, "contrast": 1 },
  "palette": ["#264653", "#e9c46a"], "paletteStrength": 0.45,   // sınırlı palet eşleme
  "roles": { "vurgu": "#c8553d" },  // rol → sabit renk
  "colors": { "arka1": "#f6e3c5", "arka2": "#e2a36f", "baslik": "#6b2d0f", "metin": "#8c4a2f", "vurgu": "#c8553d" },
  "background": { "type": "linear", "colors": ["$arka1", "$arka2"], "angle": 180 },
  "vignette": 0.28
}
```

### Metin stili — `data/textstyles/<id>.json`
```jsonc
{ "name": "Etiket · Kutu", "font": "Outfit", "weight": 700, "size": 46, "color": "#ffffff",
  "uppercase": true, "letterSpacing": 3, "lineHeight": 1.15, "align": "center",
  "stroke": { "color": "#111", "width": 10 }, "shadow": { "color": "rgba(0,0,0,.3)", "blur": 0, "x": 0, "y": 6 },
  "box": { "color": "$vurgu", "radius": 999 } }
```

### Fontlar — `data/fonts/fonts.json`
Google Fonts'tan yalnızca `latin` ve `latin-ext` woff2 dosyaları indirilir (`npm run fonts`, ya da Tasarım → Fontlar → ＋).
Her kayıtta `latinExt` (Türkçe alt kümesi var mı) ve `check` (ğüşıöçİĞÜŞÖÇ glif testi sonucu) alanları bulunur.
**Uyarı:** Fredoka'da ğ, ş, İ harfleri yok; Titan One'da İ yok; Satisfy'da Türkçe alt kümesi yok. Varsayılan font **Baloo 2**.

## 6. Parçacıklar, metin animasyonları, ses (Faz 10)

### Parçacık katmanı
```jsonc
{
  "id": "konfeti", "type": "particles",
  "preset": "konfeti",          // konfeti | kar | yagmur | yaprak | kabarcik | yildiz-tozu | varlik
  "mode": "surekli",            // surekli | patlama
  "count": 120, "size": 20, "speed": 1, "wind": 0, "seed": 1,
  "colors": ["$vurgu", "#ffd166"],   // boş: ön ayarın renkleri
  "asset": "kalp",              // (ops.) şekil olarak kütüphane varlığı
  "area": [0, -80, 1080, 0],    // (sürekli) doğma alanı x, y, g, y — boş: ön ayara göre
  "prewarm": true,              // (sürekli) başta ekran dolu mu
  "x": 540, "y": 700, "life": 3.2,   // (patlama) merkez ve ömür; patlama anı = "start"
  "start": 2, "end": 9, "opacity": 1, "scale": 1
}
```
Parçacık konumları zamanın saf fonksiyonudur; aynı `seed` her zaman aynı görüntüyü verir.

### Metin animasyonları (`textAnims`)
```jsonc
"textAnims": [ { "preset": "harf-katla", "t": 1, "dur": 0.55, "aralik": 0.05 } ]
```
`dur` tek birimin süresi, `aralik` ardışık birimler arası gecikmedir.

| Kategori | preset | Birim |
|---|---|---|
| giriş | `harf-katla` (kağıt gibi katlanarak), `harf-zipla`, `harf-dus`, `harf-don`, `harf-belir` | harf |
| giriş | `kelime-zipla` | kelime |
| giriş | `satir-kay` | satır |
| sürekli | `dalga` (`genlik`, `periyot`), `titresim` (`genlik`) | harf |
| çıkış | `harf-katla-cik`, `harf-dagil` | harf |

Katman ön ayarlarıyla (`anims`) birlikte kullanılabilir. Örneğin giriş için `textAnims`, çıkış için `anims: [{preset:"kayarak-cik"}]`.

### Ses izleri (`audio`)
```jsonc
"audio": [ { "file": "uzay-ambiyans.wav", "start": 0, "offset": 0, "dur": null,
             "volume": 0.7, "fadeIn": 1.5, "fadeOut": 2.5, "mute": false } ]
```
Dosyalar `data/audio/` altındadır (stüdyoda Proje ayarları → Müzik ve ses → ⬆ Ses yükle).
MP4'e AAC olarak eklenir. Tarayıcıda AAC kodlayıcı yoksa Opus kullanılır.
`npm run gen-audio`, telifsiz örnek müziği (`uzay-ambiyans.wav`) üretir.

## 7. Geçişler, bölümler, ses efektleri, ritim (Faz 11)

### Geçişler (`transitions`)
```jsonc
"transitions": [
  { "type": "katlama", "t": 4.2, "dur": 1.2, "color": "$arka2", "yon": "sol", "kat": 5 },
  { "type": "sayfa-cevir", "t": 12, "dur": 1.1, "color": "#dfe6ff" }
]
```
- **t = kesme anı.** Katmanların `start` / `end` değerleri bu anda değişmelidir (eski bölüm biter, yenisi başlar).
- Örtü tipleri, `[t - dur/2, t + dur/2]` aralığında çalışır ve t anında ekranı tam kapatır:
  `katlama` (kağıt yelpaze; `kat`, `yon`), `perde`, `iris` (`cx`, `cy`), `yirtik` (`yon`, `seed`).
- Kare tipleri, `[t, t + dur]` aralığında çalışır ve t'den bir kare önceki görüntüyü kullanır:
  `sayfa-cevir`, `kaydir` (`yon`: sol/sag/yukari/asagi), `yakinlas`.
- `color` kağıt rengidir (`$ref` olabilir). `off: true` geçişi geçici olarak kapatır. `sfx`: false | "dosya.wav".

### Bölümler (`sections`)
```jsonc
"sections": [ { "t": 0, "name": "Açılış" }, { "t": 4.2, "name": "Güneş" } ]
```
Yalnızca düzenleme içindir; videoda görünmez. Zaman çizelgesinde bant olarak gösterilir ve mıknatıs noktasıdır.

### Otomatik ses efektleri (`sfx`)
```jsonc
"sfx": { "auto": true, "volume": 0.6 }
```
Ön ayar, metin animasyonu, geçiş ve patlamalar kütüphanedeki `sfx-*.wav` efektleriyle eşlenir. Eşlemeler:
- kağıt katlama → katlanarak gir/çık, katlama geçişi, `fold` 0→1
- pop → zıplama, patlama
- vınlama → kayma, ekran dışından giriş/çıkış, geçme
- hışırtı → harf animasyonları, perde, sayfa çevirme
- tık, damla, pırıltı → düşme, dalma, belirme

Susturmak için katmanda `"sfx": false` kullanılır. Tek bir animasyonda `anims[i].sfx: false` ya da `"sfx-pop.wav"` ile değiştirilir.
Efektler `npm run gen-audio` ile sentezlenir (telifsiz). Çıkışta bir sınırlayıcı ve yumuşak kırpıcı vardır, ses 1.0'ı aşmaz.

### Ritim (`audio[i].bpm`, `beatOffset`)
```jsonc
"audio": [ { "file": "muzik.mp3", "bpm": 120, "beatOffset": 0.25 } ]
```
`beatOffset`, dosyadaki ilk vuruşun zamanıdır (sn). Vuruşlar zaman çizelgesinde çizgi olarak görünür; her 4 vuruşta bir kalın çizgi ölçü başını gösterir. Keyframe, blok ve geçiş sürüklerken vuruşlara mıknatıslanır.
Stüdyoda "Algıla" düğmesi otomatik tahmin yapar. Belirgin vuruşlu müzikte doğrudur (test: 90/100/140 BPM tıklama izleri tam, faz ±7 ms).
Davulsuz ambiyans müzikte pedlerdeki vuru (beating) yanıltabilir. Bu durumda ×2 / ÷2 ya da elle giriş kullanılır.

### Görsel çizim editörü (Kütüphane)
Noktayı sürükle (ızgara / nokta mıknatısı, Shift: kapalı) · "bağlı noktalar": ortak köşeler birlikte taşınır ·
kenar ortasına tıkla: nokta ekle · sağ tık: nokta sil · "Yüzey çiz": tıkla-tıkla, Enter ile bitir ·
"simetri": dikey eksene göre aynalı düzenleme / çizim · "Aynala": seçili yüzeyin aynalı kopyası ·
turuncu artı: parça pivotu (sürükle) · ok tuşları: yüzeyi kaydır.

## 8. Çoklu format, sürüm geçmişi, görselden origami (Faz 12)

### Formatlar (`formats`)
```jsonc
"formats": [
  { "id": "youtube", "name": "YouTube 16:9", "width": 1920, "height": 1080,
    "mode": "sigdir", "focusX": 0.5, "focusY": 0.43, "zoom": 1.35,
    "overrides": { "baslik": { "dx": 0, "dy": -40, "scale": 1.2, "hidden": false } } }
]
```
- Ana sahne (`width` × `height`) formatın boyutuna yerleştirilir:
  - `sigdir`: içeriğin tamamı görünür; kenarlar arka plan, doku ve parçacıklarla dolar.
  - `kirp`: ekranı doldurur, sahnenin `focusX`/`focusY` (0..1) noktası merkeze gelir, taşan kısım kırpılır (sahne dışı görünmez).
- `zoom`: ek yakınlaştırma.
- `overrides`: yalnızca bu formatta uygulanan katman düzeltmeleri (`dx`, `dy` sahne pikseli; `scale` çarpan; `hidden`).
  Stüdyoda üst çubuktan formata geçip katmanı sürükleyince / ölçekleyince otomatik yazılır.
- Dışa aktarım: tek format ya da "Tüm formatlar sırayla". Ses bir kez karıştırılır, hepsinde aynıdır.

### Sürüm geçmişi
`data/projects/<id>/history/<ts>.json` → `{ ts, source, summary, scene }` (son 80 sürüm).
- `source`: `studio` (API kaydı), `disk` (Claude / elle dosya düzenleme), `restore`, `create`, `baseline`.
- `summary`: `{ added, removed, changed: [{ id, keys }], scene: [değişen sahne alanları] }`.
- API: `GET /api/projects/:id/history`, `GET …/history/:ts`, `POST …/history/:ts/restore`.
- Stüdyo → Geçmiş sekmesi: fark özeti, o sürümün şu anki zamandaki küçük resmi, geri yükleme.

### Görselden origami (Kütüphane → ⬆ Görselden origami)
PNG / JPG / SVG → ön plan maskesi (saydamlık ya da kenar rengi) → k-means renk kümeleme →
kenar + renk sınırı + iç ızgara noktaları → Delaunay üçgenleme → palet anahtarı + ışık (`s`) + otomatik roller.
Ayarlar: renk sayısı (2–10), üçgen boyu (7–32 px), arka plan eşiği, desen tohumu. Tek nesneli ve düz ya da saydam arka planlı görsellerde en iyi sonucu verir.

## 9. Özel easing, hareket yolu, klasörler, kütüphane efektleri (Faz 13)

### Özel easing
Keyframe `ease` alanı adlandırılmış bir eğri (`"outBack"`) ya da CSS ile aynı kübik Bézier olabilir:
```jsonc
{ "t": 3, "v": 1, "ease": [0.34, 1.56, 0.64, 1] }   // [x1, y1, x2, y2]; y 0..1 dışına çıkabilir (taşma)
```
Stüdyoda keyframe satırındaki eğri düğmesi editörü açar: tutamak sürükle, sayısal giriş, hazır eğriler, canlı önizleme.

### Hareket yolu
```jsonc
{
  "id": "turna", "asset": "turna",
  "path": { "points": [[240,1080],[560,840],[880,1080]], "smooth": true, "closed": false,
            "orient": true, "orientOffset": 180 },
  "pathT": [ { "t": 4, "v": 0 }, { "t": 9, "v": 1, "ease": "inOutSine" } ]
}
```
- Konum yoldan gelir (katmanın `x`/`y` değeri kullanılmaz; `x`/`y` döngüleri ve format düzeltmeleri üstüne eklenir).
- `pathT` yay uzunluğuna göredir: aynı artış = aynı mesafe. Hız ve ritim `pathT` keyframe'leri ve easing ile verilir.
- `smooth`: noktalardan geçen Catmull-Rom eğrisi; `closed`: döngü; `orient`: katman yol yönüne döner
  (`orientOffset`: sola bakan modeller için 180).
- Stüdyoda noktayı sürükle, Ctrl + yola tıklayarak nokta ekle, Alt + noktaya tıklayarak sil; katmanı sürüklersen tüm yol taşınır.

### Klasörler
```jsonc
"groups": [ { "id": "klasor-1", "name": "Ağaçlar", "collapsed": false, "hidden": false, "locked": false } ],
"layers": [ { "id": "agac-1", "group": "klasor-1", "locked": false }, … ]
```
- Klasörler zaman çizelgesinde gruplama içindir; çizim sırası `layers` dizisindeki sıradır.
- `hidden`: klasördeki tüm katmanlar çizilmez (dışa aktarımda da). `locked`: sahnede seçilemez / sürüklenemez.
- Solo (S düğmesi) yalnızca stüdyo önizlemesidir; kaydedilmez ve dışa aktarımı etkilemez.
- Klasör seçiliyken sahnede bir üyesini sürüklemek tüm üyeleri taşır; x/y keyframe'leri ve yol noktaları birlikte kayar.

### Parçacık efektleri kütüphanede
Efektin tanımı kütüphane öğesidir: `data/library/efektler/<id>.json`
```jsonc
{ "name": "Uçuşan kağıt uçaklar", "type": "particles", "motion": "dus", "shape": "varlik", "asset": "kagit-ucak",
  "count": 12, "size": 90, "speed": 45, "wind": 240, "sway": 70, "spin": 0, "colors": [], "prewarm": true }
```
- `motion`: `dus` | `yuksel` | `yerinde`
- `shape`: `kagit` | `kar` | `damla` | `yaprak` | `kabarcik` | `pirilti` | `varlik` (`asset` ile kütüphane modeli)
- Rüzgâr düşme hızından baskınsa parçacıklar rüzgârın geldiği kenardan doğar.

Sahnede kullanım: `{ "type": "particles", "particle": "kagit-ucaklar", "mode": "surekli" }`. Katmandaki alanlar
(`count`, `size`, `speed` çarpanı, `wind`, `colors`, `asset`, `area`, `seed`) tanımı geçersiz kılar.
Eski `"preset": "<ad>"` yazımı da çalışır.

## 10. Çizim / boya stili (Faz 14)

`"style": "cizim"` — el çizimi mürekkep kontur + pastel boya taraması (çocuk kitabı / defter görünümü).
Görünme ilerlemesi (`fold`, ya da `cizerek-gir` ön ayarı) iki aşamadır:
1. **Kontur** (0 → `split`): varlığın dış hatları kalemle çiziliyormuş gibi uzar. Bölgeler facet sırasıyla çizilir.
2. **Boya** (≈ `split`·0.65 → 1): her renk bölgesi çapraz bir silmeyle, tarama vuruşlarıyla boyanır; `foldStyle.spread` bölgelerin zaman yayılımı.

Aynı renk + parçadaki facet'ler bir "bölge"dir; konturlar bölgelerin birleşik sınırından çıkarılır
(bölge içindeki ortak kenarlar ve üstteki bölgelerin örttüğü kenarlar çizilmez). Tüm rastgelelik tohumludur.

```jsonc
{
  "style": "cizim",
  "sketch": {                   // sahne geneli; katmanda "sketch" aynı alanlarla üstüne yazar
    "ink": "#2d3561",           // kontur rengi
    "width": 3.2,               // kontur kalınlığı (sahne px — varlık ölçeğinden bağımsız)
    "wobble": 1.3,              // kalem titremesi (sahne px)
    "hatch": 5,                 // tarama aralığı (sahne px)
    "angle": 62,                // tarama açısı (°)
    "cross": true,              // ikinci, seyrek çapraz tarama
    "wipe": 35,                 // boyama silmesinin yönü (°; 35 = sol üstten sağ alta)
    "grain": 0.35,              // kağıt dişi (açık benekler)
    "outline": true,            // false: yalnız boya
    "split": 0.55               // fold içinde kontur aşamasının payı
  },
  "layers": [
    { "asset": "ev", "anims": [{ "preset": "cizerek-gir", "t": 2, "dur": 2.8 }, { "preset": "silinerek-cik", "t": 9, "dur": 1.2 }] },
    { "asset": "tepeler", "sketch": { "ink": "#4d7d45", "width": 2.4 } }
  ]
}
```
- `cizerek-gir` / `silinerek-cik` yalnızca `fold`'u sürer; diğer stillerde katlanarak gir/çık gibi davranır.
- El yazısı metin için `font: "Caveat"` + `reveal` izi (daktilo) iyi eşleşir. Örnek: `scripts/scenes-kahve-cizim.mjs`.

## 11. Oklar — nesneden nesneye geçiş (Faz 15)

İki katmanı (ya da serbest noktayı) bağlayan ok katmanı. Bağlı nesneler hareket ederse ok da onları izler.
Stil kütüphanededir (`data/library/oklar/<id>.json`, `"type": "arrow"`); katman aynı adlı alanlarla stili geçersiz kılar.

```jsonc
{
  "type": "arrow",
  "arrow": "ok-kesikli-rota",          // kütüphane stili (npm: node scripts/seed-arrows.mjs)
  "from": "istanbul",                  // katman id'si ya da serbest nokta [x, y]
  "to": "viyana",
  "fromAnchor": "auto",                // auto (varsayılan) | merkez | ust | alt | sol | sag
  "toAnchor": "ust",
  "fold": [{ "t": 1, "v": 0 }, { "t": 3, "v": 1, "ease": "inOutSine" }],  // çizim ilerlemesi
  "anims": [{ "preset": "cizerek-gir", "t": 1, "dur": 2 }],               // ya da ön ayarla (silinerek-cik de olur)
  "label": "1683", "labelPos": 0.5, "labelOffset": 50,
  "rider": { "asset": "kagit-gemi", "scale": 0.5, "orient": "cevir", "lift": 18 },  // ok boyunca taşınan nesne
  "ride": [{ "t": 3, "v": 0 }, { "t": 5, "v": 1 }],   // yoksa yolcu çizim ucunu izler
  "x": 0, "y": 0,                      // tüm oku kaydırır
  "opacity": 1,
  "bend": -0.3, "color": "#e63946"     // ↓ stil alanlarından herhangi biri
}
```

Stil alanları (kütüphane öğesi ya da katman):

| alan | değerler | açıklama |
|---|---|---|
| `curve` | `duz` · `kavis` · `s` · `dirsek` · `dalga` · `dongu` | yol biçimi; `dirsek` sabit çapalarda L, aksi hâlde Z çizer |
| `line` | `duz` · `kesik` · `nokta` · `cift` · `serit` · `el` | gövde; `serit` kuyruktan başa kalınlaşan dolu şerit |
| `head` / `tail` | `ucgen` · `acik` · `kalem` · `yuvarlak` · `elmas` · `cizgi` · `yok` | baş çizim ucunu izler |
| `width`, `headSize` | px | kalınlık, uç boyu |
| `color`, `color2` | renk (`$ref` olur) | `color2` → baştan sona geçişli renk |
| `bend` | −1..1 | kavis (0 düz, negatif ters yön) |
| `gap` | px | nesne kenarına bırakılan boşluk |
| `glow` / `shadow` | px / bool | neon parıltı / yumuşak gölge |
| `flow` | `yok` · `kesik` · `nokta` · `kuyruklu` · `nabiz` | sürekli akış animasyonu (`flowSpeed` px/sn, `flowColor`, `flowGap`) |
| `wobble` | px | el titremesi |
| `waves`, `amp` | | `dalga` eğrisi için |
| `radius` | px | `dirsek` köşe yarıçapı |
| `labelFont`, `labelSize`, `labelColor`, `labelBox` | | etiket görünümü (varsayılan Caveat 54) |

- Stüdyo: **＋ Ok** seçili katmandan en yakın nesneye (arka plan gibi onu içine alanlar hariç) bağlı bir ok ekler.
  Oka yalnızca çizgisine yakın tıklayınca seçilir; altındaki nesneler seçilebilir kalır.
- Örnekler: `scripts/scenes-ok-vitrini.mjs` (rota + yolcu, neon, akış şeması), `scenes-kahve-cizim.mjs` (el çizimi yay).

