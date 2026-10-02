<template>
  <div class="w-full h-screen  text-white">
    <div class="w-full mx-auto">

      <!-- Simulation Canvas -->
      <div class="bg-gray-800 bg-opacity-70  overflow-hidden flex-grow relative">
        <canvas 
          ref="canvas"
          class="w-full h-full"
        ></canvas>
        
        <div class="absolute top-4 left-4 z-10">
          <button 
            @click="toggleSimulation" 
            class="lg:px-6 lg:py-2 px-3 py-1 text-xs lg:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-lg text-white font-medium"
          >
            {{ isRunning ? 'Aç' : 'Kapat' }}
          </button>
        </div>
        
        <div class="absolute top-4 right-4 z-10 ">
          <div class="bg-black bg-opacity-50 backdrop-blur-sm p-3 rounded-lg shadow-lg hidden lg:block">
            <div class="flex items-center gap-3 mb-3">
              <label for="lightSource" class="lg:text-sm text-2xs font-medium text-blue-300">Işık Kaynağı:</label>
              <select 
                id="lightSource" 
                v-model="lightSourceType" 
                @change="resetSimulation" 
                class="bg-indigo-900 bg-opacity-70 rounded-md px-2 py-1.5 lg:text-sm text-2xs border border-indigo-500/50 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
              >
                <option value="point">Nokta Işık Kaynağı</option>
                <option value="laser">Lazer Işını</option>
              </select>
            </div>
            
            <div class="flex items-center gap-3">
              <label for="rayCount" class="lg:text-sm text-2xs font-medium text-blue-300">Işın Sayısı:</label>
              <input 
                id="rayCount" 
                type="range" 
                v-model.number="rayCount" 
                min="1" 
                max="20" 
                @change="resetSimulation"
                class="w-28 accent-blue-500"
              />
              <span class="lg:text-sm text-2xs font-medium bg-indigo-800 px-2 py-0.5 rounded-md min-w-[2rem] text-center">{{ rayCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

// Reactive state
const canvas = ref(null);
const isRunning = ref(false);
const lightSourceType = ref('point');
const rayCount = ref(18);

// Canvas context
let ctx = null;
let animationId = null;
let canvasWidth = 0;
let canvasHeight = 0;

// Simulation objects
let lightSource = { x: 0, y: 0, radius: 15 };
let obstacles = [];
let draggingObstacle = null;
let mouseX = 0;
let mouseY = 0;
let mouseOffsetX = 0;
let mouseOffsetY = 0;

// Initialize simulation
onMounted(() => {
  if (!canvas.value) return;
  
  // Setup canvas
  ctx = canvas.value.getContext('2d');
  resizeCanvas();
  
  // Create initial obstacles
  createObstacles();
  
  // Setup light source
  updateLightSource();
  
  // Add event listeners
  window.addEventListener('resize', resizeCanvas);
  canvas.value.addEventListener('mousedown', handleMouseDown);
  canvas.value.addEventListener('mousemove', handleMouseMove);
  canvas.value.addEventListener('mouseup', handleMouseUp);
  canvas.value.addEventListener('touchstart', handleTouchStart);
  canvas.value.addEventListener('touchmove', handleTouchMove);
  canvas.value.addEventListener('touchend', handleTouchEnd);
  
  // Start rendering
  drawScene();
  
  // Auto-start simulation
  setTimeout(() => {
    isRunning.value = true;
  }, 500);
});

// Cleanup
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', resizeCanvas);
  
  if (canvas.value) {
    canvas.value.removeEventListener('mousedown', handleMouseDown);
    canvas.value.removeEventListener('mousemove', handleMouseMove);
    canvas.value.removeEventListener('mouseup', handleMouseUp);
    canvas.value.removeEventListener('touchstart', handleTouchStart);
    canvas.value.removeEventListener('touchmove', handleTouchMove);
    canvas.value.removeEventListener('touchend', handleTouchEnd);
  }
});

// Watch for changes
watch([lightSourceType, rayCount], () => {
  updateLightSource();
});

// Functions
function resizeCanvas() {
  if (!canvas.value || !ctx) return;
  
  const rect = canvas.value.getBoundingClientRect();
  canvas.value.width = rect.width;
  canvas.value.height = rect.height;
  
  canvasWidth = canvas.value.width;
  canvasHeight = canvas.value.height;
  
  // Update light source position when canvas size changes
  updateLightSource();
  
  // Redraw scene
  drawScene();
}

function createObstacles() {
  obstacles = [
    // Center obstacle
    {
      x: canvasWidth * 0.5,
      y: canvasHeight * 0.5,
      width: 120,
      height: 30,
      draggable: true,
      color: '#6366F1'
    }
  ];
}

