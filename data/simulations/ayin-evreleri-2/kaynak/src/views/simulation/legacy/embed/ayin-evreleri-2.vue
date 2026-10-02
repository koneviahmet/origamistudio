<template>
  <div class="flex flex-col h-screen bg-gray-900 relative overflow-auto">
    <!-- Mobil Ayarlar Butonu -->
    <div class="md:hidden absolute top-4 left-4 z-10">
      <button 
        @click="isSettingsOpen = !isSettingsOpen"
        class="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Başlat/Durdur Butonu -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">

      <button 
        @click="toggleSimulation" 
        class="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center"
      >
        <span class="flex items-center" v-if="!isRunning">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          <p>Başlat</p>
        </span>
        <span class="flex items-center" v-else>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clip-rule="evenodd" />
          </svg>
          <p>Durdur</p>
        </span>
      </button>
    </div>

    <div class="mb-4 w-full absolute bottom-12 left-1/2 transform -translate-x-1/2 z-50 block md:hidden">
        <div class="grid grid-cols-3 gap-2">
          <button 
            @click="setView('earth')" 
            class="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded transition text-sm"
          >
            Dünya
          </button>
          <button 
            @click="setView('space')" 
            class="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded transition text-sm"
          >
            Uzay
          </button>

          <button 
            @click="setView('sun')" 
            class="py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded transition text-sm"
          >
            Güneş
          </button>

        </div>
      </div>
    
    <!-- Simülasyon ve Kontrol Paneli -->
    <div class="flex flex-col md:flex-row flex-grow">
      <!-- Simülasyon Alanı -->
      <div class="flex-grow relative">
        <div id="simulation-container" class="w-full h-screen md:h-[calc(100vh-2rem)] min-h-[500px]"></div>
        
        <!-- Gözlemci Görüş Çizgisi Açıklaması -->
        <div class="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 p-2 rounded text-white text-sm">
          <div class="flex items-center">
            <div class="w-4 h-0.5 bg-green-400 mr-2"></div>
            <span>Gözlemci Görüş Çizgisi</span>
          </div>
        </div>
      </div>
      
      <!-- Kontrol Paneli -->
      <div 
        :class="[
          'fixed md:relative inset-y-0 right-0 w-full md:w-80 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-40',
          isSettingsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        ]"
      >
        <div class="p-4 h-full overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <button 
              @click="isSettingsOpen = false"
              class="md:hidden p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
                  
          <!-- Bakış Açısı Kontrolü -->
          <div class="mb-4">
            <label class="block mb-2 text-sm font-medium">Bakış Açısı</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                @click="setView('earth')" 
                class="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded transition text-sm"
              >
                Dünya
              </button>
              <button 
                @click="setView('space')" 
                class="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded transition text-sm"
              >
                Uzay
              </button>
              <button 
                @click="setView('sun')" 
                class="py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded transition text-sm"
              >
                Güneş
              </button>
              <button 
                @click="resetView" 
                class="py-2 px-4 mr-2 bg-red-600 hover:bg-red-700 rounded transition text-sm col-span-4"
              >
                Görünümü Sıfırla
              </button>
            </div>
          </div>
          

          
          <!-- Bilgi Metni -->
          <div class="p-3 bg-gray-700 rounded">
            <p class="text-sm">
              <strong>Dikkat:</strong> Görüş açınızı değiştirerek Ay'ın evrelerini görebilirsiniz.
            </p>
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

// Kontrol değişkenleri
const isRunning = ref(true);
const moonOrbitSpeedValue = ref(0.005); // Ay'ın Dünya etrafındaki dönüş hızı
const moonRotationSpeedValue = ref(0.005); // Ay'ın kendi ekseni etrafındaki dönüş hızı
const currentView = ref('space');
const isSettingsOpen = ref(false);

// Dönüş süreleri (animasyon kareleri cinsinden)
const orbitPeriodText = computed(() => {
  const frames = Math.round(2 * Math.PI / moonOrbitSpeedValue.value);
  return `${frames} kare (${(frames / 60).toFixed(1)} saniye)`;
});

