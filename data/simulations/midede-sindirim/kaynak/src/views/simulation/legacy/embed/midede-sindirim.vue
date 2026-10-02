<template>
  <div class="relative w-full h-screen overflow-hidden bg-gray-100">
    <!-- Simülasyon Container -->
    <div ref="container" class="w-full h-full"></div>

    <!-- Ayarlar Butonu (Mobil) -->
    <button 
      @click="toggleSettings" 
      class="md:hidden absolute top-4 right-4 bg-indigo-700 text-white p-2 rounded-full shadow-lg z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Animasyon Kontrol Butonları -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
      <button 
        v-if="!isAnimating" 
        @click="startAnimation" 
        class="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
      >
        Başlat
      </button>
      <button 
        v-else 
        @click="stopAnimation" 
        class="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
      >
        Durdur
      </button>
    </div>

    <!-- Ayarlar Paneli (Masaüstü) -->
    <div 
      :class="['md:absolute md:right-0 md:top-0 h-screen overflow-y-auto md:w-1/4 min-w-[300px] bg-indigo-900 text-white p-4 shadow-xl transition-all duration-300 z-20',
      {'hidden md:block': !showSettings && !isMobile},
      {'fixed inset-0 w-full h-screen': showSettings && isMobile},
      {'hidden': !showSettings && isMobile}]"
    >
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Ayarlar</h2>
        <button 
          @click="toggleSettings" 
          class="md:hidden text-white p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4 overflow-y-auto h-screen pb-20">
        <!-- Animasyon Hızı -->
        <div>
          <label class="block mb-2">Animasyon Hızı</label>
          <div class="flex items-center gap-2">
            <span>Yavaş</span>
            <input 
              type="range" 
              v-model="animationSpeed" 
              min="0.1" 
              max="2" 
              step="0.1" 
              class="w-full"
            >
            <span>Hızlı</span>
          </div>
          <div class="text-center mt-1">{{ animationSpeed.toFixed(1) }}x</div>
        </div>

        <!-- Mide Asidi Seviyesi -->
        <div>
          <label class="block mb-2">Mide Asidi Seviyesi</label>
          <div class="flex items-center gap-2">
            <span>Az</span>
            <input 
              type="range" 
              v-model="acidLevel" 
              min="0" 
              max="1" 
              step="0.1" 
              class="w-full"
            >
            <span>Çok</span>
          </div>
          <div class="text-center mt-1">{{ Math.round(acidLevel * 100) }}%</div>
        </div>

        <!-- Mide Kasılma Hızı -->
        <div>
          <label class="block mb-2">Mide Kasılma Hızı</label>
          <div class="flex items-center gap-2">
            <span>Yavaş</span>
            <input 
              type="range" 
              v-model="contractionSpeed" 
              min="0.1" 
              max="2" 
              step="0.1" 
              class="w-full"
            >
            <span>Hızlı</span>
          </div>
          <div class="text-center mt-1">{{ contractionSpeed.toFixed(1) }}x</div>
        </div>

        <!-- Yiyecek Türleri -->
        <div>
          <label class="block mb-2">Yiyecek Türü</label>
          <select v-model="selectedFood" class="w-full p-2 rounded bg-indigo-800 border border-indigo-600">
            <option value="mixed">Karışık</option>
            <option value="meat">Et</option>
            <option value="vegetables">Sebze</option>
            <option value="carbs">Karbonhidrat</option>
          </select>
        </div>

        <!-- Kamera Açıları -->
        <div>
          <label class="block mb-2">Kamera Açısı</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="setCameraPosition('front')" 
              class="bg-indigo-700 hover:bg-indigo-600 py-2 rounded"
            >
              Önden Görünüm
            </button>
            <button 
              @click="setCameraPosition('side')" 
              class="bg-indigo-700 hover:bg-indigo-600 py-2 rounded"
            >
              Yandan Görünüm
            </button>
            <button 
              @click="setCameraPosition('top')" 
              class="bg-indigo-700 hover:bg-indigo-600 py-2 rounded"
            >
              Üstten Görünüm
            </button>
            <button 
              @click="setCameraPosition('isometric')" 
              class="bg-indigo-700 hover:bg-indigo-600 py-2 rounded"
            >
              İzometrik Görünüm
            </button>
            <button 
              @click="resetCamera" 
              class="bg-indigo-700 hover:bg-indigo-600 py-2 rounded col-span-2"
            >
              Görünümü Sıfırla
            </button>
          </div>
        </div>

        <!-- Arkaplan Rengi -->
        <div>
          <label class="block mb-2">Arkaplan Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              @click="setBackgroundColor('#f3f4f6')" 
              class="h-8 w-full bg-gray-100 rounded"
            ></button>
            <button 
              @click="setBackgroundColor('#1f2937')" 
              class="h-8 w-full bg-gray-800 rounded"
            ></button>
            <button 
              @click="setBackgroundColor('#1e3a8a')" 
              class="h-8 w-full bg-blue-900 rounded"
            ></button>
            <button 
              @click="setBackgroundColor('#064e3b')" 
              class="h-8 w-full bg-green-900 rounded"
            ></button>
          </div>
        </div>

        <!-- Sıfırlama Butonu -->
        <button 
          v-if="hasChanges" 
          @click="resetSettings" 
          class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded my-4"
        >
          Ayarları Sıfırla
        </button>
      </div>
    </div>

    <!-- Bilgi Paneli -->
    <div v-if="currentStep" class="absolute bottom-24 left-4 right-4 md:left-4 md:right-[calc(25%+1rem)] bg-black bg-opacity-75 text-white p-4 rounded-lg">
      <h3 class="text-lg font-bold mb-2">{{ stepInfo[currentStep].title }}</h3>
      <p>{{ stepInfo[currentStep].description }}</p>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Reactive State
