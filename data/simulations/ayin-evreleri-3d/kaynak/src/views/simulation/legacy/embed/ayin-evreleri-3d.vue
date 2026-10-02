<template>
  <div class="w-full h-screen bg-gray-900 flex flex-col overflow-hidden relative">

    <!-- Ana içerik alanı -->
    <div class="flex flex-col lg:flex-row flex-1 relative">
      <!-- Simülasyon alanı -->
      <div class="flex-1 relative">
        <!-- Three.js canvas -->
        <canvas ref="threeCanvas" class="w-full h-full"></canvas>
        
        <!-- Animasyon başlat/durdur butonu -->
        <div class="absolute left-1/2 -translate-x-1/2 top-4 text-white md:hidden">
          <button 
            @click="toggleAnimation" 
            class="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            {{ isAnimating ? 'Durdur' : 'Başlat' }}
          </button>
        </div>

        <!-- Ay evresi göstergesi -->
        <div class="absolute top-4 left-4 p-3 bg-gray-800 rounded-lg bg-opacity-80 text-white">
          <div class="text-center mb-2 text-sm">{{ currentPhaseName }}</div>
          <div class="flex items-center space-x-2">
            <div class="text-8xl">{{ currentPhaseEmoji }}</div>
          </div>
        </div>
        
        <!-- Mobil cihazlar için ayarlar butonu -->
        <div class="lg:hidden absolute right-4 top-4">
          <button 
            @click="showMobileSettings = !showMobileSettings" 
            class="p-3 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Kontrol paneli - Masaüstü -->
      <div class="hidden lg:block w-80 bg-gray-800 p-4 text-white h-full overflow-y-auto">        
        <div class="space-y-4">
          <div>
            <button 
              @click="toggleAnimation" 
              class="w-full py-2 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            >
              {{ isAnimating ? 'Durdur' : 'Başlat' }}
            </button>
          </div>
          
          <div>
            <label class="block mb-2 text-sm">Simülasyon Hızı</label>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              v-model="simulationSpeed"
              class="w-full"
            />
            <div class="flex justify-between text-xs mt-1">
              <span>Yavaş</span>
              <span>Hızlı</span>
            </div>
          </div>
          
          <!-- Cisim Ölçekleri bölümü -->
          <div class="border-t border-gray-700 pt-4">
            <label class="block mb-2 text-sm">Gök Cisimlerinin Ölçekleri</label>
            
            <!-- Güneş ölçeği -->
            <div class="mb-2">
              <div class="flex justify-between text-xs mb-1">
                <span>Güneş Ölçeği</span>
                <span>{{ sunScale }}</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.1" 
                v-model="sunScale"
                class="w-full"
              />
            </div>
            
            <!-- Dünya ölçeği -->
            <div class="mb-2">
              <div class="flex justify-between text-xs mb-1">
                <span>Dünya Ölçeği</span>
                <span>{{ earthScale }}</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                v-model="earthScale"
                class="w-full"
              />
            </div>
            
            <!-- Ay ölçeği -->
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>Ay Ölçeği</span>
                <span>{{ moonScale }}</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                v-model="moonScale"
                class="w-full"
              />
            </div>
          </div>
          
 
          
          <!-- Kamera görünümü butonları -->
          <div>
            <label class="block mb-2 text-sm">Kamera Görünümü</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="setCameraView('top')"
                class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Üstten Görünüm
              </button>
              <button 
                @click="setCameraView('side')"
                class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Yandan Görünüm
              </button>
              <button 
                @click="setCameraView('front')"
                class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Önden Görünüm
              </button>
              <button 
                @click="setCameraView('isometric')"
                class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                İzometrik Görünüm
              </button>
              <button 
                @click="toggleMoonTracking()"
                class="py-1 px-2 text-xs bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                :class="{'bg-purple-800': isTrackingMoon}"
              >
                {{ isTrackingMoon ? 'Takibi Durdur' : 'Ayı Takip Et' }}
              </button>
              <button 
                @click="resetCameraView()"
                class="py-1 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Görünümü Sıfırla
              </button>
            </div>
            
            <!-- Ay takip mesafesi ayarı -->
            <div 
              v-if="isTrackingMoon"
              class="mt-2 bg-gray-700 p-2 rounded-md"
            >
              <label class="block mb-1 text-xs">Takip Mesafesi</label>
              <div class="flex items-center gap-2">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.1" 
                  v-model="trackingDistance"
                  class="w-full"
                />
                <span class="text-xs whitespace-nowrap">{{ trackingDistance }} birim</span>
              </div>
            </div>
          </div>
          
          <!-- Evre seçimi bölümü -->
          <div class="border-t border-gray-700 pt-4">
            <label class="block mb-2 text-sm">Ay Evresi Seç</label>
            <div class="grid grid-cols-4 gap-2 text-sm">
              <button 
                v-for="(phase, index) in moonPhases" 
                :key="index"
                @click="selectPhase(index)"
                class="flex flex-col items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                :class="{'ring-2 ring-indigo-400': currentPhase === index}"
              >
                <span class="text-xl">{{ phase.emoji }}</span>
                <span class="text-2xs mt-1 text-center">{{ phase.name }}</span>
              </button>
            </div>
          </div>
          
          <div class="border-t border-gray-700 pt-4">
            <h3 class="font-bold mb-2 text-sm">Ay Evreleri</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><span class="mr-1">🌑</span> Yeni Ay</div>
              <div><span class="mr-1">🌒</span> Hilal</div>
              <div><span class="mr-1">🌓</span> İlk Dördün</div>
              <div><span class="mr-1">🌔</span> Şişkin Ay</div>
              <div><span class="mr-1">🌕</span> Dolunay</div>
              <div><span class="mr-1">🌖</span> Şişkin Ay</div>
              <div><span class="mr-1">🌗</span> Son Dördün</div>
              <div><span class="mr-1">🌘</span> Hilal</div>
            </div>
          </div>
          
          <!-- Ayarları sıfırlama butonu -->
          <div class="border-t border-gray-700 pt-4">
            <button 
              @click="resetSimulation"
              class="w-full py-2 px-4 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Ayarları Sıfırla
            </button>
          </div>
        </div>
      </div>
      
      <!-- Mobil ayarlar modal -->
      <div 
        v-if="showMobileSettings" 
        class="lg:hidden fixed inset-0 z-50 h-screen overflow-auto  flex items-center justify-center  bg-black bg-opacity-50"
      >
        <div 
          class="bg-gray-800 w-full  h-screen overflow-y-auto "
          @click.stop
        >
          <div class="p-4 space-y-4">
            
            <div class="flex justify-between items-center">
              <h2 class="text-white text-lg font-bold">Ayarlar</h2>
              <button 
                @click="showMobileSettings = false"
                class="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              <button 
                @click="toggleAnimation(); showMobileSettings = false;"
                class="w-full py-2 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                {{ isAnimating ? 'Durdur' : 'Başlat' }}
              </button>
            </div>
            
            <div>
              <label class="block mb-2 text-sm text-white">Simülasyon Hızı</label>
              <input 
                type="range" 
                min="0.1" 
                max="2" 
                step="0.1" 
                v-model="simulationSpeed"
                class="w-full"
              />
              <div class="flex justify-between text-xs mt-1 text-white">
                <span>Yavaş</span>
                <span>Hızlı</span>
              </div>
            </div>
            
            <!-- Mobil: Cisim Ölçekleri bölümü -->
            <div class="border-t border-gray-700 pt-4 mt-4">
              <label class="block mb-2 text-sm text-white">Gök Cisimlerinin Ölçekleri</label>
              
              <!-- Güneş ölçeği -->
              <div class="mb-2">
                <div class="flex justify-between text-xs mb-1 text-white">
                  <span>Güneş Ölçeği</span>
                  <span>{{ sunScale }}</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  v-model="sunScale"
                  class="w-full"
                />
              </div>
              
              <!-- Dünya ölçeği -->
              <div class="mb-2">
                <div class="flex justify-between text-xs mb-1 text-white">
                  <span>Dünya Ölçeği</span>
                  <span>{{ earthScale }}</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  v-model="earthScale"
                  class="w-full"
                />
              </div>
              
              <!-- Ay ölçeği -->
              <div>
                <div class="flex justify-between text-xs mb-1 text-white">
                  <span>Ay Ölçeği</span>
                  <span>{{ moonScale }}</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  v-model="moonScale"
                  class="w-full"
                />
              </div>
            </div>

            
            <!-- Kamera görünümü butonları -->
            <div>
              <label class="block mb-2 text-sm text-white">Kamera Görünümü</label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  @click="setCameraView('top')"
                  class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
                >
                  Üstten Görünüm
                </button>
                <button 
                  @click="setCameraView('side')"
                  class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
                >
                  Yandan Görünüm
                </button>
                <button 
                  @click="setCameraView('front')"
                  class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
                >
                  Önden Görünüm
                </button>
                <button 
                  @click="setCameraView('isometric')"
                  class="py-1 px-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
                >
                  İzometrik Görünüm
                </button>
                <button 
                  @click="toggleMoonTracking()"
                  class="py-1 px-2 text-xs rounded-md transition-colors text-white"
                  :class="isTrackingMoon ? 'bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'"
                >
                  {{ isTrackingMoon ? 'Takibi Durdur' : 'Ayı Takip Et' }}
                </button>
                <button 
                  @click="resetCameraView()"
                  class="py-1 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors text-white"
                >
                  Görünümü Sıfırla
                </button>
              </div>
            </div>
            
            <!-- Ay takip mesafesi ayarı (mobil) -->
            <div 
              v-if="isTrackingMoon"
              class="mt-2 bg-gray-700 p-2 rounded-md"
            >
              <label class="block mb-1 text-xs text-white">Takip Mesafesi</label>
              <div class="flex items-center gap-2">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.1" 
                  v-model="trackingDistance"
                  class="w-full"
                />
                <span class="text-xs text-white whitespace-nowrap">{{ trackingDistance }} birim</span>
              </div>
            </div>
            
            <!-- Evre seçimi bölümü -->
            <div class="border-t border-gray-700 pt-4">
              <label class="block mb-2 text-sm text-white">Ay Evresi Seç</label>
              <div class="grid grid-cols-4 gap-2 text-sm">
                <button 
                  v-for="(phase, index) in moonPhases" 
                  :key="index"
                  @click="selectPhase(index)"
                  class="flex flex-col items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  :class="{'ring-2 ring-indigo-400': currentPhase === index}"
                >
                  <span class="text-xl">{{ phase.emoji }}</span>
                  <span class="text-2xs mt-1 text-center text-white">{{ phase.name }}</span>
                </button>
              </div>
            </div>
            
            <!-- Ayarları sıfırlama butonu -->
            <div class="pt-4">
              <button 
                @click="resetSimulation; showMobileSettings = false;"
                class="w-full py-2 px-4 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors text-white"
              >
                Ayarları Sıfırla
              </button>
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

