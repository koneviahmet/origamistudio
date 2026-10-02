<template>
  <div class="w-full h-screen relative overflow-hidden" ref="container">
    <!-- Simülasyon Bilgisi -->
    <div class="absolute top-2 left-2 bg-black/50 text-white p-2 rounded z-10">
      <p>Seçili Figür: {{ selectedFigure ? selectedFigure.name : '' }}</p>
      <p v-if="compositionMode">Kompozisyon Modu: Aktif</p>
    </div>

    <!-- Başlat/Durdur Butonu -->
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
      <button 
        @click="isAnimating = !isAnimating" 
        class="px-4 py-2 rounded-lg text-white font-bold"
        :class="isAnimating ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
      >
        {{ isAnimating ? 'Durdur' : 'Başlat' }}
      </button>
      <button
        v-if="!compositionMode"
        @click="enableCompositionMode"
        class="px-4 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700"
      >
        Kompozisyon Modu
      </button>
      <button
        v-else
        @click="disableCompositionMode"
        class="px-4 py-2 rounded-lg text-white font-bold bg-yellow-600 hover:bg-yellow-700"
      >
        Tekli Mod
      </button>
    </div>

    <!-- Figür Navigasyon Butonları -->
    <div v-if="!compositionMode" class="absolute top-3/4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-4">
      <button 
        @click="navigateFigure('prev')" 
        class="px-4 py-2 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <span class="bg-black/50 px-3 py-1 rounded text-white">{{ figureIndex + 1 }} / {{ filteredFigures.length }}</span>
      <button 
        @click="navigateFigure('next')" 
        class="px-4 py-2 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Mobil için Ayarlar Butonu -->
    <div class="absolute top-2 left-2 md:hidden z-10">
      <button 
        @click="showMobileSettings = !showMobileSettings" 
        class="p-2 bg-gray-800 text-white rounded-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Mobil Ayarlar Modal -->
    <div v-if="showMobileSettings" class="fixed inset-0 bg-black/50 z-20 md:hidden flex items-center justify-center p-4">
      <div class="bg-gray-900 text-white p-4 rounded-lg max-h-[66vh] overflow-y-auto w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="showMobileSettings = false" class="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Mobil Ayarlar İçeriği -->
        <div class="space-y-4">
          <div v-if="!compositionMode">
            <label class="block mb-2">Kategori Seçimi</label>
            <select 
              v-model="selectedCategory" 
              class="w-full bg-gray-800 text-white p-2 rounded"
            >
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <div v-if="!compositionMode">
            <label class="block mb-2">Figür Seçimi</label>
            <select 
              v-model="selectedFigureId" 
              @change="changeFigure" 
              class="w-full bg-gray-800 text-white p-2 rounded"
            >
              <option v-for="figure in filteredFigures" :key="figure.id" :value="figure.id">
                {{ figure.name }}
              </option>
            </select>
          </div>

          <!-- Figür Varyasyonları -->
          <div v-if="!compositionMode && currentFigureVariations.length > 0">
            <label class="block mb-2">Figür Varyasyonu</label>
            <select 
              v-model="selectedVariation" 
              @change="changeVariation" 
              class="w-full bg-gray-800 text-white p-2 rounded"
            >
              <option v-for="(variation, index) in currentFigureVariations" :key="index" :value="index">
                {{ variation.name || `Varyasyon ${index + 1}` }}
              </option>
            </select>
          </div>

          <!-- Figür Animasyonları -->
          <div v-if="!compositionMode && currentFigureAnimations.length > 0">
            <label class="block mb-2">Animasyon Seçimi</label>
            <select 
              v-model="selectedAnimation" 
              @change="changeAnimation" 
              class="w-full bg-gray-800 text-white p-2 rounded"
            >
              <option value="">Varsayılan (Dönme)</option>
              <option v-for="(animation, index) in currentFigureAnimations" :key="index" :value="index">
                {{ animation.name || `Animasyon ${index + 1}` }}
              </option>
            </select>
          </div>

          <div v-if="compositionMode">
            <label class="block mb-2">Kompozisyon Ekleme</label>
            <div class="mb-2">
              <select 
                v-model="selectedCategory" 
                class="w-full bg-gray-800 text-white p-2 rounded mb-2"
              >
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
              <select 
                v-model="selectedCompFigureId" 
                class="w-full bg-gray-800 text-white p-2 rounded"
              >
                <option v-for="figure in filteredFigures" :key="figure.id" :value="figure.id">
                  {{ figure.name }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block mb-1 text-sm">Pozisyon X</label>
                <input type="range" v-model="compPosition.x" min="-5" max="5" step="0.1" class="w-full">
                <div class="text-xs text-center">{{ compPosition.x.toFixed(1) }}</div>
              </div>
              <div>
                <label class="block mb-1 text-sm">Pozisyon Y</label>
                <input type="range" v-model="compPosition.y" min="-3" max="3" step="0.1" class="w-full">
                <div class="text-xs text-center">{{ compPosition.y.toFixed(1) }}</div>
              </div>
              <div>
                <label class="block mb-1 text-sm">Pozisyon Z</label>
                <input type="range" v-model="compPosition.z" min="-5" max="5" step="0.1" class="w-full">
                <div class="text-xs text-center">{{ compPosition.z.toFixed(1) }}</div>
              </div>
              <div>
                <label class="block mb-1 text-sm">Ölçek</label>
                <input type="range" v-model="compScale" min="0.1" max="2" step="0.1" class="w-full">
                <div class="text-xs text-center">{{ compScale.toFixed(1) }}</div>
              </div>
            </div>
            <div class="flex justify-between mt-2">
              <button 
                @click="addToComposition" 
                class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
              >
                Ekle
              </button>
              <button 
                @click="clearComposition" 
                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
              >
                Kompozisyonu Temizle
              </button>
            </div>
          </div>

          <div>
            <label class="block mb-2">Animasyon Hızı</label>
            <input 
              type="range" 
              v-model="animationSpeed" 
              min="0.1" 
              max="5" 
              step="0.1" 
              class="w-full"
            >
            <div class="text-center">{{ animationSpeed.toFixed(1) }}</div>
          </div>

          <div>
            <label class="block mb-2">Arkaplan Rengi</label>
            <div class="grid grid-cols-4 gap-2">
              <button 
                v-for="color in backgroundColors" 
                :key="color.value"
                @click="changeBackgroundColor(color.value)"
                class="w-full h-8 rounded border border-gray-600"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              ></button>
            </div>
          </div>

          <div>
            <label class="block mb-2">Kamera Görünümü</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="view in cameraViews" 
                :key="view.id"
                @click="setCameraView(view.position, view.lookAt)"
                class="bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
              >
                {{ view.name }}
              </button>
            </div>
          </div>
          
          <div>
            <button 
              @click="resetSettings" 
              class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
            >
              Ayarları Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Ayarlar Paneli -->
    <div class="hidden md:block absolute right-0 top-0 bottom-0 w-80 bg-gray-900 text-white p-4 overflow-y-auto z-10 max-h-full">
      <h2 class="text-xl font-bold mb-4">Ayarlar</h2>
      
      <div class="space-y-4">
        <div v-if="!compositionMode">
          <label class="block mb-2">Kategori Seçimi</label>
          <select 
            v-model="selectedCategory" 
            class="w-full bg-gray-800 text-white p-2 rounded"
          >
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <div v-if="!compositionMode">
          <label class="block mb-2">Figür Seçimi</label>
          <select 
            v-model="selectedFigureId" 
            @change="changeFigure" 
            class="w-full bg-gray-800 text-white p-2 rounded"
          >
            <option v-for="figure in filteredFigures" :key="figure.id" :value="figure.id">
              {{ figure.name }}
            </option>
          </select>
        </div>

        <!-- Figür Varyasyonları -->
        <div v-if="!compositionMode && currentFigureVariations.length > 0">
          <label class="block mb-2">Figür Varyasyonu</label>
          <select 
            v-model="selectedVariation" 
            @change="changeVariation" 
            class="w-full bg-gray-800 text-white p-2 rounded"
          >
            <option v-for="(variation, index) in currentFigureVariations" :key="index" :value="index">
              {{ variation.name || `Varyasyon ${index + 1}` }}
            </option>
          </select>
        </div>

        <!-- Figür Animasyonları -->
        <div v-if="!compositionMode && currentFigureAnimations.length > 0">
          <label class="block mb-2">Animasyon Seçimi</label>
          <select 
            v-model="selectedAnimation" 
            @change="changeAnimation" 
            class="w-full bg-gray-800 text-white p-2 rounded"
          >
            <option value="">Varsayılan (Dönme)</option>
            <option v-for="(animation, index) in currentFigureAnimations" :key="index" :value="index">
              {{ animation.name || `Animasyon ${index + 1}` }}
            </option>
          </select>
        </div>

        <div v-if="compositionMode" class="border border-gray-700 p-3 rounded-lg">
          <label class="block mb-2 font-bold">Kompozisyon Ekleme</label>
          <div class="mb-4">
            <label class="block mb-1 text-sm">Kategori</label>
            <select 
              v-model="selectedCategory" 
              class="w-full bg-gray-800 text-white p-2 rounded mb-2"
            >
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <label class="block mb-1 text-sm">Figür</label>
            <select 
              v-model="selectedCompFigureId" 
              class="w-full bg-gray-800 text-white p-2 rounded"
            >
              <option v-for="figure in filteredFigures" :key="figure.id" :value="figure.id">
                {{ figure.name }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block mb-1 text-sm">Pozisyon X</label>
              <input type="range" v-model="compPosition.x" min="-5" max="5" step="0.1" class="w-full">
              <div class="text-xs text-center">{{ compPosition.x.toFixed(1) }}</div>
            </div>
            <div>
              <label class="block mb-1 text-sm">Pozisyon Y</label>
              <input type="range" v-model="compPosition.y" min="-3" max="3" step="0.1" class="w-full">
              <div class="text-xs text-center">{{ compPosition.y.toFixed(1) }}</div>
            </div>
            <div>
              <label class="block mb-1 text-sm">Pozisyon Z</label>
              <input type="range" v-model="compPosition.z" min="-5" max="5" step="0.1" class="w-full">
              <div class="text-xs text-center">{{ compPosition.z.toFixed(1) }}</div>
            </div>
            <div>
              <label class="block mb-1 text-sm">Ölçek</label>
              <input type="range" v-model="compScale" min="0.1" max="2" step="0.1" class="w-full">
              <div class="text-xs text-center">{{ compScale.toFixed(1) }}</div>
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <button 
              @click="addToComposition" 
              class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
            >
              Ekle
            </button>
            <button 
              @click="clearComposition" 
              class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
            >
              Kompozisyonu Temizle
            </button>
          </div>
        </div>

        <div>
          <label class="block mb-2">Animasyon Hızı</label>
          <input 
            type="range" 
            v-model="animationSpeed" 
            min="0.1" 
            max="5" 
            step="0.1" 
            class="w-full"
          >
          <div class="text-center">{{ animationSpeed.toFixed(1) }}</div>
        </div>

        <div>
          <label class="block mb-2">Arkaplan Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="color in backgroundColors" 
              :key="color.value"
              @click="changeBackgroundColor(color.value)"
              class="w-full h-8 rounded border border-gray-600"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
            ></button>
          </div>
        </div>

        <div>
          <label class="block mb-2">Kamera Görünümü</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              v-for="view in cameraViews" 
              :key="view.id"
              @click="setCameraView(view.position, view.lookAt)"
              class="bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
            >
              {{ view.name }}
            </button>
          </div>
        </div>
        
        <div>
          <button 
            @click="resetSettings" 
            class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import useModels from './compositions/useModels';

// DOM Referansı
const container = ref(null);

// Üç Boyutlu Sahne Bileşenleri
let scene, camera, renderer, controls;
let currentFigure = null;
let compositionGroup = null;

// Ayarlar ve Durum
const showMobileSettings = ref(false);
const isAnimating = ref(false);
const animationSpeed = ref(1.0);
const selectedFigureId = ref('cube');
const selectedFigure = ref({ name: 'Küp' });

// Figür navigasyonu için değişkenler
const figureIndex = ref(0);
const selectedVariation = ref(0);
const selectedAnimation = ref('');
const currentFigureVariations = ref([]);
const currentFigureAnimations = ref([]);

// Kompozisyon ayarları
const compositionMode = ref(false);
const compositionItems = ref([]);
const selectedCompFigureId = ref('cube');
const compPosition = ref({ x: 0, y: 0, z: 0 });
const compScale = ref(1.0);

// Tüm model ve kategorileri içe aktar
const modelsManager = useModels();

// Kategori ayarları
const selectedCategory = ref('all');

// Kategorileri modelsManager üzerinden al
const categories = modelsManager.categories;

// Arkaplan Renkleri
const backgroundColors = [
  { name: 'Koyu Gri', value: '#111827' },
  { name: 'Siyah', value: '#000000' },
  { name: 'Koyu Mavi', value: '#1e3a8a' },
  { name: 'Koyu Yeşil', value: '#064e3b' },
  { name: 'Koyu Kırmızı', value: '#7f1d1d' },
  { name: 'Koyu Mor', value: '#4c1d95' },
  { name: 'Açık Gri', value: '#f3f4f6' },
  { name: 'Açık Mavi', value: '#dbeafe' },
  { name: 'Açık Yeşil', value: '#d1fae5' },
  { name: 'Açık Kırmızı', value: '#fee2e2' },
  { name: 'Açık Mor', value: '#ede9fe' },
  { name: 'Bej', value: '#f5f5dc' },
];

// Kamera Görünümleri
const cameraViews = [
  { id: 'front', name: 'Önden Görünüm', position: [0, 0, 5], lookAt: [0, 0, 0] },
  { id: 'side', name: 'Yandan Görünüm', position: [5, 0, 0], lookAt: [0, 0, 0] },
  { id: 'top', name: 'Üstten Görünüm', position: [0, 5, 0], lookAt: [0, 0, 0] },
  { id: 'isometric', name: 'İzometrik', position: [3, 3, 3], lookAt: [0, 0, 0] },
  { id: 'reset', name: 'Sıfırla', position: [3, 3, 5], lookAt: [0, 0, 0] },
];

// Seçilen kategoriye göre figürleri filtrele
const filteredFigures = computed(() => {
  return modelsManager.getModelsByCategory(selectedCategory.value);
});

// Kompozisyon modunu etkinleştir
function enableCompositionMode() {
  compositionMode.value = true;
  
  // Mevcut figürü kaldır
  if (currentFigure) {
    scene.remove(currentFigure);
    currentFigure = null;
  }
  
  // Kompozisyon grubu oluştur
  compositionGroup = new THREE.Group();
  scene.add(compositionGroup);
}

// Kompozisyon modunu devre dışı bırak
function disableCompositionMode() {
  compositionMode.value = false;
  
  // Kompozisyon grubunu kaldır
  if (compositionGroup) {
    scene.remove(compositionGroup);
    compositionGroup = null;
  }
  
  // Tekli figür gösterimini geri getir
  changeFigure();
}

// Kompozisyona figür ekle
function addToComposition() {
  if (!compositionMode.value || !compositionGroup) return;
  
  // Figür bilgisini bul
  const figure = modelsManager.allModels.find(f => f.id === selectedCompFigureId.value);
  if (!figure) return;
  
  // Figürü oluştur (sabit renkli olarak)
  const figureObj = modelsManager.createModelWithFixedColors(selectedCompFigureId.value);
  
  // Pozisyon ve ölçeği ayarla
  figureObj.position.set(compPosition.value.x, compPosition.value.y, compPosition.value.z);
  figureObj.scale.set(compScale.value, compScale.value, compScale.value);
  
  // Zemin ayarlamasını yap (kuşlar hariç)
  if (!(figure.type === 'bird' || figure.category === 'birds' || 
      figure.tags?.includes('bird') || figure.tags?.includes('flying'))) {
    
    // Figürün alt kısmını zemine hizala - kompozisyon modunda sadece y pozisyonu ayarla
    // Bounding box hesapla
    const boundingBox = new THREE.Box3().setFromObject(figureObj);
    const bottomY = boundingBox.min.y;
    
    // Figürün alt noktasını zemin ile hizala (zemin y = -2)
    // Kullanıcı tarafından verilen y değerini koruyarak sadece gerekli kadar yukarı taşı
    const adjustedY = compPosition.value.y - bottomY + (-2);
    figureObj.position.y = adjustedY;
  }
  
  // Kompozisyon grubuna ekle
  compositionGroup.add(figureObj);
  
  // Kompozisyon öğelerini listesine ekle
  compositionItems.value.push({
    id: `${figure.id}-${Date.now()}`,
    figureId: figure.id,
    name: figure.name,
    position: { 
      x: compPosition.value.x, 
      y: figureObj.position.y, // Ayarlanmış y pozisyonunu kullan
      z: compPosition.value.z 
    },
    scale: compScale.value,
    object: figureObj
  });
  
  // Yeni figür için değerleri sıfırla
  selectedCompFigureId.value = modelsManager.allModels[0].id;
  compPosition.value = { x: 0, y: 0, z: 0 };
  compScale.value = 1.0;
}

// Kompozisyonu temizle
function clearComposition() {
  if (!compositionGroup) return;
  
  // Tüm figürleri kaldır
  while (compositionGroup.children.length > 0) {
    compositionGroup.remove(compositionGroup.children[0]);
  }
  
  // Kompozisyon öğelerini listesini temizle
  compositionItems.value = [];
}

// Sahneyi oluştur
function initScene() {
  // Temel Three.js bileşenlerini oluştur
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75, 
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  );
  
  // Renderer'ı oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);
  
  // Orbit Controls ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Kamerayı konumlandır
  setCameraView([3, 3, 5], [0, 0, 0]);
  
  // Arkaplan rengini ayarla
  scene.background = new THREE.Color('#dbeafe');
  
  // Işıkları ekle
  addLights();
  
  // Zemini ekle
  addFloor();
  
  // İlk figürü ekle
  changeFigure();
  
  // Animasyon döngüsünü başlat
  animate();
  
  // Pencere yeniden boyutlandığında güncelle
  window.addEventListener('resize', onWindowResize);
}

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);
  
  // Orbit Controls'u güncelle
  controls.update();
  
  // Figürü döndür (animasyon aktifse)
  if (isAnimating.value) {
    if (currentFigure) {
      currentFigure.rotation.y += 0.01 * animationSpeed.value;
      currentFigure.rotation.x += 0.005 * animationSpeed.value;
    }
    
    if (compositionMode.value && compositionGroup) {
      // Kompozisyon modunda tüm figürleri kendi eksenleri etrafında döndür
      compositionGroup.children.forEach(child => {
        child.rotation.y += 0.01 * animationSpeed.value;
        child.rotation.x += 0.005 * animationSpeed.value;
      });
    }
  }
  
  // Sahneyi render et
  renderer.render(scene, camera);
}

