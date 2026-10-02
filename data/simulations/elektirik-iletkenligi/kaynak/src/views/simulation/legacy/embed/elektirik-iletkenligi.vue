<template>
  <div class="h-screen bg-gray-100 p-4 relative overflow-auto">

    <!-- Ana İçerik -->
    <div class="flex flex-col lg:flex-row gap-4">

      <!-- Similasyon Alanı -->
      <div class="flex-grow">
        
        <!-- Bilgi Paneli -->
        <div class="flex space-x-2 mb-4 mt-14 lg:mt-0">
          <div class="w-full bg-white rounded-xl shadow-lg overflow-hidden p-5 flex flex-col items-center justify-center border border-gray-200">
            <h4 class="text-gray-600 text-sm font-medium">Direnç</h4>
            <p class="lg:text-2xl font-bold mt-1" :class="resistanceColor">{{ resistance }} Ω</p>
          </div>
          
          <div class="w-full bg-white rounded-xl shadow-lg overflow-hidden p-5 flex flex-col items-center justify-center border border-gray-200">
            <h4 class="text-gray-600 text-sm font-medium">Akım</h4>
            <p class="lg:text-2xl font-bold mt-1" :class="currentColor">{{ current }}</p>
          </div>
          
          <div class="w-full bg-white rounded-xl shadow-lg overflow-hidden p-5 flex flex-col items-center justify-center border border-gray-200">
            <h4 class="text-gray-600 text-sm font-medium">İletkenlik</h4>
            <p class="lg:text-2xl font-bold mt-1" :class="conductivityColor">{{ conductivity }}</p>
          </div>
        </div>

        <!-- Başlat/Durdur Butonu -->
        <div class="flex justify-center mb-4 z-10 absolute top-6 right-6">
          <button 
            @click="togglePower"
            class="px-6 py-2 rounded-lg font-medium transition-all duration-200"
            :class="isPowerOn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'"
          >
            {{ !isPowerOn ? 'Aç' : 'Kapat' }}
          </button>
        </div>

        <!-- Mobil Ayarlar Butonu -->
        <button 
          class="lg:hidden absolute top-4 left-4 bg-gray-800 text-white p-2 rounded-lg z-50"
          @click="showMobileSettings = !showMobileSettings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- Similasyon Container -->
        <div 
          ref="simulationContainer" 
          class="bg-white rounded-xl shadow-lg overflow-hidden relative border border-gray-200"
          style="height: calc(100vh - 250px);"
        >
          <!-- Simülasyon burada render edilecek -->
           
        </div>
      </div>

      <!-- Ayarlar Paneli - Desktop -->
      <div 
        class="hidden lg:block w-80 bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700"
        style="height: calc(100vh - 32px);"
      >
        <div class="p-5 mt-4">          
          <div class="space-y-6">
            <!-- Malzeme Seçimi -->
            <div>
              <label class="block text-gray-300 text-sm mb-2 font-medium">Malzeme</label>
              <select 
                v-model="selectedMaterial"
                class="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <optgroup label="İletkenler">
                  <option value="silver">Gümüş (En iyi iletken)</option>
                  <option value="copper">Bakır (Mükemmel iletken)</option>
                  <option value="gold">Altın (Çok iyi iletken)</option>
                  <option value="aluminum">Alüminyum (Çok iyi iletken)</option>
                  <option value="iron">Demir (İyi iletken)</option>
                </optgroup>
                <optgroup label="Yarı İletkenler">
                  <option value="germanium">Germanyum (Yarı iletken)</option>
                  <option value="silicon">Silikon (Yarı iletken)</option>
                  <option value="galliumArsenide">Galyum Arsenid (Yarı iletken)</option>
                  <option value="seleniumSulfide">Selenyum Sülfür (Yarı iletken)</option>
                </optgroup>
                <optgroup label="Yalıtkanlar">
                  <option value="rubber">Kauçuk (Yalıtkan)</option>
                  <option value="wood">Ahşap (Yalıtkan)</option>
                  <option value="glass">Cam (Yalıtkan)</option>
                  <option value="plastic">Plastik (Yalıtkan)</option>
                  <option value="ceramic">Seramik (Yalıtkan)</option>
                  <option value="diamond">Elmas (Mükemmel yalıtkan)</option>
                </optgroup>
              </select>
            </div>

            <!-- Voltaj Göstergesi -->
            <div>
              <label class="block text-gray-300 text-sm mb-2 font-medium">Voltaj</label>
              <div class="text-white font-medium bg-gray-700 px-3 py-3 rounded-lg text-center">
                5V
              </div>
            </div>

            <!-- Arkaplan Rengi -->
            <div>
              <label class="block text-gray-300 text-sm mb-2 font-medium">Arkaplan Rengi</label>
              <div class="flex gap-2">
                <button 
                  @click="setBackground('light')"
                  class="flex-1 h-10 bg-gray-100 rounded-lg border-2"
                  :class="{'border-green-500': !isDarkBackground, 'border-transparent': isDarkBackground}"
                ></button>
                <button 
                  @click="setBackground('dark')"
                  class="flex-1 h-10 bg-gray-900 rounded-lg border-2"
                  :class="{'border-green-500': isDarkBackground, 'border-transparent': !isDarkBackground}"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobil Ayarlar Modal -->
      <div 
        v-if="showMobileSettings"
        class="absolute inset-0 bg-black bg-opacity-50 z-50 lg:hidden flex items-center justify-center p-4"
        @click.self="showMobileSettings = false"
      >
        <div class="bg-gray-800 rounded-xl w-full max-w-md max-h-[66vh] overflow-y-auto">
          <div class="p-5">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-white text-lg font-medium">Ayarlar</h3>
              <button 
                @click="showMobileSettings = false"
                class="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Malzeme Seçimi -->
              <div>
                <label class="block text-gray-300 text-sm mb-2 font-medium">Malzeme</label>
                <select 
                  v-model="selectedMaterial"
                  class="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <optgroup label="İletkenler">
                    <option value="silver">Gümüş (En iyi iletken)</option>
                    <option value="copper">Bakır (Mükemmel iletken)</option>
                    <option value="gold">Altın (Çok iyi iletken)</option>
                    <option value="aluminum">Alüminyum (Çok iyi iletken)</option>
                    <option value="iron">Demir (İyi iletken)</option>
                  </optgroup>
                  <optgroup label="Yarı İletkenler">
                    <option value="germanium">Germanyum (Yarı iletken)</option>
                    <option value="silicon">Silikon (Yarı iletken)</option>
                    <option value="galliumArsenide">Galyum Arsenid (Yarı iletken)</option>
                    <option value="seleniumSulfide">Selenyum Sülfür (Yarı iletken)</option>
                  </optgroup>
                  <optgroup label="Yalıtkanlar">
                    <option value="rubber">Kauçuk (Yalıtkan)</option>
                    <option value="wood">Ahşap (Yalıtkan)</option>
                    <option value="glass">Cam (Yalıtkan)</option>
                    <option value="plastic">Plastik (Yalıtkan)</option>
                    <option value="ceramic">Seramik (Yalıtkan)</option>
                    <option value="diamond">Elmas (Mükemmel yalıtkan)</option>
                  </optgroup>
                </select>
              </div>

              <!-- Voltaj Göstergesi -->
              <div>
                <label class="block text-gray-300 text-sm mb-2 font-medium">Voltaj</label>
                <div class="text-white font-medium bg-gray-700 px-3 py-3 rounded-lg text-center">
                  5V
                </div>
              </div>

              <!-- Arkaplan Rengi -->
              <div>
                <label class="block text-gray-300 text-sm mb-2 font-medium">Arkaplan Rengi</label>
                <div class="flex gap-2">
                  <button 
                    @click="setBackground('light')"
                    class="flex-1 h-10 bg-gray-100 rounded-lg border-2"
                    :class="{'border-green-500': !isDarkBackground, 'border-transparent': isDarkBackground}"
                  ></button>
                  <button 
                    @click="setBackground('dark')"
                    class="flex-1 h-10 bg-gray-900 rounded-lg border-2"
                    :class="{'border-green-500': isDarkBackground, 'border-transparent': !isDarkBackground}"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import Matter from 'matter-js';

