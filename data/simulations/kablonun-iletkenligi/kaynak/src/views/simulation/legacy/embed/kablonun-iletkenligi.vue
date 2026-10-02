<template>
  <div class="p-4 flex text-base w-full bg-gray-700 h-screen items-center justify-center">
    <div class="w-full">
      <!-- Simülasyon ve kontroller -->
      <div class="flex flex-col">
        <!-- Simülasyon alanı -->
        <div ref="simulationContainer" class="w-full relative">
          <!-- Simülasyon Canvas -->
          <canvas ref="canvas" class="w-full h-52"></canvas>
          
          <!-- Bilgi gösterimi -->
          <div class="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-lg text-white p-5  text-center">
            <div class="flex flex-col items-center justify-center">
              <span class="font-bold text-3xl tracking-wide text-cyan-300">{{ resistanceFormatted }}</span>
            </div>
          </div>
        </div>

        <!-- Kontroller -->
        <div class="w-full relative">
          <div class="w-full bg-gray-800 text-white p-4">
              <div class="space-y-1">
                <!-- İletken uzunluğu -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label class="text-slate-100 font-semibold">Uzunluk</label>
                    <span class="text-cyan-300 text-sm">{{ (length/1000).toFixed(1) }} km</span>
                  </div>
                  <input 
                    type="range" 
                    v-model.number="length" 
                    min="100" 
                    max="40000" 
                    step="200" 
                    class="w-full"
                  />
                </div>

                <!-- Kesit alanı -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label class="text-slate-100 font-semibold">Kesit Alanı</label>
                    <span class="text-cyan-300 text-sm">{{ area }} m²</span>
                  </div>
                  <input 
                    type="range" 
                    v-model.number="area" 
                    min="1" 
                    max="20" 
                    step="1" 
                    class="w-full"
                  />
                </div>

                <!-- İletken cinsi -->
                <div class="space-y-2">
                  <label class=" font-semibold block">İletken Cinsi</label>
                  <select 
                    v-model="selectedMaterial" 
                    class="w-full p-2 text-black  border-2 border-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                  >
                    <option v-for="(material, code) in materials" :key="code" :value="code">
                      {{ material.name }}
                    </option>
                  </select>
                </div>

                <!-- Sıfırlama butonu -->
                <button @click="resetSettings" 
                        v-if="isSettingsChanged"
                        class="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  Ayarları Sıfırla
                </button>
              </div>
            </div>


        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import Matter from 'matter-js';

// Referanslar
const canvas = ref(null);
const simulationContainer = ref(null);

// Ölçek faktörü: 1 piksel = 100 metre
const SCALE_FACTOR = 100; // Her piksel 100 metre temsil eder

// Parametreler - başlangıç değerlerini slider min değerleriyle uyumlu hale getiriyoruz
const length = ref(10000); // metre (min değer 100)
const area = ref(6); // m² (min değer 1)
const selectedMaterial = ref('copper');

// Malzeme özellikleri (ρ - Özdirenç, Ω·m)
const materials = {
  copper: { name: 'Bakır', resistivity: 1.68e-8, color: '#b87333' },
  silver: { name: 'Gümüş', resistivity: 1.59e-8, color: '#C0C0C0' },
  gold: { name: 'Altın', resistivity: 2.44e-8, color: '#FFD700' },
  aluminum: { name: 'Alüminyum', resistivity: 2.82e-8, color: '#a5a5a5' },
  tungsten: { name: 'Tungsten', resistivity: 5.6e-8, color: '#36454F' },
  iron: { name: 'Demir', resistivity: 1.0e-7, color: '#71797E' },
  lead: { name: 'Kurşun', resistivity: 2.2e-7, color: '#444f53' },
  nichrome: { name: 'Nikrom', resistivity: 1.5e-6, color: '#A79B82' },
  carbon: { name: 'Karbon', resistivity: 3.5e-5, color: '#333333' },
};

// Bilimsel gösterim için yardımcı fonksiyon
const formatResistivity = (value) => {
  if (value < 1e-7) {
    return value.toExponential(2) + ' Ω·m';
  } else {
    return value.toExponential(1) + ' Ω·m';
  }
};

// Ohm'dan mikro-ohm'a dönüşüm
const convertOhmsToMicroOhms = (ohms) => {
  return (ohms * 1000000).toFixed(0);
};

// Mikro-ohm'dan ohm'a dönüşüm
const convertMicroOhmsToOhms = (microOhms) => {
  return (microOhms / 1000000).toFixed(8);
};

// Hesaplanmış değerler
const resistance = computed(() => {
  // Number tipine çevirerek hesaplama yapalım
  const l = Number(length.value);
  const a = Number(area.value); 
  const resistivity = materials[selectedMaterial.value].resistivity;
  
  console.log(`Direnç hesaplanıyor: ρ=${resistivity}, L=${l}, A=${a}`);
  return resistivity * l / a;
});

