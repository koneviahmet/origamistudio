<template> 
    <div class="flex flex-col w-full h-full bg-gray-50 ">
        <!-- Header with title and filters -->
        <div class="px-2 py-3 bg-gray-800 text-white shadow-md w-full">
            <div class="container mx-auto items-center justify-center flex">                
                <!-- Kategoriler - mobil için yatay kaydırmalı -->
                <div class="overflow-x-auto pb-2">
                    <div class="flex space-x-1 min-w-max py-1">
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="alkali_metaller.color" 
                            @click="color = [alkali_metaller]">Alkali Metaller</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="toprak_alkali_metaller.color" 
                            @click="color = [toprak_alkali_metaller]">Toprak Alkali Metaller</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="halojenler.color" 
                            @click="color = [halojenler]">Halojenler</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="soygazlar.color" 
                            @click="color = [soygazlar]">Soygazlar</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="metaller.color" 
                            @click="color = [metaller]">Metaller</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="yari_metaller.color" 
                            @click="color = [yari_metaller]">Yarı Metaller</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="gecis_metaller.color" 
                            @click="color = [gecis_metaller]">Geçiş Metalleri</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="ametaller.color" 
                            @click="color = [ametaller]">Ametaller</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="lantanidler.color" 
                            @click="color = [lantanidler]">Lantanitler</button>
                        <button class="px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-90 transition-all transform hover:scale-105" 
                            :class="aktinidler.color" 
                            @click="color = [aktinidler]">Aktinitler</button>
                        <button class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm" 
                            @click="color = [...default_colors]">Tümü</button>
                    </div>
                </div>
            </div>
        </div>
   
        <div class="h-full w-full flex flex-col relative overflow-auto md:items-center md:justify-center">

            <div class="h-full flex flex-row  space-x-0.5 p-2 overflow-auto">
                <!-- Tablo -->
                <div v-for="i in 19" :key="i" class="flex flex-col space-y-0.5 justify-between">
                    <div v-for="x in 11" :key="x" 
                        class="relative cursor-pointer transition-all duration-200" 
                        :class="setElementClass(getElements(i,x)) + (getElements(i,x)?.type == 'element' && setColor(getElements(i,x)?.number))">

                        <!-- Grup isimleri -->
                        <div class="text-center w-full h-10 flex items-center justify-center rounded-sm" 
                            v-if="getElements(i,x)?.type == 'title_group'">
                            <div class="text-sm font-bold hover:text-blue-600 transition-colors" 
                                @click="selectGroup(i, 'bg-blue-200')">
                                {{getElements(i,x)?.name.substring(0, 3)}} 
                            </div>
                        </div>
                        
                        <!-- Periyot isimleri -->
                        <div class="h-full flex items-center justify-center text-center w-10 rounded-sm" 
                            v-else-if="getElements(i,x)?.type == 'title_period'" 
                            @click="selectPeriod(x, 'bg-blue-200')">
                            <div class="rotate-90 transform text-sm font-bold hover:text-blue-600 transition-colors h-full pl-6 pt-2">
                                {{getElements(i,x)?.name.substring(0, 3)}}
                            </div>
                        </div>
                        
                        <!-- Element kutusu -->
                        <div class="flex flex-col px-1 py-1 space-y-0.5 w-11 h-11 rounded-sm shadow-sm hover:shadow-md hover:scale-110 transition-all" 
                            @click="openElementModal(getElements(i,x))" 
                            v-else>
                            <!-- Element numarası -->
                            <div class="text-2xs text-gray-600 absolute left-1 top-0.5 font-medium">
                                {{getElements(i,x)?.number}}
                            </div>
                            
                            <!-- Element sembolü -->
                            <div class="text-md font-bold text-center pt-2">
                                {{getElements(i,x)?.symbol}}
                            </div>
                            
                            <!-- Element adı - Sadece büyük ekranlarda -->
                            <div class="text-[6px] text-center w-full truncate hidden md:block">
                                {{getElements(i,x)?.name}}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Element Bilgi Modalı -->
        <div v-if="showModal" 
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            @click="closeModal">
            <div 
                :class="`${selected ? setColor(selected.number) : 'bg-white'} rounded-lg shadow-xl w-full max-w-md p-4 overflow-hidden transform transition-all duration-300 ease-out`"
                @click.stop>
                <div class="flex justify-between items-center mb-4">
                    <div class="text-xl font-bold">Element Bilgisi</div>
                    <button @click="closeModal" class="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div v-if="selected" class="flex flex-col">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-24 h-24 rounded-full flex items-center justify-center shadow-inner text-4xl font-bold">
                            {{ selected.symbol }}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <div class="bg-gray-100 rounded p-2">
                            <div class="text-xs text-gray-500">Atom Numarası</div>
                            <div class="font-bold text-black">{{ selected.number }}</div>
                        </div>
                        <div class="bg-gray-100 rounded p-2">
                            <div class="text-xs text-gray-500">Element Adı</div>
                            <div class="font-bold text-black">{{ selected.name }}</div>
                        </div>
                        <div class="bg-gray-100 rounded p-2" v-if="selected.atomic_weight">
                            <div class="text-xs text-gray-500">Atom Ağırlığı</div>
                            <div class="font-bold text-black">{{ selected.atomic_weight }}</div>
                        </div>
                        <div class="bg-gray-100 rounded p-2" v-if="selected.category">
                            <div class="text-xs text-gray-500">Kategori</div>
                            <div class="font-bold text-black">{{ selected.category }}</div>
                        </div>
                    </div>
                    
                    <div class="text-center text-gray-600 text-sm">
                        Bu elementle ilgili daha fazla bilgi için bir kimya kaynağına başvurabilirsiniz.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>
