<template>
  <div class="w-full h-screen p-4 bg-gradient-to-b from-gray-50 to-blue-50 overflow-auto">
    <div class="mx-auto bg-white p-5 sm:p-8 w-full h-full">
      <!-- Başlık ve Kontrol Butonları -->
      <header class="flex flex-col sm:flex-row justify-between items-center gap-5 mb-8">

        <div class="flex gap-3">
          <button 
            v-if="isPaused && !isEclipse"
            @click="startAnimation" 
            class="py-2.5 px-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
            Başlat
          </button>
          <button 
            v-if="isEclipse"
            @click="resumeAnimation" 
            class="py-2.5 px-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
            Devam Et
          </button>
          <button 
            @click="resetSimulation" 
            class="py-2.5 px-5 flex items-center gap-2 rounded-xl bg-white text-gray-700 font-medium shadow-md hover:shadow-lg border border-gray-200 transition-all duration-300 hover:translate-y-[-2px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            Sıfırla
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <!-- Ana Simülasyon Ekranı -->
          <div ref="canvasContainer" class="relative bg-gradient-to-b from-slate-950 to-blue-950 rounded-2xl overflow-hidden mb-6 w-full border border-blue-900/20 shadow-[0_0_35px_rgba(59,130,246,0.15)]" style="height: 65vh; min-height: 400px;">
            <!-- Tutulma Bildirimi -->
            <div 
              v-if="isEclipse" 
              class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-eclipse-notification text-2xs lg:text-base" 
            >
              {{ eclipseType === 'solar' ? 'GÜNEŞ TUTULMASI!' : 'AY TUTULMASI!' }}
            </div>
            
            <v-stage :config="stageConfig" ref="stage">
              <v-layer>
                <!-- Güneş -->
                <v-circle 
                  :config="{
                    x: sunPosition.x,
                    y: sunPosition.y,
                    radius: 35,
                    fill: '#FDB813',
                    shadowColor: '#FF8C00',
                    shadowBlur: 30,
                    shadowOpacity: 0.8
                  }"
                />

                <!-- Güneş ışınları (Güneş için korona) -->
                <v-star
                  :config="{
                    x: sunPosition.x,
                    y: sunPosition.y,
                    numPoints: 16,
                    innerRadius: 40,
                    outerRadius: 60,
                    fill: '#FDB813',
                    opacity: 0.4
                  }"
                />

                <!-- Dünya -->
                <v-circle 
                  :config="{
                    x: earthPosition.x,
                    y: earthPosition.y,
                    radius: 20,
                    fillPatternImage: earthImage,
                    fillPatternScale: { x: 0.4, y: 0.4 },
                    shadowColor: 'black',
                    shadowBlur: 10,
                    shadowOpacity: 0.5,
                    stroke: '#3498db',
                    strokeWidth: 3
                  }"
                />

                <!-- Ay -->
                <v-circle 
                  :config="{
                    x: moonPosition.x,
                    y: moonPosition.y,
                    radius: 12,
                    fill: eclipseType === 'lunar' && isEclipse ? '#CD5C5C' : '#FFFFFF',
                    shadowColor: 'white',
                    shadowBlur: 15,
                    shadowOpacity: 0.5,
                    stroke: '#AAAAAA',
                    strokeWidth: 2
                  }"
                />

                <!-- Dünya Gölgesi (Ay tutulması için) -->
                <v-ellipse 
                  v-if="shadowVisible"
                  :config="{
                    x: earthShadow.x,
                    y: earthShadow.y,
                    radiusX: earthShadow.width / 2,
                    radiusY: earthShadow.height / 2,
                    fill: 'black',
                    opacity: 0.7,
                    rotation: earthShadow.rotation
                  }"
                />
                
                <!-- Dünya Gölge Vurgusu (Ay tutulması için) -->
                <v-ellipse 
                  v-if="eclipseType === 'lunar' && shadowVisible"
                  :config="{
                    x: earthShadow.x,
                    y: earthShadow.y,
                    radiusX: earthShadow.width / 2,
                    radiusY: earthShadow.height / 2,
                    stroke: '#444444',
                    strokeWidth: 1,
                    opacity: 0.5,
                    rotation: earthShadow.rotation
                  }"
                />
              </v-layer>
            </v-stage>
            
            <!-- Simülasyon Etiketleri -->
            <div class="absolute bottom-4 left-4 flex gap-4 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <div class="flex items-center">
                <span class="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                <span class="text-white text-sm">Güneş</span>
              </div>
              <div class="flex items-center">
                <span class="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span class="text-white text-sm">Dünya</span>
              </div>
              <div class="flex items-center">
                <span class="inline-block w-3 h-3 bg-gray-200 rounded-full mr-2"></span>
                <span class="text-white text-sm">Ay</span>
              </div>
            </div>
          </div>


        </div>

        <div class="lg:col-span-1">
          <!-- Bilgi ve Kontrol Paneli -->
          <div class="flex flex-col space-y-6">
            <!-- Aktif Tutulma Bilgisi -->
            <div v-if="isEclipse" class="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-5 rounded-xl border border-blue-200">
              <h2 class="font-medium text-white mb-2">
                {{ eclipseType === 'solar' ? 'Güneş Tutulması' : 'Ay Tutulması' }} Gerçekleşiyor
              </h2>

              <p class="text-white text-sm">
                {{ eclipseType === 'solar' 
                  ? "Ay, Dünya ile Güneş arasına girerek Güneş'i geçici olarak kapattı." 
                  : "Dünya, Güneş ile Ay arasına girerek Ay'ın kızıl renge bürünmesine neden oldu." }}
              </p>
            </div>

            <!-- Tutulma Açıklamaları -->
            <div class="bg-white p-5 rounded-xl shadow-md mb-20">
              <h2 class="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-100">Tutulmalar Nasıl Oluşur?</h2>
              
              <div class="space-y-4">
                <div class="flex items-start">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-800">Güneş Tutulması</h3>
                    <p class="text-gray-600 text-sm mt-1">
                      Ay'ın Dünya ile Güneş arasından geçerek Güneş'i kapatması ile oluşur. Ay'ın gölgesi Dünya yüzeyine düşer.
                    </p>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-800">Ay Tutulması</h3>
                    <p class="text-gray-600 text-sm mt-1">
                      Dünya'nın Güneş ile Ay arasına girmesiyle oluşur. Dünya'nın gölgesi Ay'a düşer ve Ay kızıl renk alır.
                    </p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue';

