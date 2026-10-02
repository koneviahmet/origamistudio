<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
    
    <!-- Simulation Canvas (Full Width) -->
    <div class="relative flex-1 bg-gray-900 overflow-hidden mb-44">
      <canvas ref="canvas" class="w-full h-full"></canvas>

      <!-- Obstacle Message -->
      <div v-if="lightOn" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800 bg-opacity-60 rounded-lg text-sm">
        {{ obstacleMessage }}
      </div>

      <!-- Minimalist Controls overlay -->
      <div class="absolute top-2 right-2 p-2 bg-gray-800 bg-opacity-60 rounded-lg flex gap-2">
        <button @click="toggleLight" class="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs flex items-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM5.05 13.536a1 1 0 10-1.414 1.414l.707.707a1 1 0 101.414-1.414l-.707-.707zM15.657 14.243a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z" />
            <path fill-rule="evenodd" d="M10 4a6 6 0 100 12 6 6 0 000-12zm-8 6a8 8 0 1116 0 8 8 0 01-16 0z" clip-rule="evenodd" />
          </svg>
          {{ lightOn ? 'Kapat' : 'Aç' }}
        </button>
        <button @click="resetObjects" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs flex items-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Sıfırla
        </button>
      </div>

      <!-- Color Picker Panel -->
      <div class="absolute top-2 left-2 p-2 bg-gray-800 bg-opacity-60 rounded-lg space-y-4">

        
        <div>
          <div class="text-xs mb-2">Işık Rengi</div>
          <div class="grid grid-cols-4 gap-2">
            <button @click="setLightColor('white')" class="w-6 h-6 bg-white rounded-full border-2" :class="{'border-yellow-400': lightColor === 'white', 'border-transparent': lightColor !== 'white'}"></button>
            <button @click="setLightColor('red')" class="w-6 h-6 bg-red-500 rounded-full border-2" :class="{'border-yellow-400': lightColor === 'red', 'border-transparent': lightColor !== 'red'}"></button>
            <button @click="setLightColor('green')" class="w-6 h-6 bg-green-500 rounded-full border-2" :class="{'border-yellow-400': lightColor === 'green', 'border-transparent': lightColor !== 'green'}"></button>
            <button @click="setLightColor('blue')" class="w-6 h-6 bg-blue-500 rounded-full border-2" :class="{'border-yellow-400': lightColor === 'blue', 'border-transparent': lightColor !== 'blue'}"></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Matter from 'matter-js';

// Refs
const canvas = ref(null);
const lightOn = ref(true);
const backgroundColor = ref('white');
const lightColor = ref('white');
const originalLightColor = ref('white'); // Orijinal ışık rengini takip etmek için
const obstacleMessage = ref('Engel yok');
const lightVisible = ref(true);

// Matter.js modules
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;
const Events = Matter.Events;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Vector = Matter.Vector;

// Variables
let engine, render, runner, mouseConstraint;
let lightSource;
let walls = [];
let animationFrameId;

const obstacleColor = ref('');

// Background color mapping
const backgroundColorMap = {
  white: '#C7D9DD',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7'
};

// Light color mapping with darker variants for stroke
const lightColorMap = {
  white: { fill: '#ffffff', stroke: '#e5e5e5' },
  red: { fill: '#ef4444', stroke: '#dc2626' },
  orange: { fill: '#f97316', stroke: '#ea580c' },
  yellow: { fill: '#eab308', stroke: '#ca8a04' },
  green: { fill: '#22c55e', stroke: '#16a34a' },
  blue: { fill: '#3b82f6', stroke: '#2563eb' },
  indigo: { fill: '#6366f1', stroke: '#4f46e5' },
  purple: { fill: '#a855f7', stroke: '#9333ea' }
};

