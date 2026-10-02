<script setup>
// Kütüphanedeki bir parçacık efektini (type=particles) küçük bir sahnede önizler.
import { computed } from 'vue';
import { resources } from '../resources.js';
import RenderBox from './design/RenderBox.vue';

const props = defineProps({
  item: { type: Object, required: true },
  animate: { type: Boolean, default: false },
  deep: { type: Boolean, default: false },
  mode: { type: String, default: 'surekli' },
  dark: { type: Boolean, default: true },
});

// Taslak öğe kütüphanede henüz kayıtlı olmayabilir: geçici kaynak olarak ver
const res = computed(() => {
  const assets = new Map(resources.value.assets);
  assets.set('__onizleme', props.item);
  return { ...resources.value, assets };
});
const scene = computed(() => ({
  width: 400,
  height: 400,
  fps: 30,
  duration: 4,
  background: props.dark
    ? { type: 'linear', colors: ['#2b3a67', '#0b1026'], paper: 0.2, vignette: 0.1 }
    : { type: 'radial', colors: ['#fdf3e4', '#efd2ae'], paper: 0.3, vignette: 0.1 },
  layers: [
    {
      id: 'p',
      type: 'particles',
      particle: '__onizleme',
      mode: props.mode,
      x: 200,
      y: 170,
      size: (props.item.size || 20) * 0.5,
      count: Math.max(6, Math.round((props.item.count || 60) * 0.45)),
      speed: 0.45,
      prewarm: true,
    },
  ],
}));
</script>

<template>
  <RenderBox :deep="deep" :scene="scene" :res="res" :animate="animate" :loop="4" :t="2.2" />
</template>
