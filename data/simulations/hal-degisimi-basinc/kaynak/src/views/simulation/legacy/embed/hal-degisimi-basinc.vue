<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- Simülasyon Bilgileri -->
    <div class="absolute md:top-2 top-16 left-2 bg-black/50 p-2 rounded-md text-white z-10">
      <p>Maddenin Hali: {{ currentState }}</p>
      <p>Sıcaklık: {{ Number(temperature).toFixed(1) }} °C</p>
      <p>Basınç: {{ Number(pressure).toFixed(1) }} atm</p>
      <p>Kaynama Noktası: {{ getStateInfo().kaynamaNoktasi }} °C</p>
      <p>Donma Noktası: {{ getStateInfo().donmaNoktasi }} °C</p>
    </div>
    
    <!-- Animasyon Kontrol Butonları -->
    <div class="absolute top-2 inset-x-0 flex justify-center z-10">
      <button 
        v-if="!isPlaying" 
        @click="startAnimation" 
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Başlat
      </button>
      <button 
        v-else 
        @click="stopAnimation" 
        class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
      >
        Durdur
      </button>
    </div>
    
    <!-- Mobil Ayarlar Butonu -->
    <button
      @click="isMobileSettingsOpen = !isMobileSettingsOpen"
      class="md:hidden absolute top-2 right-2 bg-gray-800 p-2 rounded-md text-white z-20"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Mobil Ayarlar Paneli Modal -->
    <div v-if="isMobileSettingsOpen" class="md:hidden fixed inset-0 bg-black/70 z-30 flex items-center justify-center">
      <div class="bg-gray-800 text-white p-4 rounded-lg w-5/6 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Simülasyon Ayarları</h2>
          <button @click="isMobileSettingsOpen = false" class="text-gray-300 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="settings-content">
          <!-- Ayarlar içeriği (mobil için) -->
          <div class="mb-4">
            <label class="block mb-2">Sıcaklık: {{ Number(temperature).toFixed(1) }} °C</label>
            <input 
              type="range" 
              v-model.number="temperature" 
              min="-50" 
              max="150" 
              step="1"
              class="w-full"
              @input="updateState"
            >
          </div>
          
          <div class="mb-4">
            <label class="block mb-2">Basınç: {{ Number(pressure).toFixed(1) }} atm</label>
            <input 
              type="range" 
              v-model.number="pressure" 
              min="0.1" 
              max="5" 
              step="0.1"
              class="w-full"
              @input="updateState"
            >
          </div>
          
          <div class="mb-4">
            <label class="block mb-2">Animasyon Hızı: {{ Number(animationSpeed).toFixed(1) }}x</label>
            <input 
              type="range" 
              v-model.number="animationSpeed" 
              min="0.1" 
              max="3" 
              step="0.1"
              class="w-full"
            >
          </div>
          

          
          <button 
            @click="resetSettings" 
            class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mt-4"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
    
    <!-- Desktop Ayarlar Paneli -->
    <div class="hidden md:block absolute right-0 top-0 bottom-0 bg-gray-800 text-white w-80 p-4 overflow-y-auto z-10">
      <h2 class="text-xl font-bold mb-4">Simülasyon Ayarları</h2>
      
      <div class="mb-4">
        <label class="block mb-2">Sıcaklık: {{ Number(temperature).toFixed(1) }} °C</label>
        <input 
          type="range" 
          v-model.number="temperature" 
          min="-50" 
          max="150" 
          step="1"
          class="w-full"
          @input="updateState"
        >
      </div>
      
      <div class="mb-4">
        <label class="block mb-2">Basınç: {{ Number(pressure).toFixed(1) }} atm</label>
        <input 
          type="range" 
          v-model.number="pressure" 
          min="0.1" 
          max="5" 
          step="0.1"
          class="w-full"
          @input="updateState"
        >
      </div>
      
      <div class="mb-4">
        <label class="block mb-2">Animasyon Hızı: {{ Number(animationSpeed).toFixed(1) }}x</label>
        <input 
          type="range" 
          v-model.number="animationSpeed" 
          min="0.1" 
          max="3" 
          step="0.1"
          class="w-full"
        >
      </div>
      

      
      <button 
        @click="resetSettings" 
        class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mt-4"
      >
        Ayarları Sıfırla
      </button>
    </div>
    
    <!-- THREE.js Render Alanı -->
    <div ref="container" class="w-full h-full"></div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Temel state değişkenleri
