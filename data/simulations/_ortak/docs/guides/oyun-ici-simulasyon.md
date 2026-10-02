# Oyun İçi Simülasyon Sistemi

Bu rehber, `/simulation/:slug` sayfalarında çalışan simülasyonların **oyun içinde** (ör. `/games/game1`) bir panel olarak nasıl açılacağını anlatır.

## Mimari Özet

```
/games/game1  (oyun canvas)
    │
    ├─ usePlayEngine
    │     └─ createInGameSimulationController()
    │
    ├─ usePlacementInteractions
    │     └─ type: hover-simulation  →  panel aç
    │
    └─ InGameSimulationHost  (Teleport → body)
          ├─ InGameSimulationCharacter  (sol — şeffaf 3D model)
          ├─ SimulationPanelGuide  (model konuşma balonu — adım adım klavuz)
          └─ gunes-sistemi.vue  (embedded, loadScene, guideFocus)
```

| Katman | Dosya | Görev |
|--------|--------|--------|
| Kontrolör | `src/composables/useInGameSimulation.js` | Aç/kapa, lazy load, dismiss mantığı |
| Overlay UI | `src/components/simulation/InGameSimulationHost.vue` | Modal düzeni (panel + karakter + klavuz) |
| Panel klavuzu | `src/components/simulation/SimulationPanelGuide.vue` | Adım adım konuşma balonu (İleri / Geri / Atla) |
| Klavuz durumu | `src/composables/useSimulationPanelGuide.js` | `panelGuide` adımlarını yönetir |
| Panel karakteri | `src/components/simulation/InGameSimulationCharacter.vue` | Solda şeffaf 3D model + puan balonu |
| Model çözümleyici | `src/lib/simulation/resolvePanelModel.js` | `panelModel` → karakter / asset |
| 3D önizleme | `src/composables/useSimulationPanelCharacter.js` | Karakter canvas render |
| Etkileşim | `src/composables/usePlacementInteractions.js` | `hover-simulation` türü |
| Oyun motoru | `src/composables/usePlayEngine.js` | Kontrolör + giriş kilidi |
| Sahne | `src/views/simulation/simulations/registry.js` | `loadPage` + `loadScene` |
| Oyun config | `src/views/games/gameN/config.js` | Hangi yol → hangi simülasyon + `panelModel` |

## Nasıl Çalışır?

1. Oyuncu veya fare, `config.interactions` içinde tanımlı bir yerleştirmenin üzerine gelir (ör. `kum zemin` yolu).
2. `hover-simulation` etkileşimi tetiklenir → `InGameSimulationHost` açılır.
3. Simülasyon sahnesi (`loadScene`) lazy yüklenir; `embedded` prop ile çalışır.
4. **Solda** `panelModel` ile tanımlı 3D model (şeffaf arka plan); **sağda** simülasyon canvas'ı.
5. Açılış animasyonu bittikten sonra `panelGuide` tanımlıysa model **adım adım klavuz** balonu ile simülasyonu anlatır; ilgili UI öğeleri `focus` ile vurgulanır.
6. Panel açıkken oyun hareketi ve kamera girişi durur; simülasyon tam etkileşimlidir.
7. Simülasyon içinde puan kazanılırsa (`showCharacterBubble: true`) metin karakterin kafasında balon olarak görünür; ayrıca `ScoreGainToast` oyun HUD'unda çıkar.
8. Kullanıcı **Esc**, **×** (sağ üst) veya dışarı tıklayarak kapatır. Kapatıp aynı yerde kalırsa panel tekrar açılmaz; yerleştirmeden ayrılıp geri gelince yeniden açılır (klavuz da yeniden başlar).

## Panel Düzeni

Modal **header ve footer içermez** — yalnızca simülasyon alanı ve sağdaki model.

```
┌─────────────────────────────────────────────────────────┐
│  [bulanık oyun arka planı — backdrop]                    │
│  ┌────────┐  ┌──────────────────────────────────────┐   │
│  │ Klavuz │  │  Simülasyon (Three.js)               │   │
│  │ balonu │  │  gunes-sistemi.vue                   │   │
│  ├────────┤  └──────────────────────────────────────┘   │
│  │ Model  │                                              │
│  │ (3D)   │                                              │
│  └────────┘                                              │
└─────────────────────────────────────────────────────────┘
```

