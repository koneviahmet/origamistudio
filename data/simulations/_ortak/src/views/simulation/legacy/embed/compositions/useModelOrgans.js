import * as THREE from 'three';
import { rng, tubeFromPoints } from './modelBuilderHelpers.js';

/**
 * Organ modellerini oluşturan ve yöneten modül
 * @returns {Object} Organ modelleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelOrgans() {
  // Organ modelleri koleksiyonu
  const organs = [
    { id: 'heart', name: 'Kalp', create: createHeart },
    { id: 'brain', name: 'Beyin', create: createBrain },
    { id: 'lungs', name: 'Akciğer', create: createLungs },
  ];

  /**
   * Kalp modeli oluşturur
   * @returns {THREE.Group} Kalp 3D modeli
   */
  function createHeart() {
    const heartGroup = new THREE.Group();
    
    // İki yarım-küre oluştur ve kalbin yarı loblarını oluşturmak için yerleştir
    const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const heartMaterial = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); // Kırmızı
    
    const leftLobe = new THREE.Mesh(sphereGeometry, heartMaterial);
    leftLobe.position.set(-0.2, 0, 0);
    heartGroup.add(leftLobe);
    
    const rightLobe = new THREE.Mesh(sphereGeometry, heartMaterial);
    rightLobe.position.set(0.2, 0, 0);
    heartGroup.add(rightLobe);
    
    // Alt kısımda daha sivri bir şekil için koni ekle
    const coneGeometry = new THREE.ConeGeometry(0.5, 0.8, 32);
    const cone = new THREE.Mesh(coneGeometry, heartMaterial);
    cone.position.set(0, -0.5, 0);
    cone.rotation.z = Math.PI; // Koniyi ters çevir
    heartGroup.add(cone);
    
    // Üst tarafta ana damarları temsil edecek silindirler
    const arteryGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
    const arteryMaterial = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
    
    const leftArtery = new THREE.Mesh(arteryGeometry, arteryMaterial);
    leftArtery.position.set(-0.15, 0.5, 0);
    leftArtery.rotation.z = -Math.PI / 6;
    heartGroup.add(leftArtery);
    
    const rightArtery = new THREE.Mesh(arteryGeometry, arteryMaterial);
    rightArtery.position.set(0.15, 0.5, 0);
    rightArtery.rotation.z = Math.PI / 6;
    heartGroup.add(rightArtery);
    
    // Kalbin yüzeyinde damarları temsil etmek için eğriler
    const addVein = (points) => {
      heartGroup.add(tubeFromPoints(points, 0.012, 0x374151));
    };

    addVein([
      new THREE.Vector3(-0.3, 0.2, 0.38),
      new THREE.Vector3(-0.1, -0.1, 0.4),
      new THREE.Vector3(0, -0.4, 0.35)
    ]);
    
    addVein([
      new THREE.Vector3(0.3, 0.2, 0.38),
      new THREE.Vector3(0.1, -0.1, 0.4),
      new THREE.Vector3(0, -0.4, 0.35)
    ]);
    
    addVein([
      new THREE.Vector3(0, 0.3, -0.38),
      new THREE.Vector3(0, 0, -0.4),
      new THREE.Vector3(0, -0.3, -0.38)
    ]);
    
    return heartGroup;
  }

  /**
   * Beyin modeli oluşturur
   * @returns {THREE.Group} Beyin 3D modeli
   */
  function createBrain() {
    const brainGroup = new THREE.Group();
    
    // Beyin yarım kürelerini oluştur
    const hemisphereGeometry = new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI, 0, Math.PI);
    const brainMaterial = new THREE.MeshStandardMaterial({ color: 0xfda4af }); // Pembe
    
    // Sol yarım küre
    const leftHemisphere = new THREE.Mesh(hemisphereGeometry, brainMaterial);
    leftHemisphere.position.set(-0.1, 0, 0);
    leftHemisphere.rotation.y = -Math.PI / 2;
    brainGroup.add(leftHemisphere);
    
    // Sağ yarım küre
    const rightHemisphere = new THREE.Mesh(hemisphereGeometry, brainMaterial);
    rightHemisphere.position.set(0.1, 0, 0);
    rightHemisphere.rotation.y = Math.PI / 2;
    brainGroup.add(rightHemisphere);
    
    // Beyinin kıvrımlarını temsil etmek için torus parçaları
    const gyrusGeometry = new THREE.TorusGeometry(0.08, 0.04, 8, 12, Math.PI);
    const gyrusMaterial = new THREE.MeshStandardMaterial({ color: 0xf87171 }); // Açık kırmızı
    
    // Sol yarım küreye kıvrımlar ekle
    for (let i = 0; i < 10; i++) {
      const gyrus = new THREE.Mesh(gyrusGeometry, gyrusMaterial);
      const theta = rng('brain-left', i * 2) * Math.PI;
      const phi = rng('brain-left', i * 2 + 1) * Math.PI - Math.PI / 2;
      const radius = 0.45;
      
      gyrus.position.x = -0.1 + radius * Math.cos(phi) * Math.cos(theta);
      gyrus.position.y = radius * Math.sin(phi);
      gyrus.position.z = radius * Math.cos(phi) * Math.sin(theta);
      
      gyrus.lookAt(-0.1, 0, 0);
      gyrus.rotateX(rng('brain-left', i * 2 + 50) * Math.PI);
      
      brainGroup.add(gyrus);
    }
    
    // Sağ yarım küreye kıvrımlar ekle
    for (let i = 0; i < 10; i++) {
      const gyrus = new THREE.Mesh(gyrusGeometry, gyrusMaterial);
      const theta = rng('brain-right', i * 2) * Math.PI;
      const phi = rng('brain-right', i * 2 + 1) * Math.PI - Math.PI / 2;
      const radius = 0.45;
      
      gyrus.position.x = 0.1 + radius * Math.cos(phi) * Math.cos(theta);
      gyrus.position.y = radius * Math.sin(phi);
      gyrus.position.z = radius * Math.cos(phi) * Math.sin(theta);
      
      gyrus.lookAt(0.1, 0, 0);
      gyrus.rotateX(rng('brain-right', i * 2 + 50) * Math.PI);
      
      brainGroup.add(gyrus);
    }
    
    // Beyin sapı
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.4, 16);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xfecdd3 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, -0.5, 0);
    brainGroup.add(stem);
    
    return brainGroup;
  }

  /**
   * Akciğer modeli oluşturur
   * @returns {THREE.Group} Akciğer 3D modeli
   */
  function createLungs() {
    const lungsGroup = new THREE.Group();
    
    // Akciğerlerin ana yapısı için oval geometriler
    const lungGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    lungGeometry.scale(0.7, 1, 0.6);
    const lungMaterial = new THREE.MeshStandardMaterial({ color: 0xf87171 }); // Açık kırmızı
    
    // Sol akciğer
    const leftLung = new THREE.Mesh(lungGeometry, lungMaterial);
    leftLung.position.set(-0.4, 0, 0);
    lungsGroup.add(leftLung);
    
    // Sağ akciğer
    const rightLung = new THREE.Mesh(lungGeometry, lungMaterial);
    rightLung.position.set(0.4, 0, 0);
    lungsGroup.add(rightLung);
    
    // Nefes borusu
    const tracheaGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
    const tracheaMaterial = new THREE.MeshStandardMaterial({ color: 0xfecdd3 });
    const trachea = new THREE.Mesh(tracheaGeometry, tracheaMaterial);
    trachea.position.set(0, 0.5, 0);
    lungsGroup.add(trachea);
    
    // Bronşları temsil eden iki dallanma
    const bronchusGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 16);
    
    const leftBronchus = new THREE.Mesh(bronchusGeometry, tracheaMaterial);
    leftBronchus.position.set(-0.2, 0.25, 0);
    leftBronchus.rotation.z = Math.PI / 4;
    lungsGroup.add(leftBronchus);
    
    const rightBronchus = new THREE.Mesh(bronchusGeometry, tracheaMaterial);
    rightBronchus.position.set(0.2, 0.25, 0);
    rightBronchus.rotation.z = -Math.PI / 4;
    lungsGroup.add(rightBronchus);
    
    return lungsGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'organ',
    name: 'Organlar'
  };

  return {
    models: organs,
    category,
    createHeart,
    createBrain,
    createLungs
  };
} 