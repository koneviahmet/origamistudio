<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center p-4">
    <h1 class="text-2xl font-bold text-center mb-4">Suyun Tanecikli Yapısı ve Hal Değişimi</h1>
    
    <div class="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4 mb-4">
      <div class="flex flex-wrap justify-center gap-4 mb-4">
        <button 
          @click="setMatterState('solid')" 
          :class="['px-4 py-2 rounded-lg transition-colors duration-300', 
                  matterState === 'solid' ? 'bg-blue-600 text-white' : 'bg-blue-200']">
          Buz (Katı)
        </button>
        <button 
          @click="setMatterState('liquid')" 
          :class="['px-4 py-2 rounded-lg transition-colors duration-300', 
                  matterState === 'liquid' ? 'bg-blue-600 text-white' : 'bg-blue-200']">
          Su (Sıvı)
        </button>
        <button 
          @click="setMatterState('gas')" 
          :class="['px-4 py-2 rounded-lg transition-colors duration-300', 
                  matterState === 'gas' ? 'bg-blue-600 text-white' : 'bg-blue-200']">
          Su Buharı (Gaz)
        </button>
      </div>
      
      <div class="flex flex-wrap justify-center gap-4 mb-4">
        <div class="flex items-center">
          <label class="mr-2">Sıcaklık:</label>
          <input 
            type="range" 
            min="-10" 
            max="110" 
            v-model="temperature" 
            class="w-32"
            @input="updateTemperature" />
          <span class="ml-2">{{ temperature }}°C</span>
        </div>
        <div class="text-sm text-gray-600">
          (Buz: &lt;0°C, Su: 0-100°C, Su Buharı: &gt;100°C)
        </div>
      </div>
      
      <div ref="simulationContainer" class="w-full h-80 bg-gray-100 rounded-lg relative overflow-hidden">
        <!-- Simulation will be rendered here -->
      </div>
    </div>
    
    <div class="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4">
      <h2 class="text-lg font-semibold mb-2">Su Hakkında Bilgi</h2>
      <div v-if="matterState === 'solid'" class="text-sm">
        <p>Buz halinde su tanecikleri:</p>
        <ul class="list-disc ml-5">
          <li>Düzenli kristal yapıda dizilirler</li>
          <li>Sadece titreşim hareketi yaparlar</li>
          <li>Aralarında belirli bir mesafe vardır (bu yüzden buz su üzerinde yüzer)</li>
          <li>Sıcaklık 0°C'nin altında olduğunda katı haldedir</li>
        </ul>
      </div>
      <div v-else-if="matterState === 'liquid'" class="text-sm">
        <p>Sıvı halde su tanecikleri:</p>
        <ul class="list-disc ml-5">
          <li>Düzensiz dizilirler</li>
          <li>Birbirleri üzerinden kayarak hareket ederler</li>
          <li>Aralarında orta derecede boşluk vardır</li>
          <li>Sıcaklık 0°C ile 100°C arasında olduğunda sıvı haldedir</li>
        </ul>
      </div>
      <div v-else-if="matterState === 'gas'" class="text-sm">
        <p>Su buharı halinde tanecikler:</p>
        <ul class="list-disc ml-5">
          <li>Çok düzensiz dizilirler</li>
          <li>Çok hızlı ve serbestçe hareket ederler</li>
          <li>Aralarında çok fazla boşluk vardır</li>
          <li>Sıcaklık 100°C'nin üzerinde olduğunda gaz haldedir</li>
        </ul>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Matter from 'matter-js';

// Reactive state
const simulationContainer = ref(null);
const matterState = ref('liquid');
const temperature = ref(25);

// Matter.js components
let engine, render, world;
let particles = [];
let walls = [];
let mouseConstraint;
let animationFrameId;
let constraints = []; // Tanecikler arasındaki bağlantıları tutmak için

// Configuration for different states
const stateConfig = {
  solid: {
    particleCount: 36, // 6x6 grid for solid
    restitution: 0.1, // Daha az sıçrama
    friction: 0.2, // Daha fazla sürtünme
    initialSpeedMax: 0.2, // Daha düşük başlangıç hızı
    particleRadius: 8,
    particleDistance: 20,
    color: '#93c5fd' // blue-300 (light blue for ice)
  },
  liquid: {
    particleCount: 40,
    restitution: 0.5,
    friction: 0.05,
    initialSpeedMax: 2,
    particleRadius: 10,
    particleDistance: 30,
    color: '#3b82f6' // blue-500 (medium blue for water)
  },
  gas: {
    particleCount: 25,
    restitution: 0.9,
    friction: 0.01,
    initialSpeedMax: 3, // 5'ten 3'e düşürüldü - daha düşük başlangıç hızı
    particleRadius: 12,
    particleDistance: 50,
    color: '#dbeafe' // blue-100 (very light blue for water vapor)
  }
};

