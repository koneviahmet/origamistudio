<template>
  <div class="flex flex-col items-center p-2 w-full h-full bg-gray-50 relative">

    <div class="w-full max-w-3xl relative">

      <div ref="canvasContainer" class="w-full border border-gray-300 relative bg-blue-50 rounded-md overflow-hidden max-h-[400px]">
        <canvas ref="canvas" class="w-full"></canvas>
      </div>
      
      <div class="flex justify-between mt-2 mb-1">
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-600 mb-1">Hücre</span>
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#FF9999" />
          </svg>
        </div>
        
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-600 mb-1">Doku</span>
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="6" fill="#FFCC99" />
            <circle cx="20" cy="12" r="6" fill="#FFCC99" />
            <circle cx="12" cy="20" r="6" fill="#FFCC99" />
            <circle cx="20" cy="20" r="6" fill="#FFCC99" />
          </svg>
        </div>
        
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-600 mb-1">Organ</span>
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="8" width="20" height="16" rx="8" fill="#6699CC" stroke="#5588BB" />
          </svg>
        </div>
        
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-600 mb-1">Sistem</span>
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="10" r="5" fill="#99FF99" />
            <circle cx="16" cy="18" r="8" fill="#FF9999" stroke="#FF8888" stroke-width="0.5" />
            <path d="M16 25V32" stroke="#FFFFCC" stroke-width="1.5" />
            <path d="M13 26L19 29" stroke="#FFFFCC" stroke-width="1.5" />
            <path d="M19 26L13 29" stroke="#FFFFCC" stroke-width="1.5" />
          </svg>
        </div>
        
        <div class="flex flex-col items-center">
          <span class="text-xs text-gray-600 mb-1">Organizma</span>
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="6" r="5" fill="#99CCFF" /> <!-- Baş -->
            <rect x="10" y="11" width="12" height="14" rx="2" fill="#99CCFF" /> <!-- Gövde -->
            <rect x="4" y="13" width="6" height="3" rx="1.5" fill="#99CCFF" /> <!-- Sol kol -->
            <rect x="22" y="13" width="6" height="3" rx="1.5" fill="#99CCFF" /> <!-- Sağ kol -->
            <rect x="12" y="25" width="3" height="7" rx="1.5" fill="#99CCFF" /> <!-- Sol bacak -->
            <rect x="17" y="25" width="3" height="7" rx="1.5" fill="#99CCFF" /> <!-- Sağ bacak -->
          </svg>
        </div>
      </div>
      
      <div class="w-full bg-gray-200 rounded-full h-1.5">
        <div ref="progressBar" class="bg-blue-500 h-1.5 rounded-full" style="width: 0%"></div>
      </div>
      
      <div class="mt-3 p-3 bg-white rounded-md shadow-sm border border-gray-100">
        <h2 ref="levelTitle" class="text-lg font-semibold mb-1">Hücre</h2>
        <p ref="levelDescription" class="text-sm">
          Hücreler, yaşamın en temel birimleridir. Her hücre metabolizma, üreme ve dış çevreye tepki verebilme yeteneğine sahiptir.
        </p>
      </div>
      

      <div class="flex justify-center space-x-2 absolute top-1 right-1 z-10">
        <button 
          v-if="currentLevel >= 5"
          @click="resetSimulation" 
          class="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition text-sm"
        >
          Yeniden Başlat
        </button>
        <button 
          v-if="currentLevel < 5"
          @click="nextLevel" 
          class="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm"
        >
          İleri
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import Matter from 'matter-js';

// MatterJS bileşenleri
const { Engine, Render, Runner, World, Bodies, Composite, Body, Vector } = Matter;

// Referanslar
const canvas = ref(null);
const canvasContainer = ref(null);
const progressBar = ref(null);
const levelTitle = ref(null);
const levelDescription = ref(null);

