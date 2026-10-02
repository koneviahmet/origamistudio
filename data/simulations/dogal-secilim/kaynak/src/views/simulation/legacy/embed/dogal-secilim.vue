<template>
  <div class="h-screen bg-gray-900 p-4 text-white pb-20 relative overflow-auto">
    
    <!-- Başlat/Durdur Butonu (Mobil ve PC) -->
    <div class="flex justify-center mb-4">
      <button @click="startSimulation" 
              class="px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              :class="isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
        {{ isRunning ? 'Durdur' : 'Başlat' }}
      </button>
    </div>
    
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Simülasyon Alanı -->
      <div class="lg:w-2/3 order-2 lg:order-1">
        <div class="relative">
          <!-- Simülasyon Canvas'ı -->
          <div ref="simulationContainer" class="w-full h-[500px] lg:h-[600px] rounded-lg overflow-hidden border-2 border-gray-700 relative">
            <!-- Canvas Matter.js için buraya eklenecek -->
          </div>
          
          <!-- Simülasyon Bilgileri -->
          <div class="absolute top-2 left-2 bg-gray-800 bg-opacity-80 p-2 rounded">
            <p>Ortam: {{ environmentName }}</p>
            <p>Sıcaklık: {{ temperature }}°C</p>
            <p>Yağış: {{ rainfall }}%</p>
          </div>


        <!-- Genetik Dağılım -->
        <div class="absolute top-2 right-2 bg-gray-800 bg-opacity-80 p-2 rounded block lg:hidden">
          <div class="space-y-2">
            <div>
              <label class="block mb-2 text-2xs">Renk Dağılımı</label>
              <div class="h-3 w-full bg-gray-700 rounded-lg overflow-hidden flex">
                <div v-for="(count, index) in colorDistribution" :key="index"
                     :style="{ width: `${(count / aliveOrganisms) * 100}%`, backgroundColor: getColorForIndex(index) }"
                     class="h-full transition-all duration-300">
                </div>
              </div>
            </div>
            
            <div>
              <label class="block mb-2 text-2xs">Hız Dağılımı</label>
              <div class="h-3 w-full bg-gray-700 rounded-lg overflow-hidden flex">
                <div v-for="(count, index) in speedDistribution" :key="index"
                     :style="{ width: `${(count / aliveOrganisms) * 100}%`, backgroundColor: getSpeedColor(index) }"
                     class="h-full transition-all duration-300">
                </div>
              </div>
            </div>
            
            <div>
              <label class="block mb-2 text-2xs">Boyut Dağılımı</label>
              <div class="h-3 w-full bg-gray-700 rounded-lg overflow-hidden flex">
                <div v-for="(count, index) in sizeDistribution" :key="index"
                     :style="{ width: `${(count / aliveOrganisms) * 100}%`, backgroundColor: getSizeColor(index) }"
                     class="h-full transition-all duration-300">
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>
        

      </div>

      <!-- Mobil Ayarlar Butonu -->
      <button class="lg:hidden absolute top-4 left-4 z-10 bg-gray-800 p-2 rounded-lg" @click="showMobileSettings = !showMobileSettings">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <!-- Kontrol Paneli -->
      <div :class="{
        'fixed inset-0 z-40 bg-gray-900 transform transition-transform duration-300 lg:relative lg:transform-none': true,
        'translate-x-0': showMobileSettings,
        '-translate-x-full lg:translate-x-0': !showMobileSettings
      }" class="bg-gray-800 p-6 lg:w-1/3 order-1 lg:order-2 max-h-screen overflow-y-auto">
        <!-- Mobil Kapatma Butonu -->
        <button class="lg:hidden absolute top-4 right-4" @click="showMobileSettings = false">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        
        <!-- Genetik Dağılım -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Genetik Dağılım</h3>
          <div class="space-y-4">
            <div>
              <label class="block mb-2">Renk Dağılımı</label>
              <div class="h-6 w-full bg-gray-700 rounded-lg overflow-hidden flex">
                <div v-for="(count, index) in colorDistribution" :key="index"
                     :style="{ width: `${(count / aliveOrganisms) * 100}%`, backgroundColor: getColorForIndex(index) }"
                     class="h-full transition-all duration-300">
                </div>
              </div>
            </div>
            
            <div>
              <label class="block mb-2">Hız Dağılımı</label>
              <div class="h-6 w-full bg-gray-700 rounded-lg overflow-hidden flex">
                <div v-for="(count, index) in speedDistribution" :key="index"
                     :style="{ width: `${(count / aliveOrganisms) * 100}%`, backgroundColor: getSpeedColor(index) }"
                     class="h-full transition-all duration-300">
                </div>
              </div>
            </div>
            
            <div>
              <label class="block mb-2">Boyut Dağılımı</label>
              <div class="h-6 w-full bg-gray-700 rounded-lg overflow-hidden flex">
                <div v-for="(count, index) in sizeDistribution" :key="index"
                     :style="{ width: `${(count / aliveOrganisms) * 100}%`, backgroundColor: getSizeColor(index) }"
                     class="h-full transition-all duration-300">
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- Arkaplan Rengi Seçimi -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Arkaplan Rengi</h3>
          <div class="flex gap-2">
            <button @click="environment = 'forest'" class="w-8 h-8 rounded-full bg-green-900 border-2" :class="environment === 'forest' ? 'border-white' : 'border-transparent'"></button>
            <button @click="environment = 'desert'" class="w-8 h-8 rounded-full bg-yellow-700 border-2" :class="environment === 'desert' ? 'border-white' : 'border-transparent'"></button>
            <button @click="environment = 'arctic'" class="w-8 h-8 rounded-full bg-blue-100 border-2" :class="environment === 'arctic' ? 'border-white' : 'border-transparent'"></button>
          </div>
        </div>
        
        <!-- Avcı Seçimi -->
        <div class="mb-6">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="hasPredator" class="form-checkbox h-5 w-5 text-green-600">
            <span>Avcı Ekle</span>
          </label>
        </div>
        
        <!-- Ayarlar -->
        <div class="space-y-6">
          <div>
            <label class="flex justify-between mb-2">
              <span>Sıcaklık</span>
              <span>{{ temperature }}°C</span>
            </label>
            <input type="range" v-model="temperature" min="-10" max="40" 
                   class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div>
            <label class="flex justify-between mb-2">
              <span>Yağış</span>
              <span>{{ rainfall }}%</span>
            </label>
            <input type="range" v-model="rainfall" min="0" max="100" 
                   class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div>
            <label class="flex justify-between mb-2">
              <span>Rüzgar</span>
              <span>{{ wind }} km/s</span>
            </label>
            <input type="range" v-model="wind" min="0" max="100" 
                   class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div>
            <label class="flex justify-between mb-2">
              <span>Başlangıç Popülasyonu</span>
              <span>{{ initialPopulation }}</span>
            </label>
            <input type="range" v-model="initialPopulation" min="10" max="100" 
                   class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
          
          <div>
            <label class="flex justify-between mb-2">
              <span>Mutasyon Oranı</span>
              <span>{{ mutationRate }}%</span>
            </label>
            <input type="range" v-model="mutationRate" min="0" max="10" step="0.1" 
                   class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
          </div>
        </div>
        
        <!-- Resetle Butonu -->
        <div class="mt-6">
          <button @click="resetSimulation" 
                  class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
            Sıfırla
          </button>
        </div>
        
        <!-- İstatistikler -->
        <div class="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">İstatistikler</h3>
          <div class="space-y-2">
            <p>Nesil: {{ generation }}</p>
            <p>Canlı Organizma: {{ aliveOrganisms }}</p>
            <p>Geçen Süre: {{ elapsedTime }} sn</p>
          </div>
        </div>
        

      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
