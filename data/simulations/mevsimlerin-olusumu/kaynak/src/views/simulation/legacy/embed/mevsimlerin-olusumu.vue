<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-white relative">
    <!-- Mobil için ayarlar butonu -->
    <button 
      @click="toggleSettings" 
      class="md:hidden absolute top-4 right-4 z-50 bg-gray-800 p-2 rounded-lg shadow-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <div class="relative flex flex-col md:flex-row w-full h-full">
      <!-- Simülasyon alanı -->
      <div class="w-full h-screen md:w-3/4 relative">
        <div 
          ref="threeContainer" 
          class="w-full h-full overflow-hidden relative cursor-move"
        >
          <!-- Three.js render hedefi burası -->
        </div>
        
        <!-- Bilgi kutusu -->
        <div class="absolute top-4 left-4 bg-gray-900/80 p-3 rounded-lg shadow-lg text-sm max-w-[300px]">
          <div>
            <span class="font-bold">Mevcut Ay:</span> {{ currentMonth }}
          </div>
          <div class="mt-2">
            <span class="font-bold">Kuzey Yarımküre:</span> {{ northHemisphereSeason }}
          </div>
          <div>
            <span class="font-bold">Güney Yarımküre:</span> {{ southHemisphereSeason }}
          </div>
        </div>

        <!-- Başlat/Durdur Butonu -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2">
          <button 
            @click="toggleOrbiting" 
            class="bg-indigo-700 hover:bg-indigo-600 py-2 px-4 rounded-md shadow-lg flex items-center"
          >
            <span v-if="autoOrbit">
              Durdur
            </span>
            <span v-else>
              Başlat
            </span>
          </button>
        </div>
      </div>

      <!-- Kontrol paneli - Mobil için modal -->
      <div 
        :class="[
          'fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden',
          showSettings ? 'block' : 'hidden'
        ]"
        @click="toggleSettings"
      ></div>
      
      <div 
        :class="[
          'fixed inset-y-0 right-0 w-full max-w-sm bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:w-1/4',
          showSettings ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        ]"
      >
        <div class="h-screen overflow-auto flex flex-col">
          <!-- Modal başlığı -->
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 class="text-xl font-bold">Dünya ve Mevsimler Simülasyonu</h2>
            <button 
              @click="toggleSettings" 
              class="md:hidden text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Ayarlar içeriği -->
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Dünya Şekli Kontrolü -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Dünya Şekli</h3>
              <div class="grid grid-cols-2 gap-2 mt-2 mb-4">
                <button 
                  v-for="(shape, index) in ['sphere', 'cylinder', 'prism', 'cube']"
                  :key="index"
                  @click="changeEarthShape(shape)" 
                  class="bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded-md text-sm"
                  :class="{ 'ring-2 ring-white': currentEarthShape === shape }"
                >
                  {{ shape === 'sphere' ? 'Küresel' : 
                     shape === 'cylinder' ? 'Silindir' : 
                     shape === 'prism' ? 'Dikdörtgen Prizma' : 'Küp' }}
                </button>
              </div>
              
              <!-- Şekil boyutları ayarları -->
              <div v-if="currentEarthShape === 'sphere'" class="mb-2">
                <h4 class="text-sm font-semibold mb-1">Küre Yarıçapı: {{ earthSize.toFixed(1) }}</h4>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.5" 
                  v-model.number="earthSize"
                  class="w-full accent-indigo-600"
                  @change="updateEarthGeometry"
                />
              </div>
              
              <!-- Diğer şekil boyutları ayarları -->
              <div v-if="currentEarthShape === 'cylinder'" class="space-y-2">
                <div>
                  <h4 class="text-sm font-semibold mb-1">Yarıçap: {{ cylinderDimensions.radius.toFixed(1) }}</h4>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5" 
                    v-model.number="cylinderDimensions.radius"
                    class="w-full accent-indigo-600"
                    @change="updateEarthGeometry"
                  />
                </div>
                <div>
                  <h4 class="text-sm font-semibold mb-1">Yükseklik: {{ cylinderDimensions.height.toFixed(1) }}</h4>
                  <input 
                    type="range" 
                    min="1" 
                    max="15" 
                    step="0.5" 
                    v-model.number="cylinderDimensions.height"
                    class="w-full accent-indigo-600"
                    @change="updateEarthGeometry"
                  />
                </div>
              </div>
              
              <div v-if="currentEarthShape === 'prism'" class="space-y-2">
                <div>
                  <h4 class="text-sm font-semibold mb-1">Genişlik: {{ prismDimensions.width.toFixed(1) }}</h4>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    step="0.5" 
                    v-model.number="prismDimensions.width"
                    class="w-full accent-indigo-600"
                    @change="updateEarthGeometry"
                  />
                </div>
                <div>
                  <h4 class="text-sm font-semibold mb-1">Yükseklik: {{ prismDimensions.height.toFixed(1) }}</h4>
                  <input 
                    type="range" 
                    min="1" 
                    max="15" 
                    step="0.5" 
                    v-model.number="prismDimensions.height"
                    class="w-full accent-indigo-600"
                    @change="updateEarthGeometry"
                  />
                </div>
                <div>
                  <h4 class="text-sm font-semibold mb-1">Derinlik: {{ prismDimensions.depth.toFixed(1) }}</h4>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5" 
                    v-model.number="prismDimensions.depth"
                    class="w-full accent-indigo-600"
                    @change="updateEarthGeometry"
                  />
                </div>
              </div>
              
              <div v-if="currentEarthShape === 'cube'" class="mb-2">
                <h4 class="text-sm font-semibold mb-1">Küp Boyutu: {{ cubeDimensions.size.toFixed(1) }}</h4>
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  step="0.5" 
                  v-model.number="cubeDimensions.size"
                  class="w-full accent-indigo-600"
                  @change="updateEarthGeometry"
                />
              </div>
            </div>
            
            <!-- Kamera Açısı Kontrolleri -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Kamera Açısı</h3>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <button 
                  v-for="(mode, index) in ['sun', 'earth', 'top', 'side', 'free']"
                  :key="index"
                  @click="changeCameraMode(mode)" 
                  class="bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded-md text-sm"
                  :class="{ 'ring-2 ring-white': cameraMode === mode }"
                >
                  {{ mode === 'sun' ? 'Güneşten İzle' : 
                     mode === 'earth' ? 'Dünyaya Yakın' : 
                     mode === 'top' ? 'Üstten Görünüm' : 
                     mode === 'side' ? 'Yandan Görünüm' : 'Serbest Kamera' }}
                </button>
              </div>
            </div>
            

            

            <!-- Yılın zamanları -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Yılın Zamanları</h3>
              <div class="grid grid-cols-2 gap-2 mt-2">

                <button 
                  v-for="(position, index) in seasons"
                  :key="index"
                  @click="setEarthPosition(position.value)" 
                  class="bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded-md text-sm"
                  :class="{ 'ring-2 ring-white': currentPosition === position.value }"
                >
                  {{ position.name }}
                </button>
              </div>
            </div>

            <!-- Eksen eğikliği ayarı -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Eksen Eğikliği: {{ axialTilt.toFixed(1) }}°</h3>
              <input 
                type="range" 
                min="0" 
                max="90" 
                step="0.5" 
                v-model.number="axialTilt"
                class="w-full accent-indigo-600"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0°</span>
                <span>23.5°</span>
                <span>45°</span>
                <span>90°</span>
              </div>
            </div>

            <!-- Simülasyon kontrolleri -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Simülasyon Kontrolleri</h3>
              <div class="flex flex-col space-y-2">
                <label class="flex items-center text-sm">
                  <input type="checkbox" v-model="showOrbitalPath" class="mr-2 accent-indigo-600"> 
                  Yörünge Yolunu Göster
                </label>
                <label class="flex items-center text-sm">
                  <input type="checkbox" v-model="showSunRays" class="mr-2 accent-indigo-600"> 
                  Güneş Işınlarını Göster
                </label>
                <label class="flex items-center text-sm">
                  <input type="checkbox" v-model="autoRotate" class="mr-2 accent-indigo-600"> 
                  Otomatik Dönüş
                </label>
                <label class="flex items-center text-sm">
                  <input type="checkbox" v-model="showTurkeyMarker" class="mr-2 accent-indigo-600"> 
                  Türkiye'yi Belirgin Göster
                </label>
              </div>
            </div>

            <!-- Hız kontrolleri -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Simülasyon Hızı</h3>
              <div class="flex items-center justify-between">
                <button 
                  @click="decreaseSpeed" 
                  class="bg-gray-700 hover:bg-gray-600 py-1 px-3 rounded-md"
                >
                  <span>-</span>
                </button>
                <span>{{ rotationSpeed.toFixed(1) }}x</span>
                <button 
                  @click="increaseSpeed" 
                  class="bg-gray-700 hover:bg-gray-600 py-1 px-3 rounded-md"
                >
                  <span>+</span>
                </button>
              </div>
            </div>


            <!-- Arkaplan Renk Seçimi -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Arkaplan Rengi</h3>
              <div class="grid grid-cols-4 gap-2 mt-2">
                <button 
                  v-for="(color, index) in backgroundColorOptions" 
                  :key="index"
                  @click="backgroundColorIndex = index" 
                  class="p-2 rounded-md"
                  :class="{ 'ring-2 ring-white': backgroundColorIndex === index }"
                  :style="{backgroundColor: '#' + color.color.toString(16).padStart(6, '0')}"
                >
                  <span class="sr-only">{{ color.name }}</span>
                </button>
              </div>
              <div class="text-xs text-gray-400 mt-1 text-center">
                {{ backgroundColorOptions[backgroundColorIndex].name }}
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// DOM referansları
const threeContainer = ref(null);

