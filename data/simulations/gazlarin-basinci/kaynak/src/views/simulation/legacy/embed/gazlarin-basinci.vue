<template>
  <div class="relative flex flex-col md:flex-row bg-gray-900 h-screen w-full overflow-hidden">
    <!-- Mobil Görünüm için Menü Butonu -->
    <button 
      @click="settingsPanelOpen = !settingsPanelOpen" 
      class="md:hidden absolute top-4 left-4 z-10 p-2 bg-gray-800 rounded-md text-white shadow-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Simülasyon Başlat/Durdur Butonu (Üst Orta) -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <button 
        @click="toggleSimulation" 
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors shadow-lg control-button-mobile"
        :class="isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
      >
        {{ isRunning ? 'Durdur' : 'Başlat' }}
      </button>
    </div>

    <div class="absolute top-4 right-4 z-10 text-white bg-gray-800 rounded-md p-2 text-sm mb-2 flex justify-between items-center lg:hidden">
        <span>Basınç:</span>
        <span class="font-medium">{{ pressure.toFixed(1) }} Pa</span>
      </div>
    
    <!-- Simülasyon Canvas (Ana Alan) -->
    <div ref="canvasContainer" class="relative flex-grow w-full h-full">
      <!-- Canvas Three.js için buraya monte edilecek -->
      
      <!-- İzlenen molekül bilgisi (İzleme modu açıkken görünür) -->
      <div v-if="trackingEnabled" class="absolute bottom-2 left-2 bg-gray-800 bg-opacity-75 text-white p-2 rounded text-xs">
        İzlenen Molekül #{{ trackedParticleIndex + 1 }}
      </div>
    </div>
    
    <!-- Simülasyon Kontrol Paneli (PC'de Sağda, Mobilde Modal) -->
    <div 
      :class="[
        'bg-gray-900 text-white p-4 overflow-y-auto border-l  border-gray-800 transition-all duration-300 ease-in-out',
        'md:w-1/4 md:min-w-[250px] h-full md:static',
        settingsPanelOpen ? 'fixed inset-0 z-20 settings-panel-mobile' : 'fixed -right-full top-0 bottom-0 w-3/4 z-20 md:right-0'
      ]"
    >
      <!-- Mobil Görünüm için Kapatma Butonu -->
      <button 
        @click="settingsPanelOpen = false" 
        class="md:hidden absolute top-4 right-4  hover:text-white text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <h1 class="text-lg font-medium mb-4 text-center">Gaz Basıncı Simülasyonu</h1>
      
      <!-- Basınç Göstergesi -->
      <div class="bg-gray-800 rounded-md px-4 py-3 text-sm mb-4 flex justify-between items-center">
        <span>Basınç:</span>
        <span class="font-medium">{{ pressure.toFixed(1) }} Pa</span>
      </div>
      
      <!-- Molekül İzleme Bilgileri (İzleme modu açıkken görünür) -->
      <div v-if="trackingEnabled && particleData" class="bg-indigo-900 rounded-md p-4 mb-4 text-sm">
        <div class="font-medium mb-2 text-center">Molekül Verileri</div>
        <div class="flex justify-between mb-1">
          <span>Hız:</span>
          <span>{{ particleData.velocity.toFixed(2) }} m/s</span>
        </div>
        <div class="flex justify-between mb-1">
          <span>Konum:</span>
          <span>X: {{ particleData.position.x.toFixed(1) }}, Y: {{ particleData.position.y.toFixed(1) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Kinetik Enerji:</span>
          <span>{{ particleData.energy.toFixed(2) }} J</span>
        </div>
      </div>
      
      <div class="space-y-4">
        <!-- Hacim Kontrolü -->
        <div class="bg-gray-800 p-4 rounded-md">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-medium">Hacim</label>
            <span class="text-sm">{{ containerScale }}%</span>
          </div>
          <input 
            type="range" 
            min="50" 
            max="100" 
            v-model="containerScale" 
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Sıcaklık Kontrolü -->
        <div class="bg-gray-800 p-4 rounded-md">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-medium">Sıcaklık</label>
            <span class="text-sm">{{ temperature * 10 }}°C</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            v-model="temperature" 
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Molekül Sayısı Kontrolü -->
        <div class="bg-gray-800 p-4 rounded-md">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-medium">Molekül Sayısı</label>
            <span class="text-sm">{{ particleCount }}</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="100" 
            v-model="particleCount" 
            class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Arka Plan Rengi -->
        <div class="bg-gray-800 p-4 rounded-md">
          <div class="text-sm font-medium mb-2">Arka Plan Rengi</div>
          <div class="grid grid-cols-6 gap-2">
            <button 
              v-for="(color, index) in backgroundColors" 
              :key="index" 
              @click="changeBackgroundColor(color.value)" 
              class="w-full h-8 rounded-md transition-transform hover:scale-110 color-button"
              :style="{ backgroundColor: color.hex }"
              :title="color.name"
            ></button>
          </div>
        </div>
        
        <!-- Kamera Görünümleri -->
        <div class="bg-gray-800 p-4 rounded-md">
          <div class="text-sm font-medium mb-2">Kamera Görünümü</div>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="setCameraView('front')" 
              class="py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors"
            >
              Önden Görünüm
            </button>
            <button 
              @click="setCameraView('top')" 
              class="py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors"
            >
              Üstten Görünüm
            </button>
            <button 
              @click="setCameraView('side')" 
              class="py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors"
            >
              Yandan Görünüm
            </button>
            <button 
              @click="setCameraView('isometric')" 
              class="py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors"
            >
              İzometrik Görünüm
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex flex-col space-y-2 mt-4">
        <button 
          @click="toggleParticleTracking" 
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="trackingEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
        >
          {{ trackingEnabled ? 'İzlemeyi Kapat' : 'Molekül İzle' }}
        </button>
        <button 
          @click="resetSimulation" 
          class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': isDefaultSettings }"
          :disabled="isDefaultSettings"
        >
          Simülasyonu Sıfırla
        </button>
      </div>
      
      <!-- FPS Göstergesi -->
      <div class="mt-4 text-xs text-gray-400 text-right">
        FPS: {{ fps }}
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';
import * as CANNON from 'cannon-es';

// Simülasyon değişkenleri
const canvasContainer = ref(null);
const containerScale = ref(75); // Konteyner ölçeği (50-100 arası)
const temperature = ref(5);    // Sıcaklık (1-10 arası)
const particleCount = ref(50); // Molekül sayısı (10-100 arası)
const fps = ref(0);            // FPS sayacı
const pressure = ref(0);       // Basınç değeri
const trackingEnabled = ref(false); // Molekül izleme modu
const trackedParticleIndex = ref(-1); // İzlenen molekül indeksi
const isRunning = ref(true);   // Simülasyon çalışıyor mu?
const particleData = ref(null); // İzlenen molekül verileri
const settingsPanelOpen = ref(false); // Mobil ayarlar paneli açık mı?
const currentBackgroundColor = ref(0xd1fae5); // Mevcut arka plan rengi

// Arka plan renk seçenekleri
const backgroundColors = [
  { name: 'Koyu Gri', hex: '#111827', value: 0x111827 }, // gray-900
  { name: 'Siyah', hex: '#000000', value: 0x000000 },
  { name: 'Koyu Mavi', hex: '#1e3a8a', value: 0x1e3a8a }, // blue-900
  { name: 'Koyu Yeşil', hex: '#064e3b', value: 0x064e3b }, // green-900
  { name: 'Koyu Kırmızı', hex: '#7f1d1d', value: 0x7f1d1d }, // red-900
  { name: 'Koyu Mor', hex: '#4c1d95', value: 0x4c1d95 }, // purple-900
  { name: 'Açık Gri', hex: '#f3f4f6', value: 0xf3f4f6 }, // gray-100
  { name: 'Açık Mavi', hex: '#dbeafe', value: 0xdbeafe }, // blue-100
  { name: 'Açık Yeşil', hex: '#d1fae5', value: 0xd1fae5 }, // green-100
  { name: 'Açık Kırmızı', hex: '#fee2e2', value: 0xfee2e2 }, // red-100
  { name: 'Açık Mor', hex: '#ede9fe', value: 0xede9fe }, // purple-100
  { name: 'Bej', hex: '#f5f5dc', value: 0xf5f5dc }
];

// Varsayılan ayarlarda mı kontrol et
const isDefaultSettings = computed(() => {
  return containerScale.value === 75 && 
         temperature.value === 5 && 
         particleCount.value === 50 && 
         currentBackgroundColor.value === 0xd1fae5;
});

// Three.js değişkenleri
let scene, camera, renderer, controls;
let container, particles = [];
let world, physicsBodies = [];
let walls = [];
let lastTime = 0;
let frameCounter = 0;
let lastFpsUpdate = 0;
let collisionCount = 0;
let lastPressureCalculation = 0;
let animationFrameId = null;
let wallMaterial; // Duvar malzemesi referansı

// Başlangıç fonksiyonu
onMounted(async () => {
  // DOM'un tamamen yüklenmesini bekle
  await nextTick();
  
  // Simülasyonu başlat
  setTimeout(() => {
    if (canvasContainer.value) {
      initThreeJS();
      initPhysics();
      createContainer();
      createParticles();
      animate();
      
      // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
      window.addEventListener('resize', onWindowResize);
      
      // İlk boyutlandırmayı yap (bazı tarayıcılarda gerekli)
      onWindowResize();
    }
  }, 100); // Kısa bir gecikme ekleyerek DOM'un tamamen hazır olmasını sağla
});

// Temizleme fonksiyonu
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  
  // Animasyon döngüsünü durdur
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Renderer'ı temizle
  if (renderer) {
    renderer.dispose();
  }
  
  // Parçacıkları temizle
  particles.forEach(p => {
    if (p.geometry) p.geometry.dispose();
    if (p.material) p.material.dispose();
    scene.remove(p);
  });
  
  // Fizik dünyasını temizle
  physicsBodies.forEach(body => {
    if (world) world.removeBody(body);
  });
});