const container = ref(null);
const showSettings = ref(false);
const isMobile = ref(false);
const hasChanges = ref(false);
const isAnimating = ref(false);
const currentStep = ref(null);

// Simülasyon Ayarları
const animationSpeed = ref(1.0);
const acidLevel = ref(0.5);
const contractionSpeed = ref(1.0);
const selectedFood = ref('mixed');
const defaultSettings = {
  animationSpeed: 1.0,
  acidLevel: 0.5,
  contractionSpeed: 1.0,
  selectedFood: 'mixed'
};

// Three.js Variables
let scene, camera, renderer, controls;
let stomach, stomachWalls, acid, food = [], enzymes = [];
let clock, mixer, animations = [];
let animationFrameId;

// Mide Kasılma Animasyonu için
let contractionPhase = 0;
let lastContractionUpdate = 0;

// Adım Bilgileri
const stepInfo = {
  intro: {
    title: "Mide Sindirim Süreci",
    description: "Mide, yiyecekleri sindirmenin ilk aşamalarından birini gerçekleştirir. Bu simülasyonda fiziksel sindirim sürecini gözlemleyebilirsiniz."
  },
  contraction: {
    title: "Mide Kasılmaları (Peristaltik Hareketler)",
    description: "Mide duvarları kasılarak yiyecekleri fiziksel olarak parçalar ve mide içeriğini karıştırır."
  },
  acid: {
    title: "Mide Asidi Salgılanması",
    description: "Mide hücreleri asit salgılayarak yiyeceklerin kimyasal olarak parçalanmasına yardımcı olur."
  },
  enzyme: {
    title: "Enzim Aktivitesi",
    description: "Mide enzimleri proteinleri daha küçük parçalara ayırır."
  },
  breakdown: {
    title: "Yiyecek Parçalanması",
    description: "Mide kasılmaları ve asitler birlikte çalışarak yiyecekleri daha küçük parçalara böler."
  },
  complete: {
    title: "Tamamlanmış Mide Sindirimi",
    description: "Yiyecekler artık büyük ölçüde sindirilmiş ve ince bağırsağa geçmeye hazır hale gelmiştir."
  }
};

// Yöntemler
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const setBackgroundColor = (color) => {
  if (scene) {
    scene.background = new THREE.Color(color);
    hasChanges.value = true;
  }
};

