<template>
  <div class="relative flex flex-col h-screen w-full bg-gray-900 text-white overflow-hidden">



    <div class="space-y-2 absolute top-4 right-4 lg:left-4 lg:right-auto z-20">
      <div class="bg-gray-700 rounded-lg p-3 space-y-2">

        <!-- Başlat/Durdur Butonu -->
        <div class="w-full">
          <button @click="startSimulation" class="w-full px-6 py-2 rounded-lg text-sm font-semibold transition-all" 
            :class="isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
            {{ isRunning ? 'Durdur' : 'Başlat' }}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-gray-300">Nesil:</div>
          <div>{{ stats.generation }}</div>
          <div class="text-gray-300">Popülasyon:</div>
          <div>{{ stats.population }}</div>
          <div class="text-gray-300">Ort. Yaşam:</div>
          <div>{{ stats.averageLifespan.toFixed(1) }}</div>
          <div class="text-gray-300">Baskın Renk:</div>
          <div class="flex items-center">
            <div class="w-4 h-4 rounded-full mr-2" :style="{ backgroundColor: stats.dominantColor }"></div>
            {{ stats.dominantColorName }}
          </div>
        </div>
      </div>
    </div>


    <!-- Mobil Ayarlar Butonu -->
    <div class="md:hidden absolute top-4 left-4 z-20">
      <button @click="showMobileSettings = true" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Ana İçerik -->
    <div class="flex flex-grow">

      


      <!-- Simülasyon Görünümü -->
      <div class="flex-grow relative">
        <div id="simulation-container" class="w-full h-full"></div>
        <div v-if="!isInitialized" class="absolute inset-0 flex items-center justify-center">
          <div class="text-lg p-4 text-center">Simülasyonu başlatmak için "Başlat" düğmesine tıklayın</div>
        </div>
      </div>

      <!-- Desktop Ayarlar Paneli -->
      <div class="hidden md:block w-1/4 max-w-md bg-gray-800 border-l border-gray-700 overflow-y-auto max-h-[66vh]">
        <div class="p-4 space-y-6">
          <h2 class="text-xl font-bold">Doğal Seçilim Simülasyonu</h2>
          
          <!-- Arkaplan Renk Seçenekleri -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Arkaplan Rengi</h3>
            <div class="flex space-x-2">
              <button @click="changeBackground('dark')" class="w-8 h-8 rounded-full bg-gray-900 border-2" :class="{'border-blue-500': isDarkMode, 'border-gray-700': !isDarkMode}"></button>
              <button @click="changeBackground('light')" class="w-8 h-8 rounded-full bg-gray-100 border-2" :class="{'border-blue-500': !isDarkMode, 'border-gray-700': isDarkMode}"></button>
            </div>
          </div>

          <!-- Çevre Ayarları -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Çevre Ayarları</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-1">Arazi Tipi</label>
                <select v-model="settings.terrainType" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
                  <option value="forest">Orman</option>
                  <option value="desert">Çöl</option>
                  <option value="snow">Kar</option>
                </select>
              </div>

              <div>
                <label class="block text-sm mb-1">Sıcaklık</label>
                <input type="range" v-model="settings.temperature" min="0" max="100" class="w-full accent-blue-500">
                <div class="flex justify-between text-xs mt-1">
                  <span>Soğuk</span>
                  <span>{{ settings.temperature }}</span>
                  <span>Sıcak</span>
                </div>
              </div>

              <div>
                <label class="block text-sm mb-1">Yırtıcı Sayısı</label>
                <input type="number" v-model="settings.predatorCount" min="0" max="20" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-sm mb-1">Besin Miktarı</label>
                <input type="range" v-model="settings.foodAmount" min="0" max="100" class="w-full accent-blue-500">
                <div class="flex justify-between text-xs mt-1">
                  <span>Az</span>
                  <span>{{ settings.foodAmount }}</span>
                  <span>Çok</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Popülasyon Ayarları -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Popülasyon Ayarları</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-1">Başlangıç Popülasyonu</label>
                <input type="number" v-model="settings.initialPopulation" min="10" max="200" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-sm mb-1">Mutasyon Oranı (%)</label>
                <input type="number" v-model="settings.mutationRate" min="0" max="100" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              </div>
            </div>
          </div>

          <!-- Kontrol Butonları -->
          <div class="flex space-x-2">
            <button @click="resetSimulation" class="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold">
              Sıfırla
            </button>
          </div>

          <!-- İstatistikler -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">İstatistikler</h3>
            <div class="bg-gray-700 rounded-lg p-3 space-y-2">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-gray-300">Nesil:</div>
                <div>{{ stats.generation }}</div>
                <div class="text-gray-300">Popülasyon:</div>
                <div>{{ stats.population }}</div>
                <div class="text-gray-300">Ort. Yaşam:</div>
                <div>{{ stats.averageLifespan.toFixed(1) }}</div>
                <div class="text-gray-300">Baskın Renk:</div>
                <div class="flex items-center">
                  <div class="w-4 h-4 rounded-full mr-2" :style="{ backgroundColor: stats.dominantColor }"></div>
                  {{ stats.dominantColorName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobil Ayarlar Modal -->
    <div v-if="showMobileSettings" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30">
      <div class="absolute right-0 top-0 h-full w-full max-w-sm bg-gray-800 p-4 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ayarlar</h2>
          <button @click="showMobileSettings = false" class="p-2 hover:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Mobil ayarlar içeriği (Desktop ile aynı) -->
        <div class="space-y-6">
          <!-- Arkaplan Renk Seçenekleri -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Arkaplan Rengi</h3>
            <div class="flex space-x-2">
              <button @click="changeBackground('dark')" class="w-8 h-8 rounded-full bg-gray-900 border-2" :class="{'border-blue-500': isDarkMode, 'border-gray-700': !isDarkMode}"></button>
              <button @click="changeBackground('light')" class="w-8 h-8 rounded-full bg-gray-100 border-2" :class="{'border-blue-500': !isDarkMode, 'border-gray-700': isDarkMode}"></button>
            </div>
          </div>

          <!-- Çevre Ayarları -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Çevre Ayarları</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-1">Arazi Tipi</label>
                <select v-model="settings.terrainType" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
                  <option value="forest">Orman</option>
                  <option value="desert">Çöl</option>
                  <option value="snow">Kar</option>
                </select>
              </div>

              <div>
                <label class="block text-sm mb-1">Sıcaklık</label>
                <input type="range" v-model="settings.temperature" min="0" max="100" class="w-full accent-blue-500">
                <div class="flex justify-between text-xs mt-1">
                  <span>Soğuk</span>
                  <span>{{ settings.temperature }}</span>
                  <span>Sıcak</span>
                </div>
              </div>

              <div>
                <label class="block text-sm mb-1">Yırtıcı Sayısı</label>
                <input type="number" v-model="settings.predatorCount" min="0" max="20" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-sm mb-1">Besin Miktarı</label>
                <input type="range" v-model="settings.foodAmount" min="0" max="100" class="w-full accent-blue-500">
                <div class="flex justify-between text-xs mt-1">
                  <span>Az</span>
                  <span>{{ settings.foodAmount }}</span>
                  <span>Çok</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Popülasyon Ayarları -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">Popülasyon Ayarları</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-1">Başlangıç Popülasyonu</label>
                <input type="number" v-model="settings.initialPopulation" min="10" max="200" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-sm mb-1">Mutasyon Oranı (%)</label>
                <input type="number" v-model="settings.mutationRate" min="0" max="100" class="w-full bg-gray-700 rounded p-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              </div>
            </div>
          </div>

          <!-- Kontrol Butonları -->
          <div class="flex space-x-2">
            <button @click="resetSimulation" class="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold">
              Sıfırla
            </button>
          </div>

          <!-- İstatistikler -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm">İstatistikler</h3>
            <div class="bg-gray-700 rounded-lg p-3 space-y-2">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-gray-300">Nesil:</div>
                <div>{{ stats.generation }}</div>
                <div class="text-gray-300">Popülasyon:</div>
                <div>{{ stats.population }}</div>
                <div class="text-gray-300">Ort. Yaşam:</div>
                <div>{{ stats.averageLifespan.toFixed(1) }}</div>
                <div class="text-gray-300">Baskın Renk:</div>
                <div class="flex items-center">
                  <div class="w-4 h-4 rounded-full mr-2" :style="{ backgroundColor: stats.dominantColor }"></div>
                  {{ stats.dominantColorName }}
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
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Renk sabitleri
const COLORS = {
  FOREST_GREEN: '#2d4b2d',
  DESERT_YELLOW: '#c2b280',
  SNOW_WHITE: '#eff1f3',
  PREDATOR_RED: '#aa3333',
};

// Ayarlar
const settings = ref({
  terrainType: 'forest',
  temperature: 50,
  predatorCount: 3,
  foodAmount: 50,
  initialPopulation: 50,
  mutationRate: 5,
});

// İstatistikler
const stats = ref({
  generation: 0,
  population: 0,
  averageLifespan: 0,
  dominantColor: '#333333',
  dominantColorName: 'Gri',
  averageLegLength: 0,
  averageVision: 0,
  averageEfficiency: 0,
  totalDeaths: 0,
  extinctSpecies: [], // Tükenen türlerin listesi
  dominantSpecies: null, // Baskın türün özellikleri
  environmentalAdaptation: 50, // Çevreye uyum yüzdesi
  predatorEvasion: 50, // Avcılardan kaçış başarısı
  foodFinding: 50, // Besin bulma başarısı
  speciesRegistry: {}, // Tür kayıt defteri
  deathCauses: { // Ölüm sebepleri
    predator: 0,
    starvation: 0,
    oldAge: 0
  }
});

// Simülasyon durumu
const isRunning = ref(false);
const isInitialized = ref(false);

// THREE.js değişkenleri
let scene, camera, renderer, controls;
let terrain, organisms = [], predators = [], foods = [];
let clock = new THREE.Clock();
let animationId = null;

// Mobil ayarlar modalı için state
const showMobileSettings = ref(false);

// Arkaplan modu için state
const isDarkMode = ref(true);

// Arkaplan değiştirme fonksiyonu
const changeBackground = (mode) => {
  isDarkMode.value = mode === 'dark';
  const container = document.getElementById('simulation-container');
  if (container) {
    container.style.backgroundColor = mode === 'dark' ? '#111827' : '#f3f4f6';
  }
  // Sahne arkaplan rengini değiştir
  if (scene) {
    scene.background = new THREE.Color(mode === 'dark' ? 0x111827 : 0xf3f4f6);
  }
};

// Pencere boyutu değiştiğinde ayarlar modalını kapat
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    showMobileSettings.value = false;
  }
});