// Simülasyon parametreleri
const axialTilt = ref(23.5); // Eksen eğikliği (derece)
const rotationSpeed = ref(1.0); // Simülasyon hızı
const showOrbitalPath = ref(true); // Yörünge yolunu göster/gizle
const showSunRays = ref(false); // Güneş ışınları (varsayılan olarak gizli)
const autoRotate = ref(true); // Otomatik dönüş
const autoOrbit = ref(false); // Otomatik yörünge hareketi (başlangıçta durgun)
const currentPosition = ref(0); // 0=İlkbahar, PI/2=Yaz, PI=Sonbahar, 3PI/2=Kış
const showTurkeyMarker = ref(true); // Türkiye işaretçisi
const currentEarthShape = ref('sphere'); // Dünya şekli
const earthSize = ref(4); // Dünya boyutu (küre için yarıçap)
const cameraMode = ref('free'); // Kamera modu: 'free', 'sun', 'earth', 'top', 'side'
const seasons    = ref([
  {name: '21 Mart', value: 0}, 
  {name: '21 Haziran', value: Math.PI*1.5},
  {name: '23 Eylül', value: Math.PI}, 
  {name: '21 Aralık', value: Math.PI/2},
]);

// Detaylı şekil boyutları
const cylinderDimensions = ref({
  radius: 4,         // Yarıçap
  height: 6,        // Yükseklik
  segments: 32     // Segment sayısı
});