// Referanslar
const threeCanvas = ref(null);
const isAnimating = ref(false);
const simulationSpeed = ref(0.2);
const currentPhase = ref(0); // 0-7 arası değer (8 ay evresi)
const showMobileSettings = ref(false); // Mobil ayarlar modalı gösterme durumu
const isTrackingMoon = ref(false); // Ay takip modu durumu
const trackingDistance = ref(2); // Ay takip mesafesi (varsayılan 2 birim)

// Ölçek ayarları için ref'ler ekliyoruz
const sunScale = ref(1);
const earthScale = ref(1);
const moonScale = ref(1);

// Three.js değişkenleri
let scene, camera, renderer, controls;
let sun, earth, moon, moonPhaseVisual;
let earthOrbit, moonOrbit;

// Arka plan renkleri
const backgroundColors = [
  { name: 'Koyu Gri', value: 0x111827, hex: '#111827' },
  { name: 'Siyah', value: 0x000000, hex: '#000000' },
  { name: 'Koyu Mavi', value: 0x1e3a8a, hex: '#1e3a8a' },
  { name: 'Koyu Yeşil', value: 0x064e3b, hex: '#064e3b' },
  { name: 'Koyu Kırmızı', value: 0x7f1d1d, hex: '#7f1d1d' },
  { name: 'Koyu Mor', value: 0x4c1d95, hex: '#4c1d95' },
  { name: 'Açık Gri', value: 0xf3f4f6, hex: '#f3f4f6' },
  { name: 'Açık Mavi', value: 0xdbeafe, hex: '#dbeafe' }
];

