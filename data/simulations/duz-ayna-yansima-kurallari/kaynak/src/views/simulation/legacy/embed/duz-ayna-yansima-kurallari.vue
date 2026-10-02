<template>
  <div class="w-full h-full flex flex-col bg-gray-900 text-white">
    <!-- Simülasyon ve kontroller için ana container -->
    <div class="flex flex-col md:flex-row flex-1">
      <!-- 3D simülasyon alanı -->
      <div class="flex-1 relative">
        <div id="simulation-container" class="w-full h-full"></div>
        
        <!-- Açıklama ve bilgi kutusu -->
        <div class="absolute top-2 left-2 bg-gray-800 bg-opacity-80 p-2 rounded text-sm">
          <p><span class="inline-block w-3 h-3 bg-red-500 mr-2"></span> Gelen ışın</p>
          <p><span class="inline-block w-3 h-3 bg-blue-500 mr-2"></span> Yansıyan ışın</p>
          <p><span class="inline-block w-3 h-3 bg-green-500 mr-2"></span> Normal çizgisi</p>
          <p class="font-bold mt-2">Gelme açısı = Yansıma açısı</p>
        </div>

        <!-- Başlat/Durdur Butonu -->
        <div class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
          <button 
            @click="toggleAnimation" 
            class="px-4 py-2 rounded-full font-bold transition-all"
            :class="isAnimating ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
          >
            {{ isAnimating ? 'Durdur' : 'Başlat' }}
          </button>
        </div>

        <div class="absolute bottom-2 right-2 w-full bg-gray-800 bg-opacity-80 p-2 rounded text-sm block lg:hidden">
            <div class="grid grid-cols-2 gap-2">
              <button @click="loadScenario(0)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">Dik Gelme</button>
              <button @click="loadScenario(30)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">30° Açı</button>
              <button @click="loadScenario(45)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">45° Açı</button>
              <button @click="loadScenario(-60)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">60° Açı</button>
            </div>
          </div>

      </div>

      <!-- PC Ayarlar Paneli -->
      <div class="hidden md:block w-80 bg-gray-800 overflow-y-auto h-screen overflow-auto">
        <div class="p-4">
          
          <!-- Kamera Görünümleri -->
          <div class="mb-6">
            <h3 class="font-bold mb-2">Kamera Görünümleri</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="setCameraView('front')" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">Önden</button>
              <button @click="setCameraView('side')" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">Yandan</button>
              <button @click="setCameraView('top')" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">Üstten</button>
              <button @click="setCameraView('isometric')" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">İzometrik</button>
              <button @click="resetCamera" class="col-span-2 bg-gray-700 hover:bg-gray-600 p-2 rounded">Görünümü Sıfırla</button>
            </div>
          </div>

          <!-- Işık açısı kontrolü -->
          <div class="mb-6">
            <label class="block mb-2">Işık Açısı: {{ lightAngle }}°</label>
            <input 
              type="range" 
              min="-80" 
              max="80" 
              step="1" 
              v-model="lightAngle"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <!-- Ayna kontrolü -->
          <div class="mb-6">
            <label class="block mb-2">Ayna Döndürme: {{ mirrorAngle }}°</label>
            <input 
              type="range" 
              min="-45" 
              max="45" 
              step="1" 
              v-model="mirrorAngle"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <!-- Kamera yüksekliği -->
          <div class="mb-6">
            <label class="block mb-2">Kamera Yüksekliği</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.5" 
              v-model="cameraHeight"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <!-- Açı bilgileri -->
          <div class="bg-gray-700 p-3 rounded-lg mb-6">
            <h3 class="font-bold mb-2">Ölçümler</h3>
            <p>Gelme açısı (θᵢ): {{ incidenceAngle.toFixed(1) }}°</p>
            <p>Yansıma açısı (θᵣ): {{ reflectionAngle.toFixed(1) }}°</p>
          </div>

          <!-- Örnek senaryolar -->
          <div class="mb-6">
            <h3 class="font-bold mb-2">Örnek Senaryolar</h3>
            <div class="grid grid-cols-2 gap-2">
              <button @click="loadScenario(0)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">Dik Gelme</button>
              <button @click="loadScenario(30)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">30° Açı</button>
              <button @click="loadScenario(45)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">45° Açı</button>
              <button @click="loadScenario(-60)" class="bg-indigo-700 hover:bg-indigo-600 p-2 rounded">60° Açı</button>
            </div>
          </div>

          <!-- Arkaplan Rengi -->
          <div class="mb-6">
            <h3 class="font-bold mb-2">Arkaplan Rengi</h3>
            <div class="grid grid-cols-4 gap-2">
              <button @click="setBackgroundColor('gray')" class="w-8 h-8 rounded bg-gray-900"></button>
              <button @click="setBackgroundColor('blue')" class="w-8 h-8 rounded bg-blue-900"></button>
              <button @click="setBackgroundColor('indigo')" class="w-8 h-8 rounded bg-indigo-900"></button>
              <button @click="setBackgroundColor('purple')" class="w-8 h-8 rounded bg-purple-900"></button>
            </div>
          </div>

          <!-- Sıfırlama Butonu -->
          <button 
            v-if="isDefaultSettingsChanged" 
            @click="resetSettings" 
            class="w-full bg-red-700 hover:bg-red-600 p-2 rounded"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Varsayılan değerler
