import * as THREE from 'three';

/**
 * Mobilya modelleri için kompozisyon
 * @returns {Object} Mobilya kategorisi ve modelleri
 */
export default function useModelFurniture() {
  /**
   * Basit bir masa modeli oluşturur
   * @returns {THREE.Group} Masa model grubu
   */
  function createTable() {
    const group = new THREE.Group();
    
    // Masa üstü
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    tableTop.position.y = 0.75;
    group.add(tableTop);
    
    // Masa bacakları
    for (let x = -0.8; x <= 0.8; x += 1.6) {
      for (let z = -0.4; z <= 0.4; z += 0.8) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.75, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        leg.position.set(x, 0.375, z);
        group.add(leg);
      }
    }
    
    return group;
  }
  
  /**
   * Basit bir sandalye modeli oluşturur
   * @returns {THREE.Group} Sandalye model grubu
   */
  function createChair() {
    const group = new THREE.Group();
    
    // Oturma kısmı
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    seat.position.y = 0.4;
    group.add(seat);
    
    // Sandalye bacakları
    for (let x = -0.2; x <= 0.2; x += 0.4) {
      for (let z = -0.2; z <= 0.2; z += 0.4) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.4, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        leg.position.set(x, 0.2, z);
        group.add(leg);
      }
    }
    
    // Sandalye sırtlığı
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    back.position.set(0, 0.6, 0.225);
    group.add(back);
    
    return group;
  }
  
  /**
   * Basit bir koltuk modeli oluşturur
   * @returns {THREE.Group} Koltuk model grubu
   */
  function createSofa() {
    const group = new THREE.Group();
    
    // Koltuk oturma kısmı
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.3, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x4169E1 })
    );
    seat.position.y = 0.3;
    group.add(seat);
    
    // Koltuk sırtlığı
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x4169E1 })
    );
    back.position.set(0, 0.6, -0.3);
    group.add(back);
    
    // Koltuk kolları
    for (let x = -0.9; x <= 0.9; x += 1.8) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x4169E1 })
      );
      arm.position.set(x, 0.4, 0);
      group.add(arm);
    }
    
    // Koltuk bacakları
    for (let x = -0.8; x <= 0.8; x += 1.6) {
      for (let z = -0.3; z <= 0.3; z += 0.6) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        leg.position.set(x, 0.075, z);
        group.add(leg);
      }
    }
    
    return group;
  }

  return {
    category: { id: 'furniture', name: 'Mobilyalar' },
    models: [
      { id: 'table', name: 'Masa', create: createTable },
      { id: 'chair', name: 'Sandalye', create: createChair },
      { id: 'sofa', name: 'Koltuk', create: createSofa }
    ]
  };
} 