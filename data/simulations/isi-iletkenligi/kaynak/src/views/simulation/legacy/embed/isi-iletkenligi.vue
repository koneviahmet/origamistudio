<template>
  <div class="min-h-screen bg-gray-500 p-4 flex flex-col md:flex-row gap-4">
    <!-- Simulation container -->
    <div class="relative flex-grow w-full bg-gray-500 rounded-xl shadow-xl overflow-hidden p-10">
      <!-- Canvas for Matter.js -->
      <canvas ref="canvas" class="w-full h-full absolute inset-0"></canvas>
      <!-- Overlay canvas for heat visualization -->
      <canvas ref="heatCanvas" class="w-full h-full absolute inset-0 pointer-events-none"></canvas>


      <!-- Animation Control Buttons - Centered at the top -->
      <div class="absolute top-1/4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <!-- Material Selection Dropdown -->
        <div class="relative">
          <select 
            v-model="selectedMaterial"
            @change="changeMaterial(findMaterial(selectedMaterial))"
            class="bg-gray-700 text-white px-4 py-2 rounded-lg  appearance-none pr-10 hover:bg-slate-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="material in materials" :key="material.name" :value="material.name">
              {{ material.label }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button v-if="!isSimulationRunning" 
                @click="startSimulation" 
                class="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Başlat
        </button>
        
        <button v-else
                @click="stopSimulation" 
                class="flex items-center justify-center bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Durdur
        </button>
      </div>

      <!-- Mobile Settings Button -->
      <button @click="toggleSettings" 
              class="md:hidden absolute top-4 right-4 bg-gray-700 hover:bg-slate-600 p-2 rounded-lg text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Settings Panel -->
    <div class="fixed md:relative top-0 right-0 h-screen md:h-auto z-50 md:z-auto md:w-1/3 max-w-md transform transition-transform duration-300 ease-in-out"
         :class="[
           showSettings ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
           'bg-slate-800 rounded-xl shadow-lg overflow-hidden'
         ]">
      <!-- Close button for mobile -->
      <button @click="toggleSettings" 
              class="md:hidden absolute top-2 right-2 text-white p-2 hover:bg-slate-700 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="overflow-auto p-1 space-y-6 bg-gray-800 h-screen pt-12 md:pt-2">
        <!-- Temperature control -->
        <div class="space-y-1">
          <h3 class="text-white text-sm font-medium flex justify-between px-1">
            <div>Sıcaklık Ayarı</div>              
            <div class="text-white">{{ heatSourceTemp }}°C</div>
          </h3>
          <div class="rounded-lg p-1">
            <div class="flex items-center justify-between mb-2">
            </div>
            <div class="flex items-center gap-3">
              <span class="text-white text-sm">50°C</span>
              <input type="range" min="50" max="500" v-model.number="heatSourceTemp" 
                    class="flex-1 h-2 appearance-none cursor-pointer bg-slate-600 rounded-lg accent-indigo-500"
                    @input="updateHeatSource"
                    :disabled="isSimulationRunning">
              <span class="text-white text-sm">500°C</span>
            </div>
          </div>
        </div>

        <!-- Material info -->
        <div class="p-1 text-white space-y-2">
          <div class="flex items-center justify-between">
            <p>İletkenlik:</p>
            <div class="flex items-center gap-2">
              <span>{{ findMaterial(selectedMaterial).conductivity }}</span>
              <span class="px-2 py-1 text-xs rounded-md" 
                    :class="getConductivityClass(findMaterial(selectedMaterial).conductivity)">
                {{ getConductivityLabel(findMaterial(selectedMaterial).conductivity) }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <p>Tahmini süre:</p>
            <p>{{ formatTime(estimatedHeatingTime) }}</p>
          </div>
        </div>

        <!-- Simulation status -->
        <div class="bg-slate-700 rounded-lg p-1">
          <div class="flex items-start gap-3">
            <div class="w-3 h-3 rounded-full mt-1" 
                :class="isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'"></div>
            <div class="text-white">
              <p>{{ isSimulationRunning ? 'Simülasyon çalışıyor...' : 'Başlatmaya hazır' }}</p>
              <p v-if="timeToReachTemp" class="text-sm text-gray-400 mt-1">
                Son ısınma süresi: {{ formatTime(timeToReachTemp) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import Matter from 'matter-js';

// References for Matter.js and visualization
const canvas = ref(null);
const heatCanvas = ref(null);
let engine, render, runner;
let rod, heatSource;
let walls = [];
let heatCtx; // Heat visualization context

// Simulation control state
const isSimulationRunning = ref(false);
const simulationStatus    = ref('Simülasyon hazır. Başlatmak için "Başlat" butonuna tıklayın.');
const showSettings        = ref(false); // For mobile accordion

// Material properties
const materials = [
  { name: 'copper', label: 'Bakır', conductivity: 400, color: '#D97706', density: 0.009 },
  { name: 'aluminum', label: 'Alüminyum', conductivity: 235, color: '#D1D5DB', density: 0.0027 },
  { name: 'iron', label: 'Demir', conductivity: 80, color: '#9CA3AF', density: 0.008 },
  { name: 'wood', label: 'Ahşap', conductivity: 0.2, color: '#92400E', density: 0.0008 },
  { name: 'plastic', label: 'Plastik', conductivity: 0.1, color: '#3B82F6', density: 0.0010 }
];

// Simulation state
const selectedMaterial = ref('iron');
const heatSourceTemp = ref(200);
const ambientTemp = 25;
const rodWidth = 400;
const rodHeight = 40;

// Time tracking for heat transfer
const simulationStartTime = ref(0);
const timeToReachTemp = ref(null);
const isHeatingComplete = ref(false);
const heatingCompletionThreshold = 0.95; // 95% of the source temperature

// Temperature measurement points along the rod
const tempPoints = reactive([
  { x: 0, temp: ambientTemp, worldX: 0, worldY: 0 }, // worldX and worldY will be set during initialization
  { x: 0.25, temp: ambientTemp, worldX: 0, worldY: 0 },
  { x: 0.5, temp: ambientTemp, worldX: 0, worldY: 0 },
  { x: 0.75, temp: ambientTemp, worldX: 0, worldY: 0 },
  { x: 1, temp: ambientTemp, worldX: 0, worldY: 0 }
]);

// Heat particles for visualization
const heatParticles = reactive([]);
const maxParticles = 25;

// Flame particles for heat source
const flameParticles = reactive([]);
const maxFlameParticles = 15;

// Time tracking for simulation
let lastTime = 0;
let simulationInterval;
let canvasWidth, canvasHeight;
let centerX, centerY;

// Computed property to format heating time
const formattedHeatingTime = computed(() => {
  if (!timeToReachTemp.value) return "Isınma devam ediyor...";
  
  const seconds = timeToReachTemp.value;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} saniye`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} dakika ${remainingSeconds.toFixed(0)} saniye`;
  }
});

// Computed property to estimate heating time based on material
const estimatedHeatingTime = computed(() => {
  const material = findMaterial(selectedMaterial.value);
  const conductivity = material.conductivity;
  
  // Estimate time based on conductivity (inverse relationship)
  // Higher conductivity = faster heat transfer = less time
  // This is a more granular model for estimation
  let baseTime;
  
  if (conductivity >= 350) {
    // Very high conductivity materials (copper)
    baseTime = 3; // seconds
  } else if (conductivity >= 200) {
    // High conductivity materials (aluminum)
    baseTime = 5; // seconds
  } else if (conductivity >= 50) {
    // Medium conductivity materials (iron)
    baseTime = 15; // seconds
  } else if (conductivity >= 0.15) {
    // Low conductivity materials (wood)
    baseTime = 60; // seconds
  } else {
    // Very low conductivity materials (plastic)
    baseTime = 120; // seconds
  }
  
  // Adjust for temperature (higher temp = faster transfer)
  const tempFactor = Math.sqrt(heatSourceTemp.value / 200);
  
  return baseTime / tempFactor;
});

onMounted(() => {
  initPhysics();
  
  // Initialize visualization without starting the simulation
  updateRodVisualization();
  
  // Update status with estimated time
  updateEstimatedTime();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Handle responsive settings panel
  window.addEventListener('resize', handleSettingsResize);
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('resize', handleSettingsResize);
    Matter.Runner.stop(runner);
    Matter.Render.stop(render);
    Matter.Engine.clear(engine);
  });
});

