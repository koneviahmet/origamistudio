<template>
  <div class="relative h-screen w-full overflow-hidden">
    <!-- Simülasyon Alanı -->
    <div id="simulation-container" ref="simulationContainer" class="w-full h-full"></div>
    
    <!-- Dinamik Bilgi Paneli -->
    <div class="absolute top-4 left-4 bg-gray-800 bg-opacity-80 text-white p-3 rounded-lg max-w-xs">
      <!-- Maddenin halini büyük ve renkli olarak göster -->
      <div class="text-center mb-2 font-bold">
        <span 
          v-if="temperature < 0" 
          class="text-lg text-blue-300"
        >KATI (KAR)</span>
        <span 
          v-else-if="temperature <= 15" 
          class="text-lg text-blue-500"
        >SIVI (YAĞMUR)</span>
        <span 
          v-else 
          class="text-lg text-yellow-400"
        >GAZ (BUHAR)</span>
      </div>
      <div class="text-sm">
        <p>Sıcaklık: {{ temperature }}°C</p>
        <p>Simülasyon Durumu: {{ isAnimating ? 'Çalışıyor' : 'Durduruldu' }}</p>
      </div>
    </div>
    
    <!-- Ekolojik Kavramlar Bilgi Paneli -->
    <div v-if="selectedConcept" class="absolute top-20 left-4 bg-gray-800 bg-opacity-80 text-white p-4 rounded-lg max-w-xs z-10">
      <h3 class="text-lg font-bold mb-2">{{ selectedConcept }}</h3>
      <div class="text-sm" v-html="conceptInfo"></div>
      <button 
        @click="clearConceptSelection" 
        class="mt-3 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
      >
        Kapat
      </button>
    </div>
    
    <!-- Animasyon Kontrol Butonları -->
    <div class="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
      <button v-if="!isAnimating" @click="startAnimation" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
        Başlat
      </button>
      <button v-else @click="stopAnimation" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
        Durdur
      </button>
    </div>
    
    <!-- Mobil Ayarlar Butonu -->
    <button @click="toggleSettings" class="md:hidden absolute top-4 right-4 bg-gray-800 p-2 rounded-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Mobil Ayarlar Modalı -->
    <div v-if="isMobileSettingsOpen" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" @click.self="toggleSettings">
      <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-11/12 max-h-[66vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-white">Simülasyon Ayarları</h3>
          <button @click="toggleSettings" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="text-gray-300">
          <!-- Mobil Ayar İçeriği -->
          
          <!-- Ekolojik Kavramlar Seçimi -->
          <div class="mb-4">
            <label class="block mb-2 font-medium">Ekolojik Kavramlar</label>
            <select 
              v-model="selectedConcept" 
              class="w-full bg-gray-700 text-white p-2 rounded" 
              @change="handleConceptChange"
            >
              <option value="">Seçiniz</option>
              <option value="Tür">Tür</option>
              <option value="Popülasyon">Popülasyon</option>
              <option value="Habitat">Habitat</option>
              <option value="Ekosistem">Ekosistem</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block mb-2 font-medium">Sıcaklık</label>
            <input type="range" v-model="temperature" min="-10" max="40" class="w-full" @input="updateSimulation" />
            <div class="flex justify-between text-sm mt-1">
              <span>-10°C</span>
              <span>{{ temperature }}°C</span>
              <span>40°C</span>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block mb-2 font-medium">Animasyon Hızı</label>
            <input type="range" v-model="animationSpeed" min="0.5" max="3" step="0.1" class="w-full" />
            <div class="flex justify-between text-sm mt-1">
              <span>Yavaş</span>
              <span>{{ animationSpeed.toFixed(1) }}x</span>
              <span>Hızlı</span>
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="font-medium mb-2">Kamera Açısı</h4>
            <div class="grid grid-cols-2 gap-2">
              <button @click="setCameraView('top')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">Üstten</button>
              <button @click="setCameraView('side')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">Yandan</button>
              <button @click="setCameraView('front')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">Önden</button>
              <button @click="setCameraView('isometric')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">İzometrik</button>
              <button @click="resetCamera" class="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded col-span-2">Kamerayı Sıfırla</button>
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="font-medium mb-2">Arkaplan Rengi</h4>
            <div class="grid grid-cols-4 gap-2">
              <button @click="setBackgroundColor('#111827')" class="w-full h-8 bg-[#111827] rounded-md"></button>
              <button @click="setBackgroundColor('#1e3a8a')" class="w-full h-8 bg-[#1e3a8a] rounded-md"></button>
              <button @click="setBackgroundColor('#f3f4f6')" class="w-full h-8 bg-[#f3f4f6] rounded-md"></button>
              <button @click="setBackgroundColor('#dbeafe')" class="w-full h-8 bg-[#dbeafe] rounded-md"></button>
            </div>
          </div>
          
          <button 
            @click="resetSettings" 
            class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-4"
            v-if="isSettingsChanged"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
    
    <!-- Desktop Ayarlar Paneli -->
    <div class="hidden md:block absolute top-0 right-0 bg-gray-800 text-white w-64 max-h-[66vh] p-4 overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">Simülasyon Ayarları</h3>
      
      <!-- Ekolojik Kavramlar Seçimi -->
      <div class="mb-4">
        <label class="block mb-2 font-medium">Ekolojik Kavramlar</label>
        <select 
          v-model="selectedConcept" 
          class="w-full bg-gray-700 text-white p-2 rounded" 
          @change="handleConceptChange"
        >
          <option value="">Seçiniz</option>
          <option value="Tür">Tür</option>
          <option value="Popülasyon">Popülasyon</option>
          <option value="Habitat">Habitat</option>
          <option value="Ekosistem">Ekosistem</option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="block mb-2 font-medium">Sıcaklık</label>
        <input type="range" v-model="temperature" min="-10" max="40" class="w-full" @input="updateSimulation" />
        <div class="flex justify-between text-sm mt-1">
          <span>-10°C</span>
          <span>{{ temperature }}°C</span>
          <span>40°C</span>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block mb-2 font-medium">Animasyon Hızı</label>
        <input type="range" v-model="animationSpeed" min="0.5" max="3" step="0.1" class="w-full" />
        <div class="flex justify-between text-sm mt-1">
          <span>Yavaş</span>
          <span>{{ animationSpeed.toFixed(1) }}x</span>
          <span>Hızlı</span>
        </div>
      </div>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">Kamera Açısı</h4>
        <div class="grid grid-cols-2 gap-2">
          <button @click="setCameraView('top')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">Üstten</button>
          <button @click="setCameraView('side')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">Yandan</button>
          <button @click="setCameraView('front')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">Önden</button>
          <button @click="setCameraView('isometric')" class="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded">İzometrik</button>
          <button @click="resetCamera" class="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded col-span-2">Kamerayı Sıfırla</button>
        </div>
      </div>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">Arkaplan Rengi</h4>
        <div class="grid grid-cols-4 gap-2">
          <button @click="setBackgroundColor('#111827')" class="w-full h-8 bg-[#111827] rounded-md"></button>
          <button @click="setBackgroundColor('#1e3a8a')" class="w-full h-8 bg-[#1e3a8a] rounded-md"></button>
          <button @click="setBackgroundColor('#f3f4f6')" class="w-full h-8 bg-[#f3f4f6] rounded-md"></button>
          <button @click="setBackgroundColor('#dbeafe')" class="w-full h-8 bg-[#dbeafe] rounded-md"></button>
        </div>
      </div>
      
      <button 
        @click="resetSettings" 
        class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-4"
        v-if="isSettingsChanged"
      >
        Ayarları Sıfırla
      </button>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Asset kullanımı için gerekli importlar
import useModels from './compositions/useModels.js';

// Ref'ler ve State Tanımlamaları
const simulationContainer = ref(null);
const temperature = ref(20); // Başlangıç sıcaklığı (°C)
const defaultTemperature = 20;
const animationSpeed = ref(1); // Animasyon hızı
const defaultAnimationSpeed = 1;
const isAnimating = ref(true);
const isMobileSettingsOpen = ref(false);
const backgroundColor = ref('#dbeafe'); // Varsayılan arkaplan rengi
const selectedConcept = ref(''); // Seçili ekolojik kavram
const conceptInfo = ref(''); // Kavram bilgisi
const highlightedElements = ref([]); // Vurgulanacak elemanlar

// Ayarların değiştirilip değiştirilmediğini kontrol eden hesaplanmış özellik
const isSettingsChanged = computed(() => {
  return temperature.value !== defaultTemperature || 
         animationSpeed.value !== defaultAnimationSpeed ||
         selectedConcept.value !== '';
});

// Three.js Değişkenleri
let scene, camera, renderer, controls;
let cloud, puddle, ground, sun;
let clouds = [];  // Birden fazla bulut için dizi
let mountains = [], trees = [], animals = [];
let particles = [], raindrops = [], snowflakes = [];
let puddles = []; // Su birikintileri için dizi
let snowCovers = []; // Kar örtüleri için dizi
let flowers = []; // Çiçekler için dizi
let people = []; // İnsanlar için dizi
let walls = []; // Duvarları tanımla
let animationId = null;
let clock = new THREE.Clock();
let models; // Asset modellerini tutmak için

// Maksimum birikinti sayısı limitleri
const MAX_PUDDLES = 15; // Maksimum su birikintisi sayısı
const MAX_SNOW_COVERS = 30; // Maksimum kar örtüsü sayısı

// Ayarları sıfırlama fonksiyonu
const resetSettings = () => {
  temperature.value = defaultTemperature;
  animationSpeed.value = defaultAnimationSpeed;
  selectedConcept.value = '';
  conceptInfo.value = '';
  clearHighlights();
  stopAnimation();
  updateSimulation();
};

// Mobil ayarlar menüsünü açıp/kapatma
const toggleSettings = () => {
  isMobileSettingsOpen.value = !isMobileSettingsOpen.value;
};

// Animasyon kontrol fonksiyonları
const startAnimation = () => {
  isAnimating.value = true;
  animate();
};

const stopAnimation = () => {
  isAnimating.value = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

// Arkaplan rengi değiştirme
const setBackgroundColor = (color) => {
  backgroundColor.value = color;
  if (scene) {
    scene.background = new THREE.Color(color);
    updateWallsColor(color);
  }
};

// Duvarların rengini güncelleme fonksiyonu
const updateWallsColor = (color) => {
  if (!walls || walls.length === 0) return;
  
  // Tüm duvarların rengini güncelle
  walls.forEach(wall => {
    if (wall.material) {
      wall.material.color.set(new THREE.Color(color));
    }
  });
};

// Kamera açısı ayarlama
const setCameraView = (view) => {
  if (!camera || !controls) return;
  
  switch (view) {
    case 'top':
      camera.position.set(0, 20, 0);
      break;
    case 'side':
      camera.position.set(0, 5, 20);
      break;
    case 'front':
      camera.position.set(20, 5, 0);
      break;
    case 'isometric':
      camera.position.set(15, 15, 15);
      break;
  }
  
  camera.lookAt(0, 0, 0);
  controls.update();
};

// Kamerayı sıfırlama
const resetCamera = () => {
  if (!camera || !controls) return;
  camera.position.set(15, 10, 15);
  camera.lookAt(0, 0, 0);
  controls.update();
};

// Simülasyon kurulumu
const initThreeJs = () => {
  // Modelleri yükle
  models = useModels();
  
  // Sahne oluşturma
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor.value);
  
  // Kamera oluşturma
  const containerWidth = simulationContainer.value.clientWidth;
  const containerHeight = simulationContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
  camera.position.set(15, 10, 15);
  camera.lookAt(0, 0, 0);
  
  // Renderer oluşturma
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(containerWidth, containerHeight);
  renderer.shadowMap.enabled = true;
  simulationContainer.value.appendChild(renderer.domElement);
  
  // Orbit Controls ekleme
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar ekleme
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);
  
  // Zemin oluşturma
  createGround();
  
  
  // Dağlar oluşturma
  createMountains();
  
  // Ağaçlar oluşturma
  createTrees();
  
  // Hayvanlar oluşturma
  createAnimals();
  
  // Çiçekler oluşturma
  createFlowers();
  
  // İnsanlar oluşturma
  createPeople();
  
  // Su birikintisi oluşturma
  createPuddle();
  
  // Güneş oluşturma
  createSun();
  
  // Bulut sistemi oluşturma
  createCloudSystem(3);
  
  // Pencere boyut değişimi işleyicisi
  window.addEventListener('resize', onWindowResize);
  
  // İlk güncelleme
  updateSimulation();
};

