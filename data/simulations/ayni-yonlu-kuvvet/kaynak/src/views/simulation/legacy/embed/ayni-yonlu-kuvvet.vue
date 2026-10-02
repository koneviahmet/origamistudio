<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-white">
    <!-- Başlık -->
    
    <!-- Ana Container -->
    <div class="flex-grow flex flex-col lg:flex-row">
      <!-- Similasyon Alanı -->
      <div class="relative flex-grow min-h-[300px] lg:min-h-[500px]">
        <!-- Canvas Container -->
        <div ref="canvasContainer" class="w-full h-full absolute inset-0"></div>
        
        <!-- Kuvvet Vektörleri Gösterimi -->
        <div class="absolute top-4 left-4 bg-gray-800/80 p-2 rounded-md text-sm">
          <div class="flex items-center mb-1">
            <div class="w-4 h-0.5 bg-blue-500 mr-2"></div>
            <span>F1 (Sağa): {{ f1 }} N</span>
          </div>
          <div class="flex items-center mb-1">
            <div class="w-4 h-0.5 bg-red-500 mr-2"></div>
            <span>F2 (Sağa): {{ f2 }} N</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-0.5 mr-2" :class="resultantForce > 0 ? 'bg-green-500' : 'bg-yellow-500'"></div>
            <span>Bileşke: {{ resultantForce }} N {{ resultantForceDirection }}</span>
          </div>
        </div>
      </div>

      <!-- Mobil Ayarlar Butonu -->
      <button 
        class="lg:hidden fixed top-4 right-4 z-50 bg-gray-800 p-2 rounded-lg shadow-lg"
        @click="showMobileSettings = !showMobileSettings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <!-- Ayarlar Paneli - Desktop -->
      <div 
        class="hidden lg:block bg-gray-800 w-80 p-6 overflow-y-auto"
        style="max-height: 66.666667vh;"
      >
        <div class="space-y-6">
          
          <!-- F1 Kontrolü -->
          <div>
            <div class="flex justify-between mb-1">
              <label class="text-sm font-medium">F1 (Sağa Kuvvet)</label>
              <span class="text-blue-400">{{ f1 }} N</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              step="1" 
              v-model.number="f1"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 N</span>
              <span>20 N</span>
            </div>
          </div>
          
          <!-- F2 Kontrolü -->
          <div>
            <div class="flex justify-between mb-1">
              <label class="text-sm font-medium">F2 (Sağa Kuvvet)</label>
              <span class="text-red-400">{{ f2 }} N</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              step="1" 
              v-model.number="f2"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 N</span>
              <span>20 N</span>
            </div>
          </div>
          
          <!-- Bileşke Kuvvet Gösterimi -->
          <div class="bg-gray-700 p-3 rounded-lg">
            <h3 class="text-sm font-medium mb-2">Bileşke Kuvvet</h3>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-6 h-6 flex items-center justify-center rounded-full" 
                     :class="resultantForce > 0 ? 'bg-green-500' : 'bg-yellow-500'">
                  <span v-if="resultantForce > 0">←</span>
                  <span v-else-if="resultantForce < 0">→</span>
                  <span v-else>⊙</span>
                </div>
                <span class="ml-2">{{ Math.abs(resultantForce) }} N</span>
              </div>
              <span class="text-sm">{{ resultantForceDirection }}</span>
            </div>
          </div>

          <!-- Arkaplan Rengi Seçimi -->
          <div>
            <h3 class="text-sm font-medium mb-2">Arkaplan Rengi</h3>
            <div class="flex gap-2">
              <button 
                @click="changeBackground('dark')"
                class="w-8 h-8 rounded-full bg-gray-900 border-2"
                :class="backgroundColor === 'dark' ? 'border-blue-500' : 'border-transparent'"
              ></button>
              <button 
                @click="changeBackground('light')"
                class="w-8 h-8 rounded-full bg-gray-100 border-2"
                :class="backgroundColor === 'light' ? 'border-blue-500' : 'border-transparent'"
              ></button>
            </div>
          </div>

          <!-- Sıfırlama Butonu -->
          <button 
            @click="resetSimulation"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Similasyonu Sıfırla
          </button>
        </div>
      </div>

      <!-- Ayarlar Paneli - Mobile Modal -->
      <div 
        v-if="showMobileSettings" 
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
        @click.self="showMobileSettings = false"
      >
        <div 
          class="bg-gray-800 w-full max-w-md rounded-lg p-6 max-h-[66.666667vh] overflow-y-auto"
        >
          <!-- Mobil ayarlar içeriği (Desktop ile aynı) -->
          <div class="space-y-6">
            <div class="flex justify-between items-center border-b border-gray-700 pb-2">
              <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- F1 Kontrolü -->
            <div>
              <div class="flex justify-between mb-1">
                <label class="text-sm font-medium">F1 (Sağa Kuvvet)</label>
                <span class="text-blue-400">{{ f1 }} N</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                v-model.number="f1"
                class="w-full"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 N</span>
                <span>20 N</span>
              </div>
            </div>
            
            <!-- F2 Kontrolü -->
            <div>
              <div class="flex justify-between mb-1">
                <label class="text-sm font-medium">F2 (Sağa Kuvvet)</label>
                <span class="text-red-400">{{ f2 }} N</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                v-model.number="f2"
                class="w-full"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 N</span>
                <span>20 N</span>
              </div>
            </div>
            
            <!-- Bileşke Kuvvet Gösterimi -->
            <div class="bg-gray-700 p-3 rounded-lg">
              <h3 class="text-sm font-medium mb-2">Bileşke Kuvvet</h3>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-6 h-6 flex items-center justify-center rounded-full" 
                       :class="resultantForce > 0 ? 'bg-green-500' : 'bg-yellow-500'">
                    <span v-if="resultantForce > 0">←</span>
                    <span v-else-if="resultantForce < 0">→</span>
                    <span v-else>⊙</span>
                  </div>
                  <span class="ml-2">{{ Math.abs(resultantForce) }} N</span>
                </div>
                <span class="text-sm">{{ resultantForceDirection }}</span>
              </div>
            </div>

            <!-- Arkaplan Rengi Seçimi -->
            <div>
              <h3 class="text-sm font-medium mb-2">Arkaplan Rengi</h3>
              <div class="flex gap-2">
                <button 
                  @click="changeBackground('dark')"
                  class="w-8 h-8 rounded-full bg-gray-900 border-2"
                  :class="backgroundColor === 'dark' ? 'border-blue-500' : 'border-transparent'"
                ></button>
                <button 
                  @click="changeBackground('light')"
                  class="w-8 h-8 rounded-full bg-gray-100 border-2"
                  :class="backgroundColor === 'light' ? 'border-blue-500' : 'border-transparent'"
                ></button>
              </div>
            </div>

            <!-- Sıfırlama Butonu -->
            <button 
              @click="resetSimulation"
              class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Similasyonu Sıfırla
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
const canvasContainer = ref(null);
const showMobileSettings = ref(false);
const backgroundColor = ref('dark');