import Matter from 'matter-js';

// Matter.js bileşenleri
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;
const Runner = Matter.Runner;

// Referanslar
const simulationContainer = ref(null);
const generationsChart = ref(null);
let engine, render, world, runner;

// Simülasyon durumu
const isRunning = ref(false);
const generation = ref(0);
const aliveOrganisms = ref(0);
const elapsedTime = ref(0);
let timeInterval;

// Simülasyon parametreleri
const environment = ref('forest');
const hasPredator = ref(false);
const temperature = ref(25);
const rainfall = ref(50);
const wind = ref(20);
const initialPopulation = ref(30);
const mutationRate = ref(1);

// Organizma deposu
let organisms = [];
let predators = [];
let foods = [];

// Dağılım istatistikleri
const colorDistribution = ref([0, 0, 0, 0, 0]);
const speedDistribution = ref([0, 0, 0, 0, 0]);
const sizeDistribution = ref([0, 0, 0, 0, 0]);

// Ortam ismi hesaplanan değer
const environmentName = computed(() => {
  switch(environment.value) {
    case 'forest': return 'Orman';
    case 'desert': return 'Çöl';
    case 'arctic': return 'Kutup';
    default: return 'Orman';
  }
});

// Simülasyonu başlat
const startSimulation = () => {
  if (isRunning.value) {
    // Simülasyonu durdur
    isRunning.value = false;
    clearInterval(timeInterval);
    // Matter.js'i durdur
    if (runner) {
      Runner.stop(runner);
    }
  } else {
    // Simülasyonu başlat
    isRunning.value = true;
    // Zamanı takip et
    timeInterval = setInterval(() => {
      elapsedTime.value += 0.1;
      
      // Her 10 saniyede bir yeni nesil
      if (Math.floor(elapsedTime.value * 10) % 100 === 0) {
        generation.value++;
        breedNewGeneration();
      }
      
      // Rastgele yeni yiyecek ekle
      if (Math.random() < 0.05) {
        addFood();
      }
      
      // İstatistikleri güncelle
      updateStatistics();
    }, 100);
    
    // Matter.js'i başlat
    if (!runner) {
      runner = Runner.create();
    }
    Runner.run(runner, engine);
  }
};