// Reactive state
const simulationContainer = ref(null);
const selectedMaterial = ref('copper');
const voltage = ref(5);
const isPowerOn = ref(false);

// Yeni state'ler
const showMobileSettings = ref(false);
const isDarkBackground = ref(false);

// Material properties
const materials = {
  copper: {
    name: 'Bakır',
    type: 'conductor',
    resistance: 0.5,
    color: '#b87333',
    description: 'Mükemmel iletken'
  },
  silver: {
    name: 'Gümüş',
    type: 'conductor',
    resistance: 0.3,
    color: '#C0C0C0',
    description: 'En iyi iletken'
  },
  gold: {
    name: 'Altın',
    type: 'conductor',
    resistance: 0.4,
    color: '#FFD700',
    description: 'Çok iyi iletken'
  },
  aluminum: {
    name: 'Alüminyum',
    type: 'conductor',
    resistance: 0.8,
    color: '#a5a5a5',
    description: 'Çok iyi iletken'
  },
  iron: {
    name: 'Demir',
    type: 'conductor',
    resistance: 2.5,
    color: '#71797E',
    description: 'İyi iletken'
  },
  silicon: {
    name: 'Silikon',
    type: 'semiconductor',
    resistance: 100,
    color: '#4a4a4a',
    description: 'Yarı iletken'
  },
  germanium: {
    name: 'Germanyum',
    type: 'semiconductor',
    resistance: 60,
    color: '#6a6a6a',
    description: 'Yarı iletken'
  },
  galliumArsenide: {
    name: 'Galyum Arsenid',
    type: 'semiconductor',
    resistance: 80,
    color: '#5D3954',
    description: 'Yarı iletken'
  },
  seleniumSulfide: {
    name: 'Selenyum Sülfür',
    type: 'semiconductor',
    resistance: 120,
    color: '#8B4513',
    description: 'Yarı iletken'
  },
  rubber: {
    name: 'Kauçuk',
    type: 'insulator',
    resistance: 10000,
    color: '#1a1a1a',
    description: 'Yalıtkan'
  },
  glass: {
    name: 'Cam',
    type: 'insulator',
    resistance: 20000,
    color: '#88ccff',
    description: 'Yalıtkan'
  },
  wood: {
    name: 'Ahşap',
    type: 'insulator',
    resistance: 15000,
    color: '#8B4513',
    description: 'Yalıtkan'
  },
  plastic: {
    name: 'Plastik',
    type: 'insulator',
    resistance: 30000,
    color: '#F0E68C',
    description: 'Yalıtkan'
  },
  ceramic: {
    name: 'Seramik',
    type: 'insulator',
    resistance: 25000,
    color: '#E5D3B3',
    description: 'Yalıtkan'
  },
  diamond: {
    name: 'Elmas',
    type: 'insulator',
    resistance: 50000,
    color: '#B9F2FF',
    description: 'Mükemmel yalıtkan'
  }
};

