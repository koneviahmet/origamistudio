<template>
  <div>
    <canvas ref="physicsCanvas" width="800" height="600" style="border: 1px solid black;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Engine, Render, Runner, World, Bodies } from "matter-js";

const physicsCanvas = ref(null); // Canvas referansı

onMounted(() => {
  // Matter.js motorunu oluştur
  const engine = Engine.create();

  // Canvas elemanını bağlamak için render oluştur
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

  // Zemin ve bir top ekleyelim
  const ground = Bodies.rectangle(400, 590, 810, 30, { isStatic: true });
  const ball = Bodies.circle(400, 100, 30, {
    restitution: 0.8, // Sekme efekti
  });

  // Nesneleri dünyaya ekle
  World.add(engine.world, [ground, ball]);

  // Yeni Runner kullanımı
  const runner = Runner.create();
  Runner.run(runner, engine); // Motoru çalıştır

  Render.run(render); // Render işlemini başlat
});
</script>

<style scoped>
canvas {
  display: block;
  margin: 0 auto;
}
</style>
