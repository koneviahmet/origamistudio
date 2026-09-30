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
  5. Bitince `npm run dogrula -- <id>` (ucuz yapısal denetim), sonra §5 yöntemiyle kare kontrolü.
  Modlar (kullanıcı söylemezse `serbest`): `serbest` = maksimum özgünlük · `sablon` = hızlı / ekonomik (`scripts/uret.mjs`) · `devam` = mevcut projenin üslubuyla.
  Tam iş akışı / reçeteler / kontrol listesi: docs/prompt-rehberi.md (yalnızca gerektiğinde ilgili bölümü).
  Yeni üreteç: scripts/sablon-sahne.mjs → scripts/scenes-<id>.mjs. Kütüphane / tasarım değişince `npm run katalog`.
  Bağlamı temiz tutmak için büyük yeni üretimi `video-uretici` alt ajanına (.claude/agents/) devretmek uygundur.
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
- Seslendirme: `npm run seslendir -- --proje <id> --satirlar dosya.txt [--ses-id <id|ad> | --etiket "Sakin,Genç" --cinsiyet kadin]` (yerel VoxCPM2, tts/; kullanıcı /ses sayfasında ses seçer/etiketler; aday listesi: `npm run sesler`). Ayrıntı: docs/ai-workflow.md
- Müzik: `npm run muzik -- --proje <id> --prompt "<İngilizce tarif>" --sure 30 --volume 0.3` (yerel ACE-Step 1.5, muzik/; yalnızca enstrümantal). Sahne 120 sn'yi aşarsa müzik **aynı parçanın art arda döngüsü** olarak eklenir (betik kendisi yapar; uzatmaya çalışma). Efektler için `npm run gen-audio`. Telif notları: docs/ai-workflow.md
- Faz 16: bileşen katmanları `chart` / `device` / `media` / `waveform`, `depth` + `blur` + `camera.focus/dof`, ses zarfı (`audio[i].env`) ve
  `ritimle-*` / `sesle-*` ön ayarları, şablonlar (`node scripts/uret.mjs <brief.json>`, `scripts/sablonlar/`), sunucu render
  (`npm run render -- <proje>`). Şema §12–§14. **Yeni video için önce uygun şablonu dene** (docs/prompt-rehberi.md §9).
- Medya karesi renderer'a `res.mediaFrames` ile gelir; `prepareMedia` (web/src/media.js) doldurur — `renderFrame` senkron / saf kalmalı.
- Tarayıcıda modül testi yaparken uygulamanın yüklediği `?t=` sürümünü içe aktar; aksi hâlde ikinci modül kopyası oluşur.
- Büyük sahneleri elle yazma; `scripts/scenes-*.mjs` gibi bir üreteç betiği yaz (bkz. scenes-gunes-sistemi.mjs).
- Yeni origami modeli eklerken `scripts/seed-library.js` stilini izle: her düzlem iki üçgen, zıt `s` gölge.