// Durum değişkenleri
const currentLevel = ref(1);
const particles = ref([]);
const composites = ref([]); // Kompozitleri takip etmek için yeni bir referans
const engine = ref(null);
const render = ref(null);
const runner = ref(null);

// Seviye bilgileri
const levels = [
  {
    title: "Hücre ",
    description: "Hücreler, yaşamın en temel birimleridir. Her hücre metabolizma, üreme ve dış çevreye tepki verebilme yeteneğine sahiptir.",
    color: "#FF9999", // Light red
  },
  {
    title: "Doku ",
    description: "Dokular, benzer işlevleri yerine getiren benzer hücrelerin bir araya gelmesiyle oluşur. Örneğin, kas dokusu, sinir dokusu, epitel dokusu.",
    color: "#FFCC99", // Light orange
  },
  {
    title: "Organ ",
    description: "Organlar, belirli bir görev için birlikte çalışan farklı doku türlerinin bir araya gelmesiyle oluşur. Örneğin, kalp, akciğerler, beyin.",
    color: "#FFFF99", // Light yellow
  },
  {
    title: "Sistem ",
    description: "Sistemler, belirli hayati işlevleri yerine getirmek için birlikte çalışan organlardan oluşur. Örneğin, sindirim sistemi, dolaşım sistemi.",
    color: "#99FF99", // Light green
  },
  {
    title: "Organizma ",
    description: "Organizma, tüm sistemlerin birlikte çalıştığı canlı varlıktır. Bir organizma kendi başına hayatta kalabilir ve çoğalabilir.",
    color: "#99CCFF", // Light blue
  }
];

// Kurulum ve temizleme
onMounted(() => {
  setupSimulation();
});

onBeforeUnmount(() => {
  if (runner.value) {
    Matter.Runner.stop(runner.value);
  }
  if (render.value) {
    Matter.Render.stop(render.value);
  }
  if (engine.value) {
    Matter.World.clear(engine.value.world, false);
    Matter.Engine.clear(engine.value);
  }
});

// Matter.js simülasyonunu kur
function setupSimulation() {
  const containerWidth = canvasContainer.value.clientWidth;
  const containerHeight = Math.min(window.innerHeight * 0.5, 400);
  
  // Engine oluştur
  engine.value = Engine.create({
    gravity: { x: 0, y: 0.1 } // Daha hafif yerçekimi
  });
  
  // Render oluştur
  render.value = Render.create({
    canvas: canvas.value,
    engine: engine.value,
    options: {
      width: containerWidth,
      height: containerHeight,
      wireframes: false,
      background: '#EFF6FF', // Biraz daha açık arka plan rengi
    }
  });
  
  // Sınırları oluştur (Duvarlar, tavan ve zemin)
  const wallThickness = 10; // Daha ince duvarlar
  const wallColor = '#EFF6FF'; // Arka plan ile aynı renkte duvarlar
  
  const walls = [
    // Zemin
    Bodies.rectangle(containerWidth / 2, containerHeight, containerWidth, wallThickness, { 
      isStatic: true,
      render: { fillStyle: wallColor }
    }),
    // Tavan
    Bodies.rectangle(containerWidth / 2, 0, containerWidth, wallThickness, { 
      isStatic: true,
      render: { fillStyle: wallColor }
    }),
    // Sol duvar
    Bodies.rectangle(0, containerHeight / 2, wallThickness, containerHeight, { 
      isStatic: true,
      render: { fillStyle: wallColor }
    }),
    // Sağ duvar
    Bodies.rectangle(containerWidth, containerHeight / 2, wallThickness, containerHeight, { 
      isStatic: true,
      render: { fillStyle: wallColor }
    })
  ];
  
  World.add(engine.value.world, walls);
  
  // İlk seviyeyi başlat
  createCells();
  
  // Runner başlat
  runner.value = Runner.create();
  Runner.run(runner.value, engine.value);
  Render.run(render.value);
  
  // Tepkisel boyutlandırma işleyicisi
  window.addEventListener('resize', handleResize);
  handleResize();
}

