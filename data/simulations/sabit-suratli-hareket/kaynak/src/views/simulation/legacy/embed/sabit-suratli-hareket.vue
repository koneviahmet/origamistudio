<template>
  <div class="simulation-container h-screen overflow-auto">    
    <div class="content-wrapper">
      <div class="controls-wrapper">
        <div class="controls">
          <button @click="toggleSimulation" class="control-button text-sm" :disabled="time >= maxSimulationTime || reachedBoundary">
            {{ isRunning ? 'Durdur' : 'Başlat' }}
          </button>
          <button @click="resetSimulation" class="control-button text-sm">Sıfırla</button>
          <div class="parameters">
            <div class="parameter-display">
              <span class="parameter-label">Hız:</span>
              <span class="parameter-value">5 m/s</span>
            </div>
            <div class="parameter-display">
              <span class="parameter-label">Max Süre:</span>
              <span class="parameter-value">{{ maxSimulationTime.toFixed(1) }} s</span>
            </div>
          </div>
        </div>

        <div class="simulation-info">
          <div class="info-item">
            <span class="info-label">Zaman:</span>
            <span class="info-value">{{ time.toFixed(1) }} s</span>
          </div>
          <div class="info-item">
            <span class="info-label">Hız:</span>
            <span class="info-value">{{ velocity }} m/s</span>
          </div>
          <div class="info-item">
            <span class="info-label">Alınan Yol:</span>
            <span class="info-value">{{ distance.toFixed(1) }} m</span>
          </div>
        </div>
      </div>

      <div class="visualization">
        <div class="motion-area" ref="motionArea">
          <div 
            class="object" 
            :style="{ left: `${objectPosition}px` }"
            :class="{ moving: isRunning }"
          ></div>
          <div class="track"></div>
          <div class="distance-markers">
            <div v-for="marker in distanceMarkers" :key="marker" 
                class="distance-marker" 
                :style="{ left: `${marker * pixelsPerMeter}px` }">
              <div class="marker-line"></div>
              <div class="marker-label">{{ marker }}m</div>
            </div>
          </div>
          <div class="boundary-marker" :style="{ left: `${maxAllowablePixels}px` }"></div>
        </div>
        <div class="progress-bar">
          <div class="progress" :style="{ width: `${(time / maxSimulationTime) * 100}%` }"></div>
        </div>
        <div v-if="reachedBoundary" class="boundary-message">
          Nesne animasyon alanının sınırına ulaştı!
        </div>
      </div>

      <div class="results-container">
        <div class="graph-container">
          <div class="tabs">
            <button 
              @click="activeTab = 'velocity'" 
              :class="{ active: activeTab === 'velocity' }" 
              class="tab-button"
            >
              Sürat-Zaman Grafiği
            </button>
            <button 
              @click="activeTab = 'distance'" 
              :class="{ active: activeTab === 'distance' }" 
              class="tab-button"
            >
              Yol-Zaman Grafiği
            </button>
            <button 
              @click="activeTab = 'table'" 
              :class="{ active: activeTab === 'table' }" 
              class="tab-button"
            >
              Veri Tablosu
            </button>
          </div>

          <div class="graph-view">
            <div v-if="activeTab === 'velocity'" class="graph">
              <h3>Sürat-Zaman Grafiği</h3>
              <div class="canvas-container">
                <canvas ref="velocityTimeCanvas" width="600" height="200"></canvas>
              </div>
              <div class="graph-explanation">
                <p>Sabit süratli harekette, sürat-zaman grafiği zaman eksenine paralel bir doğru şeklindedir.</p>
              </div>
            </div>
            <div v-if="activeTab === 'distance'" class="graph">
              <h3>Yol-Zaman Grafiği</h3>
              <div class="canvas-container">
                <canvas ref="distanceTimeCanvas" width="600" height="200"></canvas>
              </div>
              <div class="graph-explanation">
                <p>Sabit süratli harekette, yol-zaman grafiği orijinden geçen bir doğru şeklindedir. Bu doğrunun eğimi hıza eşittir.</p>
              </div>
            </div>
            <div v-if="activeTab === 'table'" class="data-view">
              <h3>Hareket Verileri</h3>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Zaman (s)</th>
                      <th>Hız (m/s)</th>
                      <th>Alınan Yol (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="tableData.length === 0">
                      <td colspan="3" class="no-data">Henüz veri yok. Similasyonu başlatın.</td>
                    </tr>
                    <tr v-for="(data, index) in tableData" :key="index">
                      <td>{{ data.time }}</td>
                      <td>{{ data.velocity }}</td>
                      <td>{{ data.distance.toFixed(1) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed, nextTick } from 'vue';

// Simulation parameters
const velocity = ref(5); // Fixed velocity at 5 m/s
const objectPosition = ref(0); // px
const distance = ref(0); // m
const time = ref(0); // s
const isRunning = ref(false);
const maxSimulationTime = ref(0); // Calculated based on screen width
const activeTab = ref('table'); // Default active tab
const reachedBoundary = ref(false);

// Table data
const tableData = ref([]);
let lastSecondRecorded = -1; // Track the last second we recorded data for

// Motion area reference and boundary
const motionArea = ref(null);
const maxAllowablePixels = ref(0);
const maxAllowableDistance = ref(0);

// Canvas references
const velocityTimeCanvas = ref(null);
const distanceTimeCanvas = ref(null);

// Graph data - we'll store only whole second data points
const velocityTimeData = ref([]);
const distanceTimeData = ref([]);

// Animation
let animationId = null;
const lastTimestamp = ref(null);
const pixelsPerMeter = 25; // Conversion factor - reduced by 50% from 50 to 25

// Compute distance markers based on velocity and max time
const distanceMarkers = computed(() => {
  const maxDistance = Math.min(velocity.value * maxSimulationTime.value, maxAllowableDistance.value);
  const markers = [];
  const markerInterval = Math.max(1, Math.floor(maxDistance / 10)); // Place markers at reasonable intervals
  
  for (let i = markerInterval; i <= maxDistance; i += markerInterval) {
    markers.push(i);
  }
  
  return markers;
});

// Calculate maximum distance based on motion area width
function calculateMaxAllowableDistance() {
  if (!motionArea.value) return;
  
  // Get the width of the motion area and subtract the object width (40px) and a small margin
  const areaWidth = motionArea.value.clientWidth;
  maxAllowablePixels.value = areaWidth - 60; // 40px for object width + 20px margin
  maxAllowableDistance.value = maxAllowablePixels.value / pixelsPerMeter;
  
  // Update max simulation time based on distance and velocity
  maxSimulationTime.value = maxAllowableDistance.value / velocity.value;
}

// Toggle simulation state
function toggleSimulation() {
  isRunning.value = !isRunning.value;
  
  if (isRunning.value) {
    reachedBoundary.value = false;
    lastTimestamp.value = performance.now();
    animationId = requestAnimationFrame(updateSimulation);
  } else {
    cancelAnimationFrame(animationId);
  }
}

// Reset simulation
function resetSimulation() {
  if (isRunning.value) {
    toggleSimulation();
  }
  
  objectPosition.value = 0;
  distance.value = 0;
  time.value = 0;
  reachedBoundary.value = false;
  velocityTimeData.value = [];
  distanceTimeData.value = [];
  tableData.value = [];
  lastSecondRecorded = -1;
  
  calculateMaxAllowableDistance();
  drawVelocityTimeGraph();
  drawDistanceTimeGraph();
}

// Check if we should record data at this second
function checkAndRecordSecondData() {
  // Get the current whole second
  const currentSecond = Math.floor(time.value);
  
  // If we haven't recorded this second yet
  if (currentSecond > lastSecondRecorded) {
    // Record data for table and graphs
    const dataPoint = {
      time: currentSecond,
      velocity: velocity.value,
      distance: velocity.value * currentSecond // Calculate exact distance for the second
    };
    
    // Cap distance at boundary if needed
    if (dataPoint.distance > maxAllowableDistance.value) {
      dataPoint.distance = maxAllowableDistance.value;
    }
    
    // Add to graph data
    velocityTimeData.value.push({ time: dataPoint.time, velocity: dataPoint.velocity });
    distanceTimeData.value.push({ time: dataPoint.time, distance: dataPoint.distance });
    
    // Add to table data
    tableData.value.push(dataPoint);
    
    // Update last second recorded
    lastSecondRecorded = currentSecond;
    
    // Update active graph
    if (activeTab.value === 'velocity') {
      drawVelocityTimeGraph();
    } else if (activeTab.value === 'distance') {
      drawDistanceTimeGraph();
    }
  }
}

// Update simulation state
function updateSimulation(timestamp) {
  if (!isRunning.value) return;
  
  const deltaTime = (timestamp - lastTimestamp.value) / 1000; // Convert to seconds
  lastTimestamp.value = timestamp;
  
  time.value += deltaTime;
  
  // Calculate new distance and check if it exceeds the boundary
  const newDistance = distance.value + (velocity.value * deltaTime);
  
  if (newDistance >= maxAllowableDistance.value) {
    // Object reached the boundary
    distance.value = maxAllowableDistance.value;
    objectPosition.value = maxAllowablePixels.value;
    reachedBoundary.value = true;
    isRunning.value = false;
    
    // Make sure we record the final state
    checkAndRecordSecondData();
  } else {
    // Normal movement
    distance.value = newDistance;
    objectPosition.value = distance.value * pixelsPerMeter;
    
    // Check if we need to record data for this second
    checkAndRecordSecondData();
    
    // Check if max time reached
    if (time.value >= maxSimulationTime.value) {
      isRunning.value = false;
      
      // Make sure we record the final state
      checkAndRecordSecondData();
    } else {
      // Request next frame
      animationId = requestAnimationFrame(updateSimulation);
    }
  }
}

// Draw velocity-time graph
function drawVelocityTimeGraph() {
  if (!velocityTimeCanvas.value) return;
  
  const ctx = velocityTimeCanvas.value.getContext('2d');
  const width = velocityTimeCanvas.value.width;
  const height = velocityTimeCanvas.value.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw grid
  drawGrid(ctx, width, height);
  
  // Draw axes
  ctx.beginPath();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.moveTo(50, 20);
  ctx.lineTo(50, height - 30);
  ctx.lineTo(width - 20, height - 30);
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Zaman (s)', width / 2, height - 10);
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Sürat (m/s)', 0, 0);
  ctx.restore();
  
  // Axis values
  const effectiveMaxTime = reachedBoundary.value ? 
    Math.ceil(maxAllowableDistance.value / velocity.value) : 
    maxSimulationTime.value;
  
  const maxTime = Math.min(effectiveMaxTime, maxSimulationTime.value);
  
  // Draw time axis with 1-second intervals
  for (let t = 0; t <= maxTime; t += 1) {
    const x = 50 + (t / maxTime) * (width - 70);
    ctx.beginPath();
    ctx.moveTo(x, height - 30);
    ctx.lineTo(x, height - 25);
    ctx.stroke();
    ctx.fillText(`${t}`, x - 5, height - 15);
  }
  
  const maxVelocity = Math.max(velocity.value * 1.5, 10);
  const velocityInterval = Math.max(1, Math.floor(maxVelocity / 5));
  for (let v = 0; v <= maxVelocity; v += velocityInterval) {
    const y = (height - 30) - (v / maxVelocity) * (height - 50);
    ctx.beginPath();
    ctx.moveTo(45, y);
    ctx.lineTo(50, y);
    ctx.stroke();
    ctx.fillText(`${v}`, 30, y + 4);
  }
  
  // Plot data
  if (velocityTimeData.value.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    
    velocityTimeData.value.forEach((point, index) => {
      const x = 50 + (point.time / maxTime) * (width - 70);
      const y = (height - 30) - (point.velocity / maxVelocity) * (height - 50);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points at each second
    ctx.fillStyle = 'red';
    velocityTimeData.value.forEach(point => {
      const x = 50 + (point.time / maxTime) * (width - 70);
      const y = (height - 30) - (point.velocity / maxVelocity) * (height - 50);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Draw distance-time graph
function drawDistanceTimeGraph() {
  if (!distanceTimeCanvas.value) return;
  
  const ctx = distanceTimeCanvas.value.getContext('2d');
  const width = distanceTimeCanvas.value.width;
  const height = distanceTimeCanvas.value.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw grid
  drawGrid(ctx, width, height);
  
  // Draw axes
  ctx.beginPath();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.moveTo(50, 20);
  ctx.lineTo(50, height - 30);
  ctx.lineTo(width - 20, height - 30);
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Zaman (s)', width / 2, height - 10);
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Yol (m)', 0, 0);
  ctx.restore();
  
  // Axis values
  const effectiveMaxTime = reachedBoundary.value ? 
    Math.ceil(maxAllowableDistance.value / velocity.value) : 
    maxSimulationTime.value;
  
  const maxTime = Math.min(effectiveMaxTime, maxSimulationTime.value);
  
  // Draw time axis with 1-second intervals
  for (let t = 0; t <= maxTime; t += 1) {
    const x = 50 + (t / maxTime) * (width - 70);
    ctx.beginPath();
    ctx.moveTo(x, height - 30);
    ctx.lineTo(x, height - 25);
    ctx.stroke();
    ctx.fillText(`${t}`, x - 5, height - 15);
  }
  
  const maxDistance = Math.min(velocity.value * maxTime, maxAllowableDistance.value);
  const distanceInterval = Math.max(1, Math.floor(maxDistance / 5));
  for (let d = 0; d <= maxDistance; d += distanceInterval) {
    const y = (height - 30) - (d / maxDistance) * (height - 50);
    ctx.beginPath();
    ctx.moveTo(45, y);
    ctx.lineTo(50, y);
    ctx.stroke();
    ctx.fillText(`${d}`, 30, y + 4);
  }
  
  // Plot data
  if (distanceTimeData.value.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    
    distanceTimeData.value.forEach((point, index) => {
      const x = 50 + (point.time / maxTime) * (width - 70);
      const y = (height - 30) - (point.distance / maxDistance) * (height - 50);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points at each second
    ctx.fillStyle = 'blue';
    distanceTimeData.value.forEach(point => {
      const x = 50 + (point.time / maxTime) * (width - 70);
      const y = (height - 30) - (point.distance / maxDistance) * (height - 50);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Function to resize canvas
function resizeCanvas() {
  if (velocityTimeCanvas.value && distanceTimeCanvas.value) {
    const canvasContainer = velocityTimeCanvas.value.closest('.canvas-container');
    if (canvasContainer) {
      const containerWidth = canvasContainer.clientWidth;
      
      velocityTimeCanvas.value.width = containerWidth;
      distanceTimeCanvas.value.width = containerWidth;
      
      drawVelocityTimeGraph();
      drawDistanceTimeGraph();
    }
  }
}

// Draw grid on canvas
function drawGrid(ctx, width, height) {
  ctx.beginPath();
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  
  // Vertical lines - draw at each second
  const effectiveMaxTime = reachedBoundary.value ? 
    Math.ceil(maxAllowableDistance.value / velocity.value) : 
    maxSimulationTime.value;
  
  const maxTime = Math.min(effectiveMaxTime, maxSimulationTime.value);
  
  for (let t = 0; t <= maxTime; t += 1) {
    const x = 50 + (t / maxTime) * (width - 70);
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height - 30);
  }
  
  // Horizontal lines
  for (let y = height - 30; y > 20; y -= 30) {
    ctx.moveTo(50, y);
    ctx.lineTo(width - 20, y);
  }
  
  ctx.stroke();
}

// Watch for changes in tab selection
watch(activeTab, () => {
  nextTick(() => {
    if (activeTab.value === 'velocity') {
      drawVelocityTimeGraph();
    } else if (activeTab.value === 'distance') {
      drawDistanceTimeGraph();
    }
  });
});

// Watch for changes in velocity to update markers and max time
watch(velocity, () => {
  calculateMaxAllowableDistance();
  drawVelocityTimeGraph();
  drawDistanceTimeGraph();
});

// Enable tab navigation with keyboard
function handleKeyDown(event) {
  if (event.key === 'Tab') {
    event.preventDefault();
    
    // Cycle through tabs: velocity -> distance -> table -> velocity
    if (activeTab.value === 'velocity') {
      activeTab.value = 'distance';
    } else if (activeTab.value === 'distance') {
      activeTab.value = 'table';
    } else {
      activeTab.value = 'velocity';
    }
  }
}

// Handle window resize
function handleResize() {
  calculateMaxAllowableDistance();
  resizeCanvas();
}

// Set up simulation on mount
onMounted(() => {
  nextTick(() => {
    calculateMaxAllowableDistance();
    resizeCanvas();
  });
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
});

// Clean up on unmount
onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
});
</script>
  
<style scoped>
.simulation-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
  overflow-x: hidden;
}

.header {
  background-color: #4CAF50;
  color: white;
  padding: 1rem;
  text-align: center;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: clamp(1.2rem, 4vw, 2rem);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1rem;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.controls-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

@media (min-width: 768px) {
  .controls-wrapper {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.control-button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.control-button:hover:not(:disabled) {
  background-color: #45a049;
}

.control-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.parameters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.parameter-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.parameter-label {
  font-size: 0.875rem;
  color: #555;
}

.parameter-value {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
}

.simulation-info {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  padding: 0.75rem;
  background-color: #efefef;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #555;
}

.info-value {
  font-size: 1.125rem;
  font-weight: bold;
  color: #333;
}

.visualization {
  position: relative;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.motion-area {
  position: relative;
  height: 100px;
  width: 100%;
  margin: 1rem 0;
  overflow: hidden;
  border: 1px dashed #ccc;
  border-radius: 4px;
}

@media (min-width: 768px) {
  .motion-area {
    height: 120px;
  }
}

.object {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f44336;
  top: 10px;
  transition: left 0.05s linear;
  z-index: 2;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.object.moving {
  transition: none;
}

.track {
  position: absolute;
  height: 4px;
  width: 100%;
  background-color: #888;
  top: 30px;
  z-index: 1;
}

.distance-markers {
  position: absolute;
  top: 35px;
  width: 100%;
  height: 30px;
}

.distance-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-line {
  height: 10px;
  width: 2px;
  background-color: #888;
}

.marker-label {
  font-size: 12px;
  color: #555;
}

.boundary-marker {
  position: absolute;
  height: 80px;
  width: 2px;
  background-color: #f44336;
  top: 10px;
  z-index: 1;
}

.boundary-message {
  margin-top: 0.5rem;
  color: #f44336;
  font-weight: bold;
  text-align: center;
  padding: 0.5rem;
  background-color: #ffebee;
  border-radius: 4px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.1s linear;
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.graph-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tabs {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tab-button {
  padding: 0.75rem 0.5rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.3s;
  flex: 1;
  text-align: center;
}

@media (min-width: 768px) {
  .tab-button {
    font-size: 1rem;
    padding: 1rem;
  }
}

.tab-button:hover {
  background-color: #e8e8e8;
}

.tab-button.active {
  background-color: #fff;
  border-bottom: 3px solid #4CAF50;
  font-weight: bold;
}

.graph-view {
  padding: 1rem;
}

.graph, .data-view {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.graph h3, .data-view h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: #333;
  text-align: center;
}

.canvas-container {
  width: 100%;
  position: relative;
}

.graph-explanation {
  background-color: #f5f5f5;
  padding: 0.75rem;
  border-radius: 5px;
  font-size: 0.875rem;
  color: #333;
  margin-top: 0.5rem;
}

.table-responsive {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.5rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.data-table tr:hover {
  background-color: #f0f0f0;
}

.no-data {
  text-align: center;
  color: #888;
  padding: 1rem !important;
}

canvas {
  width: 100%;
  height: auto;
  display: block;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

/* Responsive layout adjustments */
@media (min-width: 992px) {
  .content-wrapper {
    padding: 1.5rem;
  }
  
  .graph-container {
    margin-top: 0;
  }
  
  .graph h3, .data-view h3 {
    font-size: 1.25rem;
  }
  
  .canvas-container {
    min-height: 250px;
  }
}

@media (min-width: 1200px) {
  .content-wrapper {
    padding: 2rem;
  }
  
  .canvas-container {
    min-height: 300px;
  }
}

/* For print mode */
@media print {
  .simulation-container {
    height: auto;
  }
  
  .controls {
    display: none;
  }
  
  .graph-container {
    break-inside: avoid;
  }
}
</style>
  
 
 