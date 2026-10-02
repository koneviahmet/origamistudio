<template>
  <div class="relative h-screen w-full overflow-hidden">
    <!-- Simülasyon Alanı -->
    <div id="simulation-container" ref="simulationContainer" class="w-full h-full"></div>
    

    
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
    <button @click="toggleSettings" class="md:hidden absolute top-4 left-4 bg-gray-800 p-2 rounded-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Mobil Ayarlar Modalı -->
    <div v-if="isMobileSettingsOpen" class="md:hidden   bg-black bg-opacity-50 z-50 fixed top-0 left-0 w-full h-full items-center justify-center" @click.self="toggleSettings">
      
      <div class="bg-gray-800 p-6 w-full h-screen overflow-y-auto">
        
        <div class="flex justify-between items-center py-4">
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
    <div class="hidden md:block absolute top-0 right-0 bg-gray-800 text-white w-64 h-screen p-4 overflow-y-auto">
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
      -2, // Zemine temas etmesi için y pozisyonunu düşür
      Math.sin(angle) * radius
    );
    
    // Ağacı rastgele boyutlandır - boyutları büyüt
    const scale = 1.8 + Math.random() * 0.7; // Ağaçları büyüt
    tree.scale.set(scale, scale, scale);
    
    scene.add(tree);
    trees.push(tree);
  }
};

// Hayvanlar oluşturma
const createAnimals = () => {
  // Kuşlar
  for (let i = 0; i < 5; i++) {
    // Asset kullanarak kuş oluştur
    const bird = models.createModelWithFixedColors('bird');
    
    // Kuşu rastgele yerleştir - kuşlar havada kalacak
    bird.position.set(
      (Math.random() - 0.5) * 30,
      5 + Math.random() * 5, // Havada kalmasını sağla
      (Math.random() - 0.5) * 30
    );
    
    // Kuşu boyutlandır - büyüt
    const scale = 0.6 + Math.random() * 0.3; // Kuşları büyüt
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
    
    // Hayvanı rastgele yerleştir ve y pozisyonunu ayarla
    let yPosition = -1.98; // Varsayılan zemine temas eden pozisyon
    
    // Kelebek için farklı y pozisyonu (havada uçabilir)
    if (animalType === 'butterfly') {
      yPosition = 0 + Math.random() * 3; // Kelebekler havada
    }
    
    // Hayvan için boyut ayarla - hayvan tipine göre ve daha büyük
    let scale;
    if (animalType === 'rabbit') {
      scale = 0.8 + Math.random() * 0.3; // Tavşanları büyüt
    } else if (animalType === 'dog') {
      scale = 0.9 + Math.random() * 0.3; // Köpekleri büyüt
    } else if (animalType === 'cat') {
      scale = 0.8 + Math.random() * 0.25; // Kedileri büyüt
    } else if (animalType === 'frog') {
      scale = 0.6 + Math.random() * 0.2; // Kurbağaları büyüt
      yPosition = -1.99; // Kurbağalar tamamen yere yakın
    } else if (animalType === 'butterfly') {
      scale = 0.5 + Math.random() * 0.2; // Kelebekleri büyüt
    }
    
    animal.position.set(
      (Math.random() - 0.5) * 40,
      yPosition,
      (Math.random() - 0.5) * 40
    );
    
    animal.scale.set(scale, scale, scale);
    
    // Rastgele bir yöne baktır
    animal.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(animal);
    animals.push({
      mesh: animal,
      type: animalType,
      initialX: animal.position.x,
      initialZ: animal.position.z,
      initialY: animal.position.y, // Başlangıç y pozisyonunu kaydet
      phase: Math.random() * Math.PI * 2
    });
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
        -1.95, // Zemine yakın ama biraz yukarıda
        clusterZ + Math.sin(offsetAngle) * offsetRadius
      );
      
      // Çiçek grubunu doğru yönlendir
      flower.rotation.y = Math.random() * Math.PI * 2; // Rastgele yön
      
      // Çiçeğin büyüklüğünü önemli ölçüde artır
      const scale = 0.8 + Math.random() * 0.4; // Çiçekleri çok daha büyük yap
      flower.scale.set(scale, scale, scale);
      
      // Çiçek verilerini ekle
      flower.userData = {
        type: "flower",
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.5 + Math.random() * 0.5,
        originalY: -1.95,
        growthPhase: Math.random(),
        originalScale: scale // Orijinal ölçeği kaydet
      };
      
      scene.add(flower);
      flowers.push(flower);
    }
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
    
    // İnsan tipine göre boyut ve pozisyon ayarla - büyüt
    let scale;
    let yPos = -1.99; // Zemine tam temas
    
    if (personType === 'child') {
      scale = 0.9 + Math.random() * 0.15; // Çocukları büyüt
    } else if (personType === 'man' || personType === 'woman') {
      scale = 1.1 + Math.random() * 0.2; // Yetişkinleri büyüt
    } else if (personType === 'grandfather' || personType === 'grandmother') {
      scale = 1.0 + Math.random() * 0.15; // Yaşlıları büyüt
    } else if (personType === 'doctor') {
      scale = 1.1 + Math.random() * 0.2; // Doktoru büyüt
    }
    
    person.position.set(posX, yPos, posZ);
    
    // İnsan ölçeği
    person.scale.set(scale, scale, scale);
    
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
  const puddleGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
  const puddleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3498db, 
    transparent: true, 
    opacity: 0.8
  });
  puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
  puddle.position.y = -1.75;
  puddle.receiveShadow = true;
  scene.add(puddle);
};

// Güneş oluşturma fonksiyonu
const createSun = () => {
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd00,
    transparent: true,
    opacity: 0.8
  });
  
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(20, 20, -20);
  
  // Güneş ışığı
  const sunLight = new THREE.PointLight(0xffffcc, 1, 100);
  sunLight.position.copy(sun.position);
  sun.add(sunLight);
  
  scene.add(sun);
};

