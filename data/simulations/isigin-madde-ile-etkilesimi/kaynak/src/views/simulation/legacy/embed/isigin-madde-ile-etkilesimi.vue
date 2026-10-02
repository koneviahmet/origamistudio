<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
    
    <!-- Simulation Canvas (Full Width) -->
    <div class="relative flex-1 bg-gray-900 overflow-hidden mb-44">
      <canvas ref="canvas" class="w-full h-full"></canvas>
      
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
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Matter from 'matter-js';

// Refs
const canvas = ref(null);
const lightOn = ref(true);

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
let lightSource, lightRays = [];
let opaqueMaterial, transparentMaterial, translucentMaterial, coloredMaterial;
let walls = [];
let rayCount = 15;
let rayLength = 600;
let rayAngleSpread = Math.PI * 0.8;
let shadows = [];
let animationFrameId;

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
      background: '#1a202c',
      showAngleIndicator: false
    }
  });
  
  // Create walls (ceiling, floor and side walls)
  const wallOptions = { 
    isStatic: true, 
    render: { 
      fillStyle: '#1a202c',
      strokeStyle: '#2d3748',
      lineWidth: 1
    }
  };
  
  const wallThickness = 30;
  
  walls = [
    // Bottom wall
    Bodies.rectangle(
      render.options.width / 2, 
      render.options.height + wallThickness / 2, 
      render.options.width, 
      wallThickness, 
      wallOptions
    ),
    // Top wall
    Bodies.rectangle(
      render.options.width / 2, 
      -wallThickness / 2, 
      render.options.width, 
      wallThickness, 
      wallOptions
    ),
    // Left wall
    Bodies.rectangle(
      -wallThickness / 2, 
      render.options.height / 2, 
      wallThickness, 
      render.options.height, 
      wallOptions
    ),
    // Right wall
    Bodies.rectangle(
      render.options.width + wallThickness / 2, 
      render.options.height / 2, 
      wallThickness, 
      render.options.height, 
      wallOptions
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
        fillStyle: '#ffeb3b',
        strokeStyle: '#ffd600',
        lineWidth: 2
      }
    }
  );
  
  // Create materials
  const materialOptions = {
    restitution: 0.6,
    friction: 0.1,
    frictionAir: 0.01
  };
  
  // Opaque material (gray)
  opaqueMaterial = Bodies.rectangle(
    render.options.width / 4, 
    render.options.height / 2, 
    100, 
    100, 
    {
      ...materialOptions,
      render: {
        fillStyle: '#4b5563', // Gray
      },
      chamfer: { radius: 5 },
      material: { type: 'opaque' }
    }
  );
  
  // Transparent material (light blue)
  transparentMaterial = Bodies.rectangle(
    render.options.width / 2, 
    render.options.height / 2, 
    100, 
    100, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(147, 197, 253, 0.5)', // Light blue with transparency
      },
      chamfer: { radius: 5 },
      material: { type: 'transparent' }
    }
  );
  
  // Translucent material (purple)
  translucentMaterial = Bodies.rectangle(
    (render.options.width / 4) * 3, 
    render.options.height / 2, 
    100, 
    100, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(196, 181, 253, 0.7)', // Purple with transparency
      },
      chamfer: { radius: 5 },
      material: { type: 'translucent' }
    }
  );
  
  // Colored transparent material (red)
  coloredMaterial = Bodies.rectangle(
    render.options.width / 2, 
    (render.options.height / 4) * 3, 
    100, 
    100, 
    {
      ...materialOptions,
      render: {
        fillStyle: 'rgba(252, 165, 165, 0.7)', // Red with transparency
      },
      chamfer: { radius: 5 },
      material: { type: 'colored' }
    }
  );
  
  // Add bodies to world
  Composite.add(engine.world, [
    ...walls,
    lightSource,
    opaqueMaterial,
    transparentMaterial,
    translucentMaterial,
    coloredMaterial
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
  
  // Create light rays
  createLightRays();
  
  // Start animation loop
  animateLightRays();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
};

// Create light rays
const createLightRays = () => {
  lightRays = [];
  
  if (lightOn.value) {
    const rayStartPoint = {
      x: lightSource.position.x,
      y: lightSource.position.y
    };
    
    for (let i = 0; i < rayCount; i++) {
      const angle = -Math.PI / 2 + (rayAngleSpread / 2) - (i * (rayAngleSpread / (rayCount - 1)));
      
      lightRays.push({
        start: rayStartPoint,
        angle: angle,
        currentLength: 0,
        maxLength: rayLength,
        color: 'rgba(255, 255, 255, 0.7)'
      });
    }
  }
};

// Handle ray intersections with objects
const castRay = (ray) => {
  const rayStart = ray.start;
  const rayEnd = {
    x: rayStart.x + Math.cos(ray.angle) * ray.currentLength,
    y: rayStart.y + Math.sin(ray.angle) * ray.currentLength
  };
  
  // Check intersections with all bodies
  const bodies = Composite.allBodies(engine.world);
  
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    
    // Skip light source
    if (body === lightSource) continue;
    
    // Get the body's vertices
    const vertices = body.vertices;
    
    // Check each edge of the body
    for (let j = 0; j < vertices.length; j++) {
      const v1 = vertices[j];
      const v2 = vertices[(j + 1) % vertices.length];
      
      // Check if ray intersects with edge
      const intersection = lineIntersection(
        rayStart.x, rayStart.y, rayEnd.x, rayEnd.y,
        v1.x, v1.y, v2.x, v2.y
      );
      
      if (intersection) {
        // Calculate distance to intersection
        const dist = Math.sqrt(
          Math.pow(intersection.x - rayStart.x, 2) + 
          Math.pow(intersection.y - rayStart.y, 2)
        );
        
        // If this is closer than current ray length
        if (dist < ray.currentLength) {
          ray.currentLength = dist;
          rayEnd.x = intersection.x;
          rayEnd.y = intersection.y;
          
          // Handle different material types
          if (body.material && body.material.type) {
            ray.material = body.material.type; // Store the material type this ray hit
            
            switch (body.material.type) {
              case 'opaque':
                // Opaque material completely blocks light
                ray.blocked = true;
                break;
                
              case 'transparent':
                // Transparent material lets light pass through
                ray.blocked = false;
                break;
                
              case 'translucent':
                // Translucent material scatters light
                ray.angle += (Math.random() - 0.5) * 0.2;
                ray.color = 'rgba(255, 255, 255, 0.4)';
                break;
                
              case 'colored':
                // Colored material changes ray color
                ray.color = 'rgba(255, 100, 100, 0.7)';
                break;
            }
          }
        }
      }
    }
  }
  
  return rayEnd;
};

