<template>
  <div class="w-full h-full flex flex-col md:flex-row bg-gray-900 text-white">
    <!-- Ana Simülasyon Alanı -->
    <div class="relative flex-grow flex flex-col">
      <!-- Başlat/Durdur Butonu ve Renk Seçenekleri -->
      <div class="absolute top-4 right-2 transform  z-10 flex items-center gap-4 bg-gray-800 p-2 rounded-lg shadow-lg">
        
        <div>
          <!-- Başlat/Durdur Butonu -->
          <button 
            @click="toggleAnimation" 
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200"
          >
            {{ isAnimating ? 'Durdur' : 'Başlat' }}
          </button>
        </div>

        <div class="flex flex-col items-end gap-2 w-42s">
          <!-- Işık Rengi -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-300">Işık:</span>
            <div class="flex gap-1">
              <button 
                v-for="color in ['#ffffff', '#ff0000', '#00ff00', '#0000ff']" 
                :key="color"
                @click="setLightColor(color)"
                class="w-6 h-6 rounded-full border-2 transition-all duration-200"
                :class="[
                  lightColor === color ? 'border-blue-500' : 'border-transparent',
                  color === '#ffffff' ? 'bg-white' : '',
                  color === '#ff0000' ? 'bg-red-500' : '',
                  color === '#00ff00' ? 'bg-green-500' : '',
                  color === '#0000ff' ? 'bg-blue-500' : '',
                ]"
              ></button>
            </div>
          </div>

          <!-- Cisim Rengi -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-300">Cisim:</span>
            <div class="flex gap-1">
              <button 
                v-for="color in ['#ffffff', '#ff0000', '#00ff00', '#0000ff']"
                :key="color"
                @click="setObjectColor(color)"
                class="w-6 h-6 rounded-full border-2 transition-all duration-200"
                :class="[
                  objectColor === color ? 'border-blue-500' : 'border-transparent',
                  color === '#ffffff' ? 'bg-white' : '',
                  color === '#ff0000' ? 'bg-red-500' : '',
                  color === '#00ff00' ? 'bg-green-500' : '',
                  color === '#0000ff' ? 'bg-blue-500' : '',
                ]"
              ></button>
            </div>
          </div>
        </div>
      </div>



      <!-- Simülasyon Canvas -->
      <div class="flex-grow" style="min-height: calc(100vh - 4rem);">
        <div ref="canvasContainer" class="w-full h-full"></div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// State yönetimi
const lightColor = ref('#ffffff');
const lightIntensity = ref(1.0);
const objectType = ref('cube');
const materialType = ref('standard');
const objectColor = ref('#ff0000');
const backgroundColor = ref('#000000');
const lightingType = ref('direct');
const scenario = ref('none');
const lightPosition = ref({ x: 2, y: 2, z: 2 });

// Animasyon kontrolü için state
const isAnimating = ref(false);
const showMobileSettings = ref(false);

// Bilgi panel durumu
const showInfo = ref(false);
const infoTitle = ref('');
const infoText = ref('');
const renderError = ref('');

// Three.js nesnelerini tanımlayalım
let scene, camera, renderer, composer;
let light, ambientLight, lightHelper;
let object, floor, ceiling, wallLeft, wallRight, wallBack;
let controls;
let animationFrameId = null;
const canvasContainer = ref(null);

// Işık rengi ayarlama fonksiyonu
const setLightColor = (color) => {
  lightColor.value = color;
  if (light) {
    light.color.set(color);
  }
};

// Cisim rengi ayarlama fonksiyonu
const setObjectColor = (color) => {
  objectColor.value = color;
  if (object && object.material) {
    object.material.color.set(color);
  }
};

// Işık pozisyonu ayarlama
const moveLightX = (amount) => {
  lightPosition.value.x += amount;
  updateLightPosition();
};

const moveLightY = (amount) => {
  lightPosition.value.y += amount;
  updateLightPosition();
};

const moveLightZ = (amount) => {
  lightPosition.value.z += amount;
  updateLightPosition();
};

// Işık pozisyonunu güncelleme
const updateLightPosition = () => {
  if (light) {
    light.position.set(
      lightPosition.value.x, 
      lightPosition.value.y, 
      lightPosition.value.z
    );
    if (lightHelper) {
      lightHelper.update();
    }
  }
};

