<template>
  <div class="w-full h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
    <!-- Ana içerik alanı -->
    <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
      <!-- Three.js simülasyon alanı -->
      <div ref="containerRef" class="flex-1 relative min-h-[70vh] md:min-h-full">
        <!-- Yükleme göstergesi -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10">
          <div class="text-xl">
            <svg class="animate-spin -ml-1 mr-3 h-10 w-10 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Yükleniyor...
          </div>
        </div>
        
        <!-- Sonuçlar overlay -->
        <div class="absolute top-4 left-4 bg-gray-800 bg-opacity-80 p-3 sm:p-4 rounded-lg shadow-xl z-10 backdrop-blur-sm text-xs sm:text-sm">
          <div class="text-base sm:text-lg font-semibold mb-2 border-b border-blue-500 pb-1">Sonuçlar</div>
          <div class="grid grid-cols-2 gap-1 sm:gap-2">
            <div class="font-medium text-gray-300">Uygulanan Kuvvet:</div>
            <div class="font-bold text-blue-400">{{ formattedForce1 }} N</div>
            
            <div class="font-medium text-gray-300">Üretilen Kuvvet:</div>
            <div class="font-bold text-green-400">{{ formattedForce2 }} N</div>
            
            <div class="font-medium text-gray-300">Basınç:</div>
            <div class="font-bold text-yellow-400">{{ formattedPressure }} Pa</div>
            
            <div class="font-medium text-gray-300">Kuvvet Kazancı:</div>
            <div class="font-bold text-pink-400">{{ formattedForceGain }}x</div>
          </div>
        </div>
        
        <!-- Mobil için ayarlar butonu -->
        <button @click="showMobileSettings = true" class="md:hidden absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full shadow-xl z-10 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        

        

        
        <!-- Arkaplan renk seçenekleri -->
        <div class="absolute bottom-20 left-4 z-10 flex flex-col bg-gray-800 bg-opacity-70 rounded-lg p-2 shadow-xl">
          <div class="text-xs sm:text-sm font-medium mb-2">Arka Plan Rengi</div>
          <div class="flex space-x-2">
            <button @click="changeBackgroundColor('dark')" class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-900 border-2 transition-transform duration-200 transform hover:scale-110" :class="{'border-white': backgroundColor === 'dark', 'border-transparent': backgroundColor !== 'dark'}"></button>
            <button @click="changeBackgroundColor('blue')" class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-900 border-2 transition-transform duration-200 transform hover:scale-110" :class="{'border-white': backgroundColor === 'blue', 'border-transparent': backgroundColor !== 'blue'}"></button>
            <button @click="changeBackgroundColor('purple')" class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-900 border-2 transition-transform duration-200 transform hover:scale-110" :class="{'border-white': backgroundColor === 'purple', 'border-transparent': backgroundColor !== 'purple'}"></button>
            <button @click="changeBackgroundColor('green')" class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-900 border-2 transition-transform duration-200 transform hover:scale-110" :class="{'border-white': backgroundColor === 'green', 'border-transparent': backgroundColor !== 'green'}"></button>
          </div>
        </div>
        

      </div>

      <!-- Kontrol paneli (masaüstü için) -->
      <div class="hidden md:block w-full md:w-80 p-4 bg-gray-800 overflow-y-auto shadow-lg border-l border-gray-700">
        <h2 class="text-xl font-bold mb-4 text-center border-b border-indigo-500 pb-2">Kontrol Paneli</h2>
        
        <div class="mb-6 bg-gray-700 rounded-lg p-3">
          <label class="block mb-2 text-blue-300 font-medium">Küçük Piston Çapı (cm)</label>
          <input 
            type="range" 
            v-model.number="smallPistonDiameter"
            min="1" 
            max="10" 
            step="0.5"
            class="w-full accent-blue-500 h-2 rounded-lg" 
          />
          <div class="flex justify-between mt-1">
            <span class="text-xs">1 cm</span>
            <span class="text-white font-medium">{{ smallPistonDiameter }} cm</span>
            <span class="text-xs">10 cm</span>
          </div>
        </div>
        
        <div class="mb-6 bg-gray-700 rounded-lg p-3">
          <label class="block mb-2 text-blue-300 font-medium">Büyük Piston Çapı (cm)</label>
          <input 
            type="range" 
            v-model.number="largePistonDiameter"
            min="5" 
            max="25" 
            step="0.5"
            class="w-full accent-blue-500 h-2 rounded-lg" 
          />
          <div class="flex justify-between mt-1">
            <span class="text-xs">5 cm</span>
            <span class="text-white font-medium">{{ largePistonDiameter }} cm</span>
            <span class="text-xs">25 cm</span>
          </div>
        </div>

        <div class="mb-6 bg-gray-700 rounded-lg p-3">
          <label class="block mb-2 text-blue-300 font-medium">Uygulanan Kuvvet (N)</label>
          <input 
            type="range" 
            v-model.number="appliedForce"
            min="0" 
            max="100" 
            step="1"
            class="w-full accent-blue-500 h-2 rounded-lg" 
          />
          <div class="flex justify-between mt-1">
            <span class="text-xs">0 N</span>
            <span class="text-white font-medium">{{ appliedForce }} N</span>
            <span class="text-xs">100 N</span>
          </div>
        </div>

        <div class="mb-6">
          <button 
            v-if="hasChanges"
            @click="resetSimulation" 
            class="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow transition-all duration-200 font-medium"
          >
            Sıfırla
          </button>
        </div>


      </div>
    </div>
    
    <!-- Mobil için ayarlar modal -->
    <div v-if="showMobileSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-70 z-20 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-xs max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 class="text-xl font-bold text-white">Kontrol Paneli</h2>
          <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-4">
          <div class="mb-6 bg-gray-700 rounded-lg p-3">
            <label class="block mb-2 text-blue-300 font-medium">Küçük Piston Çapı (cm)</label>
            <input 
              type="range" 
              v-model.number="smallPistonDiameter"
              min="1" 
              max="10" 
              step="0.5"
              class="w-full accent-blue-500 h-2 rounded-lg" 
            />
            <div class="flex justify-between mt-1">
              <span class="text-xs">1 cm</span>
              <span class="text-white font-medium">{{ smallPistonDiameter }} cm</span>
              <span class="text-xs">10 cm</span>
            </div>
          </div>
          
          <div class="mb-6 bg-gray-700 rounded-lg p-3">
            <label class="block mb-2 text-blue-300 font-medium">Büyük Piston Çapı (cm)</label>
            <input 
              type="range" 
              v-model.number="largePistonDiameter"
              min="5" 
              max="25" 
              step="0.5"
              class="w-full accent-blue-500 h-2 rounded-lg" 
            />
            <div class="flex justify-between mt-1">
              <span class="text-xs">5 cm</span>
              <span class="text-white font-medium">{{ largePistonDiameter }} cm</span>
              <span class="text-xs">25 cm</span>
            </div>
          </div>

          <div class="mb-6 bg-gray-700 rounded-lg p-3">
            <label class="block mb-2 text-blue-300 font-medium">Uygulanan Kuvvet (N)</label>
            <input 
              type="range" 
              v-model.number="appliedForce"
              min="0" 
              max="100" 
              step="1"
              class="w-full accent-blue-500 h-2 rounded-lg" 
            />
            <div class="flex justify-between mt-1">
              <span class="text-xs">0 N</span>
              <span class="text-white font-medium">{{ appliedForce }} N</span>
              <span class="text-xs">100 N</span>
            </div>
          </div>

          <div class="mb-6">
            <button 
              v-if="hasChanges"
              @click="resetSimulation" 
              class="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow transition-all duration-200 font-medium"
            >
              Sıfırla
            </button>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar ve durum değişkenleri