function updateEstimatedTime() {
  const material = findMaterial(selectedMaterial.value);
  const seconds = estimatedHeatingTime.value;
  
  simulationStatus.value = `Simülasyonu başlatmak için 'Başlat' butonuna tıklayın`;
}

function startSimulation() {
  if (isSimulationRunning.value) return;
  
  // Reset temperatures and particles
  for (let i = 1; i < tempPoints.length; i++) {
    tempPoints[i].temp = ambientTemp;
  }
  
  initHeatParticles();
  initFlameParticles();
  
  // Reset heating completion tracking
  timeToReachTemp.value = null;
  isHeatingComplete.value = false;
  
  // Set simulation as running
  isSimulationRunning.value = true;
  simulationStartTime.value = Date.now();
  
  // Start the heat simulation loop
  lastTime = Date.now();
  simulationInterval = setInterval(() => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    calculateHeatTransfer(deltaTime);
    updateHeatParticles(deltaTime);
    updateFlameParticles(deltaTime);
    
    // Check if last point has reached target temperature
    checkHeatingCompletion();
  }, 50);
}

function stopSimulation() {
  if (!isSimulationRunning.value) return;
  
  // Stop the simulation loop
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  
  // Update simulation state
  isSimulationRunning.value = false;
}

function checkHeatingCompletion() {
  if (!isHeatingComplete.value) {
    const lastPoint = tempPoints[tempPoints.length - 1];
    const targetTemp = ambientTemp + heatingCompletionThreshold * (heatSourceTemp.value - ambientTemp);
    
    if (lastPoint.temp >= targetTemp) {
      isHeatingComplete.value = true;
      timeToReachTemp.value = (Date.now() - simulationStartTime.value) / 1000;
      
      // Automatically stop the simulation when complete
      stopSimulation();
      
      // Update status message to indicate completion
      simulationStatus.value = `Isı iletimi tamamlandı (otomatik durdu): ${formattedHeatingTime.value}`;
    }
  }
}

