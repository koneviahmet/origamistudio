<template>
  <div class="relative w-full h-screen">
    <!-- 3D Simulation Canvas -->
    <div ref="canvasContainer" class="absolute inset-0 bg-black"></div>
    
    <!-- Info Panel (Top-Left) -->
    <div v-if="currentCelestialBody" class="absolute top-4 left-4 p-4 bg-black/70 text-white rounded-lg">
      <div v-if="currentCelestialBody !== 'space'">
        <p class="text-lg font-bold mb-2">{{ statusMessage }}</p>


        <p v-if="distanceFromEarth && journeyStatus === 'arrived'">🌍 Dünya'ya uzaklık: {{ distanceFromEarth }}</p>
        <p v-if="travelTime && journeyStatus === 'arrived'">⏳ Dünya'dan olan yolculuk süresi: {{ travelTime }}</p>
      </div>
      <div v-else>
        <p class="text-lg font-bold">{{ statusMessage }}</p>
      </div>
    </div>

    <!-- Controls (Center-Top) -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-4">
      <button 
        v-if="!simulationStarted" 
        @click="startSimulation" 
        class="md:px-6 md:py-3 p-2 -mr-32 md:mr-0 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
      >
        Başlat
      </button>
      <button 
        v-else-if="simulationPaused" 
        @click="resumeSimulation" 
        class="md:px-6 md:py-3 p-2 -mr-32 md:mr-0 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
      >
        Devam Et
      </button>
      <button 
        v-else 
        @click="pauseSimulation" 
        class="md:px-6 md:py-3 p-2 -mr-32 md:mr-0 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
      >
        Durdur
      </button>
    </div>

    <!-- Navigation Buttons (After Landing) -->
    <div v-if="showNavigationButtons" class="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-4">
      <button 
        v-if="currentCelestialBodyIndex < celestialBodies.length - 1" 
        @click="goToNextCelestialBody" 
        class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
      >
        🚀 Sıradaki Gök Cismini Keşfet
      </button>
      <button 
        @click="returnToEarth" 
        class="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors"
      >
        🔄 Dünya'ya Dön
      </button>
    </div>

    <!-- Completion Message (Final) -->
    <div v-if="reachedSun" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-yellow-500/80 text-white rounded-lg text-center">
      <h2 class="text-2xl font-bold mb-4">Güneş'e Ulaştınız!</h2>
      <p class="mb-4">Tebrikler! Uzay yolculuğunuzu tamamladınız.</p>
      <button 
        @click="returnToEarth" 
        class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
      >
        🔄 Dünya'ya Dön
      </button>
    </div>

    <!-- Settings Toggle (Mobile) -->
    <button 
      @click="toggleSettings" 
      class="absolute top-4 right-4 p-3 bg-gray-800 text-white rounded-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Settings Panel -->
    <div 
      :class="[
        'bg-gray-900 text-white p-6  overflow-y-auto transition-all duration-300',
        showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none',
        isMobile ? 'fixed inset-0 w-full h-full z-50' : 'absolute top-16 right-4 h-auto max-h-[calc(100vh*2/3)] w-80'
      ]"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Ayarlar</h3>
        <button @click="toggleSettings" class="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Animation Speed -->
      <div class="mb-6">
        <label class="block mb-2">Animasyon Hızı</label>
        <input 
          type="range" 
          min="0.5" 
          max="5" 
          step="0.5" 
          v-model="animationSpeed" 
          class="w-full"
        />
        <div class="flex justify-between text-xs">
          <span>Yavaş</span>
          <span>Hızlı</span>
        </div>
      </div>






      <!-- Reset Button -->
      <button 
        @click="resetSimulation" 
        class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Tüm Ayarları Sıfırla
      </button>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar
const canvasContainer = ref(null);
const showSettings = ref(false);
const isMobile = ref(false);
const animationSpeed = ref(1);
const backgroundColor = ref('#000000');
const simulationStarted = ref(false);
const simulationPaused = ref(false);
const currentCelestialBodyIndex = ref(-1);
const showNavigationButtons = ref(false);
const reachedSun = ref(false);
const distanceFromEarth = ref(null);
const travelTime = ref(null);
const journeyStatus = ref('waiting'); // 'waiting', 'traveling', 'arrived'
const followRocket = ref(false); // Kamera roketi takip etsin mi?

// Gök Cisimleri
const celestialBodies = [
  'earth',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'sun'
];

// Geçerli gök cismi
const currentCelestialBody = computed(() => {
  if (currentCelestialBodyIndex.value === -1) return null;
  if (currentCelestialBodyIndex.value === 0) return 'earth';
  if (currentCelestialBodyIndex.value > 0 && currentCelestialBodyIndex.value <= celestialBodies.length) {
    return celestialBodies[currentCelestialBodyIndex.value];
  }
  return 'space';
});