// Kamera varsayılan pozisyonu
const defaultCameraPosition = { x: 0, y: 20, z: 30 };
const defaultControlsTarget = { x: 0, y: 0, z: 0 };

// Ay evreleri bilgileri
const moonPhases = [
  { name: 'Yeni Ay', emoji: '🌑' },
  { name: 'Hilal', emoji: '🌒' },
  { name: 'İlk Dördün', emoji: '🌓' },
  { name: 'Şişkin Ay', emoji: '🌔' },
  { name: 'Dolunay', emoji: '🌕' },
  { name: 'Şişkin Ay', emoji: '🌖' },
  { name: 'Son Dördün', emoji: '🌗' },
  { name: 'Hilal', emoji: '🌘' }
];

// Hesaplanmış değerler
const currentPhaseName = computed(() => moonPhases[currentPhase.value].name);
const currentPhaseEmoji = computed(() => moonPhases[currentPhase.value].emoji);

// Animasyon değişkenleri
let animationId = null;
let earthAngle = 0;
let moonAngle = 0;

// Simülasyon başlatma/durdurma
function toggleAnimation() {
  isAnimating.value = !isAnimating.value;
  
  if (isAnimating.value && !animationId) {
    animate();
  }
}

// Belirli bir ay evresini seçme 
function selectPhase(phaseIndex) {
  // Simülasyonu durdur
  isAnimating.value = false;
  
  // Evre değerini güncelle
  currentPhase.value = phaseIndex;
  
  // Evre indeksine göre ay açısını hesapla (saat yönünün tersine döndüğü için değerler tersine çevrildi)
  // 0: Yeni Ay (Ay, Dünya ile Güneş arasında) - Math.PI
  // 2: İlk Dördün (Ay, Dünya'nın sağında) - Math.PI/2
  // 4: Dolunay (Ay, Dünya'nın arkasında) - 0
  // 6: Son Dördün (Ay, Dünya'nın solunda) - -Math.PI/2 veya 3*Math.PI/2
  const moonPhaseAngles = [
    Math.PI,            // 0: Yeni Ay
    Math.PI * 1.25,     // 1: İlk Hilal (değiştirildi: 0.75 -> 1.25)
    Math.PI * 1.5,      // 2: İlk Dördün (değiştirildi: 0.5 -> 1.5)  
    Math.PI * 1.75,     // 3: Büyüyen Şişkin Ay (değiştirildi: 0.25 -> 1.75)
    0,                  // 4: Dolunay
    Math.PI * 0.25,     // 5: Küçülen Şişkin Ay (değiştirildi: 1.75 -> 0.25)
    Math.PI * 0.5,      // 6: Son Dördün (değiştirildi: 1.5 -> 0.5)
    Math.PI * 0.75      // 7: Son Hilal (değiştirildi: 1.25 -> 0.75)
  ];
  
  // Ay ve dünya konumlarını ayarla
  moonAngle = moonPhaseAngles[phaseIndex];
  moonOrbit.rotation.y = moonAngle;
  
  // Tek render için animate çağır
  renderer.render(scene, camera);
}

