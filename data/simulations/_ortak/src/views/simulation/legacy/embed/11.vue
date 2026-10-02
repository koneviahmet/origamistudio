<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
    <!-- Title -->
    <h1 class="text-2xl md:text-3xl font-bold text-white mb-4">Güneş, Dünya ve Ay'ın Hareketleri</h1>
    
    <!-- Description -->
    <p class="text-gray-300 text-sm md:text-base max-w-2xl text-center mb-4">
      Bu simülasyon Güneş, Dünya ve Ay'ın hareketlerini göstermektedir. Dünya'nın kendi ekseni etrafında dönüşü, 
      Güneş etrafındaki yörüngesi ve Ay'ın Dünya etrafındaki hareketi görülebilir.
    </p>
    
    <!-- Control Panel -->
    <div class="w-full max-w-3xl bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap justify-center gap-4">
      <div class="flex flex-col items-center">
        <label for="speedSlider" class="text-gray-300 text-sm mb-1">Hız Ayarı</label>
        <input 
          id="speedSlider" 
          type="range" 
          min="0.1" 
          max="10" 
          step="0.1" 
          v-model="simulationSpeed" 
          class="w-32 md:w-40"
        >
        <span class="text-gray-300 text-xs mt-1">{{ simulationSpeed.toFixed(1) }}x</span>
      </div>
      
      <div class="flex flex-col items-center">
        <label class="text-gray-300 text-sm mb-1">Simülasyon</label>
        <div class="flex space-x-2">
          <button 
            @click="isRunning = !isRunning" 
            class="px-2 py-1 text-xs rounded" 
            :class="isRunning ? 'bg-red-600 text-white' : 'bg-green-600 text-white'"
          >
            {{ isRunning ? 'Durdur' : 'Başlat' }}
          </button>
          <button 
            @click="resetSimulation" 
            class="px-2 py-1 text-xs rounded bg-yellow-600 text-white"
          >
            Sıfırla
          </button>
        </div>
      </div>
    </div>
    
    <!-- Simulation Canvas -->
    <div class="relative w-full max-w-3xl bg-gray-800 rounded-lg overflow-hidden">
      <canvas ref="simulationCanvas" class="w-full h-64 md:h-96"></canvas>
      
      <!-- Information Panel -->
      <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <div>
          <p>Dünya'nın dönüş süresi: 24 saat</p>
          <p>Dünya'nın yörünge süresi: 365.25 gün</p>
          <p>Ay'ın yörünge süresi: 29.5 gün</p>
        </div>
      </div>
      
      <!-- Current Info -->
      <div class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <p>Simülasyon Günü: {{ simulationDay.toFixed(1) }}</p>
        <p>
          Ay Evresi: {{ moonPhase }}
        </p>
      </div>
    </div>
    
    <!-- Additional Information -->
    <div class="w-full max-w-3xl mt-4 bg-gray-800 rounded-lg p-4">
      <h2 class="text-lg md:text-xl font-bold text-white mb-2">Bilgi</h2>
      <div class="text-gray-300 text-xs md:text-sm space-y-2">
        <p>
          Güneş sisteminde Dünya, Güneş'in etrafında dönerken aynı zamanda kendi ekseni etrafında da döner. 
          Dünya'nın kendi ekseni etrafındaki bir tam dönüşü bir günü (24 saat) oluşturur, 
          Güneş etrafındaki bir tam dönüşü ise bir yılı (365.25 gün) oluşturur.
        </p>
        <p>
          Dünya'nın kendi ekseni etrafında dönmesi sonucu gün ve gece oluşur. 
          Güneş'e dönük olan kısım gündüzü yaşarken, diğer kısım geceyi yaşar. 
          Dünya'nın 23.5 derecelik eksen eğikliği mevsimlerin oluşmasını sağlar.
        </p>
        <p>
          Ay, Dünya etrafında yaklaşık 29.5 günde bir tam tur atar. Bu süreç içinde Güneş'ten aldığı ışığı 
          farklı açılardan yansıtarak evreler oluşturur: Yeni Ay, İlk Dördün, Dolunay ve Son Dördün.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import Matter from "matter-js";

// Simulation state
const simulationCanvas = ref(null);
const simulationSpeed = ref(1);
const isRunning = ref(true);
const viewMode = ref('system'); // Set default view mode
const simulationDay = ref(0);

// Matter.js objects
let engine, render, runner, world;
let sun, earth, moon, walls = [];
let earthOrbit, moonOrbit;

// Constants
const EARTH_ORBIT_RADIUS = 150;
const MOON_ORBIT_RADIUS = 40;
const EARTH_ORBIT_SPEED = 0.001; // radians per time unit
const EARTH_ROTATION_SPEED = 0.02; // radians per time unit
const MOON_ORBIT_SPEED = 0.01; // radians per time unit
const DAY_PER_FRAME = 0.1; // simulation days per frame

// Track angles
let earthAngle = 0;
let earthRotationAngle = 0;
let moonAngle = 0;