// Gök Cisimleri Bilgileri
const celestialBodiesInfo = {
  earth: {
    name: 'Dünya',
    distance: 0,
    travelTime: '0 saniye',
    color: 0x2233ff,
    size: 6,
    position: new THREE.Vector3(0, 0, 0)
  },
  moon: {
    name: 'Ay',
    distance: 384_400,
    travelTime: '3 gün',
    color: 0xbbbbbb,
    size: 1.6,
    position: new THREE.Vector3(20, 0, 0)
  },
  mercury: {
    name: 'Merkür',
    distance: 91_700_000,
    travelTime: '40 gün',
    color: 0xa9a9a9,
    size: 2.3,
    position: new THREE.Vector3(50, 0, 0)
  },
  venus: {
    name: 'Venüs',
    distance: 41_400_000,
    travelTime: '4 ay',
    color: 0xe39e1c,
    size: 5.8,
    position: new THREE.Vector3(80, 0, 0)
  },
  mars: {
    name: 'Mars',
    distance: 78_340_000,
    travelTime: '6-9 ay',
    color: 0xc1440e,
    size: 3.2,
    position: new THREE.Vector3(110, 0, 0)
  },
  jupiter: {
    name: 'Jüpiter',
    distance: 628_730_000,
    travelTime: '2-3 yıl',
    color: 0xd8ca9d,
    size: 30,
    position: new THREE.Vector3(160, 0, 0)
  },
  saturn: {
    name: 'Satürn',
    distance: 1_277_400_000,
    travelTime: '6-7 yıl',
    color: 0xead6b8,
    size: 25,
    position: new THREE.Vector3(220, 0, 0)
  },
  uranus: {
    name: 'Uranüs',
    distance: 2_719_100_000,
    travelTime: '8-10 yıl',
    color: 0xa4f1f2,
    size: 12,
    position: new THREE.Vector3(280, 0, 0)
  },
  neptune: {
    name: 'Neptün',
    distance: 4_347_400_000,
    travelTime: '10-12 yıl',
    color: 0x5b5ddf,
    size: 11,
    position: new THREE.Vector3(340, 0, 0)
  },
  sun: {
    name: 'Güneş',
    distance: 149_600_000,
    travelTime: '3-4 ay',
    color: 0xffff00,
    size: 50,
    position: new THREE.Vector3(420, 0, 0)
  }
};


// Arkaplan Renkleri
const backgroundColors = [
  { name: 'Siyah', value: '#000000' },
  { name: 'Koyu Gri', value: '#111827' },
  { name: 'Koyu Mavi', value: '#1e3a8a' },
  { name: 'Koyu Yeşil', value: '#064e3b' },
  { name: 'Koyu Kırmızı', value: '#7f1d1d' },
  { name: 'Koyu Mor', value: '#4c1d95' },
  { name: 'Açık Gri', value: '#f3f4f6' },
  { name: 'Açık Mavi', value: '#dbeafe' }
];

// Kamera Görünümleri
const cameraViews = [
  { name: 'Üstten Görünüm', position: { x: 0, y: 50, z: 0 }, lookAt: { x: 0, y: 0, z: 0 } },
  { name: 'Yandan Görünüm', position: { x: 50, y: 0, z: 0 }, lookAt: { x: 0, y: 0, z: 0 } },
  { name: 'Önden Görünüm', position: { x: 0, y: 0, z: 50 }, lookAt: { x: 0, y: 0, z: 0 } },
  { name: 'İzometrik Görünüm', position: { x: 40, y: 40, z: 40 }, lookAt: { x: 0, y: 0, z: 0 } }
];

// Three.js değişkenleri
let scene, camera, renderer, controls;
let rocket, earth, moon, currentPlanet;
let planets = {};
let stars = [];
let animationFrameId;
let animationState = {
  isMoving: false,
  startPosition: null,
  targetPosition: null,
  progress: 0,
  duration: 5000
};

// Sayfa yükleme
onMounted(() => {
  checkDevice();
  window.addEventListener('resize', handleResize);
  initThree();
  createScene();
  animate();
  currentCelestialBodyIndex.value = 0; // Dünya ile başla
});

// Sayfa kapanış
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  cancelAnimationFrame(animationFrameId);
  cleanupThree();
});

// Cihaz kontrolü
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768;
};

// Pencere boyutu değiştiğinde
const handleResize = () => {
  checkDevice();
  if (camera && renderer) {
    camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  }
};

// Three.js başlatma
const initThree = () => {
  // Sahne
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor.value);

  // Kamera
  camera = new THREE.PerspectiveCamera(
    75,
    canvasContainer.value.clientWidth / canvasContainer.value.clientHeight,
    0.1,
    2000 // Görüş mesafesini artırdım
  );
  camera.position.set(20, 20, 40);

  // Render
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasContainer.value.appendChild(renderer.domElement);

  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 1000; // Maksimum uzaklaşma mesafesini artırdım
};

// Sahneyi oluştur
const createScene = () => {
  // Işıklar
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  // Yıldızlar
  createStars();

  // Gök cisimlerini oluştur
  createCelestialBodies();

  // Roket
  createRocket();

  // Kamerayı başlangıç pozisyonuna ayarla
  resetCamera();
};

// Yıldızları oluştur
const createStars = () => {
  for (let i = 0; i < 2000; i++) { // Yıldız sayısını artırdım
    const geometry = new THREE.SphereGeometry(0.1, 4, 4); // Boyutunu artırdım
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(geometry, material);

    const x = (Math.random() - 0.5) * 1500; // Dağılımı artırdım
    const y = (Math.random() - 0.5) * 1500;
    const z = (Math.random() - 0.5) * 1500;
    
    star.position.set(x, y, z);
    stars.push(star);
    scene.add(star);
  }
};

