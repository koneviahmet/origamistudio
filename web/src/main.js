import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import ProjectsView from './views/ProjectsView.vue';
import LibraryView from './views/LibraryView.vue';
import StudioView from './views/StudioView.vue';
import DesignView from './views/DesignView.vue';
import RenderView from './views/RenderView.vue';
import TtsView from './views/TtsView.vue';
import MuzikView from './views/MuzikView.vue';
import ApprovalView from './views/ApprovalView.vue';
import TemplatesView from './views/TemplatesView.vue';
import ComponentsView from './views/ComponentsView.vue';
import CharactersView from './views/CharactersView.vue';
import SimulationsView from './views/SimulationsView.vue';
import './style.css';
import { loadResources } from './resources.js';

loadResources();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ProjectsView },
    { path: '/library/:category?/:id?', component: LibraryView },
    { path: '/onay/:id?', component: ApprovalView, props: true },
    { path: '/sablonlar', component: TemplatesView },
    { path: '/simulasyonlar/:slug?', component: SimulationsView, props: true },
    { path: '/bilesenler', component: ComponentsView },
    { path: '/karakterler', component: CharactersView },
    { path: '/studio/:id', component: StudioView, props: true },
    { path: '/design/:tab?', component: DesignView },
    { path: '/ses', component: TtsView },
    { path: '/muzik', component: MuzikView },
    { path: '/render/:id', component: RenderView },
  ],
});

createApp(App).use(router).mount('#app');
