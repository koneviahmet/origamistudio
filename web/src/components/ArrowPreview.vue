<script setup>
// Kütüphanedeki bir ok stilini (type=arrow) küçük bir sahnede önizler: iki nokta arasında çizilir.
import { computed } from 'vue';
import { resources } from '../resources.js';
import RenderBox from './design/RenderBox.vue';

const props = defineProps({
  item: { type: Object, required: true },
  animate: { type: Boolean, default: false },
  deep: { type: Boolean, default: false },
  label: { type: String, default: '' },
});

// Taslak öğe kütüphanede henüz kayıtlı olmayabilir: geçici kaynak olarak ver
const res = computed(() => {
  const assets = new Map(resources.value.assets);
  assets.set('__ok', props.item);
  return { ...resources.value, assets };
});
const scene = computed(() => {
  const dirsek = props.item.curve === 'dirsek';
  // Önizlemede kalınlıklar kutuya göre biraz büyütülür
  return {
    width: 400,
    height: 400,
    fps: 30,
    duration: 3.5,
    background: { type: 'radial', colors: ['#fdf6ea', '#efdcc0'], paper: 0.3, vignette: 0.08 },
    layers: [
      {
        id: 'ok',
        type: 'arrow',
        arrow: '__ok',
        from: dirsek ? [70, 110] : [60, 300],
        to: dirsek ? [330, 300] : [340, 110],
        fold: [{ t: 0.15, v: 0 }, { t: 1.6, v: 1, ease: 'inOutSine' }],
        label: props.label || undefined,
      },
    ],
  };
});
</script>

<template>
  <RenderBox :deep="deep" :scene="scene" :res="res" :animate="animate" :loop="3.5" :t="3" />
</template>
