<template>
  <div class="relative w-full h-screen">
    <!-- Similasyon Canvas -->
    <div ref="threeContainer" class="w-full h-full bg-gray-900"></div>
    
    <!-- Kontrol Butonları -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
      <button 
        v-if="!isPlaying" 
        @click="startSimulation" 
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200">
        Başlat
      </button>
      <button 
        v-else 
        @click="stopSimulation" 
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200">
        Durdur
      </button>
    </div>
    
    <!-- Simülasyon Durum Paneli -->
    <div class="absolute top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 text-white p-3 rounded-lg shadow-lg z-10 max-w-md border border-gray-700">
      <h3 class="text-lg font-medium mb-2 text-center">Besin Zinciri Durumu</h3>
      <div class="flex flex-wrap justify-center gap-3 text-sm">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-green-600 mr-1"></div>
          <span>Bitkiler: {{ organismCounts.producer }}</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
          <span>Çekirgeler: {{ organismCounts.grasshopper }}</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-green-700 mr-1"></div>
          <span>Kurbağalar: {{ organismCounts.frog }}</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-yellow-700 mr-1"></div>
          <span>Yılanlar: {{ organismCounts.snake }}</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-purple-600 mr-1"></div>
          <span>Kartallar: {{ organismCounts.eagle }}</span>
        </div>
      </div>
      <div v-if="ecosystemStatus" class="mt-2 text-center text-sm" :class="ecosystemStatusColor">
        {{ ecosystemStatus }}
      </div>
    </div>
    
    <!-- Kamera Kontrolleri -->
    <div class="absolute bottom-4 left-4 flex flex-col space-y-2 z-10">
      <button @click="setCameraView('top')" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 border border-gray-700">
        Üstten Görünüm
      </button>
      <button @click="setCameraView('side')" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 border border-gray-700">
        Yandan Görünüm
      </button>
      <button @click="setCameraView('front')" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 border border-gray-700">
        Önden Görünüm
      </button>
      <button @click="setCameraView('isometric')" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 border border-gray-700">
        İzometrik Görünüm
      </button>
    </div>
    
    <!-- Mobil için ayarlar butonu -->
    <button 
      @click="toggleSettings" 
      class="md:hidden absolute top-4 left-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg z-10 transition-colors duration-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- Ayarlar Paneli (Desktop) -->
    <div class="hidden md:block absolute top-0 right-0 w-80 h-full bg-gray-900 text-white p-6 overflow-y-auto z-10 border-l border-gray-700 shadow-xl">
      <h2 class="text-xl font-bold mb-4">Besin Zinciri Ayarları</h2>
      
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Popülasyon Sayıları</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium">Bitkiler (Üreticiler)</label>
              <span class="text-xs bg-green-800 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.producer }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-1">Besin zincirinin temelini oluşturan üreticiler.</p>
            <input type="range" v-model="settings.producerCount" min="10" max="50" class="w-full accent-green-600" @change="updateSimulation">
            <span class="text-sm">{{ settings.producerCount }}</span>
          </div>
          
          <div>
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium">Çekirgeler (Otçullar)</label>
              <span class="text-xs bg-green-400 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.grasshopper }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-1">Bitkilerle beslenen birincil tüketiciler.</p>
            <input type="range" v-model="settings.grasshopperCount" min="5" max="30" class="w-full accent-green-400" @change="updateSimulation">
            <span class="text-sm">{{ settings.grasshopperCount }}</span>
          </div>
          
          <div>
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium">Kurbağalar (İkincil Tüketiciler)</label>
              <span class="text-xs bg-green-700 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.frog }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-1">Çekirgelerle beslenen avcılar.</p>
            <input type="range" v-model="settings.frogCount" min="2" max="20" class="w-full accent-green-700" @change="updateSimulation">
            <span class="text-sm">{{ settings.frogCount }}</span>
          </div>
          
          <div>
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium">Yılanlar (Üçüncül Tüketiciler)</label>
              <span class="text-xs bg-yellow-700 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.snake }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-1">Kurbağalarla beslenen yırtıcılar.</p>
            <input type="range" v-model="settings.snakeCount" min="1" max="10" class="w-full accent-yellow-700" @change="updateSimulation">
            <span class="text-sm">{{ settings.snakeCount }}</span>
          </div>
          
          <div>
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium">Kartallar (Zirve Avcılar)</label>
              <span class="text-xs bg-purple-800 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.eagle }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-1">Besin zincirinin en üstündeki avcılar.</p>
            <input type="range" v-model="settings.eagleCount" min="0" max="5" class="w-full accent-purple-600" @change="updateSimulation">
            <span class="text-sm">{{ settings.eagleCount }}</span>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Çevresel Etkiler</h3>
        <div class="space-y-2">
          <div>
            <label class="block text-sm">Kirlilik Seviyesi</label>
            <p class="text-xs text-gray-400 mb-1">Bitkilerin büyümesini ve canlıların sağlığını etkiler.</p>
            <input type="range" v-model="settings.pollutionLevel" min="0" max="100" class="w-full accent-gray-600" @change="updateSimulation">
            <span class="text-sm">{{ settings.pollutionLevel }}%</span>
          </div>
          <div>
            <label class="block text-sm">Avlanma Baskısı</label>
            <p class="text-xs text-gray-400 mb-1">İnsan kaynaklı avlanmanın ekosisteme etkisi.</p>
            <input type="range" v-model="settings.huntingRate" min="0" max="100" class="w-full accent-gray-600" @change="updateSimulation">
            <span class="text-sm">{{ settings.huntingRate }}%</span>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Simülasyon Ortamı</h3>
        <div class="space-y-2">
          <div>
            <label class="block text-sm mb-2">Arka Plan Rengi</label>
            <div class="flex space-x-3 mt-1">
              <button @click="setBackgroundColor('#87CEEB')" class="w-8 h-8 rounded-full bg-blue-300 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-blue-400': settings.backgroundColor === '#87CEEB', 'border-transparent': settings.backgroundColor !== '#87CEEB'}"></button>
              <button @click="setBackgroundColor('#228B22')" class="w-8 h-8 rounded-full bg-green-700 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-green-600': settings.backgroundColor === '#228B22', 'border-transparent': settings.backgroundColor !== '#228B22'}"></button>
              <button @click="setBackgroundColor('#4682B4')" class="w-8 h-8 rounded-full bg-blue-600 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-blue-500': settings.backgroundColor === '#4682B4', 'border-transparent': settings.backgroundColor !== '#4682B4'}"></button>
              <button @click="setBackgroundColor('#8B4513')" class="w-8 h-8 rounded-full bg-yellow-800 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-yellow-700': settings.backgroundColor === '#8B4513', 'border-transparent': settings.backgroundColor !== '#8B4513'}"></button>
              <button @click="setBackgroundColor('#2F4F4F')" class="w-8 h-8 rounded-full bg-gray-700 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-gray-600': settings.backgroundColor === '#2F4F4F', 'border-transparent': settings.backgroundColor !== '#2F4F4F'}"></button>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        v-if="isSettingsChanged" 
        @click="resetSettings" 
        class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg w-full transition-colors duration-200 shadow-lg">
        Ayarları Sıfırla
      </button>
    </div>
    
    <!-- Mobil için ayarlar modal -->
    <div v-if="showMobileSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20 backdrop-blur-sm">
      <div class="bg-gray-900 text-white p-6 rounded-lg w-11/12 max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Simülasyon Ayarları</h2>
          <button @click="showMobileSettings = false" class="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4">
          <h3 class="text-lg font-medium mb-2">Popülasyon Sayıları</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium">Bitkiler (Üreticiler)</label>
                <span class="text-xs bg-green-800 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.producer }}</span>
              </div>
              <p class="text-xs text-gray-400 mb-1">Besin zincirinin temelini oluşturan üreticiler.</p>
              <input type="range" v-model="settings.producerCount" min="10" max="50" class="w-full accent-green-600" @change="updateSimulation">
              <span class="text-sm">{{ settings.producerCount }}</span>
            </div>
            
            <div>
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium">Çekirgeler (Otçullar)</label>
                <span class="text-xs bg-green-400 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.grasshopper }}</span>
              </div>
              <p class="text-xs text-gray-400 mb-1">Bitkilerle beslenen birincil tüketiciler.</p>
              <input type="range" v-model="settings.grasshopperCount" min="5" max="30" class="w-full accent-green-400" @change="updateSimulation">
              <span class="text-sm">{{ settings.grasshopperCount }}</span>
            </div>
            
            <div>
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium">Kurbağalar (İkincil Tüketiciler)</label>
                <span class="text-xs bg-green-700 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.frog }}</span>
              </div>
              <p class="text-xs text-gray-400 mb-1">Çekirgelerle beslenen avcılar.</p>
              <input type="range" v-model="settings.frogCount" min="2" max="20" class="w-full accent-green-700" @change="updateSimulation">
              <span class="text-sm">{{ settings.frogCount }}</span>
            </div>
            
            <div>
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium">Yılanlar (Üçüncül Tüketiciler)</label>
                <span class="text-xs bg-yellow-700 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.snake }}</span>
              </div>
              <p class="text-xs text-gray-400 mb-1">Kurbağalarla beslenen yırtıcılar.</p>
              <input type="range" v-model="settings.snakeCount" min="1" max="10" class="w-full accent-yellow-700" @change="updateSimulation">
              <span class="text-sm">{{ settings.snakeCount }}</span>
            </div>
            
            <div>
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium">Kartallar (Zirve Avcılar)</label>
                <span class="text-xs bg-purple-800 px-2 py-0.5 rounded-full">Canlı: {{ organismCounts.eagle }}</span>
              </div>
              <p class="text-xs text-gray-400 mb-1">Besin zincirinin en üstündeki avcılar.</p>
              <input type="range" v-model="settings.eagleCount" min="0" max="5" class="w-full accent-purple-600" @change="updateSimulation">
              <span class="text-sm">{{ settings.eagleCount }}</span>
            </div>
          </div>
        </div>
        
        <div class="mb-4">
          <h3 class="text-lg font-medium mb-2">Çevresel Etkiler</h3>
          <div class="space-y-2">
            <div>
              <label class="block text-sm">Kirlilik Seviyesi</label>
              <p class="text-xs text-gray-400 mb-1">Bitkilerin büyümesini ve canlıların sağlığını etkiler.</p>
              <input type="range" v-model="settings.pollutionLevel" min="0" max="100" class="w-full accent-gray-600" @change="updateSimulation">
              <span class="text-sm">{{ settings.pollutionLevel }}%</span>
            </div>
            <div>
              <label class="block text-sm">Avlanma Baskısı</label>
              <p class="text-xs text-gray-400 mb-1">İnsan kaynaklı avlanmanın ekosisteme etkisi.</p>
              <input type="range" v-model="settings.huntingRate" min="0" max="100" class="w-full accent-gray-600" @change="updateSimulation">
              <span class="text-sm">{{ settings.huntingRate }}%</span>
            </div>
          </div>
        </div>
        
        <div class="mb-4">
          <h3 class="text-lg font-medium mb-2">Simülasyon Ortamı</h3>
          <div class="space-y-2">
            <div>
              <label class="block text-sm mb-2">Arka Plan Rengi</label>
              <div class="flex space-x-3 mt-1">
                <button @click="setBackgroundColor('#87CEEB')" class="w-8 h-8 rounded-full bg-blue-300 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-blue-400': settings.backgroundColor === '#87CEEB', 'border-transparent': settings.backgroundColor !== '#87CEEB'}"></button>
                <button @click="setBackgroundColor('#228B22')" class="w-8 h-8 rounded-full bg-green-700 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-green-600': settings.backgroundColor === '#228B22', 'border-transparent': settings.backgroundColor !== '#228B22'}"></button>
                <button @click="setBackgroundColor('#4682B4')" class="w-8 h-8 rounded-full bg-blue-600 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-blue-500': settings.backgroundColor === '#4682B4', 'border-transparent': settings.backgroundColor !== '#4682B4'}"></button>
                <button @click="setBackgroundColor('#8B4513')" class="w-8 h-8 rounded-full bg-yellow-800 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-yellow-700': settings.backgroundColor === '#8B4513', 'border-transparent': settings.backgroundColor !== '#8B4513'}"></button>
                <button @click="setBackgroundColor('#2F4F4F')" class="w-8 h-8 rounded-full bg-gray-700 border-2 transition-all duration-200" :class="{'border-white ring-2 ring-gray-600': settings.backgroundColor === '#2F4F4F', 'border-transparent': settings.backgroundColor !== '#2F4F4F'}"></button>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          v-if="isSettingsChanged" 
          @click="resetSettings" 
          class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg w-full transition-colors duration-200 shadow-lg">
          Ayarları Sıfırla
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 3D Ekosistem simülasyonu için gerekli değişken tanımlamaları
const threeContainer = ref(null);
let scene, camera, renderer, controls;
let organisms = [];
let animationFrameId = null;
const isPlaying = ref(false);
const showMobileSettings = ref(false);