// Bulut sistemini güncelleme
const createCloudSystem = (count = 3) => {
  // Mevcut bulutları temizle
  clouds.forEach(cloud => scene.remove(cloud));
  clouds = [];
  
  for (let i = 0; i < count; i++) {
    // Asset kullanarak bulut oluştur
    const cloudMesh = models.createModelWithFixedColors('cloud');
    
    // Bulutları daha fazla dağıt
    const angle = (i / count) * Math.PI * 2;
    const radius = 20;
    
    // Bulutları daha dengeli dağıt
    if (count <= 4) {
      // Az sayıda bulut varsa çemberde düzenli dağıt
      cloudMesh.position.set(
        Math.cos(angle) * radius,
        10,
        Math.sin(angle) * radius
      );
    } else {
      // Çok bulut varsa alan içinde rastgele dağıt
      cloudMesh.position.set(
        (Math.random() * 2 - 1) * radius,
        10,
        (Math.random() * 2 - 1) * radius
      );
    }
    
    // Bulutun boyutunu büyüt
    cloudMesh.scale.set(3, 3, 3);
    
    clouds.push(cloudMesh);
    scene.add(cloudMesh);
  }
};

// UseModelNatureElements.js'den alınan Yağmur modeli
const createRaindrops = (count) => {
  // Her bulut için yağmur damlaları oluştur
  clouds.forEach(cloud => {
    // Yağmur miktarını artır (damla sayısını 3 katına çıkar)
    for (let i = 0; i < count * 3; i++) {
      const dropGeometry = new THREE.CylinderGeometry(0.03, 0, 0.2, 8);
      const dropMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
      });
      
      const drop = new THREE.Mesh(dropGeometry, dropMaterial);
      
      // Bulutun pozisyonuna göre damla pozisyonunu ayarla
      // Yağmur dağılımını artır (radius'u 5'e çıkar)
      const radius = Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      drop.position.x = cloud.position.x + Math.cos(angle) * radius;
      drop.position.z = cloud.position.z + Math.sin(angle) * radius;
      drop.position.y = cloud.position.y - 1; // Bulutun alt kısmından başlat
      
      // Damlalar aşağı doğru baksın
      drop.rotation.x = Math.PI;
      
      // Damla özelliklerini ekle
      drop.userData = {
        velocity: new THREE.Vector3(0, -0.15 - Math.random() * 0.1, 0),
        lifetime: Math.random() * 100 + 100
      };
      
      scene.add(drop);
      raindrops.push(drop);
    }
  });
};

// UseModelNatureElements.js'den alınan Kar modeli
const createSnowflakes = (count) => {
  // Her bulut için kar taneleri oluştur
  clouds.forEach(cloud => {
    for (let i = 0; i < count; i++) {
      const flakeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const flakeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      
      const flake = new THREE.Mesh(flakeGeometry, flakeMaterial);
      
      // Bulutun pozisyonuna göre kar tanesi pozisyonunu ayarla
      const radius = Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      flake.position.x = cloud.position.x + Math.cos(angle) * radius;
      flake.position.z = cloud.position.z + Math.sin(angle) * radius;
      flake.position.y = cloud.position.y - 1; // Bulutun alt kısmından başlat
      
      // Kar tanesi özelliklerini ekle
      flake.userData = {
        velocity: new THREE.Vector3(
          Math.random() * 0.02 - 0.01,
          -0.05 - Math.random() * 0.05,
          Math.random() * 0.02 - 0.01
        ),
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.01,
          Math.random() * 0.01,
          Math.random() * 0.01
        ),
        lifetime: Math.random() * 100 + 150,
        sourceCloud: cloud // Hangi buluttan geldiğini hatırla
      };
      
      scene.add(flake);
      snowflakes.push(flake);
    }
  });
};

// Su buharı parçacıkları oluşturma
const createWaterParticles = (count) => {
  // Parçacıklar oluşturma
  for (let i = 0; i < count; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.7
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Rastgele pozisyon (su birikintisi içinde)
    const radius = Math.random() * 4.5;
    const angle = Math.random() * Math.PI * 2;
    particle.position.x = Math.cos(angle) * radius;
    particle.position.z = Math.sin(angle) * radius;
    particle.position.y = -1.5;
    
    // Partikül özelliklerini ekle
    particle.userData = {
      velocity: new THREE.Vector3(
        Math.random() * 0.02 - 0.01,
        0.05 + Math.random() * 0.05,
        Math.random() * 0.02 - 0.01
      ),
      lifetime: Math.random() * 100 + 200
    };
    
    scene.add(particle);
    particles.push(particle);
  }
};

// Simülasyonu güncelleme
const updateSimulation = () => {
  if (!scene) return;
  
  const temp = temperature.value;
  
  // Hava durumuna göre güneş ve bulutları güncelle
  updateWeatherVisuals(temp);
  
  // Buhar oluşumu (sıcaklık 10°C üstündeyse)
  if (temp > 10) {
    const evaporationRate = Math.floor((temp - 10) / 3);
    if (Math.random() < 0.3) {
      createWaterParticles(evaporationRate);
    }
  }
  
  // Yağmur (sıcaklık 0-15°C arasındaysa)
  if (temp >= 0 && temp <= 15 && clouds.length > 0) {
    // Sıcaklık düştükçe yağmur olasılığı artar
    const rainProbability = (15 - temp) / 15;
    // Yağmur olasılığını artır (0.3 -> 0.6)
    if (Math.random() < rainProbability * 0.6) {
      // Her bulut için daha az damla oluştur (toplam damla sayısı aynı kalsın)
      const dropsPerCloud = Math.max(1, Math.floor(rainProbability * 5 / clouds.length));
      createRaindrops(dropsPerCloud);
    }
  }
  
  // Kar (sıcaklık 0°C altındaysa)
  if (temp < 0 && clouds.length > 0) {
    // Sıcaklık düştükçe kar olasılığı artar
    const snowProbability = Math.min(1, Math.abs(temp) / 10);
    if (Math.random() < snowProbability * 0.3) { // Her frame'de maksimum %30 olasılıkla
      // Her bulut için daha az kar tanesi oluştur
      const flakesPerCloud = Math.max(1, Math.floor(snowProbability * 3 / clouds.length));
      createSnowflakes(flakesPerCloud);
    }
  }
};

