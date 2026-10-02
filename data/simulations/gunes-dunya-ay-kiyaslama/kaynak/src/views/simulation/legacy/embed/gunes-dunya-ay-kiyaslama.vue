<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col">


    <!-- Main content -->
    <div class="flex flex-col md:flex-row flex-1">
      <!-- Simulation container -->
      <div class="flex-1 relative">
        <!-- Simulation canvas -->
        <div ref="canvasContainer" class="w-full h-full" :style="VIDEO_MOD ? 'position:fixed;inset:0' : ''">
          <canvas ref="canvas" class="w-full h-full"></canvas>
        </div>

        <!-- Scale indicator -->
        <div v-if="!VIDEO_MOD" class="absolute bottom-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded">
          <div class="flex items-center">
            <span class="text-sm">Ölçek: 1:</span>
            <span class="ml-1 text-sm font-bold">{{ formatScale(currentScale) }}</span>
          </div>
        </div>


        
        <!-- Animation Progress -->
        <div v-if="!VIDEO_MOD && animationActive" class="absolute bottom-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded">
          <div class="text-sm">
            {{ currentAnimatedBody ? currentAnimatedBody.name : 'Başlatılıyor...' }}
          </div>
          <div class="w-full bg-gray-700 rounded-full h-1.5 mt-1">
            <div class="bg-blue-500 h-1.5 rounded-full" :style="`width: ${(animationProgress * 100)}%`"></div>
          </div>
        </div>
      </div>

      <!-- Control panel -->
      <div v-if="!VIDEO_MOD" class="w-full md:w-80 p-4 bg-gray-800 h-screen overflow-y-auto">
        
        <!-- Animation controls -->
        <div class="mb-6 p-3 bg-indigo-900 bg-opacity-40 rounded">
          <h3 class="font-bold mb-3 text-indigo-300">Animasyon</h3>
          
          <button 
            @click="startAnimation" 
            class="w-full py-2 px-4 mb-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition duration-200"
            :disabled="animationActive"
          >
            {{ animationActive ? 'Animasyon Sürüyor...' : 'Similasyonu Başlat' }}
          </button>
          
          <div v-if="!animationActive" class="space-y-3">
            <div>
              <label class="block mb-2 text-sm font-medium">Animasyon Hızı</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                v-model="animationSpeed" 
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              >
              <div class="flex justify-between text-xs mt-1">
                <span>Yavaş</span>
                <span>Hızlı</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Scale slider -->
        <div class="mb-6">
          <label class="block mb-2 text-sm font-medium">Ölçek</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            v-model="scaleSlider" 
            @input="updateScale"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          >
          <div class="flex justify-between text-xs mt-1">
            <span>Gerçek Oran</span>
            <span>Görülebilir</span>
          </div>
        </div>

        <!-- Celestial bodies selection -->
        <div class="mb-6">
          <label class="block mb-2 text-sm font-medium">Gökcisimleri</label>
          <div class="space-y-2">
            <div v-for="body in celestialBodies" :key="body.id" class="flex items-center">
              <input 
                type="checkbox" 
                :id="body.id" 
                v-model="body.visible"
                @change="updateSimulation"
                class="w-4 h-4 rounded bg-gray-700 border-gray-600"
              >
              <label :for="body.id" class="ml-2 text-sm font-medium">
                {{ body.name }}
                <span class="text-xs opacity-70">({{ body.diameter }} km)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Display options -->
        <div class="mb-6">
          <label class="block mb-2 text-sm font-medium">Görüntüleme Ayarları</label>
          <div class="space-y-2">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="showLabels" 
                v-model="showLabels"
                @change="updateLabels"
                class="w-4 h-4 rounded bg-gray-700 border-gray-600"
              >
              <label for="showLabels" class="ml-2 text-sm font-medium">İsimleri Göster</label>
            </div>
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="showAxes" 
                v-model="showAxes"
                @change="toggleAxes"
                class="w-4 h-4 rounded bg-gray-700 border-gray-600"
              >
              <label for="showAxes" class="ml-2 text-sm font-medium">Eksenleri Göster</label>
            </div>
          </div>
        </div>

        <!-- Info panel -->
        <div v-if="selectedBody" class="mt-6 p-3 bg-gray-700 rounded">
          <h3 class="font-bold mb-2">{{ selectedBody.name }}</h3>
          <p class="text-sm mb-1">Çap: {{ formatNumber(selectedBody.diameter) }} km</p>
          <p class="text-sm mb-1">Dünya'ya oranı: {{ selectedBody.id === 'earth' ? '1x' : `${timesLargerThanEarth(selectedBody.diameter)}x` }}</p>
          <p class="text-sm mb-1">Sıralama: {{ getSizeRanking(selectedBody) }}</p>
          <p class="text-sm mb-1">Tür: {{ selectedBody.type }}</p>
          <p class="text-sm">{{ selectedBody.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { useSimKontrol, VIDEO_MOD } from '../../../../composables/useSimKontrol.js';

// References
const canvas = ref(null);
const canvasContainer = ref(null);

// Three.js objects
let scene = null;
let camera = null;
let renderer = null;
let labelRenderer = null;
let controls = null;
let axesHelper = null;
let ambientLight = null;
let bodyObjects = {};
let labelObjects = {};

// Room elements (walls, floor, ceiling)
let room = null;

// Simulation parameters
const scaleSlider = ref(50);
const currentScale = ref(1);
const selectedBody = ref(null);
const showLabels = ref(true);
const showAxes = ref(false);

// Animation parameters
const animationActive = ref(false);
const animationSpeed = ref(5);
const animationProgress = ref(0);
const currentAnimatedBody = ref(null);
let animationTimer = null;

// Raycaster for object selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Celestial bodies data with real diameters (km)
const celestialBodies = reactive([
  { 
    id: 'moon', 
    name: 'Ay', 
    diameter: 3474, 
    color: '#D6D6D6', 
    visible: true, 
    type: 'Uydu',
    description: 'Dünya\'nın doğal uydusu, Güneş Sistemi\'ndeki beşinci büyük uydudur.' 
  },
  { 
    id: 'earth', 
    name: 'Dünya', 
    diameter: 12742, 
    color: '#4B6CB7', 
    visible: true, 
    type: 'Gezegen',
    description: 'Güneş Sistemi\'nde Güneş\'e olan uzaklığa göre üçüncü gezegen ve yaşam barındırdığı bilinen tek gök cismidir.' 
  },
  { 
    id: 'sun', 
    name: 'Güneş', 
    diameter: 1392700, 
    color: '#FDB813', 
    visible: true, 
    type: 'Yıldız',
    description: 'Güneş Sistemi\'nin merkezindeki yıldız ve Dünya\'daki yaşamın birincil enerji kaynağıdır.' 
  }
]);

// Earth diameter for comparison
const earthDiameter = 12742;

// Calculate times larger than Earth
function timesLargerThanEarth(diameter) {
  return (diameter / earthDiameter).toFixed(1);
}

// Format large numbers with comma separators
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format scale for display
function formatScale(scale) {
  return Math.round(scale).toLocaleString();
}

// Update scale based on slider value
function updateScale() {
  // Modified exponential scaling to make the differences smaller
  currentScale.value = Math.pow(8, (scaleSlider.value / 100));
  updateSimulation();
}

// Handle window resize
function handleResize() {
  if (!renderer || !camera || !labelRenderer) return;
  
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  
  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Update renderers
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
  
  // Update room size
  updateRoom();
}

// Create the room (walls, floor, ceiling)
function createRoom() {
  if (room) {
    scene.remove(room);
  }
  
  room = new THREE.Group();
  
  const width = 1000;
  const height = 1000;
  const depth = 1000;
  
  const backgroundColor = new THREE.Color('#111827'); // Same as bg-gray-900
  
  // Create walls, floor, and ceiling
  const wallGeometry = new THREE.PlaneGeometry(width, height);
  const wallMaterial = new THREE.MeshBasicMaterial({ 
    color: backgroundColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  
  // Back wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.z = -depth/2;
  room.add(backWall);
  
  // Front wall
  const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
  frontWall.position.z = depth/2;
  frontWall.rotation.y = Math.PI;
  room.add(frontWall);
  
  // Left wall
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.x = -width/2;
  leftWall.rotation.y = Math.PI/2;
  room.add(leftWall);
  
  // Right wall
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.x = width/2;
  rightWall.rotation.y = -Math.PI/2;
  room.add(rightWall);
  
  // Floor
  const floor = new THREE.Mesh(wallGeometry, wallMaterial);
  floor.position.y = -height/2;
  floor.rotation.x = Math.PI/2;
  room.add(floor);
  
  // Ceiling
  const ceiling = new THREE.Mesh(wallGeometry, wallMaterial);
  ceiling.position.y = height/2;
  ceiling.rotation.x = -Math.PI/2;
  room.add(ceiling);
  
  scene.add(room);
}

// Update room size based on objects
function updateRoom() {
  if (!room) return;
  
  // Room will automatically adjust with camera
}

// Toggle axes visibility
function toggleAxes() {
  if (!axesHelper) return;
  
  axesHelper.visible = showAxes.value;
}

// Create label for a celestial body
function createLabel(body) {
  const div = document.createElement('div');
  div.className = 'text-white text-center text-xs bg-gray-800 bg-opacity-70 px-2 py-1 rounded';
  
  // Add Earth size comparison
  const earthSizeComparison = body.id === 'earth' 
    ? '' 
    : ` (${timesLargerThanEarth(body.diameter)}x Dünya)`;
  
  div.textContent = `${body.name}${earthSizeComparison}`;
  
  const label = new CSS2DObject(div);
  label.position.set(0, 1.2, 0); // Position above the sphere
  
  return label;
}

// Update labels visibility
function updateLabels() {
  for (const id in labelObjects) {
    if (labelObjects[id]) {
      labelObjects[id].visible = showLabels.value && celestialBodies.find(body => body.id === id)?.visible;
    }
  }
}

// Update simulation with visible bodies
function updateSimulation() {
  if (!scene) return;
  
  // Clear existing bodies
  for (const id in bodyObjects) {
    if (bodyObjects[id]) {
      scene.remove(bodyObjects[id]);
      if (labelObjects[id]) {
        bodyObjects[id].remove(labelObjects[id]);
      }
    }
  }
  
  bodyObjects = {};
  labelObjects = {};
  
  // Find maximum diameter for scaling
  const visibleBodies = celestialBodies.filter(body => body.visible);
  if (visibleBodies.length === 0) return;
  
  // Sort bodies by size (smallest to largest)
  const sortedBodies = [...visibleBodies].sort((a, b) => a.diameter - b.diameter);
  
  const maxDiameter = Math.max(...sortedBodies.map(body => body.diameter));
  const baseSize = 5; // Reduced base size for the largest object
  const scale = baseSize / maxDiameter;
  
  // Create and position bodies
  let xOffset = 0;
  const yPosition = 0;
  const zPosition = 0;
  let spacing = 1; // Reduced spacing between objects
  
  for (const celestialBody of sortedBodies) {
    const radius = (celestialBody.diameter * scale * currentScale.value) / 2;
    // Minimum radius to ensure smaller bodies are still visible
    const displayRadius = Math.max(radius, 0.05);
    
    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(displayRadius, 32, 32);
    
    // Create material
    let material;
    if (celestialBody.id === 'sagittariusA') {
      // Special material for black hole
      material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(celestialBody.color),
        transparent: true,
        opacity: 0.8
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(celestialBody.color),
        roughness: 0.7,
        metalness: 0.2,
        transparent: animationActive.value,
        opacity: 1
      });
    }
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xOffset, yPosition, zPosition);
    mesh.userData.celestialBody = celestialBody;
    
    // Add label
    const label = createLabel(celestialBody);
    mesh.add(label);
    labelObjects[celestialBody.id] = label;
    label.visible = showLabels.value;
    
    // Add to scene
    scene.add(mesh);
    bodyObjects[celestialBody.id] = mesh;
    
    // If this is during animation and not the current body being shown, start with scale 0
    if (animationActive.value && currentAnimatedBody.value !== celestialBody) {
      mesh.scale.set(1, 1, 1); // Normal scale for existing bodies
    }
    
    // Update offset for next body
    xOffset += displayRadius * 2 + spacing;
  }
  
  // Center the entire group
  const totalWidth = xOffset - spacing;
  const startX = -totalWidth / 2;
  
  let currentX = startX;
  for (const celestialBody of sortedBodies) {
    const body = bodyObjects[celestialBody.id];
    if (body) {
      const radius = body.geometry.parameters.radius;
      body.position.x = currentX + radius;
      currentX += radius * 2 + spacing;
    }
  }
  
  // Update room to fit objects
  updateRoom();
}

// Handle object click
function handleClick(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = canvas.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(Object.values(bodyObjects));
  
  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.userData.celestialBody) {
      selectedBody.value = object.userData.celestialBody;
    }
  } else {
    selectedBody.value = null;
  }
}

