<template>
  <div class="w-full h-full flex flex-col bg-gray-900 text-white">

    
    <!-- Ana İçerik: Simülasyon ve Kontrol Paneli -->
    <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
      <!-- Simülasyon Alanı -->
      <div class="flex-1 relative" ref="sceneContainer">
        <!-- Three.js Canvas buraya render edilecek -->
        
        <!-- Animasyon Kontrol Butonu -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 items-center flex flex-col space-y-2 justify-center">
          <button 
            @click="toggleAnimation" 
            class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg"
          >
            {{ isAnimating ? 'Durdur' : 'Başlat' }}
          </button>

          <div class="mb-4 block lg:hidden">
            <select 
              v-model="selectedElementIndex" 
              class="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
              @change="changeElement"
            >
              <option v-for="(element, index) in elements" :key="index" :value="index">
                {{ element.atomicNumber }}. {{ element.name }} ({{ element.symbol }})
              </option>
            </select>
          </div>
        </div>
        
        <!-- Mobil Ayarlar Butonu -->
        <div class="md:hidden absolute top-4 left-4 z-20">
          <button 
            @click="showMobileSettings = !showMobileSettings" 
            class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        <!-- Element Bilgi Kartı -->
        <div class="absolute lg:bottom-8 lg:left-8 bottom-24  w-full lg:w-auto bg-gray-800 bg-opacity-70 p-4 rounded-lg text-sm z-10">
          <p>Element: <span class="font-bold text-pink-400">{{ selectedElement.name }} ({{ selectedElement.symbol }})</span></p>
          <p>Atom Numarası: <span class="font-bold text-pink-400">{{ selectedElement.atomicNumber }}</span></p>
          <p>Elektron Dizilimi: <span class="font-bold text-pink-400">{{ selectedElement.electronConfiguration.join(", ") }}</span></p>
          <p>Periyot: <span class="font-bold text-pink-400">{{ selectedElement.period }}</span></p>
          <p>Grup: <span class="font-bold text-pink-400">{{ selectedElement.group }}</span></p>
        </div>
        
        <!-- Element Detay Bilgisi -->
        <div v-if="showAtomInfo" class="absolute top-4 right-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg max-w-xs z-10">
          <h3 class="font-bold text-pink-400 mb-1">{{ selectedElement.name }} Hakkında</h3>
          <p class="text-sm mb-2">{{ selectedElement.description }}</p>
          <p class="text-sm">Periyodik tabloda {{ selectedElement.group }} grubunda yer alır.</p>
          <button @click="showAtomInfo = false" class="mt-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Kapat</button>
        </div>
        
        <!-- Mobil Ayarlar Modal -->
        <div v-if="showMobileSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 h-screen overflow-auto">
          <div class="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div class="p-4 border-b border-gray-700 flex justify-between items-center">
              <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <!-- Mobil Ayarlar İçeriği -->
              <!-- Element Seçici -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-semibold">Element Seçimi</label>
                <select 
                  v-model="selectedElementIndex" 
                  class="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
                  @change="changeElement"
                >
                  <option v-for="(element, index) in elements" :key="index" :value="index">
                    {{ element.atomicNumber }}. {{ element.name }} ({{ element.symbol }})
                  </option>
                </select>
              </div>
              
              <!-- Hız Kontrolü -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-semibold">Elektron Hızı</label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  v-model="speed"
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div class="flex justify-between text-xs mt-1">
                  <span>Yavaş</span>
                  <span>Hızlı</span>
                </div>
              </div>

              <!-- Kamera Kontrolleri -->
              <div class="mb-4">
                <h3 class="text-sm font-semibold mb-2">Kamera Görünümü</h3>
                
                <!-- Önceden Tanımlanmış Görünüm Açıları -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <button @click="setCameraView('top')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
                    Üstten Görünüm
                  </button>
                  <button @click="setCameraView('side')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
                    Yandan Görünüm
                  </button>
                  <button @click="setCameraView('front')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
                    Önden Görünüm
                  </button>
                  <button @click="setCameraView('isometric')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
                    İzometrik Görünüm
                  </button>
                </div>
                
                <div class="flex space-x-2">
                  <!-- Görünümü Sıfırla -->
                  <button @click="resetView" class="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
                    Görünümü Sıfırla
                  </button>
                  
                  <!-- Kamera Rotasyonu -->
                  <button 
                    @click="rotateCamera = !rotateCamera" 
                    class="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md text-xs transition-colors"
                  >
                    {{ rotateCamera ? 'Dönüşü Durdur' : 'Döndür' }}
                  </button>
                </div>
              </div>

              <!-- Görünürlük Kontrolleri -->
              <div class="mb-4">
                <h3 class="text-sm font-semibold mb-2">Görünürlük</h3>
                <div class="space-y-2">
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" v-model="showOrbits" class="form-checkbox h-4 w-4 text-blue-500" />
                    <span>Yörüngeler</span>
                  </label>
                  <template v-for="(shell, index) in electronShells" :key="index">
                    <label v-if="shell.electrons > 0" class="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        v-model="shell.visible" 
                        class="form-checkbox h-4 w-4 text-blue-500" 
                      />
                      <span>{{ index + 1 }}. Elektron Katmanı</span>
                    </label>
                  </template>
                </div>
              </div>
              
              <!-- Arkaplan Rengi -->
              <div class="mb-4">
                <h3 class="text-sm font-semibold mb-2">Arkaplan Rengi</h3>
                <div class="grid grid-cols-4 gap-2">
                  <button 
                    v-for="color in backgroundColors" 
                    :key="color.name"
                    @click="changeBackgroundColor(color.value)"
                    class="w-full h-8 rounded-md border border-gray-600"
                    :style="{ backgroundColor: color.hex }"
                    :title="color.name"
                  ></button>
                </div>
              </div>

              <!-- Diğer Kontroller -->
              <div class="mb-4">
                <h3 class="text-sm font-semibold mb-2">Seçenekler</h3>
                <button 
                  @click="showAtomInfo = !showAtomInfo; showMobileSettings = false;" 
                  class="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                >
                  Element Bilgisini {{ showAtomInfo ? 'Gizle' : 'Göster' }}
                </button>
              </div>
              
              <!-- Ayarları Sıfırla -->
              <div v-if="isSettingsChanged" class="mt-4">
                <button 
                  @click="resetSettings" 
                  class="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Ayarları Sıfırla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Kontrol Paneli (Masaüstü) -->
      <div class="hidden md:block w-72 bg-gray-800 p-4 overflow-y-auto">
        
        <!-- Element Seçici -->
        <div class="mb-4">
          <label class="block mb-2 text-sm font-semibold">Element Seçimi</label>
          <select 
            v-model="selectedElementIndex" 
            class="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
            @change="changeElement"
          >
            <option v-for="(element, index) in elements" :key="index" :value="index">
              {{ element.atomicNumber }}. {{ element.name }} ({{ element.symbol }})
            </option>
          </select>
        </div>
        
        <!-- Hız Kontrolü -->
        <div class="mb-4">
          <label class="block mb-2 text-sm font-semibold">Elektron Hızı</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            v-model="speed"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs mt-1">
            <span>Yavaş</span>
            <span>Hızlı</span>
          </div>
        </div>

        <!-- Kamera Kontrolleri -->
        <div class="mb-4">
          <h3 class="text-sm font-semibold mb-2">Kamera Görünümü</h3>
          
          <!-- Önceden Tanımlanmış Görünüm Açıları -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button @click="setCameraView('top')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
              Üstten Görünüm
            </button>
            <button @click="setCameraView('side')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
              Yandan Görünüm
            </button>
            <button @click="setCameraView('front')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
              Önden Görünüm
            </button>
            <button @click="setCameraView('isometric')" class="py-2 px-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
              İzometrik Görünüm
            </button>
          </div>
          
          <div class="flex space-x-2 mb-3">
            <!-- Görünümü Sıfırla -->
            <button @click="resetView" class="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">
              Görünümü Sıfırla
            </button>
            
            <!-- Kamera Rotasyonu -->
            <button 
              @click="rotateCamera = !rotateCamera" 
              class="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md text-xs transition-colors"
            >
              {{ rotateCamera ? 'Dönüşü Durdur' : 'Döndür' }}
            </button>
          </div>
        </div>

        <!-- Görünürlük Kontrolleri -->
        <div class="mb-4">
          <h3 class="text-sm font-semibold mb-2">Görünürlük</h3>
          <div class="space-y-2">
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="showOrbits" class="form-checkbox h-4 w-4 text-blue-500" />
              <span>Yörüngeler</span>
            </label>
            <template v-for="(shell, index) in electronShells" :key="index">
              <label v-if="shell.electrons > 0" class="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  v-model="shell.visible" 
                  class="form-checkbox h-4 w-4 text-blue-500" 
                />
                <span>{{ index + 1 }}. Elektron Katmanı</span>
              </label>
            </template>
          </div>
        </div>
        
        <!-- Arkaplan Rengi -->
        <div class="mb-4">
          <h3 class="text-sm font-semibold mb-2">Arkaplan Rengi</h3>
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="color in backgroundColors" 
              :key="color.name"
              @click="changeBackgroundColor(color.value)"
              class="w-full h-8 rounded-md border border-gray-600"
              :style="{ backgroundColor: color.hex }"
              :title="color.name"
            ></button>
          </div>
        </div>

        <!-- Diğer Kontroller -->
        <div class="mb-4">
          <h3 class="text-sm font-semibold mb-2">Seçenekler</h3>
          <button 
            @click="showAtomInfo = !showAtomInfo" 
            class="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
          >
            Element Bilgisini {{ showAtomInfo ? 'Gizle' : 'Göster' }}
          </button>
        </div>
        
        <!-- Ayarları Sıfırla -->
        <div v-if="isSettingsChanged" class="mt-4">
          <button 
            @click="resetSettings" 
            class="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// İlk 18 element için veri