// Simülasyonu sıfırla
const resetSimulation = () => {
  try {
    // Simülasyonu durdur
    if (isRunning.value) {
      isRunning.value = false;
      clearInterval(timeInterval);
      if (runner) {
        Runner.stop(runner);
      }
    }
    
    // İstatistikleri sıfırla
    generation.value = 0;
    elapsedTime.value = 0;
    
    // Mevcut tüm cisimleri dünyadan kaldır
    if (world) {
      World.clear(world);
    }
    
    // Organizmaları yeniden oluştur
    organisms = [];
    foods = [];
    predators = [];
    
    // Engine ve world'ü yeniden oluştur (daha güvenli olması için)
    engine = Engine.create();
    world = engine.world;
    
    // Render'ı güncelle
    if (render) {
      render.engine = engine;
      Render.run(render);
    }
    
    // Runner'ı güncelle
    if (runner) {
      Runner.stop(runner);
    }
    runner = Runner.create();
    
    // Sınırları ekle
    addBoundaries();
    
    // Organizmaları başlat
    initializePopulation();
    
    // Yiyecek ekle
    addFood(20); // Başlangıçta 20 yiyecek ekle
    
    if (hasPredator.value) {
      addPredators(3); // 3 avcı ekle
    }
    
    // Çarpışmaları yönet
    handleCollisions();
    
    // Organizmaları ve avcıları güncelle
    updateEntities();
    
    // İstatistikleri güncelle
    updateStatistics();
    
    // Ortamı güncelle
    updateEnvironment();
    
    console.log("Simülasyon başarıyla sıfırlandı");
  } catch (error) {
    console.error("Simülasyon sıfırlanırken hata oluştu:", error);
  }
};

