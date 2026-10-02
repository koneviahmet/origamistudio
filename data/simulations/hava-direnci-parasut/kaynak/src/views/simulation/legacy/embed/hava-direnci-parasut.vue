<template>
  <div class="relative w-full h-screen overflow-hidden bg-gray-900">
    <!-- Simulation canvas -->
    <div ref="canvasContainer" class="w-full h-full"></div>

    <!-- Info display -->
    <div class="absolute md:top-2 top-16 left-2 p-2 bg-gray-800 bg-opacity-75 text-white rounded-md">
      <p>Durum: {{ status }}</p>
      <p>Düşüş Süresi: {{ fallTime.toFixed(2) }} saniye</p>
      <p>Deneme No: {{ denemeNo }}</p>
    </div>

    <!-- Control buttons -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
      <button v-if="!isSimulationRunning" @click="startSimulation" class="md:px-4 md:py-2 p-2 text-xs min-w-max bg-green-600 text-white rounded-md hover:bg-green-700 transition">
        {{ status.includes('Tamamlandı') ? 'Yeni Deneme Başlat' : 'Başlat' }}
      </button>
      <button v-else @click="pauseSimulation" class="md:px-4 md:py-2 p-2 text-xs min-w-max bg-red-600 text-white rounded-md hover:bg-red-700 transition">
        Durdur
      </button>
      <button @click="resetSimulation" class="md:px-4 md:py-2 p-2 text-xs min-w-max bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
        Sıfırla
      </button>
    </div>

    <!-- Results table -->
    <div class="absolute bottom-20 left-4 p-3 hidden md:block bg-gray-800 bg-opacity-90 text-white rounded-md overflow-y-auto max-h-72 md:w-1/3 w-5/6 z-10">
      <h3 class="text-xl font-semibold mb-2">Denemeler Tablosu</h3>
      <table class="w-full text-sm">
        <thead class="bg-gray-700">
          <tr>
            <th class="px-2 py-2 text-left">Deneme No</th>
            <th class="px-2 py-2 text-left">Paraşüt Boyutu</th>
            <th class="px-2 py-2 text-left">Düşüş Süresi (s)</th>
            <th class="px-2 py-2 text-left hidden md:table-cell">Hava Direnci</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, index) in results" :key="index" class="border-t border-gray-700" :class="{'bg-blue-800 bg-opacity-40': index === 0}">
            <td class="px-2 py-2">{{ result.denemeNo || (results.length - index) }}</td>
            <td class="px-2 py-2">{{ Number(result.parachuteSize).toFixed(1) }}</td>
            <td class="px-2 py-2">{{ result.fallTime.toFixed(2) }}</td>
            <td class="px-2 py-2 hidden md:table-cell">{{ result.havaDirecti || '-' }}</td>
          </tr>
          <tr v-if="results.length === 0">
            <td colspan="5" class="px-2 py-3 text-center text-gray-400">Henüz deneme yapılmadı. Başlat butonuna basarak bir deneme yapın.</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Karşılaştırma bilgileri -->
      <div v-if="results.length >= 2" class="mt-3 pt-2 border-t border-gray-700">
        <p class="text-sm text-gray-300 mb-1">💡 Paraşüt boyutu büyüdükçe hava direnci artar ve düşüş süresi uzar.</p>
        
        <div v-if="results.length >= 2" class="mt-2 text-xs text-gray-400">
          <p>Son deneme paraşüt boyutu: <span class="font-bold">{{ Number(results[0].parachuteSize).toFixed(1) }}</span></p>
          <p>Önceki deneme paraşüt boyutu: <span class="font-bold">{{ Number(results[1].parachuteSize).toFixed(1) }}</span></p>
          
          <p class="mt-1">
            Süre Farkı: 
            <span 
              :class="{
                'text-green-400': results[0].fallTime > results[1].fallTime, 
                'text-red-400': results[0].fallTime < results[1].fallTime,
                'text-gray-400': results[0].fallTime === results[1].fallTime
              }"
            >
              {{ (results[0].fallTime - results[1].fallTime).toFixed(2) }} saniye
              {{ results[0].fallTime > results[1].fallTime ? '(daha yavaş düştü)' : results[0].fallTime < results[1].fallTime ? '(daha hızlı düştü)' : '(aynı sürede düştü)' }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Settings panel for desktop -->
    <div class="absolute top-0 right-0 h-full md:w-1/4 w-full md:block hidden bg-gray-800 text-white p-4 overflow-y-auto">
      <h2 class="text-xl font-bold mb-4">Ayarlar</h2>
      
      <div class="mb-4">
        <label for="parachuteSize" class="block mb-2">Paraşüt Boyutu: {{ Number(parachuteSize).toFixed(1) }}</label>
        <input 
          type="range" 
          id="parachuteSize" 
          v-model="parachuteSize" 
          min="0" 
          max="10" 
          step="0.1" 
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        >
      </div>

      <div class="mb-4">
        <label for="animationSpeed" class="block mb-2">Animasyon Hızı: {{ animationSpeed.toFixed(1) }}x</label>
        <input 
          type="range" 
          id="animationSpeed" 
          v-model="animationSpeed" 
          min="0.1" 
          max="3" 
          step="0.1" 
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        >
      </div>

      <button @click="resetSettings" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded">Ayarları Sıfırla</button>
    </div>

    <!-- Mobile settings toggle -->
    <button @click="toggleMobileSettings" class="md:hidden absolute top-4 left-4 z-20 p-2 bg-gray-800 text-white rounded-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Mobile settings panel -->
    <div v-if="showMobileSettings" class="md:hidden fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 text-white p-4 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="toggleMobileSettings" class="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="mb-4">
          <label for="mobilePparachuteSize" class="block mb-2">Paraşüt Boyutu: {{ Number(parachuteSize).toFixed(1) }}</label>
          <input 
            type="range" 
            id="mobilePparachuteSize" 
            v-model="parachuteSize" 
            min="1" 
            max="10" 
            step="0.1" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          >
        </div>

        <div class="mb-4">
          <label for="mobileAnimationSpeed" class="block mb-2">Animasyon Hızı: {{ animationSpeed.toFixed(1) }}x</label>
          <input 
            type="range" 
            id="mobileAnimationSpeed" 
            v-model="animationSpeed" 
            min="0.1" 
            max="3" 
            step="0.1" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          >
        </div>






        <button @click="resetSettings" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded">Ayarları Sıfırla</button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar ve durum değişkenleri
const canvasContainer = ref(null);
const showMobileSettings = ref(false);
const isSimulationRunning = ref(false);
const status = ref('Hazır');
const fallTime = ref(0);
const results = ref([]);
const autoRun = ref(false);
const denemeNo = ref(1);

// Ayarlar
const parachuteSize = ref(5);
const defaultParachuteSize    = 5;
const animationSpeed          = ref(1);
const defaultAnimationSpeed   = 1;
const backgroundColor         = ref('#f3f4f6');
const defaultBackgroundColor  = '#f3f4f6';

// Three.js değişkenleri
let scene, camera, renderer, controls;
let cube, parachute, ground;
let clock, gravity, airResistance;
let cubeVelocity = 0;
let currentHeight = 0;
let startHeight = 0;
let animationFrameId = null;

// Simülasyonu başlat
function startSimulation() {
  if (currentHeight <= 0) {
    // Yeni deneme için hazırlık
    resetCubePosition();
    
    // Eğer önceki deneme tamamlandıysa ve yeni bir deneme başlıyorsa deneme sayısını artır
    if (status.value.includes('Tamamlandı')) {
      denemeNo.value++;
    }
    
    // Düşüş süresini sıfırla
    fallTime.value = 0;
  }
  
  isSimulationRunning.value = true;
  status.value = 'Düşüyor - Deneme #' + denemeNo.value;
  clock.start();
  animate();
}

// Simülasyonu durdur
function pauseSimulation() {
  isSimulationRunning.value = false;
  status.value = 'Durduruldu';
  clock.stop();
  cancelAnimationFrame(animationFrameId);
}

// Simülasyonu sıfırla
function resetSimulation() {
  pauseSimulation();
  resetCubePosition();
  fallTime.value = 0;
  status.value = 'Hazır';
  // Deneme sayacını da sıfırla
  denemeNo.value = 1;
}

// Küpün pozisyonunu sıfırla
function resetCubePosition() {
  if (cube && parachute) {
    currentHeight = startHeight;
    cubeVelocity = 0;
    cube.position.y = currentHeight;
    parachute.position.y = currentHeight + 2;
  }
}

// Ayarları sıfırla
function resetSettings() {
  pauseSimulation();
  parachuteSize.value = defaultParachuteSize;
  animationSpeed.value = defaultAnimationSpeed;
  setBackgroundColor(defaultBackgroundColor);
  setCameraPosition('reset');
  resetCubePosition();
  // Deneme sayacını sıfırla
  denemeNo.value = 1;
  fallTime.value = 0;
  status.value = 'Hazır';
}

// Mobil ayarlar panelini aç/kapa
function toggleMobileSettings() {
  showMobileSettings.value = !showMobileSettings.value;
}

// Arka plan rengini değiştir
function setBackgroundColor(color) {
  backgroundColor.value = color;
  if (scene) {
    scene.background = new THREE.Color(color);
    if (ground) {
      ground.material.color = new THREE.Color(color);
    }
  }
}

// Kamera pozisyonunu ayarla
function setCameraPosition(position) {
  if (!camera) return;
  
  switch (position) {
    case 'front':
      camera.position.set(0, 5, 20);
      break;
    case 'side':
      camera.position.set(20, 5, 0);
      break;
    case 'top':
      camera.position.set(0, 20, 0);
      break;
    case 'isometric':
      camera.position.set(15, 15, 15);
      break;
    case 'reset':
      camera.position.set(10, 5, 10);
      break;
  }
  
  camera.lookAt(0, 5, 0);
  if (controls) {
    controls.update();
  }
}

// Three.js sahnesini başlat
function initThreeJs() {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor.value);
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(
    75,
    canvasContainer.value.clientWidth / canvasContainer.value.clientHeight,
    0.1,
    1000
  );
  camera.position.set(10, 5, 10);
  camera.lookAt(0, 5, 0);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasContainer.value.appendChild(renderer.domElement);
  
  // Orbit kontrollerini ekle
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işık oluştur
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  
  // Zemin oluştur
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: scene.background, 
    side: THREE.DoubleSide 
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);
  
  // Küp oluştur
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x2563eb });
  cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  startHeight = 15;
  currentHeight = startHeight;
  cube.position.y = currentHeight;
  scene.add(cube);
  
  // Paraşüt oluştur
  createParachute();
  
  // Fizik değişkenleri
  gravity = 9.8; // m/s²
  airResistance = 0.1; // Başlangıç değeri
  
  // Süre takibi için saat
  clock = new THREE.Clock();
  
  // Pencere boyutu değiştiğinde renderer'ı güncelle
  window.addEventListener('resize', onWindowResize);
}

