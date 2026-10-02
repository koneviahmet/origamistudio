<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-auto pb-10">
    <!-- Ana içerik alanı -->
    <main class="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">

      <!-- Kontrol paneli -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div class="flex flex-col gap-3">
          <div>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="i in [0, 19, 25, 45, 55, 75, 90]" 
                @click="incidentAngle = i"
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                :class="incidentAngle === i 
                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300'"
              >
                {{i}}°
              </button>
              <button 
              v-if="typeof incidentAngle == 'number'" 
              @click="incidentAngle = false"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Sıfırla
            </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Ana simülasyon alanı -->
      <div class="grid lg:grid-cols-[1fr_300px] gap-6">
        <!-- SVG Çizim Alanı -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div class="aspect-w-16 aspect-h-9">
            <svg 
              viewBox="0 0 380 250" 
              class="w-full h-full"
              aria-labelledby="simulationTitle"
              role="img"
            >
              <title id="simulationTitle">Yansıma kanunları simülasyon diyagramı</title>
              <g>
                <g stroke="null">
                  <!--Ayna-->
                  <path d="m3.35141,211.14398l373,0l0,11.54878l-373,0l0,-11"  :fill="getStyle('mirror').color" :opacity="getStyle('mirror').opacity"/>

                  <!--normal-->
                  <g :opacity="getStyle('normal').opacity">
                    <text :stroke="getStyle('normal').color" transform="matrix(1 0 0 1 -0 -1)" font-size="12" stroke-width="0"  y="26" x="148" stroke-dasharray="2,2" :fill="getStyle('normal').color">Normal</text>
                    <line :stroke="getStyle('normal').color" stroke-dasharray="2,2"  y2="210" x2="170" y1="33" x1="174" fill="none"/>
                  </g>

                  <!--Gelen Işın-->
                  <g :opacity="getStyle('gi').opacity">
                    <text :stroke="getStyle('gi').color" transform="matrix(0.854328 1.13478 -1.08646 0.892328 101.766 -37.4122)"  font-size="9" stroke-width="0"  y="83" x="42" :fill="getStyle('gi').color" v-show="typeof incidentAngle != 'number'">Gelen Işın</text>
                    <line :stroke="getStyle('gi').color" y2="210" x2="169" :y1="angle['gi'][0]" :x1="angle['gi'][1]" fill="none" stroke-width="4"/>
                    <path :stroke="getStyle('gi').color" d="m85.04066,101.15267l-10.34797,-0.74146l11.00325,-9.23541l-0.65528,9.97687z" :fill="getStyle('gi').color" v-show="typeof incidentAngle != 'number'"/>
                  </g>
                  
                  <!--yansıyan Işın-->
                  <g :opacity="getStyle('yi').opacity">
                    <text :stroke="getStyle('yi').color" transform="matrix(0.862931 -1.12766 1.07964 0.901313 24.9722 267.447)"  font-size="9" stroke-width="0"  y="72" x="185" :fill="getStyle('yi').color" v-show="typeof incidentAngle != 'number'">Yansıyan Işın</text>
                    <line :stroke="getStyle('yi').color"  :y2="angle['yi'][0]" :x2="angle['yi'][1]" y1="211" x1="169" fill="none" stroke-width="4"/>
                    <path :stroke="getStyle('yi').color"  d="m263,90.97139l0.88019,10.79456l-10.42012,-9.94594l9.53993,-0.84863z" :fill="getStyle('yi').color" v-show="typeof incidentAngle != 'number'"/>
                  </g>
                  
                  <!--Ayne ve Glen ışın-->
                  <g :opacity="getStyle('mirror_ga').opacity" v-show="typeof incidentAngle != 'number'">
                    <text :stroke="getStyle('mirror_ga').color" transform="matrix(1.38212 0 0 1.4436 -5.4779 -13.3841)"  font-size="9" y="141.15271" x="76.44772"  stroke-width="0" :fill="getStyle('mirror_ga').color">X</text>
                    <path :stroke="getStyle('mirror_ga').color"  d="m133.20001,168.39229c-12.7485,3.80858 -19.62468,26.32689 -8.1241,42.60886"  stroke-dasharray="2,2" fill="none"/>
                  </g>

                  <!--gelme açısı-->
                  <g :opacity="getStyle('ga').opacity" v-show="typeof incidentAngle != 'number'">
                    <text :stroke="getStyle('ga').color" transform="matrix(1.38212 0 0 1.4436 -5.4779 -13.3841)"  font-size="9"  y="107" x="107" stroke-width="0"  :fill="getStyle('ga').color">GA</text>
                    <path :stroke="getStyle('ga').color"  d="m168.55225,152.16776c-7.46153,-6.23425 -29.09366,-2.43614 -30.96602,15.82538"   stroke-dasharray="2,2" fill="none"/>
                  </g>

                  <!--yansıma açısı-->
                  <g :opacity="getStyle('ya').opacity" v-show="typeof incidentAngle != 'number'">
                    <text :stroke="getStyle('ya').color" transform="matrix(1.38212 0 0 1.4436 -5.4779 -13.3841)"  font-size="9"  y="107" x="142" stroke-width="0" :fill="getStyle('ya').color">YA</text>
                    <path :stroke="getStyle('ya').color"  d="m200.92891,168.33823c0.36314,-9.07791 -14.14647,-23.70805 -28.16176,-15.39145"  stroke-dasharray="2,2" fill="none"/>
                  </g>

                  <!--Ayne ve yansıyan ışın-->
                  <g :opacity="getStyle('mirror_yi').opacity" v-show="typeof incidentAngle != 'number'">
                    <text :stroke="getStyle('mirror_yi').color" transform="matrix(1.38212 0 0 1.4436 -5.4779 -13.3841)"  font-size="9" y="140.11405" x="168.19582" stroke-width="0" :fill="getStyle('mirror_yi').color">X</text>
                    <path :stroke="getStyle('mirror_yi').color"  d="m203.5421,169.89168c8.95638,2.09248 19.70407,23.85634 8.15694,38.61046"  stroke-dasharray="2,2" fill="none"/>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>

        <!-- Dinamik bilgi paneli -->
        <aside>
          <template v-if="typeof incidentAngle == 'number'">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 class="text-lg font-semibold text-gray-900 mb-3">Anlık Ölçümler</h2>
              
              <dl class="space-y-3">
                <div v-if="incidentAngle == 0" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <dt class="sr-only">Özel Durum</dt>
                  <dd class="text-sm text-blue-800 font-medium">
                    Yüzey normali üzerinden gelen ışınlar kendi üzerinden geri yansıyor
                  </dd>
                </div>

                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                  <dt class="text-sm text-gray-600">Gelme Açısı</dt>
                  <dd class="text-indigo-600 font-medium">{{incidentAngle}}°</dd>
                </div>

                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                  <dt class="text-sm text-gray-600">Yansıma Açısı</dt>
                  <dd class="text-indigo-600 font-medium">{{incidentAngle}}°</dd>
                </div>

                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                  <dt class="text-sm text-gray-600">Ayna-Gelen Açı</dt>
                  <dd class="text-gray-700 font-medium">{{90 - incidentAngle}}°</dd>
                </div>

                <div class="flex justify-between items-center py-2">
                  <dt class="text-sm text-gray-600">Ayna-Yansıyan Açı</dt>
                  <dd class="text-gray-700 font-medium">{{90 - incidentAngle}}°</dd>
                </div>
              </dl>
            </div>
          </template>

          <!-- Görünüm kontrolleri -->
          <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Görünüm Kontrolleri</h2>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="i in items.filter(i => !i?.unvisible)" 
                @click="i.selected = !i?.selected"
                class="flex items-center justify-center p-2 rounded-md border text-sm transition-colors"
                :class="i?.selected 
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'"
              >
                {{ i.title }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
  
<script setup>
import {ref, onMounted, watch} from 'vue'

// Prop tanımlaması ve temel değişkenler
const props = defineProps(['item'])
const incidentAngle = ref(false); // Başlangıçta açı seçili değil
const angle = ref({
  gi: [54, 48],
  yi: [54, 291]
})

/**
 * Seçilen açıya göre ışın konumlarını hesaplayan fonksiyon
 * @returns {Object} Gelen ışın ve yansıyan ışın koordinatları
 */
const updateAngles = () => {
  let a = incidentAngle.value
  if (a > 40) a = a + 14 

  const angleRadGi = ((90 - parseInt(a)) * Math.PI) / 180; // Açıyı radyana çevir
  const angleRadYi = (parseInt(a + 90) * Math.PI) / 180; // Açıyı radyana çevir
  const length = 160; // Işın uzunluğu
  const origin = [174, 174];

  return {
    gi: [
      parseInt(origin[0] - length * Math.sin(angleRadGi)), 
      parseInt(origin[1] - length * Math.cos(angleRadGi)) 
    ],
    yi: [
      parseInt(origin[0] - length * Math.sin(angleRadYi)), 
      parseInt(origin[1] - length * Math.cos(angleRadYi)) 
    ]
  }
};

// Açı değiştiğinde ışınların pozisyonlarını güncelleme
watch(incidentAngle, cI => {
  if (typeof cI == 'number') {
    angle.value = updateAngles()
  } else {
    angle.value = {
      gi: [54, 48],
      yi: [54, 291]
    }
  }
})

// Görünüm elemanlarının listesi
const items = ref([
  {
    unvisible: true,
    id: 'mirror',
    title: 'Ayna',
    selected: true,
    color: 'gray'
  },
  {
    id: 'normal',
    title: 'Normal',
    selected: true
  },
  {
    id: 'gi',
    title: 'Gelen Işın',
    selected: true
  },
  {
    id: 'yi',
    title: 'Yansıyan Işın',
    selected: true
  },
  {
    unvisible: true,
    id: 'mirror_ga',
    title: 'Ayna - Gelme Açısı',
    selected: false
  },
  {
    unvisible: true,
    id: 'mirror_yi',
    title: 'Ayna - Yansıma Açısı',
    selected: false
  },
  {
    id: 'ga',
    title: 'GA - Gelme Açısı',
    selected: true,
    description: 'GA'
  },
  {
    id: 'ya',
    title: 'YA - Yansıma Açısı',
    selected: true,
    description: 'YA'
  }
])

/**
 * Eleman için görsel stil döndüren yardımcı fonksiyon
 * @param {string} id - Elemanın benzersiz kimliği
 * @returns {Object} Renk ve görünürlük değerlerini içeren nesne
 */
const getStyle = (id) => {
  let color = "#333"
  let opacity = 0.2

  let selectedItem = items.value.find(i => i.id == id)

  if (selectedItem?.selected) {
    color = "#000"
    opacity = 1
  }

  if (selectedItem?.color) color = selectedItem?.color

  return {
    color,
    opacity
  }
}
</script>
  