const DEFAULT_SETTINGS = {
  lightAngle: 30,
  mirrorAngle: 0,
  cameraHeight: 5,
  backgroundColor: 'gray'
};

// Reaktif durum değişkenleri
const showSettings = ref(false); // Mobil ayarlar modalı için
const lightAngle = ref(DEFAULT_SETTINGS.lightAngle);
const mirrorAngle = ref(DEFAULT_SETTINGS.mirrorAngle);
const cameraHeight = ref(DEFAULT_SETTINGS.cameraHeight);
const backgroundColor = ref(DEFAULT_SETTINGS.backgroundColor);
// Animasyon için reaktif durumlar
const isAnimating = ref(false);
const animationProgress = ref(0);
const animationPhase = ref('idle'); // 'idle', 'incoming', 'impact', 'outgoing', 'complete'

// Ayarların varsayılan değerlerden farklı olup olmadığını kontrol et
const isDefaultSettingsChanged = computed(() => {
  return lightAngle.value !== DEFAULT_SETTINGS.lightAngle ||
         mirrorAngle.value !== DEFAULT_SETTINGS.mirrorAngle ||
         cameraHeight.value !== DEFAULT_SETTINGS.cameraHeight ||
         backgroundColor.value !== DEFAULT_SETTINGS.backgroundColor;
});

// Hesaplanan açılar
const incidenceAngle = computed(() => {
  return Math.abs(lightAngle.value - mirrorAngle.value);
});

const reflectionAngle = computed(() => {
  return incidenceAngle.value;
});

// Three.js değişkenleri
let scene, camera, renderer, controls;
let floor, ceiling, leftWall, rightWall, backWall;
let mirror, lightSource, incidentRay, normalLine, reflectedRay;
let angleDisplay, normalAngleDisplay;
// Animasyon için değişkenler
let impactEffect; // Çarpışma efekti
let animationFrameId; // requestAnimationFrame ID'si
let lastTime = 0; // Animasyon için zaman kontrolü
const ANIMATION_DURATION = {
  incoming: 1000, // Gelen ışın animasyonu süresi (ms)
  impact: 300,    // Çarpışma efekti süresi (ms)
  outgoing: 1000  // Yansıyan ışın animasyonu süresi (ms)
};

// Animasyonu başlatma/durdurma fonksiyonu
const toggleAnimation = () => {
  if (isAnimating.value) {
    // Animasyonu durdur
    isAnimating.value = false;
    animationPhase.value = 'idle';
    animationProgress.value = 0;
    // Tam ışın göster
    updateLightRays(1, 1);
  } else {
    // Animasyonu başlat
    isAnimating.value = true;
    animationPhase.value = 'incoming';
    animationProgress.value = 0;
    lastTime = performance.now();
    
    // Görünürlüğü sıfırla
    updateLightRays(0, 0);
    
    // Çarpışma efektini hazırla ama görünmez yap
    if (impactEffect) {
      impactEffect.visible = false;
    }
  }
};