// Initialize the simulation
onMounted(() => {
  initSimulation();
});

// Cleanup
onBeforeUnmount(() => {
  if (render) {
    Matter.Render.stop(render);
  }
  if (engine) {
    Matter.Engine.clear(engine);
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});

// Animation loop for continuous gas particle movement
function animateGasParticles() {
  if (matterState.value === 'gas' && particles.length > 0) {
    const { Body, Common } = Matter;
    
    // Apply random impulses to gas particles
    particles.forEach(particle => {
      const forceMagnitude = 0.01 * particle.mass; // 0.02'den 0.01'e düşürüldü - daha az kuvvet
      
      // Apply random force in random direction
      Body.applyForce(particle, particle.position, {
        x: Common.random(-forceMagnitude, forceMagnitude),
        y: Common.random(-forceMagnitude, forceMagnitude)
      });
    });
  }
  
  // Continue animation loop
  animationFrameId = requestAnimationFrame(animateGasParticles);
}

// Watch for state changes
watch(matterState, () => {
  resetSimulation();
});

// Watch for temperature changes
watch(temperature, () => {
  updateTemperature();
});

// Initialize the Matter.js simulation
function initSimulation() {
  const container = simulationContainer.value;
  const { Engine, Render, Runner, Bodies, Composite, Body, Mouse, MouseConstraint } = Matter;

  // Create engine and world
  engine = Engine.create({
    enableSleeping: false,
  });
  world = engine.world;
  
  // Set initial gravity based on current matter state
  if (matterState.value === 'gas') {
    engine.world.gravity.y = 0; // Zero gravity for gases
  } else {
    engine.world.gravity.y = 1; // Normal gravity for solids and liquids
  }
  
  // Create renderer
  render = Render.create({
    element: container,
    engine: engine,
    options: {
      width: container.clientWidth,
      height: container.clientHeight,
      wireframes: false,
      background: '#f3f4f6', // gray-100
    }
  });
  
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);
  
  // Create walls (container boundaries)
  const wallThickness = 20;
  const wallOptions = {
    isStatic: true,
    render: {
      fillStyle: '#f3f4f6', // Same as background
    }
  };
  
  walls = [
    // Bottom wall
    Bodies.rectangle(
      container.clientWidth / 2,
      container.clientHeight + wallThickness / 2,
      container.clientWidth,
      wallThickness,
      wallOptions
    ),
    // Left wall
    Bodies.rectangle(
      -wallThickness / 2,
      container.clientHeight / 2,
      wallThickness,
      container.clientHeight,
      wallOptions
    ),
    // Right wall
    Bodies.rectangle(
      container.clientWidth + wallThickness / 2,
      container.clientHeight / 2,
      wallThickness,
      container.clientHeight,
      wallOptions
    ),
    // Top wall
    Bodies.rectangle(
      container.clientWidth / 2,
      -wallThickness / 2,
      container.clientWidth,
      wallThickness,
      wallOptions
    )
  ];
  
  Composite.add(world, walls);

  // Add mouse control
  const mouse = Mouse.create(render.canvas);
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: true
      }
    }
  });
  
  Composite.add(world, mouseConstraint);
  render.mouse = mouse;
  
  // Create initial particles based on current state
  createParticles();
  
  // Start animation loop if gas is selected initially
  if (matterState.value === 'gas' && !animationFrameId) {
    animateGasParticles();
  }
  
  // Handle window resize
  const handleResize = () => {
    render.options.width = container.clientWidth;
    render.options.height = container.clientHeight;
    render.canvas.width = container.clientWidth;
    render.canvas.height = container.clientHeight;
    
    // Update wall positions
    Body.setPosition(walls[0], {
      x: container.clientWidth / 2,
      y: container.clientHeight + wallThickness / 2
    });
    
    Body.setPosition(walls[2], {
      x: container.clientWidth + wallThickness / 2,
      y: container.clientHeight / 2
    });
    
    Body.setPosition(walls[3], {
      x: container.clientWidth / 2,
      y: -wallThickness / 2
    });
  };
  
  window.addEventListener('resize', handleResize);
}