// Zemin oluşturma
const createGround = () => {
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a5568,  // Koyu gri
    roughness: 0.8
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  ground.receiveShadow = true;
  scene.add(ground);
};

// Dağlar oluşturma
const createMountains = () => {
  // Büyük dağlar
  for (let i = 0; i < 5; i++) {
    const mountainGeometry = new THREE.ConeGeometry(8, 15, 8);
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x718096,  // Gri
      roughness: 0.9
    });
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    
    // Dağları çevreye rastgele yerleştir
    const radius = 30;
    const angle = (i / 5) * Math.PI * 2;
    mountain.position.set(
      Math.cos(angle) * radius,
      5.5,
      Math.sin(angle) * radius
    );
    
    // Dağları rastgele döndür ve boyutlandır
    mountain.rotation.y = Math.random() * Math.PI;
    const scale = 0.8 + Math.random() * 0.4;
    mountain.scale.set(scale, scale, scale);
    
    scene.add(mountain);
    mountains.push(mountain);
  }
  
  // Küçük kayalar
  for (let i = 0; i < 15; i++) {
    const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,  // Açık gri
      roughness: 0.8
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    // Kayaları rastgele yerleştir
    rock.position.set(
      (Math.random() - 0.5) * 60,
      -1,
      (Math.random() - 0.5) * 60
    );
    
    // Kayaları rastgele döndür ve boyutlandır
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    const scale = 0.5 + Math.random() * 0.5;
    rock.scale.set(scale, scale, scale);
    
    scene.add(rock);
    mountains.push(rock);
  }
};

