<template>
  <div class="flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100">
    <div class="w-full  bg-white rounded-xl shadow-lg ">
      
      <div class="p-4 flex flex-col md:flex-row h-screen overflow-auto">
        <!-- Simulation Canvas -->
        <div class="w-full md:w-2/3 relative">
          <div ref="canvasContainer" class="w-full h-full bg-gray-50 rounded-lg overflow-hidden"></div>
          
          <div class="absolute top-4 left-4 flex space-x-2">
            <button @click="resetSimulation" class="p-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Sıfırla
            </button>
            <button @click="togglePause" class="p-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              {{ isPaused ? 'Başlat' : 'Durdur' }}
            </button>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="w-full md:w-1/3 p-4 space-y-4 pb-20">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Eğim Açısı (°)</label>
            <input 
              type="range" 
              min="5" 
              max="45" 
              v-model.number="angleInDegrees" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              @input="updateInclinedPlane"
            />
            <div class="text-center mt-1">{{ angleInDegrees }}°</div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sürtünme Katsayısı</label>
            <input 
              type="range" 
              min="0" 
              max="0.5" 
              step="0.01" 
              v-model.number="friction" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              @input="updateFriction"
            />
            <div class="text-center mt-1">{{ friction }}</div>
          </div>
          
          <div class="pb-20">
            <label class="block text-sm font-medium text-gray-700 mb-1">Cisim Kütlesi (kg)</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              v-model.number="objectMass" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              @input="updateObjectMass"
            />
            <div class="text-center mt-1">{{ objectMass }} kg</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import Matter from 'matter-js';

// Matter.js modülleri
const { Engine, Render, World, Bodies, Body, Events, Runner } = Matter;

// Referanslar
const canvasContainer = ref(null);
let engine = null;
let render = null;
let runner = null;
let inclinedPlane = null;
let box = null;
let ground = null;
let leftWall = null;
let rightWall = null;

// Kontrol değişkenleri
const angleInDegrees = ref(5);
const friction = ref(0.1);
const objectMass = ref(5);
const isPaused = ref(false);

// Hesaplanan değerler
const angleInRadians = computed(() => (angleInDegrees.value * Math.PI) / 180);
const gravity = 9.81; // m/s²

const parallelForce = computed(() => {
  return objectMass.value * gravity * Math.sin(angleInRadians.value);
});

const normalForce = computed(() => {
  return objectMass.value * gravity * Math.cos(angleInRadians.value);
});

const frictionForce = computed(() => {
  return normalForce.value * friction.value;
});

const netForce = computed(() => {
  return Math.max(0, parallelForce.value - frictionForce.value);
});

const acceleration = computed(() => {
  return netForce.value / objectMass.value;
});

// Simülasyonu başlat
onMounted(async () => {
  // DOM'un tamamen yüklenmesini bekle
  await nextTick();
  // Kısa bir gecikme ekleyerek DOM'un tamamen hazır olmasını sağla
  setTimeout(() => {
    initSimulation();
  }, 100);
});

// Simülasyonu temizle
onBeforeUnmount(() => {
  // Event listener'ı kaldır
  window.removeEventListener('resize', handleResize);
  
  if (runner) Runner.stop(runner);
  if (render) Render.stop(render);
  if (engine) {
    // Engine event listener'ını kaldır
    Events.off(engine, 'beforeUpdate', updateObjectMotion);
    Engine.clear(engine);
    World.clear(engine.world);
    engine = null;
  }
});

// Simülasyonu başlat
function initSimulation() {
  if (!canvasContainer.value) {
    console.error('Canvas container not found');
    return;
  }

  // Önceki engine ve render varsa temizle
  if (engine) {
    Engine.clear(engine);
    World.clear(engine.world);
  }
  if (render) {
    Render.stop(render);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render = null;
  }
  
  // Engine oluştur
  engine = Engine.create({
    gravity: { x: 0, y: 1, scale: 0.001 } // Yerçekimi simülasyonda çok düşük tutuyoruz, kendi hesaplamalarımızı kullanacağız
  });
  
  // Canvas container boyutlarını al
  const containerWidth = canvasContainer.value.clientWidth || 800;
  const containerHeight = canvasContainer.value.clientHeight || 400;
  
  // Render oluştur
  render = Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: containerWidth,
      height: containerHeight,
      wireframes: false,
      background: '#f9fafb',
      showAngleIndicator: false,
    }
  });
  
  // Runner oluştur
  runner = Runner.create();
  
  // Dünya sınırlarını oluştur
  const width = render.options.width;
  const height = render.options.height;
  
  // Zemin
  ground = Bodies.rectangle(width / 2, height + 30, width * 2, 60, { 
    isStatic: true,
    render: { fillStyle: '#e5e7eb' }
  });
  
  // Yan duvarlar
  leftWall = Bodies.rectangle(-30, height / 2, 60, height * 2, { 
    isStatic: true,
    render: { fillStyle: '#e5e7eb' }
  });
  
  rightWall = Bodies.rectangle(width + 30, height / 2, 60, height * 2, { 
    isStatic: true,
    render: { fillStyle: '#e5e7eb' }
  });
  
  // Dünyaya ekle
  World.add(engine.world, [ground, leftWall, rightWall]);
  
  // Eğik düzlemi oluştur
  createInclinedPlane();
  
  // Render ve runner'ı başlat
  Render.run(render);
  Runner.run(runner, engine);
  
  // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
  window.addEventListener('resize', handleResize);
  
  // Her adımda cismin hareketini güncelle
  Events.on(engine, 'beforeUpdate', updateObjectMotion);
  
  console.log('Simulation initialized', {
    containerWidth,
    containerHeight,
    engine: !!engine,
    render: !!render,
    runner: !!runner
  });
}