// Computed properties
const moonPhase = computed(() => {
  // Simplify phase calculation based on relative angle between earth-moon and earth-sun
  const relativeMoonAngle = (moonAngle - earthAngle) % (Math.PI * 2);
  const normalizedAngle = relativeMoonAngle < 0 ? relativeMoonAngle + Math.PI * 2 : relativeMoonAngle;
  
  if (normalizedAngle < Math.PI * 0.25) return "Yeni Ay";
  if (normalizedAngle < Math.PI * 0.75) return "İlk Dördün";
  if (normalizedAngle < Math.PI * 1.25) return "Dolunay";
  if (normalizedAngle < Math.PI * 1.75) return "Son Dördün";
  return "Yeni Ay";
});

// Initialize simulation
onMounted(() => {
  initSimulation();
});

// Clean up
onBeforeUnmount(() => {
  cleanupSimulation();
});

// Functions
function initSimulation() {
  // Create engine and world
  engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: { x: 0, y: 0 }
  });
  world = engine.world;

  // Create render
  render = Matter.Render.create({
    element: simulationCanvas.value.parentElement,
    canvas: simulationCanvas.value,
    engine: engine,
    options: {
      width: simulationCanvas.value.offsetWidth,
      height: simulationCanvas.value.offsetHeight,
      wireframes: false,
      background: '#1a1a2e',
      showAngleIndicator: false,
    }
  });

  // Create walls (same color as background)
  createWalls();

  // Create celestial bodies
  createCelestialBodies();

  // Set up runner
  runner = Matter.Runner.create();
  
  // Set up custom rendering
  Matter.Events.on(render, 'afterRender', () => {
    if (!isRunning.value) return;
    
    updateCelestialPositions();
    updateSimulationDay();
    
    // Draw simulation elements on canvas based on view mode
    const ctx = render.context;
    
    // Draw all visualization elements to have a complete view
    drawOrbitPaths(ctx);
    drawDayNightCycle(ctx);
    drawMoonPhases(ctx);
  });
  
  // Run the simulation
  Matter.Render.run(render);
  if (isRunning.value) {
    Matter.Runner.run(runner, engine);
  }
  
  // Resize handler
  window.addEventListener('resize', handleResize);
  
  // Initial view setup
  updateSimulationView();
}

function cleanupSimulation() {
  window.removeEventListener('resize', handleResize);
  
  if (runner) Matter.Runner.stop(runner);
  if (render) Matter.Render.stop(render);
  
  if (engine) {
    Matter.World.clear(world, false);
    Matter.Engine.clear(engine);
  }
}

function createWalls() {
  const width = render.options.width;
  const height = render.options.height;
  const wallOptions = {
    isStatic: true,
    render: {
      fillStyle: '#1a1a2e',
      strokeStyle: '#1a1a2e',
      lineWidth: 0
    }
  };
  
  // Top, right, bottom, left walls
  walls = [
    Matter.Bodies.rectangle(width/2, -10, width, 20, wallOptions),
    Matter.Bodies.rectangle(width + 10, height/2, 20, height, wallOptions),
    Matter.Bodies.rectangle(width/2, height + 10, width, 20, wallOptions),
    Matter.Bodies.rectangle(-10, height/2, 20, height, wallOptions)
  ];
  
  Matter.World.add(world, walls);
}

function createCelestialBodies() {
  // Center of the canvas
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  
  // Sun
  sun = Matter.Bodies.circle(centerX, centerY, 30, {
    isStatic: true,
    render: {
      fillStyle: '#FFDE00',
      strokeStyle: '#FF9D00',
      lineWidth: 3
    }
  });
  
  // Earth (initial position)
  const earthX = centerX + EARTH_ORBIT_RADIUS;
  const earthY = centerY;
  earth = Matter.Bodies.circle(earthX, earthY, 12, {
    render: {
      fillStyle: '#2A77E2',
      strokeStyle: '#216ACC',
      lineWidth: 1,
      sprite: {
        texture: createEarthTexture()
      }
    }
  });
  
  // Moon (initial position)
  const moonX = earthX + MOON_ORBIT_RADIUS;
  const moonY = earthY;
  moon = Matter.Bodies.circle(moonX, moonY, 5, {
    render: {
      fillStyle: '#CCCCCC',
      strokeStyle: '#999999',
      lineWidth: 1
    }
  });
  
  // Add all bodies to the world
  Matter.World.add(world, [sun, earth, moon]);
  
  // Create constraints for orbits (just for positioning, not actually used for physics)
  earthOrbit = Matter.Constraint.create({
    bodyA: sun,
    bodyB: earth,
    stiffness: 0.00001,
    length: EARTH_ORBIT_RADIUS,
    render: { visible: false }
  });
  
  moonOrbit = Matter.Constraint.create({
    bodyA: earth,
    bodyB: moon,
    stiffness: 0.00001,
    length: MOON_ORBIT_RADIUS,
    render: { visible: false }
  });
  
  Matter.World.add(world, [earthOrbit, moonOrbit]);
}

