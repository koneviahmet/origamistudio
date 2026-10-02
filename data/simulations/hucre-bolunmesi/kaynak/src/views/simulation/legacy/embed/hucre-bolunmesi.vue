<template>
  <div class="w-full h-screen bg-gray-900 relative">
    <!-- Başlat/Durdur Butonu -->
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <button 
        @click="toggleSimulation" 
        class="px-6 py-2 rounded-lg font-semibold text-white"
        :class="isSimulationRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
      >
        {{ isSimulationRunning ? 'Durdur' : 'Başlat' }}
      </button>
    </div>

    <!-- Mobil Ayarlar Butonu -->
    <div class="md:hidden absolute top-4 left-4 z-10">
      <button 
        @click="showMobileSettings = !showMobileSettings"
        class="p-2 rounded-lg bg-gray-800 text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>

    <!-- Similasyon Alanı -->
    <div class="w-full h-full" ref="simulationContainer">
      <canvas ref="threeCanvas" class="w-full h-full"></canvas>
    </div>

    <!-- Ayarlar Paneli - Desktop -->
    <div 
      class="hidden md:block absolute top-0 right-0 w-80 bg-gray-800 bg-opacity-90 p-4  h-screen overflow-auto pb-20"
    >
      <div class="space-y-4">
        
        <!-- Kamera Kontrolleri -->
        <div class="space-y-2">
          <h3 class="text-white font-semibold">Kamera Görünümü</h3>
          <div class="grid grid-cols-2 gap-2">
            <button 
              v-for="view in cameraViews" 
              :key="view.name"
              @click="setCameraView(view.position)"
              class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              {{ view.name }}
            </button>
            <button 
              @click="resetCamera"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm col-span-2"
            >
              Kamerayı Sıfırla
            </button>
          </div>
        </div>

        <!-- Mevcut Ayarlar -->
        <div class="space-y-4">
          <!-- Arkaplan Renk Seçimi -->
          <div class="space-y-2">
            <label class="text-white">Arkaplan Rengi:</label>
            <div class="grid grid-cols-3 gap-2">
              <div 
                v-for="(color, index) in backgroundColors" 
                :key="'bg-' + index"
                :style="{ backgroundColor: color.hex }"
                @click="selectedBackgroundIndex = index"
                class="w-8 h-8 rounded-full cursor-pointer border-2"
                :class="selectedBackgroundIndex === index ? 'border-white' : 'border-transparent'"
              ></div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="divisionSpeed" class="text-white">Bölünme Hızı:</label>
            <input 
              id="divisionSpeed" 
              v-model="divisionSpeed" 
              type="range" 
              min="1" 
              max="10" 
              class="w-full accent-blue-500"
            />
            <span class="text-white text-sm">{{ divisionSpeed }} (hız faktörü)</span>
          </div>
          
          <!-- Bakteri Renk Seçimi -->
          <div class="flex flex-col gap-2">
            <label for="bacteriaColor" class="text-white">Bakteri Rengi:</label>
            <div class="grid grid-cols-4 gap-2">
              <div 
                v-for="(color, index) in availableColors" 
                :key="index"
                :style="{ backgroundColor: color.hex }"
                @click="selectedColorIndex = index"
                class="w-8 h-8 rounded-full cursor-pointer border-2"
                :class="selectedColorIndex === index ? 'border-white' : 'border-transparent'"
              ></div>
            </div>
            <span class="text-white text-sm">{{ availableColors[selectedColorIndex].name }}</span>
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="cameraSpeed" class="text-white">Kamera Dönüş Hızı:</label>
            <input 
              id="cameraSpeed" 
              v-model="cameraRotationSpeed" 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              class="w-full accent-blue-500"
            />
            <span class="text-white text-sm">{{ cameraRotationSpeed }}</span>
          </div>
          
          <div class="flex items-center mt-2">
            <input 
              id="autoRotate" 
              v-model="autoRotateCamera" 
              type="checkbox" 
              class="mr-2 accent-blue-500"
            />
            <label for="autoRotate" class="text-white">Otomatik Kamera Dönüşü</label>
          </div>
        </div>

        <!-- Ayarları Sıfırla -->
        <button 
          @click="resetAllSettings"
          class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg mt-4"
          :disabled="!hasSettingsChanged"
        >
          Ayarları Sıfırla
        </button>
      </div>
    </div>

    <!-- Mobil Ayarlar Modal -->
    <div 
      v-if="showMobileSettings"
      class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4 pb-20"
    >
      <div class="bg-gray-800 w-full max-w-md rounded-lg p-4 h-full overflow-y-auto">
        <!-- Mobil ayarlar içeriği - Desktop ile aynı -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Ayarlar</h2>
          <button 
            @click="showMobileSettings = false"
            class="text-white hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Ayarlar içeriği buraya -->
        <div class="space-y-4">
          <!-- Arkaplan Renk Seçimi -->
          <div class="space-y-2">
            <label class="text-white">Arkaplan Rengi:</label>
            <div class="grid grid-cols-3 gap-2">
              <div 
                v-for="(color, index) in backgroundColors" 
                :key="'bg-' + index"
                :style="{ backgroundColor: color.hex }"
                @click="selectedBackgroundIndex = index"
                class="w-8 h-8 rounded-full cursor-pointer border-2"
                :class="selectedBackgroundIndex === index ? 'border-white' : 'border-transparent'"
              ></div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="divisionSpeed" class="text-white">Bölünme Hızı:</label>
            <input 
              id="divisionSpeed" 
              v-model="divisionSpeed" 
              type="range" 
              min="1" 
              max="10" 
              class="w-full accent-blue-500"
            />
            <span class="text-white text-sm">{{ divisionSpeed }} (hız faktörü)</span>
          </div>
          
          <!-- Bakteri Renk Seçimi -->
          <div class="flex flex-col gap-2">
            <label for="bacteriaColor" class="text-white">Bakteri Rengi:</label>
            <div class="grid grid-cols-4 gap-2">
              <div 
                v-for="(color, index) in availableColors" 
                :key="index"
                :style="{ backgroundColor: color.hex }"
                @click="selectedColorIndex = index"
                class="w-8 h-8 rounded-full cursor-pointer border-2"
                :class="selectedColorIndex === index ? 'border-white' : 'border-transparent'"
              ></div>
            </div>
            <span class="text-white text-sm">{{ availableColors[selectedColorIndex].name }}</span>
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="cameraSpeed" class="text-white">Kamera Dönüş Hızı:</label>
            <input 
              id="cameraSpeed" 
              v-model="cameraRotationSpeed" 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              class="w-full accent-blue-500"
            />
            <span class="text-white text-sm">{{ cameraRotationSpeed }}</span>
          </div>
          
          <div class="flex items-center mt-2">
            <input 
              id="autoRotate" 
              v-model="autoRotateCamera" 
              type="checkbox" 
              class="mr-2 accent-blue-500"
            />
            <label for="autoRotate" class="text-white">Otomatik Kamera Dönüşü</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Referanslar