// Setup Matter.js simulation
const setupMatter = () => {
  // Create engine
  engine = Engine.create({
    positionIterations: 6,
    velocityIterations: 4
  });
  
  // Create renderer
  render = Render.create({
    canvas: canvas.value,
    engine: engine,
    options: {
      width: canvas.value.clientWidth,
      height: canvas.value.clientHeight,
      wireframes: false,
      background: backgroundColorMap[backgroundColor.value],
      showAngleIndicator: false
    }
  });
  
  // Create walls with matching background color
  const updateWallColor = () => {
    const wallOptions = { 
      isStatic: true, 
      render: { 
        fillStyle: backgroundColorMap[backgroundColor.value],
        strokeStyle: backgroundColorMap[backgroundColor.value],
        lineWidth: 1
      }
    };
    return wallOptions;
  };
  
  const wallThickness = 30;
  
  walls = [
    Bodies.rectangle(
      render.options.width / 2, 
      render.options.height + wallThickness / 2, 
      render.options.width, 
      wallThickness, 
      updateWallColor()
    ),
    Bodies.rectangle(
      render.options.width / 2, 
      -wallThickness / 2, 
      render.options.width, 
      wallThickness, 
      updateWallColor()
    ),
    Bodies.rectangle(
      -wallThickness / 2, 
      render.options.height / 2, 
      wallThickness, 
      render.options.height, 
      updateWallColor()
    ),
    Bodies.rectangle(
      render.options.width + wallThickness / 2, 
      render.options.height / 2, 
      wallThickness, 
      render.options.height, 
      updateWallColor()
    )
  ];
  
  // Create light source
  lightSource = Bodies.circle(
    render.options.width / 2, 
    render.options.height / 4, 
    20, 
    {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: lightColorMap[lightColor.value].fill,
        strokeStyle: lightColorMap[lightColor.value].stroke,
        lineWidth: 6
      }
    }
  );
  
  // Create materials
  const materialOptions = {
    restitution: 0.6,
    friction: 0.1,
    frictionAir: 0.01
  };
  
  // Kırmızı engel
  const opaqueMaterial = Bodies.rectangle(
    render.options.width / 4, 
    render.options.height / 2, 
    80, 
    80, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(239, 68, 68, 0.5)', // Kırmızı (red-500) yarı saydam
      },
      chamfer: { radius: 5 }
    }
  );
  
  // Turuncu engel
  const transparentMaterial = Bodies.rectangle(
    render.options.width / 2, 
    render.options.height / 2, 
    80, 
    80, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(249, 115, 22, 0.5)', // Turuncu (orange-500) yarı saydam
      },
      chamfer: { radius: 5 }
    }
  );
  
  // Sarı engel
  const translucentMaterial = Bodies.rectangle(
    (render.options.width / 4) * 3, 
    render.options.height / 2, 
    80, 
    80, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(234, 179, 8, 0.5)', // Sarı (yellow-500) yarı saydam
      },
      chamfer: { radius: 5 }
    }
  );
  
  // Yeşil engel
  const redMaterial = Bodies.rectangle(
    render.options.width / 2, 
    (render.options.height / 4) * 3, 
    80, 
    80, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(34, 197, 94, 0.5)', // Yeşil (green-500) yarı saydam
      },
      chamfer: { radius: 5 }
    }
  );

  // Mavi engel
  const blueMaterial = Bodies.rectangle(
    render.options.width / 6, 
    render.options.height / 3, 
    80, 
    80, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(59, 130, 246, 0.5)', // Mavi (blue-500) yarı saydam
      },
      chamfer: { radius: 5 }
    }
  );

  // Lacivert engel
  const indigoMaterial = Bodies.rectangle(
    (render.options.width / 6) * 5, 
    render.options.height / 3, 
    80, 
    80, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(99, 102, 241, 0.5)', // Lacivert (indigo-500) yarı saydam
      },
      chamfer: { radius: 5 }
    }
  );


  
  // Add bodies to world
  Composite.add(engine.world, [
    ...walls,
    lightSource,
    opaqueMaterial,
    redMaterial,
    blueMaterial,
  ]);
  
  // Add mouse control
  const mouse = Mouse.create(render.canvas);
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  });
  
  Composite.add(engine.world, mouseConstraint);
  
  // Keep the mouse in sync with rendering
  render.mouse = mouse;
  
  // Run the engine
  runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);
  
  // Start animation loop
  animateLightRays();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
};