// Physics variables
let engine, render, world, box, ground, leftWall, rightWall, ceiling;
let rightForceArrow, leftForceArrow, resultantForceArrow;
let rightArrowHead, leftArrowHead; // Ok başları için yeni değişkenler
const forceScale = 0.01; // Scale factor to convert Newtons to Matter.js force

// Computed properties
const resultantForce = computed(() => {
  // Kesin hesaplama için toFixed kullanmadan matematiksel hesaplama
  return f1.value + f2.value; // Artık toplama yapılıyor (zıt değil aynı yönlü kuvvetler)
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
  const containerWidth = canvasContainer.value.clientWidth || window.innerWidth;
  const containerHeight = canvasContainer.value.clientHeight || 300;
  
  render = Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: containerWidth,
      height: containerHeight,
      wireframes: false,
      background: backgroundColor.value === 'dark' ? '#1f2937' : '#f3f4f6',
      showVelocity: true
    }
  });
  
  // Create box (the object that will have forces applied)
  const boxSize = Math.min(containerWidth, containerHeight) * 0.1;
  box = Bodies.rectangle(
    containerWidth / 2,
    containerHeight / 2,
    boxSize,
    boxSize,
    {
      frictionAir: 0.05,
      render: {
        fillStyle: '#4f46e5', // Indigo color
        strokeStyle: '#818cf8',
        lineWidth: 2
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
  const arrowSize = boxSize * 0.8;
  
  // Sağ Kuvvet (Mavi) Ok - F1
  rightForceArrow = Bodies.rectangle(
    box.position.x - boxSize/2 - arrowSize/2,
    box.position.y,
    arrowSize,
    8, // Kalınlığı biraz artırdık
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
    box.position.x - boxSize/2 - arrowSize - 10, // Okun ucundan biraz daha ileride
    box.position.y,
    3, // 3 köşeli üçgen
    12, // Boyut
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
  leftForceArrow = Bodies.rectangle(
    box.position.x - boxSize/2 - arrowSize/2,
    box.position.y + 20, // F1'in biraz altına konumlandır
    arrowSize,
    8, // Kalınlığı biraz artırdık
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
  leftArrowHead = Bodies.polygon(
    box.position.x - boxSize/2 - arrowSize - 10, // Okun ucundan biraz daha ileride
    box.position.y + 20, // F1'in biraz altına konumlandır
    3, // 3 köşeli üçgen
    12, // Boyut
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
  // Üçgeni döndürerek ok başı yönünü ayarla (sağa doğru) - F2 de sağa doğru kuvvet oldu
  Matter.Body.rotate(leftArrowHead, 0); // Üçgen başı sağı göstersin
  
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
    pointA: { x: -boxSize/2, y: 0 },
    pointB: { x: arrowSize/2, y: 0 },
    stiffness: 1,
    length: 0,
    render: { visible: false }
  });
  
  const leftArrowConstraint = Constraint.create({
    bodyA: box,
    bodyB: leftForceArrow,
    pointA: { x: -boxSize/2, y: 20 }, // F2 için aynı taraftan ama farklı noktadan bağla
    pointB: { x: arrowSize/2, y: 0 },
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

  const leftArrowHeadConstraint = Constraint.create({
    bodyA: leftForceArrow,
    bodyB: leftArrowHead,
    pointA: { x: -arrowSize/2, y: 0 },
    pointB: { x: 5, y: 0 }, // Ok başının arka noktası
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
    rightForceArrow, leftForceArrow, resultantForceArrow,
    rightArrowHead, leftArrowHead, // Ok başlarını dünyaya ekle
    rightArrowConstraint, leftArrowConstraint, resultantArrowConstraint,
    rightArrowHeadConstraint, leftArrowHeadConstraint // Ok başı bağlantılarını dünyaya ekle
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
  if (!box || !rightForceArrow || !leftForceArrow || !resultantForceArrow || !rightArrowHead || !leftArrowHead) {
    return; // Nesneler hazır değilse işlem yapmayız
  }
  
  try {
    const boxSize = box.bounds.max.x - box.bounds.min.x;
    const pixelsPerUnit = 10; // Her birim kuvvet 10 piksel
    
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
        y: box.position.y
      });
      
      // Boyutu ayarla
      const currentWidth = rightForceArrow.bounds.max.x - rightForceArrow.bounds.min.x;
      const scaleX = rightArrowLength / currentWidth;
      Matter.Body.scale(rightForceArrow, scaleX, 1);
      
      // Ok başını konumlandır
      Matter.Body.setPosition(rightArrowHead, {
        x: box.position.x - boxSize/2 - rightArrowLength - 10,
        y: box.position.y
      });
    } else {
      // Kuvvet yoksa gizle
      rightForceArrow.render.visible = false;
      rightArrowHead.render.visible = false;
    }
    
    // F2 kuvveti (Sağa/Kırmızı) - İkinci kuvvet de sağa oldu
    if (f2.value > 0) {
      // Önce görünürlüğü ayarla
      leftForceArrow.render.visible = true;
      leftArrowHead.render.visible = true;
      
      // Uzunluğu kuvvete göre ayarla
      const leftArrowLength = f2.value * pixelsPerUnit;
      
      // Pozisyon ayarla - kutunun sol kenarından başlasın ama biraz aşağıdan
      Matter.Body.setPosition(leftForceArrow, {
        x: box.position.x - boxSize/2 - leftArrowLength/2,
        y: box.position.y + 20 // Biraz aşağıda
      });
      
      // Boyutu ayarla
      const currentWidth = leftForceArrow.bounds.max.x - leftForceArrow.bounds.min.x;
      const scaleX = leftArrowLength / currentWidth;
      Matter.Body.scale(leftForceArrow, scaleX, 1);
      
      // Ok başını konumlandır
      Matter.Body.setPosition(leftArrowHead, {
        x: box.position.x - boxSize/2 - leftArrowLength - 10,
        y: box.position.y + 20 // Biraz aşağıda
      });
    } else {
      // Kuvvet yoksa gizle
      leftForceArrow.render.visible = false;
      leftArrowHead.render.visible = false;
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
  const rightForce = f1.value * forceScale;
  const rightForce2 = f2.value * forceScale; // İkinci kuvvet de sağa oldu (negatif işareti kaldırıldı)
  const netForce = rightForce + rightForce2;
  
  // Reset velocity to make changes more noticeable
  Matter.Body.setVelocity(box, { x: 0, y: 0 });
  
  // Apply the force
  Matter.Body.applyForce(box, box.position, { x: netForce, y: 0 });
  
 // Always update force arrows when forces change
  updateForceArrows();
};

// Watch for changes in force values - this will trigger both UI updates and physics
watch([f1, f2], () => {
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
    if (rightForceArrow && leftForceArrow && resultantForceArrow && rightArrowHead && leftArrowHead) {
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
    
    // Trigger an initial resize to ensure proper dimensions
    handleResize();
  }, 300); // Increased timeout to ensure DOM is fully rendered
  
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
    const width = canvasContainer.value.clientWidth || window.innerWidth;
    const height = canvasContainer.value.clientHeight || 300;
    
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
    
    // Center the box
    resetSimulation();
  } catch (err) {
    console.error('Ekran boyutlandırma hatası: ', err);
  }
};

// Arkaplan rengini değiştirme fonksiyonu
const changeBackground = (color) => {
  backgroundColor.value = color;
  if (render) {
    render.options.background = color === 'dark' ? '#1f2937' : '#f3f4f6';
    // Duvarların rengini de güncelle
    if (ground && ceiling && leftWall && rightWall) {
      const wallColor = color === 'dark' ? '#1f2937' : '#f3f4f6';
      ground.render.fillStyle = wallColor;
      ceiling.render.fillStyle = wallColor;
      leftWall.render.fillStyle = wallColor;
      rightWall.render.fillStyle = wallColor;
    }
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
  transition: background-color 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #4f46e5;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

input[type="range"]::-moz-range-thumb:hover {
  background: #4f46e5;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
  
 
 