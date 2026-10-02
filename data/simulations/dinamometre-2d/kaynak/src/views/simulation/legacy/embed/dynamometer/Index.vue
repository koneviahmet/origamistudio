<template>
    <div class="relative w-full h-full min-h-[500px] bg-gray-100 flex flex-col md:flex-row" :class="!edit ? 'noselect' : ''">
        <!-- Simülasyon Alanı -->
        <div class="flex-1 p-6 flex flex-col items-center relative">
            <!-- Uyarı Mesajı -->
            <div 
                class="absolute top-4 left-4 py-2 px-4 rounded-lg text-white bg-red-500 transition-opacity duration-300 shadow-md transform"
                :class="dynamometerStatus ? 'opacity-0 scale-95' : 'opacity-100 scale-100'"
            >
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-sm font-medium">Dinamometre kapasitesi aşıldı!</span>
                </div>
            </div>

            <!-- Mobil için Ayarlar Butonu -->
            <button @click="mobileSettingsOpen = !mobileSettingsOpen" 
                class="md:hidden absolute top-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            <!-- Dinamometre Gösterimi - Geliştirilmiş Tasarım -->
            <div class="flex flex-col my-6">
                <div class="flex items-start">
                    <div class="flex flex-col items-center">
                        <!-- Dinamometrenin Üst Kısmı - Geliştirilmiş Tasarım + Br Değeri Eklendi -->
                        <div class="w-14 h-16 bg-indigo-600 border-2 border-gray-800 rounded-t-lg shadow-lg relative overflow-hidden">
                            <!-- Üst kısmına dekoratif detaylar ekleyelim -->
                            <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-indigo-400 rounded"></div>
                            <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-indigo-400 rounded"></div>
                            
                            <!-- Br Değeri -->
                            <div 
                                v-if="totalForce > 0" 
                                class="absolute inset-0 flex items-center justify-center text-white font-bold"
                            >
                                <div class="text-center text-xs">
                                    <div>{{ getBolmeSayisi.toFixed(1) }}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Dinamometre Ölçeği - Geliştirilmiş Tasarım -->
                        <div class="flex flex-col border-l-2 border-r-2 border-gray-800 relative">
                            <div 
                                v-for="i in Math.floor(getBolmeSayisi)" :key="i"
                                class="w-10 h-6 border-b-2 border-gray-800 transition-all duration-200" 
                                :class="i % 2 == 1 ? 'bg-red-400' : 'bg-white'"
                            ></div>
                            <!-- İnce ölçek çizgileri ekleyelim -->
                            <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <div v-for="i in 10" :key="`line-${i}`" 
                                    class="absolute border-b border-gray-400"
                                    :style="{top: `${(i-1) * 10}%`, left: '0', width: '100%', opacity: '0.5'}">
                                </div>
                            </div>
                        </div> 

                        <!-- Kuvvet Göstergesi - Geliştirilmiş Tasarım -->
                        <div class="mt-1 flex justify-center">
                            <div 
                                @mouseover="dropReadyIndex = 0" 
                                @mouseleave="dropReadyIndex = null" 
                                @click="dropClick(0)" 
                                class="cursor-pointer"
                            >
                                <div 
                                    class="h-20 w-20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg transition-all duration-300 relative" 
                                    :class="[
                                        totalForce > 0 ? 'bg-yellow-400 text-gray-900' : 'bg-gray-200 text-gray-700',
                                        dropReadyIndex === 0 ? 'scale-110' : 'hover:scale-105'
                                    ]"
                                >
                                    <!-- Daha iyi görünüm için overlay ekleyelim -->
                                    <div class="absolute inset-0 rounded-2xl bg-white opacity-10"></div>
                                    <div class="z-10 flex items-center">
                                        <span>{{ totalForce }}</span>
                                        <span class="text-base ml-1 font-medium">N</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sürüklenebilir Kuvvetler - İşlevselliği koruyalım -->
            <div class="flex items-center justify-center my-8">
                <div v-if="drags && !isFinish && !hideAnswers" class="drag-container flex justify-center gap-6">
                    <DragContainer 
                        :dragClick="dragClick"
                        :dragIndex="dragIndex"
                        :handleTouchMove="handleTouchMove"
                        :size="size"
                        :fullscreen="fullscreen"
                        :payload="payload"
                        :end="end"
                        :start="start"
                        :drags="enhancedDrags"
                        :drops="drops"
                        :selectPositionIndex="selectPositionIndex"
                        :event="event"
                        :copy="true"
                    />
                </div>
            </div>
        </div>

        <!-- Mobil Ayarlar Modal -->
        <div v-if="mobileSettingsOpen" 
            class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            @click.self="mobileSettingsOpen = false">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 animate-fade-in">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-semibold text-lg text-gray-800">Ayarlar</h3>
                    <button @click="mobileSettingsOpen = false" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- Bölme Sayısı Ayarı -->
                <div class="bg-gray-50 p-3 rounded-lg shadow-sm mb-4">
                    <div class="text-sm text-gray-700 font-medium mb-3">Bölme Sayısı</div>
                    <div class="flex space-x-2">
                        <button 
                            v-for="i in [5,10,20]" :key="i"
                            @click="bolmeSayisi = i" 
                            :class="[
                                'py-2 px-4 rounded-lg text-sm transition-all duration-200',
                                bolmeSayisi == i 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            ]"
                        >
                            {{ i }}
                        </button>
                    </div>
                </div>

                <!-- En Yüksek Kuvvet Ayarı -->
                <div class="bg-gray-50 p-3 rounded-lg shadow-sm mb-6">
                    <div class="text-sm text-gray-700 font-medium mb-3">En Yüksek Kuvvet</div>
                    <div class="flex space-x-2">
                        <button 
                            v-for="i in [60,100,160]" :key="i"
                            @click="maxForce = i" 
                            :class="[
                                'py-2 px-4 rounded-lg text-sm transition-all duration-200',
                                maxForce == i 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            ]"
                        >
                            {{ i }}
                        </button>
                    </div>
                </div>

                <!-- Butonlar yan yana - Mobil -->
                <div class="flex justify-center space-x-4">
                    <button 
                        @click="resetSettings()" 
                        :class="[bolmeSayisi !== 10 || maxForce !== 100 ? 'opacity-100' : 'opacity-50']"
                        class="py-2 px-5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
                    >
                        Sıfırla
                    </button>
                    
                    <button 
                        @click="clearFNC" 
                        class="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50"
                    >
                        Temizle
                    </button>
                </div>
            </div>
        </div>

        <!-- Masaüstü Ayarlar Paneli -->
        <div class="hidden md:block w-80 bg-gray-800 text-white shadow-lg p-6">
            <h3 class="font-semibold text-xl mb-6 text-center">Ayarlar</h3>
            
            <!-- Bölme Sayısı Ayarı -->
            <div class="bg-gray-700 p-4 rounded-lg mb-4">
                <div class="text-sm text-gray-200 font-medium mb-3">Bölme Sayısı</div>
                <div class="flex space-x-2">
                    <button 
                        v-for="i in [5,10,20]" :key="i"
                        @click="bolmeSayisi = i" 
                        :class="[
                            'py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
                            bolmeSayisi == i 
                                ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        ]"
                    >
                        {{ i }}
                    </button>
                </div>
            </div>

            <!-- En Yüksek Kuvvet Ayarı -->
            <div class="bg-gray-700 p-4 rounded-lg mb-6">
                <div class="text-sm text-gray-200 font-medium mb-3">En Yüksek Kuvvet</div>
                <div class="flex space-x-2">
                    <button 
                        v-for="i in [60,100,160]" :key="i"
                        @click="maxForce = i" 
                        :class="[
                            'py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
                            maxForce == i 
                                ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        ]"
                    >
                        {{ i }}
                    </button>
                </div>
            </div>

            <!-- Butonlar yan yana - Masaüstü -->
            <div class="flex justify-center space-x-4 mt-8">
                <button 
                    @click="resetSettings()" 
                    :class="[bolmeSayisi !== 10 || maxForce !== 100 ? 'opacity-100' : 'opacity-50']"
                    class="py-2 px-5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
                >
                    Sıfırla
                </button>
                
                <button 
                    @click="clearFNC" 
                    class="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50"
                >
                    Temizle
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import dragDrop from '../compositions/dragDrop';
import { defineProps, ref, defineEmits, watch, onMounted, computed, reactive} from 'vue';
import DragContainer from '../Drag/DragContainer.vue';