// Gök cisimlerini oluştur
const createCelestialBodies = () => {
  Object.entries(celestialBodiesInfo).forEach(([name, info]) => {
    const geometry = new THREE.SphereGeometry(info.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: info.color });
    const planet = new THREE.Mesh(geometry, material);
    
    planet.position.copy(info.position);
    
    // Gezegenler için zemine yerleştirelim
    if (name !== 'earth') {
      planet.position.y = info.size;
    } else {
      planet.position.y = 0;
    }
    
    // Satürn için halka ekleyelim
    if (name === 'saturn') {
      // Satürn halkası
      const innerRadius = info.size * 1.2;
      const outerRadius = info.size * 2;
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xc2a278, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      planet.add(ring);
    }
    
    planets[name] = planet;
    
    // Sadece Earth'ü başlangıçta ekleyelim
    if (name === 'earth') {
      scene.add(planet);
      earth = planet;
      currentPlanet = planet;
    }
  });
};

// Roket oluştur
const createRocket = () => {
  // Roket gövdesi
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  
  // Roket burnunu ekle
  const noseGeometry = new THREE.ConeGeometry(0.3, 0.8, 16);
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.y = 1.1;
  
  // Kanadı oluştur
  const wingGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.3);
  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  
  // 4 Kanat ekle
  const wings = [];
  for (let i = 0; i < 4; i++) {
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = -0.4;
    wing.rotation.y = (Math.PI / 2) * i;
    wing.position.x = Math.cos((Math.PI / 2) * i) * 0.5;
    wing.position.z = Math.sin((Math.PI / 2) * i) * 0.5;
    wings.push(wing);
  }
  
  // Ana alev
  const flameGeometry = new THREE.ConeGeometry(0.5, 1.2, 16);
  const flameMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff6600,
    transparent: true,
    opacity: 0.8
  });
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.y = -1.3;
  flame.rotation.x = Math.PI; // Alevi ters çevir
  flame.visible = false; // Başlangıçta görünmez
  
  // İkincil alev (daha küçük, daha parlak)
  const flame2Geometry = new THREE.ConeGeometry(0.3, 0.8, 16);
  const flame2Material = new THREE.MeshBasicMaterial({ 
    color: 0xffcc00,
    transparent: true,
    opacity: 0.9
  });
  const flame2 = new THREE.Mesh(flame2Geometry, flame2Material);
  flame2.position.y = -1.15;
  flame2.rotation.x = Math.PI;
  flame2.visible = false;
  
  // Duman parçacıkları
  const smokeParticles = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const smokeSize = 0.2 + Math.random() * 0.4;
    const smokeGeometry = new THREE.SphereGeometry(smokeSize, 8, 8);
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.4
    });
    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.y = -1.5 - Math.random() * 2;
    smoke.position.x = (Math.random() - 0.5) * 1;
    smoke.position.z = (Math.random() - 0.5) * 1;
    smoke.userData = {
      velocityY: -0.05 - Math.random() * 0.05,
      velocityX: (Math.random() - 0.5) * 0.04,
      velocityZ: (Math.random() - 0.5) * 0.04,
      fadeRate: 0.01 + Math.random() * 0.02,
      initialOpacity: 0.4
    };
    smoke.visible = false;
    smokeParticles.add(smoke);
  }
  
  // Roket ışığı
  const rocketLight = new THREE.PointLight(0xff6600, 2, 10);
  rocketLight.position.y = -1;
  rocketLight.intensity = 0;
  
  // Roket grubunu oluştur
  rocket = new THREE.Group();
  rocket.add(body);
  rocket.add(nose);
  wings.forEach(wing => rocket.add(wing));
  rocket.add(flame);
  rocket.add(flame2);
  rocket.add(smokeParticles);
  rocket.add(rocketLight);
  
  // Roket referansını animasyon için sakla
  rocket.userData.flame = flame;
  rocket.userData.flame2 = flame2;
  rocket.userData.light = rocketLight;
  rocket.userData.smokeParticles = smokeParticles;
  rocket.userData.isLaunching = false;
  
  // Roketin pozisyonunu ayarla
  rocket.position.y = celestialBodiesInfo.earth.size + 4.2;
  rocket.rotation.x = -Math.PI * 2;
  
  scene.add(rocket);
};

