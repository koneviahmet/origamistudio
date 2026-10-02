<script setup>
// Onay kuyruğu: Claude'un video için seçtiği nesne ve sesleri sırayla onaylatma sayfası.
// Veri: data/onay/<oturum>.json (CLI: npm run onay). Aynı sayfa birden fazla video oturumunu taşır.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api.js';
import { useLive } from '../live.js';
import { toast, toastError } from '../toast.js';
import AssetCanvas from '../components/AssetCanvas.vue';
import ParticlePreview from '../components/ParticlePreview.vue';
import ArrowPreview from '../components/ArrowPreview.vue';

const props = defineProps({ id: { type: String, default: '' } });
const router = useRouter();

const oturumlar = ref([]);
const oturum = ref(null);
const assets = ref({}); // ref → kütüphane varlığı (önizleme için)
const mod = ref('sirayla'); // sirayla | liste
const aktif = ref(0);
const arsivGoster = ref(false);
const notlar = ref({}); // ogeId → yazılmakta olan not (kayda kadar)
let audio = null;
const caliyor = ref('');

const KARAR = {
  kullan: { ad: 'Kullan', sinif: 'ok' },
  kullanma: { ad: 'Kullanma', sinif: 'no' },
  duzenle: { ad: 'Düzenleyerek kullan', sinif: 'ed' },
};

const gorunenler = computed(() => oturumlar.value.filter((o) => arsivGoster.value || !o.arsiv));
const ogeler = computed(() => {
  const l = oturum.value?.ogeler || [];
  return [...l.filter((x) => x.tur === 'nesne'), ...l.filter((x) => x.tur === 'ses')];
});
const karar = computed(() => ogeler.value.filter((x) => x.karar).length);
const yuzde = computed(() => (ogeler.value.length ? Math.round((karar.value / ogeler.value.length) * 100) : 0));
const cur = computed(() => ogeler.value[aktif.value]);
const tamam = computed(() => ogeler.value.length > 0 && karar.value === ogeler.value.length);
const bekleyenSayi = (o) => o.nesne.toplam + o.ses.toplam - o.nesne.karar - o.ses.karar;

async function yukleListe() {
  try {
    oturumlar.value = await api.onayListe();
    if (!props.id) {
      const ilk = oturumlar.value.find((o) => !o.arsiv && o.durum === 'bekliyor') || oturumlar.value.find((o) => !o.arsiv);
      if (ilk) router.replace(`/onay/${ilk.id}`);
    }
  } catch (e) {
    toastError(e);
  }
}

async function yukleOturum(ilk = false) {
  if (!props.id) { oturum.value = null; return; }
  try {
    const o = await api.onay(props.id);
    oturum.value = o;
    if (ilk) aktif.value = Math.max(0, ogeler.value.findIndex((x) => !x.karar));
    for (const x of o.ogeler) if (notlar.value[x.id] === undefined) notlar.value[x.id] = x.not || '';
    for (const x of o.ogeler) {
      if (x.tur === 'nesne' && x.ref && !assets.value[x.ref]) {
        fetch(`/api/library/${x.ref}`).then((r) => (r.ok ? r.json() : null)).then((a) => { if (a) assets.value = { ...assets.value, [x.ref]: a }; }).catch(() => {});
      }
    }
  } catch (e) {
    oturum.value = null;
    toastError(e);
  }
}

onMounted(() => { yukleListe(); yukleOturum(true); });
watch(() => props.id, () => { notlar.value = {}; durdur(); yukleOturum(true); });
useLive((e) => {
  if (e.kind === 'library') { assets.value = {}; yukleOturum(); }
  if (e.kind !== 'onay') return;
  yukleListe();
  if (e.id === props.id) yukleOturum();
});

