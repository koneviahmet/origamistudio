<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  loadingLabel: {
    type: String,
    default: 'Simülasyon yükleniyor…',
  },
})
</script>

<template>
  <div class="sim-shell">
    <div
      v-if="loading"
      class="sim-shell__loading"
    >
      {{ loadingLabel }}
    </div>

    <div
      v-else
      class="sim-shell__body"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sim-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  background: #050814;
}

.sim-shell__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  z-index: 1;
}

.sim-shell__body {
  position: absolute;
  inset: 0;
}
</style>