const threeCanvas = ref(null);
const simulationContainer = ref(null);
const divisionSpeed = ref(2);
const isSimulationRunning = ref(false);
const bacteriaCount = ref(1);
const maxBacteriaCount = 64; // Maksimum bakteri sayısı
const simulationComplete = ref(false); // Simülasyon tamamlandı mı?
const generationCount = ref(1); // Bakterilerin kaçıncı nesil olduğunu takip eder
const autoRotateCamera = ref(true); // Kamera otomatik dönsün mü?
const cameraRotationSpeed = ref(0.8); // Kamera dönüş hızı

// Renk seçenekleri
const availableColors = [
  { name: 'Mavi', hex: '#3498DB', value: 0x3498db },
  { name: 'Kırmızı', hex: '#e74c3c', value: 0xe74c3c },
  { name: 'Yeşil', hex: '#2ecc71', value: 0x2ecc71 },
  { name: 'Sarı', hex: '#f1c40f', value: 0xf1c40f },
  { name: 'Mor', hex: '#9b59b6', value: 0x9b59b6 },
  { name: 'Turuncu', hex: '#e67e22', value: 0xe67e22 },
  { name: 'Pembe', hex: '#fd79a8', value: 0xfd79a8 },
  { name: 'Turkuaz', hex: '#1abc9c', value: 0x1abc9c }
];

