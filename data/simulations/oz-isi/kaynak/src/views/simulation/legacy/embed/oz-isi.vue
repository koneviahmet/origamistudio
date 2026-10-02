<template>
  <div class="relative w-full h-screen bg-gray-100 overflow-hidden">
    <!-- Simülasyon Alanı -->
    <div ref="threeContainer" class="w-full h-full"></div>
    
    <!-- Kontrol Butonları -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      <button v-if="!isSimulating" @click="startSimulation" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
        Başlat
      </button>
      <button v-else @click="stopSimulation" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
        Durdur
      </button>
    </div>
    
    <!-- Arka Plan Rengi Seçenekleri -->
    <div class="absolute bottom-4 left-4 flex space-x-2">
      <button @click="setBackgroundColor('#f3f4f6')" class="w-8 h-8 bg-gray-100 border border-gray-300 rounded-full"></button>
      <button @click="setBackgroundColor('#1f2937')" class="w-8 h-8 bg-gray-800 border border-gray-300 rounded-full"></button>
    </div>
    
    
    <!-- Mobil Ayarlar Butonu -->
    <div class="absolute top-4 right-4 md:hidden">
      <button @click="toggleSettingsPanel" class="p-2 bg-blue-500 text-white rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
    
    <!-- Mobil Ayarlar Paneli -->
    <div v-if="showMobileSettings" class="absolute inset-0 bg-black bg-opacity-50 z-10 md:hidden flex justify-center items-center">
      <div class="bg-gray-800 text-white p-4 rounded-lg w-5/6 max-h-[66vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">Ayarlar</h3>
          <button @click="toggleSettingsPanel" class="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Mobil Ayarlar İçeriği - Materyal ayarları ve ısı ayarları -->
          <div>
            <label class="block mb-1">Materyal Seçimi</label>
            <select v-model="selectedMaterial" class="w-full bg-gray-700 p-2 rounded-md">
              <option v-for="material in materials" :key="material.id" :value="material.id">{{ material.name }}</option>
            </select>
          </div>
          
          <div>
            <label class="block mb-1">Kütle (g)</label>
            <input type="range" v-model="mass" min="50" max="500" class="w-full" />
            <div class="flex justify-between text-sm">
              <span>50g</span>
              <span>{{ mass }}g</span>
              <span>500g</span>
            </div>
          </div>
          
          <div>
            <label class="block mb-1">Isıtıcı Gücü (W)</label>
            <input type="range" v-model="heaterPower" min="100" max="1000" class="w-full" />
            <div class="flex justify-between text-sm">
              <span>100W</span>
              <span>{{ heaterPower }}W</span>
              <span>1000W</span>
            </div>
          </div>
          
          <div class="pt-2 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <button @click="setCameraView('top')" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">Üstten</button>
              <button @click="setCameraView('side')" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">Yandan</button>
              <button @click="setCameraView('front')" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">Önden</button>
              <button @click="setCameraView('isometric')" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">İzometrik</button>
            </div>
            <button @click="resetCamera()" class="w-full px-3 py-1 bg-gray-500 text-white rounded-md text-sm">Kamerayı Sıfırla</button>
          </div>
          
          <button @click="resetSettings" class="w-full px-4 py-2 bg-red-500 text-white rounded-md">Ayarları Sıfırla</button>
        </div>
      </div>
    </div>
    
    <!-- PC Ayarlar Paneli -->
    <div class="absolute top-0 right-0 h-screen md:flex hidden flex-col bg-gray-800 text-white p-4 shadow-lg w-80 overflow-y-auto">
      <h2 class="text-xl font-bold mb-4">Ayarlar</h2>
      
      <div class="space-y-4 flex-grow">
        <div>
          <label class="block mb-1">Materyal Seçimi</label>
          <select v-model="selectedMaterial" class="w-full bg-gray-700 p-2 rounded-md">
            <option v-for="material in materials" :key="material.id" :value="material.id">{{ material.name }}</option>
          </select>
        </div>
        
        <div>
          <label class="block mb-1">Kütle (g)</label>
          <input type="range" v-model="mass" min="50" max="500" class="w-full" />
          <div class="flex justify-between text-sm">
            <span>50g</span>
            <span>{{ mass }}g</span>
            <span>500g</span>
          </div>
        </div>
        
        <div>
          <label class="block mb-1">Isıtıcı Gücü (W)</label>
          <input type="range" v-model="heaterPower" min="100" max="1000" class="w-full" />
          <div class="flex justify-between text-sm">
            <span>100W</span>
            <span>{{ heaterPower }}W</span>
            <span>1000W</span>
          </div>
        </div>
      </div>
      
      <div class="mt-4" v-if="isSettingsChanged">
        <button @click="resetSettings" class="w-full px-4 py-2 bg-red-500 text-white rounded-md">Ayarları Sıfırla</button>
      </div>
    </div>
    
    <!-- Sonuç Tablosu -->
    <div class="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-11/12 md:w-1/2 bg-white rounded-lg shadow-lg text-xs" style="max-height: 40vh; overflow-y: auto;">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-200">
              <th class="px-4 py-2">Materyal</th>
              <th class="px-4 py-2">Kütle (g)</th>
              <th class="px-4 py-2">Başlangıç Sıcaklığı (°C)</th>
              <th class="px-4 py-2">Son Sıcaklık (°C)</th>
              <th class="px-4 py-2">Sıcaklık Değişimi (°C)</th>
              <th class="px-4 py-2">Isıtıcı Gücü (W)</th>
              <th class="px-4 py-2">Isınma Süresi (s)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in records" :key="index" class="border-t">
              <td class="px-4 py-2">{{ getMaterialName(record.materialId) }}</td>
              <td class="px-4 py-2">{{ record.mass }}</td>
              <td class="px-4 py-2">{{ record.initialTemp.toFixed(1) }}</td>
              <td class="px-4 py-2">{{ record.finalTemp.toFixed(1) }}</td>
              <td class="px-4 py-2">{{ (record.finalTemp - record.initialTemp).toFixed(1) }}</td>
              <td class="px-4 py-2">{{ record.heaterPower }}</td>
              <td class="px-4 py-2">{{ record.heatingTime }}</td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="6" class="px-4 py-2 text-center text-gray-500">Henüz ölçüm kaydedilmedi.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Sıcaklık-Zaman Grafiği -->
    <div ref="chartContainer" class="absolute top-16 left-4   bg-white p-2 rounded-lg shadow-lg text-xs" style="width: 300px; height: 150px;"></div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Chart from 'chart.js/auto';

