<template>
  <div class="relative w-full h-screen bg-gray-900 text-white overflow-hidden flex flex-col">



    <!-- Üst Bar - Başlat/Durdur Butonları -->
    <div class="absolute top-0 left-0 right-0 z-20 flex justify-center items-center p-2">
      
      <div class="flex flex-col space-y-2 w-full items-center">
        <div class="flex space-x-2">
          <button 
            @click="toggleTimelineAnimation" 
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200"

            :class="timelineAnimationActive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
          >
            {{ timelineAnimationActive ? 'Durdur' : 'Başlat' }}
          </button>

          <button 
            v-if="currentModel.id === 'rutherford'" 
            @click="startRutherfordExperiment" 
            class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded shadow-lg transition-all"
          >
            Rutherford Deneyini Başlat
          </button>
          <button 
            v-if="currentModel.id === 'bohr'" 
            @click="toggleElectronJump" 
            class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded shadow-lg transition-all"
          >
            Elektron Sıçramasını Göster
          </button>
        </div>

        <div class="text-center text-black lg:hidden block">{{ currentModel.name }}</div>
      </div>

      
    </div>


    
    <!-- Mobil Ayarlar Butonu -->
    <div class="md:hidden absolute top-3 left-3 z-30">
      <button 
        @click="mobileSettingsOpen = !mobileSettingsOpen" 
        class="bg-gray-800 p-2 rounded-full shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Mobil Ayarlar Paneli (Modal) -->
    <div v-if="mobileSettingsOpen" class="md:hidden fixed inset-0 z-20 bg-black bg-opacity-70 flex justify-center items-center p-4">
      <div class="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4 shadow-xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="mobileSettingsOpen = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mobil Kontrol İçeriği -->
        <div class="control-panel-content">
          <!-- Atom Modeli Bilgileri -->          

          <!-- Zaman Çizelgesi Kaydırıcı -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label>Atom Modeli Zaman Çizelgesi</label>

            </div>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1" 
              v-model="selectedModelIndex" 
              class="w-full"
            >
            <div class="flex justify-between text-xs mt-1">
              <span>1803</span>
              <span>1897</span>
              <span>1911</span>
              <span>1913</span>
              <span>1926</span>
            </div>
          </div>

          <!-- Model Bilgi Kartı -->
          <div class="bg-gray-700 p-4 rounded-lg mb-4">
            <h2 class="text-lg font-bold mb-2">{{ currentModel.name }}</h2>
            <div class="flex flex-wrap">
              <div class="w-full md:w-2/3">
                <p class="mb-2">{{ currentModel.scientist }} - {{ currentModel.year }}</p>
              </div>

            </div>
            <p class="text-sm">{{ currentModel.description }}</p>
          </div>
          
          <!-- Reset Butonu -->
          <div class="flex justify-center mt-4">
            <button 
              @click="resetSettings" 
              class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-all"
            >
              Ayarları Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ana İçerik Alanı -->
    <div class="relative flex flex-grow overflow-hidden">

      <!-- Three.js Similasyon Alanı -->
      <div ref="threeContainer" class="flex-grow h-full"></div>

      <!-- PC Sağ Kontrol Paneli -->
      <div class="hidden md:block w-80 bg-gray-800 p-4 z-10 overflow-y-auto flex-shrink-0 shadow-lg">
 
        <!-- Zaman Çizelgesi Kaydırıcı -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium">Atom Modeli Zaman Çizelgesi</label>
          </div>
          <input 
            type="range" 
            min="0" 
            max="4" 
            step="1" 
            v-model="selectedModelIndex" 
            class="w-full accent-indigo-600"
          >
          <div class="flex justify-between text-xs mt-1">
            <span>1803</span>
            <span>1897</span>
            <span>1911</span>
            <span>1913</span>
            <span>1926</span>
          </div>
        </div>

        <!-- Model Bilgi Kartı -->
        <div class="bg-gray-700 p-4 rounded-lg mb-4 shadow-md">
          <h2 class="text-lg md:text-xl font-bold mb-2">{{ currentModel.name }}</h2>
          <div class="flex flex-wrap">
            <div class="w-full md:w-2/3">
              <p class="mb-2"> {{ currentModel.scientist }} - {{ currentModel.year }}</p>
            </div>

          </div>
          <p class="text-sm">{{ currentModel.description }}</p>
        </div>

        <!-- Reset Butonu -->
        <div class="flex justify-center mt-4">
          <button 
            @click="resetSettings" 
            class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-all shadow-md"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar ve state
