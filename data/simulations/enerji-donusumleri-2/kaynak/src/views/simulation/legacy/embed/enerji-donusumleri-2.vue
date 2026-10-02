<template>
  <div class="simulation-container">
    <div class="canvas-wrapper">
      <canvas 
        ref="canvas" 
        class="simulation-canvas"
        :width="canvasWidth" 
        :height="canvasHeight">
      </canvas>
      
      <!-- Energy information table positioned absolute on top-left corner -->
      <div class="energy-info">
        <div class="energy-row">
          <div class="energy-label">Potansiyel Enerji:</div>
          <div class="energy-value">{{ Math.ceil(potentialEnergy) - 10 > 0 ? Math.ceil(potentialEnergy) - 10 : 0 }} J</div>
        </div>
        <div class="energy-row">
          <div class="energy-label">Kinetik Enerji:</div>
          <div class="energy-value">{{ Math.ceil(kineticEnergy) - 2 > 0 ? Math.ceil(kineticEnergy) - 2 : 0 }} J</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import Matter from "matter-js";

const canvasWidth = ref(800);
const canvasHeight = ref(400);
const ballMass = 5; // kg
const gravity = 9.81; // m/s²

const potentialEnergy = ref(0);
const kineticEnergy = ref(0);

// Store references to cleanup event listeners
let engine = null;
let render = null;
let runner = null;
let resizeObserver = null;

onMounted(() => {
  // Add viewport meta tag for mobile if not already present
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
  }

  // Handle responsive canvas sizing with enhanced mobile support
  const updateCanvasSize = () => {
    const container = document.querySelector('.canvas-wrapper');
    if (container) {
      // For mobile, use appropriate dimensions based on orientation
      const isMobile = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      
      const maxWidth = Math.min(container.clientWidth, isMobile ? window.innerWidth : 1200);
      canvasWidth.value = maxWidth;
      
      // Adjust aspect ratio based on device and orientation
      let aspectRatio = 0.5; // Default desktop aspect ratio
      
      if (isMobile) {
        aspectRatio = isLandscape ? 0.6 : 0.8; // Different ratios for mobile orientations
      }
      
      canvasHeight.value = maxWidth * aspectRatio;
      
      // Update rendering if already initialized
      if (render) {
        render.options.width = canvasWidth.value;
        render.options.height = canvasHeight.value;
        render.canvas.width = canvasWidth.value;
        render.canvas.height = canvasHeight.value;
        Matter.Render.setPixelRatio(render, window.devicePixelRatio);
      }
    }
  };
  
  // Use ResizeObserver for more reliable size tracking
  resizeObserver = new ResizeObserver(updateCanvasSize);
  const container = document.querySelector('.canvas-wrapper');
  if (container) {
    resizeObserver.observe(container);
  }
  
  // Also handle window resize and orientation change
  window.addEventListener('resize', updateCanvasSize);
  window.addEventListener('orientationchange', () => {
    // Short delay to ensure dimensions are updated after orientation change
    setTimeout(updateCanvasSize, 100);
  });
  
  updateCanvasSize();
  const canvas = document.querySelector("canvas");

  // Matter.js setup
  engine = Matter.Engine.create();
  render = Matter.Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: canvasWidth.value,
      height: canvasHeight.value,
      wireframes: false,
      background: "#ffffff", // White background
      pixelRatio: window.devicePixelRatio
    },
  });

  // Calculate ground level (bottom of canvas minus wall thickness)
  const groundLevel = canvasHeight.value - 10;

  // Create ramp positioned on the left side, touching the ground
  const rampLength = canvasWidth.value * 0.6; // Proportional to canvas width
  const rampHeight = 20;
  const rampAngle = -Math.PI / 6; // 30 degrees
  
  // Position ramp on left side touching the ground
  const rampX = rampLength * 1;
  const rampY = groundLevel - (Math.sin(Math.abs(rampAngle)) * rampLength) / 2;

  const ramp = Matter.Bodies.rectangle(rampX, rampY, rampLength, rampHeight, {
    isStatic: true,
    angle: rampAngle,
    render: {
      fillStyle: "#8c8c8c",
    },
    label: "ramp"
  });

  // Create ball
  const ball = Matter.Bodies.circle(rampX + rampLength * 0.3, groundLevel - 150, 20, {
    mass: ballMass,
    restitution: 0.6,
    render: {
      fillStyle: "#ff5722",
    },
    label: "ball"
  });

  // Add boundaries (walls) - all white
  const walls = [
    Matter.Bodies.rectangle(canvasWidth.value / 2, 0, canvasWidth.value, 10, { 
      isStatic: true,
      render: { fillStyle: "#ffffff" },
      label: "topWall"
    }),
    Matter.Bodies.rectangle(canvasWidth.value / 2, canvasHeight.value, canvasWidth.value, 10, { 
      isStatic: true,
      render: { fillStyle: "#ffffff" },
      label: "bottomWall"
    }),
    Matter.Bodies.rectangle(0, canvasHeight.value / 2, 10, canvasHeight.value, { 
      isStatic: true,
      render: { fillStyle: "#ffffff" },
      label: "leftWall"
    }),
    Matter.Bodies.rectangle(canvasWidth.value, canvasHeight.value / 2, 10, canvasHeight.value, { 
      isStatic: true,
      render: { fillStyle: "#ffffff" },
      label: "rightWall"
    }),
  ];

  // Add enhanced touch/mouse control
  const mouse = Matter.Mouse.create(canvas);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false,
      },
    },
  });

  // Enhanced mobile touch event handling
  let lastTouchTime = 0;
  const touchTimeout = 300; // ms to detect double-tap
  
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent default browser behavior
    
    if (e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches[0];
      
      // Convert touch position to canvas coordinates
      mouse.position.x = touch.clientX - rect.left;
      mouse.position.y = touch.clientY - rect.top;
      mouse.mousedown = true;
      
      // Handle double-tap to reset ball position
      const now = new Date().getTime();
      const timeSince = now - lastTouchTime;
      
      if (timeSince < touchTimeout) {
        // Reset ball position on double-tap
        Matter.Body.setPosition(ball, {
          x: rampX + rampLength * 0.3,
          y: groundLevel - 150
        });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      }
      
      lastTouchTime = now;
    }
  }, { passive: false });
  
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    
    if (e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches[0];
      
      mouse.position.x = touch.clientX - rect.left;
      mouse.position.y = touch.clientY - rect.top;
    }
  }, { passive: false });
  
  canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    mouse.mousedown = false;
  }, { passive: false });

  Matter.World.add(engine.world, [ramp, ball, ...walls, mouseConstraint]);

  // Energy calculations
  Matter.Events.on(engine, "afterUpdate", () => {
    // Set potential energy = 0 at ground level
    const height = groundLevel - ball.position.y;
    
    // PE = mgh, height is zero or negative when at or below ground level
    potentialEnergy.value = ballMass * gravity * (height / 100); 
    potentialEnergy.value = Math.max(0, potentialEnergy.value); // Ensure PE never goes negative
    
    const speed = Math.sqrt(
      Math.pow(ball.velocity.x, 2) + Math.pow(ball.velocity.y, 2)
    );
    kineticEnergy.value = 0.5 * ballMass * Math.pow(speed, 2); // KE = 0.5 * m * v²
  });

  // Robust resize handler that updates physics bodies
  const handleResize = () => {
    updateCanvasSize();
    
    // Scale and reposition physics bodies based on new canvas size
    const groundLevel = canvasHeight.value - 10;
    const rampLength = canvasWidth.value * 0.6;
    const rampX = rampLength * 0.35;
    const rampY = groundLevel - (Math.sin(Math.abs(-Math.PI / 6)) * rampLength) / 2;
    
    // Update ramp
    const rampBody = Matter.Composite.allBodies(engine.world).find(body => body.label === "ramp");
    if (rampBody) {
      Matter.Body.setPosition(rampBody, { x: rampX, y: rampY });
      Matter.Body.scale(rampBody, rampLength / rampBody.bounds.max.x - rampBody.bounds.min.x, 1);
    }
    
    // Update walls
    const topWall = Matter.Composite.allBodies(engine.world).find(body => body.label === "topWall");
    const bottomWall = Matter.Composite.allBodies(engine.world).find(body => body.label === "bottomWall");
    const leftWall = Matter.Composite.allBodies(engine.world).find(body => body.label === "leftWall");
    const rightWall = Matter.Composite.allBodies(engine.world).find(body => body.label === "rightWall");
    
    if (topWall) Matter.Body.setPosition(topWall, { x: canvasWidth.value / 2, y: 0 });
    if (bottomWall) Matter.Body.setPosition(bottomWall, { x: canvasWidth.value / 2, y: canvasHeight.value });
    if (leftWall) Matter.Body.setPosition(leftWall, { x: 0, y: canvasHeight.value / 2 });
    if (rightWall) Matter.Body.setPosition(rightWall, { x: canvasWidth.value, y: canvasHeight.value / 2 });
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);
  Matter.Render.run(render);
});

