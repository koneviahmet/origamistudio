<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
    <h1 class="text-center text-3xl font-bold text-indigo-800 mb-8">Bileşik Sınıflandırma</h1>
    
    <div v-if="gameActive" class="max-w-7xl mx-auto">
      <!-- Skor bilgisi -->
      <div class="text-center mb-6">
        <p class="text-lg font-medium text-gray-700">Puan: {{ score }}/{{ totalAttempts }}</p>
        <!-- Kullanım talimatı -->
        <div class="mt-2 flex items-center justify-center space-x-2 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm">Kartı sürükleyerek veya alanlara tıklayarak sınıflandırın</p>
        </div>
      </div>
      
      <!-- Ana oyun alanı - Mobil ve Desktop için farklı layout -->
      <div class="flex flex-col lg:flex-row lg:items-stretch lg:justify-between lg:space-x-6 min-h-[400px]">
        <!-- Organik alan - Sol -->
        <div 
          class="hidden lg:flex lg:w-1/3 bg-green-50/80 rounded-2xl border-2 border-green-400/50 items-center justify-center transition-all duration-300 hover:bg-green-100 hover:border-green-400 hover:shadow-lg group cursor-pointer"
          @click="checkAnswer('organic')"
        >
          <div class="text-center">
            <p class="text-2xl font-bold text-green-700/90">Organik</p>
            <p class="text-sm text-green-600/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Tıkla veya kartı buraya sürükle</p>
          </div>
        </div>
        
        <!-- Sürüklenebilir kart - Orta -->
        <div 
          ref="cardRef"
          class="bg-white rounded-2xl shadow-xl p-8 text-center transition-all duration-300 cursor-move touch-manipulation lg:w-1/3 min-h-[200px] flex flex-col items-center justify-center space-y-4 hover:shadow-2xl relative group"
          :style="cardStyle"
          :class="{'scale-102 shadow-2xl': isDragging}"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-800/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800">{{ currentCompound.name }}</h2>
          <p class="text-3xl font-mono text-indigo-600 mt-2">{{ currentCompound.formula }}</p>
        </div>
        
        <!-- İnorganik alan - Sağ -->
        <div 
          class="hidden lg:flex lg:w-1/3 bg-blue-50/80 rounded-2xl border-2 border-blue-400/50 items-center justify-center transition-all duration-300 hover:bg-blue-100 hover:border-blue-400 hover:shadow-lg group cursor-pointer"
          @click="checkAnswer('inorganic')"
        >
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-700/90">İnorganik</p>
            <p class="text-sm text-blue-600/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Tıkla veya kartı buraya sürükle</p>
          </div>
        </div>
        
        <!-- Mobil için sınıflandırma alanları -->
        <div class="flex justify-between mt-8 space-x-4 lg:hidden">
          <div 
            class="w-1/2 h-40 bg-green-50/80 rounded-2xl border-2 border-green-400/50 flex items-center justify-center transition-all duration-300 hover:bg-green-100 hover:border-green-400 active:bg-green-100 group cursor-pointer"
            @click="checkAnswer('organic')"
          >
            <div class="text-center">
              <p class="text-xl font-bold text-green-700/90">Organik</p>
              <p class="text-xs text-green-600/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Tıkla veya kartı buraya sürükle</p>
            </div>
          </div>
          
          <div 
            class="w-1/2 h-40 bg-blue-50/80 rounded-2xl border-2 border-blue-400/50 flex items-center justify-center transition-all duration-300 hover:bg-blue-100 hover:border-blue-400 active:bg-blue-100 group cursor-pointer"
            @click="checkAnswer('inorganic')"
          >
            <div class="text-center">
              <p class="text-xl font-bold text-blue-700/90">İnorganik</p>
              <p class="text-xs text-blue-600/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Tıkla veya kartı buraya sürükle</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sonuç mesajı -->
      <div v-if="resultMessage" :class="[
        'text-center p-5 rounded-2xl mt-8 transition-all duration-500 max-w-md mx-auto shadow-lg',
        isCorrect ? 'bg-green-50 text-green-800 border-2 border-green-400/50' : 'bg-red-50 text-red-800 border-2 border-red-400/50'
      ]">
        <p class="font-medium text-lg">{{ resultMessage }}</p>
      </div>
    </div>
    
    <!-- Sonuç ekranı -->
    <div v-else class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 class="text-2xl font-bold text-center text-indigo-800 mb-6">Oyun Bitti!</h2>
      <p class="text-center text-lg mb-8">Toplam Puan: {{ score }}/{{ compounds.length }}</p>
      <button 
        @click="resetGame" 
        class="w-full py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        Tekrar Oyna
      </button>
    </div>
    
    <!-- Doğru cevaplar tablosu -->
    <div v-if="correctAnswers.length > 0" class="max-w-2xl mx-auto mt-12">
      <h3 class="text-xl font-bold text-gray-800 mb-4 px-4">Doğru Cevaplar</h3>
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50/80 border-b">
            <tr>
              <th class="py-4 px-6 text-left text-sm font-medium text-gray-700">Formül</th>
              <th class="py-4 px-6 text-left text-sm font-medium text-gray-700">Ad</th>
              <th class="py-4 px-6 text-left text-sm font-medium text-gray-700">Tür</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(answer, index) in correctAnswers" :key="index" class="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors duration-150">
              <td class="py-4 px-6 text-sm font-mono font-medium text-gray-800">{{ answer.formula }}</td>
              <td class="py-4 px-6 text-sm text-gray-800">{{ answer.name }}</td>
              <td class="py-4 px-6 text-sm text-gray-800">{{ answer.type === 'organic' ? 'Organik' : 'İnorganik' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

// Genişletilmiş bileşik verileri
const compounds = [
  { name: 'Methan', formula: 'CH₄', type: 'organic' },
  { name: 'Sodyum Klorür', formula: 'NaCl', type: 'inorganic' },
  { name: 'Etanol', formula: 'C₂H₅OH', type: 'organic' },
  { name: 'Kalsiyum Karbonat', formula: 'CaCO₃', type: 'inorganic' },
  { name: 'Benzin', formula: 'C₈H₁₈', type: 'organic' },
  { name: 'Sülfirik Asit', formula: 'H₂SO₄', type: 'inorganic' },
  { name: 'Glikoz', formula: 'C₆H₁₂O₆', type: 'organic' },
  { name: 'Potasyum Nitrat', formula: 'KNO₃', type: 'inorganic' },
  { name: 'Asetik Asit', formula: 'CH₃COOH', type: 'organic' },
  { name: 'Demir(III) Oksit', formula: 'Fe₂O₃', type: 'inorganic' },
  { name: 'Propan', formula: 'C₃H₈', type: 'organic' },
  { name: 'Magnezyum Sülfat', formula: 'MgSO₄', type: 'inorganic' },
  { name: 'Asetilen', formula: 'C₂H₂', type: 'organic' },
  { name: 'Alüminyum Hidroksit', formula: 'Al(OH)₃', type: 'inorganic' },
  { name: 'Sitrik Asit', formula: 'C₆H₈O₇', type: 'organic' },
  { name: 'Amonyum Klorür', formula: 'NH₄Cl', type: 'inorganic' },
  { name: 'Üre', formula: 'CH₄N₂O', type: 'organic' },
  { name: 'Bakır(II) Sülfat', formula: 'CuSO₄', type: 'inorganic' },
  { name: 'Kolesterol', formula: 'C₂₇H₄₆O', type: 'organic' },
  { name: 'Fosforik Asit', formula: 'H₃PO₄', type: 'inorganic' },
  { name: 'Benzen', formula: 'C₆H₆', type: 'organic' },
  { name: 'Çinko Oksit', formula: 'ZnO', type: 'inorganic' },
  { name: 'Frukotoz', formula: 'C₆H₁₂O₆', type: 'organic' },
  { name: 'Kalsiyum Klorür', formula: 'CaCl₂', type: 'inorganic' },
  { name: 'Aspirin', formula: 'C₉H₈O₄', type: 'organic' },
  { name: 'Sodyum Hidroksit', formula: 'NaOH', type: 'inorganic' },
  { name: 'Laktik Asit', formula: 'C₃H₆O₃', type: 'organic' },
  { name: 'Potasyum Permanganat', formula: 'KMnO₄', type: 'inorganic' },
  { name: 'Adrenalin', formula: 'C₉H₁₃NO₃', type: 'organic' },
  { name: 'Hidroklorik Asit', formula: 'HCl', type: 'inorganic' }
];

// Durum değişkenleri
const currentIndex = ref(0);
const score = ref(0);
const totalAttempts = ref(0);
const gameActive = ref(true);
const resultMessage = ref('');
const isCorrect = ref(false);
const correctAnswers = ref([]);
const isDragging = ref(false);

// Kart pozisyonu
const cardPosition = reactive({
  x: 0,
  y: 0,
  startX: 0,
  startY: 0
});

const cardStyle = computed(() => {
  return {
    transform: `translate(${cardPosition.x}px, ${cardPosition.y}px)`,
    transition: isDragging.value ? 'transform 0.1s' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  };
});

const cardRef = ref(null);

// Şu anki bileşik
const currentCompound = computed(() => {
  return compounds[currentIndex.value];
});

// Sürükleme işlemleri
const startDrag = (event) => {
  isDragging.value = true;
  
  // Mouse veya dokunma olayını kontrol et
  const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
  const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;
  
  cardPosition.startX = clientX - cardPosition.x;
  cardPosition.startY = clientY - cardPosition.y;
  
  // Hareket işleyicilerini ekle
  if (event.type === 'touchstart') {
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);
  } else {
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
  }
  
  // Default davranışı engelle
  event.preventDefault();
};

const drag = (event) => {
  // Mouse veya dokunma olayını kontrol et
  const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
  const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;
  
  cardPosition.x = clientX - cardPosition.startX;
  cardPosition.y = clientY - cardPosition.startY;
};

const endDrag = () => {
  isDragging.value = false;
  
  // Mouse sürüklemeyi temizle
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', drag);
  document.removeEventListener('touchend', endDrag);
  
  // Kartın hangi tarafa sürüklendiğini kontrol et
  checkDropZone();
};

// Cevabı kontrol et
const checkAnswer = (userChoice) => {
  totalAttempts.value++;
  
  if (userChoice === currentCompound.value.type) {
    score.value++;
    isCorrect.value = true;
    resultMessage.value = 'Doğru!';
    
    // Doğru cevabı tabloya ekle
    correctAnswers.value.push({
      formula: currentCompound.value.formula,
      name: currentCompound.value.name,
      type: currentCompound.value.type
    });
    
    // 1 saniye sonra sonraki bileşiğe geç
    setTimeout(() => {
      nextCompound();
    }, 1000);
  } else {
    isCorrect.value = false;
    resultMessage.value = 'Yanlış! Doğru cevap: ' + 
      (currentCompound.value.type === 'organic' ? 'Organik' : 'İnorganik');
    
    // 1.5 saniye sonra sonuç mesajını temizle
    setTimeout(() => {
      resultMessage.value = '';
    }, 1500);
  }
};

// Sürükleme sonunda cevabı kontrol et
const checkDropZone = () => {
  const screenWidth = window.innerWidth;
  const threshold = screenWidth / 2;
  
  // Eğer kart sol tarafa sürüklenmişse (organik seçildi)
  const userChoice = cardPosition.x < -50 ? 'organic' : cardPosition.x > 50 ? 'inorganic' : null;
  
  if (userChoice) {
    checkAnswer(userChoice);
  }
  
  // Kartı merkeze getir
  resetCardPosition();
};

const resetCardPosition = () => {
  // Kart pozisyonunu animasyonla sıfırla
  cardPosition.x = 0;
  cardPosition.y = 0;
};

const nextCompound = () => {
  resultMessage.value = '';
  
  if (currentIndex.value < compounds.length - 1) {
    currentIndex.value++;
  } else {
    // Tüm bileşikler bitti, oyun sonu
    gameActive.value = false;
  }
};

const resetGame = () => {
  currentIndex.value = 0;
  score.value = 0;
  totalAttempts.value = 0;
  correctAnswers.value = [];
  resetCardPosition();
  gameActive.value = true;
  resultMessage.value = '';
  
  // Bileşikleri tekrar karıştır  
  shuffleCompounds(); 
};

const shuffleCompounds = () => {
  // Fisher-Yates shuffle algoritması
  for (let i = compounds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [compounds[i], compounds[j]] = [compounds[j], compounds[i]];
  }
};

// Bileşikleri karıştır
onMounted(() => {
  shuffleCompounds();
});
</script>