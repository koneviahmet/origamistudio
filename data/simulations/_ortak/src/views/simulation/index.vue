<script setup>
import { computed, ref, watch } from 'vue'
import { SIMULATIONS } from '../../data/simulations.js'
import { LEGACY_METADATA } from './legacy/metadata.js'

const query = ref('')
const activeCategory = ref('all')
const searchRef = ref(null)

const CATEGORY_LABELS = {
  all: 'Tümü',
  fizik: 'Fizik',
  kimya: 'Kimya',
  biyoloji: 'Biyoloji',
  astronomi: 'Astronomi',
  optik: 'Optik',
  besin: 'Beslenme',
  'fen bilimleri': 'Fen',
  enerji: 'Enerji',
  diger: 'Diğer',
}

function normalizeText(value) {
  return (value ?? '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function resolveCategory(sim, tags) {
  if (sim.slug === 'gunes-sistemi') return 'astronomi'
  if (sim.slug.startsWith('ayin-evreleri')) return 'astronomi'
  if (sim.slug === 'kablonun-iletkenligi') return 'fizik'

  let category = normalizeText(sim.subtitle)
  if (!category || category.length > 20 || category.includes('-')) {
    category = normalizeText(tags[0]) || 'diger'
  }
  return category
}

const enrichedSimulations = computed(() =>
  SIMULATIONS.map((sim) => {
    const meta = LEGACY_METADATA[sim.slug]
    const tags = meta?.attach ?? []
    const category = resolveCategory(sim, tags)

    const searchBlob = normalizeText(
      [sim.title, sim.description, sim.subtitle, sim.slug, ...tags].join(' '),
    )

    return {
      ...sim,
      tags,
      category,
      searchBlob,
    }
  }),
)

const categories = computed(() => {
  const counts = new Map()
  for (const sim of enrichedSimulations.value) {
    counts.set(sim.category, (counts.get(sim.category) ?? 0) + 1)
  }

  return [
    { id: 'all', label: 'Tümü', count: enrichedSimulations.value.length },
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        id,
        label: CATEGORY_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
        count,
      })),
  ]
})

const filteredSimulations = computed(() => {
  const q = normalizeText(query.value.trim())

  return enrichedSimulations.value.filter((sim) => {
    if (activeCategory.value !== 'all' && sim.category !== activeCategory.value) {
      return false
    }
    if (!q) return true
    return sim.searchBlob.includes(q)
  })
})

watch(query, () => {
  if (activeCategory.value !== 'all' && filteredSimulations.value.length === 0) {
    // keep category; empty state will show
  }
})

function onSearchKeydown(event) {
  if (event.key === 'Escape') {
    query.value = ''
    searchRef.value?.blur()
  }
}
</script>

