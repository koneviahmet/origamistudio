<template>
  <div class="w-full h-screen overflow-auto">
    <div class="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-center text-blue-700"></h1>
        <button 
          @click="resetPositions" 
          class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Simulasyon Alanı -->
      <div class="relative mb-10">
        <div class="relative h-16 bg-gradient-to-r from-blue-100 via-gray-300 to-blue-100 rounded-md mb-4 shadow-inner" ref="leverRef">
          <!-- Kaldıraç Çubuğu -->
          <div class="absolute top-0 h-full w-full border-b-2 border-gray-500"></div>
          
          <!-- Destek (Fulcrum) -->
          <div 
            class="absolute bottom-0 transform -translate-x-1/2 cursor-pointer transition-transform hover:scale-110"
            :style="{ left: `${supportPosition}%` }"
            @mousedown="startDrag('support', $event)"
            @touchstart="startDrag('support', $event)"
          >
            <div class="w-0 h-0 border-l-12 border-r-12 border-b-16 border-transparent border-b-blue-700 shadow-md"></div>
            <div class="h-3 w-6 bg-blue-700 rounded-sm shadow-md"></div>
          </div>
          
          <!-- Yük (Load) -->
          <div 
            class="absolute bottom-full transform -translate-x-1/2 cursor-pointer flex flex-col items-center transition-transform hover:scale-110"
            :style="{ left: `${loadPosition}%` }"
            @mousedown="startDrag('load', $event)"
            @touchstart="startDrag('load', $event)"
          >
            <div class="text-sm font-bold mb-1 text-center bg-red-100 px-2 py-0.5 rounded shadow-sm">10N</div>
            <div class="w-8 h-8 bg-red-500 shadow-md border-2 border-red-600"></div>
            <div class="w-1 h-6 bg-red-500 shadow-md"></div>
          </div>
          
          <!-- Kuvvet (Force) -->
          <div 
            class="absolute bottom-full transform -translate-x-1/2 cursor-pointer flex flex-col items-center transition-transform hover:scale-110"
            :style="{ left: `${forcePosition}%` }"
            @mousedown="startDrag('force', $event)"
            @touchstart="startDrag('force', $event)"
          >
            <div class="text-sm font-bold mb-1 text-center bg-green-100 px-2 py-0.5 rounded shadow-sm">{{ calculatedForce.toFixed(2) }}N</div>
            <div class="w-8 h-8 bg-green-500 rounded-full shadow-md border-2 border-green-600"></div>
            <div class="w-1 h-6 bg-green-500 shadow-md"></div>
          </div>
        </div>
        
        <!-- Ölçek -->
        <div class="flex justify-between text-xs font-medium text-gray-600 px-1">
          <span>0</span>
          <span>10</span>
          <span>20</span>
          <span>30</span>
          <span>40</span>
          <span>50</span>
          <span>60</span>
          <span>70</span>
          <span>80</span>
          <span>90</span>
          <span>100</span>
        </div>
      </div>
      
      <!-- Sonuçlar (Geliştirilmiş) -->
      <div class="mb-8">
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl shadow-md border border-indigo-200">
          
          <div class="grid grid-cols-2  md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex flex-col items-center">
              <div class="text-indigo-500 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-gray-600 text-sm">Kuvvet Kazancı</span>
              <span class="font-bold text-xl text-indigo-700">{{ forceGain.toFixed(2) }}x</span>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex flex-col items-center">
              <div class="text-red-500 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <span class="text-gray-600 text-sm">Yük Yolu</span>
              <span class="font-bold text-xl text-indigo-700">{{ loadPath.toFixed(2) }}</span>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex flex-col items-center">
              <div class="text-green-500 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <span class="text-gray-600 text-sm">Kuvvet Yolu</span>
              <span class="font-bold text-xl text-indigo-700">{{ supportPath.toFixed(2) }}</span>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex flex-col items-center">
              <div class="text-blue-500 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span class="text-gray-600 text-sm">Yoldan Kazanç</span>
              <span class="font-bold text-xl text-indigo-700">{{ pathGain.toFixed(2) }}x</span>
            </div>
          </div>
          
          <div class="mt-6 bg-blue-100 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
            <div class="flex flex-col">
              <span class="font-bold text-xs md:text-lg text-blue-800">Yükü Kaldırmak İçin Gerekli Minimum Kuvvet:</span>
              <span class="text-gray-600 text-xs md:text-sm">Destek ve kuvvet noktalarını hareket ettirerek gerekli kuvveti azaltabilirsiniz</span>
            </div>
            <div class="text-md md:text-2xl font-bold text-blue-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-300">
              {{ minimumForceRequired.toFixed(2) }}N
            </div>
          </div>
        </div>
      </div>
      
      <!-- Açıklama -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg shadow-md border border-blue-200">
        <h3 class="font-semibold text-xl mb-3 text-blue-800">Nasıl Kullanılır?</h3>
        <p class="text-gray-700 mb-3">Kaldıraç üzerindeki noktaları sürükleyerek konumlarını değiştirebilirsiniz. Kaldıraç prensibi gereği, destek noktasının konumuna göre kuvvet kazancı değişecektir.</p>
        <div class="grid md:grid-cols-3 gap-3 mt-4">
          <div class="bg-white p-3 rounded-md shadow-sm border border-blue-100">
            <div class="flex items-center mb-2">
              <div class="w-0 h-0 border-l-8 border-r-8 border-b-10 border-transparent border-b-blue-700 mr-2"></div>
              <span class="font-semibold text-blue-700">Destek Noktası</span>
            </div>
            <p class="text-sm text-gray-600">Kaldıracın dönme noktası</p>
          </div>
          <div class="bg-white p-3 rounded-md shadow-sm border border-blue-100">
            <div class="flex items-center mb-2">
              <div class="w-4 h-4 bg-red-500 mr-2"></div>
              <span class="font-semibold text-red-700">Yük (10N)</span>
            </div>
            <p class="text-sm text-gray-600">Kaldırılacak ağırlık</p>
          </div>
          <div class="bg-white p-3 rounded-md shadow-sm border border-blue-100">
            <div class="flex items-center mb-2">
              <div class="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span class="font-semibold text-green-700">Kuvvet Noktası</span>
            </div>
            <p class="text-sm text-gray-600">Kuvvet uygulama noktası</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Başlangıç pozisyonları