const resistanceFormatted = computed(() => {
  // Değeri uygun birimle formatla (Ω, kΩ, MΩ)
  const r = resistance.value;
  if (r < 0.001) {
    return (r * 1000000).toFixed(2) + ' Ω';
  } else if (r < 1) {
    return (r * 1000).toFixed(2) + ' mΩ';
  } else if (r < 1000) {
    return r.toFixed(2) + ' Ω';
  } else if (r < 1000000) {
    return (r / 1000).toFixed(2) + ' kΩ';
  } else {
    return (r / 1000000).toFixed(2) + ' MΩ';
  }
});

// İletkenlik değeri (direncin tersi)
const conductivity = computed(() => {
  return 1 / resistance.value;
});

// İletkenlik yüzdesi (görsel gösterim için)
const conductivityPercentage = computed(() => {
  // Log ölçekte 1e-6 ile 1e6 Ohm aralığını 0-100 arası bir değere dönüştürür
  const r = resistance.value;
  if (r <= 0.001) return 100; // Çok düşük direnç
  if (r >= 1000000) return 0; // Çok yüksek direnç
  
  // Logaritmik ölçekte değeri 0-100 arasına map edelim
  const logR = Math.log10(r);
  const minLogR = Math.log10(0.001);
  const maxLogR = Math.log10(1000000);
  
  // Değeri ters çevir (düşük direnç = yüksek iletkenlik)
  const percentage = 100 - ((logR - minLogR) / (maxLogR - minLogR) * 100);
  return Math.round(percentage);
});

// İletkenlik açıklaması
const conductivityDescription = computed(() => {
  const percentage = conductivityPercentage.value;
  if (percentage > 90) return 'Mükemmel';
  if (percentage > 75) return 'Çok İyi';
  if (percentage > 50) return 'İyi';
  if (percentage > 25) return 'Orta';
  if (percentage > 10) return 'Zayıf';
  return 'Çok Zayıf';
});

// İletkenlik rengi
const conductivityColor = computed(() => {
  const percentage = conductivityPercentage.value;
  if (percentage > 90) return '#22c55e'; // Yeşil
  if (percentage > 75) return '#84cc16'; // Açık yeşil
  if (percentage > 50) return '#eab308'; // Sarı
  if (percentage > 25) return '#f97316'; // Turuncu
  if (percentage > 10) return '#ef4444'; // Kırmızı
  return '#7f1d1d'; // Koyu kırmızı
});

// İletkenlik metin rengi
const conductivityTextColor = computed(() => {
  const percentage = conductivityPercentage.value;
  if (percentage > 75) return 'text-green-300';
  if (percentage > 50) return 'text-yellow-300';
  if (percentage > 25) return 'text-orange-300';
  return 'text-red-300';
});

// İletkenlik metin rengi
const resistanceTextColor = computed(() => {
  const r = resistance.value;
  if (r < 0.01) return 'text-green-300';
  if (r < 1) return 'text-blue-300';
  if (r < 100) return 'text-yellow-300';
  if (r < 10000) return 'text-orange-300';
  return 'text-red-300';
});

// Matter.js nesneleri
let engine, render, runner, world;
let wireBody;
let containerWidth = 800;
let containerHeight = 600;

// Simülasyonu başlatma
onMounted(() => {
  initSimulation();
  
  // Pencere boyutu değişikliklerini dinle
  window.addEventListener('resize', resizeSimulation);
});

// Simülasyonu durdurma
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeSimulation);
  stopSimulation();
});

// Simülasyon boyutunu yeniden ayarlama
const resizeSimulation = () => {
  if (simulationContainer.value) {
    containerWidth = simulationContainer.value.clientWidth;
    containerHeight = simulationContainer.value.clientHeight;
    
    if (render) {
      render.options.width = containerWidth;
      render.options.height = containerHeight;
      render.canvas.width = containerWidth;
      render.canvas.height = containerHeight;
      updateWirePosition();
    }
  }
};

