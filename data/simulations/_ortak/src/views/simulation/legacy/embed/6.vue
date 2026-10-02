<template>
  <div>
    <canvas ref="physicsCanvas" width="800" height="600" style="border: 1px solid black;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint } from "matter-js";

const physicsCanvas = ref(null);

onMounted(() => {
  // Matter.js motorunu oluştur
  const engine = Engine.create();
  const world = engine.world;

  // Render oluştur
  const render = Render.create({
    element: physicsCanvas.value.parentElement,
    canvas: physicsCanvas.value,
    engine: engine,
    options: {
      width: 800,
      height: 600,
      wireframes: false, // Daha iyi görsel kalite için
    },
  });

  // Zemin oluştur
  const ground = Bodies.rectangle(400, 590, 810, 30, { 
    isStatic: true,
    render: { fillStyle: "brown" },
  });
  World.add(world, ground);

  // Top oluştur
  const ball = Bodies.circle(400, 100, 30, {
    restitution: 0.8, // Sekme etkisi
    density: 0.01, // Top yoğunluğu
    frictionAir: 0.01, // Havadaki sürtünme
    render: { fillStyle: "blue" }, // Top rengi
  });
  World.add(world, ball);

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

  // Render için mouse ekle
  render.mouse = mouse;

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
