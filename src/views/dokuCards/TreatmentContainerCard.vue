<template>
  <DodoContainerCard title="Aufgaben" card-in-card>

    <TreatmentMedicationsCard v-show="ctx.requireSaamed" />
    <TreatmentTasksCard />
    <TreatmentRedflagsCard v-show="ctx.requireRedflags" />

  </DodoContainerCard>
</template>

<script setup lang="ts">

import TreatmentRedflagsCard from './treatmentCards/TreatmentRedflagsCard.vue'
import TreatmentMedicationsCard from './treatmentCards/TreatmentMedicationsCard.vue'
import TreatmentTasksCard from './treatmentCards/TreatmentTasksCard.vue'

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
