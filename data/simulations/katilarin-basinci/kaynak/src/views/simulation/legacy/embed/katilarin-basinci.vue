<template>
  <div class="min-h-screen bg-gray-900 flex flex-col">
    
    <!-- Ana İçerik (Simülasyon + Kontroller) -->
    <div class="flex flex-col md:flex-row flex-1 p-4 gap-4">
      <!-- Simülasyon Alanı -->
      <div class="flex-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden relative flex flex-col">
        <!-- Three.js sahnesinin render edileceği konteyner -->
        <div ref="threeContainer" class="flex-1 relative"></div>
        
        <!-- Basınç Göstergesi -->
        <div class="absolute top-4 right-4 bg-gray-900 bg-opacity-90 p-3 rounded-lg text-white shadow-lg">
          <div class="flex items-center gap-2">
            <div class="text-sm font-medium">Basınç:</div>
            <div class="text-lg font-bold" :style="{ color: pressureColor }">{{ pressure.toFixed(2) }} N/m²</div>
          </div>
          <!-- Basınç Renk Skalası -->
          <div class="h-3 w-full mt-2 flex rounded-full overflow-hidden">
            <div class="h-full flex-1 bg-blue-500"></div>
            <div class="h-full flex-1 bg-green-500"></div>
            <div class="h-full flex-1 bg-yellow-500"></div>
            <div class="h-full flex-1 bg-red-500"></div>
          </div>
          <div class="flex justify-between text-xs mt-1">
            <span>Düşük</span>
            <span>Yüksek</span>
          </div>
        </div>

        <!-- Mobil Ayarlar Butonu -->
        <button @click="showMobileSettings = true" 
                class="md:hidden absolute top-4 left-4 bg-gray-900 bg-opacity-90 p-2 rounded-lg text-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      <!-- Masaüstü Kontrol Paneli -->
      <div class="hidden md:flex w-80 bg-gray-800 rounded-lg shadow-lg p-4 flex-col gap-4 text-white h-screen overflow-auto">
        
        <!-- Ayarlar İçeriği -->
        <div class="space-y-3 h-full">
          <!-- Cisim Seçimi -->
          <div>
            <label class="block mb-2 font-medium">Cisim Şekli</label>
            <select v-model="selectedObject" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cube">Küp</option>
              <option value="cylinder">Silindir</option>
              <option value="prism">Dikdörtgen Prizma</option>
            </select>
          </div>
          
          <!-- Kütle Kontrolü -->
          <div>
            <label class="block mb-2 font-medium">Kütle: {{ mass.toFixed(1) }} kg</label>
            <input type="range" v-model.number="mass" min="1" max="20" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <!-- Boyut Kontrolleri -->
          <div v-if="selectedObject === 'cube' || selectedObject === 'prism'">
            <label class="block mb-2 font-medium">Genişlik: {{ width.toFixed(1) }} m</label>
            <input type="range" v-model.number="width" min="0.5" max="5" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div v-if="selectedObject === 'prism'">
            <label class="block mb-2 font-medium">Uzunluk: {{ length.toFixed(1) }} m</label>
            <input type="range" v-model.number="length" min="0.5" max="5" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div v-if="selectedObject === 'cylinder'">
            <label class="block mb-2 font-medium">Yarıçap: {{ radius.toFixed(1) }} m</label>
            <input type="range" v-model.number="radius" min="0.5" max="3" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <!-- Zemin Tipi -->
          <div>
            <label class="block mb-2 font-medium">Zemin Tipi</label>
            <select v-model="floorType" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="hard">Sert (Metal)</option>
              <option value="medium">Orta (Tahta)</option>
              <option value="soft">Yumuşak (Sünger)</option>
            </select>
          </div>


          
          <!-- Bilgi Kutusu -->
          <div class="bg-gray-700 p-3 rounded-lg">
            <h3 class="font-medium mb-2">Basınç Formülü</h3>
            <div class="text-center font-bold mb-2">P = F / A = m·g / A</div>
            <div class="text-sm space-y-1">
              <p>Basınç (P): {{ pressure.toFixed(2) }} N/m²</p>
              <p>Kuvvet (F): {{ force.toFixed(2) }} N</p>
              <p>Yüzey Alanı (A): {{ surfaceArea.toFixed(2) }} m²</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobil Ayarlar Modal -->
    <div v-if="showMobileSettings" 
         class="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden flex items-start justify-center pt-4">
      <div class="bg-gray-800 w-11/12 h-screen rounded-lg shadow-lg p-4 overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Ayarlar</h2>
          <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Mobil Ayarlar İçeriği (Masaüstü ile aynı) -->
        <div class="space-y-4 text-white">
          <!-- Cisim Seçimi -->
          <div>
            <label class="block mb-2 font-medium">Cisim Şekli</label>
            <select v-model="selectedObject" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cube">Küp</option>
              <option value="cylinder">Silindir</option>
              <option value="prism">Dikdörtgen Prizma</option>
            </select>
          </div>
          
          <!-- Kütle Kontrolü -->
          <div>
            <label class="block mb-2 font-medium">Kütle: {{ mass.toFixed(1) }} kg</label>
            <input type="range" v-model.number="mass" min="1" max="20" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <!-- Boyut Kontrolleri -->
          <div v-if="selectedObject === 'cube' || selectedObject === 'prism'">
            <label class="block mb-2 font-medium">Genişlik: {{ width.toFixed(1) }} m</label>
            <input type="range" v-model.number="width" min="0.5" max="5" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div v-if="selectedObject === 'prism'">
            <label class="block mb-2 font-medium">Uzunluk: {{ length.toFixed(1) }} m</label>
            <input type="range" v-model.number="length" min="0.5" max="5" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div v-if="selectedObject === 'cylinder'">
            <label class="block mb-2 font-medium">Yarıçap: {{ radius.toFixed(1) }} m</label>
            <input type="range" v-model.number="radius" min="0.5" max="3" step="0.1" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <!-- Zemin Tipi -->
          <div>
            <label class="block mb-2 font-medium">Zemin Tipi</label>
            <select v-model="floorType" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="hard">Sert (Metal)</option>
              <option value="medium">Orta (Tahta)</option>
              <option value="soft">Yumuşak (Sünger)</option>
            </select>
          </div>




          
          <!-- Bilgi Kutusu -->
          <div class="bg-gray-700 p-3 rounded-lg">
            <h3 class="font-medium mb-2">Basınç Formülü</h3>
            <div class="text-center font-bold mb-2">P = F / A = m·g / A</div>
            <div class="text-sm space-y-1">
              <p>Basınç (P): {{ pressure.toFixed(2) }} N/m²</p>
              <p>Kuvvet (F): {{ force.toFixed(2) }} N</p>
              <p>Yüzey Alanı (A): {{ surfaceArea.toFixed(2) }} m²</p>
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
import * as TWEEN from '@tweenjs/tween.js';

