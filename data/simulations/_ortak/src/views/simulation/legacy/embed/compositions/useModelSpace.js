import * as THREE from 'three';
import { rng, spherePoint, deformIcosahedron, addEarthContinents } from './modelBuilderHelpers.js';

/**
 * Uzay ve astronomi ile ilgili modelleri oluşturan ve yöneten modül
 * @returns {Object} Uzay elementleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelSpace() {
  // Uzay elementleri modelleri koleksiyonu
  const spaceElements = [
    { id: 'planet', name: 'Gezegen', create: createPlanet },
    { id: 'star', name: 'Yıldız', create: createStar },
    { id: 'comet', name: 'Kuyruklu Yıldız', create: createComet },
    { id: 'asteroid', name: 'Asteroid', create: createAsteroid },
    { id: 'blackhole', name: 'Kara Delik', create: createBlackHole },
    { id: 'satellite', name: 'Uydu', create: createSatellite },
    { id: 'spacestation', name: 'Uzay İstasyonu', create: createSpaceStation },
    { id: 'rocket', name: 'Roket', create: createRocket },
    // Güneş Sistemi modelleri
    { id: 'sun', name: 'Güneş', create: createSun },
    { id: 'mercury', name: 'Merkür', create: createMercury },
    { id: 'venus', name: 'Venüs', create: createVenus },
    { id: 'earth', name: 'Dünya', create: createEarth },
    { id: 'moon', name: 'Ay', create: createMoon },
    { id: 'mars', name: 'Mars', create: createMars },
    { id: 'jupiter', name: 'Jüpiter', create: createJupiter },
    { id: 'saturn', name: 'Satürn', create: createSaturn },
    { id: 'uranus', name: 'Uranüs', create: createUranus },
    { id: 'neptune', name: 'Neptün', create: createNeptune },
    { id: 'pluto', name: 'Plüton', create: createPluto }
  ];

  /**
   * Gezegen modeli oluşturur
   * @returns {THREE.Group} Gezegen 3D modeli
   */
  function createPlanet() {
    const planetGroup = new THREE.Group();
    
    // Gezegen yüzeyi
    const planetGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b6da8, 
      roughness: 0.8,
      metalness: 0.1
    });
    
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetGroup.add(planet);
    
    // Basit yüzey detayları - rastgele yerleştirilmiş "kıtalar"
    const landmassCount = 10;
    const landGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const landMaterial = new THREE.MeshStandardMaterial({
      color: 0x39a65a  // Yeşil
    });
    
    for (let i = 0; i < landmassCount; i++) {
      const land = new THREE.Mesh(landGeometry, landMaterial);
      const pos = spherePoint('planet', i, landmassCount, 0.81);
      land.position.copy(pos);
      land.scale.set(
        1 + rng('planet', i * 2) * 2,
        0.2,
        1 + rng('planet', i * 2 + 1) * 2
      );
      land.lookAt(0, 0, 0);
      planetGroup.add(land);
    }
    
    return planetGroup;
  }

  /**
   * Yıldız modeli oluşturur
   * @returns {THREE.Group} Yıldız 3D modeli
   */
  function createStar() {
    const starGroup = new THREE.Group();
    
    // Yıldız çekirdeği - parlak küre
    const coreGeometry = new THREE.SphereGeometry(0.6, 24, 24);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffcc,
      emissiveIntensity: 1,
      roughness: 0.2,
      metalness: 0
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    starGroup.add(core);
    
    // Dış parlama katmanı - daha büyük yarı saydam küre
    const glowGeometry = new THREE.SphereGeometry(0.8, 24, 24);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff88,
      emissive: 0xffffaa,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    starGroup.add(glow);
    
    return starGroup;
  }

  /**
   * Kuyruklu Yıldız modeli oluşturur
   * @returns {THREE.Group} Kuyruklu Yıldız 3D modeli
   */
  function createComet() {
    const cometGroup = new THREE.Group();
    
    // Kuyruklu yıldız çekirdeği
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    cometGroup.add(core);
    
    // Kuyruklu yıldız kuyruğu - koni şeklinde
    const tailGeometry = new THREE.ConeGeometry(0.25, 2, 16);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6,
      emissive: 0x4488ff,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, -1, 0);
    tail.rotation.x = Math.PI;  // Kuyruğu ters çevir
    
    cometGroup.add(tail);
    
    return cometGroup;
  }

  /**
   * Asteroid modeli oluşturur
   * @returns {THREE.Mesh} Asteroid 3D modeli
   */
  function createAsteroid() {
    // Düzensiz bir şekil için düşük detay seviyeli bir ikosahedron kullan
    const geometry = new THREE.IcosahedronGeometry(0.5, 0);
    deformIcosahedron(geometry, 'asteroid', 0.2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 1,
      metalness: 0.2
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Kara Delik modeli oluşturur
   * @returns {THREE.Group} Kara Delik 3D modeli
   */
  function createBlackHole() {
    const blackHoleGroup = new THREE.Group();
    
    // Karanlık merkez - tamamen siyah küre
    const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: false,
      side: THREE.FrontSide
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    blackHoleGroup.add(core);
    
    // İç akresyon diski - daha parlak ve düz halka
    const innerDiskGeometry = new THREE.RingGeometry(0.6, 1.2, 32);
    const innerDiskMaterial = new THREE.MeshBasicMaterial({
      color: 0x8866ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const innerDisk = new THREE.Mesh(innerDiskGeometry, innerDiskMaterial);
    innerDisk.rotation.x = Math.PI / 2; // Yatay olarak yerleştir
    blackHoleGroup.add(innerDisk);
    
    // Dış akresyon diski - daha soluk ve geniş halka
    const outerDiskGeometry = new THREE.RingGeometry(1.3, 2, 32);
    const outerDiskMaterial = new THREE.MeshBasicMaterial({
      color: 0x4422aa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    
    const outerDisk = new THREE.Mesh(outerDiskGeometry, outerDiskMaterial);
    outerDisk.rotation.x = Math.PI / 2; // Yatay olarak yerleştir
    blackHoleGroup.add(outerDisk);
    
    return blackHoleGroup;
  }

  /**
   * Uydu modeli oluşturur
   * @returns {THREE.Group} Uydu 3D modeli
   */
  function createSatellite() {
    const satelliteGroup = new THREE.Group();
    
    // Ana gövde
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.5, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    satelliteGroup.add(body);
    
    // Güneş panelleri
    const panelGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.5);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2244bb,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Sol panel
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-1, 0, 0);
    satelliteGroup.add(leftPanel);
    
    // Sağ panel
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(1, 0, 0);
    satelliteGroup.add(rightPanel);
    
    // Anten
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 0.5, 0);
    antenna.rotation.x = Math.PI / 2;
    satelliteGroup.add(antenna);
    
    // Çanak alıcı
    const dishGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    const dishMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.7
    });
    
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(0, 0.5, 0.3);
    dish.rotation.x = Math.PI / 2;
    satelliteGroup.add(dish);
    
    return satelliteGroup;
  }

  /**
   * Uzay İstasyonu modeli oluşturur
   * @returns {THREE.Group} Uzay İstasyonu 3D modeli
   */
  function createSpaceStation() {
    const stationGroup = new THREE.Group();
    
    // Merkez modül
    const centerModuleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16);
    const moduleMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.3,
      metalness: 0.7
    });
    
    const centerModule = new THREE.Mesh(centerModuleGeometry, moduleMaterial);
    centerModule.rotation.z = Math.PI / 2;
    stationGroup.add(centerModule);
    
    // Yan modüller
    const sideModuleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16);
    
    // Sol yan modül
    const leftModule = new THREE.Mesh(sideModuleGeometry, moduleMaterial);
    leftModule.position.set(-0.8, 0, 0);
    leftModule.rotation.z = Math.PI / 2;
    stationGroup.add(leftModule);
    
    // Sağ yan modül
    const rightModule = new THREE.Mesh(sideModuleGeometry, moduleMaterial);
    rightModule.position.set(0.8, 0, 0);
    rightModule.rotation.z = Math.PI / 2;
    stationGroup.add(rightModule);
    
    // Bağlantı tüneli - sol
    const leftConnectorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
    const leftConnector = new THREE.Mesh(leftConnectorGeometry, moduleMaterial);
    leftConnector.position.set(-0.35, 0, 0);
    leftConnector.rotation.z = Math.PI / 2;
    stationGroup.add(leftConnector);
    
    // Bağlantı tüneli - sağ
    const rightConnector = new THREE.Mesh(leftConnectorGeometry, moduleMaterial);
    rightConnector.position.set(0.35, 0, 0);
    rightConnector.rotation.z = Math.PI / 2;
    stationGroup.add(rightConnector);
    
    // Güneş panelleri
    const panelGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.4);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2244bb,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Sol panel seti
    const leftPanels = new THREE.Group();
    
    const leftPanel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel1.position.set(0, 0.3, 0);
    leftPanels.add(leftPanel1);
    
    const leftPanel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel2.position.set(0, -0.3, 0);
    leftPanels.add(leftPanel2);
    
    leftPanels.position.set(-0.8, 0, 0);
    stationGroup.add(leftPanels);
    
    // Sağ panel seti
    const rightPanels = new THREE.Group();
    
    const rightPanel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel1.position.set(0, 0.3, 0);
    rightPanels.add(rightPanel1);
    
    const rightPanel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel2.position.set(0, -0.3, 0);
    rightPanels.add(rightPanel2);
    
    rightPanels.position.set(0.8, 0, 0);
    stationGroup.add(rightPanels);
    
    return stationGroup;
  }

  /**
   * Roket modeli oluşturur
   * @returns {THREE.Group} Roket 3D modeli
   */
  function createRocket() {
    const rocketGroup = new THREE.Group();
    
    // Roket gövdesi
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.3,
      metalness: 0.4
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.2;
    rocketGroup.add(body);
    
    // Roket başlığı
    const noseGeometry = new THREE.ConeGeometry(0.2, 0.5, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      roughness: 0.3,
      metalness: 0.4
    });
    
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.y = 1.2;
    rocketGroup.add(nose);
    
    // Roket kanatçıkları
    const finGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.4);
    const finMaterial = new THREE.MeshStandardMaterial({
      color: 0x3355ff,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // 4 kanatçık ekle
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      fin.position.y = -0.4;
      
      // Merkez etrafında dört tarafa yerleştir
      const angle = (i / 4) * Math.PI * 2;
      fin.position.x = Math.cos(angle) * 0.2;
      fin.position.z = Math.sin(angle) * 0.2;
      
      // Kanatçıkları dışarı doğru döndür
      fin.rotation.y = Math.PI / 2 - angle;
      
      rocketGroup.add(fin);
    }
    
    // Roket motor ateşi
    const flameGeometry = new THREE.ConeGeometry(0.15, 0.5, 16);
    const flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa22,
      emissive: 0xff8800,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = -0.75;
    flame.rotation.x = Math.PI;
    rocketGroup.add(flame);
    
    return rocketGroup;
  }

  /**
   * Güneş modeli oluşturur
   * @returns {THREE.Group} Güneş 3D modeli
   */
  function createSun() {
    const sunGroup = new THREE.Group();
    
    // Güneş çekirdeği - parlak küre
    const coreGeometry = new THREE.SphereGeometry(1, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 1,
      roughness: 0.3,
      metalness: 0
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    sunGroup.add(core);
    
    // Dış parlama katmanı - daha büyük yarı saydam küre
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd44,
      emissive: 0xffcc22,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sunGroup.add(glow);
    
    return sunGroup;
  }
  
  /**
   * Merkür modeli oluşturur
   * @returns {THREE.Group} Merkür 3D modeli
   */
  function createMercury() {
    const mercuryGroup = new THREE.Group();
    
    // Merkür yüzeyi
    const mercuryGeometry = new THREE.SphereGeometry(0.38, 32, 32);
    const mercuryMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa9988, 
      roughness: 0.8,
      metalness: 0.2
    });
    
    const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
    mercuryGroup.add(mercury);
    
    // Kraterler ekleyelim
    const craterCount = 8;
    const craterGeometry = new THREE.CircleGeometry(0.05, 12);
    const craterMaterial = new THREE.MeshStandardMaterial({
      color: 0x887766,
      roughness: 1.0,
      metalness: 0.0
    });
    
    for (let i = 0; i < craterCount; i++) {
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      const pos = spherePoint('mercury', i, craterCount, 0.381);
      crater.position.copy(pos);
      crater.lookAt(0, 0, 0);
      mercuryGroup.add(crater);
    }
    
    return mercuryGroup;
  }
  
  /**
   * Venüs modeli oluşturur
   * @returns {THREE.Group} Venüs 3D modeli
   */
  function createVenus() {
    const venusGroup = new THREE.Group();
    
    // Venüs yüzeyi
    const venusGeometry = new THREE.SphereGeometry(0.95, 32, 32);
    const venusMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6c8a0, 
      roughness: 0.6,
      metalness: 0.1
    });
    
    const venus = new THREE.Mesh(venusGeometry, venusMaterial);
    venusGroup.add(venus);
    
    // Bulut katmanı
    const cloudGeometry = new THREE.SphereGeometry(0.98, 32, 32);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffee,
      transparent: true,
      opacity: 0.4,
      roughness: 0.8,
      metalness: 0.0
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    venusGroup.add(clouds);
    
    return venusGroup;
  }
  
  /**
   * Dünya modeli oluşturur
   * @returns {THREE.Group} Dünya 3D modeli
   */
  function createEarth() {
    const earthGroup = new THREE.Group();
    
    // Dünya yüzeyi
    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b60de, 
      roughness: 0.7,
      metalness: 0.1
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);

    addEarthContinents(earthGroup, 'earth');
    
    // Bulut katmanı
    const cloudGeometry = new THREE.SphereGeometry(1.03, 24, 24);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 1.0,
      metalness: 0.0
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthGroup.add(clouds);
    
    return earthGroup;
  }
  
  /**
   * Ay modeli oluşturur
   * @returns {THREE.Group} Ay 3D modeli
   */
  function createMoon() {
    const moonGroup = new THREE.Group();
    
    // Ay yüzeyi
    const moonGeometry = new THREE.SphereGeometry(0.27, 24, 24);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd, 
      roughness: 1.0,
      metalness: 0.0
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moonGroup.add(moon);
    
    // Kraterler ekleyelim
    const craterCount = 12;
    const craterGeometry = new THREE.CircleGeometry(0.03, 12);
    const craterMaterial = new THREE.MeshStandardMaterial({
      color: 0xbbbbbb,
      roughness: 1.0,
      metalness: 0.0
    });
    
    for (let i = 0; i < craterCount; i++) {
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      const pos = spherePoint('moon', i, craterCount, 0.271);
      crater.position.copy(pos);
      crater.lookAt(0, 0, 0);
      moonGroup.add(crater);
    }
    
    return moonGroup;
  }
  
  /**
   * Mars modeli oluşturur
   * @returns {THREE.Group} Mars 3D modeli
   */
  function createMars() {
    const marsGroup = new THREE.Group();
    
    // Mars yüzeyi
    const marsGeometry = new THREE.SphereGeometry(0.53, 32, 32);
    const marsMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc5c33, 
      roughness: 0.9,
      metalness: 0.1
    });
    
    const mars = new THREE.Mesh(marsGeometry, marsMaterial);
    marsGroup.add(mars);
    
    // Kraterler ekleyelim
    const craterCount = 8;
    const craterGeometry = new THREE.CircleGeometry(0.04, 12);
    const craterMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa4422,
      roughness: 1.0,
      metalness: 0.0
    });
    
    for (let i = 0; i < craterCount; i++) {
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      const pos = spherePoint('mars', i, craterCount, 0.531);
      crater.position.copy(pos);
      crater.lookAt(0, 0, 0);
      marsGroup.add(crater);
    }
    
    // Kutup bölgesi
    const polarCapGeometry = new THREE.CircleGeometry(0.2, 16);
    const polarCapMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.0
    });
    
    const polarCap = new THREE.Mesh(polarCapGeometry, polarCapMaterial);
    polarCap.position.set(0, 0.51, 0);
    polarCap.lookAt(0, 1, 0);
    marsGroup.add(polarCap);
    
    return marsGroup;
  }
  
  /**
   * Jüpiter modeli oluşturur
   * @returns {THREE.Group} Jüpiter 3D modeli
   */
  function createJupiter() {
    const jupiterGroup = new THREE.Group();
    
    // Jüpiter yüzeyi
    const jupiterGeometry = new THREE.SphereGeometry(11.2, 48, 48);
    const jupiterMaterial = new THREE.MeshStandardMaterial({
      color: 0xeacb94, 
      roughness: 0.6,
      metalness: 0.1
    });
    
    const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
    jupiterGroup.add(jupiter);

    const spotGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const spotMaterial = new THREE.MeshStandardMaterial({
      color: 0xc1440e,
      roughness: 0.7,
      metalness: 0.0,
    });

    const spot = new THREE.Mesh(spotGeometry, spotMaterial);
    spot.scale.set(1, 0.3, 0.6);
    
    // Küre yüzeyine yerleştir
    spot.position.set(0, 3, 11.1);
    spot.lookAt(0, 3, 0);
    jupiterGroup.add(spot);
    
    // Jüpiter'i ölçeklendir (daha küçük göstermek için)
    jupiterGroup.scale.set(0.1, 0.1, 0.1);
    
    return jupiterGroup;
  }
  
  /**
   * Satürn modeli oluşturur
   * @returns {THREE.Group} Satürn 3D modeli
   */
  function createSaturn() {
    const saturnGroup = new THREE.Group();
    
    // Satürn yüzeyi
    const saturnGeometry = new THREE.SphereGeometry(9.4, 48, 48);
    const saturnMaterial = new THREE.MeshStandardMaterial({
      color: 0xedcb83, 
      roughness: 0.6,
      metalness: 0.1
    });
    
    const saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
    saturnGroup.add(saturn);
    

    
    // Satürn'ün halkaları - daha gerçekçi boyutlar
    const ringGeometry = new THREE.RingGeometry(10, 15, 64); // Daha dar halkalar
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xcca876,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2.5;
    saturnGroup.add(ring);
    
    // İç halka - daha gerçekçi boyutlar
    const innerRingGeometry = new THREE.RingGeometry(9.5, 10.5, 64); // Daha dar iç halka
    const innerRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa8866,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.x = Math.PI / 2.5;
    saturnGroup.add(innerRing);
    
    // Satürn'ü ölçeklendir (daha küçük göstermek için)
    saturnGroup.scale.set(0.1, 0.1, 0.1);
    
    return saturnGroup;
  }
  
  /**
   * Uranüs modeli oluşturur
   * @returns {THREE.Group} Uranüs 3D modeli
   */
  function createUranus() {
    const uranusGroup = new THREE.Group();
    
    // Uranüs yüzeyi
    const uranusGeometry = new THREE.SphereGeometry(4, 32, 32);
    const uranusMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccee, 
      roughness: 0.5,
      metalness: 0.2
    });
    
    const uranus = new THREE.Mesh(uranusGeometry, uranusMaterial);
    uranusGroup.add(uranus);
    
    // Uranüs'ün halkaları - daha gerçekçi ince halkalar
    const ringGeometry = new THREE.RingGeometry(4.5, 5.2, 64); // Daha ince halkalar
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaddee,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 1.4; // Neredeyse dikey halkalar
    uranusGroup.add(ring);
    
    // Uranüs'ü ölçeklendir (daha küçük göstermek için)
    uranusGroup.scale.set(0.1, 0.1, 0.1);
    
    return uranusGroup;
  }
  
  /**
   * Neptün modeli oluşturur
   * @returns {THREE.Group} Neptün 3D modeli
   */
  function createNeptune() {
    const neptuneGroup = new THREE.Group();
    
    // Neptün yüzeyi
    const neptuneGeometry = new THREE.SphereGeometry(3.9, 32, 32);
    const neptuneMaterial = new THREE.MeshStandardMaterial({
      color: 0x3344bb, 
      roughness: 0.5,
      metalness: 0.2
    });
    
    const neptune = new THREE.Mesh(neptuneGeometry, neptuneMaterial);
    neptuneGroup.add(neptune);
    
    // Büyük Koyu Leke - daha gerçekçi boyut
    const spotGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const spotMaterial = new THREE.MeshStandardMaterial({
      color: 0x224499,
      roughness: 0.7,
      metalness: 0.0
    });
    
    const spot = new THREE.Mesh(spotGeometry, spotMaterial);
    spot.scale.set(1, 0.3, 0.6);
    
    // Küre yüzeyine yerleştir
    spot.position.set(0, 1, 3.9);
    spot.lookAt(0, 1, 0);
    neptuneGroup.add(spot);
    

    
    // Neptün'ü ölçeklendir (daha küçük göstermek için)
    neptuneGroup.scale.set(0.1, 0.1, 0.1);
    
    return neptuneGroup;
  }
  
  /**
   * Plüton modeli oluşturur
   * @returns {THREE.Group} Plüton 3D modeli
   */
  function createPluto() {
    const plutoGroup = new THREE.Group();
    
    // Plüton yüzeyi
    const plutoGeometry = new THREE.SphereGeometry(0.18, 24, 24);
    const plutoMaterial = new THREE.MeshStandardMaterial({
      color: 0xccbbaa, 
      roughness: 0.9,
      metalness: 0.0
    });
    
    const pluto = new THREE.Mesh(plutoGeometry, plutoMaterial);
    plutoGroup.add(pluto);
    
    // Büyük kalp şekilli bölge - düzeltilmiş pozisyon
    const heartGeometry = new THREE.CircleGeometry(0.08, 16);
    const heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeddcc,
      roughness: 0.7,
      metalness: 0.0
    });
    
    const heart = new THREE.Mesh(heartGeometry, heartMaterial);
    heart.position.set(0, 0, 0.18);
    heart.lookAt(0, 0, 0);
    heart.rotation.y = Math.PI / 4; // Hafif döndür
    plutoGroup.add(heart);
    
    return plutoGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'space',
    name: 'Uzay ve Astronomi'
  };

  return {
    models: spaceElements,
    category,
    createPlanet,
    createStar,
    createComet,
    createAsteroid,
    createBlackHole,
    createSatellite,
    createSpaceStation,
    createRocket,
    // Güneş Sistemi model fonksiyonlarını dışa aktar
    createSun,
    createMercury,
    createVenus,
    createEarth,
    createMoon,
    createMars,
    createJupiter,
    createSaturn,
    createUranus,
    createNeptune,
    createPluto
  };
} 