// Hava durumuna göre görsel güncelleme
const updateWeatherVisuals = (temp) => {
  // Güneş görünürlüğü
  if (sun) {
    if (temp < 0 || (temp >= 0 && temp <= 15)) {
      // Kar veya yağmur durumunda güneş kaybolsun
      sun.visible = false;
    } else {
      // Buharlaşma durumunda güneş görünsün
      sun.visible = true;
    }
  }
  
  // Bulut sistemi güncelleme
  if (temp < 0 || (temp >= 0 && temp <= 15)) {
    // Kar veya yağmur durumunda çok bulut
    if (clouds.length < 6) {
      createCloudSystem(6);
    }
    // Bulutları daha opak yap
    clouds.forEach(cloud => {
      cloud.children.forEach(piece => {
        piece.material.opacity = 0.9;
      });
    });
  } else {
    // Buharlaşma durumunda az bulut
    if (clouds.length > 3) {
      createCloudSystem(3);
    }
    // Bulutları daha transparan yap
    clouds.forEach(cloud => {
      cloud.children.forEach(piece => {
        piece.material.opacity = 0.6;
      });
    });
  }
};

// Pencere boyut değişimi işleyicisi
const onWindowResize = () => {
  if (!camera || !renderer || !simulationContainer.value) return;
  
  const containerWidth = simulationContainer.value.clientWidth;
  const containerHeight = simulationContainer.value.clientHeight;
  
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
};

// Hayvanları güncelleme
const updateAnimals = (delta) => {
  animals.forEach(animal => {
    if (animal.type === 'bird') {
      // Kuşlar yukarı aşağı uçsun
      animal.phase += delta * 2;
      animal.mesh.position.y = animal.initialY + Math.sin(animal.phase) * 0.5;
      
      // İleri doğru hareket - daire şeklinde uçuş
      const radius = 10;
      const speed = 0.2;
      animal.mesh.position.x = Math.cos(animal.phase * speed) * radius;
      animal.mesh.position.z = Math.sin(animal.phase * speed) * radius;
      
      // Uçuş yönüne dönme
      animal.mesh.rotation.y = Math.atan2(
        -Math.sin(animal.phase * speed),
        -Math.cos(animal.phase * speed)
      );
    }
    else if (animal.type === 'rabbit' || animal.type === 'dog' || animal.type === 'cat') {
      // Karasal hayvanlar zıplayabilir veya koşabilir
      animal.phase += delta;
      animal.mesh.position.x = animal.initialX + Math.sin(animal.phase) * 2;
      
      // Zıplama hareketi - hayvanın tipine göre zıplama yüksekliğini ayarla
      let jumpHeight = 0.1; // Varsayılan zıplama yüksekliği
      if (animal.type === 'rabbit') {
        jumpHeight = 0.3; // Tavşanlar daha yüksek zıplar
      } else if (animal.type === 'dog') {
        jumpHeight = 0.2; // Köpekler orta seviyede zıplar
      } else if (animal.type === 'cat') {
        jumpHeight = 0.15; // Kediler daha az zıplar
      }
      
      // Zıplama animasyonu - hayvan zemine geri dönecek
      animal.mesh.position.y = animal.initialY + Math.abs(Math.sin(animal.phase * 2)) * jumpHeight;
      
      // Hareket yönüne dönme
      if (Math.cos(animal.phase) > 0) {
        animal.mesh.rotation.y = Math.PI / 2;
      } else {
        animal.mesh.rotation.y = -Math.PI / 2;
      }
    }
    else if (animal.type === 'frog') {
      // Kurbağa zıplar
      animal.phase += delta * 0.5;
      if (Math.sin(animal.phase) > 0.9 && !animal.isJumping) {
        animal.isJumping = true;
        animal.jumpTarget = {
          x: animal.initialX + (Math.random() - 0.5) * 4,
          z: animal.initialZ + (Math.random() - 0.5) * 4
        };
      }
      
      if (animal.isJumping) {
        const jumpProgress = (animal.phase % (2 * Math.PI)) / (2 * Math.PI);
        
        if (jumpProgress < 0.5) {
          // Zıplama yüksekliği
          animal.mesh.position.y = animal.initialY + Math.sin(jumpProgress * Math.PI) * 0.8;
          
          // Hedef noktaya doğru hareket
          animal.mesh.position.x += (animal.jumpTarget.x - animal.mesh.position.x) * 0.1;
          animal.mesh.position.z += (animal.jumpTarget.z - animal.mesh.position.z) * 0.1;
          
          // Zıplama yönüne dönme
          animal.mesh.rotation.y = Math.atan2(
            animal.jumpTarget.x - animal.initialX,
            animal.jumpTarget.z - animal.initialZ
          );
        } else {
          animal.isJumping = false;
          animal.initialX = animal.mesh.position.x;
          animal.initialZ = animal.mesh.position.z;
          animal.mesh.position.y = animal.initialY; // Zıplama sonrası zemine geri dön
        }
      }
    }
    else if (animal.type === 'butterfly') {
      // Kelebek uçuşu - karışık hareket
      animal.phase += delta * 3;
      
      // Kanat çırpma animasyonu için ölçeklendirme
      const wingScale = Math.abs(Math.sin(animal.phase * 8)) * 0.3 + 0.7;
      animal.mesh.scale.z = wingScale;
      
      // Rastgele uçuş yolu
      const flyRadius = 5;
      animal.mesh.position.x = animal.initialX + Math.sin(animal.phase * 0.5) * flyRadius;
      animal.mesh.position.y = animal.initialY + Math.sin(animal.phase * 0.7) * 1;
      animal.mesh.position.z = animal.initialZ + Math.cos(animal.phase * 0.6) * flyRadius;
      
      // Uçuş yönüne dönme
      animal.mesh.rotation.y = Math.atan2(
        Math.cos(animal.phase * 0.5),
        Math.sin(animal.phase * 0.6)
      );
    }
  });
};

