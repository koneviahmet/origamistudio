# Origami Studio — Prompt Rehberi

Bu belge iki okura yazıldı:

- **Sen (kullanıcı):** §3'teki şablonlardan birini kopyala, köşeli parantezleri doldur, yapay zekâya gönder.
- **Yapay zekâ (Claude vb.):** §1'deki ana bağlamı ve §2'deki iş akışını izle. Envanter için
  [katalog.md](katalog.md), JSON alanları için [schema.md](schema.md), not döngüsü için [ai-workflow.md](ai-workflow.md).

İlgili dosyalar:

| Dosya | Ne işe yarar |
|---|---|
| `docs/katalog.md` | Var olan her şeyin listesi: modeller, efektler, temalar, fontlar, animasyonlar, geçişler (`npm run katalog` ile yenilenir) |
| `docs/schema.md` | JSON alanlarının tam tanımı (§1–§9) |
| `scripts/sablon-sahne.mjs` | Yeni video üreteci şablonu (kopyala → düzenle → çalıştır) |
| `scripts/scenes-ozellik-turu.mjs`, `scenes-gunes-sistemi.mjs` | Tam, çalışan örnek üreteçler |

---

## 1. Ana bağlam (yapay zekâya her oturumda verilecek)

> Aşağıdaki blok bir sohbetin başına yapıştırılabilir. Claude Code bu projede `CLAUDE.md` üzerinden zaten okur.

```text
Sen Origami Studio projesinde video üreten bir yardımcısın. Proje D:\vue\makevideo.

NE: Kod (JSON) ile üretilen, origami / kağıt kesme / düz vektör tarzında animasyon videoları.
Çıktı Instagram Reels, YouTube Shorts, TikTok (1080×1920) ve YouTube (1920×1080) için MP4.
Kullanıcı Türkçe konuşur; tüm metinler, arayüz ve açıklamalar Türkçe.

NASIL ÇALIŞIR:
- Video = data/projects/<id>/scene.json (katmanlar, keyframe'ler, ön ayarlar, geçişler, ses).
- Modeller ve efektler = data/library/<kategori>/<id>.json. Temalar data/themes, metin stilleri data/textstyles.
- Render motoru saf ve deterministiktir; önizleme ile MP4 aynı kareyi üretir.
- Kullanıcı stüdyoda (http://localhost:5180) oynatır, not bırakır; sen notları uygularsın.
- scene.json'daki her değişiklik otomatik sürüm olur (Geçmiş sekmesi); geri alınabilir.

KURALLAR:
1. Envanteri tahmin etme: önce docs/katalog.md'yi oku. Olmayan modeli kullanma; gerekirse yeni model ekle.
2. Büyük sahneyi elle yazma: scripts/sablon-sahne.mjs'i scripts/scenes-<id>.mjs olarak kopyala ve düzenle.
3. Önce ön ayarları kullan (anims, textAnims, tema, varyant, metin stili, kütüphane efekti),
   keyframe'i yalnızca özel yörünge / kamera / kesin zamanlama için yaz.
4. Türkçe metinde Fredoka, Titan One, Satisfy KULLANMA (ğ ş İ eksik). Varsayılan Baloo 2.
5. 9:16'da başlıklar y≈250–450, içerik y≈500–1450; y>1500 (Reels açıklama alanı) ve sağ kenar boş kalmalı.
6. Geçişte t = kesme anı: eski bölümün katmanları end=t, yenilerin start=t.
7. Üretimden sonra kareleri RENDER ET ve GÖRSEL OLARAK KONTROL ET (docs/prompt-rehberi.md §5);
   sorunları düzelt, test görsellerini sil, sonra raporla.
8. Emin olmadığın bilgiyi (tarih, sayı, bilimsel gerçek) videoya koyma; koyduysan raporda belirt.
```

---

## 2. Üretim iş akışı (yapay zekâ için)

1. **Brief'i netleştir.** Konu, hedef platform, süre, ton, renk / tema, metinler hazır mı? Eksik ama tahmin
   edilebilir alanlar için makul varsayım yap ve raporda belirt; kritik belirsizlikte sor.
2. **Hikâye tahtası (storyboard) çıkar.** Bölüm listesi: her bölüm için süre, ana nesne, metin, animasyon,
   geçiş. Süreyi §4.1'deki okuma kurallarıyla hesapla.
