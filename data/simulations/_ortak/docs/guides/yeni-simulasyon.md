# Yeni Simülasyon Sayfası Oluşturma Rehberi

Bu rehber, modüler simülasyon sistemine yeni bir etkileşimli simülasyonun nasıl ekleneceğini anlatır. Oyun sayfalarından (`/games/gameN`) farklı olarak simülasyonlar Firebase haritası gerektirmez; kendi Three.js sahnesini veya mevcut oyun motorunu kullanır.

**Tasarım kalıbı ve bütünlük kuralları** için bkz. [simulasyon-tasarim-standardi.md](./simulasyon-tasarim-standardi.md) — yeni simülasyon yazarken veya legacy simülasyonları modernleştirirken birincil referans.

## Mimari Özet

```
/simulation                      → Simülasyon listesi
/simulation/gunes-sistemi        → Güneş sistemi simülasyonu
```

| Katman | Dosya / klasör | Görev |
|--------|------------------|--------|
| Kayıt defteri | `src/data/simulations.js` | `/simulation` kart listesi |
| Registry | `src/views/simulation/simulations/registry.js` | Slug → bileşen eşlemesi |
| Simülasyon config | `src/views/simulation/simulations/{slug}/config.js` | Başlık, modeller, ayarlar |
| Route giriş | `src/views/simulation/simulations/{slug}/index.vue` | İnce sarmalayıcı |
| Sahne bileşeni | `src/views/simulation/simulations/{slug}.vue` | Three.js / simülasyon mantığı |
| Ortak kabuk | `src/views/simulation/SimulationShell.vue` | Tam ekran sarmalayıcı (header/footer yok) |
| Dinamik yükleme | `src/views/simulation/SimulationPlayView.vue` | `:slug` ile lazy load |
| Three.js yaşam döngüsü | `src/composables/useSimulationScene.js` | Canvas, render döngüsü |
| Model yükleme | `src/lib/simulation/loadSimulationModels.js` | Asset kütüphanesi entegrasyonu |
| Oyun içi panel | `src/components/simulation/InGameSimulationHost.vue` | Oyunda gömülü simülasyon + karakter sütunu |
| Panel karakteri | `src/components/simulation/InGameSimulationCharacter.vue` | Solda şeffaf 3D model + puan balonu |
| Panel klavuzu | `src/components/simulation/SimulationPanelGuide.vue` | Oyun içi adım adım rehber balonu |

Oyun içinde simülasyon açmak için bkz. [oyun-ici-simulasyon.md](./oyun-ici-simulasyon.md).  
Oyun içi puan entegrasyonu için `embedded` prop ve `award({ showCharacterBubble: true })` — bkz. [puan-sistemi-kullanim.md](./puan-sistemi-kullanim.md).  
Oyun içi klavuz için `guideFocus` prop'u — aşağıdaki bölüm.

## Hızlı Başlangıç: Yeni Simülasyon (su-dongusu örneği)

### 1. Klasör yapısı oluştur

```text
src/views/simulation/simulations/
  su-dongusu.vue              ← Sahne bileşeni (Three.js mantığı)
  su-dongusu/
    config.js                 ← Yapılandırma
    index.vue                 ← SimulationShell sarmalayıcısı
```

### 2. `config.js` yaz

```js
export const suDongusuConfig = {
  slug: 'su-dongusu',
  title: 'Su Döngüsü',
  description: 'Buharlaşma, yoğunlaşma ve yağışı gözlemleyin.',
  engine: 'three', // 'three' | 'play-engine' (ileride)
  models: [
    // Model kütüphanesindeki pack/asset çiftleri
    { pack: 'nature', asset: 'tree_pine', role: 'forest' },
    { pack: 'space', asset: 'meteor', role: 'decoration' },
  ],
  defaultSpeed: 1,
  hints: ['Sürükleyerek kamerayı döndürün'],
}
```