const prismDimensions = ref({
  width: 6,         // Genişlik (x)
  height: 8,        // Yükseklik (y)
  depth: 3.2,       // Derinlik (z)
});

const cubeDimensions = ref({
  size: 6,          // Küp boyutu
});

const sunLightIntensity = ref(0.1); // Güneş ışığı şiddeti (varsayılan olarak düşük)
const earthOpacity = ref(1.0); // Dünya matlığı (varsayılan olarak tam opak)
const earthColorIndex = ref(1); // Seçilen mavi renk indeksi (varsayılan olarak orta mavi)
const backgroundColorIndex = ref(2); // Arkaplan rengi indeksi (varsayılan olarak siyah)

// Dünya renk seçenekleri - farklı mavi tonları
const earthColorOptions = [
  { name: 'Açık Mavi', color: 0x66ccff, roughness: 0.7 },
  { name: 'Okyanus Mavisi', color: 0x0077be, roughness: 0.5 },
  { name: 'Koyu Mavi', color: 0x003366, roughness: 0.3 },
  { name: 'Turkuaz', color: 0x00cccc, roughness: 0.6 },
  { name: 'Gece Mavisi', color: 0x191970, roughness: 0.4 }
];

// Arkaplan renk seçenekleri
const backgroundColorOptions = [
  { name: 'Mavi', color: 0xd1fae5 },
  { name: 'Siyah', color: 0x000000 },
  { name: 'Koyu Gri', color: 0x1a1a1a },
  { name: 'Gri', color: 0x333333 },
  { name: 'Orta Gri', color: 0x666666 },
  { name: 'Açık Gri', color: 0x999999 },
  { name: 'Lacivert', color: 0x000033 },
  { name: 'Koyu Mavi', color: 0x000066 },
  { name: 'Koyu Yeşil', color: 0x003300 }
];

// Dünya rengini izle ve güncelle
watch(earthColorIndex, (newIndex) => {
  if (earth && earth.material) {
    const selectedColor = earthColorOptions[newIndex];
    earth.material.color.setHex(selectedColor.color);
    
    if (earth.material.roughness !== undefined) {
      earth.material.roughness = selectedColor.roughness;
    }
  }
});

// Dünya matlığını izle ve güncelle
watch(earthOpacity, (newValue) => {
  if (earth && earth.material) {
    // MeshStandardMaterial kullandığımız için doğrudan opacity yerine
    // metalness ve roughness değerleriyle oynayarak matlığı ayarlıyoruz
    if (earth.material.metalness !== undefined) {
      earth.material.metalness = 0.1; // Düşük metalik değeri (0-1)
      earth.material.roughness = 1.0 - newValue * 0.5; // Matlık değeri
    }
    
    earth.material.opacity = newValue;
    earth.material.transparent = newValue < 1.0;
  }
});

// Arkaplan rengini izle ve güncelle
watch(backgroundColorIndex, (newIndex) => {
  if (renderer) {
    const selectedColor = backgroundColorOptions[newIndex].color;
    renderer.setClearColor(selectedColor);
  }
});

// Mobil ayarlar modalı için yeni ref
const showSettings = ref(false);

