<script setup>
// YouTube'a yükleme: hesabı bağla (bir kez), projenin render'larından birini seç, başlık/açıklama/etiketleri
// scene.publish'ten al, yükle. Sunucu resumable upload yapar; ilerleme SSE ile gelir.
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../../api.js';
import { useLive } from '../../live.js';
import { toast } from '../../toast.js';

const props = defineProps({
  projectId: { type: String, required: true },
  scene: { type: Object, required: true },
});

const st = ref(null);
const renders = ref([]);
const file = ref('');
const privacy = ref('private');
const kids = ref(false);
const shorts = ref(false);
const job = ref(null);
const setup = ref(false);
const cid = ref('');
const csec = ref('');
const busy = ref(false);

const pub = computed(() => props.scene.publish || {});
const active = computed(() => job.value && ['starting', 'uploading'].includes(job.value.status));
const pct = computed(() => (job.value?.total ? Math.round((job.value.sent / job.value.total) * 100) : 0));
const mb = (n) => (n / 1024 / 1024).toFixed(1);

async function load() {
  try {
    st.value = await api.ytStatus();
    cid.value = st.value.clientId;
    setup.value = !st.value.configured;
    renders.value = await api.renders(props.projectId);
    if (!renders.value.some((r) => r.file === file.value)) file.value = renders.value[0]?.file || '';
    // dikey ve ≤3 dk ise Shorts önerilir
    shorts.value = props.scene.height > props.scene.width && props.scene.duration <= 180;
  } catch (e) {
    toast(e.message, 'err');
  }
}
onMounted(load);
watch(() => props.projectId, load);
useLive((evt) => {
  if (evt.kind === 'youtube') load();
  else if (evt.kind === 'youtube-job' && evt.job.projectId === props.projectId) job.value = evt.job;
  else if (evt.kind === 'projects') api.renders(props.projectId).then((r) => (renders.value = r)).catch(() => {});
});

async function saveCfg() {
  busy.value = true;
  try {
    st.value = await api.ytConfig({ clientId: cid.value, clientSecret: csec.value });
    csec.value = '';
    setup.value = false;
    toast('Kaydedildi', 'ok');
  } catch (e) {
    toast(e.message, 'err');
  } finally {
    busy.value = false;
  }
}
async function connect() {
  try {
    const { url } = await api.ytAuth();
    window.open(url, '_blank', 'width=520,height=700');
  } catch (e) {
    toast(e.message, 'err');
  }
}
async function disconnect() {
  st.value = await api.ytDisconnect();
}
const VOICE_CREDIT = 'Ses Veri Seti: Alania Synthetic Speech TR (CC BY 4.0) - https://huggingface.co/datasets/cloud0day3/alania-synthetic-speech-tr';
const withCredit = (d) => (String(d || '').includes(VOICE_CREDIT) ? d : `${d || ''}\n\n${VOICE_CREDIT}`.trim());
async function upload() {
  try {
    job.value = await api.ytUpload(props.projectId, {
      file: file.value, privacy: privacy.value, title: pub.value.title, description: withCredit(pub.value.description),
      tags: pub.value.tags, madeForKids: kids.value, shorts: shorts.value,
    });
  } catch (e) {
    toast(e.message, 'err');
  }
}
const canUpload = computed(() => st.value?.connected && file.value && pub.value.title && !active.value);
</script>

