import * as THREE from 'three';

/**
 * Geometrik şekil modellerini oluşturan ve yöneten modül
 * @returns {Object} Geometrik şekil modelleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelGeometric() {
  // Geometrik şekiller modelleri koleksiyonu
  const geometricShapes = [
    { id: 'cube', name: 'Küp', create: createCube },
    { id: 'sphere', name: 'Küre', create: createSphere },
    { id: 'cylinder', name: 'Silindir', create: createCylinder },
    { id: 'cone', name: 'Koni', create: createCone },
    { id: 'torus', name: 'Halka', create: createTorus },
    { id: 'prism', name: 'Prizma', create: createPrism },
    { id: 'pyramid', name: 'Piramit', create: createPyramid },
    { id: 'octahedron', name: 'Oktahedron', create: createOctahedron }
  ];

  /**
   * Küp modeli oluşturur
   * @returns {THREE.Mesh} Küp 3D modeli
   */
  function createCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 }); // Mavi
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Küre modeli oluşturur
   * @returns {THREE.Mesh} Küre 3D modeli
   */
  function createSphere() {
    const geometry = new THREE.SphereGeometry(0.7, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xef4444 }); // Kırmızı
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Silindir modeli oluşturur
   * @returns {THREE.Mesh} Silindir 3D modeli
   */
  function createCylinder() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x10b981 }); // Yeşil
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Koni modeli oluşturur
   * @returns {THREE.Mesh} Koni 3D modeli
   */
  function createCone() {
    const geometry = new THREE.ConeGeometry(0.7, 1.5, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xf59e0b }); // Sarı/Turuncu
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Halka modeli oluşturur
   * @returns {THREE.Mesh} Halka (Torus) 3D modeli
   */
  function createTorus() {
    const geometry = new THREE.TorusGeometry(0.7, 0.2, 16, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }); // Mor
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Prizma modeli oluşturur
   * @returns {THREE.Group} Prizma 3D modeli
   */
  function createPrism() {
    const group = new THREE.Group();
    
    // Üçgen prizma şekli oluşturmak için özel geometri
    const vertices = new Float32Array([
      // Taban üçgen
      -0.5, 0, -0.5,
      0.5, 0, -0.5,
      0, 0, 0.5,
      
      // Üst üçgen
      -0.5, 1, -0.5,
      0.5, 1, -0.5,
      0, 1, 0.5
    ]);
    
    const indices = [
      // Taban
      0, 1, 2,
      
      // Üst
      3, 5, 4,
      
      // Yan yüzeyler
      0, 3, 1,
      1, 3, 4,
      1, 4, 2,
      2, 4, 5,
      2, 5, 0,
      0, 5, 3
    ];
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({ color: 0xe11d48 }); // Pembemsi kırmızı
    const prism = new THREE.Mesh(geometry, material);
    group.add(prism);
    
    return group;
  }

  /**
   * Piramit modeli oluşturur
   * @returns {THREE.Group} Piramit 3D modeli
   */
  function createPyramid() {
    const group = new THREE.Group();
    
    // Kare tabanlı piramit
    const geometry = new THREE.ConeGeometry(0.7, 1.5, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0xfacc15 }); // Açık sarı
    const pyramid = new THREE.Mesh(geometry, material);
    
    // Piramiti döndür ve konumlandır
    pyramid.rotation.y = Math.PI / 4; // 45 derece döndür
    
    group.add(pyramid);
    return group;
  }

  /**
   * Oktahedron modeli oluşturur
   * @returns {THREE.Group} Oktahedron 3D modeli
   */
  function createOctahedron() {
    const group = new THREE.Group();
    
    // Sekizyüzlü (Oktahedron)
    const geometry = new THREE.OctahedronGeometry(0.7);
    const material = new THREE.MeshStandardMaterial({ color: 0x2dd4bf }); // Turkuaz
    const octahedron = new THREE.Mesh(geometry, material);
    
    group.add(octahedron);
    return group;
  }

  // Kategori bilgisi
  const category = {
    id: 'geometric',
    name: 'Geometrik Şekiller'
  };

  return {
    models: geometricShapes,
    category,
    createCube,
    createSphere,
    createCylinder,
    createCone,
    createTorus,
    createPrism,
    createPyramid,
    createOctahedron
  };
} 