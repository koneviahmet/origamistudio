<template>
    <div class="flex flex-col justify-center items-center">
        <div>
            <svg width="338" height="450" xmlns="http://www.w3.org/2000/svg" fill="none">
                <g>
                <path d="m201.312,263.327l74.44099,121.284c15.745,25.65201 -2.71298,58.63901 -32.81201,58.63901l-148.88168,0c-30.09921,0 -48.5574,-32.987 -32.8124,-58.63901l74.4411,-121.284c15.02499,-24.48 50.599,-24.48 65.62399,0z" fill="#D9D9D9" stroke="black" stroke-width="3" />
                <ellipse cx="169" cy="75.5" rx="34" ry="33.5" fill="#447D95" />
                <rect x="159" y="50" width="19" height="270" fill="#447D95" />
                <rect x="143" y="320" width="52" height="18" fill="#FACD39" />

                <!--topuz-->
                <text fill="#000000" stroke="#000" stroke-width="0" x="160" y="87"  font-size="32">{{ item?.state?.topuz.replace(/^n$/, '') }}</text>
                <!-- 
                <text fill="#000000" stroke="#000" stroke-width="0" x="152" y="67"  font-size="24">{{ item?.state?.topuz.replace(/^n$/, '') }}</text>
                <text fill="#000000" stroke="#000" stroke-width="0" x="174" y="66"  font-size="24">{{ item?.state?.topuz.replace(/^n$/, '') }}2</text>
                <text fill="#000000" stroke="#000" stroke-width="0" x="180" y="88"  font-size="24">{{ item?.state?.topuz.replace(/^n$/, '') }}3</text>
                <text fill="#000000" stroke="#000" stroke-width="0" x="143" y="89"  font-size="24">{{ item?.state?.topuz.replace(/^n$/, '') }}4</text>
                <text fill="#000000" stroke="#000" stroke-width="0" x="164" y="104"  font-size="24">{{ item?.state?.topuz.replace(/^n$/, '') }}5</text>
                <text fill="#000000" stroke="#000" stroke-width="0" x="152" y="99"  font-size="24">{{ item?.state?.topuz.replace(/^n$/, '') }}6</text> 
                -->

                <!--Yaklaşan cisim-->
                <g v-if="item?.state?.cisimdurumu == 'y'">
                    <path fill="#5D5353" opacity="undefined" d="m256.05243,-7.37781l18.8425,0l0,73.15192l-18.8425,0l0,-73.15192z"  transform="rotate(60.1222 265.474 29.1981)" stroke="null"/>
                    <circle cx="239.586" cy="43.3836" r="24.6747" transform="rotate(-109.218 239.586 43.3836)" fill="#5D5353" />
                    <text fill="#fff" stroke="#fff" stroke-width="0" x="222" y="46"  font-size="18">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text fill="#fff" stroke="#fff" stroke-width="0" x="233" y="59"  font-size="18">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text fill="#fff" stroke="#fff" stroke-width="0" x="240" y="43"  font-size="18">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text fill="#fff" stroke="#fff" stroke-width="0" x="226" y="54"  font-size="18">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text fill="#fff" stroke="#fff" stroke-width="0" x="246" y="54"  font-size="18">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text fill="#fff" stroke="#fff" stroke-width="0" x="236" y="36"  font-size="18">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                </g>

                <!--Dokunan cisim-->
                <g v-if="item?.state?.cisimdurumu == 'd'">
                    <circle id="svg_4" fill="#5D5353" transform="rotate(-109.218 222.586 55.3836)" r="24.6747" cy="55.3836" cx="222.586"/>
                    <path stroke="null" transform="rotate(60.1222 248.474 41.1981)" id="svg_5" d="m239.05243,4.62219l18.8425,0l0,73.15192l-18.8425,0l0,-73.15192z" opacity="undefined" fill="#5D5353"/>
                    <text font-size="18" y="58" x="205" stroke-width="0" stroke="#000" fill="#fff">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text font-size="18" y="71" x="216" stroke-width="0" stroke="#000" fill="#fff">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text font-size="18" y="55" x="223" stroke-width="0" stroke="#000" fill="#fff">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text font-size="18" y="50" x="212" stroke-width="0" stroke="#000" fill="#fff">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text font-size="18" y="63" x="212" stroke-width="0" stroke="#000" fill="#fff">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                    <text font-size="18" y="68" x="228" stroke-width="0" stroke="#000" fill="#fff">{{ item?.state?.cisim.replace(/^n$/, '') }}</text>
                </g>
                
                
                <!--Nötr Yaprak-->
                <g v-if="!item?.state?.yaprakdurumu">
                    <rect x="144" y="321" width="11" height="74" fill="#FACD39" stroke="black" stroke-width="2"/>
                    <rect x="182" y="321" width="12" height="74" fill="#FACD39" stroke="black" stroke-width="2"/>
                </g>


                <!--Açık 1-->
                <g v-if="item?.state?.yaprakdurumu == 1">
                    <rect id="svg_7" transform="rotate(9 142 358.286)" stroke-width="2" stroke="black" fill="#FACD39" height="74" width="12" y="321.28571" x="136"/>
                    <rect transform="rotate(-9 193 357.714)" id="svg_8" stroke-width="2" stroke="black" fill="#FACD39" height="74" width="12" y="320.71429" x="187"/>

                    <text fill="#000000" stroke-width="0" x="186" y="347" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="188" y="360" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="191" y="375" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>

                    <text fill="#000000" stroke-width="0" x="134" y="383" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="137" y="367"  font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="138" y="355"  font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                </g>

                <!--Açık 2-->
                <g v-if="item?.state?.yaprakdurumu == 2">
                    <rect x="131" y="322" width="12" height="74" fill="#FACD39" stroke="black" stroke-width="2"  transform="rotate(20.0803 137 359)"/>
                    <rect x="197" y="320" width="12" height="74" fill="#FACD39" stroke="black" stroke-width="2"  transform="rotate(-26.9083 203 357)"/>
                    <text fill="#000000" stroke-width="0" x="191" y="347" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="197" y="360" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="206" y="375" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="125" y="383" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="131" y="367"  font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="134" y="355"  font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                </g>
                
                <!--Açık 3-->
                <g v-if="item?.state?.yaprakdurumu == 3">
                    <rect x="209" y="312" width="12" height="74" fill="#FACD39" stroke="black" stroke-width="2"  transform="rotate(-51.4976 215 349)"/>
                    <rect x="119" y="316" width="12" height="74" fill="#FACD39" stroke="black" stroke-width="2"  transform="rotate(44.3581 125 353)"/>
                    <text fill="#000000" stroke-width="0" x="135" y="342" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="119" y="358" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="105" y="371" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="190" y="337" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="205" y="348" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                    <text fill="#000000" stroke-width="0" x="222" y="361" font-size="16"    stroke="#000">{{ item?.state?.yaprak.replace(/^n$/, '') }}</text>
                </g>



                <!--Topraklama-->
                <g v-if="item?.state?.topraklama">
                    <line fill="none" stroke="#000" stroke-width="4" x1="70" y1="77" x2="137" y2="77" />
                    <line fill="none" stroke="#000" stroke-width="4" x1="71" y1="76" x2="71" y2="146" />
                    <line fill="none" stroke="#000" stroke-width="4" x1="39" y1="146" x2="106" y2="146" />
                    <line fill="none" stroke-width="4" x1="54" y1="153" x2="85" y2="153" stroke="#000"/>
                    <line fill="none" stroke-width="4" x1="62" y1="162" x2="75" y2="162" stroke="#000"/>
                </g>
                
                </g>
            </svg>
        </div>
        <div class="bg-white text-sm">
            * Yüklü olan cisim ve elektroskobun yük miktarları eşit kabul edilmiştir.
        </div>
    </div>
</template>


<script setup>
const props = defineProps(["item"])


</script>
  