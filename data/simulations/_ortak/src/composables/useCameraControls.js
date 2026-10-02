import { reactive, readonly } from 'vue'

const cameraUiState = reactive({
  distance: 42,
  yaw: Math.PI / 4,
  pitch: 0.95,
  ready: false,
})

let impl = null

export function useCameraControls() {
  function registerCameraControls(handlers) {
    impl = handlers
    cameraUiState.ready = true
  }

  function unregisterCameraControls() {
    impl = null
    cameraUiState.ready = false
  }

  function syncCameraState({ distance, yaw, pitch }) {
    cameraUiState.distance = distance
    cameraUiState.yaw = yaw
    cameraUiState.pitch = pitch
  }

  function pan(dx, dz) {
    impl?.pan(dx, dz)
  }

  function zoom(delta) {
    impl?.zoom(delta)
  }

  function rotateYaw(delta) {
    impl?.rotateYaw(delta)
  }

  function adjustPitch(delta) {
    impl?.adjustPitch(delta)
  }

  function setPitch(value) {
    impl?.setPitch(value)
  }

  function setYaw(value) {
    impl?.setYaw(value)
  }

  function resetCamera() {
    impl?.resetCamera()
  }

  function focusHover() {
    impl?.focusHover()
  }

  return {
    cameraUiState: readonly(cameraUiState),
    registerCameraControls,
    unregisterCameraControls,
    syncCameraState,
    pan,
    zoom,
    rotateYaw,
    adjustPitch,
    setPitch,
    setYaw,
    resetCamera,
    focusHover,
  }
}