// Ağaçlar oluşturma
const createTrees = () => {
  for (let i = 0; i < 20; i++) {
    // Asset kullanarak ağaç oluştur
    const tree = models.createModelWithFixedColors('tree');
    
    // Ağacı rastgele yerleştir
    const radius = Math.random() * 25 + 10;
    const angle = Math.random() * Math.PI * 2;
    tree.position.set(
      Math.cos(angle) * radius,
      -2, // Zemine tam temas etmesi için -2'ye ayarlandı (önceden -1)
      Math.sin(angle) * radius
    );
    
    // Ağacı rastgele boyutlandır - ölçek azaltıldı 
    const scale = 1.2 + Math.random() * 0.5; // 1.5-2.3 yerine 1.2-1.7 aralığında
    tree.scale.set(scale, scale, scale);
    
    scene.add(tree);
    trees.push(tree);
  }
};

// Çiçekler oluşturma
const createFlowers = () => {
  // Birkaç çiçek kümesi oluştur
  for (let cluster = 0; cluster < 8; cluster++) {
    // Her küme için rastgele bir pozisyon seç
    const clusterX = (Math.random() - 0.5) * 50;
    const clusterZ = (Math.random() - 0.5) * 50;
    
    // Her kümede 5-15 çiçek olsun
    const flowerCount = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < flowerCount; i++) {
      // Asset kullanarak çiçek oluştur
      const flower = models.createModelWithFixedColors('flower');
      
      // Çiçeği küme içinde rastgele konumlandır
      const offsetRadius = 3 * Math.random();
      const offsetAngle = Math.random() * Math.PI * 2;
      
      flower.position.set(
        clusterX + Math.cos(offsetAngle) * offsetRadius,
        -1.95, // Zemine daha iyi temas etmesi için (önceden -1.5)
        clusterZ + Math.sin(offsetAngle) * offsetRadius
      );
      
      // Çiçek grubunu doğru yönlendir
      flower.rotation.y = Math.random() * Math.PI * 2; // Rastgele yön
      
      // Çiçeğin büyüklüğünü hafifçe değiştir - daha küçük boyut
      const scale = 0.3 + Math.random() * 0.3; // 0.5-0.9 yerine 0.3-0.6 aralığında
      flower.scale.set(scale, scale, scale);
      
      // Çiçek verilerini ekle
      flower.userData = {
        type: "flower",
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.5 + Math.random() * 0.5,
        originalY: -1.95,
        growthPhase: Math.random(),
        originalScale: scale
      };
      
      scene.add(flower);
      flowers.push(flower);
    }
  }
};

