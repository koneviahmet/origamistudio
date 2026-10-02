<template>
  <div class="flex flex-col w-full h-screen bg-gray-900">


    <!-- Ana İçerik -->
    <div class="flex flex-col md:flex-row w-full h-[calc(100vh-5rem)] relative h-screen">
      <!-- Simülasyon Alanı -->
      <div class="flex-grow relative h-screen">
        <!-- Simülasyon Canvas -->
        <div ref="threeContainer" class="w-full h-full"></div>

        <!-- Bilgiler -->
        <div class="absolute top-4 left-4 bg-black bg-opacity-70 p-3 rounded-lg text-white text-sm">
          <p>Seçili Bileşik: <span class="font-bold">{{ selectedCompound.name }}</span></p>
          <p>Eklenen Molekül Sayısı: <span class="font-bold">{{ molecules.length }}</span></p>
          <p>Tanecik Sayısı: <span class="font-bold">{{ getTotalAtomCount() }}</span></p>
          <p v-if="molecules.length > 0">
            Madde Türü: 
            <span class="font-bold" :class="isMixture ? 'text-yellow-400' : 'text-green-400'">
              {{ isMixture ? 'Karışım' : 'Saf Madde' }}
            </span>
          </p>
        </div>

        <!-- Alt Kontrol Paneli -->
        <div class="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 p-4 rounded-lg flex items-center space-x-4">
          <!-- Bileşik Seçimi -->
          <select 
            v-model="selectedCompound"
            class="bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
          >
            <option 
              v-for="compound in availableCompounds" 
              :key="compound.id"
              :value="compound"
              class="bg-gray-700 text-white py-1"
            >
              {{ compound.name }}
            </option>
          </select>

          <!-- Molekül Ekleme Butonu -->
          <button 
            @click="addMolecule"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
          >
             Ekle
          </button>
        </div>

        <!-- Mobil Ayarlar Butonu -->
        <button 
          @click="showSettings = true"
          class="md:hidden absolute top-4 right-4 bg-gray-800 p-2 rounded-lg text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <!-- Ayarlar Paneli - Desktop -->
      <div class="hidden md:block w-80 bg-gray-800 p-4">
        <div class="space-y-6 h-screen overflow-auto">
          
          <!-- Bileşik Seçimi -->
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">Bileşik Seçimi</h3>
            <select 
              v-model="selectedCompound"
              class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option 
                v-for="compound in availableCompounds" 
                :key="compound.id"
                :value="compound"
                class="bg-gray-700 text-white py-1"
              >
                {{ compound.name }}
              </option>
            </select>
          </div>
          

          <!-- Molekül Sayısı Slider -->
          <div>
            <label class="block text-gray-300 mb-2">Eklenecek Molekül Sayısı: {{ moleculeAddCount }}</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              v-model="moleculeAddCount"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <button 
              @click="addMultipleMolecules"
              class="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {{ moleculeAddCount }} Molekül Ekle
            </button>
          </div>
          
          <!-- Konteyner Ayarları -->
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">Konteyner Ayarları</h3>
            
            <!-- Duvar Şeffaflığı Slider -->
            <div class="mb-4">
              <label class="block text-gray-300 mb-2">Duvar Şeffaflığı: {{ Number(containerOpacity).toFixed(2) }}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                v-model.number="containerOpacity"
                @change="updateContainerProperties"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <!-- Konteyner Rengi -->
            <div class="mb-4">
              <label class="block text-gray-300 mb-2">Konteyner Rengi</label>
              <div class="grid grid-cols-4 gap-2">
                <button 
                  v-for="(color, index) in containerColors" 
                  :key="index"
                  @click="selectContainerColor(color.value)"
                  class="w-full h-8 rounded-md border-2 transition-all duration-200"
                  :style="{
                    backgroundColor: color.hex,
                    borderColor: containerColor === color.value ? '#ffffff' : color.hex
                  }"
                  :title="color.name"
                ></button>
              </div>
            </div>
          </div>
          

          
          <!-- Sıfırlama Butonu -->
          <div>
            <button 
              @click="resetSimulation"
              class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Simülasyonu Sıfırla
            </button>
          </div>
        </div>
      </div>

      <!-- Ayarlar Modal - Mobile -->
      <div v-if="showSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 h-screen overflow-auto">
        <div class="absolute right-0 top-0 w-80 bg-gray-800 p-4 h-screen overflow-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-white"></h2>
            <button @click="showSettings = false" class="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Ayarlar içeriği -->
          <div class="space-y-4 h-screen overflow-auto">


            <!-- Bileşik Seçimi -->
            <div>
              <h3 class="text-lg font-semibold text-white mb-2">Bileşik Seçimi</h3>
              <select 
                v-model="selectedCompound"
                class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option 
                  v-for="compound in availableCompounds" 
                  :key="compound.id"
                  :value="compound"
                  class="bg-gray-700 text-white py-1"
                >
                  {{ compound.name }}
                </option>
              </select>
            </div>
            
            
            <!-- Molekül Sayısı Slider -->
            <div>
              <label class="block text-gray-300 mb-2">Eklenecek Molekül Sayısı: {{ moleculeAddCount }}</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                v-model="moleculeAddCount"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <button 
                @click="addMultipleMolecules"
                class="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {{ moleculeAddCount }} Molekül Ekle
              </button>
            </div>
            
            <!-- Konteyner Ayarları -->
            <div>
              <h3 class="text-lg font-semibold text-white mb-2">Konteyner Ayarları</h3>
              
              <!-- Duvar Şeffaflığı Slider -->
              <div class="mb-4">
                <label class="block text-gray-300 mb-2">Duvar Şeffaflığı: {{ Number(containerOpacity).toFixed(2) }}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  v-model.number="containerOpacity"
                  @change="updateContainerProperties"
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <!-- Konteyner Rengi -->
              <div class="mb-4">
                <label class="block text-gray-300 mb-2">Konteyner Rengi</label>
                <div class="grid grid-cols-4 gap-2">
                  <button 
                    v-for="(color, index) in containerColors" 
                    :key="index"
                    @click="selectContainerColor(color.value)"
                    class="w-full h-8 rounded-md border-2 transition-all duration-200"
                    :style="{
                      backgroundColor: color.hex,
                      borderColor: containerColor === color.value ? '#ffffff' : color.hex
                    }"
                    :title="color.name"
                  ></button>
                </div>
              </div>
            </div>

            
            <!-- Sıfırlama Butonu -->
            <div>
              <button 
                @click="resetSimulation"
                class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Simülasyonu Sıfırla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// Atom renkleri ve yarıçapları (Ångström)
