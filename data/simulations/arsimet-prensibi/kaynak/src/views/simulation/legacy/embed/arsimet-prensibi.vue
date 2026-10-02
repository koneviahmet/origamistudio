<template>
  <div class="flex flex-col items-center p-4 bg-gray-900 min-h-screen w-full">
    
    <div class="w-full relative">
      <div class="absolute w-full top-0 left-0 text-white text-sm p-1 text-center">
        <div v-if="selectedStoneIndex == 0">Seçilen taşın yoğunluğu sıvının yoğunluğundan küçükse taş batar.</div>
        <div v-if="selectedStoneIndex == 1">Seçilen taşın yoğunluğu sıvının yoğunluğuna eşitse taş dengede kalır.</div>
        <div v-if="selectedStoneIndex == 2">Seçilen taşın yoğunluğu sıvının yoğunluğundan büyükse taş dibe batar.</div>
      </div>
      <canvas ref="simulationCanvas" class="w-full"></canvas>
      
      <!-- Sol taraftaki kontrol paneli -->
      <div class="lg:absolute top-4 left-4 bg-gray-800 bg-opacity-95 text-white p-3 r" style="z-index: 100; min-width: 180px">
        
        <!-- Taş seçim kutusu yerine görsel taş seçimi -->
        <div class="mb-3">
          <div class="text-xs font-medium mb-2 text-white">Taş Seçiniz</div>
          <div class="grid grid-cols-3 gap-2">
            <div 
              v-for="(stone, index) in stones" 
              :key="index"
              @click="!isAnimating && !isDropping && selectStone(index)"
              class="flex flex-col items-center cursor-pointer transition-all duration-200 p-2 rounded-md"
              :class="[
                selectedStoneIndex === index ? 'bg-gray-600 ring-2 ring-blue-500' : 'bg-gray-700 hover:bg-gray-600',
                (isAnimating || isDropping) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <!-- Taş görseli -->
              <div 
                class="lg:w-12 lg:h-12 w-8 h-8 mb-1 flex items-center justify-center"
                :style="{ backgroundColor: stone.color }"
              ></div>
              <!-- Taş ismi -->
              <div class="text-xs text-center font-medium">{{ stone.name }}</div>
            </div>
          </div>
        </div>
        
        <!-- Sıfırlama butonu -->
        <!-- <button 
          @click="resetSimulation" 
          class="bg-red-600 hover:bg-red-700 p-2 rounded-md w-full text-sm mt-4 font-medium transition-colors duration-200"
        >
          Sıfırla
        </button> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import Matter from 'matter-js';

// Canvas referansı
const simulationCanvas = ref(null);

// Simülasyon durumu
const isDropping = ref(false);
const waterLevel = ref(15); // cm - Başlangıç su seviyesini azalttım
const initialWaterLevel = 15; // cm - Başlangıç su seviyesini azalttım
const containerWidth = 20; // cm
const containerHeight = 45; // cm - Kabın boyunu belirttim
const containerArea = 100; // cm²
const calculatedVolume = ref(0);
const isAnimating = ref(false); // Animasyon durumunu takip etmek için

// Taş seçimi için değişkenler
const selectedStoneIndex = ref(null);
const selectedStone = ref(null);
const stones = [
  { name: '1. Taş', width: 5, height: 5, density: 0.95, color: '#FF5733', volume: 150, floatHeight: -1.5 }, //0cm batacak
  { name: '2. Taş', width: 5, height: 5, density: 1.8, color: '#33A8FF', volume: 300, floatHeight: 6 }, // 6cm batacak
  { name: '3. Taş', width: 5, height: 5, density: 2.5, color: '#33FF57', volume: 300, floatHeight: 12 }  // 12cm batacak
];

// Matter.js değişkenleri
let engine, render, runner, world;
let container, water, stone;

