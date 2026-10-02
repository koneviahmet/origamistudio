<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- 3D Simülasyon Render Alanı -->
    <div ref="simulationContainer" class="w-full h-full"></div>

    <!-- Simülasyon Bilgi Paneli -->
    <div class="absolute md:top-4 left-4 bottom-1/3 md:bottom-auto  bg-black/70 text-white p-2 rounded shadow-lg" v-if="simulationStarted">
      <div >
        <p class="text-sm">Zemin: {{ selectedSurface.name }}</p>
        <p class="text-sm">Sürtünme Katsayısı: {{ selectedSurface.friction.toFixed(2) }}</p>
        <p class="text-sm">Alınan Mesafe: {{ distanceTraveled.toFixed(2) }} m</p>
      </div>
    </div>

    <!-- Başlat/Durdur Butonu -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2">
      <button 
        v-if="!simulationStarted"
        @click="startSimulation" 
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg focus:outline-none">
        Başlat
      </button>
      <button 
        v-else
        @click="stopSimulation" 
        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg focus:outline-none">
        Durdur
      </button>
    </div>

    <!-- Deney Sonuçları Tablosu - Sol Alt Köşe -->
    <div class="absolute bottom-1/3 left-4 bg-black/70 text-white p-2 rounded shadow-lg max-h-64 overflow-y-auto hidden md:block">
      <h3 class="text-lg font-semibold mb-2">Deney Sonuçları</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class="py-2 px-2 text-left bg-gray-800">Zemin</th>
              <th class="py-2 px-2 text-left bg-gray-800">Sürtünme</th>
              <th class="py-2 px-2 text-left bg-gray-800">Mesafe (m)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in results" :key="index" class="border-t border-gray-700">
              <td class="py-2 px-2">{{ result.surface }}</td>
              <td class="py-2 px-2">{{ result.friction.toFixed(2) }}</td>
              <td class="py-2 px-2">{{ result.distance.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobil Ayarlar Butonu -->
    <div class="absolute top-4 left-4 md:hidden">
      <button 
        @click="toggleMobileSettings" 
        class="bg-gray-800 text-white p-2 rounded-full shadow-lg focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Masaüstü Ayarlar Paneli -->
    <div class="hidden md:block absolute top-0 right-0 w-80 h-screen bg-gray-900 text-white p-4  overflow-y-auto">
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Zemin Türü</h3>
        <div class="grid grid-cols-2 gap-2">
          <button 
            v-for="surface in surfaces" 
            :key="surface.id"
            @click="selectSurface(surface)"
            :class="[
              'px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors', 
              selectedSurface.id === surface.id ? 
                'bg-blue-600 text-white' : 
                'bg-gray-700 hover:bg-gray-600 text-gray-200'
            ]"
          >
            {{ surface.name }}
          </button>
        </div>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Animasyon Hızı</h3>
        <input 
          type="range" 
          min="0.1" 
          max="2" 
          step="0.1" 
          v-model="animationSpeed" 
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        >
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>Yavaş</span>
          <span>Hızlı</span>
        </div>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Kamera Açısı</h3>
        <div class="grid grid-cols-2 gap-2">
          <button @click="setCameraView('top')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
            Üstten Görünüm
          </button>
          <button @click="setCameraView('side')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
            Yandan Görünüm
          </button>
          <button @click="setCameraView('front')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
            Önden Görünüm
          </button>
          <button @click="setCameraView('isometric')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
            İzometrik Görünüm
          </button>
          <button @click="setCameraView('reset')" class="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm col-span-2">
            Görünümü Sıfırla
          </button>
        </div>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Arkaplan Rengi</h3>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="(color, index) in backgroundColors" 
            :key="index"
            @click="changeBackgroundColor(color.value)"
            :style="{ backgroundColor: color.value }"
            class="w-8 h-8 rounded-full border border-gray-600 focus:outline-none">
          </button>
        </div>
      </div>

      <button 
        @click="resetSimulation" 
        class="w-full mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg focus:outline-none"
        :disabled="!isSettingsChanged">
        Sıfırla
      </button>
    </div>

    <!-- Mobil Ayarlar Modal -->
    <div v-if="showMobileSettings" class="fixed top-0 left-0 inset-0 z-10 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen">
        <div class="fixed inset-0 bg-black opacity-50"></div>
        
        <div class="relative bg-gray-900 text-white  w-full p-5  h-screen overflow-y-auto">

          <div class="relative">
            <button 
              @click="showMobileSettings = false" 
              class=" text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          

          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Zemin Türü</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="surface in surfaces" 
                :key="surface.id"
                @click="selectSurface(surface)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm focus:outline-none', 
                  selectedSurface.id === surface.id ? 
                    'bg-blue-600 text-white' : 
                    'bg-gray-700 hover:bg-gray-600 text-gray-200'
                ]"
              >
                {{ surface.name }}
              </button>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Animasyon Hızı</h3>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              v-model="animationSpeed" 
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            >
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>Yavaş</span>
              <span>Hızlı</span>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Kamera Açısı</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="setCameraView('top')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
                Üstten Görünüm
              </button>
              <button @click="setCameraView('side')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
                Yandan Görünüm
              </button>
              <button @click="setCameraView('front')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
                Önden Görünüm
              </button>
              <button @click="setCameraView('isometric')" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
                İzometrik Görünüm
              </button>
              <button @click="setCameraView('reset')" class="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm col-span-2">
                Görünümü Sıfırla
              </button>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Arkaplan Rengi</h3>
            <div class="grid grid-cols-4 gap-2">
              <button 
                v-for="(color, index) in backgroundColors" 
                :key="index"
                @click="changeBackgroundColor(color.value)"
                :style="{ backgroundColor: color.value }"
                class="w-8 h-8 rounded-full border border-gray-600 focus:outline-none">
              </button>
            </div>
          </div>

          <button 
            @click="resetSimulation" 
            class="w-full mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg focus:outline-none"
            :disabled="!isSettingsChanged">
            Sıfırla
          </button>

          <button 
            @click="showMobileSettings = false" 
            class="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg focus:outline-none w-full">
            Kapat
          </button>
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
const simulationContainer = ref(null);
const showMobileSettings = ref(false);
const simulationStarted = ref(false);
const animationSpeed = ref(1);
const distanceTraveled = ref(0);
const results = ref([]);

