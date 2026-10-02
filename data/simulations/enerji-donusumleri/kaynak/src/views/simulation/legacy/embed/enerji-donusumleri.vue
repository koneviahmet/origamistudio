<template>
  <div class="bg-gray-100 h-screen">
    <div class="max-w-6xl mx-auto">
      
      <!-- Canvas Container -->
      <div class="relative bg-white h-full   transition-all duration-300">
        <div class="relative w-full" style="min-height: 500px">
          <!-- Minimal Tablo (Canvas içinde sol üstte) -->
          <div class="lg:absolute w-full lg:w-56 left-4 top-4 z-10 bg-white/80 backdrop-blur-sm shadow-md p-2   transition-all duration-300 hover:bg-white">
            <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-1.5 px-2  text-center -mt-2 -mx-2 mb-1">
              <h3 class="text-sm font-semibold">Enerji Karşılaştırması</h3>
            </div>

            <table class="w-full text-xs">
              <thead>
                <tr>
                  <th class="py-1 text-left text-slate-500 font-medium">Top</th>
                  <th class="py-1 text-right text-slate-500 font-medium">Kütle (kg)</th>
                  <th class="py-1 text-right text-slate-500 font-medium">PE (J)</th>
                  <th class="py-1 text-right text-slate-500 font-medium">KE (J)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="py-1">
                    <div class="flex items-center">
                      <div class="h-3 w-3 rounded-full bg-blue-500 mr-1 shadow-sm"></div>
                      <span class="font-medium text-slate-700">A</span>
                    </div>
                  </td>
                  <td class="py-1 text-right font-mono text-slate-700" id="massA"></td>
                  <td class="py-1 text-right font-mono text-slate-700" id="potentialEnergyA"></td>
                  <td class="py-1 text-right font-mono text-slate-700" id="kineticEnergyA"></td>
                </tr>
                <tr>
                  <td class="py-1">
                    <div class="flex items-center">
                      <div class="h-3 w-3 rounded-full bg-red-500 mr-1 shadow-sm"></div>
                      <span class="font-medium text-slate-700">B</span>
                    </div>
                  </td>
                  <td class="py-1 text-right font-mono text-slate-700" id="massB"></td>
                  <td class="py-1 text-right font-mono text-slate-700" id="potentialEnergyB"></td>
                  <td class="py-1 text-right font-mono text-slate-700" id="kineticEnergyB"></td>
                </tr>
              </tbody>
            </table>

          </div>
          
          
          <!-- Canvas -->
          <canvas 
            ref="physicsCanvas" 
            class="mx-auto canvas-container"
            style="max-width: 100%; height: auto;">
          </canvas>
        </div>
      </div>
      

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Events, Body } from "matter-js";

const physicsCanvas = ref(null);
let runner = null;
let render = null;