const selectedColorIndex = ref(0); // Varsayılan olarak ilk renk seçili
const selectedColor = computed(() => availableColors[selectedColorIndex.value].value);

// Arkaplan renk seçenekleri
const backgroundColors = [
  { name: 'Koyu Mavi', hex: '#1a1a2e', value: 0xd1fae5 },
  { name: 'Koyu Gri', hex: '#1f2937', value: 0x1f2937 },
  { name: 'Koyu Yeşil', hex: '#064e3b', value: 0x064e3b },
  { name: 'Koyu Mor', hex: '#3c096c', value: 0x3c096c },
  { name: 'Koyu Kırmızı', hex: '#7f1d1d', value: 0x7f1d1d },
  { name: 'Koyu Turkuaz', hex: '#164e63', value: 0x164e63 }
];

const selectedBackgroundIndex = ref(0); // Varsayılan arkaplan rengi

// Three.js değişkenleri
let scene, camera, renderer, controls;
let bacteria = [];
let animationFrameId;
let lastDivisionTime = 0;
let divisionInterval = 2000; // ms cinsinden bölünme aralığı

// Bakteri objesi
class Bacterium {
  constructor(position, size = 1, color = selectedColor.value, generation = 1) {
    this.mesh = new THREE.Group();
    this.size = size;
    this.originalSize = size; // Orijinal büyüklüğü saklayalım
    this.position = position || new THREE.Vector3(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.color = color;
    this.dividing = false;
    this.children = [];
    this.divisionProgress = 0;
    this.generation = generation;
    
    // Hareket için gerekli değişkenler
    this.isWaiting = false;
    this.waitTime = 0;
    this.isMoving = false;
    this.targetPosition = null;
    this.moveSpeed = 0.2;
    this.moveProgress = 0;
    this.moveDuration = 5; // Hareket süresi (saniye)
    this.startPosition = null;
    
    // Bölünme ve büyüme için gerekli değişkenler
    this.canDivide = true;
    this.divisionCooldown = 0;
    this.divisionCooldownTime = 5 + Math.random() * 3; // 5-8 saniye arası bölünme bekleme süresi
    this.isNewCell = false; // Yeni oluşan hücre mi?
    this.parentPosition = null; // Ebeveyn hücrenin pozisyonu
    
    // Büyüme durumu için yeni değişkenler
    this.isGrowing = false; // Büyüme aşamasında mı?
    this.growthProgress = 0; // Büyüme ilerlemesi
    this.growthRate = 0.15; // Büyüme hızı
    this.currentScale = 1.0; // Mevcut ölçek
    
    // Ana bakteri geometrisi
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
      color: this.color,
      specular: 0x555555,
      shininess: 30
    });
    this.body = new THREE.Mesh(geometry, material);
    this.mesh.add(this.body);
    
