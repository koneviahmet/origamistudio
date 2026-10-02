<template>
  <div class="h-screen w-full relative overflow-hidden bg-gray-900">
    <!-- Ana simülasyon alanı -->
    <div id="simulation-container" class="w-full h-full"></div>
    

    <!-- Animasyon Kontrol Butonları (üst orta) -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      <button id="start-button" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-lg">
        Başlat
      </button>
      <button id="stop-button" class="hidden bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow-lg">
        Durdur
      </button>
    </div>
    
    <!-- Ayarlar butonu (mobil için) -->
    <div class="md:hidden absolute top-4 right-4">
      <button id="settings-toggle-mobile" class="bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
    
    <!-- Mobil ayarlar paneli (varsayılan olarak gizli) -->
    <div id="settings-panel-mobile" class="hidden fixed top-0 left-0 inset-0 bg-black z-10 md:hidden">
      <div class="bg-gray-800 text-white rounded-lg p-4 w-full h-full overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">Ayarlar</h3>
          <button id="close-settings-mobile" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Mobil ayarlar içeriği -->
        <div class="space-y-4">
          <!-- Animasyon Hızı -->
          <div>
            <label for="animation-speed-mobile" class="block mb-1">Animasyon Hızı</label>
            <input type="range" id="animation-speed-mobile" min="0.5" max="3" step="0.1" value="1" class="w-full">
            <div class="flex justify-between text-xs">
              <span>Yavaş</span>
              <span>Normal</span>
              <span>Hızlı</span>
            </div>
          </div>
          
          <!-- Işık Şiddeti -->
          <div>
            <label for="light-intensity-mobile" class="block mb-1">Işık Şiddeti</label>
            <input type="range" id="light-intensity-mobile" min="0.5" max="5" step="0.1" value="2" class="w-full">
            <div class="flex justify-between text-xs">
              <span>Düşük</span>
              <span>Normal</span>
              <span>Yüksek</span>
            </div>
          </div>
          
          <!-- Lamba Mesafesi (YENİ) -->
          <div>
            <label for="lamp-distance-mobile" class="block mb-1">Lambalar Arası Mesafe</label>
            <input type="range" id="lamp-distance-mobile" min="3" max="12" step="0.5" value="6" class="w-full">
            <div class="flex justify-between text-xs">
              <span>Yakın</span>
              <span>Normal</span>
              <span>Uzak</span>
            </div>
          </div>
          
          <!-- Arkaplan Rengi -->
          <div>
            <label class="block mb-1">Arkaplan Rengi</label>
            <div class="grid grid-cols-3 gap-2">
              <button class="bg-gray-900 border border-gray-600 h-8 rounded" data-color="#111827"></button>
              <button class="bg-black border border-gray-600 h-8 rounded" data-color="#000000"></button>
              <button class="bg-indigo-900 border border-gray-600 h-8 rounded" data-color="#1e3a8a"></button>
              <button class="bg-green-900 border border-gray-600 h-8 rounded" data-color="#064e3b"></button>
              <button class="bg-red-900 border border-gray-600 h-8 rounded" data-color="#7f1d1d"></button>
              <button class="bg-purple-900 border border-gray-600 h-8 rounded" data-color="#4c1d95"></button>
            </div>
          </div>
          
          <!-- Kamera Açıları -->
          <div>
            <label class="block mb-1">Kamera Açısı</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="default-view-mobile" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
                Varsayılan
              </button>
              <button id="top-view-mobile" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
                Üstten
              </button>
              <button id="side-view-mobile" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
                Yandan
              </button>
              <button id="front-view-mobile" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
                Önden
              </button>
              <button id="follow-view-mobile" class="bg-indigo-700 hover:bg-indigo-600 text-white py-1 px-2 rounded col-span-2">
                Çocuğu Takip Et
              </button>
            </div>
          </div>
          
          <!-- Resetleme Butonu -->
          <button id="reset-settings-mobile" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
    
    <!-- Masaüstü Ayarlar Paneli (sağ tarafta) -->
    <div id="settings-panel" class="hidden md:block absolute top-0 right-0 w-72 h-full bg-gray-800 text-white p-4 overflow-y-auto transform transition-transform duration-300">
      
      <!-- Masaüstü ayarlar içeriği -->
      <div class="space-y-6">
        <!-- Animasyon Hızı -->
        <div>
          <label for="animation-speed" class="block mb-1">Animasyon Hızı</label>
          <input type="range" id="animation-speed" min="0.5" max="3" step="0.1" value="1" class="w-full">
          <div class="flex justify-between text-xs">
            <span>Yavaş</span>
            <span>Normal</span>
            <span>Hızlı</span>
          </div>
        </div>
        
        <!-- Işık Şiddeti -->
        <div>
          <label for="light-intensity" class="block mb-1">Işık Şiddeti</label>
          <input type="range" id="light-intensity" min="0.5" max="5" step="0.1" value="2" class="w-full">
          <div class="flex justify-between text-xs">
            <span>Düşük</span>
            <span>Normal</span>
            <span>Yüksek</span>
          </div>
        </div>
        
        <!-- Lamba Mesafesi (YENİ) -->
        <div>
          <label for="lamp-distance" class="block mb-1">Lambalar Arası Mesafe</label>
          <input type="range" id="lamp-distance" min="0" max="12" step="0.3" value="6" class="w-full">
          <div class="flex justify-between text-xs">
            <span>Yakın</span>
            <span>Normal</span>
            <span>Uzak</span>
          </div>
        </div>
        
        <!-- Kamera Açıları -->
        <div>
          <label class="block mb-1">Kamera Açısı</label>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <button id="default-view" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
              Varsayılan
            </button>
            <button id="top-view" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
              Üstten
            </button>
            <button id="side-view" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
              Yandan
            </button>
            <button id="front-view" class="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded">
              Önden
            </button>
            <button id="follow-view" class="bg-indigo-700 hover:bg-indigo-600 text-white py-1 px-2 rounded col-span-2">
              Çocuğu Takip Et
            </button>
          </div>
        </div>
        
        <!-- Resetleme Butonu -->
        <button id="reset-settings" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">
          Ayarları Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Genel üç boyutlu simülasyon değişkenleri
