<template>
  <div class="h-screen flex flex-col overflow-auto" :class="darkMode ? 'bg-gray-900' : 'bg-gray-100'">

    
    <!-- Ana İçerik -->
    <div class="flex flex-col md:flex-row flex-1 overflow-hidden relative">
      <!-- Simülasyon Alanı -->
      <div class="flex-1 relative">
        <div ref="threeContainer" class="w-full h-screen"></div>
        
        <!-- Kırılma Formülü Overlay -->
        <div class="absolute top-4 right-4 bg-gray-800 bg-opacity-80 p-3 rounded-lg shadow-lg text-white">
          <div class="flex mt-2 space-x-4">
            <div>
              <p>Giriş Açısı: {{ Math.round(incidenceAngle) }}°</p>
              <p>Kırılma Açısı: {{ Math.round(refractionAngle) }}°</p>
            </div>
            <div>
              <p>n₁: {{ media[selectedMedia1].value.toFixed(2) }}</p>
              <p>n₂: {{ media[selectedMedia2].value.toFixed(2) }}</p>
            </div>
          </div>
          <p v-if="isTotalInternalReflection" class="text-yellow-400 font-bold mt-1">
            Tam Yansıma Oluştu!
          </p>
        </div>

        <!-- Mobil Ayarlar Butonu -->
        <button 
          @click="showSettings = true"
          class="md:hidden absolute top-4 left-4 bg-gray-800 p-2 rounded-lg text-white shadow-lg z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      <!-- Kontrol Paneli - Desktop -->
      <div 
        class="hidden md:block bg-gray-800 p-4 w-80 overflow-y-auto max-h-screen"
        :class="{'translate-x-0': showSettings, 'translate-x-full': !showSettings}"
      >
        <!-- Settings Panel Content -->
        <div class="space-y-6">
          <!-- Ortam Seçimleri -->
          <div class="space-y-3">
            <h3 class="text-white font-bold border-b border-gray-700 pb-1">Ortam Seçimleri</h3>
            
            <div>
              <label class="text-gray-300 block mb-1">Ortam 1 (dış):</label>
              <select 
                v-model="selectedMedia1"
                class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="(medium, key) in media" :key="`medium1-${key}`" :value="key">
                  {{ medium.name }} (n={{ medium.value.toFixed(2) }})
                </option>
              </select>
            </div>
            
            <div>
              <label class="text-gray-300 block mb-1">Ortam 2 (iç):</label>
              <select 
                v-model="selectedMedia2"
                class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="(medium, key) in media" :key="`medium2-${key}`" :value="key">
                  {{ medium.name }} (n={{ medium.value.toFixed(2) }})
                </option>
              </select>
            </div>
          </div>
          
          <!-- Açı Ayarları -->
          <div class="space-y-3">
            <h3 class="text-white font-bold border-b border-gray-700 pb-1">Işık Ayarları</h3>
            
            <div>
              <label class="text-gray-300 block mb-1">Giriş Açısı: {{ Math.round(incidenceAngle) }}°</label>
              <input 
                type="range" 
                v-model.number="incidenceAngle" 
                min="0" 
                max="89" 
                class="w-full bg-gray-700"
              >
            </div>
          </div>
          
          <!-- Prizma Boyutları -->
          <div class="space-y-3">
            <h3 class="text-white font-bold border-b border-gray-700 pb-1">Prizma Boyutları</h3>
            
            <div>
              <label class="text-gray-300 block mb-1">Genişlik: {{ boxWidth }}</label>
              <input 
                type="range" 
                v-model.number="boxWidth" 
                min="5" 
                max="40" 
                class="w-full bg-gray-700"
              >
            </div>
            
            <div>
              <label class="text-gray-300 block mb-1">Yükseklik: {{ boxHeight }}</label>
              <input 
                type="range" 
                v-model.number="boxHeight" 
                min="5" 
                max="20" 
                class="w-full bg-gray-700"
              >
            </div>
            
            <div>
              <label class="text-gray-300 block mb-1">Derinlik: {{ boxDepth }}</label>
              <input 
                type="range" 
                v-model.number="boxDepth" 
                min="5" 
                max="20" 
                class="w-full bg-gray-700"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Kontrol Paneli - Mobile Modal -->
      <div 
        v-if="showSettings" 
        class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center h-screen overflow-y-auto"
        @click.self="showSettings = false"
      >
        <div class="bg-gray-800 p-4 w-full h-full">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-white text-lg font-bold">Ayarlar</h2>
            <button @click="showSettings = false" class="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Settings Panel Content (Same as Desktop) -->
          <div class="space-y-6">
            <!-- Ortam Seçimleri -->
            <div class="space-y-3">
              <h3 class="text-white font-bold border-b border-gray-700 pb-1">Ortam Seçimleri</h3>
              
              <div>
                <label class="text-gray-300 block mb-1">Ortam 1 (dış):</label>
                <select 
                  v-model="selectedMedia1"
                  class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option v-for="(medium, key) in media" :key="`medium1-${key}`" :value="key">
                    {{ medium.name }} (n={{ medium.value.toFixed(2) }})
                  </option>
                </select>
              </div>
              
              <div>
                <label class="text-gray-300 block mb-1">Ortam 2 (iç):</label>
                <select 
                  v-model="selectedMedia2"
                  class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option v-for="(medium, key) in media" :key="`medium2-${key}`" :value="key">
                    {{ medium.name }} (n={{ medium.value.toFixed(2) }})
                  </option>
                </select>
              </div>
            </div>
            
            <!-- Açı Ayarları -->
            <div class="space-y-3">
              <h3 class="text-white font-bold border-b border-gray-700 pb-1">Işık Ayarları</h3>
              
              <div>
                <label class="text-gray-300 block mb-1">Giriş Açısı: {{ Math.round(incidenceAngle) }}°</label>
                <input 
                  type="range" 
                  v-model.number="incidenceAngle" 
                  min="0" 
                  max="89" 
                  class="w-full bg-gray-700"
                >
              </div>
            </div>
            
            <!-- Prizma Boyutları -->
            <div class="space-y-3">
              <h3 class="text-white font-bold border-b border-gray-700 pb-1">Prizma Boyutları</h3>
              
              <div>
                <label class="text-gray-300 block mb-1">Genişlik: {{ boxWidth }}</label>
                <input 
                  type="range" 
                  v-model.number="boxWidth" 
                  min="5" 
                  max="40" 
                  class="w-full bg-gray-700"
                >
              </div>
              
              <div>
                <label class="text-gray-300 block mb-1">Yükseklik: {{ boxHeight }}</label>
                <input 
                  type="range" 
                  v-model.number="boxHeight" 
                  min="5" 
                  max="20" 
                  class="w-full bg-gray-700"
                >
              </div>
              
              <div>
                <label class="text-gray-300 block mb-1">Derinlik: {{ boxDepth }}</label>
                <input 
                  type="range" 
                  v-model.number="boxDepth" 
                  min="5" 
                  max="20" 
                  class="w-full bg-gray-700"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// DOM referansları
