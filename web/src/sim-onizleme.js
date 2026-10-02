// Simülasyon önizleme sayfası (iframe içinde açılır): /sim-onizleme.html?slug=<slug>
// Simülasyonun giriş bileşenini data/simulations/<slug>/kaynak altından yükler; ortak kabuk bağımlılıkları vite.config.js'teki sim-resolver ile çözülür.
import { createApp, h, defineAsyncComponent, markRaw } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import './sim-onizleme.css';
import { createKontrol } from './sim-kontrol.js';

const qs = new URLSearchParams(location.search);
const slug = qs.get('slug') || '';
// Video modu (?video=1): ayar panelleri gizli, kendi animasyon döngüsü yok; kareyi Origami Studio JSON zaman çizelgesiyle sürer.
// Bayrak, simülasyon modülleri yüklenmeden önce kurulmalı (useSimulationScene / useSimKontrol modül düzeyinde okur).
if (qs.get('video') === '1') {
  window.__simVideo = true;
  window.__simKontrol = createKontrol();
  document.documentElement.classList.add('sim-video');
}
const modules = import.meta.glob('../../data/simulations/*/kaynak/src/views/simulation/**/*.vue');

const Err = (msg) => ({ render: () => h('div', { class: 'sim-onizleme-hata' }, msg) });

async function boot() {
  let comp;
  try {
    const sim = await fetch(`/api/simulations/${encodeURIComponent(slug)}`).then((r) => r.json());
    const loader = modules[`../../data/simulations/${slug}/kaynak/${sim.entry}`];
    comp = loader
      ? markRaw(defineAsyncComponent({ loader, onError: (e) => console.error(e) }))
      : Err(`Önizleme girişi bulunamadı: ${sim.entry || '(yok)'}`);
  } catch (e) {
    comp = Err(String(e?.message || e));
  }
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: comp }] });
  const app = createApp({ render: () => h('div', { style: 'position:fixed;inset:0' }, [h(comp, { style: 'width:100%;height:100%' })]) });
  app.config.errorHandler = (e) => console.error('[önizleme]', e);
  app.use(router).mount('#app');
}
boot();
