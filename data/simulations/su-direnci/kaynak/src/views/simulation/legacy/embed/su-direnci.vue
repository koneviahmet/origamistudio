<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Simülasyon kontrolleri - PC görünümde sağda, mobil görünümde buton ile açılır -->
    <div class="hidden md:block absolute right-0 top-0 bottom-0 w-80 bg-gray-800 text-white p-4 overflow-y-auto z-10">
      <h2 class="text-xl font-bold mb-4">Su Direnci Simülasyonu</h2>
      
      <!-- Cisim şekli ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Cisim Şekli</h3>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="changeShape('sphere')" 
            :class="[shape === 'sphere' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded']">
            Küresel
          </button>
          <button 
            @click="changeShape('cone')" 
            :class="[shape === 'cone' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded']">
            Konik
          </button>
          <button 
            @click="changeShape('box')" 
            :class="[shape === 'box' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded']">
            Düz
          </button>
          <button 
            @click="changeShape('pyramid')" 
            :class="[shape === 'pyramid' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded']">
            Sivri Uçlu
          </button>
        </div>
      </div>

      <!-- Akıntı hızı ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Akıntı Hızı: {{ windSpeed.toFixed(1) }}</h3>
        <input 
          type="range" 
          min="0" 
          max="10" 
          step="0.1" 
          v-model.number="windSpeed" 
          class="w-full"
        />
      </div>

      <!-- Ağırlık ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Cisim Kütlesi: {{ objectMass.toFixed(1) }}</h3>
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="0.1" 
          v-model.number="objectMass" 
          class="w-full"
        />
      </div>

      <!-- Partiküller ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Su Partikül Sayısı: {{ particleCount }}</h3>
        <input 
          type="range" 
          min="100" 
          max="1000" 
          step="100" 
          v-model.number="particleCount" 
          class="w-full"
        />
      </div>

      <!-- Arka plan rengi -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Su Rengi</h3>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="backgroundColor = 0x001e3c" 
            class="w-8 h-8 rounded-full bg-blue-900 border-2" 
            :class="backgroundColor === 0x001e3c ? 'border-white' : 'border-transparent'">
          </button>
          <button 
            @click="backgroundColor = 0x004080" 
            class="w-8 h-8 rounded-full bg-blue-800 border-2" 
            :class="backgroundColor === 0x004080 ? 'border-white' : 'border-transparent'">
          </button>
          <button 
            @click="backgroundColor = 0x0075b3" 
            class="w-8 h-8 rounded-full bg-blue-600 border-2" 
            :class="backgroundColor === 0x0075b3 ? 'border-white' : 'border-transparent'">
          </button>
          <button 
            @click="backgroundColor = 0x00a1d9" 
            class="w-8 h-8 rounded-full bg-blue-400 border-2" 
            :class="backgroundColor === 0x00a1d9 ? 'border-white' : 'border-transparent'">
          </button>
        </div>
      </div>

      <!-- Kamera görünümleri -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Kamera Görünümü</h3>
        <div class="grid grid-cols-2 gap-2">
          <button @click="setCameraView('front')" class="bg-gray-600 px-3 py-1 rounded">Önden</button>
          <button @click="setCameraView('side')" class="bg-gray-600 px-3 py-1 rounded">Yandan</button>
          <button @click="setCameraView('top')" class="bg-gray-600 px-3 py-1 rounded">Üstten</button>
          <button @click="setCameraView('isometric')" class="bg-gray-600 px-3 py-1 rounded">İzometrik</button>
          <button @click="resetCameraView()" class="bg-gray-600 px-3 py-1 rounded col-span-2">Kamerayı Sıfırla</button>
        </div>
      </div>

      <!-- Sıfırlama butonu -->
      <button 
        v-if="isDefaultSettingsChanged" 
        @click="resetSettings" 
        class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4">
        Ayarları Sıfırla
      </button>
    </div>
    
    <!-- Mobil menü butonu -->
    <button 
      @click="isMobileMenuOpen = !isMobileMenuOpen" 
      class="md:hidden absolute top-2 left-2 bg-gray-800 text-white p-2 rounded-full z-20">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Mobil menü -->
    <div 
      v-if="isMobileMenuOpen" 
      class="md:hidden fixed inset-0 bg-gray-800  z-20 p-4 overflow-y-auto">
      <div class="relative">
        <button 
          @click="isMobileMenuOpen = false" 
          class=" text-white mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
            
      <!-- Cisim şekli ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-white">Cisim Şekli</h3>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="changeShape('sphere')" 
            :class="[shape === 'sphere' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded text-white']">
            Küresel
          </button>
          <button 
            @click="changeShape('cone')" 
            :class="[shape === 'cone' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded text-white']">
            Konik
          </button>
          <button 
            @click="changeShape('box')" 
            :class="[shape === 'box' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded text-white']">
            Düz
          </button>
          <button 
            @click="changeShape('pyramid')" 
            :class="[shape === 'pyramid' ? 'bg-blue-600' : 'bg-gray-600', 'px-3 py-1 rounded text-white']">
            Sivri Uçlu
          </button>
        </div>
      </div>

      <!-- Akıntı hızı ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-white">Akıntı Hızı: {{ windSpeed.toFixed(1) }}</h3>
        <input 
          type="range" 
          min="0" 
          max="10" 
          step="0.1" 
          v-model.number="windSpeed" 
          class="w-full"
        />
      </div>

      <!-- Ağırlık ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-white">Cisim Kütlesi: {{ objectMass.toFixed(1) }}</h3>
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="0.1" 
          v-model.number="objectMass" 
          class="w-full"
        />
      </div>

      <!-- Partiküller ayarları -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-white">Su Partikül Sayısı: {{ particleCount }}</h3>
        <input 
          type="range" 
          min="100" 
          max="1000" 
          step="100" 
          v-model.number="particleCount" 
          class="w-full"
        />
      </div>
      
      <!-- Arka plan rengi -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-white">Su Rengi</h3>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="backgroundColor = 0x001e3c" 
            class="w-8 h-8 rounded-full bg-blue-900 border-2" 
            :class="backgroundColor === 0x001e3c ? 'border-white' : 'border-transparent'">
          </button>
          <button 
            @click="backgroundColor = 0x004080" 
            class="w-8 h-8 rounded-full bg-blue-800 border-2" 
            :class="backgroundColor === 0x004080 ? 'border-white' : 'border-transparent'">
          </button>
          <button 
            @click="backgroundColor = 0x0075b3" 
            class="w-8 h-8 rounded-full bg-blue-600 border-2" 
            :class="backgroundColor === 0x0075b3 ? 'border-white' : 'border-transparent'">
          </button>
          <button 
            @click="backgroundColor = 0x00a1d9" 
            class="w-8 h-8 rounded-full bg-blue-400 border-2" 
            :class="backgroundColor === 0x00a1d9 ? 'border-white' : 'border-transparent'">
          </button>
        </div>
      </div>

      <!-- Kamera görünümleri -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2 text-white">Kamera Görünümü</h3>
        <div class="grid grid-cols-2 gap-2">
          <button @click="setCameraView('front')" class="bg-gray-600 px-3 py-1 rounded text-white">Önden</button>
          <button @click="setCameraView('side')" class="bg-gray-600 px-3 py-1 rounded text-white">Yandan</button>
          <button @click="setCameraView('top')" class="bg-gray-600 px-3 py-1 rounded text-white">Üstten</button>
          <button @click="setCameraView('isometric')" class="bg-gray-600 px-3 py-1 rounded text-white">İzometrik</button>
          <button @click="resetCameraView()" class="bg-gray-600 px-3 py-1 rounded col-span-2 text-white">Kamerayı Sıfırla</button>
        </div>
      </div>

      <!-- Sıfırlama butonu -->
      <button 
        v-if="isDefaultSettingsChanged" 
        @click="resetSettings" 
        class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4">
        Ayarları Sıfırla
      </button>
    </div>

    <!-- Animasyon Kontrol Butonları -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <button 
        v-if="!isAnimating" 
        @click="startAnimation" 
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Başlat
      </button>
      <button 
        v-else 
        @click="stopAnimation" 
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
        Durdur
      </button>
    </div>

    <!-- Three.js render alanı -->
    <div ref="threeContainer" class="w-full h-full"></div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Simülasyon ayarları
