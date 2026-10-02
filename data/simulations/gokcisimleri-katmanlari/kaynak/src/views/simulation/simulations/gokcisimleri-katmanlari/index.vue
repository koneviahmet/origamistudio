<script setup>
import SimulationShell from '../../SimulationShell.vue'
import GokcisimleriKatmanlariScene from '../gokcisimleri-katmanlari.vue'
import { gokcisimleriKatmanlariConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <GokcisimleriKatmanlariScene :config="gokcisimleriKatmanlariConfig" />
  </SimulationShell>
</template>
