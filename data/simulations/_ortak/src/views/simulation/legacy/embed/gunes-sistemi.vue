<template>
  <div class="w-full h-screen flex flex-col items-center bg-gray-900">
    <div class="flex space-x-1 p-2">
      <button 
        @click="selectPlanetGroup('inner')" 
        class="p-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        :class="{'ring-2 ring-yellow-400': planetGroupSelected === 'inner'}"
      >
        İç G.
      </button>
      <button 
        @click="selectPlanetGroup('outer')" 
        class="p-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        :class="{'ring-2 ring-yellow-400': planetGroupSelected === 'outer'}"
      >
        Dış G.
      </button>
      <button 
        @click="selectPlanetGroup('meteor')" 
        class="p-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        :class="{'ring-2 ring-yellow-400': meteorsVisible}"
      >
        Meteorlar {{ meteorsVisible ? 'x' : '' }}
      </button>
      <button 
        @click="cancelSelection()" 
        class="p-2 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        X
      </button>
    </div>
    <div class="relative w-full h-full max-w-screen-lg" ref="container">
      <!-- Matter.js canvas will be rendered here -->
    </div>
    <div class="absolute bottom-4 left-4 text-white bg-gray-800/70 p-2 rounded text-sm">
      <!-- <p class="mb-1">Gezegen bilgileri: <span v-if="selectedPlanet" class="text-yellow-300">({{ selectedPlanet }} seçildi)</span></p> -->
      <ul class="grid grid-cols-4 md:grid-cols-4">
        <li 
          v-for="(planet, index) in visiblePlanets.filter(p => p.name !== 'Güneş')" 
          :key="index" 
          class="flex items-center cursor-pointer hover:bg-gray-700 p-1 rounded transition-colors"
          :class="{'bg-gray-600': selectedPlanet === planet.name}"
          @click="selectPlanet(planet.name)"
        >
          <span class="w-3 h-3 rounded-full mr-1" :style="{ backgroundColor: planet.color }"></span>
          <span>{{ planet.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Matter from 'matter-js';

const container = ref(null);
let engine, render, world;
let bodies = [];
let meteorBodies = []; // Separate array to track meteor bodies
const simScale = 0.8; // Increased scale factor for the simulation
const selectedPlanet = ref(null);
const planetGroupSelected = ref(null); // 'inner', 'outer', 'meteor', or null
const meteorsVisible = ref(false); // Track if meteors are visible
const backgroundColor = '#1a202c'; // Dark gray background color (matches Tailwind's bg-gray-900)

// Planet properties - simplified representation
const planets = [
  { name: 'Güneş', radius: 40, color: '#FDB813', orbitRadius: 0, speed: 0, mass: 1000, group: 'sun' },
  { name: 'Merkür', radius: 8, color: '#999999', orbitRadius: 100, speed: 0.02, mass: 10, group: 'inner' },
  { name: 'Venüs', radius: 12, color: '#E39E65', orbitRadius: 150, speed: 0.015, mass: 20, group: 'inner' },
  { name: 'Dünya', radius: 13, color: '#4F97E8', orbitRadius: 200, speed: 0.012, mass: 20, group: 'inner' },
  { name: 'Mars', radius: 10, color: '#E27B58', orbitRadius: 250, speed: 0.01, mass: 15, group: 'inner' },
  { name: 'Meteor Kuşağı', radius: 2, color: '#888888', orbitRadius: 290, speed: 0, mass: 1, group: 'meteor' },
  { name: 'Jüpiter', radius: 28, color: '#C88B3A', orbitRadius: 330, speed: 0.005, mass: 100, group: 'outer' },
  { name: 'Satürn', radius: 26, color: '#E3CD8F', orbitRadius: 400, speed: 0.004, mass: 80, group: 'outer' },
  { name: 'Uranüs', radius: 18, color: '#A8D8EA', orbitRadius: 470, speed: 0.003, mass: 50, group: 'outer' },
  { name: 'Neptün', radius: 18, color: '#3E66AA', orbitRadius: 530, speed: 0.002, mass: 50, group: 'outer' }
];

// Meteor belt configuration
const meteorBelt = {
  innerRadius: 270 * simScale,
  outerRadius: 310 * simScale,
  meteorCount: 150,
  meteorColors: ['#888888', '#A9A9A9', '#696969', '#808080', '#778899'],
  meteorSizes: [1, 1.5, 2, 2.5]
};

// Computed property to filter visible planets based on selected group
const visiblePlanets = computed(() => {
  if (!planetGroupSelected.value) {
    // When no group is selected, show all planets except the meteor belt if meteors are hidden
    if (!meteorsVisible.value) {
      return planets.filter(planet => planet.group !== 'meteor');
    }
    return planets;
  }
  
  // For meteor group, only show the meteor belt label and sun
  if (planetGroupSelected.value === 'meteor') {
    return planets.filter(planet => planet.group === 'meteor' || planet.group === 'sun');
  }
  
  return planets.filter(planet => planet.group === planetGroupSelected.value || planet.group === 'sun');
});

// Function to select a planet group (inner, outer, or meteor)
const selectPlanetGroup = (group) => {
  // Special handling for meteor group - toggle visibility only
  if (group === 'meteor') {
    meteorsVisible.value = !meteorsVisible.value;
    
    // Update meteor visibility
    meteorBodies.forEach(meteor => {
      meteor.render.visible = meteorsVisible.value;
      if (meteorsVisible.value) {
        // When showing meteors, use their original color or dim them based on current selection
        if (planetGroupSelected.value === 'meteor') {
          meteor.render.fillStyle = meteor.plugin.originalColor;
        } else if (planetGroupSelected.value) {
          meteor.render.fillStyle = 'rgba(0, 0, 0, 0.5)';
        } else {
          meteor.render.fillStyle = meteor.plugin.originalColor;
        }
      }
    });
    
    return;
  }
  
  // Regular group selection logic for non-meteor groups
  if (planetGroupSelected.value === group) {
    planetGroupSelected.value = null;
    restoreAllPlanets();
  } else {
    planetGroupSelected.value = group;
    
    // Reset any individual planet selection
    selectedPlanet.value = null;
    
    // Make planets in the selected group colored and others black
    bodies.forEach(body => {
      if (body.plugin) {
        const planetInfo = planets.find(p => p.name === body.plugin.name);
        if (planetInfo) {
          if (planetInfo.group === group || planetInfo.group === 'sun') {
            // Show planets in the selected group and the sun with original colors
            body.render.fillStyle = body.plugin.originalColor;
          } else {
            // Make other planets black with slight transparency instead of hiding them
            body.render.fillStyle = 'rgba(0, 0, 0, 0.7)';
          }
          // Keep all planets visible
          body.render.visible = true;
        }
      }
    });
    
    // Handle meteors separately - keep their current visibility state
    if (meteorsVisible.value) {
      meteorBodies.forEach(meteor => {
        meteor.render.fillStyle = 'rgba(0, 0, 0, 0.5)';
      });
    }
  }
};

// Function to cancel all selections
const cancelSelection = () => {
  selectedPlanet.value = null;
  planetGroupSelected.value = null;
  restoreAllPlanets();
  
  // Don't change meteor visibility when canceling selection
  meteorBodies.forEach(meteor => {
    meteor.render.visible = meteorsVisible.value;
    if (meteorsVisible.value) {
      meteor.render.fillStyle = meteor.plugin.originalColor;
    }
  });
};

// Function to restore all planets to their original state
const restoreAllPlanets = () => {
  bodies.forEach(body => {
    if (body.plugin && body.plugin.originalColor) {
      body.render.fillStyle = body.plugin.originalColor;
      body.render.visible = true;
    }
  });
  
  // Restore meteors if they're visible
  if (meteorsVisible.value) {
    meteorBodies.forEach(meteor => {
      meteor.render.fillStyle = meteor.plugin.originalColor;
      meteor.render.visible = true;
    });
  }
};

// Function to handle planet selection
const selectPlanet = (planetName) => {
  if (selectedPlanet.value === planetName) {
    selectedPlanet.value = null; // Deselect if already selected
    
    // Restore all visible planets to their original colors
    bodies.forEach(body => {
      if (body.plugin && body.plugin.originalColor && body.render.visible) {
        body.render.fillStyle = body.plugin.originalColor;
      }
    });
    
    // Restore meteors if they're visible
    if (meteorsVisible.value) {
      meteorBodies.forEach(meteor => {
        meteor.render.fillStyle = meteor.plugin.originalColor;
      });
    }
  } else {
    selectedPlanet.value = planetName;
    
    // Make all visible planets black except the selected one and the sun
    bodies.forEach(body => {
      if (body.plugin && body.render.visible) {
        if (body.plugin.name === planetName || body.plugin.name === 'Güneş') {
          // Keep original color for selected planet and sun
          body.render.fillStyle = body.plugin.originalColor;
        } else {
          // Make other planets black with slight transparency
          body.render.fillStyle = 'rgba(0, 0, 0, 0.7)';
        }
      }
    });
    
    // Handle meteors when a planet is selected
    if (planetName === 'Meteor Kuşağı') {
      // Show and highlight all meteors
      meteorsVisible.value = true;
      meteorBodies.forEach(meteor => {
        meteor.render.fillStyle = meteor.plugin.originalColor;
        meteor.render.visible = true;
      });
    } else if (meteorsVisible.value) {
      // Dim meteors when another planet is selected (if they're visible)
      meteorBodies.forEach(meteor => {
        meteor.render.fillStyle = 'rgba(0, 0, 0, 0.5)';
      });
    }
  }
};

// Function to draw orbit paths
const drawOrbitPaths = () => {
  if (!render || !render.context) return;
  
  const ctx = render.context;
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  
  // Draw meteor belt if it's selected or meteors are visible
  if (planetGroupSelected.value === 'meteor' || (meteorsVisible.value && !planetGroupSelected.value)) {
    drawMeteorBeltPath(ctx, centerX, centerY);
  }
  
  // Draw orbit paths for each planet
  planets.forEach(planet => {
    if (planet.orbitRadius > 0 && planet.name !== 'Meteor Kuşağı') {
      // Check if this planet is in the selected group
      const isInSelectedGroup = !planetGroupSelected.value || 
                               planet.group === planetGroupSelected.value;
      
      const scaledRadius = planet.orbitRadius * simScale;
      
      // Check if this is the selected planet
      const isSelected = selectedPlanet.value === planet.name;
      
      // Always draw orbit paths for all planets, but with different styles
      if (isInSelectedGroup) {
        // Full visibility for planets in the selected group
        ctx.strokeStyle = getOrbitColor(planet.name, isSelected ? 0.9 : 0.6);
        ctx.lineWidth = isSelected ? 3 : 1.5;
      } else {
        // Reduced visibility for planets not in the selected group
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)'; // Dark gray with low opacity
        ctx.lineWidth = 0.8;
      }
      
      ctx.setLineDash([]); // Solid lines for all orbits
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, scaledRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // If selected, add additional visual elements to the orbit
      if (isSelected) {
        const time = Date.now() * 0.001;
        
        // Add a second, animated orbit line with dashes
        ctx.strokeStyle = getOrbitColor(planet.name, 0.8);
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 8]);
        ctx.lineDashOffset = time * 20; // Moving dash effect
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, scaledRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add a third, glowing line for emphasis
        ctx.shadowColor = getOrbitColor(planet.name, 1);
        ctx.shadowBlur = 10;
        ctx.strokeStyle = getOrbitColor(planet.name, 0.9);
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, scaledRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw multiple direction arrows on the orbit
        drawMultipleOrbitDirectionArrows(ctx, centerX, centerY, scaledRadius, planet);
      }
    }
  });
  
  // Reset line dash to not affect other drawings
  ctx.setLineDash([]);
};