onMounted(() => {
  // Canvas boyutlarını ayarla
  const isMobile = window.innerWidth < 768;
  const canvasWidth = isMobile ? window.innerWidth - 40 : 800;
  const canvasHeight = isMobile ? 450 : 600;
  
  physicsCanvas.value.width = canvasWidth;
  physicsCanvas.value.height = canvasHeight;

  // Matter.js motorunu oluştur
  const engine = Engine.create();
  const world = engine.world;

  // Yerçekimi ivmesi
  const gravity = 10; // m/s²

  // Arka plan rengi - tüm duvarlar için kullanılacak
  const bgColor = "#ffffff";

  // Render oluştur
  render = Render.create({
    element: physicsCanvas.value.parentElement,
    canvas: physicsCanvas.value,
    engine: engine,
    options: {
      width: canvasWidth,
      height: canvasHeight,
      wireframes: false,
      background: bgColor, // Beyaz arka plan
      pixelRatio: 'auto', // Retina ekranlar için
    },
  });

  // Sınırları ve duvarları orantısal olarak ayarla
  const centerX = canvasWidth / 2;
  const groundY = canvasHeight - 20;
  
  // Zemin ve duvarlar oluştur - arka plan ile aynı renkte (görünmez)
  const ground = Bodies.rectangle(centerX, groundY, canvasWidth, 20, {
    isStatic: true,
    render: {
      fillStyle: bgColor, // Arka plan ile aynı renk
      strokeStyle: "rgba(203, 213, 225, 0.5)", // Sadece hafif bir kenar
      lineWidth: 1
    },
  });

  const leftWall = Bodies.rectangle(0, canvasHeight / 2, 20, canvasHeight, {
    isStatic: true,
    render: {
      fillStyle: bgColor, // Arka plan ile aynı renk
      strokeStyle: "rgba(203, 213, 225, 0.5)", // Sadece hafif bir kenar
      lineWidth: 1
    },
  });

  const rightWall = Bodies.rectangle(canvasWidth, canvasHeight / 2, 20, canvasHeight, {
    isStatic: true,
    render: {
      fillStyle: bgColor, // Arka plan ile aynı renk
      strokeStyle: "rgba(203, 213, 225, 0.5)", // Sadece hafif bir kenar
      lineWidth: 1
    },
  });

  const ceiling = Bodies.rectangle(centerX, 0, canvasWidth, 20, {
    isStatic: true,
    render: {
      fillStyle: bgColor, // Arka plan ile aynı renk
      strokeStyle: "rgba(203, 213, 225, 0.5)", // Sadece hafif bir kenar
      lineWidth: 1
    },
  });

  // Daha ince ve modern raflar oluştur
  const shelfOptions = {
    isStatic: true,
    render: {
      fillStyle: "#10b981", // Emerald-500
      strokeStyle: "#059669", // Emerald-600
      lineWidth: 1
    }
  };

  const shelf1 = Bodies.rectangle(canvasWidth * 0.25, canvasHeight * 0.66, canvasWidth * 0.4, 10, shelfOptions);
  const shelf2 = Bodies.rectangle(canvasWidth * 0.5, canvasHeight * 0.42, canvasWidth * 0.4, 10, shelfOptions);
  const shelf3 = Bodies.rectangle(canvasWidth * 0.75, canvasHeight * 0.18, canvasWidth * 0.4, 10, shelfOptions);

  World.add(world, [ground, leftWall, rightWall, ceiling, shelf1, shelf2, shelf3]);

  // Top boyutlarını küçült - kullanıcının isteğine göre
  const ballRadius = Math.min(canvasWidth, canvasHeight) * 0.035; // daha küçük boyut
  
  // Top A oluştur - 13 kg
  // Özel yoğunluk hesabı: Kütlenin belli bir değerde olması için yoğunluğu ayarlıyoruz
  // density = kütle / hacim. Hacim = (4/3) * PI * r^3 
  // 13 kg hedefi için uygun bir yoğunluk seçiyoruz.
  const massA = 13; // İstenen kütle 13 kg
  const densityA = massA / (Math.pow(ballRadius, 3) * Math.PI * 4/3) * 0.01;
  
  const ballA = Bodies.circle(canvasWidth * 0.3, canvasHeight * 0.2, ballRadius, {
    restitution: 0.8,
    density: densityA,
    frictionAir: 0.01,
    render: {
      fillStyle: "#3b82f6", // Blue-500
      strokeStyle: "#1d4ed8", // Blue-700
      lineWidth: 2,
    },
    label: "A",
  });

  // Top B oluştur - 26 kg (A topunun 2 katı)
  // Doğrudan kütleyi atamak yerine Body.setMass kullanarak hassas ayar yapıyoruz
  const massB = 26; // İstenen kütle 26 kg
  const densityB = massB / (Math.pow(ballRadius, 3) * Math.PI * 4/3) * 0.01;
  
  const ballB = Bodies.circle(canvasWidth * 0.7, canvasHeight * 0.2, ballRadius, {
    restitution: 0.8,
    density: densityB,
    frictionAir: 0.01,
    render: {
      fillStyle: "#ef4444", // Red-500
      strokeStyle: "#b91c1c", // Red-700
      lineWidth: 2,
    },
    label: "B",
  });

  // Kütlelerin tam olarak istenen değerlerde olduğundan emin olmak için
  Body.setMass(ballA, massA);
  Body.setMass(ballB, massB);

  World.add(world, [ballA, ballB]);

  // Mouse sürükleme etkinleştir ve daha iyi görsel geri bildirim
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: true,
        strokeStyle: "rgba(75, 85, 99, 0.4)",
        lineWidth: 1,
        type: "line"
      },
    },
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  // Enerji hesaplamaları
  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    // Top A potansiyel ve kinetik enerji hesaplama
    const yA = Math.max(0, ground.bounds.min.y - (ballA.position.y + ballRadius));
    const potentialEnergyA = yA > 0 ? ballA.mass * gravity * (yA / 100) : 0;
    const kineticEnergyA = 0.5 * ballA.mass * ballA.speed ** 2;

    // Top B potansiyel ve kinetik enerji hesaplama
    const yB = Math.max(0, ground.bounds.min.y - (ballB.position.y + ballRadius));
    const potentialEnergyB = yB > 0 ? ballB.mass * gravity * (yB / 100) : 0;
    const kineticEnergyB = 0.5 * ballB.mass * ballB.speed ** 2;

    // Tabloya değerleri yaz
    document.getElementById("massA").textContent = Math.round(massA); // Sabit 13 değeri
    document.getElementById("potentialEnergyA").textContent = potentialEnergyA.toFixed(2);
    document.getElementById("kineticEnergyA").textContent = kineticEnergyA.toFixed(2);

    document.getElementById("massB").textContent = Math.round(massB); // Sabit 26 değeri
    document.getElementById("potentialEnergyB").textContent = potentialEnergyB.toFixed(2);
    document.getElementById("kineticEnergyB").textContent = kineticEnergyB.toFixed(2);

    // Topların üzerine daha modern etiketler
    ctx.font = "bold 14px Inter, system-ui, sans-serif";
    
    // Top A için etiketler
    const labelA = "A";
    const massLabelA = `${Math.round(massA)} kg`;
    
    // Daha modern etiket arka planı A
    ctx.fillStyle = "rgba(59, 130, 246, 0.85)"; // Semi-transparent blue
    const textWidthA = ctx.measureText(labelA).width;
    const badgeRadiusA = textWidthA + 8;
    
    // Modern rozet şekli
    ctx.beginPath();
    ctx.arc(ballA.position.x, ballA.position.y - ballRadius - 12, badgeRadiusA / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // İnce çerçeve ekle
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Etiket metni A
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelA, ballA.position.x, ballA.position.y - ballRadius - 12);
    
    // Ağırlık gösterimi A - daha modern
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)"; // Semi-transparent slate-900
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillText(massLabelA, ballA.position.x, ballA.position.y + 4);
    
    // Top B için etiketler
    const labelB = "B";
    const massLabelB = `${Math.round(massB)} kg`;
    
    // Daha modern etiket arka planı B
    ctx.fillStyle = "rgba(239, 68, 68, 0.85)"; // Semi-transparent red
    const textWidthB = ctx.measureText(labelB).width;
    const badgeRadiusB = textWidthB + 8;
    
    // Modern rozet şekli
    ctx.beginPath();
    ctx.arc(ballB.position.x, ballB.position.y - ballRadius - 12, badgeRadiusB / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // İnce çerçeve ekle
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Etiket metni B
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelB, ballB.position.x, ballB.position.y - ballRadius - 12);
    
    // Ağırlık gösterimi B - daha modern
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)"; // Semi-transparent slate-900
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillText(massLabelB, ballB.position.x, ballB.position.y + 4);
    
    // Hareket çizgisi - estetik eklenti
    ctx.lineWidth = 1;
    
    // Top A hareket çizgisi
    if (ballA.speed > 0.5) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.beginPath();
      ctx.moveTo(ballA.position.x, ballA.position.y);
      ctx.lineTo(
        ballA.position.x - ballA.velocity.x * 5,
        ballA.position.y - ballA.velocity.y * 5
      );
      ctx.stroke();
    }
    
    // Top B hareket çizgisi
    if (ballB.speed > 0.5) {
      ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
      ctx.beginPath();
      ctx.moveTo(ballB.position.x, ballB.position.y);
      ctx.lineTo(
        ballB.position.x - ballB.velocity.x * 5,
        ballB.position.y - ballB.velocity.y * 5
      );
      ctx.stroke();
    }
  });

  // Simülasyonu başlat
  runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);
  
  // Pencere boyutu değiştiğinde canvas boyutunu ayarla
  window.addEventListener('resize', handleResize);
});

// Temizleme fonksiyonu
onUnmounted(() => {
  if (runner) Runner.stop(runner);
  if (render) Render.stop(render);
  window.removeEventListener('resize', handleResize);
});

// Ekran boyutu değiştiğinde yeniden boyutlandırma
const handleResize = () => {
  if (render) {
    const isMobile = window.innerWidth < 768;
    const canvasWidth = isMobile ? window.innerWidth - 40 : 800;
    const canvasHeight = isMobile ? 450 : 600;
    
    if (physicsCanvas.value) {
      physicsCanvas.value.width = canvasWidth;
      physicsCanvas.value.height = canvasHeight;
      
      render.options.width = canvasWidth;
      render.options.height = canvasHeight;
      render.canvas.width = canvasWidth;
      render.canvas.height = canvasHeight;
    }
  }
};
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: auto;
  max-height: 600px;
  display: block;
}

@media (max-width: 768px) {
  .canvas-container {
    max-height: 450px;
  }
}

/* Animasyonlar */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.bg-white {
  animation: fadeIn 0.5s ease-out;
}

/* Pürüzsüz geçişler */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