// Three.js kurulumu
function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(currentBackgroundColor.value); // Varsayılan arka plan
  
  // Kamera ayarları
  const aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = 10;
  
  // Renderer ayarları
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performans için piksel oranını sınırla
  
  // Canvas'ı temizle ve yeniden ekle
  while (canvasContainer.value.firstChild) {
    canvasContainer.value.removeChild(canvasContainer.value.firstChild);
  }
  canvasContainer.value.appendChild(renderer.domElement);
  
  // Orbit kontrolleri
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

// CANNON.js fizik motoru kurulumu
function initPhysics() {
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0) // Yerçekimi sıfır (gaz molekülleri serbest hareket eder)
  });
  
  // Çarpışma algılama için event listener
  world.addEventListener('beginContact', (event) => {
    collisionCount++;
  });
}

// Konteyner oluşturma (gaz kabı)
function createContainer() {
  // Eski konteyneri temizle
  if (container) {
    scene.remove(container);
  }
  
  // Yeni konteyner boyutu
  const scale = containerScale.value / 100; // 0.5 - 1 arası değer
  const width = 8 * scale;
  const height = 8 * scale;
  const depth = 8 * scale;
  
  // Konteyner grubu
  container = new THREE.Group();
  
  // Duvar malzemesi - arka planla uyumlu yarı saydam cam görünümü
  wallMaterial = new THREE.MeshPhysicalMaterial({
    color: scene.background,  // Arka plan ile aynı renk
    transparent: true,
    opacity: 0,
    roughness: 0.1,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  
  // Konteyner duvarlarını oluştur ve fizik gövdelerini ekle
  walls = [];
  
  // Konteyner duvarları (kutu)
  const boxGeometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(boxGeometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x4b5563 }));
  container.add(line);
  
  // Fizik duvarları oluştur
  createWall(new CANNON.Vec3(width/2, 0, 0), new CANNON.Vec3(0.1, height, depth), new THREE.Vector3(width/2, 0, 0), new THREE.Vector3(0, Math.PI/2, 0), wallMaterial);  // Sağ duvar
  createWall(new CANNON.Vec3(-width/2, 0, 0), new CANNON.Vec3(0.1, height, depth), new THREE.Vector3(-width/2, 0, 0), new THREE.Vector3(0, Math.PI/2, 0), wallMaterial); // Sol duvar
  createWall(new CANNON.Vec3(0, height/2, 0), new CANNON.Vec3(width, 0.1, depth), new THREE.Vector3(0, height/2, 0), new THREE.Vector3(Math.PI/2, 0, 0), wallMaterial);  // Üst duvar
  createWall(new CANNON.Vec3(0, -height/2, 0), new CANNON.Vec3(width, 0.1, depth), new THREE.Vector3(0, -height/2, 0), new THREE.Vector3(Math.PI/2, 0, 0), wallMaterial); // Alt duvar
  createWall(new CANNON.Vec3(0, 0, depth/2), new CANNON.Vec3(width, height, 0.1), new THREE.Vector3(0, 0, depth/2), new THREE.Vector3(0, 0, 0), wallMaterial);           // Arka duvar
  createWall(new CANNON.Vec3(0, 0, -depth/2), new CANNON.Vec3(width, height, 0.1), new THREE.Vector3(0, 0, -depth/2), new THREE.Vector3(0, 0, 0), wallMaterial);         // Ön duvar
  
  scene.add(container);
}

