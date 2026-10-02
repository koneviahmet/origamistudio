<template>
<div class="w-full h-screen overflow-auto bg-gray-100">
    <div class="relative w-full h-full p-4">

        <!--isFinish-->
        <div v-if="isFinish" class="absolute top-2 right-2 z-10">
            <button class="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300" @click="refresh">Yeniden Çöz</button>
        </div>


        <div class="flex flex-col md:flex-row h-full">
            <!--çarprazlanma-->
            <div class="w-full md:w-3/5 flex flex-col items-center justify-center">
                <div class="flex items-center justify-center my-6 w-full">
                    <div v-if="drags && !isFinish" class="drag-container custom-drag-container">
                        <DragContainer 
                            :dragClick="dragClick"
                            :dragIndex="dragIndex"
                            :handleTouchMove="handleTouchMove"
                            :payload="payload"
                            :end="end"
                            :start="start"
                            :drags="drags"
                            :drops="drops"
                            :selectPositionIndex="selectPositionIndex"
                            :event="event"
                            :copy="true"
                        />
                    </div>
                </div>

                <div class="flex flex-col w-full items-center justify-center max-w-md mx-auto">    
                    <div class="flex flex-col w-full md:w-[300px]">
                        <div class="flex justify-around mb-4">
                            <div v-for="i, key in 2" class="flex items-center justify-center">
                                <div
                                    class="drop-target relative h-16 w-16 flex items-center justify-center rounded-xl transition-all duration-300"
                                    :class="[
                                        (dropReadyIndex === key) ? 'bg-indigo-100 scale-110 border-4 border-indigo-500' : 'bg-gray-200 border-2 border-dashed border-gray-400',
                                        drops?.[key]?.value ? 'drop-filled' : ''
                                    ]"
                                    @mouseover="dropReadyIndex = key"  
                                    @mouseleave="dropReadyIndex = null" 
                                    @click="dropClick(key)"
                                    :data-index="key"
                                >
                                    <div v-if="drops?.[key]?.value" class="h-14 w-14 text-center rounded-xl flex items-center justify-center shadow-md transition-all duration-300" 
                                        :class="[
                                            drops?.[key]?.class ? drops?.[key]?.class : `${dropStyle(key)}`,
                                            'transform scale-105'
                                        ]">
                                        {{ drops?.[key]?.value }}
                                    </div>
                                    <div v-else class="flex flex-col items-center justify-center text-gray-600 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-center my-4">
                            <svg width="300" height="150" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" class="max-w-full dna-animation">
                                <!-- Sol DNA sarmalı -->
                                <line x1="-25" y1="0" x2="-100" y2="144" stroke="red" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>
                                <line x1="125" y1="0" x2="-100" y2="144" stroke="red" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>

                                <line x1="-25" y1="0" x2="-25" y2="144" stroke="red" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>
                                <line x1="125" y1="0" x2="-25" y2="144" stroke="red" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>

                                <line x1="-25" y1="0" x2="125" y2="144" stroke="blue" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>
                                <line x1="125" y1="0" x2="125" y2="144" stroke="blue" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>

                                <line x1="-25" y1="0" x2="200" y2="144" stroke="blue" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>
                                <line x1="125" y1="0" x2="200" y2="144" stroke="blue" stroke-width="1" stroke-dasharray="6 2" class="dna-line"/>
                            </svg>
                        </div>
                        
                        <div class="flex justify-between mt-2">
                            <div class="w-full -mx-4">
                                <div :class="[
                                    results[0]?.class ? results[0]?.class : 'bg-gray-200 p-2 rounded-lg text-lg h-12 w-12 shadow-md flex items-center justify-center',
                                    results[0]?.value ? 'result-box-animation' : ''
                                ]">
                                    {{ results[0]?.value }}
                                </div>
                            </div>
                            <div class="w-full">
                                <div :class="[
                                    results[1]?.class ? results[1]?.class : 'bg-gray-200 p-2 rounded-lg text-lg h-12 w-12 shadow-md flex items-center justify-center',
                                    results[1]?.value ? 'result-box-animation' : ''
                                ]">
                                    {{ results[1]?.value }}
                                </div>
                            </div>
                            <div class="w-full flex justify-end">
                                <div :class="[
                                    results[2]?.class ? results[2]?.class : 'bg-gray-200 p-2 rounded-lg text-lg h-12 w-12 shadow-md flex items-center justify-center',
                                    results[2]?.value ? 'result-box-animation' : ''
                                ]">
                                    {{ results[2]?.value }}
                                </div>
                            </div>
                            <div class="w-full flex justify-end -mr-8">
                                <div :class="[
                                    results[3]?.class ? results[3]?.class : 'bg-gray-200 p-2 rounded-lg text-lg h-12 w-12 shadow-md flex items-center justify-center',
                                    results[3]?.value ? 'result-box-animation' : ''
                                ]">
                                    {{ results[3]?.value }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex my-4 flex-wrap bg-white p-3 rounded-lg shadow-md w-full max-w-md">
                    <div class="w-1/2 flex items-center space-x-2 p-1" v-for="(d, index) in drags">
                        <div>
                            <div :class="[
                                d.class, 
                                'transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer drag-item',
                                dragIndex === index ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                            ]" 
                            @touchstart.prevent="handleTouchStart(index, $event)"
                            @mousedown.prevent="dragClick(index)"
                            @click="dragClick(index)">
                                {{ d.value }}
                            </div>
                        </div> 
                        <div class="text-sm font-medium">{{ d.description }}</div>
                    </div>
                </div>
            </div>

            <!--bilgi-->
            <div class="w-full md:w-2/5 p-4 pb-20">
                <div class="bg-white/80 p-3 rounded-lg shadow-md my-2">
                    <div class="text-sm font-medium">
                        <div class="flex space-x-1"><span class="font-bold">B:</span><p class="text-gray-600">Bruşuk tohumlu bezelye</p></div>
                        <div class="flex space-x-1"><span class="font-bold">b:</span><p class="text-gray-600">Düz tohumlu bezelye</p></div>
                        <div class="text-gray-500 text-xs mt-1">
                            Buruşuk tohum geni(B), düz yohum genine(b) baskındır.
                        </div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-lg shadow-md mt-3 transition-all duration-500 fade-in" v-if="results?.filter(i => i).length == 4">
                    <div class="flex flex-col md:flex-row md:space-x-4">
                        <div class="w-full mb-4 md:mb-0">
                            <div class="text-center font-bold border-b border-gray-300 pb-1 text-indigo-800">Genotip</div>
                            <div class="flex items-center p-2 bg-gray-50 rounded-md my-2 transition-all duration-300 hover:bg-gray-100">
                                <div class="flex space-x-1 mr-2">
                                    <div :class="drags[0].class">{{ drags[0].value }}</div>
                                    <div :class="drags[2].class">{{ drags[2].value }}</div>
                                </div>
                                <div class="text-gray-700">
                                   %{{ results?.filter(i => ['BB', 'bb'].includes(i.value)).length * 25 }} Saf Döl
                                </div>
                            </div>
                            <div class="flex items-center p-2 bg-gray-50 rounded-md transition-all duration-300 hover:bg-gray-100">
                                <div class="flex space-x-1 mr-2">
                                    <div :class="drags[1].class">{{ drags[1].value }}</div>
                                </div>
                                <div class="text-gray-700">
                                   %{{ results?.filter(i => ['Bb'].includes(i.value)).length * 25 }} Melez Döl
                                </div>
                            </div>
                        </div>
                        <div class="w-full">
                            <div class="text-center font-bold border-b border-gray-300 pb-1 text-indigo-800">Fenotip</div>
                            <div class="flex items-center p-2 bg-gray-50 rounded-md my-2 transition-all duration-300 hover:bg-gray-100">
                                <div class="flex space-x-1 mr-2">
                                    <div :class="drags[0].class"></div>
                                </div>
                                <div class="text-gray-700">
                                   %{{ results?.filter(i => ['BB', 'Bb'].includes(i.value)).length * 25 }} Buruşuk Tohum
                                </div>
                            </div>
                            <div class="flex items-center p-2 bg-gray-50 rounded-md transition-all duration-300 hover:bg-gray-100">
                                <div class="flex space-x-1 mr-2">
                                    <div :class="drags[2].class"></div>
                                </div>
                                <div class="text-gray-700">
                                   %{{ results?.filter(i => ['bb'].includes(i.value)).length * 25 }} Düz Tohum
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
import dragDrop from '../compositions/dragDrop';
import { ref, defineEmits, watch, onMounted, computed, reactive} from 'vue';
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
        handleTouchStart,
        isShufle,
        dragClick,
        dropClick,
        event
    } = dragDrop()