function handleResize() {
  if (render.value && canvasContainer.value) {
    const containerWidth = canvasContainer.value.clientWidth;
    const containerHeight = Math.min(window.innerHeight * 0.5, 400);
    
    // Render boyutunu güncelle
    render.value.options.width = containerWidth;
    render.value.options.height = containerHeight;
    render.value.canvas.width = containerWidth;
    render.value.canvas.height = containerHeight;
    
    // Duvarların konumunu güncelle
    const walls = engine.value.world.bodies.filter(body => body.isStatic);
    if (walls.length >= 4) {
      Body.setPosition(walls[0], Vector.create(containerWidth / 2, containerHeight));
      Body.setPosition(walls[1], Vector.create(containerWidth / 2, 0));
      Body.setPosition(walls[2], Vector.create(0, containerHeight / 2));
      Body.setPosition(walls[3], Vector.create(containerWidth, containerHeight / 2));
      
      Body.setVertices(walls[0], Bodies.rectangle(containerWidth / 2, containerHeight, containerWidth, 10).vertices);
      Body.setVertices(walls[1], Bodies.rectangle(containerWidth / 2, 0, containerWidth, 10).vertices);
    }
  }
}

// Hücreler oluştur
function createCells() {
  const containerWidth = render.value.options.width;
  const containerHeight = render.value.options.height;
  
  // Önceki parçacıkları ve kompozitleri temizle
  clearSimulation();
  
  // 12 hücre oluştur (20 yerine daha az)
  for (let i = 0; i < 12; i++) {
    const cell = Bodies.circle(
      Math.random() * (containerWidth - 80) + 40,
      Math.random() * (containerHeight - 80) + 40,
      8, // Daha küçük hücreler
      {
        restitution: 0.6,
        frictionAir: 0.02,
        render: {
          fillStyle: levels[0].color
        }
      }
    );
    
    particles.value.push(cell);
  }
  
  World.add(engine.value.world, particles.value);
}

// Bir sonraki seviyeye geç
function nextLevel() {
  if (currentLevel.value < 5) {
    // Önce mevcut parçacıkları ve kompozitleri temizle
    clearSimulation();
    
    // Sonra seviyeyi arttır
    currentLevel.value++;
    updateProgressBar();
    updateLevelInfo();
    
    // Parçacıkları birleştir veya değiştir
    switch (currentLevel.value) {
      case 2: // Doku seviyesi
        createTissues();
        break;
      case 3: // Organ seviyesi
        createOrgans();
        break;
      case 4: // Sistem seviyesi
        createSystems();
        break;
      case 5: // Organizma seviyesi
        createOrganism();
        break;
    }
  }
}

// İlerleme çubuğunu güncelle
function updateProgressBar() {
  const progress = ((currentLevel.value - 1) / 4) * 100;
  progressBar.value.style.width = `${progress}%`;
}

// Seviye bilgilerini güncelle
function updateLevelInfo() {
  const level = levels[currentLevel.value - 1];
  levelTitle.value.textContent = level.title;
  levelDescription.value.textContent = level.description;
}

// Simülasyondaki tüm öğeleri temizle
function clearSimulation() {
  // Parçacıkları temizle
  if (particles.value.length > 0) {
    World.remove(engine.value.world, particles.value);
    particles.value = [];
  }
  
  // Kompozitleri temizle
  if (composites.value.length > 0) {
    composites.value.forEach(composite => {
      World.remove(engine.value.world, composite);
    });
    composites.value = [];
  }
}