const setCameraPosition = (position) => {
  if (!camera || !controls) return;
  
  switch (position) {
    case 'front':
      camera.position.set(0, 0, 10);
      break;
    case 'side':
      camera.position.set(10, 0, 0);
      break;
    case 'top':
      camera.position.set(0, 10, 0);
      break;
    case 'isometric':
      camera.position.set(6, 6, 6);
      break;
  }
  
  controls.target.set(0, 0, 0);
  controls.update();
  hasChanges.value = true;
};

const resetCamera = () => {
  if (!camera || !controls) return;
  camera.position.set(5, 5, 5);
  controls.target.set(0, 0, 0);
  controls.update();
};

const checkChanges = () => {
  hasChanges.value = 
    animationSpeed.value !== defaultSettings.animationSpeed ||
    acidLevel.value !== defaultSettings.acidLevel ||
    contractionSpeed.value !== defaultSettings.contractionSpeed ||
    selectedFood.value !== defaultSettings.selectedFood;
};

const resetSettings = () => {
  animationSpeed.value = defaultSettings.animationSpeed;
  acidLevel.value = defaultSettings.acidLevel;
  contractionSpeed.value = defaultSettings.contractionSpeed;
  selectedFood.value = defaultSettings.selectedFood;
  resetCamera();
  stopAnimation();
  hasChanges.value = false;
};

const startAnimation = () => {
  isAnimating.value = true;
  animate();
  currentStep.value = 'intro';
  
  // Adımlar arasında geçiş için zamanlayıcılar
  setTimeout(() => { currentStep.value = 'contraction'; }, 5000);
  setTimeout(() => { currentStep.value = 'acid'; }, 10000);
  setTimeout(() => { currentStep.value = 'enzyme'; }, 15000);
  setTimeout(() => { currentStep.value = 'breakdown'; }, 20000);
  setTimeout(() => { currentStep.value = 'complete'; }, 25000);
};

const stopAnimation = () => {
  isAnimating.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  currentStep.value = null;
};

// Three.js setup
const initThree = () => {
  // Scene oluşturma
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f4f6);

  // Camera oluşturma
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);
  
  // Renderer oluşturma
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);
  
  // Kontroller oluşturma
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  // Işıklar oluşturma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);
  
  // Zaman ölçümü için clock
  clock = new THREE.Clock();
  
  createStomach();
  createAcid();
  createFood();
  createEnzymes();
  
  // İlk render
  renderer.render(scene, camera);
};