// Pencere boyutu değiştiğinde güncelle
function onWindowResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

// Figürü değiştir
function changeFigure() {
  if (compositionMode.value) return;
  
  // Mevcut figürü kaldır
  if (currentFigure) {
    scene.remove(currentFigure);
  }
  
  // Figür bilgisini bul
  const figure = modelsManager.allModels.find(f => f.id === selectedFigureId.value);
  if (!figure) return;
  
  selectedFigure.value = figure;
  
  // Figür indeksini güncelle
  const index = filteredFigures.value.findIndex(f => f.id === selectedFigureId.value);
  if (index !== -1) {
    figureIndex.value = index;
  }
  
  // Varyasyonları kontrol et ve güncelle
  currentFigureVariations.value = figure.variations || [];
  selectedVariation.value = 0; // Varyasyon seçimini sıfırla
  
  // Animasyonları kontrol et ve güncelle
  currentFigureAnimations.value = figure.animations || [];
  selectedAnimation.value = ''; // Animasyon seçimini sıfırla
  
  // Yeni figürü oluştur ve ekle (sabit renkli olarak)
  currentFigure = modelsManager.createModelWithFixedColors(selectedFigureId.value);
  scene.add(currentFigure);
  
  // Figürün zemine uygun yerleşimini sağla
  adjustFigurePosition(currentFigure, selectedFigureId.value);
}

