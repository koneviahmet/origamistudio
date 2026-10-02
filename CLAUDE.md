# Origami Studio — Claude notları

- Kullanıcıyla Türkçe konuş. Arayüz metinleri Türkçe.
- Çalıştırma: `npm run dev` → http://localhost:5180 (Express + Vite middleware, tek süreç).
- "Notları uygula" denirse: `npm run notes` → ilgili `data/projects/<id>/scene.json`'u düzenle →
  `notes.json`'da notu `status: "done"` + somut `reply` ile kapat. Ayrıntı: docs/ai-workflow.md
- Şema: docs/schema.md. Yol haritası: docs/plan.md (tamamlanan maddeleri işaretle).
- **Yeni video üretimi — varsayılan mod "serbest" (yaratıcılık önce):**
  1. Kullanıcı bir proje adı vermedikçe `data/projects/*`, `scripts/scenes-*.mjs`, `scripts/briefs/` ve geçmiş sürümleri **okuma / örnek alma**.
     Yalnızca "X gibi yap / X'i düzelt" denirse o projeye bak. Şablon (`scripts/sablonlar/`) yalnızca kullanıcı "şablonla" derse kullanılır.
  2. Kütüphaneden model/efekt/ok seçerken katalog.md'yi baştan okuma; önce `npm run ara -- "<sorgu>"` çalıştır (anahtar kelime + eş anlamlı + duygu sözlüğü; kısa aday listesi). Sonuç yoksa ya da alakasızsa katalog.md'ye bak ya da yeni model üret. Yeni varlık eklenince `data/esanlamlilar.json`'a TR+EN arama sözcükleri, uygunsa `data/duygular.json`'daki duygu listelerine id ekle.
     Önce **docs/uretim-ozet.md** (teknik sözlük, tek sayfa) oku. Ayrıntı gerekirse docs/schema.md, docs/katalog.md; docs/prompt-rehberi.md'yi baştan sona okuma.
  3. Kodlamadan önce kısa **yaratıcı brief** yaz: konuya özgü 3 farklı konsept (biri cesur / beklenmedik), seçilen konseptin görsel metaforu,
     stil + tema + tipografi + kamera + geçiş dili, ritim. Kullanıcıya sor-onay gerekmez; rapora yaz.
  4. **Çeşitlilik:** docs/kullanilan-kombinasyonlar.md'yi oku; son videolardaki stil/tema/font/geçiş kombinasyonunu tekrarlama. Video bitince oraya tek satır ekle.
     Klişe varsayılanlardan (hep Baloo 2 + origami + aynı `anims`) bilinçli uzaklaş; eksik model / efekt / tema gerekiyorsa **yenisini üret**.
  5. **Paylaşım bilgisi:** her yeni videoda `scene.publish = { title, description, tags[] }` doldur (video konusuna özgü; başlık ≤100 kr, 8–15 etiket '#'sız, açıklama 2–4 cümle + çağrı). Şablonda `brief.yayin`. Şema §3.
  6. Bitince `npm run dogrula -- <id>` (ucuz yapısal denetim), sonra §5 yöntemiyle kare kontrolü.
  Modlar (kullanıcı söylemezse `serbest`): `serbest` = maksimum özgünlük · `sablon` = hızlı / ekonomik (`scripts/uret.mjs`) · `devam` = mevcut projenin üslubuyla.
  Tam iş akışı / reçeteler / kontrol listesi: docs/prompt-rehberi.md (yalnızca gerektiğinde ilgili bölümü).
  Yeni üreteç: scripts/sablon-sahne.mjs → scripts/scenes-<id>.mjs. Kütüphane / tasarım değişince `npm run katalog`.
  Bağlamı temiz tutmak için büyük yeni üretimi `video-uretici` alt ajanına (.claude/agents/) devretmek uygundur.
