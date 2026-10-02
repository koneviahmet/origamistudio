<template>
  <div class="min-h-screen w-full bg-gray-900 p-3 text-white relative overflow-auto">
    <div class="mx-auto max-w-6xl">
      
      <!-- Mobil ayarlar butonu -->
      <div class="md:hidden mb-3 absolute top-4 left-4 z-10">
        <button 
          @click="showMobileSettings = !showMobileSettings" 
          class="bg-gray-800 hover:bg-gray-700 p-2 rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      <!-- Mobil ayarlar modal -->
      <div 
        v-if="showMobileSettings" 
        class="md:hidden fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
        @click.self="showMobileSettings = false"
      >
        <div class="bg-gray-800 rounded-lg p-4 w-full max-w-md max-h-[66vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Ayarlar</h2>
            <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Mobil ayarlar içeriği -->
          <div class="space-y-4">
            <div>
              <label class="block mb-2 text-gray-300">Cisim:</label>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="(item, index) in objects" 
                  :key="index" 
                  @click="selectedObject = item"
                  :class="['px-3 py-1 rounded-md text-sm', 
                    selectedObject === item 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600']"
                >
                  {{ item.name }} ({{ item.mass }} kg)
                </button>
              </div>
            </div>
            
            <div>
              <label class="block mb-2 text-gray-300">Gezegen:</label>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="(planet, index) in planets" 
                  :key="index" 
                  @click="selectedPlanet = planet"
                  :class="['px-3 py-1 rounded-md text-sm', 
                    selectedPlanet === planet 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600']"
                >
                  {{ planet.name }}
                </button>
              </div>
            </div>
            
            <div>
              <label class="block mb-2 text-gray-300">Arkaplan Rengi:</label>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="bg in backgroundColors" 
                  :key="bg.name" 
                  @click="backgroundColor = bg.value"
                  class="w-8 h-8 rounded-full border-2"
                  :class="backgroundColor === bg.value ? 'border-white' : 'border-transparent'"
                  :style="{ backgroundColor: bg.value }"
                ></button>
              </div>
            </div>
            
            <div class="pt-2">
              <button 
                @click="resetSettings" 
                class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                v-if="isSettingsChanged"
              >
                Ayarları Sıfırla
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex flex-col md:flex-row gap-3">
        <!-- Simulation Canvas -->
        <div class="flex-grow bg-gray-800 p-4 rounded-md">
          <div 
            class="relative rounded-md overflow-hidden" 
            ref="simulationContainer" 
            :style="{ 'background-color': backgroundColor, 'min-height': '350px' }"
          >
            <div class="absolute inset-0" ref="simulationCanvas"></div>
            
            <!-- Animation Controls -->
            <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button 
                @click="dropObject"
                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                :disabled="!selectedObject || !selectedPlanet || !simulationReady"
                :class="{'opacity-50 cursor-not-allowed': !selectedObject || !selectedPlanet || !simulationReady}"
              >
                {{ simulationReady ? 'Cismi Bırak' : 'Yükleniyor...' }}
              </button>
            </div>
            
            <!-- Information Overlay -->
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded p-2 text-sm">
              <p>{{ selectedPlanet ? selectedPlanet.name : 'Seçilmedi' }} ({{ selectedPlanet ? selectedPlanet.gravity + ' m/s²' : '?' }})</p>
            </div>
          </div>
          
          <!-- Comparative Weight Chart -->
          <div class="mt-3 bg-gray-800 p-4 rounded-md">
            <h2 class="text-lg mb-3 text-white">Karşılaştırmalı Ağırlık</h2>
            <div class="overflow-x-auto">
              <div class="min-w-max">
                <div v-if="selectedObject" class="flex items-end h-48 space-x-3 pb-2">
                  <div v-for="planet in planets" :key="planet.name" class="flex flex-col items-center">
                    <div 
                      class="w-12 rounded-t transition-all duration-200" 
                      :style="{
                        height: `${calculateBarHeight(selectedObject.mass * planet.gravity)}px`,
                        backgroundColor: planet === selectedPlanet ? '#3b82f6' : '#1e3a8a'
                      }"
                    ></div>
                    <div class="mt-2 text-center">
                      <p class="text-xs text-gray-400">{{ planet.name }}</p>
                      <p class="text-sm" :class="planet === selectedPlanet ? 'text-white' : 'text-gray-400'">
                        {{ (selectedObject.mass * planet.gravity).toFixed(0) }} N
                      </p>
                    </div>
                  </div>
                </div>
                <div v-else class="flex justify-center items-center h-32">
                  <p class="text-gray-400">Lütfen bir cisim seçin.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Desktop Controls Panel - Right Side -->
        <div class="md:w-1/3 hidden md:block bg-gray-800 p-4 rounded-md">
          <div class="mb-4">
            <label class="block mb-2 text-gray-300">Cisim:</label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="(item, index) in objects" 
                :key="index" 
                @click="selectedObject = item"
                :class="['px-3 py-1 rounded-md text-sm', 
                  selectedObject === item 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600']"
              >
                {{ item.name }} ({{ item.mass }} kg)
              </button>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block mb-2 text-gray-300">Gezegen:</label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="(planet, index) in planets" 
                :key="index" 
                @click="selectedPlanet = planet"
                :class="['px-3 py-1 rounded-md text-sm', 
                  selectedPlanet === planet 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600']"
              >
                {{ planet.name }}
              </button>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block mb-2 text-gray-300">Arkaplan Rengi:</label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="bg in backgroundColors" 
                :key="bg.name" 
                @click="backgroundColor = bg.value"
                class="w-8 h-8 rounded-full border-2"
                :class="backgroundColor === bg.value ? 'border-white' : 'border-transparent'"
                :style="{ backgroundColor: bg.value }"
              ></button>
            </div>
          </div>
          
          <button 
            @click="resetSettings" 
            class="mb-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
            v-if="isSettingsChanged"
          >
            Ayarları Sıfırla
          </button>
          
          <div class="p-3 bg-gray-900 rounded-md">
            <h2 class="text-lg mb-2 text-white">Ağırlık Hesaplaması</h2>
            <div v-if="selectedObject && selectedPlanet" class="text-white">
              <div class="space-y-1">
                <p><span class="text-gray-400">Cisim:</span> {{ selectedObject.name }} ({{ selectedObject.mass }} kg)</p>
                <p><span class="text-gray-400">Gezegen:</span> {{ selectedPlanet.name }} ({{ selectedPlanet.gravity }} m/s²)</p>
                <p class="text-xl font-bold mt-2 text-blue-400">
                  {{ (selectedObject.mass * selectedPlanet.gravity).toFixed(1) }} N
                </p>
              </div>
            </div>
            <div v-else>
              <p class="text-gray-400">Lütfen bir cisim ve gezegen seçin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import Matter from 'matter-js'

