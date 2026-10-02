<template>
  <!-- Main container with full height and width -->
  <div class="flex flex-col min-h-screen bg-gray-900 text-white">
    
    <!-- Simulation Title for all screen sizes -->
    <div class="flex items-center justify-between bg-gray-800 p-3">
      <div class="md:hidden">
        <button @click="showMobileSettings = !showMobileSettings" class="text-white bg-gray-700 p-2 rounded-lg focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      <div class="w-8 md:hidden"></div> <!-- Spacer for mobile centered title -->
    </div>

    <!-- Simulation Canvas and Controls Container -->
    <div class="flex flex-col md:flex-row flex-grow relative">
      <!-- Simulation Canvas -->
      <div class="relative flex-grow bg-gray-800 overflow-hidden" style="min-height: 50vh;">
        <div ref="canvasContainer" class="w-full h-full absolute inset-0"></div>
        
        <!-- Force Vectors Display -->
        <div class="absolute top-4 left-4 bg-gray-800/90 p-2 rounded-md text-xs md:text-sm z-10">
          <div class="flex items-center mb-1">
            <div class="w-3 md:w-4 h-0.5 bg-blue-500 mr-2"></div>
            <span>F1 (Sağa): {{ f1 }} N</span>
          </div>
          <div class="flex items-center mb-1">
            <div class="w-3 md:w-4 h-0.5 bg-red-500 mr-2"></div>
            <span>F2 (Sağa): {{ f2 }} N</span>
          </div>
          <div class="flex items-center mb-1">
            <div class="w-3 md:w-4 h-0.5 bg-green-500 mr-2"></div>
            <span>F3 (Sola): {{ f3 }} N</span>
          </div>
          <div class="flex items-center mb-1">
            <div class="w-3 md:w-4 h-0.5 bg-purple-500 mr-2"></div>
            <span>F4 (Sola): {{ f4 }} N</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 md:w-4 h-0.5 mr-2" :class="resultantForce > 0 ? 'bg-green-500' : resultantForce < 0 ? 'bg-yellow-500' : 'bg-gray-500'"></div>
            <span>Bileşke: {{ Math.abs(resultantForce) }} N {{ resultantForceDirection }}</span>
          </div>
        </div>
      </div>
      
      <!-- Controls Panel for Desktop -->
      <div class="bg-gray-800 p-4 rounded-lg shadow-lg w-full md:w-96 hidden md:block">
        
        <!-- F1 Control (Right Force) -->
        <div class="mb-6">
          <div class="flex justify-between mb-1">
            <label for="f1-slider" class="text-sm font-medium">F1 (Sağa Kuvvet)</label>
            <span class="text-blue-400">{{ f1 }} N</span>
          </div>
          <input 
            id="f1-slider" 
            type="range" 
            min="0" 
            max="20" 
            step="1" 
            v-model.number="f1"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 N</span>
            <span>20 N</span>
          </div>
        </div>
        
        <!-- F2 Control (Right Force) -->
        <div class="mb-6">
          <div class="flex justify-between mb-1">
            <label for="f2-slider" class="text-sm font-medium">F2 (Sağa Kuvvet)</label>
            <span class="text-red-400">{{ f2 }} N</span>
          </div>
          <input 
            id="f2-slider" 
            type="range" 
            min="0" 
            max="20" 
            step="1" 
            v-model.number="f2"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 N</span>
            <span>20 N</span>
          </div>
        </div>
        
        <!-- F3 Control (Left Force) -->
        <div class="mb-6">
          <div class="flex justify-between mb-1">
            <label for="f3-slider" class="text-sm font-medium">F3 (Sola Kuvvet)</label>
            <span class="text-green-400">{{ f3 }} N</span>
          </div>
          <input 
            id="f3-slider" 
            type="range" 
            min="0" 
            max="20" 
            step="1" 
            v-model.number="f3"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 N</span>
            <span>20 N</span>
          </div>
        </div>
        
        <!-- F4 Control (Left Force) -->
        <div class="mb-6">
          <div class="flex justify-between mb-1">
            <label for="f4-slider" class="text-sm font-medium">F4 (Sola Kuvvet)</label>
            <span class="text-purple-400">{{ f4 }} N</span>
          </div>
          <input 
            id="f4-slider" 
            type="range" 
            min="0" 
            max="20" 
            step="1" 
            v-model.number="f4"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 N</span>
            <span>20 N</span>
          </div>
        </div>
        
        <!-- Resultant Force Display -->
        <div class="bg-gray-700 p-3 rounded-lg">
          <h3 class="text-sm font-medium mb-2">Bileşke Kuvvet</h3>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-6 h-6 flex items-center justify-center rounded-full" 
                   :class="resultantForce > 0 ? 'bg-green-500' : resultantForce < 0 ? 'bg-yellow-500' : 'bg-gray-500'">
                <span v-if="resultantForce > 0">←</span>
                <span v-else-if="resultantForce < 0">→</span>
                <span v-else>⊙</span>
              </div>
              <span class="ml-2">{{ Math.abs(resultantForce) }} N</span>
            </div>
            <span class="text-sm">{{ resultantForceDirection }}</span>
          </div>
        </div>

        <!-- Reset Button -->
        <button 
          @click="resetValues" 
          class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          v-if="isDefaultChanged"
        >
          Değerleri Sıfırla
        </button>
      </div>

      <!-- Mobile Settings Modal -->
      <div 
        v-if="showMobileSettings" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 md:hidden"
      >
        <div class="absolute inset-0 bg-black opacity-50" @click="showMobileSettings = false"></div>
        <div class="relative bg-gray-800 rounded-lg shadow-lg w-full max-w-sm max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center p-4 border-b border-gray-700">
            <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-4">
            <!-- F1 Control (Right Force) -->
            <div class="mb-6">
              <div class="flex justify-between mb-1">
                <label for="f1-slider-mobile" class="text-sm font-medium">F1 (Sağa Kuvvet)</label>
                <span class="text-blue-400">{{ f1 }} N</span>
              </div>
              <input 
                id="f1-slider-mobile" 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                v-model.number="f1"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 N</span>
                <span>20 N</span>
              </div>
            </div>
            
            <!-- F2 Control (Right Force) -->
            <div class="mb-6">
              <div class="flex justify-between mb-1">
                <label for="f2-slider-mobile" class="text-sm font-medium">F2 (Sağa Kuvvet)</label>
                <span class="text-red-400">{{ f2 }} N</span>
              </div>
              <input 
                id="f2-slider-mobile" 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                v-model.number="f2"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 N</span>
                <span>20 N</span>
              </div>
            </div>
            
            <!-- F3 Control (Left Force) -->
            <div class="mb-6">
              <div class="flex justify-between mb-1">
                <label for="f3-slider-mobile" class="text-sm font-medium">F3 (Sola Kuvvet)</label>
                <span class="text-green-400">{{ f3 }} N</span>
              </div>
              <input 
                id="f3-slider-mobile" 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                v-model.number="f3"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 N</span>
                <span>20 N</span>
              </div>
            </div>
            
            <!-- F4 Control (Left Force) -->
            <div class="mb-6">
              <div class="flex justify-between mb-1">
                <label for="f4-slider-mobile" class="text-sm font-medium">F4 (Sola Kuvvet)</label>
                <span class="text-purple-400">{{ f4 }} N</span>
              </div>
              <input 
                id="f4-slider-mobile" 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                v-model.number="f4"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 N</span>
                <span>20 N</span>
              </div>
            </div>
            
            <!-- Resultant Force Display -->
            <div class="bg-gray-700 p-3 rounded-lg">
              <h3 class="text-sm font-medium mb-2">Bileşke Kuvvet</h3>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-6 h-6 flex items-center justify-center rounded-full" 
                       :class="resultantForce > 0 ? 'bg-green-500' : resultantForce < 0 ? 'bg-yellow-500' : 'bg-gray-500'">
                    <span v-if="resultantForce > 0">←</span>
                    <span v-else-if="resultantForce < 0">→</span>
                    <span v-else>⊙</span>
                  </div>
                  <span class="ml-2">{{ Math.abs(resultantForce) }} N</span>
                </div>
                <span class="text-sm">{{ resultantForceDirection }}</span>
              </div>
            </div>

            <!-- Reset Button -->
            <button 
              @click="resetValues" 
              class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              v-if="isDefaultChanged"
            >
              Değerleri Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import Matter from 'matter-js';