// Animasyon döngüsü
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  if (!simulationPaused.value && animationState.isMoving) {
    // Alev animasyonu
    if (rocket.userData.flame) {
      rocket.userData.flame.visible = true;
      rocket.userData.flame.scale.x = 0.8 + Math.random() * 0.4;
      rocket.userData.flame.scale.z = 0.8 + Math.random() * 0.4;
      
      // İkincil alev
      if (rocket.userData.flame2) {
        rocket.userData.flame2.visible = true;
        rocket.userData.flame2.scale.x = 0.7 + Math.random() * 0.5;
        rocket.userData.flame2.scale.z = 0.7 + Math.random() * 0.5;
      }
      
      rocket.userData.light.intensity = 2 + Math.random();
      

    }
  } else {
    // Hareket etmiyorsa alevi kapat
    if (rocket.userData.flame) {
      rocket.userData.flame.visible = false;
      
      // İkincil alevi de kapat
      if (rocket.userData.flame2) {
        rocket.userData.flame2.visible = false;
      }
      
      rocket.userData.light.intensity = 0;
      rocket.userData.isLaunching = false;
      
      // Duman parçacıklarını da kapat
      const smokeParticles = rocket.userData.smokeParticles?.children || [];
      smokeParticles.forEach(smoke => {
        smoke.visible = false;
      });
    }
  }
  
  // Gezegenleri döndür
  if (!simulationPaused.value && simulationStarted.value) {
    Object.values(planets).forEach(planet => {
      if (planet) {
        planet.rotation.y += 0.01 * animationSpeed.value;
      }
    });
  }
  
  // Eğer "Roketi Takip Et" seçeneği etkinse ve roket hareket halindeyse
  if (followRocket.value && rocket && simulationStarted.value && !controls.enabled) {
    // Roketin arkasında ve üstünde bir pozisyon hesapla
    const rocketDir = new THREE.Vector3(0, 0, -1).applyQuaternion(rocket.quaternion);
    const cameraPos = rocket.position.clone()
      .add(rocketDir.multiplyScalar(-15)) // Roketin arkasında
      .add(new THREE.Vector3(0, 10, 0)); // Ve biraz üstünde
    
    // Kamerayı yavaşça yeni pozisyona taşı (yumuşak geçiş için)
    camera.position.lerp(cameraPos, 0.05);
    camera.lookAt(rocket.position);
  }
  
  controls.update();
  renderer.render(scene, camera);
};

// Simülasyonu başlat
const startSimulation = () => {
  simulationStarted.value = true;
  
  // Varsa mevcut gezegeni kaldır
  if (currentPlanet && currentPlanet !== earth) {
    scene.remove(currentPlanet);
  }
  
  // Başlangıç konumunu Earth olarak ayarla
  currentCelestialBodyIndex.value = 0;
  currentPlanet = planets.earth;
  
  // Roketi tazele - varsa kaldır, yoksa ekle
  if (scene.getObjectById(rocket.id)) {
    scene.remove(rocket);
  }
  
  // Roketin durumunu sıfırla
  rocket.position.y = celestialBodiesInfo.earth.size; // Dünya'nın yüzeyinde başla
  rocket.position.x = 0;
  rocket.position.z = 0;
  rocket.rotation.x = -Math.PI * 2;
  rocket.rotation.y = 0;
  
  // Roketi sahneye ekle
  scene.add(rocket);
  
  // Earth'ü sahneye ekle
  scene.add(currentPlanet);
  
  // Kamerayı Dünya'ya odakla
  resetCamera();
  
  // Bir saniye bekle ve gezegene git
  setTimeout(() => {
    goToNextCelestialBody();
  }, 1500);
};

// Simülasyonu durdur
const pauseSimulation = () => {
  simulationPaused.value = true;
};

// Simülasyona devam et
const resumeSimulation = () => {
  simulationPaused.value = false;
};

// Bir sonraki gök cismine git
const goToNextCelestialBody = () => {
  if (currentCelestialBodyIndex.value >= celestialBodies.length - 1) return;
  
  showNavigationButtons.value = false;
  
  // Önceki gezegeni kaldır
  if (currentPlanet && currentPlanet !== earth) {
    scene.remove(currentPlanet);
  }
  
  // Sonraki gezegene geç
  currentCelestialBodyIndex.value++;
  
  // Geçerli hedef gök cismi
  const targetBodyName = celestialBodies[currentCelestialBodyIndex.value];
  currentPlanet = planets[targetBodyName];
  
  // Önce rocket sahneye eklenmişse tekrar eklemesini engelleyelim
  if (!scene.getObjectById(rocket.id)) {
    scene.add(rocket);
  }
  
  // Uzayda seyahat animasyonunu başlat
  startJourneyToNextPlanet(currentPlanet, targetBodyName);
  
  // Yeni gezegeni sahneye ekle
  scene.add(currentPlanet);
  
  // Kamerayı devre dışı bırakarak roketi takip et
  controls.enabled = false;
};