const threeContainer = ref(null);
const selectedModelIndex = ref(0);
const rotateModel = ref(true);
const timelineAnimationActive = ref(false);
const timelineAnimationInterval = ref(null);
const backgroundColor = ref('gray');
const mobileSettingsOpen = ref(false); // Mobil ayarlar modali için durum

// İlk ayarları sakla (reset için)
const initialSettings = {
  selectedModelIndex: 0,
  rotateModel: true,
  backgroundColor: 'gray'
};

// Arkaplan renk seçenekleri
const backgroundColors = [
  { name: 'Gri', value: 'gray', hex: '#999999' },
  { name: 'Koyu', value: 'dark', hex: '#0a0a0a' },
  { name: 'Mavi', value: 'blue', hex: '#0d2d53' },
  { name: 'Mor', value: 'purple', hex: '#2d0a3f' },
  { name: 'Yeşil', value: 'green', hex: '#0a2f1d' },
  { name: 'Kırmızı', value: 'red', hex: '#3a0a0a' }
];

// Scene değişkenleri
let scene, camera, renderer, controls;
let atomModel = null;
let animationFrameId = null;
let room = null;

// Atom modelleri verileri
const atomModels = [
  {
    id: 'dalton',
    name: 'Dalton Atom Modeli',
    scientist: 'John Dalton',
    year: 1803,
    description: 'Atomlar küçük, bölünemez, sert küreler olarak tasarlanmıştır. Her elementin atomları kendine özgü kütle ve özelliklere sahiptir. Bu model, atomları kimyanın "temel yapı taşları" olarak tanımlamıştır.'
  },
  {
    id: 'thomson',
    name: 'Thomson Atom Modeli (Üzümlü Kek)',
    scientist: 'J.J. Thomson',
    year: 1897,
    description: 'Elektronların keşfiyle oluşturulan bu model, pozitif yüklü bir kütle içine gömülmüş negatif yüklü elektronlardan oluşan bir "üzümlü kek" gibidir. Atomun elektriksel olarak nötr olduğunu göstermiştir.'
  },
  {
    id: 'rutherford',
    name: 'Rutherford Atom Modeli',
    scientist: 'Ernest Rutherford',
    year: 1911,
    description: 'Altın folyo deneyi sonucunda geliştirilen bu model, atomun merkezinde yoğun, pozitif yüklü bir çekirdek ve çevresinde dönen elektronlardan oluştuğunu göstermiştir. Atom çoğunlukla boş alanlardan oluşur.'
  },
  {
    id: 'bohr',
    name: 'Bohr Atom Modeli',
    scientist: 'Niels Bohr',
    year: 1913,
    description: 'Elektronların belirli enerji seviyelerinde (yörüngelerde) hareket ettiğini öneren bu model, elektronların yörüngeler arası geçişlerini ve atomların spektrumlarını açıklamıştır. Kuantum fiziğinin temellerini oluşturmuştur.'
  },
  {
    id: 'quantum',
    name: 'Modern Kuantum Atom Modeli',
    scientist: 'Schrödinger, Heisenberg vd.',
    year: 1926,
    description: 'Elektronlar belirli yörüngelerde değil, bir olasılık dağılımı (elektron bulutu) içinde bulunurlar. Belirsizlik ilkesi ve dalga-parçacık ikiliği bu modelin temel özellikleridir. Modern atom teorisinin temelidir.'
  }
];

