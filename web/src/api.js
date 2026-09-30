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
  library: () => req('GET', '/library'),
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

  fonts: () => req('GET', '/fonts'),
  addFont: (family, category) => req('POST', '/fonts', { family, category }),
  updateFont: (family, patch) => req('PATCH', `/fonts/${encodeURIComponent(family)}`, patch),
  deleteFont: (family) => req('DELETE', `/fonts/${encodeURIComponent(family)}`),

  history: (id) => req('GET', `/projects/${id}/history`),
  historyGet: (id, ts) => req('GET', `/projects/${id}/history/${ts}`),
  historyRestore: (id, ts) => req('POST', `/projects/${id}/history/${ts}/restore`),

  notes: (id) => req('GET', `/projects/${id}/notes`),
  addNote: (id, note) => req('POST', `/projects/${id}/notes`, note),
  updateNote: (id, noteId, patch) => req('PATCH', `/projects/${id}/notes/${noteId}`, patch),
  deleteNote: (id, noteId) => req('DELETE', `/projects/${id}/notes/${noteId}`),
};

/** Kütüphane yanıtını motorun beklediği Map'e çevirir. */
export function toLibMap(assets) {
  return new Map(assets.map((a) => [a.id, a]));
}