// Mide modelini oluşturma
const createStomach = () => {
  // Mide dış duvarı
  const stomachGeometry = new THREE.SphereGeometry(4, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.75);
  stomachGeometry.scale(1, 1.5, 0.8);
  
  const stomachMaterial = new THREE.MeshPhongMaterial({
    color: 0xf48fb1,  // Pembe-kırmızı tonu
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  
  stomach = new THREE.Mesh(stomachGeometry, stomachMaterial);
  stomach.rotation.x = Math.PI;  // Mideyi ters çevirme
  scene.add(stomach);
  
  // Mide iç duvarı
  const innerGeometry = new THREE.SphereGeometry(3.8, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.75);
  innerGeometry.scale(1, 1.5, 0.8);
  
  const innerMaterial = new THREE.MeshPhongMaterial({
    color: 0xe57373,
    side: THREE.BackSide
  });
  
  stomachWalls = new THREE.Mesh(innerGeometry, innerMaterial);
  stomachWalls.rotation.x = Math.PI;
  scene.add(stomachWalls);
  
  // Mide olukları (rugae)
  const rugaeGeometry = new THREE.TorusGeometry(3.8, 0.2, 8, 32, Math.PI);
  const rugaeMaterial = new THREE.MeshPhongMaterial({ color: 0xd32f2f });
  
  for (let i = 0; i < 5; i++) {
    const rugae = new THREE.Mesh(rugaeGeometry, rugaeMaterial);
    rugae.rotation.x = Math.PI / 2;
    rugae.position.y = -2 + i * 0.8;
    rugae.scale.set(1, 1, 0.8);
    scene.add(rugae);
  }
  
  // Mide giriş ve çıkışı
  const tubeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
  const tubeMaterial = new THREE.MeshPhongMaterial({ color: 0xd32f2f });
  
  // Yemek borusu (giriş)
  const esophagus = new THREE.Mesh(tubeGeometry, tubeMaterial);
  esophagus.position.set(0, 3, 0);
  scene.add(esophagus);
  
  // Duodenum (çıkış)
  const duodenum = new THREE.Mesh(tubeGeometry, tubeMaterial);
  duodenum.position.set(-3, -2, 0);
  duodenum.rotation.z = Math.PI / 4;
  scene.add(duodenum);
};

// Mide asidini oluşturma
const createAcid = () => {
  // Asit için yarı-saydam jel benzeri materyal
  const acidGeometry = new THREE.SphereGeometry(3.5, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7);
  acidGeometry.scale(0.9, 1.4, 0.7);
  
  const acidMaterial = new THREE.MeshPhongMaterial({
    color: 0xadff2f,  // Limon yeşili
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  
  acid = new THREE.Mesh(acidGeometry, acidMaterial);
  acid.rotation.x = Math.PI;
  acid.position.y = -0.5;
  scene.add(acid);
};

// Yiyecekleri oluşturma
const createFood = () => {
  // Yiyecek parçalarını temizleme
  food.forEach(item => scene.remove(item));
  food = [];
  
  // Yiyecek türüne göre oluşturma
  const foodColors = {
    mixed: [0xf44336, 0x9c27b0, 0x2196f3, 0xffc107],
    meat: [0xc62828, 0xb71c1c, 0xd84315],
    vegetables: [0x388e3c, 0x1b5e20, 0x689f38],
    carbs: [0xffb74d, 0xffa726, 0xe65100]
  };
  
  const colors = foodColors[selectedFood.value];
  
  // Küçük yiyecek parçaları
  for (let i = 0; i < 30; i++) {
    let geometry;
    
    // Yiyecek türüne göre farklı geometriler
    if (selectedFood.value === 'meat') {
      geometry = new THREE.BoxGeometry(0.4, 0.2, 0.3);
    } else if (selectedFood.value === 'vegetables') {
      geometry = new THREE.SphereGeometry(0.25, 8, 8);
    } else if (selectedFood.value === 'carbs') {
      geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16);
    } else {
      // Karışık yiyecekler için rastgele geometriler
      const geometries = [
        new THREE.BoxGeometry(0.4, 0.2, 0.3),
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16)
      ];
      geometry = geometries[Math.floor(Math.random() * geometries.length)];
    }
    
    const colorIndex = Math.floor(Math.random() * colors.length);
    const material = new THREE.MeshLambertMaterial({ color: colors[colorIndex] });
    
    const foodPiece = new THREE.Mesh(geometry, material);
    
    // Mide içinde rastgele konumlandırma
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.5;
    const r = 2 + Math.random() * 1;
    
    foodPiece.position.x = r * Math.sin(phi) * Math.cos(theta);
    foodPiece.position.y = -1 + Math.random() * 2;
    foodPiece.position.z = r * Math.sin(phi) * Math.sin(theta);
    
    foodPiece.rotation.x = Math.random() * Math.PI;
    foodPiece.rotation.y = Math.random() * Math.PI;
    foodPiece.rotation.z = Math.random() * Math.PI;
    
    scene.add(foodPiece);
    food.push(foodPiece);
  }
};

// Enzimleri oluşturma
const createEnzymes = () => {
  // Enzimleri temizleme
  enzymes.forEach(enzyme => scene.remove(enzyme));
  enzymes = [];
  
  // Enzim parçacıkları oluşturma
  const enzymeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const enzymeMaterial = new THREE.MeshLambertMaterial({
    color: 0x00bcd4,
    transparent: true,
    opacity: 0.7
  });
  
  for (let i = 0; i < 50; i++) {
    const enzyme = new THREE.Mesh(enzymeGeometry, enzymeMaterial);
    
    // Mide içinde rastgele konumlandırma
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.5;
    const r = 1.5 + Math.random() * 2;
    
    enzyme.position.x = r * Math.sin(phi) * Math.cos(theta);
    enzyme.position.y = -1 + Math.random() * 2;
    enzyme.position.z = r * Math.sin(phi) * Math.sin(theta);
    
    enzyme.visible = false; // Başlangıçta gizli
    
    scene.add(enzyme);
    enzymes.push(enzyme);
  }
};

// Animasyon fonksiyonu
const animate = () => {
  if (!isAnimating.value) return;
  
  animationFrameId = requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  
  // Mide kasılma animasyonu
  const contractionTime = elapsedTime * contractionSpeed.value;
  if (contractionTime - lastContractionUpdate > 0.05) {
    contractionPhase += 0.05 * contractionSpeed.value;
    lastContractionUpdate = contractionTime;
    
    // Mide duvarlarını kasma
    if (stomachWalls) {
      const scale = 1 + 0.1 * Math.sin(contractionPhase);
      stomachWalls.scale.set(1, scale, 1);
    }
  }
  
  // Yiyeceklerin hareketi ve parçalanması
  food.forEach((piece, index) => {
    // Merkeze doğru hareket ve dönme
    piece.position.x += (Math.sin(elapsedTime + index) * 0.01 - piece.position.x * 0.01) * animationSpeed.value;
    piece.position.z += (Math.cos(elapsedTime + index) * 0.01 - piece.position.z * 0.01) * animationSpeed.value;
    
    // Mide kasılmasıyla yukarı-aşağı hareket
    piece.position.y += Math.sin(contractionPhase + index * 0.1) * 0.02 * contractionSpeed.value;
    
    // Boyut küçültme (sindirim etkisi)
    if (elapsedTime > 10 && piece.scale.x > 0.5) {
      piece.scale.x -= 0.001 * animationSpeed.value;
      piece.scale.y -= 0.001 * animationSpeed.value;
      piece.scale.z -= 0.001 * animationSpeed.value;
    }
    
    // Rastgele dönme
    piece.rotation.x += 0.01 * animationSpeed.value;
    piece.rotation.y += 0.01 * animationSpeed.value;
  });
  
  // Asit seviyesi ayarı
  if (acid) {
    acid.material.opacity = 0.2 + acidLevel.value * 0.3;
    
    // Asit pulsasyonu
    const pulseScale = 1 + 0.05 * Math.sin(elapsedTime * 2);
    acid.scale.set(acidLevel.value * pulseScale, acidLevel.value * pulseScale, acidLevel.value * pulseScale);
  }
  
  // Enzimlerin görünürlüğünü ve hareketini ayarla (10 saniyeden sonra)
  if (elapsedTime > 10) {
    enzymes.forEach((enzyme, index) => {
      enzyme.visible = true;
      
      // Hedef yiyecek parçasına doğru hareket
      if (food.length > index % food.length) {
        const target = food[index % food.length];
        enzyme.position.x += (target.position.x - enzyme.position.x) * 0.03 * animationSpeed.value;
        enzyme.position.y += (target.position.y - enzyme.position.y) * 0.03 * animationSpeed.value;
        enzyme.position.z += (target.position.z - enzyme.position.z) * 0.03 * animationSpeed.value;
      }
    });
  }
  
  controls.update();
  renderer.render(scene, camera);
};

// Window resize listener
const handleResize = () => {
  checkMobile();
  
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

// Watch değişiklikleri
watch([animationSpeed, acidLevel, contractionSpeed, selectedFood], () => {
  checkChanges();
  
  // Yiyecek türü değiştiğinde yiyecekleri yeniden oluştur
  if (selectedFood.value !== defaultSettings.selectedFood) {
    createFood();
  }
});

// Lifecycle hooks
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', handleResize);
  initThree();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  stopAnimation();
  
  // Three.js kaynaklarını temizleme
  if (renderer) {
    renderer.dispose();
    const canvas = renderer.domElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
});
</script>
  
 
 