function handleResize() {
  if (render) {
    const container = canvas.value.parentElement;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    
    // Update Matter.js renderer
    render.options.width = canvasWidth;
    render.options.height = canvasHeight;
    render.canvas.width = canvasWidth;
    render.canvas.height = canvasHeight;
    
    // Update heat visualization canvas
    if (heatCanvas.value) {
      heatCanvas.value.width = canvasWidth;
      heatCanvas.value.height = canvasHeight;
    }
    
    // Recalculate positions
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
    
    // Update the rod position
    Matter.Body.setPosition(rod, { x: centerX, y: centerY });
    
    // Update heat source position
    Matter.Body.setPosition(heatSource, { x: centerX - (rodWidth / 2) - 30, y: centerY });
    
    // Update walls
    walls.forEach(wall => Matter.World.remove(engine.world, wall));
    createWalls();
    
    // Update temperature point positions
    updateTempPointPositions();
    
    // Update visualization
    updateRodVisualization();
  }
}

function initPhysics() {
  // Create engine and world
  engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: { x: 0, y: 0 }
  });
  
  // Get dimensions from canvas parent for responsiveness
  const container = canvas.value.parentElement;
  canvasWidth = container.clientWidth;
  canvasHeight = container.clientHeight;
  
  // Create renderer
  render = Matter.Render.create({
    canvas: canvas.value,
    engine: engine,
    options: {
      width: canvasWidth,
      height: canvasHeight,
      wireframes: false,
      background: '#1E293B', // Slate-800 equivalent
      showSleeping: false,
    }
  });
  
  // Setup heat visualization canvas
  heatCanvas.value.width = canvasWidth;
  heatCanvas.value.height = canvasHeight;
  heatCtx = heatCanvas.value.getContext('2d');
  
  // Calculate positions for centering the rod
  centerX = canvasWidth / 2;
  centerY = canvasHeight / 2;
  
  // Create the rod (material)
  rod = Matter.Bodies.rectangle(
    centerX, 
    centerY, 
    rodWidth, 
    rodHeight, 
    {
      isStatic: true,
      render: {
        fillStyle: findMaterial(selectedMaterial.value).color
      },
      label: 'rod'
    }
  );
  
  // Create heat source (Bunsen burner or hot object)
  heatSource = Matter.Bodies.circle(
    centerX - (rodWidth / 2) - 30, 
    centerY, 
    30, 
    {
      isStatic: true,
      render: {
        fillStyle: getColorForTemperature(heatSourceTemp.value)
      },
      label: 'heatSource'
    }
  );
  
  // Create borders/walls (same color as background for seamless look)
  createWalls();
  
  // Add all bodies to the world
  Matter.Composite.add(engine.world, [rod, heatSource, ...walls]);
  
  // Run the engine and renderer
  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);
  Matter.Render.run(render);
  
  // Set initial positions for temperature measurement points
  updateTempPointPositions();
  
  // Initialize heat particles
  initHeatParticles();
  
  // Initialize flame particles
  initFlameParticles();
}

