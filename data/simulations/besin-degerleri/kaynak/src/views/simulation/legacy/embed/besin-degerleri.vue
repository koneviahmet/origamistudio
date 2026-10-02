<template>
  <div class="h-screen bg-gray-50 p-4 sm:p-8 overflow-auto">
    <div class="w-full mx-auto">
      <!-- Header Section -->
      <div class="mb-16 text-center">
        <div class="max-w-md mx-auto">
          <select v-model="selectedFood" 
                  class="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none text-gray-700">
            <option v-for="food in foods" :key="food.id" :value="food">
              {{ food.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Nutrition Information Section -->
      <div v-if="selectedFood" 
           class="space-y-6 opacity-0 animate-fade-in"
           :class="{'opacity-100': selectedFood}">

        <!-- Desktop Layout -->
        <div class="hidden lg:grid grid-cols-7 gap-6">
          <!-- Organic Section -->
          <div class="col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900">
                Organik Bileşenler
              </h3>
            </div>
            <div class="space-y-4">
              <div v-for="(value, nutrient) in organicNutrients" :key="nutrient" 
                   class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ getNutrientName(nutrient) }}</span>
                  <span class="text-sm font-medium text-gray-900">{{ value }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-300" 
                       :style="{ width: `${value}%`, backgroundColor: getNutrientColor(nutrient) }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart Section -->
          <div class="col-span-3 bg-white rounded-xl p-6 shadow-sm">
            <div class="h-[400px] flex items-center justify-center">
              <Pie
                :data="chartData"
                :options="chartOptions"
              />
            </div>
          </div>

          <!-- Inorganic Section -->
          <div class="col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900">
                İnorganik Bileşenler
              </h3>
            </div>
            <div class="space-y-4">
              <div v-for="(value, nutrient) in inorganicNutrients" :key="nutrient" 
                   class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ getNutrientName(nutrient) }}</span>
                  <span class="text-sm font-medium text-gray-900">{{ value }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-300" 
                       :style="{ width: `${value}%`, backgroundColor: getNutrientColor(nutrient) }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="text-gray-600 text-sm mb-12">
          *Besinlere ait değerler yapay zeka ile üretilmiştir. Besin değerlerini görselleştirmek amaçlı hazırlanmıştır. Verilerin doğruluğu kontrol edilmemiştir.
        </p>

        <!-- Mobile Layout -->
        <div class="lg:hidden space-y-6">
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <div class="h-[300px] flex items-center justify-center">
              <Pie
                :data="chartData"
                :options="chartOptions"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="(value, nutrient) in selectedFood.nutrients" :key="nutrient" 
                 class="bg-white rounded-xl p-4 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">{{ getNutrientName(nutrient) }}</span>
                <span class="text-sm font-medium text-gray-900">{{ value }}%</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-300" 
                     :style="{ width: `${value}%`, backgroundColor: getNutrientColor(nutrient) }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Vitamins and Minerals -->
        <div v-if="selectedFood.details" class="space-y-8">
          <div class="border-t border-gray-100 pt-12">
            <h3 class="text-2xl font-bold text-center mb-10 text-gray-900">
              Detaylı Vitamin ve Mineral Bilgileri
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Vitamins -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <div class="mb-6">
                  <h4 class="text-lg font-semibold text-gray-900">
                    Vitaminler
                  </h4>
                </div>
                <div class="space-y-4">
                  <div v-for="(amount, vitamin) in selectedFood.details.vitamins" :key="vitamin"
                       class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">{{ vitamin }}</span>
                      <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">{{ vitaminPercentages[vitamin] }}%</span>
                      </div>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div class="h-2 rounded-full bg-blue-500 transition-all duration-300"
                           :style="{ width: vitaminPercentages[vitamin] + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Minerals -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <div class="mb-6">
                  <h4 class="text-lg font-semibold text-gray-900">
                    Mineraller
                  </h4>
                </div>
                <div class="space-y-4">
                  <div v-for="(amount, mineral) in selectedFood.details.minerals" :key="mineral"
                       class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">{{ mineral }}</span>
                      <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">{{ mineralPercentages[mineral] }}%</span>
                      </div>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div class="h-2 rounded-full bg-blue-500 transition-all duration-300"
                           :style="{ width: mineralPercentages[mineral] + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const foods = ref([
  {
    id: 1,
    name: 'Elma',
    nutrients: {
      protein: 0.3,
      karbonhidrat: 14,
      yağ: 0.2,
      su: 85,
      mineral: 0.2,
      vitamin: 0.3
    },
    details: {
      vitamins: {
        'A Vitamini': '54 IU',
        'C Vitamini': '4.6 mg',
        'K Vitamini': '2.2 mcg',
        'B6 Vitamini': '0.041 mg',
        'E Vitamini': '0.18 mg'
      },
      minerals: {
        'Kalsiyum': '6 mg',
        'Demir': '0.12 mg',
        'Magnezyum': '5 mg',
        'Fosfor': '11 mg',
        'Potasyum': '107 mg',
        'Çinko': '0.04 mg'
      }
    }
  },
  {
    id: 2,
    name: 'Tavuk',
    nutrients: {
      protein: 31,
      karbonhidrat: 0,
      yağ: 3.6,
      su: 65,
      mineral: 0.2,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'B3 Vitamini': '13.7 mg',
        'B6 Vitamini': '0.6 mg',
        'B12 Vitamini': '0.3 mcg',
        'D Vitamini': '0.2 mcg',
        'E Vitamini': '0.3 mg'
      },
      minerals: {
        'Kalsiyum': '15 mg',
        'Demir': '1.0 mg',
        'Magnezyum': '29 mg',
        'Fosfor': '228 mg',
        'Potasyum': '256 mg',
        'Çinko': '1 mg'
      }
    }
  },
  {
    id: 3,
    name: 'Yulaf',
    nutrients: {
      protein: 16.9,
      karbonhidrat: 66.3,
      yağ: 6.9,
      su: 8,
      mineral: 1.7,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'B1 Vitamini': '0.76 mg',
        'B5 Vitamini': '1.35 mg',
        'E Vitamini': '1.1 mg',
        'K Vitamini': '2 mcg',
        'Folat': '56 mcg'
      },
      minerals: {
        'Kalsiyum': '54 mg',
        'Demir': '4.72 mg',
        'Magnezyum': '177 mg',
        'Fosfor': '523 mg',
        'Potasyum': '429 mg',
        'Çinko': '3.97 mg'
      }
    }
  },
  {
    id: 4,
    name: 'Muz',
    nutrients: {
      protein: 1.1,
      karbonhidrat: 22.8,
      yağ: 0.3,
      su: 74,
      mineral: 0.8,
      vitamin: 1
    },
    details: {
      vitamins: {
        'A Vitamini': '64 IU',
        'C Vitamini': '8.7 mg',
        'B6 Vitamini': '0.4 mg',
        'Folat': '20 mcg',
        'E Vitamini': '0.1 mg'
      },
      minerals: {
        'Kalsiyum': '5 mg',
        'Demir': '0.26 mg',
        'Magnezyum': '27 mg',
        'Fosfor': '22 mg',
        'Potasyum': '358 mg',
        'Çinko': '0.15 mg'
      }
    }
  },
  {
    id: 5,
    name: 'Somon',
    nutrients: {
      protein: 25,
      karbonhidrat: 0,
      yağ: 13,
      su: 60,
      mineral: 1.5,
      vitamin: 0.5
    },
    details: {
      vitamins: {
        'D Vitamini': '14.5 mcg',
        'B12 Vitamini': '2.6 mcg',
        'B6 Vitamini': '0.6 mg',
        'E Vitamini': '4 mg',
        'B3 Vitamini': '8.5 mg'
      },
      minerals: {
        'Kalsiyum': '9 mg',
        'Demir': '0.3 mg',
        'Magnezyum': '29 mg',
        'Fosfor': '240 mg',
        'Potasyum': '363 mg',
        'Selenyum': '40 mcg'
      }
    }
  },
  {
    id: 6,
    name: 'Avokado',
    nutrients: {
      protein: 2,
      karbonhidrat: 8.5,
      yağ: 14.7,
      su: 73,
      mineral: 1,
      vitamin: 0.8
    },
    details: {
      vitamins: {
        'C Vitamini': '10 mg',
        'E Vitamini': '2.1 mg',
        'K Vitamini': '21 mcg',
        'B6 Vitamini': '0.3 mg',
        'Folat': '81 mcg'
      },
      minerals: {
        'Kalsiyum': '12 mg',
        'Demir': '0.55 mg',
        'Magnezyum': '29 mg',
        'Fosfor': '52 mg',
        'Potasyum': '485 mg',
        'Çinko': '0.64 mg'
      }
    }
  },
  {
    id: 7,
    name: 'Yumurta',
    nutrients: {
      protein: 12.6,
      karbonhidrat: 0.7,
      yağ: 9.5,
      su: 76,
      mineral: 1,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'A Vitamini': '520 IU',
        'D Vitamini': '1.1 mcg',
        'E Vitamini': '1.05 mg',
        'B12 Vitamini': '0.89 mcg',
        'B2 Vitamini': '0.457 mg'
      },
      minerals: {
        'Kalsiyum': '56 mg',
        'Demir': '1.75 mg',
        'Magnezyum': '12 mg',
        'Fosfor': '198 mg',
        'Potasyum': '138 mg',
        'Selenyum': '15.4 mcg'
      }
    }
  },
  {
    id: 8,
    name: 'Kinoa',
    nutrients: {
      protein: 14.1,
      karbonhidrat: 64.2,
      yağ: 6.1,
      su: 13.3,
      mineral: 2.1,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'E Vitamini': '2.4 mg',
        'B1 Vitamini': '0.36 mg',
        'B6 Vitamini': '0.49 mg',
        'Folat': '184 mcg',
        'B2 Vitamini': '0.32 mg'
      },
      minerals: {
        'Kalsiyum': '47 mg',
        'Demir': '4.6 mg',
        'Magnezyum': '197 mg',
        'Fosfor': '457 mg',
        'Potasyum': '563 mg',
        'Çinko': '3.1 mg'
      }
    }
  },
  {
    id: 9,
    name: 'Badem',
    nutrients: {
      protein: 21.2,
      karbonhidrat: 21.7,
      yağ: 49.9,
      su: 4.7,
      mineral: 2.3,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'E Vitamini': '25.6 mg',
        'B2 Vitamini': '1.14 mg',
        'B3 Vitamini': '3.62 mg',
        'B9 Vitamini': '44 mcg',
        'B1 Vitamini': '0.21 mg'
      },
      minerals: {
        'Kalsiyum': '269 mg',
        'Demir': '3.71 mg',
        'Magnezyum': '270 mg',
        'Fosfor': '481 mg',
        'Potasyum': '733 mg',
        'Çinko': '3.12 mg'
      }
    }
  },
  {
    id: 10,
    name: 'Ispanak',
    nutrients: {
      protein: 2.9,
      karbonhidrat: 3.6,
      yağ: 0.4,
      su: 91.4,
      mineral: 1.5,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'A Vitamini': '9377 IU',
        'C Vitamini': '28.1 mg',
        'K Vitamini': '483 mcg',
        'E Vitamini': '2 mg',
        'Folat': '194 mcg'
      },
      minerals: {
        'Kalsiyum': '99 mg',
        'Demir': '2.71 mg',
        'Magnezyum': '79 mg',
        'Fosfor': '49 mg',
        'Potasyum': '558 mg',
        'Çinko': '0.53 mg'
      }
    }
  },
  {
    id: 11,
    name: 'Mercimek',
    nutrients: {
      protein: 24.6,
      karbonhidrat: 63.3,
      yağ: 1.1,
      su: 8.3,
      mineral: 2.5,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'B1 Vitamini': '0.87 mg',
        'B5 Vitamini': '2.14 mg',
        'B6 Vitamini': '0.54 mg',
        'Folat': '479 mcg',
        'B3 Vitamini': '2.6 mg'
      },
      minerals: {
        'Kalsiyum': '35 mg',
        'Demir': '6.51 mg',
        'Magnezyum': '122 mg',
        'Fosfor': '281 mg',
        'Potasyum': '677 mg',
        'Çinko': '3.27 mg'
      }
    }
  },
  {
    id: 12,
    name: 'Çilek',
    nutrients: {
      protein: 0.7,
      karbonhidrat: 7.7,
      yağ: 0.3,
      su: 90.9,
      mineral: 0.2,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'C Vitamini': '58.8 mg',
        'B9 Vitamini': '24 mcg',
        'K Vitamini': '2.2 mcg',
        'E Vitamini': '0.29 mg',
        'B6 Vitamini': '0.047 mg'
      },
      minerals: {
        'Kalsiyum': '16 mg',
        'Demir': '0.41 mg',
        'Magnezyum': '13 mg',
        'Fosfor': '24 mg',
        'Potasyum': '153 mg',
        'Çinko': '0.14 mg'
      }
    }
  },
  {
    id: 13,
    name: 'Kefir',
    nutrients: {
      protein: 3.3,
      karbonhidrat: 4.1,
      yağ: 3.5,
      su: 87.5,
      mineral: 0.7,
      vitamin: 0.9
    },
    details: {
      vitamins: {
        'A Vitamini': '500 IU',
        'D Vitamini': '0.1 mcg',
        'B12 Vitamini': '0.5 mcg',
        'B2 Vitamini': '0.2 mg',
        'B1 Vitamini': '0.04 mg'
      },
      minerals: {
        'Kalsiyum': '120 mg',
        'Demir': '0.2 mg',
        'Magnezyum': '12 mg',
        'Fosfor': '100 mg',
        'Potasyum': '155 mg',
        'Çinko': '0.4 mg'
      }
    }
  },
  {
    id: 14,
    name: 'Nohut',
    nutrients: {
      protein: 20.5,
      karbonhidrat: 61.2,
      yağ: 6.2,
      su: 8.1,
      mineral: 3.2,
      vitamin: 0.8
    },
    details: {
      vitamins: {
        'B1 Vitamini': '0.48 mg',
        'B6 Vitamini': '0.54 mg',
        'Folat': '557 mcg',
        'B3 Vitamini': '1.54 mg',
        'B5 Vitamini': '1.59 mg'
      },
      minerals: {
        'Kalsiyum': '105 mg',
        'Demir': '6.24 mg',
        'Magnezyum': '115 mg',
        'Fosfor': '366 mg',
        'Potasyum': '875 mg',
        'Çinko': '3.43 mg'
      }
    }
  },
  {
    id: 15,
    name: 'Brokoli',
    nutrients: {
      protein: 2.8,
      karbonhidrat: 6.6,
      yağ: 0.4,
      su: 89.3,
      mineral: 0.7,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'C Vitamini': '89.2 mg',
        'K Vitamini': '101.6 mcg',
        'A Vitamini': '623 IU',
        'B9 Vitamini': '63 mcg',
        'B6 Vitamini': '0.175 mg'
      },
      minerals: {
        'Kalsiyum': '47 mg',
        'Demir': '0.73 mg',
        'Magnezyum': '21 mg',
        'Fosfor': '66 mg',
        'Potasyum': '316 mg',
        'Çinko': '0.41 mg'
      }
    }
  },
  {
    id: 16,
    name: 'Ceviz',
    nutrients: {
      protein: 15.2,
      karbonhidrat: 13.7,
      yağ: 65.2,
      su: 4.1,
      mineral: 1.6,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'E Vitamini': '0.7 mg',
        'B1 Vitamini': '0.34 mg',
        'B6 Vitamini': '0.537 mg',
        'Folat': '98 mcg',
        'B3 Vitamini': '1.125 mg'
      },
      minerals: {
        'Kalsiyum': '98 mg',
        'Demir': '2.91 mg',
        'Magnezyum': '158 mg',
        'Fosfor': '346 mg',
        'Potasyum': '441 mg',
        'Çinko': '3.09 mg'
      }
    }
  },
  {
    id: 17,
    name: 'Yoğurt',
    nutrients: {
      protein: 3.5,
      karbonhidrat: 4.7,
      yağ: 3.3,
      su: 87.9,
      mineral: 0.4,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'A Vitamini': '200 IU',
        'D Vitamini': '0.1 mcg',
        'B12 Vitamini': '0.5 mcg',
        'B2 Vitamini': '0.2 mg',
        'B1 Vitamini': '0.04 mg'
      },
      minerals: {
        'Kalsiyum': '121 mg',
        'Demir': '0.1 mg',
        'Magnezyum': '12 mg',
        'Fosfor': '95 mg',
        'Potasyum': '155 mg',
        'Çinko': '0.6 mg'
      }
    }
  },
  {
    id: 18,
    name: 'Bulgur',
    nutrients: {
      protein: 12.3,
      karbonhidrat: 75.9,
      yağ: 1.3,
      su: 8.2,
      mineral: 2.1,
      vitamin: 0.2
    },
    details: {
      vitamins: {
        'B1 Vitamini': '0.232 mg',
        'B3 Vitamini': '2.75 mg',
        'B6 Vitamini': '0.342 mg',
        'Folat': '27 mcg',
        'E Vitamini': '0.06 mg'
      },
      minerals: {
        'Kalsiyum': '35 mg',
        'Demir': '2.46 mg',
        'Magnezyum': '164 mg',
        'Fosfor': '300 mg',
        'Potasyum': '410 mg',
        'Çinko': '1.93 mg'
      }
    }
  }
])