const container = ref(null);
const currentState = ref('Katı');
const temperature = ref(20);
const pressure = ref(1);
const animationSpeed = ref(1);
const isPlaying = ref(false);
const isMobileSettingsOpen = ref(false);
const backgroundColor = ref('#d1fae5');
const isTemperatureAuto = ref(false); // Otomatik sıcaklık değişimi için

// Arkaplan renkleri
const backgroundColors = [
  { name: 'Koyu Gri', value: '#111827' },
  { name: 'Siyah', value: '#000000' },
  { name: 'Koyu Mavi', value: '#1e3a8a' },
  { name: 'Koyu Yeşil', value: '#064e3b' },
  { name: 'Koyu Kırmızı', value: '#7f1d1d' },
  { name: 'Koyu Mor', value: '#4c1d95' },
  { name: 'Açık Gri', value: '#f3f4f6' },
  { name: 'Açık Mavi', value: '#dbeafe' },
  { name: 'Açık Yeşil', value: '#d1fae5' },
  { name: 'Açık Kırmızı', value: '#fee2e2' },
  { name: 'Açık Mor', value: '#ede9fe' },
  { name: 'Bej', value: '#f5f5dc' },
];

// Kamera görünümleri
const cameraViews = [
  { name: 'Önden Görünüm', position: { x: 0, y: 0, z: 10 } },
  { name: 'Yandan Görünüm', position: { x: 10, y: 0, z: 0 } },
  { name: 'Üstten Görünüm', position: { x: 0, y: 10, z: 0 } },
  { name: 'İzometrik', position: { x: 8, y: 8, z: 8 } },
  { name: 'Alt İzometrik', position: { x: 8, y: -8, z: 8 } },
  { name: 'Görünümü Sıfırla', position: { x: 5, y: 3, z: 5 } },
];

// Three.js değişkenleri
let scene, camera, renderer, controls;
let solidObject, liquidObject, container3D;
let animationFrameId = null;
let particles = [];
let clock = new THREE.Clock();

// Simülasyon ayarlarını sıfırlama
const resetSettings = () => {
  temperature.value = 20;
  pressure.value = 1;
  animationSpeed.value = 1;
  backgroundColor.value = '#d1fae5';
  isTemperatureAuto.value = false; // Otomatik sıcaklık değişimini durdur
  stopAnimation();
  updateState();
  
  // Kamerayı sıfırla
  setCameraView({ x: 5, y: 3, z: 5 });
};

// Kamera açısını ayarlama
const setCameraView = (position) => {
  if (!camera) return;
  
  // Kamerayı belirtilen pozisyona gönder
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(0, 0, 0);
  controls.update();
};

// Maddenin halini sıcaklığa göre güncelleme
const updateStateBasedOnTemperature = () => {
  if (temperature.value < 0) {
    currentState.value = 'Katı';
    showState('solid');
  } else if (temperature.value < 100) {
    currentState.value = 'Sıvı';
    showState('liquid');
  } else {
    currentState.value = 'Gaz';
    showState('gas');
  }
};

// Maddenin halini basınca göre güncelleme
const updateStateBasedOnPressure = () => {
  // Basınç azalırsa gaz fazına geçiş daha kolay olur
  if (pressure.value < 0.5 && temperature.value > 80) {
    currentState.value = 'Gaz';
    showState('gas');
  } else {
    updateStateBasedOnTemperature();
  }
};