// Arka plan rengini değiştirme
function changeBackgroundColor(colorValue) {
  if (scene) {
    scene.background = new THREE.Color(colorValue);
    renderer.render(scene, camera);
  }
}

// Kamera görünümünü ayarlama
function setCameraView(viewType) {
  if (!camera || !controls) return;
  
  // Ay takip modunu kapatma
  isTrackingMoon.value = false;
  
  switch (viewType) {
    case 'top':
      // Üstten görünüm
      camera.position.set(0, 30, 0);
      controls.target.set(0, 0, 0);
      break;
    case 'side':
      // Yandan görünüm
      camera.position.set(30, 0, 0);
      controls.target.set(0, 0, 0);
      break;
    case 'front':
      // Önden görünüm
      camera.position.set(0, 0, 30);
      controls.target.set(0, 0, 0);
      break;
    case 'isometric':
      // İzometrik görünüm
      camera.position.set(20, 20, 20);
      controls.target.set(0, 0, 0);
      break;
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// Kamera görünümünü sıfırlama
function resetCameraView() {
  if (!camera || !controls) return;
  
  // Ay takip modunu kapatma
  isTrackingMoon.value = false;
  
  camera.position.set(
    defaultCameraPosition.x,
    defaultCameraPosition.y,
    defaultCameraPosition.z
  );
  
  controls.target.set(
    defaultControlsTarget.x,
    defaultControlsTarget.y,
    defaultControlsTarget.z
  );
  
  controls.update();
  renderer.render(scene, camera);
}

// Ay takip etme işlevi
function toggleMoonTracking() {
  isTrackingMoon.value = !isTrackingMoon.value;
  
  if (isTrackingMoon.value) {
    // Dünya ve ay pozisyonlarını al
    const earthPosition = new THREE.Vector3();
    earth.getWorldPosition(earthPosition);
    
    const moonPosition = new THREE.Vector3();
    moon.getWorldPosition(moonPosition);
    
    // Dünyadan aya bakacak yön vektörü
    const fromEarthToMoon = new THREE.Vector3().subVectors(moonPosition, earthPosition);
    
    // Kamerayı dünyanın biraz üzerine yerleştir
    const earthOffset = new THREE.Vector3(0, 0.5, 0);
    camera.position.copy(earthPosition).add(earthOffset);
    
    // Kameranın hedefini aya çevir
    controls.target.copy(moonPosition);
  } else {
    // Takip modu kapandığında varsayılan görünüme dön
    resetCameraView();
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// Simülasyonu sıfırlama
function resetSimulation() {
  // Animasyonu durdur
  isAnimating.value = false;
  
  // Ayarları sıfırla
  simulationSpeed.value = 0.2;
  
  // Ölçekleri sıfırla
  sunScale.value = 1;
  earthScale.value = 1;
  moonScale.value = 1;
  
  // Evre sıfırlama
  currentPhase.value = 0;
  moonAngle = Math.PI;
  earthAngle = 0;
  
  // Pozisyonları sıfırla
  earthOrbit.rotation.y = earthAngle;
  moonOrbit.rotation.y = moonAngle;
  
  // Kamera görünümünü sıfırla
  resetCameraView();
  
  // Arka plan rengini sıfırla
  changeBackgroundColor(0x111827);
  
  // Tek render için animate çağır
  renderer.render(scene, camera);
}

// Three.js sahnesini kurma
function setupScene() {
  // Sahne oluşturma
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827); // bg-gray-900
  
  // Kamera oluşturma
  camera = new THREE.PerspectiveCamera(
    75,
    threeCanvas.value.clientWidth / threeCanvas.value.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 30);
  
  // Renderer oluşturma
  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    antialias: true
  });
  renderer.setSize(threeCanvas.value.clientWidth, threeCanvas.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Fiziksel doğruluk için PBR renderlamasını aktifleştir
  renderer.physicallyCorrectLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Kontroller oluşturma
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar oluşturma
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambientLight);
  
  // Yıldızlar arka planı
  createStars();
  
  // Oda oluşturma (tavan, taban ve duvarlar)
  createRoom();
  
  // Gök cisimlerini oluşturma
  createCelestialBodies();
  
  // Ay evresi göstergesini oluşturma
  createMoonPhaseVisual();
  
  // İlk pencere boyutunu ayarlama
  handleResize();
}

// Yıldızlar oluşturma
function createStars() {
  // Yıldızlı gökyüzü için küre oluşturma
  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x000811, // Koyu mavi renk
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
  
  // Parlak yıldızlar
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true
  });
  
  const starsVertices = [];
  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

