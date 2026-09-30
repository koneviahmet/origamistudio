# Origami Studio — Katalog

> Bu dosya `npm run katalog` ile **otomatik üretilir** — elle düzenleme. Kütüphane / tasarım değişince yeniden üret.
> Üretim: 2026-09-30 15:52

## 1. Origami modelleri (39)

Sahnede: `{ "asset": "<id>", "variant": "<varyant>" }`. Boyut = varlık koordinat kutusu; `scale` = istenen px / en uzun kenar.
Parçalar `kanat-cirp` / `kuyruk-salla` ön ayarlarıyla ya da `parts` ile canlanır.

| id | ad | kategori | boyut | parçalar | roller | varyantlar | etiketler |
|---|---|---|---|---|---|---|---|
| `dalga` | Dalga | deniz | 400×100 | — | a:acik b:ana | gece (Gece), tropik (Tropik) | deniz, su, zemin |
| `su-fiskirmasi` | Su Fışkırması | deniz | 120×160 | — | a:acik b:ana | — | deniz, balina, su |
| `cam-agaci` | Çam Ağacı | doga | 140×220 | — | a:ana b:ikincil | sonbahar (Sonbahar), karli (Karlı), koyu (Koyu orman) | ağaç, orman |
| `dag` | Dağ | doga | 300×180 | — | a:ana b:ikincil c:acik | yesil (Yeşil), kum (Kum), gece (Gece) | manzara, kar |
| `lale` | Lale | doga | 120×220 | — | a:vurgu g:ana | sari (Sarı), mor (Mor), beyaz (Beyaz) | çiçek, bahar |
| `tepeler` | Tepeler | doga | 400×120 | — | a:ana b:ikincil | sonbahar (Sonbahar), kis (Kış), kum (Çöl) | zemin, çimen, manzara |
| `bulut` | Bulut | gokyuzu | 200×110 | — | a:acik | gri (Yağmur), pembe (Gün batımı) | gökyüzü, hava |
| `gunes` | Güneş | gokyuzu | 160×160 | — | a:ana b:vurgu | gunbatimi (Gün batımı) | gökyüzü, ışık |
| `hilal` | Hilal Ay | gokyuzu | 140×140 | — | a:ana | gumus (Gümüş) | gece, ay |
| `kagit-ucak` | Kağıt Uçak | gokyuzu | 200×100 | — | a:acik | mavi (Mavi), sari (Sarı) | uçan, klasik |
| `balik` | Balık | hayvanlar | 200×120 | tail | a:ana b:vurgu d:koyu | tropik (Tropik), yesil (Yeşil), mor (Mor) | deniz, yüzen |
| `balina` | Balina | hayvanlar | 260×140 | tail | a:ana c:acik d:koyu | gri (Gri), pembe (Pembe), gece (Gece) | deniz, büyük |
| `kelebek` | Kelebek | hayvanlar | 200×160 | wingL, wingR | a:ana b:vurgu d:koyu | mavi (Mavi), turuncu (Turuncu) | böcek, uçan, çiçek |
| `marti` | Martı | hayvanlar | 200×90 | wingL, wingR | a:acik b:ikincil o:vurgu d:koyu | — | kuş, deniz, uçan |
| `tilki` | Tilki | hayvanlar | 200×200 | tail | a:ana b:ikincil c:acik d:koyu | kutup (Kutup), gece (Gece), altin (Altın) | hayvan, orman, oturan |
| `turna` | Turna Kuşu | hayvanlar | 240×150 | wingBack, wingFront | a:ana b:ikincil | beyaz (Beyaz), altin (Altın), mavi (Mavi) | kuş, uçan, klasik |
| `akilli-telefon` | Akıllı Telefon (ilk dokunmatik) | iletisim | 160×300 | — | a:koyu b:ikincil c:acik e:vurgu f:vurgu g:ana h:detay | — | telefon, iletişim, teknoloji, akıllı, dokunmatik |
| `cevirmeli-telefon` | Çevirmeli Telefon | iletisim | 240×220 | — | a:ana b:ikincil c:koyu d:acik | mint (Mint) | telefon, iletişim, teknoloji, kadran, ev |
| `duvar-telefonu` | Duvar Telefonu (1800ler) | iletisim | 200×300 | — | a:ana b:vurgu c:ikincil d:koyu | — | telefon, iletişim, teknoloji, eski, ahşap |
| `kapakli-telefon` | Kapaklı Telefon | iletisim | 140×340 | — | a:ana b:ikincil c:koyu d:acik e:detay f:vurgu | — | telefon, iletişim, teknoloji, cep, kamera |
| `modern-telefon` | Modern Akıllı Telefon | iletisim | 160×320 | — | a:ikincil b:acik c:koyu d:ana e:vurgu f:detay g:vurgu | — | telefon, iletişim, teknoloji, akıllı, yapay zekâ |
| `raf` | Ahşap Raf | iletisim | 400×40 | — | a:ana b:ikincil | — | raf, mobilya, zemin |
| `tugla-telefon` | Tuğla Cep Telefonu | iletisim | 120×320 | — | a:ana b:ikincil c:koyu d:detay e:vurgu | — | telefon, iletişim, teknoloji, cep, anten |
| `tuslu-telefon` | Tuşlu Cep Telefonu | iletisim | 120×260 | — | a:ana b:acik c:koyu d:vurgu | sari (Sarı) | telefon, iletişim, teknoloji, cep, sms |
| `cezve` | Cezve | nesneler | 200×200 | — | a:ana b:ikincil c:koyu | — | kahve, mutfak, bakır |
| `ev` | Ev | nesneler | 180×180 | — | a:vurgu b:ikincil c:acik d:detay | mavi (Mavi çatı) | bina, köy |
| `fincan` | Kahve Fincanı | nesneler | 200×160 | — | a:acik b:vurgu c:koyu d:ikincil | — | kahve, fincan, tabak |
| `kagit-gemi` | Kağıt Gemi | nesneler | 220×140 | — | a:ana c:acik | kirmizi (Kırmızı), sari (Sarı), yesil (Yeşil) | deniz, klasik |
| `kalp` | Kalp | sekiller | 160×150 | — | a:ana | pembe (Pembe) | şekil, sevgi |
| `yildiz` | Yıldız | sekiller | 160×160 | — | a:ana | gumus (Gümüş) | şekil, parıltı |
| `ay` | Ay | uzay | 200×200 | — | a:ana b:ikincil d:koyu | kanli (Kanlı ay) | uydu, uzay, gece |
| `dunya` | Dünya | uzay | 200×200 | — | a:ana b:ikincil c:acik | buzul (Buzul çağı), col (Çöl gezegeni) | gezegen, uzay, yaşam |
| `jupiter` | Jüpiter | uzay | 200×200 | — | a:ana b:ikincil c:acik d:vurgu | — | gezegen, uzay, gaz devi |
| `mars` | Mars | uzay | 200×200 | — | a:ana b:ikincil c:acik | — | gezegen, uzay, kızıl |
| `merkur` | Merkür | uzay | 200×200 | — | a:ana b:ikincil d:koyu | — | gezegen, uzay, kayalık |
| `neptun` | Neptün | uzay | 200×200 | — | a:ana b:ikincil c:acik d:koyu | — | gezegen, uzay, buz devi |
| `saturn` | Satürn | uzay | 400×220 | — | a:ana b:ikincil c:acik r:detay q:detay | — | gezegen, uzay, halka |
| `uranus` | Uranüs | uzay | 200×200 | — | a:ana b:ikincil c:acik | — | gezegen, uzay, buz devi |
| `venus` | Venüs | uzay | 200×200 | — | a:ana b:ikincil c:acik | — | gezegen, uzay, sıcak |

