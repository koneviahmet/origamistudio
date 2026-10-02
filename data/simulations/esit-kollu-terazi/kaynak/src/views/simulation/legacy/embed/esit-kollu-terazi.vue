<template>
  <div class="flex flex-col md:flex-row min-h-screen  w-full">
    <!-- Main Simulation Area -->
    <div class="flex-1 flex flex-col items-center justify-center p-4 relative">
      
      <!-- Mobile Settings Button -->
      <button 
        @click="showMobileSettings = !showMobileSettings" 
        class="md:hidden absolute w-8 h-8 top-4 left-4 p-2 bg-gray-800 text-white rounded-full shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      <!-- SVG Simulation with walls/floor/ceiling -->
      <div class="relative w-full h-full   overflow-hidden flex items-center justify-center">
        <svg 
          ref="simulationSvg"
          :width="svgWidth" 
          :height="svgHeight" 
          class="w-full h-full"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
        >
          <!-- Background -->
          <rect width="100%" height="100%" :fill="bgColor" />
          
          <!-- Stand/Pivot -->
          <rect :x="pivotX - 10" :y="pivotY - 60" width="20" height="60" rx="2" fill="#94a3b8" />
          <rect :x="pivotX - 30" :y="pivotY - 5" width="60" height="10" rx="2" fill="#94a3b8" />
          
          <!-- Beam with items -->
          <g :transform="`rotate(${beamAngle}, ${pivotX}, ${pivotY})`">
            <!-- Beam -->
            <rect 
              :x="pivotX - beamLength/2" 
              :y="pivotY - beamHeight/2" 
              :width="beamLength" 
              :height="beamHeight" 
              rx="2"
              fill="#64748b"
            />
            
            <!-- Left Side Items (Fruits) -->
            <g v-for="(item, index) in leftSideItems" :key="`left-${index}`">
              <rect 
                :x="pivotX - beamLength/2 + item.position" 
                :y="pivotY - beamHeight/2 - item.size - 2 - item.stackOffset" 
                :width="item.size" 
                :height="item.size" 
                :fill="item.color"
                rx="2"
              />
            </g>
            
            <!-- Right Side Items (Weights) -->
            <g v-for="(item, index) in rightSideItems" :key="`right-${index}`">
              <rect 
                :x="pivotX + item.position" 
                :y="pivotY - beamHeight/2 - item.size - 2 - item.stackOffset" 
                :width="item.size" 
                :height="item.size" 
                :fill="item.color"
                rx="2"
              />
            </g>
          </g>
          
          <!-- Balance Indicator -->
          <g v-if="isBalanced">
            <text 
              :x="pivotX" 
              :y="pivotY - 80" 
              text-anchor="middle" 
              class="text-base" 
              fill="#10b981" 
              font-weight="bold"
            >
              Denge
            </text>
          </g>
        </svg>
        
        <!-- Information Panel -->
        <div class="absolute border border-gray-200 text-gray-800 text-xs p-2 rounded shadow-md">
          <div class="flex items-center justify-center space-x-4">
            <p class="flex justify-between gap-4">
              <span class="font-medium">{{ leftSideTotalMass.toFixed(0) }}g</span>
            </p>

            <p class="text-center font-medium min-w-max bg-blue-200 p-1 rounded-md" :class="{'text-green-600': isBalanced, 'text-amber-600': !isBalanced}">
              {{ isBalanced ? 'Dengede' : leftSideTotalMass > rightSideTotalMass ? 'Sol Ağır' : 'Sağ Ağır' }}
            </p>

            <p class="flex justify-between gap-4">
              <span class="font-medium">{{ rightSideTotalMass.toFixed(0) }}g</span>
            </p>
          </div>
        </div>

      </div>
      
      <!-- Mobile Settings Modal -->
      <div 
        v-if="showMobileSettings" 
        class="fixed inset-0 z-50 md:hidden flex items-start justify-center  bg-black bg-opacity-50"
        @click.self="showMobileSettings = false"
      >
        <div class="bg-gray-800 text-white  w-full h-full overflow-y-auto p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Ayarlar</h2>
            <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white w-8 h-8">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Mobile Control Panel -->
          <div class="space-y-6">

          
            <!-- Left side controls (fruits) -->
            <div>
              <h3 class="text-gray-300 font-medium mb-3">Sol Taraf</h3>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="fruit in fruits" 
                  :key="fruit.name"
                  @click="addItemToLeftSide(fruit)"
                  class="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition-colors duration-200 flex items-center"
                  :style="{ borderLeft: `4px solid ${fruit.color}` }"
                >
                  {{ fruit.name }} ({{ fruit.mass }}g)
                </button>
                <button 
                  @click="clearLeftSide"
                  class="px-3 py-1.5 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors duration-200 mt-2 w-full"
                >
                  Temizle
                </button>
              </div>
            </div>
            
            <!-- Right side controls (weights) -->
            <div>
              <h3 class="text-gray-300 font-medium mb-3">Sağ Taraf</h3>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="weight in weights" 
                  :key="weight.value"
                  @click="addItemToRightSide(weight)"
                  class="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition-colors duration-200"
                  :style="{ borderLeft: `4px solid ${weight.color}` }"
                >
                  {{ weight.value }}g
                </button>
                <button 
                  @click="clearRightSide"
                  class="px-3 py-1.5 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors duration-200 mt-2 w-full"
                >
                  Temizle
                </button>
              </div>
            </div>
            
            <!-- Reset button -->
            <button 
              @click="resetSimulation" 
              class="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 w-full font-medium"
            >
              Sıfırla
            </button>
          </div>
        </div>
      </div>
      
      <!-- Instructions -->
      <div class="w-full max-w-4xl text-sm text-gray-600 text-center mt-4">
        <p>Sağ tarafa kütleler, sol tarafa meyveler ekleyerek terazinin denge durumunu gözlemleyebilirsiniz.</p>
      </div>
    </div>
    
    <!-- Desktop Settings Panel - Right side -->
    <div class="hidden md:block w-80 bg-gray-800 text-white p-4 overflow-y-auto max-h-screen">
      <!-- Title -->
      
      <!-- Control Panel -->
      <div class="space-y-6">

      
        <!-- Left side controls (fruits) -->
        <div>
          <h3 class="text-gray-300 font-medium mb-3">Sol Taraf</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="fruit in fruits" 
              :key="fruit.name"
              @click="addItemToLeftSide(fruit)"
              class="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition-colors duration-200 flex items-center"
              :style="{ borderLeft: `4px solid ${fruit.color}` }"
            >
              {{ fruit.name }} ({{ fruit.mass }}g)
            </button>
            <button 
              @click="clearLeftSide"
              class="px-3 py-1.5 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors duration-200 mt-2 w-full"
            >
              Temizle
            </button>
          </div>
        </div>
        
        <!-- Right side controls (weights) -->
        <div>
          <h3 class="text-gray-300 font-medium mb-3">Sağ Taraf</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="weight in weights" 
              :key="weight.value"
              @click="addItemToRightSide(weight)"
              class="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition-colors duration-200"
              :style="{ borderLeft: `4px solid ${weight.color}` }"
            >
              {{ weight.value }}g
            </button>
            <button 
              @click="clearRightSide"
              class="px-3 py-1.5 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors duration-200 mt-2 w-full"
            >
              Temizle
            </button>
          </div>
        </div>
        
        <!-- Reset button -->
        <button 
          @click="resetSimulation" 
          class="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 w-full font-medium"
        >
          Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";