// Canlı sayılarını takip etmek için reaktif nesne
const organismCounts = reactive({
  producer: 0,
  grasshopper: 0,
  frog: 0,
  snake: 0,
  eagle: 0
});

// Ekosistem durum mesajları
const ecosystemStatus = ref('');
const ecosystemStatusColor = ref('');

// Ekosistem durumunu güncelleyen fonksiyon
function updateEcosystemStatus() {
  const previousCounts = { ...organismCounts };
  
  // Canlı tipleri sayılarını güncelle
  organismCounts.producer = organisms.filter(o => o.type === 'producer' && o.energy > 0).length;
  organismCounts.grasshopper = organisms.filter(o => o.type === 'grasshopper' && o.energy > 0).length;
  organismCounts.frog = organisms.filter(o => o.type === 'frog' && o.energy > 0).length;
  organismCounts.snake = organisms.filter(o => o.type === 'snake' && o.energy > 0).length;
  organismCounts.eagle = organisms.filter(o => o.type === 'eagle' && o.energy > 0).length;
  
  // Durum mesajını belirle
  if (organismCounts.producer === 0) {
    ecosystemStatus.value = 'Kritik Durum: Tüm bitkiler tükendi! Besin zinciri çökebilir.';
    ecosystemStatusColor.value = 'text-red-500 font-bold';
  } else if (organismCounts.grasshopper === 0) {
    ecosystemStatus.value = 'Kritik Durum: Tüm çekirgeler tükendi! Kurbağalar aç kalabilir.';
    ecosystemStatusColor.value = 'text-red-500 font-bold';
  } else if (organismCounts.frog === 0) {
    ecosystemStatus.value = 'Uyarı: Tüm kurbağalar tükendi! Yılanlar tehlikede.';
    ecosystemStatusColor.value = 'text-yellow-500 font-bold';
  } else if (organismCounts.snake === 0) {
    ecosystemStatus.value = 'Uyarı: Tüm yılanlar tükendi! Kartallar besin bulamayabilir.';
    ecosystemStatusColor.value = 'text-yellow-500 font-bold';
  } else if (organismCounts.eagle === 0) {
    ecosystemStatus.value = 'Bilgi: Kartallar ekosistemden ayrıldı.';
    ecosystemStatusColor.value = 'text-blue-500';
  } else if (organismCounts.producer < previousCounts.producer) {
    ecosystemStatus.value = 'Bitki popülasyonu azalıyor! Çekirgeler aşırı otlanmaya neden olabilir.';
    ecosystemStatusColor.value = 'text-yellow-500';
  } else if (organismCounts.grasshopper < previousCounts.grasshopper) {
    ecosystemStatus.value = 'Çekirge popülasyonu azalıyor! Kurbağalar etkilenebilir.';
    ecosystemStatusColor.value = 'text-yellow-500';
  } else if (organismCounts.frog < previousCounts.frog) {
    ecosystemStatus.value = 'Kurbağa popülasyonu azalıyor! Yılanlar için besin sıkıntısı olabilir.';
    ecosystemStatusColor.value = 'text-yellow-500';
  } else if (organismCounts.snake < previousCounts.snake) {
    ecosystemStatus.value = 'Yılan popülasyonu azalıyor! Kartallar etkilenebilir.';
    ecosystemStatusColor.value = 'text-yellow-500';
  } else if (organismCounts.eagle < previousCounts.eagle) {
    ecosystemStatus.value = 'Kartal popülasyonu azalıyor!';
    ecosystemStatusColor.value = 'text-yellow-500';
  } else if (organismCounts.producer > previousCounts.producer) {
    ecosystemStatus.value = 'Bitki popülasyonu artıyor. Ekosistem sağlıklı görünüyor.';
    ecosystemStatusColor.value = 'text-green-500';
  } else if (organismCounts.grasshopper > previousCounts.grasshopper) {
    ecosystemStatus.value = 'Çekirge popülasyonu artıyor. Kurbağalar için bol besin var.';
    ecosystemStatusColor.value = 'text-green-500';
  } else if (organismCounts.frog > previousCounts.frog) {
    ecosystemStatus.value = 'Kurbağa popülasyonu artıyor. Yılanlar için bol besin var.';
    ecosystemStatusColor.value = 'text-green-500';
  } else if (organismCounts.snake > previousCounts.snake) {
    ecosystemStatus.value = 'Yılan popülasyonu artıyor. Kartallar için bol besin var.';
    ecosystemStatusColor.value = 'text-green-500';
  } else if (organismCounts.eagle > previousCounts.eagle) {
    ecosystemStatus.value = 'Kartal popülasyonu artıyor. Zirve avcılar güçlü.';
    ecosystemStatusColor.value = 'text-green-500';
  } else {
    ecosystemStatus.value = 'Ekosistem dengeli görünüyor. Besin zinciri sağlıklı.';
    ecosystemStatusColor.value = 'text-blue-500';
  }
}