// Yağmur damlası yere çarptığında küçük su birikintisi oluşturma
const createRainPuddle = (x, z) => {
  // Maksimum birikinti sayısı kontrolü
  if (puddles.length >= MAX_PUDDLES) {
    // En eski birikintilerden birini kaldır
    const oldestPuddle = puddles.shift();
    scene.remove(oldestPuddle);
  }

  // Eğer yakında başka bir su birikintisi varsa, bu birikintinin boyutunu artır
  const nearbyPuddle = puddles.find(p => {
    const distance = Math.sqrt(Math.pow(p.position.x - x, 2) + Math.pow(p.position.z - z, 2));
    return distance < 3; // 3 birim içinde başka bir birikinti varsa
  });
  
  if (nearbyPuddle) {
    // Mevcut birikintinin boyutunu bir miktar artır (maksimum boyuta kadar)
    if (nearbyPuddle.scale.x < 1.5) {
      nearbyPuddle.scale.x += 0.05;
      nearbyPuddle.scale.z += 0.05;
    }
    // Birikintinin ömrünü uzat
    nearbyPuddle.userData.lifetime = Math.min(nearbyPuddle.userData.lifetime + 100, 500);
    return;
  }
  
  // Yakında başka birikinti yoksa yeni bir birikinti oluştur (daha düşük olasılıkla)
  if (Math.random() > 0.95) { // %5 olasılıkla yeni birikinti oluştur (0.9'dan 0.95'e çıkardım)
    const puddleGeometry = new THREE.CylinderGeometry(1, 1, 0.05, 16);
    const puddleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3498db, 
      transparent: true, 
      opacity: 0.7
    });
    const smallPuddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
    
    // Birikinti pozisyonu (yere yakın)
    smallPuddle.position.set(x, -1.97, z);
    
    // Birikintinin yatay olması için rotasyonu düzelt (silindir yüzü yere paralel olacak)
    smallPuddle.rotation.x = 0; // Yatay döndürme - 90 derece döndürmeyi kaldırdık
    
    smallPuddle.receiveShadow = true;
    
    // Başlangıçta küçük boyut
    const randomSize = 0.3 + Math.random() * 0.3;
    smallPuddle.scale.set(randomSize, 0.1, randomSize); // Y değerini 0.1 yaparak ince olmasını sağla
    
    // Birikinti özellikleri
    smallPuddle.userData = {
      lifetime: 300 + Math.random() * 200, // Birkaç saniye kalır
      originalOpacity: 0.7
    };
    
    scene.add(smallPuddle);
    puddles.push(smallPuddle);
  }
};

// Kar yağarken yerde ve ağaçlarda kar birikmesi oluşturma
const createSnowCover = (position, normal, isTree = false) => {
  // Maksimum kar örtüsü sayısı kontrolü
  if (snowCovers.length >= MAX_SNOW_COVERS) {
    // En eski kar örtülerinden birini kaldır
    const oldestSnow = snowCovers.shift();
    scene.remove(oldestSnow);
  }
  
  // Ağaç üzerinde mi yoksa zeminde mi kontrol et
  const size = isTree ? 0.7 : 1 + Math.random() * 1.5; // Daha küçük kar örtüleri
  const height = isTree ? 0.1 : 0.05;
  
  // Mevcut kar örtüsünün yakında olup olmadığını kontrol et
  const nearbySnow = snowCovers.find(s => {
    if (s.userData.isTree === isTree) {
      const distance = Math.sqrt(
        Math.pow(s.position.x - position.x, 2) + 
        Math.pow(s.position.z - position.z, 2)
      );
      return distance < (isTree ? 1 : 3);
    }
    return false;
  });
  
  if (nearbySnow) {
    // Mevcut kar örtüsünün boyutunu ve kalınlığını artır
    if (nearbySnow.scale.x < (isTree ? 1.2 : 2)) { // Maksimum boyutları küçülttük
      nearbySnow.scale.x += 0.05;
      nearbySnow.scale.z += 0.05;
      
      // Kar kalınlığını artır
      if (nearbySnow.scale.y < (isTree ? 0.3 : 0.2)) { // Maksimum kalınlığı azalttık
        nearbySnow.scale.y += 0.01;
      }
    }
    return;
  }
  
  // Yeni kar örtüsü olasılığını azalt
  if (Math.random() > (isTree ? 0.8 : 0.95)) { // Daha düşük olasılık
    const snowGeometry = new THREE.CylinderGeometry(size, size, height, 16);
    const snowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1
    });
    const snowCover = new THREE.Mesh(snowGeometry, snowMaterial);
    
    // Kar pozisyonu ayarla
    if (isTree) {
      // Ağaçlarda kar, ağaç yapraklarının üzerinde birikir
      snowCover.position.copy(position);
      // Yaprak konisinin eğimine göre kar pozisyonunu ayarla
      snowCover.position.y += 0.05;
    } else {
      // Zeminde kar
      snowCover.position.set(position.x, -1.97, position.z);
    }
    
    // Kar örtüsünün yatay olması için rotasyonu düzelt
    snowCover.rotation.x = 0; // Yatay döndürme - 90 derece döndürmeyi kaldırdık
    
    // Başlangıç boyutu
    const initialSize = isTree ? 0.3 + Math.random() * 0.2 : 0.5 + Math.random() * 0.5;
    snowCover.scale.set(initialSize, 0.1, initialSize); // Y değerini 0.1 yaparak ince olmasını sağla
    
    // Kar örtüsü özellikleri
    snowCover.userData = {
      isTree: isTree,
      growthFactor: 0.005 + Math.random() * 0.01 // Daha yavaş büyüme
    };
    
    scene.add(snowCover);
    snowCovers.push(snowCover);
  }
};