const rotationPeriodText = computed(() => {
  const frames = Math.round(2 * Math.PI / moonRotationSpeedValue.value);
  return `${frames} kare (${(frames / 60).toFixed(1)} saniye)`;
});

// Three.js değişkenleri
let scene, camera, renderer, controls;
let earth, moon, sun, observer, observerLine;
let moonOrbitGroup, moonRotationGroup;
let animationFrameId = null;
let container = null;

// Dönüş hızlarını senkronize et
const synchronizeRotation = () => {
  // İki dönüş hızını da aynı değere ayarla
  moonRotationSpeedValue.value = moonOrbitSpeedValue.value;
};

// Simülasyonu başlat/durdur
const toggleSimulation = () => {
  isRunning.value = !isRunning.value;
  if (isRunning.value && !animationFrameId) {
    animate();
  }
};

// Bakış açısını değiştir
const setView = (view) => {
  currentView.value = view;
  
  const isMobile = window.innerWidth < 768;
  
  switch(view) {
    case 'earth':
      // Dünya üzerindeki gözlemciden bakış
      const observerWorldPos = new THREE.Vector3();
      observer.getWorldPosition(observerWorldPos);
      camera.position.copy(observerWorldPos);
      
      const moonWorldPos = new THREE.Vector3();
      moon.getWorldPosition(moonWorldPos);
      
      // Kamerayı ay'a doğru yönlendir
      camera.lookAt(moonWorldPos);
      
      // Kamera görüş açısını ayarla
      camera.fov = 25; // Dar bir görüş açısı
      camera.updateProjectionMatrix();
      
      controls.enabled = false;
      break;
    case 'space':
      // Uzaydan bakış
      if (isMobile) {
        camera.position.set(15, 8, 15);
      } else {
        camera.position.set(12, 8, 12);
      }
      camera.lookAt(0, 0, 0);
      camera.fov = 45; // Normal görüş açısı
      camera.updateProjectionMatrix();
      controls.enabled = true;
      break;
    case 'top':
      // Sistemin üstünden bakış
      if (isMobile) {
        camera.position.set(0, 15, 0);
      } else {
        camera.position.set(0, 12, 0);
      }
      camera.lookAt(0, 0, 0);
      camera.fov = 45;
      camera.updateProjectionMatrix();
      controls.enabled = true;
      break;
    case 'sun':
      // Güneşten bakış
      if (isMobile) {
        camera.position.set(-12, 5, 0);
      } else {
        camera.position.set(-10, 4, 0);
      }
      camera.lookAt(0, 0, 0);
      camera.fov = 40;
      camera.updateProjectionMatrix();
      controls.enabled = true;
      break;
  }
};

// Görünümü resetle
const resetView = () => {
  setView('space');
  moonOrbitSpeedValue.value = 0.005;
  moonRotationSpeedValue.value = 0.005;
  isRunning.value = false;
};

// Arka planı değiştir
const changeBackground = (type) => {
  if (!scene) return;
  
  switch(type) {
    case 'dark':
      scene.background = new THREE.Color(0x0a0a14);
      break;
    case 'blue':
      scene.background = new THREE.Color(0x0a1a2a);
      break;
    case 'purple':
      scene.background = new THREE.Color(0x1a0a2a);
      break;
    case 'space':
      scene.background = new THREE.Color(0x000000);
      break;
  }
};

// Three.js kurulumu
const initThree = () => {
  container = document.getElementById('simulation-container');
  
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a14); // Koyu uzay arka planı
  
  // Kamera ayarları
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  
  // Mobil cihaz kontrolü
  const isMobile = window.innerWidth < 768;
  
  // Kamera pozisyonunu cihaza göre ayarla
  if (isMobile) {
    camera.position.set(15, 8, 15); // Mobil için daha uzak pozisyon
  } else {
    camera.position.set(12, 8, 12); // Desktop için optimize edilmiş pozisyon
  }
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performans için pixel ratio sınırla
  container.appendChild(renderer.domElement);
  
  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Mobil ve PC cihazlar için orbit controls ayarları
  if (isMobile) {
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 25;
  } else {
    controls.minDistance = 3;
    controls.maxDistance = 20;
  }
  
  // Aydınlatma ekle
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(-10, 5, 0); // Güneş yönünden gelen ışık
  scene.add(directionalLight);
  
  createSimulationObjects();
  createRoom();
  
  // Pencere boyutu değişince güncelle
  window.addEventListener('resize', onWindowResize);
  
  // İlk bakış açısını ayarla
  setView('space');
  
  // Animasyonu başlat
  animate();
};

