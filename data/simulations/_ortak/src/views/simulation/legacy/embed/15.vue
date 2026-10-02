<template>
  <div class="flex flex-col items-center">
    <!-- Başlık -->
    <div class="bg-gray-800 text-white w-full text-center py-2">
      <h1 class="text-lg font-bold">Küp Basınç Simülasyonu</h1>
    </div>

    <!-- Tablo -->
    <div class="w-full bg-white shadow-lg rounded-lg mb-2 p-4">
      <table class="table-auto w-full text-center">
        <thead>
          <tr>
            <th class="border px-4 py-2">Küp</th>
            <th class="border px-4 py-2">Toplam Kütle (kg)</th>
            <th class="border px-4 py-2">Yüzey Alanı (m²)</th>
            <th class="border px-4 py-2">Basınç (Pa)</th>
          </tr>
        </thead>
        <tbody id="pressureTable"></tbody>
      </table>
    </div>

    <!-- Canvas -->
    <canvas ref="physicsCanvas" width="800" height="600" style="border: 1px solid black;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Events } from "matter-js";

const physicsCanvas = ref(null);

onMounted(() => {
  // Matter.js motorunu oluştur
  const engine = Engine.create();
  const world = engine.world;
  const gravity = 10; // Yerçekimi ivmesi m/s²

  // Render oluştur
  const render = Render.create({
    element: physicsCanvas.value.parentElement,
    canvas: physicsCanvas.value,
    engine: engine,
    options: {
      width: 800,
      height: 600,
      wireframes: false,
      background: "rgb(240, 240, 240)",
    },
  });

  // Zemin ve duvarlar
  const ground = Bodies.rectangle(400, 590, 800, 20, {
    isStatic: true,
    render: { fillStyle: "brown" },
  });
  const leftWall = Bodies.rectangle(0, 300, 20, 600, {
    isStatic: true,
    render: { fillStyle: "gray" },
  });
  const rightWall = Bodies.rectangle(800, 300, 20, 600, {
    isStatic: true,
    render: { fillStyle: "gray" },
  });
  const ceiling = Bodies.rectangle(400, 0, 800, 20, {
    isStatic: true,
    render: { fillStyle: "gray" },
  });
  World.add(world, [ground, leftWall, rightWall, ceiling]);

  // Raf oluştur
  const shelf = Bodies.rectangle(400, 150, 600, 20, {
    isStatic: true,
    render: { fillStyle: "green" },
  });
  World.add(world, shelf);

  // 10 küp oluştur
  const cubes = [];
  for (let i = 0; i < 10; i++) {
    const size = 40 + Math.random() * 20; // Rastgele boyut (40-60 px)
    const mass = (size / 100) ** 3 * 500; // Kütle hesaplama (m³ x yoğunluk)

    const cube = Bodies.rectangle(200 + i * 50, 100, size, size, {
      restitution: 0.5,
      density: 0.01,
      friction: 0.5,
      render: {
        fillStyle: "#" + Math.floor(Math.random() * 16777215).toString(16), // Rastgele renk
      },
      label: `Küp ${i + 1}`,
    });
    cube.customData = { size: size / 100, mass: mass }; // Boyut ve kütle (m cinsinden)
    cubes.push(cube);
  }
  World.add(world, cubes);

  // Mouse sürükleme
  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false },
    },
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  // Tabloya basınç değerlerini ekle
  Events.on(engine, "collisionStart", (event) => {
    const pressureTable = document.getElementById("pressureTable");
    pressureTable.innerHTML = ""; // Tabloyu temizle

    cubes.forEach((cube) => {
      let totalMass = cube.customData.mass; // Başlangıç kütlesi
      let yPos = cube.position.y;
      let baseCube = cube; // Yüzey alanı için en alttaki küpü takip et

      // Üst üste binen küplerin toplam kütlesini hesapla ve en alttaki küpü bul
      cubes.forEach((otherCube) => {
        if (
          otherCube !== cube &&
          Math.abs(otherCube.position.x - cube.position.x) < cube.customData.size * 50 &&
          otherCube.position.y > cube.position.y
        ) {
          totalMass += otherCube.customData.mass;
          if (otherCube.position.y > baseCube.position.y) {
            baseCube = otherCube; // En alttaki küpü güncelle
          }
        }
      });

      if (yPos >= 550) {
        const area = (baseCube.customData.size ** 2).toFixed(2); // En alttaki küpün yüzey alanı (m²)
        const pressure = ((totalMass * gravity) / area).toFixed(2); // Basınç (P = F/A)

        // Tabloya ekle
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="border px-4 py-2">${cube.label}</td>
          <td class="border px-4 py-2">${totalMass.toFixed(2)}</td>
          <td class="border px-4 py-2">${area}</td>
          <td class="border px-4 py-2">${pressure}</td>
        `;
        pressureTable.appendChild(row);
      }
    });
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