// Ana animasyon döngüsü
const animate = () => {
  if (!isAnimating.value) return;
  
  const delta = clock.getDelta() * animationSpeed.value;
  
  // Bulutları döndürme kodu kaldırıldı - artık sabit kalacaklar
  
  // Parçacıkları güncelle
  updateParticles(delta);
  
  // Yağmur damlalarını güncelle
  updateRaindrops(delta);
  
  // Kar tanelerini güncelle
  updateSnowflakes(delta);
  
  // Su birikintilerini güncelle
  updatePuddles(delta);
  
  // Kar örtülerini güncelle
  updateSnowCovers(delta);
  
  // Hayvanları güncelle
  updateAnimals(delta);
  
  // Çiçekleri güncelle
  updateFlowers(delta);
  
  // İnsanları güncelle
  updatePeople(delta);
  
  // Yeni parçacık ve yağış oluşturma
  updateSimulation();
  
  // Kontrolleri güncelle
  controls.update();
  
  // Render
  renderer.render(scene, camera);
  
  // Animasyon döngüsü
  animationId = requestAnimationFrame(animate);
};

// Parçacıkları güncelleme
const updateParticles = (delta) => {
  // Silinecek parçacıkları topla
  const particlesToRemove = [];
  
  // Her parçacığı güncelle
  particles.forEach(particle => {
    // Parçacığı hareket ettir
    particle.position.x += particle.userData.velocity.x * delta * 60;
    particle.position.y += particle.userData.velocity.y * delta * 60;
    particle.position.z += particle.userData.velocity.z * delta * 60;
    
    // Ömrünü azalt
    particle.userData.lifetime -= 1 * delta * 60;
    
    // Eğer ömrü bittiyse veya buluta ulaştıysa
    if (particle.userData.lifetime <= 0 || particle.position.y >= 9) {
      particlesToRemove.push(particle);
      scene.remove(particle);
    }
  });
  
  // Silinecek parçacıkları listeden kaldır
  particles = particles.filter(p => !particlesToRemove.includes(p));
};

// Yağmur damlalarını güncelleme
const updateRaindrops = (delta) => {
  // Silinecek damlaları topla
  const dropsToRemove = [];
  
  // Her damlayı güncelle
  raindrops.forEach(drop => {
    // Damlayı hareket ettir
    drop.position.x += drop.userData.velocity.x * delta * 60;
    drop.position.y += drop.userData.velocity.y * delta * 60;
    drop.position.z += drop.userData.velocity.z * delta * 60;
    
    // Ömrünü azalt
    drop.userData.lifetime -= 1 * delta * 60;
    
    // Eğer ömrü bittiyse veya yere çarptıysa
    if (drop.userData.lifetime <= 0 || drop.position.y <= -1.5) {
      // Yere çarptığında su birikintisi oluştur
      if (drop.position.y <= -1.5) {
        createRainPuddle(drop.position.x, drop.position.z);
      }
      
      dropsToRemove.push(drop);
      scene.remove(drop);
    }
  });
  
  // Silinecek damlaları listeden kaldır
  raindrops = raindrops.filter(d => !dropsToRemove.includes(d));
};

// Kar tanelerini güncelleme
const updateSnowflakes = (delta) => {
  // Silinecek kar tanelerini topla
  const flakesToRemove = [];
  
  // Her kar tanesini güncelle
  snowflakes.forEach(flake => {
    // Kar tanesini hareket ettir
    flake.position.x += flake.userData.velocity.x * delta * 60;
    flake.position.y += flake.userData.velocity.y * delta * 60;
    flake.position.z += flake.userData.velocity.z * delta * 60;
    
    // Kar tanesini döndür
    flake.rotation.x += flake.userData.rotationSpeed.x * delta * 60;
    flake.rotation.y += flake.userData.rotationSpeed.y * delta * 60;
    flake.rotation.z += flake.userData.rotationSpeed.z * delta * 60;
    
    // Ömrünü azalt
    flake.userData.lifetime -= 1 * delta * 60;
    
    // Eğer ömrü bittiyse veya yere çarptıysa
    if (flake.userData.lifetime <= 0 || flake.position.y <= -1.5) {
      // Yere düştüğünde kar örtüsü oluştur
      if (flake.position.y <= -1.5) {
        createSnowCover(flake.position, {x: 0, y: 1, z: 0}, false);
      }
      
      flakesToRemove.push(flake);
      scene.remove(flake);
    } else {
      // Ağaçlara çarpma kontrolü
      trees.forEach(tree => {
        // Kar tanesi ağacın üst kısmına çarptı mı?
        const treePos = tree.position;
        const treeTop = treePos.y + 3 * tree.scale.y; // Ağacın tepe noktası
        const treeRadius = 1.5 * tree.scale.x; // Yaprakların genişliği
        
        // Kar tanesi ağacın üst kısmına çarptı mı?
        const distanceXZ = Math.sqrt(Math.pow(flake.position.x - treePos.x, 2) + Math.pow(flake.position.z - treePos.z, 2));
        
        if (distanceXZ < treeRadius && Math.abs(flake.position.y - treeTop) < 0.5) {
          // Ağaç tepesinde kar birikimi oluştur
          createSnowCover(
            {x: treePos.x, y: treeTop, z: treePos.z}, 
            {x: 0, y: 1, z: 0}, 
            true
          );
          
          flakesToRemove.push(flake);
          scene.remove(flake);
        }
      });
    }
  });
  
  // Silinecek kar tanelerini listeden kaldır
  snowflakes = snowflakes.filter(f => !flakesToRemove.includes(f));
};