const emit  = defineEmits(["event", "loaded"])

const dragStyle = 'rounded-lg w-12 h-12 flex items-center justify-center shadow-md'
const results = ref([null, null, null, null])
const selectPositionIndex = ref(null)

// Drop alanlarının doğru şekilde tanınmasını sağlamak için debug
onMounted(() => {
    isShufle.value = false;
    setDrags([...getItems.value]);
    
    // Drop alanlarını kontrol et ve gerekirse data-index ekle
    setTimeout(() => {
        const dropTargets = document.querySelectorAll('.drop-target');
        console.log(`${dropTargets.length} drop hedefi bulundu`);
        
        dropTargets.forEach((el) => {
            const index = el.getAttribute('data-index');
            console.log(`Drop hedefi: data-index=${index}, rect=${JSON.stringify(el.getBoundingClientRect())}`);
        });
    }, 1000);
});

const getItems = computed(() =>  {
    let items = {
        pea: [
            {'value': 'BB', description: 'Saf döl buruşuk tohum', class: `${dragStyle} bg-blue-400`}, 
            {'value': 'Bb', description: 'Melez döl buruşuk tohum', class: `${dragStyle} bg-blue-400`}, 
            {'value': 'bb', description: 'Saf döl düz tohum', class: `${dragStyle} bg-green-400`}
        ]
    }

    return reactive(items['pea'])
})

