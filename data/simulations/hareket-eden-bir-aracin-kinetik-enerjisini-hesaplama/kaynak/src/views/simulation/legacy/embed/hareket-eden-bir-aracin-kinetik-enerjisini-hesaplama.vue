<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- Simulasyon Canvas -->
    <div ref="canvasContainer" class="w-full h-full"></div>
    
    <!-- Bilgi Paneli -->
    <div class="absolute md:top-4 left-4 bottom-1/3 md:bottom-auto  bg-gray-900 bg-opacity-90 text-white p-3 rounded-lg max-w-xs z-10">
      <div class="text-sm">Kütle: {{ mass.toFixed(0) }} kg</div>
      <div class="text-sm">Sürat: {{ velocity.toFixed(1) }} m/s</div>
      <div class="text-sm">Kinetik Enerji: {{ kineticEnergy.toFixed(1) }} J</div>
    </div>
    
    <!-- Başlat/Durdur Düğmesi -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <button 
        @click="toggleAnimation" 
        class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg transition duration-200 min-w-[120px]"
      >
        {{ isAnimating ? 'Durdur' : 'Başlat' }}
      </button>
    </div>
    
    <!-- Mobil için Ayarlar Butonu -->
    <button 
      @click="isSettingsPanelOpen = !isSettingsPanelOpen" 
      class="absolute top-4 right-4 p-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg md:hidden z-50 shadow-lg transition duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Mobil için Ayarlar Paneli Modal Arkaplani -->
    <div v-if="isSettingsPanelOpen" @click="isSettingsPanelOpen = false" class="fixed inset-0 z-20 md:hidden"></div>
    
    <!-- Ayarlar Paneli -->
    <div 
      class="fixed md:absolute top-0 right-0 w-full md:w-1/4 h-screen max-h-screen overflow-auto bg-gray-900 text-white shadow-xl transform transition-transform duration-300 z-30"
      :class="{ 'translate-x-0': shouldShowSettingsPanel, 'translate-x-full': !shouldShowSettingsPanel }"
    >
      <div class="p-6 space-y-6">
        <!-- Araç Kütlesi -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200">Araç Kütlesi (kg)</label>
          <input 
            type="range" 
            v-model.number="mass" 
            min="500" 
            max="2500" 
            step="100" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div class="flex justify-between text-xs text-gray-400">
            <span>500</span>
            <span>{{ mass }}</span>
            <span>2500</span>
          </div>
        </div>
        
        <!-- Araç Sürati -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200">Araç Sürati (m/s)</label>
          <input 
            type="range" 
            v-model.number="velocity" 
            min="0" 
            max="30" 
            step="0.5" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div class="flex justify-between text-xs text-gray-400">
            <span>0</span>
            <span>{{ velocity }}</span>
            <span>30</span>
          </div>
        </div>
        
        <!-- Animasyon Hızı -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200">Animasyon Hızı</label>
          <input 
            type="range" 
            v-model.number="animationSpeed" 
            min="0.5" 
            max="3" 
            step="0.1" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div class="flex justify-between text-xs text-gray-400">
            <span>Yavaş</span>
            <span>{{ animationSpeed }}</span>
            <span>Hızlı</span>
          </div>
        </div>
        
        <!-- Araba Tipi -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200">Araba Tipi</label>
          <select 
            v-model="selectedCarType"
            @change="createCar(selectedCarType)"
            class="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="sedan">Sedan</option>
            <option value="sports">Spor Araba</option>
            <option value="suv">SUV</option>
            <option value="truck">Kamyonet</option>
          </select>
        </div>
        
        <!-- Kamera Takip Mesafesi -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200">Kamera Takip Mesafesi</label>
          <input 
            type="range" 
            v-model.number="cameraDistance" 
            min="5" 
            max="20" 
            step="1" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div class="flex justify-between text-xs text-gray-400">
            <span>Yakın (5)</span>
            <span>{{ cameraDistance }}</span>
            <span>Uzak (20)</span>
          </div>
        </div>
        
        <!-- Kamera Görünümü -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200 mb-3">Kamera Görünümü</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="setCameraView('front')" 
              class="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition duration-200"
            >
              Önden
            </button>
            <button 
              @click="setCameraView('side')" 
              class="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition duration-200"
            >
              Yandan
            </button>
            <button 
              @click="setCameraView('top')" 
              class="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition duration-200"
            >
              Üstten
            </button>
            <button 
              @click="setCameraView('isometric')" 
              class="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition duration-200"
            >
              İzometrik
            </button>
          </div>
          <button 
            @click="setCameraView('reset')" 
            class="w-full py-2 px-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition duration-200"
          >
            Görünümü Sıfırla
          </button>
        </div>
        
        <!-- Arkaplan Rengi -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-200 mb-3">Arkaplan Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="color in ['#111827', '#000000', '#1e3a8a', '#064e3b', '#7f1d1d', '#4c1d95', '#f3f4f6', '#dbeafe', '#d1fae5', '#fee2e2', '#ede9fe', '#f5f5dc']" 
              :key="color"
              @click="setBackgroundColor(color)"
              class="w-8 h-8 rounded-lg border-2 border-gray-700 hover:border-white transition duration-200"
              :style="{ backgroundColor: color }"
              :title="color"
            ></button>
          </div>
        </div>
        
        <!-- Sıfırlama Butonu -->
        <button 
          @click="resetSimulation" 
          class="w-full py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition duration-200"
        >
          Simülasyonu Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar ve durum değişkenleri
