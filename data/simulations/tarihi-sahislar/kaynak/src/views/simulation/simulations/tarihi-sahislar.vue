<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../../../components/shell/Icon.vue'
import { FIGURES, getFigure } from './tarihi-sahislar/config.js'

const props = defineProps({
  config: { type: Object, required: true },
  embedded: { type: Boolean, default: false },
  guideFocus: { type: String, default: null },
  simulationTask: { type: Object, default: null },
})

const emit = defineEmits(['simulation-event'])

const route = useRoute()
const router = useRouter()

const stepIndex = ref(0)
const portraitModalOpen = ref(false)

const whoParam = computed(() => {
  const fromQuery = route.query.who
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery
  if (Array.isArray(fromQuery) && fromQuery[0]) return fromQuery[0]
  const fromTask = props.simulationTask?.who
  if (typeof fromTask === 'string' && fromTask) return fromTask
  return null
})

const selectedFigure = computed(() => getFigure(whoParam.value))

const currentStep = computed(() => {
  const figure = selectedFigure.value
  if (!figure) return null
  return figure.steps[stepIndex.value] ?? null
})

const listPulsing = computed(
  () => props.guideFocus === 'welcome' || props.guideFocus === 'list',
)

const stepsPulsing = computed(
  () =>
    props.guideFocus === 'steps'
    || props.guideFocus === 'next'
    || props.guideFocus === 'welcome',
)

watch(
  whoParam,
  (who) => {
    stepIndex.value = 0
    portraitModalOpen.value = false
    if (who && selectedFigure.value) {
      emit('simulation-event', { type: 'figure-select', who })
    }
  },
  { immediate: true },
)

watch(stepIndex, (index) => {
  const figure = selectedFigure.value
  if (!figure) return
  emit('simulation-event', {
    type: 'step-change',
    who: figure.id,
    step: figure.steps[index]?.id ?? null,
    index,
  })
})

function selectFigure(id) {
  router.replace({
    query: {
      ...route.query,
      who: id,
    },
  })
}

function openPortraitModal() {
  if (!selectedFigure.value) return
  portraitModalOpen.value = true
}