// Su birikintilerini güncelleme
const updatePuddles = (delta) => {
  const puddlesToRemove = [];
  
  puddles.forEach(puddle => {
    // Birikintinin ömrünü azalt (sıcaklığa bağlı olarak)
    const evaporationRate = Math.max(0.5, (temperature.value / 10)); // Sıcaklık arttıkça buharlaşma hızlanır
    puddle.userData.lifetime -= evaporationRate * delta * 30;
    
    // Ömrü azaldıkça şeffaflaştır
    const remainingLifeRatio = puddle.userData.lifetime / 500; // 500 maksimum ömür olduğunu varsayalım
    puddle.material.opacity = puddle.userData.originalOpacity * remainingLifeRatio;
    
    // Birikinti tamamen buharlaştıysa kaldır
    if (puddle.userData.lifetime <= 0) {
      puddlesToRemove.push(puddle);
      scene.remove(puddle);
    }
  });
  
  // Silinecek birikintileri listeden kaldır
  puddles = puddles.filter(p => !puddlesToRemove.includes(p));
};

// Kar örtülerini güncelleme
const updateSnowCovers = (delta) => {
  // Kar erime hızı (sıcaklığa bağlı)
  const meltRate = Math.max(0, temperature.value) * delta * 0.01;
  
  const snowsToRemove = [];
  
  snowCovers.forEach(snow => {
    // Kar yağışı devam ediyorsa ve kar halen var ise kar birikimini artır
    if (temperature.value < 0) {
      const growFactor = snow.userData.growthFactor * delta;
      
      // Maksimum boyuta kadar büyüt - daha küçük sınırlar
      if (snow.scale.x < (snow.userData.isTree ? 1.2 : 2)) {
        snow.scale.x += growFactor;
        snow.scale.z += growFactor;
      }
      
      // Kar kalınlığını artır - daha ince kar örtüsü
      if (snow.scale.y < (snow.userData.isTree ? 0.3 : 0.2)) {
        snow.scale.y += growFactor * 0.5;
      }
    } 
    // Kar erime (sıcaklık 0°C üstünde)
    else if (temperature.value > 0) {
      // Kar kalınlığını azalt
      snow.scale.y -= meltRate;
      
      // Eriyen kar genişliği de azaltır
      snow.scale.x -= meltRate * 0.5;
      snow.scale.z -= meltRate * 0.5;
      
      // Kar tamamen eridiyse kaldır
      if (snow.scale.y <= 0.01 || snow.scale.x <= 0.1) {
        snowsToRemove.push(snow);
        scene.remove(snow);
      }
    }
  });
  
  // Silinecek kar örtülerini listeden kaldır
  snowCovers = snowCovers.filter(s => !snowsToRemove.includes(s));
};

// Çiçekleri güncelleme
const updateFlowers = (delta) => {
  // Çiçeklerin hareketlerini güncelle
  flowers.forEach(flower => {
    // Hafif sallanma animasyonu
    flower.userData.swayPhase += delta * flower.userData.swaySpeed;
    
    // Çiçeğin eğimi (rüzgarda hafif sallanma)
    const swayAmount = 0.05; // Sallanma miktarı
    flower.rotation.x = Math.sin(flower.userData.swayPhase) * swayAmount;
    flower.rotation.z = Math.cos(flower.userData.swayPhase * 0.7) * swayAmount;
    
    // Havaya göre çiçeklerin durumunu güncelle
    if (temperature.value < 0) {
      // Çiçekler soğukta küçülsün
      flower.scale.setScalar(flower.userData.originalScale * 0.8);
    } else {
      // Normal sıcaklıkta canlanıp büyüsün
      if (flower.userData.originalScale) {
        flower.scale.setScalar(flower.userData.originalScale);
      } else {
        flower.userData.originalScale = flower.scale.x;
      }
    }
  });
};

// İnsanları güncelleme
const updatePeople = (delta) => {
  people.forEach(person => {
    // Yürüme fazını güncelle
    person.userData.walkPhase += delta * 2 * person.userData.walkSpeed * 20;
    
    if (person.userData.walkingType === "wandering") {
      // Rastgele yönde dolaş
      person.userData.directionChangeTime -= delta;
      
      if (person.userData.directionChangeTime <= 0) {
        // Yönü değiştirme zamanı
        person.userData.direction.set(
          Math.random() - 0.5,
          0,
          Math.random() - 0.5
        ).normalize();
        person.userData.directionChangeTime = 3 + Math.random() * 5; // 3-8 saniye sonra yön değiştir
        
        // Yürüme yönüne bak
        person.rotation.y = Math.atan2(
          person.userData.direction.x,
          person.userData.direction.z
        );
      }
      
      // Belirlenen yönde ilerle
      person.position.x += person.userData.direction.x * person.userData.walkSpeed * delta * 60;
      person.position.z += person.userData.direction.z * person.userData.walkSpeed * delta * 60;
      
      // Simülasyon alanı sınırları
      const maxDist = 40;
      if (Math.abs(person.position.x) > maxDist || Math.abs(person.position.z) > maxDist) {
        // Sınırlara ulaşıldığında merkeze doğru dön
        person.userData.direction.set(-person.position.x, 0, -person.position.z).normalize();
        person.rotation.y = Math.atan2(
          person.userData.direction.x,
          person.userData.direction.z
        );
      }
      
      // Hafif zıplama hareketi
      person.position.y = person.userData.originalY + Math.abs(Math.sin(person.userData.walkPhase * 2)) * 0.1;
    } else if (person.userData.walkingType === "standing") {
      // Duran insanlar için hafif sallanma
      person.position.y = person.userData.originalY + Math.sin(person.userData.walkPhase * 0.5) * 0.02;
    }
    
    // Hava durumundan insanların etkilenmesini sağla
    if (temperature.value < 0) {
      // Soğuk havada daha az hareketlilik
      person.userData.walkSpeed = 0.01 + Math.random() * 0.01;
    } else if (temperature.value > 25) {
      // Sıcak havada daha az hareketlilik
      person.userData.walkSpeed = 0.01 + Math.random() * 0.01;
    } else {
      // Normal sıcaklıkta normal hız
      person.userData.walkSpeed = 0.02 + Math.random() * 0.02;
    }
  });
};