// Yeni organizma oluştur
const createOrganism = (x, y, genes = null) => {
  // Eğer genler belirtilmemişse rastgele oluştur
  if (!genes) {
    genes = {
      color: Math.floor(Math.random() * 5),      // 0-4 arası renk
      speed: Math.floor(Math.random() * 5),      // 0-4 arası hız
      size: Math.floor(Math.random() * 5),       // 0-4 arası boyut
      resistance: Math.floor(Math.random() * 5)  // 0-4 arası dayanıklılık
    };
  }
  
  // Genetik özelliklere göre fiziksel özellikleri belirle
  const sizeFactor = 5 + genes.size * 2;  // 5-13 arası boyut
  const speedFactor = 0.5 + genes.speed * 0.3;  // 0.5-1.7 arası hız çarpanı
  
  // Renk kodunu belirle
  const colors = [
    '#FF5555', // Kırmızı
    '#FFAA55', // Turuncu
    '#FFFF55', // Sarı
    '#55FF55', // Yeşil
    '#5555FF'  // Mavi
  ];
  
  // Organizma gövdesini oluştur
  const body = Bodies.circle(x, y, sizeFactor, {
    restitution: 0.8,
    friction: 0.005,
    density: 0.001,
    frictionAir: 0.01,
    label: 'organism',
    render: {
      fillStyle: colors[genes.color],
      strokeStyle: '#FFFFFF',
      lineWidth: 1
    }
  });
  
  // Organizma nesnesini oluştur
  const organism = {
    body,
    genes,
    energy: 100,  // Başlangıç enerjisi
    age: 0,
    children: 0,
    dead: false
  };
  
  // Dünyaya ekle
  World.add(world, body);
  organisms.push(organism);
  
  return organism;
};

// Yiyecek ekle
const addFood = (count = 1) => {
  if (!render || !render.options) return; // Render henüz hazır değilse çık
  
  for (let i = 0; i < count; i++) {
    const x = Math.random() * render.options.width;
    const y = Math.random() * render.options.height;
    
    const food = Bodies.circle(x, y, 3, {
      isStatic: true,
      isSensor: true,
      label: 'food',
      render: {
        fillStyle: '#55FF55',  // Yeşil yiyecek
        strokeStyle: '#FFFFFF',
        lineWidth: 1
      }
    });
    
    World.add(world, food);
    foods.push(food);
  }
};

// Avcı ekle
const addPredators = (count = 1) => {
  if (!render || !render.options) return; // Render henüz hazır değilse çık
  
  for (let i = 0; i < count; i++) {
    const x = Math.random() * render.options.width;
    const y = Math.random() * render.options.height;
    
    const predator = Bodies.rectangle(x, y, 20, 20, {
      restitution: 0.8,
      friction: 0.01,
      density: 0.002,
      frictionAir: 0.005,
      label: 'predator',
      render: {
        fillStyle: '#FF0000',  // Kırmızı avcı
        strokeStyle: '#FFFFFF',
        lineWidth: 1
      }
    });
    
    World.add(world, predator);
    predators.push({
      body: predator,
      energy: 200,
      target: null
    });
  }
};

// Yeni nesil üret
const breedNewGeneration = () => {
  if (!render || !render.options) return; // Render henüz hazır değilse çık
  
  // Hayatta kalanları seç
  const survivors = organisms.filter(o => !o.dead && o.energy > 30);
  
  // Eğer yeterli hayatta kalan yoksa rastgele organizma ekle
  if (survivors.length < 5) {
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * render.options.width;
      const y = Math.random() * render.options.height;
      createOrganism(x, y);
    }
    return;
  }
  
  // Fitness skoruna göre sırala (enerji ve yaş kombinasyonu)
  survivors.sort((a, b) => (b.energy + b.children * 20) - (a.energy + a.children * 20));
  
  // En uygun olanları seç (üst %50)
  const fittest = survivors.slice(0, Math.floor(survivors.length * 0.5));
  
  // Çiftleşme havuzu oluştur
  const matingPool = [];
  for (const organism of fittest) {
    // Fitness skoruna göre havuza ekle (daha uygun olanlar daha fazla kopyalanır)
    const fitness = organism.energy + organism.children * 20;
    const copies = Math.max(1, Math.floor(fitness / 20));
    for (let i = 0; i < copies; i++) {
      matingPool.push(organism);
    }
  }
  
  // Yeni nesil için yeni organizmalar oluştur
  for (let i = 0; i < initialPopulation.value / 2; i++) {
    // Rastgele iki ebeveyn seç
    if (matingPool.length === 0) break;
    
    const parentA = matingPool[Math.floor(Math.random() * matingPool.length)];
    const parentB = matingPool[Math.floor(Math.random() * matingPool.length)];
    
    // Genleri birleştir
    const childGenes = {
      color: Math.random() < 0.5 ? parentA.genes.color : parentB.genes.color,
      speed: Math.random() < 0.5 ? parentA.genes.speed : parentB.genes.speed,
      size: Math.random() < 0.5 ? parentA.genes.size : parentB.genes.size,
      resistance: Math.random() < 0.5 ? parentA.genes.resistance : parentB.genes.resistance
    };
    
    // Mutasyon uygula
    if (Math.random() < mutationRate.value / 100) {
      const geneToMutate = ['color', 'speed', 'size', 'resistance'][Math.floor(Math.random() * 4)];
      childGenes[geneToMutate] = Math.floor(Math.random() * 5);
    }
    
    // Yeni organizmayı oluştur
    const x = Math.random() * render.options.width;
    const y = Math.random() * render.options.height;
    createOrganism(x, y, childGenes);
    
    // Ebeveynlerin çocuk sayısını arttır
    parentA.children++;
    parentB.children++;
  }
  
  // Yaşlanan veya güçsüzleşen organizmaları kaldır
  for (const organism of organisms) {
    organism.age++;
    
    // Yaşlanan veya enerjisi çok düşük organizmaları kaldır
    if (organism.age > 3 || organism.energy < 10) {
      if (!organism.dead) {
        World.remove(world, organism.body);
        organism.dead = true;
      }
    }
  }
  
  // Ölüleri listeden temizle
  organisms = organisms.filter(o => !o.dead);
};

