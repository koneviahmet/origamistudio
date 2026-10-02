<template>
  <div class="relative  h-screen bg-gray-900 overflow-hidden">
    <!-- Simülasyon Alanı -->
    <div id="simulation-container" class="absolute inset-0"></div>

    <!-- Üst Orta Sıcaklık Kontrolleri -->
    <div class="absolute bottom-1/4 left-0 w-full bg-gray-800 bg-opacity-75 p-4 rounded-lg text-white shadow-lg z-10">
      <div class="grid grid-cols-2 gap-4">
        <!-- Sol Bölge Sıcaklık Kontrolü -->
        <div class="flex flex-col items-center">
          <div class="text-sm font-semibold mb-1">Sol Bölge</div>
          <div class="flex items-center space-x-2">
            <input 
              type="range" 
              v-model="leftTemperature" 
              min="0" 
              max="100" 
              class="w-32 h-4"
              @input="updateSimulation"
            >
            <span class="text-sm">{{ leftTemperature }}°C</span>
          </div>
        </div>
        <!-- Sağ Bölge Sıcaklık Kontrolü -->
        <div class="flex flex-col items-center">
          <div class="text-sm font-semibold mb-1">Sağ Bölge</div>
          <div class="flex items-center space-x-2">
            <input 
              type="range" 
              v-model="rightTemperature" 
              min="0" 
              max="100" 
              class="w-32 h-4"
              @input="updateSimulation"
            >
            <span class="text-sm">{{ rightTemperature }}°C</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sol ve Sağ Bölge Bilgi Etiketleri -->
    <div class="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none">
      <!-- Sol Bölge Bilgisi -->
      <div class="bg-gray-800 bg-opacity-75 p-2 rounded-lg text-white shadow-lg">
        <div class="font-bold text-sm mb-1">SOL BÖLGE</div>
        <div class="flex items-center">
          <div 
            class="w-3 h-3 rounded-full mr-2" 
            :style="{ backgroundColor: getColorHex(leftTemperature) }"
          ></div>
          <div class="text-xs">
            Sıcaklık: <span class="font-bold">{{ leftTemperature }}°C</span>
            <span class="ml-1 text-xs">{{ getTemperatureDesc(leftTemperature) }}</span>
          </div>
        </div>
        <div class="flex items-center mt-1">
          <div class="text-xs flex items-center">
            Basınç: <span class="font-bold ml-1">{{ leftPressure }} hPa</span>
            <span 
              class="ml-1" 
              :class="leftPressure > 1010 ? 'text-blue-300' : 'text-red-300'"
            >
              {{ getPressureDesc(leftPressure) }}
            </span>
          </div>
        </div>
        <div class="text-xs mt-1" :class="getWeatherTextColor(leftTemperature, leftPressure)">
          {{ getWeatherDesc(leftTemperature, leftPressure) }}
        </div>
      </div>
      
      <!-- Sağ Bölge Bilgisi -->
      <div class="bg-gray-800 bg-opacity-75 p-2 rounded-lg text-white shadow-lg">
        <div class="font-bold text-sm mb-1 text-right">SAĞ BÖLGE</div>
        <div class="flex items-center justify-end">
          <div class="text-xs text-right">
            <span class="font-bold">{{ rightTemperature }}°C</span> :Sıcaklık
            <span class="mr-1 text-xs">{{ getTemperatureDesc(rightTemperature) }}</span>
          </div>
          <div 
            class="w-3 h-3 rounded-full ml-2" 
            :style="{ backgroundColor: getColorHex(rightTemperature) }"
          ></div>
        </div>
        <div class="flex items-center mt-1 justify-end">
          <div class="text-xs flex items-center">
            <span 
              class="mr-1" 
              :class="rightPressure > 1010 ? 'text-blue-300' : 'text-red-300'"
            >
              {{ getPressureDesc(rightPressure) }}
            </span>
            <span class="font-bold mr-1">{{ rightPressure }} hPa</span> :Basınç
          </div>
        </div>
        <div class="text-xs mt-1 text-right" :class="getWeatherTextColor(rightTemperature, rightPressure)">
          {{ getWeatherDesc(rightTemperature, rightPressure) }}
        </div>
      </div>
    </div>

    <!-- Basınç Farkı ve Rüzgar Göstergesi -->
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div class="bg-gray-800 bg-opacity-75 p-2 rounded-lg text-white shadow-lg text-center">
        <div class="text-xs">
          Basınç Farkı: 
          <span 
            class="font-bold" 
            :class="Math.abs(leftPressure - rightPressure) > 20 ? 'text-yellow-300' : 'text-gray-300'"
          >
            {{ Math.abs(leftPressure - rightPressure) }} hPa
          </span>
        </div>
        <div class="flex items-center justify-center mt-1">
          <div class="text-xs">
            Rüzgar Yönü: 
            <span class="font-bold">
              {{ leftPressure > rightPressure ? 'Soldan Sağa →' : leftPressure < rightPressure ? 'Sağdan Sola ←' : 'Durgun' }}
            </span>
          </div>
        </div>
        <div v-if="Math.abs(leftPressure - rightPressure) > 0" class="mt-1">
          <div class="flex justify-center">
            <svg 
              width="50" 
              height="10" 
              class="text-white"
              :style="{ transform: leftPressure > rightPressure ? 'rotate(0deg)' : 'rotate(180deg)', opacity: Math.min(1, Math.abs(leftPressure - rightPressure) / 50) }"
            >
              <line x1="0" y1="5" x2="40" y2="5" stroke="currentColor" stroke-width="2" />
              <polygon points="40,0 50,5 40,10" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Minimal Kontrol Paneli Butonu -->
    <div 
      class="absolute bottom-0 right-0 mb-2 mr-2 z-10"
      v-show="!isPanelOpen"
    >
      <button 
        @click="isPanelOpen = true" 
        class="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>
    </div>

    <!-- Kontrol Paneli -->
    <div 
      class="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-90 text-white transition-transform duration-300 transform"
      :class="isPanelOpen ? 'translate-y-0' : 'translate-y-full'"
    >
      <div class="container mx-auto px-4 py-2 relative">
        <!-- Kapatma Butonu -->
        <button 
          @click="isPanelOpen = false" 
          class="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Panel İçeriği -->
        <div class="flex flex-col space-y-2">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold">Rüzgar Oluşumu Simülasyonu</h2>
            <button 
              @click="resetSimulation" 
              class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-xs transition-colors"
            >
              Sıfırla
            </button>
          </div>
          
          <!-- Ana Ayarlar (Kompakt Görünüm) -->
          <div class="grid grid-cols-2 gap-2">
            <!-- Sol Bölge -->
            <div class="bg-gray-700 rounded px-2 py-1">
              <div class="grid grid-cols-2 gap-1 items-center">
                <div class="text-xs">Sol Sıcaklık:</div>
                <div class="flex items-center">
                  <input 
                    type="range" 
                    v-model="leftTemperature" 
                    min="0" 
                    max="100" 
                    class="w-full h-4"
                    @input="updateSimulation"
                  >
                  <span class="text-xs ml-1 w-6">{{ leftTemperature }}</span>
                </div>
                
                <div class="text-xs">Basınç Ofset:</div>
                <div class="flex items-center">
                  <input 
                    type="range" 
                    v-model="leftPressureOffset" 
                    min="-50" 
                    max="50" 
                    class="w-full h-4"
                    @input="updateSimulation"
                  >
                  <span class="text-xs ml-1 w-8">{{ leftPressureOffset }}</span>
                </div>
              </div>
            </div>
            
            <!-- Sağ Bölge -->
            <div class="bg-gray-700 rounded px-2 py-1">
              <div class="grid grid-cols-2 gap-1 items-center">
                <div class="text-xs">Sağ Sıcaklık:</div>
                <div class="flex items-center">
                  <input 
                    type="range" 
                    v-model="rightTemperature" 
                    min="0" 
                    max="100" 
                    class="w-full h-4"
                    @input="updateSimulation"
                  >
                  <span class="text-xs ml-1 w-6">{{ rightTemperature }}</span>
                </div>
                
                <div class="text-xs">Basınç Ofset:</div>
                <div class="flex items-center">
                  <input 
                    type="range" 
                    v-model="rightPressureOffset" 
                    min="-50" 
                    max="50" 
                    class="w-full h-4"
                    @input="updateSimulation"
                  >
                  <span class="text-xs ml-1 w-8">{{ rightPressureOffset }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Diğer Ayarlar -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-gray-700 rounded px-2 py-1 flex items-center">
              <div class="text-xs mr-2">Tanecik:</div>
              <div class="flex items-center flex-1">
                <input 
                  type="range" 
                  v-model="particleCount" 
                  min="100" 
                  max="2000" 
                  step="100" 
                  class="w-full h-4"
                  @change="resetSimulation"
                >
                <span class="text-xs ml-1 w-8">{{ particleCount }}</span>
              </div>
            </div>
            
            <div class="bg-gray-700 rounded px-2 py-1 flex items-center">
              <div class="text-xs mr-2">Hız:</div>
              <div class="flex items-center flex-1">
                <input 
                  type="range" 
                  v-model="simulationSpeed" 
                  min="0.1" 
                  max="3" 
                  step="0.1" 
                  class="w-full h-4"
                  @input="updateSimulation"
                >
                <span class="text-xs ml-1 w-6">{{ simulationSpeed }}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Kontrol paneli durumu
const isPanelOpen = ref(false);

// Simülasyon ayarları - temel değerler
const leftTemperature = ref(25);
const rightTemperature = ref(75);
const particleCount = ref(500);
const simulationSpeed = ref(1);

// Basınç değişimi için parametreler
const leftPressureOffset = ref(0); // Kullanıcının manuel basınç düzeltmesi
const rightPressureOffset = ref(0); // Kullanıcının manuel basınç düzeltmesi
const standardPressure = 1013; // Deniz seviyesinde standart basınç (hPa)
const basePressure = computed(() => standardPressure); // Temel basınç değeri

// Dinamik hesaplanan basınç değerleri
const leftPressure = computed(() => {
  return calculatePressure(leftTemperature.value) + leftPressureOffset.value;
});

const rightPressure = computed(() => {
  return calculatePressure(rightTemperature.value) + rightPressureOffset.value;
});

// Sıcaklığa göre basınç hesaplama fonksiyonu
const calculatePressure = (temperature) => {
  // Sıcaklık-basınç ilişkisi (Basitleştirilmiş model): 
  // Sıcaklık arttıkça basınç düşer (havanın genleşmesi ve yükselmesi nedeniyle)
  // Sıcaklık düştükçe basınç artar (havanın yoğunlaşması ve alçalması nedeniyle)
  
  // Sıcaklık referansı (25°C standart sıcaklık olarak kabul edilir)
  const referenceTemp = 25;
  
  // Sıcaklık farkının basınç üzerindeki etkisi
  // Her 10°C artış için yaklaşık 4 hPa basınç düşüşü varsayılır
  const tempEffect = (referenceTemp - temperature) * 0.4;
  
  // Hesaplanan basınç (standardPressure + sıcaklık etkisi)
  return Math.round(basePressure.value + tempEffect);
};

// Basınç değişikliklerini izle ve değerleri güncelle
watch([leftTemperature, rightTemperature], () => {
  updateSimulation();
});

// Sıcaklık renk kodu dönüşüm fonksiyonu (hex renk kodu olarak)
const getColorHex = (temp) => {
  const color = getTemperatureColor(temp);
  return '#' + color.getHexString();
};

// Sıcaklık durumu açıklamaları
const getTemperatureDesc = (temp) => {
  if (temp < 20) return '(Soğuk)';
  if (temp < 40) return '(Ilık)';
  if (temp < 70) return '(Sıcak)';
  return '(Çok Sıcak)';
};

// Basınç durumu açıklamaları
const getPressureDesc = (pressure) => {
  if (pressure < 980) return '(Çok Düşük)';
  if (pressure < 1000) return '(Düşük)';
  if (pressure < 1020) return '(Normal)';
  if (pressure < 1040) return '(Yüksek)';
  return '(Çok Yüksek)';
};

// Hava durumu açıklaması
const getWeatherDesc = (temp, pressure) => {
  if (temp > 60 && pressure < 1000) return 'Yükselen sıcak hava, alçak basınç bölgesi';
  if (temp < 30 && pressure > 1020) return 'Alçalan soğuk hava, yüksek basınç bölgesi';
  if (temp > 60) return 'Yükselen sıcak hava';
  if (temp < 30) return 'Alçalan soğuk hava';
  if (pressure < 1000) return 'Alçak basınç bölgesi';
  if (pressure > 1020) return 'Yüksek basınç bölgesi';
  return 'Normal koşullar';
};

// Hava durumu metin rengi
const getWeatherTextColor = (temp, pressure) => {
  if (temp > 60 && pressure < 1000) return 'text-red-300';
  if (temp < 30 && pressure > 1020) return 'text-blue-300';
  if (temp > 60) return 'text-red-300';
  if (temp < 30) return 'text-blue-300';
  if (pressure < 1000) return 'text-yellow-300';
  if (pressure > 1020) return 'text-green-300';
  return 'text-gray-300';
};

// Three.js değişkenleri
let scene, camera, renderer, controls;
let particles = [];
let container;

// Simülasyon değişkenleri
let animationId = null;
let isRunning = false;

// Simülasyonu başlatan fonksiyon
const initSimulation = () => {
  // Three.js sahnesini oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a202c); // Koyu arka plan
  
  // Kamera ayarları
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;
  camera.position.y = 5;
  
  // Renderer ayarları
  container = document.getElementById('simulation-container');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Kontroller (Kullanıcı simülasyonu döndürebilsin)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Simülasyon odası (duvarlar, taban, tavan)
  createRoom();
  
  // Bölünmüş bölge gösterimi (görsel sınır çizgisi)
  const dividerGeometry = new THREE.BoxGeometry(0.1, 10, 10);
  const dividerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.2 
  });
  const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
  scene.add(divider);
  
  // Tanecikleri oluştur
  createParticles();
  
  // Animate döngüsünü başlat
  isRunning = true;
  animate();
  
  // Ekran boyutu değiştiğinde yeniden ayarla
  window.addEventListener('resize', onWindowResize);
};

