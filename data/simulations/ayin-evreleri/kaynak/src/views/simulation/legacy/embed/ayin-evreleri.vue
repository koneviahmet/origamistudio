<template>
  <div class="w-full h-screen bg-gray-900 flex flex-col overflow-hidden">

    <!-- Ana içerik alanı -->
    <div class="flex flex-col lg:flex-row flex-1 relative">
      <!-- Simülasyon alanı -->
      <div class="flex-1 relative">
        <!-- Three.js canvas -->
        <canvas ref="threeCanvas" class="w-full h-full"></canvas>
        
        <div class="absolute right-4 top-4 text-white">
            <button 
              @click="toggleAnimation" 
              class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            >
              {{ isAnimating ? 'Durdur' : 'Başlat' }}
            </button>
          </div>

        <!-- Ay evresi göstergesi -->
        <div class="absolute top-4 left-4  p-3  text-black">
          <div class="text-center mb-2 text-sm">{{ currentPhaseName }}</div>
          <div class="flex items-center space-x-2">
            <div class="text-8xl">{{ currentPhaseEmoji }}</div>
          </div>
        </div>
      </div>
      
      <!-- Kontrol paneli -->
      <div class="w-full lg:w-80 bg-gray-800 p-4 text-white h-0 lg:h-full">        
        <div class="space-y-4">
          <div>
            <button 
              @click="toggleAnimation" 
              class="w-full py-2 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            >
              {{ isAnimating ? 'Durdur' : 'Başlat' }}
            </button>
          </div>
          
          <div>
            <label class="block mb-2 text-sm">Simülasyon Hızı</label>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              v-model="simulationSpeed"
              class="w-full"
            />
          </div>
          
          <!-- Evre seçimi bölümü -->
          <div class="border-t border-gray-700 pt-4">
            <div class="grid grid-cols-4 gap-2 text-sm">
              <button 
                v-for="(phase, index) in moonPhases" 
                :key="index"
                @click="selectPhase(index)"
                class="flex flex-col items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                :class="{'ring-2 ring-indigo-400': currentPhase === index}"
              >
                <span class="text-xl">{{ phase.emoji }}</span>
                <span class="text-2xs mt-1 text-center">{{ phase.name }}</span>
              </button>
            </div>
          </div>
          
          <div class="border-t border-gray-700 pt-4">
            <h3 class="font-bold mb-2">Ay Evreleri</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><span class="mr-1">🌑</span> Yeni Ay</div>
              <div><span class="mr-1">🌒</span> Hilal</div>
              <div><span class="mr-1">🌓</span> İlk Dördün</div>
              <div><span class="mr-1">🌔</span> Şişkin Ay</div>
              <div><span class="mr-1">🌕</span> Dolunay</div>
              <div><span class="mr-1">🌖</span> Şişkin Ay</div>
              <div><span class="mr-1">🌗</span> Son Dördün</div>
              <div><span class="mr-1">🌘</span> Hilal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Referanslar
const threeCanvas = ref(null);
const isAnimating = ref(false);
const simulationSpeed = ref(0.2);
const currentPhase = ref(0); // 0-7 arası değer (8 ay evresi)

// Three.js değişkenleri
let scene, camera, renderer, controls;
let sun, earth, moon, moonPhaseVisual;
let earthOrbit, moonOrbit;

// Ay evreleri bilgileri
const moonPhases = [
  { name: 'Yeni Ay', emoji: '🌑' },
  { name: 'Hilal', emoji: '🌒' },
  { name: 'İlk Dördün', emoji: '🌓' },
  { name: 'Şişkin Ay', emoji: '🌔' },
  { name: 'Dolunay', emoji: '🌕' },
  { name: 'Şişkin Ay', emoji: '🌖' },
  { name: 'Son Dördün', emoji: '🌗' },
  { name: 'Hilal', emoji: '🌘' }
];

// Hesaplanmış değerler
const currentPhaseName = computed(() => moonPhases[currentPhase.value].name);
const currentPhaseEmoji = computed(() => moonPhases[currentPhase.value].emoji);

// Animasyon değişkenleri
let animationId = null;
let earthAngle = 0;
let moonAngle = 0;

