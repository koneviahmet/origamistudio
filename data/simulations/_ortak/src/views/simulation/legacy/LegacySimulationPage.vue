<script setup>
import { computed, defineAsyncComponent, watch, ref, shallowRef, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import SimulationShell from '../SimulationShell.vue'
import { getLegacyLoader } from './slug-map.js'
import { getLegacyMeta } from './metadata.js'

const route = useRoute()
const slug = computed(() => route.params.slug)
const meta = computed(() => getLegacyMeta(slug.value))
const loadError = ref(null)
const Scene = shallowRef(null)

watch(
  slug,
  (nextSlug) => {
    loadError.value = null
    Scene.value = null
    const loader = getLegacyLoader(nextSlug)
    if (!loader) {
      loadError.value = 'Simülasyon bileşeni bulunamadı.'
      return
    }
    Scene.value = markRaw(defineAsyncComponent({
      loader,
      onError: (_err, _retry, fail) => {
        loadError.value = 'Simülasyon yüklenemedi.'
        fail()
      },
    }))
  },
  { immediate: true },
)
</script>

<template>
  <SimulationShell>
    <div
      v-if="loadError"
      class="legacy-sim__error"
    >
      <p>{{ loadError }}</p>
      <p
        v-if="meta"
        class="legacy-sim__meta"
      >
        {{ meta.title }}
      </p>
    </div>
    <component
      :is="Scene"
      v-else-if="Scene"
      class="legacy-sim__scene"
    />
  </SimulationShell>
</template>

<style scoped>
.legacy-sim__scene {
  width: 100%;
  height: 100%;
}

.legacy-sim__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f87171;
  text-align: center;
  padding: 2rem;
}

.legacy-sim__meta {
  margin: 0.5rem 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}
</style>