// İstatistikleri güncelle
const updateStatistics = () => {
  aliveOrganisms.value = organisms.filter(o => !o.dead).length;
  
  // Renk dağılımını güncelle
  colorDistribution.value = [0, 0, 0, 0, 0];
  speedDistribution.value = [0, 0, 0, 0, 0];
  sizeDistribution.value = [0, 0, 0, 0, 0];
  
  for (const organism of organisms) {
    if (!organism.dead) {
      colorDistribution.value[organism.genes.color]++;
      speedDistribution.value[organism.genes.speed]++;
      sizeDistribution.value[organism.genes.size]++;
    }
  }
};

// Renk indeksi için görsel renk döndür
const getColorForIndex = (index) => {
  const colors = ['#FF5555', '#FFAA55', '#FFFF55', '#55FF55', '#5555FF'];
  return colors[index];
};

// Hız indeksi için görsel renk döndür
const getSpeedColor = (index) => {
  const colors = ['#555555', '#777777', '#999999', '#BBBBBB', '#DDDDDD'];
  return colors[index];
};

// Boyut indeksi için görsel renk döndür
const getSizeColor = (index) => {
  const colors = ['#5555FF', '#55AAFF', '#55FFFF', '#AAFFFF', '#FFFFFF'];
  return colors[index];
};

// Ortamı güncelle
const updateEnvironment = () => {
  if (!render || !render.options) return; // Render henüz hazır değilse çık
  
  // Arka plan rengini değiştir
  let bgColor, wallColor;
  
  switch(environment.value) {
    case 'forest':
      bgColor = '#225522';  // Koyu yeşil
      wallColor = '#553311';  // Kahverengi
      break;
    case 'desert':
      bgColor = '#DDAA55';  // Sarı kum
      wallColor = '#BB8833';  // Turuncu kum
      break;
    case 'arctic':
      bgColor = '#CCFFFF';  // Açık mavi buz
      wallColor = '#FFFFFF';  // Beyaz kar
      break;
    default:
      bgColor = '#225522';
      wallColor = '#553311';
  }
  
  // Render ayarlarını güncelle
  render.options.wireframes = false;
  render.options.background = bgColor;
  
  // Sınırları güncelle
  if (world) {
    // Mevcut sınırları kaldır
    const boundaries = Matter.Composite.allBodies(world).filter(
      body => body.label === 'boundary'
    );
    World.remove(world, boundaries);
    
    // Yeni sınırları ekle
    addBoundaries(wallColor);
  }
};