async function ver(x, k) {
  try {
    const not = notlar.value[x.id];
    oturum.value = await api.onayKarar(props.id, x.id, { karar: k, ...(not !== undefined && not !== (x.not || '') ? { not } : {}) });
    if (mod.value === 'sirayla' && k !== 'duzenle') ilerle();
  } catch (e) {
    toastError(e);
  }
}
async function notKaydet(x) {
  const not = notlar.value[x.id] ?? '';
  if (not === (x.not || '')) return;
  try { oturum.value = await api.onayKarar(props.id, x.id, { not }); } catch (e) { toastError(e); }
}
async function geriAl(x) {
  try { oturum.value = await api.onayKarar(props.id, x.id, { karar: null }); } catch (e) { toastError(e); }
}
async function toplu(k, tur) {
  try {
    oturum.value = await api.onayToplu(props.id, { karar: k, tur });
    toast('Bekleyenler işaretlendi', 'ok');
  } catch (e) { toastError(e); }
}
async function arsivle(o, v) {
  try { await api.onayArsiv(o.id, v); if (v && o.id === props.id) router.replace('/onay'); } catch (e) { toastError(e); }
}
// ---- referans görsel (yapıştır / sürükle / seç)
const yukleniyor = ref('');
const gorselUrl = (x, ad) => `/api/onay/${props.id}/gorsel/${ad}`;
async function gorselYukle(x, dosyalar) {
  const resimler = [...dosyalar].filter((d) => d.type.startsWith('image/'));
  if (!resimler.length) return false;
  yukleniyor.value = x.id;
  try {
    for (const d of resimler) oturum.value = await api.onayGorselEkle(props.id, x.id, d);
    toast('Referans görsel eklendi', 'ok');
  } catch (e) {
    toastError(e);
  } finally {
    yukleniyor.value = '';
  }
  return true;
}
async function gorselSil(x, ad) {
  try { oturum.value = await api.onayGorselSil(props.id, x.id, ad); } catch (e) { toastError(e); }
}
function yapistir(x, e) {
  const dosyalar = [...(e.clipboardData?.files || [])];
  if (dosyalar.some((d) => d.type.startsWith('image/'))) { e.preventDefault(); gorselYukle(x, dosyalar); }
}
function birak(x, e) { gorselYukle(x, e.dataTransfer?.files || []); }
function dosyaSec(x, e) { gorselYukle(x, e.target.files || []); e.target.value = ''; }
const sorgu = (x) => (x.karar === 'kullanma' || x.karar === 'duzenle');
const buyuk = ref('');

function ilerle() {
  const n = ogeler.value.findIndex((x, i) => i > aktif.value && !x.karar);
  if (n >= 0) aktif.value = n;
  else if (aktif.value < ogeler.value.length - 1) aktif.value++;
}
function git(d) { aktif.value = Math.min(ogeler.value.length - 1, Math.max(0, aktif.value + d)); durdur(); }

function sesCal(x) {
  const ayni = caliyor.value === x.id;
  durdur();
  if (ayni) return;
  audio = new Audio(`/api/tts/voices/${x.ref}/audio`);
  audio.onended = () => (caliyor.value = '');
  audio.onerror = () => { caliyor.value = ''; toast('Ses örneği yüklenemedi', 'error'); };
  caliyor.value = x.id;
  audio.play().catch(() => (caliyor.value = ''));
}
function durdur() { if (audio) { audio.pause(); audio = null; } caliyor.value = ''; }
onBeforeUnmount(durdur);

function tus(e) {
  if (mod.value !== 'sirayla' || !cur.value || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === '1') ver(cur.value, 'kullan');
  else if (e.key === '2') ver(cur.value, 'kullanma');
  else if (e.key === '3') ver(cur.value, 'duzenle');
  else if (e.key === 'ArrowRight') git(1);
  else if (e.key === 'ArrowLeft') git(-1);
  else if (e.key === ' ' && cur.value.tur === 'ses') { e.preventDefault(); sesCal(cur.value); }
}
function globalYapistir(e) {
  if (mod.value !== 'sirayla' || !cur.value || e.target.closest?.('.satir')) return;
  if (e.target.tagName === 'TEXTAREA') return; // metin kutusunun kendi @paste'i çalışır
  yapistir(cur.value, e);
}
onMounted(() => { window.addEventListener('keydown', tus); window.addEventListener('paste', globalYapistir); });
onBeforeUnmount(() => { window.removeEventListener('keydown', tus); window.removeEventListener('paste', globalYapistir); });

