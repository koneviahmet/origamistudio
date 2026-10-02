<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-gray-900 relative overflow-auto">
    <!-- Main Simulation Area -->
    <div class="flex-1 p-4 relative">
      <!-- Canvas Container -->
      <div class="relative w-full bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 flex items-center justify-center h-full">
        <canvas ref="simulationCanvas" class="w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)]"></canvas>
        
        <!-- Information Panel -->
        <div class="absolute top-4 left-4 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg border border-gray-700 hidden md:block">
          <h4 class="text-sm font-semibold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ölçümler
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between gap-2">
              <span class="text-gray-300">Işık - Cisim:</span>
              <span class="text-yellow-300 font-medium">{{ (lightToObjectDistance).toFixed(0) }}px</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-gray-300">Cisim - Perde:</span>
              <span class="text-green-300 font-medium">{{ (objectToScreenDistance).toFixed(0) }}px</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-gray-300">Gölge Boyu:</span>
              <span class="text-blue-300 font-medium">{{ (shadowHeight).toFixed(0) }}px</span>
            </div>
          </div>
        </div>
        

      </div>
    </div>

    <!-- Mobile Settings Button -->
    <button 
      @click="showSettings = !showSettings"
      class="md:hidden absolute top-4 left-4 bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-700 z-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Settings Panel -->
    <div 
    class="h-screen overflow-auto"
      :class="[
        'bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto transition-transform duration-300 ease-in-out',
        'fixed md:relative top-0 right-0 h-full w-80 z-40',
        showSettings ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      ]"
    >
      <div class="space-y-6">
        <!-- Light Source Controls -->
        <div class="space-y-4">
          <h3 class="text-white font-semibold flex items-center">
            <span class="inline-block w-3 h-3 rounded-full bg-yellow-300 mr-2"></span>
            Işık Kaynağı
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-gray-300 text-sm">Konum</label>
              <span class="text-white text-sm bg-gray-700 px-2 py-1 rounded">{{ lightPositionPercent }}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model="lightPositionPercent"
              @input="updateObjectPositionsFromControls"
              class="slider-light w-full"
            >
          </div>
        </div>

        <!-- Opaque Object Controls -->
        <div class="space-y-4">
          <h3 class="text-white font-semibold flex items-center">
            <span class="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
            Opak Cisim
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-gray-300 text-sm">Konum</label>
              <span class="text-white text-sm bg-gray-700 px-2 py-1 rounded">{{ objectPositionPercent }}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100"
              v-model="objectPositionPercent"
              @input="updateObjectPositionsFromControls"
              class="slider-object w-full"
            >
          </div>

          <!-- Shape selector -->
          <div class="space-y-2">
            <label class="text-gray-300 text-sm block">Şekil Seçimi</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="changeObjectShape('rectangle')" 
                :class="[
                  'p-2 rounded border transition-colors duration-200',
                  selectedShape === 'rectangle' 
                    ? 'bg-gray-600 border-blue-400 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-650'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="3" y="5" width="14" height="10" rx="1" />
                </svg>
              </button>
              <button 
                @click="changeObjectShape('triangle')" 
                :class="[
                  'p-2 rounded border transition-colors duration-200',
                  selectedShape === 'triangle' 
                    ? 'bg-gray-600 border-blue-400 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-650'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3 L18 17 L2 17 Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Screen Controls -->
        <div class="space-y-4">
          <h3 class="text-white font-semibold flex items-center">
            <span class="inline-block w-3 h-3 rounded-full bg-gray-200 mr-2"></span>
            Perde
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-gray-300 text-sm">Konum</label>
              <span class="text-white text-sm bg-gray-700 px-2 py-1 rounded">{{ screenPositionPercent }}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100"
              v-model="screenPositionPercent"
              @input="updateObjectPositionsFromControls"
              class="slider-screen w-full"
            >
          </div>
        </div>


        <!-- Reset Button -->
        <button 
          @click="resetPositions" 
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium shadow-md transition-all duration-200 hover:shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Varsayılan Konumlara Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import Matter from "matter-js";

// Simulation state
const simulationCanvas = ref(null);
const lightToObjectDistance = ref(0);
const objectToScreenDistance = ref(0);
const shadowHeight = ref(0);
const showSettings = ref(false); // Mobile settings visibility state

// Position controls (percentage of available space)
const lightPositionPercent = ref(15);
const objectPositionPercent = ref(50);
const screenPositionPercent = ref(85);

