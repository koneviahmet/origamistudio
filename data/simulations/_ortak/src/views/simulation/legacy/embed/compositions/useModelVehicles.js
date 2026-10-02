import * as THREE from 'three';

/**
 * Araç modellerini içeren modül
 * @returns {Object} Araç kategorisi ve modeller
 */
export default function useModelVehicles() {
  const category = {
    id: 'vehicle',
    name: 'Araçlar'
  };


  

  // Araba modeli oluşturma fonksiyonu - Düzeltilmiş tekerlek konumları ve rotasyonları
  function createCar() {
    const car = new THREE.Group();
    
    // Araba gövdesi
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    body.position.y = 0.6;
    car.add(body);
    
    // Araba üst kısmı (kabin)
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x3366cc })
    );
    cabin.position.set(-0.5, 1.6, 0);
    car.add(cabin);
    
    // Pencereler
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 })
    );
    window.position.set(-0.5, 1.6, 0);
    car.add(window);
    
    // Tekerlekler - Düzeltilmiş versiyon
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    // Ön sağ tekerlek
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.position.set(1.2, 0.4, 1);
    wheel1.rotation.x = Math.PI / 2; // Tekerlek düzgün yönde
    car.add(wheel1);
    
    // Ön sol tekerlek
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.position.set(1.2, 0.4, -1);
    wheel2.rotation.x = Math.PI / 2;
    car.add(wheel2);
    
    // Arka sağ tekerlek
    const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel3.position.set(-1.2, 0.4, 1);
    wheel3.rotation.x = Math.PI / 2;
    car.add(wheel3);
    
    // Arka sol tekerlek
    const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel4.position.set(-1.2, 0.4, -1);
    wheel4.rotation.x = Math.PI / 2;
    car.add(wheel4);
    
    // Tampon
    const frontBumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 2),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    frontBumper.position.set(2, 0.5, 0);
    car.add(frontBumper);
    
    // Farlar
    const headlightGeometry = new THREE.CircleGeometry(0.2, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc });
    
    const headlight1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight1.position.set(2, 0.7, 0.7);
    headlight1.rotation.y = Math.PI / 2;
    car.add(headlight1);
    
    const headlight2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight2.position.set(2, 0.7, -0.7);
    headlight2.rotation.y = Math.PI / 2;
    car.add(headlight2);
    
    return car;
  }

  // Uçak modeli oluşturma fonksiyonu - Bu model değiştirilmeyecek
  function createAirplane() {
    const airplane = new THREE.Group();
    
    // Gövde
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 6, 16, 1, false),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    body.rotation.z = Math.PI / 2;
    airplane.add(body);
    
    // Burun
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    nose.position.set(3.75, 0, 0);
    nose.rotation.z = -Math.PI / 2;
    airplane.add(nose);
    
    // Kanatlar
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.2, 7);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 0, 0);
    airplane.add(wings);
    
    // Kuyruk
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 2),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    tail.position.set(-3, 0, 0);
    airplane.add(tail);
    
    // Dikey kuyruk
    const verticalTail = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    verticalTail.position.set(-3, 0.8, 0);
    airplane.add(verticalTail);
    
    // Kokpit camı
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 })
    );
    cockpit.position.set(2, 0.35, 0);
    cockpit.rotation.x = Math.PI;
    cockpit.rotation.z = -Math.PI / 2;
    airplane.add(cockpit);
    
    return airplane;
  }

  // Motosiklet modeli oluşturma fonksiyonu - Düzeltilmiş tekerlek konumları ve rotasyonları
  function createMotorcycle() {
    const motorcycle = new THREE.Group();
    
    // Gövde
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xcc0000 })
    );
    body.position.y = 0.6;
    motorcycle.add(body);
    
    // Motor bloğu
    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    engine.position.set(0, 0.4, 0);
    engine.rotation.x = Math.PI / 2;
    motorcycle.add(engine);
    
    // Tekerlekler - Düzeltilmiş versiyon
    const wheelGeometry = new THREE.TorusGeometry(0.5, 0.15, 16, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    // Ön tekerlek
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.position.set(0.8, 0.1, 0);
    wheel1.rotation.x = Math.PI * 2; // Tekerlek doğru yönlendirme
    motorcycle.add(wheel1);
    
    // Arka tekerlek
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.position.set(-0.8, 0.1, 0);
    wheel2.rotation.x = Math.PI * 2; // Tekerlek doğru yönlendirme
    motorcycle.add(wheel2);
    
    // Ön çatal
    const fork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    fork.position.set(0.8, 0.9, 0);
    motorcycle.add(fork);
    
    // Gidon
    const handlebar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    handlebar.position.set(0.8, 1.2, 0);
    handlebar.rotation.x = Math.PI / 2;
    motorcycle.add(handlebar);
    
    // Sele
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    seat.position.set(-0.2, 0.85, 0);
    motorcycle.add(seat);
    
    // Yakıt deposu
    const tank = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xcc0000 })
    );
    tank.position.set(0.3, 0.9, 0);
    tank.rotation.x = Math.PI;
    tank.scale.set(1, 0.6, 1);
    motorcycle.add(tank);
    
    return motorcycle;
  }

  // Bisiklet modeli oluşturma fonksiyonu - Düzeltilmiş tekerlek konumları ve rotasyonları
  function createBicycle() {
    const bicycle = new THREE.Group();
    
    // Tekerlekler - Düzeltilmiş
    const wheelGeometry = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    // Ön tekerlek
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.position.set(0.8, 0.5, 0);
    wheel1.rotation.x = Math.PI * 2; // Tekerlek doğru yönlendirme
    bicycle.add(wheel1);
    
    // Arka tekerlek
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.position.set(-0.8, 0.5, 0);
    wheel2.rotation.x = Math.PI * 2; // Tekerlek doğru yönlendirme
    bicycle.add(wheel2);
    
    // Kadro (ana üçgen)
    const mainTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    mainTube.position.set(0, 0.8, 0);
    mainTube.rotation.z = -Math.PI / 6;
    bicycle.add(mainTube);
    
    const downTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    downTube.position.set(0.3, 0.6, 0);
    downTube.rotation.z = Math.PI / 3;
    bicycle.add(downTube);
    
    const seatTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    seatTube.position.set(-0.5, 0.9, 0);
    seatTube.rotation.z = Math.PI / 12;
    bicycle.add(seatTube);
    
    // Zincir aktarımı
    const chainRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.03, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    chainRing.position.set(-0.2, 0.5, 0.1);
    chainRing.rotation.y = Math.PI / 2;
    bicycle.add(chainRing);
    
    // Pedallar
    const pedalGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.25);
    const pedalMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const pedal1 = new THREE.Mesh(pedalGeometry, pedalMaterial);
    pedal1.position.set(-0.2, 0.3, 0.2);
    bicycle.add(pedal1);
    
    const pedal2 = new THREE.Mesh(pedalGeometry, pedalMaterial);
    pedal2.position.set(-0.2, 0.3, -0.2);
    bicycle.add(pedal2);
    
    // Ön çatal ve gidon
    const fork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x0066cc })
    );
    fork.position.set(0.8, 0.8, 0);
    bicycle.add(fork);
    
    // Gidon
    const handlebar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    handlebar.position.set(0.8, 1.1, 0);
    handlebar.rotation.x = Math.PI / 2;
    bicycle.add(handlebar);
    
    // Sele
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    seat.position.set(-0.5, 1.2, 0);
    bicycle.add(seat);
    
    return bicycle;
  }

  // Gemi modeli oluşturma fonksiyonu - Daha gerçekçi ve detaylı
  function createShip() {
    const ship = new THREE.Group();
    
    // Ana gövde
    const hullGeometry = new THREE.BoxGeometry(6, 1.5, 2.2);
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x444455 });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 0.75;
    ship.add(hull);
    
    // Ön taraf (sivri)
    const bowGeometry = new THREE.ConeGeometry(1.1, 2, 16);
    const bowMaterial = new THREE.MeshStandardMaterial({ color: 0x444455 });
    const bow = new THREE.Mesh(bowGeometry, bowMaterial);
    bow.position.set(3.5, 0.75, 0);
    bow.rotation.z = -Math.PI / 2;
    bow.scale.set(1, 1.1, 1);
    ship.add(bow);
    
    // Üst güverte
    const deckGeometry = new THREE.BoxGeometry(5, 0.2, 2);
    const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x885533 });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 1.6, 0);
    ship.add(deck);
    
    // Üst yapılar
    const cabin1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    cabin1.position.set(-1, 2.2, 0);
    ship.add(cabin1);
    
    const cabin2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    cabin2.position.set(-1, 3.2, 0);
    ship.add(cabin2);
    
    // Baca 1
    const chimney1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6600 })
    );
    chimney1.position.set(0.5, 2.5, 0);
    ship.add(chimney1);
    
    // Baca 2
    const chimney2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6600 })
    );
    chimney2.position.set(1.5, 2.5, 0);
    ship.add(chimney2);
    
    // Korkuluklar - Ön kısım
    const railingFront = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    railingFront.position.set(2.5, 1.7, 0);
    ship.add(railingFront);
    
    // Korkuluklar - Yan kısımlar
    const railingSide1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    railingSide1.position.set(0.5, 1.7, 1);
    ship.add(railingSide1);
    
    const railingSide2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    railingSide2.position.set(0.5, 1.7, -1);
    ship.add(railingSide2);
    
    return ship;
  }

  // Kayık modeli oluşturma fonksiyonu - Daha gerçekçi tasarım
  function createBoat() {
    const boat = new THREE.Group();
    
    // Gövde
    const hullGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 12, 1, false, 0, Math.PI);
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.z = Math.PI / 2;
    hull.rotation.y = Math.PI;
    boat.add(hull);
    
    // Ön kısım - daha sivri
    const bowGeometry = new THREE.ConeGeometry(0.8, 1, 12, 1, false, 0, Math.PI);
    const bowMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const bow = new THREE.Mesh(bowGeometry, bowMaterial);
    bow.position.set(2, 0, 0);
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.y = Math.PI;
    boat.add(bow);
    
    // Arka kısım
    const sternGeometry = new THREE.ConeGeometry(1.2, 0.5, 12, 1, false, 0, Math.PI);
    const sternMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const stern = new THREE.Mesh(sternGeometry, sternMaterial);
    stern.position.set(-2, 0, 0);
    stern.rotation.z = Math.PI / 2;
    stern.rotation.y = Math.PI;
    boat.add(stern);
    
    // İç kaplama
    const innerHull = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.1, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xa67c52 })
    );
    innerHull.position.set(0, 0.1, 0);
    innerHull.rotation.x = Math.PI * 0.06;
    boat.add(innerHull);
    
    // Koltuklar
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.1, 1.6);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    
    const seat1 = new THREE.Mesh(seatGeometry, seatMaterial);
    seat1.position.set(1, 0.3, 0);
    boat.add(seat1);
    
    const seat2 = new THREE.Mesh(seatGeometry, seatMaterial);
    seat2.position.set(-1, 0.3, 0);
    boat.add(seat2);
    
    // Kürekler
    const oarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8);
    const oarMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    
    const oar1 = new THREE.Mesh(oarGeometry, oarMaterial);
    oar1.position.set(0, 0.3, 1);
    oar1.rotation.z = Math.PI / 4;
    boat.add(oar1);
    
    const oar2 = new THREE.Mesh(oarGeometry, oarMaterial);
    oar2.position.set(0, 0.3, -1);
    oar2.rotation.z = Math.PI / 4;
    boat.add(oar2);
    
    // Kürek uç kısımları
    const paddleGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.2);
    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0xa67c52 });
    
    const paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle1.position.set(0.9, 0.9, 1);
    paddle1.rotation.z = Math.PI / 4;
    boat.add(paddle1);
    
    const paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle2.position.set(0.9, 0.9, -1);
    paddle2.rotation.z = Math.PI / 4;
    boat.add(paddle2);
    
    return boat;
  }

  // Tren modeli oluşturma fonksiyonu - Düzeltilmiş tekerlek konumları
  function createTrain() {
    const train = new THREE.Group();
    
    // Ana gövde
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x3366aa })
    );
    body.position.y = 1.4;
    train.add(body);
    
    // Ön kısım
    const front = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.7, 16, 1, false, Math.PI * 2, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x3366aa })
    );
    front.position.set(3, 1.4, 0);
    front.rotation.z = Math.PI /2;
    train.add(front);
    
    // Baca
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    chimney.position.set(2, 3, 0);
    train.add(chimney);
    
    // Baca üstü
    const chimneyTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    chimneyTop.position.set(2, 3.5, 0);
    train.add(chimneyTop);
    
    // Kabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    cabin.position.set(-1, 2.7, 0);
    train.add(cabin);
    
    // Kabin penceresi
    const cabinWindow = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.6, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 })
    );
    cabinWindow.position.set(-1, 2.7, 0);
    train.add(cabinWindow);
    
    // Tekerlekler - Düzeltilmiş versiyon
    const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const wheelsPositions = [
      [2, 0.6, 1.1], [2, 0.6, -1.1],
      [0, 0.6, 1.1], [0, 0.6, -1.1],
      [-2, 0.6, 1.1], [-2, 0.6, -1.1]
    ];
    
    wheelsPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(...pos);
      wheel.rotation.x = Math.PI / 2; // Tekerlek doğru yönlendirme
      train.add(wheel);
    });
    
    // Tekerlekleri bağlayan akslar
    const axleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const axleMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    
    const axles = [
      [2, 0.6, 0],
      [0, 0.6, 0],
      [-2, 0.6, 0]
    ];
    
    axles.forEach(pos => {
      const axle = new THREE.Mesh(axleGeometry, axleMaterial);
      axle.position.set(...pos);
      train.add(axle);
    });
    
    // Tampon
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    bumper.position.set(3.1, 0.8, 0);
    train.add(bumper);
    
    // Tren rayları
    const railsGeometry = new THREE.BoxGeometry(10, 0.1, 0.3);
    const railsMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    
    const rail1 = new THREE.Mesh(railsGeometry, railsMaterial);
    rail1.position.set(0, 0.05, 1.1);
    train.add(rail1);
    
    const rail2 = new THREE.Mesh(railsGeometry, railsMaterial);
    rail2.position.set(0, 0.05, -1.1);
    train.add(rail2);
    
    // Traversler
    const tieGeometry = new THREE.BoxGeometry(0.4, 0.08, 2.6);
    const tieMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
    
    for (let i = -5; i <= 5; i += 1) {
      const tie = new THREE.Mesh(tieGeometry, tieMaterial);
      tie.position.set(i, 0, 0);
      train.add(tie);
    }
    
    return train;
  }

  // Modeller listesi
  const models = [
    {
      id: 'car',
      name: 'Araba',
      create: createCar
    },
    {
      id: 'airplane',
      name: 'Uçak',
      create: createAirplane
    },
    {
      id: 'motorcycle',
      name: 'Motosiklet',
      create: createMotorcycle
    },
    {
      id: 'bicycle',
      name: 'Bisiklet',
      create: createBicycle
    },
    {
      id: 'ship',
      name: 'Gemi',
      create: createShip
    },
    {
      id: 'boat',
      name: 'Kayık',
      create: createBoat
    },
    {
      id: 'train',
      name: 'Tren',
      create: createTrain
    }
  ];

  return {
    category,
    models
  };
} 