const threeContainer = ref(null);

// Simülasyon değişkenleri
const incidenceAngle = ref(30); // Giriş açısı (derece)
const refractionAngle = ref(0); // Kırılma açısı (derece)

// Prizma boyutları
const boxWidth = ref(30);  // x-boyutu
const boxHeight = ref(10); // y-boyutu
const boxDepth = ref(10);  // z-boyutu

// Tasarım değişkenleri
const darkMode = ref(true); // Varsayılan olarak koyu tema
const showSettings = ref(false); // Mobil ayarlar modalı için

// Ortam verileri (kırılma indisleri)
const media = {
  air: { name: 'Hava', value: 1.00, color: 0x8888ff, opacity: 0.1 },
  water: { name: 'Su', value: 1.33, color: 0x0066ff, opacity: 0.5 },
  glass: { name: 'Cam', value: 1.50, color: 0x88aaff, opacity: 0.6 },
  diamond: { name: 'Elmas', value: 2.42, color: 0xaaffff, opacity: 0.7 },
};

// Seçilen ortamlar
const selectedMedia1 = ref('air'); // Dış ortam
const selectedMedia2 = ref('glass'); // İç ortam

// Tam yansıma durumu hesaplanması
const isTotalInternalReflection = computed(() => {
  const n1 = media[selectedMedia1.value].value;
  const n2 = media[selectedMedia2.value].value;
  
  // Işık yoğun ortamdan seyrek ortama geçerken
  if (n1 > n2) {
    const criticalAngle = Math.asin(n2 / n1) * 180 / Math.PI;
    return incidenceAngle.value > criticalAngle;
  }
  
  return false;
});

