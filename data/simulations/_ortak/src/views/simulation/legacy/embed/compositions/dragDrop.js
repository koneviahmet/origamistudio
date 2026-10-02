import { ref, reactive, computed, onMounted, watch } from "vue";


export default function () {
  const isFinish = ref(false)
  const dragIndex = ref(null)
  const dropReadyIndex = ref(null)
  const dragsList = ref([])
  const drops = ref([])
  const fullscreen = ref(true)
  const tableSize  = ref(true)
  const checkAnswer = ref({})
  const isShufle    = ref(true)
  const event       = ref('drag')
  const lastDroped  = ref(null)

  watch(checkAnswer, (answer) => {
    let randId = Math.floor(Math.random() * 100000);  
    lastDroped.value = {...drags.value[answer.dragIndex], randId, dragIndex: answer.dragIndex};

    drops.value[answer.dropIndex]  = {...drags.value[answer.dragIndex]}
    setTimeout(() => {
      const trueSize = drops.value.filter(i => i.result).length
      const dragSize = drags.value.length    
      if (trueSize == dragSize) isFinish.value = true 
    }, 400);

  }, {deep: true})

  const refresh = () => {
      isFinish.value = false
      drops.value = []
  }
  
  const setDrags = (newDrags) => {   
    dragsList.value = [...newDrags]
  }

  const drags = computed(() => {
      let index = 0
      
      if (isShufle.value) {
        return reactive(shuffle(dragsList.value.map(i => {
            return {...i, index: index++}
        })))
      }

      return reactive(dragsList.value.map(i => {
          return {...i, index: index++}
      }))
  })

  
  const payload = (e) => {        
      dragIndex.value = e
  }
  
  
  const dropStyle = (key) => {
      let s = " text-xs flex items-center justify-center "
      if ((typeof dragIndex.value == 'number') && (dropReadyIndex.value == key)) s += " border-2 border-red-500"

      if (drops.value?.[key]?.result) s += ' bg-green-300 '  
      else if(typeof drops.value?.[key]?.result != 'undefined') s += 'boder-2 bg-red-300 '
      if (typeof drops.value?.[key]?.result == 'undefined') s += ' bg-gray-200'

      
      return s
  }
  
  
  const handleMouseMove = (e) => {
      if (typeof dragIndex.value !== 'number') return;
      if (event.value == 'click') return;
      
      // preventDefault ekleyerek sayfanın kaydırılmasını engelle
      e.preventDefault();

      // Check if it's a touch event or mouse event
      let clientX = e.clientX || (e.touches && e.touches[0].clientX);
      let clientY = e.clientY || (e.touches && e.touches[0].clientY);

      if (!clientX || !clientY) return; // No valid touch/mouse data

      const ghostElement = document.querySelector('.drag');
      const leftMenu = document.querySelector('.left-menu');
      
      let leftMenuWidth = parseInt(leftMenu?.style?.width || 0);
      let left = fullscreen.value ? clientX : clientX - (tableSize.value?.left + leftMenuWidth);
      let top = fullscreen.value ? clientY : clientY - tableSize.value?.top;
        
      // Sürüklenen öğe için pozisyon ve görünürlük ayarla
      drags.value[dragIndex.value].show = event.value == 'drag';
      drags.value[dragIndex.value].style = `top: ${top}px; left: ${left}px; z-index: 1000000; transform: translate(-50%, -50%);`;
      
      // Sürükleme sırasında drop alanlarını kontrol et
      checkDropTargets(clientX, clientY);
  };
  
  // Drop hedeflerini kontrol etmek için yeni bir fonksiyon
  const checkDropTargets = (x, y) => {
      let mouseOver = false;
      
      // Tüm olası drop alanlarını seç
      const dropTargets = document.querySelectorAll('.drop-target');
      
      // Her bir drop alanını kontrol et
      dropTargets.forEach((element) => {
          const rect = element.getBoundingClientRect();
          // Koordinatlar drop alanı içinde mi kontrol et
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
              // data-index özelliğinden anahtarı al
              const key = parseInt(element.getAttribute('data-index'));
              if (!isNaN(key)) {
                  dropReadyIndex.value = key;
                  mouseOver = true;
                  console.log(`Drop hedefi bulundu: ${key}, koordinatlar: ${x},${y}`);
              }
          }
      });
      
      // Hiçbir hedefin üzerinde değilse
      if (!mouseOver) {
          dropReadyIndex.value = null;
      }
  };

  const handleTouchMove = (e) => {
    // Dokunma olayını engelle, fakat eğer sürükleme olayı değilse işlemden çık
    if (event.value == 'click') return;
    
    // Sayfanın kaydırma davranışını engelle - çok önemli
    e.preventDefault(); 
    e.stopPropagation();
    
    const touch = e.touches[0];
    if (!touch) return; // Touch bilgisi yoksa çık
    
    const x = touch.clientX;
    const y = touch.clientY;
    
    console.log(`Touch hareket: ${x},${y}, dragIndex: ${dragIndex.value}`);

    // Sürükleme sırasında hayalet element için pozisyon hesapla
    if (typeof dragIndex.value === 'number') {
        const leftMenu = document.querySelector('.left-menu');
        let leftMenuWidth = parseInt(leftMenu?.style?.width || 0);
        let left = fullscreen.value ? x : x - (tableSize.value?.left + leftMenuWidth);
        let top = fullscreen.value ? y : y - tableSize.value?.top;
        
        // Dragged item style
        drags.value[dragIndex.value].show = true;
        drags.value[dragIndex.value].style = `top: ${top}px; left: ${left}px; z-index: 1000000; transform: translate(-50%, -50%);`;
    } else {
        console.warn('dragIndex null - sürükleme başlatılamadı');
    }
    
    // Drop hedeflerini kontrol et - aynı checkDropTargets fonksiyonunu kullan
    checkDropTargets(x, y);
  };
  
  // Touch ile sürükleme başlatacak yeni fonksiyon
  const handleTouchStart = (key, e) => {
    console.log(`Touch start: ${key}`);
    e.preventDefault();
    e.stopPropagation();
    
    // Sürükleme değişkenlerini ayarla
    dragIndex.value = key;
    event.value = 'drag';
    
    // İlk touch noktasını kaydet
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // Sürükleme görseli için başlangıç pozisyonu ayarla
    if (typeof dragIndex.value === 'number') {
      const leftMenu = document.querySelector('.left-menu');
      let leftMenuWidth = parseInt(leftMenu?.style?.width || 0);
      let left = fullscreen.value ? x : x - (tableSize.value?.left + leftMenuWidth);
      let top = fullscreen.value ? y : y - tableSize.value?.top;
      
      // Göster ve pozisyonla
      drags.value[dragIndex.value].show = true;
      drags.value[dragIndex.value].style = `top: ${top}px; left: ${left}px; z-index: 1000000; transform: translate(-50%, -50%);`;
    }
    
    // Olay dinleyicilerini ekle
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', end, { passive: false });
  };
  
  // Debug için yardımcı fonksiyon - drop alanlarını görselleştir
  const debugDropTargets = () => {
    const dropTargets = document.querySelectorAll('.drop-target');
    console.log(`${dropTargets.length} drop hedefi bulundu:`);
    
    dropTargets.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      console.log(`Drop #${index}: data-index=${el.getAttribute('data-index')}, rect=${JSON.stringify(rect)}`);
      
      // Görsel bir gösterge ekleyelim
      el.style.border = '2px solid red';
      setTimeout(() => {
        el.style.border = '';
      }, 1000);
    });
  };

  const start = (size, fs = false) => {
      tableSize.value = size
      fullscreen.value = fs
      
      // Debug - drop alanlarını kontrol et
      setTimeout(debugDropTargets, 500);
      
      // Global event dinleyicilerini kaldıralım, bunları daha düşük seviyede uygulamaya taşıdık
      // document.addEventListener('mousemove', handleMouseMove, { passive: false });
      // document.addEventListener('touchmove', handleTouchMove, { passive: false });
      // document.addEventListener('touchend', end);
      // document.addEventListener('mouseup', end);
  };
  
  
  const end = () => {   
      if (typeof dragIndex.value === 'number' && typeof dropReadyIndex.value === 'number') {
        checkAnswer.value = {dragIndex: dragIndex.value, dropIndex: dropReadyIndex.value};
      }
      
      // Sürükleme bittiğinde item'ları göster
      if (dragIndex.value !== null && drags.value[dragIndex.value]) {
        drags.value[dragIndex.value].show = false;
      }
      
      // Sürükleme değişkenlerini sıfırla
      dragIndex.value = null;
      dropReadyIndex.value = null;
      event.value = 'drag';

      // Event dinleyicilerini temizle
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', end);
      document.removeEventListener('mouseup', end);
  };
  
  const dragClick = (key) => {
    event.value = 'click'
    dragIndex.value = key
  }

  const dropClick = (key) => {
    dropReadyIndex.value = key
    end()
  }

  const shuffle = (array) => {
      if (!isShufle.value) array
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)); // 0 ile i arasında rastgele bir indeks
          [array[i], array[j]] = [array[j], array[i]];   // İki elemanın yerini değiştir
      }
      return array;
  }
  
  return {
    setDrags,
    drags,
    drops,
    dropStyle,
    refresh,
    checkAnswer,
    payload,
    start,
    end,
    isFinish,
    dragIndex,
    dropReadyIndex,
    handleTouchMove,
    handleTouchStart,
    isShufle,
    dragClick,
    dropClick,
    lastDroped,
    event
  };
}