const DEFAULT_SETTINGS = {
  shape: 'cone',
  windSpeed: 5,
  objectMass: 3,
  particleCount: 500,
  backgroundColor: 0x004080 // Koyu mavi su rengi
};

// Simülasyon değişkenleri
const shape = ref(DEFAULT_SETTINGS.shape);
const windSpeed = ref(DEFAULT_SETTINGS.windSpeed);
const objectMass = ref(DEFAULT_SETTINGS.objectMass);
const particleCount = ref(DEFAULT_SETTINGS.particleCount);
const backgroundColor = ref(DEFAULT_SETTINGS.backgroundColor);
const isAnimating = ref(false);
const isMobileMenuOpen = ref(false);

// Three.js değişkenleri
const threeContainer = ref(null);
let scene, camera, renderer, controls;
let object, particles = [], dragVector;
let floor, leftWall, rightWall, backWall, ceiling;

// Varsayılan ayarlardan değişiklik olup olmadığını kontrol eder
const isDefaultSettingsChanged = computed(() => {
  return shape.value !== DEFAULT_SETTINGS.shape ||
    windSpeed.value !== DEFAULT_SETTINGS.windSpeed ||
    objectMass.value !== DEFAULT_SETTINGS.objectMass ||
    particleCount.value !== DEFAULT_SETTINGS.particleCount ||
    backgroundColor.value !== DEFAULT_SETTINGS.backgroundColor;
});

