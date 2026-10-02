<template>
  <div class="h-screen bg-gray-600 overflow-auto">


    <!-- Element Seçim Alanı -->
    <div class="w-full flex justify-center my-6 px-4">
      <select 
        v-model="selectedElement" 
        class="w-full max-w-md p-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="element in elements" :key="element.atomicNumber" :value="element">
          {{ element.name }} ({{ element.symbol }})
        </option>
      </select>
    </div>

    <!-- Element Bilgileri ve Atom Modeli -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mx-auto max-w-7xl">

      <!-- Atom Modeli -->
      <div class="flex items-center justify-center bg-gray-500 p-6 rounded-lg">
        <div class="relative w-64 h-64">
          <!-- Nucleus -->
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-medium text-white z-10">
            {{ selectedElement?.symbol }}
          </div>
          
          <!-- Electron Shells -->
          <template v-for="(shell, index) in electronShells" :key="index">
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-300"
                 :style="getShellStyle(index)">
            </div>
            
            <!-- Electrons in this shell -->
            <div v-for="electron in getElectronsInShell(index)" :key="`${index}-${electron}`"
                 class="absolute w-3 h-3 bg-blue-500 rounded-full z-20"
                 :style="getElectronPosition(index, electron)">
            </div>
          </template>
        </div>
      </div>


      <!-- Element Detayları -->
      <div v-if="selectedElement" class="bg-gray-800 p-6 rounded-lg text-white mb-20">
        <h2 class="text-2xl font-medium mb-4">{{ selectedElement.name }} <span class="text-xl">({{ selectedElement.symbol }})</span></h2>
        
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="text-gray-300">Atom Numarası:</div>
          <div class="text-white">{{ selectedElement.atomicNumber }}</div>
          
          <div class="text-gray-300">Türü:</div>
          <div class="text-white">{{ selectedElement.type }}</div>
          

          <div class="text-gray-300">Periyot:</div>
          <div class="text-white">{{ selectedElement.period }}</div>
          
          <div class="text-gray-300">Grup:</div>
          <div class="text-white">{{ selectedElement.group }}</div>
        </div>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-gray-300 font-medium mb-2">Özellikleri:</h3>
            <p class="text-sm text-white">{{ selectedElement.properties }}</p>
          </div>
          
          <div>
            <h3 class="text-gray-300 font-medium mb-2">Kullanım Alanları:</h3>
            <p class="text-sm text-white">{{ selectedElement.uses }}</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Element Data