- Simülasyon paneli `flex: 1` ile mümkün olan en geniş alanı kaplar.
- Karakter sütunu dar tutulur (~168px); model küçük ölçekte, alta hizalı.
- Klavuz balonu karakterin üstünde görünür; mobilde simülasyon kartının altına yerleşir.
- Karakter canvas'ı tam şeffaftır; yalnızca model görünür.
- Mobilde (`<640px`) karakter sütunu gizlenir; simülasyon tam genişlik alır.

## Game1 Örneği: Kum Zemin → Güneş Sistemi

`src/views/games/game1/config.js`:

```js
interactions: [
  {
    id: 'kum-zemin-simulation',
    type: 'hover-simulation',
    match: {
      layer: 'roads',
      name: 'kum zemin',
    },
    simulationSlug: 'gunes-sistemi',
    hint: 'Kum zemin — Güneş Sistemi simülasyonu açıldı',
    panelModel: { source: 'player' },
    panelGuide: {
      steps: [
        { title: 'Hoş geldin', text: '…', focus: 'welcome' },
        { text: 'Kamerayı sürükleyerek döndür…', focus: 'camera' },
        { text: 'Gezegene tıkla…', focus: 'planet' },
        { text: 'Hız kaydırıcısı…', focus: 'speed' },
        { text: 'Güneşe tıkla…', focus: 'sun' },
      ],
    },
  },
  {
    id: 'beton-zemin-score',
    type: 'enter-score',
    match: { layer: 'roads', name: 'beton zemin' },
    points: 1,
    scoreLabel: 'Beton zemin — +1 puan',
    scoreRepeat: false,
  },
]
```

`panelTitle` / `panelSubtitle` isteğe bağlıdır (erişilebilirlik ve controller metadata); UI'da gösterilmez.

Test: `http://localhost:5173/games/game1` → haritada **kum zemin** yolunun üzerine gelin veya karakterle üzerine basın.

**Önemli:** `match.name`, düzenleyicide yol için verdiğiniz ad ile birebir aynı olmalıdır (büyük/küçük harf duyarsız).

