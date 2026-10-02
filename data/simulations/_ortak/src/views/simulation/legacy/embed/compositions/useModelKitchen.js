import * as THREE from 'three';

/**
 * Mutfak gereçleri modellerini oluşturan ve yöneten modül
 * @returns {Object} Mutfak gereçleri modelleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelKitchen() {
  // Mutfak gereçleri modelleri koleksiyonu
  const kitchenItems = [
    { id: 'fork', name: 'Çatal', create: createFork },
    { id: 'knife', name: 'Bıçak', create: createKnife },
    { id: 'pot', name: 'Tencere', create: createPot },
    { id: 'glass', name: 'Bardak', create: createGlass },
    { id: 'plate', name: 'Tabak', create: createPlate },
    { id: 'spoon', name: 'Kaşık', create: createSpoon }
  ];

  /**
   * Çatal modeli oluşturur
   * @returns {THREE.Group} Çatal 3D modeli
   */
  function createFork() {
    const forkGroup = new THREE.Group();
    
    // Çatal sapı
    const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16);
    const metalMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.2
    });
    const handle = new THREE.Mesh(handleGeometry, metalMaterial);
    handle.position.set(0, 0, 0);
    handle.rotation.z = Math.PI / 2;
    forkGroup.add(handle);
    
    // Çatal uçları
    const prong = (x, y, z) => {
      const prongGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
      const prong = new THREE.Mesh(prongGeometry, metalMaterial);
      prong.position.set(x, y, z);
      prong.rotation.z = Math.PI / 2;
      forkGroup.add(prong);
    };
    
    prong(0.6, 0, -0.12);
    prong(0.6, 0, -0.04);
    prong(0.6, 0, 0.04);
    prong(0.6, 0, 0.12);
    
    return forkGroup;
  }

  /**
   * Bıçak modeli oluşturur
   * @returns {THREE.Group} Bıçak 3D modeli
   */
  function createKnife() {
    const knifeGroup = new THREE.Group();
    
    // Bıçak sapı
    const handleGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e3a8a,
      roughness: 0.7
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(-0.35, 0, 0);
    handle.rotation.z = Math.PI / 2;
    knifeGroup.add(handle);
    
    // Bıçak metali
    const bladeGeometry = new THREE.BoxGeometry(0.7, 0.15, 0.02);
    bladeGeometry.translate(0.2, 0, 0);
    const bladeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.2
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    
    // Bıçağın keskin ucunu oluştur
    const vertices = blade.geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      if (x > 0.5) {
        // Ucunu sivrilt
        vertices.setY(i, vertices.getY(i) * (0.8 - (x - 0.5) * 1.6));
      }
    }
    vertices.needsUpdate = true;
    
    knifeGroup.add(blade);
    
    return knifeGroup;
  }

  /**
   * Tencere modeli oluşturur
   * @returns {THREE.Group} Tencere 3D modeli
   */
  function createPot() {
    const potGroup = new THREE.Group();
    
    // Tencere gövdesi
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.4, 0.6, 32);
    const metalMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, metalMaterial);
    potGroup.add(body);
    
    // Tencerenin içi
    const innerGeometry = new THREE.CylinderGeometry(0.45, 0.35, 0.55, 32);
    const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x9ca3af });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.set(0, 0.025, 0);
    potGroup.add(inner);
    
    // Tencerenin kulpları
    const handleGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI);
    
    const leftHandle = new THREE.Mesh(handleGeometry, metalMaterial);
    leftHandle.position.set(-0.5, 0.1, 0);
    leftHandle.rotation.y = Math.PI / 2;
    potGroup.add(leftHandle);
    
    const rightHandle = new THREE.Mesh(handleGeometry, metalMaterial);
    rightHandle.position.set(0.5, 0.1, 0);
    rightHandle.rotation.y = -Math.PI / 2;
    potGroup.add(rightHandle);
    
    // Tencerenin kapağı
    const lidGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const lid = new THREE.Mesh(lidGeometry, metalMaterial);
    lid.position.set(0, 0.35, 0);
    potGroup.add(lid);
    
    // Kapak tutacağı
    const knobGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.1, 16);
    const knob = new THREE.Mesh(knobGeometry, metalMaterial);
    knob.position.set(0, 0.45, 0);
    potGroup.add(knob);
    
    return potGroup;
  }

  /**
   * Bardak modeli oluşturur
   * @returns {THREE.Group} Bardak 3D modeli
   */
  function createGlass() {
    const glassGroup = new THREE.Group();
    
    // Bardak gövdesi - silindir şeklinde
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.6, 32);
    const glassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, glassMaterial);
    body.position.y = 0.3;
    glassGroup.add(body);
    
    // Bardak tabanı - daha kalın
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0;
    glassGroup.add(base);
    
    // İçindeki sıvı (opsiyonel)
    const liquidGeometry = new THREE.CylinderGeometry(0.24, 0.19, 0.4, 32);
    const liquidMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6, // Mavi (su)
      transparent: true,
      opacity: 0.7
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = 0.2;
    glassGroup.add(liquid);
    
    return glassGroup;
  }

  /**
   * Tabak modeli oluşturur
   * @returns {THREE.Group} Tabak 3D modeli
   */
  function createPlate() {
    const plateGroup = new THREE.Group();
    
    // Tabak ana kısmı - yassı silindir
    const plateGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
    const plateMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1
    });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.y = 0.025;
    plateGroup.add(plate);
    
    // Tabak kenarı - ince halka
    const rimGeometry = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
    const rim = new THREE.Mesh(rimGeometry, plateMaterial);
    rim.position.y = 0.05;
    rim.rotation.x = Math.PI / 2;
    plateGroup.add(rim);
    
    // Tabak tabanı - daha küçük silindir
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32);
    const base = new THREE.Mesh(baseGeometry, plateMaterial);
    base.position.y = 0;
    plateGroup.add(base);
    
    return plateGroup;
  }

  /**
   * Kaşık modeli oluşturur
   * @returns {THREE.Group} Kaşık 3D modeli
   */
  function createSpoon() {
    const spoonGroup = new THREE.Group();
    
    // Kaşık sapı
    const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16);
    const metalMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.2
    });
    const handle = new THREE.Mesh(handleGeometry, metalMaterial);
    handle.position.set(0, 0, 0);
    handle.rotation.z = Math.PI / 2;
    spoonGroup.add(handle);
    
    // Kaşık ucu (oval)
    const bowlGeometry = new THREE.SphereGeometry(0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const bowl = new THREE.Mesh(bowlGeometry, metalMaterial);
    bowl.position.set(0.5, 0, 0);
    bowl.rotation.z = -Math.PI / 2;
    bowl.scale.set(1, 0.7, 1);
    spoonGroup.add(bowl);
    
    return spoonGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'kitchen',
    name: 'Mutfak Gereçleri'
  };

  return {
    models: kitchenItems,
    category,
    createFork,
    createKnife,
    createPot,
    createGlass,
    createPlate,
    createSpoon
  };
} 