// Sıcaklık ve basınca bağlı olarak maddenin halini güncelleme
const updateState = () => {
  // Basınca göre ayarlanan kaynama sıcaklığı
  // Normal şartlarda 100°C, basınç arttıkça yükselir, azaldıkça düşer
  const kaynamaNoktasi = 100 + (pressure.value - 1) * 20; // Basınç etkisi: Her 1 atm için ±20°C
  
  // Basınca göre ayarlanan donma sıcaklığı
  // Normal şartlarda 0°C, basınç arttıkça düşer
  const donmaNoktasi = 0 - (pressure.value - 1) * 5; // Basınç etkisi: Her 1 atm için -5°C
  
  // Hal belirleme
  if (temperature.value < donmaNoktasi) {
    // Sıcaklık donma noktasının altındaysa katı hal
    currentState.value = 'Katı';
    showState('solid');
  } else if (temperature.value >= kaynamaNoktasi) {
    // Sıcaklık kaynama noktasının üstündeyse gaz hali
    currentState.value = 'Gaz';
    showState('gas');
  } else {
    // Sıcaklık donma ve kaynama noktası arasındaysa sıvı hal
    // Ancak çok düşük basınçta ve yüksek sıcaklıkta buharlaşma kolaylaşır
    if (pressure.value < 0.5 && temperature.value > kaynamaNoktasi * 0.8) {
      currentState.value = 'Gaz';
      showState('gas');
    } else {
      currentState.value = 'Sıvı';
      showState('liquid');
    }
  }
  
  // Animasyon çalışmasa bile sahneyi güncelle
  if (!isPlaying.value && renderer) {
    renderScene();
  }
};

// Belirli bir hali gösterme
const showState = (state) => {
  if (!solidObject || !liquidObject) return;
  
  solidObject.visible = state === 'solid';
  liquidObject.visible = state === 'liquid';
  
  // Parçacıkları güncelle
  updateParticles(state);
};

// Parçacıkları güncelleme
const updateParticles = (state) => {
  // Mevcut parçacıkları temizle
  particles.forEach(particle => {
    scene.remove(particle);
  });
  particles = [];
  
  if (state === 'gas') {
    // Gaz hali için rastgele parçacıklar oluştur
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x88AAFF });
    
    for (let i = 0; i < 150; i++) { // Parçacık sayısını artırdım
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Parçacıkları container içinde rastgele yerleştir
      particle.position.x = (Math.random() - 0.5) * 3;
      particle.position.y = (Math.random() - 0.5) * 3;
      particle.position.z = (Math.random() - 0.5) * 3;
      
      // Parçacıkların en az -1.5 ila 3 arasında y konumunda olmasını sağla
      // (zemine daha yakın başlamaları için)
      particle.position.y = Math.random() * 3 - 1.5;
      
      // Parçacık hızını tanımla
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05
      );
      
      scene.add(particle);
      particles.push(particle);
    }
  }
};

// Animasyonu başlatma
const startAnimation = () => {
  if (isPlaying.value) return;
  
  isPlaying.value = true;
  clock.start();
  
  // Sıcaklığı -10'a ayarla ve otomatik artışı başlat
  temperature.value = -10;
  isTemperatureAuto.value = true;
  
  // Hal değişimini güncelle
  updateState();
  
  animate();
};

// Animasyonu durdurma
const stopAnimation = () => {
  isPlaying.value = false;
  isTemperatureAuto.value = false;
  
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

// Animasyon döngüsü
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  const delta = clock.getDelta() * animationSpeed.value;
  
  // Otomatik sıcaklık artışı
  if (isTemperatureAuto.value) {
    // Sıcaklığı animasyon hızına ve delta zamanına bağlı olarak artır
    const tempIncrease = 15 * delta; // Saniyede yaklaşık 15 derece artış
    
    if (temperature.value < 130) {
      temperature.value += tempIncrease;
      
      // Eğer 100 dereceyi geçtiyse 100'de sabitle
      if (temperature.value > 130) {
        temperature.value = 130;
        isTemperatureAuto.value = false; // Artışı durdur
      }
      
      // Hal değişimini güncelle
      updateState();
    }
  }
  
  // Parçacık animasyonu (gaz hali için)
  if (currentState.value === 'Gaz') {
    particles.forEach(particle => {
      // Parçacığı hareket ettir
      particle.position.x += particle.userData.velocity.x * delta * 10;
      particle.position.y += particle.userData.velocity.y * delta * 10;
      particle.position.z += particle.userData.velocity.z * delta * 10;
      
      // Container sınırlarına çarpınca yön değiştir
      const bounceFactors = { x: 1.5, y: 1.5, z: 1.5 };
      
      if (Math.abs(particle.position.x) > bounceFactors.x) {
        particle.userData.velocity.x *= -1;
        particle.position.x = Math.sign(particle.position.x) * bounceFactors.x;
      }
      
      if (Math.abs(particle.position.y) > bounceFactors.y) {
        particle.userData.velocity.y *= -1;
        particle.position.y = Math.sign(particle.position.y) * bounceFactors.y;
      }
      
      if (Math.abs(particle.position.z) > bounceFactors.z) {
        particle.userData.velocity.z *= -1;
        particle.position.z = Math.sign(particle.position.z) * bounceFactors.z;
      }
    });
  }
  
  // Sıvı animasyonu
  if (currentState.value === 'Sıvı') {
    // Hafif dalgalanma efekti (alt nokta zeminde kalacak şekilde)
    liquidObject.position.y = Math.sin(clock.elapsedTime * 2) * 0.05 - 1.1; // Zemini değecek pozisyon
  }
  
  renderScene();
};

