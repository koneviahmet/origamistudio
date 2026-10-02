<template>
  <div class="flex flex-col w-full h-full bg-gray-900 p-4">

    <!-- Ana İçerik: Simülasyon ve Kontrol Paneli -->
    <div class="flex flex-col md:flex-row gap-4 h-full">
      <!-- Simülasyon Alanı -->
      <div class="flex-grow h-96 md:h-auto relative border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
        <!-- Simülasyon Canvas'ı -->
        <canvas ref="simulationCanvas" class="w-full h-full"></canvas>
        
        <!-- Bilgi Göstergesi -->
        <div class="absolute top-2 left-2 bg-gray-800 bg-opacity-80 p-2 rounded text-sm text-gray-200">
          <div><span class="font-semibold">Odak Uzaklığı:</span> {{ Number(focusDistance).toFixed(1) }} cm</div>
          <div><span class="font-semibold">Kırılma İndisi:</span> {{ refractiveIndex.toFixed(2) }}</div>
          <div><span class="font-semibold">Mercek Tipi:</span> {{ lensType === 'convex' ? 'Dışbükey' : 'İçbükey' }}</div>
        </div>

        <!-- Mobil Ayarlar Butonu -->
        <button 
          @click="showMobileSettings = !showMobileSettings"
          class="md:hidden absolute top-2 right-2 bg-gray-800 p-2 rounded-lg text-white hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <!-- Kontrol Paneli -->
      <div 
        :class="[
          'w-full h-screen overflow-auto md:w-80 bg-gray-800 rounded-lg p-4 text-white transition-all duration-300',
          'fixed md:relative inset-0 z-50 md:z-auto transform md:transform-none',
          showMobileSettings ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'md:h-auto overflow-y-auto'
        ]"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Ayarlar</h2>
          <!-- Mobil Kapatma Butonu -->
          <button 
            @click="showMobileSettings = false"
            class="md:hidden text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Mercek Türü Seçimi -->
        <div class="mb-4">
          <label class="block mb-2">Mercek Türü</label>
          <div class="flex space-x-4">
            <button 
              @click="lensType = 'convex'" 
              :class="[
                'px-3 py-2 rounded-md', 
                lensType === 'convex' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              ]">
              İnce K.
            </button>
            <button 
              @click="lensType = 'concave'" 
              :class="[
                'px-3 py-2 rounded-md', 
                lensType === 'concave' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              ]">
              Kalın K
            </button>
          </div>
        </div>
        

        
        <!-- Odak Uzaklığı Ayarı -->
        <div class="mb-4">
          <label class="block mb-2">Odak Uzaklığı: {{ Number(focusDistance).toFixed(1) }} cm</label>
          <input 
            type="range" 
            min="2" 
            max="20" 
            step="0.5" 
            v-model.number="focusDistance" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs mt-1">
            <span>2 cm</span>
            <span>20 cm</span>
          </div>
        </div>

        
        <!-- Işık Kaynağı Ayarı -->
        <div class="mb-4">
          <label class="block mb-2">Işık Kaynağı Yüksekliği</label>
          <input 
            type="range" 
            min="-150" 
            max="150" 
            step="10" 
            v-model.number="lightSourceHeight" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Işık Kaynağı Türü -->
        <div class="mb-4">
          <label class="block mb-2">Işık Kaynağı Türü</label>
          <div class="flex space-x-4">
            <button 
              @click="lightSourceType = 'parallel'" 
              :class="[
                'px-3 py-2 rounded-md', 
                lightSourceType === 'parallel' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              ]">
              Paralel
            </button>
            <button 
              @click="lightSourceType = 'point'" 
              :class="[
                'px-3 py-2 rounded-md', 
                lightSourceType === 'point' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              ]">
              Nokta
            </button>
          </div>
        </div>
        
        <!-- Işın Sayısı Ayarı -->
        <div class="mb-4">
          <label class="block mb-2">Işın Sayısı: {{ rayCount }}</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="1" 
            v-model.number="rayCount" 
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <!-- Renk Seçimi -->
        <div class="mb-4">
          <label class="block mb-2">Işık Rengi</label>
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="color in ['red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'white']" 
              :key="color"
              @click="lightColor = color"
              :class="[
                'w-8 h-8 rounded-full border-2',
                `bg-${color === 'white' ? 'white' : color}-500`,
                lightColor === color ? 'border-white' : 'border-transparent'
              ]"
            ></button>
          </div>
        </div>

        <!-- Reset Butonu -->
        <button 
          @click="resetSettings"
          class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition-colors"
        >
          Ayarları Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import Matter from 'matter-js';