// Arkaplan rengini değiştir
function changeBackgroundColor(color) {
  // Sahne arkaplan rengini güncelle
  scene.background = new THREE.Color(color);
  
  // Sadece sınır elemanlarını (duvarlar, tavan, zemin) güncelle
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && 
        object.userData && 
        object.userData.type === 'boundary') {
      if (object.material) {
        object.material.color.set(color);
      }
    }
  });
}

// Bir objenin figür parçası olup olmadığını kontrol et
function isPartOfFigure(object) {
  // Figür tek başına ise
  if (currentFigure && (object === currentFigure || object.parent === currentFigure)) {
    return true;
  }
  
  // Kompozisyon modunda ise
  if (compositionMode.value && compositionGroup) {
    // Kompozisyon grubunun bir parçası mı kontrol et
    let parent = object.parent;
    while (parent) {
      if (parent === compositionGroup || compositionGroup.children.includes(parent)) {
        return true;
      }
      parent = parent.parent;
    }
  }
  
  return false;
}

// Kamera konumunu ayarla
function setCameraView(position, lookAt) {
  camera.position.set(...position);
  controls.target.set(...lookAt);
  controls.update();
}

// Ayarları sıfırla
function resetSettings() {
  animationSpeed.value = 1.0;
  selectedFigureId.value = 'cube';
  selectedCategory.value = 'all';
  isAnimating.value = false;
  figureIndex.value = 0;
  selectedVariation.value = 0;
  selectedAnimation.value = '';
  setCameraView([3, 3, 5], [0, 0, 0]);
  changeBackgroundColor('#111827');
  
  if (compositionMode.value) {
    clearComposition();
  } else {
    changeFigure();
  }
}

