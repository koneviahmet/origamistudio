import { ref, computed } from 'vue'
import * as THREE from 'three'
import { buildCollisionGrid, warmCollisionFootprints } from '../lib/three/collision.js'
import {
  createCharacterController,
  resolveSpawnPosition,
} from '../lib/three/characterController.js'
import { sortAnimationNames } from '../lib/play/animationLabels.js'
import { buildTerrainMap, sampleTerrainHeight } from '../lib/city/terrainUtils.js'
import {
  sampleWalkSurfaceHeight,
  measureRoadSurfaceOffset,
  FALLBACK_ROAD_SURFACE_OFFSET,
} from '../lib/city/surfaceHeight.js'
import {
  getExploreCameraMode,
  getNextExploreCameraMode,
  loadStoredExploreCameraMode,
  storeExploreCameraMode,
} from '../data/exploreCameraModes.js'
import {
  getExploreMovementAxes,
  getThirdPersonFollowRates,
  resolveThirdPersonBehindYaw,
  resolveThirdPersonFollowYawFromMovement,
  shouldFollowThirdPersonCamera,
  shortestAngleDelta,
  smoothDampAngle,
  smoothDampAngleLimited,
  smoothDampScalar,
  worldDeltaToMovement,
} from '../lib/three/exploreMovement.js'
import { resolveCharacterScale } from '../lib/characterScale.js'

const FORWARD_DOUBLE_TAP_MS = 320
const CAMERA_BEHIND_SNAP_SMOOTH = 9
const WALK_ARRIVE_DIST = 0.5
const WALK_RUN_DIST = 7

export function createInputState() {
  const keys = {}
  const MOVEMENT_CODES = new Set([
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ])
  const FORWARD_CODES = new Set(['KeyW', 'ArrowUp'])
  let lastForwardDownAt = 0
  let forwardDoubleTap = false

  function onKeyDown(e) {
    if (MOVEMENT_CODES.has(e.code)) {
      e.preventDefault()
    }
    if (FORWARD_CODES.has(e.code) && !e.repeat) {
      const now = performance.now()
      if (now - lastForwardDownAt <= FORWARD_DOUBLE_TAP_MS) {
        forwardDoubleTap = true
      }
      lastForwardDownAt = now
    }
    keys[e.code] = true
  }

  function onKeyUp(e) {
    if (MOVEMENT_CODES.has(e.code)) {
      e.preventDefault()
    }
    keys[e.code] = false
  }

  function getMovement() {
    let mx = 0
    let mz = 0
    if (keys.KeyW || keys.ArrowUp) mz -= 1
    if (keys.KeyS || keys.ArrowDown) mz += 1
    if (keys.KeyA || keys.ArrowLeft) mx -= 1
    if (keys.KeyD || keys.ArrowRight) mx += 1
    return {
      mx,
      mz,
      moving: mx !== 0 || mz !== 0,
      running: (keys.ShiftLeft || keys.ShiftRight) && (mx !== 0 || mz !== 0),
    }
  }

  function consumeForwardDoubleTap() {
    if (!forwardDoubleTap) return false
    forwardDoubleTap = false
    return true
  }

  function bind() {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }

  function unbind() {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    lastForwardDownAt = 0
    forwardDoubleTap = false
  }

  return { bind, unbind, getMovement, consumeForwardDoubleTap, keys }
}

const FPS_TURN_SPEED = 2.4
const FPS_LOOK_SMOOTH = 11
/** Taş / küçük yüzey tümseklerinde kamera zıplamasını yumuşatır */
const FPS_HEIGHT_SMOOTH = 5.5
const FPS_HEIGHT_DEADZONE = 0.07

