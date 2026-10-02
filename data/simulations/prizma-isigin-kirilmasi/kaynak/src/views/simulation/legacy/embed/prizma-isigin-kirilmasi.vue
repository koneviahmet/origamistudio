<template>
  <div class="w-full h-screen bg-gray-900 flex flex-col md:flex-row">
    <!-- Simülasyon Alanı -->
    <div class="w-full md:w-3/4 flex-grow relative" ref="container">
      <!-- Three.js buraya render edilecek -->
      
      <!-- Animasyon Kontrolleri - Mobil ve Masaüstü -->
      <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
        <button 
          v-if="!isAnimating" 
          @click="startAnimation" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 transition-colors"
        >
          Başlat
        </button>
        <button 
          v-else 
          @click="stopAnimation" 
          class="px-4 py-2 bg-red-600 text-white rounded-md shadow-lg hover:bg-red-700 transition-colors"
        >
          Durdur
        </button>
      </div>
      
      <!-- Mobil Ayarlar Butonu -->
      <button 
        @click="showMobileSettings = !showMobileSettings" 
        class="md:hidden absolute top-4 left-4 z-10 p-2 bg-gray-800 text-white rounded-md shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
    
    <!-- Mobil Ayarlar Modal -->
    <div 
      v-if="showMobileSettings" 
      class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4"
      @click.self="showMobileSettings = false"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-sm max-h-[66vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Simülasyon Ayarları</h2>
          <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Mobil Ayarlar İçeriği -->
        <div class="space-y-6">
          <!-- Kırılma İndisi Ayarı -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Kırılma İndisi: {{ refractiveIndex.toFixed(2) }}
            </label>
            <input 
              type="range" 
              v-model="refractiveIndex" 
              min="1.0" 
              max="2.5" 
              step="0.01"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <!-- Geliş Açısı Ayarı -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Geliş Açısı: {{ incidentAngle }}°
            </label>
            <input 
              type="range" 
              v-model="incidentAngle" 
              min="-45" 
              max="45" 
              step="1"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <!-- Kamera Görünüm Kontrolleri -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Kamera Görünümü</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="setCameraView('front')" 
                class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                Önden Görünüm
              </button>
              <button 
                @click="setCameraView('side')" 
                class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                Yandan Görünüm
              </button>
              <button 
                @click="setCameraView('top')" 
                class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                Üstten Görünüm
              </button>
              <button 
                @click="setCameraView('isometric')" 
                class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                İzometrik Görünüm
              </button>
              <button 
                @click="resetCameraView()" 
                class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm col-span-2"
              >
                Görünümü Sıfırla
              </button>
            </div>
          </div>
          
          <!-- Arkaplan Rengi Ayarları -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Arkaplan Rengi</label>
            <div class="grid grid-cols-4 gap-2">
              <button 
                @click="setBackgroundColor('dark')" 
                class="w-full h-8 bg-gray-900 rounded border border-gray-700 hover:border-white"
              ></button>
              <button 
                @click="setBackgroundColor('blue')" 
                class="w-full h-8 bg-indigo-900 rounded border border-gray-700 hover:border-white"
              ></button>
              <button 
                @click="setBackgroundColor('purple')" 
                class="w-full h-8 bg-purple-900 rounded border border-gray-700 hover:border-white"
              ></button>
              <button 
                @click="setBackgroundColor('green')" 
                class="w-full h-8 bg-green-900 rounded border border-gray-700 hover:border-white"
              ></button>
            </div>
          </div>
          
          <!-- Ayarları Sıfırla Butonu -->
          <div v-if="isSettingsChanged">
            <button 
              @click="resetSettings" 
              class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Ayarları Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Masaüstü Ayarlar Paneli -->
    <div class="hidden md:block w-1/4 bg-gray-800 p-6 overflow-y-auto" style="max-height: 100vh;">
      <h2 class="text-xl font-bold text-white mb-6">Simülasyon Ayarları</h2>
      
      <div class="space-y-6">
        <!-- Kırılma İndisi Ayarı -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">
            Kırılma İndisi: {{ refractiveIndex.toFixed(2) }}
          </label>
          <input 
            type="range" 
            v-model="refractiveIndex" 
            min="1.0" 
            max="2.5" 
            step="0.01"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Geliş Açısı Ayarı -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">
            Geliş Açısı: {{ incidentAngle }}°
          </label>
          <input 
            type="range" 
            v-model="incidentAngle" 
            min="-45" 
            max="45" 
            step="1"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Kamera Görünüm Kontrolleri -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Kamera Görünümü</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="setCameraView('front')" 
              class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              Önden Görünüm
            </button>
            <button 
              @click="setCameraView('side')" 
              class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              Yandan Görünüm
            </button>
            <button 
              @click="setCameraView('top')" 
              class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              Üstten Görünüm
            </button>
            <button 
              @click="setCameraView('isometric')" 
              class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              İzometrik Görünüm
            </button>
            <button 
              @click="resetCameraView()" 
              class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm col-span-2"
            >
              Görünümü Sıfırla
            </button>
          </div>
        </div>
        
        <!-- Arkaplan Rengi Ayarları -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Arkaplan Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              @click="setBackgroundColor('dark')" 
              class="w-full h-8 bg-gray-900 rounded border border-gray-700 hover:border-white"
            ></button>
            <button 
              @click="setBackgroundColor('blue')" 
              class="w-full h-8 bg-indigo-900 rounded border border-gray-700 hover:border-white"
            ></button>
            <button 
              @click="setBackgroundColor('purple')" 
              class="w-full h-8 bg-purple-900 rounded border border-gray-700 hover:border-white"
            ></button>
            <button 
              @click="setBackgroundColor('green')" 
              class="w-full h-8 bg-green-900 rounded border border-gray-700 hover:border-white"
            ></button>
          </div>
        </div>
        
        <!-- Ayarları Sıfırla Butonu -->
        <div v-if="isSettingsChanged">
          <button 
            @click="resetSettings" 
            class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
    
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// DOM referansı ve kontrol değişkenleri
const container = ref(null);
const refractiveIndex = ref(1.5); // Varsayılan değer 1.5 olarak ayarlandı
const incidentAngle = ref(0); // Varsayılan değer 0 derece olarak ayarlandı
const isAnimating = ref(false); // Animasyon durumu
const showMobileSettings = ref(false); // Mobil ayarlar modalı görünürlüğü

// Varsayılan değerler (ayarları sıfırlamak için)
const defaultRefractiveIndex = 1.5;
const defaultIncidentAngle = 0;
const defaultBackgroundColor = new THREE.Color(0x111122);

// Ayarların değişip değişmediğini kontrol et
const isSettingsChanged = computed(() => {
  return refractiveIndex.value !== defaultRefractiveIndex || 
         incidentAngle.value !== defaultIncidentAngle ||
         (scene && scene.background && !scene.background.equals(defaultBackgroundColor));
});

// Three.js değişkenleri
let scene, camera, renderer, controls;
let prism, lightRay, dispersedRays = [];
let animationFrameId;
let isAutoRotating = false; // Otomatik döndürme durumu

// Animasyon durumları için değişkenler
const animationState = ref('initial'); // 'initial', 'incoming', 'impact', 'dispersing', 'completed'
const animationProgress = ref(0);
const rayAnimationDuration = 2000; // ms cinsinden animasyon süresi
const impactAnimationDuration = 500; // ms cinsinden çarpışma animasyonu süresi

// Renk değerlerini dalga boylarına göre tanımlama (kırmızıdan mora)
const colors = [
  new THREE.Color(0xff0000), // Kırmızı
  new THREE.Color(0xff7f00), // Turuncu
  new THREE.Color(0xffff00), // Sarı
  new THREE.Color(0x00ff00), // Yeşil
  new THREE.Color(0x0000ff), // Mavi
  new THREE.Color(0x4b0082), // İndigo
  new THREE.Color(0x9400d3), // Mor
];

// Sahne kurulumu
const setupScene = () => {
  // container ref'in hazır olup olmadığını kontrol et
  if (!container.value) {
    console.error('Container referansı bulunamadı!');
    return;
  }

  // Sahne, kamera ve renderer oluşturma
  scene = new THREE.Scene();
  scene.background = defaultBackgroundColor.clone(); // Varsayılan arka plan
  
  // Perspektif kamera ayarları
  const aspect = container.value.clientWidth / container.value.clientHeight || 2; // Varsayılan değer ekle
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 0, 15); // Kamerayı tam karşıya konumlandır
  camera.lookAt(0, 0, 0);
  
  // Renderer ayarları
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);
  
  // Renderer canvas elementine stil ekle
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  
  // Kontroller ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Daha güçlü ortam ışığı
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Daha güçlü yönlü ışık
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  
  // İkinci bir yönlü ışık ekle (karşı taraftan)
  const secondDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  secondDirectionalLight.position.set(-10, -5, 5);
  scene.add(secondDirectionalLight);
  
  // Duvarlar, tavan ve taban ekle
  addRoomElements();
  
  // Prizma oluştur
  createPrism();
  
  // Işık ışınlarını oluştur
  createLightRays();
  
  // Pencere boyutu değişimini izle
  window.addEventListener('resize', onWindowResize);
  
  // İlk render
  renderer.render(scene, camera);
};