// Simülasyon ayarları
const defaultSettings = {
  producerCount: 30,
  grasshopperCount: 20,
  frogCount: 10,
  snakeCount: 5,
  eagleCount: 2,
  pollutionLevel: 0,
  huntingRate: 0,
  backgroundColor: '#87CEEB'
};

// Reaktif ayar değişkenleri
const settings = reactive({ ...defaultSettings });

// Ayarların değişip değişmediğini kontrol et
const isSettingsChanged = computed(() => {
  return JSON.stringify(settings) !== JSON.stringify(defaultSettings);
});

// Organizma hızları
const speeds = {
  producer: 0.001,
  grasshopper: 0.06,
  frog: 0.04,
  snake: 0.03,
  eagle: 0.08
};

// Organizma boyutları
const sizes = {
  producer: 0.5,
  grasshopper: 0.4,
  frog: 0.6,
  snake: 0.8,
  eagle: 1.0
};

// Organizma renklerini güncelle
const colors = {
  producer: 0x2E8B57,
  grasshopper: 0x90EE90,
  frog: 0x228B22,
  snake: 0x8B4513,
  eagle: 0x4B0082
};

// Ayarları sıfırlama fonksiyonu
function resetSettings() {
  Object.assign(settings, defaultSettings);
  if (isPlaying.value) {
    stopSimulation();
  }
  updateSceneBackground();
  updateSimulation();
}