function createWalls() {
  const wallOptions = {
    isStatic: true,
    render: { 
      fillStyle: '#1E293B' // Same as background
    }
  };
  
  // Top, bottom, left, right walls
  walls = [
    Matter.Bodies.rectangle(canvasWidth/2, 10, canvasWidth, 20, wallOptions), // top
    Matter.Bodies.rectangle(canvasWidth/2, canvasHeight-10, canvasWidth, 20, wallOptions), // bottom
    Matter.Bodies.rectangle(10, canvasHeight/2, 20, canvasHeight, wallOptions), // left
    Matter.Bodies.rectangle(canvasWidth-10, canvasHeight/2, 20, canvasHeight, wallOptions), // right
  ];
  
  return walls;
}

function initHeatParticles() {
  heatParticles.length = 0; // Clear existing particles
  
  // Create initial heat particles (they will be positioned during update)
  for (let i = 0; i < maxParticles; i++) {
    heatParticles.push({
      x: 0,
      y: 0,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.7 + 0.3,
      active: false,
      lifetime: 0,
      maxLifetime: Math.random() * 3 + 2
    });
  }
}

function initFlameParticles(deltaTime) {
  const heatSourcePos = heatSource.position;
  
  // Update existing flame particles
  flameParticles.forEach(particle => {
    if (particle.active) {
      // Move particles upward
      particle.y += particle.speedY * deltaTime;
      particle.x += particle.speedX * deltaTime;
      
      // Update lifetime
      particle.lifetime += deltaTime;
      
      // Shrink particle as it ages
      particle.size = Math.max(1, particle.size - (deltaTime * 10));
      particle.opacity = Math.max(0, particle.opacity - (deltaTime * 0.5));
      
      // Deactivate if expired
      if (particle.lifetime > particle.maxLifetime) {
        particle.active = false;
      }
    } else if (Math.random() < 0.3) {
      // Spawn new flame particle
      particle.x = heatSourcePos.x + (Math.random() * 20) - 10;
      particle.y = heatSourcePos.y;
      particle.size = Math.random() * 6 + 4;
      particle.speedY = -(Math.random() * 30 + 20);
      particle.speedX = (Math.random() * 10) - 5;
      particle.opacity = Math.random() * 0.8 + 0.2;
      particle.active = true;
      particle.lifetime = 0;
      particle.maxLifetime = Math.random() * 1 + 0.5;
    }
  });
}