// Doku seviyesi için parçacıkları birleştir
function createTissues() {
  const containerWidth = render.value.options.width;
  const containerHeight = render.value.options.height;
  
  // Önceki parçacıkları ve kompozitleri temizle
  clearSimulation();
  
  // 3 doku oluştur (her biri 4 hücreden oluşan gruplar)
  for (let i = 0; i < 3; i++) {
    const x = (containerWidth / 4) * (i + 1);
    const y = containerHeight / 2;
    
    const tissue = [];
    
    // Her doku için 4 hücre oluştur
    for (let j = 0; j < 4; j++) {
      const angle = (j / 4) * Math.PI * 2;
      const radius = 12;
      
      const cell = Bodies.circle(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        8,
        {
          restitution: 0.6,
          frictionAir: 0.05,
          render: {
            fillStyle: levels[1].color
          }
        }
      );
      
      tissue.push(cell);
    }
    
    // Dokudaki hücreleri bir arada tut
    const tissueComposite = Composite.create({ bodies: tissue });
    particles.value.push(...tissue);
    composites.value.push(tissueComposite); // Kompoziti takip et
    
    World.add(engine.value.world, tissueComposite);
  }
}

// Organ seviyesi için parçacıkları birleştir
function createOrgans() {
  const containerWidth = render.value.options.width;
  const containerHeight = render.value.options.height;
  
  // Önceki parçacıkları temizle
  clearSimulation();
  
  // Basitçe 2 dikdörtgen organ oluştur
  const organColor = "#6699CC"; // Mavi renk
  
  // 2 basit dikdörtgen organ
  for (let i = 0; i < 2; i++) {
    const x = containerWidth / 3 * (i + 1);
    const y = containerHeight / 2;
    
    // Her organ için farklı boyut
    const width = 35 + (i * 10);
    const height = 45 - (i * 5);
    
    const organ = Bodies.rectangle(
      x,
      y,
      width,
      height,
      {
        restitution: 0.3,
        frictionAir: 0.1,
        render: {
          fillStyle: organColor,
          strokeStyle: '#5588BB',
          lineWidth: 1
        }
      }
    );
    
    particles.value.push(organ);
  }
  
  World.add(engine.value.world, particles.value);
}

// Sistem seviyesi için parçacıkları birleştir
function createSystems() {
  const containerWidth = render.value.options.width;
  const containerHeight = render.value.options.height;
  
  // Önceki parçacıkları temizle
  if (particles.value.length > 0) {
    World.remove(engine.value.world, particles.value);
    particles.value = [];
  }
  
  // İnsan vücudu sistemlerini temsil eden şekil
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  // Sindirim sistemi
  for (let i = 0; i < 10; i++) {
    const y = centerY - 50 + i * 10;
    
    const cell = Bodies.circle(
      centerX,
      y,
      6,
      {
        restitution: 0.5,
        frictionAir: 0.2,
        render: {
          fillStyle: levels[3].color
        }
      }
    );
    
    particles.value.push(cell);
  }
  
  // Dolaşım sistemi
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 40;
    
    const cell = Bodies.circle(
      centerX + Math.cos(angle) * radius,
      centerY - 20 + Math.sin(angle) * radius,
      4,
      {
        restitution: 0.5,
        frictionAir: 0.2,
        render: {
          fillStyle: "#FF9999" // Kan rengi
        }
      }
    );
    
    particles.value.push(cell);
  }
  
  // Sinir sistemi
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI;
    const radius = 30 + i * 2;
    
    const cell = Bodies.circle(
      centerX + Math.cos(angle) * 10,
      centerY - 70 + i * 7,
      3,
      {
        restitution: 0.5,
        frictionAir: 0.2,
        render: {
          fillStyle: "#FFFFCC" // Sinir hücresi rengi
        }
      }
    );
    
    particles.value.push(cell);
  }
  
  World.add(engine.value.world, particles.value);
}

