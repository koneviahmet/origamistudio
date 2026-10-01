// Ortak kaynak deposu: varlıklar, temalar, metin stilleri, fontlar.
// Tüm ekranlar aynı nesneyi kullanır; diskteki değişiklikler (SSE) otomatik yansır.
import { shallowRef } from 'vue';
import { api, toLibMap } from './api.js';
import { onLive } from './live.js';
import { registerFonts } from './fonts.js';
import { mergeTaxonomy } from './componentTags.js';

export const resources = shallowRef({
  assets: new Map(),
  categories: [],
  themes: new Map(),
  textStyles: new Map(),
  components: [],
  characters: new Map(),
  taxonomy: mergeTaxonomy(null),
  taxonomyCustom: { facetler: {} },
  fonts: [],
  audio: [],
  media: [],
  ready: false,
});

const byId = (list) => new Map(list.map((x) => [x.id, x]));

async function loadPart(kind) {
  const cur = resources.value;
  const next = { ...cur };
  if (kind === 'library' || kind === 'all') {
    const d = await api.library();
    next.assets = toLibMap(d.assets);
    next.categories = d.categories;
  }
  if (kind === 'themes' || kind === 'all') next.themes = byId(await api.colList('themes'));
  if (kind === 'textstyles' || kind === 'all') next.textStyles = byId(await api.colList('textstyles'));
  if (kind === 'components' || kind === 'all') {
    next.components = await api.colList('components');
    next.taxonomyCustom = await api.componentTags().catch(() => ({ facetler: {} }));
    next.taxonomy = mergeTaxonomy(next.taxonomyCustom);
  }
  if (kind === 'characters' || kind === 'all') next.characters = byId(await api.colList('characters'));
  if (kind === 'audio' || kind === 'all') next.audio = await api.audio();
  if (kind === 'media' || kind === 'all') next.media = await api.media();
  if (kind === 'fonts' || kind === 'all') {
    next.fonts = await api.fonts();
    registerFonts(next.fonts);
  }
  next.ready = true;
  resources.value = next;
  return next;
}

let first = null;
/** İlk çağrıda her şeyi yükler; sonrakilerde aynı sözü döndürür. */
export function loadResources() {
  if (!first) {
    first = loadPart('all');
    onLive((e) => {
      if (e.kind === 'library') loadPart('library');
      else if (e.kind === 'design') loadPart(e.col);
      else if (e.kind === 'fonts') loadPart('fonts');
      else if (e.kind === 'audio') loadPart('audio');
      else if (e.kind === 'media') loadPart('media');
    });
  }
  return first;
}

export const reloadResources = (kind = 'all') => loadPart(kind);