<template>
  <div class="sim-index">
    <header class="sim-index__header">
      <div class="sim-index__top">
        <div class="sim-index__brand">
          <router-link
            to="/"
            class="sim-index__back"
            aria-label="Ana sayfa"
          >
            ←
          </router-link>
          <div>
            <h1 class="sim-index__title">
              Simülasyonlar
            </h1>
            <p class="sim-index__meta">
              {{ filteredSimulations.length }} / {{ SIMULATIONS.length }}
            </p>
          </div>
        </div>

        <div class="sim-index__search-wrap">
          <span
            class="sim-index__search-icon"
            aria-hidden="true"
          >⌕</span>
          <input
            ref="searchRef"
            v-model="query"
            type="search"
            class="sim-index__search"
            placeholder="Simülasyon ara…"
            autocomplete="off"
            @keydown="onSearchKeydown"
          >
          <button
            v-if="query"
            type="button"
            class="sim-index__search-clear"
            aria-label="Aramayı temizle"
            @click="query = ''"
          >
            ×
          </button>
        </div>
      </div>

      <div
        class="sim-index__filters"
        role="tablist"
        aria-label="Kategori filtresi"
      >
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="sim-index__filter"
          :class="{ 'sim-index__filter--active': activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          {{ cat.label }}
          <span class="sim-index__filter-count">{{ cat.count }}</span>
        </button>
      </div>
    </header>

    <div class="sim-index__body">
      <div
        v-if="filteredSimulations.length === 0"
        class="sim-index__empty"
      >
        <p>Sonuç bulunamadı.</p>
        <button
          type="button"
          class="sim-index__reset"
          @click="query = ''; activeCategory = 'all'"
        >
          Filtreleri temizle
        </button>
      </div>

      <div
        v-else
        class="sim-index__grid"
      >
        <component
          :is="sim.available ? 'router-link' : 'div'"
          v-for="sim in filteredSimulations"
          :key="sim.slug"
          :to="sim.available ? sim.route : undefined"
          class="sim-card"
          :class="{ 'sim-card--disabled': !sim.available }"
          :style="{ '--card-accent': sim.accent }"
        >
          <span class="sim-card__category">{{ sim.category }}</span>

          <strong class="sim-card__title">{{ sim.title }}</strong>

          <span
            v-if="!sim.available"
            class="sim-card__badge"
          >
            Yakında
          </span>
        </component>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sim-index {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(ellipse 90% 40% at 50% -20%, rgba(251, 191, 36, 0.08), transparent),
    #050814;
}

.sim-index__header {
  flex-shrink: 0;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(5, 8, 20, 0.92);
  backdrop-filter: blur(8px);
}

.sim-index__top {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.sim-index__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.sim-index__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.15s, border-color 0.15s;
}

.sim-index__back:hover {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.35);
}

.sim-index__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.2;
}

.sim-index__meta {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #64748b;
}

.sim-index__search-wrap {
  position: relative;
  flex: 1;
  min-width: min(100%, 280px);
  max-width: 420px;
  margin-left: auto;
}

.sim-index__search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 0.95rem;
  pointer-events: none;
}

.sim-index__search {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 2.25rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}

.sim-index__search::placeholder {
  color: #64748b;
}

.sim-index__search:focus {
  border-color: rgba(251, 191, 36, 0.45);
}

.sim-index__search-clear {
  position: absolute;
  right: 0.35rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.sim-index__search-clear:hover {
  color: #f8fafc;
  background: rgba(148, 163, 184, 0.12);
}

.sim-index__filters {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding-bottom: 0.15rem;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.sim-index__filter {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 999px;
  background: transparent;
  color: #94a3b8;
  font-size: 0.78rem;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.sim-index__filter:hover {
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.3);
}

.sim-index__filter--active {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.08);
}

.sim-index__filter-count {
  font-size: 0.68rem;
  color: #64748b;
}

.sim-index__filter--active .sim-index__filter-count {
  color: #fbbf24;
}

.sim-index__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 1rem 1.25rem 1.5rem;
}

.sim-index__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.65rem;
  width: 100%;
}

@media (min-width: 900px) {
  .sim-index__grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
  }
}

.sim-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 5.5rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  text-decoration: none;
  transition: border-color 0.15s, transform 0.12s, background 0.15s;
  position: relative;
}

.sim-card:not(.sim-card--disabled):hover {
  border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
  background: rgba(15, 23, 42, 0.85);
  transform: translateY(-1px);
}

.sim-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sim-card__category {
  align-self: flex-start;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.1);
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: capitalize;
  color: var(--card-accent);
}

.sim-card__title {
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.35;
  color: #f1f5f9;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sim-card__badge {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  font-size: 0.62rem;
  color: #94a3b8;
}

.sim-index__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 40vh;
  color: #94a3b8;
  text-align: center;
}

.sim-index__empty p {
  margin: 0;
}

.sim-index__reset {
  padding: 0.45rem 0.85rem;
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.08);
  color: #fbbf24;
  font-size: 0.85rem;
  cursor: pointer;
}

.sim-index__reset:hover {
  background: rgba(251, 191, 36, 0.14);
}
</style>