// Start animation sequence
function startAnimation() {
  if (animationActive.value) return;
  
  // Reset animation progress
  animationProgress.value = 0;
  animationActive.value = true;
  
  // Hide all celestial bodies initially
  celestialBodies.forEach(body => {
    body.visible = false;
  });
  
  // Update simulation to clear all bodies
  updateSimulation();
  
  // Sort bodies by size (smallest to largest)
  const sortedBodies = [...celestialBodies].sort((a, b) => a.diameter - b.diameter);
  
  // Determine delay between each body appearance
  const baseDelay = 11 - animationSpeed.value; // 1-10 speed range converted to 10-1 delay range
  const delayBetweenBodies = baseDelay * 500; // milliseconds
  
  // Animation function to show bodies one by one
  let currentIndex = 0;
  
  const showNextBody = () => {
    if (currentIndex >= sortedBodies.length) {
      // Animation complete
      animationActive.value = false;
      currentAnimatedBody.value = null;
      return;
    }
    
    // Update progress
    animationProgress.value = currentIndex / sortedBodies.length;
    
    // Show current body
    const body = sortedBodies[currentIndex];
    currentAnimatedBody.value = body;
    body.visible = true;
    updateSimulation();
    
    // Get the created body mesh for animation
    const bodyMesh = bodyObjects[body.id];
    if (bodyMesh) {
      // Start with scale 0 and animate to full scale
      bodyMesh.scale.set(0, 0, 0);
      
      // Define animation durations
      const animDuration = Math.min(delayBetweenBodies * 0.8, 2000); // Max 2 seconds but no more than 80% of delay
      const stepTime = 16; // Approx 60fps
      const steps = animDuration / stepTime;
      let currentStep = 0;
      
      // Animate the appearance with scaling
      const scaleAnimation = () => {
        if (currentStep >= steps) {
          // Animation complete, ensure final scale is exactly 1
          bodyMesh.scale.set(1, 1, 1);
          return;
        }
        
        // Calculate current progress (ease-out effect)
        const progress = 1 - Math.pow(1 - currentStep / steps, 3); // Cubic ease out
        
        // Update scale
        bodyMesh.scale.set(progress, progress, progress);
        
        // Next step
        currentStep++;
        requestAnimationFrame(scaleAnimation);
      };
      
      // Start the scale animation
      scaleAnimation();
    }
    
    // Move to next body
    currentIndex++;
    
    // Schedule next body
    animationTimer = setTimeout(showNextBody, delayBetweenBodies);
  };
  
  // Start animation
  showNextBody();
}

// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  if (controls) controls.update();
  
  // Render scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
    if (labelRenderer) labelRenderer.render(scene, camera);
  }
}

// Initialize simulation
function initSimulation() {
  // Create scene
  scene = new THREE.Scene();
  if (!VIDEO_MOD) scene.background = new THREE.Color('#111827'); // bg-gray-900 (video modunda şeffaf)
  
  // Create camera
  const containerWidth = canvasContainer.value.clientWidth;
  const containerHeight = canvasContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(
    60, 
    containerWidth / containerHeight,
    0.01, // Reduced near plane for smaller objects
    50000
  );
  camera.position.set(0, 3, 20); // Adjusted camera position
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: VIDEO_MOD,
    preserveDrawingBuffer: VIDEO_MOD
  });
  if (VIDEO_MOD) renderer.setClearColor(0x000000, 0);
  renderer.setSize(containerWidth, containerHeight);
  renderer.setPixelRatio(VIDEO_MOD ? 1 : window.devicePixelRatio);
  
  // Create label renderer (video modunda etiketler kareye 2B olarak çizilir)
  if (!VIDEO_MOD) {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerWidth, containerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    canvasContainer.value.appendChild(labelRenderer.domElement);
  }
  
  // Create controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Create lighting
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  
  // Create axes helper
  axesHelper = new THREE.AxesHelper(20);
  axesHelper.visible = showAxes.value;
  scene.add(axesHelper);
  
  // Create room (video modunda yok: şeffaf zemin)
  if (!VIDEO_MOD) createRoom();
  
  // Setup initial bodies
  updateScale();
  
  // Add event listener for clicks
  canvas.value.addEventListener('click', handleClick);
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Start animation (video modunda kareyi zaman çizelgesi sürer)
  if (VIDEO_MOD) videoCoz();
  else animate();
}

