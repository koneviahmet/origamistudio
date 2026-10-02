<template>
  <div>
    <canvas ref="physicsCanvas" width="800" height="600" style="border: 1px solid black;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Events, Body } from "matter-js";

const physicsCanvas = ref(null);

onMounted(() => {
  // Matter.js motorunu oluştur
  const engine = Engine.create();
  const world = engine.world;

  // Yerçekimi ivmesi
  const gravity = 10; // m/s²

  // Render oluştur
  const render = Render.create({
    element: physicsCanvas.value.parentElement,
    canvas: physicsCanvas.value,
    engine: engine,
    options: {
      width: 800,
      height: 600,
      wireframes: false, // Daha iyi görsel kalite için
      background: "rgb(200, 200, 200)", // Sabit gri arka plan
    },
  });

  // Zemin ve duvarlar oluştur
  const ground = Bodies.rectangle(400, 590, 800, 20, {
    isStatic: true,
    render: {
      fillStyle: "brown",
    },
  });

  const leftWall = Bodies.rectangle(0, 300, 20, 600, {
    isStatic: true,
    render: {
      fillStyle: "gray",
    },
  });

  const rightWall = Bodies.rectangle(800, 300, 20, 600, {
    isStatic: true,
    render: {
      fillStyle: "gray",
    },
  });

  const ceiling = Bodies.rectangle(400, 0, 800, 20, {
    isStatic: true,
    render: {
      fillStyle: "brown", // Görsel olarak üst kısmı belirgin yap
    },
  });

  World.add(world, [ground, leftWall, rightWall, ceiling]);

  // Top oluştur
  const ball = Bodies.circle(400, 100, 30, {
    restitution: 0.8, // Sekme etkisi
    density: 0.01, // Top yoğunluğu
    frictionAir: 0.01, // Havadaki sürtünme
    render: {
      fillStyle: "blue", // Top rengi
    },
  });
  World.add(world, ball);

  // Top hız limiti belirle
  Events.on(engine, "beforeUpdate", () => {
    const maxSpeed = 20; // Maksimum hız limiti
    if (ball.speed > maxSpeed) {
      Body.setVelocity(ball, {
        x: (ball.velocity.x / ball.speed) * maxSpeed,
        y: (ball.velocity.y / ball.speed) * maxSpeed,
      });
    }
  });

  // Mouse sürükleme etkinleştir
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2, // Sürükleme sertliği
      render: {
        visible: false, // Bağlantı çizgisini gösterme
      },
    },
  });
  World.add(world, mouseConstraint);

  render.mouse = mouse;

  // Enerji hesaplamaları
  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    // Topun pozisyon ve hız bilgileri
    const ballBottomY = ball.position.y + 30; // Topun alt noktası
    const groundTopY = ground.bounds.min.y; // Zeminin üst noktası
    const y = ballBottomY >= groundTopY ? 0 : Math.max(0, groundTopY - ballBottomY); // Topun yüksekliği
    const velocity = ball.speed; // Topun hız büyüklüğü

    // Enerji hesaplamaları
    const mass = ball.mass; // Topun kütlesi
    const potentialEnergy = y > 0 ? mass * gravity * (y / 100) : 0; // Potansiyel enerji
    const kineticEnergy = 0.5 * mass * velocity ** 2; // Kinetik enerji

    // Metin yazdırma
    ctx.clearRect(0, 0, 800, 50); // Üstteki alanı temizle
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(`Potansiyel Enerji: ${potentialEnergy.toFixed(2)} J`, 550, 20);
    ctx.fillText(`Kinetik Enerji: ${kineticEnergy.toFixed(2)} J`, 550, 40);
  });

  // Simülasyonu başlat
  const runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);
});
</script>

<style scoped>
canvas {
  display: block;
  margin: 0 auto;
}
</style>