// Simülasyonu başlatma
const initSimulation = () => {
  try {
    // Matter.js bileşenlerini ayarla
    engine = Matter.Engine.create({
      positionIterations: 6,
      velocityIterations: 4,
      constraintIterations: 2,
      enableSleeping: false
    });
    
    world = engine.world;
    
    if (!simulationContainer.value) return;
    
    containerWidth = simulationContainer.value.clientWidth;
    containerHeight = simulationContainer.value.clientHeight;
    
    render = Matter.Render.create({
      canvas: canvas.value,
      engine: engine,
      options: {
        width: containerWidth,
        height: containerHeight,
        wireframes: false,
        background: '#1a202c',
        showAngleIndicator: false,
        pixelRatio: 1
      }
    });
    
    // Yerçekimini kapat
    engine.gravity.y = 0;
    
    // Duvarlar, tavan ve tabanı oluştur (arka planla aynı renkte)
    const walls = [
      Matter.Bodies.rectangle(containerWidth/2, 0, containerWidth, 20, { isStatic: true, render: { fillStyle: '#1a202c' } }), // üst
      Matter.Bodies.rectangle(containerWidth/2, containerHeight, containerWidth, 20, { isStatic: true, render: { fillStyle: '#1a202c' } }), // alt
      Matter.Bodies.rectangle(0, containerHeight/2, 20, containerHeight, { isStatic: true, render: { fillStyle: '#1a202c' } }), // sol
      Matter.Bodies.rectangle(containerWidth, containerHeight/2, 20, containerHeight, { isStatic: true, render: { fillStyle: '#1a202c' } }), // sağ
    ];
    
    // Duvarları dünyaya ekle
    Matter.World.add(world, walls);
    
    // İletken kabloyu oluştur
    updateWirePosition();
    
    // Motoru çalıştır
    runner = Matter.Runner.create({
      isFixed: true,
      delta: 16.67 // 60fps için sabit zaman adımı
    });
    
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);
  } catch (error) {
    console.error("Simülasyon başlatma hatası:", error);
  }
};

// İletken kabloyu güncelleme
const updateWirePosition = () => {
  try {
    // Eski teli kaldır (eğer varsa)
    if (wireBody) {
      Matter.World.remove(world, wireBody);
    }
    
    // Kablonun genişliğini ve rengini ayarla
    const maxWidth = Math.min(containerWidth * 0.8, 600); // Maksimum genişlik
    
    // Uzunluğu ölçeklendirme: 1 piksel = 100 metre
    // Gerçek piksel uzunluğu = gerçek uzunluk (metre) / SCALE_FACTOR
    const wireWidth = Math.min(Number(length.value) / SCALE_FACTOR, maxWidth);
    
    // Kesit alanını güncelle - yüksek değerlerden dolayı ölçeklendirme yapıyoruz
    const wireHeight = Math.max(20, Math.min(60, Number(area.value) * 3)); // Kesit alanına göre yükseklik (ölçeklendirme faktörü değiştirildi)
    const wireColor = materials[selectedMaterial.value].color;
    
    // Yeni kabloyu oluştur
    wireBody = Matter.Bodies.rectangle(
      containerWidth / 2,
      containerHeight / 2,
      wireWidth, // Ölçekli piksel uzunluğu
      wireHeight,
      {
        isStatic: true,
        render: {
          fillStyle: wireColor,
        }
      }
    );
    
    Matter.World.add(world, wireBody);
    
    // Ölçek çubuğunu göstermek için bir çizgi ekleyebiliriz
    // Bu, 100 metreyi göstermek için 1 piksel uzunluğunda bir çizgi olacak
    const scaleLineLength = 1; // 1 piksel = 100 metre
    const scaleLine = Matter.Bodies.rectangle(
      containerWidth / 8,
      containerHeight - 40,
      scaleLineLength,
      3,
      {
        isStatic: true,
        render: {
          fillStyle: '#ffffff',
        }
      }
    );
    
    // Matter.World.add(world, scaleLine);
    
  } catch (error) {
    console.error("Kablo güncelleme hatası:", error);
  }
};

// Parametreler değiştiğinde simülasyonu güncelle ve değerleri loglayalım
let updateTimeout;
watch([length, area, selectedMaterial], (newValues) => {
  console.log(`Değişiklik algılandı: Uzunluk=${newValues[0]}, Alan=${newValues[1]}, Malzeme=${newValues[2]}`);
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    updateWirePosition();
  }, 100);
});

// Simülasyonu durdurma
const stopSimulation = () => {
  if (runner) {
    Matter.Runner.stop(runner);
  }
  if (render) {
    Matter.Render.stop(render);
  }
};

// Yeni değişkenler ve metodlar
const showMobileSettings = ref(false);
const isDarkMode = ref(true);

// Başlangıç değerleri
const initialSettings = {
  length: 10000,
  area: 6,
  selectedMaterial: 'copper'
};

// Ayarların değişip değişmediğini kontrol et
const isSettingsChanged = computed(() => {
  return length.value !== initialSettings.length ||
         area.value !== initialSettings.area ||
         selectedMaterial.value !== initialSettings.selectedMaterial;
});

// Ayarları sıfırla
const resetSettings = () => {
  length.value = initialSettings.length;
  area.value = initialSettings.area;
  selectedMaterial.value = initialSettings.selectedMaterial;
};

// Arkaplan rengini değiştir
const changeBackground = (mode) => {
  isDarkMode.value = mode === 'dark';
  if (render) {
    render.options.background = isDarkMode.value ? '#1a202c' : '#f1f5f9';
    // Duvarların rengini de güncelle
    world.bodies.forEach(body => {
      if (body.isStatic && body !== wireBody) {
        body.render.fillStyle = isDarkMode.value ? '#1a202c' : '#f1f5f9';
      }
    });
  }
};
</script>


  
 
 