const atomProperties = {
  H: { color: 0xFFFFFF, radius: 0.25, mass: 1.008 }, // Hidrojen - Beyaz
  O: { color: 0xFF0000, radius: 0.48, mass: 15.999 }, // Oksijen - Kırmızı
  C: { color: 0x808080, radius: 0.50, mass: 12.011 }, // Karbon - Gri
  N: { color: 0x0000FF, radius: 0.45, mass: 14.007 }, // Azot - Mavi
  Cl: { color: 0x00FF00, radius: 0.70, mass: 35.453 }, // Klor - Yeşil
  Na: { color: 0xFFA500, radius: 0.95, mass: 22.990 }, // Sodyum - Turuncu
  S: { color: 0xFFFF00, radius: 0.65, mass: 32.065 }, // Kükürt - Sarı
  P: { color: 0xFFA500, radius: 0.60, mass: 30.974 }, // Fosfor - Turuncu
  F: { color: 0x90EE90, radius: 0.42, mass: 18.998 }, // Flor - Açık Yeşil
  He: { color: 0xFFD700, radius: 0.40, mass: 4.003 }, // Helyum - Altın Sarısı
  Ne: { color: 0xFF6347, radius: 0.51, mass: 20.180 }, // Neon - Domates Kırmızısı
  Ar: { color: 0x9370DB, radius: 0.55, mass: 39.948 }, // Argon - Mora Çalan
  I: { color: 0x8A2BE2, radius: 0.80, mass: 126.904 }, // İyot - Mor
};