// Shape control for opaque object
const selectedShape = ref('rectangle');

// Matter.js objects
let engine, render, runner, world;
let lightSource, opaqueObject, screen;
let walls = [];
let lightRays = [];

// Constants
const LIGHT_SOURCE_SIZE = 15;
const OBJECT_WIDTH = 20;
const OBJECT_HEIGHT = 40;
const SCREEN_WIDTH = 10;
// Perdenin yüksekliği artık simülasyon yüksekliği ile aynı yapıyoruz
// const SCREEN_HEIGHT = 120; // Bu satırı kaldırıyorum
const DRAGGABLE_CONSTRAINT = 0.9; // Stiffer constraint to prevent springback

// Initialize simulation
onMounted(() => {
  initSimulation();
});

// Clean up
onBeforeUnmount(() => {
  cleanupSimulation();
});

// Watch for position changes via the Matter.js simulation
const updatePositionControls = () => {
  if (!lightSource || !opaqueObject || !screen || !render) return;
  
  const width = render.options.width;
  const paddingX = 40; // Account for padding to keep objects away from edges
  const availableWidth = width - paddingX * 2;
  
  // Calculate positions as percentages of available space
  const lightX = lightSource.position.x - paddingX;
  const objectX = opaqueObject.position.x - paddingX;
  const screenX = screen.position.x - paddingX;
  
  // Update slider values without triggering the input event
  lightPositionPercent.value = Math.round((lightX / availableWidth) * 100);
  objectPositionPercent.value = Math.round((objectX / availableWidth) * 100);
  screenPositionPercent.value = Math.round((screenX / availableWidth) * 100);
};

// Update object positions from slider controls
function updateObjectPositionsFromControls() {
  if (!lightSource || !opaqueObject || !screen || !render) return;
  
  const width = render.options.width;
  const paddingX = 40; // Account for padding to keep objects away from edges
  const availableWidth = width - paddingX * 2;
  
  // Calculate positions from percentages
  const newLightX = (lightPositionPercent.value / 100) * availableWidth + paddingX;
  const newObjectX = (objectPositionPercent.value / 100) * availableWidth + paddingX;
  const newScreenX = (screenPositionPercent.value / 100) * availableWidth + paddingX;
  
  // Get object width based on shape
  let objectWidth = OBJECT_WIDTH;
  if (selectedShape.value === 'triangle') {
    objectWidth = OBJECT_HEIGHT * 0.866;
  }
  
  // Enforce ordering constraints
  if (newLightX >= newObjectX - objectWidth/2 - LIGHT_SOURCE_SIZE) {
    lightPositionPercent.value = Math.max(0, objectPositionPercent.value - 15);
    return updateObjectPositionsFromControls();
  }
  
  if (newObjectX >= newScreenX - SCREEN_WIDTH/2 - objectWidth/2) {
    objectPositionPercent.value = Math.max(lightPositionPercent.value + 15, screenPositionPercent.value - 15);
    return updateObjectPositionsFromControls();
  }
  
  // Apply the positions
  Matter.Body.setPosition(lightSource, {
    x: newLightX,
    y: lightSource.position.y
  });
  
  Matter.Body.setPosition(opaqueObject, {
    x: newObjectX,
    y: opaqueObject.position.y
  });
  
  Matter.Body.setPosition(screen, {
    x: newScreenX,
    y: screen.position.y
  });
}

// Reset positions to default
function resetPositions() {
  lightPositionPercent.value = 15;
  objectPositionPercent.value = 50;
  screenPositionPercent.value = 85;
  updateObjectPositionsFromControls();
}

// Functions
function initSimulation() {
  // Create engine and world
  engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: { x: 0, y: 0 } // Disable gravity completely
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

  // Create simulation objects
  createSimulationObjects();

  // Setup mouse control
  setupMouseControl();

  // Set up runner with fixed timestep and disabling auto-sleeping
  runner = Matter.Runner.create({
    isFixed: true,
    delta: 1000/60
  });
  
  // Set up custom rendering
  Matter.Events.on(render, 'afterRender', () => {
    ensurePositionsLocked(); // Ensure objects stay in position
    calculateDistances();
    drawLightRays();
    updatePositionControls();
  });
  
  // Run the simulation
  Matter.Render.run(render);
  Matter.Runner.run(runner, engine);
  
  // Resize handler
  window.addEventListener('resize', handleResize);
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
  
  // Floor, ceiling and walls - same color as background
  walls = [
    Matter.Bodies.rectangle(width/2, -10, width, 20, wallOptions), // ceiling
    Matter.Bodies.rectangle(width/2, height + 10, width, 20, wallOptions), // floor
    Matter.Bodies.rectangle(-10, height/2, 20, height, wallOptions), // left wall
    Matter.Bodies.rectangle(width + 10, height/2, 20, height, wallOptions) // right wall
  ];
  
  Matter.World.add(world, walls);
}