const containerRef = ref(null);
const loading = ref(true);
const smallPistonDiameter = ref(2.5);
const largePistonDiameter = ref(10);
const appliedForce = ref(20);
const isAnimating = ref(true);
const showMobileSettings = ref(false);
const backgroundColor = ref('dark');

// İlk değerleri tutmak için
const initialSmallPistonDiameter = 2.5;
const initialLargePistonDiameter = 10;
const initialAppliedForce = 20;

// Ayarlarda değişiklik olup olmadığını izle
const hasChanges = computed(() => {
  return smallPistonDiameter.value !== initialSmallPistonDiameter || 
         largePistonDiameter.value !== initialLargePistonDiameter || 
         appliedForce.value !== initialAppliedForce;
});

// Simülasyon değişkenleri
let scene, camera, renderer, controls;
let smallPiston, largePiston;
let smallPistonHeight = 0.5;
let largePistonHeight = 0.5;
let cylinderHeight = 10;
let smallPistonYPosition = 5;
let largePistonYPosition = 5;
let animationFrameId = null;
// Sıvı referansları
let smallFluid, largeFluid, connectionFluid;
// Etiketler
let smallPistonLabel, largePistonLabel;

// Hesaplanan değerler
const smallPistonArea = computed(() => Math.PI * Math.pow(smallPistonDiameter.value / 100, 2) / 4);
const largePistonArea = computed(() => Math.PI * Math.pow(largePistonDiameter.value / 100, 2) / 4);
const pressure = computed(() => appliedForce.value / smallPistonArea.value);
const force2 = computed(() => pressure.value * largePistonArea.value);
const forceGain = computed(() => force2.value / appliedForce.value);

