<script setup>
import SimulationShell from '../../SimulationShell.vue'
import AtomTarihselScene from '../atom-modelinin-tarihsel-gelisimi.vue'
import { atomTarihselGelisimiConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <AtomTarihselScene :config="atomTarihselGelisimiConfig" />
  </SimulationShell>
</template>