// Referanslar
const threeContainer = ref(null);

// Üç boyutlu sahne bileşenleri
let scene, camera, renderer, controls;
let floor, object3D;
let pressureMarker;

// Simülasyon durumu
const selectedObject = ref('cube');
const mass = ref(5);
const width = ref(2);
const length = ref(2);
const radius = ref(1);
const floorType = ref('medium');
const showMobileSettings = ref(false);

// Fizik sabitleri
const gravity = 9.81; // m/s²

// Hesaplanan değerler
const force = computed(() => mass.value * gravity);

const surfaceArea = computed(() => {
  if (selectedObject.value === 'cube') {
    return width.value * width.value;
  } else if (selectedObject.value === 'prism') {
    return width.value * length.value;
  } else if (selectedObject.value === 'cylinder') {
    return Math.PI * radius.value * radius.value;
  }
  return 1; // Varsayılan değer
});

const pressure = computed(() => force.value / surfaceArea.value);

// Basınç rengini hesapla (düşük: mavi -> yüksek: kırmızı)
const pressureColor = computed(() => {
  // Basınç seviyelerine göre renk belirle
  const maxPressure = 100; // Örnek maksimum basınç değeri
  const normalizedPressure = Math.min(pressure.value / maxPressure, 1);
  
  if (normalizedPressure < 0.25) {
    return '#3B82F6'; // Mavi - Düşük basınç
  } else if (normalizedPressure < 0.5) {
    return '#10B981'; // Yeşil - Orta-düşük basınç
  } else if (normalizedPressure < 0.75) {
    return '#FBBF24'; // Sarı - Orta-yüksek basınç
  } else {
    return '#EF4444'; // Kırmızı - Yüksek basınç
  }
});