// Formatlanmış değerler
const formattedForce1 = computed(() => Number(appliedForce.value).toFixed(1));
const formattedForce2 = computed(() => Number(force2.value).toFixed(1));
const formattedPressure = computed(() => Number(pressure.value).toFixed(0));
const formattedForceGain = computed(() => Number(forceGain.value).toFixed(1));

// Arkaplan rengini değiştir
const changeBackgroundColor = (color) => {
  backgroundColor.value = color;
  
  if (scene) {
    switch (color) {
      case 'dark':
        scene.background = new THREE.Color(0x0a1929);
        scene.fog = new THREE.FogExp2(0x0a1929, 0.01);
        break;
      case 'blue':
        scene.background = new THREE.Color(0x172554);
        scene.fog = new THREE.FogExp2(0x172554, 0.01);
        break;
      case 'purple':
        scene.background = new THREE.Color(0x2e1065);
        scene.fog = new THREE.FogExp2(0x2e1065, 0.01);
        break;
      case 'green':
        scene.background = new THREE.Color(0x022c22);
        scene.fog = new THREE.FogExp2(0x022c22, 0.01);
        break;
    }
  }
};

// Kamera açısını ayarla
const setCameraView = (view) => {
  if (!camera || !controls) return;
  
  switch (view) {
    case 'front':
      // Önden görünüm
      camera.position.set(0, 0, 22);
      break;
    case 'side':
      // Yandan görünüm
      camera.position.set(22, 0, 0);
      break;
    case 'top':
      // Üstten görünüm
      camera.position.set(0, 22, 0);
      break;
    case 'isometric':
      // İzometrik görünüm
      camera.position.set(15, 15, 15);
      break;
    case 'reset':
      // Varsayılan görünüm
      camera.position.set(0, 2, 22);
      break;
  }
  
  // Kamerayı pistona doğru yönlendir
  controls.target.set(0, 0, 0);
  controls.update();
};

// Animasyonu başlat/durdur
const startAnimation = () => {
  if (!isAnimating.value) {
    isAnimating.value = true;
    animate();
  }
};

const pauseAnimation = () => {
  isAnimating.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

// Three.js sahnesini başlat
const initThree = () => {
  // Sahne oluştur
  scene = new THREE.Scene();
  // Daha güzel bir arka plan rengi
  scene.background = new THREE.Color(0xd1fae5);
  
  // Fog ekleyerek derinlik hissi kat
  scene.fog = new THREE.FogExp2(0xd1fae5, 0.01);

  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(
    60, 
    containerRef.value.clientWidth / containerRef.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 2, 22);

  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  // Daha parlak renkler için
  if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  } else if (renderer.outputColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  containerRef.value.appendChild(renderer.domElement);

  // Orbit kontrolleri ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 1.5;

  // Işıklar ekle - daha iyi ışıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Nokta ışık ekleyerek bazı vurguları belirginleştir
  const pointLight1 = new THREE.PointLight(0x3b82f6, 0.8, 20);
  pointLight1.position.set(-5, 8, 5);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0xef4444, 0.8, 20);
  pointLight2.position.set(5, 8, 5);
  scene.add(pointLight2);

  // Duvarlar, tavan ve zemin ekle
  addWalls();
  
  // Izgara ekle (daha iyi oryantasyon için)
  const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x333333);
  gridHelper.position.y = -10;
  scene.add(gridHelper);
  
  // Hidrolik sistem oluştur
  createHydraulicSystem();

  // Animasyon döngüsü başlat
  animate();
  loading.value = false;
};