// Simülasyon odasını oluşturan fonksiyon (duvarlar, taban, tavan)
const createRoom = () => {
  const roomSize = 20;
  const wallThickness = 0.1;
  const wallColor = 0x1a202c; // Arka planla aynı renk
  
  // Taban
  const floorGeometry = new THREE.BoxGeometry(roomSize * 2, wallThickness, roomSize * 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    transparent: true, 
    opacity: 0 
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -roomSize / 2;
  scene.add(floor);
  
  // Tavan
  const ceilingGeometry = new THREE.BoxGeometry(roomSize * 2, wallThickness, roomSize * 2);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    transparent: true, 
    opacity: 0 
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.y = roomSize / 2;
  scene.add(ceiling);
  
  // Duvarlar
  const backWallGeometry = new THREE.BoxGeometry(roomSize * 2, roomSize, wallThickness);
  const backWallMaterial = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    transparent: true, 
    opacity: 0
  });
  const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWall.position.z = -roomSize;
  scene.add(backWall);
  
  const frontWallGeometry = new THREE.BoxGeometry(roomSize * 2, roomSize, wallThickness);
  const frontWallMaterial = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    transparent: true, 
    opacity: 0
  });
  const frontWall = new THREE.Mesh(frontWallGeometry, frontWallMaterial);
  frontWall.position.z = roomSize;
  scene.add(frontWall);
  
  const leftWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize, roomSize * 2);
  const leftWallMaterial = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    transparent: true, 
    opacity: 0 
  });
  const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
  leftWall.position.x = -roomSize;
  scene.add(leftWall);
  
  const rightWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize, roomSize * 2);
  const rightWallMaterial = new THREE.MeshStandardMaterial({ 
    color: wallColor, 
    transparent: true, 
    opacity: 0 
  });
  const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
  rightWall.position.x = roomSize;
  scene.add(rightWall);
};

