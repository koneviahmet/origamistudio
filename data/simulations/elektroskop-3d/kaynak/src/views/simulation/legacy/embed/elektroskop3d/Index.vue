<template>
  <div class="flex flex-col md:flex-row h-screen bg-gray-100 relative">

    <!-- Ayarlar butonu (Mobil için) -->
    <button 
      @click="showSettingsModal = !showSettingsModal" 
      class="md:hidden absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-md z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Ayarlar Modalı (Mobil için) -->
    <div v-if="showSettingsModal" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center" @click.self="showSettingsModal = false">
      <div class="bg-gray-800 text-white p-4 rounded-lg w-11/12 max-h-[66vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="showSettingsModal = false" class="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Ayarlar İçeriği -->
        <div class="flex flex-col items-center justify-center">
          <!-- Elektroskop Seçimi -->
          <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="typeof selectedStates.elektroskop == 'undefined'">
            <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" @click="selectedStates.elektroskop = 'n'">Elektroskop(n)</button>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" @click="selectedStates.elektroskop = '+'">Elektroskop(+)</button>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" @click="selectedStates.elektroskop = '-'">Elektroskop(-)</button>
          </div>

          <!-- Cisim Seçimi -->
          <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="!(typeof selectedStates.elektroskop == 'undefined') && (typeof selectedStates.cisim == 'undefined')">
            <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" @click="selectedStates.cisim = 'n'">Cisim(n)</button>
            <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" @click="selectedStates.cisim = '+'">Cisim(+)</button>
            <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" @click="selectedStates.cisim = '-'">Cisim(-)</button>
          </div>

          <!-- Temas Seçimi -->
          <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="!(typeof selectedStates.elektroskop == 'undefined') && !(typeof selectedStates.cisim == 'undefined') && (typeof selectedStates.temas == 'undefined')">
            <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors" @click="selectedStates.temas = 'y'">Yaklaştır</button>
            <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors" @click="selectedStates.temas = 'd'">Dokundur</button>
          </div>

          <!-- Topraklama Seçimi -->
          <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="!(typeof selectedStates.elektroskop == 'undefined') && !(typeof selectedStates.cisim == 'undefined') && !(typeof selectedStates.temas == 'undefined')">
            <button class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" @click="topraklaFNC" v-if="!state.topraklama">Toprakla</button>
          </div>

          <div v-if="messages" class="mb-4 p-2 bg-blue-100 rounded-lg text-gray-800 w-full">
            {{ messages }}
          </div>


        </div>
      </div>
    </div>

    <!-- Simülasyon Görseli -->
    <div class="flex items-start justify-center flex-grow p-4 relative">
      <Elektroskop3D :item="state"/>
    </div>

    <!-- Kontrol Paneli (Desktop için) -->
    <div class="bg-gray-800 text-white p-4 md:p-6 w-full md:w-1/3 hidden md:block overflow-y-auto">
      <div class="flex flex-col items-center justify-center">
        <!-- Elektroskop Seçimi -->
        <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="typeof selectedStates.elektroskop == 'undefined'">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" @click="selectedStates.elektroskop = 'n'">Elektroskop(n)</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" @click="selectedStates.elektroskop = '+'">Elektroskop(+)</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" @click="selectedStates.elektroskop = '-'">Elektroskop(-)</button>
        </div>

        <!-- Cisim Seçimi -->
        <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="!(typeof selectedStates.elektroskop == 'undefined') && (typeof selectedStates.cisim == 'undefined')">
          <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" @click="selectedStates.cisim = 'n'">Cisim(n)</button>
          <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" @click="selectedStates.cisim = '+'">Cisim(+)</button>
          <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" @click="selectedStates.cisim = '-'">Cisim(-)</button>
        </div>

        <!-- Temas Seçimi -->
        <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="!(typeof selectedStates.elektroskop == 'undefined') && !(typeof selectedStates.cisim == 'undefined') && (typeof selectedStates.temas == 'undefined')">
          <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors" @click="selectedStates.temas = 'y'">Yaklaştır</button>
          <button class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors" @click="selectedStates.temas = 'd'">Dokundur</button>
        </div>

        <!-- Topraklama Seçimi -->
        <div class="mb-4 flex flex-wrap justify-center gap-3 text-xs" v-if="!(typeof selectedStates.elektroskop == 'undefined') && !(typeof selectedStates.cisim == 'undefined') && !(typeof selectedStates.temas == 'undefined')">
          <button class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" @click="topraklaFNC" v-if="!state.topraklama">Toprakla</button>
        </div>

        <div v-if="messages" class="mb-4 p-2 bg-blue-100 rounded-lg text-gray-800 w-full">
          {{ messages }}
        </div>


      </div>
    </div>
  </div>
</template>
  
<script setup>
import Elektroskop3D from './Elektroskop3D.vue';
import { ref, onMounted, watch, computed, provide } from 'vue'

// Elektroskobun durumunu tutan ana state
const state = ref({
  topuz: 'n', 
  yaprak: 'n', 
  yaprakdurumu: 0, 
  cisim: 'n', 
  cisimdurumu: false, 
  topraklama: false
});