// Simülasyon parametreleri
const simulationSpeed = ref(25); // Orta hızda başla
const shadowVisible = ref(false);
const isEclipse = ref(false);
const isPaused = ref(true); // Başlangıçta durdurulmuş olarak başla
const eclipseType = ref('none'); // 'solar', 'lunar', or 'none'
const tutulmaMetni = ref(''); // Tutulma metni için ref ekle

// Canvas boyutları
const canvasContainer = ref(null);
const stage = ref(null);
const stageConfig = reactive({
  width: 800,
  height: 500
});

// Gök cisimleri konumları
const sunPosition = reactive({ x: 600, y: 250 });
const earthPosition = reactive({ x: 400, y: 250 });
const moonPosition = reactive({ x: 400, y: 250 });
const earthShadow = reactive({ x: 0, y: 0, width: 0, height: 0, rotation: 0 });

// Animasyon parametreleri
let animationId = null;
let angle = 0;
let moonOrbitRadius = 0;

// Dünya görseli
const earthImage = ref(null);

// Canvas boyutlarını ayarla
const resizeCanvas = () => {
  if (canvasContainer.value) {
    stageConfig.width = canvasContainer.value.offsetWidth;
    stageConfig.height = canvasContainer.value.offsetHeight;
  }
};

// Dünya gölgesini güncelle (Ay tutulması için)
const updateEarthShadow = () => {
  // Dünya'dan Güneş'e doğru vektör (ters yön)
  const dx = earthPosition.x - sunPosition.x;
  const dy = earthPosition.y - sunPosition.y;
  const angleToSun = Math.atan2(dy, dx);
  
  // Gölgenin yönü Güneş'ten uzağa doğru
  const shadowDirection = {
    x: Math.cos(angleToSun),
    y: Math.sin(angleToSun)
  };
  
  // Dünya yarıçapı
  const earthRadius = 30;
  
  // Ay'ın konumunu hesapla
  const moonDistanceFromEarth = Math.sqrt(
    Math.pow(moonPosition.x - earthPosition.x, 2) + 
    Math.pow(moonPosition.y - earthPosition.y, 2)
  );
  
  // Gölge ofset (Dünya'nın kenarından başlar)
  const shadowOffsetX = shadowDirection.x * earthRadius * 1.2;
  const shadowOffsetY = shadowDirection.y * earthRadius * 1.2;
  
  // Gölge pozisyonu - Ay'ın tam üzerinde olacak şekilde ayarla
  earthShadow.x = moonPosition.x;
  earthShadow.y = moonPosition.y;
  
  // Gölge boyutu - Ay'ı kaplayacak şekilde
  earthShadow.width = 40; // Ay çapından biraz daha büyük
  earthShadow.height = 40; // Ay çapından biraz daha büyük
  earthShadow.rotation = angleToSun * (180 / Math.PI);
};