// Three.js değişkenleri
let scene, camera, renderer, controls;
let child, ball, ground, kickAnimation;
let animationFrameId;
let ballVelocity = new THREE.Vector3(0, 0, 0);
let originalSettings = null;
let childKickAnimationMixer = null;
let childModel = null;
let ballModel = null;

// Yüzey türleri ve sürtünme katsayıları
const surfaces = [
  { id: 'grass', name: 'Çim', friction: 0.5, color: '#4ade80' },
  { id: 'gravel', name: 'Çakıl', friction: 0.7, color: '#a8a29e' },
  { id: 'concrete', name: 'Beton', friction: 0.3, color: '#94a3b8' },
  { id: 'ice', name: 'Buz', friction: 0.05, color: '#bfdbfe' },
  { id: 'wood', name: 'Ahşap', friction: 0.4, color: '#92400e' },
  { id: 'sand', name: 'Kum', friction: 0.8, color: '#fcd34d' }
];

// Arkaplan renkleri
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
  { name: 'Bej', value: '#f5f5dc' }
];

// Seçilen yüzey
const selectedSurface = ref(surfaces[0]);

// Ayarların değişip değişmediğini kontrol eden hesaplanmış özellik
const isSettingsChanged = computed(() => {
  if (!originalSettings) return false;
  return (
    selectedSurface.value.id !== originalSettings.surfaceId ||
    animationSpeed.value !== originalSettings.animationSpeed
  );
});

// Mobil ayarları aç/kapat
function toggleMobileSettings() {
  showMobileSettings.value = !showMobileSettings.value;
}

// Yüzey seçimi
function selectSurface(surface) {
  selectedSurface.value = surface;
  if (ground) {
    ground.material.color.set(surface.color);
  }
  if (simulationStarted.value) {
    stopSimulation();
    startSimulation();
  }
}