// Kamera pozisyonları
const cameraPositions = {
  top: { position: new THREE.Vector3(0, 15, 0), target: new THREE.Vector3(0, 0, 0) },
  front: { position: new THREE.Vector3(0, 0, 15), target: new THREE.Vector3(0, 0, 0) },
  side: { position: new THREE.Vector3(15, 0, 0), target: new THREE.Vector3(0, 0, 0) },
  isometric: { position: new THREE.Vector3(10, 10, 10), target: new THREE.Vector3(0, 0, 0) }
};

// Kamera kontrolleri
function setCameraView(view) {
  if (!camera || !controls) return;
  
  const position = cameraPositions[view].position;
  const target = cameraPositions[view].target;
  
  // Kamera pozisyonunu animasyonlu bir şekilde değiştir
  new TWEEN.Tween(camera.position)
    .to({ x: position.x, y: position.y, z: position.z }, 1000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
    
  // Kontrol hedefini animasyonlu bir şekilde değiştir
  new TWEEN.Tween(controls.target)
    .to({ x: target.x, y: target.y, z: target.z }, 1000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
}

// Kamerayı sıfırla
function resetCamera() {
  setCameraView('isometric');
}

// Arkaplan rengini değiştir
function setBackgroundColor(theme) {
  if (!scene) return;
  
  if (theme === 'dark') {
    scene.background = new THREE.Color(0x1E293B);
  } else {
    scene.background = new THREE.Color(0xF3F4F6);
  }
}

// Three.js sahnesi oluşturma
function initScene() {
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1E293B); // Varsayılan koyu arka plan
  
  // Kamera oluştur
  const aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
  camera.position.set(10, 10, 10);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.shadowMap.enabled = true;
  threeContainer.value.appendChild(renderer.domElement);
  
  // Kontroller ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Gölgeler için ayarları düzenle
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  
  // Odayı oluştur (tavan, duvarlar ve zemin)
  createRoom();
  
  // Cismi oluştur
  updateObject();
  
  // Pencere boyutu değişikliklerini dinle
  window.addEventListener('resize', onWindowResize);
  
  // Animasyon döngüsünü başlat
  animate();
}

// Odayı oluştur
function createRoom() {
  // Zemin
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  
  // Zemin tipine göre materyal
  let floorMaterial;
  
  if (floorType.value === 'hard') {
    floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.8,
      roughness: 0.2
    });
  } else if (floorType.value === 'medium') {
    floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      metalness: 0.1,
      roughness: 0.8
    });
  } else { // soft
    floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0,
      roughness: 1
    });
  }
  
  floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Duvarlar
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    transparent: true,
    opacity: 0
  });
  
  // Arka duvar
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
  backWall.position.z = -10;
  backWall.position.y = 3;
  scene.add(backWall);
  
  // Sol duvar
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
  leftWall.position.x = -10;
  leftWall.position.y = 3;
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);
  
  // Sağ duvar
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
  rightWall.position.x = 10;
  rightWall.position.y = 3;
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);
  
  // Tavan
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), wallMaterial);
  ceiling.position.y = 8;
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);
}