// Işıkları ekle
function addLights() {
  // Ambiyans ışığı
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Yönlü ışık
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  
  // Nokta ışığı
  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(-5, 5, 5);
  scene.add(pointLight);
}

// Zemin ve duvarları oluştur
function addFloor() {
  // Oda boyutları
  const roomSize = 20;
  
  // Zemin
  const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: scene.background, 
    side: THREE.DoubleSide,
    roughness: 0.8
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  floor.userData.type = 'boundary'; // Sınır elemanı olarak işaretle
  scene.add(floor);
}

// İleri/geri navigasyonu ile figürler arasında geçiş
function navigateFigure(direction) {
  const figuresCount = filteredFigures.value.length;
  if (figuresCount === 0) return;
  
  if (direction === 'next') {
    figureIndex.value = (figureIndex.value + 1) % figuresCount;
  } else if (direction === 'prev') {
    figureIndex.value = (figureIndex.value - 1 + figuresCount) % figuresCount;
  }
  
  // Yeni figüre geç
  selectedFigureId.value = filteredFigures.value[figureIndex.value].id;
  changeFigure();
}

// Figür varyasyonunu değiştir
function changeVariation() {
  if (currentFigureVariations.value.length === 0) return;
  
  // Burada figür varyasyonunu değiştirme işlemi yapılacak
  // Varyasyon değişimi için modelsManager'dan ilgili metodu çağırabiliriz
  const variation = currentFigureVariations.value[selectedVariation.value];
  
  // Mevcut figürü kaldır
  if (currentFigure) {
    scene.remove(currentFigure);
  }
  
  // Seçilen varyasyonu görüntüle (Bu kısım modelsManager'ın yapısına göre değişebilir)
  try {
    if (variation.model) {
      currentFigure = variation.model.clone();
    } else {
      // Eğer varyasyon modeli hazır değilse, varyasyon bilgisini kullanarak oluştur
      currentFigure = modelsManager.createModelWithFixedColors(
        selectedFigureId.value, 
        { variationIndex: selectedVariation.value }
      );
    }
    scene.add(currentFigure);
    
    // Figürün zemine uygun yerleşimini sağla
    adjustFigurePosition(currentFigure, selectedFigureId.value);
  } catch (error) {
    console.error("Varyasyon değiştirilemedi:", error);
    changeFigure(); // Hata olursa standart figüre dön
  }
}