// Duvarlar, tavan ve taban oluşturma
const addRoomElements = () => {
  const roomColor = new THREE.Color(0x222244); // Daha açık bir renk tonu
  const roomSize = 40;
  const roomDepth = 0.1;
  
  // Taban
  const floorGeometry = new THREE.BoxGeometry(roomSize, roomDepth, roomSize);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: roomColor, 
    transparent: true, 
    opacity: 0.25,
    metalness: 0.3,
    roughness: 0.7
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -5;
  scene.add(floor);
  
  // Tavan
  const ceilingGeometry = new THREE.BoxGeometry(roomSize, roomDepth, roomSize);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    color: roomColor, 
    transparent: true, 
    opacity: 0.25,
    metalness: 0.3,
    roughness: 0.7 
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.y = 5;
  scene.add(ceiling);
  
  // Arka duvar
  const backWallGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomDepth);
  const backWallMaterial = new THREE.MeshStandardMaterial({ 
    color: roomColor, 
    transparent: true, 
    opacity: 0.25,
    metalness: 0.3,
    roughness: 0.7
  });
  const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWall.position.z = -roomSize/2;
  scene.add(backWall);
  
  // Sol duvar
  const leftWallGeometry = new THREE.BoxGeometry(roomDepth, roomSize, roomSize);
  const leftWallMaterial = new THREE.MeshStandardMaterial({ 
    color: roomColor, 
    transparent: true, 
    opacity: 0.25,
    metalness: 0.3,
    roughness: 0.7
  });
  const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
  leftWall.position.x = -roomSize/2;
  scene.add(leftWall);
  
  // Sağ duvar
  const rightWallGeometry = new THREE.BoxGeometry(roomDepth, roomSize, roomSize);
  const rightWallMaterial = new THREE.MeshStandardMaterial({ 
    color: roomColor, 
    transparent: true, 
    opacity: 0.25,
    metalness: 0.3,
    roughness: 0.7
  });
  const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
  rightWall.position.x = roomSize/2;
  scene.add(rightWall);
  
  // Zemine grid ekleyelim
  const gridHelper = new THREE.GridHelper(roomSize, 20, 0x444466, 0x222244);
  gridHelper.position.y = -5;
  scene.add(gridHelper);
};