const canvasContainer = ref(null);
const isSettingsPanelOpen = ref(false);
const isDesktop = ref(false);
const isAnimating = ref(false);
const mass = ref(1000);
const velocity = ref(5);
const animationSpeed = ref(1);
const cameraDistance = ref(10);
const selectedCarType = ref('sedan');

// Varsayılan ayarlar
const defaultSettings = {
  mass: 1000,
  velocity: 5,
  animationSpeed: 1,
  backgroundColor: '#f3f4f6',
  cameraDistance: 10,
  carType: 'sedan'
};

// Ayarlar panelinin görünürlüğü için computed
const shouldShowSettingsPanel = computed(() => {
  return isSettingsPanelOpen.value || isDesktop.value;
});

// Three.js değişkenleri
let scene, camera, renderer, controls;
let car, wheels = [], trees = [], road;
let flowers = [], insects = []; // Çiçekler ve böcekler için diziler
let previousTimestamp = 0;
let cameraPositions = {};
let roadWidth = 10; // Yolun başlangıç genişliği
let groundWidth = 100; // Zeminin başlangıç genişliği

// Araba modellerinin renk seçenekleri
const carColors = {
  red: 0xff0000,
  blue: 0x3366cc,
  green: 0x00ff00,
  yellow: 0xffff00,
  black: 0x000000,
  white: 0xffffff,
};

// Kinetik enerji hesaplama
const kineticEnergy = computed(() => {
  return 0.5 * mass.value * Math.pow(velocity.value, 2);
});

// Resize olayı için referans
const handleResize = () => {
  if (!renderer) return;
  
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

// Animasyon durumunu kontrol etme
const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value;
  previousTimestamp = 0;
};

// Simülasyonu sıfırlama
const resetSimulation = () => {
  isAnimating.value = false;
  mass.value = defaultSettings.mass;
  velocity.value = defaultSettings.velocity;
  animationSpeed.value = defaultSettings.animationSpeed;
  cameraDistance.value = defaultSettings.cameraDistance;
  selectedCarType.value = defaultSettings.carType;
  
  if (scene) {
    scene.background = new THREE.Color(defaultSettings.backgroundColor);
  }
  
  // Yol ve zemin genişliklerini sıfırla
  roadWidth = 10;
  groundWidth = 100;
  createRoad(); // Yol ve zemini yeniden oluştur
  
  // Arabayı yeniden oluştur
  if (car) {
    scene.remove(car);
    createCar(selectedCarType.value);
  }
  
  // Arabanın ve ağaçların pozisyonlarını sıfırla
  if (car) {
    car.position.x = 0;
    car.rotation.y = Math.PI;
  }
  
  // Ağaçları temizle ve yeniden oluştur
  trees.forEach(tree => {
    scene.remove(tree);
  });
  trees = [];
  
  // Çiçekleri temizle
  flowers.forEach(flower => {
    scene.remove(flower);
  });
  flowers = [];
  
  // Böcekleri temizle
  insects.forEach(insect => {
    scene.remove(insect);
  });
  insects = [];
  
  // Ağaçları, çiçekleri ve böcekleri yeniden oluştur
  createTrees();
  
  setCameraView('reset');
};