// Hayvanlar oluşturma
const createAnimals = () => {
  // Kuşlar
  for (let i = 0; i < 5; i++) {
    // Asset kullanarak kuş oluştur
    const bird = models.createModelWithFixedColors('bird');
    
    // Kuşu rastgele yerleştir - yüksek konumda tutuldu
    bird.position.set(
      (Math.random() - 0.5) * 30,
      5 + Math.random() * 5, // Yüksekte kalsın (5-10 arası)
      (Math.random() - 0.5) * 30
    );
    
    // Kuşu rastgele boyutlandır - biraz küçültüldü
    const scale = 0.4 + Math.random() * 0.2; // 0.5-0.8 yerine 0.4-0.6 aralığında
    bird.scale.set(scale, scale, scale);
    
    scene.add(bird);
    animals.push({
      mesh: bird,
      type: 'bird',
      initialY: bird.position.y,
      phase: Math.random() * Math.PI * 2
    });
  }
  
  // Diğer hayvanlar (tavşanlar, kurbağalar, kelebekler)
  const animalTypes = ['rabbit', 'frog', 'butterfly', 'dog', 'cat'];
  
  for (let i = 0; i < 8; i++) {
    // Rastgele bir hayvan tipi seç
    const animalType = animalTypes[Math.floor(Math.random() * animalTypes.length)];
    
    // Asset kullanarak hayvan oluştur
    const animal = models.createModelWithFixedColors(animalType);
    
    // Zemine temas etmesi için y pozisyonunu ayarla
    let yPos = -2; // Varsayılan zemin seviyesi
    let animalScale;
    
    if (animalType === 'butterfly') {
      // Kelebek havada olmalı
      yPos = 0 + Math.random() * 2; // 0-2 arası yükseklikte
      animalScale = 0.4 + Math.random() * 0.2; // Daha küçük (0.4-0.6)
    } else if (animalType === 'rabbit') {
      yPos = -1.95; // Zemine yakın
      animalScale = 0.6 + Math.random() * 0.2; // Orta boy (0.6-0.8)
    } else if (animalType === 'frog') {
      yPos = -1.95; // Zemine yakın
      animalScale = 0.4 + Math.random() * 0.2; // Daha küçük (0.4-0.6)
    } else if (animalType === 'dog') {
      yPos = -1.9; // Zemine yakın
      animalScale = 0.7 + Math.random() * 0.2; // Biraz daha büyük (0.7-0.9)
    } else if (animalType === 'cat') {
      yPos = -1.9; // Zemine yakın
      animalScale = 0.6 + Math.random() * 0.2; // Orta boy (0.6-0.8)
    }
    
    // Hayvanı rastgele yerleştir
    animal.position.set(
      (Math.random() - 0.5) * 40,
      yPos,
      (Math.random() - 0.5) * 40
    );
    
    // Hayvanı ölçeklendir
    animal.scale.set(animalScale, animalScale, animalScale);
    
    scene.add(animal);
    animals.push({
      mesh: animal,
      type: animalType,
      initialY: yPos,
      phase: Math.random() * Math.PI * 2
    });
  }
};