let scene, camera, renderer, controls;
let road, streetLamps = [], lampLights = [], person, personShadow;
let animationFrameId = null;
let animationSpeed = 1;
let isPlaying = false;
let walkDirection = 1; // 1: pozitif yönde ilerleme, -1: negatif yönde ilerleme
let personPosition = -10; // Kişinin başlangıç pozisyonu
let walkingCycle = 0; // Yürüme döngüsü için sayaç
let lightIntensity = 2; // Işık şiddeti için varsayılan değer
let lampDistance = 2; // Lambalar arası mesafe
let isFollowCameraActive = false; // Takip kamerasının aktif olup olmadığını kontrol eden değişken

// Kamera pozisyon ayarları
const cameraPositions = {
  default: { position: new THREE.Vector3(15, 5, 15), target: new THREE.Vector3(0, 0, 0) },
  top: { position: new THREE.Vector3(0, 20, 0), target: new THREE.Vector3(0, 0, 0) },
  side: { position: new THREE.Vector3(0, 5, 20), target: new THREE.Vector3(0, 0, 0) },
  front: { position: new THREE.Vector3(20, 5, 0), target: new THREE.Vector3(0, 0, 0) },
  follow: { position: new THREE.Vector3(0, 3, 5), target: new THREE.Vector3(0, 1, 0) } // Takip kamerası
};

// Arkaplan renk ayarları
const defaultBackgroundColor = '#111827';

onMounted(() => {
  // Simülasyonu başlat
  initSimulation();
  
  // Olay dinleyicilerini ayarla
  setupEventListeners();
  
  // Pencere yeniden boyutlandırıldığında renderer'ı güncelle
  window.addEventListener('resize', onWindowResize);
});

onBeforeUnmount(() => {
  // Pencere yeniden boyutlandırma olayını kaldır
  window.removeEventListener('resize', onWindowResize);
  
  // Olay dinleyicilerini temizle
  cleanupEventListeners();
  
  // Animasyon döngüsünü durdur
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Three.js nesnelerini temizle
  if (renderer) {
    renderer.dispose();
  }
});