// Uygulamayı başlat
onMounted(() => {
  initThree();
  animate();
  window.addEventListener('resize', onWindowResize);
});

// Uygulamayı temizle
onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  if (renderer) {
    renderer.dispose();
  }
});

// Three.js ortamını başlat
function initThree() {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor.value);
  
  // Su ortamı için hafif sis efekti ekle
  scene.fog = new THREE.FogExp2(backgroundColor.value, 0.02);
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 15);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);
  
  // Kontroller ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar ekle - su ortamı için daha yumuşak ışık
  const ambientLight = new THREE.AmbientLight(0x88aaff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  
  // Duvarlar, tavan ve taban ekle
  createEnvironment();
  
  // Cismi oluştur
  createObject();
  
  // Su akıntısı vektörünü oluştur
  createDragVector();
  
  // Su parçacıklarını oluştur
  createParticles();
}

// Oda duvarlarını, tavanı ve tabanı oluştur
function createEnvironment() {
  const roomSize = 30;
  const wallMaterial = new THREE.MeshBasicMaterial({ 
    color: backgroundColor.value, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  
  // Taban
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5;
  scene.add(floor);
  
  // Tavan
  ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  scene.add(ceiling);
  
  // Arka duvar
  backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  backWall.position.z = -10;
  scene.add(backWall);
  
  // Sol duvar
  leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -roomSize/2;
  scene.add(leftWall);
  
  // Sağ duvar
  rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = roomSize/2;
  scene.add(rightWall);
}

// Cismi oluştur
function createObject() {
  // Eğer varsa mevcut cismi kaldır
  if (object) {
    scene.remove(object);
  }
  
  let geometry;
  
  // Şekle göre geometri oluştur
  switch(shape.value) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(2, 32, 32);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(2, 4, 32);
      break;
    case 'box':
      geometry = new THREE.BoxGeometry(4, 4, 4);
      break;
    case 'pyramid':
      geometry = new THREE.ConeGeometry(2, 4, 4);
      break;
    default:
      geometry = new THREE.SphereGeometry(2, 32, 32);
  }
  
  // Su ortamı için daha parlak ve yansıtıcı malzeme
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x4299e1,
    flatShading: true,
    metalness: 0.3,
    roughness: 0.5
  });
  
  object = new THREE.Mesh(geometry, material);
  
  // Tüm cisimleri akıntıya karşı yönlendirme
  // Akıntı soldan sağa (pozitif x yönünde) olduğu için
  // cisimlerin sivri uçlarını sol tarafa (negatif x yönüne, yani akıntıya doğru) bakacak şekilde ayarla
  switch(shape.value) {
    case 'sphere':
      // Küre için ek bir rotasyona gerek yok
      break;
    case 'cone':
      // Konik için ucunu sol tarafa (akıntıya doğru) yönlendir
      object.rotation.z = Math.PI / 2; // 90 derece, ucu sola bakacak şekilde
      break;
    case 'box':
      // Kutu için daha ince yüzeyini sol tarafa yönlendir
      object.rotation.y = Math.PI / 2;
      break;
    case 'pyramid':
      // Piramit için ucunu sol tarafa (akıntıya doğru) yönlendir
      object.rotation.z = Math.PI / 2;
      break;
  }
  
  // Tüm cisimleri merkeze yerleştir
  object.position.set(0, 0, 0);
  
  scene.add(object);
}