function createSimulationObjects() {
  const width = render.options.width;
  const height = render.options.height;
  
  // Position objects in the middle of the canvas
  const centerY = height / 2;
  
  // Light source (left side)
  lightSource = Matter.Bodies.circle(width * (lightPositionPercent.value / 100), centerY, LIGHT_SOURCE_SIZE, {
    label: 'lightSource',
    isStatic: false,
    collisionFilter: {
      group: -1 // no collision with other objects
    },
    render: {
      fillStyle: '#FFDE00',
      strokeStyle: '#FF9D00',
      lineWidth: 2
    }
  });
  
  // Opaque object (middle) with selected shape
  opaqueObject = createObjectShape(
    selectedShape.value, 
    width * (objectPositionPercent.value / 100),
    centerY
  );
  
  // Screen (right side) - Perdenin yüksekliğini canvas yüksekliği ile aynı yapıyoruz ve dönmesini engelliyoruz
  screen = Matter.Bodies.rectangle(width * (screenPositionPercent.value / 100), centerY, SCREEN_WIDTH, height, {
    label: 'screen',
    isStatic: false,
    collisionFilter: {
      group: -1 // no collision with other objects
    },
    // Perdenin dönmesini engellemek için atalet değerini çok büyük yapıyoruz
    inertia: Infinity,
    // İlk açıyı sıfır olarak ayarlayalım (dik duracak şekilde)
    angle: 0,
    // Açısal hızı sıfır yapıyoruz
    angularVelocity: 0,
    render: {
      fillStyle: '#E5E7EB',
      strokeStyle: '#D1D5DB',
      lineWidth: 1
    }
  });
  
  // Add all bodies to the world
  Matter.World.add(world, [lightSource, opaqueObject, screen]);
}

// Function to lock object positions
function ensurePositionsLocked() {
  if (!lightSource || !opaqueObject || !screen || !render) return;
  
  const centerY = render.options.height / 2;
  
  // Force Y positions to remain at centerY
  if (Math.abs(lightSource.position.y - centerY) > 1) {
    Matter.Body.setPosition(lightSource, {
      x: lightSource.position.x,
      y: centerY
    });
    // Also reset velocity to zero
    Matter.Body.setVelocity(lightSource, { x: 0, y: 0 });
  }
  
  if (Math.abs(opaqueObject.position.y - centerY) > 1) {
    Matter.Body.setPosition(opaqueObject, {
      x: opaqueObject.position.x,
      y: centerY
    });
    Matter.Body.setVelocity(opaqueObject, { x: 0, y: 0 });
  }
  
  if (Math.abs(screen.position.y - centerY) > 1) {
    Matter.Body.setPosition(screen, {
      x: screen.position.x,
      y: centerY
    });
    Matter.Body.setVelocity(screen, { x: 0, y: 0 });
  }
  
  // Perdenin açısını sıfırlayarak her zaman dik durmasını sağlıyoruz
  if (Math.abs(screen.angle) > 0.001) {
    Matter.Body.setAngle(screen, 0);
  }
  
  // Perdenin açısal hızını sıfırlayarak dönmesini engelliyoruz
  if (Math.abs(screen.angularVelocity) > 0.001) {
    Matter.Body.setAngularVelocity(screen, 0);
  }
  
  // Also ensure horizontal velocities are zero when not being dragged
  if (!isDragging) {
    Matter.Body.setVelocity(lightSource, { x: 0, y: 0 });
    Matter.Body.setVelocity(opaqueObject, { x: 0, y: 0 });
    Matter.Body.setVelocity(screen, { x: 0, y: 0 });
  }
}

// Variable to track drag state
let isDragging = false;