// Mobil ayarlar modalini aç/kapat
function toggleSettings() {
  showMobileSettings.value = !showMobileSettings.value;
}

// Arka plan rengini ayarlama
function setBackgroundColor(color) {
  settings.backgroundColor = color;
  updateSceneBackground();
}

// Arka plan rengini güncelleme
function updateSceneBackground() {
  if (scene) {
    scene.background = new THREE.Color(settings.backgroundColor);
    
    // Taban, tavan ve duvarları arka planla aynı renkte güncelle
    scene.children.forEach(object => {
      if (object.userData.type === 'boundary') {
        object.material.color = new THREE.Color(settings.backgroundColor);
      }
    });
  }
}

// 3D sahneyi oluşturma
function initScene() {
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(settings.backgroundColor);
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 20); // Kamerayı daha aşağıda konumlandır
  camera.lookAt(0, -5, 0); // Zemini hedefle
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeContainer.value.appendChild(renderer.domElement);
  
  // Orbit kontrolleri ekle - zemine odaklı
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, -5, 0); // Zemine doğru hedef
  
  // Işıklandırma ekle
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  
  // Ekosistem sınırlarını oluştur (Taban, tavan ve duvarlar)
  createBoundaries();
  
  // Organizmaları oluştur
  createOrganisms();
  
  // İlk render
  animate();
  
  // Pencere yeniden boyutlandırıldığında güncelleme
  window.addEventListener('resize', onWindowResize);
}

