<template>
  <div class="w-full min-h-screen bg-gray-900 flex flex-col items-center">

    <!-- Main content: 3D viewer and controls -->
    <div class="w-full flex flex-col md:flex-row flex-1 relative">
      <!-- 3D Viewer container -->
      <div class="flex-1 relative">
        <div id="molecule-container" class="w-full h-screen"></div>
        
        <!-- Mobil ayarlar butonu -->
        <button 
          @click="showMobileSettings = !showMobileSettings" 
          class="md:hidden absolute top-4 left-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        <!-- Animasyon kontrol butonu -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2">
          <!-- <button 
            v-if="!isAnimating" 
            @click="startAnimation" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors"
          >
            Başlat
          </button>
          <button 
            v-else 
            @click="stopAnimation" 
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors"
          >
            Durdur
          </button> -->

          <!-- Bileşik seçimi -->
          <select 
            v-model="selectedMolecule" 
            @change="loadMolecule"
            class="md:hidden bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="molecule in molecules" :key="molecule.id" :value="molecule.id">
              {{ molecule.name }}
            </option>
          </select>
        </div>
        
        <!-- Loading indicator -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div class="text-white text-xl">Yükleniyor...</div>
        </div>
      </div>
      
      <!-- Mobile settings modal -->
      <div v-if="showMobileSettings" class="md:hidden fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" @click.self="showMobileSettings = false">
        <div class="bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[66vh] overflow-y-auto p-4 text-white">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Ayarlar</h2>
            <button @click="showMobileSettings = false" class="text-gray-300 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Mobile Control Panel Content -->
          <div class="control-panel-content">
            <!-- Molecule type indicator -->
            <div class="mb-4 p-3 rounded-md" :class="moleculeTypeClass">
              <div class="font-bold text-center">{{ moleculeTypeText }}</div>
              <div class="text-xs text-center mt-1">{{ currentMolecule.name }}</div>
            </div>
            
            <!-- Molecule selection -->
            <div class="mb-4">
              <label class="block mb-2">Bileşik Seçimi</label>
              <select 
                v-model="selectedMolecule" 
                @change="loadMolecule"
                class="w-full p-2 bg-gray-700 rounded-md border border-gray-600"
              >
                <option v-for="molecule in molecules" :key="molecule.id" :value="molecule.id">
                  {{ molecule.name }}
                </option>
              </select>
            </div>
            

            <!-- Rotation controls -->
            <div class="mb-4">
              <label class="block mb-2">Otomatik Döndürme</label>
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  v-model="autoRotate" 
                  @change="toggleAutoRotation"
                  class="mr-2"
                >
                <span>Aktif</span>
              </div>
            </div>
            
            <!-- Rotation speed -->
            <div class="mb-4" v-if="autoRotate">
              <label class="block mb-2">Döndürme Hızı</label>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                v-model.number="rotationSpeed" 
                @input="updateRotationSpeed"
                class="w-full"
              >
              <div class="flex justify-between text-xs">
                <span>Yavaş</span>
                <span>Hızlı</span>
              </div>
            </div>
            
            <!-- Background color -->
            <div class="mb-4">
              <label class="block mb-2">Arka Plan Rengi</label>
              <div class="grid grid-cols-4 gap-2">
                <div 
                  v-for="color in backgroundColors" 
                  :key="color.value"
                  :style="{ backgroundColor: color.value }" 
                  @click="changeBackgroundColor(color.value)"
                  class="w-8 h-8 rounded-full cursor-pointer border border-gray-600"
                  :class="{ 'ring-2 ring-blue-500': backgroundColor === color.value }"
                ></div>
              </div>
            </div>
            
            <!-- Reset view button -->
            <button 
              @click="resetView" 
              class="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Görünümü Sıfırla
            </button>
            
            <!-- Reset settings button - if settings are changed -->
            <button 
              v-if="settingsChanged"
              @click="resetSettings" 
              class="w-full py-2 mt-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
            >
              Ayarları Sıfırla
            </button>
          </div>
        </div>
      </div>
      
      <!-- Desktop Control panel -->
      <div class="hidden md:block w-80 bg-gray-800 p-4 text-white overflow-y-auto" style="max-height: 100vh;">
        <h2 class="text-xl font-bold mb-4">Kontrol Paneli</h2>
        
        <!-- Molecule type indicator -->
        <div class="mb-4 p-3 rounded-md" :class="moleculeTypeClass">
          <div class="font-bold text-center">{{ moleculeTypeText }}</div>
          <div class="text-xs text-center mt-1">{{ currentMolecule.name }}</div>
        </div>
        
        <!-- Molecule selection -->
        <div class="mb-4">
          <label class="block mb-2">Bileşik Seçimi</label>
          <select 
            v-model="selectedMolecule" 
            @change="loadMolecule"
            class="w-full p-2 bg-gray-700 rounded-md border border-gray-600"
          >
            <option v-for="molecule in molecules" :key="molecule.id" :value="molecule.id">
              {{ molecule.name }}
            </option>
          </select>
        </div>
        
        
        <!-- Rotation controls -->
        <div class="mb-4">
          <label class="block mb-2">Otomatik Döndürme</label>
          <div class="flex items-center">
            <input 
              type="checkbox" 
              v-model="autoRotate" 
              @change="toggleAutoRotation"
              class="mr-2"
            >
            <span>Aktif</span>
          </div>
        </div>
        
        <!-- Rotation speed -->
        <div class="mb-4" v-if="autoRotate">
          <label class="block mb-2">Döndürme Hızı</label>
          <input 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.1" 
            v-model.number="rotationSpeed" 
            @input="updateRotationSpeed"
            class="w-full"
          >
          <div class="flex justify-between text-xs">
            <span>Yavaş</span>
            <span>Hızlı</span>
          </div>
        </div>
        
        <!-- Background color -->
        <div class="mb-4">
          <label class="block mb-2">Arka Plan Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <div 
              v-for="color in backgroundColors" 
              :key="color.value"
              :style="{ backgroundColor: color.value }" 
              @click="changeBackgroundColor(color.value)"
              class="w-8 h-8 rounded-full cursor-pointer border border-gray-600"
              :class="{ 'ring-2 ring-blue-500': backgroundColor === color.value }"
            ></div>
          </div>
        </div>
        
        <!-- Reset view button -->
        <button 
          @click="resetView" 
          class="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Görünümü Sıfırla
        </button>
        
        <!-- Reset settings button - if settings are changed -->
        <button 
          v-if="settingsChanged"
          @click="resetSettings" 
          class="w-full py-2 mt-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
        >
          Ayarları Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// State variables