// Mobil ayarlar modalını aç/kapat
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Orbital hareket kontrolleri
const toggleOrbiting = () => {
  autoOrbit.value = !autoOrbit.value;
};

// Three.js bileşenleri
let scene, camera, renderer, controls;
let earth, earthGroup, orbitalGroup, sun, sunLight;
let orbitalPath, axisHelper, equator, tropics;
let sunRays = [];
let turkeyMarker;
let earthGlow;
let earthOrbitAngle = 0; // Yörünge açısı
let previousCameraPosition = new THREE.Vector3(); // Önceki kamera pozisyonu
let previousCameraTarget = new THREE.Vector3(); // Önceki kamera hedefi

// Türkiye'nin koordinatları (yaklaşık)
const turkeyLatitude = 39 * Math.PI / 180; // 39° Kuzey
const turkeyLongitude = 35 * Math.PI / 180; // 35° Doğu



const northHemisphereSeason = computed(() => {
  if (["Mart","Nisan","Mayıs"].includes(currentMonth.value)) return "İlkbahar";
  if (["Haziran","Temmuz","Ağustos"].includes(currentMonth.value)) return "Yaz";
  if (["Eylül","Ekim","Kasım"].includes(currentMonth.value)) return "Sonbahar";
  return "Kış";
});

const southHemisphereSeason = computed(() => {
  if (["Mart","Nisan","Mayıs"].includes(currentMonth.value)) return "Sonbahar";
  if (["Haziran","Temmuz","Ağustos"].includes(currentMonth.value)) return "Kış";
  if (["Eylül","Ekim","Kasım"].includes(currentMonth.value)) return "İlkbahar";
  return "Yaz";
});

// Mevcut ayı hesapla
const currentMonth = computed(() => {
  // 2π'yi 12 aya böl ve mevcut açıya göre ayı belirle
  // Not: Mevsimlerle uyumlu olması için başlangıç noktasını ayarla
  const angle = (currentPosition.value + Math.PI * 2) % (Math.PI * 2);
  const monthIndex = Math.floor((angle / (Math.PI * 2)) * 12) % 12;
  
  const months = [
    "Mart", "Şubat", "Ocak", "Aralık", 
    "Kasım", "Ekim", "Eylül", "Ağustos", 
    "Temmuz", "Haziran", "Mayıs", "Nisan"
  ];
  
  return months[monthIndex];
});

// Simülasyon hızı kontrolleri
const increaseSpeed = () => {
  if (rotationSpeed.value < 5) rotationSpeed.value += 0.5;
};

const decreaseSpeed = () => {
  if (rotationSpeed.value > 0.5) rotationSpeed.value -= 0.5;
};

// Earth konumu ayarı
const setEarthPosition = (position) => {
  currentPosition.value = position;
  earthOrbitAngle = position; // Yörünge açısını güncelle
  updateEarthPosition();
};

// Earth pozisyonunu güncelle
const updateEarthPosition = () => {
  const angle = autoOrbit.value ? earthOrbitAngle : currentPosition.value;
  
  // Eliptik yörünge
  const a = 30; // Yarı-major eksen
  const b = 30; // Yarı-minor eksen
  
  const x = a * Math.cos(angle);
  const z = b * Math.sin(angle);
  
  orbitalGroup.position.set(x, 0, z);
  
  // Türkiye işaretçisini güncelle
  updateTurkeyMarker();
  
  // Güneş ışınları pozisyonunu güncelle
  updateSunRays();
};

// Türkiye işaretçisini güncelle
const updateTurkeyMarker = () => {
  // Önceki işaretçiyi kaldır
  if (turkeyMarker) {
    earth.remove(turkeyMarker);
  }
  
  if (!showTurkeyMarker.value) return;
  
  // Eğer şekil küresel değilse işaretçiyi ekleme
  if (currentEarthShape.value !== 'sphere') return;
  
  // Türkiye'nin küre üzerindeki konumunu hesapla
  const radius = earthSize.value + 0.1; // Dünya yarıçapı + küçük bir ofset
  
  // Coğrafi koordinatları kartezyen koordinatlara dönüştür
  // Not: Coğrafik olarak longitude (boylam) x ekseni, latitude (enlem) y ekseni olarak düşünülür
  // Ancak Three.js'de küre koordinat sistemi biraz farklı çalışır
  const x = radius * Math.cos(turkeyLatitude) * Math.cos(turkeyLongitude);
  const y = radius * Math.sin(turkeyLatitude);
  const z = radius * Math.cos(turkeyLatitude) * Math.sin(turkeyLongitude);
  
  // Türkiye işaretçisini oluştur
  const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, // Kırmızı
    emissive: 0xff0000,
    emissiveIntensity: 0.5
  });
  
  turkeyMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  turkeyMarker.position.set(x, y, z);
  earth.add(turkeyMarker);
};