// Proper cleanup to prevent memory leaks
onBeforeUnmount(() => {
  // Remove event listeners
  window.removeEventListener('resize', () => {});
  window.removeEventListener('orientationchange', () => {});
  
  // Stop Matter.js
  if (runner) Matter.Runner.stop(runner);
  if (render) Matter.Render.stop(render);
  
  // Cleanup resize observer
  if (resizeObserver) resizeObserver.disconnect();
  
  // Clear references
  engine = null;
  render = null;
  runner = null;
  resizeObserver = null;
});
</script>

<style>
.simulation-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden; /* Prevent scrolling on mobile */
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  max-width: 1200px;
  touch-action: none; /* Completely disable browser touch actions */
}

.simulation-canvas {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.energy-info {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 140px;
}

.energy-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.energy-row:last-child {
  margin-bottom: 0;
}

.energy-label {
  font-weight: 600;
  margin-right: 12px;
  color: #333;
}

.energy-value {
  font-family: monospace;
  color: #ff5722;
  font-weight: bold;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .energy-info {
    padding: 8px;
    top: 10px;
    left: 10px;
    font-size: 12px;
    max-width: 40%;
  }
  
  .energy-row {
    font-size: 12px;
  }
  
  .energy-label {
    margin-right: 8px;
  }
}

/* Portrait orientation adjustments */
@media (max-width: 768px) and (orientation: portrait) {
  .canvas-wrapper {
    max-height: calc(100vh - 60px); /* Prevent overflow on portrait mode */
  }
}

/* Landscape orientation adjustments */
@media (max-width: 768px) and (orientation: landscape) {
  .energy-info {
    max-width: 30%;
  }
}

/* Prevent scrolling and zooming on touch devices */
@media (hover: none) and (pointer: coarse) {
  html, body {
    touch-action: none;
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
}
</style>
