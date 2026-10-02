<script setup>
// Telefona paylaş: render edilmiş MP4'ü cihazın paylaşma menüsüne (Instagram, YouTube, WhatsApp…) verir.
// Web Share API yalnızca HTTPS ya da localhost'ta çalışır; yoksa "İndir" yedeği kullanılır.
import { computed, onMounted, ref } from 'vue';
import { api } from '../../api.js';
import { toast } from '../../toast.js';

const props = defineProps({
  projectId: { type: String, required: true },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
});

const renders = ref([]);
const file = ref('');
const busy = ref(false);
const mb = (n) => (n / 1024 / 1024).toFixed(1);

const url = computed(() => (file.value ? `/api/projects/${props.projectId}/renders/${encodeURIComponent(file.value)}` : ''));
const canShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function');

async function load() {
  try {
    renders.value = await api.renders(props.projectId);
    if (!renders.value.some((r) => r.file === file.value)) file.value = renders.value[0]?.file || '';
  } catch {
    renders.value = [];
  }
}
onMounted(load);

async function share() {
  if (!file.value) return;
  busy.value = true;
  try {
    const blob = await (await fetch(url.value)).blob();
    const f = new File([blob], file.value, { type: 'video/mp4' });
    if (!navigator.canShare({ files: [f] })) throw new Error('Bu cihaz video dosyası paylaşımını desteklemiyor; "İndir"i kullan.');
    // Not: metin kopyalanıp uygulamada yapıştırılır; çoğu uygulama paylaşılan metni yok sayar
    await navigator.share({ files: [f], title: props.title, text: props.text });
  } catch (e) {
    if (e.name !== 'AbortError') toast(e.message || 'Paylaşılamadı', 'err');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="sf">
    <div class="row">
      <strong class="grow">Telefona / uygulamaya paylaş</strong>
      <button class="btn sm ghost" title="Listeyi yenile" @click="load">↻</button>
    </div>
    <select v-model="file" class="input">
      <option v-if="!renders.length" value="">Henüz render yok</option>
      <option v-for="r in renders" :key="r.file" :value="r.file">{{ r.file }} · {{ mb(r.size) }} MB</option>
    </select>
    <div class="row gap">
      <button v-if="canShare" class="btn primary grow" :disabled="!file || busy" @click="share">{{ busy ? 'Hazırlanıyor…' : '📤 Paylaş (Instagram, YouTube…)' }}</button>
      <a class="btn grow" :class="{ disabled: !file }" :href="url || undefined" :download="file">⬇ İndir</a>
    </div>
    <p v-if="!canShare" class="dim small">
      Paylaşma menüsü bu adreste kapalı (yalnızca HTTPS'te çalışır). “İndir” ile MP4'ü kaydet, sonra Instagram uygulamasında galeriden seç.
      Telefondan erişmek için sunucuyu <code>npm run dev:lan</code> ile başlat.
    </p>
  </div>
</template>

<style scoped>
.sf { display: grid; gap: 6px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); }
.row { display: flex; align-items: center; gap: 6px; }
.grow { flex: 1; }
a.btn { text-align: center; text-decoration: none; display: inline-block; }
a.btn.disabled { pointer-events: none; opacity: .5; }
</style>
