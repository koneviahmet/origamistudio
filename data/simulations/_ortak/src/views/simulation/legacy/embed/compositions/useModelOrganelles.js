import * as THREE from 'three';
import { rng } from './modelBuilderHelpers.js';

/**
 * Hücre organellerini oluşturan ve yöneten modül
 * @returns {Object} Organel modelleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelOrganelles() {
  // Organel modelleri koleksiyonu
  const organelles = [
    { id: 'nucleus', name: 'Çekirdek', create: createNucleus },
    { id: 'mitochondria', name: 'Mitokondri', create: createMitochondria },
    { id: 'endoplasmic_reticulum', name: 'Endoplazmik Retikulum', create: createEndoplasmicReticulum },
    { id: 'golgi', name: 'Golgi Aygıtı', create: createGolgiApparatus },
    { id: 'lysosome', name: 'Lizozom', create: createLysosome },
    { id: 'ribosome', name: 'Ribozom', create: createRibosome },
    { id: 'chloroplast', name: 'Kloroplast', create: createChloroplast },
    { id: 'cell_membrane', name: 'Hücre Zarı', create: createCellMembrane },
    { id: 'cell_wall', name: 'Hücre Duvarı', create: createCellWall },
    { id: 'cytoplasm', name: 'Sitoplazma', create: createCytoplasm }
  ];

  /**
   * Çekirdek (Nucleus) modeli oluşturur
   * @returns {THREE.Group} Çekirdek 3D modeli
   */
  function createNucleus() {
    const nucleusGroup = new THREE.Group();
    
    // Çekirdek ana yapısı
    const nucleusGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const nucleusMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x9333ea, // Mor
      transparent: true,
      opacity: 0.8
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    nucleusGroup.add(nucleus);
    
    // Çekirdek içindeki kromatin (DNA)
    const chromatinGeometry = new THREE.TorusKnotGeometry(0.2, 0.05, 100, 16);
    const chromatinMaterial = new THREE.MeshStandardMaterial({ color: 0x4338ca }); // Koyu mavi
    const chromatin = new THREE.Mesh(chromatinGeometry, chromatinMaterial);
    nucleusGroup.add(chromatin);
    
    // Çekirdekçik (Nucleolus)
    const nucleolusGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const nucleolusMaterial = new THREE.MeshStandardMaterial({ color: 0x6d28d9 }); // Daha koyu mor
    const nucleolus = new THREE.Mesh(nucleolusGeometry, nucleolusMaterial);
    nucleolus.position.set(0.15, 0.1, 0.1);
    nucleusGroup.add(nucleolus);
    
    // Çekirdek zarı (Nuclear membrane)
    const membraneGeometry = new THREE.SphereGeometry(0.42, 32, 32);
    const membraneMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc084fc, // Açık mor
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial);
    nucleusGroup.add(membrane);
    
    return nucleusGroup;
  }

  /**
   * Mitokondri modeli oluşturur
   * @returns {THREE.Group} Mitokondri 3D modeli
   */
  function createMitochondria() {
    const mitochondriaGroup = new THREE.Group();
    
    // Mitokondri dış yapısı
    const outerGeometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
    const outerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdc2626, // Kırmızı
      transparent: true,
      opacity: 0.7
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    mitochondriaGroup.add(outer);
    
    // Mitokondri iç zarları (cristae)
    for (let i = -0.25; i <= 0.25; i += 0.1) {
      const cristaeGeometry = new THREE.TorusGeometry(0.2, 0.02, 16, 32, Math.PI);
      const cristaeMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444 }); // Daha açık kırmızı
      const cristae = new THREE.Mesh(cristaeGeometry, cristaeMaterial);
      cristae.position.set(i, 0, 0);
      cristae.rotation.y = Math.PI / 2;
      mitochondriaGroup.add(cristae);
    }
    
    // Mitokondri iç matriksi
    const matrixGeometry = new THREE.CapsuleGeometry(0.25, 0.55, 8, 16);
    const matrixMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfca5a5, // Açık pembe
      transparent: true,
      opacity: 0.5
    });
    const matrix = new THREE.Mesh(matrixGeometry, matrixMaterial);
    mitochondriaGroup.add(matrix);
    
    return mitochondriaGroup;
  }

  /**
   * Endoplazmik Retikulum modeli oluşturur
   * @returns {THREE.Group} Endoplazmik Retikulum 3D modeli
   */
  function createEndoplasmicReticulum() {
    const erGroup = new THREE.Group();
    
    // Kanal sistemi için tüp oluşturma
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const x = 0.5 * Math.cos(angle) + (i * 0.05);
      const y = 0.2 * Math.sin(angle) + (i * 0.02);
      const z = 0.1 * Math.sin(angle * 2);
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.08, 16, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6, // Mavi
      transparent: true,
      opacity: 0.7
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    erGroup.add(tubeMesh);
    
    // Küçük kesecikler (vesicles) ekleyelim
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const position = curve.getPointAt(t);
      
      const vesicleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const vesicleMaterial = new THREE.MeshStandardMaterial({ color: 0x93c5fd }); // Açık mavi
      const vesicle = new THREE.Mesh(vesicleGeometry, vesicleMaterial);
      
      vesicle.position.copy(position);
      // Biraz rastgele ofset ekleyelim
      vesicle.position.x += (rng('organelle', 1) - 0.5) * 0.1;
      vesicle.position.y += (rng('organelle', 2) - 0.5) * 0.1;
      vesicle.position.z += (rng('organelle', 3) - 0.5) * 0.1;
      
      erGroup.add(vesicle);
    }
    
    return erGroup;
  }

  /**
   * Golgi Aygıtı modeli oluşturur
   * @returns {THREE.Group} Golgi Aygıtı 3D modeli
   */
  function createGolgiApparatus() {
    const golgiGroup = new THREE.Group();
    
    // Golgi kesecikleri (cisternae)
    const colors = [0xc4b5fd, 0xa78bfa, 0x8b5cf6, 0x7c3aed, 0x6d28d9]; // Mor tonları
    
    for (let i = 0; i < 5; i++) {
      const size = 0.5 - (i * 0.07); // Her seviyede biraz küçülsün
      
      const diskGeometry = new THREE.CylinderGeometry(size, size, 0.05, 32);
      const diskMaterial = new THREE.MeshStandardMaterial({ 
        color: colors[i],
        transparent: true,
        opacity: 0.7
      });
      
      const disk = new THREE.Mesh(diskGeometry, diskMaterial);
      disk.position.y = i * 0.1;
      disk.rotation.x = Math.PI / 12; // Biraz eğim verelim
      
      // Kenarları biraz kavisli yapmak için
      disk.scale.set(1, 1, 0.7);
      
      golgiGroup.add(disk);
    }
    
    // Küçük transport kesecikleri
    for (let i = 0; i < 15; i++) {
      const vesicleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
      const vesicleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 });
      const vesicle = new THREE.Mesh(vesicleGeometry, vesicleMaterial);
      
      // Rastgele pozisyonlar
      const r = 0.4 * Math.sqrt(rng('organelle', 4));
      const theta = rng('organelle', 5) * 2 * Math.PI;
      const y = rng('organelle', 6) * 0.5;
      
      vesicle.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
      golgiGroup.add(vesicle);
    }
    
    return golgiGroup;
  }

  /**
   * Lizozom modeli oluşturur
   * @returns {THREE.Group} Lizozom 3D modeli
   */
  function createLysosome() {
    const lysosomeGroup = new THREE.Group();
    
    // Lizozom ana yapısı
    const lysosomeGeometry = new THREE.SphereGeometry(0.25, 24, 24);
    const lysosomeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfbbf24, // Turuncu
      transparent: true,
      opacity: 0.8
    });
    const lysosome = new THREE.Mesh(lysosomeGeometry, lysosomeMaterial);
    lysosomeGroup.add(lysosome);
    
    // Lizozomun içindeki enzimler (küçük noktalar)
    for (let i = 0; i < 20; i++) {
      const enzymeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const enzymeMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
      const enzyme = new THREE.Mesh(enzymeGeometry, enzymeMaterial);
      
      // Küre içinde rastgele pozisyon
      const theta = rng('organelle', 7) * Math.PI * 2;
      const phi = Math.acos(2 * rng('organelle', 8) - 1);
      const r = 0.2 * Math.cbrt(rng('organelle', 9)); // Küre içinde daha eşit dağılım için küp kök alıyoruz
      
      enzyme.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      lysosomeGroup.add(enzyme);
    }
    
    return lysosomeGroup;
  }

  /**
   * Ribozom modeli oluşturur
   * @returns {THREE.Group} Ribozom 3D modeli
   */
  function createRibosome() {
    const ribosomeGroup = new THREE.Group();
    
    // Büyük alt birim (large subunit)
    const largeSubunitGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    largeSubunitGeometry.scale(1, 0.8, 1);
    const largeSubunitMaterial = new THREE.MeshStandardMaterial({ color: 0x047857 }); // Koyu yeşil
    const largeSubunit = new THREE.Mesh(largeSubunitGeometry, largeSubunitMaterial);
    largeSubunit.position.y = -0.05;
    ribosomeGroup.add(largeSubunit);
    
    // Küçük alt birim (small subunit)
    const smallSubunitGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    smallSubunitGeometry.scale(1, 0.7, 1);
    const smallSubunitMaterial = new THREE.MeshStandardMaterial({ color: 0x10b981 }); // Açık yeşil
    const smallSubunit = new THREE.Mesh(smallSubunitGeometry, smallSubunitMaterial);
    smallSubunit.position.y = 0.08;
    smallSubunit.position.x = 0.03;
    ribosomeGroup.add(smallSubunit);
    
    // Bağlama bölgesi
    const connectingGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
    const connectingMaterial = new THREE.MeshStandardMaterial({ color: 0x34d399 }); // Orta yeşil
    const connecting = new THREE.Mesh(connectingGeometry, connectingMaterial);
    connecting.position.y = 0.01;
    connecting.rotation.x = Math.PI / 3;
    ribosomeGroup.add(connecting);
    
    return ribosomeGroup;
  }

  /**
   * Kloroplast modeli oluşturur
   * @returns {THREE.Group} Kloroplast 3D modeli
   */
  function createChloroplast() {
    const chloroplastGroup = new THREE.Group();
    
    // Kloroplast dış yapısı
    const outerGeometry = new THREE.CapsuleGeometry(0.35, 0.5, 8, 16);
    const outerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x16a34a, // Yeşil
      transparent: true,
      opacity: 0.6
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    chloroplastGroup.add(outer);
    
    // İç yapı - tilakoidler
    const thylakoidMaterial = new THREE.MeshStandardMaterial({ color: 0x15803d }); // Koyu yeşil
    
    // Granum yapıları (üst üste dizili tilakoidler)
    for (let i = -0.2; i <= 0.2; i += 0.2) {
      const granumGroup = new THREE.Group();
      granumGroup.position.x = i;
      
      for (let j = -0.08; j <= 0.08; j += 0.04) {
        const thylakoidGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16);
        const thylakoid = new THREE.Mesh(thylakoidGeometry, thylakoidMaterial);
        thylakoid.position.y = j;
        granumGroup.add(thylakoid);
      }
      
      chloroplastGroup.add(granumGroup);
    }
    
    // Stroma lamelleri (granum yapılarını birbirine bağlayan tilakoidler)
    for (let i = -0.2; i <= 0.2; i += 0.2) {
      for (let j = -0.08; j <= 0.08; j += 0.08) {
        if (i < 0.2) { // Son konumda bağlantı gereksiz
          const lamellaGeometry = new THREE.BoxGeometry(0.2, 0.01, 0.05);
          const lamella = new THREE.Mesh(lamellaGeometry, thylakoidMaterial);
          lamella.position.set(i + 0.1, j, 0);
          chloroplastGroup.add(lamella);
        }
      }
    }
    
    // Stroma matriksi (içindeki sıvı)
    const stromaGeometry = new THREE.CapsuleGeometry(0.32, 0.45, 8, 16);
    const stromaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x22c55e, // Açık yeşil
      transparent: true,
      opacity: 0.3
    });
    const stroma = new THREE.Mesh(stromaGeometry, stromaMaterial);
    chloroplastGroup.add(stroma);
    
    return chloroplastGroup;
  }

  /**
   * Hücre zarı modeli oluşturur
   * @returns {THREE.Group} Hücre zarı 3D modeli
   */
  function createCellMembrane() {
    const membraneGroup = new THREE.Group();
    
    // Hücre zarı (fosfolipid çift tabaka)
    const membraneGeometry = new THREE.SphereGeometry(1, 32, 32);
    const membraneMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe879f9, // Pembe
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial);
    membraneGroup.add(membrane);
    
    // Protein kanalları
    for (let i = 0; i < 40; i++) {
      const channelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8);
      const channelMaterial = new THREE.MeshStandardMaterial({ color: 0xd946ef });
      const channel = new THREE.Mesh(channelGeometry, channelMaterial);
      
      // Küre yüzeyinde rastgele pozisyon
      const theta = rng('organelle', 10) * Math.PI * 2;
      const phi = Math.acos(2 * rng('organelle', 11) - 1);
      
      channel.position.set(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      
      // Kanalın yönünü merkeze doğru ayarlama
      channel.lookAt(0, 0, 0);
      
      membraneGroup.add(channel);
    }
    
    return membraneGroup;
  }

  /**
   * Hücre duvarı modeli oluşturur (bitki hücresi için)
   * @returns {THREE.Group} Hücre duvarı 3D modeli
   */
  function createCellWall() {
    const wallGroup = new THREE.Group();
    
    // Hücre duvarı
    const wallGeometry = new THREE.SphereGeometry(1.1, 32, 32);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x92400e, // Kahverengi
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wallGroup.add(wall);
    
    // Selüloz fibrilleri (çıtalar)
    for (let i = 0; i < 50; i++) {
      const fibrilGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8);
      const fibrilMaterial = new THREE.MeshStandardMaterial({ color: 0xa16207 }); // Koyu kahverengi
      const fibril = new THREE.Mesh(fibrilGeometry, fibrilMaterial);
      
      // Küre yüzeyinde rastgele pozisyon
      const theta = rng('organelle', 12) * Math.PI * 2;
      const phi = Math.acos(2 * rng('organelle', 13) - 1);
      
      fibril.position.set(
        1.1 * Math.sin(phi) * Math.cos(theta),
        1.1 * Math.sin(phi) * Math.sin(theta),
        1.1 * Math.cos(phi)
      );
      
      // Fibrillerin rasgele yönelimleri
      fibril.rotation.x = rng('organelle', 14) * Math.PI;
      fibril.rotation.y = rng('organelle', 15) * Math.PI;
      fibril.rotation.z = rng('organelle', 16) * Math.PI;
      
      wallGroup.add(fibril);
    }
    
    return wallGroup;
  }

  /**
   * Sitoplazma modeli oluşturur
   * @returns {THREE.Group} Sitoplazma 3D modeli
   */
  function createCytoplasm() {
    const cytoplasmGroup = new THREE.Group();
    
    // Sitoplazmik sıvı
    const cytoplasmGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const cytoplasmMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x93c5fd, // Açık mavi
      transparent: true,
      opacity: 0.2
    });
    const cytoplasm = new THREE.Mesh(cytoplasmGeometry, cytoplasmMaterial);
    cytoplasmGroup.add(cytoplasm);
    
    // Sitoplazmadaki çeşitli moleküller ve iyonlar
    for (let i = 0; i < 100; i++) {
      const size = 0.01 + rng('organelle', 17) * 0.03;
      const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
      
      // Rastgele renkler
      const colors = [0x60a5fa, 0x3b82f6, 0x2563eb, 0xbae6fd, 0x7dd3fc];
      const particleMaterial = new THREE.MeshStandardMaterial({ 
        color: colors[Math.floor(rng('organelle', 18) * colors.length)]
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Küre içinde rastgele pozisyon
      const r = 0.85 * Math.cbrt(rng('organelle', 19)); // Küre içinde daha eşit dağılım için küp kök alıyoruz
      const theta = rng('organelle', 20) * Math.PI * 2;
      const phi = Math.acos(2 * rng('organelle', 21) - 1);
      
      particle.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      cytoplasmGroup.add(particle);
    }
    
    return cytoplasmGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'organelle',
    name: 'Hücre Organelleri'
  };

  return {
    models: organelles,
    category,
    createNucleus,
    createMitochondria,
    createEndoplasmicReticulum,
    createGolgiApparatus,
    createLysosome,
    createRibosome,
    createChloroplast,
    createCellMembrane,
    createCellWall,
    createCytoplasm
  };
} 