// Simülasyon nesnelerini oluştur
const createSimulationObjects = () => {
  // Mobil cihaz kontrolü
  const isMobile = window.innerWidth < 768;
  
  // Dünya ve Ay'ın mesafesi
  const orbitDistance = isMobile ? 4 : 5;
  
  // Güneş
  const sunGeometry = new THREE.SphereGeometry(1.5, 28, 28);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffcc00,
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(-10, 0, 0); // Güneşi daha yakın bir konuma yerleştir
  scene.add(sun);
  
  // Güneş ışığı
  const sunLight = new THREE.PointLight(0xffddaa, 1.5, 100);
  sun.add(sunLight);
  
  // Dünya
  const earthGeometry = new THREE.SphereGeometry(1, 20, 20);
  const earthMaterial = new THREE.MeshLambertMaterial({ color: 0x4B9CD3 }); // Pastel mavi
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);
  
  // Ay'ın yörünge ve dönüş grupları
  moonOrbitGroup = new THREE.Group(); // Yörünge hareketi için
  scene.add(moonOrbitGroup);
  
  moonRotationGroup = new THREE.Group(); // Kendi ekseni etrafında dönüş için
  moonOrbitGroup.add(moonRotationGroup);
  moonOrbitGroup.position.copy(earth.position);
  
  // Ay
  const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32); // Dünya'nın yaklaşık 1/4'ü
  const moonMaterial = new THREE.MeshLambertMaterial({ color: 0xD9D0C7 }); // Açık gri
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  
  // Ay'ın Dünya'ya bakan yüzünü belirtmek için tekstür efekti
  const faceIndicatorGeometry = new THREE.CircleGeometry(0.1, 16);
  const faceIndicatorMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff3333,
    opacity: 0.5,
    transparent: true
  });
  const faceIndicator = new THREE.Mesh(faceIndicatorGeometry, faceIndicatorMaterial);
  faceIndicator.position.set(0, 0, 0.28);
  faceIndicator.rotation.x = Math.PI / 2;
  
  moonRotationGroup.add(moon);
  moonRotationGroup.add(faceIndicator);
  
  // Ay'ı yerleştir (Dünya'dan uzaklığı)
  moonRotationGroup.position.set(orbitDistance, 0, 0);
  
  // Gözlemci (Dünya üzerinde)
  const observerGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
  const observerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  observer = new THREE.Mesh(observerGeometry, observerMaterial);
  observer.position.set(0, 1.1, 0);
  observer.rotation.x = Math.PI;
  earth.add(observer);
  
  // Gözlemci bakış çizgisi
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const lineGeometry = new THREE.BufferGeometry();
  
  // Başlangıçta boş çizgi, her karede güncellenecek
  lineGeometry.setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0)
  ]);
  
  observerLine = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(observerLine);
  
  // Ay'ın yörüngesini çiz
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitPoints = [];
  
  for (let i = 0; i <= 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(
      orbitDistance * Math.cos(angle),
      0,
      orbitDistance * Math.sin(angle)
    ));
  }
  
  orbitGeometry.setFromPoints(orbitPoints);
  const orbitLine = new THREE.Line(
    orbitGeometry,
    new THREE.LineBasicMaterial({ 
      color: 0x888888,
      opacity: 0.8,
      transparent: true,
      linewidth: 2
    })
  );
  scene.add(orbitLine);
};