    // Yeni hücre geometrisi (bölünme için)
    this.newCell = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.1, 32, 32),
      new THREE.MeshPhongMaterial({ 
        color: this.color,
        specular: 0x555555,
        shininess: 30
      })
    );
    this.newCell.visible = false;
    this.mesh.add(this.newCell);
    
    // Bakterinin küçük çıkıntıları
    this.addDetails();
    
    // Son güncelleme zamanı
    this.lastUpdateTime = 0;
  }
  
  addDetails() {
    // Bakterinin yüzeyine küçük çıkıntılar ekle
    for (let i = 0; i < 10; i++) {
      const detail = new THREE.Mesh(
        new THREE.SphereGeometry(this.size * 0.15, 8, 8),
        new THREE.MeshPhongMaterial({ color: this.color })
      );
      
      // Rastgele pozisyon
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = 2 * Math.PI * Math.random();
      
      detail.position.x = this.size * Math.sin(phi) * Math.cos(theta);
      detail.position.y = this.size * Math.sin(phi) * Math.sin(theta);
      detail.position.z = this.size * Math.cos(phi);
      
      this.body.add(detail);
    }
  }
  
  startDivision() {
    if (this.dividing || this.isWaiting || this.isMoving || !this.canDivide) return;
    
    // Sadece tam büyümüş hücreler bölünebilir
    if (this.isGrowing || this.currentScale < 0.95) return;
    
    this.dividing = true;
    this.divisionProgress = 0;
    
    // Bölünme sırasında çıkış yönünü belirle
    const phi = Math.acos(-1 + (2 * Math.random()));
    const theta = 2 * Math.PI * Math.random();
    
    // Hücrenin yüzeyinde bir nokta
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);
    
    // Çıkış yönünü kaydet
    this.exitDirection = new THREE.Vector3(x, y, z).normalize();
  }
  
  // Rastgele bir hedef pozisyon belirle
  setRandomTargetPosition() {
    // Mevcut pozisyondan rastgele bir yönde 5-10 birim uzaklıkta bir hedef belirle
    const randomDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize();
    
    const distance = 5 + Math.random() * 5; // 5-10 birim arası
    
    this.targetPosition = new THREE.Vector3().copy(this.mesh.position);
    this.targetPosition.add(randomDirection.multiplyScalar(distance));
    
    // Sınırları kontrol et (bakterilerin çok uzağa gitmesini engelle)
    const maxDistance = 20;
    if (this.targetPosition.length() > maxDistance) {
      this.targetPosition.normalize().multiplyScalar(maxDistance);
    }
    
    this.startPosition = new THREE.Vector3().copy(this.mesh.position);
    this.moveProgress = 0;
  }
  
  // Ebeveyn hücreden uzaklaşma yönü belirle
  setDirectionFromParent() {
    if (!this.parentPosition) return;
    
    // Ebeveyn hücreden uzaklaşma yönü
    const direction = new THREE.Vector3().subVectors(
      this.mesh.position,
      this.parentPosition
    ).normalize();
    
    // Biraz rastgelelik ekle
    direction.x += (Math.random() - 0.5) * 0.3;
    direction.y += (Math.random() - 0.5) * 0.3;
    direction.z += (Math.random() - 0.5) * 0.3;
    direction.normalize();
    
    const distance = 8 + Math.random() * 4; // 8-12 birim arası
    
    this.targetPosition = new THREE.Vector3().copy(this.mesh.position);
    this.targetPosition.add(direction.multiplyScalar(distance));
    
    // Sınırları kontrol et
    const maxDistance = 20;
    if (this.targetPosition.length() > maxDistance) {
      this.targetPosition.normalize().multiplyScalar(maxDistance);
    }
    
    this.startPosition = new THREE.Vector3().copy(this.mesh.position);
    this.moveProgress = 0;
  }
  
  update(deltaTime) {
    // Bölünme soğuma süresini güncelle
    if (!this.canDivide) {
      this.divisionCooldown -= deltaTime;
      if (this.divisionCooldown <= 0) {
        this.canDivide = true;
      }
    }
    
    // Eğer beklemede ise
    if (this.isWaiting) {
      this.waitTime -= deltaTime;
      
      // Bekleme süresi bittiyse, büyüme moduna geç
      if (this.waitTime <= 0) {
        this.isWaiting = false;
        
        // Eğer yeni hücre ise veya bölünme sonrası küçüldüyse, büyümeye başla
        if (this.currentScale < 0.95) {
          this.isGrowing = true;
          
          // Eğer yeni oluşan hücre ise hareket etmeye başla
          if (this.isNewCell) {
            this.isMoving = true;
            if (this.parentPosition) {
              this.setDirectionFromParent();
            } else {
              this.setRandomTargetPosition();
            }
          }
        }
      }
      
      // Küçük bir titreşim hareketi ekle (bekleme sırasında)
      const oscillation = Math.sin(Date.now() * 0.003) * 0.02;
      this.mesh.position.y += oscillation;
      
      return false;
    }
    
    // Büyüme durumunu kontrol et
    if (this.isGrowing) {
      // Büyüme hızını güncelle (division speed'e bağlı olarak)
      const growthSpeed = this.growthRate * divisionSpeed.value;
      
      // Büyüme ilerlemesini güncelle
      this.growthProgress += deltaTime * growthSpeed;
      
      // Yeni ölçeği hesapla (0.5'ten 1.0'a)
      this.currentScale = 0.5 + (this.growthProgress * 0.5);
      
      if (this.currentScale >= 1.0) {
        // Büyüme tamamlandı
        this.currentScale = 1.0;
        this.isGrowing = false;
        this.growthProgress = 0;
      }
      
      // Bakterinin boyutunu güncelle
      this.body.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }
    
    // Eğer hareket ediyorsa
    if (this.isMoving) {
      // Hareket ilerlemesini güncelle
      this.moveProgress += deltaTime / this.moveDuration;
      
      if (this.moveProgress >= 1) {
        // Hareket tamamlandı
        this.isMoving = false;
        this.mesh.position.copy(this.targetPosition);
        // Artık yeni hücre değil
        this.isNewCell = false;
        return false;
      }
      
      // Yumuşak hareket için easing fonksiyonu (yavaş başla, yavaş bitir)
      const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easedProgress = easeInOut(this.moveProgress);
      
      // Başlangıç ve hedef pozisyon arasında interpolasyon yap
      const newPosition = new THREE.Vector3().lerpVectors(
        this.startPosition,
        this.targetPosition,
        easedProgress
      );
      
      // Pozisyonu güncelle
      this.mesh.position.copy(newPosition);
      
      // Hareket sırasında hafif bir salınım ekle
      const oscillation = Math.sin(Date.now() * 0.002) * 0.03 * (1 - easedProgress);
      this.mesh.position.y += oscillation;
      
      return false;
    }
    
    // Bölünme anında
    if (this.dividing) {
      this.divisionProgress += deltaTime * divisionSpeed.value * 0.5;
      
      if (this.divisionProgress >= 1) {
        // Bölünme tamamlandı
        return true;
      }
      
      // Bölünme animasyonu - hücre küçülecek
      const shrinkScale = 1.0 - (this.divisionProgress * 0.5); // 1'den 0.5'e
      this.currentScale = shrinkScale;
      
      // Ana hücreyi küçült
      this.body.scale.set(shrinkScale, shrinkScale, shrinkScale);
      
      return false;
    }
    
    return false;
  }
  
  divide() {
    // Ana hücre (mevcut hücre) ve yeni hücre
    const parentPosition = new THREE.Vector3().copy(this.mesh.position);
    
    // Ana hücre - mevcut pozisyonda kalır
    const parentBacterium = new Bacterium(
      new THREE.Vector3().copy(parentPosition),
      this.originalSize * 0.95,
      this.color,
      this.generation
    );
    
    // Bölünme sonrası, hücre küçülmüş durumda başlar
    parentBacterium.currentScale = 0.5;
    parentBacterium.body.scale.set(0.5, 0.5, 0.5);
    
    // Bekleme süresini ayarla
    parentBacterium.isWaiting = true;
    parentBacterium.waitTime = 0.5 + Math.random(); // 0.5-1.5 saniye bekle
    
    // Bölünme sonrası soğuma süresi
    parentBacterium.canDivide = false;
    parentBacterium.divisionCooldown = parentBacterium.divisionCooldownTime;
    
    // Yeni hücre - çıkış yönünde oluşur
    const childPosition = new THREE.Vector3().copy(parentPosition).add(
      this.exitDirection.clone().multiplyScalar(this.originalSize * 0.5) 
    );
    
    const childBacterium = new Bacterium(
      childPosition,
      this.originalSize * 0.95,
      this.color, 
      this.generation + 1
    );
    
    // Yeni hücre için küçük başlangıç boyutu
    childBacterium.currentScale = 0.5;
    childBacterium.body.scale.set(0.5, 0.5, 0.5);
    
    // Yeni hücre için bekleme ve hareket ayarları
    childBacterium.isWaiting = true;
    childBacterium.waitTime = 1 + Math.random(); // 1-2 saniye bekle
    childBacterium.isNewCell = true;
    childBacterium.parentPosition = new THREE.Vector3().copy(parentPosition);
    childBacterium.canDivide = false;
    childBacterium.divisionCooldown = childBacterium.divisionCooldownTime;
    
    // Nesil sayısını güncelle
    if (childBacterium.generation > generationCount.value) {
      generationCount.value = childBacterium.generation;
    }
    
    this.children = [parentBacterium, childBacterium];
    return this.children;
  }
}

