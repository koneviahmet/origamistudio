<script setup>
import SimulationShell from '../../SimulationShell.vue'
import TarihiSahislarScene from '../tarihi-sahislar.vue'
import { tarihiSahislarConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <TarihiSahislarScene :config="tarihiSahislarConfig" />
  </SimulationShell>
</template>