// Kullanıcı seçimlerini takip eden state
const selectedStates = ref({});

// Ayarlar modalını kontrol eden state
const showSettingsModal = ref(false);

// Kamera ayarları için event emitter
const cameraSettings = ref({ view: 'front' });

provide('cameraSettings', cameraSettings);

// Bilgi mesajları
const messages = ref("Elektroskobun durumunu seçiniz.");

// Farklı durumlar için mesaj tanımları
const allMessages = {
  'nnn': 'Elektroskobun durumunu seçiniz.',
  'nnd': 'Nötr bir elektroskoba nötr bir cisim dokunursa, elektroskop yapraklarının durumu değişmez. ',
  'n+d': 'Nötr bir elektroskoba pozitif bir cisim dokundurulursa, elektroskop pozitif yükle yüklenir ve yapraklar açılır. ',
  'n-d': 'Nötr bir elektroskoba negatif bir cisim dokundurulursa, elektroskop negatif yükle yüklenir ve yapraklar açılır. ',
  '++d': 'Pozitif yüklü bir elektroskoba pozitif bir cisim dokundurulursa, yükler eşit olduğu için yaprağın durumu değişmez. Cismin yükü elektroskobun yükünden fazla olsaydı yapraklar daha fazla açılırdır. Cismin yükü elektroskobun yükünden az olsaydı yapraklar biraz kapanırdı.',
  '+-d': 'Pozitif yüklü bir elektroskoba negatif bir cisim dokundurulursa, elektroskop nötr hale gelir ve yapraklar kapanır. Cisimde bulunan - yük miktarı elektroskoptan fazla olur ise, elektroskobun yaprakları önce kapanır daha sonra - yük olacak şekilde biraz açılır. Cisimde bulunan yük miktarı elektroskopta bulunan yük miktarından az olursa yapraklar + kalacak şekilde biraz kapanır.',
  '-nd': 'Negatif yüklü bir elektroskoba nötr bir cisim dokunursa, elektroskop yapraklarının yükü azalacağı için biraz kapanır.',
  '+nd': 'Pozitif yüklü bir elektroskoba nötr bir cisim dokunursa, elektroskop yapraklarının yükü azalacağı için biraz kapanır.',
  '--d': 'Negatif yüklü bir elektroskoba negatif bir cisim dokundurulursa, yaprağın durumu değişmez. Topuz negatif yükle yüklenir, yapraklar negatif yükle yüklenir. Cismin yükü elektroskobun yükünden fazla olsaydı yapraklar daha fazla açılırdı. Cismin yükü az olsaydı yapraklar biraz kapanırdı.',
  '-+d': 'Negatif yüklü bir elektroskoba pozitif bir cisim dokundurulursa, elektroskop nötr hale gelir ve yapraklar kapanır. Eğer cismin pozitif yükü fazla olursa yapraklar önce tamamen kapanır ve sonra pozitif yükle biraz açılır. Eğer cismin pozitif yükü az olursa yapraklar negatif kalacak şekilde biraz kapanır.',
  'nny': 'Nötr bir elektroskoba nötr bir cisim yaklaştırılırsa, elektroskop yapraklarının durumu değişmez. ',
  'n+y': 'Nötr bir elektroskoba pozitif bir cisim yaklaştırılırsa, elektroskop yaprakları + yüklü olacak şekilde açılır. Topuzda - yükle yüklenir.',
  'n-y': 'Nötr bir elektroskoba negatif bir cisim yaklaştırılırsa, elektroskop yaprakları - yüklü olacak şekilde açılır. Topuzda + yükle yüklenir.',
  '+ny': 'Pozitif yüklü bir elektroskoba nötr bir cisim yaklaştırılırsa, elektroskop yapraklarının durumu değişmez.',
  '-ny': 'Negatif yüklü bir elektroskoba nötr bir cisim yaklaştırılırsa, elektroskop yapraklarının durumu değişmez.',
  '++y': 'Pozitif yüklü bir elektroskoba pozitif bir cisim yaklaştırılırsa, elektroskop yapraklarının açıklığı artar.',
  '+-y': 'Pozitif yüklü bir elektroskoba negatif bir cisim yaklaştırılırsa, elektroskop yaprakları bir miktar kapanır. ',
  '-+y': 'Negatif yüklü bir elektroskoba pozitif bir cisim yaklaştırılırsa, elektroskop yaprakları bir miktar kapanır.',
  '--y': 'Negatif yüklü bir elektroskoba negatif bir cisim yaklaştırılırsa, elektroskop yapraklarının açıklığı artar. '
}

// Kamera görünümünü ayarla
function setCamera(view) {
  cameraSettings.value = { view };
}

// Ayarları sıfırla
function resetSettings() {
  state.value = {
    topuz: 'n', 
    yaprak: 'n', 
    yaprakdurumu: 0, 
    cisim: 'n', 
    cisimdurumu: false, 
    topraklama: false
  };
  selectedStates.value = {};
  messages.value = 'Elektroskobun durumunu seçiniz.';
  cameraSettings.value = { view: 'isometric' };
}