// Güneş ışınlarını güncelle
const updateSunRays = () => {
  if (!showSunRays.value) {
    sunRays.forEach(ray => {
      if (ray) scene.remove(ray);
    });
    sunRays = [];
    return;
  }
  
  // Önceki ışınları temizle
  sunRays.forEach(ray => {
    if (ray) scene.remove(ray);
  });
  sunRays = [];
  
  // Yeni ışınlar oluştur
  const rayCount = 5;
  const earthPos = new THREE.Vector3();
  earth.getWorldPosition(earthPos);
  
  for (let i = 0; i < rayCount; i++) {
    // Dünya'nın aydınlık yüzü üzerinde rastgele noktalar seç
    const lat = (Math.random() - 0.5) * Math.PI; 
    const lon = Math.random() * Math.PI - Math.PI/2;
    
    const radius = 5;
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    const rayEnd = new THREE.Vector3(x, y, z).add(earthPos);
    
    // Güneş'ten Dünya'ya doğru ışın oluştur
    const rayStart = new THREE.Vector3(0, 0, 0); // Güneş merkezi
    
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([rayStart, rayEnd]);
    const rayMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const ray = new THREE.Line(rayGeometry, rayMaterial);
    
    scene.add(ray);
    sunRays.push(ray);
  }
};

// Güneş sistemini oluştur
const initScene = () => {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45, 
    threeContainer.value.clientWidth / threeContainer.value.clientHeight, 
    0.1, 
    1000
  );
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(backgroundColorOptions[backgroundColorIndex.value].color);
  renderer.shadowMap.enabled = true; // Gölgeleri etkinleştir
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Yumuşak gölgeler
  
  threeContainer.value.appendChild(renderer.domElement);
  
  // Arkaplan yıldızları
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.7,
  });
  
  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  
  // Güneş oluştur
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffdd00,
    emissive: 0xffaa00,
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.castShadow = false; // Güneş gölge yaratmaz
  scene.add(sun);
  
  // Güneş ışığı
  sunLight = new THREE.PointLight(0xffffff, sunLightIntensity.value, 150);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = false;
  
  scene.add(sunLight);
  
  // Ambient ışık - değeri biraz azalttım
  const ambientLight = new THREE.AmbientLight(0x444444);
  scene.add(ambientLight);
  
  // Dünya'nın daha iyi görünmesi için ilave bir ışık ekleyelim, değeri azalttım
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
  scene.add(hemisphereLight);
  
  // Yörünge grubu oluştur (eliptik yörünge için)
  orbitalGroup = new THREE.Group();
  scene.add(orbitalGroup);
  
  // Dünya grubu (eksen eğikliği için)
  earthGroup = new THREE.Group();
  orbitalGroup.add(earthGroup);
  
  // Dünya oluştur
  let earthGeometry;
  switch (currentEarthShape.value) {
    case 'sphere':
      earthGeometry = new THREE.SphereGeometry(earthSize.value, 32, 32);
      break;
    case 'cylinder':
      earthGeometry = new THREE.CylinderGeometry(
        cylinderDimensions.value.radius, 
        cylinderDimensions.value.radius, 
        cylinderDimensions.value.height, 
        cylinderDimensions.value.segments
      );
      break;
    case 'prism':
      earthGeometry = new THREE.BoxGeometry(
        prismDimensions.value.width, 
        prismDimensions.value.height, 
        prismDimensions.value.depth
      );
      break;
    case 'cube':
      earthGeometry = new THREE.BoxGeometry(
        cubeDimensions.value.size,
        cubeDimensions.value.size,
        cubeDimensions.value.size
      );
      break;
    default:
      earthGeometry = new THREE.SphereGeometry(earthSize.value, 32, 32);
  }
  
  // Seçilen renk seçeneğini al
  const selectedColor = earthColorOptions[earthColorIndex.value];
  
  // MeshBasicMaterial yerine MeshStandardMaterial kullanarak daha gerçekçi mat görünüm elde edeceğiz
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: selectedColor.color, // Seçilen mavi renk
    roughness: selectedColor.roughness, // Pürüzlülük (mat görünüm için)
    metalness: 0.1, // Düşük metalik değeri (0-1)
    transparent: earthOpacity.value < 1.0,
    opacity: earthOpacity.value,
  });
  
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.castShadow = false; // Dünya gölge oluşturmasın
  earth.receiveShadow = false; // Dünya gölge almasın
  earthGroup.add(earth);
  
  // Eksen çizgisi
  const axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const axisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -6, 0),
    new THREE.Vector3(0, 6, 0)
  ]);
  axisHelper = new THREE.Line(axisGeometry, axisMaterial);
  earthGroup.add(axisHelper);
  
  // Ekvator ve dönenceler
  updateEquatorAndTropics();
  
  // Yörünge yolu
  const orbitCurve = new THREE.EllipseCurve(
    0, 0,            // merkez
    30, 30,          // x, y yarıçapları
    0, 2 * Math.PI,  // başlangıç ve bitiş açıları
    false,           // saat yönüne mi
    0                // başlangıç açısı
  );
  
  const orbitPoints = orbitCurve.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
  orbitalPath = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitalPath.rotation.x = Math.PI / 2;
  scene.add(orbitalPath);
  
  // Türkiye işaretçisini oluştur
  updateTurkeyMarker();
  
  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Başlangıç konumu
  camera.position.set(0, 30, 60);
  controls.update();
  
  // İlk konum güncelleme
  setEarthPosition(Math.PI*1.5);
};