// Matter.js variables
let Engine = Matter.Engine;
let Render = Matter.Render;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;
let Composite = Matter.Composite;

let engine = null;
let render = null;
let circuit = null;
let material = null;
let electrons = [];
let battery = null;
let bulb = null;
let animationId = null;

// Computed properties
const resistance = computed(() => {
  return materials[selectedMaterial.value].resistance.toFixed(1);
});

const current = computed(() => {
  if (!isPowerOn.value) {
    // Güç kapalıyken de potansiyel akımı göster (malzeme tipine göre)
    const type = materials[selectedMaterial.value].type;
    if (type === 'conductor') return '0.00 A';
    if (type === 'semiconductor') return '0.00 A';
    return '0.00 A';
  }
  
  // Ohm kanununa göre akım hesapla: I = V/R
  const voltage = 5; // Sabit 5V
  const resistance = materials[selectedMaterial.value].resistance;
  
  // Direnç değerine göre akım hesapla
  let currentValue = voltage / resistance;
  
  // Akım değerini formatlama
  if (currentValue >= 1) {
    return currentValue.toFixed(2) + ' A';
  } else if (currentValue >= 0.001) {
    return (currentValue * 1000).toFixed(2) + ' mA';
  } else {
    return (currentValue * 1000000).toFixed(2) + ' μA';
  }
});

