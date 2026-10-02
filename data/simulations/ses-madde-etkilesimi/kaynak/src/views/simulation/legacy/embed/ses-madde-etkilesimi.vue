<template>
  <div class="flex flex-col md:flex-row h-screen overflow-auto bg-gray-900 p-4">
    <!-- Simulation Container -->
    <div 
      ref="simulationContainer" 
      class="w-full md:w-3/4 bg-gray-800 rounded-lg overflow-auto h-64 md:h-[calc(100vh-2rem)] relative"
    >
      <!-- Animation Controls -->
      <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div class="flex gap-2">
          <button 
            @click="toggleSound" 
            class="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {{ isPlaying ? 'Durdur' : 'Başlat' }}
          </button>
          <button 
            @click="toggleView" 
            class="px-4 py-2 text-sm rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            {{ is3DView ? '2D Görünüm' : '3D Görünüm' }}
          </button>
        </div>
      </div>
      <!-- Three.js will render here -->
    </div>

    <!-- Control Panel -->
    <div class="w-full md:w-1/4 bg-gray-800 rounded-lg p-4 ml-0 md:ml-4 mt-4 md:mt-0 overflow-y-auto mb-20"  :class="{'h-[calc(100vh-2rem)]': !isMobile}">

      <!-- Medium Selection -->
      <div class="bg-gray-700 p-3 rounded-lg mb-4">
        <h3 class="text-white font-semibold mb-2">Ortam</h3>
        <select 
          v-model="selectedMedium" 
          class="w-full bg-gray-800 text-white border border-gray-600 rounded p-2"
        >
          <option value="air">Hava (Gaz)</option>
          <option value="water">Su (Sıvı)</option>
          <option value="solid">Metal (Katı)</option>
        </select>
        <div class="text-xs text-gray-400 mt-1">
          <div>Ses Hızı: <span class="text-white">{{ mediumConfigs[selectedMedium].speedText }}</span></div>
        </div>
      </div>
      
      <!-- Frequency Control -->
      <div class="bg-gray-700 p-3 rounded-lg mb-4">
        <h3 class="text-white font-semibold mb-2">Frekans: {{ frequency.toFixed(1) }} Hz</h3>
        <input 
          type="range" 
          v-model.number="frequency" 
          min="0.5" 
          max="5.0" 
          step="0.1"
          class="w-full"
        />
        <div class="text-xs text-gray-400 mt-1">
          <div>Dalga Boyu (λ): <span class="text-white">{{ calculateWavelength() }}</span></div>
        </div>
      </div>

      <!-- Medium Properties -->
      <div class="bg-gray-700 p-3 rounded-lg">
        <h3 class="text-white font-semibold mb-2">Ortam Özellikleri</h3>
        <div class="text-xs text-gray-300 space-y-2">
          <div>
            <h4 class="font-medium">Gaz (Hava)</h4>
            <div>• Moleküller arası mesafe fazla</div>
            <div>• Ses hızı düşük (343 m/s)</div>
            <div>• Dalgalar daha hızlı sönümlenir</div>
          </div>
          <div>
            <h4 class="font-medium">Sıvı (Su)</h4>
            <div>• Orta yoğunlukta moleküller</div>
            <div>• Orta seviye ses hızı (1480 m/s)</div>
            <div>• Orta derecede sönümlenme</div>
          </div>
          <div>
            <h4 class="font-medium">Katı (Metal)</h4>
            <div>• Sıkı dizilmiş moleküller</div>
            <div>• Yüksek ses hızı (5120 m/s)</div>
            <div>• Dalgalar uzun mesafe yayılır</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Reactive references
const simulationContainer = ref(null);
const selectedMedium = ref('water');
const frequency = ref(2.0);
const amplitude = ref(1.0);
const isPlaying = ref(false);
const is3DView = ref(true);

// Three.js variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let animationId = null;
let soundInterval = null;
let soundSource = null;
let particles = [];
let waveLines = [];
let propagationWaves = [];
let mediumGrid = null;

