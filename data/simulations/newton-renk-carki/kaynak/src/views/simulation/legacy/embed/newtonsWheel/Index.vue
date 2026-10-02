<template>
  <div class="w-full min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 relative" :style="{'--simulation-bg-color': backgroundColor}">

    <!-- Mobil Ayarlar Butonu -->
    <button @click="showSettings = !showSettings" 
            class="md:hidden absolute top-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg z-10">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Ana İçerik -->
    <div class="flex flex-col justify-center items-center w-full h-full">
      <!-- Dönüş Hızı Butonları (Üst kısımda) -->
      <div class="flex space-x-3 mb-6">
        <button @click="setSpeed(100)" :class="[speed === 100 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300', 'px-4 py-2 rounded-lg transition shadow-md']">Yavaş</button>
        <button @click="setSpeed(30)" :class="[speed === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300', 'px-4 py-2 rounded-lg transition shadow-md']">Orta</button>
        <button @click="setSpeed(10)" :class="[speed === 10 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300', 'px-4 py-2 rounded-lg transition shadow-md']">Hızlı</button>
        <button @click="setSpeed(2)" :class="[speed === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300', 'px-4 py-2 rounded-lg transition shadow-md']">Çok Hızlı</button>
      </div>

      <!-- Tekerlek Bölümü -->
      <div class="relative flex justify-center items-center p-4">
        <div class="relative wheel-container" :class="{'spinning': state.interval}">
          <svg id="wheel" class="w-full h-full max-w-[350px] max-h-[350px]" viewBox="-1 -1 2 2" xmlns="http://www.w3.org/2000/svg"
               :style="{filter: `blur(${blurLevel}px)`}">
            <!-- Newton'un orijinal 7 renk spektrumu - Tam eşit açılarla -->
            <defs>
              <filter id="blur-filter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" :stdDeviation="blurLevel" />
              </filter>
            </defs>
            <!-- 7 renk dilimi - Her biri tam 51.43 derece (360/7) -->
            <path d="M0,0 L1,0 A1,1 0 0,1 0.78,0.63 Z" fill="#FF0000"></path> <!-- Kırmızı -->
            <path d="M0,0 L0.78,0.63 A1,1 0 0,1 0.22,0.97 Z" fill="#FF7F00"></path> <!-- Turuncu -->
            <path d="M0,0 L0.22,0.97 A1,1 0 0,1 -0.5,0.87 Z" fill="#FFFF00"></path> <!-- Sarı -->
            <path d="M0,0 L-0.5,0.87 A1,1 0 0,1 -0.97,0.22 Z" fill="#00FF00"></path> <!-- Yeşil -->
            <path d="M0,0 L-0.97,0.22 A1,1 0 0,1 -0.78,-0.63 Z" fill="#0000FF"></path> <!-- Mavi -->
            <path d="M0,0 L-0.78,-0.63 A1,1 0 0,1 -0.22,-0.97 Z" fill="#4B0082"></path> <!-- İndigo -->
            <path d="M0,0 L-0.22,-0.97 A1,1 0 0,1 1,0 Z" fill="#8B00FF"></path> <!-- Mor (Violet) -->
          </svg>
          <!-- Beyaz arka plan, blur seviyesi arttıkça daha görünür olacak -->
          <div class="absolute inset-0 bg-white rounded-full opacity-0 transition-opacity" 
               :style="{opacity: state.interval ? Math.min(blurLevel/10, 0.8) : 0}"></div>
        </div>

        <!-- Animasyon Kontrol Butonları -->
        <div class="absolute  left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <button 
            @click="state.interval ? stopFNC() : startFNC()" 
            class="px-6 py-3 rounded-full text-white font-semibold transition-all transform hover:scale-105 focus:outline-none"
            :class="state.interval ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
          >
            {{ state.interval ? 'Durdur' : 'Çevir' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobil Ayarlar Modal -->
    <div v-if="showSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 text-white w-full max-w-sm p-6 rounded-xl shadow-xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="showSettings = false" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium mb-3">Dönüş Hızı</h3>
            <div class="grid grid-cols-2 gap-3">
              <button @click="setSpeed(100)" :class="[speed === 100 ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600', 'p-2 rounded-lg transition']">Yavaş</button>
              <button @click="setSpeed(30)" :class="[speed === 30 ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600', 'p-2 rounded-lg transition']">Orta</button>
              <button @click="setSpeed(10)" :class="[speed === 10 ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600', 'p-2 rounded-lg transition']">Hızlı</button>
              <button @click="setSpeed(2)" :class="[speed === 2 ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600', 'p-2 rounded-lg transition']">Çok Hızlı</button>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-medium mb-3">Arkaplan</h3>
            <div class="grid grid-cols-3 gap-2">
              <button @click="backgroundColor = '#f3f4f6'" class="w-full h-8 bg-[#f3f4f6] rounded border border-gray-600"></button>
              <button @click="backgroundColor = '#dbeafe'" class="w-full h-8 bg-[#dbeafe] rounded border border-gray-600"></button>
              <button @click="backgroundColor = '#d1fae5'" class="w-full h-8 bg-[#d1fae5] rounded border border-gray-600"></button>
              <button @click="backgroundColor = '#111827'" class="w-full h-8 bg-[#111827] rounded border border-gray-600"></button>
              <button @click="backgroundColor = '#1e3a8a'" class="w-full h-8 bg-[#1e3a8a] rounded border border-gray-600"></button>
              <button @click="backgroundColor = '#3b82f6'" class="w-full h-8 bg-[#3b82f6] rounded border border-gray-600"></button>
            </div>
          </div>
          
          <button 
            @click="resetSettings" 
            class="w-full py-2 mt-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition focus:outline-none"
          >
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted, watch } from "vue";

const rotate = ref(0);
const state = ref({ interval: false });
const speed = ref(10);
const showSettings = ref(false);
const backgroundColor = ref('#f3f4f6');
const blurLevel = ref(0); // Blur seviyesi
let interval = null;

// Hız etiketleri
const speedLabels = {
  100: 'Yavaş',
  30: 'Orta',
  10: 'Hızlı',
  2: 'Çok Hızlı'
};

// Hız ayarı
const setSpeed = (newSpeed) => {
  speed.value = newSpeed;
  
  // Hıza bağlı olarak blur seviyesini ayarla
  adjustBlurLevel();
  
  // Eğer animasyon çalışıyorsa, yeni hızla devam et
  if (state.value.interval) {
    stopFNC();
    startFNC();
  }
};

// Blur seviyesini hıza göre ayarla
const adjustBlurLevel = () => {
  // Hız azaldıkça (yani değer arttıkça) blur azalır
  // Hız arttıkça (yani değer azaldıkça) blur artar
  if (speed.value === 100) blurLevel.value = 0;      // Yavaş dönüşte blur yok
  else if (speed.value === 30) blurLevel.value = 3;  // Orta hızda az blur
  else if (speed.value === 10) blurLevel.value = 6;  // Hızlı dönüşte orta blur
  else if (speed.value === 2) blurLevel.value = 10;  // Çok hızlı dönüşte çok blur (beyaz görünüm)
};

// Animasyonu başlat
const startFNC = () => {
  state.value.interval = true;
  
  // Blur seviyesini hıza göre ayarla
  adjustBlurLevel();
  
  interval = setInterval(() => {
    rotate.value += 5; // Daha küçük artışlarla daha pürüzsüz animasyon
    if (rotate.value >= 360) {
      rotate.value = 0;
    }
    updateWheelRotation();
  }, speed.value);
};

// Animasyonu durdur
const stopFNC = () => {
  state.value.interval = false;
  clearInterval(interval);
  
  // Durunca blur'ı kaldır
  setTimeout(() => {
    if (!state.value.interval) {
      blurLevel.value = 0;
    }
  }, 300);
};

// Tekerlek rotasyonunu güncelle
const updateWheelRotation = () => {
  const svgElement = document.getElementById("wheel");
  if (svgElement) {
    svgElement.style.transform = `rotate(${rotate.value}deg)`;
  }
};

// Ayarları sıfırla
const resetSettings = () => {
  stopFNC();
  speed.value = 10;
  backgroundColor.value = '#f3f4f6';
  rotate.value = 0;
  blurLevel.value = 0;
  updateWheelRotation();
};

// Arkaplan rengini izle
watch(backgroundColor, (newColor) => {
  // Doğrudan style bağlama kullanıyoruz, CSS değişkenine gerek yok
});

// Komponent yüklendiğinde
onMounted(() => {
  updateWheelRotation();
});
</script>

<style scoped>
.wheel-container {
  width: min(350px, 100vw - 40px);
  height: min(350px, 100vw - 40px);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: filter 0.3s ease;
}

.spinning {
  animation: spin-effect 10s linear infinite;
}

@keyframes spin-effect {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .flex.space-x-3 {
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .flex.space-x-3 button {
    margin: 0 0.25rem;
  }
}
</style>