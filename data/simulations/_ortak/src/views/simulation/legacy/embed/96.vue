<template>
  <div class="w-full h-screen bg-gray-900 relative overflow-hidden">
    <!-- Simülasyon Bilgileri -->
    <div class="absolute top-0 left-0 p-4 text-white bg-gray-900 bg-opacity-70 rounded-br-lg z-10">
      <p>Yerçekimi: {{ gravity }} m/s²</p>
      <p>Hava Direnci: {{ airFriction }}</p>
      <p>Cisim Sayısı: {{ bodies.length }}</p>
    </div>

    <!-- Başlat/Durdur Butonu -->
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
      <button 
        @click="toggleSimulation" 
        class="px-4 py-2 text-white rounded-lg shadow-lg"
        :class="running ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
      >
        {{ running ? 'Durdur' : 'Başlat' }}
      </button>
    </div>

    <!-- Mobil Ayarlar Butonu -->
    <div class="md:hidden absolute top-4 left-4 z-10">
      <button @click="showMobileSettings = !showMobileSettings" class="text-white bg-indigo-600 p-2 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Mobil Ayarlar Modal -->
    <div v-if="showMobileSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20" @click.self="showMobileSettings = false">
      <div class="bg-gray-800 text-white p-6 rounded-lg w-11/12 max-h-2/3 overflow-y-auto">
        <div class="settings-content">
          <h2 class="text-xl font-bold mb-4">Simülasyon Ayarları</h2>
          <div v-html="settingsHTML"></div>
        </div>
      </div>
    </div>

    <!-- Simülasyon Alanı -->
    <div ref="simulationContainer" class="w-full h-full"></div>

    <!-- Masaüstü Ayarlar Paneli -->
    <div class="hidden md:block absolute right-0 top-0 h-full max-h-screen overflow-y-auto bg-gray-800 text-white w-1/4 p-6 shadow-lg">
      <h2 class="text-xl font-bold mb-4">Simülasyon Ayarları</h2>
      <div v-html="settingsHTML"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import Matter from 'matter-js';

// Referanslar
const simulationContainer = ref(null);
const running = ref(false);
const gravity = ref(1);
const airFriction = ref(0.01);
const engineSpeed = ref(1);
const showMobileSettings = ref(false);
const backgroundColor = ref('#111827');
const bodies = ref([]);
const settingsChanged = ref(false);

// Matter.js bileşenleri
let engine, render, runner, world;

// Nesnelerin renk seçenekleri
const bodyColors = [
  '#dbeafe', // açık mavi
  '#d1fae5', // açık yeşil
  '#fee2e2', // açık kırmızı
  '#ede9fe', // açık mor
  '#f5f5dc'  // bej
];

// Ayarlar paneli içeriği
const settingsHTML = computed(() => {
  return `
    <div class="space-y-6">
      <div class="space-y-2">
        <label class="block">Yerçekimi (${gravity.value} m/s²)</label>
        <input type="range" min="0" max="3" step="0.1" value="${gravity.value}" 
               class="w-full" oninput="window.updateGravity(this.value)" />
      </div>
      
      <div class="space-y-2">
        <label class="block">Hava Direnci (${airFriction.value})</label>
        <input type="range" min="0" max="0.1" step="0.001" value="${airFriction.value}" 
               class="w-full" oninput="window.updateAirFriction(this.value)" />
      </div>
      
      <div class="space-y-2">
        <label class="block">Animasyon Hızı (${engineSpeed.value}x)</label>
        <input type="range" min="0.1" max="2" step="0.1" value="${engineSpeed.value}" 
               class="w-full" oninput="window.updateEngineSpeed(this.value)" />
      </div>
      
      <div class="space-y-2">
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg w-full" 
                onclick="window.addBody()">
          Yeni Cisim Ekle
        </button>
      </div>
      
      <div class="space-y-2 mt-4">
        <label class="block">Arkaplan Rengi</label>
        <div class="grid grid-cols-4 gap-2">
          <button class="w-8 h-8 rounded-full bg-gray-900" style="background-color: #111827"
                  onclick="window.changeBackground('#111827')"></button>
          <button class="w-8 h-8 rounded-full bg-black" style="background-color: #000000"
                  onclick="window.changeBackground('#000000')"></button>
          <button class="w-8 h-8 rounded-full bg-blue-900" style="background-color: #1e3a8a"
                  onclick="window.changeBackground('#1e3a8a')"></button>
          <button class="w-8 h-8 rounded-full bg-green-900" style="background-color: #064e3b"
                  onclick="window.changeBackground('#064e3b')"></button>
          <button class="w-8 h-8 rounded-full bg-red-900" style="background-color: #7f1d1d"
                  onclick="window.changeBackground('#7f1d1d')"></button>
          <button class="w-8 h-8 rounded-full bg-purple-900" style="background-color: #4c1d95"
                  onclick="window.changeBackground('#4c1d95')"></button>
          <button class="w-8 h-8 rounded-full bg-gray-100" style="background-color: #f3f4f6"
                  onclick="window.changeBackground('#f3f4f6')"></button>
          <button class="w-8 h-8 rounded-full bg-blue-100" style="background-color: #dbeafe"
                  onclick="window.changeBackground('#dbeafe')"></button>
        </div>
      </div>
      
      ${settingsChanged.value ? `
      <div class="mt-4">
        <button class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg w-full" 
                onclick="window.resetSettings()">
          Ayarları Sıfırla
        </button>
      </div>
      ` : ''}
    </div>
  `;
});

// Simülasyonu başlat/durdur
const toggleSimulation = () => {
  running.value = !running.value;
  if (running.value) {
    runner.enabled = true;
    Matter.Runner.run(runner, engine);
  } else {
    runner.enabled = false;
    Matter.Runner.stop(runner);
  }
};