// Simülasyonu başlat
function initSimulation() {
  // Three.js sahnesini oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(defaultBackgroundColor);
  
  // Kamerayı oluştur
  camera = new THREE.PerspectiveCamera(
    60, // Görüş açısı (FOV)
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  
  // Kamera pozisyonunu ayarla
  camera.position.copy(cameraPositions.default.position);
  camera.lookAt(cameraPositions.default.target);
  
  // Renderer'ı oluştur
  const container = document.getElementById('simulation-container');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true; // Gölgeleri etkinleştir
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Yumuşak gölgeler
  container.appendChild(renderer.domElement);
  
  // Kontrolleri ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Simülasyon öğelerini oluştur
  createEnvironment();
  
  // İlk render
  render();
}

// Çevre elemanlarını oluştur
function createEnvironment() {
  // Zemin/Yol
  const roadGeometry = new THREE.PlaneGeometry(50, 10);
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  });
  road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  scene.add(road);
  
  // Yol kenarları (hafif yükseltilmiş)
  const sideWalkGeometry = new THREE.PlaneGeometry(50, 3);
  const sideWalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9
  });
  
  const leftSideWalk = new THREE.Mesh(sideWalkGeometry, sideWalkMaterial);
  leftSideWalk.rotation.x = -Math.PI / 2;
  leftSideWalk.position.set(0, 0.05, -6.5);
  leftSideWalk.receiveShadow = true;
  scene.add(leftSideWalk);
  
  const rightSideWalk = new THREE.Mesh(sideWalkGeometry, sideWalkMaterial);
  rightSideWalk.rotation.x = -Math.PI / 2;
  rightSideWalk.position.set(0, 0.05, 6.5);
  rightSideWalk.receiveShadow = true;
  scene.add(rightSideWalk);
  
  // Sokak lambaları
  createStreetLamps();
  
  // İnsan
  createPerson();
  
  // Ortam ışığı (çok loş)
  const ambientLight = new THREE.AmbientLight(0x222222, 0.3);
  scene.add(ambientLight);
  
  // Ay ışığı (hafif mavi tonlu direksiyonel ışık)
  const moonLight = new THREE.DirectionalLight(0x556677, 0.1);
  moonLight.position.set(-50, 30, -50);
  scene.add(moonLight);
}

// İnsan modeli için yardımcı fonksiyonlar
function createFacialFeatures(head) {
  // Sol göz
  const leftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  leftEye.position.set(0.06, 0.02, 0.16);
  head.add(leftEye);

  // Sağ göz
  const rightEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  rightEye.position.set(-0.06, 0.02, 0.16);
  head.add(rightEye);

  // Ağız
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.02, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x942525 })
  );
  mouth.position.set(0, -0.08, 0.18);
  head.add(mouth);
}

// Birden fazla sokak lambasını oluştur
function createStreetLamps() {
  // Önce önceki lambaları temizle
  streetLamps.forEach(lamp => scene.remove(lamp));
  streetLamps = [];
  lampLights = [];
  
  // İlk sokak lambası (sol taraf)
  createStreetLamp(-lampDistance, -2, 0);
  
  // İkinci sokak lambası (sağ taraf)
  createStreetLamp(lampDistance, -2, 1);
}