// Sıcaklık değişimini izle
watch(temperature, () => {
  updateSimulation();
});

// Arkaplan rengi değişimini izle
watch(backgroundColor, (newColor) => {
  // Arkaplan rengini güncelle
  if (scene) {
    scene.background = new THREE.Color(newColor);
    updateWallsColor(newColor);
  }
});

// Ekolojik kavram seçildiğinde çağrılan fonksiyon
const handleConceptChange = () => {
  if (!selectedConcept.value) {
    conceptInfo.value = '';
    clearHighlights();
    return;
  }
  
  // Önceki vurgulamaları temizle
  clearHighlights();
  
  // Kavram bilgisini güncelle
  updateConceptInfo();
  
  // Kavrama göre uygun elemanları vurgula
  highlightConceptElements();
};

// Kavram bilgisini güncelleme
const updateConceptInfo = () => {
  switch (selectedConcept.value) {
    case 'Tür':
      conceptInfo.value = `<p><strong>Tür</strong>, birbirleriyle çiftleşebilen ve doğurgan yavrular üretebilen canlı topluluğudur.</p>
      <p>Bireyler arasında genetik alışveriş olabilir ve ortak genler taşırlar.</p>
      <p>Bu simülasyonda türlere örnek: kuşlar, tavşanlar, kelebekler, kurbağalar, ağaçlar, çiçekler vs.</p>`;
      break;
    case 'Popülasyon':
      conceptInfo.value = `<p><strong>Popülasyon</strong>, belirli bir alanda yaşayan aynı türe ait bireylerin oluşturduğu topluluktur.</p>
      <p>Popülasyonlar, doğum, ölüm, göç gibi faktörlerle büyüklükleri değişebilir.</p>
      <p>Bu simülasyonda popülasyonlara örnek: kuş sürüsü, tavşan topluluğu, ağaç grubu vs.</p>`;
      break;
    case 'Habitat':
      conceptInfo.value = `<p><strong>Habitat</strong>, bir organizmanın yaşadığı doğal çevredir.</p>
      <p>Her canlının yaşayabildiği özelleşmiş bir habitatı vardır ve canlı burada beslenme, barınma, üreme gibi ihtiyaçlarını karşılar.</p>
      <p>Bu simülasyonda farklı habitatlar bulunur: ağaçlık alanlar, açık alanlar, sulu alanlar gibi.</p>`;
      break;
    case 'Ekosistem':
      conceptInfo.value = `<p><strong>Ekosistem</strong>, canlı ve cansız varlıkların karşılıklı etkileşim içinde olduğu bir sistemdir.</p>
      <p>Ekosistemde enerji akışı ve madde döngüleri gerçekleşir.</p>
      <p>Bu simülasyon bir ekosistemi temsil eder: hava koşulları, bitki örtüsü, hayvan toplulukları ve su döngüsü birbiriyle etkileşim halindedir.</p>`;
      break;
    default:
      conceptInfo.value = '';
  }
};

// Seçili kavrama göre elemanları vurgulama
const highlightConceptElements = () => {
  if (selectedConcept.value === 'Tür') {
    // Rasgele bir tür seç (kuş, tavşan, kelebek, kurbağa, ağaç, çiçek, insan)
    const possibleTypes = ['bird', 'rabbit', 'butterfly', 'frog', 'dog', 'cat', 'tree', 'flower', 'man', 'woman', 'child'];
    const randomType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    
    // Seçilen türe göre uygun elemanları bul ve vurgula
    if (randomType === 'tree') {
      // Ağaçları vurgula
      highlightedElements.value = trees;
      highlightElements(trees);
    } 
    else if (randomType === 'flower') {
      // Çiçekleri vurgula
      highlightedElements.value = flowers;
      highlightElements(flowers);
    }
    else if (['man', 'woman', 'child', 'grandfather', 'grandmother', 'doctor'].includes(randomType)) {
      // İnsanları vurgula, ancak sadece seçilen türü
      const humanType = randomType;
      const humans = people.filter(person => person.userData.type === humanType);
      highlightedElements.value = humans;
      
      // Türkçe tür adını belirle
      let turkishType = "İnsan";
      if (humanType === 'man') turkishType = "Erkek";
      else if (humanType === 'woman') turkishType = "Kadın";
      else if (humanType === 'child') turkishType = "Çocuk";
      else if (humanType === 'grandfather') turkishType = "Yaşlı erkek";
      else if (humanType === 'grandmother') turkishType = "Yaşlı kadın";
      else if (humanType === 'doctor') turkishType = "Doktor";
      
      highlightElements(humans);
    }
    else {
      // Hayvanları vurgula, ancak sadece seçilen türü
      const animalType = randomType;
      const selectedAnimals = animals.filter(animal => animal.type === animalType).map(animal => animal.mesh);
      highlightedElements.value = selectedAnimals;
      
      // Türkçe tür adını belirle
      let turkishType = "Hayvan";
      if (animalType === 'bird') turkishType = "Kuş";
      else if (animalType === 'rabbit') turkishType = "Tavşan";
      else if (animalType === 'butterfly') turkishType = "Kelebek";
      else if (animalType === 'frog') turkishType = "Kurbağa";
      else if (animalType === 'dog') turkishType = "Köpek";
      else if (animalType === 'cat') turkishType = "Kedi";
      
      highlightElements(selectedAnimals);
    }
  } 
  else if (selectedConcept.value === 'Popülasyon') {
    // Rasgele bir popülasyon seç
    const possiblePopulations = ['birds', 'rabbits', 'butterflies', 'frogs', 'dogs', 'cats', 'trees', 'flowers', 'humans'];
    const randomPopulation = possiblePopulations[Math.floor(Math.random() * possiblePopulations.length)];
    
    // Seçilen popülasyona göre uygun elemanları bul ve vurgula
    if (randomPopulation === 'trees') {
      // Ağaç popülasyonunu vurgula
      highlightedElements.value = trees;
      highlightElements(trees);
    } 
    else if (randomPopulation === 'flowers') {
      // Çiçek popülasyonunu vurgula
      highlightedElements.value = flowers;
      highlightElements(flowers);
    }
    else if (randomPopulation === 'humans') {
      // İnsan popülasyonunu vurgula
      highlightedElements.value = people;
      highlightElements(people);
    }
    else {
      // Hayvan popülasyonunu vurgula
      let animalType;
      if (randomPopulation === 'birds') animalType = 'bird';
      else if (randomPopulation === 'rabbits') animalType = 'rabbit';
      else if (randomPopulation === 'butterflies') animalType = 'butterfly';
      else if (randomPopulation === 'frogs') animalType = 'frog';
      else if (randomPopulation === 'dogs') animalType = 'dog';
      else if (randomPopulation === 'cats') animalType = 'cat';
      
      const selectedAnimals = animals.filter(animal => animal.type === animalType).map(animal => animal.mesh);
      highlightedElements.value = selectedAnimals;
      
      // Türkçe popülasyon adını belirle
      let turkishType = "Hayvan";
      if (animalType === 'bird') turkishType = "Kuş";
      else if (animalType === 'rabbit') turkishType = "Tavşan";
      else if (animalType === 'butterfly') turkishType = "Kelebek";
      else if (animalType === 'frog') turkishType = "Kurbağa";
      else if (animalType === 'dog') turkishType = "Köpek";
      else if (animalType === 'cat') turkishType = "Kedi";
      
      highlightElements(selectedAnimals);
    }
  } 
  else if (selectedConcept.value === 'Habitat' || selectedConcept.value === 'Ekosistem') {
    // Habitat ve ekosistem için görsel bir vurgulama yapmıyoruz, sadece bilgi gösteriyoruz
    // Bu kısma ileride özel vurgulamalar eklenebilir
  }
};