function createEarthTexture() {
  // Simple texture for Earth (adds continents)
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  
  // Circle with blue background
  ctx.fillStyle = '#2A77E2';
  ctx.beginPath();
  ctx.arc(25, 25, 24, 0, Math.PI * 2);
  ctx.fill();
  
  // Simple green continents
  ctx.fillStyle = '#4CAF50';
  
  // Africa + Europe
  ctx.beginPath();
  ctx.ellipse(25, 25, 10, 15, 0, Math.PI * 0.2, Math.PI * 1.1);
  ctx.fill();
  
  // America
  ctx.beginPath();
  ctx.ellipse(12, 20, 5, 15, 0, Math.PI * 0.2, Math.PI * 1.8);
  ctx.fill();
  
  // Asia/Australia
  ctx.beginPath();
  ctx.ellipse(35, 25, 8, 10, 0, Math.PI * 0.2, Math.PI * 1.6);
  ctx.fill();
  
  return canvas.toDataURL();
}

function updateCelestialPositions() {
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  
  // Update angles based on speed
  const speedFactor = simulationSpeed.value * (isRunning.value ? 1 : 0);
  earthAngle += EARTH_ORBIT_SPEED * speedFactor;
  earthRotationAngle += EARTH_ROTATION_SPEED * speedFactor;
  moonAngle += MOON_ORBIT_SPEED * speedFactor;
  
  // Calculate new positions
  const earthX = centerX + Math.cos(earthAngle) * EARTH_ORBIT_RADIUS;
  const earthY = centerY + Math.sin(earthAngle) * EARTH_ORBIT_RADIUS;
  
  const moonX = earthX + Math.cos(moonAngle) * MOON_ORBIT_RADIUS;
  const moonY = earthY + Math.sin(moonAngle) * MOON_ORBIT_RADIUS;
  
  // Apply new positions
  Matter.Body.setPosition(earth, { x: earthX, y: earthY });
  Matter.Body.setPosition(moon, { x: moonX, y: moonY });
  
  // Also update Earth's rotation
  Matter.Body.setAngle(earth, earthRotationAngle);
}

function updateSimulationDay() {
  simulationDay.value += DAY_PER_FRAME * simulationSpeed.value * (isRunning.value ? 1 : 0);
}

function drawOrbitPaths(ctx) {
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  
  // Draw Earth's orbit
  ctx.beginPath();
  ctx.arc(centerX, centerY, EARTH_ORBIT_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw Moon's orbit relative to current Earth position
  const earthX = centerX + Math.cos(earthAngle) * EARTH_ORBIT_RADIUS;
  const earthY = centerY + Math.sin(earthAngle) * EARTH_ORBIT_RADIUS;
  
  ctx.beginPath();
  ctx.arc(earthX, earthY, MOON_ORBIT_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawDayNightCycle(ctx) {
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  
  // Create a radial gradient for day/night
  ctx.save();
  
  // Move to Earth's position
  const earthX = centerX + Math.cos(earthAngle) * EARTH_ORBIT_RADIUS;
  const earthY = centerY + Math.sin(earthAngle) * EARTH_ORBIT_RADIUS;
  
  // Draw Sun rays pointing to Earth
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(earthX, earthY);
  ctx.strokeStyle = 'rgba(255, 220, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}

function drawMoonPhases(ctx) {
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  
  // Draw a line from Sun to Earth
  const earthX = centerX + Math.cos(earthAngle) * EARTH_ORBIT_RADIUS;
  const earthY = centerY + Math.sin(earthAngle) * EARTH_ORBIT_RADIUS;
  
  // Draw Earth-Moon line
  const moonX = earthX + Math.cos(moonAngle) * MOON_ORBIT_RADIUS;
  const moonY = earthY + Math.sin(moonAngle) * MOON_ORBIT_RADIUS;
  
  ctx.beginPath();
  ctx.moveTo(earthX, earthY);
  ctx.lineTo(moonX, moonY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function updateSimulationView() {
  if (!render) return;
  
  render.options.width = simulationCanvas.value.offsetWidth;
  render.options.height = simulationCanvas.value.offsetHeight;
  
  // Make all objects visible
  sun.render.visible = true;
  earth.render.visible = true;
  moon.render.visible = true;
  
  // Update renderer size
  Matter.Render.setPixelRatio(render, window.devicePixelRatio);
}

function handleResize() {
  if (!render || !simulationCanvas.value) return;
  
  render.options.width = simulationCanvas.value.offsetWidth;
  render.options.height = simulationCanvas.value.offsetHeight;
  
  Matter.Render.setPixelRatio(render, window.devicePixelRatio);
  
  // Adjust wall positions
  walls.forEach(wall => Matter.World.remove(world, wall));
  createWalls();
  
  // Recenter sun
  Matter.Body.setPosition(sun, { 
    x: render.options.width / 2,
    y: render.options.height / 2
  });
}

function resetSimulation() {
  earthAngle = 0;
  earthRotationAngle = 0;
  moonAngle = 0;
  simulationDay.value = 0;
  
  updateCelestialPositions();
}
</script>

<style>
canvas {
  max-width: 100%;
}
</style>
  
 
 