<template>
  <div class="relative h-screen w-full overflow-hidden">
    <!-- Simülasyon Alanı -->
    <div id="simulation-container" ref="simulationContainer" class="w-full h-full"></div>
    
    <!-- Dinamik Bilgi Paneli -->
    <div class="absolute md:top-4 left-4 bottom-1/4 md:bottom-auto  bg-gray-800 bg-opacity-80 text-white p-3 rounded-lg max-w-xs">
      <!-- Maddenin halini büyük ve renkli olarak göster -->
      <div class="mb-2 font-bold">
        <span 
          v-if="temperature < 0" 
          class="text-xs md:text-lg text-blue-300"
        >KATI (KAR)</span>
        <span 
          v-else-if="temperature <= 15" 
          class="text-xs md:text-lg text-blue-500"
        >SIVI (YAĞMUR)</span>
        <span 
          v-else 
          class="text-xs md:text-lg text-yellow-400"
        >GAZ (BUHAR)</span>
      </div>
      <div class="text-sm">
        <p>Sıcaklık: {{ temperature }}°C</p>
        <p>Simülasyon Durumu: {{ isAnimating ? 'Çalışıyor' : 'Durduruldu' }}</p>
      </div>
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
    <div v-if="isMobileSettingsOpen" class="md:hidden  inset-0 bg-black bg-opacity-50 z-50 fixed top-0 left-0 w-full h-full items-center justify-center" @click.self="toggleSettings">
      <div class="bg-gray-800  p-6 w-full h-screen overflow-y-auto">
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

// Ref'ler ve State Tanımlamaları
const simulationContainer = ref(null);
const temperature = ref(20); // Başlangıç sıcaklığı (°C)
const defaultTemperature = 20;
const animationSpeed = ref(1); // Animasyon hızı
const defaultAnimationSpeed = 1;
const isAnimating = ref(true);
const isMobileSettingsOpen = ref(false);
const backgroundColor = ref('#dbeafe'); // Varsayılan arkaplan rengi

// Ayarların değiştirilip değiştirilmediğini kontrol eden hesaplanmış özellik
const isSettingsChanged = computed(() => {
  return temperature.value !== defaultTemperature || 
         animationSpeed.value !== defaultAnimationSpeed;
});

// Three.js Değişkenleri
let scene, camera, renderer, controls;
let cloud, puddle, ground, sun;
let clouds = [];  // Birden fazla bulut için dizi
let mountains = [], trees = [], animals = [];
let particles = [], raindrops = [], snowflakes = [];
let puddles = []; // Su birikintileri için dizi
let snowCovers = []; // Kar örtüleri için dizi
let animationId = null;
let clock = new THREE.Clock();

// Maksimum birikinti sayısı limitleri
const MAX_PUDDLES = 15; // Maksimum su birikintisi sayısı
const MAX_SNOW_COVERS = 30; // Maksimum kar örtüsü sayısı

// Ayarları sıfırlama fonksiyonu
const resetSettings = () => {
  temperature.value = defaultTemperature;
  animationSpeed.value = defaultAnimationSpeed;
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
    updateWallColors(color);
  }
};