// Organizma seviyesi için tam bir insan şekli oluştur
function createOrganism() {
  const containerWidth = render.value.options.width;
  const containerHeight = render.value.options.height;
  
  // Önceki parçacıkları temizle
  clearSimulation();
  
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const scale = Math.min(containerWidth, containerHeight) / 400;
  
  // Baş
  const head = Bodies.circle(
    centerX,
    centerY - 70 * scale,
    25 * scale,
    {
      restitution: 0.2,
      frictionAir: 0.2,
      render: {
        fillStyle: levels[4].color
      }
    }
  );
  
  // Gövde
  const body = Bodies.rectangle(
    centerX,
    centerY,
    60 * scale,
    100 * scale,
    {
      restitution: 0.2,
      frictionAir: 0.2,
      render: {
        fillStyle: levels[4].color
      }
    }
  );
  
  // Sol kol
  const leftArm = Bodies.rectangle(
    centerX - 45 * scale,
    centerY - 20 * scale,
    40 * scale,
    15 * scale,
    {
      restitution: 0.2,
      frictionAir: 0.2,
      render: {
        fillStyle: levels[4].color
      }
    }
  );
  
  // Sağ kol
  const rightArm = Bodies.rectangle(
    centerX + 45 * scale,
    centerY - 20 * scale,
    40 * scale,
    15 * scale,
    {
      restitution: 0.2,
      frictionAir: 0.2,
      render: {
        fillStyle: levels[4].color
      }
    }
  );
  
  // Sol bacak
  const leftLeg = Bodies.rectangle(
    centerX - 20 * scale,
    centerY + 85 * scale,
    15 * scale,
    70 * scale,
    {
      restitution: 0.2,
      frictionAir: 0.2,
      render: {
        fillStyle: levels[4].color
      }
    }
  );
  
  // Sağ bacak
  const rightLeg = Bodies.rectangle(
    centerX + 20 * scale,
    centerY + 85 * scale,
    15 * scale,
    70 * scale,
    {
      restitution: 0.2,
      frictionAir: 0.2,
      render: {
        fillStyle: levels[4].color
      }
    }
  );
  
  // Tüm parçaları dünyaya ekle
  particles.value.push(head, body, leftArm, rightArm, leftLeg, rightLeg);
  World.add(engine.value.world, particles.value);
  
  // Bağlantıları oluştur
  const constraints = [
    // Baş-gövde bağlantısı
    Matter.Constraint.create({
      bodyA: head,
      bodyB: body,
      pointA: { x: 0, y: 20 * scale },
      pointB: { x: 0, y: -45 * scale },
      stiffness: 0.8,
      render: { visible: false }
    }),
    
    // Sol kol-gövde bağlantısı
    Matter.Constraint.create({
      bodyA: leftArm,
      bodyB: body,
      pointA: { x: 15 * scale, y: 0 },
      pointB: { x: -25 * scale, y: -30 * scale },
      stiffness: 0.8,
      render: { visible: false }
    }),
    
    // Sağ kol-gövde bağlantısı
    Matter.Constraint.create({
      bodyA: rightArm,
      bodyB: body,
      pointA: { x: -15 * scale, y: 0 },
      pointB: { x: 25 * scale, y: -30 * scale },
      stiffness: 0.8,
      render: { visible: false }
    }),
    
    // Sol bacak-gövde bağlantısı
    Matter.Constraint.create({
      bodyA: leftLeg,
      bodyB: body,
      pointA: { x: 0, y: -30 * scale },
      pointB: { x: -20 * scale, y: 45 * scale },
      stiffness: 0.8,
      render: { visible: false }
    }),
    
    // Sağ bacak-gövde bağlantısı
    Matter.Constraint.create({
      bodyA: rightLeg,
      bodyB: body,
      pointA: { x: 0, y: -30 * scale },
      pointB: { x: 20 * scale, y: 45 * scale },
      stiffness: 0.8,
      render: { visible: false }
    })
  ];
  
  World.add(engine.value.world, constraints);
}

// Simülasyonu sıfırla
function resetSimulation() {
  // Tüm parçacıkları ve kompozitleri temizle
  clearSimulation();
  
  // Seviyeyi sıfırla
  currentLevel.value = 1;
  updateProgressBar();
  updateLevelInfo();
  
  // Yeniden başlat
  createCells();
}
</script>
  
 
 