// SVG dimensions
const simulationSvg = ref(null);
const svgWidth = ref(800);
const svgHeight = ref(500);

// Background color
const bgColor = ref('#ffffff');

// Mobile settings visibility
const showMobileSettings = ref(false);

// Balance scale properties
const pivotX = ref(400); // Center X
const pivotY = ref(150); // Y position of pivot
const beamLength = ref(600);
const beamHeight = ref(16);

// Beam angle (in degrees)
const beamAngle = ref(0);

// Items on beam sides
const leftSideItems = ref([]);
const rightSideItems = ref([]);

// Tracking masses
const leftSideTotalMass = ref(0);
const rightSideTotalMass = ref(0);

// Computed property to check if the beam is balanced
const isBalanced = computed(() => {
  // Denge toleransı (küçük açı farklılıklarını denge kabul et)
  const BALANCE_TOLERANCE = 1;
  
  // Ağırlık farkı belirli bir tolerans içindeyse dengede kabul et
  const weightDiff = Math.abs(leftSideTotalMass.value - rightSideTotalMass.value);
  
  // Ağırlık farkı 5g veya daha azsa veya açı çok küçükse dengede kabul et
  return weightDiff <= 5 && Math.abs(beamAngle.value) < BALANCE_TOLERANCE;
});

// Fruits data - pastel renkler
const fruits = [
  { name: "Elma", mass: 100, size: 35, color: "#f87171" },    // Açık kırmızı
  { name: "Muz", mass: 50, size: 40, color: "#fcd34d" },     // Açık sarı
  { name: "Portakal", mass: 120, size: 38, color: "#fb923c" },// Açık turuncu
  { name: "Çilek", mass: 10, size: 20, color: "#fb7185" },    // Açık pembe
  { name: "Karpuz", mass: 500, size: 50, color: "#4ade80" }   // Açık yeşil
];

// Weights data - gri tonları
const weights = [
  { value: 10, size: 10, color: "#334155" },    // En açık gri
  { value: 50, size: 25, color: "#cbd5e1" },    // En açık gri
  { value: 100, size: 30, color: "#94a3b8" },   // Açık gri
  { value: 200, size: 35, color: "#64748b" },   // Orta gri
  { value: 500, size: 40, color: "#475569" },   // Koyu gri
];