// Gezegene yolculuk aşamaları
const startJourneyToNextPlanet = (targetPlanet, targetBodyName) => {
  // Yolculuk başladı
  journeyStatus.value = 'traveling';
  
  // Animasyon aşamaları
  const journeyPhases = [
    // Aşama 1: Yükselme - Mevcut konumdan yukarı doğru yükselme
    {
      duration: 3000, // Daha uzun kalkış
      startCallback: () => {
        console.log("1. Aşama: Yükselme başladı");
        // Kalkış modunu aktif et
        rocket.userData.isLaunching = true;
        

        
 
      },
      updateCallback: (progress) => {
        // Yükselme hareketi - çok daha yavaş başlayıp kademeli olarak hızlanma
        // Cubic easing fonksiyonu: t => t * t * t
        // Bu fonksiyon 0'a yakınken çok yavaş, 1'e yaklaşırken hızlı ilerler
        const easedProgress = Math.pow(progress, 3);
        
        const startY = celestialBodiesInfo[currentCelestialBodyIndex.value > 0 ? 
                      celestialBodies[currentCelestialBodyIndex.value] : 'earth'].size;
        const liftHeight = 25; // Yükselme mesafesi
        rocket.position.y = startY + easedProgress * liftHeight;
        
        // Kalkış hızını artırdıkça alevin büyümesi
        if (rocket.userData.flame) {
          // Önce hazırlık için alev titreyerek görünür, sonra tam güç
          if (progress < 0.2) {
            // Hazırlık aşaması - alevler titreyerek görünür
            const prepProgress = progress * 5; // 0-1 arası
            rocket.userData.flame.visible = Math.random() > 0.3 || progress > 0.15;
            if (rocket.userData.flame2) {
              rocket.userData.flame2.visible = Math.random() > 0.4 || progress > 0.17;
            }
            rocket.userData.light.intensity = prepProgress * 3;
          } else {
            // Tam güç - alevler büyür
            const flameScale = 1 + Math.pow(progress, 2) * 2;
            rocket.userData.flame.scale.y = flameScale;
            rocket.userData.flame.visible = true;
            
            if (rocket.userData.flame2) {
              rocket.userData.flame2.scale.y = flameScale * 0.8;
              rocket.userData.flame2.visible = true;
            }
            
            // Işık yoğunluğunu da artır
            rocket.userData.light.intensity = 2 + progress * 4;
          }
        }
        
        // Roketin dik durması
        rocket.rotation.x = -Math.PI / 2;
      },
      completeCallback: () => {
        console.log("1. Aşama: Yükselme tamamlandı");
        // Kalkış modunu kapat
        setTimeout(() => {
          rocket.userData.isLaunching = false;
        }, 1000);
      }
    },
    // Aşama 2: Uzayda seyahat - Hedef gezegene doğru hareket
    {
      duration: 5000,
      startCallback: () => {
        console.log("2. Aşama: Uzay yolculuğu başladı");
        // Yön vektörünü hesapla
        const currentPos = rocket.position.clone();
        const targetPos = targetPlanet.position.clone();
        targetPos.y += celestialBodiesInfo[targetBodyName].size + 15; // Hedef gezegenin üzerinde bir nokta
        
        // Animasyon parametrelerini güncelle
        animationState.startPosition = currentPos;
        animationState.targetPosition = targetPos;
        animationState.progress = 0;
      },
      updateCallback: (progress) => {
        // Uzayda hareket
        const startPos = animationState.startPosition;
        const targetPos = animationState.targetPosition;
        
        // Easing ile yumuşak hareket
        const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedT = easeInOut(progress);
        
        // Yeni pozisyon
        rocket.position.x = startPos.x + (targetPos.x - startPos.x) * easedT;
        rocket.position.z = startPos.z + (targetPos.z - startPos.z) * easedT;
        
        // Roketin hedefine doğru yönelimi
        const direction = new THREE.Vector3()
          .subVectors(targetPos, rocket.position)
          .normalize();
        
        // Yeni rotasyonu hesapla ve uygula - hedef gezegene dik yönelim
        const lookAt = new THREE.Vector3(targetPlanet.position.x, 0, targetPlanet.position.z);
        const rocketDirection = new THREE.Vector3().subVectors(rocket.position, lookAt).normalize();
        
        // Roketi gezegene doğru yönelt
        if (progress > 0.1) {
          const angle = Math.atan2(rocketDirection.z, rocketDirection.x);
          rocket.rotation.y = angle + Math.PI / 2;
          
          // Roketi aşağı bak (gezegene doğru)
          const angleToTarget = Math.atan2(
            targetPlanet.position.y - rocket.position.y,
            Math.sqrt(
              Math.pow(targetPlanet.position.x - rocket.position.x, 2) +
              Math.pow(targetPlanet.position.z - rocket.position.z, 2)
            )
          );
          
          rocket.rotation.x = angleToTarget - Math.PI / 2;
        }
      },
      completeCallback: () => {
        console.log("2. Aşama: Uzay yolculuğu tamamlandı");
      }
    },
    // Aşama 3: İniş - Hedef gezegene iniş yapma
    {
      duration: 3000,
      startCallback: () => {
        console.log("3. Aşama: İniş başladı");
        // İniş pozisyonunu hesapla
        const currentPos = rocket.position.clone();
        const targetPos = targetPlanet.position.clone();
        
        // Roketin ateş kısmı gök cismine temas etsin - Roketin boyu yaklaşık 3 birim
        // Roket merkezinden ateş ucuna olan mesafe yaklaşık 1.5 birim
        targetPos.y = celestialBodiesInfo[targetBodyName].size; // Tam olarak gezegenin yüzeyine iniş
        
        // Animasyon parametrelerini güncelle
        animationState.startPosition = currentPos;
        animationState.targetPosition = targetPos;
        animationState.progress = 0;
      },
      updateCallback: (progress) => {
        // İniş hareketi
        const startPos = animationState.startPosition;
        const targetPos = animationState.targetPosition;
        
        // Yavaşlayan bir easing kullan
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const easedT = easeOut(progress);
        
        // Yeni pozisyon
        rocket.position.y = startPos.y + (targetPos.y - startPos.y) * easedT;
        
        // Roketi dik tut, gezegene doğru yönelt
        const lookAt = new THREE.Vector3(targetPlanet.position.x, 0, targetPlanet.position.z);
        const rocketDirection = new THREE.Vector3().subVectors(rocket.position, lookAt).normalize();
        const angle = Math.atan2(rocketDirection.z, rocketDirection.x);
        rocket.rotation.y = angle + Math.PI * 2;
      },
      completeCallback: () => {
        console.log("3. Aşama: İniş tamamlandı");
        // İniş tamamlandı, durum güncelleştirildi
        journeyStatus.value = 'arrived';
        // Varış tamamlandı
        handleArrival();
      }
    }
  ];
  
  // Aşamalı animasyonu başlat
  startPhaseAnimation(journeyPhases);
};