// Işık ışınlarının görünürlüğünü kontrol eden fonksiyon
const updateLightRayVisibility = (incidentProgress, reflectionProgress) => {
  if (!incidentRay || !reflectedRay) return;
  
  // Işık kaynağı ve ayna arasındaki vuruş noktasını hesapla
  const lightAngleRad = THREE.MathUtils.degToRad(lightAngle.value);
  const distance = 8;
  const sourcePosition = new THREE.Vector3(
    Math.sin(lightAngleRad) * distance,
    0,
    Math.cos(lightAngleRad) * distance - 5
  );
  
  const hitPoint = new THREE.Vector3(0, 0, -5);
  
  // Gelen ışın vektörü
  const incidentVector = new THREE.Vector3()
    .subVectors(hitPoint, sourcePosition)
    .normalize();
  
  // Normalin yönünü hesaplama (mirrorın dönüşüne göre)
  const normalDirection = new THREE.Vector3(0, 0, 1).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    THREE.MathUtils.degToRad(mirrorAngle.value)
  );
  
  // Yansıyan ışın vektörü hesaplama
  const reflectedVector = new THREE.Vector3()
    .copy(incidentVector)
    .reflect(normalDirection)
    .normalize();
  
  // Gelen ışın için ara noktayı hesapla
  const midPointIncident = new THREE.Vector3()
    .copy(sourcePosition)
    .lerp(hitPoint, incidentProgress);
  
  // Gelen ışını güncelle
  const incidentPoints = [
    sourcePosition.clone(),
    midPointIncident.clone()
  ];
  updateLineGeometry(incidentRay, incidentPoints);
  
  // Yansıyan ışın için hesaplama
  if (reflectionProgress > 0) {
    const reflectedLineLength = 10;
    const endPoint = hitPoint.clone().add(
      reflectedVector.clone().multiplyScalar(reflectedLineLength * reflectionProgress)
    );
    
    const reflectedPoints = [
      hitPoint.clone(),
      endPoint
    ];
    updateLineGeometry(reflectedRay, reflectedPoints);
  } else {
    // Yansıyan ışını görünmez yap
    const reflectedPoints = [
      hitPoint.clone(),
      hitPoint.clone()
    ];
    updateLineGeometry(reflectedRay, reflectedPoints);
  }
  
  // Çarpışma efektini kontrol et
  if (animationPhase.value === 'impact') {
    if (!impactEffect) {
      // Çarpışma efekti yoksa oluştur
      createImpactEffect(hitPoint);
    }
    
    // Efektin boyutunu ve opaklığını animasyon ilerlemesine göre ayarla
    const scale = 0.2 + animationProgress.value * 0.3;
    impactEffect.scale.set(scale, scale, scale);
    
    const opacity = 1 - animationProgress.value;
    impactEffect.material.opacity = opacity;
    impactEffect.visible = true;
  } else if (impactEffect) {
    impactEffect.visible = false;
  }
  
  // Açı göstergelerini güncelle
  updateAngleDisplays(hitPoint, incidentVector, normalDirection, reflectedVector);
};

// Çarpışma efekti oluşturma
const createImpactEffect = (position) => {
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 1
  });
  
  impactEffect = new THREE.Mesh(geometry, material);
  impactEffect.position.copy(position);
  impactEffect.visible = false;
  scene.add(impactEffect);
};