3. **Envanteri eşleştir.** `docs/katalog.md`'den model / varyant / efekt / tema / metin stili seç.
   Eksik model varsa:
   - Basit geometrik: `scripts/seed-library.js` stilinde facet'lerle yaz (her düzlem iki üçgen, zıt `s`).
   - Küre, gezegen: aynı dosyadaki `radialSphere` / `bandedSphere` üreteçlerini kullan.
   - Görseli olan: Kütüphane → "Görselden origami".
   - Yeni modele `roles` ve 2–3 `variants` ekle, sonra `npm run seed`, `npm run seed:design`, `npm run katalog`.
4. **Üreteci yaz.** `scripts/scenes-<id>.mjs` (şablondan). Bölüm başları `S` nesnesinde, katmanlar `group` ile
   bölüm klasörlerine ayrılır. Her bölüme `sections` girdisi ekle.
5. **Çalıştır:** `node scripts/scenes-<id>.mjs`.
6. **Görsel kontrol:** §5'teki yöntemle 8–12 kareyi render et; `Read` ile incele; §6 listesini uygula.
7. **Düzelt, yeniden üret, tekrar bak.** En az bir tur düzeltme beklenir.
8. **MP4 testi:** Tarayıcıda `exportMp4` ile (gerekirse %50 ölçekte) boyut / süre / ses doğrula.
9. **Temizlik:** `data/projects/<id>/snapshots/` altındaki test görsellerini sil. Katalog değiştiyse `npm run katalog`.
10. **Rapor:** Türkçe; kullanıcının göreceği bölüm tablosu, neyi kontrol ettiğin, bilinen sınırlamalar,
    doğruluğunu teyit etmediğin bilgiler.

---

## 3. Prompt şablonları (kullanıcı için)

Köşeli parantezleri doldur. Boş bıraktığın alanlar için yapay zekâ makul varsayım yapar ve raporda belirtir.

### 3.1 Yeni video (genel)

```text
Origami Studio'da yeni bir video hazırla.
Konu: [ör. "dört mevsim"]
Platform / format: [Reels 9:16 | YouTube 16:9 | ikisi de]
Süre: [ör. 30–40 sn]
Ton: [eğlenceli | sakin | bilgilendirici | duygusal]
Tema / renkler: [katalogdaki bir tema, ör. "sonbahar" | "markamın renkleri: #0d1b2a, #ffb703"]
Stil: [origami | kağıt kesme | düz]
Metinler: [hazır metinleri buraya yaz | "sen yaz, kısa tut"]
Müzik: [örnek müzik | kendi dosyam: <ad>.mp3 | müziksiz]
Ekstra: [ör. "sonunda konfeti", "her bölüm arasında sayfa çevirme"]
Bitince önemli kareleri render edip kontrol et, sonra bölüm tablosuyla raporla.
```

### 3.2 Eğitim / anlatım videosu (Güneş Sistemi tarzı)

```text
[Konu] hakkında eğitici bir Reels videosu yap.
Yapı: açılış başlığı → [N] bölüm (her bölümde: ad, sıra etiketi, 2 kısa bilgi, bir model) → özet kapanış.
Bilgiler: [kendi bilgilerini yaz | "sen seç ama yalnızca kesin bilinen bilgiler"]
Her bölüm okunabilir olsun (bilgi başına en az 2.5 sn).
Kapanışta tüm öğeleri bir arada göster.
Örnek üreteç: scripts/scenes-gunes-sistemi.mjs
```

### 3.3 Hikâye / masal

```text
[Karakter] ile ilgili [süre] saniyelik kısa bir hikâye videosu yap.
Olay örgüsü: [1) … 2) … 3) …]
Karakter hareketleri: [ör. "tilki soldan yürüyerek gelsin, kuş kavisli bir yolda uçsun"]
Anlatım: [ekrana altyazı | yalnızca başlıklar]
Sahne geçişleri: [kağıt temalı geçişler | sade kesme]
```

İpucu: karakter hareketleri için hareket yolu (`path` + `pathT`), duygu için `sallan`, `nefes`, `hopla` ön ayarları.

### 3.4 Ürün / marka tanıtımı

```text
[Marka / ürün] için 15–20 sn tanıtım videosu.
Marka renkleri: [#…, #…, #…] — kurumsal tema oluştur (sınırlı palet + vurgu rolü).
Mesajlar (sırayla): [1. … 2. … 3. …]
Son kare: [slogan] + [web adresi / çağrı]
Formatlar: 9:16 + 1:1 + 16:9 (hepsi dışa aktarılabilir olsun).
```

### 3.5 Liste / "En iyi N"