// Elemanları vurgulama
const highlightElements = (elements) => {
  if (!elements || elements.length === 0) return;
  
  // Vurgulanmayan elemanların opaklığını azalt
  dimAllElements();
  
  // Vurgulanan elemanların opaklığını normal düzeye getir ve parlama efekti ekle
  elements.forEach(element => {
    // Element bir grup (Object3D) olabilir veya doğrudan bir mesh olabilir
    const traverseFunc = (obj) => {
      if (obj.isMesh && obj.material) {
        // Opaklığı normal düzeye getir
        if (obj.material.transparent) {
          obj.material.opacity = obj.userData.originalOpacity || 1.0;
        }
        
        // Vurgulanan elemanları hafifçe parlat
        obj.material.emissive = new THREE.Color(0x555555);
        
        // Ölçeği hafifçe büyüt
        if (!obj.userData.originalScale) {
          obj.userData.originalScale = {
            x: obj.scale.x,
            y: obj.scale.y,
            z: obj.scale.z
          };
        }
        obj.scale.set(
          obj.userData.originalScale.x * 1.2,
          obj.userData.originalScale.y * 1.2,
          obj.userData.originalScale.z * 1.2
        );
      }
    };
    
    if (element.traverse) {
      element.traverse(traverseFunc);
    } else if (element.isMesh) {
      traverseFunc(element);
    }
  });
};

// Tüm elemanların opaklığını azaltma
const dimAllElements = () => {
  // Tüm nesnelerin orijinal opaklık değerlerini kaydet ve opaklığı azalt
  scene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      // Orijinal opaklık değerini kaydet
      if (obj.material.transparent && !obj.userData.originalOpacity) {
        obj.userData.originalOpacity = obj.material.opacity;
      }
      
      // Orijinal ölçeği kaydet
      if (!obj.userData.originalScale) {
        obj.userData.originalScale = {
          x: obj.scale.x,
          y: obj.scale.y,
          z: obj.scale.z
        };
      }
      
      // Opaklığı azalt
      if (obj.material.transparent) {
        obj.material.opacity = obj.userData.originalOpacity * 0.3;
      }
      
      // Parlama efektini kaldır
      obj.material.emissive = new THREE.Color(0x000000);
    }
  });
};

// Vurgulamaları temizleme
const clearHighlights = () => {
  // Önceki vurgulamaları temizle
  highlightedElements.value = [];
  
  // Tüm nesnelerin orijinal değerlerini geri yükle
  scene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      // Orijinal opaklığı geri yükle
      if (obj.material.transparent && obj.userData.originalOpacity) {
        obj.material.opacity = obj.userData.originalOpacity;
      }
      
      // Orijinal ölçeği geri yükle
      if (obj.userData.originalScale) {
        obj.scale.set(
          obj.userData.originalScale.x,
          obj.userData.originalScale.y,
          obj.userData.originalScale.z
        );
      }
      
      // Parlama efektini kaldır
      obj.material.emissive = new THREE.Color(0x000000);
    }
  });
};

// Kavram seçimini temizleme
const clearConceptSelection = () => {
  selectedConcept.value = '';
  conceptInfo.value = '';
  clearHighlights();
};

// Sayfa yüklendiğinde
onMounted(() => {
  initThreeJs();
  startAnimation();
});

// Sayfa kapanmadan önce
onBeforeUnmount(() => {
  stopAnimation();
  
  // Event listener'ları temizle
  window.removeEventListener('resize', onWindowResize);
  
  // Three.js elemanlarını temizle
  if (renderer && simulationContainer.value) {
    simulationContainer.value.removeChild(renderer.domElement);
  }
  
  // Belleği temizle
  if (scene) {
    scene.clear();
  }
});
</script>
  
 
 