- **ONAY KUYRUĞU (her yeni video için zorunlu adım):** konsept seçildikten sonra, sahneyi kodlamadan **önce**:
  1. `npm run ara -- "<sorgu>"` ile kullanılabilecek kütüphane nesnelerini kısa listele (katalog.md'yi okuma); listede olmayanı **hemen üret** (seed betiği + `npm run katalog`), `esanlamlilar.json`'a ekle.
  2. Ses: `npm run sesler -- --etiket ... --limit 10` ile aday tara, **5 ses** seç (anlatıcı / karakter vb. rol çeşitliliği, her biri için `nerede` + `amac`).
  3. `scripts/onay-<video-id>.json` yaz (biçim: `scripts/onay.mjs` başlığı: `{id, baslik, ogeler:[{id,tur:"nesne"|"ses",ref,nerede,amac,yeni?}]}`; nesne için `ref`=kütüphane id, ses için `ref`=ses id + `ad, cinsiyet, etiketler, aciklama`).
     `npm run onay -- olustur scripts/onay-<video-id>.json` → kullanıcıya **/onay/<video-id>** sayfasını bildir (Kullan / Kullanma / Düzenleyerek kullan; sırayla ve tüm liste). Oturum id'si = video id'si; birden fazla video aynı anda ayrı oturumla çalışır.
  4. `npm run onay -- bekle <video-id>` (arka planda; kullanıcı bitirince özet basar) → kararları uygula: **kullan** = olduğu gibi · **kullanma** = çıkar / alternatif seç (kullanıcı `not` açıklaması ve referans görsel eklediyse — `onay durum` çıktısındaki `referans görsel:` yollarını Read ile aç — o açıklama + görsele göre YENİ model üret, listeye `yeni: true` ile aynı oturuma ekle; gerekirse yeni ögeyi aynı yolla ekle) · **düzenle** = kullanıcıdan düzenleme BEKLENMEZ (arayüzde "Düzenledim" düğmesi yok); `not` alanını ve referans görselleri oku, **her zaman sen düzenle** (kütüphanedeki **aynı varlığın üzerine yaz**, id değişmez; bu ses için geçerli değil, ses için alternatif seç), sonra `npm run onay -- duzenlendi <oturum> <öge> "ne yaptım"`. Yalnızca kararlardan sonra üretime devam et. Karar sırasında yeni öge gerekirse aynı oturuma ekle (`olustur` var olan kararları korur).
  Kütüphane dışı üretim önceden onaylanmış sayılmaz: yeni üretilen öge de listeye `yeni: true` ile girer. Onaylanmış oturumu eski videolarda tekrar sorma.
- Render motoru (`web/src/engine/`) saf olmalı: önizleme ve MP4 dışa aktarım aynı `renderFrame`'i kullanır;
  rastgelelik yalnızca tohumlu (deterministik) olabilir.
- Tasarım sistemi (Faz 9): tema, stil (origami / kagit-kesme / duz / cizim), varyant, `anims` ön ayarları, metin stilleri, yerel fontlar.
  Üretimde önce bunları kullan, sonra keyframe. Türkçe metinde Fredoka, Titan One ve Satisfy kullanma (glif eksik); varsayılan Baloo 2.
- Faz 10: parçacık katmanı (`type: "particles"`), `textAnims` (harf/kelime/satır), sahne `audio` izleri. Şema §6.
  Keyframe izi = `{t, v}` dizisi; `anims`/`textAnims` keyframe değildir.
- Faz 11: `transitions` (t = kesme anı; katman start/end t'de değişmeli), `sections`, `sfx.auto`, `audio[i].bpm/beatOffset`. Şema §7.
- Faz 12: `formats` (sigdir/kirp + overrides), sürüm geçmişi (her disk değişikliğim otomatik "disk" sürümü olur; kullanıcı Geçmiş'ten geri alabilir), görselden origami (`web/src/importer/`). Şema §8.
- Faz 13: keyframe `ease` = ad ya da `[x1,y1,x2,y2]`; `path` + `pathT` hareket yolu; `groups` + `layer.group/locked`;
  parçacık efektleri kütüphanede (`type: "particles"`, sahnede `"particle": "<id>"`). Şema §9.
- Faz 14: `style: "cizim"` (el çizimi kontur + pastel boya), `sketch` ayarları, `cizerek-gir` / `silinerek-cik`. Şema §10.
- Faz 15: ok katmanı `type: "arrow"` (from/to = katman id, `rider`, `label`), stiller kütüphanede `oklar` (`type: "arrow"`). Şema §11.
- Arayüz: **Şablonlar** sayfası (`/sablonlar`: galeri + önizleme(ses) + içerik/görünüm/paylaşım/JSON → proje; 11 reels şablonu, ritme oturur), Stüdyo sağ panelde **İçerik** (tüm metin / görsel tek yerde, bul-değiştir) ve **Paylaşım** (`scene.publish`, platforma kopyala) sekmeleri.
- **Bileşenler** sayfası (`/bilesenler`): grafik / cihaz / görsel / ses dalgası ön ayarları `data/components/<id>.json` (`{name, description, type, props}`); Stüdyo ＋ Bileşen menüsünde "Kayıtlı bileşenler" olarak çıkar, katman Denetçi'sinden "☆ Bileşen olarak kaydet". Hazırlar: `npm run seed:bilesen`. Sahnede tipik kullanım için `props` alanlarını katmana kopyala (şema §12).
- **Bileşen seçimi (az token):** hazır bileşen (grafik, kart, liste, kod, zamanlayıcı, cihaz…) gerekiyorsa `data/components/` dosyalarını okuma; önce `npm run bilesen -- "<sorgu>"` ve/veya etiket süzgeci çalıştır
  (`--amac fiyatlandirma --ton premium-sik --konu e-ticaret --tur kart --n 5`; sözlük: `npm run bilesen -- --etiketler`; ayrıntı: `--detay <id>`). Sahneye eklemek için üreteç betiğinde
  `import { bilesen } from './lib/bilesen.mjs'` → `const B = bilesenBaglam({ W, H, tema })` → `L(B('fiyat-pro', { id, konum: 'orta', genislik: 0.8, start, end, varyant: ['koyu'], tema: true, title: '…', giris: 'zipla-gir' }))`. **Bileşeni projeye uyarlamak için** önce `npm run bilesen -- --alanlar <id>` (özelleştirilebilir tüm alanlar, seçenekler, giriş/çıkış ön ayarları) ve `--varyantlar` çalıştır; içerik (metin/veri/satır), renk ($vurgu…), yazı ölçeği/kalınlığı (`textScale`, `weight`), iç içe nesneler (`card: {color}`), konum/genişlik ve animasyon (`anims`, `giris`, `cikis`) açıkça verilebilir. Etiketler: `etiketler` = amac, konu, ton, stil, icerik, yerlesim, boyut, gereksinim, anahtar (şema §12). Yeni bileşen eklenince `npm run etiketle:bilesen`.
- **Karakterler** (`/karakterler`, `data/characters/<id>.json`, katman `type: "karakter"`): konuşan / yürüyen / tanıtan karakter setleri. Hareket (40 aksiyon) ve duygu (23) kataloğu **tüm karakterlerce ortak**; karakter yalnızca görünümdür.
  Karakter gerekiyorsa dosyaları okuma; `npm run karakter -- "<sorgu>"` (+ `--detay <id>`, `--aksiyonlar`, `--duygular`, `--nesneler`) çalıştır. Üreteçte `import { karakterBaglam, diyalog } from './lib/karakter.mjs'` →
  `const K = karakterBaglam({ W, H }); L(K('copadam', { id, konum, boy, varyant, ekler, start, akis: [{t, aksiyon, duygu, dx, hedef}], soz: [{t, metin}] }))`; iki karakter: `diyalog({a, b}, [{kim, metin, duygu, sure}], {t0})`.
  Ayrıntı: docs/schema.md §15, docs/prompt-rehberi.md §11. Yeni karakter eklenince `etiketler` + `kullanim` doldur; seed: `npm run seed:karakter`. Örnek: `scripts/scenes-karakter-demo.mjs`.
- Seslendirme: `npm run seslendir -- --proje <id> --satirlar dosya.txt [--ses-id <id|ad> | --etiket "Sakin,Genç" --cinsiyet kadin]` (yerel VoxCPM2, tts/; kullanıcı /ses sayfasında ses seçer/etiketler; aday listesi: `npm run sesler`). Ayrıntı: docs/ai-workflow.md
- Müzik: `npm run muzik -- --proje <id> --prompt "<İngilizce tarif>" --sure 30 --volume 0.3` (yerel ACE-Step 1.5, muzik/; yalnızca enstrümantal). Sahne 120 sn'yi aşarsa müzik **aynı parçanın art arda döngüsü** olarak eklenir (betik kendisi yapar; uzatmaya çalışma). Efektler için `npm run gen-audio`. Telif notları: docs/ai-workflow.md
- Faz 16: bileşen katmanları `chart` / `device` / `media` / `waveform`, `depth` + `blur` + `camera.focus/dof`, ses zarfı (`audio[i].env`) ve
  `ritimle-*` / `sesle-*` ön ayarları, şablonlar (`node scripts/uret.mjs <brief.json>`, `scripts/sablonlar/`), sunucu render
  (`npm run render -- <proje>`). Şema §12–§14. Reels şablonları (`vurus, hook, siralama, karsilastir, urun, rakamlar, adimlar, sohbet`; yapı taşları `scripts/sablonlar/reels.mjs`, ritim parçaları `npm run ritim`, şekiller `npm run seed:sekil`): docs/prompt-rehberi.md §9. Metin katmanında sayaç: `count` + `counter` (şema §3).
- Medya karesi renderer'a `res.mediaFrames` ile gelir; `prepareMedia` (web/src/media.js) doldurur — `renderFrame` senkron / saf kalmalı.
- Tarayıcıda modül testi yaparken uygulamanın yüklediği `?t=` sürümünü içe aktar; aksi hâlde ikinci modül kopyası oluşur.
- Büyük sahneleri elle yazma; `scripts/scenes-*.mjs` gibi bir üreteç betiği yaz (bkz. scenes-gunes-sistemi.mjs).
- Yeni origami modeli eklerken `scripts/seed-library.js` stilini izle: her düzlem iki üçgen, zıt `s` gölge.
- **YouTube'a yükleme** (`server/youtube.js`, Stüdyo → Paylaşım sekmesi üstü, `YoutubeUpload.vue`): OAuth istemcisi (kullanıcı bir kez kurar) + resumable upload; ayar/token `data/youtube.json` (gitignore). Başlık/açıklama/etiket `scene.publish`'ten gider. Kaynak MP4 `data/projects/<id>/renders/` altından seçilir (Dışa aktar'da "Projeye de kaydet" ya da `npm run render`). API: `/api/youtube/*`, `POST /api/projects/:id/youtube-upload`. Bunu Claude yapmaz; kullanıcı arayüzden yükler.
- **VERİ GÜVENLİĞİ (zorunlu):** `data/projects/` git'te DEĞİL ve yedeği yok; içinde kullanıcının tüm videoları, notları, sürüm geçmişi ve MP4'leri var.
  Claude **asla** `data/` altında (özellikle `data/projects`, `data/library`, `data/audio`, `data/media`) `rm`, `rm -rf`, `Remove-Item` ya da değişkenli silme çalıştırmaz.
  Test / örnek proje temizlemek için **yalnızca** `npm run proje-sil -- <id>` (kalıcı silmez, `data/projects-cop/` altına taşır; geri: `-- --geri <cop-adi>`) ya da arayüz / `DELETE /api/projects/:id`.
  Döngüyle silme yapılacaksa kimlikler **önce açık bir listeye** yazılır ve boş değer kontrol edilir; komut zinciri `&&` ile bağlanır (bir adım başarısızsa silme çalışmaz).
  Şablon / üreteç denerken `uret.mjs` projeyi `data/projects/<id>` altına yazar; **başlamadan önce** `ls data/projects` ile mevcut projeleri not et, bitince yalnızca kendi eklediklerini `proje-sil` ile kaldır.
  `.claude/settings.json` içinde `rm -rf data*` vb. için deny kuralı vardır; bunu aşmaya çalışma.
- **Simülasyonlar** (`/simulasyonlar`, `data/simulations/<slug>/sim.json` + `kaynak/`, ortak parçalar `_ortak/`): github.com/koneviahmet/orman-oyunu'ndan aktarılan 80 Vue/Three.js simülasyonu (10 modern, 70 eski). Arayüzde ara/süz, etiket-durum-not-kullanım amacı düzenle, kaynağı incele, çöpe taşı (`data/simulations-cop/`, kalıcı silme yok). Yeniden aktarma: `npm run simulasyon-aktar -- --kaynak <orman-oyunu klasörü>` (düzenlemeleri korur). API: `/api/simulations`. Henüz videoda kullanım amacı belirlenmedi.