// İnsanlar oluşturma
const createPeople = () => {
  // Toplam insan sayısı
  const personCount = 6;
  
  // Farklı insan modelleri
  const personTypes = ['man', 'woman', 'child', 'grandfather', 'grandmother', 'doctor'];
  
  for (let i = 0; i < personCount; i++) {
    // Rastgele bir insan tipi seç
    const personType = personTypes[Math.floor(Math.random() * personTypes.length)];
    
    // İnsan modelini oluştur
    const person = models.createModelWithFixedColors(personType);
    
    // İnsanı rastgele konumlandır - alanın kenarlarına yakın olmasını tercih et
    let posX, posZ;
    const usePathArea = Math.random() < 0.7; // %70 olasılıkla yol kenarında
    
    if (usePathArea) {
      // Yol benzeri bir alanda konumlandır
      const distance = 15 + Math.random() * 15; // Merkeze olan uzaklık
      const angle = Math.random() * Math.PI * 2;
      posX = Math.cos(angle) * distance;
      posZ = Math.sin(angle) * distance;
    } else {
      // Tamamen rastgele konumlandır
      posX = (Math.random() - 0.5) * 40;
      posZ = (Math.random() - 0.5) * 40;
    }
    
    // İnsan türüne göre ölçeklendirme ve pozisyon ayarla
    let personScale;
    let yPos = -1.95; // Zemine temas etmesi için (önceden -1.6)
    
    if (personType === 'child') {
      personScale = 0.6 + Math.random() * 0.1; // Çocuk: daha küçük (0.6-0.7)
    } else if (personType === 'grandfather' || personType === 'grandmother') {
      personScale = 0.75 + Math.random() * 0.1; // Yaşlı: orta boy (0.75-0.85)
    } else if (personType === 'doctor') {
      personScale = 0.8 + Math.random() * 0.1; // Doktor: biraz daha büyük (0.8-0.9)
    } else {
      personScale = 0.75 + Math.random() * 0.15; // Diğerleri: normal boy (0.75-0.9)
    }
    
    person.position.set(posX, yPos, posZ);
    
    // İnsan ölçeği
    person.scale.set(personScale, personScale, personScale);
    
    // Rastgele bir yöne bak
    person.rotation.y = Math.random() * Math.PI * 2;
    
    // İnsan verilerini ekle
    person.userData = {
      type: personType,
      walkSpeed: 0.02 + Math.random() * 0.02,
      walkPhase: Math.random() * Math.PI * 2,
      direction: new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
      ).normalize(),
      directionChangeTime: 0,
      originalY: yPos,
      walkingType: Math.random() < 0.7 ? "wandering" : "standing" // Çoğu geziniyor, bazıları duruyor
    };
    
    scene.add(person);
    people.push(person);
  }
};

