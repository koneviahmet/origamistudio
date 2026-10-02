import { reactive, readonly } from 'vue'

let nextId = 0

const toastState = reactive({
  items: [],
})

export function useToast() {
  function showToast(message, type = 'success', duration = 4500) {
    const id = ++nextId
    toastState.items.push({ id, message, type, duration })
    return id
  }

  function dismissToast(id) {
    const idx = toastState.items.findIndex((t) => t.id === id)
    if (idx >= 0) toastState.items.splice(idx, 1)
  }

  return {
    toastState: readonly(toastState),
    showToast,
    dismissToast,
  }
}