// Sokak lambasını oluştur
function createStreetLamp(xPosition, zPosition, index) {
  const streetLamp = new THREE.Group();
  
  // Lamba diregi
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.7,
    metalness: 0.5
  });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 2.5;
  pole.castShadow = false; // Direğin gölgesini kaldır
  streetLamp.add(pole);
  
  // Lamba kolu
  const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
  const arm = new THREE.Mesh(armGeometry, poleMaterial);
  arm.position.set(0, 4.5, 0.75);
  arm.rotation.x = Math.PI / 2;
  arm.castShadow = true;
  streetLamp.add(arm);
  
  // Lamba başlığı
  const headGeometry = new THREE.CylinderGeometry(0.2, 0.4, 0.5, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.7
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 4.5, 1.5);
  head.rotation.x = Math.PI * 2;
  head.castShadow = true;
  streetLamp.add(head);
  
  // Lamba camı
  const glassGeometry = new THREE.CylinderGeometry(0.19, 0.39, 0.05, 16);
  
  // İki lamba için farklı renk tonları kullanarak ayırt edici yapalım
  const glassColor = index === 0 ? 0xffffaa : 0xffeeaa;
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: glassColor,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    emissive: glassColor,
    emissiveIntensity: 0.5
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.set(0, 4.2, 1.52);
  glass.rotation.x = Math.PI * 2;
  streetLamp.add(glass);
  
  // Lamba ışığı (nokta ışık)
  // İki lamba için biraz farklı renk tonları kullanalım
  const lightColor = index === 0 ? 0xffffee : 0xffeedd;
  const lampLight = new THREE.SpotLight(lightColor, lightIntensity, 30, Math.PI / 4, 0.3, 1);
  lampLight.position.set(0, 4.5, 1.5);
  lampLight.target.position.set(0, 0, 1.5);
  streetLamp.add(lampLight.target);
  lampLight.castShadow = true;
  lampLight.shadow.bias = -0.0001;
  lampLight.shadow.mapSize.width = 1024;
  lampLight.shadow.mapSize.height = 1024;
  
  // Gölgelerin birbiriyle etkileşimini görmek için farklı shadow paramtreleri
  if (index === 0) {
    lampLight.shadow.camera.far = 35;
  } else {
    lampLight.shadow.camera.far = 30;
  }
  
  streetLamp.add(lampLight);
  
  // Sokak lambasını sahneye ekle
  streetLamp.position.x = xPosition;
  streetLamp.position.z = zPosition;
  scene.add(streetLamp);
  
  // Lamba ve ışık referanslarını saklama
  streetLamps.push(streetLamp);
  lampLights.push(lampLight);
}

// İnsan karakterini hazır assetlerden oluştur
function createPerson() {
  // İnsan grubu
  person = new THREE.Group();
  
  // Baş
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
  );
  head.position.y = 1.4;
  createFacialFeatures(head);
  person.add(head);
  
  // Kısa saç
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  hair.position.set(0, 1.45, -0.02);
  hair.rotation.x = -Math.PI / 12;
  person.add(hair);

  // Vücut
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16),
    new THREE.MeshStandardMaterial({ color: 0x3366cc })
  );
  body.position.y = 0.95;
  body.castShadow = true;
  person.add(body);
  
  // Bacaklar
  const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(0.1, 0.3, 0);
  leftLeg.castShadow = true;
  person.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(-0.1, 0.3, 0);
  rightLeg.castShadow = true;
  person.add(rightLeg);
  
  // Kollar
  const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(0.32, 1.05, 0);
  leftArm.rotation.z = Math.PI / 8;
  leftArm.castShadow = true;
  person.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(-0.32, 1.05, 0);
  rightArm.rotation.z = -Math.PI / 8;
  rightArm.castShadow = true;
  person.add(rightArm);
  
  // Ayaklar
  const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.position.set(0.1, 0, 0.05);
  leftFoot.castShadow = true;
  person.add(leftFoot);
  
  const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
  rightFoot.position.set(-0.1, 0, 0.05);
  rightFoot.castShadow = true;
  person.add(rightFoot);
  
  // Kişiyi başlangıç pozisyonuna yerleştir
  person.position.set(personPosition, 0, 0);
  
  // Yüzü yürüme yönüne doğru çevir
  person.rotation.y = walkDirection > 0 ? Math.PI / 2 : -Math.PI / 2;
  
  // Gölge projeksiyonu için düz nesne
  personShadow = new THREE.Group();
  person.add(personShadow);
  
  // Kişiyi sahneye ekle
  scene.add(person);
}