// Eğik düzlemi oluştur
function createInclinedPlane() {
  if (!render || !engine) {
    console.error('Render or engine not initialized');
    return;
  }
  
  const width = render.options.width;
  const height = render.options.height;
  
  // Eski eğik düzlemi ve cismi kaldır
  if (inclinedPlane) World.remove(engine.world, inclinedPlane);
  if (box) World.remove(engine.world, box);
  
  // Eğik düzlem uzunluğu
  const planeLength = width * 0.9;
  
  // Eğik düzlem yüksekliği
  const planeHeight = planeLength * Math.sin(angleInRadians.value);
  
  // Eğik düzlem genişliği
  const planeWidth = planeLength * Math.cos(angleInRadians.value);
  
  // Eğik düzlem pozisyonu
  const planeX = width / 2 - planeWidth / 2;
  const planeY = height - 60 - planeHeight / 2;
  
  // Eğik düzlemi oluştur
  inclinedPlane = Bodies.rectangle(
    planeX + planeWidth / 2,
    planeY + planeHeight / 2,
    planeLength,
    20,
    {
      isStatic: true,
      angle: -angleInRadians.value,
      friction: friction.value,
      render: { fillStyle: '#4f46e5' }
    }
  );
  
  // Cismin kütlesine göre yarıçapını hesapla
  // Minimum 15, maksimum 35 piksel yarıçap, kütle 1-10 kg arasında
  const baseRadius = 15;
  const radiusPerMass = 2; // Her kg için eklenecek piksel
  const circleRadius = baseRadius + (objectMass.value - 1) * radiusPerMass;
  
  // Cismi oluştur - Kare yerine daire
  box = Bodies.circle(
    planeX + planeWidth - circleRadius,
    planeY - circleRadius,
    circleRadius,
    {
      mass: objectMass.value,
      friction: friction.value,
      frictionAir: 0.001,
      restitution: 0.2,
      render: { 
        fillStyle: '#ef4444',
        strokeStyle: '#b91c1c',
        lineWidth: 2
      }
    }
  );
  
  // Dünyaya ekle
  World.add(engine.world, [inclinedPlane, box]);
  
  console.log('Inclined plane created', {
    planeLength,
    planeHeight,
    planeWidth,
    planeX,
    planeY,
    angle: angleInRadians.value,
    circleRadius
  });
}

// Cismin hareketini güncelle
function updateObjectMotion() {
  if (!box || isPaused.value) return;
  
  // Eğik düzlem üzerindeki hareketi simüle et
  const force = netForce.value;
  
  if (force > 0) {
    // Kuvveti eğik düzlem boyunca uygula
    const forceX = force * Math.cos(angleInRadians.value);
    const forceY = force * Math.sin(angleInRadians.value);
    
    Body.applyForce(box, box.position, {
      x: -forceX * 0.0001, // Ölçeklendirme faktörü
      y: forceY * 0.0001   // Ölçeklendirme faktörü
    });
  }
}

// Eğik düzlemi güncelle
function updateInclinedPlane() {
  if (engine && render) {
    createInclinedPlane();
  }
}

// Sürtünmeyi güncelle
function updateFriction() {
  if (inclinedPlane) {
    inclinedPlane.friction = friction.value;
  }
  
  if (box) {
    box.friction = friction.value;
  }
}

// Cisim kütlesini güncelle
function updateObjectMass() {
  if (box) {
    Body.setMass(box, objectMass.value);
  }
}

// Simülasyonu sıfırla
function resetSimulation() {
  if (engine && render) {
    createInclinedPlane();
  } else {
    initSimulation();
  }
}

// Simülasyonu durdur/başlat
function togglePause() {
  isPaused.value = !isPaused.value;
  
  if (isPaused.value) {
    if (runner) Runner.stop(runner);
  } else {
    if (runner) Runner.run(runner, engine);
  }
}

// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
function handleResize() {
  if (render && canvasContainer.value) {
    const containerWidth = canvasContainer.value.clientWidth;
    const containerHeight = canvasContainer.value.clientHeight;
    
    render.options.width = containerWidth;
    render.options.height = containerHeight;
    render.canvas.width = containerWidth;
    render.canvas.height = containerHeight;
    
    // Dünya sınırlarını güncelle
    if (ground) Body.setPosition(ground, { x: containerWidth / 2, y: containerHeight + 30 });
    if (leftWall) Body.setPosition(leftWall, { x: -30, y: containerHeight / 2 });
    if (rightWall) Body.setPosition(rightWall, { x: containerWidth + 30, y: containerHeight / 2 });
    
    // Eğik düzlemi yeniden oluştur
    createInclinedPlane();
    
    console.log('Canvas resized', { containerWidth, containerHeight });
  }
}

// Değişkenleri izle
watch([angleInDegrees, friction, objectMass], () => {
  if (engine && render) {
    updateInclinedPlane();
    updateFriction();
    updateObjectMass();
  }
});
</script>

<style scoped>
/* Slider stillerini iyileştir */
input[type="range"] {
  -webkit-appearance: none;
  height: 8px;
  border-radius: 5px;
  background: #e5e7eb;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

/* Canvas stillerini iyileştir */
canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}
</style>
  
 