const selectedFood = ref(null)

onMounted(() => {
  selectedFood.value = foods.value[0]
})

const getNutrientName = (nutrient) => {
  const names = {
    protein: 'Protein',
    karbonhidrat: 'Karbonhidrat',
    yağ: 'Yağ',
    su: 'Su',
    mineral: 'Mineral',
    vitamin: 'Vitamin'
  }
  return names[nutrient] || nutrient
}

const getNutrientColor = (nutrient) => {
  const colors = {
    protein: '#3B82F6',    // blue-500
    karbonhidrat: '#EF4444', // red-500
    yağ: '#10B981',      // emerald-500
    su: '#F59E0B',      // amber-500
    mineral: '#8B5CF6',    // violet-500
    vitamin: '#EC4899'     // pink-500
  }
  return colors[nutrient] || '#6B7280'
}

const organicNutrients = computed(() => {
  if (!selectedFood.value) return {}
  const { protein, karbonhidrat, yağ, vitamin } = selectedFood.value.nutrients
  return { protein, karbonhidrat, yağ, vitamin }
})

const inorganicNutrients = computed(() => {
  if (!selectedFood.value) return {}
  const { su, mineral } = selectedFood.value.nutrients
  return { su, mineral }
})

const chartData = computed(() => {
  if (!selectedFood.value) return null

  return {
    labels: Object.keys(selectedFood.value.nutrients).map(nutrient => getNutrientName(nutrient)),
    datasets: [
      {
        data: Object.values(selectedFood.value.nutrients),
        backgroundColor: [
          '#3B82F6', // blue-500
          '#EF4444', // red-500
          '#10B981', // emerald-500
          '#F59E0B', // amber-500
          '#8B5CF6', // violet-500
          '#EC4899'  // pink-500
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          '#2563EB', // blue-600
          '#DC2626', // red-600
          '#059669', // emerald-600
          '#D97706', // amber-600
          '#7C3AED', // violet-600
          '#DB2777'  // pink-600
        ]
      }
    ]
  }
})