// Oda oluşturma (tavan, taban ve duvarlar)
function createRoom() {
  const roomColor = 0x111827; // bg-gray-900 ile aynı renk
  const roomSize = 100;
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
  const roomMaterial = new THREE.MeshBasicMaterial({ 
    color: roomColor, 
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.2 
  });
  
  const room = new THREE.Mesh(roomGeometry, roomMaterial);
  scene.add(room);
}

// Gök cisimlerini oluşturma
function createCelestialBodies() {
  // Yörünge grupları (hareketleri kolaylaştırmak için)
  earthOrbit = new THREE.Group();
  moonOrbit = new THREE.Group();
  
  scene.add(earthOrbit);
  earthOrbit.add(moonOrbit);
  
  // Texture loader
  const textureLoader = new THREE.TextureLoader();
  
  // Güneş oluşturma
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdd44,
    emissive: 0xffdd00,
    emissiveIntensity: 0.7,
    roughness: 1,
    metalness: 0,
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  
  // Güneş parlaması efekti
  const sunGlow = createGlow(3.3, 0xffdd00, 0.5);
  sun.add(sunGlow);
  
  // Güneşten gelen ana ışık (yönlü ışık, paralel ışınlar) - İyileştirildi
  const sunDirectionalLight = new THREE.DirectionalLight(0xffffff, 3);
  sunDirectionalLight.position.set(0, 0, 0);
  sunDirectionalLight.target = earthOrbit;
  scene.add(sunDirectionalLight);
  
  // Güneş'ten gelen nokta ışık (güneşin merkezinden çevreye doğru ışınlar) - Güçlendirildi
  const sunLight = new THREE.PointLight(0xffffff, 2);
  sun.add(sunLight);
  
  scene.add(sun);
  
  // Dünya textures
  const earthDiffuseTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
  const earthBumpTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
  const earthSpecularTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
  const earthCloudsTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
  
  // Dünya oluşturma
  const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
  const earthMaterial = new THREE.MeshPhongMaterial({ 
    map: earthDiffuseTexture,
    bumpMap: earthBumpTexture,
    bumpScale: 0.05,
    specularMap: earthSpecularTexture,
    specular: new THREE.Color(0x555555), // Daha parlak yansıma
    shininess: 30 // Daha parlak görünüm
  });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(15, 0, 0); // Güneşten 15 birim uzaklık
  earthOrbit.add(earth);
  
  // Dünya atmosferi (bulutlar)
  const cloudsGeometry = new THREE.SphereGeometry(1.02, 32, 32);
  const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.8
  });
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  earth.add(clouds);
  
  // Ay texture
  const moonTexture = textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg');
  const moonBumpTexture = textureLoader.load('https://threejs.org/examples/textures/planets/moon_bump.jpg');
  
  // Ay oluşturma - daha parlak ve daha detaylı, ışık efektleri iyileştirildi
  const moonGeometry = new THREE.SphereGeometry(0.27, 64, 64); // Daha fazla detay için segment sayısını artırdık
  const moonMaterial = new THREE.MeshStandardMaterial({ // PhongMaterial yerine StandardMaterial kullanıldı
    map: moonTexture,
    bumpMap: moonBumpTexture,
    bumpScale: 0.005, // Biraz daha belirgin kraterler
    roughness: 0.8,  // Pürüzlülük
    metalness: 0.1,  // Metaliklik
    emissive: 0x222222,
    emissiveIntensity: 0.05
  });
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(3, 0, 0); // Dünyadan 3 birim uzaklık
  moonOrbit.position.copy(earth.position);
  moonOrbit.add(moon);
  
  // Yörünge çizgileri oluşturma
  const earthOrbitLine = createOrbitLine(15);
  const moonOrbitLine = createOrbitLine(3);
  
  scene.add(earthOrbitLine);
  moonOrbit.add(moonOrbitLine);
  
  // Ay üzerine özel bir spot ışık ekleyelim - moon oluşturulduktan sonra ekledik
  const moonSpotlight = new THREE.SpotLight(0xffffff, 1);
  moonSpotlight.position.set(0, 0, 0); // Güneş pozisyonu
  moonSpotlight.target = moon;  // Şimdi moon nesnesini hedef alabiliriz
  moonSpotlight.angle = Math.PI / 4;
  moonSpotlight.penumbra = 0.1;
  moonSpotlight.decay = 0;
  moonSpotlight.distance = 0;
  sun.add(moonSpotlight);
  
  // Dünya'nın kendi ekseni etrafında dönüşü
  earth.rotation.y = Math.PI;
  
  // Ay'ın kendi ekseni etrafında dönmemesi (Dünya'ya hep aynı yüzünü göstermesi)
  moon.rotation.y = Math.PI;
}