function updateHeatParticles(deltaTime) {
  const material = findMaterial(selectedMaterial.value);
  const heatSourcePos = heatSource.position;
  
  // Get temperature at the first measurement point (connected to heat source)
  const sourceTemp = tempPoints[0].temp;
  
  // Chance to spawn a particle is proportional to source temperature
  const spawnChance = Math.min(1, (sourceTemp - ambientTemp) / (500 - ambientTemp)) * 0.3;
  
  // Update existing particles
  heatParticles.forEach(particle => {
    if (particle.active) {
      // Move particles along the rod - doubled speed
      particle.x += particle.speed * material.conductivity * deltaTime * 0.02; // Doubled from 0.01
      
      // Update lifetime
      particle.lifetime += deltaTime;
      
      // Deactivate if expired or moved too far
      if (particle.lifetime > particle.maxLifetime || particle.x > 1) {
        particle.active = false;
      }
    } else if (Math.random() < spawnChance) {
      // Spawn new particle
      particle.x = 0; // Start at heat source end
      particle.y = Math.random() * 0.8 - 0.4; // Random position within rod height
      particle.active = true;
      particle.lifetime = 0;
      particle.opacity = Math.random() * 0.7 + 0.3;
      particle.size = Math.random() * 4 + 1;
    }
  });
  
  // Draw all heat particles and heat glowing effect
  updateRodVisualization();
}

function calculateHeatTransfer(deltaTime) {
  const material = findMaterial(selectedMaterial.value);
  
  // Simplified heat conduction calculation based on Fourier's law
  // We'll update the temperature at each measurement point
  
  // Left end (near heat source) is at heat source temperature
  tempPoints[0].temp = heatSourceTemp.value;
  
  // Calculate temperature for other points based on distance from heat source
  for (let i = 1; i < tempPoints.length; i++) {
    const distanceFactor = tempPoints[i].x;
    const prevPoint = tempPoints[i-1];
    
    // Temperature difference between current point and previous point
    const tempDiff = prevPoint.temp - tempPoints[i].temp;
    
    // Heat transfer rate depends on material conductivity and temperature difference
    // Doubled the speed by changing 0.02 to 0.04
    const heatTransferRate = material.conductivity * tempDiff * deltaTime * 0.04;
    
    // Update temperature (clamped between ambient and heat source)
    tempPoints[i].temp = Math.max(
      ambientTemp,
      Math.min(
        heatSourceTemp.value,
        tempPoints[i].temp + heatTransferRate
      )
    );
  }
}