## 2. Parçacık efektleri (9)

Sahnede: `{ "type": "particles", "particle": "<id>", "mode": "surekli" | "patlama", "start", "end" }`

| id | ad | hareket | şekil | adet | boyut | hız | rüzgâr | başta dolu |
|---|---|---|---|---|---|---|---|---|
| `kabarcik` | Kabarcıklar | yuksel | kabarcik | 50 | 22 | 120 | 0 | evet |
| `kagit-ucaklar` | Uçuşan kağıt uçaklar | dus | varlik (kagit-ucak) | 12 | 90 | 45 | 240 | evet |
| `kalp-yagmuru` | Kalp yağmuru | dus | varlik (kalp) | 30 | 70 | 200 | 0 | — |
| `kar` | Kar | dus | kar | 140 | 9 | 90 | 0 | evet |
| `konfeti` | Kağıt konfeti | dus | kagit | 120 | 20 | 260 | 0 | — |
| `yagmur` | Yağmur | dus | damla | 160 | 30 | 1300 | 0 | evet |
| `yaprak` | Sonbahar yaprakları | dus | yaprak | 45 | 34 | 140 | 0 | — |
| `yildiz-tozu` | Yıldız tozu | yerinde | pirilti | 70 | 28 | 20 | 0 | evet |
| `yildiz-yagmuru` | Yıldız yağmuru | dus | varlik (yildiz) | 40 | 44 | 170 | 0 | — |

