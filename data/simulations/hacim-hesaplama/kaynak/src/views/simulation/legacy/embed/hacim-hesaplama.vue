<template>
  <div class="min-h-screen bg-gray-900 text-white relative overflow-auto">
    <!-- Başlık ve Kontrol Butonları -->
    <div class="container mx-auto p-4">



      <!-- Ana İçerik -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Simülasyon Alanı -->
        <div class="flex-grow bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div ref="threeContainer" class="w-full" style="height: 70vh;">
            <!-- Three.js canvas buraya yerleştirilecek -->
          </div>
        </div>

        <!-- Mobil Ayarlar Butonu -->
        <button 
          @click="showMobileSettings = !showMobileSettings"
          class="absolute top-4 left-4 lg:hidden bg-gray-800 p-2 rounded-md z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- Ayarlar Paneli -->
        <div 
          :class="[
            'bg-gray-800  p-4',
            'lg:w-1/3 lg:max-w-md',
            'fixed inset-0 lg:relative z-40 transform transition-transform duration-300 ease-in-out',
            showMobileSettings ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          ]"
          style="max-height: 70vh; overflow-y: auto;"
        >
          <!-- Mobil Kapatma Butonu -->
          <button 
            @click="showMobileSettings = false"
            class="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Mevcut ayarlar içeriği buraya gelecek -->
          <div class="mb-4">
            <label class="block mb-2">Şekil Seçin:</label>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="selectedShape = 'cube'" 
                :class="[
                  'px-4 py-2 rounded-md transition-colors',
                  selectedShape === 'cube' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                ]"
              >
                Küp
              </button>
              <button 
                @click="selectedShape = 'prism'" 
                :class="[
                  'px-4 py-2 rounded-md transition-colors',
                  selectedShape === 'prism' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                ]"
              >
                Prizma
              </button>
              <button 
                @click="selectedShape = 'cylinder'" 
                :class="[
                  'px-4 py-2 rounded-md transition-colors',
                  selectedShape === 'cylinder' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                ]"
              >
                Silindir
              </button>
              <button 
                @click="selectedShape = 'sphere'" 
                :class="[
                  'px-4 py-2 rounded-md transition-colors',
                  selectedShape === 'sphere' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                ]"
              >
                Küre
              </button>
            </div>
          </div>
          
          <!-- Küp Ayarları -->
          <div v-if="selectedShape === 'cube'" class="space-y-4">
            <div>
              <label class="block mb-2">Kenar Uzunluğu (a):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementCubeSize" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="cubeSize" 
                  min="1" 
                  max="10" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementCubeSize" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ cubeSize }} birim</span>
                <span>Hacim: {{ cubeVolume }} birim³</span>
              </div>
            </div>
            
            <div class="bg-gray-700 p-3 rounded-md">
              <h3 class="font-semibold mb-2">Küp Hacim Formülü:</h3>
              <p class="text-lg">V = a³</p>
              <div class="mt-2 space-y-1">
                <p>V = {{ cubeSize }}³</p>
                <p>V = {{ cubeVolume }} birim³</p>
              </div>
            </div>
          </div>
          
          <!-- Prizma Ayarları -->
          <div v-if="selectedShape === 'prism'" class="space-y-4">
            <div>
              <label class="block mb-2">Uzunluk (a):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementPrismLength" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="prismLength" 
                  min="1" 
                  max="10" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementPrismLength" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ prismLength }} birim</span>
              </div>
            </div>
            
            <div>
              <label class="block mb-2">Genişlik (b):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementPrismWidth" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="prismWidth" 
                  min="1" 
                  max="10" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementPrismWidth" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ prismWidth }} birim</span>
              </div>
            </div>
            
            <div>
              <label class="block mb-2">Yükseklik (h):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementPrismHeight" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="prismHeight" 
                  min="1" 
                  max="10" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementPrismHeight" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ prismHeight }} birim</span>
                <span>Hacim: {{ prismVolume }} birim³</span>
              </div>
            </div>
            
            <div class="bg-gray-700 p-3 rounded-md">
              <h3 class="font-semibold mb-2">Dikdörtgen Prizma Hacim Formülü:</h3>
              <p class="text-lg">V = a × b × h</p>
              <div class="mt-2 space-y-1">
                <p>V = {{ prismLength }} × {{ prismWidth }} × {{ prismHeight }}</p>
                <p>V = {{ prismVolume }} birim³</p>
              </div>
            </div>
          </div>
          
          <!-- Silindir Ayarları -->
          <div v-if="selectedShape === 'cylinder'" class="space-y-4">
            <div>
              <label class="block mb-2">Taban Yarıçapı (r):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementCylinderRadius" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="cylinderRadius" 
                  min="0.5" 
                  max="5" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementCylinderRadius" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ cylinderRadius }} birim</span>
              </div>
            </div>
            
            <div>
              <label class="block mb-2">Yükseklik (h):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementCylinderHeight" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="cylinderHeight" 
                  min="1" 
                  max="10" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementCylinderHeight" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ cylinderHeight }} birim</span>
                <span>Hacim: {{ cylinderVolume }} birim³</span>
              </div>
            </div>
            
            <div class="bg-gray-700 p-3 rounded-md">
              <h3 class="font-semibold mb-2">Silindir Hacim Formülü:</h3>
              <p class="text-lg">V = π × r² × h</p>
              <div class="mt-2 space-y-1">
                <p>V = π × {{ cylinderRadius }}² × {{ cylinderHeight }}</p>
                <p>V = π × {{ (cylinderRadius * cylinderRadius).toFixed(2) }} × {{ cylinderHeight }}</p>
                <p>V = {{ cylinderVolume }} birim³</p>
              </div>
            </div>
          </div>
          
          <!-- Küre Ayarları -->
          <div v-if="selectedShape === 'sphere'" class="space-y-4">
            <div>
              <label class="block mb-2">Yarıçap (r):</label>
              <div class="flex items-center space-x-2">
                <button 
                  @click="decrementSphereRadius" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">-</span>
                </button>
                <input 
                  type="range" 
                  v-model="sphereRadius" 
                  min="0.5" 
                  max="5" 
                  step="0.1"
                  class="flex-grow"
                >
                <button 
                  @click="incrementSphereRadius" 
                  class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded-md flex items-center justify-center"
                >
                  <span class="text-lg">+</span>
                </button>
              </div>
              <div class="flex justify-between mt-1">
                <span>{{ sphereRadius }} birim</span>
                <span>Hacim: {{ sphereVolume }} birim³</span>
              </div>
            </div>
            
            <div class="bg-gray-700 p-3 rounded-md">
              <h3 class="font-semibold mb-2">Küre Hacim Formülü:</h3>
              <p class="text-lg">V = (4/3) × π × r³</p>
              <div class="mt-2 space-y-1">
                <p>V = (4/3) × π × {{ sphereRadius }}³</p>
                <p>V = (4/3) × π × {{ (sphereRadius ** 3).toFixed(2) }}</p>
                <p>V = {{ sphereVolume }} birim³</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Durum değişkenleri