// Animasyon döngüsü
let animationFrameId;
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  // Dünyanın kendi etrafında dönüşü
  if (autoRotate.value) {
    earth.rotation.y += 0.01 * rotationSpeed.value;
  }
  
  // Dünyanın Güneş etrafında dolanması
  if (autoOrbit.value) {
    // Saat yönünün tersine hareket (negatif artış)
    earthOrbitAngle -= 0.002 * rotationSpeed.value;
    // Açıyı normalize et (0-2π arasında)
    if (earthOrbitAngle < 0) earthOrbitAngle += Math.PI * 2;
    // Earth pozisyonunu güncelle
    updateEarthPosition();
    
    // Bilgi panelinini güncelle (en yakın konuma göre)
    const normalizedAngle = (earthOrbitAngle + Math.PI * 2) % (Math.PI * 2);
    
    // Hangi mevsime daha yakın olduğunu bul
    const positions = [0, Math.PI/2, Math.PI, Math.PI*1.5];
    let closestPosition = positions[0];
    let minDistance = Math.abs(normalizedAngle - positions[0]);
    
    for (let i = 1; i < positions.length; i++) {
      const distance = Math.abs(normalizedAngle - positions[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestPosition = positions[i];
      }
    }
    
    // Eğer tam bir mevsim noktasında değilsek ve yörüngede hareket ediyorsak
    if (minDistance < 0.1) { // Belirli bir tolerans içindeyse
      currentPosition.value = closestPosition;
    } else {
      // Mevsim ara noktalarında bilgiyi güncelle
      currentPosition.value = normalizedAngle;
    }
  }
  
  // Eksen eğikliğini uygula
  earthGroup.rotation.x = axialTilt.value * (Math.PI / 180);
  
  // Kamerayı güncelle
  updateCamera();
  
  // Kullanıcı kontrollerini güncelle
  if (controls.enabled) {
    controls.update();
  }
  
  // Sahneyi render et
  renderer.render(scene, camera);
};

// Pencere yeniden boyutlandırıldığında
const handleResize = () => {
  if (!threeContainer.value || !camera || !renderer) return;
  
  camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  
  // Mobil cihazlar için kamera konumunu ayarla
  if (window.innerWidth < 768) {
    if (cameraMode.value === 'free') {
      // Küçük ekranlarda daha yakın bir görünüm sağlayalım
      camera.position.set(0, 30, 40);
      controls.update();
    }
  }
};

// Özellikleri izle
watch(earthSize, () => {
  updateEarthGeometry();
  // Yörüngeyi de güncelle
  updateTurkeyMarker();
});

watch(axialTilt, () => {
  // Eksen eğikliği değiştiğinde özel işlemler yapılabilir
  updateSunRays();
});

watch(showOrbitalPath, (value) => {
  orbitalPath.visible = value;
});

watch(showSunRays, () => {
  updateSunRays();
});

watch(showTurkeyMarker, () => {
  updateTurkeyMarker();
});

// Bileşen yükleme
onMounted(() => {
  initScene();
  animate();
  // Başlangıç pozisyonunu 21 Aralık (kış gündönümü) olarak ayarla
  setEarthPosition(Math.PI*1.5);
  window.addEventListener('resize', handleResize);
  
  // Sayfa yüklendikten sonra ekran boyutunu kontrol et ve boyutlandır
  setTimeout(() => {
    handleResize();
  }, 100);
});

// Bileşen kaldırma
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  cancelAnimationFrame(animationFrameId);
  
  // Three.js nesnelerini temizle
  if (renderer) {
    renderer.dispose();
    threeContainer.value.removeChild(renderer.domElement);
  }
  
  // Belleği temizle
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
});

// Dünya şekli değiştirme
const changeEarthShape = (shape) => {
  currentEarthShape.value = shape;
  updateEarthGeometry();
  
  // Şekil değiştiğinde Türkiye işaretçisini güncelle
  updateTurkeyMarker();
};