const elements = [
  {
    name: "Hidrojen",
    symbol: "H",
    atomicNumber: 1,
    electronConfiguration: [1],
    color: 0xff3366,
    description: "Periyodik tablonun ilk elementi olan Hidrojen, evrendeki en basit ve en yaygın elementtir. Bir proton ve bir elektrondan oluşur.",
    group: "1A",
    period: 1
  },
  {
    name: "Helyum",
    symbol: "He",
    atomicNumber: 2,
    electronConfiguration: [2],
    color: 0xff9933,
    description: "Helyum, periyodik tablonun soy gazlar grubunda yer alan ikinci elementtir. Düşük yoğunluğu nedeniyle balonlarda kullanılır.",
    group: "8A",
    period: 1
  },
  {
    name: "Lityum",
    symbol: "Li",
    atomicNumber: 3,
    electronConfiguration: [2, 1],
    color: 0x3366ff,
    description: "Lityum, alkali metaller grubunun ilk üyesidir. Piller ve ilaç yapımında kullanılır.",
    group: "1A",
    period: 2
  },
  {
    name: "Berilyum",
    symbol: "Be",
    atomicNumber: 4,
    electronConfiguration: [2, 2],
    color: 0x33cc33,
    description: "Berilyum, toprak alkali metaller grubunun ilk üyesidir. Yüksek ısı direnci nedeniyle uzay araçlarında kullanılır.",
    group: "2A",
    period: 2
  },
  {
    name: "Bor",
    symbol: "B",
    atomicNumber: 5,
    electronConfiguration: [2, 3],
    color: 0x996633,
    description: "Bor, yarı metal özellikler gösteren bir elementtir. Cam ve deterjan yapımında kullanılır.",
    group: "3A",
    period: 2
  },
  {
    name: "Karbon",
    symbol: "C",
    atomicNumber: 6,
    electronConfiguration: [2, 4],
    color: 0x333333,
    description: "Karbon, canlı organizmaların temel yapı taşıdır. Elmas ve grafit gibi farklı formları bulunur.",
    group: "4A",
    period: 2
  },
  {
    name: "Azot",
    symbol: "N",
    atomicNumber: 7,
    electronConfiguration: [2, 5],
    color: 0x3366cc,
    description: "Azot, atmosferin yaklaşık %78'ini oluşturur. Bitki beslenmesi için hayati öneme sahiptir.",
    group: "5A",
    period: 2
  },
  {
    name: "Oksijen",
    symbol: "O",
    atomicNumber: 8,
    electronConfiguration: [2, 6],
    color: 0xff6633,
    description: "Oksijen, canlıların solunumu için gerekli olan hayati bir elementtir. Atmosferin yaklaşık %21'ini oluşturur.",
    group: "6A",
    period: 2
  },
  {
    name: "Flor",
    symbol: "F",
    atomicNumber: 9,
    electronConfiguration: [2, 7],
    color: 0x33cc99,
    description: "Flor, periyodik tablodaki en reaktif elementtir. Diş macunlarında ve soğutucu gazlarda kullanılır.",
    group: "7A",
    period: 2
  },
  {
    name: "Neon",
    symbol: "Ne",
    atomicNumber: 10,
    electronConfiguration: [2, 8],
    color: 0xff3366,
    description: "Neon, periyodik tablonun 10. elementi olup soy gazlar grubunda yer alır. Renksiz, kokusuz bir gazdır ve neon tabelaların parlak kırmızı ışıklarında kullanılır.",
    group: "8A",
    period: 2
  },
  {
    name: "Sodyum",
    symbol: "Na",
    atomicNumber: 11,
    electronConfiguration: [2, 8, 1],
    color: 0xcccc33,
    description: "Sodyum, alkali metaller grubuna aittir. Tuz (NaCl) yapısında yaygın olarak bulunur ve vücut için önemlidir.",
    group: "1A",
    period: 3
  },
  {
    name: "Magnezyum",
    symbol: "Mg",
    atomicNumber: 12,
    electronConfiguration: [2, 8, 2],
    color: 0xcccccc,
    description: "Magnezyum, toprak alkali metaller grubuna aittir. Hafif bir metaldir ve alaşımlar için önemlidir.",
    group: "2A",
    period: 3
  },
  {
    name: "Alüminyum",
    symbol: "Al",
    atomicNumber: 13,
    electronConfiguration: [2, 8, 3],
    color: 0x999999,
    description: "Alüminyum, hafif ve korozyona dayanıklı bir metaldir. Uçak yapımı ve ambalaj endüstrisinde kullanılır.",
    group: "3A",
    period: 3
  },
  {
    name: "Silisyum",
    symbol: "Si",
    atomicNumber: 14,
    electronConfiguration: [2, 8, 4],
    color: 0x666666,
    description: "Silisyum, yer kabuğunun oksijenden sonra en bol bulunan elementi. Elektronik çiplerin yapımında kullanılır.",
    group: "4A",
    period: 3
  },
  {
    name: "Fosfor",
    symbol: "P",
    atomicNumber: 15,
    electronConfiguration: [2, 8, 5],
    color: 0xff9900,
    description: "Fosfor, DNA ve hücre zarlarının yapısında yer alan önemli bir elementtir. Gübre yapımında kullanılır.",
    group: "5A",
    period: 3
  },
  {
    name: "Kükürt",
    symbol: "S",
    atomicNumber: 16,
    electronConfiguration: [2, 8, 6],
    color: 0xffcc00,
    description: "Kükürt, ateş ve barut yapımında kullanılan sarı renkli bir elementtir. Protein yapısında bulunur.",
    group: "6A",
    period: 3
  },
  {
    name: "Klor",
    symbol: "Cl",
    atomicNumber: 17,
    electronConfiguration: [2, 8, 7],
    color: 0x33cc33,
    description: "Klor, sarımsı-yeşil renkli zehirli bir gazdır. Dezenfektan olarak ve su arıtımında kullanılır.",
    group: "7A",
    period: 3
  },
  {
    name: "Argon",
    symbol: "Ar",
    atomicNumber: 18,
    electronConfiguration: [2, 8, 8],
    color: 0x9966ff,
    description: "Argon, periyodik tablodaki soy gazların üçüncü üyesidir. Ampullerin içinde ve kaynak işlemlerinde kullanılır.",
    group: "8A",
    period: 3
  }
];