// Organizma sınıfı
class Organism {
  constructor(props = {}) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = props.position || new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      2,
      (Math.random() - 0.5) * 80
    );
    
    // Genetik özellikler
    this.genes = {
      // Renk (RGB değerleri)
      color: props.color || {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
      },
      // Bacak uzunluğu (hız faktörü)
      legLength: props.legLength || 0.5 + Math.random() * 2,
      // Görme keskinliği (yırtıcıları/besinleri görme mesafesi)
      vision: props.vision || 5 + Math.random() * 15,
      // Enerji verimliliği (enerji tüketim oranı)
      efficiency: props.efficiency || 0.5 + Math.random() * 1.5
    };
    
    // Durum bilgileri
    this.age = 0;
    this.energy = 100;
    this.alive = true;
    this.reproductionCooldown = 0;
    this.animationPhase = 0; // Animasyon fazı
    
    // 3D model
    this.createModel();
  }
  
  // 3D modeli oluştur
  createModel() {
    // Ana grup
    this.body = new THREE.Group();
    this.body.position.copy(this.position);
    
    // Gövde
    const bodyGeo = new THREE.SphereGeometry(1, 16, 16);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(
        this.genes.color.r,
        this.genes.color.g,
        this.genes.color.b
      )
    });
    const mainBody = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.add(mainBody);
    
    // Kafa
    const headGeo = new THREE.SphereGeometry(0.6, 12, 12);
    const headMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(
        this.genes.color.r * 0.9,
        this.genes.color.g * 0.9,
        this.genes.color.b * 0.9
      )
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.set(0, 0.7, 0.7);
    this.body.add(this.head);
    
    // Gözler
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const pupilMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Göz keskinliğine göre göz boyutu
    const eyeScale = 0.8 + (this.genes.vision / 20) * 0.4;
    
    // Sol göz
    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.25, 0.2, 0.5);
    this.leftEye.scale.set(eyeScale, eyeScale, eyeScale);
    this.head.add(this.leftEye);
    
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.1);
    this.leftEye.add(leftPupil);
    
    // Sağ göz
    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.25, 0.2, 0.5);
    this.rightEye.scale.set(eyeScale, eyeScale, eyeScale);
    this.head.add(this.rightEye);
    
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.1);
    this.rightEye.add(rightPupil);
    
    // Bacaklar
    this.legs = [];
    const legMat = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(
        this.genes.color.r * 0.7,
        this.genes.color.g * 0.7,
        this.genes.color.b * 0.7
      )
    });
    
    const legCount = 4; // 4 bacak
    for (let i = 0; i < legCount; i++) {
      const legGroup = new THREE.Group();
      
      const angle = (i * Math.PI / 2) + (Math.PI / 4);
      const xPos = Math.cos(angle) * 0.8;
      const zPos = Math.sin(angle) * 0.8;
      
      // Üst bacak
      const upperLegGeo = new THREE.CylinderGeometry(0.15, 0.1, this.genes.legLength * 0.6, 8);
      const upperLeg = new THREE.Mesh(upperLegGeo, legMat);
      upperLeg.position.set(0, -this.genes.legLength * 0.3, 0);
      upperLeg.rotation.x = Math.PI / 3;
      legGroup.add(upperLeg);
      
      // Alt bacak
      const lowerLegGeo = new THREE.CylinderGeometry(0.1, 0.05, this.genes.legLength * 0.7, 8);
      const lowerLeg = new THREE.Mesh(lowerLegGeo, legMat);
      lowerLeg.position.set(0, -this.genes.legLength * 0.6, 0);
      lowerLeg.rotation.x = -Math.PI / 6;
      upperLeg.add(lowerLeg);
      
      // Ayak
      const footGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const foot = new THREE.Mesh(footGeo, legMat);
      foot.position.set(0, -this.genes.legLength * 0.35, 0);
      lowerLeg.add(foot);
      
      legGroup.position.set(xPos, 0, zPos);
      this.body.add(legGroup);
      this.legs.push({ group: legGroup, upper: upperLeg, lower: lowerLeg, phase: i % 2 * Math.PI });
    }
    
    scene.add(this.body);
  }
  
  // Bacakların hareketini animasyonla
  animateLegs(speed) {
    this.animationPhase += speed * 5;
    
    for (let i = 0; i < this.legs.length; i++) {
      const leg = this.legs[i];
      
      // Her bacak için farklı faz (alternatif bacak hareketi için)
      const phase = this.animationPhase + leg.phase;
      
      // Bacak animasyonu
      leg.upper.rotation.x = Math.PI / 3 + Math.sin(phase) * 0.3;
      leg.lower.rotation.x = -Math.PI / 6 + Math.sin(phase + Math.PI / 2) * 0.2;
    }
    
    // Kafa hareketini animasyonla
    if (this.head) {
      this.head.rotation.x = Math.sin(this.animationPhase * 0.5) * 0.1;
      this.head.rotation.y = Math.sin(this.animationPhase * 0.3) * 0.1;
    }
  }
  
  // Hedefe doğru hareket et
  moveTowards(target, deltaTime) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
      
    const speed = this.genes.legLength * 5 * deltaTime;
    const movement = direction.multiplyScalar(speed);
    
    this.position.add(movement);
    this.body.position.copy(this.position);
    
    // Yöne göre dön
    if (movement.length() > 0.01) {
      this.body.lookAt(new THREE.Vector3(target.x, this.position.y, target.z));
      this.animateLegs(speed); // Hareket ederken bacakları animasyonla
    }
    
    // Hareket için enerji harca (sıcaklığa göre değişiklik gösterir)
    const temperatureEffect = 0.8 + (settings.value.temperature / 100) * 0.4; // Sıcaklık etkisi
    this.energy -= speed * (1 / this.genes.efficiency) * temperatureEffect;
  }
  
  // En yakın besini bul
  findNearestFood() {
    let nearestDistance = Infinity;
    let nearestFood = null;
    
    for (const food of foods) {
      if (food.available) {
        const distance = this.position.distanceTo(food.position);
        if (distance < nearestDistance && distance < this.genes.vision) {
          nearestDistance = distance;
          nearestFood = food;
        }
      }
    }
    
    return nearestFood;
  }
  
  // En yakın yırtıcıyı bul
  findNearestPredator() {
    let nearestDistance = Infinity;
    let nearestPredator = null;
    
    for (const predator of predators) {
      const distance = this.position.distanceTo(predator.position);
      if (distance < nearestDistance && distance < this.genes.vision) {
        nearestDistance = distance;
        nearestPredator = predator;
      }
    }
    
    return { predator: nearestPredator, distance: nearestDistance };
  }
  
  // Güvenli bir yer bul (yırtıcıdan kaç)
  findSafePosition(predator) {
    // Yırtıcıdan uzaklaş
    const direction = new THREE.Vector3()
      .subVectors(this.position, predator.position)
      .normalize();
      
    return this.position.clone().add(
      direction.multiplyScalar(20)
    );
  }
  
  // Besin tüket
  eat(food) {
    food.available = false;
    this.energy += 30;
    if (this.energy > 100) this.energy = 100;
    
    // Tür kaydını güncelle (besin bulma başarısı)
    updateSpeciesRegistry(this, true, 'food');
    
    // Yenilen besin bir süre sonra tekrar belirir
    setTimeout(() => {
      food.available = true;
      food.mesh.visible = true;
    }, 5000);
    
    food.mesh.visible = false;
  }
  
  // Üreme
  reproduce() {
    if (this.energy > 70 && this.reproductionCooldown <= 0) {
      const mutationRate = settings.value.mutationRate / 100;
      
      // Genetik özellikleri kopyala ve mutasyona uğrat
      const childGenes = {
        color: {
          r: this.mutateValue(this.genes.color.r, mutationRate),
          g: this.mutateValue(this.genes.color.g, mutationRate),
          b: this.mutateValue(this.genes.color.b, mutationRate)
        },
        legLength: this.mutateValue(this.genes.legLength, mutationRate),
        vision: this.mutateValue(this.genes.vision, mutationRate),
        efficiency: this.mutateValue(this.genes.efficiency, mutationRate)
      };
      
      // Yeni organizma oluştur
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        0,
        (Math.random() - 0.5) * 4
      );
      
      const child = new Organism({
        position: this.position.clone().add(offset),
        color: childGenes.color,
        legLength: childGenes.legLength,
        vision: childGenes.vision,
        efficiency: childGenes.efficiency
      });
      
      organisms.push(child);
      this.energy -= 30;
      this.reproductionCooldown = 10;
      
      // Tür kaydını güncelle (yeni doğan)
      updateSpeciesRegistry(child, true);
      
      return child;
    }
    
    return null;
  }
  
  // Değeri mutasyona uğrat
  mutateValue(value, mutationRate) {
    if (Math.random() < mutationRate) {
      return Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.3));
    }
    return value;
  }
  
  // Güncelleştirme fonksiyonu
  update(deltaTime) {
    if (!this.alive) return;
    
    this.age += deltaTime;
    this.energy -= deltaTime * 2;
    
    if (this.reproductionCooldown > 0) {
      this.reproductionCooldown -= deltaTime;
    }
    
    // Enerji tükendi mi?
    if (this.energy <= 0) {
      this.die('starvation');
      return;
    }
    
    // Maksimum yaşam süresi aşıldı mı?
    const maxLifespan = 100 + (this.genes.efficiency * 50);
    if (this.age > maxLifespan) {
      this.die('oldAge');
      return;
    }
    
    // Yırtıcı kontrolü
    const { predator, distance } = this.findNearestPredator();
    
    if (predator && distance < 15) {
      // Kaç!
      const safePosition = this.findSafePosition(predator);
      this.moveTowards(safePosition, deltaTime);
      
      // Başarılı kaçış
      if (distance < 10 && distance > 5) {
        updateSpeciesRegistry(this, true, 'evade');
      }
      
      return;
    }
    
    // Besin ara
    const nearestFood = this.findNearestFood();
    
    if (nearestFood) {
      // Besin bul ve ye
      this.moveTowards(nearestFood.position, deltaTime);
      
      if (this.position.distanceTo(nearestFood.position) < 2) {
        this.eat(nearestFood);
      }
    } else {
      // Rastgele dolaş
      if (!this.randomTarget || this.position.distanceTo(this.randomTarget) < 2) {
        this.randomTarget = new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          2,
          (Math.random() - 0.5) * 80
        );
      }
      
      this.moveTowards(this.randomTarget, deltaTime);
    }
    
    // Üreme
    if (Math.random() < 0.01) {
      this.reproduce();
    }
  }
  
  // Ölüm
  die(cause = 'starvation') {
    this.alive = false;
    scene.remove(this.body);
    
    // Ölüm sebebini kaydet
    if (cause === 'predator') {
      stats.value.deathCauses.predator++;
    } else if (cause === 'starvation') {
      stats.value.deathCauses.starvation++;
    } else if (cause === 'oldAge') {
      stats.value.deathCauses.oldAge++;
    }
    
    // Toplam ölüm sayısını artır
    stats.value.totalDeaths++;
    
    // Tür kaydını güncelle
    updateSpeciesRegistry(this, false);
    
    // Canlıyı listeden çıkar
    const index = organisms.findIndex(o => o.id === this.id);
    if (index !== -1) {
      organisms.splice(index, 1);
    }
  }
}