function updateRodVisualization() {
  if (!heatCtx) return;
  
  // Clear previous visualization
  heatCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Get rod vertices
  const vertices = rod.vertices;
  const top = vertices[0].y;
  const bottom = vertices[2].y;
  const left = vertices[0].x;
  const right = vertices[2].x;
  
  // Create gradient based on temperature points
  const gradient = heatCtx.createLinearGradient(left, centerY, right, centerY);
  
  // Add color stops for each temperature point
  tempPoints.forEach((point, index) => {
    const position = point.x;
    const color = getColorForTemperature(point.temp);
    gradient.addColorStop(position, color);
  });
  
  // Draw rod with gradient
  heatCtx.save();
  
  // Draw heat glow around the rod
  for (let i = 15; i > 0; i--) {
    const glowSize = i * 1.5;
    heatCtx.beginPath();
    heatCtx.roundRect(left - glowSize, top - glowSize, (right - left) + (glowSize * 2), (bottom - top) + (glowSize * 2), 5 + glowSize);
    
    // Create glow gradient
    const glowGradient = heatCtx.createLinearGradient(left, centerY, right, centerY);
    tempPoints.forEach((point, index) => {
      const position = point.x;
      let color = getColorForTemperatureWithAlpha(point.temp, 0.06 - (i * 0.003));
      glowGradient.addColorStop(position, color);
    });
    
    heatCtx.fillStyle = glowGradient;
    heatCtx.fill();
  }
  
  // Draw rod with temperature gradient
  heatCtx.beginPath();
  heatCtx.roundRect(left, top, right - left, bottom - top, 2);
  heatCtx.fillStyle = gradient;
  heatCtx.fill();
  
  // Draw heat particles
  heatParticles.forEach(particle => {
    if (particle.active) {
      // Calculate world position of particle
      const worldX = left + particle.x * (right - left);
      const worldY = centerY + (particle.y * rodHeight/2);
      
      // Draw particle
      const temperature = getInterpolatedTemperature(particle.x);
      const color = getColorForTemperatureWithAlpha(temperature, particle.opacity);
      
      heatCtx.beginPath();
      heatCtx.arc(worldX, worldY, particle.size, 0, Math.PI * 2);
      heatCtx.fillStyle = color;
      heatCtx.fill();
      
      // Add glow around particle
      const glow = heatCtx.createRadialGradient(
        worldX, worldY, 0,
        worldX, worldY, particle.size * 3
      );
      glow.addColorStop(0, getColorForTemperatureWithAlpha(temperature, particle.opacity * 0.7));
      glow.addColorStop(1, getColorForTemperatureWithAlpha(temperature, 0));
      
      heatCtx.beginPath();
      heatCtx.arc(worldX, worldY, particle.size * 3, 0, Math.PI * 2);
      heatCtx.fillStyle = glow;
      heatCtx.fill();
    }
  });
  
  // Draw flame particles for the heat source
  flameParticles.forEach(particle => {
    if (particle.active) {
      // Draw flame particle
      const color = `rgba(255, ${Math.floor(particle.lifetime/particle.maxLifetime * 150)}, 0, ${particle.opacity})`;
      
      heatCtx.beginPath();
      heatCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      heatCtx.fillStyle = color;
      heatCtx.fill();
      
      // Add glow around flame
      const glow = heatCtx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      );
      glow.addColorStop(0, `rgba(255, ${Math.floor(particle.lifetime/particle.maxLifetime * 150)}, 0, ${particle.opacity * 0.8})`);
      glow.addColorStop(1, `rgba(255, ${Math.floor(particle.lifetime/particle.maxLifetime * 150)}, 0, 0)`);
      
      heatCtx.beginPath();
      heatCtx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      heatCtx.fillStyle = glow;
      heatCtx.fill();
    }
  });
  
  // Draw heat source label
  const heatSourcePos = heatSource.position;
  heatCtx.font = 'bold 14px Arial';
  heatCtx.textAlign = 'center';
  heatCtx.textBaseline = 'bottom';
  heatCtx.fillStyle = 'white';
  
  // Draw burner stand under heat source
  heatCtx.beginPath();
  heatCtx.rect(heatSourcePos.x - 20, heatSourcePos.y + 30, 40, 15);
  heatCtx.fillStyle = '#4B5563'; // gray-600
  heatCtx.fill();
  
  heatCtx.beginPath();
  heatCtx.rect(heatSourcePos.x - 25, heatSourcePos.y + 45, 50, 8);
  heatCtx.fillStyle = '#6B7280'; // gray-500
  heatCtx.fill();
  
  // Draw measurement points on the rod
  tempPoints.forEach((point, index) => {
    // Position for the point
    const pointX = left + point.x * (right - left);
    
    // Draw a visible circle at measurement point
    heatCtx.beginPath();
    // Draw outer circle (white ring for visibility)
    heatCtx.arc(pointX, top - 10, 10, 0, Math.PI * 2);
    heatCtx.fillStyle = 'white';
    heatCtx.fill();
    
    // Draw inner circle (colored by temperature)
    heatCtx.beginPath();
    heatCtx.arc(pointX, top - 10, 7, 0, Math.PI * 2);
    heatCtx.fillStyle = getColorForTemperature(point.temp);
    heatCtx.fill();
    
    // Draw connector line from circle to rod
    heatCtx.beginPath();
    heatCtx.moveTo(pointX, top - 3);
    heatCtx.lineTo(pointX, top);
    heatCtx.strokeStyle = 'white';
    heatCtx.lineWidth = 2;
    heatCtx.stroke();
    
    // Draw point number
    heatCtx.font = 'bold 10px Arial';
    heatCtx.textAlign = 'center';
    heatCtx.textBaseline = 'middle';
    heatCtx.fillStyle = 'black';
    heatCtx.fillText((index + 1).toString(), pointX, top - 10);
    
    // Draw temperature value above the point
    heatCtx.font = '12px Arial';
    heatCtx.fillStyle = 'white';
    heatCtx.textAlign = 'center';
    heatCtx.fillText(`${Math.round(point.temp)}°C`, pointX, top - 30);
  });
  
  heatCtx.restore();
}

