<script setup>
import SimulationShell from '../../SimulationShell.vue'
import GunesDunyaAyScene from '../gunes-dunya-ay.vue'
import { gunesDunyaAyConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <GunesDunyaAyScene :config="gunesDunyaAyConfig" />
  </SimulationShell>
</template>
