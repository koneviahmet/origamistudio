<script setup>
import DialogueNodeView from '../dialogue/DialogueNodeView.vue'

const props = defineProps({
  controller: {
    type: Object,
    required: true,
  },
})

function onContinueQuiz() {
  if (props.controller.quizAwaitingContinue.value) {
    props.controller.continueAfterQuiz()
  } else {
    props.controller.advance()
  }
}
</script>

<template>
  <div
    class="sim-dialogue"
    role="region"
    aria-label="Simülasyon diyalogu"
  >
    <div
      class="sim-dialogue__bubble"
      aria-live="polite"
    >
      <DialogueNodeView
        variant="panel"
        :node="controller.currentNode.value"
        :speaker="controller.speaker.value"
        :quiz-feedback="controller.quizFeedback.value"
        :quiz-awaiting-continue="controller.quizAwaitingContinue.value"
        :is-complete="controller.isComplete.value"
        :disabled-choice-ids="controller.disabledChoiceIds?.value ?? []"
        @advance="controller.advance()"
        @choose="controller.choose($event)"
        @submit="controller.submitAnswer($event)"
        @continue-quiz="onContinueQuiz()"
        @retry-quiz="controller.retryQuiz?.()"
        @close="controller.finishDialogue?.()"
      />
    </div>
  </div>
</template>

<style scoped>
.sim-dialogue {
  width: 100%;
  flex: 0 1 auto;
  min-height: 0;
}

.sim-dialogue__bubble {
  width: 100%;
  max-height: min(52vh, 400px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.55rem 0.62rem 0.5rem;
  border-radius: 0.85rem;
  border: 1.5px solid rgba(56, 189, 248, 0.32);
  background:
    radial-gradient(ellipse 120% 90% at 8% 0%, rgba(56, 189, 248, 0.14), transparent 58%),
    linear-gradient(165deg, rgba(12, 20, 36, 0.97), rgba(8, 14, 28, 0.94));
  box-shadow:
    0 0 20px rgba(56, 189, 248, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
  scrollbar-width: thin;
  scrollbar-color: rgba(56, 189, 248, 0.35) transparent;
}

.sim-dialogue__bubble::-webkit-scrollbar {
  width: 4px;
}

.sim-dialogue__bubble::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.35);
}
</style>