const {
    setDrags, 
    drags, 
    refresh, 
    checkAnswer,
    payload, 
    dropStyle, 
    drops, 
    start, 
    end,
    dragIndex,
    dropReadyIndex,
    isFinish,
    handleTouchMove,
    isShufle,
    dragClick,
    dropClick,
    lastDroped,
    event
} = dragDrop()

const props = defineProps(["item", "size", "edit", "fullscreen", "hideAnswers", "ids"])
const emit = defineEmits(["event", "loaded"])

const dragStyle = 'rounded-xl flex items-center justify-center font-bold shadow-lg transition-transform'
const selectPositionIndex = ref(null)
const forces = ref([])
const bolmeSayisi = ref(10)
const maxForce = ref(100)
const dynamometerStatus = ref(true)
const mobileSettingsOpen = ref(false)

// Geliştirilmiş sürüklenebilir öğeleri oluşturalım
const enhancedDrags = computed(() => {
    if (!drags.value) return [];
    
    // Orijinal drags'ı kopyalayalım
    return drags.value.map((drag, index) => {
        // Orijinal değerleri koruyalım, sadece görünümü değiştirelim
        return {
            ...drag,
            // Daha modern görünüm için class'ları değiştirelim
            class: `${dragStyle} w-16 h-16 text-xl ${index === 0 ? 'bg-red-400' : index === 1 ? 'bg-blue-500' : 'bg-green-500'} text-white`,
            // Değeri göstermek için içeriği değiştirelim
            value: `${drag.f} N`
        };
    });
});

