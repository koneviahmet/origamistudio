<template>
  <div class="w-full h-screen flex flex-col md:flex-row bg-gray-900" :class="backgroundColor">
    <!-- Simülasyon Alanı -->
    <div class="w-full md:w-3/4 relative h-full" ref="simulationContainer">
      <div id="three-container" class="w-full h-full"></div>
      
      <!-- Mobil görünümde ayarlar butonu (md ekrandan küçük) -->
      <button 
        @click="showMobileSettings = true" 
        class="md:hidden absolute top-4 left-4 bg-gray-800 p-2 rounded-lg text-white z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      
      <!-- Basınç Göstergesi -->
      <div class="absolute top-4 left-4 mt-12 md:mt-0 bg-gray-800/80 p-4 rounded-lg text-white">
        <h3 class="font-bold mb-2">Basınç Değerleri</h3>
        <div>Derinlik: <span>{{ sensorDerinligi.toFixed(2) }}</span> m</div>
        <div>Basınç: <span>{{ pressureValue.toFixed(0) }}</span> Pa</div>
        <div>Yoğunluk: <span>{{ currentLiquid.density }}</span> kg/m³</div>
      </div>
      

      <!-- Grafik Görüntüsü -->
      <div v-if="showGraph" class="absolute bottom-4 right-4 bg-gray-800/80 p-2 rounded-lg w-64 h-48">
        <h4 class="text-white text-xs font-bold mb-1 text-center">Basınç - Derinlik Grafiği</h4>
        <div class="chart-container h-36 w-full relative">
          <!-- Grafik çizgisi -->
          <div class="absolute inset-0 flex items-end">
            <div class="w-full h-full relative">
              <div class="absolute bottom-0 left-0 w-full border-t border-white/50"></div>
              <div class="absolute top-0 left-0 h-full border-r border-white/50"></div>
              
              <div class="absolute bottom-0 left-0 border-l-2 border-yellow-400 h-full" 
                :style="{
                  height: `${graphPercentage}%`,
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(254, 240, 138, 0.1), transparent)'
                }"></div>
            </div>
          </div>
          
          <!-- Eksen etiketleri -->
          <div class="absolute bottom-0 left-0 text-white text-[10px]">0</div>
          <div class="absolute bottom-0 right-0 text-white text-[10px]">{{ maxPressure }}</div>
          <div class="absolute top-0 left-0 text-white text-[10px]">Derinlik</div>
          <div class="absolute bottom-0 left-0 -rotate-90 origin-bottom-left translate-y-6 text-white text-[10px]">Basınç</div>
        </div>
      </div>
    </div>
    
    <!-- Mobil Ayarlar Modal -->
    <div v-if="showMobileSettings" class="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 h-screen overflow-auto">
      <div class="w-11/12 bg-gray-800 rounded-lg overflow-auto h-screen p-4 text-white">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold"></h2>
          <button @click="showMobileSettings = false" class="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Sıvı Seçimi -->
        <div class="mb-4">
          <label class="block mb-2 font-medium">Sıvı Tipi</label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              v-for="liquid in liquids" 
              :key="liquid.name" 
              @click="changeLiquid(liquid)"
              :class="[
                'py-2 px-2 rounded-lg font-medium text-sm',
                currentLiquid.name === liquid.name ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              ]"
            >
              {{ liquid.name }}
            </button>
          </div>
        </div>
        
        <!-- Sıvı Seviyesi Ayarı -->
        <div class="mb-4">
          <label class="block mb-2 font-medium">Sıvı Seviyesi</label>
          <input 
            type="range" 
            min="0.5" 
            max="5" 
            step="0.1" 
            v-model.number="liquidLevel"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="text-right text-sm">{{ liquidLevel.toFixed(1) }} m</div>
        </div>
        
        <!-- Derinlik Sensörü -->
        <div class="mb-4">
          <label class="block mb-2 font-medium">Sensör Yüksekliği</label>
          <input 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.1" 
            v-model.number="sensorHeight"
            :max="liquidLevel"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="text-right text-sm">{{ sensorHeight.toFixed(1) }} m</div>
        </div>
        
        <!-- Delik Açma Kontrolü -->
        <div class="mb-4">
          <label class="block mb-2 font-medium">Delik Açma</label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              v-for="(hole, index) in [0.5, 1.5, 3.0]" 
              :key="index"
              @click="toggleHole(hole)"
              :class="[
                'py-2 px-1 rounded-lg font-medium text-xs',
                activeHoles.includes(hole) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
              ]"
              :disabled="hole > liquidLevel"
            >
              {{ hole }} m
            </button>
          </div>
        </div>
        
        <!-- Grafik Gösterimi -->
        <div class="mb-4">
          <label class="block mb-2 font-medium">Basınç-Derinlik Grafiği</label>
          <button 
            @click="showGraph = !showGraph"
            class="w-full py-2 px-4 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700"
          >
            {{ showGraph ? 'Grafiği Gizle' : 'Grafiği Göster' }}
          </button>
        </div>

        <!-- Arkaplan Rengi -->
        <div class="mb-4">
          <label class="block mb-2 font-medium">Arkaplan Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              @click="backgroundColor = 'bg-gray-900'" 
              class="h-8 w-8 bg-gray-900 rounded-lg border-2" 
              :class="backgroundColor === 'bg-gray-900' ? 'border-white' : 'border-transparent'"
            ></button>
            <button 
              @click="backgroundColor = 'bg-indigo-900'" 
              class="h-8 w-8 bg-indigo-900 rounded-lg border-2" 
              :class="backgroundColor === 'bg-indigo-900' ? 'border-white' : 'border-transparent'"
            ></button>
            <button 
              @click="backgroundColor = 'bg-blue-900'" 
              class="h-8 w-8 bg-blue-900 rounded-lg border-2" 
              :class="backgroundColor === 'bg-blue-900' ? 'border-white' : 'border-transparent'"
            ></button>
            <button 
              @click="backgroundColor = 'bg-gray-800'" 
              class="h-8 w-8 bg-gray-800 rounded-lg border-2" 
              :class="backgroundColor === 'bg-gray-800' ? 'border-white' : 'border-transparent'"
            ></button>
          </div>
        </div>
        
        <!-- Açıklamalar -->
        <div class="mt-6 p-3 bg-gray-700 rounded-lg text-sm">
          <h3 class="font-bold mb-2">Bilgi:</h3>
          <p>Sıvı basıncı (P), derinlik (h), sıvı yoğunluğu (d) ve yerçekimi ivmesi (g) ile hesaplanır:</p>
          <p class="my-2 text-center font-mono">P = h × d × g</p>
          <p>Derinlik arttıkça basınç doğrusal olarak artar.</p>
          <p class="mt-2">Farklı yoğunluktaki sıvılar farklı basınç değerleri oluşturur.</p>
        </div>
      </div>
    </div>
    
    <!-- Kontrol Paneli - Desktop -->
    <div class="hidden md:block w-full md:w-1/4 p-4 bg-gray-800 text-white overflow-y-auto h-screen">
      
      <!-- Sıvı Seçimi -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Sıvı Tipi</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="liquid in liquids" 
            :key="liquid.name" 
            @click="changeLiquid(liquid)"
            :class="[
              'py-2 px-2 rounded-lg font-medium text-sm',
              currentLiquid.name === liquid.name ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            ]"
          >
            {{ liquid.name }}
          </button>
        </div>
      </div>
      
      <!-- Sıvı Seviyesi Ayarı -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Sıvı Seviyesi</label>
        <input 
          type="range" 
          min="0.5" 
          max="5" 
          step="0.1" 
          v-model.number="liquidLevel"
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div class="text-right text-sm">{{ liquidLevel.toFixed(1) }} m</div>
      </div>
      
      <!-- Derinlik Sensörü -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Sensör Yüksekliği</label>
        <input 
          type="range" 
          min="0.1" 
          max="5" 
          step="0.1" 
          v-model.number="sensorHeight"
          :max="liquidLevel"
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div class="text-right text-sm">{{ sensorHeight.toFixed(1) }} m</div>
      </div>
      
      <!-- Delik Açma Kontrolü -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Delik Açma</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="(hole, index) in [0.5, 1.5, 3.0]" 
            :key="index"
            @click="toggleHole(hole)"
            :class="[
              'py-2 px-1 rounded-lg font-medium text-xs',
              activeHoles.includes(hole) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            ]"
            :disabled="hole > liquidLevel"
          >
            {{ hole }} m
          </button>
        </div>
      </div>
      
      <!-- Grafik Gösterimi -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Basınç-Derinlik Grafiği</label>
        <button 
          @click="showGraph = !showGraph"
          class="w-full py-2 px-4 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700"
        >
          {{ showGraph ? 'Grafiği Gizle' : 'Grafiği Göster' }}
        </button>
      </div>

      <!-- Arkaplan Rengi -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Arkaplan Rengi</label>
        <div class="grid grid-cols-4 gap-2">
          <button 
            @click="backgroundColor = 'bg-gray-900'" 
            class="h-8 w-8 bg-gray-900 rounded-lg border-2" 
            :class="backgroundColor === 'bg-gray-900' ? 'border-white' : 'border-transparent'"
          ></button>
          <button 
            @click="backgroundColor = 'bg-indigo-900'" 
            class="h-8 w-8 bg-indigo-900 rounded-lg border-2" 
            :class="backgroundColor === 'bg-indigo-900' ? 'border-white' : 'border-transparent'"
          ></button>
          <button 
            @click="backgroundColor = 'bg-blue-900'" 
            class="h-8 w-8 bg-blue-900 rounded-lg border-2" 
            :class="backgroundColor === 'bg-blue-900' ? 'border-white' : 'border-transparent'"
          ></button>
          <button 
            @click="backgroundColor = 'bg-gray-800'" 
            class="h-8 w-8 bg-gray-800 rounded-lg border-2" 
            :class="backgroundColor === 'bg-gray-800' ? 'border-white' : 'border-transparent'"
          ></button>
        </div>
      </div>
      
      <!-- Açıklamalar -->
      <div class="mt-6 p-3 bg-gray-700 rounded-lg text-sm">
        <h3 class="font-bold mb-2">Bilgi:</h3>
        <p>Sıvı basıncı (P), derinlik (h), sıvı yoğunluğu (d) ve yerçekimi ivmesi (g) ile hesaplanır:</p>
        <p class="my-2 text-center font-mono">P = h × d × g</p>
        <p>Derinlik arttıkça basınç doğrusal olarak artar.</p>
        <p class="mt-2">Farklı yoğunluktaki sıvılar farklı basınç değerleri oluşturur.</p>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Simülasyon durumu