// Ekosistem sınırlarını oluştur
function createBoundaries() {
  const size = 20;
  const boundaryColor = new THREE.Color(settings.backgroundColor);
  const boundaryMaterial = new THREE.MeshStandardMaterial({ 
    color: boundaryColor,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  
  // Taban - daha belirgin bir zemin yüzeyi
  const floorGeometry = new THREE.PlaneGeometry(size, size, 30, 30);
  const floor = new THREE.Mesh(floorGeometry, boundaryMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -10; // Zemini aşağı kaydır
  floor.userData.type = 'boundary';
  
  // Çimen efekti için basit doku
  const floorTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFJgJc13wt1wAAAABJRU5ErkJggg==');
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(50, 50);
  floor.material.map = floorTexture;
  
  scene.add(floor);
  
  // Tavan
  const ceilingGeometry = new THREE.PlaneGeometry(size, size);
  const ceiling = new THREE.Mesh(ceilingGeometry, boundaryMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = size/2 - 5; // Tavanı aşağı çek biraz
  ceiling.userData.type = 'boundary';
  scene.add(ceiling);
  
  // Duvarlar
  const wallGeometry = new THREE.PlaneGeometry(size, size);
  
  // Ön duvar
  const frontWall = new THREE.Mesh(wallGeometry, boundaryMaterial);
  frontWall.position.set(0, 0, -size/2);
  frontWall.userData.type = 'boundary';
  scene.add(frontWall);
  
  // Arka duvar
  const backWall = new THREE.Mesh(wallGeometry, boundaryMaterial);
  backWall.rotation.y = Math.PI;
  backWall.position.set(0, 0, size/2);
  backWall.userData.type = 'boundary';
  scene.add(backWall);
  
  // Sol duvar
  const leftWall = new THREE.Mesh(wallGeometry, boundaryMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-size/2, 0, 0);
  leftWall.userData.type = 'boundary';
  scene.add(leftWall);
  
  // Sağ duvar
  const rightWall = new THREE.Mesh(wallGeometry, boundaryMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(size/2, 0, 0);
  rightWall.userData.type = 'boundary';
  scene.add(rightWall);
}

// Organizma oluşturma fonksiyonu
function createOrganisms() {
  // Mevcut organizmaları temizle
  organisms.forEach(organism => {
    scene.remove(organism.mesh);
  });
  organisms = [];
  
  // Bitkiler (üreticiler)
  createOrganismGroup('producer', settings.producerCount, colors.producer);
  
  // Çekirgeler (birincil tüketiciler)
  createOrganismGroup('grasshopper', settings.grasshopperCount, colors.grasshopper);
  
  // Kurbağalar (ikincil tüketiciler)
  createOrganismGroup('frog', settings.frogCount, colors.frog);
  
  // Yılanlar (üçüncül tüketiciler)
  createOrganismGroup('snake', settings.snakeCount, colors.snake);
  
  // Kartallar (zirve avcılar)
  createOrganismGroup('eagle', settings.eagleCount, colors.eagle);
  
  // Organizma sayılarını güncelle
  updateEcosystemStatus();
}

// Organizma grubu oluşturma
function createOrganismGroup(type, count, color) {
  for (let i = 0; i < count; i++) {
    const organism = createOrganism(type, color);
    organisms.push(organism);
    scene.add(organism.mesh);
  }
}

// Organizma oluşturma fonksiyonu
function createOrganism(type, color) {
  let mesh;
  const size = sizes[type];
  
  switch (type) {
    case 'producer':
      // Gerçekçi ağaç modeli
      const plant = new THREE.Group();
      
      // Gövde - kahverengi silindir
      const trunkGeom = new THREE.CylinderGeometry(size * 0.2, size * 0.3, size * 1.5, 8);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = size * 0.75; // Zeminde duracak şekilde yerleştir
      plant.add(trunk);
      
      // Yapraklar - yeşil küre
      const foliageGeom = new THREE.SphereGeometry(size * 0.8, 16, 16);
      const foliageMat = new THREE.MeshLambertMaterial({ color });
      const foliage = new THREE.Mesh(foliageGeom, foliageMat);
      foliage.position.y = size * 1.8; // Gövdenin üstünde
      plant.add(foliage);
      
      // Küçük dallar - daha gerçekçi görünüm için
      for (let i = 0; i < 5; i++) {
        const branchGeom = new THREE.CylinderGeometry(size * 0.05, size * 0.05, size * 0.5, 6);
        const branch = new THREE.Mesh(branchGeom, trunkMat);
        
        // Rastgele açıyla pozisyonlandır
        const angle = Math.random() * Math.PI * 2;
        const radius = size * 0.4;
        
        branch.position.set(
          Math.cos(angle) * radius,
          size * 1.4,
          Math.sin(angle) * radius
        );
        
        // Dalı dışa doğru eğ
        branch.rotation.z = (Math.random() - 0.5) * 1.5;
        branch.rotation.x = (Math.random() - 0.5) * 1.5;
        
        plant.add(branch);
      }
      
      mesh = plant;
      break;
      
    case 'grasshopper':
      // Çekirge modeli
      const grasshopper = new THREE.Group();
      
      // Gövde
      const bodyGeom = new THREE.CapsuleGeometry(size * 0.2, size * 0.4, 8, 8);
      const bodyMat = new THREE.MeshLambertMaterial({ color });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      grasshopper.add(body);
      
      // Bacaklar
      const legGeom = new THREE.CylinderGeometry(size * 0.02, size * 0.02, size * 0.3);
      for (let i = 0; i < 6; i++) {
        const leg = new THREE.Mesh(legGeom, bodyMat);
        const angle = (i / 6) * Math.PI * 2;
        leg.position.set(
          Math.cos(angle) * size * 0.2,
          -size * 0.1,
          Math.sin(angle) * size * 0.2
        );
        leg.rotation.x = Math.PI / 4;
        grasshopper.add(leg);
      }
      
      // Antenleri
      const antennaGeom = new THREE.CylinderGeometry(size * 0.01, size * 0.01, size * 0.3);
      for (let i = 0; i < 2; i++) {
        const antenna = new THREE.Mesh(antennaGeom, bodyMat);
        antenna.position.set(size * 0.1 * (i === 0 ? 1 : -1), size * 0.2, 0);
        antenna.rotation.z = Math.PI / 4 * (i === 0 ? 1 : -1);
        grasshopper.add(antenna);
      }
      
      mesh = grasshopper;
      break;
      
    case 'frog':
      // Kurbağa modeli
      const frog = new THREE.Group();
      
      // Gövde
      const frogBodyGeom = new THREE.SphereGeometry(size * 0.4, 16, 16);
      frogBodyGeom.scale(1.2, 0.8, 1);
      const frogBodyMat = new THREE.MeshLambertMaterial({ color });
      const frogBody = new THREE.Mesh(frogBodyGeom, frogBodyMat);
      frog.add(frogBody);
      
      // Gözler
      const eyeGeom = new THREE.SphereGeometry(size * 0.1, 8, 8);
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
      for (let i = 0; i < 2; i++) {
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.position.set(size * 0.2 * (i === 0 ? 1 : -1), size * 0.2, size * 0.3);
        frog.add(eye);
      }
      
      // Bacaklar
      const frogLegGeom = new THREE.CapsuleGeometry(size * 0.1, size * 0.3, 8, 8);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(frogLegGeom, frogBodyMat);
        leg.position.set(
          size * 0.3 * (i < 2 ? 1 : -1),
          -size * 0.2,
          size * 0.2 * (i % 2 === 0 ? 1 : -1)
        );
        leg.rotation.x = Math.PI / 4;
        frog.add(leg);
      }
      
      mesh = frog;
      break;
      
    case 'snake':
      // Yılan modeli
      const snake = new THREE.Group();
      
      // Gövde segmentleri
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const segmentGeom = new THREE.SphereGeometry(size * 0.15, 8, 8);
        const segment = new THREE.Mesh(segmentGeom, new THREE.MeshLambertMaterial({ color }));
        segment.position.z = -i * size * 0.25;
        snake.add(segment);
      }
      
      // Baş
      const headGeom = new THREE.ConeGeometry(size * 0.2, size * 0.4, 8);
      const head = new THREE.Mesh(headGeom, new THREE.MeshLambertMaterial({ color }));
      head.rotation.x = -Math.PI / 2;
      head.position.z = size * 0.2;
      snake.add(head);
      
      // Gözler
      const snakeEyeGeom = new THREE.SphereGeometry(size * 0.05, 8, 8);
      const snakeEyeMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
      for (let i = 0; i < 2; i++) {
        const eye = new THREE.Mesh(snakeEyeGeom, snakeEyeMat);
        eye.position.set(size * 0.1 * (i === 0 ? 1 : -1), size * 0.1, size * 0.3);
        snake.add(eye);
      }
      
      mesh = snake;
      break;
      
    case 'eagle':
      // Kartal modeli
      const eagle = new THREE.Group();
      
      // Gövde
      const eagleBodyGeom = new THREE.CapsuleGeometry(size * 0.3, size * 0.6, 8, 8);
      const eagleBodyMat = new THREE.MeshLambertMaterial({ color });
      const eagleBody = new THREE.Mesh(eagleBodyGeom, eagleBodyMat);
      eagle.add(eagleBody);
      
      // Kanatlar
      const wingGeom = new THREE.BoxGeometry(size * 1.2, size * 0.1, size * 0.4);
      wingGeom.translate(size * 0.6, 0, 0);
      for (let i = 0; i < 2; i++) {
        const wing = new THREE.Mesh(wingGeom, eagleBodyMat);
        wing.position.set(0, 0, 0);
        wing.rotation.y = Math.PI * (i === 0 ? 0 : 1);
        eagle.add(wing);
      }
      
      // Baş
      const eagleHeadGeom = new THREE.SphereGeometry(size * 0.2, 8, 8);
      const eagleHead = new THREE.Mesh(eagleHeadGeom, eagleBodyMat);
      eagleHead.position.set(0, size * 0.4, 0);
      eagle.add(eagleHead);
      
      // Gaga
      const beakGeom = new THREE.ConeGeometry(size * 0.1, size * 0.2, 8);
      const beak = new THREE.Mesh(beakGeom, new THREE.MeshLambertMaterial({ color: 0xFFD700 }));
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, size * 0.4, size * 0.2);
      eagle.add(beak);
      
      mesh = eagle;
      break;
  }
  
  // Rastgele pozisyon belirle (SADECE ZEMİNDE HAREKET) 
  const positionRange = 9;
  const yOffset = (type === 'producer') ? 0 : (type === 'decomposer' ? 0.1 : 0.2); // Canlıların yüksekliği
  
  mesh.position.x = (Math.random() - 0.5) * 2 * positionRange;
  mesh.position.y = -10 + yOffset; // Zeminle birleşecek şekilde yerleştir (-10 zemin yüksekliği)
  mesh.position.z = (Math.random() - 0.5) * 2 * positionRange;
  
  // Hareket için rastgele yön belirle (SADECE X-Z DÜZLEMİNDE)
  const direction = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    0, // Y yönünde hareket yok (zemin üzerinde)
    (Math.random() - 0.5) * 2
  ).normalize();
  
  return {
    type,
    mesh,
    direction,
    speed: speeds[type],
    energy: 100,
    age: 0,
    target: null,
    // Animasyon için ek özellikler
    bobPhase: Math.random() * Math.PI * 2, // Boing animasyonu için
    originalY: mesh.position.y, // Orijinal Y pozisyonu
    rotation: Math.random() * Math.PI * 2 // Rastgele başlangıç rotasyonu
  };
}

// Organizmaların etkileşimleri ve hareketleri
function updateOrganisms() {
  if (!isPlaying.value) return;
  
  organisms.forEach(organism => {
    moveOrganism(organism);
    
    switch (organism.type) {
      case 'producer':
        // Bitkiler fotosentez yapar
        if (organism.energy < 100) {
          organism.energy += 0.1;
        }
        if (settings.pollutionLevel > 0) {
          organism.energy -= 0.001 * settings.pollutionLevel;
        }
        break;
        
      case 'grasshopper':
        // Çekirgeler bitkileri yer
        organism.energy -= 0.05;
        if (!organism.target || organism.target.energy <= 0) {
          organism.target = findNearestOrganism(organism, 'producer');
        }
        if (organism.target) {
          moveTowardsTarget(organism);
          const distance = organism.mesh.position.distanceTo(organism.target.mesh.position);
          if (distance < sizes.producer + sizes.grasshopper) {
            organism.energy += 15;
            organism.target.energy -= 20;
            organism.target = null;
          }
        }
        break;
        
      case 'frog':
        // Kurbağalar çekirgeleri yer
        organism.energy -= 0.06;
        if (!organism.target || organism.target.energy <= 0) {
          organism.target = findNearestOrganism(organism, 'grasshopper');
        }
        if (organism.target) {
          moveTowardsTarget(organism);
          const distance = organism.mesh.position.distanceTo(organism.target.mesh.position);
          if (distance < sizes.grasshopper + sizes.frog) {
            organism.energy += 20;
            organism.target.energy -= 30;
            organism.target = null;
          }
        }
        break;
        
      case 'snake':
        // Yılanlar kurbağaları yer
        organism.energy -= 0.07;
        if (!organism.target || organism.target.energy <= 0) {
          organism.target = findNearestOrganism(organism, 'frog');
        }
        if (organism.target) {
          moveTowardsTarget(organism);
          const distance = organism.mesh.position.distanceTo(organism.target.mesh.position);
          if (distance < sizes.frog + sizes.snake) {
            organism.energy += 25;
            organism.target.energy -= 40;
            organism.target = null;
          }
        }
        break;
        
      case 'eagle':
        // Kartallar yılanları yer
        organism.energy -= 0.08;
        if (!organism.target || organism.target.energy <= 0) {
          organism.target = findNearestOrganism(organism, 'snake');
        }
        if (organism.target) {
          moveTowardsTarget(organism);
          const distance = organism.mesh.position.distanceTo(organism.target.mesh.position);
          if (distance < sizes.snake + sizes.eagle) {
            organism.energy += 30;
            organism.target.energy -= 50;
            organism.target = null;
          }
        }
        break;
    }
    
    // Enerji kontrolü
    if (organism.energy <= 0) {
      // Organizma öldü, şeffaflaştır
      organism.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = 0.3;
          child.material.transparent = true;
        }
      });
    } else {
      // Canlı organizmanın ölçeğini enerji seviyesine göre ayarla
      const energyScale = 0.7 + (organism.energy / 200);
      organism.mesh.scale.set(energyScale, energyScale, energyScale);
      
      // Materyalleri opaklık için güncelle
      organism.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = 1;
          child.material.transparent = false;
        }
      });
    }
  });
  
  // Her 50 karede bir ekosistem durumunu güncelle (performans için)
  if (Math.random() < 0.02) {
    updateEcosystemStatus();
  }
}

