import useModelGeometric from './useModelGeometric';
import useModelFruits from './useModelFruits';
import useModelAnimals from './useModelAnimals';
import useModelOrgans from './useModelOrgans';
import useModelKitchen from './useModelKitchen';
import useModelOrganelles from './useModelOrganelles';
import useModelNatureElements from './useModelNatureElements';
import useModelSpace from './useModelSpace';
import useModelChemistry from './useModelChemistry';
import useModelFurniture from './useModelFurniture';
import useModelVehicles from './useModelVehicles';
import useModelHumans from './useModelHumans';

/**
 * Tüm modelleri bir araya getiren ana modül
 * @returns {Object} Tüm modelleri ve kategorileri içeren nesne
 */
export default function useModels() {
  // Her bir model kategorisini yükle
  const geometric = useModelGeometric();
  const fruits = useModelFruits();
  const animals = useModelAnimals();
  const organs = useModelOrgans();
  const kitchen = useModelKitchen();
  const organelles = useModelOrganelles();
  const natureElements = useModelNatureElements();
  const space = useModelSpace();
  const chemistry = useModelChemistry();
  const furniture = useModelFurniture();
  const vehicles = useModelVehicles();
  const humans = useModelHumans();

  // Tüm kategorileri birleştir
  const categories = [
    { id: 'all', name: 'Tüm Figürler' },
    geometric.category,
    fruits.category,
    animals.category,
    organs.category,
    kitchen.category,
    organelles.category,
    natureElements.category,
    space.category,
    chemistry.category,
    furniture.category,
    vehicles.category,
    humans.category,
  ];

  // Tüm modelleri birleştir
  const allModels = [
    ...geometric.models,
    ...fruits.models,
    ...animals.models,
    ...organs.models,
    ...kitchen.models,
    ...organelles.models,
    ...natureElements.models,
    ...space.models,
    ...chemistry.models,
    ...furniture.models,
    ...vehicles.models,
    ...humans.models,
  ];

  /**
   * Kategori ID'sine göre modelleri filtreler
   * @param {string} categoryId - Filtrelenecek kategori ID'si
   * @returns {Array} Filtrelenmiş modeller listesi
   */
  function getModelsByCategory(categoryId) {
    if (categoryId === 'all') {
      return allModels;
    } else {
      return allModels.filter(model => {
        switch (categoryId) {
          case 'geometric':
            return geometric.models.some(m => m.id === model.id);
          case 'fruit':
            return fruits.models.some(m => m.id === model.id);
          case 'animal':
            return animals.models.some(m => m.id === model.id);
          case 'organ':
            return organs.models.some(m => m.id === model.id);
          case 'kitchen':
            return kitchen.models.some(m => m.id === model.id);
          case 'organelle':
            return organelles.models.some(m => m.id === model.id);
          case 'nature':
            return natureElements.models.some(m => m.id === model.id);
          case 'space':
            return space.models.some(m => m.id === model.id);
          case 'chemistry':
            return chemistry.models.some(m => m.id === model.id);
          case 'furniture':
            return furniture.models.some(m => m.id === model.id);
          case 'vehicle':
            return vehicles.models.some(m => m.id === model.id);
          case 'human':
            return humans.models.some(m => m.id === model.id);
          default:
            return false;
        }
      });
    }
  }

  /**
   * ID'ye göre model oluşturma fonksiyonunu döndürür
   * @param {string} modelId - Model ID'si
   * @returns {Function|null} Model oluşturma fonksiyonu veya null
   */
  function getModelCreator(modelId) {
    const model = allModels.find(m => m.id === modelId);
    return model ? model.create : null;
  }

  /**
   * Modelin arkaplan renginden etkilenmemesini sağlar
   * @param {THREE.Object3D} model - Sabit renkli olması gereken model
   * @returns {THREE.Object3D} İşlenmiş model
   */
  function ensureFixedColors(model) {
    // Modelin tüm mesh'lerini dolaş ve materyallerini güncelle
    model.traverse((object) => {
      // Eğer obje bir mesh ise ve materyali varsa
      if (object.isMesh && object.material) {
        // Tek materyal durumu
        if (!Array.isArray(object.material)) {
          // Materyal zaten varsa, sadece özelliklerini güncelle
          object.material.needsUpdate = true;
          // Materyal arkaplan renginden etkilenmesin
          object.material.fog = false;
          // Eğer materyal transparan değilse, opaklığı tam yap
          if (!object.material.transparent) {
            object.material.opacity = 1.0;
          }
        } 
        // Çoklu materyal durumu
        else {
          object.material.forEach(mat => {
            mat.needsUpdate = true;
            mat.fog = false;
            if (!mat.transparent) {
              mat.opacity = 1.0;
            }
          });
        }
      }
    });
    
    return model;
  }

  /**
   * Modeli oluşturur ve sabit renkli olmasını sağlar
   * @param {string} modelId - Model ID'si
   * @returns {THREE.Object3D|null} Oluşturulan model veya null
   */
  function createModelWithFixedColors(modelId) {
    const creator = getModelCreator(modelId);
    if (!creator) return null;
    
    const model = creator();
    return ensureFixedColors(model);
  }

  return {
    categories,
    allModels,
    getModelsByCategory,
    getModelCreator,
    createModelWithFixedColors,
    ensureFixedColors,
    geometric,
    fruits,
    animals,
    organs,
    kitchen,
    organelles,
    natureElements,
    space,
    chemistry,
    furniture,
    vehicles,
    humans
  };
}