<template>
  <div v-if="st" class="yt">
    <div class="row head">
      <strong class="grow">▶ YouTube'a yükle</strong>
      <button v-if="st.configured" class="btn sm" @click="setup = !setup">Ayarlar</button>
    </div>

    <div v-if="setup" class="box">
      <p class="dim small">
        Tek seferlik kurulum: <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank">Google Cloud</a>'da
        projede <b>YouTube Data API v3</b>'ü etkinleştir → <b>OAuth izin ekranı</b>nda kendi hesabını “test kullanıcısı” ekle →
        <b>Kimlik bilgileri → OAuth istemci kimliği</b> oluştur (tür: Web uygulaması) ve şu yönlendirme URI'sini ekle:
      </p>
      <code class="uri">{{ st.redirectUri }}</code>
      <input v-model="cid" class="input" placeholder="İstemci kimliği (….apps.googleusercontent.com)" />
      <input v-model="csec" class="input" type="password" :placeholder="st.configured ? 'Gizli anahtar (değiştirmek için doldur)' : 'İstemci gizli anahtarı'" />
      <button class="btn primary" :disabled="busy || !cid || (!csec && !st.configured)" @click="saveCfg">Kaydet</button>
    </div>

    <div v-if="st.configured && !st.connected" class="box">
      <p class="dim small">Hesabını bir kez bağla; sonra tek tıkla yüklersin.</p>
      <button class="btn primary" @click="connect">YouTube hesabını bağla</button>
    </div>

    <template v-if="st.connected">
      <div class="row small"><span class="grow">Bağlı kanal: <b>{{ st.channel || '—' }}</b></span><a href="#" @click.prevent="disconnect">Bağlantıyı kes</a></div>

      <div class="field">
        <label>Video dosyası</label>
        <select v-model="file" class="input" :disabled="active">
          <option v-if="!renders.length" value="">Henüz render yok</option>
          <option v-for="r in renders" :key="r.file" :value="r.file">{{ r.file }} · {{ mb(r.size) }} MB</option>
        </select>
        <p v-if="!renders.length" class="dim small">Dışa aktar penceresinde “Projeye de kaydet” açıkken MP4 oluştur, ya da <code>npm run render -- {{ projectId }}</code>.</p>
      </div>
      <div class="field">
        <label>Gizlilik</label>
        <select v-model="privacy" class="input" :disabled="active">
          <option value="private">Özel (önce kontrol et)</option>
          <option value="unlisted">Liste dışı</option>
          <option value="public">Herkese açık</option>
        </select>
      </div>
      <label class="row small"><input v-model="shorts" type="checkbox" :disabled="active" /> Shorts olarak işaretle (#Shorts ekle)</label>
      <label class="row small"><input v-model="kids" type="checkbox" :disabled="active" /> Çocuklara özel içerik</label>
      <p v-if="!pub.title" class="dim small">Başlık boş — aşağıdaki alandan doldur (başlık, açıklama ve etiketler buradan gider).</p>
      <p v-else class="dim small">Başlık: <b>{{ pub.title }}</b> · {{ (pub.tags || []).length }} etiket</p>

      <button class="btn primary" :disabled="!canUpload" @click="upload">{{ active ? 'Yükleniyor…' : '⬆ YouTube\'a yükle' }}</button>

      <div v-if="job" class="box">
        <template v-if="active">
          <div class="bar"><span :style="{ width: pct + '%' }" /></div>
          <div class="small">%{{ pct }} · {{ mb(job.sent) }} / {{ mb(job.total) }} MB</div>
        </template>
        <div v-else-if="job.status === 'done'" class="ok small">
          ✓ Yüklendi. <a :href="job.url" target="_blank">{{ job.url }}</a> ·
          <a :href="job.studioUrl" target="_blank">YouTube Studio'da aç</a>
        </div>
        <div v-else-if="job.status === 'error'" class="err small">{{ job.error }}</div>
      </div>
      <p class="dim small">Not: Doğrulanmamış (denetimden geçmemiş) API projeleriyle yüklenen videolar YouTube tarafından “özel” kilitlenebilir; Google'ın API denetimi gerekir.</p>
    </template>
  </div>
</template>

<style scoped>
.yt { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-2); }
.box { display: grid; gap: 6px; }
.uri { display: block; padding: 4px 6px; background: var(--bg); border-radius: 6px; font-size: 12px; user-select: all; word-break: break-all; }
.bar { height: 8px; background: var(--bg); border-radius: 99px; overflow: hidden; border: 1px solid var(--line); }
.bar span { display: block; height: 100%; background: var(--accent); transition: width .3s; }
.ok { color: #8fe3a0; }
.err { color: #ff8a8a; }
</style>