// Check for obstacles in front of light
const checkObstacles = () => {
  if (!lightOn.value || !render || !lightSource) return;

  const bodies = Composite.allBodies(engine.world);
  let foundObstacle = false;
  let obstacleColorName = '';

  // Işık kaynağının merkez noktası
  const lightCenter = lightSource.position;
  
  // Işığın tam üzerindeki alanı kontrol et
  const tolerance = 30; // Işığın yarıçapı kadar tolerans
  
  for (let body of bodies) {
    // Işık kaynağını ve duvarları atla
    if (body === lightSource || walls.includes(body)) continue;

    // Cismin sınırlarını kontrol et
    const bounds = body.bounds;
    const bodyCenter = {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2
    };
    
    // Eğer cisim ışığın tam üzerindeyse (x ekseni üzerinde ve y ekseninde üstte)
    if (Math.abs(bodyCenter.x - lightCenter.x) < tolerance && // X ekseni kontrolü
        bodyCenter.y > lightCenter.y && // Y ekseni kontrolü (cisim ışığın üstünde)
        bodyCenter.y - lightCenter.y < 100) { // Mesafe kontrolü (100 piksel içinde)
      
      foundObstacle = true;
      // Engelin rengini al (rgba formatından renk adını çıkar)
      const colorMatch = body.render.fillStyle.match(/rgba\((.*?)\)/);
      if (colorMatch) {
        const [r, g, b] = colorMatch[1].split(',').map(n => parseInt(n));
        if (r === 239 && g === 68 && b === 68) { obstacleColor.value = 'Kırmızı'; obstacleColorName = 'red'; }
        else if (r === 249 && g === 115 && b === 22) { obstacleColor.value = 'Turuncu'; obstacleColorName = 'orange'; }
        else if (r === 234 && g === 179 && b === 8) { obstacleColor.value = 'Sarı'; obstacleColorName = 'yellow'; }
        else if (r === 34 && g === 197 && b === 94) { obstacleColor.value = 'Yeşil'; obstacleColorName = 'green'; }
        else if (r === 59 && g === 130 && b === 246) { obstacleColor.value = 'Mavi'; obstacleColorName = 'blue'; }
        else if (r === 99 && g === 102 && b === 241) { obstacleColor.value = 'Lacivert'; obstacleColorName = 'indigo'; }
        else if (r === 168 && g === 85 && b === 247) { obstacleColor.value = 'Mor'; obstacleColorName = 'purple'; }
      }
      break;
    }
  }

  // Işık rengi kontrolü ve değişimi
  if (foundObstacle) {
    obstacleMessage.value = `${obstacleColor.value} engel var`;
    
    if (originalLightColor.value === 'white') {
      // Beyaz ışık için engel rengini al
      lightSource.render.fillStyle = lightColorMap[obstacleColorName].fill;
      lightSource.render.strokeStyle = lightColorMap[obstacleColorName].stroke;
      lightColor.value = obstacleColorName;
    } else if (lightColor.value !== obstacleColorName) {
      // Farklı renkli ışık ve engel için ışığı kapat
      render.options.background = '#000000';
      lightSource.render.fillStyle = '#000000';
      lightSource.render.strokeStyle = '#000000';
      walls.forEach(wall => {
        wall.render.fillStyle = '#000000';
        wall.render.strokeStyle = '#000000';
      });
      obstacleMessage.value = 'Işık Geçirmez';
      lightVisible.value = false;
    }
  } else {
    lightVisible.value = true;
    obstacleMessage.value = 'Engel yok';
    setBackgroundColor('white');
    
    // Engel yokken ve ışık kapalıysa, ışığı orijinal renginde aç
    lightOn.value = true;
    if (!lightOn.value) {
      lightColor.value = originalLightColor.value;
      render.options.background = backgroundColorMap[backgroundColor.value];
      lightSource.render.fillStyle = lightColorMap[originalLightColor.value].fill;
      lightSource.render.strokeStyle = lightColorMap[originalLightColor.value].stroke;
      walls.forEach(wall => {
        wall.render.fillStyle = backgroundColorMap[backgroundColor.value];
        wall.render.strokeStyle = backgroundColorMap[backgroundColor.value];
      });
    } else if (lightColor.value !== originalLightColor.value) {
      // Işık orijinal renginden farklıysa orijinal rengine döndür
      lightColor.value = originalLightColor.value;
      lightSource.render.fillStyle = lightColorMap[originalLightColor.value].fill;
      lightSource.render.strokeStyle = lightColorMap[originalLightColor.value].stroke;
    }
  }
};

// Animation loop for light rays
const animateLightRays = () => {
  if (!render || !render.context) return;
  
  const ctx = render.context;
  ctx.globalCompositeOperation = 'source-over';
  
  if (lightOn.value) {
    // Draw glow around light source with current light color
    ctx.beginPath();
    const [r, g, b] = hexToRgb(lightColorMap[lightColor.value].fill);
    const gradient = ctx.createRadialGradient(
      lightSource.position.x, lightSource.position.y, 0,
      lightSource.position.x, lightSource.position.y, 100
    );

    if (lightVisible.value) {
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    }

    ctx.fillStyle = gradient;
    ctx.arc(lightSource.position.x, lightSource.position.y, 100, 0, Math.PI * 2);
    ctx.fill();
    
    // Check for obstacles
    checkObstacles();
  }
  
  // Request next frame
  animationFrameId = requestAnimationFrame(animateLightRays);
};