// Medium configurations
const mediumConfigs = {
  air: {
    name: 'Hava (Gaz)',
    color: '#60A5FA', // blue
    particleRadius: 0.8,
    particleSpacing: 3.5,
    particleCount: { x: 20, y: 10, z: 10 },
    waveSpeed: 1.0,
    waveColor: '#3B82F6',
    attenuationRate: 0.7,
    density: 'low',
    speedText: '343 m/s'
  },
  water: {
    name: 'Su (Sıvı)',
    color: '#34D399', // green
    particleRadius: 1.0,
    particleSpacing: 2.8,
    particleCount: { x: 20, y: 10, z: 10 },
    waveSpeed: 4.3,
    waveColor: '#10B981',
    attenuationRate: 0.5,
    density: 'medium',
    speedText: '1480 m/s'
  },
  solid: {
    name: 'Metal (Katı)',
    color: '#F87171', // red
    particleRadius: 1.2,
    particleSpacing: 2.2,
    particleCount: { x: 20, y: 10, z: 10 },
    waveSpeed: 15.0,
    waveColor: '#EF4444',
    attenuationRate: 0.2,
    density: 'high',
    speedText: '5120 m/s'
  }
};

// Add new reactive property for background
const isMobile = ref(window.innerWidth < 768);

// Calculate wavelength based on frequency and medium
const calculateWavelength = () => {
  // λ = v/f where v is velocity and f is frequency
  const speedMapping = {
    'air': 343,
    'water': 1480,
    'solid': 5120
  };
  
  const speed = speedMapping[selectedMedium.value];
  const wavelength = (speed / frequency.value).toFixed(0);
  return `${wavelength} m`;
};

// Watch for changes in medium or frequency
watch([selectedMedium, frequency], () => {
  resetSimulation();
});

onMounted(() => {
  initSimulation();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cleanupSimulation();
  window.removeEventListener('resize', handleResize);
});

function initSimulation() {
  const container = simulationContainer.value;
  if (!container) return;
  
  // Get dimensions
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827); // Very dark blue/gray
  
  // Create camera
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 30, 60);
  camera.lookAt(0, 0, 0);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-1, -1, -1);
  scene.add(directionalLight2);
  
  // Create sound source
  createSoundSource();
  
  // Create medium grid
  createMediumGrid();
  
  // Create 3D axes helper
  const axesHelper = new THREE.AxesHelper(20);
  axesHelper.visible = false; // Hidden by default
  scene.add(axesHelper);
  
  // Animation loop
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Update wave propagation
    updateWavePropagation();
    
    // Render scene
    renderer.render(scene, camera);
  }
  
  animate();
}

// Create sound source
function createSoundSource() {
  // Create glowing sphere for sound source
  const geometry = new THREE.SphereGeometry(2, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color: 0xFBBF24, // yellow
    emissive: 0xF59E0B,
    emissiveIntensity: 0.8,
    shininess: 50
  });
  
  soundSource = new THREE.Mesh(geometry, material);
  soundSource.position.set(-25, 0, 0); // Left side
  scene.add(soundSource);
  
  // Add point light at sound source
  const pointLight = new THREE.PointLight(0xF59E0B, 1.0, 50);
  pointLight.position.copy(soundSource.position);
  scene.add(pointLight);
  
  // Create label for sound source
  const textCanvas = document.createElement('canvas');
  const ctx = textCanvas.getContext('2d');
  textCanvas.width = 128;
  textCanvas.height = 32;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
  
  ctx.font = 'Bold 24px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('Ses Kaynağı', textCanvas.width/2, 24);
  
  const texture = new THREE.CanvasTexture(textCanvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(soundSource.position.x, soundSource.position.y + 5, soundSource.position.z);
  sprite.scale.set(10, 2.5, 1);
  scene.add(sprite);
}