// Kamera açısını ayarla
function setCameraView(view) {
  if (!camera || !controls) return;

  switch (view) {
    case 'top':
      camera.position.set(0, 20, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'side':
      camera.position.set(0, 5, 20);
      camera.lookAt(0, 0, 0);
      break;
    case 'front':
      camera.position.set(20, 5, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'isometric':
      camera.position.set(15, 15, 15);
      camera.lookAt(0, 0, 0);
      break;
    case 'reset':
      camera.position.set(15, 10, 15);
      camera.lookAt(0, 0, 0);
      break;
  }
  
  controls.update();
}

// Arkaplan rengini değiştir
function changeBackgroundColor(color) {
  if (scene) {
    scene.background = new THREE.Color(color);
  }
}

// Simülasyonu başlat
function startSimulation() {
  if (simulationStarted.value) return;
  
  // Kesikli çizgileri temizle
  clearDistanceMarkers();
  
  // İlk çalıştırmada orijinal ayarları kaydet
  if (!originalSettings) {
    originalSettings = {
      surfaceId: selectedSurface.value.id,
      animationSpeed: animationSpeed.value
    };
  }
  
  simulationStarted.value = true;
  distanceTraveled.value = 0;
  
  // Topu ve çocuğu başlangıç konumuna getir
  if (ball && child) {
    ball.position.set(-18, 0.5, 0);
    ball.rotation.set(0, 0, 0); // Topun rotasyonunu sıfırla
    child.position.set(-20, 0, 0);
    
    // Top hızını sıfırla
    ballVelocity.set(10, 0, 0); // Başlangıç hızı
  }
  
  // Vuruş animasyonunu başlat
  kickBall();
}

// Simülasyonu durdur
function stopSimulation() {
  simulationStarted.value = false;
  
  // Topu ve çocuğu başlangıç konumuna getir
  if (ball && child) {
    ball.position.set(-18, 0.5, 0);
    ball.rotation.set(0, 0, 0); // Topun rotasyonunu sıfırla
    child.position.set(-20, 0, 0);
    
    // Çocuk modelini sıfırla
    const rightLeg = childModel.getObjectByName("rightLeg");
    if (rightLeg) {
      rightLeg.rotation.x = 0;
    }
  }
  
  // Animasyonu durdur
  if (kickAnimation) {
    cancelAnimationFrame(kickAnimation);
    kickAnimation = null;
  }
}

// Simülasyonu sıfırla
function resetSimulation() {
  stopSimulation();
  
  // Kesikli çizgileri ve mesafe yazılarını temizle
  clearDistanceMarkers();
  
  if (originalSettings) {
    // Yüzey türünü orijinal ayara geri getir
    const originalSurface = surfaces.find(s => s.id === originalSettings.surfaceId);
    if (originalSurface) {
      selectSurface(originalSurface);
    }
    
    // Animasyon hızını orijinal ayara geri getir
    animationSpeed.value = originalSettings.animationSpeed;
  }
}

// Vuruş animasyonu
function kickBall() {
  if (!simulationStarted.value) return;
  
  // Çocuk animasyonu (topa doğru hareket etme ve vurma)
  const kickDuration = 1 / animationSpeed.value; // Animasyon hızına bağlı vuruş süresi
  let kickTime = 0;
  let kickStarted = false;
  
  // Animasyon için kullanılacak değişkenler
  let walkCycle = 0;
  const walkSpeed = 1.9 * animationSpeed.value; // Adım hızı
  
  function animateKick() {
    if (kickTime < kickDuration && simulationStarted.value) {
      kickTime += 0.01;
      
      // Yürüme döngüsünü ilerlet
      walkCycle += 0.1 * walkSpeed * (kickTime / kickDuration);
      
      // Çocuğu topa doğru hareket ettir
      if (childModel) {
        childModel.position.x = -20 + kickTime / kickDuration * 1.5;
        
        // Yürüme animasyonu
        animateWalk(walkCycle);
        
        // Vuruş anına yaklaştığında bacak hareketi
        if (kickTime > kickDuration * 0.7 && !kickStarted) {
          kickStarted = true;
          
          // Sağ bacağı vurma pozisyonuna getir
          const rightLeg = childModel.getObjectByName("rightLeg");
          const rightFoot = childModel.getObjectByName("rightFoot");
          
          if (rightLeg && rightFoot) {
            const kickTween = {
              progress: 0
            };
            
            // Animasyon adımları
            const animateKickMotion = () => {
              if (kickTween.progress < 1) {
                kickTween.progress += 0.1;
                
                // Vurma bacağını ileri doğru getir
                rightLeg.rotation.x = Math.sin(kickTween.progress * Math.PI) * 1.2;
                rightFoot.rotation.x = Math.sin(kickTween.progress * Math.PI) * 0.8;
                
                requestAnimationFrame(animateKickMotion);
              } else {
                // Bacağı eski haline getir
                setTimeout(() => {
                  rightLeg.rotation.x = 0;
                  rightFoot.rotation.x = 0;
                }, 300);
              }
            };
            
            animateKickMotion();
          }
        }
      }
      
      kickAnimation = requestAnimationFrame(animateKick);
    } else {
      // Vuruş tamamlandı, topu hareket ettirmeye başla
      animateBallMovement();
    }
  }
  
  animateKick();
}

// Yürüme animasyonu
function animateWalk(cycle) {
  if (!childModel) return;
  
  const leftLeg = childModel.getObjectByName("leftLeg");
  const rightLeg = childModel.getObjectByName("rightLeg");
  const leftArm = childModel.getObjectByName("leftArm");
  const rightArm = childModel.getObjectByName("rightArm");
  const leftFoot = childModel.getObjectByName("leftFoot");
  const rightFoot = childModel.getObjectByName("rightFoot");
  
  if (leftLeg && rightLeg && leftArm && rightArm && leftFoot && rightFoot) {
    // Bacaklar
    leftLeg.rotation.x = Math.sin(cycle) * 0.4;
    rightLeg.rotation.x = Math.sin(cycle + Math.PI) * 0.4;
    
    // Ayaklar
    leftFoot.rotation.x = Math.sin(cycle + Math.PI/4) * 0.3;
    rightFoot.rotation.x = Math.sin(cycle + Math.PI + Math.PI/4) * 0.3;
    
    // Kollar, bacaklarla zıt yönde hareket eder
    leftArm.rotation.x = Math.sin(cycle + Math.PI) * 0.25;
    rightArm.rotation.x = Math.sin(cycle) * 0.25;
  }
}

// Top hareketi animasyonu
function animateBallMovement() {
  if (!simulationStarted.value) return;
  
  // Simülasyon değişkenleri
  const gravity = 9.8; // m/s²
  const timeStep = 0.01 * animationSpeed.value; // Saniye başına adım
  
  // Başlangıç pozisyonu
  const startPositionX = ball.position.x;
  // Zeminin maksimum X pozisyonu (topu zemin üzerinde tutmak için)
  const maxGroundX = 24; // Zemin 50 birim genişliğinde, -25 ile +25 arasında, 1 birim güvenlik payı
  
  // Topun yarıçapı (dönüş hesaplaması için)
  const ballRadius = 0.5;
  
  function updateBallPosition() {
    if (!simulationStarted.value) return;
    
    // Sürtünme kuvveti hesapla (F = µ * m * g)
    const friction = selectedSurface.value.friction * gravity;
    
    // Sürtünme ivmesi (a = F/m = µ * g)
    const frictionAcceleration = friction;
    
    // Hızı güncelle
    if (ballVelocity.x > 0) {
      ballVelocity.x -= frictionAcceleration * timeStep;
      if (ballVelocity.x < 0) ballVelocity.x = 0;
    }
    
    // Önceki pozisyonu kaydet
    const prevPositionX = ball.position.x;
    
    // Konumu güncelle
    ball.position.x += ballVelocity.x * timeStep;
    
    // Toplam mesafeyi güncelle (artık pozitif olarak)
    distanceTraveled.value = ball.position.x - startPositionX;
    
    // Top zeminden çıkmaması için kontrol
    if (ball.position.x > maxGroundX) {
      ball.position.x = maxGroundX;
      ballVelocity.x = 0;
    }
    
    // Topa dönüş hareketi ekle (x yönünde ilerlerken z ekseni etrafında dönüş)
    if (ballVelocity.x > 0) {
      // Bu çeyrekte katedilen mesafeyi hesapla
      const distanceThisStep = ball.position.x - prevPositionX;
      
      // Dönüş açısını hesapla: katedilen mesafe / çevre * 2π
      // Top zeminde yuvarlanırken, katedilen mesafe kadar dönmesi gerekir
      // Çevre = 2πr olduğundan, açı = mesafe / r olur
      const rotationAngle = distanceThisStep / ballRadius;
      
      // Z ekseni etrafında döndür (x yönünde ilerleme için)
      ball.rotation.z -= rotationAngle;
      
      // İsteğe bağlı olarak hafif bir sallanma efekti ekle
      ball.rotation.x += distanceThisStep * 0.1;
    }
    
    // Top durduğunda
    if (ballVelocity.x <= 0) {
      // Sonucu kaydet
      results.value.push({
        surface: selectedSurface.value.name,
        friction: selectedSurface.value.friction,
        distance: distanceTraveled.value
      });
      
      // Topun durduğu yeri işaretle
      createDistanceMarker(ball.position.x, selectedSurface.value.name, distanceTraveled.value);
      
      simulationStarted.value = false;
      return;
    }
    
    kickAnimation = requestAnimationFrame(updateBallPosition);
  }
  
  updateBallPosition();
}

// Kesikli çizgi ve mesafe yazıları için grup
let distanceMarkers = new THREE.Group();

// Topun durduğu yeri kesikli çizgilerle işaretle ve mesafeyi yaz
function createDistanceMarker(position, surfaceName, distance) {
  // Önceki işaretçileri temizle
  clearDistanceMarkers();
  
  // Kesikli çizgi oluştur
  const dashLength = 0.5;
  const gapLength = 0.3;
  const lineHeight = 3;
  const segments = Math.floor(lineHeight / (dashLength + gapLength));
  
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  // Kesikli çizgiyi oluşturmak için segmentler ekle
  for (let i = 0; i < segments; i++) {
    const dashGeometry = new THREE.BoxGeometry(0.05, dashLength, 0.05);
    const dash = new THREE.Mesh(dashGeometry, lineMaterial);
    
    const yPos = i * (dashLength + gapLength);
    dash.position.set(position, 0.5 + yPos, 0);
    
    distanceMarkers.add(dash);
  }
  
  // Mesafe ve zemin bilgisi için canvas tekstürü oluştur
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  
  // Arka plan
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Yazı
  context.font = 'bold 24px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Mesafe ve zemin bilgisi
  context.fillText(`Mesafe: ${distance.toFixed(2)} m`, canvas.width / 2, 40);
  context.fillText(`Zemin: ${surfaceName}`, canvas.width / 2, 80);
  
  // Canvas'ı tekstür olarak kullan
  const texture = new THREE.CanvasTexture(canvas);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const textGeometry = new THREE.PlaneGeometry(4, 2);
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  
  // Metni konumlandır
  textMesh.position.set(position, 3, 0);
  textMesh.rotation.y = Math.PI / 2;
  
  distanceMarkers.add(textMesh);
  scene.add(distanceMarkers);
}

// Kesikli çizgileri ve mesafe yazılarını temizle
function clearDistanceMarkers() {
  if (distanceMarkers) {
    scene.remove(distanceMarkers);
    distanceMarkers = new THREE.Group();
  }
}

// Zemin oluştur
function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(50, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: selectedSurface.value.color,
    roughness: 0.8
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Yol çizgisi
  const roadMarkingGeometry = new THREE.PlaneGeometry(50, 0.2);
  const roadMarkingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const roadMarking = new THREE.Mesh(roadMarkingGeometry, roadMarkingMaterial);
  roadMarking.rotation.x = -Math.PI / 2;
  roadMarking.position.y = 0.01;
  roadMarking.position.z = 2;
  scene.add(roadMarking);
  
  const roadMarking2 = new THREE.Mesh(roadMarkingGeometry, roadMarkingMaterial);
  roadMarking2.rotation.x = -Math.PI / 2;
  roadMarking2.position.y = 0.01;
  roadMarking2.position.z = -2;
  scene.add(roadMarking2);
}

// Çocuk figürü oluştur (kayıtlı asset kullanarak)
function createChild() {
  // Çocuk modelini oluştur
  childModel = new THREE.Group();
  
  // Baş
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
  );
  head.position.y = 0.8;
  createFacialFeatures(head);
  childModel.add(head);
  
  // Saç
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
    new THREE.MeshStandardMaterial({ color: 0x995500 })
  );
  hair.position.set(0, 0.85, -0.02);
  hair.rotation.x = -Math.PI / 12;
  childModel.add(hair);
  
  // Vücut
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.5, 32),
    new THREE.MeshStandardMaterial({ color: 0x3366cc })
  );
  body.position.y = 0.45;
  childModel.add(body);
  
  // Bacaklar
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3344aa });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(0.07, 0.2, 0);
  leftLeg.name = "leftLeg"; // İsim tanımla
  childModel.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(-0.07, 0.2, 0);
  rightLeg.name = "rightLeg"; // İsim tanımla
  childModel.add(rightLeg);
  
  // Kollar
  const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(0.22, 0.5, 0);
  leftArm.rotation.z = Math.PI / 8;
  leftArm.name = "leftArm"; // İsim tanımla
  childModel.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(-0.22, 0.5, 0);
  rightArm.rotation.z = -Math.PI / 8;
  rightArm.name = "rightArm"; // İsim tanımla
  childModel.add(rightArm);

  // Ayaklar
  const footGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.15);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.position.set(0.07, 0, 0.03);
  leftFoot.name = "leftFoot"; // İsim tanımla
  childModel.add(leftFoot);
  
  const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
  rightFoot.position.set(-0.07, 0, 0.03);
  rightFoot.name = "rightFoot"; // İsim tanımla
  childModel.add(rightFoot);
  
  // Çocuğu büyüt (top ile orantılı olması için)
  childModel.scale.set(4.5, 4.5, 4.5); // 3 kat daha büyük (1.5 * 3 = 4.5)
  
  // Çocuğu çevir (yüzü topa bakacak şekilde)
  childModel.rotation.y = Math.PI / 2;
  
  // Çocuğu yolun başına konumlandır
  childModel.position.set(-20, 0, 0);
  scene.add(childModel);
  
  child = childModel;
}