// Kamera açısını ayarlama
const setCameraView = (viewType) => {
  if (!camera || !controls) return;
  
  switch (viewType) {
    case 'front':
      camera.position.set(0, 2, 10);
      camera.lookAt(0, 0, 0);
      break;
    case 'side':
      camera.position.set(10, 2, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'top':
      camera.position.set(0, 10, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'isometric':
      camera.position.set(8, 8, 8);
      camera.lookAt(0, 0, 0);
      break;
    case 'reset':
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      break;
  }
  
  controls.update();
};

// Arka plan rengini ayarlama
const setBackgroundColor = (color) => {
  if (!scene || !renderer) return;
  
  scene.background = new THREE.Color(color);
  
  // Yol rengini de güncelle
  if (road) {
    const roadMaterial = road.material;
    let roadColor;
    
    // Koyu renkler için açık yol, açık renkler için koyu yol
    const isDarkColor = ['#111827', '#000000', '#1e3a8a', '#064e3b', '#7f1d1d', '#4c1d95'].includes(color);
    roadColor = isDarkColor ? 0xaaaaaa : 0x555555;
    
    roadMaterial.color.set(roadColor);
  }
};

// Three.js sahnesini oluştur
const initThreeJs = () => {
  // Sahne oluşturma
  scene = new THREE.Scene();
  scene.background = new THREE.Color(defaultSettings.backgroundColor);
  
  // Kamera oluşturma
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);
  
  // Renderer oluşturma
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  canvasContainer.value.appendChild(renderer.domElement);
  
  // Kontroller oluşturma
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar oluşturma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Yol oluşturma
  createRoad();
  
  // Araba modeli oluşturma
  createCar(selectedCarType.value);
  
  // Ağaçlar oluşturma
  createTrees();
  
  // Animasyon döngüsü başlatma
  animate();
};

// Yol ve zemin oluşturma
const createRoad = () => {
  // Eğer önceki yol ve zemin varsa kaldır
  if (road) {
    scene.remove(road);
  }
  
  // Yolun etrafındaki zemini de kaldır
  scene.children.forEach(child => {
    if (child.userData?.isGround) {
      scene.remove(child);
    }
  });
  
  // Yol oluşturma
  const roadGeometry = new THREE.PlaneGeometry(100, roadWidth);
  const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555, 
    side: THREE.DoubleSide,
    roughness: 0.8
  });
  road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  scene.add(road);
  
  // Zemin oluşturma (yolun dışındaki alanlar)
  const groundGeometry = new THREE.PlaneGeometry(200, groundWidth);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x90EE90, 
    side: THREE.DoubleSide,
    roughness: 0.9
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01; // Yolun altında hafifçe
  ground.receiveShadow = true;
  ground.userData = { isGround: true }; // Zemini tanımlamak için userData kullan
  scene.add(ground);
};