watch(getItems, cItems => {
    isShufle.value = false
    setDrags([...getItems.value])
    results.value = [null, null, null, null]
    drops.value = []
})

watch(checkAnswer, (answer) => checkAnswerFNC(answer), {deep: true})

const checkAnswerFNC = (answer) => {
    if (!answer || !drops.value[answer.dropIndex]) return;
    
    console.log('checkAnswerFNC çalıştı:', answer);
    let dropIndex = answer.dropIndex;
    drops.value[dropIndex].class = drops.value[dropIndex].class;
    
    // İki drop alanı da dolu ise sonuçları hesapla
    if (drops.value.length === 2 && drops.value[0]?.value && drops.value[1]?.value) {
        setTimeout(() => setResultStyle(), 150);
    }
}

const setResultStyle = () => {
    // Drop alanlarının dolu olduğundan emin ol
    if (!drops.value || drops.value.length !== 2 || !drops.value[0]?.value || !drops.value[1]?.value) {
        return;
    }

    console.log('setResultStyle çalıştı, drops:', drops.value);
    const firstAllele = drops.value[0].value;
    const secondAllele = drops.value[1].value;

    // Olası kombinasyonları hesapla
    const combinations = [
        `${firstAllele[0]}${secondAllele[0]}`,  
        `${firstAllele[0]}${secondAllele[1]}`,  
        `${firstAllele[1]}${secondAllele[0]}`,  
        `${firstAllele[1]}${secondAllele[1]}`   
    ];

    // Her kombinasyon için standardize edilmiş sonuçları hesapla
    combinations.forEach((combination, index) => {
        // Sonucu standardize et - büyük harf daima önce gelecek şekilde
        let standardCombination = combination;
        if (combination === 'bB') {
            standardCombination = 'Bb';
        }
        
        // Standardize edilmiş kombinasyon için uygun drag öğesini bul
        const result = drags.value.find(drag => drag.value === standardCombination);
        
        if (result) {
            results.value[index] = {...result}; // Yeni bir kopya oluştur
        } else {
            // Eğer sonuç bulunamadıysa, benzer sonuçları kontrol et
            if (standardCombination === 'BB') {
                const bbResult = drags.value.find(drag => drag.value === 'BB');
                if (bbResult) results.value[index] = {...bbResult};
            } else if (standardCombination === 'bb') {
                const bbResult = drags.value.find(drag => drag.value === 'bb');
                if (bbResult) results.value[index] = {...bbResult};
            } else if (standardCombination === 'Bb' || standardCombination === 'bB') {
                const bbResult = drags.value.find(drag => drag.value === 'Bb');
                if (bbResult) results.value[index] = {...bbResult};
            }
        }
    });
}

</script>

<style scoped>
.noselect {
  user-select: none; /* Tarayıcıların çoğunda */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
}

.drop-target {
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.drop-target::after {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  z-index: -1;
  border-radius: 14px;
  background-color: transparent;
  pointer-events: auto;
}

.drop-target:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.drop-filled {
  animation: dropFilled 0.5s ease-out;
}

@keyframes dropFilled {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.result-box-animation {
  animation: resultAppear 0.5s ease-out;
}

@keyframes resultAppear {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.dna-animation .dna-line {
  animation: dnaFlow 8s linear infinite;
}

@keyframes dnaFlow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 50;
  }
}

.drag-item {
  position: relative;
  z-index: 5;
}

.drag-item:active {
  transform: scale(1.15);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.custom-drag-container [draggable=true] {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: grab;
}

.custom-drag-container [draggable=true]:active {
  cursor: grabbing;
  transform: scale(1.1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>