// State variables
const f1 = ref(5); // Right force (N)
const f2 = ref(8); // Right force (N)
const f3 = ref(3); // Left force (N) - New
const f4 = ref(2); // Left force (N) - New
const canvasContainer = ref(null);
const showMobileSettings = ref(false);

// Default values for reset
const defaultValues = {
  f1: 5,
  f2: 8,
  f3: 3,
  f4: 2
};

// Check if current values are different from defaults
const isDefaultChanged = computed(() => {
  return f1.value !== defaultValues.f1 || 
         f2.value !== defaultValues.f2 || 
         f3.value !== defaultValues.f3 || 
         f4.value !== defaultValues.f4;
});

// Reset values to defaults
const resetValues = () => {
  f1.value = defaultValues.f1;
  f2.value = defaultValues.f2;
  f3.value = defaultValues.f3;
  f4.value = defaultValues.f4;
};

// Physics variables
let engine, render, world, box, ground, leftWall, rightWall, ceiling;
let rightForceArrow, rightForceArrow2, leftForceArrow, leftForceArrow2, resultantForceArrow;
let rightArrowHead, rightArrowHead2, leftArrowHead, leftArrowHead2; // Ok başları için değişkenler
const forceScale = 0.01; // Scale factor to convert Newtons to Matter.js force