// Duvarlar ekle
const addWalls = () => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a202c,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.2,
  });

  // Zemin - sadece zemini görünür bırakıyoruz
  const floorGeometry = new THREE.PlaneGeometry(40, 40);
  const floor = new THREE.Mesh(floorGeometry, wallMaterial);
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -10;
  floor.receiveShadow = true;
  scene.add(floor);


  
  // Tavan
  const ceilingGeometry = new THREE.PlaneGeometry(40, 40);
  const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 30;
  ceiling.receiveShadow = true;
  scene.add(ceiling);
};

// Hidrolik sistemi oluştur
const createHydraulicSystem = () => {
  // Malzemeler - daha iyi materyaller
  const smallPistonMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xef4444,
    roughness: 0.3,
    metalness: 0.8
  });
  
  const largePistonMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3b82f6,
    roughness: 0.3,
    metalness: 0.8
  });
  
  const fluidMaterial = new THREE.MeshPhysicalMaterial({ 
    color: 0x60a5fa, 
    transparent: true, 
    opacity: 0.7,
    roughness: 0.1,
    transmission: 0.5, // Cam gibi görünüm
    ior: 1.4 // Su kırılma indeksi
  });
  
  const tubeWallMaterial = new THREE.MeshPhysicalMaterial({ 
    color: 0xd1d5db, 
    transparent: true, 
    opacity: 0.3,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5
  });

  // Küçük piston silindiri
  const smallCylinderGeometry = new THREE.CylinderGeometry(
    smallPistonDiameter.value / 10, 
    smallPistonDiameter.value / 10, 
    cylinderHeight, 
    32
  );
  const smallCylinder = new THREE.Mesh(smallCylinderGeometry, tubeWallMaterial);
  smallCylinder.position.set(-5, 0, 0);
  smallCylinder.castShadow = true;
  smallCylinder.receiveShadow = true;
  scene.add(smallCylinder);

  // Silindirlerin altına platform ekle
  const platformGeometry = new THREE.BoxGeometry(15, 0.5, 4);
  const platformMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4b5563,
    roughness: 0.7,
    metalness: 0.3
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = -5.25;
  platform.receiveShadow = true;
  platform.castShadow = true;
  scene.add(platform);

  // Büyük piston silindiri
  const largeCylinderGeometry = new THREE.CylinderGeometry(
    largePistonDiameter.value / 10, 
    largePistonDiameter.value / 10, 
    cylinderHeight, 
    32
  );
  const largeCylinder = new THREE.Mesh(largeCylinderGeometry, tubeWallMaterial);
  largeCylinder.position.set(5, 0, 0);
  largeCylinder.castShadow = true;
  largeCylinder.receiveShadow = true;
  scene.add(largeCylinder);

  // Bağlantı tüpü - daha iyi görünüm için çerçeve ekle
  const connectionTubeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 16);
  const connectionTube = new THREE.Mesh(connectionTubeGeometry, tubeWallMaterial);
  connectionTube.rotation.z = Math.PI / 2;
  connectionTube.position.set(0, -4, 0);
  connectionTube.castShadow = true;
  connectionTube.receiveShadow = true;
  scene.add(connectionTube);

  // Küçük piston
  const smallPistonGeometry = new THREE.CylinderGeometry(
    smallPistonDiameter.value / 10 - 0.02, 
    smallPistonDiameter.value / 10 - 0.02, 
    smallPistonHeight, 
    32
  );
  smallPiston = new THREE.Mesh(smallPistonGeometry, smallPistonMaterial);
  smallPiston.position.set(-5, smallPistonYPosition, 0);
  smallPiston.castShadow = true;
  scene.add(smallPiston);

  // Küçük piston kolu
  const smallPistonRodGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 16);
  const smallPistonRod = new THREE.Mesh(smallPistonRodGeometry, smallPistonMaterial);
  smallPistonRod.position.set(-5, smallPistonYPosition + 2.5, 0);
  smallPistonRod.castShadow = true;
  scene.add(smallPistonRod);

  // Küçük piston kolu üstüne kol başlığı
  const smallPistonCapGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
  const smallPistonCap = new THREE.Mesh(smallPistonCapGeometry, smallPistonMaterial);
  smallPistonCap.position.set(-5, smallPistonYPosition + 5, 0);
  smallPistonCap.castShadow = true;
  scene.add(smallPistonCap);

  // Büyük piston
  const largePistonGeometry = new THREE.CylinderGeometry(
    largePistonDiameter.value / 10 - 0.02, 
    largePistonDiameter.value / 10 - 0.02, 
    largePistonHeight, 
    32
  );
  largePiston = new THREE.Mesh(largePistonGeometry, largePistonMaterial);
  largePiston.position.set(5, largePistonYPosition, 0);
  largePiston.castShadow = true;
  scene.add(largePiston);

  // Büyük piston kolu
  const largePistonRodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 16);
  const largePistonRod = new THREE.Mesh(largePistonRodGeometry, largePistonMaterial);
  largePistonRod.position.set(5, largePistonYPosition + 2.5, 0);
  largePistonRod.castShadow = true;
  scene.add(largePistonRod);

  // Büyük piston kolu üstüne kol başlığı
  const largePistonCapGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 32);
  const largePistonCap = new THREE.Mesh(largePistonCapGeometry, largePistonMaterial);
  largePistonCap.position.set(5, largePistonYPosition + 5, 0);
  largePistonCap.castShadow = true;
  scene.add(largePistonCap);

  // Su (sıvı) oluştur - küçük silindir içinde
  const smallFluidGeometry = new THREE.CylinderGeometry(
    smallPistonDiameter.value / 10 - 0.05, 
    smallPistonDiameter.value / 10 - 0.05, 
    cylinderHeight - 0.5,
    32
  );
  smallFluid = new THREE.Mesh(smallFluidGeometry, fluidMaterial);
  smallFluid.position.set(-5, 0, 0);
  smallFluid.material = smallFluid.material.clone();
  smallFluid.material.clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 5),  // Alt düzlem
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 5)  // Üst düzlem
  ];
  scene.add(smallFluid);

  // Su (sıvı) oluştur - büyük silindir içinde
  const largeFluidGeometry = new THREE.CylinderGeometry(
    largePistonDiameter.value / 10 - 0.05, 
    largePistonDiameter.value / 10 - 0.05, 
    cylinderHeight - 0.5,
    32
  );
  largeFluid = new THREE.Mesh(largeFluidGeometry, fluidMaterial);
  largeFluid.position.set(5, 0, 0);
  largeFluid.material = smallFluid.material.clone();
  largeFluid.material.clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 5),  // Alt düzlem
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 5)  // Üst düzlem
  ];
  scene.add(largeFluid);
  
  // Bağlantı borusundaki su
  const connectionFluidGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10 - 0.2, 16);
  connectionFluid = new THREE.Mesh(connectionFluidGeometry, fluidMaterial);
  connectionFluid.rotation.z = Math.PI / 2;
  connectionFluid.position.set(0, -4, 0);
  scene.add(connectionFluid);
  
  // Oklar ve etiketler ekleniyor - daha anlaşılırlığı artırmak için
  addLabelsAndArrows();
};