// Simülasyon başlatma/durdurma
function toggleAnimation() {
  isAnimating.value = !isAnimating.value;
  
  if (isAnimating.value && !animationId) {
    animate();
  }
}

// Belirli bir ay evresini seçme 
function selectPhase(phaseIndex) {
  // Simülasyonu durdur
  isAnimating.value = false;
  
  // Evre değerini güncelle
  currentPhase.value = phaseIndex;
  
  // Evre indeksine göre ay açısını hesapla (saat yönünün tersine döndüğü için değerler tersine çevrildi)
  // 0: Yeni Ay (Ay, Dünya ile Güneş arasında) - Math.PI
  // 2: İlk Dördün (Ay, Dünya'nın sağında) - Math.PI/2
  // 4: Dolunay (Ay, Dünya'nın arkasında) - 0
  // 6: Son Dördün (Ay, Dünya'nın solunda) - -Math.PI/2 veya 3*Math.PI/2
  const moonPhaseAngles = [
    Math.PI,            // 0: Yeni Ay
    Math.PI * 1.25,     // 1: İlk Hilal (değiştirildi: 0.75 -> 1.25)
    Math.PI * 1.5,      // 2: İlk Dördün (değiştirildi: 0.5 -> 1.5)  
    Math.PI * 1.75,     // 3: Büyüyen Şişkin Ay (değiştirildi: 0.25 -> 1.75)
    0,                  // 4: Dolunay
    Math.PI * 0.25,     // 5: Küçülen Şişkin Ay (değiştirildi: 1.75 -> 0.25)
    Math.PI * 0.5,      // 6: Son Dördün (değiştirildi: 1.5 -> 0.5)
    Math.PI * 0.75      // 7: Son Hilal (değiştirildi: 1.25 -> 0.75)
  ];
  
  // Ay ve dünya konumlarını ayarla
  moonAngle = moonPhaseAngles[phaseIndex];
  moonOrbit.rotation.y = moonAngle;
  
  // Tek render için animate çağır
  renderer.render(scene, camera);
}

// Three.js sahnesini kurma
function setupScene() {
  // Sahne oluşturma
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf9fafb); // bg-gray-900
  
  // Kamera oluşturma
  camera = new THREE.PerspectiveCamera(
    75,
    threeCanvas.value.clientWidth / threeCanvas.value.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 30);
  
  // Renderer oluşturma
  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    antialias: true
  });
  renderer.setSize(threeCanvas.value.clientWidth, threeCanvas.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Kontroller oluşturma
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Işıklar oluşturma
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  
  // Oda oluşturma (tavan, taban ve duvarlar)
  createRoom();
  
  // Gök cisimlerini oluşturma
  createCelestialBodies();
  
  // Ay evresi göstergesini oluşturma
  createMoonPhaseVisual();
  
  // İlk pencere boyutunu ayarlama
  handleResize();
}

// Oda oluşturma (tavan, taban ve duvarlar)
function createRoom() {
  const roomColor = 0x111827; // bg-gray-900 ile aynı renk
  const roomSize = 100;
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
  const roomMaterial = new THREE.MeshBasicMaterial({ 
    color: roomColor, 
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.2 
  });
  
  const room = new THREE.Mesh(roomGeometry, roomMaterial);
  scene.add(room);
}

// Gök cisimlerini oluşturma
function createCelestialBodies() {
  // Yörünge grupları (hareketleri kolaylaştırmak için)
  earthOrbit = new THREE.Group();
  moonOrbit = new THREE.Group();
  
  scene.add(earthOrbit);
  earthOrbit.add(moonOrbit);
  
  // Güneş oluşturma
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  
  // Güneş ışığı
  const sunLight = new THREE.PointLight(0xffffff, 1.5);
  sun.add(sunLight);
  scene.add(sun);
  
  // Dünya oluşturma
  const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
  const earthMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x2233ff,
    emissive: 0x112244
  });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(15, 0, 0); // Güneşten 15 birim uzaklık
  earthOrbit.add(earth);
  
  // Ay oluşturma
  const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32);
  const moonMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x888888,
    emissive: 0x222222
  });
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(3, 0, 0); // Dünyadan 3 birim uzaklık
  moonOrbit.position.copy(earth.position);
  moonOrbit.add(moon);
  
  // Yörünge çizgileri oluşturma
  const earthOrbitLine = createOrbitLine(15);
  const moonOrbitLine = createOrbitLine(3);
  
  scene.add(earthOrbitLine);
  moonOrbit.add(moonOrbitLine);
}

