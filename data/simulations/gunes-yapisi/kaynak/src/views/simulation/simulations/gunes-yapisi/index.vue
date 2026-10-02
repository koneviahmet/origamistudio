<script setup>
import SimulationShell from '../../SimulationShell.vue'
import GunesYapisiScene from '../gunes-yapisi.vue'
import { gunesYapisiConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <GunesYapisiScene :config="gunesYapisiConfig" />
  </SimulationShell>
</template>