// Animasyonu güncelle
function updateAnimation() {
  if (isPlaying) {
    // Yürüme döngüsünü güncelle
    walkingCycle += 0.1 * animationSpeed;
    
    // Kişinin pozisyonunu güncelle
    personPosition += 0.05 * walkDirection * animationSpeed;
    person.position.x = personPosition;
    
    // Yol sınırlarına gelince yön değiştir
    if (personPosition > 10) {
      walkDirection = -1;
      person.rotation.y = -Math.PI / 2; // Yüzü sola doğru döndür
    } else if (personPosition < -10) {
      walkDirection = 1;
      person.rotation.y = Math.PI / 2; // Yüzü sağa doğru döndür
    }
    
    // Her bir lambaya mesafeyi hesapla
    const distancesToLamps = streetLamps.map(lamp => 
      Math.abs(person.position.x - lamp.position.x)
    );
    

    // Bacakları ve kolları hareket ettirerek gerçekçi yürüme animasyonu
    if (person.children.length >= 8) {
      // Sol bacak
      person.children[3].rotation.x = Math.sin(walkingCycle) * 0.5;
      // Sağ bacak
      person.children[4].rotation.x = Math.sin(walkingCycle + Math.PI) * 0.5;
      
      // Sol kol
      person.children[5].rotation.x = Math.sin(walkingCycle + Math.PI) * 0.3;
      person.children[5].rotation.z = Math.PI / 8 + Math.sin(walkingCycle) * 0.1;
      
      // Sağ kol
      person.children[6].rotation.x = Math.sin(walkingCycle) * 0.3;
      person.children[6].rotation.z = -Math.PI / 8 + Math.sin(walkingCycle + Math.PI) * 0.1;
      
      // Sol ayak
      person.children[7].rotation.x = Math.sin(walkingCycle) * 0.3;
      
      // Sağ ayak
      person.children[8].rotation.x = Math.sin(walkingCycle + Math.PI) * 0.3;
      
      // Vücut hafifçe sallanma
      person.position.y = Math.abs(Math.sin(walkingCycle * 2)) * 0.05;
    }
    
    // Her bir lambaya göre gölgeleri güncelle
    updateShadows(distancesToLamps);
    
    // Eğer takip kamerası aktifse, kamerayı güncelle
    if (isFollowCameraActive) {
      updateFollowCamera();
    }
  }
}

// Gölgeleri güncelle - birden fazla lambaya göre
function updateShadows(distancesToLamps) {
  // Her bir lamba için gölge ayarlarını güncelle
  lampLights.forEach((light, index) => {
    const distanceToLamp = distancesToLamps[index];
    
    // Mesafeye göre gölge yoğunluğunu ayarla
    const shadowIntensity = Math.min(1, distanceToLamp / 5); 
    
    // Karakterin sokak lambasına yakınlığına göre gölge davranışını ayarla
    if (distanceToLamp < 3) {
      // Karakter lambaya yakınsa gölge daha keskin ve kısa
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 30;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      light.shadow.bias = -0.0001;
    } else {
      // Karakter lambadan uzaksa gölge daha uzun ve bulanık
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 20;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.bias = -0.0005;
    }
    
    // Yarı gölge efekti için her lambanın shadow parametrelerini hafifçe farklılaştır
    if (index === 0) {
      light.shadow.radius = 3; // Birinci lambanın gölgesi biraz daha yumuşak
    } else {
      light.shadow.radius = 2; // İkinci lambanın gölgesi biraz daha keskin
    }
  });
}

// Render fonksiyonu
function render() {
  // Animasyonu güncelle
  updateAnimation();
  
  // Kontrolleri güncelle
  controls.update();
  
  // Sahneyi render et
  renderer.render(scene, camera);
  
  // Bir sonraki frame için çağır
  animationFrameId = requestAnimationFrame(render);
}