// Yırtıcı sınıfı
class Predator {
  constructor() {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      3,
      (Math.random() - 0.5) * 80
    );
    
    this.speed = 5 + Math.random() * 3;
    this.vision = 30;
    this.animationPhase = 0;
    this.createModel();
    this.randomTarget = null;
  }
  
  createModel() {
    // Ana grup
    this.body = new THREE.Group();
    this.body.position.copy(this.position);
    
    // Gövde
    const bodyGeo = new THREE.ConeGeometry(1.5, 4, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.PREDATOR_RED });
    const mainBody = new THREE.Mesh(bodyGeo, bodyMat);
    mainBody.rotation.x = Math.PI / 2;
    this.body.add(mainBody);
    
    // Baş
    const headGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const headMat = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(0.8, 0.1, 0.1) 
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.set(0, 0, 2.2);
    this.body.add(this.head);
    
    // Gözler
    const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    
    // Sol göz
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.5, 0.5, 0.7);
    this.head.add(leftEye);
    
    // Sağ göz
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.5, 0.5, 0.7);
    this.head.add(rightEye);
    
    // Ağız/Çene
    const jawGeo = new THREE.BoxGeometry(1.4, 0.5, 1.2);
    const jawMat = new THREE.MeshLambertMaterial({ color: 0x660000 });
    this.jaw = new THREE.Mesh(jawGeo, jawMat);
    this.jaw.position.set(0, -0.3, 0.6);
    this.head.add(this.jaw);
    
    // Dişler
    const toothGeo = new THREE.ConeGeometry(0.1, 0.3, 8);
    const toothMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    const teethCount = 6;
    for (let i = 0; i < teethCount; i++) {
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      const xPos = (i - (teethCount - 1) / 2) * 0.2;
      tooth.position.set(xPos, -0.1, 0.6);
      tooth.rotation.x = Math.PI / 2;
      this.jaw.add(tooth);
    }
    
    // Yüzgeçler/kanatlar
    const finGeo = new THREE.BoxGeometry(3, 0.2, 1.5);
    const finMat = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(0.9, 0.2, 0.2),
      transparent: true,
      opacity: 0.8
    });
    
    // Sol yüzgeç
    this.leftFin = new THREE.Mesh(finGeo, finMat);
    this.leftFin.position.set(-1.5, 0, -1);
    this.leftFin.rotation.z = Math.PI / 6;
    this.body.add(this.leftFin);
    
    // Sağ yüzgeç
    this.rightFin = new THREE.Mesh(finGeo, finMat);
    this.rightFin.position.set(1.5, 0, -1);
    this.rightFin.rotation.z = -Math.PI / 6;
    this.body.add(this.rightFin);
    
    scene.add(this.body);
  }
  
  // Yırtıcıyı animasyonla
  animate(speed) {
    this.animationPhase += speed * 3;
    
    // Yüzgeçleri hareket ettir
    if (this.leftFin && this.rightFin) {
      this.leftFin.rotation.z = Math.PI / 6 + Math.sin(this.animationPhase) * 0.2;
      this.rightFin.rotation.z = -Math.PI / 6 - Math.sin(this.animationPhase) * 0.2;
    }
    
    // Çeneyi hareket ettir
    if (this.jaw) {
      this.jaw.rotation.x = Math.sin(this.animationPhase * 0.5) * 0.1;
    }
    
    // Hafif gövde hareketi
    if (this.body) {
      this.body.rotation.z = Math.sin(this.animationPhase * 0.2) * 0.05;
    }
  }
  
  moveTowards(target, deltaTime) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
      
    const movement = direction.multiplyScalar(this.speed * deltaTime);
    
    this.position.add(movement);
    this.body.position.copy(this.position);
    
    // Yöne göre dön
    if (movement.length() > 0.01) {
      const lookTarget = new THREE.Vector3(
        target.x,
        this.position.y,
        target.z
      );
      this.body.lookAt(lookTarget);
      
      // Hareket sırasında animasyon
      this.animate(movement.length());
    }
  }
  
  findNearestOrganism() {
    let nearestDistance = Infinity;
    let nearestOrganism = null;
    
    for (const organism of organisms) {
      if (organism.alive) {
        const distance = this.position.distanceTo(organism.position);
        if (distance < nearestDistance && distance < this.vision) {
          nearestDistance = distance;
          nearestOrganism = organism;
        }
      }
    }
    
    return nearestOrganism;
  }
  
  hunt(organism) {
    if (this.position.distanceTo(organism.position) < 2) {
      organism.die('predator');
      return true;
    }
    return false;
  }
  
  update(deltaTime) {
    const target = this.findNearestOrganism();
    
    if (target) {
      this.moveTowards(target.position, deltaTime);
      this.hunt(target);
    } else {
      // Rastgele dolaş
      if (!this.randomTarget || this.position.distanceTo(this.randomTarget) < 5) {
        this.randomTarget = new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          3,
          (Math.random() - 0.5) * 80
        );
      }
      
      this.moveTowards(this.randomTarget, deltaTime);
    }
  }
}

