import * as THREE from 'three';
import { rng, tubeFromPoints } from './modelBuilderHelpers.js';

/**
 * Meyve modellerini oluşturan ve yöneten modül
 * @returns {Object} Meyve modelleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelFruits() {
  // Meyve modelleri koleksiyonu
  const fruits = [
    { id: 'apple', name: 'Elma', create: createApple },
    { id: 'banana', name: 'Muz', create: createBanana },
    { id: 'orange', name: 'Portakal', create: createOrange },
    { id: 'grapes', name: 'Üzüm', create: createGrapes },
    { id: 'strawberry', name: 'Çilek', create: createStrawberry },
    { id: 'watermelon', name: 'Karpuz', create: createWatermelon },
    { id: 'pineapple', name: 'Ananas', create: createPineapple },
    { id: 'pear', name: 'Armut', create: createPear },
    { id: 'cherry', name: 'Kiraz', create: createCherry }
  ];

  /**
   * Elma modeli oluşturur
   * @returns {THREE.Group} Elma 3D modeli
   */
  function createApple() {
    // Elma için küre kullanıyoruz
    const geometry = new THREE.SphereGeometry(0.7, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xe11d48 }); // Kırmızı
    const apple = new THREE.Mesh(geometry, material);
    
    // Elma sapı
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x78350f }); // Kahverengi
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, 0.8, 0);
    
    // Elma grubu
    const group = new THREE.Group();
    group.add(apple);
    group.add(stem);
    
    return group;
  }

  /**
   * Muz modeli oluşturur
   * @returns {THREE.Group} Muz 3D modeli
   */
  function createBanana() {
    // Daha iyi bir muz için tamamen yeniden tasarlayalım
    const bananaGroup = new THREE.Group();
    
    // Ana muz gövdesi - daha güzel bir eğri
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(0, -0.2, 0.3),
      new THREE.Vector3(0, 0.2, 0.5),
      new THREE.Vector3(0, 0.6, 0.3),
      new THREE.Vector3(0, 0.8, 0),
    ]);
    
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.15, 16, false);
    const material = new THREE.MeshStandardMaterial({ color: 0xfacc15 }); // Sarı
    const banana = new THREE.Mesh(tubeGeometry, material);
    bananaGroup.add(banana);
    
    // Muzun her iki ucuna küçük detaylar ekleyelim
    const tipGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const tipMaterial = new THREE.MeshStandardMaterial({ color: 0x78350f }); // Kahverengi
    
    // Alt uç
    const bottomTip = new THREE.Mesh(tipGeometry, tipMaterial);
    bottomTip.position.set(0, -0.5, 0);
    bananaGroup.add(bottomTip);
    
    // Üst uç - ince detay
    const topTipGeometry = new THREE.ConeGeometry(0.05, 0.1, 8);
    const topTip = new THREE.Mesh(topTipGeometry, tipMaterial);
    topTip.position.set(0, 0.85, 0);
    topTip.rotation.x = Math.PI;
    bananaGroup.add(topTip);
    
    return bananaGroup;
  }

  /**
   * Portakal modeli oluşturur
   * @returns {THREE.Group} Portakal 3D modeli
   */
  function createOrange() {
    // Portakal için küre kullanıyoruz
    const geometry = new THREE.SphereGeometry(0.7, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xf97316 }); // Turuncu
    
    // Portakal yüzeyine doku ekleyelim
    const orange = new THREE.Mesh(geometry, material);
    
    // Portakal sapı
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x65a30d }); // Yeşil
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, 0.8, 0);
    
    // Portakal grubu
    const group = new THREE.Group();
    group.add(orange);
    group.add(stem);
    
    return group;
  }

  /**
   * Üzüm modeli oluşturur
   * @returns {THREE.Group} Üzüm 3D modeli
   */
  function createGrapes() {
    const grapesGroup = new THREE.Group();
    
    // Üzüm salkımı için bir dizi küçük küre
    const grapeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const grapeMaterial = new THREE.MeshStandardMaterial({ color: 0x7e22ce }); // Mor
    
    // Üzüm taneleri için konumlar
    const positions = [
      [0, 0, 0], [0.3, 0, 0], [-0.3, 0, 0], [0.15, 0, 0.25], [-0.15, 0, 0.25],
      [0, 0, -0.3], [0.3, 0, -0.3], [-0.3, 0, -0.3],
      [0, 0.3, 0], [0.3, 0.3, 0], [-0.3, 0.3, 0], [0.15, 0.3, 0.25], [-0.15, 0.3, 0.25],
      [0, 0.6, 0], [0.2, 0.6, 0], [-0.2, 0.6, 0]
    ];
    
    positions.forEach(pos => {
      const grape = new THREE.Mesh(grapeGeometry, grapeMaterial);
      grape.position.set(pos[0], pos[1], pos[2]);
      grapesGroup.add(grape);
    });
    
    // Sap
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x65a30d }); // Yeşil
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, 0.9, 0);
    grapesGroup.add(stem);
    
    return grapesGroup;
  }

  /**
   * Çilek modeli oluşturur
   * @returns {THREE.Group} Çilek 3D modeli
   */
  function createStrawberry() {
    const strawberryGroup = new THREE.Group();
    
    // Çilek ana gövdesi
    const geometry = new THREE.ConeGeometry(0.5, 0.9, 32);
    geometry.scale(1, 1, 0.8); // Biraz yassılaştır
    const material = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); // Kırmızı
    const body = new THREE.Mesh(geometry, material);
    body.rotation.x = Math.PI; // Koniyi ters çevir
    strawberryGroup.add(body);
    
    // Çilek tohumları
    const seedGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const seedMaterial = new THREE.MeshStandardMaterial({ color: 0xfef3c7 }); // Açık sarı
    
    for (let i = 0; i < 20; i++) {
      const seed = new THREE.Mesh(seedGeometry, seedMaterial);
      const theta = rng('strawberry', i * 2) * Math.PI * 2;
      const phi = rng('strawberry', i * 2 + 1) * Math.PI / 2 + Math.PI / 4;
      const radius = 0.5;
      
      seed.position.x = radius * Math.sin(phi) * Math.cos(theta);
      seed.position.y = -radius * Math.cos(phi) * 0.9;
      seed.position.z = radius * Math.sin(phi) * Math.sin(theta);
      
      strawberryGroup.add(seed);
    }
    
    // Çilek yaprağı
    const leafGeometry = new THREE.CircleGeometry(0.25, 5);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x16a34a, 
      side: THREE.DoubleSide 
    });
    
    // Yapraklar
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = 0.5;
      leaf.rotation.x = -Math.PI / 2;
      leaf.rotation.z = (i / 5) * Math.PI * 2;
      strawberryGroup.add(leaf);
    }
    
    return strawberryGroup;
  }

  /**
   * Karpuz modeli oluşturur
   * @returns {THREE.Group} Karpuz 3D modeli
   */
  function createWatermelon() {
    const watermelonGroup = new THREE.Group();
    
    // Karpuz dilimi için daha iyi bir geometri
    // Yarım küresel dilim şeklinde oluşturalım
    const geometry = new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI, 0, Math.PI/2);
    
    // Karpuzun iç kısmı
    const material = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); // Kırmızı iç
    const body = new THREE.Mesh(geometry, material);
    
    // Karpuzun kabuğu
    const rindGeometry = new THREE.SphereGeometry(0.85, 32, 32, 0, Math.PI, 0, Math.PI/2);
    const rindMaterial = new THREE.MeshStandardMaterial({ color: 0x166534 }); // Koyu yeşil
    const rind = new THREE.Mesh(rindGeometry, rindMaterial);
    
    // İç kısım ve kabuk arasındaki geçiş bölgesi
    const transitionGeometry = new THREE.SphereGeometry(0.83, 32, 32, 0, Math.PI, 0, Math.PI/2);
    const transitionMaterial = new THREE.MeshStandardMaterial({ color: 0x84cc16 }); // Açık yeşil
    const transition = new THREE.Mesh(transitionGeometry, transitionMaterial);
    
    // Karpuz çekirdekleri
    const seeds = [];
    for (let i = 0; i < 20; i++) {
      const seedGeometry = new THREE.EllipseCurve(0, 0, 0.05, 0.1, 0, 2 * Math.PI);
      const seedShape = new THREE.Shape(seedGeometry.getPoints(16));
      const seedShapeGeometry = new THREE.ShapeGeometry(seedShape);
      const seedMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b, 
        side: THREE.DoubleSide 
      });
      
      const seed = new THREE.Mesh(seedShapeGeometry, seedMaterial);
      
      // Çekirdekleri karpuzun içine yerleştir
      // Küresel koordinatları kullanarak düzgün dağılım sağla
      const theta = rng('watermelon', i * 2) * Math.PI;
      const phi = rng('watermelon', i * 2 + 1) * Math.PI / 2;
      const radius = 0.75;
      
      seed.position.x = radius * Math.sin(phi) * Math.cos(theta);
      seed.position.y = radius * Math.cos(phi);
      seed.position.z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Çekirdeklerin yüzeye paralel olması için rotasyon
      seed.lookAt(0, 0, 0);
      seed.translateZ(0.01); // Yüzeye doğru hafif yukarı
      
      seeds.push(seed);
      watermelonGroup.add(seed);
    }
    
    watermelonGroup.add(body);
    watermelonGroup.add(transition);
    watermelonGroup.add(rind);
    
    // Karpuzu uygun şekilde çevir
    watermelonGroup.rotation.z = -Math.PI/2; // Dilimi dik pozisyon yap
    
    return watermelonGroup;
  }

  /**
   * Ananas modeli oluşturur
   * @returns {THREE.Group} Ananas 3D modeli
   */
  function createPineapple() {
    const group = new THREE.Group();
    
    // Ananas gövdesi
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.4, 1.2, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xfcd34d }); // Sarı
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Ananas yüzeyinde doku oluşturmak için grid
    const gridSize = 8;
    const gridWidth = 0.05;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < 16; j++) {
        const angle = (j / 16) * Math.PI * 2;
        const height = (i / gridSize) * 1.2 - 0.6 + 0.075;
        
        const tinyGeometry = new THREE.BoxGeometry(gridWidth, gridWidth, gridWidth);
        const tinyMaterial = new THREE.MeshStandardMaterial({ color: 0xca8a04 }); // Koyu sarı
        const tinyMesh = new THREE.Mesh(tinyGeometry, tinyMaterial);
        
        const radius = 0.5 - (i % 2) * 0.03;
        
        tinyMesh.position.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
        
        // Dışa doğru hafif döndür
        tinyMesh.lookAt(new THREE.Vector3(
          Math.cos(angle) * 2,
          height,
          Math.sin(angle) * 2
        ));
        
        group.add(tinyMesh);
      }
    }
    
    // Yapraklar (üst kısım)
    const leavesCount = 7;
    for (let i = 0; i < leavesCount; i++) {
      const leafGeometry = new THREE.ConeGeometry(0.15, 0.5, 4);
      const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x65a30d }); // Yeşil
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const angle = (i / leavesCount) * Math.PI * 2;
      const distance = 0.2;
      
      leaf.position.set(
        Math.cos(angle) * distance,
        0.7,
        Math.sin(angle) * distance
      );
      
      leaf.rotation.x = Math.PI / 4; // Biraz eğ
      leaf.rotation.y = angle; // Dönme açısına göre hizala
      
      group.add(leaf);
    }
    
    group.add(body);
    return group;
  }

  /**
   * Armut modeli oluşturur
   * @returns {THREE.Group} Armut 3D modeli
   */
  function createPear() {
    const group = new THREE.Group();
    
    // İki küre kullanarak armut şeklini oluşturuyoruz
    // Alt kısım (daha büyük)
    const bottomGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const pearMaterial = new THREE.MeshStandardMaterial({ color: 0xfde68a }); // Açık sarı/yeşil
    const bottomSphere = new THREE.Mesh(bottomGeometry, pearMaterial);
    bottomSphere.position.y = -0.2;
    bottomSphere.scale.set(1, 1.3, 1);
    group.add(bottomSphere);
    
    // Üst kısım (daha küçük)
    const topGeometry = new THREE.SphereGeometry(0.35, 24, 24);
    const topSphere = new THREE.Mesh(topGeometry, pearMaterial);
    topSphere.position.y = 0.4;
    topSphere.scale.set(0.8, 1, 0.8);
    group.add(topSphere);
    
    // İki küreyi birleştiren orta kısım
    const middleGeometry = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 24);
    const middleCylinder = new THREE.Mesh(middleGeometry, pearMaterial);
    middleCylinder.position.y = 0.1;
    group.add(middleCylinder);
    
    // Armut sapı
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x78350f }); // Kahverengi
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.7;
    group.add(stem);
    
    return group;
  }

  /**
   * Kiraz modeli oluşturur
   * @returns {THREE.Group} Kiraz 3D modeli (çift)
   */
  function createCherry() {
    const group = new THREE.Group();
    
    // İki kiraz (bir çift)
    const cherryGeometry = new THREE.SphereGeometry(0.3, 24, 24);
    const cherryMaterial = new THREE.MeshStandardMaterial({ color: 0xb91c1c }); // Koyu kırmızı
    
    // İlk kiraz
    const cherry1 = new THREE.Mesh(cherryGeometry, cherryMaterial);
    cherry1.position.set(-0.2, 0, 0);
    group.add(cherry1);
    
    // İkinci kiraz
    const cherry2 = new THREE.Mesh(cherryGeometry, cherryMaterial);
    cherry2.position.set(0.2, 0.1, 0);
    group.add(cherry2);
    
    // Sap (kavisli tel gibi)
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.2, 0.3, 0),
      new THREE.Vector3(-0.1, 0.6, 0),
      new THREE.Vector3(0.1, 0.6, 0),
      new THREE.Vector3(0.2, 0.4, 0)
    );
    
    group.add(tubeFromPoints(curve.getPoints(20), 0.015, 0x704632));
    
    // İnce yaprak (üstte)
    const leafGeometry = new THREE.CircleGeometry(0.1, 8);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x16a34a, // Yeşil
      side: THREE.DoubleSide 
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.set(0, 0.55, 0);
    leaf.rotation.x = -Math.PI / 2;
    leaf.rotation.z = Math.PI / 4;
    group.add(leaf);
    
    return group;
  }

  // Kategori bilgisi
  const category = {
    id: 'fruit',
    name: 'Meyveler'
  };

  return {
    models: fruits,
    category,
    createApple,
    createBanana,
    createOrange,
    createGrapes,
    createStrawberry,
    createWatermelon,
    createPineapple,
    createPear,
    createCherry
  };
} 