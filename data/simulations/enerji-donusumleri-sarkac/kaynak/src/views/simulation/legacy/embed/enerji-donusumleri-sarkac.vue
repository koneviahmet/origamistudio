<template>
  <div class="flex flex-col md:flex-row w-full h-screen bg-gray-900">
    <!-- Simulasyon Kısmı -->
    <div class="relative w-full h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
      <!-- Simulasyon Canvas -->
      <div ref="canvasContainer" class="w-full h-full bg-gray-800 overflow-hidden cursor-grab active:cursor-grabbing relative">

      
        <!-- Control Buttons - Positioned at top center of simulation -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-3">
          <button 
            v-if="!isSimulationRunning" 
            @click="startPendulum" 
            class="px-6 py-2 bg-indigo-600 text-white font-medium rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 active:translate-y-0.5 hover:bg-indigo-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
            Başlat
          </button>
          <button 
            v-if="isSimulationRunning" 
            @click="stopPendulum" 
            class="px-6 py-2 bg-red-600 text-white font-medium rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 active:translate-y-0.5 hover:bg-red-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
            </svg>
            Durdur
          </button>
        </div>

        <!-- Enerji Göstergeleri -->
        <div class="space-y-4 absolute bottom-4 lg:bottom-auto lg:top-4 left-4 w-4xl">
          <!-- Potential Energy -->
          <div class="mb-2.5">
            <div class="text-sm font-medium text-gray-300 mb-1.5 flex justify-between">
              <span>Potansiyel Enerji</span>
            </div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div ref="potentialEnergyBar" class="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-200 ease-out w-0"></div>
            </div>
          </div>
          
          <!-- Kinetic Energy -->
          <div>
            <div class="text-sm font-medium text-gray-300 mb-1.5 flex justify-between">
              <span>Kinetik Enerji</span>
            </div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div ref="kineticEnergyBar" class="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-200 ease-out w-0"></div>
            </div>
          </div>
        </div>


      </div>
    </div>


  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watchEffect } from 'vue';
import Matter from 'matter-js';

// Kütüphanenin yüklendiğini kontrol et
console.log('Matter.js version:', Matter.version);

// References for DOM elements
const canvasContainer = ref(null);
const potentialEnergyBar = ref(null);
const kineticEnergyBar = ref(null);
const potentialEnergyBarMobile = ref(null);
const kineticEnergyBarMobile = ref(null);

// Simülasyon durumunu reactive yaparak UI'ın güncellemesini sağla
const isSimulationRunning = ref(false);
const isMobileSettingsOpen = ref(false);
const currentBackground = ref('gray-800');

// Matter.js modules
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Constraint = Matter.Constraint;
const Vector = Matter.Vector;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Body = Matter.Body;
const World = Matter.World;

// Variables for the simulation
let engine;
let render;
let runner;
let pendulum;
let constraint;
let mouseConstraint;
let lowestY = 0; // Track the lowest point of the pendulum
let highestX = 0; // Track the highest x position (for reset)
const gravity = 9.81; // Gerçek yer çekimi değeri (m/s²)
const mass = 0.5; // kg
let maxEnergy = 0;
let isDragging = false;
const pendulumRadius = 30; // Store the radius for reuse
let initialHeight = 0; // Store initial height for energy conservation

// Arkaplan rengini değiştiren fonksiyon
function changeBackground(color) {
  currentBackground.value = color;
  
  if (render) {
    // Render'ın arkaplan rengini değiştir
    let bgColor = '#1f2937'; // gray-800 default
    
    if (color === 'gray-900') {
      bgColor = '#111827';
    } else if (color === 'gray-700') {
      bgColor = '#374151';
    }
    
    render.options.background = bgColor;
    
    // Duvar renklerini de arkaplan ile uyumlu yap
    if (engine && engine.world.bodies) {
      engine.world.bodies.forEach(body => {
        // Sadece duvarların rengini değiştir
        if (body.isStatic && body !== constraint) {
          body.render.fillStyle = bgColor;
        }
      });
    }
  }
}