// Besin sınıfı
class Food {
  constructor() {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 90,
      0.5,
      (Math.random() - 0.5) * 90
    );
    
    this.available = true;
    this.animationPhase = Math.random() * Math.PI * 2;
    this.createModel();
  }
  
  createModel() {
    // Ana grup
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    
    // Besin gövdesi
    const foodGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const foodMat = new THREE.MeshLambertMaterial({ 
      color: 0x33cc33,
      emissive: 0x115511,
      emissiveIntensity: 0.3
    });
    const foodBody = new THREE.Mesh(foodGeo, foodMat);
    this.mesh.add(foodBody);
    
    // Yapraklar
    const leafCount = Math.floor(Math.random() * 3) + 2;
    const leafGeo = new THREE.BoxGeometry(0.4, 0.05, 0.6);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228822 });
    
    for (let i = 0; i < leafCount; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i / leafCount) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 0.2, 0.2, Math.sin(angle) * 0.2);
      leaf.rotation.set(Math.random() * 0.2, angle, Math.random() * 0.2);
      this.mesh.add(leaf);
    }
    
    scene.add(this.mesh);
  }
  
  // Besini animasyonla
  animate() {
    this.animationPhase += 0.02;
    
    // Hafif dönme ve yükseklik değişimi
    this.mesh.rotation.y = this.animationPhase * 0.2;
    this.mesh.position.y = this.position.y + Math.sin(this.animationPhase) * 0.1;
  }
  
  update() {
    if (this.available) {
      this.animate();
    }
  }
}

