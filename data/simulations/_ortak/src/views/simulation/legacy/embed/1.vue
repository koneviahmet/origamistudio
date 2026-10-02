<template>
    <div class="flex items-center justify-center h-screen bg-gray-100">
      <v-stage :config="configKonva">
        <v-layer>
          <!-- Kablo -->
          <v-line
            :config="lineConfig"
          />
  
          <!-- Kırmızı Kutucuk -->
          <v-rect
            :config="redBox"
            draggable
            @dragmove="onDragMove('red', $event)"
            @dragend="checkCollision"
            @click="onBoxClick('red')"
          />
  
          <!-- Mavi Kutucuk -->
          <v-rect
            :config="blueBox"
            draggable
            @dragmove="onDragMove('blue', $event)"
            @dragend="checkCollision"
            @click="onBoxClick('blue')"
          />
        </v-layer>
      </v-stage>
    </div>
  </template>
  
  <script setup>
  import { reactive, computed } from "vue";
  
  // Sahne Ayarları
  const configKonva = reactive({
    width: 800,
    height: 600,
  });
  
  // Kutucuklar
  const redBox = reactive({
    x: 100,
    y: 200,
    width: 100,
    height: 100,
    fill: "red",
    draggable: true,
  });
  
  const blueBox = reactive({
    x: 300,
    y: 200,
    width: 100,
    height: 100,
    fill: "blue",
    draggable: true,
  });
  
  // Kablo Ayarları (İki kutu arasında)
  const lineConfig = computed(() => ({
    points: [
      redBox.x + redBox.width / 2, // Kırmızı kutunun merkezi
      redBox.y + redBox.height / 2,
      blueBox.x + blueBox.width / 2, // Mavi kutunun merkezi
      blueBox.y + blueBox.height / 2,
    ],
    stroke: "black",
    strokeWidth: 4,
  }));
  
  
  // Sürükleme ve Çarpışma Kontrolü
  const onDragMove = (box, event) => {
    const currentBox = box === 'red' ? redBox : blueBox;
    currentBox.x = event.target.x();
    currentBox.y = event.target.y();
  };
  
  const checkCollision = () => {
    const redBoxBounds = {
      x1: redBox.x,
      y1: redBox.y,
      x2: redBox.x + redBox.width,
      y2: redBox.y + redBox.height,
    };
  
    const blueBoxBounds = {
      x1: blueBox.x,
      y1: blueBox.y,
      x2: blueBox.x + blueBox.width,
      y2: blueBox.y + blueBox.height,
    };
  
    // Çarpışma kontrolü
    const isColliding =
      redBoxBounds.x1 < blueBoxBounds.x2 &&
      redBoxBounds.x2 > blueBoxBounds.x1 &&
      redBoxBounds.y1 < blueBoxBounds.y2 &&
      redBoxBounds.y2 > blueBoxBounds.y1;
  
    if (isColliding) {
      redBox.fill = "green";
      blueBox.fill = "green";
    } else {
      redBox.fill = "red";
      blueBox.fill = "blue";
    }
  };
  
  // Kutucuğa Tıklama
  const onBoxClick = (box) => {
    const color = box === 'red' ? redBox.fill : blueBox.fill;
    console.log(`${box} kutucuk rengi: ${color}`);
  };
  </script>
  
  <style>
  @reference "tailwindcss";

  body {
    @apply bg-gray-100;
  }
  </style>
  