// Taşı seç
function selectStone(index) {
  if (isDropping.value || isAnimating.value || index === null || index === "") return;
  
  // Su seviyesini ilk durumuna getir
  waterLevel.value = initialWaterLevel;
  calculatedVolume.value = 0;
  
  selectedStoneIndex.value = index;
  selectedStone.value = stones[index];
  
  // Eğer dünya varsa ve taş henüz düşmüyorsa, taşı yeniden oluştur
  if (world && !isDropping.value) {
    // Su seviyesini güncelle
    updateWater();
    
    createStone();
    
    // Taşı otomatik olarak suya bırak
    isAnimating.value = true;
    
    // Taşın yavaşça kabın dibine düşmesini sağla
    let startY = 100;
    // Taşın batma seviyesine göre son pozisyonunu ayarla
    const floatHeight = selectedStone.value.floatHeight || 0;
    const waterSurfaceY = render.options.height - 5 - initialWaterLevel * 10;
    const endY = waterSurfaceY + floatHeight * 10; // cm -> piksel
    const duration = 2000; // 2 saniye
    const startTime = Date.now();
    
    function animateStone() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentY = startY + (endY - startY) * progress;
      
      Matter.Body.setPosition(stone, {
        x: render.options.width / 2,
        y: currentY
      });
      
      if (progress < 1) {
        requestAnimationFrame(animateStone);
      } else {
        // Animasyon tamamlandı
        isAnimating.value = false;
        
        // Taşın hacmini hesapla
        calculatedVolume.value = selectedStone.value.volume;
        
        // Suyun seviyesini kademeli olarak artır
        animateWaterLevel();
      }
    }
    
    function animateWaterLevel() {
      isAnimating.value = true;
      const targetWaterLevel = initialWaterLevel + (calculatedVolume.value / containerArea);
      const startLevel = waterLevel.value;
      const levelDuration = 1500; // 1.5 saniye
      const levelStartTime = Date.now();
      
      function updateWaterLevelAnimation() {
        const elapsed = Date.now() - levelStartTime;
        const progress = Math.min(elapsed / levelDuration, 1);
        const currentLevel = startLevel + (targetWaterLevel - startLevel) * progress;
        
        waterLevel.value = currentLevel;
        
        if (progress < 1) {
          requestAnimationFrame(updateWaterLevelAnimation);
        } else {
          isAnimating.value = false;
          // Su seviyesi animasyonu tamamlandıktan sonra işaretleri son kez güncelle
          updateWater();
        }
      }
      
      requestAnimationFrame(updateWaterLevelAnimation);
    }
    
    requestAnimationFrame(animateStone);
  }
}

// Taşı suya bırak
function dropStone() {
  if (!selectedStone.value || isDropping.value) return;
  
  isDropping.value = true;
  
  // Taşı canlandır - biraz daha fazla fizik özelliği ekle
  Matter.Body.setStatic(stone, false);
  
  // Biraz hız ekle
  Matter.Body.setVelocity(stone, { x: 0, y: 5 });
  
  // Matter.js motorunda ayarların doğru şekilde uygulanmasını sağlamak için:
  Matter.Engine.update(engine);
}

// Simülasyonu sıfırla
function resetSimulation() {
  isDropping.value = false;
  isAnimating.value = false;
  waterLevel.value = initialWaterLevel;
  calculatedVolume.value = 0;
  
  // Dünyayı temizle ve yeniden yapılandır
  Matter.World.clear(world);
  setupWorld();
  
  // Eğer bir taş seçiliyse, onu yeniden oluştur
  if (selectedStoneIndex.value !== null) {
    createStone();
  }
}