// Animasyon güncelleme fonksiyonu
const updateAnimation = (currentTime) => {
  if (!isAnimating.value) return;
  
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  switch (animationPhase.value) {
    case 'incoming':
      // Gelen ışın animasyonu
      animationProgress.value += deltaTime / ANIMATION_DURATION.incoming;
      if (animationProgress.value >= 1) {
        animationProgress.value = 0;
        animationPhase.value = 'impact';
      }
      updateLightRayVisibility(animationProgress.value, 0);
      break;
      
    case 'impact':
      // Çarpışma efekti animasyonu
      animationProgress.value += deltaTime / ANIMATION_DURATION.impact;
      if (animationProgress.value >= 1) {
        animationProgress.value = 0;
        animationPhase.value = 'outgoing';
      }
      updateLightRayVisibility(1, 0);
      break;
      
    case 'outgoing':
      // Yansıyan ışın animasyonu
      animationProgress.value += deltaTime / ANIMATION_DURATION.outgoing;
      if (animationProgress.value >= 1) {
        animationProgress.value = 1;
        animationPhase.value = 'complete';
        // Animasyonu tamamla ama durdurma
      }
      updateLightRayVisibility(1, animationProgress.value);
      break;
      
    case 'complete':
      // Animasyon tamamlandı, tüm ışınları göster
      updateLightRayVisibility(1, 1);
      break;
  }
};

// Kamera görünümleri için fonksiyonlar
const setCameraView = (view) => {
  if (!camera || !controls) return;

  switch (view) {
    case 'front':
      camera.position.set(0, 0, 15);
      break;
    case 'side':
      camera.position.set(15, 0, 0);
      break;
    case 'top':
      camera.position.set(0, 15, 0);
      camera.up.set(0, 0, -1); // Yukarı yönünü ayarla
      break;
    case 'isometric':
      camera.position.set(10, 10, 10);
      break;
  }

  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
};

const resetCamera = () => {
  if (!camera || !controls) return;
  camera.position.set(0, cameraHeight.value, 10);
  camera.up.set(0, 1, 0); // Varsayılan yukarı yönü
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
};

// Arkaplan rengi değiştirme fonksiyonu
const setBackgroundColor = (color) => {
  if (!scene) return;
  
  backgroundColor.value = color;
  let newColor;
  
  switch (color) {
    case 'gray':
      newColor = 0x111827;
      break;
    case 'blue':
      newColor = 0x1e3a8a;
      break;
    case 'indigo':
      newColor = 0x312e81;
      break;
    case 'purple':
      newColor = 0x4c1d95;
      break;
    default:
      newColor = 0x111827;
  }
  
  scene.background = new THREE.Color(newColor);
  
  // Duvarları da güncelle
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: newColor,
    side: THREE.DoubleSide
  });
  
  floor.material = wallMaterial;
  ceiling.material = wallMaterial;
  leftWall.material = wallMaterial;
  rightWall.material = wallMaterial;
  backWall.material = wallMaterial;
};

// Ayarları sıfırlama fonksiyonu
const resetSettings = () => {
  // Eğer animasyon çalışıyorsa durdur
  if (isAnimating.value) {
    toggleAnimation();
  }
  
  lightAngle.value = DEFAULT_SETTINGS.lightAngle;
  mirrorAngle.value = DEFAULT_SETTINGS.mirrorAngle;
  cameraHeight.value = DEFAULT_SETTINGS.cameraHeight;
  setBackgroundColor(DEFAULT_SETTINGS.backgroundColor);
  resetCamera();
};

// Hazır senaryoları yükleme fonksiyonu
const loadScenario = (angle) => {
  // Eğer animasyon çalışıyorsa durdur
  if (isAnimating.value) {
    toggleAnimation();
  }
  
  lightAngle.value = angle;
};

// Three.js sahnesini başlatma
const initScene = () => {
  // Sahne oluşturma
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);

  // Kamera ayarları
  const container = document.getElementById('simulation-container');
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(0, cameraHeight.value, 10);
  
  // Renderer ayarları
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  
  // Orbit kontrolleri ekleme
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işık ekleme
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Zemin, tavan ve duvarları oluşturma
  createRoom();
  
  // Ayna oluşturma
  createMirror();
  
  // Işık ışınlarını oluşturma
  createLightRays();
  
  // Açı göstergelerini oluşturma
  createAngleDisplays();
  
  // Pencere boyutu değişimini dinleme
  window.addEventListener('resize', onWindowResize);
  
  // Animasyon döngüsü başlatma
  animate();
};