// Malzeme oluşturma
const createMaterial = () => {
  let material;
  
  switch (materialType.value) {
    case 'standard':
      material = new THREE.MeshStandardMaterial({ 
        color: objectColor.value,
        roughness: 0.7,
        metalness: 0.1
      });
      break;
    case 'phong':
      material = new THREE.MeshPhongMaterial({ 
        color: objectColor.value,
        shininess: 100,
        specular: 0xffffff
      });
      break;
    case 'glass':
      material = new THREE.MeshPhysicalMaterial({ 
        color: objectColor.value,
        roughness: 0.1,
        transmission: 0.9, 
        transparent: true,
        thickness: 0.5
      });
      break;
    default:
      material = new THREE.MeshStandardMaterial({ color: objectColor.value });
  }
  
  return material;
};

// Cisim oluşturma
const createObject = () => {
  if (!scene) return;
  
  if (object) {
    scene.remove(object);
  }
  
  const material = createMaterial();
  let geometry;
  
  switch (objectType.value) {
    case 'cube':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.7, 32, 32);
      break;
    case 'prism':
      // Üçgen prizma (basit bir piramit)
      geometry = new THREE.ConeGeometry(0.7, 1.5, 3);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  object.position.set(0, 0.5, 0);
  scene.add(object);
};

// Aydınlatma güncellemesi
const updateLighting = () => {
  if (!scene) return;
  
  if (light) scene.remove(light);
  if (lightHelper) scene.remove(lightHelper);
  if (ambientLight) scene.remove(ambientLight);
  
  // Yönlü ışık oluştur
  light = new THREE.DirectionalLight(lightColor.value, lightIntensity.value);
  light.position.set(lightPosition.value.x, lightPosition.value.y, lightPosition.value.z);
  light.castShadow = true;
  
  // Gölge ayarları
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 20;
  light.shadow.camera.left = -5;
  light.shadow.camera.right = 5;
  light.shadow.camera.top = 5;
  light.shadow.camera.bottom = -5;
  
  // Işık helper'ı ekleme
  lightHelper = new THREE.DirectionalLightHelper(light, 0.5);
  
  scene.add(light);
  scene.add(lightHelper);
  
  // Ambient ışık ekleme
  if (lightingType.value === 'ambient' || lightingType.value === 'both') {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
  }
};

// Sahne arka planını güncelle
const updateBackgroundColor = () => {
  if (scene) {
    scene.background = new THREE.Color(backgroundColor.value);
  }
};

// Odayı oluşturma (tavan, taban, duvarlar)
const createRoom = () => {
  if (!scene) return;
  
  // Zemini oluştur
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: backgroundColor.value, 
    roughness: 0.8 
  });
  floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Tavan oluştur
  const ceilingGeometry = new THREE.PlaneGeometry(10, 10);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    color: backgroundColor.value, 
    roughness: 0.8 
  });
  ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  ceiling.receiveShadow = true;
  scene.add(ceiling);
  
  // Sol duvar
  const wallLeftGeometry = new THREE.PlaneGeometry(10, 4.5);
  const wallLeftMaterial = new THREE.MeshStandardMaterial({ 
    color: backgroundColor.value, 
    roughness: 0.8 
  });
  wallLeft = new THREE.Mesh(wallLeftGeometry, wallLeftMaterial);
  wallLeft.rotation.y = Math.PI / 2;
  wallLeft.position.set(-5, 2, 0);
  wallLeft.receiveShadow = true;
  scene.add(wallLeft);
  
  // Sağ duvar
  const wallRightGeometry = new THREE.PlaneGeometry(10, 4.5);
  const wallRightMaterial = new THREE.MeshStandardMaterial({ 
    color: backgroundColor.value, 
    roughness: 0.8 
  });
  wallRight = new THREE.Mesh(wallRightGeometry, wallRightMaterial);
  wallRight.rotation.y = -Math.PI / 2;
  wallRight.position.set(5, 2, 0);
  wallRight.receiveShadow = true;
  scene.add(wallRight);
  
  // Arka duvar
  const wallBackGeometry = new THREE.PlaneGeometry(10, 4.5);
  const wallBackMaterial = new THREE.MeshStandardMaterial({ 
    color: backgroundColor.value, 
    roughness: 0.8 
  });
  wallBack = new THREE.Mesh(wallBackGeometry, wallBackMaterial);
  wallBack.position.set(0, 2, -5);
  wallBack.receiveShadow = true;
  scene.add(wallBack);
};