const elements = [
  {
    atomicNumber: 1,
    symbol: 'H',
    name: 'Hidrojen',
    type: 'Ametal',
    electronConfiguration: '1s¹',
    period: 1,
    group: '1A',
    electrons: [1],
    properties: 'En basit ve en hafif elementtir. Yanıcıdır. Renksiz, kokusuz ve tatsız bir gazdır. Evrendeki en bol elementtir.',
    uses: 'Amonyak üretiminde, yakıt olarak, hidrojen peroksit üretiminde, yağların sertleştirilmesinde ve gıda endüstrisinde kullanılır. Ayrıca temiz enerji kaynağı olarak hidrojen yakıt hücrelerinde kullanılmaktadır.'
  },
  {
    atomicNumber: 2,
    symbol: 'He',
    name: 'Helyum',
    type: 'Soygaz',
    electronConfiguration: '1s²',
    period: 1,
    group: '8A',
    electrons: [2],
    properties: 'Hafif, yanmaz bir soygaz. Renksiz, kokusuz ve tatsızdır. Hidrojenden sonra evrende en bol bulunan ikinci elementtir.',
    uses: 'Balonlarda, zeplinde, derin dalış tüplerinde, MRI cihazlarında soğutucu olarak, sıvı roket yakıtlarında ve sızıntı tespitinde kullanılır.'
  },
  {
    atomicNumber: 3,
    symbol: 'Li',
    name: 'Lityum',
    type: 'Metal',
    electronConfiguration: '1s²2s¹',
    period: 2,
    group: '1A',
    electrons: [2, 1],
    properties: 'Alkali metal. Yumuşak, gümüş-beyaz renklidir. Doğada serbest halde bulunmaz. Yüksek reaktiviteye sahiptir.',
    uses: 'Şarj edilebilir pillerde, seramik ve cam üretiminde, hava temizleme sistemlerinde, nükleer reaktörlerde ve psikiyatrik ilaçlarda kullanılır.'
  },
  {
    atomicNumber: 4,
    symbol: 'Be',
    name: 'Berilyum',
    type: 'Metal',
    electronConfiguration: '1s²2s²',
    period: 2,
    group: '2A',
    electrons: [2, 2],
    properties: 'Toprak alkali metal. Sert, hafif ve kırılgandır. Gri renklidir. Toksiktir ve doğada serbest halde bulunmaz.',
    uses: 'Uzay araçlarında, nükleer reaktörlerde, bilgisayar parçalarında, X-ışını tüplerinde ve telekomünikasyon ekipmanlarında kullanılır.'
  },
  {
    atomicNumber: 5,
    symbol: 'B',
    name: 'Bor',
    type: 'Yarı-Metal',
    electronConfiguration: '1s²2s²2p¹',
    period: 2,
    group: '3A',
    electrons: [2, 3],
    properties: 'Metaloid. Siyah-kahverengi kristal halde bulunur. Yüksek erime noktasına sahiptir. Doğada genellikle borat mineralleri şeklinde bulunur.',
    uses: 'Cam ve seramik üretiminde, deterjan ve temizlik ürünlerinde, tarım gübrelerinde, nükleer reaktörlerde ve ilaç endüstrisinde kullanılır.'
  },
  {
    atomicNumber: 6,
    symbol: 'C',
    name: 'Karbon',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p²',
    period: 2,
    group: '4A',
    electrons: [2, 4],
    properties: 'Yaşamın temel yapıtaşı. Grafit, elmas gibi allotropları var. Doğada serbest ve bileşik halinde bulunur. Organik bileşiklerin temel elementidir.',
    uses: 'Çelik üretiminde, yakıt olarak, kurşun kalemlerde, filtrelerde, elektronik cihazlarda, mücevherlerde ve karbon fiber malzemelerde kullanılır.'
  },
  {
    atomicNumber: 7,
    symbol: 'N',
    name: 'Azot',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p³',
    period: 2,
    group: '5A',
    electrons: [2, 5],
    properties: 'Atmosferin %78\'ini oluşturan renksiz ve kokusuz gaz. Düşük reaktiviteye sahiptir. Proteinlerin ve nükleik asitlerin yapısında bulunur.',
    uses: 'Gübre üretiminde, patlayıcı yapımında, gıdaların dondurularak kurutulmasında, elektronik endüstrisinde ve soğutucu olarak kullanılır.'
  },
  {
    atomicNumber: 8,
    symbol: 'O',
    name: 'Oksijen',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p⁴',
    period: 2,
    group: '6A',
    electrons: [2, 6],
    properties: 'Atmosferin %21\'ini oluşturan, yaşam için gerekli gaz. Renksiz, kokusuz ve tatsızdır. Yüksek reaktiviteye sahiptir.',
    uses: 'Tıbbi uygulamalarda, çelik üretiminde, roket yakıtlarında, kimyasal sentezlerde ve su arıtma işlemlerinde kullanılır.'
  },
  {
    atomicNumber: 9,
    symbol: 'F',
    name: 'Flor',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p⁵',
    period: 2,
    group: '7A',
    electrons: [2, 7],
    properties: 'En reaktif ametal. Soluk sarı renkte gaz. Doğada serbest halde bulunmaz. Çok zehirlidir ve aşındırıcıdır.',
    uses: 'Diş macunlarında, teflon üretiminde, alüminyum üretiminde, soğutucu gazlarda ve uranyum zenginleştirmede kullanılır.'
  },
  {
    atomicNumber: 10,
    symbol: 'Ne',
    name: 'Neon',
    type: 'Soygaz',
    electronConfiguration: '1s²2s²2p⁶',
    period: 2,
    group: '8A',
    electrons: [2, 8],
    properties: 'Parlak kırmızı-turuncu neon ışıklarında kullanılır. Renksiz, kokusuz ve tatsız bir gazdır. Çok düşük reaktiviteye sahiptir.',
    uses: 'Neon ışıklı tabelalarda, yüksek voltaj göstergelerinde, televizyon tüplerinde, lazer üretiminde ve soğutma sistemlerinde kullanılır.'
  },
  {
    atomicNumber: 11,
    symbol: 'Na',
    name: 'Sodyum',
    type: 'Metal',
    electronConfiguration: '1s²2s²2p⁶3s¹',
    period: 3,
    group: '1A',
    electrons: [2, 8, 1],
    properties: 'Alkali metal. Yumuşak, gümüş-beyaz renklidir. Suda hızla reaksiyona girer. Doğada genellikle tuz (NaCl) şeklinde bulunur.',
    uses: 'Tuz üretiminde, sokak lambalarında, sabun yapımında, cam üretiminde, metalürjide ve nükleer reaktörlerde soğutucu olarak kullanılır.'
  },
  {
    atomicNumber: 12,
    symbol: 'Mg',
    name: 'Magnezyum',
    type: 'Metal',
    electronConfiguration: '1s²2s²2p⁶3s²',
    period: 3,
    group: '2A',
    electrons: [2, 8, 2],
    properties: 'Toprak alkali metal. Hafif, gümüş-beyaz renkli metal. Yanıcıdır ve parlak beyaz ışık verir. Klorofil molekülünün merkezinde bulunur.',
    uses: 'Hafif alaşımlarda, piroteknikte, flaş fotoğrafçılıkta, elektronik cihazlarda ve tarım gübrelerinde kullanılır.'
  },
  {
    atomicNumber: 13,
    symbol: 'Al',
    name: 'Alüminyum',
    type: 'Metal',
    electronConfiguration: '1s²2s²2p⁶3s²3p¹',
    period: 3,
    group:  '3A',
    electrons: [2, 8, 3],
    properties: 'Hafif, gümüş renkli, korozyona dirençli metal. Yeryüzünde en bol bulunan metaldir. İyi bir elektrik ve ısı iletkenidir.',
    uses: 'Uçak yapımında, inşaat sektöründe, ambalaj malzemelerinde, elektrik iletiminde, mutfak eşyalarında ve otomobil parçalarında kullanılır.'
  },
  {
    atomicNumber: 14,
    symbol: 'Si',
    name: 'Silisyum',
    type: 'Yarı-Metal',
    electronConfiguration: '1s²2s²2p⁶3s²3p²',
    period: 3,
    group: '4A',
    electrons: [2, 8, 4],
    properties: 'Metaloid. Yeryüzünde bol bulunan, yarı iletken element. Koyu gri-mavi renkli kristal yapıdadır. Oksijenden sonra yer kabuğunda en çok bulunan elementtir.',
    uses: 'Bilgisayar çiplerinde, güneş panellerinde, cam üretiminde, seramiklerde, silikon ürünlerde ve elektronik cihazlarda kullanılır.'
  },
  {
    atomicNumber: 15,
    symbol: 'P',
    name: 'Fosfor',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p⁶3s²3p³',
    period: 3,
    group: '5A',
    electrons: [2, 8, 5],
    properties: 'Beyaz, kırmızı ve siyah allotropları var. Kemiklerde bulunur. Beyaz fosfor havada kendiliğinden alev alır. DNA ve RNA yapısında bulunur.',
    uses: 'Gübre üretiminde, kibrit yapımında, çelik üretiminde, deterjan yapımında, pestisitlerde ve alev geciktiricilerde kullanılır.'
  },
  {
    atomicNumber: 16,
    symbol: 'S',
    name: 'Kükürt',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p⁶3s²3p⁴',
    period: 3,
    group: '6A',
    electrons: [2, 8, 6],
    properties: 'Sarı renkli katı. Volkanik bölgelerde bulunur. Karakteristik kokusu vardır. Birçok allotropu bulunur. Proteinlerin yapısında yer alır.',
    uses: 'Gübre üretiminde, kauçuk vulkanizasyonunda, sülfürik asit üretiminde, kağıt yapımında, ilaç endüstrisinde ve böcek ilaçlarında kullanılır.'
  },
  {
    atomicNumber: 17,
    symbol: 'Cl',
    name: 'Klor',
    type: 'Ametal',
    electronConfiguration: '1s²2s²2p⁶3s²3p⁵',
    period: 3,
    group: '7A',
    electrons: [2, 8, 7],
    properties: 'Yeşilimsi-sarı renkte, zehirli gaz. Dezenfektan olarak kullanılır. Keskin kokuludur ve tahriş edicidir. Doğada genellikle tuz (NaCl) şeklinde bulunur.',
    uses: 'Su arıtmada, kağıt ağartmada, plastik üretiminde, böcek ilaçlarında, temizlik ürünlerinde ve solvent üretiminde kullanılır.'
  },
  {
    atomicNumber: 18,
    symbol: 'Ar',
    name: 'Argon',
    type: 'Soygaz',
    electronConfiguration: '1s²2s²2p⁶3s²3p⁶',
    period: 3,
    group: '8A',
    electrons: [2, 8, 8],
    properties: 'Atmosferde bulunan, içi boş ampullerde kullanılan soygaz. Renksiz, kokusuz ve tatsızdır. Atmosferin yaklaşık %1\'ini oluşturur.',
    uses: 'Ampullerde, floresan lambalarda, lazer teknolojisinde, kaynak işlemlerinde, pencere yalıtımında ve metal üretiminde kullanılır.'
  },
];

