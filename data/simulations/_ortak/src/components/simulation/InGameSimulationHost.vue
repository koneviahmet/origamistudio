<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import InGameSimulationCharacter from './InGameSimulationCharacter.vue'
import SimulationPanelGuide from './SimulationPanelGuide.vue'
import SimulationPanelDialogue from './SimulationPanelDialogue.vue'
import { useSimulationPanelGuide } from '../../composables/useSimulationPanelGuide.js'

const props = defineProps({
  controller: {
    type: Object,
    required: true,
  },
})

const revealing = ref(false)
const simMounted = ref(false)
const contentReady = ref(false)

let revealTimers = []

const prefersReducedMotion =
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function clearRevealTimers() {
  revealTimers.forEach(clearTimeout)
  revealTimers = []
}

function schedule(ms, fn) {
  revealTimers.push(window.setTimeout(fn, ms))
}

/** sm → md → lg → kabuk büyür → simülasyon görünür */
function startRevealSequence() {
  clearRevealTimers()
  revealing.value = true
  simMounted.value = false
  contentReady.value = false

  if (prefersReducedMotion) {
    simMounted.value = true
    contentReady.value = true
    return
  }

  // Kabuk büyümeye başlarken Three.js yüklemesini başlat (paralel)
  schedule(480, () => {
    simMounted.value = true
  })

  // Kabuk animasyonu bittikten sonra içerik fade-in
  schedule(920, () => {
    contentReady.value = true
  })
}

function resetReveal() {
  clearRevealTimers()
  revealing.value = false
  simMounted.value = false
  contentReady.value = false
}

watch(
  () => props.controller.isOpen.value,
  (open) => {
    if (open) startRevealSequence()
    else resetReveal()
  },
  { immediate: true },
)

function onClose() {
  contentReady.value = false
  simMounted.value = false
  props.controller.close(true)
}

function onKeyDown(event) {
  if (!props.controller.isOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    onClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown, true)
  clearRevealTimers()
})

const showScene = () =>
  simMounted.value
  && props.controller.SceneComponent.value
  && props.controller.activeConfig.value
  && !props.controller.isLoading.value
  && !props.controller.loadError.value

const panelGuideConfig = computed(
  () => props.controller.activeInteraction.value?.panelGuide ?? null,
)

const hasPanelDialogue = computed(
  () => Boolean(props.controller.activeInteraction.value?.dialogueId),
)

const showPanelDialogue = computed(
  () =>
    hasPanelDialogue.value
    && props.controller.isOpen.value
    && revealing.value
    && !props.controller.dialogue.isComplete.value,
)

const guide = useSimulationPanelGuide(panelGuideConfig)

const dialogueFocus = computed(
  () => props.controller.dialogue.currentNode.value?.focus ?? null,
)

const simulationTask = computed(() => {
  const node = props.controller.dialogue.currentNode.value
  if (node?.type === 'quiz-simulation') return node
  if (node?.shapes || node?.showControls != null || node?.cutaway != null) {
    return {
      shapes: node.shapes ?? null,
      showControls: node.showControls === true,
      cutaway: node.cutaway === true,
      focus: node.focus ?? null,
    }
  }
  const params = props.controller.activeInteraction.value?.simulationParams
  if (params && typeof params === 'object') return params
  return null
})

const guideFocus = computed(() => {
  if (!props.controller.isOpen.value) return null
  if (hasPanelDialogue.value) return dialogueFocus.value
  if (guide.isActive.value && contentReady.value) return guide.focus.value
  return null
})

function onSimulationEvent(event) {
  props.controller.reportSimulationEvent(event)
}

watch(contentReady, (ready) => {
  if (!ready) return
  if (!hasPanelDialogue.value) guide.start()
})