// Mevcut modeli hesapla
const currentModel = computed(() => atomModels[selectedModelIndex.value]);

// Arkaplan rengini değiştir
function changeBackgroundColor(colorValue) {
  backgroundColor.value = colorValue;
  
  // Renk hex değerini bul
  const colorObject = backgroundColors.find(c => c.value === colorValue);
  if (!colorObject) return;
  
  // THREE.js renk nesnesine dönüştür
  const threeColor = new THREE.Color(colorObject.hex);
  
  // Scene arka planını güncelle
  if (scene) {
    scene.background = threeColor;
  }
  
  // Oda renklerini güncelle
  if (room) {
    if (Array.isArray(room.material)) {
      room.material.forEach(material => {
        material.color = threeColor;
      });
    } else if (room.material) {
      room.material.color = threeColor;
    }
  }
}

// Zaman çizelgesi animasyonu
function toggleTimelineAnimation() {
  if (timelineAnimationActive.value) {
    // Animasyonu durdur
    timelineAnimationActive.value = false;
    if (timelineAnimationInterval.value) {
      clearInterval(timelineAnimationInterval.value);
      timelineAnimationInterval.value = null;
    }
  } else {
    // Animasyonu başlat
    timelineAnimationActive.value = true;
    
    // Her 3 saniyede bir yeni modele geç
    timelineAnimationInterval.value = setInterval(() => {
      // Sıradaki modele geç, son modelden sonra başa dön
      selectedModelIndex.value = (selectedModelIndex.value + 1) % atomModels.length;
    }, 3000);
  }
}

// Three.js kurulumu
function setupThreeJS() {
  // Scene oluşturma
  scene = new THREE.Scene();
  
  // Başlangıç arkaplan rengini ayarla
  const colorObject = backgroundColors.find(c => c.value === backgroundColor.value);
  scene.background = new THREE.Color(colorObject.hex);
  
  // Oda duvarları, tavan ve zemin
  createRoom();
  
  // Kamera oluşturma
  camera = new THREE.PerspectiveCamera(
    75, 
    threeContainer.value.clientWidth / threeContainer.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.z = 5;
  
  // Renderer oluşturma
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);
  
  // Kontroller ekleme
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);
  
  // İlk atom modelini oluştur
  createAtomModel(currentModel.value.id);
  
  // Animasyon döngüsü
  animate();
  
  // Pencere yeniden boyutlandırma olayı
  window.addEventListener('resize', onWindowResize);
}

// Oda (duvarlar, tavan, zemin) oluşturma
function createRoom() {
  const roomSize = 20;
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
  
  // Arkaplan rengini bul
  const colorObject = backgroundColors.find(c => c.value === backgroundColor.value);
  const threeColor = new THREE.Color(colorObject.hex);
  
  const roomMaterials = [
    new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.BackSide })
  ];
  
  room = new THREE.Mesh(roomGeometry, roomMaterials);
  scene.add(room);
}

// Pencere yeniden boyutlandırma işleyicisi
function onWindowResize() {
  camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
}

// Atom modeli oluşturma fonksiyonu
function createAtomModel(modelId) {
  // Önceki modeli temizle
  if (atomModel) {
    scene.remove(atomModel);
  }
  
  // Yeni grup oluştur
  atomModel = new THREE.Group();
  
  switch (modelId) {
    case 'dalton':
      createDaltonModel();
      break;
    case 'thomson':
      createThomsonModel();
      break;
    case 'rutherford':
      createRutherfordModel();
      break;
    case 'bohr':
      createBohrModel();
      break;
    case 'quantum':
      createQuantumModel();
      break;
  }
  
  scene.add(atomModel);
}

// Dalton Atom Modeli (1803)
function createDaltonModel() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x6d4c41,
    roughness: 0.7,
    metalness: 0.3
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  atomModel.add(sphere);
}