const initialPositions = {
  load: 30,
  force: 70,
  support: 50
};

// Pozisyonlar (0-100 arası yüzde olarak)
const loadPosition = ref(initialPositions.load);
const forcePosition = ref(initialPositions.force);
const supportPosition = ref(initialPositions.support);

// Sıfırlama fonksiyonu
function resetPositions() {
  loadPosition.value = initialPositions.load;
  forcePosition.value = initialPositions.force;
  supportPosition.value = initialPositions.support;
}

// Sürükleme işlemi için gerekli değişkenler
const isDragging = ref(false);
const currentDragItem = ref(null);
const leverRef = ref(null);

// Hesaplamalar
const loadForce = 10; // N (sabit)

// Kuvvet kazancı = Kuvvet kolu / Yük kolu (doğru kaldıraç prensibi)
const forceGain = computed(() => {
  // Yük kolunun uzunluğu (yük ile destek arası mesafe)
  const loadArm = Math.abs(loadPosition.value - supportPosition.value);
  
  // Kuvvet kolunun uzunluğu (kuvvet ile destek arası mesafe)
  const forceArm = Math.abs(forcePosition.value - supportPosition.value);
  
  // Kuvvet kolu / Yük kolu (kaldıraç prensibi)
  return forceArm / loadArm;
});

// Kuvvet = Yük / Kuvvet kazancı
const calculatedForce = computed(() => {
  return loadForce / forceGain.value;
});

// Minimum kuvvet gereksinimi (yükü kaldırmak için gereken en az kuvvet)
const minimumForceRequired = computed(() => {
  // Dengede tutmak için gereken kuvvet + çok küçük bir ek kuvvet
  // Pratikte, sürtünme ve diğer faktörler de hesaba katılmalıdır
  return calculatedForce.value + 0.01;
});

// Yük yolu
const loadPath = computed(() => {
  // Yükün destek noktasına olan uzaklığı
  return Math.abs(loadPosition.value - supportPosition.value);
});

// Destek yolu
const supportPath = computed(() => {
  // Kuvvetin destek noktasına olan uzaklığı
  return Math.abs(forcePosition.value - supportPosition.value);
});

// Yoldan kazanç
const pathGain = computed(() => {
  // Kuvvet yolu / Yük yolu
  return supportPath.value / loadPath.value;
});

// Sürükleme işlemi başlatma
function startDrag(item, e) {
  e.preventDefault(); // Varsayılan dokunma davranışını engelle
  isDragging.value = true;
  currentDragItem.value = item;
  
  // Mouse olayları
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  
  // Touch olayları
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
}

// Sürükleme işlemini takip etme
function onDrag(e) {
  e.preventDefault(); // Varsayılan dokunma davranışını engelle
  if (!isDragging.value || !leverRef.value) return;
  
  // Mouse veya touch pozisyonunu al
  const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
  
  // Kaldıraç çubuğunun konumu ve genişliği
  const rect = leverRef.value.getBoundingClientRect();
  const leverWidth = rect.width;
  const leverLeft = rect.left;
  
  // Pozisyonu 0-100 arasında yüzde olarak hesapla
  let newPosition = ((clientX - leverLeft) / leverWidth) * 100;
  
  // Sınırları kontrol et (0-100 arası)
  newPosition = Math.max(0, Math.min(100, newPosition));
  
  // İlgili öğenin pozisyonunu güncelle
  if (currentDragItem.value === 'load') {
    loadPosition.value = newPosition;
  } else if (currentDragItem.value === 'force') {
    forcePosition.value = newPosition;
  } else if (currentDragItem.value === 'support') {
    supportPosition.value = newPosition;
  }
}

// Sürükleme işlemini sonlandırma
function stopDrag(e) {
  if (e) e.preventDefault(); // Varsayılan dokunma davranışını engelle
  isDragging.value = false;
  currentDragItem.value = null;
  
  // Mouse olayları
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  
  // Touch olayları
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
}

// Bileşen bağlandığında olay dinleyicilerini kaldır
onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
});
</script>
  
<style scoped>
.border-b-12 {
  border-bottom-width: 12px;
}
.border-b-16 {
  border-bottom-width: 16px;
}
.border-l-12 {
  border-left-width: 12px;
}
.border-r-12 {
  border-right-width: 12px;
}
.border-b-10 {
  border-bottom-width: 10px;
}
</style>
  
 
 