function closePortraitModal() {
  portraitModalOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape' && portraitModalOpen.value) {
    closePortraitModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="ts-board"
    :class="{ 'ts-board--embedded': embedded }"
  >
    <!-- Liste: who yok -->
    <section
      v-if="!selectedFigure"
      class="ts-board__list"
      :class="{ 'ts-board__target--pulse': listPulsing }"
      aria-label="Tarihi şahıs listesi"
    >
      <header class="ts-board__hero">
        <p class="ts-board__eyebrow">
          Bilgi panosu
        </p>
        <h1 class="ts-board__title">
          {{ config.title }}
        </h1>
        <p class="ts-board__lead">
          {{ config.description }}
        </p>
      </header>

      <ul class="ts-board__cards">
        <li
          v-for="figure in FIGURES"
          :key="figure.id"
        >
          <button
            type="button"
            class="ts-board__card"
            :style="{ '--figure-accent': figure.accent }"
            @click="selectFigure(figure.id)"
          >
            <img
              class="ts-board__card-portrait"
              :src="figure.portrait"
              :alt="figure.name"
              width="96"
              height="96"
            >
            <div class="ts-board__card-body">
              <h2 class="ts-board__card-name">
                {{ figure.name }}
              </h2>
              <p class="ts-board__card-meta">
                {{ figure.lifespan }} · {{ figure.role }}
              </p>
              <p class="ts-board__card-summary">
                {{ figure.summary }}
              </p>
            </div>
            <span
              class="ts-board__card-open"
              aria-hidden="true"
            >
              <Icon name="arrowRight" />
            </span>
          </button>
        </li>
      </ul>

      <p class="ts-board__hint">
        İpucu: doğrudan
        <code>?who=galileo</code>
        ile de açabilirsiniz.
      </p>
    </section>

    <!-- Adım adım pano -->
    <section
      v-else
      class="ts-board__story"
      :class="{ 'ts-board__target--pulse': stepsPulsing }"
      :style="{ '--figure-accent': selectedFigure.accent }"
    >
      <header class="ts-board__story-head">
        <div class="ts-board__identity">
          <button
            type="button"
            class="ts-board__portrait-btn"
            :aria-label="`${selectedFigure.name} portresini büyüt`"
            @click="openPortraitModal"
          >
            <img
              class="ts-board__portrait"
              :src="selectedFigure.portrait"
              :alt="selectedFigure.name"
              width="120"
              height="120"
            >
          </button>
          <div>
            <p class="ts-board__eyebrow">
              {{ selectedFigure.role }}
            </p>
            <h1 class="ts-board__name">
              {{ selectedFigure.name }}
            </h1>
            <p class="ts-board__years">
              {{ selectedFigure.lifespan }}
            </p>
          </div>
        </div>

        <ol
          class="ts-board__progress"
          aria-label="Adımlar"
        >
          <li
            v-for="(step, index) in selectedFigure.steps"
            :key="step.id"
            class="ts-board__progress-item"
            :class="{
              'ts-board__progress-item--done': index < stepIndex,
              'ts-board__progress-item--active': index === stepIndex,
            }"
          >
            <button
              type="button"
              class="ts-board__progress-btn"
              :aria-current="index === stepIndex ? 'step' : undefined"
              :aria-label="`${index + 1}. ${step.title}`"
              @click="stepIndex = index"
            >
              {{ index + 1 }}
            </button>
          </li>
        </ol>
      </header>

      <article
        v-if="currentStep"
        class="ts-board__panel"
      >
        <p class="ts-board__step-count">
          Adım {{ stepIndex + 1 }} / {{ selectedFigure.steps.length }}
        </p>
        <h2 class="ts-board__step-title">
          {{ currentStep.title }}
        </h2>
        <p class="ts-board__step-body">
          {{ currentStep.body }}
        </p>
      </article>
    </section>

    <Teleport to="body">
      <div
        v-if="portraitModalOpen && selectedFigure"
        class="ts-portrait-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="selectedFigure.name"
        @click.self="closePortraitModal"
      >
        <button
          type="button"
          class="ts-portrait-modal__close"
          aria-label="Kapat"
          @click="closePortraitModal"
        >
          <Icon
            name="close"
            :size="22"
          />
        </button>
        <img
          class="ts-portrait-modal__image"
          :src="selectedFigure.portrait"
          :alt="selectedFigure.name"
        >
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ts-board {
  --sim-border: rgba(148, 163, 184, 0.22);
  --sim-panel-bg: rgba(15, 23, 42, 0.92);
  --sim-text-primary: #e2e8f0;
  --sim-text-secondary: #94a3b8;
  --sim-text-muted: #64748b;
  --figure-accent: #fbbf24;

  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: clamp(1rem, 3vw, 2rem);
  color: var(--sim-text-primary);
  background:
    radial-gradient(ellipse 80% 50% at 20% 0%, rgba(251, 191, 36, 0.12), transparent 55%),
    radial-gradient(ellipse 60% 40% at 90% 20%, rgba(56, 189, 248, 0.08), transparent 50%),
    linear-gradient(165deg, #070b16 0%, #0b1224 45%, #050814 100%);
}

.ts-board--embedded {
  padding: 0.85rem 1rem 1rem;
  background:
    radial-gradient(ellipse 70% 40% at 15% 0%, rgba(251, 191, 36, 0.1), transparent 50%),
    linear-gradient(165deg, #060a14 0%, #0a1020 100%);
}

.ts-board__list,
.ts-board__story {
  width: min(100%, 52rem);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: min(100%, 36rem);
}

.ts-board__hero {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ts-board__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--figure-accent);
}

.ts-board__title,
.ts-board__name {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f8fafc;
}

.ts-board__lead,
.ts-board__years {
  margin: 0;
  color: var(--sim-text-secondary);
  line-height: 1.5;
  max-width: 40rem;
}

.ts-board__cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ts-board__card {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border: 1px solid var(--sim-border);
  border-radius: 1rem;
  background: var(--sim-panel-bg);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
}

.ts-board__card:hover {
  border-color: color-mix(in srgb, var(--figure-accent) 55%, transparent);
  background: rgba(20, 30, 52, 0.95);
  transform: translateY(-1px);
}

.ts-board__card-portrait,
.ts-board__portrait {
  width: 5.5rem;
  height: 5.5rem;
  object-fit: cover;
  border-radius: 0.85rem;
  border: 2px solid color-mix(in srgb, var(--figure-accent) 40%, transparent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.ts-board__portrait-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: zoom-in;
  border-radius: 0.85rem;
  line-height: 0;
}

.ts-board__portrait-btn:hover .ts-board__portrait,
.ts-board__portrait-btn:focus-visible .ts-board__portrait {
  border-color: var(--figure-accent);
  box-shadow: 0 8px 28px rgba(251, 191, 36, 0.25);
}

.ts-board__portrait {
  width: 6.5rem;
  height: 6.5rem;
  display: block;
}

.ts-board__card-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.ts-board__card-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 650;
  color: #f8fafc;
}

.ts-board__card-meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--figure-accent);
}