// Paraşüt oluştur
function createParachute() {
  if (parachute) {
    scene.remove(parachute);
  }
  
  // Paraşüt geometrisi (koni şeklinde)
  const parachuteGeometry = new THREE.ConeGeometry(
    parachuteSize.value, // Taban yarıçapı
    2, // Yükseklik
    16, // Radyal segmentler
    1, // Yükseklik segmentleri
    true // Açık taban
  );
  
  // Paraşüt materyali
  const parachuteMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide
  });
  
  // Paraşüt mesh oluştur
  parachute = new THREE.Mesh(parachuteGeometry, parachuteMaterial);
  parachute.rotation.x = 0; // Paraşüt rotasyonunu düzelttik, varsayılan rotasyon kullanıyoruz
  parachute.position.y = currentHeight + 2; // Küpün üstünde konumlandır
  
  scene.add(parachute);
  
  // Paraşüt merkez ipini oluştur
  const centerRopeLength = 2; // Merkez ipin uzunluğu
  const ropeGeometry = new THREE.CylinderGeometry(0.03, 0.03, centerRopeLength);
  const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
  rope.position.y = -centerRopeLength/2; // Paraşütün altına merkez ipi yerleştir
  parachute.add(rope);
  
  // Küp ve paraşüt arasında bağlantı ipleri oluştur
  // Paraşüt boyutuna göre iplerin konumunu ayarla
  const parachuteRadius = parachuteSize.value;
  const ropeCount = 0; // Daha fazla ip kullanarak daha gerçekçi görünüm
  const connectorLength = 4 + parachuteRadius * 0.1; // Paraşüt boyutuna göre ip uzunluğu
  
  // İpler için grubun referansını tut (küpteki bağlantı noktaları için)
  const ropeEnds = [];
  
  for (let i = 0; i < ropeCount; i++) {
    const angle = (i / ropeCount) * Math.PI * 2;
    // Paraşüt kenarından ipleri çıkar
    const attachX = Math.cos(angle) * parachuteRadius * 0.4;
    const attachZ = Math.sin(angle) * parachuteRadius * 0.1;
    
    // İpin rengini alternating yap (dönüşümlü olarak açık/koyu)
    const connectorColor = i % 2 === 0 ? 0xe0e0e0 : 0xcccccc;
    
    const connectorGeometry = new THREE.CylinderGeometry(0.015, 0.015, connectorLength);
    const connectorMaterial = new THREE.MeshStandardMaterial({ color: connectorColor });
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    
    // İpleri paraşütün kenarından küpe doğru yönlendir
    connector.position.set(attachX, -connectorLength/2, attachZ);
    
    // İplerin küpe doğru yönelmesini sağla
    // Küpün merkezi olan (0, currentHeight, 0) noktasına doğru yönlendir
    connector.lookAt(new THREE.Vector3(0, -connectorLength, 0));
    
    // Y ekseninde döndürerek iplerin doğru yönde olmasını sağla
    connector.rotateX(Math.PI / 2);
    
    parachute.add(connector);
    
    // İpin küpe bağlanan ucunun pozisyonu
    const ropeEndPos = {
      x: attachX * 0.2, // Küpe doğru yaklaşan ip 
      y: -connectorLength + 1, // İpin alt ucu (küpe yakın)
      z: attachZ * 0.2
    };
    ropeEnds.push(ropeEndPos);
  }
  
  // Paraşüt kubbesi üzerinde dekoratif çizgiler ekle
  const paraDecorCount = 8;
  for (let i = 0; i < paraDecorCount; i++) {
    const angle = (i / paraDecorCount) * Math.PI * 2;
    const lineGeometry = new THREE.CylinderGeometry(0.01, 0.01, parachuteRadius);
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    
    // Çizgileri paraşüt merkezi ile kenarı arasında yerleştir
    line.position.set(0, 0, 0);
    line.rotation.z = Math.PI / 2; // Yatay konumlandır
    line.rotation.y = angle; // Açıya göre döndür
    
    parachute.add(line);
  }
  
  // Paraşüt alt kenarını daha belirgin yap (halka ekle)
  const ringGeometry = new THREE.TorusGeometry(parachuteRadius * 0.8, 0.05, 8, 24);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2; // Halkayı yatay konumlandır
  ring.position.y = -0.5; // Paraşütün alt kenarında
  parachute.add(ring);
  
  // Hava direncini paraşüt boyutuna göre güncelle
  updateAirResistance();
}