// Sınırları ekle
const addBoundaries = (color = '#553311') => {
  if (!render || !render.options) return; // Render henüz hazır değilse çık
  
  const thickness = 50;
  const width = render.options.width;
  const height = render.options.height;
  
  // Taban
  const ground = Bodies.rectangle(
    width / 2, 
    height + thickness / 2, 
    width + 2 * thickness, 
    thickness, 
    { 
      isStatic: true,
      label: 'boundary',
      render: {
        fillStyle: color
      }
    }
  );
  
  // Tavan
  const ceiling = Bodies.rectangle(
    width / 2, 
    -thickness / 2, 
    width + 2 * thickness, 
    thickness, 
    { 
      isStatic: true,
      label: 'boundary',
      render: {
        fillStyle: color
      }
    }
  );
  
  // Sol duvar
  const leftWall = Bodies.rectangle(
    -thickness / 2, 
    height / 2, 
    thickness, 
    height + 2 * thickness, 
    { 
      isStatic: true,
      label: 'boundary',
      render: {
        fillStyle: color
      }
    }
  );
  
  // Sağ duvar
  const rightWall = Bodies.rectangle(
    width + thickness / 2, 
    height / 2, 
    thickness, 
    height + 2 * thickness, 
    { 
      isStatic: true,
      label: 'boundary',
      render: {
        fillStyle: color
      }
    }
  );
  
  World.add(world, [ground, ceiling, leftWall, rightWall]);
};

// Başlangıç popülasyonunu oluştur
const initializePopulation = () => {
  if (!render || !render.options) return; // Render henüz hazır değilse çık
  
  for (let i = 0; i < initialPopulation.value; i++) {
    const x = 100 + Math.random() * (render.options.width - 200);
    const y = 100 + Math.random() * (render.options.height - 200);
    createOrganism(x, y);
  }
  
  updateStatistics();
};

// Çarpışmaları yönet
const handleCollisions = () => {
  // Daha önce eklenmiş dinleyicileri kaldıralım
  Events.off(engine, 'collisionStart');
  
  // Yeni dinleyici ekle
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    for (const pair of pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Organizma ve yiyecek çarpışması
      if ((bodyA.label === 'organism' && bodyB.label === 'food') ||
          (bodyA.label === 'food' && bodyB.label === 'organism')) {
        const organism = bodyA.label === 'organism' ? 
          organisms.find(o => o.body.id === bodyA.id) : 
          organisms.find(o => o.body.id === bodyB.id);
          
        const food = bodyA.label === 'food' ? bodyA : bodyB;
        
        // Yiyeceği kaldır
        World.remove(world, food);
        foods = foods.filter(f => f.id !== food.id);
        
        // Organizmaya enerji ekle
        if (organism && !organism.dead) {
          organism.energy += 20;
        }
        
        // Yeni yiyecek ekle
        setTimeout(() => addFood(), 1000);
      }
      
      // Organizma ve avcı çarpışması
      if ((bodyA.label === 'organism' && bodyB.label === 'predator') ||
          (bodyA.label === 'predator' && bodyB.label === 'organism')) {
        const organism = bodyA.label === 'organism' ? 
          organisms.find(o => o.body.id === bodyA.id) : 
          organisms.find(o => o.body.id === bodyB.id);
          
        const predator = bodyA.label === 'predator' ? 
          predators.find(p => p.body.id === bodyA.id) : 
          predators.find(p => p.body.id === bodyB.id);
        
        // Organizmayı öldür
        if (organism && !organism.dead) {
          World.remove(world, organism.body);
          organism.dead = true;
          
          // Avcıya enerji ekle
          if (predator) {
            predator.energy += 30;
            predator.target = null;
          }
        }
      }
    }
  });
};