watch(
  () => props.controller.isOpen.value,
  (open) => {
    if (!open) guide.reset()
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="ingame-sim">
      <div
        v-if="controller.isOpen.value"
        class="ingame-sim"
        :class="{
          'ingame-sim--revealing': revealing,
          'ingame-sim--content-ready': contentReady,
        }"
        role="dialog"
        aria-modal="true"
        :aria-label="controller.title.value"
      >
        <div
          class="ingame-sim__backdrop"
          @click="onClose"
        />

        <div class="ingame-sim__stage">
          <aside
            class="ingame-sim__companion"
            aria-hidden="true"
          >
            <div class="ingame-sim__companion-model">
              <InGameSimulationCharacter
                :interaction="controller.activeInteraction.value"
              />
            </div>
          </aside>

          <div
            v-if="showPanelDialogue"
            class="ingame-sim__companion-dialogue"
          >
            <SimulationPanelDialogue :controller="controller.dialogue" />
            <div
              class="ingame-sim__dialogue-puffs"
              aria-hidden="true"
            >
              <span class="ingame-sim__dlg-puff ingame-sim__dlg-puff--lg" />
              <span class="ingame-sim__dlg-puff ingame-sim__dlg-puff--md" />
              <span class="ingame-sim__dlg-puff ingame-sim__dlg-puff--sm" />
            </div>
          </div>

          <div
            v-if="guide.isActive.value && contentReady && !hasPanelDialogue"
            class="ingame-sim__guide"
          >
            <SimulationPanelGuide
              :step="guide.currentStep.value"
              :step-index="guide.currentIndex.value"
              :total-steps="guide.totalSteps.value"
              :skippable="guide.skippable.value"
              :is-first="guide.isFirst.value"
              :is-last="guide.isLast.value"
              @next="guide.next"
              @prev="guide.prev"
              @skip="guide.skip"
            />
          </div>

          <div class="ingame-sim__thought">
            <div
              class="ingame-sim__puffs"
              aria-hidden="true"
            >
              <span class="ingame-sim__puff ingame-sim__puff--sm" />
              <span class="ingame-sim__puff ingame-sim__puff--md" />
              <span class="ingame-sim__puff ingame-sim__puff--lg" />
            </div>

            <div class="ingame-sim__card">
              <button
                type="button"
                class="ingame-sim__close"
                aria-label="Simülasyonu kapat"
                @click="onClose"
              >
                ×
              </button>

              <div class="ingame-sim__card-clip">
                <section
                  class="ingame-sim__sim"
                  aria-label="Simülasyon"
                >
                  <div class="ingame-sim__sim-viewport">
                    <div
                      v-if="controller.isLoading.value"
                      class="ingame-sim__state"
                    >
                      Simülasyon yükleniyor…
                    </div>

                    <div
                      v-else-if="controller.loadError.value"
                      class="ingame-sim__state ingame-sim__state--error"
                    >
                      {{ controller.loadError.value }}
                    </div>

                    <component
                      :is="controller.SceneComponent.value"
                      v-else-if="showScene()"
                      :config="controller.activeConfig.value"
                      :guide-focus="guideFocus"
                      :simulation-task="simulationTask"
                      embedded
                      @simulation-event="onSimulationEvent"
                    />

                    <div
                      v-else-if="contentReady && simMounted"
                      class="ingame-sim__state"
                    >
                      Hazırlanıyor…
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div
            class="ingame-sim__tail"
            aria-hidden="true"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ingame-sim {
  --sim-pad: 1rem;
  --sim-card-h: min(720px, calc(100dvh - var(--sim-pad) * 2));
  --sim-companion-w: clamp(148px, 16vw, 188px);
  --sim-companion-model-h: clamp(168px, 36vh, 300px);
  --sim-gap: 1.5rem;
  --sim-bottom-pad: 1.25rem;
  --sim-left-zone: calc(var(--sim-companion-w) + var(--sim-gap));
  --sim-right-zone: calc(var(--sim-left-zone) / 2);
  --sim-bubble-bg: rgba(8, 14, 28, 0.97);
  --sim-bubble-border: rgba(56, 189, 248, 0.42);
  --sim-bubble-glow: rgba(56, 189, 248, 0.14);
  --sim-bubble-radius: 2rem 2rem 2.25rem 1.65rem;
  --sim-clip-radius: calc(2rem - 3px) calc(2rem - 3px) calc(2.25rem - 3px) calc(1.65rem - 3px);
  --sim-viewport-bg: #050814;
  --reveal-step: 0.44s;
  --reveal-puff-dur: 0.52s;
  --reveal-shell-dur: 0.92s;

  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  padding:
    max(var(--sim-pad), env(safe-area-inset-top))
    max(var(--sim-pad), env(safe-area-inset-right))
    max(var(--sim-bottom-pad), env(safe-area-inset-bottom))
    max(var(--sim-pad), env(safe-area-inset-left));
  pointer-events: auto;
}

.ingame-sim__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.58);
  backdrop-filter: blur(4px);
}