// Varış durumu
const handleArrival = () => {
  if (currentCelestialBodyIndex.value > 0) {
    // Bilgi panelini güncelle
    const bodyName = celestialBodies[currentCelestialBodyIndex.value];
    distanceFromEarth.value = celestialBodiesInfo[bodyName].distance.toLocaleString() + ' km';
    travelTime.value = celestialBodiesInfo[bodyName].travelTime;
    
    // Eğer Güneş'e vardıysak final ekranı göster
    if (bodyName === 'sun') {
      reachedSun.value = true;
    } else {
      showNavigationButtons.value = true;
    }
    
    // Dünya'yı sol ortaya taşı (eğer henüz taşınmadıysa)
    if (planets.earth && planets.earth.position.x > -50) {
      // Dünya'yı animasyonla sol ortaya taşı
      const moveEarthToLeft = (progress) => {
        if (progress >= 1) {
          // Hareket tamamlandı
          planets.earth.position.x = -50;
          planets.earth.position.z = 30; // Z ekseninde de biraz öne çıksın
          return;
        }
        
        // Easing ile yumuşak hareket
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const easedT = easeOut(progress);
        
        // Dünya'yı yavaşça sol ortaya taşı
        planets.earth.position.x = easedT * -50;
        planets.earth.position.z = easedT * 30;
        
        // Tekrarlama
        setTimeout(() => moveEarthToLeft(progress + 0.02), 16);
      };
      
      // Dünya'nın hareketini başlat
      moveEarthToLeft(0);
    }
    
    // Ulaşılan gök cismini ortaya taşı
    if (currentPlanet) {
      // Orijinal pozisyonu sakla
      const originalPos = currentPlanet.position.clone();
      // Hedef pozisyon (merkez)
      const targetPos = new THREE.Vector3(0, originalPos.y, 0);
      
      // Roketin gök cismine göre bağıl pozisyonunu hesapla
      const rocketRelativePos = new THREE.Vector3().subVectors(rocket.position, originalPos);
      
      // Gök cismini animasyonla ortaya taşı
      const movePlanetToCenter = (progress) => {
        if (progress >= 1) {
          // Hareket tamamlandı
          currentPlanet.position.copy(targetPos);
          // Roketi de gezegene göre bağıl konumunda tut
          rocket.position.copy(targetPos).add(rocketRelativePos);
          return;
        }
        
        // Easing ile yumuşak hareket (yavaş başla, hızlan, yavaş bitir)
        const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedT = easeInOut(progress);
        
        // Gök cismini yavaşça merkeze taşı
        const newPlanetX = originalPos.x + (targetPos.x - originalPos.x) * easedT;
        const newPlanetZ = originalPos.z + (targetPos.z - originalPos.z) * easedT;
        
        currentPlanet.position.x = newPlanetX;
        currentPlanet.position.z = newPlanetZ;
        
        // Roketi de aynı oranda taşı, bağıl pozisyonunu koru
        rocket.position.x = newPlanetX + rocketRelativePos.x;
        rocket.position.z = newPlanetZ + rocketRelativePos.z;
        
        // Tekrarlama
        setTimeout(() => movePlanetToCenter(progress + 0.01), 16);
      };
      
      // Gök cisminin hareketini başlat
      movePlanetToCenter(0);
    }
  }
};

// Aşamalı animasyon yöneticisi
const startPhaseAnimation = (phases) => {
  let currentPhase = 0;
  
  const runPhase = (phaseIndex) => {
    if (phaseIndex >= phases.length) {
      animationState.isMoving = false;
      return;
    }
    
    const phase = phases[phaseIndex];
    let startTime = null;
    
    // Aşamayı başlat
    phase.startCallback && phase.startCallback();
    
    // Aşama animasyonu
    const animatePhase = (timestamp) => {
      if (simulationPaused.value) {
        requestAnimationFrame(animatePhase);
        return;
      }
      
      // Roket kontrolü - eğer sahnede değilse tekrar ekle
      if (rocket && !scene.getObjectById(rocket.id)) {
        scene.add(rocket);
      }
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const duration = phase.duration / animationSpeed.value;
      
      if (elapsed < duration) {
        // Aşama devam ediyor
        const progress = elapsed / duration;
        phase.updateCallback && phase.updateCallback(progress);
        
        // Kamerayı roketi takip ettir
        if (!controls.enabled) {
          camera.position.x = rocket.position.x + 20;
          camera.position.y = rocket.position.y + 15;
          camera.position.z = rocket.position.z + 20;
          camera.lookAt(rocket.position);
        }
        
        requestAnimationFrame(animatePhase);
      } else {
        // Aşama tamamlandı
        phase.updateCallback && phase.updateCallback(1.0);
        phase.completeCallback && phase.completeCallback();
        
        // Fazladan roket var mı kontrol et
        const allRockets = [];
        scene.traverse(object => {
          if (object.userData && object.userData.flame) {
            allRockets.push(object);
          }
        });
        
        // Birden fazla roket varsa, ilk roket hariç diğerlerini kaldır
        if (allRockets.length > 1) {
          for (let i = 1; i < allRockets.length; i++) {
            scene.remove(allRockets[i]);
          }
          console.log("Fazladan roketler temizlendi");
        }
        
        // Sonraki aşamaya geç
        runPhase(phaseIndex + 1);
      }
    };
    
    // Aşamayı başlat
    animationState.isMoving = true;
    requestAnimationFrame(animatePhase);
  };
  
  // İlk aşamayı başlat
  runPhase(0);
};