const loading = ref(true);
const selectedMolecule = ref('h2o');
const visualStyle = ref('space-filling');
const autoRotate = ref(true);
const rotationSpeed = ref(1);
const backgroundColor = ref('#1a202c'); // Default bg color (gray-900)
const showMobileSettings = ref(false); // Mobil ayarlar modalı için durum
const isAnimating = ref(true); // Animasyon durumu
const initialSettings = {
  molecule: 'h2o',
  style: 'space-filling',
  rotate: true,
  speed: 1,
  bgColor: '#1a202c'
};

// Ayarların değişip değişmediğini takip et
const settingsChanged = computed(() => {
  return selectedMolecule.value !== initialSettings.molecule ||
    visualStyle.value !== initialSettings.style ||
    autoRotate.value !== initialSettings.rotate ||
    rotationSpeed.value !== initialSettings.speed ||
    backgroundColor.value !== initialSettings.bgColor;
});

// Available molecules
const molecules = ref([
  // Element molekülleri
  { id: 'h2', name: 'Hidrojen (H₂)', type: 'element' },
  { id: 'o2', name: 'Oksijen (O₂)', type: 'element' },
  { id: 'n2', name: 'Azot (N₂)', type: 'element' },
  { id: 'cl2', name: 'Klor (Cl₂)', type: 'element' },
  { id: 'p4', name: 'Fosfor (P₄)', type: 'element' },
  { id: 's8', name: 'Kükürt (S₈)', type: 'element' },
  
  // Bileşik molekülleri
  { id: 'h2o', name: 'Su (H₂O)', type: 'compound' },
  { id: 'co2', name: 'Karbondioksit (CO₂)', type: 'compound' },
  { id: 'c6h6', name: 'Benzen (C₆H₆)', type: 'compound' },
  { id: 'nh3', name: 'Amonyak (NH₃)', type: 'compound' },
  { id: 'ch4', name: 'Metan (CH₄)', type: 'compound' },
  { id: 'caffeine', name: 'Kafein (C₈H₁₀N₄O₂)', type: 'compound' },
  { id: 'ethanol', name: 'Etanol (C₂H₅OH)', type: 'compound' },
  { id: 'acetic_acid', name: 'Asetik Asit (CH₃COOH)', type: 'compound' },
  { id: 'o3', name: 'Ozon (O₃)', type: 'compound' },
  { id: 'nh4', name: 'Amonyum (NH₄⁺)', type: 'compound' },
  { id: 'aspirin', name: 'Aspirin (C₉H₈O₄)', type: 'compound' },
  { id: 'nacl', name: 'Sodyum Klorür (NaCl)', type: 'compound' },
  { id: 'h2so4', name: 'Sülfürik Asit (H₂SO₄)', type: 'compound' },
]);