// Referanslar ve durum değişkenleri
const sceneContainer = ref(null);
const speed = ref(0.5);
const showOrbits = ref(true);
const rotateCamera = ref(false);
const showAtomInfo = ref(false);
const selectedElementIndex = ref(9); // Varsayılan olarak Neon (10. element, indeks 9)
const showMobileSettings = ref(false); // Mobil ayarlar modalı için
const isAnimating = ref(true); // Animasyon durumu
const defaultSpeed = 0.5; // Varsayılan hız değeri

// Arkaplan renkleri
const backgroundColors = [
  { name: 'Koyu Gri', value: 0x111827, hex: '#111827' },
  { name: 'Siyah', value: 0x000000, hex: '#000000' },
  { name: 'Lacivert', value: 0x1e3a8a, hex: '#1e3a8a' },
  { name: 'Mor', value: 0x4c1d95, hex: '#4c1d95' },
  { name: 'Yeşil', value: 0x064e3b, hex: '#064e3b' },
  { name: 'Kırmızı', value: 0x7f1d1d, hex: '#7f1d1d' },
  { name: 'Turuncu', value: 0x7c2d12, hex: '#7c2d12' },
  { name: 'Pembe', value: 0x831843, hex: '#831843' },
];

// Ayarların değişip değişmediğini kontrol et
const isSettingsChanged = computed(() => {
  return speed.value !== defaultSpeed || 
         rotateCamera.value !== false || 
         showOrbits.value !== true ||
         electronShells.some(shell => !shell.visible);
});

