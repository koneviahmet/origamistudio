<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { toasts } from './toast.js';

const route = useRoute();
const inStudio = computed(() => route.path.startsWith('/studio'));
</script>

<template>
  <header v-if="!inStudio" class="topbar">
    <div class="brand">
      <svg viewBox="0 0 32 32"><path d="M16 2 30 16 16 16Z" fill="#ea7a3b" /><path d="M16 2 2 16 16 16Z" fill="#f5a36b" /><path d="M2 16 16 30 16 16Z" fill="#c95c26" /><path d="M30 16 16 30 16 16Z" fill="#e8763a" /></svg>
      Origami Studio
    </div>
    <nav class="nav row">
      <RouterLink to="/">Projeler</RouterLink>
      <RouterLink to="/onay">Onay</RouterLink>
      <RouterLink to="/sablonlar">Şablonlar</RouterLink>
      <RouterLink to="/simulasyonlar">Simülasyonlar</RouterLink>
      <RouterLink to="/bilesenler">Bileşenler</RouterLink>
      <RouterLink to="/karakterler">Karakterler</RouterLink>
      <RouterLink to="/library">Kütüphane</RouterLink>
      <RouterLink to="/ses">Ses</RouterLink>
      <RouterLink to="/muzik">Müzik</RouterLink>
      <RouterLink to="/design" :class="{ 'router-link-exact-active': route.path.startsWith('/design') }">Tasarım</RouterLink>
    </nav>
  </header>
  <main :class="inStudio ? 'studio-root' : 'page'">
    <RouterView />
  </main>
  <div class="toast-wrap">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">{{ t.text }}</div>
  </div>
</template>

<style>
.studio-root { height: 100%; }
</style>
