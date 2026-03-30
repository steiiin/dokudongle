<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Aufgaben</IonCardTitle>
    </IonCardHeader>
    <IonCardContent class="card-in-card">

      <TreatmentTasksCard />
      <TreatmentMedicationsCard />
      <TreatmentRedflagsCard v-show="ctx.requireRedflags" />

    </IonCardContent>
  </IonCard>
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