const conductivity = computed(() => {
  const type = materials[selectedMaterial.value].type;
  if (type === 'conductor') return 'Yüksek';
  if (type === 'semiconductor') return 'Orta';
  return 'Düşük';
});

const resistanceColor = computed(() => {
  const type = materials[selectedMaterial.value].type;
  if (type === 'conductor') return 'text-green-600';
  if (type === 'semiconductor') return 'text-red-600';
  return 'text-red-600';
});

const currentColor = computed(() => {
  // Güç kapalı olsa bile renk göster
  if (!isPowerOn.value) {
    const type = materials[selectedMaterial.value].type;
    if (type === 'conductor') return 'text-green-600';
    if (type === 'semiconductor') return 'text-amber-600';
    return 'text-red-600';
  }
  
  // Akım değerini analiz et
  const resistance = materials[selectedMaterial.value].resistance;
  const currentValue = 5 / resistance; // Ohm kanunu: I = V/R
  
  if (currentValue > 1) return 'text-green-600';
  if (currentValue > 0.01) return 'text-amber-600';
  return 'text-red-600';
});

const conductivityColor = computed(() => {
  const type = materials[selectedMaterial.value].type;
  if (type === 'conductor') return 'text-green-600';
  if (type === 'semiconductor') return 'text-red-600';
  return 'text-red-600';
});

const resistanceColorBg = computed(() => {
  const type = materials[selectedMaterial.value].type;
  if (type === 'conductor') return 'bg-green-600';
  if (type === 'semiconductor') return 'bg-red-600';
  return 'bg-red-600';
});

const currentColorBg = computed(() => {
  // Güç kapalı olsa bile arka plan rengi göster
  if (!isPowerOn.value) {
    const type = materials[selectedMaterial.value].type;
    if (type === 'conductor') return 'bg-green-600';
    if (type === 'semiconductor') return 'bg-amber-600';
    return 'bg-red-600';
  }
  
  // Akım değerini analiz et
  const resistance = materials[selectedMaterial.value].resistance;
  const currentValue = 5 / resistance; // Ohm kanunu: I = V/R
  
  if (currentValue > 1) return 'bg-green-600';
  if (currentValue > 0.01) return 'bg-amber-600';
  return 'bg-red-600';
});

const conductivityColorBg = computed(() => {
  const type = materials[selectedMaterial.value].type;
  if (type === 'conductor') return 'bg-green-600';
  if (type === 'semiconductor') return 'bg-red-600';
  return 'bg-red-600';
});

// Setup simulation
onMounted(() => {
  initSimulation();
});

// Cleanup
onBeforeUnmount(() => {
  cleanupSimulation();
});

// Watch for changes
watch([selectedMaterial], () => {
  if (isPowerOn.value) {
    clearElectrons();
    updateMaterial();
    if (isPowerOn.value) {
      createElectrons();
    }
  }
});

// Initialize the simulation
function initSimulation() {
  const container = simulationContainer.value;
  
  if (!container) return;
  
  // Create engine
  engine = Engine.create({
    gravity: { x: 0, y: 0 } // No gravity
  });
  
  // Create renderer
  render = Render.create({
    element: container,
    engine: engine,
    options: {
      width: container.clientWidth,
      height: container.clientHeight,
      wireframes: false,
      background: '#f9fafb', // bg-gray-50 for light mode
      showAngleIndicator: false
    }
  });
  
  // Check if dark mode is preferred
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDarkMode) {
    render.options.background = '#1f2937'; // bg-gray-800 for dark mode
  }
  
  // Create circuit elements
  createCircuit();
  
  // Start the engine and renderer
  Matter.Runner.run(engine);
  Render.run(render);
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Start animation loop
  animate();
}