// Create particles based on the current state
function createParticles() {
  const container = simulationContainer.value;
  const { Bodies, Composite, Common, Body, Constraint } = Matter;
  
  const config = stateConfig[matterState.value];
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Clear existing particles
  if (particles.length > 0) {
    Composite.remove(world, particles);
    particles = [];
  }
  
  if (constraints.length > 0) {
    Composite.remove(world, constraints);
    constraints = [];
  }
  
  let count = 0;
  
  // For solid state, create a perfect square grid
  if (matterState.value === 'solid') {
    // Create a perfect square grid for solid state
    const gridSize = Math.sqrt(config.particleCount); // 6x6 grid
    const gridSpacing = 30; // Fixed spacing between particles
    
    // Calculate starting position to center the grid
    const startX = (width - (gridSize - 1) * gridSpacing) / 2;
    const startY = (height - (gridSize - 1) * gridSpacing) / 2;
    
    // Create particles in a perfect grid
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = startX + j * gridSpacing;
        const y = startY + i * gridSpacing;
        
        const particle = Bodies.circle(x, y, config.particleRadius, {
          restitution: config.restitution,
          friction: config.friction,
          frictionAir: 0.1, // Daha yüksek hava sürtünmesi
          render: {
            fillStyle: config.color
          },
          isStatic: false // Not static, but will be constrained
        });
        
        // Apply very small initial velocity for minimal vibration
        Body.setVelocity(particle, {
          x: Common.random(-0.05, 0.05), // Daha düşük başlangıç hızı
          y: Common.random(-0.05, 0.05)  // Daha düşük başlangıç hızı
        });
        
        particles.push(particle);
        count++;
      }
    }
    
    Composite.add(world, particles);
    
    // Create constraints between adjacent particles
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j;
        
        // Connect to the particle to the right
        if (j < gridSize - 1) {
          const rightIndex = i * gridSize + (j + 1);
          const constraint = Constraint.create({
            bodyA: particles[index],
            bodyB: particles[rightIndex],
            stiffness: 0.95, // Daha sert bağlantı
            damping: 0.1, // Titreşimleri azaltmak için sönümleme ekle
            render: {
              visible: true,
              lineWidth: 2,
              strokeStyle: '#93c5fd' // Same color as particles
            }
          });
          constraints.push(constraint);
        }
        
        // Connect to the particle below
        if (i < gridSize - 1) {
          const belowIndex = (i + 1) * gridSize + j;
          const constraint = Constraint.create({
            bodyA: particles[index],
            bodyB: particles[belowIndex],
            stiffness: 0.95, // Daha sert bağlantı
            damping: 0.1, // Titreşimleri azaltmak için sönümleme ekle
            render: {
              visible: true,
              lineWidth: 2,
              strokeStyle: '#93c5fd' // Same color as particles
            }
          });
          constraints.push(constraint);
        }
        
        // Add diagonal connections for more stability
        if (i < gridSize - 1 && j < gridSize - 1) {
          const diagonalIndex = (i + 1) * gridSize + (j + 1);
          const constraint = Constraint.create({
            bodyA: particles[index],
            bodyB: particles[diagonalIndex],
            stiffness: 0.8, // Biraz daha esnek diyagonal bağlantı
            damping: 0.1,
            render: {
              visible: true,
              lineWidth: 1, // Daha ince çizgi
              strokeStyle: '#93c5fd'
            }
          });
          constraints.push(constraint);
        }
      }
    }
    
    Composite.add(world, constraints);
  } else {
    // For liquid and gas, use the original approach with random positions
    const cols = Math.sqrt(config.particleCount);
    const rows = Math.ceil(config.particleCount / cols);
    
    const startX = width * 0.2;
    const endX = width * 0.8;
    const startY = height * 0.2;
    const endY = height * 0.8;
    
    const spacingX = (endX - startX) / cols;
    const spacingY = (endY - startY) / rows;
    
    // Create particles with random positions for liquid and gas
    for (let i = 0; i < rows && count < config.particleCount; i++) {
      for (let j = 0; j < cols && count < config.particleCount; j++) {
        const x = startX + j * spacingX + Common.random(-5, 5);
        const y = startY + i * spacingY + Common.random(-5, 5);
        
        const particle = Bodies.circle(x, y, config.particleRadius, {
          restitution: config.restitution,
          friction: config.friction,
          frictionAir: 0.02,
          render: {
            fillStyle: config.color
          }
        });
        
        // Apply initial velocity based on state and temperature
        const speedFactor = (temperature.value / 25) * config.initialSpeedMax;
        
        Body.setVelocity(particle, {
          x: Common.random(-speedFactor, speedFactor),
          y: Common.random(-speedFactor, speedFactor)
        });
        
        particles.push(particle);
        count++;
      }
    }
    
    Composite.add(world, particles);
  }
}