// Araba modeli oluşturma
const createCar = (type = 'sedan') => {
  // Eğer önceki araba varsa kaldır
  if (car) {
    scene.remove(car);
    wheels = [];
  }

  car = new THREE.Group();
  
  // Araba tipine göre boyutlar ve özellikler
  let dimensions;
  switch (type) {
    case 'sports':
      dimensions = {
        body: { width: 4.2, height: 0.8, depth: 2 },
        cabin: { width: 2, height: 0.8, depth: 1.8, offsetX: -0.3 },
        wheelSize: 0.45,
        color: carColors.red
      };
      break;
    case 'suv':
      dimensions = {
        body: { width: 4.5, height: 1.2, depth: 2.2 },
        cabin: { width: 3, height: 1.4, depth: 2, offsetX: -0.2 },
        wheelSize: 0.5,
        color: carColors.black
      };
      break;
    case 'truck':
      dimensions = {
        body: { width: 5, height: 1.4, depth: 2.4 },
        cabin: { width: 2, height: 1.2, depth: 2.2, offsetX: 1 },
        wheelSize: 0.55,
        color: carColors.blue
      };
      break;
    default: // sedan
      dimensions = {
        body: { width: 4, height: 1, depth: 2 },
        cabin: { width: 2, height: 1, depth: 1.8, offsetX: -0.5 },
        wheelSize: 0.4,
        color: carColors.blue
      };
  }

  // Araba gövdesi
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(dimensions.body.width, dimensions.body.height, dimensions.body.depth),
    new THREE.MeshStandardMaterial({ color: dimensions.color })
  );
  body.position.y = 0.6;
  body.castShadow = true;
  car.add(body);

  // Araba üst kısmı (kabin)
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(dimensions.cabin.width, dimensions.cabin.height, dimensions.cabin.depth),
    new THREE.MeshStandardMaterial({ color: dimensions.color })
  );
  cabin.position.set(dimensions.cabin.offsetX, dimensions.body.height + 0.6, 0);
  cabin.castShadow = true;
  car.add(cabin);

  // Pencereler
  const window = new THREE.Mesh(
    new THREE.BoxGeometry(dimensions.cabin.width * 0.9, dimensions.cabin.height * 0.8, dimensions.cabin.depth * 0.95),
    new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 })
  );
  window.position.set(dimensions.cabin.offsetX, dimensions.body.height + 0.6, 0);
  car.add(window);

  // Tekerlekler
  const wheelGeometry = new THREE.CylinderGeometry(dimensions.wheelSize, dimensions.wheelSize, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Jant geometrisi ve materyali
  const hubcapGeometry = new THREE.CylinderGeometry(dimensions.wheelSize * 0.3, dimensions.wheelSize * 0.3, 0.31, 16);
  const hubcapMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
  
  // Jant çubuğu geometrisi
  const spokeGeometry = new THREE.BoxGeometry(dimensions.wheelSize * 1.8, 0.05, 0.02);
  const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
  
  // Tekerlek pozisyonları
  const wheelPositions = [
    { x: dimensions.body.width/3, z: dimensions.body.depth/2 },
    { x: dimensions.body.width/3, z: -dimensions.body.depth/2 },
    { x: -dimensions.body.width/3, z: dimensions.body.depth/2 },
    { x: -dimensions.body.width/3, z: -dimensions.body.depth/2 }
  ];

  wheelPositions.forEach(pos => {
    // Tekerlek grubu oluştur
    const wheelGroup = new THREE.Group();
    
    // Ana tekerlek
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.castShadow = true;
    wheelGroup.add(wheel);
    
    // Jant kapağı
    const hubcap = new THREE.Mesh(hubcapGeometry, hubcapMaterial);
    wheelGroup.add(hubcap);
    
    // Jant çubukları
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      spoke.rotation.z = (Math.PI / 5) * i;
      wheelGroup.add(spoke);
    }
    
    // Tekerlek grubunu pozisyonla ve döndür
    wheelGroup.position.set(pos.x, dimensions.wheelSize, pos.z);
    wheelGroup.rotation.x = Math.PI / 2;
    
    car.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  // Farlar
  const headlightGeometry = new THREE.CircleGeometry(0.2, 16);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffcc, 
    emissive: 0xffffcc,
    emissiveIntensity: 0.5
  });

  [-0.7, 0.7].forEach(z => {
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.position.set(dimensions.body.width/2, 0.7, z);
    headlight.rotation.y = Math.PI / 2;
    car.add(headlight);
  });

  car.rotation.y = Math.PI;
  scene.add(car);
};

