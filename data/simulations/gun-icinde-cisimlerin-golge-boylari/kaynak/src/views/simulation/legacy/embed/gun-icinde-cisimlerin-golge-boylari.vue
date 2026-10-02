<template>
  <div class="w-full h-screen relative overflow-hidden">
    <!-- Simulation Canvas -->
    <div ref="container" class="w-full h-full" :style="{ background: backgroundColor }"></div>
    
    <!-- Animation Controls -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <button 
        v-if="!isPlaying" 
        @click="startAnimation" 
        class="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none"
      >
        Başlat
      </button>
      <button 
        v-else 
        @click="stopAnimation" 
        class="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 focus:outline-none"
      >
        Durdur
      </button>
    </div>
    
    <!-- Information Display -->
    <div class="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded z-10" v-if="isPlaying">
      <p>Zaman: {{ timeOfDay }}</p>
      <p>Gölge Uzunluğu: {{ shadowLength.toFixed(2) }} m</p>
    </div>
    
    <!-- Settings Toggle Button (Mobile) -->
    <button 
      @click="showSettings = !showSettings" 
      class="absolute top-4 right-4 p-2 bg-gray-800 text-white rounded-md md:hidden z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Settings Panel (Desktop) -->
    <div 
      v-if="showSettings || isDesktop" 
      class="absolute top-0 right-0 bottom-0 md:w-80 w-full bg-gray-800 text-white p-4 overflow-y-auto z-20 md:z-10"
      :class="{ 'hidden md:block': !showSettings }"
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Ayarlar</h2>
        <button @click="showSettings = false" class="md:hidden p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Animation Speed -->
      <div class="mb-4">
        <label class="block mb-2">Animasyon Hızı</label>
        <input 
          type="range" 
          min="0.1" 
          max="5" 
          step="0.1" 
          v-model="animationSpeed" 
          class="w-full"
        />
        <div class="flex justify-between text-xs">
          <span>Yavaş</span>
          <span>{{ animationSpeed.toFixed(1) }}x</span>
          <span>Hızlı</span>
        </div>
      </div>

      

      
      <!-- Reset Button -->
      <button 
        @click="resetSimulation" 
        class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 focus:outline-none mt-4"
      >
        Sıfırla
      </button>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar ve durum değişkenleri
const container = ref(null);
const isPlaying = ref(false);
const animationSpeed = ref(1.0);
const showSettings = ref(false);
const backgroundColor = ref('#1e3a8a'); // Mavi arkaplan
const sunAngle = ref(0); // 0: gün doğumu, Math.PI: gün batımı
const shadowLength = ref(0);
const isDesktop = ref(false);

// Üç boyutlu sahne için değişkenler
let scene, camera, renderer, controls;
let sun, sunLight, ground, tree, skybox;
let animationFrameId;

// Arkaplan renk seçenekleri
const backgroundColors = [
  { name: 'Koyu Gri', value: '#111827' },
  { name: 'Siyah', value: '#000000' },
  { name: 'Koyu Mavi', value: '#1e3a8a' },
  { name: 'Koyu Yeşil', value: '#064e3b' },
  { name: 'Koyu Kırmızı', value: '#7f1d1d' },
  { name: 'Koyu Mor', value: '#4c1d95' },
  { name: 'Açık Gri', value: '#f3f4f6' },
  { name: 'Açık Mavi', value: '#dbeafe' },
];

// Zaman bilgisi (gün doğumu, öğle, gün batımı)
const timeOfDay = computed(() => {
  const angle = sunAngle.value;
  if (angle < Math.PI / 6) return "Gün Doğumu";
  if (angle < Math.PI / 3) return "Sabah";
  if (angle < Math.PI / 2) return "Öğleden Önce";
  if (angle < 2 * Math.PI / 3) return "Öğle";
  if (angle < 5 * Math.PI / 6) return "Öğleden Sonra";
  if (angle < Math.PI) return "Akşam";
  return "Gün Batımı";
});

// Ekran genişliğini kontrol et
function checkScreenSize() {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 768;
  }
}

// Üç boyutlu sahneyi başlat
onMounted(() => {
  // Ekran genişliğini kontrol et
  checkScreenSize();
  
  // Başlangıç açısını gün batımı olarak ayarla
  sunAngle.value = Math.PI;
  
  initScene();
  animate();
  
  // Ekran boyutunu dinle
  window.addEventListener('resize', onWindowResize);
});

// Temizlik işlemleri
onUnmounted(() => {
  stopAnimation();
  window.removeEventListener('resize', onWindowResize);
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});

// Arkaplan rengi değişince render'ı güncelle
watch(backgroundColor, () => {
  if (scene) {
    scene.background = new THREE.Color(backgroundColor.value);
    renderer.render(scene, camera);
  }
});

// Üç boyutlu sahneyi hazırla
function initScene() {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor.value);
  
  camera = new THREE.PerspectiveCamera(
    75, 
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(10, 5, 10);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value.appendChild(renderer.domElement);
  
  // Kamera kontrollerini ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // Yerden geçmeyi engelle
  
  // Zemin oluştur
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2f4f2f, // Ormanlık zemin rengi
    roughness: 0.8,
    metalness: 0.2
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Ağaç oluştur (basit silindir ve küre)
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 12);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Kahverengi gövde
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  
  const leavesGeometry = new THREE.SphereGeometry(1, 16, 16);
  const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 }); // Yeşil yapraklar
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = 2.5;
  leaves.castShadow = true;
  
  tree = new THREE.Group();
  tree.add(trunk);
  tree.add(leaves);
  scene.add(tree);
  
  // Güneşi oluştur
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);
  
  // Güneş ışığını oluştur
  sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -10;
  sunLight.shadow.camera.right = 10;
  sunLight.shadow.camera.top = 10;
  sunLight.shadow.camera.bottom = -10;
  scene.add(sunLight);
  
  // Ortam ışığı ekle (hafif ışık)
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  // Ormanlık arkaplan oluştur (basit ağaçlar)
  createForest();
  
  // Skybox (gökyüzü) ekleme

  
  // Güneşin konumunu güncelle ve gölgeleri oluştur
  updateSunPosition();
}