// Su birikintisi oluşturma
const createPuddle = () => {
  const puddleGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
  const puddleMaterial = new THREE.MeshStandardMaterial({
    color: 0x61a5c2,  // Açık mavi
    roughness: 0.8
  });
  puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
  puddle.position.set(0, -1, 0);
  puddle.receiveShadow = true;
  scene.add(puddle);
};

// Güneş oluşturma
const createSun = () => {
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffe0,  // Sarı
    emissive: 0xffffe0,
    emissiveIntensity: 2,
    roughness: 0.1
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 10, 0);
  scene.add(sun);
};

// Bulut sistemi oluşturma
const createCloudSystem = (cloudCount) => {
  clouds = [];
  for (let i = 0; i < cloudCount; i++) {
    const cloudGeometry = new THREE.SphereGeometry(5, 32, 32);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,  // Beyaz
      roughness: 0.8
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    
    // Bulutu rastgele yerleştir
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    cloudMesh.position.set(x, 10 + Math.random() * 10, z);
    
    // Bulutu rastgele boyutlandır
    const scale = 0.5 + Math.random() * 0.5;
    cloudMesh.scale.set(scale, scale, scale);
    
    scene.add(cloudMesh);
    clouds.push(cloudMesh);
  }
};

// Simülasyon güncelleme fonksiyonu
const updateSimulation = () => {
  // Animasyon güncelleme
  if (isAnimating.value) {
    animate();
  }
};

// Animasyon işleyicisi
const animate = () => {
  requestAnimationFrame(animate);
  
  // Animasyon için gerekli işlemler
  // ...
};

// Pencere boyut değişimi işleyicisi
const onWindowResize = () => {
  // Renderer boyutlarını güncelle
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Kamera orijinini güncelle
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
};

// Diğer işlevler ve fonksiyonlar
// ...
</script>

<style scoped>
  /* Stil kodları burada tanımlanabilir */
</style>