// Temel simülasyon değişkenleri
const simulationCanvas = ref(null);
const lensType = ref('convex');
const focusDistance = ref(10);
const lightSourceHeight = ref(-80);
const lightSourceType = ref('parallel');
const rayCount = ref(2);
const lightColor = ref('yellow');
const showMobileSettings = ref(false);

// Başlangıç değerlerini sakla
const initialSettings = {
  lensType: 'convex',
  focusDistance: 10,
  lightSourceHeight: 0,
  lightSourceType: 'parallel',
  rayCount: 3,
  lightColor: 'yellow'
};

// Ayarları sıfırla fonksiyonu
const resetSettings = () => {
  lensType.value = initialSettings.lensType;
  focusDistance.value = initialSettings.focusDistance;
  lightSourceHeight.value = initialSettings.lightSourceHeight;
  lightSourceType.value = initialSettings.lightSourceType;
  rayCount.value = initialSettings.rayCount;
  lightColor.value = initialSettings.lightColor;
};

// Mercek türüne göre kırılma indisi değerini hesapla (computed)
const refractiveIndex = computed(() => {
  return lensType.value === 'convex' ? 1.55 : 1.47; // Dışbükey: 1.55, İçbükey: 1.47
});

// Canvas boyutları ve ölçek faktörleri
let canvasWidth = 0;
let canvasHeight = 0;
let centerX = 0;
let centerY = 0;
const scale = 10; // 1 cm = 10 piksel

// Matter.js değişkenleri
let engine, render, runner;

// Animasyon değişkenleri
let animationFrameId = null;
let ctx;

// Lens geometrisi
const lensThickness = computed(() => {
  return lensType.value === 'convex' ? 20 : 12;
});

// Lens eğriliği (Odak noktasına göre)
const lensCurvature = computed(() => {
  // Odak uzaklığı küçüldükçe eğrilik artar
  const fd = Number(focusDistance.value);
  return lensType.value === 'convex' ? 
    Math.max(30, 80 - fd * 3) : 
    Math.min(-40, -100 + fd * 3);
});

// Merceğin kenar kalınlığı (içbükey mercek için)
const lensEdgeThickness = computed(() => {
  // İçbükey mercekler için kenar kalınlığı (odak uzaklığıyla orantılı)
  return lensType.value === 'concave' ? Math.max(40, 80 - Number(focusDistance.value) * 2) : 0;
});

// Simülasyonu başlat
onMounted(() => {
  initializeSimulation();
  
  // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
  window.addEventListener('resize', resizeCanvas);
});

// Simülasyonu temizle
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  stopSimulation();
});

// Parametreler değiştiğinde simülasyonu güncelle
watch([lensType, focusDistance, lightSourceHeight, lightSourceType, rayCount, lightColor], () => {
  if (ctx) {
    drawScene();
  }
});

// Canvas'ı hazırla ve boyutlandır
const initializeSimulation = () => {
  if (!simulationCanvas.value) return;
  
  // Canvas boyutlarını ayarla
  resizeCanvas();
  
  // Canvas context'ini al
  ctx = simulationCanvas.value.getContext('2d');
  
  // İlk çizimi yap
  drawScene();
};

