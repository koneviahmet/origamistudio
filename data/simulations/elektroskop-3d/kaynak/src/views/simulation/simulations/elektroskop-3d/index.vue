<script setup>
import SimulationShell from '../../SimulationShell.vue'
import Elektroskop3dScene from '../elektroskop-3d.vue'
import { elektroskop3dConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <Elektroskop3dScene :config="elektroskop3dConfig" />
  </SimulationShell>
</template>