const selectedShape = ref('cube');

// Küp değişkenleri
const cubeSize = ref(5);
const incrementCubeSize = () => {
  if (cubeSize.value < 10) {
    cubeSize.value = parseFloat((cubeSize.value + 0.1).toFixed(1));
  }
};
const decrementCubeSize = () => {
  if (cubeSize.value > 1) {
    cubeSize.value = parseFloat((cubeSize.value - 0.1).toFixed(1));
  }
};

// Prizma değişkenleri
const prismLength = ref(5);
const prismWidth = ref(3);
const prismHeight = ref(4);

const incrementPrismLength = () => {
  if (prismLength.value < 10) {
    prismLength.value = parseFloat((prismLength.value + 0.1).toFixed(1));
  }
};
const decrementPrismLength = () => {
  if (prismLength.value > 1) {
    prismLength.value = parseFloat((prismLength.value - 0.1).toFixed(1));
  }
};

const incrementPrismWidth = () => {
  if (prismWidth.value < 10) {
    prismWidth.value = parseFloat((prismWidth.value + 0.1).toFixed(1));
  }
};
const decrementPrismWidth = () => {
  if (prismWidth.value > 1) {
    prismWidth.value = parseFloat((prismWidth.value - 0.1).toFixed(1));
  }
};

const incrementPrismHeight = () => {
  if (prismHeight.value < 10) {
    prismHeight.value = parseFloat((prismHeight.value + 0.1).toFixed(1));
  }
};
const decrementPrismHeight = () => {
  if (prismHeight.value > 1) {
    prismHeight.value = parseFloat((prismHeight.value - 0.1).toFixed(1));
  }
};