// Organizmaları ve avcıları güncelle
const updateEntities = () => {
  // Daha önce eklenmiş dinleyicileri kaldıralım
  Events.off(engine, 'beforeUpdate');
  
  // Yeni dinleyici ekle
  Events.on(engine, 'beforeUpdate', () => {
    if (!isRunning.value) return;
    
    // Organizmaları güncelle
    for (const organism of organisms) {
      if (organism.dead) continue;
      
      // Enerjiyi azalt
      organism.energy -= 0.1;
      
      if (organism.energy <= 0) {
        // Enerji bitince öl
        World.remove(world, organism.body);
        organism.dead = true;
        continue;
      }
      
      // En yakın yiyeceği bul
      let closestFood = null;
      let minDistance = Infinity;
      
      for (const food of foods) {
        const dx = food.position.x - organism.body.position.x;
        const dy = food.position.y - organism.body.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestFood = food;
        }
      }
      
      // En yakın avcıyı bul
      let closestPredator = null;
      minDistance = Infinity;
      
      for (const predator of predators) {
        const dx = predator.body.position.x - organism.body.position.x;
        const dy = predator.body.position.y - organism.body.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPredator = predator;
        }
      }
      
      // Hareket stratejisi
      let forceX = 0;
      let forceY = 0;
      
      // Eğer yakında avcı varsa ve yeterince yakınsa kaç
      if (closestPredator && minDistance < 150) {
        // Avcıdan kaç
        const dx = organism.body.position.x - closestPredator.body.position.x;
        const dy = organism.body.position.y - closestPredator.body.position.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude !== 0) { // Sıfıra bölmeyi önle
          forceX = (dx / magnitude) * (0.5 + organism.genes.speed * 0.3) * 0.0001;
          forceY = (dy / magnitude) * (0.5 + organism.genes.speed * 0.3) * 0.0001;
        }
      } else if (closestFood) {
        // Yiyeceğe doğru git
        const dx = closestFood.position.x - organism.body.position.x;
        const dy = closestFood.position.y - organism.body.position.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude !== 0) { // Sıfıra bölmeyi önle
          forceX = (dx / magnitude) * (0.5 + organism.genes.speed * 0.3) * 0.00005;
          forceY = (dy / magnitude) * (0.5 + organism.genes.speed * 0.3) * 0.00005;
        }
      } else {
        // Rastgele hareket
        forceX = (Math.random() * 2 - 1) * 0.00001;
        forceY = (Math.random() * 2 - 1) * 0.00001;
      }
      
      // Kuvveti uygula
      Body.applyForce(organism.body, organism.body.position, {
        x: forceX,
        y: forceY
      });
    }
    
    // Avcıları güncelle
    for (const predator of predators) {
      // Enerjiyi azalt
      predator.energy -= 0.2;
      
      if (predator.energy <= 0) {
        // Yeni avcı ekle
        World.remove(world, predator.body);
        const x = Math.random() * render.options.width;
        const y = Math.random() * render.options.height;
        const newPredator = Bodies.rectangle(x, y, 20, 20, {
          restitution: 0.8,
          friction: 0.01,
          density: 0.002,
          frictionAir: 0.005,
          label: 'predator',
          render: {
            fillStyle: '#FF0000',
            strokeStyle: '#FFFFFF',
            lineWidth: 1
          }
        });
        
        World.add(world, newPredator);
        predator.body = newPredator;
        predator.energy = 200;
        predator.target = null;
        continue;
      }
      
      // Hedef organizmayı bul veya güncelle
      if (!predator.target || predator.target.dead) {
        // Yaşayan organizmaları filtrele
        const aliveOnes = organisms.filter(o => !o.dead);
        
        if (aliveOnes.length > 0) {
          // Rastgele bir organizma seç
          predator.target = aliveOnes[Math.floor(Math.random() * aliveOnes.length)];
        } else {
          predator.target = null;
        }
      }
      
      // Hedefe doğru hareket et
      if (predator.target) {
        const dx = predator.target.body.position.x - predator.body.position.x;
        const dy = predator.target.body.position.y - predator.body.position.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude !== 0) { // Sıfıra bölmeyi önle
          const forceX = (dx / magnitude) * 0.0001;
          const forceY = (dy / magnitude) * 0.0001;
          
          Body.applyForce(predator.body, predator.body.position, {
            x: forceX,
            y: forceY
          });
        }
      } else {
        // Rastgele hareket
        const forceX = (Math.random() * 2 - 1) * 0.00005;
        const forceY = (Math.random() * 2 - 1) * 0.00005;
        
        Body.applyForce(predator.body, predator.body.position, {
          x: forceX,
          y: forceY
        });
      }
    }
  });
};