// Prizma oluşturma
const createPrism = () => {
  // Önceki prizmayı temizle
  if (prism) scene.remove(prism);
  
  // Düzgün bir üçgen prizma oluştur (eşkenar üçgen prizma)
  const prismGeometry = new THREE.CylinderGeometry(0, 2, 3, 3);
  prismGeometry.rotateX(Math.PI*2); // Prizmayı yatay konuma çevir
  prismGeometry.rotateZ(0); // Prizmayı açı olmadan düz olarak konumlandır
  
  // Prizma materyali
  const prismMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.95,  // Daha şeffaf
    roughness: 0.03,     // Daha pürüzsüz
    thickness: 0.5,      // Kalınlık
    ior: refractiveIndex.value, // Kırılma indisi
    transparent: true,
    side: THREE.DoubleSide, // Çift taraflı render
    envMapIntensity: 1.5,   // Çevre yansıma yoğunluğu
    clearcoat: 0.5,        // Daha parlak yüzey
    clearcoatRoughness: 0.1 // Parlak yüzey pürüzsüzlüğü
  });
  
  // Prizma mesh'i oluştur
  prism = new THREE.Mesh(prismGeometry, prismMaterial);
  prism.position.set(0, 0, 0); // Merkeze yerleştir
  scene.add(prism);
  
  // Prizma etrafında hafif bir ışık halkası ekle
  const ringGeometry = new THREE.TorusGeometry(2.3, 0.05, 16, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x88aaff, 
    transparent: true, 
    opacity: 0.1 
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  dispersedRays.push(ring); // Temizleme listesine ekle
};