Hareket türleri: `dus` Düşer (yukarıdan aşağı) · `yuksel` Yükselir (aşağıdan yukarı) · `yerinde` Yerinde parıldar

Şekiller: `kagit` Kağıt parçası · `kar` Kar tanesi · `damla` Yağmur damlası · `yaprak` Yaprak · `kabarcik` Kabarcık · `pirilti` Pırıltı · `varlik` Kütüphane modeli

### Ok stilleri (12)

Sahnede: `{ "type": "arrow", "arrow": "<id>", "from": "<katman id>" | [x, y], "to": …, "label", "rider": { "asset" } }` — şema §11

| id | ad | eğri | çizgi | baş / kuyruk | akış | renk |
|---|---|---|---|---|---|---|
| `ok-akis-semasi` | Akış şeması | dirsek | duz | ucgen / yuvarlak | nokta | #334155 |
| `ok-cift-cizgi` | Çift çizgi | s | cift | elmas / cizgi | — | #6d4c41 |
| `ok-cift-uclu` | Çift uçlu | duz | duz | ucgen / ucgen | — | #2a9d8f |
| `ok-dalga` | Dalgalı ok | dalga | duz | ucgen / yok | — | #8338ec |
| `ok-el-cizimi` | El çizimi ok | kavis | el | kalem / yok | — | #2d3561 |
| `ok-halka` | Halkalı ok | dongu | duz | ucgen / yok | — | #ff006e |
| `ok-kalin-golge` | Kalın gölgeli | kavis | duz | ucgen / yok | nabiz | #ffb703 → #fb8500 |
| `ok-kavis` | Kavisli ok | kavis | duz | ucgen / yok | — | #2d3561 |
| `ok-kesikli-rota` | Kesikli rota | kavis | kesik | acik / yok | kesik | #e63946 |
| `ok-neon` | Neon akış | s | duz | ucgen / yok | kuyruklu | #22d3ee → #a855f7 |
| `ok-noktali-akis` | Noktalı akış | kavis | nokta | acik / yok | kesik | #457b9d |
| `ok-serit` | Sivrilen şerit | kavis | serit | ucgen / yok | — | #f4a261 → #e76f51 |

Eğriler: `duz` Düz · `kavis` Kavisli · `s` S eğrisi · `dirsek` Dirsek (köşeli) · `dalga` Dalgalı · `dongu` Halkalı

Çizgiler: `duz` Düz çizgi · `kesik` Kesikli · `nokta` Noktalı · `cift` Çift çizgi · `serit` Sivrilen şerit · `el` El çizimi

Uçlar: `ucgen` Üçgen · `acik` Açık (V) · `kalem` Kalem (el çizimi) · `yuvarlak` Yuvarlak · `elmas` Elmas · `cizgi` Çizgi · `yok` Yok

Akış: `yok` Yok · `kesik` Akan kesikler · `nokta` Akan noktalar · `kuyruklu` Kuyruklu yıldız · `nabiz` Varışta nabız

## 3. Temalar (8)

Sahnede: `"theme": "<id>"`. Renk referansları: `"$baslik"`, `"$metin"`, `"$vurgu"`, `"$arka1"`, `"$arka2"`.

