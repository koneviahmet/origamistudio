# Simülasyon Tasarım Standardı — Modern & Oyun İçi Uyumlu

Bu belge, `/simulation/:slug` sayfalarında çalışan simülasyonların **hem bağımsız tam sayfa deneyimi** hem de **oyun içi panel** (`/games/:grade/gameN`) olarak sorunsuz kullanılabilmesi için gereken tasarım, mimari ve teknik standartları tanımlar.

**Referans implementasyon:** Güneş Sistemi  
- Tam sayfa: `http://localhost:5173/simulation/gunes-sistemi`  
- Oyun içi: `http://localhost:5173/games/5/game1` → haritada **kum zemin** yoluna gelince açılır

Bu dosyayı yeni simülasyon yazarken veya legacy simülasyonları modern kalıba taşırken **tek kaynak** olarak kullanın.

---

## İçindekiler

1. [Temel ilke: çift modlu simülasyon](#1-temel-ilke-çift-modlu-simülasyon)
2. [Mimari sözleşme](#2-mimari-sözleşme)
3. [Dosya yapısı ve kayıt](#3-dosya-yapısı-ve-kayıt)
4. [Görsel tasarım sistemi](#4-görsel-tasarım-sistemi)
5. [Sayfa düzeni ve kullanım akışı](#5-sayfa-düzeni-ve-kullanım-akışı)
6. [Bileşen sözleşmesi (props & events)](#6-bileşen-sözleşmesi-props--events)
7. [3D simülasyon standartları](#7-3d-simülasyon-standartları)
8. [2D simülasyon standartları](#8-2d-simülasyon-standartları)
9. [Oyun içi panel entegrasyonu](#9-oyun-içi-panel-entegrasyonu)
10. [Klavuz, diyalog ve quiz entegrasyonu](#10-klavuz-diyalog-ve-quiz-entegrasyonu)
11. [Puan ve görev entegrasyonu](#11-puan-ve-görev-entegrasyonu)
12. [Performans bütçesi](#12-performans-bütçesi)
13. [Erişilebilirlik ve mobil](#13-erişilebilirlik-ve-mobil)
14. [Durum yönetimi: yükleme, hata, boş](#14-durum-yönetimi-yükleme-hata-boş)
15. [Legacy simülasyonları modernleştirme](#15-legacy-simülasyonları-modernleştirme)
16. [Kalite kontrol listeleri](#16-kalite-kontrol-listeleri)
17. [Anti-kalıplar (yapılmaması gerekenler)](#17-anti-kalıplar-yapılmaması-gerekenler)
18. [Dosya haritası](#18-dosya-haritası)
19. [İlgili dokümanlar](#19-i̇lgili-dokümanlar)

---

## 1. Temel ilke: çift modlu simülasyon

Her modern simülasyon **aynı sahne bileşenini** iki bağlamda çalıştırır:

| Bağlam | Rota / tetikleyici | Yükleme | Kabuk |
|--------|-------------------|---------|-------|
| **Tam sayfa** | `/simulation/:slug` | `loadPage` → `SimulationShell` + sahne | Tam ekran, header/footer yok |
| **Oyun içi** | `hover-simulation` etkileşimi | `loadScene` → yalnızca sahne | `InGameSimulationHost` modal |

```
                    ┌─────────────────────────────────┐
                    │  {slug}.vue  (sahne bileşeni)   │
                    │  embedded=false │ embedded=true │
                    └────────┬───────────────┬────────┘
                             │               │
              SimulationShell│               │InGameSimulationHost
              (tam sayfa)    │               │(modal + karakter + klavuz)
                             │               │
                    /simulation/gunes-sistemi │ /games/5/game1
```

**Altın kural:** Sahne bileşeni (`{slug}.vue`) hiçbir zaman oyun motoruna (`usePlayEngine`) doğrudan bağımlı olmamalıdır. Oyun ile iletişim yalnızca **prop'lar** (girdi) ve **`simulation-event` emit** (çıktı) üzerinden yapılır.

---

## 2. Mimari sözleşme

### Katman tablosu

| Katman | Dosya | Sorumluluk |
|--------|-------|------------|
| Liste kartı | `src/data/simulations.js` | `/simulation` grid'inde görünen meta |
| Registry | `src/views/simulation/simulations/registry.js` | Slug → lazy load eşlemesi |
| Config | `src/views/simulation/simulations/{slug}/config.js` | Başlık, motor, modeller, ipuçları |
| Route giriş | `src/views/simulation/simulations/{slug}/index.vue` | `SimulationShell` sarmalayıcı |
| **Sahne** | `src/views/simulation/simulations/{slug}.vue` | Simülasyon mantığı + UI |
| Three.js yaşam döngüsü | `src/composables/useSimulationScene.js` | Canvas, render döngüsü, dispose |
| Model yükleme | `src/lib/simulation/loadSimulationModels.js` | Asset kütüphanesi |
| Oyun paneli | `src/components/simulation/InGameSimulationHost.vue` | Modal kabuk |
| Oyun kontrolörü | `src/composables/useInGameSimulation.js` | Aç/kapa, lazy load |

### Motor seçimi

| `config.engine` | Ne zaman? | Teknoloji |
|-----------------|-----------|-----------|
| `'three'` | Uzay, anatomi, molekül, 3D fen modelleri | `useSimulationScene` + Three.js |
| `'canvas2d'` | Grafik, diyagram, basit animasyon | HTML `<canvas>` 2D context veya SVG |
| `'matter'` | Fizik deneyleri (sürtünme, kaldıraç, yoğunluk) | Matter.js + canvas |
| `'hybrid'` | 3D sahne + 2D kontrol paneli | Three.js + Vue panel (Güneş Sistemi modeli) |
| `'dom'` | Tablo, form, sürükle-bırak kartları | Vue + CSS (Periyodik tablo vb.) |

Legacy simülasyonlar `src/views/simulation/legacy/` altında kalır; yeni veya modernleştirilmiş simülasyonlar **mutlaka** `src/views/simulation/simulations/` altına taşınır.

---

## 3. Dosya yapısı ve kayıt

### Zorunlu klasör yapısı

```text
src/views/simulation/simulations/
  {slug}.vue                    ← Sahne bileşeni (asıl simülasyon)
  {slug}/
    config.js                   ← Yapılandırma
    index.vue                   ← SimulationShell sarmalayıcı
```

İsteğe bağlı alt modüller (büyük simülasyonlar için):

```text
  {slug}/
    components/                 ← Alt Vue bileşenleri
    composables/                ← useMySimPhysics.js vb.
    constants.js                ← Sabitler, renk paleti
```

### `config.js` şeması

```js
export const mySimConfig = {
  slug: 'benzersiz-slug',           // Zorunlu — URL parçası
  title: 'Simülasyon Başlığı',      // Zorunlu
  description: 'Kısa açıklama.',    // Zorunlu — liste kartı
  engine: 'three',                  // Zorunlu — 'three' | 'canvas2d' | 'matter' | 'hybrid' | 'dom'
  category: 'astronomi',            // Önerilen — filtreleme için
  models: [                         // 3D ise — asset-catalog referansları
    { pack: 'space', asset: 'meteor', role: 'decoration' },
  ],
  defaultSpeed: 1,                  // Animasyonlu simülasyonlarda
  hints: [                          // Tam sayfa modunda gösterilir
    'Sürükleyerek kamerayı döndürün',
    'Gezegenlere tıklayarak seçin',
  ],
  /** Oyun içi klavuz / diyalog için desteklenen focus anahtarları */
  guideFocusKeys: ['welcome', 'camera', 'speed'],
  /** simulation-event türleri — diyalog motoru ile uyum */
  eventTypes: ['planet-select', 'sun-click', 'speed-change'],
}
```

### Registry kaydı

```js
{
  slug: mySimConfig.slug,
  config: mySimConfig,
  loadPage: () => import('./my-sim/index.vue'),
  loadScene: () => import('./my-sim.vue'),   // Oyun içi için ZORUNLU
}
```

`loadScene` tanımlı değilse simülasyon oyun içinde **açılamaz**.

---

## 4. Görsel tasarım sistemi

Tüm simülasyonlarda **görsel bütünlük** için aşağıdaki token'ları kullanın. Güneş Sistemi ve `InGameSimulationHost` bu paleti referans alır.

### Renk paleti

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--sim-bg-deep` | `#050814` | Tam sayfa arka plan, canvas dışı alan |
| `--sim-bg-scene` | `#02040a` | Three.js `setClearColor`, uzay/karanlık sahneler |
| `--sim-panel-bg` | `rgba(15, 23, 42, 0.88)` | Kontrol paneli (tam sayfa) |
| `--sim-panel-bg-embedded` | `rgba(8, 12, 22, 0.88)` | Gömülü mod panel |
| `--sim-border` | `rgba(148, 163, 184, 0.2)` | Panel kenarlığı |
| `--sim-border-accent` | `rgba(56, 189, 248, 0.28)` | Gömülü mod vurgu kenarlığı |
| `--sim-text-primary` | `#cbd5e1` | Panel metin |
| `--sim-text-secondary` | `#94a3b8` | İpuçları, açıklamalar |
| `--sim-text-muted` | `#64748b` | Liste ipuçları |
| `--sim-accent-warm` | `#fbbf24` | Seçili öğe, hız değeri, önemli etiket |
| `--sim-accent-cool` | `#7dd3fc` | Görev etiketi, klavuz vurgusu |
| `--sim-accent-danger` | `#f87171` | Hata mesajları |
| `--sim-guide-pulse` | `rgba(56, 189, 248, 0.55)` | `guideFocus` nabız animasyonu |

### Tipografi

| Öğe | Boyut | Ağırlık | Not |
|-----|-------|---------|-----|
| Panel başlık / seçili öğe adı | `0.95rem` (tam) / `0.85rem` (embedded) | 600–700 | `--sim-accent-warm` rengi |
| Panel gövde metni | `0.8rem` | 400 | Satır yüksekliği ≥ 1.45 |
| Kontrol etiketi | `0.85rem` (tam) / `0.78rem` (embedded) | 400 | |
| İpucu listesi | `0.75rem` | 400 | Tam sayfada görünür; embedded'da gizlenir |
| Görev etiketi (uppercase) | `0.72rem` | 600 | Letter-spacing `0.04em` |
| Monospace değer (hız, sayaç) | `0.8rem` | 400 | `ui-monospace` |

### Panel stili (cam efekt)

```css
.sim-panel {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--sim-border);
  background: var(--sim-panel-bg);
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}
```

Gömülü modda panel **sol alt köşeye** taşınır (sağda karakter sütunu olduğu için):

```css
.sim-scene--embedded .sim-panel {
  left: max(0.65rem, env(safe-area-inset-left));
  right: auto;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  width: min(200px, calc(100% - 1.25rem));
  padding: 0.65rem 0.75rem;
}
```

### Klavuz nabız animasyonu (`guideFocus`)

Tüm simülasyonlarda aynı CSS sınıfı kullanılmalıdır:

```css
.sim-target--pulse {
  animation: sim-guide-pulse 1.6s ease-in-out infinite;
}

@keyframes sim-guide-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
  50% {
    box-shadow:
      0 0 0 2px rgba(56, 189, 248, 0.55),
      0 0 20px rgba(56, 189, 248, 0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sim-target--pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45);
  }
}
```

### Bileşen adlandırma (BEM)

Her simülasyon kendi prefix'ini kullanır (`gunes-scene`, `su-dongusu-scene` vb.) ancak **yapısal sınıflar** tutarlı olmalıdır:

| Sınıf | Anlam |
|-------|-------|
| `{prefix}` | Kök kapsayıcı — `position: absolute; inset: 0` |
| `{prefix}--embedded` | Gömülü mod modifier |
| `{prefix}__canvas` | WebGL / 2D canvas |
| `{prefix}__panel` | Kontrol / bilgi paneli |
| `{prefix}__overlay` | Yükleme katmanı |
| `{prefix}__error` | Hata banner |
| `{prefix}__target--pulse` | Klavuz vurgusu |

---

## 5. Sayfa düzeni ve kullanım akışı

### 5.1 Tam sayfa modu (`/simulation/:slug`)

```
┌────────────────────────────────────────────────────────────┐
│  #050814 arka plan (SimulationShell)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │              Simülasyon alanı (canvas / DOM)          │  │
│  │              %100 genişlik × %100 yükseklik          │  │
│  │                                                      │  │
│  │                              ┌─────────────────────┐ │  │
│  │                              │ Kontrol paneli      │ │  │
│  │                              │ (sağ alt köşe)      │ │  │
│  │                              │ · hız kaydırıcı     │ │  │
│  │                              │ · ipuçları          │ │  │
│  │                              │ · seçili öğe bilgi  │ │  │
│  │                              └─────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Tam sayfa kuralları:**

1. **Header/footer yok** — `SimulationShell` yalnızca koyu arka plan + slot sağlar.
2. Sahne kök elementi `position: absolute; inset: 0; width: 100%; height: 100%`.
3. Kontrol paneli **sağ alt** köşede; mobilde alt bant olarak genişler (`max-height: 40vh`).
4. `config.hints` tam sayfada görünür; öğretmen / bağımsız keşif için kritik.
5. Puan sistemi tam sayfada **devre dışı** — `embedded` false iken `award()` çağrılmaz.
6. Klavye: canvas odaklanabilir olmalı; temel kısayollar dokümante edilmeli (ör. `R` = sıfırla).

**İlk 30 saniye deneyimi (tam sayfa):**

1. Simülasyon anında görünür olmalı (prosedürel içerik hemen; modeller arka planda yüklenebilir).
2. Yükleme overlay'i yalnızca harici asset beklerken gösterilir.
3. İlk ipucu panelde veya hafif bir "nasıl kullanılır" animasyonu ile iletilir.
4. Kullanıcı ilk etkileşimde (sürükle, tıkla) görsel geri bildirim almalı.

### 5.2 Oyun içi panel modu

```
┌─────────────────────────────────────────────────────────────┐
│  Bulanık oyun arka planı (backdrop)                         │
│  ┌────────┐  ┌───────────────────────────────────────────┐  │
│  │ Klavuz │  │  Simülasyon canvas                        │  │
│  │ balonu │  │  (flex: 1, max ~720px yükseklik)          │  │
│  ├────────┤  └───────────────────────────────────────────┘  │
│  │ 3D     │  [×] kapat                                     │
│  │ model  │                                                │
│  └────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

**Gömülü mod kuralları:**

1. Sahne **header/footer eklemez** — kapatma düğmesi host tarafından sağlanır.
2. Kontrol paneli **sol alt** köşeye taşınır (karakter solda).
3. `config.hints` gizlenir (klavuz balonu veya diyalog anlatır).
4. Panel genişliği max **200px** — dar alanda okunabilir kalmalı.
5. `contain: strict` + `transform: translateZ(0)` ile repaint izole edilir.
6. `maxPixelRatio: 1.5` (Three.js) — performans için tam sayfadaki 2.0'dan düşük.

**Viewport boyutları (host tarafından):**

| Breakpoint | Kart yüksekliği | Karakter sütunu |
|------------|-----------------|-----------------|
| Desktop | `min(720px, 100dvh - 2rem)` | ~168px, görünür |
| ≤900px | `min(680px, 100dvh - 1.5rem)` | ~128–160px |
| ≤640px | Tam ekran | Gizli — simülasyon %100 genişlik |

Simülasyonunuz **640px genişlikte** ve **~400px yükseklikte** test edilmelidir.

---

## 6. Bileşen sözleşmesi (props & events)

### Zorunlu props

```vue
<script setup>
defineProps({
  /** Registry config objesi — asla hard-code slug kullanmayın */
  config: { type: Object, required: true },

  /** true: oyun içi InGameSimulationHost */
  embedded: { type: Boolean, default: false },

  /** panelGuide.steps[].focus veya diyalog node.focus */
  guideFocus: { type: String, default: null },

  /** Aktif quiz-simulation diyalog düğümü */
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])
</script>
```

### `simulation-event` formatı

Her simülasyon, anlamlı kullanıcı eylemlerini emit eder:

```js
// Gezegen / öğe seçimi
emit('simulation-event', {
  type: 'planet-select',   // veya simülasyona özel: 'element-select', 'toggle-switch'
  planetId: 'earth',       // accept listesi ile eşleşen ID
  name: 'Dünya',
})

// Basit tıklama
emit('simulation-event', { type: 'sun-click' })

// Sürekli değer (slider)
emit('simulation-event', { type: 'speed-change', speed: 2.5 })

// Simülasyon tamamlandı
emit('simulation-event', { type: 'simulation-complete', payload: { /* ... */ } })
```

**Kural:** Event `type` değerleri `config.eventTypes` içinde belgelenmeli; diyalog `quiz-simulation` düğümleri bu türlerle eşleşmelidir.

Diyalog motorunun yerleşik action eşleşmeleri (`src/lib/dialogue/createDialogueEngine.js`):

| `node.action` | Beklenen `event.type` | Doğrulama |
|---------------|----------------------|-----------|
| `select-planet` | `planet-select` | `event.planetId` ∈ `node.accept` |
| `select-body` | `body-select` | `event.bodyId` ∈ `node.accept` |
| `click-sun` | `sun-click` | Her zaman doğru |
| `set-speed` | `speed-change` | `event.speed` ∈ `[node.min, node.max]` |

Yeni action türleri için `matchSimulationEvent` fonksiyonuna ekleme yapın ve bu belgede dokümante edin.

### `simulationTask` UI deseni

Diyalog `quiz-simulation` düğümü aktifken panelde görev UI'ı gösterin:

```vue
<div v-if="simulationTask?.action === 'select-planet'" class="sim-scene__task">
  <p class="sim-scene__task-label">Gezegen seç</p>
  <!-- Hızlı seçim düğmeleri — canvas'a alternatif erişim -->
</div>
```

Bu, mobil ve erişilebilirlik için canvas tıklamasına **alternatif yol** sağlar.

---

## 7. 3D simülasyon standartları

### 7.1 Yaşam döngüsü — `useSimulationScene`

```js
const { canvasRef, ready, context } = useSimulationScene({
  maxPixelRatio: props.embedded ? 1.5 : 2,

  onInit({ renderer, scene, camera }) {
    renderer.setClearColor(0x02040a)
    // Işıklandırma, prosedürel içerik (hemen görünür)
  },

  onFrame({ camera, delta, elapsed }) {
    // Animasyon — delta ile frame-rate bağımsız
  },

  onDispose({ scene }) {
    // geometry.dispose(), material.dispose() — memory leak önleme
  },
})
```

**Zorunlu dispose kuralları:**

- Her `THREE.Geometry` / `BufferGeometry` → `dispose()`
- Her `Material` → `dispose()` (dizi ise döngü)
- Yüklenen texture'lar → `texture.dispose()`
- `ResizeObserver` composable içinde otomatik temizlenir; ek observer varsa `onUnmounted`'da disconnect

### 7.2 Kamera ve etkileşim

| Özellik | Tam sayfa | Gömülü |
|---------|-----------|--------|
| Orbit / sürükle | Evet | Evet |
| Tekerlek zoom | Evet (`preventDefault`) | Evet |
| Dokunmatik pinch | Önerilir | Önerilir |
| `touch-action: none` | Canvas'ta zorunlu | Canvas'ta zorunlu |
| Cursor | `grab` / `grabbing` | Aynı |

Kamera sınırları mutlaka tanımlayın:

```js
cameraState.distance = Math.max(MIN_DIST, Math.min(MAX_DIST, distance))
cameraState.pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch))
```

### 7.3 Işıklandırma

Minimum üç noktalı kurulum:

1. **Ambient** — sahne tabanı (`0x8899bb`, intensity ~0.5–0.7)
2. **Ana ışık** — konuya özel (PointLight / DirectionalLight)
3. **Fill** — karşı taraftan yumuşak (`DirectionalLight`, düşük intensity)

Karanlık sahnelerde `FogExp2` veya `Fog` derinlik hissi verir.

### 7.4 Model yükleme

```js
watch(ready, async (isReady) => {
  if (!isReady || !context.value?.scene) return
  try {
    const models = await loadSimulationModels(props.config.models ?? [])
    // Klonla — orijinale dokunma
    const instance = models.get(modelKey('space', 'meteor'))?.clone(true)
    if (instance) scene.add(instance)
  } catch (err) {
    bootError.value = err.message ?? 'Modeller yüklenemedi.'
  } finally {
    bootLoading.value = false
  }
}, { immediate: true })
```

**Model kuralları:**

- `config.models` → `{ pack, asset, role }` — `asset-catalog.js` ile uyumlu
- Yükleme hatası simülasyonu **tamamen çökertmemeli** — prosedürel fallback kullanın
- GLB ölçeği tutarlı olmalı; `scale.setScalar()` ile normalize edin

**Model seçimi — `docs/models/` kataloğu:**

3D sahnede katalog modeli kullanacaksanız `pack` / `asset` çiftlerini [`docs/models/`](../models/index.md) altından seçin. Katalog müfredat temalarına göre ayrılmıştır; her kategoride önerilen modeller ve tam liste vardır.

> **Prompt olarak kullanım:** Model seçerken AI aracına şunu ekleyin:
>
> ```
> @docs/models/index.md @docs/models/{tema}.md
> ```
>
> Örnekler:
> - Uzay simülasyonu → `@docs/models/uzay-astronomi.md`
> - Basit makineler → `@docs/models/fizik-makineler.md`
> - Legacy sim refactor → `@docs/models/simulasyon-eslestirme.md`
>
> Teknik yükleme: [simulasyon-kullanimi.md](../models/simulasyon-kullanimi.md). Önizleme: `/modeller`.

**Amaç odaklı model kullanımı — gereksiz yüklemeden kaçının:**

Katalogda binlerce model olsa da simülasyona **yalnızca öğretim hedefini destekleyen** modelleri alın. Dekor veya “güzel görünsün” diye model eklemeyin; her `config.models` girişinin sahne içinde net bir rolü olmalıdır.

| Yapın | Yapmayın |
|-------|----------|
| Simülasyon konusuyla doğrudan ilişkili 1–5 model | Konuyla ilgisiz arka plan / süs modeli |
| Prosedürel geometri yeterliyse (küre, düzlem, çizgi) katalog modeli **kullanmayın** | “Boş kalmasın” diye rastgele paket doldurma |
| Aynı işi gören tek model; varyant yalnızca gerekirse | Aynı nesne için 3–4 benzer GLB |
| `docs/models/` içindeki **Önerilen modeller** listesinden başlayın | Tüm paketi veya kategori listesini kopyalama |
| Embedded modda draw call bütçesine sayın (§7.6) | Oyun panelinde ağır sahne |

Örnek (Güneş Sistemi): gezegenler prosedürel küre; katalogdan yalnızca asteroit ve uydu — sahne amacına hizmet eden minimum set.

### 7.5 Raycasting (tıklanabilir 3D nesneler)

```js
// userData sözleşmesi
mesh.userData = {
  type: 'planet',       // 'sun' | 'planet' | 'interactive' | ...
  id: 'earth',          // quiz accept ile eşleşen ID
  name: 'Dünya',
  info: 'Kısa bilgi metni.',
}

// Tıklamada parent'a tırman
let obj = hits[0].object
while (obj.parent && !obj.userData?.name) obj = obj.parent
```

### 7.6 3D performans checklist

- [ ] Draw call sayısı embedded modda < 100 hedef
- [ ] Gölge kapalı veya yalnızca tam sayfada (`embedded` false)
- [ ] `MeshBasicMaterial` yeterliyse Lambert/Standard kullanmayın
- [ ] Instancing: tekrarlayan nesneler (yıldız, asteroit) için `InstancedMesh`
- [ ] Pixel ratio: embedded 1.5, tam sayfa 2.0 max
- [ ] `powerPreference: 'high-performance'`

---

## 8. 2D simülasyon standartları

Legacy simülasyonların çoğu 2D'dir (Matter.js, SVG, saf DOM). Modern kalıba taşırken aşağıdaki standartlara uyun.

### 8.1 Alt motor türleri

| Tür | Örnek simülasyonlar | Ne zaman? |
|-----|---------------------|-----------|
| **Saf DOM + CSS** | Periyodik tablo, besin değerleri | Tablo, kart, form tabanlı |
| **SVG animasyon** | Elektroskop 2D, optik diyagramlar | Vektör grafik, ölçeklenebilir |
| **Canvas 2D** | Grafik çizimi, basit parçacık | Piksel manipülasyonu |
| **Matter.js** | Sürtünme, Arşimet, kuvvet | Gerçekçi fizik çarpışması |

### 8.2 Ortak 2D düzen

Legacy simülasyonlardaki `flex-col md:flex-row`, `-space-y-96` gibi hack'ler **kullanılmamalı**. Modern düzen:

```
┌─────────────────────────────────────────┐
│  Simülasyon görsel alanı (flex: 1)      │
│  canvas / svg / component               │
├─────────────────────────────────────────┤  ← yalnızca mobilde
│  Kontrol paneli (sim-panel stili)       │
└─────────────────────────────────────────┘
```

Tam sayfada: görsel alan tam ekran; panel sağ alt overlay (3D ile aynı).  
Gömülü modda: görsel alan %100; panel sol alt overlay.

### 8.3 Matter.js simülasyonları

```js
// Zorunlu lifecycle
onMounted(() => {
  engine = Matter.Engine.create()
  render = Matter.Render.create({ /* ... */ })
  Matter.Runner.run(runner, engine)
})

onUnmounted(() => {
  Matter.Render.stop(render)
  Matter.Runner.stop(runner)
  Matter.Engine.clear(engine)
  render.canvas.remove()
  render.textures = {}
})
```

**Matter.js kuralları:**

- Canvas boyutu `ResizeObserver` ile güncellenmeli
- Yerçekimi, sürtünme gibi parametreler panel slider'larına bağlanmalı
- Embedded modda fizik nesne sayısını sınırlayın (≤ 30 body hedef)
- `matter-js` import'u simülasyon chunk'ında kalmalı (lazy load)

### 8.4 SVG simülasyonları

- `viewBox` tanımlayın — responsive ölçekleme için
- Etkileşimli parçalar `role="button"` + `tabindex="0"` + `@keydown.enter`
- Animasyonlar CSS `transition` veya `requestAnimationFrame`; jQuery **kullanılmaz**
- Renkler `--sim-*` token'larına map edilmeli

### 8.5 DOM tabanlı simülasyonlar

- Tailwind utility sınıfları yerine scoped CSS + tasarım token'ları tercih edin (embedded modda Tailwind `-space-y-96` gibi sorunlar çıkarır)
- Tablo/grid: yatay scroll mobilde kabul edilebilir; dikey scroll panel içinde (`max-height` + `overflow-y: auto`)
- Sürükle-bırak: hem mouse hem touch event desteği

### 8.6 2D ↔ oyun entegrasyonu

2D simülasyonlar da **aynı prop sözleşmesini** uygular:

```vue
<script setup>
defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})
defineEmits(['simulation-event'])
</script>
```

Canvas/SVG yoksa bile kök yapı `{prefix}` + `{prefix}--embedded` + panel overlay modelini izler.

---

## 9. Oyun içi panel entegrasyonu

### 9.1 Oyun config örneği

`src/views/games/5/game1/config.js`:

```js
{
  id: 'kum-zemin-simulation',
  type: 'hover-simulation',
  match: { layer: 'roads', name: 'kum zemin' },
  simulationSlug: 'gunes-sistemi',
  dialogueId: 'gunes-sistemi-panel',   // isteğe bağlı — tam diyalog akışı
  panelModel: { source: 'player' },
  panelGuide: { steps: [ /* focus alanları */ ] },
  hint: 'Kum zemin — Güneş Sistemi simülasyonu',
}
```

### 9.2 `panelGuide` vs `dialogueId`

| Yöntem | Ne zaman? | Avantaj |
|--------|-----------|---------|
| `panelGuide` | Basit adım adım tanıtım | Config içinde, hızlı |
| `dialogueId` | Quiz, dallanma, puan zinciri | Tam diyalog motoru |

İkisi birlikte kullanılmaz — `dialogueId` varsa diyalog önceliklidir.

### 9.3 `guideFocus` haritası (simülasyon tarafında)

Her simülasyon desteklediği focus anahtarlarını `config.guideFocusKeys` içinde listeler ve CSS'te eşler:

| Focus | Tipik vurgu alanı |
|-------|-------------------|
| `welcome` | Tüm simülasyon alanı |
| `camera` | Canvas (sürükle/zoom) |
| `panel` / `speed` | Kontrol paneli |
| `interactive` | Tıklanabilir ana öğe |
| Simülasyona özel | `planet`, `sun`, `beaker`, `switch`… |

Güneş Sistemi referans eşlemesi:

```js
const panelPulsing = computed(() =>
  guideFocus === 'speed' || guideFocus === 'sim-panel'
  || simulationTask?.action === 'select-planet',
)

const canvasPulsing = computed(() =>
  ['camera', 'planet', 'sun', 'welcome'].includes(guideFocus)
  || simulationTask?.action === 'select-planet',
)
```

### 9.4 Panel model (`panelModel`)

Soldaki 3D karakter simülasyonu "anlatır":

```js
panelModel: { source: 'player' }                              // oyuncu karakteri
panelModel: { source: 'character', characterId: 'character-b' }
panelModel: { source: 'asset', pack: 'space', asset: 'astronautA', scale: 0.35 }
panelModel: { source: 'placement' }                           // NPC diyaloglarında
```

---

## 10. Klavuz, diyalog ve quiz entegrasyonu

### 10.1 Diyalog akışı (Güneş Sistemi panel diyalogu)

Dosya: `src/data/dialogues/gunes-sistemi-panel.js`

Akış: `message` → `message` → … → `quiz-simulation` → `quiz-mcq` → `quiz-true-false`

`quiz-simulation` düğümü:

```js
'q-earth': {
  type: 'quiz-simulation',
  text: 'Simülasyondan Dünya gezegenini seç.',
  action: 'select-planet',
  accept: 'earth',                    // veya ['earth', 'mars']
  focus: 'sim-panel',
  correctFeedback: 'Harika! …',
  wrongFeedback: 'Bu Dünya değil. …',
  points: 5,
  scoreLabel: 'Güneş Sistemi — Dünya seçimi +5',
  next: 'q1-mcq',
}
```

Simülasyon `planet-select` event'i emit edince diyalog motoru otomatik değerlendirir.

### 10.2 Yeni simülasyon için diyalog yazarken

1. `config.eventTypes` listesini tanımlayın
2. Her quiz adımı için `action` + beklenen event eşleşmesini yazın
3. Gerekirse `matchSimulationEvent`'e yeni action handler ekleyin
4. `simulationTask` UI'ını (panel düğmeleri) quiz sırasında gösterin
5. `focus` değerlerini simülasyon CSS'i ile eşleştirin

---

## 11. Puan ve görev entegrasyonu

### 11.1 Gömülü modda puan

```js
if (props.embedded) {
  award({
    points: SCORE_RULES.MY_SIM_ACTION.points,
    ruleId: SCORE_RULES.MY_SIM_ACTION.id,
    label: SCORE_RULES.MY_SIM_ACTION.label,
    showCharacterBubble: true,   // soldaki modelin kafasında balon
  })
}
```

Puan kuralları `src/data/scoreRules.js` içinde merkezi tanımlanır.

### 11.2 Tam sayfada puan yok

Bağımsız `/simulation/:slug` sayfasında puan verilmez; keşif odaklıdır.

### 11.3 Görev tetikleyicisi

Görevler `simulation-event` tipini dinleyebilir (`src/stores/questStore.js`):

```js
// src/data/quests/5/game1.js örneği
{ type: 'simulation-event', eventType: 'sun-click', count: 1 }
```

Simülasyon event türlerini görev tasarımında kullanılabilir şekilde belgelerin.

---

## 12. Performans bütçesi

| Metrik | Tam sayfa hedef | Gömülü hedef |
|--------|-----------------|--------------|
| İlk etkileşim (TTI) | < 2 sn | < 1.5 sn (lazy load) |
| Render FPS | ≥ 55 fps (orta GPU) | ≥ 45 fps |
| Chunk boyutu (gzip) | < 500 KB ideal | Aynı chunk paylaşılır |
| Bellek (WebGL) | < 200 MB | < 120 MB |
| Resize gecikmesi | < 16 ms | < 16 ms |

**Lazy load:** Registry `loadScene: () => import('./slug.vue')` — simülasyon kodu oyun bundle'ına girmez.

**ResizeObserver:** Canvas her boyut değişiminde yeniden boyutlandırılmalı; `useSimulationScene` bunu otomatik yapar.

---

## 13. Erişilebilirlik ve mobil

### Erişilebilirlik

- [ ] Kontrol paneli öğeleri gerçek `<button>`, `<input>`, `<label>` — div-click anti-pattern yok
- [ ] Slider'larda `<label>` + `aria-valuenow` (range input native)
- [ ] `guideFocus` pulse animasyonu `prefers-reduced-motion: reduce`'da statik outline'a düşer
- [ ] Renk kontrastı: metin / arka plan ≥ 4.5:1 (WCAG AA)
- [ ] Simülasyon bilgisi yalnızca renkle iletilmez (ikon + metin)

### Mobil (≤640px)

- [ ] Karakter sütunu gizlenir — simülasyon tam genişlik
- [ ] Panel alt bant; `max-height: 40vh`, scroll edilebilir
- [ ] Canvas touch event'leri (`pointerdown/move/up` yeterli)
- [ ] İpucu listesi gizli (tam sayfa mobilde de gizlenebilir)
- [ ] `safe-area-inset-*` padding uygulanır

### Klavye

- Panel odak hapsi gerekmez (modal host yönetir)
- Esc ile kapatma host'ta — simülasyon Esc'i yakalamasın

---

## 14. Durum yönetimi: yükleme, hata, boş

Her simülasyon üç durumu ele almalıdır:

```vue
<div v-if="bootLoading" class="{prefix}__overlay">
  Modeller yükleniyor…
</div>

<p v-if="bootError" class="{prefix}__error">{{ bootError }}</p>

<!-- Ana içerik — hata olsa bile prosedürel kısım görünür kalabilir -->
```

| Durum | Tam sayfa | Gömülü |
|-------|-----------|--------|
| Yükleme | Overlay simülasyon üstünde | Aynı |
| Hata | Üst banner, kırmızı | Aynı — host'un error state'ine ek |
| Boş seçim | Panel bilgi alanı gizli | Aynı |

Host seviyesinde (`InGameSimulationHost`) ayrıca:

- `Simülasyon yükleniyor…` — chunk indirilirken
- `Simülasyon yüklenemedi.` — registry / import hatası

---

## 15. Legacy simülasyonları modernleştirme

Legacy simülasyonlar (`src/views/simulation/legacy/embed/`) aşağıdaki kriterlerin **en az 8'ini** karşılamıyorsa modernleştirme adayıdır:

1. `embedded` prop desteği yok
2. `guideFocus` / `simulationTask` desteği yok
3. `simulation-event` emit yok
4. Tailwind layout hack'leri (`-space-y-96`, `h-screen overflow-auto`)
5. Matter.js / Three dispose yapılmıyor
6. Tasarım token'larına uymayan renkler (`bg-gray-800`, `bg-blue-600` vb.)
7. `loadScene` registry kaydı yok
8. Mobil layout kırık
9. Oyun içi panelde taşma / scroll sorunu
10. Header/footer legacy kabuğu (Modern `SimulationShell` yok)

### Modernleştirme adımları

1. Sahne mantığını `src/views/simulation/simulations/{slug}.vue`'ya taşı
2. `config.js` + `index.vue` + registry kaydı oluştur
3. Legacy route'u yönlendir veya `simulations.js`'de yeni kayda geç
4. Tasarım token'larını uygula
5. Prop sözleşmesini ekle
6. Her iki modda test et
7. Oyun config'ine `hover-simulation` ekle (gerekiyorsa)

Detay: [github-simulasyon-transferi.md](./github-simulasyon-transferi.md)

---

## 16. Kalite kontrol listeleri

### Yeni simülasyon — yayın öncesi

**Mimari**
- [ ] `config.js` — slug, title, description, engine
- [ ] `{slug}.vue` — sahne bileşeni
- [ ] `{slug}/index.vue` — SimulationShell sarmalayıcı
- [ ] `registry.js` — `loadPage` + `loadScene`
- [ ] `simulations.js` — liste kartı, `available: true`

**Çift mod**
- [ ] `embedded` prop ile panel konumu / boyutu değişiyor
- [ ] Tam sayfada hints görünür; embedded'da gizli
- [ ] Puan yalnızca `embedded === true` iken

**Etkileşim sözleşmesi**
- [ ] `guideFocus` ile en az bir alan vurgulanıyor
- [ ] `simulation-event` anlamlı türlerle emit ediliyor
- [ ] `simulationTask` UI'ı quiz sırasında alternatif erişim sunuyor

**3D (varsa)**
- [ ] `useSimulationScene` + dispose
- [ ] `maxPixelRatio` embedded/tam sayfa ayrımı
- [ ] ResizeObserver ile canvas boyutu
- [ ] Model yükleme hatası simülasyonu öldürmüyor

**2D (varsa)**
- [ ] Matter/SVG/canvas lifecycle temiz
- [ ] Legacy Tailwind layout hack'leri yok
- [ ] Responsive — 640px test edildi

**Görsel**
- [ ] Renk/token uyumu
- [ ] Panel cam efekti
- [ ] `prefers-reduced-motion` desteği
- [ ] Yükleme + hata durumları

**Oyun entegrasyonu (kullanılacaksa)**
- [ ] Oyun `config.js` → `hover-simulation`
- [ ] `panelGuide` veya `dialogueId` tanımlı
- [ ] `match.name` düzenleyici adı ile uyumlu
- [ ] `/games/:grade/gameN` üzerinde manuel test

### Mevcut simülasyon modernizasyonu

- [ ] Legacy'den `simulations/` altına taşındı
- [ ] Prop sözleşmesi eklendi
- [ ] Tasarım token'ları uygulandı
- [ ] Embedded mod test edildi
- [ ] Performans bütçesi karşılandı
- [ ] `config.guideFocusKeys` ve `config.eventTypes` belgelendi

---

## 17. Anti-kalıplar (yapılmaması gerekenler)

| Anti-kalıp | Neden kötü? | Doğru yaklaşım |
|------------|-------------|----------------|
| Simülasyon içinde `usePlayEngine` çağırmak | Bağımsız sayfada çalışmaz | Prop + emit |
| `embedded`'ı CSS media query ile tahmin etmek | Panel boyutu yanlış | `embedded` prop |
| Her modda puan vermek | Tam sayfa puan sistemi dışında | `if (embedded)` guard |
| Sabit `h-screen` + `overflow-auto` | Oyun panelinde taşma | `inset: 0` + host viewport |
| Three.js dispose atlamak | Bellek sızıntısı, oyun kasması | `onDispose` traverse |
| Tüm modelleri senkron yüklemeden sahne göstermemek | 3 sn boş ekran | Prosedürel içerik hemen |
| Legacy header/footer simülasyon içine koymak | Çift kabuk, oyun panelinde kırılır | Yalnızca `SimulationShell` (tam sayfa) |
| `guideFocus` desteksiz simülasyon + uzun panelGuide | Klavuz yanlış alanı vurgular | Focus → CSS eşlemesi |
| Hard-coded Türkçe slug dışı metinler config'de değil | Bakım zorluğu | `config.js` + i18n hazırlığı |
| jQuery / global `window.mySim` | Vue lifecycle dışı | Composable pattern |

---

## 18. Dosya haritası

```
src/
├── data/
│   ├── simulations.js              ← Liste kartları
│   ├── scoreRules.js               ← Puan sabitleri
│   └── dialogues/
│       └── gunes-sistemi-panel.js  ← Panel diyalog örneği
├── composables/
│   ├── useSimulationScene.js       ← Three.js lifecycle
│   ├── useInGameSimulation.js      ← Oyun içi kontrolör
│   └── useSimulationPanelGuide.js  ← Adım adım klavuz
├── components/simulation/
│   ├── InGameSimulationHost.vue    ← Modal kabuk
│   ├── InGameSimulationCharacter.vue
│   ├── SimulationPanelGuide.vue
│   └── SimulationPanelDialogue.vue
├── lib/simulation/
│   ├── loadSimulationModels.js
│   └── resolvePanelModel.js
└── views/
    ├── simulation/
    │   ├── SimulationShell.vue
    │   ├── SimulationPlayView.vue
    │   └── simulations/
    │       ├── registry.js
    │       ├── gunes-sistemi.vue       ← REFERANS
    │       └── gunes-sistemi/
    │           ├── config.js
    │           └── index.vue
    └── games/5/game1/
        └── config.js                   ← Oyun entegrasyon örneği
```

---

## 19. İlgili dokümanlar

| Doküman | İlişki |
|---------|--------|
| [yeni-simulasyon.md](./yeni-simulasyon.md) | Hızlı başlangıç, dosya oluşturma |
| [oyun-ici-simulasyon.md](./oyun-ici-simulasyon.md) | hover-simulation, panel düzeni |
| [diyalog-sistemi.md](../dialog/diyalog-sistemi.md) | quiz-simulation düğümleri |
| [puan-sistemi-kullanim.md](./puan-sistemi-kullanim.md) | `award()`, `showCharacterBubble` |
| [github-simulasyon-transferi.md](./github-simulasyon-transferi.md) | Legacy → modern taşıma |
| [models/index.md](../models/index.md) | Simülasyon için model kataloğu (`pack` / `asset` seçimi) |
| [models/simulasyon-eslestirme.md](../models/simulasyon-eslestirme.md) | Legacy slug → önerilen katalog modelleri |

---

## Prompt şablonu (AI / Cursor)

```
@docs/index.md @docs/guides/simulasyon-tasarim-standardi.md @docs/guides/yeni-simulasyon.md
@docs/models/index.md @docs/models/{tema}.md

"{simülasyon-adı}" simülasyonunu tasarım standardına uygun oluştur / modernleştir.

Gereksinimler:
- engine: {three|canvas2d|matter|dom}
- Tam sayfa: /simulation/{slug}
- Oyun içi: /games/5/game1 — {yerleştirme-adı} üzerinde hover-simulation
- guideFocusKeys: [...]
- simulation-event türleri: [...]
- Referans: gunes-sistemi.vue
- 3D katalog modelleri gerekiyorsa: docs/models/ altından pack/asset seç (config.models)
- Model: yalnızca öğretim hedefine hizmet eden minimum set; gereksiz/dekor model ekleme

Kontrol: embedded mod, dispose, token renkleri, 640px mobil, puan yalnızca embedded.
```

---

*Son güncelleme: 2026-07-04 — Güneş Sistemi referans implementasyonu ve `/games/5/game1` kum zemin entegrasyonu esas alınmıştır.*