// Cleanup on unmount
onUnmounted(() => {
  // Clear event listeners
  window.removeEventListener('resize', handleResize);
  if (canvas.value) {
    canvas.value.removeEventListener('click', handleClick);
  }
  
  // Clear animation timers
  if (animationTimer) {
    clearTimeout(animationTimer);
  }
  
  // Dispose Three.js resources
  for (const id in bodyObjects) {
    if (bodyObjects[id]) {
      bodyObjects[id].geometry.dispose();
      bodyObjects[id].material.dispose();
    }
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
  if (labelRenderer && canvasContainer.value) {
    canvasContainer.value.removeChild(labelRenderer.domElement);
  }
  
  // Clear references
  scene = null;
  camera = null;
  renderer = null;
  labelRenderer = null;
  controls = null;
  axesHelper = null;
  bodyObjects = {};
  labelObjects = {};
});

// Initialize on mount
onMounted(() => {
  // Delay initialization to ensure DOM is fully rendered
  setTimeout(initSimulation, 100);
});

// Get size ranking of celestial body among all bodies
function getSizeRanking(body) {
  const allBodies = [...celestialBodies].sort((a, b) => a.diameter - b.diameter);
  const index = allBodies.findIndex(b => b.id === body.id);
  return `${index + 1}/${allBodies.length} (Küçükten büyüğe)`;
}

/* ───────── Video modu (JSON ile yönetim) ─────────
 * Parametreler (zaman çizelgesi anahtarları):
 *   goster    ['moon','earth','sun'] dizisi — sahnede görünen cisimler (varsayılan hepsi; düzen küçükten büyüğe soldan sağa)
 *   olcek     1..100  ölçek kaydırıcısı (1 = gerçek oran, 100 = en çok büyütülmüş; varsayılan 50)
 *   ayK / dunyaK / gunesK   0..1  cismin belirme ölçeği (büyüyerek girme animasyonu için)
 *   etiketler bool   cisim isimleri + "Nx Dünya" (kareye çizilir; varsayılan false)     etiketBoyu  kare yüksekliği oranı (0.03)
 *   etiketKisa bool  yalnız isim (Nx Dünya eki yok)       isik  ortam ışığı şiddeti (0.5 varsayılan; 1.0–1.4 daha parlak)
 *   eksenler  bool   koordinat eksenleri
 *   odak      -1..2  kamera hedefi: -1 = sahne merkezi, 0 = Ay, 1 = Dünya, 2 = Güneş (aradaki sayılar iki cisim arasında kayar)
 *   mesafe    kamera uzaklığı: odak < 0 ise dünya birimi (varsayılan 20), odak >= 0 ise odaktaki cismin YARIÇAPI × mesafe
 *   yaw / pitch   kamera açıları rad (varsayılan 0 / 0.15)
 */
const videoState = { etiket: false, etiketKisa: false, isik: 0.5, etiketBoyu: 0.03, k: { moon: 1, earth: 1, sun: 1 }, odak: -1, mesafe: 20, yaw: 0, pitch: 0.15 };
let videoCoz = () => {};
const videoHazir = new Promise((r) => { videoCoz = r; });
const SIRA = ['moon', 'earth', 'sun'];
const _p = new THREE.Vector3();

function videoKamera() {
  if (!camera) return;
  const { odak, mesafe, yaw, pitch } = videoState;
  let tx = 0, d = mesafe;
  if (odak >= 0) {
    const a = Math.min(2, Math.floor(odak));
    const b = Math.min(2, a + 1);
    const u = odak - a;
    const info = (id) => {
      const m = bodyObjects[id];
      return m ? { x: m.position.x, r: m.geometry.parameters.radius } : null;
    };
    const A = info(SIRA[a]) || info(SIRA[b]);
    const B = info(SIRA[b]) || A;
    if (A) {
      tx = A.x + (B.x - A.x) * u;
      d = mesafe * (A.r + (B.r - A.r) * u);
    }
  }
  const cp = Math.cos(pitch);
  camera.position.set(tx + d * cp * Math.sin(yaw), d * Math.sin(pitch), d * cp * Math.cos(yaw));
  camera.lookAt(tx, 0, 0);
  camera.near = Math.max(0.0005, d * 0.01);
  camera.updateProjectionMatrix();
}

function videoOlcekler() {
  for (const id of SIRA) {
    const m = bodyObjects[id];
    if (m) m.scale.setScalar(Math.max(1e-4, videoState.k[id]));
  }
}

useSimKontrol({
  hazir: videoHazir,
  canvas: () => canvas.value,
  adim(dt, ciz) {
    if (!renderer || !scene || !camera) return;
    videoOlcekler();
    videoKamera();
    if (ciz) renderer.render(scene, camera);
  },
  sifirla() {
    celestialBodies.forEach((b) => { b.visible = true; });
    scaleSlider.value = 50;
    showLabels.value = true;
    showAxes.value = false;
    Object.assign(videoState, { etiket: false, etiketKisa: false, isik: 0.5, etiketBoyu: 0.03, k: { moon: 1, earth: 1, sun: 1 }, odak: -1, mesafe: 20, yaw: 0, pitch: 0.15 });
    updateScale();
    toggleAxes();
  },
  uygula(d) {
    let yeniden = false;
    if ('goster' in d) {
      const set = new Set(d.goster || []);
      celestialBodies.forEach((b) => { b.visible = set.has(b.id); });
      yeniden = true;
    }
    if ('olcek' in d) { scaleSlider.value = d.olcek; currentScale.value = Math.pow(8, d.olcek / 100); yeniden = true; }
    if (yeniden) updateSimulation();
    if ('eksenler' in d) { showAxes.value = !!d.eksenler; toggleAxes(); }
    if ('etiketler' in d) videoState.etiket = !!d.etiketler;
    if ('etiketBoyu' in d) videoState.etiketBoyu = d.etiketBoyu;
    if ('etiketKisa' in d) videoState.etiketKisa = !!d.etiketKisa;
    if ('isik' in d) { videoState.isik = d.isik; if (ambientLight) ambientLight.intensity = d.isik; }
    if ('ayK' in d) videoState.k.moon = d.ayK;
    if ('dunyaK' in d) videoState.k.earth = d.dunyaK;
    if ('gunesK' in d) videoState.k.sun = d.gunesK;
    for (const a of ['odak', 'mesafe', 'yaw', 'pitch']) if (a in d) videoState[a] = d[a];
  },
  cizim(ctx, w, h) {
    if (!videoState.etiket || !camera) return;
    const fs = Math.round(h * videoState.etiketBoyu);
    ctx.save();
    ctx.font = `700 ${fs}px "Baloo 2", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const b of celestialBodies) {
      const m = bodyObjects[b.id];
      if (!b.visible || !m || videoState.k[b.id] < 0.05) continue;
      _p.copy(m.position);
      _p.y += m.geometry.parameters.radius * videoState.k[b.id] * 1.15;
      _p.project(camera);
      if (_p.z > 1) continue;
      const x = (_p.x * 0.5 + 0.5) * w;
      const y = (-_p.y * 0.5 + 0.5) * h - fs * 0.9;
      const txt = b.id === 'earth' || videoState.etiketKisa ? b.name : `${b.name} (${timesLargerThanEarth(b.diameter)}x Dünya)`;
      const tw = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(255,250,238,0.95)';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(2, fs * 0.12);
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - fs * 0.5, y - fs * 0.75, tw + fs, fs * 1.5, fs * 0.45);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3d3a73';
      ctx.fillText(txt, x, y + fs * 0.04);
    }
    ctx.restore();
  },
});
</script>
