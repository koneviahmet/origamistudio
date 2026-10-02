# Simülasyon ↔ Model Eşleştirmesi

> **Prompt:** `@docs/models/simulasyon-eslestirme.md` — legacy simülasyonu native Three.js'e taşırken veya yeni sim tasarlarken model seçin.

Legacy simülasyonlar (`engine: 'legacy'`) kendi programatik modellerini kullanır. Aşağıdaki tablo, **native refactor** veya **3D sahne zenginleştirme** için asset kataloğundan önerilen modelleri listeler.

| Simülasyon slug | Tema | Önerilen modeller | Not |
| --- | --- | --- | --- |
| `gunes-sistemi` | [Uzay & Astronomi](./uzay-astronomi.md) | `space:meteor`, `space:craft_miner` | Zaten native; gezegenler prosedürel |
| `arsimet-prensibi` | [Deniz & Su](./deniz-su.md) | `watercraft:boat_speedBoat`, `garden-farm:water-pump`, `simple-machines:screw-archimedes` | Yüzdürme + su kaldırma |
| `atomun-yapisi` | [Kimya & Madde](./kimya-madde.md) | `school-lab:atom-model` | Bohr atom modeli |
| `atom-modelinin-tarihsel-gelisimi` | [Kimya & Madde](./kimya-madde.md) | `school-lab:atom-model` | Tarihsel modeller prosedürel kalabilir |
| `ay-ve-gunes-tutulmasi` | [Uzay & Astronomi](./uzay-astronomi.md) | `school-lab:globe`, `space:terrain` | Dünya referansı + zemin |
| `ayin-evreleri` | [Uzay & Astronomi](./uzay-astronomi.md) | `school-lab:telescope`, `space:terrain` | 3D ay prosedürel |
| `dinamometre-2d` | [Fizik & Basit Makineler](./fizik-makineler.md) | `simple-machines:lever-seesaw`, `cars:wheel-default` | Kuvvet ölçümü sahnesi |
| `ekosistem` | [Biyoloji & Sağlık](./biyoloji-saglik.md) | `science-city:botanical-garden`, `science-city:eco-park-gate`, `garden-farm:beehive` | Ekosistem bileşenleri |
| `elektroskop` | [Fen Bilimleri (Genel)](./fen-bilimleri.md) | `school-lab:lab-table` | Elektroskop prosedürel; masa dekor |
| `enerji-donusumleri` | [Fizik & Basit Makineler](./fizik-makineler.md) | `renewable-energy:wind-turbine`, `renewable-energy:solar-panel-single`, `simple-machines:water-wheel` | Enerji kaynakları |
| `hava-direnci` | [Ulaşım & Araçlar](./ulasim-araclar.md) | `cars:sedan`, `cars:cone` | Araç + engel |
| `katilarin-basinci` | [Fizik & Basit Makineler](./fizik-makineler.md) | `simple-machines:ramp-inclined-plane` | Basınç plakaları prosedürel |
| `maddenin-tanecikli-yapisi` | [Kimya & Madde](./kimya-madde.md) | `school-lab:beaker`, `school-lab:test-tube-rack` | Tanecik animasyonu prosedürel |
| `periyodik-tablo-2` | [Kimya & Madde](./kimya-madde.md) | `school-lab:periodic-table-board` | Periyodik tablo tahtası |
| `saf-madde-karisim` | [Kimya & Madde](./kimya-madde.md) | `school-lab:beaker`, `school-lab:erlenmeyer-flask` | Karışım görselleri |
| `dogal-secilim` | [Biyoloji & Sağlık](./biyoloji-saglik.md) | `quaternius-animals:Red_Fox`, `nature:tree_default` | Adaptasyon sahnesi |
| `besin-degerleri` | [Tarım, Bahçe & Gıda](./tarim-gida.md) | `food:apple`, `food:broccoli`, `food:bread` | Besin grupları |
| `dengeli-beslenme` | [Tarım, Bahçe & Gıda](./tarim-gida.md) | `food:apple`, `food:carrot`, `food:steak` | Gıda çeşitliliği |
| `duz-ayna-yansima-kurallari` | [Fen Bilimleri (Genel)](./fen-bilimleri.md) | `science-city:optic-mirror` | Ayna modeli |
| `isik-kirilmasi` | [Fen Bilimleri (Genel)](./fen-bilimleri.md) | `school-lab:magnifying-glass`, `school-lab:telescope` | Mercek optiği |

## Tüm legacy simülasyonlar

Tam liste: `src/data/simulations-legacy.js` — 74 simülasyon.

Legacy simülasyonu olduğu gibi bırakırken yalnızca **oyun içi panel arka planı** için modelleri şehir haritasına yerleştirebilirsiniz (`guides/oyun-ici-simulasyon.md`).

Native simülasyon yazımı: [simulasyon-kullanimi.md](./simulasyon-kullanimi.md) + [../guides/yeni-simulasyon.md](../guides/yeni-simulasyon.md)