// Pencere yeniden boyutlandırıldığında çağrılır
function onWindowResize() {
  const container = document.getElementById('simulation-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Kamera aspect ratio'sunu güncelle
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Renderer boyutunu güncelle
  renderer.setSize(width, height);
}

// Olay dinleyicilerini ayarla
function setupEventListeners() {
  // Başlat/Durdur butonları
  document.getElementById('start-button').addEventListener('click', startAnimation);
  document.getElementById('stop-button').addEventListener('click', stopAnimation);
  
  // Animasyon hızı kontrolleri
  document.getElementById('animation-speed').addEventListener('input', updateAnimationSpeed);
  document.getElementById('animation-speed-mobile').addEventListener('input', updateAnimationSpeed);
  
  // Işık şiddeti kontrolleri
  document.getElementById('light-intensity').addEventListener('input', updateLightIntensity);
  document.getElementById('light-intensity-mobile').addEventListener('input', updateLightIntensity);
  
  // Lamba mesafesi kontrolleri (YENİ)
  document.getElementById('lamp-distance').addEventListener('input', updateLampDistance);
  document.getElementById('lamp-distance-mobile').addEventListener('input', updateLampDistance);
  
  // Kamera görünüm butonları (masaüstü)
  document.getElementById('default-view').addEventListener('click', () => setCameraPosition('default'));
  document.getElementById('top-view').addEventListener('click', () => setCameraPosition('top'));
  document.getElementById('side-view').addEventListener('click', () => setCameraPosition('side'));
  document.getElementById('front-view').addEventListener('click', () => setCameraPosition('front'));
  document.getElementById('follow-view').addEventListener('click', () => setCameraPosition('follow'));
  
  // Kamera görünüm butonları (mobil)
  document.getElementById('default-view-mobile').addEventListener('click', () => setCameraPosition('default'));
  document.getElementById('top-view-mobile').addEventListener('click', () => setCameraPosition('top'));
  document.getElementById('side-view-mobile').addEventListener('click', () => setCameraPosition('side'));
  document.getElementById('front-view-mobile').addEventListener('click', () => setCameraPosition('front'));
  document.getElementById('follow-view-mobile').addEventListener('click', () => setCameraPosition('follow'));
  
  // Arkaplan renk butonları (hem masaüstü hem mobil)
  const colorButtons = document.querySelectorAll('[data-color]');
  colorButtons.forEach(button => {
    button.addEventListener('click', () => {
      const color = button.getAttribute('data-color');
      scene.background = new THREE.Color(color);
    });
  });
  
  // Ayarları sıfırlama butonları
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
  document.getElementById('reset-settings-mobile').addEventListener('click', resetSettings);
  
  // Mobil ayarlar toggle
  document.getElementById('settings-toggle-mobile').addEventListener('click', toggleMobileSettings);
  document.getElementById('close-settings-mobile').addEventListener('click', toggleMobileSettings);
}

// Olay dinleyicilerini temizle
function cleanupEventListeners() {
  // Gerekli temizleme işlemleri burada yapılabilir
}

// Animasyonu başlat
function startAnimation() {
  isPlaying = true;
  document.getElementById('start-button').classList.add('hidden');
  document.getElementById('stop-button').classList.remove('hidden');
}

// Animasyonu durdur
function stopAnimation() {
  isPlaying = false;
  document.getElementById('stop-button').classList.add('hidden');
  document.getElementById('start-button').classList.remove('hidden');
}

// Animasyon hızını güncelle
function updateAnimationSpeed(event) {
  animationSpeed = parseFloat(event.target.value);
  
  // İki input elementini de senkronize et
  document.getElementById('animation-speed').value = animationSpeed;
  document.getElementById('animation-speed-mobile').value = animationSpeed;
}

// Işık şiddetini güncelle
function updateLightIntensity(event) {
  lightIntensity = parseFloat(event.target.value);
  
  // Tüm ışık şiddetlerini ayarla
  lampLights.forEach(light => {
    light.intensity = lightIntensity;
  });
  
  // İki input elementini de senkronize et
  document.getElementById('light-intensity').value = lightIntensity;
  document.getElementById('light-intensity-mobile').value = lightIntensity;
}

// Lamba mesafesini güncelle (YENİ)
function updateLampDistance(event) {
  // Yeni mesafeyi al
  lampDistance = parseFloat(event.target.value);
  
  // Lambaları yeniden oluştur
  createStreetLamps();
  
  // İki input elementini de senkronize et
  document.getElementById('lamp-distance').value = lampDistance;
  document.getElementById('lamp-distance-mobile').value = lampDistance;
}

// Kamera pozisyonunu ayarla
function setCameraPosition(positionName) {
  // Takip kamerasını devre dışı bırak, eğer başka bir kamera seçilirse
  if (positionName !== 'follow') {
    isFollowCameraActive = false;
  }
  
  if (positionName in cameraPositions) {
    const position = cameraPositions[positionName];
    
    // Takip kamerası seçilirse
    if (positionName === 'follow') {
      isFollowCameraActive = true;
      updateFollowCamera();
      return;
    }
    
    // Animasyonlu geçiş
    const currentPosition = camera.position.clone();
    const targetPosition = position.position.clone();
    const duration = 1000; // ms
    const startTime = Date.now();
    
    function animateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Lineer interpolasyon ile pozisyonu güncelle
      camera.position.lerpVectors(currentPosition, targetPosition, progress);
      camera.lookAt(position.target);
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // Animasyon bitince kontrolleri güncelle
        controls.target.copy(position.target);
        controls.update();
      }
    }
    
    animateCamera();
  }
}