```text
"[Başlık, ör. Dünyanın en hızlı 5 hayvanı]" liste videosu.
Sıralama: [5 → 1 geri sayım | 1 → 5]
Her madde: numara etiketi + ad + tek satır bilgi + ilgili model (yoksa en yakın modeli ya da yeni model).
Madde arası geçiş: [iterek kaydır | yırtık kağıt]
```

### 3.6 Yeni origami modeli

```text
Kütüphaneye yeni origami modeli ekle: [nesne, ör. "zürafa"].
Görünüm: [yan / ön profil], [renkler], hareketli parçalar: [ör. "boyun sallansın"].
2–3 varyant ekle (ör. [gece, pastel]). Renk rolleri tanımla.
Bitince kütüphane görüntüsünü render edip kontrol et ve kataloğu güncelle.
```

### 3.7 Görselden model + düzeltme

```text
data/… içindeki [görsel] dosyasını "Görselden origami" ile modele çevir.
Ayarlar: [renk sayısı ~5, üçgen boyu ~14]. Sonra: [fazla yüzeyi azalt / rollerini düzelt / kategori: …].
```

### 3.8 Notları uygula

```text
Notları uygula.
```

Yapay zekâ `npm run notes` çalıştırır ve not karelerine (`snapshots/<notId>.png`) bakar. Ardından `scene.json`'u düzeltir,
notu `done` ve somut bir `reply` ile kapatır. Stüdyo değişikliği anında gösterir, Geçmiş'ten geri alınabilir.

### 3.9 Revizyon (not bırakmadan)

```text
[Proje adı] projesinde:
- [ör. "Bölüm 2 çok hızlı, bilgileri 1 sn daha uzun tut"]
- [ör. "tilki yerine kutup varyantı"]
- [ör. "başlık fontunu Playfair yap"]
- [ör. "turnanın yolunu daha yukarıdan geçir"]
Değişen kareleri render edip önce/sonra kontrol et.
```

### 3.10 Formata uyarlama

```text
[Proje] videosunu [YouTube 16:9 | kare 1:1 | 4:5] için uyarla.
Sığdır mı kırp mı sen karar ver; başlıklar ve bilgiler kadrajda kalsın, kareleri kontrol et.
```

---

## 4. Tasarım reçeteleri

### 4.1 Zamanlama

| Öğe | Değer |
|---|---|
| Okuma hızı | ~3 kelime / sn. Bilgi satırı ekranda **en az 2.5 sn** kalmalı (yazılma süresi hariç) |
| Daktilo (reveal) | 0.8 sn / satır; ikinci satır 0.6 sn sonra başlar |
| Giriş animasyonu | 0.5–1.2 sn (katlanarak 1.0–1.3, zıplama 0.5–0.9) |
| Çıkış | 0.35–0.65 sn; bölüm sonundan 0.6 sn önce başlat |
| Kademeli giriş (stagger) | 0.15–0.3 sn aralık (katlanan dağlar, ağaçlar, liste maddeleri) |
| Bölüm | ≈ 1 sn giriş + içerik + 0.6 sn çıkış. İki bilgili bölüm: **4.6 sn** (kanıtlandı) |
| Geçiş | örtü 1.0–1.2 sn, kare tabanlı 0.8–1.1 sn |
| Reels toplam | 15–60 sn; eğitim videoları 40–55 sn |
| Müzik ile | Önemli girişleri vuruşlara oturt (120 BPM → 0.5 sn ızgara; zaman çizelgesinde mıknatıs var) |

### 4.2 Kompozisyon (1080×1920)

| Bölge | y aralığı | Ne konur |
|---|---|---|
| Üst UI (kaçın) | 0–230 | Güneş / dağ tepeleri taşabilir, metin konmaz |
| Başlık | 250–450 | `baslik-kalin` (130–170 px) + etiket kutusu |
| Sahne | 500–1450 | Ana nesne merkez y≈860, 320–640 px boyut |
| Bilgi satırları | 1250–1450 | 42–46 px, 85 px satır aralığı |
| Alt UI (kaçın) | 1500+ | Yalnızca zemin (tepeler, dalgalar), metin **yok** |
| Sağ kenar | x > 930, y 860–1500 | Reels düğmeleri — önemli öğe koyma |

16:9'a uyarlarken: dikey içerik `sigdir` + `zoom` 1.3–1.35 ve `focusY` 0.43–0.47 ile okunur kalır.

### 4.3 Tipografi