// Three.js sahnesini başlat
const initScene = () => {
  // Boyutu al
  const container = simulationContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Sahne
  scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColors[selectedBackgroundIndex.value].value);
  
  // Kamera
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 10, 20);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas: threeCanvas.value,
    antialias: true 
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Kontroller
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false; // Başlangıçta otomatik dönüş kapalı
  controls.autoRotateSpeed = 0.5; // Dönüş hızı
  
  // Işıklar
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(10, 10, 10);
  scene.add(directionalLight1);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-10, 5, -10);
  scene.add(directionalLight2);
  
  // Taban
  const floorGeometry = new THREE.PlaneGeometry(50, 50);
  const floorMaterial = new THREE.MeshPhongMaterial({ 
    color: backgroundColors[selectedBackgroundIndex.value].value,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -10;
  scene.add(floor);
  
  // Arkaplan duvarları
  const wallMaterial = new THREE.MeshPhongMaterial({
    color: backgroundColors[selectedBackgroundIndex.value].value,
    transparent: true,
    opacity: 0
  });
  
  // Arka duvar
  const backWallGeometry = new THREE.PlaneGeometry(50, 20);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.z = -25;
  backWall.position.y = 0;
  scene.add(backWall);
  
  // Sol duvar
  const leftWallGeometry = new THREE.PlaneGeometry(50, 20);
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -25;
  leftWall.position.y = 0;
  scene.add(leftWall);
  
  // Sağ duvar
  const rightWallGeometry = new THREE.PlaneGeometry(50, 20);
  const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 25;
  rightWall.position.y = 0;
  scene.add(rightWall);
  
  // Tavan
  const ceilingGeometry = new THREE.PlaneGeometry(50, 50);
  const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = 10;
  scene.add(ceiling);
  
  // İlk bakteriyi ekle
  resetBacteria();
  
  // Animate fonksiyonunu başlat
  animate();
};

// Bakteri sıfırlama
const resetBacteria = () => {
  // Mevcut bakterileri temizle
  bacteria.forEach(bacterium => {
    scene.remove(bacterium.mesh);
  });
  
  bacteria = [];
  
  // İlk bakteriyi ekle - seçilen rengi kullanarak
  const firstBacterium = new Bacterium(new THREE.Vector3(0, 0, 0), 1, selectedColor.value);
  bacteria.push(firstBacterium);
  scene.add(firstBacterium.mesh);
  bacteriaCount.value = 1;
  
  // Animasyon frame'ini güncelle
  lastDivisionTime = Date.now();
};

// Similasyonu başlat
const startSimulation = () => {
  if (isSimulationRunning.value) return; // Zaten çalışıyorsa çıkış yap
  
  isSimulationRunning.value = true;
  simulationComplete.value = false;
  lastDivisionTime = Date.now();
  
  // Eğer kamera otomatik dönüş etkinse, controls.autoRotate'i devre dışı bırak
  // çünkü kendi animasyon fonksiyonumuzu kullanacağız
  controls.autoRotate = false;
  
  // Animasyonu başlat
  animate();
};

// Similasyonu durdur
const stopSimulation = () => {
  if (!isSimulationRunning.value) return; // Zaten durmuşsa çıkış yap
  
  isSimulationRunning.value = false;
  
  // Animasyon döngüsünü durdur
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Tüm bakterilerin hareketini durdur
  bacteria.forEach(bacterium => {
    bacterium.isMoving = false;
    bacterium.dividing = false;
    bacterium.isWaiting = false;
    bacterium.isGrowing = false;
  });
};

// Bakterileri güncelle
const updateBacteria = (time) => {
  if (!isSimulationRunning.value || simulationComplete.value) return;
  
  // Bakteri sayısı maksimuma ulaştıysa simülasyonu durdur
  if (bacteriaCount.value >= maxBacteriaCount) {
    console.log(`Maksimum bakteri sayısına ulaşıldı: ${bacteriaCount.value}`);
    simulationComplete.value = true;
    isSimulationRunning.value = false;
    return;
  }
  
  // Bölünme aralığını ayarla
  divisionInterval = 2000 / divisionSpeed.value;
  
  // Bölünme zamanını kontrol et
  const currentTime = Date.now();
  
  // Tüm bakterileri güncelle
  for (let i = 0; i < bacteria.length; i++) {
    const bacterium = bacteria[i];
    
    // Delta time hesapla (saniye cinsinden)
    const deltaTime = (time - bacterium.lastUpdateTime || time) / 1000;
    bacterium.lastUpdateTime = time;
    
    // Bakteriyi güncelle
    if (bacterium.dividing) {
      const divisionComplete = bacterium.update(deltaTime);
      
      if (divisionComplete) {
        // Bölünme tamamlandı, yeni bakterileri ekle
        const newBacteria = bacterium.divide();
        
        // Eski bakteriyi sahneden kaldır
        scene.remove(bacterium.mesh);
        
        // Yeni bakterileri sahneye ekle
        newBacteria.forEach(newBacterium => {
          scene.add(newBacterium.mesh);
          bacteria.push(newBacterium);
        });
        
        // Eski bakteriyi listeden kaldır
        bacteria.splice(i, 1);
        i--; // Dizin güncelleme
        
        // Bakteri sayısını güncelle
        bacteriaCount.value = bacteria.length;
        
        // Bakteri sayısı maksimuma ulaştıysa simülasyonu durdur
        if (bacteriaCount.value >= maxBacteriaCount) {
          console.log(`Maksimum bakteri sayısına ulaşıldı: ${bacteriaCount.value}`);
          simulationComplete.value = true;
          isSimulationRunning.value = false;
          return;
        }
      }
    } else {
      // Henüz bölünmüyorsa bakteriyi güncelle
      bacterium.update(deltaTime);
    }
  }
  
  // Yeni bir bölünme başlat
  if (isSimulationRunning.value && currentTime - lastDivisionTime >= divisionInterval) {
    lastDivisionTime = currentTime;
    
    // Bölünebilecek bakterileri bul (bölünmüyor, beklemede değil, hareket etmiyor, büyüme aşamasında değil ve bölünme soğuma süresi dolmuş)
    const availableBacteria = bacteria.filter(b => 
      !b.dividing && !b.isWaiting && !b.isMoving && !b.isGrowing && b.canDivide && b.currentScale >= 0.95
    );
    
    if (availableBacteria.length > 0) {
      // Rastgele bir bakteriyi seç
      const randomIndex = Math.floor(Math.random() * availableBacteria.length);
      availableBacteria[randomIndex].startDivision();
    }
  }
};

// Kamera animasyonu
const animateCamera = (time) => {
  if (!autoRotateCamera.value || !isSimulationRunning.value) return;
  
  const speed = cameraRotationSpeed.value;
  
  // Kameranın odak noktası etrafında döndürülmesi yerine farklı bir yöntem kullanalım
  // Bu şekilde OrbitControls tarafından kontrol edilen kamera ile çakışmayı önleyebiliriz
  const radius = 20;
  const angle = time * 0.0001 * speed;
  
  // Kamera pozisyonunu güncelle - dairesel bir yol üzerinde hareket ettir
  camera.position.x = Math.sin(angle) * radius;
  camera.position.z = Math.cos(angle) * radius;
  
  // Hafif bir yükseklik değişimi de ekleyelim
  camera.position.y = 10 + Math.sin(angle * 0.5) * 5;
  
  // Kameranın bakış açısını merkeze yönlendir
  camera.lookAt(0, 0, 0);
};

// Animasyon döngüsü
const animate = (time) => {
  // Eğer simülasyon durdurulmuşsa, animasyon döngüsünü durdur
  if (!isSimulationRunning.value) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    return;
  }

  animationFrameId = requestAnimationFrame(animate);
  
  // Bakterileri güncelle
  updateBacteria(time);
  
  // Kamerayı animate et
  animateCamera(time);
  
  // Kontrolleri güncelle (eğer kullanıcı manuel kontrol ediyorsa)
  if (!autoRotateCamera.value) {
    controls.update();
  }
  
  // Renderlama
  renderer.render(scene, camera);
};