// Takip kamerasını güncelle - kişinin hareketine göre kamera pozisyonunu ayarlar
function updateFollowCamera() {
  if (!isFollowCameraActive || !person) return;
  
  // Kameranın kişiye göre konumunu hesapla
  const offset = new THREE.Vector3(0, 3, 5); // Kişinin arkasından ve yukarıdan takip et
  const targetOffset = new THREE.Vector3(0, 1, 0); // Kişinin üst gövdesine odaklan
  
  // Kişinin yönüne göre kamera pozisyonunu ayarla
  let cameraDirection = new THREE.Vector3();
  if (walkDirection > 0) {
    // Sağa doğru yürüyorsa
    cameraDirection.set(-5, 3, 0);
  } else {
    // Sola doğru yürüyorsa
    cameraDirection.set(5, 3, 0);
  }
  
  // Kamera pozisyonunu kişinin konumuna göre ayarla
  const targetPosition = new THREE.Vector3().copy(person.position).add(cameraDirection);
  
  // Yumuşak geçiş için lerp kullan
  camera.position.lerp(targetPosition, 0.1);
  
  // Kamera hedefini kişinin pozisyonuna ayarla
  const lookAtPosition = new THREE.Vector3().copy(person.position).add(targetOffset);
  camera.lookAt(lookAtPosition);
  
  // OrbitControls hedefini de güncelle
  controls.target.copy(lookAtPosition);
  controls.update();
}

// Ayarları sıfırla
function resetSettings() {
  // Animasyonu durdur
  stopAnimation();
  
  // Kişiyi başlangıç pozisyonuna taşı
  personPosition = -10;
  person.position.x = personPosition;
  
  // Animasyon hızını sıfırla
  animationSpeed = 1;
  document.getElementById('animation-speed').value = animationSpeed;
  document.getElementById('animation-speed-mobile').value = animationSpeed;
  
  // Işık şiddetini sıfırla
  lightIntensity = 2;
  document.getElementById('light-intensity').value = lightIntensity;
  document.getElementById('light-intensity-mobile').value = lightIntensity;
  lampLights.forEach(light => {
    light.intensity = lightIntensity;
  });
  
  // Lamba mesafesini sıfırla (YENİ)
  lampDistance = 2;
  document.getElementById('lamp-distance').value = lampDistance;
  document.getElementById('lamp-distance-mobile').value = lampDistance;
  createStreetLamps();
  
  // Arkaplan rengini sıfırla
  scene.background = new THREE.Color(defaultBackgroundColor);
  
  // Takip kamerasını devre dışı bırak
  isFollowCameraActive = false;
  
  // Kamera pozisyonunu sıfırla
  setCameraPosition('default');
  
  // Bilgi metnini güncelle
  document.getElementById('info-text').textContent = 'Konumu: Başlangıç';
  
  // Mobil ayarlar panelini kapat
  document.getElementById('settings-panel-mobile').classList.add('hidden');
}

// Mobil ayarlar panelini aç/kapat
function toggleMobileSettings() {
  const panel = document.getElementById('settings-panel-mobile');
  panel.classList.toggle('hidden');
}
</script>