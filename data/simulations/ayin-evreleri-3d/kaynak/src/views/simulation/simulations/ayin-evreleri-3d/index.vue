<script setup>
import SimulationShell from '../../SimulationShell.vue'
import AyinEvreleri3dScene from '../ayin-evreleri-3d.vue'
import { ayinEvreleri3dConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <AyinEvreleri3dScene :config="ayinEvreleri3dConfig" />
  </SimulationShell>
</template>
