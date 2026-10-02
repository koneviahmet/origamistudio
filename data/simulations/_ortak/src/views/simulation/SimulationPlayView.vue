<script setup>
import { ref, computed, watch, shallowRef, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSimulationEntry } from './simulations/registry.js'
import { getSimulation } from '../../data/simulations.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const ActiveSimulation = shallowRef(null)

const slug = computed(() => route.params.slug)
const meta = computed(() => getSimulation(slug.value))
const entry = computed(() => getSimulationEntry(slug.value))

async function loadSimulation() {
  loading.value = true
  error.value = null
  ActiveSimulation.value = null

  if (!entry.value) {
    error.value = 'Simülasyon bulunamadı.'
    loading.value = false
    return
  }

  if (meta.value && !meta.value.available) {
    error.value = 'Bu simülasyon henüz hazır değil.'
    loading.value = false
    return
  }

  try {
    const mod = await entry.value.loadPage()
    ActiveSimulation.value = markRaw(mod.default)
  } catch (err) {
    error.value = err.message ?? 'Simülasyon yüklenemedi.'
  } finally {
    loading.value = false
  }
}

watch(slug, loadSimulation, { immediate: true })
</script>

<template>
  <div class="sim-play">
    <div
      v-if="loading"
      class="sim-play__center"
    >
      Simülasyon yükleniyor…
    </div>

    <div
      v-else-if="error"
      class="sim-play__center sim-play__center--error"
    >
      <p>{{ error }}</p>
      <button
        type="button"
        class="sim-play__btn"
        @click="router.push('/simulation')"
      >
        Listeye dön
      </button>
    </div>

    <component
      :is="ActiveSimulation"
      v-else-if="ActiveSimulation"
    />
  </div>
</template>

<style scoped>
.sim-play {
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
}

.sim-play__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
  color: #94a3b8;
  text-align: center;
  background: #050814;
}

.sim-play__center--error p {
  margin: 0 0 1rem;
  color: #f87171;
}

.sim-play__btn {
  padding: 0.55rem 1rem;
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  cursor: pointer;
}
</style>