// DOM Referansları
const threeContainer = ref(null);
const chartContainer = ref(null);

// Durum değişkenleri
const isSimulating = ref(false);
const selectedMaterial = ref('water');
const mass = ref(100);
const heaterPower = ref(500);
const showMobileSettings = ref(false);
const records = ref([]);
const temperatureData = ref([]);
const initialSettings = {
  material: 'water',
  mass: 100,
  heaterPower: 500
};

// Three.js değişkenleri
let scene, camera, renderer, controls;
let beaker, material, heater;
let clock, animationId;
let materialTemperature = 25; // başlangıç sıcaklığı
let temperatureChart;

// Materyal bilgileri (madde adı, özısı değeri J/(g*°C))
const materials = [
  { id: 'water', name: 'Su', specificHeat: 4.18, color: 0x3498db },
  { id: 'iron', name: 'Demir', specificHeat: 0.45, color: 0x7f8c8d },
  { id: 'copper', name: 'Bakır', specificHeat: 0.39, color: 0xe67e22 },
  { id: 'sand', name: 'Kum', specificHeat: 0.84, color: 0xf1c40f },
  { id: 'wood', name: 'Ahşap', specificHeat: 1.76, color: 0x8b4513 }
];

// Ayarların değişip değişmediğini kontrol eden computed property
const isSettingsChanged = computed(() => {
  return selectedMaterial.value !== initialSettings.material ||
         mass.value !== initialSettings.mass ||
         heaterPower.value !== initialSettings.heaterPower;
});

// Aktif materyalin bilgilerini getir
const getActiveMaterial = computed(() => {
  return materials.find(m => m.id === selectedMaterial.value);
});

// Fonksiyonlar
function initThreeJS() {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f4f6);
  
  camera = new THREE.PerspectiveCamera(75, threeContainer.value.clientWidth / threeContainer.value.clientHeight, 0.1, 1000);
  camera.position.set(5, 5, 10);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  threeContainer.value.appendChild(renderer.domElement);
  
  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  // Işıklar
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  
  // Zemin
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  scene.add(floor);
  

  
  // Beaker (deney kabı) oluştur
  const beakerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 32, 1, true);
  const beakerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.4
  });
  beaker = new THREE.Mesh(beakerGeometry, beakerMaterial);
  beaker.position.y = 0;
  scene.add(beaker);
  
  // Materyal oluştur
  createMaterial();
  
  // Isıtıcı oluştur
  const heaterGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);
  const heaterMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  heater = new THREE.Mesh(heaterGeometry, heaterMaterial);
  heater.position.y = -1.75;
  scene.add(heater);
  
  // Animasyon döngüsü
  clock = new THREE.Clock();
  animate();
  
  // Pencere boyutu değiştiğinde
  window.addEventListener('resize', onWindowResize);
}

function createMaterial() {
  // Eğer zaten bir materyal varsa onu kaldır
  if (material) {
    scene.remove(material);
  }
  
  const materialGeometry = new THREE.CylinderGeometry(1.4, 1.4, 2, 32);
  const materialMesh = new THREE.MeshStandardMaterial({
    color: getActiveMaterial.value.color
  });
  
  material = new THREE.Mesh(materialGeometry, materialMesh);
  material.position.y = 0;
  scene.add(material);
}