// Organizma hareketi
function moveOrganism(organism) {
  if (organism.energy <= 0) return;
  
  const boxSize = 19;
  const position = organism.mesh.position;
  
  // Zamanla değişen animasyon faktörü (zıplama, salınım vb için)
  const time = Date.now() * 0.001;
  const bobSpeed = 2;
  
  // Hareket yönünde döndür
  if (organism.direction.length() > 0.1) {
    // Dönme açısını hesapla (x-z düzleminde)
    const targetRotation = Math.atan2(organism.direction.x, organism.direction.z);
    
    // Yavaşça döndür
    organism.rotation = organism.rotation * 0.95 + targetRotation * 0.05;
    organism.mesh.rotation.y = organism.rotation;
  }
  
  // Organizmanın tipine göre farklı hareket ve animasyon
  switch (organism.type) {
    case 'producer':
      // Bitkiler neredeyse hareketsiz, sadece hafif bir rüzgar etkisi
      const windFactor = Math.sin(time + organism.bobPhase) * 0.02;
      organism.mesh.rotation.z = windFactor;
      break;
      
    case 'grasshopper':
      // Çekirge gibi zıplayan hareket
      if (organism.target) {
        // Avına doğru hızlı hareket (hedef varsa)
        const bounce = Math.abs(Math.sin((time + organism.bobPhase) * 8)) * 0.2;
        position.y = organism.originalY + bounce;
        
        // Hareket yönüne doğru hafif eğilme
        organism.mesh.rotation.x = bounce * 0.5;
      } else {
        // Normal hareket (hedef yoksa daha yavaş zıplama)
        const bounce = Math.abs(Math.sin((time + organism.bobPhase) * 3)) * 0.1;
        position.y = organism.originalY + bounce;
      }
      break;
      
    case 'frog':
      // Kurbağa gibi zıplayan hareket
      if (organism.target) {
        // Avına doğru hızlı hareket (hedef varsa)
        const bounce = Math.abs(Math.sin((time + organism.bobPhase) * 8)) * 0.2;
        position.y = organism.originalY + bounce;
        
        // Hareket yönüne doğru hafif eğilme
        organism.mesh.rotation.x = bounce * 0.5;
      } else {
        // Normal hareket (hedef yoksa daha yavaş zıplama)
        const bounce = Math.abs(Math.sin((time + organism.bobPhase) * 3)) * 0.1;
        position.y = organism.originalY + bounce;
      }
      break;
      
    case 'snake':
      // Yılan gibi sürekli hareket
      const prowlFactor = Math.sin(time * 5 + organism.bobPhase) * 0.08;
      position.y = organism.originalY + Math.abs(prowlFactor) * 0.1;
      
      // Av varsa hafifçe eğil (avcı pozu)
      if (organism.target) {
        organism.mesh.rotation.x = Math.sin(time * 2) * 0.1;
      }
      break;
      
    case 'eagle':
      // Kartal gibi hafifçe titreşir
      const shakeFactor = Math.sin(time * 2 + organism.bobPhase) * 0.03;
      organism.mesh.rotation.y = organism.rotation + shakeFactor;
      break;
  }
  
  // Rastgele hareket (zeminde)
  organism.mesh.position.x += organism.direction.x * organism.speed;
  organism.mesh.position.z += organism.direction.z * organism.speed;
  
  // Sınır kontrolü (sadece x ve z)
  if (Math.abs(position.x) > boxSize/2) {
    position.x = Math.sign(position.x) * boxSize/2;
    organism.direction.x *= -1;
  }
  if (Math.abs(position.z) > boxSize/2) {
    position.z = Math.sign(position.z) * boxSize/2;
    organism.direction.z *= -1;
  }
  
  // Rastgele yön değişimi (sadece x-z düzleminde)
  if (Math.random() < 0.01) {
    organism.direction.set(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    ).normalize();
  }
}