// Seçilen element için hesaplanan değer
const selectedElement = computed(() => elements[selectedElementIndex.value]);

// Maksimum 3 elektron kabuğu (ilk 18 element için yeterli)
const electronShells = reactive([
  { radius: 3, color: 0x3b82f6, electrons: 0, visible: true },
  { radius: 5, color: 0x8b5cf6, electrons: 0, visible: true },
  { radius: 7, color: 0xec4899, electrons: 0, visible: true }
]);

// Three.js nesneleri için değişkenler
let scene, camera, renderer, controls;
let nucleus;
let electronGroups = []; // Her katman için bir grup
let orbits = [];
let electrons = []; // Tüm elektronlar
let electronMeshes = []; // Elektron mesh'leri
let frameId = null;
let currentBackgroundColor = 0x111827; // Varsayılan arkaplan rengi

// Atom ölçekleri
const nucleusRadius = 1;
const electronRadius = 0.2;

// Animasyonu başlat/durdur
const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value;
  
  if (!isAnimating.value && frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  } else if (isAnimating.value && !frameId) {
    animate();
  }
};

// Arkaplan rengini değiştir
const changeBackgroundColor = (colorValue) => {
  currentBackgroundColor = colorValue;
  if (scene) {
    scene.background = new THREE.Color(colorValue);
  }
};