// Window yeniden boyutlandırma
const handleResize = () => {
  if (!simulationContainer.value) return;
  
  const width = simulationContainer.value.clientWidth;
  const height = simulationContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
};

// Hız değişikliğini izle
watch(divisionSpeed, (newValue) => {
  // Hız değiştiğinde bölünme aralığını güncelle
  divisionInterval = 2000 / newValue;
});

// Kamera dönüş hızı değişikliğini izle
watch(cameraRotationSpeed, (newValue) => {
  // Kamera hızını güncelle
  controls.autoRotateSpeed = newValue * 2;
});

// Kamera otomatik dönüş değişikliğini izle
watch(autoRotateCamera, (newValue) => {
  // Otomatik dönüşü kontrol et
  if (!newValue) {
    // Kullanıcı kontrol edeceği zaman kontrolü OrbitControls'a devret
    controls.enabled = true;
  }
});

// Renk değişikliğini izle
watch(selectedColorIndex, () => {
  // Simulasyon çalışmıyorsa bakterilerin rengini güncelle
  if (!isSimulationRunning.value) {
    resetBacteria();
  }
});

// Arkaplan rengi değişikliğini izle
watch(selectedBackgroundIndex, (newIndex) => {
  if (scene) {
    const newColor = backgroundColors[newIndex].value;
    scene.background.setHex(newColor);
    
    // Taban ve duvarların rengini güncelle
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material.transparent) {
        object.material.color.setHex(newColor);
      }
    });
  }
});