// Hedefe doğru hareket
function moveTowardsTarget(organism) {
  if (!organism.target) return;
  
  const targetPosition = organism.target.mesh.position.clone();
  // Y (yükseklik) değerini koru - sadece X-Z düzleminde hareket et
  const myPosition = organism.mesh.position.clone();
  
  // Hedefe doğru 2D vektör (sadece X ve Z kullan)
  const direction2D = new THREE.Vector3(
    targetPosition.x - myPosition.x,
    0, // Y'de hareket yok
    targetPosition.z - myPosition.z
  ).normalize();
  
  // Orijinal yön ile hedef yön arasında harmanla (daha doğal görünüm için)
  organism.direction.lerp(direction2D, 0.08).normalize();
  
  // Yükseklik bileşenini sıfırla
  organism.direction.y = 0;
}

// En yakın organizmayı bulma
function findNearestOrganism(organism, targetType) {
  let nearest = null;
  let minDistance = Infinity;
  
  organisms.forEach(other => {
    if (other.type === targetType && other.energy > 0) {
      const distance = organism.mesh.position.distanceTo(other.mesh.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = other;
      }
    }
  });
  
  return nearest;
}

// Animasyon döngüsü
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  if (controls) controls.update();
  
  updateOrganisms();
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Kamera açısını değiştirme
function setCameraView(viewType) {
  switch (viewType) {
    case 'top':
      camera.position.set(0, 25, 0);
      controls.target.set(0, -10, 0);
      break;
    case 'side':
      camera.position.set(25, 0, 0);
      controls.target.set(0, -5, 0);
      break;
    case 'front':
      camera.position.set(0, 0, 25);
      controls.target.set(0, -5, 0);
      break;
    case 'isometric':
      camera.position.set(15, 15, 15);
      controls.target.set(0, -5, 0);
      break;
  }
  
  
  if (controls) controls.update();
}

// Pencere yeniden boyutlandırma
function onWindowResize() {
  if (camera && renderer && threeContainer.value) {
    camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  }
}

// Simülasyonu başlat
function startSimulation() {
  isPlaying.value = true;
  
  // İlk durumu belirle
  updateEcosystemStatus();
}

// Simülasyonu durdur
function stopSimulation() {
  isPlaying.value = false;
}

// Simülasyon ayarlarını güncelle
function updateSimulation() {
  createOrganisms();
  
  // Organizma sayılarını güncelle
  updateEcosystemStatus();
}

// Sayfa yüklendiğinde simülasyonu başlat
onMounted(() => {
  initScene();
});

// Sayfa kapatıldığında temizlik yap
onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (renderer && renderer.domElement && threeContainer.value) {
    threeContainer.value.removeChild(renderer.domElement);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // Kaynakları serbest bırak
  if (scene) {
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
  
  if (renderer) renderer.dispose();
});
</script>
  
 
 