.ingame-sim__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  width: 100%;
  max-width: calc(100vw - var(--sim-pad) * 2);
  max-height: calc(100dvh - var(--sim-pad) * 2 - var(--sim-bottom-pad));
  overflow: visible;
}

.ingame-sim__companion {
  position: relative;
  flex: 0 0 var(--sim-companion-w);
  width: var(--sim-companion-w);
  height: clamp(220px, 46vh, 400px);
  margin-right: var(--sim-gap);
  margin-bottom: var(--sim-bottom-pad);
  overflow: visible;
  pointer-events: none;
  background: transparent;
}

.ingame-sim:not(:has(.ingame-sim__companion-dialogue)) .ingame-sim__companion-model {
  height: 100%;
}

.ingame-sim__companion-model {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--sim-companion-model-h);
  width: 100%;
}

.ingame-sim__companion-dialogue {
  position: absolute;
  left: 0;
  bottom: calc(var(--sim-bottom-pad) + var(--sim-companion-model-h));
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  width: var(--sim-companion-w);
  max-height: calc(
    100dvh
    - var(--sim-pad)
    - var(--sim-bottom-pad)
    - var(--sim-companion-model-h)
    - 5.5rem
  );
  overflow: visible;
  pointer-events: none;
}

.ingame-sim__companion-dialogue > :first-child {
  pointer-events: auto;
  width: 100%;
}

.ingame-sim__dialogue-puffs {
  position: relative;
  width: 1.35rem;
  height: 1.85rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
  pointer-events: none;
  filter: drop-shadow(0 4px 10px rgba(56, 189, 248, 0.15));
}

.ingame-sim__dlg-puff {
  position: absolute;
  left: 50%;
  border-radius: 50%;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 32% 28%, rgba(125, 211, 252, 0.28), transparent 52%),
    radial-gradient(circle at 50% 50%, rgba(14, 22, 40, 0.98), rgba(8, 14, 28, 0.96));
  border: 1.5px solid rgba(56, 189, 248, 0.38);
  box-shadow:
    0 0 12px rgba(56, 189, 248, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: ingame-dlg-puff-float 2.8s ease-in-out infinite;
}

.ingame-sim__dlg-puff--lg {
  top: 0;
  width: 0.72rem;
  height: 0.72rem;
  animation-delay: 0s;
}

.ingame-sim__dlg-puff--md {
  top: 0.52rem;
  width: 0.48rem;
  height: 0.48rem;
  animation-delay: 0.12s;
}