// Create medium grid
function createMediumGrid() {
  // Remove existing particles
  if (mediumGrid) {
    scene.remove(mediumGrid);
  }
  mediumGrid = new THREE.Group();
  
  for (const particle of particles) {
    scene.remove(particle);
  }
  particles = [];
  
  const config = mediumConfigs[selectedMedium.value];
  
  // Create particle material
  const material = new THREE.MeshPhongMaterial({
    color: config.color,
    shininess: 80,
    specular: 0x222222
  });
  
  // Create particle geometry
  const geometry = new THREE.SphereGeometry(config.particleRadius, 16, 16);
  
  // Grid dimensions
  const gridWidth = config.particleCount.x * config.particleSpacing;
  const gridHeight = config.particleCount.y * config.particleSpacing;
  const gridDepth = config.particleCount.z * config.particleSpacing;
  
  // Starting position (leave space for sound source on left)
  const startX = -15;
  const startY = -gridHeight / 2;
  const startZ = -gridDepth / 2;
  
  // Create particles in a 3D grid
  for (let i = 0; i < config.particleCount.x; i++) {
    for (let j = 0; j < config.particleCount.y; j++) {
      for (let k = 0; k < config.particleCount.z; k++) {
        const x = startX + i * config.particleSpacing;
        const y = startY + j * config.particleSpacing;
        const z = startZ + k * config.particleSpacing;
        
        const particle = new THREE.Mesh(geometry, material.clone());
        particle.position.set(x, y, z);
        
        // Add custom properties for wave animation
        particle.userData = {
          initialPosition: particle.position.clone(),
          originalColor: config.color,
          activeColor: new THREE.Color(config.waveColor),
          isActive: false
        };
        
        mediumGrid.add(particle);
        particles.push(particle);
      }
    }
  }
  
  scene.add(mediumGrid);
  
  // Create boundary box to visualize the medium
  const boxGeometry = new THREE.BoxGeometry(gridWidth + 10, gridHeight + 10, gridDepth + 10);
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(config.color),
    wireframe: true,
    transparent: true,
    opacity: 0.2
  });
  
  const boundaryBox = new THREE.Mesh(boxGeometry, boxMaterial);
  boundaryBox.position.set(startX + gridWidth/2 - 5, 0, 0);
  mediumGrid.add(boundaryBox);
  
  // Add medium label
  const textCanvas = document.createElement('canvas');
  const ctx = textCanvas.getContext('2d');
  textCanvas.width = 256;
  textCanvas.height = 64;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
  
  ctx.font = 'Bold 32px Arial';
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.fillText(config.name, textCanvas.width/2, 40);
  
  const texture = new THREE.CanvasTexture(textCanvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(startX + gridWidth/2, gridHeight/2 + 10, 0);
  sprite.scale.set(25, 6, 1);
  mediumGrid.add(sprite);
}

// Create propagation wave
function addPropagationWave() {
  const config = mediumConfigs[selectedMedium.value];
  
  // Create wave geometry (sphere)
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(config.waveColor),
    transparent: true,
    opacity: 0.3,
    wireframe: true
  });
  
  // Create wave mesh
  const wave = new THREE.Mesh(geometry, material);
  wave.position.copy(soundSource.position);
  
  // Add properties for animation
  wave.userData = {
    initialOpacity: 0.3,
    speed: config.waveSpeed,
    createdAt: Date.now(),
    attenuationRate: config.attenuationRate
  };
  
  scene.add(wave);
  propagationWaves.push(wave);
}

