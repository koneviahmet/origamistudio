# AI (Claude) ile Çalışma Akışı

Bu projede üretimi Claude kod/JSON yazarak yapar; siz stüdyoda izleyip not bırakırsınız.

## Döngü

```
 1. İstek      "Okyanusta yüzen bir balina ve kağıt gemiler, 10 sn, Reels"
 2. Claude     → gerekirse kütüphaneye yeni origami modelleri ekler (data/library/…)
               → data/projects/<id>/scene.json oluşturur
 3. Siz        → stüdyoda oynatır, istediğiniz kareye/katmana/noktaya not bırakırsınız
 4. Siz        → Claude'a: "notları uygula"
 5. Claude     → npm run notes            (açık notları listeler)
               → scene.json'u düzenler     (stüdyo anında yenilenir)
               → notes.json'da notu status:"done" + reply ile kapatır
 6. Tekrar 3'e — memnun kalınca "⬇ Dışa aktar" ile MP4
```

## Claude için kurallar

- **Notları okumak:** `npm run notes` (tek proje: `npm run notes -- <id>`, hepsi: `-- --all`).
- **Not bağlamı:** `t` o anki saniye, `layerId` seçili katman, `pos` karede tıklanan nokta
  (kamera uygulanmış kare koordinatı). Notu yorumlarken bu üçünü birlikte kullan.
- **Sahneyi düzenlemek:** `scene.json`'u doğrudan düzenle. Şema: [schema.md](schema.md).
  Stüdyo dosya değişikliğini SSE ile algılar; kullanıcının kaydedilmemiş değişikliği yoksa
  otomatik yeniler, varsa "Diskten yükle" uyarısı gösterir. Kullanıcı Ctrl+Z ile geri alabilir.
- **Notu kapatmak:** `notes.json` içinde ilgili notu `"status": "done"` yap, `"reply"` alanına
  ne değiştiğini kısa ve somut yaz (ör. "ölçek 0.55 → 0.8, kanat periyodu 0.35 → 0.55 sn").
  Anlaşılmayan notu açık bırak ve `reply` alanına soruyu yaz.
- **Yeni model gerekiyorsa:** `data/library/<kategori>/<id>.json` oluştur (ya da
  `scripts/seed-library.js`'e ekle). Her düzlemi iki üçgene böl, zıt `s` değerleri ver.
  Hareketli parçaları (`parts`) ayrı facet grubu yap ve `pivot` tanımla.
- **Notun karesi:** Stüdyo her not için o anın karesini `data/projects/<id>/snapshots/<notId>.png`
  olarak kaydeder (`npm run notes` yolunu yazar). Notu işlemeden önce bu görüntüye bak.
- **Render'ı doğrulamak:** Tarayıcı panelinde `renderFrame` ile kareler üretip
  `POST /api/projects/<id>/snapshots/<ad>` (image/png) ile diske yaz, sonra görüntüyü oku.
  Test görüntülerini işin sonunda sil.

## Güvenlik ağı: sürüm geçmişi

Claude'un `scene.json` üzerindeki her değişikliği otomatik olarak "Claude / disk" sürümü olarak kaydedilir.
Kullanıcı stüdyoda Geçmiş sekmesinden farkı görüp tek tıkla önceki sürüme dönebilir. Büyük değişikliklerden önce ekstra yedek almaya gerek yok.

## Tasarım sistemiyle üretim (önerilen yol)

- Önce keyframe yerine **ön ayar** kullan: `"anims": [{ "preset": "zipla-gir", "t": 2 }]`. Tam liste: [schema.md §5](schema.md#animasyon-ön-ayarları-anims).
  Keyframe'i yalnızca özel yörünge, kamera ya da kesin zamanlama gerektiğinde kullan.
- Renk için önce **tema** (`"theme": "sonbahar"`) ve **varyant** (`"variant": "kutup"`) kullan; katmana özel `palette` son çare.
- Metinde **metin stili** (`"textStyle": "baslik-kalin"`) kullan. Font seçerken Türkçe testini geçmiş fontları seç
  (`data/fonts/fonts.json` → `check.ok`). Fredoka, Titan One ve Satisfy Türkçe başlıkta kullanılmamalı.
- Stil: `"style": "origami" | "kagit-kesme" | "duz"` (sahne geneli ya da katman başına).
- Yeni model eklerken palete `roles` ver ve 2-3 `variants` ekle. Böylece temalar ve kullanıcı modeli yeniden boyayabilir.

## İyi animasyon tarifleri (keyframe ile)

| Efekt | Nasıl |
|---|---|
| Kağıttan açılarak belirme | `fold: [{t:a,v:0},{t:a+1.2,v:1,ease:"linear"}]`, `foldStyle.order` = `bottom`/`radial` |
| Katlanarak kaybolma | `fold` izine `{t:b,v:1},{t:b+1,v:0}` ekle |
| Zıplayarak gelme | `scale: [{t:a,v:0.6},{t:a+0.8,v:1,ease:"outBack"}]` |
| Kanat çırpma | parça `scaleY: 0.15` + `loops:[{prop:"scaleY",type:"sine",amp:0.85,period:0.7}]` |
| Kuyruk sallama | parça `loops:[{prop:"rotation",type:"sine",amp:7,period:2.2}]` |
| Süzülme | katman `loops:[{prop:"y",type:"noise",amp:30,period:2}]` |
| Nefes alma | katman `loops:[{prop:"scaleY",type:"sine",amp:0.012,period:3}]` |
| Uçarak geçiş | `x`/`y` izleri + `ease:"inOutSine"`, sağa uçuş için `scaleX:-1` |
| Kamera açılışı | `camera.zoom: [{t:0,v:1.2},{t:4,v:1,ease:"inOutCubic"}]` |
| Daktilo metin | `reveal: [{t:a,v:0},{t:a+1.5,v:1,ease:"linear"}]` |

## Güvenli alanlar (9:16)

Reels/Shorts/TikTok arayüzü üst ~%12'yi, alt ~%22'yi ve sağ kenardaki butonları kaplar.
Başlıkları y ≈ 250–450 arasına, ana karakteri ekranın orta bandına yerleştirin.
Stüdyoda **Güvenli alan** (S) kaplaması bu bölgeleri gösterir.