.ingame-sim__dlg-puff--sm {
  bottom: 0;
  width: 0.3rem;
  height: 0.3rem;
  animation-delay: 0.24s;
  box-shadow:
    0 0 8px rgba(56, 189, 248, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@keyframes ingame-dlg-puff-float {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  50% {
    transform: translateX(-50%) translateY(-1px) scale(1.05);
  }
}

.ingame-sim__guide {
  position: absolute;
  left: 0;
  bottom: calc(var(--sim-bottom-pad) + clamp(220px, 46vh, 400px) + 0.35rem);
  width: var(--sim-companion-w);
  z-index: 4;
  pointer-events: auto;
}

.ingame-sim__thought {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: var(--sim-card-h);
  overflow: visible;
}

.ingame-sim__puffs {
  position: absolute;
  left: -3.1rem;
  bottom: 32%;
  z-index: 3;
  width: 3.5rem;
  height: 3.5rem;
  pointer-events: none;
}

.ingame-sim__puff {
  position: absolute;
  border-radius: 50%;
  background: var(--sim-bubble-bg);
  border: 2px solid var(--sim-bubble-border);
  box-shadow:
    0 0 12px var(--sim-bubble-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  opacity: 0;
  transform: scale(0);
}

.ingame-sim--revealing .ingame-sim__puff {
  will-change: transform, opacity;
}

.ingame-sim__puff--sm {
  right: 2.45rem;
  bottom: -1.35rem;
  width: 0.55rem;
  height: 0.55rem;
  transform-origin: 120% 120%;
}

.ingame-sim__puff--md {
  right: 1.55rem;
  bottom: -0.55rem;
  width: 1rem;
  height: 1rem;
  transform-origin: 110% 100%;
}

.ingame-sim__puff--lg {
  right: 0;
  bottom: 0;
  width: 1.65rem;
  height: 1.65rem;
  transform-origin: 100% 100%;
}

.ingame-sim--revealing .ingame-sim__puff--sm {
  animation: thought-puff-in var(--reveal-puff-dur) cubic-bezier(0.33, 0.86, 0.45, 1) 0.12s both;
}

.ingame-sim--revealing .ingame-sim__puff--md {
  animation: thought-puff-in var(--reveal-puff-dur) cubic-bezier(0.33, 0.86, 0.45, 1) calc(var(--reveal-step) * 1 + 0.12s) both;
}

.ingame-sim--revealing .ingame-sim__puff--lg {
  animation: thought-puff-in var(--reveal-puff-dur) cubic-bezier(0.33, 0.86, 0.45, 1) calc(var(--reveal-step) * 2 + 0.12s) both;
}

.ingame-sim__card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  border: 2px solid var(--sim-bubble-border);
  border-radius: var(--sim-bubble-radius);
  background:
    radial-gradient(ellipse 120% 80% at 10% 0%, rgba(56, 189, 248, 0.07), transparent 55%),
    linear-gradient(160deg, rgba(14, 22, 40, 0.98) 0%, var(--sim-bubble-bg) 45%, rgba(5, 8, 18, 0.99) 100%);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.55),
    0 0 48px var(--sim-bubble-glow),
    0 22px 70px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform-origin: -6% 74%;
  opacity: 0;
  transform: scale(0.1);
}

.ingame-sim--revealing .ingame-sim__card {
  will-change: transform, opacity;
  animation: thought-shell-in var(--reveal-shell-dur) cubic-bezier(0.28, 0.84, 0.38, 1)
    calc(var(--reveal-step) * 3 + 0.08s) both;
}

.ingame-sim__card-clip {
  position: absolute;
  inset: 2px;
  overflow: hidden;
  border-radius: var(--sim-clip-radius);
  background: var(--sim-viewport-bg);
  contain: strict;
}

.ingame-sim__card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.12);
}

.ingame-sim__tail {
  flex: 0 0 var(--sim-right-zone);
  width: var(--sim-right-zone);
  margin-bottom: var(--sim-bottom-pad);
}

.ingame-sim__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 5;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(8px);
  color: var(--text-secondary);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.35s ease;
}

.ingame-sim--content-ready .ingame-sim__close {
  opacity: 1;
}

.ingame-sim__close:hover {
  color: var(--accent-primary);
  border-color: rgba(56, 189, 248, 0.55);
}