// Simülasyonu başlat
const startSimulation = () => {
  if (!isInitialized.value) {
    initializeSimulation();
  }
  
  isRunning.value = !isRunning.value;
  
  if (isRunning.value) {
    animate();
  } else {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

// Simülasyonu sıfırla
const resetSimulation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  isRunning.value = false;
  
  // Mevcut nesneleri temizle
  organisms.forEach(organism => {
    if (organism.body) scene.remove(organism.body);
  });
  
  predators.forEach(predator => {
    if (predator.body) scene.remove(predator.body);
  });
  
  foods.forEach(food => {
    if (food.mesh) scene.remove(food.mesh);
  });
  
  organisms = [];
  predators = [];
  foods = [];
  
  // İstatistikleri sıfırla
  stats.value = {
    generation: 0,
    population: 0,
    averageLifespan: 0,
    dominantColor: '#333333',
    dominantColorName: 'Gri',
    averageLegLength: 0,
    averageVision: 0,
    averageEfficiency: 0,
    totalDeaths: 0,
    extinctSpecies: [],
    dominantSpecies: null,
    environmentalAdaptation: 50,
    predatorEvasion: 50,
    foodFinding: 50,
    speciesRegistry: {},
    deathCauses: {
      predator: 0,
      starvation: 0,
      oldAge: 0
    }
  };
  
  // Yeniden başlat
  initializeSimulation();
};

// Simülasyonu başlat
const initializeSimulation = () => {
  // THREE.js kurulumu
  setupThreeJs();
  
  // Araziyi oluştur
  createTerrain();
  
  // Işıkları kur
  setupLights();
  
  // Başlangıç popülasyonunu oluştur
  createInitialPopulation();
  
  // Yırtıcıları oluştur
  createPredators();
  
  // Besinleri oluştur
  createFood();
  
  isInitialized.value = true;
};

// THREE.js kurulumu
const setupThreeJs = () => {
  const container = document.getElementById('simulation-container');
  
  // Sahne oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Gökyüzü mavisi
  
  // Kamera oluştur
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 50, 100);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  
  // Önceki renderer'ı temizle
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  container.appendChild(renderer.domElement);
  
  // Kontroller oluştur (kamerayla gezinti)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 20;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI / 2 - 0.1;
};

// Arazi oluştur
const createTerrain = () => {
  // Önceki araziyi temizle
  if (terrain) {
    scene.remove(terrain);
  }
  
  // Arazi geometrisi
  const geometry = new THREE.BoxGeometry(200, 1, 200);
  
  // Arazi malzemesi (çevre tipine göre)
  let terrainColor;
  
  switch (settings.value.terrainType) {
    case 'desert':
      terrainColor = COLORS.DESERT_YELLOW;
      break;
    case 'snow':
      terrainColor = COLORS.SNOW_WHITE;
      break;
    case 'forest':
    default:
      terrainColor = COLORS.FOREST_GREEN;
      break;
  }
  
  const material = new THREE.MeshLambertMaterial({ color: terrainColor });
  terrain = new THREE.Mesh(geometry, material);
  terrain.position.set(0, -0.5, 0);
  terrain.receiveShadow = true;
  scene.add(terrain);
  
  // Duvarlar oluştur (aynı renkte)
  const wallMaterial = new THREE.MeshLambertMaterial({ 
    color: terrainColor,
    transparent: true,
    opacity: 0
  });
  
  // Ön duvar
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(200, 20, 1),
    wallMaterial
  );
  frontWall.position.set(0, 10, 100);
  scene.add(frontWall);
  
  // Arka duvar
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(200, 20, 1),
    wallMaterial
  );
  backWall.position.set(0, 10, -100);
  scene.add(backWall);
  
  // Sol duvar
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(1, 20, 200),
    wallMaterial
  );
  leftWall.position.set(-100, 10, 0);
  scene.add(leftWall);
  
  // Sağ duvar
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(1, 20, 200),
    wallMaterial
  );
  rightWall.position.set(100, 10, 0);
  scene.add(rightWall);
  
  // Tavan
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(200, 1, 200),
    wallMaterial
  );
  ceiling.position.set(0, 20, 0);
  scene.add(ceiling);
};