// Define planets with their gravitational acceleration
const planets = [
  { name: 'Merkür', gravity: 3.7 },
  { name: 'Venüs', gravity: 8.9 },
  { name: 'Dünya', gravity: 9.8 },
  { name: 'Ay', gravity: 1.6 },
  { name: 'Mars', gravity: 3.7 },
  { name: 'Jüpiter', gravity: 24.8 },
  { name: 'Satürn', gravity: 10.4 },
  { name: 'Uranüs', gravity: 8.9 },
  { name: 'Neptün', gravity: 11.2 }
]

// Define objects with their masses
const objects = [
  { name: 'İnsan', mass: 70, radius: 25, color: '#F87171' },
  { name: 'Taş', mass: 20, radius: 15, color: '#9CA3AF' },
  { name: 'Elma', mass: 0.2, radius: 10, color: '#34D399' },
  { name: 'Araba', mass: 1500, radius: 30, color: '#60A5FA' }
]

// Background color options
const backgroundColors = [
  { name: 'Siyah', value: '#030712' },
  { name: 'Lacivert', value: '#172554' },
  { name: 'Koyu Gri', value: '#1F2937' },
  { name: 'Koyu Mavi', value: '#1E3A8A' },
  { name: 'Koyu Yeşil', value: '#064E3B' },
  { name: 'Koyu Mor', value: '#4C1D95' }
]