// Duvarların rengini güncelleme
const updateRoomColors = () => {
  if (!scene) return;
  
  const color = new THREE.Color(backgroundColor.value);
  if (floor) floor.material.color = color;
  if (ceiling) ceiling.material.color = color;
  if (wallLeft) wallLeft.material.color = color;
  if (wallRight) wallRight.material.color = color;
  if (wallBack) wallBack.material.color = color;
};

// Senaryo uygulama
const applyScenario = () => {
  switch (scenario.value) {
    case 'redObject':
      // Beyaz ışık - Kırmızı cisim
      lightColor.value = '#ffffff';
      objectColor.value = '#ff0000';
      materialType.value = 'standard';
      objectType.value = 'sphere';
      lightingType.value = 'direct';
      lightPosition.value = { x: 2, y: 2, z: 2 };
      
      showInfo.value = true;
      infoTitle.value = 'Beyaz Işık - Kırmızı Cisim';
      infoText.value = 'Beyaz ışık, bütün görünür dalga boylarını içerir. Kırmızı cisim ise sadece kırmızı ışığı yansıtıp diğer renkleri emer. Bu yüzden beyaz ışık altında kırmızı görünür.';
      break;
      
    case 'yellowBlue':
      // Mavi ışık - Sarı cisim
      lightColor.value = '#0000ff';
      objectColor.value = '#ffff00';
      materialType.value = 'standard';
      objectType.value = 'cube';
      lightingType.value = 'direct';
      
      showInfo.value = true;
      infoTitle.value = 'Mavi Işık - Sarı Cisim';
      infoText.value = 'Sarı cisim, kırmızı ve yeşil ışığı yansıtır, mavi ışığı emer. Mavi ışık altında sarı cisim, mavi ışığı emdiği için siyaha yakın koyu görünür.';
      break;
      
    case 'prism':
      // Prizma - Işık spektrumu
      lightColor.value = '#ffffff';
      objectColor.value = '#ffffff';
      materialType.value = 'glass';
      objectType.value = 'prism';
      lightingType.value = 'both';
      
      showInfo.value = true;
      infoTitle.value = 'Prizma - Işık Spektrumu';
      infoText.value = 'Prizma, beyaz ışığı farklı dalga boylarına (renklere) ayırır. Bu, ışığın farklı renklerin karışımı olduğunu gösterir. Her renk, prizma içinde farklı açılarda kırılarak ayrışır.';
      break;
      
    case 'reflection':
      // Yansıma farklılıkları
      lightColor.value = '#ffffff';
      objectColor.value = '#0000ff';
      materialType.value = 'phong';
      objectType.value = 'sphere';
      lightingType.value = 'direct';
      
      showInfo.value = true;
      infoTitle.value = 'Yansıma Farklılıkları';
      infoText.value = 'Parlak yüzeyler ışığı büyük oranda düzenli yansıtır ve parlak noktalar oluşturur. Mat yüzeyler ise ışığı dağınık yansıtır. Aynalar düzgün yansıma yaparken, pürüzlü yüzeyler dağınık yansıma yapar.';
      break;
      
    default:
      showInfo.value = false;
  }
  
  // Sahneyi güncelle
  updateLightPosition();
  createObject();
  updateLighting();
};

// Animasyon kontrolü
const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value;
  if (isAnimating.value) {
    animate();
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
};