// Silindir değişkenleri
const cylinderRadius = ref(2.5);
const cylinderHeight = ref(5);

const incrementCylinderRadius = () => {
  if (cylinderRadius.value < 5) {
    cylinderRadius.value = parseFloat((cylinderRadius.value + 0.1).toFixed(1));
  }
};
const decrementCylinderRadius = () => {
  if (cylinderRadius.value > 0.5) {
    cylinderRadius.value = parseFloat((cylinderRadius.value - 0.1).toFixed(1));
  }
};

const incrementCylinderHeight = () => {
  if (cylinderHeight.value < 10) {
    cylinderHeight.value = parseFloat((cylinderHeight.value + 0.1).toFixed(1));
  }
};
const decrementCylinderHeight = () => {
  if (cylinderHeight.value > 1) {
    cylinderHeight.value = parseFloat((cylinderHeight.value - 0.1).toFixed(1));
  }
};

// Küre değişkenleri
const sphereRadius = ref(3);
const incrementSphereRadius = () => {
  if (sphereRadius.value < 5) {
    sphereRadius.value = parseFloat((sphereRadius.value + 0.1).toFixed(1));
  }
};
const decrementSphereRadius = () => {
  if (sphereRadius.value > 0.5) {
    sphereRadius.value = parseFloat((sphereRadius.value - 0.1).toFixed(1));
  }
};

// Hacim hesaplamaları
const cubeVolume = computed(() => {
  return (cubeSize.value ** 3).toFixed(2);
});

const prismVolume = computed(() => {
  return (prismLength.value * prismWidth.value * prismHeight.value).toFixed(2);
});

const cylinderVolume = computed(() => {
  return (Math.PI * cylinderRadius.value ** 2 * cylinderHeight.value).toFixed(2);
});

const sphereVolume = computed(() => {
  return ((4/3) * Math.PI * sphereRadius.value ** 3).toFixed(2);
});

// Three.js değişkenleri
const threeContainer = ref(null);
let scene, camera, renderer, controls;
let currentShape;

// Three.js kurulumu
const setupThree = () => {
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1f2937); // bg-gray-800
  
  // Kamera oluştur
  const aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = 15;
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);
  
  // Kontroller ekle (fare ile döndürme)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  
  // Zemin ekle
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
  gridHelper.position.y = -5;
  scene.add(gridHelper);
  
  // Duvarlar ekle
  createWalls();
  
  // Şekli oluştur
  createShape();
  
  // Animasyon döngüsü
  const animate = () => {
    requestAnimationFrame(animate);
    
    if (currentShape) {
      currentShape.rotation.y += 0.005;
    }
    
    controls.update();
    renderer.render(scene, camera);
  };
  
  animate();
};

// Duvarlar oluştur
const createWalls = () => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  
  // Taban
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    wallMaterial
  );
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -5;
  scene.add(floor);
  
  // Tavan
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    wallMaterial
  );
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = 5;
  scene.add(ceiling);
  
  // Arka duvar
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 10),
    wallMaterial
  );
  backWall.position.z = -10;
  scene.add(backWall);
  
  // Sağ duvar
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 10),
    wallMaterial
  );
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.x = 10;
  scene.add(rightWall);
  
  // Sol duvar
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 10),
    wallMaterial
  );
  leftWall.rotation.y = -Math.PI / 2;
  leftWall.position.x = -10;
  scene.add(leftWall);
};

