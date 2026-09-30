import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import ProjectsView from './views/ProjectsView.vue';
import LibraryView from './views/LibraryView.vue';
import StudioView from './views/StudioView.vue';
import DesignView from './views/DesignView.vue';
import './style.css';
import { loadResources } from './resources.js';

loadResources();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ProjectsView },
    { path: '/library', component: LibraryView },
    { path: '/studio/:id', component: StudioView, props: true },
    { path: '/design/:tab?', component: DesignView },
  ],
});

createApp(App).use(router).mount('#app');
