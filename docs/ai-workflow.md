# AI (Claude) ile Çalışma Akışı

Bu projede üretimi Claude kod/JSON yazarak yapar; siz stüdyoda izleyip not bırakırsınız.

> Sıfırdan video üretimi, hazır prompt şablonları ve kalite kontrol listesi için: [prompt-rehberi.md](prompt-rehberi.md).
> Var olan modeller, temalar ve animasyonlar: [katalog.md](katalog.md).

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
- Stil: `"style": "origami" | "kagit-kesme" | "duz" | "cizim"` (sahne geneli ya da katman başına).
  `cizim` = el çizimi kontur + pastel boya; girişte `cizerek-gir` kullan ([schema.md §10](schema.md#10-çizim--boya-stili-faz-14)).
- İki nesne arasındaki geçiş / ilişki için **ok katmanı** kullan: `{ "type": "arrow", "arrow": "ok-kavis", "from": "a", "to": "b" }`.
  Uçları katman id'siyle bağla (koordinat yazma); zaman için `cizerek-gir`, yolculuk için `rider`. Bkz. [schema.md §11](schema.md#11-oklar--nesneden-nesneye-geçiş-faz-15).
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

## Uygulama içinden (Claude API) — AI4

Claude Code oturumu açmadan da notlar uygulanabilir: sunucuyu `ANTHROPIC_API_KEY` ile başlat (`$env:ANTHROPIC_API_KEY="…"; npm run dev`),
stüdyoda Notlar → **✨ Claude ile uygula**. CLI karşılığı: `npm run ai-notlar -- <proje-id>` (`--kuru` yalnızca istek boyutunu gösterir).
Model `ANTHROPIC_MODEL` ile seçilir (varsayılan `claude-opus-5-5`). Açık notlar + not kareleri + sahne + şema/katalog gönderilir;
dönen sahne `scene.json`'a yazılır (otomatik sürüm olur), notlar `done` + `reply` ile kapanır.

## Yerel seslendirme (VoxCPM2, GPU)

Metinden anlatım sesi üretir ve sahnenin `audio` izlerine ekler (env zarfı dahil).

```bash
npm run seslendir -- --proje <id> --metin "Merhaba" --start 0.5
npm run seslendir -- --proje <id> --satirlar anlatim.txt --ad anlatim --ses-id anlatici   # satır: "başlangıç_sn | metin"
```

- **Ses sayfası** (`/ses`): veri setindeki 2.752 sesi gez/ara, referans kaydı dinle, metni sese dönüştürüp dinle. ★ ile kaydedilen sesler
  `data/voices/` altında durur (`<id>.json`); sese ad verilebilir. Referans kayıtlar ilk dinlemede indirilip `data/voices-cache/` altında saklanır.
  Kullanıcı "şu sesi kullan" derse `--ses-id <id|ad>` ver. Ses yoksa varsayılan ses kullanılır. Ses, referans kayıttan klonlanır (sentetik sesler).
- **Katalog yerelde**: ilk açılışta 2.752 sesin metin bilgisi `data/voices-katalog.json`'a indirilir (bir kez, ~1 dk); arama/süzgeç/sayfalama oradan yapılır.
- **Etiketler** (`data/voice-tags.json`, sayfada "Etiketleri yönet"; API `/api/tts/tags` CRUD, `PUT /api/tts/voices/:id/tags`): "Hazır etiketleri uygula"
  tariflerden Genç/Orta yaş/Olgun/Yaşlı, Kalın/İnce ses, Sıcak/Sakin/Enerjik/Ciddi, tempo, Anlatıcı/Sunucu/Müşteri hizmetleri/Öğretmen atar.
  Katalogda **çocuk sesi yok** (hepsi yetişkin); istenirse kullanıcı kendi etiketini ekleyip sesleri işaretler.
- **Sesi etiketten seç**: kullanıcı "sakin bir kadın sesi", "anlatıcı" gibi tarif ederse:
  `node scripts/sesler.mjs --etiket "Anlatıcı,Sakin" --cinsiyet kadin` (hepsini taşıyanlar; `--ara deep`, `--limit`, `--etiketler`, `--kayitli`) ile aday listele,
  sonra `npm run seslendir -- … --etiket "Anlatıcı,Sakin" --cinsiyet kadin [--sira 1]` (kayıtlı sesler önce gelir) ya da seçtiğin id ile `--ses-id`. Seçtiğin sesi kullanıcıya söyle.
- Motor (`tts/sunucu.py`) modeli bir kez yükler, 127.0.0.1:5181'de dinler. Sayfa ya da `seslendir` gerektiğinde başlatır; `npm run dev` kapanınca kapanır.
  `seslendir` motoru kendi açtıysa işi bitince kapatır, sayfanın açtığına dokunmaz.
- Kurulum `tts/` altında: `python -m venv tts/.venv`, torch (cu124), `pip install voxcpm soundfile`. `tts/.venv` git'e girmez.
- Çıktı `data/audio/<ad>-<n>.wav` (48 kHz). Aynı `--ad` ile tekrar çalıştırmak eski izleri değiştirir.
- Betik sonunda anlatımın bittiği anı ve sahne süresini karşılaştırır; uzunsa uyarır. Sahne süresini anlatıma göre ayarla.
- Metinde rakamları yazıyla yaz (1554 → bin beş yüz elli dört), ardışık satırların çakışmadığını süreden kontrol et.
- Veri seti CC-BY / CC-BY-SA: sesleri olduğu gibi yeniden dağıtırsan atıf ver; ürettiğin konuşma sana aittir.

## Yerel müzik (ACE-Step 1.5, GPU)

Enstrümantal fon müziği üretir ve sahnenin `audio` izlerine ekler (env zarfı dahil). Yalnızca müzik; ses efektleri için `npm run gen-audio` (kodla sentez, eğitim verisi yok).

```bash
npm run muzik -- --proje <id> --prompt "warm relaxed instrumental, soft acoustic guitar, cozy, slow tempo" --sure 30 --volume 0.3
```

- **Sayfa:** `/muzik` (hazır tarifler, süre, BPM, anahtar, seed; dinle; data/audio'ya kaydet).
- Tarifi İngilizce yaz: tür, ruh hali, enstrümanlar, tempo. `--sure` 10–120 sn (sahne süresine eşitle; uzun sahne için birden çok parça ya da döngü). Konuşma altında `--volume 0.25–0.35`.
- **Uzun sahne = döngü (kural):** motor tek seferde en çok 120 sn üretir. Sahne (start'tan sonra) buna sığmıyorsa **üretilemeyen süreyi uzatmaya çalışma; aynı parçayı art arda ekle**.
  `npm run muzik` bunu kendisi yapar: parça (`--parca`, varsayılan 90 sn) aynı dosyadan N ses izi olarak arka arkaya eklenir, aralarda `--capraz 2` sn çapraz geçiş,
  üretilen parçanın sondaki ~2 sn sessizliği (`--kuyruk`) kırpılır. Döngüye uygun, tempo/yoğunluk değişmeyen bir tarif yaz ("steady", "loopable", belirgin final/intro yok).
  Elle eklersen: aynı `file`, `start = önceki start + (süre − kuyruk − çapraz)`, ara izlerde `fadeIn = fadeOut = çapraz`, son izde `dur` ile sahne sonuna kırp.
- **Konuşma:** tek satır uzun sürerse metni cümlelere böl (`--satirlar`, her satır ayrı dosya); uzun anlatım böylece art arda dizilir, süre sorunu olmaz.
- Çıktı `data/audio/<ad>.wav`; aynı `--ad` ile tekrar çalıştırmak izi değiştirir. `--seed` aynı sonucu tekrar üretir. Seed ve tarifi rapora yaz.
- Motor `muzik/ACE-Step-1.5` içinde (`acestep-api`, 127.0.0.1:8001), gerektiğinde başlatılır; `muzik/` git'e girmez. Modeller ilk üretimde iner (~10 GB).
  Kurulum: `git clone https://github.com/ACE-Step/ACE-Step-1.5 muzik/ACE-Step-1.5`, `uv sync` (uv: `pip install uv`).
- GPU belleği: konuşma (VoxCPM2) ve müzik motorları aynı anda açıksa 12 GB sınırına yaklaşabilir; bellek hatasında birini kapat.
- **Telif:** ACE-Step MIT lisanslı; eğitim verisi "lisanslı + telifsiz + sentetik" (geliştirici beyanı, bağımsız doğrulama yok). Çıktı mevcut bir esere kasıtsız benzeyebilir;
  önemli videolarda dinleyip kontrol et. Yapay zekâ çıktısının telif statüsü ülkeye göre değişir. Başka modeller (MusicGen, AudioLDM 2, TangoFlux) ticari kullanıma kapalıdır, kullanma.