// Oda (zemin, tavan, duvarlar) oluşturma
const createRoom = () => {
  const roomSize = 20;
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111827, // bg-gray-900 ile aynı renk
    side: THREE.DoubleSide
  });
  
  // Zemin
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Tavan
  ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 15;
  scene.add(ceiling);
  
  // Arka duvar
  backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, 20),
    wallMaterial
  );
  backWall.position.z = -10;
  scene.add(backWall);
  
  // Sol duvar
  leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    wallMaterial
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -10;
  scene.add(leftWall);
  
  // Sağ duvar
  rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    wallMaterial
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 10;
  scene.add(rightWall);

  // Koordinat düzlemi (yardımcı çizgiler)
  const gridHelper = new THREE.GridHelper(roomSize, 20, 0x444444, 0x333333);
  gridHelper.position.y = -4.99;
  scene.add(gridHelper);
};

// Ayna oluşturma
const createMirror = () => {
  // Ayna malzemesi - parlak yansıtıcı yüzey
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.9,
    roughness: 0.1,
    side: THREE.DoubleSide
  });
  
  // Ayna geometrisi
  const mirrorGeometry = new THREE.PlaneGeometry(10, 8);
  mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
  mirror.position.set(0, 0, -5);
  mirror.castShadow = true;
  mirror.receiveShadow = true;
  scene.add(mirror);
};

// Işık ışınları ve ilgili göstergeleri oluşturma
const createLightRays = () => {
  // Işık kaynağı (küre şeklinde)
  const sourceGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const sourceMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  lightSource = new THREE.Mesh(sourceGeometry, sourceMaterial);
  scene.add(lightSource);
  
  // Işın malzemeleri
  const incidentMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Kırmızı
  const normalMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Yeşil
  const reflectMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff }); // Mavi
  
  // Işın geometrileri (başlangıçta boş, updateLightRays ile doldurulacak)
  incidentRay = new THREE.Line(new THREE.BufferGeometry(), incidentMaterial);
  normalLine = new THREE.Line(new THREE.BufferGeometry(), normalMaterial);
  reflectedRay = new THREE.Line(new THREE.BufferGeometry(), reflectMaterial);
  
  scene.add(incidentRay);
  scene.add(normalLine);
  scene.add(reflectedRay);
};

// Açı göstergeleri oluşturma
const createAngleDisplays = () => {
  // Three.js sahnesindeki açı göstergeleri için malzeme oluşturma
  const angleDisplayMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
  
  // Gelen ışın açısı göstergesi
  angleDisplay = new THREE.Line(new THREE.BufferGeometry(), angleDisplayMaterial);
  scene.add(angleDisplay);
  
  // Normal açı göstergesi
  normalAngleDisplay = new THREE.Line(new THREE.BufferGeometry(), angleDisplayMaterial);
  scene.add(normalAngleDisplay);
};