// Dünya'ya geri dön
const returnToEarth = () => {
  showNavigationButtons.value = false;
  reachedSun.value = false;
  
  // Önceki gezegeni kaldır
  if (currentPlanet && currentPlanet !== earth) {
    // Gezegeni kaldırmadan önce, orijinal pozisyonuna geri getir
    const originalInfo = celestialBodiesInfo[celestialBodies[currentCelestialBodyIndex.value]];
    if (originalInfo && currentPlanet) {
      // Gezegeni animasyonla orijinal konumuna geri taşı
      const movePlanetBack = (progress) => {
        if (progress >= 1) {
          // Hareket tamamlandı, gezegeni orijinal konumuna getir
          currentPlanet.position.copy(originalInfo.position);
          // Gezegeni kaldır
          scene.remove(currentPlanet);
          return;
        }
        
        // Easing ile yumuşak hareket
        const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedT = easeInOut(progress);
        
        // Gezegenin şu anki pozisyonu ile orijinal pozisyonu arasında interpolasyon
        const currentPos = currentPlanet.position.clone();
        currentPlanet.position.x = currentPos.x + (originalInfo.position.x - currentPos.x) * easedT;
        currentPlanet.position.z = currentPos.z + (originalInfo.position.z - currentPos.z) * easedT;
        
        // Tekrarlama
        setTimeout(() => movePlanetBack(progress + 0.02), 16);
      };
      
      // Gezegeni orijinal konumuna geri taşıma animasyonunu başlat
      movePlanetBack(0);
    } else {
      // Bilgi yoksa, doğrudan kaldır
      scene.remove(currentPlanet);
    }
  }
  
  // Dünya'ya geç
  currentCelestialBodyIndex.value = 0;
  currentPlanet = planets.earth;
  
  // Dünya'yı orijinal konumuna geri getir
  if (planets.earth) {
    const moveEarthBack = (progress) => {
      if (progress >= 1) {
        // Hareket tamamlandı, Dünya orijinal konumunda
        planets.earth.position.x = 0;
        planets.earth.position.z = 0;
        // Dünya'yı sahneye ekle
        if (!scene.getObjectById(currentPlanet.id)) {
          scene.add(currentPlanet);
        }
        return;
      }
      
      // Easing ile yumuşak hareket
      const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easedT = easeInOut(progress);
      
      // Mevcut konumları al
      const currentEarthX = planets.earth.position.x;
      const currentEarthZ = planets.earth.position.z;
      
      // Dünya'yı yavaşça orijinal konumuna getir
      const newEarthX = -50 + easedT * 50; // -50'den 0'a
      const newEarthZ = 30 - easedT * 30;  // 30'dan 0'a
      
      // Roketin Dünya'ya göre bağıl hareketi
      const deltaX = newEarthX - currentEarthX;
      const deltaZ = newEarthZ - currentEarthZ;
      
      // Dünya'nın pozisyonunu güncelle
      planets.earth.position.x = newEarthX;
      planets.earth.position.z = newEarthZ;
      
      // Roketi de Dünya ile birlikte hareket ettir
      rocket.position.x += deltaX;
      rocket.position.z += deltaZ;
      
      // Tekrarlama
      setTimeout(() => moveEarthBack(progress + 0.02), 16);
    };
    
    // Dünya'nın hareketini başlat
    moveEarthBack(0);
  } else {
    // Eğer earth nesnesi yoksa doğrudan ekle
    scene.add(currentPlanet);
  }
  
  // Roket sahnede yoksa ekle, varsa kaldırıp tekrar ekle
  if (scene.getObjectById(rocket.id)) {
    scene.remove(rocket);
  }
  scene.add(rocket);
  
  // Dünya'ya dönüş animasyonu
  const returnJourneyPhases = [
    // Aşama 1: Yükselme
    {
      duration: 2000,
      startCallback: () => {
        console.log("Dönüş 1. Aşama: Yükselme başladı");
      },
      updateCallback: (progress) => {
        // Yükselme hareketi
        const startY = rocket.position.y;
        const liftHeight = 15; // Yükselme mesafesi
        rocket.position.y = startY + progress * liftHeight;
      },
      completeCallback: () => {
        console.log("Dönüş 1. Aşama: Yükselme tamamlandı");
      }
    },
    // Aşama 2: Dünya'ya seyahat
    {
      duration: 5000,
      startCallback: () => {
        console.log("Dönüş 2. Aşama: Dünya'ya yolculuk başladı");
        // Yön vektörünü hesapla
        const currentPos = rocket.position.clone();
        const targetPos = earth.position.clone();
        targetPos.y += celestialBodiesInfo.earth.size + 15; // Dünya'nın üzerinde bir nokta
        
        // Animasyon parametrelerini güncelle
        animationState.startPosition = currentPos;
        animationState.targetPosition = targetPos;
        animationState.progress = 0;
      },
      updateCallback: (progress) => {
        // Uzayda hareket
        const startPos = animationState.startPosition;
        const targetPos = animationState.targetPosition;
        
        // Easing ile yumuşak hareket
        const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedT = easeInOut(progress);
        
        // Yeni pozisyon
        rocket.position.x = startPos.x + (targetPos.x - startPos.x) * easedT;
        rocket.position.y = startPos.y + (targetPos.y - startPos.y) * easedT;
        rocket.position.z = startPos.z + (targetPos.z - startPos.z) * easedT;
        
        // Roketin yönelimi
        const direction = new THREE.Vector3()
          .subVectors(targetPos, rocket.position)
          .normalize();
        const angle = Math.atan2(direction.z, direction.x);
        rocket.rotation.y = -angle + Math.PI / 2;
      },
      completeCallback: () => {
        console.log("Dönüş 2. Aşama: Dünya'ya yolculuk tamamlandı");
      }
    },
    // Aşama 3: İniş
    {
      duration: 3000,
      startCallback: () => {
        console.log("Dönüş 3. Aşama: İniş başladı");
        // İniş pozisyonunu hesapla
        const currentPos = rocket.position.clone();
        const targetPos = earth.position.clone();
        targetPos.y = celestialBodiesInfo.earth.size; // Roketin ateş kısmı tam yüzeyde
        
        // Animasyon parametrelerini güncelle
        animationState.startPosition = currentPos;
        animationState.targetPosition = targetPos;
        animationState.progress = 0;
      },
      updateCallback: (progress) => {
        // İniş hareketi
        const startPos = animationState.startPosition;
        const targetPos = animationState.targetPosition;
        
        // Yavaşlayan bir easing kullan
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const easedT = easeOut(progress);
        
        // Yeni pozisyon
        rocket.position.y = startPos.y + (targetPos.y - startPos.y) * easedT;
      },
      completeCallback: () => {
        console.log("Dönüş 3. Aşama: İniş tamamlandı");
        
        // Tüm dönüş işlemleri tamamlandı
        rocket.rotation.x = -Math.PI / 2;
        
        // Bilgi panelini sıfırla
        distanceFromEarth.value = null;
        travelTime.value = null;
        
        // Simülasyonu sıfırla
        simulationStarted.value = false;
        simulationPaused.value = false;
        
        // Kamera kontrollerini etkinleştir
        controls.enabled = true;
        resetCamera();
      }
    }
  ];
  
  // Aşamalı animasyonu başlat
  startPhaseAnimation(returnJourneyPhases);
};