// Simülasyon için oda (tavan, taban, duvarlar) oluştur
const createRoom = () => {
  const roomSize = 40; // Daha büyük oda
  const wallThickness = 0.2;
  const wallColor = 0x0a0a14; // Arka plan rengiyle aynı
  
  // Taban
  const floorGeometry = new THREE.BoxGeometry(roomSize, wallThickness, roomSize);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -10, 0);
  scene.add(floor);
  
  // Tavan
  const ceilingGeometry = new THREE.BoxGeometry(roomSize, wallThickness, roomSize);
  const ceilingMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 10, 0);
  scene.add(ceiling);
  
  // Arka duvar
  const backWallGeometry = new THREE.BoxGeometry(roomSize, roomSize, wallThickness);
  const backWallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWall.position.set(0, 0, -roomSize/2);
  scene.add(backWall);
  
  // Ön duvar
  const frontWallGeometry = new THREE.BoxGeometry(roomSize, roomSize, wallThickness);
  const frontWallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const frontWall = new THREE.Mesh(frontWallGeometry, frontWallMaterial);
  frontWall.position.set(0, 0, roomSize/2);
  scene.add(frontWall);
  
  // Sol duvar
  const leftWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize, roomSize);
  const leftWallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
  leftWall.position.set(-roomSize/2, 0, 0);
  scene.add(leftWall);
  
  // Sağ duvar
  const rightWallGeometry = new THREE.BoxGeometry(wallThickness, roomSize, roomSize);
  const rightWallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
  rightWall.position.set(roomSize/2, 0, 0);
  scene.add(rightWall);
};

// Pencere boyutu değiştiğinde güncelle
const onWindowResize = () => {
  if (container && camera && renderer) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const isMobile = width < 768;
    
    // Kamera pozisyonunu güncelle
    if (currentView.value === 'space') {
      if (isMobile) {
        camera.position.set(15, 8, 15);
      } else {
        camera.position.set(12, 8, 12);
      }
    }
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Orbit controls ayarlarını güncelle
    if (controls) {
      controls.minDistance = isMobile ? 5 : 3;
      controls.maxDistance = isMobile ? 25 : 20;
    }
  }
};

// Animasyon döngüsü
const animate = () => {
  if (!isRunning.value) {
    animationFrameId = null;
    return;
  }
  
  animationFrameId = requestAnimationFrame(animate);
  
  if (controls) controls.update();
  
  if (earth && moonOrbitGroup && moonRotationGroup) {
    // Dünya kendi ekseni etrafında döner (saat yönünün tersine)
    earth.rotation.y += 0.01;
    
    // Ay'ın Dünya etrafındaki hareketi (saat yönünün tersine)
    moonOrbitGroup.rotation.y += moonOrbitSpeedValue.value;
    
    // Ay'ın kendi ekseni etrafındaki dönüşü
    // Artık bağımsız olarak ayarlanabilir
    moonRotationGroup.rotation.y += moonRotationSpeedValue.value;
    
    // Gözlemci çizgisini güncelle
    if (observer && observerLine) {
      // Gözlemcinin dünya üzerindeki konumunu ve ay'ın konumunu al
      const observerWorldPos = new THREE.Vector3();
      observer.getWorldPosition(observerWorldPos);
      
      const moonWorldPos = new THREE.Vector3();
      moon.getWorldPosition(moonWorldPos);
      
      // Çizgiyi güncelle
      observerLine.geometry.dispose();
      observerLine.geometry = new THREE.BufferGeometry().setFromPoints([
        observerWorldPos,
        moonWorldPos
      ]);
    }
    
    // Eğer bakış açısı "earth" ise, kamerayı gözlemciye sabitleyelim
    if (currentView.value === 'earth') {
      const observerWorldPos = new THREE.Vector3();
      observer.getWorldPosition(observerWorldPos);
      camera.position.copy(observerWorldPos);
      
      const moonWorldPos = new THREE.Vector3();
      moon.getWorldPosition(moonWorldPos);
      
      // Ay'a bakış yönünü güncelleyelim
      camera.lookAt(moonWorldPos);
    }
  }
  
  renderer.render(scene, camera);
};

// Bileşen yüklendiğinde Three.js kurulumunu başlat
onMounted(() => {
  initThree();
});

// Bileşen kaldırılmadan önce temizlik işlemleri
onBeforeUnmount(() => {
  isRunning.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
  if (controls) {
    controls.dispose();
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // DOM'dan canvas'ı kaldır
  if (container && renderer) {
    container.removeChild(renderer.domElement);
  }
});
</script>
  
 
 