// Işıkları kur
const setupLights = () => {
  // Ambient ışık
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Directional ışık (güneş)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  
  // Gölge ayarları
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 10;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  
  scene.add(directionalLight);
};

// Başlangıç popülasyonunu oluştur
const createInitialPopulation = () => {
  const initialPopulation = settings.value.initialPopulation;
  
  for (let i = 0; i < initialPopulation; i++) {
    // Çevre tipine göre uyumlu başlangıç renkleri
    let baseColor;
    
    switch (settings.value.terrainType) {
      case 'desert':
        baseColor = { r: 0.7 + Math.random() * 0.3, g: 0.6 + Math.random() * 0.3, b: 0.3 + Math.random() * 0.3 };
        break;
      case 'snow':
        baseColor = { r: 0.7 + Math.random() * 0.3, g: 0.7 + Math.random() * 0.3, b: 0.7 + Math.random() * 0.3 };
        break;
      case 'forest':
      default:
        baseColor = { r: 0.1 + Math.random() * 0.3, g: 0.3 + Math.random() * 0.5, b: 0.1 + Math.random() * 0.3 };
        break;
    }
    
    // Rastgele renkli bir organizma oluştur (bazıları çevreye uyumlu, bazıları değil)
    const useBaseColor = Math.random() < 0.5;
    const color = useBaseColor ? baseColor : {
      r: Math.random(),
      g: Math.random(),
      b: Math.random()
    };
    
    const organism = new Organism({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        2,
        (Math.random() - 0.5) * 80
      ),
      color: color,
      legLength: 0.5 + Math.random() * 2,
      vision: 5 + Math.random() * 15,
      efficiency: 0.5 + Math.random() * 1.5
    });
    
    organisms.push(organism);
    
    // Tür kaydını güncelle
    updateSpeciesRegistry(organism, true);
  }
  
  updateStats();
};

// Yırtıcıları oluştur
const createPredators = () => {
  const predatorCount = settings.value.predatorCount;
  
  for (let i = 0; i < predatorCount; i++) {
    const predator = new Predator();
    predators.push(predator);
  }
};

// Besinleri oluştur
const createFood = () => {
  const foodCount = Math.floor(settings.value.foodAmount / 2);
  
  for (let i = 0; i < foodCount; i++) {
    const food = new Food();
    foods.push(food);
  }
};

// İstatistikleri güncelle
const updateStats = () => {
  // Popülasyon sayısı
  stats.value.population = organisms.length;
  
  // Nesil
  const newBorn = organisms.filter(o => o.age < 1).length;
  if (newBorn > 5) {
    stats.value.generation++;
  }
  
  if (organisms.length === 0) return;
  
  // Ortalama değerler
  let totalLifespan = 0;
  let totalLegLength = 0;
  let totalVision = 0;
  let totalEfficiency = 0;
  let colorCounts = {};
  
  organisms.forEach(organism => {
    totalLifespan += organism.age;
    totalLegLength += organism.genes.legLength;
    totalVision += organism.genes.vision;
    totalEfficiency += organism.genes.efficiency;
    
    // Renk analizi
    const colorKey = `${Math.floor(organism.genes.color.r * 5)}-${Math.floor(organism.genes.color.g * 5)}-${Math.floor(organism.genes.color.b * 5)}`;
    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
  });
  
  // Ortalama değerleri hesapla
  stats.value.averageLifespan = totalLifespan / organisms.length;
  stats.value.averageLegLength = totalLegLength / organisms.length;
  stats.value.averageVision = totalVision / organisms.length;
  stats.value.averageEfficiency = totalEfficiency / organisms.length;
  
  // En yaygın rengi bul
  let maxCount = 0;
  let dominantColorKey = '';
  
  for (const key in colorCounts) {
    if (colorCounts[key] > maxCount) {
      maxCount = colorCounts[key];
      dominantColorKey = key;
    }
  }
  
  if (dominantColorKey) {
    const [r, g, b] = dominantColorKey.split('-').map(v => parseInt(v) / 5);
    stats.value.dominantColor = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
    
    // Dominant renk adı
    if (r > 0.6 && g > 0.6 && b > 0.6) {
      stats.value.dominantColorName = 'Beyaz';
    } else if (r < 0.3 && g < 0.3 && b < 0.3) {
      stats.value.dominantColorName = 'Siyah';
    } else if (r > 0.6 && g < 0.4 && b < 0.4) {
      stats.value.dominantColorName = 'Kırmızı';
    } else if (r < 0.4 && g > 0.6 && b < 0.4) {
      stats.value.dominantColorName = 'Yeşil';
    } else if (r < 0.4 && g < 0.4 && b > 0.6) {
      stats.value.dominantColorName = 'Mavi';
    } else if (r > 0.6 && g > 0.5 && b < 0.3) {
      stats.value.dominantColorName = 'Sarı';
    } else if (r < 0.3 && g > 0.5 && b > 0.5) {
      stats.value.dominantColorName = 'Turkuaz';
    } else if (r > 0.5 && g < 0.3 && b > 0.5) {
      stats.value.dominantColorName = 'Mor';
    } else if (r > 0.5 && g > 0.3 && b < 0.3) {
      stats.value.dominantColorName = 'Turuncu';
    } else if (r > 0.4 && g > 0.3 && b > 0.2) {
      stats.value.dominantColorName = 'Kahverengi';
    } else {
      stats.value.dominantColorName = 'Karışık';
    }
  }
};