// Ayarlar panelini aç/kapat
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Arkaplan rengini değiştir
const changeBackgroundColor = (color) => {
  backgroundColor.value = color;
  scene.background = new THREE.Color(color);
};

// Kamera görünümünü değiştir
const changeCameraView = (position, lookAt) => {
  camera.position.set(position.x, position.y, position.z);
  controls.target.set(lookAt.x, lookAt.y, lookAt.z);
  controls.update();
};

// Kamerayı sıfırla
const resetCamera = () => {
  camera.position.set(20, 20, 40); // Mesafeleri artırdım
  controls.target.set(0, 0, 0);
  controls.update();
};

// Simülasyonu sıfırla
const resetSimulation = () => {
  // Animasyon hızını sıfırla
  animationSpeed.value = 1;
  
  // Arka plan rengini sıfırla
  changeBackgroundColor('#000000');
  
  // Simülasyonu durdur
  simulationPaused.value = true;
  
  // Gezegenleri sıfırla
  returnToEarth();
  
  // Kamerayı sıfırla
  resetCamera();
};

// Arkaplan rengi değişikliğini izle
watch(backgroundColor, (newColor) => {
  scene.background = new THREE.Color(newColor);
});

// THREE.js temizleme işlemleri
const cleanupThree = () => {
  if (renderer) {
    renderer.dispose();
    canvasContainer.value.removeChild(renderer.domElement);
  }
  
  // Geometri ve materyalleri temizle
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
};

// Durum mesajı
const statusMessage = computed(() => {
  if (!currentCelestialBody.value) return '';
  
  if (currentCelestialBody.value === 'space') {
    if (currentCelestialBodyIndex.value < celestialBodies.length) {
      const nextBodyName = celestialBodiesInfo[celestialBodies[currentCelestialBodyIndex.value + 1]].name;
      return `Roket ${nextBodyName}'e gidiyor...`;
    }
    return 'Uzayda seyahat ediliyor...';
  }
  
  if (journeyStatus.value === 'arrived') {
    const bodyName = celestialBodiesInfo[currentCelestialBody.value].name;
    return `Roket ${bodyName}'a ulaştı!`;
  }
  
  if (currentCelestialBody.value === 'earth') {
    return `Roket Dünya'da`;
  }

  return `Roket ${celestialBodiesInfo[currentCelestialBody.value].name} yolunda`;
});
</script>
  
 
 