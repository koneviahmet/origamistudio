# Origami Studio

Kod (JSON) ile üretilen origami animasyonları → Instagram Reels, YouTube Shorts, TikTok, YouTube için MP4.

## Başlatma

```bash
npm install
npm run seed         # başlangıç kütüphanesi + örnek proje (yalnızca eksikleri yazar)
npm run seed:design  # renk rolleri, varyantlar, temalar, metin stilleri
npm run fonts        # Türkçe destekli font kütüphanesi (Google Fonts → data/fonts, bir kez)
npm run gen-audio    # telifsiz örnek müzik + ses efektleri (data/audio/)
npm run dev       # http://localhost:5180
```

> MP4 dışa aktarım WebCodecs kullanır: **Chrome veya Edge** ile açın. ffmpeg gerekmez.

## Windows masaüstü başlatıcısı

```bash
powershell -ExecutionPolicy Bypass -File launcher\kisayol-olustur.ps1
```

Masaüstüne **Origami Studio** kısayolu oluşturur. Kısayola tıklayınca:

1. Sunucu çalışmıyorsa arka planda, penceresiz olarak üretim modunda başlar. İlk seferde bağımlılıklar kurulur. Arayüz kaynağı değiştiyse otomatik yeniden derlenir.
2. Sunucu hazır olunca **Chrome**'da `http://localhost:5180` açılır. Chrome yoksa varsayılan tarayıcı kullanılır.
3. Sunucu zaten çalışıyorsa yalnızca tarayıcı açılır.

Diğer dosyalar:
- Durdurmak için: `launcher\Origami Studio - Durdur.lnk` (ya da `launcher\durdur.ps1`).
- Günlükler: `launcher\logs\` (sunucu, hata, derleme).
- İkonu yeniden üretmek için: `node launcher\make-icon.js`.

## Ekranlar

- **Projeler** — oluştur (format ön ayarları: 9:16, 16:9, 1:1, 4:5), çoğalt, sil
- **Kütüphane** — origami modelleri ve parçacık efektleri (Efektler); kategori ekle/yeniden adlandır/sil, model oluştur/düzenle/çoğalt/sil,
  yüzey (facet) seçip renk-ışık düzenleme, katlanma önizlemesi, JSON düzenleyici
- **Stüdyo** — oynatıcı, zaman çizelgesi, denetçi, notlar, sahne JSON'u, MP4/PNG dışa aktarım
- **Tasarım** — Temalar (kağıt tipi, renk ayarı, sınırlı palet, rol renkleri), Metin stilleri, Fontlar (Türkçe testi), Animasyon ön ayarları galerisi

## Stüdyo kısayolları

| Tuş | İşlev |
|---|---|
| <kbd>Space</kbd> | Oynat / durdur |
| <kbd>←</kbd> <kbd>→</kbd> | Bir kare geri / ileri (Shift: 1 sn) |
| <kbd>Home</kbd> <kbd>End</kbd> | Başa / sona |
| <kbd>L</kbd> | Döngü |
| <kbd>S</kbd> / <kbd>G</kbd> | Güvenli alan / üçte bir ızgarası |
| <kbd>N</kbd> | Not yaz |
| <kbd>P</kbd> | Notu sahnede bir noktaya iğnele |
| <kbd>F</kbd> | Tam ekran |
| <kbd>Ctrl+S</kbd> | Kaydet |
| <kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd> | Geri al / yinele |
| <kbd>Delete</kbd> | Seçili keyframe'leri sil (yoksa seçili katmanı) |
| <kbd>Ctrl+C</kbd> / <kbd>Ctrl+V</kbd> | Seçili keyframe'leri kopyala / seçili katmana şu anki zamana yapıştır |
| <kbd>M</kbd> | Sesi aç / kapat |
| <kbd>0</kbd> | Sahneyi sığdır |
| Ctrl + tekerlek (sahne) | Sahneyi imleç etrafında yakınlaştır |
| Alt / orta tuş + sürükle | Sahneyi kaydır |
| Köşe / üst tutamak | Ölçekle / döndür (Shift: 15° adım) |
| Keyframe sürükle | Zamanda taşı (Shift+tık: çoklu seçim, Alt: mıknatıssız) |
| Animasyon bloğu / ses izi sürükle | Başlangıç zamanını kaydır |
| Ctrl + tekerlek | Zaman çizelgesini yakınlaştır |
| Keyframe'e sağ tık | O andaki keyframe'leri sil |
| Yol noktası sürükle / Ctrl+yola tık / Alt+noktaya tık | Hareket yolu: taşı / nokta ekle / sil |
| Zaman çizelgesi 📁 | Yeni klasör (seçili katmanı içine alır); S = solo, 🔒 = kilit |

## Claude ile revizyon

Stüdyoda not bırakın, sonra Claude'a **"notları uygula"** deyin. Ayrıntılar: [docs/ai-workflow.md](docs/ai-workflow.md).

## Dokümanlar

- [docs/plan.md](docs/plan.md) — fazlar ve yol haritası
- [docs/schema.md](docs/schema.md) — varlık / sahne / not JSON şemaları
- [docs/ai-workflow.md](docs/ai-workflow.md) — AI çalışma akışı ve animasyon tarifleri
- [docs/prompt-rehberi.md](docs/prompt-rehberi.md) — **yapay zekâ ile video üretimi**: ana bağlam, hazır prompt şablonları, tasarım reçeteleri, kontrol listesi
- [docs/katalog.md](docs/katalog.md) — modeller, efektler, temalar, fontlar, animasyonlar envanteri (`npm run katalog` ile otomatik üretilir)
- `scripts/sablon-sahne.mjs` — yeni video üreteci şablonu

## Yapı

```
server/            Express API + JSON depo + dosya izleme (SSE)
web/src/engine/    Render motoru (origami katlanma, keyframe, kamera, doku) — saf fonksiyonlar
web/src/export/    WebCodecs + mp4-muxer ile MP4
web/src/views/     Projeler, Kütüphane, Stüdyo
scripts/           seed-library.js, notes.js
data/library/      <kategori>/<id>.json  origami modelleri
data/projects/     <id>/scene.json + notes.json
```
