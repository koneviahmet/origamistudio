<script setup>
import { computed, defineAsyncComponent, watch, shallowRef, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { getLegacyLoader } from './slug-map.js'

defineProps({
  config: { type: Object, default: null },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
})

const route = useRoute()
const slug = computed(() => route.params.slug)
const Scene = shallowRef(null)

watch(
  slug,
  (nextSlug) => {
    Scene.value = null
    const loader = getLegacyLoader(nextSlug)
    if (!loader) return
    Scene.value = markRaw(defineAsyncComponent(loader))
  },
  { immediate: true },
)
</script>

<template>
  <component
    :is="Scene"
    v-if="Scene"
    class="legacy-scene"
  />
</template>

<style scoped>
.legacy-scene {
  width: 100%;
  height: 100%;
}
</style>