// Three.js değişkenleri
let scene, camera, renderer, controls;
let environment, lightSource;
let rayGroup;

// Three.js simülasyonunu başlat
onMounted(() => {
  initThreeJS();
  animate();
  
  // Pencere boyutu değiştiğinde yeniden boyutlandır
  window.addEventListener('resize', onWindowResize);
  
  // Ekran boyutuna göre showSettings değerini ayarla
  updateSettingsVisibility();
  // Pencere boyutu değiştiğinde showSettings değerini güncelle
  window.addEventListener('resize', updateSettingsVisibility);
});

// Komponenti kaldırmadan önce temizleme
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('resize', updateSettingsVisibility);
  
  if (renderer) {
    renderer.dispose();
  }
  
  if (controls) {
    controls.dispose();
  }
});

// Three.js simülasyonunun kurulumu
const initThreeJS = () => {
  const width = threeContainer.value.clientWidth;
  const height = threeContainer.value.clientHeight;
  
  // Sahne
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1e2f);
  
  // Kamera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 10, 20);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);
  
  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);
  
  // Zemin, tavan ve duvarlar
  createRoom();
  
  // Ortam (dikdörtgen prizma)
  createEnvironment();
  
  // Işık kaynağı
  createLightSource();
  
  // Işık ışınları
  createRays();
};

// Oda (zemin, tavan, duvarlar) oluşturma - daha saydam
const createRoom = () => {
  const roomSize = 50;
  const wallColor = scene.background;
  
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: wallColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0  // Daha saydam duvarlar
  });
  
  // Zemin
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -roomSize / 4;
  scene.add(floor);
  
  // Tavan
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = roomSize / 4;
  scene.add(ceiling);
  
  // Arka duvar
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    wallMaterial
  );
  backWall.position.z = -roomSize / 4;
  scene.add(backWall);
};

// Ortam (dikdörtgen prizma) oluşturma
const createEnvironment = () => {
  // Eski ortamı kaldır
  if (environment) {
    scene.remove(environment);
  }
  
  const medium = media[selectedMedia2.value];
  
  const material = new THREE.MeshPhysicalMaterial({
    color: medium.color,
    transparent: true,
    opacity: medium.opacity,
    side: THREE.DoubleSide,
    refractionRatio: 1 / medium.value,
    envMapIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  });
  
  // Kullanıcı tarafından ayarlanabilen dikdörtgen prizma boyutları
  const geometry = new THREE.BoxGeometry(boxWidth.value, boxHeight.value, boxDepth.value);
  environment = new THREE.Mesh(geometry, material);
  
  scene.add(environment);
};

// Işık kaynağı oluşturma
const createLightSource = () => {
  // Eski ışık kaynağını kaldır
  if (lightSource) {
    scene.remove(lightSource);
  }
  
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  
  lightSource = new THREE.Mesh(geometry, material);
  // Işık kaynağını ortamın üstüne konumlandır
  lightSource.position.set(0, 10, 0);
  
  scene.add(lightSource);
};

// Işık ışınları oluşturma
const createRays = () => {
  // Eski ışınları kaldır
  if (rayGroup) {
    scene.remove(rayGroup);
  }
  
  rayGroup = new THREE.Group();
  
  updateRays();
  
  scene.add(rayGroup);
};

// Işık ışınlarını güncelleme
const updateRays = () => {
  // Işınları temizle
  while (rayGroup.children.length > 0) {
    rayGroup.remove(rayGroup.children[0]);
  }
  
  // Ortam kırılma indisleri
  const n1 = media[selectedMedia1.value].value;
  const n2 = media[selectedMedia2.value].value;
  
  // Ana ışını oluştur (tekli ışın)
  createSingleRay(n1, n2, 0xff0000); // Kırmızı ışın
};