const liquidLevel = ref(3.0); // metre
const sensorHeight = ref(1.5); // sensörün yüksekliği
const showGraph = ref(false);
const activeHoles = ref([]); // aktif delikler
const simulationContainer = ref(null);
const showMobileSettings = ref(false); // Mobil ayarlar modal durumu
const backgroundColor = ref('bg-gray-900'); // Arkaplan rengi

// Sıvılar ve özellikleri
const liquids = [
  { name: 'Su', density: 1000, color: 0x3498db, opacity: 0.7 },
  { name: 'Yağ', density: 900, color: 0xf1c40f, opacity: 0.8 },
  { name: 'Cıva', density: 13600, color: 0x95a5a6, opacity: 0.9 }
];
const currentLiquid = ref(liquids[0]);

// Three.js değişkenleri
let scene, camera, renderer, controls;
let tankGroup, liquidMesh, sensorMesh;
let waterJets = []; // Fışkıran su jetleri
let particleSystem; // Parçacık sistemi
let clock;

// Kamera pozisyonları
const cameraPositions = {
  top: { x: 0, y: 12, z: 0, lookAt: { x: 0, y: 0, z: 0 } },
  front: { x: 0, y: 2.5, z: 7, lookAt: { x: 0, y: 2.5, z: 0 } },
  side: { x: 7, y: 2.5, z: 0, lookAt: { x: 0, y: 2.5, z: 0 } },
  isometric: { x: 7, y: 5, z: 7, lookAt: { x: 0, y: 2.5, z: 0 } }
};