// Duvar renklerini güncelleme
const updateWallColors = (color) => {
  if (!walls.length) return;
  
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: color, 
    side: THREE.DoubleSide 
  });
  
  walls.forEach(wall => {
    wall.material = wallMaterial;
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
  for (let i = 0; i < 30; i++) {
    const treeGroup = new THREE.Group();
    
    // Ağaç gövdesi
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,  // Kahverengi
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    treeGroup.add(trunk);
    
    // Ağaç yaprakları
    const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F4F,  // Koyu yeşil
      roughness: 0.8
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 3;
    treeGroup.add(leaves);
    
    // Ağacı rastgele yerleştir
    const radius = Math.random() * 25 + 10;
    const angle = Math.random() * Math.PI * 2;
    treeGroup.position.set(
      Math.cos(angle) * radius,
      -1,
      Math.sin(angle) * radius
    );
    
    // Ağacı rastgele boyutlandır
    const scale = 0.8 + Math.random() * 0.4;
    treeGroup.scale.set(scale, scale, scale);
    
    scene.add(treeGroup);
    trees.push(treeGroup);
  }
};

// Hayvanlar oluşturma
const createAnimals = () => {
  // Kuşlar
  for (let i = 0; i < 5; i++) {
    const birdGroup = new THREE.Group();
    
    // Kuş gövdesi
    const bodyGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A5568  // Gri
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(body);
    
    // Kanatlar
    const wingGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A5568
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.rotation.z = Math.PI / 2;
    leftWing.position.set(-0.2, 0, 0);
    birdGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.rotation.z = -Math.PI / 2;
    rightWing.position.set(0.2, 0, 0);
    birdGroup.add(rightWing);
    
    // Kuşu rastgele yerleştir
    birdGroup.position.set(
      (Math.random() - 0.5) * 30,
      5 + Math.random() * 5,
      (Math.random() - 0.5) * 30
    );
    
    scene.add(birdGroup);
    animals.push({
      mesh: birdGroup,
      type: 'bird',
      initialY: birdGroup.position.y,
      phase: Math.random() * Math.PI * 2
    });
  }
  
  // Tavşanlar
  for (let i = 0; i < 3; i++) {
    const rabbitGroup = new THREE.Group();
    
    // Gövde
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xA8A29E  // Açık gri
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    rabbitGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0.25, 0.1, 0);
    rabbitGroup.add(head);
    
    // Kulaklar
    const earGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    const ear1 = new THREE.Mesh(earGeometry, bodyMaterial);
    ear1.position.set(0.25, 0.3, 0.1);
    ear1.rotation.x = -Math.PI / 6;
    rabbitGroup.add(ear1);
    
    const ear2 = new THREE.Mesh(earGeometry, bodyMaterial);
    ear2.position.set(0.25, 0.3, -0.1);
    ear2.rotation.x = Math.PI / 6;
    rabbitGroup.add(ear2);
    
    // Tavşanı rastgele yerleştir
    rabbitGroup.position.set(
      (Math.random() - 0.5) * 20,
      -1.5,
      (Math.random() - 0.5) * 20
    );
    
    scene.add(rabbitGroup);
    animals.push({
      mesh: rabbitGroup,
      type: 'rabbit',
      initialX: rabbitGroup.position.x,
      phase: Math.random() * Math.PI * 2
    });
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
    const cloudGroup = new THREE.Group();
    
    // Bulut parçaları
    const sphereGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.9
    });
    
    // Ana kısım
    const mainSphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
    cloudGroup.add(mainSphere);
    
    // Etrafına küçük küreler ekleyerek bulut görünümü oluşturma
    const positions = [
      { x: 2, y: 0.3, z: 0.5, scale: 0.9 },
      { x: -2, y: 0, z: 0.5, scale: 0.8 },
      { x: 0, y: 1, z: 1, scale: 0.9 },
      { x: 1, y: -0.6, z: 1, scale: 0.7 },
      { x: -1.5, y: -0.3, z: -0.5, scale: 0.8 }
    ];
    
    positions.forEach(pos => {
      const cloudPiece = new THREE.Mesh(sphereGeometry, cloudMaterial);
      cloudPiece.position.set(pos.x, pos.y, pos.z);
      cloudPiece.scale.setScalar(pos.scale);
      cloudGroup.add(cloudPiece);
    });
    
    // Bulutları daha fazla dağıt (sabit pozisyonlarda)
    // Çember yerine tüm alanı kaplasınlar
    const angle = (i / count) * Math.PI * 2;
    const radius = 20; // Yarıçapı arttır
    
    // Bulutları daha dengeli dağıt
    if (count <= 4) {
      // Az sayıda bulut varsa çemberde düzenli dağıt
      cloudGroup.position.set(
        Math.cos(angle) * radius,
        10,
        Math.sin(angle) * radius
      );
    } else {
      // Çok bulut varsa alan içinde rastgele dağıt
      cloudGroup.position.set(
        (Math.random() * 2 - 1) * radius,
        10,
        (Math.random() * 2 - 1) * radius
      );
    }
    
    clouds.push(cloudGroup);
    scene.add(cloudGroup);
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
      
      // Kanatları çırpma animasyonu
      const wings = animal.mesh.children.slice(1);
      wings.forEach(wing => {
        if (wing.position.x < 0) {
          wing.rotation.z = Math.PI / 2 + Math.sin(animal.phase * 10) * 0.5;
        } else {
          wing.rotation.z = -Math.PI / 2 - Math.sin(animal.phase * 10) * 0.5;
        }
      });
    }
    else if (animal.type === 'rabbit') {
      // Tavşanlar sağa sola zıplasın
      animal.phase += delta;
      animal.mesh.position.x = animal.initialX + Math.sin(animal.phase) * 2;
      animal.mesh.position.y = -1.5 + Math.abs(Math.sin(animal.phase * 2)) * 0.3;
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

// Sıcaklık değişimini izle
watch(temperature, () => {
  updateSimulation();
});

// Arkaplan rengi değişimini izle
watch(backgroundColor, (newColor) => {
  if (scene) {
    scene.background = new THREE.Color(newColor);
    updateWallColors(newColor);
  }
});

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
  
 
 