// Function to add items to left side (fruits)
const addItemToLeftSide = (fruit) => {
  // Meyveleri terazinin sol kolunun en ucuna yerleştir
  // Meyvenin sol kenarı, kolun sol ucuyla hizalı olsun
  const position = 10; // Çok az bir mesafe bırak (10 birim, kenar payı)
  
  // Aynı meyve türünden birden fazla eklendiğinde birikmelerini sağla
  // Aynı türden kaç tane eklendiğini hesapla
  const sameTypeCount = leftSideItems.value.filter(item => 
    item.type === fruit.name
  ).length;
  
  // Her eklenen aynı tür için Y pozisyonunu yukarı doğru kaydır
  const stackOffset = sameTypeCount * (fruit.size + 2);
  
  leftSideItems.value.push({
    position: position,
    size: fruit.size,
    color: fruit.color,
    mass: fruit.mass,
    type: fruit.name,
    stackOffset: stackOffset
  });
  
  // Update total mass
  leftSideTotalMass.value += fruit.mass;
  
  // Update beam angle after adding item
  calculateBeamAngle();
};

// Function to add items to right side (weights)
const addItemToRightSide = (weight) => {
  // Tüm kütleleri terazinin sağ ucuna yerleştir
  // Terazinin sağ ucu = beamLength/2 - weight.size
  const position = beamLength.value/2 - weight.size - 5; // 5 birim kenar payı
  
  // Aynı kütle değerinden birden fazla eklendiğinde birikmelerini sağla
  const sameTypeCount = rightSideItems.value.filter(item => 
    item.type === weight.value
  ).length;
  
  // Her eklenen aynı tür için Y pozisyonunu yukarı doğru kaydır
  const stackOffset = sameTypeCount * (weight.size + 2);
  
  rightSideItems.value.push({
    position: position,
    size: weight.size,
    color: weight.color,
    mass: weight.value,
    type: weight.value,
    stackOffset: stackOffset
  });
  
  // Update total mass
  rightSideTotalMass.value += weight.value;
  
  // Update beam angle after adding item
  calculateBeamAngle();
};

// Clear sides
const clearLeftSide = () => {
  leftSideItems.value = [];
  leftSideTotalMass.value = 0;
  calculateBeamAngle();
};

const clearRightSide = () => {
  rightSideItems.value = [];
  rightSideTotalMass.value = 0;
  calculateBeamAngle();
};

// Reset simulation
const resetSimulation = () => {
  clearLeftSide();
  clearRightSide();
  beamAngle.value = 0;
  // Mobil ayarlar modalini kapat
  showMobileSettings.value = false;
};

// Calculate beam angle based on weight difference and torque
const calculateBeamAngle = () => {
  // Sol ve sağ taraftaki toplam kütleleri karşılaştır
  // Kütleler terazi kolunun uç kısımlarında olduğundan, 
  // bütün kütlelerin uç noktada olduğunu varsayıyoruz
  
  // Sol tarafın toplam kütlesi
  const leftMass = leftSideTotalMass.value;
  
  // Sağ tarafın toplam kütlesi 
  const rightMass = rightSideTotalMass.value;
  
  // Ağırlık farkı hesapla - basit bir şekilde hangisi ağırsa o taraf aşağı inecek
  const diff = leftMass - rightMass;
  
  // Maksimum eğim açısını sınırla
  const MAX_ANGLE = 20;
  
  // Ağırlık farkını açıya dönüştür
  // Negatif değer sağ tarafın aşağı indiğini gösterir
  const targetAngle = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, -diff / 50));
  
  // Animate to the target angle
  animateBeamAngle(targetAngle);
};

// Animate beam angle
const animateBeamAngle = (targetAngle) => {
  const startAngle = beamAngle.value;
  const diff = targetAngle - startAngle;
  const duration = 800; // ms - daha hızlı animasyon
  const startTime = Date.now();
  
  const animate = () => {
    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Easing function for smoother animation
    const easedProgress = 1 - Math.pow(1 - progress, 2); // Quadratic ease-out
    
    beamAngle.value = startAngle + diff * easedProgress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

// Responsive SVG
const updateSvgSize = () => {
  if (simulationSvg.value) {
    const container = simulationSvg.value.parentElement;
    if (container) {
      const containerWidth = container.clientWidth;
      svgWidth.value = containerWidth;
      // Ekranın yüksekliğine göre SVG yüksekliğini ayarla (daha büyük olsun)
      svgHeight.value = Math.min(Math.max(containerWidth * 0.625, 300), window.innerHeight * 0.7);
    }
  }
};

// Watch for changes in masses to update beam angle
watch([leftSideTotalMass, rightSideTotalMass], () => {
  calculateBeamAngle();
});

onMounted(() => {
  // Set up resize observer for responsive SVG
  const resizeObserver = new ResizeObserver(updateSvgSize);
  if (simulationSvg.value?.parentElement) {
    resizeObserver.observe(simulationSvg.value.parentElement);
  }
  
  window.addEventListener('resize', updateSvgSize);
  updateSvgSize();
  
  // Initialize with level beam
  beamAngle.value = 0;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSvgSize);
});
</script>

<style scoped>
svg {
  width: 100%;
  height: 100%;
  touch-action: manipulation;
}
</style>
  
 
 