// Seçilen cisme göre 3D modeli güncelle
function updateObject() {
  // Eğer daha önce bir cisim oluşturulmuşsa, kaldır
  if (object3D) {
    scene.remove(object3D);
  }
  
  if (pressureMarker) {
    scene.remove(pressureMarker);
  }
  
  // Cisim tipine göre geometri oluştur
  let geometry;
  
  // Boyut ve yüksekliği hesapla
  let objectHeight = Math.cbrt(mass.value) * 0.8; // Kütle hacmi etkilesin
  
  if (selectedObject.value === 'cube') {
    geometry = new THREE.BoxGeometry(width.value, objectHeight, width.value);
  } else if (selectedObject.value === 'prism') {
    geometry = new THREE.BoxGeometry(width.value, objectHeight, length.value);
  } else if (selectedObject.value === 'cylinder') {
    geometry = new THREE.CylinderGeometry(radius.value, radius.value, objectHeight, 32);
  }
  
  // Materyal oluştur (yarı saydam)
  const material = new THREE.MeshStandardMaterial({
    color: 0x3B82F6,
    metalness: 0.3,
    roughness: 0.7,
    transparent: true,
    opacity: 0.9
  });
  
  // Cismi oluştur
  object3D = new THREE.Mesh(geometry, material);
  
  // Cismin zemine tam temas etmesi için pozisyonu güncelle
  // Zeminin pozisyonu (-2) ve cismin yüksekliğinin yarısı
  // Cismin alt noktası zemine tam temas edecek
  object3D.position.y = -2 + (objectHeight / 2);

  object3D.castShadow = true;
  object3D.receiveShadow = true;
  scene.add(object3D);
  
  // Basınç göstergesini oluştur (cismin altında renk değiştiren düzlem)
  const markerSize = Math.max(
    selectedObject.value === 'cylinder' ? radius.value * 2 : width.value,
    selectedObject.value === 'prism' ? length.value : 0
  );
  
  const markerGeo = new THREE.PlaneGeometry(markerSize, markerSize);
  const markerMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pressureColor.value),
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  
  pressureMarker = new THREE.Mesh(markerGeo, markerMat);
  pressureMarker.rotation.x = -Math.PI / 2;
  // Basınç göstergesini zeminin hemen üzerine yerleştir
  pressureMarker.position.y = -1.99; // Zeminin biraz üstünde (-2 + 0.01)
  scene.add(pressureMarker);
  
  // Zemin deformasyonu simülasyonu
  updateFloorDeformation();
}

// Zemin deformasyonunu güncelle
function updateFloorDeformation() {
  // Basınca ve zemin tipine göre nesnenin ne kadar zemine gömüleceğini hesapla
  let deformation = 0;
  
  if (floorType.value === 'hard') {
    deformation = pressure.value * 0.0001; // Çok az deformasyon
  } else if (floorType.value === 'medium') {
    deformation = pressure.value * 0.001; // Orta deformasyon
  } else { // soft
    deformation = pressure.value * 0.005; // Yüksek deformasyon
  }
  
  // Maksimum deformasyonu sınırla
  deformation = Math.min(deformation, 1.5);
  
  // Cismi zemine göm - ama zeminin altına taşmasını engelle
  if (object3D) {
    const objectHeight = object3D.geometry.parameters.height;
    
    // Deformasyon miktarı, cismin yarı yüksekliğinden fazla olamaz
    // Bu sayede cisim her zaman en az bir kısmı zemin üzerinde kalır
    const safeDeformation = Math.min(deformation, objectHeight * 0.45);
    
    // Cismi güvenli şekilde konumlandır
    object3D.position.y = -2 + (objectHeight / 2) - safeDeformation;
  }
  
  // Basınç göstergesini güncelle
  if (pressureMarker) {
    // Basınç göstergesinin rengini güncelle
    pressureMarker.material.color.set(pressureColor.value);
  }
}

// Pencere boyutu değiştiğinde çalışır
function onWindowResize() {
  if (!threeContainer.value) return;
  
  // Kamera ve renderer'ı güncelle
  camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
}

// Animasyon döngüsü
function animate() {
  requestAnimationFrame(animate);
  
  // TWEEN animasyonlarını güncelle
  TWEEN.update();
  
  // Kontrolleri güncelle
  controls.update();
  
  // Sahneyi render et
  renderer.render(scene, camera);
}

// Bileşen oluşturulduğunda çalışır
onMounted(() => {
  // Küçük bir gecikme ile Three.js sahnesini başlat
  setTimeout(() => {
    initScene();
  }, 100);
});

// Değişiklikleri izle ve sahneyi güncelle
watch([selectedObject, mass, width, length, radius, floorType], () => {
  if (scene) {
    updateObject();
    
    // Zemin tipini değiştirince odayı yeniden oluştur
    if (floor) {
      scene.remove(floor);
      createRoom();
    }
  }
}, { deep: true });

// Bileşen yok edildiğinde temizlik yap
onBeforeUnmount(() => {
  // Event listener'ı kaldır
  window.removeEventListener('resize', onWindowResize);
  
  // Three.js kaynaklarını temizle
  if (renderer) {
    renderer.dispose();
    
    // DOM elementini kaldır
    if (threeContainer.value && threeContainer.value.firstChild) {
      threeContainer.value.removeChild(threeContainer.value.firstChild);
    }
  }
  
  // Bellek temizliği için referansları boşalt
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  floor = null;
  object3D = null;
  pressureMarker = null;
});
</script>
  
 
 