function setupMouseControl() {
  // Add mouse control
  const mouse = Matter.Mouse.create(render.canvas);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: DRAGGABLE_CONSTRAINT,
      render: { visible: false }
    }
  });
  
  Matter.World.add(world, mouseConstraint);
  
  // Keep the mouse in sync with rendering
  render.mouse = mouse;
  
  const centerY = render.options.height / 2;
  
  // Handle drag start
  Matter.Events.on(mouseConstraint, 'startdrag', function(event) {
    isDragging = true;
  });
  
  // Handle drag move - constrain to horizontal axis only
  Matter.Events.on(mouseConstraint, 'mousemove', function() {
    if (mouseConstraint.body && isDragging) {
      // Restrict movement to horizontal only by keeping the original y position
      Matter.Body.setPosition(mouseConstraint.body, {
        x: mouseConstraint.body.position.x,
        y: centerY // Lock to the center Y position
      });
      
      // Enforce object order (light source must be left of object which must be left of screen)
      enforceObjectOrder();
    }
  });
  
  // Handle drag end
  Matter.Events.on(mouseConstraint, 'enddrag', function() {
    isDragging = false;
    
    // Lock the position by making the body completely static after dragging
    if (mouseConstraint.body) {
      // Ensure zero velocity
      Matter.Body.setVelocity(mouseConstraint.body, { x: 0, y: 0 });
      updatePositionControls(); // Update the slider positions to match
    }
  });
}

function enforceObjectOrder() {
  // Get object width based on shape
  let objectWidth = OBJECT_WIDTH;
  if (selectedShape.value === 'triangle') {
    objectWidth = OBJECT_HEIGHT * 0.866;
  }
  
  // Ensure light source is to the left of opaque object
  if (lightSource.position.x >= opaqueObject.position.x - objectWidth/2 - LIGHT_SOURCE_SIZE) {
    Matter.Body.setPosition(lightSource, {
      x: opaqueObject.position.x - objectWidth/2 - LIGHT_SOURCE_SIZE - 5,
      y: lightSource.position.y
    });
  }
  
  // Ensure opaque object is to the left of screen
  if (opaqueObject.position.x >= screen.position.x - SCREEN_WIDTH/2 - objectWidth/2) {
    Matter.Body.setPosition(opaqueObject, {
      x: screen.position.x - SCREEN_WIDTH/2 - objectWidth/2 - 5,
      y: opaqueObject.position.y
    });
  }
  
  // Ensure light source, opaque object, and screen stay within canvas
  const minX = LIGHT_SOURCE_SIZE + 20;
  const maxX = render.options.width - SCREEN_WIDTH/2 - 20;
  
  if (lightSource.position.x < minX) {
    Matter.Body.setPosition(lightSource, { x: minX, y: lightSource.position.y });
  }
  
  if (screen.position.x > maxX) {
    Matter.Body.setPosition(screen, { x: maxX, y: screen.position.y });
  }
}

function calculateDistances() {
  // Calculate distances between objects
  lightToObjectDistance.value = Math.abs(opaqueObject.position.x - lightSource.position.x);
  objectToScreenDistance.value = Math.abs(screen.position.x - opaqueObject.position.x);
  
  // Calculate shadow height based on the positions
  calculateShadowHeight();
}

function calculateShadowHeight() {
  // Calculate shadow height based on light source, object and screen positions
  // Using similar triangles principle
  let objectHeight = OBJECT_HEIGHT;
  
  // Adjust object height based on shape
  if (selectedShape.value === 'triangle') {
    objectHeight = OBJECT_HEIGHT;  // The height of the triangle
  }
  
  const d1 = lightToObjectDistance.value;
  const d2 = objectToScreenDistance.value;
  
  // Shadow height = object height * (d1 + d2) / d1
  shadowHeight.value = objectHeight * (d1 + d2) / d1;
}