// Ayarları sıfırla
const resetSettings = () => {
  speed.value = defaultSpeed;
  rotateCamera.value = false;
  showOrbits.value = true;
  
  // Tüm elektron katmanlarını görünür yap
  electronShells.forEach(shell => {
    shell.visible = true;
  });
  
  // Arkaplan rengini sıfırla
  changeBackgroundColor(0x111827);
  
  // Animasyonu durdur
  if (isAnimating.value) {
    toggleAnimation();
  }
  
  // Görünürlük ayarlarını güncelle
  updateVisibility();
};

// Three.js sahnesini başlat
const initThree = () => {
  if (!sceneContainer.value) return;
  
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(currentBackgroundColor);
  
  // Kamera oluştur
  const width = sceneContainer.value.clientWidth;
  const height = sceneContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 15;
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  sceneContainer.value.appendChild(renderer.domElement);
  
  // Kontroller ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);
  
  // Elektron gruplarını hazırla
  electronGroups = electronShells.map(() => {
    const group = new THREE.Group();
    scene.add(group);
    return group;
  });
  
  // Yörüngeleri oluştur
  electronShells.forEach((shell) => {
    createOrbit(shell.radius, shell.color);
  });
  
  // Atom modelini oluştur
  createAtomModel();
  
  // Pencere boyutu değişikliklerini izle
  window.addEventListener('resize', onWindowResize);
  
  // İzometrik görünümle başlat
  setCameraView('isometric');
  
  // Animasyonu başlat
  animate();
};

// Elektron katmanlarını güncelle
const updateElectronShells = () => {
  // Seçilen elementin elektron konfigürasyonuna göre katmanları güncelle
  const config = selectedElement.value.electronConfiguration;
  
  // Önce tüm katmanları sıfırla
  electronShells.forEach(shell => { shell.electrons = 0; });
  
  // Sonra konfigürasyona göre doldur
  config.forEach((count, index) => {
    if (index < electronShells.length) {
      electronShells[index].electrons = count;
    }
  });
};