// Utility function to check if two line segments intersect
const lineIntersection = (x1, y1, x2, y2, x3, y3, x4, y4) => {
  const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  
  if (den === 0) {
    return null;
  }
  
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;
  
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return null;
  }
  
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1)
  };
};

// Animation loop for light rays
const animateLightRays = () => {
  if (!render || !render.context) return;
  
  const ctx = render.context;
  
  // Clear previous rays and shadows
  ctx.globalCompositeOperation = 'source-over';
  
  // Update ray lengths
  for (let ray of lightRays) {
    ray.currentLength = ray.maxLength;
    ray.blocked = false;
    ray.material = null; // Track what material the ray interacts with
  }
  
  // Animation frame
  animationFrameId = requestAnimationFrame(() => {
    if (!render || !render.context) return;
    
    // First, check if an opaque object is directly blocking the light
    let hasOpaqueBlocker = false;
    let hasTranslucentBlocker = false;
    
    // Check for material types in the direct path
    for (let ray of lightRays) {
      ray.start = {
        x: lightSource.position.x,
        y: lightSource.position.y
      };
      
      const rayEnd = castRay(ray);
      
      if (ray.blocked && ray.material === 'opaque') {
        hasOpaqueBlocker = true;
      } else if (ray.material === 'translucent') {
        hasTranslucentBlocker = true;
      }
    }
    
    // Fill background based on material interactions
    if (lightOn.value) {
      if (hasOpaqueBlocker) {
        // If blocked by opaque, make entire canvas black
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, render.options.width, render.options.height);
      } else if (hasTranslucentBlocker) {
        // If blocked by translucent, make entire canvas gray
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.fillRect(0, 0, render.options.width, render.options.height);
      }
      
      // Draw glow around light source
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        lightSource.position.x, lightSource.position.y, 0,
        lightSource.position.x, lightSource.position.y, 100
      );
      gradient.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(lightSource.position.x, lightSource.position.y, 100, 0, Math.PI * 2);
      ctx.fill();
      
      // Cast each ray
      shadows = [];
      
      for (let ray of lightRays) {
        ray.start = {
          x: lightSource.position.x,
          y: lightSource.position.y
        };
        
        const rayEnd = castRay(ray);
        
        // Don't draw rays anymore - they're invisible
        // if (!ray.blocked && !hasOpaqueBlocker) {
        //   ctx.beginPath();
        //   ctx.moveTo(ray.start.x, ray.start.y);
        //   ctx.lineTo(rayEnd.x, rayEnd.y);
        //   ctx.strokeStyle = ray.color;
        //   ctx.lineWidth = 1.5;
        //   ctx.stroke();
        // }
        
        // Store shadow data
        if (ray.blocked && ray.material === 'opaque') {
          shadows.push({
            x: rayEnd.x,
            y: rayEnd.y,
            angle: ray.angle
          });
        }
      }
      
      // Draw shadows only if not already completely darkened
      if (shadows.length > 0 && !hasOpaqueBlocker) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        
        for (let i = 0; i < shadows.length; i++) {
          const shadow = shadows[i];
          const shadowLength = 2000;
          
          const x1 = shadow.x;
          const y1 = shadow.y;
          const x2 = shadow.x + Math.cos(shadow.angle) * shadowLength;
          const y2 = shadow.y + Math.sin(shadow.angle) * shadowLength;
          
          if (i === 0) {
            ctx.moveTo(x1, y1);
          } else {
            ctx.lineTo(x1, y1);
          }
          
          if (i === shadows.length - 1) {
            ctx.lineTo(x2, y2);
            
            for (let j = shadows.length - 1; j >= 0; j--) {
              const s = shadows[j];
              const sx = s.x + Math.cos(s.angle) * shadowLength;
              const sy = s.y + Math.sin(s.angle) * shadowLength;
              
              ctx.lineTo(sx, sy);
            }
            
            ctx.closePath();
          }
        }
        
        ctx.fill();
      }
    }
    
    animateLightRays();
  });
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
  createLightRays();
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
    Body.setPosition(coloredMaterial, {
      x: render.options.width / 2,
      y: (render.options.height / 4) * 3
    });
    
    Body.setVelocity(opaqueMaterial, { x: 0, y: 0 });
    Body.setVelocity(transparentMaterial, { x: 0, y: 0 });
    Body.setVelocity(translucentMaterial, { x: 0, y: 0 });
    Body.setVelocity(coloredMaterial, { x: 0, y: 0 });
    
    Body.setAngularVelocity(opaqueMaterial, 0);
    Body.setAngularVelocity(transparentMaterial, 0);
    Body.setAngularVelocity(translucentMaterial, 0);
    Body.setAngularVelocity(coloredMaterial, 0);
  }
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
  
 
 