// Thomson Atom Modeli (1897) - Üzümlü Kek
function createThomsonModel() {
  // Pozitif yüklü kütle (kek)
  const cakeGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const cakeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe57373,
    transparent: true,
    opacity: 0.7,
    roughness: 0.5,
    metalness: 0.1
  });
  
  const cake = new THREE.Mesh(cakeGeometry, cakeMaterial);
  atomModel.add(cake);
  
  // Elektronlar (üzümler)
  const electronGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const electronMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2196f3,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.5
  });
  
  // Rastgele konumlarda 10 elektron ekle
  for (let i = 0; i < 10; i++) {
    const electron = new THREE.Mesh(electronGeometry, electronMaterial);
    
    // Küre içinde rastgele konum
    const radius = 1.2 * Math.random();
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    electron.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    
    atomModel.add(electron);
  }
}

// Rutherford Atom Modeli (1911)
function createRutherfordModel() {
  // Çekirdek
  const nucleusGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const nucleusMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff5722,
    emissive: 0xe64a19,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.7
  });
  
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  atomModel.add(nucleus);
  
  // Elektronlar
  const electronGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const electronMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2196f3,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.5
  });
  
  // Rastgele yörüngelerde elektronlar
  for (let i = 0; i < 5; i++) {
    const electronOrbit = new THREE.Group();
    
    // Rastgele yörünge açısı
    electronOrbit.rotation.x = Math.random() * Math.PI;
    electronOrbit.rotation.y = Math.random() * Math.PI;
    
    const electron = new THREE.Mesh(electronGeometry, electronMaterial);
    
    // Rastgele yarıçap
    const radius = 1 + Math.random() * 0.5;
    electron.position.x = radius;
    
    electronOrbit.add(electron);
    atomModel.add(electronOrbit);
  }
}

// Bohr Atom Modeli (1913)
function createBohrModel() {
  // Çekirdek
  const nucleusGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const nucleusMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff5722,
    emissive: 0xe64a19,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.7
  });
  
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  atomModel.add(nucleus);
  
  // Elektron yörüngeleri
  const orbitalRadii = [0.8, 1.4, 2.0];
  const electronCounts = [2, 8, 8];
  
  // Yörünge çizgileri
  const orbitalMaterial = new THREE.LineBasicMaterial({ color: 0x757575, transparent: true, opacity: 0.5 });
  
  orbitalRadii.forEach(radius => {
    const orbitalGeometry = new THREE.BufferGeometry();
    const orbitalPoints = [];
    
    // Dairesel yörünge noktaları
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      orbitalPoints.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
    }
    
    orbitalGeometry.setFromPoints(orbitalPoints);
    const orbitalLine = new THREE.Line(orbitalGeometry, orbitalMaterial);
    atomModel.add(orbitalLine);
  });
  
  // Elektronlar
  const electronGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const electronMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2196f3,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.5
  });
  
  // Her yörüngedeki elektronlar
  for (let i = 0; i < orbitalRadii.length; i++) {
    const radius = orbitalRadii[i];
    const count = electronCounts[i];
    
    for (let j = 0; j < count; j++) {
      const electron = new THREE.Mesh(electronGeometry, electronMaterial);
      const angle = (j / count) * Math.PI * 2;
      
      electron.position.set(
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        0
      );
      
      atomModel.add(electron);
    }
  }
}