// Canvas'ı yeniden boyutlandır
const resizeCanvas = () => {
  if (!simulationCanvas.value) return;
  
  const canvas = simulationCanvas.value;
  const container = canvas.parentElement;
  
  canvasWidth = container.clientWidth;
  canvasHeight = container.clientHeight;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  centerX = canvasWidth / 2;
  centerY = canvasHeight / 2;
  
  if (ctx) {
    drawScene();
  }
};

// Simülasyonu durdur
const stopSimulation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

// Sahneyi çiz
const drawScene = () => {
  if (!ctx) return;
  
  // Canvas'ı temizle
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Arka plan, tavan, taban ve duvarları çiz
  drawBackground();
  
  // Merceği çiz
  drawLens();
  
  // Odak noktasını (veya noktalarını) çiz
  drawFocalPoints();
  
  // Işınları çiz
  drawLightRays();
};

// Arka planı çiz (tavan, taban ve duvarlar dahil)
const drawBackground = () => {
  // Arka plan
  ctx.fillStyle = '#1f2937'; // bg-gray-800
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Tavan
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, canvasWidth, 10);
  
  // Taban
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, canvasHeight - 10, canvasWidth, 10);
  
  // Sol duvar
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, 10, canvasHeight);
  
  // Sağ duvar
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(canvasWidth - 10, 0, 10, canvasHeight);
  
  // Merkez çizgisi (yatay)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvasWidth, centerY);
  ctx.stroke();
  ctx.setLineDash([]);
};

// Merceği çiz
const drawLens = () => {
  const lensHeight = canvasHeight * 0.6; // Merceğin yüksekliği
  const thickness = lensThickness.value; // Merceğin orta noktadaki kalınlığı
  const curve = lensCurvature.value;     // Merceğin eğriliği
  
  ctx.fillStyle = 'rgba(120, 180, 255, 0.3)'; // Açık mavi, yarı saydam
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.7)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  
  if (lensType.value === 'convex') {
    // Dışbükey mercek (iki yanı dışa doğru eğimli)
    ctx.moveTo(centerX - thickness/2, centerY - lensHeight/2);
    ctx.quadraticCurveTo(
      centerX - thickness/2 - curve, 
      centerY, 
      centerX - thickness/2, 
      centerY + lensHeight/2
    );
    ctx.lineTo(centerX + thickness/2, centerY + lensHeight/2);
    ctx.quadraticCurveTo(
      centerX + thickness/2 + curve, 
      centerY, 
      centerX + thickness/2, 
      centerY - lensHeight/2
    );
    ctx.closePath();
  } else {
    // İçbükey mercek (kum saati şeklinde)
    const edgeThickness = lensEdgeThickness.value;
    const middleThickness = thickness;
    
    // Sol üst köşe
    ctx.moveTo(centerX - edgeThickness/2, centerY - lensHeight/2);
    
    // Sol kenara doğru eğrilik
    ctx.quadraticCurveTo(
      centerX - middleThickness/2 - curve,
      centerY, 
      centerX - edgeThickness/2, 
      centerY + lensHeight/2
    );
    
    // Alt kenar
    ctx.lineTo(centerX + edgeThickness/2, centerY + lensHeight/2);
    
    // Sağ kenara doğru eğrilik
    ctx.quadraticCurveTo(
      centerX + middleThickness/2 + curve,
      centerY, 
      centerX + edgeThickness/2, 
      centerY - lensHeight/2
    );
    
    ctx.closePath();
  }
  
  ctx.fill();
  ctx.stroke();
};