// Ağaçlar oluşturma
const createTrees = () => {
  for (let i = 0; i < 10; i++) {
    const treeGroup = new THREE.Group();
    treeGroup.userData = { isTree: true }; // Ağaç olarak işaretle
    
    // Ağaç gövdesi
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.9 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Ağaç yaprakları - rastgele ağaç türü seçimi
    const treeTypes = ['pine', 'oak', 'bush'];
    const randomType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    
    const leavesColor = new THREE.Color(0x2E8B57);
    
    if (randomType === 'pine') {
      // Çam ağacı - koni şeklinde yapraklar
      for (let j = 0; j < 3; j++) {
        const size = 0.7 - j * 0.2;
        const height = 0.5;
        const coneGeometry = new THREE.ConeGeometry(size, height, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({ 
          color: leavesColor,
          roughness: 0.8
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 1.0 + j * 0.4;
        cone.castShadow = true;
        treeGroup.add(cone);
      }
    } 
    else if (randomType === 'oak') {
      // Meşe ağacı - yuvarlak yapraklar
      const leavesGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({ 
        color: leavesColor,
        roughness: 0.8
      });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 1.4;
      leaves.castShadow = true;
      treeGroup.add(leaves);
    }
    else if (randomType === 'bush') {
      // Çalı - birkaç küçük yuvarlak yaprak kümesi
      for (let j = 0; j < 5; j++) {
        const bushGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const bushMaterial = new THREE.MeshStandardMaterial({ 
          color: leavesColor,
          roughness: 0.8
        });
        const bushPart = new THREE.Mesh(bushGeometry, bushMaterial);
        
        // Ağaç tepesine rasgele yerleştir
        const angle = j * Math.PI * 2 / 5;
        const radius = 0.25;
        bushPart.position.set(
          Math.cos(angle) * radius,
          1.1 + Math.random() * 0.5,
          Math.sin(angle) * radius
        );
        bushPart.castShadow = true;
        treeGroup.add(bushPart);
      }
    }
    
    // Ağacı yolun kenarına yerleştir
    treeGroup.position.set(-10 + (i * 8), 0, roadWidth/2 + 1 + Math.random() * 2); // Başlangıç yol genişliğini kullan
    
    // Ağacın etrafına çiçekler ekle
    createFlowers(treeGroup.position.x, treeGroup.position.z, 1 + Math.random());
    
    // Bazı ağaçları da yolun sol tarafına yerleştir
    if (i % 2 === 0) {
      const treeClone = treeGroup.clone();
      treeClone.userData = { isTree: true }; // Ağaç olarak işaretle
      treeClone.position.set(-10 + (i * 8), 0, -(roadWidth/2 + 1 + Math.random() * 2)); // Başlangıç yol genişliğini kullan
      scene.add(treeClone);
      trees.push(treeClone);
      
      // Sol taraftaki ağaçların etrafına da çiçekler ekle
      createFlowers(treeClone.position.x, treeClone.position.z, 1 + Math.random());
    }
    
    scene.add(treeGroup);
    trees.push(treeGroup);
  }
};

// Çiçekler oluşturma
const createFlowers = (x, z, radius) => {
  const flowerCount = 5 + Math.floor(Math.random() * 7); // 5-11 arası çiçek
  const flowerColors = [0xFF1493, 0xFF4500, 0xFFFF00, 0xADFF2F, 0x9370DB, 0x00FFFF]; // Çiçek renkleri
  
  for (let i = 0; i < flowerCount; i++) {
    const flowerGroup = new THREE.Group();
    
    // Çiçek sapı
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.15;
    flowerGroup.add(stem);
    
    // Çiçek merkezi
    const centerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.y = 0.3;
    flowerGroup.add(center);
    
    // Rastgele çiçek rengi seç
    const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    
    // Çiçek yaprakları
    const petalCount = 5 + Math.floor(Math.random() * 3); // 5-7 yaprak
    for (let j = 0; j < petalCount; j++) {
      const petalGeometry = new THREE.CircleGeometry(0.08, 8);
      const petalMaterial = new THREE.MeshStandardMaterial({ 
        color: flowerColor,
        side: THREE.DoubleSide
      });
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      
      // Yaprağı merkeze göre konumlandır ve döndür
      const angle = (j / petalCount) * Math.PI * 2;
      petal.position.set(
        Math.sin(angle) * 0.08,
        0.3,
        Math.cos(angle) * 0.08
      );
      petal.lookAt(center.position);
      petal.rotateX(Math.PI / 2);
      
      flowerGroup.add(petal);
    }
    
    // Çiçeği ağacın etrafına yerleştir
    const angle = (i / flowerCount) * Math.PI * 2;
    const distance = radius * (0.6 + Math.random() * 0.4); // Ağaçtan uzaklık
    flowerGroup.position.set(
      x + Math.sin(angle) * distance,
      0,
      z + Math.cos(angle) * distance
    );
    
    scene.add(flowerGroup);
    flowers.push(flowerGroup);
    
    // Çiçeğin üzerine rastgele arı veya kelebek ekle
    if (Math.random() > 0.7) { // %30 ihtimalle böcek ekle
      createInsect(flowerGroup.position.x, flowerGroup.position.z, Math.random() > 0.5 ? 'bee' : 'butterfly');
    }
  }
};

// Böcekler (arı ve kelebekler) oluşturma
const createInsect = (x, z, type) => {
  const insectGroup = new THREE.Group();
  const yPosition = 0.4 + Math.random() * 0.3; // Çiçekten yükseklik
  
  if (type === 'bee') {
    // Arı gövdesi
    const bodyGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    insectGroup.add(body);
    
    // Arı çizgileri
    const stripeGeometry = new THREE.PlaneGeometry(0.06, 0.02);
    const stripeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, 0, -0.02 + i * 0.02);
      stripe.rotation.x = Math.PI / 2;
      insectGroup.add(stripe);
    }
    
    // Arı kanatları
    const wingGeometry = new THREE.PlaneGeometry(0.06, 0.03);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0.04, 0.02, 0);
    leftWing.rotation.z = Math.PI / 4;
    insectGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(-0.04, 0.02, 0);
    rightWing.rotation.z = -Math.PI / 4;
    insectGroup.add(rightWing);
    
  } else if (type === 'butterfly') {
    // Kelebek gövdesi
    const bodyGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    insectGroup.add(body);
    
    // Kelebek kanatları - rastgele renk
    const wingColors = [0xFF69B4, 0x9370DB, 0x00BFFF, 0xFF6347, 0xFFD700];
    const wingColor = wingColors[Math.floor(Math.random() * wingColors.length)];
    const wingGeometry = new THREE.CircleGeometry(0.05, 8);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
      color: wingColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0.04, 0, 0);
    leftWing.rotation.y = Math.PI / 2;
    insectGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(-0.04, 0, 0);
    rightWing.rotation.y = Math.PI / 2;
    insectGroup.add(rightWing);
  }
  
  // Böceğin başlangıç pozisyonu
  insectGroup.position.set(x, yPosition, z);
  
  // Böceğe rastgele hareket yönü ver
  insectGroup.userData = {
    moveDirection: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.1, Math.random() - 0.5).normalize(),
    type: type,
    wingDirection: 1,
    wingAngle: 0,
    originalY: yPosition,
    hoverRadius: 0.2 + Math.random() * 0.3, // Dolaşma yarıçapı
    hoverSpeed: 0.5 + Math.random() * 1.5, // Hareket hızı
    originX: x,
    originZ: z
  };
  
  scene.add(insectGroup);
  insects.push(insectGroup);
};