const style = document.createElement('style')
style.textContent = `
  @keyframes fade-in {
    from { 
      opacity: 0; 
      transform: translateY(10px);
    }
    to { 
      opacity: 1; 
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
`
document.head.appendChild(style)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 12,
          family: "'Inter', sans-serif",
          weight: '500'
        },
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#111827',
      bodyColor: '#111827',
      titleFont: {
        size: 13,
        weight: '600',
        family: "'Inter', sans-serif"
      },
      bodyFont: {
        size: 12,
        family: "'Inter', sans-serif"
      },
      padding: 12,
      borderColor: '#e5e7eb',
      borderWidth: 1,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
      callbacks: {
        label: (context) => {
          return `${context.label}: ${context.raw}%`
        }
      }
    }
  }
}

// Günlük referans değerleri (DV - Daily Value)
const vitaminReferences = {
  'A Vitamini': 900, // mcg RAE
  'C Vitamini': 90, // mg
  'D Vitamini': 20, // mcg
  'E Vitamini': 15, // mg
  'K Vitamini': 120, // mcg
  'B1 Vitamini': 1.2, // mg
  'B2 Vitamini': 1.3, // mg
  'B3 Vitamini': 16, // mg
  'B5 Vitamini': 5, // mg
  'B6 Vitamini': 1.7, // mg
  'B12 Vitamini': 2.4, // mcg
  'Folat': 400, // mcg
}