// Kullanıcı seçimlerini izleme
watch(selectedStates, cSelectedStates => {
  let arr = []
  if (cSelectedStates?.elektroskop) arr.push(cSelectedStates?.elektroskop)
  if (cSelectedStates?.cisim) arr.push(cSelectedStates?.cisim)
  if (cSelectedStates?.temas) arr.push(cSelectedStates?.temas)

  if (arr.length == 1) {
    messages.value = 'Lütfen cismin yükünü seçiniz.'
    state.value.topuz = cSelectedStates?.elektroskop    
    state.value.yaprak = cSelectedStates?.elektroskop 
    if (cSelectedStates?.elektroskop != 'n') state.value.yaprakdurumu = 2
  } else if (arr.length == 2) {
    messages.value = 'Lütfen cismin konumunu seçiniz.'
  } else if (arr.length == 3) {
    state.value.cisimdurumu = cSelectedStates?.temas
    state.value.cisim = cSelectedStates?.cisim
      
    // Mesajı her durumda güncelle
    messages.value = allMessages[arr.join("")];

    // Elektroskobun durumunu belirleme
    if (['nnd', 'nny'].includes(arr.join(""))) {
      // Nötr bir elektroskoba nötr bir cisim dokunur veya yaklaştırılırsa
      state.value.yaprakdurumu = 0; // Yapraklar değişmez
      state.value.topuz = 'n'; // Topuz nötr
      state.value.yaprak = 'n'; // Yapraklar nötr
    } else if (['n+d', 'n-d'].includes(arr.join(""))) {
      // Nötr bir elektroskoba yüklü bir cisim dokundurulursa
      state.value.yaprakdurumu = 2; // Yapraklar açılır
      state.value.topuz = arr[1]; // Topuz cismin yükü ile yüklenir
      state.value.yaprak = arr[1]; // Yapraklar cismin yükü ile yüklenir
    } else if (['n+y', 'n-y'].includes(arr.join(""))) {
      // Nötr bir elektroskoba yüklü bir cisim yaklaştırılırsa
      state.value.yaprakdurumu = 2; // Yapraklar açılır
      state.value.topuz = state.value.cisim == '+' ? '-' : '+'; // Topuzda zıt yük
      state.value.yaprak = arr[1]; // Yapraklar cisim ile aynı yükte
    } else if (['++d', '--d'].includes(arr.join(""))) {
      state.value.yaprakdurumu = 2;
      state.value.topuz = arr[0]; 
      state.value.yaprak = arr[0]; 
    } else if (['++y', '--y'].includes(arr.join(""))) {
      // Yüklü bir elektroskoba aynı yüklü bir cisim yaklaştırılırsa
      state.value.yaprakdurumu = 3; // Yapraklar daha fazla açılır
      state.value.topuz = arr[0]; // Topuz yükünü korur
      state.value.yaprak = arr[0]; // Yapraklar yükünü korur
    } else if (['+-d', '-+d'].includes(arr.join(""))) {
      // Zıt yüklü bir cisim dokundurulursa elektroskop nötr hale gelir
      state.value.yaprakdurumu = 0; // Yapraklar kapanır
      state.value.topuz = 'n'; // Topuz nötr hale gelir
      state.value.yaprak = 'n'; // Yapraklar nötr hale gelir
    } else if (['+-y', '-+y'].includes(arr.join(""))) {
      // Zıt yüklü bir cisim yaklaştırılırsa
      state.value.yaprakdurumu = 1; // Yapraklar azalır ama tamamen kapanmaz
      state.value.topuz = arr[0]; // Topuz yükünü korur
      state.value.yaprak = arr[0]; // Yapraklar yükünü korur
    } else if (['+nd', '-nd'].includes(arr.join(""))) {
      // Yüklü bir elektroskoba nötr bir cisim dokundurulursa
      state.value.yaprakdurumu = 1; // Yaprakların yükü azalır ama tamamen kapanmaz
      state.value.topuz = arr[0]; // Topuz yükünü kısmen korur
      state.value.yaprak = arr[0]; // Yapraklar yükünü kısmen korur
    } else if (['+ny', '-ny'].includes(arr.join(""))) {
      // Yüklü bir elektroskoba nötr bir cisim yaklaştırılırsa
      state.value.yaprakdurumu = 2; // Yaprakların durumu değişmez
      state.value.topuz = arr[0]; // Topuz yükünü korur
      state.value.yaprak = arr[0]; // Yapraklar yükünü korur
    }
  }
}, {deep: true})

// Topraklama işlemi
const topraklaFNC = () => {
  state.value.topraklama = true
  setTimeout(() => {
    state.value = {
      topuz: 'n', 
      yaprak: 'n', 
      yaprakdurumu: 0, 
      cisim: 'n', 
      cisimdurumu: false, 
      topraklama: false
    }
    selectedStates.value = {}
    messages.value = 'Elektroskobun durumunu seçiniz.'
  }, 2000);
}
</script>
  