// Yeni değişkenler ve metodlar
const showMobileSettings = ref(false);
const hasSettingsChanged = ref(false);
const defaultSettings = {
  divisionSpeed: 2,
  selectedColorIndex: 0,
  selectedBackgroundIndex: 0,
  autoRotateCamera: true,
  cameraRotationSpeed: 0.8
};

const cameraViews = [
  { name: 'Üstten Görünüm', position: { x: 0, y: 10, z: 0 } },
  { name: 'Önden Görünüm', position: { x: 0, y: 0, z: 10 } },
  { name: 'Yandan Görünüm', position: { x: 10, y: 0, z: 0 } },
  { name: 'İzometrik', position: { x: 10, y: 10, z: 10 } }
];

// Kamera kontrolü için yeni metodlar
const setCameraView = (position) => {
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(0, 0, 0);
};

const resetCamera = () => {
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
};

const toggleSimulation = () => {
  if (isSimulationRunning.value) {
    stopSimulation();
  } else {
    startSimulation();
  }
};

const resetAllSettings = () => {
  divisionSpeed.value = defaultSettings.divisionSpeed;
  selectedColorIndex.value = defaultSettings.selectedColorIndex;
  selectedBackgroundIndex.value = defaultSettings.selectedBackgroundIndex;
  autoRotateCamera.value = defaultSettings.autoRotateCamera;
  cameraRotationSpeed.value = defaultSettings.cameraRotationSpeed;
  hasSettingsChanged.value = false;
  
  if (isSimulationRunning.value) {
    stopSimulation();
  }
  resetSimulation();
};

// Ayarları izle
watch([divisionSpeed, selectedColorIndex, selectedBackgroundIndex, autoRotateCamera, cameraRotationSpeed], () => {
  hasSettingsChanged.value = 
    divisionSpeed.value !== defaultSettings.divisionSpeed ||
    selectedColorIndex.value !== defaultSettings.selectedColorIndex ||
    selectedBackgroundIndex.value !== defaultSettings.selectedBackgroundIndex ||
    autoRotateCamera.value !== defaultSettings.autoRotateCamera ||
    cameraRotationSpeed.value !== defaultSettings.cameraRotationSpeed;
});

// Komponent kurulumu
onMounted(() => {
  initScene();
  window.addEventListener('resize', handleResize);
});

// Komponent imha edildiğinde
onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
  
  // Three.js temizliği
  if (renderer) {
    renderer.dispose();
  }
});
</script>
  
 
 