// Kamera pozisyonunu ayarlama fonksiyonu
function setCameraPosition(position) {
  if (!camera || !controls) return;
  
  const pos = cameraPositions[position];
  if (!pos) return;
  
  camera.position.set(pos.x, pos.y, pos.z);
  controls.target.set(pos.lookAt.x, pos.lookAt.y, pos.lookAt.z);
  controls.update();
}

// Kamerayı sıfırlama
function resetCamera() {
  if (!camera || !controls) return;
  
  camera.position.set(7, 5, 7);
  controls.target.set(0, 2.5, 0);
  controls.update();
}

// Arkaplan rengini güncelleme
watch(backgroundColor, (newColor) => {
  // Arkaplan rengi değiştiğinde, three.js scene arka plan rengini de değiştir
  if (scene) {
    if (newColor === 'bg-gray-900') scene.background = new THREE.Color(0x1a202c);
    else if (newColor === 'bg-indigo-900') scene.background = new THREE.Color(0x312e81);
    else if (newColor === 'bg-blue-900') scene.background = new THREE.Color(0x1e3a8a);
    else if (newColor === 'bg-gray-800') scene.background = new THREE.Color(0x1f2937);
    
    // Odanın (duvarlar, taban, tavan) rengini de arka planla aynı yap
    updateRoomColor();
  }
});