// Su akıntısı vektörünü oluştur
function createDragVector() {
  // Mevcut vektörü kaldır
  if (dragVector) {
    scene.remove(dragVector);
  }
  
  // Yön gösterici ok oluştur
  const dir = new THREE.Vector3(1, 0, 0); // Sağa doğru (pozitif x yönünde)
  dir.normalize();
  
  // Ok başlangıç pozisyonunu cismin soluna yerleştir
  const startPosition = object.position.clone().add(new THREE.Vector3(-5, 0, 0));
  
  const length = 5 * (windSpeed.value / 10);
  const arrowHelper = new THREE.ArrowHelper(
    dir, 
    startPosition,
    length,
    0x88ccff, // Mavi ok rengi
    length * 0.2,
    length * 0.1
  );
  
  dragVector = arrowHelper;
  scene.add(dragVector);
}

// Su parçacıklarını oluştur
function createParticles() {
  // Mevcut partikülleri temizle
  particles.forEach(p => scene.remove(p));
  particles = [];
  
  // Yeni partiküller oluştur - su damlacıkları için daha küçük ve mavi
  const particleGeometry = new THREE.SphereGeometry(0.08, 6, 6);
  const particleMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xaaddff,
    transparent: true,
    opacity: 0.7
  });
  
  // Akıntının geldiği alanı belirle (sol taraftan sağa doğru)
  const startX = -15;
  const rangeY = 10;
  const rangeZ = 10;
  
  // Partikül sayısı kadar partikül oluştur
  for (let i = 0; i < particleCount.value; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Rastgele pozisyon ata
    particle.position.x = startX;
    particle.position.y = (Math.random() * rangeY) - rangeY/2;
    particle.position.z = (Math.random() * rangeZ) - rangeZ/2;
    
    // Her partikül için farklı hız ata - suda daha yavaş
    particle.userData.velocity = new THREE.Vector3(
      Math.random() * windSpeed.value * 0.15,
      0,
      0
    );
    
    // Sahnede pozisyonunu rastgele belirle (animasyon daha doğal görünsün)
    particle.position.x += Math.random() * 30;
    
    scene.add(particle);
    particles.push(particle);
  }
}

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  if (isAnimating.value) {
    // Partikülleri hareket ettir
    particles.forEach(particle => {
      // Partikül nesneye yakınsa hareketini değiştir
      const distance = particle.position.distanceTo(object.position);
      
      // Normal hız ile hareket et - suda daha yavaş
      particle.position.x += particle.userData.velocity.x * windSpeed.value * 0.08;
      
      // Eğer nesnenin etrafındaysa, şekle bağlı olarak hareket et
      if (distance < 5) {
        // Nesnenin şekline göre partiküllerin hareketini ayarla
        switch(shape.value) {
          case 'sphere':
            // Küre için partikül daha düzgün şekilde sapma yapar
            particle.userData.velocity.y += (Math.random() - 0.5) * 0.08;
            particle.userData.velocity.z += (Math.random() - 0.5) * 0.08;
            break;
            
          case 'cone':
            // Konik için partiküller daha az sapar
            if (particle.position.x > object.position.x) {
              const deflectionFactor = 0.04;
              particle.userData.velocity.y += (Math.random() - 0.5) * deflectionFactor;
              particle.userData.velocity.z += (Math.random() - 0.5) * deflectionFactor;
            }
            break;
            
          case 'box':
            // Düz kutu için turbülans daha fazla
            particle.userData.velocity.y += (Math.random() - 0.5) * 0.15;
            particle.userData.velocity.z += (Math.random() - 0.5) * 0.15;
            break;
            
          case 'pyramid':
            // Piramit için daha az sapma
            if (particle.position.x > object.position.x) {
              const deflectionFactor = 0.06;
              particle.userData.velocity.y += (Math.random() - 0.5) * deflectionFactor;
              particle.userData.velocity.z += (Math.random() - 0.5) * deflectionFactor;
            }
            break;
        }
      }
      
      // Y ve Z pozisyonlarını güncelle - suda daha fazla yavaşlama
      particle.position.y += particle.userData.velocity.y * 0.8;
      particle.position.z += particle.userData.velocity.z * 0.8;
      
      // Su direnci nedeniyle hızı azalt
      particle.userData.velocity.y *= 0.98;
      particle.userData.velocity.z *= 0.98;
      
      // Eğer sınırların dışına çıkarsa, soldan tekrar başlat
      if (
        particle.position.x > 15 ||
        particle.position.y > 5 || particle.position.y < -5 ||
        particle.position.z > 10 || particle.position.z < -10
      ) {
        particle.position.set(
          -15,
          (Math.random() * 10) - 5,
          (Math.random() * 10) - 5
        );
        particle.userData.velocity = new THREE.Vector3(
          Math.random() * windSpeed.value * 0.15,
          0,
          0
        );
      }
    });
    
    // Direnç vektörünü güncelle - su direnci için daha etkin
    if (dragVector) {
      const vectorLength = 5 * (windSpeed.value / 10) / (objectMass.value / 4);
      dragVector.setLength(vectorLength, vectorLength * 0.2, vectorLength * 0.1);
    }
  }
  
  renderer.render(scene, camera);
}

