<script setup>
import SimulationShell from '../../SimulationShell.vue'
import ArsimetPrensibiScene from '../arsimet-prensibi.vue'
import { arsimetPrensibiConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <ArsimetPrensibiScene :config="arsimetPrensibiConfig" />
  </SimulationShell>
</template>