// Orman oluşturma (birçok ağaç ekler)
function createForest() {
  // Ağaç sayısı
  const treeCount = 10;
  
  for (let i = 0; i < treeCount; i++) {
    // Rastgele konum (merkezdeki ağacın etrafında)
    const radius = 10 + Math.random() * 15;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Rastgele boyut
    const scale = 0.5 + Math.random() * 0.7;
    
    // Ağaç gövdesi
    const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(0x8B4513).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2)
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, scale, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Ağaç yaprakları
    const leavesGeometry = new THREE.SphereGeometry(1 * scale, 8, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(0x2E8B57).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2)
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 2.5 * scale, z);
    leaves.castShadow = true;
    
    scene.add(trunk);
    scene.add(leaves);
  }
}

// Güneşin konumunu güncelle
function updateSunPosition() {
  // Güneşin rotasını hesapla (yarım çember)
  const radius = 35;
  
  // x = r * cos(θ), y = r * sin(θ)
  // sunAngle 0 ila π arasında değişir (gün doğumu -> gün batımı)
  
  // Güneş saat yönünün tersine hareket eder
  // Saatin tersine: 0 -> Doğu, π/2 -> Kuzey, π -> Batı
  const sunX = radius * Math.cos(Math.PI / 2 - sunAngle.value);
  
  // Güneş yüksekliği, öğlen en yüksekte (π/2'de)
  const maxHeight = 30; // 15'ten 30'a artırıldı - daha dik hareket için
  // Daha keskin bir yükseklik eğrisi için modifiye edilmiş sin fonksiyonu
  const sunY = Math.pow(Math.sin(sunAngle.value), 0.7) * maxHeight;
  
  // Güneş kuzey-güney ekseninde hareket eder
  const sunZ = radius * Math.sin(Math.PI / 2 - sunAngle.value);
  
  // Güneşin konumunu güncelle
  sun.position.set(sunX, sunY, sunZ);
  sunLight.position.copy(sun.position);
  
  // Işık yönünü güneşten ağaca doğru ayarla
  sunLight.target = tree;
  
  // Gölge uzunluğunu hesapla (güneş alçak olduğunda uzun gölge)
  // Math.cos güneş açısının yerden yüksekliği ile ters orantılı
  const baseHeight = 2; // Ağaç merkez yüksekliği
  shadowLength.value = baseHeight / Math.sin(Math.max(0.1, sunAngle.value)); // Sıfıra bölünmeyi önle
  
  // Güneş rengi ve yoğunluğunu günün saatine göre ayarla
  if (sunAngle.value < 0.2 || sunAngle.value > 0.8 * Math.PI) {
    // Gün doğumu/batımı: turuncu/kırmızı ton
    sunLight.color.setHSL(0.07, 1, 0.5);
    sunLight.intensity = 0.7;
  } else {
    // Gün ortası: beyaz/sarı ton
    sunLight.color.setHSL(0.125, 0.5, 0.6);
    sunLight.intensity = 1;
  }
}

// Animasyon döngüsü
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  // Eğer animasyon çalışıyorsa güneşin açısını güncelle
  if (isPlaying.value) {
    // animationSpeed değerine göre güneş hızını ayarla (ters yön)
    sunAngle.value -= 0.005 * animationSpeed.value;
    
    // Güneş tam tur atınca sıfırla (gün batımında başla)
    if (sunAngle.value <= 0) {
      stopAnimation();
      sunAngle.value = Math.PI;
    }
    
    updateSunPosition();
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// Pencere boyutu değiştiğinde ayarla
function onWindowResize() {
  if (camera && renderer && container.value) {
    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  }
  
  // Ekran genişliğini yeniden kontrol et
  checkScreenSize();
}

// Animasyonu başlat
function startAnimation() {
  isPlaying.value = true;
}

// Animasyonu durdur
function stopAnimation() {
  isPlaying.value = false;
}

// Simülasyonu sıfırla
function resetSimulation() {
  stopAnimation();
  sunAngle.value = Math.PI; // Gün batımından başla
  animationSpeed.value = 1.0;
  updateSunPosition();
  resetCameraView();
}

// Kamera görünümünü ayarla
function setCameraView(viewType) {
  switch (viewType) {
    case 'top':
      camera.position.set(0, 20, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'side':
      camera.position.set(20, 5, 0);
      camera.lookAt(0, 2, 0);
      break;
    case 'front':
      camera.position.set(0, 5, 20);
      camera.lookAt(0, 2, 0);
      break;
    case 'isometric':
      camera.position.set(15, 15, 15);
      camera.lookAt(0, 0, 0);
      break;
  }
  
  controls.update();
}

// Kamera görünümünü sıfırla
function resetCameraView() {
  camera.position.set(10, 5, 10);
  camera.lookAt(0, 0, 0);
  controls.update();
}
</script>
  
 
 