// Animasyon döngüsü
const animate = () => {
  if (!isAnimating.value) return;
  
  animationFrameId = requestAnimationFrame(animate);
  
  if (object) {
    object.rotation.y += 0.005;
  }
  
  if (controls) {
    controls.update();
  }
  
  if (composer) {
    composer.render();
  } else if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// Simülasyonu sıfırlama
const resetSimulation = () => {
  // Animasyonu durdur
  isAnimating.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  renderError.value = '';
  // Renderer ve kontrolleri temizle
  if (controls) {
    controls.dispose();
  }
  
  if (renderer) {
    renderer.dispose();
    if (canvasContainer.value && renderer.domElement) {
      canvasContainer.value.removeChild(renderer.domElement);
    }
  }
  
  // Three.js sahnesini tekrar başlat
  nextTick(() => {
    try {
      initThreeJs();
    } catch (error) {
      console.error("Simülasyon yeniden başlatılamadı:", error);
      renderError.value = "Simülasyon yeniden başlatılırken bir hata oluştu: " + error.message;
    }
  });
};

// Three.js sahnesi başlatma
const initThreeJs = () => {
  try {
    if (!canvasContainer.value) {
      console.error("Canvas container bulunamadı!");
      renderError.value = "Simülasyon için gerekli HTML elemanı bulunamadı.";
      return;
    }

    // Sahne oluştur
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor.value);
    
    // Kamera oluştur
    const containerWidth = canvasContainer.value.clientWidth || 800;
    const containerHeight = canvasContainer.value.clientHeight || 600;
    const aspectRatio = containerWidth / containerHeight;
    
    console.log("Container boyutları:", containerWidth, containerHeight);
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 100);
    camera.position.set(3, 2, 3);
    
    // Renderer oluştur
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Mevcut canvas'ı temizle ve yenisini ekle
    while (canvasContainer.value.firstChild) {
      canvasContainer.value.removeChild(canvasContainer.value.firstChild);
    }
    canvasContainer.value.appendChild(renderer.domElement);
    
    // WebGL desteğini kontrol et
    if (!renderer.capabilities.isWebGL2) {
      console.warn("WebGL 2 desteği bulunamadı, WebGL 1 kullanılıyor.");
    }
    
    // Post-processing ekle
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom efekti ekle
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(containerWidth, containerHeight),
      0.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    composer.addPass(bloomPass);
    
    // Orbit controls ekle
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    
    // Odayı oluştur
    createRoom();
    
    // Işığı ekle
    updateLighting();
    
    // Cismi ekle
    createObject();
    
    // Animasyon döngüsünü başlat
    animate();
    
    // Pencere yeniden boyutlandırma işleyicisi
    const handleResize = () => {
      if (!canvasContainer.value || !renderer || !camera || !composer) return;
      
      const newWidth = canvasContainer.value.clientWidth;
      const newHeight = canvasContainer.value.clientHeight;
      
      if (newWidth === 0 || newHeight === 0) {
        console.warn("Container boyutları sıfır:", newWidth, newHeight);
        return;
      }
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Temizleme fonksiyonu güncellendi
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (controls) {
        controls.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (canvasContainer.value && renderer.domElement) {
          canvasContainer.value.removeChild(renderer.domElement);
        }
      }
    });
    
  } catch (error) {
    console.error("Three.js başlatılırken hata oluştu:", error);
    renderError.value = "Simülasyon yüklenirken bir hata oluştu: " + error.message;
  }
};

// Watch işlevleri
watch(lightColor, () => {
  if (light) {
    light.color.set(lightColor.value);
  }
});

watch(lightIntensity, () => {
  if (light) {
    light.intensity = lightIntensity.value;
  }
});

watch(objectType, createObject);
watch(materialType, createObject);
watch(objectColor, () => {
  if (object && object.material) {
    object.material.color.set(objectColor.value);
  }
});

watch(backgroundColor, () => {
  updateBackgroundColor();
  updateRoomColors();
});

watch(lightingType, updateLighting);

// Component kurulduğunda Three.js sahnesini başlat
onMounted(() => {
  console.log("Component mounted");
  
  // Önce DOM'un render olmasını bekle, sonra Three.js'i başlat
  nextTick(() => {
    try {
      console.log("Canvas container mevcut:", !!canvasContainer.value);
      initThreeJs();
    } catch (error) {
      console.error("Three.js başlatılırken hata oluştu:", error);
      renderError.value = "Simülasyon yüklenirken bir hata oluştu: " + error.message;
    }
  });
});
</script>

<style>
/* Canvas için ek stiller */
canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Sayfa yüksekliğini tam ekran yap */
html, body, #app, .v-application, .v-application__wrap {
  height: 100%;
}
</style>