// Update wave propagation
function updateWavePropagation() {
  const now = Date.now();
  const config = mediumConfigs[selectedMedium.value];
  
  // Update existing propagation waves
  for (let i = propagationWaves.length - 1; i >= 0; i--) {
    const wave = propagationWaves[i];
    const age = (now - wave.userData.createdAt) / 1000; // Age in seconds
    
    // Calculate scale based on age and wave speed
    const scale = 1 + (age * wave.userData.speed * 10);
    wave.scale.set(scale, scale, scale);
    
    // Reduce opacity based on distance
    const opacity = Math.max(0, wave.userData.initialOpacity - (age * wave.userData.attenuationRate));
    wave.material.opacity = opacity;
    
    // Remove when invisible or too large
    if (opacity <= 0 || scale > 30) {
      scene.remove(wave);
      propagationWaves.splice(i, 1);
    }
  }
  
  // Update particle positions based on wave
  if (isPlaying.value) {
    // Pulse sound source
    const pulseScale = 1 + Math.sin(now / 200) * 0.3;
    soundSource.scale.set(pulseScale, pulseScale, pulseScale);
    
    // Calculate the wave effect for each particle
    for (const particle of particles) {
      // Original position
      const originalPos = particle.userData.initialPosition;
      
      // Direction from sound source to particle
      const direction = new THREE.Vector3()
        .subVectors(originalPos, soundSource.position)
        .normalize();
      
      // Distance from sound source
      const distance = originalPos.distanceTo(soundSource.position);
      
      // Wave parameters
      const speed = config.waveSpeed;
      const wavelength = speed / frequency.value;
      const time = now / 1000; // Time in seconds
      
      // Calculate phase based on distance and time
      const phase = (distance / wavelength) - (time * frequency.value);
      
      // Amplitude decreases with distance
      const maxDistance = 60;
      const attenuation = Math.max(0, 1 - (distance / maxDistance) * config.attenuationRate);
      
      // Calculate displacement using sine wave
      const displacement = Math.sin(phase * Math.PI * 2) * amplitude.value * attenuation * 2;
      
      // Apply displacement along direction vector
      const newPosition = originalPos.clone().add(
        direction.multiplyScalar(displacement)
      );
      
      // Update particle position
      particle.position.copy(newPosition);
      
      // Update particle color based on displacement
      const isActive = Math.abs(displacement) > 0.2;
      if (isActive !== particle.userData.isActive) {
        particle.userData.isActive = isActive;
        particle.material.color.set(
          isActive ? particle.userData.activeColor : particle.userData.originalColor
        );
      }
    }
  }
}

// Handle window resize
function handleResize() {
  const container = simulationContainer.value;
  
  if (!container || !camera || !renderer) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Update camera aspect ratio
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Update renderer size
  renderer.setSize(width, height);

  // Handle mobile detection
  isMobile.value = window.innerWidth < 768;
}

// Toggle sound wave generation
function toggleSound() {
  isPlaying.value = !isPlaying.value;
  
  if (isPlaying.value) {
    startSound();
  } else {
    stopSound();
  }
}

// Toggle between 2D and 3D views
function toggleView() {
  is3DView.value = !is3DView.value;
  
  if (is3DView.value) {
    // 3D view
    camera.position.set(0, 30, 60);
    controls.enableRotate = true;
  } else {
    // 2D view (front view)
    camera.position.set(0, 0, 60);
    camera.lookAt(0, 0, 0);
    controls.enableRotate = false;
  }
}

// Start sound wave generation
function startSound() {
  // Store initial positions
  for (const particle of particles) {
    particle.userData.initialPosition = particle.position.clone();
  }
  
  // Create waves at regular intervals
  soundInterval = setInterval(() => {
    addPropagationWave();
  }, 500); // Create a new wave every 500ms
  
  // Add initial wave
  addPropagationWave();
}

// Stop sound wave generation
function stopSound() {
  clearInterval(soundInterval);
  
  // Reset particles to initial position
  for (const particle of particles) {
    if (particle.userData.initialPosition) {
      particle.position.copy(particle.userData.initialPosition);
    }
    particle.material.color.set(particle.userData.originalColor);
    particle.userData.isActive = false;
  }
  
  // Reset sound source
  soundSource.scale.set(1, 1, 1);
}

// Reset simulation when changing parameters
function resetSimulation() {
  // Stop current sound wave generation
  if (isPlaying.value) {
    stopSound();
    isPlaying.value = false;
  }
  
  // Remove all propagation waves
  for (const wave of propagationWaves) {
    scene.remove(wave);
  }
  propagationWaves = [];
  
  // Recreate medium grid with new parameters
  createMediumGrid();
}

// Cleanup on component unmount
function cleanupSimulation() {
  // Stop animation
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // Clear intervals
  if (soundInterval) {
    clearInterval(soundInterval);
  }
  
  // Remove event listeners
  window.removeEventListener('resize', handleResize);
  
  // Clean up Three.js resources
  if (renderer) {
    const container = simulationContainer.value;
    if (container && container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  }
}

// Add new method for background color
function setBackground(type) {
  const color = type === 'dark' ? 0x111827 : 0xf3f4f6;
  if (scene) {
    scene.background = new THREE.Color(color);
  }
}
</script>
  
 
 