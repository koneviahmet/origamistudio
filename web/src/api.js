async function req(method, url, body) {
  const res = await fetch(`/api${url}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

export const api = {
  simulations: () => req('GET', '/simulations'),
  simulation: (slug, kaynak = false) => req('GET', `/simulations/${slug}${kaynak ? '?kaynak=1' : ''}`),
  updateSimulation: (slug, patch) => req('PATCH', `/simulations/${slug}`, patch),
  deleteSimulation: (slug) => req('DELETE', `/simulations/${slug}`),
  onayListe: () => req('GET', '/onay'),
  onay: (id) => req('GET', `/onay/${id}`),
  onayKarar: (id, oge, body) => req('PATCH', `/onay/${id}/ogeler/${oge}`, body),
  onayToplu: (id, body) => req('POST', `/onay/${id}/toplu`, body),
  onayGorselEkle: async (id, oge, blob) => {
    const res = await fetch(`/api/onay/${id}/ogeler/${oge}/gorsel`, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/png' }, body: blob });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
  onayGorselSil: (id, oge, ad) => req('DELETE', `/onay/${id}/ogeler/${oge}/gorsel/${encodeURIComponent(ad)}`),
  onayArsiv: (id, arsiv) => req('POST', `/onay/${id}/arsiv`, { arsiv }),
  ytStatus: () => req('GET', '/youtube/status'),
  ytConfig: (cfg) => req('PUT', '/youtube/config', cfg),
  ytAuth: () => req('GET', '/youtube/auth'),
  ytDisconnect: () => req('POST', '/youtube/disconnect'),
  ytJob: (id) => req('GET', `/youtube/jobs/${id}`),
  renders: (id) => req('GET', `/projects/${id}/renders`),
  ytUpload: (id, body) => req('POST', `/projects/${id}/youtube-upload`, body),
  saveRender: async (id, name, blob) => {
    const res = await fetch(`/api/projects/${id}/renders/${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'video/mp4' }, body: blob });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
  ollaya: () => req('GET', '/ollaya'),
  setOllaya: (aktif) => req('PUT', '/ollaya', { aktif }),
  library: () => req('GET', '/library'),
  categories: () => req('GET', '/categories'),
  categoryAssets: (cat) => req('GET', `/categories/${encodeURIComponent(cat)}/assets`),
  asset: (cat, id) => req('GET', `/library/${encodeURIComponent(cat)}/${encodeURIComponent(id)}`),
  createAsset: (a) => req('POST', '/library', a),
  updateAsset: (id, a) => req('PUT', `/library/${id}`, a),
  deleteAsset: (id) => req('DELETE', `/library/${id}`),
  createCategory: (name) => req('POST', '/categories', { name }),
  renameCategory: (name, newName) => req('PATCH', `/categories/${name}`, { name: newName }),
  deleteCategory: (name) => req('DELETE', `/categories/${name}`),

  projects: () => req('GET', '/projects'),
  project: (id) => req('GET', `/projects/${id}`),
  createProject: (scene) => req('POST', '/projects', scene),
  saveScene: (id, scene) => req('PUT', `/projects/${id}`, scene),
  duplicateProject: (id, name) => req('POST', `/projects/${id}/duplicate`, { name }),
  archiveProject: (id, archived = true) => req('POST', `/projects/${id}/archive`, { archived }),
  deleteProject: (id) => req('DELETE', `/projects/${id}`),

  saveSnapshot: async (id, name, blob) => {
    const res = await fetch(`/api/projects/${id}/snapshots/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: blob,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },

  // temalar (themes) ve metin stilleri (textstyles)
  colList: (col) => req('GET', `/col/${col}`),
  colCreate: (col, doc) => req('POST', `/col/${col}`, doc),
  colUpdate: (col, id, doc) => req('PUT', `/col/${col}/${id}`, doc),
  colDelete: (col, id) => req('DELETE', `/col/${col}/${id}`),

  audio: () => req('GET', '/audio'),
  uploadAudio: async (file) => {
    const res = await fetch(`/api/audio?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
  deleteAudio: (file) => req('DELETE', `/audio/${encodeURIComponent(file)}`),
  templates: () => req('GET', '/templates'),
  templateMeta: () => req('GET', '/templates/meta'),
  componentTags: () => req('GET', '/component-tags'),
  saveComponentTags: (facetler) => req('PUT', '/component-tags', { facetler }),
  templateMetaAll: () => req('GET', '/template-meta'),
  setTemplateMeta: (key, patch) => req('PUT', '/template-meta', { key, ...patch }),
  userTemplates: () => req('GET', '/user-templates'),
  saveAsTemplate: (projectId, ad, aciklama) => req('POST', '/user-templates', { projectId, ad, aciklama }),
  updateUserTemplate: (id, patch) => req('PATCH', `/user-templates/${id}`, patch),
  deleteUserTemplate: (id) => req('DELETE', `/user-templates/${id}`),
  previewTemplate: (brief) => req('POST', '/templates/preview', brief),
  generateFromTemplate: (brief) => req('POST', '/templates/generate', brief),
  media: () => req('GET', '/media'),
  uploadMedia: async (file) => {
    const res = await fetch(`/api/media?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
  deleteMedia: (file) => req('DELETE', `/media/${encodeURIComponent(file)}`),

  fonts: () => req('GET', '/fonts'),
  addFont: (family, category) => req('POST', '/fonts', { family, category }),
  updateFont: (family, patch) => req('PATCH', `/fonts/${encodeURIComponent(family)}`, patch),
  deleteFont: (family) => req('DELETE', `/fonts/${encodeURIComponent(family)}`),

  muzikStatus: () => req('GET', '/muzik/status'),
  muzikStart: () => req('POST', '/muzik/start'),
  muzikPreview: (opts) => req('POST', '/muzik/preview', opts),
  muzikKeep: (file, name) => req('POST', '/muzik/keep', { file, name }),
  ttsStatus: () => req('GET', '/tts/status'),
  ttsStart: () => req('POST', '/tts/start'),
  ttsVoices: (q) => req('GET', `/tts/voices?${new URLSearchParams(q)}`),
  ttsTags: () => req('GET', '/tts/tags'),
  ttsTagAuto: () => req('POST', '/tts/tags/auto'),
  ttsTagCreate: (tag) => req('POST', '/tts/tags', tag),
  ttsTagUpdate: (id, patch) => req('PUT', `/tts/tags/${id}`, patch),
  ttsTagDelete: (id) => req('DELETE', `/tts/tags/${id}`),
  ttsVoiceTags: (id, tags) => req('PUT', `/tts/voices/${id}/tags`, { tags }),
  ttsSaved: () => req('GET', '/tts/saved'),
  ttsSave: (id, name) => req('PUT', `/tts/saved/${id}`, { name }),
  ttsRemove: (id) => req('DELETE', `/tts/saved/${id}`),
  ttsPreview: (text, voice) => req('POST', '/tts/preview', { text, voice }),
  ttsKeep: (file, name) => req('POST', '/tts/keep', { file, name }),

  history: (id) => req('GET', `/projects/${id}/history`),
  historyGet: (id, ts) => req('GET', `/projects/${id}/history/${ts}`),
  historyRestore: (id, ts) => req('POST', `/projects/${id}/history/${ts}/restore`),

  notes: (id) => req('GET', `/projects/${id}/notes`),
  addNote: (id, note) => req('POST', `/projects/${id}/notes`, note),
  updateNote: (id, noteId, patch) => req('PATCH', `/projects/${id}/notes/${noteId}`, patch),
  applyNotes: (id) => req('POST', `/projects/${id}/notes-apply`),
  deleteNote: (id, noteId) => req('DELETE', `/projects/${id}/notes/${noteId}`),
};

/** Kütüphane yanıtını motorun beklediği Map'e çevirir. */
export function toLibMap(assets) {
  return new Map(assets.map((a) => [a.id, a]));
}