// Animasyon döngüsü
const animate = (timestamp) => {
  requestAnimationFrame(animate);
  
  if (controls) controls.update();
  
  let deltaTime = 0;
  if (previousTimestamp !== 0) {
    deltaTime = (timestamp - previousTimestamp) / 1000;
  }
  previousTimestamp = timestamp;
  
  if (isAnimating.value && deltaTime > 0) {
    const moveSpeed = velocity.value * animationSpeed.value * deltaTime;
    car.position.x -= moveSpeed;
    
    // Yol ve zemini genişlet
    const expansionRate = 0.05 * moveSpeed; // Genişleme hızı, araba hızına bağlı
    roadWidth += expansionRate;
    groundWidth += expansionRate * 2;
    
    // Belirli aralıklarla yolu ve zemini güncelle (her frame'de değil, daha iyi performans için)
    if (Math.abs(car.position.x) % 10 < moveSpeed) {
      createRoad();
    }
    
    // Kamerayı arabayı takip etmesi için güncelle
    if (camera) {
      const targetPosition = new THREE.Vector3(
        car.position.x + cameraDistance.value,
        cameraDistance.value / 2,
        cameraDistance.value
      );
      camera.position.lerp(targetPosition, 0.1);
      camera.lookAt(car.position);
    }
    
    const wheelRotationSpeed = moveSpeed / 0.4;
    wheels.forEach(wheel => {
      wheel.rotation.y -= wheelRotationSpeed;
    });
    
    // Sonsuz yol için ağaçları ve çiçekleri hareket ettir
    const environmentObjects = [...trees, ...flowers, ...insects];
    environmentObjects.forEach(object => {
      object.position.x += moveSpeed;
      
      // Ağaçlar ve çiçekler için yeniden konumlandırma
      if (!object.userData?.type && object.position.x > car.position.x + 40) {
        // Ağaçlar ve çiçekler için
        object.position.x -= 80 + Math.random() * 20; // Rasgele mesafe ekle
        
        // Genişleyen yol için z pozisyonunu da güncelle
        if (object.userData?.isTree) {
          // Yolun genişliğine göre ağaçların pozisyonunu ayarla
          const side = object.position.z > 0 ? 1 : -1; // Yolun hangi tarafında
          object.position.z = side * (roadWidth/2 + 1 + Math.random() * 2);
        }
      }
    });
    
    // Böceklerin animasyonu
    const time = timestamp * 0.001; // Saniye cinsinden zaman
    insects.forEach(insect => {
      const data = insect.userData;
      
      // Kanatların çırpma animasyonu
      if (data.type === 'bee' || data.type === 'butterfly') {
        data.wingAngle += 0.2; // Kanat çırpma hızı
        
        // Kanatları oynat
        insect.children.forEach(part => {
          if (part.geometry.type === 'PlaneGeometry' || 
             (data.type === 'butterfly' && part.geometry.type === 'CircleGeometry')) {
            
            // Kanatların dönme yönünü belirle
            if (part.position.x > 0) { // Sol kanat
              part.rotation.z = Math.PI / 4 + Math.sin(data.wingAngle) * 0.5;
            } else if (part.position.x < 0) { // Sağ kanat
              part.rotation.z = -Math.PI / 4 - Math.sin(data.wingAngle) * 0.5;
            }
          }
        });
        
        // Böceklerin çiçeklerin etrafında uçuşu
        const hoverX = Math.sin(time * data.hoverSpeed) * data.hoverRadius;
        const hoverZ = Math.cos(time * data.hoverSpeed) * data.hoverRadius;
        const hoverY = Math.sin(time * data.hoverSpeed * 2) * 0.05;
        
        // İlk pozisyonunu takip ederek hareket ettir
        insect.position.x = data.originX + hoverX + moveSpeed; // moveSpeed ekleyerek sonsuz yol ile uyumlu hareket
        insect.position.y = data.originalY + hoverY;
        insect.position.z = data.originZ + hoverZ;
        
        // Hareket yönüne doğru hafifçe döndür
        insect.rotation.y = Math.atan2(hoverX, hoverZ);
      }
      
      // Böceğin orijin noktasını da yol ile birlikte güncelle
      if (insect.position.x > car.position.x + 40) {
        // Orijin noktasını da güncelle
        insect.userData.originX -= 80 + Math.random() * 20;
        insect.position.x = insect.userData.originX; // Pozisyonu da güncelle
      }
    });
  }
  
  renderer.render(scene, camera);
};

// Bileşen yüklendiğinde
onMounted(() => {
  // Masaüstü kontrolü
  const checkDesktop = () => {
    if (typeof window !== 'undefined') {
      isDesktop.value = window.innerWidth >= 768;
      isSettingsPanelOpen.value = isDesktop.value;
    }
  };
  
  // İlk kontrol
  checkDesktop();
  
  // Event listener'ları ekle
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkDesktop);
    window.addEventListener('resize', handleResize);
  }
  
  // Three.js başlat
  initThreeJs();
});

// Bileşen temizlendiğinde
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('resize', () => {
      isDesktop.value = window.innerWidth >= 768;
      isSettingsPanelOpen.value = isDesktop.value;
    });
  }
  
  if (renderer && canvasContainer.value) {
    renderer.dispose();
    canvasContainer.value.removeChild(renderer.domElement);
  }
});

// Arkaplan rengi değiştiğinde duvarların rengini güncelle
watch(() => scene?.background, (newColor) => {
  if (!scene) return;
  
  // Duvarların rengini güncelle
  scene.children.forEach(child => {
    if (child.isMesh && child.material.transparent) {
      child.material.color = newColor;
    }
  });
}, { deep: true });
</script>
  
 
 