.ingame-sim__sim {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.ingame-sim__sim-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  background: var(--sim-viewport-bg);
  isolation: isolate;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.55s cubic-bezier(0.33, 0.86, 0.45, 1);
}

.ingame-sim--content-ready .ingame-sim__sim-viewport {
  opacity: 1;
  visibility: visible;
}

.ingame-sim__state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
}

.ingame-sim__state--error {
  color: var(--accent-danger);
  padding: 1rem;
  text-align: center;
}

/* Backdrop */
.ingame-sim-enter-active,
.ingame-sim-leave-active {
  transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.ingame-sim-enter-from,
.ingame-sim-leave-to {
  opacity: 0;
}

/* Kapanış — içerik → kabuk → puff */
.ingame-sim-leave-active .ingame-sim__sim-viewport {
  opacity: 0 !important;
  visibility: hidden !important;
  transition-duration: 0.2s;
}

.ingame-sim-leave-active .ingame-sim__card {
  animation: thought-shell-out 0.42s cubic-bezier(0.4, 0, 0.65, 1) 0.08s both;
}

.ingame-sim-leave-active .ingame-sim__puff--lg {
  animation: thought-puff-out 0.36s cubic-bezier(0.4, 0, 0.65, 1) 0.22s both;
}

.ingame-sim-leave-active .ingame-sim__puff--md {
  animation: thought-puff-out 0.36s cubic-bezier(0.4, 0, 0.65, 1) 0.34s both;
}

.ingame-sim-leave-active .ingame-sim__puff--sm {
  animation: thought-puff-out 0.32s cubic-bezier(0.4, 0, 0.65, 1) 0.46s both;
}

@keyframes thought-puff-in {
  0% {
    opacity: 0;
    transform: scale(0) translate(5px, 4px);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translate(0, 0);
  }
}

@keyframes thought-puff-out {
  from {
    opacity: 1;
    transform: scale(1) translate(0, 0);
  }
  to {
    opacity: 0;
    transform: scale(0) translate(4px, 3px);
  }
}

@keyframes thought-shell-in {
  0% {
    opacity: 0;
    transform: scale(0.1);
  }
  65% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes thought-shell-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.14);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ingame-sim__dlg-puff {
    animation: none;
  }

  .ingame-sim--revealing .ingame-sim__puff,
  .ingame-sim--revealing .ingame-sim__card,
  .ingame-sim-leave-active .ingame-sim__puff,
  .ingame-sim-leave-active .ingame-sim__card {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .ingame-sim__sim-viewport {
    opacity: 1 !important;
    visibility: visible !important;
    transition: none !important;
  }

  .ingame-sim__close {
    opacity: 1 !important;
  }
}

@media (max-width: 900px) {
  .ingame-sim {
    --sim-card-h: min(680px, calc(100dvh - 1.5rem));
    --sim-companion-w: clamp(128px, 20vw, 160px);
    --sim-gap: 1rem;
  }

  .ingame-sim__puffs {
    left: -2.5rem;
    bottom: 30%;
  }
}

@media (max-width: 640px) {
  .ingame-sim {
    --sim-card-h: calc(100dvh - 1rem);
  }

  .ingame-sim__stage {
    flex-direction: column;
    width: 100%;
  }

  .ingame-sim__thought {
    flex: 1;
    width: 100%;
    height: auto;
    min-height: 0;
  }

  .ingame-sim__card {
    --sim-bubble-radius: 1.25rem;
    --sim-clip-radius: calc(1.25rem - 3px);
  }

  .ingame-sim__puffs {
    display: none;
  }

  .ingame-sim__companion,
  .ingame-sim__tail {
    display: none;
  }

  .ingame-sim__guide {
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.75rem;
    width: auto;
    z-index: 6;
  }

  .ingame-sim__thought {
    position: relative;
  }
}
</style>