// Atom modelini oluştur
const createAtomModel = () => {
  // Öncelikle elektron kabuklarını güncelle
  updateElectronShells();
  
  // Eğer önceden oluşturulmuş bir çekirdek varsa temizle
  if (nucleus) {
    scene.remove(nucleus);
  }
  
  // Elektronları temizle
  electronGroups.forEach(group => {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
  });
  electronMeshes = [];
  
  // Çekirdek oluştur
  const nucleusGeometry = new THREE.SphereGeometry(nucleusRadius, 32, 32);
  const nucleusMaterial = new THREE.MeshPhongMaterial({ 
    color: selectedElement.value.color,
    emissive: selectedElement.value.color,
    emissiveIntensity: 0.3,
    shininess: 50
  });
  nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  scene.add(nucleus);
  
  // Element sembolü için canvas texture oluştur
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.font = 'Bold 80px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(selectedElement.value.symbol, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const labelGeometry = new THREE.PlaneGeometry(1, 1);
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, 0, 1.1);
  label.scale.set(1.5, 1.5, 1);
  nucleus.add(label);
  
  // Elektronları oluştur
  electrons = [];
  
  // Her katman için
  electronShells.forEach((shell, shellIndex) => {
    const count = shell.electrons;
    if (count <= 0) return;
    
    const shellElectrons = [];
    
    // Her katmandaki elektronlar için
    for (let i = 0; i < count; i++) {
      shellElectrons.push({
        angle: (Math.PI * 2 / count) * i, // Eşit aralıklarla yerleştir
        speed: 0.01 / (shellIndex + 1) // Dıştaki katmanlar daha yavaş hareket eder
      });
    }
    
    // Elektron mesh'lerini oluştur
    const electronGeometry = new THREE.SphereGeometry(electronRadius, 16, 16);
    const electronMaterial = new THREE.MeshPhongMaterial({ 
      color: shell.color,
      emissive: shell.color,
      emissiveIntensity: 0.5
    });
    
    shellElectrons.forEach(electron => {
      const mesh = new THREE.Mesh(electronGeometry, electronMaterial);
      updateElectronPosition(mesh, electron, shell.radius);
      electronGroups[shellIndex].add(mesh);
      electronMeshes.push(mesh);
    });
    
    electrons.push(shellElectrons);
  });
  
  // Görünürlük kontrollerini güncelle
  updateVisibility();
};

// Element değiştirme fonksiyonu
const changeElement = () => {
  createAtomModel();
};

// Yörünge oluşturma fonksiyonu
const createOrbit = (radius, color) => {
  // Sadece tek bir torus (dairesel yörünge) oluştur
  const orbitGeometry = new THREE.TorusGeometry(radius, 0.02, 16, 100);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  
  // XZ düzleminde yatay olarak konumlandır
  orbit.rotation.x = Math.PI / 2;
  
  scene.add(orbit);
  orbits.push(orbit);
};

// Elektron pozisyonunu güncelleme fonksiyonu
const updateElectronPosition = (electron, pos, radius) => {
  // Düzgün dairesel hareket için 2 boyutlu konum güncelleme
  electron.position.x = radius * Math.cos(pos.angle);
  electron.position.y = 0; // Y ekseninde sabit tut (2D hareket için)
  electron.position.z = radius * Math.sin(pos.angle);
};

// Animasyon döngüsü
const animate = () => {
  frameId = requestAnimationFrame(animate);
  
  // Elektronların pozisyonlarını güncelle
  const speedFactor = speed.value;
  
  if (isAnimating.value) {
    electrons.forEach((shellElectrons, shellIndex) => {
      if (electronShells[shellIndex].visible) {
        shellElectrons.forEach((pos, electronIndex) => {
          // Her elektronun açısını güncelle
          pos.angle += pos.speed * speedFactor;
          
          // Karşılık gelen mesh'i güncelle (eğer varsa)
          const electronGroup = electronGroups[shellIndex];
          if (electronIndex < electronGroup.children.length) {
            updateElectronPosition(electronGroup.children[electronIndex], pos, electronShells[shellIndex].radius);
          }
        });
      }
    });
  }
  
  // Kamera dönüşü
  if (rotateCamera.value) {
    camera.position.x = 15 * Math.cos(Date.now() * 0.0005);
    camera.position.z = 15 * Math.sin(Date.now() * 0.0005);
    camera.lookAt(scene.position);
  }
  
  controls.update();
  renderer.render(scene, camera);
};