// Selected element
const selectedElement = ref(null);

// Select element
const selectElement = (element) => {
  selectedElement.value = element;
};

// Get element class based on type
const getElementClass = (element) => {
  if (!element) return '';
  
  switch (element.type) {
    case 'Metal':
      return 'bg-blue-50 border border-blue-200';
    case 'Yarı-Metal':
      return 'bg-yellow-50 border border-yellow-200';
    case 'Ametal':
      return 'bg-green-50 border border-green-200';
    case 'Soygaz':
      return 'bg-purple-50 border border-purple-200';
    default:
      return 'bg-gray-50 border border-gray-200';
  }
};

// Compute electron shells for the selected element
const electronShells = computed(() => {
  if (!selectedElement.value) return [];
  return selectedElement.value.electrons;
});

// Get electrons in a specific shell
const getElectronsInShell = (shellIndex) => {
  if (!selectedElement.value || !electronShells.value[shellIndex]) return 0;
  return Array.from({ length: electronShells.value[shellIndex] }, (_, i) => i);
};

// Calculate electron positions in a shell
const getElectronPosition = (shellIndex, electronIndex) => {
  const shellRadius = (shellIndex + 1) * 32;
  const electronsInShell = electronShells.value[shellIndex];
  const angle = (electronIndex / electronsInShell) * 2 * Math.PI;
  
  const x = shellRadius * Math.cos(angle);
  const y = shellRadius * Math.sin(angle);
  
  return {
    transform: `translate(-50%, -50%)`,
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`
  };
};

// Katman çizgileri için stil hesaplama fonksiyonu
const getShellStyle = (shellIndex) => {
  const shellRadius = (shellIndex + 1) * 32;
  const diameter = shellRadius * 2;
  
  return {
    width: `${diameter}px`,
    height: `${diameter}px`
  };
};

// Tema yönetimi için ref
const theme = ref('light');

// Tema değiştirme fonksiyonu
const setTheme = (newTheme) => {
  theme.value = newTheme;
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Auto-select first element on mount
onMounted(() => {
  selectElement(elements[0]);
  
  // Sistem temasını kontrol et
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  }
});
</script>

<style>
@reference "tailwindcss";

/* Tema geçiş animasyonları */
.dark {
  @apply transition-colors duration-200;
}

/* Seçim kutusunun özelleştirilmesi */
select {
  @apply appearance-none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* Karanlık tema için seçim kutusu */
.dark select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
</style>
  
 