// Dünya geometrisini güncelle
const updateEarthGeometry = () => {
  if (!earth) return;
  
  // Önceki geometriyi temizle
  if (earth.geometry) {
    earth.geometry.dispose();
  }
  
  // Yeni geometri oluştur
  let newGeometry;
  
  switch (currentEarthShape.value) {
    case 'sphere':
      newGeometry = new THREE.SphereGeometry(earthSize.value, 32, 32);
      break;
    case 'cylinder':
      newGeometry = new THREE.CylinderGeometry(
        cylinderDimensions.value.radius, 
        cylinderDimensions.value.radius, 
        cylinderDimensions.value.height, 
        cylinderDimensions.value.segments
      );
      break;
    case 'prism':
      newGeometry = new THREE.BoxGeometry(
        prismDimensions.value.width, 
        prismDimensions.value.height, 
        prismDimensions.value.depth
      );
      break;
    case 'cube':
      newGeometry = new THREE.BoxGeometry(
        cubeDimensions.value.size,
        cubeDimensions.value.size,
        cubeDimensions.value.size
      );
      break;
    default:
      newGeometry = new THREE.SphereGeometry(earthSize.value, 32, 32);
  }
  
  // Geometriyi değiştir
  earth.geometry = newGeometry;
  
  // Eğer materyal değiştiyse veya yoksa mavi materyali tekrar uygulayalım
  if (!earth.material || earth.material.type !== 'MeshStandardMaterial' || earth.material.color.getHex() !== earthColorOptions[earthColorIndex.value].color) {
    // Eski materyali temizle
    if (earth.material) {
      earth.material.dispose();
    }
    
    // Seçilen renk seçeneğini al
    const selectedColor = earthColorOptions[earthColorIndex.value];
    
    // Mavi mat materyali tekrar uygula - artık MeshStandardMaterial kullanıyoruz
    earth.material = new THREE.MeshStandardMaterial({
      color: selectedColor.color, // Seçilen mavi renk
      roughness: selectedColor.roughness, // Pürüzlülük (mat görünüm için)
      metalness: 0.1, // Düşük metalik değeri (0-1)
      transparent: earthOpacity.value < 1.0, 
      opacity: earthOpacity.value,
    });
  }
  
  // Eksen çizgisini güncelle
  if (axisHelper) {
    earthGroup.remove(axisHelper);
    
    // Şekle göre eksen uzunluğunu ayarla
    let axisLength;
    switch (currentEarthShape.value) {
      case 'sphere':
        axisLength = earthSize.value * 1.5;
        break;
      case 'cylinder':
        axisLength = cylinderDimensions.value.height * 0.8;
        break;
      case 'prism':
        axisLength = prismDimensions.value.height * 0.8;
        break;
      case 'cube':
        axisLength = cubeDimensions.value.size * 0.8;
        break;
      default:
        axisLength = earthSize.value * 1.5;
    }
    
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0),
      new THREE.Vector3(0, axisLength, 0)
    ]);
    axisHelper = new THREE.Line(axisGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
    earthGroup.add(axisHelper);
  }
  
  // Türkiye işaretçisini güncelle
  updateTurkeyMarker();
  
  // Ekvator ve dönenceler güncelleme
  updateEquatorAndTropics();
  
  // Parlaklık efektini güncelle
  updateEarthGlow(earthOpacity.value * 0.3);
};

// Dünya etrafına parlaklık efekti ekle
const updateEarthGlow = (intensity = 0.2) => {
  // Varsa önceki glow'u kaldır
  if (earthGlow) {
    earthGroup.remove(earthGlow);
    if (earthGlow.material) earthGlow.material.dispose();
    if (earthGlow.geometry) earthGlow.geometry.dispose();
  }
  
  // Şekil boyutlarına göre glow büyüklüğünü ayarla
  let glowSize;
  let glowGeometry;
  
  switch (currentEarthShape.value) {
    case 'sphere':
      glowSize = earthSize.value * 1.1;
      glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
      break;
    case 'cylinder':
      // Silindir için elipsoid glow
      glowSize = Math.max(cylinderDimensions.value.radius, cylinderDimensions.value.height / 2) * 1.1;
      glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
      break;
    case 'prism':
      // Prizma için elipsoid glow
      glowSize = Math.max(
        prismDimensions.value.width, 
        prismDimensions.value.height, 
        prismDimensions.value.depth
      ) * 0.6;
      glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
      break;
    case 'cube':
      glowSize = cubeDimensions.value.size * 0.6;
      glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
      break;
    default:
      glowSize = earthSize.value * 1.1;
      glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
  }
  
  const glowColor = new THREE.Color(earthColorOptions[earthColorIndex.value].color);
  

};