// Tanecikleri oluşturan fonksiyon
const createParticles = () => {
  particles = [];
  const roomSize = 9.5; // Odadan biraz küçük olsun, duvarlara çarpmaması için
  
  // Tüm eski tanecikleri temizle
  scene.children.forEach(child => {
    if (child.userData.isParticle) {
      scene.remove(child);
    }
  });
  
  // Yeni tanecikleri oluştur
  for (let i = 0; i < particleCount.value; i++) {
    // Tanecik geometrisi ve materyali
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const side = Math.random() < 0.5 ? 'left' : 'right';
    
    // Tanecik pozisyonu
    const x = side === 'left' 
      ? -roomSize/2 + Math.random() * (roomSize/2 - 0.5) 
      : 0.5 + Math.random() * (roomSize/2 - 0.5);
    const y = -roomSize/2 + Math.random() * roomSize;
    const z = -roomSize/2 + Math.random() * roomSize;
    
    // Tanecik rengi, sıcaklığa göre değişecek
    const particleMaterial = new THREE.MeshStandardMaterial({ 
      color: side === 'left' ? getTemperatureColor(leftTemperature.value) : getTemperatureColor(rightTemperature.value),
      emissive: side === 'left' ? getTemperatureColor(leftTemperature.value) : getTemperatureColor(rightTemperature.value),
      emissiveIntensity: 0.5
    });
    
    // Tanecik mesh'i
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(x, y, z);
    particle.userData = {
      isParticle: true,
      side: side,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ),
      initialPosition: new THREE.Vector3(x, y, z)
    };
    
    scene.add(particle);
    particles.push(particle);
  }
};