// Background color options
const backgroundColors = [
  { name: 'Siyah', value: '#000000' },
  { name: 'Koyu Gri', value: '#1a202c' },
  { name: 'Lacivert', value: '#1e3a8a' },
  { name: 'Koyu Yeşil', value: '#064e3b' },
];

// Three.js variables
let scene, camera, renderer, controls;
let moleculeGroup;

// Bond connections for each molecule
const bondConnections = {
  // Element molekülleri
  'h2': [[0, 1]],
  'o2': [[0, 1]],
  'n2': [[0, 1]],
  'cl2': [[0, 1]],
  'p4': [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]], // Tetrahedral
  's8': [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]], // Ring
  
  // Bileşik molekülleri
  'h2o': [[0, 1], [0, 2]],
  'co2': [[0, 1], [0, 2]],
  'c6h6': [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],  // Karbon halkası
    [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]  // C-H bağları
  ],
  'nh3': [[0, 1], [0, 2], [0, 3]],
  'ch4': [[0, 1], [0, 2], [0, 3], [0, 4]],
  'caffeine': [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [4, 6], [2, 7], [7, 8], [8, 9], [7, 10], [5, 11], [1, 12],
    [10, 13], [10, 14], [11, 15], [11, 16], [11, 17], [12, 18], [12, 19], [12, 20]
  ],
  'ethanol': [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8]],
  'acetic_acid': [[0, 1], [1, 2], [1, 3], [0, 4], [0, 5], [0, 6], [3, 7]],
  'o3': [[0, 1], [0, 2]],
  'nh4': [[0, 1], [0, 2], [0, 3], [0, 4]],
  'aspirin': [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [3, 6], [6, 7], [6, 8], [8, 9], [9, 10], [10, 11], [10, 12],
    [0, 13], [1, 14], [2, 15], [4, 16], [5, 17], [7, 18], [9, 19], [11, 20]
  ],
  'nacl': [[0, 1]],
  'h2so4': [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6]]
};

// Hesaplanmış özellikler
const currentMolecule = computed(() => {
  return molecules.value.find(molecule => molecule.id === selectedMolecule.value) || molecules.value[0];
});

const moleculeTypeText = computed(() => {
  if (currentMolecule.value.type === 'element') {
    return 'ELEMENT MOLEKÜLÜ';
  } else {
    return 'BİLEŞİK MOLEKÜLÜ';
  }
});

const moleculeTypeClass = computed(() => {
  if (currentMolecule.value.type === 'element') {
    return 'bg-blue-700';
  } else {
    return 'bg-green-700';
  }
});