// Oklar ve etiketler ekle - anlaşılırlığı artırmak için
const addLabelsAndArrows = () => {
  // Ok işaretleri için geometriler
  const arrowHeadGeometry = new THREE.ConeGeometry(0.3, 0.6, 16);
  const arrowBodyGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 16);
  
  // Kuvvet okları için materyal
  const forceArrowMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
  
  // Küçük piston için kuvvet oku (aşağı doğru)
  const smallForceArrowBody = new THREE.Mesh(arrowBodyGeometry, forceArrowMaterial);
  smallForceArrowBody.position.set(-5, smallPistonYPosition + 6.5, 0);
  scene.add(smallForceArrowBody);
  
  const smallForceArrowHead = new THREE.Mesh(arrowHeadGeometry, forceArrowMaterial);
  smallForceArrowHead.position.set(-5, smallPistonYPosition + 5.4, 0);
  smallForceArrowHead.rotation.x = Math.PI; // Aşağı baksın
  scene.add(smallForceArrowHead);
  
  // Büyük piston için kuvvet oku (yukarı doğru)
  const largeForceArrowBody = new THREE.Mesh(arrowBodyGeometry, forceArrowMaterial);
  largeForceArrowBody.position.set(5, largePistonYPosition + 6.5, 0);
  scene.add(largeForceArrowBody);
  
  const largeForceArrowHead = new THREE.Mesh(arrowHeadGeometry, forceArrowMaterial);
  largeForceArrowHead.position.set(5, largePistonYPosition + 7.6, 0);
  scene.add(largeForceArrowHead);
};