// Tek bir ışın oluşturma
const createSingleRay = (n1, n2, color) => {
  // Açıları radyana çevir
  const incidenceRad = incidenceAngle.value * Math.PI / 180;
  
  // Işın başlangıç noktası (ışık kaynağından)
  const startPoint = new THREE.Vector3(0, 10, 0);
  
  // Prizma üst yüzeyinin y koordinatı (ortam yüksekliğinin yarısı kadar yukarıda)
  const topY = boxHeight.value / 2;
  
  // Dikdörtgen prizma için çarpma noktası hesaplama (üst yüzey)
  // Giriş açısına göre x pozisyonunu hesapla
  const hitPointX = Math.tan(incidenceRad) * (10 - topY);
  const hitPoint = new THREE.Vector3(hitPointX, topY, 0);
  
  // Normal vektör - dikdörtgen prizma yüzeyinden dışarı doğru (yukarı)
  // Bu normali değiştirmeyelim, fiziksel olarak doğru yönde
  const normal = new THREE.Vector3(0, 1, 0);
  
  // Gelen ışın yönü - yukarıdan aşağıya doğru
  const incidentRay = new THREE.Vector3()
    .subVectors(hitPoint, startPoint)
    .normalize();
  
  // Gelen ışının normal ile yapmış olduğu açı (derece cinsinden)
  const incidenceAngleRad = Math.acos(Math.abs(normal.dot(incidentRay))) || 0;
  const incidenceAngleDeg = incidenceAngleRad * 180 / Math.PI;
  
  // Bu açıyı UI için ayarla
  incidenceAngle.value = incidenceAngleDeg;
  
  // Normal için gösterim çizgileri - çarpma noktasından dışarı ve içeri
  const normalLength = 15;
  
  // Normal çizgisinin bitiş noktası - yukarı doğru (normal yönünde)
  const normalEndUp = new THREE.Vector3()
    .copy(hitPoint)
    .add(normal.clone().multiplyScalar(normalLength));
  
  // Normal çizgisinin bitiş noktası - aşağı doğru (normal yönünün tersi)
  const normalEndDown = new THREE.Vector3()
    .copy(hitPoint)
    .add(normal.clone().multiplyScalar(-normalLength));
  
  // Snell yasasını uygula: n₁ * sin(θ₁) = n₂ * sin(θ₂)
  // θ₁: Giriş açısı, θ₂: Kırılma açısı
  const sinTheta1 = Math.sin(incidenceAngleRad);
  const sinTheta2 = (n1 / n2) * sinTheta1;
  
  // Tam yansıma kontrolü (kritik açı kontrolü)
  const isTIR = Math.abs(sinTheta2) > 1.0;
  
  let outRay = new THREE.Vector3();
  let outRayLength = 15;
  
  if (isTIR) {
    // Tam yansıma durumu (Total Internal Reflection)
    // Yansıma yönünü hesapla
    outRay = reflect(incidentRay, normal);
    outRayLength = 15; // Yansıyan ışın daha uzun olabilir
  } else {
    // Kırılma durumu
    const theta2 = Math.asin(sinTheta2);
    
    // Kırılma açısını kaydet ve göster
    refractionAngle.value = theta2 * 180 / Math.PI;
    
    // Kırılma yönünü doğru bir şekilde hesapla
    outRay = refract(incidentRay, normal, n1, n2);
    
    // Kırılan ışının uzunluğu, ortamın içinde kalacak şekilde ayarla
    outRayLength = boxHeight.value / 2.5;
  }
  
  // Çıkış ışınının bitiş noktası
  const outRayEnd = new THREE.Vector3()
    .copy(hitPoint)
    .add(outRay.clone().multiplyScalar(outRayLength));
  
  // Geometriler ve materyaller
  
  // Normal çizgisi için geometri - yukarı
  const normalGeomUp = new THREE.BufferGeometry().setFromPoints([
    hitPoint, normalEndUp
  ]);
  
  // Normal çizgisi için geometri - aşağı
  const normalGeomDown = new THREE.BufferGeometry().setFromPoints([
    hitPoint, normalEndDown
  ]);
  
  // Normal çizgisi için kesikli çizgi materyali
  const normalMaterial = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.5,
    gapSize: 0.3,
    linewidth: 1,
    opacity: 0.7,
    transparent: true
  });
  
  // Gelen ışın için geometri
  const inRayGeom = new THREE.BufferGeometry().setFromPoints([
    startPoint, hitPoint
  ]);
  
  // Çıkan ışın için geometri
  const outRayGeom = new THREE.BufferGeometry().setFromPoints([
    hitPoint, outRayEnd
  ]);
  
  // Normal çizgileri oluştur
  const normalLineUp = new THREE.Line(normalGeomUp, normalMaterial.clone());
  normalLineUp.computeLineDistances();
  
  const normalLineDown = new THREE.Line(normalGeomDown, normalMaterial.clone());
  normalLineDown.computeLineDistances();
  
  // Işın kalınlığı için tüp oluşturma
  const tubeRadius = 0.1;
  
  // Gelen ışın için tüp
  const inPath = new THREE.CatmullRomCurve3([startPoint, hitPoint]);
  const inTubeGeom = new THREE.TubeGeometry(inPath, 16, tubeRadius, 8, false);
  const inTube = new THREE.Mesh(
    inTubeGeom,
    new THREE.MeshBasicMaterial({ color })
  );
  
  // Çıkan ışın için tüp
  const outPath = new THREE.CatmullRomCurve3([hitPoint, outRayEnd]);
  const outTubeGeom = new THREE.TubeGeometry(outPath, 16, tubeRadius, 8, false);
  const outTube = new THREE.Mesh(
    outTubeGeom,
    new THREE.MeshBasicMaterial({ color })
  );
  
  // Işınları ve normalleri sahneye ekle
  rayGroup.add(inTube);         // Gelen ışın 
  rayGroup.add(outTube);        // Çıkan ışın (kırılan veya yansıyan)
  rayGroup.add(normalLineUp);   // Yukarı doğru normal
  rayGroup.add(normalLineDown); // Aşağı doğru normal
};

