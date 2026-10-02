import * as THREE from 'three';
import { rng } from './modelBuilderHelpers.js';

/**
 * Hayvan modellerini oluşturan ve yöneten modül
 * @returns {Object} Hayvan modelleri ile ilgili fonksiyonları ve verileri içeren nesne
 */
export default function useModelAnimals() {
  // Hayvan modelleri koleksiyonu
  const animals = [
    { id: 'dog', name: 'Köpek', create: createDog },
    { id: 'cat', name: 'Kedi', create: createCat },
    { id: 'bird', name: 'Kuş', create: createBird },
    { id: 'rabbit', name: 'Tavşan', create: createRabbit },
    { id: 'fish', name: 'Balık', create: createFish },
    { id: 'horse', name: 'At', create: createHorse },
    { id: 'turtle', name: 'Kaplumbağa', create: createTurtle },
    { id: 'elephant', name: 'Fil', create: createElephant },
    { id: 'giraffe', name: 'Zürafa', create: createGiraffe },
    { id: 'lion', name: 'Aslan', create: createLion },
    { id: 'sheep', name: 'Koyun', create: createSheep },
    { id: 'frog', name: 'Kurbağa', create: createFrog },
    { id: 'butterfly', name: 'Kelebek', create: createButterfly },
    { id: 'bee', name: 'Arı', create: createBee }
  ];

  /**
   * Köpek modeli oluşturur
   * @returns {THREE.Group} Köpek 3D modeli
   */
  function createDog() {
    const dogGroup = new THREE.Group();
    
    // Köpek gövdesi
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xa16207 }); // Kahverengi
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    dogGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xa16207 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.5, 0.1, 0);
    dogGroup.add(head);
    
    // Burun
    const noseGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.72, 0.05, 0);
    dogGroup.add(nose);
    
    // Kulaklar
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 16);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x854d0e });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.45, 0.3, -0.15);
    leftEar.rotation.z = -Math.PI / 4;
    dogGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.45, 0.3, 0.15);
    rightEar.rotation.z = -Math.PI / 4;
    dogGroup.add(rightEar);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xa16207 });
    
    const positions = [
      [-0.25, -0.3, -0.2], // Sol ön
      [-0.25, -0.3, 0.2],  // Sağ ön
      [0.25, -0.3, -0.2],  // Sol arka
      [0.25, -0.3, 0.2]    // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      dogGroup.add(leg);
    });
    
    // Kuyruk
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 0, 0),
      new THREE.Vector3(-0.5, 0.2, 0),
      new THREE.Vector3(-0.6, 0.3, 0),
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 32, 0.05, 8, false);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    dogGroup.add(tail);
    
    return dogGroup;
  }

  /**
   * Kedi modeli oluşturur
   * @returns {THREE.Group} Kedi 3D modeli
   */
  function createCat() {
    const catGroup = new THREE.Group();
    
    // Kedi gövdesi
    const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x737373 }); // Gri
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    catGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.22, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x737373 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.45, 0.1, 0);
    catGroup.add(head);
    
    // Burun
    const noseGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xfda4af });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.65, 0.05, 0);
    nose.scale.setX(0.5);
    catGroup.add(nose);
    
    // Kulaklar - üçgen şeklinde
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 16);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x737373 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.4, 0.32, -0.12);
    leftEar.rotation.z = -Math.PI / 12;
    catGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.4, 0.32, 0.12);
    rightEar.rotation.z = -Math.PI / 12;
    catGroup.add(rightEar);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x737373 });
    
    const positions = [
      [-0.2, -0.25, -0.15], // Sol ön
      [-0.2, -0.25, 0.15],  // Sağ ön
      [0.2, -0.25, -0.15],  // Sol arka
      [0.2, -0.25, 0.15]    // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      catGroup.add(leg);
    });
    
    // Kuyruk - daha uzun ve kıvrımlı
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 0, 0),
      new THREE.Vector3(-0.5, 0.1, 0),
      new THREE.Vector3(-0.6, 0.3, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 32, 0.04, 8, false);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    catGroup.add(tail);
    
    return catGroup;
  }

  /**
   * Kuş modeli oluşturur
   * @returns {THREE.Group} Kuş 3D modeli
   */
  function createBird() {
    const birdGroup = new THREE.Group();
    
    // Kuş gövdesi
    const bodyGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    bodyGeometry.scale(1.2, 1, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x60a5fa }); // Mavi
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x60a5fa });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.25, 0.1, 0);
    birdGroup.add(head);
    
    // Gaga
    const beakGeometry = new THREE.ConeGeometry(0.06, 0.2, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 }); // Sarı
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0.4, 0.05, 0);
    beak.rotation.z = -Math.PI / 2;
    birdGroup.add(beak);
    
    // Kanatlar
    const wingGeometry = new THREE.CircleGeometry(0.25, 16, 0, Math.PI);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6, 
      side: THREE.DoubleSide 
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0.05, -0.25);
    leftWing.rotation.y = Math.PI / 2;
    leftWing.rotation.z = -Math.PI / 6;
    birdGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, 0.05, 0.25);
    rightWing.rotation.y = -Math.PI / 2;
    rightWing.rotation.z = Math.PI / 6;
    birdGroup.add(rightWing);
    
    // Kuyruk
    const tailGeometry = new THREE.ConeGeometry(0.15, 0.25, 8);
    tailGeometry.scale(1, 0.5, 0.2);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-0.3, 0, 0);
    tail.rotation.z = Math.PI / 2;
    birdGroup.add(tail);
    
    // Ayaklar
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0, -0.2, -0.1);
    birdGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0, -0.2, 0.1);
    birdGroup.add(rightLeg);
    
    return birdGroup;
  }

  /**
   * Tavşan modeli oluşturur
   * @returns {THREE.Group} Tavşan 3D modeli
   */
  function createRabbit() {
    const rabbitGroup = new THREE.Group();
    
    // Tavşan gövdesi
    const bodyGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    bodyGeometry.scale(1.2, 1, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }); // Beyaz
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    rabbitGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0.3, 0.2, 0);
    rabbitGroup.add(head);
    
    // Kulaklar
    const earGeometry = new THREE.CapsuleGeometry(0.05, 0.3, 4, 8);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.25, 0.45, -0.1);
    leftEar.rotation.x = Math.PI / 12;
    leftEar.rotation.z = -Math.PI / 12;
    rabbitGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.25, 0.45, 0.1);
    rightEar.rotation.x = -Math.PI / 12;
    rightEar.rotation.z = -Math.PI / 12;
    rabbitGroup.add(rightEar);
    
    // Burun
    const noseGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xfda4af }); // Pembe
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.5, 0.15, 0);
    rabbitGroup.add(nose);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    
    // Ön bacaklar
    const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontLeftLeg.position.set(0.15, -0.2, -0.15);
    rabbitGroup.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontRightLeg.position.set(0.15, -0.2, 0.15);
    rabbitGroup.add(frontRightLeg);
    
    // Arka bacaklar (biraz daha büyük)
    const hindLegGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8);
    
    const hindLeftLeg = new THREE.Mesh(hindLegGeometry, legMaterial);
    hindLeftLeg.position.set(-0.15, -0.25, -0.15);
    rabbitGroup.add(hindLeftLeg);
    
    const hindRightLeg = new THREE.Mesh(hindLegGeometry, legMaterial);
    hindRightLeg.position.set(-0.15, -0.25, 0.15);
    rabbitGroup.add(hindRightLeg);
    
    // Kuyruk
    const tailGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-0.35, 0, 0);
    rabbitGroup.add(tail);
    
    return rabbitGroup;
  }

  /**
   * Balık modeli oluşturur
   * @returns {THREE.Group} Balık 3D modeli
   */
  function createFish() {
    const fishGroup = new THREE.Group();
    
    // Balık gövdesi
    const bodyGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    bodyGeometry.scale(1.5, 1, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b }); // Turuncu
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    fishGroup.add(body);
    
    // Baş/burun kısmı
    const headGeometry = new THREE.ConeGeometry(0.2, 0.3, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0.4, 0, 0);
    head.rotation.z = -Math.PI / 2;
    fishGroup.add(head);
    
    // Kuyruk
    const tailGeometry = new THREE.ConeGeometry(0.25, 0.4, 2);
    tailGeometry.rotateZ(Math.PI / 2);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-0.55, 0, 0);
    tail.rotation.z = Math.PI / 2;
    fishGroup.add(tail);
    
    // Sırt yüzgeci
    const finGeometry = new THREE.ConeGeometry(0.1, 0.25, 8);
    finGeometry.scale(0.5, 1, 0.2);
    const finMaterial = new THREE.MeshStandardMaterial({ color: 0xfd7e14 });
    const backFin = new THREE.Mesh(finGeometry, finMaterial);
    backFin.position.set(0, 0.3, 0);
    backFin.rotation.z = Math.PI;
    fishGroup.add(backFin);
    
    // Yan yüzgeçler
    const sideFin1 = new THREE.Mesh(finGeometry, finMaterial);
    sideFin1.scale.set(0.7, 0.7, 0.7);
    sideFin1.position.set(0.1, 0, -0.25);
    sideFin1.rotation.x = -Math.PI / 2;
    sideFin1.rotation.z = -Math.PI / 3;
    fishGroup.add(sideFin1);
    
    const sideFin2 = new THREE.Mesh(finGeometry, finMaterial);
    sideFin2.scale.set(0.7, 0.7, 0.7);
    sideFin2.position.set(0.1, 0, 0.25);
    sideFin2.rotation.x = Math.PI / 2;
    sideFin2.rotation.z = -Math.PI / 3;
    fishGroup.add(sideFin2);
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.3, 0.1, -0.15);
    fishGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.1, 0.15);
    fishGroup.add(rightEye);
    
    return fishGroup;
  }

  /**
   * At modeli oluşturur
   * @returns {THREE.Group} At 3D modeli
   */
  function createHorse() {
    const horseGroup = new THREE.Group();
    
    // At gövdesi
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x92400e }); // Kahverengi
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    horseGroup.add(body);
    
    // Boyun
    const neckGeometry = new THREE.CapsuleGeometry(0.15, 0.4, 4, 8);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.set(0.4, 0.4, 0);
    neck.rotation.z = -Math.PI / 4;
    horseGroup.add(neck);
    
    // Baş
    const headGeometry = new THREE.CapsuleGeometry(0.15, 0.4, 4, 8);
    headGeometry.scale(0.8, 1, 0.6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0.7, 0.6, 0);
    head.rotation.z = -Math.PI / 3;
    horseGroup.add(head);
    
    // Burun
    const noseGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    noseGeometry.scale(1.5, 0.7, 1);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x92400e });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.9, 0.55, 0);
    horseGroup.add(nose);
    
    // Kulaklar
    const earGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x7c2d12 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.65, 0.85, -0.1);
    leftEar.rotation.z = -Math.PI / 12;
    horseGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.65, 0.85, 0.1);
    rightEar.rotation.z = -Math.PI / 12;
    horseGroup.add(rightEar);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x7c2d12 });
    
    const positions = [
      [0.3, -0.4, -0.25], // Sol ön
      [0.3, -0.4, 0.25],  // Sağ ön
      [-0.3, -0.4, -0.25], // Sol arka
      [-0.3, -0.4, 0.25]   // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      horseGroup.add(leg);
    });
    
    // Kuyruk
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.6, 0, 0),
      new THREE.Vector3(-0.8, 0.1, 0),
      new THREE.Vector3(-0.9, -0.1, 0),
      new THREE.Vector3(-0.95, -0.3, 0),
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 32, 0.04, 8, false);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    horseGroup.add(tail);
    
    // Yele
    const maneGeometry = new THREE.BoxGeometry(0.45, 0.05, 0.3);
    const maneMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const mane = new THREE.Mesh(maneGeometry, maneMaterial);
    mane.position.set(0.55, 0.55, 0);
    mane.rotation.z = -Math.PI / 4;
    horseGroup.add(mane);
    
    return horseGroup;
  }

  /**
   * Kaplumbağa modeli oluşturur
   * @returns {THREE.Group} Kaplumbağa 3D modeli
   */
  function createTurtle() {
    const turtleGroup = new THREE.Group();
    
    // Kaplumbağa kabuğu
    const shellGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    shellGeometry.scale(1, 0.5, 1);
    const shellMaterial = new THREE.MeshStandardMaterial({ color: 0x15803d }); // Yeşil
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    turtleGroup.add(shell);
    
    // Kabuk desenleri
    const patternGeometry = new THREE.CircleGeometry(0.1, 6);
    const patternMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x065f46, 
      side: THREE.DoubleSide 
    });
    
    const positions = [
      [0, 0.17, 0],
      [0.2, 0.15, 0.2],
      [-0.2, 0.15, 0.2],
      [0.2, 0.15, -0.2],
      [-0.2, 0.15, -0.2],
      [0, 0.15, -0.25],
      [0, 0.15, 0.25],
    ];
    
    positions.forEach(pos => {
      const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
      pattern.position.set(...pos);
      pattern.rotation.x = -Math.PI / 2;
      turtleGroup.add(pattern);
    });
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x84cc16 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.4, 0, 0);
    turtleGroup.add(head);
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.5, 0.05, -0.08);
    turtleGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.5, 0.05, 0.08);
    turtleGroup.add(rightEye);
    
    // Bacaklar
    const legGeometry = new THREE.CapsuleGeometry(0.06, 0.15, 4, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x84cc16 });
    
    const legPositions = [
      [0.2, -0.12, -0.25], // Sol ön
      [0.2, -0.12, 0.25],  // Sağ ön
      [-0.2, -0.12, -0.25], // Sol arka
      [-0.2, -0.12, 0.25]   // Sağ arka
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      leg.rotation.x = Math.PI / 2;
      turtleGroup.add(leg);
    });
    
    // Kuyruk
    const tailGeometry = new THREE.ConeGeometry(0.06, 0.15, 8);
    const tail = new THREE.Mesh(tailGeometry, headMaterial);
    tail.position.set(-0.4, -0.05, 0);
    tail.rotation.z = Math.PI / 2;
    turtleGroup.add(tail);
    
    return turtleGroup;
  }

  /**
   * Fil modeli oluşturur
   * @returns {THREE.Group} Fil 3D modeli
   */
  function createElephant() {
    const elephantGroup = new THREE.Group();
    
    // Fil gövdesi
    const bodyGeometry = new THREE.CapsuleGeometry(0.45, 0.9, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 }); // Gri
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    elephantGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.7, 0.2, 0);
    elephantGroup.add(head);
    
    // Kulaklar
    const earGeometry = new THREE.CircleGeometry(0.3, 16);
    const earMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6b7280,
      side: THREE.DoubleSide 
    });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.6, 0.2, -0.35);
    leftEar.rotation.y = Math.PI / 2;
    leftEar.scale.set(0.8, 1, 1);
    elephantGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.6, 0.2, 0.35);
    rightEar.rotation.y = -Math.PI / 2;
    rightEar.scale.set(0.8, 1, 1);
    elephantGroup.add(rightEar);
    
    // Hortum
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 0, 0),
      new THREE.Vector3(1.1, -0.2, 0),
      new THREE.Vector3(1.0, -0.4, 0),
    ]);
    
    const trunkGeometry = new THREE.TubeGeometry(trunkCurve, 32, 0.08, 8, false);
    const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
    elephantGroup.add(trunk);
    
    // Dişler
    const tuskGeometry = new THREE.CylinderGeometry(0.03, 0.01, 0.3, 8);
    const tuskMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f4 }); // Beyaz
    
    const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    leftTusk.position.set(0.9, -0.05, -0.2);
    leftTusk.rotation.x = Math.PI / 8;
    leftTusk.rotation.z = -Math.PI / 4;
    elephantGroup.add(leftTusk);
    
    const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    rightTusk.position.set(0.9, -0.05, 0.2);
    rightTusk.rotation.x = -Math.PI / 8;
    rightTusk.rotation.z = -Math.PI / 4;
    elephantGroup.add(rightTusk);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
    
    const positions = [
      [0.3, -0.5, -0.3], // Sol ön
      [0.3, -0.5, 0.3],  // Sağ ön
      [-0.3, -0.5, -0.3], // Sol arka
      [-0.3, -0.5, 0.3]   // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      elephantGroup.add(leg);
    });
    
    // Kuyruk
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0, 0),
      new THREE.Vector3(-0.9, 0, 0),
      new THREE.Vector3(-1.0, -0.2, 0),
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 32, 0.03, 8, false);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    elephantGroup.add(tail);
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.85, 0.25, -0.2);
    elephantGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.85, 0.25, 0.2);
    elephantGroup.add(rightEye);
    
    return elephantGroup;
  }

  /**
   * Zürafa modeli oluşturur
   * @returns {THREE.Group} Zürafa 3D modeli
   */
  function createGiraffe() {
    const giraffeGroup = new THREE.Group();
    
    // Zürafa gövdesi
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 }); // Sarı-turuncu
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.3, 0);
    giraffeGroup.add(body);
    
    // Boyun
    const neckGeometry = new THREE.CapsuleGeometry(0.12, 1.0, 4, 8);
    const neckMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0.2, 1.0, 0);
    neck.rotation.z = -Math.PI / 8;
    giraffeGroup.add(neck);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    headGeometry.scale(1.5, 1, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.4, 1.6, 0);
    head.rotation.z = Math.PI / 8;
    giraffeGroup.add(head);
    
    // Lekeler (desenler)
    const spotGeometry = new THREE.CircleGeometry(0.08, 6);
    const spotMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x92400e, 
      side: THREE.DoubleSide 
    });
    
    // Gövde lekeleri
    const bodySpotPositions = [
      [0.1, 0.5, 0.3],
      [-0.2, 0.5, 0.3],
      [0.2, 0.5, -0.3],
      [-0.2, 0.5, -0.3],
      [0.3, 0.2, 0.3],
      [-0.3, 0.2, 0.3],
      [0.3, 0.2, -0.3],
      [-0.3, 0.2, -0.3],
    ];
    
    bodySpotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(...pos);
      spot.lookAt(pos[0] + 1, pos[1], pos[2]);
      giraffeGroup.add(spot);
    });
    
    // Boyun lekeleri
    const neckSpotPositions = [
      [0.2, 0.8, 0.12],
      [0.2, 0.8, -0.12],
      [0.25, 1.0, 0.12],
      [0.25, 1.0, -0.12],
      [0.3, 1.2, 0.12],
      [0.3, 1.2, -0.12],
      [0.35, 1.4, 0.12],
      [0.35, 1.4, -0.12],
    ];
    
    neckSpotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.scale.set(0.7, 0.7, 0.7);
      spot.position.set(...pos);
      spot.lookAt(pos[0] + 1, pos[1], pos[2]);
      giraffeGroup.add(spot);
    });
    
    // Boynuzlar
    const hornGeometry = new THREE.ConeGeometry(0.03, 0.12, 8);
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x78350f });
    
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(0.45, 1.75, -0.1);
    leftHorn.rotation.x = Math.PI / 12;
    leftHorn.rotation.z = -Math.PI / 6;
    giraffeGroup.add(leftHorn);
    
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.45, 1.75, 0.1);
    rightHorn.rotation.x = -Math.PI / 12;
    rightHorn.rotation.z = -Math.PI / 6;
    giraffeGroup.add(rightHorn);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    
    const positions = [
      [0.2, -0.1, -0.25], // Sol ön
      [0.2, -0.1, 0.25],  // Sağ ön
      [-0.2, -0.1, -0.25], // Sol arka
      [-0.2, -0.1, 0.25]   // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      giraffeGroup.add(leg);
    });
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.55, 1.65, -0.08);
    giraffeGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.55, 1.65, 0.08);
    giraffeGroup.add(rightEye);
    
    // Kuyruk
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, 0.3, 0),
      new THREE.Vector3(-0.6, 0.2, 0),
      new THREE.Vector3(-0.7, 0, 0),
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 32, 0.02, 8, false);
    const tail = new THREE.Mesh(tailGeometry, neckMaterial);
    giraffeGroup.add(tail);
    
    return giraffeGroup;
  }

  /**
   * Aslan modeli oluşturur
   * @returns {THREE.Group} Aslan 3D modeli
   */
  function createLion() {
    const lionGroup = new THREE.Group();
    
    // Aslan gövdesi
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 0.7, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd97706 }); // Altın sarısı
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    lionGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.28, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.55, 0.1, 0);
    lionGroup.add(head);
    
    // Yele
    const maneGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const maneMaterial = new THREE.MeshStandardMaterial({ color: 0x92400e });
    const mane = new THREE.Mesh(maneGeometry, maneMaterial);
    mane.position.set(0.45, 0.1, 0);
    mane.scale.set(0.9, 0.9, 0.9);
    lionGroup.add(mane);
    
    // Burun
    const noseGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.75, 0, 0);
    nose.scale.set(1, 0.8, 0.8);
    lionGroup.add(nose);
    
    // Burun ucu
    const noseEndGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const noseEndMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const noseEnd = new THREE.Mesh(noseEndGeometry, noseEndMaterial);
    noseEnd.position.set(0.85, 0, 0);
    lionGroup.add(noseEnd);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    
    const positions = [
      [0.25, -0.35, -0.25], // Sol ön
      [0.25, -0.35, 0.25],  // Sağ ön
      [-0.25, -0.35, -0.25], // Sol arka
      [-0.25, -0.35, 0.25]   // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      lionGroup.add(leg);
    });
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xfef08a });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.7, 0.15, -0.15);
    lionGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.7, 0.15, 0.15);
    lionGroup.add(rightEye);
    
    // Göz bebekleri
    const pupilGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0.75, 0.15, -0.15);
    lionGroup.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.75, 0.15, 0.15);
    lionGroup.add(rightPupil);
    
    // Kuyruk
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(-0.7, 0.2, 0),
      new THREE.Vector3(-0.8, 0.1, 0),
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 32, 0.04, 8, false);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    lionGroup.add(tail);
    
    // Kuyruk ucu
    const tailEndGeometry = new THREE.SphereGeometry(0.07, 16, 16);
    const tailEnd = new THREE.Mesh(tailEndGeometry, maneMaterial);
    tailEnd.position.set(-0.8, 0.1, 0);
    lionGroup.add(tailEnd);
    
    return lionGroup;
  }

  /**
   * Koyun modeli oluşturur
   * @returns {THREE.Group} Koyun 3D modeli
   */
  function createSheep() {
    const sheepGroup = new THREE.Group();
    
    // Koyun gövdesi - yünlü görünüm için daha yuvarlak
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    bodyGeometry.scale(1.2, 0.8, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f4 }); // Beyaz
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    sheepGroup.add(body);
    
    // Yün yapısı oluşturmak için küçük toplar
    const woolGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const woolMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f4 });
    
    // Gövde etrafında rastgele yün topları
    for (let i = 0; i < 20; i++) {
      const angle = rng('sheep', i * 3) * Math.PI * 2;
      const radius = 0.3 + rng('sheep', i * 3 + 1) * 0.15;
      const height = (rng('sheep', i * 3 + 2) - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const wool = new THREE.Mesh(woolGeometry, woolMaterial);
      wool.position.set(x, height, z);
      wool.scale.set(
        0.8 + rng('sheep', i * 3 + 10) * 0.4,
        0.8 + rng('sheep', i * 3 + 11) * 0.4,
        0.8 + rng('sheep', i * 3 + 12) * 0.4
      );
      sheepGroup.add(wool);
    }
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    headGeometry.scale(1.2, 1, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 }); // Koyu gri
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.5, 0.1, 0);
    sheepGroup.add(head);
    
    // Kulaklar
    const earGeometry = new THREE.CircleGeometry(0.08, 8);
    const earMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x374151,
      side: THREE.DoubleSide 
    });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.45, 0.2, -0.15);
    leftEar.rotation.y = Math.PI / 2;
    leftEar.rotation.x = Math.PI / 6;
    sheepGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.45, 0.2, 0.15);
    rightEar.rotation.y = -Math.PI / 2;
    rightEar.rotation.x = -Math.PI / 6;
    sheepGroup.add(rightEar);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
    
    const positions = [
      [0.25, -0.5, -0.2], // Sol ön
      [0.25, -0.5, 0.2],  // Sağ ön
      [-0.25, -0.5, -0.2], // Sol arka
      [-0.25, -0.5, 0.2]   // Sağ arka
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(...pos);
      sheepGroup.add(leg);
    });
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.65, 0.15, -0.1);
    sheepGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.65, 0.15, 0.1);
    sheepGroup.add(rightEye);
    
    return sheepGroup;
  }

  /**
   * Kurbağa modeli oluşturur
   * @returns {THREE.Group} Kurbağa 3D modeli
   */
  function createFrog() {
    const frogGroup = new THREE.Group();
    
    // Kurbağa gövdesi (yeşil, geniş oval)
    const bodyGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4ade80 }); // Parlak yeşil
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 0.6, 1.2);
    frogGroup.add(body);
    
    // Baş
    const headGeometry = new THREE.SphereGeometry(0.4, 24, 24);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.1, 0.5);
    head.scale.set(1, 0.7, 0.8);
    frogGroup.add(head);
    
    // Gözler (iki büyük sarı göz)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeOuterMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15 }); // Sarı
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeOuterMaterial);
    leftEye.position.set(-0.2, 0.25, 0.6);
    frogGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeOuterMaterial);
    rightEye.position.set(0.2, 0.25, 0.6);
    frogGroup.add(rightEye);
    
    // Göz bebekleri (siyah)
    const pupilGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Siyah
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.2, 0.25, 0.73);
    frogGroup.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.2, 0.25, 0.73);
    frogGroup.add(rightPupil);
    
    // Ön bacaklar
    const frontLegGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.4, 8);
    
    const leftFrontLeg = new THREE.Mesh(frontLegGeometry, bodyMaterial);
    leftFrontLeg.position.set(-0.3, -0.25, 0.3);
    leftFrontLeg.rotation.z = Math.PI / 6;
    leftFrontLeg.rotation.x = Math.PI / 4;
    frogGroup.add(leftFrontLeg);
    
    const rightFrontLeg = new THREE.Mesh(frontLegGeometry, bodyMaterial);
    rightFrontLeg.position.set(0.3, -0.25, 0.3);
    rightFrontLeg.rotation.z = -Math.PI / 6;
    rightFrontLeg.rotation.x = Math.PI / 4;
    frogGroup.add(rightFrontLeg);
    
    // Arka bacaklar (daha uzun ve eklemli)
    const backLegGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.6, 8);
    
    const leftBackLeg = new THREE.Mesh(backLegGeometry, bodyMaterial);
    leftBackLeg.position.set(-0.35, -0.1, -0.3);
    leftBackLeg.rotation.z = Math.PI / 8;
    leftBackLeg.rotation.x = -Math.PI / 8;
    frogGroup.add(leftBackLeg);
    
    const rightBackLeg = new THREE.Mesh(backLegGeometry, bodyMaterial);
    rightBackLeg.position.set(0.35, -0.1, -0.3);
    rightBackLeg.rotation.z = -Math.PI / 8;
    rightBackLeg.rotation.x = -Math.PI / 8;
    frogGroup.add(rightBackLeg);
    
    // Arka bacak ayakları
    const footGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    
    const leftFoot = new THREE.Mesh(footGeometry, bodyMaterial);
    leftFoot.position.set(-0.45, -0.3, -0.5);
    leftFoot.scale.set(1, 0.5, 1.5);
    frogGroup.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, bodyMaterial);
    rightFoot.position.set(0.45, -0.3, -0.5);
    rightFoot.scale.set(1, 0.5, 1.5);
    frogGroup.add(rightFoot);
    
    return frogGroup;
  }

  /**
   * Kelebek modeli oluşturur
   * @returns {THREE.Group} Kelebek 3D modeli
   */
  function createButterfly() {
    const butterflyGroup = new THREE.Group();
    
    // Kelebek gövdesi (ince, uzun)
    const bodyGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 }); // Koyu gri
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2; // Yatay pozisyona getir
    butterflyGroup.add(body);
    
    // Rasgele renk seç
    const wingColors = [
      0xec4899, // Pembe
      0x3b82f6, // Mavi
      0xf97316, // Turuncu
      0x8b5cf6  // Mor
    ];
    const wingColor = wingColors[2]; // turuncu — sabit renk
    
    // Kanatlar için custom geometri (kalp şeklinde)
    function createWingShape() {
      const shape = new THREE.Shape();
      
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0, 0.5, 0.5, 0.5, 0.5, 0);
      shape.bezierCurveTo(0.5, -0.5, 0, -0.5, 0, 0);
      
      return shape;
    }
    
    const wingShape = createWingShape();
    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
      color: wingColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    
    // Sol üst kanat
    const leftUpperWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftUpperWing.position.set(-0.05, 0, 0.1);
    leftUpperWing.rotation.y = Math.PI / 2;
    leftUpperWing.rotation.x = -Math.PI / 8;
    leftUpperWing.scale.set(0.6, 0.6, 0.6);
    butterflyGroup.add(leftUpperWing);
    
    // Sağ üst kanat
    const rightUpperWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightUpperWing.position.set(-0.05, 0, 0.1);
    rightUpperWing.rotation.y = -Math.PI / 2;
    rightUpperWing.rotation.x = -Math.PI / 8;
    rightUpperWing.scale.set(0.6, 0.6, 0.6);
    butterflyGroup.add(rightUpperWing);
    
    // Sol alt kanat
    const leftLowerWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftLowerWing.position.set(-0.05, 0, -0.15);
    leftLowerWing.rotation.y = Math.PI / 2;
    leftLowerWing.rotation.x = Math.PI / 8;
    leftLowerWing.scale.set(0.5, 0.5, 0.5);
    butterflyGroup.add(leftLowerWing);
    
    // Sağ alt kanat
    const rightLowerWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightLowerWing.position.set(-0.05, 0, -0.15);
    rightLowerWing.rotation.y = -Math.PI / 2;
    rightLowerWing.rotation.x = Math.PI / 8;
    rightLowerWing.scale.set(0.5, 0.5, 0.5);
    butterflyGroup.add(rightLowerWing);
    
    // Antenler
    const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.005, 0.3, 4);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Siyah
    
    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntenna.position.set(-0.05, 0.1, 0.3);
    leftAntenna.rotation.x = -Math.PI / 4;
    leftAntenna.rotation.z = -Math.PI / 8;
    butterflyGroup.add(leftAntenna);
    
    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntenna.position.set(0.05, 0.1, 0.3);
    rightAntenna.rotation.x = -Math.PI / 4;
    rightAntenna.rotation.z = Math.PI / 8;
    butterflyGroup.add(rightAntenna);
    
    return butterflyGroup;
  }

  /**
   * Arı modeli oluşturur
   * @returns {THREE.Group} Arı 3D modeli
   */
  function createBee() {
    const beeGroup = new THREE.Group();
    
    // Arı gövdesi
    const abdomenGeometry = new THREE.SphereGeometry(0.3, 24, 24);
    const thoraxGeometry = new THREE.SphereGeometry(0.2, 24, 24);
    
    // Sarı-siyah çizgili materyal için gövde renkli bölümlerden oluşur
    const yellowMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15 }); // Sarı
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Siyah
    
    // Göğüs kısmı (thorax)
    const thorax = new THREE.Mesh(thoraxGeometry, blackMaterial);
    thorax.position.set(0, 0, 0.25);
    beeGroup.add(thorax);
    
    // Arka gövde (abdomen) - sarı-siyah çizgili
    const abdomen = new THREE.Mesh(abdomenGeometry, yellowMaterial);
    abdomen.position.set(0, 0, -0.15);
    abdomen.scale.set(0.8, 0.8, 1.2);
    beeGroup.add(abdomen);
    
    // Siyah çizgiler için halkalar ekle
    const stripesCount = 3;
    for (let i = 0; i < stripesCount; i++) {
      const stripeGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI * 2);
      const stripe = new THREE.Mesh(stripeGeometry, blackMaterial);
      stripe.position.set(0, 0, -0.1 - i * 0.2);
      stripe.rotation.x = Math.PI / 2;
      stripe.scale.set(0.8, 0.8, 0.8);
      beeGroup.add(stripe);
    }
    
    // Kanatlar (yarı saydam)
    const wingGeometry = new THREE.CircleGeometry(0.3, 16);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    // Sol kanat
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.25, 0.2, 0.1);
    leftWing.rotation.x = -Math.PI / 2;
    leftWing.rotation.z = -Math.PI / 6;
    beeGroup.add(leftWing);
    
    // Sağ kanat
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.25, 0.2, 0.1);
    rightWing.rotation.x = -Math.PI / 2;
    rightWing.rotation.z = Math.PI / 6;
    beeGroup.add(rightWing);
    
    // Gözler
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Koyu gri
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.1, 0.4);
    beeGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.1, 0.4);
    beeGroup.add(rightEye);
    
    // Antenler
    const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Siyah
    
    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntenna.position.set(-0.08, 0.15, 0.45);
    leftAntenna.rotation.x = -Math.PI / 4;
    leftAntenna.rotation.z = -Math.PI / 8;
    beeGroup.add(leftAntenna);
    
    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntenna.position.set(0.08, 0.15, 0.45);
    rightAntenna.rotation.x = -Math.PI / 4;
    rightAntenna.rotation.z = Math.PI / 8;
    beeGroup.add(rightAntenna);
    
    // İğne
    const stingGeometry = new THREE.ConeGeometry(0.03, 0.15, 8);
    const stingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Siyah
    const sting = new THREE.Mesh(stingGeometry, stingMaterial);
    sting.position.set(0, 0, -0.5);
    sting.rotation.x = Math.PI;
    beeGroup.add(sting);
    
    // Altı bacak
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.25, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Siyah
    
    // Ön, orta ve arka bacak çiftleri
    const legPositions = [
      { x: 0.15, y: -0.1, z: 0.3, rx: 0, ry: 0, rz: Math.PI / 4 },
      { x: -0.15, y: -0.1, z: 0.3, rx: 0, ry: 0, rz: -Math.PI / 4 },
      { x: 0.15, y: -0.1, z: 0.1, rx: 0, ry: 0, rz: Math.PI / 3 },
      { x: -0.15, y: -0.1, z: 0.1, rx: 0, ry: 0, rz: -Math.PI / 3 },
      { x: 0.15, y: -0.1, z: -0.1, rx: 0, ry: 0, rz: Math.PI / 2.5 },
      { x: -0.15, y: -0.1, z: -0.1, rx: 0, ry: 0, rz: -Math.PI / 2.5 }
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, pos.y, pos.z);
      leg.rotation.set(pos.rx, pos.ry, pos.rz);
      beeGroup.add(leg);
    });
    
    return beeGroup;
  }

  // Kategori bilgisi
  const category = {
    id: 'animal',
    name: 'Hayvanlar'
  };

  return {
    models: animals,
    category,
    createDog,
    createCat,
    createBird,
    createRabbit,
    createFish,
    createHorse,
    createTurtle,
    createElephant,
    createGiraffe,
    createLion,
    createSheep,
    createFrog,
    createButterfly,
    createBee
  };
} 