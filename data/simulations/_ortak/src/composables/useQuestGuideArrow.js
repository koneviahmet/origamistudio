import { ref, onMounted, onUnmounted } from 'vue'
import { useQuestStore } from '../stores/questStore.js'
import { getCameraViewDirection } from '../lib/three/exploreMovement.js'
import {
  resolveQuestGuideTarget,
  QUEST_GUIDE_SKIP_TRIGGERS,
} from '../lib/quest/resolveQuestGuideTarget.js'

const ARRIVAL_DISTANCE = 2.8

export function useQuestGuideArrow({
  gameSlug,
  interactions = [],
  getPlayerPosition,
  getCameraYaw,
  getCameraMode,
  getProject,
  isBlocked = () => false,
}) {
  const questStore = useQuestStore()

  const visible = ref(false)
  const angle = ref(0)
  const distance = ref(0)
  const hint = ref(null)

  function tick() {
    if (!gameSlug || isBlocked()) {
      visible.value = false
      return
    }

    const next = questStore.getFirstIncompleteSubtask(gameSlug)
    if (!next?.subtask?.trigger) {
      visible.value = false
      return
    }

    const { subtask } = next
    const trigger = subtask.trigger
    if (!trigger?.type || QUEST_GUIDE_SKIP_TRIGGERS.has(trigger.type) || !trigger.interactionId) {
      visible.value = false
      return
    }

    const project = getProject?.()
    const player = getPlayerPosition?.()
    if (!project || !player) {
      visible.value = false
      return
    }

    const target = resolveQuestGuideTarget(
      project,
      interactions,
      trigger.interactionId,
      player,
    )
    if (!target) {
      visible.value = false
      return
    }

    const dx = target.x - player.x
    const dz = target.z - player.z
    const dist = Math.hypot(dx, dz)

    if (dist < ARRIVAL_DISTANCE) {
      visible.value = false
      return
    }

    const cameraMode = getCameraMode?.() ?? 'third'
    const cameraYaw = getCameraYaw?.() ?? 0
    const view = getCameraViewDirection(cameraMode, cameraYaw)
    const worldAngle = Math.atan2(dx, dz)
    const viewAngle = Math.atan2(view.x, view.z)

    let relative = worldAngle - viewAngle
    while (relative > Math.PI) relative -= 2 * Math.PI
    while (relative < -Math.PI) relative += 2 * Math.PI

    angle.value = relative
    distance.value = dist
    hint.value = subtask.hint ?? subtask.title
    visible.value = true
  }

  let raf = 0

  function loop() {
    tick()
    raf = requestAnimationFrame(loop)
  }

  onMounted(() => {
    raf = requestAnimationFrame(loop)
  })

  onUnmounted(() => {
    cancelAnimationFrame(raf)
  })

  return {
    visible,
    angle,
    distance,
    hint,
  }
}