.ts-board__card-summary {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  color: var(--sim-text-secondary);
  line-height: 1.45;
}

.ts-board__card-open {
  color: var(--sim-text-muted);
  display: grid;
  place-items: center;
}

.ts-board__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--sim-text-muted);
}

.ts-board__hint code {
  padding: 0.1rem 0.35rem;
  border-radius: 0.35rem;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
}

.ts-board__story-head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ts-board__identity {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.ts-board__progress {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.ts-board__progress-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid var(--sim-border);
  background: rgba(15, 23, 42, 0.75);
  color: var(--sim-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.ts-board__progress-item--done .ts-board__progress-btn {
  border-color: color-mix(in srgb, var(--figure-accent) 50%, transparent);
  color: var(--figure-accent);
}

.ts-board__progress-item--active .ts-board__progress-btn {
  background: var(--figure-accent);
  border-color: var(--figure-accent);
  color: #0f172a;
}

.ts-board__panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--sim-border);
  border-radius: 1.1rem;
  background: var(--sim-panel-bg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

.ts-board__step-count {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sim-text-muted);
}

.ts-board__step-title {
  margin: 0;
  font-size: clamp(1.25rem, 2.5vw, 1.55rem);
  font-weight: 700;
  color: #f8fafc;
}

.ts-board__step-body {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.65;
  color: var(--sim-text-primary);
}

.ts-board__target--pulse {
  animation: ts-pulse 1.4s ease-in-out infinite;
}

@keyframes ts-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--figure-accent) 0%, transparent);
  }
  50% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--figure-accent) 35%, transparent);
  }
}

@media (max-width: 640px) {
  .ts-board__card {
    grid-template-columns: auto 1fr;
  }

  .ts-board__card-open {
    display: none;
  }

  .ts-board__card-portrait {
    width: 4.25rem;
    height: 4.25rem;
  }

  .ts-board__identity {
    flex-direction: column;
    align-items: flex-start;
  }

  .ts-board__portrait {
    width: 5rem;
    height: 5rem;
  }
}
</style>

<style>
.ts-portrait-modal {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(2, 6, 16, 0.88);
  backdrop-filter: blur(6px);
}

.ts-portrait-modal__image {
  max-width: min(92vw, 36rem);
  max-height: min(86vh, 42rem);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 1rem;
  border: 2px solid rgba(251, 191, 36, 0.35);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
}

.ts-portrait-modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
  cursor: pointer;
}

.ts-portrait-modal__close:hover {
  border-color: rgba(251, 191, 36, 0.5);
  color: #fbbf24;
}
</style>
