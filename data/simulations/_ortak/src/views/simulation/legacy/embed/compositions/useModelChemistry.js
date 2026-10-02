import * as THREE from 'three';

/**
 * Kimyasal elementler ve moleküller ile ilgili modelleri oluşturan ve yöneten modül
 * @returns {Object} Kimya elementleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelChemistry() {
  // Atom yarıçapları (van der Waals yarıçapları, Å biriminde)
  const atomRadii = {
    H: 1.2,  // Hidrojen
    C: 1.7,  // Karbon
    N: 1.55, // Azot
    O: 1.52, // Oksijen
    S: 1.8,  // Kükürt
    P: 1.8,  // Fosfor
    F: 1.47, // Flor
    Cl: 1.75, // Klor
    Na: 2.27, // Sodyum
    Mg: 1.73, // Magnezyum
    K: 2.75,  // Potasyum
    Ca: 2.31, // Kalsiyum
    I: 1.98,  // İyot
    Br: 1.85  // Brom
  };
  
  // Atom renkleri (standart CPK renkleri)
  const atomColors = {
    H: 0xFFFFFF,  // Beyaz
    C: 0x333333,  // Gri
    N: 0x3050F8,  // Mavi
    O: 0xFF0000,  // Kırmızı
    S: 0xFFFF30,  // Sarı
    P: 0xFF8000,  // Turuncu
    F: 0x90E050,  // Açık yeşil
    Cl: 0x1FF01F, // Yeşil
    Na: 0x0000FF, // Mavi
    Mg: 0x228B22, // Orman yeşili
    K: 0xFF00FF,  // Mor
    Ca: 0x808090, // Açık gri
    I: 0x940094,  // Mor
    Br: 0xA52A2A  // Kahverengi
  };
  
  // Scale faktörü (atom boyutunu ayarlamak için)
  const scaleFactor = 0.25;
  
  // Kimyasal bağ uzunlukları (Angstrom biriminde)
  const bondLengths = {
    'C-C': 1.54,  // Karbon-Karbon tek bağı
    'C=C': 1.34,  // Karbon-Karbon çift bağı
    'C≡C': 1.20,  // Karbon-Karbon üçlü bağı
    'C-H': 1.09,  // Karbon-Hidrojen bağı
    'C-O': 1.43,  // Karbon-Oksijen bağı
    'C=O': 1.23,  // Karbon-Oksijen çift bağı
    'O-H': 0.96,  // Oksijen-Hidrojen bağı
    'N-H': 1.01,  // Azot-Hidrojen bağı
    'C-N': 1.47,  // Karbon-Azot bağı
    'C=N': 1.38,  // Karbon-Azot çift bağı
    'S-O': 1.43,  // Kükürt-Oksijen bağı
    'S=O': 1.43,  // Kükürt-Oksijen çift bağı
    'O-O': 1.48,  // Oksijen-Oksijen bağı
    'O=O': 1.21,  // Oksijen-Oksijen çift bağı
    'Na-Cl': 2.36 // Sodyum-Klor bağı (iyonik)
  };

  // Kimya elementleri modelleri koleksiyonu
  const chemistryElements = [
    { id: 'atom', name: 'Atom', create: createAtom },
    { id: 'water', name: 'Su Molekülü (H₂O)', create: createWaterMolecule },
    { id: 'methane', name: 'Metan (CH₄)', create: createMethaneMolecule },
    { id: 'oxygen', name: 'Oksijen (O₂)', create: createOxygenMolecule },
    { id: 'carbon_dioxide', name: 'Karbondioksit (CO₂)', create: createCarbonDioxideMolecule },
    { id: 'ammonia', name: 'Amonyak (NH₃)', create: createAmmoniaMolecule },
    { id: 'ethanol', name: 'Etanol (C₂H₅OH)', create: createEthanolMolecule },
    { id: 'benzene', name: 'Benzen (C₆H₆)', create: createBenzeneMolecule },
    { id: 'glucose', name: 'Glikoz (C₆H₁₂O₆)', create: createGlucoseMolecule },
    { id: 'salt', name: 'Tuz (NaCl)', create: createSaltCrystal },
    { id: 'sulfuric_acid', name: 'Sülfürik Asit (H₂SO₄)', create: createSulfuricAcidMolecule },
    { id: 'ozone', name: 'Ozon (O₃)', create: createOzoneMolecule },
    { id: 'crystal', name: 'Kristal Yapı', create: createCrystalStructure }
  ];
  
  /**
   * İki atom arasında silindir şeklinde bağ oluşturur
   * @param {THREE.Vector3} start - Başlangıç pozisyonu
   * @param {THREE.Vector3} end - Bitiş pozisyonu
   * @param {number} radius - Bağ yarıçapı
   * @param {number} color - Bağ rengi
   * @returns {THREE.Mesh} - Bağ mesh'i
   */
  function createBond(start, end, radius, color) {
    // İki nokta arasındaki mesafeyi hesapla
    const direction = new THREE.Vector3().subVectors(end, start);
    const distance = direction.length();
    
    // Silindir oluştur (yükseklik = iki atom arası mesafe)
    const bondGeometry = new THREE.CylinderGeometry(radius, radius, distance, 8, 1);
    const bondMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.2
    });
    
    // Silindir varsayılan olarak y ekseni boyunca oluşturulur, 
    // bu yüzden doğru yöne çevirmek için döndürmemiz gerekiyor
    const bond = new THREE.Mesh(bondGeometry, bondMaterial);
    
    // Silindiri merkezden başlat
    bond.position.copy(start);
    bond.position.add(direction.multiplyScalar(0.5));
    
    // Silindiri doğru yöne döndür
    const quaternion = new THREE.Quaternion();
    // Y ekseni yönünden (0,1,0) hesaplanan yöne döndür
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    bond.setRotationFromQuaternion(quaternion);
    
    return bond;
  }

  /**
   * Atom modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Atom 3D modeli
   */
  function createAtom() {
    const atomGroup = new THREE.Group();
    
    // Çekirdek (büyük bir küre olarak)
    const nucleusGeometry = new THREE.SphereGeometry(atomRadii.H * scaleFactor, 32, 32);
    const nucleusMaterial = new THREE.MeshStandardMaterial({
      color: 0xee2222,
      roughness: 0.3,
      metalness: 0.3
    });
    
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    atomGroup.add(nucleus);
    
    // Elektron bulutu gösterimi (yarı-saydam katman)
    const electronCloudGeometry = new THREE.SphereGeometry(atomRadii.H * scaleFactor * 2.5, 32, 32);
    const electronCloudMaterial = new THREE.MeshBasicMaterial({
      color: 0x2288ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    const electronCloud = new THREE.Mesh(electronCloudGeometry, electronCloudMaterial);
    atomGroup.add(electronCloud);
    
    return atomGroup;
  }

  /**
   * Su Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Su molekülü 3D modeli
   */
  function createWaterMolecule() {
    const waterGroup = new THREE.Group();
    
    // Su molekülünün atomik yapısı - birbirine temas edecek şekilde düzenlenmiş
    // O-H bağı yaklaşık 0.96 Angstrom
    const oRadius = atomRadii['O'] * scaleFactor;
    const hRadius = atomRadii['H'] * scaleFactor;
    const ohDistance = bondLengths['O-H'] * scaleFactor; // O-H bağ uzunluğu
    
    const atoms = [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: [0, ohDistance * Math.sin(104.5 * Math.PI/180), ohDistance * Math.cos(104.5 * Math.PI/180)] },
      { element: 'H', position: [0, -ohDistance * Math.sin(104.5 * Math.PI/180), ohDistance * Math.cos(104.5 * Math.PI/180)] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      waterGroup.add(sphere);
    });
    
    // O-H bağlarını ekle
    const bondRadius = 0.08;
    const bondColor = 0xCCCCCC; // Açık gri
    
    const bond1 = createBond(positions[0], positions[1], bondRadius, bondColor);
    const bond2 = createBond(positions[0], positions[2], bondRadius, bondColor);
    
    waterGroup.add(bond1);
    waterGroup.add(bond2);
    
    return waterGroup;
  }

  /**
   * Metan Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Metan molekülü 3D modeli
   */
  function createMethaneMolecule() {
    const methaneGroup = new THREE.Group();
    
    // Metan molekülünün atomik yapısı - tetrahederal yapı
    // C-H bağı yaklaşık 1.09 Angstrom
    const chDistance = bondLengths['C-H'] * scaleFactor;
    
    // Tetrahederal açılar (109.5 derece)
    const tetrahedralAngle = 109.5 * Math.PI / 180;
    const cosa = Math.cos(tetrahedralAngle);
    const sina = Math.sin(tetrahedralAngle);
    
    const atoms = [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: [0, 0, chDistance] },
      { element: 'H', position: [chDistance * sina * Math.cos(0), chDistance * sina * Math.sin(0), -chDistance * cosa] },
      { element: 'H', position: [chDistance * sina * Math.cos(2*Math.PI/3), chDistance * sina * Math.sin(2*Math.PI/3), -chDistance * cosa] },
      { element: 'H', position: [chDistance * sina * Math.cos(4*Math.PI/3), chDistance * sina * Math.sin(4*Math.PI/3), -chDistance * cosa] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      methaneGroup.add(sphere);
    });
    
    // C-H bağlarını ekle
    const bondRadius = 0.08;
    const bondColor = 0xCCCCCC; // Açık gri
    
    for (let i = 1; i < positions.length; i++) {
      const bond = createBond(positions[0], positions[i], bondRadius, bondColor);
      methaneGroup.add(bond);
    }
    
    return methaneGroup;
  }

  /**
   * Oksijen Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Oksijen molekülü 3D modeli
   */
  function createOxygenMolecule() {
    const oxygenGroup = new THREE.Group();
    
    // Oksijen molekülünün atomik yapısı O=O çift bağ, 1.21 Angstrom
    const ooDistance = bondLengths['O=O'] * scaleFactor;
    
    const atoms = [
      { element: 'O', position: [-ooDistance/2, 0, 0] },
      { element: 'O', position: [ooDistance/2, 0, 0] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      oxygenGroup.add(sphere);
    });
    
    // O=O çift bağını göster (iki silindir ile)
    const bondRadius = 0.06;
    const bondOffset = 0.08;
    const bondColor = atomColors['O']; // Oksijen rengi
    
    // Bağ yönü
    const direction = new THREE.Vector3().subVectors(positions[1], positions[0]).normalize();
    const perpendicular = new THREE.Vector3(0, 1, 0);
    if (Math.abs(direction.dot(perpendicular)) > 0.9) {
      perpendicular.set(1, 0, 0);
    }
    
    const offsetVector = new THREE.Vector3().crossVectors(direction, perpendicular).normalize().multiplyScalar(bondOffset);
    
    // İlk bağı oluştur (hafif yukarıda)
    const start1 = positions[0].clone().add(offsetVector);
    const end1 = positions[1].clone().add(offsetVector);
    const bond1 = createBond(start1, end1, bondRadius, bondColor);
    
    // İkinci bağı oluştur (hafif aşağıda)
    const start2 = positions[0].clone().sub(offsetVector);
    const end2 = positions[1].clone().sub(offsetVector);
    const bond2 = createBond(start2, end2, bondRadius, bondColor);
    
    oxygenGroup.add(bond1);
    oxygenGroup.add(bond2);
    
    return oxygenGroup;
  }

  /**
   * Karbondioksit Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Karbondioksit molekülü 3D modeli
   */
  function createCarbonDioxideMolecule() {
    const co2Group = new THREE.Group();
    
    // Karbondioksit molekülünün atomik yapısı O=C=O çift bağlar, 1.23 Angstrom
    const coDistance = bondLengths['C=O'] * scaleFactor;
    
    const atoms = [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [-coDistance, 0, 0] },
      { element: 'O', position: [coDistance, 0, 0] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      co2Group.add(sphere);
    });
    
    // C=O çift bağlarını ekle
    const bondRadius = 0.06;
    const bondOffset = 0.08;
    const bondColor = 0xCCCCCC;
    
    // Karbon -> Oksijen 1 çift bağı
    const direction1 = new THREE.Vector3().subVectors(positions[1], positions[0]).normalize();
    const perpendicular1 = new THREE.Vector3(0, 1, 0);
    const offsetVector1 = new THREE.Vector3().crossVectors(direction1, perpendicular1).normalize().multiplyScalar(bondOffset);
    
    const c_o1_bond1 = createBond(
      positions[0].clone().add(offsetVector1),
      positions[1].clone().add(offsetVector1),
      bondRadius, bondColor
    );
    const c_o1_bond2 = createBond(
      positions[0].clone().sub(offsetVector1),
      positions[1].clone().sub(offsetVector1),
      bondRadius, bondColor
    );
    
    // Karbon -> Oksijen 2 çift bağı
    const direction2 = new THREE.Vector3().subVectors(positions[2], positions[0]).normalize();
    const perpendicular2 = new THREE.Vector3(0, 1, 0);
    const offsetVector2 = new THREE.Vector3().crossVectors(direction2, perpendicular2).normalize().multiplyScalar(bondOffset);
    
    const c_o2_bond1 = createBond(
      positions[0].clone().add(offsetVector2),
      positions[2].clone().add(offsetVector2),
      bondRadius, bondColor
    );
    const c_o2_bond2 = createBond(
      positions[0].clone().sub(offsetVector2),
      positions[2].clone().sub(offsetVector2),
      bondRadius, bondColor
    );
    
    co2Group.add(c_o1_bond1);
    co2Group.add(c_o1_bond2);
    co2Group.add(c_o2_bond1);
    co2Group.add(c_o2_bond2);
    
    return co2Group;
  }
  
  /**
   * Amonyak Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Amonyak molekülü 3D modeli
   */
  function createAmmoniaMolecule() {
    const ammoniaGroup = new THREE.Group();
    
    // Amonyak molekülünün atomik yapısı (NH3) - piramit şekli
    // N-H bağı yaklaşık 1.01 Angstrom
    const nhDistance = bondLengths['N-H'] * scaleFactor;
    
    // Yaklaşık 107 derece açı (tetrahedral 109.5'ten biraz küçük)
    const angle = 107 * Math.PI / 180;
    
    const atoms = [
      { element: 'N', position: [0, 0, 0] },
      { element: 'H', position: [0, -nhDistance * Math.sin(angle), -nhDistance * Math.cos(angle)] },
      { element: 'H', position: [nhDistance * Math.sin(angle) * Math.cos(120 * Math.PI/180), 
                              -nhDistance * Math.sin(angle) * Math.sin(120 * Math.PI/180), 
                              -nhDistance * Math.cos(angle)] },
      { element: 'H', position: [nhDistance * Math.sin(angle) * Math.cos(240 * Math.PI/180), 
                              -nhDistance * Math.sin(angle) * Math.sin(240 * Math.PI/180), 
                              -nhDistance * Math.cos(angle)] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      ammoniaGroup.add(sphere);
    });
    
    // N-H bağlarını ekle
    const bondRadius = 0.08;
    const bondColor = 0xCCCCCC; // Açık gri
    
    for (let i = 1; i < positions.length; i++) {
      const bond = createBond(positions[0], positions[i], bondRadius, bondColor);
      ammoniaGroup.add(bond);
    }
    
    return ammoniaGroup;
  }
  
  /**
   * Etanol Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Etanol molekülü 3D modeli
   */
  function createEthanolMolecule() {
    const ethanolGroup = new THREE.Group();
    
    // Etanol molekülünün atomik yapısı (C2H5OH)
    // Bağ uzunlukları
    const ccDistance = bondLengths['C-C'] * scaleFactor;
    const chDistance = bondLengths['C-H'] * scaleFactor;
    const coDistance = bondLengths['C-O'] * scaleFactor;
    const ohDistance = bondLengths['O-H'] * scaleFactor;
    
    // Atomları konumlandır - C-C-O ana omurga
    const atoms = [
      // C1 karbon atomu
      { element: 'C', position: [0, 0, 0] },
      // C2 karbon atomu
      { element: 'C', position: [ccDistance, 0, 0] },
      // O oksijen atomu
      { element: 'O', position: [ccDistance + coDistance * Math.cos(109.5 * Math.PI/180), 
                               coDistance * Math.sin(109.5 * Math.PI/180), 0] },
      // C1'e bağlı H atomları
      { element: 'H', position: [-chDistance * Math.cos(109.5 * Math.PI/180), 
                               chDistance * Math.sin(109.5 * Math.PI/180), 0] },
      { element: 'H', position: [-chDistance * Math.cos(109.5 * Math.PI/180) * Math.cos(120 * Math.PI/180), 
                               chDistance * Math.sin(109.5 * Math.PI/180), 
                               -chDistance * Math.cos(109.5 * Math.PI/180) * Math.sin(120 * Math.PI/180)] },
      { element: 'H', position: [-chDistance * Math.cos(109.5 * Math.PI/180) * Math.cos(240 * Math.PI/180), 
                               chDistance * Math.sin(109.5 * Math.PI/180), 
                               -chDistance * Math.cos(109.5 * Math.PI/180) * Math.sin(240 * Math.PI/180)] },
      // C2'ye bağlı H atomları
      { element: 'H', position: [ccDistance + chDistance * Math.cos(109.5 * Math.PI/180) * Math.cos(120 * Math.PI/180), 
                               -chDistance * Math.sin(109.5 * Math.PI/180), 
                               chDistance * Math.cos(109.5 * Math.PI/180) * Math.sin(120 * Math.PI/180)] },
      { element: 'H', position: [ccDistance + chDistance * Math.cos(109.5 * Math.PI/180) * Math.cos(240 * Math.PI/180), 
                               -chDistance * Math.sin(109.5 * Math.PI/180), 
                               chDistance * Math.cos(109.5 * Math.PI/180) * Math.sin(240 * Math.PI/180)] },
      // O'ya bağlı H atomu
      { element: 'H', position: [ccDistance + coDistance * Math.cos(109.5 * Math.PI/180) + ohDistance * Math.cos(109.5 * Math.PI/180), 
                               coDistance * Math.sin(109.5 * Math.PI/180) + ohDistance * Math.sin(109.5 * Math.PI/180), 0] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      ethanolGroup.add(sphere);
    });
    
    // Bağları ekle
    const bondRadius = 0.08;
    const bondColor = 0xCCCCCC; // Açık gri
    
    // C-C bağı
    ethanolGroup.add(createBond(positions[0], positions[1], bondRadius, bondColor));
    
    // C-O bağı
    ethanolGroup.add(createBond(positions[1], positions[2], bondRadius, bondColor));
    
    // O-H bağı
    ethanolGroup.add(createBond(positions[2], positions[8], bondRadius, bondColor));
    
    // C1-H bağları
    for (let i = 3; i <= 5; i++) {
      ethanolGroup.add(createBond(positions[0], positions[i], bondRadius, bondColor));
    }
    
    // C2-H bağları
    for (let i = 6; i <= 7; i++) {
      ethanolGroup.add(createBond(positions[1], positions[i], bondRadius, bondColor));
    }
    
    return ethanolGroup;
  }

  /**
   * Benzen Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Benzen molekülü 3D modeli
   */
  function createBenzeneMolecule() {
    const benzeneGroup = new THREE.Group();
    
    // Benzen halka yarıçapı (C-C bağlarının bir kısmı çift bağ, ortalama 1.4 Angstrom)
    const ringRadius = 1.4 * scaleFactor;
    const chDistance = bondLengths['C-H'] * scaleFactor;
    
    const atoms = [];
    const carbonPositions = [];
    const hydrogenPositions = [];
    
    // 6 Karbon atomu
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = ringRadius * Math.cos(angle);
      const z = ringRadius * Math.sin(angle);
      
      carbonPositions.push([x, 0, z]);
      atoms.push({ element: 'C', position: [x, 0, z] });
      
      // Her karbon için bir hidrojen
      const hx = x + Math.cos(angle) * chDistance;
      const hz = z + Math.sin(angle) * chDistance;
      hydrogenPositions.push([hx, 0, hz]);
      atoms.push({ element: 'H', position: [hx, 0, hz] });
    }
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      benzeneGroup.add(sphere);
    });
    
    // C-C bağlarını ekle (halka)
    const bondRadius = 0.07;
    const ccBondColor = 0xCC88CC; // Pembe-gri (rezonans gösterimi için)
    
    for (let i = 0; i < 6; i++) {
      const c1 = positions[i*2]; // Karbon atomları çift indekslerde
      const c2 = positions[((i+1)%6)*2]; // Sonraki karbon atomu (son karbon ilk karbonla bağlanmalı)
      benzeneGroup.add(createBond(c1, c2, bondRadius, ccBondColor));
    }
    
    // C-H bağlarını ekle
    const chBondColor = 0xCCCCCC; // Açık gri
    
    for (let i = 0; i < 6; i++) {
      const c = positions[i*2]; // Karbon atomları
      const h = positions[i*2 + 1]; // Hidrojen atomları
      benzeneGroup.add(createBond(c, h, bondRadius * 0.8, chBondColor));
    }
    
    // Rezonans halkasını göstermek için iç halka ekle (zayıf, saydam)
    const innerRingGeometry = new THREE.TorusGeometry(ringRadius * 0.7, bondRadius * 0.5, 16, 32);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xCC88CC,
      transparent: true,
      opacity: 0.5
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.x = Math.PI / 2; // Yatay konumlandır
    benzeneGroup.add(innerRing);
    
    return benzeneGroup;
  }
  
  /**
   * Glikoz Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Glikoz molekülü 3D modeli
   */
  function createGlucoseMolecule() {
    const glucoseGroup = new THREE.Group();
    
    // Glikoz molekülünün basitleştirilmiş atomik yapısı
    // Gerçek glikoz daha karmaşık olduğundan, basitleştirilmiş bir model kullanıyoruz
    const atoms = [
      // Halka yapısı
      { element: 'C', position: [0, 0, 0] },
      { element: 'C', position: [1.0, 0.5, 0] },
      { element: 'C', position: [1.0, 1.5, 0.5] },
      { element: 'C', position: [0, 2.0, 0.5] },
      { element: 'C', position: [-1.0, 1.5, 0] },
      { element: 'C', position: [-1.0, 0.5, -0.5] },
      
      // Oksijen atomları
      { element: 'O', position: [0, -1.0, 0.5] },
      { element: 'O', position: [2.0, 0, 0] },
      { element: 'O', position: [1.5, 2.0, 0] },
      { element: 'O', position: [0, 3.0, 0] },
      { element: 'O', position: [-2.0, 2.0, 0] },
      
      // Hidrojen atomları (sadece birkaçı gösteriliyor)
      { element: 'H', position: [0, -1.5, 0] },
      { element: 'H', position: [2.0, -0.5, 0.5] },
      { element: 'H', position: [2.0, 2.0, 0.5] },
      { element: 'H', position: [0, 3.0, -0.5] },
      { element: 'H', position: [-2.0, 2.5, 0.5] }
    ];
    
    // Atomları ekle
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor * 0.7; // Biraz daha küçük yap
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      glucoseGroup.add(sphere);
    });
    
    return glucoseGroup;
  }
  
  /**
   * NaCl (Tuz) Kristali modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Sodyum klorür kristali 3D modeli
   */
  function createSaltCrystal() {
    const saltGroup = new THREE.Group();
    
    // Basit bir sodyum klorür kristal yapısı
    const gridSize = 2; // 2x2x2 kristal
    // Na-Cl iyonik bağ uzunluğu kullan
    const spacing = bondLengths['Na-Cl'] * scaleFactor * 0.9; // Biraz çakışsın
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // Sodyum ve klor atomlarını şekerli bir düzende yerleştir
          const element = (x + y + z) % 2 === 0 ? 'Na' : 'Cl';
          const radius = atomRadii[element] * scaleFactor;
          
          const geometry = new THREE.SphereGeometry(radius, 32, 32);
          const material = new THREE.MeshStandardMaterial({
            color: atomColors[element],
            roughness: 0.4,
            metalness: 0.2
          });
          
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(
            (x - (gridSize - 1) / 2) * spacing,
            (y - (gridSize - 1) / 2) * spacing,
            (z - (gridSize - 1) / 2) * spacing
          );
          
          saltGroup.add(sphere);
        }
      }
    }
    
    // Kristal yapıyı göstermek için bağlar ekle
    const bondRadius = 0.05;
    const bondColor = 0xCCCCCC; // Açık gri
    
    // Komşu atomlar arasına bağ çizgileri ekle
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const position = new THREE.Vector3(
            (x - (gridSize - 1) / 2) * spacing,
            (y - (gridSize - 1) / 2) * spacing,
            (z - (gridSize - 1) / 2) * spacing
          );
          
          // Sağa, yukarı ve öne doğru bağ çizgileri ekle
          if (x < gridSize - 1) {
            const nextPos = new THREE.Vector3(
              ((x + 1) - (gridSize - 1) / 2) * spacing,
              (y - (gridSize - 1) / 2) * spacing,
              (z - (gridSize - 1) / 2) * spacing
            );
            saltGroup.add(createBond(position, nextPos, bondRadius, bondColor));
          }
          
          if (y < gridSize - 1) {
            const nextPos = new THREE.Vector3(
              (x - (gridSize - 1) / 2) * spacing,
              ((y + 1) - (gridSize - 1) / 2) * spacing,
              (z - (gridSize - 1) / 2) * spacing
            );
            saltGroup.add(createBond(position, nextPos, bondRadius, bondColor));
          }
          
          if (z < gridSize - 1) {
            const nextPos = new THREE.Vector3(
              (x - (gridSize - 1) / 2) * spacing,
              (y - (gridSize - 1) / 2) * spacing,
              ((z + 1) - (gridSize - 1) / 2) * spacing
            );
            saltGroup.add(createBond(position, nextPos, bondRadius, bondColor));
          }
        }
      }
    }
    
    return saltGroup;
  }
  
  /**
   * Sülfürik Asit Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Sülfürik asit molekülü 3D modeli
   */
  function createSulfuricAcidMolecule() {
    const sulfuricAcidGroup = new THREE.Group();
    
    // Sülfürik asit molekülünün atomik yapısı (H2SO4)
    // Bağ uzunlukları
    const soDistance = bondLengths['S-O'] * scaleFactor; // S-O bağı
    const sDoubleODistance = bondLengths['S=O'] * scaleFactor * 0.95; // S=O çift bağı biraz daha kısa
    const ohDistance = bondLengths['O-H'] * scaleFactor; // O-H bağı
    
    // Tetrahederal yapı (109.5 derece açılar)
    const tetrahedralAngle = 109.5 * Math.PI / 180;
    
    const atoms = [
      // Kükürt merkez atom
      { element: 'S', position: [0, 0, 0] },
      
      // Çift bağlı oksijen atomları (S=O)
      { element: 'O', position: [0, sDoubleODistance, 0] },
      { element: 'O', position: [0, -sDoubleODistance, 0] },
      
      // Tek bağlı oksijen atomları (S-O)
      { element: 'O', position: [soDistance * Math.sin(tetrahedralAngle), 0, soDistance * Math.cos(tetrahedralAngle)] },
      { element: 'O', position: [-soDistance * Math.sin(tetrahedralAngle), 0, soDistance * Math.cos(tetrahedralAngle)] },
      
      // Hidrojen atomları (O-H)
      { element: 'H', position: [
        soDistance * Math.sin(tetrahedralAngle) + ohDistance * Math.sin(tetrahedralAngle), 
        ohDistance * Math.cos(tetrahedralAngle), 
        soDistance * Math.cos(tetrahedralAngle)
      ] },
      { element: 'H', position: [
        -soDistance * Math.sin(tetrahedralAngle) - ohDistance * Math.sin(tetrahedralAngle), 
        ohDistance * Math.cos(tetrahedralAngle), 
        soDistance * Math.cos(tetrahedralAngle)
      ] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      sulfuricAcidGroup.add(sphere);
    });
    
    // Bağları ekle
    const soBondRadius = 0.08;
    const sDoubleBondRadius = 0.06;
    const ohBondRadius = 0.06;
    const bondColor = 0xCCCCCC; // Açık gri
    const doubleBondOffset = 0.07;
    
    // S=O çift bağları (1 ve 2 nolu oksijen atomları)
    for (let i = 1; i <= 2; i++) {
      // S=O çift bağı için iki silindir ekle
      const direction = new THREE.Vector3().subVectors(positions[i], positions[0]).normalize();
      const perpendicular = new THREE.Vector3(1, 0, 0);
      if (Math.abs(direction.dot(perpendicular)) > 0.9) {
        perpendicular.set(0, 0, 1);
      }
      
      const offsetVector = new THREE.Vector3().crossVectors(direction, perpendicular).normalize().multiplyScalar(doubleBondOffset);
      
      sulfuricAcidGroup.add(createBond(
        positions[0].clone().add(offsetVector),
        positions[i].clone().add(offsetVector),
        sDoubleBondRadius, bondColor
      ));
      
      sulfuricAcidGroup.add(createBond(
        positions[0].clone().sub(offsetVector),
        positions[i].clone().sub(offsetVector),
        sDoubleBondRadius, bondColor
      ));
    }
    
    // S-O tek bağlar (3 ve 4 nolu oksijen atomları)
    for (let i = 3; i <= 4; i++) {
      sulfuricAcidGroup.add(createBond(positions[0], positions[i], soBondRadius, bondColor));
    }
    
    // O-H bağları
    sulfuricAcidGroup.add(createBond(positions[3], positions[5], ohBondRadius, bondColor));
    sulfuricAcidGroup.add(createBond(positions[4], positions[6], ohBondRadius, bondColor));
    
    return sulfuricAcidGroup;
  }
  
  /**
   * Ozon Molekülü modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Ozon molekülü 3D modeli
   */
  function createOzoneMolecule() {
    const ozoneGroup = new THREE.Group();
    
    // Ozon molekülünün atomik yapısı (O3) - açısal yapı
    // O-O bağları yaklaşık 1.28 Angstrom (O=O ve O-O arası)
    const ooDistance = 1.28 * scaleFactor;
    // Açı yaklaşık 116.8 derece
    const angle = 116.8 * Math.PI / 180;
    
    const atoms = [
      { element: 'O', position: [0, 0, 0] },
      { element: 'O', position: [ooDistance, 0, 0] },
      { element: 'O', position: [ooDistance * Math.cos(angle), ooDistance * Math.sin(angle), 0] }
    ];
    
    // Atomları ekle
    const positions = [];
    atoms.forEach(atom => {
      const radius = atomRadii[atom.element] * scaleFactor;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: atomColors[atom.element],
        roughness: 0.4,
        metalness: 0.2
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(...atom.position);
      positions.push(sphere.position);
      ozoneGroup.add(sphere);
    });
    
    // O-O bağlarını ekle (ikisi de kısmi çift bağ)
    const bondRadius = 0.07;
    const bondOffset = 0.07;
    const bondColor = atomColors['O']; // Oksijen rengi
    
    // İlk O-O bağı (rezonans ile kısmi çift bağ)
    const direction1 = new THREE.Vector3().subVectors(positions[1], positions[0]).normalize();
    const perpendicular1 = new THREE.Vector3(0, 0, 1);
    const offsetVector1 = new THREE.Vector3().crossVectors(direction1, perpendicular1).normalize().multiplyScalar(bondOffset);
    
    ozoneGroup.add(createBond(positions[0], positions[1], bondRadius, bondColor));
    ozoneGroup.add(createBond(
      positions[0].clone().add(offsetVector1),
      positions[1].clone().add(offsetVector1),
      bondRadius * 0.6, bondColor
    ));
    
    // İkinci O-O bağı (rezonans ile kısmi çift bağ)
    const direction2 = new THREE.Vector3().subVectors(positions[2], positions[0]).normalize();
    const perpendicular2 = new THREE.Vector3(0, 0, 1);
    const offsetVector2 = new THREE.Vector3().crossVectors(direction2, perpendicular2).normalize().multiplyScalar(bondOffset);
    
    ozoneGroup.add(createBond(positions[0], positions[2], bondRadius, bondColor));
    ozoneGroup.add(createBond(
      positions[0].clone().add(offsetVector2),
      positions[2].clone().add(offsetVector2),
      bondRadius * 0.6, bondColor
    ));
    
    return ozoneGroup;
  }

  /**
   * Kristal Yapı modeli oluşturur (Uzay-Doldurma Modeli)
   * @returns {THREE.Group} Kristal yapı 3D modeli
   */
  function createCrystalStructure() {
    const crystalGroup = new THREE.Group();
    
    // Atomlar arası mesafe - daha kısa aralıklar kullanarak temas etmelerini sağla
    const spacing = 0.5;
    const size = 3; // 3x3x3 birim hücre
    
    // İki farklı atom türü için materyaller
    const atom1Material = new THREE.MeshStandardMaterial({
      color: 0x8822FF, // Mor
      roughness: 0.3,
      metalness: 0.5
    });
    
    const atom2Material = new THREE.MeshStandardMaterial({
      color: 0x22AAFF, // Mavi
      roughness: 0.3,
      metalness: 0.5
    });
    
    // Atom pozisyonlarını saklamak için dizi
    const atomPositions = [];
    
    // Kristal kafes yapısı oluştur
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          // Atom pozisyonu
          const posX = (x - (size-1)/2) * spacing;
          const posY = (y - (size-1)/2) * spacing;
          const posZ = (z - (size-1)/2) * spacing;
          
          // Atom türü değişimi için şablon
          const atomType = (x + y + z) % 2;
          const material = atomType === 0 ? atom1Material : atom2Material;
          
          // Atomu yerleştir - uzay-doldurma modelinde atomlar daha büyük
          // Atomların biraz temas etmesi için yarıçapı artır
          const atomGeometry = new THREE.SphereGeometry(spacing * 0.45, 24, 24);
          const atom = new THREE.Mesh(atomGeometry, material);
          atom.position.set(posX, posY, posZ);
          crystalGroup.add(atom);
          
          // Atom pozisyonunu kaydet
          atomPositions.push({
            position: new THREE.Vector3(posX, posY, posZ),
            type: atomType
          });
        }
      }
    }
    
    // Bağları ekle
    const bondRadius = 0.05;
    const bondColor = 0xCCCCCC; // Açık gri
    
    // Komşu atomlar arasına bağlar ekle
    for (let i = 0; i < atomPositions.length; i++) {
      const atom1 = atomPositions[i];
      
      // Yakındaki atomları bul ve bağ oluştur
      for (let j = i + 1; j < atomPositions.length; j++) {
        const atom2 = atomPositions[j];
        
        // İki atom arasındaki mesafeyi hesapla
        const distance = atom1.position.distanceTo(atom2.position);
        
        // Yan yana atomlar arası mesafe yaklaşık spacing kadar olmalı
        // ve sadece farklı türdeki atomlar arasında bağ olmalı
        if (distance <= spacing * 1.1 && atom1.type !== atom2.type) {
          const bond = createBond(atom1.position, atom2.position, bondRadius, bondColor);
          crystalGroup.add(bond);
        }
      }
    }
    
    return crystalGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'chemistry',
    name: 'Kimya'
  };

  return {
    models: chemistryElements,
    category,
    createAtom,
    createWaterMolecule,
    createMethaneMolecule,
    createOxygenMolecule,
    createCarbonDioxideMolecule,
    createAmmoniaMolecule,
    createEthanolMolecule, 
    createBenzeneMolecule,
    createGlucoseMolecule,
    createSaltCrystal,
    createSulfuricAcidMolecule,
    createOzoneMolecule,
    createCrystalStructure
  };
} 