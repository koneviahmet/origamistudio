import * as THREE from 'three';

/**
 * İnsan modellerini içeren modül
 * @returns {Object} İnsan kategorisi ve modeller
 */
export default function useModelHumans() {
  const category = {
    id: 'human',
    name: 'İnsanlar'
  };

  // Göz ve ağız oluşturma yardımcı fonksiyonu
  function createFacialFeatures(head) {
    // Sol göz
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    leftEye.position.set(0.06, 0.02, 0.16);
    head.add(leftEye);

    // Sağ göz
    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    rightEye.position.set(-0.06, 0.02, 0.16);
    head.add(rightEye);

    // Ağız
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x942525 })
    );
    mouth.position.set(0, -0.08, 0.18);
    head.add(mouth);
  }

  // Çocuk modeli oluşturma fonksiyonu
  function createChild() {
    const child = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 0.8;
    createFacialFeatures(head);
    child.add(head);
    
    // Saç - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x995500 })
    );
    hair.position.set(0, 0.85, -0.02);
    hair.rotation.x = -Math.PI / 12;
    child.add(hair);
    
    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    body.position.y = 0.45;
    child.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3344aa });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.07, 0.2, 0);
    child.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.07, 0.2, 0);
    child.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.22, 0.5, 0);
    leftArm.rotation.z = Math.PI / 8;
    child.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.22, 0.5, 0);
    rightArm.rotation.z = -Math.PI / 8;
    child.add(rightArm);

    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.15);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.07, 0, 0.03);
    child.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.07, 0, 0.03);
    child.add(rightFoot);
    
    // Boyutu küçültülmüş çocuk
    child.scale.set(0.8, 0.8, 0.8);
    
    return child;
  }

  // Kadın modeli oluşturma fonksiyonu
  function createWoman() {
    const woman = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.3;
    createFacialFeatures(head);
    woman.add(head);
    
    // Saç
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x663300 })
    );
    hair.position.set(0, 1.34, -0.02);
    hair.rotation.x = -Math.PI / 12;
    woman.add(hair);

    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.25, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0xcc6699 })
    );
    body.position.y = 0.85;
    woman.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.25, 0);
    woman.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.25, 0);
    woman.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xcc6699 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.27, 0.95, 0);
    leftArm.rotation.z = Math.PI / 8;
    woman.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.27, 0.95, 0);
    rightArm.rotation.z = -Math.PI / 8;
    woman.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.18);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.04);
    woman.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.04);
    woman.add(rightFoot);
    
    return woman;
  }

  // Erkek/Adam modeli oluşturma fonksiyonu
  function createMan() {
    const man = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.4;
    createFacialFeatures(head);
    man.add(head);
    
    // Kısa saç - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    hair.position.set(0, 1.45, -0.02);
    hair.rotation.x = -Math.PI / 12;
    man.add(hair);

    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    body.position.y = 0.95;
    man.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.3, 0);
    man.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.3, 0);
    man.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.32, 1.05, 0);
    leftArm.rotation.z = Math.PI / 8;
    man.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.32, 1.05, 0);
    rightArm.rotation.z = -Math.PI / 8;
    man.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.05);
    man.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.05);
    man.add(rightFoot);
    
    return man;
  }

  /**
   * Yürüyen adam modeli oluşturma fonksiyonu
   * @returns {THREE.Group} Yürüme animasyonu uygulanan adam modeli
   */
  function createManWalking() {
    const man = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.4;
    createFacialFeatures(head);
    man.add(head);
    
    // Kısa saç
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    hair.position.set(0, 1.45, -0.02);
    hair.rotation.x = -Math.PI / 12;
    man.add(hair);

    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    body.position.y = 0.95;
    man.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.3, 0);
    // Bacağın dönüş merkezini ayarla
    leftLeg.geometry.translate(0, 0.3, 0);
    leftLeg.position.y = 0;
    // Objeyi eksen etrafında tanımla
    leftLeg.name = "leftLeg";
    man.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.3, 0);
    // Bacağın dönüş merkezini ayarla
    rightLeg.geometry.translate(0, 0.3, 0);
    rightLeg.position.y = 0;
    // Objeyi eksen etrafında tanımla
    rightLeg.name = "rightLeg";
    man.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.32, 1.05, 0);
    // Kolun dönüş merkezini ayarla
    leftArm.geometry.translate(0, -0.3, 0);
    leftArm.position.y = 1.35;
    // Objeyi eksen etrafında tanımla
    leftArm.name = "leftArm";
    man.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.32, 1.05, 0);
    // Kolun dönüş merkezini ayarla
    rightArm.geometry.translate(0, -0.3, 0);
    rightArm.position.y = 1.35;
    // Objeyi eksen etrafında tanımla
    rightArm.name = "rightArm";
    man.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.05);
    man.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.05);
    man.add(rightFoot);
    
    // Yürüme animasyonunu uygula
    man.userData.animationFunc = (object, clock, speed = 1) => {
      const time = clock.getElapsedTime() * speed * 2;
      
      // Kol ve bacakların animasyonu
      const leftLeg = object.getObjectByName("leftLeg");
      const rightLeg = object.getObjectByName("rightLeg");
      const leftArm = object.getObjectByName("leftArm");
      const rightArm = object.getObjectByName("rightArm");
      
      if (leftLeg && rightLeg && leftArm && rightArm) {
        // Kol ve bacakları birbirine zıt yönde hareket ettir
        leftLeg.rotation.x = Math.sin(time) * 0.5;
        rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.5;
        leftArm.rotation.x = Math.sin(time + Math.PI) * 0.5;
        rightArm.rotation.x = Math.sin(time) * 0.5;
      }
      
      // Hafif bir yürüme hareketi oluştur
      if (object.position.y > 0) {
        object.position.y = 0.05 * Math.abs(Math.sin(time * 2)) + 0.01;
      }
      
      // İleri doğru yürüme hareketi (bu kısmı kullanırken sahnede konumu ayarlamak gerekebilir)
      // object.position.z += 0.01 * speed;
    };
    
    return man;
  }
  
  /**
   * Zıplayan adam modeli oluşturma fonksiyonu
   * @returns {THREE.Group} Zıplama animasyonu uygulanan adam modeli
   */
  function createManJumping() {
    const man = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.4;
    createFacialFeatures(head);
    man.add(head);
    
    // Kısa saç
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    hair.position.set(0, 1.45, -0.02);
    hair.rotation.x = -Math.PI / 12;
    man.add(hair);

    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    body.position.y = 0.95;
    man.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.3, 0);
    leftLeg.name = "leftLeg";
    man.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.3, 0);
    rightLeg.name = "rightLeg";
    man.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.32, 1.05, 0);
    leftArm.name = "leftArm";
    man.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.32, 1.05, 0);
    rightArm.name = "rightArm";
    man.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.05);
    man.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.05);
    man.add(rightFoot);
    
    // Zıplama animasyonunu uygula
    man.userData.animationFunc = (object, clock, speed = 1) => {
      const time = clock.getElapsedTime() * speed;
      
      // Zıplama döngüsünü hesapla
      const jumpCycle = (time % 2); // 2 saniyelik bir döngü
      
      // Zıplama hareketi
      if (jumpCycle < 0.2) {
        // Hazırlık (çömelme)
        object.position.y = 0;
        object.scale.y = 0.9;
        
        // Bacakları çömelme pozisyonuna getir
        const leftLeg = object.getObjectByName("leftLeg");
        const rightLeg = object.getObjectByName("rightLeg");
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = -0.2;
          rightLeg.rotation.x = -0.2;
        }
      } else if (jumpCycle < 1.0) {
        // Zıplama yükselişi
        const jumpHeight = Math.sin((jumpCycle - 0.2) * Math.PI);
        object.position.y = jumpHeight * 0.5; // Zıplama yüksekliği
        object.scale.y = 1 + (jumpHeight * 0.1); // Hafif uzama
        
        // Kolları yukarı kaldır
        const leftArm = object.getObjectByName("leftArm");
        const rightArm = object.getObjectByName("rightArm");
        if (leftArm && rightArm) {
          const armRaiseAmount = Math.min(jumpCycle * 2, 1) * 0.7;
          leftArm.rotation.z = Math.PI / 8 - armRaiseAmount;
          rightArm.rotation.z = -Math.PI / 8 + armRaiseAmount;
        }
      } else if (jumpCycle < 1.2) {
        // İniş (yere çarpma)
        object.position.y = 0;
        object.scale.y = 0.9;
        
        // Bacakları iniş pozisyonuna getir
        const leftLeg = object.getObjectByName("leftLeg");
        const rightLeg = object.getObjectByName("rightLeg");
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = -0.2;
          rightLeg.rotation.x = -0.2;
        }
      } else {
        // Bekleme süresi
        object.position.y = 0;
        object.scale.y = 1;
        
        // Kolları ve bacakları normal pozisyona getir
        const leftLeg = object.getObjectByName("leftLeg");
        const rightLeg = object.getObjectByName("rightLeg");
        const leftArm = object.getObjectByName("leftArm");
        const rightArm = object.getObjectByName("rightArm");
        
        if (leftLeg && rightLeg && leftArm && rightArm) {
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          leftArm.rotation.z = Math.PI / 8;
          rightArm.rotation.z = -Math.PI / 8;
        }
      }
    };
    
    return man;
  }
  
  /**
   * Sevinen/kutlayan adam modeli oluşturma fonksiyonu
   * @returns {THREE.Group} Sevinme animasyonu uygulanan adam modeli
   */
  function createManCelebrating() {
    const man = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.4;
    head.name = "head";
    createFacialFeatures(head);
    man.add(head);
    
    // Kısa saç
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    hair.position.set(0, 1.45, -0.02);
    hair.rotation.x = -Math.PI / 12;
    man.add(hair);

    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    body.position.y = 0.95;
    body.name = "body";
    man.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.3, 0);
    // Bacağın dönüş merkezini ayarla
    leftLeg.geometry.translate(0, 0.3, 0);
    leftLeg.position.y = 0;
    leftLeg.name = "leftLeg";
    man.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.3, 0);
    // Bacağın dönüş merkezini ayarla
    rightLeg.geometry.translate(0, 0.3, 0);
    rightLeg.position.y = 0;
    rightLeg.name = "rightLeg";
    man.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.32, 1.05, 0);
    // Kolun dönüş merkezini ayarla
    leftArm.geometry.translate(0, -0.3, 0);
    leftArm.position.y = 1.35;
    leftArm.name = "leftArm";
    man.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.32, 1.05, 0);
    // Kolun dönüş merkezini ayarla
    rightArm.geometry.translate(0, -0.3, 0);
    rightArm.position.y = 1.35;
    rightArm.name = "rightArm";
    man.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.05);
    man.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.05);
    man.add(rightFoot);
    
    // Sevinme/kutlama animasyonunu uygula
    man.userData.animationFunc = (object, clock, speed = 1) => {
      const time = clock.getElapsedTime() * speed;
      
      // Kollar
      const leftArm = object.getObjectByName("leftArm");
      const rightArm = object.getObjectByName("rightArm");
      
      if (leftArm && rightArm) {
        // Kolları yukarı kaldırıp aşağı indirme hareketi
        leftArm.rotation.z = Math.PI / 8 + Math.sin(time * 5) * 0.8;
        rightArm.rotation.z = -Math.PI / 8 - Math.sin(time * 5) * 0.8;
      }
      
      // Vücut ve baş
      const body = object.getObjectByName("body");
      const head = object.getObjectByName("head");
      
      if (body && head) {
        // Vücudu sağa sola döndürme
        body.rotation.y = Math.sin(time * 3) * 0.2;
        
        // Başı hareket ettirme
        head.rotation.z = Math.sin(time * 2) * 0.1;
      }
      
      // Hafif zıplama hareketi
      object.position.y = Math.max(0, Math.sin(time * 4) * 0.1);
      
      // Bacaklar
      const leftLeg = object.getObjectByName("leftLeg");
      const rightLeg = object.getObjectByName("rightLeg");
      
      if (leftLeg && rightLeg) {
        // Bacakları hareket ettirme
        if (object.position.y > 0.05) {
          // Zıplama sırasında bacakları hafif bük
          leftLeg.rotation.x = -0.3;
          rightLeg.rotation.x = -0.3;
        } else {
          // Yerdeyken bacakları sallamayı dene
          leftLeg.rotation.x = Math.sin(time * 4) * 0.2;
          rightLeg.rotation.x = -Math.sin(time * 4) * 0.2;
        }
      }
    };
    
    return man;
  }

  // Genç modeli oluşturma fonksiyonu
  function createYoungPerson() {
    const youngPerson = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.35;
    createFacialFeatures(head);
    youngPerson.add(head);
    
    // Modern saç stili - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.15, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x995500 })
    );
    hair.position.set(0, 1.48, -0.02);
    hair.rotation.x = -Math.PI / 12;
    youngPerson.add(hair);

    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.23, 0.65, 32),
      new THREE.MeshStandardMaterial({ color: 0xdd4444 })
    );
    body.position.y = 0.9;
    youngPerson.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x222266 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.09, 0.275, 0);
    youngPerson.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.09, 0.275, 0);
    youngPerson.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xdd4444 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.27, 1.0, 0);
    leftArm.rotation.z = Math.PI / 6; // Hafif dışa dönük
    youngPerson.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.27, 1.0, 0);
    rightArm.rotation.z = -Math.PI / 6; // Hafif dışa dönük
    youngPerson.add(rightArm);
    
    // Spor ayakkabılar
    const footGeometry = new THREE.BoxGeometry(0.14, 0.07, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.09, 0, 0.05);
    youngPerson.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.09, 0, 0.05);
    youngPerson.add(rightFoot);
    
    return youngPerson;
  }

  // Yaşlı (dede) modeli oluşturma fonksiyonu
  function createGrandfather() {
    const grandfather = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.3;
    createFacialFeatures(head);
    grandfather.add(head);
    
    // Saç (seyrek) - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee })
    );
    hair.position.set(0, 1.38, -0.02);
    hair.rotation.x = -Math.PI / 12;
    grandfather.add(hair);
    
    // Gözlük
    const glassesFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.01, 16, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    glassesFrame.position.set(0, 1.33, 0.15);
    glassesFrame.rotation.x = Math.PI / 2;
    grandfather.add(glassesFrame);
    
    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x556677 })
    );
    body.position.y = 0.85;
    grandfather.add(body);
    
    // Bacaklar (hafif eğik)
    const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.25, 0);
    leftLeg.rotation.z = -Math.PI / 30;
    grandfather.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.25, 0);
    rightLeg.rotation.z = Math.PI / 30;
    grandfather.add(rightLeg);
    
    // Baston
    const caneGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    const caneMaterial = new THREE.MeshStandardMaterial({ color: 0x855E42 });
    const cane = new THREE.Mesh(caneGeometry, caneMaterial);
    cane.position.set(0.3, 0.6, 0.1);
    cane.rotation.x = Math.PI / 12;
    cane.rotation.z = -Math.PI / 15;
    grandfather.add(cane);
    
    // El (baston tutan)
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    hand.position.set(0.3, 1.0, 0.05);
    grandfather.add(hand);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x556677 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.25, 0.95, 0);
    leftArm.rotation.z = Math.PI / 8;
    grandfather.add(leftArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.05);
    grandfather.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.05);
    grandfather.add(rightFoot);
    
    return grandfather;
  }

  // Yaşlı (nine) modeli oluşturma fonksiyonu
  function createGrandmother() {
    const grandmother = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.25;
    createFacialFeatures(head);
    grandmother.add(head);
    
    // Saç (topuz) - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee })
    );
    hair.position.set(0, 1.42, -0.02);
    grandmother.add(hair);
    
    // Gözlük
    const glassesFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.01, 16, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    glassesFrame.position.set(0, 1.28, 0.15);
    glassesFrame.rotation.x = Math.PI / 2;
    grandmother.add(glassesFrame);
    
    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.55, 32),
      new THREE.MeshStandardMaterial({ color: 0x9370DB })
    );
    body.position.y = 0.8;
    grandmother.add(body);
    
    // Etek
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0x9370DB })
    );
    skirt.position.y = 0.5;
    grandmother.add(skirt);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xf5d0c5 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.25, 0);
    grandmother.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.25, 0);
    grandmother.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x9370DB });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.25, 0.9, 0);
    leftArm.rotation.z = Math.PI / 6;
    grandmother.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.25, 0.9, 0);
    rightArm.rotation.z = -Math.PI / 6;
    grandmother.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.15);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0.1, 0.04);
    grandmother.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0.1, 0.04);
    grandmother.add(rightFoot);
    
    return grandmother;
  }

  // Doktor modeli oluşturma fonksiyonu
  function createDoctor() {
    const doctor = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.4;
    createFacialFeatures(head);
    doctor.add(head);
    
    // Saç - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    hair.position.set(0, 1.45, -0.02);
    hair.rotation.x = -Math.PI / 12;
    doctor.add(hair);
    
    // Beyaz önlük gövde
    const coat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.8, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    coat.position.y = 0.9;
    doctor.add(coat);
    
    // Boyun/yakalık
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.04, 16, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee })
    );
    collar.position.set(0, 1.2, 0);
    collar.rotation.x = Math.PI / 2;
    doctor.add(collar);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.1, 0.3, 0);
    doctor.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.1, 0.3, 0);
    doctor.add(rightLeg);
    
    // Kollar (beyaz önlük)
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.3, 0.95, 0);
    leftArm.rotation.z = Math.PI / 8;
    doctor.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.3, 0.95, 0);
    rightArm.rotation.z = -Math.PI / 8;
    doctor.add(rightArm);
    
    // Stetoskop
    const stethoScope = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.01, 8, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    stethoScope.position.set(0, 1.1, 0.05);
    stethoScope.rotation.x = Math.PI / 3;
    doctor.add(stethoScope);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.1, 0, 0.05);
    doctor.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.1, 0, 0.05);
    doctor.add(rightFoot);
    
    return doctor;
  }

  // Amca modeli oluşturma fonksiyonu
  function createUncle() {
    const uncle = new THREE.Group();
    
    // Baş
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5d0c5 })
    );
    head.position.y = 1.4;
    createFacialFeatures(head);
    uncle.add(head);
    
    // Saç - yeniden konumlandırıldı
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    hair.position.set(0, 1.45, -0.02);
    hair.rotation.x = -Math.PI / 12;
    uncle.add(hair);
    
    // Bıyık
    const mustache = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.03, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    mustache.position.set(0, 1.32, 0.19);
    uncle.add(mustache);
    
    // Vücut
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.26, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0x996633 })
    );
    body.position.y = 0.9;
    uncle.add(body);
    
    // Bacaklar
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.12, 0.3, 0);
    uncle.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.12, 0.3, 0);
    uncle.add(rightLeg);
    
    // Kollar
    const armGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x996633 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.34, 0.95, 0);
    leftArm.rotation.z = Math.PI / 8;
    uncle.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.34, 0.95, 0);
    rightArm.rotation.z = -Math.PI / 8;
    uncle.add(rightArm);
    
    // Ayaklar
    const footGeometry = new THREE.BoxGeometry(0.16, 0.06, 0.22);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(0.12, 0, 0.06);
    uncle.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(-0.12, 0, 0.06);
    uncle.add(rightFoot);
    
    return uncle;
  }

  // Modeller dizisi
  const models = [
    {
      id: 'child',
      name: 'Çocuk',
      create: createChild
    },
    {
      id: 'woman',
      name: 'Kadın',
      create: createWoman
    },
    {
      id: 'man',
      name: 'Erkek',
      create: createMan
    },
    {
      id: 'manWalking',
      name: 'Yürüyen Erkek',
      create: createManWalking
    },
    {
      id: 'manJumping',
      name: 'Zıplayan Erkek',
      create: createManJumping
    },
    {
      id: 'manCelebrating',
      name: 'Sevinen Erkek',
      create: createManCelebrating
    },
    {
      id: 'youngPerson',
      name: 'Genç',
      create: createYoungPerson
    },
    {
      id: 'grandfather',
      name: 'Dede',
      create: createGrandfather
    },
    {
      id: 'grandmother',
      name: 'Nine',
      create: createGrandmother
    },
    {
      id: 'doctor',
      name: 'Doktor',
      create: createDoctor
    },
    {
      id: 'uncle',
      name: 'Amca',
      create: createUncle
    }
  ];

  return {
    category,
    models
  };
} 