- Başlık: `baslik-kalin` (Bebas Neue, büyük harf). Yumuşak ton için `baslik-yuvarlak` (Baloo 2).
- Etiket / sıra: `etiket-kutu`. Bilgi: `alt-baslik` (Nunito 46 px). Altyazı: `altyazi` (kontur).
- `uppercase` Türkçe kurallarıyla çalışır (i→İ). Uzun alt başlığı `\n` ile iki satıra böl (≤ 36 karakter / satır).
- Renkleri temadan al (`$baslik`, `$metin`, `$vurgu`); sabit renk yalnızca bilinçli vurgu için.

### 4.4 Renk ve tema

- Bir tema seç (katalog §3); nesneye özel renk için önce **varyant**, sonra `palette`.
- Marka: yeni tema = `palette` (4–6 renk, `paletteStrength` 1) + `roles.vurgu` = marka rengi.
- Koyu zemin (uzay, gece) → açık metin; açık zemin → koyu metin. Sayfa çevirme kanadı zeminle **zıt** renk olmalı.

### 4.5 Hareket dili

- Giriş: `katlanarak-gir` (origami kimliği), `zipla-gir` (canlı), `dusup-gir` (ağaç, nesne), `ekrana-gir` (karakter).
- Süreklilik: her ana nesneye bir "yaşam" ekle: `suzul`, `nefes`, `sallan`, `kanat-cirp`, `kuyruk-salla`.
- Uçan / yüzen: hareket yolu + `orient: true` (sola bakan modelde `scaleX: -1`) + Bézier `[0.65, 0, 0.35, 1]`.
- Vurgu: taşan eğri `[0.34, 1.56, 0.64, 1]`, nabız (`nabiz`), konfeti patlaması.
- Metin: başlıkta harf animasyonu (`harf-don`, `harf-katla`, `harf-zipla`), bilgi satırında daktilo.

### 4.6 Ses

- `sfx.auto: true, volume 0.5` çoğu videoda yeterli; kalabalık sahnede katmana `"sfx": false`.
- Müzik: `volume` 0.5–0.7, `fadeIn` 1–1.5, `fadeOut` 2–2.5. Kullanıcının kendi müziğinde `bpm` / `beatOffset` "Algıla" ile bulunur.

---

## 5. Görsel doğrulama yöntemi (yapay zekâ için)

Sunucu çalışırken (`npm run dev` ya da masaüstü kısayolu) tarayıcı panelinde:

```js
// 1) Uygulamanın yüklediği modül sürümlerini al (yoksa ikinci modül kopyası oluşur!)
const find = (re) => performance.getEntriesByType('resource').map(e => e.name).filter(n => re.test(n)).pop();
const { renderFrame } = await import(find(/\/src\/engine\/renderer\.js/));
const { resources, loadResources } = await import(find(/\/src\/resources\.js/));
const { ensureSceneFonts } = await import(find(/\/src\/fonts\.js/));
await loadResources(); const R = resources.value;
const { scene } = await (await fetch('/api/projects/<id>')).json();
await ensureSceneFonts(scene, R);
// 2) Kare ızgarası (her kareyi kendi alanına kırp!)
const times = [/* her bölümün ortası + her geçiş anı */];
const W = 250, H = 444, G = 6, cols = 6;
const c = document.createElement('canvas'); c.width = (W + G) * cols; c.height = (H + G) * Math.ceil(times.length / cols);
const ctx = c.getContext('2d');
times.forEach((t, i) => { ctx.save(); ctx.translate((i % cols) * (W + G), Math.floor(i / cols) * (H + G));
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); ctx.scale(W / scene.width, H / scene.height);
  renderFrame(ctx, scene, t, R); ctx.restore(); });
// 3) Diske yaz → Read aracıyla görüntüyü incele → işin sonunda sil
const blob = await new Promise(r => c.toBlob(r, 'image/png'));
await fetch('/api/projects/<id>/snapshots/kontrol', { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: blob });
```

- Formatları kontrol etmek için `renderFrame(ctx, scene, t, R, { format: scene.formats[i] })`; kare boyutu formatınki.
- MP4: `exportMp4(scene, R, { audioBuffer: await renderMix(scene, 0, scene.duration), scale: 0.5 })`, sonra
  `<video>` ile `videoWidth` / `duration` doğrula.
- Tarayıcı paneli çok küçükse stüdyo tuvali birkaç piksel olur. Görünüm alanını büyüt ya da `renderFrame` ile kendin çiz.

---

## 6. Kalite kontrol listesi