onMounted(() => {
  // Ensure DOM is fully rendered before setting up simulation
  console.log('Component mounted');
  
  // Delay setup to ensure DOM is ready
  setTimeout(() => {
    console.log('Setting up simulation after delay...');
    console.log('Canvas container exists:', !!canvasContainer.value);
    if (canvasContainer.value) {
      console.log('Canvas dimensions:', canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
      setupSimulation();
    } else {
      console.error('Canvas container still not found after delay!');
    }
  }, 500);
});

function setupSimulation() {
  if (!canvasContainer.value) {
    console.error('Canvas container not found!');
    return;
  }

  console.log('Canvas dimensions:', canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);

  // Create engine with reduced gravity for slower motion and improved precision
  engine = Engine.create({
    gravity: {
      x: 0,
      y: gravity,
      scale: 0.001 // Ölçek faktörü
    },
    positionIterations: 12, // Arttırılmış hassasiyet (varsayılan: 6)
    velocityIterations: 8,  // Arttırılmış hassasiyet (varsayılan: 4)
    constraintIterations: 4, // Arttırılmış hassasiyet (varsayılan: 2)
    enableSleeping: false   // Uyku modunu devre dışı bırak
  });

  // Disable auto-sleep to keep the pendulum moving indefinitely
  engine.enableSleeping = false;

  // Create renderer with responsive dimensions
  const containerWidth = canvasContainer.value.clientWidth || 800;
  const containerHeight = canvasContainer.value.clientHeight || 500;
  
  render = Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: containerWidth,
      height: containerHeight,
      wireframes: false,
      background: '#1f2937', // Tailwind gray-800
      pixelRatio: window.devicePixelRatio
    }
  });

  // Calculate scaled dimensions based on container size
  const scale = Math.min(containerWidth / 800, containerHeight / 600);
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const wallThickness = 20 * scale;
  
  // Create room walls - arkaplan ile aynı renkte duvarlar
  const wallOptions = {
    isStatic: true,
    render: {
      fillStyle: '#1f2937' // Tailwind gray-800 (arkaplan ile aynı renk)
    }
  };

  const walls = [
    // Bottom wall
    Bodies.rectangle(centerX, containerHeight - wallThickness/2, containerWidth, wallThickness, wallOptions),
    // Left wall
    Bodies.rectangle(wallThickness/2, centerY, wallThickness, containerHeight, wallOptions),
    // Right wall
    Bodies.rectangle(containerWidth - wallThickness/2, centerY, wallThickness, containerHeight, wallOptions),
    // Top wall
    Bodies.rectangle(centerX, wallThickness/2, containerWidth, wallThickness, wallOptions)
  ];

  // Calculate pendulum dimensions
  const scaledPendulumRadius = pendulumRadius * scale;
  const constraintLength = 250 * scale;
  const anchorX = centerX;
  const anchorY = wallThickness + 40 * scale;

  // Create pendulum with absolutely zero friction and zero air resistance
  pendulum = Bodies.circle(centerX, centerY, scaledPendulumRadius, {
    restitution: 1, // Perfect elasticity
    friction: 0, // No friction
    frictionAir: 0, // No air resistance
    frictionStatic: 0, // No static friction
    density: 0.001 * mass,
    slop: 0, // Sıfır tolerans (varsayılan: 0.05)
    render: {
      fillStyle: '#ef4444', // Tailwind red-500
      strokeStyle: '#b91c1c', // Tailwind red-700
      lineWidth: 1
    }
  });

  // Create constraint (string) with no damping and perfect stiffness
  constraint = Constraint.create({
    pointA: { x: anchorX, y: anchorY },
    bodyB: pendulum,
    pointB: { x: 0, y: 0 },
    length: constraintLength,
    stiffness: 1, // Tam katı bağlantı (1.0)
    damping: 0, // No damping to prevent energy loss
    render: {
      strokeStyle: '#e5e7eb', // Tailwind gray-200 (ipi beyazımsı yap)
      lineWidth: 2
    }
  });

  // Add all bodies to the world
  Composite.add(engine.world, [...walls, pendulum, constraint]);

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

  // Start the renderer
  Render.run(render);
  console.log('Renderer started');

  // Create runner with fixed time step
  runner = Runner.create({
    isFixed: true, // Fixed time step
    delta: 1000 / 60 // 60 FPS
  });
  
  // Sarkaç hareketini yarı yarıya azaltmak için timeScale'i 0.5 olarak ayarla
  engine.timing.timeScale = 0.2;
  
  Runner.run(runner, engine);
  console.log('Runner started');

  // Calculate the highest possible position (maximum amplitude)
  highestX = anchorX + constraintLength - scaledPendulumRadius;
  const highestY = anchorY;
  
  // Position the pendulum at its highest point to ensure initial potential energy
  Body.setPosition(pendulum, { x: highestX, y: highestY });
  
  // Başlangıçta sarkaç statik olsun (hareket etmesin)
  pendulum.isStatic = true;
  
  // Calculate the lowest possible Y position (when pendulum is at rest)
  lowestY = constraint.pointA.y + constraint.length;
  
  // Calculate max energy (initial potential energy)
  // We'll set this after the pendulum has been positioned
  setTimeout(() => {
    const height = calculateHeight();
    maxEnergy = mass * gravity * height / 1000;
    initialHeight = height; // Başlangıç yüksekliğini kaydet
    console.log('Initial max energy:', maxEnergy);
    console.log('Initial height:', initialHeight);
    
    // Force an initial energy update
    updateEnergy();
  }, 100);

  // Handle window resize
  const handleResize = () => {
    const newWidth = canvasContainer.value.clientWidth;
    const newHeight = canvasContainer.value.clientHeight;
    
    if (render) {
      // Update renderer dimensions
      render.options.width = newWidth;
      render.options.height = newHeight;
      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      
      // Recalculate positions if needed
      // This is a simplified approach - for a complete solution, you'd need to reposition all objects
      Render.setPixelRatio(render, window.devicePixelRatio);
    }
  };
  
  window.addEventListener('resize', handleResize);

  // Update energy values on each tick and handle constant speed
  Matter.Events.on(engine, 'afterUpdate', () => {
    updateEnergy();
    correctEnergyLoss();
  });
  
  // Track when the user is dragging the pendulum
  Matter.Events.on(mouseConstraint, 'startdrag', (event) => {
    if (event.body === pendulum) {
      isDragging = true;
      // Pause physics while dragging
      pendulum.isStatic = true;
    }
  });
  
  Matter.Events.on(mouseConstraint, 'enddrag', (event) => {
    if (event.body === pendulum) {
      isDragging = false;
      // Resume physics after dragging
      pendulum.isStatic = false;
      // Sürükleme sonrası simülasyonu çalışır duruma getir
      isSimulationRunning.value = true;
      
      // Recalculate max energy based on new position
      const height = calculateHeight();
      const newMaxEnergy = mass * gravity * height / 1000;
      
      console.log('New potential height:', height);
      console.log('New max energy:', newMaxEnergy);
      
      // Sürükleme sonrası yeni maksimum enerjiyi ayarla
      // Bu, toplam enerjinin korunması için referans değer olacak
      maxEnergy = newMaxEnergy;
      initialHeight = height; // Yeni başlangıç yüksekliğini kaydet
      
      // Sürükleme sonrası hızı sıfırla
      // Böylece başlangıçta sadece potansiyel enerji olur
      Body.setVelocity(pendulum, { x: 0, y: 0 });
      Body.setAngularVelocity(pendulum, 0);
    }
  });
  
  // Clean up resize listener on unmount
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
  });
}