// Pencere boyutu değiştiğinde
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Cisim şeklini değiştir
function changeShape(newShape) {
  shape.value = newShape;
  createObject();
  createDragVector();
}

// Kamera görünümünü ayarla
function setCameraView(view) {
  switch(view) {
    case 'front':
      camera.position.set(0, 0, 15);
      break;
    case 'side':
      camera.position.set(15, 0, 0);
      break;
    case 'top':
      camera.position.set(0, 15, 0);
      break;
    case 'isometric':
      camera.position.set(10, 10, 10);
      break;
  }
  
  camera.lookAt(0, 0, 0);
  controls.update();
}

// Kamera görünümünü sıfırla
function resetCameraView() {
  camera.position.set(0, 5, 15);
  camera.lookAt(0, 0, 0);
  controls.update();
}

// Animasyonu başlat
function startAnimation() {
  isAnimating.value = true;
}

// Animasyonu durdur
function stopAnimation() {
  isAnimating.value = false;
}

// Ayarları sıfırla
function resetSettings() {
  shape.value = DEFAULT_SETTINGS.shape;
  windSpeed.value = DEFAULT_SETTINGS.windSpeed;
  objectMass.value = DEFAULT_SETTINGS.objectMass;
  particleCount.value = DEFAULT_SETTINGS.particleCount;
  backgroundColor.value = DEFAULT_SETTINGS.backgroundColor;
  stopAnimation();
}

// Reaktif değişiklikler
watch(backgroundColor, (newValue) => {
  if (scene) {
    scene.background = new THREE.Color(newValue);
    if (scene.fog) {
      scene.fog = new THREE.FogExp2(newValue, 0.02);
    }
    
    // Duvarları güncelle
    const wallMaterial = new THREE.MeshBasicMaterial({ 
      color: newValue, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    floor.material = wallMaterial;
    ceiling.material = wallMaterial;
    backWall.material = wallMaterial;
    leftWall.material = wallMaterial;
    rightWall.material = wallMaterial;
  }
});

watch(windSpeed, () => {
  if (dragVector) {
    createDragVector();
  }
});

watch(particleCount, () => {
  createParticles();
});
</script>
  
 
 