// Taşı oluştur
function createStone() {
  if (stone && world.bodies.includes(stone)) {
    Matter.World.remove(world, stone);
  }
  
  const stoneData = selectedStone.value;
  
  if (stoneData.radius) {
    // Yuvarlak taş
    stone = Matter.Bodies.circle(
      render.options.width / 2, 
      100, 
      stoneData.radius * 10, // Ölçeği büyüt (cm -> piksel)
      {
        isStatic: true,
        restitution: 0.3,
        friction: 0.1,
        frictionAir: 0.01,
        density: stoneData.density * 0.1, // Yoğunluğu artır
        render: { fillStyle: stoneData.color }
      }
    );
  } else {
    // Dörtgen taş
    stone = Matter.Bodies.rectangle(
      render.options.width / 2, 
      100, 
      stoneData.width * 10, // Ölçeği büyüt (cm -> piksel)
      stoneData.height * 10, // Ölçeği büyüt (cm -> piksel)
      {
        isStatic: true,
        restitution: 0.3,
        friction: 0.1,
        frictionAir: 0.01,
        density: stoneData.density * 0.1, // Yoğunluğu artır
        render: { fillStyle: stoneData.color }
      }
    );
  }
  
  Matter.World.add(world, stone);
}

// Dünyayı kur
function setupWorld() {
  // Konteyner (dereceli silindir) oluştur - boyunu arttırıyoruz
  container = Matter.Bodies.rectangle(
    render.options.width / 2,
    render.options.height - 150,
    containerWidth * 10, // Ölçeği büyüt (cm -> piksel)
    containerHeight * 10, // Kabın boyunu büyüttük
    {
      isStatic: true,
      isSensor: true,
      render: { 
        fillStyle: 'transparent',
        lineWidth: 2,
        strokeStyle: '#CCCCCC'
      }
    }
  );
  
  // Duvarlar oluştur - duvarları uzattık
  const leftWall = Matter.Bodies.rectangle(
    render.options.width / 2 - (containerWidth * 10) / 2,
    render.options.height - 150,
    10,
    containerHeight * 10, // Duvar boyunu artırdık
    { 
      isStatic: true, 
      render: { fillStyle: '#CCCCCC' },
      collisionFilter: {
        category: 0x0001
      }
    }
  );
  
  const rightWall = Matter.Bodies.rectangle(
    render.options.width / 2 + (containerWidth * 10) / 2,
    render.options.height - 150,
    10,
    containerHeight * 10, // Duvar boyunu artırdık
    { 
      isStatic: true, 
      render: { fillStyle: '#CCCCCC' },
      collisionFilter: {
        category: 0x0001
      }
    }
  );
  
  const bottom = Matter.Bodies.rectangle(
    render.options.width / 2,
    render.options.height - 5,
    render.options.width,
    10,
    { 
      isStatic: true, 
      render: { fillStyle: '#CCCCCC' },
      collisionFilter: {
        category: 0x0001
      }
    }
  );
  
  // Su ölçüm çizgileri
  const measureLines = [];
  const lineCount = 9; // Daha fazla ölçüm çizgisi
  const lineSpacing = (containerHeight * 10) / lineCount;
  
  for (let i = 0; i <= lineCount; i++) {
    const y = render.options.height - 150 - (containerHeight * 10) / 2 + i * lineSpacing;
    const line = Matter.Bodies.rectangle(
      render.options.width / 2,
      y,
      containerWidth * 10 * 0.8,
      1,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: 'rgba(255, 255, 255, 0.3)',
          lineWidth: 1
        }
      }
    );
    
    // Her 5 cm'de bir etiket ekle
    if (i % 2 === 0) {
      const label = Matter.Bodies.rectangle(
        render.options.width / 2 - (containerWidth * 5),
        y,
        20,
        10,
        {
          isStatic: true,
          isSensor: true,
          render: {
            fillStyle: 'transparent',
            text: {
              content: `${i * 5} cm`,
              color: 'white',
              size: 10,
              family: 'Arial'
            }
          }
        }
      );
      measureLines.push(label);
    }
    
    measureLines.push(line);
  }
  
  // İlk su seviyesi işareti - sol tarafta
  const initialWaterLevelY = render.options.height - 5 - initialWaterLevel * 10;
  const initialWaterMarker = Matter.Bodies.rectangle(
    render.options.width / 2 - (containerWidth * 10) / 2 - 15,
    initialWaterLevelY,
    30,
    3,
    {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: '#3498db', // Mavi
        strokeStyle: '#2980b9',
        lineWidth: 1
      },
      plugin: {
        initialMarker: true
      }
    }
  );
  
  const initialWaterLabel = Matter.Bodies.rectangle(
    render.options.width / 2 - (containerWidth * 10) / 2 - 45,
    initialWaterLevelY,
    80,
    20,
    {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: 'transparent',
        text: {
          content: `İlk: ${initialWaterLevel.toFixed(1)} cm`,
          color: '#3498db',
          size: 10,
          family: 'Arial',
          weight: 'bold'
        }
      },
      plugin: {
        initialLabel: true
      }
    }
  );
  
  // Su oluştur (görsel temsil) - Suyu dibinden başlat
  water = Matter.Bodies.rectangle(
    render.options.width / 2,
    render.options.height - 5 - (waterLevel.value * 10) / 2,
    containerWidth * 10 - 2, // Ölçeği büyüt (cm -> piksel)
    waterLevel.value * 10, // Ölçeği büyüt (cm -> piksel)
    {
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        group: 0,
        category: 0x0002,
        mask: 0xFFFFFFFF
      },
      render: { 
        fillStyle: 'rgba(0, 150, 255, 0.7)',
        opacity: 0.5
      }
    }
  );
  
  // Son su seviyesi işareti ve etiketi
  let finalWaterMarker = null;
  let finalWaterLabel = null;
  
  if (waterLevel.value > initialWaterLevel) {
    const finalWaterLevelY = render.options.height - 5 - waterLevel.value * 10;
    
    finalWaterMarker = Matter.Bodies.rectangle(
      render.options.width / 2 + (containerWidth * 10) / 2 + 15,
      finalWaterLevelY,
      30,
      3,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: '#2ecc71', // Yeşil
          strokeStyle: '#27ae60',
          lineWidth: 1
        },
        plugin: {
          finalMarker: true
        }
      }
    );
    
    finalWaterLabel = Matter.Bodies.rectangle(
      render.options.width / 2 + (containerWidth * 10) / 2 + 45,
      finalWaterLevelY,
      80,
      20,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: 'transparent',
          text: {
            content: `Son: ${waterLevel.value.toFixed(1)} cm`,
            color: '#2ecc71',
            size: 10,
            family: 'Arial',
            weight: 'bold'
          }
        },
        plugin: {
          finalLabel: true
        }
      }
    );
  }
  
  const bodiesToAdd = [container, leftWall, rightWall, bottom, water, initialWaterMarker, initialWaterLabel, ...measureLines];
  
  if (finalWaterMarker && finalWaterLabel) {
    bodiesToAdd.push(finalWaterMarker, finalWaterLabel);
  }
  
  Matter.World.add(world, bodiesToAdd);
}