// Yüzün özelliklerini ekler
function createFacialFeatures(head) {
  // Gözler
  const eyeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(0.07, 0.02, 0.17);
  head.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(-0.07, 0.02, 0.17);
  head.add(rightEye);
  
  // Ağız
  const mouthGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, -0.08, 0.18);
  head.add(mouth);
}

// Futbol topu oluştur
function createBall() {
  const ballGroup = new THREE.Group();
  
  // Top gövdesi
  const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const ballMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.2
  });
  const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  ballMesh.castShadow = true;
  ballGroup.add(ballMesh);
  
  // Futbol topu dokusu ekle
  // Siyah beşgenler (futbol topu desenini oluşturmak için)
  const pentagonGeometry = new THREE.CircleGeometry(0.2, 5);
  const hexagonGeometry = new THREE.CircleGeometry(0.18, 6);
  const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  // 12 siyah beşgen ekle (klasik futbol topu deseni oluşturmak için)
  const positions = [
    [0, 0.5, 0], [0, -0.5, 0],
    [0.5, 0, 0], [-0.5, 0, 0],
    [0, 0, 0.5], [0, 0, -0.5],
    [0.35, 0.35, 0], [-0.35, 0.35, 0],
    [0.35, -0.35, 0], [-0.35, -0.35, 0],
    [0, 0.35, 0.35], [0, -0.35, 0.35]
  ];

  positions.forEach((pos, i) => {
    const panel = new THREE.Mesh(
      i % 2 === 0 ? pentagonGeometry : hexagonGeometry, 
      blackMaterial
    );
    panel.position.set(...pos);
    panel.lookAt(0, 0, 0);
    panel.position.normalize().multiplyScalar(0.5);
    ballGroup.add(panel);
  });
  
  // Topu yolun başına konumlandır - tam zemine değecek şekilde
  ballGroup.position.set(-18, 0.5, 0);
  scene.add(ballGroup);
  
  ball = ballGroup;
  ballModel = ballGroup;
}

