import * as THREE from 'three'

/** @param {string} seed */
export function hashSeed(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic 0..1 — GLTF export tutarlılığı için */
export function rng(seed, index = 0) {
  const x = Math.sin((hashSeed(String(seed)) + index * 9301) * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function createMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.65,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  })
}

export function mesh(geometry, color, opts = {}) {
  return new THREE.Mesh(geometry, createMat(color, opts))
}

export function group() {
  return new THREE.Group()
}

/** Küre yüzeyinde deterministik nokta */
export function spherePoint(seed, index, total, radius) {
  const u = rng(seed, index * 2)
  const v = rng(seed, index * 2 + 1)
  const phi = Math.acos(2 * u - 1)
  const theta = 2 * Math.PI * v
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  )
}

/** Yüzeye hizalı disk/dekor */
export function addSurfacePatch(parent, seed, index, radius, patchRadius, color, opts = {}) {
  const pos = spherePoint(seed, index, 1, radius)
  const patch = mesh(new THREE.CircleGeometry(patchRadius, opts.segments ?? 10), color, opts)
  patch.position.copy(pos)
  patch.lookAt(0, 0, 0)
  parent.add(patch)
  return patch
}

/** Line yerine GLTF-uyumlu ince tüp */
export function tubeFromPoints(points, radius, color, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, opts.segments ?? 16, radius, opts.radial ?? 6, false)
  return mesh(geo, color, opts)
}

/** İkosahedron deformasyonu — deterministik */
export function deformIcosahedron(geometry, seed, amount = 0.2) {
  const pos = geometry.getAttribute('position')
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.x += (rng(seed, i * 3) - 0.5) * amount
    v.y += (rng(seed, i * 3 + 1) - 0.5) * amount
    v.z += (rng(seed, i * 3 + 2) - 0.5) * amount
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** Basit hayvan gövdesi */
export function animalBody(color, length = 0.6, radius = 0.3) {
  const body = mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), color)
  body.rotation.z = Math.PI / 2
  return body
}

/** Dört bacak */
export function addLegs(parent, positions, radius, height, color) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 8)
  const mat = createMat(color)
  for (const [x, y, z] of positions) {
    const leg = new THREE.Mesh(geo, mat)
    leg.position.set(x, y, z)
    parent.add(leg)
  }
}

/** Kuyruk eğrisi */
export function addTail(parent, points, radius, color) {
  parent.add(tubeFromPoints(points, radius, color))
}

/** Göz çifti */
export function addEyes(parent, x, y, z, spacing, size = 0.04) {
  const geo = new THREE.SphereGeometry(size, 12, 12)
  const mat = createMat(0x111111)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(geo, mat)
    eye.position.set(x, y, z * side || side * spacing)
    if (z === 0) eye.position.z = side * spacing
    parent.add(eye)
  }
}

/** Dünya kıtaları — basit yeşil lekeler */
export function addEarthContinents(earthGroup, seed = 'earth') {
  const landMat = createMat(0x2d8a4e, { roughness: 0.85 })
  const positions = [
    [0.3, 0.5, 0.7],
    [-0.6, 0.2, 0.5],
    [0.1, -0.4, 0.85],
    [-0.4, 0.6, -0.3],
    [0.7, -0.1, -0.4],
    [-0.2, -0.6, -0.5],
    [0.5, 0.3, -0.65],
  ]
  positions.forEach(([x, y, z], i) => {
    const s = 0.12 + rng(seed, i) * 0.1
    const patch = mesh(new THREE.SphereGeometry(s, 8, 8), 0x2d8a4e, { roughness: 0.85 })
    const len = Math.sqrt(x * x + y * y + z * z)
    patch.position.set((x / len) * 1.01, (y / len) * 1.01, (z / len) * 1.01)
    patch.scale.set(1.4, 0.35, 1.2)
    patch.lookAt(0, 0, 0)
    earthGroup.add(patch)
  })
}