export default {
  name: 'CompoundSimulation3D',
  setup() {
    // Referanslar
    const threeContainer = ref(null);
    const molecules = ref([]);
    const moleculeAddCount = ref(1);
    const showSettings = ref(false); // Mobil ayarlar için
    
    // Sabit değerler
    const containerWidth = 12;
    const containerHeight = 12;
    const containerDepth = 12;
    const wallThickness = 0.5;
    const scaleFactor = 1.2; // Molekül boyutlarını küçülttüm
    
    // Konteyner ayarları
    const containerOpacity = ref(0.3); // Başlangıç şeffaflık değeri
    const containerColor = ref('gray-800'); // Başlangıç rengi
    const containerColors = [
      { name: 'Gri', value: 'gray-800', hex: '#1f2937' },
      { name: 'Kırmızı', value: 'red-900', hex: '#7f1d1d' },
      { name: 'Yeşil', value: 'green-900', hex: '#14532d' },
      { name: 'Mavi', value: 'blue-900', hex: '#1e3a8a' },
      { name: 'Mor', value: 'purple-900', hex: '#581c87' },
      { name: 'Sarı', value: 'yellow-800', hex: '#854d0e' },
      { name: 'Turuncu', value: 'orange-800', hex: '#9a3412' },
      { name: 'Pembe', value: 'pink-900', hex: '#831843' },
    ];
    
    // Konteyner mesh'leri (referans olarak saklayacağız)
    let containerMeshes = {
      floor: null,
      ceiling: null,
      leftWall: null,
      rightWall: null,
      backWall: null,
      frontWall: null
    };
    
    // Bileşik tanımlamaları - Gerçek bağ uzunluklarına göre düzenlenmiş pozisyonlar
    const availableCompounds = [
      // Element molekülleri
      {
        id: 'h2',
        name: 'Hidrojen (H₂)',
        atoms: [
          { element: 'H', position: [-0.20, 0, 0] }, // H-H bağı ~0.74 Å
          { element: 'H', position: [0.20, 0, 0] }
        ]
      },
      {
        id: 'o2',
        name: 'Oksijen (O₂)',
        atoms: [
          { element: 'O', position: [-0.35, 0, 0] }, // O-O bağı ~1.21 Å
          { element: 'O', position: [0.35, 0, 0] }
        ]
      },
      {
        id: 'n2',
        name: 'Azot (N₂)',
        atoms: [
          { element: 'N', position: [-0.30, 0, 0] }, // N-N bağı ~1.10 Å
          { element: 'N', position: [0.30, 0, 0] }
        ]
      },
      {
        id: 'cl2',
        name: 'Klor (Cl₂)',
        atoms: [
          { element: 'Cl', position: [-0.5, 0, 0] }, // Cl-Cl bağı ~2.00 Å
          { element: 'Cl', position: [0.5, 0, 0] }
        ]
      },
      {
        id: 'i2',
        name: 'İyot (I₂)',
        atoms: [
          { element: 'I', position: [-0.7, 0, 0] }, // I-I bağı ~2.70 Å
          { element: 'I', position: [0.7, 0, 0] }
        ]
      },
      // Tek atomlu elementler (Asal gazlar)
      {
        id: 'he',
        name: 'Helyum (He)',
        atoms: [
          { element: 'He', position: [0, 0, 0] }
        ]
      },
      {
        id: 'ne',
        name: 'Neon (Ne)',
        atoms: [
          { element: 'Ne', position: [0, 0, 0] }
        ]
      },
      {
        id: 'ar',
        name: 'Argon (Ar)',
        atoms: [
          { element: 'Ar', position: [0, 0, 0] }
        ]
      },
      // Bileşikler
      {
        id: 'h2o',
        name: 'Su (H₂O)',
        atoms: [
          { element: 'O', position: [0, 0, 0] },
          { element: 'H', position: [0.35, 0.3, 0] },  // O-H bağı ~0.96 Å
          { element: 'H', position: [-0.35, 0.3, 0] }
        ]
      },
      {
        id: 'co2',
        name: 'Karbondioksit (CO₂)',
        atoms: [
          { element: 'C', position: [0, 0, 0] },
          { element: 'O', position: [0.6, 0, 0] },  // C-O bağı ~1.16 Å
          { element: 'O', position: [-0.6, 0, 0] }
        ]
      },
      {
        id: 'nh3',
        name: 'Amonyak (NH₃)',
        atoms: [
          { element: 'N', position: [0, 0, 0] },
          { element: 'H', position: [0.35, 0.3, 0] },   // N-H bağı ~1.01 Å
          { element: 'H', position: [-0.17, 0.3, 0.3] },
          { element: 'H', position: [-0.17, 0.3, -0.3] }
        ]
      },
      {
        id: 'ch4',
        name: 'Metan (CH₄)',
        atoms: [
          { element: 'C', position: [0, 0, 0] },
          { element: 'H', position: [0.35, 0.35, 0.35] },  // C-H bağı ~1.09 Å
          { element: 'H', position: [-0.35, 0.35, -0.35] },
          { element: 'H', position: [0.35, -0.35, -0.35] },
          { element: 'H', position: [-0.35, -0.35, 0.35] }
        ]
      },
      {
        id: 'nacl',
        name: 'Tuz (NaCl)',
        atoms: [
          { element: 'Na', position: [0, 0, 0] },
          { element: 'Cl', position: [0.95, 0, 0] }  // Na-Cl bağı ~2.4 Å
        ]
      },
      {
        id: 'h2so4',
        name: 'Sülfürik Asit (H₂SO₄)',
        atoms: [
          { element: 'S', position: [0, 0, 0] },
          { element: 'O', position: [0.5, 0, 0] },      // S-O bağı ~1.43 Å
          { element: 'O', position: [-0.5, 0, 0] },
          { element: 'O', position: [0, 0.5, 0] },
          { element: 'O', position: [0, -0.5, 0] },
          { element: 'H', position: [0.7, 0.25, 0] },   // O-H bağı ~0.96 Å
          { element: 'H', position: [-0.7, 0.25, 0] }
        ]
      }
    ];
    
    // Seçili bileşik
    const selectedCompound = ref(availableCompounds[0]);
    
    // Three.js değişkenleri
    let scene, camera, renderer, controls;
    
    // Cannon.js değişkenleri
    let world, containerBody;
    let physicsBodies = [];
    
    // Toplam atom sayısını hesapla
    const getTotalAtomCount = () => {
      let total = 0;
      for (const molecule of molecules.value) {
        total += molecule.atoms.length;
      }
      return total;
    };
    
    // Bileşik seçimi
    const selectCompound = (compound) => {
      selectedCompound.value = compound;
    };
    
    // Konteyner rengi seçimi
    const selectContainerColor = (colorValue) => {
      containerColor.value = colorValue;
      updateContainerProperties();
    };
    
    // Konteyner özelliklerini güncelleme
    const updateContainerProperties = () => {
      if (!scene) return;
      
      // Seçilen rengi al
      const selectedColor = containerColors.find(c => c.value === containerColor.value);
      const colorHex = parseInt(selectedColor.hex.replace('#', '0x'), 16);
      
      // Tüm duvarlar için ortak material
      const commonMaterial = new THREE.MeshStandardMaterial({
        color: colorHex,
        transparent: true,
        opacity: containerOpacity.value,
        side: THREE.DoubleSide
      });
      
      // Ön duvar için ayrı material (daha şeffaf olabilir)
      const frontMaterial = new THREE.MeshStandardMaterial({
        color: colorHex,
        transparent: true,
        opacity: containerOpacity.value,
        side: THREE.DoubleSide
      });
      
      // Tüm duvarların materyallerini güncelle
      for (const [key, mesh] of Object.entries(containerMeshes)) {
        if (mesh) {
          if (key === 'frontWall') {
            mesh.material = frontMaterial;
          } else {
            mesh.material = commonMaterial;
          }
        }
      }
    };
    
    // Three.js ve Cannon.js kurulumu
    const initSimulation = () => {
      // Three.js kurulumu
      setupThree();
      
      // Cannon.js kurulumu
      setupPhysics();
      
      // Animasyon döngüsü
      animate();
    };
    
    // Three.js kurulumu
    const setupThree = () => {
      // Sahne oluştur
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd1fae5); // bg-gray-800
      
      // Kamera oluştur
      const aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
      camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      camera.position.set(0, 5, 15);
      camera.lookAt(0, 0, 0);
      
      // Renderer oluştur
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      threeContainer.value.appendChild(renderer.domElement);
      
      // Kontroller ekle (fare ile döndürme)
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Işıklar ekle
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);
      
      // Konteyner oluştur
      createContainer();
    };
    
    // Cannon.js kurulumu
    const setupPhysics = () => {
      // Fizik dünyası oluştur
      world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0) // Yerçekimi
      });
      
      // Konteyner için fizik gövdesi oluştur
      createContainerPhysics();
    };
    
    // Konteyner oluştur (Three.js)
    const createContainer = () => {
      // Seçilen rengi al
      const selectedColor = containerColors.find(c => c.value === containerColor.value);
      const colorHex = parseInt(selectedColor.hex.replace('#', '0x'), 16);
      
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: colorHex,
        transparent: true,
        opacity: containerOpacity.value,
        side: THREE.DoubleSide
      });
      
      // Zemin
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(containerWidth, wallThickness, containerDepth),
        wallMaterial
      );
      floor.position.y = -containerHeight / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      containerMeshes.floor = floor;
      
      // Tavan
      const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(containerWidth, wallThickness, containerDepth),
        wallMaterial
      );
      ceiling.position.y = containerHeight / 2;
      ceiling.receiveShadow = true;
      scene.add(ceiling);
      containerMeshes.ceiling = ceiling;
      
      // Sol duvar
      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, containerHeight, containerDepth),
        wallMaterial
      );
      leftWall.position.x = -containerWidth / 2;
      leftWall.receiveShadow = true;
      scene.add(leftWall);
      containerMeshes.leftWall = leftWall;
      
      // Sağ duvar
      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, containerHeight, containerDepth),
        wallMaterial
      );
      rightWall.position.x = containerWidth / 2;
      rightWall.receiveShadow = true;
      scene.add(rightWall);
      containerMeshes.rightWall = rightWall;
      
      // Arka duvar
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(containerWidth, containerHeight, wallThickness),
        wallMaterial
      );
      backWall.position.z = -containerDepth / 2;
      backWall.receiveShadow = true;
      scene.add(backWall);
      containerMeshes.backWall = backWall;
      
      // Ön duvar
      const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(containerWidth, containerHeight, wallThickness),
        wallMaterial
      );
      frontWall.position.z = containerDepth / 2;
      frontWall.receiveShadow = true;
      scene.add(frontWall);
      containerMeshes.frontWall = frontWall;
    };
    
    // Konteyner için fizik gövdesi oluştur (Cannon.js)
    const createContainerPhysics = () => {
      // Zemin
      const floorShape = new CANNON.Box(new CANNON.Vec3(containerWidth / 2, wallThickness / 2, containerDepth / 2));
      const floorBody = new CANNON.Body({
        mass: 0, // Statik gövde
        position: new CANNON.Vec3(0, -containerHeight / 2, 0),
        shape: floorShape
      });
      world.addBody(floorBody);
      
      // Tavan
      const ceilingShape = new CANNON.Box(new CANNON.Vec3(containerWidth / 2, wallThickness / 2, containerDepth / 2));
      const ceilingBody = new CANNON.Body({
        mass: 0, // Statik gövde
        position: new CANNON.Vec3(0, containerHeight / 2, 0),
        shape: ceilingShape
      });
      world.addBody(ceilingBody);
      
      // Sol duvar
      const leftWallShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, containerHeight / 2, containerDepth / 2));
      const leftWallBody = new CANNON.Body({
        mass: 0, // Statik gövde
        position: new CANNON.Vec3(-containerWidth / 2, 0, 0),
        shape: leftWallShape
      });
      world.addBody(leftWallBody);
      
      // Sağ duvar
      const rightWallShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, containerHeight / 2, containerDepth / 2));
      const rightWallBody = new CANNON.Body({
        mass: 0, // Statik gövde
        position: new CANNON.Vec3(containerWidth / 2, 0, 0),
        shape: rightWallShape
      });
      world.addBody(rightWallBody);
      
      // Arka duvar
      const backWallShape = new CANNON.Box(new CANNON.Vec3(containerWidth / 2, containerHeight / 2, wallThickness / 2));
      const backWallBody = new CANNON.Body({
        mass: 0, // Statik gövde
        position: new CANNON.Vec3(0, 0, -containerDepth / 2),
        shape: backWallShape
      });
      world.addBody(backWallBody);
      
      // Ön duvar
      const frontWallShape = new CANNON.Box(new CANNON.Vec3(containerWidth / 2, containerHeight / 2, wallThickness / 2));
      const frontWallBody = new CANNON.Body({
        mass: 0, // Statik gövde
        position: new CANNON.Vec3(0, 0, containerDepth / 2),
        shape: frontWallShape
      });
      world.addBody(frontWallBody);
    };
    
    // Molekül ekle
    const addMolecule = () => {
      // Molekül için başlangıç pozisyonu
      const startPosition = new THREE.Vector3(
        (Math.random() - 0.5) * 6, // X pozisyonu
        containerHeight / 2 - 2,   // Y pozisyonu (üstten biraz aşağıda)
        (Math.random() - 0.5) * 6  // Z pozisyonu
      );
      
      // Molekülün fizik gövdesi için kütle hesapla
      let totalMass = 0;
      for (const atom of selectedCompound.value.atoms) {
        totalMass += atomProperties[atom.element].mass;
      }
      
      // Molekül için ana fizik gövdesi (compound shape)
      // Bileşik şeklinin boyutunu seçilen bileşiğe göre ayarla
      let maxRadius = 0;
      for (const atom of selectedCompound.value.atoms) {
        const pos = atom.position;
        const distance = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        const atomRadius = atomProperties[atom.element].radius;
        const totalRadius = distance + atomRadius;
        if (totalRadius > maxRadius) {
          maxRadius = totalRadius;
        }
      }
      
      const compoundShape = new CANNON.Sphere(maxRadius * scaleFactor * 1.1); // Biraz daha büyük yaparak çarpışmaları daha gerçekçi hale getir
      
      const body = new CANNON.Body({
        mass: totalMass,
        position: new CANNON.Vec3(startPosition.x, startPosition.y, startPosition.z),
        material: new CANNON.Material({
          friction: 0.1,
          restitution: 0.4
        })
      });
      body.addShape(compoundShape);
      world.addBody(body);
      
      // Atomlar için Three.js görselleri oluştur
      const atomMeshes = [];
      const atomObjects = [];
      
      for (const atom of selectedCompound.value.atoms) {
        // Atom özellikleri
        const props = atomProperties[atom.element];
        const radius = props.radius * scaleFactor;
        
        // Three.js küre oluştur
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: props.color,
          metalness: 0.3,
          roughness: 0.4
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Atom pozisyonu (molekül merkezine göre relatif)
        const pos = atom.position;
        sphere.position.set(
          startPosition.x + pos[0] * scaleFactor,
          startPosition.y + pos[1] * scaleFactor,
          startPosition.z + pos[2] * scaleFactor
        );
        
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add(sphere);
        
        atomMeshes.push(sphere);
        atomObjects.push({
          element: atom.element,
          mesh: sphere,
          relativePosition: new THREE.Vector3(pos[0] * scaleFactor, pos[1] * scaleFactor, pos[2] * scaleFactor)
        });
      }
      
      // Molekül nesnesini oluştur ve diziye ekle
      const molecule = {
        body: body,
        atoms: atomObjects,
        compoundId: selectedCompound.value.id // Molekülün hangi bileşikten olduğunu kaydet
      };
      
      molecules.value.push(molecule);
      physicsBodies.push(body);
    };
    
    // Çoklu molekül ekle
    const addMultipleMolecules = () => {
      for (let i = 0; i < moleculeAddCount.value; i++) {
        addMolecule();
      }
    };
    
    // Simülasyonu sıfırla
    const resetSimulation = () => {
      // Tüm molekülleri sil
      for (const molecule of molecules.value) {
        // Fizik gövdesini sil
        world.removeBody(molecule.body);
        
        // Atom mesh'lerini sil
        for (const atom of molecule.atoms) {
          scene.remove(atom.mesh);
        }
      }
      molecules.value = [];
      physicsBodies = [];
    };
    
    // Kamerayı sıfırla
    const resetCamera = () => {
      camera.position.set(0, 5, 15);
      camera.lookAt(0, 0, 0);
      controls.reset();
    };
    
    // Animasyon döngüsü
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Fizik dünyasını güncelle
      world.step(1/60);
      
      // Moleküllerin pozisyonlarını güncelle
      for (const molecule of molecules.value) {
        // Her atomun pozisyonunu ana gövdeye göre güncelle
        for (const atom of molecule.atoms) {
          // Molekül gövdesinin pozisyonu ve rotasyonu
          const bodyPos = molecule.body.position;
          const bodyQuat = molecule.body.quaternion;
          
          // Relatif pozisyonun kopyasını oluştur
          const relPos = new THREE.Vector3().copy(atom.relativePosition);
          
          // Rotasyonu uygula
          relPos.applyQuaternion(new THREE.Quaternion(bodyQuat.x, bodyQuat.y, bodyQuat.z, bodyQuat.w));
          
          // Son pozisyonu hesapla
          atom.mesh.position.set(
            bodyPos.x + relPos.x,
            bodyPos.y + relPos.y,
            bodyPos.z + relPos.z
          );
          
          // Rotasyonu uygula
          atom.mesh.quaternion.set(bodyQuat.x, bodyQuat.y, bodyQuat.z, bodyQuat.w);
        }
      }
      
      // Kontrolleri güncelle
      controls.update();
      
      // Sahneyi render et
      renderer.render(scene, camera);
    };
    
    // Canvas boyutunu ayarla
    const handleResize = () => {
      if (!renderer || !camera) return;
      
      const width = threeContainer.value.clientWidth;
      const height = threeContainer.value.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    
    // Hex renk değerlerini almak için yardımcı fonksiyon
    const getHexFromTailwindClass = (className) => {
      const colors = {
        'bg-gray-900': '#111827',
        'bg-gray-800': '#1f2937',
        'bg-gray-700': '#374151',
        'bg-gray-600': '#4b5563'
      };
      return colors[className] || '#111827';
    };
    
    // Kamera pozisyonları
    const setCamera = (position) => {
      if (!camera) return;

      switch (position) {
        case 'top':
          camera.position.set(0, 20, 0);
          camera.lookAt(0, 0, 0);
          break;
        case 'front':
          camera.position.set(0, 0, 20);
          camera.lookAt(0, 0, 0);
          break;
        case 'side':
          camera.position.set(20, 0, 0);
          camera.lookAt(0, 0, 0);
          break;
        case 'isometric':
          camera.position.set(12, 12, 12);
          camera.lookAt(0, 0, 0);
          break;
      }
      
      controls.update();
    };
    
    // Lifecycle hooks
    onMounted(() => {
      initSimulation();
      window.addEventListener('resize', handleResize);
    });
    
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      
      // Temizle
      if (renderer) {
        renderer.dispose();
        if (threeContainer.value && threeContainer.value.contains(renderer.domElement)) {
          threeContainer.value.removeChild(renderer.domElement);
        }
      }
      
      // Fizik dünyasını temizle
      if (world) {
        for (const body of physicsBodies) {
          world.removeBody(body);
        }
      }
    });
    
    // Karışım olup olmadığını belirle
    const isMixture = computed(() => {
      if (molecules.value.length <= 1) {
        return false; // Tek molekül varsa her zaman saf maddedir
      }
      
      // Tüm moleküllerin aynı türden olup olmadığını kontrol et
      const firstCompoundId = molecules.value[0].compoundId;
      return molecules.value.some(molecule => molecule.compoundId !== firstCompoundId);
    });
    
    return {
      threeContainer,
      molecules,
      moleculeAddCount,
      showSettings,
      availableCompounds,
      selectedCompound,
      containerOpacity,
      containerColor,
      containerColors,
      selectCompound,
      selectContainerColor,
      updateContainerProperties,
      getTotalAtomCount,
      addMolecule,
      addMultipleMolecules,
      resetSimulation,
      resetCamera,
      setCamera,
      getHexFromTailwindClass,
      isMixture
    };
  }
};
</script>

<style scoped>
/* Özel stiller */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4f46e5;
  cursor: pointer;
  border: 2px solid #c7d2fe;
}

input[type=range]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4f46e5;
  cursor: pointer;
  border: 2px solid #c7d2fe;
}
</style> 