// Draw meteor belt path
const drawMeteorBeltPath = (ctx, centerX, centerY) => {
  const isMeteorSelected = selectedPlanet.value === 'Meteor Kuşağı' || planetGroupSelected.value === 'meteor';
  
  // Draw the inner and outer boundaries of the meteor belt
  ctx.strokeStyle = isMeteorSelected ? 'rgba(200, 200, 200, 0.6)' : 'rgba(100, 100, 100, 0.3)';
  ctx.lineWidth = isMeteorSelected ? 2 : 1;
  ctx.setLineDash([5, 5]); // Dashed lines for belt boundaries
  
  // Inner boundary
  ctx.beginPath();
  ctx.arc(centerX, centerY, meteorBelt.innerRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Outer boundary
  ctx.beginPath();
  ctx.arc(centerX, centerY, meteorBelt.outerRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // If meteor belt is selected, add a glowing effect
  if (isMeteorSelected) {
    ctx.shadowColor = 'rgba(200, 200, 200, 0.8)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(220, 220, 220, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    
    // Draw additional rings within the belt
    for (let i = 1; i < 4; i++) {
      const radius = meteorBelt.innerRadius + (meteorBelt.outerRadius - meteorBelt.innerRadius) * (i / 4);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  }
  
  ctx.setLineDash([]); // Reset dash pattern
};

// Draw multiple arrows showing orbit direction
const drawMultipleOrbitDirectionArrows = (ctx, centerX, centerY, radius, planet) => {
  const time = Date.now() * 0.001;
  
  // Draw multiple arrows around the orbit
  const arrowCount = 4; // Number of arrows to draw
  
  for (let i = 0; i < arrowCount; i++) {
    const arrowPosition = (-time * planet.speed * 0.5 + (i * Math.PI / 2)) % (Math.PI * 2);
    
    // Calculate arrow position on the orbit
    const arrowX = centerX + radius * Math.cos(arrowPosition);
    const arrowY = centerY + radius * Math.sin(arrowPosition);
    
    // Calculate tangent direction (perpendicular to radius) - negative for counterclockwise
    const tangentAngle = arrowPosition - Math.PI / 2;
    
    // Arrow properties
    const arrowLength = 15;
    
    // Calculate arrow points
    const tipX = arrowX + arrowLength * Math.cos(tangentAngle);
    const tipY = arrowY + arrowLength * Math.sin(tangentAngle);
    
    const leftX = arrowX + (arrowLength * 0.7) * Math.cos(tangentAngle + Math.PI * 0.8);
    const leftY = arrowY + (arrowLength * 0.7) * Math.sin(tangentAngle + Math.PI * 0.8);
    
    const rightX = arrowX + (arrowLength * 0.7) * Math.cos(tangentAngle - Math.PI * 0.8);
    const rightY = arrowY + (arrowLength * 0.7) * Math.sin(tangentAngle - Math.PI * 0.8);
    
    // Draw the arrow with glow effect
    ctx.shadowColor = getOrbitColor(planet.name, 1);
    ctx.shadowBlur = 10;
    ctx.fillStyle = getOrbitColor(planet.name, 1);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
};

// Helper function to get orbit color based on planet name
const getOrbitColor = (planetName, opacity = 1) => {
  switch (planetName) {
    case 'Merkür':
      return `rgba(180, 180, 180, ${opacity})`;
    case 'Venüs':
      return `rgba(227, 158, 101, ${opacity})`;
    case 'Dünya':
      return `rgba(79, 151, 232, ${opacity})`;
    case 'Mars':
      return `rgba(226, 123, 88, ${opacity})`;
    case 'Jüpiter':
      return `rgba(200, 139, 58, ${opacity})`;
    case 'Satürn':
      return `rgba(227, 205, 143, ${opacity})`;
    case 'Uranüs':
      return `rgba(168, 216, 234, ${opacity})`;
    case 'Neptün':
      return `rgba(62, 102, 170, ${opacity})`;
    default:
      return `rgba(255, 255, 255, ${opacity})`;
  }
};

// Draw light effect around selected planet
const drawLightEffect = () => {
  if (!render || !render.context || !selectedPlanet.value) return;
  
  const ctx = render.context;
  
  // Find the selected planet body
  const selectedBody = bodies.find(body => 
    body.plugin && body.plugin.name === selectedPlanet.value
  );
  
  if (selectedBody) {
    const { x, y } = selectedBody.position;
    const radius = selectedBody.circleRadius;
    
    // Draw orbit trail for the selected planet
    drawOrbitTrail(ctx, selectedBody);
    
    // Create a radial gradient for the glow
    const gradient = ctx.createRadialGradient(
      x, y, radius, // Inner circle
      x, y, radius * 4 // Outer circle - increased for more visibility
    );
    
    // Add gradient colors with planet-specific color
    const planetColor = getOrbitColor(selectedPlanet.value, 1);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.3, planetColor.replace(')', ', 0.6)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Draw the glow effect
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Make the selected planet brighter
    const brightPlanetColor = getPlanetColor(selectedPlanet.value);
    
    // Draw a brighter version of the planet on top
    ctx.fillStyle = brightPlanetColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a bright highlight to create a shining effect
    const highlightGradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1, // Small highlight
      x, y, radius // Full planet
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Time-based animation variables
    const time = Date.now() * 0.001;
    const pulseSize = 1.2 + Math.sin(time * 3) * 0.2; // Value between 1.0 and 1.4
    const pulseOpacity = 0.7 + Math.sin(time * 2) * 0.3; // Value between 0.4 and 1.0
    
    // Draw multiple rings with different sizes and opacities
    for (let i = 0; i < 3; i++) {
      const ringSize = pulseSize + (i * 0.3); // Increased spacing between rings
      const ringOpacity = Math.max(0.3, pulseOpacity - (i * 0.2));
      
      // Different colors based on planet
      let borderColor = getOrbitColor(selectedPlanet.value, ringOpacity);
      
      // Add glow effect to rings
      ctx.shadowColor = getOrbitColor(selectedPlanet.value, 1);
      ctx.shadowBlur = 15;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4 - (i * 0.8);
      ctx.beginPath();
      ctx.arc(x, y, radius * ringSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Add a bright highlight ring that rotates
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw an incomplete circle (arc) that rotates
    const rotationSpeed = time * 2;
    const arcLength = Math.PI * 0.7; // Longer arc
    
    ctx.arc(x, y, radius * 1.8, rotationSpeed, rotationSpeed + arcLength);
    ctx.stroke();
    
    // Add a second rotating arc in the opposite direction
    ctx.strokeStyle = getOrbitColor(selectedPlanet.value, 0.9);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, -rotationSpeed * 0.7, -rotationSpeed * 0.7 + arcLength * 1.5);
    ctx.stroke();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }
};

// Draw a trail behind the selected planet
const drawOrbitTrail = (ctx, planetBody) => {
  if (!planetBody.plugin || planetBody.plugin.orbitRadius <= 0) return;
  
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;
  const radius = planetBody.circleRadius;
  const { x, y } = planetBody.position;
  const angle = planetBody.plugin.angle;
  
  // Calculate trail points (going backward from current position)
  const trailLength = 30; // Increased number of points in the trail
  const trailPoints = [];
  
  for (let i = 0; i < trailLength; i++) {
    const trailAngle = angle + (i * 0.05); // Go backward in time (+ for counterclockwise)
    const trailX = centerX + planetBody.plugin.orbitRadius * Math.cos(trailAngle);
    const trailY = centerY + planetBody.plugin.orbitRadius * Math.sin(trailAngle);
    trailPoints.push({ x: trailX, y: trailY });
  }
  
  // Draw the trail with gradient opacity
  ctx.globalCompositeOperation = 'lighter';
  
  // Draw trail segments with decreasing size and opacity
  for (let i = 0; i < trailPoints.length - 1; i++) {
    const point = trailPoints[i];
    const opacity = 0.8 * (1 - i / trailLength); // Increased base opacity
    const pointRadius = radius * (1 - i / trailLength * 0.7); // Slower size reduction
    
    // Add glow to the trail points
    ctx.shadowColor = getOrbitColor(planetBody.plugin.name, 0.8);
    ctx.shadowBlur = 10;
    ctx.fillStyle = getOrbitColor(planetBody.plugin.name, opacity);
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  ctx.globalCompositeOperation = 'source-over';
};

// Helper function to get brighter planet color
const getPlanetColor = (planetName) => {
  // Find the planet in our array
  const planet = planets.find(p => p.name === planetName);
  if (!planet) return '#FFFFFF';
  
  // Convert hex color to RGB
  const hex = planet.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Make the color brighter
  const brightenFactor = 1.8; // Increased brightness factor
  const brighterR = Math.min(255, Math.floor(r * brightenFactor));
  const brighterG = Math.min(255, Math.floor(g * brightenFactor));
  const brighterB = Math.min(255, Math.floor(b * brightenFactor));
  
  // Return brighter color
  return `rgb(${brighterR}, ${brighterG}, ${brighterB})`;
};

// Create a random meteor in the meteor belt
const createMeteor = (centerX, centerY) => {
  const Engine = Matter.Engine;
  const Bodies = Matter.Bodies;
  const Body = Matter.Body;
  
  // Random properties for the meteor
  const angle = Math.random() * Math.PI * 2;
  const distance = meteorBelt.innerRadius + Math.random() * (meteorBelt.outerRadius - meteorBelt.innerRadius);
  const size = meteorBelt.meteorSizes[Math.floor(Math.random() * meteorBelt.meteorSizes.length)];
  const color = meteorBelt.meteorColors[Math.floor(Math.random() * meteorBelt.meteorColors.length)];
  
  // Calculate position
  const x = centerX + distance * Math.cos(angle);
  const y = centerY + distance * Math.sin(angle);
  
  // Create the meteor body
  const meteor = Bodies.circle(
    x, 
    y, 
    size * simScale, 
    {
      mass: 0.1,
      friction: 0,
      frictionAir: 0,
      restitution: 0,
      render: {
        fillStyle: color
      },
      plugin: {
        orbitRadius: distance,
        angle: angle,
        speed: 0.002 + Math.random() * 0.004, // Random speed
        originalColor: color,
        isMeteor: true
      }
    }
  );
  
  return meteor;
};

const initMatter = () => {
  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const World = Matter.World;
  const Bodies = Matter.Bodies;
  const Body = Matter.Body;

  // Create an engine and world
  engine = Engine.create({
    gravity: { x: 0, y: 0 } // Disable gravity
  });
  world = engine.world;

  // Create a renderer
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  render = Render.create({
    element: container.value,
    engine: engine,
    options: {
      width: width,
      height: height,
      wireframes: false,
      background: backgroundColor
    }
  });

  const centerX = width / 2;
  const centerY = height / 2;

  // Create walls (invisible boundaries)
  const wallOptions = {
    isStatic: true,
    render: { fillStyle: backgroundColor, visible: true } // Same as background
  };

  // Top, bottom, left, right walls
  const wallThickness = 50;
  bodies.push(Bodies.rectangle(centerX, -wallThickness / 2, width, wallThickness, wallOptions)); // Top
  bodies.push(Bodies.rectangle(centerX, height + wallThickness / 2, width, wallThickness, wallOptions)); // Bottom
  bodies.push(Bodies.rectangle(-wallThickness / 2, centerY, wallThickness, height, wallOptions)); // Left
  bodies.push(Bodies.rectangle(width + wallThickness / 2, centerY, wallThickness, height, wallOptions)); // Right

  // Create sun and planets
  planets.forEach(planet => {
    // Skip creating a body for the meteor belt label
    if (planet.name === 'Meteor Kuşağı') return;
    
    const body = Bodies.circle(
      centerX, 
      centerY, 
      planet.radius * simScale, 
      {
        mass: planet.mass,
        friction: 0,
        frictionAir: 0,
        restitution: 0,
        render: {
          fillStyle: planet.color
        },
        plugin: {
          orbitRadius: planet.orbitRadius * simScale,
          angle: Math.random() * Math.PI * 2, // Random starting position
          speed: planet.speed,
          name: planet.name,
          originalColor: planet.color // Store the original color
        }
      }
    );

    // If it's not the sun, position it at the orbit
    if (planet.orbitRadius > 0) {
      Body.setPosition(body, {
        x: centerX + planet.orbitRadius * simScale * Math.cos(body.plugin.angle),
        y: centerY + planet.orbitRadius * simScale * Math.sin(body.plugin.angle)
      });
    }

    bodies.push(body);
  });

  // Create meteors in the meteor belt
  for (let i = 0; i < meteorBelt.meteorCount; i++) {
    const meteor = createMeteor(centerX, centerY);
    // Set meteors to be invisible by default
    meteor.render.visible = false;
    meteorBodies.push(meteor);
  }

  // Add all bodies to the world
  World.add(world, bodies);
  World.add(world, meteorBodies);

  // Custom render function to add orbit lines and light effects
  const originalAfterRender = render.afterRender;
  render.afterRender = function() {
    if (originalAfterRender) {
      originalAfterRender.apply(render, arguments);
    }
    drawOrbitPaths();
    drawLightEffect();
  };

  // Run the engine and renderer
  Engine.run(engine);
  Render.run(render);
};

// Update planet positions to create orbital motion
const updatePlanetPositions = () => {
  const centerX = render.options.width / 2;
  const centerY = render.options.height / 2;

  bodies.forEach(body => {
    if (body.plugin && body.plugin.orbitRadius > 0) {
      // Update angle based on speed - negative for counterclockwise motion
      body.plugin.angle -= body.plugin.speed;
      
      // Set new position
      Matter.Body.setPosition(body, {
        x: centerX + body.plugin.orbitRadius * Math.cos(body.plugin.angle),
        y: centerY + body.plugin.orbitRadius * Math.sin(body.plugin.angle)
      });
      
      // Remove any accumulated velocity
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
    }
  });
  
  // Update meteor positions
  meteorBodies.forEach(meteor => {
    if (meteor.plugin) {
      // Update angle based on speed - negative for counterclockwise motion
      meteor.plugin.angle -= meteor.plugin.speed;
      
      // Set new position
      Matter.Body.setPosition(meteor, {
        x: centerX + meteor.plugin.orbitRadius * Math.cos(meteor.plugin.angle),
        y: centerY + meteor.plugin.orbitRadius * Math.sin(meteor.plugin.angle)
      });
      
      // Remove any accumulated velocity
      Matter.Body.setVelocity(meteor, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(meteor, 0);
    }
  });

  requestAnimationFrame(updatePlanetPositions);
};

// Handle window resize
const handleResize = () => {
  if (render) {
    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    
    render.options.width = width;
    render.options.height = height;
    render.canvas.width = width;
    render.canvas.height = height;
    
    // Reposition bodies for new center
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Update wall positions
    const wallThickness = 50;
    bodies[0].position.x = centerX; // Top wall
    bodies[0].position.y = -wallThickness / 2;
    
    bodies[1].position.x = centerX; // Bottom wall
    bodies[1].position.y = height + wallThickness / 2;
    
    bodies[2].position.x = -wallThickness / 2; // Left wall
    bodies[2].position.y = centerY;
    
    bodies[3].position.x = width + wallThickness / 2; // Right wall
    bodies[3].position.y = centerY;
    
    // Update sun position
    bodies[4].position.x = centerX;
    bodies[4].position.y = centerY;
    
    // Update meteor positions
    meteorBodies.forEach(meteor => {
      if (meteor.plugin) {
        Matter.Body.setPosition(meteor, {
          x: centerX + meteor.plugin.orbitRadius * Math.cos(meteor.plugin.angle),
          y: centerY + meteor.plugin.orbitRadius * Math.sin(meteor.plugin.angle)
        });
      }
    });
    
    // Redraw orbit paths after resize
    drawOrbitPaths();
    
    Matter.Render.setPixelRatio(render, window.devicePixelRatio);
  }
};

onMounted(() => {
  initMatter();
  updatePlanetPositions();
  window.addEventListener('resize', handleResize);
  
  // Initialize all planets with their original colors
  bodies.forEach(body => {
    if (body.plugin && body.plugin.originalColor) {
      body.render.fillStyle = body.plugin.originalColor;
      body.render.visible = true;
    }
  });
});

onUnmounted(() => {
  if (render) {
    Matter.Render.stop(render);
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
  }
  window.removeEventListener('resize', handleResize);
});
</script>
  
 
 