- [ ] Her bölüm başlığı ve bilgisi kadrajda, kenarlardan taşmıyor, alt UI bölgesine girmiyor.
- [ ] Bilgiler tamamen yazıldıktan sonra ≥ 2.5 sn okunabiliyor.
- [ ] Türkçe karakterler (ğ ş İ ı) doğru fontla görünüyor (Fredoka / Titan One / Satisfy yok).
- [ ] Geçiş anlarında içerik doğru değişiyor; örtü t anında ekranı tam kapatıyor.
- [ ] Kapanış öğeleri çakışmıyor (liste + kapanış metni).
- [ ] Hareket yolundaki nesne yönü doğru (sola bakan model `scaleX: -1`).
- [ ] Parçacık efekti görünür yoğunlukta (geç başlayan efekte `prewarm: true`).
- [ ] Koyu / açık zemin–metin kontrastı yeterli; sayfa çevirme kanadı zeminle zıt.
- [ ] Formatlar (16:9, 1:1) kontrol edildi; başlıklar kırpılmıyor.
- [ ] MP4 boyutu ve süresi doğru; müzik ve efektler taşmıyor (sınırlayıcı var).
- [ ] Test görselleri silindi; yeni model / efekt eklendiyse `npm run katalog` çalıştırıldı.
- [ ] Doğruluğundan emin olunmayan bilgiler raporda belirtildi.

---

## 7. Zayıf ve güçlü prompt örnekleri

**Zayıf:**

```text
Bana güzel bir video yap.
```

Konu, format, süre ve ton yok. Yapay zekâ her şeyi tahmin eder.

**Güçlü:**

```text
"Suyun döngüsü" hakkında 40 sn eğitici Reels videosu.
Bölümler: buharlaşma → yoğunlaşma → yağış → toplanma; her bölümde 2 kısa bilgi.
Tema: pastel-ruya, stil origami. Yağış bölümünde yağmur efekti, toplanmada dalgalar.
Bölümler arası yırtık kağıt geçişi. Örnek müzik, otomatik efektler açık.
Formatlar: 9:16 + 16:9. Bitince kareleri kontrol et, bölüm tablosuyla raporla.
```

**Revizyonda zayıf:**

```text
Biraz daha iyi yap.
```

**Revizyonda güçlü:**

```text
Özellik Turu'nda easing bölümü hızlı; yıldızlar 2.5 yerine 3.5 sn'de gitsin,
etiketler 40 px olsun, "sekme" satırını kırmızı yap.
```

---

## 8. Bu projede öğrenilenler (sık hatalar)

| Belirti | Neden | Çözüm |
|---|---|---|
| "kağıttan"daki ğ farklı fontta | Fredoka'da ğ, ş, İ yok | Türkçe testi geçen font; varsayılan Baloo 2 |
| Stüdyo açılmıyor, "Cannot access … before initialization" | Değişken tanımından önce `watch` listesinde | Tanımı yukarı al; derleme bunu yakalamaz, tarayıcıda test et |
| Efekt ekranda görünmüyor | Rüzgâr düşüş hızından büyük (düzeltildi) ya da geç başlayan efekt boş başlıyor | `prewarm: true`; rüzgârlı efektler yandan doğar |
| Bilgiler okunamadan kayboluyor | Bölüm çok kısa | Bölüm ≥ 4.6 sn (2 bilgi); §4.1 |
| Kapanış yazısı listeye biniyor | Dikey alan hesaplanmamış | Öğe yükseklikleri + 14 px boşluk; kapanış metni y ≤ 1460 |
| Sayfa çevirmede kanat görünmüyor | Kanat rengi zeminle aynı ton | Zıt renk (koyu zeminde `#dfe6ff`) |
| Dikey video 16:9'da minik | `sigdir` zoom 1 | `zoom` 1.3–1.35, `focusY` ≈ 0.45 |
| Zaman çizelgesinde sahte keyframe | `anims` dizisi `{t}` içeriyor | Keyframe = `{t, v}` (motor artık ayırt ediyor) |
| Ritim algılama yanlış tempo | Ara vuruş / ped vurusu | Spektral akı + metrik düzey (düzeltildi); gerekirse ×2 / ÷2 |
| Test sonuçları tutarsız | Tarayıcıda `?t=` sürümü yerine yeni modül kopyası içe aktarıldı | §5'teki `find()` ile uygulamanın modülünü al |
| Kabuk betiğinde `\n` gerçek satır sonu oldu | Heredoc / sed kaçışları | Çok satırlı düzenlemeyi Edit aracıyla ya da dosyaya yazılan betikle yap |
| Kuş yolda ters uçuyor | Model sola bakıyor | `scaleX: -1` + `orient: true` (`orientOffset` 0) |