// Function to start the pendulum
function startPendulum() {
  if (!pendulum || !constraint || isSimulationRunning.value) return;
  
  // Make the pendulum dynamic to allow movement
  pendulum.isStatic = false;
  isSimulationRunning.value = true;
  
  // Force an energy update
  updateEnergy();
  
  console.log('Pendulum started');
}

// Function to reset the pendulum to the highest position
function resetPendulum() {
  if (!pendulum || !constraint) return;
  
  // Stop the pendulum's motion
  Body.setVelocity(pendulum, { x: 0, y: 0 });
  Body.setAngularVelocity(pendulum, 0);
  
  // Make it static temporarily to prevent movement during positioning
  pendulum.isStatic = true;
  isSimulationRunning.value = false;
  
  // Position the pendulum at its highest point
  const anchorY = constraint.pointA.y;
  Body.setPosition(pendulum, { x: highestX, y: anchorY });
  
  // Recalculate max energy based on new position
  const height = calculateHeight();
  maxEnergy = mass * gravity * height / 1000;
  console.log('Reset: new max energy:', maxEnergy);
  
  // Force an energy update
  updateEnergy();
}

// Function to stop the pendulum
function stopPendulum() {
  if (!pendulum || !constraint) return;
  
  // Make the pendulum static to stop all movement
  pendulum.isStatic = true;
  isSimulationRunning.value = false;
  
  // Sarkacı durdurduğumuzda kinetik enerji sıfır olmalı
  if (kineticEnergyBar.value) {
    kineticEnergyBar.value.style.width = '0%';
  }
  
  if (kineticEnergyBarMobile.value) {
    kineticEnergyBarMobile.value.style.width = '0%';
  }
  
  // Potansiyel enerji mevcut yüksekliğe göre hesaplanmalı
  const height = calculateHeight();
  const potentialEnergy = mass * gravity * height / 1000;
  
  if (potentialEnergyBar.value) {
    const pePercent = Math.min(100, (potentialEnergy / maxEnergy) * 100);
    potentialEnergyBar.value.style.width = `${pePercent}%`;
  }
  
  if (potentialEnergyBarMobile.value) {
    const pePercent = Math.min(100, (potentialEnergy / maxEnergy) * 100);
    potentialEnergyBarMobile.value.style.width = `${pePercent}%`;
  }
  
  // Toplam enerji değeri sabit kalmalı
  console.log('Pendulum stopped. Final potential energy:', potentialEnergy.toFixed(4));
}