// Ekvator ve dönenceler güncelleme
const updateEquatorAndTropics = () => {
  // Önceki nesneleri kaldır
  if (equator) earth.remove(equator);
  
  // Tropikal bölgeleri temizle
  earth.children.forEach(child => {
    if (child.userData && child.userData.isTropic) {
      earth.remove(child);
    }
  });
  
  // Küresel şekil için ekvator ve dönenceler göster, değilse gizle
  if (currentEarthShape.value === 'sphere') {
    // Ekvator oluştur
    const equatorGeometry = new THREE.RingGeometry(earthSize.value + 0.01, earthSize.value + 0.1, 64);
    const equatorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    equator.rotation.x = Math.PI / 2;
    earth.add(equator);
    
    // Tropik bölgeleri oluştur
    const tropicLatitude = 23.5 * Math.PI / 180; // 23.5 derece
    
    // Yengeç Dönencesi (Kuzey)
    const cancerGeometry = new THREE.RingGeometry(earthSize.value + 0.01, earthSize.value + 0.05, 64);
    const cancerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const cancerTropic = new THREE.Mesh(cancerGeometry, cancerMaterial);
    cancerTropic.rotation.x = Math.PI / 2;
    cancerTropic.position.y = Math.sin(tropicLatitude) * earthSize.value;
    cancerTropic.scale.set(Math.cos(tropicLatitude), 1, Math.cos(tropicLatitude));
    cancerTropic.userData = { isTropic: true };
    earth.add(cancerTropic);
    
    // Oğlak Dönencesi (Güney)
    const capricornGeometry = new THREE.RingGeometry(earthSize.value + 0.01, earthSize.value + 0.05, 64);
    const capricornMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x6600ff, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const capricornTropic = new THREE.Mesh(capricornGeometry, capricornMaterial);
    capricornTropic.rotation.x = Math.PI / 2;
    capricornTropic.position.y = -Math.sin(tropicLatitude) * earthSize.value;
    capricornTropic.scale.set(Math.cos(tropicLatitude), 1, Math.cos(tropicLatitude));
    capricornTropic.userData = { isTropic: true };
    earth.add(capricornTropic);
  }
};

// Kamera modlarını değiştirme
const changeCameraMode = (mode) => {
  // Önceki modu devre dışı bırak
  if (cameraMode.value === 'free') {
    // Eğer şu an serbest moddaysa, kameranın mevcut durumunu kaydet
    previousCameraPosition.copy(camera.position);
    controls.target.clone(previousCameraTarget);
  }
  
  // Yeni modu etkinleştir
  cameraMode.value = mode;
  
  // Moda göre kamerayı konumlandır
  switch (mode) {
    case 'free':
      // Serbest mod - önceki kayıtlı konuma dön
      controls.enabled = true;
      if (previousCameraPosition.length() > 0) {
        camera.position.copy(previousCameraPosition);
        controls.target.copy(previousCameraTarget);
      } else {
        // İlk kez serbest moda geçiş yapılıyorsa, varsayılan bir konum belirle
        camera.position.set(0, 30, 60);
        controls.target.set(0, 0, 0);
      }
      break;
      
    case 'sun':
      // Güneşten dünyaya bakış modu - kamerayı güneşe sabitleyip dünyayı izle
      controls.enabled = false; // Kullanıcı kontrollerini devre dışı bırak
      camera.position.set(0, 5, 0); // Güneşin yakınına konumlandır
      break;
      
    case 'earth':
      // Dünya modu - dünyanın konumunu sürekli takip et
      controls.enabled = true;
      controls.target.copy(orbitalGroup.position); // Hedefi dünyaya ayarla
      
      // Dünya koordinatlarına göre kamerayı konumlandır
      const earthPos = new THREE.Vector3();
      earth.getWorldPosition(earthPos);
      
      // Dünyadan 15 birim uzakta olacak şekilde konumlandır
      const distance = 15;
      camera.position.set(
        earthPos.x + distance, 
        earthPos.y + distance/2, 
        earthPos.z + distance
      );
      break;
      
    case 'top':
      // Yukarıdan bakış - sistemin üzerine konumlandır
      controls.enabled = true;
      camera.position.set(0, 70, 0);
      controls.target.set(0, 0, 0);
      break;
      
    case 'side':
      // Yandan bakış
      controls.enabled = true;
      camera.position.set(70, 10, 0);
      controls.target.set(0, 0, 0);
      break;
  }
  
  controls.update();
};

// Kamera güncellemesi - animasyon döngüsü içinde çağrılacak
const updateCamera = () => {
  if (cameraMode.value === 'sun') {
    // Güneş modu - kamera güneşte, hedef dünyada
    const earthPos = new THREE.Vector3();
    orbitalGroup.getWorldPosition(earthPos);
    
    // Güneş konumuna (orijin) yakın bir noktada dur ve dünyaya bak
    camera.position.set(0, 5, 0);
    camera.lookAt(earthPos);
  }
  else if (cameraMode.value === 'earth') {
    // Dünya modu - dünyanın konumunu sürekli takip et
    const earthPos = new THREE.Vector3();
    orbitalGroup.getWorldPosition(earthPos);
    controls.target.copy(earthPos);
  }
};
</script>
  
 
 