// Yansıma vektörünü hesapla (reflection)
function reflect(incident, normal) {
  // r = i - 2(i·n)n   (i: gelen ışın, n: normal, r: yansıyan ışın)
  return incident.clone().sub(
    normal.clone().multiplyScalar(2 * incident.dot(normal))
  );
}

// Kırılma vektörünü hesapla (refraction) - Snell yasasına göre
function refract(incident, normal, n1, n2) {
  // η = n1/n2 (kırılma indisleri oranı)
  const eta = n1 / n2;
  
  // Gelen ışın ile normal arasındaki açının kosinüsü (mutlak değer)
  const cosI = -incident.dot(normal);
  
  // Normalin işaretini belirle
  // cosI > 0 ise ışık yüzeye dışarıdan geliyor
  const normSign = cosI > 0 ? 1.0 : -1.0;
  const adjustedNormal = normal.clone().multiplyScalar(normSign);
  
  // Kırılma açısının sinüsü (Snell yasası)
  const sinT2 = eta * eta * (1.0 - cosI * cosI);
  
  // Tam yansıma durumu (Total Internal Reflection)
  if (sinT2 > 1.0) {
    return reflect(incident, normal);
  }
  
  // Kırılma açısının kosinüsü
  const cosT = Math.sqrt(1.0 - sinT2);
  
  // Kırılan ışının yönü
  // r = ηi + (ηcosI - cosT)n
  return incident.clone().multiplyScalar(eta)
    .add(adjustedNormal.multiplyScalar(eta * cosI - cosT));
}

// Pencere boyutu değiştiğinde
const onWindowResize = () => {
  if (!threeContainer.value || !camera || !renderer) return;
  
  const width = threeContainer.value.clientWidth;
  const height = threeContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

// Animasyon döngüsü
const animate = () => {
  requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// Reactive özellikler için değişim izleme
watch([incidenceAngle, selectedMedia1, selectedMedia2, boxWidth, boxHeight, boxDepth], () => {
  // Ortam değiştiğinde
  createEnvironment();
  
  // Işın oluştur/güncelle
  updateRays();
});

// Ekran boyutuna göre ayarlar panelinin görünürlüğünü güncelleme
const updateSettingsVisibility = () => {
  // md breakpoint (768px) üzerindeyse ayarları göster, altındaysa gizle
  showSettings.value = window.innerWidth >= 768;
};
</script>
  