// Suyu güncelle - suyu dibinden başlat
function updateWater() {
  if (!water) return;
  
  // Su seviyesi nesnelerini bul ve sil
  const bodies = Matter.Composite.allBodies(world);
  const markersToRemove = bodies.filter(body => 
    (body.plugin && (body.plugin.finalMarker || body.plugin.finalLabel))
  );
  
  if (markersToRemove.length > 0) {
    Matter.World.remove(world, markersToRemove);
  }
  
  Matter.World.remove(world, water);
  
  water = Matter.Bodies.rectangle(
    render.options.width / 2,
    render.options.height - 5 - (waterLevel.value * 10) / 2,
    containerWidth * 10 - 2, // Ölçeği büyüt (cm -> piksel)
    waterLevel.value * 10, // Ölçeği büyüt (cm -> piksel)
    {
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        group: 0,
        category: 0x0002,
        mask: 0xFFFFFFFF
      },
      render: { 
        fillStyle: 'rgba(0, 150, 255, 0.7)',
        opacity: 0.5
      }
    }
  );
  
  Matter.World.add(world, water);
  
  // Eğer su seviyesi başlangıç seviyesinden farklıysa ve hacim hesaplandıysa
  if (waterLevel.value > initialWaterLevel && calculatedVolume.value > 0) {
    const finalWaterLevelY = render.options.height - 5 - waterLevel.value * 10;
    
    // Son su seviyesi işaretleyicisi
    const finalWaterMarker = Matter.Bodies.rectangle(
      render.options.width / 2 + (containerWidth * 10) / 2 + 15,
      finalWaterLevelY,
      30,
      3,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: '#2ecc71', // Yeşil
          strokeStyle: '#27ae60',
          lineWidth: 1
        },
        plugin: {
          finalMarker: true
        }
      }
    );
    
    // Son su seviyesi etiketi
    const finalWaterLabel = Matter.Bodies.rectangle(
      render.options.width / 2 + (containerWidth * 10) / 2 + 45,
      finalWaterLevelY,
      80,
      20,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: 'transparent',
          text: {
            content: `Son: ${waterLevel.value.toFixed(1)} cm`,
            color: '#2ecc71',
            size: 10,
            family: 'Arial',
            weight: 'bold'
          }
        },
        plugin: {
          finalLabel: true
        }
      }
    );
    
    Matter.World.add(world, [finalWaterMarker, finalWaterLabel]);
  }
}