onBeforeUnmount(() => {
  // Clean up Matter.js resources
  if (runner) Runner.stop(runner);
  if (render) Render.stop(render);
  if (engine) {
    Matter.Events.off(engine, 'afterUpdate');
    if (mouseConstraint) {
      Matter.Events.off(mouseConstraint, 'startdrag');
      Matter.Events.off(mouseConstraint, 'enddrag');
    }
  }
});

// Calculate the height of the pendulum relative to its lowest point
function calculateHeight() {
  if (!pendulum || !constraint) return 0;
  
  // Calculate height as the difference between the lowest possible position
  // and the current position, plus a minimum value to ensure potential energy never reaches zero
  const minHeight = 5; // Increased minimum height to ensure potential energy is never close to zero
  const height = Math.max(minHeight, lowestY - pendulum.position.y);
  
  return height;
}

// Function to calculate and update energy values
function updateEnergy() {
  if (!pendulum) return;

  // Calculate potential energy (PE = mgh)
  const height = calculateHeight();
  const potentialEnergy = mass * gravity * height / 1000; // Convert to joules

  // Calculate kinetic energy (KE = 0.5 * m * v^2)
  const velocity = Vector.magnitude(pendulum.velocity);
  const kineticEnergy = 0.5 * mass * velocity * velocity / 1000; // Convert to joules

  // Calculate total energy
  const totalEnergy = potentialEnergy + kineticEnergy;
  
  // Ensure we have a valid maxEnergy to prevent division by zero
  if (maxEnergy <= 0) {
    // İlk başlangıçta maksimum enerjiyi belirle
    maxEnergy = Math.max(0.1, totalEnergy); // Set a minimum value
    console.log('Initial max energy set to:', maxEnergy);
  }
  
  // Toplam enerji korunmalı, ancak sayısal hatalar olabilir
  // Bu nedenle, toplam enerji değerini başlangıçtaki maksimum enerji olarak sabit tutuyoruz
  const displayTotalEnergy = maxEnergy;

  // Log values for debugging
  if (isDragging || Math.random() < 0.005) { // Log occasionally or when dragging
    console.log('Height:', height.toFixed(2));
    console.log('Potential Energy:', potentialEnergy.toFixed(4));
    console.log('Kinetic Energy:', kineticEnergy.toFixed(4));
    console.log('Calculated Total Energy:', totalEnergy.toFixed(4));
    console.log('Target Total Energy:', displayTotalEnergy.toFixed(4));
    console.log('Energy Difference:', (displayTotalEnergy - totalEnergy).toFixed(6));
  }

  // Update energy bars - using nextTick to ensure DOM is updated
  const updateBars = () => {
    // Potansiyel enerji çubuğu gerçek değeri gösterir
    const pePercent = Math.min(100, (potentialEnergy / maxEnergy) * 100);
    
    // Kinetik enerji, toplam enerjiden potansiyel enerjiyi çıkararak hesaplanır
    // Bu, enerji korunumunu görsel olarak daha iyi gösterir
    const calculatedKineticEnergy = maxEnergy - potentialEnergy;
    const kePercent = Math.min(100, (calculatedKineticEnergy / maxEnergy) * 100);
    
    // Desktop bars
    if (potentialEnergyBar.value) {
      potentialEnergyBar.value.style.width = `${pePercent}%`;
    }
    if (kineticEnergyBar.value) {
      kineticEnergyBar.value.style.width = `${kePercent}%`;
    }
    
    // Mobile bars
    if (potentialEnergyBarMobile.value) {
      potentialEnergyBarMobile.value.style.width = `${pePercent}%`;
    }
    if (kineticEnergyBarMobile.value) {
      kineticEnergyBarMobile.value.style.width = `${kePercent}%`;
    }
  };
  
  updateBars();
  
  // Enerji farkını hesapla (ideal durumda sıfır olmalı)
  return {
    potentialEnergy,
    kineticEnergy: maxEnergy - potentialEnergy, // Hesaplanan kinetik enerji
    totalEnergy: maxEnergy,
    energyDifference: displayTotalEnergy - totalEnergy
  };
}

