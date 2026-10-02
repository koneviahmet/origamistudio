<script setup>
import SimulationShell from '../../SimulationShell.vue'
import GunesSistemiScene from '../gunes-sistemi.vue'
import { gunesSistemiConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <GunesSistemiScene :config="gunesSistemiConfig" />
  </SimulationShell>
</template>
