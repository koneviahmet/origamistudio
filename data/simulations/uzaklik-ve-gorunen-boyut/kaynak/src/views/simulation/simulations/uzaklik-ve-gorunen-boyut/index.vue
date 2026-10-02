<script setup>
import SimulationShell from '../../SimulationShell.vue'
import UzaklikVeGorunenBoyutScene from '../uzaklik-ve-gorunen-boyut.vue'
import { uzaklikVeGorunenBoyutConfig } from './config.js'
</script>

<template>
  <SimulationShell>
    <UzaklikVeGorunenBoyutScene :config="uzaklikVeGorunenBoyutConfig" />
  </SimulationShell>
</template>