function createCircuit() {
  // Calculate dimensions based on container
  const width = render.options.width;
  const height = render.options.height;
  const wallThickness = 20;
  const circuitThickness = 16;
  
  // Check if dark mode is preferred
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Create walls (same color as background)
  const wallOptions = {
    isStatic: true,
    render: {
      fillStyle: prefersDarkMode ? '#1f2937' : '#f9fafb' // Match background color
    }
  };
  
  const walls = [
    // Top wall
    Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, wallOptions),
    // Bottom wall
    Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, wallOptions),
    // Left wall
    Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, wallOptions),
    // Right wall
    Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, wallOptions)
  ];
  
  // Create circuit (the wire)
  const circuitOptions = {
    isStatic: true,
    render: {
      fillStyle: prefersDarkMode ? '#4b5563' : '#9ca3af' // gray-600 or gray-400
    }
  };
  
  // Define circuit dimensions for a perfect square
  const circuitMargin = 80; // Margin from edges
  const circuitLeft = 120; // Left position
  const circuitRight = width - 120; // Right position
  const circuitTop = circuitMargin; // Top position
  const circuitBottom = height - circuitMargin; // Bottom position
  
  // Bottom wire - extends fully from left to right
  const bottomWire = Bodies.rectangle(
    width / 2, 
    circuitBottom, 
    circuitRight - circuitLeft + circuitThickness, // Full width including the thickness of vertical wires
    circuitThickness, 
    circuitOptions
  );
  
  // Top wire - extends fully from left to right
  const topWire = Bodies.rectangle(
    width / 2, 
    circuitTop, 
    circuitRight - circuitLeft + circuitThickness, // Full width including the thickness of vertical wires
    circuitThickness, 
    circuitOptions
  );
  
  // Left wire - extends fully from top to bottom
  const leftWire = Bodies.rectangle(
    circuitLeft, 
    (circuitTop + circuitBottom) / 2, 
    circuitThickness, 
    circuitBottom - circuitTop + circuitThickness, // Full height including the thickness of horizontal wires
    circuitOptions
  );
  
  // Right wire - extends fully from top to bottom
  const rightWire = Bodies.rectangle(
    circuitRight, 
    (circuitTop + circuitBottom) / 2, 
    circuitThickness, 
    circuitBottom - circuitTop + circuitThickness, // Full height including the thickness of horizontal wires
    circuitOptions
  );
  
  // Create material section (right side)
  updateMaterial();
  
  // Create battery (bottom left)
  const batteryWidth = 60;
  const batteryHeight = 100;
  battery = Bodies.rectangle(
    circuitLeft, 
    circuitBottom - batteryHeight / 2 - circuitThickness / 2, 
    batteryWidth, 
    batteryHeight, 
    {
      isStatic: true,
      render: {
        fillStyle: '#3B82F6', // green-500
        sprite: {
          texture: createBatteryTexture(batteryWidth, batteryHeight, 5), // Fixed 5V
          xScale: 1,
          yScale: 1
        }
      }
    }
  );
  
  // Create light bulb (top right)
  const bulbRadius = 40;
  bulb = Bodies.circle(
    circuitRight, 
    circuitTop, // Position exactly at the top wire's y-position
    bulbRadius, 
    {
      isStatic: true,
      render: {
        fillStyle: isPowerOn.value ? '#FBBF24' : '#9ca3af' // Yellow or gray-400
      }
    }
  );
  
  // Add all elements to the world
  circuit = Composite.create();
  Composite.add(circuit, [...walls, bottomWire, topWire, leftWire, rightWire, battery, bulb]);
  World.add(engine.world, circuit);
}

function updateMaterial() {
  // Remove old material if exists
  if (material) {
    World.remove(engine.world, material);
  }
  
  // We're not creating a visible material rectangle anymore
  // but we'll still track the material type for simulation purposes
  material = {
    isMaterial: true,
    materialType: selectedMaterial.value
  };
}