// Görünürlük ayarlarını güncelle
const updateVisibility = () => {
  // Yörüngelerin görünürlüğü
  orbits.forEach((orbit, index) => {
    if (index < electronShells.length) {
      orbit.visible = showOrbits.value && electronShells[index].electrons > 0;
    } else {
      orbit.visible = false;
    }
  });
  
  // Elektron gruplarının görünürlüğü
  electronGroups.forEach((group, index) => {
    if (index < electronShells.length) {
      group.visible = electronShells[index].visible && electronShells[index].electrons > 0;
    } else {
      group.visible = false;
    }
  });
};

// Kamera hareket fonksiyonları
const moveCamera = (direction) => {
  const step = 1;
  switch (direction) {
    case 'up':
      camera.position.y += step;
      break;
    case 'down':
      camera.position.y -= step;
      break;
    case 'left':
      camera.position.x -= step;
      break;
    case 'right':
      camera.position.x += step;
      break;
  }
  camera.lookAt(scene.position);
};

// Yakınlaştırma/Uzaklaştırma fonksiyonu
const zoomCamera = (direction) => {
  const zoomStep = 2;
  const currentDistance = Math.sqrt(
    camera.position.x * camera.position.x + 
    camera.position.y * camera.position.y + 
    camera.position.z * camera.position.z
  );
  
  // Yön vektörü hesapla
  const dirVector = new THREE.Vector3(
    camera.position.x / currentDistance,
    camera.position.y / currentDistance,
    camera.position.z / currentDistance
  );
  
  // Yakınlaştırma/Uzaklaştırma için yeni mesafe
  const newDistance = direction === 'in' ? 
    Math.max(5, currentDistance - zoomStep) :  // Minimum 5 birim uzaklık
    currentDistance + zoomStep;
  
  // Yeni kamera pozisyonu
  camera.position.set(
    dirVector.x * newDistance,
    dirVector.y * newDistance,
    dirVector.z * newDistance
  );
};

// Pencere boyutu değiştiğinde
const onWindowResize = () => {
  if (!sceneContainer.value) return;
  
  const width = sceneContainer.value.clientWidth;
  const height = sceneContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

// Görünümü sıfırla
const resetView = () => {
  camera.position.set(0, 0, 15);
  camera.lookAt(scene.position);
  controls.reset();
};

// Kamera açı fonksiyonu
const setCameraView = (viewType) => {
  // Önce otomatik dönüşü kapat
  rotateCamera.value = false;
  
  const distance = 15; // Standart mesafe
  
  switch (viewType) {
    case 'top':
      // Üstten görünüm (Y ekseninden)
      camera.position.set(0, distance, 0);
      break;
    case 'side':
      // Yandan görünüm (X ekseninden)
      camera.position.set(distance, 0, 0);
      break;
    case 'front':
      // Önden görünüm (Z ekseninden)
      camera.position.set(0, 0, distance);
      break;
    case 'isometric':
      // İzometrik görünüm (Her eksenden eşit uzaklıkta)
      const isoDistance = distance / Math.sqrt(3);
      camera.position.set(isoDistance, isoDistance, isoDistance);
      break;
  }
  
  camera.lookAt(scene.position);
  controls.update();
};

// Görünürlük izleyicileri
watch(showOrbits, updateVisibility);

electronShells.forEach((shell, index) => {
  watch(() => shell.visible, updateVisibility);
});

// Temizlik fonksiyonu
const cleanup = () => {
  if (frameId) {
    cancelAnimationFrame(frameId);
  }
  
  if (renderer && sceneContainer.value) {
    sceneContainer.value.removeChild(renderer.domElement);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // Three.js nesnelerini temizle
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    });
  }
  
  renderer = null;
  scene = null;
  camera = null;
  controls = null;
};

onMounted(() => {
  initThree();
});

onUnmounted(() => {
  cleanup();
});
</script>
 