const mineralReferences = {
  'Kalsiyum': 1000, // mg
  'Demir': 18, // mg
  'Magnezyum': 400, // mg
  'Fosfor': 1000, // mg
  'Potasyum': 3500, // mg
  'Çinko': 11, // mg
  'Selenyum': 55, // mcg
}

// Değeri sayıya çeviren yardımcı fonksiyon
const convertToNumeric = (value) => {
  const [numStr, unit] = value.split(' ')
  let numericValue = parseFloat(numStr)

  // Birim dönüşümleri
  if (unit === 'IU' && value.includes('A Vitamini')) {
    return numericValue * 0.3
  } else if (unit === 'IU' && value.includes('D Vitamini')) {
    return numericValue * 0.025
  } else if (unit === 'mcg') {
    return numericValue
  } else if (unit === 'mg') {
    return numericValue * 1000 // mg'yi mcg'ye çevir
  }
  return numericValue
}

// Vitamin yüzdelerini hesapla
const vitaminPercentages = computed(() => {
  if (!selectedFood.value?.details?.vitamins) return {}
  
  // Önce tüm vitamin değerlerini sayısal değere çevir
  const numericValues = {}
  let total = 0
  
  Object.entries(selectedFood.value.details.vitamins).forEach(([vitamin, value]) => {
    const numericValue = convertToNumeric(value)
    numericValues[vitamin] = numericValue
    total += numericValue
  })

  // Yüzdeleri hesapla
  const percentages = {}
  Object.entries(numericValues).forEach(([vitamin, value]) => {
    percentages[vitamin] = Math.round((value / total) * 100)
  })

  return percentages
})

// Mineral yüzdelerini hesapla
const mineralPercentages = computed(() => {
  if (!selectedFood.value?.details?.minerals) return {}
  
  // Önce tüm mineral değerlerini sayısal değere çevir
  const numericValues = {}
  let total = 0
  
  Object.entries(selectedFood.value.details.minerals).forEach(([mineral, value]) => {
    const numericValue = convertToNumeric(value)
    numericValues[mineral] = numericValue
    total += numericValue
  })

  // Yüzdeleri hesapla
  const percentages = {}
  Object.entries(numericValues).forEach(([mineral, value]) => {
    percentages[mineral] = Math.round((value / total) * 100)
  })

  return percentages
})
</script>
  
 