// Modern Kuantum Atom Modeli (1926)
function createQuantumModel() {
  // Çekirdek
  const nucleusGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const nucleusMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff5722,
    emissive: 0xe64a19,
    emissiveIntensity: 0.5
  });
  
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  atomModel.add(nucleus);
  
  // Elektron bulutu (olasılık dağılımı)
  const cloudGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const cloudMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2196f3,
    transparent: true,
    opacity: 0.2,
    wireframe: false
  });
  
  const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
  atomModel.add(cloud);
  
  // Elektron parçacıkları
  const particleCount = 100;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlePositions = [];
  
  // Rastgele parçacık konumları
  for (let i = 0; i < particleCount; i++) {
    // Gaussian dağılım
    const r = 1.5 * Math.pow(Math.random(), 0.33);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    particlePositions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  
  particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({ 
    color: 0x4fc3f7,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  atomModel.add(particles);
}

// Rutherford deneyini başlat
function startRutherfordExperiment() {
  // Önceki deney parçacıklarını temizle
  scene.traverse(object => {
    if (object.userData.isAlphaParticle) {
      scene.remove(object);
    }
  });
  
  // 10 alfa parçacığı oluştur
  for (let i = 0; i < 10; i++) {
    createAlphaParticle();
  }
}

// Alfa parçacığı oluştur (Rutherford deneyi için)
function createAlphaParticle() {
  const geometry = new THREE.SphereGeometry(0.05, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
  const particle = new THREE.Mesh(geometry, material);
  
  // Parçacığı çekirdekten uzak bir noktada başlat
  const startZ = -3;
  // X ve Y'de rastgele konumlar (kare alan içinde)
  const range = 2;
  const startX = (Math.random() * 2 - 1) * range;
  const startY = (Math.random() * 2 - 1) * range;
  
  particle.position.set(startX, startY, startZ);
  
  // Hız vektörü (çekirdeğe doğru)
  const velocity = new THREE.Vector3(0, 0, 0.05);
  
  // Kullanıcı verisi olarak hızı ve ek özellikleri kaydet
  particle.userData = {
    velocity,
    isAlphaParticle: true,
    hasDeflected: false
  };
  
  scene.add(particle);
}

// Elektron sıçramasını göster/gizle (Bohr modeli için)
function toggleElectronJump() {
  if (currentModel.value.id === 'bohr') {
    // Rastgele bir elektronu seç ve yörünge değiştir
    const electrons = [];
    atomModel.traverse(object => {
      if (object.geometry && object.geometry.type === 'SphereGeometry' && 
          object.geometry.parameters.radius === 0.08) {
        electrons.push(object);
      }
    });
    
    if (electrons.length > 0) {
      const electron = electrons[Math.floor(Math.random() * electrons.length)];
      const currentDistance = electron.position.length();
      
      // Yeni yörünge yarıçapı
      let newRadius;
      if (Math.random() > 0.5 && currentDistance < 1.9) {
        // Dışa doğru sıçra
        newRadius = currentDistance + 0.6;
      } else {
        // İçe doğru sıçra
        newRadius = Math.max(0.8, currentDistance - 0.6);
      }
      
      // Işık parlaması efekti
      const flashGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const flashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 1
      });
      
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);
      flash.position.copy(electron.position);
      atomModel.add(flash);
      
      // Işık parlaması animasyonu ve silme
      const fadeOut = setInterval(() => {
        flashMaterial.opacity -= 0.05;
        if (flashMaterial.opacity <= 0) {
          clearInterval(fadeOut);
          atomModel.remove(flash);
        }
      }, 50);
      
      // Elektron pozisyonunu normalize et ve yeniden ölçeklendir
      const direction = electron.position.clone().normalize();
      electron.position.copy(direction.multiplyScalar(newRadius));
    }
  }
}

