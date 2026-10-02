<script setup>
// Paylaşım paneli: videoya ait başlık, açıklama ve etiketler (scene.publish). Platforma göre biçimlenmiş,
// tek tıkla kopyalanabilir çıktılar: YouTube, Instagram, TikTok.
import { computed, ref } from 'vue';
import { toast } from '../../toast.js';
import YoutubeUpload from './YoutubeUpload.vue';
import ShareFile from './ShareFile.vue';

const props = defineProps({
  scene: { type: Object, required: true },
  edit: { type: Function, required: true },
  projectId: { type: String, default: '' },
});

const platform = ref('youtube');
const tagDraft = ref('');
const tagInput = ref(null);

const pub = computed(() => props.scene.publish || { title: '', description: '', tags: [] });
const tags = computed(() => pub.value.tags || []);

function ensure() {
  if (!props.scene.publish) props.scene.publish = { title: '', description: '', tags: [] };
  return props.scene.publish;
}
function set(key, v) {
  props.edit(() => {
    ensure()[key] = v;
  }, `pub:${key}`);
}
const cleanTag = (s) => s.replace(/^#+/, '').replace(/\s+/g, '').trim();
function addTags(text) {
  const sep = /[,\n#]/.test(text) ? /[,\n#]/ : /\s+/;
  const parts = text.split(sep).map(cleanTag).filter(Boolean);
  if (!parts.length) return;
  props.edit(() => {
    const p = ensure();
    p.tags = [...(p.tags || [])];
    for (const t of parts) if (!p.tags.some((x) => x.toLocaleLowerCase('tr') === t.toLocaleLowerCase('tr'))) p.tags.push(t);
  });
}
function removeTag(i) {
  props.edit(() => ensure().tags.splice(i, 1));
}
function tagKey(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addTags(tagDraft.value);
    tagDraft.value = '';
  } else if (e.key === 'Backspace' && !tagDraft.value && tags.value.length) {
    removeTag(tags.value.length - 1);
  }
}
function tagPaste(e) {
  const text = e.clipboardData?.getData('text') || '';
  if (/[,\n#\s]/.test(text.trim())) {
    e.preventDefault();
    addTags(text);
    tagDraft.value = '';
  }
}
function tagBlur() {
  if (tagDraft.value.trim()) addTags(tagDraft.value);
  tagDraft.value = '';
}

const PLATFORMS = {
  youtube: { ad: 'YouTube', titleMax: 100, descMax: 5000, tagsMax: 500 },
  instagram: { ad: 'Instagram', descMax: 2200, hashMax: 30 },
  tiktok: { ad: 'TikTok', descMax: 2200, hashMax: 8 },
};
// Her platformda açıklamanın en altına otomatik eklenir (sunucuda YouTube yüklemesine de eklenir)
const VOICE_CREDIT = 'Ses Veri Seti: Alania Synthetic Speech TR (CC BY 4.0) - https://huggingface.co/datasets/cloud0day3/alania-synthetic-speech-tr';
const hash = (list) => list.map((t) => `#${t}`).join(' ');

// Platforma göre hazır çıktılar
const outputs = computed(() => {
  const p = pub.value;
  const t = p.title || '';
  const d = p.description || '';
  const tg = tags.value;
  if (platform.value === 'youtube') {
    const tagStr = tg.join(', ');
    return [
      { key: 'Başlık', text: t, max: 100 },
      { key: 'Açıklama', text: [d, tg.length ? hash(tg.slice(0, 3)) : '', VOICE_CREDIT].filter(Boolean).join('\n\n'), max: 5000, hint: 'İlk 3 etiket açıklama sonuna #etiket olarak eklenir (YouTube başlığın üstünde gösterir).' },
      { key: 'Etiketler', text: tagStr, max: 500, hint: 'Studio → Daha fazla göster → Etiketler alanına virgülle ayrılmış yapıştır.' },
    ];
  }
  if (platform.value === 'instagram') {
    const cap = [t, d, VOICE_CREDIT, tg.length ? hash(tg.slice(0, 30)) : ''].filter(Boolean).join('\n\n');
    return [{ key: 'Alt yazı (caption)', text: cap, max: 2200, hint: tg.length > 30 ? 'Instagram en fazla 30 etiketi kabul eder; ilk 30 alındı.' : '' }];
  }
  const cap = [t, d].filter(Boolean).join(' — ');
  const max = 2200;
  const room = Math.max(0, max - cap.length - VOICE_CREDIT.length - 4);
  let hs = '';
  for (const x of tg.slice(0, 8)) {
    if ((hs + ` #${x}`).length > room) break;
    hs += ` #${x}`;
  }
  return [{ key: 'Açıklama', text: `${cap + hs}\n\n${VOICE_CREDIT}`.trim(), max, hint: 'TikTok için az ama isabetli etiket (en çok 8) önerilir.' }];
});

const meta = computed(() => PLATFORMS[platform.value]);
async function copy(text, name) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(`${name} kopyalandı`, 'ok');
}
const copyAll = () => copy(outputs.value.map((o) => `${o.key}\n${o.text}`).join('\n\n'), 'Tümü');
const empty = computed(() => !pub.value.title && !pub.value.description && !tags.value.length);
</script>

<template>
  <div class="pp" @keydown.stop>
    <YoutubeUpload v-if="projectId" :project-id="projectId" :scene="scene" />
    <ShareFile v-if="projectId" :project-id="projectId" :title="pub.title" :text="outputs[outputs.length > 1 ? 1 : 0]?.text" />
    <p v-if="empty" class="dim small">
      Bu videonun paylaşım bilgisi henüz boş. Aşağıyı doldur; ya da yapay zekadan yeni proje isterken otomatik dolar.
    </p>

    <div class="field">
      <label>Başlık <span class="cnt" :class="{ over: (pub.title || '').length > 100 }">{{ (pub.title || '').length }}/100</span></label>
      <input class="input" :value="pub.title" placeholder="Videonun başlığı" @input="set('title', $event.target.value)" />
    </div>
    <div class="field">
      <label>Açıklama <span class="cnt">{{ (pub.description || '').length }}</span></label>
      <textarea class="input" rows="6" :value="pub.description" placeholder="Kısa, merak uyandıran açıklama…" @input="set('description', $event.target.value)" />
    </div>
    <div class="field">
      <label>Etiketler <span class="cnt">{{ tags.length }}</span></label>
      <div class="tags" @click="tagInput.focus()">
        <span v-for="(t, i) in tags" :key="t" class="tag">#{{ t }}<button type="button" title="Kaldır" @click.stop="removeTag(i)">✕</button></span>
        <input ref="tagInput" v-model="tagDraft" class="tin" placeholder="etiket yaz, Enter" @keydown="tagKey" @paste="tagPaste" @blur="tagBlur" />
      </div>
    </div>

    <div class="sec-title">Kopyala</div>
    <div class="ptabs">
      <button v-for="(m, k) in PLATFORMS" :key="k" :class="{ active: platform === k }" @click="platform = k">{{ m.ad }}</button>
    </div>
    <div v-for="o in outputs" :key="platform + o.key" class="out">
      <div class="row oh">
        <strong class="grow">{{ o.key }}</strong>
        <span class="cnt" :class="{ over: o.text.length > o.max }">{{ o.text.length }}/{{ o.max }}</span>
        <button class="btn sm primary" :disabled="!o.text" @click="copy(o.text, o.key)">Kopyala</button>
      </div>
      <pre class="txt" :class="{ none: !o.text }">{{ o.text || '(boş)' }}</pre>
      <p v-if="o.hint" class="dim small">{{ o.hint }}</p>
    </div>
    <button class="btn" :disabled="empty" @click="copyAll">Hepsini kopyala ({{ meta.ad }})</button>
  </div>
</template>

<style scoped>
.pp { display: grid; gap: 10px; padding: 10px; align-content: start; }
.sec-title { margin-top: 6px; font-weight: 600; }
.cnt { float: right; font-size: 11px; color: var(--text-3); text-transform: none; letter-spacing: 0; }
.cnt.over { color: #ff8a8a; }
textarea.input { resize: vertical; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; cursor: text; }
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 4px 2px 8px; border-radius: 999px; background: #2d2118; border: 1px solid #4a3426; font-size: 12px; }
.tag button { border: 0; background: transparent; color: var(--text-3); cursor: pointer; padding: 0 4px; font-size: 10px; }
.tag button:hover { color: #ff8a8a; }
.tin { flex: 1; min-width: 110px; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
.ptabs { display: flex; gap: 4px; }
.ptabs button { flex: 1; padding: 6px; border: 1px solid var(--line); background: transparent; color: var(--text-2); border-radius: 8px; cursor: pointer; font: inherit; }
.ptabs button.active { border-color: var(--accent); color: var(--text); background: #2d2118; }
.out { display: grid; gap: 4px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); }
.oh { gap: 8px; }
.oh .cnt { float: none; }
.txt { margin: 0; white-space: pre-wrap; word-break: break-word; font: inherit; font-size: 12.5px; max-height: 220px; overflow: auto; user-select: text; }
.txt.none { color: var(--text-3); }
</style>