onMounted(() => {
  initThreeJs();
  loadMolecule();
  animate();
  
  // Responsive handling
  window.addEventListener('resize', onWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (renderer) {
    renderer.dispose();
  }
});

function initThreeJs() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor.value);
  
  // Create camera
  camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  camera.position.z = 5;
  
  // Create renderer
  const container = document.getElementById('molecule-container');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Add controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.autoRotate = autoRotate.value;
  controls.autoRotateSpeed = rotationSpeed.value * 2;
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Create room (walls, ceiling, floor)
  createRoom();
  
  // Create a group for the molecule
  moleculeGroup = new THREE.Group();
  scene.add(moleculeGroup);
}

function createRoom() {
  const roomSize = 20;
  const roomColor = new THREE.Color(backgroundColor.value);
  
  // Create a box with walls that face inward
  const wallGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
  const wallMaterial = new THREE.MeshBasicMaterial({ 
    color: roomColor,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.2
  });
  
  const room = new THREE.Mesh(wallGeometry, wallMaterial);
  scene.add(room);
}

function onWindowResize() {
  const container = document.getElementById('molecule-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function loadMolecule() {
  loading.value = true;
  
  // Clear current molecule
  while (moleculeGroup.children.length > 0) {
    const object = moleculeGroup.children[0];
    moleculeGroup.remove(object);
  }
  
  // Define molecule structures
  const moleculeStructures = {
    // Element molekülleri
    'h2': [
      { element: 'H', position: [-0.37, 0, 0], color: 0xffffff },
      { element: 'H', position: [0.37, 0, 0], color: 0xffffff }
    ],
    'o2': [
      { element: 'O', position: [-0.6, 0, 0], color: 0xff0000 },
      { element: 'O', position: [0.6, 0, 0], color: 0xff0000 }
    ],
    'n2': [
      { element: 'N', position: [-0.6, 0, 0], color: 0x3050f8 },
      { element: 'N', position: [0.6, 0, 0], color: 0x3050f8 }
    ],
    'cl2': [
      { element: 'Cl', position: [-1.0, 0, 0], color: 0x1ff01f },
      { element: 'Cl', position: [1.0, 0, 0], color: 0x1ff01f }
    ],
    'p4': [
      // Fosfor tetrahedral yapı
      { element: 'P', position: [0.6, 0.6, 0.6], color: 0xff8000 },
      { element: 'P', position: [-0.6, -0.6, 0.6], color: 0xff8000 },
      { element: 'P', position: [-0.6, 0.6, -0.6], color: 0xff8000 },
      { element: 'P', position: [0.6, -0.6, -0.6], color: 0xff8000 }
    ],
    's8': [
      // Kükürt sekizgen yapı (basitleştirilmiş)
      { element: 'S', position: [1.0, 0.0, 0.0], color: 0xffff00 },
      { element: 'S', position: [0.7, 0.7, 0.0], color: 0xffff00 },
      { element: 'S', position: [0.0, 1.0, 0.0], color: 0xffff00 },
      { element: 'S', position: [-0.7, 0.7, 0.0], color: 0xffff00 },
      { element: 'S', position: [-1.0, 0.0, 0.0], color: 0xffff00 },
      { element: 'S', position: [-0.7, -0.7, 0.0], color: 0xffff00 },
      { element: 'S', position: [0.0, -1.0, 0.0], color: 0xffff00 },
      { element: 'S', position: [0.7, -0.7, 0.0], color: 0xffff00 }
    ],
    
    // Bileşik molekülleri
    'h2o': [
      { element: 'O', position: [0, 0, 0], color: 0xff0000 },
      { element: 'H', position: [-0.757, 0.586, 0], color: 0xffffff },
      { element: 'H', position: [0.757, 0.586, 0], color: 0xffffff }
    ],
    'co2': [
      { element: 'C', position: [0, 0, 0], color: 0x333333 },
      { element: 'O', position: [-1.16, 0, 0], color: 0xff0000 },
      { element: 'O', position: [1.16, 0, 0], color: 0xff0000 }
    ],
    'c6h6': [
      // Benzen düzlemsel bir moleküldür
      { element: 'C', position: [0, 0, 1.39], color: 0x333333 },
      { element: 'C', position: [1.204, 0, 0.695], color: 0x333333 },
      { element: 'C', position: [1.204, 0, -0.695], color: 0x333333 },
      { element: 'C', position: [0, 0, -1.39], color: 0x333333 },
      { element: 'C', position: [-1.204, 0, -0.695], color: 0x333333 },
      { element: 'C', position: [-1.204, 0, 0.695], color: 0x333333 },
      { element: 'H', position: [0, 0, 2.48], color: 0xffffff },
      { element: 'H', position: [2.147, 0, 1.24], color: 0xffffff },
      { element: 'H', position: [2.147, 0, -1.24], color: 0xffffff },
      { element: 'H', position: [0, 0, -2.48], color: 0xffffff },
      { element: 'H', position: [-2.147, 0, -1.24], color: 0xffffff },
      { element: 'H', position: [-2.147, 0, 1.24], color: 0xffffff }
    ],
    'nh3': [
      // Amonyak piramidal bir moleküldür
      { element: 'N', position: [0, 0, 0], color: 0x3050f8 },
      { element: 'H', position: [0.942, 0.0, 0.333], color: 0xffffff },
      { element: 'H', position: [-0.471, 0.816, 0.333], color: 0xffffff },
      { element: 'H', position: [-0.471, -0.816, 0.333], color: 0xffffff }
    ],
    'ch4': [
      // Metan tetrahedral bir moleküldür
      { element: 'C', position: [0, 0, 0], color: 0x333333 },
      { element: 'H', position: [0.635, 0.635, 0.635], color: 0xffffff },
      { element: 'H', position: [-0.635, -0.635, 0.635], color: 0xffffff },
      { element: 'H', position: [0.635, -0.635, -0.635], color: 0xffffff },
      { element: 'H', position: [-0.635, 0.635, -0.635], color: 0xffffff }
    ],
    'caffeine': [
      // Basitleştirilmiş kafein molekülü
      { element: 'C', position: [0, 0, 0], color: 0x333333 },
      { element: 'C', position: [1.4, 0, 0], color: 0x333333 },
      { element: 'C', position: [2.1, 1.2, 0], color: 0x333333 },
      { element: 'N', position: [1.4, 2.4, 0], color: 0x3050f8 },
      { element: 'C', position: [0, 2.4, 0], color: 0x333333 },
      { element: 'N', position: [-0.7, 1.2, 0], color: 0x3050f8 },
      { element: 'O', position: [-0.7, 3.5, 0], color: 0xff0000 },
      { element: 'N', position: [3.5, 1.2, 0], color: 0x3050f8 },
      { element: 'C', position: [4.2, 0, 0], color: 0x333333 },
      { element: 'O', position: [5.4, 0, 0], color: 0xff0000 },
      { element: 'C', position: [4.2, 2.4, 0], color: 0x333333 },
      { element: 'C', position: [-2.1, 1.2, 0], color: 0x333333 },
      { element: 'C', position: [3.5, -1.2, 0], color: 0x333333 },
      { element: 'H', position: [5.3, 2.4, 0], color: 0xffffff },
      { element: 'H', position: [3.9, 3.5, 0], color: 0xffffff },
      { element: 'H', position: [-2.4, 0.2, 0], color: 0xffffff },
      { element: 'H', position: [-2.4, 1.8, 0.9], color: 0xffffff },
      { element: 'H', position: [-2.4, 1.8, -0.9], color: 0xffffff },
      { element: 'H', position: [3.9, -2.0, 0.6], color: 0xffffff },
      { element: 'H', position: [3.9, -2.0, -0.6], color: 0xffffff },
      { element: 'H', position: [2.5, -1.2, 0], color: 0xffffff }
    ],
    // Yeni eklenen moleküller
    'ethanol': [
      // Etanol - C₂H₅OH
      { element: 'C', position: [0, 0, 0], color: 0x333333 },
      { element: 'C', position: [1.54, 0, 0], color: 0x333333 },
      { element: 'O', position: [2.0, 1.34, 0], color: 0xff0000 },
      { element: 'H', position: [-0.4, 0.9, 0], color: 0xffffff },
      { element: 'H', position: [-0.4, -0.55, 0.8], color: 0xffffff },
      { element: 'H', position: [-0.4, -0.55, -0.8], color: 0xffffff },
      { element: 'H', position: [1.94, -0.5, 0.9], color: 0xffffff },
      { element: 'H', position: [1.94, -0.5, -0.9], color: 0xffffff },
      { element: 'H', position: [2.95, 1.35, 0], color: 0xffffff }
    ],
    'acetic_acid': [
      // Asetik Asit - CH₃COOH
      { element: 'C', position: [0, 0, 0], color: 0x333333 },
      { element: 'C', position: [1.5, 0, 0], color: 0x333333 },
      { element: 'O', position: [2.0, 1.1, 0], color: 0xff0000 },
      { element: 'O', position: [2.2, -1.1, 0], color: 0xff0000 },
      { element: 'H', position: [-0.4, 0.9, 0], color: 0xffffff },
      { element: 'H', position: [-0.4, -0.5, 0.9], color: 0xffffff },
      { element: 'H', position: [-0.4, -0.5, -0.9], color: 0xffffff },
      { element: 'H', position: [3.15, -0.8, 0], color: 0xffffff }
    ],
    'o2': [
      // Oksijen molekülü - O₂
      { element: 'O', position: [-0.6, 0, 0], color: 0xff0000 },
      { element: 'O', position: [0.6, 0, 0], color: 0xff0000 }
    ],
    'n2': [
      // Azot molekülü - N₂
      { element: 'N', position: [-0.6, 0, 0], color: 0x3050f8 },
      { element: 'N', position: [0.6, 0, 0], color: 0x3050f8 }
    ],
    'o3': [
      // Ozon molekülü - O₃
      { element: 'O', position: [0, 0, 0], color: 0xff0000 },
      { element: 'O', position: [1.1, 0.6, 0], color: 0xff0000 },
      { element: 'O', position: [-1.1, 0.6, 0], color: 0xff0000 }
    ],
    'nh4': [
      // Amonyum iyonu - NH₄⁺
      { element: 'N', position: [0, 0, 0], color: 0x3050f8 },
      { element: 'H', position: [0.6, 0.6, 0.6], color: 0xffffff },
      { element: 'H', position: [-0.6, -0.6, 0.6], color: 0xffffff },
      { element: 'H', position: [0.6, -0.6, -0.6], color: 0xffffff },
      { element: 'H', position: [-0.6, 0.6, -0.6], color: 0xffffff }
    ],
    'aspirin': [
      // Aspirin (Asetilsalisilik asit) - C₉H₈O₄
      { element: 'C', position: [0, 0, 0], color: 0x333333 },
      { element: 'C', position: [1.4, 0, 0], color: 0x333333 },
      { element: 'C', position: [2.1, 1.2, 0], color: 0x333333 },
      { element: 'C', position: [1.4, 2.4, 0], color: 0x333333 },
      { element: 'C', position: [0, 2.4, 0], color: 0x333333 },
      { element: 'C', position: [-0.7, 1.2, 0], color: 0x333333 },
      { element: 'C', position: [2.1, 3.6, 0], color: 0x333333 },
      { element: 'O', position: [1.4, 4.8, 0], color: 0xff0000 },
      { element: 'O', position: [3.5, 3.6, 0], color: 0xff0000 },
      { element: 'C', position: [4.2, 4.8, 0], color: 0x333333 },
      { element: 'C', position: [5.6, 4.8, 0], color: 0x333333 },
      { element: 'O', position: [6.3, 5.8, 0], color: 0xff0000 },
      { element: 'O', position: [6.0, 3.6, 0], color: 0xff0000 },
      { element: 'H', position: [-0.5, -0.9, 0], color: 0xffffff },
      { element: 'H', position: [1.9, -0.9, 0], color: 0xffffff },
      { element: 'H', position: [3.2, 1.2, 0], color: 0xffffff },
      { element: 'H', position: [-0.5, 3.3, 0], color: 0xffffff },
      { element: 'H', position: [-1.8, 1.2, 0], color: 0xffffff },
      { element: 'H', position: [1.9, 5.7, 0], color: 0xffffff },
      { element: 'H', position: [3.7, 5.7, 0], color: 0xffffff },
      { element: 'H', position: [7.2, 5.7, 0], color: 0xffffff }
    ],
    'nacl': [
      // Sodyum Klorür (NaCl) - İyonik bağ
      { element: 'Na', position: [-1.0, 0, 0], color: 0xab5cf2 }, // Sodyum için mor renk
      { element: 'Cl', position: [1.0, 0, 0], color: 0x1ff01f }   // Klor için yeşil renk
    ],
    'h2so4': [
      // Sülfürik Asit (H₂SO₄)
      { element: 'S', position: [0, 0, 0], color: 0xffff00 },
      { element: 'O', position: [1.2, 0.6, 0], color: 0xff0000 },
      { element: 'O', position: [-1.2, 0.6, 0], color: 0xff0000 },
      { element: 'O', position: [0, -1.2, 0.6], color: 0xff0000 },
      { element: 'O', position: [0, 1.2, -0.6], color: 0xff0000 },
      { element: 'H', position: [1.7, 1.5, 0], color: 0xffffff },
      { element: 'H', position: [-1.7, 1.5, 0], color: 0xffffff }
    ]
  };
  
  // Create the selected molecule
  const selectedMoleculeData = moleculeStructures[selectedMolecule.value];
  
  if (selectedMoleculeData) {
    // Create atoms
    selectedMoleculeData.forEach(atom => {
      let radius;
      
      // Different atom sizes - daha gerçekçi atom yarıçapları (Van der Waals)
      switch(atom.element) {
        case 'H': radius = 0.25; break;
        case 'C': radius = 0.67; break;
        case 'N': radius = 0.65; break;
        case 'O': radius = 0.60; break;
        case 'S': radius = 1.00; break;
        case 'P': radius = 1.00; break;
        case 'Cl': radius = 0.99; break;
        case 'F': radius = 0.50; break;
        case 'Na': radius = 1.16; break; // Sodyum atom yarıçapı
        default: radius = 0.7;
      }
      
      // Görselleştirme stiline göre yarıçap ayarlaması
      if (visualStyle.value === 'space-filling') {
        radius *= 1.5;  // Uzay dolduran model
      } else if (visualStyle.value === 'wireframe') {
        radius *= 0.8;  // Tel kafes modeli
      } else {
        radius *= 0.5;  // Top-çubuk modeli için atom boyutunu küçült
      }
      
      // Create atom sphere
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      let material;
      
      if (visualStyle.value === 'wireframe') {
        material = new THREE.MeshBasicMaterial({ 
          color: atom.color, 
          wireframe: true
        });
      } else {
        material = new THREE.MeshPhongMaterial({ 
          color: atom.color,
          shininess: 90,
          specular: 0x444444
        });
      }
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      moleculeGroup.add(sphere);
    });
    
    // Create bonds (except for space-filling style)
    if (visualStyle.value !== 'space-filling') {
      // Define bonds for each molecule
      const currentBonds = bondConnections[selectedMolecule.value];
      
      if (currentBonds) {
        currentBonds.forEach(connection => {
          const atom1 = selectedMoleculeData[connection[0]];
          const atom2 = selectedMoleculeData[connection[1]];
          
          // Calculate bond position and rotation
          const start = new THREE.Vector3(...atom1.position);
          const end = new THREE.Vector3(...atom2.position);
          const direction = new THREE.Vector3().subVectors(end, start);
          const length = direction.length();
          
          // Create bond cylinder (daha ince bağlar)
          const bondGeometry = new THREE.CylinderGeometry(0.07, 0.07, length, 8);
          
          // Rotate cylinder to connect the atoms
          bondGeometry.translate(0, length / 2, 0);
          bondGeometry.rotateX(Math.PI / 2);
          
          const bondMaterial = visualStyle.value === 'wireframe' 
            ? new THREE.MeshBasicMaterial({ color: 0xdddddd, wireframe: true })
            : new THREE.MeshPhongMaterial({ color: 0xcccccc });
            
          const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);
          
          // Position the bond
          bondMesh.position.copy(start);
          
          // Orient the bond to point to the end atom
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
          );
          bondMesh.setRotationFromQuaternion(quaternion);
          
          moleculeGroup.add(bondMesh);
        });
      }
    }
    
    // Molekülü ölçeklendirme ve yerleştirme
    // Daha büyük moleküller için ölçeği ayarla
    if (selectedMolecule.value === 'caffeine') {
      moleculeGroup.scale.set(0.4, 0.4, 0.4);
    } else if (selectedMolecule.value === 'aspirin') {
      moleculeGroup.scale.set(0.3, 0.3, 0.3);
    } else if (['o2', 'n2', 'h2', 'cl2'].includes(selectedMolecule.value)) {
      moleculeGroup.scale.set(1.2, 1.2, 1.2); // Diatomik moleküller
    } else if (selectedMolecule.value === 'p4') {
      moleculeGroup.scale.set(1.0, 1.0, 1.0); // Fosfor tetrameri
    } else if (selectedMolecule.value === 's8') {
      moleculeGroup.scale.set(0.8, 0.8, 0.8); // Kükürt sekizmeri (büyük)
    } else if (selectedMolecule.value === 'h2so4') {
      moleculeGroup.scale.set(0.9, 0.9, 0.9); // Sülfürik asit
    } else {
      moleculeGroup.scale.set(1, 1, 1);
    }
  }
  
  // Center the molecule
  moleculeGroup.position.set(0, 0, 0);
  
  loading.value = false;
}