function getInterpolatedTemperature(x) {
  // Find two temperature points to interpolate between
  let lowerIndex = 0;
  for (let i = 0; i < tempPoints.length - 1; i++) {
    if (x >= tempPoints[i].x && x <= tempPoints[i+1].x) {
      lowerIndex = i;
      break;
    }
  }
  
  const lowerPoint = tempPoints[lowerIndex];
  const upperPoint = tempPoints[lowerIndex + 1];
  
  // Calculate interpolation factor
  const factor = (x - lowerPoint.x) / (upperPoint.x - lowerPoint.x);
  
  // Interpolate temperature
  return lowerPoint.temp + (upperPoint.temp - lowerPoint.temp) * factor;
}

function getColorForTemperature(temp) {
  // Map temperature to a color from blue (cold) to red (hot)
  const normalizedTemp = Math.min(1, Math.max(0, (temp - ambientTemp) / (500 - ambientTemp)));
  
  // Color transitions: blue -> cyan -> green -> yellow -> orange -> red
  let r, g, b;
  
  if (normalizedTemp < 0.2) {
    // Blue to cyan
    r = 0;
    g = Math.floor(normalizedTemp * 5 * 255);
    b = 255;
  } else if (normalizedTemp < 0.4) {
    // Cyan to green
    r = 0;
    g = 255;
    b = Math.floor(255 - ((normalizedTemp - 0.2) * 5 * 255));
  } else if (normalizedTemp < 0.6) {
    // Green to yellow
    r = Math.floor((normalizedTemp - 0.4) * 5 * 255);
    g = 255;
    b = 0;
  } else if (normalizedTemp < 0.8) {
    // Yellow to orange
    r = 255;
    g = Math.floor(255 - ((normalizedTemp - 0.6) * 5 * 127));
    b = 0;
  } else {
    // Orange to red
    r = 255;
    g = Math.floor(128 - ((normalizedTemp - 0.8) * 5 * 128));
    b = 0;
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}

function getColorForTemperatureWithAlpha(temp, alpha) {
  // Map temperature to a color from blue (cold) to red (hot)
  const normalizedTemp = Math.min(1, Math.max(0, (temp - ambientTemp) / (500 - ambientTemp)));
  
  // Color transitions: blue -> cyan -> green -> yellow -> orange -> red
  let r, g, b;
  
  if (normalizedTemp < 0.2) {
    // Blue to cyan
    r = 0;
    g = Math.floor(normalizedTemp * 5 * 255);
    b = 255;
  } else if (normalizedTemp < 0.4) {
    // Cyan to green
    r = 0;
    g = 255;
    b = Math.floor(255 - ((normalizedTemp - 0.2) * 5 * 255));
  } else if (normalizedTemp < 0.6) {
    // Green to yellow
    r = Math.floor((normalizedTemp - 0.4) * 5 * 255);
    g = 255;
    b = 0;
  } else if (normalizedTemp < 0.8) {
    // Yellow to orange
    r = 255;
    g = Math.floor(255 - ((normalizedTemp - 0.6) * 5 * 127));
    b = 0;
  } else {
    // Orange to red
    r = 255;
    g = Math.floor(128 - ((normalizedTemp - 0.8) * 5 * 128));
    b = 0;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateTempPointPositions() {
  // Get rod dimensions from Matter.js body
  const vertices = rod.vertices;
  const left = vertices[0].x;
  const right = vertices[1].x;
  
  // Position temperature measurement points along the rod
  for (let i = 0; i < tempPoints.length; i++) {
    tempPoints[i].x = i / (tempPoints.length - 1);
    tempPoints[i].worldX = left + (tempPoints[i].x * (right - left));
    tempPoints[i].worldY = centerY;
  }
}

function findMaterial(name) {
  return materials.find(m => m.name === name) || materials[0];
}

function changeMaterial(material) {
  // First stop the simulation if it's running
  if (isSimulationRunning.value) {
    stopSimulation();
  }
  
  // Reset animation state
  resetAnimationState();
  
  // Update rod properties
  rod.render.fillStyle = material.color;
  
  // Reset temperatures except for heat source
  for (let i = 1; i < tempPoints.length; i++) {
    tempPoints[i].temp = ambientTemp;
  }
  
  // Update the estimated time
  updateEstimatedTime();
  
  // Update visualization
  updateRodVisualization();
}

function updateHeatSource() {
  if (heatSource) {
    // Update heat source color based on temperature
    heatSource.render.fillStyle = getColorForTemperature(heatSourceTemp.value);
    
    // Also update temperature at source point
    tempPoints[0].temp = heatSourceTemp.value;
    
    // Update estimated time when temperature changes
    updateEstimatedTime();
  }
}

// Helper function to reset animation state without a UI button
function resetAnimationState() {
  // Reset all temperatures except for heat source
  for (let i = 1; i < tempPoints.length; i++) {
    tempPoints[i].temp = ambientTemp;
  }
  
  // Reset heat particles
  initHeatParticles();
  
  // Reset flame particles
  initFlameParticles();
  
  // Reset heating completion tracking
  timeToReachTemp.value = null;
  isHeatingComplete.value = false;
  
  // Reset simulation state
  isSimulationRunning.value = false;
  
  // Update the estimated time
  updateEstimatedTime();
  
  // Update visualization
  updateRodVisualization();
}

// Add a helper function to format time consistently
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} saniye`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} dakika ${remainingSeconds.toFixed(0)} saniye`;
  }
}