// Hava direncini güncelle
function updateAirResistance() {
  // Paraşüt boyutu ile hava direnci arasında doğrusal bir ilişki
  // Boyut arttıkça direnç artar
  airResistance = 0.02 + (parachuteSize.value * 0.03);
}

// Pencere boyutu değiştiğinde
function onWindowResize() {
  if (camera && renderer && canvasContainer.value) {
    camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  }
}

// Animasyon döngüsü
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  if (isSimulationRunning.value) {
    // Zaman geçişini hesapla
    const deltaTime = clock.getDelta() * animationSpeed.value;
    fallTime.value += deltaTime;
    
    // Fizik hesaplamaları (basit Euler integrasyonu)
    // F = mg - kv² (yerçekimi kuvveti - hava direnci)
    const dragForce = airResistance * cubeVelocity * cubeVelocity;
    const netAcceleration = gravity - dragForce;
    
    // v = v₀ + at
    cubeVelocity += netAcceleration * deltaTime;
    
    // s = s₀ + vt
    currentHeight -= cubeVelocity * deltaTime;
    
    // Zemine ulaştıysa
    if (currentHeight <= 0) {
      currentHeight = 0;
      cubeVelocity = 0;
      
      // Tamamlandı durumunu anlık göster
      status.value = 'Tamamlandı';
      
      // Sonuçları kaydet - deneme sayacını burada artırmıyoruz, startSimulation'da yapacağız
      const newResult = {
        denemeNo: denemeNo.value, // Mevcut denemenin numarası
        parachuteSize: parachuteSize.value,
        fallTime: fallTime.value,
        havaDirecti: airResistance.toFixed(3),
        date: new Date().toLocaleTimeString()
      };
      
      results.value.unshift(newResult);
      
      // Son 15 sonuca kadar tut
      if (results.value.length > 15) {
        results.value = results.value.slice(0, 15);
      }
      
      // Otomatik çalışma modu açıksa yeni deneme başlat
      if (autoRun.value) {
        // Kısa bir süre bekleyip yeni denemeyi başlat
        setTimeout(() => {
          // Deneme sayacını artır ve sıfırla
          denemeNo.value++;
          resetCubePosition();
          fallTime.value = 0;
          status.value = 'Yeni Deneme #' + denemeNo.value + ' Başlıyor...';
          
          // Animasyonu devam ettir
          clock.start();
        }, 1500); // 1.5 saniye bekle
      } else {
        // Otomatik çalışma kapalıysa simülasyonu durdur
        isSimulationRunning.value = false;
        status.value = 'Tamamlandı';
      }
    }
    
    // Objelerin pozisyonlarını güncelle
    cube.position.y = currentHeight;
    parachute.position.y = currentHeight + 2;
  }
  
  // Kontrolleri güncelle
  controls.update();
  
  // Sahneyi render et
  renderer.render(scene, camera);
}

// Paraşüt boyutu değiştiğinde
watch(parachuteSize, () => {
  createParachute();
});

// Komponent yüklendiğinde
onMounted(() => {
  initThreeJs();
});

// Komponent kaldırılmadan önce
onBeforeUnmount(() => {
  pauseSimulation();
  window.removeEventListener('resize', onWindowResize);
  
  if (renderer && renderer.domElement) {
    canvasContainer.value?.removeChild(renderer.domElement);
  }
  
  // Three.js nesnelerini bellekten temizle
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
  
  if (renderer) renderer.dispose();
  
  // Referansları temizle
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  cube = null;
  parachute = null;
  ground = null;
});
</script>
  
 
 