// Animasyon döngüsü
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  // Orbit kontrolleri güncelle
  controls.update();
  
  // Atom modeli rotasyonu
  if (rotateModel.value && atomModel) {
    atomModel.rotation.y += 0.005;
  }
  
  // Rutherford deneyinde alfa parçacıklarını güncelle
  scene.traverse(object => {
    if (object.userData.isAlphaParticle) {
      // Parçacığı güncelle
      object.position.add(object.userData.velocity);
      
      // Çekirdeğe yakınlık kontrolü
      const distanceToCenter = object.position.length();
      
      // Çekirdeğe yakınsa ve henüz sapmamışsa
      if (distanceToCenter < 0.5 && !object.userData.hasDeflected) {
        // Sapmayı kaydet
        object.userData.hasDeflected = true;
        
        // Rastgele yeni bir yön hesapla
        const deflectionAngle = Math.random() * Math.PI;
        const azimuthAngle = Math.random() * Math.PI * 2;
        
        // Yeni hız vektörü hesapla
        const speed = object.userData.velocity.length();
        object.userData.velocity.set(
          speed * Math.sin(deflectionAngle) * Math.cos(azimuthAngle),
          speed * Math.sin(deflectionAngle) * Math.sin(azimuthAngle),
          speed * Math.cos(deflectionAngle)
        );
        
        // Rengi değiştir
        object.material.color.set(0xff4081);
      }
      
      // Ekran dışına çıktıysa sil
      if (Math.abs(object.position.x) > 5 || 
          Math.abs(object.position.y) > 5 || 
          Math.abs(object.position.z) > 5) {
        scene.remove(object);
      }
    }
  });
  
  // Thomson modelindeki elektronların rastgele hareketi
  if (currentModel.value.id === 'thomson') {
    atomModel.traverse(object => {
      if (object.geometry && object.geometry.type === 'SphereGeometry' && 
          object.geometry.parameters.radius === 0.1) {
        // Rastgele küçük hareketler
        object.position.x += (Math.random() - 0.5) * 0.01;
        object.position.y += (Math.random() - 0.5) * 0.01;
        object.position.z += (Math.random() - 0.5) * 0.01;
        
        // Pozitif kütle içinde tut
        const distance = object.position.length();
        if (distance > 1.2) {
          object.position.normalize().multiplyScalar(1.2);
        }
      }
    });
  }
  
  // Bohr modelindeki elektronları döndür
  if (currentModel.value.id === 'bohr') {
    atomModel.traverse(object => {
      if (object.geometry && object.geometry.type === 'SphereGeometry' && 
          object.geometry.parameters.radius === 0.08) {
        // Mevcut pozisyonu al
        const x = object.position.x;
        const y = object.position.y;
        const radius = Math.sqrt(x*x + y*y);
        
        // Açıyı hesapla
        let angle = Math.atan2(y, x);
        
        // Orbital hızını yarıçapa göre ayarla (daha uzak = daha yavaş)
        const speed = 0.03 / Math.sqrt(radius);
        angle += speed;
        
        // Yeni pozisyonu hesapla
        object.position.x = radius * Math.cos(angle);
        object.position.y = radius * Math.sin(angle);
      }
    });
  }
  
  // Render
  renderer.render(scene, camera);
}

// Seçilen model değiştiğinde yeni atom modeli oluştur
watch(selectedModelIndex, () => {
  createAtomModel(currentModel.value.id);
});

// Component oluşturulduğunda Three.js'i başlat
onMounted(() => {
  setupThreeJS();
});

// Component kaldırıldığında temizlik yap
onBeforeUnmount(() => {
  // Animasyonları durdur
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Zaman çizelgesi animasyonunu durdur
  if (timelineAnimationInterval.value) {
    clearInterval(timelineAnimationInterval.value);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // Renderer DOM elementini kaldır
  if (renderer && threeContainer.value) {
    threeContainer.value.removeChild(renderer.domElement);
  }
  
  // Three.js nesnelerini temizle
  if (scene) {
    scene.traverse(object => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
  
  // Referansları temizle
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  atomModel = null;
});

// Ayarları sıfırlama fonksiyonu
function resetSettings() {
  selectedModelIndex.value = initialSettings.selectedModelIndex;
  rotateModel.value = initialSettings.rotateModel;
  changeBackgroundColor(initialSettings.backgroundColor);
  
  // Animasyonu durdur
  if (timelineAnimationActive.value) {
    toggleTimelineAnimation();
  }
  
  // Mobil ayarlar panelini kapat
  mobileSettingsOpen.value = false;
}
</script>
  
 
 