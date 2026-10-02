import * as THREE from 'three';
import { rng, deformIcosahedron, tubeFromPoints } from './modelBuilderHelpers.js';

/**
 * Doğa ve hava olayları ile ilgili modelleri oluşturan ve yöneten modül
 * @returns {Object} Doğa elementleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelNatureElements() {
  // Doğa elementleri modelleri koleksiyonu
  const natureElements = [
    { id: 'cloud', name: 'Bulut', create: createCloud },
    { id: 'smoke', name: 'Duman', create: createSmoke },
    { id: 'fire', name: 'Ateş', create: createFire },
    { id: 'rain', name: 'Yağmur', create: createRain },
    { id: 'fog', name: 'Sis', create: createFog },
    { id: 'lightning', name: 'Şimşek', create: createLightning },
    { id: 'snow', name: 'Kar', create: createSnow },
    { id: 'rock', name: 'Kaya', create: createRock },
    { id: 'tree', name: 'Ağaç', create: createTree },
    { id: 'flower', name: 'Çiçek', create: createFlower }
  ];

  /**
   * Bulut modeli oluşturur
   * @returns {THREE.Group} Bulut 3D modeli
   */
  function createCloud() {
    const cloudGroup = new THREE.Group();
    
    // Bulut parçaları
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, 
      roughness: 1,
      metalness: 0
    });
    
    // Ana kısım
    const mainSphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
    cloudGroup.add(mainSphere);
    
    // Etrafına küçük küreler ekleyerek bulut görünümü oluşturma
    const positions = [
      { x: 0.4, y: 0.1, z: 0.1, scale: 0.7 },
      { x: -0.4, y: 0, z: 0.1, scale: 0.6 },
      { x: 0, y: 0.3, z: 0.2, scale: 0.7 },
      { x: 0.2, y: -0.2, z: 0.2, scale: 0.5 },
      { x: -0.3, y: -0.1, z: -0.1, scale: 0.6 },
      { x: 0.2, y: 0.1, z: -0.3, scale: 0.4 }
    ];
    
    positions.forEach(pos => {
      const cloudPiece = new THREE.Mesh(sphereGeometry, cloudMaterial);
      cloudPiece.position.set(pos.x, pos.y, pos.z);
      cloudPiece.scale.setScalar(pos.scale);
      cloudGroup.add(cloudPiece);
    });
    
    return cloudGroup;
  }

  /**
   * Duman modeli oluşturur
   * @returns {THREE.Group} Duman 3D modeli
   */
  function createSmoke() {
    const smokeGroup = new THREE.Group();
    
    // Giderek azalan opaklık değerleri ile üst üste parçalardan oluşan duman modeli
    const levels = 5;
    const baseSize = 0.3;
    
    for (let i = 0; i < levels; i++) {
      const smokeGeometry = new THREE.SphereGeometry(baseSize + i * 0.1, 16, 16);
      const opacity = 1 - (i * 0.15);
      const smokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        transparent: true,
        opacity: opacity,
        roughness: 1,
        metalness: 0
      });
      
      const smokePiece = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smokePiece.position.y = i * 0.2;
      smokeGroup.add(smokePiece);
    }
    
    return smokeGroup;
  }

  /**
   * Ateş modeli oluşturur
   * @returns {THREE.Group} Ateş 3D modeli
   */
  function createFire() {
    const fireGroup = new THREE.Group();
    
    // Ateş tabanı
    const baseGeometry = new THREE.ConeGeometry(0.5, 1, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0.5,
    });
    const baseFlame = new THREE.Mesh(baseGeometry, baseMaterial);
    baseFlame.position.y = 0.5;
    fireGroup.add(baseFlame);
    
    // Ateş ortası - daha parlak
    const midGeometry = new THREE.ConeGeometry(0.3, 0.8, 16);
    const midMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0xff6600,
      emissiveIntensity: 0.8,
    });
    const midFlame = new THREE.Mesh(midGeometry, midMaterial);
    midFlame.position.y = 0.6;
    fireGroup.add(midFlame);
    
    // Ateş ucu - en parlak kısım
    const tipGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffcc00,
      emissiveIntensity: 1,
    });
    const tipFlame = new THREE.Mesh(tipGeometry, tipMaterial);
    tipFlame.position.y = 0.9;
    fireGroup.add(tipFlame);
    
    return fireGroup;
  }

  /**
   * Yağmur modeli oluşturur
   * @returns {THREE.Group} Yağmur 3D modeli
   */
  function createRain() {
    const rainGroup = new THREE.Group();
    
    // Yağmur damlacıkları
    const dropGeometry = new THREE.CylinderGeometry(0.03, 0, 0.2, 8);
    const dropMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7,
    });
    
    // Rasgele dağılmış 30 yağmur damlası
    for (let i = 0; i < 30; i++) {
      const drop = new THREE.Mesh(dropGeometry, dropMaterial);
      
      // Rasgele konumlandırma
      drop.position.set(
        (rng('rain', i * 3) - 0.5) * 2,
        (rng('rain', i * 3 + 1) - 0.5) * 2,
        (rng('rain', i * 3 + 2) - 0.5) * 2
      );
      
      // Damlalar aşağı doğru baksın
      drop.rotation.x = Math.PI;
      
      rainGroup.add(drop);
    }
    
    return rainGroup;
  }

  /**
   * Sis modeli oluşturur
   * @returns {THREE.Group} Sis 3D modeli
   */
  function createFog() {
    const fogGroup = new THREE.Group();
    
    // Sis parçaları - yarı saydam düzensiz şekiller
    const fogMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      transparent: true,
      opacity: 0.4,
      roughness: 1,
      metalness: 0
    });
    
    // Farklı boyutlarda sis parçaları
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.SphereGeometry(0.3 + rng('fog', i) * 0.3, 8, 8);
      const fogPiece = new THREE.Mesh(geometry, fogMaterial);
      fogPiece.position.set(
        (rng('fog', i * 3 + 10) - 0.5) * 2,
        rng('fog', i * 3 + 11) * 0.5,
        (rng('fog', i * 3 + 12) - 0.5) * 2
      );
      const scale = 0.7 + rng('fog', i * 3 + 13) * 0.6;
      fogPiece.scale.set(scale, scale * 0.5, scale);
      
      fogGroup.add(fogPiece);
    }
    
    return fogGroup;
  }

  /**
   * Şimşek modeli oluşturur
   * @returns {THREE.Group} Şimşek 3D modeli
   */
  function createLightning() {
    const lightningGroup = new THREE.Group();
    
    // Şimşek - zikzak şeklinde parçalar
    const segmentCount = 5;
    const lightningMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ffff,
      emissive: 0x66ffff,
      emissiveIntensity: 0.8,
    });
    
    let lastPosition = new THREE.Vector3(0, 1, 0);
    
    for (let i = 0; i < segmentCount; i++) {
      // Şimşek parçası
      const segmentLength = 0.4 - i * 0.05;  // Giderek incelen parçalar
      const segmentGeometry = new THREE.CylinderGeometry(0.05, 0.05, segmentLength, 8);
      const segment = new THREE.Mesh(segmentGeometry, lightningMaterial);
      
      // Her parça için rastgele yön
      const angle = (rng('lightning', i) - 0.5) * Math.PI * 0.5;
      const direction = new THREE.Vector3(Math.sin(angle), -1, 0).normalize();
      
      // Önceki parçanın ucundan başla
      segment.position.copy(lastPosition);
      segment.position.sub(direction.clone().multiplyScalar(segmentLength / 2));
      
      // Yönünü ayarla
      segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      
      // Bir sonraki parça için pozisyonu güncelle
      lastPosition.copy(segment.position);
      lastPosition.sub(direction.clone().multiplyScalar(segmentLength / 2));
      
      lightningGroup.add(segment);
    }
    
    return lightningGroup;
  }

  /**
   * Kar modeli oluşturur
   * @returns {THREE.Group} Kar 3D modeli
   */
  function createSnow() {
    const snowGroup = new THREE.Group();
    
    // Kar taneleri
    const flakeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
    });
    
    // 30 kar tanesi oluştur
    for (let i = 0; i < 30; i++) {
      // Kar tanelerinin çeşitliliği için farklı geometriler
      let flakeGeometry;
      const flakeType = Math.floor(rng('snow', i) * 3);
      
      switch (flakeType) {
        case 0:
          // Küçük küre
          flakeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
          break;
        case 1:
          // Düz disk (yassı)
          flakeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12);
          break;
        case 2:
          // Küçük oktahedron (kristal gibi)
          flakeGeometry = new THREE.OctahedronGeometry(0.07, 0);
          break;
      }
      
      const flake = new THREE.Mesh(flakeGeometry, flakeMaterial);
      
      // Rasgele konumlandırma
      flake.position.set(
        (rng('snow', i * 3 + 20) - 0.5) * 2,
        (rng('snow', i * 3 + 21) - 0.5) * 2,
        (rng('snow', i * 3 + 22) - 0.5) * 2
      );
      flake.rotation.set(
        rng('snow', i * 3 + 23) * Math.PI * 2,
        rng('snow', i * 3 + 24) * Math.PI * 2,
        rng('snow', i * 3 + 25) * Math.PI * 2
      );
      
      snowGroup.add(flake);
    }
    
    return snowGroup;
  }

  /**
   * Kaya/taş modeli oluşturur
   * @returns {THREE.Group} Kaya 3D modeli
   */
  function createRock() {
    const rockGroup = new THREE.Group();
    
    // Kayanın temel yapısı - düzensiz çokgen
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 1);
    deformIcosahedron(rockGeometry, 'rock', 0.1);

    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    
    // Ana kayayı oluştur
    const mainRock = new THREE.Mesh(rockGeometry, rockMaterial);
    rockGroup.add(mainRock);
    
    // İsteğe bağlı: Bazı rasgele küçük kaya parçaları ekle
    for (let i = 0; i < 3; i++) {
      const smallRockGeometry = new THREE.DodecahedronGeometry(0.15 * rng('rock', i + 30) + 0.1, 0);
      const smallRock = new THREE.Mesh(smallRockGeometry, rockMaterial);
      smallRock.position.set(
        (rng('rock', i * 3 + 40) - 0.5) * 0.5,
        -0.3 + rng('rock', i * 3 + 41) * 0.2,
        (rng('rock', i * 3 + 42) - 0.5) * 0.5
      );
      smallRock.rotation.set(
        rng('rock', i * 3 + 43) * Math.PI,
        rng('rock', i * 3 + 44) * Math.PI,
        rng('rock', i * 3 + 45) * Math.PI
      );
      
      rockGroup.add(smallRock);
    }
    
    return rockGroup;
  }

  /**
   * Ağaç modeli oluşturur
   * @returns {THREE.Group} Ağaç 3D modeli
   */
  function createTree() {
    const treeGroup = new THREE.Group();
    
    // Ağaç gövdesi
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,  // Kahverengi
      roughness: 0.9 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.6;  // Yarı yüksekliği
    treeGroup.add(trunk);
    
    // Çam ağacı — sabit, tutarlı tip
    const leavesColor = new THREE.Color(0x2E8B57);
    for (let i = 0; i < 3; i++) {
      const size = 0.7 - i * 0.2;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(size, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: leavesColor, roughness: 0.8 })
      );
      cone.position.y = 1.0 + i * 0.4;
      treeGroup.add(cone);
    }
    
    return treeGroup;
  }

  /**
   * Çiçek modeli oluşturur
   * @returns {THREE.Group} Çiçek 3D modeli
   */
  function createFlower() {
    const flowerGroup = new THREE.Group();
    
    // Çiçek sapı
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x228B22,  // Yeşil
      roughness: 0.8 
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.35;
    flowerGroup.add(stem);
    
    // Papatya — sabit tip ve renk
    const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.5 });
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xFFFF00, roughness: 0.5 })
    );
    center.position.y = 0.7;
    flowerGroup.add(center);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.05), flowerMaterial);
      petal.position.set(Math.cos(angle) * 0.15, 0.7, Math.sin(angle) * 0.15);
      petal.rotation.y = angle;
      flowerGroup.add(petal);
    }
    
    // Yaprak ekle
    const leafGeometry = new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x32CD32,  // Açık yeşil
      roughness: 0.8 
    });
    
    const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf1.position.set(0.1, 0.3, 0);
    leaf1.rotation.z = Math.PI / 4;
    leaf1.rotation.y = Math.PI / 2;
    leaf1.scale.set(1, 1, 2);  // Yaprağı uzat
    flowerGroup.add(leaf1);
    
    // İkinci yaprak, farklı yöne
    const leaf2 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf2.position.set(-0.1, 0.45, 0);
    leaf2.rotation.z = -Math.PI / 4;
    leaf2.rotation.y = -Math.PI / 2;
    leaf2.scale.set(1, 1, 2);
    flowerGroup.add(leaf2);
    
    return flowerGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'nature',
    name: 'Doğa ve Hava Olayları'
  };

  return {
    models: natureElements,
    category,
    createCloud,
    createSmoke,
    createFire,
    createRain,
    createFog,
    createLightning,
    createSnow,
    createRock,
    createTree,
    createFlower
  };
} 