// Reactive references
const defaultPlanet = planets[2] // Default: Earth
const defaultObject = objects[0] // Default: Human
const defaultBgColor = backgroundColors[0].value

const selectedPlanet = ref(defaultPlanet)
const selectedObject = ref(defaultObject)
const backgroundColor = ref(defaultBgColor)
const simulationCanvas = ref(null)
const simulationContainer = ref(null)
const simulationReady = ref(false)
const showMobileSettings = ref(false)

// Computed property to check if settings are changed from defaults
const isSettingsChanged = computed(() => {
  return selectedPlanet.value !== defaultPlanet || 
         selectedObject.value !== defaultObject || 
         backgroundColor.value !== defaultBgColor
})

// Reset settings to defaults
const resetSettings = () => {
  selectedPlanet.value = defaultPlanet
  selectedObject.value = defaultObject
  backgroundColor.value = defaultBgColor
}

// Matter.js variables
let engine = null
let render = null
let world = null
let borders = []
let runner = null

// Initialize the physics world
const initSimulation = async () => {
  if (!simulationCanvas.value || !simulationContainer.value) return

  try {
    // Clean up any existing simulation
    cleanupSimulation()
    
    // Wait for DOM update
    await nextTick()
    
    // Create engine
    engine = Matter.Engine.create({
      gravity: {
        x: 0,
        y: selectedPlanet.value.gravity * 0.01, // Scale down gravity for better visuals
        scale: 0.001
      }
    })
    
    world = engine.world
    
    // Create renderer
    render = Matter.Render.create({
      element: simulationCanvas.value,
      engine: engine,
      options: {
        width: simulationContainer.value.clientWidth,
        height: simulationContainer.value.clientHeight,
        wireframes: false,
        background: backgroundColor.value, // Use selected background color
        pixelRatio: window.devicePixelRatio
      }
    })
    
    // Create borders
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: backgroundColor.value === '#030712' ? '#111827' : backgroundColor.value, // Arka planla aynı renkte duvarlar
        lineWidth: 0
      }
    }
    
    // Floor
    borders.push(Matter.Bodies.rectangle(
      render.options.width / 2,
      render.options.height,
      render.options.width, 
      20, 
      wallOptions
    ))
    
    // Left wall
    borders.push(Matter.Bodies.rectangle(
      0, 
      render.options.height / 2, 
      20, 
      render.options.height, 
      wallOptions
    ))
    
    // Right wall
    borders.push(Matter.Bodies.rectangle(
      render.options.width, 
      render.options.height / 2, 
      20, 
      render.options.height, 
      wallOptions
    ))
    
    // Ceiling
    borders.push(Matter.Bodies.rectangle(
      render.options.width / 2, 
      0, 
      render.options.width, 
      20, 
      wallOptions
    ))
    
    // Add borders to world
    Matter.Composite.add(world, borders)
    
    // Create runner
    runner = Matter.Runner.create()
    
    // Run the engine
    Matter.Runner.run(runner, engine)
    Matter.Render.run(render)
    
    simulationReady.value = true
    
    console.log('Simulation initialized successfully')
  } catch (error) {
    console.error('Failed to initialize simulation:', error)
    simulationReady.value = false
  }
}

// Cleanup simulation resources
const cleanupSimulation = () => {
  if (runner) {
    Matter.Runner.stop(runner)
    runner = null
  }
  
  if (render) {
    Matter.Render.stop(render)
    if (render.canvas && render.canvas.remove) {
      render.canvas.remove()
    }
    render.canvas = null
    render.context = null
    render = null
  }
  
  if (engine) {
    Matter.Engine.clear(engine)
    engine = null
  }
  
  world = null
  borders = []
  simulationReady.value = false
}

// Reset simulation when planet, object or background changes
watch([selectedPlanet, selectedObject, backgroundColor], () => {
  if (simulationReady.value) {
    // Sıfırlama işlemi
    initSimulation()
  }
})