| id | ad | kağıt | baslik | metin | vurgu | arka1 → arka2 | ayar / palet |
|---|---|---|---|---|---|---|---|
| `gece` | Gece | mat | #f5e6a8 | #c9d6ea | #ffd166 | #0b132b → #3a506b | brightness -0.22, warmth -0.4, saturation 0.8 |
| `gun-isigi` | Gün Işığı | mat | #5b3a29 | #8a5a3b | #e76f51 | #ffe9cf → #f4ad86 | — |
| `kadife-gece` | Kadife Gece | kadife | #e0b1cb | #be95c4 | #f7b267 | #231942 → #5e548e | — |
| `kurumsal-mavi` | Kurumsal Mavi | mat | #0d1b2a | #415a77 | #ffb703 | #f1f4f8 → #dbe4ee | palet 6 renk (güç 1); rol: vurgu=#ffb703 |
| `neon-parlak` | Neon Parlak | parlak | #ffd23f | #f7aef8 | #3bf4fb | #1a1033 → #4a1a7a | saturation 1.4, contrast 1.12 |
| `pastel-ruya` | Pastel Rüya | pastel | #6d597a | #8e7dbe | #f28482 | #fde2e4 → #cddafd | saturation 0.85, brightness 0.04 |
| `sonbahar` | Sonbahar | kraft | #6b2d0f | #8c4a2f | #c8553d | #f6e3c5 → #e2a36f | warmth 0.35, saturation 0.9; palet 7 renk (güç 0.45) |
| `uzay` | Uzay | parlak | #ffd166 | #dfe6ff | #6c63ff | #1c2257 → #070a1f | — |

Kağıt tipleri: `mat` Mat kağıt · `parlak` Parlak kağıt · `kraft` Kraft kağıt · `pastel` Pastel kağıt · `kadife` Kadife (koyu mat)

Renk rolleri: `ana`, `ikincil`, `vurgu`, `acik`, `koyu`, `detay`

## 4. Metin stilleri (9)

Sahnede: `{ "type": "text", "textStyle": "<id>", "text": "…" }` — katmandaki alanlar stili ezer.

| id | ad | font | kalınlık | boyut | renk | özellikler |
|---|---|---|---|---|---|---|
| `alt-baslik` | Alt başlık | Nunito | 600 | 54 | $metin | — |
| `altyazi` | Altyazı (Reels) | Poppins | 700 | 58 | #ffffff | kontur |
| `baslik-kalin` | Başlık · Kalın Poster | Bebas Neue | 400 | 160 | $baslik | BÜYÜK HARF, aralık 4 |
| `baslik-modern` | Başlık · Modern | Outfit | 800 | 110 | $baslik | aralık -2 |
| `baslik-serif` | Başlık · Zarif Serif | Playfair Display | 800 | 110 | $baslik | — |
| `baslik-yuvarlak` | Başlık · Yuvarlak | Baloo 2 | 800 | 120 | $baslik | gölge |
| `cocuk-eglenceli` | Eğlenceli | Baloo 2 | 800 | 110 | #ffffff | kontur, gölge |
| `el-yazisi` | El yazısı | Caveat | 700 | 96 | $metin | — |
| `etiket-kutu` | Etiket · Kutu | Outfit | 700 | 46 | #ffffff | BÜYÜK HARF, aralık 3, kutu |

## 5. Fontlar (48)

**Türkçe'de KULLANMA:** Fredoka (eksik: ğşİĞŞ), Lilita One (eksik: ğşİĞŞ), Satisfy (eksik: ğşİĞŞ), Titan One (eksik: İ). Varsayılan: **Baloo 2**.

- **serif:** Abril Fatface (400), DM Serif Display (400), Fraunces (300/400/500/600/700/800/900), Lora (400/500/600/700), Merriweather (300/400/500/600/700/800/900), Playfair Display (400/500/600/700/800/900)
- **baslik:** Alfa Slab One (400), Anton (400), Archivo Black (400), Bebas Neue (400), Bungee (400), Oswald (300/400/500/600/700), Righteous (400), Russo One (400)
- **yuvarlak:** Baloo 2 (400/500/600/700/800), Comfortaa (300/400/500/600/700), M PLUS Rounded 1c (300/400/500/700/800/900), Mali (300/400/500/600/700), Nunito (300/400/500/600/700/800/900), Quicksand (300/400/500/600/700), Varela Round (400)
- **el-yazisi:** Caveat (400/500/600/700), Courgette (400), Dancing Script (400/500/600/700), Kalam (300/400/700), Lobster (400), Pacifico (400), Patrick Hand (400)
- **modern:** DM Sans (300/400/500/600/700/800/900), Figtree (300/400/500/600/700/800/900), Inter (300/400/500/600/700/800/900), Lexend (300/400/500/600/700/800/900), Manrope (300/400/500/600/700/800), Montserrat (300/400/500/600/700/800/900), Outfit (300/400/500/600/700/800/900), Plus Jakarta Sans (300/400/500/600/700/800), Poppins (300/400/500/600/700/800/900), Raleway (300/400/500/600/700/800/900), Rubik (300/400/500/600/700/800/900), Sora (300/400/500/600/700/800), Urbanist (300/400/500/600/700/800/900), Work Sans (300/400/500/600/700/800/900)
- **mono:** JetBrains Mono (300/400/500/600/700/800), Space Mono (400/700)

