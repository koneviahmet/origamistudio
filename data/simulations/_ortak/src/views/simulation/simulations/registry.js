import { gunesSistemiConfig } from './gunes-sistemi/config.js'
import { gunesDunyaAyConfig } from './gunes-dunya-ay/config.js'
import { gokcisimleriKatmanlariConfig } from './gokcisimleri-katmanlari/config.js'
import { gunesYapisiConfig } from './gunes-yapisi/config.js'
import { uzaklikVeGorunenBoyutConfig } from './uzaklik-ve-gorunen-boyut/config.js'
import { tarihiSahislarConfig } from './tarihi-sahislar/config.js'
import { arsimetPrensibiConfig } from './arsimet-prensibi/config.js'
import { atomTarihselGelisimiConfig } from './atom-modelinin-tarihsel-gelisimi/config.js'
import { elektroskop3dConfig } from './elektroskop-3d/config.js'
import { ayinEvreleri3dConfig } from './ayin-evreleri-3d/config.js'
import { LEGACY_REGISTRY } from './registry-legacy.js'

const MODERN_REGISTRY = [
  {
    slug: gunesSistemiConfig.slug,
    config: gunesSistemiConfig,
    loadPage: () => import('./gunes-sistemi/index.vue'),
    loadScene: () => import('./gunes-sistemi.vue'),
  },
  {
    slug: gunesDunyaAyConfig.slug,
    config: gunesDunyaAyConfig,
    loadPage: () => import('./gunes-dunya-ay/index.vue'),
    loadScene: () => import('./gunes-dunya-ay.vue'),
  },
  {
    slug: gokcisimleriKatmanlariConfig.slug,
    config: gokcisimleriKatmanlariConfig,
    loadPage: () => import('./gokcisimleri-katmanlari/index.vue'),
    loadScene: () => import('./gokcisimleri-katmanlari.vue'),
  },
  {
    slug: gunesYapisiConfig.slug,
    config: gunesYapisiConfig,
    loadPage: () => import('./gunes-yapisi/index.vue'),
    loadScene: () => import('./gunes-yapisi.vue'),
  },
  {
    slug: uzaklikVeGorunenBoyutConfig.slug,
    config: uzaklikVeGorunenBoyutConfig,
    loadPage: () => import('./uzaklik-ve-gorunen-boyut/index.vue'),
    loadScene: () => import('./uzaklik-ve-gorunen-boyut.vue'),
  },
  {
    slug: tarihiSahislarConfig.slug,
    config: tarihiSahislarConfig,
    loadPage: () => import('./tarihi-sahislar/index.vue'),
    loadScene: () => import('./tarihi-sahislar.vue'),
  },
  {
    slug: arsimetPrensibiConfig.slug,
    config: arsimetPrensibiConfig,
    loadPage: () => import('./arsimet-prensibi/index.vue'),
    loadScene: () => import('./arsimet-prensibi.vue'),
  },
  {
    slug: atomTarihselGelisimiConfig.slug,
    config: atomTarihselGelisimiConfig,
    loadPage: () => import('./atom-modelinin-tarihsel-gelisimi/index.vue'),
    loadScene: () => import('./atom-modelinin-tarihsel-gelisimi.vue'),
  },
  {
    slug: elektroskop3dConfig.slug,
    config: elektroskop3dConfig,
    loadPage: () => import('./elektroskop-3d/index.vue'),
    loadScene: () => import('./elektroskop-3d.vue'),
  },
  {
    slug: ayinEvreleri3dConfig.slug,
    config: ayinEvreleri3dConfig,
    loadPage: () => import('./ayin-evreleri-3d/index.vue'),
    loadScene: () => import('./ayin-evreleri-3d.vue'),
  },
]

const LEGACY_WITHOUT_MODERN = LEGACY_REGISTRY.filter(
  (entry) => !MODERN_REGISTRY.some((modern) => modern.slug === entry.slug),
)

/**
 * Tüm simülasyon girişleri burada kayıtlıdır.
 * Yeni simülasyon eklerken bu diziye bir kayıt ekleyin.
 */
export const SIMULATION_REGISTRY = [
  ...MODERN_REGISTRY,
  ...LEGACY_WITHOUT_MODERN,
]

export function getSimulationEntry(slug) {
  return SIMULATION_REGISTRY.find((entry) => entry.slug === slug) ?? null
}

export function getAllSimulationConfigs() {
  return SIMULATION_REGISTRY.map((entry) => entry.config)
}