// Matter.js ortamını başlat
const initMatter = () => {
  try {
    // Önceki engine ve render'ı temizle
    if (engine) {
      Matter.Engine.clear(engine);
    }
    if (render) {
      Matter.Render.stop(render);
      // Canvas'ı daha güvenli bir şekilde kaldır
      if (render.canvas && render.canvas.parentNode) {
        render.canvas.parentNode.removeChild(render.canvas);
      }
      render.canvas = null;
      render.context = null;
      render.textures = {};
    }
    
    // Container kontrolü
    if (!simulationContainer.value) {
      console.error("Simülasyon konteyneri bulunamadı!");
      return;
    }
    
    // Yeni engine oluştur
    engine = Engine.create();
    world = engine.world;
    
    // Container boyutlarını al
    const containerWidth = simulationContainer.value.clientWidth;
    const containerHeight = simulationContainer.value.clientHeight;
    
    if (containerWidth === 0 || containerHeight === 0) {
      console.warn("Konteyner boyutu sıfır, boyutlar varsayılan değerlere ayarlanıyor.");
    }
    
    // Render oluştur
    render = Render.create({
      element: simulationContainer.value,
      engine: engine,
      options: {
        width: containerWidth || 800,
        height: containerHeight || 600,
        wireframes: false,
        background: '#225522',  // Varsayılan orman arka planı
        showAngleIndicator: false
      }
    });
    
    Render.run(render);
    
    // Runner oluştur
    runner = Runner.create();
    
    // Sınırları ekle
    addBoundaries();
    
    // Organizmaları başlat
    initializePopulation();
    
    // Yiyecek ekle
    addFood(20);  // Başlangıçta 20 yiyecek
    
    // Avcı ekle
    if (hasPredator.value) {
      addPredators(3);  // 3 avcı ekle
    }
    
    // Çarpışmaları yönet
    handleCollisions();
    
    // Organizmaları ve avcıları güncelle
    updateEntities();
    
    // İstatistikleri güncelle
    updateStatistics();
    
    console.log("Matter.js başarıyla başlatıldı");
  } catch (error) {
    console.error("Matter.js başlatılırken hata oluştu:", error);
  }
};

// Watch fonksiyonları
watch(environment, () => {
  updateEnvironment();
});

watch(hasPredator, () => {
  if (hasPredator.value) {
    // Avcıları ekle
    addPredators(3);
  } else {
    // Avcıları kaldır
    for (const predator of predators) {
      World.remove(world, predator.body);
    }
    predators = [];
  }
});

// Component montaj işlemleri
onMounted(() => {
  // Bir kez render'ın montajını tamamlamak için window.requestAnimationFrame kullanıyoruz
  window.requestAnimationFrame(() => {
    initMatter();
    
    // Ortam ve simülasyon ayarlarını güncelle
    updateEnvironment();
  });
  
  // Ekran boyutu değişimlerini dinle
  const handleResize = () => {
    if (simulationContainer.value && render) {
      const containerWidth = simulationContainer.value.clientWidth;
      const containerHeight = simulationContainer.value.clientHeight;
      
      // Render boyutunu güncelle
      render.options.width = containerWidth;
      render.options.height = containerHeight;
      render.canvas.width = containerWidth;
      render.canvas.height = containerHeight;
      
      // Sınırları güncelle
      updateEnvironment();
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  // Temizleme işlemi için onBeforeUnmount'a bu event listener'ı eklememiz gerekecek
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
  });
});

// Component kaldırılmadan önce temizlik
onBeforeUnmount(() => {
  if (isRunning.value) {
    clearInterval(timeInterval);
    isRunning.value = false;
  }
  
  // Event dinleyicilerini temizle
  if (engine) {
    Events.off(engine);
  }
  
  if (runner) {
    Runner.stop(runner);
  }
  
  if (render) {
    Matter.Render.stop(render);
  }
  
  if (engine) {
    Matter.Engine.clear(engine);
  }
});

const showMobileSettings = ref(false);
</script>

<style>
@reference "tailwindcss";

/* Özel input range stilleri */
input[type="range"] {
  @apply appearance-none bg-gray-700 h-2 rounded-lg;
}

input[type="range"]::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-green-500 rounded-full cursor-pointer;
}

input[type="range"]::-moz-range-thumb {
  @apply w-4 h-4 bg-green-500 rounded-full cursor-pointer border-none;
}

/* Checkbox stilleri */
input[type="checkbox"] {
  @apply rounded bg-gray-700 border-gray-600 text-green-600 focus:ring-green-500;
}

/* Select stilleri */
select {
  @apply bg-gray-700 border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500;
}
</style>
