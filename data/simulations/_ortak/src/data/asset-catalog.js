// Otomatik üretilmiş asset listeleri — public/assets içeriğine göre

import { categorizeFood, FOOD_IDS } from './foodCategories.js'
import { categorizeArcade, ARCADE_IDS } from './arcadeCategories.js'
import {
  categorizeMiniCharacter,
  MINI_CHARACTER_IDS,
} from './miniCharacterCategories.js'
import { categorizeMiniArena, MINI_ARENA_IDS } from './miniArenaCategories.js'
import { categorizeMiniSkate, MINI_SKATE_IDS } from './miniSkateCategories.js'
import { categorizeSpace, SPACE_IDS } from './spaceCategories.js'
import { categorizeNature, NATURE_IDS } from './natureCategories.js'
import { categorizeRacing, RACING_IDS } from './racingCategories.js'
import { categorizeWatercraft, WATERCRAFT_IDS } from './watercraftCategories.js'
import { categorizeKaykitCity, KAYKIT_CITY_IDS } from './kaykitCityCategories.js'
import {
  KAYKIT_EXTRA_PACKS,
  KAYKIT_EXTRA_ALL_ASSETS,
  KAYKIT_EXTRA_PACK_IDS,
} from './kaykitExtraPacks.js'
import { categorizeCrops, CROPS_IDS } from './cropsCategories.js'
import { categorizeLeapLand, LEAP_LAND_IDS } from './leapLandCategories.js'
import { categorizeVoxelPark, VOXEL_PARK_IDS } from './voxelParkCategories.js'
import {
  categorizeCityIndustrial,
  CITY_INDUSTRIAL_IDS,
} from './cityIndustrialCategories.js'
import {
  categorizeRenewableEnergy,
  RENEWABLE_ENERGY_IDS,
} from './renewableEnergyCategories.js'
import {
  categorizeGardenFarm,
  GARDEN_FARM_IDS,
} from './gardenFarmCategories.js'
import {
  categorizeScienceCity,
  SCIENCE_CITY_IDS,
} from './scienceCityCategories.js'
import {
  categorizeSchoolLab,
  SCHOOL_LAB_IDS,
} from './schoolLabCategories.js'
import {
  categorizeSimpleMachines,
  SIMPLE_MACHINES_IDS,
} from './simpleMachinesCategories.js'
import {
  categorizeSurvivalPack,
  SURVIVAL_PACK_IDS,
} from './survivalPackCategories.js'
import {
  categorizeUltimateFood,
  ULTIMATE_FOOD_IDS,
} from './ultimateFoodCategories.js'
import {
  categorizeTexturedBuildings,
  TEXTURED_BUILDINGS_IDS,
} from './texturedBuildingsCategories.js'
import {
  categorizeQuaterniusBuilding,
  QUATERNIUS_BUILDINGS_IDS,
} from './quaterniusBuildingsCategories.js'
import {
  categorizeQuaterniusAnimal,
  QUATERNIUS_ANIMALS_IDS,
} from './quaterniusAnimalsCategories.js'
import {
  categorizeCubePet,
  CUBE_PETS_IDS,
} from './cubePetsCategories.js'
import {
  categorizeFarmBuilding,
  FARM_BUILDINGS_IDS,
} from './farmBuildingsCategories.js'
import {
  categorizeAnimatedEnemy,
  ANIMATED_ENEMIES_IDS,
} from './animatedEnemiesCategories.js'
import {
  categorizePondKit,
  POND_KIT_IDS,
} from './pondKitCategories.js'
import {
  categorizePrimitives,
  PRIMITIVES_IDS,
} from './primitivesCategories.js'