// Reset the simulation with the current state
function resetSimulation() {
  if (particles.length > 0) {
    Matter.Composite.remove(world, particles);
    particles = [];
  }
  
  if (constraints.length > 0) {
    Matter.Composite.remove(world, constraints);
    constraints = [];
  }
  
  // Create new particles
  createParticles();
}

// Update the temperature and particle behavior
function updateTemperature() {
  const { Body, Common } = Matter;
  const temp = parseInt(temperature.value);
  
  // Change matter state based on temperature (water states)
  // Only change state if the temperature is significantly different from the current state's default temperature
  if (temp < 0 && matterState.value !== 'solid') {
    // Solid state (ice) for temperatures below 0°C
    setMatterState('solid');
    return; // setMatterState will call updateTemperature again
  } else if (temp >= 0 && temp < 100 && matterState.value !== 'liquid') {
    // Liquid state (water) for temperatures between 0°C and 100°C
    setMatterState('liquid');
    return; // setMatterState will call updateTemperature again
  } else if (temp >= 100 && matterState.value !== 'gas') {
    // Gas state (water vapor) for temperatures 100°C and above
    setMatterState('gas');
    return; // setMatterState will call updateTemperature again
  }
  
  const config = stateConfig[matterState.value];
  
  // Apply new velocities based on temperature
  particles.forEach(particle => {
    const speedFactor = (temp / 25) * config.initialSpeedMax;
    
    if (matterState.value === 'solid' && temp <= 0) {
      // For ice at freezing temperatures, just do very small vibrations
      Body.setVelocity(particle, {
        x: Common.random(-0.2, 0.2) * speedFactor, // Daha düşük hız
        y: Common.random(-0.2, 0.2) * speedFactor  // Daha düşük hız
      });
    } else {
      // For other states or higher temperatures, allow more movement
      Body.setVelocity(particle, {
        x: Common.random(-speedFactor, speedFactor),
        y: Common.random(-speedFactor, speedFactor)
      });
    }
  });
  
  // Change particle properties based on temperature
  particles.forEach(particle => {
    // Higher temperature = higher restitution (bounciness)
    particle.restitution = config.restitution * (1 + (temp - 25) / 100);
    
    // Lower friction at higher temperatures
    particle.friction = Math.max(0.01, config.friction * (1 - (temp - 25) / 200));
  });
}

// Change the state of matter
function setMatterState(state) {
  // Prevent unnecessary state changes
  if (matterState.value === state) return;
  
  matterState.value = state;
  
  // Set temperature based on matter state
  if (state === 'solid') {
    // Set temperature for solid state (ice)
    temperature.value = -1;
    
    // Normal gravity for solids
    engine.world.gravity.y = 1;
    
    // Cancel animation frame if it exists
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else if (state === 'liquid') {
    // Set temperature for liquid state (water)
    temperature.value = 25;
    
    // Normal gravity for liquids
    engine.world.gravity.y = 1;
    
    // Cancel animation frame if it exists
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else if (state === 'gas') {
    // Set temperature for gas state (water vapor)
    temperature.value = 101;
    
    // Çok düşük yerçekimi (tamamen sıfır yerine)
    engine.world.gravity.y = 0.05; // Sıfır yerine çok düşük yerçekimi
    
    // Start continuous movement for gas particles
    if (!animationFrameId) {
      animateGasParticles();
    }
  }
  
  // Reset simulation with new state
  resetSimulation();
  
  // Flag to prevent recursive calls between setMatterState and updateTemperature
  const isCalledFromTemperatureUpdate = new Error().stack.includes('updateTemperature');
  
  // Only call updateTemperature if not already called from updateTemperature
  if (!isCalledFromTemperatureUpdate) {
    updateTemperature();
  }
}
</script>
  
 
 