// Şekil oluşturma fonksiyonu
const createShape = () => {
  // Eğer önceki şekil varsa, onu kaldır
  if (currentShape) {
    scene.remove(currentShape);
  }
  
  if (selectedShape.value === 'cube') {
    // Küp oluştur
    const geometry = new THREE.BoxGeometry(
      cubeSize.value,
      cubeSize.value,
      cubeSize.value
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // bg-blue-500
      metalness: 0.3,
      roughness: 0.4,
    });
    currentShape = new THREE.Mesh(geometry, material);
    
    // Kenarları göster
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    currentShape.add(wireframe);
    
  } else if (selectedShape.value === 'prism') {
    // Dikdörtgen prizma oluştur
    const geometry = new THREE.BoxGeometry(
      prismWidth.value,
      prismHeight.value,
      prismLength.value
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x10b981, // bg-green-500
      metalness: 0.3,
      roughness: 0.4,
    });
    currentShape = new THREE.Mesh(geometry, material);
    
    // Kenarları göster
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x059669, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    currentShape.add(wireframe);
    
  } else if (selectedShape.value === 'cylinder') {
    // Silindir oluştur
    const geometry = new THREE.CylinderGeometry(
      cylinderRadius.value,
      cylinderRadius.value,
      cylinderHeight.value,
      32
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // bg-purple-500
      metalness: 0.3,
      roughness: 0.4,
    });
    currentShape = new THREE.Mesh(geometry, material);
    
    // Kenarları göster
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x7c3aed, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    currentShape.add(wireframe);
  } else if (selectedShape.value === 'sphere') {
    // Küre oluştur
    const geometry = new THREE.SphereGeometry(
      sphereRadius.value,
      32,
      32
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0xef4444, // bg-red-500
      metalness: 0.3,
      roughness: 0.4,
    });
    currentShape = new THREE.Mesh(geometry, material);
    
    // Küre için wireframe ekle
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xdc2626, // bg-red-600
      transparent: true,
      opacity: 0.5
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    currentShape.add(wireframe);
  }
  
  scene.add(currentShape);
};

// Pencere boyutu değiştiğinde renderer'ı güncelle
const handleResize = () => {
  if (renderer && camera) {
    const width = threeContainer.value.clientWidth;
    const height = threeContainer.value.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  }
};

// Şekil değişikliklerini izle
watch([selectedShape, cubeSize, prismLength, prismWidth, prismHeight, cylinderRadius, cylinderHeight, sphereRadius], () => {
  if (scene) {
    createShape();
  }
});

onMounted(() => {
  setupThree();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (renderer) {
    renderer.dispose();
    if (threeContainer.value && threeContainer.value.contains(renderer.domElement)) {
      threeContainer.value.removeChild(renderer.domElement);
    }
  }
});

// Yeni durum değişkenleri
const showMobileSettings = ref(false);

// Kamera kontrol fonksiyonları
const resetCamera = () => {
  if (camera && controls) {
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    controls.reset();
  }
};

const setTopView = () => {
  if (camera && controls) {
    camera.position.set(0, 15, 0);
    camera.lookAt(0, 0, 0);
    controls.update();
  }
};

const setFrontView = () => {
  if (camera && controls) {
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);
    controls.update();
  }
};

const setSideView = () => {
  if (camera && controls) {
    camera.position.set(15, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.update();
  }
};

const setIsometricView = () => {
  if (camera && controls) {
    camera.position.set(8.66, 8.66, 8.66);
    camera.lookAt(0, 0, 0);
    controls.update();
  }
};

// Arkaplan rengi değiştirme fonksiyonu
const setBackgroundColor = (color) => {
  if (scene) {
    scene.background = new THREE.Color(color);
  }
};
</script>
  
<style scoped>
/* Mobil ayarlar paneli için overlay */
.settings-overlay {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
  
 
 