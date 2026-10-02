// Önizleme saplaması: oyun model kütüphanesi (GLB) aktarılmadı; modeller boş Group olarak döner.
import * as THREE from 'three'
export const setActiveLoadSession = () => {}
export const clearAssetCache = () => {}
export async function loadAssetTemplate() { return new THREE.Group() }
export async function cloneAssetInstance() { return new THREE.Group() }
export async function getAssetAnimationClips() { return [] }
export async function preloadAssets(_items, onProgress) { onProgress?.(1) }