// Işık ışınlarını oluşturma
const createLightRays = () => {
  // Önceki ışınları temizle
  if (lightRay) scene.remove(lightRay);
  dispersedRays.forEach(ray => scene.remove(ray));
  dispersedRays = [];
  
  // Radyan cinsinden açı hesaplama (0 derece = yatay)
  const angleRad = (incidentAngle.value * Math.PI) / 180;
  
  // Işın başlangıç noktası (sol taraftan orta noktaya doğru)
  const startPoint = new THREE.Vector3(-10, 0, 0);
  const direction = new THREE.Vector3(
    Math.cos(angleRad),
    -Math.sin(angleRad),
    0
  ).normalize();
  
  // Prizma ile kesişim noktası
  const prismLeftSide = -0.6; 
  const distToIntersection = (prismLeftSide - startPoint.x) / direction.x;
  const intersectionPoint = new THREE.Vector3().copy(startPoint).add(
    direction.clone().multiplyScalar(distToIntersection)
  );

  // Giriş ışını için kalın çizgi (tube geometrisi kullanarak)
  const rayPath = new THREE.CatmullRomCurve3([
    startPoint,
    intersectionPoint
  ]);
  
  const tubeGeometry = new THREE.TubeGeometry(rayPath, 20, 0.08, 8, false);
  const tubeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0 // Başlangıçta görünmez
  });
  
  lightRay = new THREE.Mesh(tubeGeometry, tubeMaterial);
  scene.add(lightRay);

  // Çarpışma efekti için parlama
  const impactGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const impactMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0
  });
  const impactSphere = new THREE.Mesh(impactGeometry, impactMaterial);
  impactSphere.position.copy(intersectionPoint);
  scene.add(impactSphere);
  dispersedRays.push(impactSphere);

  // Işığın prizmadan çıkış noktası
  const prismRightSide = 0.6;
  const exitBasePoint = new THREE.Vector3(prismRightSide, 0, 0);

  // Dispersiyon ışınları için array
  const dispersedRayMeshes = [];

  // Her renk için kırılan ışınları oluştur
  colors.forEach((color, index) => {
    const exitAngle = Math.PI / 12 + (index * 0.02);
    const refractedDirection = new THREE.Vector3(
      Math.cos(exitAngle),
      Math.sin(exitAngle),
      0
    ).normalize();
    
    const exitPoint = new THREE.Vector3().copy(exitBasePoint).add(
      refractedDirection.clone().multiplyScalar(15)
    );

    // Kırılan ışın için tüp geometrisi
    const refractedPath = new THREE.CatmullRomCurve3([
      exitBasePoint,
      exitPoint
    ]);
    
    const refractedTubeGeometry = new THREE.TubeGeometry(refractedPath, 20, 0.05, 8, false);
    const refractedTubeMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0 // Başlangıçta görünmez
    });
    
    const colorRay = new THREE.Mesh(refractedTubeGeometry, refractedTubeMaterial);
    scene.add(colorRay);
    dispersedRayMeshes.push(colorRay);
    dispersedRays.push(colorRay);

    // Işın bitiminde parlak nokta
    const dotGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: color, 
      emissive: color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(exitPoint);
    scene.add(dot);
    dispersedRays.push(dot);
  });

  return {
    incomingRay: lightRay,
    impactSphere,
    dispersedRays: dispersedRayMeshes
  };
};

// Pencere boyutu değiştiğinde çağrılır
const onWindowResize = () => {
  if (!container.value || !camera || !renderer) return;
  
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
};

// Animasyon döngüsü
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
  // Kontrolleri güncelle
  if (controls) controls.update();
  
  // Otomatik döndürme aktifse prizmayı döndür
  if (isAutoRotating && prism) {
    prism.rotation.y += 0.005;
  }
  
  // Sahneyi render et
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// Animasyon kontrolü
const startAnimation = () => {
  isAnimating.value = true;
  animationState.value = 'incoming';
  animationProgress.value = 0;
  
  const rays = createLightRays();
  
  // Gelen ışın animasyonu
  const animateIncoming = () => {
    if (animationState.value !== 'incoming') return;
    
    const progress = animationProgress.value / rayAnimationDuration;
    rays.incomingRay.material.opacity = progress;
    
    if (progress >= 1) {
      animationState.value = 'impact';
      animationProgress.value = 0;
      return;
    }
    
    animationProgress.value += 16; // ~60fps
    requestAnimationFrame(animateIncoming);
  };
  
  // Çarpışma animasyonu
  const animateImpact = () => {
    if (animationState.value !== 'impact') return;
    
    const progress = animationProgress.value / impactAnimationDuration;
    const impactOpacity = Math.sin(progress * Math.PI);
    rays.impactSphere.material.opacity = impactOpacity;
    rays.impactSphere.scale.setScalar(1 + progress);
    
    if (progress >= 1) {
      animationState.value = 'dispersing';
      animationProgress.value = 0;
      return;
    }
    
    animationProgress.value += 16;
    requestAnimationFrame(animateImpact);
  };
  
  // Kırılan ışınlar animasyonu
  const animateDispersing = () => {
    if (animationState.value !== 'dispersing') return;
    
    const progress = animationProgress.value / rayAnimationDuration;
    rays.dispersedRays.forEach(ray => {
      ray.material.opacity = progress;
    });
    
    if (progress >= 1) {
      animationState.value = 'completed';
      return;
    }
    
    animationProgress.value += 16;
    requestAnimationFrame(animateDispersing);
  };
  
  // Animasyon durumlarını izle
  watch(animationState, (newState) => {
    switch (newState) {
      case 'incoming':
        animateIncoming();
        break;
      case 'impact':
        animateImpact();
        break;
      case 'dispersing':
        animateDispersing();
        break;
    }
  });
  
  // Animasyonu başlat
  animateIncoming();
};

