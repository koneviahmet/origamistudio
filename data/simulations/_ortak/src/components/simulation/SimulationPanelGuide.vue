<script setup>
import { ChevronLeft, ChevronRight, Check, SkipForward } from '@lucide/vue'
import DialogueModelGallery from '../dialogue/DialogueModelGallery.vue'

defineProps({
  step: {
    type: Object,
    default: null,
  },
  stepIndex: {
    type: Number,
    default: 0,
  },
  totalSteps: {
    type: Number,
    default: 0,
  },
  skippable: {
    type: Boolean,
    default: true,
  },
  isFirst: {
    type: Boolean,
    default: true,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['next', 'prev', 'skip'])

const iconSize = 15
const iconStroke = 2.25
</script>

<template>
  <div
    class="sim-guide"
    role="region"
    aria-label="Simülasyon klavuzu"
  >
    <div
      class="sim-guide__bubble"
      aria-live="polite"
    >
      <p
        v-if="step?.title"
        class="sim-guide__title"
      >
        {{ step.title }}
      </p>
      <DialogueModelGallery
        v-if="step?.models?.length"
        :models="step.models"
      />
      <div
        v-else-if="step?.images?.length"
        class="sim-guide__images"
        role="list"
      >
        <img
          v-for="(img, idx) in step.images"
          :key="`${img.src}-${idx}`"
          :src="img.src"
          :alt="img.alt || ''"
          class="sim-guide__image"
          role="listitem"
          draggable="false"
        >
      </div>
      <p class="sim-guide__text">
        {{ step?.text }}
      </p>

      <div class="sim-guide__toolbar">
        <button
          v-if="skippable"
          type="button"
          class="sim-guide__btn sim-guide__btn--ghost"
          aria-label="Klavuzu atla"
          @click="emit('skip')"
        >
          <SkipForward
            :size="iconSize"
            :stroke-width="iconStroke"
            aria-hidden="true"
          />
        </button>

        <button
          v-if="!isFirst"
          type="button"
          class="sim-guide__btn sim-guide__btn--ghost"
          aria-label="Önceki adım"
          @click="emit('prev')"
        >
          <ChevronLeft
            :size="iconSize"
            :stroke-width="iconStroke"
            aria-hidden="true"
          />
        </button>

        <div
          class="sim-guide__dots"
          :aria-label="`Adım ${stepIndex + 1} / ${totalSteps}`"
          role="group"
        >
          <span
            v-for="(_, i) in totalSteps"
            :key="i"
            class="sim-guide__dot"
            :class="{ 'sim-guide__dot--active': i === stepIndex }"
            aria-hidden="true"
          />
        </div>

        <button
          type="button"
          class="sim-guide__btn sim-guide__btn--primary"
          :aria-label="isLast ? 'Klavuzu bitir' : 'Sonraki adım'"
          @click="emit('next')"
        >
          <Check
            v-if="isLast"
            :size="iconSize"
            :stroke-width="iconStroke"
            aria-hidden="true"
          />
          <ChevronRight
            v-else
            :size="iconSize"
            :stroke-width="iconStroke"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <span
      class="sim-guide__tail"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.sim-guide {
  position: relative;
  width: 100%;
  max-width: 100%;
  pointer-events: auto;
}

.sim-guide__bubble {
  padding: 0.8rem 0.9rem 0.7rem;
  border-radius: 1.1rem 1.1rem 1.1rem 0.35rem;
  border: 2px solid rgba(56, 189, 248, 0.45);
  background:
    radial-gradient(ellipse 100% 80% at 0% 0%, rgba(56, 189, 248, 0.1), transparent 60%),
    rgba(8, 14, 28, 0.96);
  box-shadow:
    0 0 24px rgba(56, 189, 248, 0.12),
    0 10px 32px rgba(0, 0, 0, 0.4);
}

.sim-guide__title {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.sim-guide__images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
  margin: 0 0 0.55rem;
}

.sim-guide__image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.45rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(2, 6, 23, 0.85);
}

.sim-guide__text {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #e2e8f0;
}

.sim-guide__toolbar {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.65rem;
}

.sim-guide__dots {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  min-width: 0;
  padding: 0 0.15rem;
}

.sim-guide__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.sim-guide__btn--ghost {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.28);
  color: #94a3b8;
}

.sim-guide__btn--ghost:hover {
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.5);
}

.sim-guide__btn--primary {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.55);
  color: #e0f2fe;
}

.sim-guide__btn--primary:hover {
  background: rgba(56, 189, 248, 0.28);
  border-color: rgba(56, 189, 248, 0.75);
}

.sim-guide__dot {
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.35);
  transition: background 0.2s ease, transform 0.2s ease;
}

.sim-guide__dot--active {
  background: #38bdf8;
  transform: scale(1.15);
}

.sim-guide__tail {
  position: absolute;
  right: 1.1rem;
  bottom: -0.55rem;
  width: 1rem;
  height: 1rem;
  background: rgba(8, 14, 28, 0.96);
  border-right: 2px solid rgba(56, 189, 248, 0.45);
  border-bottom: 2px solid rgba(56, 189, 248, 0.45);
  transform: rotate(45deg);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.25);
}

@media (max-width: 640px) {
  .sim-guide__bubble {
    border-radius: 1rem;
  }

  .sim-guide__tail {
    display: none;
  }

  .sim-guide__text {
    font-size: 0.8rem;
  }
}
</style>
