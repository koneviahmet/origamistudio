<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">

    
    <!-- Controls Panel -->
    <div class="w-full max-w-3xl bg-gray-800 rounded-lg p-4 mb-4">
      <h2 class="text-lg font-bold text-white mb-2">Konum Ayarları</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Light Source Controls -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-white text-sm font-semibold mb-2">Işık Kaynağı</h3>
          <div class="flex flex-col">
            <label for="lightSourcePosition" class="text-gray-300 text-xs mb-1">Konum ({{ lightPositionPercent }}%)</label>
            <input 
              id="lightSourcePosition" 
              type="range" 
              min="0" 
              max="100" 
              step="1" 
              v-model="lightPositionPercent"
              @input="updateObjectPositionsFromControls"
              class="w-full"
            >
          </div>
        </div>
        
        <!-- Opaque Object Controls -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-white text-sm font-semibold mb-2">Opak Cisim</h3>
          <div class="flex flex-col">
            <label for="opaqueObjectPosition" class="text-gray-300 text-xs mb-1">Konum ({{ objectPositionPercent }}%)</label>
            <input 
              id="opaqueObjectPosition" 
              type="range" 
              min="0" 
              max="100"
              step="1"
              v-model="objectPositionPercent"
              @input="updateObjectPositionsFromControls" 
              class="w-full"
            >
          </div>
        </div>
        
        <!-- Screen Controls -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-white text-sm font-semibold mb-2">Perde</h3>
          <div class="flex flex-col">
            <label for="screenPosition" class="text-gray-300 text-xs mb-1">Konum ({{ screenPositionPercent }}%)</label>
            <input 
              id="screenPosition" 
              type="range" 
              min="0" 
              max="100" 
              step="1"
              v-model="screenPositionPercent"
              @input="updateObjectPositionsFromControls"
              class="w-full"
            >
          </div>
        </div>
      </div>
      
      <!-- Reset Button -->
      <div class="mt-3 flex justify-center">
        <button 
          @click="resetPositions" 
          class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded text-sm"
        >
          Varsayılan Konumlara Sıfırla
        </button>
      </div>
    </div>
    
    <!-- Simulation Canvas -->
    <div class="relative w-full max-w-3xl bg-gray-800 rounded-lg overflow-hidden">
      <canvas ref="simulationCanvas" class="w-full h-64 md:h-96"></canvas>
      
      <!-- Information Panel -->
      <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <div>
          <p>Işık Kaynağı - Opak Cisim Mesafesi: {{ (lightToObjectDistance).toFixed(0) }}px</p>
          <p>Opak Cisim - Perde Mesafesi: {{ (objectToScreenDistance).toFixed(0) }}px</p>
          <p>Gölge Boyu: {{ (shadowHeight).toFixed(0) }}px</p>
        </div>
      </div>
      
      <!-- Instructions -->
      <div class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        <p>Işık kaynağını, opak cismi veya perdeyi sürükleyerek konumlarını değiştirebilirsiniz.</p>
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

// Position controls (percentage of available space)
const lightPositionPercent = ref(15);
const objectPositionPercent = ref(50);
const screenPositionPercent = ref(85);

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
  
  // Enforce ordering constraints
  if (newLightX >= newObjectX - OBJECT_WIDTH/2 - LIGHT_SOURCE_SIZE) {
    lightPositionPercent.value = Math.max(0, objectPositionPercent.value - 15);
    return updateObjectPositionsFromControls();
  }
  
  if (newObjectX >= newScreenX - SCREEN_WIDTH/2 - OBJECT_WIDTH/2) {
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
  
  // Opaque object (middle)
  opaqueObject = Matter.Bodies.rectangle(width * (objectPositionPercent.value / 100), centerY, OBJECT_WIDTH, OBJECT_HEIGHT, {
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
  });
  
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
  // Ensure light source is to the left of opaque object
  if (lightSource.position.x >= opaqueObject.position.x - OBJECT_WIDTH/2 - LIGHT_SOURCE_SIZE) {
    Matter.Body.setPosition(lightSource, {
      x: opaqueObject.position.x - OBJECT_WIDTH/2 - LIGHT_SOURCE_SIZE - 5,
      y: lightSource.position.y
    });
  }
  
  // Ensure opaque object is to the left of screen
  if (opaqueObject.position.x >= screen.position.x - SCREEN_WIDTH/2 - OBJECT_WIDTH/2) {
    Matter.Body.setPosition(opaqueObject, {
      x: screen.position.x - SCREEN_WIDTH/2 - OBJECT_WIDTH/2 - 5,
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
  const objectHeight = OBJECT_HEIGHT;
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
  
  // Get dimensions
  const objectTop = objectY - OBJECT_HEIGHT/2;
  const objectBottom = objectY + OBJECT_HEIGHT/2;
  
  // Clear previous rays
  lightRays = [];
  
  // Draw rays from light source
  ctx.lineWidth = 1;
  
  // Draw rays that hit the object (creates shadow)
  ctx.strokeStyle = 'rgba(255, 222, 0, 0.3)';
  
  // Ray to top of object
  ctx.beginPath();
  ctx.moveTo(lightX, lightY);
  ctx.lineTo(objectX - OBJECT_WIDTH/2, objectTop);
  ctx.stroke();
  
  // Ray to bottom of object
  ctx.beginPath();
  ctx.moveTo(lightX, lightY);
  ctx.lineTo(objectX - OBJECT_WIDTH/2, objectBottom);
  ctx.stroke();
  
  // Calculate shadow boundaries on screen
  const shadowTopY = screenY - shadowHeight.value/2;
  const shadowBottomY = screenY + shadowHeight.value/2;
  
  // Draw shadow area
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.rect(screenX - SCREEN_WIDTH/2, shadowTopY, SCREEN_WIDTH, shadowHeight.value);
  ctx.fill();
  
  // Draw extended rays to create shadow boundaries
  ctx.strokeStyle = 'rgba(255, 222, 0, 0.3)';
  
  // Extended ray from top of object to top of shadow
  ctx.beginPath();
  ctx.moveTo(lightX, lightY);
  ctx.lineTo(screenX, shadowTopY);
  ctx.stroke();
  
  // Extended ray from bottom of object to bottom of shadow
  ctx.beginPath();
  ctx.moveTo(lightX, lightY);
  ctx.lineTo(screenX, shadowBottomY);
  ctx.stroke();
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
</script>

<style scoped>
canvas {
  max-width: 100%;
}

input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #4B5563;
  outline: none;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3B82F6;
  cursor: pointer;
}

input[type=range]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3B82F6;
  cursor: pointer;
}
</style>
  
 
 