// Drop the selected object
const dropObject = () => {
  if (!engine || !world || !selectedObject.value || !selectedPlanet.value || !simulationReady.value) return
  
  try {
    // Calculate position
    const x = render.options.width / 2
    const y = render.options.height / 4
    
    // Create object with minimal visual properties
    const obj = Matter.Bodies.circle(
      x, y, 
      selectedObject.value.radius, 
      {
        mass: selectedObject.value.mass,
        restitution: 0.4,
        friction: 0.05,
        frictionAir: 0.001,
        render: {
          fillStyle: selectedObject.value.color,
          strokeStyle: '#ffffff',
          lineWidth: 1
        }
      }
    )
    
    // Add to world
    Matter.Composite.add(world, obj)
    
    // Clear old objects after some time to prevent crowding
    setTimeout(() => {
      const bodies = Matter.Composite.allBodies(world)
      for (let i = 0; i < bodies.length; i++) {
        if (!bodies[i].isStatic && bodies[i] !== obj) {
          Matter.Composite.remove(world, bodies[i])
        }
      }
    }, 5000)
  } catch (error) {
    console.error('Error dropping object:', error)
  }
}

// Calculate bar height for chart
const calculateBarHeight = (weight) => {
  // Max height of bars
  const maxHeight = 150;
  
  // Dinamik maksimum ağırlık hesaplaması
  // Şu anki maksimum ağırlığı hesapla (araba ve Jüpiter seçildiğinde en yüksek)
  const currentMaxWeight = selectedObject.value ? 
    Math.max(...planets.map(planet => selectedObject.value.mass * planet.gravity)) : 2000;
  
  // Maksimum ağırlık en az 2000 olsun (küçük nesneler için grafik çok kısa olmasın)
  const effectiveMaxWeight = Math.max(currentMaxWeight, 2000);
  
  // Her çubuğun en az 5 piksel yüksekliğe sahip olmasını sağla
  // ve maksimum yüksekliği aşmamasını sağla
  return Math.min(Math.max((weight / effectiveMaxWeight) * maxHeight, 5), maxHeight);
}

// Initialize simulation on mount
onMounted(async () => {
  try {
    window.addEventListener('resize', handleResize)
    
    // Allow time for DOM to render fully
    await nextTick()
    setTimeout(() => {
      initSimulation()
    }, 300)
  } catch (error) {
    console.error('Error during initialization:', error)
  }
})

// Clean up on unmount
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanupSimulation()
})

// Handle window resize
const handleResize = () => {
  if (!render || !simulationContainer.value) return
  
  try {
    // Update render size
    render.options.width = simulationContainer.value.clientWidth
    render.options.height = simulationContainer.value.clientHeight
    
    // Update canvas size
    render.canvas.width = render.options.width
    render.canvas.height = render.options.height
    
    // Update borders
    if (borders.length > 0) {
      Matter.Body.setPosition(borders[0], Matter.Vector.create(render.options.width / 2, render.options.height))
      Matter.Body.setPosition(borders[1], Matter.Vector.create(0, render.options.height / 2))
      Matter.Body.setPosition(borders[2], Matter.Vector.create(render.options.width, render.options.height / 2))
      Matter.Body.setPosition(borders[3], Matter.Vector.create(render.options.width / 2, 0))
      
      // Update sizes
      Matter.Body.setVertices(borders[0], Matter.Bodies.rectangle(render.options.width / 2, render.options.height, render.options.width, 20).vertices)
      Matter.Body.setVertices(borders[1], Matter.Bodies.rectangle(0, render.options.height / 2, 20, render.options.height).vertices)
      Matter.Body.setVertices(borders[2], Matter.Bodies.rectangle(render.options.width, render.options.height / 2, 20, render.options.height).vertices)
      Matter.Body.setVertices(borders[3], Matter.Bodies.rectangle(render.options.width / 2, 0, render.options.width, 20).vertices)
    }
  } catch (error) {
    console.error('Error during resize:', error)
    // Try to reinitialize simulation if resize fails badly
    setTimeout(() => {
      initSimulation()
    }, 500)
  }
}
</script>
  
 
 