// Atmosfer efekti oluşturma
function createAtmosphere(scale, color, opacity) {
  const geometry = new THREE.SphereGeometry(scale, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    side: THREE.BackSide
  });
  return new THREE.Mesh(geometry, material);
}

// Yörünge çizgisi oluşturma
function createOrbitLine(radius) {
  const segments = 64;
  const orbitGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array((segments + 1) * 3);
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions[i * 3] = radius * Math.cos(angle);
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = radius * Math.sin(angle);
  }
  
  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const orbitMaterial = new THREE.LineBasicMaterial({ 
    color: 0x444444,
    transparent: true,
    opacity: 0.5
  });
  
  return new THREE.Line(orbitGeometry, orbitMaterial);
}

// Ay evresi göstergesi oluşturma
function createMoonPhaseVisual() {
  // Ay ön görünümü için grup
  moonPhaseVisual = new THREE.Group();
  scene.add(moonPhaseVisual);
  
  // Daima kameraya bakan bir pozisyonda tutacağız
  moonPhaseVisual.position.set(-5, 10, -20);
}

// Ay evresini güncelleme
function updateMoonPhase() {
  // Ay ile güneş arasındaki açıyı hesaplama
  const sunPosition = new THREE.Vector3(0, 0, 0);
  const moonPosition = new THREE.Vector3();
  moon.getWorldPosition(moonPosition);
  const earthPosition = new THREE.Vector3();
  earth.getWorldPosition(earthPosition);

  // Dünya-ay çizgisi ile dünya-güneş çizgisi arasındaki açıyı hesaplama
  const earthToSun = new THREE.Vector3().subVectors(sunPosition, earthPosition).normalize();
  const earthToMoon = new THREE.Vector3().subVectors(moonPosition, earthPosition).normalize();
  
  // Çapraz çarpım yönüne göre açının yönünü belirleme
  const crossProduct = new THREE.Vector3().crossVectors(earthToSun, earthToMoon);
  const angleSign = crossProduct.y >= 0 ? 1 : -1;
  
  const angle = earthToSun.angleTo(earthToMoon) * angleSign;
  
  // Açıdan ay evresini belirleme (0-7 arası değer)
  // 0: Yeni Ay, 2: İlk Dördün, 4: Dolunay, 6: Son Dördün
  const phaseIndex = Math.round(((angle + Math.PI * 2) / (Math.PI * 2)) * 8) % 8;
  currentPhase.value = phaseIndex;
}