// Oda rengini güncelle
function updateRoomColor() {
  // Sahnenin arka plan rengiyle aynı rengi kullan
  const roomColor = scene.background.clone();
  
  // Odayı bul ve rengini güncelle
  scene.traverse((object) => {
    if (object.userData && object.userData.type === 'room') {
      object.material.color.copy(roomColor);
    }
  });
}

// Hesaplanan değerler
// Sensör derinliği = sıvı seviyesi - sensör yüksekliği
const sensorDerinligi = computed(() => liquidLevel.value - sensorHeight.value);

// Basınç değeri - Derinliğe göre hesaplanır (P = h * d * g)
const pressureValue = computed(() => {
  const g = 9.81; // yerçekimi ivmesi (m/s²)
  return sensorDerinligi.value * currentLiquid.value.density * g;
});

// Grafik için maksimum basınç
const maxPressure = computed(() => {
  const g = 9.81;
  return Math.ceil((liquidLevel.value * currentLiquid.value.density * g) / 1000) * 1000;
});

// Grafik yükseklik yüzdesi
const graphPercentage = computed(() => {
  return (pressureValue.value / maxPressure.value) * 100;
});

// Sıvı değiştirme fonksiyonu
function changeLiquid(liquid) {
  currentLiquid.value = liquid;
  if (liquidMesh) {
    liquidMesh.material.color.set(liquid.color);
    liquidMesh.material.opacity = liquid.opacity;
  }
  
  // Su jetlerini de güncelle
  waterJets.forEach(jet => {
    const depth = jet.userData.depth;
    scene.remove(jet);
    removeWaterJet(depth);
  });
  
  // Aktif delikleri tekrar oluştur
  const activeDelikler = [...activeHoles.value];
  activeHoles.value = [];
  
  activeDelikler.forEach(depth => {
    createWaterJet(depth);
    activeHoles.value.push(depth);
  });
  
  updateSimulation();
}

// Delik açma/kapatma fonksiyonu
function toggleHole(depth) {
  if (activeHoles.value.includes(depth)) {
    // Deliği kapat
    activeHoles.value = activeHoles.value.filter(h => h !== depth);
    removeWaterJet(depth);
  } else {
    // Delik aç
    activeHoles.value.push(depth);
    createWaterJet(depth);
  }
}

// Simülasyonu başlat
onMounted(() => {
  initThreeJS();
  clock = new THREE.Clock();
  animate();
  
  // Ekran boyutu değiştiğinde yeniden boyutlandır
  window.addEventListener('resize', onWindowResize);
});

// Temizlik işlemleri
onUnmounted(() => {
  if (renderer) {
    renderer.dispose();
  }
  
  // Animasyon döngüsünü durdur
  cancelAnimationFrame(animationFrameId);
  
  // Event listener'ı kaldır
  window.removeEventListener('resize', onWindowResize);
  
  // Kaynakları temizle
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
});

// Three.js sahnesini başlat
function initThreeJS() {
  // DOM element'i al
  const container = document.getElementById('three-container');
  
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a202c); // bg-gray-900
  
  // Kamera
  camera = new THREE.PerspectiveCamera(
    60, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(7, 5, 7);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  
  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 2.5, 0); // Kamera hedefini sıvının ortasına ayarla
  
  // Işıklar
  addLights();
  
  // Oda (duvarlar, taban, tavan)
  createRoom();
  
  // Tank ve sıvıyı oluştur
  createTank();
  createLiquid();
  
  // Sensörü oluştur
  createSensor();
  
  // Zemin ızgarası
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
  gridHelper.position.y = -0.01;
  scene.add(gridHelper);
}

// Işıklar ekle
function addLights() {
  // Ambiyans ışığı
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Yönlü ışık
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);
}

