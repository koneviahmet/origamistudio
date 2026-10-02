<script setup>
import { computed, ref, watch } from 'vue'
import { useCityStore } from '../../stores/cityStore.js'
import { useScoreStore } from '../../stores/scoreStore.js'
import { resolvePanelModel } from '../../lib/simulation/resolvePanelModel.js'
import { useSimulationPanelCharacter } from '../../composables/useSimulationPanelCharacter.js'

const props = defineProps({
  interaction: {
    type: Object,
    default: null,
  },
})

const canvasRef = ref(null)
const { state: cityState } = useCityStore()
const { gainQueue, dismissGain } = useScoreStore()

const playerCharacterId = computed(
  () => cityState.project?.player?.characterId ?? null,
)

const modelSpec = computed(() =>
  resolvePanelModel(props.interaction?.panelModel, playerCharacterId.value),
)

const { loading, error, headAnchorY } = useSimulationPanelCharacter(canvasRef, modelSpec)

const scorePops = ref([])

watch(
  gainQueue,
  (queue) => {
    for (const gain of queue) {
      if (!gain.showCharacterBubble) continue
      if (scorePops.value.some((pop) => pop.id === gain.id)) continue

      scorePops.value.push({
        id: gain.id,
        points: gain.points,
        delay: scorePops.value.length * 0.08,
      })

      setTimeout(() => {
        scorePops.value = scorePops.value.filter((pop) => pop.id !== gain.id)
        dismissGain(gain.id)
      }, 2200)
    }
  },
  { deep: true },
)
</script>

<template>
  <div
    class="sim-panel-char"
    aria-hidden="true"
  >
    <div class="sim-panel-char__stage">
      <canvas
        ref="canvasRef"
        class="sim-panel-char__canvas"
      />

      <p
        v-if="loading"
        class="sim-panel-char__status"
      >
        …
      </p>
      <p
        v-else-if="error"
        class="sim-panel-char__status sim-panel-char__status--error"
      >
        !
      </p>
    </div>

    <div
      class="sim-panel-char__score-layer"
      :style="headAnchorY != null ? { bottom: `calc(${headAnchorY}% + 0.15rem)` } : { bottom: '58%' }"
    >
      <div
        v-for="pop in scorePops"
        :key="pop.id"
        class="sim-panel-char__score-pop"
        :style="{ animationDelay: `${pop.delay}s` }"
      >
        <span class="sim-panel-char__score-glow" aria-hidden="true" />
        <span class="sim-panel-char__score-value">+{{ pop.points }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sim-panel-char {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 0 0 0.5rem;
  pointer-events: none;
}

.sim-panel-char__stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.sim-panel-char__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.sim-panel-char__status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #94a3b8;
  z-index: 2;
}

.sim-panel-char__status--error {
  color: #f87171;
}

.sim-panel-char__score-layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: 4rem;
  height: 3.5rem;
  pointer-events: none;
}

.sim-panel-char__score-pop {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  animation: sim-score-pop 2s cubic-bezier(0.22, 0.84, 0.36, 1) forwards;
}

.sim-panel-char__score-glow {
  position: absolute;
  inset: -0.35rem -0.55rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 70%);
  opacity: 0;
  animation: sim-score-glow 2s ease-out forwards;
}

.sim-panel-char__score-value {
  position: relative;
  display: block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fcd34d;
  text-shadow:
    0 0 10px rgba(251, 191, 36, 0.75),
    0 2px 8px rgba(0, 0, 0, 0.45);
}

@keyframes sim-score-pop {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.45);
  }
  12% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.18);
  }
  28% {
    transform: translateX(-50%) translateY(-6px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-52px) scale(0.88);
  }
}

@keyframes sim-score-glow {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.6);
  }
  18% {
    opacity: 1;
    transform: scale(1.15);
  }
  45% {
    opacity: 0.35;
    transform: scale(1.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sim-panel-char__score-pop {
    animation-duration: 1.2s;
  }

  .sim-panel-char__score-glow {
    animation: none;
    opacity: 0.5;
  }
}
</style>