function drawLightRays() {
  if (!render || !lightSource || !opaqueObject || !screen) return;
  
  const ctx = render.context;
  
  // Get positions
  const lightX = lightSource.position.x;
  const lightY = lightSource.position.y;
  const objectX = opaqueObject.position.x;
  const objectY = opaqueObject.position.y;
  const screenX = screen.position.x;
  const screenY = screen.position.y;
  
  // Clear previous rays
  lightRays = [];
  
  // Ortak çizim stilleri
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 222, 0, 0.3)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  
  // Perspektif hesaplaması için faktör - (ışık-ekran mesafesi) / (ışık-cisim mesafesi)
  const shadowScale = (lightToObjectDistance.value + objectToScreenDistance.value) / lightToObjectDistance.value;
  
  // Draw appropriate light rays and shadow based on shape
  switch (selectedShape.value) {
    case 'triangle': {
      const triangleHeight = OBJECT_HEIGHT;
      const triangleWidth = triangleHeight * 0.866;
      
      // Üçgenin köşe noktaları
      const topVertex = { x: objectX, y: objectY - triangleHeight/2 };
      const leftVertex = { x: objectX - triangleWidth/2, y: objectY + triangleHeight/2 };
      const rightVertex = { x: objectX + triangleWidth/2, y: objectY + triangleHeight/2 };
      
      // Işık ışınları - Her üç köşeye de ışın çiziyoruz
      // Tepe noktaya ışın
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(topVertex.x, topVertex.y);
      ctx.stroke();
      
      // Sol alt köşeye ışın
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(leftVertex.x, leftVertex.y);
      ctx.stroke();
      
      // Sağ alt köşeye ışın
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(rightVertex.x, rightVertex.y);
      ctx.stroke();
      
      // Gölgedeki köşe noktaları hesaplaması - perspektif uygulanıyor
      // Köşe noktalarının perde üzerinde oluşturduğu gölge konumları
      const shadowTopY = screenY - (objectY - topVertex.y) * shadowScale;
      const shadowLeftX = screenX - (screenX - leftVertex.x < 0 ? SCREEN_WIDTH/2 : (objectX - leftVertex.x) * shadowScale);
      const shadowRightX = screenX + (rightVertex.x - objectX) * shadowScale;
      const shadowBottomY = screenY + (leftVertex.y - objectY) * shadowScale;
      
      // Üçgen şeklindeki gölgeyi çiziyoruz
      ctx.beginPath();
      // Üçgenin perspektifli gölgesi
      ctx.moveTo(screenX, shadowTopY);
      ctx.lineTo(screenX - SCREEN_WIDTH/2, shadowBottomY);
      ctx.lineTo(screenX + SCREEN_WIDTH/2, shadowBottomY);
      ctx.closePath();
      ctx.fill();
      
      // Uzatılmış ışınlar
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(screenX, shadowTopY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(screenX - SCREEN_WIDTH/2, shadowBottomY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(screenX + SCREEN_WIDTH/2, shadowBottomY);
      ctx.stroke();
      break;
    }
    
    case 'rectangle':
    default: {
      // Dikdörtgenin köşe noktaları
      const objectTop = objectY - OBJECT_HEIGHT/2;
      const objectBottom = objectY + OBJECT_HEIGHT/2;
      const objectLeft = objectX - OBJECT_WIDTH/2;
      const objectRight = objectX + OBJECT_WIDTH/2;
      
      // Dikdörtgenin dört köşesine de ışın çiziyoruz
      // Sol üst köşe
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(objectLeft, objectTop);
      ctx.stroke();
      
      // Sol alt köşe
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(objectLeft, objectBottom);
      ctx.stroke();
      
      // Sağ üst köşe - perspektif için
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(objectRight, objectTop);
      ctx.stroke();
      
      // Sağ alt köşe - perspektif için
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(objectRight, objectBottom);
      ctx.stroke();
      
      // Gölge hesaplama
      const shadowTopY = screenY - (OBJECT_HEIGHT/2) * shadowScale;
      const shadowBottomY = screenY + (OBJECT_HEIGHT/2) * shadowScale;
      
      // Dikdörtgen gölge çizimi
      ctx.beginPath();
      ctx.rect(screenX - SCREEN_WIDTH/2, shadowTopY, SCREEN_WIDTH, shadowBottomY - shadowTopY);
      ctx.fill();
      
      // Uzatılmış ışınlar
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(screenX, shadowTopY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(lightX, lightY);
      ctx.lineTo(screenX, shadowBottomY);
      ctx.stroke();
      break;
    }
  }
}

function handleResize() {
  if (!render || !simulationCanvas.value) return;
  
  const oldHeight = render.options.height;
  render.options.width = simulationCanvas.value.offsetWidth;
  render.options.height = simulationCanvas.value.offsetHeight;
  
  Matter.Render.setPixelRatio(render, window.devicePixelRatio);
  
  // Adjust wall positions
  walls.forEach(wall => Matter.World.remove(world, wall));
  createWalls();
  
  // Adjust simulation object positions to fit new canvas size
  const width = render.options.width;
  const height = render.options.height;
  const centerY = height / 2;
  
  // Update positions based on current slider values
  updateObjectPositionsFromControls();
  
  // Update screen height when canvas is resized
  if (screen && height !== oldHeight) {
    // Create a new screen with updated height
    Matter.World.remove(world, screen);
    screen = Matter.Bodies.rectangle(
      screen.position.x, 
      centerY, 
      SCREEN_WIDTH, 
      height, 
      {
        label: 'screen',
        isStatic: false,
        collisionFilter: {
          group: -1
        },
        // Perdenin dönmesini engellemek için atalet değerini çok büyük yapıyoruz
        inertia: Infinity,
        // İlk açıyı sıfır olarak ayarlayalım (dik duracak şekilde)
        angle: 0,
        // Açısal hızı sıfır yapıyoruz
        angularVelocity: 0,
        render: {
          fillStyle: '#E5E7EB',
          strokeStyle: '#D1D5DB',
          lineWidth: 1
        }
      }
    );
    Matter.World.add(world, screen);
  }
}

// Create shapes for the opaque object
function createObjectShape(shape, x, y) {
  const centerX = x;
  const centerY = y;
  let shapeBody;
  
  const objectOptions = {
    label: 'opaqueObject',
    isStatic: false,
    collisionFilter: {
      group: -1 // no collision with other objects
    },
    render: {
      fillStyle: '#6B7280',
      strokeStyle: '#4B5563',
      lineWidth: 1
    }
  };
  
  switch (shape) {
    case 'triangle':
      // Create an equilateral triangle
      const triangleHeight = OBJECT_HEIGHT;
      const triangleWidth = triangleHeight * 0.866; // height * sqrt(3)/2 for equilateral triangle
      
      const triangleVertices = [
        { x: centerX, y: centerY - triangleHeight/2 },
        { x: centerX - triangleWidth/2, y: centerY + triangleHeight/2 },
        { x: centerX + triangleWidth/2, y: centerY + triangleHeight/2 }
      ];
      
      shapeBody = Matter.Bodies.fromVertices(centerX, centerY, [triangleVertices], objectOptions);
      break;
      
    case 'rectangle':
    default:
      // Default rectangle
      shapeBody = Matter.Bodies.rectangle(centerX, centerY, OBJECT_WIDTH, OBJECT_HEIGHT, objectOptions);
      break;
  }
  
  return shapeBody;
}

// Change the shape of the opaque object
function changeObjectShape(shape) {
  // Eğer mevcut şekil kare veya yıldız ise ve şimdi kaldırıldıysa, dikdörtgene ayarla
  if ((selectedShape.value === 'square' || selectedShape.value === 'star') && (shape === 'square' || shape === 'star')) {
    shape = 'rectangle';
  }
  
  selectedShape.value = shape;
  
  // Save the current position
  const currentPos = { x: opaqueObject.position.x, y: opaqueObject.position.y };
  
  // Remove the current object
  Matter.World.remove(world, opaqueObject);
  
  // Create a new object with the selected shape
  opaqueObject = createObjectShape(shape, currentPos.x, currentPos.y);
  
  // Add the new object to the world
  Matter.World.add(world, opaqueObject);
}

// Function to change background color
function changeBackgroundColor(color) {
  if (!render) return;
  
  // Update render background
  render.options.background = color;
  
  // Update wall colors to match background
  walls.forEach(wall => {
    wall.render.fillStyle = color;
    wall.render.strokeStyle = color;
  });
}
</script>

<style scoped>
canvas {
  max-width: 100%;
  display: block;
}

/* Custom slider styles */
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #374151;
  outline: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

input[type=range]:hover {
  opacity: 1;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: all 0.15s ease-in-out;
}

input[type=range]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: all 0.15s ease-in-out;
}

/* Slider colors for each component */
.slider-light::-webkit-slider-thumb {
  background: #FFDE00;
}
.slider-light::-moz-range-thumb {
  background: #FFDE00;
}

.slider-object::-webkit-slider-thumb {
  background: #6B7280;
}
.slider-object::-moz-range-thumb {
  background: #6B7280;
}

.slider-screen::-webkit-slider-thumb {
  background: #E5E7EB;
}
.slider-screen::-moz-range-thumb {
  background: #E5E7EB;
}

/* Custom utility classes */
.bg-gray-650 {
  background-color: #3f495a;
}

/* Transition classes */
.transition-transform {
  transition-property: transform;
}

.duration-300 {
  transition-duration: 300ms;
}

.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .translate-x-full {
    transform: translateX(100%);
  }
  
  .translate-x-0 {
    transform: translateX(0);
  }
}
</style>
  
 
 