**Model referansları:** `pack` ve `asset` değerleri `src/data/asset-catalog.js` içindeki paketlerle eşleşmelidir. Model kütüphanesinde (`/modeller`) görünen isimler metadata içindir; yükleme `pack` + `asset` ile yapılır.

### 3. Sahne bileşeni oluştur (`su-dongusu.vue`)

```vue
<script setup>
import { useSimulationScene } from '../../../composables/useSimulationScene.js'
import { loadSimulationModels } from '../../../lib/simulation/loadSimulationModels.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null }, // oyun içi panelGuide adımı
})

const { canvasRef, ready, context } = useSimulationScene({
  onInit({ scene, camera }) {
    camera.position.set(0, 5, 12)
    // Sahneyi kurun…
  },
  onFrame({ delta, elapsed }) {
    // Animasyon…
  },
})

// ready olduğunda modelleri yükleyin
watch(ready, async (isReady) => {
  if (!isReady) return
  await loadSimulationModels(props.config.models ?? [])
}, { immediate: true })
</script>

<template>
  <canvas ref="canvasRef" class="w-full h-full" />
</template>
```

### 4. `index.vue` sarmalayıcısı

```vue
<script setup>
import SimulationShell from '../../SimulationShell.vue'
import SuDongusuScene from '../su-dongusu.vue'
import { suDongusuConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <SuDongusuScene :config="suDongusuConfig" />
  </SimulationShell>
</template>
```

### 5. Registry'ye ekle

`src/views/simulation/simulations/registry.js`:

```js
import { suDongusuConfig } from './su-dongusu/config.js'

export const SIMULATION_REGISTRY = [
  // mevcut kayıtlar…
  {
    slug: suDongusuConfig.slug,
    config: suDongusuConfig,
    loadPage: () => import('./su-dongusu/index.vue'),
    loadScene: () => import('./su-dongusu.vue'),
  },
]
```

### 6. Liste kaydına ekle

`src/data/simulations.js`:

```js
{
  slug: 'su-dongusu',
  route: '/simulation/su-dongusu',
  title: 'Su Döngüsü',
  subtitle: 'Buharlaşma ve yağış',
  description: 'Su döngüsünü interaktif olarak izleyin.',
  accent: '#38bdf8',
  engine: 'three',
  available: true,
},
```

Router'a **ayrıca rota eklemenize gerek yok** — `/simulation/:slug` dinamik rotası registry'den yükler.

### 7. Test

```bash
npm run dev
```

- `http://localhost:5173/simulation` → kart listesi
- `http://localhost:5173/simulation/su-dongusu` → simülasyon

---

## Motor Seçimi

| Motor | Ne zaman? | Nasıl? |
|-------|-----------|--------|
| **Three.js** (`useSimulationScene`) | 2D/3D bilim simülasyonları, bağımsız sahneler | `src/composables/useSimulationScene.js` |
| **Oyun motoru** (`usePlayEngine`) | Firebase haritası üzerinde gezinti + etkileşim | `GamePlayShell` + `PlayScene` (oyun sayfaları gibi) |

Çoğu yeni simülasyon için `useSimulationScene` yeterlidir. Projede zaten `three` bağımlılığı vardır.

---

## Model Kütüphanesi Kullanımı

Simülasyonlarda 3D modeller `src/lib/three/assetRegistry.js` üzerinden yüklenir — oyun düzenleyicisiyle aynı pipeline.

```js
import { loadSimulationModels, modelKey } from '../../../lib/simulation/loadSimulationModels.js'

const models = await loadSimulationModels(config.models)
const meteor = models.get(modelKey('space', 'meteor'))
const instance = meteor.clone(true)
scene.add(instance)
```

### Yeni model paketi gerekiyorsa

1. GLB dosyalarını `public/assets/{paket-adı}/` altına kopyalayın
2. `src/data/asset-catalog.js` içine paket tanımı ekleyin
3. İlgili kategori dosyasını oluşturun (ör. `src/data/myPackCategories.js`)
4. `config.models` dizisinde `{ pack, asset }` kullanın