function createBatteryTexture(width, height, voltageValue) {
  // Create canvas for drawing battery
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Draw battery body
  ctx.fillStyle = '#3B82F6'; // green-500
  ctx.fillRect(0, 0, width, height);
  
  // Draw battery terminals
  ctx.fillStyle = '#1F2937'; // Gray-800
  ctx.fillRect(width * 0.3, 0, width * 0.4, height * 0.1);
  
  // Draw voltage text
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${voltageValue}V`, width / 2, height / 2);
  
  // Convert to data URL
  return canvas.toDataURL();
}

function createElectrons() {
  clearElectrons();
  
  const width = render.options.width;
  const height = render.options.height;
  const materialType = materials[selectedMaterial.value].type;
  const materialResistance = materials[selectedMaterial.value].resistance;
  
  // Define circuit dimensions
  const circuitMargin = 80;
  const circuitLeft = 120;
  const circuitRight = width - 120;
  const circuitBottom = height - circuitMargin;
  
  // Determine electron count and speed based on material type and resistance
  let electronCount = 0;
  let electronSpeed = 0;
  
  if (materialType === 'conductor') {
    // İletkenler için direnç değerine göre elektron sayısı ve hızı ayarla
    electronCount = 40 - (materialResistance * 10);
    electronSpeed = 5 - materialResistance;
  } else if (materialType === 'semiconductor') {
    // Yarı iletkenler için direnç değerine göre elektron sayısı ve hızı ayarla
    electronCount = 20 - (materialResistance / 20);
    electronSpeed = 2.5 - (materialResistance / 100);
  } else {
    // Yalıtkanlar için direnç değerine göre elektron sayısı ve hızı ayarla
    electronCount = 5 - (materialResistance / 20000);
    electronSpeed = 0.5 - (materialResistance / 100000);
  }
  
  // Minimum değerleri sağla
  electronCount = Math.max(1, Math.ceil(electronCount));
  electronSpeed = Math.max(0.1, electronSpeed);
  
  // Create electrons - distribute them along the bottom wire instead of under the battery
  for (let i = 0; i < electronCount; i++) {
    // Start position at random point along the bottom wire, but not under the battery
    const startX = circuitLeft + 60 + Math.random() * (circuitRight - circuitLeft - 120); // Start after the battery area
    const startY = circuitBottom;
    
    const electron = Bodies.circle(
      startX,
      startY,
      4,
      {
        frictionAir: 0,
        friction: 0,
        restitution: 1,
        isElectron: true,
        render: {
          fillStyle: '#3b82f6', // Blue-500
          strokeStyle: '#60a5fa', // Blue-400
          lineWidth: 1
        }
      }
    );
    
    // Give it initial velocity - moving right along the bottom wire
    Body.setVelocity(electron, { x: electronSpeed, y: 0 });
    
    electrons.push(electron);
    World.add(engine.world, electron);
  }
}

function clearElectrons() {
  electrons.forEach(electron => {
    World.remove(engine.world, electron);
  });
  
  electrons = [];
}

function animate() {
  animationId = requestAnimationFrame(animate);
  
  // Update electrons movement
  electrons.forEach(electron => {
    // Get current position
    const { x, y } = electron.position;
    const width = render.options.width;
    const height = render.options.height;
    
    // Define circuit path points using the same constants as in createCircuit
    const circuitMargin = 80;
    const circuitLeft = 120;
    const circuitRight = width - 120;
    const circuitTop = circuitMargin;
    const circuitBottom = height - circuitMargin;
    const circuitThickness = 16;
    
    // Get material properties
    const materialType = materials[selectedMaterial.value].type;
    const materialResistance = materials[selectedMaterial.value].resistance;
    
    // Calculate base speed based on material resistance
    let baseSpeed = 2;
    if (materialType === 'conductor') {
      baseSpeed = 5 - materialResistance;
    } else if (materialType === 'semiconductor') {
      baseSpeed = 2.5 - (materialResistance / 100);
    } else {
      baseSpeed = 0.5 - (materialResistance / 100000);
    }
    baseSpeed = Math.max(0.1, baseSpeed);
    
    // Update direction based on position in circuit
    if (y > circuitBottom - circuitThickness/2 && y < circuitBottom + circuitThickness/2) {
      // Bottom wire moving right
      Body.setVelocity(electron, { x: baseSpeed, y: 0 });
    } else if (x > circuitRight - circuitThickness/2 && x < circuitRight + circuitThickness/2) {
      // Right wire moving up
      Body.setVelocity(electron, { x: 0, y: -baseSpeed });
      
      // Apply random movement for insulators and semiconductors
      if (materialType === 'insulator') {
        if (Math.random() < 0.2) {
          Body.setVelocity(electron, { 
            x: (Math.random() - 0.5) * baseSpeed, 
            y: -baseSpeed * 0.1 
          });
        }
      } else if (materialType === 'semiconductor') {
        if (Math.random() < 0.1) {
          Body.setVelocity(electron, { 
            x: (Math.random() - 0.5) * baseSpeed * 0.5, 
            y: -baseSpeed * 0.5 
          });
        }
      }
    } else if (y > circuitTop - circuitThickness/2 && y < circuitTop + circuitThickness/2) {
      // Top wire moving left
      Body.setVelocity(electron, { x: -baseSpeed, y: 0 });
    } else if (x > circuitLeft - circuitThickness/2 && x < circuitLeft + circuitThickness/2) {
      // Left wire moving down
      Body.setVelocity(electron, { x: 0, y: baseSpeed });
    }
    
    // Teleport if out of bounds or if electron gets stuck
    if (x < 0 || x > width || y < 0 || y > height || 
        (Math.abs(electron.velocity.x) < 0.1 && Math.abs(electron.velocity.y) < 0.1)) {
      // Place it on the bottom wire after the battery
      Body.setPosition(electron, { 
        x: circuitLeft + 60 + Math.random() * (circuitRight - circuitLeft - 120), 
        y: circuitBottom 
      });
      // Set proper velocity for bottom wire
      Body.setVelocity(electron, { x: baseSpeed, y: 0 });
    }
  });
  
  // Update bulb brightness based on current
  if (bulb) {
    const currentValue = parseFloat(current.value);
    const materialResistance = materials[selectedMaterial.value].resistance;
    
    // Direnç değerine göre parlaklık hesapla
    let brightness = 0;
    if (isPowerOn.value) {
      if (materialResistance < 1) {
        // İletkenler için maksimum parlaklık
        brightness = 1.0;
      } else if (materialResistance < 1000) {
        // Yarı iletkenler için orta parlaklık
        brightness = 0.5 - (materialResistance / 2000);
      } else {
        // Yalıtkanlar için minimum parlaklık
        brightness = 0.05 - (materialResistance / 500000);
      }
      brightness = Math.max(0.01, Math.min(1, brightness));
    }
    
    const r = Math.floor(251 * brightness);
    const g = Math.floor(191 * brightness);
    const b = Math.floor(36 * brightness);
    
    if (isPowerOn.value) {
      bulb.render.fillStyle = `rgb(${r}, ${g}, ${b})`;
      
      // Add glow effect for the bulb when on
      if (render && render.context) {
        const ctx = render.context;
        const { x, y } = bulb.position;
        const radius = bulb.circleRadius;
        
        // Save context state
        ctx.save();
        
        // Create radial gradient for glow effect
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 2);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.8})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        // Draw glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Restore context state
        ctx.restore();
      }
    } else {
      // Check if dark mode is preferred
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      bulb.render.fillStyle = prefersDarkMode ? '#4B5563' : '#9ca3af'; // Gray-600 or Gray-400
    }
  }
}

function handleResize() {
  if (!render || !simulationContainer.value) return;
  
  // Update canvas size
  render.options.width = simulationContainer.value.clientWidth;
  render.options.height = simulationContainer.value.clientHeight;
  render.canvas.width = simulationContainer.value.clientWidth;
  render.canvas.height = simulationContainer.value.clientHeight;
  
  // Recreate circuit with new dimensions
  Composite.clear(engine.world);
  createCircuit();
  
  // Update material properties without creating a visible rectangle
  updateMaterial();
  
  if (isPowerOn.value) {
    createElectrons();
  }
}

function togglePower() {
  isPowerOn.value = !isPowerOn.value;
  
  if (isPowerOn.value) {
    createElectrons();
  } else {
    clearElectrons();
  }
}

function cleanupSimulation() {
  // Stop animation
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // Remove resize listener
  window.removeEventListener('resize', handleResize);
  
  // Stop renderer and engine
  if (render) {
    Render.stop(render);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render = null;
  }
  
  if (engine) {
    Matter.Runner.stop(engine);
    engine = null;
  }
}

// Arkaplan rengini değiştirme fonksiyonu
function setBackground(mode) {
  isDarkBackground.value = mode === 'dark';
  if (render) {
    render.options.background = mode === 'dark' ? '#1f2937' : '#f9fafb';
  }
}
</script>