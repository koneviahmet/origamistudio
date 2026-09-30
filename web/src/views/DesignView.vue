<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ThemesPanel from '../components/design/ThemesPanel.vue';
import TextStylesPanel from '../components/design/TextStylesPanel.vue';
import FontsPanel from '../components/design/FontsPanel.vue';
import PresetsPanel from '../components/design/PresetsPanel.vue';

const route = useRoute();
const router = useRouter();
const TABS = [
  ['temalar', 'Temalar'],
  ['metin', 'Metin stilleri'],
  ['fontlar', 'Fontlar'],
  ['animasyonlar', 'Animasyonlar'],
];
const tab = computed(() => route.params.tab || 'temalar');
</script>

<template>
  <div class="design">
    <div class="tabs">
      <button v-for="[k, l] in TABS" :key="k" :class="{ active: tab === k }" @click="router.replace(`/design/${k}`)">{{ l }}</button>
    </div>
    <div class="panel">
      <ThemesPanel v-if="tab === 'temalar'" />
      <TextStylesPanel v-else-if="tab === 'metin'" />
      <FontsPanel v-else-if="tab === 'fontlar'" />
      <PresetsPanel v-else />
    </div>
  </div>
</template>

<style scoped>
.design { display: flex; flex-direction: column; height: 100%; }
.panel { flex: 1; min-height: 0; }
</style>