Detay için mevcut asset dokümanlarına bakın: `docs/assets/`.

---

## Güneş Sistemi Referansı

| Özellik | Değer |
|---------|-------|
| URL | `/simulation/gunes-sistemi` |
| Oyun içi | `kum zemin` yolu → `hover-simulation` paneli |
| Config | `src/views/simulation/simulations/gunes-sistemi/config.js` |
| Sahne | `src/views/simulation/simulations/gunes-sistemi.vue` |
| Modlar | Tam sayfa (`SimulationShell`) veya `embedded: true` (oyun paneli) |
| Puan | Güneş tıklaması → +2 (`showCharacterBubble: true`) |
| Klavuz `focus` | `welcome`, `camera`, `planet`, `speed`, `sun` |
| Modeller | `space/meteor`, `space/meteor_detailed`, `space/craft_miner` |
| Gezegenler | Three.js `SphereGeometry` (prosedürel) |
| Asteroit kuşağı | Model kütüphanesinden klonlanan meteor modelleri |

---

## Oyun içi klavuz (`guideFocus`)

Oyun `config.js` içindeki `panelGuide.steps[].focus` değerleri, gömülü modda sahne bileşenine `guide-focus` prop'u olarak iletilir. Simülasyonunuz bu prop ile ilgili kontrolleri vurgulayabilir.

```vue
<script setup>
defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
})
</script>

<template>
  <canvas
    :class="{ 'my-scene__target--pulse': guideFocus === 'camera' }"
  />
  <aside :class="{ 'my-scene__target--pulse': guideFocus === 'speed' }">
    <!-- kontrol paneli -->
  </aside>
</template>
```

`gunes-sistemi.vue` referans implementasyondur. Kendi simülasyonunuz için desteklediğiniz `focus` değerlerini oyun `panelGuide` config'inde ve [oyun-ici-simulasyon.md](./oyun-ici-simulasyon.md) tablosunda belgeleyin.

---

## Dosya Kontrol Listesi

Yeni simülasyon eklerken:

- [ ] Sahne bileşeni `embedded` prop'unu destekliyor (oyun içi kullanım için)
- [ ] Oyun içi klavuz kullanılacaksa `guideFocus` prop'u ile vurgu desteği
- [ ] `src/views/simulation/simulations/{slug}.vue` — sahne bileşeni
- [ ] `src/views/simulation/simulations/{slug}/config.js` — yapılandırma
- [ ] `src/views/simulation/simulations/{slug}/index.vue` — `SimulationShell` sarmalayıcısı
- [ ] `src/views/simulation/simulations/registry.js` — registry kaydı
- [ ] `src/data/simulations.js` — liste kartı (`available: true`)
- [ ] `npm run dev` → `/simulation/{slug}` test

---

## Sorun Giderme

### Simülasyon bulunamadı

- `registry.js` içinde `slug` değerinin `simulations.js` ile aynı olduğunu doğrulayın
- `loadPage` / `loadScene` yollarının doğru olduğunu kontrol edin

### Modeller yüklenmiyor

- `pack` / `asset` çiftinin `asset-catalog.js` içinde tanımlı olduğundan emin olun
- Tarayıcı konsolunda 404 hatası varsa `public/assets/` altında GLB dosyasını kontrol edin

### Canvas boş kalıyor

- `useSimulationScene` içinde `onInit` çağrıldığından emin olun
- Canvas'ın parent elementinin yüksekliği (`height: 100%`) tanımlı olmalıdır

---

## İlgili Dokümanlar

- [oyun-ici-simulasyon.md](./oyun-ici-simulasyon.md) — Simülasyonu oyun içinde açma
- [puan-sistemi-kullanim.md](./puan-sistemi-kullanim.md) — Gömülü simülasyonda puan
- [yeni-oyun-sayfasi.md](./yeni-oyun-sayfasi.md) — Firebase tabanlı oynanış sayfaları
- [kenney-space-kit.md](../assets/kenney-space-kit.md) — Space paketi modelleri