import {ref, onMounted, computed} from 'vue'
import  elementler from './elementler.json'
const color     = ref([])
const selected  = ref(null)
const showModal = ref(false)

onMounted(() => {
    color.value = default_colors.value
})

const openElementModal = (element) => {
    if (element && element.symbol) {
        selected.value = element
        showModal.value = true
    }
}

const closeModal = () => {
    showModal.value = false
}

const default_colors = computed(() =>{
    return [
        alkali_metaller.value,
        toprak_alkali_metaller.value,
        halojenler.value,
        soygazlar.value,
        metaller.value,
        yari_metaller.value,
        gecis_metaller.value,
        ametaller.value,
        lantanidler.value,
        aktinidler.value
    ]
})

const getElements = (i, x) => {
    let key = (x-1) * 19 + i;
    return {...elementler.filter(i => i.index == key)?.[0], key} || {}
}

const setElementClass = (element) => {
    let set_class = "";

    if(element.type == 'title_period'){
        set_class += " w-1/2 pb-6 ml-6"
        set_class += " bg-gray-200 text-gray-700 "
    }

    if(element.type == 'title_group'){
        set_class += " bg-gray-200 text-gray-700 "
    }

    if(element.type != 'title_group'){
        set_class += " h-full "
    }

    if(element.type == 'clear'){
        set_class += " invisible "
    }

    if(element.visible){
        set_class += " invisible "
    }

    if(!element.symbol && element.type != 'title_group' && element.type != 'title_period'){
        set_class += " bg-gray-100 "
    }

    if(element.key == 1){
        set_class += " invisible "
    }

    return set_class
}

const setColor = (number) => {
    let set_class = "";
    let default_color = "bg-gray-200";
    let selected_color = color.value.filter(i => i.numbers?.includes(number))?.[0]?.color || default_color
    
    if (number) {
        set_class += ` ${selected_color} `
    }

    return set_class
}