## 6. Katman animasyon ön ayarları — `anims` (26)

`"anims": [{ "preset": "<id>", "t": <başlangıç>, "dur": <süre>, ...parametreler }]`

| id | ad | kategori | varsayılan süre | parametreler |
|---|---|---|---|---|
| `katlanarak-gir` | Katlanarak gir | Giriş | 1.2 | `sira`="" |
| `cizerek-gir` | Çizerek gir | Giriş | 2.2 | — |
| `zipla-gir` | Zıplayarak gir | Giriş | 0.8 | `yay`="outBack" |
| `kayarak-gir` | Kayarak gir | Giriş | 0.9 | `yon`="alt", `mesafe`=240, `ease`="outCubic" |
| `ekrana-gir` | Ekran dışından gir | Giriş | 1.4 | `yon`="sag", `yay`=120, `ease`="outCubic" |
| `dusup-gir` | Düşerek gir | Giriş | 1.1 | `mesafe`=600 |
| `donerek-gir` | Dönerek gir | Giriş | 1 | `aci`=360, `ease`="outBack" |
| `belir` | Belir (solarak) | Giriş | 0.6 | — |
| `katlanarak-cik` | Katlanarak çık | Çıkış | 1 | `sira`="" |
| `silinerek-cik` | Silinerek çık | Çıkış | 1.2 | — |
| `kuculerek-cik` | Küçülerek çık | Çıkış | 0.6 | — |
| `kayarak-cik` | Kayarak çık | Çıkış | 0.8 | `yon`="alt", `mesafe`=240, `ease`="inCubic" |
| `ekrandan-cik` | Ekran dışına çık | Çıkış | 1.2 | `yon`="sol", `ease`="inCubic" |
| `sol` | Sol (kaybol) | Çıkış | 0.6 | — |
| `dal` | Dal (suya) | Çıkış | 1.6 | `mesafe`=260, `aci`=-18 |
| `suzul` | Süzül | Sürekli | sonsuz | `genlik`=22, `periyot`=2.4 |
| `sallan` | Sallan | Sürekli | sonsuz | `aci`=6, `periyot`=2.5 |
| `nefes` | Nefes al | Sürekli | sonsuz | `genlik`=0.02, `periyot`=3 |
| `nabiz` | Nabız | Sürekli | sonsuz | `genlik`=0.1, `periyot`=1 |
| `seksek` | Hopla | Sürekli | sonsuz | `yukseklik`=40, `periyot`=0.7 |
| `dalgada` | Dalgada sallan | Sürekli | sonsuz | `genlik`=10, `aci`=5, `periyot`=2.8 |
| `titre` | Titre | Sürekli | sonsuz | `genlik`=4 |
| `don` | Dön | Sürekli | sonsuz | `periyot`=4, `yon`="1" |
| `kanat-cirp` | Kanat çırp | Sürekli | sonsuz | `parcalar`="", `eksen`="Y", `periyot`=0.6, `alt`=-0.7 |
| `kuyruk-salla` | Kuyruk salla | Sürekli | sonsuz | `parcalar`="", `aci`=10, `periyot`=1.6 |
| `gec` | Ekranı geç | Hareket | 6 | `yon`="sag", `yay`=80, `ease`="linear" |

## 7. Metin animasyonları — `textAnims` (11)

`"textAnims": [{ "preset": "<id>", "t": <başlangıç>, "dur": <birim süresi>, "aralik": <birimler arası> }]`

| id | ad | kategori | birim | süre | aralık |
|---|---|---|---|---|---|
| `harf-katla` | Harf harf katlanarak | Giriş | harf | 0.55 | 0.05 |
| `harf-zipla` | Harf harf zıpla | Giriş | harf | 0.45 | 0.04 |
| `harf-dus` | Harf harf düş | Giriş | harf | 0.7 | 0.05 |
| `harf-don` | Harf harf dön | Giriş | harf | 0.6 | 0.05 |
| `harf-belir` | Harf harf belir | Giriş | harf | 0.4 | 0.035 |
| `kelime-zipla` | Kelime kelime zıpla | Giriş | kelime | 0.5 | 0.14 |
| `satir-kay` | Satır satır kay | Giriş | satir | 0.6 | 0.18 |
| `dalga` | Dalga | Sürekli | harf | — | 0.08 |
| `titresim` | Titreşim | Sürekli | harf | — | — |
| `harf-katla-cik` | Harf harf katlanarak çık | Çıkış | harf | 0.45 | 0.035 |
| `harf-dagil` | Harfler dağılsın | Çıkış | harf | 0.7 | 0.02 |