function updateLightSource() {
  // Position light source based on canvas size
  const margin = Math.min(canvasWidth, canvasHeight) * 0.1;
  
  switch (lightSourceType.value) {
    case 'point':
      lightSource = {
        x: margin,
        y: canvasHeight * 0.5,
        radius: 20,
        color: '#60A5FA',
        glowColor: 'rgba(96, 165, 250, 0.5)',
        type: 'point'
      };
      break;
    case 'laser':
      lightSource = {
        x: margin / 2,
        y: canvasHeight * 0.5,
        width: 15,
        height: 40,
        color: '#F87171',
        glowColor: 'rgba(248, 113, 113, 0.5)',
        type: 'laser'
      };
      break;
    default:
      lightSource = {
        x: margin,
        y: canvasHeight * 0.5,
        radius: 20,
        color: '#60A5FA',
        glowColor: 'rgba(96, 165, 250, 0.5)',
        type: 'point'
      };
  }
}

function drawScene() {
  if (!ctx || !canvas.value) return;
  
  // Clear canvas
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw grid
  drawGrid();
  
  // Draw obstacles
  obstacles.forEach(obstacle => {
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(
      obstacle.x - obstacle.width / 2,
      obstacle.y - obstacle.height / 2,
      obstacle.width,
      obstacle.height
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });
  
  // Draw light source
  if (lightSource.type === 'point') {
    // Draw glow effect
    const gradient = ctx.createRadialGradient(
      lightSource.x, lightSource.y, 0,
      lightSource.x, lightSource.y, lightSource.radius * 2
    );
    gradient.addColorStop(0, lightSource.glowColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(lightSource.x, lightSource.y, lightSource.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(lightSource.x, lightSource.y, lightSource.radius, 0, Math.PI * 2);
    ctx.fillStyle = lightSource.color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (lightSource.type === 'laser') {
    // Draw glow effect
    ctx.shadowColor = lightSource.glowColor;
    ctx.shadowBlur = 15;
    
    // Draw main rectangle
    ctx.fillStyle = lightSource.color;
    ctx.fillRect(
      lightSource.x - lightSource.width / 2,
      lightSource.y - lightSource.height / 2,
      lightSource.width,
      lightSource.height
    );
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      lightSource.x - lightSource.width / 2,
      lightSource.y - lightSource.height / 2,
      lightSource.width,
      lightSource.height
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  
  // Draw light rays if simulation is running
  if (isRunning.value) {
    drawLightRays();
  }
  
  // Request next frame
  animationId = requestAnimationFrame(drawScene);
}

// Draw subtle grid
function drawGrid() {
  const gridSize = 30;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  // Draw vertical lines
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

function drawLightRays() {
  const rayAngleStep = (Math.PI * 2) / rayCount.value;
  let startAngle = 0;
  let sourceX = 0;
  let sourceY = 0;
  
  // Set source position and starting angle based on light source type
  if (lightSource.type === 'point') {
    sourceX = lightSource.x;
    sourceY = lightSource.y;
    // For point light source, start at a small offset to avoid alignment issues with obstacles
    startAngle = 0.1;
  } else if (lightSource.type === 'laser') {
    sourceX = lightSource.x + lightSource.width / 2;
    sourceY = lightSource.y;
    startAngle = -Math.PI / 4;
  }
  
  // Draw each ray
  for (let i = 0; i < rayCount.value; i++) {
    let angle;
    
    // Calculate ray angle based on source type
    if (lightSource.type === 'laser') {
      // Laser fires rays in a narrow cone
      angle = startAngle + (Math.PI / 2) * (i / (rayCount.value - 1 || 1));
    } else if (lightSource.type === 'point') {
      // Point source emits in all directions
      angle = startAngle + rayAngleStep * i;
    }
    
    // Calculate ray end point (very far away)
    const rayLength = Math.max(canvasWidth, canvasHeight) * 2;
    let endX = sourceX + Math.cos(angle) * rayLength;
    let endY = sourceY + Math.sin(angle) * rayLength;
    
    // Check for intersections with all obstacles
    let closestDist = rayLength;
    let closestPoint = { x: endX, y: endY };
    let hitObstacle = false;
    
    for (const obstacle of obstacles) {
      const intersection = rayRectIntersection(
        sourceX, sourceY, endX, endY,
        obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2,
        obstacle.width, obstacle.height
      );
      
      if (intersection) {
        const dx = intersection.x - sourceX;
        const dy = intersection.y - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
          closestDist = dist;
          closestPoint = intersection;
          hitObstacle = true;
        }
      }
    }
    
    // Draw the ray with appropriate style
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(closestPoint.x, closestPoint.y);
    
    // Set ray style based on light source type
    if (lightSource.type === 'laser') {
      ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
      ctx.lineWidth = 3;
    } else if (lightSource.type === 'point') {
      ctx.shadowColor = 'rgba(96, 165, 250, 0.7)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
      ctx.lineWidth = 2;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw impact point only if we hit an obstacle
    if (hitObstacle) {
      ctx.beginPath();
      ctx.arc(closestPoint.x, closestPoint.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = lightSource.color;
      ctx.fill();
    }
  }
}

// Utility function to find intersection between a ray and a rectangle
function rayRectIntersection(x1, y1, x2, y2, rectX, rectY, rectWidth, rectHeight) {
  // Ray vector
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Rectangle bounds
  const minX = rectX;
  const minY = rectY;
  const maxX = rectX + rectWidth;
  const maxY = rectY + rectHeight;
  
  // Calculate intersection with each edge of the rectangle
  let tMin = -Infinity;
  let tMax = Infinity;
  let intersectionPoint = null;
  
  if (Math.abs(dx) > 0.0001) {
    const txMin = (minX - x1) / dx;
    const txMax = (maxX - x1) / dx;
    tMin = Math.max(tMin, Math.min(txMin, txMax));
    tMax = Math.min(tMax, Math.max(txMin, txMax));
  }
  
  if (Math.abs(dy) > 0.0001) {
    const tyMin = (minY - y1) / dy;
    const tyMax = (maxY - y1) / dy;
    tMin = Math.max(tMin, Math.min(tyMin, tyMax));
    tMax = Math.min(tMax, Math.max(tyMin, tyMax));
  }
  
  // If we have a valid intersection
  if (tMax >= tMin && tMax > 0) {
    // Get the earliest hit
    const t = (tMin > 0) ? tMin : tMax;
    
    // Calculate the intersection point
    intersectionPoint = {
      x: x1 + dx * t,
      y: y1 + dy * t
    };
  }
  
  return intersectionPoint;
}

// Mouse and touch interaction
function handleMouseDown(e) {
  const rect = canvas.value.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  
  // Check if clicking on the light source
  if (
    mouseX > lightSource.x - lightSource.radius &&
    mouseX < lightSource.x + lightSource.radius &&
    mouseY > lightSource.y - lightSource.radius &&
    mouseY < lightSource.y + lightSource.radius
  ) {
    draggingObstacle = lightSource;
    mouseOffsetX = mouseX - lightSource.x;
    mouseOffsetY = mouseY - lightSource.y;
    return;
  }
  
  // Check if clicking on an obstacle
  for (const obstacle of obstacles) {
    if (!obstacle.draggable) continue;
    
    if (
      mouseX > obstacle.x - obstacle.width / 2 &&
      mouseX < obstacle.x + obstacle.width / 2 &&
      mouseY > obstacle.y - obstacle.height / 2 &&
      mouseY < obstacle.y + obstacle.height / 2
    ) {
      draggingObstacle = obstacle;
      mouseOffsetX = mouseX - obstacle.x;
      mouseOffsetY = mouseY - obstacle.y;
      break;
    }
  }
}

function handleMouseMove(e) {
  if (!draggingObstacle) return;
  
  const rect = canvas.value.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  
  draggingObstacle.x = mouseX - mouseOffsetX;
  draggingObstacle.y = mouseY - mouseOffsetY;
}

function handleMouseUp() {
  draggingObstacle = null;
}

// Touch events (for mobile)
function handleTouchStart(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    const rect = canvas.value.getBoundingClientRect();
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
    
    // Check if touching the light source
    if (
      mouseX > lightSource.x - lightSource.radius &&
      mouseX < lightSource.x + lightSource.radius &&
      mouseY > lightSource.y - lightSource.radius &&
      mouseY < lightSource.y + lightSource.radius
    ) {
      draggingObstacle = lightSource;
      mouseOffsetX = mouseX - lightSource.x;
      mouseOffsetY = mouseY - lightSource.y;
      return;
    }
    
    // Check if touching an obstacle
    for (const obstacle of obstacles) {
      if (!obstacle.draggable) continue;
      
      if (
        mouseX > obstacle.x - obstacle.width / 2 &&
        mouseX < obstacle.x + obstacle.width / 2 &&
        mouseY > obstacle.y - obstacle.height / 2 &&
        mouseY < obstacle.y + obstacle.height / 2
      ) {
        draggingObstacle = obstacle;
        mouseOffsetX = mouseX - obstacle.x;
        mouseOffsetY = mouseY - obstacle.y;
        break;
      }
    }
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (draggingObstacle && e.touches.length > 0) {
    const touch = e.touches[0];
    const rect = canvas.value.getBoundingClientRect();
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
    
    draggingObstacle.x = mouseX - mouseOffsetX;
    draggingObstacle.y = mouseY - mouseOffsetY;
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  draggingObstacle = null;
}

// Simulation controls
function toggleSimulation() {
  isRunning.value = !isRunning.value;
}

function resetSimulation() {
  // Reset obstacles to their original positions
  createObstacles();
  
  // Update light source
  updateLightSource();
}
</script>

<style scoped>
canvas {
  display: block;
  touch-action: none;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

button {
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

select, input {
  border: none;
  outline: none;
  transition: all 0.3s ease;
}

select:hover, input:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

select:focus, input:focus {
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.5);
}
</style>
  
 
 