// Duvar oluşturma yardımcı fonksiyonu
function createWall(position, size, meshPosition, meshRotation, material) {
  // Fizik bileşeni
  const wallBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(size),
    position: position,
    material: new CANNON.Material({ restitution: 0.9 }) // Yüksek esneklik
  });
  world.addBody(wallBody);
  walls.push(wallBody);
  
  // Görsel bileşen
  const wallGeometry = new THREE.PlaneGeometry(size.y * 2, size.z * 2);
  const wallMesh = new THREE.Mesh(wallGeometry, material);
  wallMesh.position.copy(meshPosition);
  wallMesh.rotation.setFromVector3(meshRotation);
  container.add(wallMesh);
}

// Molekülleri oluştur
function createParticles() {
  // Eski parçacıkları temizle
  particles.forEach(p => {
    scene.remove(p);
  });
  
  physicsBodies.forEach(body => {
    world.removeBody(body);
  });
  
  particles = [];
  physicsBodies = [];
  
  // Konteyner boyutu
  const scale = containerScale.value / 100;
  const width = 7 * scale; // Biraz daha küçük boyut kullanıyoruz ki duvarlardan taşma olmasın
  const height = 7 * scale;
  const depth = 7 * scale;
  
  // Parçacık sayısı
  const count = parseInt(particleCount.value);
  
  // Moleküllerin hızını sıcaklığa göre ayarla (1-10 arası)
  const speedFactor = temperature.value * 0.5;
  
  // Molekülleri oluştur
  for (let i = 0; i < count; i++) {
    // Rastgele konum
    const x = (Math.random() - 0.5) * width;
    const y = (Math.random() - 0.5) * height;
    const z = (Math.random() - 0.5) * depth;
    
    // Rastgele hız
    const vx = (Math.random() - 0.5) * speedFactor;
    const vy = (Math.random() - 0.5) * speedFactor;
    const vz = (Math.random() - 0.5) * speedFactor;
    
    // Molekül çapı
    const radius = 0.2;
    
    // Molekül 3D modeli
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    
    // Rastgele renk (mavi tonları ağırlıklı)
    const isTracked = i === trackedParticleIndex.value;
    const color = isTracked ? 0xff3030 : getParticleColor(i);
    
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    scene.add(sphere);
    particles.push(sphere);
    
    // Fizik gövdesi
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(radius),
      position: new CANNON.Vec3(x, y, z),
      velocity: new CANNON.Vec3(vx, vy, vz),
      material: new CANNON.Material({ restitution: 0.9 }) // Yüksek esneklik
    });
    
    world.addBody(body);
    physicsBodies.push(body);
  }
}

