# Origami Yayın — Chrome eklentisi

Origami Studio projelerini yan panelde ara / önizle, MP4'ü **YouTube Studio**'ya ya da **Meta Business Suite**'e (Facebook Reels) tek tıkla yükle;
başlık, açıklama, etiketler otomatik dolar. **Yayınla / Paylaş düğmesine sen basarsın.**

## Kurulum (bir kez)
1. `npm run dev` (Origami Studio sunucusu açık olsun: http://localhost:5180).
2. Chrome → `chrome://extensions` → sağ üstte **Geliştirici modu** → **Paketlenmemiş öğe yükle** → bu klasörü (`chrome-eklenti/`) seç.
3. Araç çubuğundaki 🦢 simgesine tıkla → yan panel açılır. YouTube Studio ve business.facebook.com'da oturumun açık olmalı.

## Kullanım
- Panelde videoyu ara (başlık, açıklama, etiket, proje adı), kartına tıkla → önizle.
- MP4 yoksa **MP4 üret** (sunucu `scripts/render.mjs`'i arka planda çalıştırır; ilerleme panelde görünür). Zaten render alınmışsa listeden seç.
- Başlık / açıklama / etiketleri istersen panelde düzenle (varsayılanlar `scene.publish`'ten gelir; ses veri seti atfı ve #etiketler eklenir).
- **YouTube'a gönder**: Studio açılır → Oluştur → Video yükle → MP4 seçilir → başlık, açıklama, "çocuklara özel değil", etiketler → Görünürlük adımına kadar ilerler.
  Sağ alttaki yeşil panel durumu gösterir; yeşil çerçeveli **Yayınla**'ya sen bas.
- **Facebook'a gönder**: Business Suite → Reels oluşturucu açılır → MP4 seçilir → açıklama (başlık + metin + atıf + #etiketler) doldurulur → Paylaş adımına kadar ilerler.

## Aç / kapat
- Yan panelin üstündeki **anahtar** eklentiyi açar / kapatır (ayar saklanır; varsayılan açık).
- Kapalıyken: gönder düğmeleri kilitli, YouTube / Facebook sayfalarında otomatik doldurma çalışmaz, Business Suite sayfa kimliği kaydedilmez, simgede **KAPALI** rozeti görünür. Arama ve önizleme çalışır.
- Kapatırken çalışan gönderim varsa iptal edilir.
- Eklentiyi tamamen devre dışı bırakmak istersen `chrome://extensions`'tan da kapatabilirsin.

## İptal
- Gönderdikten sonra iki yerden iptal edebilirsin: yan panelde **✕ … gönderimini iptal et** ya da açılan sayfanın sağ altındaki yeşil panelde **İptal**.
- İptal: MP4 indirmesini keser, otomatik doldurmayı durdurur ve işi iptal sayar (sayfa yenilense de yeniden başlamaz).
- Site tarafında açılmış bir yükleme penceresini (YouTube Studio / Reels oluşturucu) eklenti **kapatmaz**; onu kendin kapat (YouTube: ✕ → Sil, Facebook: Cancel).

## Notlar
- Dosya, eklentinin arka planı tarafından yerel sunucudan çekilip sayfaya parça parça aktarılır (CORS / yerel ağ izni gerekmez).
- Otomatik doldurma durursa (Studio / Meta arayüzü değişirse) panel nedenini yazar ve **Kopyala** düğmeleri sunar.
- YouTube "değiştirilmiş / sentetik içerik" sorusunu eklenti **işaretlemez**; gerekiyorsa sen yanıtla.
- Seçiciler: `content/youtube.js` (kaydedilmiş Studio sayfalarından doğrulandı), `content/facebook.js` (Reels oluşturucunun gerçek yapısına göre: adım göstergesi Create → Edit → Share, alt çubukta Next / Share; video alanı "Add video" tıklanınca DOM'a konmadan oluşur; `content/facebook-main.js` (sayfa dünyasında) o alanın `.click()` çağrısını yakalayıp dosyayı doğrudan verir, olmazsa hazır alan / sürükle-bırak denenir — TR + EN yazılar).
- İki platforma birden gönderirken önce birini yayınla, sonra diğerini gönder (arka plan sekmesinde tarayıcı odak istekleri engelleyebilir).