// Odak noktalarını çiz
const drawFocalPoints = () => {
  // Dışbükey merceklerde gerçek odak noktası, içbükey merceklerde sanal odak noktası
  const focalDistance = Number(focusDistance.value) * scale; // Piksel cinsinden odak uzaklığı
  
  ctx.fillStyle = lensType.value === 'convex' ? 'rgba(255, 200, 0, 0.8)' : 'rgba(0, 200, 255, 0.8)';
  
  // Mercek merkezinden odak noktasına uzaklık
  const distance = lensType.value === 'convex' ? focalDistance : -focalDistance;
  
  // Sol odak noktası
  ctx.beginPath();
  ctx.arc(centerX - distance, centerY, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Sağ odak noktası
  ctx.beginPath();
  ctx.arc(centerX + distance, centerY, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Odak çizgileri (dikey)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.setLineDash([3, 3]);
  
  // Sol odak çizgisi
  ctx.beginPath();
  ctx.moveTo(centerX - distance, centerY - canvasHeight/3);
  ctx.lineTo(centerX - distance, centerY + canvasHeight/3);
  ctx.stroke();
  
  // Sağ odak çizgisi
  ctx.beginPath();
  ctx.moveTo(centerX + distance, centerY - canvasHeight/3);
  ctx.lineTo(centerX + distance, centerY + canvasHeight/3);
  ctx.stroke();
  
  ctx.setLineDash([]);
};

// Işınları çiz
const drawLightRays = () => {
  // Işık rengini ayarla
  let rayColor;
  switch(lightColor.value) {
    case 'red': rayColor = '#ef4444'; break;
    case 'yellow': rayColor = '#eab308'; break;
    case 'green': rayColor = '#22c55e'; break;
    case 'blue': rayColor = '#3b82f6'; break;
    case 'indigo': rayColor = '#6366f1'; break;
    case 'purple': rayColor = '#a855f7'; break;
    case 'pink': rayColor = '#ec4899'; break;
    case 'white': rayColor = '#ffffff'; break;
    default: rayColor = '#eab308'; // Varsayılan sarı
  }
  
  // Işık kaynağını çiz
  ctx.fillStyle = rayColor;
  
  // Işınların başlangıç noktası (canvas'ın sol kenarından)
  const rayStartX = 30;
  
  // Işınlar arası mesafeyi azalt - rayCount arttıkça
  const rayCount_num = Number(rayCount.value);
  // Işınlar arası mesafeyi azalt - canvasHeight'ın daha küçük bir kısmını kapla
  const raySpacing = (canvasHeight * 0.6) / (rayCount_num + 1);
  
  // Snell yasasını uygula ve ışınları çiz
  for (let i = 1; i <= rayCount_num; i++) {
    let startY;
    
    if (lightSourceType.value === 'parallel') {
      // Paralel ışık kaynağı için ışınları canvas ortasına göre hizala
      // Işık kaynağı yüksekliğini dikkate al
      const heightOffset = Number(lightSourceHeight.value);
      startY = centerY - (rayCount_num * raySpacing / 2) + (i * raySpacing) + heightOffset;
    } else {
      // Nokta kaynağı
      startY = centerY + Number(lightSourceHeight.value);
    }
    
    // Işık kaynağını çiz
    ctx.beginPath();
    ctx.arc(rayStartX, startY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Işının mercekle kesişimini ve kırılma açısını hesapla
    drawRay(rayStartX, startY, centerX, centerY);
  }
};

// Tek bir ışını çiz ve kırılmasını hesapla
const drawRay = (startX, startY, lensX, lensY) => {
  const lensThick = lensThickness.value;
  const n = Number(refractiveIndex.value); // Kırılma indisi
  const focalDist = Number(focusDistance.value) * scale; // Piksel cinsinden odak uzaklığı
  
  // Mercek genişliği
  const lensHeight = canvasHeight * 0.6;
  
  // Işın merceğe ulaşmadan önceki çizgi
  ctx.beginPath();
  ctx.strokeStyle = `${getComputedColor(lightColor.value)}`;
  ctx.lineWidth = 2;
  
  // Işının başlangıç noktası
  ctx.moveTo(startX, startY);
  
  // Merceğin sol kenarına geçiş noktası
  const entryX = lensX - lensThick/2;
  
  // Mercek yüksekliğinin dışına çıkan ışınlar için kontrol
  if (startY < lensY - lensHeight/2 || startY > lensY + lensHeight/2) {
    // Mercek dışına düşen ışınlar düz geçer
    ctx.lineTo(canvasWidth - 30, startY);
    ctx.stroke();
    return;
  }
  
  let entryY;
  
  if (lightSourceType.value === 'parallel') {
    // Paralel ışık kaynağı için y değeri değişmez
    entryY = startY;
  } else {
    // Işık kaynağından mercek kenarına olan doğrultuda çiz
    const angle = Math.atan2(startY - lensY, startX - entryX);
    entryY = startY;
  }
  
  // İlk ışın doğrultusunu hesapla (uzantı için kullanılacak)
  const initialAngle = Math.atan2(entryY - startY, entryX - startX);
  
  // Merceğe giren ışını çiz
  ctx.lineTo(entryX, entryY);
  ctx.stroke();
  
  // Geometrik optik kurallarına göre kırılma hesapla
  
  // Gelen ışının merkez hattına göre açısı
  const incidentAngle = Math.atan2(entryY - lensY, entryX - lensX);
  
  // Snell yasasını kullanarak kırılma açısını hesapla
  // Kırılma indisini burada etkin bir şekilde kullan
  // Temel kırılma faktörü - refractiveIndex arttıkça kırılma artar
  const refractionFactor = (n - 1.0) / 0.5; // Normalize faktör
  
  // Merceğin odak uzaklığına göre çıkış açısını hesapla
  let exitAngle;
  
  if (lensType.value === 'convex') {
    // Dışbükey mercekler için
    // Odak noktasına göre kırılmayı hesapla
    if (Math.abs(entryY - lensY) < 5) {
      // Merkeze yakın ışınlar neredeyse düz geçer
      exitAngle = 0;
    } else {
      // Kenarlardan geçen ışınlar odak noktasına doğru kırılır
      const distanceFromCenter = Math.abs(entryY - lensY);
      // Kırılma indisini hesaba kat
      exitAngle = -Math.atan(distanceFromCenter / (focalDist / refractionFactor)) * (entryY > lensY ? 1 : -1);
    }
  } else {
    // İçbükey mercekler için
    // Odak noktasının uzantısına göre kırılmayı hesapla
    if (Math.abs(entryY - lensY) < 5) {
      // Merkeze yakın ışınlar neredeyse düz geçer
      exitAngle = 0;
    } else {
      // Kenarlardan geçen ışınlar odak noktasının uzantısından uzaklaşır
      const distanceFromCenter = Math.abs(entryY - lensY);
      // Kırılma indisini hesaba kat
      exitAngle = Math.atan(distanceFromCenter / (focalDist / refractionFactor)) * (entryY > lensY ? 1 : -1);
    }
  }
  
  // Merceğin sağ kenarındaki çıkış noktası
  const exitX = lensX + lensThick/2;
  let exitY = entryY;
  
  // Mercekten çıkan ışın
  if (Math.abs(exitAngle) > 0.001) {
    // Mercek içinde ışının yolu
    ctx.beginPath();
    ctx.strokeStyle = `${getComputedColor(lightColor.value)}70`; // Mercek içinde daha az parlak
    ctx.moveTo(entryX, entryY);
    
    // Mercek içindeki kırılmayı biraz modelleyelim
    const midX = lensX;
    const midY = entryY + (exitAngle * lensThick/4);
    
    // İç kırılmayı çiz
    ctx.lineTo(midX, midY);
    ctx.lineTo(exitX, exitY);
    ctx.stroke();
    
    // Mercekten çıkan ışın
    ctx.beginPath();
    ctx.strokeStyle = `${getComputedColor(lightColor.value)}`; // Orijinal parlaklık
    ctx.moveTo(exitX, exitY);
    
    // Kırılan ışının sonraki yolu
    const rayLength = 2000; // Yeterince uzun
    const endX = exitX + rayLength * Math.cos(exitAngle);
    const endY = exitY + rayLength * Math.sin(exitAngle);
    
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // İçbükey mercek için özel uzantı - Kırılan ışınların sol tarafta sanal kesişim noktasını gösterme
    if (lensType.value === 'concave') {
      ctx.beginPath();
      ctx.setLineDash([5, 3]); // Kesikli çizgi
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Beyaz, hafif yarı saydam
      ctx.lineWidth = 1; // Daha ince
      
      // Mercek sağ kenarından başla
      ctx.moveTo(exitX, exitY);
      
      // Kırılan ışının gerideki sanal uzantısını hesapla (ters yönde)
      const virtualExtensionLength = canvasWidth * 1.5;
      const virtualEndX = exitX - virtualExtensionLength * Math.cos(exitAngle);
      const virtualEndY = exitY - virtualExtensionLength * Math.sin(exitAngle);
      
      // Kırılan ışınların geriye doğru uzantılarını çiz
      ctx.lineTo(virtualEndX, virtualEndY);
      ctx.stroke();
      
      // Çizgi stilini normal haline getir
      ctx.setLineDash([]);
    } else {
      // Dışbükey mercek için orijinal doğrultudaki uzantı
      ctx.beginPath();
      ctx.setLineDash([5, 3]); // Kesikli çizgi
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Beyaz, hafif yarı saydam
      ctx.lineWidth = 1; // Daha ince
      
      // Mercekten çıkış noktasından başla
      ctx.moveTo(exitX, exitY);
      
      // Orijinal doğrultusunda ilerletilmiş uzantı
      const extensionLength = canvasWidth * 1.5;
      const extensionEndX = exitX + extensionLength * Math.cos(initialAngle);
      const extensionEndY = exitY + extensionLength * Math.sin(initialAngle);
      
      ctx.lineTo(extensionEndX, extensionEndY);
      ctx.stroke();
      
      // Çizgi stilini normal haline getir
      ctx.setLineDash([]);
    }
    
  } else {
    // Düz geçen ışınlar için
    ctx.beginPath();
    ctx.strokeStyle = `${getComputedColor(lightColor.value)}70`;
    ctx.moveTo(entryX, entryY);
    ctx.lineTo(exitX, exitY);
    ctx.stroke();
    
    // Mercekten çıkan ışın
    ctx.beginPath();
    ctx.strokeStyle = `${getComputedColor(lightColor.value)}`;
    ctx.moveTo(exitX, exitY);
    ctx.lineTo(canvasWidth - 30, exitY);
    ctx.stroke();
  }
  
  // Nokta kaynak için giriş ışınının uzantısı (geriye doğru)
  if (lightSourceType.value === 'point' && Math.abs(exitAngle) > 0.001) {
    ctx.beginPath();
    ctx.setLineDash([5, 3]); // Kesikli çizgi
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Beyaz, yarı saydam
    ctx.lineWidth = 1; // Daha ince
    
    // Işın giriş noktasından başla
    ctx.moveTo(entryX, entryY);
    
    // Işının mercekten geçmeseydi gideceği yol (sağa doğru uzatma)
    const backExtLength = canvasWidth;
    const backExtEndX = entryX + backExtLength * Math.cos(initialAngle);
    const backExtEndY = entryY + backExtLength * Math.sin(initialAngle);
    
    ctx.lineTo(backExtEndX, backExtEndY);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }
};

// Işık rengini hesapla
const getComputedColor = (colorName) => {
  switch(colorName) {
    case 'red': return '#ef4444';
    case 'yellow': return '#eab308';
    case 'green': return '#22c55e';
    case 'blue': return '#3b82f6';
    case 'indigo': return '#6366f1';
    case 'purple': return '#a855f7';
    case 'pink': return '#ec4899';
    case 'white': return '#ffffff';
    default: return '#eab308';
  }
};
</script>
    
   
   