// Pencere boyutu değiştiğinde
function onWindowResize() {
  if (!camera || !renderer || !simulationContainer.value) return;
  
  camera.aspect = simulationContainer.value.clientWidth / simulationContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(simulationContainer.value.clientWidth, simulationContainer.value.clientHeight);
}

// Animasyon hızı izle
watch(animationSpeed, (newValue) => {
  if (simulationStarted.value) {
    // Animasyon çalışıyorsa yeniden başlat
    stopSimulation();
    startSimulation();
  }
});

// Three.js sahnesini oluştur
function createScene() {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#111827');
  
  // Perspektif kamera oluştur
  camera = new THREE.PerspectiveCamera(
    75, 
    simulationContainer.value.clientWidth / simulationContainer.value.clientHeight, 
    0.1, 
    1000
  );
  // Varsayılan görünüm olarak yandan görünümü ayarla
  camera.position.set(0, 5, 20);
  camera.lookAt(0, 0, 0);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(simulationContainer.value.clientWidth, simulationContainer.value.clientHeight);
  renderer.shadowMap.enabled = true;
  simulationContainer.value.appendChild(renderer.domElement);
  
  // Kontroller ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Zemin oluştur
  createGround();

  // Top oluştur
  createBall();
  
  // Çocuk oluştur (kayıtlı asset kullanarak)
  createChild();
  
  // Animasyon döngüsü
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// Sayfa yüklendiğinde
onMounted(() => {
  createScene();
  window.addEventListener('resize', onWindowResize);
});

// Sayfa kapatılmadan önce
onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (kickAnimation) {
    cancelAnimationFrame(kickAnimation);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // Renderer'ı temizle
  if (renderer) {
    renderer.dispose();
    simulationContainer.value.removeChild(renderer.domElement);
  }
});
</script>
 