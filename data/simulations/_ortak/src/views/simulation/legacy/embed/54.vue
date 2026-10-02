<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
    <!-- Title -->
    <h1 class="text-2xl md:text-3xl font-bold text-white mb-4">Eşit Kollu Terazi Similasyonu</h1>
    
    <!-- Description -->
    <p class="text-gray-300 text-sm md:text-base max-w-2xl text-center mb-4">
      Bu simülasyon eşit kollu bir terazide ağırlık dengesini göstermektedir. Sağ tarafa kütleler, 
      sol tarafa meyveler ekleyerek terazinin denge durumunu gözlemleyebilirsiniz.
    </p>
    
    <!-- Control Panel -->
    <div class="w-full max-w-3xl bg-gray-800 rounded-lg p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Left side controls (fruits) -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-white font-semibold mb-2 text-center">Sol Taraf (Meyveler)</h3>
          <div class="flex flex-wrap justify-center gap-2">
            <button 
              v-for="fruit in fruits" 
              :key="fruit.name"
              @click="addItemToLeftSide(fruit)"
              class="px-2 py-1 text-xs rounded bg-blue-600 text-white flex items-center"
            >
              {{ fruit.name }} ({{ fruit.mass }}g)
            </button>
            <button 
              @click="clearLeftSide"
              class="px-2 py-1 text-xs rounded bg-red-600 text-white mt-2 w-full"
            >
              Sol Tarafı Temizle
            </button>
          </div>
        </div>
        
        <!-- Right side controls (weights) -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-white font-semibold mb-2 text-center">Sağ Taraf (Kütleler)</h3>
          <div class="flex flex-wrap justify-center gap-2">
            <button 
              v-for="weight in weights" 
              :key="weight.value"
              @click="addItemToRightSide(weight)"
              class="px-2 py-1 text-xs rounded bg-green-600 text-white"
            >
              {{ weight.value }}g
            </button>
            <button 
              @click="clearRightSide"
              class="px-2 py-1 text-xs rounded bg-red-600 text-white mt-2 w-full"
            >
              Sağ Tarafı Temizle
            </button>
          </div>
        </div>
      </div>
      
      <!-- Reset button -->
      <button 
        @click="resetSimulation" 
        class="px-3 py-2 text-sm rounded bg-yellow-600 text-white mt-3 w-full"
      >
        Simülasyonu Sıfırla
      </button>
    </div>
    
    <!-- SVG Simulation -->
    <div class="relative w-full max-w-3xl bg-gray-800 rounded-lg overflow-hidden">
      <svg 
        ref="simulationSvg"
        :width="svgWidth" 
        :height="svgHeight" 
        class="w-full h-64 md:h-[500px]"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Background -->
        <rect width="100%" height="100%" fill="#333333" />
        
        <!-- Stand/Pivot -->
        <rect :x="pivotX - 10" :y="pivotY - 60" width="20" height="60" fill="#777777" />
        <rect :x="pivotX - 30" :y="pivotY" width="60" height="10" fill="#777777" />
        
        <!-- Beam with items -->
        <g :transform="`rotate(${beamAngle}, ${pivotX}, ${pivotY})`">
          <!-- Beam -->
          <rect 
            :x="pivotX - beamLength/2" 
            :y="pivotY - beamHeight/2" 
            :width="beamLength" 
            :height="beamHeight" 
            fill="#a67c52"
          />
          
          <!-- Left Side Items (Fruits) -->
          <g v-for="(item, index) in leftSideItems" :key="`left-${index}`">
            <rect 
              :x="pivotX - beamLength/2 + item.position" 
              :y="pivotY - beamHeight/2 - item.size - 2 - item.stackOffset" 
              :width="item.size" 
              :height="item.size" 
              :fill="item.color"
              :stroke="item.color === '#ffff00' ? '#999900' : 'none'"
              stroke-width="1"
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
            />
          </g>
        </g>
        
        <!-- Balance Markers -->
        <line
          :x1="pivotX"
          :y1="pivotY + 30"
          :x2="pivotX"
          :y2="pivotY + 40"
          stroke="#ffffff"
          stroke-width="2"
        />
        
        <g v-for="i in 5" :key="`marker-left-${i}`">
          <line
            :x1="pivotX - (i * 40)"
            :y1="pivotY + 30"
            :x2="pivotX - (i * 40)"
            :y2="pivotY + 35"
            stroke="#ffffff"
            stroke-width="1"
          />
        </g>
        
        <g v-for="i in 5" :key="`marker-right-${i}`">
          <line
            :x1="pivotX + (i * 40)"
            :y1="pivotY + 30"
            :x2="pivotX + (i * 40)"
            :y2="pivotY + 35"
            stroke="#ffffff"
            stroke-width="1"
          />
        </g>
        
        <!-- Balance Indicator -->
        <g v-if="isBalanced" class="animate-pulse">
          <circle 
            :cx="pivotX" 
            :cy="pivotY - 50" 
            r="15" 
            fill="none" 
            stroke="#4ade80" 
            stroke-width="2"
          />
          <text 
            :x="pivotX" 
            :y="pivotY - 100" 
            text-anchor="middle" 
            class="text-sm" 
            fill="#4ade80" 
            font-weight="bold"
          >
            DENGE SAĞLANDI!
          </text>
        </g>
      </svg>
      
      <!-- Information Panel -->
      <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <div>
          <p>Sol Taraf Toplam: {{ leftSideTotalMass.toFixed(0) }}g</p>
          <p>Sağ Taraf Toplam: {{ rightSideTotalMass.toFixed(0) }}g</p>
          <p>Fark: {{ Math.abs(leftSideTotalMass - rightSideTotalMass).toFixed(0) }}g</p>
          <p v-if="isBalanced" class="font-bold text-green-400 mt-1">Terazi Dengede!</p>
          <p v-else class="font-bold text-yellow-400 mt-1">
            {{ leftSideTotalMass > rightSideTotalMass ? 'Sol Taraf Ağır' : 'Sağ Taraf Ağır' }}
          </p>
        </div>
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

// Balance scale properties
const pivotX = ref(400); // Center X
const pivotY = ref(150); // Y position of pivot
const beamLength = ref(600);
const beamHeight = ref(20);

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

// Fruits data
const fruits = [
  { name: "Elma", mass: 100, size: 40, color: "#ff0000" },
  { name: "Muz", mass: 150, size: 45, color: "#ffff00" },
  { name: "Portakal", mass: 120, size: 42, color: "#ffa500" },
  { name: "Çilek", mass: 15, size: 20, color: "#ff4d4d" },
  { name: "Karpuz", mass: 500, size: 60, color: "#55aa55" }
];

// Weights data
const weights = [
  { value: 50, size: 30, color: "#aaaaaa" },
  { value: 100, size: 35, color: "#999999" },
  { value: 200, size: 40, color: "#888888" },
  { value: 500, size: 45, color: "#777777" },
  { value: 1000, size: 50, color: "#666666" }
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
  const duration = 1000; // ms
  const startTime = Date.now();
  
  const animate = () => {
    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Easing function for smoother animation
    const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    
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
      svgHeight.value = Math.min(containerWidth * 0.625, 500);
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.animate-pulse {
  animation: pulse 2s infinite;
}
</style>
  
 
 