const getItems = computed(() => {
    let items = [
            {value: '5 N',  f: 5, class: `${dragStyle} bg-red-400 text-white`}, 
            {value: '10 N', f: 10, class: `${dragStyle} bg-blue-500 text-white`},
            {value: '20 N', f: 20, class: `${dragStyle} bg-green-500 text-white`}
        ]

    return reactive(items)
})

const totalForce = computed(() => {
    if (forces.value.length == 0) return 0
    dynamometerStatus.value = true

    let totalF = forces.value.map(a => a.f)?.reduce((a, b) => a + b)
    if (totalF > maxForce.value) {
        dynamometerStatus.value = false
    }

    return totalF
})

const getBolmeSayisi = computed(() => {
    let bolme =  totalForce.value / (maxForce.value / bolmeSayisi.value)   
    return totalForce.value >= maxForce.value ?  bolmeSayisi.value : bolme
})

const resetSettings = () => {
    bolmeSayisi.value = 10
    maxForce.value = 100
}

watch(getItems, cItems => {
    isShufle.value = false
    setDrags([...getItems.value])
    drops.value = []
})

watch(lastDroped, cLastDroped => forces.value.push(cLastDroped))

onMounted(() => {
    isShufle.value = false
    setDrags([...getItems.value])
})

watch(() => props.edit, cEdit => {
    isShufle.value = false
    setDrags([...getItems.value])
})

watch(checkAnswer, (answer) => checkAnswerFNC(answer), {deep: true})

const checkAnswerFNC = (answer) => {
    let dragIndex = answer.dragIndex
    let dropIndex = answer.dropIndex
    drops.value[dropIndex].class = drops.value[answer.dropIndex].class
}

const clearFNC = () => {
    forces.value = []
    dynamometerStatus.value = true
}
</script>

<style scoped>
.noselect {
  user-select: none; /* Tarayıcıların çoğunda */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out forwards;
}

/* DragContainer içindeki öğelerin aralarına boşluk ekleyelim */
.drag-container > div {
  display: flex;
  gap: 1.5rem;
}

/* Sürüklenebilir öğeleri daha güzel gösterelim */
.drag-container .drag {
  border-radius: 0.75rem;
  height: 4rem;
  width: 4rem;
  transition: all 0.2s;
}

.drag-container .drag:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>