function animate() {
  animationId = requestAnimationFrame(animate);
  
  if (isSimulating.value) {
    const delta = clock.getDelta();
    updateTemperature(delta);
    updateMaterialVisuals();
    updateChart();
  }
  
  controls.update();
  renderer.render(scene, camera);
}

function updateTemperature(delta) {
  // Q = m * c * ΔT formülü, buradan ΔT = Q / (m * c)
  // Isı kaynağından gelen enerji: Q = P * t (güç * zaman)
  const specificHeat = getActiveMaterial.value.specificHeat;
  const heatEnergy = heaterPower.value * delta; // Joule (W*s)
  const temperatureChange = heatEnergy / (mass.value * specificHeat);
  
  materialTemperature += temperatureChange;
  
  // Sıcaklık verisini kaydet
  temperatureData.value.push({
    time: Date.now(),
    temperature: materialTemperature
  });
  
  // En fazla 100 veri noktası tut
  if (temperatureData.value.length > 100) {
    temperatureData.value.shift();
  }
}

function updateMaterialVisuals() {
  // Sıcaklık arttıkça materyal rengini değiştir
  const baseColor = new THREE.Color(getActiveMaterial.value.color);
  const hotColor = new THREE.Color(0xff0000); // Kırmızı
  
  const t = Math.min((materialTemperature - 25) / 75, 1); // 25°C ile 100°C arası normalize et
  const newColor = baseColor.clone().lerp(hotColor, t);
  
  if (material) {
    material.material.color.copy(newColor);
  }
}

function initChart() {
  if (temperatureChart) {
    temperatureChart.destroy();
  }
  
  const ctx = chartContainer.value.appendChild(document.createElement('canvas'));
  
  temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Sıcaklık (°C)',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.2,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Zaman (s)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Sıcaklık (°C)'
          }
        }
      }
    }
  });
}

function updateChart() {
  if (!temperatureChart) return;
  
  const startTime = temperatureData.value.length > 0 ? temperatureData.value[0].time : Date.now();
  
  temperatureChart.data.datasets[0].data = temperatureData.value.map(d => ({
    x: (d.time - startTime) / 1000, // saniye olarak
    y: d.temperature
  }));
  
  temperatureChart.update();
}

function startSimulation() {
  // Önceki simülasyon verileri temizle
  materialTemperature = 25;
  temperatureData.value = [];
  
  const initialTemp = materialTemperature;
  isSimulating.value = true;
  clock.start();
  
  // 5 saniye sonra sonuçları kaydet ve simülasyonu durdur
  setTimeout(() => {
    if (isSimulating.value) {
      const finalTemp = materialTemperature;
      
      records.value.push({
        materialId: selectedMaterial.value,
        mass: mass.value,
        initialTemp: initialTemp,
        finalTemp: finalTemp,
        heaterPower: heaterPower.value,
        timestamp: new Date().toLocaleTimeString(),
        heatingTime: "5" // 5 saniye ısınma süresi
      });
      
      // Simülasyonu otomatik olarak durdur
      stopSimulation();
    }
  }, 5000);
}

function stopSimulation() {
  isSimulating.value = false;
  clock.stop();
}

function resetSettings() {
  selectedMaterial.value = initialSettings.material;
  mass.value = initialSettings.mass;
  heaterPower.value = initialSettings.heaterPower;
  
  if (isSimulating.value) {
    stopSimulation();
  }
  
  materialTemperature = 25;
  temperatureData.value = [];
  updateChart();
  createMaterial();
}

function setCameraView(view) {
  switch (view) {
    case 'top':
      camera.position.set(0, 10, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'side':
      camera.position.set(10, 0, 0);
      camera.lookAt(0, 0, 0);
      break;
    case 'front':
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      break;
    case 'isometric':
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      break;
  }
  
  controls.update();
}

function resetCamera() {
  camera.position.set(5, 5, 10);
  camera.lookAt(0, 0, 0);
  controls.update();
}

function setBackgroundColor(color) {
  scene.background = new THREE.Color(color);
}

function onWindowResize() {
  camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
}

function toggleSettingsPanel() {
  showMobileSettings.value = !showMobileSettings.value;
}

function getMaterialName(id) {
  const material = materials.find(m => m.id === id);
  return material ? material.name : id;
}

// Materyal değiştiğinde 3D modeli güncelle
watch(selectedMaterial, () => {
  createMaterial();
});

// Bileşen yüklendiğinde
onMounted(() => {
  initThreeJS();
  initChart();
});

// Bileşen kaldırıldığında
onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  if (renderer) {
    renderer.dispose();
    if (threeContainer.value && threeContainer.value.contains(renderer.domElement)) {
      threeContainer.value.removeChild(renderer.domElement);
    }
  }
  
  if (temperatureChart) {
    temperatureChart.destroy();
  }
});
</script>
  
 