// Işık ışınları ve açılarını güncelleme (statik)
const updateLightRays = (incidentVisibility = 1, reflectionVisibility = 1) => {
  if (!scene || !mirror) return;

  // Mirrorın açısını güncelleme
  mirror.rotation.y = THREE.MathUtils.degToRad(mirrorAngle.value);
  
  // Normalin yönünü hesaplama (mirrorın dönüşüne göre)
  const normalDirection = new THREE.Vector3(0, 0, 1).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    mirror.rotation.y
  );
  
  // Işık kaynağı pozisyonu
  const lightAngleRad = THREE.MathUtils.degToRad(lightAngle.value);
  const distance = 8;
  lightSource.position.set(
    Math.sin(lightAngleRad) * distance,
    0,
    Math.cos(lightAngleRad) * distance - 5
  );
  
  // Işığın çarpma noktası (mirror üzerindeki nokta)
  const hitPoint = new THREE.Vector3(0, 0, -5);
  
  // Gelen ışın vektörü
  const incidentVector = new THREE.Vector3()
    .subVectors(hitPoint, lightSource.position)
    .normalize();
  
  // Yansıyan ışın vektörü hesaplama
  const reflectedVector = new THREE.Vector3()
    .copy(incidentVector)
    .reflect(normalDirection)
    .normalize();
  
  // Animasyon modunda ise ışın görünürlüğünü ayarla
  if (isAnimating.value) {
    updateLightRayVisibility(incidentVisibility, reflectionVisibility);
    return;
  }
  
  // Normal modda ışınları güncel pozisyonlara göre çizme
  const incidentPoints = [
    lightSource.position.clone(),
    hitPoint.clone()
  ];
  
  const normalLineLength = 4;
  const normalPoints = [
    hitPoint.clone(),
    hitPoint.clone().add(normalDirection.clone().multiplyScalar(normalLineLength))
  ];
  
  const reflectedLineLength = 10;
  const reflectedPoints = [
    hitPoint.clone(),
    hitPoint.clone().add(reflectedVector.clone().multiplyScalar(reflectedLineLength))
  ];
  
  // Geometrileri güncelleme
  updateLineGeometry(incidentRay, incidentPoints);
  updateLineGeometry(normalLine, normalPoints);
  updateLineGeometry(reflectedRay, reflectedPoints);
  
  // Açı göstergelerini güncelleme
  updateAngleDisplays(hitPoint, incidentVector, normalDirection, reflectedVector);
};

// Çizgi geometrisini güncelleme yardımcı fonksiyonu
const updateLineGeometry = (line, points) => {
  const geometry = line.geometry;
  const positions = new Float32Array(points.length * 3);
  
  for (let i = 0; i < points.length; i++) {
    positions[i * 3] = points[i].x;
    positions[i * 3 + 1] = points[i].y;
    positions[i * 3 + 2] = points[i].z;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.attributes.position.needsUpdate = true;
};

// Açı göstergelerini güncelleme
const updateAngleDisplays = (hitPoint, incidentVector, normalVector, reflectedVector) => {
  // Açı göstergeleri için yarıçap
  const radius = 1.5;
  
  // Geliş açısı için yay çizimi
  const incidenceAnglePoints = [];
  const incidenceAngleRad = Math.acos(incidentVector.dot(normalVector));
  
  // Yansıma açısı için yay çizimi
  const reflectionAnglePoints = [];
  const reflectionAngleRad = Math.acos(reflectedVector.dot(normalVector));
  
  // Açı göstergelerini güncelleme
  // Burada basitleştirme için düz çizgiler kullanacağız
  const anglePoints = [
    hitPoint.clone().add(normalVector.clone().multiplyScalar(radius)),
    hitPoint.clone(),
    hitPoint.clone().sub(incidentVector.clone().multiplyScalar(radius))
  ];
  
  const normalAnglePoints = [
    hitPoint.clone().add(normalVector.clone().multiplyScalar(radius)),
    hitPoint.clone(),
    hitPoint.clone().add(reflectedVector.clone().multiplyScalar(radius))
  ];
  
  // Açı göstergelerini güncelleme
  updateLineGeometry(angleDisplay, anglePoints);
  updateLineGeometry(normalAngleDisplay, normalAnglePoints);
};

// Pencere boyutu değiştiğinde çağrılacak fonksiyon
const onWindowResize = () => {
  const container = document.getElementById('simulation-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
};

// Animasyon döngüsü
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  // Animasyon durumunu güncelle
  if (isAnimating.value) {
    updateAnimation(performance.now());
  }
  
  controls.update();
  renderer.render(scene, camera);
};

// Bileşen oluşturulduğunda
onMounted(() => {
  initScene();
  updateLightRays();
});

// Reaktif değişkenleri izleme
watch([lightAngle, mirrorAngle], () => {
  // Animasyon çalışmıyorsa normal güncelleme yap
  if (!isAnimating.value) {
    updateLightRays();
  }
});

watch(cameraHeight, () => {
  if (camera) {
    camera.position.y = cameraHeight.value;
  }
});

// Temizlik işlemleri
onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Three.js kaynaklarını temizle
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});
</script>
  
 
 