// Sıcaklığa göre renk döndüren fonksiyon
const getTemperatureColor = (temp) => {
  // Sıcaklık 0-100 arası, 0 en soğuk (mavi), 100 en sıcak (kırmızı)
  const normalizedTemp = Math.max(0, Math.min(100, temp)) / 100;
  
  // Mavi (soğuk) -> Mor -> Kırmızı (sıcak) geçiş
  if (normalizedTemp < 0.5) {
    // Mavi -> Mor
    const r = Math.floor(normalizedTemp * 2 * 255);
    return new THREE.Color(r/255, 0, 1);
  } else {
    // Mor -> Kırmızı
    const b = Math.floor((1 - (normalizedTemp - 0.5) * 2) * 255);
    return new THREE.Color(1, 0, b/255);
  }
};

// Animasyon fonksiyonu
const animate = () => {
  if (!isRunning) return;
  
  animationId = requestAnimationFrame(animate);
  
  // Taneciklerin hareketi ve davranışı
  updateParticles();
  
  // Kontrolleri güncelle
  controls.update();
  
  // Sahneyi render et
  renderer.render(scene, camera);
};

// Tanecikleri güncelleyen fonksiyon
const updateParticles = () => {
  const roomSize = 9.5;
  const speedFactor = simulationSpeed.value;
  
  particles.forEach(particle => {
    // Taneciğin hangi tarafta olduğunu belirle
    const side = particle.position.x < 0 ? 'left' : 'right';
    
    // Tanecik rengini güncelle (sıcaklığa göre)
    const temperature = side === 'left' ? leftTemperature.value : rightTemperature.value;
    particle.material.color.set(getTemperatureColor(temperature));
    particle.material.emissive.set(getTemperatureColor(temperature));
    
    // Sıcaklığa göre hız değişimi
    const tempEffect = temperature / 100; // 0-1 arası normalize
    
    // Basınca göre etki (basınç düşükse tanecikler daha hızlı hareket eder)
    const pressure = side === 'left' ? leftPressure.value : rightPressure.value;
    const pressureEffect = 1 - ((pressure - 900) / 200); // 900-1100 aralığını 1-0 aralığına normalize
    
    // Termal hareket (sıcaklık yükseldikçe daha çok rastgele hareket)
    particle.userData.velocity.x += (Math.random() - 0.5) * 0.001 * tempEffect * speedFactor;
    particle.userData.velocity.y += (Math.random() - 0.5) * 0.001 * tempEffect * speedFactor;
    particle.userData.velocity.z += (Math.random() - 0.5) * 0.001 * tempEffect * speedFactor;
    
    // Basınç farkına göre hareket (düşük basınçtan yüksek basınca doğru)
    if (leftPressure.value !== rightPressure.value) {
      const pressureDiff = (leftPressure.value - rightPressure.value) / 200; // Normalize
      particle.userData.velocity.x += 0.0005 * pressureDiff * speedFactor;
    }
    
    // Isınan hava yükselir (sıcaklık arttıkça yukarı doğru kuvvet)
    particle.userData.velocity.y += 0.0002 * tempEffect * speedFactor;
    
    // Yerçekimi etkisi (aşağı doğru çekme - soğuk havada daha etkili)
    particle.userData.velocity.y -= 0.0001 * (1 - tempEffect) * speedFactor;
    
    // Hız limitleme
    const maxVelocity = 0.05 * speedFactor;
    const velocityLength = particle.userData.velocity.length();
    if (velocityLength > maxVelocity) {
      particle.userData.velocity.multiplyScalar(maxVelocity / velocityLength);
    }
    
    // Tanecik pozisyonunu güncelle
    particle.position.add(particle.userData.velocity);
    
    // Duvarlara çarpınca seken davranış
    if (Math.abs(particle.position.x) > roomSize) {
      particle.userData.velocity.x *= -0.8;
      particle.position.x = Math.sign(particle.position.x) * roomSize;
    }
    
    if (Math.abs(particle.position.y) > roomSize/2) {
      particle.userData.velocity.y *= -0.8;
      particle.position.y = Math.sign(particle.position.y) * roomSize/2;
    }
    
    if (Math.abs(particle.position.z) > roomSize) {
      particle.userData.velocity.z *= -0.8;
      particle.position.z = Math.sign(particle.position.z) * roomSize;
    }
  });
};

// Pencere boyutu değiştiğinde çağrılan fonksiyon
const onWindowResize = () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
};

// Simülasyonu güncelle
const updateSimulation = () => {
  if (!scene) return;
  
  // Mevcut taneciklerin özelliklerini güncelle
  particles.forEach(particle => {
    const side = particle.position.x < 0 ? 'left' : 'right';
    const temperature = side === 'left' ? leftTemperature.value : rightTemperature.value;
    
    // Rengi güncelle
    particle.material.color.set(getTemperatureColor(temperature));
    particle.material.emissive.set(getTemperatureColor(temperature));
  });
};

// Simülasyonu sıfırla
const resetSimulation = () => {
  // Tanecikleri yeniden oluştur
  createParticles();
};

// Bileşen yüklendiğinde simülasyonu başlat
onMounted(() => {
  initSimulation();
});

// Bileşen kaldırılmadan önce simülasyonu temizle
onBeforeUnmount(() => {
  isRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  if (renderer) {
    renderer.dispose();
    const container = document.getElementById('simulation-container');
    if (container && container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  }
  
  window.removeEventListener('resize', onWindowResize);
});
</script>