// Yörünge çizgisi oluşturma
function createOrbitLine(radius) {
  const segments = 64;
  const orbitGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array((segments + 1) * 3);
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions[i * 3] = radius * Math.cos(angle);
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = radius * Math.sin(angle);
  }
  
  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const orbitMaterial = new THREE.LineBasicMaterial({ 
    color: 0x444444,
    transparent: true,
    opacity: 0.5
  });
  
  return new THREE.Line(orbitGeometry, orbitMaterial);
}

// Ay evresi göstergesi oluşturma
function createMoonPhaseVisual() {
  // Ay ön görünümü için grup
  moonPhaseVisual = new THREE.Group();
  scene.add(moonPhaseVisual);
  
  // Daima kameraya bakan bir pozisyonda tutacağız
  moonPhaseVisual.position.set(-5, 10, -20);
}

// Ay evresini güncelleme
function updateMoonPhase() {
  // Ay ile güneş arasındaki açıyı hesaplama
  const sunPosition = new THREE.Vector3(0, 0, 0);
  const moonPosition = new THREE.Vector3();
  moon.getWorldPosition(moonPosition);
  const earthPosition = new THREE.Vector3();
  earth.getWorldPosition(earthPosition);

  // Dünya-ay çizgisi ile dünya-güneş çizgisi arasındaki açıyı hesaplama
  const earthToSun = new THREE.Vector3().subVectors(sunPosition, earthPosition).normalize();
  const earthToMoon = new THREE.Vector3().subVectors(moonPosition, earthPosition).normalize();
  
  // Çapraz çarpım yönüne göre açının yönünü belirleme
  const crossProduct = new THREE.Vector3().crossVectors(earthToSun, earthToMoon);
  const angleSign = crossProduct.y >= 0 ? 1 : -1;
  
  const angle = earthToSun.angleTo(earthToMoon) * angleSign;
  
  // Açıdan ay evresini belirleme (0-7 arası değer)
  // 0: Yeni Ay, 2: İlk Dördün, 4: Dolunay, 6: Son Dördün
  const phaseIndex = Math.round(((angle + Math.PI * 2) / (Math.PI * 2)) * 8) % 8;
  currentPhase.value = phaseIndex;
}

// Animasyon döngüsü
function animate() {
  animationId = requestAnimationFrame(animate);
  
  if (isAnimating.value) {
    // Dünya'nın Güneş etrafında dönüşü (saat yönünün tersine)
    earthAngle += 0.005 * simulationSpeed.value;
    earthOrbit.rotation.y = earthAngle;
    
    // Ay'ın Dünya etrafında dönüşü (saat yönünün tersine)
    moonAngle += 0.05 * simulationSpeed.value;
    moonOrbit.rotation.y = moonAngle;
    
    // Ay evresini güncelleme
    updateMoonPhase();
  }
  
  // Kontrolleri güncelleme
  controls.update();
  
  // Sahneyi yeniden çizme
  renderer.render(scene, camera);
}

// Pencere boyutunu yeniden ayarlama
function handleResize() {
  if (!threeCanvas.value) return;
  
  const width = threeCanvas.value.clientWidth;
  const height = threeCanvas.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
}

// Sayfa/component yüklendiğinde setup yapma
onMounted(() => {
  setupScene();
  
  // Yeni ay evresinden başlama
  moonAngle = Math.PI; // Ay, Dünya ile Güneş arasında
  moonOrbit.rotation.y = moonAngle;
  
  // Animasyonu başlatma (durdurulmuş durumda)
  animate();
  
  // Pencere boyutu değişikliklerini dinleme
  window.addEventListener('resize', handleResize);
});

// Component kaldırıldığında temizlik yapma
onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', handleResize);
  
  // Three.js nesnelerini temizleme
  scene.clear();
  renderer.dispose();
  controls.dispose();
});
</script>
  
<style scoped>
/* Ek CSS kuralları buraya eklenebilir */
</style>
  
 
 