// Animasyon döngüsü
const animate = () => {
  if (isPaused.value) return;
  
  // Hız faktörü - üstel olarak artış sağla
  const speedFactor = Math.pow(simulationSpeed.value, 1.5) / 100;
  
  // Açıyı güncelle (Ters yön - saat yönünün tersine)
  angle -= 0.01 * speedFactor;
  if (angle <= 0) {
    angle = Math.PI * 2;
  }
  
  // Konumları güncelle
  updatePositions();
  
  // Bir sonraki kareyi çiz
  animationId = requestAnimationFrame(animate);
};

// Başlangıç ayarları
const initializeCanvas = () => {
  // Canvas boyutlarını ayarla
  resizeCanvas();
  
  const canvasWidth = stageConfig.width;
  const canvasHeight = stageConfig.height;
  
  // Güneş'i sola yerleştir
  sunPosition.x = canvasWidth * 0.15; // Güneş'i biraz daha sola al
  sunPosition.y = canvasHeight / 2;
  
  // Dünya'yı ortaya yerleştir
  earthPosition.x = canvasWidth * 0.6; // Dünya'yı sağa doğru kaydır
  earthPosition.y = canvasHeight / 2;
  
  // Ay yörünge yarıçapını belirle
  moonOrbitRadius = Math.min(canvasWidth, canvasHeight) * 0.15;
  
  // Ay'ı Dünya'nın tam altına yerleştir (90 derece açıyla)
  moonPosition.x = earthPosition.x;
  moonPosition.y = earthPosition.y + moonOrbitRadius;
  angle = Math.PI / 2; // 90 derece açı ile başlat
  
  // Gölgeyi gizle
  shadowVisible.value = false;
  
  // Başlangıçta orta hızda
  simulationSpeed.value = 25;
  
  // Başlangıçta tutulma olmasın
  isEclipse.value = false;
  eclipseType.value = 'none';
  
  // Başlangıçta durdurulmuş olarak başla
  isPaused.value = true;
};

// Simülasyonu sıfırla
const resetSimulation = () => {
  // Animasyonu durdur ve sıfırla
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Başlangıç açısını 90 derece olarak ayarla
  angle = Math.PI / 2;
  isEclipse.value = false;
  isPaused.value = true;
  eclipseType.value = 'none';
  shadowVisible.value = false;
  
  // Canvas pozisyonlarını ve boyutlarını yeniden ayarla
  initializeCanvas();
};

