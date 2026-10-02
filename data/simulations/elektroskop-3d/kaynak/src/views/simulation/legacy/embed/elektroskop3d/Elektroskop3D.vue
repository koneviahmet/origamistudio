<template>
  <div ref="container" class="w-full h-full"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, inject } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const container = ref(null);
let scene, camera, renderer, controls;
let elektroskop, yapraklar, topuz, cisim, groundLine;
let animationFrameId = null;

// Kamera ayarlarını inject et
const cameraSettings = inject('cameraSettings', ref({ view: 'isometric' }));

// Elektroskop renklerini tanımla
const colors = {
  metal: 0x555555,
  glass: 0x88CCFF,
  gold: 0xFFCC00,
  positive: 0xFF4444,
  negative: 0x4444FF,
  neutral: 0xFFFFFF,
  platform: 0x222222
};

// Yük bilgi metnini oluştur
function createChargeInfo() {
  // HTML overlay için konteyner
  const infoDiv = document.createElement('div');
  infoDiv.style.position = 'absolute';
  infoDiv.style.top = '10px';
  infoDiv.style.left = '10px';
  infoDiv.style.padding = '8px';
  infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  infoDiv.style.color = 'white';
  infoDiv.style.borderRadius = '4px';
  infoDiv.style.fontSize = '14px';
  infoDiv.style.fontFamily = 'Arial, sans-serif';
  infoDiv.style.zIndex = '1000';
  
  // Yük bilgileri
  infoDiv.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <div style="width: 15px; height: 15px; background-color: #FF4444; margin-right: 8px; border-radius: 50%;"></div>
      <span>Kırmızı: Pozitif Yük (+)</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <div style="width: 15px; height: 15px; background-color: #4444FF; margin-right: 8px; border-radius: 50%;"></div>
      <span>Mavi: Negatif Yük (-)</span>
    </div>
    <div style="display: flex; align-items: center;">
      <div style="width: 15px; height: 15px; background-color: #FFCC00; margin-right: 8px; border-radius: 50%;"></div>
      <span>Sarı: Nötr (n)</span>
    </div>
  `;
  
  container.value.appendChild(infoDiv);
}

// 3D sahneyi oluştur
function setupScene() {
  // Sahne, kamera ve renderer oluştur
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f4f6);

  // Perspektif kamera oluştur
  camera = new THREE.PerspectiveCamera(50, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  
  // Renderer oluştur
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.shadowMap.enabled = true;
  container.value.appendChild(renderer.domElement);
  
  // Kamera kontrollerini oluştur
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  
  // Işıklar ekle
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);
  
  // Zemin ekle
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3;
  floor.receiveShadow = true;
  scene.add(floor);
  

 
}

// Kamera konumunu güncelle
function updateCameraPosition(view) {
  // Mevcut dönüşü ve pozisyonu kaydet
  const currentPos = camera.position.clone();
  
  switch(view) {
    case 'top':
      // Üstten görünüm
      camera.position.set(0, 15, 0);
      camera.up.set(0, 0, -1); // Yukarı yönü güncelle
      camera.lookAt(0, 0, 0);
      break;
    case 'front':
      // Önden görünüm
      camera.position.set(0, 0, 15);
      camera.up.set(0, 1, 0); // Yukarı yönü güncelle
      camera.lookAt(0, 0, 0);
      break;
    case 'side':
      // Yandan görünüm
      camera.position.set(15, 0, 0);
      camera.up.set(0, 1, 0); // Yukarı yönü güncelle
      camera.lookAt(0, 0, 0);
      break;
    case 'isometric':
      // İzometrik görünüm
      camera.position.set(10, 10, 10);
      camera.up.set(0, 1, 0); // Yukarı yönü güncelle
      camera.lookAt(0, 0, 0);
      break;
    case 'reset':
      // Varsayılan görünüm (izometrik)
      camera.position.set(10, 10, 10);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      break;
    default:
      // Değişiklik yok, mevcut kamera konumunu koru
      return;
  }
  
  // Kontrolleri güncelle
  controls.target.set(0, 0, 0);
  controls.update();
}

// Arkaplan rengini güncelle
function updateBackgroundColor(color) {
  if (!color) return;
  scene.background = new THREE.Color(color);
  
  // Duvarları ve zemini de güncelle
  scene.traverse((object) => {
    if (object.isMesh && 
        (object.geometry instanceof THREE.PlaneGeometry)) {
      object.material.color.set(color);
      object.material.needsUpdate = true;
    }
  });
}

// Elektroskop modelini oluştur
function createElektroskop() {
  elektroskop = new THREE.Group();
  
  // Platform
  const platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
  const platformMaterial = new THREE.MeshStandardMaterial({ color: colors.platform });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = -2.75;
  platform.castShadow = true;
  platform.receiveShadow = true;
  elektroskop.add(platform);
  
  // Cam fanus
  const glassGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 32, 1, true);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: colors.glass,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    transmission: 0.95
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.y = 0;
  elektroskop.add(glass);
  
  // Üst kapak
  const topCapGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
  const topCapMaterial = new THREE.MeshStandardMaterial({ color: colors.metal });
  const topCap = new THREE.Mesh(topCapGeometry, topCapMaterial);
  topCap.position.y = 2.6;
  topCap.castShadow = true;
  elektroskop.add(topCap);
  
  // Alt kapak
  const bottomCapGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
  const bottomCap = new THREE.Mesh(bottomCapGeometry, topCapMaterial);
  bottomCap.position.y = -2.4;
  bottomCap.receiveShadow = true;
  elektroskop.add(bottomCap);
  
  // Metal çubuk
  const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
  const rodMaterial = new THREE.MeshStandardMaterial({ color: colors.metal });
  const rod = new THREE.Mesh(rodGeometry, rodMaterial);
  rod.position.y = 0.8;
  rod.castShadow = true;
  elektroskop.add(rod);
  
  // Topuz - daha parlak ve dikkat çekici
  const knobGeometry = new THREE.SphereGeometry(0.6, 32, 32);
  const knobMaterial = new THREE.MeshStandardMaterial({ 
    color: colors.gold,
    metalness: 0.7,
    roughness: 0.2
  });
  topuz = new THREE.Mesh(knobGeometry, knobMaterial);
  topuz.position.y = 3.2;
  topuz.castShadow = true;
  elektroskop.add(topuz);
  
  // Yapraklar
  yapraklar = new THREE.Group();
  
  // Metal destek
  const supportGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
  const supportMaterial = new THREE.MeshStandardMaterial({ color: colors.metal });
  const support = new THREE.Mesh(supportGeometry, supportMaterial);
  support.position.y = -1;
  yapraklar.add(support);
  
  // Sol yaprak - daha büyük
  const leftLeafGeometry = new THREE.PlaneGeometry(0.3, 2.0);
  const leafMaterial = new THREE.MeshStandardMaterial({ 
    color: colors.gold, 
    side: THREE.DoubleSide,
    metalness: 0.5,
    roughness: 0.3
  });
  // Geometrinin merkez noktasını üst kısma taşı - pivot noktası değişiyor
  leftLeafGeometry.translate(0, -1.0, 0);
  const leftLeaf = new THREE.Mesh(leftLeafGeometry, leafMaterial);
  leftLeaf.position.set(-0.25, -1.0, 0);
  yapraklar.add(leftLeaf);
  
  // Sağ yaprak - daha büyük
  const rightLeafGeometry = new THREE.PlaneGeometry(0.3, 2.0);
  // Geometrinin merkez noktasını üst kısma taşı - pivot noktası değişiyor
  rightLeafGeometry.translate(0, -1.0, 0);
  const rightLeaf = new THREE.Mesh(rightLeafGeometry, leafMaterial);
  rightLeaf.position.set(0.25, -1.0, 0);
  yapraklar.add(rightLeaf);
  
  elektroskop.add(yapraklar);
  
  // Yük sembolleri için grup oluştur
  const chargeSymbols = new THREE.Group();
  elektroskop.add(chargeSymbols);
  
  scene.add(elektroskop);
  
  return elektroskop;
}

// Cisim animasyon değişkenleri
let cisimAnimating = false;
let cisimTargetX = 4;
let cisimTargetY = 3.5;
let cisimStartX = 4;
let cisimStartY = 3.5;
let cisimAnimProgress = 0;
let cisimAnimDuration = 30; // Animasyon frame sayısı

// Yaklaşan/dokunan cismi oluştur - tasarımı iyileştirildi
function createCisim() {
  cisim = new THREE.Group();
  
  // Cisim temel geometrisi - daha parlak
  const cisimGeometry = new THREE.SphereGeometry(0.7, 32, 32);
  const cisimMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x777777,
    metalness: 0.6,
    roughness: 0.3 
  });
  const cisimMesh = new THREE.Mesh(cisimGeometry, cisimMaterial);
  cisim.add(cisimMesh);
  
  // Sopa kısmı - kısaltılmış ve cismin üst kısmına sabitlenmiş
  const stickGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 16);
  const stickMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    metalness: 0.2,
    roughness: 0.7 
  });
  const stick = new THREE.Mesh(stickGeometry, stickMaterial);
  stick.position.y = 0; // Cismin üst kısmına doğru
  stick.position.x = 0; // Merkezde
  stick.position.z = 1; // Merkezde
  stick.rotation.x = Math.PI / 2; // Yatay konumda
  cisim.add(stick);
  
  // Tutacak kısmı - cismin üst kısmına sabitlendi
  const handleGeometry = new THREE.TorusGeometry(0.25, 0.06, 16, 32);
  const handleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    roughness: 0.8 
  });

  
  cisim.position.set(6, 3.8, 0); // Başlangıç pozisyonu - ekranın dışında
  cisim.rotation.z = -Math.PI / 6; // Daha doğal bir açı
  cisim.visible = false;
  
  scene.add(cisim);
  
  return cisim;
}

// Yük sembolleri grupları
let topuzYukler = [];
let cisimYukler = [];
let yaprakYukler = [];
let hareketEdenYukler = []; // Topuzdan yapraklara hareket eden yükler

// Yük sembollerini oluştur
function createChargeSymbols(count, type, target) {
  if (type === 'n') {
    // Hedef objeden yükleri temizle
    if (target === topuz) {
      // Topuz yüklerini temizle
      topuzYukler.forEach(yuk => scene.remove(yuk));
      topuzYukler = [];
    } else if (target === cisim) {
      // Cisim yüklerini temizle
      cisimYukler.forEach(yuk => scene.remove(yuk));
      cisimYukler = [];
    } else {
      // Yaprak yüklerini temizle
      yaprakYukler.forEach(yuk => yapraklar.remove(yuk));
      yaprakYukler = [];
    }
    return;
  }
  
  const color = type === '+' ? colors.positive : colors.negative;
  const yukler = [];
  
  for (let i = 0; i < count; i++) {
    // Basit bir küre ile sembolize et
    const symbolGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const symbolMaterial = new THREE.MeshBasicMaterial({ color });
    const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
    
    // Hedef objenin etrafında rastgele konumlandır
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = target === topuz ? 0.7 : 0.3;
    
    const offset = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    
    if (target === topuz) {
      symbol.position.copy(topuz.position).add(offset);
      symbol.userData.baseOffset = offset.clone(); // Baz pozisyonu kaydet
      symbol.userData.target = 'topuz';
      scene.add(symbol);
      topuzYukler.push(symbol);
      yukler.push(symbol);
    } else if (target === cisim) {
      symbol.position.copy(cisim.position).add(offset);
      symbol.userData.baseOffset = offset.clone(); // Baz pozisyonu kaydet
      symbol.userData.target = 'cisim';
      scene.add(symbol);
      cisimYukler.push(symbol);
      yukler.push(symbol);
    } else {
      // Yapraklar için özel konumlandırma
      const leafWidth = 0.3;
      const leafLength = 2.0;
      const randomX = ((Math.random() - 0.5) * leafWidth) + (i % 2 === 0 ? -0.25 : 0.25); // Sol veya sağ yaprak
      const randomY = -Math.random() * leafLength * 0.8 - 1.2; // Yaprak boyunca
      symbol.position.set(randomX, randomY, (Math.random() - 0.5) * 0.1);
      symbol.userData.basePosition = symbol.position.clone(); // Baz pozisyonu kaydet
      symbol.userData.target = 'yaprak';
      symbol.userData.leaf = i % 2 === 0 ? 'left' : 'right'; // Hangi yaprakta
      yapraklar.add(symbol);
      yaprakYukler.push(symbol);
      yukler.push(symbol);
    }
  }
  
  return yukler;
}



// Topraklama çizgisini çiz
function createGroundLine() {
  const groundGroup = new THREE.Group();
  
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
  
  // Yatay çizgi
  const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2, -2.5, 0),
    new THREE.Vector3(0, -2.5, 0)
  ]);
  const horizontalLine = new THREE.Line(horizontalGeometry, lineMaterial);
  groundGroup.add(horizontalLine);
  
  // Dikey çizgi
  const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2, -2.5, 0),
    new THREE.Vector3(-2, -4, 0)
  ]);
  const verticalLine = new THREE.Line(verticalGeometry, lineMaterial);
  groundGroup.add(verticalLine);
  
  // Toprak sembolü
  const groundSymbol1Geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2.5, -4, 0),
    new THREE.Vector3(-1.5, -4, 0)
  ]);
  const groundSymbol1 = new THREE.Line(groundSymbol1Geometry, lineMaterial);
  groundGroup.add(groundSymbol1);
  
  const groundSymbol2Geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2.3, -4.3, 0),
    new THREE.Vector3(-1.7, -4.3, 0)
  ]);
  const groundSymbol2 = new THREE.Line(groundSymbol2Geometry, lineMaterial);
  groundGroup.add(groundSymbol2);
  
  const groundSymbol3Geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2.1, -4.6, 0),
    new THREE.Vector3(-1.9, -4.6, 0)
  ]);
  const groundSymbol3 = new THREE.Line(groundSymbol3Geometry, lineMaterial);
  groundGroup.add(groundSymbol3);
  
  groundGroup.visible = false;
  scene.add(groundGroup);
  
  return groundGroup;
}

// Elektrostatik kuvvet çizgilerini göster
function createElectricFieldLines(source, target, type) {
  // Önceki çizgileri temizle
  scene.children.forEach(child => {
    if (child.isLine && child.userData.isFieldLine) {
      scene.remove(child);
    }
  });
  
  if (type === 'n' || !source.visible) return;
  
  const lineCount = 5;
  const lineColor = type === '+' ? 0xFF5555 : 0x5555FF;
  const material = new THREE.LineBasicMaterial({ color: lineColor });
  
  for (let i = 0; i < lineCount; i++) {
    const points = [];
    const startAngle = (Math.PI * 2 * i) / lineCount;
    
    const startPoint = new THREE.Vector3(
      source.position.x + Math.cos(startAngle) * 0.7,
      source.position.y + Math.sin(startAngle) * 0.7,
      source.position.z
    );
    
    const endPoint = new THREE.Vector3(
      target.position.x + Math.cos(startAngle + Math.PI) * 0.7,
      target.position.y + Math.sin(startAngle + Math.PI) * 0.7,
      target.position.z
    );
    
    const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
    midPoint.y += 0.5; // Hafif yukarı kıvrım
    
    points.push(startPoint);
    points.push(midPoint);
    points.push(endPoint);
    
    const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
    const curvePoints = curve.getPoints(10);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const line = new THREE.Line(geometry, material);
    line.userData.isFieldLine = true;
    
    scene.add(line);
  }
}

// Cismin pozisyonunu animasyonlu güncelle
function animateCisimPosition(targetX, targetY) {
  cisimAnimating = true;
  cisimStartX = cisim.position.x;
  cisimStartY = cisim.position.y;
  cisimTargetX = targetX;
  cisimTargetY = targetY;
  cisimAnimProgress = 0;
}

// Elektroskop durumunu güncelle - yapraklara animasyon eklendi
let isAnimating = false;
let currentLeftRotation = 0;
let currentRightRotation = 0;
let targetLeftRotation = 0;
let targetRightRotation = 0;
let prevTopuzType = 'n';
let prevYaprakType = 'n';

// Tüm yükleri temizle
function clearAllCharges() {
  // Topuz yüklerini temizle
  topuzYukler.forEach(yuk => scene.remove(yuk));
  topuzYukler = [];
  
  // Cisim yüklerini temizle
  cisimYukler.forEach(yuk => scene.remove(yuk));
  cisimYukler = [];
  
  // Yaprak yüklerini temizle
  yaprakYukler.forEach(yuk => yapraklar.remove(yuk));
  yaprakYukler = [];
  
  // Hareket eden yükleri temizle
  hareketEdenYukler.forEach(yuk => scene.remove(yuk));
  hareketEdenYukler = [];
}

function updateElektroskopState() {
  // Topraklama durumunu kontrol et
  if (props.item.topraklama) {
    // Topraklama aktifse tüm yükleri temizle
    clearAllCharges();
    // Toprak rengine dön
    topuz.material.color.set(colors.gold);
    const leftLeaf = yapraklar.children[1];
    const rightLeaf = yapraklar.children[2];
    leftLeaf.material.color.set(colors.gold);
    rightLeaf.material.color.set(colors.gold);
    
    // Topraklama gösterimi
    groundLine.visible = true;
    return;
  }
  
  // Yük transferini kontrol et
  const currentTopuzType = props.item.topuz;
  const currentYaprakType = props.item.yaprak;
  
  // Eğer topuz ve yaprak yükleri arasında bir değişiklik varsa ve ikisi de nötr değilse
  if ((prevTopuzType !== currentTopuzType || prevYaprakType !== currentYaprakType) && 
      (currentTopuzType !== 'n' || currentYaprakType !== 'n')) {

  }
  
  prevTopuzType = currentTopuzType;
  prevYaprakType = currentYaprakType;
  
  // Topuz yükünü güncelle
  switch (props.item.topuz) {
    case '+':
      topuz.material.color.set(colors.positive);
      createChargeSymbols(8, '+', topuz);
      break;
    case '-':
      topuz.material.color.set(colors.negative);
      createChargeSymbols(8, '-', topuz);
      break;
    default:
      topuz.material.color.set(colors.gold);
      createChargeSymbols(0, 'n', topuz);
  }
  
  // Yaprakların durumunu ve yükünü güncelle
  const leftLeaf = yapraklar.children[1];
  const rightLeaf = yapraklar.children[2];
  
  // Hedef rotasyonları belirle - işaretleri değiştirerek alt kısmın açılmasını sağla
  switch (props.item.yaprakdurumu) {
    case 0: // Kapalı 
      targetLeftRotation = 0;
      targetRightRotation = 0;
      break;
    case 1: // Az açık
      targetLeftRotation = -Math.PI / 12; // Negatif değer = alt kısım dışa açılır
      targetRightRotation = Math.PI / 12;  // Pozitif değer = alt kısım dışa açılır
      break;
    case 2: // Orta açık
      targetLeftRotation = -Math.PI / 6;
      targetRightRotation = Math.PI / 6;
      break;
    case 3: // Çok açık
      targetLeftRotation = -Math.PI / 4;
      targetRightRotation = Math.PI / 4;
      break;
    default:
      targetLeftRotation = 0;
      targetRightRotation = 0;
  }
  
  // Animasyonu başlat
  isAnimating = true;
  
  // Yaprakların rengini yüke göre ayarla
  let yapraksColor;
  switch (props.item.yaprak) {
    case '+':
      yapraksColor = colors.positive;
      createChargeSymbols(8, '+', yapraklar);
      break;
    case '-':
      yapraksColor = colors.negative;
      createChargeSymbols(8, '-', yapraklar);
      break;
    default:
      yapraksColor = colors.gold;
      createChargeSymbols(0, 'n', yapraklar);
  }
  
  leftLeaf.material.color.set(yapraksColor);
  rightLeaf.material.color.set(yapraksColor);
  
  // Cismi güncelle
  const prevVisibility = cisim.visible;
  cisim.visible = props.item.cisimdurumu !== false;
  
  if (cisim.visible) {
    // İlk kez gösteriliyorsa animasyonu başlat
    if (!prevVisibility) {
      // Cismi ekranın dışından başlat
      cisim.position.x = 6;
      cisim.position.y = 3.5;
    }
    
    // Cismin hedef pozisyonunu belirleme ve animasyonu başlat
    if (props.item.cisimdurumu === 'd') { // Dokunan
      animateCisimPosition(0.6, 3.5); // Topuza dokunacak kadar yakın
    } else { // Yaklaşan
      animateCisimPosition(2.0, 3.5); // Yakın ama dokunmayacak kadar
    }
    
    // Cismi topuzun üst kısmına doğru döndür
    cisim.lookAt(topuz.position.x, topuz.position.y + 0.4, topuz.position.z);
    cisim.rotation.y += Math.PI; // 180 derece döndürme
    
    // Cismin yükünü güncelle
    let cisimColor;
    switch (props.item.cisim) {
      case '+':
        cisimColor = colors.positive;
        createChargeSymbols(8, '+', cisim);
        // Elektrik alan çizgilerini kaldırıldı
        break;
      case '-':
        cisimColor = colors.negative;
        createChargeSymbols(8, '-', cisim);
        // Elektrik alan çizgilerini kaldırıldı
        break;
      default:
        cisimColor = 0x777777;
        createChargeSymbols(0, 'n', cisim);
    }
    cisim.children[0].material.color.set(cisimColor);
  } else if (prevVisibility) {
    // Cisim görünmez hale geldiğinde, ekranın dışına çıkar
    animateCisimPosition(6, 3.5);
  }
  
  // Topraklama gösterimi
  groundLine.visible = props.item.topraklama;
}

// Yeniden boyutlandırma işlevi
function handleResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

// Animasyon döngüsü - yapraklar, cisim ve yükler için animasyon
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  // Yaprak animasyonu
  if (isAnimating) {
    const leftLeaf = yapraklar.children[1];
    const rightLeaf = yapraklar.children[2];
    
    // Sol yaprak animasyonu
    const leftDiff = targetLeftRotation - currentLeftRotation;
    if (Math.abs(leftDiff) > 0.01) {
      currentLeftRotation += leftDiff * 0.1;
      leftLeaf.rotation.z = currentLeftRotation;
    } else {
      currentLeftRotation = targetLeftRotation;
      leftLeaf.rotation.z = currentLeftRotation;
    }
    
    // Sağ yaprak animasyonu
    const rightDiff = targetRightRotation - currentRightRotation;
    if (Math.abs(rightDiff) > 0.01) {
      currentRightRotation += rightDiff * 0.1;
      rightLeaf.rotation.z = currentRightRotation;
    } else {
      currentRightRotation = targetRightRotation;
      rightLeaf.rotation.z = currentRightRotation;
      
      // Animasyon tamamlandı mı?
      if (Math.abs(leftDiff) <= 0.01 && Math.abs(rightDiff) <= 0.01) {
        isAnimating = false;
      }
    }
    
    // Yapraklardaki yüklerin konumunu güncelle
    yaprakYukler.forEach(yuk => {
      const isLeft = yuk.userData.leaf === 'left';
      const leaf = isLeft ? leftLeaf : rightLeaf;
      const rotation = isLeft ? currentLeftRotation : currentRightRotation;
      
      // Yaprak dönüşüne göre yük pozisyonlarını güncelle
      const base = yuk.userData.basePosition.clone();
      
      // Rotasyon matrisini oluştur
      const rotMatrix = new THREE.Matrix4();
      rotMatrix.makeRotationZ(rotation);
      
      // Baz pozisyonu döndür
      base.applyMatrix4(rotMatrix);
      
      // Yük pozisyonunu güncelle
      yuk.position.copy(base);
    });
  }
  
  // Cisim animasyonu
  if (cisimAnimating) {
    cisimAnimProgress++;
    
    // Easeout animasyon için kübik easing fonksiyonu
    const t = Math.min(1, cisimAnimProgress / cisimAnimDuration);
    const easedT = 1 - Math.pow(1 - t, 3); // Cubic easeout
    
    // Cismin pozisyonunu güncelle
    cisim.position.x = cisimStartX + (cisimTargetX - cisimStartX) * easedT;
    cisim.position.y = cisimStartY + (cisimTargetY - cisimStartY) * easedT;
    
    // Cismin yüklerini de güncelle
    cisimYukler.forEach(yuk => {
      yuk.position.x = cisim.position.x + yuk.userData.baseOffset.x;
      yuk.position.y = cisim.position.y + yuk.userData.baseOffset.y;
      yuk.position.z = cisim.position.z + yuk.userData.baseOffset.z;
    });
    
    // Animasyon tamamlandı mı?
    if (cisimAnimProgress >= cisimAnimDuration) {
      cisimAnimating = false;
    }
  }
  
  // Topuzdan yapraklara hareket eden yüklerin animasyonu
  const now = Date.now();
  hareketEdenYukler = hareketEdenYukler.filter(yuk => {
    // Animasyon başlamadıysa bekle
    if (now < yuk.userData.startTime) return true;
    
    // Geçen süreyi hesapla
    const elapsed = now - yuk.userData.startTime;
    const duration = yuk.userData.duration;
    
    // Animasyon tamamlandı mı?
    if (elapsed >= duration) {
      scene.remove(yuk);
      return false; // Listeyi filtreleyerek bu yükü çıkar
    }
    
    // Animasyon ilerlemesi (0-1 arası)
    const progress = elapsed / duration;
    
    // Sinüs eğrisine bağlı Y pozisyonu hesapla (daha doğal bir hareket)
    const startY = yuk.userData.startY;
    const endY = yuk.userData.endY;
    const endX = yuk.userData.endX;
    
    // Easing ile yeni pozisyon
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic easeout
    
    // İzleyeceği yol için orta nokta (çubuk boyunca)
    const midY = (startY + endY) / 2;
    
    // Yükün Y pozisyonunu güncelle
    let currentY = startY;
    let currentX = 0;
    
    if (progress < 0.5) {
      // İlk yarı: Topuzdan çubuğa
      currentY = startY + (midY - startY) * (progress * 2);
    } else {
      // İkinci yarı: Çubuktan yapraklara
      currentY = midY + (endY - midY) * ((progress - 0.5) * 2);
      currentX = endX * ((progress - 0.5) * 2); // X'e doğru hareket
    }
    
    yuk.position.set(currentX, currentY, 0);
    
    return true;
  });
  
  controls.update();
  renderer.render(scene, camera);
}

// Komponent bağlantı noktaları
onMounted(() => {
  setupScene();
  createElektroskop();
  cisim = createCisim();
  groundLine = createGroundLine();
  createChargeInfo(); // Yük bilgisi ekranını ekle
  updateElektroskopState();
  
  // İlk kamera görünümünü ayarla
  updateCameraPosition(cameraSettings.value.view || 'isometric');
  
  window.addEventListener('resize', handleResize);
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  cancelAnimationFrame(animationFrameId);
  
  if (renderer) {
    renderer.dispose();
    
    if (container.value && container.value.contains(renderer.domElement)) {
      container.value.removeChild(renderer.domElement);
    }
  }
  
  // Yük bilgi metnini temizle - container kontrolü eklendi
  if (container.value) {
    const infoDivs = container.value.querySelectorAll('div');
    infoDivs.forEach(div => {
      if (div.innerHTML.includes('Kırmızı: Pozitif')) {
        container.value.removeChild(div);
      }
    });
  }
});

// Kamera ayarlarını izle
watch(() => cameraSettings.value, (newSettings) => {
  if (newSettings.view) {
    updateCameraPosition(newSettings.view);
  }
  
  if (newSettings.bgColor) {
    updateBackgroundColor(newSettings.bgColor);
  }
}, { deep: true });

// Props değişikliklerini izle
watch(() => props.item, (newItem) => {
  updateElektroskopState();
}, { deep: true });
</script> 