// Parlaklık efekti oluşturma
function createGlow(scale, color, opacity) {
  const geometry = new THREE.SphereGeometry(scale, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Mesh(geometry, material);
}

// Animasyon döngüsü
function animate() {
  animationId = requestAnimationFrame(animate);
  
  if (isAnimating.value) {
    // Dünya'nın Güneş etrafında dönüşü (saat yönünün tersine)
    earthAngle += 0.005 * simulationSpeed.value;
    earthOrbit.rotation.y = earthAngle;
    
    // Ay'ın Dünya etrafında dönüşü (saat yönünün tersine)
    moonAngle += 0.05 * simulationSpeed.value;
    moonOrbit.rotation.y = moonAngle;
    
    // Dünya'nın kendi ekseni etrafında dönüşü
    earth.rotation.y += 0.01 * simulationSpeed.value;
    
    // Ay evresini güncelleme
    updateMoonPhase();
    
    // Ay takip modu etkinse kamerayı güncelle
    if (isTrackingMoon.value) {
      const earthPosition = new THREE.Vector3();
      earth.getWorldPosition(earthPosition);
      
      const moonPosition = new THREE.Vector3();
      moon.getWorldPosition(moonPosition);
      
      // Dünyadan aya bakacak yön
      const earthOffset = new THREE.Vector3(0, 0.5, 0);
      camera.position.copy(earthPosition).add(earthOffset);
      controls.target.copy(moonPosition);
    }
  }
  
  // Kontrolleri güncelleme
  controls.update();
  
  // Sahneyi yeniden çizme
  renderer.render(scene, camera);
}

// Pencere boyutunu yeniden ayarlama
function handleResize() {
  if (!threeCanvas.value) return;
  
  const width = threeCanvas.value.clientWidth;
  const height = threeCanvas.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
}

// Sayfa/component yüklendiğinde setup yapma
onMounted(() => {
  setupScene();
  
  // Yeni ay evresinden başlama
  moonAngle = Math.PI; // Ay, Dünya ile Güneş arasında
  moonOrbit.rotation.y = moonAngle;
  
  // Animasyonu başlatma (durdurulmuş durumda)
  animate();
  
  // Pencere boyutu değişikliklerini dinleme
  window.addEventListener('resize', handleResize);
});

// Component kaldırıldığında temizlik yapma
onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', handleResize);
  
  // Three.js nesnelerini temizleme
  scene.clear();
  renderer.dispose();
  controls.dispose();
});

// Ölçek değişiklikleri izleme
watch(sunScale, (newScale) => {
  if (sun) {
    sun.scale.set(newScale, newScale, newScale);
    renderer.render(scene, camera);
  }
});

watch(earthScale, (newScale) => {
  if (earth) {
    earth.scale.set(newScale, newScale, newScale);
    renderer.render(scene, camera);
  }
});

watch(moonScale, (newScale) => {
  if (moon) {
    moon.scale.set(newScale, newScale, newScale);
    renderer.render(scene, camera);
  }
});
</script>
  
<style scoped>
/* Kaydırma çubuğu stillerini özelleştirme */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
  
 
 