const selectGroup = (group_no, select_color) => {
    console.log("group_no", group_no);
    let colors =  {
            "2": [1,3,11,19,37,55,87],
            "3": [4,12,20,38,56,88],
            "4": [21,39,57,89],
            "5": [22,40,72,104,...[...Array(14).keys()].map(i => i + 58),...[...Array(14).keys()].map(i => i + 90)],
            "6": [23,41,73,105],
            "7": [24,42,74,106],
            "8": [25,43,75,107],
            "9": [26,44,76,108],
            "10": [27,45,77,109],
            "11": [28,46,78,110],
            "12": [29,47,79,111],
            "13": [30,48,80,112],
            "14": [5,13,31,49,81,113],
            "15": [6,14,32,50,82,114],
            "16": [7,15,33,51,83,115],
            "17": [8,16,34,52,84,116],
            "18": [9,17,35,53,85,117],
            "19": [2,10,18,36,54,86,118],
        }

    color.value = [{
        color: select_color,
        numbers: colors[group_no]
    }]
}

const selectPeriod = (period_no, select_color) => {
    console.log("period_no", period_no);
    let colors =  {
            "2": [...Array(2).keys()].map(i => i + 1),
            "3": [...Array(8).keys()].map(i => i + 3),
            "4": [...Array(8).keys()].map(i => i + 11),
            "5": [...Array(18).keys()].map(i => i + 19),
            "6": [...Array(18).keys()].map(i => i + 37),
            "7": [...Array(32).keys()].map(i => i + 55),
            "8": [...Array(32).keys()].map(i => i + 87),
        }

    color.value = [{
        color: select_color,
        numbers: colors[period_no]
    }]
}

const alkali_metaller = computed(() => {
    return {
        color: "bg-red-400 text-white",
        numbers: [3,11,19,37,55,87]
    }   
})

const toprak_alkali_metaller = computed(() => {
    return {
        color: "bg-red-500 text-white",
        numbers: [4,12,20,38,56,88]
    }   
})

const halojenler = computed(() => {
    return {
        color: "bg-yellow-300 text-gray-800",
        numbers: [9,17,35,53,85,117]
    }   
})

const soygazlar = computed(() => {
    return {
        color: "bg-blue-300 text-gray-800",
        numbers: [2,10,18,36,54,86,118]
    }   
})

const metaller = computed(() => {
    return {
        color: "bg-gray-400 text-gray-800",
        numbers: [
            13,31,49,50,81,82,83,
            ...toprak_alkali_metaller.value.numbers,
            ...alkali_metaller.value.numbers,
            ...gecis_metaller.value.numbers,
            ...lantanidler.value.numbers,
            ...aktinidler.value.numbers,
        ]
    }   
})

const yari_metaller = computed(() => {
    return {
        color: "bg-blue-400 text-white",
        numbers: [5,14,32,33,51,52,84]
    }   
})

const gecis_metaller = computed(() => {
    return {
        color: "bg-pink-400 text-white",
        numbers: [
            ...[...Array(10).keys()].map(i => i + 21),
            ...[...Array(10).keys()].map(i => i + 39),
            ...[...Array(9).keys()].map(i => i + 72),
            ...[...Array(5).keys()].map(i => i + 104),
            112, 109, 110, 111, 113, 114,115, 116
        ]
    }   
})

const lantanidler = computed(() => {
    return {
        color: "bg-purple-300 text-gray-800",
        numbers: [
            ...[...Array(15).keys()].map(i => i + 57),
            57
        ]
    }   
})

const aktinidler = computed(() => {
    return {
        color: "bg-purple-200 text-gray-800",
        numbers: [
            ...[...Array(15).keys()].map(i => i + 89),
            89
        ]
    }   
})

const ametaller = computed(() => {
    return {
        color: "bg-green-500 text-white",
        numbers: [1,6,7,8,15,16,34, ...halojenler.value.numbers]
    }   
})
</script>

<style scoped>
/* Yardımcı stil tanımlamaları */
.text-2xs {
  font-size: 0.625rem;
}

/* Mobil cihazlar için responsive tasarım */
@media (max-width: 768px) {
  .overflow-auto {
    -webkit-overflow-scrolling: touch;
  }
}
</style>