// Molekül rengini belirle
function getParticleColor(index) {
  // Moleküllere farklı renkler ata (çoğunlukla mavi tonları)
  const colors = [
    0x3b82f6, // blue-500
    0x2563eb, // blue-600
    0x1d4ed8, // blue-700
    0x60a5fa, // blue-400
    0x93c5fd, // blue-300
    0x38bdf8, // sky-400
    0x7dd3fc, // sky-300
  ];
  
  return colors[index % colors.length];
}

// Pencere boyutu değiştiğinde yeniden boyutlandır
function onWindowResize() {
  if (!canvasContainer.value || !camera || !renderer) return;
  
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  
  // Kamera ve renderer oranlarını güncelle
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Animasyon döngüsü
function animate(time) {
  animationFrameId = requestAnimationFrame(animate);
  
  if (!lastTime) {
    lastTime = time;
    return;
  }
  
  const deltaTime = (time - lastTime) / 1000; // saniye cinsinden delta zaman
  lastTime = time;
  
  // FPS hesaplama
  frameCounter++;
  if (time - lastFpsUpdate > 1000) { // her saniye
    fps.value = Math.round(frameCounter * 1000 / (time - lastFpsUpdate));
    frameCounter = 0;
    lastFpsUpdate = time;
  }
  
  // Eğer simülasyon çalışıyorsa fizik ve parçacıkları güncelle
  if (isRunning.value) {
    // Fizik dünyasını güncelle
    world.step(1/60);
    
    // Parçacıkları güncelle
    for (let i = 0; i < particles.length; i++) {
      const body = physicsBodies[i];
      const mesh = particles[i];
      
      // Fizik motoru pozisyonunu 3D modeline aktar
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    }
    
    // İzlenen molekülü takip et
    if (trackingEnabled.value && trackedParticleIndex.value >= 0 && particles[trackedParticleIndex.value]) {
      const trackedParticle = particles[trackedParticleIndex.value];
      const trackedBody = physicsBodies[trackedParticleIndex.value];
      const target = trackedParticle.position.clone();
      
      // Kamerayı molekülün arkasında tut (önden bakıyormuş gibi)
      controls.target.copy(target);
      
      // Takip eden kamera konumu yumuşak geçiş ile güncelle
      camera.position.lerp(
        new THREE.Vector3(
          target.x + 1,
          target.y + 1,
          target.z + 3
        ), 
        0.05
      );
      
      // Molekül verilerini güncelle
      const velocity = Math.sqrt(
        trackedBody.velocity.x * trackedBody.velocity.x +
        trackedBody.velocity.y * trackedBody.velocity.y +
        trackedBody.velocity.z * trackedBody.velocity.z
      );
      
      // Kinetik enerji = 1/2 * m * v^2 (m = kütle = 1)
      const energy = 0.5 * trackedBody.mass * velocity * velocity;
      
      particleData.value = {
        velocity: velocity,
        position: {
          x: trackedBody.position.x,
          y: trackedBody.position.y,
          z: trackedBody.position.z
        },
        energy: energy
      };
    }
    
    // Basınç hesaplama (belirli aralıklarla)
    if (time - lastPressureCalculation > 500) { // her yarım saniyede
      calculatePressure();
      lastPressureCalculation = time;
    }
  }
  
  // TWEEN animasyonları güncelle
  TWEEN.update();
  
  // Orbit kontrolleri güncelle
  controls.update();
  
  // Render
  renderer.render(scene, camera);
}

// Simülasyonu başlat/durdur
function toggleSimulation() {
  isRunning.value = !isRunning.value;
  
  // Eğer simülasyon durdurulduysa basınç değerini sıfırla
  if (!isRunning.value) {
    pressure.value = 0;
  }
}

// Basınç hesaplama
function calculatePressure() {
  // Basıncı çarpışma sayısı, hacim ve sıcaklık kullanarak hesapla (ideal gaz denklemi)
  // P ∝ NkT/V formülü (N: molekül sayısı, k: Boltzmann sabiti, T: sıcaklık, V: hacim)
  
  const volumeFactor = Math.pow(containerScale.value / 100, 3); // Hacim faktörü (0.125 - 1 arası)
  const particleFactor = particleCount.value / 50; // Molekül sayısı faktörü
  const temperatureFactor = temperature.value / 5; // Sıcaklık faktörü
  
  // Basınç formülü: Çarpışma sayısı × Molekül sayısı × Sıcaklık / Hacim
  const pressureValue = (collisionCount * particleFactor * temperatureFactor) / volumeFactor;
  
  // Basınç değerini düzgün ölçeklendirme (0-100 arası)
  pressure.value = Math.min(100, pressureValue * 0.5);
  
  // Çarpışma sayacını sıfırla
  collisionCount = 0;
}

// Molekül izleme modunu aç/kapat
function toggleParticleTracking() {
  trackingEnabled.value = !trackingEnabled.value;
  
  if (trackingEnabled.value) {
    // Rastgele bir molekül seç
    trackedParticleIndex.value = Math.floor(Math.random() * particles.length);
    
    // İzlenen molekülü daha belirgin hale getir
    if (trackedParticleIndex.value >= 0 && particles[trackedParticleIndex.value]) {
      const trackedParticle = particles[trackedParticleIndex.value];
      
      // Kamerayı moleküle daha yakın konumlandır
      const target = trackedParticle.position.clone();
      camera.position.set(target.x + 1, target.y + 1, target.z + 3);
      controls.target.copy(target);
      
      // İzlenen molekülü renklendir ve büyüt
      trackedParticle.material.color.set(0xff0000);
      trackedParticle.material.emissive = new THREE.Color(0xff0000);
      trackedParticle.material.emissiveIntensity = 0.5;
      trackedParticle.scale.set(1.3, 1.3, 1.3);
      
      // Molekül verilerini başlat
      const trackedBody = physicsBodies[trackedParticleIndex.value];
      const velocity = Math.sqrt(
        trackedBody.velocity.x * trackedBody.velocity.x +
        trackedBody.velocity.y * trackedBody.velocity.y +
        trackedBody.velocity.z * trackedBody.velocity.z
      );
      
      particleData.value = {
        velocity: velocity,
        position: {
          x: trackedBody.position.x,
          y: trackedBody.position.y,
          z: trackedBody.position.z
        },
        energy: 0.5 * trackedBody.mass * velocity * velocity
      };
      
      // Kamera kontrollerini sınırla
      controls.minDistance = 2;
      controls.maxDistance = 5;
      controls.enablePan = false;
    }
  } else {
    // İzleme modunu kapat
    
    // İzlenen molekülü normal boyut ve renge döndür
    if (trackedParticleIndex.value >= 0 && particles[trackedParticleIndex.value]) {
      const trackedParticle = particles[trackedParticleIndex.value];
      trackedParticle.material.color.set(getParticleColor(trackedParticleIndex.value));
      trackedParticle.material.emissive = new THREE.Color(0x000000);
      trackedParticle.material.emissiveIntensity = 0;
      trackedParticle.scale.set(1, 1, 1);
    }
    
    trackedParticleIndex.value = -1;
    particleData.value = null;
    
    // Kamera kontrollerini normale döndür
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.enablePan = true;
    
    // Kamerayı normal görünüme getir
    new TWEEN.Tween(camera.position)
      .to({ x: 0, y: 0, z: 10 }, 1000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
      
    new TWEEN.Tween(controls.target)
      .to({ x: 0, y: 0, z: 0 }, 1000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
}

// Simülasyonu sıfırla
function resetSimulation() {
  containerScale.value = 75;
  temperature.value = 5;
  particleCount.value = 50;
  trackingEnabled.value = false;
  trackedParticleIndex.value = -1;
  
  // Arka plan rengini sıfırla
  changeBackgroundColor(0x111827);
  
  // Konteyner ve parçacıkları yeniden oluştur
  createContainer();
  createParticles();
  
  // Kamerayı sıfırla
  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: 0, z: 10 }, 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
    
  new TWEEN.Tween(controls.target)
    .to({ x: 0, y: 0, z: 0 }, 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
}

// Kontrolleri izle ve değişikliklere tepki ver
watch([containerScale], () => {
  createContainer();
});

watch([temperature, particleCount], () => {
  createParticles();
});

// Arka plan rengini değiştir
function changeBackgroundColor(value) {
  // Arka plan rengini güncelle
  currentBackgroundColor.value = value;
  scene.background = new THREE.Color(value);
  
  // Duvar rengini de arka planla uyumlu olacak şekilde güncelle
  if (wallMaterial) {
    wallMaterial.color = new THREE.Color(value);
    wallMaterial.needsUpdate = true;
  }
}

// Kamera görünümünü değiştir
function setCameraView(view) {
  // Kamera görünümünü değiştir
  switch (view) {
    case 'front':
      new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 0, z: 10 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      
      new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      break;
    case 'top':
      new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 10, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      
      new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      break;
    case 'side':
      new TWEEN.Tween(camera.position)
        .to({ x: 10, y: 0, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      
      new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      break;
    case 'isometric':
      new TWEEN.Tween(camera.position)
        .to({ x: 6, y: 6, z: 6 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      
      new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      break;
  }
}
</script>
  
<style scoped>
/* Simülasyonun ekranı kaplaması için stiller */
:deep(html), :deep(body) {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.h-screen {
  height: 100vh; /* Viewport yüksekliğinin tamamını kapla */
}

/* Canvas tam ekran olacak şekilde ayarlanır */
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Canvas elementinin tam boyutlu olmasını sağla */
canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

/* Slider özelleştirme */
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #4B5563;
  border-radius: 5px;
  background-image: linear-gradient(#3B82F6, #3B82F6);
  background-repeat: no-repeat;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3B82F6;
  cursor: pointer;
  box-shadow: 0 0 2px 0 #555;
  transition: background .3s ease-in-out;
}

input[type=range]::-webkit-slider-thumb:hover {
  background: #2563EB;
}

input[type=range]::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3B82F6;
  cursor: pointer;
  box-shadow: 0 0 2px 0 #555;
  transition: background .3s ease-in-out;
  border: none;
}

input[type=range]::-moz-range-thumb:hover {
  background: #2563EB;
}

/* Buton geçişleri */
button {
  transition: all 0.2s ease-in-out;
}

/* Ayarlar paneli geçişi */
.settings-panel-enter-active,
.settings-panel-leave-active {
  transition: transform 0.3s ease;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
  transform: translateX(100%);
}

/* Renk butonları için hover efekti */
.color-button {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

/* Mobil görünüm için düzenlemeler */
@media (max-width: 768px) {
  .h-screen {
    height: 100vh;
  }
  
  /* Mobil cihazlarda ayarlar paneli ve canvas dikey yerleşim */
  .flex-col.md\:flex-row {
    flex-direction: column;
  }
  
  /* Mobil ayarlar paneli */
  .settings-panel-mobile {
    width:100%;
    overflow-y: auto;

  }
  
  /* Başlat/Durdur butonu mobil için düzenleme */
  .control-button-mobile {
    padding: 8px 12px;
    font-size: 14px;
  }
}

/* Ayarlar paneli scroll bar özelleştirme */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1F2937;
}

::-webkit-scrollbar-thumb {
  background: #4B5563;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6B7280;
}
</style>
  
 
 