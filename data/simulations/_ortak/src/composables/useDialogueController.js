import { ref, computed, shallowRef } from 'vue'
import { createDialogueEngine } from '../lib/dialogue/createDialogueEngine.js'
import { getDialogueTree } from '../lib/dialogue/dialogueRegistry.js'
import { resolveDialogueNodeMedia } from '../lib/dialogue/resolveDialogueNodeMedia.js'
import { resolveCompletedChoiceIds } from '../lib/quest/resolveCompletedChoiceIds.js'
import { simulationPhotoAlbum } from '../lib/play/simulationPhotoAlbum.js'

/**
 * Oyun içi diyalog katmanı durumu.
 * usePlayEngine tarafından oluşturulur; PlayScene + DialogueHost paylaşır.
 */
export function createDialogueController({
  getScoreStore,
  getQuestStore,
  gameSlug = null,
  showScoreBubble = false,
  onDialogueComplete,
  onQuizCorrect,
} = {}) {
  const isOpen = ref(false)
  const activeInteraction = shallowRef(null)
  const activePlacement = shallowRef(null)
  const engine = shallowRef(null)
  const quizFeedback = ref(null)
  const quizAwaitingContinue = ref(false)
  /** Motor iç durumu değişince şablonu yenilemek için */
  const dialogueTick = ref(0)

  function bumpDialogue() {
    dialogueTick.value += 1
  }

  let dismissedPlacementId = null

  const title = computed(() => {
    const interaction = activeInteraction.value
    const tree = engine.value?.tree
    if (interaction?.panelTitle) return interaction.panelTitle
    if (tree?.title) return tree.title
    return 'Konuşma'
  })

  const speaker = computed(() => {
    dialogueTick.value
    const node = engine.value?.getCurrentNode()
    return node?.speaker ?? engine.value?.tree?.speaker ?? title.value
  })

  const currentNode = computed(() => {
    dialogueTick.value
    // imageFrom çözümlemesi albüm listelerine bağımlı olsun
    for (const list of Object.values(simulationPhotoAlbum.bySimulation)) {
      void list.length
    }
    return resolveDialogueNodeMedia(engine.value?.getCurrentNode() ?? null)
  })

  const isComplete = computed(() => {
    dialogueTick.value
    return engine.value?.isComplete ?? false
  })

  const disabledChoiceIds = computed(() => {
    dialogueTick.value
    return resolveCompletedChoiceIds(
      engine.value?.getCurrentNode(),
      gameSlug,
      getQuestStore?.(),
    )
  })

  function isChoiceDisabled(optionId) {
    return disabledChoiceIds.value.includes(optionId)
  }

  function clearQuizState() {
    quizFeedback.value = null
    quizAwaitingContinue.value = false
  }

  function open({ interaction, placement }) {
    if (!interaction?.dialogueId) return
    if (placement?.id && dismissedPlacementId === placement.id) return

    const tree = getDialogueTree(interaction.dialogueId)
    if (!tree) {
      console.warn(`Diyalog bulunamadı: ${interaction.dialogueId}`)
      return
    }

    if (isOpen.value && activePlacement.value?.id === placement?.id) return

    const nextEngine = createDialogueEngine(tree)
    nextEngine.start()

    engine.value = nextEngine
    activeInteraction.value = interaction
    activePlacement.value = placement ?? null
    isOpen.value = true
    clearQuizState()
    bumpDialogue()
  }

  function close(userInitiated = false) {
    if (userInitiated && activePlacement.value?.id) {
      dismissedPlacementId = activePlacement.value.id
    }

    isOpen.value = false
    engine.value?.reset()
    engine.value = null
    activeInteraction.value = null
    activePlacement.value = null
    clearQuizState()
  }

  function closeFromProximity(placement) {
    if (!isOpen.value) return
    if (placement?.id && activePlacement.value?.id !== placement.id) return
    close(false)
  }

  function clearDismissForPlacement(placementId) {
    if (dismissedPlacementId === placementId) {
      dismissedPlacementId = null
    }
  }

  function notifyDialogueComplete() {
    if (!engine.value?.isComplete) return
    const interaction = activeInteraction.value
    const placement = activePlacement.value
    if (!interaction?.id) return
    onDialogueComplete?.({
      interactionId: interaction.id,
      interaction,
      placement,
    })
  }

  function advance() {
    clearQuizState()
    engine.value?.advance()
    bumpDialogue()
    notifyDialogueComplete()
  }

  function choose(optionId) {
    if (isChoiceDisabled(optionId)) return
    clearQuizState()
    engine.value?.choose(optionId)
    bumpDialogue()
    notifyDialogueComplete()
  }

  function submitAnswer(answer) {
    const node = engine.value?.getCurrentNode()
    const result = engine.value?.submitAnswer(answer)
    if (!result) return null

    if (result.correct) {
      quizFeedback.value = null
      quizAwaitingContinue.value = false
      bumpDialogue()

      const points = result.points ?? node?.points ?? 0
      if (points > 0) {
        const placementId = activePlacement.value?.id ?? ''
        const dedupeKey = node?.scoreOncePerPlacement && placementId
          ? `dialogue-quiz:${activeInteraction.value?.id ?? 'quiz'}:${node.id ?? 'node'}:${placementId}`
          : null

        getScoreStore?.()?.award({
          points,
          ruleId: `dialogue:${activeInteraction.value?.id ?? 'quiz'}`,
          label: node?.scoreLabel ?? `${speaker.value} — +${points} puan`,
          oncePerSession: Boolean(dedupeKey),
          dedupeKey,
          showCharacterBubble: showScoreBubble,
        })
      }

      onQuizCorrect?.({
        interaction: activeInteraction.value,
        placement: activePlacement.value,
        node,
        result,
      })
    } else {
      quizFeedback.value = result.feedback ?? null
      quizAwaitingContinue.value = Boolean(engine.value?.canContinueAfterQuiz())
      bumpDialogue()
    }

    return result
  }

  function continueAfterQuiz() {
    clearQuizState()
    engine.value?.continueAfterQuiz()
    bumpDialogue()
    notifyDialogueComplete()
  }

  /** Yanlış cevap sonrası seçenekleri tekrar aç (doğru cevaplanana kadar) */
  function retryQuiz() {
    if (quizAwaitingContinue.value) return
    clearQuizState()
    bumpDialogue()
  }

  function reportSimulationEvent(event) {
    const node = engine.value?.getCurrentNode()
    if (!node || node.type !== 'quiz-simulation') return null
    return submitAnswer(event)
  }

  function finishDialogue() {
    notifyDialogueComplete()
    close(false)
  }

  return {
    isOpen,
    activeInteraction,
    activePlacement,
    engine,
    title,
    speaker,
    currentNode,
    isComplete,
    disabledChoiceIds,
    quizFeedback,
    quizAwaitingContinue,
    open,
    close,
    finishDialogue,
    advance,
    choose,
    submitAnswer,
    continueAfterQuiz,
    retryQuiz,
    reportSimulationEvent,
    closeFromProximity,
    clearDismissForPlacement,
  }
}