// Konumları güncelle
const updatePositions = () => {
  // Güneş sabit kalır
  
  // Dünya kendi yörüngesinde hareket eder (bu örnekte sabit)
  // Gerçek dünyada, Güneş etrafındaki dönüş burada hesaplanır
  
  // Ay, Dünya etrafında döner
  const moonAngle = angle;
  moonPosition.x = earthPosition.x + Math.cos(moonAngle) * moonOrbitRadius;
  moonPosition.y = earthPosition.y + Math.sin(moonAngle) * moonOrbitRadius;
  
  // Ay tutulması veya Güneş tutulması kontrolü - doğrusal hizalanma testi
  // Dünya merkezinden Güneş merkezine vektör
  const earthToSun = {
    x: sunPosition.x - earthPosition.x,
    y: sunPosition.y - earthPosition.y
  };
  
  // Dünya merkezinden Ay merkezine vektör
  const earthToMoon = {
    x: moonPosition.x - earthPosition.x,
    y: moonPosition.y - earthPosition.y
  };
  
  // Vektörleri normalleştir
  const lenEarthToSun = Math.sqrt(earthToSun.x * earthToSun.x + earthToSun.y * earthToSun.y);
  const normEarthToSun = {
    x: earthToSun.x / lenEarthToSun,
    y: earthToSun.y / lenEarthToSun
  };
  
  const lenEarthToMoon = Math.sqrt(earthToMoon.x * earthToMoon.x + earthToMoon.y * earthToMoon.y);
  const normEarthToMoon = {
    x: earthToMoon.x / lenEarthToMoon,
    y: earthToMoon.y / lenEarthToMoon
  };
  
  // Normalleştirilmiş vektörlerin dot product'ını hesapla
  const dotProduct = normEarthToSun.x * normEarthToMoon.x + normEarthToSun.y * normEarthToMoon.y;
  
  // dot product'ın mutlak değeri doğrusal hizalanma gösterir
  // 1'e ne kadar yakınsa, o kadar doğrusal hizalanma var demektir
  
  // Tam doğrusal hizalanma için threshold değeri (1.0 tam hizalanma)
  const alignmentThreshold = 0.999;
  
  // Güneş tutulması kontrolü: Ay, Güneş ve Dünya arasında ise
  // (Dünya->Ay ve Dünya->Güneş vektörleri aynı yönde)
  if (dotProduct > alignmentThreshold) {
    if (!isEclipse.value || eclipseType.value !== 'solar') {
      isEclipse.value = true;
      eclipseType.value = 'solar';
      isPaused.value = true;
      
      // Animasyonu durdur
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
    shadowVisible.value = false; // Güneş tutulmasında dünya gölgesi görünmez
  }
  // Ay tutulması kontrolü: Ay, Dünya'nın diğer tarafında ve Güneş'in tam zıt yönünde
  // (Dünya->Ay ve Dünya->Güneş vektörleri zıt yönde)
  else if (dotProduct < -alignmentThreshold) {
    if (!isEclipse.value || eclipseType.value !== 'lunar') {
      isEclipse.value = true;
      eclipseType.value = 'lunar';
      isPaused.value = true;
      
      // Animasyonu durdur
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      // Dünya gölgesini güncelle ve görünür yap
      updateEarthShadow();
      shadowVisible.value = true;
    }
  }
  else {
    if (isEclipse.value) {
      isEclipse.value = false;
      eclipseType.value = 'none';
      shadowVisible.value = false;
    }
    
    // Ay tutulması durumu değilse gölgeyi gizle
    shadowVisible.value = false;
  }
  
  // Ay tutulması durumunda gölgeyi güncelle
  if (eclipseType.value === 'lunar') {
    updateEarthShadow();
  }
};

// Animasyonu devam ettir
const resumeAnimation = () => {
  if (isPaused.value) {
    isPaused.value = false;
    animate();
  }
};

// Animasyonu başlat
const startAnimation = () => {
  isPaused.value = false;
  animate();
};

// Yaşam döngüsü hook'ları
onMounted(() => {
  resetSimulation(); 
  // Canvas boyutlarını ayarla
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  // Dünya görseli yükle
  const img = new Image();
  img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Earth_clip_art.svg/1024px-Earth_clip_art.svg.png';
  img.onload = () => {
    earthImage.value = img;
    
    // Canvas elemanlarını başlangıç konumlarına yerleştir
    initializeCanvas();
    
    // Konumları hemen güncelle ki gök cisimleri doğru pozisyonda görünsün
    // Güneş'i sola yerleştir
    const canvasWidth = stageConfig.width;
    const canvasHeight = stageConfig.height;
    
    sunPosition.x = canvasWidth * 0.15;
    sunPosition.y = canvasHeight / 2;
    
    // Dünya'yı ortaya yerleştir
    earthPosition.x = canvasWidth * 0.6;
    earthPosition.y = canvasHeight / 2;
    
    // Ay'ı Dünya'nın tam altına yerleştir
    moonPosition.x = earthPosition.x;
    moonPosition.y = earthPosition.y + moonOrbitRadius;
  };
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>
  
<style scoped>
/* Slider ve form elementleri */
.form-range {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(to right, #3b82f6, #6366f1);
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
}

.form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.form-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.form-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease;
}

.form-range::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* Tutulma bildirimi animasyonu */
@keyframes eclipse-notification {
  0%, 100% {
    transform: translate(-50%, 0) scale(1);
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
  }
  50% {
    transform: translate(-50%, 0) scale(1.05);
    box-shadow: 0 0 25px rgba(251, 191, 36, 0.8);
  }
}

.animate-eclipse-notification {
  animation: eclipse-notification 2s ease-in-out infinite;
}

/* Buton animasyonları */
button {
  transition: all 0.3s ease;
}

button:active {
  transform: translateY(2px);
}

/* Karanlık/aydınlık mod geçişleri */
@media (prefers-color-scheme: dark) {
  .from-gray-50 {
    --tw-gradient-from: #0f172a;
  }
  
  .to-blue-50 {
    --tw-gradient-to: #172554;
  }
}

/* Responsive ayarlamalar */
@media (max-width: 768px) {
  .gap-4 {
    gap: 0.75rem;
  }
  
  .text-sm {
    font-size: 0.8125rem;
  }
}

/* Genel iyileştirmeler */
.rounded-2xl {
  border-radius: 1rem;
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Daha fazla görsel kontrast için */
.text-transparent.bg-clip-text {
  background-clip: text;
  -webkit-background-clip: text;
}
</style>
  
 
 