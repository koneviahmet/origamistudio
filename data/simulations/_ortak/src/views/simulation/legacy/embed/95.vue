<template>
  <div class="h-screen w-full relative overflow-hidden select-none" :class="darkMode ? 'bg-gray-900' : 'bg-blue-50'">
    <!-- Simülasyon Alanı -->
    <div id="simulation-container" ref="container" class="w-full h-full"></div>

    <!-- Başlat/Durdur Butonları -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <button v-if="!isPlaying" @click="startSimulation" class="px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors">
        Başlat
      </button>
      <button v-else @click="pauseSimulation" class="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors">
        Durdur
      </button>
    </div>

    <!-- Sıcaklık Göstergesi -->
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-md">
      <div class="text-center">
        <span>Sıcaklık: {{ temperature.toFixed(1) }}°C</span>
        <div class="flex items-center mt-2">
          <span class="text-blue-300">-30°C</span>
          <input 
            type="range" 
            min="-30" 
            max="100" 
            step="0.1" 
            v-model.number="temperature" 
            class="mx-2 w-40"
          />
          <span class="text-red-300">100°C</span>
        </div>
        <div class="flex justify-between items-center mt-2">
          <span class="text-sm">Değişim Hızı:</span>
          <select v-model="temperatureChangeRate" class="ml-2 bg-gray-700 text-white text-sm rounded px-2 py-1">
            <option value="0.05">Çok Yavaş</option>
            <option value="0.1">Yavaş</option>
            <option value="0.2">Normal</option>
            <option value="0.5">Hızlı</option>
            <option value="1">Çok Hızlı</option>
          </select>
          <button @click="reverseDirection" class="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-2 rounded">
            {{ temperatureDirection > 0 ? 'Soğut ↓' : 'Isıt ↑' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobil Ayarlar Butonu -->
    <button @click="showSettings = !showSettings" class="md:hidden absolute top-4 left-4 z-20 bg-gray-800 text-white p-2 rounded-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Ayarlar Paneli (Mobil için Modal) -->
    <div v-if="showSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
      <div class="bg-gray-800 text-white p-4 rounded-lg w-full max-w-md max-h-[66vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="showSettings = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="space-y-4">
          <!-- Kamera Kontrolleri -->
          <div>
            <h3 class="font-semibold mb-2">Kamera Görünümü</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="setView('front')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Önden</button>
              <button @click="setView('side')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Yandan</button>
              <button @click="setView('top')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Üstten</button>
              <button @click="setView('isometric')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">İzometrik</button>
              <button @click="resetCamera()" class="col-span-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">Görünümü Sıfırla</button>
            </div>
          </div>

          <!-- Arkaplan Rengi -->
          <div>
            <h3 class="font-semibold mb-2">Arkaplan Rengi</h3>
            <div class="flex space-x-2">
              <button @click="darkMode = true" class="w-8 h-8 bg-gray-900 border-2" :class="darkMode ? 'border-white' : 'border-transparent'"></button>
              <button @click="darkMode = false" class="w-8 h-8 bg-blue-50 border-2" :class="!darkMode ? 'border-gray-800' : 'border-transparent'"></button>
            </div>
          </div>

          <!-- Simülasyon Bilgisi -->
          <div>
            <h3 class="font-semibold mb-2">Hal Değişimleri</h3>
            <ul class="text-sm space-y-1">
              <li><span class="text-blue-300">Donma (-30°C - 0°C):</span> Su → Buz</li>
              <li><span class="text-blue-100">Erime (0°C - 100°C):</span> Buz → Su</li>
              <li><span class="text-red-300">Buharlaşma (100°C+):</span> Su → Buhar</li>
              <li><span class="text-indigo-300">Yoğuşma:</span> Buhar → Su</li>
              <li><span class="text-purple-300">Süblimleşme:</span> Buz → Buhar</li>
              <li><span class="text-teal-300">Kırağılaşma:</span> Buhar → Buz</li>
            </ul>
          </div>

          <!-- Sıcaklık Kontrolleri -->
          <div>
            <h3 class="font-semibold mb-2">Sıcaklık Kontrolleri</h3>
            <div class="space-y-2">
              <div>
                <label class="text-sm">Değişim Hızı:</label>
                <select v-model="temperatureChangeRate" class="ml-2 bg-gray-700 text-white text-sm rounded px-2 py-1">
                  <option value="0.05">Çok Yavaş</option>
                  <option value="0.1">Yavaş</option>
                  <option value="0.2">Normal</option>
                  <option value="0.5">Hızlı</option>
                  <option value="1">Çok Hızlı</option>
                </select>
              </div>
              <button @click="reverseDirection" class="w-full px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded">
                {{ temperatureDirection > 0 ? 'Soğutma Moduna Geç' : 'Isıtma Moduna Geç' }}
              </button>
            </div>
          </div>

          <!-- Sıfırlama Butonu -->
          <button @click="resetSimulation" class="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
            Simülasyonu Sıfırla
          </button>
        </div>
      </div>
    </div>

    <!-- Ayarlar Paneli (Desktop) -->
    <div class="hidden md:block absolute right-0 top-0 h-full max-h-[66vh] w-72 bg-gray-800 text-white p-4 overflow-y-auto z-20">
      <h2 class="text-xl font-bold mb-4">Ayarlar</h2>
      <div class="space-y-6">
        <!-- Kamera Kontrolleri -->
        <div>
          <h3 class="font-semibold mb-2">Kamera Görünümü</h3>
          <div class="grid grid-cols-2 gap-2">
            <button @click="setView('front')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Önden</button>
            <button @click="setView('side')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Yandan</button>
            <button @click="setView('top')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">Üstten</button>
            <button @click="setView('isometric')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">İzometrik</button>
            <button @click="resetCamera()" class="col-span-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded">Görünümü Sıfırla</button>
          </div>
        </div>

        <!-- Arkaplan Rengi -->
        <div>
          <h3 class="font-semibold mb-2">Arkaplan Rengi</h3>
          <div class="flex space-x-2">
            <button @click="darkMode = true" class="w-8 h-8 bg-gray-900 border-2" :class="darkMode ? 'border-white' : 'border-transparent'"></button>
            <button @click="darkMode = false" class="w-8 h-8 bg-blue-50 border-2" :class="!darkMode ? 'border-gray-800' : 'border-transparent'"></button>
          </div>
        </div>

        <!-- Simülasyon Bilgisi -->
        <div>
          <h3 class="font-semibold mb-2">Hal Değişimleri</h3>
          <ul class="text-sm space-y-1">
            <li><span class="text-blue-300">Donma (-30°C - 0°C):</span> Su → Buz</li>
            <li><span class="text-blue-100">Erime (0°C - 100°C):</span> Buz → Su</li>
            <li><span class="text-red-300">Buharlaşma (100°C+):</span> Su → Buhar</li>
            <li><span class="text-indigo-300">Yoğuşma:</span> Buhar → Su</li>
            <li><span class="text-purple-300">Süblimleşme:</span> Buz → Buhar</li>
            <li><span class="text-teal-300">Kırağılaşma:</span> Buhar → Buz</li>
          </ul>
        </div>

        <!-- Sıcaklık Kontrolleri -->
        <div>
          <h3 class="font-semibold mb-2">Sıcaklık Kontrolleri</h3>
          <div class="space-y-2">
            <div>
              <label class="text-sm">Değişim Hızı:</label>
              <select v-model="temperatureChangeRate" class="ml-2 bg-gray-700 text-white text-sm rounded px-2 py-1">
                <option value="0.05">Çok Yavaş</option>
                <option value="0.1">Yavaş</option>
                <option value="0.2">Normal</option>
                <option value="0.5">Hızlı</option>
                <option value="1">Çok Hızlı</option>
              </select>
            </div>
            <button @click="reverseDirection" class="w-full px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded">
              {{ temperatureDirection > 0 ? 'Soğutma Moduna Geç' : 'Isıtma Moduna Geç' }}
            </button>
          </div>
        </div>

        <!-- Sıfırlama Butonu -->
        <button @click="resetSimulation" class="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
          Simülasyonu Sıfırla
        </button>
      </div>
    </div>

    <!-- Güncel Hal Bilgisi -->
    <div class="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-md" v-if="currentState">
      <div class="text-center font-bold">
        {{ currentState }}
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Temel Değişkenler
const container = ref(null);
const temperature = ref(20); // Başlangıç sıcaklığı
const isPlaying = ref(false);
const darkMode = ref(true);
const showSettings = ref(false);
const currentState = ref('Sıvı Hal (Su)');
const temperatureChangeRate = ref('0.2'); // Sıcaklık değişim hızı (saniyede derece)
const temperatureDirection = ref(1); // 1: artıyor, -1: azalıyor

// THREE.js Değişkenleri
let scene, camera, renderer, controls;
let container3D, waterParticles = [], iceParticles = [], vaporParticles = [];
let cloudMesh, waterMesh, iceMesh;
let animationFrameId;

// Sıcaklığa bağlı olarak hal değişimini gösteren fonksiyon
const updatePhaseState = (temp) => {
  if (temp < 0) {
    return 'Katı Hal (Buz)';
  } else if (temp >= 0 && temp < 100) {
    return 'Sıvı Hal (Su)';
  } else {
    return 'Gaz Hal (Buhar)';
  }
};

// Sıcaklık değişimini izle
watch(temperature, (newTemp) => {
  currentState.value = updatePhaseState(newTemp);
  
  if (waterMesh && iceMesh && cloudMesh) {
    // Buz - Su geçişi (0°C)
    if (newTemp < 0) {
      // Buz oluşumu
      iceMesh.scale.set(1, 1, 1);
      waterMesh.scale.set(0, 0, 0);
    } else if (newTemp >= 0 && newTemp < 100) {
      // Su oluşumu
      iceMesh.scale.set(Math.max(0, 1 - newTemp/10), Math.max(0, 1 - newTemp/10), Math.max(0, 1 - newTemp/10));
      waterMesh.scale.set(1, 1, 1);
      cloudMesh.scale.set(Math.min(0.5, Math.max(0, (newTemp - 70) / 60)), 
                        Math.min(0.5, Math.max(0, (newTemp - 70) / 60)), 
                        Math.min(0.5, Math.max(0, (newTemp - 70) / 60)));
    } else {
      // Buhar oluşumu
      iceMesh.scale.set(0, 0, 0);
      waterMesh.scale.set(Math.max(0, 2 - newTemp/50), Math.max(0, 2 - newTemp/50), Math.max(0, 2 - newTemp/50));
      cloudMesh.scale.set(1, 1, 1);
    }
  }
});

// Kamera açısını ayarlama fonksiyonu
const setView = (viewType) => {
  if (!camera || !controls) return;
  
  // Görünüm pozisyonlarını ayarla
  switch(viewType) {
    case 'front':
      camera.position.set(0, 0, 10);
      break;
    case 'side':
      camera.position.set(10, 0, 0);
      break;
    case 'top':
      camera.position.set(0, 10, 0);
      camera.up.set(0, 0, -1); // Daha doğru bir üstten görünüm için
      break;
    case 'isometric':
      camera.position.set(6, 6, 6);
      break;
  }
  
  camera.lookAt(0, 0, 0);
  controls.update();
};

// Kamera ayarlarını sıfırlama
const resetCamera = () => {
  if (!camera || !controls) return;
  camera.position.set(6, 6, 6);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 1, 0);
  controls.update();
};

// Animasyonu başlatma
const startSimulation = () => {
  isPlaying.value = true;
  animate();
};

// Animasyonu durdurma
const pauseSimulation = () => {
  isPlaying.value = false;
  cancelAnimationFrame(animationFrameId);
};

// Simülasyonu sıfırlama
const resetSimulation = () => {
  pauseSimulation();
  temperature.value = 20;
  temperatureDirection.value = 1;
  currentState.value = updatePhaseState(temperature.value);
  
  if (waterMesh && iceMesh && cloudMesh) {
    // Varsayılan duruma döndür
    iceMesh.scale.set(0, 0, 0);
    waterMesh.scale.set(1, 1, 1);
    cloudMesh.scale.set(0, 0, 0);
  }
  
  resetCamera();
};

// Animasyon döngüsü
const animate = () => {
  if (!isPlaying.value) return;
  
  // Sıcaklığı otomatik olarak güncelle
  if (isPlaying.value) {
    const newTemp = temperature.value + temperatureDirection.value * parseFloat(temperatureChangeRate.value);
    
    // Sıcaklık sınırlarını kontrol et
    if (newTemp <= -30) {
      temperature.value = -30;
      temperatureDirection.value = 1; // Sınıra ulaşıldığında yönü değiştir
    } else if (newTemp >= 100) {
      temperature.value = 100;
      temperatureDirection.value = -1; // Sınıra ulaşıldığında yönü değiştir
    } else {
      temperature.value = newTemp;
    }
  }
  
  // Su partiküllerini animasyon et
  if (isPlaying.value) {
    if (waterParticles.length > 0 && temperature.value > 0 && temperature.value < 100) {
      waterParticles.forEach(particle => {
        particle.position.y += (Math.random() - 0.5) * 0.01;
        particle.position.x += (Math.random() - 0.5) * 0.01;
        particle.position.z += (Math.random() - 0.5) * 0.01;
      });
    }
    
    // Buhar partiküllerini animasyon et
    if (vaporParticles.length > 0 && temperature.value > 80) {
      vaporParticles.forEach(particle => {
        particle.position.y += Math.random() * 0.03;
        if (particle.position.y > 4) {
          particle.position.y = 1; // Döngüyü yeniden başlat
        }
      });
      
      // Bulut animasyonu
      if (cloudMesh) {
        cloudMesh.rotation.y += 0.002;
      }
    }
    
    // Buz partiküllerini animasyon et
    if (iceParticles.length > 0 && temperature.value < 0) {
      iceParticles.forEach(particle => {
        particle.rotation.y += 0.001;
        particle.rotation.x += 0.001;
      });
    }
  }
  
  // Simülasyonu güncelle
  controls.update();
  renderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(animate);
};

// 3D Simülasyonu oluştur
const initSimulation = () => {
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(darkMode.value ? 0x111827 : 0xeff6ff);
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(6, 6, 6);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);
  
  // Kontrolleri ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);
  
  // Zemin oluştur
  const floorGeometry = new THREE.BoxGeometry(10, 0.5, 10);
  const floorMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333, 
    transparent: true, 
    opacity: 0.9
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -2;
  scene.add(floor);
  

  // Kap oluştur
  const containerGeometry = new THREE.CylinderGeometry(2, 2, 2, 32);
  const containerMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x777777, 
    transparent: true, 
    opacity: 0.4 
  });
  container3D = new THREE.Mesh(containerGeometry, containerMaterial);
  container3D.position.y = -0.5;
  scene.add(container3D);
  
  // Su oluştur
  const waterGeometry = new THREE.CylinderGeometry(1.8, 1.8, 1.5, 32);
  const waterMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x0077ff, 
    transparent: true, 
    opacity: 0.9
  });
  waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
  waterMesh.position.y = -0.25;
  scene.add(waterMesh);
  
  // Su partikülleri ekle
  for (let i = 0; i < 30; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshPhongMaterial({ color: 0x00aaff });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Rastgele konumlarla su içinde konumlandır
    const radius = 1.5 * Math.random();
    const theta = Math.random() * 2 * Math.PI;
    particle.position.x = radius * Math.cos(theta);
    particle.position.z = radius * Math.sin(theta);
    particle.position.y = -0.25 + (Math.random() - 0.5);
    
    scene.add(particle);
    waterParticles.push(particle);
  }
  
  // Buz oluştur
  const iceGeometry = new THREE.IcosahedronGeometry(1.8, 1);
  const iceMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xaaddff, 
    transparent: true, 
    opacity: 0.8
  });
  iceMesh = new THREE.Mesh(iceGeometry, iceMaterial);
  iceMesh.position.y = -0.25;
  iceMesh.scale.set(0, 0, 0); // Başlangıçta görünmez
  scene.add(iceMesh);
  
  // Buz partikülleri ekle
  for (let i = 0; i < 20; i++) {
    const particleGeometry = new THREE.TetrahedronGeometry(0.1);
    const particleMaterial = new THREE.MeshPhongMaterial({ color: 0xaaccff });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Rastgele konumlarla buz içinde konumlandır
    const radius = 1.5 * Math.random();
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.random() * Math.PI;
    particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
    particle.position.z = radius * Math.sin(phi) * Math.sin(theta);
    particle.position.y = -0.25 + radius * Math.cos(phi);
    
    particle.visible = false; // Başlangıçta görünmez
    scene.add(particle);
    iceParticles.push(particle);
  }
  
  // Bulut oluştur
  const cloudGeometry = new THREE.SphereGeometry(1.5, 16, 16);
  const cloudMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.7 
  });
  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudMesh.position.y = 4;
  cloudMesh.scale.set(0, 0, 0); // Başlangıçta görünmez
  scene.add(cloudMesh);
  
  // Buhar partikülleri ekle
  for (let i = 0; i < 40; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const particleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5 
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Rastgele konumlar
    const radius = 0.8 + Math.random() * 0.5;
    const theta = Math.random() * 2 * Math.PI;
    particle.position.x = radius * Math.cos(theta);
    particle.position.z = radius * Math.sin(theta);
    particle.position.y = 1 + Math.random() * 2;
    
    particle.visible = false; // Başlangıçta görünmez
    scene.add(particle);
    vaporParticles.push(particle);
  }
  
  // Pencere boyutu değiştiğinde yeniden boyutlandır
  window.addEventListener('resize', onWindowResize);
  
  // İlk renderi yap
  renderer.render(scene, camera);
};

// Pencere boyutu değiştiğinde
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Arkaplan rengini değiştir
watch(darkMode, (isDark) => {
  if (scene) {
    scene.background = new THREE.Color(isDark ? 0x111827 : 0xeff6ff);
  }
});

// Sıcaklık değişim yönünü tersine çevir
const reverseDirection = () => {
  temperatureDirection.value *= -1;
};

// Bileşen yüklendiğinde
onMounted(() => {
  initSimulation();
});

// Bileşen kaldırıldığında
onBeforeUnmount(() => {
  pauseSimulation();
  window.removeEventListener('resize', onWindowResize);
  
  // Three.js nesnelerini temizle
  if (renderer) {
    renderer.dispose();
    container.value.removeChild(renderer.domElement);
  }
  
  // Sahneyi temizle
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
});
</script>
  
 
 