export function useExploreMode() {
  const exploreLoading = ref(false)
  const exploreError = ref(null)
  const cameraMode = ref(loadStoredExploreCameraMode())

  const cameraModeLabel = computed(
    () => getExploreCameraMode(cameraMode.value).shortLabel,
  )

  const characterAnimations = ref([])
  const activeCharacterAnimation = ref(null)
  const characterAnimationPaused = ref(false)

  function syncCharacterAnimationState() {
    characterAnimations.value = sortAnimationNames(controller?.getAnimationNames?.() ?? [])
    activeCharacterAnimation.value = controller?.getActiveAnimationName?.() ?? null
    characterAnimationPaused.value = controller?.isAnimationPaused?.() ?? false
  }

  let controller = null
  let collisionGrid = null
  let input = null
  let walkTarget = null
  let exploreCamYaw = Math.PI / 4
  let exploreCamPitch = 0
  let fpsTargetYaw = Math.PI / 4
  let fpsTargetPitch = 0
  let fpsSmoothEyeY = null
  let thirdPersonDistance = 6.5
  let cameraBehindTargetYaw = null
  let engineRef = null
  let currentProject = null

  function clearCameraBehindSnap() {
    cameraBehindTargetYaw = null
  }

  function clearWalkTarget() {
    walkTarget = null
  }

  function setWalkTarget(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false
    walkTarget = { x, z }
    return true
  }

  function resolveWalkMovement(pos, axes) {
    if (!walkTarget || !pos) return null
    const dx = walkTarget.x - pos.x
    const dz = walkTarget.z - pos.z
    const dist = Math.hypot(dx, dz)
    if (dist <= WALK_ARRIVE_DIST) {
      clearWalkTarget()
      return null
    }
    const { mx, mz } = worldDeltaToMovement(dx, dz, axes)
    if (mx === 0 && mz === 0) {
      clearWalkTarget()
      return null
    }
    return {
      mx,
      mz,
      moving: true,
      running: dist >= WALK_RUN_DIST,
    }
  }

  function beginCameraBehindSnap() {
    if (!controller || cameraMode.value === 'first') return
    const facing = controller.getFacingYaw?.() ?? exploreCamYaw
    cameraBehindTargetYaw = resolveThirdPersonBehindYaw(cameraMode.value, facing)
  }

  function getTerrainMap() {
    return buildTerrainMap(currentProject?.layers?.terrain ?? [])
  }

  function getTerrainHeightAt(x, z) {
    if (!currentProject) return 0
    return sampleTerrainHeight(x, z, currentProject.settings, getTerrainMap())
  }

  function snapToTerrain(pos) {
    if (!currentProject || !controller) return pos
    const terrainMap = getTerrainMap()
    const roadSet = collisionGrid?.roadSet
    const roadOffset = collisionGrid?.roadSurfaceOffset ?? FALLBACK_ROAD_SURFACE_OFFSET
    const y = sampleWalkSurfaceHeight(
      pos.x,
      pos.z,
      currentProject.settings,
      terrainMap,
      roadSet,
      roadOffset,
    )
    controller.setPosition(pos.x, y, pos.z)
    return { x: pos.x, y, z: pos.z }
  }

  function getFpsEyeHeight() {
    return controller?.getEyeHeight?.() ?? getExploreCameraMode('first').eyeHeight
  }

  function resetFpsEyeHeight(groundY) {
    fpsSmoothEyeY = groundY + getFpsEyeHeight()
  }

  function updateFpsEyeHeight(groundY, dt) {
    const targetEyeY = groundY + getFpsEyeHeight()
    if (fpsSmoothEyeY == null) {
      fpsSmoothEyeY = targetEyeY
      return
    }
    const delta = targetEyeY - fpsSmoothEyeY
    if (Math.abs(delta) < FPS_HEIGHT_DEADZONE) return
    fpsSmoothEyeY = smoothDampScalar(fpsSmoothEyeY, targetEyeY, dt, FPS_HEIGHT_SMOOTH)
  }

  function getFpsCameraGroundY(fallbackY) {
    if (fpsSmoothEyeY == null) return fallbackY
    return fpsSmoothEyeY - getFpsEyeHeight()
  }

  function applyCameraModeVisibility() {
    const isFps = cameraMode.value === 'first'
    const config = getExploreCameraMode(cameraMode.value)
    controller?.setModelVisible(!config.hideCharacter)
    controller?.setFpsVisible(isFps)
  }

  function syncExploreCamera(x, y, z) {
    if (!engineRef) return
    const config = getExploreCameraMode(cameraMode.value)
    const cameraY =
      cameraMode.value === 'first' ? getFpsCameraGroundY(y) : getTerrainHeightAt(x, z)
    engineRef.updateExploreCamera({
      x,
      y: cameraY,
      z,
      yaw: exploreCamYaw,
      pitch: exploreCamPitch,
      mode: cameraMode.value,
      distance: config.allowZoom ? thirdPersonDistance : undefined,
      eyeHeight: cameraMode.value === 'first' ? getFpsEyeHeight() : undefined,
    })
  }

  async function enterExplore(engine, project, characterId) {
    engineRef = engine
    exploreLoading.value = true
    exploreError.value = null

    try {
      if (!controller) {
        controller = createCharacterController(engine.scene, engine.camera)
      }
      if (!input) {
        input = createInputState()
        input.bind()
      }

      await controller.loadCharacter(characterId, resolveCharacterScale(project))
      currentProject = project
      await warmCollisionFootprints(project)
      const spawn = resolveSpawnPosition(project)
      collisionGrid = buildCollisionGrid(project)
      try {
        const unit = project.settings?.gridUnit ?? 1
        collisionGrid.roadSurfaceOffset = await measureRoadSurfaceOffset('road-tiles', unit)
      } catch {
        collisionGrid.roadSurfaceOffset = FALLBACK_ROAD_SURFACE_OFFSET
      }
      const groundedSpawn = snapToTerrain(spawn)
      if (cameraMode.value === 'first') resetFpsEyeHeight(groundedSpawn.y)
      exploreCamYaw = engine.getExploreCameraYaw?.() ?? Math.PI / 4
      exploreCamPitch = 0
      fpsTargetYaw = exploreCamYaw
      fpsTargetPitch = 0
      thirdPersonDistance = engine.getExploreCameraDistance?.() ?? 6.5

      applyCameraModeVisibility()
      syncExploreCamera(groundedSpawn.x, groundedSpawn.y, groundedSpawn.z)
      syncCharacterAnimationState()
    } catch (err) {
      exploreError.value = err.message ?? 'Karakter yüklenemedi.'
      throw err
    } finally {
      exploreLoading.value = false
    }
  }

  function exitExplore() {
    engineRef?.clearExploreCameraMode?.()
    controller?.dispose()
    controller = null
    input?.unbind()
    input = null
    clearWalkTarget()
    collisionGrid = null
    currentProject = null
    fpsSmoothEyeY = null
    clearCameraBehindSnap()
    characterAnimations.value = []
    activeCharacterAnimation.value = null
    characterAnimationPaused.value = false
  }

  function update(dt) {
    if (!controller || !input || !engineRef || !collisionGrid) return

    if (cameraMode.value !== 'first' && input.consumeForwardDoubleTap?.()) {
      beginCameraBehindSnap()
    }

    let movement = input.getMovement()
    if (movement.moving) {
      clearWalkTarget()
    } else {
      const axesForWalk = getExploreMovementAxes(cameraMode.value, exploreCamYaw)
      const walkMovement = resolveWalkMovement(controller.getPosition(), axesForWalk)
      if (walkMovement) movement = walkMovement
    }

    if (cameraMode.value === 'first') {
      clearCameraBehindSnap()
      if (movement.mx !== 0) {
        fpsTargetYaw -= movement.mx * FPS_TURN_SPEED * dt
        movement = { ...movement, mx: 0 }
      }
      exploreCamYaw = smoothDampAngle(exploreCamYaw, fpsTargetYaw, dt, FPS_LOOK_SMOOTH)
      exploreCamPitch = smoothDampScalar(
        exploreCamPitch,
        fpsTargetPitch,
        dt,
        FPS_LOOK_SMOOTH,
      )
      engineRef.setExploreCameraYaw(exploreCamYaw)
      engineRef.setExploreCameraPitch(exploreCamPitch)
    }

    const axes = getExploreMovementAxes(cameraMode.value, exploreCamYaw)
    const pos = controller.update(dt, collisionGrid, axes, movement)
    const grounded = snapToTerrain(pos)
    if (cameraMode.value === 'first') {
      updateFpsEyeHeight(grounded.y, dt)
    } else if (cameraBehindTargetYaw != null) {
      exploreCamYaw = smoothDampAngle(
        exploreCamYaw,
        cameraBehindTargetYaw,
        dt,
        CAMERA_BEHIND_SNAP_SMOOTH,
      )
      engineRef.setExploreCameraYaw(exploreCamYaw)
      if (Math.abs(shortestAngleDelta(exploreCamYaw, cameraBehindTargetYaw)) < 0.025) {
        exploreCamYaw = cameraBehindTargetYaw
        clearCameraBehindSnap()
      }
    } else if (
      movement.moving &&
      shouldFollowThirdPersonCamera(movement.mx, movement.mz)
    ) {
      const targetYaw = resolveThirdPersonFollowYawFromMovement(
        cameraMode.value,
        movement.mx,
        movement.mz,
        axes,
      )
      const { smooth, maxYawDelta } = getThirdPersonFollowRates(thirdPersonDistance)
      exploreCamYaw = smoothDampAngleLimited(
        exploreCamYaw,
        targetYaw,
        dt,
        smooth,
        maxYawDelta * dt,
      )
    }
    syncExploreCamera(grounded.x, grounded.y, grounded.z)
    activeCharacterAnimation.value = controller.getActiveAnimationName?.() ?? null
    characterAnimationPaused.value = controller.isAnimationPaused?.() ?? false
  }

  function playCharacterAnimation(name) {
    if (!controller?.playManualAnimation?.(name)) return false
    activeCharacterAnimation.value = name
    characterAnimationPaused.value = false
    return true
  }

  function toggleCharacterAnimationPause() {
    if (!controller) return false
    characterAnimationPaused.value = controller.toggleAnimationPause()
    return characterAnimationPaused.value
  }

  function rotateCamera(deltaYaw, deltaPitch = 0) {
    const config = getExploreCameraMode(cameraMode.value)

    if (cameraMode.value === 'first') {
      fpsTargetYaw += deltaYaw
      if (config.allowPitchDrag && deltaPitch !== 0) {
        fpsTargetPitch = THREE.MathUtils.clamp(
          fpsTargetPitch + deltaPitch,
          config.minPitch ?? -1.35,
          config.maxPitch ?? 1.35,
        )
      }
      return
    }

    if (deltaYaw !== 0) clearCameraBehindSnap()
    exploreCamYaw += deltaYaw

    if (config.allowPitchDrag && deltaPitch !== 0) {
      exploreCamPitch = THREE.MathUtils.clamp(
        exploreCamPitch + deltaPitch,
        config.minPitch ?? -1.35,
        config.maxPitch ?? 1.35,
      )
    }

    engineRef?.setExploreCameraYaw(exploreCamYaw)
    engineRef?.setExploreCameraPitch(exploreCamPitch)

    const pos = controller?.getPosition()
    if (pos) syncExploreCamera(pos.x, pos.y, pos.z)
  }

  function adjustZoom(delta) {
    const config = getExploreCameraMode(cameraMode.value)
    if (!config.allowZoom || !engineRef) return
    thirdPersonDistance = THREE.MathUtils.clamp(thirdPersonDistance + delta, 2.5, 14)
    const pos = controller?.getPosition()
    if (pos) syncExploreCamera(pos.x, pos.y, pos.z)
  }

  function cycleCameraMode() {
    const next = getNextExploreCameraMode(cameraMode.value)
    cameraMode.value = next.id
    storeExploreCameraMode(next.id)
    clearCameraBehindSnap()

    if (next.id === 'first') {
      exploreCamPitch = 0
      fpsTargetYaw = exploreCamYaw
      fpsTargetPitch = 0
      const pos = controller?.getPosition()
      if (pos) resetFpsEyeHeight(pos.y)
    } else {
      fpsSmoothEyeY = null
    }

    applyCameraModeVisibility()

    const pos = controller?.getPosition()
    if (pos) syncExploreCamera(pos.x, pos.y, pos.z)

    return next
  }

  function setCameraMode(modeId) {
    if (!getExploreCameraMode(modeId)) return null
    cameraMode.value = modeId
    storeExploreCameraMode(modeId)
    clearCameraBehindSnap()
    if (modeId === 'first') {
      exploreCamPitch = 0
      fpsTargetYaw = exploreCamYaw
      fpsTargetPitch = 0
      const pos = controller?.getPosition()
      if (pos) resetFpsEyeHeight(pos.y)
    } else {
      fpsSmoothEyeY = null
    }
    applyCameraModeVisibility()
    const pos = controller?.getPosition()
    if (pos) syncExploreCamera(pos.x, pos.y, pos.z)
    return getExploreCameraMode(modeId)
  }

  function getThirdPersonDistance() {
    return thirdPersonDistance
  }

  function setThirdPersonDistance(distance) {
    thirdPersonDistance = THREE.MathUtils.clamp(distance, 2.5, 14)
    const pos = controller?.getPosition()
    if (pos) syncExploreCamera(pos.x, pos.y, pos.z)
  }

  async function reloadCharacter(characterId, project) {
    if (!controller || !engineRef) return
    currentProject = project
    await controller.loadCharacter(characterId, resolveCharacterScale(project))
    await warmCollisionFootprints(project)
    collisionGrid = buildCollisionGrid(project)
    try {
      const unit = project.settings?.gridUnit ?? 1
      collisionGrid.roadSurfaceOffset = await measureRoadSurfaceOffset('road-tiles', unit)
    } catch {
      collisionGrid.roadSurfaceOffset = FALLBACK_ROAD_SURFACE_OFFSET
    }
    const spawn = resolveSpawnPosition(project)
    const groundedSpawn = snapToTerrain(spawn)
    if (cameraMode.value === 'first') resetFpsEyeHeight(groundedSpawn.y)
    applyCameraModeVisibility()
    syncExploreCamera(groundedSpawn.x, groundedSpawn.y, groundedSpawn.z)
    syncCharacterAnimationState()
  }

  function applyCharacterScale(scale) {
    if (!controller) return
    controller.setCharacterScale(scale)
    const pos = controller.getPosition()
    const grounded = snapToTerrain(pos)
    if (cameraMode.value === 'first') resetFpsEyeHeight(grounded.y)
  }

  function getPlayerPosition() {
    if (!controller) return null
    const pos = controller.getPosition()
    return { x: pos.x, z: pos.z }
  }

  function peekMovement() {
    const keyboard = input?.getMovement?.() ?? {
      mx: 0,
      mz: 0,
      moving: false,
      running: false,
    }
    if (keyboard.moving || !walkTarget || !controller) return keyboard
    const axes = getExploreMovementAxes(cameraMode.value, exploreCamYaw)
    return resolveWalkMovement(controller.getPosition(), axes) ?? keyboard
  }

  function dispose() {
    exitExplore()
    engineRef = null
    cameraMode.value = loadStoredExploreCameraMode()
  }

  return {
    exploreLoading,
    exploreError,
    cameraMode,
    cameraModeLabel,
    enterExplore,
    exitExplore,
    update,
    rotateCamera,
    adjustZoom,
    cycleCameraMode,
    setCameraMode,
    getThirdPersonDistance,
    setThirdPersonDistance,
    reloadCharacter,
    applyCharacterScale,
    getPlayerPosition,
    setWalkTarget,
    clearWalkTarget,
    peekMovement,
    getCameraYaw: () => exploreCamYaw,
    characterAnimations,
    activeCharacterAnimation,
    characterAnimationPaused,
    playCharacterAnimation,
    toggleCharacterAnimationPause,
    dispose,
  }
}