// Function to correct energy loss
function correctEnergyLoss() {
  if (!pendulum || isDragging || pendulum.isStatic) return;

  // Mevcut enerji değerlerini hesapla
  const height = calculateHeight();
  const velocity = Vector.magnitude(pendulum.velocity);
  const potentialEnergy = mass * gravity * height / 1000;
  const kineticEnergy = 0.5 * mass * velocity * velocity / 1000;
  const currentTotalEnergy = potentialEnergy + kineticEnergy;
  
  // Enerji kaybını hesapla
  const energyLoss = maxEnergy - currentTotalEnergy;
  
  // Sarkaç hareketi sırasında enerji kaybını telafi et
  if (energyLoss > 0.001 * maxEnergy) {
    // Sarkaç yukarı doğru hareket ediyorsa (potansiyel enerji artıyorsa)
    const isMovingUp = pendulum.velocity.y < 0;
    
    if (isMovingUp) {
      // Hızı artırarak enerji kaybını telafi et
      const requiredVelocitySquared = velocity * velocity + (2 * energyLoss * 1000) / mass;
      const requiredVelocity = Math.sqrt(requiredVelocitySquared);
      
      // Hız vektörünün yönünü koru, büyüklüğünü artır
      const velocityUnit = Vector.normalise(pendulum.velocity);
      const correctedVelocity = Vector.mult(velocityUnit, requiredVelocity);
      
      // Düzeltilmiş hızı uygula
      Body.setVelocity(pendulum, correctedVelocity);
      
      if (Math.random() < 0.01) { // Nadiren log tut
        console.log('Energy corrected. Loss:', energyLoss.toFixed(6), 'New velocity:', requiredVelocity.toFixed(6));
      }
    }
  }
  
  // Sarkaç en yüksek noktasına yakınsa ve neredeyse duruyorsa
  // Başlangıç yüksekliğine ulaşmasını sağla
  const distanceToAnchor = Vector.magnitude(
    Vector.sub(pendulum.position, constraint.pointA)
  );
  
  const isNearTopPosition = Math.abs(distanceToAnchor - constraint.length) < 5;
  const isAlmostStopped = velocity < 0.2;
  
  if (isNearTopPosition && isAlmostStopped) {
    // Sarkacın x pozisyonunu kontrol et
    const isOnCorrectSide = (pendulum.position.x > constraint.pointA.x && highestX > constraint.pointA.x) || 
                           (pendulum.position.x < constraint.pointA.x && highestX < constraint.pointA.x);
    
    // Eğer sarkaç doğru taraftaysa ve neredeyse duruyorsa
    if (isOnCorrectSide) {
      // Sarkacı tam olarak başlangıç konumuna getir
      Body.setPosition(pendulum, { x: highestX, y: constraint.pointA.y });
      Body.setVelocity(pendulum, { x: 0, y: 0.1 }); // Hafif bir başlangıç hızı ver
      
      console.log('Pendulum reset to exact initial position');
    }
  }
}
</script>
  
<style scoped>
/* Canvas için ek stiller */
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
  
 
 