// Animasyon döngüsü
const animate = () => {
  if (!isRunning.value) return;
  
  // Zaman farkını hesapla
  const deltaTime = Math.min(0.1, clock.getDelta());
  
  // Kontrolü güncelle
  controls.update();
  
  // Organizmaları güncelle
  organisms.forEach(organism => {
    organism.update(deltaTime);
  });
  
  // Yırtıcıları güncelle
  predators.forEach(predator => {
    predator.update(deltaTime);
  });
  
  // Besinleri güncelle
  foods.forEach(food => {
    food.update();
  });
  
  // İstatistikleri güncelle
  updateStats();
  
  // Pencere boyutu güncellemeleri kontrol et
  updateRendererSize();
  
  // Render
  renderer.render(scene, camera);
  
  // Bir sonraki frame'i çiz
  animationId = requestAnimationFrame(animate);
};

// Renderer boyutunu güncelle
const updateRendererSize = () => {
  const container = document.getElementById('simulation-container');
  
  if (container && renderer) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (camera.aspect !== width / height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }
};

// Ayarlar değişince çevreyi güncelle
watch(() => settings.value.terrainType, (newVal, oldVal) => {
  if (newVal !== oldVal && isInitialized.value) {
    createTerrain();
    
    // Arazi değişince renk adaptasyonunu yeniden hesapla
    organisms.forEach(organism => {
      updateEnvironmentalAdaptation(organism);
    });
  }
});

// Yırtıcı sayısı değişince güncelle
watch(() => settings.value.predatorCount, (newVal, oldVal) => {
  if (newVal !== oldVal && isInitialized.value) {
    // Önceki yırtıcıları temizle
    predators.forEach(predator => {
      if (predator.body) scene.remove(predator.body);
    });
    
    predators = [];
    createPredators();
  }
});

// Besin miktarı değişince güncelle
watch(() => settings.value.foodAmount, (newVal, oldVal) => {
  if (newVal !== oldVal && isInitialized.value) {
    const currentFoodCount = foods.length;
    const targetFoodCount = Math.floor(newVal / 2);
    
    if (targetFoodCount > currentFoodCount) {
      // Yeni besinler ekle
      for (let i = 0; i < targetFoodCount - currentFoodCount; i++) {
        const food = new Food();
        foods.push(food);
      }
    } else if (targetFoodCount < currentFoodCount) {
      // Fazla besinleri kaldır
      for (let i = 0; i < currentFoodCount - targetFoodCount; i++) {
        if (foods.length > 0) {
          const food = foods.pop();
          scene.remove(food.mesh);
        }
      }
    }
  }
});

// Başlangıç popülasyonu değiştiğinde (simülasyon çalışırken)
watch(() => settings.value.initialPopulation, (newVal, oldVal) => {
  if (newVal !== oldVal && isInitialized.value && !isRunning.value) {
    // Simülasyon çalışmıyorsa popülasyonu güncelle
    // Organizmaları temizle
    organisms.forEach(organism => {
      if (organism.body) scene.remove(organism.body);
    });
    
    organisms = [];
    createInitialPopulation();
  }
});

// Sıcaklık değişimini izle
watch(() => settings.value.temperature, (newVal, oldVal) => {
  if (newVal !== oldVal && isInitialized.value) {
    // Sıcaklık değişince gökyüzü rengini değiştir
    const hue = 210; // Mavi renk tonu
    const saturation = 70; // Sabit doygunluk
    
    // Sıcaklığa göre gökyüzü parlaklığı
    const lightness = 60 + (newVal - 50) * 0.3;
    
    // HSL renk formatı
    const skyColor = new THREE.Color().setHSL(hue/360, saturation/100, lightness/100);
    scene.background = skyColor;
    
    // Işık yoğunluğunu değiştir
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    lights.forEach(light => {
      if (light instanceof THREE.DirectionalLight) {
        // Güneş ışığı yoğunluğu
        light.intensity = 0.5 + (newVal / 100) * 0.8;
      }
    });
  }
});

// Türleri izleme sistemi
const updateSpeciesRegistry = (organism, isAlive, action = null) => {
  // Organizmanın rengine göre tür belirleme
  const colorKey = `${Math.floor(organism.genes.color.r * 5)}-${Math.floor(organism.genes.color.g * 5)}-${Math.floor(organism.genes.color.b * 5)}`;
  
  // Eğer bu tür daha önce kaydedilmemişse, kaydet
  if (!stats.value.speciesRegistry[colorKey]) {
    const colorHex = `rgb(${Math.floor(organism.genes.color.r * 255)}, ${Math.floor(organism.genes.color.g * 255)}, ${Math.floor(organism.genes.color.b * 255)})`;
    const colorName = getColorName(organism.genes.color.r, organism.genes.color.g, organism.genes.color.b);
    
    stats.value.speciesRegistry[colorKey] = {
      colorKey,
      colorHex,
      colorName,
      firstSeen: stats.value.generation,
      lastSeen: stats.value.generation,
      count: 0,
      totalBorn: 0,
      totalDied: 0,
      legLength: 0,
      vision: 0,
      efficiency: 0,
      isExtinct: false,
      successRate: {
        evade: 0,
        food: 0,
        adaptation: 0
      },
      samples: []
    };
  }
  
  const species = stats.value.speciesRegistry[colorKey];
  species.lastSeen = stats.value.generation;
  
  if (isAlive) {
    // Yeni doğan veya hala hayatta
    species.count++;
    
    // Eğer bu tür ilk kez görülüyorsa veya sayısı yeniden artmaya başladıysa ve tükenmiş olarak işaretlenmişse
    if (species.isExtinct) {
      species.isExtinct = false;
      // Tükenmiş türler listesinden çıkar (isteğe bağlı)
      // stats.value.extinctSpecies = stats.value.extinctSpecies.filter(s => s.colorKey !== colorKey);
    }
    
    // Özellikleri güncelle
    species.legLength = (species.legLength * species.samples.length + organism.genes.legLength) / (species.samples.length + 1);
    species.vision = (species.vision * species.samples.length + organism.genes.vision) / (species.samples.length + 1);
    species.efficiency = (species.efficiency * species.samples.length + organism.genes.efficiency) / (species.samples.length + 1);
    
    // Örnek olarak ekle (en fazla 10 örnek tutalım)
    if (species.samples.length < 10) {
      species.samples.push(organism);
    }
    
    // Başarı oranlarını güncelle
    if (action) {
      if (action === 'evade') {
        species.successRate.evade = Math.min(100, species.successRate.evade + 5);
        stats.value.predatorEvasion = calculateOverallSuccessRate('evade');
      } else if (action === 'food') {
        species.successRate.food = Math.min(100, species.successRate.food + 3);
        stats.value.foodFinding = calculateOverallSuccessRate('food');
      }
      
      // Çevreye uyum durumunu güncelle
      updateEnvironmentalAdaptation(organism);
    }
  } else {
    // Ölen bir organizma
    species.count--;
    species.totalDied++;
    
    // Bu türün bireyleri kalmadıysa, tükenmiş olarak işaretle
    if (species.count <= 0) {
      species.isExtinct = true;
      species.count = 0;
      
      // Tükenmiş türler listesine ekle
      const description = getSpeciesDescription(species);
      
      stats.value.extinctSpecies.push({
        colorKey,
        colorHex: species.colorHex,
        colorName: species.colorName,
        generation: stats.value.generation,
        legLength: species.legLength,
        vision: species.vision,
        efficiency: species.efficiency,
        description
      });
    }
  }
  
  // Baskın türü güncelle
  updateDominantSpecies();
};