function updateVisualStyle() {
  loadMolecule();
}

function toggleAutoRotation() {
  if (controls) {
    controls.autoRotate = autoRotate.value;
  }
}

function updateRotationSpeed() {
  if (controls) {
    controls.autoRotateSpeed = rotationSpeed.value * 2;
  }
}

function changeBackgroundColor(color) {
  backgroundColor.value = color;
  if (scene) {
    scene.background = new THREE.Color(color);
    
    // Update room color
    scene.children.forEach(child => {
      if (child.type === 'Mesh' && child.material.side === THREE.BackSide) {
        child.material.color = new THREE.Color(color);
      }
    });
  }
}

function resetView() {
  if (camera && controls) {
    camera.position.set(0, 0, 5);
    controls.reset();
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  renderer.render(scene, camera);
}

// Animasyon başlatma fonksiyonu
function startAnimation() {
  isAnimating.value = true;
  if (controls) {
    controls.autoRotate = true;
  }
}

// Animasyon durdurma fonksiyonu
function stopAnimation() {
  isAnimating.value = false;
  if (controls) {
    controls.autoRotate = false;
  }
}

// Ayarları sıfırlama fonksiyonu
function resetSettings() {
  selectedMolecule.value = initialSettings.molecule;
  visualStyle.value = initialSettings.style;
  autoRotate.value = initialSettings.rotate;
  rotationSpeed.value = initialSettings.speed;
  backgroundColor.value = initialSettings.bgColor;
  
  // Molekülü yeniden yükle
  loadMolecule();
  
  // Arka plan rengini güncelle
  changeBackgroundColor(initialSettings.bgColor);
  
  // Animasyon ayarlarını güncelle
  stopAnimation();
}
</script>
  
 
 