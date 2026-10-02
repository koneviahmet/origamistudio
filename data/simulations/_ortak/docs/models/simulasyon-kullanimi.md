# Simülasyonda Model Kullanımı

> **Prompt:** `@docs/models/simulasyon-kullanimi.md`

## 1. Model referans sözleşmesi

Her model `{ pack, asset, role? }` üçlüsüyle tanımlanır:

| Alan | Kaynak | Örnek |
|------|--------|-------|
| `pack` | `PACKS` in `asset-catalog.js` | `'space'`, `'school-lab'` |
| `asset` | Model dosya adı (uzantısız) | `'meteor'`, `'microscope'` |
| `role` | Simülasyon içi mantıksal ad (opsiyonel) | `'asteroid'`, `'lab-tool'` |

## 2. Yükleme

```js
import { loadSimulationModels, modelKey } from '../../../lib/simulation/loadSimulationModels.js'

const models = await loadSimulationModels(config.models, (p) => {
  loadingProgress.value = p
})

const instance = models.get(modelKey('space', 'meteor'))
const clone = instance?.clone(true)
if (clone) {
  clone.scale.setScalar(0.5)
  scene.add(clone)
}
```

## 3. Ölçek ve konumlandırma

- Kenney GLB modelleri genelde 1–2 birim yüksekliktedir; programatik GLTF paketleri (`science-city`, `school-lab`) grid hücresine (~1 birim) oturacak şekilde üretilmiştir.
- Simülasyonda `clone.scale.setScalar(n)` ile normalize edin; farklı paketleri aynı sahnede karıştırırken insan figürü (`characters/character-a` veya `space/astronautA`) referans alın.
- Yerleştirmeden önce `Box3().setFromObject(mesh)` ile sınır kutusu alıp zemine oturtun.

## 4. Hata toleransı

Model yüklenemezse simülasyonu çökertmeyin — prosedürel fallback kullanın:

```js
try {
  const models = await loadSimulationModels(config.models)
  // ...
} catch {
  const fallback = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    new THREE.MeshStandardMaterial({ color: 0x4488ff }),
  )
  scene.add(fallback)
}
```

## 5. Paket seçim rehberi

| Simülasyon türü | Önerilen paketler | Kategori dosyası |
|-----------------|-------------------|------------------|
| Güneş sistemi, uzay | `space` | [uzay-astronomi.md](./uzay-astronomi.md) |
| Basit makineler, kuvvet | `simple-machines` | [fizik-makineler.md](./fizik-makineler.md) |
| Kimya lab, periyodik tablo | `school-lab` | [kimya-madde.md](./kimya-madde.md) |
| Ekosistem, bitki | `science-city`, `nature`, `garden-farm` | [biyoloji-saglik.md](./biyoloji-saglik.md) |
| Enerji dönüşümü | `renewable-energy`, `simple-machines` | [fizik-makineler.md](./fizik-makineler.md) |
| Hareket, araç enerjisi | `cars`, `train` | [ulasim-araclar.md](./ulasim-araclar.md) |
| Arşimet, yüzdürme | `watercraft`, `simple-machines` | [deniz-su.md](./deniz-su.md) |
| Beslenme | `food`, `ultimate-food` | [tarim-gida.md](./tarim-gida.md) |

## 6. Legacy simülasyonlar

Legacy embed simülasyonlar (`/simulation/hava-direnci` vb.) kendi programatik modellerini `legacy/embed/compositions/useModel*` ile üretir; asset kataloğunu doğrudan kullanmaz. Yeni native simülasyon yazarken bu katalogdaki GLB/GLTF modelleri tercih edin.

## 7. Örnek: Güneş Sistemi

```js
// src/views/simulation/simulations/gunes-sistemi/config.js
models: [
  { pack: 'space', asset: 'meteor', role: 'asteroid' },
  { pack: 'space', asset: 'meteor_detailed', role: 'asteroid' },
  { pack: 'space', asset: 'craft_miner', role: 'satellite' },
],
```

Gezegenler prosedürel küre olarak çizilir; modeller yalnızca asteroit ve uydu için kullanılır.