## 8. Geçişler — `transitions` (7)

`"transitions": [{ "type": "<id>", "t": <kesme anı>, "dur": <süre> }]` — örtü: [t−dur/2, t+dur/2], kare: [t, t+dur]

| id | ad | tür | varsayılan süre | parametreler |
|---|---|---|---|---|
| `katlama` | Kağıt yelpaze (katlanarak) | örtü | 1.2 | color, yon, kat |
| `perde` | Kağıt perde | örtü | 1.2 | color |
| `iris` | İris (daire) | örtü | 1 | color |
| `yirtik` | Yırtık kağıt | örtü | 1.2 | color, yon, seed |
| `sayfa-cevir` | Sayfa çevir | kare | 1.1 | color |
| `kaydir` | İterek kaydır | kare | 0.8 | yon |
| `yakinlas` | Yakınlaşarak geç | kare | 0.7 | — |

## 9. Easing ve çizim stilleri

Adlandırılmış eğriler: `linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, `inOutCubic`, `inOutSine`, `inBack`, `outBack`, `outElastic`, `outBounce`, `step`

Hazır Bézier eğrileri (`"ease": [x1, y1, x2, y2]`): CSS ease `[0.25, 0.1, 0.25, 1]` · CSS ease-in `[0.42, 0, 1, 1]` · CSS ease-out `[0, 0, 0.58, 1]` · CSS ease-in-out `[0.42, 0, 0.58, 1]` · Yumuşak iniş `[0.16, 1, 0.3, 1]` · Keskin başla `[0.7, 0, 0.84, 0]` · Hafif taşma `[0.34, 1.56, 0.64, 1]` · Geri çekil `[0.36, 0, 0.66, -0.56]` · Kağıt düşüşü `[0.55, 0.06, 0.68, 0.19]` · Materyal `[0.4, 0, 0.2, 1]`

Çizim stilleri (`"style"`): `origami` Origami — Katlanmış kağıt yüzeyleri, menteşe etrafında açılır · `kagit-kesme` Kağıt kesme — Renk tabakaları üst üste, derin gölge, tabaka tabaka belirir · `duz` Düz vektör — Gölgesiz, temiz renkler (minimal / infografik) · `cizim` Çizim / boya — El çizimi mürekkep kontur, pastel boya taraması; önce çizilir sonra boyanır

## 10. Ses dosyaları (9)

Müzik: `uzay-ambiyans.wav`  
Efektler (`sfx.auto` kullanır): `sfx-cin.wav`, `sfx-damla.wav`, `sfx-hisirti.wav`, `sfx-kagit-katla.wav`, `sfx-parilti.wav`, `sfx-pop.wav`, `sfx-tik.wav`, `sfx-whoosh.wav`

`uzay-ambiyans.wav`: 120 BPM, ilk vuruş 0.25 sn, 64 sn (sentez, telifsiz).

## 11. Örnek projeler (7)

- `kahve-cizim` **Türk Kahvesi (çizim)** — 1080×1080, 16 sn, 12 katman, stil cizim — üreteç: `scripts/scenes-kahve-cizim.mjs`
- `ok-vitrini` **Ok Vitrini** — 1080×1080, 17 sn, 19 katman — üreteç: `scripts/scenes-ok-vitrini.mjs`
- `okyanus` **Okyanus** — 1080×1920, 12 sn, 18 katman
- `origami-orman` **Origami Orman** — 1080×1920, 12 sn, 16 katman
- `ozellik-turu` **Özellik Turu** — 1080×1920, 38.5 sn, 42 katman, tema gun-isigi — üreteç: `scripts/scenes-ozellik-turu.mjs`
- `tasarim-vitrini` **Tasarım Vitrini — Sonbahar** — 1080×1920, 10 sn, 14 katman, tema sonbahar, stil kagit-kesme
- `telefonun-yolculugu` **Telefonun Yolculuğu (çizim)** — 1080×1920, 54.2 sn, 59 katman, stil cizim — üreteç: `scripts/scenes-telefonun-yolculugu.mjs`
