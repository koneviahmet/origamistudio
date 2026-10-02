<template>
  <div class="h-screen w-full bg-gray-100 relative overflow-auto">
    <!-- Başlık ve Kontrol Butonları -->
    <div class="absolute top-0 left-0 right-0 z-10 bg-gray-900 p-4 flex items-center justify-between">
      <h1 class="text-xl font-medium text-white">Dengeli Beslenme</h1>
      <div class="flex gap-2">
        <button @click="suggestBalancedMenu" 
                class="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200">
          Öner
        </button>
      </div>
    </div>

    <!-- Ana İçerik -->
    <div class="pt-16 h-full">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-4">
        <!-- Yemek Seçim Bölümü -->
        <div class="bg-white rounded-lg shadow-lg p-4 overflow-auto">
          
          <!-- Tab Başlıkları -->
          <div class="flex border-b mb-4 overflow-x-auto">
            <button v-for="(category, index) in foodCategories" 
                    :key="index"
                    @click="activeTab = index"
                    class="px-4 py-2 -mb-px text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                    :class="activeTab === index 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'">
              {{ category.name }}
              <span class="ml-1 text-xs" :class="activeTab === index ? 'text-gray-900' : 'text-gray-400'">
                ({{ getSelectedCountInCategory(category) }})
              </span>
            </button>
          </div>

          <!-- Tab İçeriği -->
          <div v-for="(category, index) in foodCategories" 
               :key="index"
               v-show="activeTab === index"
               class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="food in category.items" 
                 :key="food.id" 
                 @click="toggleFood(food)"
                 class="p-3 rounded-lg border transition-colors duration-200 cursor-pointer hover:shadow-md"
                 :class="isSelected(food) ? 'bg-gray-50 border-gray-900' : 'hover:bg-gray-50 border-gray-200'">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium" :class="isSelected(food) ? 'text-gray-900' : 'text-gray-600'">
                    {{ food.name }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ food.protein }}g protein · {{ food.carbs }}g karb · {{ food.fat }}g yağ
                  </p>
                </div>
                <div class="w-5 h-5 border rounded-sm flex items-center justify-center"
                     :class="isSelected(food) ? 'border-gray-900 bg-gray-900' : 'border-gray-300'">
                  <svg v-if="isSelected(food)" class="w-3 h-3 text-white" viewBox="0 0 12 12">
                    <path fill="currentColor" d="M10 3L4.5 8.5 2 6"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analiz Sonuç Bölümü -->
        <div class="bg-white rounded-lg shadow-lg p-4 overflow-auto">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Beslenme Analizi</h2>
          
          <div v-if="selectedFoods.length > 0" class="space-y-6">
            <!-- Besin Değerleri -->
            <div class="space-y-4">
              <div class="space-y-1">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">Protein</span>
                  <span class="text-gray-900">{{ calculateNutrientTotal('protein') }}g</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gray-900 rounded-full transition-all duration-300" 
                       :style="{ width: `${calculateNutrientPercentage('protein')}%` }"></div>
                </div>
              </div>

              <div class="space-y-1">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">Karbonhidrat</span>
                  <span class="text-gray-900">{{ calculateNutrientTotal('carbs') }}g</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gray-900 rounded-full transition-all duration-300" 
                       :style="{ width: `${calculateNutrientPercentage('carbs')}%` }"></div>
                </div>
              </div>

              <div class="space-y-1">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">Yağ</span>
                  <span class="text-gray-900">{{ calculateNutrientTotal('fat') }}g</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gray-900 rounded-full transition-all duration-300" 
                       :style="{ width: `${calculateNutrientPercentage('fat')}%` }"></div>
                </div>
              </div>
            </div>

            <!-- Kalori Dağılımı -->
            <div class="space-y-3">
              <h3 class="text-sm font-medium text-gray-900">Kalori Dağılımı</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Protein</span>
                  <span :class="isProteinBalanced ? 'text-gray-900' : 'text-red-600'">
                    {{ calculateProteinPercentage.toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Karbonhidrat</span>
                  <span :class="isCarbsBalanced ? 'text-gray-900' : 'text-red-600'">
                    {{ calculateCarbsPercentage.toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Yağ</span>
                  <span :class="isFatBalanced ? 'text-gray-900' : 'text-red-600'">
                    {{ calculateFatPercentage.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Analiz Sonucu -->
            <div class="pt-4 border-t">
              <p class="text-sm font-medium" :class="isDietBalanced ? 'text-gray-900' : 'text-red-600'">
                {{ dietAnalysisMessage }}
              </p>
              <p class="text-xs text-gray-500 mt-2">{{ detailedAnalysisMessage }}</p>
            </div>
          </div>
          
          <div v-else class="text-sm text-gray-500">
            <p class="text-gray-600 text-sm mb-4">
              *Besinlere ait değerler yapay zeka ile üretilmiştir. Besin değerlerini görselleştirmek amaçlı hazırlanmıştır. Verilerin doğruluğu kontrol edilmemiştir.
            </p>
            Analiz için lütfen yemek seçimi yapın.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref(0)

const foodCategories = ref([
  {
    name: 'Proteinler',
    items: [
      { id: 'chicken', name: 'Tavuk (100g)', protein: 31, carbs: 0, fat: 3.6 },
      { id: 'fish', name: 'Balık (100g)', protein: 22, carbs: 0, fat: 12 },
      { id: 'eggs', name: 'Yumurta (1 adet)', protein: 6, carbs: 0.6, fat: 5 },
      { id: 'lentils', name: 'Mercimek (100g)', protein: 9, carbs: 20, fat: 0.4 },
      { id: 'tuna', name: 'Ton Balığı (100g)', protein: 26, carbs: 0, fat: 1 },
      { id: 'beef', name: 'Dana Eti (100g)', protein: 26, carbs: 0, fat: 15 },
      { id: 'chickpeas', name: 'Nohut (100g)', protein: 15, carbs: 45, fat: 6 },
      { id: 'tofu', name: 'Tofu (100g)', protein: 8, carbs: 2, fat: 4 },
      { id: 'turkey', name: 'Hindi Eti (100g)', protein: 29, carbs: 0, fat: 7 },
      { id: 'salmon', name: 'Somon (100g)', protein: 20, carbs: 0, fat: 13 },
      { id: 'greekYogurt', name: 'Yoğurt (100g)', protein: 10, carbs: 3.6, fat: 0.4 },
      { id: 'cottage', name: 'Lor Peyniri (100g)', protein: 11, carbs: 3.4, fat: 4.3 },
      { id: 'blackBeans', name: 'Siyah Fasulye (100g)', protein: 8.9, carbs: 24, fat: 0.5 },
    ]
  },
  {
    name: 'Karbonhidratlar',
    items: [
      { id: 'rice', name: 'Pirinç (100g)', protein: 2.7, carbs: 28, fat: 0.3 },
      { id: 'bread', name: 'Ekmek (1 dilim)', protein: 3, carbs: 15, fat: 1 },
      { id: 'potato', name: 'Patates (100g)', protein: 2, carbs: 17, fat: 0.1 },
      { id: 'pasta', name: 'Makarna (100g)', protein: 5, carbs: 25, fat: 1.1 },
      { id: 'oats', name: 'Yulaf (100g)', protein: 16.9, carbs: 66.3, fat: 6.9 },
      { id: 'quinoa', name: 'Kinoa (100g)', protein: 4.4, carbs: 21.3, fat: 1.9 },
      { id: 'sweetPotato', name: 'Tatlı Patates (100g)', protein: 1.6, carbs: 20.1, fat: 0.1 },
      { id: 'bulgur', name: 'Bulgur (100g)', protein: 3.1, carbs: 19, fat: 0.2 },
      { id: 'corn', name: 'Mısır (100g)', protein: 3.2, carbs: 19, fat: 1.4 },
      { id: 'barley', name: 'Arpa (100g)', protein: 12.5, carbs: 73.5, fat: 2.3 },
      { id: 'wheatBread', name: 'Tam Buğday Ekmeği (1 dilim)', protein: 4, carbs: 12, fat: 0.7 },
      { id: 'granola', name: 'Granola (50g)', protein: 5, carbs: 30, fat: 8 },
      { id: 'basmati', name: 'Basmati Pirinç (100g)', protein: 3.5, carbs: 32, fat: 0.2 },
      { id: 'couscous', name: 'Kuskus (100g)', protein: 3.8, carbs: 23, fat: 0.2 },
      { id: 'rye', name: 'Çavdar Ekmeği (1 dilim)', protein: 2.7, carbs: 12, fat: 0.6 }
    ]
  },
  {
    name: 'Sebzeler',
    items: [
      { id: 'broccoli', name: 'Brokoli (100g)', protein: 2.8, carbs: 7, fat: 0.4 },
      { id: 'carrot', name: 'Havuç (100g)', protein: 0.9, carbs: 10, fat: 0.2 },
      { id: 'spinach', name: 'Ispanak (100g)', protein: 2.9, carbs: 3.6, fat: 0.4 },
      { id: 'tomato', name: 'Domates (100g)', protein: 0.9, carbs: 3.9, fat: 0.2 },
      { id: 'cucumber', name: 'Salatalık (100g)', protein: 0.7, carbs: 3.6, fat: 0.1 },
      { id: 'pepper', name: 'Biber (100g)', protein: 1, carbs: 4.6, fat: 0.2 },
      { id: 'zucchini', name: 'Kabak (100g)', protein: 1.2, carbs: 3.1, fat: 0.3 },
      { id: 'eggplant', name: 'Patlıcan (100g)', protein: 1, carbs: 5.7, fat: 0.2 },
      { id: 'lettuce', name: 'Marul (100g)', protein: 1.4, carbs: 2.9, fat: 0.2 },
      { id: 'onion', name: 'Soğan (100g)', protein: 1.1, carbs: 9.3, fat: 0.1 },
      { id: 'mushroom', name: 'Mantar (100g)', protein: 3.1, carbs: 3.3, fat: 0.3 },
      { id: 'cauliflower', name: 'Karnabahar (100g)', protein: 1.9, carbs: 5, fat: 0.3 },
      { id: 'cabbage', name: 'Lahana (100g)', protein: 1.3, carbs: 6, fat: 0.1 },
      { id: 'garlic', name: 'Sarımsak (10g)', protein: 0.6, carbs: 3.3, fat: 0 },
      { id: 'asparagus', name: 'Kuşkonmaz (100g)', protein: 2.2, carbs: 3.9, fat: 0.1 }
    ]
  },
  {
    name: 'Meyveler',
    items: [
      { id: 'apple', name: 'Elma (1 adet)', protein: 0.3, carbs: 14, fat: 0.2 },
      { id: 'banana', name: 'Muz (1 adet)', protein: 1.1, carbs: 23, fat: 0.3 },
      { id: 'orange', name: 'Portakal (1 adet)', protein: 1, carbs: 12, fat: 0.2 },
      { id: 'strawberry', name: 'Çilek (100g)', protein: 0.7, carbs: 8, fat: 0.3 },
      { id: 'grape', name: 'Üzüm (100g)', protein: 0.6, carbs: 17, fat: 0.3 },
      { id: 'pear', name: 'Armut (1 adet)', protein: 0.4, carbs: 15, fat: 0.1 },
      { id: 'peach', name: 'Şeftali (1 adet)', protein: 0.9, carbs: 10, fat: 0.3 },
      { id: 'kiwi', name: 'Kivi (1 adet)', protein: 0.8, carbs: 11, fat: 0.4 },
      { id: 'pineapple', name: 'Ananas (100g)', protein: 0.5, carbs: 13.1, fat: 0.1 },
      { id: 'mango', name: 'Mango (1 adet)', protein: 0.8, carbs: 15, fat: 0.4 },
      { id: 'watermelon', name: 'Karpuz (100g)', protein: 0.6, carbs: 7.6, fat: 0.2 },
      { id: 'blueberry', name: 'Yaban Mersini (100g)', protein: 0.7, carbs: 14.5, fat: 0.3 },
      { id: 'avocado', name: 'Avokado (yarım)', protein: 2, carbs: 8.5, fat: 15 },
      { id: 'cherry', name: 'Kiraz (100g)', protein: 1.1, carbs: 12.2, fat: 0.3 },
      { id: 'melon', name: 'Kavun (100g)', protein: 0.6, carbs: 8.2, fat: 0.2 }
    ]
  },
  {
    name: 'Yağlı Besinler',
    items: [
      { id: 'oliveoil', name: 'Zeytinyağı (1 yemek kaşığı)', protein: 0, carbs: 0, fat: 14 },
      { id: 'butter', name: 'Tereyağı (1 yemek kaşığı)', protein: 0.1, carbs: 0, fat: 11.5 },
      { id: 'almonds', name: 'Badem (30g)', protein: 6, carbs: 6, fat: 14 },
      { id: 'walnuts', name: 'Ceviz (30g)', protein: 4.3, carbs: 3.9, fat: 18.5 },
      { id: 'peanutbutter', name: 'Fıstık Ezmesi (1 yemek kaşığı)', protein: 3.6, carbs: 3.5, fat: 8.2 },
      { id: 'coconutoil', name: 'Hindistan Cevizi Yağı (1 yemek kaşığı)', protein: 0, carbs: 0, fat: 14 },
      { id: 'sunflowerseeds', name: 'Ay Çekirdeği (30g)', protein: 5.5, carbs: 6.5, fat: 14 },
      { id: 'darkchocolate', name: 'Bitter Çikolata (30g)', protein: 2.2, carbs: 13, fat: 11 },
      { id: 'tahini', name: 'Tahin (1 yemek kaşığı)', protein: 3, carbs: 3, fat: 8 },
      { id: 'flaxseeds', name: 'Keten Tohumu (1 yemek kaşığı)', protein: 1.9, carbs: 3, fat: 4.3 }
    ]
  }
])

const selectedFoods = ref([])

const toggleFood = (food) => {
  const index = selectedFoods.value.findIndex(f => f.id === food.id)
  if (index === -1) {
    selectedFoods.value.push(food)
  } else {
    selectedFoods.value.splice(index, 1)
  }
}

const isSelected = (food) => {
  return selectedFoods.value.some(f => f.id === food.id)
}

const getSelectedCountInCategory = (category) => {
  return selectedFoods.value.filter(food => 
    category.items.some(item => item.id === food.id)
  ).length
}

const calculateNutrientTotal = (nutrient) => {
  return selectedFoods.value.reduce((total, food) => total + food[nutrient], 0).toFixed(1)
}

const calculateNutrientPercentage = (nutrient) => {
  const total = selectedFoods.value.reduce((sum, food) => sum + food[nutrient], 0)
  const maxValues = {
    protein: 60,
    carbs: 130,
    fat: 70
  }
  return Math.min((total / maxValues[nutrient]) * 100, 100)
}

const calculateTotalCalories = computed(() => {
  const protein = parseFloat(calculateNutrientTotal('protein'))
  const carbs = parseFloat(calculateNutrientTotal('carbs'))
  const fat = parseFloat(calculateNutrientTotal('fat'))
  return (protein * 4) + (carbs * 4) + (fat * 9)
})

const calculateProteinPercentage = computed(() => {
  const protein = parseFloat(calculateNutrientTotal('protein'))
  return (protein * 4 / calculateTotalCalories.value) * 100 || 0
})

const calculateCarbsPercentage = computed(() => {
  const carbs = parseFloat(calculateNutrientTotal('carbs'))
  return (carbs * 4 / calculateTotalCalories.value) * 100 || 0
})

const calculateFatPercentage = computed(() => {
  const fat = parseFloat(calculateNutrientTotal('fat'))
  return (fat * 9 / calculateTotalCalories.value) * 100 || 0
})

const isProteinBalanced = computed(() => {
  return calculateProteinPercentage.value >= 10 && calculateProteinPercentage.value <= 35
})

const isCarbsBalanced = computed(() => {
  return calculateCarbsPercentage.value >= 45 && calculateCarbsPercentage.value <= 65
})

const isFatBalanced = computed(() => {
  return calculateFatPercentage.value >= 20 && calculateFatPercentage.value <= 35
})

const isDietBalanced = computed(() => {
  if (calculateTotalCalories.value === 0) return false
  return isProteinBalanced.value && isCarbsBalanced.value && isFatBalanced.value
})

const detailedAnalysisMessage = computed(() => {
  if (selectedFoods.value.length === 0) return ''

  let message = 'Analiz: '
  if (!isProteinBalanced.value) {
    message += calculateProteinPercentage.value < 10 
      ? 'Protein oranı çok düşük. ' 
      : 'Protein oranı çok yüksek. '
  }
  if (!isCarbsBalanced.value) {
    message += calculateCarbsPercentage.value < 45 
      ? 'Karbonhidrat oranı çok düşük. ' 
      : 'Karbonhidrat oranı çok yüksek. '
  }
  if (!isFatBalanced.value) {
    message += calculateFatPercentage.value < 20 
      ? 'Yağ oranı çok düşük. ' 
      : 'Yağ oranı çok yüksek. '
  }
  if (isDietBalanced.value) {
    message = 'Tüm besin oranları ideal aralıkta. Protein (%10-35), Karbonhidrat (%45-65) ve Yağ (%20-35) dengeli dağılmış.'
  }
  return message
})

const dietAnalysisMessage = computed(() => {
  if (selectedFoods.value.length === 0) {
    return 'Lütfen analiz için yemek seçimi yapın.'
  }
  
  return isDietBalanced.value
    ? 'Seçtiğiniz menü dengeli beslenme için uygun görünüyor! 👍'
    : 'Seçtiğiniz menü dengeli beslenme için uygun değil. Besin gruplarını daha dengeli seçmeyi deneyin.'
})

const suggestBalancedMenu = () => {
  // Mevcut seçimleri temizle
  selectedFoods.value = []
  
  // Her kategoriden rastgele yemek seç
  const suggestions = {
    proteins: getRandomItems(foodCategories.value[0].items, 2), // 2 protein
    carbs: getRandomItems(foodCategories.value[1].items, 2),    // 2 karbonhidrat
    vegetables: getRandomItems(foodCategories.value[2].items, 3), // 3 sebze
    fruits: getRandomItems(foodCategories.value[3].items, 2)     // 2 meyve
  }

  // Seçilen yemekleri kontrol et ve dengeli olana kadar tekrar dene
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    selectedFoods.value = [
      ...suggestions.proteins,
      ...suggestions.carbs,
      ...suggestions.vegetables,
      ...suggestions.fruits
    ]

    // Eğer menü dengeliyse döngüden çık
    if (isDietBalanced.value) {
      break
    }

    // Dengeli değilse yeni kombinasyon dene
    suggestions.proteins = getRandomItems(foodCategories.value[0].items, 2)
    suggestions.carbs = getRandomItems(foodCategories.value[1].items, 2)
    suggestions.vegetables = getRandomItems(foodCategories.value[2].items, 3)
    suggestions.fruits = getRandomItems(foodCategories.value[3].items, 2)

    attempts++
  }

  // İlk kategoriyi göster
  activeTab.value = 0
}

const getRandomItems = (items, count) => {
  const shuffled = [...items].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
</script>
  
 
 