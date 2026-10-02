<template>
    <div class="flex flex-wrap">
        <!-- Vue3-smooth-dnd kısmını yoruma alıyorum, manuel drag-drop kullanacağız -->
        <!--
        <Container class="flex flex-wrap" 
            group-name="1" 
            behaviour="copy" 
            drag-class="dragging" 
            :animation-duration="300"  
            :onDragStart="start(size, fullscreen)" 
            :onDragEnd="end"  
            :get-child-payload="payload"
            >   
            
            <Draggable 
                @touchstart="dragClick(key)"
                @touchmove="handleTouchMove"
                @touchend="end"  
                v-for="w, key in drags" :key="w.index" 
                @click="edit ? (selectPositionIndex = (parseInt(w.index))) : dragClick(key)" 
                v-show="copy || !drops.find(i => i.value == w.value)"
                class="draggable-item"
            >   
        -->
        
        <!-- Manuel drag-drop kullanarak dokunmatik cihazlarla daha iyi uyum sağlayacak -->
        <div 
            v-for="(w, key) in drags" 
            :key="w.index" 
            class="draggable-item"
            v-show="copy || !drops.find(i => i.value == w.value)"
            @touchstart.prevent="handleTouchStart(key, $event)"
            @mousedown.prevent="handleMouseDown(key, $event)"
            @click="edit ? (selectPositionIndex = (parseInt(w.index))) : dragClick(key)"
        >   
            <!-- Sürüklenen görsel (hayalet element) -->
            <div class="drag fixed pointer-events-none" :class="[w.class, 'transform scale-110 shadow-lg z-50']" v-if="key == dragIndex && w.show && event == 'drag'" :style="w.style" >
                <div>{{ w.value }}</div> 
            </div>

            <!-- Ana görünen element -->
            <div 
                class="m-1 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-105"
                :class="[dragIndex == key ? 'opacity-40' : '', event === 'drag' ? 'touch-none' : '']"
                >
                <div :class="[w.class, 'drag-handle']">{{ w.value }}</div>
            </div>
        </div>
        
        <!--
            </Draggable>
        </Container>
        -->
    </div>
</template>


<script setup>
// import { Container, Draggable } from 'vue3-smooth-dnd'
import { ref } from 'vue';

const props = defineProps(["dragClick", "dragIndex", "handleTouchMove", "handleTouchStart", "size", "fullscreen", "payload", "end", "drags", "selectPositionIndex", "event", "start", "copy", "drops"]);

// Fare olayları için özel işleyici
const handleMouseDown = (key, e) => {
    props.dragClick(key);
    props.start(props.size, props.fullscreen);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

const mouseMoveHandler = (e) => {
    if (props.handleTouchMove) {
        // Fare hareketini dokunmatik hareket olarak ele al
        const touchEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            touches: [{ clientX: e.clientX, clientY: e.clientY }]
        };
        props.handleTouchMove(touchEvent);
    }
};

const mouseUpHandler = () => {
    if (props.end) {
        props.end();
    }
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
};
</script>

<style scoped>
.draggable-item {
  user-select: none;
  touch-action: none;
  cursor: grab;
  position: relative;
  margin: 0.25rem;
}

.draggable-item:active {
  cursor: grabbing;
}

.drag-handle {
  transition: all 0.2s ease;
  touch-action: none; /* Dokunmatik etkileşimleri daha iyi yönetmek için */
}

.dragging {
  opacity: 0.8;
  transform: scale(1.05);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>