// Computed properties
const resultantForce = computed(() => {
  // Sağa ve sola kuvvetlerin bileşkesi hesaplanıyor
  return f1.value + f2.value - f3.value - f4.value;
});

const resultantForceDirection = computed(() => {
  if (resultantForce.value > 0) return '(Sağa)';
  if (resultantForce.value < 0) return '(Sola)';
  return '(Durağan)';
});

// Initialize Matter.js physics engine
const initPhysics = () => {
  // Module aliases
  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const World = Matter.World;
  const Bodies = Matter.Bodies;
  const Body = Matter.Body;
  
  // Create engine and world
  engine = Engine.create({
    // Lower gravity for better visualization
    gravity: { x: 0, y: 0.2 }
  });
  world = engine.world;
  
  // Create renderer
  const containerWidth = canvasContainer.value.clientWidth;
  const containerHeight = canvasContainer.value.clientHeight;
  
  // Detect if we're on mobile
  const isMobile = window.innerWidth < 768;
  
  // Ensure container has proper dimensions
  if (containerWidth === 0 || containerHeight === 0) {
    console.warn('Canvas container has zero dimensions, forcing minimum size');
    canvasContainer.value.style.minHeight = '400px';
    canvasContainer.value.style.minWidth = '100%';
  }
  
  render = Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: containerWidth || 800, // Fallback width
      height: containerHeight || 600, // Fallback height
      wireframes: false,
      background: '#1f2937', // Match the bg-gray-800 color
      showVelocity: true
    }
  });
  
  // Ensure the canvas is visible and properly sized
  if (render.canvas) {
    render.canvas.style.width = '100%';
    render.canvas.style.height = '100%';
  }
  
  // Create box (the object that will have forces applied)
  // Adjust box size to be visible on all screens
  const boxSize = Math.min(
    Math.max(containerWidth, 800), 
    Math.max(containerHeight, 600)
  ) * (isMobile ? 0.08 : 0.1);
  
  box = Bodies.rectangle(
    (containerWidth || 800) / 2,
    (containerHeight || 600) / 2,
    boxSize,
    boxSize,
    {
      frictionAir: 0.05,
      render: {
        fillStyle: '#4f46e5', // Indigo color
        strokeStyle: '#818cf8',
        lineWidth: 2,
        visible: true // Explicitly set visibility
      }
    }
  );
  
  // Create boundaries (floor, ceiling, walls) with the same color as background
  const wallThickness = 50;
  ground = Bodies.rectangle(
    containerWidth / 2,
    containerHeight + wallThickness / 2,
    containerWidth,
    wallThickness,
    { isStatic: true, render: { fillStyle: '#1f2937' } }
  );
  
  ceiling = Bodies.rectangle(
    containerWidth / 2,
    -wallThickness / 2,
    containerWidth,
    wallThickness,
    { isStatic: true, render: { fillStyle: '#1f2937' } }
  );
  
  leftWall = Bodies.rectangle(
    -wallThickness / 2,
    containerHeight / 2,
    wallThickness,
    containerHeight,
    { isStatic: true, render: { fillStyle: '#1f2937' } }
  );
  
  rightWall = Bodies.rectangle(
    containerWidth + wallThickness / 2,
    containerHeight / 2,
    wallThickness,
    containerHeight,
    { isStatic: true, render: { fillStyle: '#1f2937' } }
  );
  
  // Create force arrows (visual representation only)
  // Scale arrows for better visibility on mobile
  const arrowSize = boxSize * (isMobile ? 0.6 : 0.8);
  const arrowThickness = isMobile ? 6 : 8;
  
  // Sağ Kuvvet (Mavi) Ok - F1
  rightForceArrow = Bodies.rectangle(
    box.position.x - boxSize/2 - arrowSize/2,
    box.position.y - (isMobile ? 15 : 20), // Vertikalde biraz daha yakın (mobilde)
    arrowSize,
    arrowThickness,
    {
      isStatic: false,
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#3b82f6', // Mavi
        strokeStyle: 'transparent',
        width: arrowSize
      }
    }
  );
  
  // Sağ Ok Başı (Üçgen) - F1
  rightArrowHead = Bodies.polygon(
    box.position.x - boxSize/2 - arrowSize - 10,
    box.position.y - (isMobile ? 15 : 20),
    3, // 3 köşeli üçgen
    isMobile ? 9 : 12, // Mobilde daha küçük
    {
      isStatic: false, 
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#3b82f6', // Mavi
        strokeStyle: 'transparent'
      }
    }
  );
  // Üçgeni döndürerek ok başı yönünü ayarla (sağa doğru) - F1 sağa doğru kuvvet
  Matter.Body.rotate(rightArrowHead, 0); // Üçgen başı sağı göstersin
  
  // Sağ Kuvvet Ok (İkinci kuvvet, kırmızı) - F2
  rightForceArrow2 = Bodies.rectangle(
    box.position.x - boxSize/2 - arrowSize/2,
    box.position.y, // Ortada
    arrowSize,
    arrowThickness,
    {
      isStatic: false,
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#ef4444', // Kırmızı
        strokeStyle: 'transparent',
        width: arrowSize
      }
    }
  );
  
  // Sağ Ok Başı (İkinci kuvvet) - F2
  rightArrowHead2 = Bodies.polygon(
    box.position.x - boxSize/2 - arrowSize - 10,
    box.position.y, // Ortada
    3, // 3 köşeli üçgen
    isMobile ? 9 : 12, // Mobilde daha küçük
    {
      isStatic: false, 
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#ef4444', // Kırmızı
        strokeStyle: 'transparent'
      }
    }
  );
  // Üçgeni döndürerek ok başı yönünü ayarla
  Matter.Body.rotate(rightArrowHead2, 0);
  
  // Sol Kuvvet Ok (Yeşil) - F3 (SOLA)
  leftForceArrow = Bodies.rectangle(
    box.position.x + boxSize/2 + arrowSize/2,
    box.position.y - (isMobile ? 15 : 20), // Mobilde biraz daha yakın
    arrowSize,
    arrowThickness,
    {
      isStatic: false,
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#10b981', // Yeşil
        strokeStyle: 'transparent',
        width: arrowSize
      }
    }
  );
  
  // Sol Ok Başı - F3
  leftArrowHead = Bodies.polygon(
    box.position.x + boxSize/2 + arrowSize + 10,
    box.position.y - (isMobile ? 15 : 20),
    3, // 3 köşeli üçgen
    isMobile ? 9 : 12, // Mobilde daha küçük
    {
      isStatic: false, 
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#10b981', // Yeşil
        strokeStyle: 'transparent'
      }
    }
  );
  // Üçgeni döndürerek ok başı yönünü ayarla (SOLA doğru) - 180 derece döndür
  Matter.Body.rotate(leftArrowHead, Math.PI); // Üçgen başı solu göstersin
  
  // Sol Kuvvet Ok (Mor) - F4 (SOLA)
  leftForceArrow2 = Bodies.rectangle(
    box.position.x + boxSize/2 + arrowSize/2,
    box.position.y, // Ortada
    arrowSize,
    arrowThickness,
    {
      isStatic: false,
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#8b5cf6', // Mor
        strokeStyle: 'transparent',
        width: arrowSize
      }
    }
  );
  
  // Sol Ok Başı - F4
  leftArrowHead2 = Bodies.polygon(
    box.position.x + boxSize/2 + arrowSize + 10,
    box.position.y, // Ortada
    3, // 3 köşeli üçgen
    isMobile ? 9 : 12, // Mobilde daha küçük
    {
      isStatic: false, 
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#8b5cf6', // Mor
        strokeStyle: 'transparent'
      }
    }
  );
  // Üçgeni döndürerek ok başı yönünü ayarla (SOLA doğru) - 180 derece döndür
  Matter.Body.rotate(leftArrowHead2, Math.PI); // Üçgen başı solu göstersin
  
  // Bileşke Kuvvet Ok
  resultantForceArrow = Bodies.rectangle(
    box.position.x,
    box.position.y - boxSize/2 - arrowSize/2,
    8, // Kalınlığı biraz artırdık
    arrowSize,
    {
      isStatic: false,
      isSensor: true,
      collisionFilter: {
        group: -1
      },
      render: {
        fillStyle: '#eab308', // Sarı
        strokeStyle: 'transparent',
        visible: false,
        height: arrowSize
      }
    }
  );
  
  // We need to create constraints to attach the arrows to the box
  const Constraint = Matter.Constraint;
  
  // Create constraints for arrows
  const rightArrowConstraint = Constraint.create({
    bodyA: box,
    bodyB: rightForceArrow,
    pointA: { x: -boxSize/2, y: -20 },
    pointB: { x: arrowSize/2, y: 0 },
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const rightArrowConstraint2 = Constraint.create({
    bodyA: box,
    bodyB: rightForceArrow2,
    pointA: { x: -boxSize/2, y: 0 },
    pointB: { x: arrowSize/2, y: 0 },
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const leftArrowConstraint = Constraint.create({
    bodyA: box,
    bodyB: leftForceArrow,
    pointA: { x: boxSize/2, y: -20 },
    pointB: { x: -arrowSize/2, y: 0 },
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const leftArrowConstraint2 = Constraint.create({
    bodyA: box,
    bodyB: leftForceArrow2, 
    pointA: { x: boxSize/2, y: 0 },
    pointB: { x: -arrowSize/2, y: 0 },
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });

  // Ok gövdeleri ile ok başları arasındaki bağlantılar
  const rightArrowHeadConstraint = Constraint.create({
    bodyA: rightForceArrow,
    bodyB: rightArrowHead,
    pointA: { x: -arrowSize/2, y: 0 },
    pointB: { x: 5, y: 0 }, // Ok başının arka noktası
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });

  const rightArrowHeadConstraint2 = Constraint.create({
    bodyA: rightForceArrow2,
    bodyB: rightArrowHead2,
    pointA: { x: -arrowSize/2, y: 0 },
    pointB: { x: 5, y: 0 }, // Ok başının arka noktası
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const leftArrowHeadConstraint = Constraint.create({
    bodyA: leftForceArrow,
    bodyB: leftArrowHead,
    pointA: { x: arrowSize/2, y: 0 }, // Sol ok için X değeri pozitif
    pointB: { x: -5, y: 0 }, // Ok başının arka noktası (sol ok için negatif)
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const leftArrowHeadConstraint2 = Constraint.create({
    bodyA: leftForceArrow2,
    bodyB: leftArrowHead2,
    pointA: { x: arrowSize/2, y: 0 }, // Sol ok için X değeri pozitif
    pointB: { x: -5, y: 0 }, // Ok başının arka noktası (sol ok için negatif)
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const resultantArrowConstraint = Constraint.create({
    bodyA: box,
    bodyB: resultantForceArrow,
    pointA: { x: 0, y: -boxSize/2 },
    pointB: { x: 0, y: arrowSize/2 },
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  // Add all bodies to the world
  World.add(world, [
    box, ground, ceiling, leftWall, rightWall,
    rightForceArrow, rightForceArrow2, leftForceArrow, leftForceArrow2, resultantForceArrow,
    rightArrowHead, rightArrowHead2, leftArrowHead, leftArrowHead2,
    rightArrowConstraint, rightArrowConstraint2, leftArrowConstraint, leftArrowConstraint2, resultantArrowConstraint,
    rightArrowHeadConstraint, rightArrowHeadConstraint2, leftArrowHeadConstraint, leftArrowHeadConstraint2
  ]);
  
  // Run the engine and renderer
  Engine.run(engine);
  Render.run(render);
  
  // Apply initial forces
  applyForces();
};

// Update the visual representation of forces - can be called independently
const updateForceArrows = () => {
  // Basit güvenlik kontrolleri
  if (!box || !rightForceArrow || !rightForceArrow2 || !leftForceArrow || !leftForceArrow2 || 
      !resultantForceArrow || !rightArrowHead || !rightArrowHead2 || !leftArrowHead || !leftArrowHead2) {
    return; // Nesneler hazır değilse işlem yapmayız
  }
  
  try {
    const boxSize = box.bounds.max.x - box.bounds.min.x;
    // Adjust scaling for mobile
    const isMobile = window.innerWidth < 768;
    const pixelsPerUnit = isMobile ? 8 : 10; // Mobile için daha küçük ölçek
    
    // F1 kuvveti (Sağa/Mavi)
    if (f1.value > 0) {
      // Önce görünürlüğü ayarla
      rightForceArrow.render.visible = true;
      rightArrowHead.render.visible = true;
      
      // Uzunluğu kuvvete göre ayarla
      const rightArrowLength = f1.value * pixelsPerUnit;
      
      // Pozisyon ayarla - kutunun sol kenarından başlasın
      Matter.Body.setPosition(rightForceArrow, {
        x: box.position.x - boxSize/2 - rightArrowLength/2,
        y: box.position.y - (isMobile ? 15 : 20)
      });
      
      // Boyutu ayarla
      const currentWidth = rightForceArrow.bounds.max.x - rightForceArrow.bounds.min.x;
      const scaleX = rightArrowLength / currentWidth;
      Matter.Body.scale(rightForceArrow, scaleX, 1);
      
      // Ok başını konumlandır
      Matter.Body.setPosition(rightArrowHead, {
        x: box.position.x - boxSize/2 - rightArrowLength - (isMobile ? 8 : 10),
        y: box.position.y - (isMobile ? 15 : 20)
      });
    } else {
      // Kuvvet yoksa gizle
      rightForceArrow.render.visible = false;
      rightArrowHead.render.visible = false;
    }
    
    // F2 kuvveti (Sağa/Kırmızı)
    if (f2.value > 0) {
      // Önce görünürlüğü ayarla
      rightForceArrow2.render.visible = true;
      rightArrowHead2.render.visible = true;
      
      // Uzunluğu kuvvete göre ayarla
      const rightArrowLength = f2.value * pixelsPerUnit;
      
      // Pozisyon ayarla - kutunun sol kenarından başlasın
      Matter.Body.setPosition(rightForceArrow2, {
        x: box.position.x - boxSize/2 - rightArrowLength/2,
        y: box.position.y
      });
      
      // Boyutu ayarla
      const currentWidth = rightForceArrow2.bounds.max.x - rightForceArrow2.bounds.min.x;
      const scaleX = rightArrowLength / currentWidth;
      Matter.Body.scale(rightForceArrow2, scaleX, 1);
      
      // Ok başını konumlandır
      Matter.Body.setPosition(rightArrowHead2, {
        x: box.position.x - boxSize/2 - rightArrowLength - (isMobile ? 8 : 10),
        y: box.position.y
      });
    } else {
      // Kuvvet yoksa gizle
      rightForceArrow2.render.visible = false;
      rightArrowHead2.render.visible = false;
    }
    
    // F3 kuvveti (Sola/Yeşil)
    if (f3.value > 0) {
      // Önce görünürlüğü ayarla
      leftForceArrow.render.visible = true;
      leftArrowHead.render.visible = true;
      
      // Uzunluğu kuvvete göre ayarla
      const leftArrowLength = f3.value * pixelsPerUnit;
      
      // Pozisyon ayarla - kutunun sağ kenarından başlasın
      Matter.Body.setPosition(leftForceArrow, {
        x: box.position.x + boxSize/2 + leftArrowLength/2,
        y: box.position.y - (isMobile ? 15 : 20)
      });
      
      // Boyutu ayarla
      const currentWidth = leftForceArrow.bounds.max.x - leftForceArrow.bounds.min.x;
      const scaleX = leftArrowLength / currentWidth;
      Matter.Body.scale(leftForceArrow, scaleX, 1);
      
      // Ok başını konumlandır
      Matter.Body.setPosition(leftArrowHead, {
        x: box.position.x + boxSize/2 + leftArrowLength + (isMobile ? 8 : 10),
        y: box.position.y - (isMobile ? 15 : 20)
      });
    } else {
      // Kuvvet yoksa gizle
      leftForceArrow.render.visible = false;
      leftArrowHead.render.visible = false;
    }
    
    // F4 kuvveti (Sola/Mor)
    if (f4.value > 0) {
      // Önce görünürlüğü ayarla
      leftForceArrow2.render.visible = true;
      leftArrowHead2.render.visible = true;
      
      // Uzunluğu kuvvete göre ayarla
      const leftArrowLength = f4.value * pixelsPerUnit;
      
      // Pozisyon ayarla - kutunun sağ kenarından başlasın
      Matter.Body.setPosition(leftForceArrow2, {
        x: box.position.x + boxSize/2 + leftArrowLength/2,
        y: box.position.y
      });
      
      // Boyutu ayarla
      const currentWidth = leftForceArrow2.bounds.max.x - leftForceArrow2.bounds.min.x;
      const scaleX = leftArrowLength / currentWidth;
      Matter.Body.scale(leftForceArrow2, scaleX, 1);
      
      // Ok başını konumlandır
      Matter.Body.setPosition(leftArrowHead2, {
        x: box.position.x + boxSize/2 + leftArrowLength + (isMobile ? 8 : 10),
        y: box.position.y
      });
    } else {
      // Kuvvet yoksa gizle
      leftForceArrow2.render.visible = false;
      leftArrowHead2.render.visible = false;
    }
    
    // Bileşke kuvvet okunu her zaman gizli tut
    resultantForceArrow.render.visible = false;
  } catch (err) {
    console.error('Ok güncelleme hatası:', err);
  }
};

// Apply forces based on slider values
const applyForces = () => {
  if (!box) return;
  
  // Calculate the net force
  const rightForce1 = f1.value * forceScale; // Sağa F1
  const rightForce2 = f2.value * forceScale; // Sağa F2
  const leftForce1 = -f3.value * forceScale; // Sola F3 (negatif değer)
  const leftForce2 = -f4.value * forceScale; // Sola F4 (negatif değer)
  
  const netForce = rightForce1 + rightForce2 + leftForce1 + leftForce2;
  
  // Reset velocity to make changes more noticeable
  Matter.Body.setVelocity(box, { x: 0, y: 0 });
  
  // Apply the force
  Matter.Body.applyForce(box, box.position, { x: netForce, y: 0 });
  
  // Always update force arrows when forces change
  updateForceArrows();
};

// Watch for changes in force values - this will trigger both UI updates and physics
watch([f1, f2, f3, f4], () => {
  // Only call applyForces if the physics engine is initialized
  if (box) {
    applyForces();
  }
}, { deep: true });

// Reset the simulation
const resetSimulation = () => {
  if (!box || !engine || !canvasContainer.value) return;
  
  try {
    // Reset box position
    const containerWidth = canvasContainer.value.clientWidth;
    const containerHeight = canvasContainer.value.clientHeight;
    
    Matter.Body.setPosition(box, {
      x: containerWidth / 2,
      y: containerHeight / 2
    });
    
    // Reset velocity
    Matter.Body.setVelocity(box, { x: 0, y: 0 });
    
    // Update force arrows
    if (rightForceArrow && rightForceArrow2 && leftForceArrow && leftForceArrow2 && resultantForceArrow && rightArrowHead && rightArrowHead2 && leftArrowHead && leftArrowHead2) {
      updateForceArrows();
    }
  } catch (err) {
    console.error('Simülasyon sıfırlama hatası: ', err);
  }
};

// Lifecycle hooks
onMounted(() => {
  // Initialize physics after the DOM is ready
  setTimeout(() => {
    initPhysics();
    // Apply initial forces after physics is initialized
    applyForces();
  }, 100);
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // Clean up
  if (render) {
    Matter.Render.stop(render);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
  }
  
  if (engine) {
    Matter.Engine.clear(engine);
  }
  
  window.removeEventListener('resize', handleResize);
});

// Handle window resize
const handleResize = () => {
  if (!render || !engine || !canvasContainer.value) return;
  
  try {
    // Get new dimensions
    const width = canvasContainer.value.clientWidth;
    const height = canvasContainer.value.clientHeight;
    
    // Update renderer
    render.options.width = width;
    render.options.height = height;
    render.canvas.width = width;
    render.canvas.height = height;
    
    if (!ground || !ceiling || !leftWall || !rightWall) return;
    
    // Reposition walls
    const wallThickness = 50;
    
    Matter.Body.setPosition(ground, {
      x: width / 2,
      y: height + wallThickness / 2
    });
    
    Matter.Body.setPosition(ceiling, {
      x: width / 2,
      y: -wallThickness / 2
    });
    
    Matter.Body.setPosition(leftWall, {
      x: -wallThickness / 2,
      y: height / 2
    });
    
    Matter.Body.setPosition(rightWall, {
      x: width + wallThickness / 2,
      y: height / 2
    });
    
    // Update ground and wall sizes
    Matter.Body.scale(ground, width / (ground.bounds.max.x - ground.bounds.min.x), 1);
    Matter.Body.scale(ceiling, width / (ceiling.bounds.max.x - ceiling.bounds.min.x), 1);
    Matter.Body.scale(leftWall, 1, height / (leftWall.bounds.max.y - leftWall.bounds.min.y));
    Matter.Body.scale(rightWall, 1, height / (rightWall.bounds.max.y - rightWall.bounds.min.y));
    
    // Get window width to detect mobile devices
    const windowWidth = window.innerWidth;
    
    // Adjust box size based on screen size
    const boxSize = Math.min(width, height) * (windowWidth < 768 ? 0.08 : 0.1); // Smaller box on mobile
    
    // Scale the box to appropriate size
    if (box) {
      const currentWidth = box.bounds.max.x - box.bounds.min.x;
      const scaleRatio = boxSize / currentWidth;
      if (Math.abs(scaleRatio - 1) > 0.1) { // Only scale if there's a significant difference
        Matter.Body.scale(box, scaleRatio, scaleRatio);
      }
    }
    
    // Center the box
    resetSimulation();
    
    // Update force arrows after resize
    updateForceArrows();
  } catch (err) {
    console.error('Ekran boyutlandırma hatası: ', err);
  }
};
</script>

<style scoped>
/* Custom slider styling */
input[type="range"] {
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  background: #374151;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* Mobile adaptations for simulation canvas */
@media (max-width: 768px) {
  .min-h-\[50vh\] {
    min-height: 60vh; /* Increase height on mobile for better visibility */
  }
  
  /* Ensure physics objects scale appropriately */
  #canvasContainer canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

/* Animation for modal transition */
.fixed {
  transition: opacity 0.2s ease;
}

/* Background theme options */
.bg-theme-dark {
  background-color: #1f2937;
}

.bg-theme-light {
  background-color: #f3f4f6;
}
</style>
  
 
 