// Oda oluştur
function createRoom() {
  const roomSize = 20;
  const wallColor = 0x1a202c; // bg-gray-900 (arka planla aynı)
  
  // Duvar malzemesi
  const wallMaterial = new THREE.MeshBasicMaterial({ 
    color: wallColor,
    side: THREE.BackSide, 
    transparent: true,
    opacity: 0.1
  });
  
  // Oda geometrisi (küp)
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
  const room = new THREE.Mesh(roomGeometry, wallMaterial);
  room.position.set(0, roomSize/2 - 0.5, 0); // Zeminin üzerine yerleştir
  room.userData.type = 'room'; // Room tipini belirt
  
  scene.add(room);
}

// Su tankı oluştur
function createTank() {
  tankGroup = new THREE.Group();
  
  // Tank malzemesi - şeffaf
  const tankMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  
  // Tank boyutları
  const tankWidth = 4;
  const tankHeight = 5.5;
  const tankDepth = 3;
  
  // Tank tabanı
  const floorGeometry = new THREE.BoxGeometry(tankWidth, 0.1, tankDepth);
  const floor = new THREE.Mesh(floorGeometry, tankMaterial);
  floor.position.set(0, 0, 0);
  tankGroup.add(floor);
  
  // Tank duvarları
  // Sol duvar
  const wallGeometry = new THREE.BoxGeometry(0.1, tankHeight, tankDepth);
  const leftWall = new THREE.Mesh(wallGeometry, tankMaterial);
  leftWall.position.set(-tankWidth/2, tankHeight/2, 0);
  tankGroup.add(leftWall);
  
  // Sağ duvar
  const rightWall = new THREE.Mesh(wallGeometry, tankMaterial);
  rightWall.position.set(tankWidth/2, tankHeight/2, 0);
  tankGroup.add(rightWall);
  
  // Arka duvar
  const backWallGeometry = new THREE.BoxGeometry(tankWidth, tankHeight, 0.1);
  const backWall = new THREE.Mesh(backWallGeometry, tankMaterial);
  backWall.position.set(0, tankHeight/2, -tankDepth/2);
  tankGroup.add(backWall);
  
  // Ön duvar (şeffaf)
  const frontWall = new THREE.Mesh(backWallGeometry, tankMaterial.clone());
  frontWall.material.opacity = 0.1; // Daha şeffaf ön duvar
  frontWall.position.set(0, tankHeight/2, tankDepth/2);
  tankGroup.add(frontWall);
  
  scene.add(tankGroup);
}

// Sıvı oluştur
function createLiquid() {
  const liquidGeometry = new THREE.BoxGeometry(3.9, liquidLevel.value, 2.9);
  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: currentLiquid.value.color,
    transparent: true,
    opacity: currentLiquid.value.opacity,
    roughness: 0.0,
    metalness: 0.1
  });
  
  liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquidMesh.position.set(0, liquidLevel.value/2, 0);
  scene.add(liquidMesh);
}

// Sensör oluştur
function createSensor() {
  // Sensör (küçük küre)
  const sensorGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  sensorMesh = new THREE.Mesh(sensorGeometry, sensorMaterial);
  updateSensorPosition();
  
  scene.add(sensorMesh);
  
  // Sensör çubuğu (sensörü sıvıda tutacak çubuk)
  const stickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 10, 8);
  const stickMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
  
  const sensorStick = new THREE.Mesh(stickGeometry, stickMaterial);
  sensorStick.position.set(0, 5, 0);
  
  scene.add(sensorStick);
}

