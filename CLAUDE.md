# Origami Studio — Claude notları

- Kullanıcıyla Türkçe konuş. Arayüz metinleri Türkçe.
- Çalıştırma: `npm run dev` → http://localhost:5180 (Express + Vite middleware, tek süreç).
- "Notları uygula" denirse: `npm run notes` → ilgili `data/projects/<id>/scene.json`'u düzenle →
  `notes.json`'da notu `status: "done"` + somut `reply` ile kapat. Ayrıntı: docs/ai-workflow.md
- Şema: docs/schema.md. Yol haritası: docs/plan.md (tamamlanan maddeleri işaretle).
- **Video üretirken önce docs/prompt-rehberi.md** (iş akışı, reçeteler, kontrol listesi) ve **docs/katalog.md** (envanter).
  Yeni üreteç: scripts/sablon-sahne.mjs → scripts/scenes-<id>.mjs. Kütüphane / tasarım değişince `npm run katalog`.
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
- Tarayıcıda modül testi yaparken uygulamanın yüklediği `?t=` sürümünü içe aktar; aksi hâlde ikinci modül kopyası oluşur.
- Büyük sahneleri elle yazma; `scripts/scenes-*.mjs` gibi bir üreteç betiği yaz (bkz. scenes-gunes-sistemi.mjs).
- Yeni origami modeli eklerken `scripts/seed-library.js` stilini izle: her düzlem iki üçgen, zıt `s` gölge.