// Yerçekimi değerini güncelle
const updateGravity = (value) => {
  gravity.value = parseFloat(value);
  world.gravity.y = gravity.value;
  settingsChanged.value = true;
};

// Hava direnci değerini güncelle
const updateAirFriction = (value) => {
  airFriction.value = parseFloat(value);
  engine.world.bodies.forEach(body => {
    Matter.Body.setFrictionAir(body, airFriction.value);
  });
  settingsChanged.value = true;
};

// Animasyon hızını güncelle
const updateEngineSpeed = (value) => {
  engineSpeed.value = parseFloat(value);
  engine.timing.timeScale = engineSpeed.value;
  settingsChanged.value = true;
};

// Arkaplan rengini değiştir
const changeBackground = (color) => {
  backgroundColor.value = color;
  document.querySelector('.bg-gray-900').style.backgroundColor = color;
  render.options.wireframes = false;
  render.options.background = color;
  settingsChanged.value = true;
};

// Yeni cisim ekle
const addBody = () => {
  const width = render.options.width;
  const size = Math.random() * 30 + 10; // 10-40 arası boyut
  const x = Math.random() * (width - 100) + 50;
  const colorIndex = Math.floor(Math.random() * bodyColors.length);
  
  const body = Matter.Bodies.circle(x, 50, size, {
    restitution: 0.8, // esneklik
    frictionAir: airFriction.value,
    render: {
      fillStyle: bodyColors[colorIndex]
    }
  });
  
  Matter.Composite.add(world, body);
  bodies.value = engine.world.bodies.filter(b => b.label !== 'Rectangle Body');
};

// Ayarları sıfırla
const resetSettings = () => {
  gravity.value = 1;
  world.gravity.y = gravity.value;
  
  airFriction.value = 0.01;
  engine.world.bodies.forEach(body => {
    if (body.label !== 'Rectangle Body') {
      Matter.Body.setFrictionAir(body, airFriction.value);
    }
  });
  
  engineSpeed.value = 1;
  engine.timing.timeScale = engineSpeed.value;
  
  backgroundColor.value = '#111827';
  changeBackground('#111827');
  
  running.value = false;
  runner.enabled = false;
  Matter.Runner.stop(runner);
  
  settingsChanged.value = false;
};

// Simülasyonu başlat
const initSimulation = () => {
  // Matter.js modüllerini ayarla
  const { Engine, Render, Runner, Bodies, Composite, Body } = Matter;
  
  // Fizik motoru oluştur
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = gravity.value;
  
  // Tarayıcı boyutlarını al
  const width = simulationContainer.value.clientWidth;
  const height = simulationContainer.value.clientHeight;
  
  // Render oluştur
  render = Render.create({
    element: simulationContainer.value,
    engine: engine,
    options: {
      width: width,
      height: height,
      wireframes: false,
      background: backgroundColor.value
    }
  });
  
  // Runner oluştur
  runner = Runner.create({
    isFixed: true
  });
  runner.enabled = false;
  
  // Zemin oluştur
  const ground = Bodies.rectangle(width / 2, height, width, 50, {
    isStatic: true,
    render: {
      fillStyle: backgroundColor.value // Zemin rengi arkaplanla aynı
    }
  });
  
  // Sol duvar
  const leftWall = Bodies.rectangle(0, height / 2, 50, height, {
    isStatic: true,
    render: {
      fillStyle: backgroundColor.value
    }
  });
  
  // Sağ duvar
  const rightWall = Bodies.rectangle(width, height / 2, 50, height, {
    isStatic: true,
    render: {
      fillStyle: backgroundColor.value
    }
  });
  
  // Statik nesneleri dünyaya ekle
  Composite.add(world, [ground, leftWall, rightWall]);
  
  // Başlangıçta birkaç cisim ekle
  for (let i = 0; i < 5; i++) {
    addBody();
  }
  
  // Render başlat
  Render.run(render);
  
  // Tarayıcı boyutu değiştiğinde render'ı güncelle
  window.addEventListener('resize', () => {
    const width = simulationContainer.value.clientWidth;
    const height = simulationContainer.value.clientHeight;
    
    render.options.width = width;
    render.options.height = height;
    render.canvas.width = width;
    render.canvas.height = height;
    
    // Zemini ve duvarları yeniden konumlandır
    Body.setPosition(ground, { x: width / 2, y: height });
    Body.setPosition(leftWall, { x: 0, y: height / 2 });
    Body.setPosition(rightWall, { x: width, y: height / 2 });
    
    Render.setPixelRatio(render, window.devicePixelRatio);
  });
  
  // Dünya cisimlerinin sayısını güncelle
  bodies.value = engine.world.bodies.filter(b => b.label !== 'Rectangle Body');
};

onMounted(() => {
  // Fonksiyonları global window nesnesine ekle
  window.updateGravity = updateGravity;
  window.updateAirFriction = updateAirFriction;
  window.updateEngineSpeed = updateEngineSpeed;
  window.changeBackground = changeBackground;
  window.addBody = addBody;
  window.resetSettings = resetSettings;
  
  // Simülasyonu başlat
  initSimulation();
});

onBeforeUnmount(() => {
  // Temizleme işlemleri
  if (runner) Runner.stop(runner);
  if (render) Matter.Render.stop(render);
  if (engine) Matter.Engine.clear(engine);
  
  // Global fonksiyonları temizle
  window.updateGravity = undefined;
  window.updateAirFriction = undefined;
  window.updateEngineSpeed = undefined;
  window.changeBackground = undefined;
  window.addBody = undefined;
  window.resetSettings = undefined;
});
</script>
  
 
 