// Animasyon döngüsü
const animate = () => {
  if (!isAnimating.value) return;
  
  animationFrameId = requestAnimationFrame(animate);
  
  // Pistonu hareket ettir
  if (smallPiston && largePiston) {
    // Küçük piston konumu, uygulanan kuvvete göre hesaplanır
    // Not: Daha gerçekçi bir simülasyon için fizik formülleri eklenebilir
    const maxDisplacement = 3; // Maksimum hareket mesafesi
    const smallPistonDisplacement = (Number(appliedForce.value) / 100) * maxDisplacement;
    smallPiston.position.y = smallPistonYPosition - smallPistonDisplacement;
    
    // Pascal prensibi uygulanır: F1/A1 = F2/A2
    // Büyük piston, küçük pistondan daha az hareket eder ama daha fazla kuvvet uygular
    const areaRatio = smallPistonArea.value / largePistonArea.value;
    const largePistonDisplacement = smallPistonDisplacement * areaRatio;
    largePiston.position.y = largePistonYPosition + largePistonDisplacement;
    
    // Sıvı pozisyonlarını ve kesme düzlemlerini güncelle
    if (smallFluid && largeFluid && connectionFluid) {
      // Küçük piston sıvısı: Piston aşağı indikçe sıvı sıkışmalı
      smallFluid.scale.y = 1 - (smallPistonDisplacement / cylinderHeight);
      smallFluid.position.y = -smallPistonDisplacement / 2;
      
      // Büyük piston sıvısı: Küçük pistondaki sıvı sıkıştıkça büyük pistonun sıvısı yukarı çıkmalı
      largeFluid.scale.y = 1 + (largePistonDisplacement / cylinderHeight);
      largeFluid.position.y = largePistonDisplacement / 2;
      
      // Bağlantı borusundaki su - basınç arttıkça genişlesin
      // Kullanılan kuvvet arttıkça bağlantı borusundaki su hafifçe genişler
      const connectionExpansion = (smallPistonDisplacement / maxDisplacement) * 0.2;
      connectionFluid.scale.y = 1 + connectionExpansion;
      
      // Kesme düzlemlerini güncelle - küçük piston
      if (smallFluid.material.clippingPlanes) {
        // Alt düzlem - pistonun alt noktasına göre ayarla
        smallFluid.material.clippingPlanes[0].constant = 5 + smallPistonDisplacement;
      }
      
      // Kesme düzlemlerini güncelle - büyük piston
      if (largeFluid.material.clippingPlanes) {
        // Üst düzlem - pistonun üst noktasına göre ayarla
        largeFluid.material.clippingPlanes[1].constant = 5 - largePistonDisplacement;
      }
    }
  }
  
  controls.update();
  renderer.render(scene, camera);
};

// Boyut değişikliklerinde tepki ver
const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return;
  
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
};

// Pistonu güncelle
const updatePistons = () => {
  // Mevcut objeleri sahneden kaldır
  if (scene) {
    scene.clear();
    
    // Işıkları yeniden ekle
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Duvarları yeniden ekle
    addWalls();
    
    // Hidrolik sistemi yeniden oluştur
    createHydraulicSystem();
  }
};

// Simülasyonu sıfırla
const resetSimulation = () => {
  showMobileSettings.value = false;
  pauseAnimation();
  
  // Değerleri ilk haline getir
  smallPistonDiameter.value = initialSmallPistonDiameter;
  largePistonDiameter.value = initialLargePistonDiameter;
  appliedForce.value = initialAppliedForce;
  
  // Simülasyonu güncelle
  updatePistons();
  
  // Animasyonu yeniden başlat
  startAnimation();
};

// İzleyiciler
watch([smallPistonDiameter, largePistonDiameter], updatePistons);

// Yaşam döngüsü metodları
onMounted(() => {
  // Pencere boyut değişikliği olayını dinle
  window.addEventListener('resize', handleResize);
  
  // Three.js'i başlat
  initThree();
});

onBeforeUnmount(() => {
  // Temizleme işlemleri
  window.removeEventListener('resize', handleResize);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (renderer) {
    renderer.dispose();
    if (containerRef.value) {
      containerRef.value.removeChild(renderer.domElement);
    }
  }
  
  // Three.js nesnelerini temizle (memory leak önlemek için)
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
</script>
  
 
 