onMounted(() => {
  // Canvas boyutlarını ayarla - tam ekran genişliği kullanılıyor
  const canvasWidth = window.innerWidth - 20; // Kenar boşluklarını hesaba katmak için 20px düşürüyoruz
  const canvasHeight = 500;
  
  simulationCanvas.value.width = canvasWidth;
  simulationCanvas.value.height = canvasHeight;
  
  // Matter.js motorunu başlat - yerçekimini artırıyoruz
  engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: { x: 0, y: 0.98 }
  });
  world = engine.world;
  
  // Render oluştur
  render = Matter.Render.create({
    canvas: simulationCanvas.value,
    engine: engine,
    options: {
      width: canvasWidth,
      height: canvasHeight,
      wireframes: false,
      background: '#1a202c'  // Daha koyu arka plan
    }
  });
  
  // Runner oluştur
  runner = Matter.Runner.create();
  
  // Dünyayı kur
  setupWorld();
  
  // Matter.js'i başlat
  Matter.Render.run(render);
  Matter.Runner.run(runner, engine);
  
  // Çarpışma olayını dinle
  Matter.Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      
      // Taş suyla veya zemin ile temas halinde mi kontrol et
      if (stone && ((pair.bodyA === stone && pair.bodyB === water) || 
          (pair.bodyA === water && pair.bodyB === stone) ||
          (pair.bodyA === stone && pair.bodyB.position.y > render.options.height - 30) ||
          (pair.bodyB === stone && pair.bodyA.position.y > render.options.height - 30))) {
        
        // Sadece düşme işlemi sırasında kontrol et
        if (isDropping.value) {
          // Taş suya battı, hacmi hesapla (biraz gecikme ekle)
          setTimeout(() => {
            calculatedVolume.value = selectedStone.value.volume;
            
            // Suyun seviyesini güncelle
            const newWaterLevel = initialWaterLevel + (calculatedVolume.value / containerArea);
            waterLevel.value = newWaterLevel;
            
            // Suyun görünümünü güncelle
            updateWater();
            
            // İşlem tamamlandı
            isDropping.value = false;
          }, 1000);
        }
      }
    }
  });
  
  // Ekran boyutu değiştiğinde canvas'ı güncelle
  window.addEventListener('resize', handleResize);
});

function handleResize() {
  if (!simulationCanvas.value || !render) return;

  const newWidth = window.innerWidth - 20;
  simulationCanvas.value.width = newWidth;
  render.options.width = newWidth;
  Matter.Render.setPixelRatio(render, window.devicePixelRatio);
  resetSimulation();
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// Su seviyesi değiştiğinde suyun görünümünü güncelle
watch(waterLevel, () => {
  updateWater();
});
</script>
    
   
   