`panelGuide` isteğe bağlıdır; tanımlanırsa açılış animasyonu bittikten sonra klavuz başlar. Bkz. [Panel klavuzu](#panel-klavuzu-panelguide).

---

## Panel klavuzu (`panelGuide`)

Seçilen model, simülasyon açıldıktan ve giriş animasyonu tamamlandıktan sonra oyuncuya adım adım rehberlik eder.

### Config yapısı

```js
panelGuide: {
  skippable: true, // varsayılan: true — "Atla" düğmesi
  steps: [
    {
      title: 'İsteğe bağlı başlık',
      text: 'Karakterin söylediği açıklama metni.',
      focus: 'camera', // simülasyonda vurgulanacak öğe (isteğe bağlı)
    },
  ],
},
```

Kısa yazım: yalnızca adım dizisi de verilebilir:

```js
panelGuide: [
  { text: 'İlk adım…' },
  { text: 'İkinci adım…' },
],
```

### Akış

1. Balon + simülasyon reveal animasyonu biter (`contentReady`).
2. `useSimulationPanelGuide` ilk adımı gösterir.
3. Oyuncu **İleri** / **Geri** ile adımlar arasında gezer; **Atla** veya son adımda **Başla** klavuzu kapatır.
4. Panel kapanıp aynı yerleştirmede yeniden açılırsa klavuz baştan başlar.

### `focus` — simülasyonda vurgu

Her adımın `focus` değeri, gömülü sahne bileşenine `guide-focus` prop'u olarak iletilir. Simülasyon, ilgili kontrolü veya alanı görsel olarak vurgular.

Güneş sistemi (`gunes-sistemi.vue`) desteklenen değerler:

| `focus` | Vurgulanan alan |
|---------|-----------------|
| `welcome` | Simülasyon canvas'ı (genel tanıtım) |
| `camera` | Canvas (sürükle / tekerlek) |
| `planet` | Canvas (gezegen tıklama) |
| `speed` | Hız kaydırıcı paneli |
| `sun` | Canvas (güneş tıklama / puan) |

Yeni simülasyon eklerken `guideFocus` prop'unu destekleyin — bkz. [yeni-simulasyon.md](./yeni-simulasyon.md).

### Dosyalar

| Dosya | Görev |
|-------|--------|
| `src/composables/useSimulationPanelGuide.js` | Adım indeksi, ileri/geri/atla |
| `src/components/simulation/SimulationPanelGuide.vue` | Konuşma balonu UI |
| `InGameSimulationHost.vue` | Klavuzu reveal sonrası başlatır, `guide-focus` iletir |

---

## Yeni Oyun Etkileşimi Ekleme

### 1. Simülasyonun registry'de olduğundan emin olun

`src/views/simulation/simulations/registry.js` içinde `loadScene` tanımlı olmalı:

```js
{
  slug: mySimConfig.slug,
  config: mySimConfig,
  loadPage: () => import('./my-sim/index.vue'),
  loadScene: () => import('./my-sim.vue'),
}
```

### 2. Oyun `config.js` dosyasına etkileşim ekleyin

```js
interactions: [
  {
    id: 'benzersiz-id',
    type: 'hover-simulation',
    match: {
      layer: 'roads',       // roads | buildings | props | terrain
      name: 'yerleştirme adı',
      // alternatif: id: 'r-012', pack: '...', asset: '...'
    },
    simulationSlug: 'gunes-sistemi',
    hint: 'HUD ipucu metni',
    panelModel: { source: 'player' },
  },
],
```

### 3. Sahne bileşeninde `embedded` desteği (önerilir)

```vue
<script setup>
defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
})
</script>
```

Gömülü modda:
- Kontrol panelini küçültün (`embedded` CSS sınıfı).
- Puan verirken `showCharacterBubble: true` kullanın (kafa balonu için).

```js
// embedded iken puan + kafa balonu
award({
  points: 2,
  ruleId: 'gunes-sistemi-sun-click',
  label: 'Güneş tıklaması — +2 puan',
  showCharacterBubble: true,
})
```

---

## `hover-simulation` Alanları

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `type` | Evet | `'hover-simulation'` |
| `match` | Evet | Yerleştirme eşleştirme kuralları |
| `simulationSlug` | Evet | Registry'deki simülasyon slug'ı |
| `hint` | Hayır | Üst HUD ipucu |
| `panelModel` | Hayır | Solda gösterilecek 3D model (bkz. aşağı) |
| `panelGuide` | Hayır | Adım adım klavuz (`steps`, `skippable`) — bkz. [Panel klavuzu](#panel-klavuzu-panelguide) |
| `panelTitle` | Hayır | Metadata / erişilebilirlik (UI'da gösterilmez) |
| `panelSubtitle` | Hayır | Metadata (UI'da gösterilmez) |
| `approachRadius` | Hayır | Dekor/bina için yakınlık yarıçapı (varsayılan `3.2`). Yol katmanında hâlâ tam hücre üzerinde durma geçerlidir |

### Çok hücreli dekorlar (güneş çiftliği vb.)

Haritada aynı modelden birden fazla ızgara hücresi varsa yalnızca köşe hücresine özel isim verilmiş olabilir. Oyun içi tetikleme için `match.name` yerine `match.asset` (ve gerekirse `match.pack`) kullanın; oyuncu herhangi bir parçanın yanına gelince simülasyon açılır:

```js
{
  id: 'gunespaneli-simulasyon',
  type: 'hover-simulation',
  match: { layer: 'props', pack: 'renewable-energy', asset: 'solar-farm' },
  approachRadius: 4,
  simulationSlug: 'gunes-sistemi',
}
```

### `panelModel` — soldaki karakter / model

Çözümleme: `src/lib/simulation/resolvePanelModel.js`

```js
// O anki oyuncu karakteri (Game1 varsayılanı)
panelModel: { source: 'player' }

// Sabit karakter
panelModel: { source: 'character', characterId: 'character-b' }

// Model kütüphanesi asset'i
panelModel: { source: 'asset', pack: 'space', asset: 'astronautA', scale: 0.35 }
```

`panelModel` verilmezse `source: 'player'` kabul edilir.

### Puan balonu (kafa üstü)

Simülasyon içinde puan kazanıldığında:

```js
award({
  points: 2,
  ruleId: 'my-rule',
  label: 'Güneş tıklaması — +2 puan',  // balon metni
  showCharacterBubble: true,
})
```

`InGameSimulationCharacter` `gainQueue` içindeki `showCharacterBubble` kayıtlarını dinler ve metni modelin kafasında gösterir.

`match` alanları için bkz. [yeni-oyun-sayfasi.md](./yeni-oyun-sayfasi.md#match-alanları).

---

## Tam Sayfa vs Oyun İçi

| Özellik | `/simulation/:slug` | Oyun içi panel |
|---------|---------------------|----------------|
| Yükleme | `loadPage` (SimulationShell + sahne) | `loadScene` (yalnızca sahne) |
| Kabuk | Tam ekran, header/footer yok | Modal: simülasyon + sağda model |
| Karakter | — | `panelModel` ile sağ sütun |
| Oyun | — | Arka planda görünür, giriş kilitli |
| Prop | — | `embedded: true` |
| Puan balonu | — | `showCharacterBubble` → kafa üstü |

Aynı `gunes-sistemi.vue` her iki bağlamda da kullanılır.

---

## Dosya Kontrol Listesi

Oyun içi simülasyon bağlamak için:

- [ ] Simülasyon `registry.js` içinde `loadScene` ile kayıtlı
- [ ] Sahne bileşeni `embedded` prop'unu destekliyor
- [ ] Oyun `config.js` → `hover-simulation` + isteğe bağlı `panelModel` + `panelGuide`
- [ ] Düzenleyicide yerleştirme adı `match.name` ile uyumlu
- [ ] `npm run dev` → oyunu aç → yerleştirme üzerine gel → panel + model + simülasyon test

---

## Sorun Giderme

### Panel açılmıyor

- `simulationSlug` registry'deki slug ile aynı mı?
- Yerleştirme adı düzenleyicide tam olarak `kum zemin` mi?
- `match.layer` doğru katman mı? (yol = `roads`)

### Model sağda görünmüyor

- `panelModel` tanımlı mı? (`source: 'player'` yeterli)
- Karakter ID'si geçerli mi? (`character-a` … `character-r`)
- Asset kullanıyorsanız `pack` / `asset` `asset-catalog.js` ile uyumlu mu?
- Mobil ekranda (`<640px`) model bilinçli olarak gizlenir
- Konsolda GLB yükleme hatası var mı?

### Model arka planı görünüyor

- Karakter canvas'ı şeffaf olmalıdır (`alpha: true`, `setClearAlpha(0)`).
- `.sim-panel-char` üzerinde `background` olmamalıdır.

### Panel hemen kapanıyor

- Güncel sürümde panel yalnızca Esc / × / dışarı tık ile kapanır; fare paneline geçince kapanmamalı.

### Simülasyon etkileşimi çalışmıyor

- Panel açıkken oyun canvas'ı `pointer-events: none` olur; etkileşim panel içindeki canvas'ta olmalıdır.

### Simülasyon yüklenmiyor

- Registry'de `loadScene` export edilmiş mi?
- Konsolda asset 404 hatası var mı? → bkz. [yeni-simulasyon.md](./yeni-simulasyon.md)

---

## Simülasyon fotoğraf albümü

Oyuncu simülasyon paneli içinde fotoğraf çekiyorsa, görselleri **NPC diyalogunda** göstermek için ortak albümü kullanın. Panel kapanınca blob kaybolmaz.

### Akış

```
Simülasyon sahnesi (ör. gunes-yapisi.vue)
    │  canvas.toBlob → object URL
    │  addSimulationPhoto('gunes-yapisi', { id, blob, url })
    ▼
simulationPhotoAlbum  (oturum belleği)
    ▼
Diyalog düğümü: imageFrom: { simulation: 'gunes-yapisi', pick: 'latest' }
    ▼
resolveDialogueNodeMedia → DialogueNodeView
```

### Simülasyon tarafı (kayıt)

```js
import {
  addSimulationPhoto,
  clearSimulationPhotos,
  getSimulationPhotos,
  removeSimulationPhoto,
} from '../../../lib/play/simulationPhotoAlbum.js'

const SIM_PHOTO_KEY = 'gunes-yapisi' // diyalog imageFrom.simulation ile aynı

// Açılışta galeriyi geri yükle
const photos = ref([...getSimulationPhotos(SIM_PHOTO_KEY)])

async function takePhoto() {
  const blob = await canvasToBlob(canvasRef.value)
  const url = URL.createObjectURL(blob)
  const photo = { id: `shot-${Date.now()}`, blob, url, takenAt: Date.now() }

  addSimulationPhoto(SIM_PHOTO_KEY, photo, { max: 8 })
  photos.value = [...getSimulationPhotos(SIM_PHOTO_KEY)]

  emit('simulation-event', { type: 'photo-capture', count: photos.value.length })
}

function removePhoto(id) {
  removeSimulationPhoto(SIM_PHOTO_KEY, id)
  photos.value = [...getSimulationPhotos(SIM_PHOTO_KEY)]
}

function clearPhotos() {
  clearSimulationPhotos(SIM_PHOTO_KEY)
  photos.value = []
}
```

| Kural | Açıklama |
|-------|----------|
| Object URL sahipliği | Albüme eklendikten sonra `onUnmounted` içinde **revoke etmeyin** — albüm yönetir |
| Anahtar | `SIM_PHOTO_KEY` = registry `slug` (veya görev özel anahtarı); diyalog `imageFrom.simulation` ile birebir aynı |
| `preserveDrawingBuffer` | Canvas okumak için `useSimulationScene({ preserveDrawingBuffer: true })` gerekli |
| Event | İsteğe bağlı `photo-capture` → görev tetikleyicisi (`simulation-event`) |

Referans uygulama: `src/views/simulation/simulations/gunes-yapisi.vue`.

### Diyalog tarafı (gösterme)

```js
imageFrom: { simulation: 'gunes-yapisi', pick: 'all' }     // şerit
imageFrom: { simulation: 'gunes-yapisi', pick: 'latest' }  // son kare
```

Ayrıntılı alanlar ve örnek: [diyalog-sistemi.md — Simülasyon fotoğrafları](../dialog/diyalog-sistemi.md#simülasyon-fotoğrafları-imagefrom).

### API özeti

| Fonksiyon | Dosya | İş |
|-----------|--------|-----|
| `addSimulationPhoto(slug, photo, { max })` | `simulationPhotoAlbum.js` | Ekle; max aşılırsa eskiyi revoke eder |
| `removeSimulationPhoto(slug, id)` | aynı | Tekil sil + revoke |
| `clearSimulationPhotos(slug)` | aynı | Hepsini sil |
| `getSimulationPhotos(slug)` | aynı | Liste (readonly kopya değil, store dizisi) |
| `resolveDialogueNodeMedia(node)` | `resolveDialogueNodeMedia.js` | `imageFrom` → `image` / `images` |

---

## İlgili Dokümanlar

- [diyalog-sistemi.md](../dialog/diyalog-sistemi.md) — NPC diyalog paneli; `imageFrom` ile simülasyon fotoğrafı
- [fotograf-cekme.md](./fotograf-cekme.md) — Oyun dünyası kamerası (ayrı albüm; karıştırmayın)
- [yeni-simulasyon.md](./yeni-simulasyon.md) — Yeni simülasyon oluşturma
- [yeni-oyun-sayfasi.md](./yeni-oyun-sayfasi.md) — Oyun sayfası ve etkileşimler
- [puan-sistemi-kullanim.md](./puan-sistemi-kullanim.md) — Puan ve `showCharacterBubble`