// Su jeti oluştur (delikten fışkıran su)
function createWaterJet(depth) {
  // Tank kenarının X koordinatı (sağ duvar)
  const tankWallX = 2;
  
  // Delik derinliğinde su jeti ekle - Torricelli formülüne göre fışkırma mesafesi
  // Düşük basınçta çok kısa jetler oluşmaması için minimum uzunluk ekleyelim
  const basePressure = (liquidLevel.value - depth) * 9.81;
  const jetLength = Math.max(0.3, Math.sqrt(2 * 9.81 * (liquidLevel.value - depth)) * 0.5);
  
  // Delik geometrisi - kabın duvarında göstermek için
  const holeRadius = 0.05;
  const holeGeometry = new THREE.CircleGeometry(holeRadius, 16);
  const holeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    side: THREE.DoubleSide
  });
  const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
  
  // Deliği duvarın tam üzerine yerleştir ve X ekseni yönünde dik olacak şekilde döndür
  holeMesh.position.set(tankWallX + 0.051, depth, 0);
  holeMesh.rotation.y = Math.PI / 2; // Y ekseni etrafında döndürme
  scene.add(holeMesh);
  
  // Delik çevresi (suyun duvara temas ettiği yer)
  const holeRingGeometry = new THREE.RingGeometry(holeRadius, holeRadius + 0.01, 16);
  const holeRingMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x333333,
    side: THREE.DoubleSide
  });
  const holeRing = new THREE.Mesh(holeRingGeometry, holeRingMaterial);
  holeRing.position.set(tankWallX + 0.05, depth, 0);
  holeRing.rotation.y = Math.PI / 2;
  scene.add(holeRing);
  
  // Jet geometrisi - Silindir şeklinde
  // Kalın uç (startRadius) deliğe temas edecek, ince uç (endRadius) jetin ucunda olacak
  const startRadius = holeRadius;        // Delik çapında başla
  const endRadius = holeRadius * 0.6;    // Uçta daralma olsun
  
  // THREE.CylinderGeometry parametreleri: (üst yarıçap, alt yarıçap, yükseklik, radyal segment sayısı)
  // Not: Silindir varsayılan olarak Y ekseni boyunca uzanır
  const jetGeometry = new THREE.CylinderGeometry(endRadius, startRadius, jetLength, 16);
  
  // Jet eğimi oluştur - Silindir varsayılan olarak Y ekseni boyunca uzanır
  // Önce X ekseni etrafında 90 derece döndürüp zemine paralel yapalım
  jetGeometry.rotateX(Math.PI);
  
  // Sonra silindir kabın dışına doğru, X+ yönünde çıkacak şekilde konumlandıralım
  // Z ekseni etrafında 90 derece döndürerek kabın dışına doğru yönlendiriyoruz
  
  // Su jeti malzemesi
  const jetMaterial = new THREE.MeshPhysicalMaterial({
    color: currentLiquid.value.color,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.2
  });
  
  // Jet mesh'i
  const jetMesh = new THREE.Mesh(jetGeometry, jetMaterial);
  
  // Jetin konumunu ayarla - Delikten başlayacak ve zemine paralel ilerleyecek
  const jetPositionX = tankWallX + 0.05 + (jetLength / 2);
  
  // Jetin rotasyonunu ayarla - Zemine paralel, duvardan dışarı doğru
  jetMesh.rotation.z = Math.PI / 2; // Z ekseni etrafında 90 derece döndür
  
  // Jet pozisyonu
  jetMesh.position.set(jetPositionX, depth, 0);
  
  // Bilgi saklama
  jetMesh.userData = { depth, holeMesh, holeRing };
  
  scene.add(jetMesh);
  waterJets.push(jetMesh);
  
  // Su damlaları (parçacık sistemi basitleştirilmiş hali)
  createWaterDrops(depth, tankWallX + 0.05 + jetLength);
}

// Su jeti kaldır
function removeWaterJet(depth) {
  // Deliğe ait tüm nesneleri kaldır
  const jetsToRemove = waterJets.filter(jet => jet.userData && jet.userData.depth === depth);
  
  jetsToRemove.forEach(jet => {
    // Delik görselini kaldır
    if (jet.userData.holeMesh) {
      scene.remove(jet.userData.holeMesh);
    }
    
    // Delik çevresi görselini kaldır
    if (jet.userData.holeRing) {
      scene.remove(jet.userData.holeRing);
    }
    
    scene.remove(jet);
    waterJets = waterJets.filter(j => j !== jet);
  });
}