// Figür animasyonunu değiştir
function changeAnimation() {
  // Varsayılan animasyona dönüş
  if (selectedAnimation.value === '') {
    // Önceki özel animasyonu durdur ve varsayılan dönme animasyonuna dön
    // Bu fonksiyon içeriği useModels yapısına göre düzenlenmelidir
    return;
  }
  
  if (currentFigureAnimations.value.length === 0) return;
  
  // Burada seçilen animasyonu başlatma işlemi yapılacak
  const animation = currentFigureAnimations.value[selectedAnimation.value];
  
  // Burada animasyonu başlatmak için modelsManager'dan ilgili metodu çağırabiliriz
  // Bu kısım modelsManager'ın yapısına göre değişebilir
  try {
    if (typeof animation.play === 'function') {
      animation.play();
    }
  } catch (error) {
    console.error("Animasyon başlatılamadı:", error);
  }
}

// Figürün zemine uygun şekilde yerleştirilmesini sağla
function adjustFigurePosition(figure, figureId) {
  if (!figure) return;
  
  // Figür bilgisini al
  const figureInfo = modelsManager.allModels.find(f => f.id === figureId);
  if (!figureInfo) return;
  
  // Zemin pozisyonu
  const floorLevel = -2;
  
  // Varsayılan y pozisyonu (zemin seviyesinde)
  let yPosition = floorLevel;
  
  // Figür türüne göre yükseklik ayarlaması yap
  if (figureInfo.type === 'bird' || figureInfo.category === 'birds' || 
      figureInfo.tags?.includes('bird') || figureInfo.tags?.includes('flying')) {
    // Kuşlar için yüksekliği zemin seviyesinden yukarıda olacak şekilde ayarla
    yPosition = floorLevel + 1 + Math.random() * 2; // 1-3 birim yukarıda
  } else {
    // Diğer canlılar için ayak/taban seviyesi ayarlaması
    
    // Figürün bounding box'ını hesapla
    const boundingBox = new THREE.Box3().setFromObject(figure);
    const height = boundingBox.max.y - boundingBox.min.y;
    
    // Figürün alt noktasını bul
    const bottomPoint = boundingBox.min.y;
    
    // Figürün zemine tam temas etmesi için gereken ofset hesapla
    const offset = -bottomPoint;
    
    // Bazı özel canlı türlerini kontrol et ve ofset ayarla
    if (figureInfo.category === 'animals' || 
        figureInfo.type === 'animal' || 
        figureInfo.tags?.includes('animal')) {
      
      // Hayvan türüne göre özel ayarlamalar
      if (figureInfo.name.toLowerCase().includes('elephant') || 
          figureInfo.name.toLowerCase().includes('fil')) {
        yPosition = floorLevel + offset + 0.1; // Filller için az bir yükseklik
      } else if (figureInfo.name.toLowerCase().includes('giraffe') || 
                figureInfo.name.toLowerCase().includes('zürafa')) {
        yPosition = floorLevel + offset + 0.2; // Zürafalar için biraz daha yükseklik
      } else {
        // Diğer hayvanlar için standart pozisyon
        yPosition = floorLevel + offset;
      }
    } else {
      // Diğer canlı olmayan figürler için
      yPosition = floorLevel + offset;
    }
  }
  
  // Figürün y pozisyonunu ayarla
  figure.position.y = yPosition;
}

// Komponent oluşturulduğunda sahneyi başlat
onMounted(() => {
  initScene();
});

// Komponent yok edildiğinde temizlik yap
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  
  if (renderer) {
    renderer.dispose();
    container.value.removeChild(renderer.domElement);
  }
  
  if (controls) {
    controls.dispose();
  }
  
  // Geometrileri ve materyalleri temizle
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }
});
</script>
  
 
 