// Renk adı belirle
const getColorName = (r, g, b) => {
  if (r > 0.6 && g > 0.6 && b > 0.6) return 'Beyaz';
  if (r < 0.3 && g < 0.3 && b < 0.3) return 'Siyah';
  if (r > 0.6 && g < 0.4 && b < 0.4) return 'Kırmızı';
  if (r < 0.4 && g > 0.6 && b < 0.4) return 'Yeşil';
  if (r < 0.4 && g < 0.4 && b > 0.6) return 'Mavi';
  if (r > 0.6 && g > 0.5 && b < 0.3) return 'Sarı';
  if (r < 0.3 && g > 0.5 && b > 0.5) return 'Turkuaz';
  if (r > 0.5 && g < 0.3 && b > 0.5) return 'Mor';
  if (r > 0.5 && g > 0.3 && b < 0.3) return 'Turuncu';
  if (r > 0.4 && g > 0.3 && b > 0.2) return 'Kahverengi';
  return 'Karışık';
};

// Tür açıklaması oluştur
const getSpeciesDescription = (species) => {
  let traits = [];
  
  if (species.legLength > 2) traits.push('hızlı');
  else if (species.legLength < 1) traits.push('yavaş');
  
  if (species.vision > 15) traits.push('keskin görüşlü');
  else if (species.vision < 8) traits.push('zayıf görüşlü');
  
  if (species.efficiency > 1.5) traits.push('verimli');
  else if (species.efficiency < 0.8) traits.push('verimsiz');
  
  if (traits.length === 0) return 'Ortalama özellikler';
  return traits.join(', ');
};

// Baskın türü güncelle
const updateDominantSpecies = () => {
  let maxCount = 0;
  let dominant = null;
  
  for (const key in stats.value.speciesRegistry) {
    const species = stats.value.speciesRegistry[key];
    if (!species.isExtinct && species.count > maxCount) {
      maxCount = species.count;
      dominant = species;
    }
  }
  
  if (dominant) {
    stats.value.dominantSpecies = {
      colorHex: dominant.colorHex,
      colorName: dominant.colorName,
      legLength: dominant.legLength,
      vision: dominant.vision,
      efficiency: dominant.efficiency,
      count: dominant.count
    };
  }
};

// Çevreye uyum durumunu güncelle
const updateEnvironmentalAdaptation = (organism) => {
  // Organizmanın arka plana uyumunu hesapla
  let adaptationScore = 0;
  
  const terrainType = settings.value.terrainType;
  const color = organism.genes.color;
  
  // Farklı arazi tiplerine göre uyum değerlendirme
  if (terrainType === 'forest') {
    // Orman için yeşil tonları avantajlı
    if (color.g > color.r && color.g > color.b) {
      adaptationScore = 80 + Math.min(20, (color.g - Math.max(color.r, color.b)) * 100);
    } else {
      adaptationScore = Math.max(10, 50 - (Math.max(color.r, color.b) - color.g) * 100);
    }
  } else if (terrainType === 'desert') {
    // Çöl için sarı-kahverengi tonları avantajlı
    if (color.r > 0.5 && color.g > 0.3 && color.b < 0.4) {
      adaptationScore = 70 + Math.min(30, ((color.r + color.g) / 2 - color.b) * 50);
    } else {
      adaptationScore = Math.max(10, 50 - (color.b - Math.min(color.r, color.g)) * 100);
    }
  } else if (terrainType === 'snow') {
    // Kar için beyaz tonları avantajlı
    const whiteness = (color.r + color.g + color.b) / 3;
    if (whiteness > 0.7) {
      adaptationScore = 70 + Math.min(30, (whiteness - 0.7) * 100);
    } else {
      adaptationScore = Math.max(10, 60 * whiteness);
    }
  }
  
  // Çevreye uyum durumunu güncelle
  const colorKey = `${Math.floor(color.r * 5)}-${Math.floor(color.g * 5)}-${Math.floor(color.b * 5)}`;
  if (stats.value.speciesRegistry[colorKey]) {
    stats.value.speciesRegistry[colorKey].successRate.adaptation = adaptationScore;
  }
  
  // Genel uyum durumunu güncelle
  stats.value.environmentalAdaptation = calculateOverallSuccessRate('adaptation');
};

// Avcı istatistiklerini güncelle
const updatePredatorStats = (organism) => {
  // Avlanan organizmanın türünü bul
  const colorKey = `${Math.floor(organism.genes.color.r * 5)}-${Math.floor(organism.genes.color.g * 5)}-${Math.floor(organism.genes.color.b * 5)}`;
  
  if (stats.value.speciesRegistry[colorKey]) {
    // Bu türün avcılardan kaçma başarısını düşür
    stats.value.speciesRegistry[colorKey].successRate.evade = Math.max(0, stats.value.speciesRegistry[colorKey].successRate.evade - 10);
    
    // Genel kaçış oranını güncelle
    stats.value.predatorEvasion = calculateOverallSuccessRate('evade');
  }
};

// Başarı oranlarını hesapla
const calculateOverallSuccessRate = (type) => {
  let totalScore = 0;
  let totalSpecies = 0;
  
  for (const key in stats.value.speciesRegistry) {
    const species = stats.value.speciesRegistry[key];
    if (!species.isExtinct && species.count > 0) {
      totalScore += species.successRate[type] * species.count;
      totalSpecies += species.count;
    }
  }
  
  return totalSpecies > 0 ? Math.round(totalScore / totalSpecies) : 50;
};
</script>