const tarih = (s) => (s ? new Date(s).toLocaleString('tr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
</script>

<template>
  <div class="onay">
    <aside class="side">
      <div class="side-h">
        <b>Video oturumları</b>
        <label class="muted sm"><input v-model="arsivGoster" type="checkbox" /> arşiv</label>
      </div>
      <div v-if="!gorunenler.length" class="muted pad">Bekleyen onay yok. Claude bir video için aday listesi hazırlayınca burada görünür.</div>
      <div v-for="o in gorunenler" :key="o.id" class="oturum" :class="{ on: o.id === id, arsiv: o.arsiv }" @click="router.push(`/onay/${o.id}`)">
        <div class="ot-ad">{{ o.baslik }}</div>
        <div class="ot-alt">
          <span :class="['dot', o.durum === 'tamam' ? 'ok' : 'wait']"></span>
          {{ o.durum === 'tamam' ? 'Onaylandı' : `${bekleyenSayi(o)} bekliyor` }}
          · {{ o.nesne.karar }}/{{ o.nesne.toplam }} nesne · {{ o.ses.karar }}/{{ o.ses.toplam }} ses
        </div>
        <div class="muted sm">{{ tarih(o.guncelleme) }}</div>
        <button class="lnk" @click.stop="arsivle(o, !o.arsiv)">{{ o.arsiv ? 'Geri al' : 'Arşivle' }}</button>
      </div>
    </aside>

    <section class="main">
      <div v-if="!oturum" class="bospanel">
        <h2>Onay Kuyruğu</h2>
        <p class="muted">Claude yeni bir video üretirken kullanacağı nesne ve sesleri önce buraya koyar; sen sırayla onaylarsın, sonra üretim kaldığı yerden devam eder.</p>
      </div>

      <template v-else>
        <header class="head">
          <div>
            <h2>{{ oturum.baslik }}</h2>
            <div class="muted sm">{{ karar }} / {{ ogeler.length }} karar · <code>{{ oturum.id }}</code></div>
          </div>
          <div class="seg">
            <button :class="{ on: mod === 'sirayla' }" @click="mod = 'sirayla'">Sırayla</button>
            <button :class="{ on: mod === 'liste' }" @click="mod = 'liste'">Tüm liste</button>
          </div>
        </header>
        <div class="bar"><i :style="{ width: yuzde + '%' }"></i></div>

        <div v-if="tamam" class="bitti">
          <b>✓ Tüm kararlar verildi.</b>
          Claude bu kararlarla video üretimine devam ediyor; ek bir şey yazman gerekmiyor.
          <span class="muted"> ({{ ogeler.filter((x) => x.karar === 'kullan').length }} kullan · {{ ogeler.filter((x) => x.karar === 'duzenle').length }} düzenle · {{ ogeler.filter((x) => x.karar === 'kullanma').length }} kullanma)</span>
        </div>

        <!-- sırayla -->
        <div v-if="mod === 'sirayla' && cur" class="wiz">
          <div class="adimlar">
            <button v-for="(x, i) in ogeler" :key="x.id" class="adim" :class="[x.karar || 'bekle', { on: i === aktif }]" :title="x.ad" @click="aktif = i; durdur()">{{ x.tur === 'ses' ? '♪' : i + 1 }}</button>
          </div>

          <div class="kart">
            <div class="onizleme">
              <template v-if="cur.tur === 'nesne'">
                <ParticlePreview v-if="assets[cur.ref]?.type === 'particles'" :key="cur.id" :item="assets[cur.ref]" animate />
                <ArrowPreview v-else-if="assets[cur.ref]?.type === 'arrow'" :key="cur.id" :item="assets[cur.ref]" animate />
                <AssetCanvas v-else-if="assets[cur.ref]" :key="cur.id" :asset="assets[cur.ref]" animate />
                <div v-else class="muted">Önizleme yok</div>
              </template>
              <div v-else class="sesk">
                <button class="play" :class="{ on: caliyor === cur.id }" @click="sesCal(cur)">{{ caliyor === cur.id ? '■' : '▶' }}</button>
                <div class="muted sm">Ses örneğini dinle (Boşluk)</div>
              </div>
            </div>

            <div class="bilgi">
              <div class="row wrap">
                <span class="chip">{{ cur.tur === 'ses' ? 'Ses' : 'Nesne' }} · {{ aktif + 1 }}/{{ ogeler.length }}</span>
                <span v-if="cur.yeni" class="chip ok">yeni üretildi</span>
                <span v-if="cur.kategori" class="chip">{{ cur.kategori }}</span>
                <span v-if="cur.cinsiyet" class="chip">{{ cur.cinsiyet }}</span>
                <span v-for="e in cur.etiketler || []" :key="e" class="chip">{{ e }}</span>
              </div>
              <h3>{{ cur.ad }}</h3>
              <p v-if="cur.aciklama" class="muted">{{ cur.aciklama }}</p>
              <dl>
                <dt>Nerede kullanılacak</dt><dd>{{ cur.nerede || '—' }}</dd>
                <dt>Ne amaçla</dt><dd>{{ cur.amac || '—' }}</dd>
              </dl>
              <div class="aciklama" :class="{ vurgu: sorgu(cur) }">
                <div class="ac-baslik">{{ sorgu(cur) ? 'Nasıl bir model istiyorsun? Açıklama yaz, referans görsel ekle — Claude bunlara göre yeni model üretir.' : 'Not (isteğe bağlı)' }}</div>
                <textarea v-model="notlar[cur.id]" class="input" rows="3" placeholder="Ör: Daha yuvarlak olsun, krater sayısı az, kenarı kalın çizgili… Görseli Ctrl+V ile yapıştırabilirsin." @blur="notKaydet(cur)" @paste="yapistir(cur, $event)"></textarea>
                <div class="gorsel-alan" @dragover.prevent @drop.prevent="birak(cur, $event)">
                  <div v-for="g in cur.gorseller || []" :key="g" class="gorsel">
                    <img :src="gorselUrl(cur, g)" alt="referans" @click="buyuk = gorselUrl(cur, g)" />
                    <button class="gx" title="Kaldır" @click="gorselSil(cur, g)">×</button>
                  </div>
                  <label class="ekle">
                    <input type="file" accept="image/*" multiple hidden @change="dosyaSec(cur, $event)" />
                    <b>{{ yukleniyor === cur.id ? 'Yükleniyor…' : '＋ Referans görsel' }}</b>
                    <span class="muted sm">Ctrl+V ile yapıştır, sürükle ya da seç</span>
                  </label>
                </div>
              </div>

              <div class="btns">
                <button class="b ok" :class="{ sel: cur.karar === 'kullan' }" @click="ver(cur, 'kullan')"><kbd>1</kbd> Kullan</button>
                <button class="b ed" :class="{ sel: cur.karar === 'duzenle' }" @click="ver(cur, 'duzenle')"><kbd>3</kbd> Düzenleyerek kullan</button>
                <button class="b no" :class="{ sel: cur.karar === 'kullanma' }" @click="ver(cur, 'kullanma')"><kbd>2</kbd> Kullanma</button>
              </div>

              <div v-if="cur.karar === 'duzenle'" class="duzen">
                <template v-if="cur.tur === 'nesne'">
                  <span v-if="cur.duzenlendi" class="muted sm">✓ Claude düzenledi ve kütüphanedeki modelin üzerine yazdı.</span>
                  <span v-else class="muted sm">Yukarıya ne değişeceğini yaz (açıklama + referans görsel); diğer ögeleri de kararlaştır. Claude düzenlemeyi kendisi yapıp kütüphanedeki modelin üzerine yazar — senden ek bir şey beklenmez.</span>
                  <a class="btn" :href="`/library?ac=${cur.ref}`" target="_blank">Modeli gör ↗</a>
                </template>
                <span v-else class="muted sm">Notuna ne istediğini yaz (ör. “daha yavaş / daha genç”); Claude alternatif seçer.</span>
              </div>

              <div class="gez row">
                <button class="btn" :disabled="aktif === 0" @click="git(-1)">← Önceki</button>
                <button v-if="cur.karar" class="lnk" @click="geriAl(cur)">kararı sil</button>
                <span style="flex: 1"></span>
                <button class="btn" :disabled="aktif === ogeler.length - 1" @click="git(1)">Sonraki →</button>
              </div>
            </div>
          </div>
        </div>

        <!-- tüm liste -->
        <div v-else-if="mod === 'liste'" class="liste">
          <div class="row toplu">
            <span class="muted sm">Bekleyenlere toplu:</span>
            <button class="btn" @click="toplu('kullan')">Hepsini kullan</button>
            <button class="btn" @click="toplu('kullan', 'nesne')">Nesneleri kullan</button>
            <button class="btn" @click="toplu('kullan', 'ses')">Sesleri kullan</button>
          </div>
          <template v-for="tur in ['nesne', 'ses']" :key="tur">
            <h4 v-if="ogeler.some((x) => x.tur === tur)">{{ tur === 'nesne' ? 'Nesneler' : 'Sesler' }}</h4>
            <div v-for="x in ogeler.filter((y) => y.tur === tur)" :key="x.id" class="satir" :class="x.karar || 'bekle'">
              <div class="mini" @click="aktif = ogeler.indexOf(x); mod = 'sirayla'">
                <template v-if="x.tur === 'nesne' && assets[x.ref]">
                  <ParticlePreview v-if="assets[x.ref].type === 'particles'" :item="assets[x.ref]" />
                  <ArrowPreview v-else-if="assets[x.ref].type === 'arrow'" :item="assets[x.ref]" />
                  <AssetCanvas v-else :asset="assets[x.ref]" />
                </template>
                <button v-else-if="x.tur === 'ses'" class="play sm" :class="{ on: caliyor === x.id }" @click.stop="sesCal(x)">{{ caliyor === x.id ? '■' : '▶' }}</button>
              </div>
              <div class="txt">
                <div><b>{{ x.ad }}</b> <span v-if="x.yeni" class="chip ok">yeni</span> <span v-if="x.kategori" class="chip">{{ x.kategori }}</span></div>
                <div class="sm"><span class="muted">Nerede:</span> {{ x.nerede }} <span class="muted">· Amaç:</span> {{ x.amac }}</div>
                <input v-model="notlar[x.id]" class="input sm-in" :placeholder="sorgu(x) ? 'Nasıl bir model istiyorsun? (görseli buraya yapıştırabilirsin)' : 'not'" @blur="notKaydet(x)" @paste="yapistir(x, $event)" />
                <div class="gorsel-sira">
                  <div v-for="g in x.gorseller || []" :key="g" class="gorsel kucuk">
                    <img :src="gorselUrl(x, g)" alt="referans" @click="buyuk = gorselUrl(x, g)" />
                    <button class="gx" @click="gorselSil(x, g)">×</button>
                  </div>
                  <label class="ekle kucuk" title="Referans görsel ekle"><input type="file" accept="image/*" multiple hidden @change="dosyaSec(x, $event)" />📎 görsel</label>
                </div>
              </div>
              <div class="kb">
                <button v-for="(m, k) in KARAR" :key="k" class="b mini-b" :class="[m.sinif, { sel: x.karar === k }]" @click="ver(x, k)">{{ m.ad }}</button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </section>
    <div v-if="buyuk" class="lightbox" @click="buyuk = ''"><img :src="buyuk" alt="referans" /></div>
  </div>
</template>

<style scoped>
.onay { display: grid; grid-template-columns: 280px 1fr; height: 100%; min-height: 0; }
.side { border-right: 1px solid var(--line); overflow: auto; background: var(--bg-2); }
.side-h { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); }
.pad { padding: 14px; }
.sm { font-size: 12px; }
.oturum { padding: 10px 14px 26px; border-bottom: 1px solid var(--line); cursor: pointer; position: relative; }
.oturum:hover { background: var(--panel); }
.oturum.on { background: var(--panel-2); box-shadow: inset 3px 0 var(--accent); }
.oturum.arsiv { opacity: .55; }
.ot-ad { font-weight: 600; }
.ot-alt { font-size: 12px; color: var(--text-2); margin: 2px 0; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
.dot.ok { background: var(--ok); }
.dot.wait { background: var(--warn); }
.lnk { background: none; border: 0; color: var(--text-3); cursor: pointer; font-size: 12px; padding: 0; text-decoration: underline; }
.oturum .lnk { position: absolute; right: 12px; bottom: 8px; }
.main { overflow: auto; padding: 20px 28px 40px; min-width: 0; }
.bospanel { max-width: 520px; margin: 80px auto; text-align: center; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.head h2 { margin: 0 0 2px; }
.bar { height: 6px; background: var(--panel-2); border-radius: 4px; margin: 12px 0 16px; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); transition: width .25s; }
.seg { display: flex; border: 1px solid var(--line-2); border-radius: var(--radius); overflow: hidden; }
.seg button { background: var(--panel); color: var(--text-2); border: 0; padding: 7px 14px; cursor: pointer; }
.seg button.on { background: var(--accent); color: var(--accent-ink); font-weight: 600; }
.bitti { background: #16261b; border: 1px solid #2c5a3b; border-radius: var(--radius); padding: 10px 14px; margin-bottom: 16px; }
.adimlar { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 16px; }
.adim { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--line-2); background: var(--panel); color: var(--text-2); cursor: pointer; font-size: 12px; }
.adim.kullan { background: #1d3a29; border-color: #2c5a3b; color: var(--ok); }
.adim.kullanma { background: #3a1d1f; border-color: #6b2a2d; color: #f08488; }
.adim.duzenle { background: #3a2f16; border-color: #6b5520; color: var(--warn); }
.adim.on { outline: 2px solid var(--accent); outline-offset: 1px; }
.kart { display: grid; grid-template-columns: minmax(260px, 420px) 1fr; gap: 24px; align-items: start; }
@media (max-width: 900px) { .kart { grid-template-columns: 1fr; } .onay { grid-template-columns: 1fr; } }
.onizleme { aspect-ratio: 1; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; display: grid; place-items: center; overflow: hidden; position: relative; }
.onizleme > :deep(div), .mini > :deep(div) { width: 100%; height: 100%; }
.sesk { display: grid; justify-items: center; gap: 10px; }
.play { width: 84px; height: 84px; border-radius: 50%; border: 0; background: var(--accent); color: var(--accent-ink); font-size: 30px; cursor: pointer; }
.play.on { background: var(--accent-2); }
.play.sm { width: 40px; height: 40px; font-size: 14px; }
.bilgi h3 { margin: 10px 0 4px; font-size: 22px; }
.row.wrap { flex-wrap: wrap; gap: 6px; }
dl { display: grid; grid-template-columns: 150px 1fr; gap: 6px 12px; margin: 14px 0; }
dt { color: var(--text-3); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; padding-top: 2px; }
dd { margin: 0; line-height: 1.45; }
.btns { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; }
.b { border: 1px solid var(--line-2); background: var(--panel-2); color: var(--text); border-radius: var(--radius); padding: 11px 18px; font-size: 15px; cursor: pointer; font-weight: 600; }
.b kbd { opacity: .5; font-size: 11px; margin-right: 4px; }
.b.ok:hover, .b.ok.sel { background: #1d3a29; border-color: var(--ok); color: var(--ok); }
.b.no:hover, .b.no.sel { background: #3a1d1f; border-color: var(--danger); color: #f08488; }
.b.ed:hover, .b.ed.sel { background: #3a2f16; border-color: var(--warn); color: var(--warn); }
.duzen { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; background: var(--panel); border: 1px dashed #6b5520; border-radius: var(--radius); padding: 10px 12px; }
.gez { margin-top: 18px; }
.liste h4 { margin: 18px 0 8px; color: var(--text-2); }
.toplu { margin: 4px 0; flex-wrap: wrap; }
.satir { display: grid; grid-template-columns: 76px 1fr auto; gap: 14px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-left-width: 4px; border-radius: var(--radius); margin-bottom: 6px; background: var(--panel); }
.satir.kullan { border-left-color: var(--ok); }
.satir.kullanma { border-left-color: var(--danger); }
.satir.duzenle { border-left-color: var(--warn); }
.mini { width: 76px; height: 64px; position: relative; cursor: pointer; display: grid; place-items: center; }
.txt { min-width: 0; display: grid; gap: 3px; }
.sm-in { padding: 4px 8px; font-size: 12px; }
.kb { display: flex; gap: 5px; }
.aciklama { margin: 4px 0 0; }
.aciklama.vurgu { background: #3a2f16; border: 1px solid #6b5520; border-radius: var(--radius); padding: 10px 12px; }
.ac-baslik { font-size: 12px; color: var(--text-2); margin-bottom: 6px; }
.aciklama.vurgu .ac-baslik { color: var(--warn); font-weight: 600; }
.gorsel-alan, .gorsel-sira { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; align-items: center; }
.gorsel { position: relative; width: 96px; height: 96px; border: 1px solid var(--line-2); border-radius: 8px; overflow: hidden; background: #fff; }
.gorsel.kucuk { width: 52px; height: 52px; }
.gorsel img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; }
.gx { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; border: 0; background: rgba(0, 0, 0, .65); color: #fff; cursor: pointer; line-height: 1; padding: 0; }
.ekle { display: grid; gap: 2px; place-items: center; text-align: center; min-width: 150px; min-height: 96px; border: 1px dashed var(--line-2); border-radius: 8px; padding: 8px 12px; cursor: pointer; color: var(--text-2); }
.ekle:hover { border-color: var(--accent); color: var(--text); }
.ekle.kucuk { min-width: 0; min-height: 0; padding: 4px 10px; font-size: 12px; display: inline-flex; }
.lightbox { position: fixed; inset: 0; background: rgba(0, 0, 0, .8); display: grid; place-items: center; z-index: 50; cursor: zoom-out; }
.lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 10px; background: #fff; }
.mini-b { padding: 6px 10px; font-size: 12px; }
</style>