// Sahneyi render et
const renderScene = () => {
  if (renderer && scene && camera) {
    // Sıvı animasyonu (animasyon çalışmıyorsa bile sıvıyı doğru pozisyonda göster)
    if (currentState.value === 'Sıvı' && liquidObject) {
      liquidObject.position.y = -1.1; // Zemini değecek pozisyon
    }
    
    renderer.render(scene, camera);
  }
};

// Three.js sahnesini başlatma
const initThreeJS = () => {
  // Sahne oluştur
  scene = new THREE.Scene();
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 3, 5);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);
  
  // Orbit kontrollerini ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işık ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);
  
  // Container oluştur (simülasyon alanı)
  container3D = new THREE.Group();
  scene.add(container3D);
  
  // Zemin oluştur
  const floorGeometry = new THREE.BoxGeometry(6, 0.2, 6);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555,
    transparent: true,
    opacity: 0.8
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -1.6;
  container3D.add(floor);
  
  // Katı hal objesi oluştur
  const solidGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const solidMaterial = new THREE.MeshStandardMaterial({ color: 0x3b82f6 }); // Mavi
  solidObject = new THREE.Mesh(solidGeometry, solidMaterial);
  solidObject.position.y = -0.75; // Zeminin üstünde ve ona değecek şekilde konumlandır
  container3D.add(solidObject);
  
  // Sıvı hal objesi oluştur
  const liquidGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 32);
  const liquidMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.8
  });
  liquidObject = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquidObject.position.y = -1.1; // Zeminin üstünde duracak şekilde konumlandır
  liquidObject.visible = false;
  container3D.add(liquidObject);
  
  // İlk hal durumunu ayarla
  updateState();
  
  // İlk render
  renderScene();
  
  // Pencere boyutu değiştiğinde yeniden boyutlandır
  window.addEventListener('resize', onWindowResize);
};

// Pencere boyutu değişince Three.js boyutunu güncelleme
const onWindowResize = () => {
  if (!camera || !renderer) return;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Arka plan rengini izle ve değiştir
watch(backgroundColor, (newColor) => {
  if (scene) {
    scene.background = new THREE.Color(newColor);
  }
});

// Sayfa yüklendiğinde
onMounted(() => {
  initThreeJS();
  scene.background = new THREE.Color(backgroundColor.value);
});

// Komponent yokedilmeden önce
onBeforeUnmount(() => {
  stopAnimation();
  window.removeEventListener('resize', onWindowResize);
  
  // Three.js nesnelerini temizle
  if (renderer) {
    renderer.dispose();
    
    if (container.value && container.value.contains(renderer.domElement)) {
      container.value.removeChild(renderer.domElement);
    }
  }
});

// Simülasyon Bilgileri bölümü için bilgileri hazırla
const getStateInfo = () => {
  // Basınca göre kaynama ve donma noktalarını hesapla
  const kaynamaNoktasi = 100 + (pressure.value - 1) * 20;
  const donmaNoktasi = 0 - (pressure.value - 1) * 5;
  
  // Hal değişim bilgilerini döndür
  return {
    kaynamaNoktasi: Number(kaynamaNoktasi).toFixed(1),
    donmaNoktasi: Number(donmaNoktasi).toFixed(1)
  };
};
</script>
  
 
 