// Animasyonu durdur
const stopAnimation = () => {
  isAnimating.value = false;
  animationState.value = 'initial';
  createLightRays(); // Işınları sıfırla
};

// Kamera görünümünü ayarla
const setCameraView = (viewType) => {
  if (!camera || !controls) return;
  
  // Animasyonu durdur
  stopAnimation();
  
  switch (viewType) {
    case 'front':
      // Önden görünüm
      camera.position.set(0, 0, 15);
      camera.lookAt(0, 0, 0);
      break;
    case 'side':
      // Yandan görünüm
      camera.position.set(15, 0, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'top':
      // Üstten görünüm
      camera.position.set(0, 15, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'isometric':
      // İzometrik görünüm
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      break;
  }
  
  controls.update();
};

// Kamera görünümünü sıfırla
const resetCameraView = () => {
  if (!camera || !controls) return;
  
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0, 0);
  controls.reset();
};

// Arkaplan rengini ayarla
const setBackgroundColor = (colorName) => {
  if (!scene) return;
  
  switch (colorName) {
    case 'dark':
      scene.background = new THREE.Color(0x111122);
      break;
    case 'blue':
      scene.background = new THREE.Color(0x0a1a2f);
      break;
    case 'purple':
      scene.background = new THREE.Color(0x1a0a2f);
      break;
    case 'green':
      scene.background = new THREE.Color(0x0a2f1a);
      break;
  }
};

// Ayarları sıfırla
const resetSettings = () => {
  refractiveIndex.value = defaultRefractiveIndex;
  incidentAngle.value = defaultIncidentAngle;
  scene.background = defaultBackgroundColor.clone();
  resetCameraView();
  stopAnimation();
};

// Değişken değişikliklerini izle
watch([refractiveIndex, incidentAngle], () => {
  if (prism) {
    // Prizma materyalini güncelle
    prism.material.ior = refractiveIndex.value;
    
    // Işınları yeniden oluştur
    createLightRays();
  }
}, { deep: true });

// Bileşen monte edildiğinde
onMounted(() => {
  // Kısa bir gecikme ekleyerek DOM'un tamamen yüklenmesini bekleyelim
  setTimeout(() => {
    setupScene();
    animate();
  }, 100);
});

// Bileşen kaldırılmadan önce
onBeforeUnmount(() => {
  // Animasyonu durdur
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  
  // Event listener'ları temizle
  window.removeEventListener('resize', onWindowResize);
  
  // DOM'dan renderer'ı kaldır
  if (renderer && container.value) {
    try {
      container.value.removeChild(renderer.domElement);
    } catch (e) {
      console.error('Renderer element kaldırılırken hata:', e);
    }
  }
  
  // Belleği temizle
  if (renderer) renderer.dispose();
  if (controls) controls.dispose();
});
</script>

<style scoped>
/* Simülasyon container'ı tam boyuta ulaşsın */
.h-screen {
  height: 100vh;
}

/* Flex-grow için en az yükseklik tanımla */
.flex-grow {
  min-height: 70vh;
}

/* Range input stillerini özelleştir */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  background: #4B5563;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366F1;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366F1;
  cursor: pointer;
}

/* Mobil görünüm için ek stiller */
@media (max-width: 768px) {
  .flex-grow {
    min-height: 85vh;
  }
}
</style>
    
   
   