export const PACKS = {
  'road-tiles': {
    id: 'road-tiles',
    label: 'Yol Karoları',
    base: '/assets/road-tiles',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  suburban: {
    id: 'suburban',
    label: 'Banliyö Binaları',
    base: '/assets/suburban',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/suburban/Textures',
  },
  'fantasy-town': {
    id: 'fantasy-town',
    label: 'Fantezi Dekor',
    base: '/assets/fantasy-town',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/fantasy-town/Textures',
  },
  characters: {
    id: 'characters',
    label: 'Karakterler',
    base: '/assets/characters',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/characters/Textures',
  },
  cars: {
    id: 'cars',
    label: 'Araçlar',
    base: '/assets/cars',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/cars/Textures',
  },
  'city-roads': {
    id: 'city-roads',
    label: 'Şehir Yolları',
    base: '/assets/city-roads',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/city-roads/Textures',
  },
  'city-industrial': {
    id: 'city-industrial',
    label: 'Endüstriyel Binalar',
    base: '/assets/city-industrial',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/city-industrial/Textures',
  },
  holiday: {
    id: 'holiday',
    label: 'Tatil Dekoru',
    base: '/assets/holiday',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/holiday/Textures',
  },
  coaster: {
    id: 'coaster',
    label: 'Lunapark',
    base: '/assets/coaster',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/coaster/Textures',
  },
  train: {
    id: 'train',
    label: 'Tren',
    base: '/assets/train',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/train/Textures',
  },
  food: {
    id: 'food',
    label: 'Yemek',
    base: '/assets/food',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/food/Textures',
  },
  arcade: {
    id: 'arcade',
    label: 'Oyun Salonu',
    base: '/assets/arcade',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/arcade/Textures',
  },
  'mini-characters': {
    id: 'mini-characters',
    label: 'Mini Karakterler',
    base: '/assets/mini-characters',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/mini-characters/Textures',
  },
  'mini-arena': {
    id: 'mini-arena',
    label: 'Mini Arena',
    base: '/assets/mini-arena',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/mini-arena/Textures',
  },
  'mini-skate': {
    id: 'mini-skate',
    label: 'Kaykay Parkı',
    base: '/assets/mini-skate',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/mini-skate/Textures',
  },
  space: {
    id: 'space',
    label: 'Uzay',
    base: '/assets/space',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  nature: {
    id: 'nature',
    label: 'Doğa',
    base: '/assets/nature',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  racing: {
    id: 'racing',
    label: 'Yarış',
    base: '/assets/racing',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  watercraft: {
    id: 'watercraft',
    label: 'Deniz',
    base: '/assets/watercraft',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/watercraft/Textures',
  },
  'kaykit-city': {
    id: 'kaykit-city',
    label: 'KayKit Şehir',
    base: '/assets/kaykit-city',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  crops: {
    id: 'crops',
    label: 'Ekin',
    base: '/assets/crops',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'leap-land': {
    id: 'leap-land',
    label: 'Leap Land',
    base: '/assets/leap-land',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/leap-land/Textures',
  },
  'voxel-park': {
    id: 'voxel-park',
    label: 'Voxel Park',
    base: '/assets/voxel-park',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'renewable-energy': {
    id: 'renewable-energy',
    label: 'Yenilenebilir Enerji',
    base: '/assets/renewable-energy',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  'garden-farm': {
    id: 'garden-farm',
    label: 'Bahçe & Çiftçilik',
    base: '/assets/garden-farm',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  'science-city': {
    id: 'science-city',
    label: 'Bilim Şehri',
    base: '/assets/science-city',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  'school-lab': {
    id: 'school-lab',
    label: 'Okul Laboratuvarı',
    base: '/assets/school-lab',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  primitives: {
    id: 'primitives',
    label: 'İlkeller',
    base: '/assets/primitives',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  'simple-machines': {
    id: 'simple-machines',
    label: 'Basit Makineler',
    base: '/assets/simple-machines',
    format: 'gltf',
    extension: '.gltf',
    textureDir: null,
  },
  'survival-pack': {
    id: 'survival-pack',
    label: 'Hayatta Kalma',
    base: '/assets/survival-pack',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'ultimate-food': {
    id: 'ultimate-food',
    label: 'Ultimate Yemek',
    base: '/assets/ultimate-food',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'textured-buildings': {
    id: 'textured-buildings',
    label: 'Dokulu Binalar',
    base: '/assets/textured-buildings',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/textured-buildings/Textures',
  },
  'quaternius-buildings': {
    id: 'quaternius-buildings',
    label: 'Quaternius Binalar',
    base: '/assets/quaternius-buildings',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/quaternius-buildings/Textures',
  },
  'quaternius-animals': {
    id: 'quaternius-animals',
    label: 'Quaternius Hayvanlar',
    base: '/assets/quaternius-animals',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'cube-pets': {
    id: 'cube-pets',
    label: 'Cube Pets',
    base: '/assets/cube-pets',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/cube-pets/Textures',
  },
  'farm-buildings': {
    id: 'farm-buildings',
    label: 'Çiftlik Binaları',
    base: '/assets/farm-buildings',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'animated-enemies': {
    id: 'animated-enemies',
    label: 'Animasyonlu Canavarlar',
    base: '/assets/animated-enemies',
    format: 'glb',
    extension: '.glb',
    textureDir: null,
  },
  'pond-kit': {
    id: 'pond-kit',
    label: 'Gölet Kit',
    base: '/assets/pond-kit',
    format: 'glb',
    extension: '.glb',
    textureDir: '/assets/pond-kit/Textures',
  },
  ...KAYKIT_EXTRA_PACKS,
}

export const LAYER_PACKS = {
  roads: 'road-tiles',
  buildings: 'suburban',
  props: 'fantasy-town',
}

const ROAD_TILE_IDS = ["roadTile_001","roadTile_002","roadTile_003","roadTile_004","roadTile_005","roadTile_006","roadTile_007","roadTile_008","roadTile_009","roadTile_010","roadTile_011","roadTile_012","roadTile_013","roadTile_014","roadTile_015","roadTile_016","roadTile_017","roadTile_018","roadTile_019","roadTile_020","roadTile_021","roadTile_022","roadTile_023","roadTile_024","roadTile_025","roadTile_026","roadTile_027","roadTile_028","roadTile_029","roadTile_030","roadTile_031","roadTile_032","roadTile_033","roadTile_034","roadTile_035","roadTile_036","roadTile_037","roadTile_038","roadTile_039","roadTile_040","roadTile_041","roadTile_042","roadTile_043","roadTile_044","roadTile_045","roadTile_046","roadTile_047","roadTile_048","roadTile_049","roadTile_050","roadTile_051","roadTile_052","roadTile_053","roadTile_054","roadTile_055","roadTile_056","roadTile_057","roadTile_058","roadTile_059","roadTile_060","roadTile_061","roadTile_062","roadTile_063","roadTile_064","roadTile_065","roadTile_066","roadTile_067","roadTile_068","roadTile_069","roadTile_070","roadTile_071","roadTile_072","roadTile_073","roadTile_074","roadTile_075","roadTile_076","roadTile_077","roadTile_078","roadTile_079","roadTile_080","roadTile_081","roadTile_082","roadTile_083","roadTile_084","roadTile_085","roadTile_086","roadTile_087","roadTile_088","roadTile_089","roadTile_090","roadTile_091","roadTile_092","roadTile_093","roadTile_094","roadTile_095","roadTile_096","roadTile_097","roadTile_098","roadTile_099","roadTile_100","roadTile_101","roadTile_102","roadTile_103","roadTile_104","roadTile_105","roadTile_106","roadTile_107","roadTile_108","roadTile_109","roadTile_110","roadTile_111","roadTile_112","roadTile_113","roadTile_114","roadTile_115","roadTile_116","roadTile_117","roadTile_118","roadTile_119","roadTile_120","roadTile_121","roadTile_122","roadTile_123","roadTile_124","roadTile_125","roadTile_126","roadTile_127","roadTile_128","roadTile_129","roadTile_130","roadTile_131","roadTile_132","roadTile_133","roadTile_134","roadTile_135","roadTile_136","roadTile_137","roadTile_138","roadTile_139","roadTile_140","roadTile_141","roadTile_142","roadTile_143","roadTile_144","roadTile_145","roadTile_146","roadTile_147","roadTile_148","roadTile_149","roadTile_150","roadTile_151","roadTile_152","roadTile_153","roadTile_154","roadTile_155","roadTile_156","roadTile_157","roadTile_158","roadTile_159","roadTile_160","roadTile_161","roadTile_162","roadTile_163","roadTile_164","roadTile_165","roadTile_166","roadTile_167","roadTile_168","roadTile_169","roadTile_170","roadTile_171","roadTile_172","roadTile_173","roadTile_174","roadTile_175","roadTile_176","roadTile_177","roadTile_178","roadTile_179","roadTile_180","roadTile_181","roadTile_182","roadTile_183","roadTile_184","roadTile_185","roadTile_186","roadTile_187","roadTile_188","roadTile_189","roadTile_190","roadTile_191","roadTile_192","roadTile_193","roadTile_194","roadTile_195","roadTile_196","roadTile_197","roadTile_198","roadTile_199","roadTile_200","roadTile_201","roadTile_202","roadTile_203","roadTile_204","roadTile_205","roadTile_206","roadTile_207","roadTile_208","roadTile_209","roadTile_210","roadTile_211","roadTile_212","roadTile_213","roadTile_214","roadTile_215","roadTile_216","roadTile_217","roadTile_218","roadTile_219","roadTile_220","roadTile_221","roadTile_222","roadTile_223","roadTile_224","roadTile_225","roadTile_226","roadTile_227","roadTile_228","roadTile_229","roadTile_230","roadTile_231","roadTile_232","roadTile_233","roadTile_234","roadTile_235","roadTile_236","roadTile_237","roadTile_238","roadTile_239","roadTile_240","roadTile_241","roadTile_242","roadTile_243","roadTile_244","roadTile_245","roadTile_246","roadTile_247","roadTile_248","roadTile_249","roadTile_250","roadTile_251","roadTile_252","roadTile_253","roadTile_254","roadTile_255","roadTile_256","roadTile_257","roadTile_258","roadTile_259","roadTile_260","roadTile_261","roadTile_262","roadTile_263","roadTile_264","roadTile_265","roadTile_266","roadTile_267","roadTile_268","roadTile_269","roadTile_270","roadTile_271","roadTile_272","roadTile_273","roadTile_274","roadTile_275","roadTile_276","roadTile_277","roadTile_278","roadTile_279","roadTile_280","roadTile_281","roadTile_282","roadTile_283","roadTile_284","roadTile_285","roadTile_286","roadTile_287","roadTile_288","roadTile_289","roadTile_290","roadTile_291","roadTile_292","roadTile_293","roadTile_294","roadTile_295","roadTile_296","roadTile_297","roadTile_298","roadTile_299","roadTile_300","roadTile_301","roadTile_302"]

const SUBURBAN_IDS = ["building-type-a","building-type-b","building-type-c","building-type-d","building-type-e","building-type-f","building-type-g","building-type-h","building-type-i","building-type-j","building-type-k","building-type-l","building-type-m","building-type-n","building-type-o","building-type-p","building-type-q","building-type-r","building-type-s","building-type-t","building-type-u","driveway-long","driveway-short","fence","fence-1x2","fence-1x3","fence-1x4","fence-2x2","fence-2x3","fence-3x2","fence-3x3","fence-low","path-long","path-short","path-stones-long","path-stones-messy","path-stones-short","planter","tree-large","tree-small"]

const CAR_IDS = ["ambulance","box","cone","cone-flat","debris-bolt","debris-bumper","debris-door","debris-door-window","debris-drivetrain","debris-drivetrain-axle","debris-nut","debris-plate-a","debris-plate-b","debris-plate-small-a","debris-plate-small-b","debris-spoiler-a","debris-spoiler-b","debris-tire","delivery","delivery-flat","firetruck","garbage-truck","hatchback-sports","kart-oobi","kart-oodi","kart-ooli","kart-oopi","kart-oozi","police","race","race-future","sedan","sedan-sports","suv","suv-luxury","taxi","tractor","tractor-police","tractor-shovel","truck","truck-flat","van","wheel-dark","wheel-default","wheel-racing","wheel-tractor-back","wheel-tractor-dark-back","wheel-tractor-dark-front","wheel-tractor-front","wheel-truck"]

const CITY_ROAD_IDS = ["bridge-pillar","bridge-pillar-wide","construction-barrier","construction-cone","construction-light","light-curved","light-curved-cross","light-curved-double","light-square","light-square-cross","light-square-double","road-bend","road-bend-barrier","road-bend-sidewalk","road-bend-square","road-bend-square-barrier","road-bridge","road-crossing","road-crossroad","road-crossroad-barrier","road-crossroad-line","road-crossroad-path","road-curve","road-curve-barrier","road-curve-intersection","road-curve-intersection-barrier","road-curve-pavement","road-driveway-double","road-driveway-double-barrier","road-driveway-single","road-driveway-single-barrier","road-end","road-end-barrier","road-end-round","road-end-round-barrier","road-intersection","road-intersection-barrier","road-intersection-line","road-intersection-path","road-roundabout","road-roundabout-barrier","road-side","road-side-barrier","road-side-entry","road-side-entry-barrier","road-side-exit","road-side-exit-barrier","road-slant","road-slant-barrier","road-slant-curve","road-slant-curve-barrier","road-slant-flat","road-slant-flat-curve","road-slant-flat-high","road-slant-high","road-slant-high-barrier","road-split","road-split-barrier","road-square","road-square-barrier","road-straight","road-straight-barrier","road-straight-barrier-end","road-straight-barrier-half","road-straight-half","sign-highway","sign-highway-detailed","sign-highway-wide","tile-high","tile-low","tile-slant","tile-slantHigh"]

const HOLIDAY_IDS = ["bench","bench-short","cabin-corner","cabin-corner-bottom","cabin-corner-logs","cabin-door-rotate","cabin-doorway","cabin-doorway-center","cabin-doorway-left","cabin-doorway-right","cabin-fence","cabin-overhang-door-rotate","cabin-overhang-doorway","cabin-roof","cabin-roof-chimney","cabin-roof-corner","cabin-roof-dormer","cabin-roof-point","cabin-roof-snow","cabin-roof-snow-chimney","cabin-roof-snow-corner","cabin-roof-snow-dormer","cabin-roof-snow-point","cabin-roof-top","cabin-wall","cabin-wall-low","cabin-wall-roof","cabin-wall-roof-center","cabin-wall-wreath","cabin-window-a","cabin-window-b","cabin-window-c","cabin-window-large","candy-cane-green","candy-cane-red","festivus-pole","floor-stone","floor-wood","floor-wood-snow","gingerbread-man","gingerbread-woman","hanukkah-dreidel","hanukkah-menorah","hanukkah-menorah-candles","kwanzaa-kikombe","kwanzaa-kinara","kwanzaa-kinara-alternative","lantern","lantern-hanging","lights-colored","lights-green","lights-red","nutcracker","present-a-cube","present-a-rectangle","present-a-round","present-b-cube","present-b-rectangle","present-b-round","reindeer","rocks-large","rocks-medium","rocks-small","sled","sled-long","snow-bunker","snow-flat","snow-flat-large","snow-pile","snowflake-a","snowflake-b","snowflake-c","snowman","snowman-hat","sock-green","sock-green-cane","sock-red","sock-red-cane","train-locomotive","train-tender","train-wagon","train-wagon-flat","train-wagon-flat-short","train-wagon-logs","train-wagon-short","trainset-rail-bend","trainset-rail-corner","trainset-rail-detailed-bend","trainset-rail-detailed-corner","trainset-rail-detailed-straight","trainset-rail-straight","tree","tree-decorated","tree-decorated-snow","tree-snow-a","tree-snow-b","tree-snow-c","wreath","wreath-decorated"]

const COASTER_IDS = ["bench","coaster-flume-cap-back","coaster-flume-cap-front","coaster-flume-corner-large","coaster-flume-corner-large-ramp","coaster-flume-corner-small","coaster-flume-corner-small-ramp","coaster-flume-curve","coaster-flume-looping","coaster-flume-segment","coaster-flume-straight","coaster-flume-straight-bend","coaster-flume-straight-bend-large","coaster-flume-straight-bump-down","coaster-flume-straight-bump-up","coaster-flume-straight-hill-beginning","coaster-flume-straight-hill-complete","coaster-flume-straight-hill-complete-half","coaster-flume-straight-hill-end","coaster-flume-straight-skew-left","coaster-flume-straight-skew-left-side","coaster-flume-straight-skew-right","coaster-flume-straight-skew-right-side","coaster-flume-track","coaster-hanging-cap-back","coaster-hanging-cap-front","coaster-hanging-corner-large","coaster-hanging-corner-large-ramp","coaster-hanging-corner-small","coaster-hanging-corner-small-ramp","coaster-hanging-curve","coaster-hanging-looping","coaster-hanging-segment","coaster-hanging-straight","coaster-hanging-straight-bend","coaster-hanging-straight-bend-large","coaster-hanging-straight-bump-down","coaster-hanging-straight-bump-up","coaster-hanging-straight-hill-beginning","coaster-hanging-straight-hill-complete","coaster-hanging-straight-hill-complete-half","coaster-hanging-straight-hill-end","coaster-hanging-straight-skew-left","coaster-hanging-straight-skew-left-side","coaster-hanging-straight-skew-right","coaster-hanging-straight-skew-right-side","coaster-hanging-track","coaster-monorail-cap-back","coaster-monorail-cap-front","coaster-monorail-corner-large","coaster-monorail-corner-large-ramp","coaster-monorail-corner-small","coaster-monorail-corner-small-ramp","coaster-monorail-curve","coaster-monorail-looping","coaster-monorail-segment","coaster-monorail-straight","coaster-monorail-straight-bend","coaster-monorail-straight-bend-large","coaster-monorail-straight-bump-down","coaster-monorail-straight-bump-up","coaster-monorail-straight-hill-beginning","coaster-monorail-straight-hill-complete","coaster-monorail-straight-hill-complete-half","coaster-monorail-straight-hill-end","coaster-monorail-straight-skew-left","coaster-monorail-straight-skew-left-side","coaster-monorail-straight-skew-right","coaster-monorail-straight-skew-right-side","coaster-monorail-track","coaster-mouse-cap-back","coaster-mouse-cap-front","coaster-mouse-corner-large","coaster-mouse-corner-large-ramp","coaster-mouse-corner-small","coaster-mouse-corner-small-ramp","coaster-mouse-curve","coaster-mouse-looping","coaster-mouse-segment","coaster-mouse-straight","coaster-mouse-straight-bend","coaster-mouse-straight-bend-large","coaster-mouse-straight-bump-down","coaster-mouse-straight-bump-up","coaster-mouse-straight-hill-beginning","coaster-mouse-straight-hill-complete","coaster-mouse-straight-hill-complete-half","coaster-mouse-straight-hill-end","coaster-mouse-straight-skew-left","coaster-mouse-straight-skew-left-side","coaster-mouse-straight-skew-right","coaster-mouse-straight-skew-right-side","coaster-mouse-track","coaster-steel-cap-back","coaster-steel-cap-front","coaster-steel-corner-large","coaster-steel-corner-large-ramp","coaster-steel-corner-small","coaster-steel-corner-small-ramp","coaster-steel-curve","coaster-steel-looping","coaster-steel-segment","coaster-steel-straight","coaster-steel-straight-bend","coaster-steel-straight-bend-large","coaster-steel-straight-bump-down","coaster-steel-straight-bump-up","coaster-steel-straight-hill-beginning","coaster-steel-straight-hill-complete","coaster-steel-straight-hill-complete-half","coaster-steel-straight-hill-end","coaster-steel-straight-skew-left","coaster-steel-straight-skew-left-side","coaster-steel-straight-skew-right","coaster-steel-straight-skew-right-side","coaster-steel-track","coaster-train","coaster-train-front","coaster-train-hanging","coaster-train-safety","coaster-train-wooden","coaster-wood-corner-large","coaster-wood-corner-large-ramp","coaster-wood-corner-small","coaster-wood-corner-small-ramp","coaster-wood-curve","coaster-wood-looping","coaster-wood-segment","coaster-wood-straight","coaster-wood-straight-bend","coaster-wood-straight-bend-large","coaster-wood-straight-bump-down","coaster-wood-straight-bump-up","coaster-wood-straight-hill-beginning","coaster-wood-straight-hill-complete","coaster-wood-straight-hill-complete-half","coaster-wood-straight-hill-end","coaster-wood-straight-skew-left","coaster-wood-straight-skew-left-side","coaster-wood-straight-skew-right","coaster-wood-straight-skew-right-side","coaster-wood-track","flowers","grass","park-entrance","path-corner","path-crossing","path-exit","path-split","path-steps","path-straight","queue-corner","queue-crossing","queue-entrance","queue-split","queue-steps","queue-straight","ride-entrance","ride-exit","stall-drinks","stall-food","stall-information","stall-toilets","station","station-fence","station-gate","support-large","support-large-bottom","support-large-horizontal","support-large-horizontal-ring","support-large-skew","support-large-skew-bottom","support-small","support-small-bottom","support-small-horizontal","support-small-horizontal-ring","support-small-skew","support-small-skew-bottom","train-log-flume","train-monorail","trash","tree","tree-large"]

const TRAIN_IDS = ["railroad-corner-large","railroad-corner-large-ramp","railroad-corner-small","railroad-corner-small-ramp","railroad-curve","railroad-damaged-corner-large","railroad-damaged-corner-large-ramp","railroad-damaged-corner-small","railroad-damaged-corner-small-ramp","railroad-damaged-curve","railroad-damaged-straight","railroad-damaged-straight-bend","railroad-damaged-straight-bend-large","railroad-damaged-straight-bump-down","railroad-damaged-straight-bump-up","railroad-damaged-straight-hill-beginning","railroad-damaged-straight-hill-complete","railroad-damaged-straight-hill-complete-half","railroad-damaged-straight-hill-end","railroad-damaged-straight-skew-left","railroad-damaged-straight-skew-left-side","railroad-damaged-straight-skew-right","railroad-damaged-straight-skew-right-side","railroad-rail-corner-large","railroad-rail-corner-large-ramp","railroad-rail-corner-small","railroad-rail-corner-small-ramp","railroad-rail-curve","railroad-rail-straight","railroad-rail-straight-bend","railroad-rail-straight-bend-large","railroad-rail-straight-bump-down","railroad-rail-straight-bump-up","railroad-rail-straight-hill-beginning","railroad-rail-straight-hill-complete","railroad-rail-straight-hill-complete-half","railroad-rail-straight-hill-end","railroad-rail-straight-skew-left","railroad-rail-straight-skew-left-side","railroad-rail-straight-skew-right","railroad-rail-straight-skew-right-side","railroad-straight","railroad-straight-bend","railroad-straight-bend-large","railroad-straight-bump-down","railroad-straight-bump-up","railroad-straight-hill-beginning","railroad-straight-hill-complete","railroad-straight-hill-complete-half","railroad-straight-hill-end","railroad-straight-skew-left","railroad-straight-skew-left-side","railroad-straight-skew-right","railroad-straight-skew-right-side","spline-segment","spline-track","spline-track-damaged","track","track-detailed","track-single","track-single-detailed","train-carriage-box","train-carriage-coal","train-carriage-container-blue","train-carriage-container-green","train-carriage-container-red","train-carriage-dirt","train-carriage-flatbed","train-carriage-flatbed-wood","train-carriage-lumber","train-carriage-tank","train-carriage-tank-large","train-carriage-wood","train-connector","train-diesel-a","train-diesel-b","train-diesel-box-a","train-diesel-box-b","train-diesel-box-c","train-diesel-c","train-electric-bullet-a","train-electric-bullet-b","train-electric-bullet-c","train-electric-city-a","train-electric-city-b","train-electric-city-c","train-electric-double-a","train-electric-double-b","train-electric-double-c","train-electric-square-a","train-electric-square-b","train-electric-square-c","train-electric-subway-a","train-electric-subway-b","train-electric-subway-c","train-locomotive-a","train-locomotive-b","train-locomotive-c","train-locomotive-passenger-a","train-locomotive-passenger-b","train-tram-classic","train-tram-modern","train-tram-round"]

const FANTASY_TOWN_IDS = ["balcony-wall","balcony-wall-fence","banner-green","banner-red","blade","cart","cart-high","chimney","chimney-base","chimney-top","fence","fence-broken","fence-curved","fence-gate","fountain-center","fountain-corner","fountain-corner-inner","fountain-corner-inner-square","fountain-curved","fountain-edge","fountain-round","fountain-round-detail","fountain-square","fountain-square-detail","hedge","hedge-curved","hedge-gate","hedge-large","hedge-large-curved","hedge-large-gate","lantern","overhang","pillar-stone","pillar-wood","planks","planks-half","planks-opening","poles","poles-horizontal","road","road-bend","road-corner","road-corner-inner","road-curb","road-curb-end","road-edge","road-edge-slope","road-slope","rock-large","rock-small","rock-wide","roof","roof-corner","roof-corner-inner","roof-corner-round","roof-flat","roof-gable","roof-gable-detail","roof-gable-end","roof-gable-top","roof-high","roof-high-corner","roof-high-corner-round","roof-high-cornerinner","roof-high-flat","roof-high-gable","roof-high-gable-detail","roof-high-gable-end","roof-high-gable-top","roof-high-left","roof-high-point","roof-high-right","roof-high-window","roof-left","roof-point","roof-right","roof-window","stairs-full","stairs-full-corner-inner","stairs-full-corner-outer","stairs-stone","stairs-stone-corner","stairs-stone-handrail","stairs-stone-round","stairs-wide-stone","stairs-wide-stone-handrail","stairs-wide-wood","stairs-wide-wood-handrail","stairs-wood","stairs-wood-handrail","stall","stall-bench","stall-green","stall-red","stall-stool","tree","tree-crooked","tree-high","tree-high-crooked","tree-high-round","wall","wall-arch","wall-arch-top","wall-arch-top-detail","wall-block","wall-block-half","wall-broken","wall-corner","wall-corner-detail","wall-corner-diagonal","wall-corner-diagonal-half","wall-corner-edge","wall-curved","wall-detail-cross","wall-detail-diagonal","wall-detail-horizontal","wall-diagonal","wall-door","wall-doorway-base","wall-doorway-round","wall-doorway-square","wall-doorway-square-wide","wall-doorway-square-wide-curved","wall-half","wall-rounded","wall-side","wall-slope","wall-window-glass","wall-window-round","wall-window-shutters","wall-window-small","wall-window-stone","wall-wood","wall-wood-arch","wall-wood-arch-top","wall-wood-arch-top-detail","wall-wood-block","wall-wood-block-half","wall-wood-broken","wall-wood-corner","wall-wood-corner-diagonal","wall-wood-corner-diagonal-half","wall-wood-corner-edge","wall-wood-curved","wall-wood-detail-cross","wall-wood-detail-diagonal","wall-wood-detail-horizontal","wall-wood-diagonal","wall-wood-door","wall-wood-doorway-base","wall-wood-doorway-round","wall-wood-doorway-square","wall-wood-doorway-square-wide","wall-wood-doorway-square-wide-curved","wall-wood-half","wall-wood-rounded","wall-wood-side","wall-wood-slope","wall-wood-window-glass","wall-wood-window-round","wall-wood-window-shutters","wall-wood-window-small","wall-wood-window-stone","watermill","watermill-wide","wheel","windmill"]

function categorizeFantasy(id) {
  if (id.startsWith('tree') || id.startsWith('fence') || id.startsWith('hedge')) return 'vegetation'
  if (
    id.startsWith('wall') || id.startsWith('roof') || id.startsWith('stairs') ||
    id.startsWith('pillar') || id.startsWith('chimney') ||
    id.includes('door') || id.includes('window') ||
    id.startsWith('watermill') || id.startsWith('windmill') || id.startsWith('wheel')
  ) return 'building'
  if (
    id.startsWith('road') || id.startsWith('fountain') ||
    id.startsWith('lantern') || id.startsWith('light') ||
    id.startsWith('banner') || id.startsWith('cart') || id.startsWith('stall')
  ) return 'urban'
  return 'decor'
}

function categorizeCar(id) {
  if (id.startsWith('kart-')) return 'kart'
  if (id.startsWith('debris-')) return 'debris'
  if (id.startsWith('wheel-')) return 'wheel'
  if (id === 'cone' || id === 'cone-flat' || id === 'box') return 'traffic'
  if (
    id === 'ambulance' ||
    id === 'firetruck' ||
    id === 'police' ||
    id === 'tractor-police'
  ) {
    return 'emergency'
  }
  if (
    id.startsWith('truck') ||
    id.startsWith('delivery') ||
    id.startsWith('garbage') ||
    id.startsWith('tractor') ||
    id === 'van'
  ) {
    return 'truck'
  }
  return 'car'
}

function categorizeCityRoad(id) {
  if (id.startsWith('sign-') || id.startsWith('light-') || id.startsWith('construction-')) return 'urban'
  if (id.includes('-barrier')) return 'urban'
  if (id.startsWith('bridge-') || id === 'road-bridge') return 'special'
  if (id.startsWith('tile-')) return 'special'
  if (id.startsWith('road-driveway')) return 'special'
  if (
    id.startsWith('road-slant') ||
    id === 'tile-slant' ||
    id === 'tile-slantHigh'
  ) {
    return 'special'
  }
  return 'road'
}

function categorizeHoliday(id) {
  if (id.startsWith('cabin-') || id.startsWith('floor-')) return 'building'
  if (id.startsWith('tree') || id.startsWith('snow') || id.startsWith('snowflake')) return 'nature'
  return 'festive'
}

function categorizeCoaster(id) {
  if (
    id.startsWith('coaster-steel-') || id.startsWith('coaster-wood-') ||
    id.startsWith('coaster-flume-') || id.startsWith('coaster-hanging-') ||
    id.startsWith('coaster-monorail-') || id.startsWith('coaster-mouse-')
  ) return 'track'
  if (id.startsWith('coaster-train') || id.startsWith('train-log-') || id === 'train-monorail') {
    return 'train'
  }
  if (
    id.startsWith('support-') || id.startsWith('station') ||
    id === 'ride-entrance' || id === 'ride-exit' || id === 'park-entrance' ||
    id.startsWith('queue-') || id.startsWith('path-') || id.startsWith('stall-')
  ) {
    return 'venue'
  }
  return 'decor'
}

function categorizeTrain(id) {
  if (
    id.startsWith('train-carriage-') || id.startsWith('train-locomotive') ||
    id.startsWith('train-diesel') || id.startsWith('train-electric') ||
    id.startsWith('train-tram') || id === 'train-connector'
  ) return 'rolling'
  return 'rail'
}

function categorizeSuburban(id) {
  if (id.startsWith('building-type-')) return 'building'
  if (id.startsWith('fence') || id.startsWith('tree') || id.startsWith('path') || id.startsWith('driveway')) {
    return 'outdoor'
  }
  return 'decor'
}

function makeAsset(packId, id, category, preview = null) {
  const pack = PACKS[packId]
  return {
    id,
    pack: packId,
    category,
    preview,
    modelPath: `${pack.base}/${id}${pack.extension}`,
  }
}

export const ROAD_TILE_ASSETS = ROAD_TILE_IDS.map((id) => makeAsset('road-tiles', id, 'tile'))

export const SUBURBAN_ASSETS = SUBURBAN_IDS.map((id) =>
  makeAsset('suburban', id, categorizeSuburban(id)),
)

export const FANTASY_TOWN_ASSETS = FANTASY_TOWN_IDS.map((id) =>
  makeAsset('fantasy-town', id, categorizeFantasy(id)),
)

export const CAR_ASSETS = CAR_IDS.map((id) => makeAsset('cars', id, categorizeCar(id)))

export const CITY_ROAD_ASSETS = CITY_ROAD_IDS.map((id) =>
  makeAsset('city-roads', id, categorizeCityRoad(id)),
)

export const HOLIDAY_ASSETS = HOLIDAY_IDS.map((id) =>
  makeAsset('holiday', id, categorizeHoliday(id)),
)

export const COASTER_ASSETS = COASTER_IDS.map((id) =>
  makeAsset('coaster', id, categorizeCoaster(id)),
)

export const TRAIN_ASSETS = TRAIN_IDS.map((id) => makeAsset('train', id, categorizeTrain(id)))

export const FOOD_ASSETS = FOOD_IDS.map((id) => makeAsset('food', id, categorizeFood(id)))

export const ARCADE_ASSETS = ARCADE_IDS.map((id) =>
  makeAsset('arcade', id, categorizeArcade(id)),
)

export const MINI_CHARACTER_ASSETS = MINI_CHARACTER_IDS.map((id) =>
  makeAsset('mini-characters', id, categorizeMiniCharacter(id)),
)

export const MINI_ARENA_ASSETS = MINI_ARENA_IDS.map((id) =>
  makeAsset(
    'mini-arena',
    id,
    categorizeMiniArena(id),
    `/assets/mini-arena/previews/${id}.png`,
  ),
)

export const CITY_INDUSTRIAL_ASSETS = CITY_INDUSTRIAL_IDS.map((id) =>
  makeAsset(
    'city-industrial',
    id,
    categorizeCityIndustrial(id),
    `/assets/city-industrial/previews/${id}.png`,
  ),
)

export const MINI_SKATE_ASSETS = MINI_SKATE_IDS.map((id) =>
  makeAsset('mini-skate', id, categorizeMiniSkate(id)),
)

export const SPACE_ASSETS = SPACE_IDS.map((id) => makeAsset('space', id, categorizeSpace(id)))

export const NATURE_ASSETS = NATURE_IDS.map((id) => makeAsset('nature', id, categorizeNature(id)))

export const RACING_ASSETS = RACING_IDS.map((id) => makeAsset('racing', id, categorizeRacing(id)))

export const WATERCRAFT_ASSETS = WATERCRAFT_IDS.map((id) =>
  makeAsset('watercraft', id, categorizeWatercraft(id)),
)

export const KAYKIT_CITY_ASSETS = KAYKIT_CITY_IDS.map((id) =>
  makeAsset('kaykit-city', id, categorizeKaykitCity(id)),
)

export const CROPS_ASSETS = CROPS_IDS.map((id) => makeAsset('crops', id, categorizeCrops(id)))

export const LEAP_LAND_ASSETS = LEAP_LAND_IDS.map((id) =>
  makeAsset('leap-land', id, categorizeLeapLand(id)),
)

export const VOXEL_PARK_ASSETS = VOXEL_PARK_IDS.map((id) =>
  makeAsset('voxel-park', id, categorizeVoxelPark(id)),
)

export const RENEWABLE_ENERGY_ASSETS = RENEWABLE_ENERGY_IDS.map((id) =>
  makeAsset('renewable-energy', id, categorizeRenewableEnergy(id)),
)

export const GARDEN_FARM_ASSETS = GARDEN_FARM_IDS.map((id) =>
  makeAsset('garden-farm', id, categorizeGardenFarm(id)),
)

export const SCIENCE_CITY_ASSETS = SCIENCE_CITY_IDS.map((id) =>
  makeAsset('science-city', id, categorizeScienceCity(id)),
)

export const SCHOOL_LAB_ASSETS = SCHOOL_LAB_IDS.map((id) =>
  makeAsset('school-lab', id, categorizeSchoolLab(id)),
)

export const PRIMITIVES_ASSETS = PRIMITIVES_IDS.map((id) =>
  makeAsset('primitives', id, categorizePrimitives(id)),
)

export const SIMPLE_MACHINES_ASSETS = SIMPLE_MACHINES_IDS.map((id) =>
  makeAsset('simple-machines', id, categorizeSimpleMachines(id)),
)

export const SURVIVAL_PACK_ASSETS = SURVIVAL_PACK_IDS.map((id) =>
  makeAsset('survival-pack', id, categorizeSurvivalPack(id)),
)

export const ULTIMATE_FOOD_ASSETS = ULTIMATE_FOOD_IDS.map((id) =>
  makeAsset('ultimate-food', id, categorizeUltimateFood(id)),
)

export const TEXTURED_BUILDINGS_ASSETS = TEXTURED_BUILDINGS_IDS.map((id) =>
  makeAsset('textured-buildings', id, categorizeTexturedBuildings(id)),
)

export const QUATERNIUS_BUILDINGS_ASSETS = QUATERNIUS_BUILDINGS_IDS.map((id) =>
  makeAsset('quaternius-buildings', id, categorizeQuaterniusBuilding(id)),
)

export const QUATERNIUS_ANIMALS_ASSETS = QUATERNIUS_ANIMALS_IDS.map((id) =>
  makeAsset('quaternius-animals', id, categorizeQuaterniusAnimal(id)),
)

export const CUBE_PETS_ASSETS = CUBE_PETS_IDS.map((id) =>
  makeAsset(
    'cube-pets',
    id,
    categorizeCubePet(id),
    `/assets/cube-pets/previews/${id}.png`,
  ),
)

export const FARM_BUILDINGS_ASSETS = FARM_BUILDINGS_IDS.map((id) =>
  makeAsset('farm-buildings', id, categorizeFarmBuilding(id)),
)

export const ANIMATED_ENEMIES_ASSETS = ANIMATED_ENEMIES_IDS.map((id) =>
  makeAsset('animated-enemies', id, categorizeAnimatedEnemy(id)),
)

export const POND_KIT_ASSETS = POND_KIT_IDS.map((id) =>
  makeAsset('pond-kit', id, categorizePondKit(id)),
)

export const CHARACTER_ASSETS = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(97 + i)
  const id = `character-${letter}`
  return makeAsset('characters', id, 'character', `/assets/characters/previews/${id}.png`)
})

export const ASSET_CATALOG = {
  'road-tiles': ROAD_TILE_ASSETS,
  suburban: SUBURBAN_ASSETS,
  'fantasy-town': FANTASY_TOWN_ASSETS,
  cars: CAR_ASSETS,
  'city-roads': CITY_ROAD_ASSETS,
  'city-industrial': CITY_INDUSTRIAL_ASSETS,
  holiday: HOLIDAY_ASSETS,
  coaster: COASTER_ASSETS,
  train: TRAIN_ASSETS,
  food: FOOD_ASSETS,
  arcade: ARCADE_ASSETS,
  'mini-characters': MINI_CHARACTER_ASSETS,
  'mini-arena': MINI_ARENA_ASSETS,
  'mini-skate': MINI_SKATE_ASSETS,
  space: SPACE_ASSETS,
  nature: NATURE_ASSETS,
  racing: RACING_ASSETS,
  watercraft: WATERCRAFT_ASSETS,
  'kaykit-city': KAYKIT_CITY_ASSETS,
  ...Object.fromEntries(
    KAYKIT_EXTRA_PACK_IDS.map((packId, index) => [packId, KAYKIT_EXTRA_ALL_ASSETS[index]]),
  ),
  crops: CROPS_ASSETS,
  'leap-land': LEAP_LAND_ASSETS,
  'voxel-park': VOXEL_PARK_ASSETS,
  'renewable-energy': RENEWABLE_ENERGY_ASSETS,
  'garden-farm': GARDEN_FARM_ASSETS,
  'science-city': SCIENCE_CITY_ASSETS,
  'school-lab': SCHOOL_LAB_ASSETS,
  primitives: PRIMITIVES_ASSETS,
  'simple-machines': SIMPLE_MACHINES_ASSETS,
  'survival-pack': SURVIVAL_PACK_ASSETS,
  'ultimate-food': ULTIMATE_FOOD_ASSETS,
  'textured-buildings': TEXTURED_BUILDINGS_ASSETS,
  'quaternius-buildings': QUATERNIUS_BUILDINGS_ASSETS,
  'quaternius-animals': QUATERNIUS_ANIMALS_ASSETS,
  'cube-pets': CUBE_PETS_ASSETS,
  'farm-buildings': FARM_BUILDINGS_ASSETS,
  'animated-enemies': ANIMATED_ENEMIES_ASSETS,
  'pond-kit': POND_KIT_ASSETS,
  characters: CHARACTER_ASSETS,
}

export function getPack(packId) {
  return PACKS[packId] ?? null
}

export function getAssetsByPack(packId) {
  return ASSET_CATALOG[packId] ?? []
}

export function getAsset(packId, assetId) {
  return getAssetsByPack(packId).find((a) => a.id === assetId) ?? null
}

export function getAssetsByCategory(packId, category) {
  return getAssetsByPack(packId).filter((a) => a.category === category)
}

export function getLayerAssets(layer) {
  const packId = LAYER_PACKS[layer]
  return packId ? getAssetsByPack(packId) : []
}

export function getAllCatalogAssets() {
  return Object.values(ASSET_CATALOG).flat()
}

export function getPackLabel(packId) {
  return PACKS[packId]?.label ?? packId
}