// Resize handler
const handleResize = () => {
  if (render) {
    render.options.width = canvas.value.clientWidth;
    render.options.height = canvas.value.clientHeight;
    render.canvas.width = canvas.value.clientWidth;
    render.canvas.height = canvas.value.clientHeight;
    
    // Reposition walls
    const wallThickness = 30;
    Body.setPosition(walls[0], {
      x: render.options.width / 2,
      y: render.options.height + wallThickness / 2
    });
    Body.setPosition(walls[1], {
      x: render.options.width / 2,
      y: -wallThickness / 2
    });
    Body.setPosition(walls[2], {
      x: -wallThickness / 2,
      y: render.options.height / 2
    });
    Body.setPosition(walls[3], {
      x: render.options.width + wallThickness / 2,
      y: render.options.height / 2
    });
    
    // Reposition light source
    Body.setPosition(lightSource, {
      x: render.options.width / 2,
      y: render.options.height / 4
    });
  }
};

// Toggle light
const toggleLight = () => {
  lightOn.value = !lightOn.value;
  
  if (!lightOn.value) {
    // Lamba kapalıyken arkaplan ve lamba siyah olsun
    render.options.background = '#000000';
    lightSource.render.fillStyle = '#000000';
    lightSource.render.strokeStyle = '#000000';
    walls.forEach(wall => {
      wall.render.fillStyle = '#000000';
      wall.render.strokeStyle = '#000000';
    });
    obstacleMessage.value = ''; // Lamba kapalıyken mesajı gizle
  } else {
    // Lamba açıkken seçili renklere geri dön
    render.options.background = backgroundColorMap[backgroundColor.value];
    lightSource.render.fillStyle = lightColorMap[lightColor.value].fill;
    lightSource.render.strokeStyle = lightColorMap[lightColor.value].stroke;
    walls.forEach(wall => {
      wall.render.fillStyle = backgroundColorMap[backgroundColor.value];
      wall.render.strokeStyle = backgroundColorMap[backgroundColor.value];
    });
  }
};

// Reset objects
const resetObjects = () => {
  if (engine) {
    Body.setPosition(opaqueMaterial, {
      x: render.options.width / 4,
      y: render.options.height / 2
    });
    Body.setPosition(transparentMaterial, {
      x: render.options.width / 2,
      y: render.options.height / 2
    });
    Body.setPosition(translucentMaterial, {
      x: (render.options.width / 4) * 3,
      y: render.options.height / 2
    });
    Body.setPosition(redMaterial, {
      x: render.options.width / 2,
      y: (render.options.height / 4) * 3
    });
    Body.setPosition(blueMaterial, {
      x: render.options.width / 6,
      y: render.options.height / 3
    });
    Body.setPosition(indigoMaterial, {
      x: (render.options.width / 6) * 5,
      y: render.options.height / 3
    });
    Body.setPosition(purpleMaterial, {
      x: render.options.width / 2,
      y: render.options.height / 6
    });
    
    // Reset velocities
    [opaqueMaterial, transparentMaterial, translucentMaterial, redMaterial, blueMaterial, indigoMaterial, purpleMaterial].forEach(material => {
      Body.setVelocity(material, { x: 0, y: 0 });
      Body.setAngularVelocity(material, 0);
    });
  }
};

// Set background color
const setBackgroundColor = (color) => {
  backgroundColor.value = color;
  if (render) {
    render.options.background = backgroundColorMap[color];
    // Update wall colors
    walls.forEach(wall => {
      wall.render.fillStyle = backgroundColorMap[color];
      wall.render.strokeStyle = backgroundColorMap[color];
    });
  }
};

// Set light color
const setLightColor = (color) => {
  lightColor.value = color;
  originalLightColor.value = color; // Orijinal rengi güncelle
  if (lightSource) {
    lightSource.render.fillStyle = lightColorMap[color].fill;
    lightSource.render.strokeStyle = lightColorMap[color].stroke;
  }
};

// Utility function to convert hex to rgb
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
};

// Lifecycle hooks
onMounted(() => {
  setupMatter();
});

onBeforeUnmount(() => {
  // Clean up
  if (runner) Runner.stop(runner);
  if (render) Render.stop(render);
  if (engine) Engine.clear(engine);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
});
</script>
  
 
 