// Add helper functions to classify and label conductivity
function getConductivityClass(conductivity) {
  if (conductivity >= 350) {
    return 'bg-red-900 text-red-300'; // Very high conductivity
  } else if (conductivity >= 200) {
    return 'bg-green-900 text-green-300'; // High conductivity
  } else if (conductivity >= 50) {
    return 'bg-blue-900 text-blue-300'; // Medium conductivity
  } else if (conductivity >= 0.15) {
    return 'bg-orange-900 text-orange-300'; // Low conductivity
  } else {
    return 'bg-red-900 text-red-300'; // Very low conductivity
  }
}

function getConductivityLabel(conductivity) {
  if (conductivity >= 350) {
    return 'Çok Yüksek';
  } else if (conductivity >= 200) {
    return 'Yüksek';
  } else if (conductivity >= 50) {
    return 'Orta';
  } else if (conductivity >= 0.15) {
    return 'Düşük';
  } else {
    return 'Çok Düşük';
  }
}

// Toggle settings panel for mobile view
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

// Handle responsive settings panel
function handleSettingsResize() {
  if (window.innerWidth >= 768) {
    showSettings.value = true;
  }
}
</script>

<style>
.shadow-glow {
  box-shadow: 0 0 5px currentColor;
}
</style>
  
 
 