// Su damlaları oluştur
function createWaterDrops(depth, endX) {
  // Her delik için 3-5 damla oluştur (daha fazla detay)
  for (let i = 0; i < 5; i++) {
    const dropSize = 0.03 + Math.random() * 0.02;
    const dropGeometry = new THREE.SphereGeometry(dropSize, 8, 8);
    const dropMaterial = new THREE.MeshPhysicalMaterial({
      color: currentLiquid.value.color,
      transparent: true,
      opacity: 0.6,
      roughness: 0,
      metalness: 0.1
    });
    
    const drop = new THREE.Mesh(dropGeometry, dropMaterial);
    
    // Damlalar jetin ucunda biraz dağınık yerleştirilir
    // Yavaş bir parabol çizimi için basit fizik hesabı - zemine doğru düşüş
    const randomOffset = Math.random() * 0.2;
    const horizontalOffset = Math.random() * 0.05; // Yatay ofset
    const verticalDrop = (i * 0.05) + (randomOffset * 0.1); // Düşüş miktarı
    
    // Damlaları konumlandır - zemine doğru düşecek şekilde
    drop.position.set(
      endX + randomOffset, // X: jetin ucu + rastgele offset
      depth - verticalDrop, // Y: delik yüksekliği - düşüş miktarı
      (Math.random() - 0.5) * 0.1 // Z: biraz derinlik katmak için
    );
    
    // Bu damlanın hangi deliğe ait olduğunu kaydedelim
    drop.userData = { depth, type: 'drop' };
    
    scene.add(drop);
    waterJets.push(drop); // Aynı dizide tutuyoruz, delik kapatıldığında hepsi temizlenecek
  }
}

// Sıvı seviyesi değiştiğinde
function updateLiquidLevel() {
  // Mevcut sıvıyı kaldır
  if (liquidMesh) {
    scene.remove(liquidMesh);
  }
  
  // Yeni sıvı oluştur
  createLiquid();
  
  // Sıvı seviyesi değiştiğinde deliklerden bazıları sıvının üzerine çıkabilir
  // Bu durumda o delikleri kapatmalıyız
  const removedHoles = [];
  
  activeHoles.value.forEach(depth => {
    if (depth > liquidLevel.value) {
      removedHoles.push(depth);
      removeWaterJet(depth);
    } else {
      // Sıvı seviyesi değiştiğinde fışkırma mesafesi de değişecek
      // Bu yüzden su jetini yeniden oluşturuyoruz
      removeWaterJet(depth);
      createWaterJet(depth);
    }
  });
  
  // Artık aktif olmayan delikleri listeden çıkar
  activeHoles.value = activeHoles.value.filter(depth => !removedHoles.includes(depth));
}

// Sensör pozisyonunu güncelle
function updateSensorPosition() {
  if (sensorMesh) {
    sensorMesh.position.y = sensorHeight.value;
  }
}

// Simülasyonu güncelle
function updateSimulation() {
  updateLiquidLevel();
  updateSensorPosition();
  
  // Su jetlerini güncelle - zaten updateLiquidLevel içinde yapılıyor
}

// Pencere boyutu değiştiğinde
function onWindowResize() {
  const container = document.getElementById('three-container');
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animasyon döngüsü
let animationFrameId;
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  const time = Date.now() * 0.002;
  
  // Kontrolleri güncelle
  controls.update();
  
  // Su jetlerini ve damlaları animasyonla güncelle
  waterJets.forEach(jet => {
    if (jet.userData && jet.userData.type === 'drop') {
      // Damlalar için hafif titreşim animasyonu
      jet.position.y -= 0.003; // Aşağı doğru düşme hareketi
      
      // Damla sıvı seviyesinin altına düştüyse, tekrar yukarı al
      if (jet.position.y < 0) {
        const depth = jet.userData.depth;
        const tankWallX = 2;
        const jetLength = Math.sqrt(2 * 9.81 * (liquidLevel.value - depth)) * 0.5;
        const endX = tankWallX + jetLength;
        
        // Damlaları tekrar konumlandır
        const randomOffset = Math.random() * 0.2;
        jet.position.set(
          endX + randomOffset,
          depth,
          (Math.random() - 0.5) * 0.1
        );
      }
    } else {
      // Su jeti için hafif dalgalanma
      // Sinüs dalgası kullanarak doğal bir akış efekti
      jet.rotation.z = Math.PI / 2 + Math.sin(time + jet.position.y) * 0.02;
    }
  });
  
  // Render
  renderer.render(scene, camera);
}

// İzleyiciler
watch(liquidLevel, () => {
  // Sıvı seviyesi değiştiğinde sensör derinliği sıvı seviyesini aşamaz
  if (sensorHeight.value > liquidLevel.value) {
    sensorHeight.value = liquidLevel.value;
  }
  
  updateLiquidLevel();
});

watch(sensorHeight, () => {
  updateSensorPosition();
});
</script>
  
 
 